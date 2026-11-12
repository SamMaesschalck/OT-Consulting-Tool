/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* doc-preview.js
 *
 * App.DocPreview draws a document as pages: the house cover, the document
 * control page, then the body, on A4 sheets styled as the Word template
 * prints them (doc-preview.css). The canonical copy is shared/doc-preview.js;
 * tools/sync-shared.ps1 copies it into the document, assessment and risk
 * tools. It is the one renderer of a document's blocks:
 *
 *   - the document tool draws its editor's blocks and its Preview page with
 *     it (its render.js and tables.js hand the drawing to this file and keep
 *     only what editing needs);
 *   - the assessment and risk tools draw their Word preview with it, from the
 *     very file their Export button makes: fromDocx() reads the .docx back
 *     with App.DocxImport (shared/docx-import.js), recognises the house cover
 *     and the page furniture, and draw() lays the blocks out on sheets. What
 *     is shown therefore cannot disagree with the Word file.
 *
 * Everything is built with createElement and textContent: nothing from a
 * file is ever parsed as HTML. Pictures are shown from Blob URLs made here
 * (or by App.DocModel in the document tool); nothing is fetched.
 *
 * The DOM contract for runs (the document tool's editor reads it back with
 * App.DocRender.runsFrom):
 *
 *   plain                      a text node
 *   b i u s sup sub code       those elements, nested in that order
 *   colour, size               span.rc[data-color], span.rs[data-size] (an
 *                              imported chart's own colour and size)
 *   red                        span.red, outside the marks
 *   link                       a[data-link], outermost, with no href
 *   fn                         sup.fn[contenteditable=false][data-fn], a zero-width
 *                              space either side so the caret can sit there
 *   newline                    br
 *   an empty block, or text    one more br at the end (an empty line has no height
 *   that ends in a newline     without it)
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var ZW = "​";
  var MARKS = ["b", "i", "u", "s", "sup", "sub", "code"];
  // The printed text width at 96 dpi: 9026 and 15398 dxa.
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
  var HEX = /^[0-9A-F]{6}$/i;

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
  // Twips and half-points to px at 96 dpi.
  function twPx(tw) { return Math.round(Number(tw) / 15 * 100) / 100; }
  function hpPx(hp) { return Math.round(Number(hp) / 2 * 96 / 72 * 100) / 100; }

  // ---- numbers that come from the whole document ---------------------------

  // Reading-order numbers of the footnote references and of the kept objects,
  // and the heading numbers. Each is a scan of the whole document, so one scan
  // serves every block drawn in the same turn; fresh() forgets it.
  var scan = { doc: null, fn: null, kept: null, keptCount: 0, heads: null };
  function fresh() { scan.doc = null; scan.fn = scan.kept = scan.heads = null; }
  function eachBlock(blocks, fn) {
    (blocks || []).forEach(function (b) {
      if (!b) return;
      fn(b);
      if (b.type === "table") (b.rows || []).forEach(function (row) {
        ((row && row.cells) || []).forEach(function (c) { eachBlock(c && c.blocks, fn); });
      });
    });
  }
  function scanned(doc) {
    if (scan.doc === doc && scan.fn) return scan;
    var fn = {}, kept = {}, nFn = 0, nKept = 0;
    eachBlock(doc && doc.blocks, function (b) {
      if (b.type === "kept") kept[b.id] = ++nKept;
      (b.runs || []).forEach(function (r) { if (r && r.fn && !fn[r.fn]) fn[r.fn] = ++nFn; });
    });
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
    if (doc && doc.asRead) {
      // A document read back from a Word file: the numbers typed in it.
      (doc.blocks || []).forEach(function (b) { if (b && b.type === "heading" && b.__num) out[b.id] = String(b.__num); });
    } else if (doc && doc.options && doc.options.numberHeadings) {
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
      else if (r.color && HEX.test(r.color)) {
        var rc = h("span", { class: "rc", "data-color": String(r.color).toUpperCase() });
        rc.style.color = "#" + String(r.color).toUpperCase();
        wrap(rc);
      }
      if (r.size >= 8 && r.size <= 144) {
        var rs = h("span", { class: "rs", "data-size": String(Math.round(r.size)) });
        rs.style.fontSize = hpPx(Math.round(r.size)) + "px";
        wrap(rs);
      }
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

  // ---- blocks ----------------------------------------------------------------

  function blockRuns(block) {
    if (block.type === "prompt") return block.text ? [{ t: String(block.text) }] : [];
    return block.runs || [];
  }
  function blockText(block) {
    return blockRuns(block).map(function (r) { return r.t || ""; }).join("");
  }
  // A height to lay an unseen block out at until it is first shown, so the
  // scroll bar is about right from the start.
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
  // A picture's address: the document tool's model makes and keeps its own;
  // elsewhere one Blob URL per picture of the document, made here.
  var urls = typeof WeakMap === "function" ? new WeakMap() : null;
  function mediaUrl(doc, key) {
    if (model() && model().mediaUrl && !(doc && doc.asRead)) return model().mediaUrl(doc, key);
    var e = doc && doc.media && doc.media[key];
    if (!e || !e.blob || !SHOWN[e.type] || !urls) return "";
    var map = urls.get(doc);
    if (!map) { map = {}; urls.set(doc, map); }
    if (!map[key]) map[key] = URL.createObjectURL(e.blob.type === e.type ? e.blob : new Blob([e.blob], { type: e.type }));
    return map[key];
  }
  // Gives back the Blob URLs made for a document read from a Word file.
  function release(doc) {
    var map = urls && doc ? urls.get(doc) : null;
    if (!map) return;
    Object.keys(map).forEach(function (k) { try { URL.revokeObjectURL(map[k]); } catch (e) {} });
    urls["delete"](doc);
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
      var url = mediaUrl(doc, block.media);
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
      var url = mediaUrl(doc, block.preview);
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

  // ---- tables ------------------------------------------------------------------

  // Cells are placed as HTML places them: each in the next column of its row
  // that a span from the left or from above has not taken (App.DocModel.table.grid).
  function grid(t) {
    var rows = (t && t.rows) || [], G = rows.map(function () { return []; });
    rows.forEach(function (row, r) {
      var c = 0;
      ((row && row.cells) || []).forEach(function (cell, i) {
        while (G[r][c]) c++;
        var span = Math.max(1, cell.span | 0), down = Math.max(1, cell.rowSpan | 0);
        for (var dr = 0; dr < down && r + dr < rows.length; dr++) {
          for (var dc = 0; dc < span; dc++) G[r + dr][c + dc] = { cell: cell, r: r, c: c, i: i, covered: dr > 0 || dc > 0 };
        }
        c += span;
      });
    });
    var width = Math.max((t && t.cols ? t.cols.length : 0), G.reduce(function (m, row) { return Math.max(m, row.length); }, 0));
    G.forEach(function (row) { for (var c = 0; c < width; c++) if (!row[c]) row[c] = null; });
    return G;
  }
  // List numbers have one owner (the template's writer); a cell's list starts its own count.
  function cellNumbers(blocks) {
    var HD = house();
    var has = (blocks || []).some(function (b) { return b.type === "list"; });
    return (has && HD.listNumbers && HD.listNumbers(blocks)) || {};
  }
  function emptyCell(cell) {
    return (cell.blocks || []).every(function (b) {
      return (b.type === "paragraph" || b.type === "list") && !blockText(b).trim() && !(b.runs || []).some(function (r) { return r && r.fn; });
    });
  }
  // A table's element: a cell's blocks are drawn as any block is, so the
  // editor edits a paragraph in a cell exactly as it edits one on the page.
  // A table of its own look (borders none, fills, widths, row heights; see
  // contracts/document.json) is drawn with it. opts: editable, inCell.
  function tableEl(doc, block, opts) {
    opts = opts || {};
    var cols = block.cols || [];
    var total = cols.reduce(function (a, n) { return a + (Number(n) > 0 ? Number(n) : 0); }, 0) || 1;
    var cls = "doc-table" + (block.borders === "none" ? " bare" : "") + (opts.inCell ? " nested" : "");
    var table = h("table", { class: cls, "data-table-id": block.id });
    // Its own width, in twips, never wider than the space it is in.
    if (block.width > 0) { table.style.width = twPx(block.width) + "px"; table.style.maxWidth = "100%"; }
    var group = h("colgroup");
    cols.forEach(function (n) {
      var col = h("col");
      col.style.width = (100 * (Number(n) > 0 ? Number(n) : 0) / total).toFixed(3) + "%";
      group.appendChild(col);
    });
    table.appendChild(group);
    // One body, with header cells in the header row: a merged cell that runs
    // from the header row into the rows below could not cross from a thead.
    var body = h("tbody");
    var G = grid(block);
    // A Word file read back is drawn as Word prints it: the look the import
    // leaves to the template (kept on the blocks out of sight) is drawn too.
    var asRead = !!(doc && doc.asRead);
    function look(o, k) { return o ? (o[k] != null ? o[k] : (asRead ? o["__" + k] : null)) : null; }
    var own = block.borders === "none" || (block.rows || []).some(function (r, i) {
      return i >= (block.header || 0) && ((r && r.cells) || []).some(function (c) { return c && c.fill; });
    });
    (block.rows || []).forEach(function (row, r) {
      var tr = h("tr");
      var rh = look(row, "h"), exact = rh > 0 && look(row, "hRule") === "exact";
      if (rh > 0) { tr.style.height = twPx(rh) + "px"; if (exact) tr.className = "exact"; }
      (G[r] || []).forEach(function (g, c) {
        if (!g || !g.cell || g.covered) return;
        var head = r < (block.header || 0), cell = g.cell;
        var td = h(head ? "th" : "td", { "data-r": String(r), "data-c": String(c), scope: head ? "col" : null });
        // An unshaded header row prints bold only: in a Word file read back, and in any table
        // with a look of its own (the writer does the same, shared/house-docx.js writeTable).
        if (head && !look(cell, "fill") && ((asRead && block.__plainHead) || own)) td.classList.add("plain");
        if ((cell.span | 0) > 1) td.colSpan = cell.span | 0;
        if ((cell.rowSpan | 0) > 1) td.rowSpan = cell.rowSpan | 0;
        var fill = look(cell, "fill"), va = look(cell, "vAlign");
        if (fill && HEX.test(fill)) { td.style.background = "#" + String(fill).toUpperCase(); td.classList.add("filled"); }
        if (va === "center") td.style.verticalAlign = "middle";
        else if (va === "bottom") td.style.verticalAlign = "bottom";
        if (Array.isArray(cell.pad) && cell.pad.length === 4) td.style.padding = cell.pad.map(function (p) { return twPx(p) + "px"; }).join(" ");
        // A bar in a chart: a cell of nothing at a set height draws as its fill alone.
        if (exact && emptyCell(cell)) td.classList.add("bar");
        var numbers = cellNumbers(cell.blocks);
        (cell.blocks || []).forEach(function (b) {
          td.appendChild(blockEl(doc, b, { editable: !!opts.editable && b.type !== "table", numbers: numbers, inCell: true }));
        });
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    // The caption is marked as a picture's caption is (data-edit, data-cap),
    // so the editor edits it in place the same way.
    if (typeof block.caption === "string" && (block.caption || opts.editable)) {
      var cap = h("p", { class: "cap", "data-edit": "plain", "data-cap": block.id, "aria-label": "Caption", text: block.caption });
      if (!block.caption) cap.appendChild(h("br"));
      table.appendChild(h("caption", {}, [cap]));
    }
    return table;
  }

  // A block's element. The wrapper has no role, so the heading, paragraph or
  // table inside is what a screen reader meets. The element that holds the
  // block's text carries data-edit ("runs", or "plain" for a prompt or a
  // caption), and that is all the document tool's editor looks for: it is
  // made contenteditable only when it is used. opts: editable, numbers
  // (App.HouseDocx.listNumbers of the list the block is in), headingNumbers,
  // keptN and keptOf, inCell.
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
      // The table draws its own caption. In the document tool its tables.js
      // adds the editing to the same drawing; a table inside a cell (an
      // imported chart) is drawn and never edited.
      var T = window.App.DocTables;
      if (opts.inCell) {
        wrap.setAttribute("contenteditable", "false");
        wrap.appendChild(tableEl(doc, block, { editable: false, inCell: true }));
      } else {
        wrap.appendChild(T && T.tableEl ? T.tableEl(doc, block, { editable: !!opts.editable }) : tableEl(doc, block, { editable: !!opts.editable }));
      }
    } else {
      // A block from a later version of the tool: kept as it is, printed as nothing.
      wrap.appendChild(h("p", { class: "unknown", text: "This part was made by a newer version of the tool. It is kept as it is and does not print." }));
    }
    wrap.style.setProperty("contain-intrinsic-block-size", "auto " + Math.round(roughHeight(block)) + "px");
    return wrap;
  }

  // ---- front matter --------------------------------------------------------------

  // The house cover at its printed size (A4 at 96 dpi). The capitals on it are
  // the Word cover's own. c: { kicker, titleLines, titleSize (half-points),
  // client, site, subLine, strip: [[label, value]], address: [lines], bg, logo
  // (picture addresses) }. A page that shows it small wraps it (.cover-mini).
  function coverEl(c) {
    c = c || {};
    var page = h("div", { class: "cover-page", "aria-hidden": "true" });
    if (c.bg) page.appendChild(h("img", { class: "cover-bg", src: c.bg, alt: "" }));
    var top = h("div", { class: "cover-top" });
    if (c.logo) top.appendChild(h("img", { class: "cover-logo", src: c.logo, alt: "" }));
    top.appendChild(h("div", { class: "cover-kicker", text: c.kicker || "DOCUMENT" }));
    top.appendChild(h("div", { class: "cover-bar" }));
    var title = h("div", { class: "cover-title" }, (c.titleLines || []).map(function (l) { return h("div", { text: String(l) }); }));
    title.style.fontSize = Math.round(hpPx(Number(c.titleSize) || 52)) + "px";
    top.appendChild(title);
    if (c.client) top.appendChild(h("div", { class: "cover-client", text: c.client }));
    if (c.site) top.appendChild(h("div", { class: "cover-site", text: c.site }));
    if (c.subLine) top.appendChild(h("div", { class: "cover-sub", text: c.subLine }));
    page.appendChild(top);
    // Each label and its value are one unit (.cover-pair), as in the Word
    // strip: a pair that does not fit what is left of a line moves to the next
    // whole, and one too long for a line has a line of its own and wraps
    // inside its value. No space between the label and the value, so they never part.
    var strip = (c.strip || []).map(function (p) {
      return h("span", { class: "cover-pair" }, [h("span", { class: "cover-k", text: String(p[0]).trim() }), h("span", { class: "cover-v", text: p[1] || "" })]);
    });
    var foot = h("div", { class: "cover-foot" }, [h("div", { class: "cover-strip" }, strip)]);
    (c.address || []).forEach(function (l) { foot.appendChild(h("div", { class: "cover-addr", text: l })); });
    page.appendChild(foot);
    return page;
  }
  // The document control table. pairs: [[label, value, red]], red when the
  // value is a prompt that prints red.
  function controlEl(pairs, title) {
    var body = h("tbody", {}, (pairs || []).map(function (p) {
      return h("tr", {}, [h("th", { scope: "row", text: p[0] }), h("td", { class: p[2] ? "red" : null, text: p[1] })]);
    }));
    return h("div", { class: "doc-control" }, [
      h("h1", { text: title || "Document control and confidentiality" }),
      h("table", { class: "control-table" }, [body])
    ]);
  }

  // ---- sheets ----------------------------------------------------------------------

  // Draws a document as sheets into `paper` (emptied first). opts:
  //   front      [{ part, el, land }] whole sheets before the body (cover, control, contents)
  //   lead       an element put at the top of the first body sheet (a short document's title)
  //   numbers    App.HouseDocx.listNumbers of the body, when the template is loaded
  //   sheetClass more classes for every sheet
  //   watermark  text printed faintly across every sheet but the cover (a draft)
  //   furniture  { logo, left, centre } the running header and footer of a body page
  // A page break starts a sheet, and so does a change of orientation. Word
  // decides where the other pages break, so a sheet holds what it holds.
  function draw(paper, doc, opts) {
    opts = opts || {};
    while (paper.firstChild) paper.removeChild(paper.firstChild);
    paper.classList.add("dpv");
    var extra = opts.sheetClass ? " " + opts.sheetClass : "";
    var furn = opts.furniture || null, bodyNo = 0;
    function sheet(land, part) {
      var s = h("div", { class: "dpv-sheet" + extra + (land ? " land" : ""), "data-part": part });
      if (opts.watermark && part !== "cover") s.appendChild(h("div", { class: "dpv-mark", "aria-hidden": "true", text: String(opts.watermark) }));
      if (furn && part !== "cover") {
        bodyNo++;
        if (furn.logo) s.appendChild(h("img", { class: "dpv-head", src: furn.logo, alt: "" }));
        s.appendChild(h("div", { class: "dpv-foot", "aria-hidden": "true" }, [
          h("span", { text: furn.left || "" }), h("span", { class: "dpv-foot-c", text: furn.centre || "" }), h("span", { text: String(bodyNo) })
        ]));
      }
      paper.appendChild(s);
      return s;
    }
    (opts.front || []).forEach(function (f) { if (f && f.el) sheet(!!f.land, f.part || "front").appendChild(f.el); });
    var numbers = opts.numbers || (house().listNumbers ? house().listNumbers(doc.blocks || []) : {});
    // Read in the same turn as the blocks are drawn: the scan lasts one turn.
    var fnNums = fnNumbers(doc) || {};
    // The footnotes referred to on a sheet, listed at its end: Word prints
    // each at the foot of the page its reference falls on.
    function close(s) {
      if (!s) return;
      var seen = {}, rows = [];
      Array.prototype.forEach.call(s.querySelectorAll("sup.fn[data-fn]"), function (mark) {
        var key = mark.getAttribute("data-fn"), note = (doc.footnotes || {})[key];
        if (seen[key] || !note) return;
        seen[key] = true;
        var words = h("span", { class: "dp-fn-t" });
        // A footnote holds no reference of its own; the writer leaves one out too.
        runsInto(words, (note.runs || []).filter(function (r) { return r && !r.fn; }), null);
        rows.push(h("p", { class: "dp-fn", "data-fn": key }, [
          h("span", { class: "dp-fn-n", text: String(fnNums[key] || mark.textContent || "") }), words
        ]));
      });
      if (rows.length) s.appendChild(h("div", { class: "dp-fn-list", role: "group", "aria-label": "Footnotes" }, rows));
    }
    var cur = null;
    function open(land) { close(cur); cur = sheet(land, "body"); cur.__land = land; return cur; }
    if (opts.lead) open(false).appendChild(opts.lead);
    (doc.blocks || []).forEach(function (b) {
      if (!b) return;
      var land = !!b.land;
      if (b.type === "pageBreak") { close(cur); cur = null; return; }
      if (!cur || cur.__land !== land) open(land);
      var el = blockEl(doc, b, { editable: false, numbers: numbers });
      // An editor may hold the same blocks under the same ids: these give theirs up.
      el.removeAttribute("id");
      Array.prototype.forEach.call(el.querySelectorAll('[id^="blk-"]'), function (n) { n.removeAttribute("id"); });
      cur.appendChild(el);
    });
    close(cur);
    if (!cur && !(doc.blocks || []).length && !opts.lead) open(false);

    // A contents entry goes to its heading, as it does in the Word file.
    function follow(e) {
      var a = e.target && e.target.closest ? e.target.closest("a[data-goto]") : null;
      if (!a || !paper.contains(a)) return;
      if (e.type === "keydown" && e.key !== "Enter") return;
      e.preventDefault();
      var id = a.getAttribute("data-goto"), target = null;
      Array.prototype.forEach.call(paper.querySelectorAll(".dpv-sheet > .blk[data-block-id]"), function (n) {
        if (!target && n.getAttribute("data-block-id") === id) target = n;
      });
      if (!target) return;
      target.scrollIntoView({ block: "start" });
      try { target.focus({ preventScroll: true }); } catch (err) {}
    }
    if (!paper.__dpvFollow) {
      paper.__dpvFollow = true;
      paper.addEventListener("click", follow);
      paper.addEventListener("keydown", follow);
    }
    if (opts.fit) fit(paper);
    return paper;
  }
  // Sheets wider than the space they are shown in are drawn smaller, whole,
  // and follow the space as it changes (a narrow window, a side panel).
  function fit(paper) {
    function apply() {
      var avail = paper.clientWidth - 4;
      if (avail <= 0) return;
      Array.prototype.forEach.call(paper.children, function (s) {
        if (!s.classList || !s.classList.contains("dpv-sheet")) return;
        var z = Math.min(1, avail / ((s.classList.contains("land") ? 1123 : 794) + 2));
        s.style.zoom = z < 0.999 ? String(Math.round(z * 1000) / 1000) : "";
      });
    }
    apply();
    if (!paper.__dpvFit && typeof ResizeObserver === "function") {
      paper.__dpvFit = new ResizeObserver(function () { apply(); });
      paper.__dpvFit.observe(paper);
    }
  }

  // ---- a Word file read back -----------------------------------------------------

  function paraText(b) { return (b.runs || []).map(function (r) { return r.fn ? "" : (r.t || ""); }).join("").replace(/\s+/g, " ").trim(); }
  // The house cover, as the assessment, risk and document tools write it: a
  // table of one column holding the full-page background picture, the logo
  // card, the kicker, the title lines, the client, the site and sub-line, the
  // strip of issue, author and classification, and the address. Recognised by
  // App.DocxImport.houseCover, the one recogniser the document tool's import
  // uses too, and read into what coverEl takes; null when the document does
  // not open with it.
  function readCover(doc) {
    var X = window.App.DocxImport;
    var got = X && X.houseCover ? X.houseCover(doc.blocks) : null;
    if (!got) return null;
    var c = { kicker: got.kicker, titleLines: got.titleLines, titleSize: got.titleSize, client: got.client,
      strip: got.strip, address: got.address };
    if (got.site) c.site = got.site;
    if (got.subLine) c.subLine = got.subLine;
    c.bg = mediaUrl(doc, got.bg.media);
    if (got.logo) c.logo = mediaUrl(doc, got.logo.media);
    return c;
  }

  // The running header's picture and the footer's words, from the first
  // section that has them (the cover has none). Read straight from the file,
  // since the import leaves headers and footers to the template.
  function readFurniture(pkg) {
    var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    var out = { logo: "", left: "", centre: "" };
    if (!pkg) return Promise.resolve(out);
    function xml(name) {
      var e = pkg.get(name);
      if (!e) return null;
      var d = new DOMParser().parseFromString(window.App.ZipIO.text(e), "application/xml");
      return d.getElementsByTagName("parsererror").length ? null : d;
    }
    function rels(name) {
      var at = name.lastIndexOf("/"), rn = name.slice(0, at + 1) + "_rels/" + name.slice(at + 1) + ".rels";
      var d = xml(rn), map = {};
      if (!d) return map;
      Array.prototype.forEach.call(d.getElementsByTagName("Relationship"), function (r) { map[r.getAttribute("Id")] = r.getAttribute("Target") || ""; });
      return map;
    }
    var docRels = rels("word/document.xml");
    var headerName = "", footerName = "";
    var body = xml("word/document.xml");
    if (!body) return Promise.resolve(out);
    var refs = body.getElementsByTagNameNS(W, "headerReference"), frefs = body.getElementsByTagNameNS(W, "footerReference");
    function pick(list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].getAttributeNS(W, "type") || list[i].getAttribute("w:type");
        if (t && t !== "default") continue;
        var target = docRels[list[i].getAttributeNS(R, "id")];
        if (target) return "word/" + target.replace(/^\/?word\//, "");
      }
      return "";
    }
    headerName = pick(refs); footerName = pick(frefs);
    var fd = footerName ? xml(footerName) : null;
    if (fd) {
      var cells = fd.getElementsByTagNameNS(W, "tc"), texts = [];
      Array.prototype.forEach.call(cells.length ? cells : fd.getElementsByTagNameNS(W, "p"), function (c) {
        texts.push(Array.prototype.map.call(c.getElementsByTagNameNS(W, "t"), function (t) { return t.textContent; }).join("").replace(/\s+/g, " ").trim());
      });
      out.left = texts[0] || ""; out.centre = texts[1] || "";
    }
    var hd = headerName ? xml(headerName) : null;
    if (hd) {
      var blip = hd.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "blip")[0];
      var rid = blip && blip.getAttributeNS(R, "embed");
      var target = rid ? rels(headerName)[rid] : "";
      if (target) {
        var part = "word/" + target.replace(/^\/?word\//, "").replace(/^\.\.\//, "");
        var e = pkg.get(part);
        if (e && e.bytes) {
          var type = /\.jpe?g$/i.test(part) ? "image/jpeg" : "image/png";
          out.logo = URL.createObjectURL(new Blob([e.bytes], { type: type }));
          out.__urls = [out.logo];
        }
      }
    }
    return Promise.resolve(out);
  }

  // Reads a Word file (a Blob) for drawing: resolves to { doc, cover, furniture,
  // counts } where doc holds the body's blocks in the shape draw() takes (the
  // cover's blocks taken off when the house cover is recognised) and counts
  // says what was read (pages, headings, pictures), for a caller's check.
  // opts.onProgress(fraction, words) as App.DocxImport.read reports.
  function fromDocx(blob, opts) {
    opts = opts || {};
    var X = window.App.DocxImport, Z = window.App.ZipIO;
    if (!X || !X.read) return Promise.reject(new Error("The Word reader (docx-import.js) is not loaded."));
    return X.read(blob, { name: opts.name || "report.docx", onProgress: opts.onProgress, keepFront: true }).then(function (got) {
      var p = got.project;
      var doc = { kind: "report", asRead: true, blocks: p.blocks || [], media: p.media || {}, parts: p.parts || {},
        footnotes: p.footnotes || {}, options: { numberHeadings: false } };
      var cover = readCover(doc);
      if (cover) {
        doc.blocks = doc.blocks.slice(1);
        while (doc.blocks.length && doc.blocks[0].type === "paragraph" && !paraText(doc.blocks[0]) && !(doc.blocks[0].runs || []).length) doc.blocks.shift();
        if (doc.blocks.length && doc.blocks[0].type === "pageBreak") doc.blocks.shift();
      }
      var counts = { headings: 0, pictures: 0, tables: 0, breaks: 0, land: 0 };
      eachBlock(doc.blocks, function (b) {
        if (b.type === "picture") counts.pictures++;
        else if (b.type === "table") counts.tables++;
      });
      doc.blocks.forEach(function (b, i) {
        if (b.type === "heading") counts.headings++;
        if (b.type === "pageBreak") counts.breaks++;
        if (b.land && (i === 0 || !doc.blocks[i - 1].land)) counts.land++;
      });
      var reading = Z && Z.read ? Z.read(blob).then(function (list) {
        var map = {};
        (list || []).forEach(function (e) { map[e.name] = e; });
        return { get: function (name) { return Object.prototype.hasOwnProperty.call(map, name) ? map[name] : null; } };
      }).catch(function () { return null; }) : Promise.resolve(null);
      return reading.then(readFurniture).then(function (furniture) {
        return { doc: doc, cover: cover, furniture: furniture, counts: counts, report: got.report };
      });
    });
  }
  // Everything a drawn Word file holds on to (its Blob URLs), given back.
  function dispose(read) {
    if (!read) return;
    release(read.doc);
    ((read.furniture && read.furniture.__urls) || []).forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
  }
  // Draws what fromDocx read: the cover (when recognised) and the body, with
  // the running header and footer on each body sheet. opts as draw() takes
  // (front and furniture are filled in here).
  function drawRead(paper, read, opts) {
    opts = Object.assign({}, opts || {});
    var front = [];
    if (read.cover) front.push({ part: "cover", el: coverEl(read.cover) });
    opts.front = front.concat(opts.front || []);
    if (opts.furniture == null) opts.furniture = read.furniture;
    return draw(paper, read.doc, opts);
  }

  window.App.DocPreview = {
    h: h, runsInto: runsInto, blockEl: blockEl, tableEl: tableEl, grid: grid, keptCard: keptCard,
    coverEl: coverEl, controlEl: controlEl, draw: draw, fromDocx: fromDocx, drawRead: drawRead, dispose: dispose,
    readCover: readCover, roughHeight: roughHeight, blockRuns: blockRuns, blockText: blockText, keptDescription: keptDescription,
    fresh: fresh, fnNumbers: fnNumbers, keptNumbers: keptNumbers, headingNumbers: headingNumbers, mediaUrl: mediaUrl,
    PAGE_W: PAGE_W, LAND_W: LAND_W, MARKS: MARKS
  };
})();
