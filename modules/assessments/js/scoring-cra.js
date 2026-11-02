/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-cra.js
 *
 * EU Cyber Resilience Act (CRA) gap assessment - a LAYERED conformance
 * instrument that reuses the csms-conformance family scorer.
 *
 * The CRA content is organised into three layers:
 *   P1  Annex I Part I  - product requirements (per product)
 *   P2  Annex I Part II - vulnerability handling (organisation)
 *   P3  Conformity & obligations (declaration, CE, route, reporting)
 *
 * Each layer rolls up INDEPENDENTLY: we call ScoringCSMS.scoreSite once per
 * in-scope layer against a synthetic single-"category" csms instrument built
 * from that layer's items. The three positions are returned side by side and
 * are NEVER blended into one CRA score - e.g. strong product security with no
 * conformity work is not "partial CRA-readiness"; missing conformity is a hard
 * blocker to market placement, not a shortfall to average away.
 *
 * The setup phase (which layers are in scope, product class, product name)
 * comes from the engine (assessment.craSetup). Out-of-scope layers are not
 * scored and absent from the result - distinct from an in-scope item left
 * unanswered.
 *
 * layerInterlock: if the conformity layer (P3) is assessed without the two
 * technical layers (P1/P2), the conformity claim rests on requirements those
 * layers cover, so we raise a flag that P3 alone is a paperwork check.
 */
window.App = window.App || {};
window.App.ScoringCRA = (function () {
  "use strict";

  function isCRA(instrument) {
    return !!(instrument && instrument.layers && instrument.layers.length && instrument.setup);
  }

  // ---- product classification -------------------------------------------
  // The consultant SETS the product class directly (they choose it); the Annex
  // III / IV category lookup is an optional AID that suggests a class from a
  // match. The chosen class drives the P3 conformity route. Class list and
  // routes have inline fallbacks so classification works even if the shared
  // lookup file (window.App.Data.shared.craProductClassification) is absent.
  var CLASSES = [
    { id: "default", label: "Default (self-assessment)" },
    { id: "important-class-i", label: "Important - Class I (Annex III)" },
    { id: "important-class-ii", label: "Important - Class II (Annex III)" },
    { id: "critical", label: "Critical (Annex IV)" }
  ];
  var FALLBACK_ROUTES = {
    "default": "Internal control (Annex VIII, Module A): manufacturer self-assessment; no notified body required.",
    "important-class-i": "Self-assessment via internal control (Module A) is permitted only if a relevant harmonised standard, common specification or European cybersecurity certification scheme is applied in full; otherwise a notified-body route (EU-type examination Module B + Module C, or full quality assurance Module H).",
    "important-class-ii": "Notified-body route required: EU-type examination (Module B) + conformity to type (Module C), or full quality assurance (Module H). Self-assessment is not available.",
    "critical": "As Class II (notified-body route), and may also require a European cybersecurity certificate under an EU scheme where a delegated act so specifies."
  };
  var GROUP_LABELS = {
    "annex-iii-class-i": "Annex III - Class I (Important)",
    "annex-iii-class-ii": "Annex III - Class II (Important)",
    "annex-iv": "Annex IV (Critical)"
  };
  // The classification lookup is PER INSTRUMENT: the setup's classification
  // entry names its lookup via `lookupKey` (e.g. "machineryClassification");
  // absent that, the CRA lookup is the default so eu-cra needs no data change.
  function classificationLookup(instrument) {
    var shared = (window.App.Data && window.App.Data.shared) || {};
    if (instrument && instrument.setup) {
      var spec = (instrument.setup || []).filter(function (s) { return s.type === "classification-lookup"; })[0];
      if (spec && spec.lookupKey && shared[spec.lookupKey]) return shared[spec.lookupKey];
    }
    return shared.craProductClassification || null;
  }
  function classes(instrument) {
    var lk = classificationLookup(instrument);
    if (lk && lk.classes && lk.classes.length) return lk.classes.slice();
    return CLASSES.slice();
  }
  function classLabel(id, instrument) {
    var lk = classificationLookup(instrument);
    if (lk && lk.classes) {
      for (var j = 0; j < lk.classes.length; j++) if (lk.classes[j].id === id) return lk.classes[j].label;
      if (!id && lk.classes.length) return lk.classes[0].label;
    }
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i].id === id) return CLASSES[i].label;
    return id || "Default (self-assessment)";
  }
  function groupLabel(id, instrument) {
    var lk = classificationLookup(instrument);
    if (lk && lk.groupLabels && lk.groupLabels[id]) return lk.groupLabels[id];
    return GROUP_LABELS[id] || id;
  }
  // A selected category is stored as "groupId:categoryId"; "" = no category.
  function parseCategoryKey(key) {
    key = key || "";
    var i = key.indexOf(":");
    if (i === -1) return { groupId: "", categoryId: "" };
    return { groupId: key.slice(0, i), categoryId: key.slice(i + 1) };
  }
  function routeFor(classId, instrument) {
    var lk = classificationLookup(instrument);
    return (lk && lk.routeByClass && lk.routeByClass[classId]) || FALLBACK_ROUTES[classId] || "";
  }
  // Class the AID suggests from a matched category ("" if none matched).
  function suggestedFromCategory(setup, instrument) {
    var lk = classificationLookup(instrument);
    var sel = parseCategoryKey(setup && setup.productCategory);
    if (!sel.groupId) return "";
    if (lk && lk.deriveClass && lk.deriveClass[sel.groupId]) return lk.deriveClass[sel.groupId];
    if (sel.groupId === "annex-iv") return "critical";
    if (sel.groupId === "annex-iii-class-ii") return "important-class-ii";
    if (sel.groupId === "annex-iii-class-i") return "important-class-i";
    return "";
  }
  function deriveClassification(setup, instrument) {
    var lk = classificationLookup(instrument);
    var chosen = (setup && setup.productClass) || "default";
    var sel = parseCategoryKey(setup && setup.productCategory);
    var categoryText = "";
    if (lk && sel.groupId) {
      var cats = (lk.categories && lk.categories[sel.groupId]) || [];
      var cat = cats.filter(function (c) { return String(c.id) === String(sel.categoryId); })[0];
      categoryText = cat ? cat.text : "";
    }
    var suggested = suggestedFromCategory(setup, instrument);
    // Flag ANY under-classification: the chosen class sits below what the
    // matched category indicates (Default vs Class I/II/Critical, but also e.g.
    // Class I chosen when the category is Annex IV Critical - the higher
    // classification governs). Over-classification is conservative, not flagged.
    // The rank order comes from the lookup's `severity` map when it has one
    // (Machinery Annex I etc.); the CRA order is the fallback.
    var SEVERITY = (lk && lk.severity) || { "default": 0, "important-class-i": 1, "important-class-ii": 2, "critical": 3 };
    var misclassification = !!suggested && (SEVERITY[chosen] || 0) < (SEVERITY[suggested] || 0);
    // The note names the classifying authority: lookups other than the CRA's
    // declare `authorityRef`; without it the CRA wording is preserved exactly.
    var note = "";
    if (misclassification) {
      note = (lk && lk.authorityRef)
        ? "The class is set to " + classLabel(chosen, instrument) + ", but the matched category" + (categoryText ? " (" + categoryText + ")" : "") + " indicates " + classLabel(suggested, instrument) + " under the " + lk.authorityRef + " - the higher classification governs. This changes the required conformity route - confirm the class is correct."
        : "The product class is set to " + classLabel(chosen, instrument) + ", but the matched category" + (categoryText ? " (" + categoryText + ")" : "") + " indicates " + classLabel(suggested, instrument) + " under CRA Annex III/IV - the higher classification governs. This changes the required conformity route and is a common, consequential CRA misclassification - confirm the class is correct.";
    }
    return {
      productCategory: (setup && setup.productCategory) || "",
      groupId: sel.groupId, groupLabel: sel.groupId ? groupLabel(sel.groupId, instrument) : "",
      categoryText: categoryText,
      classId: chosen, classLabel: classLabel(chosen, instrument),
      route: routeFor(chosen, instrument),
      suggestedClassId: suggested, suggestedClassLabel: suggested ? classLabel(suggested, instrument) : "",
      misclassification: misclassification,
      misclassificationNote: note
    };
  }

  // All layer ids declared by the instrument, in author order.
  function allLayerIds(instrument) {
    return (instrument.layers || []).map(function (l) { return l.id; });
  }

  // The default in-scope set (from the layer-select setup entry, else all).
  function defaultLayers(instrument) {
    var s = (instrument.setup || []).filter(function (x) { return x.type === "layer-select"; })[0];
    if (s && s.default && s.default.length) return s.default.slice();
    return allLayerIds(instrument);
  }

  // Build a csms-shaped instrument for ONE layer: its items become a single
  // category's requirements. verbatimText carries the Regulation's own wording
  // where one provision maps to the item; where it is empty - items that span
  // several provisions - the assessor-phrased `requirement` is used instead.
  function syntheticLayerInstrument(instrument, layer, items) {
    return {
      id: instrument.id + ":" + layer.id,
      title: instrument.title + " - " + layer.name,
      framework: instrument.framework,
      edition: instrument.edition,
      contentVersion: instrument.contentVersion,
      framing: layer.summary || "",
      // one category = the layer, so csms byCategory has exactly this layer
      categories: [{ id: layer.id, name: layer.name, summary: layer.summary || "" }],
      elementGroups: [],
      requirements: items.map(function (it) {
        return {
          id: it.id,
          code: it.code,
          title: it.title,
          categoryId: layer.id,
          elementGroupId: null,
          verbatimText: it.verbatimText || it.requirement || "",
          rationale: it.rationale || "",
          hint: it.hint || "",
          otLens: it.otLens || null,
          evidencePrompt: it.evidencePrompt || ""
        };
      })
    };
  }

  // ---- whole target -----------------------------------------------------
  // setup: { layers:[ids], productClass, productName } (engine-supplied).
  function scoreSite(instrument, profile, responses, setup) {
    setup = setup || {};
    var inScope = (setup.layers && setup.layers.length) ? setup.layers.slice() : defaultLayers(instrument);
    // Preserve author order and drop anything not declared.
    var declared = allLayerIds(instrument);
    inScope = declared.filter(function (id) { return inScope.indexOf(id) !== -1; });

    var byId = {};
    (responses || []).forEach(function (r) { byId[r.requirementId || r.itemId] = r; });

    var CSMS = window.App.ScoringCSMS;
    var flatPerItem = [];
    var flatRoadmap = [];

    var layers = (instrument.layers || [])
      .filter(function (l) { return inScope.indexOf(l.id) !== -1; })
      .map(function (l) {
        var items = (instrument.items || []).filter(function (it) { return it.layerId === l.id; });
        var synth = syntheticLayerInstrument(instrument, l, items);
        var layerResponses = items.map(function (it) { return byId[it.id]; }).filter(Boolean);
        var result = CSMS.scoreSite(synth, profile, layerResponses);
        // Tag each scored item with its layer so the flattened views can group.
        result.perItem.forEach(function (pi) { pi.layerId = l.id; pi.layerName = l.name; });
        result.roadmap.forEach(function (pi) { pi.layerId = l.id; pi.layerName = l.name; });
        flatPerItem = flatPerItem.concat(result.perItem);
        flatRoadmap = flatRoadmap.concat(result.roadmap);
        return {
          layerId: l.id,
          name: l.name,
          scope: l.scope || "",
          summary: l.summary || "",
          result: result,       // full csms scoreSite result for this layer
          overall: result.overall
        };
      });

    // Interlock: the conformity layer in scope but a technical layer omitted.
    // Which layers play which role comes from instrument.interlockSpec; the
    // CRA's P3-vs-P1/P2 arrangement is the fallback.
    var ilSpec = instrument.interlockSpec || { conformityLayer: "P3", technicalLayers: ["P1", "P2"] };
    var has = function (id) { return inScope.indexOf(id) !== -1; };
    var missingTech = (ilSpec.technicalLayers || []).filter(function (id) { return !has(id); });
    var interlockTriggered = has(ilSpec.conformityLayer) && missingTech.length > 0;

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      indicative: instrument.indicative !== false,
      layersInScope: inScope,
      layers: layers,                       // in-scope layers, side by side
      interlock: {
        triggered: interlockTriggered,
        missingLayers: missingTech,
        message: instrument.layerInterlock || ""
      },
      criticalCaveats: instrument.criticalCaveats || [],
      scoringNote: instrument.scoringNote || "",
      classification: deriveClassification(setup, instrument),
      productName: setup.productName || "",
      // Flattened views for shared machinery (remediation modal, find, exports).
      perItem: flatPerItem,
      roadmap: flatRoadmap,
      profile: profile
    };
  }

  // Product classification (class/category/name) is PER TARGET (per product);
  // the layers in scope are shared across the assessment. flattenSetup resolves
  // one target's flat setup from either a raw {layers, products:{}} object or a
  // flat setup (back-compat / single-product callers).
  function flattenSetup(raw, targetId) {
    raw = raw || {};
    var layers = raw.layers || [];
    var p = (raw.products && raw.products[targetId]) || null;
    if (!p) {
      // Flat setup, or no per-target entry yet: fall back to any top-level fields.
      p = { productClass: raw.productClass, productCategory: raw.productCategory, productName: raw.productName };
    }
    return {
      layers: layers,
      productClass: p.productClass || "default",
      productCategory: p.productCategory || "",
      productName: p.productName || ""
    };
  }

  // ---- organisation-scoped items -----------------------------------------
  // Part of the CRA is organisational, part is per product: Annex I Part II
  // (all of P2) is the manufacturer's vulnerability-handling process, and a
  // couple of P3 obligations (Art 14 reporting readiness, component due
  // diligence) are likewise one organisational reality. Those answers are
  // shared across products by the engine's setResponse fan-out (and inherited
  // by newly added products); this resolver is the single source of truth for
  // WHICH items that applies to. An item is organisation-scoped when it says
  // `scope: "organisation"` itself or, absent an item scope, when its layer
  // does (all of P2). Everything else is per product.
  function itemScope(instrument, itemOrId) {
    var it = itemOrId;
    if (typeof itemOrId === "string") {
      it = (instrument.items || []).filter(function (x) { return x.id === itemOrId; })[0];
    }
    if (!it) return "product";
    if (it.scope) return it.scope === "organisation" ? "organisation" : "product";
    var layer = (instrument.layers || []).filter(function (l) { return l.id === it.layerId; })[0];
    return (layer && layer.scope === "organisation") ? "organisation" : "product";
  }

  function scoreEngagement(engagement, instrument, profile, rawSetup) {
    var responsesByTarget = {};
    (engagement.responses || []).forEach(function (r) {
      var tid = r.targetId || (engagement.targets[0] && engagement.targets[0].id);
      if (!tid) return;
      (responsesByTarget[tid] = responsesByTarget[tid] || []).push(r);
    });
    return {
      perTarget: (engagement.targets || []).map(function (t) {
        return { target: t, result: scoreSite(instrument, profile, responsesByTarget[t.id] || [], flattenSetup(rawSetup, t.id)) };
      }),
      instrument: instrument,
      profile: profile
    };
  }

  function formatPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Math.round(v * 100) + "%";
  }

  return {
    isCRA: isCRA,
    allLayerIds: allLayerIds,
    defaultLayers: defaultLayers,
    classificationLookup: classificationLookup,
    deriveClassification: deriveClassification,
    classes: classes,
    classLabel: classLabel,
    groupLabel: groupLabel,
    suggestedFromCategory: suggestedFromCategory,
    flattenSetup: flattenSetup,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct,
    itemScope: itemScope
  };
})();
