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

  var ZW = "​";
  var MARKS = ["b", "i", "u", "s", "sup", "sub", "code"];
  // What the browser, or a paste that got past us, may leave for the same thing.
  var ALIAS = { strong: "b", em: "i", strike: "s", del: "s" };
  var TEXT_TYPES = { heading: 1, paragraph: 1, list: 1, prompt: 1 };
  // The printed text width at 96 dpi: 9026 and 15398 dxa (design 3.5).
  var PAGE_W = 601, LAND_W = 1026;
  var SHOWN = { "image/png": 1, "image/jpeg": 1, "image/gif": 1, "image/bmp": 1 };
  var KIND_WORDS = {
    shape: "Shape", group: "Grouped drawing", textbox: "Text box", canvas: "Drawing canvas",
    smartart: "Diagram (SmartArt)", chart: "Chart", ole: "Embedded object", picture: "Picture",
    equation: "Equation", other: "Drawing"
  };
  var KEPT_NOTE = "Kept from the original Word file. It prints in the Word export as it was.";
  var KEPT_CHECK = " Any text inside it is made smaller too, so check it in a draft in Word.";
  var KEPT_WIDE = "It is wider than the page and will be made smaller to fit." + KEPT_CHECK;
  var KEPT_TALL = "It is taller than a page and will be made smaller to fit." + KEPT_CHECK;
  var LOST = "This picture could not be restored. Replace it or delete it.";
  var LOST_KEPT = "This drawing could not be restored. Replace it with a picture or delete it.";

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "value") el.value = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function model() { return window.App.DocModel; }
  function house() { return window.App.HouseDocx || {}; }

  // ---- numbers that come from the whole document ---------------------------

  // Reading-order numbers of the footnote references and of the kept objects,
  // and the heading numbers. Each is a scan of the whole document, so one scan
  // serves every block drawn in the same turn; the editor calls fresh() as soon
  // as it has changed the blocks.
  var scan = { doc: null, fn: null, kept: null, keptCount: 0, heads: null };
  function fresh() { scan.doc = null; scan.fn = scan.kept = scan.heads = null; }
  function scanned(doc) {
    if (scan.doc === doc && scan.fn) return scan;
    var fn = {}, kept = {}, nFn = 0, nKept = 0;
    (function walk(blocks) {
      (blocks || []).forEach(function (b) {
        if (!b) return;
        if (b.type === "kept") kept[b.id] = ++nKept;
        (b.runs || []).forEach(function (r) { if (r && r.fn && !fn[r.fn]) fn[r.fn] = ++nFn; });
        if (b.type === "table") (b.rows || []).forEach(function (row) {
          ((row && row.cells) || []).forEach(function (c) { walk(c && c.blocks); });
        });
      });
    })(doc && doc.blocks);
    scan.doc = doc; scan.fn = fn; scan.kept = kept; scan.keptCount = nKept; scan.heads = null;
    // A scan is good for the turn it was made in: any later change may renumber.
    Promise.resolve().then(fresh);
    return scan;
  }
  function fnNumbers(doc) { return scanned(doc).fn; }
  function keptNumbers(doc) { var s = scanned(doc); return { n: s.kept, of: s.keptCount }; }
  function headingNumbers(doc) {
    var s = scanned(doc);
    if (s.heads) return s.heads;
    var out = {};
    if (doc && doc.options && doc.options.numberHeadings) {
      // The writer's own numbers when the template is loaded, so the screen
      // shows what will print; the outline's otherwise.
      if (house().headingNumbers) out = house().headingNumbers(doc.blocks) || {};
      else if (model() && model().outline) (model().outline(doc) || []).forEach(function (o) { if (o && o.number) out[o.id] = String(o.number); });
    }
    s.heads = out;
    return out;
  }

  // ---- runs ---------------------------------------------------------------

  function fnMark(key, doc) {
    var n = doc ? fnNumbers(doc)[key] : "";
    return h("sup", { class: "fn", contenteditable: "false", "data-fn": key, text: n ? String(n) : "*" });
  }
  function runsInto(el, runs, doc) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var any = false, endsInBreak = false, afterFn = false;
    (runs || []).forEach(function (r) {
      if (!r) return;
      if (r.fn) {
        if (!afterFn) el.appendChild(document.createTextNode(ZW));
        el.appendChild(fnMark(r.fn, doc));
        el.appendChild(document.createTextNode(ZW));
        any = true; endsInBreak = false; afterFn = true;
        return;
      }
      var t = r.t == null ? "" : String(r.t);
      if (!t) return;
      var into = el;
      function wrap(node) { into.appendChild(node); into = node; }
      if (r.link) wrap(h("a", { "data-link": r.link }));
      if (r.red) wrap(h("span", { class: "red" }));
      MARKS.forEach(function (m) {
        // Superscript wins over subscript: the model never holds both.
        if (r[m] && !(m === "sub" && r.sup)) wrap(document.createElement(m));
      });
      t.split("\n").forEach(function (line, i) {
        if (i) into.appendChild(document.createElement("br"));
        if (line) into.appendChild(document.createTextNode(line));
      });
      any = true; afterFn = false;
      endsInBreak = t.charAt(t.length - 1) === "\n";
    });
    if (!any || endsInBreak) el.appendChild(document.createElement("br"));
  }

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
    return !a.red === !b.red && (a.link || "") === (b.link || "");
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

  // ---- blocks ----------------------------------------------------------------

  function blockRuns(block) {
    if (block.type === "prompt") return block.text ? [{ t: String(block.text) }] : [];
    return block.runs || [];
  }
  function blockText(block) {
    return blockRuns(block).map(function (r) { return r.t || ""; }).join("");
  }
  // A height to lay an unseen block out at until it is first shown (see .blk in
  // editor.css), so the scroll bar is about right from the start.
  function roughHeight(block) {
    if (!block) return 0;
    var wide = block.land ? LAND_W : PAGE_W;
    if (block.type === "heading") return block.level === 1 ? 56 : block.level === 2 ? 46 : 40;
    if (block.type === "table") return (block.rows || []).length * 30 + 20 + (block.caption ? 26 : 0);
    if (block.type === "picture" || block.type === "kept") {
      var w = Number(block.width) || 0, ht = Number(block.height) || 0;
      var shown = ht > 0 && w > 0 ? (w > wide ? ht * wide / w : ht) : 200;
      return Math.round(shown) + (block.type === "kept" ? 90 : 16) + (block.caption ? 26 : 0);
    }
    if (block.type === "pageBreak") return 44;
    var perLine = block.land ? 160 : 92;
    return Math.max(1, Math.ceil(blockText(block).length / perLine)) * 22 + 10;
  }

  // A picture's or a kept object's caption. In the editor it is there as soon
  // as the block has the field, empty or not, so there is something to type in.
  function captionEl(block, editable) {
    if (typeof block.caption !== "string") return null;
    if (!editable && !block.caption) return null;
    var cap = h("p", { class: "cap", "data-edit": "plain", "data-cap": block.id, "aria-label": "Caption" });
    runsInto(cap, block.caption ? [{ t: block.caption }] : [], null);
    return cap;
  }
  function sizeWords(w, ht) {
    function cm(px) { return (Math.round(px / 96 * 25.4) / 10).toFixed(1); }
    return w > 0 && ht > 0 ? cm(w) + " x " + cm(ht) + " cm" : "";
  }
  function placeholderBox(w, ht, lines, cls) {
    var box = h("div", { class: "ph " + (cls || "") }, lines.map(function (l) { return l ? h("span", { class: "ph-line", text: l }) : null; }));
    if (w > 0 && ht > 0) {
      box.style.width = Math.round(w) + "px";
      box.style.aspectRatio = Math.round(w) + " / " + Math.round(ht);
    }
    return box;
  }
  // The size a picture is drawn at: its printed size, clamped to the page as
  // the writer clamps it. In a table cell the cell's own width does that.
  function fitted(block, inCell) {
    var w = Number(block.width) || 0, ht = Number(block.height) || 0, max = block.land ? LAND_W : PAGE_W;
    if (!inCell && w > max && w > 0) { ht = ht * max / w; w = max; }
    return { w: Math.round(w), h: Math.round(ht) };
  }
  function pictureEl(doc, block, opts) {
    var m = (doc && doc.media && doc.media[block.media]) || null, size = fitted(block, opts.inCell);
    var fig = h("figure", { class: "pic al-" + (block.align || "center") });
    if (!m || m.missing || !m.blob) {
      fig.appendChild(placeholderBox(size.w || 240, size.h || 120, [LOST], "lost"));
    } else if (!SHOWN[m.type]) {
      fig.appendChild(placeholderBox(size.w || 240, size.h || 160,
        [(m.name || "Picture") + " (" + String(m.type || "").replace(/^image\/(x-)?/, "").toUpperCase() + ")",
          "Shown as a placeholder here. It prints in the Word file."]));
    } else {
      var img = h("img", { alt: block.alt || "", loading: "lazy", decoding: "async", draggable: "false" });
      if (size.w) img.width = size.w;
      if (size.h) img.height = size.h;
      // The printed proportions, whatever the file's own are, also when the
      // picture is narrowed to fit a cell.
      if (size.w && size.h) img.style.aspectRatio = size.w + " / " + size.h;
      var url = model() && model().mediaUrl ? model().mediaUrl(doc, block.media) : "";
      if (url) img.src = url;
      fig.appendChild(img);
    }
    var cap = captionEl(block, opts.editable);
    if (cap) fig.appendChild(h("figcaption", {}, [cap]));
    return fig;
  }

  var NS = "http://www.w3.org/2000/svg";
  var ICONS = {
    shape: ["M4 13h9v7H4z", "M15.5 4a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"],
    group: ["M3 3h8v8H3z", "M13 13h8v8h-8z", "M11 11l2 2"],
    textbox: ["M3 5h18v14H3z", "M7 9h10", "M7 12h10", "M7 15h6"],
    canvas: ["M3 4h18v16H3z", "M7 15l3-4 3 3 2-2 3 3"],
    smartart: ["M3 9h5v6H3z", "M9.5 9h5v6h-5z", "M16 9h5v6h-5z", "M8 12h1.5", "M14.5 12H16"],
    chart: ["M4 20V4", "M4 20h16", "M8 20v-7", "M12 20V8", "M16 20v-10"],
    ole: ["M4 4h16v16H4z", "M4 9h16", "M9 9v11", "M4 14h16"],
    picture: ["M3 5h18v14H3z", "M3 16l5-5 4 4 3-3 6 6", "M15.5 9.5h.01"],
    equation: ["M5 6h7l-4 6 4 6H5", "M15 10l5 5", "M20 10l-5 5"],
    other: ["M4 4h16v16H4z", "M9 9h6v6H9z"]
  };
  function icon(kind) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "kept-icon");
    svg.setAttribute("aria-hidden", "true");
    (ICONS[kind] || ICONS.other).forEach(function (d) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }
  // Whether any part the object needs did not come back from an autosave copy.
  function keptLost(doc, block) {
    var parts = (doc && doc.parts) || {}, seen = {}, todo = (block.rels || []).slice();
    while (todo.length) {
      var r = todo.pop();
      if (!r || !r.part || seen[r.part]) continue;
      seen[r.part] = true;
      var p = parts[r.part];
      if (!p || p.missing || !p.blob) return true;
      (p.rels || []).forEach(function (x) { todo.push(x); });
    }
    return false;
  }
  function keptDescription(block) {
    if (block.description) return String(block.description);
    var size = sizeWords(Number(block.width) || 0, Number(block.height) || 0);
    return (KIND_WORDS[block.kind] || KIND_WORDS.other) + (size ? ", " + size : "");
  }
  // A kept object cannot be drawn here, so its card has to say which one it is:
  // its place among the kept objects, what it was, its own name, the words in it.
  function keptCard(doc, block, n, of) {
    if (n == null || of == null) {
      var nums = keptNumbers(doc);
      n = nums.n[block.id] || 0; of = nums.of;
    }
    var title = "Drawing " + n + " of " + of + ". " + keptDescription(block);
    var card = h("div", { class: "kept-card", role: "group", "aria-label": title });
    var w = Number(block.width) || 0, ht = Number(block.height) || 0, max = block.land ? LAND_W : PAGE_W;
    var lost = keptLost(doc, block);
    var prev = block.preview && doc && doc.media && doc.media[block.preview];
    if (prev && prev.blob && !prev.missing && SHOWN[prev.type] && !lost) {
      var img = h("img", { class: "kept-preview", alt: "", loading: "lazy", decoding: "async", draggable: "false" });
      var size = fitted(block, false);
      if (size.w) img.width = size.w;
      if (size.h) img.height = size.h;
      if (size.w && size.h) img.style.aspectRatio = size.w + " / " + size.h;
      var url = model() && model().mediaUrl ? model().mediaUrl(doc, block.preview) : "";
      if (url) img.src = url;
      card.appendChild(img);
    } else {
      // A frame of the object's own proportions, never taller than is useful.
      var pw = Math.min(w || 320, max), ph = w > 0 && ht > 0 ? ht * pw / w : 140;
      if (ph > 260) { pw = pw * 260 / ph; ph = 260; }
      var box = placeholderBox(pw, ph, [], "kept-ph");
      box.appendChild(icon(block.kind));
      card.appendChild(box);
    }
    card.appendChild(h("p", { class: "kept-line" }, [
      h("span", { class: "kept-n", text: "Drawing " + n + " of " + of + "." }), " " + keptDescription(block)
    ]));
    if (block.label) card.appendChild(h("p", { class: "kept-label", text: String(block.label) }));
    var words = String(block.text || "").replace(/\s+/g, " ").trim();
    if (words) card.appendChild(h("p", { class: "kept-text", text: words.length > 240 ? words.slice(0, 240) + "…" : words }));
    if (lost) card.appendChild(h("p", { class: "kept-note lost", text: LOST_KEPT }));
    else {
      card.appendChild(h("p", { class: "kept-note", text: KEPT_NOTE }));
      // Wider than the page's text, or taller than a page can show (the writer's own limits).
      var PG = house().PAGE || {}, maxH = block.land ? PG.landscapeMaxHPx : PG.portraitMaxHPx;
      if (!block.floating && w > max) card.appendChild(h("p", { class: "kept-note", text: KEPT_WIDE }));
      else if (!block.floating && maxH > 0 && ht > maxH) card.appendChild(h("p", { class: "kept-note", text: KEPT_TALL }));
    }
    return card;
  }

  function listMarker(doc, block, numbers) {
    var hit = numbers && numbers[block.id];
    if (!hit && doc && house().listNumbers) {
      var all = house().listNumbers(doc.blocks);
      hit = all && all[block.id];
    }
    if (hit && hit.marker) return String(hit.marker);
    return block.list === "number" ? "" : "•";
  }

  // A block's element. The wrapper has no role, so the heading, paragraph or
  // table inside is what a screen reader meets. The element that holds the
  // block's text carries data-edit ("runs", or "plain" for a prompt or a
  // caption), and that is all the editor looks for: it is made contenteditable
  // only when it is used. opts: editable, numbers (App.HouseDocx.listNumbers
  // of the list the block is in), headingNumbers, keptN and keptOf, inCell.
  function blockEl(doc, block, opts) {
    opts = opts || {};
    var type = block.type;
    var wrap = h("div", { class: "blk", id: "blk-" + block.id, "data-block-id": block.id, "data-type": String(type), tabindex: "-1" });
    if (block.land) wrap.classList.add("land");
    if (type === "heading") {
      var level = Math.min(3, Math.max(1, Number(block.level) || 1));
      var nums = opts.headingNumbers || headingNumbers(doc);
      wrap.appendChild(h("span", { class: "hnum", text: nums[block.id] || "" }));
      var hd = h("h" + level, { class: "txt", "data-edit": "runs" });
      runsInto(hd, block.runs, doc);
      wrap.appendChild(hd);
    } else if (type === "paragraph" || type === "list") {
      if (type === "list") {
        wrap.classList.add("lvl-" + Math.min(2, Math.max(0, Number(block.level) || 0)));
        // Real text and not a CSS counter: a screen reader reads "2. Add a
        // zone", and the number on screen is the one Word will show.
        wrap.appendChild(h("span", { class: "marker", contenteditable: "false", text: listMarker(doc, block, opts.numbers) }));
      }
      var p = h("p", { class: "txt" + (block.align && type === "paragraph" ? " al-" + block.align : ""), "data-edit": "runs" });
      runsInto(p, block.runs, doc);
      wrap.appendChild(p);
    } else if (type === "prompt") {
      var pr = h("p", { class: "txt prompt", "data-edit": "plain" });
      runsInto(pr, blockRuns(block), null);
      wrap.appendChild(pr);
    } else if (type === "pageBreak") {
      wrap.appendChild(h("div", { class: "pb", role: "separator", "aria-label": "Page break" }, [h("span", { text: "Page break" })]));
    } else if (type === "picture") {
      wrap.appendChild(pictureEl(doc, block, opts));
    } else if (type === "kept") {
      var fig = h("figure", { class: "kept al-" + (block.align || "center") }, [keptCard(doc, block, opts.keptN, opts.keptOf)]);
      var kc = captionEl(block, opts.editable);
      if (kc) fig.appendChild(h("figcaption", {}, [kc]));
      wrap.appendChild(fig);
    } else if (type === "table") {
      // The table draws its own caption (App.DocTables).
      var T = window.App.DocTables;
      wrap.appendChild(T && T.tableEl ? T.tableEl(doc, block, { editable: !!opts.editable }) : document.createElement("table"));
    } else {
      // A block from a later version of the tool: kept as it is, printed as nothing.
      wrap.appendChild(h("p", { class: "unknown", text: "This part was made by a newer version of the tool. It is kept as it is and does not print." }));
    }
    wrap.style.setProperty("contain-intrinsic-block-size", "auto " + Math.round(roughHeight(block)) + "px");
    return wrap;
  }

  // ---- the preview's front matter ----------------------------------------------
  // Drawn in HTML from the same inputs the Word template takes (App.HouseDocx),
  // so the wording cannot drift. Each falls back to the rule in the design
  // (section 2) when the template is not loaded.

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
    var page = h("div", { class: "cover-page", "aria-hidden": "true" });
    var bg = dataUrl(A.coverBg);
    if (bg) page.appendChild(h("img", { class: "cover-bg", src: bg, alt: "" }));
    var top = h("div", { class: "cover-top" });
    var logo = dataUrl(A.logoCard);
    if (logo) top.appendChild(h("img", { class: "cover-logo", src: logo, alt: "" }));
    top.appendChild(h("div", { class: "cover-kicker", text: c.kicker || "DOCUMENT" }));
    top.appendChild(h("div", { class: "cover-bar" }));
    var title = h("div", { class: "cover-title" }, (c.titleLines || []).map(function (l) { return h("div", { text: String(l) }); }));
    // Half-points to px at 96 dpi.
    title.style.fontSize = Math.round((Number(c.titleSize) || 52) / 2 * 96 / 72) + "px";
    top.appendChild(title);
    if (c.client) top.appendChild(h("div", { class: "cover-client", text: c.client }));
    if (c.site) top.appendChild(h("div", { class: "cover-site", text: c.site }));
    if (c.subLine) top.appendChild(h("div", { class: "cover-sub", text: c.subLine }));
    page.appendChild(top);
    // Each label and its value are one unit (.cover-pair, pages.css), as in
    // the Word strip (stripLayout): a pair that does not fit what is left of
    // a line moves to the next whole, and one too long for a line has a line
    // of its own and wraps inside its value. No space between the label and
    // the value, so they never part.
    function pair(label, value) { return [h("span", { class: "cover-pair" }, [h("span", { class: "cover-k", text: String(label).trim() }), h("span", { class: "cover-v", text: value || "" })])]; }
    // The strip's pairs are the template's own (stripParts): the date and its
    // dot only when there is a date, the author and its label only when there
    // is an author. The same rule here when the template is not loaded.
    var parts = house().stripParts ? house().stripParts(c) : [["ISSUE", (c.revision || "0.1") + (c.date ? "  ·  " + c.date : "")]]
      .concat(c.author ? [["AUTHOR", c.author]] : []).concat([["CLASSIFICATION", c.classification || "Confidential"]]);
    var strip = [];
    parts.forEach(function (p) { strip = strip.concat(pair(p[0], p[1])); });
    page.appendChild(h("div", { class: "cover-foot" }, [
      h("div", { class: "cover-strip" }, strip),
      h("div", { class: "cover-addr", text: co.addressLine || "SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX" }),
      h("div", { class: "cover-addr", text: co.contactLine || "Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com" })
    ]));
    return page;
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
  function controlEl(doc, status) {
    var body = h("tbody", {}, controlPairs(doc, status).map(function (p) {
      return h("tr", {}, [h("th", { scope: "row", text: p[0] }), h("td", { class: p[2] ? "red" : null, text: p[1] })]);
    }));
    return h("div", { class: "doc-control" }, [
      h("h1", { text: "Document control and confidentiality" }),
      h("table", { class: "control-table" }, [body])
    ]);
  }
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
    blockEl: blockEl, runsInto: runsInto, runsFrom: runsFrom, matches: matches, offsetsOf: offsetsOf, rangeAt: rangeAt,
    roughHeight: roughHeight, keptCard: keptCard, coverEl: coverEl, controlEl: controlEl, contentsEl: contentsEl,
    shortHeadEl: shortHeadEl,
    // Beyond the design's table, for the editor and the pages that draw blocks.
    PAGE_W: PAGE_W, LAND_W: LAND_W, TEXT_TYPES: TEXT_TYPES, h: h, fresh: fresh, fnNumbers: fnNumbers,
    keptNumbers: keptNumbers, headingNumbers: headingNumbers, textLength: textLength, blockRuns: blockRuns,
    keptDescription: keptDescription
  };
})();
