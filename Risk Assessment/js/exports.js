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
 * deliverable; {highLevelOnly:true} builds the §4.2-only variant.
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
  function slug(s) { return String(s || "risk-assessment").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "risk-assessment"; }
  function notSet(v) { return (v && String(v).trim()) ? String(v) : "(not set)"; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  var DISPOSITION_LABEL = {
    "mitigated": "Mitigated (residual within tolerable)",
    "countermeasure": "Countermeasure planned / in place",
    "accepted": "Risk accepted (recorded)",
    "sl-t": "Carried into the SL-T"
  };

  // Everything the report tells is derived once here, shared by both formats.
  function summarise(p) {
    var rt = RT();
    var tolerable = p.srs.tolerableRisk || "medium";
    var owners = p.zones.map(function (z) { return { kind: "Zone", o: z }; })
      .concat(p.conduits.map(function (c) { return { kind: "Conduit", o: c }; }));
    var threats = [];
    owners.forEach(function (row) {
      row.o.threats.forEach(function (t) {
        var risk = rt.threatRisk(t);
        var exceeds = risk ? rt.exceedsTolerable(risk, tolerable) : false;
        threats.push({
          ownerKind: row.kind, owner: row.o, t: t,
          risk: risk, exceeds: exceeds,
          residual: rt.residualRisk(t),
          disposition: rt.threatDisposition(row.o, t, tolerable)
        });
      });
    });
    var counts = { mitigated: 0, countermeasure: 0, accepted: 0, "sl-t": 0, none: 0 };
    threats.forEach(function (x) { if (x.exceeds) counts[x.disposition || "none"] += 1; });
    var bandRank = {}; (RULES().riskBands || []).forEach(function (b) { bandRank[b.id] = b.rank; });
    var worst = null, worstRank = -1;
    threats.forEach(function (x) { if (x.risk && (bandRank[x.risk] || 0) > worstRank) { worstRank = bandRank[x.risk] || 0; worst = x; } });
    var sltMax = {};
    FRS().forEach(function (f) {
      var m = null;
      owners.forEach(function (row) { var v = row.o.slTargetByFR[f.id]; if (v != null && (m === null || v > m)) m = v; });
      sltMax[f.id] = m;
    });
    return { tolerable: tolerable, owners: owners, threats: threats, dispositionCounts: counts, worst: worst, sltMax: sltMax, bandRank: bandRank };
  }

  /* ===================== WORD ===================== */

  function buildWordDoc(p, opts) {
    opts = opts || {};
    var docx = window.docx;
    var S = summarise(p);
    var eng = p.engagement || {};
    var rt = RT();

    // ---- primitives (this app's copy of the Assessments idiom) ----
    function run(text, o) {
      o = o || {};
      return new docx.TextRun({ text: String(text == null ? "" : text), bold: !!o.bold, italics: !!o.italics, color: o.color || COLOR.text, size: o.size || 21, font: o.font || FONT });
    }
    function para(children, o) {
      o = o || {};
      return new docx.Paragraph({ children: children, spacing: o.spacing || { after: 120 }, alignment: o.alignment });
    }
    function body(text, o) { o = o || {}; return para([run(text, o)], o); }
    function heading(text, level, o) {
      o = o || {};
      return new docx.Paragraph({
        heading: level,
        spacing: { before: o.before != null ? o.before : 280, after: 120 },
        children: [run(text, { bold: true, color: o.color || COLOR.blueDark, size: o.size || (level === docx.HeadingLevel.HEADING_1 ? 30 : 24) })]
      });
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
    function pageBreak() { return new docx.Paragraph({ children: [new docx.PageBreak()] }); }

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
      var dispositioned = exceed.filter(function (x) { return x.disposition; }).length;
      if (opts.highLevelOnly) {
        var ranked = p.srs.highLevelAssets.filter(function (a) { return a.name; });
        var highPlus = ranked.filter(function (a) { var b2 = rt.riskFor(a.consequence, a.likelihood); return b2 === "high" || b2 === "very-high"; }).length;
        var promoted = p.zones.filter(function (z) { return z.fromHLA; }).length;
        out.push(sbTilesRow([
          { t: String(ranked.length), color: COLOR.navy, label: "systems ranked (§4.2)", fill: COLOR.subBg },
          { t: String(highPlus), color: highPlus ? COLOR.gap : COLOR.met, label: "ranked High or above", fill: highPlus ? COLOR.gapBg : COLOR.metBg },
          { t: bandStyle(S.tolerable).name, color: bandStyle(S.tolerable).text, label: "tolerable risk", fill: bandStyle(S.tolerable).fill, size: 32 },
          { t: String(promoted), color: COLOR.navy, label: "promoted to detailed tier", fill: COLOR.subBg }
        ]));
        out.push(body("Relative ranking of the systems in scope by consequence and likelihood against the house risk matrix. The full ranking table follows; systems in the upper bands are the candidates for detailed, per-system assessment.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
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
        var topRanked = p.srs.highLevelAssets.filter(function (a) { return a.name; }).slice().sort(function (a, b4) {
          return (S.bandRank[rt.riskFor(b4.consequence, b4.likelihood)] || 0) - (S.bandRank[rt.riskFor(a.consequence, a.likelihood)] || 0);
        }).slice(0, 3);
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
        { t: dispositioned + "/" + exceed.length, color: dispositioned === exceed.length ? COLOR.met : COLOR.gap, label: "dispositioned", fill: dispositioned === exceed.length ? COLOR.metBg : COLOR.gapBg },
        { t: sltWorst == null ? "—" : "SL" + sltWorst, color: COLOR.navy, label: "highest SL-T set", fill: COLOR.subBg }
      ]));
      out.push(body("Unmitigated risk per zone and conduit (threat counts by band), against a tolerable risk of " + bandStyle(S.tolerable).name + ". Dispositions and residual positions are in the detailed register; the SL-T vector per zone follows with the consultant's justifications.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
      out.push(h2("Risk profile by zone and conduit"));
      var stacks = [];
      S.owners.forEach(function (row) {
        var o = row.o;
        var per = { "very-high": 0, "high": 0, "medium": 0, "low": 0 };
        S.threats.forEach(function (x) { if (x.owner === o && x.risk && per[x.risk] != null) per[x.risk] += 1; });
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
      // Focus cards: undispositioned above-tolerable first, then worst risks.
      var focus = S.threats.filter(function (x) { return x.exceeds && !x.disposition; })
        .concat(S.threats.filter(function (x) { return x.exceeds && x.disposition; })
          .sort(function (a, b6) { return (S.bandRank[b6.risk] || 0) - (S.bandRank[a.risk] || 0); }))
        .slice(0, 3);
      if (focus.length) {
        out.push(h2("Where to focus first"));
        focus.forEach(function (x, i) {
          out.push(sbFocusCard(i + 1, x.t.id + "  " + x.t.statement, x.owner.id + " · " + bandStyle(x.risk).name + (x.disposition ? "" : " · NO DISPOSITION")));
          out.push(sbSpacer());
        });
      }
      return out;
    }

    var titleLines = opts.highLevelOnly ? ["High-Level OT Cyber", "Risk Assessment"] : ["OT Cyber Risk", "Assessment"];
    var subLine = opts.highLevelOnly
      ? "IEC 62443-3-2 §4.2: relative system risk ranking"
      : "IEC 62443-3-2 Clause 4: zones, conduits and target security levels";
    var coverChildren = coverDesignB(titleLines, subLine);

    // ---- document control ----
    var children = [];
    children.push(heading("Document control", docx.HeadingLevel.HEADING_1, { before: 0 }));
    children.push(kvTable([
      ["Client / organisation", notSet(eng.client)],
      ["System under consideration", notSet(p.suc.name)],
      ["Consultant", notSet(eng.consultant)],
      ["Assessment date", notSet(eng.assessmentDate)],
      ["Document revision", notSet(eng.revision)],
      ["Confidentiality", notSet(eng.confidentiality)],
      ["Method", "IEC 62443-3-2 Clause 4 workflow; SolutionsPT house risk matrix and risk-to-SL mapping (shown with every suggestion; the consultant's per-FR SL-T and written justification are the deliverable)"],
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
      var on = Object.keys(o.flags || {}).filter(function (k) { return o.flags[k]; });
      return on.length ? " (" + on.join(", ").replace(/-/g, " ") + ")" : "";
    }
    var bs = p.basisOfAssessment || { interviews: [], documents: [], observations: [] };
    function basisSentence() {
      var bits = [];
      if (bs.interviews.length) bits.push(bs.interviews.length + " interview" + (bs.interviews.length > 1 ? "s" : "") + " with operations, engineering and management staff");
      if (bs.documents.length) bits.push(bs.documents.length + " document" + (bs.documents.length > 1 ? "s" : "") + " reviewed");
      if (bs.observations.length) bits.push(bs.observations.length + " system" + (bs.observations.length > 1 ? "s" : "") + " and items of evidence observed directly");
      if (!bits.length) return null;
      return "The findings rest on the evidence gathered during the engagement: " + bits.join(", ") + ". All of it is recorded in the Basis of assessment section, so every judgement in this report can be traced back to its source.";
    }
    function stakesKids() {
      var out = [];
      if (p.srs.essentialFunctions || p.srs.worstCase) {
        out.push(body("The operational stakes are recorded in the security requirements" + (p.srs.essentialFunctions ? ": the essential functions this assessment protects are " + p.srs.essentialFunctions.replace(/\.\s*$/, "") : "") + (p.srs.worstCase ? (p.srs.essentialFunctions ? ", and the" : ": the") + " credible worst-case consequence considered is " + p.srs.worstCase.replace(/\.\s*$/, "") : "") + ". That is what “risk” means throughout this document: the likelihood and severity of those outcomes, not the loss of data or an IT service."));
      }
      if (p.srs.adversaryClass) {
        out.push(body("Protection has been judged against an assumed adversary of SL" + p.srs.adversaryClass + " grade on the 62443 threat scale, meaning " + ({1: "casual or accidental misuse", 2: "an intentional attacker using simple means and low resources", 3: "a sophisticated attacker using specific skills and moderate resources", 4: "a sophisticated, well-resourced and motivated attacker (state-grade)"}[p.srs.adversaryClass] || "see the requirements section") + ". Choosing the adversary class is a business decision: it sets how strong the eventual countermeasures must be."));
      }
      return out;
    }
    if (opts.highLevelOnly) {
      children.push(h2("Why this assessment"));
      children.push(body("Operational technology is now as connected as enterprise IT, and it attracts the same attackers. The difference is that a cyber incident in a plant environment puts production, equipment and potentially people at risk rather than data alone. Before committing to detailed security engineering, " + notSet(eng.client) + " needs to know where across " + (p.suc.name || "the systems in scope") + " that risk actually sits, and which systems justify the cost of a full, per-system assessment. That triage question is what this high-level assessment answers."));
      children = children.concat(stakesKids());
      children.push(h2("What this report is"));
      children.push(body("This document is the record of the first tier of an IEC 62443-3-2 security risk assessment, the standard's §4.2 initial system risk assessment" + (eng.assessmentDate ? ", carried out " + eng.assessmentDate : "") + ". Each system in scope has been ranked for relative cyber risk: the consultant judged the consequence of its compromise and the likelihood of that compromise, and combined the two through the organisation's risk criteria into a risk band, compared against the tolerable risk of " + tolName + ". The ranking is deliberately comparative. Its job is to put the systems in a defensible priority order, not to measure absolute risk, and this tier sets no security targets. The “Risk at a glance” page gives the one-page picture; the ranking table carries the judgements and their notes."));
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
            ? "The systems ranked High or above (" + highPlus.map(function (a) { return a.name; }).join(", ") + ") are the candidates for detailed, per-system assessment" + (promoted ? "; " + promoted + " of the ranked systems " + (promoted === 1 ? "has" : "have") + " already been taken into the detailed tier" : "") + "."
            : "No system ranks High or above; on this evidence, proceeding to detailed assessment is at the organisation's discretion.")));
      } else {
        children.push(body("No systems have been ranked yet; the ranking table below is the deliverable of this tier once populated."));
      }
      children.push(h2("What happens next"));
      children.push(body("For each system taken forward, the detailed tier of the assessment partitions it into security zones and conduits, registers the credible threats, decides the treatment of everything above the tolerable risk, and sets the target security levels that scope the engineering work. Systems ranked below the threshold stay on the record here and should be re-ranked when their connectivity, criticality or the threat landscape changes materially."));
    } else {
      var exceed = S.threats.filter(function (x) { return x.exceeds; });
      children.push(h2("Why this assessment"));
      children.push(body("Operational technology is now as connected as enterprise IT, and it attracts the same attackers. The difference is that a cyber incident in a plant environment puts production, equipment and potentially people at risk rather than data alone. Regulation, insurers and good engineering practice increasingly expect an asset owner to be able to show where that risk sits, that anything above the organisation's appetite has been consciously dealt with, and that the level of protection being engineered is proportionate to it. " + notSet(eng.client) + " commissioned this assessment of " + (p.suc.name || "the system under consideration") + (eng.assessmentDate ? " (" + eng.assessmentDate + ")" : "") + " to establish exactly that, on evidence rather than assumption."));
      children = children.concat(stakesKids());
      children.push(h2("What this report is"));
      children.push(body("This document is the record and decision instrument of a security risk assessment following IEC 62443-3-2, the international standard for assessing cyber risk in industrial automation and control systems. Its method, in plain terms: the systems in scope were first ranked for relative risk (§4.2, " + ranked.length + " systems); the system under consideration was then partitioned into " + p.zones.length + " security zones and " + p.conduits.length + " conduits. A zone groups assets that share security requirements, and a conduit is the communication path between zones; the partitioning is itself a security measure, because it contains an incident to the zone it starts in. For each zone and conduit the credible threats were registered and each was judged for likelihood and impact against the organisation's stated tolerable risk of " + tolName + "; everything above that line requires a recorded treatment decision. The result is a target security level (SL-T) for every zone and conduit, which is the level of protection the system must be engineered and maintained to sustain."));
      children.push(body("Three artefacts leave this engagement together: this document, the readable record and the basis for management decisions; a companion Excel workbook carrying the same registers as a living tracker for the engineering team; and a machine-readable risk-context export that scopes the follow-on IEC 62443-3-3 assessment, where actual security capability is measured against the targets set here. The “Risk at a glance” page after this summary gives the one-page picture; the registers behind it carry the full evidence trail."));
      var bSent = basisSentence();
      if (bSent) children.push(body(bSent));
      children.push(h2("What we found"));
      // Where the risk sits.
      var hottest = null, hotCount = 0;
      S.owners.forEach(function (row) {
        var n2 = S.threats.filter(function (x) { return x.owner === row.o && x.exceeds; }).length;
        if (n2 > hotCount) { hotCount = n2; hottest = row; }
      });
      var findRuns = [
        run(S.threats.length + " threats were registered; "),
        run(String(exceed.length), { bold: true, color: exceed.length ? COLOR.gap : COLOR.met }),
        run(" exceed the tolerable risk of " + tolName + " before treatment.")
      ];
      if (hottest && hotCount > 1) {
        findRuns.push(run(" The exposure concentrates in " + hottest.o.id + (hottest.o.name ? " " + hottest.o.name : "") + flagsPhrase(hottest.o) + ", which carries " + hotCount + " of them."));
      }
      if (S.worst) {
        findRuns.push(run(" The single highest unmitigated risk is "));
        findRuns.push(run(bandStyle(S.worst.risk).name, { bold: true, color: bandStyle(S.worst.risk).text }));
        findRuns.push(run(": " + S.worst.t.statement + " (" + S.worst.owner.id + (S.worst.owner.name ? " " + S.worst.owner.name : "") + ")."));
      }
      children.push(para(findRuns));
      // The treatment position.
      if (exceed.length) {
        var c = S.dispositionCounts;
        var cmEx = 0, cmPl = 0;
        S.owners.forEach(function (row) { (row.o.countermeasures || []).forEach(function (m) { if (m.existing) cmEx++; else cmPl++; }); });
        var accepted = exceed.filter(function (x) { return x.disposition === "accepted"; });
        var undisp = exceed.filter(function (x) { return !x.disposition; });
        children.push(body("Of the above-tolerable threats, " + c.mitigated + " are mitigated by controls that bring the residual risk within tolerance, " + c.countermeasure + " are covered by countermeasures (" + cmEx + " existing controls and " + cmPl + " planned across the registers), " + c["sl-t"] + " are carried into the target security level as the treatment plan, and " + c.accepted + " formally accepted by the asset owner."));
        if (accepted.length) {
          children.push(body((accepted.length > 1 ? "Accepted risks: " : "Accepted risk ") + accepted.map(function (x) { return x.t.id + " (" + x.owner.id + "): " + x.t.statement; }).join("; ") + ". The acceptance rationale is recorded against the threat in the register and should be revisited at the next assessment."));
        }
        if (undisp.length) {
          children.push(body(undisp.length + " above-tolerable threat" + (undisp.length > 1 ? "s have" : " has") + " no disposition yet and need" + (undisp.length > 1 ? "" : "s") + " a decision: " + undisp.map(function (x) { return x.t.id + " (" + x.owner.id + ")"; }).join(", ") + ".", { bold: true, color: COLOR.gap }));
        }
      } else if (S.threats.length) {
        children.push(body("No registered threat exceeds the tolerable risk of " + tolName + "; no treatment was required beyond the controls already reflected in the likelihood and impact judgements."));
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
      children.push(body("The output of the assessment is a target security level for every zone and conduit, with one target per foundational requirement. Worst case across the system: " + sltBits + (overallMax != null && drivers.length ? "; the SL" + overallMax + " ceiling is set by " + (drivers.length > 3 ? drivers.slice(0, 3).join(", ") + " and " + (drivers.length - 3) + " more" : drivers.join(", ")) : "") + ". These targets, together with the consultant's written justifications in the SL-T section, scope the ISA/IEC 62443-3-3 capability assessment, which this report's risk-context export feeds directly: the 3-3 work measures what the system can actually withstand today against what this assessment says it must withstand, and the gap between the two becomes the security improvement programme."));
      children.push(body("This assessment is a snapshot. It should be revisited when the system, its connectivity or the threat landscape changes materially, after any security-relevant incident, and periodically in any case. The registers in the companion workbook are structured so that the next assessment starts from this one rather than from scratch."));
    }
    if (p.approval.approved) {
      children.push(body("The asset owner, " + p.approval.name + " (" + p.approval.role + "), signed off the tolerable risk and this outcome on " + p.approval.date + ": “" + p.approval.statement + "”", { italics: true }));
    } else {
      children.push(body("The tolerable risk and assessment outcome have not yet been signed off by the asset owner.", { color: COLOR.gap, bold: true }));
    }
    children.push(body("Consultant note: tailor this summary before issue. Add the business context and engagement drivers, confirm the wording of any risk acceptances with the asset owner, and set out the agreed next steps. Delete this note.", { color: COLOR.note, italics: true }));
    children.push(pageBreak());

    // ---- the scorecard page ----
    children = children.concat(scorecardPage());
    children.push(pageBreak());

    // ---- SuC & SRS ----
    children.push(heading("System under consideration and requirements", docx.HeadingLevel.HEADING_1, { before: 0 }));
    if (p.suc.description) children.push(body(p.suc.description));
    if (p.suc.scopeStatement) children.push(para([run("Scope: ", { bold: true }), run(p.suc.scopeStatement)]));
    if (p.srs.essentialFunctions) children.push(para([run("Essential functions: ", { bold: true }), run(p.srs.essentialFunctions)]));
    if (p.srs.worstCase) children.push(para([run("Worst-case consequence: ", { bold: true }), run(p.srs.worstCase)]));
    children.push(para([run("Tolerable risk: ", { bold: true }), run(bandStyle(S.tolerable).name, { bold: true, color: bandStyle(S.tolerable).text }), run("   Assumed adversary: " + (p.srs.adversaryClass ? "SL" + p.srs.adversaryClass + "-grade" : "(not set)"))]));
    [["Operating-environment assumptions", p.suc.assumptions],
     ["Known or presumed threats", p.srs.knownThreats],
     ["Mandatory security functions", p.srs.mandatorySecurityFunctions],
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

    // ---- §4.2 ranking ----
    if (ranked.length) {
      children.push(h1("High-level risk ranking (§4.2)"));
      children.push(body("Systems ranked by consequence and likelihood against the house risk matrix" + (p.srs.clientMatrix ? " (client matrix noted: " + (p.srs.clientMatrixNote || "in use") + ")" : "") + ". Systems promoted into the detailed tier are marked."));
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
          textCell(cap(a.consequence || "—"), rw[2]),
          textCell(cap(a.likelihood || "—"), rw[3]),
          bandCell(band, rw[4]),
          textCell(a.note || "", rw[5])
        ] }));
      });
      children.push(fixedTable(rows, rw));
    }

    if (!opts.highLevelOnly) {
      // ---- zones & conduits + threat registers ----
      children.push(h1("Zones, conduits and the detailed risk assessment"));
      children.push(body("Each zone and conduit below lists its registered threats with the consultant's likelihood × impact judgement against the house matrix, the comparison to tolerable risk, and the recorded disposition. Countermeasures marked “existing” are controls already in place; the rest are planned remediations."));
      S.owners.forEach(function (row) {
        var o = row.o;
        children.push(h2(o.id + ": " + (o.name || "(unnamed " + row.kind.toLowerCase() + ")") + (row.kind === "Conduit" ? "  (" + (o.fromZone || "?") + " → " + (o.toZone || "external") + ")" : "")));
        var meta = [];
        if (o.fn) meta.push("Function: " + o.fn);
        if (o.description) meta.push(o.description);
        if (row.kind === "Conduit" && o.channels && o.channels.length) meta.push("Channels: " + o.channels.join(", "));
        var flagsOn = Object.keys(o.flags || {}).filter(function (k) { return o.flags[k]; });
        if (flagsOn.length) meta.push("Exposure: " + flagsOn.join(", "));
        if (meta.length) children.push(body(meta.join("  ·  "), { color: COLOR.muted }));
        if (o.assets && o.assets.length) children.push(body("Assets: " + o.assets.map(function (a) { return a.name + (a.type ? " (" + a.type + ")" : ""); }).join("; "), { color: COLOR.muted }));
        if (o.vulnerabilities && o.vulnerabilities.length) {
          children.push(body("Vulnerabilities: " + o.vulnerabilities.map(function (v) { return v.description; }).join(" · "), { color: COLOR.muted }));
        }
        var oThreats = S.threats.filter(function (x) { return x.owner === o; });
        if (!oThreats.length) {
          children.push(body("No threats registered.", { color: COLOR.muted, italics: true }));
        } else {
          var tw = [3400, 1150, 1150, 1100, 2200];
          var trows = [headerRow(["Threat", "L × I", "Risk", "Residual", "Disposition"], tw)];
          oThreats.forEach(function (x) {
            var disp = x.disposition ? DISPOSITION_LABEL[x.disposition] : (x.exceeds ? "NO DISPOSITION: needs a decision" : "Within tolerable risk");
            trows.push(new docx.TableRow({ children: [
              textCell(x.t.id + "  " + x.t.statement + (x.t.source ? "  (" + x.t.source + ")" : "") + (x.t.affectedFR.length ? "  [" + x.t.affectedFR.join(", ") + "]" : ""), tw[0]),
              textCell(cap(x.t.likelihood || "—") + " × " + cap(x.t.impact || "—"), tw[1]),
              bandCell(x.risk, tw[2]),
              x.residual ? bandCell(x.residual, tw[3]) : textCell("—", tw[3]),
              textCell(disp, tw[4], x.exceeds && !x.disposition ? { bold: true, color: COLOR.gap } : {})
            ] }));
          });
          children.push(fixedTable(trows, tw));
          oThreats.forEach(function (x) {
            if ((x.t.acceptance || "").trim()) {
              children.push(body(x.t.id + " risk acceptance: " + x.t.acceptance, { italics: true }));
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
      children.push(body("The SL-T is a vector: one target per foundational requirement, set by the consultant from the risk picture (the tool's suggestion trace is advisory). The written justification is part of the deliverable. Capability against these targets is assessed in the 62443-3-3 programme, which this assessment's risk-context export scopes."));
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
          children.push(h2("Justification for " + o.id + (o.name ? " " + o.name : "")));
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
      children.push(body("The tolerable risk (§4.3.6) and the assessment outcome have not yet been signed off by the asset owner.", { bold: true, color: COLOR.gap }));
    }
    children.push(h1("Method and limitations"));
    children.push(body("This assessment follows the IEC 62443-3-2 Clause 4 workflow. The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house defaults: the standard prescribes none and requires the organisation's own risk criteria, so a client corporate matrix takes precedence where one exists. Every SL suggestion in the tool carries a full rule trace, and the consultant's per-FR SL-T with written justification is the deliverable, not the suggestion."));
    children.push(body("Likelihood and impact judgements reflect the evidence recorded in the basis of assessment at the time of the engagement. The assessment is indicative and does not verify security capability; capability against the SL-T targets is established through the ISA/IEC 62443-3-3 assessment this report's risk-context export feeds."));

    var PO = (docx.PageOrientation) || { PORTRAIT: "portrait" };
    var A4_W = 11906, A4_H = 16838;
    return new docx.Document({
      creator: eng.consultant || "OT Cyber Risk Assessment Tool",
      title: (opts.highLevelOnly ? "High-Level OT Cyber Risk Assessment" : "OT Cyber Risk Assessment") + " - " + (p.suc.name || "SuC"),
      description: subLine,
      sections: [
        { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren },
        { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } }, headers: brandHeaders(), footers: brandFootersDoc(), children: children }
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
     ["Above tolerable", String(S.threats.filter(function (x) { return x.exceeds; }).length)],
     ["Sign-off", p.approval.approved ? (p.approval.name + " (" + p.approval.role + "), " + p.approval.date) : "Not signed off"],
     ["Method note", "House risk matrix / risk-to-SL mapping (62443-3-2 prescribes none); consultant SL-T + justification are the deliverable"]
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
      var r = rk.addRow([a.name, a.functionLocation || "", cap(a.consequence || ""), cap(a.likelihood || ""), "", promotedFrom[a.id] || "", a.note || ""]);
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
    tr.addRow(["Zone/Conduit", "ID", "Threat statement", "Source", "Affected FRs", "Likelihood", "Impact", "Risk", "Exceeds?", "Disposition", "Residual", "Acceptance / notes", "Status", "Owner", "Target date", "Progress notes"]);
    styleHeader(tr, 1, 16);
    S.threats.forEach(function (x) {
      var r = tr.addRow([
        x.owner.id + (x.owner.name ? " " + x.owner.name : ""), x.t.id, x.t.statement, x.t.source || "",
        x.t.affectedFR.join(", "), cap(x.t.likelihood || ""), cap(x.t.impact || ""), "", x.exceeds ? "YES" : "no",
        x.disposition ? DISPOSITION_LABEL[x.disposition] : (x.exceeds ? "NO DISPOSITION" : "Within tolerable"),
        "", x.t.acceptance || "", x.disposition ? "Dispositioned" : (x.exceeds ? "Open" : "Monitor"), "", "", ""
      ]);
      bandFillCell(r.getCell(8), x.risk);
      if (x.residual) bandFillCell(r.getCell(11), x.residual);
      if (x.exceeds && !x.disposition) r.getCell(10).font = { bold: true, color: { argb: argb(COLOR.gap) } };
      r.getCell(13).dataValidation = { type: "list", allowBlank: true, formulae: ['"Open,In progress,Dispositioned,Monitor,Closed"'] };
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
        Object.keys(z.flags || {}).filter(function (k) { return z.flags[k]; }).join(", "),
        (z.assets || []).map(function (a) { return a.name + (a.type ? " (" + a.type + ")" : ""); }).join("; "),
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
    var worst = sl.addRow(["WORST CASE"].concat(frs.map(function (f) { return S.sltMax[f.id] == null ? "—" : "SL" + S.sltMax[f.id]; })).concat([""]));
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
    downloadWord: downloadWord,
    downloadExcel: downloadExcel
  };
})();
