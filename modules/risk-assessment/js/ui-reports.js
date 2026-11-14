/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-reports.js — the report pages and the downloads.
 *
 * The Report page (report) in three views: Sections (js/report-page.js),
 * Word pages (js/word-preview.js) and Summary (the hand-built one-page
 * summaries of the detailed and the high-level report). Check and issue
 * (review): each report's readiness list with Go to, and every download (the
 * approvals are step 7's, js/ui-spec.js; the summaries show them read-only). The risk-context export and the Word and Excel
 * downloads, with the one question asked before them, in the page (Generate
 * anyway). Registers its pages in RiskApp.Pages, Peer review (peer,
 * js/review.js) among them, and the old page ids hlreport and wordpreview in
 * RiskApp.StageAliases. RiskApp.Reports holds what the header buttons and
 * window.RiskTool call. Check and issue also holds Since the previous
 * assessment (phase 6a, js/compare.js): load, replace or remove the baseline.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Reports = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var RULES = M.RULES, FR_IDS = M.FR_IDS, BAND_RANK = M.BAND_RANK, INTERCHANGE = M.INTERCHANGE;
  var state = A.state, touched = A.touched, rerender = A.rerender, render = A.render;
  var h = U.h, card = U.card, toast = U.toast, textField = U.textField, riskPill = U.riskPill, pageSub = U.pageSub,
    cap = U.cap, slug = U.slug, todayISO = U.todayISO, downloadBlob = U.downloadBlob, renderZoneMap = U.renderZoneMap;
  var riskFor = E.riskFor, frSug = E.frSug, vecStr = E.vecStr;

  // ---------- The risk context (spt-risk-context, js/engine.js) ----------

  function exportRiskContext() {
    function groups() { return [{ title: "Still open:", lines: E.exportProblems(state.project) }]; }
    function go() {
      downloadBlob(JSON.stringify(E.buildRiskContext(state.project), null, 2), slug(state.project.suc.name) + "-risk-context.json");
      toast("Risk context exported (" + INTERCHANGE.schema + ").");
    }
    ask("Export the risk context anyway?", groups, go, "Export anyway");
  }

  // ---------- The question before a download (never a block) ----------
  //
  // An in-page panel at the top of the page, in place of the browser's
  // confirm: what is still open, the peer review's warnings, then Generate
  // anyway (or Export anyway) or Cancel. What is open is worked out again
  // each time the panel is drawn, so an edit on the page shows in it. It
  // stays through a redraw of the same page, goes when the page changes or
  // another project is opened, and Escape cancels it. The focus goes back to
  // the button that asked.
  var pending = null;   // { stage, title, groups: fn -> [{ title, lines }], go, yes, trigger }
  function linesOf(groups) { return groups.reduce(function (n, g) { return n + g.lines.length; }, 0); }
  // Calls go() straight away when there is nothing to ask.
  function ask(title, groups, go, yes) {
    if (!linesOf(groups())) { go(); return; }
    var a = document.activeElement;
    if (!a || a.tagName !== "BUTTON") a = null;
    pending = { stage: state.stage, title: title, groups: groups, go: go, yes: yes || "Generate anyway",
      trigger: a, triggerSel: a && a.getAttribute("data-download") };
    drawGuard(document.getElementById("main"), true);
  }
  function removePanel() { var old = document.getElementById("issue-guard"); if (old && old.parentNode) old.parentNode.removeChild(old); }
  function clearGuard() { pending = null; removePanel(); }
  function closeGuard(P0, main) {
    pending = null; removePanel();
    var back = P0.trigger && document.contains(P0.trigger) ? P0.trigger
      : (P0.triggerSel && main ? main.querySelector('[data-download="' + P0.triggerSel + '"]') : null);
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }
  function drawGuard(main, fresh) {
    removePanel();
    if (!pending || !main) return;
    if (pending.stage !== state.stage) { pending = null; return; }
    var P0 = pending, kids = [], groups = P0.groups();
    if (!linesOf(groups)) { pending = null; return; }
    groups.forEach(function (g) {
      if (!g.lines.length) return;
      kids.push(h("p", { class: "guard-group", text: g.title }));
      kids.push(h("ul", null, g.lines.slice(0, 20).map(function (t) { return h("li", { text: t }); }).concat(g.lines.length > 20 ? [h("li", { class: "muted", text: "and " + (g.lines.length - 20) + " more" })] : [])));
    });
    var yes = h("button", { type: "button", class: "btn primary", "data-action": "generate-anyway", text: P0.yes, onClick: function () { closeGuard(P0, main); P0.go(); } });
    kids.push(h("div", { class: "btn-row" }, [
      yes,
      h("button", { type: "button", class: "btn", "data-action": "guard-cancel", text: "Cancel", onClick: function () { closeGuard(P0, main); } })
    ]));
    var panel = h("div", { class: "card issue-guard no-print", id: "issue-guard", role: "alertdialog", "aria-labelledby": "issue-guard-title" }, [
      h("div", { class: "card-h" }, [h("h2", { id: "issue-guard-title", text: P0.title })]),
      h("div", { class: "card-b" }, kids)
    ]);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeGuard(P0, main); } });
    main.insertBefore(panel, main.firstChild);
    if (fresh) { main.scrollTop = 0; try { yes.focus({ preventScroll: true }); } catch (e) { yes.focus(); } }
  }

  // ---------- Shared report fragments (used by the review and the high-level report) ----------

  // The approvals, read-only, on the summaries: they are entered in step 7
  // (js/ui-spec.js).
  function approvalCard(p) { return R.Spec.approvalSummary(p); }

  function basisCount(b) { return b.interviews.length + b.documents.length + b.observations.length; }

  function basisCardKids(b) {
    function basisTable(rows, heads, cells) {
      if (!rows.length) return null;
      var t = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, heads.map(function (hd) { return h("th", { text: hd }); }))])]);
      var tb = h("tbody");
      rows.forEach(function (r) { tb.appendChild(h("tr", null, cells(r).map(function (v) { return h("td", { text: v || "" }); }))); });
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
      var rx = riskFor(x.consequence, x.likelihood, p), ry = riskFor(y.consequence, y.likelihood, p);
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
        h("td", { text: a.name || "" }), h("td", { text: a.functionLocation || "" }),
        h("td", { class: "center", text: a.consequence ? E.impactName(a.consequence, p) : "" }),
        h("td", { class: "center", text: a.likelihood ? E.likelihoodName(a.likelihood, p) : "" }),
        h("td", { class: "center" }, [riskPill(riskFor(a.consequence, a.likelihood, p))]),
        h("td", { text: a.note || "" })
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
      h("p", { class: "page-sub", text: "IEC 62443-3-2 high-level risk assessment · " + todayISO() + " · relative risk ranking to prioritise systems and frame zoning. Risk bands are from " + E.criteriaWords(p).matrix + "." })
    ]));
    main.appendChild(h("h1", { class: "page-title no-print", text: "High-level risk assessment report" }));
    main.appendChild(pageSub("hlreport", "A deliverable on its own that needs no zones or SL-T.", "no-print"));

    main.appendChild(h("div", { class: "btn-row no-print", style: "margin-bottom:16px" }, [
      h("button", { class: "btn primary", text: "Download Word report", onClick: function () { downloadWordReport({ highLevelOnly: true }); } }),
      h("button", { class: "btn", text: "Print high-level report", onClick: function () { window.print(); } }),
      h("button", { class: "btn", text: "Edit the ranking", onClick: function () { A.navigate("srs"); } })
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
    sk.push(h("p", null, [h("strong", { text: "Tolerable risk: " }), M.BAND_NAME[E.tolerableOf(p)]]));
    if (p.suc.assumptions.length) { sk.push(h("p", null, [h("strong", { text: "Assumptions:" })])); sk.push(h("ul", null, p.suc.assumptions.map(function (x) { return h("li", { text: x }); }))); }
    main.appendChild(card(p.suc.name || "System under consideration", null, sk.length ? sk : [h("p", { class: "muted", text: "No SUC details captured yet." })]));

    main.appendChild(card("Basis of assessment", basisCount(p.basisOfAssessment) + " item" + (basisCount(p.basisOfAssessment) === 1 ? "" : "s"), basisCardKids(p.basisOfAssessment)));

    var hl = highLevelRankingTable();
    main.appendChild(card("Relative risk ranking", "highest risk first", hl ? [
      hl,
      h("p", { class: "hint no-print", style: "margin-top:10px", text: "Assign the systems to zones in step 2." })
    ] : [h("p", { class: "muted", text: "No systems ranked yet: add them in step 2." })]));

    main.appendChild(approvalCard(p));
  }

  // The detailed report's one-page summary, hand-built (the Report page's
  // Summary view, Detailed). What is still open is on Check and issue.
  function renderDetailedSummary(main) {
    var p = state.project;
    main.appendChild(h("div", { class: "print-only" }, [
      h("h1", { class: "page-title", text: "OT cyber risk assessment summary: " + (p.suc.name || "unnamed SUC") }),
      h("p", { class: "page-sub", text: "IEC 62443-3-2 zones and conduits assessment · " + todayISO() + " · SL suggestions are a SolutionsPT house heuristic; consultant SL-T (per FR) and justification are the deliverable." })
    ]));
    main.appendChild(h("h1", { class: "page-title no-print", text: "Detailed report summary" }));
    main.appendChild(h("p", { class: "page-sub no-print", text: "The assessment on one page; SL-T is shown per FR (" + FR_IDS.join("/") + ")." }));

    var rvCard = window.RiskReview ? window.RiskReview.warningsCard(h, card) : null;
    if (rvCard) main.appendChild(rvCard);

    // SUC + requirements
    var sk = [];
    if (p.suc.description) sk.push(h("p", { text: p.suc.description }));
    if (p.suc.scopeStatement) sk.push(h("p", null, [h("strong", { text: "Scope: " }), p.suc.scopeStatement]));
    sk.push(h("p", null, [h("strong", { text: "Tolerable risk: " }), M.BAND_NAME[E.tolerableOf(p)]]));
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
    // The arrow is shown where a zone's rating that stands differs from its
    // unmitigated one, and the header names it only when a row has one.
    var anyResidual = vm.zones.some(function (row) { return row.worstOperative && row.worstOperative !== row.worstRisk; });
    var zt = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Zone" }), h("th", { text: anyResidual ? "Worst risk (unmitigated → rating that stands)" : "Worst risk", class: "center" }),
      h("th", { text: "Threats", class: "center" }), h("th", { text: "Suggested SL-T" }),
      h("th", { text: "SL-T" }), h("th", { text: "Justification" })
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
        h("td", { text: E.vecWords(frSug(s)) }),
        h("td", null, [h("strong", { text: E.vecWords(z.slTargetByFR) })]),
        h("td", { text: z.justification || "" })
      ]));
    });
    zt.appendChild(ztb);
    main.appendChild(card("Zones", p.zones.length + " zone" + (p.zones.length === 1 ? "" : "s"), [
      p.zones.length ? zt : h("p", { class: "muted", text: "No zones defined." }),
      anyResidual ? h("p", { class: "hint", style: "margin-top:8px", text: "Unmitigated → rating that stands, where countermeasures change it." }) : null
    ]));

    if (p.conduits.length) {
      var ct = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null, [
        h("th", { text: "Conduit" }), h("th", { text: "Path" }), h("th", { text: "Channels and protocols" }),
        h("th", { text: "SL-T" }), h("th", { text: "Justification" })
      ])])]);
      var ctb = h("tbody");
      p.conduits.forEach(function (c) {
        ctb.appendChild(h("tr", null, [
          h("td", { text: c.id + (c.name ? ": " + c.name : "") }),
          h("td", { text: (c.fromZone || "not set") + " ↔ " + (c.toZone || "not set") }),
          h("td", { text: c.channels.join(", ") }),
          h("td", null, [h("strong", { text: E.vecWords(c.slTargetByFR) })]),
          h("td", { text: c.justification || "" })
        ]));
      });
      ct.appendChild(ctb);
      main.appendChild(card("Conduits", p.conduits.length + " conduit" + (p.conduits.length === 1 ? "" : "s"), [ct]));
    }

    // A zone's box opens it on step 3, as on the other pages.
    main.appendChild(card("Zone & conduit drawing", null, [renderZoneMap(p, function (id) { A.goToItem({ stage: "zones", target: { kind: "zone", id: id } }); })]));

    main.appendChild(approvalCard(p));

    main.appendChild(h("div", { class: "btn-row no-print" }, [
      h("button", { class: "btn primary", text: "Download Word report", title: "For management", onClick: function () { downloadWordReport({}); } }),
      h("button", { class: "btn primary", text: "Download Excel workbook", title: "For engineers: threat tracker and registers", onClick: downloadExcelReport }),
      h("button", { class: "btn", text: "Export risk context (" + INTERCHANGE.schema + ")", onClick: exportRiskContext }),
      h("button", { class: "btn", text: "Print one-page summary", onClick: function () { window.print(); } })
    ]));
    main.appendChild(h("p", { class: "hint no-print", style: "margin-top:8px", text: "Document control comes from the engagement details on the Engagement and evidence page." }));
  }

  // ---------- Word / Excel deliverables (js/exports.js + vendor libs) ----------

  function reportsAvailable() {
    if (window.RiskExports && window.docx && window.ExcelJS) return true;
    toast("Report libraries not loaded: open the app from its folder so vendor/ and js/ are alongside index.html.", "err");
    return false;
  }
  // One question before a download, never a block: the report's part of the
  // completeness list (the high-level report's own, without the zones and
  // threats), and the peer review's warnings (js/review.js) once a review
  // has started. Calls go() straight away when there is nothing to ask.
  function reportGuard(opts, go, what) {
    opts = opts || {};
    var doc = opts.highLevelOnly ? "highLevel" : opts.spec ? "spec" : "detailed";
    function groups() {
      return [
        { title: { highLevel: "Still open in the high-level report:", spec: "Still open in the requirements specification:", detailed: "Still open in the detailed report:" }[doc],
          lines: E.readiness(state.project, doc).map(function (i) { return i.text; }) },
        { title: "Peer review:", lines: window.RiskReview ? window.RiskReview.exportWarningTexts() : [] }
      ];
    }
    ask("Generate the " + what + " anyway?", groups, go);
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
      reportGuard(opts, function () {
        window.RiskExports.downloadWord(opts, function (err) {
          var what = opts.spec && !opts.highLevelOnly ? "Requirements specification" : "Word report";
          toast(err ? (what + " failed: " + (err && err.message)) : what + " downloaded.", err ? "err" : undefined);
        });
      }, opts.highLevelOnly ? "high-level Word report" : opts.spec ? "requirements specification" : "Word report");
    });
  }
  function downloadExcelReport() {
    if (!reportsAvailable()) return;
    reviewChecked(function () {
      reportGuard({}, function () {
        window.RiskExports.downloadExcel(function (err) {
          toast(err ? ("Excel workbook failed: " + (err && err.message)) : "Excel workbook downloaded.", err ? "err" : undefined);
        });
      }, "Excel workbook");
    });
  }

  // ---------- Check and issue (review) ----------
  //
  // The readiness list for each report, every item linked to the place it is
  // fixed (js/engine.js completeness), the peer review's warnings, every
  // download, and the asset owner's sign-off.

  var DOC_TITLES = { detailed: "Detailed report", highLevel: "High-level report", spec: "Cyber security requirements specification" };
  function readinessCard(p, doc, outOfScope) {
    var items = E.readiness(p, doc);
    var list = items.length
      ? h("ul", { class: "readiness" }, items.map(function (it) {
          return h("li", { "data-stage": it.stage }, [
            h("span", { text: it.text }),
            h("button", { type: "button", class: "btn sm", "data-action": "goto", text: "Go to", "aria-label": "Go to: " + it.text, onClick: function () { A.goToItem(it); } })
          ]);
        }))
      : h("p", { class: "muted", text: "Nothing open." });
    var body = outOfScope
      ? [h("p", { class: "muted", text: "Not part of a high-level-only assessment." }), items.length ? h("details", null, [h("summary", { text: "Show what is open" }), list]) : null]
      : [list];
    return card(DOC_TITLES[doc], items.length ? items.length + " open" : "ready to issue", body, null, { "data-readiness": doc });
  }
  function renderCheckIssue(main) {
    var p = state.project, hlOnly = M.assessmentType(p) === "high-level";
    main.appendChild(h("h1", { class: "page-title", text: "Check and issue" }));
    main.appendChild(h("p", { class: "page-sub", text: (p.suc.name ? p.suc.name + ": what" : "What") + " is still open in each report, and the downloads." }));
    var rvCard = window.RiskReview ? window.RiskReview.warningsCard(h, card) : null;
    if (rvCard) main.appendChild(rvCard);
    // The requirements specification (phase 6b) last: an extra, for a client
    // who issues it on its own; its content is in the detailed report too.
    (hlOnly ? ["highLevel", "detailed", "spec"] : ["detailed", "highLevel", "spec"]).forEach(function (doc) {
      main.appendChild(readinessCard(p, doc, hlOnly && doc !== "highLevel"));
    });
    main.appendChild(baselineCard(p));
    main.appendChild(card("Downloads", null, [
      h("div", { class: "btn-row" }, [
        h("button", { class: "btn primary", "data-download": "word", text: "Detailed Word report", onClick: function () { downloadWordReport({}); } }),
        h("button", { class: "btn primary", "data-download": "word-hl", text: "High-level Word report", onClick: function () { downloadWordReport({ highLevelOnly: true }); } }),
        h("button", { class: "btn", "data-download": "word-spec", text: "Requirements specification", title: "Cyber security requirements specification, as a Word file of its own", onClick: function () { downloadWordReport({ spec: true }); } }),
        h("button", { class: "btn", "data-download": "excel", text: "Excel workbook", onClick: downloadExcelReport }),
        h("button", { class: "btn", "data-download": "risk-context", text: "Risk context (" + INTERCHANGE.schema + ")", onClick: exportRiskContext })
      ]),
      h("p", { class: "hint", style: "margin-top:8px", text: "Document control comes from the engagement details." })
    ]));
  }

  // ---------- Since the previous assessment (phase 6a) ----------
  //
  // A previous risk project file is loaded as the baseline (js/compare.js):
  // stored in the project by reference with a frozen copy of what is
  // compared, never changing anything else. The card lists what changed;
  // the full Word report and the workbook carry the same.
  function setBaseline(text, fileName) {
    var CP = R.Compare, res = CP.baselineFrom(text, fileName);
    if (res.error) { toast(res.error, "err"); return false; }
    var mk = A.undoMark();
    state.project.baseline = res.baseline;
    touched(); rerender();
    A.offerUndo("Previous assessment loaded.", null, mk);
    return true;
  }
  function clearBaseline() {
    if (!state.project.baseline) return false;
    var mk = A.undoMark();
    delete state.project.baseline;
    touched(); rerender();
    A.offerUndo("Previous assessment removed.", function () { return '[data-action="baseline-remove"]'; }, mk);
    A.focusAfter('[data-action="baseline-load"]');
    return true;
  }
  function baselineCard(p) {
    var b = p.baseline && p.baseline.facts ? p.baseline : null, CP = R.Compare, kids = [], count = 0;
    var input = h("input", { type: "file", accept: ".json,application/json", hidden: "hidden", "data-action": "baseline-file", "aria-hidden": "true", tabindex: "-1",
      onChange: function (ev) {
        var f = ev.target.files && ev.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () { setBaseline(String(rd.result), f.name); };
        rd.onerror = function () { toast("Could not read the file.", "err"); };
        rd.readAsText(f); ev.target.value = "";
      } });
    if (!b) kids.push(h("p", { class: "muted", text: "Load the previous risk project file to see what has changed." }));
    else {
      var groups = CP.lines(CP.compare(p));
      kids.push(h("p", { "data-baseline-meta": "", text: cap(CP.baselineWords(b)) + (b.fileName ? " (" + b.fileName + ")" : "") + "." }));
      if (!groups.length) kids.push(h("p", { class: "muted", text: "Nothing recorded has changed." }));
      groups.forEach(function (g) {
        count += g.items.length;
        kids.push(h("h3", { class: "changes-head", text: g.title }));
        kids.push(h("ul", { "data-changes": g.key }, g.items.map(function (t) { return h("li", { text: t }); })));
      });
    }
    kids.push(h("div", { class: "btn-row", style: "margin-top:8px" }, [
      input,
      h("button", { type: "button", class: "btn sm", "data-action": "baseline-load", text: b ? "Replace" : "Load previous assessment", onClick: function () { input.click(); } }),
      b ? h("button", { type: "button", class: "btn sm danger", "data-action": "baseline-remove", text: "Remove", onClick: clearBaseline }) : null
    ]));
    return card("Since the previous assessment", b ? (count ? count + " change" + (count === 1 ? "" : "s") : "no changes") : null, kids, null, { "data-check-anchor": "baseline" });
  }

  // ---------- The Report page (report) ----------
  //
  // One page for both reports, Detailed and High level, and the requirements
  // specification (phase 6b, Sections and Word pages only), in three views:
  // Sections (js/report-page.js, read and edited section by section), Word
  // pages (js/word-preview.js, the file itself) and Summary (the hand-built
  // one-page summaries, kept for printing). The report chosen stays chosen
  // when the view changes. The old page ids open it: hlreport on the
  // high-level summary, wordpreview on the Word pages.

  var VIEWS = [{ id: "sections", text: "Sections" }, { id: "word", text: "Word pages" }, { id: "summary", text: "Summary" }];
  // chosen: the document chosen, kept apart from the summary shown, so the
  // specification is still chosen after a visit to Summary.
  var view = { name: "sections", last: "sections", summaryDoc: 0, chosen: 0 };
  function RPg() { return window.RiskReportPage; }
  function WPv() { return window.RiskWordPreview; }
  function docOf(name) {
    if (name === "word") return WPv() ? WPv().state.doc : 0;
    if (name === "summary") return view.chosen;
    return RPg() ? RPg().state.doc : 0;
  }
  // 2 is the requirements specification (phase 6b), in Sections and Word
  // pages; the summaries are the two reports' only, so it shows the detailed one.
  function setDoc(name, d) {
    d = d === 1 || d === 2 ? d : 0;
    if (name === "word") { if (WPv()) WPv().state.doc = d; return; }
    if (name === "summary") { view.chosen = d; view.summaryDoc = d === 1 ? 1 : 0; return; }
    if (RPg() && RPg().state.doc !== d) { RPg().state.doc = d; RPg().state.open = null; }
  }
  // Show a view (and a report) next time the page draws.
  function reportView(name, doc) {
    var d = doc == null ? docOf(view.last) : doc;
    view.name = name; view.last = name;
    setDoc(name, d);
  }
  function renderReportPage(main) {
    setDoc(view.name, docOf(view.last));
    view.last = view.name;
    if (view.name === "word") { if (WPv()) WPv().render(main, h); }
    else if (view.name === "summary") {
      if (view.summaryDoc === 1) renderHLReport(main); else renderDetailedSummary(main);
    } else if (RPg()) RPg().render(main, h);
    var bar = h("div", { class: "rp-views no-print", role: "group", "aria-label": "View" }, VIEWS.map(function (v) {
      var on = view.name === v.id;
      return h("button", { type: "button", class: "sl-btn rp-view" + (on ? " active" : ""), "data-view": v.id, "aria-pressed": on ? "true" : "false",
        onClick: function () { if (!on) { reportView(v.id); render(); A.focusAfter('.rp-views [data-view="' + v.id + '"]'); } } }, [v.text]);
    }));
    var kids = [bar];
    // The summaries have no report tabs of their own.
    if (view.name === "summary") kids.push(h("div", { class: "rp-tabs", role: "group", "aria-label": "Which report" }, ["Detailed", "High level"].map(function (t, i) {
      var on = view.summaryDoc === i;
      return h("button", { type: "button", class: "sl-btn rp-tab" + (on ? " active" : ""), "data-doc": i ? "highLevel" : "detailed", "aria-pressed": on ? "true" : "false",
        onClick: function () { if (!on) { view.summaryDoc = i; view.chosen = i; render(); A.focusAfter('.rp-viewbar .rp-tab[data-doc="' + (i ? "highLevel" : "detailed") + '"]'); } }, text: t });
    })));
    var row = h("div", { class: "rp-viewbar no-print" }, kids);
    var subs = main.querySelectorAll(".page-sub"), after = null;
    for (var i = 0; i < subs.length; i++) if (!subs[i].closest(".print-only")) { after = subs[i]; break; }
    if (after && after.parentNode === main) main.insertBefore(row, after.nextSibling); else main.insertBefore(row, main.firstChild);
  }

  var P = R.Pages;
  P.review = renderCheckIssue;
  // js/review.js (loaded after the app): the reports' peer review.
  P.peer = function (m) { if (window.RiskReview) window.RiskReview.render(m, h, card); };
  P.report = renderReportPage;
  // The old page ids (js/app.js render): the high-level summary, the Word pages.
  R.StageAliases.hlreport = function () { reportView("summary", 1); return "report"; };
  R.StageAliases.wordpreview = function () { reportView("word"); return "report"; };

  return {
    exportRiskContext: exportRiskContext,
    downloadWordReport: downloadWordReport, downloadExcelReport: downloadExcelReport,
    drawGuard: drawGuard, clearGuard: clearGuard, reportView: reportView, view: view,
    setBaseline: setBaseline, clearBaseline: clearBaseline
  };
}());
