/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-reports.js — the report pages and the downloads.
 *
 * The High-level report page (hlreport) and Full report & export (review),
 * the asset owner's sign-off card both carry, the risk-context export and
 * the Word and Excel downloads with the one question asked before them.
 * Registers its pages in RiskApp.Pages, with the three pages other files
 * draw: peer (js/review.js), report (js/report-page.js) and wordpreview
 * (js/word-preview.js). RiskApp.Reports holds what the header buttons and
 * window.RiskTool call.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Reports = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var RULES = M.RULES, FR_IDS = M.FR_IDS, BAND_RANK = M.BAND_RANK, INTERCHANGE = M.INTERCHANGE, TOOL_ID = M.TOOL_ID;
  var state = A.state, touched = A.touched, rerender = A.rerender, render = A.render;
  var h = U.h, card = U.card, toast = U.toast, textField = U.textField, riskPill = U.riskPill, pageSub = U.pageSub,
    cap = U.cap, slug = U.slug, todayISO = U.todayISO, downloadBlob = U.downloadBlob, renderZoneMap = U.renderZoneMap;
  var riskFor = E.riskFor, frSug = E.frSug, vecStr = E.vecStr;

  // ---------- The risk context (spt-risk-context, js/engine.js) ----------

  function exportRiskContext() {
    var probs = E.exportProblems(state.project);
    if (probs.length && !confirm("The risk context is incomplete:\n\n- " + probs.slice(0, 20).join("\n- ") + (probs.length > 20 ? "\n…and " + (probs.length - 20) + " more" : "") + "\n\nExport anyway?")) return;
    downloadBlob(JSON.stringify(E.buildRiskContext(state.project), null, 2), slug(state.project.suc.name) + "-risk-context.json");
    toast("Risk context exported (" + INTERCHANGE.schema + ").");
  }

  // ---------- Shared report fragments (used by the review and the high-level report) ----------

  // Asset-owner sign-off. Editable on both report pages; the
  // print-only line renders the signed statement in the printed report.
  function approvalCard(p) {
    var a = p.approval;
    return card("Approval / sign-off", null, [
      h("p", { class: "hint no-print", style: "margin-top:0", text: "Record who approved the tolerable risk and the outcome for the asset owner." }),
      h("div", { class: "grid-2" }, [
        textField("Approver name", a.name, function (v) { a.name = v; touched(); }, { placeholder: "e.g. A. Patel" }),
        textField("Role / title", a.role, function (v) { a.role = v; touched(); }, { placeholder: "e.g. Plant Manager (asset owner)" })
      ]),
      h("div", { class: "grid-2" }, [
        h("div", { class: "field" }, [h("label", { text: "Date approved" }), h("input", { type: "date", value: a.date || "", onInput: function (e) { a.date = e.target.value; touched(); } })]),
        h("div", { class: "field" }, [
          h("label", { text: "Status" }),
          h("label", { style: "display:inline-flex;align-items:center;gap:6px;font-weight:400;font-size:13px;text-transform:none;cursor:pointer" }, [
            h("input", { type: "checkbox", checked: !!a.approved, onChange: function (e) { a.approved = e.target.checked; touched(); rerender(); } }),
            h("span", { text: "Signed off / approved" })
          ])
        ])
      ]),
      textField("What was approved", a.statement, function (v) { a.statement = v; touched(); }, { textarea: true, placeholder: "e.g. Tolerable risk of Medium and the per-zone SL-T targets in this assessment; residual risks accepted as recorded." }),
      (a.name || a.approved) ? h("p", { class: "print-only", style: "margin-top:8px", text: (a.approved ? "Approved by " : "Prepared for approval by ") + (a.name || "(name not recorded)") + (a.role ? " (" + a.role + ")" : "") + (a.date ? " on " + a.date : "") + "." + (a.statement ? " " + a.statement : "") }) : null
    ]);
  }

  function basisCount(b) { return b.interviews.length + b.documents.length + b.observations.length; }

  function basisCardKids(b) {
    function basisTable(rows, heads, cells) {
      if (!rows.length) return null;
      var t = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, heads.map(function (hd) { return h("th", { text: hd }); }))])]);
      var tb = h("tbody");
      rows.forEach(function (r) { tb.appendChild(h("tr", null, cells(r).map(function (v) { return h("td", { text: v || "—" }); }))); });
      t.appendChild(tb);
      return t;
    }
    var kids = [];
    var iT = basisTable(b.interviews, ["Name", "Role / organisation", "Date", "Topics discussed"], function (r) { return [r.name, r.role, r.date, r.notes]; });
    var dT = basisTable(b.documents, ["Document", "Version / date", "Source", "Relevance"], function (r) { return [r.title, r.reference, r.source, r.relevance]; });
    var oT = basisTable(b.observations, ["Observed", "Location", "Date", "Notes"], function (r) { return [r.description, r.location, r.date, r.notes]; });
    if (iT) { kids.push(h("h3", { style: "margin:4px 0 6px;font-size:13px;color:var(--text-muted)", text: "People spoken to" })); kids.push(iT); }
    if (dT) { kids.push(h("h3", { style: "margin:14px 0 6px;font-size:13px;color:var(--text-muted)", text: "Documents reviewed" })); kids.push(dT); }
    if (oT) { kids.push(h("h3", { style: "margin:14px 0 6px;font-size:13px;color:var(--text-muted)", text: "Systems & evidence observed" })); kids.push(oT); }
    if (!kids.length) kids.push(h("p", { class: "muted", text: "No basis-of-assessment evidence recorded." }));
    return kids;
  }

  function highLevelRankingTable() {
    var p = state.project;
    if (!p.srs.highLevelAssets.length) return null;
    var ranked = p.srs.highLevelAssets.slice().sort(function (x, y) {
      var rx = riskFor(x.consequence, x.likelihood), ry = riskFor(y.consequence, y.likelihood);
      return (ry ? BAND_RANK[ry] : -1) - (rx ? BAND_RANK[rx] : -1);
    });
    var at = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Asset / system" }), h("th", { text: "Function & location" }),
      h("th", { text: "Impact", class: "center" }), h("th", { text: "Likelihood", class: "center" }),
      h("th", { text: "Risk", class: "center" }), h("th", { text: "Candidate grouping / notes" })
    ])])]);
    var atb = h("tbody");
    ranked.forEach(function (a) {
      atb.appendChild(h("tr", null, [
        h("td", { text: a.name || "—" }), h("td", { text: a.functionLocation || "—" }),
        h("td", { class: "center", text: a.consequence ? cap(a.consequence) : "—" }),
        h("td", { class: "center", text: a.likelihood ? cap(a.likelihood) : "—" }),
        h("td", { class: "center" }, [riskPill(riskFor(a.consequence, a.likelihood))]),
        h("td", { text: a.note || "—" })
      ]));
    });
    at.appendChild(atb);
    return at;
  }

  // ---------- Standalone high-level risk assessment report ----------
  // A high-level risk assessment is a complete deliverable in its own right —
  // you can produce this without defining zones, running the detailed
  // assessment, or assigning SL-T.

  function renderHLReport(main) {
    var p = state.project, s = p.srs;
    main.appendChild(h("div", { class: "print-only" }, [
      h("h1", { class: "page-title", text: "High-level cyber security risk assessment: " + (p.suc.name || "unnamed SUC") }),
      h("p", { class: "page-sub", text: "IEC 62443-3-2 high-level risk assessment · " + TOOL_ID + " · " + todayISO() + " · relative risk ranking to prioritise systems and frame zoning. Risk bands are a SolutionsPT house matrix." })
    ]));
    main.appendChild(h("h1", { class: "page-title no-print", text: "High-level risk assessment report" }));
    main.appendChild(pageSub("hlreport", "A deliverable on its own that needs no zones or SL-T.", "no-print"));

    main.appendChild(h("div", { class: "btn-row no-print", style: "margin-bottom:16px" }, [
      h("button", { class: "btn primary", text: "Download Word report", onClick: function () { downloadWordReport({ highLevelOnly: true }); } }),
      h("button", { class: "btn", text: "Print high-level report", onClick: function () { window.print(); } }),
      h("button", { class: "btn", text: "Edit the ranking", onClick: function () { state.stage = "srs"; render(); } })
    ]));
    // The peer review's warnings, once a review has started (js/review.js).
    var rvCard = window.RiskReview ? window.RiskReview.warningsCard(h, card) : null;
    if (rvCard) main.appendChild(rvCard);

    // SUC + high-level risk context
    var sk = [];
    if (p.suc.description) sk.push(h("p", { text: p.suc.description }));
    if (p.suc.scopeStatement) sk.push(h("p", null, [h("strong", { text: "Scope: " }), p.suc.scopeStatement]));
    if (s.essentialFunctions) sk.push(h("p", null, [h("strong", { text: "Essential functions: " }), s.essentialFunctions]));
    if (s.worstCase) sk.push(h("p", null, [h("strong", { text: "Worst case: " }), s.worstCase]));
    if (s.adversaryClass) sk.push(h("p", null, [h("strong", { text: "Assumed adversary: " }), "SL" + s.adversaryClass + "-grade: " + RULES.slDefinitions[String(s.adversaryClass)]]));
    sk.push(h("p", null, [h("strong", { text: "Tolerable risk: " }), s.tolerableRisk || "medium"]));
    if (p.suc.assumptions.length) { sk.push(h("p", null, [h("strong", { text: "Assumptions:" })])); sk.push(h("ul", null, p.suc.assumptions.map(function (x) { return h("li", { text: x }); }))); }
    main.appendChild(card(p.suc.name || "System under consideration", null, sk.length ? sk : [h("p", { class: "muted", text: "No SUC details captured yet." })]));

    main.appendChild(card("Basis of assessment", basisCount(p.basisOfAssessment) + " item" + (basisCount(p.basisOfAssessment) === 1 ? "" : "s"), basisCardKids(p.basisOfAssessment)));

    var hl = highLevelRankingTable();
    main.appendChild(card("Relative risk ranking", "highest risk first", hl ? [
      hl,
      h("p", { class: "hint", style: "margin-top:10px", text: "Promote the top systems to a detailed assessment with “Detail →” in stage 2." })
    ] : [h("p", { class: "muted", text: "No systems ranked yet: add them in stage 2." })]));

    main.appendChild(approvalCard(p));
  }

  function renderReview(main) {
    var p = state.project;
    main.appendChild(h("div", { class: "print-only" }, [
      h("h1", { class: "page-title", text: "OT cyber risk assessment summary: " + (p.suc.name || "unnamed SUC") }),
      h("p", { class: "page-sub", text: "62443-3-2-aligned zones & conduits assessment · " + TOOL_ID + " · " + todayISO() + " · SL suggestions are a SolutionsPT house heuristic; consultant SL-T (per FR) and justification are the deliverable." })
    ]));
    main.appendChild(h("h1", { class: "page-title no-print", text: "Full report & export" }));
    main.appendChild(h("p", { class: "page-sub no-print", text: "Check the summary, then download or export; SL-T is shown per FR (" + FR_IDS.join("/") + ")." }));

    var probs = E.exportProblems(p);
    if (probs.length) main.appendChild(card("Completeness", probs.length + " item" + (probs.length === 1 ? "" : "s") + " outstanding", [h("ul", { class: "muted" }, probs.slice(0, 30).map(function (t) { return h("li", { text: t }); }))]));
    var rvCard = window.RiskReview ? window.RiskReview.warningsCard(h, card) : null;
    if (rvCard) main.appendChild(rvCard);

    // SUC + requirements
    var sk = [];
    if (p.suc.description) sk.push(h("p", { text: p.suc.description }));
    if (p.suc.scopeStatement) sk.push(h("p", null, [h("strong", { text: "Scope: " }), p.suc.scopeStatement]));
    sk.push(h("p", null, [h("strong", { text: "Tolerable risk: " }), p.srs.tolerableRisk || "medium"]));
    if (p.srs.adversaryClass) sk.push(h("p", null, [h("strong", { text: "Assumed adversary: " }), "SL" + p.srs.adversaryClass + "-grade: " + RULES.slDefinitions[String(p.srs.adversaryClass)]]));
    [["Known/presumed threats", p.srs.knownThreats], ["Security functions that must be kept", p.srs.mandatorySecurityFunctions], ["Regulatory", p.srs.regulatory], ["Assumptions", p.suc.assumptions]].forEach(function (pair) {
      if (pair[1] && pair[1].length) { sk.push(h("p", null, [h("strong", { text: pair[0] + ":" })])); sk.push(h("ul", null, pair[1].map(function (x) { return h("li", { text: x }); }))); }
    });
    if (p.srs.clientMatrix) sk.push(h("p", { class: "muted", text: "Client risk matrix used" + (p.srs.clientMatrixNote ? ": " + p.srs.clientMatrixNote : "") + "." }));
    main.appendChild(card(p.suc.name || "System under consideration", null, sk.length ? sk : [h("p", { class: "muted", text: "No SUC details captured yet." })]));

    // Basis of assessment (who / what / observed)
    var b = p.basisOfAssessment;
    main.appendChild(card("Basis of assessment", basisCount(b) + " item" + (basisCount(b) === 1 ? "" : "s"), basisCardKids(b)));

    // High-level risk ranking, highest risk first
    var hlTbl = highLevelRankingTable();
    if (hlTbl) main.appendChild(card("High-level risk ranking", "highest risk first", [hlTbl]));

    // Zones table, from the view model (js/view-model.js)
    var vm = R.ViewModel.build(p);
    var anyResidual = vm.zones.some(function (row) { return row.threats.some(function (x) { return x.residual != null; }); });
    var zt = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Zone" }), h("th", { text: anyResidual ? "Worst risk (unmitig. → residual)" : "Worst risk", class: "center" }),
      h("th", { text: "Threats", class: "center" }), h("th", { text: "Suggested (" + FR_IDS.join("/") + ")" }),
      h("th", { text: "SL-T (" + FR_IDS.join("/") + ")" }), h("th", { text: "Justification" })
    ])])]);
    var ztb = h("tbody");
    vm.zones.forEach(function (row) {
      var z = row.o;
      var s = E.suggestZone(z, p);
      var wres = row.worstOperative;
      ztb.appendChild(h("tr", null, [
        h("td", null, [document.createTextNode(z.id + (z.name ? ": " + z.name : "")), s.safetyRelated ? h("span", { class: "pill flag", style: "margin-left:6px", text: "SIS" }) : null]),
        h("td", { class: "center" }, [riskPill(s.worstRisk), (wres && wres !== s.worstRisk) ? h("span", null, [document.createTextNode(" → "), riskPill(wres)]) : null]),
        h("td", { class: "center", text: String(z.threats.length) }),
        h("td", { text: vecStr(frSug(s)) }),
        h("td", null, [h("strong", { text: vecStr(z.slTargetByFR) })]),
        h("td", { text: z.justification || "—" })
      ]));
    });
    zt.appendChild(ztb);
    main.appendChild(card("Zones", p.zones.length + " zone" + (p.zones.length === 1 ? "" : "s"), [
      p.zones.length ? zt : h("p", { class: "muted", text: "No zones defined." }),
      anyResidual ? h("p", { class: "hint", style: "margin-top:8px", text: "Unmitigated → residual where countermeasures reduce the risk." }) : null
    ]));

    if (p.conduits.length) {
      var ct = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
        h("th", { text: "Conduit" }), h("th", { text: "Path" }), h("th", { text: "Channels" }),
        h("th", { text: "SL-T (" + FR_IDS.join("/") + ")" }), h("th", { text: "Justification" })
      ])])]);
      var ctb = h("tbody");
      p.conduits.forEach(function (c) {
        ctb.appendChild(h("tr", null, [
          h("td", { text: c.id + (c.name ? ": " + c.name : "") }),
          h("td", { text: (c.fromZone || "?") + " ↔ " + (c.toZone || "?") }),
          h("td", { text: c.channels.join(", ") || "—" }),
          h("td", null, [h("strong", { text: vecStr(c.slTargetByFR) })]),
          h("td", { text: c.justification || "—" })
        ]));
      });
      ct.appendChild(ctb);
      main.appendChild(card("Conduits", p.conduits.length + " conduit" + (p.conduits.length === 1 ? "" : "s"), [ct]));
    }

    main.appendChild(card("Zone & conduit drawing", null, [renderZoneMap(p)]));

    main.appendChild(approvalCard(p));

    main.appendChild(h("div", { class: "btn-row no-print" }, [
      h("button", { class: "btn primary", text: "Download Word report", title: "For management", onClick: function () { downloadWordReport({}); } }),
      h("button", { class: "btn primary", text: "Download Excel workbook", title: "For engineers: threat tracker and registers", onClick: downloadExcelReport }),
      h("button", { class: "btn", text: "Export risk context (" + INTERCHANGE.schema + ")", onClick: exportRiskContext }),
      h("button", { class: "btn", text: "Print one-page summary", onClick: function () { window.print(); } })
    ]));
    main.appendChild(h("p", { class: "hint no-print", style: "margin-top:8px", text: "Document control comes from the engagement details on the Basis of assessment page." }));
  }

  // ---------- Word / Excel deliverables (js/exports.js + vendor libs) ----------

  function reportsAvailable() {
    if (window.RiskExports && window.docx && window.ExcelJS) return true;
    toast("Report libraries not loaded: open the app from its folder so vendor/ and js/ are alongside index.html.", "err");
    return false;
  }
  // One question before a download, never a block. The completeness list is
  // about zones and threats, so the high-level report (the zone-free
  // deliverable) skips it; the peer review's warnings (js/review.js) apply to
  // every download, once a review has started.
  function reportGuard(opts) {
    opts = opts || {};
    var probs = opts.highLevelOnly ? [] : E.exportProblems(state.project);
    var rw = window.RiskReview ? window.RiskReview.exportWarningTexts() : [];
    if (!probs.length && !rw.length) return true;
    var parts = [];
    if (probs.length) parts.push("The assessment is incomplete:\n\n- " + probs.slice(0, 20).join("\n- ") + (probs.length > 20 ? "\n…and " + (probs.length - 20) + " more" : ""));
    if (rw.length) parts.push("Peer review:\n\n- " + rw.join("\n- "));
    return confirm(parts.join("\n\n") + "\n\nGenerate the report anyway?");
  }
  // Whether the report has changed since a review approved it needs the
  // reports as they are now: built first when they are not to hand.
  function reviewChecked(go) {
    var RR = window.RiskReview;
    if (RR && RR.needsDocs && RR.needsDocs()) { toast("Checking the report against its review…"); RR.refreshDocs(go); }
    else go();
  }
  function downloadWordReport(opts) {
    opts = opts || {};
    if (!reportsAvailable()) return;
    reviewChecked(function () {
      if (!reportGuard(opts)) return;
      window.RiskExports.downloadWord(opts, function (err) {
        toast(err ? ("Word report failed: " + (err && err.message)) : "Word report downloaded.", err ? "err" : undefined);
      });
    });
  }
  function downloadExcelReport() {
    if (!reportsAvailable()) return;
    reviewChecked(function () {
      if (!reportGuard({})) return;
      window.RiskExports.downloadExcel(function (err) {
        toast(err ? ("Excel workbook failed: " + (err && err.message)) : "Excel workbook downloaded.", err ? "err" : undefined);
      });
    });
  }

  var P = R.Pages;
  P.hlreport = renderHLReport; P.review = renderReview;
  // js/review.js (loaded after the app): the reports' peer review.
  P.peer = function (m) { if (window.RiskReview) window.RiskReview.render(m, h, card); };
  // js/report-page.js: both Word reports, to read and edit section by section.
  P.report = function (m) { if (window.RiskReportPage) window.RiskReportPage.render(m, h); };
  // js/word-preview.js: the Word file itself, page by page.
  P.wordpreview = function (m) { if (window.RiskWordPreview) window.RiskWordPreview.render(m, h); };

  return {
    exportRiskContext: exportRiskContext,
    downloadWordReport: downloadWordReport, downloadExcelReport: downloadExcelReport
  };
}());
