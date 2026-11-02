/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* compare.js
 *
 * Re-assessment comparison ("Progress since previous assessment").
 *
 * A BASELINE is a snapshot of an earlier engagement's responses for the same
 * instrument, extracted from a previously saved project JSON and stored on the
 * assessment (assessment.baseline). It rides through the existing save/load
 * unchanged, like reportNarrative, so no storage migration is needed.
 *
 * The baseline responses are re-scored against the CURRENT instrument content,
 * targets and profile so both assessments are compared on the same yardstick.
 * The "previous" numbers shown here can therefore differ from the numbers in
 * the earlier report if content or targets changed between the two visits.
 *
 * Everything here is family-generic: each scoring family contributes only
 * (a) its item catalog and (b) how a raw response maps onto an ordered rank.
 * Higher rank is better in every family.
 */
window.App = window.App || {};
window.App.Compare = (function () {
  "use strict";

  // Layered CRA: a csms-conformance instrument whose items live in items[]
  // keyed by layerId (not requirements[]/categoryId). It compares with the
  // same ranked-state logic as csms but needs its own catalog, group names
  // (the layers) and gap counts (the flattened CRA roadmap).
  function isLayeredCRA(instrument) {
    return !!(instrument && instrument.layers && instrument.layers.length && instrument.items);
  }

  // ---- uniform item catalog ---------------------------------------------
  // One entry per comparable item: { id, code, label, groupId }.
  function catalogFor(instrument, family) {
    if (family === "risk-appetite-coherence") {
      return (instrument.items || []).map(function (it) {
        return { id: it.id, code: it.code || it.id, label: it.title, groupId: it.sectionId };
      });
    }
    if (family === "caf-achieved") {
      return (instrument.outcomes || []).map(function (o) {
        return { id: o.id, code: o.id, label: o.title, groupId: o.principleId };
      });
    }
    if (family === "csms-conformance" && isLayeredCRA(instrument)) {
      return (instrument.items || []).map(function (it) {
        return { id: it.id, code: it.code || it.id, label: it.title, groupId: it.layerId };
      });
    }
    if (family === "nis2-conformance") {
      return (instrument.items || []).map(function (it) {
        return { id: it.id, code: it.code || it.id, label: it.title, groupId: it.categoryId };
      });
    }
    if (family === "domain-letter") {
      // Context (scored:false) questions carry no band and cannot move.
      return (instrument.questions || []).filter(function (q) { return q.scored !== false; })
        .map(function (q) {
          return { id: q.id, code: q.id, label: q.prompt, groupId: q.domainId };
        });
    }
    if (family === "program-maturity-ml") {
      return (instrument.requirements || []).map(function (r) {
        return { id: r.id, code: r.code || r.id, label: r.title, groupId: r.elementId };
      });
    }
    // csms-conformance and capability-sl both keep their items in requirements.
    return (instrument.requirements || []).map(function (r) {
      return { id: r.id, code: r.code || r.id, label: r.title, groupId: r.categoryId || r.frId || null };
    });
  }

  // Group id -> display name, harvested from wherever the family keeps them.
  function groupNames(instrument, taxonomy) {
    var map = {};
    function add(arr) {
      (arr || []).forEach(function (g) { if (g && g.id) map[g.id] = g.name || g.title || g.id; });
    }
    if (instrument) {
      add(instrument.categories);
      add(instrument.elements);
      add(instrument.domains);
      add(instrument.layers);   // layered CRA: P1/P2/P3 layer names
      // Risk appetite groups its items by section (exposure / appetite /
      // technical). Only here: "sections" is too generic a key to harvest
      // from every instrument.
      if (instrument.scoringFamily === "risk-appetite-coherence") add(instrument.sections);
      if (instrument.taxonomy) { add(instrument.taxonomy.principles); add(instrument.taxonomy.objectives); }
    }
    if (taxonomy) add(taxonomy.frs);
    return map;
  }

  // ---- response -> ordered value ----------------------------------------
  // { kind: scored|unknown|na|unanswered, rank: number|null, label: string }
  function val(kind, rank, label) { return { kind: kind, rank: rank, label: label }; }
  var NA = val("na", null, "Not applicable");
  var UNKNOWN = val("unknown", null, "Unknown");
  var UNANSWERED = val("unanswered", null, "Not answered");

  // achieved/partially/not families (caf-achieved, nis2-conformance). Label
  // comes from the instrument's states scale when present.
  var STATE_FALLBACK = {
    not:       { rank: 0, label: "Not achieved" },
    partially: { rank: 1, label: "Partially achieved" },
    achieved:  { rank: 2, label: "Achieved" }
  };
  function achievedStateInfo(state, instrument) {
    var meta = STATE_FALLBACK[state];
    if (!meta) return null;
    var label = meta.label;
    var ss = (instrument && instrument.states) || [];
    for (var i = 0; i < ss.length; i++) if (ss[i].value === state) label = ss[i].label || label;
    return { rank: meta.rank, label: label };
  }

  // csms-conformance: the four scored states with ranks live in the profile.
  function csmsStateInfo(state, profile) {
    var ss = (profile && profile.states) || [];
    for (var i = 0; i < ss.length; i++) {
      if (ss[i].value === state && ss[i].scored && typeof ss[i].rank === "number") {
        return { rank: ss[i].rank, label: ss[i].label || state };
      }
    }
    return null;
  }

  // program-maturity-ml: not-met ranks below ML1; ML values from the profile.
  function mlInfo(mlId, profile) {
    if (mlId === "not-met") return { rank: 0, label: "Not met" };
    var levels = (profile && profile.maturityLevels) || [];
    for (var i = 0; i < levels.length; i++) {
      if (levels[i].id === mlId) {
        var rank = (typeof levels[i].value === "number") ? levels[i].value : null;
        var label = levels[i].name && levels[i].name !== mlId ? (mlId + " " + levels[i].name) : mlId;
        return rank === null ? null : { rank: rank, label: label };
      }
    }
    var fb = { ML1: 1, ML2: 2, ML3: 3, ML4: 4 };
    return Object.prototype.hasOwnProperty.call(fb, mlId) ? { rank: fb[mlId], label: mlId } : null;
  }

  function bandLabelFor(band, instrument) {
    var DL = window.App.ScoringDomainLetter;
    return (DL && DL.bandLabel) ? DL.bandLabel(band, instrument) : String(band);
  }

  function valueFor(family, resp, instrument, profile) {
    if (family === "risk-appetite-coherence") {
      // A named band on its own axis. The exposure and appetite band names do
      // not overlap, so the band itself says which scale to rank it on. The
      // rank orders positions only; it does NOT say which way is better, and
      // compare() never treats it as if it did.
      var RA = window.App.ScoringRiskAppetite;
      if (resp && (resp.notEstablished === true || resp.disposition === "unknown")) {
        return val("unknown", null, "Not established");
      }
      var b = resp && typeof resp.band === "string" ? resp.band : "";
      if (!b || !RA) return UNANSWERED;
      var r = RA.rankOf(b, RA.axisSpec(profile, "exposure").bands) || RA.rankOf(b, RA.axisSpec(profile, "appetite").bands);
      return r ? val("scored", r, RA.titleCase(b)) : UNANSWERED;
    }
    if (family === "capability-sl") {
      if (resp && resp.applicable === false) return NA;
      var sl = (resp && resp.components) ? Object.keys(resp.components).filter(function (k) { var s = resp.components[k].state; return s === "met" || s === "met-compensating"; }).length : null;
      return sl === null ? UNANSWERED : val("scored", sl, "SL " + sl);
    }
    if (family === "domain-letter") {
      if (resp && resp.applicable === false) return NA;
      if (resp && resp.unknown === true) return UNKNOWN;
      var band = (resp && typeof resp.band === "number") ? resp.band : null;
      return band === null ? UNANSWERED : val("scored", band, bandLabelFor(band, instrument));
    }
    if (family === "program-maturity-ml") {
      var mlId = resp ? (resp.ml || null) : null;
      if ((resp && resp.applicable === false) || mlId === "na") return NA;
      if (mlId === "unknown") return UNKNOWN;
      if (!mlId) return UNANSWERED;
      var mi = mlInfo(mlId, profile);
      return mi ? val("scored", mi.rank, mi.label) : UNANSWERED;
    }
    // State families: caf-achieved, nis2-conformance, csms-conformance.
    var state = resp ? (resp.state || null) : null;
    if ((resp && resp.applicable === false) || state === "na") return NA;
    if (state === "unknown" || (resp && resp.unknown === true)) return UNKNOWN;
    if (!state) return UNANSWERED;
    var info = (family === "csms-conformance")
      ? csmsStateInfo(state, profile)
      : achievedStateInfo(state, instrument);
    return info ? val("scored", info.rank, info.label) : UNANSWERED;
  }

  // ---- baseline extraction ----------------------------------------------
  function extractBaseline(projectFile, instrumentId, fileName) {
    var assessments = (projectFile && projectFile.assessments) || null;
    if (!assessments) return { ok: false, error: "That file holds no assessments to compare against." };
    // Keyed by assessment id now, so find by the instrument FIELD. A file can
    // hold several of the same instrument; the latest visit is the baseline
    // worth comparing against.
    var candidates = Object.keys(assessments).map(function (k) { return assessments[k]; })
      .filter(function (a) { return a && a.instrumentId === instrumentId; });
    candidates.sort(function (a, b) {
      var da = ((a.engagementMeta || {}).dateOfVisit) || "";
      var db = ((b.engagementMeta || {}).dateOfVisit) || "";
      return da < db ? -1 : (da > db ? 1 : 0);
    });
    var ass = candidates[candidates.length - 1] || assessments[instrumentId];
    if (!ass) {
      var have = Object.keys(assessments).map(function (k) {
        return (assessments[k] && assessments[k].instrumentId) || k;
      }).join(", ") || "none";
      return { ok: false, error: "The selected file has no saved assessment for this instrument. It contains: " + have + "." };
    }
    var p = projectFile.project || {};
    // The visit date and revision belong to the ASSESSMENT, not the customer
    // record - they moved there when one file gained the ability to hold
    // several engagements. Reading them off the project left the provenance
    // line in every progress report with a blank date.
    var bm = ass.engagementMeta || {};
    return {
      ok: true,
      baseline: {
        source: {
          fileName: fileName || "",
          clientName: p.clientName || "",
          dateOfVisit: bm.dateOfVisit || p.dateOfVisit || "",
          documentRevision: bm.documentRevision || p.documentRevision || "",
          savedAt: projectFile.updatedAt || ""
        },
        instrumentContentVersion: ass.instrumentContentVersion || "",
        targets: (ass.targets || []).map(function (t) { return { id: t.id, name: t.name }; }),
        responses: JSON.parse(JSON.stringify(ass.responses || [])),
        // Risk appetite: the previous visit's sector, technical-review scope,
        // band overrides and the verdict its assessor recorded. Without this the
        // earlier read would be recalculated without its own judgement.
        riskAppetiteSetup: ass.riskAppetiteSetup ? JSON.parse(JSON.stringify(ass.riskAppetiteSetup)) : null,
        // Consultant's explicit pairing of current target -> baseline target;
        // filled in from the report card when the baseline has several targets.
        targetMap: {}
      }
    };
  }

  // Which baseline target corresponds to the current one: explicit pairing
  // first, then name match, then the first baseline target.
  function baselineTargetIdFor(baseline, currentTarget) {
    if (!baseline) return null;
    var ts = baseline.targets || [];
    if (currentTarget && baseline.targetMap && baseline.targetMap[currentTarget.id]) {
      var pinned = baseline.targetMap[currentTarget.id];
      if (ts.some(function (t) { return t.id === pinned; })) return pinned;
    }
    if (currentTarget) {
      var name = (currentTarget.name || "").trim().toLowerCase();
      var match = ts.filter(function (t) { return (t.name || "").trim().toLowerCase() === name; })[0];
      if (match) return match.id;
    }
    return ts[0] ? ts[0].id : null;
  }

  // ---- scoring dispatch (mirrors engine.scoreActiveTarget) ---------------
  // Used to re-score the baseline responses with the current content so the
  // family's own gap roadmap gives a comparable open-gap count.
  function scoreResponses(instrument, taxonomy, profile, family, responses, extra) {
    var A = window.App;
    try {
      if (family === "domain-letter")       return A.ScoringDomainLetter.scoreSite(instrument, profile, responses);
      if (family === "caf-achieved")        return A.ScoringCAF.scoreSite(instrument, profile, responses, (extra && extra.cafOverlay) || {});
      if (family === "program-maturity-ml") return A.ScoringProgramML.scoreSite(instrument, profile, responses);
      if (family === "nis2-conformance")    return A.ScoringNIS2.scoreSite(instrument, profile, responses);
      if (family === "csms-conformance") {
        // Layered CRA scores per layer and flattens the roadmap; scope comes
        // from the current setup so both sides use the same in-scope layers.
        if (isLayeredCRA(instrument) && A.ScoringCRA) {
          return A.ScoringCRA.scoreSite(instrument, profile, responses, (extra && extra.craSetup) || null);
        }
        return A.ScoringCSMS.scoreSite(instrument, profile, responses);
      }
      if (family === "capability-sl") {
        if (!taxonomy) return null;
        return A.Scoring.scoreSite(instrument, taxonomy, profile, (extra && extra.targetProfile) || { defaultTargetSL: 2, perFR: {}, perZone: {} }, responses);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // One target's answers as that target actually reads them.
  //
  // On 62443-3-3 most answers live on the system-wide `__shared` layer and are
  // inherited by every zone the item covers; only what genuinely differs is
  // recorded against the zone itself. Filtering on targetId alone therefore
  // threw away nearly the whole assessment and left the progress comparison
  // looking at the handful of zone overrides - a demo with 51 requirements
  // answered compared 4 of them and reported almost no movement. Resolving the
  // shared layer first is what every other consumer of these responses does.
  //
  // Families without a shared layer have no `__shared` responses, so this is
  // the plain per-target filter for them.
  function scopeResponses(responses, targetId) {
    var S = window.App.Scoring;
    var shared = [], own = [];
    (responses || []).forEach(function (r) {
      if (r.targetId === S.SHARED_TARGET_ID) shared.push(r);
      else if ((r.targetId || targetId) === targetId) own.push(r);
    });
    if (!shared.length) return own;
    return S.resolveResponses(own, shared, targetId);
  }

  // ---- organisation-wide roll-up across sites -----------------------------
  //
  // One saved file is one customer, and a customer has sites. An assessment can
  // be run per site, and the organisation's position is then the WEAKEST site's
  // position for each requirement: three sites Achieved and one Not achieved is
  // an organisation that has not achieved it, and the sites holding it down are
  // named so the reader can see where the work is.
  //
  // Weakest-wins, rather than a mean or a majority, for the same reason the FR
  // roll-up and the capped domain grade work that way: an organisation-wide
  // claim that averages away one badly exposed site is the kind of number that
  // reads well and is wrong where it matters.
  //
  // Ordering comes from valueFor, which every family already normalises to a
  // ranked value, so this needs no per-family code.
  //
  // A "site" here is an ASSESSMENT. The site is named on the assessment, so
  // covering a second facility means a second assessment in the same customer
  // file rather than a second target inside one - which is why the same
  // assessment shape serves a single-site company and a multi-site one.
  //
  // opts: { instrument, taxonomy, profile, family,
  //         entries: [{ id, name, responses }] }
  function rollUpSites(opts) {
    var instrument = opts.instrument, profile = opts.profile, family = opts.family;
    var groups = groupNames(instrument, opts.taxonomy);
    var entries = (opts.entries || []).filter(Boolean);
    var catalog = catalogFor(instrument, family);

    // Index each site's answers once, not once per requirement.
    var indexed = entries.map(function (en) {
      var by = {};
      (en.responses || []).forEach(function (r) { by[r.requirementId || r.itemId] = r; });
      return { id: en.id, name: en.name, by: by };
    });

    var items = catalog.map(function (item) {
      var perSite = indexed.map(function (en) {
        return { targetId: en.id, name: en.name,
                 value: valueFor(family, en.by[item.id], instrument, profile) };
      });

      var scored = perSite.filter(function (s) { return s.value.kind === "scored"; });
      // Sites that could not be scored still matter: an unanswered site is not
      // a passing site, so it is reported as a coverage gap beside the result
      // rather than quietly dropped.
      var unscored = perSite.filter(function (s) {
        return s.value.kind === "unanswered" || s.value.kind === "unknown";
      });

      var orgValue = null, worstSites = [];
      if (scored.length) {
        var lowest = scored.reduce(function (m, s) { return s.value.rank < m ? s.value.rank : m; }, Infinity);
        orgValue = scored.filter(function (s) { return s.value.rank === lowest; })[0].value;
        worstSites = scored.filter(function (s) { return s.value.rank === lowest; })
                           .map(function (s) { return s.name; });
      }
      var ranks = scored.map(function (s) { return s.value.rank; });
      var differs = ranks.length > 1 && Math.min.apply(null, ranks) !== Math.max.apply(null, ranks);

      return {
        id: item.id, code: item.code, label: item.label,
        groupId: item.groupId, groupName: item.groupId ? (groups[item.groupId] || item.groupId) : "",
        orgValue: orgValue, worstSites: worstSites, differs: differs,
        scoredSites: scored.length, unscoredSites: unscored.map(function (s) { return s.name; }),
        perSite: perSite
      };
    });

    var compared = items.filter(function (i) { return i.orgValue; });
    return {
      siteCount: entries.length,
      siteNames: entries.map(function (t) { return t.name; }),
      items: items,
      // What a reader wants first: where the sites disagree, worst first, so
      // the organisation-wide list leads with what one site is carrying alone.
      divergent: items.filter(function (i) { return i.differs; })
                      .sort(function (a, b) { return a.orgValue.rank - b.orgValue.rank; }),
      summary: {
        compared: compared.length,
        differing: items.filter(function (i) { return i.differs; }).length,
        uniform: compared.length - items.filter(function (i) { return i.differs; }).length,
        withUnscoredSites: items.filter(function (i) { return i.unscoredSites.length; }).length
      }
    };
  }

  // ---- comparison ---------------------------------------------------------
  // opts: { instrument, taxonomy, profile, family, baselineResponses,
  //         currentResponses, targetProfile, cafOverlay, craSetup }
  function compare(opts) {
    var instrument = opts.instrument, profile = opts.profile, family = opts.family;
    var groups = groupNames(instrument, opts.taxonomy);

    function indexById(responses) {
      var by = {};
      (responses || []).forEach(function (r) { by[r.requirementId || r.itemId] = r; });
      return by;
    }
    var prevBy = indexById(opts.baselineResponses);
    var currBy = indexById(opts.currentResponses);

    var catalog = catalogFor(instrument, family);
    // Layered CRA: compare only the layers currently in scope - out-of-scope
    // layers are absent from the assessment, not "no longer assessed".
    if (isLayeredCRA(instrument) && opts.craSetup && opts.craSetup.layers && opts.craSetup.layers.length) {
      catalog = catalog.filter(function (it) { return opts.craSetup.layers.indexOf(it.groupId) !== -1; });
    }

    // Risk appetite: the technical review is optional, so its items are only
    // compared when it is in scope now. Absent, they are out of the
    // assessment, not "no longer assessed".
    var isRA = family === "risk-appetite-coherence";
    var raSections = {};
    if (isRA) {
      (instrument.sections || []).forEach(function (s) { raSections[s.id] = s; });
      var techNow = !!(opts.riskAppetiteSetup && opts.riskAppetiteSetup.includeTech);
      catalog = catalog.filter(function (it) {
        var s = raSections[it.groupId];
        return techNow || !(s && s.optional);
      });
    }

    var summary = { improved: 0, regressed: 0, unchanged: 0, newlyAssessed: 0, noLongerAssessed: 0, notCompared: 0, moved: 0 };
    var items = catalog.map(function (item) {
      var prev = valueFor(family, prevBy[item.id], instrument, profile);
      var curr = valueFor(family, currBy[item.id], instrument, profile);
      var change, direction = "";
      if (isRA && prev.kind === "scored" && curr.kind === "scored") {
        // Neither scale has a good end, so an item moving is neither an
        // improvement nor a regression. It moved, and the direction is named
        // plainly. Whether the organisation is better placed is a question
        // about the FIT, answered once, below.
        var sec = raSections[item.groupId];
        var isExposure = sec && sec.axis === "exposure";
        if (curr.rank === prev.rank) change = "unchanged";
        else {
          change = "moved";
          direction = isExposure ? (curr.rank > prev.rank ? "Higher" : "Lower")
                                 : (curr.rank > prev.rank ? "More tolerant" : "More cautious");
        }
      } else if (prev.kind === "scored" && curr.kind === "scored") {
        change = curr.rank > prev.rank ? "improved" : (curr.rank < prev.rank ? "regressed" : "unchanged");
      } else if (curr.kind === "scored") {
        change = "newlyAssessed";
      } else if (prev.kind === "scored") {
        change = "noLongerAssessed";
      } else {
        change = "notCompared";
      }
      summary[change] += 1;
      return {
        id: item.id, code: item.code, label: item.label,
        groupId: item.groupId, groupName: item.groupId ? (groups[item.groupId] || item.groupId) : "",
        prev: prev, curr: curr, change: change, direction: direction
      };
    });

    // Movements: regressions first (they need the conversation), then
    // improvements, each in catalog order. Risk appetite has neither: its
    // movements are simply the items that moved, in catalog order.
    var movements = isRA
      ? items.filter(function (it) { return it.change === "moved"; })
      : items.filter(function (it) { return it.change === "regressed"; })
          .concat(items.filter(function (it) { return it.change === "improved"; }));

    // Open-gap count on each side via the family's own roadmap, both scored
    // with the CURRENT content/targets. Absent roadmaps (e.g. program-ml
    // without a target overlay) yield null and the caller hides the figure.
    var extra = { targetProfile: opts.targetProfile, cafOverlay: opts.cafOverlay, craSetup: opts.craSetup };
    var prevScored = scoreResponses(instrument, opts.taxonomy, profile, family, opts.baselineResponses || [], extra);
    var currScored = scoreResponses(instrument, opts.taxonomy, profile, family, opts.currentResponses || [], extra);
    // A 3-3/4-2 roadmap also carries requirements still being assessed
    // ("To assess"); those are not gaps, so they are not counted as open ones.
    function openGaps(sc) {
      return sc && Array.isArray(sc.roadmap)
        ? sc.roadmap.filter(function (r) { return !r.toAssess; }).length : null;
    }
    var prevGaps = openGaps(prevScored);
    var currGaps = openGaps(currScored);
    var gaps = (prevGaps !== null && currGaps !== null) ? { prev: prevGaps, curr: currGaps } : null;

    // Above-baseline: controls implemented beyond the current profile, and whether
    // each is newly added since the baseline (scored both sides against the current
    // overlay). Only the caf-achieved scorer exposes this list.
    var currAB = (currScored && currScored.aboveBaseline) || [];
    var prevAB = (prevScored && prevScored.aboveBaseline) || [];
    var prevABSet = {}; prevAB.forEach(function (it) { prevABSet[it.outcomeId] = true; });
    var SC = window.App.ScoringCAF;
    var aboveBaseline = currAB.map(function (it) {
      return {
        code: it.outcomeId, label: it.title,
        group: it.principleId ? (groups[it.principleId] || it.principleId) : "",
        state: (SC && SC.stateLabelFor(it.aboveBaselineState, instrument)) || it.aboveBaselineState,
        isNew: !prevABSet[it.outcomeId]
      };
    });
    var aboveBaselineNew = aboveBaseline.filter(function (it) { return it.isNew; }).length;

    var result = { items: items, movements: movements, summary: summary, gaps: gaps,
      aboveBaseline: aboveBaseline, aboveBaselineNew: aboveBaselineNew };
    if (isRA) result.fit = riskAppetiteFit(opts);
    return result;
  }

  // ---- risk appetite: the fit, then and now -------------------------------
  // The one thing in this instrument that has a direction: is the organisation
  // closer to proportion with its exposure than it was? Each visit is scored
  // with its OWN setup (sector, technical scope, the assessor's bands and
  // verdict), so last year's read is last year's judgement, not a recalculation.
  // Distance is measured on the characterised positions: how many bands the
  // appetite sits from what the exposure warrants.
  function riskAppetiteFit(opts) {
    var RA = window.App.ScoringRiskAppetite;
    if (!RA) return null;
    var cur = opts.riskAppetiteSetup || RA.defaultSetup(opts.instrument);
    var prevSetup = opts.baselineRiskAppetiteSetup;
    if (!prevSetup) {
      // An older baseline with no setup: read its answers with today's scope,
      // but none of today's judgements, which were not made about it.
      prevSetup = JSON.parse(JSON.stringify(cur));
      ["exposureBand", "appetiteBand", "revealedBand", "verdictOverride", "verdictRationale"]
        .forEach(function (k) { delete prevSetup[k]; });
    }
    function side(responses, setup) {
      var s = RA.scoreSite(opts.instrument, opts.profile, responses || [], setup);
      var v = s.verdict || {};
      return {
        complete: !!s.complete,
        verdictKey: v.key, verdictLabel: v.displayLabel || v.label,
        exposureBand: s.exposure.band, exposureLabel: s.exposure.bandLabel, exposureRank: s.exposure.rank,
        appetiteBand: s.appetite.band, appetiteLabel: s.appetite.bandLabel, appetiteRank: s.appetite.rank,
        revealedBand: s.revealed ? s.revealed.band : null,
        distance: (v.computed && typeof v.computed.delta === "number") ? Math.abs(v.computed.delta)
                : (typeof v.delta === "number" ? Math.abs(v.delta) : null)
      };
    }
    var prev = side(opts.baselineResponses, prevSetup);
    var curr = side(opts.currentResponses, cur);
    var direction = null;
    if (prev.complete && curr.complete && prev.distance !== null && curr.distance !== null) {
      direction = curr.distance < prev.distance ? "closer" : curr.distance > prev.distance ? "further" : "same";
    }
    return { prev: prev, curr: curr, direction: direction };
  }

  var CHANGE_LABELS = {
    improved: "Improved",
    regressed: "Regressed",
    unchanged: "Unchanged",
    newlyAssessed: "Newly assessed",
    noLongerAssessed: "No longer assessed",
    notCompared: "Not compared",
    moved: "Moved"
  };

  // One-line description of where the baseline came from, reused by the
  // report card and both exports.
  function sourceLine(baseline) {
    if (!baseline || !baseline.source) return "";
    var s = baseline.source;
    var bits = [];
    if (s.clientName) bits.push(s.clientName);
    if (s.dateOfVisit) bits.push("visit " + s.dateOfVisit);
    else if (s.savedAt) bits.push("saved " + String(s.savedAt).slice(0, 10));
    if (s.documentRevision) bits.push("rev " + s.documentRevision);
    var line = bits.join(", ");
    // Printed in client documents, so no dash standing in for punctuation:
    // "..., rev 1.0 (previous assessment in this file)" or "..., from prev.json".
    if (s.fileName) {
      var bracketed = /^\(.*\)$/.test(s.fileName);
      line += line ? (bracketed ? " " + s.fileName : ", from " + s.fileName) : s.fileName;
    }
    return line;
  }

  return {
    catalogFor: catalogFor,
    groupNames: groupNames,
    valueFor: valueFor,
    extractBaseline: extractBaseline,
    baselineTargetIdFor: baselineTargetIdFor,
    scopeResponses: scopeResponses,
    rollUpSites: rollUpSites,
    scoreResponses: scoreResponses,
    compare: compare,
    sourceLine: sourceLine,
    CHANGE_LABELS: CHANGE_LABELS
  };
})();
