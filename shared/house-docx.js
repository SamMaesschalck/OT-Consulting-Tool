/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* house-docx.js
 *
 * App.HouseDocx: the house Word template, and the writer that prints a document
 * tool project (contracts/document.json, in its memory form) through it. The
 * canonical copy is shared/house-docx.js; tools/sync-shared.ps1 copies it into
 * modules/documents/js/. See docs/document-tool-design.md 4.3.
 *
 * THE TEMPLATE HALF IS A COPY. The cover, header, footer, styles, document
 * control table, page setup, Draft watermark and Final lock are the assessment
 * exporter's own functions (modules/assessments/js/export-docx.js), copied and
 * changed only where an engagement was read and a document has to be told
 * instead. They must write the same XML: a document made here has to look like
 * an assessment report, and modules/assessments/scripts/test-house-parity.html
 * builds one of each from the same values and compares the parts. Change a
 * template function here and that page says whether the two still agree. The
 * assessment and risk exporters do not load this file.
 *
 * The app version and the product name are never passed in and never printed.
 *
 * Needs window.docx and App.Assets (logo, cover art). A document with a kept
 * object, or a picture that is not a PNG, also needs App.DocxGraft, which puts
 * the original XML and the right media types into the packed file. Nothing here
 * calls a module's code, and bytes are read with Blob.arrayBuffer(), never
 * fetch (the tool's Content-Security-Policy refuses it).
 *
 * The one call a module makes:
 *   App.HouseDocx.buildDocument(project, { issueStatus: "draft" | "final", issueCheck })
 *     resolves { blob, fitted }, or { placeholders } for a check, and rejects
 *     with the refusal message when a Final still has something printed red.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  // ---- colours, font, borders (export-docx.js 43-82) ----------------------

  function hex(c) { return c.replace("#", "").toUpperCase(); }
  var COLOR = {
    blueDark: hex("#0A3D62"),
    blue:     hex("#0F5FA6"),
    text:     hex("#1A2533"),
    muted:    hex("#5A6B7B"),
    soft:     hex("#8595A5"),
    met:      hex("#2E7D52"),
    near:     hex("#C28A1E"),
    gap:      hex("#B23A33"),
    severe:   hex("#7A0E1A"),
    above:    hex("#2E6FA6"),
    metBg:    hex("#E5F1EA"),
    nearBg:   hex("#F7EFD9"),
    gapBg:    hex("#F3DEDC"),
    severeBg: hex("#EBD2D3"),
    aboveBg:  hex("#DCE9F3"),
    naBg:     hex("#ECEFF2"),
    unknownSeg: hex("#94A0AD"),
    naSeg:      hex("#CBD5DE"),
    headBg:   hex("#173267"),
    subBg:    hex("#F4F7FA"),
    navy:     hex("#173267"),
    navyDeep: hex("#0F1C3F"),
    brandBlue:hex("#3399CC"),
    skyBlue:  hex("#7FC4E8"),
    lineSoft: hex("#E2E7EE"),
    // Consultant note / delete-before-issue text. A bright, unmistakable red,
    // deliberately distinct from the semantic "gap" red used for scores.
    note:     hex("#E00000")
  };
  var FONT = "Segoe UI";

  // Table borders. docx-js defaults every table to heavy single BLACK borders,
  // which is what made the report look unlike the design. Data tables use a
  // thin light-grey rule (the design's #E2E7EE); layout tables use none.
  function _bd(style, color) { return { style: style, size: style === "none" ? 0 : 4, color: color }; }
  var TBL_LIGHT = { top: _bd("single", "E2E7EE"), bottom: _bd("single", "E2E7EE"), left: _bd("single", "E2E7EE"), right: _bd("single", "E2E7EE"), insideHorizontal: _bd("single", "E2E7EE"), insideVertical: _bd("single", "E2E7EE") };
  var TBL_WHITE = { top: _bd("single","FFFFFF"), bottom: _bd("single","FFFFFF"), left: _bd("single","FFFFFF"), right: _bd("single","FFFFFF"), insideHorizontal: _bd("single","FFFFFF"), insideVertical: _bd("single","FFFFFF") };
  var TBL_NONE = { top: _bd("none", "auto"), bottom: _bd("none", "auto"), left: _bd("none", "auto"), right: _bd("none", "auto"), insideHorizontal: _bd("none", "auto"), insideVertical: _bd("none", "auto") };

  // The fixed company wording, once: the footer's left cell and the two lines
  // that close the cover.
  var COMPANY = {
    footerLeft: "Confidential · © SolutionsPT Ltd",
    footerOwner: "© SolutionsPT Ltd",
    addressLine: "SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX",
    contactLine: "Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com"
  };

  // The text area in dxa and in px at 96 dpi (15 dxa to the px), portrait at
  // 1in margins and landscape at 0.5in: what a table is scaled to and what a
  // picture or a kept object is clamped to.
  var PORTRAIT_DXA = 9026, LANDSCAPE_DXA = 15398;
  var PORTRAIT_PX = 601, LANDSCAPE_PX = 1026;
  // The tallest a picture or an in-line kept object may be, in px. Word cannot
  // split an in-line picture, so one taller than the text area ran over the
  // footer and off the paper. The text area is 930 px high in portrait; in
  // landscape the logo header reaches below the 0.5in margin and the footer
  // above it, which leaves about 640. Each limit leaves room for the
  // paragraph's own spacing and a caption kept on the same page.
  var PORTRAIT_MAX_H_PX = 860, LANDSCAPE_MAX_H_PX = 570;
  // In a table cell: less the cell's own spacing and a header row repeated at
  // the top of the page.
  var CELL_H_LESS_PX = 60;

  // ---- text Word will accept ----------------------------------------------
  //
  // XML 1.0 has no way to write most control characters, U+FFFE, U+FFFF or
  // half of a surrogate pair, and Word refuses a file that holds one. They
  // arrive by paste (a vertical tab is what Word puts on the clipboard for a
  // manual line break) and in text copied out of a PDF. Every string that is
  // written as text or as an attribute goes through here: run() and txt()
  // call it, so does a link's address and a bookmark's name. A vertical tab
  // becomes `vt` (a space unless the caller turns line feeds into breaks);
  // the rest are left out. A clean string comes back as it went in.
  var XML_FORBIDDEN = /[\u0000-\u0008\u000C\u000E-\u001F￾￿]/g;
  var SURROGATES = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g;
  function xmlSafe(text, vt) {
    var s = String(text == null ? "" : text);
    if (!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF￾￿]/.test(s)) return s;
    return s.replace(/\u000B/g, vt == null ? " " : vt).replace(XML_FORBIDDEN, "")
      .replace(SURROGATES, function (m) { return m.length === 2 ? m : ""; });
  }

  // ---- doc primitives (export-docx.js 215-264) ----------------------------

  // The assessment's run, which knows bold, italics, colour, size and font.
  // The document tool's inline formats are passed only when given, so a run
  // made without them is written exactly as the assessment writes it.
  // opts.tabs: a tab in the text becomes a Word tab; opts.break: line breaks
  // before the text. The text is made safe for XML here (xmlSafe), which
  // changes nothing in a string with no forbidden character.
  function run(text, opts) {
    opts = opts || {};
    var s = xmlSafe(text);
    var o = {
      text: s,
      bold: opts.bold || false,
      italics: opts.italics || false,
      color: opts.color,
      size: opts.size,
      font: opts.font
    };
    if (opts.underline) o.underline = opts.underline;
    if (opts.strike) o.strike = true;
    if (opts.superScript) o.superScript = true;
    if (opts.subScript) o.subScript = true;
    if (opts.shading) o.shading = opts.shading;
    if (opts.break) o.break = opts.break;
    if (opts.tabs && s.indexOf("\t") !== -1 && window.docx.Tab) {
      delete o.text;
      o.children = [];
      s.split("\t").forEach(function (piece, i) {
        if (i > 0) o.children.push(new window.docx.Tab());
        if (piece !== "") o.children.push(piece);
      });
    }
    var r = new window.docx.TextRun(o);
    r.__text = s;
    return r;
  }

  // The __tags are set here because a docx Paragraph is write-only once the
  // library has made it: its level and text cannot be read back off the object.
  function body(text, opts) {
    opts = opts || {};
    var runs = Array.isArray(text) ? text : [run(text, opts)];
    var o = {
      style: opts.style || "BodyText",
      children: runs,
      spacing: opts.spacing
    };
    if (opts.alignment) o.alignment = opts.alignment;
    if (opts.numbering) o.numbering = opts.numbering;
    if (opts.indent) o.indent = opts.indent;
    var p = new window.docx.Paragraph(o);
    p.__isBody = true;
    p.__text = Array.isArray(text) ? runs.map(function (r) { return (r && r.__text) || ""; }).join("") : String(text == null ? "" : text);
    return p;
  }

  // A heading takes its text, as in the assessment exporter, or a list of
  // runs already made (a heading in a document can hold a link, a footnote
  // or red text).
  function headingKids(text) { return Array.isArray(text) ? text : [run(text)]; }
  function headingText(text) {
    return Array.isArray(text) ? text.map(function (r) { return (r && r.__text) || ""; }).join("") : text;
  }
  function h1(text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_1,
      children: headingKids(text),
      pageBreakBefore: false
    });
    p.__headingText = headingText(text); p.__headingLevel = 1;
    return p;
  }
  function h2(text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_2,
      children: headingKids(text)
    });
    p.__headingText = headingText(text); p.__headingLevel = 2;
    return p;
  }
  function h3(text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_3,
      children: headingKids(text)
    });
    p.__headingText = headingText(text); p.__headingLevel = 3;
    return p;
  }
  // A numbered heading (the assessment's h1n, for any level): the number in
  // brand blue, an em space, then the text. The number is typed, not Word
  // numbering, and is carried apart from the text so the two can be told apart.
  function hn(level, num, text) {
    var HL = window.docx.HeadingLevel;
    var p = new window.docx.Paragraph({
      heading: level === 3 ? HL.HEADING_3 : (level === 2 ? HL.HEADING_2 : HL.HEADING_1),
      children: [ run(num + " ", { color: COLOR.brandBlue, bold: true }) ].concat(headingKids(text))
    });
    p.__headingText = headingText(text); p.__headingLevel = level === 3 ? 3 : (level === 2 ? 2 : 1); p.__headingNum = num;
    return p;
  }

  // A bare paragraph carrying a page break, so the next content starts on a
  // fresh page.
  function pageBreakPara() {
    return new window.docx.Paragraph({ children: [ new window.docx.PageBreak() ] });
  }
  function caption(text) {
    return new window.docx.Paragraph({
      style: "Caption",
      children: [run(text, { italics: true })]
    });
  }

  // ---- what is still to be written (export-docx.js 369-405) ---------------
  //
  // Everything the document prints red goes through placeholderPara or
  // noteRun, and both tag what they make with __placeholder = { text, where }.
  // For a document `where` is one of two things:
  //   { kind: "block", blockId }    a prompt block, red text in a block, or a
  //                                 picture or drawing that could not be restored
  //   { kind: "info", field }       a document information field (the title)
  // assemble collects the tags that are in the finished document, and that
  // list is what an issue check returns. The check is the build.
  function tagPlaceholder(node, text, where) {
    node.__placeholder = { text: String(text == null ? "" : text), where: where || { kind: "unknown" } };
    return node;
  }
  function placeholderPara(text, where) {
    return tagPlaceholder(new window.docx.Paragraph({
      style: "PlaceholderText",
      children: [run(text, { bold: true })]
    }), text, where);
  }
  // The same prompt as a run inside a paragraph that carries other text.
  function noteRun(text, where, opts) {
    var o = Object.assign({ color: COLOR.note }, opts || {});
    return tagPlaceholder(run(text, o), text, where);
  }

  // Walks what the document will contain, down through tables and cells (the
  // library keeps every child on `.root`), and returns the prompts that print.
  function collectPlaceholders(nodes, out) {
    (nodes || []).forEach(function walk(n) {
      if (!n || typeof n !== "object") return;
      if (n.__placeholder) out.push(n.__placeholder);
      if (Array.isArray(n.root)) n.root.forEach(walk);
    });
    return out;
  }

  // ---- draft and final (export-docx.js 414-512) ---------------------------
  //
  // opts.issueStatus is "final" or anything else (a draft). A draft carries a
  // light diagonal DRAFT watermark on every page and Status Draft in document
  // control. A final carries Status Final, opens read-only (document
  // protection with no password, so the author can still lift it) and is
  // marked as final; it is refused outright while any prompt would print.
  function isFinal(opts) { return !!(opts && opts.issueStatus === "final"); }
  function statusLabel(opts) { return isFinal(opts) ? "Final" : "Draft"; }

  function importedXml(xml) {
    var IX = window.docx.ImportedXmlComponent;
    if (!IX || !IX.fromXmlString) return null;
    var c = IX.fromXmlString(xml);
    // fromXmlString wraps the element in a nameless root; the element is its
    // only child.
    return (c && !c.rootKey && c.root && c.root[0]) || c;
  }

  // Word's own watermark: a VML text path, anchored in a run, centred on the
  // page. Behind the text on body pages; in front, in white, on the cover,
  // whose full-page background would otherwise hide it.
  var watermarkSeq = 0;
  function watermarkRun(onCover) {
    watermarkSeq += 1;
    var rel = onCover ? "page" : "margin";
    var style = "position:absolute;margin-left:0;margin-top:0;width:440pt;height:146pt;rotation:315;" +
      "z-index:" + (onCover ? "251659264" : "-251655168") + ";" +
      "mso-position-horizontal:center;mso-position-horizontal-relative:" + rel + ";" +
      "mso-position-vertical:center;mso-position-vertical-relative:" + rel;
    return importedXml(
      '<w:r><w:rPr><w:noProof/></w:rPr><w:pict>' +
      '<v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">' +
      '<v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/>' +
      '<v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/><v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/>' +
      '<v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/>' +
      '<v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/></v:formulas>' +
      '<v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/>' +
      '<v:textpath on="t" fitshape="t"/><v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>' +
      '<o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype>' +
      '<v:shape id="DraftWatermark' + watermarkSeq + '" o:spid="_x0000_s' + (2048 + watermarkSeq) + '" type="#_x0000_t136" ' +
      'style="' + style + '" o:allowincell="f" fillcolor="' + (onCover ? "#FFFFFF" : "#B8C2CE") + '" stroked="f">' +
      '<v:fill opacity="' + (onCover ? ".35" : ".45") + '"/>' +
      '<v:textpath style="font-family:&quot;Segoe UI&quot;;font-size:1pt" string="DRAFT"/>' +
      '<w10:wrap anchorx="' + rel + '" anchory="' + rel + '"/></v:shape></w:pict></w:r>');
  }
  function isParagraph(n) { return n && n.rootKey === "w:p" && Array.isArray(n.root); }

  // Puts the watermark on every page of a draft: into the first paragraph of
  // each header (a header the document has not got is given one), and into
  // the cover's anchor paragraph. Runs before the Document is made, while the
  // headers are still plain option holders.
  function markDraft(sections) {
    var Header = window.docx.Header;
    var done = [];
    function tinyPara(kids) {
      return new window.docx.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: "exact" }, children: kids });
    }
    sections.forEach(function (s) {
      var cover = (s.children || []).filter(function (c) { return c && c.__coverAnchor; })[0];
      if (cover) {
        var cw = watermarkRun(true);
        if (cw && isParagraph(cover)) cover.root.push(cw);
        return;
      }
      if (!s.headers) {
        var hw = watermarkRun(false);
        if (hw) s.headers = { default: new Header({ children: [tinyPara([hw])] }) };
        return;
      }
      Object.keys(s.headers).forEach(function (k) {
        var hd = s.headers[k];
        if (!hd || !hd.options || done.indexOf(hd) !== -1) return;
        done.push(hd);
        var w = watermarkRun(false);
        if (!w) return;
        var kids = hd.options.children || [];
        var first = kids.filter(isParagraph)[0];
        if (first) first.root.push(w);
        else hd.options = Object.assign({}, hd.options, { children: kids.concat([tinyPara([w])]) });
      });
    });
  }

  // Read-only with no password (Word's "Restrict editing", which the author
  // can switch off) and marked as final. Both are written into the library's
  // own settings and custom-properties parts, so nothing is post-processed.
  // documentProtection must come before evenAndOddHeaders in settings.xml, or
  // Word reports the file as damaged.
  function lockAsFinal(doc) {
    var st = doc.Settings, cp = doc.CustomProperties;
    var prot = importedXml('<w:documentProtection w:edit="readOnly" w:enforcement="1"/>');
    if (st && Array.isArray(st.root) && prot) {
      var at = -1;
      st.root.forEach(function (c, i) {
        if (at === -1 && c && ["w:evenAndOddHeaders", "w:updateFields", "w:compat"].indexOf(c.rootKey) !== -1) at = i;
      });
      if (at === -1) st.root.push(prot); else st.root.splice(at, 0, prot);
    }
    if (cp && Array.isArray(cp.properties)) {
      var pid = cp.nextId++;
      var mark = importedXml('<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="' + pid +
        '" name="_MarkAsFinal"><vt:bool>true</vt:bool></property>');
      if (mark) cp.properties.push(mark);
    }
  }

  // In a check nothing is written, so no picture is read: a blank image stands
  // in for each (export-docx.js 532).
  var BLANK_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  function blankPng() {
    var bin = atob(BLANK_PNG), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }

  // ---- tables (export-docx.js 557-658) ------------------------------------

  function cell(content, opts) {
    opts = opts || {};
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    var WidthType = window.docx.WidthType;
    var children = Array.isArray(content) ? content : [content];
    if (children.length === 0) children = [body("")];
    return new TableCell({
      children: children.map(function (c) {
        if (typeof c === "string") return body(c, { style: opts.bold ? "BodyText" : "BodyText" });
        return c;
      }),
      shading: opts.fill ? { type: ShadingType.SOLID, color: opts.fill, fill: opts.fill } : undefined,
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      verticalAlign: opts.valign || "center"
    });
  }
  function headerCell(text, width) {
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    var WidthType = window.docx.WidthType;
    return new TableCell({
      children: [ new window.docx.Paragraph({
        style: "BodyText",
        children: [run(text, { bold: true, color: "FFFFFF" })]
      }) ],
      shading: { type: ShadingType.SOLID, color: COLOR.headBg, fill: COLOR.headBg },
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      verticalAlign: "center"
    });
  }

  function table(rows, opts) {
    var Table = window.docx.Table;
    var WidthType = window.docx.WidthType;
    return new Table({
      width: { size: (opts && opts.width) || 100, type: WidthType.PERCENTAGE },
      borders: (opts && opts.noBorders) ? TBL_NONE : TBL_LIGHT,
      rows: rows
    });
  }

  // Fixed-layout tables with explicit DXA column widths that sum to the
  // usable page width; without them Word autofits and the layout is cramped.
  //   1 inch = 1440 dxa.
  //   A4 portrait usable @ 1in margins = 11906 - 2*1440 = 9026 dxa.
  //   A4 landscape usable @ 0.5in margins = 16838 - 2*720 = 15398 dxa.
  function dxaW(n) {
    return { size: n, type: window.docx.WidthType.DXA };
  }
  // opts.columnSpan and opts.rowSpan are the document tool's: a cell an
  // imported table had merged. Passed only when above 1, so a plain cell is
  // written as the assessment writes it.
  function spanInto(o, opts) {
    if (opts.columnSpan > 1) o.columnSpan = opts.columnSpan;
    if (opts.rowSpan > 1) o.rowSpan = opts.rowSpan;
    return o;
  }
  function cellDxa(content, widthDxa, opts) {
    opts = opts || {};
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    var children = Array.isArray(content) ? content : [content];
    if (children.length === 0) children = [body("")];
    return new TableCell(spanInto({
      children: children.map(function (c) {
        if (typeof c === "string") return body(c);
        return c;
      }),
      shading: opts.fill ? { type: ShadingType.SOLID, color: opts.fill, fill: opts.fill } : undefined,
      width: dxaW(widthDxa),
      verticalAlign: opts.valign || "top"
    }, opts));
  }
  // `text` is the cell's text, or its paragraphs already made (a header cell
  // of a document can hold formatted text and more than one paragraph).
  function headerCellDxa(text, widthDxa, opts) {
    opts = opts || {};
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    return new TableCell(spanInto({
      children: Array.isArray(text) ? text : [ new window.docx.Paragraph({
        style: "BodyText",
        children: [run(text, { bold: true, color: "FFFFFF" })]
      }) ],
      shading: { type: ShadingType.SOLID, color: COLOR.headBg, fill: COLOR.headBg },
      width: dxaW(widthDxa),
      verticalAlign: "center"
    }, opts));
  }
  function fixedTable(rows, columnWidthsDxa, opts) {
    var Table = window.docx.Table;
    var TLT = (window.docx.TableLayoutType) || { FIXED: "fixed" };
    var total = columnWidthsDxa.reduce(function (a, b) { return a + b; }, 0);
    return new Table({
      width: { size: total, type: window.docx.WidthType.DXA },
      columnWidths: columnWidthsDxa,
      layout: TLT.FIXED,
      borders: (opts && opts.noBorders) ? TBL_NONE : TBL_LIGHT,
      rows: rows
    });
  }
  function buildHeaderRow(headers, widths) {
    var TableRow = window.docx.TableRow;
    var cells = headers.map(function (text, i) { return headerCellDxa(text, widths[i]); });
    return new TableRow({ children: cells, tableHeader: true });
  }

  // ---- brand logo (export-docx.js 739-775) --------------------------------
  //
  // The lockup is embedded as base64 in js/logo.js so the export can place it
  // without a network or file fetch. If that module is absent, every helper
  // here no-ops so a document is never refused for a missing logo.
  function logoAsset() {
    return (window.App && window.App.Assets && window.App.Assets.logo) || null;
  }
  function logoImageRun(targetWidthPx) {
    var logo = logoAsset();
    if (!logo) return null;
    var w = targetWidthPx;
    var hgt = Math.round(w / (logo.aspect || (logo.width / logo.height)));
    return new window.docx.ImageRun({
      data: logo.bytes(),
      transformation: { width: w, height: hgt }
    });
  }
  // Small right-aligned logo Header for the running page header.
  function brandHeaderObj() {
    var img = logoImageRun(150);
    if (!img) return null;
    return new window.docx.Header({
      children: [ new window.docx.Paragraph({
        alignment: window.docx.AlignmentType.RIGHT,
        spacing: { after: 80 },
        children: [img]
      }) ]
    });
  }
  // Logo on every page of a section. Returns a `headers` object or undefined.
  function brandHeaders() {
    var hd = brandHeaderObj();
    if (!hd) return undefined;
    return { default: hd };
  }

  // ---- styles (export-docx.js 2027-2061) ----------------------------------
  //
  // The assessment's styles with Heading 3 added. Nothing else differs, so
  // every style an assessment uses is the same here.
  function buildStyles() {
    return {
      default: {
        title: {
          run: { font: FONT, size: 44, bold: true, color: COLOR.navy },
          paragraph: { spacing: { before: 0, after: 200 } }
        },
        heading1: {
          run: { font: FONT, size: 32, bold: true, color: COLOR.navy },
          paragraph: { spacing: { before: 320, after: 140 }, keepNext: true }
        },
        heading2: {
          run: { font: FONT, size: 26, bold: true, color: COLOR.navy },
          paragraph: { spacing: { before: 240, after: 100 }, keepNext: true }
        },
        heading3: {
          run: { font: FONT, size: 24, bold: true, color: COLOR.navy },
          paragraph: { spacing: { before: 200, after: 80 }, keepNext: true }
        }
      },
      paragraphStyles: [
        {
          id: "BodyText", name: "Body Text", basedOn: "Normal", next: "BodyText", quickFormat: true,
          run: { font: FONT, size: 22, color: COLOR.text },
          paragraph: { spacing: { after: 120, line: 300 } }
        },
        {
          id: "Caption", name: "Caption", basedOn: "Normal", next: "BodyText", quickFormat: true,
          run: { font: FONT, size: 18, italics: true, color: COLOR.muted },
          paragraph: { spacing: { after: 120 } }
        },
        {
          id: "PlaceholderText", name: "Placeholder", basedOn: "Normal", next: "BodyText", quickFormat: true,
          run: { font: FONT, size: 22, bold: true, color: COLOR.note, italics: true },
          paragraph: { spacing: { after: 120 } }
        }
      ]
    };
  }

  // ---- cover and footer (export-docx.js 2581-2674) ------------------------

  // Split a title into up to two balanced lines for the cover.
  function splitTitleTwo(title) {
    var words = String(title || "Assessment").split(/\s+/);
    if (words.length < 2) return [String(title || "Assessment")];
    var best = 1, bestDiff = Infinity;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
      if (Math.abs(a - b) < bestDiff) { bestDiff = Math.abs(a - b); best = i; }
    }
    return [ words.slice(0, best).join(" "), words.slice(best).join(" ") ];
  }

  // The footer's left cell: the document's classification, then the company.
  // The assessment's footer always reads Confidential; a document can be
  // given another marking, and its footer must not contradict its cover and
  // its document control. With no classification, or Confidential, this is
  // COMPANY.footerLeft to the letter.
  function footerLeft(classification) {
    var c = xmlSafe(classification).replace(/\s+/g, " ").trim();
    return c ? c + " · " + COMPANY.footerOwner : COMPANY.footerLeft;
  }

  // The running footer: the classification and the company, the document's
  // own centre text, the page number.
  function brandFootersDoc(centreText, classification) {
    var AT = window.docx.AlignmentType, WT = window.docx.WidthType, PN = window.docx.PageNumber;
    function fc(par, w){ return new window.docx.TableCell({ width:{size:w,type:WT.PERCENTAGE}, borders: TBL_NONE, children:[par] }); }
    var L = new window.docx.Paragraph({ spacing:{before:0,after:0}, children:[ run(footerLeft(classification), {font:FONT, size:14, color:COLOR.soft}) ] });
    var M = new window.docx.Paragraph({ alignment: AT.CENTER, spacing:{before:0,after:0}, children:[ run(centreText, {font:FONT, size:14, color:COLOR.soft}) ] });
    var R = new window.docx.Paragraph({ alignment: AT.RIGHT, spacing:{before:0,after:0}, children:[ new window.docx.TextRun({ children:[ PN.CURRENT ], font:FONT, size:14, color:COLOR.soft }) ] });
    return { default: new window.docx.Footer({ children: [ new window.docx.Table({ width:{size:100,type:WT.PERCENTAGE}, borders: TBL_NONE, rows:[ new window.docx.TableRow({ children:[ fc(L,34), fc(M,46), fc(R,20) ] }) ] }) ] }) };
  }

  // The cover cannot grow past its page. The assessment's cover is one table
  // row whose closing strip is pushed down by a spacer paragraph of a fixed
  // height; its lines are short and known. A document's are typed, and one
  // wrapped line made that row taller than the page: Word split it, and the
  // address lines, the strip and the draft watermark's anchor went to a
  // second page with no background (seen in Word). So here the cover is two
  // rows of exact height that may not split: the title block in the first,
  // and the strip with the address lines set against the bottom of the
  // second. A strip that wraps grows upwards. The two heights together put
  // the last address line where the assessment's sits for a title of two
  // lines over a client and a site, so the two covers look the same.
  //   COVER_TOP_ROW      the first row's exact height
  //   COVER_FOOT_ROW     the second row's: room for a strip of twelve lines
  // Measured in Word: the last line sits on the bottom of the second row (a
  // bottom margin on that cell moves nothing), and a table of two such rows
  // starts a second page once the two heights pass about 16000 twips
  // together, so these leave some 1100 to spare.
  var COVER_TOP_ROW = 11000, COVER_FOOT_ROW = 3787;
  // The first row's cell margins are the assessment's cover cell's.
  var COVER_SIDE = 800, COVER_TOP_MARGIN = 760, COVER_TOP_FOOT = 560, COVER_TEXT_W = 11906 - 2 * COVER_SIDE;
  var STRIP_LABELS = { issue: "ISSUE   ", author: "        AUTHOR   ", classification: "        CLASSIFICATION   " };

  // What the strip prints: the date and the author only when there is one. A
  // new document has no author and an imported one no date, and the cover
  // must not print a label with nothing after it or a dot with nothing to
  // separate. With every value given these are the assessment's runs.
  function stripParts(c) {
    var parts = [[STRIP_LABELS.issue, (c.revision || "0.1") + (c.date ? "  ·  " + c.date : "")]];
    if (c.author) parts.push([STRIP_LABELS.author, c.author]);
    parts.push([STRIP_LABELS.classification, c.classification || "Confidential"]);
    return parts;
  }

  // The strip keeps each label with its value. As one run of words, a long
  // author or client could leave CLASSIFICATION at the end of a line and its
  // value at the start of the next (seen in Word). So each pair is a unit:
  //   - a pair that fits on a line has no-break spaces and no-break hyphens
  //     (U+00A0, U+2011) in place of its spaces and hyphens, so Word moves it
  //     to the next line whole when it does not fit what is left of a line;
  //   - a pair too long for a line starts a line of its own and wraps inside
  //     its value, the label held to the value's first word, and whatever
  //     follows starts the next line.
  // The spaces between pairs are ordinary spaces, so the pairs wrap there.
  // In the normal case the strip is on one line and looks as it did. The
  // screen's strip (render.js coverEl) wraps its pairs the same way.
  var NBSP = "\u00a0", NBHY = "\u2011";
  // A pair's width in twips, on the safe side (as coverRoom), and whether it
  // is short enough to be kept whole on one line.
  function stripPairW(label, value) { return label.length * 16 * 5.9 + xmlSafe(value).length * 19 * 5.4; }
  function stripWhole(p) { return stripPairW(p[0].trim() + "   ", p[1]) * 1.25 <= COVER_TEXT_W; }
  // The strip as it prints: [{ label, value, whole, breakBefore }], the
  // label's own spacing kept, with no-break spaces where it meets its value.
  function stripLayout(c) {
    var parts = stripParts(c), out = [];
    parts.forEach(function (p, i) {
      var whole = stripWhole(p), prevLong = i > 0 && !out[i - 1].whole;
      var breakBefore = i > 0 && (!whole || prevLong);
      var label = p[0].replace(/ +$/, function (m) { return m.replace(/ /g, NBSP); });
      if (breakBefore) label = label.replace(/^ +/, "");
      var value = whole ? xmlSafe(p[1]).replace(/ /g, NBSP).replace(/-/g, NBHY) : p[1];
      out.push({ label: label, value: value, whole: whole, breakBefore: breakBefore });
    });
    return out;
  }
  // How many lines the strip takes: whole pairs filled into lines, a long
  // pair on lines of its own. The width is cut by a tenth to stay safe.
  function stripLineCount(c) {
    var room = COVER_TEXT_W / 1.1, lines = 1, used = 0;
    stripLayout(c).forEach(function (p) {
      if (p.breakBefore) { lines++; used = 0; }
      if (!p.whole) {
        var w = stripPairW(p.label, p.value);
        lines += Math.max(1, Math.ceil(w / room)) - 1;
        used = room;
        return;
      }
      var w2 = stripPairW(used ? p.label : p.label.replace(/^ +/, ""), p.value);
      if (used && used + w2 > room) { lines++; used = stripPairW(p.label.replace(/^ +/, ""), p.value); }
      else used += w2;
    });
    return lines;
  }

  // Whether the cover's text fits its two rows: an estimate from the lengths
  // (Segoe UI runs at a little over half its size a character), on the safe
  // side. Text that does not fit is cut off at the row's edge in Word, so the
  // tool says so when it exports (export.js) and can say so before.
  // Takes cover()'s input and returns { fits, top, foot }.
  function coverRoom(c) {
    c = c || {};
    function lines(text, size, bold) {
      var w = xmlSafe(text).length * size * (bold ? 5.9 : 5.4);
      return Math.max(1, Math.ceil(w / COVER_TEXT_W));
    }
    function high(text, size, bold) { return lines(text, size, bold) * size * 13.6; }
    var titleLines = c.titleLines || splitTitleTwo(c.title), titleSize = c.titleSize || 52;
    // To the top of the title with a kicker of one line: measured in Word.
    var top = 3000 + high(c.kicker || "", 21, true);
    titleLines.forEach(function (ln) { top += high(ln, titleSize, true); });
    if (c.client) top += 240 + high(c.client, 30, false);
    if (c.site) top += high(c.site, 21, false);
    if (c.subLine) top += 150 + high(c.subLine, 20, true);
    var foot = stripLineCount(c) * 270 + 120 + 440;
    var topFits = top <= COVER_TOP_MARGIN + COVER_TOP_ROW - COVER_TOP_FOOT, footFits = foot <= COVER_FOOT_ROW;
    return { fits: topFits && footFits, top: topFits, foot: footFits };
  }

  // Full-bleed cover: a full-page background image (navy + OT hero + scrim)
  // behind brand-font text. The assessment's coverDesignB with its inputs
  // named: c = { kicker, titleLines, titleSize, client, site, subLine,
  // revision, date, author, classification }. Every paragraph is the
  // assessment's; what differs is listed above (two rows for one row and a
  // spacer, and the strip leaving out what is empty).
  function cover(c) {
    c = c || {};
    var titleLines = c.titleLines || splitTitleTwo(c.title);
    var titleSize = c.titleSize || 52;
    var TableRow = window.docx.TableRow, TableCell = window.docx.TableCell, ShadingType = window.docx.ShadingType;
    var HR = (window.docx.HeightRule) || { ATLEAST: "atLeast", EXACT: "exact" };
    var PAGE_W = 11906;
    var NB = { top:{style:"none",size:0,color:"auto"}, bottom:{style:"none",size:0,color:"auto"}, left:{style:"none",size:0,color:"auto"}, right:{style:"none",size:0,color:"auto"}, insideHorizontal:{style:"none",size:0,color:"auto"}, insideVertical:{style:"none",size:0,color:"auto"} };
    var W = function (t, o) { o = Object.assign({}, o || {}); o.font = FONT; return run(t, o); };
    var kids = [];

    var bg = (window.App.Assets && window.App.Assets.coverBg) || null;
    if (bg) {
      kids.push(new window.docx.Paragraph({ spacing: { after: 0, line: 1, lineRule: "exact" }, children: [ new window.docx.ImageRun({
        data: bg.bytes(), transformation: { width: 824, height: 1240 },
        floating: { horizontalPosition: { relative: "page", offset: -91440 }, verticalPosition: { relative: "page", offset: -457200 }, behindDocument: true, allowOverlap: true, margins: { top: 0, bottom: 0, left: 0, right: 0 } }
      }) ] }));
    }

    var lcAsset = (window.App.Assets && window.App.Assets.logoCard) || null;
    if (lcAsset) {
      kids.push(new window.docx.Paragraph({ children: [ new window.docx.ImageRun({ data: lcAsset.bytes(), transformation: { width: 250, height: Math.round(250 / (lcAsset.aspect || (lcAsset.width / lcAsset.height))) } }) ] }));
    }

    kids.push(new window.docx.Paragraph({ spacing: { before: 820, after: 70 }, children: [ W(c.kicker || "", { color: COLOR.skyBlue, bold: true, size: 21 }) ] }));
    kids.push(new window.docx.Table({
      width: dxaW(900), columnWidths: [900], borders: NB,
      rows: [ new TableRow({ height: { value: 48, rule: HR.ATLEAST }, children: [ new TableCell({
        shading: { type: ShadingType.SOLID, color: COLOR.brandBlue, fill: COLOR.brandBlue },
        children: [ new window.docx.Paragraph({ spacing: { before: 0, after: 0, line: 30, lineRule: "exact" }, children: [ run("", { size: 1 }) ] }) ]
      }) ] }) ]
    }));
    titleLines.forEach(function (ln, i) {
      kids.push(new window.docx.Paragraph({ spacing: { before: i === 0 ? 220 : 0, after: 0 }, children: [ W(ln, { color: "FFFFFF", bold: true, size: titleSize }) ] }));
    });
    if (c.client) kids.push(new window.docx.Paragraph({ spacing: { before: 240 }, children: [ W(c.client, { color: "C7D8E8", size: 30 }) ] }));
    if (c.site) kids.push(new window.docx.Paragraph({ spacing: { before: 0 }, children: [ W(c.site, { color: "9DB8D6", size: 21 }) ] }));
    if (c.subLine) kids.push(new window.docx.Paragraph({ spacing: { before: 150 }, children: [ W(c.subLine, { color: COLOR.skyBlue, size: 20, bold: true }) ] }));

    var foot = [], stripRuns = [];
    // Each label stays with its value (stripLayout).
    stripLayout(c).forEach(function (p) {
      stripRuns.push(W(p.label, p.breakBefore ? { color: COLOR.skyBlue, bold: true, size: 16, break: 1 } : { color: COLOR.skyBlue, bold: true, size: 16 }));
      stripRuns.push(W(p.value, { color: "FFFFFF", size: 19 }));
    });
    foot.push(new window.docx.Paragraph({ spacing: { before: 0, after: 120 }, children: stripRuns }));
    foot.push(new window.docx.Paragraph({ spacing: { before: 0, after: 0 }, children: [ W(COMPANY.addressLine, { color: "DBE6F1", size: 15 }) ] }));
    foot.push(new window.docx.Paragraph({ children: [ W(COMPANY.contactLine, { color: "DBE6F1", size: 15 }) ] }));

    var coverCell = new TableCell({ margins: { top: COVER_TOP_MARGIN, bottom: COVER_TOP_FOOT, left: COVER_SIDE, right: COVER_SIDE }, children: kids });
    var footCell = new TableCell({ margins: { top: 0, bottom: 0, left: COVER_SIDE, right: COVER_SIDE }, verticalAlign: "bottom", children: foot });
    // The closing paragraph is on the cover page by construction, so a draft's
    // watermark is anchored there (see markDraft); the shape is positioned on
    // the page, so it adds nothing to the layout.
    var anchor = new window.docx.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: "exact" }, children: [ run("", { size: 1 }) ] });
    anchor.__coverAnchor = true;
    return [
      new window.docx.Table({
        width: dxaW(PAGE_W), columnWidths: [PAGE_W], borders: NB,
        rows: [
          new TableRow({ cantSplit: true, height: { value: COVER_TOP_ROW, rule: HR.EXACT }, children: [ coverCell ] }),
          new TableRow({ cantSplit: true, height: { value: COVER_FOOT_ROW, rule: HR.EXACT }, children: [ footCell ] })
        ]
      }),
      anchor
    ];
  }

  // ---- page setup (export-docx.js 3001-3019, 3092-3103) -------------------
  //
  // A build passes an ordered list of segments { land, children }; consecutive
  // same-orientation segments merge into one Word section, and each section
  // after the first starts on a fresh page, so no page break is needed at an
  // orientation boundary.
  //
  // docx-js quirk: its w:pgSz constructor INTERNALLY swaps width/height when
  // orientation === LANDSCAPE, so ALWAYS pass portrait-order dims (11906 x
  // 16838) with the LANDSCAPE flag and let the library swap them.
  var DOC_A4_W = 11906, DOC_A4_H = 16838;
  function docPO() { return (window.docx && window.docx.PageOrientation) || { PORTRAIT: "portrait", LANDSCAPE: "landscape" }; }
  function portraitSectionProps() {
    return { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: docPO().PORTRAIT },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };
  }
  function landscapeSectionProps() {
    return { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: docPO().LANDSCAPE },
      margin: { top: 720, right: 720, bottom: 720, left: 720 } } };
  }
  // Grow a portrait-sized fixed-width column set to a wider (landscape) total by
  // giving the extra width to the first (label) column, which is what benefits
  // most from room. No-op when targetW is falsy or not wider than the current sum.
  function widenFirstCol(widths, targetW) {
    if (!targetW) return widths;
    var sum = widths.reduce(function (a, b) { return a + b; }, 0);
    if (targetW > sum) widths[0] += (targetW - sum);
    return widths;
  }
  function bodySectionsFromSegments(headers, footers, segments) {
    var out = [], cur = null;
    (segments || []).forEach(function (seg) {
      if (!seg || !seg.children || !seg.children.length) return;
      if (cur && cur._land === !!seg.land) { cur.children = cur.children.concat(seg.children); return; }
      cur = { properties: seg.land ? landscapeSectionProps() : portraitSectionProps(),
        headers: headers, footers: footers, children: seg.children.slice(), _land: !!seg.land };
      out.push(cur);
    });
    out.forEach(function (s) { delete s._land; });
    return out;
  }

  // ---- document control (export-docx.js 826-852) --------------------------
  //
  // pairs = [[label, value], ...]. A value is text, or something already made:
  // a run (the red prompt for a missing title), a list of runs, or a paragraph.
  function documentControl(pairs, opts) {
    var TableRow = window.docx.TableRow;
    function valuePara(v) {
      if (isParagraph(v)) return v;
      if (Array.isArray(v)) return body(v);
      if (v && typeof v === "object") return body([v]);
      return body(v || "");
    }
    var rows = (pairs || []).map(function (r) {
      return new TableRow({ children: [
        cell(body(r[0]), { width: 32, fill: COLOR.subBg }),
        cell(valuePara(r[1]), { width: 68 })
      ] });
    });
    return [
      h1("Document control and confidentiality"),
      table(rows),
      body("", { spacing: { after: 200 } })
    ];
  }

  // =========================================================================
  // New for the document tool
  // =========================================================================

  // ---- lists --------------------------------------------------------------

  // The glyphs are the house's: no dash at any level.
  var BULLETS = ["•", "◦", "▪"];

  // The `numbering` option of a Document. Level 0 sits where the assessment's
  // typed bullet sits (left 360, hanging 200); each deeper level is 360
  // further in. Numbers hang by 300 so "10." has room.
  //
  // `numbers` is listNumbers' result. A numbered list that opens below the
  // top level is given a list definition of its own (openReference), with the
  // same three levels: see startEveryLevel for why.
  var NUMBERS_REF = "house-numbers";
  function openReference(n) { return NUMBERS_REF + "-open" + n.open + "-" + n.instance; }
  function numberingConfig(numbers) {
    var LF = window.docx.LevelFormat, AT = window.docx.AlignmentType;
    var formats = [LF.DECIMAL, LF.LOWER_LETTER, LF.LOWER_ROMAN];
    function numberLevels() {
      return [0, 1, 2].map(function (l) {
        return { level: l, format: formats[l], text: "%" + (l + 1) + ".", alignment: AT.LEFT,
          style: { paragraph: { indent: { left: 360 + 360 * l, hanging: 300 } } } };
      });
    }
    var config = [
      { reference: "house-bullets", levels: [0, 1, 2].map(function (l) {
        return { level: l, format: LF.BULLET, text: BULLETS[l], alignment: AT.LEFT,
          style: { paragraph: { indent: { left: 360 + 360 * l, hanging: 200 } } } };
      }) },
      { reference: NUMBERS_REF, levels: numberLevels() }
    ];
    var seen = {};
    Object.keys(numbers || {}).forEach(function (id) {
      var n = numbers[id];
      if (!n || !n.open || seen[n.instance]) return;
      seen[n.instance] = true;
      config.push({ reference: openReference(n), levels: numberLevels() });
    });
    return { config: config };
  }

  function letters(n) {
    // Word's lower-letter format after z: aa, bb, cc.
    var ch = String.fromCharCode(97 + ((n - 1) % 26)), times = Math.floor((n - 1) / 26) + 1, s = "";
    while (times-- > 0) s += ch;
    return s;
  }
  function roman(n) {
    var map = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]], s = "";
    map.forEach(function (m) { while (n >= m[0]) { s += m[1]; n -= m[0]; } });
    return s;
  }
  function levelOf(b) { return Math.max(0, Math.min(2, parseInt(b.level, 10) || 0)); }

  // The one list numbering rule (design 3.2). For every list block, in table
  // cells too: { marker, instance }. `marker` is the text shown ("2.", "b.",
  // "•") and `instance` is the Word numbering instance the item is written
  // on. The writer, the editor, the preview and the outline all read this, so
  // the numbers on screen are the numbers Word prints.
  //
  // An item of a numbered list whose first item is below the top level also
  // carries `open`, that first item's level (1 or 2). Word left to itself
  // numbers such a list differently from this rule (it counts a parent that
  // was never written), so the writer gives it a definition of its own and
  // starts the missing levels at 0: numberingConfig and startEveryLevel.
  // A list that opened two levels down has `tail` in place of `open` from
  // its first top-level item on: a second level started at 0 would begin
  // again at 0 under that item (Word printed " ." for "a."), so from there
  // the list is written as an ordinary one, on a Word instance of its own.
  // `instance` stays the list the item belongs to on screen throughout.
  // test-doc-fix-template.html holds the shapes, and they were read back
  // from Word (Range.ListFormat.ListString) to agree with these markers.
  //
  // A numbered item carries on the numbered list of the run of list items it
  // is in, and starts a new one after any block that is not a list item.
  // restart starts a new one anyway; continue carries on the last numbered
  // list across whatever sits between. Within a list the counting is Word's:
  // each level counts by itself and starts again after an item of a level
  // above it. A table cell is a flow of its own. Pure: no docx objects.
  function listNumbers(blocks) {
    var out = {}, made = 0, last = null;
    function fresh() { made += 1; return { instance: made, counts: [0, 0, 0] }; }
    function flow(list) {
      var cur = null;
      (list || []).forEach(function (b) {
        if (!b || typeof b !== "object") return;
        if (b.type === "table") {
          (b.rows || []).forEach(function (r) { ((r && r.cells) || []).forEach(function (c) { flow(c && c.blocks); }); });
          cur = null;
          return;
        }
        if (b.type !== "list") { cur = null; return; }
        var level = levelOf(b);
        if (b.list !== "number") { out[b.id] = { marker: BULLETS[level], instance: 0 }; return; }
        if (b.restart) cur = fresh();
        else if (!cur) cur = (b["continue"] && last) ? last : fresh();
        last = cur;
        if (cur.first == null) cur.first = level;
        // From its first top-level item on, a list that opened two levels
        // down is an ordinary list again (see `tail` above).
        if (cur.first === 2 && level === 0) { cur.first = 0; cur.tail = true; }
        cur.counts[level] += 1;
        for (var d = level + 1; d < 3; d++) cur.counts[d] = 0;
        var n = cur.counts[level];
        out[b.id] = { marker: (level === 0 ? String(n) : (level === 1 ? letters(n) : roman(n))) + ".", instance: cur.instance };
        if (cur.first > 0) out[b.id].open = cur.first;
        else if (cur.tail) out[b.id].tail = true;
      });
    }
    flow(blocks);
    return out;
  }

  // ---- headings -----------------------------------------------------------

  // The typed heading numbers, by block id: "1", "1.1", "1.1.1". One owner,
  // as for list numbers: the writer prints these and the contents list, and
  // the outline on screen can read the same.
  //
  // A heading is numbered by how deep it sits under the headings before it,
  // not by its level alone: a level 2 heading before any level 1 is "1", and
  // a level 3 directly under a level 1 is "1.1". Counting each level by
  // itself printed "0.1" and "1.0.1" there, which an imported file reaches
  // easily (a Title, then Heading 2 sections). A document whose levels do not
  // skip is numbered as before. The heading's style still follows its level.
  function headingNumbers(blocks) {
    var out = {}, n = [0, 0, 0], open = [];
    (blocks || []).forEach(function (b) {
      if (!b || b.type !== "heading") return;
      var level = Math.max(1, Math.min(3, parseInt(b.level, 10) || 1));
      while (open.length && open[open.length - 1] >= level) open.pop();
      open.push(level);
      var depth = open.length;
      n[depth - 1] += 1;
      for (var d = depth; d < 3; d++) n[d] = 0;
      out[b.id] = n.slice(0, depth).join(".");
    });
    return out;
  }

  function runsText(runs) {
    return (runs || []).map(function (r) { return (r && !r.fn && r.t) || ""; }).join("");
  }

  // ---- the cover and document control for a project -----------------------

  var UNTITLED = "Untitled document";
  // The file's author when the document names none. Never the tool's name.
  var COMPANY_NAME = "SolutionsPT";
  var TITLE_PROMPT = "Add the document title";
  var NOT_RESTORED = "This picture could not be restored. Replace it or delete it.";

  // The cover title's size in half-points, by its longest line.
  function coverTitleSize(lines) {
    var longest = (lines || []).reduce(function (m, l) { return Math.max(m, String(l || "").length); }, 0);
    if (longest <= 20) return 60;
    if (longest <= 30) return 52;
    if (longest <= 38) return 44;
    return 36;
  }
  // Three lines, as even as they can be: the split whose longest line is shortest.
  function splitTitleThree(title) {
    var words = String(title || "").split(/\s+/).filter(Boolean);
    if (words.length < 3) return splitTitleTwo(title);
    var best = null, bestLen = Infinity;
    for (var i = 1; i < words.length - 1; i++) {
      for (var j = i + 1; j < words.length; j++) {
        var parts = [words.slice(0, i).join(" "), words.slice(i, j).join(" "), words.slice(j).join(" ")];
        var len = Math.max(parts[0].length, parts[1].length, parts[2].length);
        if (len < bestLen) { bestLen = len; best = parts; }
      }
    }
    return best;
  }
  function infoOf(project) { return (project && project.info) || {}; }
  // A document information field or other single value as it prints: safe for
  // XML (it also reaches the file's properties and attributes) and trimmed.
  function txt(v) { return xmlSafe(v).trim(); }

  // info to cover's input (the table in design section 2).
  function coverInput(project) {
    var info = infoOf(project);
    var own = (Array.isArray(info.coverTitleLines) ? info.coverTitleLines : []).map(txt).filter(Boolean).slice(0, 3);
    var lines = own.length ? own : splitTitleTwo(txt(info.title) || UNTITLED);
    var size = coverTitleSize(lines);
    // A title too long for two lines even at the smallest size goes on three,
    // and stays at that size.
    if (!own.length && size === 36) lines = splitTitleThree(txt(info.title));
    return {
      kicker: (txt(info.docType) || "Document").toUpperCase(),
      titleLines: lines,
      titleSize: size,
      client: txt(info.client),
      site: txt(info.site),
      subLine: txt(info.reference),
      revision: txt(info.revision) || "0.1",
      date: txt(info.issuedDate) || txt(info.date),
      author: txt(info.author),
      classification: txt(info.classification) || "Confidential"
    };
  }

  // The document control rows. The first seven are the assessment's, with its
  // labels: the look must match, and the review hash keys on them.
  function controlPairs(project, opts) {
    var info = infoOf(project);
    var pairs = [
      ["Document revision", txt(info.revision) || "0.1"],
      ["Status",            statusLabel(opts)],
      ["QA review by",      txt(info.qaReviewBy)],
      ["Authorised by",     txt(info.authorisedBy)],
      ["Issued to",         txt(info.issuedTo)],
      ["Issued date",       txt(info.issuedDate)],
      ["Confidentiality",   txt(info.classification) || "Confidential"],
      ["Document",          txt(info.title) || noteRun(TITLE_PROMPT, { kind: "info", field: "title" })]
    ];
    [["Document type", info.docType], ["Reference", info.reference], ["Client", info.client], ["Author", info.author]].forEach(function (r) {
      if (txt(r[1])) pairs.push([r[0], txt(r[1])]);
    });
    return pairs;
  }

  // The footer's centre text: the title and the client, or the title alone.
  function footerCentre(project) {
    var info = infoOf(project);
    return [txt(info.title) || UNTITLED, txt(info.client)].filter(Boolean).join(" · ");
  }
  // The line under a short document's title: client, revision, date.
  function shortHeadLine(project) {
    var info = infoOf(project);
    return [txt(info.client), txt(info.revision), txt(info.issuedDate) || txt(info.date)].filter(Boolean).join(" · ");
  }

  // ---- the writer ---------------------------------------------------------

  var ALIGN = { center: "CENTER", right: "RIGHT", justify: "JUSTIFIED" };
  function alignOf(name) {
    var AT = window.docx.AlignmentType;
    return ALIGN[name] ? AT[ALIGN[name]] : undefined;
  }
  // What the library can only write as "<random>.png": the graft pass renames
  // these and gives them their content type.
  var MEDIA_EXT = { "image/jpeg": "jpeg", "image/jpg": "jpeg", "image/gif": "gif", "image/bmp": "bmp",
    "image/x-emf": "emf", "image/emf": "emf", "image/x-wmf": "wmf", "image/wmf": "wmf", "image/tiff": "tiff" };
  function safeLink(url) { return /^(https?:\/\/|mailto:)/i.test(String(url || "")); }

  // Inline runs to docx runs. `base` is formatting every run of this paragraph
  // takes (a table header's bold white, a footnote's own font and size).
  // ctx = { w, blockId, heading, onDark, inNote }.
  //
  // Red text is one prompt for each unbroken stretch, however it is split
  // into runs by other formatting or line breaks: the tag goes on the first
  // piece and holds the whole stretch.
  function inline(runs, ctx, base) {
    var out = [], list = (runs || []).filter(function (r) { return r && typeof r === "object"; });
    var where = { kind: "block", blockId: ctx.blockId };
    list.forEach(function (r, i) {
      if (r.fn) {
        if (!ctx.inNote) { var ref = footnoteRef(r.fn, ctx); if (ref) out.push(ref); }
        return;
      }
      // A vertical tab is a manual line break (Word's own on the clipboard),
      // so it prints as one, like a line feed.
      var text = xmlSafe(r.t, "\n");
      if (text === "") return;
      var o = Object.assign({ tabs: true }, base || {});
      if (r.b && !ctx.heading) o.bold = true;
      if (r.i && !ctx.heading) o.italics = true;
      if (r.u) o.underline = { type: "single" };
      if (r.s) o.strike = true;
      if (r.sup) o.superScript = true; else if (r.sub) o.subScript = true;
      if (r.code) {
        o.font = "Consolas";
        o.size = o.size ? o.size - 2 : 20;
        if (!ctx.onDark) o.shading = { type: window.docx.ShadingType.CLEAR, fill: COLOR.subBg, color: "auto" };
      }
      var link = r.link && safeLink(xmlSafe(r.link, "")) ? xmlSafe(r.link, "") : null;
      if (link) { o.underline = { type: "single" }; if (!ctx.onDark) o.color = COLOR.blue; }
      if (r.red) o.color = COLOR.note;

      var tagText = null;
      if (r.red && !ctx.inNote) {
        var prev = list[i - 1];
        if (!(prev && prev.red && !prev.fn)) {
          tagText = "";
          for (var j = i; j < list.length && list[j].red && !list[j].fn; j++) tagText += String(list[j].t == null ? "" : list[j].t);
        }
      }
      var pieces = [];
      text.split("\n").forEach(function (line, n) {
        var po = n > 0 ? Object.assign({}, o, { "break": 1 }) : o;
        var piece = run(line, po);
        // The library keeps a hyperlink's runs in its options until the file
        // is packed, where the walk for prompts would not find a red one: a
        // red link is tagged on the hyperlink itself.
        if (tagText !== null && n === 0 && !link) tagPlaceholder(piece, tagText, where);
        pieces.push(piece);
      });
      if (link) {
        var hl = new window.docx.ExternalHyperlink({ link: link, children: pieces });
        hl.__text = text;
        if (tagText !== null) tagPlaceholder(hl, tagText, where);
        out.push(hl);
      } else {
        out = out.concat(pieces);
      }
    });
    return out;
  }

  // A footnote reference, and the footnote it points at. Each reference gets a
  // footnote of its own, numbered in reading order, so a copied paragraph
  // never leaves two references on one note. Every run of the note carries
  // its font, size and colour as direct formatting: the library's footnote
  // paragraph has none and Word would show Times New Roman. The paragraph is
  // in the body style, set closer, so the note's own reference mark, which
  // the library writes with no font, is Segoe UI as well (seen in Word: it
  // was Times New Roman 10 without). No style is added, so styles.xml stays
  // the assessment's.
  // Red text in a note is tagged on the reference, which is in the body where
  // the walk for prompts runs and where it falls in reading order.
  function footnoteRef(key, ctx) {
    var w = ctx.w, note = w.project.footnotes && w.project.footnotes[key];
    if (!note) return null;
    w.noteSeq += 1;
    var kids = inline(note.runs, { w: w, blockId: ctx.blockId, inNote: true }, { font: FONT, size: 18, color: COLOR.text });
    w.footnotes[w.noteSeq] = { children: [ new window.docx.Paragraph({ style: "BodyText", spacing: { after: 60, line: 240 }, children: kids }) ] };
    var ref = new window.docx.FootnoteReferenceRun(w.noteSeq);
    ref.__text = "";
    var red = (note.runs || []).filter(function (r) { return r && r.red && !r.fn; }).map(function (r) { return String(r.t == null ? "" : r.t); }).join("");
    if (red) tagPlaceholder(ref, red, { kind: "block", blockId: ctx.blockId });
    return ref;
  }

  function captionPara(text, align) {
    var o = { style: "Caption", children: [run(text, { italics: true })] };
    if (align) o.alignment = align;
    return new window.docx.Paragraph(o);
  }
  function tagBlock(node, block) { node.__blockId = block.id; return node; }

  // The name of the bookmark on a heading, which the contents list links to.
  function anchorOf(b) { return "h_" + xmlSafe(b.id, ""); }

  // The space a picture or kept object has: the page's text width, or its
  // cell's, and no taller than a page can show (maxHPx; left out, the width
  // alone is held). The shape is kept. `lower` says the height was what
  // made it smaller, which nothing on screen has shown the author.
  function fitPx(width, height, maxPx, maxHPx) {
    var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height)), lower = false;
    if (w > maxPx) { h = Math.max(1, Math.round(h * maxPx / w)); w = maxPx; }
    if (maxHPx > 0 && h > maxHPx) { w = Math.max(1, Math.round(w * maxHPx / h)); h = maxHPx; lower = true; }
    return { width: w, height: h, lower: lower };
  }

  function writeHeading(b, env) {
    var w = env.w, level = Math.max(1, Math.min(3, parseInt(b.level, 10) || 1));
    var kids = inline(b.runs, { w: w, blockId: b.id, heading: true });
    if (!kids.length) kids = [run("")];
    var text = runsText(b.runs);
    // A bookmark for the contents list to link to.
    if (w.bookmarks && level < 3) {
      var bm = new window.docx.Bookmark({ id: anchorOf(b), children: kids });
      bm.__text = text;
      // The paragraph takes a bookmark's runs as its own children, between
      // the start and end marks, so the walk for prompts still reaches them
      // (test-doc-writer.html holds red text in a bookmarked heading).
      kids = [bm];
    }
    var num = w.headingNums ? w.headingNums[b.id] : null;
    var p = num ? hn(level, num, kids) : (level === 1 ? h1(kids) : (level === 2 ? h2(kids) : h3(kids)));
    p.__headingText = text;
    return [tagBlock(p, b)];
  }

  function writeParagraph(b, env) {
    var kids = inline(b.runs, { w: env.w, blockId: b.id, onDark: env.header }, env.base);
    if (env.w.lead && env.w.lead.length) kids = env.w.lead.splice(0).concat(kids);     // floating drawings anchored here (writeKept)
    var p = kids.length ? body(kids, { alignment: alignOf(b.align) }) : body("", { alignment: alignOf(b.align) });
    return [tagBlock(p, b)];
  }

  function writeList(b, env) {
    var kids = inline(b.runs, { w: env.w, blockId: b.id, onDark: env.header }, env.base);
    if (env.w.lead && env.w.lead.length) kids = env.w.lead.splice(0).concat(kids);     // floating drawings anchored here (writeKept)
    var n = env.w.numbers[b.id] || { instance: 0 };
    var p = body(kids.length ? kids : [run("")], { numbering: {
      reference: b.list === "number" ? (n.open ? openReference(n) : NUMBERS_REF) : "house-bullets", level: levelOf(b),
      instance: n.tail ? n.instance + "t" : n.instance } });
    return [tagBlock(p, b)];
  }

  function writePicture(b, env) {
    var w = env.w, m = w.project.media && w.project.media[b.media];
    var where = { kind: "block", blockId: b.id };
    if (!m || m.missing || (!m.blob && !w.check)) return [tagBlock(placeholderPara(NOT_RESTORED, where), b)];
    var fit = fitPx(b.width || m.width || 300, b.height || m.height || 200, env.maxPx, env.maxHPx);
    var size = { width: fit.width, height: fit.height };
    // Made smaller because it was taller than the page: said after the export.
    if (fit.lower && !w.check && w.fitted.indexOf(b.id) === -1) w.fitted.push(b.id);
    var o = { data: w.check ? blankPng() : w.bytes[b.media], transformation: size };
    if (txt(b.alt)) o.altText = { name: "Picture", description: txt(b.alt), title: "" };
    var img = new window.docx.ImageRun(o);
    var ext = MEDIA_EXT[String(m.type || "").toLowerCase()];
    if (ext && !w.check) w.graft.media.push({ fileName: img.key, ext: ext, contentType: ext === "jpeg" ? "image/jpeg" : xmlSafe(m.type, "").toLowerCase() });
    var align = alignOf(b.align || "center");
    var po = { children: [img], spacing: { before: 120, after: txt(b.caption) ? 60 : 160 } };
    if (align) po.alignment = align;
    if (txt(b.caption)) po.keepNext = true;
    var out = [tagBlock(new window.docx.Paragraph(po), b)];
    if (txt(b.caption)) out.push(captionPara(txt(b.caption), align));
    return out;
  }

  // Every part a kept object reaches, into `into`; false when one is not there.
  function partsClosure(project, rels, into) {
    return (rels || []).every(function (rel) {
      if (!rel || !rel.part) return true;
      if (into[rel.part]) return true;
      var p = project.parts && project.parts[rel.part];
      if (!p || p.missing || !p.blob) return false;
      into[rel.part] = { name: p.name, contentType: p.contentType, blob: p.blob, rels: p.rels || [] };
      return partsClosure(project, p.rels, into);
    });
  }

  // A kept object is one run holding a token; the graft pass swaps the run for
  // the original XML after packing. One plan entry per use, in reading order.
  // `next` is the block that follows this one in the same cell or section.
  function writeKept(b, env, next) {
    var w = env.w, where = { kind: "block", blockId: b.id };
    var reached = {};
    // Something outside the file that is not a link to click (a linked picture,
    // workbook or object) would be fetched by Word when the file is opened, and
    // an address on a share hands over the reader's Windows sign-in. The import
    // and the model never let one through; a block that still has one is
    // refused here as a block with a part missing.
    function outside(rels) {
      return (rels || []).some(function (r) { return r && r.external != null && !/(^|\/)hyperlink$/i.test(String(r.type || "")); });
    }
    // With any part missing it is never written as a token: a prompt prints in
    // its place, so the document cannot be issued and no damaged file is made.
    if (!b.xml || !partsClosure(w.project, b.rels, reached) || outside(b.rels) ||
        Object.keys(reached).some(function (k) { return outside(reached[k].rels); })) return [tagBlock(placeholderPara(NOT_RESTORED, where), b)];
    var token = window.App.DocxGraft && window.App.DocxGraft.token ? window.App.DocxGraft.token(b.id) : "KEPT:" + b.id + "";
    if (!w.check) {
      var entry = { token: token, blockId: b.id, kind: b.kind, xml: b.xml, rels: b.rels || [] };
      // Only an in-line object is made smaller to fit; a floating one keeps
      // the position and size it was given. It is fitted to the width of its
      // space and, like a picture, to the height of a page (fitPx), by one
      // factor so its shape is kept.
      var scale = Math.min(b.width > env.maxPx ? env.maxPx / b.width : 1,
        env.maxHPx > 0 && b.height > env.maxHPx ? env.maxHPx / b.height : 1);
      if (!b.floating && scale < 1) {
        entry.scale = Math.floor(scale * 10000) / 10000;
        if (w.fitted.indexOf(b.id) === -1) w.fitted.push(b.id);
      }
      w.graft.kept.push(entry);
      Object.keys(reached).forEach(function (k) { w.graft.parts[k] = reached[k]; });
      w.anyKept = true;
    }
    var align = alignOf(b.align || "center");
    // A floating drawing is measured from the paragraph that holds its anchor,
    // and at import it was put before the text it was anchored in. So its
    // token goes at the start of that text's own paragraph, where the anchor
    // was in the source: writeParagraph and writeList take it from w.lead.
    // (A block that is whole paragraphs brings its own, and the graft puts
    // them in place of the token's paragraph.)
    var whole = /^\s*<w:p[\s>]/.test(b.xml);
    if (b.floating && !whole && !txt(b.caption) && next && (next.type === "paragraph" || next.type === "list")) {
      var lead = run(token);
      lead.__text = "";
      w.lead.push(lead);
      return [];
    }
    var po = { children: [run(token)] };
    if (b.floating) {
      // With no text after it to hold the anchor, the paragraph is given no
      // height and stays with what follows: the drawing is measured from the
      // top of the next thing on the page and no blank line prints.
      po.spacing = { before: 0, after: 0, line: 20, lineRule: "exact" };
      po.keepNext = true;
      align = undefined;
    } else if (align) po.alignment = align;
    if (txt(b.caption)) po.keepNext = true;
    var p = tagBlock(new window.docx.Paragraph(po), b);
    p.__kept = true;
    var out = [p];
    if (txt(b.caption)) out.push(captionPara(txt(b.caption), align));
    return out;
  }

  // Where each cell of a table sits. A cell covered by a span from the left or
  // from above is left out of its row in the model, as in HTML, so the columns
  // are found by filling each row from the left around what hangs from above.
  function tableLayout(b) {
    var rows = (b.rows || []).map(function (r) { return (r && r.cells) || []; });
    var taken = rows.map(function () { return []; }), placed = [], ncols = (b.cols || []).length;
    rows.forEach(function (cells, r) {
      var c = 0, line = [];
      cells.forEach(function (cl) {
        cl = cl || {};
        while (taken[r][c]) c++;
        var span = Math.max(1, parseInt(cl.span, 10) || 1);
        var down = Math.max(1, Math.min(rows.length - r, parseInt(cl.rowSpan, 10) || 1));
        for (var rr = r; rr < r + down; rr++) for (var cc = c; cc < c + span; cc++) taken[rr][cc] = true;
        line.push({ cell: cl, col: c, span: span, rowSpan: down });
        c += span;
      });
      placed.push(line);
    });
    taken.forEach(function (t) { ncols = Math.max(ncols, t.length); });
    // A row that stops short is filled out, so every row covers the grid.
    placed.forEach(function (line, r) {
      for (var c = 0; c < ncols; c++) if (!taken[r][c]) { taken[r][c] = true; line.push({ cell: {}, col: c, span: 1, rowSpan: 1 }); }
      line.sort(function (x, y) { return x.col - y.col; });
    });
    return { placed: placed, ncols: ncols };
  }
  // Relative widths to dxa that add up to the page exactly.
  function scaleCols(cols, ncols, total) {
    var rel = [], sum = 0, i;
    var known = (cols || []).filter(function (n) { return n > 0; });
    var mean = known.length ? known.reduce(function (a, n) { return a + n; }, 0) / known.length : 1;
    for (i = 0; i < ncols; i++) { rel.push(cols && cols[i] > 0 ? Number(cols[i]) : mean); sum += rel[i]; }
    var out = rel.map(function (n) { return Math.max(1, Math.floor(total * n / sum)); });
    var used = out.reduce(function (a, n) { return a + n; }, 0);
    out[ncols - 1] += total - used;
    return out;
  }
  // Word's default cell margins, left and right, and a hair.
  var CELL_PAD_DXA = 230;

  function writeTable(b, env) {
    var TableRow = window.docx.TableRow;
    var lay = tableLayout(b);
    if (!lay.ncols || !lay.placed.length) return [];
    var widths = scaleCols(b.cols, lay.ncols, env.maxDxa);
    var headerRows = b.header ? 1 : 0;
    var rows = lay.placed.map(function (line, r) {
      var isHead = r < headerRows;
      var cells = line.map(function (at) {
        var wd = 0;
        for (var c = at.col; c < at.col + at.span; c++) wd += widths[c];
        var inner = { w: env.w, maxDxa: wd, maxPx: Math.max(16, Math.floor((wd - CELL_PAD_DXA) / 15)),
          maxHPx: env.maxHPx ? Math.max(16, env.maxHPx - CELL_H_LESS_PX) : undefined, inCell: true,
          header: isHead, base: isHead ? { bold: true, color: "FFFFFF" } : null };
        var kids = writeBlocks(at.cell.blocks, inner);
        if (!kids.length) kids = [body("")];
        var o = { columnSpan: at.span, rowSpan: at.rowSpan };
        return isHead ? headerCellDxa(kids, wd, o) : cellDxa(kids, wd, o);
      });
      return isHead ? new TableRow({ children: cells, tableHeader: true }) : new TableRow({ children: cells });
    });
    var t = tagBlock(fixedTable(rows, widths), b);
    // Word joins two tables with nothing between them, and a table that ends
    // a cell or a section needs a paragraph after it: the caption, or a
    // spacer as under the document control table.
    return [t, txt(b.caption) ? captionPara(txt(b.caption)) : body("", { spacing: { after: 120 } })];
  }

  function writeBlocks(blocks, env) {
    var out = [];
    (blocks || []).forEach(function (b, i) {
      if (!b || typeof b !== "object") return;
      var made;
      if (b.type === "paragraph") made = writeParagraph(b, env);
      else if (b.type === "list") made = writeList(b, env);
      else if (b.type === "picture") made = writePicture(b, env);
      else if (b.type === "kept") made = writeKept(b, env, i + 1 < blocks.length ? blocks[i + 1] : env.next);
      else if (b.type === "prompt") made = [tagBlock(placeholderPara(b.text, { kind: "block", blockId: b.id }), b)];
      else if (env.inCell) made = [];                 // a cell holds nothing else
      else if (b.type === "heading") made = writeHeading(b, env);
      else if (b.type === "table") made = writeTable(b, env);
      else if (b.type === "pageBreak") { made = [pageBreakPara()]; made[0].__pageBreak = true; }
      else made = [];                                 // a later version's block type prints as nothing
      out = out.concat(made);
    });
    return out;
  }

  // Every picture's bytes, read once before anything is built (building is
  // synchronous). A check reads none.
  function readPictures(project, check) {
    var bytes = {}, jobs = [];
    if (check) return Promise.resolve(bytes);
    (function walk(list) {
      (list || []).forEach(function (b) {
        if (!b) return;
        if (b.type === "table") (b.rows || []).forEach(function (r) { ((r && r.cells) || []).forEach(function (c) { walk(c && c.blocks); }); });
        if (b.type !== "picture" || bytes[b.media] !== undefined) return;
        var m = project.media && project.media[b.media];
        if (!m || m.missing || !m.blob) return;
        bytes[b.media] = null;
        jobs.push(m.blob.arrayBuffer().then(function (buf) { bytes[b.media] = new Uint8Array(buf); }));
      });
    })(project.blocks);
    return Promise.all(jobs).then(function () { return bytes; });
  }

  // The writer: a project's blocks as docx nodes, in segments by orientation.
  // Resolves { segments, footnotes, graft, fitted }. `graft` is the plan for
  // App.DocxGraft.apply (design 4.2); `fitted` lists the kept blocks made
  // smaller to fit their page or cell, and the pictures made smaller because
  // they were taller than a page. `numbers` is listNumbers' result, which
  // numberingConfig needs.
  function blocksToDocx(project, opts) {
    project = project || {};
    var check = !!(opts && opts.issueCheck);
    var options = project.options || {};
    return readPictures(project, check).then(function (bytes) {
      var w = {
        project: project, check: check, bytes: bytes,
        numbers: listNumbers(project.blocks),
        headingNums: options.numberHeadings ? headingNumbers(project.blocks) : null,
        bookmarks: !!options.contents && project.kind !== "short",
        footnotes: {}, noteSeq: 0, fitted: [], anyKept: false, lead: [],
        graft: { kept: [], parts: {}, theme: undefined, media: [] }
      };
      var segments = [], cur = null;
      (project.blocks || []).forEach(function (b, i, all) {
        if (!b || typeof b !== "object") return;
        var land = !!b.land;
        if (!cur || cur.land !== land) { cur = { land: land, children: [] }; segments.push(cur); }
        var env = { w: w, maxDxa: land ? LANDSCAPE_DXA : PORTRAIT_DXA, maxPx: land ? LANDSCAPE_PX : PORTRAIT_PX,
          maxHPx: land ? LANDSCAPE_MAX_H_PX : PORTRAIT_MAX_H_PX };
        // The block after this one on the same kind of page (writeKept looks at it).
        var after = all[i + 1];
        if (after && typeof after === "object" && !!after.land === land) env.next = after;
        cur.children = cur.children.concat(writeBlocks([b], env));
      });
      // The theme goes with any kept object, so its colours and fonts resolve
      // as they did in the source file.
      if (w.anyKept && project.theme) {
        var themeParts = {};
        if (partsClosure(project, [{ part: project.theme }], themeParts)) {
          w.graft.theme = project.theme;
          Object.keys(themeParts).forEach(function (k) { w.graft.parts[k] = themeParts[k]; });
        }
      }
      return { segments: trimBreaks(segments), footnotes: w.footnotes, graft: w.graft, fitted: w.fitted, numbers: w.numbers };
    });
  }

  // A change of orientation starts a new page by itself, so a page break
  // directly before or after one would leave an empty page: it is left out.
  function trimBreaks(segments) {
    var live = (segments || []).filter(function (s) { return s && s.children && s.children.length; });
    live.forEach(function (s, i) {
      var k = s.children;
      if (i < live.length - 1 && k.length && k[k.length - 1].__pageBreak) k.pop();
      if (i > 0 && k.length && k[0].__pageBreak) k.shift();
    });
    return live.filter(function (s) { return s.children.length; });
  }

  // ---- putting a document together ----------------------------------------

  // spec = { kind, cover?: [nodes], segments: [{ land, children }], footerCentre,
  //          props: { creator, title, description }, footnotes, numbering }
  // The generic half of the assessment's makeDoc: the cover in its own
  // zero-margin section, the body sections with the house header and footer,
  // what is still to be written recorded on doc.__issues, the watermark on a
  // draft and the lock on a final with nothing outstanding.
  function assemble(spec, opts) {
    spec = spec || {};
    var PO = docPO(), sections = [];
    if (spec.cover && spec.cover.length) {
      sections.push({ properties: { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: spec.cover });
    }
    var segments = (spec.segments || []).filter(function (s) { return s && s.children && s.children.length; });
    if (!segments.length) segments = [{ land: false, children: [body("")] }];
    sections = sections.concat(bodySectionsFromSegments(brandHeaders(), brandFootersDoc(spec.footerCentre || "", spec.classification), segments));

    var issues = [], notes = spec.footnotes || {};
    sections.forEach(function (s) { collectPlaceholders(s.children, issues); });
    Object.keys(notes).forEach(function (k) { collectPlaceholders(notes[k] && notes[k].children, issues); });
    if (!isFinal(opts) && !(opts && opts.issueCheck)) markDraft(sections);

    var props = spec.props || {};
    // Without lastModifiedBy the library writes "Un-named", which Word shows
    // under File, Info on the client's copy.
    var cfg = { creator: props.creator || COMPANY_NAME, lastModifiedBy: props.lastModifiedBy || props.creator || COMPANY_NAME,
      title: props.title, description: props.description, styles: buildStyles(), sections: sections };
    if (spec.numbering) cfg.numbering = spec.numbering;
    if (Object.keys(notes).length) cfg.footnotes = notes;
    var doc = new (window.docx.Document)(cfg);
    startEveryLevel(doc);
    if (isFinal(opts) && !issues.length) lockAsFinal(doc);
    doc.__issues = issues;
    return doc;
  }

  // The library starts a new numbering instance at 1 for its first level
  // only. Word counts the deeper levels of every instance of one list
  // definition together, so a second list that opened at level 1 went on
  // from the first one's letters (b. where a. was meant; seen in Word). Each
  // numbered instance is given a start for its other levels as well, which is
  // what Word writes itself when a list is restarted. The instances are made
  // while the file is packed, so the library's own step is wrapped; if a
  // later library has no such step, lists still print, less this one case
  // (test-doc-writer.html would then say so).
  //
  // A list that opens below its top level needs two things more, both seen in
  // Word. Word counts the parent that was never written as its first, so the
  // next real parent printed 2. where the screen shows 1. (and b. for a.):
  // the levels above the first item are started at 0, and the unwritten
  // parent is the nought. And an instance first used below its top level
  // does not take its top-level start at all while it shares a definition
  // with another list: it carried on that list's count (3. for 1.). So such
  // a list has a definition of its own (numberingConfig, openReference).
  function startEveryLevel(doc) {
    var N = doc && doc.Numbering;
    if (!N || typeof N.createConcreteNumberingInstance !== "function" || !N.concreteNumberingMap) return;
    var make = N.createConcreteNumberingInstance;
    N.createConcreteNumberingInstance = function (reference, instance) {
      var key = reference + "-" + instance, had = this.concreteNumberingMap.has(key);
      make.call(this, reference, instance);
      var num = this.concreteNumberingMap.get(key);
      var open = /^house-numbers-open(\d)-/.exec(String(reference));
      if (had || (reference !== NUMBERS_REF && !open) || !num || !Array.isArray(num.root)) return;
      var first = open ? parseInt(open[1], 10) : 0;
      function start(level) {
        return importedXml('<w:lvlOverride w:ilvl="' + level + '"><w:startOverride w:val="' + (level < first ? 0 : 1) + '"/></w:lvlOverride>');
      }
      if (first > 0) {
        // The library's own start for the top level is 1: put ours in its place.
        var x0 = start(0), at = -1;
        num.root.forEach(function (c, i) { if (at === -1 && c && c.rootKey === "w:lvlOverride") at = i; });
        if (x0) { if (at === -1) num.root.push(x0); else num.root[at] = x0; }
      }
      [1, 2].forEach(function (level) {
        var x = start(level);
        if (x) num.root.push(x);
      });
    };
  }

  function graftNeeded(plan) {
    var G = window.App.DocxGraft;
    if (!plan) return false;
    if ((plan.kept && plan.kept.length) || (plan.media && plan.media.length)) return true;
    return !!(G && G.needsGraft && G.needsGraft(plan));
  }

  // The single way a built document becomes a file. A check stops here and
  // hands back what would print red; a final with anything still to write is
  // refused, not written. A document with kept content or a picture that is
  // not a PNG goes through the graft pass; any other is the library's bytes.
  function pack(doc, opts, callback) {
    var issues = doc.__issues || [];
    if (opts && opts.issueCheck) { callback(null, { placeholders: issues }); return; }
    if (isFinal(opts) && issues.length) {
      callback(new Error("This document still has " + issues.length + " thing" + (issues.length === 1 ? "" : "s") +
        " to write, so it cannot be issued as final. Export it as a draft, or complete it first."));
      return;
    }
    var plan = doc.__graft;
    window.docx.Packer.toBlob(doc).then(function (out) {
      if (!graftNeeded(plan)) return out;
      var G = window.App.DocxGraft;
      // Without the graft a kept object would print as its token.
      if (!G || !G.apply) throw new Error("This document holds content kept from a Word file, which this page cannot write.");
      return G.apply(out, plan);
    }).then(function (out) { callback(null, out); }).catch(function (e) { callback(e); });
  }

  // What is printed before the blocks: document control, and the contents
  // list when asked for (a report), or the title block (a short document).
  function frontMatter(project, opts) {
    var info = infoOf(project), options = project.options || {}, out = [];
    function autoBreak() { var p = pageBreakPara(); p.__pageBreak = true; return p; }
    if (project.kind === "short") {
      out.push(txt(info.title)
        ? new window.docx.Paragraph({ heading: window.docx.HeadingLevel.TITLE, children: [run(txt(info.title))] })
        : placeholderPara(TITLE_PROMPT, { kind: "info", field: "title" }));
      if (shortHeadLine(project)) out.push(caption(shortHeadLine(project)));
      return out;
    }
    out = out.concat(documentControl(controlPairs(project, opts), opts)).concat([autoBreak()]);
    if (options.contents) {
      // Linked headings without page numbers: no field, so nothing to update
      // on opening and nothing a read-only Final would refuse.
      var nums = options.numberHeadings ? headingNumbers(project.blocks) : null;
      // A heading with no words has no line here, as in the preview: it would
      // print as a blank line, or as a number with nothing after it.
      var lines = (project.blocks || []).filter(function (b) {
        return b && b.type === "heading" && (parseInt(b.level, 10) || 1) < 3 && xmlSafe(runsText(b.runs)).trim() !== "";
      }).map(function (b) {
        var label = (nums && nums[b.id] ? nums[b.id] + " " : "") + runsText(b.runs);
        var link = new window.docx.InternalHyperlink({ anchor: anchorOf(b), children: [run(label, { color: COLOR.blue })] });
        link.__text = label;
        return body([link], (parseInt(b.level, 10) || 1) === 2 ? { indent: { left: 360 } } : {});
      });
      out = out.concat([h1("Contents")]).concat(lines).concat([autoBreak()]);
    }
    return out;
  }

  // The one call a module makes. Resolves { blob, fitted }, or
  // { placeholders } when opts.issueCheck.
  function buildDocument(project, opts) {
    project = project || {};
    var info = infoOf(project);
    return blocksToDocx(project, opts).then(function (w) {
      var front = frontMatter(project, opts);
      // A report's front matter ends on a new page by itself, so a page break
      // that opens the body (one the source had after its own contents, or
      // one typed first) would leave an empty page: it is left out. A short
      // document has no such break, and one typed first there is the
      // author's own.
      if (project.kind !== "short" && front.length && front[front.length - 1].__pageBreak) {
        while (w.segments.length && !w.segments[0].land && w.segments[0].children.length && w.segments[0].children[0].__pageBreak) {
          w.segments[0].children.shift();
          if (!w.segments[0].children.length) w.segments.shift();
        }
      }
      var segments = [{ land: false, children: front }].concat(w.segments);
      // The front matter and the first blocks share a section when both are
      // portrait; before a landscape start, or with nothing after it, the
      // closing page break would leave an empty page.
      var firstLand = w.segments.length && w.segments[0].land;
      if ((firstLand || !w.segments.length) && front.length && front[front.length - 1].__pageBreak) front.pop();
      var doc = assemble({
        kind: project.kind,
        cover: project.kind === "short" ? null : cover(coverInput(project)),
        segments: segments,
        footerCentre: footerCentre(project),
        classification: txt(info.classification),
        props: {
          creator: txt(info.author) || COMPANY_NAME,
          title: (txt(info.title) || UNTITLED) + (txt(info.client) ? " - " + txt(info.client) : ""),
          description: txt(info.docType) || "Document"
        },
        footnotes: w.footnotes,
        numbering: numberingConfig(w.numbers)
      }, opts);
      doc.__graft = w.graft;
      return new Promise(function (resolve, reject) {
        pack(doc, opts, function (err, out) {
          if (err) { reject(err); return; }
          if (opts && opts.issueCheck) resolve(out); else resolve({ blob: out, fitted: w.fitted });
        });
      });
    });
  }

  // What would print red, without writing a file: [{ text, where }].
  function issueList(project) {
    return buildDocument(project, { issueCheck: true }).then(function (r) { return r.placeholders; });
  }

  window.App.HouseDocx = {
    hex: hex, COLOR: COLOR, FONT: FONT, TBL_LIGHT: TBL_LIGHT, TBL_WHITE: TBL_WHITE, TBL_NONE: TBL_NONE,
    run: run, body: body, h1: h1, h2: h2, h3: h3, hn: hn, pageBreakPara: pageBreakPara, caption: caption,
    tagPlaceholder: tagPlaceholder, placeholderPara: placeholderPara, noteRun: noteRun, collectPlaceholders: collectPlaceholders,
    isFinal: isFinal, statusLabel: statusLabel, importedXml: importedXml, watermarkRun: watermarkRun,
    isParagraph: isParagraph, markDraft: markDraft, lockAsFinal: lockAsFinal,
    cell: cell, headerCell: headerCell, table: table, dxaW: dxaW, cellDxa: cellDxa, headerCellDxa: headerCellDxa,
    fixedTable: fixedTable, buildHeaderRow: buildHeaderRow,
    logoAsset: logoAsset, logoImageRun: logoImageRun, brandHeaderObj: brandHeaderObj, brandHeaders: brandHeaders,
    buildStyles: buildStyles, splitTitleTwo: splitTitleTwo, brandFootersDoc: brandFootersDoc, cover: cover,
    DOC_A4_W: DOC_A4_W, DOC_A4_H: DOC_A4_H, docPO: docPO, portraitSectionProps: portraitSectionProps,
    landscapeSectionProps: landscapeSectionProps, widenFirstCol: widenFirstCol,
    bodySectionsFromSegments: bodySectionsFromSegments, documentControl: documentControl,
    COMPANY: COMPANY, numberingConfig: numberingConfig, listNumbers: listNumbers, coverTitleSize: coverTitleSize,
    controlPairs: controlPairs, coverInput: coverInput, assemble: assemble, pack: pack,
    blocksToDocx: blocksToDocx, buildDocument: buildDocument, issueList: issueList,
    // Beyond the design's tables, for the screen to agree with the print:
    headingNumbers: headingNumbers, shortHeadLine: shortHeadLine, footerCentre: footerCentre,
    PAGE: { portraitDxa: PORTRAIT_DXA, landscapeDxa: LANDSCAPE_DXA, portraitPx: PORTRAIT_PX, landscapePx: LANDSCAPE_PX,
      // The tallest a picture may be, and how much less in a table cell.
      portraitMaxHPx: PORTRAIT_MAX_H_PX, landscapeMaxHPx: LANDSCAPE_MAX_H_PX, cellHLessPx: CELL_H_LESS_PX },
    // xmlSafe: the cleaning every written string gets, for the model and the
    // paste path to store clean text. fitPx: the size a picture prints at.
    // footerLeft: the footer's left cell for a classification. coverRoom and
    // coverFits: whether the cover's text fits its page (an estimate).
    // stripParts: the label and value pairs the cover's strip prints.
    xmlSafe: xmlSafe, fitPx: fitPx, footerLeft: footerLeft, coverRoom: coverRoom, stripParts: stripParts,
    coverFits: function (project) { return coverRoom(coverInput(project)).fits; },
    COVER: { topRow: COVER_TOP_ROW, footRow: COVER_FOOT_ROW }
  };
})();
