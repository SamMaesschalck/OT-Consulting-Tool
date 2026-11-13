/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* exports.js — Word and Excel deliverables for the risk tool.
 *
 * The Word report uses the SAME design language as the Assessments app's
 * reports (this app's own COPY of that chassis, per the sibling rule):
 * the full-bleed Design-B cover (navy hero + logo card + brand type), the
 * running logo header and three-part footer, and a visual "at a glance"
 * scorecard page (tiles / stacked bars / focus cards) — here telling the
 * risk story: threats by band per zone, dispositions, and the SL-T vector.
 * Brand assets come from js/logo.js and js/hero-asset.js (copied in).
 *
 * Word (vendor/docx.umd.js, the rPr-patched copy) is the readable
 * deliverable; {highLevelOnly:true} builds the high-level risk assessment variant.
 * Excel (vendor/exceljs.min.js) is the register and treatment plan issued
 * from the tool, one way (a new issue replaces the old): a summary with heat
 * maps, the ranking, the threat register with its three ratings, the
 * treatment plan, accepted risks, vulnerabilities, zone/conduit registers,
 * countermeasures, the SL-T matrix, the risk criteria and the basis.
 *
 * Both builders are pure (project in → docx Document / ExcelJS Workbook out)
 * so the headless tests can inspect the output; download wrappers live here.
 */
window.RiskExports = (function () {
  "use strict";

  function RT() { return window.RiskTool; }
  function RULES() { return window.App.Data.sltRules; }
  function FRS() { return RULES().foundationalRequirements; }

  // ---- palette & type: this app's copy of the Assessments report design ----
  var COLOR = {
    blueDark: "0A3D62",
    text:     "1A2533",
    muted:    "5A6B7B",
    soft:     "8595A5",
    met:      "2E7D52",
    near:     "C28A1E",
    gap:      "B23A33",
    deep:     "7A1F1A",
    metBg:    "E5F1EA",
    nearBg:   "F7EFD9",
    gapBg:    "F3DEDC",
    deepBg:   "F0CFCB",
    naBg:     "ECEFF2",
    headBg:   "173267",
    subBg:    "F4F7FA",
    navy:     "173267",
    brandBlue:"3399CC",
    skyBlue:  "7FC4E8",
    note:     "E00000"
  };
  var FONT = "Segoe UI";
  function _bd(style, color) { return { style: style, size: 0, color: color }; }
  var TBL_NONE = { top: _bd("none", "auto"), bottom: _bd("none", "auto"), left: _bd("none", "auto"), right: _bd("none", "auto"), insideHorizontal: _bd("none", "auto"), insideVertical: _bd("none", "auto") };

  var BAND_STYLE = {
    "low":       { fill: COLOR.metBg,  text: COLOR.met,  name: "Low" },
    "medium":    { fill: COLOR.nearBg, text: COLOR.near, name: "Medium" },
    "high":      { fill: COLOR.gapBg,  text: COLOR.gap,  name: "High" },
    "very-high": { fill: COLOR.deepBg, text: COLOR.deep, name: "Very high" }
  };
  function bandStyle(id) { return BAND_STYLE[id] || { fill: COLOR.naBg, text: COLOR.muted, name: id ? cap(id) : "Not rated" }; }
  function bandSolid(id) { // strong segment colours for the stacked bars
    return { "low": COLOR.met, "medium": COLOR.near, "high": COLOR.gap, "very-high": COLOR.deep }[id] || "CBD5DE";
  }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  // A consultant's sentence going inside one of ours: without its own full
  // stop, or the report prints "unattributable.. The acceptance rationale".
  function noStop(s) { return String(s || "").replace(/[.\s]+$/, ""); }
  function slug(s) { return String(s || "risk-assessment").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "risk-assessment"; }
  function notSet(v) { return (v && String(v).trim()) ? String(v) : "(not set)"; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  // Names for stored ids: a deliverable prints the name, never the id.
  function sevName(id) { return id ? RT().impactName(id) : ""; }
  function likName(id) { return id ? RT().likelihoodName(id) : ""; }
  // noSafety: the safety designation is stated on its own row.
  function flagNames(o, noSafety) { return Object.keys(o.flags || {}).filter(function (k) { return o.flags[k] && !(noSafety && k === "sis-present"); }).map(function (k) { return RT().flagLabel(k); }); }
  function assetText(a) { return a.name + (a.type && a.type !== "other" ? " (" + RT().assetTypeLabel(a.type) + ")" : ""); }

  // The sentences the asset owner's sign-off prints outside the Sign-off
  // section and document control: [executive summary, Sign-off section when not
  // yet signed]. One place, because a review's content hash leaves them out
  // (js/review.js): signing off after an approval is not a change to what was
  // reviewed.
  // [2] and [3] open the Sign-off section of the detailed and the high-level
  // report once someone has approved, [4] and [5] while nobody has; after
  // them, each report's note for an approval older than a change to what it
  // covers. [0] names every approver who has approved, with the scope of
  // the approval, read from all of them (step 7), not only the first.
  var NOT_SIGNED = "The asset owner has not yet signed off the tolerable risk or the results.";
  var COVERS = {
    detailed: "An approval covers the tolerable risk, the target security levels and the accepted risks in this report, within the scope given for it.",
    highLevel: "An approval covers the tolerable risk and the ranking in this report, within the scope given for it."
  };
  function signOffTexts(p) {
    var states = RT().approvalStates(p);
    var signed = states.filter(function (s) { return s.signed; });
    return [
      signed.length ? signedSentence(signed) : NOT_SIGNED,
      NOT_SIGNED,
      "Signed off as below. " + COVERS.detailed,
      "Signed off as below. " + COVERS.highLevel,
      "For approval by the people below. " + COVERS.detailed,
      "For approval by the people below. " + COVERS.highLevel
    ].concat([].concat.apply([], states.map(function (s) { return [changedText(s, "detailed"), changedText(s, "highLevel")]; })).filter(Boolean));
  }
  // "This assessment was signed off by R. Calder (Asset Owner) and S. Adeyemi
  // (Process Safety Engineer) on 2026-07-04; the scope of each approval is
  // under Sign-off." One date when they share it, else each its own. The
  // scope itself is in the signature table, not repeated here.
  function signedSentence(signed) {
    var dates = signed.map(function (s) { return s.entry.date || ""; }).filter(function (d, i, a) { return a.indexOf(d) === i; });
    var oneDate = dates.length === 1 ? dates[0] : "";
    var bits = signed.map(function (s) {
      var e = s.entry;
      return (e.name || "an approver not named") + (e.role ? " (" + e.role + ")" : "") + (!oneDate && e.date ? " on " + e.date : "");
    });
    var anyScope = signed.some(function (s) { return !!noStop(s.entry.scope); });
    return "This assessment was signed off by " + (bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0]) + (oneDate ? " on " + oneDate : "") +
      (anyScope ? "; the scope of " + (signed.length > 1 ? "each approval" : "the approval") + " is under Sign-off" : "") + ".";
  }
  // The note one report prints for an approval older than a change to what
  // that report says it covers, or null when nothing it covers moved.
  function changedText(s, doc) {
    var parts = RT().approvalChangedFor(s, doc);
    if (!parts.length) return null;
    return "Consultant note: " + RT().approvalPartWords(parts, s.legacy) + " changed after " + (s.entry.name || "this approver") + " approved. Confirm the approval before issue.";
  }
  // Who has approved, for document control and the workbook's Front sheet.
  function signOffLine(p, none) {
    var signed = RT().approvalStates(p).filter(function (s) { return s.signed; });
    if (!signed.length) return none;
    return signed.map(function (s) { var e = s.entry; return (e.name || "Name not recorded") + (e.role ? " (" + e.role + ")" : "") + (e.date ? ", " + e.date : ""); }).join("; ");
  }
  // The signature table's header: a review's content hash leaves out a table
  // that starts with it (js/review.js), as recording an approval is not a
  // change to what was reviewed. "Approver", as a row may not be signed yet.
  var SIGNATURE_HEAD = ["Approver", "Role", "Organisation", "Scope", "Date", "Revision"];

  // Everything the report tells is derived once, shared by both formats: the
  // tool's one view model (js/view-model.js), which the screen, the risk
  // context and the review pack read too. Its owners and threats are the
  // rows the builders below walk; see that file for the shape.
  function summarise(p) {
    return RT().viewModel(p);
  }

  // The zones each ranked system is assigned to, read from the zones' lists
  // (zone.hlaIds, with fromHLA its first entry): { A1: ["Z1", "Z3"] }. A zone
  // may hold several systems, and a system may sit in several zones.
  function zonesBySystem(p) {
    var rt = RT(), out = {};
    p.zones.forEach(function (z) { rt.hlaIdsOf(z).forEach(function (id) { (out[id] = out[id] || []).push(z.id); }); });
    return out;
  }
  // The ranked systems the recorded decisions take to a detailed assessment:
  // on a high-level-only assessment each system's own decision, otherwise a
  // system assigned to a zone recorded as needing one. Suggestions are not
  // decisions and count for nothing here.
  function systemsForDetail(p) {
    var rt = RT(), hlOnly = rt.assessmentType(p) === "high-level";
    var byZone = {};
    p.zones.forEach(function (z) { if (rt.comparison(z, p).required === true) rt.hlaIdsOf(z).forEach(function (id) { byZone[id] = true; }); });
    return p.srs.highLevelAssets.filter(function (a) {
      if (!a.name) return false;
      return hlOnly ? rt.hlaComparison(a, p).required === true : !!byZone[a.id];
    });
  }

  // The threats of a zone or conduit linked to one of its countermeasures
  // or vulnerabilities (ids).
  function linkedThreats(o, id) {
    return (o.threats || []).filter(function (t) { return (t.countermeasureIds || []).indexOf(id) >= 0 || (t.vulnerabilityIds || []).indexOf(id) >= 0; }).map(function (t) { return t.id; });
  }
  // A scenario's likelihood and impact in a state; a state not rated takes
  // the rating before it (as step 5's heat map reads it).
  function stateLI(t, st) {
    var L = t.likelihood, I = t.impact;
    if (st === "current" || st === "planned") { L = t.currentLikelihood || L; I = t.currentImpact || I; }
    if (st === "planned") { L = t.residualLikelihood || L; I = t.residualImpact || I; }
    return { L: L, I: I };
  }
  // The additional (planned) countermeasures across every zone and conduit,
  // in the order a plan is read: priority, then due date, then as entered.
  // [{ m, owner, threats: [threat ids linked to it] }]
  function plannedCountermeasures(S) {
    var rank = { high: 0, medium: 1, low: 2 }, out = [];
    S.owners.forEach(function (row) {
      (row.o.countermeasures || []).forEach(function (m) {
        if (m.existing || !String(m.description || "").trim()) return;
        out.push({ m: m, owner: row.o, threats: linkedThreats(row.o, m.id), n: out.length });
      });
    });
    return out.sort(function (a, b8) {
      var pa = rank[a.m.priority] != null ? rank[a.m.priority] : 3, pb = rank[b8.m.priority] != null ? rank[b8.m.priority] : 3;
      if (pa !== pb) return pa - pb;
      var da = a.m.dueDate || "9999", db = b8.m.dueDate || "9999";
      if (da !== db) return da < db ? -1 : 1;
      return a.n - b8.n;
    });
  }
  // A countermeasure's plan fields in words; "" when not given.
  function cmStatus(m) { return (RT().CM_STATUS_LABEL || {})[m.status] || ""; }
  function cmPriority(m) { return (RT().CM_PRIORITY_LABEL || {})[m.priority] || ""; }
  // The names of the assets a threat links (a conduit's threat names its
  // zones' assets, with the zone).
  function assetNames(owner, t, p) {
    var isConduit = "fromZone" in owner;
    var all = RT().threatAssets(owner, p);
    return (t.assetIds || []).map(function (id) { return all.filter(function (a) { return a.id === id; })[0]; }).filter(Boolean)
      .map(function (a) { return (a.name || a.id) + (isConduit ? " (" + a.zoneId + ")" : ""); });
  }

  /* ===================== WORD ===================== */

  function buildWordDoc(p, opts) {
    opts = opts || {};
    var docx = window.docx;
    var S = summarise(p);
    var eng = p.engagement || {};
    var rt = RT();

    // The consultant's overrides of this report's sections, kept apart from the
    // other report's because same-named sections say different things. See
    // shared/report-sections.js for the store and how it applies.
    var RS = window.App.ReportSections;
    var custom = (p.reportCustom && p.reportCustom[opts.highLevelOnly ? "highLevel" : "detailed"]) || {};
    // Only a heading tagged with a target's name has one stripped: a zone that
    // happens to be called "Risk" must not move the key of "Risk at a glance".
    function keyOf(n) { return RS.sectionKey(n.__headingText, n.__targetName ? [n.__targetName] : []); }
    function orderOf(title) { var c = custom[RS.sectionKey(title)]; return c ? c.order : null; }
    // What a ranked list printed, by id, for the preview's drag and arrows.
    function noteList(title, ids) { if (opts.listProbe) opts.listProbe[RS.sectionKey(title)] = ids; }
    // The sections printed on landscape pages (see the end of this builder).
    // A table there is 14438 wide: A4 landscape less the margins.
    var LAND_KEYS = {};
    ["Risk register", "Treatment plan", "Accepted risks"].forEach(function (t) { LAND_KEYS[RS.sectionKey(t)] = true; });

    // ---- primitives (this app's copy of the Assessments idiom) ----
    // The __tags are read back by the section pass (shared/report-sections.js):
    // a built docx paragraph is write-only, so they are set here, as it is made.
    function run(text, o) {
      o = o || {};
      var r = new docx.TextRun({ text: String(text == null ? "" : text), bold: !!o.bold, italics: !!o.italics, color: o.color || COLOR.text, size: o.size || 21, font: o.font || FONT });
      r.__text = String(text == null ? "" : text);
      return r;
    }
    function para(children, o) {
      o = o || {};
      return new docx.Paragraph({ children: children, spacing: o.spacing || { after: 120 }, alignment: o.alignment });
    }
    function asBody(p, text) { p.__isBody = true; p.__text = String(text == null ? "" : text); return p; }
    function body(text, o) { o = o || {}; return asBody(para([run(text, o)], o), text); }
    // A statement of record inside a section's opening: not wording to rewrite,
    // and still there when the wording around it is rewritten.
    function pinned(p) { p.__isBody = false; p.__keepInRun = true; return p; }
    function heading(text, level, o) {
      o = o || {};
      var p = new docx.Paragraph({
        heading: level,
        spacing: { before: o.before != null ? o.before : 280, after: 120 },
        children: [run(text, { bold: true, color: o.color || COLOR.blueDark, size: o.size || (level === docx.HeadingLevel.HEADING_1 ? 30 : 24) })]
      });
      p.__headingText = text;
      p.__headingLevel = level === docx.HeadingLevel.HEADING_1 ? 1 : 2;
      p.__make = function (t) { return heading(t, level, o); };   // the same heading with other words
      return p;
    }
    function h1(t) { return heading(t, docx.HeadingLevel.HEADING_1); }
    function h2(t) { return heading(t, docx.HeadingLevel.HEADING_2, { size: 24, before: 220 }); }
    function dxaW(n) { return { size: n, type: docx.WidthType.DXA }; }
    function cellDxa(children, width, o) {
      o = o || {};
      return new docx.TableCell({
        width: dxaW(width),
        shading: o.fill ? { type: docx.ShadingType ? docx.ShadingType.SOLID : "solid", color: o.fill, fill: o.fill } : undefined,
        verticalAlign: o.valign,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: Array.isArray(children) ? children : [children]
      });
    }
    function textCell(text, width, o) { o = o || {}; return cellDxa(para([run(text, o)], { spacing: { after: 0 } }), width, o); }
    function headerRow(labels, widths) {
      return new docx.TableRow({
        tableHeader: true,
        children: labels.map(function (l, i) { return textCell(l, widths[i], { bold: true, color: "FFFFFF", fill: COLOR.headBg }); })
      });
    }
    function fixedTable(rows, widths) {
      return new docx.Table({
        rows: rows,
        width: dxaW(widths.reduce(function (a, b) { return a + b; }, 0)),
        columnWidths: widths,
        layout: docx.TableLayoutType ? docx.TableLayoutType.FIXED : undefined
      });
    }
    function kvTable(pairs) {
      var w = [2800, 6200];
      return fixedTable(pairs.map(function (kv) {
        return new docx.TableRow({ children: [
          textCell(kv[0], w[0], { bold: true, fill: COLOR.subBg }),
          textCell(kv[1], w[1])
        ] });
      }), w);
    }
    // ---- a zone's or conduit's characteristics: a table of what is
    // recorded (rows with nothing are left out), then each separation the
    // zones page raised that is not in place, with its reason, and in red one
    // not yet answered. ----
    // EXT is outside the SUC; an end not chosen says so, and is never read
    // as external.
    function endName(id) {
      if (!id) return "not set";
      if (id === "EXT") return "external";
      var z = p.zones.filter(function (x) { return x.id === id; })[0];
      return id + (z && z.name ? " " + z.name : "");
    }
    function characteristics(row) {
      var o = row.o, out = [], pairs;
      function lines(v) { return (Array.isArray(v) ? v : []).join("; "); }
      if (row.isZone) {
        var conds = p.conduits.filter(function (c) { return c.fromZone === o.id || c.toZone === o.id; });
        pairs = [
          ["Function", o.fn], ["Logical boundary", o.description], ["Physical boundary", o.physicalBoundary],
          ["Accountable organisation", o.accountableOrg],
          ["Safety designation", rt.zoneSafety(o) ? "Safety related" : "Not safety related"],
          ["Assets", o.assets.map(function (a) { return assetText(a) + (a.link ? ", " + rt.assetLinkLabel(a.link) : ""); }).join("; ")],
          ["Logical access points", lines(o.accessPoints)], ["Physical access points", lines(o.physicalAccessPoints)],
          ["Data flows", lines(o.dataFlows)],
          ["Conduits", conds.map(function (c) { return c.id + (c.name ? " " + c.name : "") + " to " + endName(c.fromZone === o.id ? c.toZone : c.fromZone); }).join("; ")],
          ["External dependencies", lines(o.externalDependencies)], ["Security policies", lines(o.securityPolicies)],
          ["Assumptions", lines(o.assumptions)], ["Exposure", cap(flagNames(o, true).join(", "))]
        ];
      } else {
        var dir = o.direction === "both" ? "Both ways" : o.direction === "from-to" ? "One way, " + endName(o.fromZone) + " to " + endName(o.toZone)
          : o.direction === "to-from" ? "One way, " + endName(o.toZone) + " to " + endName(o.fromZone) : "";
        var marks = [];
        if (o.wireless) marks.push("wireless");
        if (rt.conduitExternal(o)) marks.push("external network" + (o.externalParty ? " (" + o.externalParty + ")" : ""));
        if (o.temporary) marks.push("temporarily connected");
        pairs = [
          ["Ends", cap(endName(o.fromZone) + " and " + endName(o.toZone))], ["Direction", dir],
          ["Channels and protocols", (o.channels || []).join(", ")], ["Boundary devices", lines(o.boundaryDevices)],
          ["Connection", marks.length ? cap(marks.join(", ")) : ""], ["Notes", o.notes]
        ];
      }
      out.push(para([run(o.id + ": " + (o.name || "(unnamed " + row.kind.toLowerCase() + ")"), { bold: true })], { spacing: { before: 160, after: 80 } }));
      out.push(kvTable(pairs.filter(function (kv) { return kv[1] && String(kv[1]).trim(); })));
      if (row.isZone) rt.separationRows(o, p).forEach(function (r) {
        if (r.answer === "not-separated") out.push(para([run(r.label + " are not kept separate. ", { bold: true }), run(r.reason || "No reason recorded.", r.reason ? {} : { color: COLOR.note })], { spacing: { before: 80, after: 80 } }));
        else if (!r.answer) out.push(para([run("Consultant note: whether " + r.label.toLowerCase() + " are kept separate is not yet recorded.", { color: COLOR.note, italics: true })], { spacing: { before: 80, after: 80 } }));
      });
      return out;
    }
    // ---- the risk criteria appendix: the matrix with the tolerable line
    // (cells above it carry a heavy border), the impact and likelihood
    // scales, the security levels and, in the detailed report, the
    // foundational requirements' key. ----
    function criteriaAppendix() {
      var R0 = RULES(), out = [], tol = S.tolerable, tolN = bandStyle(tol).name;
      var SEVS = R0.severityScale, LIKS = R0.likelihoodScale;
      function plain(s) { return cap(String(s || "").replace(/^House default:\s*/i, "")); }
      var BS = (docx.BorderStyle && docx.BorderStyle.SINGLE) || "single";
      var heavy = { style: BS, size: 18, color: COLOR.text };
      out.push(h1("Appendix: risk criteria"));
      // House criteria, and said to be. Where the client's own are in use the
      // tables are the house's for reference, and how the ratings relate to
      // the client's criteria is the consultant's to set out (in red until then).
      out.push(body(p.srs.clientMatrix ? "The SolutionsPT house risk criteria, shown for reference." : "The SolutionsPT house risk criteria used in this assessment."));
      if (p.srs.clientMatrix) out.push(pinned(body("Consultant note: the client's own risk criteria are in use" + (p.srs.clientMatrixNote ? " (" + noStop(p.srs.clientMatrixNote) + ")" : "") + ". Set out how the ratings in this report relate to them, or replace these tables, before issue.", { color: COLOR.note, italics: true })));
      out.push(h2("Risk matrix"));
      var mw = [2500].concat(LIKS.map(function () { return Math.floor(6500 / LIKS.length); }));
      var mrows = [headerRow(["Impact, by likelihood"].concat(LIKS.map(function (l) { return l.name; })), mw)];
      SEVS.slice().reverse().forEach(function (sv) {
        mrows.push(new docx.TableRow({ children: [textCell(sv.name, mw[0], { bold: true, fill: COLOR.subBg })].concat(LIKS.map(function (l, i) {
          var b = R0.riskMatrix[sv.id][l.id], st = bandStyle(b), above = rt.exceedsTolerable(b, tol);
          var c = new docx.TableCell({
            width: dxaW(mw[i + 1]),
            shading: { type: docx.ShadingType ? docx.ShadingType.SOLID : "solid", color: st.fill, fill: st.fill },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            borders: above ? { top: heavy, bottom: heavy, left: heavy, right: heavy } : undefined,
            children: [para([run(st.name + (above ? " (above)" : ""), { bold: true, color: st.text })], { spacing: { after: 0 } })]
          });
          return c;
        })) }));
      });
      out.push(fixedTable(mrows, mw));
      out.push(pinned(body("Tolerable risk is " + tolN + ". Cells marked above, with a heavy border, are above it: " + (opts.highLevelOnly ? "a system rated there is a candidate for a detailed assessment." : "a threat rated there needs a recorded treatment decision."))));
      function scaleTable(title, arr) {
        out.push(h2(title));
        var w = [2000, 7000];
        out.push(fixedTable([headerRow(["Level", "Meaning"], w)].concat(arr.slice().reverse().map(function (x) {
          return new docx.TableRow({ children: [textCell(x.name, w[0], { bold: true }), textCell(plain(x.note), w[1])] });
        })), w));
      }
      scaleTable("Impact scale", SEVS);
      scaleTable("Likelihood scale", LIKS);
      out.push(h2("Security levels"));
      var lw = [2000, 7000], defs = R0.slDefinitions || {};
      out.push(fixedTable([headerRow(["Security level", "Protects against"], lw)].concat(["1", "2", "3", "4"].filter(function (k) { return defs[k]; }).map(function (k) {
        return new docx.TableRow({ children: [textCell("SL" + k, lw[0], { bold: true }), textCell(defs[k], lw[1])] });
      })), lw));
      if (!opts.highLevelOnly) {
        var m = R0.riskToSL || {};
        out.push(pinned(body("The house mapping suggests an SL-T from the unmitigated risk: " + R0.riskBands.map(function (b) { var x = m[b.id]; return x ? b.name + " SL" + x.suggest : null; }).filter(Boolean).join(", ") + ". SL4 is considered only where a nation-state-grade adversary is in scope.")));
        out.push(h2("Foundational requirements"));
        var fw = [2000, 7000];
        out.push(fixedTable([headerRow(["Short form", "Foundational requirement"], fw)].concat(FRS().map(function (f) {
          return new docx.TableRow({ children: [textCell(f.id, fw[0], { bold: true }), textCell(f.fr + " " + String(f.name).replace(/ & /g, " and "), fw[1])] });
        })), fw));
      }
      return out;
    }
    function bulletList(items) {
      return items.map(function (t) {
        return new docx.Paragraph({ children: [run(t)], bullet: { level: 0 }, spacing: { after: 60 } });
      });
    }
    function bandCell(bandId, width) {
      var st = bandStyle(bandId);
      return textCell(st.name, width, { fill: st.fill, color: st.text, bold: true, valign: "center" });
    }
    // One of a threat's three ratings (schema 0.3): the band, and under it the
    // likelihood and impact when they are given. A current or planned rating
    // not given prints blank (the one before it stands); an unmitigated one
    // not given says so.
    function ratingCell(band, li, width, blankIfNone) {
      if (!band && blankIfNone) return textCell("", width);
      // Rated on one side only: the side given, and the other in words. A dash
      // beside a rating reads as a typo, and the review tool's dash check
      // would report it as one.
      if (!band && li && (li.L || li.I)) return textCell((li.L ? likName(li.L) : "Not rated") + " × " + (li.I ? sevName(li.I) : "Not rated"), width, { color: COLOR.muted });
      if (!band) return textCell("Not rated", width, { color: COLOR.muted });
      var st = bandStyle(band), kids = [para([run(st.name, { bold: true, color: st.text })], { spacing: { after: 0 } })];
      if (li && li.L && li.I) kids.push(para([run(likName(li.L) + " × " + sevName(li.I), { color: st.text, size: 16 })], { spacing: { after: 0 } }));
      return cellDxa(kids, width, { fill: st.fill, valign: "center" });
    }
    // The recorded decision on a detailed assessment; none recorded is a
    // prompt, in red.
    function decisionCell(c, width) {
      if (c.required === true) return textCell("Required", width, { bold: true });
      if (c.required === false) return textCell("Not required", width);
      return textCell("Not decided", width, { bold: true, color: COLOR.note });
    }
    // Tagged as closing a level 2 section, so hiding the sub-section it follows
    // leaves the break in place, while hiding the level 1 section takes it too.
    function pageBreak() {
      var p = new docx.Paragraph({ children: [new docx.PageBreak()] });
      p.__headingLevel = 2; p.__boundaryOnly = true;
      return p;
    }

    // ---- brand assets: logo header + Design-B cover (copied design) ----
    function logoImageRun(targetWidthPx) {
      var logo = (window.App && window.App.Assets && window.App.Assets.logo) || null;
      if (!logo) return null;
      var w = targetWidthPx;
      var hgt = Math.round(w / (logo.aspect || (logo.width / logo.height)));
      return new docx.ImageRun({ data: logo.bytes(), transformation: { width: w, height: hgt } });
    }
    function brandHeaders() {
      var img = logoImageRun(150);
      if (!img) return undefined;
      return { default: new docx.Header({ children: [ new docx.Paragraph({
        alignment: docx.AlignmentType ? docx.AlignmentType.RIGHT : "right",
        spacing: { after: 80 },
        children: [img]
      }) ] }) };
    }
    function brandFootersDoc() {
      var AT = docx.AlignmentType || { CENTER: "center", RIGHT: "right" };
      var WT = docx.WidthType, PN = docx.PageNumber || { CURRENT: "current" };
      function fc(par, w) { return new docx.TableCell({ width: { size: w, type: WT.PERCENTAGE }, borders: TBL_NONE, children: [par] }); }
      var L = new docx.Paragraph({ spacing: { before: 0, after: 0 }, children: [run("Confidential · © SolutionsPT Ltd", { size: 14, color: COLOR.soft })] });
      var M = new docx.Paragraph({ alignment: AT.CENTER, spacing: { before: 0, after: 0 }, children: [run("OT Cyber Risk Assessment · " + (eng.client || p.suc.name || ""), { size: 14, color: COLOR.soft })] });
      var R = new docx.Paragraph({ alignment: AT.RIGHT, spacing: { before: 0, after: 0 }, children: [new docx.TextRun({ children: [PN.CURRENT], font: FONT, size: 14, color: COLOR.soft })] });
      return { default: new docx.Footer({ children: [ new docx.Table({ width: { size: 100, type: WT.PERCENTAGE }, borders: TBL_NONE, rows: [ new docx.TableRow({ children: [fc(L, 34), fc(M, 46), fc(R, 20)] }) ] }) ] }) };
    }
    // Full-bleed cover: navy hero background + logo card + brand type — the
    // same Design-B layout as the Assessments reports, fed from this app's
    // engagement fields.
    function coverDesignB(titleLines, subLine) {
      var TableRow = docx.TableRow, TableCell = docx.TableCell, ShadingType = docx.ShadingType || { SOLID: "solid" };
      var HR = docx.HeightRule || { ATLEAST: "atLeast" };
      var PAGE_W = 11906;
      var kids = [];
      var bg = (window.App.Assets && window.App.Assets.coverBg) || null;
      if (bg) {
        kids.push(new docx.Paragraph({ spacing: { after: 0, line: 1, lineRule: "exact" }, children: [ new docx.ImageRun({
          data: bg.bytes(), transformation: { width: 824, height: 1240 },
          floating: { horizontalPosition: { relative: "page", offset: -91440 }, verticalPosition: { relative: "page", offset: -457200 }, behindDocument: true, allowOverlap: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } }
        }) ] }));
      }
      var lcAsset = (window.App.Assets && window.App.Assets.logoCard) || null;
      if (lcAsset) {
        kids.push(new docx.Paragraph({ children: [ new docx.ImageRun({ data: lcAsset.bytes(), transformation: { width: 250, height: Math.round(250 / (lcAsset.aspect || (lcAsset.width / lcAsset.height))) } }) ] }));
      }
      kids.push(new docx.Paragraph({ spacing: { before: 820, after: 70 }, children: [ run("OT CYBER RISK ASSESSMENT", { color: COLOR.skyBlue, bold: true, size: 21 }) ] }));
      kids.push(new docx.Table({
        width: dxaW(900), columnWidths: [900], borders: TBL_NONE,
        rows: [ new TableRow({ height: { value: 48, rule: HR.ATLEAST }, children: [ new TableCell({
          shading: { type: ShadingType.SOLID, color: COLOR.brandBlue, fill: COLOR.brandBlue },
          children: [ new docx.Paragraph({ spacing: { before: 0, after: 0, line: 30, lineRule: "exact" }, children: [ run("", { size: 1 }) ] }) ]
        }) ] }) ]
      }));
      titleLines.forEach(function (ln, i) {
        kids.push(new docx.Paragraph({ spacing: { before: i === 0 ? 220 : 0, after: 0 }, children: [ run(ln, { color: "FFFFFF", bold: true, size: 52 }) ] }));
      });
      kids.push(new docx.Paragraph({ spacing: { before: 240 }, children: [ run(eng.client || "Client", { color: "C7D8E8", size: 30 }) ] }));
      if (p.suc.name) kids.push(new docx.Paragraph({ spacing: { before: 0 }, children: [ run(p.suc.name, { color: "9DB8D6", size: 21 }) ] }));
      if (subLine) kids.push(new docx.Paragraph({ spacing: { before: 150 }, children: [ run(subLine, { color: COLOR.skyBlue, size: 20, bold: true }) ] }));
      kids.push(new docx.Paragraph({ spacing: { before: 0, after: 0, line: 8800, lineRule: "exact" }, children: [ run("", { size: 1 }) ] }));
      kids.push(new docx.Paragraph({ spacing: { before: 0, after: 120 }, children: [
        run("ISSUE   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
        run((eng.revision || "0.1") + "  ·  " + (eng.assessmentDate || todayISO()), { color: "FFFFFF", size: 19 }),
        run("        AUTHOR   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
        run(eng.consultant || "", { color: "FFFFFF", size: 19 }),
        run("        CLASSIFICATION   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
        run(eng.confidentiality || "Confidential", { color: "FFFFFF", size: 19 })
      ] }));
      kids.push(new docx.Paragraph({ spacing: { before: 0, after: 0 }, children: [ run("SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX", { color: "DBE6F1", size: 15 }) ] }));
      kids.push(new docx.Paragraph({ children: [ run("Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com", { color: "DBE6F1", size: 15 }) ] }));
      var coverCell = new TableCell({ margins: { top: 760, bottom: 560, left: 800, right: 800 }, children: kids });
      return [
        new docx.Table({ width: dxaW(PAGE_W), columnWidths: [PAGE_W], borders: TBL_NONE, rows: [ new TableRow({ children: [coverCell] }) ] }),
        new docx.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: "exact" }, children: [ run("", { size: 1 }) ] })
      ];
    }

    // ---- scorecard chassis (tiles / stacked bars / focus cards — copied design) ----
    function sbP(txt, o) { o = o || {}; return new docx.Paragraph({ alignment: o.align, spacing: o.spacing || { before: 0, after: 0 }, children: [run(txt, { bold: o.bold, color: o.color, size: o.size })] }); }
    function sbTilesRow(tiles) {
      var TR = docx.TableRow, TC = docx.TableCell, SH = docx.ShadingType || { SOLID: "solid" }, WT = docx.WidthType, AT = docx.AlignmentType || { CENTER: "center" };
      var n = tiles.length, tw = Math.floor((100 - (n - 1) * 2.4) / n * 10) / 10, cells = [];
      tiles.forEach(function (t, i) {
        if (i) cells.push(new TC({ borders: TBL_NONE, width: { size: 2.4, type: WT.PERCENTAGE }, children: [sbP("", { size: 2 })] }));
        cells.push(new TC({ borders: TBL_NONE, width: { size: tw, type: WT.PERCENTAGE }, shading: { type: SH.SOLID, color: t.fill, fill: t.fill }, margins: { top: 160, bottom: 150, left: 50, right: 50 }, verticalAlign: "center",
          children: [sbP(t.t, { align: AT.CENTER, bold: true, color: t.color, size: t.size || 44 }), sbP(t.label, { align: AT.CENTER, color: COLOR.muted, size: 14, spacing: { before: 40, after: 0 } })] }));
      });
      return new docx.Table({ width: { size: 100, type: WT.PERCENTAGE }, borders: TBL_NONE, rows: [new TR({ children: cells })] });
    }
    function sbStackRow(label, segs) {
      var TR = docx.TableRow, TC = docx.TableCell, SH = docx.ShadingType || { SOLID: "solid" }, TLT = docx.TableLayoutType || { FIXED: "fixed" };
      var barW = 6026, t = 0; segs.forEach(function (s) { t += s.n; }); t = t || 1; var sw = [], sc = [];
      segs.forEach(function (s) {
        if (s.n) {
          var w = Math.max(60, Math.round(barW * s.n / t)); sw.push(w);
          sc.push(new TC({ borders: TBL_NONE, width: dxaW(w), shading: { type: SH.SOLID, color: s.color, fill: s.color }, children: [new docx.Paragraph({ spacing: { before: 0, after: 0, line: 170, lineRule: "exact" }, children: [run("", { size: 2 })] })] }));
        }
      });
      if (!sc.length) { sw.push(barW); sc.push(new TC({ borders: TBL_NONE, width: dxaW(barW), children: [new docx.Paragraph({ spacing: { before: 0, after: 0, line: 170, lineRule: "exact" }, children: [run("", { size: 2 })] })] })); }
      var bar = new docx.Table({ width: dxaW(barW), layout: TLT.FIXED, columnWidths: sw, borders: TBL_NONE, rows: [new TR({ children: sc })] });
      return new TR({ children: [
        new TC({ borders: TBL_NONE, width: dxaW(3000), verticalAlign: "center", margins: { top: 30, bottom: 30, right: 120 }, children: [sbP(label, { size: 15, color: COLOR.text })] }),
        new TC({ borders: TBL_NONE, width: dxaW(6026), verticalAlign: "center", children: [bar] })
      ] });
    }
    function sbStackTable(rows) {
      var TLT = docx.TableLayoutType || { FIXED: "fixed" };
      return new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, layout: TLT.FIXED, columnWidths: [3000, 6026], borders: TBL_NONE, rows: rows });
    }
    function sbLegend(items) {
      var ch = [];
      items.forEach(function (it) { ch.push(run("■ ", { color: it.color, size: 18 })); ch.push(run(it.label + "      ", { size: 14, color: COLOR.muted })); });
      return new docx.Paragraph({ spacing: { before: 120, after: 0 }, children: ch });
    }
    function sbFocusCard(n, name, tag) {
      var TR = docx.TableRow, TC = docx.TableCell, SH = docx.ShadingType || { SOLID: "solid" }, WT = docx.WidthType, AT = docx.AlignmentType || { CENTER: "center", RIGHT: "right" }, TLT = docx.TableLayoutType || { FIXED: "fixed" };
      return new docx.Table({ width: { size: 100, type: WT.PERCENTAGE }, layout: TLT.FIXED, columnWidths: [620, 5800, 2606], borders: TBL_NONE, rows: [new TR({ children: [
        new TC({ borders: TBL_NONE, width: dxaW(620), shading: { type: SH.SOLID, color: COLOR.navy, fill: COLOR.navy }, verticalAlign: "center", margins: { top: 90, bottom: 90 }, children: [sbP(String(n), { align: AT.CENTER, bold: true, color: "FFFFFF", size: 18 })] }),
        new TC({ borders: TBL_NONE, width: dxaW(5800), shading: { type: SH.SOLID, color: "F5F8FA", fill: "F5F8FA" }, verticalAlign: "center", margins: { top: 90, bottom: 90, left: 170, right: 80 }, children: [sbP(name, { size: 17, color: COLOR.text })] }),
        new TC({ borders: TBL_NONE, width: dxaW(2606), shading: { type: SH.SOLID, color: "F5F8FA", fill: "F5F8FA" }, verticalAlign: "center", margins: { top: 90, bottom: 90, left: 80, right: 170 }, children: [sbP(tag, { align: AT.RIGHT, size: 15, color: COLOR.muted })] })
      ] })] });
    }
    function sbSpacer() { return new docx.Paragraph({ spacing: { before: 0, after: 0, line: 120, lineRule: "exact" }, children: [run("", { size: 2 })] }); }

    // ---- "Risk at a glance" scorecard page ----
    function scorecardPage() {
      var out = [];
      out.push(heading("Risk at a glance", docx.HeadingLevel.HEADING_1, { before: 0 }));
      var exceed = S.threats.filter(function (x) { return x.exceeds; });
      var decided = exceed.filter(function (x) { return x.decided; }).length;
      if (opts.highLevelOnly) {
        var ranked = p.srs.highLevelAssets.filter(function (a) { return a.name; });
        var aboveTol = ranked.filter(function (a) { return rt.exceedsTolerable(rt.riskFor(a.consequence, a.likelihood), S.tolerable); }).length;
        var forDetail = systemsForDetail(p).length;
        out.push(sbTilesRow([
          { t: String(ranked.length), color: COLOR.navy, label: "systems ranked", fill: COLOR.subBg },
          { t: String(aboveTol), color: aboveTol ? COLOR.gap : COLOR.met, label: "above tolerable risk", fill: aboveTol ? COLOR.gapBg : COLOR.metBg },
          { t: bandStyle(S.tolerable).name, color: bandStyle(S.tolerable).text, label: "tolerable risk", fill: bandStyle(S.tolerable).fill, size: 32 },
          { t: String(forDetail), color: COLOR.navy, label: "for detailed assessment", fill: COLOR.subBg }
        ]));
        out.push(body("Systems in scope ranked by consequence and likelihood on the SolutionsPT house risk matrix.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
        // Ranking as a stacked overview: one row, systems per band.
        var perBand = { "very-high": 0, "high": 0, "medium": 0, "low": 0 };
        p.srs.highLevelAssets.forEach(function (a) { var b3 = rt.riskFor(a.consequence, a.likelihood); if (b3 && perBand[b3] != null) perBand[b3] += 1; });
        out.push(h2("Systems by risk band"));
        out.push(sbStackTable([ sbStackRow("All ranked systems", [
          { n: perBand["very-high"], color: COLOR.deep }, { n: perBand["high"], color: COLOR.gap },
          { n: perBand["medium"], color: COLOR.near }, { n: perBand["low"], color: COLOR.met }
        ]) ]));
        out.push(sbLegend([
          { color: COLOR.deep, label: "Very high" }, { color: COLOR.gap, label: "High" },
          { color: COLOR.near, label: "Medium" }, { color: COLOR.met, label: "Low" }
        ]));
        var topRanked = RS.applyOrder(p.srs.highLevelAssets.filter(function (a) { return a.name; }).slice().sort(function (a, b4) {
          return (S.bandRank[rt.riskFor(b4.consequence, b4.likelihood)] || 0) - (S.bandRank[rt.riskFor(a.consequence, a.likelihood)] || 0);
        }), orderOf("Where to look first"), function (a) { return a.id; }).slice(0, 3);
        noteList("Where to look first", topRanked.map(function (a) { return a.id; }));
        if (topRanked.length) {
          out.push(h2("Where to look first"));
          topRanked.forEach(function (a, i) {
            var b5 = rt.riskFor(a.consequence, a.likelihood);
            out.push(sbFocusCard(i + 1, a.name, bandStyle(b5).name));
            out.push(sbSpacer());
          });
        }
        return out;
      }
      var sltWorst = FRS().map(function (f) { return S.sltMax[f.id]; }).reduce(function (m, v) { return v != null && (m === null || v > m) ? v : m; }, null);
      out.push(sbTilesRow([
        { t: String(S.threats.length), color: COLOR.navy, label: "threats registered", fill: COLOR.subBg },
        { t: String(exceed.length), color: exceed.length ? COLOR.gap : COLOR.met, label: "above tolerable (" + bandStyle(S.tolerable).name + ")", fill: exceed.length ? COLOR.gapBg : COLOR.metBg },
        { t: decided + "/" + exceed.length, color: decided === exceed.length ? COLOR.met : COLOR.gap, label: "with a treatment decision", fill: decided === exceed.length ? COLOR.metBg : COLOR.gapBg },
        { t: sltWorst == null ? "None" : "SL" + sltWorst, color: COLOR.navy, label: "highest SL-T set", fill: COLOR.subBg }
      ]));
      out.push(body("Threats per zone and conduit by unmitigated risk band. The tolerable risk is " + bandStyle(S.tolerable).name + ".", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
      out.push(h2("Risk profile by zone and conduit"));
      var stacks = [];
      S.owners.forEach(function (row) {
        var o = row.o;
        var per = { "very-high": 0, "high": 0, "medium": 0, "low": 0 };
        row.threats.forEach(function (x) { if (x.risk && per[x.risk] != null) per[x.risk] += 1; });
        stacks.push(sbStackRow(o.id + " " + (o.name || ""), [
          { n: per["very-high"], color: COLOR.deep }, { n: per["high"], color: COLOR.gap },
          { n: per["medium"], color: COLOR.near }, { n: per["low"], color: COLOR.met }
        ]));
      });
      if (stacks.length) {
        out.push(sbStackTable(stacks));
        out.push(sbLegend([
          { color: COLOR.deep, label: "Very high" }, { color: COLOR.gap, label: "High" },
          { color: COLOR.near, label: "Medium" }, { color: COLOR.met, label: "Low" }
        ]));
      }
      // SL-T vector tiles (worst case per FR).
      out.push(h2("Target security levels: worst case per foundational requirement"));
      out.push(sbTilesRow(FRS().map(function (f) {
        var v = S.sltMax[f.id];
        return { t: v == null ? "Not set" : "SL" + v, color: v != null ? COLOR.navy : COLOR.soft, label: f.id, fill: COLOR.subBg, size: v == null ? 18 : 28 };
      })));
      // Focus cards: the threats still above tolerable risk today, ranked on
      // the rating that stands today (worst first; of equals, one with no
      // complete decision first, then as registered).
      function focusId(x) { return x.owner.id + ":" + x.t.id; }
      var focus = RS.applyOrder(S.threats.filter(function (x) { return x.todayExceeds; })
        .map(function (x, i) { return { x: x, i: i }; })
        .sort(function (a, b6) { return ((S.bandRank[b6.x.today] || 0) - (S.bandRank[a.x.today] || 0)) || ((a.x.decided ? 1 : 0) - (b6.x.decided ? 1 : 0)) || (a.i - b6.i); })
        .map(function (e) { return e.x; }),
        orderOf("Where to focus first"), focusId)
        .slice(0, 3);
      noteList("Where to focus first", focus.map(focusId));
      if (focus.length) {
        out.push(h2("Where to focus first"));
        focus.forEach(function (x, i) {
          out.push(sbFocusCard(i + 1, x.t.id + "  " + x.t.statement, x.owner.id + " · " + bandStyle(x.today).name + " today" + (x.decided ? "" : x.incomplete ? " · decision incomplete" : " · no decision recorded")));
          out.push(sbSpacer());
        });
      }
      return out;
    }

    var titleLines = opts.highLevelOnly ? ["High-Level OT Cyber", "Risk Assessment"] : ["OT Cyber Risk", "Assessment"];
    var subLine = opts.highLevelOnly
      ? "IEC 62443-3-2: high-level risk assessment and system ranking"
      : "IEC 62443-3-2: zones, conduits and target security levels";
    var coverChildren = opts.preview ? [] : coverDesignB(titleLines, subLine);

    // ---- document control ----
    var children = [];
    children.push(heading("Document control", docx.HeadingLevel.HEADING_1, { before: 0 }));
    children.push(kvTable([
      ["Client / organisation", notSet(eng.client)],
      ["System under consideration", notSet(p.suc.name)],
      ["Consultant", notSet(eng.consultant)],
      ["Assessment date", notSet(eng.assessmentDate)],
      ["Document revision", notSet(eng.revision)],
      // Exactly this label: a review's content hash leaves the row out
      // (shared/docx-blocks.js), as an approval is what fills it in.
      ["QA review by", notSet(eng.qaReviewBy)],
      ["Confidentiality", notSet(eng.confidentiality)],
      ["Method", opts.highLevelOnly ? "IEC 62443-3-2 high-level risk assessment, using the SolutionsPT house risk matrix" : "IEC 62443-3-2, using the SolutionsPT house risk matrix and risk-to-SL mapping"],
      ["Asset-owner sign-off", signOffLine(p, "Not yet signed off")]
    ]));
    children.push(pageBreak());

    // ---- executive summary (a narrative composed from the data; the
    // consultant tailors it — red delete-me note per house convention) ----
    children.push(heading("Executive summary", docx.HeadingLevel.HEADING_1, { before: 0 }));
    var ranked = p.srs.highLevelAssets.filter(function (a) { return a.name; });
    var tolName = bandStyle(S.tolerable).name;
    var forDetail = systemsForDetail(p);
    function flagsPhrase(o) {
      var on = flagNames(o);
      return on.length ? " (" + on.join(", ") + ")" : "";
    }
    var bs = p.basisOfAssessment || { interviews: [], documents: [], observations: [] };
    function basisSentence() {
      var bits = [];
      if (bs.interviews.length) bits.push(bs.interviews.length + " interview" + (bs.interviews.length > 1 ? "s" : ""));
      if (bs.documents.length) bits.push(bs.documents.length + " document" + (bs.documents.length > 1 ? "s" : ""));
      if (bs.observations.length) bits.push(bs.observations.length + " direct observation" + (bs.observations.length > 1 ? "s" : ""));
      if (!bits.length) return null;
      var listed = bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0];
      return "The findings are based on " + listed + ", all listed under Basis of assessment.";
    }
    // The consultant's own phrase inside our sentence: "are Continuous control"
    // reads as a typo, but an acronym such as "SIS" keeps its capitals.
    function lc1(s) { s = String(s || "").replace(/\.\s*$/, ""); return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
    function stakesKids() {
      var out = [];
      if (p.srs.essentialFunctions || p.srs.worstCase) {
        out.push(body((p.srs.essentialFunctions ? "The essential functions in scope are " + lc1(p.srs.essentialFunctions) + ". " : "") + (p.srs.worstCase ? "The credible worst-case consequence is " + lc1(p.srs.worstCase) + ". " : "") + "Risk in this report means the likelihood and severity of " + (p.srs.essentialFunctions && !p.srs.worstCase ? "losing those functions" : "that outcome") + ", not the loss of data or an IT service."));
      }
      if (p.srs.adversaryClass) {
        // The house summary of the level (the rules file), as the criteria appendix prints it.
        var advDef = (RULES().slDefinitions || {})[String(p.srs.adversaryClass)];
        out.push(body("The assumed adversary is SL" + p.srs.adversaryClass + " grade on the IEC 62443 scale, meaning " + (advDef ? noStop(advDef.charAt(0).toLowerCase() + advDef.slice(1)) : "see the requirements section") + ". This choice is the asset owner's, because it sets how strong the countermeasures must be."));
      }
      return out;
    }
    if (opts.highLevelOnly) {
      children.push(h2("Why this assessment"));
      children.push(body("A cyber incident on a plant can stop production, damage equipment and put people at risk. Before investing in detailed security engineering, " + notSet(eng.client) + " needs to know which systems across " + (p.suc.name || "the systems in scope") + " carry the most risk, and which justify a detailed assessment."));
      children = children.concat(stakesKids());
      children.push(h2("What this report is"));
      children.push(body("This is the first tier of an IEC 62443-3-2 risk assessment, the high-level cyber security risk assessment" + (eng.assessmentDate ? ", carried out " + eng.assessmentDate : "") + ". Each system in scope was ranked by the consequence and likelihood of its compromise, and the resulting risk band compared with the tolerable risk of " + tolName + ". The ranking is relative. It puts the systems in priority order but does not measure absolute risk or set security targets."));
      var bSent = basisSentence();
      if (bSent) children.push(body(bSent));
      children.push(h2("What we found"));
      var perBandHL = { "very-high": [], "high": [], "medium": [], "low": [] };
      ranked.forEach(function (a) { var b0 = rt.riskFor(a.consequence, a.likelihood); if (b0 && perBandHL[b0]) perBandHL[b0].push(a); });
      var bandBits = [];
      [["very-high", "Very high"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]].forEach(function (pr) {
        if (perBandHL[pr[0]].length) bandBits.push(perBandHL[pr[0]].length + " " + pr[1]);
      });
      // The candidates are the systems above tolerable risk. On a
      // high-level-only assessment the decision is recorded per system, so a
      // recorded Not required takes a system out (with its reason), and a
      // recorded Required adds one; on a full assessment the decision is made
      // per zone, and the systems in a zone recorded as needing one are counted.
      var hlOnlyType = rt.assessmentType(p) === "high-level";
      function decided(a) { return hlOnlyType ? rt.hlaComparison(a, p) : null; }
      function withReasons(list) { return list.map(function (a) { var r = noStop((decided(a) || {}).reason || ""); return a.name + (r ? ": " + lc1(r) : ""); }).join("; "); }
      var aboveTol = ranked.filter(function (a) { return rt.exceedsTolerable(rt.riskFor(a.consequence, a.likelihood), S.tolerable); });
      var skipped = aboveTol.filter(function (a) { var c = decided(a); return c && c.required === false; });
      var candidates = aboveTol.filter(function (a) { return skipped.indexOf(a) < 0; });
      var extra = hlOnlyType ? ranked.filter(function (a) { return aboveTol.indexOf(a) < 0 && decided(a).required === true; }) : [];
      if (ranked.length) {
        var found = ranked.length + " systems were ranked" + (bandBits.length ? ": " + bandBits.join(", ") : "") + ".";
        if (candidates.length) {
          found += " The systems above the tolerable risk of " + tolName + " (" + candidates.map(function (a) { return a.name; }).join(", ") + ") are the candidates for a detailed assessment" +
            (!hlOnlyType && forDetail.length ? "; " + forDetail.length + " ranked system" + (forDetail.length === 1 ? " is" : "s are") + " in zones taken to a detailed assessment" : "") + ".";
        } else if (!aboveTol.length) {
          found += " No system is above the tolerable risk of " + tolName + ", so on this evidence a detailed assessment is optional.";
        }
        if (extra.length) found += " A detailed assessment was also judged needed for " + withReasons(extra) + ".";
        if (skipped.length) found += " A detailed assessment was judged not needed for " + withReasons(skipped) + ".";
        children.push(body(found));
      } else {
        children.push(body("No systems have been ranked yet."));
      }
      children.push(h2("What happens next"));
      children.push(body("Next, the systems are grouped into security zones and conduits, and the initial risk of each zone and conduit is compared with the tolerable risk to decide where a detailed assessment is needed. There, threats are registered and treated, and target security levels are set to scope the engineering work. Systems below the threshold should be re-ranked if their connectivity, criticality or threat exposure changes."));
    } else {
      var exceed = S.threats.filter(function (x) { return x.exceeds; });
      function nOf(n, one, many) { return n + " " + (n === 1 ? one : many); }
      function isAre(n) { return n + (n === 1 ? " is" : " are"); }
      function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
      function andList(list) { return list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : (list[0] || ""); }
      var accepted = exceed.filter(function (x) { return x.disposition === "accepted"; });
      var undecided = exceed.filter(function (x) { return !x.decided && !x.incomplete; });
      var incomplete = exceed.filter(function (x) { return x.incomplete; });

      // ---- the residual position leads (phase 4): where today's
      // countermeasures and the planned ones take the threats above
      // tolerable risk, the decisions that stand, and the top risks today.
      // Today is the engine's one rule (threatTreatment), read through the
      // view model, as the scorecard, the register and the workbook read it ----
      children.push(h2("Risk position"));
      var inTop = [];
      if (exceed.length) {
        var c = S.dispositionCounts;
        var cmEx = S.counts.countermeasuresExisting, cmPl = S.counts.countermeasuresPlanned;
        // Once the plan is done counts only the threats a planned
        // countermeasure is linked to: with nothing planned, nothing changes.
        var withinToday = S.counts.withinToday, withinPlanned = S.counts.withinAfterPlan;
        children.push(body("Of the " + nOf(exceed.length, "threat", "threats") + " above tolerable risk before any countermeasure, " + (withinToday ? isAre(withinToday) : "none is") + " within it with today's countermeasures" +
          (withinPlanned > withinToday ? " and " + withinPlanned + " will be once the planned countermeasures are complete" : "") + "."));
        // Only decisions that stand are counted: dispositionCounts leaves out
        // an unconfirmed decision and one recorded without what it rests on.
        // A count of none is left out.
        var bits = [], nDec = c.mitigated + c.countermeasure + c["sl-t"] + c.accepted;
        if (c.mitigated) bits.push(c.mitigated + " reduced to within tolerable risk");
        if (c.countermeasure) bits.push(c.countermeasure + " being reduced with countermeasures");
        if (c["sl-t"]) bits.push(c["sl-t"] + " treated through the SL-T programme");
        if (c.accepted) bits.push(c.accepted + " accepted by the asset owner");
        var cmBits = [];
        if (cmEx) cmBits.push(String(cmEx) + " existing");
        if (cmPl) cmBits.push(String(cmPl) + " planned");
        var tally = (bits.length ? (nDec === 1 ? "The treatment decision is: " : "The treatment decisions are: ") + andList(bits) + "." : "") +
          (cmBits.length ? (bits.length ? " " : "") + "The register holds " + andList(cmBits) + " countermeasure" + (cmEx + cmPl === 1 ? "" : "s") + "." : "");
        if (tally) children.push(body(tally));
        // The rating that stands is carried into a column not rated, so no
        // cell of this short table is blank.
        var top = S.threats.filter(function (x) { return x.todayExceeds; })
          .map(function (x, i) { return { x: x, i: i }; })
          .sort(function (a, b7) { return ((S.bandRank[b7.x.today] || 0) - (S.bandRank[a.x.today] || 0)) || (a.i - b7.i); })
          .slice(0, 5).map(function (e) { return e.x; });
        inTop = top;
        if (top.length) {
          children.push(body(top.length === 1 ? "The threat above tolerable risk today:" : "The threats above tolerable risk today:"));
          var kw = [2706, 1200, 1200, 1200, 1200, 2000];
          children.push(fixedTable([headerRow(["Threat", "Zone or conduit", "Unmitigated", "Current", "Planned", "Treatment decision"], kw)].concat(top.map(function (x) {
            return new docx.TableRow({ children: [
              textCell(x.t.id + "  " + (x.t.statement || "No statement"), kw[0]),
              textCell(x.owner.id, kw[1]),
              ratingCell(x.risk, null, kw[2], false),
              ratingCell(x.current || x.risk, null, kw[3], false),
              ratingCell(x.planned || x.current || x.risk, null, kw[4], false),
              textCell(x.label, kw[5], x.decided ? {} : { bold: true })
            ] });
          })), kw));
        }
      } else if (S.threats.length) {
        children.push(body("No registered threat exceeds the tolerable risk of " + tolName + ", so no treatment decision is needed."));
      } else {
        children.push(body("No threats are registered yet."));
      }

      // ---- what is waiting on a decision: open treatment decisions (red,
      // the consultant's to complete), accepted risks the asset owner has not
      // approved, and planned countermeasures with no owner or due date ----
      children.push(h2("Decisions required"));
      var planned = plannedCountermeasures(S);
      var unplanned = planned.filter(function (e) { return !String(e.m.owner || "").trim() || !String(e.m.dueDate || "").trim(); });
      var acceptApproved = rt.approvalStates(p).some(function (s) { return s.signed && rt.approvalChangedFor(s, "detailed").indexOf("accepted") < 0; });
      var awaiting = acceptApproved ? [] : accepted;
      if (undecided.length) {
        children.push(body(undecided.length + " threat" + (undecided.length > 1 ? "s" : "") + " above tolerable risk " + (undecided.length > 1 ? "have" : "has") + " no treatment decision recorded: " + undecided.map(function (x) { return x.t.id + " (" + x.owner.id + ")"; }).join(", ") + ".", { bold: true, color: COLOR.note }));
      }
      if (incomplete.length) {
        children.push(body(nOf(incomplete.length, "treatment decision is", "treatment decisions are") + " incomplete: " + incomplete.map(function (x) { return x.t.id + " (" + x.owner.id + "), " + lower(x.label); }).join("; ") + ".", { bold: true, color: COLOR.note }));
      }
      if (awaiting.length) {
        children.push(body("The asset owner has not yet approved the accepted risk" + (awaiting.length > 1 ? "s " : " ") + andList(awaiting.map(function (x) { return x.t.id + " (" + x.owner.id + ")"; })) + "."));
      }
      if (unplanned.length) {
        children.push(body(nOf(unplanned.length, "planned countermeasure has", "planned countermeasures have") + " no owner or due date agreed: " + andList(unplanned.map(function (e) { return e.m.id + " (" + e.owner.id + ")"; })) + "."));
      }
      // A planned countermeasure only proposed is still the asset owner's to agree.
      var proposed = planned.filter(function (e) { return e.m.status === "proposed"; });
      if (proposed.length) {
        children.push(body(nOf(proposed.length, "planned countermeasure is", "planned countermeasures are") + " proposed and not yet agreed: " + andList(proposed.map(function (e) { return e.m.id + " (" + e.owner.id + ")"; })) + "."));
      }
      if (!undecided.length && !incomplete.length && !awaiting.length && !unplanned.length && !proposed.length) {
        var settled = [];
        if (exceed.length) settled.push("every threat above tolerable risk has a treatment decision");
        if (accepted.length) settled.push(accepted.length === 1 ? "the accepted risk is approved" : "the accepted risks are approved");
        if (planned.length) settled.push("each planned countermeasure has an owner and a due date");
        children.push(body(settled.length ? "Nothing is waiting on a decision: " + andList(settled) + "." : "Nothing is waiting on a decision."));
      }

      children.push(h2("Why this assessment"));
      children.push(body("A cyber incident on a plant can stop production, damage equipment and put people at risk. Regulators and insurers increasingly expect an asset owner to show where that risk sits and that the protection in place is proportionate to it. " + notSet(eng.client) + " commissioned this assessment of " + (p.suc.name || "the system under consideration") + (eng.assessmentDate ? " (" + eng.assessmentDate + ")" : "") + " to establish that."));
      children = children.concat(stakesKids());
      children.push(h2("What this report is"));
      // The method used: each zone and conduit is compared with tolerable
      // risk first (the risk comparison), and only those recorded as needing
      // a detailed assessment have their threats rated.
      function ratedSentence() {
        var skip = p.zones.concat(p.conduits).filter(function (o) { return rt.comparison(o, p).required === false; }).map(function (o) { return o.id; });
        // What a decision is needed for is the residual position's to say, so it is not said here too.
        if (!skip.length) return "Threats to each zone and conduit were rated for likelihood and impact and compared with the tolerable risk of " + tolName + ".";
        var list = skip.length > 1 ? skip.slice(0, -1).join(", ") + " and " + skip[skip.length - 1] : skip[0];
        return "The initial risk of each zone and conduit was compared with the tolerable risk of " + tolName + ". " + list + (skip.length === 1 ? " was" : " were") + " found not to need a detailed assessment, and " + (skip.length === 1 ? "its" : "their") + " SL-T rests on the written justification. Threats to the others were rated for likelihood and impact.";
      }
      children.push(body("The assessment follows IEC 62443-3-2. " + (ranked.length ? nOf(ranked.length, "system was", "systems were") + " first ranked for relative risk, and the system under consideration was" : "The system under consideration was") + " divided into " + nOf(p.zones.length, "security zone", "security zones") + " (each a group of assets with the same security requirements) and " + nOf(p.conduits.length, "conduit", "conduits") + " (the communication paths between them). " + ratedSentence() + " Each zone and conduit then has a target security level (SL-T), the protection it must be engineered and maintained to."));
      var bSent = basisSentence();
      if (bSent) children.push(body(bSent));
      children.push(h2("What we found"));
      // Where the risk sits.
      var hottest = null, hotCount = 0;
      S.owners.forEach(function (row) {
        var n2 = row.exceeding.length;
        if (n2 > hotCount) { hotCount = n2; hottest = row; }
      });
      // How many are above tolerable risk is the position's opening sentence,
      // so it is not said again here.
      var findRuns = [
        run(nOf(S.threats.length, "threat was", "threats were") + " registered.")
      ];
      if (hottest && hotCount > 1) {
        findRuns.push(run(" The most affected is " + hottest.o.id + (hottest.o.name ? " " + hottest.o.name : "") + flagsPhrase(hottest.o) + ", with " + hotCount + "."));
      }
      if (S.worst) {
        findRuns.push(run(" The highest unmitigated risk is "));
        findRuns.push(run(bandStyle(S.worst.risk).name, { bold: true, color: bandStyle(S.worst.risk).text }));
        findRuns.push(run(": " + noStop(S.worst.t.statement) + " (" + S.worst.owner.id + (S.worst.owner.name ? " " + S.worst.owner.name : "") + ")."));
      }
      children.push(asBody(para(findRuns), findRuns.map(function (r) { return r.__text; }).join("")));
      // The treatment position is the section above; an accepted risk not
      // already in its table of the threats above tolerable risk today is
      // named here, with its detail in a section of its own.
      var accNamed = accepted.filter(function (x) { return inTop.indexOf(x) < 0; });
      if (accNamed.length) {
        children.push(body((accNamed.length > 1 ? "Accepted risks: " : "Accepted risk ") + accNamed.map(function (x) { return x.t.id + " (" + x.owner.id + "): " + noStop(x.t.statement); }).join("; ") + ". The reason, who accepted " + (accNamed.length > 1 ? "each" : "it") + " and when " + (accNamed.length > 1 ? "each is" : "it is") + " to be reviewed are under Accepted risks."));
      }
      // The outcome: the SL-T vector and what happens next.
      children.push(h2("What happens next"));
      var sltBits = FRS().map(function (f) { return f.id + (S.sltMax[f.id] == null ? " not set" : " SL" + S.sltMax[f.id]); }).join(", ");
      var overallMax = FRS().map(function (f) { return S.sltMax[f.id]; }).reduce(function (m, v) { return v != null && (m === null || v > m) ? v : m; }, null);
      // The same level on every requirement is said once.
      var sameAll = overallMax != null && FRS().every(function (f) { return S.sltMax[f.id] === overallMax; });
      var drivers = [];
      if (overallMax != null) {
        S.owners.forEach(function (row) {
          var hit = FRS().some(function (f) { return row.o.slTargetByFR[f.id] === overallMax; });
          if (hit) drivers.push(row.o.id + (row.o.name ? " " + row.o.name : ""));
        });
      }
      children.push(body((sameAll ? "The highest target security level across the system is SL" + overallMax + " on every foundational requirement." : "The highest target security levels across the system are " + sltBits + ".") + (overallMax != null && drivers.length ? " The SL" + overallMax + " ceiling is set by " + (drivers.length > 3 ? drivers.slice(0, 3).join(", ") + " and " + (drivers.length - 3) + " more" : drivers.join(", ")) + "." : "") + " An IEC 62443-3-3 assessment against these targets will measure what the system can withstand today, and the gaps it finds become the security improvement programme."));
      children.push(body("Repeat this assessment after a significant change to the system or its connectivity, after a security incident, and otherwise at regular intervals."));
    }
    if (rt.approvalStates(p).some(function (s) { return s.signed; })) {
      children.push(pinned(body(signOffTexts(p)[0], { italics: true })));
    } else {
      children.push(pinned(body(signOffTexts(p)[0], { color: COLOR.gap, bold: true })));
    }
    // In the wording that opens its section, so deleting that line in the box
    // deletes the note; left in, it stays red (see the section pass below).
    var CONSULTANT_NOTE = "Consultant note: tailor this summary before issue. Add the business context and engagement drivers, confirm the wording of any risk acceptances with the asset owner, and set out the agreed next steps. Delete this note.";
    function consultantNote() { return body(CONSULTANT_NOTE, { color: COLOR.note, italics: true }); }
    children.push(consultantNote());
    children.push(pageBreak());

    // ---- the scorecard page ----
    children = children.concat(scorecardPage());
    children.push(pageBreak());

    // ---- the SUC and its requirements: the cyber security requirements
    // specification, its parts in the order data/zcr-map.json gives them
    // (SUC description, drawings, zone and conduit characteristics,
    // assumptions, threat environment, policies, tolerable risk, regulatory
    // requirements). The high-level report has no zones, so no drawing and
    // no characteristics. A heading reworded here needs its old key in
    // SECTION_KEY_ALIASES (js/model.js). ----
    children.push(heading("System under consideration and requirements", docx.HeadingLevel.HEADING_1, { before: 0 }));
    if (p.suc.description) children.push(body(p.suc.description));
    if (p.suc.scopeStatement) children.push(para([run("Scope: ", { bold: true }), run(p.suc.scopeStatement)]));
    if (p.srs.essentialFunctions) children.push(para([run("Essential functions: ", { bold: true }), run(p.srs.essentialFunctions)]));
    if (p.srs.worstCase) children.push(para([run("Worst-case consequence: ", { bold: true }), run(p.srs.worstCase)]));
    function listSection(title, items, lead) {
      if ((!items || !items.length) && !lead) return;
      children.push(h2(title));
      if (lead) children.push(lead);
      children = children.concat(bulletList(items || []));
    }
    // Part of the SUC description, as on step 6.
    listSection("Security functions that must be kept", p.srs.mandatorySecurityFunctions);
    // A zone's own assumptions and policies are in its characteristics table.
    if (!opts.highLevelOnly && p.zones.length) {
      // The same drawing as the Zones and conduits page, as a picture.
      var map = window.RiskZoneMap ? window.RiskZoneMap.layout(p, rt.suggestZone) : null;
      var png = map ? window.RiskZoneMap.toPng(map, 3) : null;
      if (png) {
        children.push(h2("Zone and conduit drawings"));
        var mapW = Math.min(600, png.width), mapH = Math.round(png.height * mapW / png.width);
        children.push(new docx.Paragraph({ alignment: docx.AlignmentType ? docx.AlignmentType.CENTER : "center", spacing: { before: 120, after: 200 }, keepNext: true,
          children: [new docx.ImageRun({ data: png.bytes, transformation: { width: mapW, height: mapH }, altText: { title: "Zones and conduits", description: "Zone and conduit drawing", name: "zone-map" } })] }));
      }
      children.push(h2("Zone and conduit characteristics"));
      children.push(body("These are the zones and conduits as defined for this assessment. Where a zone holds assets that are normally kept apart and they are not separated, the reason follows its table."));
      S.owners.forEach(function (row) { children = children.concat(characteristics(row)); });
    }
    // The same key as "Operating-environment assumptions": a slug reads a
    // hyphen and a space alike.
    listSection("Operating environment assumptions", p.suc.assumptions);
    // The threat environment: the assumed adversary, then the known threats.
    listSection("Known or presumed threats", p.srs.knownThreats, p.srs.adversaryClass ? para([run("Assumed adversary: ", { bold: true }), run("SL" + p.srs.adversaryClass + "-grade")]) : null);
    listSection("Organisational security policies", Array.isArray(p.suc.policies) ? p.suc.policies : []);
    children.push(h2("Tolerable risk"));
    children.push(para([run("Tolerable risk: ", { bold: true }), run(bandStyle(S.tolerable).name, { bold: true, color: bandStyle(S.tolerable).text })]));
    children.push(rt.tolerableConfirmed(p)
      ? body("Confirmed with the asset owner. The risk matrix, its scales and the tolerable line are in the appendix, Risk criteria.")
      : pinned(body("The tolerable risk has not yet been confirmed with the asset owner. The risk matrix, its scales and the tolerable line are in the appendix, Risk criteria.", { bold: true, color: COLOR.note })));
    listSection("Regulatory requirements", p.srs.regulatory);

    // ---- basis of assessment ----
    var b = p.basisOfAssessment;
    if (b.interviews.length || b.documents.length || b.observations.length) {
      children.push(h1("Basis of assessment"));
      if (b.interviews.length) {
        children.push(h2("People interviewed"));
        var iw = [2600, 3600, 1400, 1400];
        children.push(fixedTable([headerRow(["Name", "Role", "Date", "Notes"], iw)].concat(b.interviews.map(function (i) {
          return new docx.TableRow({ children: [textCell(i.name, iw[0]), textCell(i.role, iw[1]), textCell(i.date, iw[2]), textCell(i.notes || "", iw[3])] });
        })), iw));
      }
      if (b.documents.length) {
        children.push(h2("Documents reviewed"));
        var dw = [3400, 1800, 1600, 2200];
        children.push(fixedTable([headerRow(["Title", "Reference", "Source", "Relevance"], dw)].concat(b.documents.map(function (d) {
          return new docx.TableRow({ children: [textCell(d.title, dw[0]), textCell(d.reference || "", dw[1]), textCell(d.source || "", dw[2]), textCell(d.relevance || "", dw[3])] });
        })), dw));
      }
      if (b.observations.length) {
        children.push(h2("Systems and evidence observed"));
        var ow = [3800, 1800, 1200, 2200];
        children.push(fixedTable([headerRow(["What was observed", "Location", "Date", "Notes"], ow)].concat(b.observations.map(function (o) {
          return new docx.TableRow({ children: [textCell(o.description, ow[0]), textCell(o.location || "", ow[1]), textCell(o.date || "", ow[2]), textCell(o.notes || "", ow[3])] });
        })), ow));
      }
    }

    // ---- the high-level risk ranking ----
    // A heading reworded here needs its old key in the tool's section alias
    // map (js/model.js, SECTION_KEY_ALIASES), or stored edits lose their place.
    if (ranked.length) {
      children.push(h1("High-level risk ranking"));
      var inZones = zonesBySystem(p);
      var anyAssigned = ranked.some(function (a) { return !!inZones[a.id]; });
      children.push(body("Systems are ranked by consequence and likelihood on the SolutionsPT house risk matrix" + (p.srs.clientMatrix ? " (client matrix noted: " + (p.srs.clientMatrixNote || "in use") + ")" : "") + "." + (anyAssigned ? " An arrow marks the zones a system is assigned to." : "")));
      // On a high-level-only assessment the comparison with tolerable risk is
      // recorded per system, so the table carries the decision.
      var hlDecide = rt.assessmentType(p) === "high-level";
      var rw = hlDecide ? [2100, 1900, 1150, 1150, 1000, 1350, 1856] : [2500, 2400, 1300, 1300, 1200, 2006];
      var rows = [headerRow(["System", "Function / location", "Consequence", "Likelihood", "Risk"].concat(hlDecide ? ["Detailed assessment", "Note"] : ["Note"]), rw)];
      ranked.slice().sort(function (a, b2) {
        return (S.bandRank[rt.riskFor(b2.consequence, b2.likelihood)] || 0) - (S.bandRank[rt.riskFor(a.consequence, a.likelihood)] || 0);
      }).forEach(function (a) {
        var band = rt.riskFor(a.consequence, a.likelihood);
        var zs = inZones[a.id] || [];
        var cells = [
          textCell(a.name + (zs.length ? "  → " + zs.join(", ") : ""), rw[0], { bold: zs.length > 0 }),
          textCell(a.functionLocation || "", rw[1]),
          textCell(sevName(a.consequence) || "Not rated", rw[2], a.consequence ? {} : { color: COLOR.muted }),
          textCell(likName(a.likelihood) || "Not rated", rw[3], a.likelihood ? {} : { color: COLOR.muted }),
          bandCell(band, rw[4])
        ];
        if (hlDecide) {
          var dc = rt.hlaComparison(a, p);
          cells.push(decisionCell(dc, rw[5]));
        }
        cells.push(textCell(a.note || "", rw[rw.length - 1]));
        rows.push(new docx.TableRow({ children: cells }));
      });
      children.push(fixedTable(rows, rw));
    }

    // ---- the risk comparison: each zone's and conduit's initial risk
    // against tolerable risk, and the decision on a detailed assessment ----
    if (!opts.highLevelOnly && (p.zones.length || p.conduits.length)) {
      children.push(h1("Risk comparison"));
      children.push(body("The initial risk of each zone and conduit was compared with the tolerable risk of " + tolName + " to decide where a detailed risk assessment is needed. Comparing each zone and conduit is the method used in this assessment. A zone's initial risk is the worst of the ranked systems assigned to it, or the rating entered for it. A conduit takes the higher initial risk of the zones it joins, unless a rating is entered for it."));
      var cw = [2500, 1200, 1700, 1500, 2506];
      var crows = [headerRow(["Zone or conduit", "Initial risk", "Against tolerable risk", "Detailed assessment", "Reason"], cw)];
      S.owners.forEach(function (row) {
        var o = row.o, c = rt.comparison(o, p);
        crows.push(new docx.TableRow({ children: [
          textCell(o.id + (o.name ? " " + o.name : ""), cw[0], { bold: true }),
          c.initial ? bandCell(c.initial, cw[1]) : textCell("Not rated", cw[1], { color: COLOR.muted }),
          textCell(c.suggested === null ? "Nothing to compare" : (c.suggested ? "Above" : "Within"), cw[2]),
          decisionCell(c, cw[3]),
          textCell(c.reason || "", cw[4])
        ] }));
      });
      children.push(fixedTable(crows, cw));
    }

    if (!opts.highLevelOnly) {
      // ---- the risk register (phase 4): every scenario with its three
      // ratings and its treatment decision, on a landscape page, with the
      // treatment plan and the accepted risks after it ----
      children.push(h1("Risk register"));
      children.push(body("Each threat scenario is rated before any countermeasure (unmitigated), with the countermeasures in place today (current) and after the planned ones (planned). Under each risk is its likelihood × impact. A blank current or planned rating means the rating before it stands. The tolerable risk is " + tolName + "."));
      if (!S.threats.length) {
        children.push(body("No threats registered.", { color: COLOR.muted, italics: true }));
      } else {
        var rgw = [2000, 4638, 1700, 1700, 1700, 2700];
        children.push(fixedTable([headerRow(["Zone or conduit", "Threat scenario", "Unmitigated", "Current", "Planned", "Treatment decision"], rgw)].concat(S.threats.map(function (x) {
          return new docx.TableRow({ children: [
            textCell(x.owner.id + (x.owner.name ? " " + x.owner.name : ""), rgw[0]),
            textCell(x.t.id + "  " + (x.t.statement || "No statement"), rgw[1]),
            ratingCell(x.risk, stateLI(x.t, "unmitigated"), rgw[2], false),
            ratingCell(x.current, stateLI(x.t, "current"), rgw[3], true),
            ratingCell(x.planned, stateLI(x.t, "planned"), rgw[4], true),
            // No decision, or an incomplete one, prints in the red of a prompt left to complete.
            textCell(x.label, rgw[5], x.exceeds && !x.decided ? { bold: true, color: COLOR.note } : {})
          ] });
        })), rgw));
      }

      // ---- the treatment plan: the additional countermeasures ----
      children.push(h1("Treatment plan"));
      var plan = plannedCountermeasures(S);
      if (!plan.length) {
        children.push(body("No additional countermeasure is planned."));
      } else {
        children.push(body("Each additional countermeasure has an owner, a priority, a due date and a status. Countermeasures already in place are listed under each zone and conduit."));
        var pw = [4538, 1700, 1300, 1700, 1100, 1300, 1300, 1500];
        children.push(fixedTable([headerRow(["Countermeasure", "Zone or conduit", "Threat scenarios", "Owner", "Priority", "Due date", "Status", "SR references"], pw)].concat(plan.map(function (e) {
          var m = e.m;
          return new docx.TableRow({ children: [
            textCell(m.id + "  " + m.description, pw[0]),
            textCell(e.owner.id + (e.owner.name ? " " + e.owner.name : ""), pw[1]),
            e.threats.length ? textCell(e.threats.join(", "), pw[2]) : textCell("None linked", pw[2], { color: COLOR.muted }),
            String(m.owner || "").trim() ? textCell(m.owner, pw[3]) : textCell("Not assigned", pw[3], { color: COLOR.muted }),
            cmPriority(m) ? textCell(cmPriority(m), pw[4]) : textCell("Not set", pw[4], { color: COLOR.muted }),
            String(m.dueDate || "").trim() ? textCell(m.dueDate, pw[5]) : textCell("Not set", pw[5], { color: COLOR.muted }),
            cmStatus(m) ? textCell(cmStatus(m), pw[6]) : textCell("Not set", pw[6], { color: COLOR.muted }),
            textCell((m.srRefs || []).join(", "), pw[7])
          ] });
        })), pw));
      }

      // ---- accepted risks, with who accepted each and when to review it ----
      children.push(h1("Accepted risks"));
      var acc = S.threats.filter(function (x) { return x.disposition === "accepted"; });
      if (!acc.length) {
        children.push(body("No risk has been accepted."));
      } else {
        children.push(body("Each risk above tolerable risk that has been accepted, with the rating that stands, the reason, who accepted it and when it is to be reviewed."));
        var aw = [3000, 1300, 1150, 3488, 1400, 1500, 1300, 1300];
        children.push(fixedTable([headerRow(["Threat scenario", "Zone or conduit", "Rating", "Reason", "Accepted by", "Role", "Date", "Review date"], aw)].concat(acc.map(function (x) {
          var ad = x.t.acceptanceDetail || {};
          function said(v, wd) { return String(v || "").trim() ? textCell(v, wd) : textCell("Not recorded", wd, { color: COLOR.muted }); }
          return new docx.TableRow({ children: [
            textCell(x.t.id + "  " + (x.t.statement || "No statement"), aw[0]),
            textCell(x.owner.id + (x.owner.name ? " " + x.owner.name : ""), aw[1]),
            ratingCell(x.operative, stateLI(x.t, x.planned ? "planned" : x.current ? "current" : "unmitigated"), aw[2], false),
            textCell(x.treatment.reason, aw[3]),
            said(ad.by, aw[4]), said(ad.role, aw[5]), said(ad.date, aw[6]), said(ad.reviewDate, aw[7])
          ] });
        })), aw));
      }

      // ---- zones & conduits: each threat's scenario in detail ----
      children.push(h1("Zones, conduits and the detailed risk assessment"));
      children.push(body("Each threat is rated for likelihood and impact on the SolutionsPT house risk matrix and compared with the tolerable risk of " + tolName + ". The ratings and treatment decisions are in the risk register. The drawing and each zone's and conduit's characteristics are under System under consideration and requirements."));
      S.owners.forEach(function (row) {
        var o = row.o;
        // A zone's own heading is its name, not a section title: it closes the
        // section before it and is renamed where the zone is entered.
        var ownerHead = h2(o.id + ": " + (o.name || "(unnamed " + row.kind.toLowerCase() + ")") + (row.kind === "Conduit" ? "  (" + (o.fromZone || "not set") + " → " + (!o.toZone ? "not set" : o.toZone !== "EXT" ? o.toZone : "external") + ")" : ""));
        ownerHead.__boundaryOnly = true;
        children.push(ownerHead);
        var vulns = (o.vulnerabilities || []).filter(function (v) { return String(v.description || "").trim(); });
        if (vulns.length) {
          children.push(body("Vulnerabilities: " + vulns.map(function (v) { return v.id + " " + noStop(v.description) + (String(v.reference || "").trim() ? " (source: " + noStop(v.reference) + ")" : ""); }).join(" · "), { color: COLOR.muted }));
        }
        var oThreats = row.threats;
        if (!oThreats.length) {
          children.push(body("No threats registered.", { color: COLOR.muted, italics: true }));
        } else {
          oThreats.forEach(function (x) {
            var t = x.t, T = x.treatment;
            children.push(para([run(t.id + "  " + (t.statement || "No statement"), { bold: true })], { spacing: { before: 160, after: 60 } }));
            var vIds = (t.vulnerabilityIds || []).filter(function (id) { return vulns.some(function (v) { return v.id === id; }); });
            var cms = T.existingLinked.map(function (m) { return m.id + " in place"; }).concat(T.plannedLinked.map(function (m) { return m.id + " planned"; }));
            // Only what was captured: an empty field is not printed.
            var rows = [
              ["Source", t.source], ["Entry point", t.entryPoint],
              ["Assets", assetNames(o, t, p).join("; ")], ["Vulnerabilities", vIds.join(", ")],
              ["Consequence", t.consequence], ["Affected FRs", (t.affectedFR || []).join(", ")],
              ["Likelihood rationale", t.likelihoodRationale], ["Countermeasures", cms.join(", ")]
            ].filter(function (kv) { return kv[1] && String(kv[1]).trim(); });
            if (rows.length) children.push(kvTable(rows));
            if (x.disposition === "sl-t" && x.treatment.reason) {
              children.push(body(t.id + " is treated through the SL-T programme. " + x.treatment.reason, { italics: true }));
            }
          });
        }
        // The countermeasures in place; the planned ones are in the treatment
        // plan, so they are pointed to, not listed again.
        var inPlaceCms = (o.countermeasures || []).filter(function (m) { return m.existing && String(m.description || "").trim(); });
        var plannedCms = (o.countermeasures || []).filter(function (m) { return !m.existing && String(m.description || "").trim(); });
        if (inPlaceCms.length || plannedCms.length) {
          children.push(body("Countermeasures: " + (inPlaceCms.length ? inPlaceCms.map(function (m) { return m.id + " " + noStop(m.description) + " (in place)"; }).join(" · ") : "none in place") +
            (plannedCms.length ? "; planned: see the treatment plan." : "."), { color: COLOR.muted }));
        }
      });

      // ---- SL-T ----
      children.push(h1("Target security levels (SL-T, per foundational requirement)"));
      children.push(body("Each zone and conduit has one target per foundational requirement, set by the consultant from the risk assessment."));
      var frs = FRS();
      var mw = [2200].concat(frs.map(function () { return 940; }));
      var mrows = [headerRow(["Zone / conduit"].concat(frs.map(function (f) { return f.id; })), mw)];
      var anySafety = false;
      S.owners.forEach(function (row) {
        var o = row.o, safety = row.isZone && rt.zoneSafety(o);
        if (safety) anySafety = true;
        var nameKids = [para([run(o.id + " " + (o.name || ""), { bold: true })], { spacing: { after: 0 } })];
        if (safety) nameKids.push(para([run("Safety related", { color: COLOR.gap, size: 16, bold: true })], { spacing: { after: 0 } }));
        mrows.push(new docx.TableRow({ children: [cellDxa(nameKids, mw[0])].concat(frs.map(function (f, i) {
          var v = o.slTargetByFR[f.id];
          return textCell(v == null ? "Not set" : "SL" + v, mw[i + 1], v != null ? { bold: true } : { color: COLOR.muted });
        })) }));
      });
      children.push(fixedTable(mrows, mw));
      if (anySafety) {
        var sis = (RULES().specialRules || []).filter(function (r) { return r.id === "sis-present"; })[0];
        children.push(pinned(body("A zone marked safety related holds safety functions. The house method sets a floor of SL" + ((sis && sis.floorSL) || 3) + " on every foundational requirement for it.", { color: COLOR.muted })));
      }
      // What drives each target: per zone and conduit, the threats with the
      // worst unmitigated risk on each requirement (the engine's sltDrivers),
      // the requirements that share the same drivers grouped on one row.
      // Where a suggestion is above what those threats map to, it says where
      // it comes from: the safety floor, or the zone a conduit inherits it from.
      children.push(h2("Driving scenarios"));
      children.push(body("For each zone and conduit, the threats with the worst unmitigated risk on each foundational requirement. On the house mapping these set the suggested SL-T; the justifications follow."));
      var dw = [2800, 2200, 4506];
      var drows = [headerRow(["Zone or conduit", "Foundational requirements", "Driving scenarios"], dw)];
      S.owners.forEach(function (row) {
        var o = row.o, groups = [], bySig = {};
        var skip = rt.comparison(o, p).skip;
        rt.sltDrivers(o, p).forEach(function (d) {
          // A zone or conduit not assessed in detail has no driving scenario.
          if (skip) return;
          var bits = d.drivers.map(function (id) { return id + " (" + bandStyle(d.band).name + ")"; });
          var why = d.raisedBy === "floor" ? "SL" + d.sl + " from the safety floor"
            : d.raisedBy === "inherited" ? "SL" + d.sl + " inherited from " + (d.from.length > 1 ? d.from.slice(0, -1).join(", ") + " and " + d.from[d.from.length - 1] : d.from[0]) : "";
          var text = bits.length ? bits.join(", ") + (why ? "; " + why : "") : cap(why);
          if (!bySig[text]) { bySig[text] = { frs: [], text: text }; groups.push(bySig[text]); }
          bySig[text].frs.push(d.fr);
        });
        var label = o.id + (o.name ? " " + o.name : "");
        if (!groups.length) {
          drows.push(new docx.TableRow({ children: [textCell(label, dw[0], { bold: true }), textCell("None", dw[1], { color: COLOR.muted }),
            textCell(skip ? "Not assessed in detail. The SL-T rests on the justification." : "No rated threat. The SL-T rests on the justification.", dw[2], { color: COLOR.muted })] }));
          return;
        }
        groups.forEach(function (g, i) {
          drows.push(new docx.TableRow({ children: [textCell(i ? "" : label, dw[0], { bold: true }), textCell(g.frs.join(", "), dw[1]), textCell(g.text, dw[2])] }));
        });
      });
      children.push(fixedTable(drows, dw));
      S.owners.forEach(function (row) {
        var o = row.o;
        if ((o.justification || "").trim()) {
          // One section across the zones, each with its own wording: the title
          // and Hide apply to all of them, and a rewrite to none.
          var whose = o.id + (o.name ? " " + o.name : "");
          var justHead = h2("Justification for " + whose);
          justHead.__targetName = whose; justHead.__noProse = true;
          children.push(justHead);
          children.push(body(o.justification));
        }
      });
    }

    // ---- sign-off + limitations ----
    // The approvers (step 7), as a signature table. Everything here is left
    // out of a review's content hash (js/review.js), so recording an approval
    // never reads as a change to what was reviewed.
    children.push(h1("Sign-off"));
    var approvals = rt.approvalStates(p), texts = signOffTexts(p), anySigned = approvals.some(function (s) { return s.signed; });
    var docId = opts.highLevelOnly ? "highLevel" : "detailed";
    if (!anySigned) children.push(pinned(body(texts[1], { bold: true, color: COLOR.gap })));
    if (approvals.length) {
      // "Signed off as below" only once someone has; before that the table
      // names who it is for.
      children.push(pinned(body(texts[(anySigned ? 2 : 4) + (opts.highLevelOnly ? 1 : 0)])));
      var sw = [1900, 1500, 1500, 2300, 1100, 1206];
      children.push(fixedTable([headerRow(SIGNATURE_HEAD, sw)].concat(approvals.map(function (s) {
        var e = s.entry;
        return new docx.TableRow({ children: [
          textCell(e.name || "Name not recorded", sw[0], { bold: true }), textCell(e.role || "", sw[1]), textCell(e.organisation || "", sw[2]),
          textCell(e.scope || "", sw[3]),
          textCell(e.approved ? (e.date || "Date not recorded") : "Not yet signed", sw[4], e.approved ? {} : { color: COLOR.gap, bold: true }),
          textCell(e.revision || "", sw[5])
        ] });
      })), sw));
      approvals.forEach(function (s) { var note = changedText(s, docId); if (note) children.push(pinned(body(note, { color: COLOR.note, italics: true }))); });
    }
    children.push(h1("Method and limitations"));
    children.push(body("The assessment follows " + rt.zcrMap.standard.id + ". The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house defaults. The standard prescribes no matrix, so a client corporate matrix takes precedence where one exists." + (opts.highLevelOnly ? "" : " Each SL-T is the consultant's judgement, informed by the house mapping.")));
    children.push(body(opts.highLevelOnly
      ? "Consequence and likelihood ratings reflect the evidence available at the time of the engagement. The assessment does not test security capability."
      : "Likelihood and impact ratings reflect the evidence available at the time of the engagement. The assessment sets targets and does not test security capability, which is measured against the SL-T in an IEC 62443-3-3 assessment."));

    // ---- appendix: the risk criteria every rating above rests on ----
    children = children.concat(criteriaAppendix());

    // ---- the consultant's section overrides ----
    // The tree before them says what the generated wording is, and the tree after
    // them what prints. keepHidden is for the Report page, which dims a hidden
    // section so it can be put back; every real export leaves it out.
    if (opts.generatedProbe) RS.probeSections(children, keyOf, opts.generatedProbe);
    children = RS.applyOverrides(children, custom, {
      keyOf: keyOf,
      heading: function (n, title) {
        // A repeat keeps its own zone's name after the words the consultant chose.
        var made = n.__make(n.__targetName ? title + " " + n.__targetName : title);
        made.__targetName = n.__targetName; made.__noProse = n.__noProse;
        return made;
      },
      body: function (line) { return line === CONSULTANT_NOTE ? consultantNote() : body(line); },
      keepHidden: !!opts.keepHidden
    });
    if (opts.sectionProbe) RS.probeSections(children, keyOf, opts.sectionProbe);

    // The body in Word sections: portrait, with the risk register, the
    // treatment plan and the accepted risks on landscape pages of their own.
    // Read after the overrides, by the key of each level 1 heading (a renamed
    // one keeps its key), so a renamed or hidden section still lands right.
    // Each new section starts a page, so no page break is needed around them.
    // docx-js swaps the page's width and height itself for landscape, so the
    // portrait size is given either way.
    var PO = (docx.PageOrientation) || { PORTRAIT: "portrait" };
    var A4_W = 11906, A4_H = 16838;
    function pageProps(isLand) { return { page: { size: { width: A4_W, height: A4_H, orientation: isLand ? (PO.LANDSCAPE || "landscape") : PO.PORTRAIT }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } }; }
    var segs = [], seg = null, isLand = false;
    children.forEach(function (n) {
      if (n && n.__headingLevel === 1 && !n.__boundaryOnly) isLand = !!LAND_KEYS[n.__sectionKey || keyOf(n)];
      if (!seg || seg.land !== isLand) { seg = { land: isLand, children: [] }; segs.push(seg); }
      seg.children.push(n);
    });
    var bodySections = segs.map(function (s) { return { properties: pageProps(s.land), children: s.children }; });
    if (!bodySections.length) bodySections = [{ properties: pageProps(false), children: [] }];
    // The Report page rebuilds after every edit and reads only the body, so it
    // leaves out the cover art and the logo header, the slow part to pack.
    if (opts.preview) return new docx.Document({ sections: bodySections });
    var hdrs = brandHeaders(), ftrs = brandFootersDoc();
    bodySections.forEach(function (s) { s.headers = hdrs; s.footers = ftrs; });
    return new docx.Document({
      creator: eng.consultant || "OT Cyber Risk Assessment Tool",
      title: (opts.highLevelOnly ? "High-Level OT Cyber Risk Assessment" : "OT Cyber Risk Assessment") + " - " + (p.suc.name || "SUC"),
      description: subLine,
      sections: [
        { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren }
      ].concat(bodySections)
    });
  }

  /* ===================== EXCEL ===================== */

  function buildWorkbook(p) {
    var ExcelJS = window.ExcelJS;
    var S = summarise(p);
    var eng = p.engagement || {};
    var rt = RT();
    var wb = new ExcelJS.Workbook();
    wb.creator = eng.consultant || "OT Cyber Risk Assessment Tool";

    function argb(hex2) { return "FF" + hex2; }
    function styleHeader(ws, rowIdx, cols) {
      var row = ws.getRow(rowIdx);
      for (var i = 1; i <= cols; i++) {
        var c = row.getCell(i);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLOR.headBg) } };
        c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        c.alignment = { vertical: "middle", wrapText: true };
      }
      row.height = 22;
    }
    function bandFillCell(cell, bandId) {
      if (!bandId) return;
      var st = bandStyle(bandId);
      cell.value = st.name;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(st.fill) } };
      cell.font = { bold: true, color: { argb: argb(st.text) }, size: 10 };
    }
    function freezeTop(ws, rows) { ws.views = [{ state: "frozen", ySplit: rows || 1 }]; }

    // ---- Front ----
    var front = wb.addWorksheet("Front", { properties: { tabColor: { argb: argb(COLOR.headBg) } } });
    front.columns = [{ width: 30 }, { width: 90 }];
    [["OT cyber risk assessment", ""],
     ["Client / organisation", notSet(eng.client)],
     ["System under consideration", notSet(p.suc.name)],
     ["Consultant", notSet(eng.consultant)],
     ["Assessment date", notSet(eng.assessmentDate)],
     ["Document revision", notSet(eng.revision)],
     ["Confidentiality", notSet(eng.confidentiality)],
     ["Tolerable risk", bandStyle(S.tolerable).name],
     ["Assumed adversary", p.srs.adversaryClass ? "SL" + p.srs.adversaryClass + "-grade" : "(not set)"],
     ["Zones / conduits", p.zones.length + " / " + p.conduits.length],
     ["Threats registered", String(S.threats.length)],
     ["Above tolerable", String(S.counts.exceeding)],
     ["Sign-off", signOffLine(p, "Not signed off")],
     ["Method note", "SolutionsPT house risk matrix and risk-to-SL mapping. SL-T values are set by the consultant, with written justification."],
     // The workbook is issued from the tool and never read back (phase 4, decision 9).
     ["About this workbook", "Issued from the risk assessment tool. A new issue replaces this workbook in full, so make changes in the tool, not here."]
    ].forEach(function (kv) { front.addRow(kv); });
    front.getCell("A1").font = { bold: true, size: 14, color: { argb: argb(COLOR.headBg) } };
    for (var fr2 = 2; fr2 <= front.rowCount; fr2++) { front.getCell("A" + fr2).font = { bold: true, size: 10 }; front.getCell("B" + fr2).alignment = { wrapText: true, vertical: "top" }; }

    // ---- Summary: the position in numbers, and a heat map per rating ----
    var R0 = RULES(), SEVS = R0.severityScale, LIKS = R0.likelihoodScale;
    var exceedX = S.threats.filter(function (x) { return x.exceeds; });
    var plan = plannedCountermeasures(S);
    var su = wb.addWorksheet("Summary", { properties: { tabColor: { argb: argb(COLOR.navy) } } });
    su.columns = [{ width: 52 }, { width: 14 }, { width: 14 }, { width: 14 }];
    su.addRow(["Summary"]).getCell(1).font = { bold: true, size: 14, color: { argb: argb(COLOR.headBg) } };
    [["Tolerable risk", bandStyle(S.tolerable).name],
     ["Threats registered", S.threats.length],
     ["Above tolerable risk before any countermeasure", exceedX.length],
     ["Of those, with a treatment decision", S.counts.decided],
     // Today and once the plan is complete: the engine's one rule, as the Word summary counts them.
     ["Of those, within tolerable risk with today's countermeasures", S.counts.withinToday],
     ["Of those, within tolerable risk once the plan is complete", S.counts.withinAfterPlan],
     ["Accepted risks", S.dispositionCounts.accepted],
     ["Additional countermeasures planned", plan.length]
    ].forEach(function (kv) { var r = su.addRow(kv); r.getCell(1).font = { bold: true, size: 10 }; r.getCell(2).alignment = { horizontal: "left" }; });
    var heavy = { style: "medium", color: { argb: "FF" + COLOR.text } };
    [["unmitigated", "Unmitigated"], ["current", "Current"], ["planned", "Planned"]].forEach(function (st) {
      su.addRow([]);
      su.addRow(["Heat map: " + st[1].toLowerCase() + " rating"]).getCell(1).font = { bold: true, size: 11, color: { argb: argb(COLOR.headBg) } };
      var head = su.addRow(["Impact, by likelihood"].concat(LIKS.map(function (l) { return l.name; })));
      styleHeader(su, head.number, LIKS.length + 1);
      var counts = {};
      S.threats.forEach(function (x) { var li = stateLI(x.t, st[0]); if (li.L && li.I) { var k = li.I + ":" + li.L; counts[k] = (counts[k] || 0) + 1; } });
      SEVS.slice().reverse().forEach(function (sv) {
        var r = su.addRow([sv.name].concat(LIKS.map(function (l) { return counts[sv.id + ":" + l.id] || null; })));
        r.getCell(1).font = { bold: true, size: 10 };
        LIKS.forEach(function (l, i) {
          var b = R0.riskMatrix[sv.id][l.id], bs = bandStyle(b), cell = r.getCell(i + 2);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bs.fill) } };
          cell.font = { bold: true, color: { argb: argb(bs.text) }, size: 11 };
          cell.alignment = { horizontal: "center" };
          if (rt.exceedsTolerable(b, S.tolerable)) cell.border = { top: heavy, bottom: heavy, left: heavy, right: heavy };
        });
      });
    });
    su.addRow([]);
    var suNote = su.addRow(["Each cell counts the threat scenarios rated there. Cells with a heavy border are above the tolerable risk of " + bandStyle(S.tolerable).name + ". A current or planned rating not given takes the rating before it."]);
    suNote.getCell(1).alignment = { wrapText: true, vertical: "top" };
    su.mergeCells(suNote.number, 1, suNote.number, LIKS.length + 1);
    suNote.height = 32;

    // ---- Ranking ----
    var rk = wb.addWorksheet("Ranking", { properties: { tabColor: { argb: argb(COLOR.near) } } });
    // A high-level-only assessment records the risk comparison per system:
    // its decision is a last column.
    var hlDecide = rt.assessmentType(p) === "high-level";
    rk.columns = [{ width: 34 }, { width: 40 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 50 }].concat(hlDecide ? [{ width: 18 }, { width: 40 }] : []);
    rk.addRow(["System", "Function / location", "Consequence", "Likelihood", "Risk", "Zone", "Note"].concat(hlDecide ? ["Detailed assessment", "Reason"] : []));
    styleHeader(rk, 1, hlDecide ? 9 : 7);
    var inZones = zonesBySystem(p);
    p.srs.highLevelAssets.filter(function (a) { return a.name; }).forEach(function (a) {
      var dc = hlDecide ? rt.hlaComparison(a, p) : null;
      var r = rk.addRow([a.name, a.functionLocation || "", sevName(a.consequence), likName(a.likelihood), "", (inZones[a.id] || []).join(", "), a.note || ""]
        .concat(dc ? [dc.required === true ? "Required" : (dc.required === false ? "Not required" : "Not decided"), dc.reason || ""] : []));
      bandFillCell(r.getCell(5), rt.riskFor(a.consequence, a.likelihood));
    });
    rk.autoFilter = { from: "A1", to: hlDecide ? "I1" : "G1" };
    freezeTop(rk);

    // ---- Threat register: the three ratings, the decision, and the owner
    // and target date of the planned countermeasures linked to each threat ----
    var tr = wb.addWorksheet("Threat register", { properties: { tabColor: { argb: argb(COLOR.gap) } } });
    var TR_HEAD = ["Zone/Conduit", "ID", "Threat statement", "Source", "Affected FRs", "Likelihood", "Impact", "Risk",
      "Current likelihood", "Current impact", "Current risk", "Planned likelihood", "Planned impact", "Planned risk",
      "Above tolerable?", "Treatment decision", "Rating that stands", "Reason / notes", "Status", "Owner", "Target date", "Progress notes"];
    function trCol(name) { return TR_HEAD.indexOf(name) + 1; }
    tr.columns = [
      { width: 12 }, { width: 8 }, { width: 60 }, { width: 24 }, { width: 14 },
      { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 10 }, { width: 26 }, { width: 12 }, { width: 50 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 40 }
    ];
    tr.addRow(TR_HEAD);
    styleHeader(tr, 1, TR_HEAD.length);
    S.threats.forEach(function (x) {
      var cur = x.current ? stateLI(x.t, "current") : { L: "", I: "" }, pl = x.planned ? stateLI(x.t, "planned") : { L: "", I: "" };
      var pm = x.treatment.plannedLinked || [];
      var owners = pm.map(function (m) { return String(m.owner || "").trim(); }).filter(function (s, i, a) { return s && a.indexOf(s) === i; });
      var due = pm.map(function (m) { return String(m.dueDate || "").trim(); }).filter(Boolean).sort().pop() || "";
      var r = tr.addRow([
        x.owner.id + (x.owner.name ? " " + x.owner.name : ""), x.t.id, x.t.statement, x.t.source || "",
        x.t.affectedFR.join(", "), likName(x.t.likelihood), sevName(x.t.impact), "",
        likName(cur.L), sevName(cur.I), "", likName(pl.L), sevName(pl.I), "",
        x.exceeds ? "Yes" : "No", x.label,
        "", x.decided ? x.treatment.reason : "", x.decided ? "Decided" : (x.exceeds ? "Open" : "Monitor"), owners.join("; "), due, ""
      ]);
      bandFillCell(r.getCell(trCol("Risk")), x.risk);
      bandFillCell(r.getCell(trCol("Current risk")), x.current);
      bandFillCell(r.getCell(trCol("Planned risk")), x.planned);
      // The rating that stands: planned, else current, else unmitigated, so never blank once rated.
      // ("Residual" in the standard's sense is the current rating; the risk context's residualRisk is unchanged.)
      bandFillCell(r.getCell(trCol("Rating that stands")), x.operative);
      if (x.exceeds && !x.decided) r.getCell(trCol("Treatment decision")).font = { bold: true, color: { argb: argb(COLOR.gap) } };
      r.getCell(trCol("Status")).dataValidation = { type: "list", allowBlank: true, formulae: ['"Open,In progress,Decided,Monitor,Closed"'] };
      r.alignment = { vertical: "top", wrapText: true };
    });
    tr.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: TR_HEAD.length } };
    freezeTop(tr);

    // ---- Treatment plan: the additional countermeasures ----
    var tp = wb.addWorksheet("Treatment plan", { properties: { tabColor: { argb: argb(COLOR.near) } } });
    tp.columns = [{ width: 14 }, { width: 8 }, { width: 60 }, { width: 16 }, { width: 20 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 18 }, { width: 16 }];
    tp.addRow(["Zone/Conduit", "ID", "Countermeasure", "Threat scenarios", "Owner", "Priority", "Due date", "Status", "SR references", "Addresses FRs"]);
    styleHeader(tp, 1, 10);
    plan.forEach(function (e) {
      var m = e.m;
      var r = tp.addRow([e.owner.id + (e.owner.name ? " " + e.owner.name : ""), m.id, m.description, e.threats.join(", "), m.owner || "", cmPriority(m), m.dueDate || "", cmStatus(m),
        (m.srRefs || []).join(", "), (m.addressesFR || []).join(", ")]);
      r.alignment = { vertical: "top", wrapText: true };
    });
    tp.autoFilter = { from: "A1", to: "J1" };
    freezeTop(tp);

    // ---- Accepted risks ----
    var ar = wb.addWorksheet("Accepted risks", { properties: { tabColor: { argb: argb(COLOR.deep) } } });
    ar.columns = [{ width: 14 }, { width: 8 }, { width: 60 }, { width: 12 }, { width: 60 }, { width: 18 }, { width: 24 }, { width: 12 }, { width: 12 }];
    ar.addRow(["Zone/Conduit", "ID", "Threat statement", "Rating", "Reason", "Accepted by", "Role", "Date", "Review date"]);
    styleHeader(ar, 1, 9);
    S.threats.filter(function (x) { return x.disposition === "accepted"; }).forEach(function (x) {
      var ad = x.t.acceptanceDetail || {};
      var r = ar.addRow([x.owner.id + (x.owner.name ? " " + x.owner.name : ""), x.t.id, x.t.statement, "", x.treatment.reason, ad.by || "", ad.role || "", ad.date || "", ad.reviewDate || ""]);
      bandFillCell(r.getCell(4), x.operative);
      r.alignment = { vertical: "top", wrapText: true };
    });
    freezeTop(ar);

    // ---- Vulnerabilities, with where each is known from and the threats that link it ----
    var vs = wb.addWorksheet("Vulnerabilities", { properties: { tabColor: { argb: argb(COLOR.gap) } } });
    vs.columns = [{ width: 14 }, { width: 8 }, { width: 70 }, { width: 40 }, { width: 18 }];
    vs.addRow(["Zone/Conduit", "ID", "Vulnerability", "Source", "Threat scenarios"]);
    styleHeader(vs, 1, 5);
    S.owners.forEach(function (row) {
      (row.o.vulnerabilities || []).forEach(function (v) {
        if (!String(v.description || "").trim()) return;
        var r = vs.addRow([row.o.id + (row.o.name ? " " + row.o.name : ""), v.id, v.description, v.reference || "", linkedThreats(row.o, v.id).join(", ")]);
        r.alignment = { vertical: "top", wrapText: true };
      });
    });
    vs.autoFilter = { from: "A1", to: "E1" };
    freezeTop(vs);

    // ---- Zones / Conduits ----
    // The risk comparison's decision, as the report prints it.
    function decisionText(c) { return c.required === true ? "Required" : (c.required === false ? "Not required" : "Not decided"); }
    function lines(v) { return (Array.isArray(v) ? v : []).join("; "); }
    var zs = wb.addWorksheet("Zones", { properties: { tabColor: { argb: argb(COLOR.met) } } });
    zs.columns = [{ width: 8 }, { width: 28 }, { width: 34 }, { width: 50 }, { width: 30 }, { width: 40 }, { width: 40 },
      { width: 30 }, { width: 34 }, { width: 34 }, { width: 40 }, { width: 50 }, { width: 18 }, { width: 50 }];
    zs.addRow(["ID", "Name", "Function", "Description", "Exposure flags", "Assets", "Access points",
      "Accountable organisation", "Physical boundary", "Physical access points", "Data flows", "Separation not in place", "Detailed assessment", "Reason"]);
    styleHeader(zs, 1, 14);
    p.zones.forEach(function (z) {
      var cmp = rt.comparison(z, p);
      var notSep = rt.separationRows(z, p).filter(function (r) { return r.answer === "not-separated"; }).map(function (r) { return r.label + (r.reason ? ": " + r.reason : ""); });
      var r = zs.addRow([z.id, z.name, z.fn || "", z.description || "",
        flagNames(z).join(", "),
        (z.assets || []).map(function (a) { return assetText(a) + (a.link ? ", " + rt.assetLinkLabel(a.link) : ""); }).join("; "),
        (z.accessPoints || []).join("; "),
        z.accountableOrg || "", z.physicalBoundary || "", lines(z.physicalAccessPoints), lines(z.dataFlows),
        notSep.join("; "), decisionText(cmp), cmp.reason || ""]);
      r.alignment = { vertical: "top", wrapText: true };
    });
    freezeTop(zs);
    var cs = wb.addWorksheet("Conduits", { properties: { tabColor: { argb: argb(COLOR.met) } } });
    cs.columns = [{ width: 8 }, { width: 26 }, { width: 10 }, { width: 10 }, { width: 22 }, { width: 60 },
      { width: 22 }, { width: 34 }, { width: 30 }, { width: 30 }, { width: 18 }, { width: 50 }];
    cs.addRow(["ID", "Name", "From", "To", "Channels and protocols", "Notes", "Direction", "Boundary devices", "Connection", "External party", "Detailed assessment", "Reason"]);
    styleHeader(cs, 1, 12);
    p.conduits.forEach(function (c) {
      var cmp = rt.comparison(c, p), marks = [];
      if (c.wireless) marks.push("wireless");
      if (rt.conduitExternal(c)) marks.push("external network");
      if (c.temporary) marks.push("temporarily connected");
      var dir = c.direction === "both" ? "Both ways"
        : c.direction === "from-to" ? "One way, " + (c.fromZone || "?") + " to " + (c.toZone || "?")
        : c.direction === "to-from" ? "One way, " + (c.toZone || "?") + " to " + (c.fromZone || "?") : "";
      var r = cs.addRow([c.id, c.name || "", c.fromZone || "", c.toZone || "", (c.channels || []).join(", "), c.notes || "",
        dir, lines(c.boundaryDevices), marks.join(", "), c.externalParty || "", decisionText(cmp), cmp.reason || ""]);
      r.alignment = { vertical: "top", wrapText: true };
    });
    freezeTop(cs);

    // ---- Countermeasures ----
    var cm = wb.addWorksheet("Countermeasures", { properties: { tabColor: { argb: argb(COLOR.blueDark) } } });
    cm.columns = [{ width: 12 }, { width: 8 }, { width: 64 }, { width: 16 }, { width: 12 }, { width: 20 }, { width: 18 }, { width: 16 }];
    cm.addRow(["Zone/Conduit", "ID", "Countermeasure", "Addresses FRs", "Existing?", "Reference", "SR references", "Threat scenarios"]);
    styleHeader(cm, 1, 8);
    S.owners.forEach(function (row) {
      (row.o.countermeasures || []).forEach(function (m) {
        var r = cm.addRow([row.o.id, m.id, m.description, m.addressesFR.join(", "), m.existing ? "existing" : "planned", m.reference || "", (m.srRefs || []).join(", "), linkedThreats(row.o, m.id).join(", ")]);
        if (m.existing) r.getCell(5).font = { bold: true, color: { argb: argb(COLOR.met) } };
        r.alignment = { vertical: "top", wrapText: true };
      });
    });
    cm.autoFilter = { from: "A1", to: "H1" };
    freezeTop(cm);

    // ---- SL-T matrix ----
    var frs = FRS();
    var sl = wb.addWorksheet("SL-T", { properties: { tabColor: { argb: argb(COLOR.headBg) } } });
    sl.columns = [{ width: 26 }].concat(frs.map(function () { return { width: 8 }; })).concat([{ width: 90 }]);
    sl.addRow(["Zone / conduit"].concat(frs.map(function (f) { return f.id; })).concat(["Justification"]));
    styleHeader(sl, 1, frs.length + 2);
    S.owners.forEach(function (row) {
      var o = row.o;
      var r = sl.addRow([o.id + " " + (o.name || "")].concat(frs.map(function (f) {
        var v = o.slTargetByFR[f.id];
        return v == null ? "Not set" : "SL" + v;
      })).concat([o.justification || ""]));
      r.getCell(1).font = { bold: true, size: 10 };
      r.alignment = { vertical: "top", wrapText: true };
    });
    var worst = sl.addRow(["Worst case"].concat(frs.map(function (f) { return S.sltMax[f.id] == null ? "Not set" : "SL" + S.sltMax[f.id]; })).concat([""]));
    worst.eachCell(function (c) { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLOR.subBg) } }; });
    freezeTop(sl);

    // ---- Criteria: the risk criteria every rating rests on, as the Word
    // appendix prints them ----
    var cr = wb.addWorksheet("Criteria", { properties: { tabColor: { argb: argb(COLOR.soft) } } });
    cr.columns = [{ width: 24 }].concat(LIKS.map(function () { return { width: 18 }; })).concat([{ width: 40 }]);
    function crTitle(t) { var r = cr.addRow([t]); r.getCell(1).font = { bold: true, size: 11, color: { argb: argb(COLOR.headBg) } }; return r; }
    function plainNote(s) { s = String(s || "").replace(/^House default:\s*/i, ""); return s.charAt(0).toUpperCase() + s.slice(1); }
    cr.addRow(["Risk criteria"]).getCell(1).font = { bold: true, size: 14, color: { argb: argb(COLOR.headBg) } };
    var crLead = cr.addRow([p.srs.clientMatrix ? "The SolutionsPT house risk criteria, shown for reference. The client's own risk criteria are in use." : "The SolutionsPT house risk criteria used in this assessment."]);
    cr.mergeCells(crLead.number, 1, crLead.number, LIKS.length + 2);
    var crTol = cr.addRow(["Tolerable risk", bandStyle(S.tolerable).name]); crTol.getCell(1).font = { bold: true, size: 10 };
    cr.addRow([]);
    crTitle("Risk matrix");
    var mh = cr.addRow(["Impact, by likelihood"].concat(LIKS.map(function (l) { return l.name; })));
    styleHeader(cr, mh.number, LIKS.length + 1);
    SEVS.slice().reverse().forEach(function (sv) {
      var r = cr.addRow([sv.name].concat(LIKS.map(function (l) { var b = R0.riskMatrix[sv.id][l.id]; return bandStyle(b).name + (rt.exceedsTolerable(b, S.tolerable) ? " (above)" : ""); })));
      r.getCell(1).font = { bold: true, size: 10 };
      LIKS.forEach(function (l, i) {
        var b = R0.riskMatrix[sv.id][l.id], bs = bandStyle(b), cell = r.getCell(i + 2);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bs.fill) } };
        cell.font = { bold: true, color: { argb: argb(bs.text) }, size: 10 };
        if (rt.exceedsTolerable(b, S.tolerable)) cell.border = { top: heavy, bottom: heavy, left: heavy, right: heavy };
      });
    });
    cr.addRow(["Cells marked above, with a heavy border, are above the tolerable risk."]);
    function crScale(title, head, list) {
      cr.addRow([]);
      crTitle(title);
      var hr = cr.addRow(head); styleHeader(cr, hr.number, 2);
      list.forEach(function (x) { var r = cr.addRow([x[0], x[1]]); r.getCell(1).font = { bold: true, size: 10 }; r.getCell(2).alignment = { wrapText: true, vertical: "top" }; cr.mergeCells(r.number, 2, r.number, LIKS.length + 2); });
    }
    crScale("Impact scale", ["Impact", "Meaning"], SEVS.slice().reverse().map(function (x) { return [x.name, plainNote(x.note)]; }));
    crScale("Likelihood scale", ["Likelihood", "Meaning"], LIKS.slice().reverse().map(function (x) { return [x.name, plainNote(x.note)]; }));
    var defs = R0.slDefinitions || {};
    crScale("Security levels", ["Security level", "Protects against"], ["1", "2", "3", "4"].filter(function (k) { return defs[k]; }).map(function (k) { return ["SL" + k, defs[k]]; }));
    var r2sl = R0.riskToSL || {};
    crScale("Suggested SL-T", ["Unmitigated risk", "Suggested SL-T"], R0.riskBands.filter(function (b) { return r2sl[b.id]; }).map(function (b) { return [b.name, "SL" + r2sl[b.id].suggest]; }));
    crScale("Foundational requirements", ["Short form", "Foundational requirement"], frs.map(function (f) { return [f.id, f.fr + " " + String(f.name).replace(/ & /g, " and ")]; }));

    // ---- Basis ----
    var ba = wb.addWorksheet("Basis", { properties: { tabColor: { argb: argb(COLOR.soft) } } });
    ba.columns = [{ width: 30 }, { width: 36 }, { width: 16 }, { width: 50 }];
    ba.addRow(["People interviewed", "", "", ""]); styleHeader(ba, 1, 4);
    p.basisOfAssessment.interviews.forEach(function (i) { ba.addRow([i.name, i.role, i.date, i.notes || ""]); });
    ba.addRow([]);
    var dHead = ba.addRow(["Documents reviewed", "", "", ""]); styleHeader(ba, dHead.number, 4);
    p.basisOfAssessment.documents.forEach(function (d) { ba.addRow([d.title, d.reference || "", d.source || "", d.relevance || ""]); });
    ba.addRow([]);
    var oHead = ba.addRow(["Systems / evidence observed", "", "", ""]); styleHeader(ba, oHead.number, 4);
    p.basisOfAssessment.observations.forEach(function (o) { ba.addRow([o.description, o.location || "", o.date || "", o.notes || ""]); });

    return wb;
  }

  /* ===================== downloads ===================== */

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function downloadWord(opts, done) {
    var p = RT().state.project;
    var doc = buildWordDoc(p, opts || {});
    window.docx.Packer.toBlob(doc).then(function (blob) {
      saveBlob(blob, slug(p.suc.name) + (opts && opts.highLevelOnly ? "-high-level-risk-assessment.docx" : "-risk-assessment.docx"));
      if (done) done(null);
    }).catch(function (e) { if (done) done(e); });
  }

  function downloadExcel(done) {
    var p = RT().state.project;
    var wb = buildWorkbook(p);
    wb.xlsx.writeBuffer().then(function (buf) {
      saveBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), slug(p.suc.name) + "-risk-assessment.xlsx");
      if (done) done(null);
    }).catch(function (e) { if (done) done(e); });
  }

  return {
    buildWordDoc: buildWordDoc,
    buildWorkbook: buildWorkbook,
    summarise: summarise,
    // For the review pack (js/review.js): the names the reports print.
    bandName: function (id) { return bandStyle(id).name; },
    signOffTexts: signOffTexts,
    SIGNATURE_HEAD: SIGNATURE_HEAD.slice(),
    downloadWord: downloadWord,
    downloadExcel: downloadExcel
  };
})();
