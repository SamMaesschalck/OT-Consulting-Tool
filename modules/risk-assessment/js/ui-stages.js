/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-stages.js — Home, the workflow steps and Engagement and evidence.
 *
 * Home (home: the kind of assessment, the steps with their status, Open the
 * demo), 1 Scope and risk criteria (suc, with the project's risk criteria
 * editable beside the form, js/ui-criteria.js, and the tolerable risk's
 * confirmed marker), 2 High-level risk (srs, with each system's impact,
 * optionally per consequence category, and its source; Assign to zone on the
 * ranking, and the comparison column on a high-level-only assessment) and
 * 4 Risk comparison (compare); plus
 * Engagement and evidence (basis). Step 3 is js/ui-zones.js, step 5
 * (Detailed risk: risk and slt) js/ui-risk.js, steps 6 and 7 js/ui-spec.js.
 * Each page registers itself in RiskApp.Pages for js/app.js to draw.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var RULES = M.RULES, FRS = M.FRS, SEV = M.SEV, LIK = M.LIK, BANDS = M.BANDS, SIS_RULE = M.SIS_RULE;
  var ASSET_TYPES = M.ASSET_TYPES, BAND_NAME = M.BAND_NAME;
  var state = A.state, touched = A.touched, rerender = A.rerender, render = A.render;
  var h = U.h, card = U.card, toast = U.toast, textField = U.textField, selectField = U.selectField,
    lineListField = U.lineListField, registerTable = U.registerTable, frChips = U.frChips, riskPill = U.riskPill,
    pageSub = U.pageSub, confirmRemove = U.confirmRemove, flagEditor = U.flagEditor,
    slButtonsFR = U.slButtonsFR, traceDetails = U.traceDetails, renderZoneMap = U.renderZoneMap;
  var riskFor = E.riskFor, exceedsTolerable = E.exceedsTolerable, residualRisk = E.residualRisk,
    assetTypeLabel = E.assetTypeLabel, zoneSafety = E.zoneSafety, maxDefined = E.maxDefined;

  // ---------- Stage 1: the system under consideration (SUC) ----------

  function renderSuc(main) {
    var p = state.project, s = p.srs;
    main.appendChild(h("h1", { class: "page-title", text: "Scope and risk criteria" }));
    main.appendChild(pageSub("suc", "Define the SUC, its boundary and every access point."));
    main.appendChild(card("SUC definition", null, [
      textField("SUC name", p.suc.name, function (v) { p.suc.name = v; touched(); }, { placeholder: "e.g. Riverside Works process control system" }),
      textField("Description", p.suc.description, function (v) { p.suc.description = v; touched(); }, { textarea: true, placeholder: "Function and intended usage of the SUC." }),
      textField("Scope statement / boundary", p.suc.scopeStatement, function (v) { p.suc.scopeStatement = v; touched(); }, { textarea: true, placeholder: "What is inside and outside the boundary, and the access points across it.", hint: "Name the exclusions, e.g. corporate IT or third-party packages." }),
      lineListField("Operating-environment assumptions", p.suc.assumptions, function (a) { p.suc.assumptions = a; touched(); }, "e.g. Physical access to the equipment room is controlled")
    ], null, { "data-check-anchor": "suc" }));

    // The confirmed marker is the band the asset owner confirmed: changing the
    // tolerable risk afterwards leaves it unconfirmed until confirmed again.
    var confirmed = M.tolerableConfirmed(p), staleBand = s.tolerableConfirmed && !confirmed ? s.tolerableConfirmed : null;
    var body = [
      selectField("Tolerable risk", s.tolerableRisk, BANDS.map(function (b) { return { value: b.id, text: b.name }; }), function (v) { s.tolerableRisk = v || RULES.tolerableRisk.default; touched(); rerender(); }, { placeholder: false, hint: "The highest unmitigated risk accepted without a treatment decision." }),
      h("div", { class: "field" }, [
        h("label", { class: "check-line" }, [
          h("input", { type: "checkbox", "data-action": "tolerable-confirmed", checked: confirmed, onChange: function (e) {
            if (e.target.checked) s.tolerableConfirmed = s.tolerableRisk || RULES.tolerableRisk.default; else delete s.tolerableConfirmed;
            touched(); rerender();
          } }),
          "Confirmed with the asset owner"
        ]),
        staleBand ? h("div", { class: "hint val-warn", text: "Confirmed for " + BAND_NAME[staleBand].toLowerCase() + ", before the change." }) : null
      ]),
      h("div", { class: "field" }, [
        h("label", { text: "Client risk criteria" }),
        h("label", { style: "text-transform:none;font-weight:400;font-size:13px;color:var(--text);display:inline-flex;align-items:center;gap:6px;cursor:pointer" }, [
          h("input", { type: "checkbox", "data-action": "client-criteria", checked: s.clientMatrix, onChange: function (e) { s.clientMatrix = e.target.checked; touched(); rerender(); } }),
          "The client's own risk matrix or criteria are in use"
        ]),
        h("div", { class: "hint", text: "Enter the client's levels and matrix here; the reports print them as the client's." })
      ])
    ];
    if (s.clientMatrix) body.push(textField("Where the client's criteria come from", s.clientMatrixNote, function (v) { s.clientMatrixNote = v; touched(); }, { textarea: true, placeholder: "e.g. Acme corporate risk matrix, revision 3" }));
    // The project's own criteria, editable (js/ui-criteria.js): the matrix
    // beside the form, the scales and categories below.
    main.appendChild(card("Risk criteria", null, [h("div", { class: "criteria-layout" }, [
      h("div", null, body),
      R.CriteriaUI.panel(p)
    ]), R.CriteriaUI.scales(p)], null, { "data-check-anchor": "criteria" }));
  }

  // ---------- Stage 2: high-level risk assessment ----------

  // Assign to zone: a ranked system goes to an existing zone, or to a new
  // zone named after it. The link is the zone's (hlaIds, with fromHLA its
  // first entry); no threat is seeded. The page moves on to step 3, at the zone.
  function assignToZone(asset, value) {
    var p = state.project, z = null;
    if (value === "new") {
      p.counters.zone += 1;
      z = M.emptyZone(p.counters.zone);
      z.name = asset.name || ("System " + asset.id);
      z.fn = asset.functionLocation || "";
      if (asset.name) z.assets.push(M.newAsset(p, { name: asset.name, type: "other" }));
      p.zones.push(z);
    } else z = E.findZone(p, value);
    if (!z) return;
    M.setHlaIds(z, M.hlaIdsOf(z).concat([asset.id]));
    touched();
    A.goToItem({ stage: "zones", target: { kind: "zone", id: z.id } });
    toast(asset.id + " assigned to " + z.id + ".");
  }
  function unassign(z, asset) {
    M.setHlaIds(z, M.hlaIdsOf(z).filter(function (id) { return id !== asset.id; }));
    touched(); rerender();
  }
  // Choosing a zone and assigning are two steps, so browsing the list with the
  // keyboard records nothing: the Assign button acts on the choice.
  function assignCell(asset) {
    var p = state.project, zs = E.zonesOfHLA(p, asset.id);
    var box = h("div", { class: "assign" });
    // A high-level-only assessment has no zone work: its zones, if any, are shown only.
    if (M.assessmentType(p) === "high-level") {
      box.appendChild(h("span", { class: "muted assign-ro", text: zs.map(function (z) { return z.id; }).join(", ") }));
      return box;
    }
    zs.forEach(function (z) {
      box.appendChild(h("span", { class: "pill neutral assign-zone", title: z.name || z.id }, [
        z.id,
        h("button", { type: "button", class: "assign-x", "data-action": "unassign-" + z.id, "aria-label": "Remove from " + z.id, title: "Remove from " + z.id, text: "×", onClick: function () { unassign(z, asset); } })
      ]));
    });
    var btn = h("button", { type: "button", class: "btn sm", "data-action": "assign", text: "Assign", disabled: "disabled",
      "aria-label": "Assign " + asset.id + " to the chosen zone",
      onClick: function () { if (sel.value) assignToZone(asset, sel.value); } });
    var sel = h("select", { "data-action": "assign-zone", "aria-label": "Zone for " + asset.id,
      onChange: function (e) { btn.disabled = !e.target.value; } });
    sel.appendChild(h("option", { value: "", text: zs.length ? "Add to zone" : "Assign to zone" }));
    p.zones.forEach(function (z) { if (zs.indexOf(z) < 0) sel.appendChild(h("option", { value: z.id, text: z.id + (z.name ? " " + z.name : "") })); });
    sel.appendChild(h("option", { value: "new", text: "New zone" }));
    box.appendChild(sel);
    box.appendChild(btn);
    return box;
  }

  // The decision on a detailed assessment (the risk comparison, step 4; on a
  // high-level-only assessment a column of the ranking). Required or Not
  // required, one click each, the suggestion dashed until it is chosen; a
  // choice that differs from the comparison asks for its reason.
  var DETAIL_CHOICES = [{ v: true, id: "required", text: "Required" }, { v: false, id: "not-required", text: "Not required" }];
  function setDetailed(o, v) {
    if (!o.detailed || typeof o.detailed !== "object") o.detailed = M.emptyDetailed();
    o.detailed.required = o.detailed.required === v ? null : v;
  }
  function decisionControl(o, cmp) {
    var kids = [h("div", { class: "treat-opts", role: "group", "aria-label": "Detailed assessment" }, DETAIL_CHOICES.map(function (c) {
      var on = cmp.required === c.v, sug = cmp.required === null && cmp.suggested === c.v;
      return h("button", {
        type: "button", "data-detailed": c.id,
        class: "treat-opt" + (on ? " on" : (sug ? " suggested" : "")),
        "aria-pressed": on ? "true" : "false",
        title: sug ? "Suggested by the comparison" : null,
        text: (on ? "✓ " : (sug ? "? " : "")) + c.text,
        onClick: function () { setDetailed(o, c.v); touched(); rerender(); }
      });
    }))];
    if (cmp.override || cmp.noBasis || (o.detailed && o.detailed.reason)) {
      kids.push(A.changeRedraw(h("input", { type: "text", class: "detailed-reason", "data-reason": "detailed", value: (o.detailed && o.detailed.reason) || "",
        "aria-label": "Reason for the decision", placeholder: cmp.noBasis ? "Why, with no initial risk to compare" : "Why the decision differs from the comparison",
        onInput: function (e) { o.detailed.reason = e.target.value; touched(); } })));
    }
    if (cmp.reasonMissing) kids.push(h("div", { class: "hint val-warn", text: "Give a reason." }));
    return h("div", { class: "detailed-choice", "data-detailed-state": cmp.state }, kids);
  }
  function comparisonWords(cmp) {
    if (cmp.suggested === null) return "Not rated";
    return cmp.suggested ? "Above tolerable" : "Within tolerable";
  }

  // A ranked system's impact: one level, or (By category) one per
  // consequence category, the impact then being the worst of them; and
  // where the rating comes from (HAZOP, a business impact analysis, ...).
  var catOpen = {};   // ranked system id -> its By category is open (kept across redraws)
  function impactCell(a, p, crit) {
    var cats = E.categoryRatings(a.consequenceByCategory, p);
    var box = h("div", { class: "hla-impact" });
    if (cats.length) {
      box.appendChild(h("div", { class: "derived", "data-derived": "consequence" }, [h("strong", { text: E.impactName(a.consequence, p) || "Not rated" }), h("span", { class: "muted", text: " worst category" })]));
    } else {
      var sel = h("select", { "data-field": "hla-consequence", "aria-label": "Impact of " + a.id, onChange: function (e) { a.consequence = e.target.value; touched(); rerender(); } });
      sel.appendChild(h("option", { value: "", text: "Not rated" }));
      crit.impact.forEach(function (l) { var o = h("option", { value: l.id, text: l.name }); if (a.consequence === l.id) o.setAttribute("selected", "selected"); sel.appendChild(o); });
      box.appendChild(sel);
    }
    var listId = "cons-src-" + a.id;
    var src = h("input", { type: "text", "data-field": "hla-source", list: listId, value: a.consequenceSource || "", "aria-label": "Source of the impact of " + a.id, placeholder: "e.g. HAZOP",
      onInput: function (e) { var v = e.target.value; if (v.trim()) a.consequenceSource = v; else delete a.consequenceSource; touched(); } });
    var kids = [h("summary", { text: "By category" + (cats.length ? " (" + cats.length + ")" : "") + (a.consequenceSource ? ", source" : "") })];
    crit.categories.forEach(function (cat) {
      var s = h("select", { "data-field": "hla-cat-" + cat.id, "aria-label": cat.name + " impact of " + a.id, onChange: function (e) {
        E.setCategoryRating(a, "consequence", "consequenceByCategory", cat.id, e.target.value, p); touched(); rerender();
      } });
      s.appendChild(h("option", { value: "", text: "Not rated" }));
      var cur = a.consequenceByCategory && a.consequenceByCategory[cat.id];
      crit.impact.forEach(function (l) { var o = h("option", { value: l.id, text: l.name }); if (cur === l.id) o.setAttribute("selected", "selected"); s.appendChild(o); });
      kids.push(h("label", { class: "cat-line" }, [h("span", { text: cat.name }), s]));
    });
    kids.push(h("label", { class: "cat-line" }, [h("span", { text: "Source" }), src]));
    kids.push(h("datalist", { id: listId }, M.CONSEQUENCE_SOURCES.map(function (x) { return h("option", { value: x }); })));
    var d = h("details", { class: "hla-cats" }, kids);
    // Open while categories are given, until closed; kept across redraws.
    if (catOpen[a.id] != null ? catOpen[a.id] : cats.length > 0) d.setAttribute("open", "");
    d.addEventListener("toggle", function () { if (d.isConnected) catOpen[a.id] = d.open; });
    box.appendChild(d);
    return box;
  }

  function renderSrs(main) {
    var p = state.project, s = p.srs, hlOnly = M.assessmentType(p) === "high-level";
    main.appendChild(h("h1", { class: "page-title", text: "High-level risk" }));
    main.appendChild(pageSub("srs", hlOnly ? "Rank the systems and decide where a detailed assessment is needed." : "Rank the systems to frame the zoning, and assign them to zones."));

    main.appendChild(card("High-level risk assessment", "context for the zoning; nothing here is calculated", [
      selectField("Assumed adversary class (threat context)", s.adversaryClass, Object.keys(RULES.slDefinitions).filter(function (k) { return k !== "_note"; }).map(function (k) { return { value: k, text: "SL" + k + "-grade: " + RULES.slDefinitions[k] }; }), function (v) { s.adversaryClass = v ? Number(v) : null; touched(); rerender(); }, { hint: "Per-FR suggestions below this class are flagged as a mismatch." }),
      textField("Essential functions", s.essentialFunctions, function (v) { s.essentialFunctions = v; touched(); }, { textarea: true, placeholder: "What the system must keep doing (production, safety, quality, compliance)." }),
      textField("Worst-case consequences", s.worstCase, function (v) { s.worstCase = v; touched(); }, { textarea: true, placeholder: "The worst credible outcome, e.g. from the PHA/HAZOP." })
    ]));

    // Relative risk ranking: rate each asset/system so the ranking drives how
    // assets are grouped into zones. Worst-credible impact plus (optional)
    // likelihood give a house risk band.
    // The levels of the project's risk criteria (js/model.js criteriaOf).
    var crit = M.criteriaOf(p);
    var likOpts = crit.likelihood.map(function (l) { return { value: l.id, text: l.name }; });
    var cols = [
      { key: "name", label: "Asset / system", placeholder: "e.g. DCS servers", width: "18%" },
      { key: "functionLocation", label: "Function & location", placeholder: "e.g. Primary control, equipment room" },
      { key: "__impact", label: "Impact", kind: "computed", width: "150px", render: function (it) { return impactCell(it, p, crit); } },
      { key: "likelihood", label: "Likelihood", kind: "select", options: likOpts, width: "110px", placeholder: "Not rated" },
      { key: "__risk", label: "Risk", kind: "computed", width: "88px", render: function (it) { return riskPill(riskFor(it.consequence, it.likelihood, p)); } },
      { key: "note", label: "Candidate grouping / notes", placeholder: "e.g. → Process Control zone" }
    ];
    // A high-level-only assessment records the comparison with tolerable risk
    // here, as there are no zones to record it on.
    if (hlOnly) cols.push({ key: "__detailed", label: "Detailed assessment", kind: "computed", width: "190px", render: function (it) {
      var c = E.hlaComparison(it, p);
      return h("div", null, [h("div", { class: "muted cmp-words", text: comparisonWords(c) }), decisionControl(it, c)]);
    } });
    // A high-level-only assessment shows the column only when zones exist.
    if (!hlOnly || p.zones.length) cols.push({ key: "__zone", label: "Zone", kind: "computed", width: "200px", render: assignCell });
    main.appendChild(card("Asset / system risk ranking", "HSE & financial impact by function/location, ranked to guide zoning", [
      h("p", { class: "hint", style: "margin-top:0", text: "Rate each system's worst-credible impact and, where known, its likelihood." }),
      registerTable(s.highLevelAssets, cols, {
        empty: "No assets ranked yet. Add the systems in scope to build the relative risk ranking.", addLabel: "+ Add asset / system", rowLabel: "ranked system",
        rowAttrs: function (it) { return { "data-hla-id": it.id }; },
        // A system taken out of the ranking leaves no zone pointing at it.
        onRemove: function () { R.Migrate.pruneDangling(p); },
        onAdd: function () { p.counters.hla += 1; s.highLevelAssets.push(M.emptyHLA(p.counters.hla)); touched(); rerender(); }
      }),
      h("div", { class: "btn-row", style: "margin-top:12px" }, [
        h("button", { class: "btn", text: "High-level report →", title: "No zones or SL-T needed", onClick: function () { A.navigate("hlreport"); } })
      ])
    ], null, { "data-check-anchor": "ranking" }));

    // Known threats can go to step 5 as draft scenarios (js/ui-library.js);
    // the list there follows what is typed here.
    var known = lineListField("Known or presumed threats", s.knownThreats, function (a) { s.knownThreats = a; touched(); }, "e.g. Capable criminal adversary; insider misuse of engineering access");
    var knownBox = known.querySelector("textarea");
    if (knownBox) knownBox.addEventListener("input", function () { R.LibraryUI.refreshSend(); });
    main.appendChild(card("Threats and requirements", null, [
      known,
      hlOnly ? null : R.LibraryUI.sendPanel(p),
      lineListField("Security functions that must be kept", s.mandatorySecurityFunctions, function (a) { s.mandatorySecurityFunctions = a; touched(); }, "e.g. Hard-wired ESD independent of the BPCS")
    ]));
  }

  // ---------- Basis of assessment (evidence register) ----------

  function renderBasis(main) {
    var b = state.project.basisOfAssessment, p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Engagement and evidence" }));
    main.appendChild(h("p", { class: "page-sub", text: "The engagement details and the evidence behind the assessment, as printed in the report." }));

    // Engagement details: document control for the Word/Excel deliverables.
    var eng = p.engagement;
    main.appendChild(card("Engagement details", "for document control", [
      h("div", { class: "grid-2" }, [
        textField("Client / organisation", eng.client, function (v) { eng.client = v; touched(); }, { placeholder: "e.g. Acme Petrochemicals Ltd" }),
        textField("Consultant", eng.consultant, function (v) { eng.consultant = v; touched(); }, { placeholder: "who carried out the assessment" })
      ]),
      h("div", { class: "grid-2" }, [
        textField("Assessment date", eng.assessmentDate, function (v) { eng.assessmentDate = v; touched(); }, { placeholder: "e.g. 2026-07-04" }),
        textField("Document revision", eng.revision, function (v) { eng.revision = v; touched(); }, { placeholder: "e.g. 1.0" })
      ]),
      h("div", { class: "grid-2" }, [
        textField("Confidentiality", eng.confidentiality, function (v) { eng.confidentiality = v; touched(); }, { placeholder: "e.g. Confidential - Client Restricted" }),
        textField("QA review by", eng.qaReviewBy, function (v) { eng.qaReviewBy = v; touched(); }, { placeholder: "who reviewed the report before issue" })
      ])
    ]));

    // Preparation guidance (advisory; never pre-populates the registers below).
    var guide = window.App.Data.engagementGuidance;
    if (guide) {
      var gcol = function (title, items, forgotten) {
        return h("div", null, [
          h("h3", { style: "margin:0 0 6px;font-size:13px;font-weight:600;color:var(--text-muted)", text: title }),
          h("ul", { style: "margin:0;padding-left:18px;font-size:13px" }, (items || []).map(function (t) {
            return h("li", { style: "margin:3px 0;" + (forgotten ? "color:var(--near);" : "") }, [t]);
          }))
        ]);
      };
      main.appendChild(card("Preparation guidance", "what a 3-2 risk assessment usually needs", [
        h("p", { class: "muted", style: "margin:0 0 8px;font-size:13px", text: "Advisory only: nothing here is added to the registers below." }),
        h("details", null, [
          h("summary", { style: "cursor:pointer;color:var(--brand-blue);font-weight:600;font-size:13px", text: "Show typical documents & stakeholders" }),
          h("div", { class: "grid-3", style: "margin-top:12px" }, [
            gcol("Commonly needed documents", guide.commonDocuments, false),
            gcol("Often forgotten", guide.oftenForgotten, true),
            gcol("Key stakeholders to interview", guide.keyStakeholders, false)
          ])
        ])
      ]));
    }

    main.appendChild(card("People spoken to", "interviews & discussions", [
      registerTable(b.interviews, [
        { key: "name", label: "Name", placeholder: "e.g. J. Smith", width: "22%" },
        { key: "role", label: "Role / organisation", placeholder: "e.g. Control systems engineer, Riverside Works" },
        { key: "date", label: "Date", kind: "date", width: "150px" },
        { key: "notes", label: "Topics discussed", placeholder: "e.g. Network architecture, remote access" }
      ], { empty: "No interviews recorded yet.", addLabel: "+ Add person", rowLabel: "interview", onAdd: function () { p.counters.interview += 1; b.interviews.push(M.emptyInterview(p.counters.interview)); touched(); rerender(); } })
    ]));

    main.appendChild(card("Documents reviewed", "documents & records read or provided", [
      registerTable(b.documents, [
        { key: "title", label: "Document", placeholder: "e.g. Network architecture diagram", width: "26%" },
        { key: "reference", label: "Version / date", placeholder: "e.g. Rev C, 2025-11", width: "150px" },
        { key: "source", label: "Source", placeholder: "e.g. Provided by SI" },
        { key: "relevance", label: "Relevance / what it covered", placeholder: "e.g. Confirmed DMZ and conduits" }
      ], { empty: "No documents recorded yet.", addLabel: "+ Add document", rowLabel: "document", onAdd: function () { p.counters.document += 1; b.documents.push(M.emptyDocument(p.counters.document)); touched(); rerender(); } })
    ]));

    main.appendChild(card("Systems & evidence observed", "walk-downs, screens, configurations seen", [
      registerTable(b.observations, [
        { key: "description", label: "Observed", placeholder: "e.g. Firewall rule base on the DMZ", width: "30%" },
        { key: "location", label: "Location", placeholder: "e.g. Control room" },
        { key: "date", label: "Date", kind: "date", width: "150px" },
        { key: "notes", label: "Notes", placeholder: "e.g. Screenshot taken; ANY-ANY rule found" }
      ], { empty: "No observations recorded yet.", addLabel: "+ Add observation", rowLabel: "observation", onAdd: function () { p.counters.observation += 1; b.observations.push(M.emptyObservation(p.counters.observation)); touched(); rerender(); } })
    ]));
  }

  // Step 3, Zones and conduits, is js/ui-zones.js.

  // ---------- Stage 4: risk comparison ----------
  //
  // One table: each zone's and conduit's initial risk against tolerable risk,
  // and the decision whether it needs a detailed assessment (js/engine.js
  // comparison). Comparing per zone and conduit is the method this tool
  // uses; the page says so, and does not present it as the standard's words.

  function initialCell(o, cmp, isZone) {
    var p = state.project, kids = [riskPill(cmp.initial)];
    var bandOpts = BANDS.map(function (b) { return { value: b.id, text: b.name }; });
    function entry(placeholderText) {
      var sel = h("select", { "data-action": "initial-risk", "aria-label": "Initial risk of " + o.id, onChange: function (e) {
        if (e.target.value) o.initialRisk = e.target.value; else delete o.initialRisk;
        touched(); rerender();
      } });
      sel.appendChild(h("option", { value: "", text: placeholderText }));
      bandOpts.forEach(function (b) { var op = h("option", { value: b.value, text: b.text }); if (o.initialRisk === b.value) op.setAttribute("selected", "selected"); sel.appendChild(op); });
      return sel;
    }
    var ids = (cmp.systems || []).map(function (a) { return a.id; }).join(", ");
    if (isZone) {
      // Rated systems give the initial risk; unrated ones leave it to be entered.
      if (cmp.source === "systems" && cmp.initial) kids.push(h("div", { class: "muted cmp-source", text: "From " + ids }));
      else {
        if (ids) kids.push(h("div", { class: "muted cmp-source", text: ids + " not rated" }));
        kids.push(h("div", { class: "cmp-entry" }, [entry("Enter")]));
      }
    } else {
      kids.push(h("div", { class: "muted cmp-source", text: cmp.source === "entered" ? "Entered" : (cmp.ruleBand ? "From the zones" : "No rated zone") }));
      kids.push(h("div", { class: "cmp-entry" }, [entry(cmp.ruleBand ? "From the zones (" + BAND_NAME[cmp.ruleBand].toLowerCase() + ")" : "Enter")]));
    }
    return h("td", null, kids);
  }

  function renderCompare(main) {
    var p = state.project, tol = E.tolerableOf(p);
    main.appendChild(h("h1", { class: "page-title", text: "Risk comparison" }));
    main.appendChild(pageSub("compare", "Compare each zone's and conduit's initial risk with tolerable risk, and decide where a detailed assessment is needed."));
    main.appendChild(h("div", { class: "framing-note", text: "The method used here compares each zone and conduit; " + E.CONDUIT_RULE + "." }));
    if (!p.zones.length && !p.conduits.length) { main.appendChild(card("No zones", null, [h("p", { class: "muted", text: "Define zones in step 3 first." })])); return; }

    var owners = p.zones.map(function (z) { return { o: z, isZone: true }; }).concat(p.conduits.map(function (c) { return { o: c, isZone: false }; }));
    var rows = owners.map(function (x) { x.cmp = E.comparison(x.o, p); return x; });
    var suggested = rows.filter(function (x) { return x.cmp.state === "suggested"; });
    var tbl = h("table", { class: "tbl cmp-table" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Zone or conduit" }), h("th", { text: "Initial risk", style: "width:170px" }),
      h("th", { text: "Against tolerable", style: "width:130px" }), h("th", { text: "Detailed assessment", style: "width:300px" })
    ])])]);
    var tb = h("tbody");
    rows.forEach(function (x) {
      var o = x.o, cmp = x.cmp;
      var name = o.id + (o.name ? ": " + o.name : "") + (x.isZone ? "" : " (" + (o.fromZone || "?") + " ↔ " + (o.toZone || "?") + ")");
      tb.appendChild(h("tr", { "data-owner-id": o.id, "data-compare-state": cmp.state }, [
        h("td", { text: name }),
        initialCell(o, cmp, x.isZone),
        h("td", { class: cmp.suggested ? "val-warn" : "muted", text: comparisonWords(cmp) }),
        h("td", null, [decisionControl(o, cmp)])
      ]));
    });
    tbl.appendChild(tb);
    var open = rows.filter(function (x) { return x.cmp.open; }).length;
    main.appendChild(card("Initial risk against tolerable risk", "tolerable risk: " + BAND_NAME[tol].toLowerCase() + (open ? ", " + open + " to decide" : ""), [
      suggested.length ? h("div", { class: "btn-row no-print", style: "margin-bottom:10px" }, [
        h("button", { type: "button", class: "btn sm", "data-action": "confirm-compare", text: "Confirm suggested (" + suggested.length + ")", onClick: function () {
          suggested.forEach(function (x) { setDetailed(x.o, x.cmp.suggested); });
          touched(); rerender();
        } })
      ]) : null,
      tbl,
      h("p", { class: "hint", style: "margin-top:8px", text: "Not required skips step 5: set the SL-T by hand and give its basis in the justification." })
    ]));
  }

  // ---------- Home ----------

  var STEPS = [
    { id: "basis", label: "Engagement and evidence" },
    { id: "suc", num: "1", label: "Scope and risk criteria" },
    { id: "srs", num: "2", label: "High-level risk" },
    { id: "zones", num: "3", label: "Zones and conduits" },
    { id: "compare", num: "4", label: "Risk comparison" },
    { id: "risk", num: "5", label: "Detailed risk" },
    { id: "spec", num: "6", label: "Requirements specification" },
    { id: "approval", num: "7", label: "Approval" },
    { id: "review", label: "Check and issue" }
  ];
  function renderHome(main) {
    var p = state.project, st = E.stepStatus(p), type = p.assessmentType || null;
    main.appendChild(h("h1", { class: "page-title", text: p.suc.name || "Risk assessment" }));
    main.appendChild(h("p", { class: "page-sub", text: A.isTour() ? "The demo: a completed assessment. Autosave is off." : "Choose the kind of assessment, then work through the steps." }));

    var kinds = [
      { id: "high-level", text: "High-level assessment only", hint: "The ranking and its report, with no zones." },
      { id: "full", text: "Full assessment", hint: "Zones, conduits, the detailed risk and SL-T." }
    ];
    main.appendChild(card("Assessment", null, [
      h("div", { class: "home-kinds", role: "group", "aria-label": "Kind of assessment" }, kinds.map(function (k) {
        var on = type === k.id;
        return h("button", { type: "button", class: "home-kind" + (on ? " on" : ""), "data-assessment-type": k.id, "aria-pressed": on ? "true" : "false",
          onClick: function () { p.assessmentType = k.id; touched(); rerender(); } }, [
          h("strong", { text: k.text }), h("span", { class: "muted", text: k.hint })
        ]);
      }))
    ]));

    var list = h("ol", { class: "home-steps" }, STEPS.map(function (s) {
      var x = st[s.id] || { state: "empty", text: "" };
      return h("li", { "data-stage": s.id, "data-status": x.state }, [
        h("button", { type: "button", class: "home-step", onClick: function () { A.navigate(s.id); } }, [
          h("span", { class: "home-step-name" }, [s.num ? h("span", { class: "nav-num", text: s.num }) : null, (s.num ? " " : "") + s.label]),
          h("span", { class: "nav-status", "data-status": x.state, text: x.text })
        ])
      ]);
    }));
    main.appendChild(card("Steps", null, [list]));

    if (!A.isTour()) {
      main.appendChild(h("div", { class: "btn-row no-print" }, [
        h("button", { type: "button", class: "btn", id: "home-demo", text: "Open the demo", onClick: function () { A.openDemo(); } })
      ]));
    }
  }

  var P = R.Pages;
  P.home = renderHome;
  P.suc = renderSuc; P.srs = renderSrs; P.basis = renderBasis;
  P.compare = renderCompare;
  // Step 5 (risk, slt) is js/ui-risk.js.
}());
