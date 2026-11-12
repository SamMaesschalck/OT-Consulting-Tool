/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* render.js
 *
 * App.DocRender: turns a document's blocks into DOM, for the editor and the
 * preview alike (docs/document-tool-design.md 5.2, 5.3), with createElement and
 * textContent only: nothing from a file or the clipboard is ever parsed as HTML.
 *
 * The part the editor leans on hardest is the DOM contract for runs. runsInto
 * writes it, runsFrom reads an edited element back, and matches says whether an
 * element is still exactly what runsInto would write, which is how the editor
 * notices that the browser left something of its own behind (a font element, a
 * stray br) and redraws that one block.
 *
 *   plain                      a text node
 *   b i u s sup sub code       those elements, nested in that order
 *   red                        span.red, outside the marks
 *   link                       a[data-link], outermost, with no href
 *   fn                         sup.fn[contenteditable=false][data-fn], a zero-width
 *                              space either side so the caret can sit there
 *   newline                    br
 *   an empty block, or text    one more br at the end (an empty line has no height
 *   that ends in a newline     without it); runsFrom never counts that last br
 *
 * Offsets are the ones App.DocModel.runs uses: characters of text, a line break
 * is one, and a footnote reference is one position, so the caret can be told
 * apart before it and after it.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  // The drawing itself is shared/doc-preview.js (App.DocPreview), the one
  // renderer of a document's blocks, which the assessment and risk tools'
  // Word previews use too. This file keeps what editing needs: reading an
  // edited element back, and caret offsets.
  var P = window.App.DocPreview;
  var ZW = "​";
  var MARKS = P.MARKS;
  // What the browser, or a paste that got past us, may leave for the same thing.
  var ALIAS = { strong: "b", em: "i", strike: "s", del: "s" };
  var TEXT_TYPES = { heading: 1, paragraph: 1, list: 1, prompt: 1 };
  var h = P.h, runsInto = P.runsInto, fnNumbers = P.fnNumbers, headingNumbers = P.headingNumbers, blockText = P.blockText;
  function house() { return window.App.HouseDocx || {}; }

  function isFn(node) { return node.nodeType === 1 && node.tagName === "SUP" && node.classList.contains("fn"); }
  function inert(node) { return node.nodeType === 1 && node.getAttribute("contenteditable") === "false"; }
  function visible(s) { return s.replace(/​/g, "").length; }
  // The br that only gives the last line its height: the last thing in the
  // element, when that is a br.
  function padBr(el) {
    var n = el;
    while (n) {
      var c = n.lastChild;
      while (c && c.nodeType === 3 && !visible(c.nodeValue)) c = c.previousSibling;
      if (!c) return null;
      if (c.nodeType === 1 && c.tagName === "BR") return c;
      if (c.nodeType !== 1 || inert(c)) return null;
      n = c;
    }
    return null;
  }
  function sameFormat(a, b) {
    if (a.fn || b.fn) return false;
    for (var i = 0; i < MARKS.length; i++) if (!a[MARKS[i]] !== !b[MARKS[i]]) return false;
    return !a.red === !b.red && (a.link || "") === (b.link || "") && (a.color || "") === (b.color || "") && (a.size || 0) === (b.size || 0);
  }
  function runsFrom(el) {
    var out = [], pad = padBr(el);
    function push(t, f) {
      var last = out[out.length - 1];
      if (last && sameFormat(last, f)) { last.t += t; return; }
      var r = { t: t };
      MARKS.forEach(function (m) { if (f[m]) r[m] = true; });
      if (f.red) r.red = true;
      if (f.link) r.link = f.link;
      if (f.color && !f.red) r.color = f.color;
      if (f.size) r.size = f.size;
      out.push(r);
    }
    (function walk(node, f) {
      for (var c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          var t = c.nodeValue.replace(/​/g, "");
          if (t) push(t, f);
          continue;
        }
        if (c.nodeType !== 1) continue;
        var tag = c.tagName.toLowerCase();
        if (tag === "br") { if (c !== pad) push("\n", f); continue; }
        // The mark's own text is its number, never part of the block's text.
        if (isFn(c)) { out.push({ t: "", fn: c.getAttribute("data-fn") }); continue; }
        if (inert(c)) continue;
        var g = f, mark = ALIAS[tag] || tag;
        if (MARKS.indexOf(mark) !== -1) {
          g = Object.assign({}, f); g[mark] = true;
          if (mark === "sup") g.sub = false;
          if (mark === "sub") g.sup = false;
        } else if (tag === "span" && c.classList.contains("red")) { g = Object.assign({}, f); g.red = true; }
        else if (tag === "span" && c.classList.contains("rc") && c.hasAttribute("data-color")) { g = Object.assign({}, f); g.color = c.getAttribute("data-color"); }
        else if (tag === "span" && c.classList.contains("rs") && c.hasAttribute("data-size")) { g = Object.assign({}, f); g.size = Number(c.getAttribute("data-size")) || 0; }
        else if (tag === "a" && c.hasAttribute("data-link")) { g = Object.assign({}, f); g.link = c.getAttribute("data-link"); }
        // Anything else (font, a span with no class, a div the browser made) is
        // transparent: its text takes the formatting of the nearest known parent.
        walk(c, g);
      }
    })(el, {});
    return out;
  }

  // The DOM as a string, with neighbouring text nodes read as one (the browser
  // merges and splits them as it types) and a footnote mark's number left out.
  function signature(el) {
    var out = [], text = "";
    function flush() { if (text) { out.push("#" + text); text = ""; } }
    (function walk(node) {
      for (var c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { text += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        flush();
        var names = [];
        for (var i = 0; i < c.attributes.length; i++) names.push(c.attributes[i].name + "=" + c.attributes[i].value);
        out.push("<" + c.tagName + " " + names.sort().join(" ") + ">");
        if (!isFn(c)) walk(c);
        flush();
        out.push("</>");
      }
    })(el);
    flush();
    return out.join("\n");
  }
  function matches(el, runs) {
    var want = document.createElement("div");
    runsInto(want, runs, null);
    return signature(el) === signature(want);
  }

  // Every place a caret can be, in order, with the offset it stands for.
  // Returns the length of the whole text.
  function eachPoint(el, visit) {
    var n = 0, pad = padBr(el), stop = false;
    (function walk(parent) {
      var kids = parent.childNodes;
      for (var i = 0; i < kids.length && !stop; i++) {
        var c = kids[i];
        if (c.nodeType === 3) {
          if (visit({ kind: "text", node: c, at: n }) === false) { stop = true; return; }
          n += visible(c.nodeValue);
        } else if (c.nodeType === 1) {
          if (c.tagName === "BR") {
            if (c === pad) continue;
            n += 1;
            if (visit({ kind: "afterBreak", node: parent, index: i + 1, at: n }) === false) { stop = true; return; }
          } else if (isFn(c)) n += 1;
          else if (!inert(c)) walk(c);
        }
      }
    })(el);
    return n;
  }
  function textLength(el) { return eachPoint(el, function () { return true; }); }
  function rawOffset(textNode, k) {
    var s = textNode.nodeValue, seen = 0;
    for (var i = 0; i < s.length; i++) {
      if (s.charAt(i) === ZW) continue;
      if (seen === k) return i;
      seen++;
    }
    return s.length;
  }
  // The offset of a boundary point: what stands between the start of the
  // element and the point, counted by the contract.
  function pointOffset(el, node, offset) {
    if (!el.contains(node)) return 0;
    var r = document.createRange();
    r.setStart(el, 0); r.setEnd(node, offset);
    var n = 0, pad = padBr(el), stop = false;
    (function walk(parent) {
      var kids = parent.childNodes;
      for (var i = 0; i < kids.length && !stop; i++) {
        var c = kids[i];
        if (c.nodeType === 3) {
          if (c === node) { n += visible(c.nodeValue.slice(0, offset)); stop = true; }
          else if (r.comparePoint(c, 0) > 0) stop = true;
          else n += visible(c.nodeValue);
        } else if (c.nodeType === 1) {
          if (c.tagName === "BR") {
            if (c === pad) continue;
            if (r.comparePoint(parent, i + 1) > 0) stop = true; else n += 1;
          } else if (isFn(c)) {
            // A point inside the mark reads as just before it.
            if (c.contains(node) || r.comparePoint(parent, i + 1) > 0) stop = true; else n += 1;
          } else if (inert(c)) { if (c.contains(node)) stop = true; }
          else walk(c);
        }
      }
    })(el);
    return n;
  }
  function offsetsOf(el, range) {
    if (!el || !range) return { from: 0, to: 0 };
    var a = pointOffset(el, range.startContainer, range.startOffset);
    var b = range.collapsed ? a : pointOffset(el, range.endContainer, range.endOffset);
    return { from: Math.min(a, b), to: Math.max(a, b) };
  }
  function pointAt(el, k) {
    var inside = null, endOfText = null, startOfText = null, afterBreak = null, last = null;
    eachPoint(el, function (p) {
      if (p.kind === "text") {
        var len = visible(p.node.nodeValue);
        last = p.node;
        if (k > p.at && k < p.at + len) { inside = { node: p.node, offset: rawOffset(p.node, k - p.at) }; return false; }
        // The end of the text before wins over the start of the text after, so
        // what is typed there carries on in the same format. Real text wins over
        // the zero-width space beside a footnote mark for the same reason.
        if (k === p.at + len && p.node.nodeValue.length && (!endOfText || !endOfText.real)) {
          endOfText = { node: p.node, offset: p.node.nodeValue.length, real: len > 0 };
        }
        if (k === p.at && !startOfText) startOfText = { node: p.node, offset: 0 };
      } else if (k === p.at && !afterBreak) afterBreak = { node: p.node, offset: p.index };
      return p.at <= k;
    });
    if (inside) return inside;
    // Straight after a line break the start of the next line is the only place.
    if (afterBreak) return startOfText && visible(startOfText.node.nodeValue) ? startOfText : afterBreak;
    if (endOfText) return endOfText;
    if (startOfText) return startOfText;
    if (k > 0 && last) return { node: last, offset: last.nodeValue.length };
    return { node: el, offset: 0 };
  }
  function rangeAt(el, from, to) {
    if (!el) return null;
    var r = document.createRange(), a = pointAt(el, Math.max(0, from || 0));
    r.setStart(a.node, a.offset);
    if (to == null || to === from) r.collapse(true);
    else { var b = pointAt(el, Math.max(0, to)); r.setEnd(b.node, b.offset); }
    return r;
  }

  // ---- the preview's front matter ----------------------------------------------
  // Drawn by App.DocPreview from the same inputs the Word template takes
  // (App.HouseDocx), so the wording cannot drift. Each falls back to the rule
  // in the design (section 2) when the template is not loaded.

  function info(doc) { return (doc && doc.info) || {}; }
  function coverInput(doc) {
    var c = house().coverInput ? house().coverInput(doc) : null;
    if (c && c.titleLines && c.titleLines.length) return c;
    var i = info(doc), title = String(i.title || "").trim() || "Untitled document";
    var lines = i.coverTitleLines && i.coverTitleLines.length ? i.coverTitleLines.slice(0, 3)
      : (house().splitTitleTwo ? house().splitTitleTwo(title) : [title]);
    var longest = lines.reduce(function (m, l) { return Math.max(m, String(l).length); }, 0);
    return {
      kicker: String(i.docType || "Document").toUpperCase(), titleLines: lines,
      titleSize: longest <= 20 ? 60 : longest <= 30 ? 52 : longest <= 38 ? 44 : 36,
      client: i.client || "", site: i.site || "", subLine: i.reference || "",
      revision: i.revision || "0.1", date: i.issuedDate || i.date || "", author: i.author || "",
      classification: i.classification || "Confidential"
    };
  }
  function dataUrl(asset) { return asset && asset.base64 ? "data:" + (asset.mime || "image/png") + ";base64," + asset.base64 : ""; }
  // The cover at its printed size (A4 at 96 dpi). The page that shows it scales
  // it: a .cover-mini wrapper (editor.css) gives the small one for Document
  // information. The capitals on it are the Word cover's own.
  function coverEl(doc) {
    var c = coverInput(doc), A = window.App.Assets || {}, co = house().COMPANY || {};
    // The strip's pairs are the template's own (stripParts): the date and its
    // dot only when there is a date, the author and its label only when there
    // is an author. The same rule here when the template is not loaded.
    var parts = house().stripParts ? house().stripParts(c) : [["ISSUE", (c.revision || "0.1") + (c.date ? "  ·  " + c.date : "")]]
      .concat(c.author ? [["AUTHOR", c.author]] : []).concat([["CLASSIFICATION", c.classification || "Confidential"]]);
    return P.coverEl({
      kicker: c.kicker, titleLines: c.titleLines, titleSize: c.titleSize, client: c.client, site: c.site, subLine: c.subLine,
      strip: parts, bg: dataUrl(A.coverBg), logo: dataUrl(A.logoCard),
      address: [co.addressLine || "SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX",
        co.contactLine || "Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com"]
    });
  }

  function controlPairs(doc, status) {
    var final = status === "final", i = info(doc);
    var got = house().controlPairs ? house().controlPairs(doc, { issueStatus: final ? "final" : "draft" }) : null;
    if (got && got.length) {
      return got.map(function (p) {
        var v = p[1];
        if (v == null || typeof v === "string" || typeof v === "number") return [p[0], v == null ? "" : String(v), false];
        // A prompt from the template: show its words in red, as it prints.
        var words = (v.__placeholder && v.__placeholder.text) || (p[0] === "Document" ? "Add the document title" : "");
        return [p[0], words, true];
      });
    }
    var rows = [
      ["Document revision", i.revision || "0.1", false], ["Status", final ? "Final" : "Draft", false],
      ["QA review by", i.qaReviewBy || "", false], ["Authorised by", i.authorisedBy || "", false],
      ["Issued to", i.issuedTo || "", false], ["Issued date", i.issuedDate || "", false],
      ["Confidentiality", i.classification || "Confidential", false],
      String(i.title || "").trim() ? ["Document", i.title, false] : ["Document", "Add the document title", true]
    ];
    [["Document type", i.docType], ["Reference", i.reference], ["Client", i.client], ["Author", i.author]].forEach(function (p) {
      if (p[1]) rows.push([p[0], String(p[1]), false]);
    });
    return rows;
  }
  function controlEl(doc, status) { return P.controlEl(controlPairs(doc, status)); }
  // The Contents list: level 1 and 2 headings, no page numbers (design, section 2).
  // An empty element when the document prints none, so a caller can always append it.
  function contentsEl(doc) {
    var wrap = h("div", { class: "doc-contents" });
    if (!doc || doc.kind !== "report" || !(doc.options && doc.options.contents)) return wrap;
    var nums = headingNumbers(doc);
    wrap.appendChild(h("h1", { text: "Contents" }));
    (doc.blocks || []).forEach(function (b) {
      if (!b || b.type !== "heading" || b.level > 2) return;
      var text = blockText(b);
      if (!text.trim()) return;
      wrap.appendChild(h("p", { class: "contents-line lvl-" + (b.level === 2 ? 1 : 0) }, [
        // A link with no address: the page that shows the list takes the click
        // and Enter (the preview scrolls to the heading), so it is a tab stop.
        h("a", { "data-goto": b.id, role: "link", tabindex: "0", text:(nums[b.id] ? nums[b.id] + " " : "") + text })
      ]));
    });
    return wrap;
  }
  // The opening of a short document: the title, then one line of client,
  // revision and date. The line is the writer's own (App.HouseDocx.shortHeadLine),
  // so the screen cannot show a different date from the Word file: the issued
  // date when there is one, the date otherwise.
  function shortHeadEl(doc) {
    var i = info(doc), title = String(i.title || "").trim();
    var line = house().shortHeadLine ? house().shortHeadLine(doc)
      : [i.client, i.revision, String(i.issuedDate || "").trim() ? i.issuedDate : i.date]
        .map(function (x) { return String(x == null ? "" : x).trim(); }).filter(Boolean).join(" · ");
    return h("div", { class: "doc-short-head" }, [
      h("p", { class: "doc-title" + (title ? "" : " red"), role: "heading", "aria-level": "1", text: title || "Add the document title" }),
      line ? h("p", { class: "cap", text: line }) : null
    ]);
  }

  window.App.DocRender = {
    blockEl: P.blockEl, runsInto: runsInto, runsFrom: runsFrom, matches: matches, offsetsOf: offsetsOf, rangeAt: rangeAt,
    roughHeight: P.roughHeight, keptCard: P.keptCard, coverEl: coverEl, controlEl: controlEl, contentsEl: contentsEl,
    shortHeadEl: shortHeadEl,
    // Beyond the design's table, for the editor and the pages that draw blocks.
    PAGE_W: P.PAGE_W, LAND_W: P.LAND_W, TEXT_TYPES: TEXT_TYPES, h: h, fresh: P.fresh, fnNumbers: fnNumbers,
    keptNumbers: P.keptNumbers, headingNumbers: headingNumbers, textLength: textLength, blockRuns: P.blockRuns,
    keptDescription: P.keptDescription
  };
})();
