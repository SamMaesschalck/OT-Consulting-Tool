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
 * Excel (vendor/exceljs.min.js) is the engineers' working artefact: a
 * living threat tracker (status dropdown + tracking columns), the ranking,
 * zone/conduit registers, countermeasures, the SL-T matrix and the basis.
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
  function bandStyle(id) { return BAND_STYLE[id] || { fill: COLOR.naBg, text: COLOR.muted, name: id ? cap(id) : "—" }; }
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
  function flagNames(o) { return Object.keys(o.flags || {}).filter(function (k) { return o.flags[k]; }).map(function (k) { return RT().flagLabel(k); }); }
  function assetText(a) { return a.name + (a.type && a.type !== "other" ? " (" + RT().assetTypeLabel(a.type) + ")" : ""); }

  // The sentences the asset owner's sign-off prints outside the Sign-off
  // section and document control: [executive summary, Sign-off section when not
  // yet signed]. One place, because a review's content hash leaves them out
  // (js/review.js): signing off after an approval is not a change to what was
  // reviewed.
  function signOffTexts(p) {
    var a = p.approval || {};
    return [
      a.approved
        ? "The asset owner, " + a.name + " (" + a.role + "), signed off the tolerable risk and the results on " + a.date + ": “" + a.statement + "”"
        : "The asset owner has not yet signed off the tolerable risk or the results.",
      "The asset owner has not yet signed off the tolerable risk or the results."
    ];
  }

  // Everything the report tells is derived once, shared by both formats: the
  // tool's one view model (js/view-model.js), which the screen, the risk
  // context and the review pack read too. Its owners and threats are the
  // rows the builders below walk; see that file for the shape.
  function summarise(p) {
    return RT().viewModel(p);
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
    function bulletList(items) {
      return items.map(function (t) {
        return new docx.Paragraph({ children: [run(t)], bullet: { level: 0 }, spacing: { after: 60 } });
      });
    }
    function bandCell(bandId, width) {
      var st = bandStyle(bandId);
      return textCell(st.name, width, { fill: st.fill, color: st.text, bold: true, valign: "center" });
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
        var highPlus = ranked.filter(function (a) { var b2 = rt.riskFor(a.consequence, a.likelihood); return b2 === "high" || b2 === "very-high"; }).length;
        var promoted = p.zones.filter(function (z) { return z.fromHLA; }).length;
        out.push(sbTilesRow([
          { t: String(ranked.length), color: COLOR.navy, label: "systems ranked", fill: COLOR.subBg },
          { t: String(highPlus), color: highPlus ? COLOR.gap : COLOR.met, label: "ranked High or above", fill: highPlus ? COLOR.gapBg : COLOR.metBg },
          { t: bandStyle(S.tolerable).name, color: bandStyle(S.tolerable).text, label: "tolerable risk", fill: bandStyle(S.tolerable).fill, size: 32 },
          { t: String(promoted), color: COLOR.navy, label: "promoted to detailed tier", fill: COLOR.subBg }
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
        { t: sltWorst == null ? "—" : "SL" + sltWorst, color: COLOR.navy, label: "highest SL-T set", fill: COLOR.subBg }
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
        return { t: v == null ? "—" : "SL" + v, color: v != null ? COLOR.navy : COLOR.soft, label: f.id, fill: COLOR.subBg, size: 28 };
      })));
      // Focus cards: above tolerable with no decision first, then worst risks.
      function focusId(x) { return x.owner.id + ":" + x.t.id; }
      var focus = RS.applyOrder(S.threats.filter(function (x) { return x.exceeds && !x.decided; })
        .concat(S.threats.filter(function (x) { return x.exceeds && x.decided; })
          .sort(function (a, b6) { return (S.bandRank[b6.risk] || 0) - (S.bandRank[a.risk] || 0); })),
        orderOf("Where to focus first"), focusId)
        .slice(0, 3);
      noteList("Where to focus first", focus.map(focusId));
      if (focus.length) {
        out.push(h2("Where to focus first"));
        focus.forEach(function (x, i) {
          out.push(sbFocusCard(i + 1, x.t.id + "  " + x.t.statement, x.owner.id + " · " + bandStyle(x.risk).name + (x.decided ? "" : x.incomplete ? " · decision incomplete" : " · no decision recorded")));
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
      ["Asset-owner sign-off", p.approval.approved ? (p.approval.name + " (" + p.approval.role + "), " + p.approval.date) : "Not yet signed off"]
    ]));
    children.push(pageBreak());

    // ---- executive summary (a narrative composed from the data; the
    // consultant tailors it — red delete-me note per house convention) ----
    children.push(heading("Executive summary", docx.HeadingLevel.HEADING_1, { before: 0 }));
    var ranked = p.srs.highLevelAssets.filter(function (a) { return a.name; });
    var tolName = bandStyle(S.tolerable).name;
    var promoted = p.zones.filter(function (z) { return z.fromHLA; }).length;
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
        out.push(body("The assumed adversary is SL" + p.srs.adversaryClass + " grade on the IEC 62443 scale, meaning " + ({1: "casual or accidental misuse", 2: "an intentional attacker using simple means and low resources", 3: "a sophisticated attacker using specific skills and moderate resources", 4: "a sophisticated, well-resourced and motivated attacker (state-grade)"}[p.srs.adversaryClass] || "see the requirements section") + ". This choice is the asset owner's, because it sets how strong the countermeasures must be."));
      }
      return out;
    }
    if (opts.highLevelOnly) {
      children.push(h2("Why this assessment"));
      children.push(body("A cyber incident on a plant can stop production, damage equipment and put people at risk. Before investing in detailed security engineering, " + notSet(eng.client) + " needs to know which systems across " + (p.suc.name || "the systems in scope") + " carry the most risk, and which justify a full, per-system assessment."));
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
      var highPlus = perBandHL["very-high"].concat(perBandHL["high"]);
      if (ranked.length) {
        children.push(body(ranked.length + " systems were ranked" + (bandBits.length ? ": " + bandBits.join(", ") : "") + ". " +
          (highPlus.length
            ? "The systems ranked High or above (" + highPlus.map(function (a) { return a.name; }).join(", ") + ") are the candidates for detailed, per-system assessment" + (promoted ? "; " + promoted + " ranked system" + (promoted === 1 ? " has" : "s have") + " already moved into the detailed tier" : "") + "."
            : "No system ranks High or above, so on this evidence a detailed assessment is optional.")));
      } else {
        children.push(body("No systems have been ranked yet."));
      }
      children.push(h2("What happens next"));
      children.push(body("In the detailed tier, each system taken forward is divided into security zones and conduits, its threats are registered and treated, and target security levels are set to scope the engineering work. Systems below the threshold should be re-ranked if their connectivity, criticality or threat exposure changes."));
    } else {
      var exceed = S.threats.filter(function (x) { return x.exceeds; });
      children.push(h2("Why this assessment"));
      children.push(body("A cyber incident on a plant can stop production, damage equipment and put people at risk. Regulators and insurers increasingly expect an asset owner to show where that risk sits and that the protection in place is proportionate to it. " + notSet(eng.client) + " commissioned this assessment of " + (p.suc.name || "the system under consideration") + (eng.assessmentDate ? " (" + eng.assessmentDate + ")" : "") + " to establish that."));
      children = children.concat(stakesKids());
      children.push(h2("What this report is"));
      function nOf(n, one, many) { return n + " " + (n === 1 ? one : many); }
      children.push(body("The assessment follows IEC 62443-3-2. " + (ranked.length ? nOf(ranked.length, "system was", "systems were") + " first ranked for relative risk. The system under consideration was then" : "The system under consideration was") + " divided into " + nOf(p.zones.length, "security zone", "security zones") + " and " + nOf(p.conduits.length, "conduit", "conduits") + ". A zone groups assets with the same security requirements, and a conduit is a communication path between zones. Threats to each zone and conduit were rated for likelihood and impact against the tolerable risk of " + tolName + ", and every threat above that level needs a recorded treatment decision. Each zone and conduit then has a target security level (SL-T), the protection it must be engineered and maintained to."));
      var bSent = basisSentence();
      if (bSent) children.push(body(bSent));
      children.push(h2("What we found"));
      // Where the risk sits.
      var hottest = null, hotCount = 0;
      S.owners.forEach(function (row) {
        var n2 = row.exceeding.length;
        if (n2 > hotCount) { hotCount = n2; hottest = row; }
      });
      var findRuns = [
        run(S.threats.length + " threats were registered; "),
        run(String(exceed.length), { bold: true, color: exceed.length ? COLOR.gap : COLOR.met }),
        run(" exceed the tolerable risk of " + tolName + " before treatment.")
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
      // The treatment position.
      if (exceed.length) {
        var c = S.dispositionCounts;
        var cmEx = S.counts.countermeasuresExisting, cmPl = S.counts.countermeasuresPlanned;
        var accepted = exceed.filter(function (x) { return x.disposition === "accepted"; });
        var undecided = exceed.filter(function (x) { return !x.decided && !x.incomplete; });
        var incomplete = exceed.filter(function (x) { return x.incomplete; });
        function isAre(n) { return n + (n === 1 ? " is" : " are"); }
        function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
        // Only decisions that stand are counted: dispositionCounts leaves out
        // an unconfirmed decision and one recorded without what it rests on.
        var bits = [];
        if (c.mitigated || c.countermeasure || c["sl-t"] || c.accepted) {
          if (c.mitigated) bits.push(isAre(c.mitigated) + " reduced to within tolerable risk by countermeasures");
          if (c.countermeasure) bits.push(isAre(c.countermeasure) + " being reduced with countermeasures");
          if (c["sl-t"]) bits.push(isAre(c["sl-t"]) + " treated through the target security level programme");
          if (c.accepted) bits.push(isAre(c.accepted) + " formally accepted by the asset owner");
          children.push(body("Of the " + nOf(exceed.length, "threat", "threats") + " above tolerable risk, " +(bits.length > 1 ? bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1] : bits[0]) + ". The register holds " + cmEx + " existing and " + cmPl + " planned countermeasures."));
        }
        if (accepted.length) {
          children.push(body((accepted.length > 1 ? "Accepted risks: " : "Accepted risk ") + accepted.map(function (x) { return x.t.id + " (" + x.owner.id + "): " + noStop(x.t.statement); }).join("; ") + ". The rationale is recorded in the threat register and should be revisited at the next assessment."));
        }
        if (incomplete.length) {
          children.push(body(nOf(incomplete.length, "treatment decision is", "treatment decisions are") + " incomplete: " + incomplete.map(function (x) { return x.t.id + " (" + x.owner.id + "), " + lower(x.label); }).join("; ") + ".", { bold: true, color: COLOR.note }));
        }
        if (undecided.length) {
          children.push(body(undecided.length + " threat" + (undecided.length > 1 ? "s" : "") + " above tolerable risk " + (undecided.length > 1 ? "have" : "has") + " no treatment decision recorded: " + undecided.map(function (x) { return x.t.id + " (" + x.owner.id + ")"; }).join(", ") + ".", { bold: true, color: COLOR.note }));
        }
      } else if (S.threats.length) {
        children.push(body("No registered threat exceeds the tolerable risk of " + tolName + ", so no treatment decision is needed."));
      }
      // The outcome: the SL-T vector and what happens next.
      children.push(h2("What happens next"));
      var sltBits = FRS().map(function (f) { return f.id + (S.sltMax[f.id] == null ? " not set" : " SL" + S.sltMax[f.id]); }).join(", ");
      var overallMax = FRS().map(function (f) { return S.sltMax[f.id]; }).reduce(function (m, v) { return v != null && (m === null || v > m) ? v : m; }, null);
      var drivers = [];
      if (overallMax != null) {
        S.owners.forEach(function (row) {
          var hit = FRS().some(function (f) { return row.o.slTargetByFR[f.id] === overallMax; });
          if (hit) drivers.push(row.o.id + (row.o.name ? " " + row.o.name : ""));
        });
      }
      children.push(body("The highest target security levels across the system are " + sltBits + "." + (overallMax != null && drivers.length ? " The SL" + overallMax + " ceiling is set by " + (drivers.length > 3 ? drivers.slice(0, 3).join(", ") + " and " + (drivers.length - 3) + " more" : drivers.join(", ")) + "." : "") + " An IEC 62443-3-3 assessment against these targets will measure what the system can withstand today, and the gaps it finds become the security improvement programme."));
      children.push(body("Repeat this assessment after a significant change to the system or its connectivity, after a security incident, and otherwise at regular intervals."));
    }
    if (p.approval.approved) {
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

    // ---- the SUC and its requirements ----
    children.push(heading("System under consideration and requirements", docx.HeadingLevel.HEADING_1, { before: 0 }));
    if (p.suc.description) children.push(body(p.suc.description));
    if (p.suc.scopeStatement) children.push(para([run("Scope: ", { bold: true }), run(p.suc.scopeStatement)]));
    if (p.srs.essentialFunctions) children.push(para([run("Essential functions: ", { bold: true }), run(p.srs.essentialFunctions)]));
    if (p.srs.worstCase) children.push(para([run("Worst-case consequence: ", { bold: true }), run(p.srs.worstCase)]));
    children.push(para([run("Tolerable risk: ", { bold: true }), run(bandStyle(S.tolerable).name, { bold: true, color: bandStyle(S.tolerable).text }), run("   Assumed adversary: " + (p.srs.adversaryClass ? "SL" + p.srs.adversaryClass + "-grade" : "(not set)"))]));
    [["Operating-environment assumptions", p.suc.assumptions],
     ["Known or presumed threats", p.srs.knownThreats],
     ["Security functions that must be kept", p.srs.mandatorySecurityFunctions],
     ["Regulatory requirements", p.srs.regulatory]].forEach(function (pair) {
      if (pair[1] && pair[1].length) {
        children.push(h2(pair[0]));
        children = children.concat(bulletList(pair[1]));
      }
    });

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
      children.push(body("Systems are ranked by consequence and likelihood on the SolutionsPT house risk matrix" + (p.srs.clientMatrix ? " (client matrix noted: " + (p.srs.clientMatrixNote || "in use") + ")" : "") + ". An arrow and zone ID mark a system taken into the detailed tier."));
      var rw = [2500, 2400, 1300, 1300, 1200, 2006];
      var promotedFrom = {};
      p.zones.forEach(function (z) { if (z.fromHLA) promotedFrom[z.fromHLA] = z.id; });
      var rows = [headerRow(["System", "Function / location", "Consequence", "Likelihood", "Risk", "Note"], rw)];
      ranked.slice().sort(function (a, b2) {
        return (S.bandRank[rt.riskFor(b2.consequence, b2.likelihood)] || 0) - (S.bandRank[rt.riskFor(a.consequence, a.likelihood)] || 0);
      }).forEach(function (a) {
        var band = rt.riskFor(a.consequence, a.likelihood);
        rows.push(new docx.TableRow({ children: [
          textCell(a.name + (promotedFrom[a.id] ? "  → " + promotedFrom[a.id] : ""), rw[0], { bold: !!promotedFrom[a.id] }),
          textCell(a.functionLocation || "", rw[1]),
          textCell(sevName(a.consequence) || "—", rw[2]),
          textCell(likName(a.likelihood) || "—", rw[3]),
          bandCell(band, rw[4]),
          textCell(a.note || "", rw[5])
        ] }));
      });
      children.push(fixedTable(rows, rw));
    }

    if (!opts.highLevelOnly) {
      // ---- zones & conduits + threat registers ----
      children.push(h1("Zones, conduits and the detailed risk assessment"));
      children.push(body("Each threat is rated for likelihood and impact on the SolutionsPT house risk matrix and compared with the tolerable risk of " + tolName + "."));
      // The same drawing as the Zones & conduits page, as a picture.
      var map = window.RiskZoneMap && p.zones.length ? window.RiskZoneMap.layout(p, rt.suggestZone) : null;
      var png = map ? window.RiskZoneMap.toPng(map, 3) : null;
      if (png) {
        var mapW = Math.min(600, png.width), mapH = Math.round(png.height * mapW / png.width);
        children.push(new docx.Paragraph({ alignment: docx.AlignmentType ? docx.AlignmentType.CENTER : "center", spacing: { before: 120, after: 200 }, keepNext: true,
          children: [new docx.ImageRun({ data: png.bytes, transformation: { width: mapW, height: mapH }, altText: { title: "Zones and conduits", description: "Zone and conduit drawing", name: "zone-map" } })] }));
      }
      S.owners.forEach(function (row) {
        var o = row.o;
        // A zone's own heading is its name, not a section title: it closes the
        // section before it and is renamed where the zone is entered.
        var ownerHead = h2(o.id + ": " + (o.name || "(unnamed " + row.kind.toLowerCase() + ")") + (row.kind === "Conduit" ? "  (" + (o.fromZone || "?") + " → " + (o.toZone || "external") + ")" : ""));
        ownerHead.__boundaryOnly = true;
        children.push(ownerHead);
        var meta = [];
        if (o.fn) meta.push("Function: " + o.fn);
        if (o.description) meta.push(o.description);
        if (row.kind === "Conduit" && o.channels && o.channels.length) meta.push("Channels: " + o.channels.join(", "));
        var flagsOn = flagNames(o);
        if (flagsOn.length) meta.push("Exposure: " + flagsOn.join(", "));
        if (meta.length) children.push(body(meta.join("  ·  "), { color: COLOR.muted }));
        if (o.assets && o.assets.length) children.push(body("Assets: " + o.assets.map(assetText).join("; "), { color: COLOR.muted }));
        if (o.vulnerabilities && o.vulnerabilities.length) {
          children.push(body("Vulnerabilities: " + o.vulnerabilities.map(function (v) { return v.description; }).join(" · "), { color: COLOR.muted }));
        }
        var oThreats = row.threats;
        if (!oThreats.length) {
          children.push(body("No threats registered.", { color: COLOR.muted, italics: true }));
        } else {
          var tw = [3400, 1150, 1150, 1100, 2200];
          var trows = [headerRow(["Threat", "L × I", "Risk", "Residual", "Treatment"], tw)];
          oThreats.forEach(function (x) {
            trows.push(new docx.TableRow({ children: [
              textCell(x.t.id + "  " + x.t.statement + (x.t.source ? "  (" + x.t.source + ")" : "") + (x.t.affectedFR.length ? "  [" + x.t.affectedFR.join(", ") + "]" : ""), tw[0]),
              // An unrated threat says so in words: a dash beside a rating reads as
              // a typo, and the review tool's dash check would report it as one.
              textCell((x.t.likelihood || x.t.impact) ? (x.t.likelihood ? likName(x.t.likelihood) : "Not rated") + " × " + (x.t.impact ? sevName(x.t.impact) : "Not rated") : "Not rated",
                tw[1], (x.t.likelihood && x.t.impact) ? {} : { color: COLOR.muted }),
              bandCell(x.risk, tw[2]),
              x.residual ? bandCell(x.residual, tw[3]) : textCell("—", tw[3]),
              // No decision, or an incomplete one, prints in the red of a prompt left to complete.
              textCell(x.label, tw[4], x.exceeds && !x.decided ? { bold: true, color: COLOR.note } : {})
            ] }));
          });
          children.push(fixedTable(trows, tw));
          oThreats.forEach(function (x) {
            if (x.disposition === "accepted" && x.treatment.reason) {
              children.push(body(x.t.id + " risk acceptance: " + x.treatment.reason, { italics: true }));
            } else if (x.disposition === "sl-t" && x.treatment.reason) {
              children.push(body(x.t.id + " treated through the SL-T programme: " + x.treatment.reason, { italics: true }));
            }
          });
        }
        if (o.countermeasures && o.countermeasures.length) {
          children.push(body("Countermeasures: " + o.countermeasures.map(function (m) {
            return m.id + " " + m.description + (m.existing ? " [existing]" : " [planned]") + (m.addressesFR.length ? " (" + m.addressesFR.join(", ") + ")" : "");
          }).join(" · "), { color: COLOR.muted }));
        }
      });

      // ---- SL-T ----
      children.push(h1("Target security levels (SL-T, per foundational requirement)"));
      children.push(body("Each zone and conduit has one target per foundational requirement, set by the consultant from the risk assessment."));
      var frs = FRS();
      var mw = [2200].concat(frs.map(function () { return 940; }));
      var mrows = [headerRow(["Zone / conduit"].concat(frs.map(function (f) { return f.id; })), mw)];
      S.owners.forEach(function (row) {
        var o = row.o;
        mrows.push(new docx.TableRow({ children: [textCell(o.id + " " + (o.name || ""), mw[0], { bold: true })].concat(frs.map(function (f, i) {
          var v = o.slTargetByFR[f.id];
          return textCell(v == null ? "—" : "SL" + v, mw[i + 1], v != null ? { bold: true } : { color: COLOR.muted });
        })) }));
      });
      mrows.push(new docx.TableRow({ children: [textCell("Worst case", mw[0], { bold: true, fill: COLOR.subBg })].concat(frs.map(function (f, i) {
        var v = S.sltMax[f.id];
        return textCell(v == null ? "—" : "SL" + v, mw[i + 1], { bold: true, fill: COLOR.subBg });
      })) }));
      children.push(fixedTable(mrows, mw));
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
    children.push(h1("Sign-off"));
    if (p.approval.approved) {
      children.push(kvTable([
        ["Signed off by", p.approval.name + " (" + p.approval.role + ")"],
        ["Date", p.approval.date],
        ["Statement", p.approval.statement]
      ]));
    } else {
      children.push(pinned(body(signOffTexts(p)[1], { bold: true, color: COLOR.gap })));
    }
    children.push(h1("Method and limitations"));
    children.push(body("The assessment follows " + rt.zcrMap.standard.id + ". The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house defaults. The standard prescribes no matrix, so a client corporate matrix takes precedence where one exists." + (opts.highLevelOnly ? "" : " Each SL-T is the consultant's judgement, informed by the house mapping.")));
    children.push(body(opts.highLevelOnly
      ? "Consequence and likelihood ratings reflect the evidence available at the time of the engagement. The assessment does not test security capability."
      : "Likelihood and impact ratings reflect the evidence available at the time of the engagement. The assessment sets targets and does not test security capability, which is measured against the SL-T in an IEC 62443-3-3 assessment."));

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

    var PO = (docx.PageOrientation) || { PORTRAIT: "portrait" };
    var A4_W = 11906, A4_H = 16838;
    var bodySection = { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } }, children: children };
    // The Report page rebuilds after every edit and reads only the body, so it
    // leaves out the cover art and the logo header, the slow part to pack.
    if (opts.preview) return new docx.Document({ sections: [bodySection] });
    bodySection.headers = brandHeaders();
    bodySection.footers = brandFootersDoc();
    return new docx.Document({
      creator: eng.consultant || "OT Cyber Risk Assessment Tool",
      title: (opts.highLevelOnly ? "High-Level OT Cyber Risk Assessment" : "OT Cyber Risk Assessment") + " - " + (p.suc.name || "SUC"),
      description: subLine,
      sections: [
        { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren },
        bodySection
      ]
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
     ["Sign-off", p.approval.approved ? (p.approval.name + " (" + p.approval.role + "), " + p.approval.date) : "Not signed off"],
     ["Method note", "SolutionsPT house risk matrix and risk-to-SL mapping. SL-T values are set by the consultant, with written justification."]
    ].forEach(function (kv) { front.addRow(kv); });
    front.getCell("A1").font = { bold: true, size: 14, color: { argb: argb(COLOR.headBg) } };
    for (var fr2 = 2; fr2 <= 14; fr2++) front.getCell("A" + fr2).font = { bold: true, size: 10 };

    // ---- Ranking ----
    var rk = wb.addWorksheet("Ranking", { properties: { tabColor: { argb: argb(COLOR.near) } } });
    rk.columns = [{ width: 34 }, { width: 40 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 50 }];
    rk.addRow(["System", "Function / location", "Consequence", "Likelihood", "Risk", "Zone", "Note"]);
    styleHeader(rk, 1, 7);
    var promotedFrom = {};
    p.zones.forEach(function (z) { if (z.fromHLA) promotedFrom[z.fromHLA] = z.id; });
    p.srs.highLevelAssets.filter(function (a) { return a.name; }).forEach(function (a) {
      var r = rk.addRow([a.name, a.functionLocation || "", sevName(a.consequence), likName(a.likelihood), "", promotedFrom[a.id] || "", a.note || ""]);
      bandFillCell(r.getCell(5), rt.riskFor(a.consequence, a.likelihood));
    });
    rk.autoFilter = { from: "A1", to: "G1" };
    freezeTop(rk);

    // ---- Threat register (living tracker) ----
    var tr = wb.addWorksheet("Threat register", { properties: { tabColor: { argb: argb(COLOR.gap) } } });
    tr.columns = [
      { width: 12 }, { width: 8 }, { width: 60 }, { width: 24 }, { width: 14 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 26 },
      { width: 12 }, { width: 50 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 40 }
    ];
    tr.addRow(["Zone/Conduit", "ID", "Threat statement", "Source", "Affected FRs", "Likelihood", "Impact", "Risk", "Above tolerable?", "Treatment decision", "Residual", "Reason / notes", "Status", "Owner", "Target date", "Progress notes"]);
    styleHeader(tr, 1, 16);
    S.threats.forEach(function (x) {
      var r = tr.addRow([
        x.owner.id + (x.owner.name ? " " + x.owner.name : ""), x.t.id, x.t.statement, x.t.source || "",
        x.t.affectedFR.join(", "), likName(x.t.likelihood), sevName(x.t.impact), "", x.exceeds ? "Yes" : "No",
        x.label,
        "", x.decided ? x.treatment.reason : "", x.decided ? "Decided" : (x.exceeds ? "Open" : "Monitor"), "", "", ""
      ]);
      bandFillCell(r.getCell(8), x.risk);
      if (x.residual) bandFillCell(r.getCell(11), x.residual);
      if (x.exceeds && !x.decided) r.getCell(10).font = { bold: true, color: { argb: argb(COLOR.gap) } };
      r.getCell(13).dataValidation = { type: "list", allowBlank: true, formulae: ['"Open,In progress,Decided,Monitor,Closed"'] };
      r.alignment = { vertical: "top", wrapText: true };
    });
    tr.autoFilter = { from: "A1", to: "P1" };
    freezeTop(tr);

    // ---- Zones / Conduits ----
    var zs = wb.addWorksheet("Zones", { properties: { tabColor: { argb: argb(COLOR.met) } } });
    zs.columns = [{ width: 8 }, { width: 28 }, { width: 34 }, { width: 50 }, { width: 30 }, { width: 40 }, { width: 40 }];
    zs.addRow(["ID", "Name", "Function", "Description", "Exposure flags", "Assets", "Access points"]);
    styleHeader(zs, 1, 7);
    p.zones.forEach(function (z) {
      zs.addRow([z.id, z.name, z.fn || "", z.description || "",
        flagNames(z).join(", "),
        (z.assets || []).map(assetText).join("; "),
        (z.accessPoints || []).join("; ")]);
    });
    freezeTop(zs);
    var cs = wb.addWorksheet("Conduits", { properties: { tabColor: { argb: argb(COLOR.met) } } });
    cs.columns = [{ width: 8 }, { width: 26 }, { width: 10 }, { width: 10 }, { width: 22 }, { width: 60 }];
    cs.addRow(["ID", "Name", "From", "To", "Channels", "Notes"]);
    styleHeader(cs, 1, 6);
    p.conduits.forEach(function (c) {
      cs.addRow([c.id, c.name || "", c.fromZone || "", c.toZone || "(external)", (c.channels || []).join(", "), c.notes || ""]);
    });
    freezeTop(cs);

    // ---- Countermeasures ----
    var cm = wb.addWorksheet("Countermeasures", { properties: { tabColor: { argb: argb(COLOR.blueDark) } } });
    cm.columns = [{ width: 12 }, { width: 8 }, { width: 64 }, { width: 16 }, { width: 12 }, { width: 20 }];
    cm.addRow(["Zone/Conduit", "ID", "Countermeasure", "Addresses FRs", "Existing?", "Reference"]);
    styleHeader(cm, 1, 6);
    S.owners.forEach(function (row) {
      (row.o.countermeasures || []).forEach(function (m) {
        var r = cm.addRow([row.o.id, m.id, m.description, m.addressesFR.join(", "), m.existing ? "existing" : "planned", m.reference || ""]);
        if (m.existing) r.getCell(5).font = { bold: true, color: { argb: argb(COLOR.met) } };
      });
    });
    cm.autoFilter = { from: "A1", to: "F1" };
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
        return v == null ? "—" : "SL" + v;
      })).concat([o.justification || ""]));
      r.getCell(1).font = { bold: true, size: 10 };
      r.alignment = { vertical: "top", wrapText: true };
    });
    var worst = sl.addRow(["Worst case"].concat(frs.map(function (f) { return S.sltMax[f.id] == null ? "—" : "SL" + S.sltMax[f.id]; })).concat([""]));
    worst.eachCell(function (c) { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(COLOR.subBg) } }; });
    freezeTop(sl);

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
    downloadWord: downloadWord,
    downloadExcel: downloadExcel
  };
})();
