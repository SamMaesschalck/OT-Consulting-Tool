/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* export-docx.js
 *
 * Executive Word document for the business reader.
 *
 * LANGUAGE RULE
 *   The generator must not free-write prose. Every paragraph is either:
 *     (a) inserted verbatim from window.App.Data.narrative.boilerplate or
 *         window.App.Data.narrative.fr_narrative, or
 *     (b) composed by slot-substituting into
 *         window.App.Data.narrative.templates[*].
 *   If a value required by a template is missing or null the sentence is
 *   omitted cleanly rather than written around. No paraphrasing, no
 *   adjectives, no synthesised commentary.
 *
 * STYLING
 *   Named paragraph styles (Heading 1, Heading 2, Body, Caption,
 *   PlaceholderText) so the consultant can restyle the whole document
 *   in one step. Headings are coloured with the brand blue used by the
 *   rest of the tool.
 *
 * SECTIONS (in order)
 *   1.  Title page
 *   2.  Document control and confidentiality
 *   3.  Executive summary
 *   4.  About this assessment
 *   5.  Scope and method
 *   6.  How to read this report
 *   7.  Overall posture (KPI table + radar + per-FR breakdown)
 *   8.  Findings by Foundational Requirement
 *   9.  Gap register
 *  10.  Recommendations (finding-linked scaffold)
 *  11.  Roadmap (empty table scaffold)
 *  12.  Limitations
 *  13.  Appendix - scoring methodology
 */
window.App = window.App || {};
window.App.ExportDOCX = (function () {
  "use strict";

  var S = window.App.Scoring;

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

  function bandBg(band) {
    if (band === "met") return COLOR.metBg;
    if (band === "near") return COLOR.nearBg;
    if (band === "gap") return COLOR.gapBg;
    return COLOR.naBg;
  }

  // ---- chart rasterisation ----------------------------------------------

  // exportOpts: the export's options (a check draws no charts; see rasterise).
  function makeChartBlob(chartBuilder, scored, taxonomy, opts, cb, exportOpts) {
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    var svg = chartBuilder(scored, taxonomy, opts);
    holder.appendChild(svg);
    rasterise(svg, exportOpts, function (blob) {
      document.body.removeChild(holder);
      cb(blob);
    });
  }
  function blobBuf(blob, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsArrayBuffer(blob);
  }

  // ---- template helpers -------------------------------------------------

  // The executive summary closes with what the assessment is not, and the
  // shaded caveat box directly under it says the same thing, often in the
  // same sentences. Keep only the sentences the caveat does not already say.
  function sentenceKeys(s) {
    return String(s || "").split(/(?<=[.?!])\s+/).map(function (x) {
      return x.toLowerCase().replace(/\s+/g, " ").replace(/[.?!\s]+$/, "").trim();
    }).filter(Boolean);
  }
  function withoutRepeatsOf(text, refText) {
    if (!text) return text;
    var seen = sentenceKeys(refText);
    return String(text).split(/(?<=[.?!])\s+/).filter(function (s) {
      return seen.indexOf(sentenceKeys(s)[0]) === -1;
    }).join(" ").trim();
  }
  function withoutCaveatRepeats(text, narrative) {
    if (!text) return text;
    var bp = (narrative && narrative.boilerplate) || {};
    var seen = sentenceKeys([bp.not_formal_caveat, bp.not_certification_caveat, bp.indicative_grade_caveat,
                             NIS2_CAVEAT_TEXT, GENERIC_CAVEAT].filter(Boolean).join(" "));
    return String(text).split(/(?<=[.?!])\s+/).filter(function (s) {
      return seen.indexOf(sentenceKeys(s)[0]) === -1;
    }).join(" ").trim();
  }
  function interp(template, vals) {
    if (template == null) return null;
    var missing = false;
    var s = template.replace(/\{(\w+)\}/g, function (_, k) {
      var v = vals[k];
      if (v === null || v === undefined) { missing = true; return ""; }
      return String(v);
    });
    return missing ? null : s;
  }

  function findResponse(engagement, targetId, requirementId) {
    var arr = (engagement.responses || []);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].targetId === targetId && arr[i].requirementId === requirementId) return arr[i];
    }
    return null;
  }

  // "Where this framework sits and who publishes it." Instruments with a
  // narrative pack carry it there; the ones built from the instrument alone
  // (the layered CRA/Machinery instruments, 62443-4-1) carry it on the
  // instrument. Every About section accepts either, so adding the paragraph to
  // a new instrument does not also mean finding the right renderer.
  function seriesContextOf(instrument, narrative) {
    var b = (narrative && narrative.boilerplate) || {};
    return b.series_context || (instrument && instrument.seriesContext) || "";
  }

  // The licence statement an instrument carries for the framework text it
  // reproduces verbatim (Open Government Licence, the CIS terms of use, NIST's
  // public-domain notice). LICENCE.txt says that text is reproduced under the
  // terms recorded here, so the document has to print it, word for word.
  // A string, a list of strings, or an object whose string fields are each a
  // line (`text` first). One line per paragraph, every field kept: the screen
  // and the workbook print each field, and a document that kept only `text`
  // would drop a licence name or link the others carry. Read through
  // Report.attributionLines where it is loaded so all three take the same
  // lines; the copy below is the same rule for a page without it.
  function attributionOf(instrument) {
    var R = window.App && window.App.Report;
    if (R && R.attributionLines) return R.attributionLines(instrument);
    var a = instrument && instrument.attribution, out = [];
    function add(v) { if (typeof v === "string" && v.trim() !== "") out.push(v); }
    if (typeof a === "string") add(a);
    else if (Array.isArray(a)) a.forEach(add);
    else if (a && typeof a === "object") {
      add(a.text);
      Object.keys(a).forEach(function (k) { if (k !== "text") add(a[k]); });
    }
    return out;
  }

  // The attribution paragraphs that close an About section, or nothing at all
  // for an instrument without one. `headed` says whether the caller already
  // opened the section; if not, the paragraphs bring their own heading rather
  // than trailing on the end of whatever section came before it.
  //
  // Not tagged __isBody: a consultant rewording the About prose replaces the
  // leading body paragraphs, and the licence statement is not theirs to
  // reword. Tagged __attribution so that hiding the section does not take it
  // out of the document either (see applyReportCustom).
  function attributionParas(instrument, headed) {
    var lines = attributionOf(instrument);
    if (!lines.length) return [];
    var paras = lines.map(function (t) {
      var p = body(t, { color: COLOR.muted });
      p.__isBody = false; p.__attribution = true;
      return p;
    });
    return (headed === false ? [h1("About this assessment")] : []).concat(paras);
  }

  function frNumOf(frId) { return String(frId).replace(/[^0-9]/g, ""); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ---- doc primitives ---------------------------------------------------

  function run(text, opts) {
    opts = opts || {};
    var r = new window.docx.TextRun({
      text: String(text == null ? "" : text),
      bold: opts.bold || false,
      italics: opts.italics || false,
      color: opts.color,
      size: opts.size,
      font: opts.font
    });
    r.__text = String(text == null ? "" : text);
    return r;
  }

  // The __tags below are read back by applyReportCustom. They have to be set
  // here rather than inferred later: once the real docx library has built a
  // Paragraph, its heading level and text are gone into internal XML and cannot
  // be read off the object. The test mocks happen to keep them, which would
  // have made a post-pass look like it worked while doing nothing in Word.
  function body(text, opts) {
    opts = opts || {};
    var runs = Array.isArray(text) ? text : [run(text, opts)];
    var p = new window.docx.Paragraph({
      style: opts.style || "BodyText",
      children: runs,
      spacing: opts.spacing
    });
    p.__isBody = true;
    // Read by probeSections: which text opens each section.
    p.__text = Array.isArray(text) ? runs.map(function (r) { return (r && r.__text) || ""; }).join("") : String(text == null ? "" : text);
    return p;
  }

  function h1(text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_1,
      children: [run(text)],
      pageBreakBefore: false
    });
    p.__headingText = text; p.__headingLevel = 1;
    return p;
  }
  function h2(text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_2,
      children: [run(text)]
    });
    p.__headingText = text; p.__headingLevel = 2;
    return p;
  }
  // ---- consultant customisation of report sections ----------------------
  //
  // The mirror of Report.decorateSections, over the document's heading tree
  // instead of the DOM. Both slug the GENERATED heading (Report.sectionKey), so
  // an override set on a card on screen lands on the matching Word section.
  //
  //   hidden  the heading and everything under it, up to the next heading of
  //           the same or a higher level, is dropped. On screen it is only
  //           dimmed - the consultant still has to be able to put it back.
  //   title   the heading is rebuilt with the new text at the same level.
  //   prose   the run of body paragraphs OPENING the section is replaced.
  //           Tables, charts and bullets are left alone: prose is the part
  //           that is a judgement call, the numbers are not.
  //
  // A licence attribution (__attribution) inside a hidden section is kept:
  // the framework text it covers is still in the document. It goes into
  // `rescued` when the caller passes one (makeDoc, which puts it at the end of
  // the document), otherwise at the end of the list returned.
  function applyReportCustom(children, engagement, rescued) {
    var R = window.App.Report;
    if (!R || !R.reportCustom) return children;
    var custom = R.reportCustom({ engagement: engagement });
    if (!custom || !Object.keys(custom).length) return children;
    var keyOpts = { engagement: engagement };
    var kept = [];

    // Recursive: an h2 nested under an h1 is its own section and has to be
    // visited in its own right. Walking flat would let the first h1 swallow
    // every h2 below it, which is exactly what it did until it was caught.
    function walk(nodes) {
      var out = [], i = 0;
      while (i < nodes.length) {
        var n = nodes[i];
        if (!n || !n.__headingLevel) { out.push(n); i++; continue; }

        var lvl = n.__headingLevel;
        // A boundary-only heading (a zone's own section in the multi-zone
        // report) closes the section before it but is never looked up: its
        // text is a zone name, which sectionKey strips to nothing, so every
        // zone would share one key and an override on it would take all of
        // them. A heading whose key slugs to nothing cannot be addressed for
        // the same reason.
        var key = n.__boundaryOnly ? "" : R.sectionKey(n.__headingText, keyOpts);
        var c = key ? custom[key] : null;

        // Everything belonging to this section: up to the next heading at the
        // same level or above.
        var end = i + 1;
        while (end < nodes.length) {
          var m = nodes[end];
          if (m && m.__headingLevel && m.__headingLevel <= lvl) break;
          end++;
        }
        var section = nodes.slice(i + 1, end);
        i = end;

        if (c && c.hidden) {                             // heading and subtree
          section.forEach(function (m) { if (m && m.__attribution) kept.push(m); });
          continue;
        }
        var shown = c && c.title
          ? (n.__headingNum ? h1n(n.__headingNum, c.title) : (lvl === 1 ? h1(c.title) : h2(c.title)))
          : n;
        // A renamed heading keeps the key of the section it is (see probeSections).
        if (shown !== n) shown.__sectionKey = key;
        out.push(shown);

        if (c && c.prose) {
          // The generated wording that OPENS the section: the run of body
          // paragraphs before the first table, chart, bullet or sub-heading.
          var k = 0;
          while (k < section.length && section[k] && section[k].__isBody) k++;
          section = section.slice(k);
          var paras = [];
          String(c.prose).split(/\n/).forEach(function (line) {
            if (line.trim() !== "") paras.push(body(line.trim()));
          });
          section = paras.concat(section);
        }

        out = out.concat(walk(section));
      }
      return out;
    }
    var result = walk(children);
    if (!kept.length) return result;
    if (rescued) { rescued.push.apply(rescued, kept); return result; }
    return result.concat(kept);
  }

  // For a review: the wording that opens each section of the finished document,
  // { key, title, texts: [...] } once per heading, by the same rule
  // applyReportCustom uses to decide what a prose override replaces (the run of
  // body paragraphs after the heading). Recorded when opts.sectionProbe is a
  // list; the document itself is untouched.
  function probeSections(sections, engagement, into) {
    var R = window.App.Report;
    (sections || []).forEach(function (s) {
      var nodes = s.children || [];
      nodes.forEach(function (n, i) {
        if (!n || !n.__headingLevel) return;
        var key = n.__boundaryOnly ? "" : (n.__sectionKey || (R ? R.sectionKey(n.__headingText, { engagement: engagement }) : ""));
        var texts = [];
        for (var k = i + 1; k < nodes.length && nodes[k] && nodes[k].__isBody; k++) {
          if (String(nodes[k].__text || "").trim() !== "") texts.push(nodes[k].__text);
        }
        into.push({ key: key, title: n.__headingText, level: n.__headingLevel, boundary: !!n.__boundaryOnly, texts: texts });
      });
    });
  }

  // Every document is built through here so a section override reaches all
  // eight assemblies rather than whichever one was remembered.
  // `opts` is the export's own options: it says whether this is a draft or a
  // final, and makeDoc records on the document what is still to be written
  // (doc.__issues), which packDoc acts on.
  function makeDoc(engagement, cfg, opts) {
    var rescued = [];
    cfg.sections = (cfg.sections || []).map(function (s) {
      return Object.assign({}, s, { children: applyReportCustom(s.children || [], engagement, rescued) });
    });
    // An attribution whose section the consultant hid closes the document,
    // under a heading of its own: left bare after the methodology appendix it
    // read as part of the appendix.
    if (rescued.length && cfg.sections.length) {
      var last = cfg.sections[cfg.sections.length - 1];
      last.children = (last.children || []).concat([h1("Source material")]).concat(rescued);
    }
    // Counted after the section overrides, so a prompt in a hidden section
    // (which will not print) is not reported.
    var issues = [];
    cfg.sections.forEach(function (s) { collectPlaceholders(s.children, issues); });
    if (opts && Array.isArray(opts.sectionProbe)) probeSections(cfg.sections, engagement, opts.sectionProbe);
    if (!isFinal(opts) && !(opts && opts.issueCheck)) markDraft(cfg.sections);
    var doc = new (window.docx.Document)(cfg);
    if (isFinal(opts) && !issues.length) lockAsFinal(doc);
    doc.__issues = issues;
    return doc;
  }

  // A bare paragraph carrying a page break, so the next content starts on a
  // fresh page. Used to give document control its own page before the scorecard.
  function pageBreakPara() {
    return new window.docx.Paragraph({ children: [ new window.docx.PageBreak() ] });
  }
  function caption(text) {
    return new window.docx.Paragraph({
      style: "Caption",
      children: [run(text, { italics: true })]
    });
  }
  // ---- what is still to be written (the ready-to-issue check) -----------
  //
  // Everything the document prints red, for the consultant to complete, goes
  // through placeholderPara or noteRun, and both tag what they make with
  // __placeholder = { text, where }. `where` says where in the tool it is
  // fixed, so the check on the report page can take the consultant there:
  //   { kind: "narrative", field }   a consultant-input field on the report
  //                                  page (regulatoryExposure, topPriorities,
  //                                  method)
  //   { kind: "nextSteps" }          the Proposed next steps section
  //   { kind: "item", itemId, targetId, field }
  //                                  a roadmap entry's plan (impact, action)
  //   { kind: "basis" }              the basis of assessment register
  //   { kind: "raVerdict" }          risk appetite: reasoning for a verdict
  //   { kind: "incomplete" }         risk appetite: assessment not finished
  // makeDoc collects the tags that survive into the finished document (a
  // hidden section's prompts never print, so they are not counted), and that
  // list is what issueCheck returns. The check IS the build, not a second
  // reading of the same fields that could drift away from it.
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
  var NARR_EXPOSURE = { kind: "narrative", field: "regulatoryExposure" };
  var NARR_PRIORITIES = { kind: "narrative", field: "topPriorities" };
  var NARR_METHOD = { kind: "narrative", field: "method" };
  function planWhere(it, field, targetId) {
    return { kind: "item", field: field,
      itemId: it.itemId || it.requirementId || it.outcomeId || it.questionId || it.id,
      targetId: targetId || it.targetId || null };
  }
  function sharedTargetId() {
    return (window.App.Engine && window.App.Engine.SHARED_TARGET_ID) || "__shared";
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

  // ---- draft and final ----------------------------------------------------
  //
  // opts.issueStatus is "final" or anything else (a draft). A draft carries a
  // light diagonal DRAFT watermark on every page and Status Draft in document
  // control. A final carries Status Final, opens read-only (document
  // protection with no password, so the consultant can still lift it) and is
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

  // Read-only with no password (Word's "Restrict editing", which the
  // consultant can switch off) and marked as final. Both are written into the
  // library's own settings and custom-properties parts, so nothing is
  // post-processed. documentProtection must come before evenAndOddHeaders in
  // settings.xml, or Word reports the file as damaged.
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

  // The single way a built document becomes a file. A ready-to-issue check
  // stops here and hands back what would print red; a final with anything
  // still to write is refused rather than written.
  function packDoc(doc, opts, callback) {
    var issues = doc.__issues || [];
    if (opts && opts.issueCheck) { callback(null, { placeholders: issues }); return; }
    if (isFinal(opts) && issues.length) {
      callback(new Error("This report still has " + issues.length + " thing" + (issues.length === 1 ? "" : "s") +
        " to write, so it cannot be issued as final. Export it as a draft, or complete it first."));
      return;
    }
    window.docx.Packer.toBlob(doc).then(function (out) { callback(null, out); }).catch(function (e) { callback(e); });
  }

  // In a check nothing is written, so the charts are not drawn: a blank image
  // stands in for each, and every other line of the build runs as it would
  // for the real export. opts.blankCharts does the same for a build that does
  // write a file, read only for its text (a review's current report).
  var BLANK_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  function rasterise(svg, exportOpts, cb) {
    if (exportOpts && (exportOpts.issueCheck || exportOpts.blankCharts)) {
      var bin = atob(BLANK_PNG), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      cb(new Blob([u], { type: "image/png" }));
      return;
    }
    window.App.Charts.svgToPngBlob(svg, 2, cb);
  }
  function bullet(text) {
    return new window.docx.Paragraph({
      style: "BodyText",
      indent: { left: 360, hanging: 200 },
      children: [run("•  " + text)]
    });
  }
  function labelled(label, text) {
    return new window.docx.Paragraph({
      style: "BodyText",
      indent: { left: 720 },
      children: [run(label + ": ", { bold: true }), run(text || "")]
    });
  }

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

  // ---- fixed-layout / explicit-DXA helpers ------------------------------
  //
  // Tables without explicit column widths get autofit in Word, which often
  // produces a cramped or unbalanced layout. These helpers let callers build
  // a fixed-layout table with explicit DXA column widths that sum to the
  // usable page width. SL and posture continue to use the percentage-based
  // cell/headerCell/table helpers above; CAF (and any new report) should
  // prefer these.
  //   1 inch = 1440 dxa.
  //   A4 portrait usable @ 1in margins = 11906 - 2*1440 = 9026 dxa.
  //   A4 landscape usable @ 0.5in margins = 16838 - 2*720 = 15398 dxa.
  function dxaW(n) {
    return { size: n, type: window.docx.WidthType.DXA };
  }
  function cellDxa(content, widthDxa, opts) {
    opts = opts || {};
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    var children = Array.isArray(content) ? content : [content];
    if (children.length === 0) children = [body("")];
    return new TableCell({
      children: children.map(function (c) {
        if (typeof c === "string") return body(c);
        return c;
      }),
      shading: opts.fill ? { type: ShadingType.SOLID, color: opts.fill, fill: opts.fill } : undefined,
      width: dxaW(widthDxa),
      verticalAlign: opts.valign || "top"
    });
  }
  function headerCellDxa(text, widthDxa) {
    var TableCell = window.docx.TableCell;
    var ShadingType = window.docx.ShadingType;
    return new TableCell({
      children: [ new window.docx.Paragraph({
        style: "BodyText",
        children: [run(text, { bold: true, color: "FFFFFF" })]
      }) ],
      shading: { type: ShadingType.SOLID, color: COLOR.headBg, fill: COLOR.headBg },
      width: dxaW(widthDxa),
      verticalAlign: "center"
    });
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

  // ---- Progress since previous assessment (family-generic) ---------------
  // Built from the flat payload assembled in ui.js from App.Compare (the
  // consultant-loaded baseline diffed against today's responses). Deliberately
  // unnumbered, like Limitations, so it never disturbs the per-family section
  // numbering. Returns [] when no baseline is loaded.
  function progressSection(progress) {
    if (!progress) return [];
    var s = progress.summary || {};
    var children = [ h1("Progress since previous assessment") ];

    var intro = "The results were compared against the previous assessment (" + (progress.sourceLine || "earlier engagement") + ").";
    if (progress.baselineTargetName && progress.targetName && progress.baselineTargetName !== progress.targetName) {
      intro += " " + progress.targetName + " is compared against " + progress.baselineTargetName + " from the previous engagement.";
    }
    children.push(body(intro));

    var line = "Of the items scored in both assessments, " + (s.improved || 0) + " improved, " + (s.regressed || 0) + " regressed and " + (s.unchanged || 0) + " were unchanged.";
    if (s.newlyAssessed) line += " " + s.newlyAssessed + " item" + (s.newlyAssessed === 1 ? " was" : "s were") + " assessed for the first time.";
    if (s.noLongerAssessed) line += " " + s.noLongerAssessed + " previously scored item" + (s.noLongerAssessed === 1 ? " is" : "s are") + " no longer assessed.";
    if (progress.gaps) line += " The number of open gaps moved from " + progress.gaps.prev + " to " + progress.gaps.curr + ".";
    children.push(body(line));

    var moves = progress.movements || [];
    if (moves.length > 0) {
      var W = [900, 2900, 1500, 1300, 1300, 1126]; // = 9026 dxa, A4 portrait @ 1in margins
      var TableRow = window.docx.TableRow;
      var rows = [ buildHeaderRow(["Ref", "Item", "Area", "Previous", "Current", "Change"], W) ];
      moves.forEach(function (m) {
        var improved = m.change === "improved";
        rows.push(new TableRow({ children: [
          cellDxa(m.code, W[0]),
          cellDxa(m.label, W[1]),
          cellDxa(m.group || "", W[2]),
          cellDxa(m.prev, W[3]),
          cellDxa(m.curr, W[4]),
          cellDxa(body([run(improved ? "Improved" : "Regressed", { bold: true, color: improved ? COLOR.met : COLOR.gap })]), W[5], { fill: improved ? COLOR.metBg : COLOR.gapBg })
        ] }));
      });
      children.push(fixedTable(rows, W));
    } else {
      children.push(body("No scored item moved in either direction between the two assessments."));
    }

    // Implemented beyond the requirement - showcase controls done above the
    // selected profile, and which are newly added since the baseline.
    var ab = progress.aboveBaseline || [];
    if (ab.length > 0) {
      children.push(h2("Implemented beyond the requirement"));
      children.push(body(ab.length + " control" + (ab.length === 1 ? "" : "s") + " implemented beyond the selected profile" + (progress.aboveBaselineNew ? ", " + progress.aboveBaselineNew + " added since the previous assessment" : "") + ". These strengthen the estate beyond what the profile requires and do not affect the score."));
      var AW = [1000, 3400, 1700, 1200, 1726];
      var TR2 = window.docx.TableRow;
      var abRows = [ buildHeaderRow(["Ref", "Control", "Area", "State", "Since baseline"], AW) ];
      ab.forEach(function (a) {
        abRows.push(new TR2({ children: [
          cellDxa(a.code, AW[0]),
          cellDxa(a.label, AW[1]),
          cellDxa(a.group || "", AW[2]),
          cellDxa(body([run(a.state, { bold: true, color: COLOR.met })]), AW[3], { fill: COLOR.metBg }),
          cellDxa(a.isNew ? body([run("New", { bold: true, color: COLOR.met })]) : "Maintained", AW[4], { fill: a.isNew ? COLOR.metBg : undefined })
        ] }));
      });
      children.push(fixedTable(abRows, AW));
    }

    if (progress.versionMismatch) {
      children.push(caption("The previous assessment was captured against instrument content version " + progress.baselineContentVersion + "; the current version is " + progress.currentContentVersion + ". Renamed or removed items are compared as not assessed."));
    }
    children.push(caption("Previous responses are re-scored against the current instrument content and targets so both assessments are compared on the same basis; figures can therefore differ from the previous report where content or targets have changed."));
    return children;
  }

  // ---- 1. Title page ----------------------------------------------------

  // ---- brand logo -------------------------------------------------------
  //
  // The SolutionsPT / AVEVA Select lockup is embedded as base64 in js/logo.js
  // (loaded by the page) so the Word export can place it without a network or
  // file fetch. If that module is absent, every helper here no-ops so document
  // generation never fails for a missing logo.
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
  // Larger logo paragraph for the top of a title page.
  function titleLogoParagraph() {
    var img = logoImageRun(300);
    if (!img) return null;
    return new window.docx.Paragraph({ spacing: { after: 220 }, children: [img] });
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
  // For the section that carries the report's title page: logo on every page
  // EXCEPT the first, which gets a blank header (the title page already shows
  // the logo in the body, so a header logo there is redundant). Pair this with
  // `titlePage: true` in the section properties so Word uses the `first` header
  // for page 1.
  function brandHeadersTitleSection() {
    var hd = brandHeaderObj();
    if (!hd) return undefined;
    return {
      default: hd,
      first: new window.docx.Header({ children: [ new window.docx.Paragraph({}) ] })
    };
  }

  function titlePage(engagement, instrument) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var metaRows = [
      ["Client", e.clientName],
      ["Site", e.siteName],
      ["Address", e.siteAddress],
      ["Site contact", e.siteContact],
      ["Consultant", e.consultant],
      ["Date of visit", e.dateOfVisit],
      ["Opportunity ID", e.opportunityId]
    ];
    var rows = metaRows.map(function (r) {
      return new TableRow({ children: [
        cell(body(r[0], {}), { width: 28, fill: COLOR.subBg }),
        cell(body(r[1] || "", {}), { width: 72 })
      ] });
    });

    var out = [];
    var lg = titleLogoParagraph();
    if (lg) out.push(lg);
    return out.concat([
      new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.TITLE,
        children: [run(instrument.title)]
      }),
      body("Site security assessment", { style: "Caption" }),
      body("", { spacing: { after: 200 } }),
      table(rows),
      body("", { spacing: { after: 200 } })
    ]);
  }

  // ---- 2. Document control ---------------------------------------------

  function documentControl(engagement, instrument, opts) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var pairs = [
      ["Document revision", e.documentRevision],
      ["Status",            statusLabel(opts)],
      ["QA review by",      e.qaReviewBy],
      ["Authorised by",     e.authorisedBy],
      ["Issued to",         e.issuedTo],
      ["Issued date",       e.issuedDate],
      ["Confidentiality",   e.confidentiality],
      ["Instrument",        instrument.title],
      ["Edition",           instrument.edition || ""],
      ["Content version",   instrument.contentVersion || ""]
    ];
    var rows = pairs.map(function (r) {
      return new TableRow({ children: [
        cell(body(r[0]), { width: 32, fill: COLOR.subBg }),
        cell(body(r[1] || ""), { width: 68 })
      ] });
    });
    return [
      h1("Document control and confidentiality"),
      table(rows),
      body("", { spacing: { after: 200 } })
    ];
  }

  // ---- Basis of assessment (evidence register, family-generic) ----------
  // Reads the per-assessment basisOfAssessment (interviews / documents / systems
  // observed), projected to the engagement top level; falls back to the legacy
  // project-level location for old files. Unnumbered, like Limitations, so it
  // never disturbs the per-family section numbering. Returns [] when empty.
  function basisOfAssessmentSection(engagement) {
    var b = engagement.basisOfAssessment || (engagement.engagement && engagement.engagement.basisOfAssessment) || {};
    function nonEmpty(rows, keys) {
      return (rows || []).filter(function (r) {
        return keys.some(function (k) { return r[k] && String(r[k]).trim() !== ""; });
      });
    }
    var interviews   = nonEmpty(b.interviews, ["name", "role", "date"]);
    var documents    = nonEmpty(b.documents, ["title", "reference", "date"]);
    var observations = nonEmpty(b.observations, ["name", "method"]);
    if (!interviews.length && !documents.length && !observations.length) return [];

    var TableRow = window.docx.TableRow;
    function subtable(title, headers, widths, rows, project) {
      var headRow = new TableRow({ children: headers.map(function (hd, i) { return headerCell(hd, widths[i]); }) });
      var dataRows = rows.map(function (r) {
        var vals = project(r);
        return new TableRow({ children: vals.map(function (v, i) { return cell(body(v || ""), { width: widths[i] }); }) });
      });
      return [ h2(title), table([headRow].concat(dataRows)), body("", { spacing: { after: 120 } }) ];
    }

    var children = [
      h1("Basis of assessment"),
      body("The findings and verdicts in this report rest on the interviews, documents and system observations recorded below.")
    ];
    if (interviews.length) {
      children = children.concat(subtable("People interviewed", ["Name", "Role", "Date"], [40, 40, 20], interviews,
        function (r) { return [r.name, r.role, r.date]; }));
    }
    if (documents.length) {
      children = children.concat(subtable("Documents reviewed", ["Title", "Reference / version", "Date"], [45, 35, 20], documents,
        function (r) { return [r.title, r.reference, r.date]; }));
    }
    if (observations.length) {
      children = children.concat(subtable("Systems observed", ["System / environment", "How observed"], [45, 55], observations,
        function (r) { return [r.name, r.method]; }));
    }
    return children;
  }

  // Short executive-summary acknowledgements that a comparator and/or an
  // evidence basis exist, with a pointer to the full section. Family-generic;
  // inserted at each exec-summary call site (after the summary body, before the
  // caveat block). Returns [] for the progress line when no baseline is loaded;
  // the basis line always renders (a red consultant prompt when nothing is
  // recorded, matching the tool's "complete-before-issue" convention).
  function basisRowCount(engagement) {
    var b = engagement.basisOfAssessment || (engagement.engagement && engagement.engagement.basisOfAssessment) || {};
    function cnt(rows, keys) {
      return (rows || []).filter(function (r) {
        return keys.some(function (k) { return r[k] && String(r[k]).trim() !== ""; });
      }).length;
    }
    return {
      interviews: cnt(b.interviews, ["name", "role", "date"]),
      documents: cnt(b.documents, ["title", "reference", "date"]),
      observations: cnt(b.observations, ["name", "method"])
    };
  }
  function joinList(parts) {
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }
  // Pure text builder (no docx objects) so the wording is unit-testable.
  // Returns [{ text, note }] where note=true marks the red consultant prompt.
  function execSummaryAddendaText(engagement, progress) {
    var out = [];

    if (progress && progress.summary) {
      var s = progress.summary;
      var txt = "This is a re-assessment. Compared with the previous assessment (" +
        (progress.sourceLine || "an earlier engagement") + "), " +
        (s.improved || 0) + " scored item" + (s.improved === 1 ? "" : "s") + " improved and " +
        (s.regressed || 0) + " regressed";
      if (progress.gaps) {
        txt += ", and the number of open gaps moved from " + progress.gaps.prev + " to " + progress.gaps.curr;
      }
      txt += ". The full comparison is set out in the “Progress since previous assessment” section.";
      out.push({ text: txt, note: false });
    }

    var c = basisRowCount(engagement);
    if (c.interviews + c.documents + c.observations > 0) {
      var parts = [];
      if (c.interviews)   parts.push(c.interviews + " interview" + (c.interviews === 1 ? "" : "s"));
      if (c.documents)    parts.push(c.documents + " document" + (c.documents === 1 ? "" : "s") + " reviewed");
      if (c.observations) parts.push(c.observations + " system" + (c.observations === 1 ? "" : "s") + " observed");
      out.push({ text: "This assessment is based on " + joinList(parts) + ", set out in the “Basis of assessment” section.", note: false });
    } else {
      out.push({ text: "Basis of assessment not yet recorded. Capture the interviews, documents reviewed and systems observed on the engagement page so this report shows what each verdict rests on.", note: true });
    }
    return out;
  }
  function execSummaryAddenda(engagement, progress) {
    return execSummaryAddendaText(engagement, progress).map(function (row) {
      return row.note
        ? body([noteRun(row.text, { kind: "basis" }, { italics: true })])
        : body(row.text);
    });
  }

  // ---- 3. Executive summary --------------------------------------------

  // The FR counts by the scorer's own definitions, so the executive summary,
  // scope and limitations agree with the "N of M FRs assessed" on the tiles.
  // Counted locally by answeredCount they did not: an FR at SL-T 0 (out of
  // scope) and an FR whose every item is a justified N/A (assessed, nothing
  // to do) both landed under "not assessed", and one document carried three
  // different numbers for the same fact. The fallbacks keep a result without
  // those fields (an older score, a test mock) on the old reading.
  function buildScopeCounts(scored) {
    var perFR = scored.perFR || [];
    var notAssessedFRs = scored.notAssessedFRs || perFR.filter(function (f) {
      return f.inScope !== false && f.answeredCount === 0 && !(f.countedCount === 0);
    });
    var outOfScopeFRs = scored.outOfScopeFRs || perFR.filter(function (f) { return f.inScope === false; });
    var inScope = typeof scored.inScopeFRCount === "number" ? scored.inScopeFRCount : perFR.length - outOfScopeFRs.length;
    // Answered in part, nothing short: assessed, but not fully.
    var partlyFRs = scored.partlyAssessedFRs || [];
    return { assessed: inScope - notAssessedFRs.length, notAssessed: notAssessedFRs.length,
             outOfScope: outOfScopeFRs.length, inScope: inScope,
             partly: partlyFRs.length, partlyFRs: partlyFRs,
             notAssessedFRs: notAssessedFRs, outOfScopeFRs: outOfScopeFRs };
  }
  // Requirements answered in part with nothing short, by code: on the roadmap
  // as "To assess", and named once in the limitations.
  function toAssessCodes(scored) {
    return ((scored && scored.roadmap) || []).filter(function (r) { return r.toAssess; })
      .map(function (r) { return r.code; });
  }
  function frCountWord(n) { return n === 1 ? "Foundational Requirement" : "Foundational Requirements"; }
  // "FR7 Resource availability; ..." for a list of perFR entries.
  function frNameList(scored, frs, taxonomy) {
    return frs.map(function (fr) {
      var t = taxonomy ? (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] : lookupFR(scored, fr.frId);
      return fr.frId + (t ? " " + t.name : "");
    }).join("; ");
  }

  // "Is the target met?" in the same words as the screen tile
  // (App.Report.slTargetMetWords), with the colours the document uses. Met so
  // far with Foundational Requirements still to assess reads "Not yet" and
  // says how many were assessed, never a bare yes or no.
  function slTargetMet(scored) {
    var tm = window.App.Report.slTargetMetWords(scored);
    tm.color = { met: COLOR.met, near: COLOR.near, gap: COLOR.gap }[tm.band] || COLOR.muted;
    tm.fill  = { met: COLOR.metBg, near: COLOR.nearBg, gap: COLOR.gapBg }[tm.band] || COLOR.naBg;
    return tm;
  }

  function executiveSummary(narrative, scored, engagement) {
    var t = narrative.templates;
    var children = [
      h1n("1", "Executive summary"),
      body(narrative.boilerplate.report_intro)
    ];

    if (window.App.Report.slAnyAnswered(scored)) {
      // Label/value headline lines (no editorial prose).
      var tm = slTargetMet(scored);
      children.push(body("Overall target met: " + tm.value + (tm.detail ? " (" + tm.detail + ")" : "") + "."));

      // Weakest FR composition. If only one FR is tied at the lowest
      // conformant SL, use the existing fr_result_assessed template (a single
      // composed sentence). If several FRs share the lowest level, drop into
      // a label-value line that lists them all - the singular template's
      // grammar would break otherwise, and we still avoid writing prose.
      var ties = scored.weakestFRs || (scored.weakestFR ? [scored.weakestFR] : []);
      if (ties.length === 1) {
        var weakest = ties[0];
        var taxFR = lookupFR(scored, weakest.frId);
        var naCount = weakest.reqNACount || 0;
        var naClause = naCount > 0 ? interp(t.na_clause, { naCount: naCount }) : "";
        var weakestSentence = interp(t.fr_result_assessed, {
          frNum: frNumOf(weakest.frId),
          frName: taxFR ? taxFR.name : weakest.frId,
          achievedSL: S.formatSL(weakest.conformantAchievedSL),
          targetSL: S.formatSL(weakest.targetSL),
          metCount: weakest.metCount,
          applicableCount: weakest.reqApplicableCount,
          naClause: naClause == null ? "" : naClause
        });
        if (weakestSentence) children.push(body("Weakest Foundational Requirement: " + weakestSentence));
      } else if (ties.length > 1) {
        var ids = ties.map(function (f) { return f.frId; }).join(", ");
        var sl  = ties[0].conformantAchievedSL;
        var allSameTarget = ties.every(function (f) { return f.targetSL === ties[0].targetSL; });
        var detail = "all reached " + S.formatSL(sl);
        if (allSameTarget) detail += " against target " + S.formatSL(ties[0].targetSL);
        children.push(body("Weakest Foundational Requirements: " + ids + " (" + detail + ")."));
      }

      var counts = buildScopeCounts(scored);
      var scopeLine = interp(t.scope_assessed_line, { assessedCount: counts.assessed, notAssessedCount: counts.notAssessed });
      if (scopeLine) {
        // Out of scope (SL-T 0) is neither assessed nor missed, so it is
        // said separately or the two counts would not add up to seven.
        if (counts.outOfScope) scopeLine += " " + counts.outOfScope + " " + (counts.outOfScope === 1 ? "was" : "were") +
          " out of scope, with a target of SL 0.";
        children.push(body(scopeLine));
      }

      children.push(body("Overall closeness across assessed Foundational Requirements: " + S.formatPct(scored.overallCloseness) + "."));

      var allDefault = engagement.targetProfile && (!engagement.targetProfile.perFR || Object.keys(engagement.targetProfile.perFR).length === 0);
      if (allDefault) {
        var flag = interp(t.default_target_flag, { targetSL: S.formatSL(engagement.targetProfile.defaultTargetSL) });
        if (flag) children.push(body(flag));
      }
    }

    return children;
  }

  function slFRName(scored, frId) {
    var t = lookupFR(scored, frId);
    return frId + (t && t.name ? " " + t.name : "");
  }

  // Composed executive summary for the capability-SL family, mirroring the CAF
  // and NIS2 composers: boilerplate verbatim, templates slot-substituted,
  // consultant blocks seeded with data-derived facts plus a marked placeholder.
  // SL aim: the Security Level each Foundational Requirement achieves against its
  // target (set by the weakest applicable requirement), with floor findings as
  // priorities. Falls back to the label/value executiveSummary if no pack.
  // sys (multi-zone report only): { rollup, summaryLine }. `scored` is then the
  // lead zone, and sys holds the summary to what is true of the whole system.
  function slExecutiveSummary(narrative, scored, engagement, sys) {
    var es = narrative && narrative.executiveSummary;
    if (!es) return executiveSummary(narrative, scored, engagement);

    var children = [ h1n("1", "Executive summary") ];
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var phrases = T.verdictPhrases || {}, floorFrags = T.floorFragments || {}, gcFrags = T.gapConcentrationFragments || {};
    var clientName = e.clientName || "the system";

    var measurable = (scored.perFR || []).filter(function (f) { return f.answeredCount > 0; });
    if (measurable.length === 0) {
      children.push(body(narrative.boilerplate.report_intro));
      children.push(body("No Foundational Requirements were assessed in this engagement, so no Security Level position can be reported."));
      return children;
    }

    // Short means an answered item falls short. An FR met so far with items
    // still blank is neither met nor short, and is said separately.
    function frStatusOf(f) { return f.frTargetStatus || (f.frTargetMet ? "met" : "short"); }
    var belowFRs = measurable.filter(function (f) { return frStatusOf(f) === "short"; });
    var partlyFRs = measurable.filter(function (f) { return frStatusOf(f) === "incomplete"; });
    var metFRCount = measurable.length - belowFRs.length - partlyFRs.length;
    var belowFRCount = belowFRs.length;
    var floorCount = scored.floorFlagCount || 0;
    // Requirements still to assess sit on the roadmap so the work list is
    // complete, but they are not gaps and do not make the verdict one.
    var roadmap = (scored.roadmap || []).filter(function (r) { return !r.toAssess; });
    var hasGaps = roadmap.length > 0 || belowFRCount > 0;

    // On a zoned system "meets the target" is a claim about every zone, so it
    // is made only when no assessed zone falls short, whichever zone the
    // figures come from.
    var systemShort = !!(sys && sys.rollup && (sys.rollup.zonesShort || []).length);
    // Met so far with part of the scope still to assess keeps the met phrase,
    // which already speaks only of the assessed Foundational Requirements, and
    // says the result is not final: the verdict must not read as the target
    // met overall while part of the scope is unexamined. On a zoned system
    // that includes a zone nobody has answered yet, which is less examined
    // than a zone met so far and must not read more confidently.
    var leadStatus = scored.overallTargetStatus || (scored.overallTargetMet ? "met" : "short");
    var anyIncomplete = leadStatus === "incomplete" ||
      !!(sys && sys.rollup && ((sys.rollup.zonesIncomplete || []).length || (sys.rollup.zonesNotAssessed || []).length));
    var verdictPhrase, incompleteSentence = "";
    if ((leadStatus === "met" || leadStatus === "incomplete") && !systemShort) {
      verdictPhrase = phrases.met + (anyIncomplete && phrases.met ? " so far" : "");
      // Its own sentence, after the verdict, so the exec_verdict template's
      // ", with the weakest protection in ..." does not run on behind it. On a
      // zoned system the zone summary line that follows names what is still
      // outstanding, so it is not said twice.
      if (anyIncomplete && phrases.met && !(sys && sys.summaryLine)) {
        incompleteSentence = (scored.partlyAssessedFRs || []).length
          ? " Not every Foundational Requirement in scope has been fully assessed yet, so the target is not yet shown to be met."
          : " Not every Foundational Requirement in scope has been assessed yet, so the target is not yet shown to be met.";
      }
    }
    else if (floorCount > 0) verdictPhrase = phrases.short;
    else verdictPhrase = phrases.close;
    if (systemShort) hasGaps = true;

    var ties = scored.weakestFRs || (scored.weakestFR ? [scored.weakestFR] : []);
    var weakestFRName, weakestFRDetail;
    if (ties.length === 1) {
      var w = ties[0];
      weakestFRName = slFRName(scored, w.frId);
      weakestFRDetail = "the achieved level is " + S.formatSL(w.conformantAchievedSL) + " against a target of " + S.formatSL(w.targetSL)
        + (w.floorFlagCount > 0 ? ", and " + w.floorFlagCount + " requirement(s) are floor-flagged" : "");
    } else if (ties.length > 1) {
      weakestFRName = nis2ListJoin(ties.map(function (f) { return slFRName(scored, f.frId); }));
      weakestFRDetail = "each reaches only " + S.formatSL(ties[0].conformantAchievedSL);
    } else {
      weakestFRName = "no single Foundational Requirement";
      weakestFRDetail = "no Foundational Requirement is below its target";
    }

    var nearAreas = [], floorAreas = [];
    belowFRs.forEach(function (f) {
      if (f.floorFlagCount > 0) floorAreas.push(slFRName(scored, f.frId));
      else nearAreas.push(slFRName(scored, f.frId));
    });
    function bucket(names, clause) {
      if (!names.length) return "";
      if (names.length <= 3) return "In " + nis2ListJoin(names) + ", " + clause + ".";
      return "Across " + names.length + " Foundational Requirements, " + clause + ".";
    }
    var gcParts = [];
    var nearB = bucket(nearAreas, gcFrags.nearClause || ""); if (nearB) gcParts.push(nearB);
    var floorB = bucket(floorAreas, gcFrags.floorClause || ""); if (floorB) gcParts.push(floorB);
    var gapConcentrationSentence = gcParts.join(" ");

    var counts = buildScopeCounts(scored);
    var naParts = [];
    if (counts.notAssessed > 0) naParts.push(counts.notAssessed + " Foundational Requirement(s) were not assessed");
    if (counts.outOfScope > 0) naParts.push((naParts.length ? String(counts.outOfScope) : counts.outOfScope + " " + frCountWord(counts.outOfScope)) +
      " " + (counts.outOfScope === 1 ? "was" : "were") + " out of scope");
    var notAssessedClause = naParts.length ? " (" + naParts.join(" and ") + ")" : "";
    var floorClause = floorCount > 0 ? nis2Fill(floorFrags.some, { floorCount: floorCount }) : (floorFrags.none || "");
    var coverage = scored.totalApplicable > 0 ? (scored.totalAnswered / scored.totalApplicable) : 0;
    var confidenceLabel = coverage >= 0.9 ? "high confidence" : (coverage >= 0.7 ? "moderate confidence" : "low confidence");
    var topHint = roadmap.slice(0, 2).map(function (r) { return r.code + " " + r.title; });
    var autoTopPriorityHint = topHint.length ? nis2ListJoin(topHint) : "the highest-priority requirements in the roadmap";

    var slots = {
      clientName: clientName, verdictPhrase: verdictPhrase,
      weakestFRName: weakestFRName, weakestFRDetail: weakestFRDetail,
      assessedFRCount: counts.assessed, answeredReqCount: scored.totalAnswered, notAssessedClause: notAssessedClause,
      metFRCount: metFRCount, belowFRCount: belowFRCount, floorClause: floorClause, floorCount: floorCount,
      gapConcentrationSentence: gapConcentrationSentence,
      coveragePct: S.formatPct(coverage), confidenceLabel: confidenceLabel, closenessPct: S.formatPct(scored.overallCloseness),
      autoTopPriorityHint: autoTopPriorityHint
    };

    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots) + incompleteSentence));
    if (sys && sys.summaryLine) children.push(body(sys.summaryLine));
    // The profile sentence counts met and short; an FR answered in part with
    // nothing short is neither, so the pack's partly variant counts it in the
    // same sentence, or the counts would not add up to the FRs assessed. A
    // pack without the variant gets a sentence of its own after the profile.
    var profileText, partlySentence = "";
    if (partlyFRs.length) {
      slots.partlyFRCount = partlyFRs.length;
      slots.partlyFRList = nis2ListJoin(partlyFRs.map(function (f) { return f.frId; }));
      slots.partlyFRVerb = partlyFRs.length === 1 ? "is" : "are";
    }
    if (partlyFRs.length && T.exec_profile_partly) profileText = nis2Fill(T.exec_profile_partly, slots);
    else {
      profileText = nis2Fill(T.exec_profile, slots);
      if (partlyFRs.length) partlySentence = " " + slots.partlyFRList + (partlyFRs.length === 1 ? " has" : " have") +
        " nothing short so far but still " + (partlyFRs.length === 1 ? "has" : "have") + " items to assess.";
    }
    children.push(body(nis2Fill(T.exec_scope, slots) + " " + profileText + partlySentence));
    if (hasGaps && gapConcentrationSentence) children.push(body(nis2Fill(T.exec_gap_shape, slots)));
    if (B.exec_weakest_link) children.push(body(B.exec_weakest_link));
    if (B.stakes) children.push(body(B.stakes));

    slots.floorExposureClause = floorCount > 0 ? (CB.consultant_exposure_floor_clause || "") : "";
    if (CB.consultant_exposure_seed) children.push(body(nis2Fill(CB.consultant_exposure_seed, slots)));
    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else if (CB.consultant_exposure) children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));

    if (hasGaps) {
      var topPri = (rn.topPriorities || "").trim();
      children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
      if (topPri) children.push(body(topPri));
      else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    }
    children.push(body(nis2Fill(T.exec_confidence, slots)));
    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));
    return children;
  }

  // Caveat box that closes the SL executive summary (mirrors cafNotFormalCaveatBlock).
  function slNotCertificationCaveatBlock(narrative) {
    var caveat = narrative.boilerplate && narrative.boilerplate.not_certification_caveat;
    if (!caveat) return [];
    var TableRow = window.docx.TableRow, WidthType = window.docx.WidthType, Table = window.docx.Table, ShadingType = window.docx.ShadingType, TableCell = window.docx.TableCell;
    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [ new TableCell({
        children: [
          new window.docx.Paragraph({ style: "BodyText", children: [run("Capability assessment, not a certification", { bold: true, color: COLOR.gap })] }),
          new window.docx.Paragraph({ style: "BodyText", children: [run(caveat)] })
        ],
        shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
      }) ] }) ]
    });
    return [ tbl, body("", { spacing: { after: 160 } }) ];
  }

  // ---- 4. About this assessment ----------------------------------------

  // report_intro says what the report is and who it is for. The executive
  // summary now opens with the verdict rather than with that preamble, so the
  // paragraph belongs here - otherwise it is authored boilerplate that never
  // reaches the page.
  function aboutSection(narrative, instrument) {
    var children = [h1("About this assessment")];
    if (narrative.boilerplate.report_intro) children.push(body(narrative.boilerplate.report_intro));
    children.push(body(narrative.boilerplate.about_instrument));
    // Where this part sits in the 62443 series. A reader who has only ever
    // seen "62443" needs to know which slice of it this report is, and which
    // questions it therefore does not answer.
    var sc = seriesContextOf(null, narrative);
    if (sc) children.push(body(sc));
    children.push(body(narrative.boilerplate.security_levels));
    return children.concat(attributionParas(instrument, true));
  }

  // ---- 5. Scope and method ---------------------------------------------

  // sites (multi-zone report only): every zone, so the FR counts are given
  // per zone rather than as the lead zone's.
  function scopeAndMethod(narrative, engagement, instrument, scored, sites) {
    var children = [h1("Scope and method")];
    var e = engagement.engagement || {};
    var counts = buildScopeCounts(scored);

    // Composed scope lines - assembled only by substituting values into fixed strings.
    if (instrument.title) {
      children.push(body("Instrument: " + instrument.title + (instrument.edition ? " (" + instrument.edition + " edition)" : "") + "."));
    }
    var siteNames = (engagement.targets || []).map(function (t) { return t.name; }).join(", ");
    var siteLabel = (instrument.targetDimensionLabel || "Site");
    if (siteNames) {
      // An instrument may state its own plural ("Zones and conduits"), since
      // naive pluralisation mangles a compound label.
      var siteLabelPlural = instrument.targetDimensionLabelPlural ||
        (/[^aeiou]y$/i.test(siteLabel) ? siteLabel.slice(0, -1) + "ies" : siteLabel + "s");
      var pluralLabel = engagement.targets.length === 1 ? siteLabel : siteLabelPlural;
      children.push(body(pluralLabel + " assessed: " + siteNames + "."));
    }
    if (engagement.targetProfile) {
      children.push(body("Default target Security Level: " + S.formatSL(engagement.targetProfile.defaultTargetSL) + "."));
      var perFRkeys = Object.keys(engagement.targetProfile.perFR || {});
      if (perFRkeys.length > 0) {
        var parts = perFRkeys.map(function (k) { return k + " " + S.formatSL(engagement.targetProfile.perFR[k]); });
        children.push(body("Per-FR target overrides: " + parts.join(", ") + "."));
      }
    }
    if (e.dateOfVisit) children.push(body("Date of assessment: " + e.dateOfVisit + "."));
    if (e.consultant)  children.push(body("Consultant: " + e.consultant + "."));

    if (sites && sites.length > 1) {
      // Zoned: one zone's counts here read as the system's, and printed
      // "7 of 7" while another zone had not been looked at. Each zone's own
      // figure instead; the zone sections list what each one left out.
      children.push(body("Foundational Requirements assessed, by " + scopeNoun(instrument) + ": " +
        sites.map(function (s) {
          var c = buildScopeCounts(s.result);
          return s.target.name + " " + (window.App.Report.slAnyAnswered(s.result)
            ? c.assessed + " of " + c.inScope + (c.partly ? " (" + c.partly + " only in part)" : "") : "none");
        }).join("; ") + "."));
    } else {
      children.push(body("Foundational Requirements assessed: " + counts.assessed + " of " + counts.inScope +
        (counts.outOfScope ? " in scope" : "") + (counts.partly ? " (" + counts.partly + " only in part)" : "") + "."));
      if (counts.notAssessed > 0) {
        children.push(body("Foundational Requirements not assessed: " + frNameList(scored, counts.notAssessedFRs) + "."));
      }
      if (counts.outOfScope > 0) {
        children.push(body("Foundational Requirements out of scope (target SL 0): " + frNameList(scored, counts.outOfScopeFRs) + "."));
      }
    }

    children.push(body("", { spacing: { before: 80 } }));
    children = children.concat(methodParas(narrative.boilerplate.method, engagement));
    return children;
  }

  // ---- 6. How to read --------------------------------------------------

  function howToRead(narrative) {
    return [
      h1("How to read this report"),
      body(narrative.boilerplate.how_to_read)
    ];
  }

  // ---- 7. Overall posture ----------------------------------------------

  function overallPosture(scored, target, taxonomy, radarBuf) {
    var TableRow = window.docx.TableRow;
    var ImageRun = window.docx.ImageRun;
    var tmPosture = slTargetMet(scored);

    var kpis = table([
      new TableRow({ children: [
        headerCell("Overall target met", 25),
        headerCell("Weakest FR", 25),
        headerCell("Floor flags", 25),
        headerCell("Closeness (context)", 25)
      ] }),
      new TableRow({ children: [
        cell(body(tmPosture.value + (tmPosture.detail ? " (" + tmPosture.detail + ")" : ""),
                  { /* style */ }), { fill: tmPosture.fill }),
        cell(body(scored.weakestFR ? (scored.weakestFR.frId + " - " + S.formatSL(scored.weakestFR.conformantAchievedSL)) : "-")),
        cell(body(String(scored.floorFlagCount)),
             { fill: scored.floorFlagCount > 0 ? COLOR.gapBg : COLOR.metBg }),
        cell(body(S.formatPct(scored.overallCloseness)))
      ] })
    ]);

    var children = [
      h1(target ? "Overall posture: " + target.name : "Overall posture"),
      kpis,
      body("", { spacing: { after: 120 } })
    ];

    if (radarBuf) {
      children.push(h2("FR achievement vs target"));
      children.push(new window.docx.Paragraph({
        style: "BodyText",
        children: [new ImageRun({ data: radarBuf, transformation: { width: 380, height: 380 } })]
      }));
    }

    // Per-FR breakdown table
    children.push(h2("FR breakdown"));
    var headRow = new TableRow({ children: [
      headerCell("FR", 8), headerCell("Title", 38),
      headerCell("Target", 9), headerCell("Achieved SL", 14),
      headerCell("Closeness", 11), headerCell("Floor", 7),
      headerCell("Target met", 13)
    ] });
    var rows = [headRow];
    scored.perFR.forEach(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      var fill = fr.answeredCount === 0 ? COLOR.naBg : bandBg(fr.closenessBand);
      rows.push(new TableRow({ children: [
        cell(body(fr.frId)),
        cell(body(taxFR.name)),
        cell(body(S.formatSL(fr.targetSL))),
        cell(body(fr.answeredCount === 0 ? "-" : S.formatSL(fr.conformantAchievedSL))),
        cell(body(S.formatPct(fr.closeness)), { fill: fill }),
        cell(body(String(fr.floorFlagCount)),
             { fill: fr.floorFlagCount > 0 ? COLOR.gapBg : undefined }),
        // Same words as the screen (App.Report.frTargetWords): "Not yet" for
        // an FR met so far with items still to assess, "No" only for a shortfall.
        (function () {
          var w = window.App.Report.frTargetWords(fr);
          return cell(body(w.value),
            { fill: { met: COLOR.metBg, near: COLOR.nearBg, gap: COLOR.gapBg }[w.band] || COLOR.naBg });
        })()
      ] }));
    });
    children.push(table(rows));
    return children;
  }

  // ---- 8. Findings by FR -----------------------------------------------

  // sectionNum: the number for the section heading, or null when this block
  // sits inside a numbered per-zone section and must not carry a number of its
  // own (the multi-zone report, where it appears once per zone).
  // Fixed explanatory text printed once per document. The multi-zone report
  // runs the same per-zone builders once for every zone, and each pass used
  // to reprint the same explanations (what each FR covers, why a requirement
  // matters, how to read a scorecard), so a three-zone report said most of
  // its standing text three times. buildSLMultiSite switches this on for the
  // length of one build; everywhere else it is null and everything prints.
  var printedOnce = null;
  function firstTime(key) {
    if (!printedOnce) return true;
    if (printedOnce[key]) return false;
    printedOnce[key] = true;
    return true;
  }

  function findingsByFR(narrative, scored, taxonomy, engagement, targetId, sectionNum) {
    var t = narrative.templates;
    var fn = narrative.fr_narrative;
    var customF = (engagement && engagement.reportCustom) || {};
    var glossaryHidden = !!(customF["terms-used-in-this-report"] && customF["terms-used-in-this-report"].hidden);
    var head = sectionNum === null ? h2("Findings by Foundational Requirement")
                                   : h1n(sectionNum || "2", "Findings by Foundational Requirement");
    var children = [ head ];

    // Evidence recorded once for the whole system (the shared layer) is given
    // under the first zone that cites it, not reprinted under every zone.
    function showEvidence(r) {
      if (!r.evidence || String(r.evidence).trim() === "") return false;
      if (r.evidenceSource !== "shared") return true;
      return firstTime("sl-ev-f:" + r.requirementId);
    }
    if (printedOnce) {
      var sharedSeen = 0;
      scored.perFR.forEach(function (fr) {
        (fr.reqs || []).forEach(function (r) {
          if (r.evidenceSource === "shared" && r.evidence && printedOnce["sl-ev-f:" + r.requirementId]) sharedSeen++;
        });
      });
      if (sharedSeen) {
        children.push(body("Evidence recorded once for the whole system is given under the first " + (printedOnce.__noun || "zone") + " that cites it.",
          { color: COLOR.muted }));
      }
    }

    // Requirements that MEET their target and carry evidence. The same words
    // for every instrument in the family, so this sits in code rather than in
    // each narrative pack.
    function evidencedInPlace(fr) {
      var evidenced = (fr.reqs || []).filter(function (r) {
        return r.met && r.evidence && String(r.evidence).trim() !== "";
      });
      if (!evidenced.length) return [];
      var out = [ body(evidenced.length === 1
        ? "One requirement meets its target on the evidence recorded below."
        : evidenced.length + " requirements meet their target on the evidence recorded below.") ];
      evidenced.forEach(function (er) {
        out.push(bullet(er.code + "  " + er.title + ": met at " + S.formatSL(er.achievedShown) + "."));
        if (showEvidence(er)) out.push(labelled("Evidence", er.evidence));
        if (er.notes && String(er.notes).trim() !== "") out.push(labelled("Notes", er.notes));
      });
      return out;
    }

    scored.perFR.forEach(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      var narr  = fn[fr.frId];

      children.push(h2(fr.frId + " " + (taxFR.name || "")));
      // What the FR covers is its glossary definition, so it is not repeated
      // here unless the consultant has hidden the glossary. Why it matters in
      // OT is said only here, under the first zone where there are several.
      if (firstTime("fr-narrative:" + fr.frId)) {
        if (narr && narr.purpose && glossaryHidden) children.push(body(narr.purpose));
        if (narr && narr.why_it_matters)  children.push(body(narr.why_it_matters));
      }

      if (fr.answeredCount === 0) {
        var notAssessed = interp(t.fr_not_assessed, { frNum: frNumOf(fr.frId), frName: taxFR.name });
        if (notAssessed) children.push(body(notAssessed));
        return;
      }

      // Requirement counts, not item counts: the sentence says "requirement(s)".
      var naCount = fr.reqNACount || 0;
      var naClause = naCount > 0 ? interp(t.na_clause, { naCount: naCount }) : "";
      var summary = interp(t.fr_result_assessed, {
        frNum: frNumOf(fr.frId), frName: taxFR.name,
        achievedSL: S.formatSL(fr.conformantAchievedSL),
        targetSL: S.formatSL(fr.targetSL),
        metCount: fr.metCount, applicableCount: fr.reqApplicableCount,
        naClause: naClause == null ? "" : naClause
      });
      if (summary) children.push(body(summary));

      // Only an answered shortfall "fell short". A requirement with items
      // still blank and nothing short is work to do; the limitations name
      // those once, so they are not listed again here.
      var applicableReqs = fr.reqs.filter(function (r) {
        return r.scopedCount > 0 && r.countedCount > 0 && !r.met;
      });
      var missed = applicableReqs.filter(function (r) { return !r.status || r.status === "short"; });
      var pending = applicableReqs.filter(function (r) { return r.status === "to-assess" || r.status === "unassessed"; });

      if (missed.length === 0 && pending.length === 0) {
        if (t.fr_all_met) children.push(body(t.fr_all_met));
      } else if (missed.length === 0) {
        children.push(body("No requirement answered so far falls short of the target; some items are still to be assessed."));
      } else {
        if (t.fr_shortfall_intro) children.push(body(t.fr_shortfall_intro));

        missed.forEach(function (mr) {
          var item = interp(t.fr_shortfall_item, {
            srCode: mr.code, srTitle: mr.title,
            achievedSL: S.formatSL(mr.achievedShown),
            targetSL: S.formatSL(mr.targetSL)
          });
          if (item) children.push(bullet(item));

          // Evidence / Notes come from the SCORED requirement, which has already
          // resolved the shared layer. Looking the raw response up by target
          // id missed anything a zone inherited rather than recorded itself.
          if (showEvidence(mr)) {
            children.push(labelled("Evidence", mr.evidence));
          }
          if (mr.notes && mr.notes.trim() !== "") {
            children.push(labelled("Notes", mr.notes));
          }
        });

        if (fr.floorFlagCount > 0) {
          var floorLine = interp(t.fr_floor_note, { floorCount: fr.floorFlagCount });
          if (floorLine) children.push(body(floorLine));
        }
      }

      // What IS in place, and how it was established. The report printed
      // evidence only against shortfalls, so a requirement that was met carried
      // no trace of what had been seen - the assurance half of the engagement
      // existed only in the spreadsheet. Self-limiting: a requirement appears
      // here only where the consultant actually wrote something down.
      children.push.apply(children, evidencedInPlace(fr));
    });

    return children;
  }

  // ---- 9. Gap register --------------------------------------------------

  function gapRegister(scored, taxonomy, engagement, targetId) {
    var TableRow = window.docx.TableRow;
    var children = [ h1n("3", "Gap register") ];

    // Gap register is the "where to look first" view: floor-flagged
    // requirements first (any SR at SL0 where target > 0, or any two-or-more
    // step gap), then by SR-level gap size descending, then by FR id. The
    // target-met logic and the floor rules themselves are unchanged - only
    // the ordering of the report rows.
    var gaps = [];
    scored.perFR.forEach(function (fr) {
      fr.reqs.forEach(function (r) {
        if (r.scopedCount > 0 && r.countedCount > 0 && !r.met) gaps.push({ fr: fr, req: r });
      });
    });
    gaps.sort(function (a, b) {
      var aFloor = a.req.floor ? 1 : 0;
      var bFloor = b.req.floor ? 1 : 0;
      if (aFloor !== bFloor) return bFloor - aFloor;
      var aGap = a.req.targetSL - (a.req.achievedShown || 0);
      var bGap = b.req.targetSL - (b.req.achievedShown || 0);
      if (aGap !== bGap) return bGap - aGap;
      if (a.fr.frId !== b.fr.frId) return a.fr.frId.localeCompare(b.fr.frId);
      return a.req.code.localeCompare(b.req.code);
    });
    if (gaps.length === 0) {
      children.push(body("Every assessed requirement met its target, so there are no gaps to register."));
      return children;
    }

    var rows = [ new TableRow({ children: [
      headerCell("Finding (SR code and title)", 28),
      headerCell("FR", 5),
      headerCell("Achieved", 8),
      headerCell("Target", 8),
      headerCell("Evidence", 21),
      headerCell("Business impact", 10),
      headerCell("Recommendation", 12),
      headerCell("Priority", 8)
    ] }) ];

    gaps.forEach(function (g) {
      // Resolved on the scored requirement, so inherited evidence is included.
      var evidence = g.req.evidence || "";
      var floorBadge = g.req.floor ? " (floor)" : "";
      rows.push(new TableRow({ children: [
        cell(body(g.req.code + " " + g.req.title + floorBadge)),
        cell(body(g.fr.frId)),
        cell(body(S.formatSL(g.req.achievedShown)), { fill: g.req.blocks ? COLOR.gapBg : COLOR.nearBg }),
        cell(body(S.formatSL(g.req.targetSL))),
        cell(body(evidence)),
        cell(g.req.impact ? body(g.req.impact) : placeholderPara("To be completed", planWhere(g.req, "impact", targetId))),
        cell(g.req.action ? body(g.req.action) : placeholderPara("To be completed", planWhere(g.req, "action", targetId))),
        cell(body(nis2PriBandD(g.req.priorityBand).label || ""))
      ] }));
    });
    children.push(table(rows));
    return children;
  }

  // Gap roadmap as PROSE (replaces the gap-register table and the blank
  // recommendation/roadmap scaffolds), mirroring the CAF/NIS2 prose roadmaps.
  // Each requirement below its target Security Level becomes a Heading 2 with
  // labelled lines: achieved/target/FR, priority, what the target requires (the
  // SL-specific hint), why it matters (the requirement rationale), captured
  // evidence, business impact, recommended action and owner. SL has no external
  // 62443 cross-reference line - the assessment IS 62443-3-3.
  function slRoadmapSection(scored, taxonomy, instrument, engagement, targetId, sectionNum) {
    var children = [ sectionNum === null ? h2("Roadmap to the target Security Level")
                                         : h1n(sectionNum || "3", "Roadmap to the target Security Level") ];
    var roadmap = scored.roadmap || [];
    if (roadmap.length === 0) {
      children.push(body("Every assessed requirement met its target Security Level, so the roadmap has no entries."));
      return children;
    }

    var reqById = {};
    (instrument.requirements || []).forEach(function (r) { reqById[r.id] = r; });
    var frNameById = {};
    (taxonomy.frs || []).forEach(function (f) { frNameById[f.id] = f.name || ""; });

    if (firstTime("sl-roadmap-intro")) {
      children.push(body("Requirements below their target Security Level are listed with floor findings first, then in the consultant's priority order. Raising a Foundational Requirement to its target means closing every one of its requirements listed here, because the achieved level is set by the weakest."));
    }
    // Entries still to assess are work, not findings. Said once per document.
    if (roadmap.some(function (it) { return it.toAssess; }) && firstTime("sl-roadmap-to-assess")) {
      children.push(body("Entries marked To assess are not findings: every item answered so far is met, and the rest are still to be assessed."));
    }
    // A requirement already explained in an earlier zone's roadmap is not
    // explained again; one line says so, so nothing goes missing silently.
    var alreadyExplained = printedOnce ? roadmap.filter(function (it) {
      return printedOnce["sl-why:" + it.requirementId] ||
        (it.evidenceSource === "shared" && printedOnce["sl-ev-r:" + it.requirementId]) ||
        (it.planSource === "shared" && printedOnce["sl-plan:" + it.requirementId]);
    }).length : 0;
    if (alreadyExplained) {
      var nounR = scopeNoun(instrument);
      children.push(body("Where a requirement also appears in an earlier " + nounR + "'s roadmap, what its target requires, why it matters, and any evidence or plan recorded once for the whole system are given there.",
        { color: COLOR.muted }));
    }

    roadmap.forEach(function (it, i) {
      var req = reqById[it.requirementId] || {};
      var floorBadge = it.floor ? "  (floor)" : "";
      var pb = nis2PriBandD(it.priorityBand);
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + it.code + " " + it.title + floorBadge) ]
      }));
      // An entry still to assess has no shortfall to state, so it carries its
      // status where a finding carries its achieved level.
      children.push(new window.docx.Paragraph({
        style: "BodyText", spacing: { after: 60 },
        children: (it.toAssess
          ? [ run("Status: ", { bold: true }), run("To assess", { bold: true, color: COLOR.muted }) ]
          : [ run("Achieved: ", { bold: true }),
              run(S.formatSL(it.achievedShown), { bold: true, color: it.blocks ? COLOR.gap : COLOR.near }) ]
        ).concat([
          run("    Target: ", { bold: true }),
          run(S.formatSL(it.targetSL), { bold: true }),
          run("    Foundational Requirement: ", { bold: true }),
          run(it.frId + (frNameById[it.frId] ? " " + frNameById[it.frId] : ""))
        ])
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
      if (it.floor) priChildren.push(run("   floor finding", { bold: true, color: COLOR.gap }));
      children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));
      if (it.toAssess) {
        var blank = (it.items || []).filter(function (x) { return x.inScope && x.disposition === "unassessed"; })
          .map(function (x) { return x.label; });
        if (blank.length) children.push(nis2Field("Items still to assess", joinList(blank)));
      }

      var tgt = req.slGuidance && req.slGuidance[String(it.targetSL)];
      var requires = (tgt && tgt.hint) ? tgt.hint : (req.question || "");
      if (requires && firstTime("sl-requires:" + it.requirementId + ":" + it.targetSL)) {
        children.push(nis2Field("What target " + S.formatSL(it.targetSL) + " requires", requires));
      }
      if (req.rationale && firstTime("sl-why:" + it.requirementId)) children.push(nis2Field("Why this matters", req.rationale));
      // Evidence and plan recorded once for the whole system print under the
      // first zone that carries the requirement; a zone's own always print.
      if (it.evidenceSource !== "shared" || !it.evidence || firstTime("sl-ev-r:" + it.requirementId)) {
        children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this requirement."));
      }
      if (it.planSource !== "shared" || firstTime("sl-plan:" + it.requirementId)) {
        // Nothing has been found short on an entry still to assess, so there
        // is no impact or remedy to prompt for; anything recorded still prints.
        // A plan inherited from the shared layer is completed there.
        var planT = it.planSource === "shared" ? sharedTargetId() : targetId;
        if (!it.toAssess || String(it.impact || "").trim()) children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact", planT)));
        if (!it.toAssess || String(it.action || "").trim()) children.push(nis2Field("Recommended action", it.action, planWhere(it, "action", planT)));
        children.push(nis2Field("Owner", it.owner || "To be assigned"));
      }
    });
    return children;
  }

  // ---- 12. Limitations -------------------------------------------------

  // sites, instrument (multi-zone report only): every zone, so what was left out is
  // listed for the system, not for the one zone the summary is written from.
  function limitationsSection(narrative, scored, taxonomy, engagement, sites, instrument) {
    var children = [
      // "Method and limitations" in every family, with the structured rules in
      // the appendix that follows it.
      h1("Method and limitations"),
      body(narrative.boilerplate.limitations)
    ];
    if (sites && sites.length > 1) {
      var partial = [], none = [], toAssess = [];
      sites.forEach(function (s) {
        if (!window.App.Report.slAnyAnswered(s.result)) { none.push(s.target.name); return; }
        var c = buildScopeCounts(s.result);
        if (c.notAssessed) partial.push(s.target.name + ": " + c.notAssessedFRs.map(function (f) { return f.frId; }).join(", "));
        var codes = toAssessCodes(s.result);
        if (codes.length) toAssess.push(s.target.name + ": " + codes.join(", "));
      });
      if (partial.length) children.push(body("Foundational Requirements not assessed in this engagement, by " +
        scopeNoun(instrument) + ": " + partial.join("; ") + "."));
      if (toAssess.length) children.push(body("Requirements with items still to assess, by " +
        scopeNoun(instrument) + ": " + toAssess.join("; ") + "."));
      if (none.length) children.push(body(joinList(none) + " " + (none.length === 1 ? "was" : "were") +
        " not assessed at all in this engagement."));
    } else {
      // The scorer's list: an FR out of scope (SL-T 0) was a scoping decision,
      // not something left undone, and is not listed here.
      var notAssessed = buildScopeCounts(scored).notAssessedFRs;
      if (notAssessed.length > 0) {
        children.push(body("Foundational Requirements not assessed in this engagement: " + frNameList(scored, notAssessed, taxonomy) + "."));
      }
      var codes1 = toAssessCodes(scored);
      if (codes1.length) {
        children.push(body("Requirements with items still to assess: " + joinList(codes1) + "."));
      }
    }
    // "A single target was applied" is a statement about the basis of the
    // assessment, so it has to account for PER-ZONE targets as well as the
    // engagement-wide per-FR overrides. Claiming a uniform target when a zone
    // was held to a different one misdescribes what was assessed.
    var tp = engagement.targetProfile || {};
    var perFRSet = tp.perFR && Object.keys(tp.perFR).length > 0;
    var zoneOverrides = [];
    Object.keys(tp.perZone || {}).forEach(function (zid) {
      var z = S.normaliseZoneTarget(tp.perZone[zid]);
      if (!z) return;
      var t2 = (engagement.targets || []).filter(function (x) { return x.id === zid; })[0];
      var name = (t2 && t2.name) || zid;
      if (typeof z.default === "number" && z.default !== tp.defaultTargetSL) {
        zoneOverrides.push(name + ": " + S.formatSL(z.default));
      }
      Object.keys(z.perFR || {}).forEach(function (frId) {
        zoneOverrides.push(name + " " + frId + ": " + S.formatSL(z.perFR[frId]));
      });
    });
    if (zoneOverrides.length) {
      children.push(body("Targets were not uniform across the assessed scope. The site target is " +
        S.formatSL(tp.defaultTargetSL) + ", with the following exceptions: " + zoneOverrides.join("; ") +
        ". Each result is reported against the target that applied to it."));
    } else if (!perFRSet && narrative.templates.default_target_flag) {
      var flag = interp(narrative.templates.default_target_flag, { targetSL: S.formatSL(tp.defaultTargetSL) });
      if (flag) children.push(body(flag));
    }
    return children;
  }

  // ---- 13. Appendix - scoring methodology ------------------------------

  // Methodology lines are kept in one constant array used by both the Word
  // appendix and the Excel "Read me" sheet, so the two deliverables describe
  // scoring identically. Edit METHODOLOGY_LINES to change both at once.
  var METHODOLOGY_LINES = [
    { kind: "head", text: "Scoring methodology" },
    { kind: "body", text: "Results are reported as an achieved Security Level (SL-A) per Foundational Requirement against the target Security Level (SL-T) for the scope assessed. No letter grade and no single overall score is produced." },
    { kind: "head", text: "The unit of assessment is the item" },
    { kind: "bullet", text: "Each requirement contributes a base item plus one item per requirement enhancement. The standard selects each item from a specific Security Level upwards, and that mapping puts an item in or out of scope." },
    { kind: "bullet", text: "The target scopes the work: for a Foundational Requirement with target T, only items first selected at levels 1 to T are assessed. A target of SL 0 takes the Foundational Requirement out of scope entirely." },
    { kind: "bullet", text: "The assessor judges each item as met, met by a compensating countermeasure, partially met, not met, or not applicable. The achieved Security Level is computed from those judgements; it is never entered directly." },
    { kind: "head", text: "Per item" },
    { kind: "bullet", text: "Met, or met by a compensating countermeasure: satisfies its level." },
    { kind: "bullet", text: "Partially met: never satisfies a level. It carries into the closeness figure and into the gap report, but it cannot raise an achieved Security Level." },
    { kind: "bullet", text: "Not applicable: excluded from the assessment, but only where a justification has been recorded against it. An unjustified not-applicable is treated as not assessed." },
    { kind: "bullet", text: "Not assessed: blocks any claim at its level. An item nobody has looked at is not assumed to be met." },
    { kind: "head", text: "Per Foundational Requirement" },
    { kind: "bullet", text: "Achieved Security Level (SL-A) = the highest level n at or below the target where every in-scope item selected at levels 1 to n is satisfied. This is weakest-link by construction: one unmet item at level 1 holds the Foundational Requirement at SL 0 however strong the rest is." },
    { kind: "bullet", text: "A second vector is reported alongside it with compensating countermeasures treated as not satisfied. Where the two differ, the level rests on something outside the requirement itself." },
    { kind: "bullet", text: "Blocking items are those at or below the first failing level that are not satisfied. Closing exactly those items, and nothing else, raises the Foundational Requirement to the next level." },
    { kind: "bullet", text: "Closeness is the share of in-scope items satisfied, with partial credit from the scoring profile. It is context only: it never lifts a level and never substitutes for SL-A." },
    { kind: "bullet", text: "FR target met = the achieved Security Level is at least the target for that Foundational Requirement." },
    { kind: "bullet", text: "Only an answered item that is not met or partially met is a shortfall. A Foundational Requirement whose answered items are all met but which still has items to assess is reported as not yet meeting its target, not as falling short; its achieved level still counts those items as not satisfied. Requirements in that position stay on the roadmap, marked To assess." },
    { kind: "bullet", text: "A requirement is floor-flagged where its base item is in scope and not satisfied (if the base is missing, none of that requirement is in place), or where it sits two or more Security Levels below its target. Floor findings are treated as priorities and are listed first in the roadmap." },
    { kind: "head", text: "Overall" },
    { kind: "bullet", text: "Overall target met = every Foundational Requirement in scope has been assessed and meets its target. There is no cross-FR compensation and no averaging. Where nothing assessed falls short but some Foundational Requirements are still to be assessed, in full or in part, the target is not yet met: the result is incomplete, not a shortfall." },
    { kind: "bullet", text: "A Foundational Requirement with nothing answered is reported as not assessed rather than as a failure, and is excluded from the weakest-area and floor-flag figures." },
    { kind: "bullet", text: "Where the scope is divided into zones and conduits, each is scored independently against its own target. There is no aggregation across zones; the weakest zone is the prudent basis for a decision about the whole." },
    { kind: "bullet", text: "A shared answer describes a countermeasure implemented once and used by more than one zone, such as a single directory service or one log collector. It is recorded once, applies to the zones it reaches, and is overridden wherever a zone records an answer of its own." }
  ];

  // Every scoring family gets the same structured appendix, describing ITS own
  // rules. Previously only capability-sl had one, so five of the six families
  // shipped a report that never said how its numbers were derived - and the
  // Excel "Read me" sheet described SL target scoring for every instrument,
  // including CAF and NIS2 workbooks where it does not apply.
  var METHODOLOGY = {
    "capability-sl": METHODOLOGY_LINES,

    // Without an entry of its own this family fell back to capability-sl, so
    // the risk appetite document closed with an appendix explaining 62443-3-3
    // Security Levels. Written in the same plain style as its narrative pack.
    "risk-appetite-coherence": [
      { kind: "body", text: "Exposure and appetite are each placed on a scale of four bands, and no score, percentage or grade is produced." },
      { kind: "head", text: "Placing each position" },
      { kind: "bullet", text: "Each item is explored in interview and placed in one band on its scale, with a written characterisation of what was heard and seen." },
      { kind: "bullet", text: "The assessor sets one band for each section, with the organisation's sector as the starting point for exposure. How each section's readings combine, how the fit between the two positions is read and the bands at which each verdict applies are set out in How to read this report." },
      { kind: "bullet", text: "Where the optional technical review is included, it is placed on the appetite scale in the same way. That gives a revealed position to set beside the one described in interview." },
      { kind: "bullet", text: "A technical reading that reflects a genuine operational constraint which is being managed, or that could not be established, is reported but not counted towards revealed appetite. A constraint that nobody is managing is counted." },
      { kind: "bullet", text: "Each item carries its own description of what every band looks like, so that the same organisation is placed in the same band whoever assesses it." },
     { kind: "bullet", text: "A reading that could not be established is left out of the band and reported. For appetite, not knowing is usually a finding." },
      { kind: "bullet", text: "The verdict is the assessor's judgement. It takes account of both positions and of anything else found during the engagement that bears on whether the organisation's appetite is appropriate to the risks it faces." }
    ],

    "caf-achieved": [
      { kind: "head", text: "Scoring methodology" },
      { kind: "body", text: "Each contributing outcome is judged in one state against the indicators of good practice. No single grade is computed. Results are reported as a profile of states and, against the selected profile, as meeting or below the expected state." },
      { kind: "head", text: "Per outcome" },
      { kind: "bullet", text: "The consultant sets exactly one state per outcome." },
      { kind: "bullet", text: "Not applicable is dropped from both the profile and the coverage denominator. Outcomes the selected profile marks as not applicable drop out entirely." },
      { kind: "bullet", text: "Unknown is a coverage and confidence signal, not a state: it means the position could not be established, and it lowers confidence rather than counting as a failure." },
      { kind: "head", text: "Against the selected profile" },
      { kind: "bullet", text: "States are ordered Not achieved, then Partially achieved, then Achieved. An outcome meets expected when its state is at or above the expected state for the profile." },
      { kind: "bullet", text: "Meeting and below expected are reported as counts per objective and per principle. They are never combined into a single score." },
      { kind: "bullet", text: "Where a profile is a placeholder its expected states are not loaded, so meeting and below are not reported at all." },
      { kind: "head", text: "Roadmap" },
      { kind: "bullet", text: "The roadmap lists every applicable outcome that is below its expected state, or that is Partially or Not achieved where no profile expectation applies." }
    ],

    "domain-letter": [
      // No "Scoring methodology" head here: the appendix's own H1 already says
      // it, and the two stacked read as a stutter.
      { kind: "body", text: "Each question is scored on a band scale, bands roll up to a score and letter grade per domain, and the domains roll up to a single indicative headline grade. All thresholds, letter bands and the coverage cut-off come from the scoring profile." },
      { kind: "head", text: "Per question and per domain" },
      { kind: "bullet", text: "The consultant selects one band per scored question. Unknown lowers coverage and confidence; Not applicable is excluded from the domain denominator." },
      { kind: "bullet", text: "A domain score is the mean of its answered bands, mapped to a letter through the profile's letter bands." },
      { kind: "bullet", text: "A domain answered below the coverage threshold is reported as provisional and is excluded from the headline, because it could not be graded with confidence. It still counts against overall coverage." },
      { kind: "head", text: "Headline grade" },
      { kind: "bullet", text: "The headline is the weighted mean of the graded domain scores, equally weighted unless the profile sets domain weights." },
      { kind: "bullet", text: "Two ceilings then apply. The headline may sit at most two grades above the weakest graded domain, so a single weak area cannot be averaged away: an F anywhere caps the headline at D, an E anywhere caps it at C. The top grade is awarded only where every graded domain reaches it, so an A means uniformly excellent rather than excellent on average. Where either ceiling bites, the report says so." },
      { kind: "head", text: "Overall" },
      { kind: "bullet", text: "The grade is an indicative, interview-based read, not a measurement of conformance against any standard. Conformance is established by the detailed assessments that follow in priority areas." }
    ],

    "program-maturity-ml": [
      { kind: "head", text: "Scoring methodology" },
      { kind: "body", text: "Each requirement is assessed at one maturity level. Maturity levels apply independently per requirement; no single programme grade is computed." },
      { kind: "head", text: "Per requirement" },
      { kind: "bullet", text: "The consultant selects one level, or records the requirement as Not met." },
      { kind: "bullet", text: "Not applicable is excluded from the element denominator. Unknown lowers coverage and confidence." },
      { kind: "bullet", text: "Where a target maturity level is set, met or below is reported per requirement, and the gap is the difference between target and achieved." },
      { kind: "head", text: "Per element and theme" },
      { kind: "bullet", text: "Results are reported as a profile: the count of requirements at each maturity level, plus Not met and Unknown, by grouping and by theme." },
      { kind: "bullet", text: "Mean maturity level is carried for context only and is never a headline grade." },
      { kind: "head", text: "Overall" },
      { kind: "bullet", text: "There is no cross-requirement compensation. A requirement that is Not met, or below its target, is surfaced as a floor finding rather than averaged away." }
    ],

    "nis2-conformance": [
      { kind: "head", text: "Scoring methodology" },
      { kind: "body", text: "Each obligation is judged in one state against full conformance with the Directive. There are no profiles or per-obligation targets: every applicable obligation is expected to be Achieved." },
      { kind: "head", text: "Per obligation" },
      { kind: "bullet", text: "The consultant sets exactly one state per obligation." },
      { kind: "bullet", text: "Not applicable is dropped from both the profile and the coverage denominator. Unknown lowers coverage and confidence rather than counting as a failure." },
      { kind: "head", text: "Per area and overall" },
      { kind: "bullet", text: "Results are reported as a conformance profile: counts of each state by NIS2 area and overall." },
      { kind: "bullet", text: "A conformance percentage is offered for context only. It is not a pass mark, and no single grade is produced." },
      { kind: "head", text: "Roadmap" },
      { kind: "bullet", text: "The gap roadmap lists every applicable obligation that is Partially or Not achieved." },
      { kind: "bullet", text: "This is a readiness and gap analysis, not a determination of legal compliance with NIS2 or its national transposition." }
    ],

    "csms-conformance": [
      { kind: "head", text: "Scoring methodology" },
      { kind: "body", text: "Each element is judged in one conformance state against full conformance. The scale is defined in the scoring profile." },
      { kind: "head", text: "Per element" },
      { kind: "bullet", text: "The consultant sets exactly one state per element." },
      { kind: "bullet", text: "Not applicable is dropped from both the profile and the coverage denominator. Unknown lowers coverage and confidence." },
      { kind: "head", text: "Per category and overall" },
      { kind: "bullet", text: "Results are reported as a conformance profile: counts at each state, by category and by element group." },
      { kind: "bullet", text: "A conformance index, which respects the ordering of the states, is offered for context only. It is never a pass mark, and no single grade is produced." },
      { kind: "head", text: "Roadmap" },
      { kind: "bullet", text: "The gap roadmap lists every applicable element that is Not in place or Partially in place. Not in place is treated as a floor finding." },
      { kind: "bullet", text: "An element that is close to conformant counts in the profile and the index but is not a roadmap priority." }
    ]
  };

  function methodologyLinesFor(instrument) {
    var fam = (instrument && instrument.scoringFamily) || "capability-sl";
    return METHODOLOGY[fam] || METHODOLOGY["capability-sl"];
  }

  // Advice recorded against something that is NOT a gap. The roadmap is built
  // from shortfalls, so without this a recommendation typed against an item
  // that meets its target was saved and never seen. Kept out of the roadmap on
  // purpose: a client reading that as a to-do list should not find items in it
  // that are already met. Composed from Report.furtherRecommendations so the
  // screen and the document list exactly the same entries.
  // headingLevel 2 when it sits inside a zone's own section (the multi-zone
  // report): as a level-1 heading it was a sibling of the zones, so hiding it
  // in one zone ran on through every zone after it.
  function furtherRecommendationsSection(engagement, instrument, scored, targetId, headingLevel) {
    if (!(window.App.Report && window.App.Report.furtherRecommendations)) return [];
    var target = (engagement.targets || []).filter(function (t) { return t.id === targetId; })[0] ||
                 (engagement.targets || [])[0] || null;
    var rows = window.App.Report.furtherRecommendations({
      scored: scored, instrument: instrument, engagement: engagement, activeTarget: target
    });
    if (!rows.length) return [];
    var out = [ headingLevel === 2 ? h2("Further recommendations") : h1("Further recommendations"),
      body("The items below already meet their target, but the assessor recorded advice against them and judged it worth acting on. They are not gaps and are not counted as outstanding work.") ];
    rows.forEach(function (r) {
      out.push(bullet(r.code + "  " + r.title + (r.band ? "  -  " + r.band.charAt(0).toUpperCase() + r.band.slice(1) + " priority" : "")));
      out.push(labelled("Recommended action", r.action));
      if (r.owner)  out.push(labelled("Owner", r.owner));
      if (r.impact) out.push(labelled("Business impact", r.impact));
    });
    return out;
  }

  // What happens after the report, in the consultant's own words. On every
  // instrument, and always present: left blank it prints the red placeholder
  // rather than vanishing, so a document cannot go out with the section
  // silently missing. A multi-line entry becomes a list.
  // Untouched, this prints the scaffolded first draft rather than a bare
  // placeholder, and any [bracketed] prompt line in it prints red - so a
  // document that went out unedited says so on its own face.
  function nextStepsSection(engagement, opts) {
    var R = window.App.Report;
    var lines = (R && R.nextStepsLines) ? R.nextStepsLines(engagement, opts) : [];
    var isPrompt = (R && R.nextStepsIsPrompt) || function () { return false; };
    var out = [ h1("Proposed next steps") ];
    if (!lines.length) {
      out.push(placeholderPara("[Consultant to set out the proposed next steps: what should happen now, in what order, and by when.]", { kind: "nextSteps" }));
      return out;
    }
    if (lines.length === 1 && !isPrompt(lines[0])) { out.push(body(lines[0])); return out; }
    lines.forEach(function (l) { out.push(isPrompt(l) ? placeholderPara(l, { kind: "nextSteps" }) : bullet(l)); });
    return out;
  }

  // The standing tail every family's document ends with. One place, so a
  // section added here reaches all seven rather than seven call sites.
  function reportTailSections(instrument, engagement, scored, targetId) {
    return furtherRecommendationsSection(engagement || {}, instrument, scored, targetId)
      .concat(nextStepsSection(engagement || {}, { instrument: instrument, scored: scored }))
      .concat(methodologyAppendix(instrument));
  }

  function methodologyAppendix(instrument) {
    // The break lives here rather than at the call sites so the appendix
    // ALWAYS opens a new page, in every family and in any future document that
    // appends it. Safe in all current assemblies: the appendix is concatenated
    // onto the end of a segment, directly after the limitations prose, so it
    // never lands first in a Word section where a break would leave a blank page.
    var out = [ pageBreakPara(), h1("Appendix: scoring methodology") ];
    methodologyLinesFor(instrument).forEach(function (l) {
      if (l.kind === "head")        out.push(h2(l.text));
      else if (l.kind === "bullet") out.push(bullet(l.text));
      else                          out.push(body(l.text));
    });
    return out;
  }

  // ---- helpers ----------------------------------------------------------

  function lookupFR(scored, frId) {
    // pull the taxonomy name via the scored result's perFR (which has frId)
    // but the actual name is on the taxonomy. The caller passes the scored result;
    // we need taxonomy too. Easier: pass taxonomy into the consumers; this helper
    // is for executive summary which has the scored only, so:
    if (!scored || !scored._taxonomy) return null;
    return scored._taxonomy.frs.filter(function (f) { return f.id === frId; })[0] || null;
  }
  function totalInFR(frRes) {
    return (frRes.reqs && frRes.reqs.length) || 0;
  }

  // ---- styles ----------------------------------------------------------

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

  // ---- posture (domain-letter family) -----------------------------------
  //
  // Mirrors the section structure of the SL Word builder but applies the
  // domain-letter language rule: insert boilerplate and domain_narrative
  // VERBATIM, compose data lines ONLY from templates.

  function postureTitlePage(engagement, instrument) {
    return titlePage(engagement, instrument);
  }
  function postureDocumentControl(engagement, instrument, opts) {
    return documentControl(engagement, instrument, opts);
  }

  // Composed posture executive summary (mirrors CAF/SL/NIS2): boilerplate
  // verbatim, templates slot-substituted, consultant blocks seeded + placeholder.
  // Posture aim: an indicative headline grade - the mean across domains, held
  // look first - not a conformance or regulatory determination.
  function postureExecComposed(narrative, scored, engagement) {
    var DL = window.App.ScoringDomainLetter;
    var es = narrative.executiveSummary;
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var gcFrags = T.gapConcentrationFragments || {};
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var clientName = e.clientName || "the organisation";
    var children = [ h1n("1", "Executive summary") ];

    if (!scored.headlineGrade) {
      children.push(body(narrative.boilerplate.report_intro));
      children.push(body("Too few questions were answered to produce an indicative grade; the priority is to complete the interview across the domains."));
      return children;
    }

    var weakArr = scored.weakestDomains || (scored.weakestDomain ? [scored.weakestDomain] : []);
    var weakestDomainName = weakArr.length ? nis2ListJoin(weakArr.map(function (d) { return d.name; })) : "no single domain";
    var weakestGrade = weakArr.length ? weakArr[0].grade : "-";
    var assessedDomainCount = (scored.perDomain || []).filter(function (d) { return d.score !== null; }).length;
    var roadmap = scored.roadmap || [];
    var hasGaps = roadmap.length > 0;

    var graded = (scored.priorityOrder && scored.priorityOrder.graded) || [];
    var insufficient = (scored.priorityOrder && scored.priorityOrder.insufficient) || [];
    var lowGrades = graded.filter(function (d) { return d.grade === "C" || d.grade === "D" || d.grade === "E" || d.grade === "F"; })
      .slice(0, 3).map(function (d) { return d.name + " (" + d.grade + ")"; });
    var gcParts = [];
    if (lowGrades.length) gcParts.push(nis2Fill(gcFrags.lowGrades, { lowGradeList: nis2ListJoin(lowGrades) }));
    if (insufficient.length) gcParts.push(nis2Fill(gcFrags.lowCoverage, { lowCoverageList: nis2ListJoin(insufficient.map(function (d) { return d.name; })) }));
    var gapConcentrationSentence = gcParts.join(" ");

    var topHint = graded.slice(0, 2).map(function (d) { return d.name; });
    var autoTopPriorityHint = topHint.length ? nis2ListJoin(topHint) : "the lowest-graded domains";

    var slots = {
      clientName: clientName, headlineGrade: scored.headlineGrade,
      weakestDomainName: weakestDomainName, weakestGrade: weakestGrade,
      assessedDomainCount: assessedDomainCount, answeredCount: scored.totalAnswered, scorableCount: scored.totalScorable,
      gapConcentrationSentence: gapConcentrationSentence,
      capClause: "",
      coveragePct: DL.formatPct(scored.overallCoverage),
      confidenceLabel: scored.overallConfidenceLevel ? String(scored.overallConfidenceLevel).toLowerCase() : (scored.lowConfidence ? "low confidence" : "confidence not rated"),
      autoTopPriorityHint: autoTopPriorityHint
    };

    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots)));
    children.push(body(nis2Fill(T.exec_scope, slots) + " " + nis2Fill(T.exec_profile, slots)));

    // How the ceiling shaped the headline. Its own sentence rather than a
    // clause on the gap-shape paragraph: that paragraph only renders when there
    // are low-graded domains, so the unanimity case - every domain strong, one
    // B holding the A back - would never have been reported. Slots are filled
    // here because the clause carries its own.
    var capTpl = !scored.capBinding ? null
      : scored.capReason === "not-unanimous" ? T.capClauseUnanimous
      : scored.capApplied ? T.capClause
      : T.capClauseCeiling;
    var capSentence = capTpl ? nis2Fill(capTpl, slots).trim() : "";

    if (hasGaps && gapConcentrationSentence) {
      children.push(body(nis2Fill(T.exec_gap_shape, slots) + (capSentence ? " " + capSentence : "")));
    } else if (capSentence) {
      children.push(body(capSentence));
    }
    if (B.exec_weakest_domain) children.push(body(B.exec_weakest_domain));
    if (B.exec_indicative) children.push(body(B.exec_indicative));

    slots.lowCoverageClause = insufficient.length ? (CB.consultant_exposure_lowcov_clause || "") : "";
    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) {
      children.push(body(expo));
    } else {
      // Just the placeholder. The seed line restated the weakest domain - which
      // the verdict and the gap list have already given - directly above a
      // placeholder instructing the consultant to write about that same domain,
      // so the summary said it three times and one of them was an instruction.
      if (CB.consultant_exposure) children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));
    }

    if (hasGaps) {
      var topPri = (rn.topPriorities || "").trim();
      children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
      if (topPri) children.push(body(topPri));
      else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    }
    children.push(body(nis2Fill(T.exec_confidence, slots)));

    // Where a material share of the assessment could not be answered, the
    // summary has to say so. This sentence existed, but it lived in the FLAT
    // summary below - after the early return that sends any pack carrying an
    // executiveSummary block down this composed path - so for posture and the
    // screener it had never once reached a document. A report resting on 31%
    // Unknown answers said nothing about it outside the per-domain lines.
    var flatT = (narrative && narrative.templates) || {};
    if (scored.totalUnknown > 0 && scored.overallConfidenceKey &&
        scored.overallConfidenceKey !== "high" && flatT.overall_unknown_finding) {
      children.push(body(nis2Fill(flatT.overall_unknown_finding, {
        unknownCount:    scored.totalUnknown,
        attemptedCount:  (scored.totalAnswered || 0) + (scored.totalUnknown || 0),
        unknownRatePct:  DL.formatPct(scored.overallUnknownRate),
        confidenceLabel: String(scored.overallConfidenceLevel || "").toLowerCase()
      })));
    }

    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));
    return children;
  }

  function postureExecutiveSummary(narrative, scored, engagement) {
    if (narrative && narrative.executiveSummary) return postureExecComposed(narrative, scored, engagement);
    var t = narrative.templates;
    var DL = window.App.ScoringDomainLetter;
    var thrPct = Math.round((scored.coverageThreshold || 0.6) * 100) + "%";
    var children = [
      h1n("1", "Executive summary"),
      body(narrative.boilerplate.report_intro)
    ];

    // Headline composition is strictly template-driven.
    //   1. headline                   - always, if there is a headline grade.
    //   2. weakest_named[_multi]      - always, if at least one weakest graded domain exists.
    //   3. headline_cap_note[_multi]  - ONLY when the cap actually changed the grade.
    if (scored.headlineGrade) {
      var headline = interp(t.headline, { headlineGrade: scored.headlineGrade });
      if (headline) children.push(body(headline));
    }
    var weakArr = scored.weakestDomains || (scored.weakestDomain ? [scored.weakestDomain] : []);
    if (weakArr.length > 0) {
      var weakestLine;
      if (weakArr.length > 1 && t.weakest_named_multi) {
        weakestLine = interp(t.weakest_named_multi, {
          weakestDomainsList: weakArr.map(function (d) { return d.name; }).join(", "),
          weakestGrade:       weakArr[0].grade
        });
      } else {
        weakestLine = interp(t.weakest_named, {
          weakestDomain: weakArr[0].name,
          weakestGrade:  weakArr[0].grade
        });
      }
      if (weakestLine) children.push(body(weakestLine));
    }
    // Two ceilings can bite, and they are different facts: "held down by a weak
    // domain" and "not every domain is top grade" must not be reported with the
    // same sentence.
    if (scored.capApplied && scored.capReason === "not-unanimous" && t.headline_cap_note_unanimous) {
      var uLine = interp(t.headline_cap_note_unanimous, { headlineGrade: scored.headlineGrade });
      if (uLine) children.push(body(uLine));
    } else if (scored.capApplied && weakArr.length > 0) {
      var capLine;
      if (weakArr.length > 1 && t.headline_cap_note_multi) {
        capLine = interp(t.headline_cap_note_multi, {
          weakestDomainsList: weakArr.map(function (d) { return d.name; }).join(", "),
          weakestGrade:       weakArr[0].grade
        });
      } else {
        capLine = interp(t.headline_cap_note, {
          weakestDomain: weakArr[0].name,
          weakestGrade:  weakArr[0].grade
        });
      }
      if (capLine) children.push(body(capLine));
    }

    // Coverage overall.
    var coverageLine = interp(t.coverage_overall, { overallCoveragePct: DL.formatPct(scored.overallCoverage) });
    if (coverageLine) children.push(body(coverageLine));

    // Low-confidence flag if overall coverage is below threshold.
    if (scored.lowConfidence) {
      var flag = interp(t.low_confidence_flag, { coverageThresholdPct: thrPct });
      if (flag) children.push(body(flag));
    }

    // Overall Unknown finding. Coverage = "how much was attempted"; this is
    // "how much of what was attempted was known". A separate signal, only
    // emitted when overall confidence is below High.
    var totalAttempted = (scored.totalAnswered || 0) + (scored.totalUnknown || 0);
    if (scored.totalUnknown > 0 && scored.overallConfidenceKey && scored.overallConfidenceKey !== "high" && t.overall_unknown_finding) {
      var ovLine = interp(t.overall_unknown_finding, {
        unknownCount:    scored.totalUnknown,
        attemptedCount:  totalAttempted,
        unknownRatePct:  DL.formatPct(scored.overallUnknownRate),
        confidenceLabel: scored.overallConfidenceLevel
      });
      if (ovLine) children.push(body(ovLine));
    }
    return children;
  }

  function postureIndicativeCaveat(narrative) {
    // Prominent. Insert verbatim from boilerplate.indicative_grade_caveat,
    // styled so the reader cannot miss it.
    var caveat = narrative.boilerplate.indicative_grade_caveat;
    if (!caveat) return [];
    var TableRow = window.docx.TableRow;
    var WidthType = window.docx.WidthType;
    var Table = window.docx.Table;
    var ShadingType = window.docx.ShadingType;
    var TableCell = window.docx.TableCell;

    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [
        new TableCell({
          children: [
            new window.docx.Paragraph({
              style: "BodyText",
              children: [run("Indicative grade", { bold: true, color: COLOR.gap })]
            }),
            new window.docx.Paragraph({ style: "BodyText", children: [run(caveat)] })
          ],
          shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
        }) ]
      }) ]
    });
    return [
      h1("Indicative grade"),
      tbl,
      body("", { spacing: { after: 160 } })
    ];
  }

  // As aboutSection: the composed executive summary leads with the verdict, so
  // report_intro ("what this report is, and who it is for") sits here.
  // `inst` is used for the attribution only; the series-context line keeps
  // reading the narrative pack as it always has.
  function postureAbout(narrative, inst) {
    var children = [h1("About this assessment")];
    if (narrative.boilerplate.report_intro) children.push(body(narrative.boilerplate.report_intro));
    children.push(body(narrative.boilerplate.about_instrument));
    var sc1581 = seriesContextOf(typeof instrument !== "undefined" ? instrument : null, narrative); if (sc1581) children.push(body(sc1581));
    // unknown_explained appears here so the reader meets the concept before
    // any "moderate confidence" tag or per-domain unknown_finding appears.
    if (narrative.boilerplate.unknown_explained) {
      children.push(body(narrative.boilerplate.unknown_explained));
    }
    return children.concat(attributionParas(inst, true));
  }

  function postureHowToRead(narrative) {
    return [
      h1("How to read this report"),
      body(narrative.boilerplate.how_to_read)
    ];
  }

  function postureDomainResultsSection(scored, narrative, scoreBarsBuf) {
    var TableRow = window.docx.TableRow;
    var DL = window.App.ScoringDomainLetter;
    var children = [ h1("Domain results") ];
    if (scoreBarsBuf) {
      children.push(new window.docx.Paragraph({
        style: "BodyText",
        children: [ new window.docx.ImageRun({ data: scoreBarsBuf, transformation: { width: 580, height: Math.round(580 * (34 + 28 * scored.perDomain.length) / 640) } }) ]
      }));
    }
    var rows = [ new TableRow({ children: [
      headerCell("Domain", 24),
      headerCell("Grade", 14),
      headerCell("Score", 14),
      headerCell("Coverage", 16),
      headerCell("Answered / scorable", 18),
      headerCell("Caps the grade", 14)
    ] }) ];
    scored.perDomain.forEach(function (d) {
      // Cell fill is decided by the GRADE letter on the A-F scale alone, never
      // by coverage. Provisional status is carried as the textual " (P)"
      // suffix so the colour stays true to the grade.
      var fill = d.score === null ? COLOR.naBg :
        (d.score >= 0.7 ? COLOR.metBg : (d.score >= 0.4 ? COLOR.nearBg : COLOR.gapBg));
      // Every domain TIED at the lowest grade is flagged, not just the first:
      // the ceiling is set by the grade, so all of them hold it down equally.
      var weakArr0 = scored.weakestDomains || (scored.weakestDomain ? [scored.weakestDomain] : []);
      var weakest = weakArr0.some(function (w) { return w.domainId === d.domainId; });
      var gradeText = (d.grade || "-") + (d.lowCoverage ? " (P)" : "");
      rows.push(new TableRow({ children: [
        cell(body(cap(d.domainId) + " " + d.name, { bold: true })),
        cell(body(gradeText, { bold: true, color: fill === COLOR.gapBg ? COLOR.gap : (fill === COLOR.nearBg ? COLOR.near : (fill === COLOR.metBg ? COLOR.met : COLOR.muted)) }), { fill: fill }),
        cell(body(DL.formatPct(d.score))),
        cell(body(DL.formatPct(d.coverage))),
        cell(body(d.answeredCount + " / " + d.scorableCount)),
        cell(body(weakest ? "Yes, holds the grade down" : "", { bold: weakest, color: weakest ? COLOR.gap : COLOR.muted }), { fill: weakest ? COLOR.gapBg : undefined })
      ] }));
    });
    children.push(table(rows));
    return children;
  }

  // Priority order section. Lists all GRADED domains worst-to-best so the
  // cluster of weak areas is visible regardless of ties; lists insufficient-
  // evidence domains separately. Strictly template-driven (priority_intro,
  // priority_item, priority_insufficient_intro, priority_insufficient_item);
  // emits nothing if those templates are absent from the narrative pack.
  function posturePriorityOrder(scored, narrative, engagement) {
    var t = narrative.templates || {};
    var DL = window.App.ScoringDomainLetter;
    var po = scored.priorityOrder || DL.priorityOrder(scored.perDomain);
    if (!t.priority_item) return [];
    // Same order the screen shows: computed worst-to-best, then whatever the
    // consultant dragged it into.
    var graded = window.App.Report.dlPriorityDomains(po, { engagement: engagement });
    var insuf  = (po.insufficient || []);
    if (graded.length === 0 && insuf.length === 0) return [];

    var children = [ h1("Priority order") ];
    if (graded.length > 0) {
      if (t.priority_intro) children.push(body(t.priority_intro));
      graded.forEach(function (d, i) {
        var line = interp(t.priority_item, {
          rank: i + 1, domainName: d.name, domainGrade: d.grade
        });
        if (line) children.push(bullet(line));
      });
    }
    if (insuf.length > 0 && t.priority_insufficient_item) {
      if (t.priority_insufficient_intro) {
        children.push(body(t.priority_insufficient_intro, { spacing: { before: 120 } }));
      }
      insuf.forEach(function (d) {
        var line = interp(t.priority_insufficient_item, {
          domainName: d.name, coveragePct: DL.formatPct(d.coverage)
        });
        if (line) children.push(bullet(line));
      });
    }
    return children;
  }

  function postureFindingsByDomain(scored, narrative, engagement, targetId) {
    var t = narrative.templates;
    var DN = narrative.domain_narrative || {};
    var DL = window.App.ScoringDomainLetter;
    var children = [ h1n("2", "Findings by domain") ];
    scored.perDomain.forEach(function (d) {
      var narr = DN[d.domainId] || {};
      // Just the domain name. The id prefix produced headings like "Gov
      // Governance and risk" and "Monitor Monitoring and detection", which read
      // as a stutter; the id is in the workbook for anyone cross-referencing.
      children.push(h2(d.name));
      if (narr.purpose)        children.push(body(narr.purpose));
      if (narr.why_it_matters) children.push(body(narr.why_it_matters));

      if (d.scorableCount === 0) return;

      if (d.lowCoverage) {
        var low = interp(t.domain_low_coverage, {
          domainName: d.name, answered: d.answeredCount,
          scorable: d.scorableCount, domainGrade: d.grade || "-"
        });
        if (low) children.push(body(low));
      } else if (d.grade) {
        var ok = interp(t.domain_result, {
          domainName: d.name, domainGrade: d.grade,
          answered: d.answeredCount, scorable: d.scorableCount
        });
        if (ok) children.push(body(ok));
      }

      // Unknown is material when there is at least one Unknown answer in this
      // domain. Emit the data finding line; then add the confidence note when
      // confidence has been knocked off "High" by that Unknown share.
      if (d.unknownCount > 0 && t.unknown_finding) {
        var unkLine = interp(t.unknown_finding, {
          domainName:      d.name,
          unknownCount:    d.unknownCount,
          attemptedCount:  d.attemptedCount,
          unknownRatePct:  DL.formatPct(d.unknownRate)
        });
        if (unkLine) children.push(body(unkLine));
      }
      if (d.confidenceKey && d.confidenceKey !== "high" && t.confidence_note) {
        var confLine = interp(t.confidence_note, {
          // The label is "Moderate confidence"; the sentence already supplies
          // the noun, so pass the bare word or it reads "is Moderate confidence".
          confidenceLabel: String(d.confidenceLevel || "").replace(/\s*confidence\s*$/i, "").toLowerCase()
        });
        if (confLine) children.push(body(confLine));
      }

      // Name the questions that came back Unknown. The count sentence above
      // says how many; without the list a reader cannot tell WHAT is unseen,
      // and an unknown is a finding the client can close by producing evidence
      // rather than by doing work. Emitted before the early returns below, or a
      // domain with nothing but unknowns would say nothing about them at all.
      var unknownQs = (d.questions || []).filter(function (q) { return q.state === "unknown"; });
      if (unknownQs.length && t.unknown_question_item) {
        if (t.unknown_questions_intro) children.push(body(t.unknown_questions_intro));
        unknownQs.forEach(function (uq) {
          var uline = interp(t.unknown_question_item, { prompt: uq.prompt });
          if (uline) children.push(bullet(uline));
          var uResp = findResponse(engagement, targetId, uq.questionId);
          if (uResp && String(uResp.notes || "").trim() !== "") {
            children.push(labelled("Why", uResp.notes));
          }
        });
      }

      // The lowest-scoring points in this domain - and only points that are
      // actually low. Taking the bottom three regardless listed answers scored
      // "Fully in place and managed" under a heading calling them the weakest,
      // which in a strong domain was simply untrue. A domain where nothing is
      // below the top band gets a sentence saying so instead.
      var scoredQs = (d.questions || []).filter(function (q) { return q.state === "scored"; });
      var weakQs = scoredQs.filter(function (q) { return q.score < 1; })
        .sort(function (a, b) { return a.score - b.score; })
        .slice(0, 3);
      if (scoredQs.length === 0) return;
      if (weakQs.length === 0) {
        if (t.all_top_band) children.push(body(t.all_top_band));
        return;
      }
      if (t.weakest_questions_intro) children.push(body(t.weakest_questions_intro));

      weakQs.forEach(function (wq) {
        var line = interp(t.weakest_question_item, {
          prompt: wq.prompt, bandLabel: wq.bandLabel
        });
        if (line) children.push(bullet(line));
        // AFTER the bullet it qualifies: printed before, it read as a stray
        // remark with no subject.
        var qDef = lookupPostureQuestion(engagement, wq.questionId);
        if (qDef && qDef.safetyFlag && t.safety_note) {
          children.push(body(t.safety_note));
        }
        // Consultant notes if any
        var resp = findResponse(engagement, targetId, wq.questionId);
        if (resp && resp.notes && String(resp.notes).trim() !== "") {
          children.push(labelled("Notes", resp.notes));
        }
      });
    });
    return children;
  }

  function lookupPostureQuestion(engagement, qId) {
    var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[engagement.instrumentId];
    if (!slot || !slot.instrument) return null;
    var qs = slot.instrument.questions || [];
    for (var i = 0; i < qs.length; i++) if (qs[i].id === qId) return qs[i];
    return null;
  }

  function postureLimitations(narrative, engagement) {
    return [
      h1("Method and limitations"),
    ].concat(methodParas(narrative.boilerplate.method, engagement)).concat([
      body(narrative.boilerplate.limitations)
    ]);
  }

  // ===================================================================
  // Design B builders (posture report): navy cover with hero, visual
  // scorecard, numbered headings, maturity meter, gap register.
  // ===================================================================

  // Numbered H1: brand-blue number followed by the navy title.
  // A numbered heading. Tagged with the text WITHOUT its number, because the
  // screen card it pairs with has no number and the two have to slug to the
  // same section key. The number is carried separately so a rename keeps it.
  function h1n(num, text) {
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_1,
      children: [ run(num + "\u2003", { color: COLOR.brandBlue, bold: true }), run(text) ]
    });
    p.__headingText = text; p.__headingLevel = 1; p.__headingNum = num;
    return p;
  }

  function heroAsset() { return (window.App && window.App.Assets && window.App.Assets.hero) || null; }
  function imageRunFrom(asset, widthPx) {
    if (!asset) return null;
    var w = widthPx;
    var hgt = Math.round(w / (asset.aspect || (asset.width / asset.height)));
    return new window.docx.ImageRun({ data: asset.bytes(), transformation: { width: w, height: hgt } });
  }

  function gradeFill(g) {
    if (g === "A" || g === "B") return COLOR.metBg;
    if (g === "C") return COLOR.nearBg;
    if (g === "D" || g === "E" || g === "F") return COLOR.gapBg;
    return COLOR.naBg;
  }
  function gradeTextColor(g) {
    if (g === "A" || g === "B") return COLOR.met;
    if (g === "C") return COLOR.near;
    if (g === "D" || g === "E" || g === "F") return COLOR.gap;
    return COLOR.muted;
  }
  function gradeToMaturity(g) { return ({ A: 5, B: 4, C: 3, D: 2, E: 1, F: 1 })[g] || 1; }
  // One line per level, matching the label above it.
  var MATURITY_BLURB = [
    "Controls are ad hoc and depend on individuals; little is written down or repeatable.",
    "Controls exist but are applied inconsistently, and are not yet measured or routinely improved.",
    "Controls are defined and applied consistently, though not yet measured against objectives.",
    "Controls are measured against objectives, and their performance is understood.",
    "Controls are measured and routinely improved as conditions change."
  ];

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

  function brandFooters() {
    return { default: new window.docx.Footer({ children: [ new window.docx.Paragraph({ spacing: { before: 0, after: 0 }, border: { top: { style: "single", size: 4, color: "E2E7EE", space: 6 } }, children: [ run("SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX   ·   +44 (0) 161 495 4600   ·   www.solutionspt.com", { font: FONT, size: 14, color: COLOR.muted }) ] }) ] }) };
  }

  function brandFootersDoc(instrument, engagement) {
    var e = (engagement && engagement.engagement) || {};
    var AT = window.docx.AlignmentType, WT = window.docx.WidthType, PN = window.docx.PageNumber;
    function fc(par, w){ return new window.docx.TableCell({ width:{size:w,type:WT.PERCENTAGE}, borders: TBL_NONE, children:[par] }); }
    var L = new window.docx.Paragraph({ spacing:{before:0,after:0}, children:[ run("Confidential · © SolutionsPT Ltd", {font:FONT, size:14, color:COLOR.soft}) ] });
    var M = new window.docx.Paragraph({ alignment: AT.CENTER, spacing:{before:0,after:0}, children:[ run((instrument.title||"") + " · " + (e.clientName||""), {font:FONT, size:14, color:COLOR.soft}) ] });
    var R = new window.docx.Paragraph({ alignment: AT.RIGHT, spacing:{before:0,after:0}, children:[ new window.docx.TextRun({ children:[ PN.CURRENT ], font:FONT, size:14, color:COLOR.soft }) ] });
    return { default: new window.docx.Footer({ children: [ new window.docx.Table({ width:{size:100,type:WT.PERCENTAGE}, borders: TBL_NONE, rows:[ new window.docx.TableRow({ children:[ fc(L,34), fc(M,46), fc(R,20) ] }) ] }) ] }) };
  }

  // Full-bleed cover: a full-page background image (navy + OT hero + scrim)
  // behind brand-font text. Generic: opts.titleLines, opts.titleSize, opts.subLine.
  function coverDesignB(engagement, instrument, opts) {
    opts = opts || {};
    var e = engagement.engagement || {};
    var titleLines = opts.titleLines || splitTitleTwo(instrument.title);
    var titleSize = opts.titleSize || 52;
    var TableRow = window.docx.TableRow, TableCell = window.docx.TableCell, ShadingType = window.docx.ShadingType;
    var HR = (window.docx.HeightRule) || { ATLEAST: "atLeast" };
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

    kids.push(new window.docx.Paragraph({ spacing: { before: 820, after: 70 }, children: [ W("OT CYBER SECURITY ASSESSMENT", { color: COLOR.skyBlue, bold: true, size: 21 }) ] }));
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
    kids.push(new window.docx.Paragraph({ spacing: { before: 240 }, children: [ W(e.clientName || "Client", { color: "C7D8E8", size: 30 }) ] }));
    if (e.siteName) kids.push(new window.docx.Paragraph({ spacing: { before: 0 }, children: [ W(e.siteName, { color: "9DB8D6", size: 21 }) ] }));
    if (opts.subLine) kids.push(new window.docx.Paragraph({ spacing: { before: 150 }, children: [ W(opts.subLine, { color: COLOR.skyBlue, size: 20, bold: true }) ] }));

    kids.push(new window.docx.Paragraph({ spacing: { before: 0, after: 0, line: 8800, lineRule: "exact" }, children: [ run("", { size: 1 }) ] }));

    kids.push(new window.docx.Paragraph({ spacing: { before: 0, after: 120 }, children: [
      W("ISSUE   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
      W((e.documentRevision || "0.1") + "  ·  " + (e.issuedDate || e.dateOfVisit || ""), { color: "FFFFFF", size: 19 }),
      W("        AUTHOR   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
      W(e.consultant || "", { color: "FFFFFF", size: 19 }),
      W("        CLASSIFICATION   ", { color: COLOR.skyBlue, bold: true, size: 16 }),
      W(e.confidentiality || "Confidential", { color: "FFFFFF", size: 19 })
    ] }));
    kids.push(new window.docx.Paragraph({ spacing: { before: 0, after: 0 }, children: [ W("SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX", { color: "DBE6F1", size: 15 }) ] }));
    kids.push(new window.docx.Paragraph({ children: [ W("Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com", { color: "DBE6F1", size: 15 }) ] }));

    var coverCell = new TableCell({ margins: { top: 760, bottom: 560, left: 800, right: 800 }, children: kids });
    // The closing paragraph is on the cover page by construction, so a draft's
    // watermark is anchored there (see markDraft); the shape is positioned on
    // the page, so it adds nothing to the layout.
    var anchor = new window.docx.Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: "exact" }, children: [ run("", { size: 1 }) ] });
    anchor.__coverAnchor = true;
    return [
      new window.docx.Table({
        width: dxaW(PAGE_W), columnWidths: [PAGE_W], borders: NB,
        rows: [ new TableRow({ children: [ coverCell ] }) ]
      }),
      anchor
    ];
  }

  // The OT cyber maturity meter: five segments, filled up to the derived level.
  function maturityMeterDesignB(scored) {
    var TableRow = window.docx.TableRow;
    var HR = (window.docx.HeightRule) || { ATLEAST: "atLeast" };
    var lvl = gradeToMaturity(scored.headlineGrade);
    var labels = ["Initial", "Managed", "Defined", "Quantified", "Optimising"];
    var segCells = [];
    for (var i = 0; i < 5; i++) {
      segCells.push(cell(body("", { size: 2 }), { width: 20, fill: i < lvl ? COLOR.navy : "DFE5EE" }));
    }
    var labelCells = labels.map(function (l, i) {
      return cell(body(l, { size: 14, bold: i < lvl, color: i < lvl ? COLOR.navy : COLOR.soft }), { width: 20 });
    });
    return [
      body("OT CYBER MATURITY", { color: COLOR.muted, bold: true, size: 16, spacing: { before: 200, after: 60 } }),
      table([ new TableRow({ height: { value: 200, rule: HR.ATLEAST }, children: segCells }) ]),
      table([ new TableRow({ children: labelCells }) ]),
      // The description has to match the level. It was hardcoded to the level-2
      // wording ("applied inconsistently"), so a strong assessment described
      // itself as weak - the meter said Optimising and the sentence underneath
      // said controls were inconsistent.
      body("Level " + lvl + " of 5: " + labels[lvl - 1] + ". " + MATURITY_BLURB[lvl - 1],
           { color: COLOR.muted, size: 18, spacing: { before: 80 } })
    ];
  }

  // The visual scorecard page (front of the body): headline grade + KPIs,
  // posture-by-domain bar chart, and the maturity meter. No section title.
  function postureScorecardDesignB(scored, narrative, scoreBarsBuf, engagement) {
    var DL = window.App.ScoringDomainLetter;
    var TableRow = window.docx.TableRow;
    var hg = scored.headlineGrade || "-";
    var pri = ((scored.priorityOrder && scored.priorityOrder.graded) || []).filter(function (d) { return d.grade === "D" || d.grade === "E" || d.grade === "F"; }).length;
    var children = [];
    children.push(table([ new TableRow({ children: [
      cell([ body(hg, { bold: true, color: gradeTextColor(hg), size: 56 }), body("Headline grade", { color: COLOR.muted, size: 16 }) ], { width: 25, fill: gradeFill(hg) }),
      cell([ body(DL.formatPct(scored.overallCoverage), { bold: true, color: COLOR.navy, size: 36 }), body("Coverage", { color: COLOR.muted, size: 16 }) ], { width: 25 }),
      cell([ body((scored.totalAnswered || 0) + " / " + (scored.totalScorable || 0), { bold: true, color: COLOR.navy, size: 28 }), body("Answered", { color: COLOR.muted, size: 16 }) ], { width: 25 }),
      cell([ body(String(pri), { bold: true, color: COLOR.gap, size: 36 }), body("Priority gaps", { color: COLOR.muted, size: 16 }) ], { width: 25 })
    ] }) ]));
    // Every domain tied at the lowest grade, not just the first of them: they
    // all sit on the ceiling, so naming one and not the others tells the reader
    // to fix half the problem.
    var weakArr1 = scored.weakestDomains || (scored.weakestDomain ? [scored.weakestDomain] : []);
    // "No cross-domain compensation" was left over from the weakest-link era
    // and is now simply untrue: the headline IS an average across the domains,
    // bounded by the two ceilings. Say what actually holds the grade.
    if (weakArr1.length) children.push(body("Headline grade " + hg +
      (scored.overallConfidenceLevel ? ", " + String(scored.overallConfidenceLevel).toLowerCase() : "") +
      (weakArr1.length === 1
        ? ". Weakest domain: " + weakArr1[0].name + " (" + (weakArr1[0].grade || "-") + ")."
        : ". Weakest domains, all at " + (weakArr1[0].grade || "-") + ": " +
          weakArr1.map(function (w) { return w.name; }).join(", ") + ".") +
      (scored.capApplied
        ? (scored.capReason === "not-unanimous"
            ? " The top grade is held back because not every domain reaches it."
            : (weakArr1.length === 1 ? " The grade is held down by that domain."
                                     : " The grade is held down by those domains."))
        : ""),
      { color: COLOR.muted, spacing: { before: 120 } }));
    children.push(h2("Posture by domain"));
    if (scoreBarsBuf) children.push(new window.docx.Paragraph({ children: [ new window.docx.ImageRun({ data: scoreBarsBuf, transformation: { width: 580, height: Math.round(580 * (34 + 28 * scored.perDomain.length) / 640) } }) ] }));
    return children.concat(maturityMeterDesignB(scored));
  }

  // Gap register: every scored question at band 0 or 1, worst first.
  function postureGapRegisterDesignB(scored, engagement, targetId) {
    var TableRow = window.docx.TableRow;
    var gaps = [];
    scored.perDomain.forEach(function (d) {
      (d.questions || []).forEach(function (q) {
        if (q.state === "scored" && typeof q.band === "number" && q.band <= 1) gaps.push({ d: d, q: q });
      });
    });
    gaps.sort(function (a, b) { return (a.q.band - b.q.band) || (a.q.score - b.q.score); });
    var children = [ h1n("3", "Gap register") ];
    if (gaps.length === 0) {
      children.push(body("No scored question fell into band 0 or 1. No gap register entries were generated."));
      return children;
    }
    children.push(body("Lowest-scoring questions first. Business impact, recommendation and priority to be completed by the consultant.", { color: COLOR.muted }));
    var rows = [ new TableRow({ children: [
      headerCell("Finding", 44), headerCell("Domain", 12), headerCell("Band", 10), headerCell("Evidence / notes", 22), headerCell("Priority", 12)
    ] }) ];
    gaps.forEach(function (g) {
      var resp = findResponse(engagement, targetId, g.q.questionId);
      var note = (resp && resp.notes) ? resp.notes : "";
      var bits = [];
      if (note) bits.push(note);
      if (g.q.impact) bits.push("Impact: " + g.q.impact);
      if (g.q.action) bits.push("Action: " + g.q.action);
      rows.push(new TableRow({ children: [
        cell(body(g.q.prompt)),
        cell(body(cap(g.d.domainId))),
        cell(body(String(g.q.band), { bold: true, color: g.q.band === 0 ? COLOR.gap : COLOR.near }), { fill: g.q.band === 0 ? COLOR.gapBg : COLOR.nearBg }),
        cell(body(bits.join("   |   "), { color: COLOR.muted })),
        cell(body(nis2PriBandD(g.q.priorityBand).label || ""))
      ] }));
    });
    children.push(table(rows));
    return children;
  }

  // Posture improvement roadmap as PROSE (replaces the gap-register table and the
  // blank recommendation scaffold), mirroring the CAF/SL/NIS2 prose roadmaps.
  // Every scored question below the top band, worst first / consultant order,
  // as a Heading 2 with labelled lines: current band, why it matters (question
  // rationale), captured evidence, business impact, recommended action, owner.
  function postureRoadmapSection(scored, narrative, instrument, engagement, targetId) {
    var children = [ h1n("3", "Improvement roadmap") ];
    var roadmap = scored.roadmap || [];
    if (roadmap.length === 0) {
      children.push(body("Every scored question reached the top band, so there is nothing to add to the roadmap."));
      return children;
    }
    var qById = {};
    (instrument.questions || []).forEach(function (q) { qById[q.id] = q; });
    var domainName = {};
    (instrument.domains || []).forEach(function (d) { domainName[d.id] = d.name || d.id; });
    var scale = (instrument.responseModel && instrument.responseModel.bandScale) || [];
    var topLabel = scale.length ? (scale[scale.length - 1].label || "") : "";

    children.push(body("The roadmap covers every scored question below the top capability band, in the consultant's priority order, lowest first."));

    roadmap.forEach(function (it, i) {
      var q = qById[it.questionId] || {};
      var safety = it.safetyFlag ? "   safety-related" : "";
      var pb = nis2PriBandD(it.priorityBand);
      // Heading is code + short title, matching every other family. The whole
      // question used to be the heading, which made long sentences of the
      // table of contents; it now leads the entry body instead.
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + it.code + " " + it.title) ]
      }));
      if (it.prompt && it.prompt !== it.title) {
        children.push(body(it.prompt, { italics: true, color: COLOR.muted, spacing: { after: 60 } }));
      }
      children.push(new window.docx.Paragraph({
        style: "BodyText", spacing: { after: 60 },
        children: [
          run("Current: ", { bold: true }),
          run(it.bandLabel || ("band " + it.band), { bold: true, color: (it.band === 0 ? COLOR.gap : COLOR.near) }),
          run("    Domain: ", { bold: true }),
          run(domainName[it.domainId] || it.domainId),
          run(safety, { bold: true, color: COLOR.gap })
        ]
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
      children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));

      // The question's own description of good practice, which the consultant
      // can switch off on the report page (on by default). The scale's top label
      // ("Fully in place and managed") is never printed here: it said the same
      // thing under every item.
      var rnGood = (engagement && engagement.reportNarrative) || {};
      if (rnGood.includeGoodPractice !== false && q.goodLooksLike) {
        children.push(nis2Field("What good looks like", q.goodLooksLike));
      }
      if (q.rationale) children.push(nis2Field("Why this matters", q.rationale));
      children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this question."));
      children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact", targetId)));
      children.push(nis2Field("Recommended action", it.action, planWhere(it, "action", targetId)));
      children.push(nis2Field("Owner", it.owner || "To be assigned"));
    });
    return children;
  }

  // Follow-up routing for screener-style domain-letter instruments: weak or
  // ungradeable domains route into the deep assessment that establishes the
  // real position. Data-driven from instrument.followUpRoutes (absent on the
  // plain posture instrument); trigger logic shared with the on-screen card.
  function postureFollowUpSection(instrument, scored) {
    var res = window.App.Report && window.App.Report.triggeredFollowUpRoutes
      ? window.App.Report.triggeredFollowUpRoutes(instrument, scored)
      : null;
    if (!res) return [];
    var children = [ h1("Where to go deeper") ];
    if (res.spec.intro) children.push(body(res.spec.intro));
    if (!res.triggered.length) {
      children.push(body(res.spec.noneTriggered || "No deep-dive assessment triggered by this screening."));
    } else {
      res.triggered.forEach(function (t) {
        children.push(new window.docx.Paragraph({
          heading: window.docx.HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 20 },
          children: [ run(t.route.title) ]
        }));
        children.push(body([
          run("Triggered by: ", { bold: true }),
          run(t.domainName + " (" + t.reason + ").", { color: t.reason.indexOf("graded") === 0 ? COLOR.gap : COLOR.muted })
        ]));
        if (t.route.detail) children.push(body(t.route.detail));
      });
    }
    return children;
  }

  function buildPostureDoc(engagement, instrument, profile, narrative, opts, callback) {
    var scoredAll = window.App.ScoringDomainLetter.scoreEngagement(engagement, instrument, profile);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

    // Render a domain score bars chart, rasterise to PNG, then assemble.
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    var svg = window.App.Charts.domainScoreBars(scored, { width: 640, labelWidth: 260 });
    holder.appendChild(svg);
    rasterise(svg, opts, function (blob) {
      try { document.body.removeChild(holder); } catch (_) {}
      blobBuf(blob, function (buf) {
        try {
          // Design B: a full-bleed navy cover in its own zero-margin section,
          // then the body. The body opens with the visual scorecard, then the
          // numbered narrative flow (1 Executive summary ... 4 Recommendations).
          // Cover title from instrument.docxCover for domain-letter siblings
          // (e.g. the supplier screener); the posture wording is the fallback.
          var coverTitleLines = (instrument.docxCover && instrument.docxCover.titleLines) || ["General OT Security", "Posture Assessment"];
          var coverChildren = coverDesignB(engagement, instrument, { titleLines: coverTitleLines, titleSize: 60 });
          // Executive summary leads; the indicative-grade caveat closes it; the
          // scorecard sits on its own page; the roadmap is now prose (replacing
          // the gap-register table and the blank recommendation scaffold).
          var postIntro = []
            .concat(postureDocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
            .concat(postureExecutiveSummary(narrative, scored, engagement))
            .concat(execSummaryAddenda(engagement, opts.progress))
            .concat(postureIndicativeCaveat(narrative))
            .concat([pageBreakPara()])
            .concat(postureScorecardDesignB(scored, narrative, buf, engagement))
            .concat([pageBreakPara()])
            .concat(postureAbout(narrative, instrument))
            .concat(postureHowToRead(narrative))
            .concat(slGlossary(instrument, null, narrative, engagement))
          var postTables = postureDomainResultsSection(scored, narrative, null); // auto-fit table fills the landscape page
          var postTail = []
            .concat(posturePriorityOrder(scored, narrative, engagement))
            .concat(postureFindingsByDomain(scored, narrative, engagement, target.id))
            .concat(postureRoadmapSection(scored, narrative, instrument, engagement, target.id))
            .concat(postureFollowUpSection(instrument, scored))
            .concat(progressSection(opts.progress))
            .concat(basisOfAssessmentSection(engagement))
            .concat(postureLimitations(narrative, engagement)).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

          var PO = docPO();
          var doc = makeDoc(engagement, {
            creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
            title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
            description: (instrument.docxCover && instrument.docxCover.description) || "Executive OT posture assessment",
            styles: buildStyles(),
            sections: [
              { properties: { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren }
            ].concat(bodySectionsFromSegments(brandHeaders(), brandFootersDoc(instrument, engagement),
              [ { land: false, children: postIntro }, { land: true, children: postTables }, { land: false, children: postTail } ]))
          }, opts);
          packDoc(doc, opts, callback);
        } catch (e) {
          callback(e);
        }
      });
    });
  }

  // ---- CAF (caf-achieved family) ----------------------------------------
  //
  // Verbatim-content rule: boilerplate is inserted unchanged from narrative.
  // boilerplate; data lines are composed by token substitution into
  // narrative.templates. No freewriting in code. The selected regulator
  // profile name is named throughout. When the profile is a placeholder
  // (expectedState all null), the meeting / below columns are omitted and a
  // notice is rendered in the executive summary.

  function cafBandColour(state) {
    if (state === "achieved")  return { fill: COLOR.metBg,  text: COLOR.met  };
    if (state === "partially") return { fill: COLOR.nearBg, text: COLOR.near };
    if (state === "not")       return { fill: COLOR.gapBg,  text: COLOR.gap  };
    // Unknown only reaches the roadmap on unknownIsFinding instruments, where it
    // is the most severe finding.
    if (state === "unknown")   return { fill: COLOR.severeBg, text: COLOR.severe };
    return { fill: COLOR.naBg, text: COLOR.muted };
  }
  function cafStateLabelD(state, instrument) {
    var L = window.App.ScoringCAF.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    return "Not set";
  }
  function cafProfileInfoFromOpts(opts) {
    var reg = (opts && opts.cafProfileRegistry) || null;
    var activeId = (opts && opts.cafProfileId) || null;
    var loaded = (opts && opts.cafProfile) || null;
    var regEntry = null;
    if (reg && reg.profiles) {
      for (var i = 0; i < reg.profiles.length; i++) {
        if (reg.profiles[i].id === activeId) { regEntry = reg.profiles[i]; break; }
      }
    }
    return {
      id: activeId,
      name: (regEntry && regEntry.name) || (loaded && loaded.name) || activeId || "General",
      status: regEntry ? regEntry.status : (loaded ? loaded.status : null),
      placeholder: !!(regEntry && regEntry.status === "placeholder")
    };
  }

  // Portrait usable area on A4 with 1in margins is 11906 - 2*1440 = 9026 dxa.
  // Landscape usable area on A4 with 0.5in margins is 16838 - 2*720 = 15398
  // dxa. All CAF tables size to one of those two budgets using fixed layout.
  var CAF_PORTRAIT_W  = 9026;
  var CAF_LANDSCAPE_W = 15398;

  // ---- per-section orientation (shared by every family's build) -------------
  // Reports are portrait for prose and put their wide RESULTS tables on their
  // own landscape pages so they have room to breathe. A build passes an ordered
  // list of segments { land, children }; consecutive same-orientation segments
  // merge into one Word section, and each section after the first starts on a
  // fresh page (docx-js default nextPage break) - so no manual page break is
  // needed at an orientation boundary.
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

  // Dxa width needed to render a table HEADER on one line. The report is built
  // in-browser with the report font (Segoe UI, a Windows system font, so the
  // canvas rendering matches Word closely), so MEASURE the real rendered width
  // rather than estimate per-character - that is what got "Unknown" wrapping.
  // 1 CSS px @96dpi = 15 dxa; the header is 11pt bold (BodyText size 22). Falls
  // back to a generous linear estimate if canvas/DOM is unavailable.
  var _hdrCtx = null;
  function estHeaderDxa(text) {
    var s = String(text == null ? "" : text);
    var CELL_PAD = 240;   // default cell margins (~0.08" each side) + a hair
    var SAFETY = 1.06;    // small cushion vs Word's own rendering
    try {
      if (!_hdrCtx && typeof document !== "undefined") {
        _hdrCtx = document.createElement("canvas").getContext("2d");
      }
      if (_hdrCtx) {
        _hdrCtx.font = "bold 14.667px '" + FONT + "', 'Segoe UI', Arial, sans-serif";
        var px = _hdrCtx.measureText(s).width;
        if (px > 0) return Math.max(560, Math.ceil(px * 15 * SAFETY) + CELL_PAD);
      }
    } catch (e) { /* fall through to the estimate */ }
    return Math.max(560, Math.round(s.length * 120 + 360)); // generous fallback
  }
  // Size each non-label column to fit its header on one line; the first (label)
  // column takes the remainder (with a floor). If the header-ideal widths exceed
  // the budget, shrink the non-label columns proportionally toward a per-column
  // minimum (widest headers give up the most first).
  function fitHeaderWidths(headers, totalW, opts) {
    opts = opts || {};
    totalW = totalW || CAF_PORTRAIT_W;
    var labelFloor = opts.labelFloor || 2400, colMin = opts.colMin || 560;
    var w = headers.map(function (h, i) { return i === 0 ? 0 : estHeaderDxa(h); });
    function sumNon() { return w.reduce(function (a, b, i) { return i === 0 ? a : a + b; }, 0); }
    var label = totalW - sumNon();
    if (label < labelFloor && headers.length > 1) {
      var over = labelFloor - label;
      var reducible = sumNon() - (headers.length - 1) * colMin;
      if (reducible > 0) {
        var factor = Math.max(0, (reducible - over) / reducible);
        w = w.map(function (x, i) { return i === 0 ? x : colMin + Math.round((x - colMin) * factor); });
        label = totalW - sumNon();
      }
    }
    w[0] = Math.max(colMin, label);
    return w;
  }
  // caf-achieved results tables keep the STATE columns a uniform width (all the
  // same, sized to fit the widest state label) for a clean look; the other
  // columns fit their own headers, and the label column takes the remainder.
  function cafResultsColWidths(ss, opts) {
    opts = opts || {};
    var totalW = opts.totalW || CAF_PORTRAIT_W;
    var stateW = Math.max.apply(null, ss.map(function (s) { return estHeaderDxa(s.label); }).concat([700]));
    var unkW = estHeaderDxa("Unknown");
    var naW  = opts.hasNA ? estHeaderDxa("N/A") : 0;
    var aboveW = opts.hasAbove ? estHeaderDxa("Above baseline") : 0;
    var appW = estHeaderDxa("Applicable");
    var meetW = opts.placeholder ? 0 : estHeaderDxa("Meeting expected");
    function nonLabel() { return ss.length * stateW + unkW + naW + aboveW + appW + meetW; }
    var labelFloor = opts.labelFloor || 2600, stateFloor = 820;
    var labelW = totalW - nonLabel();
    if (labelW < labelFloor && ss.length) {
      var over = labelFloor - labelW;
      var reducible = ss.length * Math.max(0, stateW - stateFloor);
      var take = Math.min(over, reducible);
      stateW -= Math.round(take / ss.length);
      labelW = totalW - nonLabel();
    }
    labelW = Math.max(1400, labelW);
    return { stateW: stateW, unkW: unkW, naW: naW, aboveW: aboveW, appW: appW, meetW: meetW, labelW: labelW };
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

  function cafTitlePage(engagement, instrument, info) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2400;
    var valueW = CAF_PORTRAIT_W - labelW;
    var metaRows = [
      ["Client",         e.clientName],
      ["Site",           e.siteName],
      ["Address",        e.siteAddress],
      ["Site contact",   e.siteContact],
      ["Consultant",     e.consultant],
      ["Date of visit",  e.dateOfVisit],
      ["Opportunity ID", e.opportunityId]
    ];
    var rows = metaRows.map(function (r) {
      return new TableRow({ children: [
        cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }),
        cellDxa(r[1] || "", valueW)
      ] });
    });
    var out = [];
    var lg = titleLogoParagraph();
    if (lg) out.push(lg);
    return out.concat([
      new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.TITLE,
        children: [run(instrument.title)]
      }),
      body("NCSC CAF 4.0 alignment and gap analysis", { style: "Caption" }),
      body("Selected profile: " + info.name + (info.placeholder ? " (placeholder)" : ""), { style: "Caption" }),
      body("", { spacing: { after: 200 } }),
      fixedTable(rows, [labelW, valueW]),
      body("", { spacing: { after: 200 } })
    ]);
  }

  function cafDocumentControl(engagement, instrument, info, opts) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2700;
    var valueW = CAF_PORTRAIT_W - labelW;
    var pairs = [
      ["Document revision", e.documentRevision],
      ["Status",            statusLabel(opts)],
      ["QA review by",      e.qaReviewBy],
      ["Authorised by",     e.authorisedBy],
      ["Issued to",         e.issuedTo],
      ["Issued date",       e.issuedDate],
      ["Confidentiality",   e.confidentiality],
      ["Instrument",        instrument.title],
      ["Edition",           instrument.edition || ""],
      ["Content version",   instrument.contentVersion || ""],
      ["Selected profile",  info.name + (info.placeholder ? " (placeholder)" : "")]
    ];
    var rows = pairs.map(function (r) {
      return new TableRow({ children: [
        cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }),
        cellDxa(r[1] || "", valueW)
      ] });
    });
    return [
      h1("Document control and confidentiality"),
      fixedTable(rows, [labelW, valueW]),
      body("", { spacing: { after: 200 } })
    ];
  }

  // Expanded executive summary, composed from the narrative pack:
  //  1 Verdict  2 Scope & profile  3 Gap shape  4 Regulatory stakes  5 Path forward & confidence.
  // Slot-substitution + verbatim boilerplate + seeded consultant blocks. No free-writing.
  function cafExecutiveSummary(narrative, scored, info, engagement, instrument) {
    var N = window.App.ScoringCAF;
    instrument = instrument || {};
    var ov = scored.overall, c = ov.counts;
    var children = [ h1n("1", "Executive summary") ];
    var es = narrative && narrative.executiveSummary;

    if (!es) {
      var t0 = narrative.templates || {};
      children.push(body(narrative.boilerplate.report_intro));
      children.push(body("Selected profile: " + info.name + "."));
      scored.byObjective.forEach(function (obj) {
        var line = interp(t0.profile_line, { objId: obj.objectiveId, objName: obj.name, achievedCount: obj.counts.achieved, partiallyCount: obj.counts.partially, notCount: obj.counts.not, totalCount: obj.total });
        if (line) children.push(bullet(line));
      });
      return children;
    }

    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var phrases = T.verdictPhrases || {}, frags = T.gapConcentrationFragments || {};
    var clientName = e.clientName || "the organisation";
    var belowCount = (scored.roadmap || []).length;
    var hasGaps = belowCount > 0;

    var a = c.achieved, p = c.partially, n = c.not, verdictPhrase;
    if (n >= a && n >= p && n > 0) verdictPhrase = phrases.substantial;
    else if (p >= a && p >= n && p > 0) verdictPhrase = phrases.recognised;
    else verdictPhrase = phrases.foundations;

    // State labels + unit noun for this instrument, so the wording reads in its own
    // terms (CAF: outcomes Achieved / Not Achieved; NIST: controls Satisfied / Other
    // Than Satisfied; CIS: safeguards Implemented / Not Implemented).
    var subStates = (N.substantiveStates ? N.substantiveStates(instrument) : []);
    var notLabel = (subStates.filter(function (s) { return s.value === "not"; })[0] || { label: "Not Achieved" }).label;
    var partialState = subStates.filter(function (s) { return s.value === "partially"; })[0];
    var gapWord = partialState ? (partialState.label + " or " + notLabel) : notLabel;
    var unitNoun = ((instrument.display && instrument.display.outcomesTitle) ? instrument.display.outcomesTitle.replace(/s$/i, "") : "outcome").toLowerCase() + "s";

    // Grouping level for the gap-shape narrative: objectives when the instrument has
    // a meaningful multi-objective structure, else the principle level (a single-
    // objective instrument like CIS carries its shape on the Controls).
    var objGroups = (scored.byObjective || []).filter(function (o) { return (o.total || 0) > 0; });
    var useObjectives = objGroups.length >= 2;
    var groupNoun = useObjectives ? "objectives"
      : (((instrument.display && instrument.display.principleNoun) ? instrument.display.principleNoun.toLowerCase() : "area") + "s");
    var groups = (useObjectives ? (scored.byObjective || []) : (scored.byPrinciple || [])).map(function (g) {
      return { id: (g.objectiveId != null ? g.objectiveId : g.principleId), name: g.name, counts: g.counts, total: g.total };
    });

    var ranked = groups.slice().filter(function (o) { return (o.total || 0) > 0; });
    ranked.sort(function (x, y) {
      var xg = (x.counts.partially + x.counts.not), yg = (y.counts.partially + y.counts.not);
      if (yg !== xg) return yg - xg;
      return String(x.id).localeCompare(String(y.id));
    });
    var w0 = ranked[0], weakestObjectiveName, weakestObjectiveDetail;
    if (w0 && (w0.counts.partially + w0.counts.not) > 0) {
      weakestObjectiveName = w0.id + " " + w0.name;
      var wc = w0.counts, wgaps = wc.partially + wc.not;
      weakestObjectiveDetail = (wc.achieved === 0 && wc.partially === 0)
        ? "all " + wc.not + " applicable " + unitNoun + " are " + notLabel
        : wgaps + " of " + w0.total + " " + unitNoun + " are " + gapWord;
    } else {
      weakestObjectiveName = "no single area";
      weakestObjectiveDetail = "no " + unitNoun + " are below the expected state";
    }

    var partialAreas = [], absentAreas = [];
    groups.forEach(function (o) {
      var oc = o.counts;
      if ((o.total || 0) === 0 || (oc.partially + oc.not) === 0) return;
      if (oc.achieved === 0 && oc.partially === 0) absentAreas.push(o.id + " " + o.name);
      else if (oc.partially >= oc.not) partialAreas.push(o.id + " " + o.name);
      else absentAreas.push(o.id + " " + o.name);
    });
    function bucket(names, clause) {
      if (names.length <= 3) return "In " + nis2ListJoin(names) + ", " + clause + ".";
      return "Across " + names.length + " " + groupNoun + ", " + clause + ".";
    }
    var gcParts = [];
    if (partialAreas.length) gcParts.push(bucket(partialAreas, frags.partialClause || ""));
    if (absentAreas.length) gcParts.push(bucket(absentAreas, frags.absentClause || ""));
    var gapConcentrationSentence = gcParts.join(" ");

    var na = (scored.roadmap || []).filter(function (it) { return it.state === "not"; });
    if (!na.length) na = (scored.roadmap || []).slice();
    var autoTopPriorityHint = na.length
      ? nis2ListJoin(na.slice(0, 2).map(function (it) { return it.outcomeId + " " + it.title; }))
      : "the highest-priority outcomes in the roadmap";

    var slots = {
      clientName: clientName, profileName: info.name, verdictPhrase: verdictPhrase,
      weakestObjectiveName: weakestObjectiveName, weakestObjectiveDetail: weakestObjectiveDetail,
      applicableCount: ov.total, achievedCount: a, partiallyCount: p, notAchievedCount: n, belowCount: belowCount,
      unknownCount: c.unknown,
      gapConcentrationSentence: gapConcentrationSentence,
      coveragePct: N.formatPct(ov.coverage), confidenceLabel: ov.confidenceLevel || "confidence not rated",
      autoTopPriorityHint: autoTopPriorityHint
    };

    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots)));
    children.push(body(nis2Fill(T.exec_scope, slots) + " " + nis2Fill(T.exec_profile, slots)));
    if (hasGaps) {
      children.push(body(nis2Fill(T.exec_gap_shape, slots)));
      if (B.exec_partial_vs_absent) children.push(body(B.exec_partial_vs_absent));
    }
    if (B.regulatory_stakes) children.push(body(B.regulatory_stakes));
    var dGaps = (scored.byObjective || []).some(function (o) { return o.objectiveId === "D" && (o.counts.partially + o.counts.not) > 0; });
    slots.repExposureClause = dGaps ? (CB.consultant_exposure_rep_clause || "") : "";
    if (CB.consultant_exposure_seed) children.push(body(nis2Fill(CB.consultant_exposure_seed, slots)));
    // Consultant exposure / top priorities use the in-tool input when supplied,
    // else fall back to the bracketed placeholder for completion in Word.
    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else if (CB.consultant_exposure) children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));
    var topPri = (rn.topPriorities || "").trim();
    children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
    if (topPri) children.push(body(topPri));
    else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    children.push(body(nis2Fill(T.exec_confidence, slots)));
    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));
    return children;
  }

  function cafNotFormalCaveatBlock(narrative) {
    var caveat = narrative.boilerplate && narrative.boilerplate.not_formal_caveat;
    if (!caveat) return [];
    var TableRow = window.docx.TableRow;
    var WidthType = window.docx.WidthType;
    var Table = window.docx.Table;
    var ShadingType = window.docx.ShadingType;
    var TableCell = window.docx.TableCell;
    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [
        new TableCell({
          children: [
            new window.docx.Paragraph({
              style: "BodyText",
              children: [run("Not a formal assessment", { bold: true, color: COLOR.gap })]
            }),
            new window.docx.Paragraph({ style: "BodyText", children: [run(caveat)] })
          ],
          shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
        }) ]
      }) ]
    });
    return [
      h1("Not a formal assessment"),
      tbl,
      body("", { spacing: { after: 160 } })
    ];
  }

  function cafAboutSection(narrative, instrument) {
    var bp = narrative.boilerplate || {};
    var out = [];
    // "About the CAF" is right for the CAF and wrong for everything else on
    // this engine. Instruments that carry their own framing (display.about, as
    // NIST, CIS and the ONR SyAPs set do) get a correctly titled section;
    // previously they had no About section in the document at all.
    if (bp.about_caf) { out.push(h1("About the CAF")); out.push(body(bp.about_caf)); }
    else {
      var framing = (instrument && ((instrument.display && instrument.display.about) || instrument.framing)) || "";
      if (framing) { out.push(h1("About this assessment")); out.push(body(framing)); }
    }
    // Who publishes the framework and what standing it has.
    var sc2525 = seriesContextOf(typeof instrument !== "undefined" ? instrument : null, narrative);
    // An instrument with an attribution but no About prose still gets its
    // About heading, and gets it BEFORE the series context, which otherwise
    // trailed on the end of the previous section with the attribution under a
    // heading of its own. Without an attribution nothing changes here.
    if (!out.length && attributionOf(instrument).length) out.push(h1("About this assessment"));
    var aboutHeaded = out.length > 0;
    if (sc2525) out.push(body(sc2525));
    // The licence the framework's verbatim text is reproduced under. Every
    // instrument on this engine that quotes its source carries one.
    out = out.concat(attributionParas(instrument, aboutHeaded));
    if (bp.ot_focus)   { out.push(h1("OT focus"));     out.push(body(bp.ot_focus)); }
    // implementation_context was rendered on screen but never emitted here, so
    // a narrative pack that used it (NIST SP 800-53) showed the section in the
    // preview and silently dropped it from the client document. Order matches
    // the screen's boilerplate stack.
    if (bp.implementation_context) { out.push(h1("Implementation context")); out.push(body(bp.implementation_context)); }
    if (bp.how_to_read){ out.push(h1("How to read this report")); out.push(body(bp.how_to_read)); }
    return out;
  }

  // Substantive states for the docx tables/tiles, with their fill colours - from
  // the instrument (CAF: Achieved/Partially/Not; NIST: Satisfied / Other Than
  // Satisfied). Reproduces the CAF layout exactly when there are three states.
  function cafDocStates(instrument) {
    return window.App.ScoringCAF.substantiveStates(instrument).map(function (s) {
      var fill = s.colour === "met" ? COLOR.metBg : s.colour === "near" ? COLOR.nearBg : COLOR.gapBg;
      var solid = s.colour === "met" ? COLOR.met : s.colour === "near" ? COLOR.near : COLOR.gap;
      return { value: s.value, label: s.label, fill: fill, solid: solid };
    });
  }

  function cafObjectiveResultsSection(scored, info, chartBuf, instrument, totalW, secNo) {
    var TableRow = window.docx.TableRow;
    var ss = cafDocStates(instrument);
    var children = [ h1n(secNo || "2", "Results by objective") ];
    if (chartBuf) {
      children.push(new window.docx.Paragraph({
        style: "BodyText",
        children: [ new window.docx.ImageRun({
          data: chartBuf,
          transformation: { width: 540, height: Math.max(140, 28 * scored.byObjective.length + 30) }
        }) ]
      }));
      children.push(caption("Outcome profile by objective for the " + info.name + " profile (" + ss.map(function (s) { return s.label.toLowerCase(); }).join(" / ") + ")."));
    }

    var hasAbove = ((scored.aboveBaseline || []).length > 0) && !info.placeholder;
    var TOTAL = totalW || CAF_PORTRAIT_W;
    var cw = cafResultsColWidths(ss, { totalW: TOTAL, hasNA: true, hasAbove: hasAbove, placeholder: info.placeholder });
    var stateW = cw.stateW, unkW = cw.unkW, naW = cw.naW, aboveW = cw.aboveW, appW = cw.appW, meetW = cw.meetW, labelW = cw.labelW;
    var widths = [labelW].concat(ss.map(function () { return stateW; })).concat([unkW, naW]);
    var headers = ["Objective"].concat(ss.map(function (s) { return s.label; })).concat(["Unknown", "N/A"]);
    if (hasAbove) { widths.push(aboveW); headers.push("Above baseline"); }
    widths.push(appW); headers.push("Applicable");
    if (!info.placeholder) { widths.push(meetW); headers.push("Meeting expected"); }
    var rows = [ buildHeaderRow(headers, widths) ];
    scored.byObjective.forEach(function (obj) {
      var c = obj.counts;
      var ab = c.aboveBaseline || 0;
      var cells = [ cellDxa(body(obj.objectiveId + " " + obj.name, { bold: true }), labelW) ]
        .concat(ss.map(function (s) { return cellDxa(String(c[s.value] || 0), stateW, { fill: s.fill, valign: "center" }); }))
        .concat([ cellDxa(String(c.unknown), unkW, { valign: "center", fill: (instrument && instrument.unknownIsFinding && c.unknown > 0) ? COLOR.severeBg : undefined }), cellDxa(String(c.na), naW, { valign: "center" }) ]);
      if (hasAbove) { cells.push(cellDxa(String(ab), aboveW, { valign: "center", fill: ab > 0 ? COLOR.aboveBg : undefined })); }
      cells.push(cellDxa(String(obj.total), appW, { valign: "center" }));
      if (!info.placeholder) {
        var compared = obj.meeting + obj.below;
        var meetsText, meetsFill;
        if (compared > 0) { meetsText = obj.meeting + " / " + compared; meetsFill = (obj.below === 0 ? COLOR.metBg : (obj.meeting === 0 ? COLOR.gapBg : COLOR.nearBg)); }
        else if (ab > 0) { meetsText = ab + " / -"; meetsFill = COLOR.aboveBg; }
        else { meetsText = "-"; meetsFill = undefined; }
        cells.push(cellDxa(body(meetsText, { bold: compared > 0 }), meetW, { fill: meetsFill, valign: "center" }));
      }
      rows.push(new TableRow({ children: cells }));
    });
    rows.push(cafTotalsRow(scored.byObjective, ss, { hasAbove: hasAbove, hasNA: true, placeholder: info.placeholder, labelW: labelW, stateW: stateW, unkW: unkW, naW: naW, aboveW: aboveW, appW: appW, meetW: meetW }));
    children.push(fixedTable(rows, widths));
    return children;
  }

  function cafPrincipleResultsSection(scored, info, instrument, totalW, secNo) {
    var TableRow = window.docx.TableRow;
    var ss = cafDocStates(instrument);
    var noun = (instrument && instrument.display && instrument.display.principleNoun) ? instrument.display.principleNoun.toLowerCase()
      : ((instrument && instrument.display && instrument.display.objectiveTitle === "Control families") ? "control family" : "principle");
    var children = [ h1n(secNo || "3", "Results by " + noun) ];

    var hasAbove = ((scored.aboveBaseline || []).length > 0) && !info.placeholder;
    var TOTAL = totalW || CAF_PORTRAIT_W;
    var cw = cafResultsColWidths(ss, { totalW: TOTAL, hasNA: false, hasAbove: hasAbove, placeholder: info.placeholder });
    var stateW = cw.stateW, unkW = cw.unkW, aboveW = cw.aboveW, appW = cw.appW, meetW = cw.meetW, labelW = cw.labelW;
    var widths = [labelW].concat(ss.map(function () { return stateW; })).concat([unkW]);
    var headers = [noun.charAt(0).toUpperCase() + noun.slice(1)].concat(ss.map(function (s) { return s.label; })).concat(["Unknown"]);
    if (hasAbove) { widths.push(aboveW); headers.push("Above baseline"); }
    // N/A rather than Applicable: the applicable total is already the
    // denominator of the Meeting-expected column beside it, so the column is
    // better spent on the one count the table could not otherwise show. (The
    // by-objective table keeps both, since ITS last column is Applicable.)
    widths.push(appW); headers.push("N/A");
    if (!info.placeholder) { widths.push(meetW); headers.push("Meeting expected"); }
    var rows = [ buildHeaderRow(headers, widths) ];
    scored.byPrinciple.forEach(function (p) {
      var c = p.counts;
      var ab = c.aboveBaseline || 0;
      var cells = [ cellDxa(body(p.principleId + " " + p.name, { bold: true }), labelW) ]
        .concat(ss.map(function (s) { return cellDxa(String(c[s.value] || 0), stateW, { fill: s.fill, valign: "center" }); }))
        .concat([ cellDxa(String(c.unknown), unkW, { valign: "center", fill: (instrument && instrument.unknownIsFinding && c.unknown > 0) ? COLOR.severeBg : undefined }) ]);
      if (hasAbove) { cells.push(cellDxa(String(ab), aboveW, { valign: "center", fill: ab > 0 ? COLOR.aboveBg : undefined })); }
      cells.push(cellDxa(String(c.na || 0), appW, { valign: "center" }));
      if (!info.placeholder) {
        var compared = p.meeting + p.below;
        var meetsText, meetsFill;
        if (compared > 0) { meetsText = p.meeting + " / " + compared; meetsFill = (p.below === 0 ? COLOR.metBg : (p.meeting === 0 ? COLOR.gapBg : COLOR.nearBg)); }
        else if (ab > 0) { meetsText = ab + " / -"; meetsFill = COLOR.aboveBg; }
        else { meetsText = "-"; meetsFill = undefined; }
        cells.push(cellDxa(body(meetsText, { bold: compared > 0 }), meetW, { fill: meetsFill, valign: "center" }));
      }
      rows.push(new TableRow({ children: cells }));
    });
    rows.push(cafTotalsRow(scored.byPrinciple, ss, { hasAbove: hasAbove, placeholder: info.placeholder, labelW: labelW, stateW: stateW, unkW: unkW, aboveW: aboveW, appW: appW, meetW: meetW, appIsNA: true }));
    children.push(fixedTable(rows, widths));
    return children;
  }

  // A bold, shaded totals row summing the group rows above it. Column order
  // mirrors the two results tables: label, [states], unknown, [above], N/A?,
  // applicable, meeting. hasNA toggles the extra N/A column (objective table).
  function cafTotalsRow(groups, ss, o) {
    var TableRow = window.docx.TableRow;
    var fill = hex("#EAEFF4");
    var t = { unknown: 0, na: 0, ab: 0, total: 0, meeting: 0, compared: 0 }, st = {};
    ss.forEach(function (s) { st[s.value] = 0; });
    (groups || []).forEach(function (g) {
      var c = g.counts || {};
      ss.forEach(function (s) { st[s.value] += c[s.value] || 0; });
      t.unknown += c.unknown || 0; t.na += c.na || 0; t.ab += c.aboveBaseline || 0;
      t.total += g.total || 0; t.meeting += g.meeting || 0; t.compared += (g.meeting || 0) + (g.below || 0);
    });
    var cells = [ cellDxa(body("Total", { bold: true }), o.labelW, { fill: fill }) ]
      .concat(ss.map(function (s) { return cellDxa(body(String(st[s.value]), { bold: true }), o.stateW, { valign: "center", fill: fill }); }))
      .concat([ cellDxa(body(String(t.unknown), { bold: true }), o.unkW, { valign: "center", fill: fill }) ]);
    if (o.hasNA) { cells.push(cellDxa(body(String(t.na), { bold: true }), o.naW, { valign: "center", fill: fill })); }
    if (o.hasAbove) { cells.push(cellDxa(body(String(t.ab), { bold: true }), o.aboveW, { valign: "center", fill: fill })); }
    // appIsNA: the by-principle table spends this column on N/A instead of the
    // applicable total, which its Meeting-expected denominator already carries.
    cells.push(cellDxa(body(String(o.appIsNA ? t.na : t.total), { bold: true }), o.appW, { valign: "center", fill: fill }));
    if (!o.placeholder) {
      var mt = t.compared > 0 ? (t.meeting + " / " + t.compared) : (t.ab > 0 ? (t.ab + " / -") : "-");
      cells.push(cellDxa(body(mt, { bold: true }), o.meetW, { valign: "center", fill: fill }));
    }
    return new TableRow({ children: cells });
  }

  // The roadmap is wide (8 text-heavy columns) and ships in its own LANDSCAPE
  // section - see buildCAFDoc. Column widths sum to the landscape usable area
  // (CAF_LANDSCAPE_W). The outcome cell shows the code + title once (no
  // duplicated "currently X" line - the Current / Expected columns carry the
  // state).
  function cafRoadmapSection(scored, info, instrument, secNo) {
    var TableRow = window.docx.TableRow;
    var children = [ h1n(secNo || "4", "Roadmap toward expected outcomes") ];

    if (!scored.roadmap || scored.roadmap.length === 0) {
      children.push(body("Every applicable outcome meets the expected state for the " + info.name + " profile."));
      return children;
    }

    children.push(body("The roadmap covers every outcome below its expected state for the " + info.name + " profile, in the consultant's priority order."));

    scored.roadmap.forEach(function (it, i) {
      var curBand = cafBandColour(it.state);
      var pb = nis2PriBandD(it.priorityBand);
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + it.outcomeId + " " + it.title) ]
      }));
      children.push(new window.docx.Paragraph({
        style: "BodyText", spacing: { after: 60 },
        children: [
          run("Current state: ", { bold: true }),
          run(cafStateLabelD(it.state, instrument), { bold: true, color: curBand.text }),
          run("    Expected: ", { bold: true }),
          run(it.hasExpected ? cafStateLabelD(it.expectedState, instrument) : "not set"),
          run("    Principle: ", { bold: true }),
          run(it.principleId || "")
        ]
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
      children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));
      var requires = (typeof it.stateSummary === "string") ? it.stateSummary
        : ((it.stateSummary && it.stateSummary.achieved) ? it.stateSummary.achieved : "");
      if (requires) children.push(nis2Field("What this requires", requires));
      if (it.rationale) children.push(nis2Field("Why this matters", it.rationale));
      if (lensFraming) children.push(nis2Field("OT context", lensFraming));
      children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this outcome."));
      children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact")));
      children.push(nis2Field("Recommended action", it.action, planWhere(it, "action")));
      children.push(nis2Field("Owner", it.owner || "To be assigned"));
      var guide = crossRefGuidance(instrument.id, it.outcomeId);
      if (guide) children.push(nis2Field("Relevant ISA/IEC 62443 guidance", guide));
      var infRefs = informativeRefs(instrument.id, it.principleId);
      if (infRefs) children.push(nis2Field("Regulator-published references (CAA CAP1850 Annex B)", infRefs));
    });
    return children;
  }

  function cafLimitationsSection(narrative, info, engagement) {
    var bp = narrative.boilerplate || {};
    var children = [ h1("Method and limitations") ];
    // The "Not a formal assessment" box near the front already says this in
    // full; it is repeated here only if the consultant has hidden that box.
    var cust = (engagement && engagement.reportCustom) || {};
    var boxHidden = !!(cust["not-a-formal-assessment"] && cust["not-a-formal-assessment"].hidden);
    if (bp.not_formal_caveat && boxHidden) children.push(body(bp.not_formal_caveat));
    children.push(body("This report uses the " + info.name + " profile." + (info.placeholder ? " The profile is a placeholder and expected states have not been populated; meeting and below counts are therefore not reported." : "")));
    return children;
  }

  // CAF scorecard (front of body): outcome-profile KPI tiles + objective chart.
  // CAF produces no single grade, so the scorecard shows the Achieved /
  // Partially / Not profile and, when a real profile is selected, meeting-
  // expected. No page title.
  // ---- shared Design B scorecard helpers (tiles / stacked bars / focus cards) ----
  function sbP(txt,o){o=o||{};return new window.docx.Paragraph({alignment:o.align,spacing:o.spacing||{before:0,after:0},children:[run(txt,{font:FONT,bold:o.bold,color:o.color,size:o.size})]});}
  function sbTilesRow(tiles){
    var TR=window.docx.TableRow,TC=window.docx.TableCell,SH=window.docx.ShadingType,WT=window.docx.WidthType,AT=window.docx.AlignmentType;
    var n=tiles.length, tw=Math.floor((100-(n-1)*2.4)/n*10)/10, cells=[];
    tiles.forEach(function(t,i){ if(i) cells.push(new TC({borders:TBL_NONE,width:{size:2.4,type:WT.PERCENTAGE},children:[sbP("",{size:2})]}));
      cells.push(new TC({borders:TBL_NONE,width:{size:tw,type:WT.PERCENTAGE},shading:{type:SH.SOLID,color:t.fill,fill:t.fill},margins:{top:160,bottom:150,left:50,right:50},verticalAlign:"center",children:[sbP(t.t,{align:AT.CENTER,bold:true,color:t.color,size:t.size||44}),sbP(t.label,{align:AT.CENTER,color:COLOR.muted,size:14,spacing:{before:40,after:0}})]})); });
    return new window.docx.Table({width:{size:100,type:WT.PERCENTAGE},borders:TBL_NONE,rows:[new TR({children:cells})]});
  }
  function sbStackRow(label,segs){
    var TR=window.docx.TableRow,TC=window.docx.TableCell,SH=window.docx.ShadingType,WT=window.docx.WidthType,TLT=(window.docx.TableLayoutType)||{FIXED:"fixed"};
    var barW=6026,t=0; segs.forEach(function(s){t+=s.n;}); t=t||1; var sw=[],sc=[];
    segs.forEach(function(s){ if(s.n){var w=Math.max(60,Math.round(barW*s.n/t)); sw.push(w); sc.push(new TC({borders:TBL_NONE,width:dxaW(w),shading:{type:SH.SOLID,color:s.color,fill:s.color},children:[new window.docx.Paragraph({spacing:{before:0,after:0,line:170,lineRule:"exact"},children:[run("",{size:2})]})]}));} });
    // Word rejects a table with an empty grid / a cell-less row. When an area
    // has no Achieved/Partially/Not segments, emit a single empty bar cell.
    if(!sc.length){ sw.push(barW); sc.push(new TC({borders:TBL_NONE,width:dxaW(barW),children:[new window.docx.Paragraph({spacing:{before:0,after:0,line:170,lineRule:"exact"},children:[run("",{size:2})]})]})); }
    var bar=new window.docx.Table({width:dxaW(barW),layout:TLT.FIXED,columnWidths:sw,borders:TBL_NONE,rows:[new TR({children:sc})]});
    // Returns ONE row; callers collect rows into a single table via sbStackTable
    // (adjacent tables get merged/mis-rendered by Word - only the first shows).
    return new TR({children:[
      new TC({borders:TBL_NONE,width:dxaW(3000),verticalAlign:"center",margins:{top:30,bottom:30,right:120},children:[sbP(label,{size:15,color:COLOR.text})]}),
      new TC({borders:TBL_NONE,width:dxaW(barW),verticalAlign:"center",children:[bar]})
    ]});
  }
  // Wrap stacked-bar rows from sbStackRow into ONE table (back-to-back tables
  // get merged by Word and only the first renders).
  function sbStackTable(rows){
    var TLT=(window.docx.TableLayoutType)||{FIXED:"fixed"};
    return new window.docx.Table({width:{size:100,type:window.docx.WidthType.PERCENTAGE},layout:TLT.FIXED,columnWidths:[3000,6026],borders:TBL_NONE,rows:rows});
  }
  function sbLegend(items){ var ch=[]; items.forEach(function(it){ ch.push(run("■ ",{color:it.color,size:18})); ch.push(run(it.label+"      ",{font:FONT,size:14,color:COLOR.muted})); }); return new window.docx.Paragraph({spacing:{before:120,after:0},children:ch}); }
  function sbFocusCard(n,name,tag){
    var TR=window.docx.TableRow,TC=window.docx.TableCell,SH=window.docx.ShadingType,WT=window.docx.WidthType,AT=window.docx.AlignmentType,TLT=(window.docx.TableLayoutType)||{FIXED:"fixed"};
    return new window.docx.Table({width:{size:100,type:WT.PERCENTAGE},layout:TLT.FIXED,columnWidths:[620,5800,2606],borders:TBL_NONE,rows:[new TR({children:[
      new TC({borders:TBL_NONE,width:dxaW(620),shading:{type:SH.SOLID,color:COLOR.navy,fill:COLOR.navy},verticalAlign:"center",margins:{top:90,bottom:90},children:[sbP(String(n),{align:AT.CENTER,bold:true,color:"FFFFFF",size:18})]}),
      new TC({borders:TBL_NONE,width:dxaW(5800),shading:{type:SH.SOLID,color:"F5F8FA",fill:"F5F8FA"},verticalAlign:"center",margins:{top:90,bottom:90,left:170,right:80},children:[sbP(name,{size:17,color:COLOR.text})]}),
      new TC({borders:TBL_NONE,width:dxaW(2606),shading:{type:SH.SOLID,color:"F5F8FA",fill:"F5F8FA"},verticalAlign:"center",margins:{top:90,bottom:90,left:80,right:170},children:[sbP(tag,{align:AT.RIGHT,size:15,color:COLOR.muted})]})
    ]})]});
  }
  function sbSpacer(){ return new window.docx.Paragraph({spacing:{before:0,after:0,line:120,lineRule:"exact"},children:[run("",{size:2})]}); }

  function cafScorecardDesignB(scored, info, chartBuf, instrument) {
    var TR=window.docx.TableRow, TC=window.docx.TableCell, SH=window.docx.ShadingType, WT=window.docx.WidthType, AT=window.docx.AlignmentType, TLT=(window.docx.TableLayoutType)||{FIXED:"fixed"};
    function P(txt,o){o=o||{};return new window.docx.Paragraph({alignment:o.align,spacing:o.spacing||{before:0,after:0},children:[run(txt,{font:FONT,bold:o.bold,color:o.color,size:o.size})]});}
    var ss=cafDocStates(instrument);
    var gapState=ss.filter(function(s){return s.value==="not";})[0]||ss[ss.length-1]||{value:"not",label:"Not achieved"};
    // Unknown-as-finding instruments (CIS): Unknown is the most severe outcome,
    // so it leads the tiles/bars/legend in a severe colour.
    var uf=(instrument&&instrument.unknownIsFinding)?{value:"unknown",label:"Unknown",fill:COLOR.severeBg,solid:COLOR.severe}:null;
    // Above-baseline (implemented but not required) shows at the positive end.
    var abState=((scored.aboveBaseline||[]).length)?{value:"aboveBaseline",label:"Above baseline",fill:COLOR.aboveBg,solid:COLOR.above}:null;
    var barStates=(uf?[uf]:[]).concat(ss).concat(abState?[abState]:[]);
    // Single-objective instruments (CIS) carry their shape on the principle level
    // (the 18 Controls), so the "by objective" visuals group by principle instead.
    var singleObj=(scored.byObjective||[]).length<2;
    var groups=singleObj?(scored.byPrinciple||[]):scored.byObjective;
    function gid(g){return (g.objectiveId!=null?g.objectiveId:g.principleId);}
    var groupSingular=singleObj?(((instrument&&instrument.display&&instrument.display.principleNoun)?instrument.display.principleNoun:"principle")):"objective";
    var groupNoun=singleObj?(groupSingular.toLowerCase()+"s"):((instrument&&instrument.display&&instrument.display.objectiveTitle==="Control families")?"control families":"objectives");
    var tot={meeting:0,below:0};
    barStates.forEach(function(s){tot[s.value]=0;});
    scored.byObjective.forEach(function(o){barStates.forEach(function(s){tot[s.value]+=(o.counts[s.value]||0);});tot.meeting+=(o.meeting||0);tot.below+=(o.below||0);});
    var compared=tot.meeting+tot.below;
    var children=[h1("Alignment at a glance")];
    // KPI tiles: separated cards. Tile width scales to the number of states so
    // a 2-state instrument (NIST: Satisfied / Other Than Satisfied) fills the row.
    var nTiles=barStates.length+1, gapPct=2.6, tilePct=(100-gapPct*(nTiles-1))/nTiles;
    function tile(num,col,label,fill){return new TC({borders:TBL_NONE,width:{size:tilePct,type:WT.PERCENTAGE},shading:{type:SH.SOLID,color:fill,fill:fill},margins:{top:170,bottom:160,left:60,right:60},verticalAlign:"center",children:[P(num,{align:AT.CENTER,bold:true,color:col,size:46}),P(label,{align:AT.CENTER,color:COLOR.muted,size:15,spacing:{before:40,after:0}})]});}
    function gp(){return new TC({borders:TBL_NONE,width:{size:gapPct,type:WT.PERCENTAGE},children:[P("",{size:2})]});}
    var tileCells=[];
    barStates.forEach(function(s,i){if(i)tileCells.push(gp());tileCells.push(tile(String(tot[s.value]||0),s.solid,s.label,s.fill));});
    tileCells.push(gp());
    tileCells.push(tile((info.placeholder||compared===0)?"-":(tot.meeting+" / "+compared),COLOR.navy,"Meeting expected","F5F8FA"));
    children.push(new window.docx.Table({width:{size:100,type:WT.PERCENTAGE},borders:TBL_NONE,rows:[new TR({children:tileCells})]}));
    children.push(body("Outcome profile for the "+info.name+" profile. This is a profile of states across the assessed "+groupNoun+", not a single grade.",{color:COLOR.muted,spacing:{before:180,after:0}}));
    // Full-width stacked bars per group (objective, or principle when single-objective)
    children.push(h2("Outcome profile by "+groupSingular.toLowerCase()));
    var barW=6026;
    // One table with one row per group (NOT N adjacent tables - Word merges
    // back-to-back tables and only the first renders).
    var barRows=[];
    groups.forEach(function(o){
      var t=barStates.reduce(function(a,s){return a+(o.counts[s.value]||0);},0)||1, sw=[], segs=[];
      barStates.forEach(function(s){var n=o.counts[s.value];if(n){var w=Math.max(60,Math.round(barW*n/t));sw.push(w);segs.push(new TC({borders:TBL_NONE,width:dxaW(w),shading:{type:SH.SOLID,color:s.solid,fill:s.solid},children:[new window.docx.Paragraph({spacing:{before:0,after:0,line:170,lineRule:"exact"},children:[run("",{size:2})]})]}));}});
      // Word rejects an empty grid / cell-less row: when an objective has no
      // scored states, emit a single empty bar cell.
      if(!segs.length){sw.push(barW);segs.push(new TC({borders:TBL_NONE,width:dxaW(barW),children:[new window.docx.Paragraph({spacing:{before:0,after:0,line:170,lineRule:"exact"},children:[run("",{size:2})]})]}));}
      var bar=new window.docx.Table({width:dxaW(barW),layout:TLT.FIXED,columnWidths:sw,borders:TBL_NONE,rows:[new TR({children:segs})]});
      barRows.push(new TR({children:[
        new TC({borders:TBL_NONE,width:dxaW(3000),verticalAlign:"center",margins:{top:30,bottom:30,right:120},children:[P(gid(o)+" "+o.name,{size:16,color:COLOR.text})]}),
        new TC({borders:TBL_NONE,width:dxaW(barW),verticalAlign:"center",children:[bar]})
      ]}));
    });
    children.push(new window.docx.Table({width:{size:100,type:WT.PERCENTAGE},layout:TLT.FIXED,columnWidths:[3000,barW],borders:TBL_NONE,rows:barRows}));
    var legendKids=[];
    barStates.forEach(function(s,i){legendKids.push(run("■ ",{color:s.solid,size:18}));legendKids.push(run(s.label+(i<barStates.length-1?"      ":""),{font:FONT,size:14,color:COLOR.muted}));});
    children.push(new window.docx.Paragraph({spacing:{before:120,after:0},children:legendKids}));
    // Where to focus first: numbered cards
    var useBelow=!info.placeholder && groups.some(function(o){return (o.below||0)>0;});
    var foc=groups.slice().sort(function(a,b){return useBelow?((b.below||0)-(a.below||0)):(b.counts.not-a.counts.not);}).filter(function(o){return useBelow?((o.below||0)>0):(o.counts.not>0);}).slice(0,3);
    if(foc.length){
      children.push(h2("Where to focus first"));
      children.push(body((groupSingular.charAt(0).toUpperCase()+groupSingular.slice(1))+"s furthest from the "+info.name+" profile, by "+((instrument&&instrument.display&&instrument.display.outcomesTitle)?instrument.display.outcomesTitle.toLowerCase():"outcomes")+" below expected.",{color:COLOR.muted,spacing:{after:40}}));
      foc.forEach(function(o,i){
        var tag=useBelow?(o.below+" of "+(o.meeting+o.below)+" below expected"):(o.counts.not+" "+gapState.label.toLowerCase());
        children.push(new window.docx.Table({width:{size:100,type:WT.PERCENTAGE},layout:TLT.FIXED,columnWidths:[620,5800,2606],borders:TBL_NONE,rows:[new TR({children:[
          new TC({borders:TBL_NONE,width:dxaW(620),shading:{type:SH.SOLID,color:COLOR.navy,fill:COLOR.navy},verticalAlign:"center",margins:{top:90,bottom:90},children:[P(String(i+1),{align:AT.CENTER,bold:true,color:"FFFFFF",size:18})]}),
          new TC({borders:TBL_NONE,width:dxaW(5800),shading:{type:SH.SOLID,color:"F5F8FA",fill:"F5F8FA"},verticalAlign:"center",margins:{top:90,bottom:90,left:170,right:80},children:[P(gid(o)+" "+o.name,{size:17,color:COLOR.text})]}),
          new TC({borders:TBL_NONE,width:dxaW(2606),shading:{type:SH.SOLID,color:"F5F8FA",fill:"F5F8FA"},verticalAlign:"center",margins:{top:90,bottom:90,left:80,right:170},children:[P(tag,{align:AT.RIGHT,size:15,color:COLOR.muted})]})
        ]})]}));
        children.push(new window.docx.Paragraph({spacing:{before:0,after:0,line:120,lineRule:"exact"},children:[run("",{size:2})]}));
      });
    }
    return children;
  }

  // Controls implemented beyond the selected profile - captured for a complete
  // report and reassessment tracking, with no effect on the score.
  // What the organisation HAS achieved, named.
  //
  // The results tables give counts and the roadmap gives gaps, so a reader
  // could finish the report knowing how many outcomes were achieved without
  // ever seeing which. That reads as a list of failings, and it is also the
  // half a client is most likely to be asked to evidence - at audit, by a
  // regulator, or by the board that funded the work. Grouped by objective and
  // carrying the evidence recorded against each.
  function cafAchievedSection(scored, info, instrument, secNo) {
    var per = (scored.perOutcome || []).filter(function (it) {
      return it.profileApplicable !== false && it.state === "achieved";
    });
    var disp = (instrument && instrument.display) || {};
    var unit = disp.outcomesTitle || "Outcomes";
    var unitOne = unit.replace(/s$/i, "");
    var objName = {};
    ((instrument.taxonomy && instrument.taxonomy.objectives) || []).forEach(function (o) { objName[o.id] = o.name; });
    var prinObj = {}, prinName = {};
    ((instrument.taxonomy && instrument.taxonomy.principles) || []).forEach(function (p) {
      prinObj[p.id] = p.objectiveId; prinName[p.id] = p.name;
    });

    var children = [ h1n(secNo, unit + " achieved") ];
    if (!per.length) {
      children.push(body("No " + unit.toLowerCase() + " were assessed as achieved. The roadmap below covers everything that was assessed."));
      return children;
    }
    children.push(body(per.length + " of " + (scored.perOutcome || []).length + " " +
      unit.toLowerCase() + " were assessed as achieved. Each is listed with the evidence recorded against it, so that evidence is to hand when it is asked for."));

    var widths = [1500, 4200, 3326];
    var byObj = {};
    per.forEach(function (it) {
      var oid = prinObj[it.principleId] || "-";
      (byObj[oid] = byObj[oid] || []).push(it);
    });
    Object.keys(byObj).forEach(function (oid) {
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 60 },
        children: [ run((oid !== "-" ? oid + " " : "") + (objName[oid] || "")) ]
      }));
      var rows = [ buildHeaderRow([unitOne, "Title", "Evidence recorded"], widths) ];
      byObj[oid].forEach(function (it) {
        rows.push(new window.docx.TableRow({ children: [
          cellDxa(body(it.outcomeId, { bold: true }), widths[0]),
          cellDxa(body(it.title || ""), widths[1]),
          cellDxa(body(String(it.evidence || "").trim() || "No evidence recorded."), widths[2])
        ] }));
      });
      children.push(fixedTable(rows, widths));
    });
    return children;
  }

  function cafAboveBaselineSection(scored, info, instrument) {
    var items = scored.aboveBaseline || [];
    if (!items.length) return [];
    var TableRow = window.docx.TableRow;
    var unit = (instrument && instrument.display && instrument.display.outcomesTitle) ? instrument.display.outcomesTitle.replace(/s$/i, "") : "Control";
    var children = [ h1("Additional controls implemented beyond the " + info.name) ];
    children.push(body(items.length + " " + unit.toLowerCase() + (items.length === 1 ? "" : "s") + " that the " + info.name + " does not require " + (items.length === 1 ? "has" : "have") + " been implemented. This does not affect the score, which is measured against the selected profile, but it is recorded so that a future reassessment can track it."));
    var widths = [7100, 2400];
    var rows = [ buildHeaderRow([unit, "State"], widths) ];
    items.forEach(function (it) {
      var band = cafBandColour(it.aboveBaselineState);
      rows.push(new TableRow({ children: [
        cellDxa(body(it.outcomeId + " " + it.title, { bold: true }), widths[0]),
        cellDxa(cafStateLabelD(it.aboveBaselineState, instrument), widths[1], { fill: band.fill, valign: "center" })
      ] }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  function buildCAFDoc(engagement, instrument, profile, narrative, opts, callback) {
    var info = cafProfileInfoFromOpts(opts);
    var overlay = opts.cafOverlay || (opts.cafProfile ? (opts.cafProfile.overlay || {}) : {});
    var scoredAll = window.App.ScoringCAF.scoreEngagement(engagement, instrument, profile, overlay);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

    // Render the per-objective state bars chart, rasterise, then assemble.
    var chartRows = scored.byObjective.map(function (obj) {
      return {
        label: obj.objectiveId + " " + obj.name,
        achieved: obj.counts.achieved,
        partially: obj.counts.partially,
        not: obj.counts.not
      };
    });
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    var svg = window.App.Charts.cafStateBars(chartRows, { width: 620, labelWidth: 260 });
    holder.appendChild(svg);

    rasterise(svg, opts, function (blob) {
      try { document.body.removeChild(holder); } catch (_) {}
      blobBuf(blob, function (buf) {
        try {
          // Per-section orientation. The document is mostly portrait; the
          // wide roadmap table lives in its own landscape section with
          // narrower margins so it fits without clipping. Title/exec/
          // caveat/about/objective/principle stay portrait; method/
          // limitations returns to portrait afterwards.
          var _disp = instrument.display || {};
          var _subLead = _disp.reportSubline || "NCSC CAF 4.0 alignment";
          var _profWord = _disp.profileTitle || "Profile";
          var coverChildren = coverDesignB(engagement, instrument, { subLine: _subLead + "  ·  " + _profWord + ": " + info.name + (info.placeholder ? " (placeholder)" : "") });
          // Prose stays portrait; the wide RESULTS tables (by objective / by
          // principle) get their own LANDSCAPE page so they have room to breathe.
          // Roadmap is prose, and the basis/above-baseline/progress tables are
          // narrow, so they stay portrait.
          var partIntro = []
            .concat(cafDocumentControl(engagement, instrument, info, opts)).concat([pageBreakPara()])
            .concat(cafExecutiveSummary(narrative, scored, info, engagement, instrument))
            .concat(execSummaryAddenda(engagement, opts.progress))
            .concat(cafNotFormalCaveatBlock(narrative))
            .concat([pageBreakPara()])
            .concat(cafScorecardDesignB(scored, info, buf, instrument))
            .concat([pageBreakPara()])
            .concat(cafAboutSection(narrative, instrument))
            .concat(slGlossary(instrument, null, narrative, engagement))
          // Section numbers are allocated in order rather than hardcoded: a
          // single-objective instrument (CIS, ONR SyAPs Cyber) drops the
          // by-objective section, and fixed numbers left those documents
          // running 1, 3, 4 with no section 2.
          var secNo = 1; // 1 is the executive summary, numbered in its own block.
          function nextSec() { secNo += 1; return String(secNo); }
          var showObjectives = (scored.byObjective || []).length >= 2;
          var objectivesNo = showObjectives ? nextSec() : null;
          var principlesNo = nextSec();
          // What is in place comes before what is missing: the achieved list
          // reads as the other half of the roadmap, not as an appendix.
          var achievedNo = nextSec();
          var roadmapNo = nextSec();

          var partTables = []
            // Single-objective instruments (CIS): the by-objective table is one row,
            // redundant with the by-principle (per-Control) table - so skip it.
            .concat(showObjectives ? cafObjectiveResultsSection(scored, info, null, instrument, CAF_LANDSCAPE_W, objectivesNo) : [])
            .concat(cafPrincipleResultsSection(scored, info, instrument, CAF_LANDSCAPE_W, principlesNo));
          var partTail = []
            .concat(cafAchievedSection(scored, info, instrument, achievedNo))
            .concat(cafRoadmapSection(scored, info, instrument, roadmapNo))
            .concat(cafAboveBaselineSection(scored, info, instrument))
            .concat(progressSection(opts.progress))
            .concat(basisOfAssessmentSection(engagement))
            .concat(cafLimitationsSection(narrative, info, engagement)).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

          var PO = docPO();
          var bodySections = bodySectionsFromSegments(
            brandHeaders(), brandFootersDoc(instrument, engagement),
            [ { land: false, children: partIntro }, { land: true, children: partTables }, { land: false, children: partTail } ]);

          var doc = makeDoc(engagement, {
            creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
            title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client") + " - " + info.name,
            description: (instrument.display && instrument.display.reportDescription) || "NCSC CAF 4.0 alignment and gap analysis",
            styles: buildStyles(),
            sections: [
              { properties: { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren }
            ].concat(bodySections)
          }, opts);
          packDoc(doc, opts, callback);
        } catch (e) {
          callback(e);
        }
      });
    });
  }

  // ---- program-maturity-ml (ISA/IEC 62443-2-1:2024) -------------------------
  //
  // No narrative pack: prose is the instrument framing + fixed chassis
  // strings. No single program grade; an achieved-ML profile by SPE/theme,
  // with not-met / below-target surfaced as floor findings. The wide roadmap
  // ships in its own landscape section (same orientation handling as CAF).

  function mlBandColour(mlState) {
    if (mlState === "ML4") return { fill: COLOR.metBg,  text: COLOR.blue };
    if (mlState === "ML3") return { fill: COLOR.metBg,  text: COLOR.met };
    if (mlState === "ML2") return { fill: COLOR.nearBg, text: COLOR.near };
    if (mlState === "ML1") return { fill: COLOR.subBg,  text: COLOR.muted };
    if (mlState === "not-met") return { fill: COLOR.gapBg, text: COLOR.gap };
    return { fill: COLOR.naBg, text: COLOR.muted };
  }

  function mlTitlePage(engagement, instrument) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2400;
    var valueW = CAF_PORTRAIT_W - labelW;
    var metaRows = [
      ["Client", e.clientName], ["Site", e.siteName], ["Address", e.siteAddress],
      ["Site contact", e.siteContact], ["Consultant", e.consultant],
      ["Date of visit", e.dateOfVisit], ["Opportunity ID", e.opportunityId]
    ];
    var rows = metaRows.map(function (r) {
      return new TableRow({ children: [
        cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }),
        cellDxa(r[1] || "", valueW)
      ] });
    });
    var out = [];
    var lg = titleLogoParagraph();
    if (lg) out.push(lg);
    return out.concat([
      new window.docx.Paragraph({ heading: window.docx.HeadingLevel.TITLE, children: [run(instrument.title)] }),
      body(window.App.Report.standardRef(instrument) + " maturity assessment", { style: "Caption" }),
      body("", { spacing: { after: 200 } }),
      fixedTable(rows, [labelW, valueW]),
      body("", { spacing: { after: 200 } })
    ]);
  }

  function mlDocumentControl(engagement, instrument, opts) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2700;
    var valueW = CAF_PORTRAIT_W - labelW;
    var pairs = [
      ["Document revision", e.documentRevision], ["Status", statusLabel(opts)], ["QA review by", e.qaReviewBy],
      ["Authorised by", e.authorisedBy], ["Issued to", e.issuedTo],
      ["Issued date", e.issuedDate], ["Confidentiality", e.confidentiality],
      ["Instrument", instrument.title], ["Edition", instrument.edition || ""],
      ["Content version", instrument.contentVersion || ""]
    ];
    var rows = pairs.map(function (r) {
      return new TableRow({ children: [
        cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }),
        cellDxa(r[1] || "", valueW)
      ] });
    });
    return [ h1("Document control and confidentiality"), fixedTable(rows, [labelW, valueW]), body("", { spacing: { after: 200 } }) ];
  }

  // Bullet-style fallback executive summary (used when no narrative pack).
  function mlExecutiveSummaryBullets(scored, instrument) {
    var ML = window.App.ScoringProgramML;
    var ov = scored.overall, c = ov.counts;
    var children = [ h1n("1", "Executive summary") ];
    children.push(body("This is a maturity assessment against " + window.App.Report.standardRef(instrument) + ". The result is a profile of achieved maturity levels across the " + window.App.Report.mlNoun(instrument, "elementNounPlural").toLowerCase() + ", with no single programme grade."));
    children.push(bullet("Program ML profile: " + c.ML1 + " at ML1, " + c.ML2 + " at ML2, " + c.ML3 + " at ML3, " + c.ML4 + " at ML4, " + c.notMet + " not met, of " + ov.total + " applicable requirements."));
    var worst = (scored.worstElements || []).map(function (el) { return el.elementId + " " + el.name; });
    if (worst.length > 0) children.push(bullet("Weakest " + window.App.Report.mlNoun(instrument, "elementNounTitle").toLowerCase() + (worst.length === 1 ? "" : "s") + ": " + worst.join("; ") + "."));
    children.push(bullet("Coverage: " + ML.formatPct(ov.coverage) + (ov.confidenceLevel ? " (" + ov.confidenceLevel + ")" : "") + ". Mean ML is reported per element for context only and is never a programme grade."));
    if (scored.anyTargets) {
      var compared = ov.meeting + ov.below;
      children.push(bullet("Against target ML: " + ov.meeting + " of " + compared + " assessed requirements meet their target; " + ov.below + " are below target."));
    }
    if (c.notMet > 0) children.push(body("A requirement that is Not met is a floor finding and is listed in the findings and roadmap, not averaged into a mean.", { }));
    return children;
  }

  // Composed ML executive summary (mirrors CAF/SL/posture/NIS2): boilerplate
  // verbatim, templates slot-substituted, consultant blocks seeded + placeholder.
  // ML aim: an achieved-maturity profile across the Security Program Elements -
  // never a single grade - with not-met / lowest-maturity requirements as floor
  // findings. Falls back to the bullet summary when no narrative pack is loaded.
  function mlExecutiveSummary(scored, narrative, engagement, instrument) {
    var es = narrative && narrative.executiveSummary;
    if (!es) return mlExecutiveSummaryBullets(scored, instrument);

    var ML = window.App.ScoringProgramML;
    var ov = scored.overall, c = ov.counts;
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var gcFrags = T.gapConcentrationFragments || {};
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var clientName = e.clientName || "the organisation";
    var children = [ h1n("1", "Executive summary") ];

    if (ov.scored === 0) {
      children.push(body(narrative.boilerplate.report_intro));
      children.push(body("Too few requirements were assessed to report a maturity profile; the priority is to complete the assessment across the " + window.App.Report.mlNoun(instrument, "elementNounPlural").toLowerCase() + "."));
      return children;
    }

    var worst = scored.worstElements || [];
    var weakestElementName = worst.length ? nis2ListJoin(worst.map(function (el) { return el.elementId + " " + el.name; })) : "no single element";
    var w0 = worst[0];
    var weakestDetail = "";
    if (w0) {
      var bits = [];
      if (w0.counts.notMet > 0) bits.push(w0.counts.notMet + " requirement(s) not met");
      if (w0.meanMl !== null && w0.meanMl !== undefined) bits.push("mean maturity " + ML.formatMean(w0.meanMl));
      if (bits.length) weakestDetail = ", with " + nis2ListJoin(bits);
    }
    var roadmap = scored.roadmap || [];
    var hasGaps = roadmap.length > 0;

    var lowMaturity = (scored.byElement || []).filter(function (el) {
      return el.total > 0 && (el.counts.notMet > 0 || el.counts.ML1 > 0);
    }).slice(0, 3).map(function (el) { return el.elementId + " " + el.name; });
    var gcParts = [];
    if (c.notMet > 0) gcParts.push(nis2Fill(gcFrags.notMet, { notMet: c.notMet }));
    if (lowMaturity.length) gcParts.push(nis2Fill(gcFrags.lowMaturity, { lowMaturityList: nis2ListJoin(lowMaturity) }));
    var gapConcentrationSentence = gcParts.join(" ");

    var topHint = roadmap.slice(0, 2).map(function (r) { return r.code + " " + r.title; });
    var autoTopPriorityHint = topHint.length ? nis2ListJoin(topHint) : "the highest-priority requirements in the roadmap";
    var compared = ov.meeting + ov.below;

    var slots = {
      clientName: clientName, weakestElementName: weakestElementName, weakestDetail: weakestDetail,
      answeredCount: ov.scored, elementCount: (scored.byElement || []).length,
      notMetClause: c.notMet > 0 ? (", of which " + c.notMet + " are not met") : "",
      ml1: c.ML1, ml2: c.ML2, ml3: c.ML3, ml4: c.ML4, notMet: c.notMet,
      meeting: ov.meeting, below: ov.below, compared: compared,
      gapConcentrationSentence: gapConcentrationSentence,
      coveragePct: ML.formatPct(ov.coverage),
      confidenceLabel: ov.confidenceLevel ? String(ov.confidenceLevel).toLowerCase() : "confidence not rated",
      autoTopPriorityHint: autoTopPriorityHint
    };

    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots)));
    var profileLine = nis2Fill(T.exec_scope, slots) + " " + nis2Fill(T.exec_profile, slots);
    if (scored.anyTargets && compared > 0) profileLine += " " + nis2Fill(T.exec_profile_targets, slots);
    children.push(body(profileLine));
    if (hasGaps && gapConcentrationSentence) children.push(body(nis2Fill(T.exec_gap_shape, slots)));
    if (B.exec_profile_method) children.push(body(B.exec_profile_method));
    if (B.stakes) children.push(body(B.stakes));

    slots.notMetExposureClause = c.notMet > 0 ? (CB.consultant_exposure_notmet_clause || "") : "";
    if (CB.consultant_exposure_seed) children.push(body(nis2Fill(CB.consultant_exposure_seed, slots)));
    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else if (CB.consultant_exposure) children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));

    if (hasGaps) {
      var topPri = (rn.topPriorities || "").trim();
      children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
      if (topPri) children.push(body(topPri));
      else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    }
    children.push(body(nis2Fill(T.exec_confidence, slots)));
    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));
    return children;
  }

  // Caveat box closing the ML executive summary (mirrors the others).
  // Every report states what it is not. Where the narrative pack carries the
  // wording it is used verbatim; where it does not - a skeleton instrument, or
  // one built from the instrument alone - a generic statement stands in, so no
  // document ever leaves without one.
  var GENERIC_CAVEAT = "This is an alignment and gap analysis intended to support improvement. It is not a certification, a formal conformity assessment or a regulatory determination. The judgements are the consultant's, made against the evidence available at the time of the engagement.";

  function mlNotCertificationCaveatBlock(narrative) {
    var caveat = (narrative && narrative.boilerplate && narrative.boilerplate.not_certification_caveat) || GENERIC_CAVEAT;
    if (!caveat) return [];
    var TableRow = window.docx.TableRow, WidthType = window.docx.WidthType, Table = window.docx.Table, ShadingType = window.docx.ShadingType, TableCell = window.docx.TableCell;
    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [ new TableCell({
        children: [
          new window.docx.Paragraph({ style: "BodyText", children: [run("Maturity profile, not a single grade or a certification", { bold: true, color: COLOR.gap })] }),
          new window.docx.Paragraph({ style: "BodyText", children: [run(caveat)] })
        ],
        shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
      }) ] }) ]
    });
    return [ tbl, body("", { spacing: { after: 160 } }) ];
  }

  function mlAboutSection(instrument, narrative) {
    var out = [];
    if (instrument.framing) { out.push(h1("About this assessment")); out.push(body(instrument.framing)); }
    var sc = seriesContextOf(instrument, narrative);
    if (sc) out.push(body(sc));
    out = out.concat(attributionParas(instrument, !!instrument.framing));
    out.push(h1("How to read this report"));
    out.push(body("Each " + window.App.Report.mlNoun(instrument, "requirementNoun") + " is assessed at one maturity level: ML1 Initial (ad hoc), ML2 Managed (documented and repeatable; documentation begins at ML2), ML3 Defined / Practiced (actively practised on the IACS), or ML4 Improving (metrics-driven improvement). Levels apply independently per requirement. Not met means the requirement is not satisfied at any level. Unknown lowers coverage and confidence; Not applicable is excluded. Results are a profile across the elements; there is no single programme grade."));
    return out;
  }

  function mlResultsByElementSection(scored, chartBuf, wDxa, instrument) {
    var ML = window.App.ScoringProgramML;
    var TableRow = window.docx.TableRow;
    var children = [ h1n("2", "Results by " + window.App.Report.mlNoun(instrument, "elementNounTitle")) ];
    if (chartBuf) {
      children.push(new window.docx.Paragraph({ style: "BodyText", children: [ new window.docx.ImageRun({
        data: chartBuf, transformation: { width: 540, height: Math.max(140, 28 * scored.byElement.length + 30) }
      }) ] }));
      children.push(caption("Maturity distribution per element: Not met / ML1 / ML2 / ML3 / ML4."));
    }
    var withTargets = scored.anyTargets;
    var headers = withTargets
      ? ["Element", "Not met", "ML1", "ML2", "ML3", "ML4", "Unknown", "Mean ML", "Meets target"]
      : ["Element", "Not met", "ML1", "ML2", "ML3", "ML4", "Unknown", "Mean ML"];
    // Size each column to fit its header on one line; Element (label) takes the rest.
    var widths = fitHeaderWidths(headers, wDxa);
    var rows = [ buildHeaderRow(headers, widths) ];
    scored.byElement.forEach(function (el) {
      var cc = el.counts;
      var cells = [
        cellDxa(body(el.elementId + " " + el.name, { bold: true }), widths[0]),
        cellDxa(String(cc.notMet), widths[1], { fill: COLOR.gapBg, valign: "center" }),
        cellDxa(String(cc.ML1), widths[2], { valign: "center" }),
        cellDxa(String(cc.ML2), widths[3], { fill: COLOR.nearBg, valign: "center" }),
        cellDxa(String(cc.ML3), widths[4], { fill: COLOR.metBg, valign: "center" }),
        cellDxa(String(cc.ML4), widths[5], { valign: "center" }),
        cellDxa(String(cc.unknown), widths[6], { valign: "center" }),
        cellDxa(ML.formatMean(el.meanMl), withTargets ? widths[7] : widths[7], { valign: "center" })
      ];
      if (withTargets) {
        var compared = el.meeting + el.below;
        var meetsFill = compared === 0 ? undefined : (el.below === 0 ? COLOR.metBg : (el.meeting === 0 ? COLOR.gapBg : COLOR.nearBg));
        cells.push(cellDxa(body(compared > 0 ? (el.meeting + " / " + compared) : "-", { bold: compared > 0 }), widths[8], { fill: meetsFill, valign: "center" }));
      }
      rows.push(new TableRow({ children: cells }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  function mlResultsByThemeSection(scored, wDxa) {
    var ML = window.App.ScoringProgramML;
    var TableRow = window.docx.TableRow;
    var children = [ h1n("3", "Results by theme") ];
    var headers = ["Theme", "Not met", "ML1", "ML2", "ML3", "ML4", "Mean ML"];
    var widths = fitHeaderWidths(headers, wDxa);
    var rows = [ buildHeaderRow(headers, widths) ];
    scored.byTheme.forEach(function (th) {
      var cc = th.counts;
      rows.push(new TableRow({ children: [
        cellDxa(body(th.theme + " " + th.name, { bold: true }), widths[0]),
        cellDxa(String(cc.notMet), widths[1], { fill: COLOR.gapBg, valign: "center" }),
        cellDxa(String(cc.ML1), widths[2], { valign: "center" }),
        cellDxa(String(cc.ML2), widths[3], { fill: COLOR.nearBg, valign: "center" }),
        cellDxa(String(cc.ML3), widths[4], { fill: COLOR.metBg, valign: "center" }),
        cellDxa(String(cc.ML4), widths[5], { valign: "center" }),
        cellDxa(ML.formatMean(th.meanMl), widths[6], { valign: "center" })
      ] }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  function mlFindingsSection(scored, instrument) {
    var children = [ h1n("4", "Findings by " + window.App.Report.mlNoun(instrument, "elementNounTitle")) ];
    var any = false;
    scored.byElement.forEach(function (el) {
      var notMet = el.requirements.filter(function (r) { return r.isNotMet; });
      var ml1 = el.requirements.filter(function (r) { return r.ml === "ML1"; });
      var below = scored.anyTargets ? el.requirements.filter(function (r) { return r.belowTarget && !r.isNotMet; }) : [];
      if (notMet.length === 0 && ml1.length === 0 && below.length === 0) return;
      any = true;
      children.push(h2(el.elementId + " " + el.name));
      children.push(body("Profile: " + el.counts.ML1 + " ML1, " + el.counts.ML2 + " ML2, " + el.counts.ML3 + " ML3, " + el.counts.ML4 + " ML4, " + el.counts.notMet + " not met. Mean ML " + window.App.ScoringProgramML.formatMean(el.meanMl) + " (context only)."));
      function lst(label, arr) {
        if (arr.length === 0) return;
        children.push(body(label, { bold: true }));
        arr.forEach(function (r) {
          children.push(bullet(r.code + " " + r.title + ": " + r.mlLabel + (r.hasTarget ? (", target " + r.targetMl) : "")));
          if (r.evidence) children.push(labelled("Evidence", r.evidence));
        });
      }
      lst("Not met:", notMet);
      lst("Below target:", below);
      lst("Lowest maturity (ML1):", ml1);
    });
    if (!any) children.push(body("No not-met, below-target, or ML1 requirements were recorded."));
    return children;
  }

  // ML roadmap as PROSE (replaces the wide landscape table), mirroring the
  // CAF/SL/posture prose roadmaps. Each requirement below target / not met / ML1
  // becomes a Heading 2 with labelled lines: achieved/target ML + element, why it
  // matters (requirement rationale), OT context (otLens), captured evidence,
  // business impact, recommended action and owner. Not met first / consultant order.
  function mlRoadmapSection(scored, instrument) {
    var ML = window.App.ScoringProgramML;
    var children = [ h1n("5", "Roadmap") ];
    var roadmap = scored.roadmap || [];
    if (roadmap.length === 0) {
      children.push(body(scored.anyTargets ? "Every requirement meets its target ML." : "No not-met or ML1 requirements to prioritise."));
      return children;
    }
    var reqById = {};
    (instrument.requirements || []).forEach(function (r) { reqById[r.id] = r; });

    children.push(body((scored.anyTargets ? "The roadmap covers every requirement below its target maturity, " : "The roadmap covers every not-met or lowest-maturity (ML1) requirement, ") + "with those not met first, in the consultant's priority order."));

    roadmap.forEach(function (it, i) {
      var req = reqById[it.requirementId] || {};
      var band = mlBandColour(it.ml);
      var notMetBadge = it.isNotMet ? "  (not met)" : "";
      var pb = nis2PriBandD(it.priorityBand);
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + it.code + " " + it.title + notMetBadge) ]
      }));
      children.push(new window.docx.Paragraph({
        style: "BodyText", spacing: { after: 60 },
        children: [
          run("Achieved maturity: ", { bold: true }),
          run(it.mlLabel, { bold: true, color: band.text }),
          run("    Target: ", { bold: true }),
          run(it.hasTarget ? it.targetMl : "not set"),
          run("    Element: ", { bold: true }),
          run(it.elementId + (it.elementName ? " " + it.elementName : ""))
        ]
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
      if (it.isNotMet) priChildren.push(run("   not met", { bold: true, color: COLOR.gap }));
      children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));

      if (req.verbatimText) children.push(nis2Field("What this requires", req.verbatimText));
      if (req.rationale) children.push(nis2Field("Why this matters", req.rationale));
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      if (lensFraming) children.push(nis2Field("OT context", lensFraming));
      children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this requirement."));
      children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact")));
      children.push(nis2Field("Recommended action", it.action, planWhere(it, "action")));
      children.push(nis2Field("Owner", it.owner || "To be assigned"));
    });
    return children;
  }

  function mlLimitationsSection(scored, instrument) {
    var children = [ h1("Method and limitations") ];
    children.push(body("The consultant set a maturity level for each requirement against the ML1-ML4 anchors, taking account of the OT context. The result is a profile of achieved maturity levels, not a single programme grade, and mean ML is given for context only. Unknown answers reduce coverage and confidence; Not applicable requirements are excluded. A requirement that is Not met, or below its target ML, is reported as a floor finding and is not averaged away."));
    children.push(body("Requirement titles are verified from " + window.App.Report.standardRef(instrument) + "; the assessor questions are paraphrased and the verbatim requirement text and OT lens are to be populated by the licence holder."));
    return children;
  }

  // ML scorecard (front of body): the achieved-ML distribution as KPI tiles
  // plus the per-element distribution chart. No single grade for this model.
  function mlScorecardDesignB(scored, chartBuf, instrument) {
    var MLs=window.App.ScoringProgramML, c2=scored.overall.counts, children=[];
    children.push(sbTilesRow([
      {t:String(c2.notMet),color:COLOR.gap,label:"Not met",fill:COLOR.gapBg,size:40},
      {t:String(c2.ML1),color:COLOR.muted,label:"ML1",fill:COLOR.subBg,size:40},
      {t:String(c2.ML2),color:COLOR.near,label:"ML2",fill:COLOR.nearBg,size:40},
      {t:String(c2.ML3),color:COLOR.met,label:"ML3",fill:COLOR.metBg,size:40},
      {t:String(c2.ML4),color:COLOR.blue,label:"ML4",fill:COLOR.metBg,size:40}
    ]));
    children.push(body("Maturity profile across "+scored.overall.total+" applicable requirements, assessed against "+window.App.Report.standardRef(instrument)+". The result is a profile of achieved maturity levels, with no single programme grade.",{color:COLOR.muted,spacing:{before:180,after:0}}));
    children.push(h2("Maturity distribution by element"));
    children.push(sbStackTable(scored.byElement.map(function(el){ return sbStackRow(el.elementId+" "+el.name,[{n:el.counts.notMet,color:COLOR.gap},{n:el.counts.ML1,color:COLOR.soft},{n:el.counts.ML2,color:COLOR.near},{n:el.counts.ML3,color:COLOR.met},{n:el.counts.ML4,color:COLOR.blue}]); })));
    children.push(sbLegend([{color:COLOR.gap,label:"Not met"},{color:COLOR.soft,label:"ML1"},{color:COLOR.near,label:"ML2"},{color:COLOR.met,label:"ML3"},{color:COLOR.blue,label:"ML4"}]));
    var foc=scored.byElement.slice().sort(function(a,b){return (a.meanMl||0)-(b.meanMl||0);}).slice(0,3);
    if(foc.length){ children.push(h2("Where to focus first")); children.push(body("Programme elements with the lowest maturity.",{color:COLOR.muted,spacing:{after:40}}));
      foc.forEach(function(el,i){ children.push(sbFocusCard(i+1, el.elementId+" "+el.name, "mean ML "+MLs.formatMean(el.meanMl)+(el.counts.notMet>0?" · "+el.counts.notMet+" not met":""))); children.push(sbSpacer()); }); }
    return children;
  }

  function buildProgramMLDoc(engagement, instrument, profile, narrative, opts, callback) {
    var scoredAll = window.App.ScoringProgramML.scoreEngagement(engagement, instrument, profile);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

    var chartRows = scored.byElement.map(function (el) {
      return { label: el.elementId + " " + el.name, notMet: el.counts.notMet, ml1: el.counts.ML1, ml2: el.counts.ML2, ml3: el.counts.ML3, ml4: el.counts.ML4 };
    });
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    var svg = window.App.Charts.mlDistributionBars(chartRows, { width: 620, labelWidth: 260 });
    holder.appendChild(svg);

    rasterise(svg, opts, function (blob) {
      try { document.body.removeChild(holder); } catch (_) {}
      blobBuf(blob, function (buf) {
        try {
          var coverChildren = coverDesignB(engagement, instrument, { subLine: window.App.Report.standardRef(instrument) + " maturity" });
          // Prose stays portrait; the wide results tables (by element / by theme)
          // go on their own landscape page. Roadmap is prose, so it stays portrait.
          var mlIntro = []
            .concat(mlDocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
            .concat(mlExecutiveSummary(scored, narrative, engagement, instrument))
            .concat(execSummaryAddenda(engagement, opts.progress))
            .concat(mlNotCertificationCaveatBlock(narrative))
            .concat([pageBreakPara()])
            .concat(mlScorecardDesignB(scored, buf, instrument))
            .concat([pageBreakPara()])
            .concat(mlAboutSection(instrument, narrative))
            .concat(slGlossary(instrument, null, narrative, engagement));
          var mlTables = []
            .concat(mlResultsByElementSection(scored, null, CAF_LANDSCAPE_W, instrument))
            .concat(mlResultsByThemeSection(scored, CAF_LANDSCAPE_W));
          var mlTail = []
            .concat(mlFindingsSection(scored, instrument))
            .concat(mlRoadmapSection(scored, instrument))
            .concat(progressSection(opts.progress))
            .concat(basisOfAssessmentSection(engagement))
            .concat(mlLimitationsSection(scored, instrument)).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

          var PO = docPO();
          var coverSection = { properties: { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren };
          var sections = [ coverSection ].concat(bodySectionsFromSegments(
            brandHeaders(), brandFootersDoc(instrument, engagement),
            [ { land: false, children: mlIntro }, { land: true, children: mlTables }, { land: false, children: mlTail } ]));

          var doc = makeDoc(engagement, {
            creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
            title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
            description: window.App.Report.standardRef(instrument) + " maturity assessment",
            styles: buildStyles(),
            sections: sections
          }, opts);
          packDoc(doc, opts, callback);
        } catch (e) { callback(e); }
      });
    });
  }

  // ---- public -----------------------------------------------------------

  // SL scorecard (front of body): target-met KPIs + FR radar. The SL model
  // reports target-met and closeness per FR, so no single grade.
  // FR closeness bars: one proportional bar per Foundational Requirement,
  // coloured by target-met / one-below / floor. Built as docx tables so it
  // survives in Word without a rasterised chart.
  function slClosenessBars(scored, taxonomy) {
    var TableRow = window.docx.TableRow;
    var rows = (scored.perFR || []).map(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      var clos = fr.answeredCount === 0 ? 0 : (fr.closeness || 0);
      var pct = Math.round(clos * 100);
      var col = fr.answeredCount === 0 ? COLOR.soft : (fr.frTargetMet ? COLOR.met : (fr.floorFlagCount > 0 ? COLOR.gap : COLOR.near));
      var barTotal = 5000;
      var filled = Math.max(30, Math.round(barTotal * clos));
      var rest = barTotal - filled;
      var barCells = rest > 0
        ? [ cellDxa(body("", { size: 2 }), filled, { fill: col }), cellDxa(body("", { size: 2 }), rest, { fill: "EEF1F5" }) ]
        : [ cellDxa(body("", { size: 2 }), barTotal, { fill: col }) ];
      var barTable = new window.docx.Table({
        width: dxaW(barTotal), borders: TBL_NONE, columnWidths: rest > 0 ? [filled, rest] : [barTotal],
        rows: [ new TableRow({ children: barCells }) ]
      });
      return new TableRow({ children: [
        cellDxa(body(fr.frId + " " + taxFR.name, { size: 18 }), 2800),
        cellDxa(barTable, 5226),
        cellDxa(body(fr.answeredCount === 0 ? "n/a" : pct + "%", { bold: true, color: col, size: 18 }), 1000)
      ] });
    });
    if (rows.length === 0) return [];
    return [ h2("Closeness to target by Foundational Requirement"), fixedTable(rows, [2800, 5226, 1000]) ];
  }

  // The FRs below target, worst first, as a short "where to focus" list.
  //
  // Takes the top of the SAME ranking the screen card shows, rather than
  // re-sorting by closeness on its own: two differently-ordered "focus first"
  // lists in one report is the kind of thing a reader notices, and it also
  // means a consultant's reordering carries into the document.
  function slWhereToFocus(scored, taxonomy, engagement) {
    var frs = window.App.Report.slPriorityFRs(scored, { engagement: engagement }).slice(0, 3);
    if (frs.length === 0) return [];
    var out = [ h2("Where to focus first") ];
    frs.forEach(function (fr) {
      var taxFR = (taxonomy.frs || []).filter(function (f) { return f.id === fr.frId; })[0] || { name: "" };
      out.push(bullet(fr.frId + " " + taxFR.name + ": achieved " + S.formatSL(fr.conformantAchievedSL) + " against " + S.formatSL(fr.targetSL) + (fr.floorFlagCount > 0 ? ", floor item" : "") + "."));
    });
    return out;
  }

  // Requirement heatmap: one row per Foundational Requirement, a small cell per
  // system requirement, coloured by how it sits against target. Native Word
  // tables (nested) so it survives without a rasterised image.
  function slRequirementHeatmap(scored, taxonomy, instrument) {
    var TableRow = window.docx.TableRow;
    var HR = (window.docx.HeightRule) || { ATLEAST: "atLeast" };
    var anyReqs = (scored.perFR || []).some(function (fr) { return (fr.reqs || []).length; });
    if (!anyReqs) return [];
    var rows = (scored.perFR || []).map(function (fr) {
      var reqs = (fr.reqs || []);
      var cellW = 170;
      var cells = reqs.map(function (r) {
        var col;
        if (r.scopedCount === 0 || r.countedCount === 0) col = COLOR.naBg;
        else if (!r.touched) col = COLOR.naBg;   // in scope, nobody has answered it yet
        else if (r.toAssess) col = COLOR.naBg;   // answered in part, nothing short: still to assess
        else if (r.met) col = COLOR.met;
        else if (r.floor) col = COLOR.gap;
        else col = COLOR.near;
        return cellDxa(body("", { size: 2 }), cellW, { fill: col });
      });
      var heat = cells.length
        ? new window.docx.Table({ width: dxaW(cellW * cells.length), borders: TBL_WHITE, columnWidths: cells.map(function () { return cellW; }), rows: [ new TableRow({ height: { value: 150, rule: HR.ATLEAST }, children: cells }) ] })
        : body("-", { color: COLOR.soft, size: 16 });
      return new TableRow({ children: [
        cellDxa(body(fr.frId, { bold: true, size: 18, color: COLOR.navy }), 1200),
        cellDxa(heat, 7826)
      ] });
    });
    // The unit noun comes from the instrument: 62443-3-3 assesses system
    // requirements, 62443-4-2 component requirements, and calling both "system"
    // was simply wrong in the component report.
    var unitNoun = ((instrument && instrument.display && instrument.display.requirementNoun) || "system requirement");
    var legend = body([
      run("Each cell is a " + unitNoun + ":   ", { size: 16, color: COLOR.muted }),
      run("■ ", { size: 18, color: COLOR.met }), run("meets target    ", { size: 16, color: COLOR.muted }),
      run("■ ", { size: 18, color: COLOR.near }), run("one level below    ", { size: 16, color: COLOR.muted }),
      run("■ ", { size: 18, color: COLOR.gap }), run("floor / two or more below    ", { size: 16, color: COLOR.muted }),
      run("■ ", { size: 18, color: COLOR.naBg }), run(((scored.roadmap || []).some(function (r) { return r.toAssess; })
        ? "not fully assessed or out of scope" : "not assessed or out of scope"), { size: 16, color: COLOR.muted })
    ], { spacing: { before: 80 } });
    return [ h2("Requirement heatmap"), fixedTable(rows, [1200, 7826]) ].concat(firstTime("sl-heatmap-legend") ? [legend] : []);
  }

  // ---- multi-target SL (62443-3-3) report -----------------------------
  //
  // The scope noun comes from the instrument. 62443-3-3 assesses ZONES AND
  // CONDUITS, so a report that calls them "sites" is describing something the
  // consultant never scoped.
  function scopeNoun(instrument) {
    return ((instrument && instrument.targetDimensionLabel) || "Site").toLowerCase();
  }
  function scopeNounPlural(instrument) {
    var R = window.App.Report;
    var label = (instrument && instrument.targetDimensionLabel) || "Site";
    return R && R.pluralLower ? R.pluralLower(label, instrument) : (label.toLowerCase() + "s");
  }

  // The vocabulary the report uses, in one place: both the standard's terms
  // and this report's own. Sits with the framing sections rather than in an
  // appendix, because a reader who cannot decode "SL-A" stops on page four.
  function slGlossary(instrument, taxonomy, narrative, engagement) {
    var R = window.App.Report;
    if (!R || !R.glossarySections) return [];
    var sections = R.glossarySections(instrument, taxonomy, narrative, engagement);
    if (!sections.length) return [];
    var TableRow = window.docx.TableRow;
    // No introduction: the heading says what the section is, and a sentence
    // describing the glossary ("everything the findings rely on is defined
    // here") told the reader nothing the tables do not.
    var out = [h1("Terms used in this report")];
    sections.forEach(function (sec) {
      out.push(h2(sec.heading));
      if (sec.intro) out.push(body(sec.intro, { color: COLOR.muted }));
      var rows = sec.rows.map(function (r) {
        return new TableRow({ children: [
          cell(body(r[0], { bold: true, color: COLOR.navy })),
          cell(body(r[1]))
        ]});
      });
      out.push(table(rows, { noBorders: false }));
      out.push(body("", { spacing: { after: 60 } }));
    });
    return out;
  }

  // What is true of the whole system, before the zones are taken one at a
  // time. Same prose and same table as the screen card, from App.Report.
  function slSystemRollup(scoredAll, instrument, taxonomy) {
    var R = window.App.Report;
    if (!R || !R.systemRollupLines) return [];
    var rollup = scoredAll && scoredAll.systemRollup;
    if (!rollup || rollup.zoneCount < 2) return [];
    var lines = R.systemRollupLines(rollup, instrument);
    if (!lines.length) return [];
    var TableRow = window.docx.TableRow;
    var plural = R.pluralLower((instrument && instrument.targetDimensionLabel) || "zone", instrument);
    var noun = ((instrument && instrument.targetDimensionLabel) || "zone").toLowerCase();

    var head = new TableRow({ tableHeader: true, children: [
      headerCell("Foundational Requirement", 34),
      headerCell("Across " + plural, 16),
      headerCell("Met in", 10),
      headerCell("Lowest achieved", 14),
      headerCell("Short in", 26)
    ]});
    var rows = R.systemRollupRows(rollup).map(function (f) {
      var fill = f.verdict === "met-everywhere" ? COLOR.metBg
               : f.verdict === "short-everywhere" ? COLOR.gapBg
               : (f.verdict === "mixed" || f.verdict === "met-so-far") ? COLOR.nearBg : COLOR.naBg;
      var col  = f.verdict === "met-everywhere" ? COLOR.met
               : f.verdict === "short-everywhere" ? COLOR.gap
               : (f.verdict === "mixed" || f.verdict === "met-so-far") ? COLOR.near : COLOR.muted;
      return new TableRow({ children: [
        cell([ body(f.frId + " " + f.name, { bold: true }) ]),
        cell(body(R.rollupVerdictLabel(f.verdict), { bold: true, color: col }), { fill: fill }),
        cell(body(f.assessedZones ? (f.met.length + " / " + f.assessedZones) : "-")),
        cell(body(f.lowestAchieved === null ? "-" : S.formatSL(f.lowestAchieved), { bold: true })),
        cell(body(f.short.length ? f.short.join(", ") : "-", { size: 18 }))
      ]});
    });

    var out = [h2("The system as a whole")];
    lines.forEach(function (t) { out.push(body(t)); });
    out.push(table([head].concat(rows)));
    out.push(body("\"Lowest achieved\" is the weakest position across the assessed " + plural +
      ". It is a floor, not a Security Level held by the system: ISA/IEC 62443-3-3 assigns an achieved Security Level to a " +
      noun + ", and nothing here averages or combines them.",
      { color: COLOR.muted, spacing: { before: 80 } }));
    return out;
  }

  // The FR the at-a-glance tile points at, chosen across every zone rather
  // than inside the lead zone alone, where it could show SL 1 while the grid
  // below it showed SL 0 elsewhere. Where anything assessed is short, the FR
  // furthest below its own target (then the lowest achieved, then the lead
  // zone, then zone order), labelled as that, since a zone further below its
  // target need not hold the lowest level. Where nothing is short, the lowest
  // achieved level. Null when nothing is assessed.
  function slSystemWeakestFR(sites, lead) {
    var best = null;
    function better(a, b) {
      if (a.short !== b.short) return a.short;
      if (a.short && a.gap !== b.gap) return a.gap > b.gap;
      if (a.fr.conformantAchievedSL !== b.fr.conformantAchievedSL) return a.fr.conformantAchievedSL < b.fr.conformantAchievedSL;
      return a.site === lead && b.site !== lead;
    }
    (sites || []).forEach(function (s) {
      ((s.result && s.result.perFR) || []).forEach(function (f) {
        if (!f.inScope || !f.countedCount || !f.answeredCount) return;
        // Short means an answered shortfall; an FR met so far with items still
        // blank is not "below target", however low its blanks hold its level.
        var st = f.frTargetStatus || (f.frTargetMet ? "met" : "short");
        var c = { site: s, fr: f, short: st === "short", gap: (f.targetSL || 0) - (f.conformantAchievedSL || 0) };
        if (!best || better(c, best)) best = c;
      });
    });
    return best;
  }

  // The multi-zone report's at-a-glance block: the same headline tiles the
  // single-zone scorecard opens with, then the achieved level per Foundational
  // Requirement in every zone as one coloured grid. Without it the executive
  // summary was followed only by prose and tables, the one report in the set
  // with no visual summary. Every figure is per zone or a count of zones; none
  // is a Security Level for the system, which 62443-3-3 does not define.
  function slSystemAtAGlance(scoredAll, sites, lead, taxonomy, instrument) {
    var rollup = scoredAll && scoredAll.systemRollup;
    if (!rollup || rollup.zoneCount < 2) return [];
    var TableRow = window.docx.TableRow, AT = window.docx.AlignmentType;
    var R = window.App.Report;
    var noun = scopeNoun(instrument), plural = scopeNounPlural(instrument);
    // Counted over every zone in scope. A zone met so far with FRs still to
    // assess, and a zone nobody has answered at all, are neither meeting
    // their target nor short of it, and the tile says how many are in that
    // state. Counting only the assessed zones read "1 of 1" in green beside a
    // zone with nothing answered, more confident than when that zone was half
    // done. With none short it is amber, not red: nothing found has fallen short.
    var incN = (rollup.zonesIncomplete || []).length, shortN = rollup.zonesShort.length;
    var naN = (rollup.zonesNotAssessed || []).length, openN = incN + naN;
    var metN = rollup.zonesMeetingTarget.length, assessedN = metN + shortN + incN, allN = assessedN + naN;
    var shortAll = (rollup.shortEverywhere || []).length;
    var floorN = rollup.floorRequirementCount || 0;
    var wk = slSystemWeakestFR(sites, lead);
    var out = [];
    out.push(sbTilesRow([
      { t: assessedN ? metN + " of " + allN : "-",
        label: plural.charAt(0).toUpperCase() + plural.slice(1) + " meeting target" + (openN ? " (" + openN + " not fully assessed)" : ""), size: 34,
        color: !assessedN ? COLOR.muted : (metN === allN ? COLOR.met : (metN === 0 && shortN > 0 ? COLOR.gap : COLOR.near)),
        fill: !assessedN ? COLOR.naBg : (metN === allN ? COLOR.metBg : (metN === 0 && shortN > 0 ? COLOR.gapBg : COLOR.nearBg)) },
      { t: wk ? wk.fr.frId + " · " + S.formatSL(wk.fr.conformantAchievedSL) : "-",
        label: wk ? (wk.short ? "Furthest below target (" + wk.site.target.name + ", target " + S.formatSL(wk.fr.targetSL) + ")"
                              : "Weakest FR (" + wk.site.target.name + ")") : "Weakest FR",
        color: COLOR.navy, fill: "F5F8FA", size: 22 },
      { t: String(shortAll), label: "FRs short in every " + noun, size: 40,
        color: shortAll > 0 ? COLOR.gap : COLOR.met, fill: shortAll > 0 ? COLOR.gapBg : COLOR.metBg },
      { t: String(floorN), label: "Floor findings", size: 40,
        color: floorN > 0 ? COLOR.gap : COLOR.met, fill: floorN > 0 ? COLOR.gapBg : COLOR.metBg }
    ]));
    out.push(body("Floor findings are counted once per requirement, however many " +
      plural + " share the gap.", { color: COLOR.muted, spacing: { before: 180 } }));

    // Achieved SL per FR per zone, coloured as the requirement heatmap is.
    var labelW = 2800, zoneW = Math.floor(6226 / sites.length), widths = [labelW];
    sites.forEach(function () { widths.push(zoneW); });
    var head = new TableRow({ tableHeader: true, children: [ cellDxa(body("Foundational Requirement", { bold: true, size: 16, color: COLOR.muted }), labelW) ]
      .concat(sites.map(function (s) { return cellDxa(sbP(s.target.name, { bold: true, size: 16, color: COLOR.navy, align: AT.CENTER }), zoneW, { valign: "center" }); })) });
    var rows = [head];
    (taxonomy.frs || []).forEach(function (fr) {
      var cells = [ cellDxa(body(fr.id + " " + (fr.name || ""), { size: 17 }), labelW, { valign: "center" }) ];
      sites.forEach(function (s) {
        var f = (s.result.perFR || []).filter(function (x) { return x.frId === fr.id; })[0];
        var txt, sub, fill, col;
        if (!f || f.inScope === false) { txt = "n/a"; sub = "out of scope"; fill = COLOR.naBg; col = COLOR.muted; }
        else if (f.answeredCount === 0) { txt = "-"; sub = "not assessed"; fill = COLOR.naBg; col = COLOR.muted; }
        else {
          txt = S.formatSL(f.conformantAchievedSL); sub = "target " + S.formatSL(f.targetSL);
          if (f.frTargetMet) { fill = COLOR.metBg; col = COLOR.met; }
          // Nothing short, items still blank: "not yet", never a shortfall colour.
          else if (f.frTargetStatus === "incomplete") { fill = COLOR.nearBg; col = COLOR.near; sub = "not yet, " + sub; }
          else if (f.targetSL != null && f.conformantAchievedSL === f.targetSL - 1) { fill = COLOR.nearBg; col = COLOR.near; }
          else { fill = COLOR.gapBg; col = COLOR.gap; }
        }
        cells.push(cellDxa([ sbP(txt, { bold: true, size: 18, color: col, align: AT.CENTER, spacing: { before: 50, after: 0 } }),
                             sbP(sub, { size: 14, color: COLOR.muted, align: AT.CENTER, spacing: { before: 0, after: 50 } }) ], zoneW, { fill: fill, valign: "center" }));
      });
      rows.push(new TableRow({ children: cells }));
    });
    out.push(h2("Achieved Security Level by " + noun));
    out.push(fixedTable(rows, widths));
    out.push(sbLegend([
      { color: COLOR.met, label: "meets target" },
      { color: COLOR.near, label: sites.some(function (s) { return (s.result.partlyAssessedFRs || []).length; })
          ? "one level below, or not yet fully assessed" : "one level below" },
      { color: COLOR.gap, label: "two or more below" }, { color: COLOR.naBg, label: "not assessed or out of scope" }
    ]));
    return out;
  }

  function slSiteComparison(sites, taxonomy, instrument) {
    var TableRow = window.docx.TableRow;
    var noun = scopeNoun(instrument);
    var rows = [ new TableRow({ children: [
      headerCell(noun.charAt(0).toUpperCase() + noun.slice(1), 30), headerCell("Overall target met", 18), headerCell("Closeness", 14), headerCell("Weakest FR", 24), headerCell("Floor flags", 14)
    ] }) ];
    sites.forEach(function (s) {
      var r = s.result, tm = slTargetMet(r);
      rows.push(new TableRow({ children: [
        cell(body(s.target.name, { bold: true })),
        cell(tm.detail ? [ body(tm.value, { bold: true, color: tm.color }), body(tm.detail, { size: 16, color: COLOR.muted }) ]
                       : body(tm.value, { bold: true, color: tm.color }), { fill: tm.fill }),
        cell(body(S.formatPct(r.overallCloseness))),
        cell(body(r.weakestFR ? (r.weakestFR.frId + " " + S.formatSL(r.weakestFR.conformantAchievedSL)) : "-")),
        cell(body(String(r.floorFlagCount), { bold: r.floorFlagCount > 0, color: r.floorFlagCount > 0 ? COLOR.gap : COLOR.met }), { fill: r.floorFlagCount > 0 ? COLOR.gapBg : undefined })
      ] }));
    });
    // No heading of its own: the caller owns the numbered section this sits in.
    var plural = scopeNounPlural(instrument);
    return [ body("This assessment covers " + sites.length + " " + plural + ", each judged against its own target Security Level and reported on its own. Nothing is aggregated across " + plural + ", and the weakest position is the prudent basis for a decision about the scope as a whole."),
             table(rows), body("", { spacing: { after: 120 } }) ];
  }
  // Tagged as a level-1 boundary for the customisation pass. Untagged, it was
  // invisible to applyReportCustom, so a hidden section before it ran on to the
  // next tagged level-1 heading and took every zone in between with it: hiding
  // the glossary removed all the zones. Boundary only: the zone is part of the
  // assessment's scope, not a section the consultant can rename or hide.
  function slSiteHeaderNumbered(name, idx, total, instrument, sectionNum) {
    var noun = scopeNoun(instrument);
    var lead = noun.charAt(0).toUpperCase() + noun.slice(1);
    var p = new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [
        run(sectionNum + " ", { color: COLOR.brandBlue, bold: true }),
        run(name),
        run("   (" + lead + " " + idx + " of " + total + ")", { color: COLOR.muted })
      ]
    });
    p.__headingText = name; p.__headingLevel = 1; p.__headingNum = sectionNum; p.__boundaryOnly = true;
    return p;
  }
  // One FR radar per zone, rendered in turn, so each zone's scorecard carries
  // the same chart the single-zone report and the screen show.
  function slZoneRadars(sites, taxonomy, done, exportOpts) {
    var bufs = [];
    (function next(i) {
      if (i >= sites.length) { done(bufs); return; }
      if (!window.App.Report.slAnyAnswered(sites[i].result)) { bufs.push(null); next(i + 1); return; }
      makeChartBlob(window.App.Charts.radar, sites[i].result, taxonomy, { size: 420 }, function (blob) {
        blobBuf(blob, function (buf) { bufs.push(buf); next(i + 1); });
      }, exportOpts);
    })(0);
  }

  // How far a zone sits below its own target: the largest (target - achieved)
  // over the FRs that were actually assessed, 0 where every one is met.
  function slZoneShortfall(result) {
    var worst = 0;
    ((result && result.perFR) || []).forEach(function (f) {
      if (!f.inScope || !f.countedCount || !f.answeredCount || f.targetSL == null) return;
      var d = f.targetSL - (f.conformantAchievedSL || 0);
      if (d > worst) worst = d;
    });
    return worst;
  }

  // The zone the executive summary is composed from: the one a decision about
  // the whole system has to be taken against. Ranked, in order: assessed at
  // all; target not met; furthest below its own target; lowest achieved SL.
  // Ranking on the lowest achieved SL alone picked a zone that met an SL 1
  // target over one sitting at SL 2 against SL 3, and the summary then told
  // the client the system met its target.
  // "Target not met" here is the scorer's "short": some answered in-scope
  // item falls short. An FR answered only in part with nothing short is not
  // short (its blanks still hold its level down, but that is work to do, not
  // a finding). A zone met so far with FRs still to assess, wholly or in part,
  // ranks with the met zones, on its lowest level, so the summary's "the zone
  // with the lowest achieved Security Level" stays true.
  function slLeadZone(sites) {
    function rank(s) {
      var r = s.result || {};
      var assessed = window.App.Report.slAnyAnswered(r);
      var status = r.overallTargetStatus || (r.overallTargetMet ? "met" : "short");
      return [ assessed ? 0 : 1,
               assessed && status === "short" ? 0 : 1,
               -slZoneShortfall(r),
               r.weakestFR ? r.weakestFR.conformantAchievedSL : 99 ];
    }
    var best = null, bestRank = null;
    (sites || []).forEach(function (s) {
      var k = rank(s);
      if (!best) { best = s; bestRank = k; return; }
      for (var i = 0; i < k.length; i++) {
        if (k[i] < bestRank[i]) { best = s; bestRank = k; return; }
        if (k[i] > bestRank[i]) return;
      }
    });
    return best;
  }

  // One short paragraph for the multi-zone executive summary: how many zones
  // meet their target, how many fall short, how many are not fully assessed,
  // and which zone the summary's figures describe. Without it the counts that
  // follow (FRs assessed, met, short) read as the system's, when they are one
  // zone's. Counts and the lead zone only: "Results across the system" names
  // every zone in each state, and the summary saying it first, word for word,
  // was the same thing twice.
  function slZoneSummaryLine(rollup, leadName, instrument) {
    if (!rollup || rollup.zoneCount < 2) return "";
    var noun = scopeNoun(instrument), plural = scopeNounPlural(instrument);
    var incN = (rollup.zonesIncomplete || []).length, naN = (rollup.zonesNotAssessed || []).length;
    var metN = rollup.zonesMeetingTarget.length, shortN = rollup.zonesShort.length, assessedN = metN + shortN + incN;
    if (!assessedN) return "";
    var allN = assessedN + naN, openN = incN + naN;
    var s;
    if (shortN > 0) {
      var howMany = shortN === allN ? (allN === 2 ? "both" : "all " + allN) : shortN + " of the " + allN;
      s = cap(howMany) + " " + plural + " in scope " + (shortN === 1 ? "falls" : "fall") + " short of " +
          (shortN === 1 ? "its" : "their") + " target Security Level.";
    } else if (openN === 0) {
      s = (allN === 2 ? "Both " : "All " + allN + " ") + plural + " meet their target Security Level.";
    } else {
      // Nothing assessed has fallen short, but not everything is assessed:
      // said as what has been found so far, never as the target met.
      s = "No " + noun + " assessed so far falls short of its target Security Level" +
          (metN ? ", and " + metN + " of the " + allN + " " + (metN === 1 ? "meets" : "meet") + " it in full." : ".");
    }
    if (openN) s += " " + (openN === 1 ? "One" : String(openN)) + " " + (openN === 1 ? noun + " has" : plural + " have") +
      " not been fully assessed yet.";
    s += " The figures in this summary are for " + leadName + ", the " + noun +
         (shortN > 0 ? " furthest below its target." : " with the lowest achieved Security Level.");
    return s + " Each " + noun + " is reported in full in its own section.";
  }

  function buildSLMultiSite(engagement, instrument, taxonomy, profile, narrative, opts, callback) {
    var scoredAll, sites;
    try {
      scoredAll = window.App.Scoring.scoreEngagement(engagement, instrument, taxonomy, profile);
      sites = scoredAll.perTarget || [];
      sites.forEach(function (s) { s.result._taxonomy = taxonomy; });
    } catch (e) { callback(e); return; }
    slZoneRadars(sites, taxonomy, function (radars) {
    printedOnce = { __noun: scopeNoun(instrument) };
    try {
      var plural = scopeNounPlural(instrument);
      var coverChildren = coverDesignB(engagement, instrument, { subLine: (instrument.edition ? instrument.edition + " edition · " : "") + sites.length + " " + plural + " assessed" });

      // The multi-zone report used to open straight into the comparison table,
      // which meant the moment a consultant scoped the work as zones - the
      // normal case for 62443-3-3 - the client-facing document lost its
      // document control, its executive summary, the not-a-certification
      // caveat, the about/scope/how-to-read framing and the basis of
      // assessment. Same front matter as the single-zone report now, and the
      // sections are numbered once through rather than restarting per zone.
      //
      // The executive summary is written for the whole engagement, so it is
      // composed from the zone furthest below its target: on a zoned system
      // that is the position a decision has to be taken against. Its verdict
      // is then held to the system: it may say the target is met only when
      // every assessed zone meets its own.
      var lead = slLeadZone(sites) || sites[0];
      var sysCtx = {
        rollup: scoredAll.systemRollup,
        summaryLine: slZoneSummaryLine(scoredAll.systemRollup, lead.target.name, instrument)
      };

      var bodyChildren = []
        .concat(documentControl(engagement, instrument, opts)).concat([pageBreakPara()])
        .concat(slExecutiveSummary(narrative, lead.result, engagement, sysCtx))
        .concat(execSummaryAddenda(engagement, opts.progress))
        .concat(slNotCertificationCaveatBlock(narrative))
        .concat([pageBreakPara()])
        // Work that spans the zones is stated once, up front: a reader who sees
        // it repeated under every zone cannot tell it is a single action.
        .concat([h1n("2", "Results across the system")])
        .concat(slSystemAtAGlance(scoredAll, sites, lead, taxonomy, instrument))
        .concat(slSystemRollup(scoredAll, instrument, taxonomy))
        .concat([h2("Results by " + plural)])
        .concat(slSiteComparison(sites, taxonomy, instrument))
        .concat(slSharedActions(scoredAll, instrument))
        .concat(slProgrammeContext(instrument, opts))
        .concat([pageBreakPara()])
        .concat(aboutSection(narrative, instrument))
        .concat(scopeAndMethod(narrative, engagement, instrument, lead.result, sites))
        .concat(howToRead(narrative))
        .concat(slGlossary(instrument, taxonomy, narrative, engagement));

      var zoneOpts = {};
      Object.keys(opts || {}).forEach(function (k) { zoneOpts[k] = opts[k]; });
      zoneOpts.suppressProgrammeContext = true;
      zoneOpts.engagement = engagement;   // so the scorecard can read the consultant's order
      sites.forEach(function (s, i) {
        bodyChildren.push(slSiteHeaderNumbered(s.target.name, i + 1, sites.length, instrument, String(i + 3)));
        // Per zone: scorecard, findings, then the prose roadmap. Unnumbered
        // inside the zone's own numbered section.
        bodyChildren = bodyChildren
          .concat(slScorecardDesignB(s.result, taxonomy, radars[i], instrument, zoneOpts))
          .concat(findingsByFR(narrative, s.result, taxonomy, engagement, s.target.id, null))
          .concat(slRoadmapSection(s.result, taxonomy, instrument, engagement, s.target.id, null))
          // Advice this zone carries on requirements that already meet target,
          // inside the zone's own section where it belongs, so a level-2
          // heading like the zone's other parts.
          .concat(furtherRecommendationsSection(engagement, instrument, s.result, s.target.id, 2));
      });
      // The progress comparison is captured for the active target only, so it
      // sits once at document level rather than per zone.
      // Limitations and the next-steps draft speak for the whole document, so
      // they read every zone: the draft's "each of the N actions on the
      // roadmap" counted the lead zone's roadmap alone while the document
      // carried a roadmap per zone.
      var allRoadmaps = [];
      sites.forEach(function (s) { allRoadmaps = allRoadmaps.concat(s.result.roadmap || []); });
      bodyChildren = bodyChildren.concat(progressSection(opts.progress)).concat(basisOfAssessmentSection(engagement))
        .concat(limitationsSection(narrative, lead.result, taxonomy, engagement, sites, instrument))
        .concat(nextStepsSection(engagement, { instrument: instrument, scored: Object.assign({}, lead.result, { roadmap: allRoadmaps }) }))
        .concat(methodologyAppendix(instrument));
      var PO = (window.docx && window.docx.PageOrientation) || { PORTRAIT: "portrait" };
      var A4_W = 11906, A4_H = 16838;
      var doc = makeDoc(engagement, {
        creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
        title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
        description: "Executive site security assessment (multi-site)",
        styles: buildStyles(),
        sections: [
          { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren },
          { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: brandHeaders(), footers: brandFootersDoc(instrument, engagement), children: bodyChildren }
        ]
      }, opts);
      printedOnce = null;
      packDoc(doc, opts, callback);
    } catch (e) { printedOnce = null; callback(e); }
    }, opts);
  }

  // The capability security level vector, in the standard's own notation, as a
  // tile per Foundational Requirement plus the formal claim line. Rendered only
  // for instruments that declare display.slVector (62443-4-2 today), so the
  // system-level report is unchanged. Shares its shape with the screen card via
  // App.Report so the two can never disagree.
  function slCapabilityVector(scored, taxonomy, instrument) {
    var R = window.App.Report;
    if (!R || !R.slVectorSpec) return [];
    var spec = R.slVectorSpec(instrument);
    if (!spec) return [];
    var parts = R.slVectorParts(scored, taxonomy);
    if (!parts.length) return [];

    var tiles = parts.map(function (p) {
      var col = COLOR.muted, fill = "F5F8FA";
      if (p.achieved !== null) {
        if (p.met) { col = COLOR.met; fill = COLOR.metBg; }
        else if (p.targetSL != null && p.achieved === p.targetSL - 1) { col = COLOR.near; fill = COLOR.nearBg; }
        else { col = COLOR.gap; fill = COLOR.gapBg; }
      }
      return { t: (p.achieved === null ? "-" : String(p.achieved)), color: col, label: p.abbr, fill: fill, size: 36 };
    });

    var qual = spec.qualifier ? " (" + spec.qualifier + ")" : "";
    var out = [h2(spec.title || "Capability security level")];
    out.push(sbTilesRow(tiles));
    out.push(body(R.slVectorClaim((spec.label || "SL-C") + qual, parts, "achieved"),
      { bold: true, color: COLOR.navy, spacing: { before: 160 } }));
    if (parts.some(function (p) { return p.targetSL != null; })) {
      out.push(body(R.slVectorClaim((spec.targetLabel || "SL-T") + qual, parts, "targetSL"),
        { color: COLOR.muted }));
    }
    // The same vector with compensating countermeasures stripped out, stated
    // only where it differs. The gap between the two is a fragility signal.
    var propped = parts.filter(function (p) { return p.propped; });
    if (propped.length) {
      out.push(body(R.slVectorClaim((spec.label || "SL-C") + qual + ", without compensating measures", parts, "achievedStrict"),
        { bold: true, color: COLOR.near, spacing: { before: 80 } }));
      out.push(body((propped.length === 1
          ? propped[0].frId + " holds its level"
          : propped.map(function (p) { return p.frId; }).join(", ") + " hold their levels") +
        " on a compensating countermeasure rather than the requirement itself." +
        (firstTime("sl-propped-why") ? " Compensating measures are the first thing to decay, so the second vector is the level that survives if one lapses." : ""),
        { color: COLOR.muted }));
    }
    if (spec.note && firstTime("sl-vector-note")) out.push(body(spec.note, { color: COLOR.muted, spacing: { before: 80 } }));
    return out;
  }

  // Accounts for every requirement that was NOT assessed, so a reader can tell
  // an out-of-scope component type from an assessor who skipped something.
  function slScopeAccounting(scored, instrument) {
    var R = window.App.Report;
    if (!R || !R.requirementTypeSplit) return [];
    var split = R.requirementTypeSplit(scored, instrument);
    var lines = R.applicabilityLines(split, instrument);
    if (!lines.length) return [];
    var out = [h2("What was in scope")];
    lines.forEach(function (t, i) { out.push(body(t, i === 0 ? {} : { color: COLOR.muted })); });
    return out;
  }

  // The items that cap each Foundational Requirement below its target. Same
  // list the screen report shows, from App.Report so the two cannot disagree.
  function slBlockingItems(scored, taxonomy, instrument) {
    var R = window.App.Report;
    if (!R || !R.blockingLines) return [];
    var rows = R.blockingLines(scored, taxonomy);
    if (!rows.length) return [];
    var TableRow = window.docx.TableRow;
    var noun = ((instrument && instrument.display && instrument.display.requirementNoun) || "requirement");
    var head = new TableRow({ tableHeader: true, children: [
      headerCell("Foundational Requirement", 34),
      headerCell("Achieved", 11),
      headerCell("Target", 11),
      headerCell("Blocking " + noun + "s", 44)
    ]});
    var body_ = rows.map(function (r) {
      var items = r.items.map(function (i) {
        return body([
          run(i.label + "  ", { bold: true }),
          run(i.title || "", {}),
          run("   " + R.dispositionWord(i.disposition) + ", required from SL " + i.firstSL,
              { color: COLOR.muted, size: 18 })
        ], { spacing: { after: 40 } });
      });
      return new TableRow({ children: [
        cell(body(r.frId + " " + r.name, { bold: true })),
        cell(body(S.formatSL(r.achieved), { color: r.status === "incomplete" ? COLOR.near : COLOR.gap, bold: true })),
        cell(body(S.formatSL(r.targetSL))),
        cell(items)
      ]});
    });
    return [
      h2("What is holding each level down"),
      firstTime("sl-blocking-why")
        ? body("The achieved level is set by the weakest item in scope, so closing everything listed here, and nothing more, raises that Foundational Requirement to the next level.",
            { color: COLOR.muted })
        : null,
      table([head].concat(body_))
    ].filter(Boolean);
  }

  // Actions that span zones: a countermeasure implemented once for the whole
  // system produces one gap, not one per zone. Printed once, naming the zones
  // it resolves and each zone's own SL-T, so the reader is not handed the same
  // paragraph four times with four owners.
  function slSharedActions(scoredAll, instrument) {
    var R = window.App.Report;
    if (!R || !R.sharedActionLines) return [];
    var rows = R.sharedActionLines(scoredAll);
    if (!rows.length) return [];
    var TableRow = window.docx.TableRow;
    var noun = ((instrument && instrument.targetDimensionLabel) || "zone").toLowerCase();
    var plural = R.pluralLower((instrument && instrument.targetDimensionLabel) || "zone", instrument);
    var head = new TableRow({ tableHeader: true, children: [
      headerCell("Requirement", 26),
      headerCell("Recommended action", 34),
      headerCell("Owner", 14),
      headerCell("Resolves", 26)
    ]});
    var body_ = rows.map(function (r) {
      return new TableRow({ children: [
        cell([
          body((r.code ? r.code + " " : "") + r.title, { bold: true }),
          body(r.frId + (r.blocks ? "  ·  blocking" : ""), { color: COLOR.muted, size: 18 })
        ]),
        cell([
          r.action ? body(r.action)
            : tagPlaceholder(body("To be completed by the consultant", { style: "PlaceholderText" }),
                "To be completed by the consultant", planWhere(r, "action", sharedTargetId())),
          r.impact ? body("Impact: " + r.impact, { color: COLOR.muted, size: 18 }) : body("", { size: 2 })
        ]),
        cell(body(r.owner || "To be assigned", r.owner ? {} : { color: COLOR.muted })),
        cell(r.affected.map(function (a) {
          return body(a.name + ": target " + S.formatSL(a.targetSL) + ", currently " + S.formatSL(a.itemsAchieved),
                      { size: 18, spacing: { after: 40 } });
        }))
      ]});
    });
    return [
      h2("Actions that span " + plural),
      body("These requirements are met or missed by something implemented once and shared, so each is one piece of work rather than one per " +
           noun + ". A shared countermeasure does not always reach every " + noun +
           ", so every " + noun + " the action resolves is named below, with that " + noun +
           "'s own target Security Level. They also appear in the relevant " + noun + " roadmaps, marked as shared."),
      table([head].concat(body_))
    ];
  }

  // Says plainly what an SL-A figure does and does not cover, and whether a
  // 62443-2-1 programme assessment stands behind it in this same project.
  function slProgrammeContext(instrument, opts) {
    var R = window.App.Report;
    if (!R || !R.programmeContextText) return [];
    if (!instrument || instrument.scoringFamily !== "capability-sl") return [];
    return [
      h2("What these Security Levels cover"),
      body(R.programmeContextText((opts && opts.companionInstrumentIds) || []))
    ];
  }

  function slScorecardDesignB(scored, taxonomy, radarBuf, instrument, opts) {
    // "Not yet" when every assessed FR is at target but some are still to
    // assess; the label then says how many were, so the tile is never a
    // yes drawn from part of the scope. The caption then names the question,
    // not the answer: "Target met (1 of 7 ...)" under "Not yet" read on its
    // own as a claim that the target was met.
    var tm=slTargetMet(scored), children=[];
    children.push(sbTilesRow([
      {t:tm.value,color:tm.color,label:tm.detail?"Overall target ("+tm.detail+")":"Target met",fill:tm.fill,size:tm.detail?32:40},
      {t:(scored.weakestFR?(scored.weakestFR.frId+" · "+S.formatSL(scored.weakestFR.conformantAchievedSL)):"-"),color:COLOR.navy,label:"Weakest FR",fill:"F5F8FA",size:22},
      {t:S.formatPct(scored.overallCloseness),color:COLOR.navy,label:"Closeness",fill:"F5F8FA",size:36},
      {t:String(scored.floorFlagCount),color:scored.floorFlagCount>0?COLOR.gap:COLOR.met,label:"Floor flags",fill:scored.floorFlagCount>0?COLOR.gapBg:COLOR.metBg,size:40}
    ]));
    if (firstTime("sl-scorecard-caption")) children.push(body("The headline is whether each Foundational Requirement meets its target Security Level. Closeness is shown for context, and there is no single grade.",{color:COLOR.muted,spacing:{before:180}}));
    children=children.concat(slCapabilityVector(scored,taxonomy,instrument));
    children=children.concat(slBlockingItems(scored,taxonomy,instrument));
    // What an SL-A does and does not cover is a statement about the whole
    // assessment, so the multi-zone report states it once up front and asks the
    // per-zone scorecards to leave it out rather than repeating it per zone.
    if (!(opts && opts.suppressProgrammeContext)) {
      children=children.concat(slProgrammeContext(instrument,opts));
    }
    children=children.concat(slScopeAccounting(scored,instrument));
    children=children.concat(slClosenessBars(scored,taxonomy));
    if(radarBuf){ children.push(h2("FR achievement vs target")); children.push(new window.docx.Paragraph({children:[new window.docx.ImageRun({data:radarBuf,transformation:{width:360,height:360}})]})); }
    children=children.concat(slRequirementHeatmap(scored,taxonomy,instrument));
    // The top of the SAME ranking the screen card shows, rather than a second
    // sort of its own: two differently-ordered "focus first" lists in one
    // report is the kind of thing a reader notices, and this way a consultant's
    // reordering carries into the document.
    var frs = window.App.Report.slPriorityFRs(scored, { engagement: (opts && opts.engagement) }).slice(0, 3);
    if(frs.length){ children.push(h2("Where to focus first"));
      frs.forEach(function(fr,i){ var taxFR=(taxonomy.frs||[]).filter(function(f){return f.id===fr.frId;})[0]||{name:""}; children.push(sbFocusCard(i+1, fr.frId+" "+taxFR.name, "achieved "+S.formatSL(fr.conformantAchievedSL)+" / target "+S.formatSL(fr.targetSL)+(fr.floorFlagCount>0?" · floor":""))); children.push(sbSpacer()); }); }
    return children;
  }

  // ---- NIS2 (nis2-conformance) ------------------------------------------
  // Self-contained chassis builder (no narrative pack): title page, document
  // control, the not-a-compliance caveat, exec summary, about + how-to-read,
  // results by NIS2 area (chart + table), and the gap roadmap in a landscape
  // section. Conformance / gap language only - never a compliance verdict.
  var NIS2_PORTRAIT_W = CAF_PORTRAIT_W;
  var NIS2_LANDSCAPE_W = CAF_LANDSCAPE_W;

  function nis2StateBand(state) {
    if (state === "achieved")  return { fill: COLOR.metBg,  text: COLOR.met  };
    if (state === "partially") return { fill: COLOR.nearBg, text: COLOR.near };
    if (state === "not")       return { fill: COLOR.gapBg,  text: COLOR.gap  };
    return { fill: COLOR.naBg, text: COLOR.muted };
  }
  function nis2StateLabelD(state, instrument) {
    var L = window.App.ScoringNIS2.stateLabelFor(state, instrument);
    if (L) return L;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    return "Not set";
  }

  function nis2TitlePage(engagement, instrument) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2400, valueW = NIS2_PORTRAIT_W - labelW;
    var rows = [
      ["Entity", e.clientName], ["Site / scope", e.siteName], ["Address", e.siteAddress],
      ["Consultant", e.consultant], ["Date", e.dateOfVisit]
    ].map(function (r) {
      return new TableRow({ children: [ cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }), cellDxa(r[1] || "", valueW) ] });
    });
    var out = [];
    var lg = titleLogoParagraph();
    if (lg) out.push(lg);
    return out.concat([
      new window.docx.Paragraph({ heading: window.docx.HeadingLevel.TITLE, children: [run(instrument.title)] }),
      body("EU NIS2 conformance and gap analysis: Directive (EU) 2022/2555", { style: "Caption" }),
      body("", { spacing: { after: 200 } }),
      fixedTable(rows, [labelW, valueW]),
      body("", { spacing: { after: 200 } })
    ]);
  }

  function nis2DocumentControl(engagement, instrument, opts) {
    var e = engagement.engagement || {};
    var TableRow = window.docx.TableRow;
    var labelW = 2700, valueW = NIS2_PORTRAIT_W - labelW;
    var rows = [
      ["Author", e.consultant], ["Document revision", e.documentRevision], ["Status", statusLabel(opts)], ["QA review by", e.qaReviewBy], ["Authorised by", e.authorisedBy],
      ["Issued to", e.issuedTo], ["Issued date", e.issuedDate], ["Confidentiality", e.confidentiality],
      ["Instrument", instrument.title], ["Framework", instrument.framework || "Directive (EU) 2022/2555"], ["Content version", instrument.contentVersion || ""]
    ].map(function (r) {
      return new TableRow({ children: [ cellDxa(body(r[0], { bold: true }), labelW, { fill: COLOR.subBg }), cellDxa(r[1] || "", valueW) ] });
    });
    return [ h1("Document control and confidentiality"), fixedTable(rows, [labelW, valueW]), body("", { spacing: { after: 200 } }) ];
  }

  var NIS2_CAVEAT_TEXT = "This is a readiness and gap analysis against the obligations of the EU NIS2 Directive (Directive (EU) 2022/2555). It records the consultant's judgement of each obligation as Achieved, Partially Achieved or Not Achieved; no single grade or pass mark is produced. It is not a determination of legal compliance with NIS2 or with the national law that transposes it. Confirm scope against the applicable national transposition.";
  function nis2CaveatBlock() {
    var TableRow = window.docx.TableRow, WidthType = window.docx.WidthType, Table = window.docx.Table, ShadingType = window.docx.ShadingType, TableCell = window.docx.TableCell;
    var tbl = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [ new TableRow({ cantSplit: true, children: [ new TableCell({
      children: [
        new window.docx.Paragraph({ style: "BodyText", children: [run("Conformance and gap analysis, not a compliance determination", { bold: true, color: COLOR.gap })] }),
        new window.docx.Paragraph({ style: "BodyText", children: [run(NIS2_CAVEAT_TEXT)] })
      ],
      shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
    }) ] }) ] });
    return [ h1("Important"), tbl, body("", { spacing: { after: 160 } }) ];
  }

  // Slot-substitution only - replaces {key} with slots[key]; never free-writes.
  function nis2Fill(tpl, slots) {
    return String(tpl == null ? "" : tpl).replace(/\{(\w+)\}/g, function (m, k) {
      return (slots[k] != null) ? String(slots[k]) : m;
    });
  }
  function nis2ListJoin(arr) {
    arr = (arr || []).filter(Boolean);
    if (arr.length <= 1) return arr[0] || "";
    if (arr.length === 2) return arr[0] + " and " + arr[1];
    return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
  }

  // Expanded executive summary, composed from the narrative pack:
  //  1 Verdict  2 Scope & profile  3 Gap shape  4 Regulatory stakes  5 Path forward & confidence.
  // boilerplate is verbatim; templates are slot-substituted; consultant blocks are
  // seeded with data-derived facts plus a marked placeholder. No legal conclusions are asserted.
  function nis2ExecutiveSummary(scored, instrument, engagement, narrative) {
    var N = window.App.ScoringNIS2;
    var ov = scored.overall, c = ov.counts;
    var children = [ h1n("1", "Executive summary") ];
    var es = narrative && narrative.executiveSummary;

    if (!es) {
      // Defensive fallback if the narrative pack is unavailable: concise prose, no bullets.
      children.push(body(instrument.framing || ""));
      children.push(body("Of " + ov.total + " applicable obligations, " + c.achieved + " were assessed as Achieved, " + c.partially + " as Partially Achieved and " + c.not + " as Not Achieved. " + ov.gaps + " are Partially or Not Achieved and form the prioritised roadmap in this report. The conformance figure of " + N.formatPct(ov.conformance) + " is shown for context only and is not a pass mark."));
      return children;
    }

    var e = engagement.engagement || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var phrases = T.verdictMaturityPhrases || {}, frags = T.gapConcentrationFragments || {};
    var clientName = e.clientName || "the entity";
    var worst = scored.worstCategories || [];
    var hasGaps = ov.gaps > 0;

    // Verdict maturity phrase - chosen deterministically from the profile.
    var a = c.achieved, p = c.partially, n = c.not, verdictMaturityPhrase;
    if (n >= a && n >= p && n > 0) verdictMaturityPhrase = phrases.substantial;
    else if (p >= a && p >= n && p > 0) verdictMaturityPhrase = phrases.recognised;
    else verdictMaturityPhrase = phrases.foundations;

    // Weakest area name(s) and a data-derived detail clause.
    var weakestAreaName, weakestAreaDetail;
    if (worst.length) {
      weakestAreaName = nis2ListJoin(worst.map(function (w) { return w.name; }));
      var w0 = worst[0], wc = w0.counts || {};
      weakestAreaDetail = ((wc.achieved || 0) === 0 && (wc.partially || 0) === 0 && (wc.not || 0) > 0)
        ? "all " + wc.not + " applicable obligations are Not Achieved"
        : w0.gaps + " of " + w0.total + " obligations are Partially or Not Achieved";
    } else {
      weakestAreaName = "no single area";
      weakestAreaDetail = "no obligations are Partially or Not Achieved";
    }

    // Gap-concentration sentence - composed from the per-area profile using the
    // pack's controlled phrases only.
    var partialAreas = [], absentAreas = [];
    (scored.byCategory || []).forEach(function (g) {
      var gc = g.counts || {};
      if ((g.total || 0) === 0 || ((gc.partially || 0) + (gc.not || 0)) === 0) return;
      if ((gc.achieved || 0) === 0 && (gc.partially || 0) === 0) absentAreas.push(g.name);
      else if ((gc.partially || 0) >= (gc.not || 0)) partialAreas.push(g.name);
      else absentAreas.push(g.name);
    });
    // Name areas individually when three or fewer share a bucket; otherwise
    // summarise by count (the per-area detail lives in the scorecard and results).
    function gapBucketSentence(names, fullClause) {
      if (names.length <= 3) return "In " + nis2ListJoin(names) + ", " + fullClause + ".";
      return "Across " + names.length + " areas, " + fullClause + ".";
    }
    var gcParts = [];
    if (partialAreas.length) gcParts.push(gapBucketSentence(partialAreas, frags.partialClause || ""));
    if (absentAreas.length) gcParts.push(gapBucketSentence(absentAreas, "the measures are " + (frags.absentClause || "")));
    var gapConcentrationSentence = gcParts.join(" ");

    // Auto top-priority hint - from the roadmap ordering, favouring incident-reporting
    // (statutory deadlines) and governance (management responsibility) items.
    var na = (scored.roadmap || []).filter(function (it) { return it.state === "not"; });
    if (!na.length) na = (scored.roadmap || []).slice();
    var rep = na.filter(function (it) { return it.categoryId === "REP"; });
    var gov = na.filter(function (it) { return it.categoryId === "GOV"; });
    var rest = na.filter(function (it) { return it.categoryId !== "REP" && it.categoryId !== "GOV"; });
    var hintParts = [];
    if (rep.length) hintParts.push("the incident-reporting obligations (" + rep.slice(0, 2).map(nis2Code).join(", ") + "), which carry statutory deadlines");
    if (gov.length) hintParts.push("the management governance obligations (" + gov.slice(0, 2).map(nis2Code).join(", ") + ")");
    rest.slice(0, Math.max(0, 2 - hintParts.length)).forEach(function (it) { hintParts.push(nis2Code(it) + " " + it.title); });
    var autoTopPriorityHint = hintParts.length ? nis2ListJoin(hintParts) : "the highest-priority items in the roadmap";

    var slots = {
      clientName: clientName, verdictMaturityPhrase: verdictMaturityPhrase,
      weakestAreaName: weakestAreaName, weakestAreaDetail: weakestAreaDetail,
      applicableCount: ov.total, achievedCount: c.achieved, partiallyCount: c.partially, notAchievedCount: c.not,
      gapConcentrationSentence: gapConcentrationSentence, gapTotal: ov.gaps,
      coveragePct: N.formatPct(ov.coverage), confidenceLabel: ov.confidenceLevel || "confidence not rated",
      conformancePct: pctText(N.formatPct(ov.conformance)), autoTopPriorityHint: autoTopPriorityHint
    };

    // 1. Verdict - leads with the finding, not the numbers.
    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots)));

    // 2. Scope and profile.
    children.push(body(nis2Fill(T.exec_scope, slots) + " " + nis2Fill(T.exec_profile, slots)));

    // 3. Gap shape (composed) + verbatim partial-vs-absent explainer.
    if (hasGaps) {
      children.push(body(nis2Fill(T.exec_gap_shape, slots)));
      if (B.exec_partial_vs_absent) children.push(body(B.exec_partial_vs_absent));
    }

    // 4. Regulatory stakes (verbatim) + data-seeded facts + consultant exposure.
    //    Consultant exposure uses the in-tool input when given, else the placeholder.
    if (B.regulatory_stakes) children.push(body(B.regulatory_stakes));
    var repNotAchieved = (scored.roadmap || []).some(function (it) { return it.categoryId === "REP" && it.state === "not"; });
    slots.repExposureClause = repNotAchieved ? (CB.consultant_exposure_rep_clause || "") : "";
    if (CB.consultant_exposure_seed) children.push(body(nis2Fill(CB.consultant_exposure_seed, slots)));
    var cls = rn.entityClassification, auth = (rn.competentAuthority || "").trim(), expo = (rn.regulatoryExposure || "").trim();
    if ((cls === "essential" || cls === "important") || auth || expo) {
      var sent = [];
      if (cls === "essential" || cls === "important") sent.push(nis2Fill(T.exec_exposure_classification, { clientName: clientName, entityClassificationLabel: cls }));
      if (auth) sent.push(nis2Fill(T.exec_exposure_authority, { competentAuthority: auth }));
      if (sent.length) children.push(body(sent.join(" ")));
      if (expo) children.push(body(expo));
    } else if (CB.consultant_exposure) {
      children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));
    }

    // 5. Path forward (+ tool priorities or seeded suggestion), confidence, caveat.
    var topPri = (rn.topPriorities || "").trim();
    children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
    if (topPri) children.push(body(topPri));
    else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    children.push(body(nis2Fill(T.exec_confidence, slots)));
    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));

    return children;
  }

  function nis2About(instrument, narrative) {
    var out = [ h1("About this assessment"), body(instrument.framing || "") ];
    var sc = seriesContextOf(instrument, narrative);
    if (sc) out.push(body(sc));
    out = out.concat(attributionParas(instrument, true));
    out.push(h1("How to read this report"));
    out.push(body("Each NIS2 obligation is judged Achieved, Partially Achieved or Not Achieved against full conformance with the Directive. The conformance percentage is for context only and is not a pass mark. Unknown reduces coverage and lowers confidence; Not applicable obligations are excluded. The gap roadmap lists every obligation that is Partially or Not Achieved, in priority order, with the recommended action."));
    return out;
  }

  function nis2ResultsSection(scored, chartBuf) {
    var N = window.App.ScoringNIS2;
    var TableRow = window.docx.TableRow;
    var children = [ h1n("2", "Results by NIS2 area") ];
    if (chartBuf) {
      children.push(new window.docx.Paragraph({ style: "BodyText", children: [ new window.docx.ImageRun({ data: chartBuf, transformation: { width: 540, height: Math.max(140, 28 * scored.byCategory.length + 30) } }) ] }));
      children.push(caption("Conformance profile by NIS2 area (achieved / partially / not achieved)."));
    }
    var headers = ["NIS2 area", "Achieved", "Partially", "Not", "Unknown", "N/A", "Applicable", "Conformance"];
    var widths = fitHeaderWidths(headers, CAF_LANDSCAPE_W);
    var rows = [ buildHeaderRow(headers, widths) ];
    scored.byCategory.forEach(function (g) {
      var cc = g.counts;
      rows.push(new TableRow({ children: [
        cellDxa(body(g.categoryId + " " + g.name, { bold: true }), widths[0]),
        cellDxa(String(cc.achieved),  widths[1], { fill: COLOR.metBg,  valign: "center" }),
        cellDxa(String(cc.partially), widths[2], { fill: COLOR.nearBg, valign: "center" }),
        cellDxa(String(cc.not),       widths[3], { fill: COLOR.gapBg,  valign: "center" }),
        cellDxa(String(cc.unknown),   widths[4], { valign: "center" }),
        cellDxa(String(cc.na),        widths[5], { valign: "center" }),
        cellDxa(String(g.total),      widths[6], { valign: "center" }),
        cellDxa(N.formatPct(g.conformance), widths[7], { valign: "center" })
      ] }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  // Draft IEC 62443 remediation guidance for an obligation/outcome, grouped by
  // strength (direct first). Reads the shared cross-reference table. Guidance
  // only - never authoritative equivalence; "" when no mapping exists.
  function crossRefGuidance(fromStandard, fromId) {
    var tbl = window.App.Data && window.App.Data.shared && window.App.Data.shared.crossReferences;
    var rows = !tbl ? [] : (Array.isArray(tbl) ? tbl : (tbl.rows || []));
    if (!rows.length) return "";
    var rank = { direct: 0, partial: 1, contextual: 2 };
    var idStrength = {}, order = [];
    rows.forEach(function (row) {
      if (row.fromStandard !== fromStandard || row.fromId !== fromId) return;
      // Consultant-draft remediation mappings only; regulator-published
      // "informative-reference" rows are surfaced separately (see informativeRefs).
      if (row.relationship === "informative-reference") return;
      var ids = Array.isArray(row.toIds) ? row.toIds : (row.toIds ? [row.toIds] : []);
      var s = rank[row.strength] != null ? row.strength : "partial";
      ids.forEach(function (id) {
        if (idStrength[id] === undefined) { idStrength[id] = s; order.push(id); }
        else if (rank[s] < rank[idStrength[id]]) idStrength[id] = s;
      });
    });
    if (!order.length) return "";
    var groups = { direct: [], partial: [], contextual: [] };
    order.forEach(function (id) { groups[idStrength[id]].push(id); });
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    var parts = [];
    ["direct", "partial", "contextual"].forEach(function (s) {
      if (groups[s].length) parts.push(cap(s) + ": " + groups[s].join(", "));
    });
    return parts.join("   ");
  }

  // What a reader sees for an obligation: its code ("A.1", "GOV.1"), the same
  // as the capture screen and the Excel tracker, never the internal id ("MA.1").
  function nis2Code(it) {
    return (it && (it.code || it.itemId)) || "";
  }
  // The key a NIS2 item is filed under in the cross-reference table: the
  // obligation's CODE, not its id, so a lookup by id found nothing and the
  // guidance line never printed. The NIS2 quick gap's area-level codes ("A",
  // "REP") have no rows of their own and correctly get none: the
  // obligation-level rows are not stretched to cover a whole area.
  var nis2XrefKey = nis2Code;

  // Regulator-published informative references (e.g. CAF for Aviation principles
  // cite 62443 parts in CAP1850 Annex B). Distinct from the consultant-draft
  // remediation mappings: relationship === "informative-reference" only.
  var XREF_NAMES = {
    "iec-62443-2-1-2024": "ISA/IEC 62443-2-1:2024", "iec-62443-2-1-2010": "ISA/IEC 62443-2-1:2010",
    "iec-62443-3-3": "ISA/IEC 62443-3-3", "iec-62443-4-1": "ISA/IEC 62443-4-1", "iec-62443-4-2": "ISA/IEC 62443-4-2"
  };
  function informativeRefs(fromStandard, fromId) {
    var tbl = window.App.Data && window.App.Data.shared && window.App.Data.shared.crossReferences;
    var rows = !tbl ? [] : (Array.isArray(tbl) ? tbl : (tbl.rows || []));
    var seen = {}, out = [];
    rows.forEach(function (row) {
      if (row.relationship !== "informative-reference") return;
      if (row.fromStandard !== fromStandard || row.fromId !== fromId) return;
      var ids = Array.isArray(row.toIds) ? row.toIds : (row.toIds ? [row.toIds] : []);
      ids.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(XREF_NAMES[id] || id); } });
    });
    return out.join(", ");
  }

  // A "Label: value" body paragraph. Empty values render an italic
  // "To be completed" placeholder so the consultant can see what is missing.
  // `where` (see tagPlaceholder) says where an empty value is filled in.
  function nis2Field(label, value, where) {
    var has = value != null && String(value).trim() !== "";
    var v = has ? run(String(value)) : noteRun("To be completed by the consultant", where, { italics: true });
    return new window.docx.Paragraph({
      style: "BodyText",
      indent: { left: 360 },
      spacing: { after: 60 },
      children: [ run(label + ": ", { bold: true }), v ]
    });
  }

  // Gap roadmap as prose (not a table): each gap is a Heading 2 followed by
  // labelled paragraphs, so long recommendations and impact statements read
  // naturally instead of being squeezed into narrow cells.
  function nis2RoadmapSection(scored, instrument) {
    var children = [ h1n("4", "Gap roadmap and recommendations") ];
    if (!scored.roadmap || scored.roadmap.length === 0) {
      children.push(body("No applicable obligation is Partially or Not Achieved."));
      return children;
    }
    children.push(body("Every applicable obligation assessed as Partially or Not Achieved, in the consultant's priority order."));
    scored.roadmap.forEach(function (it, i) {
      var band = nis2StateBand(it.state);
      var pb = nis2PriBandD(it.priorityBand);
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + nis2Code(it) + " " + it.title) ]
      }));
      var bandColor = it.priorityBand === "high" ? COLOR.gap
                    : it.priorityBand === "medium" ? COLOR.near
                    : it.priorityBand === "low" ? COLOR.navy : COLOR.muted;
      children.push(new window.docx.Paragraph({
        style: "BodyText",
        spacing: { after: 60 },
        children: [
          run("Current state: ", { bold: true }),
          run(nis2StateLabelD(it.state, instrument), { bold: true, color: band.text }),
          run("    Area: ", { bold: true }),
          run(it.categoryId + (it.articleRef ? "  " + it.articleRef : ""))
        ]
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true, color: bandColor }));
      children.push(new window.docx.Paragraph({
        style: "BodyText",
        indent: { left: 360 },
        spacing: { after: 60 },
        children: priChildren
      }));
      children.push(nis2Field("What the obligation requires", it.requirement || it.title));
      if (it.rationale) children.push(nis2Field("Why this matters", it.rationale));
      children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this obligation."));
      children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact")));
      children.push(nis2Field("Recommended action", it.action, planWhere(it, "action")));
      children.push(nis2Field("Owner", it.owner || "To be assigned"));
      var guide = crossRefGuidance("nis2", nis2XrefKey(it));
      if (guide) children.push(nis2Field("Relevant IEC 62443 guidance (draft, to verify)", guide));
    });
    return children;
  }
  function nis2PriBandD(b) {
    if (b === "high")   return { label: "High",   fill: COLOR.gapBg };
    if (b === "medium") return { label: "Medium", fill: COLOR.nearBg };
    if (b === "low")    return { label: "Low",    fill: COLOR.naBg };
    return { label: "", fill: null };
  }

  // Full obligation register: every obligation and its current state, including
  // those assessed as Achieved, so the report is a complete record rather than
  // just a list of gaps. Stays a table - the cells are short and scannable.
  function nis2RegisterSection(scored, instrument) {
    var TableRow = window.docx.TableRow;
    var children = [ h1n("3", "Full obligation register") ];
    children.push(body("Every obligation assessed, grouped by NIS2 area, including those assessed as Achieved."));
    var widths = [1600, 5600, 1700, 6498];   // sums to the full landscape content width (15398), matching the results table
    var headers = ["Area", "Obligation", "Current", "Captured evidence"];
    var rows = [ buildHeaderRow(headers, widths) ];
    (scored.perItem || []).forEach(function (it) {
      var band = nis2StateBand(it.state);
      rows.push(new TableRow({ children: [
        cellDxa(it.categoryId, widths[0], { valign: "center" }),
        cellDxa([ body(nis2Code(it) + "  " + it.title, { bold: true }) ].concat(it.articleRef ? [body(it.articleRef, { color: COLOR.muted, size: 16 })] : []), widths[1]),
        cellDxa(body(nis2StateLabelD(it.state, instrument), { bold: true, color: band.text }), widths[2], { fill: band.fill, valign: "center" }),
        cellDxa(it.evidence || "", widths[3])
      ] }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  function nis2Limitations(instrument) {
    return [ h1("Method and limitations"),
      body("Each NIS2 obligation was judged by the consultant against full conformance with the Directive, using the evidence available at the time. This assessment reports a conformance profile and a gap roadmap; it does not compute a single grade and is not a determination of legal compliance with NIS2 or its national transposition."),
      body("Items paraphrase the obligations of Directive (EU) 2022/2555 (Articles 20, 21 and 23); they are not verbatim Directive text and should be confirmed against the official text and the relevant national law.") ];
  }

  // NIS2 scorecard (front of body, no page title): conformance KPI tiles +
  // by-area stacked bars + where-to-focus, matching the other Design B reports.
  // NIS2 has no single grade; conformance % is shown for context only.
  function nis2ScorecardDesignB(scored, instrument) {
    var N = window.App.ScoringNIS2;
    var ov = scored.overall, cc = ov.counts, children = [];
    children.push(h1("Conformance at a glance"));
    children.push(sbTilesRow([
      { t: String(cc.achieved),  color: COLOR.met,  label: "Achieved",     fill: COLOR.metBg,  size: 44 },
      { t: String(cc.partially), color: COLOR.near, label: "Partially",    fill: COLOR.nearBg, size: 44 },
      { t: String(cc.not),       color: COLOR.gap,  label: "Not achieved", fill: COLOR.gapBg,  size: 44 },
      { t: N.formatPct(ov.conformance), color: COLOR.navy, label: "Conformance (context)", fill: "F5F8FA", size: 32 }
    ]));
    children.push(body("Conformance profile across " + ov.total + " applicable NIS2 obligations. NIS2 has no single grade or pass mark; the conformance figure of " + pctText(N.formatPct(ov.conformance)) + " is shown for context only and is not a determination of legal compliance. Exact per-area counts are given in Results by NIS2 area.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
    children.push(h2("Conformance profile by NIS2 area"));
    children.push(sbStackTable(scored.byCategory.map(function (g) {
      return sbStackRow(g.categoryId + " " + g.name, [
        { n: g.counts.achieved,  color: COLOR.met },
        { n: g.counts.partially, color: COLOR.near },
        { n: g.counts.not,       color: COLOR.gap },
        { n: g.counts.unknown,   color: COLOR.unknownSeg },
        { n: g.counts.na,        color: COLOR.naSeg }
      ]);
    })));
    children.push(sbLegend([
      { color: COLOR.met, label: "Achieved" },
      { color: COLOR.near, label: "Partially" },
      { color: COLOR.gap, label: "Not achieved" },
      { color: COLOR.unknownSeg, label: "Unknown" },
      { color: COLOR.naSeg, label: "N/A" }
    ]));
    var worst = (scored.worstCategories || []).slice(0, 3);
    if (worst.length) {
      children.push(h2("Where to focus first"));
      children.push(body("NIS2 areas with the most obligations still to address.", { color: COLOR.muted, spacing: { after: 40 } }));
      worst.forEach(function (w, i) {
        var cat = scored.byCategory.filter(function (b) { return b.categoryId === w.categoryId; })[0] || w;
        var gaps = cat.counts ? (cat.counts.partially + cat.counts.not) : null;
        var tag = gaps != null ? (gaps + " of " + cat.total + " with gaps") : "gaps to address";
        children.push(sbFocusCard(i + 1, (cat.categoryId || w.categoryId) + " " + (cat.name || w.name), tag));
        children.push(sbSpacer());
      });
    }
    return children;
  }

  // ---- risk-appetite-coherence -------------------------------------------
  // Board-facing and short. The plot is the document's reason to exist, so it
  // sits on the first content page under the verdict, and the rest is the
  // evidence for the two positions. No grade table, no percentages: there is
  // nothing here to total up.
  function raTitleCase(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }

  // Whether the executive summary already carries the readings that would
  // otherwise open the body sections (the exposure drivers, the acceptance
  // spotlight, the assessor's reasoning, the direction since last time). It
  // does whenever there is a verdict to summarise and the consultant has not
  // hidden the summary; then each is said once, in the summary, and the body
  // sections go straight to their own content.
  function raSummaryCarries(scored, engagement) {
    var key = scored && scored.complete ? ((scored.verdict && scored.verdict.key) || "incomplete") : "incomplete";
    if (key === "incomplete") return false;
    var custom = (engagement && engagement.reportCustom) || {};
    return !(custom["executive-summary"] && custom["executive-summary"].hidden);
  }

  function raVerdictSection(scored, N, slots, num, summaryCarries) {
    var v = scored.verdict || {};
    var VN = N.verdict_narrative || {};
    var kids = [ h1n(num, "The verdict") ];
    kids.push(new window.docx.Paragraph({
      spacing: { after: 160 },
      children: [ run(raReport().riskAppetiteVerdictLabel(scored), { bold: true, size: 30 }) ]
    }));
    kids.push(body([
      run("Inherent exposure: ", { bold: true }),
      run((scored.exposure.bandLabel || "not set") + ".   "),
      run("Apparent appetite: ", { bold: true }),
      run(raReport().riskAppetiteHeadlineValue(scored) + ".")
    ]));
    // The pack's explanation, written for a board, not the scoring profile's
    // rule text (which ends "Named worst-first in the report").
    var explanation = VN["explanation_" + v.key] || v.explanation;
    var leanS = raReport().riskAppetiteLeanSentence(scored, N, slots);
    if (explanation || leanS) kids.push(body([explanation, leanS].filter(Boolean).join(" ")));
    // The assessor's reasoning, and nothing about the tool. This document must
    // never say the consultant agreed or disagreed with a computed default, nor
    // what the band arithmetic would otherwise have concluded - the client is
    // paying for the consultant's judgement, not a commentary on software. The
    // computed read stays on the assessor's-read capture page and in the
    // project file.
    if (v.overridden) {
      // Printed once: in the executive summary when that carries it.
      if (summaryCarries) {
        // nothing: the summary states the reasoning
      } else if (v.rationale) {
        kids.push(body([ run(VN.reasoning_label || "Assessor's reasoning: ", { bold: true }), run(v.rationale) ]));
      } else {
        kids.push(placeholderPara(VN.reasoning_missing || "The reasoning behind this verdict has not been recorded yet.", { kind: "raVerdict" }));
      }
    } else if (v.warrantedBand && VN["plain_terms_" + v.key]) {
      // Same sentence as the screen, from the same pack and the same slots.
      kids.push(body([ run("In plain terms: ", { bold: true }), run(raReport().fill(VN["plain_terms_" + v.key], slots)) ]));
    }
    return kids;
  }

  function raReport() { return window.App.Report; }

  // Change since the previous assessment, for risk appetite. Not the generic
  // progressSection: that one reports items as improved or regressed, and
  // neither scale here has a good end. Items are shown as having moved, with
  // the direction named, and the only judgement is closer to proportion or not.
  function raProgressSection(progress, N, slots, next, summaryCarries) {
    var pt = progress && raReport().riskAppetiteProgressText(progress, N, slots);
    if (!pt) return [];
    var out = [ h1n(next(), pt.heading) ];
    if (pt.intro) out.push(body(pt.intro));
    if (pt.verdictLine) out.push(body(pt.verdictLine));
    // The direction is the summary's one sentence on change; not repeated here.
    if (pt.direction && !summaryCarries) out.push(body(pt.direction));
    if (pt.moved) out.push(body(pt.moved));
    var moves = (progress.movements || []).filter(function (m) { return m.change === "moved"; });
    if (moves.length) {
      var W = [900, 3226, 1500, 1200, 1200, 1000];   // 9026 dxa, A4 portrait
      var rows = [ buildHeaderRow(["Ref", "Item", "Section", "Previous", "Current", "Moved"], W) ];
      moves.forEach(function (m) {
        rows.push(new window.docx.TableRow({ children: [
          cellDxa(m.code, W[0]), cellDxa(m.label, W[1]), cellDxa(m.group || "", W[2]),
          cellDxa(m.prev, W[3]), cellDxa(m.curr, W[4]), cellDxa(m.direction || "", W[5])
        ] }));
      });
      out.push(fixedTable(rows, W));
    }
    if (progress.versionMismatch) {
      out.push(caption("The previous assessment was captured against instrument content version " +
        progress.baselineContentVersion + "; the current version is " + progress.currentContentVersion +
        ". Items renamed or removed since are not compared."));
    }
    return out;
  }

  // A paragraph that ends in a [bracketed] consultant prompt: the prose prints
  // normally and the prompt prints red, so a document that went out without
  // the prompt being dealt with says so on its face.
  function bodyWithPrompt(text, where) {
    var s = String(text || "");
    var i = s.indexOf("[");
    if (i < 0) return [ body(s) ];
    var prompt = placeholderPara(i === 0 ? s : s.slice(i).trim(), where);
    // Part of the wording that opens its section, so a consultant who rewrites
    // that wording replaces the prompt with it.
    prompt.__isBody = true;
    return i === 0 ? [ prompt ] : [ body(s.slice(0, i).trim()), prompt ];
  }

  // How the assessment was run: the consultant's own description when they
  // have written one (reportNarrative.method), else the pack's standing one,
  // whose closing [prompt] to confirm or adjust it prints red until they do.
  function methodParas(text, engagement) {
    var own = String(((engagement && engagement.reportNarrative) || {}).method || "").trim();
    if (own) return own.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return body(l); });
    if (!text) return [];
    return bodyWithPrompt(text, NARR_METHOD);
  }

  // Shaded caveat box, the same treatment every other family's document gives
  // its statement of what the report is not.
  function raCaveatBox(N, instrument) {
    var B = N.boilerplate || {};
    var text = B.not_measurement_caveat || (instrument.criticalCaveats || [])[0];
    if (!text) return [];
    var d = window.docx;
    return [ new d.Table({
      width: { size: 100, type: d.WidthType.PERCENTAGE },
      rows: [ new d.TableRow({ cantSplit: true, children: [ new d.TableCell({
        children: [
          new d.Paragraph({ style: "BodyText", children: [run(B.not_measurement_caveat_title || "A characterisation, not a measurement", { bold: true, color: COLOR.gap })] }),
          new d.Paragraph({ style: "BodyText", children: [run(text)] })
        ],
        shading: { type: d.ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
      }) ] }) ]
    }), body("", { spacing: { after: 160 } }) ];
  }

  // The executive summary, composed from the pack by filling slots, in the
  // order a board paper reads: what we found, how we got there, what the
  // technical review added, the assessor's reasoning, why it matters, the
  // consultant's own two paragraphs, then coverage and what this is not.
  function raExecutiveSummary(scored, N, slots, engagement, num, progress) {
    var ES = N.executiveSummary || {};
    var T = ES.templates || {}, B = ES.boilerplate || {}, CB = ES.consultantBlocks || {};
    var NB = N.boilerplate || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var v = scored.verdict || {};
    var key = scored.complete ? (v.key || "incomplete") : "incomplete";
    var fill = function (t) { return raReport().fill(t, slots); };
    var out = [ h1n(num, "Executive summary") ];

    // A board summary: the findings, the assessor's reasoning, the
    // consultant's two paragraphs, the decision and coverage. It ran to about
    // 870 words; the standing paragraphs (what the report is, what each
    // position takes account of, how the fit works, why the verdict matters,
    // what this is not) now sit in the body sections they explain, so the
    // detail is all still in the document, just not in front of the board.
    // See raBodyExtras for where each one went.

    if (key === "incomplete") {
      if (T.exec_verdict_incomplete) out.push(body(fill(T.exec_verdict_incomplete)));
      var todo = ((N.next_steps_scaffold || {}).incomplete || [])[0];
      if (todo) out.push(placeholderPara(todo, { kind: "incomplete" }));
      return out;
    }

    // The verdict, carrying both appetite readings where the technical review
    // differs, so the top line is as strong as the argument beneath it. (The
    // body's stated-against-revealed section still sets out the detail.)
    var opener = raReport().riskAppetiteVerdictOpener(scored, N, slots);
    if (opener) out.push(body(opener));
    // Since the previous assessment, in one sentence: the only direction here
    // that means something. The detail has its own section.
    var pgt = raReport().riskAppetiteProgressText(progress, N, slots);
    if (pgt && pgt.direction) out.push(body(pgt.direction));

    // Exposure: why the rating is what it is, where that needs saying.
    var drivers = raReport().riskAppetiteExposureDrivers(scored, N, slots);
    if (drivers) out.push(body(drivers));

    // Appetite: the reading that explains the drift, where there is one.
    var spots = raReport().riskAppetiteSpotlights(scored, N, slots);
    if (spots.length) out.push(body(spots.join(" ")));

    if (v.overridden) {
      out.push(v.rationale ? body(v.rationale)
        : placeholderPara((N.verdict_narrative || {}).reasoning_missing || "The reasoning behind this verdict has not been recorded yet.", { kind: "raVerdict" }));
    }

    var context = String(rn.regulatoryExposure || "").trim();
    if (context) out.push(body(context));
    else if (CB.consultant_context_placeholder) out.push(placeholderPara(CB.consultant_context_placeholder, NARR_EXPOSURE));

    var lead = CB["consultant_decision_lead_" + key];
    if (lead) out.push(body(lead));
    var decision = String(rn.topPriorities || "").trim();
    if (decision) out.push(body(decision));
    else if (CB.consultant_decision_placeholder) out.push(placeholderPara(CB.consultant_decision_placeholder, NARR_PRIORITIES));

    if (T.exec_coverage) {
      // Included, the review is a clause of the coverage sentence; excluded, it is
      // its own sentence at the end, so "One could not be established" follows
      // straight on from the areas it refers to.
      var techClause = scored.techIncluded ? (T.exec_coverage_tech_included || "") : "";
      var techAfter = scored.techIncluded ? "" : String(T.exec_coverage_tech_excluded || "").replace(/^[.\s]+/, "");
      var cslots = {}; Object.keys(slots).forEach(function (k) { cslots[k] = slots[k]; });
      cslots.techClause = techClause;
      var allDone = slots.totalCount > 0 && slots.answeredCount === slots.totalCount && T.exec_coverage_all;
      var covText = raReport().fill(allDone ? T.exec_coverage_all : T.exec_coverage, cslots);
      // Readings that could not be established, said rather than hidden.
      var neN = (scored.coverage && scored.coverage.notEstablished) || 0;
      if (neN && T.exec_coverage_not_established) {
        covText += " " + raReport().fill(T.exec_coverage_not_established,
          { countWord: raReport().numberWord(neN), isAre: neN === 1 ? "is" : "are" });
      }
      if (techAfter) covText += " " + techAfter;
      out.push(body(covText));
    }
    // What this is not: the caveat box directly under the summary says it, and
    // the fuller wording is in Method and limitations.
    return out;
  }

  // The standing paragraphs that used to fill the executive summary, and the
  // body section each now belongs in. Returned as text; the builder places them.
  function raBodyExtras(scored, N, slots) {
    var ES = N.executiveSummary || {};
    var T = ES.templates || {}, B = ES.boilerplate || {};
    var NB = N.boilerplate || {};
    var key = (scored.complete && scored.verdict && scored.verdict.key) || "incomplete";
    var fill = function (t) { return t ? raReport().fill(t, slots) : ""; };
    return {
      about: NB.report_intro || "",                                                  // About this assessment, first
      exposure: fill(slots.sectorName ? T.exec_exposure : T.exec_exposure_nosector), // exposure section
      appetite: fill(T.exec_appetite),                                               // appetite section
      howToRead: B.exec_fit_method || "",                                            // How to read
      verdict: B["stakes_" + key] || "",                                             // the verdict section
      limitations: B.not_determination || ""                                         // Method and limitations
    };
  }

  function raAxisSection(axis, num, heading, scored, N, slots, summaryCarries) {
    var kids = [ h1n(num, heading) ];
    // As on screen: no narration of where the band came from. Every band in
    // this document is the assessor's; which ones happened to match a scaffold
    // is not the client's concern and would only invite the wrong argument.
    kids.push(body([ run((axis.bandLabel || "Not set"), { bold: true }) ]));
    if (axis.meaning) kids.push(body(axis.meaning));
    // The section's own definition (axis.meaning) says what the position takes
    // account of, so the summary's "takes account of" sentence is not printed
    // here as well. The sector, which only that sentence named, gets its line.
    if (axis.axis === "exposure" && axis.sectorName) {
      kids.push(body("Sector: " + axis.sectorName + "."));
    }
    // Above the table, so the answer to "why two Highs under a Severe
    // headline?" is read before the question occurs. Both of these open the
    // executive summary as well, so they are printed here only when the
    // summary does not carry them.
    if (N && axis.axis === "exposure" && !summaryCarries) {
      var drivers = raReport().riskAppetiteExposureDrivers(scored, N, slots);
      if (drivers) kids.push(body(drivers));
    }
    if (N && axis.axis === "appetite" && !summaryCarries) {
      raReport().riskAppetiteSpotlights(scored, N, slots).forEach(function (t) { kids.push(body(t)); });
    }
    // Technical readings: say which were managed constraints rather than
    // choices, and add a column showing how each was treated.
    var isTech = !!(N && axis.axis === "appetite-revealed");
    if (isTech) {
      raReport().riskAppetiteRevealedNotes(scored, N, slots).forEach(function (t) { kids.push(body(t)); });
    } else if (N) {
      var ne = raReport().riskAppetiteNotEstablishedNote(axis.section, N, slots, raReport().riskAppetiteKindOf(axis.axis));
      if (ne) kids.push(body(ne));
    }
    var items = (axis.section && axis.section.items) || [];
    if (items.length) {
      // Same total width either way; the technical table gives up some of the
      // characterisation column to "Treated as".
      var W = isTech ? { code: 1500, band: 1300, treated: 1700, text: 4580 }
                     : { code: 1500, band: 1600, treated: 0, text: 5980 };
      var head = [ headerCellDxa("Item", W.code), headerCellDxa("Band", W.band) ];
      if (isTech) head.push(headerCellDxa("Treated as", W.treated));
      head.push(headerCellDxa("Characterisation", W.text));
      var rows = [ new window.docx.TableRow({ tableHeader: true, children: head }) ];
      items.forEach(function (it) {
        var cells = [
          cellDxa(body([run(it.code, { bold: true }), run("\n" + it.title)]), W.code),
          cellDxa(body(it.notEstablished ? "Not established" : (it.bandLabel || "-")), W.band)
        ];
        if (isTech) cells.push(cellDxa(body((it.band || it.notEstablished) ? raReport().riskAppetiteTreatedAs(N, it) : "-"), W.treated));
        // Evidence under the characterisation, in the same cell and labelled:
        // what was found, then what it rests on.
        var charCell = [body(it.characterisation || "")];
        if (it.evidence) charCell.push(body([run("Evidence: ", { bold: true, color: COLOR.muted }), run(it.evidence, { color: COLOR.muted })]));
        cells.push(cellDxa(charCell, W.text));
        rows.push(new window.docx.TableRow({ children: cells }));
      });
      kids.push(new window.docx.Table({
        rows: rows,
        width: { size: W.code + W.band + W.treated + W.text, type: window.docx.WidthType.DXA },
        layout: window.docx.TableLayoutType.FIXED
      }));
    }
    return kids;
  }

  function buildRiskAppetiteDoc(engagement, instrument, profile, narrative, opts, callback) {
    var RA = window.App.ScoringRiskAppetite;
    var setup = (opts && opts.riskAppetiteSetup) || RA.defaultSetup(instrument);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var responses = (engagement.responses || []).filter(function (r) { return r.targetId === target.id; });
    var scored = RA.scoreSite(instrument, profile, responses, setup);
    var N = raReport().riskAppetiteNarrative(narrative, instrument);
    var NB = N.boilerplate || {};
    var slots = raReport().riskAppetiteSlots(scored, engagement);

    // Rasterise the plot the same way every other chart is embedded.
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    // The previous visit, where there is one, as a hollow marker and an arrow.
    var pfit = opts && opts.progress && opts.progress.fit;
    var prevPos = pfit && pfit.prev && pfit.prev.complete
      ? { exposureRank: pfit.prev.exposureRank, appetiteRank: pfit.prev.appetiteRank } : null;
    var svg = window.App.Charts.exposureAppetitePlot(scored, { cell: 74, previous: prevPos });
    holder.appendChild(svg);
    rasterise(svg, opts, function (blob) {
      try { document.body.removeChild(holder); } catch (_) {}
      blobBuf(blob, function (buf) {
        try {
          var coverChildren = coverDesignB(engagement, instrument, {
            subLine: "Inherent exposure against apparent risk appetite"
          });

          // Numbered findings run consecutively; the standing text after them
          // is unnumbered, as in the other families' documents.
          var sec = 0;
          var next = function () { sec += 1; return String(sec); };

          var front = []
            .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()]);

          // Executive summary, then the caveat box directly under it: the worst
          // outcome for this document is a board reading a characterisation as
          // a measurement, so what it is not sits beside what it says.
          front = front
            .concat(raExecutiveSummary(scored, N, slots, engagement, next(), opts && opts.progress))
            .concat(raCaveatBox(N, instrument))
            .concat([pageBreakPara()]);

          // Paragraphs moved out of the executive summary into their sections.
          var extras = raBodyExtras(scored, N, slots);
          var summaryCarries = raSummaryCarries(scored, engagement);
          front = front.concat(raVerdictSection(scored, N, slots, next(), summaryCarries));
          // The general paragraph on what this kind of verdict means in
          // practice is the same for every client with the verdict, so it is
          // the consultant's choice to include it (off unless switched on).
          var rnOpt = (engagement && engagement.reportNarrative) || {};
          if (extras.verdict && rnOpt.includeVerdictContext === true) front.push(body(extras.verdict));

          // The plot.
          if (buf) {
            front.push(new window.docx.Paragraph({
              spacing: { before: 160, after: 80 },
              children: [ new window.docx.ImageRun({ data: buf, transformation: { width: 600, height: 380 } }) ]
            }));
            if (NB.chart_note) front.push(body(NB.chart_note, { italics: true }));
            var ppt = prevPos && raReport().riskAppetiteProgressText(opts.progress, N, slots);
            if (ppt && ppt.chartNote) front.push(body(ppt.chartNote, { italics: true }));
          }

          if (scored.statedVsRevealed) {
            front.push(h1n(next(), "Stated against revealed appetite"));
            front.push(body([
              run("Stated " + raTitleCase(scored.statedVsRevealed.statedBand) +
                  ", revealed " + raTitleCase(scored.statedVsRevealed.revealedBand), { bold: true }),
              run(scored.statedVsRevealed.material ? "   (a material gap)" : "")
            ]));
            front.push(body(raReport().riskAppetiteRevealedText(scored, N, slots)));
          }

          var back = raAxisSection(scored.exposure, next(), "Inherent risk exposure", scored, N, slots, summaryCarries)
            .concat(raAxisSection(scored.appetite, next(), "Apparent risk appetite", scored, N, slots, summaryCarries));
          // Shown even when no technical reading counted, so the document says
          // they were constraints instead of the review silently disappearing.
          var techAxis = raReport().riskAppetiteTechAxis(scored);
          if (techAxis) {
            back = back.concat(raAxisSection(techAxis, next(), "Revealed appetite (technical review)", scored, N, slots));
          }

          // Change since the previous visit, where there is one. Its own section,
          // after the two positions it describes.
          back = back.concat(raProgressSection(opts && opts.progress, N, slots, next, summaryCarries));

          if (NB.how_to_read || extras.howToRead) {
            back.push(h1("How to read this report"));
            [NB.how_to_read, extras.howToRead].filter(Boolean).forEach(function (t) { back.push(body(t)); });
          }

          back.push(h1("About this assessment"));
          [extras.about, NB.about_instrument || instrument.framing, NB.series_context, NB.bands_source]
            .filter(Boolean).forEach(function (t) { back.push(body(t)); });
          back = back.concat(attributionParas(instrument, true));

          back = back.concat(slGlossary(instrument, null, N, engagement));

          if (NB.method || NB.limitations || extras.limitations) {
            back.push(h1("Method and limitations"));
            // The technical review is described only where it was part of the
            // engagement, ahead of the consultant's bracketed prompt.
            var methodText = NB.method || "";
            if (methodText && scored.techIncluded && NB.method_technical) {
              var cut = methodText.indexOf(" [");
              methodText = cut < 0 ? methodText + " " + NB.method_technical
                : methodText.slice(0, cut) + " " + NB.method_technical + methodText.slice(cut);
            }
            back = back.concat(methodParas(methodText, engagement));
            if (NB.limitations) back.push(body(NB.limitations));
            if (extras.limitations) back.push(body(extras.limitations));
          }

          back = back
            .concat(basisOfAssessmentSection(engagement))
            .concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

          var PO = docPO();
          var coverProps = { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } };
          var doc = makeDoc(engagement, {
            creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
            title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
            description: "Inherent exposure against apparent risk appetite",
            styles: buildStyles(),
            sections: [
              { properties: coverProps, children: coverChildren }
            ].concat(bodySectionsFromSegments(
              brandHeaders(), brandFootersDoc(instrument, engagement), [
              { land: false, children: front },
              { land: false, children: back }
            ]))
          }, opts);
          packDoc(doc, opts, callback);
        } catch (e) { callback(e); }
      });
    });
  }

  function buildNIS2Doc(engagement, instrument, profile, narrative, opts, callback) {
    var scoredAll = window.App.ScoringNIS2.scoreEngagement(engagement, instrument, profile);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

    var chartRows = scored.byCategory.map(function (g) {
      return { label: g.categoryId + " " + g.name, achieved: g.counts.achieved, partially: g.counts.partially, not: g.counts.not };
    });
    var holder = document.createElement("div");
    holder.style.position = "absolute"; holder.style.left = "-10000px";
    document.body.appendChild(holder);
    var svg = window.App.Charts.cafStateBars(chartRows, { width: 620, labelWidth: 300 });
    holder.appendChild(svg);
    rasterise(svg, opts, function (blob) {
      try { document.body.removeChild(holder); } catch (_) {}
      blobBuf(blob, function (buf) {
        try {
          var coverChildren = coverDesignB(engagement, instrument, { subLine: "EU NIS2 readiness  \u00b7  Directive (EU) 2022/2555" });
          var portraitFront = []
            .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
            .concat(nis2ExecutiveSummary(scored, instrument, engagement, narrative))
            .concat(execSummaryAddenda(engagement, opts.progress))
            .concat(nis2CaveatBlock())
            .concat([pageBreakPara()])
            .concat(nis2ScorecardDesignB(scored, instrument))
            .concat([pageBreakPara()])
            .concat(nis2About(instrument, narrative))
            .concat(slGlossary(instrument, null, narrative, engagement))
          var landscapeResults = nis2ResultsSection(scored, null);
          var landscapeRegister = nis2RegisterSection(scored, instrument);
          var portraitBack = nis2Limitations(instrument).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

          var PO = (window.docx && window.docx.PageOrientation) || { PORTRAIT: "portrait", LANDSCAPE: "landscape" };
          var A4_W = 11906, A4_H = 16838;
          var portraitProps = { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };
          var landscapeProps = { page: { size: { width: A4_W, height: A4_H, orientation: PO.LANDSCAPE }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } };

          var coverProps = { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } };
          function branded(props, kids) {
            return { properties: props, headers: brandHeaders(), footers: brandFootersDoc(instrument, engagement), children: kids };
          }
          var sections = [
            { properties: coverProps, children: coverChildren },
            branded(portraitProps, portraitFront),
            branded(landscapeProps, landscapeResults),
            branded(landscapeProps, landscapeRegister)
          ];
          // Gap roadmap reads as prose, so it goes in a portrait section; only
          // include it when there is at least one gap to report.
          if (scored.roadmap && scored.roadmap.length > 0) {
            sections.push(branded(portraitProps, nis2RoadmapSection(scored, instrument)));
          }
          if (opts.progress) {
            sections.push(branded(portraitProps, progressSection(opts.progress)));
          }
          var basisKids = basisOfAssessmentSection(engagement);
          if (basisKids.length) {
            sections.push(branded(portraitProps, basisKids));
          }
          sections.push(branded(portraitProps, portraitBack));

          var doc = makeDoc(engagement, {
            creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
            title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
            description: "EU NIS2 conformance and gap analysis",
            styles: buildStyles(),
            sections: sections
          }, opts);
          packDoc(doc, opts, callback);
        } catch (e) { callback(e); }
      });
    });
  }

  // ---- csms-conformance (ISA/IEC 62443-2-1:2010) ----------------------------
  // Portrait flow modelled on the ML report: composed exec summary, a not-a-
  // certification caveat, an own-page conformance scorecard, results by category
  // and element group, and a prose gap roadmap. Four conformance states.
  function csmsExecutiveSummary(scored, instrument, engagement, narrative) {
    var C = window.App.ScoringCSMS;
    var ov = scored.overall, c = ov.counts;
    var children = [ h1n("1", "Executive summary") ];
    var es = narrative && narrative.executiveSummary;
    if (!es) {
      children.push(body((narrative && narrative.boilerplate && narrative.boilerplate.report_intro) || "Conformance assessment of the CSMS against ISA/IEC 62443-2-1:2010."));
      children.push(bullet("Conformance profile: " + c.inPlace + " In place, " + c.largely + " Largely, " + c.partially + " Partially, " + c.notInPlace + " Not in place, of " + ov.total + " applicable elements."));
      var worstB = (scored.worstCategories || []).map(function (w) { return w.name; });
      if (worstB.length) children.push(bullet("Weakest category: " + worstB.join("; ") + "."));
      children.push(bullet("Coverage " + C.formatPct(ov.coverage) + (ov.confidenceLevel ? " (" + ov.confidenceLevel + ")" : "") + "; conformance index " + C.formatPct(ov.conformance) + " (context only)."));
      return children;
    }
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var T = es.templates || {}, B = es.boilerplate || {}, CB = es.consultantBlocks || {};
    var phrases = T.verdictPhrases || {}, gcFrags = T.gapConcentrationFragments || {};
    var clientName = e.clientName || "the organisation";
    var hasGaps = ov.gaps > 0;
    var verdictPhrase = (c.notInPlace > 0 && c.notInPlace >= c.partially && c.notInPlace >= c.largely && c.notInPlace >= c.inPlace)
      ? phrases.substantial : (hasGaps ? phrases.recognised : phrases.strong);
    var worst = scored.worstCategories || [];
    var weakestCategoryName = worst.length ? nis2ListJoin(worst.map(function (w) { return w.name; })) : "no single category";
    var w0 = worst[0];
    var weakestDetail = w0 ? (", where " + w0.gaps + " of " + w0.total + " elements are Not in place or Partially in place") : "";
    var gcParts = [];
    if (c.notInPlace > 0) gcParts.push(nis2Fill(gcFrags.notInPlace, { notInPlace: c.notInPlace }));
    if (c.partially > 0) gcParts.push(nis2Fill(gcFrags.partially, { partially: c.partially }));
    var gapConcentrationSentence = gcParts.join(" ");
    var topHint = (scored.roadmap || []).slice(0, 2).map(function (r) { return r.code + " " + r.title; });
    var autoTopPriorityHint = topHint.length ? nis2ListJoin(topHint) : "the highest-priority elements in the roadmap";
    var confidenceLabel = ov.confidenceLevel ? String(ov.confidenceLevel).toLowerCase() : (ov.lowCoverage ? "low confidence" : "confidence not rated");
    var slots = {
      clientName: clientName, verdictPhrase: verdictPhrase,
      weakestCategoryName: weakestCategoryName, weakestDetail: weakestDetail,
      answeredCount: ov.answered, inPlace: c.inPlace, largely: c.largely, partially: c.partially, notInPlace: c.notInPlace,
      gapConcentrationSentence: gapConcentrationSentence,
      coveragePct: C.formatPct(ov.coverage), conformancePct: pctText(C.formatPct(ov.conformance)),
      confidenceLabel: confidenceLabel, autoTopPriorityHint: autoTopPriorityHint
    };
    children.push(body(nis2Fill(hasGaps ? T.exec_verdict : T.exec_verdict_nogaps, slots)));
    children.push(body(nis2Fill(T.exec_scope, slots) + " " + nis2Fill(T.exec_profile, slots)));
    if (hasGaps && gapConcentrationSentence) children.push(body(nis2Fill(T.exec_gap_shape, slots)));
    if (B.exec_conformance_method) children.push(body(B.exec_conformance_method));
    if (B.stakes) children.push(body(B.stakes));
    slots.floorExposureClause = c.notInPlace > 0 ? (CB.consultant_exposure_floor_clause || "") : "";
    if (CB.consultant_exposure_seed) children.push(body(nis2Fill(CB.consultant_exposure_seed, slots)));
    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else if (CB.consultant_exposure) children.push(placeholderPara(CB.consultant_exposure, NARR_EXPOSURE));
    if (hasGaps) {
      var topPri = (rn.topPriorities || "").trim();
      children.push(body(nis2Fill(T.exec_path_forward, slots) + (topPri ? "" : " " + nis2Fill(CB.consultant_top_priorities_seed, slots))));
      if (topPri) children.push(body(topPri));
      else if (CB.consultant_top_priorities_placeholder) children.push(placeholderPara(CB.consultant_top_priorities_placeholder, NARR_PRIORITIES));
    }
    children.push(body(nis2Fill(T.exec_confidence, slots)));
    var ndText = withoutCaveatRepeats(B.not_determination, typeof narrative !== "undefined" ? narrative : null); if (ndText) children.push(body(ndText));
    return children;
  }

  function csmsNotCertificationCaveatBlock(narrative) {
    var caveat = narrative && narrative.boilerplate && narrative.boilerplate.not_certification_caveat;
    if (!caveat) return [];
    var TableRow = window.docx.TableRow, WidthType = window.docx.WidthType, Table = window.docx.Table, ShadingType = window.docx.ShadingType, TableCell = window.docx.TableCell;
    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [ new TableCell({
        children: [
          new window.docx.Paragraph({ style: "BodyText", children: [run("Conformance profile, not a single grade or a certification", { bold: true, color: COLOR.gap })] }),
          new window.docx.Paragraph({ style: "BodyText", children: [run(caveat)] })
        ],
        shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
      }) ] }) ]
    });
    return [ tbl, body("", { spacing: { after: 160 } }) ];
  }

  function csmsScorecardDesignB(scored) {
    var C = window.App.ScoringCSMS;
    var ov = scored.overall, cc = ov.counts, children = [];
    children.push(h1("Conformance at a glance"));
    children.push(sbTilesRow([
      { t: String(cc.inPlace),    color: COLOR.met,  label: "In place",     fill: COLOR.metBg,  size: 44 },
      { t: String(cc.largely),    color: COLOR.blue, label: "Largely",      fill: "EAF0FB",     size: 44 },
      { t: String(cc.partially),  color: COLOR.near, label: "Partially",    fill: COLOR.nearBg, size: 44 },
      { t: String(cc.notInPlace), color: COLOR.gap,  label: "Not in place", fill: COLOR.gapBg,  size: 44 }
    ]));
    children.push(body("Conformance profile across " + ov.total + " applicable CSMS elements. ISA/IEC 62443-2-1:2010 produces no single grade; the conformance index of " + pctText(C.formatPct(ov.conformance)) + " is shown for context only.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));
    children.push(h2("Conformance profile by category"));
    children.push(sbStackTable(scored.byCategory.map(function (g) {
      return sbStackRow(g.name, [
        { n: g.counts.inPlace,    color: COLOR.met },
        { n: g.counts.largely,    color: COLOR.blue },
        { n: g.counts.partially,  color: COLOR.near },
        { n: g.counts.notInPlace, color: COLOR.gap },
        { n: g.counts.unknown,    color: COLOR.unknownSeg },
        { n: g.counts.na,         color: COLOR.naSeg }
      ]);
    })));
    children.push(sbLegend([
      { color: COLOR.met, label: "In place" },
      { color: COLOR.blue, label: "Largely" },
      { color: COLOR.near, label: "Partially" },
      { color: COLOR.gap, label: "Not in place" },
      { color: COLOR.unknownSeg, label: "Unknown" },
      { color: COLOR.naSeg, label: "N/A" }
    ]));
    var worst = (scored.worstCategories || []).slice(0, 3);
    if (worst.length) {
      children.push(h2("Where to focus first"));
      children.push(body("CSMS categories with the most elements still to put in place.", { color: COLOR.muted, spacing: { after: 40 } }));
      worst.forEach(function (w, i) {
        children.push(sbFocusCard(i + 1, w.name, w.gaps + " of " + w.total + " with gaps"));
        children.push(sbSpacer());
      });
    }
    return children;
  }

  function csmsAboutSection(instrument, narrative) {
    var out = [];
    if (instrument.framing) { out.push(h1("About this assessment")); out.push(body(instrument.framing)); }
    var sc = seriesContextOf(instrument, narrative);
    if (sc) out.push(body(sc));
    out = out.concat(attributionParas(instrument, !!instrument.framing));
    out.push(h1("How to read this report"));
    out.push(body("Each CSMS element is judged Not in place, Partially in place, Largely in place or In place against full conformance. The conformance index is for context only. Unknown reduces coverage and lowers confidence; Not applicable elements are excluded. The roadmap lists every element that is Not in place or Partially in place."));
    return out;
  }

  function csmsAreaTableSection(num, title, areas, wDxa) {
    var TableRow = window.docx.TableRow;
    var C = window.App.ScoringCSMS;
    var children = [ h1n(num, title) ];
    var areaHeaders = ["Area", "In place", "Largely", "Partially", "Not in place", "Conformance"];
    var widths = fitHeaderWidths(areaHeaders, wDxa);
    var rows = [ buildHeaderRow(areaHeaders, widths) ];
    areas.forEach(function (g) {
      var c = g.counts;
      rows.push(new TableRow({ children: [
        cellDxa(body(g.name, { bold: true }), widths[0]),
        cellDxa(String(c.inPlace),    widths[1], { fill: COLOR.metBg,  valign: "center" }),
        cellDxa(String(c.largely),    widths[2], { valign: "center" }),
        cellDxa(String(c.partially),  widths[3], { fill: COLOR.nearBg, valign: "center" }),
        cellDxa(String(c.notInPlace), widths[4], { fill: COLOR.gapBg,  valign: "center" }),
        cellDxa(C.formatPct(g.conformance), widths[5], { valign: "center" })
      ] }));
    });
    children.push(fixedTable(rows, widths));
    return children;
  }

  function csmsRoadmapSection(scored) {
    var children = [ h1n("4", "Conformance gap roadmap") ];
    var roadmap = scored.roadmap || [];
    if (roadmap.length === 0) {
      children.push(body("Every applicable element is In place or Largely in place, so there are no gaps to report."));
      return children;
    }
    var catName = {};
    (scored.byCategory || []).forEach(function (c) { catName[c.categoryId] = c.name; });
    var grpName = {};
    (scored.byGroup || []).forEach(function (g) { grpName[g.groupId] = g.name; });

    children.push(body("Every applicable element that is Not in place or Partially in place, Not-in-place first, in the consultant's priority order."));

    roadmap.forEach(function (it, i) {
      var floorBadge = it.isFloor ? "  (not in place)" : "";
      var pb = nis2PriBandD(it.priorityBand);
      var stateColour = it.isFloor ? COLOR.gap : COLOR.near;
      children.push(new window.docx.Paragraph({
        heading: window.docx.HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 20 },
        children: [ run("P" + (i + 1) + "   " + it.code + " " + it.title + floorBadge) ]
      }));
      children.push(new window.docx.Paragraph({
        style: "BodyText", spacing: { after: 60 },
        children: [
          run("Current state: ", { bold: true }),
          run(it.stateLabel || "", { bold: true, color: stateColour }),
          run("    Category: ", { bold: true }),
          run(catName[it.categoryId] || it.categoryId || ""),
          it.elementGroupId ? run("    Element group: ", { bold: true }) : run(""),
          it.elementGroupId ? run(grpName[it.elementGroupId] || it.elementGroupId) : run("")
        ]
      }));
      var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
      if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
      if (it.isFloor) priChildren.push(run("   floor finding", { bold: true, color: COLOR.gap }));
      children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));

      if (it.hint) children.push(nis2Field("What good conformance looks like", it.hint));
      if (it.rationale) children.push(nis2Field("Why this matters", it.rationale));
      var lensFraming = (it.otLens && it.otLens.framing) ? it.otLens.framing : "";
      if (lensFraming) children.push(nis2Field("OT context", lensFraming));
      children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this element."));
      children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact")));
      children.push(nis2Field("Recommended action", it.action, planWhere(it, "action")));
      children.push(nis2Field("Owner", it.owner || "To be assigned"));
    });
    return children;
  }

  function csmsLimitations(instrument) {
    var children = [ h1("Method and limitations") ];
    children.push(body("Conformance states are set per element by the consultant against the four-point scale (Not in place / Partially / Largely / In place), informed by OT context. This assessment reports a conformance profile by category and element group; it does not compute a single CSMS grade. The conformance index is presented for context only. Unknown answers reduce coverage and confidence; Not applicable elements are excluded. A Not-in-place element is surfaced as a floor finding and is not averaged away."));
    children.push(body("Element titles are verified from ISA/IEC 62443-2-1:2010; the assessor framing is paraphrased and the verbatim requirement text and OT lens are to be populated by the licence holder."));
    return children;
  }

  // ---- EU CRA (layered conformance) document ----------------------------
  // Three independently-scored layers, side by side, never blended. Same
  // report chassis as the other families: composed executive summary with
  // consultant slots, shaded caveat block, designed scorecard page (tiles /
  // stacked bars / focus cards), numbered sections with fixed-width tables,
  // and a prose recommendations roadmap. No narrative pack (indicative
  // skeleton) - the prose is composed from the scores and fixed chassis text.

  // Verdict banding for a layer rollup: drives tile colours and the
  // executive-summary characterisation. Floor findings weigh heavier than
  // the conformance index.
  function craLayerBand(ov) {
    if (ov.conformance === null) return "na";
    if (ov.counts.notInPlace === 0 && ov.conformance >= 0.75) return "met";
    if (ov.conformance >= 0.45) return "near";
    return "gap";
  }
  function craBandColors(b) {
    if (b === "met")  return { color: COLOR.met,  fill: COLOR.metBg };
    if (b === "near") return { color: COLOR.near, fill: COLOR.nearBg };
    if (b === "gap")  return { color: COLOR.gap,  fill: COLOR.gapBg };
    return { color: COLOR.muted, fill: COLOR.naBg };
  }
  // A layer's position as the end of a sentence that starts with its name.
  function craLayerVerb(b) {
    var phrase = craBandPhrase(b);
    return phrase === "not yet assessed" ? " is not yet assessed" : " shows " + phrase;
  }
  // A percentage for running text: the formatters give "-" when there is no
  // figure yet, which reads as a dash in a sentence.
  function pctText(s) { return (!s || s === "-") ? "not available" : s; }
  function craBandPhrase(b) {
    if (b === "met")  return "a strong position";
    if (b === "near") return "a developing position with recognised gaps";
    if (b === "gap")  return "substantial gaps";
    return "not yet assessed";
  }
  function craStateFill(state) {
    if (state === "in-place") return COLOR.metBg;
    if (state === "partially") return COLOR.nearBg;
    if (state === "not-in-place") return COLOR.gapBg;
    return COLOR.naBg;
  }

  // scored.roadmap arrives concatenated per layer (P1's gaps, then P2's, then
  // P3's). For the report, order it the way every other family does: the
  // consultant's manual priority rank first, then Not-in-place before
  // Partially, keeping the layer order only as the tie-break.
  function craSortedRoadmap(scored) {
    return (scored.roadmap || []).slice().sort(function (a, b) {
      var ar = typeof a.priorityRank === "number", br = typeof b.priorityRank === "number";
      if (ar && br) return a.priorityRank - b.priorityRank;
      if (ar) return -1;
      if (br) return 1;
      var an = a.state === "not-in-place" ? 0 : 1;
      var bn = b.state === "not-in-place" ? 0 : 1;
      return an - bn;
    });
  }

  // The regulation-specific report prose: instrument.docx supplies it for the
  // layered siblings (EU Machinery Regulation, ...); every fallback is the
  // exact CRA wording so eu-cra needs no data change.
  function craDocPack(instrument) {
    var d = (instrument && instrument.docx) || {};
    var disp = (instrument && instrument.display) || {};
    var il = (instrument && instrument.interlockSpec) || {};
    var noun = d.noun || disp.productNoun || "product";
    return {
      noun: noun,
      Noun: noun.charAt(0).toUpperCase() + noun.slice(1),
      conformityLayer: il.conformityLayer || "P3",
      regName: d.regName || "the EU Cyber Resilience Act (Regulation (EU) 2024/2847)",
      layersSentence: d.layersSentence || "Three layers were assessed independently (the Annex I Part I product requirements, the Annex I Part II vulnerability-handling requirements, and the conformity and obligations layer) and are reported side by side; they are never blended into a single CRA score, because strong product security with unfinished conformity work is not market readiness.",
      keyDatesNote: d.keyDatesNote || "The CRA's Article 14 reporting obligations apply from 11 September 2026 and the full obligations from 11 December 2027; readiness should be judged against the date that applies to each finding.",
      misclassFinding: d.misclassFinding || "Finding: possible product misclassification (the matched Annex III/IV category indicates a higher class than the one set, which changes the required conformity route). See the dedicated section below.",
      seqPlaceholder: d.seqPlaceholder || "Consultant: one short paragraph on sequencing (what must close before the Article 14 date, what gates CE marking, and what can run in parallel).",
      exposurePlaceholder: d.exposurePlaceholder || "Consultant: the commercial exposure in one paragraph (which markets and revenue depend on CE marking under the CRA, and what non-conformity would mean for them).",
      glanceTitle: d.glanceTitle || "CRA readiness at a glance",
      howToRead: d.howToRead || "Each requirement is judged In place, Partially in place or Not in place, with Unknown reducing coverage and confidence and Not applicable excluded. The three layers are scored independently and reported side by side, with no single CRA score, because missing conformity work blocks market placement outright.",
      limitations: d.limitations || [
        "Conformance states are set per requirement by the consultant against the three-point scale (Not in place / Partially in place / In place), informed by the captured evidence. Each layer rolls up independently; the conformance index is presented for context only and the three layers are never blended into a single CRA score. Unknown answers reduce coverage and confidence; Not applicable requirements are excluded. A Not-in-place requirement is surfaced as a floor finding and is not averaged away.",
        "This is an indicative gap assessment against the EU CRA, not a conformity assessment or certification. The Regulation text governs. No harmonised standard has yet been cited in the Official Journal under the CRA, so presumption of conformity via a standard is not formally available and a 62443 (or other) certificate does not equal CRA conformity. The manufacturer, or a notified body where required by class, remains responsible for the conformity decision."
      ],
      coverSubLine: d.coverSubLine || "EU Cyber Resilience Act: indicative gap assessment",
      docDescription: d.docDescription || "EU Cyber Resilience Act (CRA) indicative gap assessment",
      defaultClassLabel: d.defaultClassLabel || "Default (self-assessment / internal control)",
      categoryRowLabel: d.categoryRowLabel || "Matched Annex III/IV category (aid)",
      noBlendPhrase: d.noBlendPhrase || "a single CRA score",
      blockerTail: d.blockerTail || " cannot yet be lawfully CE-marked or placed on the EU market, however strong its technical security. Closing these is a market-access matter, not a security-engineering one.",
      blockerTailMulti: d.blockerTailMulti || " cannot yet be lawfully CE-marked or placed on the EU market, however strong their technical security. Closing those gaps is a market-access matter, not a security-engineering one.",
      multiOrgSentence: d.multiOrgSentence || "The organisation-wide obligations (the Annex I Part II vulnerability-handling process, Article 14 reporting readiness and component due diligence) were assessed once for the manufacturer and apply to every product; the Annex I Part I product requirements and the remaining conformity obligations were assessed per product. Layers are reported side by side and never blended into a single CRA score.",
      seqPlaceholderMulti: d.seqPlaceholderMulti || "Consultant: one short paragraph on sequencing (what must close before the Article 14 date, what gates CE marking for which product, and what can run in parallel)."
    };
  }

  function craExecutiveSummary(scored, engagement, target, pk) {
    var CRA = window.App.ScoringCRA;
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var cls = scored.classification || {};
    var clientName = e.clientName || "The organisation";
    var product = (target && target.name) || "(" + pk.noun + " not set)";
    var layers = scored.layers || [];
    var byId = {}; layers.forEach(function (l) { byId[l.layerId] = l; });
    var gaps = craSortedRoadmap(scored);
    var children = [ h1n("1", "Executive summary") ];

    children.push(body(clientName + " commissioned a gap assessment of " + product + " against " + pk.regName + ". The " + pk.noun + " is classified as " + (cls.classLabel || pk.defaultClassLabel) + (cls.route ? (", for which the required conformity route is " + cls.route + "") : "") + ". " + pk.layersSentence));

    layers.forEach(function (l) {
      var c = l.overall.counts;
      var band = craLayerBand(l.overall);
      children.push(bullet(l.layerId + " " + l.name + craLayerVerb(band) + ", with " + c.inPlace + " in place, " + c.partially + " partially in place, " + c.notInPlace + " not in place" + (c.unknown ? ", " + c.unknown + " unknown" : "") + " (conformance index " + CRA.formatPct(l.overall.conformance) + ", context only)."));
    });

    // The story sentence: name the blocker.
    var p3 = byId[pk.conformityLayer];
    if (p3 && p3.overall.counts.notInPlace > 0) {
      var nBlock = p3.overall.counts.notInPlace;
      children.push(body([
        run("The conformity layer is currently the blocker: ", { bold: true }),
        run("with " + nBlock + " conformity obligation" + (nBlock === 1 ? "" : "s") + " not in place, the " + pk.noun + pk.blockerTail)
      ]));
    } else if (layers.length) {
      var worst = layers.slice().sort(function (a, b) {
        var ac = a.overall.conformance === null ? 2 : a.overall.conformance;
        var bc = b.overall.conformance === null ? 2 : b.overall.conformance;
        return ac - bc;
      })[0];
      if (worst && craLayerBand(worst.overall) !== "met") {
        children.push(body("The weakest position is " + worst.layerId + " " + worst.name + "; the recommendations below concentrate there first."));
      } else if (gaps.length === 0) {
        children.push(body("All layers in scope stand at full conformance on the evidence captured; the remaining work is keeping that position current as the product and the regulation's supporting standards evolve."));
      }
    }

    children.push(body(pk.keyDatesNote));

    if (cls.misclassification) {
      children.push(body([run(pk.misclassFinding, { bold: true, color: COLOR.gap })]));
    }
    if (scored.interlock && scored.interlock.triggered) {
      children.push(body([run("Flag: the conformity layer is assessed without the technical layer(s) that substantiate it (see the dedicated section below).", { color: COLOR.gap })]));
    }

    if (gaps.length) {
      var top = gaps.slice(0, 3).map(function (g) { return g.code + " " + g.title; });
      children.push(body("Across the layers in scope there " + (gaps.length === 1 ? "is 1 open gap" : "are " + gaps.length + " open gaps") + ". The immediate priorities are " + nis2ListJoin(top) + "; the full prioritised roadmap, with recommended actions and owners, is in the Recommendations section."));
      var topPri = (rn.topPriorities || "").trim();
      if (topPri) children.push(body(topPri));
      else children.push(placeholderPara(pk.seqPlaceholder, NARR_PRIORITIES));
    } else {
      children.push(body("No applicable requirement is Not in place or Partially in place across the layers in scope."));
    }

    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else children.push(placeholderPara(pk.exposurePlaceholder, NARR_EXPOSURE));

    // Said once: the critical caveats box under the summary carries it where the instrument lists it.
    if (!/informs conformity/.test((scored.criticalCaveats || []).join(" "))) children.push(body("This assessment informs conformity; it does not determine or certify it. The manufacturer, or a notified body where the class requires one, remains responsible for the conformity decision."));
    return children;
  }

  // Critical caveats as a single shaded block (same treatment as the other
  // families' not-a-certification caveat), not a loose list.
  function craCaveatBlock(scored) {
    var caveats = (scored.criticalCaveats || []).slice();
    // The classification-driven caveats only exist once the product has been
    // classified. A report produced before that is the one most in need of
    // saying what it is not, so the standing statement is always present.
    caveats.push("This is a gap analysis carried out to support preparation for conformity. It is not a conformity assessment, it confers no presumption of conformity, and it is not a determination by a notified body or a market surveillance authority.");
    if (!caveats.length) return [];
    var TableRow = window.docx.TableRow, WidthType = window.docx.WidthType, Table = window.docx.Table, ShadingType = window.docx.ShadingType, TableCell = window.docx.TableCell;
    var paras = [ new window.docx.Paragraph({ style: "BodyText", children: [run("Critical caveats: read before using this report", { bold: true, color: COLOR.gap })] }) ];
    caveats.forEach(function (c) {
      paras.push(new window.docx.Paragraph({ style: "BodyText", spacing: { before: 60 }, children: [run(c)] }));
    });
    var tbl = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [ new TableRow({ cantSplit: true, children: [ new TableCell({
        children: paras,
        shading: { type: ShadingType.SOLID, color: COLOR.gapBg, fill: COLOR.gapBg }
      }) ] }) ]
    });
    return [ tbl, body("", { spacing: { after: 160 } }) ];
  }

  // Scorecard page: one tile per layer, the three layers as stacked bars,
  // the conformity route, and where to focus first.
  function craScorecardDesignB(scored, target, pk) {
    var CRA = window.App.ScoringCRA;
    var layers = scored.layers || [];
    var cls = scored.classification || {};
    var children = [ h1(pk.glanceTitle) ];
    if (layers.length) {
      children.push(sbTilesRow(layers.map(function (l) {
        var b = craBandColors(craLayerBand(l.overall));
        return { t: CRA.formatPct(l.overall.conformance), color: b.color, label: l.layerId + "  " + l.name + "  (" + l.overall.gaps + " gap" + (l.overall.gaps === 1 ? "" : "s") + ")", fill: b.fill, size: 40 };
      })));
    }
    children.push(body(pk.Noun + ": " + ((target && target.name) || "(not set)") + " (classified " + (cls.classLabel || "Default") + "). Conformance index per layer, shown for context only: the three layers are never blended into " + pk.noBlendPhrase + ", and open conformity gaps block market placement regardless of technical strength.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));

    children.push(h2("Conformance profile by layer"));
    children.push(sbStackTable(layers.map(function (l) {
      var c = l.overall.counts;
      return sbStackRow(l.layerId + " " + l.name, [
        { n: c.inPlace,    color: COLOR.met },
        { n: c.partially,  color: COLOR.near },
        { n: c.notInPlace, color: COLOR.gap },
        { n: c.unknown,    color: COLOR.unknownSeg },
        { n: c.na,         color: COLOR.naSeg }
      ]);
    })));
    children.push(sbLegend([
      { color: COLOR.met, label: "In place" },
      { color: COLOR.near, label: "Partially" },
      { color: COLOR.gap, label: "Not in place" },
      { color: COLOR.unknownSeg, label: "Unknown" },
      { color: COLOR.naSeg, label: "N/A" }
    ]));

    var top = craSortedRoadmap(scored).slice(0, 3);
    if (top.length) {
      children.push(h2("Where to focus first"));
      children.push(body("The highest-priority gaps across all layers, in the consultant's order. The full roadmap follows in the Recommendations section.", { color: COLOR.muted, spacing: { after: 40 } }));
      top.forEach(function (it, i) {
        children.push(sbFocusCard(i + 1, it.code + "  " + it.title, (it.layerId || "") + ": " + (it.stateLabel || "")));
        children.push(sbSpacer());
      });
    }
    return children;
  }

  function craAboutSection(instrument) {
    var pk = craDocPack(instrument);
    var out = [];
    if (instrument.framing) { out.push(h1("About this assessment")); out.push(body(instrument.framing)); }
    var sc4830 = seriesContextOf(instrument, typeof narrative !== "undefined" ? narrative : null); if (sc4830) out.push(body(sc4830));
    out = out.concat(attributionParas(instrument, !!instrument.framing));
    out.push(h1("How to read this report"));
    out.push(body(pk.howToRead));
    if (instrument.scoringNote) out.push(body(instrument.scoringNote, { color: COLOR.muted }));
    return out;
  }

  function craScopeSection(scored, target, pk) {
    var cls = scored.classification || {};
    var TableRow = window.docx.TableRow;
    var widths = [3026, 6000];
    function kv(k, v) {
      return new TableRow({ children: [
        cellDxa(body(k, { bold: true }), widths[0], { fill: COLOR.subBg, valign: "center" }),
        cellDxa(body(v || "(not set)"), widths[1], { valign: "center" })
      ] });
    }
    var rows = [
      kv(pk.Noun, (target && target.name) || "(not set)"),
      kv(pk.Noun + " class", cls.classLabel || pk.defaultClassLabel),
      kv(pk.categoryRowLabel, cls.categoryText || "(none)"),
      kv("Conformity route (" + pk.conformityLayer + ")", cls.route || ""),
      kv("Layers in scope", (scored.layersInScope || []).join(", "))
    ];
    return [ h1n("2", "Scope of this assessment"), fixedTable(rows, widths) ];
  }

  function craFindingsSections(scored, pk) {
    var cls = scored.classification || {};
    var children = [];
    if (cls.misclassification) {
      children.push(h1("Finding: possible " + pk.noun + " misclassification"));
      children.push(body([run(cls.misclassificationNote, { color: COLOR.gap })]));
    }
    if (scored.interlock && scored.interlock.triggered) {
      children.push(h1("Conformity claim not substantiated by the technical layers"));
      var missing = (scored.interlock.missingLayers || []).join(" and ");
      children.push(body([run((scored.interlock.message || "") + " The conformity layer (" + pk.conformityLayer + ") is in scope but " + (missing || "a technical layer") + " is not.", { color: COLOR.gap })]));
    }
    return children;
  }

  // One layer's conformance profile table + full requirement register.
  // Shared by the single-product and multi-product documents.
  function craLayerBlock(layer, profile, instrument) {
    var CRA = window.App.ScoringCRA;
    var TableRow = window.docx.TableRow;
    var ov = layer.overall, c = ov.counts;
    var children = [];
    if (layer.summary) children.push(body(layer.summary));
    if (layer.scope === "organisation") {
      children.push(body("Organisation-wide layer: these answers describe the manufacturer's process and are shared across every product in the engagement.", { color: COLOR.muted }));
    }

    var pWidths = [1400, 1400, 1500, 1300, 1000, 1226, 1200];
    children.push(fixedTable([
      buildHeaderRow(["In place", "Partially", "Not in place", "Unknown", "N/A", "Applicable", "Index"], pWidths),
      new TableRow({ children: [
        cellDxa(String(c.inPlace),    pWidths[0], { fill: COLOR.metBg,  valign: "center" }),
        cellDxa(String(c.partially),  pWidths[1], { fill: COLOR.nearBg, valign: "center" }),
        cellDxa(String(c.notInPlace), pWidths[2], { fill: COLOR.gapBg,  valign: "center" }),
        cellDxa(String(c.unknown),    pWidths[3], { valign: "center" }),
        cellDxa(String(c.na),         pWidths[4], { valign: "center" }),
        cellDxa(String(ov.total),     pWidths[5], { valign: "center" }),
        cellDxa(CRA.formatPct(ov.conformance), pWidths[6], { valign: "center" })
      ] })
    ], pWidths));
    children.push(body("", { spacing: { after: 60 } }));

    var rWidths = [1000, 2900, 1500, 3626];
    var rows = [ buildHeaderRow(["Ref", "Requirement", "Judgement", "Evidence captured"], rWidths) ];
    (layer.result.perItem || []).forEach(function (it) {
      var lbl = window.App.ScoringCSMS.stateLabelFor(it.state, profile) || "Not set";
      // Org-scoped obligations inside a per-product layer (Art 14 reporting,
      // component due diligence) are shared across products - say so inline.
      var orgItem = layer.scope !== "organisation" && CRA.itemScope(instrument, it.itemId) === "organisation";
      rows.push(new TableRow({ children: [
        cellDxa(body(it.code, { bold: true }), rWidths[0], { valign: "center" }),
        cellDxa(body(it.title + (orgItem ? "  (organisation-wide)" : "")), rWidths[1], { valign: "center" }),
        cellDxa(body(lbl), rWidths[2], { fill: craStateFill(it.state), valign: "center" }),
        cellDxa(body(it.evidence || ""), rWidths[3])
      ] }));
    });
    children.push(fixedTable(rows, rWidths));
    return children;
  }

  function craLayerSections(scored, profile, instrument) {
    var children = [ h1n("3", "Results by layer") ];
    children.push(body("Each layer lists every requirement assessed, including those already in place."));
    (scored.layers || []).forEach(function (layer) {
      children.push(h2(layer.layerId + " " + layer.name));
      children = children.concat(craLayerBlock(layer, profile, instrument));
    });
    return children;
  }

  // One roadmap entry's paragraphs. appliesTo names the product (or
  // "Organisation-wide") in a multi-product document; null omits the line.
  function craRoadmapEntry(it, i, profile, appliesTo) {
    var children = [];
    var floorBadge = it.isFloor ? "  (not in place)" : "";
    var pb = nis2PriBandD(it.priorityBand);
    var stateColour = it.isFloor ? COLOR.gap : COLOR.near;
    children.push(new window.docx.Paragraph({
      heading: window.docx.HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 20 },
      children: [ run("P" + (i + 1) + "   " + it.code + " " + it.title + floorBadge) ]
    }));
    var stateChildren = [
      run("Current state: ", { bold: true }),
      run(it.stateLabel || (window.App.ScoringCSMS.stateLabelFor(it.state, profile) || ""), { bold: true, color: stateColour }),
      run("    Layer: ", { bold: true }),
      run((it.layerId || "") + (it.layerName ? " " + it.layerName : ""))
    ];
    if (appliesTo) {
      stateChildren.push(run("    Applies to: ", { bold: true }));
      stateChildren.push(run(appliesTo, appliesTo === "Organisation-wide" ? { bold: true } : {}));
    }
    children.push(new window.docx.Paragraph({ style: "BodyText", spacing: { after: 60 }, children: stateChildren }));
    var priChildren = [ run("Priority: ", { bold: true }), run("P" + (i + 1), { bold: true }) ];
    if (pb.label) priChildren.push(run(" (" + pb.label + ")", { bold: true }));
    if (it.isFloor) priChildren.push(run("   floor finding", { bold: true, color: COLOR.gap }));
    children.push(new window.docx.Paragraph({ style: "BodyText", indent: { left: 360 }, spacing: { after: 60 }, children: priChildren }));

    if (it.requirement) children.push(nis2Field("Requirement (paraphrased)", it.requirement));
    if (it.rationale) children.push(nis2Field("Why this matters", it.rationale));
    children.push(nis2Field("Captured evidence", it.evidence || "No evidence was captured for this requirement."));
    children.push(nis2Field("Business impact", it.impact, planWhere(it, "impact")));
    children.push(nis2Field("Recommended action", it.action, planWhere(it, "action")));
    children.push(nis2Field("Owner", it.owner || "To be assigned"));
    return children;
  }

  // Recommendations: the prose roadmap every other family gets - one entry per
  // open gap with the requirement, why it matters, evidence, impact, action
  // and owner. Empty consultant fields render as the red to-be-completed note.
  function craRoadmapSection(scored, profile) {
    var children = [ h1n("4", "Recommendations: conformance gap roadmap") ];
    var roadmap = craSortedRoadmap(scored);
    if (!roadmap.length) {
      children.push(body("No applicable requirement is Not in place or Partially in place across the layers in scope, so there are no recommendations to make."));
      return children;
    }
    children.push(body("Every requirement that is Not in place or Partially in place across the layers in scope, Not-in-place first, in the consultant's priority order. Conformity-layer entries gate CE marking and market placement; technical-layer entries build the security position that the conformity claim rests on."));
    roadmap.forEach(function (it, i) { children = children.concat(craRoadmapEntry(it, i, profile, null)); });
    return children;
  }

  // ---- multi-product document --------------------------------------------
  // One Word report covering every product in the engagement: the
  // organisation-wide answers appear once, each product gets its own scope,
  // findings and per-product layer results, and the roadmap is combined with
  // organisation-wide gaps de-duplicated.

  // Combined roadmap across products: org-scoped gaps once (they are the same
  // answer fanned out), per-product gaps tagged with the product name, the
  // whole list re-sorted by consultant priority then floors-first.
  function craCombinedRoadmap(perT, instrument) {
    var CRA = window.App.ScoringCRA;
    var seenOrg = {}, entries = [];
    perT.forEach(function (pt) {
      craSortedRoadmap(pt.result).forEach(function (it) {
        if (CRA.itemScope(instrument, it.itemId) === "organisation") {
          if (seenOrg[it.itemId]) return;
          seenOrg[it.itemId] = true;
          entries.push(Object.assign({}, it, { appliesTo: "Organisation-wide", targetId: pt.target.id }));
        } else {
          entries.push(Object.assign({}, it, { appliesTo: pt.target.name, targetId: pt.target.id }));
        }
      });
    });
    entries.sort(function (a, b) {
      var ar = typeof a.priorityRank === "number", br = typeof b.priorityRank === "number";
      if (ar && br) return a.priorityRank - b.priorityRank;
      if (ar) return -1;
      if (br) return 1;
      var an = a.state === "not-in-place" ? 0 : 1;
      var bn = b.state === "not-in-place" ? 0 : 1;
      return an - bn;
    });
    return entries;
  }

  function craOrgLayers(result) { return (result.layers || []).filter(function (l) { return l.scope === "organisation"; }); }
  function craProductLayers(result) { return (result.layers || []).filter(function (l) { return l.scope !== "organisation"; }); }

  function craExecutiveSummaryMulti(perT, engagement, combined, pk) {
    var CRA = window.App.ScoringCRA;
    var e = (engagement && engagement.engagement) || {};
    var rn = (engagement && engagement.reportNarrative) || {};
    var clientName = e.clientName || "The organisation";
    var names = perT.map(function (pt) { return pt.target.name; });
    var children = [ h1n("1", "Executive summary") ];

    children.push(body(clientName + " commissioned a gap assessment of " + perT.length + " " + pk.noun + "s against " + pk.regName + ": " + nis2ListJoin(names) + ". " + pk.multiOrgSentence));

    craOrgLayers(perT[0].result).forEach(function (l) {
      var c = l.overall.counts;
      children.push(bullet("Organisation-wide: " + l.layerId + " " + l.name + craLayerVerb(craLayerBand(l.overall)) + ", with " + c.inPlace + " in place, " + c.partially + " partially in place, " + c.notInPlace + " not in place (conformance index " + CRA.formatPct(l.overall.conformance) + ", context only)."));
    });
    perT.forEach(function (pt) {
      var cls = pt.result.classification || {};
      var bits = craProductLayers(pt.result).map(function (l) {
        return l.layerId + " " + craBandPhrase(craLayerBand(l.overall)) + " (" + l.overall.gaps + " gap" + (l.overall.gaps === 1 ? "" : "s") + ")";
      });
      children.push(bullet(pt.target.name + " (" + (cls.classLabel || "Default") + "): " + bits.join("; ") + "."));
    });

    // Blocker line: products whose conformity layer has floor findings.
    var blocked = perT.filter(function (pt) {
      var p3 = (pt.result.layers || []).filter(function (l) { return l.layerId === pk.conformityLayer; })[0];
      return p3 && p3.overall.counts.notInPlace > 0;
    }).map(function (pt) { return pt.target.name; });
    if (blocked.length) {
      children.push(body([
        run("Market placement is currently blocked for " + nis2ListJoin(blocked) + ": ", { bold: true }),
        run("open conformity obligations mean these " + pk.noun + "s" + pk.blockerTailMulti)
      ]));
    }

    children.push(body(pk.keyDatesNote));

    perT.forEach(function (pt) {
      var cls = pt.result.classification || {};
      if (cls.misclassification) {
        children.push(body([run("Finding (" + pt.target.name + "): " + pk.misclassFinding.replace(/^Finding: /, "").replace(/ See the dedicated section below\.$/, ""), { bold: true, color: COLOR.gap })]));
      }
    });
    if (perT[0].result.interlock && perT[0].result.interlock.triggered) {
      children.push(body([run("Flag: the conformity layer is assessed without the technical layer(s) that substantiate it (see the dedicated section below).", { color: COLOR.gap })]));
    }

    if (combined.length) {
      var top = combined.slice(0, 3).map(function (g) { return g.code + " " + g.title + " (" + g.appliesTo + ")"; });
      children.push(body("Across the " + pk.noun + "s and layers in scope there " + (combined.length === 1 ? "is 1 open gap" : "are " + combined.length + " open gaps") + " (organisation-wide gaps counted once). The immediate priorities are " + nis2ListJoin(top) + "; the full prioritised roadmap, with recommended actions and owners, is in the Recommendations section."));
      var topPri = (rn.topPriorities || "").trim();
      if (topPri) children.push(body(topPri));
      else children.push(placeholderPara(pk.seqPlaceholderMulti, NARR_PRIORITIES));
    } else {
      children.push(body("No applicable requirement is Not in place or Partially in place across the " + pk.noun + "s and layers in scope."));
    }

    var expo = (rn.regulatoryExposure || "").trim();
    if (expo) children.push(body(expo));
    else children.push(placeholderPara(pk.exposurePlaceholder, NARR_EXPOSURE));

    // Said once: the critical caveats box under the summary carries it where the instrument lists it.
    if (!/informs conformity/.test(((perT[0] && perT[0].result && perT[0].result.criticalCaveats) || []).join(" "))) children.push(body("This assessment informs conformity; it does not determine or certify it. The manufacturer, or a notified body where the class requires one, remains responsible for the conformity decision."));
    return children;
  }

  function craScorecardMulti(perT, combined, pk) {
    var CRA = window.App.ScoringCRA;
    var children = [ h1(pk.glanceTitle) ];

    var orgLs = craOrgLayers(perT[0].result);
    if (orgLs.length) {
      children.push(h2("Organisation-wide"));
      children.push(sbTilesRow(orgLs.map(function (l) {
        var b = craBandColors(craLayerBand(l.overall));
        return { t: CRA.formatPct(l.overall.conformance), color: b.color, label: l.layerId + "  " + l.name + "  (" + l.overall.gaps + " gap" + (l.overall.gaps === 1 ? "" : "s") + ")", fill: b.fill, size: 40 };
      })));
    }
    perT.forEach(function (pt) {
      var cls = pt.result.classification || {};
      children.push(h2(pt.target.name + " - " + (cls.classLabel || "Default")));
      children.push(sbTilesRow(craProductLayers(pt.result).map(function (l) {
        var b = craBandColors(craLayerBand(l.overall));
        return { t: CRA.formatPct(l.overall.conformance), color: b.color, label: l.layerId + "  " + l.name + "  (" + l.overall.gaps + " gap" + (l.overall.gaps === 1 ? "" : "s") + ")", fill: b.fill, size: 40 };
      })));
    });
    children.push(body("Conformance index per layer, shown for context only: layers are never blended into " + pk.noBlendPhrase + ", and open conformity gaps block market placement regardless of technical strength. Organisation-wide answers are one shared set; per-" + pk.noun + " tiles show each " + pk.noun + "'s own position.", { color: COLOR.muted, spacing: { before: 180, after: 60 } }));

    var stacks = [];
    orgLs.forEach(function (l) {
      var c = l.overall.counts;
      stacks.push(sbStackRow(l.layerId + " (organisation)", [
        { n: c.inPlace, color: COLOR.met }, { n: c.partially, color: COLOR.near }, { n: c.notInPlace, color: COLOR.gap },
        { n: c.unknown, color: COLOR.unknownSeg }, { n: c.na, color: COLOR.naSeg }
      ]));
    });
    perT.forEach(function (pt) {
      craProductLayers(pt.result).forEach(function (l) {
        var c = l.overall.counts;
        stacks.push(sbStackRow(l.layerId + " - " + pt.target.name, [
          { n: c.inPlace, color: COLOR.met }, { n: c.partially, color: COLOR.near }, { n: c.notInPlace, color: COLOR.gap },
          { n: c.unknown, color: COLOR.unknownSeg }, { n: c.na, color: COLOR.naSeg }
        ]));
      });
    });
    if (stacks.length) {
      children.push(h2("Conformance profile by layer and product"));
      children.push(sbStackTable(stacks));
      children.push(sbLegend([
        { color: COLOR.met, label: "In place" },
        { color: COLOR.near, label: "Partially" },
        { color: COLOR.gap, label: "Not in place" },
        { color: COLOR.unknownSeg, label: "Unknown" },
        { color: COLOR.naSeg, label: "N/A" }
      ]));
    }

    var top = combined.slice(0, 3);
    if (top.length) {
      children.push(h2("Where to focus first"));
      children.push(body("The highest-priority gaps across all " + pk.noun + "s, in the consultant's order. The full roadmap follows in the Recommendations section.", { color: COLOR.muted, spacing: { after: 40 } }));
      top.forEach(function (it, i) {
        children.push(sbFocusCard(i + 1, it.code + "  " + it.title, it.appliesTo + " - " + (it.stateLabel || "")));
        children.push(sbSpacer());
      });
    }
    return children;
  }

  function craScopeSectionMulti(perT, scoredFirst, pk) {
    var TableRow = window.docx.TableRow;
    var widths = [2400, 2000, 2726, 1900];
    var rows = [ buildHeaderRow([pk.Noun, "Class", "Matched category (aid)", "Conformity route"], widths) ];
    perT.forEach(function (pt) {
      var cls = pt.result.classification || {};
      rows.push(new TableRow({ children: [
        cellDxa(body(pt.target.name, { bold: true }), widths[0], { valign: "center" }),
        cellDxa(body(cls.classLabel || "Default"), widths[1], { valign: "center" }),
        cellDxa(body(cls.categoryText || "(none)"), widths[2], { valign: "center" }),
        cellDxa(body(cls.route || ""), widths[3], { valign: "center" })
      ] }));
    });
    return [
      h1n("2", "Scope of this assessment"),
      body("Layers in scope: " + (scoredFirst.layersInScope || []).join(", ") + ". Each " + pk.noun + " is classified individually; the organisation-wide obligations are assessed once for the manufacturer."),
      fixedTable(rows, widths)
    ];
  }

  function craFindingsSectionsMulti(perT, pk) {
    var children = [];
    perT.forEach(function (pt) {
      var cls = pt.result.classification || {};
      if (cls.misclassification) {
        children.push(h1("Finding: possible " + pk.noun + " misclassification - " + pt.target.name));
        children.push(body([run(cls.misclassificationNote, { color: COLOR.gap })]));
      }
    });
    var il = perT[0].result.interlock;
    if (il && il.triggered) {
      children.push(h1("Conformity claim not substantiated by the technical layers"));
      var missing = (il.missingLayers || []).join(" and ");
      children.push(body([run((il.message || "") + " The conformity layer (" + pk.conformityLayer + ") is in scope but " + (missing || "a technical layer") + " is not.", { color: COLOR.gap })]));
    }
    return children;
  }

  function craLayerSectionsMulti(perT, profile, instrument) {
    var pk = craDocPack(instrument);
    var children = [ h1n("3", "Results by layer") ];
    children.push(body("The organisation-wide layer appears once, and its answers are shared by every " + pk.noun + ". Each " + pk.noun + " then has its own results for the per-" + pk.noun + " layers, with the shared conformity obligations marked (organisation-wide) in its register."));
    craOrgLayers(perT[0].result).forEach(function (layer) {
      children.push(h2(layer.layerId + " - " + layer.name + " (organisation-wide)"));
      children = children.concat(craLayerBlock(layer, profile, instrument));
    });
    perT.forEach(function (pt) {
      craProductLayers(pt.result).forEach(function (layer) {
        children.push(h2(layer.layerId + " - " + layer.name + " - " + pt.target.name));
        children = children.concat(craLayerBlock(layer, profile, instrument));
      });
    });
    return children;
  }

  function craRoadmapSectionMulti(combined, profile, pk) {
    var children = [ h1n("4", "Recommendations: conformance gap roadmap (all " + pk.noun + "s)") ];
    if (!combined.length) {
      children.push(body("No applicable requirement is Not in place or Partially in place across the " + pk.noun + "s and layers in scope, so there are no recommendations to make."));
      return children;
    }
    children.push(body("Every open gap across all " + pk.noun + "s, in the consultant's priority order, with organisation-wide gaps listed once (one fix closes them for every " + pk.noun + ")."));
    combined.forEach(function (it, i) { children = children.concat(craRoadmapEntry(it, i, profile, it.appliesTo)); });
    return children;
  }

  function craLimitations(pk) {
    var children = [ h1("Method and limitations") ];
    (pk.limitations || []).forEach(function (p) { children.push(body(p)); });
    return children;
  }

  function buildCRADoc(engagement, instrument, profile, opts, callback) {
    try {
      var CRA = window.App.ScoringCRA;
      var setup = opts.craSetup || null;
      var pk = craDocPack(instrument);
      var scoredAll = CRA.scoreEngagement(engagement, instrument, profile, setup);
      var perT = scoredAll.perTarget || [];
      var children;

      if (perT.length > 1) {
        // Multi-product engagement: ONE document covering every product -
        // organisation-wide answers once, per-product scope/findings/results,
        // and a combined roadmap with org gaps de-duplicated.
        var combined = craCombinedRoadmap(perT, instrument);
        children = []
          .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
          .concat(craExecutiveSummaryMulti(perT, engagement, combined, pk))
          .concat(execSummaryAddenda(engagement, opts.progress))
          .concat(craCaveatBlock(perT[0].result))
          .concat([pageBreakPara()])
          .concat(craScorecardMulti(perT, combined, pk))
          .concat([pageBreakPara()])
          .concat(craAboutSection(instrument))
          // buildCRADoc takes no narrative pack - the layered instruments carry
          // their prose on the instrument itself.
          .concat(slGlossary(instrument, null, null, engagement))
          .concat(craScopeSectionMulti(perT, perT[0].result, pk))
          .concat(craFindingsSectionsMulti(perT, pk))
          .concat(craLayerSectionsMulti(perT, profile, instrument))
          .concat(craRoadmapSectionMulti(combined, profile, pk))
          .concat(progressSection(opts.progress))
          .concat(basisOfAssessmentSection(engagement))
          .concat(craLimitations(pk))
          // One document, several products: each product's advice comes from
          // its OWN scored result, so the gap exclusion is right per product.
          // (`scored` below belongs to the single-product branch and is not
          // assigned here.)
          .concat(perT.reduce(function (acc, t) {
            return acc.concat(furtherRecommendationsSection(engagement, instrument, t.result, t.target.id));
          }, []))
          .concat(nextStepsSection(engagement, { instrument: instrument, scored: (perT[0] || {}).result }))
          .concat(methodologyAppendix(instrument));
      } else {
        var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
        var scored = perT.filter(function (t) { return t.target.id === target.id; })[0].result;
        children = []
          .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
          .concat(craExecutiveSummary(scored, engagement, target, pk))
          .concat(execSummaryAddenda(engagement, opts.progress))
          .concat(craCaveatBlock(scored))
          .concat([pageBreakPara()])
          .concat(craScorecardDesignB(scored, target, pk))
          .concat([pageBreakPara()])
          .concat(craAboutSection(instrument))
          // buildCRADoc takes no narrative pack - the layered instruments carry
          // their prose on the instrument itself.
          .concat(slGlossary(instrument, null, null, engagement))
          .concat(craScopeSection(scored, target, pk))
          .concat(craFindingsSections(scored, pk))
          .concat(craLayerSections(scored, profile, instrument))
          .concat(craRoadmapSection(scored, profile))
          .concat(progressSection(opts.progress))
          .concat(basisOfAssessmentSection(engagement))
          .concat(craLimitations(pk)).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));
      }

      var PO = (window.docx && window.docx.PageOrientation) || { PORTRAIT: "portrait" };
      var A4_W = 11906, A4_H = 16838;
      var portraitProps = { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };
      var coverProps = { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } };
      var coverChildren = coverDesignB(engagement, instrument, { subLine: pk.coverSubLine });
      var doc = makeDoc(engagement, {
        creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
        title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
        description: pk.docDescription,
        styles: buildStyles(),
        sections: [
          { properties: coverProps, children: coverChildren },
          { properties: portraitProps, headers: brandHeaders(), footers: brandFootersDoc(instrument, engagement), children: children }
        ]
      }, opts);
      packDoc(doc, opts, callback);
    } catch (e) { callback(e); }
  }

  function buildCSMSDoc(engagement, instrument, profile, narrative, opts, callback) {
    try {
      var scoredAll = window.App.ScoringCSMS.scoreEngagement(engagement, instrument, profile);
      var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
      var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;

      var coverChildren = coverDesignB(engagement, instrument, { subLine: "ISA/IEC 62443-2-1:2010 CSMS conformance" });
      var csmsIntro = []
        .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
        .concat(csmsExecutiveSummary(scored, instrument, engagement, narrative))
        .concat(execSummaryAddenda(engagement, opts.progress))
        .concat(csmsNotCertificationCaveatBlock(narrative))
        .concat([pageBreakPara()])
        .concat(csmsScorecardDesignB(scored))
        .concat([pageBreakPara()])
        .concat(csmsAboutSection(instrument, narrative))
        .concat(slGlossary(instrument, null, narrative, engagement))
      var csmsTables = []
        .concat(csmsAreaTableSection("2", "Results by category", scored.byCategory, CAF_LANDSCAPE_W))
        .concat((scored.byGroup && scored.byGroup.length) ? csmsAreaTableSection("3", "Results by element group", scored.byGroup, CAF_LANDSCAPE_W) : []);
      var csmsTail = []
        .concat(csmsRoadmapSection(scored))
        .concat(progressSection(opts.progress))
        .concat(basisOfAssessmentSection(engagement))
        .concat(csmsLimitations(instrument)).concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

      var PO = docPO();
      var coverProps = { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } };
      var doc = makeDoc(engagement, {
        creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
        title: instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
        description: "ISA/IEC 62443-2-1:2010 CSMS conformance and gap analysis",
        styles: buildStyles(),
        sections: [
          { properties: coverProps, children: coverChildren }
        ].concat(bodySectionsFromSegments(brandHeaders(), brandFootersDoc(instrument, engagement),
          [ { land: false, children: csmsIntro }, { land: true, children: csmsTables }, { land: false, children: csmsTail } ]))
      }, opts);
      packDoc(doc, opts, callback);
    } catch (e) { callback(e); }
  }

  // ---- organisation-wide document across sites ----------------------------
  //
  // A DIFFERENT document from the per-site reports, not a merge of them. It
  // answers the question the per-site reports cannot: where does the
  // organisation stand, given that its sites differ? Each requirement takes the
  // weakest site's result and names the sites that set it.
  //
  // Deliberately not a full report: there is no per-site evidence, roadmap or
  // recommendation here, because those belong to the site that recorded them.
  // This is the cross-site picture, and it says so.
  function orgWideSections(engagement, instrument, profile, taxonomy, opts) {
    var C = window.App.Compare;
    var family = instrument.scoringFamily;
    // The sites are ASSESSMENTS, and an export is handed one assessment's
    // engagement, so the caller supplies the set. Falling back to this
    // assessment alone keeps the builder honest if called without them rather
    // than silently reporting one site as though it were the organisation.
    var entries = (opts && opts.siteEntries) || [{
      id: "current",
      name: ((engagement.engagement || {}).siteName) || "This site",
      responses: engagement.responses || []
    }];

    var roll = C.rollUpSites({
      instrument: instrument, taxonomy: taxonomy, profile: profile, family: family,
      entries: entries
    });

    var noun = (instrument.targetDimensionLabel || "Site").split(" (")[0].trim().toLowerCase();
    // The instrument's own plural wins. Otherwise each " / " alternative is
    // pluralised on its head noun (same rule as the Excel tabs), so Entity
    // gives "entities" and "Dutyholder / site" gives "dutyholders / sites".
    function pluralPhrase(p) {
      var m = /^(.*?\S)(\s+(?:with|of|for|in|under|on|at)\s.*)$/i.exec(p);
      if (m) return pluralPhrase(m[1]) + m[2];
      var words = p.split(" ");
      var last = words[words.length - 1];
      if (/[^siu]s$/i.test(last)) return p;
      words[words.length - 1] = /(s|x|z|ch|sh)$/.test(last) ? last + "es"
        : /[^aeiou]y$/.test(last) ? last.slice(0, -1) + "ies"
        : last + "s";
      return words.join(" ");
    }
    var nounP = (instrument.targetDimensionLabelPlural || "").split(" (")[0].trim().toLowerCase() ||
                noun.split(" / ").map(pluralPhrase).join(" / ");
    var s = roll.summary;
    var children = [ h1n("1", "Organisation-wide position") ];

    children.push(body("This report covers " + roll.siteCount + " " + nounP + ": " +
      roll.siteNames.join(", ") + ". Each " + noun + " is assessed separately; the organisation-wide result " +
      "for a requirement is the result at the weakest " + noun + ", and the " + nounP + " that set it are named."));
    children.push(body("Weakest-" + noun + " rather than an average, because an organisation is exposed " +
      "wherever it is weakest. Averaging " + roll.siteCount + " " + nounP + " would report a comfortable figure for an " +
      "organisation carrying a serious gap at one of them."));

    if (s.differing === 0) {
      children.push(body("All " + nounP + " reached the same result on every requirement assessed at more than one, " +
        "so the organisation-wide position is the same as each " + noun + "'s."));
    } else {
      children.push(body(s.differing + " of " + s.compared + " requirements differ between " + nounP +
        ", and " + s.uniform + " are the same everywhere. The differing ones are listed below, weakest first."));
    }
    if (s.withUnscoredSites) {
      children.push(body([run("Coverage: ", { bold: true }),
        run(s.withUnscoredSites + " requirement" + (s.withUnscoredSites === 1 ? " was" : "s were") +
            " not assessed at every " + noun + " and " + (s.withUnscoredSites === 1 ? "is" : "are") +
            " named in the table, not counted as met.")]));
    }

    // The table: one row per requirement where the sites disagree. Wide, so it
    // goes on its own landscape page like the other results tables.
    var wideTable = [];
    if (roll.divergent.length) {
      wideTable.push(h1n("2", "Requirements where " + nounP + " differ"));
      // Sums to CAF_LANDSCAPE_W so the table fills its landscape page.
      var W = { code: 1800, label: 5198, org: 2200, sites: 3200, cover: 3000 };
      var head = new window.docx.TableRow({ tableHeader: true, children: [
        headerCellDxa("Requirement", W.code),
        headerCellDxa("", W.label),
        headerCellDxa("Organisation-wide", W.org),
        headerCellDxa(cap(nounP) + " setting it", W.sites),
        headerCellDxa("Coverage", W.cover)
      ]});
      var rows = [head].concat(roll.divergent.map(function (it) {
        return new window.docx.TableRow({ children: [
          cellDxa(body(it.code || it.id), W.code),
          cellDxa(body(it.label || ""), W.label),
          cellDxa(new window.docx.Paragraph({ style: "BodyText",
            children: [run(it.orgValue ? it.orgValue.label : "", { bold: true, color: COLOR.gap })] }), W.org),
          cellDxa(body(it.worstSites.join(", ")), W.sites),
          cellDxa(body(it.unscoredSites.length ? ("not assessed at " + it.unscoredSites.join(", ")) : ""), W.cover)
        ]});
      }));
      wideTable.push(new window.docx.Table({
        rows: rows,
        width: { size: CAF_LANDSCAPE_W, type: window.docx.WidthType.DXA },
        layout: window.docx.TableLayoutType.FIXED
      }));
    }

    // Where each site stands overall, so the reader can see which site is
    // carrying the organisation and which is holding it back.
    var per = [ h1n("3", cap(nounP) + " side by side") ];
    // This one stays portrait with the prose, so it sums to CAF_PORTRAIT_W.
    var W2 = { name: 3426, differ: 2800, cover: 2800 };
    var headRow = new window.docx.TableRow({ tableHeader: true, children: [
      headerCellDxa(cap(noun), W2.name),
      headerCellDxa("Requirements where this " + noun + " is the weakest", W2.differ),
      headerCellDxa("Requirements not assessed here", W2.cover)
    ]});
    var siteRows = roll.siteNames.map(function (nm) {
      var worst = roll.items.filter(function (i) { return i.differs && i.worstSites.indexOf(nm) !== -1; }).length;
      var missing = roll.items.filter(function (i) { return i.unscoredSites.indexOf(nm) !== -1; }).length;
      return new window.docx.TableRow({ children: [
        cellDxa(body(nm), W2.name),
        cellDxa(body(String(worst)), W2.differ),
        cellDxa(body(String(missing)), W2.cover)
      ]});
    });
    per.push(new window.docx.Table({
      rows: [headRow].concat(siteRows),
      width: { size: CAF_PORTRAIT_W, type: window.docx.WidthType.DXA },
      layout: window.docx.TableLayoutType.FIXED
    }));

    var tail = [ h1("Method and limitations") ];
    tail.push(body("Each " + noun + " was assessed separately against " + instrument.title +
      ". The organisation-wide result for a requirement is the result at the weakest " + noun + " that was assessed; " +
      "no averaging, majority or compensation is applied between " + nounP + ", and a strong " + noun +
      " never offsets a weak one."));
    tail.push(body("Requirements not assessed at a " + noun + " are excluded from that " + noun +
      "'s contribution and named under Coverage; they are never treated as met. Requirements answered Unknown reduce " +
      "confidence in the same way."));
    tail.push(body("This document is the cross-" + noun + " picture only. Evidence, recommended actions and owners are " +
      "recorded per " + noun + " and appear in each " + noun + "'s own report."));
    // This document has no About section, but its tables quote the
    // framework's requirement wording, so the licence that wording is
    // reproduced under goes with it, here where the source is named.
    tail = tail.concat(attributionParas(instrument, true));

    return { intro: children, wide: wideTable, per: per, tail: tail, roll: roll, nounP: nounP };
  }

  function buildOrgWideDoc(engagement, instrument, taxonomy, profile, opts, callback) {
    try {
      var parts = orgWideSections(engagement, instrument, profile, taxonomy, opts);
      var client = (engagement.engagement && engagement.engagement.clientName) || "Client";
      var coverChildren = coverDesignB(engagement, instrument, {
        subLine: instrument.title + " - organisation-wide position across " +
                 parts.roll.siteCount + " " + parts.nounP
      });
      var intro = []
        .concat(nis2DocumentControl(engagement, instrument, opts)).concat([pageBreakPara()])
        .concat(parts.intro);
      var tail = []
        .concat(parts.per)
        .concat(basisOfAssessmentSection(engagement))
        .concat(parts.tail);

      var PO = docPO();
      var coverProps = { page: { size: { width: DOC_A4_W, height: DOC_A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } };
      var doc = makeDoc(engagement, {
        creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
        title: instrument.title + " - organisation-wide - " + client,
        description: "Organisation-wide position across sites",
        styles: buildStyles(),
        sections: [
          { properties: coverProps, children: coverChildren }
        ].concat(bodySectionsFromSegments(
          brandHeaders(), brandFootersDoc(instrument, engagement), [
          { land: false, children: intro },
          { land: true,  children: parts.wide },
          { land: false, children: tail }
        ]))
      }, opts);
      // download() hands the second argument straight to downloadBlob, so every
      // builder returns a BLOB, not the Document.
      packDoc(doc, opts, callback);
    } catch (e) { callback(e); }
  }

  // A builder that throws before its first callback still answers: the
  // ready-to-issue check runs after every edit and must never be left waiting.
  function buildAsync(engagement, instrument, taxonomy, profile, narrative, opts, callback) {
    var answered = false;
    function once(err, out) { if (answered) return; answered = true; callback(err, out); }
    try { buildDispatch(engagement, instrument, taxonomy, profile, narrative, opts, once); }
    catch (e) { once(e); }
  }

  function buildDispatch(engagement, instrument, taxonomy, profile, narrative, opts, callback) {
    if (!window.docx) {
      callback(new Error("docx library not loaded. Place docx.umd.js into /vendor."));
      return;
    }
    opts = opts || {};

    // Fill the client's (and, where it matters, the target's) name into the
    // pack before any family builder sees it: boilerplate is printed verbatim
    // in a dozen places, and none of them should say "the organisation named
    // on the title page" when we know exactly who that is.
    var R0 = window.App.Report;
    if (narrative && R0 && R0.personaliseNarrative) {
      var tgt = ((engagement && engagement.targets) || []).filter(function (t) { return t.id === opts.targetId; })[0];
      narrative = R0.personaliseNarrative(narrative, engagement, instrument, tgt);
    }

    // The organisation-wide document is its own shape, across every selected
    // site, so it is dispatched before any per-family per-site builder.
    if (opts.orgWide) {
      buildOrgWideDoc(engagement, instrument, taxonomy, profile, opts, callback);
      return;
    }

    if (instrument.scoringFamily === "csms-conformance") {
      if (window.App.ScoringCRA && window.App.ScoringCRA.isCRA(instrument)) {
        buildCRADoc(engagement, instrument, profile, opts, callback);
      } else {
        buildCSMSDoc(engagement, instrument, profile, narrative, opts, callback);
      }
      return;
    }

    // program-maturity-ml renders from the instrument framing + fixed chassis
    // strings, plus an optional narrative pack (executive summary + caveat).
    // Dispatch before the generic narrative validation so a missing pack does
    // not abort it - the composed exec summary degrades to the bullet summary.
    if (instrument.scoringFamily === "program-maturity-ml") {
      buildProgramMLDoc(engagement, instrument, profile, narrative, opts, callback);
      return;
    }

    // nis2-conformance has no narrative pack; renders from instrument framing
    // + fixed chassis strings. Dispatch before the narrative validation.
    if (instrument.scoringFamily === "nis2-conformance") {
      buildNIS2Doc(engagement, instrument, profile, narrative, opts, callback);
      return;
    }

    // risk-appetite-coherence ships no narrative pack either: its prose is
    // composed from the two characterisations and the verdict, which is the
    // only thing there is to say. Dispatch before the narrative validation.
    if (instrument.scoringFamily === "risk-appetite-coherence") {
      buildRiskAppetiteDoc(engagement, instrument, profile, narrative, opts, callback);
      return;
    }

    if (!narrative || !narrative.boilerplate || !narrative.templates) {
      callback(new Error("Narrative content pack missing or invalid for instrument '" + (instrument && instrument.id) + "'. Ensure data/instruments/" + (instrument && instrument.id) + "/narrative.json exists and run scripts/build-data.ps1."));
      return;
    }

    if (instrument.scoringFamily === "domain-letter") {
      buildPostureDoc(engagement, instrument, profile, narrative, opts, callback);
      return;
    }

    if (instrument.scoringFamily === "caf-achieved") {
      buildCAFDoc(engagement, instrument, profile, narrative, opts, callback);
      return;
    }

    if (!narrative.fr_narrative) {
      callback(new Error("Narrative content pack for capability-sl instrument '" + instrument.id + "' is missing fr_narrative."));
      return;
    }

    if ((engagement.targets || []).length > 1 && !opts.singleSite) {
      buildSLMultiSite(engagement, instrument, taxonomy, profile, narrative, opts, callback);
      return;
    }
    var scoredAll = window.App.Scoring.scoreEngagement(engagement, instrument, taxonomy, profile);
    var target = engagement.targets.filter(function (t) { return t.id === opts.targetId; })[0] || engagement.targets[0];
    var scored = scoredAll.perTarget.filter(function (t) { return t.target.id === target.id; })[0].result;
    scored._taxonomy = taxonomy;

    makeChartBlob(window.App.Charts.radar, scored, taxonomy, { size: 420 }, function (radarBlob) {
      blobBuf(radarBlob, function (radarBuf) {
       // Every builder answers its callback, error or not: a check that never
       // came back would leave the report page waiting for good.
       try {
        var coverChildren = coverDesignB(engagement, instrument, { subLine: instrument.edition ? (instrument.edition + " edition") : "ISA/IEC 62443 system security assessment" });
        // Executive summary leads; the not-a-certification caveat closes it; the
        // scorecard sits on its own page; the roadmap is now prose (replacing the
        // gap-register table and the blank recommendation/roadmap scaffolds).
        var bodyChildren = []
          .concat(documentControl(engagement, instrument, opts)).concat([pageBreakPara()])
          .concat(slExecutiveSummary(narrative, scored, engagement))
          .concat(execSummaryAddenda(engagement, opts.progress))
          .concat(slNotCertificationCaveatBlock(narrative))
          .concat([pageBreakPara()])
          .concat(slScorecardDesignB(scored, taxonomy, radarBuf, instrument,
                                     Object.assign({}, opts, { engagement: engagement })))
          .concat([pageBreakPara()])
          .concat(aboutSection(narrative, instrument))
          .concat(scopeAndMethod(narrative, engagement, instrument, scored))
          .concat(howToRead(narrative))
          .concat(slGlossary(instrument, taxonomy, narrative, engagement))
          .concat(overallPosture(scored, target, taxonomy, null))
          .concat(findingsByFR(narrative, scored, taxonomy, engagement, target.id))
          .concat(slRoadmapSection(scored, taxonomy, instrument, engagement, target.id))
          .concat(slSharedActions(scoredAll, instrument))
          .concat(progressSection(opts.progress))
          .concat(basisOfAssessmentSection(engagement))
          .concat(limitationsSection(narrative, scored, taxonomy, engagement))
          .concat(reportTailSections(instrument, engagement, scored, opts && opts.targetId));

        var PO = (window.docx && window.docx.PageOrientation) || { PORTRAIT: "portrait" };
        var A4_W = 11906, A4_H = 16838;
        var doc = makeDoc(engagement, {
          creator: (engagement.engagement && engagement.engagement.consultant) || "OT Cyber Assessment Tool",
          title:   instrument.title + " - " + ((engagement.engagement && engagement.engagement.clientName) || "Client"),
          description: "Executive site security assessment",
          styles: buildStyles(),
          sections: [
            { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 } } }, children: coverChildren },
            { properties: { page: { size: { width: A4_W, height: A4_H, orientation: PO.PORTRAIT }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, headers: brandHeaders(), footers: brandFootersDoc(instrument, engagement), children: bodyChildren }
          ]
        }, opts);

        packDoc(doc, opts, callback);
       } catch (e) { callback(e); }
      });
    }, opts);
  }

  function download(engagement, instrument, taxonomy, profile, narrative, opts) {
    // opts.onDone (if provided) fires after the download is triggered or on
    // failure - used by the export-scope loop to sequence per-target files.
    buildAsync(engagement, instrument, taxonomy, profile, narrative, opts, function (err, blob) {
      if (err) {
        if (window.App.UI && window.App.UI.toast) window.App.UI.toast("Word export failed: " + err.message, "err");
        console.error(err);
        if (opts && typeof opts.onDone === "function") opts.onDone(err);
        return;
      }
      window.App.Storage.downloadBlob(blob, docxFilename(engagement, opts));
      if (opts && typeof opts.onDone === "function") opts.onDone(null);
    });
  }

  // A draft says so in its name; the final carries the plain name.
  function docxFilename(engagement, opts) {
    var base = (opts && opts.filenameHint) || window.App.Storage.suggestedFilename(engagement).replace(/\.json$/, "");
    return base + (isFinal(opts) ? "" : "-draft") + ".docx";
  }

  // The ready-to-issue check: the same build the export runs, stopped before
  // anything is written. cb(err, { placeholders: [{ text, where }] }) lists
  // everything that would print red, after the consultant's section
  // overrides. Draft or final makes no difference to what is listed.
  function issueCheck(engagement, instrument, taxonomy, profile, narrative, opts, cb) {
    var o = Object.assign({}, opts || {}, { issueCheck: true, issueStatus: "draft" });
    delete o.onDone;
    buildAsync(engagement, instrument, taxonomy, profile, narrative, o, function (err, res) {
      if (err) { cb(err); return; }
      cb(null, { placeholders: (res && res.placeholders) || [] });
    });
  }

  return { buildAsync: buildAsync, download: download, issueCheck: issueCheck, docxFilename: docxFilename,
    // METHODOLOGY_LINES kept for back-compat; methodologyLinesFor is what the
    // Excel "Read me" sheet should use, so a CAF or NIS2 workbook stops
    // describing SL target scoring that does not apply to it.
    METHODOLOGY_LINES: METHODOLOGY_LINES, methodologyLinesFor: methodologyLinesFor,
    execSummaryAddendaText: execSummaryAddendaText,
    // Exposed for the regression suite: the section-override pass is the only
    // thing standing between a consultant's edits and the Word document.
    __applyReportCustom: applyReportCustom };
})();
