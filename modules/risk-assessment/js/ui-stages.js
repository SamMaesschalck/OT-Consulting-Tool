/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-stages.js — the workflow pages and the Basis of assessment page.
 *
 * 1 System under consideration (suc), 2 High-level risk and requirements
 * (srs, with "Detail →" promoting a ranked system to a zone), 3 Zones and
 * conduits (zones), 4 Detailed risk assessment (risk, with the treatment
 * decision per threat) and 5 SL-T assignment (slt), plus basis. Each page
 * registers itself in RiskApp.Pages for js/app.js to draw. The detailed risk
 * page reads its per-threat facts from js/view-model.js.
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
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "System under consideration" }));
    main.appendChild(pageSub("suc", "Define the SUC, its boundary and every access point."));
    main.appendChild(card("SUC definition", null, [
      textField("SUC name", p.suc.name, function (v) { p.suc.name = v; touched(); }, { placeholder: "e.g. Riverside Works process control system" }),
      textField("Description", p.suc.description, function (v) { p.suc.description = v; touched(); }, { textarea: true, placeholder: "Function and intended usage of the SUC." }),
      textField("Scope statement / boundary", p.suc.scopeStatement, function (v) { p.suc.scopeStatement = v; touched(); }, { textarea: true, placeholder: "What is inside and outside the boundary, and the access points across it.", hint: "Name the exclusions, e.g. corporate IT or third-party packages." }),
      lineListField("Operating-environment assumptions", p.suc.assumptions, function (a) { p.suc.assumptions = a; touched(); }, "e.g. Physical access to the equipment room is controlled")
    ]));
  }

  // ---------- Stage 2: high-level risk assessment and requirements ----------

  // Promote a ranked system into a single-system zone carrying the detailed
  // assessment. The zone is pre-filled from the ranking and seeded with a
  // starting threat at the ranked impact/likelihood, so the detailed work
  // continues where the high-level assessment left off.
  function zoneFromHLA(assetId) { for (var i = 0; i < state.project.zones.length; i++) if (state.project.zones[i].fromHLA === assetId) return state.project.zones[i]; return null; }

  function promoteAssetToZone(asset) {
    var p = state.project;
    var existing = zoneFromHLA(asset.id);
    if (existing) { state.stage = "risk"; render(); toast("Already promoted to " + existing.id + ". Continue its detailed assessment here."); return; }
    p.counters.zone += 1;
    var z = M.emptyZone(p.counters.zone);
    z.name = asset.name || ("System " + asset.id);
    z.fn = asset.functionLocation || "";
    z.description = "Promoted from high-level ranking item " + asset.id + (asset.note ? " (" + asset.note + ")" : "") + ".";
    z.fromHLA = asset.id;
    if (asset.name) z.assets.push({ name: asset.name, type: "other" });
    if (asset.consequence || asset.likelihood) {
      p.counters.threat += 1;
      var t = M.emptyThreat(p.counters.threat);
      t.statement = "(Seeded from the high-level ranking: refine the threat statement, source and affected FRs.)";
      t.impact = asset.consequence || "";
      t.likelihood = asset.likelihood || "";
      z.threats.push(t);
    }
    p.zones.push(z);
    touched();
    state.stage = "risk";
    render();
    toast("Created " + z.id + " from “" + (asset.name || asset.id) + "”. Complete its detailed assessment here.");
  }

  function renderSrs(main) {
    var p = state.project, s = p.srs;
    main.appendChild(h("h1", { class: "page-title", text: "High-level risk & requirements" }));
    main.appendChild(pageSub("srs", "Rank the systems to frame the zoning, and set the requirements, including tolerable risk."));

    main.appendChild(card("High-level risk assessment", "context for the zoning; nothing here is calculated", [
      selectField("Assumed adversary class (threat context)", s.adversaryClass, Object.keys(RULES.slDefinitions).filter(function (k) { return k !== "_note"; }).map(function (k) { return { value: k, text: "SL" + k + "-grade: " + RULES.slDefinitions[k] }; }), function (v) { s.adversaryClass = v ? Number(v) : null; touched(); rerender(); }, { hint: "Per-FR suggestions below this class are flagged as a mismatch." }),
      textField("Essential functions", s.essentialFunctions, function (v) { s.essentialFunctions = v; touched(); }, { textarea: true, placeholder: "What the system must keep doing (production, safety, quality, compliance)." }),
      textField("Worst-case consequences", s.worstCase, function (v) { s.worstCase = v; touched(); }, { textarea: true, placeholder: "The worst credible outcome, e.g. from the PHA/HAZOP." })
    ]));

    // Relative risk ranking: rate each asset/system so the ranking drives how
    // assets are grouped into zones. Worst-credible impact plus (optional)
    // likelihood give a house risk band.
    var sevOpts = SEV.map(function (sv) { return { value: sv.id, text: sv.name }; });
    var likOpts = LIK.map(function (l) { return { value: l.id, text: l.name }; });
    main.appendChild(card("Asset / system risk ranking", "HSE & financial impact by function/location, ranked to guide zoning", [
      h("p", { class: "hint", style: "margin-top:0", text: "Rate each system's worst-credible impact and, where known, its likelihood." }),
      registerTable(s.highLevelAssets, [
        { key: "name", label: "Asset / system", placeholder: "e.g. DCS servers", width: "18%" },
        { key: "functionLocation", label: "Function & location", placeholder: "e.g. Primary control, equipment room" },
        { key: "consequence", label: "Impact", kind: "select", options: sevOpts, width: "110px" },
        { key: "likelihood", label: "Likelihood", kind: "select", options: likOpts, width: "110px" },
        { key: "__risk", label: "Risk", kind: "computed", width: "88px", render: function (it) { return riskPill(riskFor(it.consequence, it.likelihood)); } },
        { key: "note", label: "Candidate grouping / notes", placeholder: "e.g. → Process Control zone" },
        { key: "__promote", label: "Detailed", kind: "computed", width: "96px", render: function (it) {
          var z = zoneFromHLA(it.id);
          if (z) return h("span", { class: "pill neutral", title: "Detailed assessment is in " + z.id, text: z.id + " ✓" });
          return h("button", { class: "btn sm", title: "Make it a zone and assess it in detail", text: "Detail →", onClick: function () { promoteAssetToZone(it); } });
        } }
      ], { empty: "No assets ranked yet. Add the systems in scope to build the relative risk ranking.", addLabel: "+ Add asset / system", rowLabel: "ranked system", onAdd: function () { p.counters.hla += 1; s.highLevelAssets.push(M.emptyHLA(p.counters.hla)); touched(); rerender(); } }),
      h("div", { class: "btn-row", style: "margin-top:12px" }, [
        h("button", { class: "btn", text: "Generate high-level report →", title: "No zones or SL-T needed", onClick: function () { state.stage = "hlreport"; render(); } })
      ])
    ]));

    var body = [
      selectField("Tolerable risk", s.tolerableRisk, BANDS.map(function (b) { return { value: b.id, text: b.name }; }), function (v) { s.tolerableRisk = v || RULES.tolerableRisk.default; touched(); rerender(); }, { placeholder: false, hint: "The highest unmitigated risk accepted without a treatment decision." }),
      lineListField("Known or presumed threats", s.knownThreats, function (a) { s.knownThreats = a; touched(); }, "e.g. Capable criminal adversary; insider misuse of engineering access"),
      lineListField("Security functions that must be kept", s.mandatorySecurityFunctions, function (a) { s.mandatorySecurityFunctions = a; touched(); }, "e.g. Hard-wired ESD independent of the BPCS"),
      lineListField("Regulatory requirements", s.regulatory, function (a) { s.regulatory = a; touched(); }, "e.g. UK NIS Regulations 2018"),
      h("div", { class: "field" }, [
        h("label", { text: "Client risk criteria" }),
        h("label", { style: "text-transform:none;font-weight:400;font-size:13px;color:var(--text);display:inline-flex;align-items:center;gap:6px;cursor:pointer" }, [
          h("input", { type: "checkbox", checked: s.clientMatrix, onChange: function (e) { s.clientMatrix = e.target.checked; touched(); rerender(); } }),
          "The client's own risk matrix or criteria are in use"
        ]),
        h("div", { class: "hint", text: "The client's matrix takes precedence over the SolutionsPT house matrix." })
      ])
    ];
    if (s.clientMatrix) body.push(textField("How the client matrix was applied", s.clientMatrixNote, function (v) { s.clientMatrixNote = v; touched(); }, { textarea: true }));
    main.appendChild(card("Risk criteria and requirements", null, body));
  }

  // ---------- Basis of assessment (evidence register) ----------

  function renderBasis(main) {
    var b = state.project.basisOfAssessment, p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Basis of assessment" }));
    main.appendChild(h("p", { class: "page-sub", text: "The evidence behind the assessment, as printed in the report." }));

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

  // ---------- Stage 3: Zones & conduits ----------

  function renderZones(main) {
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Zones & conduits" }));
    main.appendChild(pageSub("zones", "Partition the SUC into zones and conduits, keeping safety, wireless and temporarily connected devices separate; EXT is anything outside the SUC."));

    p.zones.forEach(function (z, zi) {
      var assetsBox = h("div", null, []);
      z.assets.forEach(function (a, ai) {
        var typeSel = h("select", { onChange: function (e) { a.type = e.target.value; touched(); rerender(); } });
        ASSET_TYPES.forEach(function (t) { var o = h("option", { value: t, text: assetTypeLabel(t) }); if (a.type === t) o.setAttribute("selected", "selected"); typeSel.appendChild(o); });
        assetsBox.appendChild(h("div", { class: "asset-row" }, [
          h("input", { type: "text", value: a.name, placeholder: "Asset name", onInput: function (e) { a.name = e.target.value; touched(); } }),
          typeSel,
          h("button", { class: "btn sm danger", text: "Remove", onClick: function () {
            if (!confirmRemove(!!a.name, "asset")) return;
            z.assets.splice(ai, 1); touched(); rerender();
          } })
        ]));
      });
      assetsBox.appendChild(h("button", { class: "btn sm", text: "+ Add asset", onClick: function () { z.assets.push({ name: "", type: "plc" }); touched(); rerender(); } }));

      main.appendChild(card(z.id + (z.name ? ": " + z.name : ""), zoneSafety(z) ? "safety-related" : null, [
        h("div", { class: "grid-2" }, [
          textField("Zone name", z.name, function (v) { z.name = v; touched(); }),
          textField("Function", z.fn, function (v) { z.fn = v; touched(); }, { placeholder: "e.g. basic process control, safety, DMZ" })
        ]),
        textField("Description / logical boundary", z.description, function (v) { z.description = v; touched(); }, { textarea: true }),
        h("div", { class: "field" }, [h("label", { text: "Assets" }), assetsBox]),
        h("div", { class: "grid-2" }, [
          lineListField("Access points & boundary devices", z.accessPoints, function (a) { z.accessPoints = a; touched(); }, "e.g. Vendor VPN (C2); Historian replication (C3)"),
          lineListField("External dependencies", z.externalDependencies, function (a) { z.externalDependencies = a; touched(); }, "e.g. Vendor support contract")
        ]),
        lineListField("Applicable security policies", z.securityPolicies, function (a) { z.securityPolicies = a; touched(); }, "e.g. No engineering changes without MoC"),
        flagEditor(z)
      ], h("button", { class: "btn sm danger", text: "Remove zone", onClick: function () {
        if (!confirm("Remove zone " + z.id + (z.name ? " (" + z.name + ")" : "") + "? Conduits referencing it will also be removed.")) return;
        p.zones.splice(zi, 1);
        p.conduits = p.conduits.filter(function (c) { return c.fromZone !== z.id && c.toZone !== z.id; });
        touched(); rerender();
      } })));
    });

    main.appendChild(h("div", { class: "btn-row", style: "margin-bottom:18px" }, [
      h("button", { class: "btn primary", text: "+ Add zone", onClick: function () { p.counters.zone += 1; p.zones.push(M.emptyZone(p.counters.zone)); touched(); rerender(); } })
    ]));

    // Conduits
    var condBody = [];
    if (p.conduits.length) {
      var tbl = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
        h("th", { text: "Id" }), h("th", { text: "From" }), h("th", { text: "To" }), h("th", { text: "Name" }), h("th", { text: "Channels / dataflows" }), h("th", { text: "Notes" }), h("th", { text: "" })
      ])])]);
      var tbody = h("tbody");
      p.conduits.forEach(function (c, ci) {
        var zoneSel = function (key) {
          var sel = h("select", { onChange: function (e) { c[key] = e.target.value; touched(); rerender(); } });
          sel.appendChild(h("option", { value: "", text: "—" }));
          p.zones.forEach(function (z) { var o = h("option", { value: z.id, text: z.id + (z.name ? " " + z.name : "") }); if (c[key] === z.id) o.setAttribute("selected", "selected"); sel.appendChild(o); });
          var ext = h("option", { value: "EXT", text: "EXT (external)" }); if (c[key] === "EXT") ext.setAttribute("selected", "selected"); sel.appendChild(ext);
          return sel;
        };
        tbody.appendChild(h("tr", null, [
          h("td", { text: c.id }),
          h("td", null, [zoneSel("fromZone")]),
          h("td", null, [zoneSel("toZone")]),
          h("td", null, [h("input", { type: "text", value: c.name, onInput: function (e) { c.name = e.target.value; touched(); } })]),
          h("td", null, [h("input", { type: "text", value: c.channels.join(", "), placeholder: "e.g. opc-ua, vpn", onInput: function (e) { c.channels = e.target.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); touched(); } })]),
          h("td", null, [h("input", { type: "text", value: c.notes, onInput: function (e) { c.notes = e.target.value; touched(); } })]),
          h("td", null, [h("button", { class: "btn sm danger", text: "×", title: "Remove conduit", onClick: function () {
            var filled = !!(c.name || c.fromZone || c.toZone || (c.channels && c.channels.length) || c.notes || c.threats.length || c.vulnerabilities.length || c.countermeasures.length);
            if (!confirmRemove(filled, "conduit " + c.id)) return;
            p.conduits.splice(ci, 1); touched(); rerender();
            if (filled) toast("Conduit " + c.id + " removed.");
          } })])
        ]));
      });
      tbl.appendChild(tbody);
      condBody.push(tbl);
    } else {
      condBody.push(h("p", { class: "muted", text: "No conduits yet: add one for each connection between zones or to EXT." }));
    }
    condBody.push(h("div", { style: "margin-top:10px" }, [h("button", { class: "btn", text: "+ Add conduit", onClick: function () { p.counters.conduit += 1; p.conduits.push(M.emptyConduit(p.counters.conduit)); touched(); rerender(); } })]));
    main.appendChild(card("Conduits", "channels between zones; EXT = external", condBody));

    main.appendChild(card("Zone & conduit drawing", "drawn automatically from the zones and conduits", [renderZoneMap(p)]));
  }

  // ---------- Stage 4: detailed risk assessment ----------

  // The treatment decision for a threat above tolerable risk: three choices,
  // one click each. A suggestion carried over from an older file shows dashed
  // and worded as such until the consultant clicks it (or Confirm suggested).
  var TREATMENT_CHOICES = [
    { id: "reduce", text: "Reduce with countermeasures" },
    { id: "accept", text: "Accept" },
    { id: "slt", text: "Treat through the SL-T" }
  ];
  function setTreatment(t, decision) {
    if (!t.treatment) t.treatment = M.emptyTreatment();
    // Clicking the confirmed choice again takes the decision back.
    if (t.treatment.decision === decision && t.treatment.confirmed) { t.treatment.decision = null; t.treatment.confirmed = false; }
    else { t.treatment.decision = decision; t.treatment.confirmed = true; }
  }
  // x: the threat's row in the view model (js/view-model.js).
  function treatmentChoice(x) {
    var t = x.t, T = x.treatment;
    var status = null;
    if (T.state === "none") status = h("span", { class: "val-warn treat-status", text: "No decision yet." });
    else if (T.state === "suggested") status = h("span", { class: "treat-status", text: "Suggested, not confirmed." });
    else if (T.gap) status = h("span", { class: "val-warn treat-status", text: T.gap.charAt(0).toUpperCase() + T.gap.slice(1) + "." });
    else if (T.decision === "reduce") status = h("span", { class: "muted treat-status", text: "Addressed by " + T.covering.map(function (m) { return m.id; }).join(", ") + "." + (T.residual && !T.residualWithin ? " Residual risk is still above tolerable." : "") });
    // One reason field, worded for what the SL-T lacks.
    var sltWhy = [];
    if (T.sltUnset.length) sltWhy.push("no SL-T is set" + (t.affectedFR.length ? " (" + T.sltUnset.join(", ") + ")" : ""));
    if (T.sltBelow.length) sltWhy.push("the SL-T is below the suggestion (" + T.sltBelow.join(", ") + ")");
    var kids = [h("div", { class: "treat-row" }, [
      h("div", { class: "treat-opts", role: "group", "aria-label": "Treatment decision" }, TREATMENT_CHOICES.map(function (c) {
        var on = T.decision === c.id;
        return h("button", {
          type: "button", "data-decision": c.id,
          class: "treat-opt" + (on ? (T.confirmed ? " on" : " suggested") : ""),
          "aria-pressed": on && T.confirmed ? "true" : "false",
          text: (on ? (T.confirmed ? "✓ " : "? ") : "") + c.text,
          onClick: function () { setTreatment(t, c.id); touched(); rerender(); }
        });
      })),
      status
    ])];
    if (T.decision === "accept" || (t.acceptance || "").trim()) {
      kids.push(h("div", { class: "field", style: "margin:8px 0 0" }, [
        h("label", { text: "Reason for acceptance" }),
        h("input", { type: "text", "data-reason": "accept", value: t.acceptance, placeholder: "e.g. Accepted by J. Smith (Operations Director), 2026-07: production constraint; revisit at next assessment.", onInput: function (e) { t.acceptance = e.target.value; touched(); }, onChange: function () { rerender(); } })
      ]));
    }
    if (T.decision === "slt" && (T.sltShortfall.length || T.reason)) {
      kids.push(h("div", { class: "field", style: "margin:8px 0 0" }, [
        h("label", { text: sltWhy.length ? "Reason " + sltWhy.join(" and ") : "Reason for treating through the SL-T" }),
        h("input", { type: "text", "data-reason": "slt", value: t.treatment.reason, placeholder: "e.g. Raised in phase 2 of the programme, agreed with the asset owner.", onInput: function (e) { t.treatment.reason = e.target.value; touched(); }, onChange: function () { rerender(); } })
      ]));
    }
    return h("div", { class: "treat", "data-treatment-state": T.state }, kids);
  }

  // Residual-risk capture for an over-tolerable threat. Optional: leaving
  // both blank means the threat is untreated and the unmitigated risk stands.
  function residualEditor(t, tolerable) {
    var rb = residualRisk(t);
    var status = rb
      ? h("div", { style: "margin-top:4px;font-size:13px" }, [
          h("strong", { text: "Residual risk: " }), riskPill(rb),
          exceedsTolerable(rb, tolerable)
            ? h("span", { class: "val-warn", text: "  still above tolerable risk (" + BAND_NAME[tolerable].toLowerCase() + ")." })
            : h("span", { class: "muted", text: "  within tolerable risk (" + BAND_NAME[tolerable].toLowerCase() + ")." })
        ])
      : h("div", { class: "hint", style: "margin-top:2px", text: "Rate it once the countermeasures are implemented." });
    return h("div", { class: "field", style: "margin:8px 0 0" }, [
      h("label", { text: "Residual risk with countermeasures in place (optional)" }),
      h("div", { class: "threat-grid" }, [
        selectField("Residual likelihood", t.residualLikelihood, LIK.map(function (l) { return { value: l.id, text: l.name }; }), function (v) { t.residualLikelihood = v; touched(); rerender(); }, { placeholderText: "Unchanged" }),
        selectField("Residual impact", t.residualImpact, SEV.map(function (sv) { return { value: sv.id, text: sv.name }; }), function (v) { t.residualImpact = v; touched(); rerender(); }, { placeholderText: "Unchanged" })
      ]),
      status
    ]);
  }

  // row: the zone's or conduit's row in the view model.
  function threatEditor(row, project, tolerable) {
    var owner = row.o;
    var box = h("div", null, []);
    row.threats.forEach(function (x, ti) {
      var t = x.t, band = x.risk, exceeds = x.exceeds;
      box.appendChild(h("div", { class: "threat-card", "data-threat-id": t.id }, [
        h("div", { class: "threat-head" }, [
          h("span", { class: "tid", text: t.id }),
          h("span", null, [riskPill(band), exceeds ? h("span", { class: "pill flag", style: "margin-left:6px", text: "exceeds tolerable" }) : null]),
          h("button", { class: "btn sm danger", text: "Remove", onClick: function () {
            var filled = !!(t.statement || t.source || t.likelihood || t.impact || (t.affectedFR && t.affectedFR.length));
            if (!confirmRemove(filled, "threat " + t.id)) return;
            owner.threats.splice(ti, 1); touched(); rerender();
            if (filled) toast("Threat " + t.id + " removed.");
          } })
        ]),
        h("div", { class: "field", style: "margin-bottom:8px" }, [
          h("label", { text: "Threat statement (source → asset → entry point → means → outcome)" }),
          h("textarea", { value: t.statement, placeholder: "e.g. An external attacker reuses the standing vendor VPN to reach the PLCs and manipulate control.", onInput: function (e) { t.statement = e.target.value; touched(); } })
        ]),
        h("div", { class: "threat-grid" }, [
          h("div", { class: "field", style: "margin:0" }, [h("label", { text: "Threat source" }), h("input", { type: "text", value: t.source, placeholder: "e.g. External attacker via vendor tunnel", onInput: function (e) { t.source = e.target.value; touched(); } })]),
          h("div", { class: "field", style: "margin:0" }, [h("label", { text: "Affected foundational requirements" }), frChips(t.affectedFR, function (fr) { var i = t.affectedFR.indexOf(fr); if (i >= 0) t.affectedFR.splice(i, 1); else t.affectedFR.push(fr); touched(); rerender(); })])
        ]),
        h("div", { class: "threat-grid", style: "margin-top:8px" }, [
          selectField("Unmitigated likelihood", t.likelihood, LIK.map(function (l) { return { value: l.id, text: l.name }; }), function (v) { t.likelihood = v; touched(); rerender(); }, { hint: t.likelihood ? (LIK.filter(function (l) { return l.id === t.likelihood; })[0] || {}).note : "How likely the threat is to be realised before any countermeasure is counted." }),
          selectField("Impact of the worst credible consequence", t.impact, SEV.map(function (sv) { return { value: sv.id, text: sv.name }; }), function (v) { t.impact = v; touched(); rerender(); }, { hint: t.impact ? (SEV.filter(function (sv) { return sv.id === t.impact; })[0] || {}).note : "Worst credible consequence across safety / environment / operations / financial / regulatory." })
        ]),
        h("div", { style: "margin-top:6px;font-size:13px" }, [
          h("strong", { text: "Unmitigated risk: " }), riskPill(band),
          band ? h("span", { class: "muted", text: "  = impact × likelihood" }) : h("span", { class: "muted", text: "  (set likelihood and impact)" })
        ]),
        exceeds ? treatmentChoice(x) : null,
        (exceeds || t.residualLikelihood || t.residualImpact) ? residualEditor(t, tolerable) : null
      ]));
    });
    box.appendChild(h("button", { class: "btn sm", text: "+ Add threat", onClick: function () { project.counters.threat += 1; owner.threats.push(M.emptyThreat(project.counters.threat)); touched(); rerender(); } }));
    return box;
  }

  function vulnEditor(owner, project) {
    var box = h("div", null, []);
    owner.vulnerabilities.forEach(function (v, vi) {
      box.appendChild(h("div", { class: "line-row" }, [
        h("span", { class: "muted", style: "min-width:28px", text: v.id }),
        h("input", { type: "text", value: v.description, placeholder: "Known vulnerability in an access point or contained asset", onInput: function (e) { v.description = e.target.value; touched(); } }),
        h("button", { class: "btn sm danger", text: "×", onClick: function () {
          if (!confirmRemove(!!v.description, "vulnerability")) return;
          owner.vulnerabilities.splice(vi, 1); touched(); rerender();
        } })
      ]));
    });
    box.appendChild(h("button", { class: "btn sm", text: "+ Add vulnerability", onClick: function () { project.counters.vuln += 1; owner.vulnerabilities.push(M.emptyVulnerability(project.counters.vuln)); touched(); rerender(); } }));
    return box;
  }

  function cmEditor(owner, project) {
    var box = h("div", null, []);
    owner.countermeasures.forEach(function (m, mi) {
      box.appendChild(h("div", { class: "threat-card" }, [
        h("div", { class: "threat-head" }, [h("span", { class: "tid", text: m.id }), h("button", { class: "btn sm danger", text: "Remove", onClick: function () {
          var filled = !!(m.description || (m.addressesFR && m.addressesFR.length) || m.reference);
          if (!confirmRemove(filled, "countermeasure " + m.id)) return;
          owner.countermeasures.splice(mi, 1); touched(); rerender();
          if (filled) toast("Countermeasure " + m.id + " removed.");
        } })]),
        h("div", { class: "field", style: "margin-bottom:8px" }, [h("label", { text: "Countermeasure" }), h("input", { type: "text", value: m.description, placeholder: "e.g. Broker vendor access via a DMZ jump host; remove the standing tunnel.", onInput: function (e) { m.description = e.target.value; touched(); } })]),
        h("label", { style: "display:inline-flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-bottom:8px" }, [
          h("input", { type: "checkbox", checked: !!m.existing, onChange: function (e) { m.existing = e.target.checked; touched(); rerender(); } }),
          h("span", { text: "Existing countermeasure (already in place)" })
        ]),
        h("div", { class: "threat-grid" }, [
          h("div", { class: "field", style: "margin:0" }, [h("label", { text: "Addresses foundational requirements" }), frChips(m.addressesFR, function (fr) { var i = m.addressesFR.indexOf(fr); if (i >= 0) m.addressesFR.splice(i, 1); else m.addressesFR.push(fr); touched(); rerender(); })]),
          h("div", { class: "field", style: "margin:0" }, [h("label", { text: "62443-3-3 reference" }), h("input", { type: "text", value: m.reference, placeholder: "e.g. SR 1.13, SR 5.1", onInput: function (e) { m.reference = e.target.value; touched(); } })])
        ])
      ]));
    });
    box.appendChild(h("button", { class: "btn sm", text: "+ Add countermeasure", onClick: function () { project.counters.cm += 1; owner.countermeasures.push(M.emptyCountermeasure(project.counters.cm)); touched(); rerender(); } }));
    return box;
  }

  function detailedRiskCard(row, project, tolerable, label) {
    var owner = row.o;
    var worst = row.worstRisk;
    var exceeding = row.exceeding, open = row.open, suggested = row.suggested;
    var head = [];
    if (worst) head.push(riskPill(worst));
    if (exceeding.length) head.push(h("span", { class: "pill flag", style: "margin-left:6px", text: exceeding.length + " over tolerable" }));
    return card(label, null, [
      h("div", { class: "field" }, [
        h("label", { text: "Threats: likelihood × impact = unmitigated risk" }),
        exceeding.length ? h("div", { class: "hint treat-summary" + (open.length ? " val-warn" : ""), style: "margin-bottom:6px" }, [
          h("span", { text: open.length
            ? open.length + " of " + exceeding.length + " threat" + (exceeding.length === 1 ? "" : "s") + " above tolerable risk need" + (open.length === 1 ? "s" : "") + " a treatment decision."
            : "Every threat above tolerable risk has a treatment decision." }),
          suggested.length ? h("button", { type: "button", class: "btn sm", style: "margin-left:8px", "data-action": "confirm-suggested", text: "Confirm suggested (" + suggested.length + ")", onClick: function () {
            suggested.forEach(function (x) { x.t.treatment.confirmed = true; });
            touched(); rerender();
          } }) : null
        ]) : null,
        threatEditor(row, project, tolerable)
      ]),
      h("div", { class: "field" }, [h("label", { text: "Vulnerabilities" }), vulnEditor(owner, project)]),
      h("div", { class: "field" }, [
        h("label", { text: "Countermeasures" }),
        h("div", { class: "hint no-print", style: "margin-bottom:6px", text: "Tick Existing countermeasure for those already in place." }),
        cmEditor(owner, project)
      ])
    ], head.length ? h("span", null, head) : null, { "data-owner-id": owner.id });
  }

  function renderRisk(main) {
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Detailed risk assessment" }));
    main.appendChild(pageSub("risk", "Rate the threats to each zone and conduit, compare with tolerable risk and record a treatment decision where it is exceeded."));
    main.appendChild(h("div", { class: "framing-note", text: "SolutionsPT house risk matrix, not the standard's; tolerable risk is " + (p.srs.tolerableRisk || "medium") + " (stage 2)." }));

    if (!p.zones.length) { main.appendChild(card("No zones", null, [h("p", { class: "muted", text: "Define zones in stage 3 first." })])); return; }

    var vm = R.ViewModel.build(p);
    vm.zones.forEach(function (row) { var z = row.o; main.appendChild(detailedRiskCard(row, p, vm.tolerable, z.id + (z.name ? ": " + z.name : ""))); });

    if (p.conduits.length) {
      main.appendChild(h("h1", { class: "page-title", style: "font-size:18px;margin-top:24px", text: "Conduits" }));
      main.appendChild(h("p", { class: "page-sub", text: "A conduit's SL-T suggestion is the higher of its own threats and its connected zones." }));
      vm.conduits.forEach(function (row) { var c = row.o; main.appendChild(detailedRiskCard(row, p, vm.tolerable, c.id + (c.name ? ": " + c.name : "") + " (" + (c.fromZone || "?") + " ↔ " + (c.toZone || "?") + ")")); });
    }
  }

  // ---------- Stage 5: SL-T assignment (per FR) ----------

  function sltVectorCard(owner, sug, project, label, safety) {
    var tbl = h("table", { class: "tbl fr-slt-table" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "FR", style: "width:52px" }), h("th", { text: "Foundational requirement" }),
      h("th", { text: "Risk", class: "center", style: "width:90px" }), h("th", { text: "Suggested", class: "center", style: "width:90px" }),
      h("th", { text: "Final SL-T", style: "width:320px" })
    ])])]);
    var tb = h("tbody");
    FRS.forEach(function (f) {
      var cell = sug.byFR[f.id];
      tb.appendChild(h("tr", null, [
        h("td", null, [h("strong", { text: f.id })]),
        h("td", null, [f.name, traceDetails(cell.trace)]),
        h("td", { class: "center" }, [riskPill(cell.risk)]),
        h("td", { class: "center", text: cell.sl != null ? "SL" + cell.sl : "—" }),
        h("td", null, [slButtonsFR(owner.slTargetByFR[f.id], function (n) { owner.slTargetByFR[f.id] = n; touched(); rerender(); })])
      ]));
    });
    tbl.appendChild(tb);

    var body = [];
    if (safety && SIS_RULE) body.push(h("div", { class: "sis-box" }, [h("strong", { text: "SIS handling: " }), SIS_RULE.actions[0] + " An SL" + SIS_RULE.floorSL + " floor is applied to every FR."]));
    body.push(tbl);
    var tgt = maxDefined(owner.slTargetByFR);
    var needsJust = tgt != null && !(owner.justification || "").trim();
    body.push(h("div", { class: "field", style: "margin-top:12px" }, [
      h("label", null, [document.createTextNode("Justification "), h("span", { class: "req-star", text: "*" })]),
      h("textarea", { value: owner.justification, placeholder: "Why this SL-T is right, including any FR held below its suggestion.", onInput: function (e) { owner.justification = e.target.value; touched(); }, onChange: function () { rerender(); } }),
      needsJust
        ? h("div", { class: "hint val-warn", text: "SL-T set but not justified: say why, especially for any FR below its suggestion." })
        : h("div", { class: "hint", text: "Required." })
    ]));

    var headPill = tgt == null
      ? h("span", { class: "pill neutral", text: "SL-T not set" })
      : (needsJust ? h("span", { class: "pill flag", text: "SL-T≤" + tgt + " · needs justification" })
                   : h("span", { class: "pill exceeds", text: "SL-T≤" + tgt }));
    return card(label, null, body, headPill, { "data-owner-id": owner.id });
  }

  function renderSlt(main) {
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "SL-T assignment" }));
    main.appendChild(pageSub("slt", "Set one target security level per foundational requirement, and justify it."));
    main.appendChild(h("div", { class: "framing-note", text: "Suggestions are a SolutionsPT house heuristic, not the standard's; an SL-T below one is fine if justified." }));

    if (!p.zones.length) { main.appendChild(card("No zones", null, [h("p", { class: "muted", text: "Define zones in stage 3 first." })])); return; }

    p.zones.forEach(function (z) { var s = E.suggestZone(z, p); main.appendChild(sltVectorCard(z, s, p, z.id + (z.name ? ": " + z.name : ""), s.safetyRelated)); });

    if (p.conduits.length) {
      main.appendChild(h("h1", { class: "page-title", style: "font-size:18px;margin-top:24px", text: "Conduits" }));
      p.conduits.forEach(function (c) { var s = E.suggestConduit(c, p); main.appendChild(sltVectorCard(c, s, p, c.id + (c.name ? ": " + c.name : "") + " (" + (c.fromZone || "?") + " ↔ " + (c.toZone || "?") + ")", false)); });
    }
  }

  var P = R.Pages;
  P.suc = renderSuc; P.srs = renderSrs; P.basis = renderBasis;
  P.zones = renderZones; P.risk = renderRisk; P.slt = renderSlt;
}());
