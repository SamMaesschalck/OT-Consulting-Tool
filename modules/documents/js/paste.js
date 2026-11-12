/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* paste.js: App.DocPaste, reads the clipboard or a drop into blocks, and writes what a copy puts there (docs/document-tool-design.md 5.2, 5.3). */
(function () {
  "use strict";
  window.App = window.App || {};

  // Looked up at call time, so a test may swap any of them for a fake.
  function M() { return window.App.DocModel; }
  function A() { return window.App.DocApp; }

  // The clipboard type of our own blocks, and the format name inside it.
  var TYPE = "application/x-spt-doc-blocks";
  var FORMAT = "spt-doc-blocks/1";
  var MB = 1024 * 1024;
  var LIMITS = {
    htmlChars: 5 * MB,      // pasted HTML whose markup is over this is pasted as plain text (5.3)
    htmlRaw: 60 * MB,       // and so is HTML over this with its pictures counted in
    pictureBytes: 5 * MB,   // one picture inside pasted HTML (3.5)
    ownBytes: 20 * MB,      // pictures and parts carried with a copy of our own blocks
    depth: 200,             // elements nested deeper than this are read as plain text
    cols: 63,               // Word's widest table
    rowSpan: 500,
    link: 2048
  };
  // The printed width of a portrait page in px (design 3.5); the writer clamps
  // again, this only stops a pasted screenshot arriving three pages wide.
  var PAGE_PX = 601;

  var ALIGN = { center: "center", right: "right", justify: "justify" };
  var RASTER = /^data:(image\/(?:png|jpeg|jpg|gif|bmp|webp));base64,/i;
  var MONO = /consolas|courier new|lucida console|cascadia (mono|code)/i;

  function empty(source) { return { blocks: [], media: {}, parts: {}, skippedPictures: 0, source: source || "none" }; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function nid(doc, prefix) { return doc ? M().newId(doc, prefix || "b") : ""; }

  // Text from outside. Line ends become newlines; control characters go, and so
  // do the zero-width characters the editor uses around a footnote mark and the
  // private-use character the Word writer marks a kept drawing's place with.
  // U+FFFE, U+FFFF and half of a surrogate pair go too: a Word file cannot
  // hold them (text copied out of a PDF brings them).
  function cleanText(s) {
    return String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\uFEFF\uE000\uFFFE\uFFFF]/g, "")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, function (m) { return m.length === 2 ? m : ""; });
  }
  // An address is kept only when it is plainly http, https or mailto. Browsers
  // ignore tabs and newlines inside an address, so they are taken out before
  // the test and "java\nscript:" is seen for what it is.
  function safeLink(href) {
    var s = String(href == null ? "" : href).replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (s.length > LIMITS.link || /\s/.test(s)) return "";
    return /^(https?:\/\/[^\/]|mailto:[^\s]+@)/i.test(s) ? s : "";
  }
  function skippedMessage(n) {
    if (!n) return "";
    return n === 1
      ? "1 picture could not be pasted. Insert it from a file, or load the Word file to bring everything across."
      : n + " pictures could not be pasted. Insert them from a file, or load the Word file to bring everything across.";
  }

  // ---- blocks ----------------------------------------------------------

  function para(doc, runs) { return { id: nid(doc), type: "paragraph", runs: runs }; }
  // What stands where a picture or drawing could not be brought. A cell holds
  // no prompt blocks, so there it is a paragraph of red text.
  function placeholder(doc, text, inCell) {
    return inCell ? para(doc, [{ t: text, red: true }]) : { id: nid(doc), type: "prompt", text: text };
  }
  var NO_PICTURE = "A picture was not pasted here. Insert it from a file.";
  var NO_DRAWING = "A drawing was not pasted here. Load the Word file it came from to bring it across.";

  function eachBlock(blocks, fn) {
    (blocks || []).forEach(function (b) {
      fn(b);
      if (b.type === "table") (b.rows || []).forEach(function (row) { (row.cells || []).forEach(function (cell) { eachBlock(cell.blocks, fn); }); });
    });
  }
  // The same list with each block replaced by what fn returns for it (null
  // drops it), cells included.
  function mapBlocks(blocks, fn, inCell) {
    var out = [];
    (blocks || []).forEach(function (b) {
      var nb = fn(b, !!inCell);
      if (!nb) return;
      if (nb.type === "table") (nb.rows || []).forEach(function (row) { (row.cells || []).forEach(function (cell) { cell.blocks = mapBlocks(cell.blocks, fn, true); }); });
      out.push(nb);
    });
    return out;
  }
  // Lays cells out on a grid as a browser does, so every position is covered
  // exactly once whatever the spans claimed: spans are cut back where they
  // would overlap or run off the table, and short rows are filled with empty
  // cells. rows is [[{ blocks, span, rowSpan }]]; returns { rows, cols }.
  function gridRows(rows, doc) {
    var occ = rows.map(function () { return []; }), out = [], width = 0;
    rows.forEach(function (cells, r) {
      var c = 0, row = [];
      cells.forEach(function (cell, i) {
        while (occ[r][c]) c++;
        // A span may not push the cells after it past the widest table.
        var span = Math.max(1, Math.min(cell.span || 1, LIMITS.cols - c - (cells.length - 1 - i)));
        var down = Math.max(1, Math.min(LIMITS.rowSpan, cell.rowSpan || 1, rows.length - r));
        for (var k = 1; k < span; k++) if (occ[r][c + k]) { span = k; break; }
        for (var rr = r; rr < r + down; rr++) for (var cc = c; cc < c + span; cc++) occ[rr][cc] = true;
        var o = { blocks: cell.blocks && cell.blocks.length ? cell.blocks : [para(doc, [])] };
        if (span > 1) o.span = span;
        if (down > 1) o.rowSpan = down;
        row.push({ at: c, cell: o });
        c += span;
        if (c > width) width = c;
      });
      out.push(row);
    });
    out = out.map(function (row, r) {
      for (var c = 0; c < width; c++) if (!occ[r][c]) row.push({ at: c, cell: { blocks: [para(doc, [])] } });
      return { cells: row.sort(function (a, b) { return a.at - b.at; }).map(function (x) { return x.cell; }) };
    });
    return { rows: out, cols: width };
  }

  // ---- plain text ------------------------------------------------------

  // Blank lines split paragraphs; a single newline stays a line break.
  function fromText(text, doc) {
    var out = empty("text");
    cleanText(text).split(/\n[ \t]*(?:\n[ \t]*)+/).forEach(function (p) {
      p = p.replace(/^\n+|\s+$/g, "");
      if (/[^\s\u00A0]/.test(p)) out.blocks.push(para(doc, [{ t: p }]));
    });
    if (out.blocks.length === 1) out.inlineRuns = out.blocks[0].runs;
    return out;
  }

  // ---- HTML ------------------------------------------------------------
  //
  // The HTML is parsed into a document of its own, which never runs a script,
  // loads a picture or fires an event, and is only ever read: blocks are built
  // from what is recognised and everything else is left behind. Nothing from it
  // is put into the page.

  // A base element is the one thing the page's own policy is asked about even
  // in a document that is never shown (base-uri). It would change nothing we
  // read, so it is spelt out of existence first and no violation is reported.
  function parse(html) { return new DOMParser().parseFromString(String(html).replace(/<base(?=[\s>\/])/gi, "<x-base"), "text/html"); }

  var SKIP = {};
  ("script style head title meta link base template noscript iframe frame frameset object embed applet svg math canvas " +
   "video audio source track map area input textarea select option optgroup button datalist dialog o:p").split(" ").forEach(function (t) { SKIP[t] = 1; });
  var BLOCK = {};
  ("html body div section article blockquote thead tbody tfoot tr td th caption colgroup dl dt dd figure figcaption header footer main nav " +
   "aside address fieldset form details summary center hr").split(" ").forEach(function (t) { BLOCK[t] = 1; });
  var INLINE = {
    b: { b: 1 }, strong: { b: 1 }, i: { i: 1 }, em: { i: 1 }, u: { u: 1 }, ins: { u: 1 }, s: { s: 1 }, strike: { s: 1 }, del: { s: 1 },
    sup: { sup: 1 }, sub: { sub: 1 }, code: { code: 1 }, kbd: { code: 1 }, samp: { code: 1 }, tt: { code: 1 }
  };
  var FLAGS = ["b", "i", "u", "s", "sup", "sub", "code", "red"];

  function fmtKey(f) {
    return FLAGS.map(function (k) { return f[k] ? k : ""; }).join(",") + (f.link ? "|" + f.link : "");
  }
  function derive(f, change) {
    var out = {}, k;
    for (k in f) out[k] = f[k];
    for (k in change) { if (change[k]) out[k] = change[k]; else delete out[k]; }
    // Never both (the contract): the inner one wins.
    if (change.sup) delete out.sub;
    if (change.sub) delete out.sup;
    return out;
  }
  // What an element's own style says about its text. Only the meaning the
  // model has is read; colour, font and size are the house style's to decide.
  // Two exceptions carry meaning and not looks: a fixed-width font is code,
  // and the template's own prompt red is a prompt.
  function styleFmt(style) {
    var ch = {}, m;
    if ((m = prop(style, "font-weight"))) ch.b = /^(bold|bolder|[6-9]00)$/i.test(m);
    if ((m = prop(style, "font-style"))) ch.i = /^(italic|oblique)$/i.test(m);
    if ((m = prop(style, "text-decoration") || prop(style, "text-decoration-line"))) { ch.u = /underline/i.test(m); ch.s = /line-through/i.test(m); }
    if ((m = /^(super|sub)$/i.exec(prop(style, "vertical-align")))) ch[m[1].toLowerCase() === "super" ? "sup" : "sub"] = true;
    if (MONO.test(prop(style, "font-family"))) ch.code = true;
    if (/^(#e00000|rgb\(\s*224\s*,\s*0\s*,\s*0\s*\))$/i.test(prop(style, "color"))) ch.red = true;
    return ch;
  }
  // One property's value. The name must start the declaration: Word writes
  // mso-bidi-font-weight beside font-weight, and they are not the same thing.
  function prop(style, name) {
    var m = new RegExp("(?:^|;)\\s*" + name + "\\s*:\\s*([^;]+)", "i").exec(style);
    return m ? m[1].trim() : "";
  }
  // As in prop(), the name must start its declaration: backface-visibility:
  // hidden is written on text that is in plain sight.
  var HIDDEN = /(?:^|;)\s*(?:display\s*:\s*none|(?:content-)?visibility\s*:\s*(?:hidden|collapse)|mso-hide\s*:\s*all)\b/i;
  function hidden(el, style) {
    return el.hasAttribute("hidden") || HIDDEN.test(style);
  }
  // What Word writes for a review comment: the mark in the text, and the
  // list of comments after the last paragraph.
  var COMMENT_CLASS = /(?:^|\s)(?:MsoCommentReference|msocomanchor|msocomtxt|msocomoff)(?:\s|$)/i;
  var COMMENT_STYLE = /(?:^|;)\s*(?:mso-element\s*:\s*comment(?:-list)?|mso-special-character\s*:\s*comment)\b/i;
  var COMMENT_ONE = /(?:^|;)\s*mso-element\s*:\s*comment\s*(?:;|$)/i;
  // Its footnotes and endnotes: the list of them, and the mark in the text.
  var NOTE_STYLE = /(?:^|;)\s*mso-element\s*:\s*(?:footnote|endnote)(?:-list|-separator|-continuation-separator|-continuation-notice)?\b/i;
  var NOTE_ONE = /(?:^|;)\s*mso-element\s*:\s*(?:footnote|endnote)\s*(?:;|$)/i;
  var NOTE_ID = /(?:^|;)\s*mso-(?:footnote|endnote)-id\s*:\s*([A-Za-z0-9_\-]+)/i;
  function hasClass(el, name) { return new RegExp("(?:^|\\s)" + name + "(?:\\s|$)", "i").test(el.getAttribute("class") || ""); }
  // A change Word tracked, as against a del or ins someone wrote in a web
  // page: Word names who and when, and wraps it in a span of its own.
  function tracked(el, kind) {
    return el.hasAttribute("cite") || el.hasAttribute("datetime") || (!!el.parentNode && el.parentNode.nodeType === 1 && hasClass(el.parentNode, kind));
  }

  // The runs of the block being read. Whitespace collapses as it does on a web
  // page: runs of it become one space, none at the start or the end.
  function Acc() { this.runs = []; this.gap = true; }
  Acc.prototype.push = function (text, f) {
    var key = fmtKey(f), last = this.runs[this.runs.length - 1];
    if (last && last.k === key) last.t += text; else this.runs.push({ t: text, f: f, k: key });
  };
  Acc.prototype.add = function (text, f, pre) {
    text = cleanText(text);
    if (!pre) {
      text = text.replace(/[ \t\n\f]+/g, " ");
      if (this.gap && text.charAt(0) === " ") text = text.slice(1);
    }
    if (!text) return;
    this.gap = !pre && text.charAt(text.length - 1) === " ";
    this.push(text, f);
  };
  // A footnote reference: a run of its own with no text, never joined to
  // its neighbours.
  Acc.prototype.note = function (key) {
    this.runs.push({ t: "", f: {}, k: "fn " + key, fn: key });
    this.gap = false;
  };
  Acc.prototype.trim = function () {
    while (this.runs.length) {
      var last = this.runs[this.runs.length - 1];
      if (last.fn) break;
      last.t = last.t.replace(/[ \t\n]+$/, "");
      if (last.t) break;
      this.runs.pop();
    }
  };
  // A line break takes the format where it stands, so one after a link is
  // not part of the link.
  Acc.prototype.newline = function (f) {
    this.trim();
    if (this.runs.length) this.push("\n", f);
    this.gap = true;
  };
  Acc.prototype.finish = function (plain) {
    this.trim();
    var runs = this.runs, any = runs.some(function (r) { return r.fn || /[^\s\u00A0]/.test(r.t); });
    this.runs = []; this.gap = true;
    if (!any) return [];
    var out = [];
    runs.forEach(function (r) {
      if (r.fn) { out.push({ t: "", fn: r.fn }); return; }
      var o = { t: r.t }, last = out[out.length - 1];
      FLAGS.forEach(function (k) { if (r.f[k] && !(plain && (k === "b" || k === "i"))) o[k] = true; });
      if (r.f.link) o.link = r.f.link;
      // Runs that differed only in what a heading does not keep are one run.
      if (last && !last.fn && fmtKey(last) === fmtKey(o)) last.t += o.t; else out.push(o);
    });
    return out;
  };

  // One state per place blocks are collected: the body, or one table cell.
  // `all` is shared by every state of one paste.
  function state(all, inCell) {
    return { all: all, out: [], acc: new Acc(), inCell: !!inCell, kind: null, align: "", lists: [], li: null, pre: 0 };
  }
  function flush(S) {
    var kind = S.kind, runs = S.acc.finish(kind && kind.type === "heading");
    if (!runs.length) return;
    var doc = S.all.doc, b;
    if (kind && kind.type === "heading") {
      b = { id: nid(doc), type: "heading", level: kind.level, runs: runs };
    } else if (kind && kind.type === "list") {
      // A Word list paragraph: bulleted or numbered by the marker Word typed.
      // A bullet is a symbol, or a bare "o"; a number holds a digit, or is a
      // letter or roman numeral with its full stop or bracket.
      var mk = S.all.marker.trim();
      b = listItem(S, /\d/.test(mk) || /^[\(\[]?[a-z]{1,4}[\.\)\]]$/i.test(mk) ? "number" : "bullet", kind.level, runs, kind.src, mk);
    } else if (S.li && S.li.item && S.out[S.out.length - 1] === S.li.item) {
      // A second paragraph inside one list item stays in that item, on a new
      // line: it must not take the next number.
      if (!runs[0].fn && fmtKey(runs[0]) === "") runs[0].t = "\n" + runs[0].t; else runs.unshift({ t: "\n" });
      S.li.item.runs = S.li.item.runs.concat(runs);
      return;
    } else if (S.li && S.li.item) {
      // Text after a picture, a table or an inner list in the same item is
      // still that item: a paragraph, which takes no number of its own.
      b = para(doc, runs);
    } else if (S.li) {
      var list = S.lists[S.lists.length - 1] || { tag: "ul", src: null };
      b = S.li.item = listItem(S, list.tag === "ol" ? "number" : "bullet", Math.min(2, Math.max(0, S.lists.length - 1)), runs, (S.lists[0] || list).src);
    } else {
      b = para(doc, runs);
      if (S.align) b.align = S.align;
    }
    S.out.push(b);
  }
  // `src` is the list the item came from. Two numbered lists with nothing
  // between them would otherwise run on as one, so the second starts again.
  //
  // The other way round, a numbered list that carries on after a paragraph or
  // a picture (a procedure with its screenshots) must not start again at 1:
  // the item is marked to continue. `all.num` is the numbered list this paste
  // last added to: where it is (a table cell is a flow of its own), which
  // list it came from, and how many first-level items it has so far.
  //
  // `typed` is the marker Word typed in front of the item. It is kept beside
  // the block until the paste is whole, so what will print can be checked
  // against it (renumbered()).
  function listItem(S, list, level, runs, src, typed) {
    var all = S.all, b = { id: nid(all.doc), type: "list", list: list, level: level, runs: runs };
    var prev = S.out[S.out.length - 1], num = all.num;
    if (list === "number") {
      var after = !!prev && prev.type === "list";
      // Word typed a 1: whatever came before, this list starts here.
      var one = typed != null && level === 0 && /^[\(\[]?0*1[\.\)\]]?$/.test(typed);
      if (after) { if (level === 0 && prev.list === "number" && (S.lastSrc !== src || one)) b.restart = true; }
      else if (num && num.S === S && num.src === src && !one) b["continue"] = true;
      var on = b["continue"] || (after && !b.restart && num && num.S === S);
      all.num = { S: S, src: src, n: (on ? num.n : 0) + (level === 0 ? 1 : 0) };
      if (typed != null) all.typed.push({ block: b, typed: typed });
    }
    S.lastSrc = src;
    return b;
  }
  // How many numbered items Word showed with a number or a letter that will
  // not be the one printed here (a list that started at 5, letters where the
  // house style has numbers). The numbering rule is the writer's own.
  function renumbered(all, blocks) {
    var HD = window.App.HouseDocx, nums = null, n = 0;
    function bare(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
    if (!all.typed.length || !all.doc) return 0;
    try { nums = HD && HD.listNumbers && HD.listNumbers(blocks); } catch (e) {}
    all.typed.forEach(function (x) {
      var m = nums && nums[x.block.id];
      // Without the writer's rule, only what is certain: the first level
      // prints numbers, so a letter there has changed.
      if (nums ? (m && bare(m.marker) !== bare(x.typed)) : (x.block.level === 0 && !/\d/.test(x.typed))) n++;
    });
    return n;
  }

  // The text under an element, read without recursion. Used past the depth
  // limit, where a hostile paste could otherwise run the walker out of stack.
  function deepText(el) {
    var w = el.ownerDocument.createTreeWalker(el, 4 /* SHOW_TEXT */), out = "", n;
    while ((n = w.nextNode())) {
      var p = n.parentNode && n.parentNode.localName;
      if (!SKIP[p]) out += n.data + " ";
    }
    return out;
  }

  function walk(node, f, S, depth) {
    for (var n = node.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        if (S.all.ignore) S.all.marker += n.data; else S.acc.add(n.data, f, S.pre > 0);
      } else if (n.nodeType === 8) {
        // Word wraps a list item's typed marker in <![if !supportLists]> and
        // <![endif]>, which an HTML parser reads as two comments.
        if (/^\[if !supportLists\]/i.test(n.data)) S.all.ignore = true;
        else if (/^\[endif\]/i.test(n.data)) S.all.ignore = false;
      } else if (n.nodeType === 1) {
        element(n, f, S, depth);
      }
    }
  }
  function blockOf(el, f, S, depth) {
    flush(S);
    walk(el, f, S, depth + 1);
    flush(S);
    // A marker Word left open must not swallow the blocks that follow.
    S.all.ignore = false;
  }
  function element(el, f, S, depth) {
    var tag = el.localName;
    // Word's own namespaced markup: o:p is an empty paragraph mark, v: is VML.
    if (SKIP[tag] || /^v:/.test(tag)) return;
    var style = el.getAttribute("style") || "";
    if (hidden(el, style)) return;
    if (/mso-list:\s*ignore/i.test(style)) { S.all.marker += el.textContent; return; }
    if (S.all.ignore) { S.all.marker += el.textContent; return; }
    if (depth > LIMITS.depth) { S.acc.add(deepText(el), f, false); return; }
    // A review comment is never content: not its mark in the text, and not
    // the comment itself. The words it was made on are ordinary text.
    if (COMMENT_STYLE.test(style) || COMMENT_CLASS.test(el.getAttribute("class") || "")) {
      if (hasClass(el, "MsoCommentReference")) S.all.comments++;
      else if (COMMENT_ONE.test(style)) S.all.commentTexts++;
      else Array.prototype.forEach.call(el.querySelectorAll("[style]"), function (x) { if (COMMENT_ONE.test(x.getAttribute("style"))) S.all.commentTexts++; });
      return;
    }
    // Tracked changes are settled as the Word import settles them: what was
    // deleted is left out, what was inserted is ordinary text.
    if (tag === "del" && tracked(el, "msoDel")) { S.all.tracked = true; return; }
    if (tag === "ins" && tracked(el, "msoIns")) { S.all.tracked = true; walk(el, f, S, depth + 1); return; }
    // A footnote or an endnote is read from its mark in the text, so the
    // list of them after the last paragraph is not read a second time.
    if (NOTE_STYLE.test(style)) return;
    var mark = tag === "a" && NOTE_ID.exec(style);
    if (mark) { footnote(mark[1], S); return; }
    if (style) {
      if (/mso-tab-count/i.test(style)) { S.acc.push("\t", f); S.acc.gap = true; return; }
      if (/mso-spacerun/i.test(style)) { S.acc.add(" ", f, false); return; }
      f = derive(f, styleFmt(style));
    }
    if (INLINE[tag]) {
      // The tag says so unless its own style takes it back, as the bold
      // element Google Docs wraps a whole copy in does (font-weight: normal).
      var ch = derive(INLINE[tag], styleFmt(style));
      walk(el, derive(f, ch), S, depth + 1);
      return;
    }
    if (/^h[1-6]$/.test(tag)) {
      flush(S);
      // A heading has no place in a cell or a list item: there it is a paragraph.
      if (!S.inCell && !S.li) S.kind = { type: "heading", level: Math.min(3, Number(tag.charAt(1))) };
      walk(el, f, S, depth + 1);
      flush(S);
      S.kind = null; S.all.ignore = false;
      return;
    }
    switch (tag) {
      case "br":
        if (/page-break-before:\s*always/i.test(style) && !S.inCell && !S.li) { flush(S); S.out.push({ id: nid(S.all.doc), type: "pageBreak" }); }
        else S.acc.newline(f);
        return;
      case "img": picture(el, S); return;
      case "a":
        var link = safeLink(el.getAttribute("href"));
        walk(el, link ? derive(f, { link: link }) : f, S, depth + 1);
        return;
      case "p":
        flush(S);
        var wl = /mso-list:\s*l(\d+)\s+level(\d+)/i.exec(style);
        if (wl && !S.li) { S.kind = { type: "list", level: Math.min(2, Math.max(0, Number(wl[2]) - 1)), src: "word-l" + wl[1] }; S.all.marker = ""; }
        S.align = ALIGN[String(prop(style, "text-align") || el.getAttribute("align") || "").toLowerCase()] || "";
        walk(el, f, S, depth + 1);
        flush(S);
        S.kind = null; S.align = ""; S.all.ignore = false;
        return;
      case "pre":
        flush(S); S.pre++;
        walk(el, derive(f, { code: true }), S, depth + 1);
        flush(S); S.pre--;
        return;
      case "ul": case "ol": case "menu":
        flush(S);
        var entry = { tag: tag === "ol" ? "ol" : "ul", src: el };
        if (entry.tag === "ol" && !S.lists.length && el.querySelector("li")) {
          // A list that says where it starts. The model has no start number,
          // so it is met only by carrying on the numbered list before it,
          // when that list stopped one short. Otherwise, and for letters or
          // numerals at the first level, the user is told.
          var start = parseInt(el.getAttribute("start"), 10), num = S.all.num;
          if (start > 1 && num && num.S === S && num.n === start - 1) entry.src = num.src;
          else if ((start === start && start !== 1) || /^[ai]$/i.test(el.getAttribute("type") || "") || /alpha|roman|latin|greek/i.test(prop(style, "list-style-type") || prop(style, "list-style"))) S.all.renumbered++;
        }
        S.lists.push(entry);
        var outer = S.li; S.li = null;
        walk(el, f, S, depth + 1);
        flush(S);
        S.li = outer; S.lists.pop();
        return;
      case "li":
        flush(S);
        var was = S.li; S.li = { item: null };
        walk(el, f, S, depth + 1);
        flush(S);
        S.li = was;
        return;
      case "table":
        flush(S);
        // A table inside a cell is unwrapped into the cell, as import does.
        if (S.inCell) blockOf(el, f, S, depth); else tableBlock(el, f, S, depth);
        return;
    }
    if (BLOCK[tag]) { blockOf(el, f, S, depth); return; }
    // Anything unrecognised loses its wrapper, not its text.
    walk(el, f, S, depth + 1);
  }

  // A footnote or endnote mark Word wrote in the text. The note is in a list
  // after the last paragraph, under the mark's id: it is read into a footnote
  // of the document, one paragraph as every footnote is, and the mark becomes
  // the reference to it. An endnote becomes a footnote, as it does on import.
  // A mark whose note did not come with the paste is counted, and said.
  function footnote(id, S) {
    var all = S.all, src = all.noteEls[id];
    // Inside a note, the mark is the note's own number at its start.
    if (all.inNote) return;
    if (!src || !all.doc) { all.notesLost++; return; }
    all.noteUsed[id] = true;
    var sub = state(all, true), was = { ignore: all.ignore, marker: all.marker, num: all.num, typed: all.typed.length };
    all.inNote = true; all.ignore = false;
    walk(src, {}, sub, 0);
    flush(sub);
    all.inNote = false; all.ignore = was.ignore; all.marker = was.marker; all.num = was.num; all.typed.length = was.typed;
    var runs = [];
    sub.out.forEach(function (b) {
      if (!b.runs || !b.runs.length) return;
      if (runs.length) runs.push({ t: "\n" });
      runs = runs.concat(b.runs);
    });
    var key = nid(all.doc, "f");
    all.doc.footnotes = all.doc.footnotes || {};
    all.notes[key] = all.doc.footnotes[key] = { runs: M().runs.normalise(runs).filter(function (r) { return !r.fn; }) };
    S.acc.note(key);
  }

  function int(v, max) { var n = parseInt(v, 10); return n > 0 ? Math.min(n, max) : 1; }
  function tableBlock(el, f, S, depth) {
    var doc = S.all.doc;
    var trs = Array.prototype.filter.call(el.rows, function (tr) { return !hidden(tr, tr.getAttribute("style") || ""); });
    var rows = trs.map(function (tr) {
      return Array.prototype.filter.call(tr.cells, function (td) { return !hidden(td, td.getAttribute("style") || ""); }).map(function (td) {
        var sub = state(S.all, true);
        walk(td, f, sub, depth + 1);
        flush(sub);
        S.all.ignore = false;
        return { th: td.localName === "th", blocks: sub.out, span: int(td.getAttribute("colspan"), LIMITS.cols), rowSpan: int(td.getAttribute("rowspan"), LIMITS.rowSpan) };
      });
    }).filter(function (cells) { return cells.length; });
    var count = rows.reduce(function (a, r) { return a + r.length; }, 0);
    if (!count) return;
    var g = gridRows(rows, doc);
    // One cell is a layout wrapper, and a table wider than Word allows cannot
    // be one: both give their cells' content as ordinary blocks.
    if (count === 1 || g.cols > LIMITS.cols) {
      rows.forEach(function (cells) { cells.forEach(function (cell) { cell.blocks.forEach(function (b) { S.out.push(b); }); }); });
      return;
    }
    var b = { id: nid(doc), type: "table", header: 0, cols: colWidths(el, g.cols), rows: g.rows };
    var top = rows[0];
    if (rows.length > 1 && top.every(function (c) { return c.th && c.rowSpan === 1; })) b.header = 1;
    var cap = el.caption ? cleanText(el.caption.textContent).replace(/\s+/g, " ").trim() : "";
    if (cap) b.caption = cap.slice(0, 300);
    S.out.push(b);
  }
  // Relative widths from the table's col elements when they describe every
  // column (Excel and Word write them); otherwise equal.
  function colWidths(el, n) {
    var w = [];
    Array.prototype.forEach.call(el.querySelectorAll("col"), function (col) {
      if (col.closest("table") !== el) return;
      var m = /(?:^|;)\s*width:\s*([\d.]+)(?:px|pt)/i.exec(col.getAttribute("style") || "");
      var v = parseFloat(col.getAttribute("width")) || (m && parseFloat(m[1])) || 0;
      for (var i = int(col.getAttribute("span"), LIMITS.cols); i > 0; i--) w.push(v);
    });
    if (w.length !== n || !w.every(function (v) { return v > 0 && isFinite(v); })) { w = []; while (w.length < n) w.push(1); }
    return w;
  }

  // A picture in pasted HTML is only ever read from the HTML itself (a data:
  // address). Any other address is somewhere else, and nothing is fetched.
  function picture(el, S) {
    var src = el.getAttribute("src") || "";
    var m = RASTER.exec(src.slice(0, 40));
    var w = parseInt(el.getAttribute("width"), 10) || 0, h = parseInt(el.getAttribute("height"), 10) || 0;
    // A spacer or tracking pixel is not a picture anyone misses.
    if ((w > 0 && w <= 2) || (h > 0 && h <= 2)) return;
    // A footnote is one paragraph of text: a picture in it cannot be kept.
    if (!m || S.all.inNote || (src.length - m[0].length) * 0.75 > LIMITS.pictureBytes) { if (src) S.all.skipped++; return; }
    flush(S);
    var b = { id: nid(S.all.doc), type: "picture", media: "", width: w, height: h };
    var alt = cleanText(el.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
    if (alt) b.alt = alt.slice(0, 500);
    S.out.push(b);
    S.all.pending.push({ block: b, list: S.out, type: m[1].toLowerCase().replace("image/jpg", "image/jpeg"), b64: src.slice(m[0].length) });
  }
  function bytesFromBase64(b64) {
    var bin = atob(b64.replace(/\s+/g, "")), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  // A media entry in the memory form (design 3.6), under a new key. It goes
  // into the result and not into the document: whoever lands the paste stores
  // it, and tells the autosave about it in the same step.
  function mediaEntry(doc, out, blob, meta) {
    var key = nid(doc, "m");
    out.media[key] = { type: String(meta.type || blob.type || "").toLowerCase(), name: String(meta.name || ""), width: Math.round(meta.width) || 0,
      height: Math.round(meta.height) || 0, source: meta.source === "import" ? "import" : "insert", blob: blob };
    out.bytes = (out.bytes || 0) + blob.size;
    return key;
  }
  // Takes one picture into the result and fills its block in. Resolves "ok",
  // "no" (a type the tool does not take, or too large a picture) or "full"
  // (the document's size limit, asked for everything this paste has so far).
  function storePicture(file, block, doc, out) {
    return window.App.DocPictures.fromFile(file).then(function (pic) {
      if (!A().canAdd((out.bytes || 0) + pic.blob.size)) { out.full = true; return "full"; }
      var key = mediaEntry(doc, out, pic.blob, { type: pic.type, name: pic.name || file.name, width: pic.width, height: pic.height });
      // The size asked for by the HTML when it gave one, the picture's own
      // otherwise; never wider than the page, and in proportion.
      var w = block.width > 0 && block.height > 0 ? block.width : pic.width, h = block.width > 0 && block.height > 0 ? block.height : pic.height;
      if (w > PAGE_PX) { h = Math.round(h * PAGE_PX / w); w = PAGE_PX; }
      block.media = key; block.width = Math.max(1, Math.round(w)); block.height = Math.max(1, Math.round(h));
      return "ok";
    }, function (err) {
      if (!out.message && err && err.message) out.problem = err.message;
      return "no";
    });
  }

  function plural(n, one, many) { return n === 1 ? one : n + " " + many; }
  // What was left out or changed beside pictures, one sentence each, in the
  // words the import report uses for the same thing.
  function leftOut(all, blocks) {
    var said = [], comments = Math.max(all.comments, all.commentTexts);
    var notes = all.notesLost + Object.keys(all.noteEls).filter(function (id) { return !all.noteUsed[id]; }).length;
    var moved = all.renumbered + renumbered(all, blocks);
    if (comments) said.push(plural(comments, "1 comment was", "comments were") + " not pasted.");
    if (notes) said.push(plural(notes, "1 footnote", "footnotes") + " could not be pasted. Load the Word file to bring " + (notes === 1 ? "it" : "them") + " across.");
    if (all.tracked) said.push("Tracked changes were settled: inserted text was kept and deleted text was left out.");
    if (moved) said.push("Some numbered items do not have the number they had where they were copied from. Check any reference to them in the text.");
    return said;
  }
  // `keep`, when given, is handed what leftOut() said, for a caller that may
  // not use this result (read() goes on to the plain text when the HTML held
  // nothing to paste).
  function fromParsed(parsed, doc, keep) {
    var all = { doc: doc, skipped: 0, pending: [], marker: "", ignore: false, num: null, typed: [], renumbered: 0,
      comments: 0, commentTexts: 0, tracked: false, inNote: false, notes: {}, notesLost: 0, noteEls: Object.create(null), noteUsed: Object.create(null) };
    // Word's footnotes and endnotes, by the id their marks in the text name.
    if (parsed.body) Array.prototype.forEach.call(parsed.body.querySelectorAll("div[id][style]"), function (d) {
      if (NOTE_ONE.test(d.getAttribute("style")) && !all.noteEls[d.id]) all.noteEls[d.id] = d;
    });
    var S = state(all, false);
    if (parsed.body) blockOf(parsed.body, {}, S, 0);
    var out = empty("html");
    out.blocks = S.out;
    if (Object.keys(all.notes).length) out.footnotes = all.notes;
    // Pictures one at a time, so the document's size limit is tested as each
    // arrives.
    var chain = Promise.resolve();
    all.pending.forEach(function (p) {
      chain = chain.then(function () {
        var file;
        try { file = new File([bytesFromBase64(p.b64)], "pasted." + p.type.split("/")[1], { type: p.type }); } catch (e) { return "no"; }
        return out.full ? "full" : storePicture(file, p.block, doc, out);
      }).then(function (how) {
        if (how === "ok") return;
        if (how === "no") all.skipped++;
        var at = p.list.indexOf(p.block);
        if (at >= 0) p.list.splice(at, 1);
      });
    });
    return chain.then(function () {
      // A cell whose only content was a picture that did not arrive.
      eachBlock(out.blocks, function (b) {
        if (b.type === "table") b.rows.forEach(function (row) { row.cells.forEach(function (cell) { if (!cell.blocks.length) cell.blocks.push(para(doc, [])); }); });
      });
      out.skippedPictures = all.skipped;
      out.notes = leftOut(all, out.blocks);
      if (keep) keep.notes = out.notes;
      return done(out);
    });
  }
  function fromHtml(html, doc) { return fromParsed(parse(html), doc); }
  // The length of pasted HTML without the pictures written into it, which
  // are measured one by one when they are read.
  function markupChars(html) {
    var n = html.length, re = /data:[a-z0-9.+\/-]+;base64,[A-Za-z0-9+\/=]+/gi, m;
    while ((m = re.exec(html))) n -= m[0].length;
    return n;
  }

  // Excel puts a bitmap of the copied cells beside its HTML table, so HTML is
  // read before files; but a copied picture arrives as a file beside HTML that
  // is nothing except its img, and then the file is the picture.
  function loneImage(parsed) {
    var body = parsed.body;
    return !!body && body.querySelectorAll("img").length === 1 && !body.querySelector("table") && !/[^\s\u00A0]/.test(body.textContent);
  }

  // ---- picture files ---------------------------------------------------

  function imageFiles(dt) {
    var out = [], i;
    try {
      if (dt.files && dt.files.length) { for (i = 0; i < dt.files.length; i++) out.push(dt.files[i]); }
      else if (dt.items) { for (i = 0; i < dt.items.length; i++) if (dt.items[i].kind === "file") out.push(dt.items[i].getAsFile()); }
    } catch (e) {}
    return out.filter(function (f) { return f && /^image\//i.test(f.type || ""); });
  }
  function fromFiles(files, doc) {
    var out = empty("files"), chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        if (out.full) return;
        var b = { id: nid(doc), type: "picture", media: "", width: 0, height: 0 };
        return storePicture(file, b, doc, out).then(function (how) { if (how === "ok") out.blocks.push(b); else if (how === "no") out.skippedPictures++; });
      });
    });
    return chain.then(function () { return done(out); });
  }

  // ---- our own blocks --------------------------------------------------
  //
  // A copy cannot put picture bytes on the clipboard: the copy event must be
  // answered at once and a Blob can only be read later. So the clipboard holds
  // the blocks as JSON with a token, and the page keeps what was copied (the
  // blocks, and references to their pictures and parts) under that token. A
  // paste in this page finds it and brings everything, kept drawings included.
  // A paste anywhere else (another window, or after a restart) has the JSON
  // only: it is read as untrusted input, and pictures and drawings become
  // placeholders to complete.

  var stash = null, seq = 0;

  function runsText(runs) { return (runs || []).map(function (r) { return r.t || ""; }).join(""); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function runsHtml(runs) {
    return (runs || []).map(function (r) {
      var s = esc(r.t || "").replace(/\n/g, "<br>");
      if (!s) return "";
      [["code", "code"], ["sub", "sub"], ["sup", "sup"], ["s", "s"], ["u", "u"], ["i", "i"], ["b", "b"]].forEach(function (p) { if (r[p[0]]) s = "<" + p[1] + ">" + s + "</" + p[1] + ">"; });
      return r.link ? '<a href="' + esc(r.link) + '">' + s + "</a>" : s;
    }).join("");
  }
  function markers(blocks) {
    var HD = window.App.HouseDocx, out = null;
    try { out = HD && HD.listNumbers && HD.listNumbers(blocks); } catch (e) {}
    return out || {};
  }
  // What a copy offers other programs as text: one line per block, a table's
  // cells separated by tabs.
  function blocksText(blocks) {
    var num = markers(blocks);
    return (blocks || []).map(function (b) {
      if (b.type === "list") return ((num[b.id] && num[b.id].marker) || "•") + " " + runsText(b.runs);
      if (b.type === "prompt") return b.text || "";
      if (b.type === "picture") return b.caption || "";
      if (b.type === "kept") return b.caption || b.text || "";
      if (b.type === "table") {
        return b.rows.map(function (row) {
          return row.cells.map(function (cell) { return blocksText(cell.blocks).replace(/\s*\n\s*/g, " "); }).join("\t");
        }).join("\n") + (b.caption ? "\n" + b.caption : "");
      }
      return runsText(b.runs);
    }).filter(function (s) { return s !== ""; }).join("\n");
  }
  // And as HTML, so a paste into Word or an email keeps headings, lists,
  // tables and formatting. Pictures are not in it (their bytes cannot be).
  function blocksHtml(blocks) {
    var out = "", open = [];
    function closeTo(n) { while (open.length > n) out += "</li></" + open.pop() + ">"; }
    (blocks || []).forEach(function (b) {
      if (b.type === "list") {
        var tag = b.list === "number" ? "ol" : "ul", lvl = Math.max(0, Math.min(2, b.level || 0));
        closeTo(lvl + 1);
        if (open.length === lvl + 1 && open[lvl] !== tag) closeTo(lvl);
        else if (open.length === lvl + 1) out += "</li>";
        while (open.length < lvl + 1) { out += "<" + tag + ">"; open.push(tag); if (open.length < lvl + 1) out += "<li>"; }
        out += "<li>" + runsHtml(b.runs);
        return;
      }
      closeTo(0);
      if (b.type === "heading") out += "<h" + b.level + ">" + runsHtml(b.runs) + "</h" + b.level + ">";
      else if (b.type === "paragraph") out += "<p>" + runsHtml(b.runs) + "</p>";
      else if (b.type === "prompt") out += "<p>" + esc(b.text || "") + "</p>";
      else if (b.type === "table") {
        out += "<table>" + (b.caption ? "<caption>" + esc(b.caption) + "</caption>" : "");
        b.rows.forEach(function (row, r) {
          var t = r < (b.header || 0) ? "th" : "td";
          out += "<tr>" + row.cells.map(function (cell) {
            return "<" + t + (cell.span > 1 ? ' colspan="' + Number(cell.span) + '"' : "") + (cell.rowSpan > 1 ? ' rowspan="' + Number(cell.rowSpan) + '"' : "") + ">" + blocksHtml(cell.blocks) + "</" + t + ">";
          }).join("") + "</tr>";
        });
        out += "</table>";
      } else if ((b.type === "picture" || b.type === "kept") && b.caption) out += "<p>" + esc(b.caption) + "</p>";
    });
    closeTo(0);
    return out;
  }

  // What a copy or a cut puts on the clipboard: { type: string } for each type
  // to set. It also remembers the blocks and their pictures for a paste here.
  function copyPayload(doc, blocks) {
    blocks = (blocks || []).filter(Boolean);
    var held = { token: "c" + (++seq) + "-" + Math.random().toString(36).slice(2, 10), docId: doc.id, blocks: clone(blocks), footnotes: {}, media: {}, parts: {}, theme: "", bytes: 0, full: true };
    var kept = false;
    function part(key) {
      var p = doc.parts && doc.parts[key];
      if (!p || held.parts[key]) return;
      held.parts[key] = p;
      held.bytes += p.blob ? p.blob.size : 0;
      (p.rels || []).forEach(function (r) { if (r.part) part(r.part); });
    }
    function media(key) {
      var m = doc.media && doc.media[key];
      if (!m || held.media[key]) return;
      held.media[key] = m;
      held.bytes += m.blob ? m.blob.size : 0;
    }
    eachBlock(blocks, function (b) {
      if (b.type === "picture") media(b.media);
      if (b.type === "kept") { kept = true; if (b.preview) media(b.preview); (b.rels || []).forEach(function (r) { if (r.part) part(r.part); }); }
      (b.runs || []).forEach(function (r) { if (r.fn && doc.footnotes && doc.footnotes[r.fn]) held.footnotes[r.fn] = clone(doc.footnotes[r.fn]); });
    });
    if (kept && doc.theme) { held.theme = doc.theme; part(doc.theme); }
    // Over the limit the bytes are let go, so a closed document's pictures are
    // not held on to; a paste back into the same document does not need them.
    if (held.bytes > LIMITS.ownBytes) { held.media = {}; held.parts = {}; held.theme = ""; held.full = false; }
    stash = held;

    // The clipboard copy leaves a kept drawing's XML out: it is never read
    // back from there (see fromOwn), and it can be large.
    var lite = mapBlocks(clone(blocks), function (b) {
      if (b.type !== "kept") return b;
      return { id: b.id, type: "kept", kind: b.kind, description: b.description, text: b.text, caption: b.caption };
    });
    var out = {};
    out[TYPE] = JSON.stringify({ format: FORMAT, token: held.token, docId: doc.id, blocks: lite, footnotes: held.footnotes });
    out["text/plain"] = blocksText(blocks);
    out["text/html"] = blocksHtml(blocks);
    return out;
  }
  function forget() { stash = null; }

  // A copied footnote reference gets a footnote of its own, with the words the
  // note had when it was copied. The same key in another document is some
  // other note, so the copy is written here, before the model copies the
  // blocks, and never looked up there.
  function ownFootnotes(blocks, doc, source) {
    eachBlock(blocks, function (b) {
      if (!b.runs) return;
      b.runs = b.runs.filter(function (r) {
        if (!r.fn) return true;
        if (!source[r.fn]) return false;
        var key = nid(doc, "f");
        doc.footnotes = doc.footnotes || {};
        doc.footnotes[key] = { runs: clone(source[r.fn].runs || []) };
        r.fn = key;
        return true;
      });
    });
    return blocks;
  }

  // Blocks copied in this page (the token matches what the page kept).
  function fromStash(doc) {
    var out = empty("blocks");
    out.footnotes = {};
    var same = stash.docId === doc.id, lost = 0;
    var mediaMap = {}, partMap = {};
    if (!same) {
      Object.keys(stash.media).forEach(function (k) {
        var m = stash.media[k];
        if (m.blob) mediaMap[k] = mediaEntry(doc, out, m.blob, m);
      });
      // A document has one theme: a pasted drawing takes the one already
      // there, and brings its own only where there is none (design 5.3).
      var themeParts = {};
      if (stash.theme && doc.theme) (function mark(k) {
        if (themeParts[k] || !stash.parts[k]) return;
        themeParts[k] = true;
        (stash.parts[k].rels || []).forEach(function (r) { if (r.part) mark(r.part); });
      })(stash.theme);
      var needed = {};
      eachBlock(stash.blocks, function (b) {
        if (b.type === "kept") (b.rels || []).forEach(function need(r) {
          if (!r.part || needed[r.part] || !stash.parts[r.part]) return;
          needed[r.part] = true;
          (stash.parts[r.part].rels || []).forEach(need);
        });
      });
      Object.keys(stash.parts).forEach(function (k) {
        var p = stash.parts[k];
        if (p.blob && !(themeParts[k] && !needed[k])) partMap[k] = nid(doc, "p");
      });
      // Relationships once every part has its new key (parts may point at
      // each other in a ring). A part's own relationship ids stay as they are.
      Object.keys(partMap).forEach(function (k) {
        var p = stash.parts[k];
        out.parts[partMap[k]] = { name: String(p.name || ""), contentType: String(p.contentType || ""), blob: p.blob, rels: (p.rels || []).map(function (r) {
          var nr = { id: r.id, type: r.type };
          if (r.part) nr.part = partMap[r.part] || ""; else nr.external = r.external;
          return nr;
        }).filter(function (r) { return r.external !== undefined || r.part; }) };
        out.bytes = (out.bytes || 0) + p.blob.size;
      });
      if (out.bytes && !A().canAdd(out.bytes)) { out.media = {}; out.parts = {}; out.refused = true; return done(out); }
      // The one thing set on the document here: nothing else would. Its part
      // is in the result with the others.
      if (stash.theme && !doc.theme && partMap[stash.theme]) doc.theme = partMap[stash.theme];
    }
    var blocks = M().copyBlocks(doc, ownFootnotes(clone(stash.blocks), doc, stash.footnotes));
    eachBlock(blocks, function (b) {
      (b.runs || []).forEach(function (r) { if (r.fn && doc.footnotes && doc.footnotes[r.fn]) out.footnotes[r.fn] = doc.footnotes[r.fn]; });
    });
    if (!same) {
      blocks = mapBlocks(blocks, function (b, inCell) {
        if (b.type === "picture") {
          if (!mediaMap[b.media]) { lost++; return placeholder(doc, NO_PICTURE, inCell); }
          b.media = mediaMap[b.media];
        } else if (b.type === "kept") {
          var whole = (b.rels || []).every(function (r) { return !r.part || partMap[r.part]; });
          if (!stash.full || !whole) { lost++; return placeholder(doc, NO_DRAWING, inCell); }
          if (b.preview) { if (mediaMap[b.preview]) b.preview = mediaMap[b.preview]; else delete b.preview; }
          // Relationship ids are unique in a document, so the drawing takes
          // new ones here; in its XML each is replaced by exact quoted match.
          // In two passes, through stand-ins that are no one's id: a new id
          // may be the very id another of its relationships had before.
          var xml = String(b.xml);
          (b.rels || []).forEach(function (r, i) { xml = xml.split('"' + r.id + '"').join('"' + i + '"'); });
          b.rels = (b.rels || []).map(function (r, i) {
            var id = nid(doc, "sptK");
            xml = xml.split('"' + i + '"').join('"' + id + '"');
            var nr = { id: id, type: r.type };
            if (r.part) nr.part = partMap[r.part]; else nr.external = r.external;
            return nr;
          });
          b.xml = xml;
        }
        return b;
      });
    }
    out.blocks = blocks;
    out.skippedPictures = lost;
    if (lost && !stash.full) out.message = "The pictures and drawings in this copy were too large to bring into another document. Their places are marked in red.";
    return done(out);
  }

  // Blocks from clipboard JSON this page did not write itself. Any program can
  // put that type on the clipboard, so nothing in it is trusted: each block is
  // rebuilt from the fields the contract names, and a picture or drawing, whose
  // bytes are not there, becomes a placeholder.
  function cleanRuns(runs, ctx) {
    var out = [];
    (Array.isArray(runs) ? runs : []).forEach(function (r) {
      if (!r || typeof r !== "object") return;
      var o = { t: cleanText(typeof r.t === "string" ? r.t : "") };
      if (r.fn) {
        var src = ctx.footnotes && typeof r.fn === "string" && Object.prototype.hasOwnProperty.call(ctx.footnotes, r.fn) ? ctx.footnotes[r.fn] : null;
        if (!src || ctx.inNote) return;
        var key = nid(ctx.doc, "f");
        ctx.doc.footnotes = ctx.doc.footnotes || {};
        ctx.inNote = true;
        ctx.out.footnotes[key] = ctx.doc.footnotes[key] = { runs: cleanRuns(src.runs, ctx) };
        ctx.inNote = false;
        out.push({ t: "", fn: key });
        return;
      }
      if (!o.t) return;
      FLAGS.forEach(function (k) { if (r[k] === true) o[k] = true; });
      if (o.sup && o.sub) delete o.sub;
      var link = safeLink(r.link);
      if (link) o.link = link;
      out.push(o);
    });
    return out;
  }
  function cleanBlock(b, ctx, inCell) {
    if (!b || typeof b !== "object") return null;
    var doc = ctx.doc, o = null;
    if (b.type === "heading" && !inCell) o = { id: nid(doc), type: "heading", level: Math.max(1, Math.min(3, parseInt(b.level, 10) || 1)), runs: cleanRuns(b.runs, ctx) };
    else if (b.type === "paragraph" || b.type === "heading") {
      o = para(doc, cleanRuns(b.runs, ctx));
      if (ALIGN[b.align]) o.align = b.align;
    } else if (b.type === "list") {
      o = { id: nid(doc), type: "list", list: b.list === "number" ? "number" : "bullet", level: Math.max(0, Math.min(2, parseInt(b.level, 10) || 0)), runs: cleanRuns(b.runs, ctx) };
      if (o.list === "number" && b.restart === true) o.restart = true;
      if (o.list === "number" && b["continue"] === true) o["continue"] = true;
    } else if (b.type === "prompt") {
      o = placeholder(doc, cleanText(typeof b.text === "string" ? b.text : ""), inCell);
    } else if (b.type === "pageBreak" && !inCell) {
      o = { id: nid(doc), type: "pageBreak" };
    } else if (b.type === "picture" || b.type === "kept") {
      ctx.lost++;
      o = placeholder(doc, b.type === "picture" ? NO_PICTURE : NO_DRAWING, inCell);
    } else if (b.type === "table" && !inCell) {
      var rows = (Array.isArray(b.rows) ? b.rows : []).map(function (row) {
        return (row && Array.isArray(row.cells) ? row.cells : []).map(function (cell) {
          cell = cell && typeof cell === "object" ? cell : {};
          var blocks = (Array.isArray(cell.blocks) ? cell.blocks : []).map(function (cb) { return cleanBlock(cb, ctx, true); }).filter(Boolean);
          return { blocks: blocks, span: int(cell.span, LIMITS.cols), rowSpan: int(cell.rowSpan, LIMITS.rowSpan) };
        });
      }).filter(function (cells) { return cells.length; });
      var g = gridRows(rows, doc);
      if (!g.cols || g.cols > LIMITS.cols) return null;
      var cols = Array.isArray(b.cols) && b.cols.length === g.cols && b.cols.every(function (n) { return typeof n === "number" && n > 0 && isFinite(n); }) ? b.cols.slice() : [];
      while (cols.length < g.cols) cols.push(1);
      o = { id: nid(doc), type: "table", header: b.header && g.rows.length > 1 ? 1 : 0, cols: cols, rows: g.rows };
      if (typeof b.caption === "string" && b.caption.trim()) o.caption = cleanText(b.caption).replace(/\s+/g, " ").trim().slice(0, 300);
    }
    if (o && b.land === true && !inCell) o.land = true;
    return o;
  }
  function fromOwn(json, doc) {
    var p;
    try { p = JSON.parse(json); } catch (e) { return null; }
    if (!p || p.format !== FORMAT || !Array.isArray(p.blocks)) return null;
    if (stash && typeof p.token === "string" && p.token === stash.token) return fromStash(doc);
    var out = empty("blocks");
    out.footnotes = {};
    var ctx = { doc: doc, footnotes: p.footnotes && typeof p.footnotes === "object" ? p.footnotes : {}, out: out, lost: 0, inNote: false };
    out.blocks = p.blocks.map(function (b) { return cleanBlock(b, ctx, false); }).filter(Boolean);
    out.skippedPictures = ctx.lost;
    if (ctx.lost) out.message = "Pictures and drawings copied in another window cannot be pasted. Their places are marked in red.";
    return done(out);
  }

  // ---- the clipboard, in order -----------------------------------------

  function done(out) {
    // "Refused" is for a paste the size limit left nothing of. When only some
    // pictures were over it, the rest still arrives.
    if (out.full && !out.blocks.length) out.refused = true;
    delete out.full; delete out.bytes;
    if (out.blocks.length === 1 && out.blocks[0].type === "paragraph" && !out.blocks[0].align) out.inlineRuns = out.blocks[0].runs;
    if (!out.message && out.skippedPictures && !out.refused) out.message = out.problem && out.skippedPictures === 1 && out.source === "files" ? out.problem : skippedMessage(out.skippedPictures);
    delete out.problem;
    // What else was left out or changed is said after it, never in its place.
    if (out.notes && out.notes.length && !out.refused) out.message = (out.message ? out.message + " " : "") + out.notes.join(" ");
    delete out.notes;
    return out;
  }
  function get(dt, type) { try { return dt.getData(type) || ""; } catch (e) { return ""; } }

  // Reads a paste or a drop: our own blocks first, then HTML, then picture
  // files, then plain text (5.3). Resolves { blocks, inlineRuns?, media, parts,
  // skippedPictures } and, beyond the design's list: `source` (which of the
  // four it was), `message` (what to tell the user, when there is anything),
  // `footnotes` (new notes made for pasted references) and `refused` (the
  // document is at its size limit and nothing can be pasted; App.DocApp.canAdd
  // has already said so). `media` and `parts` hold new entries under new keys,
  // in the memory form, for the caller to put into the document with the
  // blocks. New footnotes are already in the document (one nothing refers to
  // is left out at the next save), and so is the theme key when a pasted
  // drawing brings the document its first theme.
  function read(dt, doc) {
    doc = doc || (A().state && A().state.doc);
    // Everything is taken from the event now: the clipboard is gone once the
    // handler returns.
    var own = get(dt, TYPE), html = get(dt, "text/html"), text = get(dt, "text/plain"), files = imageFiles(dt);
    return Promise.resolve().then(function () {
      if (own && own.length <= LIMITS.ownBytes) {
        var mine = fromOwn(own, doc);
        if (mine) return mine;
      }
      var skipped = 0, kept = {}, tooBig = false;
      var step = Promise.resolve(null);
      // The limit is on the markup. A picture written into the HTML is judged
      // by itself when it is read, so one screenshot does not turn a whole
      // paste into plain text.
      if (html && html.length <= LIMITS.htmlRaw && markupChars(html) <= LIMITS.htmlChars) {
        var parsed = parse(html);
        if (!(files.length && loneImage(parsed))) step = fromParsed(parsed, doc, kept);
      } else if (html) {
        tooBig = true;
        skipped = (html.match(/<img\b/gi) || []).length;
      }
      return step.then(function (res) {
        if (res && (res.blocks.length || res.refused)) return res;
        if (res) skipped = res.skippedPictures;
        return files.length ? fromFiles(files, doc) : null;
      }).then(function (res) {
        if (res && res.source === "html") return res;
        if (res && (res.blocks.length || res.refused)) {
          if (skipped) { res.skippedPictures += skipped; delete res.message; }
          res.notes = kept.notes;
          return done(res);
        }
        var last = fromText(text, doc);
        if (!last.blocks.length) last.source = "none";
        last.skippedPictures = skipped + (res ? res.skippedPictures : 0);
        // Why a picture file was not taken (its type, its size), when that is
        // all there was to paste.
        if (res && res.message && !skipped) last.message = res.message;
        // Never without a word: the headings, lists and tables went with the
        // formatting, and so did the pictures.
        if (tooBig) {
          last.message = !last.blocks.length ? "This was too large to paste. Paste it in smaller parts."
            : "This was too large to paste with its formatting, so only its text was pasted." + (last.skippedPictures ? " Its pictures were left out." : "");
        }
        last.notes = kept.notes;
        return done(last);
      });
    });
  }

  window.App.DocPaste = {
    read: read, fromHtml: fromHtml, fromText: fromText, copyPayload: copyPayload,
    forget: forget, skippedMessage: skippedMessage, TYPE: TYPE, LIMITS: LIMITS
  };
})();
