/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* editor.js
 *
 * App.DocEditor: the block editor on the paper, its toolbar and the outline
 * (docs/document-tool-design.md 5.3, 5.4).
 *
 * One editable element per text block. The browser is only ever allowed to
 * change the text inside one block: it types, and on `input` the block's runs
 * are read back (App.DocRender.runsFrom). Everything else, splitting, joining,
 * formatting, lists, moving, pasting, is done on the model and then drawn, so
 * the browser never restructures the document. A text element is made
 * contenteditable when it is used and not before, so a long document does not
 * hold thousands of text boxes.
 *
 * Nothing redraws the paper. A change names the blocks it touched and those
 * elements alone are replaced (redraw); typing replaces none. List markers,
 * heading numbers, footnote numbers and "Drawing 3 of 6" are text that is
 * corrected in place after a change of structure.
 *
 * There are two kinds of selection: a caret or range inside one block's text,
 * and whole blocks. A selection never starts in the middle of one paragraph
 * and ends in the middle of another.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  // Looked up at call time: a test may swap any of them for a fake.
  function M() { return window.App.DocModel; }
  function R() { return window.App.DocRender; }
  function H() { return window.App.DocHistory; }
  function A() { return window.App.DocApp; }
  function T() { return window.App.DocTables; }
  function h(tag, attrs, kids) { return R().h(tag, attrs, kids); }

  var CLIP_TYPE = "application/x-spt-doc-blocks";
  var MARK_KEYS = ["b", "i", "u", "s", "sup", "sub", "code", "red"];
  var MARK_NAMES = { b: "Bold", i: "Italic", u: "Underline", s: "Strikethrough", sup: "Superscript", sub: "Subscript", code: "Code", red: "Red prompt text" };
  var TYPE_NAMES = { paragraph: "Paragraph", heading1: "Heading 1", heading2: "Heading 2", heading3: "Heading 3", prompt: "Prompt" };

  // Everything the mounted editor knows. null when it is not mounted.
  var st = null;
  var lastDoc = null;

  // ---- small helpers ---------------------------------------------------------

  function say(text) { var a = A(); if (a && a.say) a.say(text); }
  function toast(text, kind) { var a = A(); if (a && a.toast) a.toast(text, kind); }
  function touched(what) { var a = A(); if (a && a.touched) a.touched(what); }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function where(id) { return st && id != null ? M().find(st.doc, id) : null; }
  function isText(block) { return !!block && !!R().TEXT_TYPES[block.type]; }
  // The block in the body that holds a block: itself, or the table it is in.
  function topOf(id) { var f = where(id); return f ? (f.table ? f.table.id : id) : null; }
  function topIndex(id) { var f = where(id); return f && !f.table ? f.index : -1; }
  function maxWidth(block) { return block && block.land ? R().LAND_W : R().PAGE_W; }
  function docSel() { return st.paper.ownerDocument.getSelection(); }
  function active() { return st.paper.ownerDocument.activeElement; }

  // ---- elements --------------------------------------------------------------

  // Blocks by id. Not getElementById: the preview draws the same blocks with
  // the same ids on another page of the tool.
  function register(el) {
    st.els[el.getAttribute("data-block-id")] = el;
    if (el.getAttribute("data-type") !== "table") return;
    Array.prototype.forEach.call(el.querySelectorAll("[data-block-id]"), function (n) { st.els[n.getAttribute("data-block-id")] = n; });
  }
  function unregister(el) {
    delete st.els[el.getAttribute("data-block-id")];
    if (el.getAttribute("data-type") !== "table") return;
    Array.prototype.forEach.call(el.querySelectorAll("[data-block-id]"), function (n) { delete st.els[n.getAttribute("data-block-id")]; });
  }
  function elOf(id) { var el = st.els[id]; return el && st.paper.contains(el) ? el : null; }
  function textOf(id) {
    var el = elOf(id);
    if (!el) return null;
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.hasAttribute("data-edit")) return c;
    return null;
  }
  function drawCtx() {
    var HD = window.App.HouseDocx, doc = st.doc, kept = R().keptNumbers(doc);
    return {
      editable: true, numbers: HD && HD.listNumbers ? HD.listNumbers(doc.blocks) : {},
      headingNumbers: R().headingNumbers(doc), kept: kept
    };
  }
  function draw(block, ctx) {
    return R().blockEl(st.doc, block, {
      editable: true, numbers: ctx.numbers, headingNumbers: ctx.headingNumbers,
      keptN: ctx.kept.n[block.id], keptOf: ctx.kept.of
    });
  }
  function drawPaper() {
    var paper = st.paper, frag = paper.ownerDocument.createDocumentFragment();
    paper.textContent = "";
    st.els = {};
    R().fresh();
    var ctx = drawCtx();
    (st.doc.blocks || []).forEach(function (b) {
      var el = draw(b, ctx);
      register(el);
      frag.appendChild(el);
    });
    paper.appendChild(frag);
  }
  // Text that depends on the blocks around it, corrected where it stands: a
  // textContent change, never a redraw.
  function syncNumbers() {
    var doc = st.doc, HD = window.App.HouseDocx;
    R().fresh();
    var nums = HD && HD.listNumbers ? HD.listNumbers(doc.blocks) : {};
    var heads = R().headingNumbers(doc), kept = R().keptNumbers(doc), fns = R().fnNumbers(doc);
    function set(node, text) { if (node && node.textContent !== text) node.textContent = text; }
    function child(el, cls) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.classList.contains(cls)) return c;
      return null;
    }
    (function walk(blocks) {
      (blocks || []).forEach(function (b) {
        var el = st.els[b.id];
        if (b.type === "table") (b.rows || []).forEach(function (row) { (row.cells || []).forEach(function (c) { walk(c.blocks); }); });
        if (!el) return;
        if (b.type === "list") set(child(el, "marker"), nums[b.id] ? nums[b.id].marker : (b.list === "number" ? "" : "•"));
        else if (b.type === "heading") set(child(el, "hnum"), heads[b.id] || "");
        else if (b.type === "kept") {
          var line = el.querySelector(".kept-n"), card = el.querySelector(".kept-card");
          var said = "Drawing " + (kept.n[b.id] || 0) + " of " + kept.of + ".";
          set(line, said);
          if (card) card.setAttribute("aria-label", said + " " + R().keptDescription(b));
        }
      });
    })(doc.blocks);
    Array.prototype.forEach.call(st.paper.querySelectorAll("sup.fn"), function (mark) {
      var n = fns[mark.getAttribute("data-fn")];
      set(mark, n ? String(n) : "*");
    });
    if (st.panel && st.panel.kind === "fn") {
      var n = fns[st.panel.key];
      set(st.panel.label, "Footnote " + (n || ""));
    }
  }

  // Replaces the elements of the blocks named, and only those: a block that is
  // gone loses its element, a new one gets one where it now stands, a block in
  // a table cell redraws its table. The caret or block selection is kept.
  function redraw(ids) {
    if (!st) return;
    R().fresh();
    var doc = st.doc, paper = st.paper;
    var hadFocus = paper.contains(active());
    var keep = st.cur ? liveText() : null;
    var tops = [];
    (ids || []).forEach(function (id) {
      var top = topOf(id);
      if (!top) {
        // Gone from the document. If it was in a table, the table is what to redraw.
        var old = st.els[id], host = old && old.parentNode !== paper ? old.closest('.blk[data-type="table"]') : null;
        top = host ? host.getAttribute("data-block-id") : id;
      }
      if (tops.indexOf(top) === -1) tops.push(top);
    });
    if (!tops.length) return;
    // The caret's own element is about to go: it is put back in the new one.
    var dropped = !!st.cur && st.cur.kind !== "fn" && tops.indexOf(topOf(st.cur.id) || st.cur.id) !== -1;
    if (dropped) dropCurrent();
    tops.forEach(function (id) {
      var old = st.els[id];
      if (!old) return;
      unregister(old);
      if (old.parentNode) old.parentNode.removeChild(old);
    });
    var ctx = drawCtx();
    // Last first, so the block each one goes in front of is already in place.
    tops.filter(function (id) { return topIndex(id) !== -1; })
      .sort(function (a, b) { return topIndex(b) - topIndex(a); })
      .forEach(function (id) {
        var f = where(id), nu = draw(f.block, ctx), next = null;
        for (var i = f.index + 1; i < doc.blocks.length && !next; i++) next = elOf(doc.blocks[i].id);
        if (st.sel.indexOf(id) !== -1) nu.classList.add("sel");
        paper.insertBefore(nu, next);
        register(nu);
        if (st.panel && topOf(st.panel.blockId) === id) paper.insertBefore(st.panel.row, nu.nextSibling);
      });
    // A panel goes with its block, and a footnote's panel with its reference:
    // one that nothing refers to any more (an undo took the mark away) would
    // take text that never prints.
    if (st.panel && (!where(st.panel.blockId) || (st.panel.kind === "fn" && !R().fnNumbers(doc)[st.panel.key]))) closePanel();
    st.sel = st.sel.filter(function (id) { return !!where(id); });
    if (st.sel.length) markSelected();
    syncNumbers();
    if (dropped && keep && placeText(keep, { quiet: true })) { /* the caret is back in the new element */ }
    else if (hadFocus && !paper.contains(active())) paper.focus({ preventScroll: true });
    refreshContext(true);
  }

  // ---- text targets ----------------------------------------------------------
  // What a caret can be in: a block's text, a picture's or kept object's
  // caption, or a footnote's text in its panel.

  function targetOf(el) {
    if (!el || !st) return null;
    if (el.hasAttribute("data-cap")) return { kind: "caption", id: el.getAttribute("data-cap"), el: el, plain: true };
    if (el.hasAttribute("data-fn-key")) return { kind: "fn", key: el.getAttribute("data-fn-key"), id: el.getAttribute("data-fn-of"), el: el, plain: false };
    var blk = el.closest("[data-block-id]"), f = blk ? where(blk.getAttribute("data-block-id")) : null;
    return f ? { kind: "block", id: f.block.id, el: el, plain: f.block.type === "prompt" } : null;
  }
  function tkey(t) { return t.kind === "fn" ? "fn:" + t.key : t.kind === "caption" ? "cap:" + t.id : "b:" + t.id; }
  function targetEl(t) {
    if (t.kind === "fn") return st.panel && st.panel.kind === "fn" && st.panel.key === t.key ? st.panel.text : null;
    if (t.kind === "caption") { var el = elOf(t.id); return el ? el.querySelector('[data-cap="' + t.id + '"]') : null; }
    return textOf(t.id);
  }
  function resolve(t) {
    if (!t) return null;
    var el = targetEl(t), f = where(t.id);
    if (!el || !f) return null;
    return { kind: t.kind || "block", id: t.id, key: t.key, el: el, plain: t.kind === "caption" || (t.kind !== "fn" && f.block.type === "prompt") };
  }
  function readRuns(t) {
    if (t.kind === "fn") return ((st.doc.footnotes || {})[t.key] || {}).runs || [];
    var b = where(t.id).block;
    if (t.kind === "caption") return b.caption ? [{ t: b.caption }] : [];
    return R().blockRuns(b);
  }
  function writeRuns(t, runs) {
    runs = M().runs.normalise(runs);
    if (t.kind === "fn") { M().footnote.set(st.doc, t.key, runs); return; }
    var b = where(t.id).block;
    if (t.kind === "caption") b.caption = M().runsText(runs).replace(/\s*\n\s*/g, " ");
    else if (b.type === "prompt") b.text = M().runsText(runs);
    else b.runs = runs;
  }
  function runsLen(runs) { return M().runs.length(runs); }
  function snap(t) {
    if (t.kind === "fn") { var o = {}; o[t.key] = clone(readRuns(t)); return { notes: o }; }
    return { blocks: H().snapshot(st.doc, [t.id]) };
  }
  // Stores new runs for a target as one history entry, or as more of the entry
  // typing in it already has open.
  function setRuns(t, runs, o) {
    o = o || {};
    var key = tkey(t), before = snap(t);
    writeRuns(t, runs);
    var after = snap(t), entry = o.typing ? H().coalesce(key) : null;
    if (entry) {
      if (after.notes) entry.footnotes.after = after.notes; else entry.after = after.blocks;
      entry.selAfter = o.selAfter || null;
      return;
    }
    entry = { label: o.label || "Typing", before: before.blocks || [], after: after.blocks || [], selBefore: o.selBefore || null, selAfter: o.selAfter || null };
    if (after.notes) entry.footnotes = { before: before.notes, after: after.notes };
    if (o.typing) entry.typing = key;
    H().record(entry);
  }
  function refreshText(t) { R().runsInto(t.el, readRuns(t), st.doc); }

  // ---- the caret ---------------------------------------------------------------

  function activate(el) {
    if (st.cur && st.cur.el === el) return st.cur;
    dropCurrent();
    var t = targetOf(el);
    if (!t) return null;
    // A prompt and a caption are plain text: the browser itself then refuses
    // formatting and pasted markup.
    el.setAttribute("contenteditable", t.plain ? "plaintext-only" : "true");
    st.cur = t;
    st.pending = null;
    return t;
  }
  // The caret has left: the element goes back to being ordinary text.
  function dropCurrent() {
    var t = st && st.cur;
    if (!t) return;
    H().coalesce(null);
    t.el.removeAttribute("contenteditable");
    st.cur = null; st.pending = null;
    if (t.kind === "caption") tidyCaption(t);
  }
  // A caption left empty is no caption.
  function tidyCaption(t) {
    var f = where(t.id);
    if (!f || f.block.caption !== "") return;
    delete f.block.caption;
    var fig = t.el.closest("figcaption");
    if (fig && fig.parentNode) fig.parentNode.removeChild(fig);
  }
  function liveText() {
    if (!st) return null;
    if (st.cur) {
      var s = docSel();
      if (s && s.rangeCount && st.cur.el.contains(s.anchorNode) && st.cur.el.contains(s.focusNode)) {
        var o = R().offsetsOf(st.cur.el, s.getRangeAt(0));
        st.lastText = { type: "text", kind: st.cur.kind, id: st.cur.id, blockId: st.cur.id, key: st.cur.key, from: o.from, to: o.to };
      }
    }
    return st.lastText ? Object.assign({}, st.lastText) : null;
  }
  function setRange(el, from, to) {
    var r = R().rangeAt(el, from, to), s = docSel();
    if (!r || !s) return;
    s.removeAllRanges();
    s.addRange(r);
  }
  // Puts the caret (or a range) in a target. False when there is nowhere to put it.
  function placeText(desc, opts) {
    var t = resolve(desc);
    if (!t && desc && desc.kind === "fn" && where(desc.id)) { openFootnote(desc.key, desc.id, false); t = resolve(desc); }
    if (!t) return false;
    setSel([], null, true);
    activate(t.el);
    if (active() !== t.el) t.el.focus({ preventScroll: true });
    var len = R().textLength(t.el), from = Math.min(desc.from || 0, len), to = Math.min(desc.to == null ? from : desc.to, len);
    setRange(t.el, from, to);
    st.lastText = { type: "text", kind: t.kind, id: t.id, blockId: t.id, key: t.key, from: from, to: to };
    if (!(opts && opts.quiet)) toolbarState();
    return true;
  }
  function focusBlock(id, opts) {
    if (!st) return false;
    opts = opts || {};
    var f = where(id);
    if (!f) return false;
    var el = elOf(id);
    if (!isText(f.block) || !textOf(id)) {
      selectBlocks([id]);
      if (opts.flash || (opts.at == null && opts.flash == null)) flash(elOf(topOf(id)));
      return true;
    }
    var len = R().textLength(textOf(id));
    var from = opts.from != null ? opts.from : opts.at === "end" ? len : typeof opts.at === "number" ? opts.at : 0;
    // Called with a block and nothing else (Go to it, Show): a jump, so the
    // block is brought to the middle of the view and shown up for a moment.
    var jump = opts.at == null && opts.from == null && opts.scroll == null && opts.flash == null;
    placeText({ kind: "block", id: id, from: from, to: opts.to != null ? opts.to : from });
    if (opts.scroll !== false && el && el.scrollIntoView) el.scrollIntoView({ block: jump ? "center" : "nearest" });
    if (opts.flash || jump) flash(elOf(topOf(id)));
    return true;
  }
  function flash(el) {
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  // ---- block selection -------------------------------------------------------

  function markSelected() {
    var paper = st.paper;
    Array.prototype.forEach.call(paper.querySelectorAll(".blk.sel"), function (n) { n.classList.remove("sel"); });
    st.sel.forEach(function (id) { var el = elOf(id); if (el) el.classList.add("sel"); });
    var first = st.sel.length ? elOf(st.sel[0]) : null;
    if (first) paper.setAttribute("aria-activedescendant", first.id); else paper.removeAttribute("aria-activedescendant");
  }
  function setSel(ids, anchor, quiet) {
    var was = st.sel.join();
    st.sel = ids.slice();
    st.anchor = ids.length ? (anchor || ids[0]) : null;
    if (was === st.sel.join()) return;
    markSelected();
    if (ids.length) say(plural(ids.length, "block") + " selected");
    if (!quiet) toolbarState();
  }
  function selectBlocks(ids) {
    if (!st) return;
    var found = (ids || []).filter(function (id) { return !!where(id); });
    // Whole blocks of the body, in reading order. One block in a table cell can
    // be selected by itself (a picture there has no other way to be chosen).
    var body = found.filter(function (id) { return topIndex(id) !== -1; }).sort(function (a, b) { return topIndex(a) - topIndex(b); });
    var pick = body.length ? body : found.slice(0, 1);
    dropCurrent();
    var s = docSel();
    if (s) s.removeAllRanges();
    st.lastText = null;
    setSel(pick, pick[0]);
    if (active() !== st.paper) st.paper.focus({ preventScroll: true });
    var first = pick.length ? elOf(pick[0]) : null;
    if (first && first.scrollIntoView) first.scrollIntoView({ block: "nearest" });
  }
  function rangeIds(a, b) {
    var i = topIndex(a), j = topIndex(b), out = [];
    if (i === -1 || j === -1) return [];
    for (var k = Math.min(i, j); k <= Math.max(i, j); k++) out.push(st.doc.blocks[k].id);
    return out;
  }
  function selection() {
    if (!st) return null;
    if (st.sel.length) return { type: "blocks", ids: st.sel.slice() };
    return liveText();
  }
  // What a command acts on: the selected blocks, or the text the caret was last in.
  function context() {
    var s = selection();
    if (!s) return null;
    if (s.type === "text" && !where(s.id)) return null;
    return s;
  }
  function restore(sel, entry) {
    if (!st) return;
    if (entry && entry.footnotes && st.panel && st.panel.kind === "fn") {
      // Undo of typing in a footnote: its panel shows the footnote as it now is.
      R().runsInto(st.panel.text, readRuns({ kind: "fn", key: st.panel.key }), st.doc);
    }
    if (sel && sel.type === "blocks") {
      var ids = sel.ids.filter(function (id) { return !!where(id); });
      if (ids.length) return selectBlocks(ids);
    } else if (sel && sel.type === "text" && placeText(sel)) {
      var el = elOf(topOf(sel.id));
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
      return;
    }
    toolbarState();
  }

  // ---- commands: the common shape ---------------------------------------------

  // One change to the blocks, as one history entry. `ids` are the blocks to
  // remember as they are; `fn` makes the change and returns the ids to
  // remember afterwards (the same ones when it returns nothing). Null, and no
  // entry, when nothing changed.
  function change(label, ids, fn) {
    var selBefore = selection(), before = H().snapshot(st.doc, ids);
    var afterIds = fn() || ids;
    R().fresh();
    var after = H().snapshot(st.doc, afterIds);
    if (JSON.stringify(before) === JSON.stringify(after)) return null;
    var entry = { label: label, before: before, after: after, selBefore: selBefore, selAfter: null };
    H().record(entry);
    return entry;
  }
  function finish(entry, what) {
    if (entry) entry.selAfter = selection();
    touched(what || { structure: true });
    toolbarState();
    later();
  }
  function setBlockRuns(b, runs) {
    if (b.type === "prompt") b.text = M().runsText(runs); else b.runs = M().runs.normalise(runs);
  }
  function textTarget(c) { return c && c.type === "text" ? resolve(c) : null; }

  // ---- typing -------------------------------------------------------------------

  // The browser has changed the text of the block the caret is in: read it back.
  function commit(data) {
    var t = st.cur;
    if (!t || !where(t.id)) return;
    var sel = liveText(), runs = R().runsFrom(t.el);
    setRuns(t, runs, { typing: true, selBefore: st.typedFrom || sel, selAfter: sel });
    st.typedFrom = null;
    // A sentence is a fair unit to undo: the next one starts a new entry.
    if (data && /[.!?]$/.test(data)) H().coalesce(null);
    if (!R().matches(t.el, readRuns(t))) {
      // The browser left something of its own (a font element, a stray br).
      refreshText(t);
      if (sel) setRange(t.el, sel.from, sel.to);
    }
    touched({ blocks: [t.id] });
    if (t.kind === "block" && data === " " && sel) autoList(t, sel);
    later();
  }
  // "- " or "* " at the start of a paragraph makes it a bulleted item, "1. " a
  // numbered one. Its own history entry, so one undo gives the typed characters back.
  function autoList(t, sel) {
    var f = where(t.id), b = f.block;
    if (b.type !== "paragraph" || sel.from !== sel.to) return;
    var m = /^([-*]|1\.) $/.exec(M().runsText(b.runs).slice(0, sel.from));
    if (!m || sel.from !== m[0].length || (b.runs[0] && b.runs[0].fn)) return;
    var entry = change(m[1] === "1." ? "Numbered list" : "Bulleted list", [b.id], function () {
      var nu = { id: b.id, type: "list", list: m[1] === "1." ? "number" : "bullet", level: 0, runs: M().runs.remove(b.runs, 0, m[0].length) };
      if (b.land) nu.land = true;
      M().replace(st.doc, b.id, [nu]);
    });
    redraw([b.id]);
    focusBlock(b.id, { at: 0, scroll: false });
    finish(entry);
  }
  // Text put in through the model, not by the browser: a line break, a
  // character typed where the browser would get the format wrong (at the end
  // of a link, or after a format was switched on with nothing selected), and
  // plain pasted text.
  function insertText(text, o) {
    var t = st.cur, sel = liveText();
    o = o || {};
    if (!t || !sel || !text) return;
    var runs = readRuns(t);
    if (sel.to > sel.from) runs = M().runs.remove(runs, sel.from, sel.to);
    runs = M().runs.insert(runs, sel.from, text);
    Object.keys(o.marks || {}).forEach(function (k) { runs = M().runs.toggle(runs, sel.from, sel.from + text.length, k, !!o.marks[k]); });
    var at = sel.from + text.length, after = Object.assign({}, sel, { from: at, to: at });
    setRuns(t, runs, { typing: !!o.typing, label: o.label, selBefore: sel, selAfter: after });
    refreshText(t);
    setRange(t.el, at, at);
    st.lastText = after;
    touched({ blocks: [t.id] });
    later();
  }
  function marksAt(runs, at) {
    // As App.DocModel.runs.insert chooses: the text before, or at the very start the text after.
    var pos = 0, left = null, right = null;
    (runs || []).forEach(function (r) {
      var n = r.fn ? 1 : (r.t || "").length;
      if (!r.fn && pos < at && at <= pos + n) left = r;
      if (!r.fn && pos >= at && !right && n) right = r;
      pos += n;
    });
    return left || right || {};
  }
  function linkEndsAt(runs, at) {
    var pos = 0, left = null, right = null;
    (runs || []).forEach(function (r) {
      var n = r.fn ? 1 : (r.t || "").length;
      if (pos + n === at && n) left = r;
      if (pos === at && n && !right) right = r;
      pos += n;
    });
    return !!(left && left.link && !(right && right.link === left.link));
  }

  // ---- commands: text ------------------------------------------------------------

  function format(key, on) {
    var c = context();
    if (!c) return;
    if (c.type === "blocks") return formatBlocks(c.ids, key, on);
    var t = textTarget(c);
    if (!t || t.plain) return;
    var f = where(t.id);
    // A heading prints bold whatever its runs say, so the editor does not pretend otherwise.
    if (t.kind === "block" && f.block.type === "heading" && (key === "b" || key === "i")) return;
    if (c.from === c.to) {
      // Nothing selected: the format is for what is typed next.
      if (!st.cur || tkey(st.cur) !== tkey(t)) placeText(c);
      var now = st.pending && st.pending.marks[key] != null ? st.pending.marks[key] : !!marksAt(readRuns(t), c.from)[key];
      var marks = st.pending ? st.pending.marks : {};
      marks[key] = on == null ? !now : on;
      st.pending = { key: tkey(t), at: c.from, marks: marks };
      toolbarState();
      return;
    }
    setRuns(t, M().runs.toggle(readRuns(t), c.from, c.to, key, on == null ? undefined : on), { label: MARK_NAMES[key], selBefore: c, selAfter: c });
    refreshText(t);
    placeText(c);
    touched({ blocks: [t.id] });
    later();
  }
  function textBlocksIn(ids) {
    var out = [];
    ids.forEach(function (id) {
      var f = where(id);
      if (!f) return;
      if (f.block.type === "table") (f.block.rows || []).forEach(function (row) {
        (row.cells || []).forEach(function (c) { (c.blocks || []).forEach(function (b) { if (isText(b)) out.push(b); }); });
      });
      else if (isText(f.block)) out.push(f.block);
    });
    return out;
  }
  function allHave(runs, key) {
    var text = (runs || []).filter(function (r) { return !r.fn && r.t; });
    return text.length > 0 && text.every(function (r) { return r[key] === true; });
  }
  // A block selection takes the inline formats too: every run of every text
  // block in it, cells included, as one history entry.
  function formatBlocks(ids, key, on) {
    var blocks = textBlocksIn(ids).filter(function (b) {
      return b.type !== "prompt" && !(b.type === "heading" && (key === "b" || key === "i")) && runsLen(b.runs) > 0;
    });
    if (!blocks.length) return;
    if (on == null) on = !blocks.every(function (b) { return allHave(b.runs, key); });
    var entry = change(MARK_NAMES[key], ids, function () {
      blocks.forEach(function (b) { b.runs = M().runs.toggle(b.runs, 0, runsLen(b.runs), key, on); });
    });
    redraw(ids);
    finish(entry, { blocks: ids });
  }

  function converted(b, kind) {
    var runs = clone(R().blockRuns(b)), nu = { id: b.id };
    if (kind === "prompt") { nu.type = "prompt"; nu.text = M().runsText(runs); }
    else if (kind === "bullet" || kind === "number") {
      nu.type = "list"; nu.list = kind; nu.level = b.type === "list" ? b.level : 0; nu.runs = runs;
      if (kind === "number" && b.list === "number") { if (b.restart) nu.restart = true; if (b["continue"]) nu["continue"] = true; }
    } else if (kind === "paragraph") { nu.type = "paragraph"; nu.runs = runs; if (b.type === "paragraph" && b.align) nu.align = b.align; }
    else { nu.type = "heading"; nu.level = Number(kind.slice(-1)) || 1; nu.runs = runs; }
    if (b.land) nu.land = true;
    return nu;
  }
  function hasFootnote(b) { return (b.runs || []).some(function (r) { return r && !!r.fn; }); }
  function kindOf(b) {
    if (!b) return "";
    if (b.type === "heading") return "heading" + (b.level || 1);
    if (b.type === "list") return b.list === "number" ? "number" : "bullet";
    return b.type;
  }
  // Paragraph, Heading 1 to 3, Prompt, and the two list buttons, which switch
  // a list item back to a paragraph when it is already that kind of item.
  function setType(kind) {
    var c = context();
    if (!c || (c.type === "text" && c.kind !== "block")) return;
    var ids = c.type === "blocks" ? c.ids : [c.id];
    var hits = ids.map(where).filter(function (f) { return f && isText(f.block); });
    var cellOnly = kind !== "paragraph" && kind !== "bullet" && kind !== "number";
    if (hits.some(function (f) { return f.table; }) && cellOnly) {
      hits = hits.filter(function (f) { return !f.table; });
      toast("A table cell holds paragraphs and lists only.");
    }
    // A prompt is plain text and cannot hold a footnote reference: the block
    // stays as it is, and says why, sooner than lose the footnote unseen.
    if (kind === "prompt" && hits.some(function (f) { return hasFootnote(f.block); })) {
      hits = hits.filter(function (f) { return !hasFootnote(f.block); });
      toast("A prompt is plain text and cannot hold a footnote. Remove the footnote first.");
    }
    if (!hits.length) return;
    if ((kind === "bullet" || kind === "number") && hits.every(function (f) { return kindOf(f.block) === kind; })) kind = "paragraph";
    hits = hits.filter(function (f) { return kindOf(f.block) !== kind; });
    if (!hits.length) return;
    var changedIds = hits.map(function (f) { return f.block.id; });
    var entry = change(TYPE_NAMES[kind] || (kind === "number" ? "Numbered list" : "Bulleted list"), changedIds, function () {
      hits.forEach(function (f) { M().replace(st.doc, f.block.id, [converted(f.block, kind)]); });
    });
    redraw(changedIds);
    if (c.type === "text") placeText(c);
    finish(entry);
  }
  function setLevel(delta) {
    var c = context();
    if (!c || (c.type === "text" && c.kind !== "block")) return;
    var ids = c.type === "blocks" ? c.ids : [c.id];
    var items = ids.map(where).filter(function (f) {
      if (!f || f.block.type !== "list") return false;
      var to = (f.block.level || 0) + delta;
      return to >= 0 && to <= 2;
    });
    if (!items.length) return;
    var changedIds = items.map(function (f) { return f.block.id; });
    var entry = change(delta > 0 ? "Indent" : "Outdent", changedIds, function () {
      items.forEach(function (f) { f.block.level = (f.block.level || 0) + delta; });
    });
    // The element stays (the caret is in it): only its level class and the markers move.
    items.forEach(function (f) {
      var el = elOf(f.block.id);
      if (!el) return;
      el.classList.remove("lvl-0", "lvl-1", "lvl-2");
      el.classList.add("lvl-" + f.block.level);
    });
    syncNumbers();
    finish(entry);
  }
  function setAlign(align) {
    var c = context();
    if (!c) return;
    var ids = c.type === "blocks" ? c.ids : [c.id];
    var hits = ids.map(where).filter(function (f) {
      if (!f) return false;
      var t = f.block.type;
      return t === "paragraph" || ((t === "picture" || t === "kept") && align !== "justify");
    });
    if (!hits.length) return;
    var changedIds = hits.map(function (f) { return f.block.id; });
    var entry = change("Alignment", changedIds, function () {
      hits.forEach(function (f) {
        var b = f.block, plain = b.type === "paragraph" ? "left" : b.type === "picture" ? "center" : "";
        if (align === plain) delete b.align; else b.align = align;
      });
    });
    hits.forEach(function (f) {
      var b = f.block, el = b.type === "paragraph" ? textOf(b.id) : null;
      if (!el) return;
      el.classList.remove("al-center", "al-right", "al-justify");
      if (b.align) el.classList.add("al-" + b.align);
    });
    var others = hits.filter(function (f) { return f.block.type !== "paragraph"; }).map(function (f) { return f.block.id; });
    if (others.length) redraw(others);
    finish(entry, { blocks: changedIds });
  }
  // The landscape flag belongs to blocks of the body: a table cell's paragraph
  // turns its whole table.
  function toggleLandscape() {
    var c = context();
    if (!c) return;
    var ids = [];
    (c.type === "blocks" ? c.ids : [c.id]).forEach(function (id) { var top = topOf(id); if (top && ids.indexOf(top) === -1) ids.push(top); });
    var hits = ids.map(where).filter(Boolean);
    if (!hits.length) return;
    var on = !hits.every(function (f) { return f.block.land === true; });
    var entry = change("Landscape page", ids, function () {
      hits.forEach(function (f) { if (on) f.block.land = true; else delete f.block.land; });
    });
    var again = [];
    hits.forEach(function (f) {
      // Text only gets wider; a picture, a table or a kept object is fitted to the new width.
      if (isText(f.block) || f.block.type === "pageBreak") { var el = elOf(f.block.id); if (el) el.classList.toggle("land", on); }
      else again.push(f.block.id);
    });
    if (again.length) redraw(again);
    say(on ? "On a landscape page." : "On a portrait page.");
    finish(entry, { blocks: ids });
  }

  function split() {
    var t = st.cur, sel = liveText();
    if (!t || !sel || t.kind === "caption") return;
    if (t.kind === "fn") return insertText("\n", { label: "Line break" });
    var f = where(t.id), b = f.block, doc = st.doc;
    if (b.type === "list" && !runsLen(b.runs)) {
      // Enter in an empty item ends the list a level at a time.
      if (b.level > 0) setLevel(-1); else setType("paragraph");
      return;
    }
    var nu, above = false;
    var entry = change("New paragraph", [b.id], function () {
      var runs = R().blockRuns(b);
      if (sel.to > sel.from) runs = M().runs.remove(runs, sel.from, sel.to);
      var parts = M().runs.split(runs, sel.from);
      if ((b.type === "heading" && sel.from === 0 && parts[1].length) || (b.type === "prompt" && sel.from === 0 && runsLen(parts[1]))) {
        // At the start of a heading or a prompt: a paragraph opens above it
        // and the block stays what it was.
        nu = M().make.paragraph(doc, "");
        if (b.land) nu.land = true;
        setBlockRuns(b, parts[1]);
        f.list.splice(f.index, 0, nu);
        above = true;
        return [b.id, nu.id];
      }
      // What is left of a prompt after the caret is still a prompt: red, and
      // counted as something to complete. Enter at its end opens a paragraph
      // to write the answer in.
      if (b.type === "prompt" && runsLen(parts[1])) nu = M().make.prompt(doc, M().runsText(parts[1]));
      else nu = b.type === "list" ? M().make.list(doc, b.list, b.level, "") : M().make.paragraph(doc, "");
      if (b.type === "paragraph" && b.align) nu.align = b.align;
      if (b.land) nu.land = true;
      if (nu.type !== "prompt") nu.runs = parts[1];
      setBlockRuns(b, parts[0]);
      M().insertAfter(doc, b.id, [nu]);
      return [b.id, nu.id];
    });
    refreshText(t);
    redraw([nu.id]);
    focusBlock(above ? b.id : nu.id, { at: 0 });
    finish(entry);
  }
  // Backspace at the very start of a block.
  function joinBack() {
    var t = st.cur;
    if (!t || t.kind !== "block") return;
    var f = where(t.id), b = f.block;
    if (b.type === "list") { if (b.level > 0) setLevel(-1); else setType("paragraph"); return; }
    var prev = f.list[f.index - 1];
    if (!prev) { if (b.type !== "paragraph") setType("paragraph"); return; }
    if (!isText(prev)) { selectBlocks([prev.id]); return; }
    if (keepsApart(prev, b)) { if (!dropEmptyPrompt(prev, b)) focusBlock(prev.id, { at: "end", scroll: false }); return; }
    joinInto(prev, b);
  }
  // A prompt is plain red text. Text joined to it would turn red, count as
  // something still to complete, and lose its formats, links and footnote
  // references, so a block with text in it is never folded into a prompt: the
  // caret crosses instead. An empty prompt in the way is simply removed.
  function keepsApart(first, second) {
    return first.type === "prompt" && second.type !== "prompt" && runsLen(R().blockRuns(second)) > 0;
  }
  function dropEmptyPrompt(prompt, other) {
    if (M().runsText(R().blockRuns(prompt)) !== "") return false;
    var entry = change("Delete", [prompt.id], function () { M().remove(st.doc, [prompt.id]); return []; });
    redraw([prompt.id]);
    focusBlock(other.id, { at: 0, scroll: false });
    finish(entry);
    return true;
  }
  // Delete at the very end.
  function joinForward() {
    var t = st.cur;
    if (!t || t.kind !== "block") return;
    var f = where(t.id), next = f.list[f.index + 1];
    if (!next) return;
    if (!isText(next)) { selectBlocks([next.id]); return; }
    if (keepsApart(f.block, next)) { if (!dropEmptyPrompt(f.block, next)) focusBlock(next.id, { at: 0, scroll: false }); return; }
    joinInto(f.block, next);
  }
  function joinInto(first, second) {
    var at = runsLen(R().blockRuns(first));
    var entry = change("Join", [first.id, second.id], function () {
      setBlockRuns(first, M().runs.join(R().blockRuns(first), R().blockRuns(second)));
      M().remove(st.doc, [second.id]);
      return [first.id];
    });
    redraw([second.id]);
    var el = textOf(first.id);
    if (el) R().runsInto(el, R().blockRuns(first), st.doc);
    focusBlock(first.id, { at: at, scroll: false });
    finish(entry);
  }

  // ---- commands: blocks -------------------------------------------------------

  function removeBlocks(ids, label) {
    ids = ids.filter(function (id) { return !!where(id); });
    if (!ids.length) return;
    var first = where(ids[0]), list = first.list, doc = st.doc;
    var last = where(ids[ids.length - 1]);
    var next = last.list === list ? list[last.index + 1] : null, prev = list[first.index - 1];
    var filler = null;
    var entry = change(label || "Delete", ids, function () {
      M().remove(doc, ids);
      // A document, or a table cell, is never left with nothing to type in.
      if (!list.length) { filler = M().make.paragraph(doc, ""); list.push(filler); return [filler.id]; }
      return [];
    });
    setSel([], null, true);
    redraw(ids.concat(filler ? [filler.id] : []));
    var to = next || prev || filler;
    if (to && where(to.id)) focusBlock(to.id, { at: next ? "start" : "end" });
    say(plural(ids.length, "block") + " deleted");
    finish(entry);
  }
  function deleteSelected() { if (st.sel.length) removeBlocks(st.sel.slice()); }
  // `also` is { id, fn }: a change to a block already there that belongs to the
  // same step (a paste over selected text takes the text away), made only when
  // the blocks went in and kept in the same history entry.
  function insertBlocksAfter(anchorId, blocks, label, also) {
    var doc = st.doc, ids = [];
    var entry = change(label, also ? [also.id] : [], function () {
      if (anchorId == null) {
        // After the last block: there is nothing to go after in an empty document.
        Array.prototype.push.apply(doc.blocks, blocks);
        ids = blocks.map(function (b) { return b.id; });
      } else ids = M().insertAfter(doc, anchorId, blocks);
      if (also && ids.length) also.fn();
      return (also ? [also.id] : []).concat(ids);
    });
    if (!ids.length) return null;
    redraw(ids);
    return { entry: entry, ids: ids };
  }
  // Where a new block goes: after the block the caret is in or the last one selected.
  function anchorId(c, bodyOnly) {
    c = c || context();
    var id = !c ? null : c.type === "blocks" ? c.ids[c.ids.length - 1] : c.id;
    if (id == null) { var all = st.doc.blocks; return all.length ? all[all.length - 1].id : null; }
    return bodyOnly ? topOf(id) : id;
  }
  function insertPageBreak() {
    var c = context(), at = anchorId(c, true), f = where(at);
    var nu = M().make.pageBreak(st.doc);
    if (f && f.block.land) nu.land = true;
    var done = insertBlocksAfter(at, [nu], "Page break");
    if (!done) return;
    if (c && c.type === "text") placeText(c);
    say("Page break added.");
    finish(done.entry);
  }
  function insertTable() {
    var at = anchorId(null, true), nu = M().make.table(st.doc, 3, 3);
    var done = insertBlocksAfter(at, [nu], "Table");
    if (!done) return;
    var first = nu.rows[0].cells[0].blocks[0];
    focusBlock(first.id, { at: 0 });
    finish(done.entry);
  }
  // An empty paragraph after a block, with the caret in it: the way to carry
  // on writing after a table, a picture, a drawing or a page break, which have
  // no text of their own to press Enter in. After the block named, or after
  // what is selected. Backspace in the empty paragraph takes it away again.
  function paragraphAfter(id) {
    if (id == null) {
      var c = context();
      id = !c ? null : c.type === "blocks" ? c.ids[c.ids.length - 1] : c.kind === "block" ? topOf(c.id) : c.id;
    }
    var f = where(id);
    if (!f) return false;
    var nu = M().make.paragraph(st.doc, "");
    if (f.block.land && !f.table) nu.land = true;
    var done = insertBlocksAfter(id, [nu], "New paragraph");
    if (!done) return false;
    focusBlock(nu.id, { at: 0 });
    finish(done.entry);
    return true;
  }
  function duplicate() {
    var c = context();
    if (!c) return;
    var ids = (c.type === "blocks" ? c.ids : [c.id]).filter(function (id) { return !!where(id); });
    if (!ids.length) return;
    var copies = M().copyBlocks(st.doc, ids.map(function (id) { return where(id).block; }));
    var done = insertBlocksAfter(ids[ids.length - 1], copies, "Duplicate");
    if (!done) return;
    selectBlocks(done.ids);
    finish(done.entry);
  }
  function move(dir) {
    var c = context();
    if (!c || (c.type === "text" && c.kind !== "block")) return;
    var ids = c.type === "blocks" ? c.ids.slice() : [c.id];
    var first = where(ids[0]), last = where(ids[ids.length - 1]);
    if (!first || !last || first.list !== last.list) return;
    var list = first.list, other = dir < 0 ? list[first.index - 1] : list[last.index + 1];
    if (!other) return;
    // The neighbour is the one that moves, to the other side of the selection:
    // the same result, and the element holding the caret is never taken out of
    // the page (which would lose the focus).
    var before = dir < 0 ? list[last.index + 1] : first.block;
    var inCell = !!first.table;
    closePanel();
    var entry = change(dir < 0 ? "Move up" : "Move down", [other.id], function () {
      if (dir < 0 && !before && inCell) { list.splice(first.index - 1, 1); list.push(other); }
      else M().move(st.doc, [other.id], before ? before.id : null);
    });
    if (inCell) { redraw([other.id]); if (c.type === "text") placeText(c); }
    else {
      var el = elOf(other.id), ref = before ? elOf(before.id) : null;
      if (el) st.paper.insertBefore(el, ref);
      syncNumbers();
    }
    var shown = elOf(ids[dir < 0 ? 0 : ids.length - 1]);
    if (shown && shown.scrollIntoView) shown.scrollIntoView({ block: "nearest" });
    finish(entry);
  }

  // ---- pictures and kept objects ---------------------------------------------------

  // The tallest a picture prints on the page a block is on (in a cell, a
  // little less): the Word writer's own limit, so a picture is never drawn
  // here taller than the page will show it. 0 when the template is not loaded.
  function maxHeight(block, inCell) {
    var PG = (window.App.HouseDocx || {}).PAGE || {}, top = block && block.land ? PG.landscapeMaxHPx : PG.portraitMaxHPx;
    return top > 0 ? top - (inCell ? PG.cellHLessPx || 0 : 0) : 0;
  }
  function fitWidth(w, ht, max, maxH) {
    w = Math.max(1, Number(w) || max); ht = Math.max(1, Number(ht) || Math.round(max * 0.6));
    if (w > max) { ht = ht * max / w; w = max; }
    if (maxH > 0 && ht > maxH) { w = w * maxH / ht; ht = maxH; }
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(ht)) };
  }
  function readPicture(file) {
    var P = window.App.DocPictures, a = A(), doc = st.doc;
    return P.fromFile(file).then(function (pic) {
      if (!st || st.doc !== doc) return null;
      if (a && a.canAdd && !a.canAdd(pic.blob.size)) return null;
      var key = M().addMedia(doc, pic.blob, { type: pic.type, name: pic.name, width: pic.width, height: pic.height, source: "insert" });
      return { key: key, width: pic.width, height: pic.height };
    }, function (err) {
      toast((err && err.message) || "That picture could not be read.", "err");
      return null;
    });
  }
  // A picture from a file, after the block named (or where the caret is).
  function insertPictureFile(file, afterId) {
    if (!st) return Promise.resolve(null);
    var c = context();
    if (afterId == null) afterId = anchorId(c, false);
    return readPicture(file).then(function (pic) {
      if (!pic || !st) return null;
      if (afterId != null && !where(afterId)) afterId = anchorId(null, true);
      var f = where(afterId);
      // In a table cell the cell decides the width; start small.
      var size = fitWidth(pic.width, pic.height, f && f.table ? 220 : maxWidth(f && f.block), maxHeight(f && (f.table || f.block), !!(f && f.table)));
      var nu = M().make.picture(st.doc, pic.key, size.w, size.h);
      if (f && f.block.land && !f.table) nu.land = true;
      var done = insertBlocksAfter(afterId, [nu], "Picture");
      if (!done) return null;
      selectBlocks([nu.id]);
      finish(done.entry, { structure: true, media: [pic.key] });
      return nu.id;
    });
  }
  // Replace a picture with another, or a kept object with a picture of the
  // same printed width. The block keeps its id; undo brings the old one back.
  function replaceWithFile(id, file) {
    return readPicture(file).then(function (pic) {
      var f = pic && st ? where(id) : null;
      if (!f) return null;
      var b = f.block, w = Number(b.width) > 0 ? Number(b.width) : Math.min(pic.width || maxWidth(b), maxWidth(b));
      // The new picture at the old one's width, unless that makes it taller than a page.
      var size = fitWidth(w, w * (pic.height || 1) / (pic.width || 1), Math.max(w, 1), maxHeight(f.table || b, !!f.table));
      var entry = change(b.type === "kept" ? "Replace with a picture" : "Replace picture", [id], function () {
        var nu = { id: id, type: "picture", media: pic.key, width: size.w, height: size.h };
        if (b.align === "left" || b.align === "right") nu.align = b.align;
        if (typeof b.caption === "string" && b.caption) nu.caption = b.caption;
        if (b.type === "picture" && b.alt) nu.alt = b.alt;
        if (b.land) nu.land = true;
        M().replace(st.doc, id, [nu]);
      });
      redraw([id]);
      selectBlocks([id]);
      finish(entry, { structure: true, media: [pic.key] });
      return id;
    });
  }
  function pickFile(then) {
    var P = window.App.DocPictures, input = st.fileInput;
    input.setAttribute("accept", (P && P.ACCEPT) || "image/*");
    input.value = "";
    st.fileThen = then;
    input.click();
  }
  function editBlock(id, label, fn) {
    var f = where(id);
    if (!f) return;
    var entry = change(label, [id], function () { fn(f.block); });
    if (!entry) return;
    redraw([id]);
    finish(entry, { blocks: [id] });
  }
  function setPictureWidth(id, px) {
    var f = where(id);
    if (!f || !(px > 0)) return;
    var b = f.block, m = (st.doc.media || {})[b.media] || {};
    var ratio = m.width > 0 && m.height > 0 ? m.height / m.width : (b.height || 1) / (b.width || 1);
    px = Math.max(10, Math.min(Math.round(px), 4000));
    // No taller than a page shows it: the Word file would make it smaller anyway.
    var top = maxHeight(f.table || b, !!f.table), high = Math.max(1, Math.round(px * ratio));
    if (top > 0 && high > top) { px = Math.max(1, Math.round(top / ratio)); high = top; }
    editBlock(id, "Picture size", function (blk) { blk.width = px; blk.height = high; });
  }
  function addCaption(id) {
    var f = where(id);
    if (!f) return;
    if (typeof f.block.caption !== "string") editBlock(id, "Caption", function (b) { b.caption = ""; });
    placeText({ kind: "caption", id: id, from: 1e9 });
  }

  // ---- footnotes and links: the panel under a block --------------------------------

  function closePanel(backToText) {
    var p = st && st.panel;
    if (!p) return;
    if (st.cur && p.row.contains(st.cur.el)) dropCurrent();
    st.panel = null;
    if (p.row.parentNode) p.row.parentNode.removeChild(p.row);
    if (backToText && where(p.blockId)) focusBlock(p.blockId, p.back || { at: "end" });
  }
  function panelAfter(blockId, row) {
    var host = elOf(topOf(blockId));
    if (!host) return false;
    st.paper.insertBefore(row, host.nextSibling);
    return true;
  }
  // A footnote's text is edited in a panel under its block, by the same rules
  // as any block's text.
  function openFootnote(key, blockId, focus) {
    if (!st || !(st.doc.footnotes || {})[key]) return;
    // Only for a footnote something refers to: text typed into any other would never print.
    if (!R().fnNumbers(st.doc)[key]) return;
    if (st.panel && st.panel.kind === "fn" && st.panel.key === key) { if (focus) placeText({ kind: "fn", key: key, id: blockId, from: 1e9 }); return; }
    closePanel();
    var n = R().fnNumbers(st.doc)[key] || "";
    var label = h("span", { class: "panel-label", text: "Footnote " + n });
    var text = h("p", { class: "txt fn-text", "data-edit": "runs", "data-fn-key": key, "data-fn-of": blockId, "aria-label": "Footnote text" });
    R().runsInto(text, st.doc.footnotes[key].runs, st.doc);
    var row = h("div", { class: "panel-row fn-panel" }, [label, text,
      h("button", { type: "button", class: "btn", text: "Close", onclick: function () { closePanel(true); } })]);
    if (!panelAfter(blockId, row)) return;
    st.panel = { kind: "fn", key: key, blockId: blockId, row: row, text: text, label: label };
    if (focus) placeText({ kind: "fn", key: key, id: blockId, from: 1e9 });
  }
  function insertFootnote() {
    var c = context(), t = textTarget(c);
    if (!t || t.kind !== "block" || t.plain) { toast("Put the caret in a paragraph first."); return; }
    var res = null;
    var entry = change("Footnote", [t.id], function () { res = M().footnote.add(st.doc, t.id, c.to); });
    if (!res || !entry) return;
    refreshText(t);
    syncNumbers();
    openFootnote(res.key, t.id, true);
    finish(entry, { blocks: [t.id] });
  }
  function linkExtent(runs, at) {
    var pos = 0, spans = [];
    (runs || []).forEach(function (r) {
      var n = r.fn ? 1 : (r.t || "").length, last = spans[spans.length - 1];
      if (r.link && last && last.link === r.link && last.to === pos) last.to = pos + n;
      else if (r.link) spans.push({ from: pos, to: pos + n, link: r.link });
      pos += n;
    });
    return spans.filter(function (s) { return s.from <= at && at <= s.to; })[0] || null;
  }
  function openLink() {
    var c = context(), t = textTarget(c);
    if (!t || t.plain) return;
    var runs = readRuns(t), from = c.from, to = c.to, current = "";
    var inside = linkExtent(runs, from);
    if (from === to) {
      if (!inside) { toast("Select the text to link first."); return; }
      from = inside.from; to = inside.to;
    }
    if (inside) current = inside.link;
    closePanel();
    var back = { from: c.from, to: c.to };
    var input = h("input", { type: "url", class: "panel-input", "aria-label": "Link address", placeholder: "https://", value: current, autocomplete: "off", spellcheck: "false" });
    var note = h("span", { class: "panel-note", role: "status" });
    function done(url) {
      closePanel();
      // A footnote's text lives in its own panel, which the link panel took
      // the place of: it is opened again before the link is set in it.
      if (c.kind === "fn") openFootnote(c.key, c.id, false);
      var target = resolve(c);
      if (!target) return;
      setRuns(target, M().runs.setLink(readRuns(target), from, to, url), { label: url ? "Link" : "Remove link", selBefore: c, selAfter: c });
      refreshText(target);
      placeText(Object.assign({}, c, { from: to, to: to }));
      touched({ blocks: [target.id] });
      later();
    }
    function apply() {
      var url = input.value.trim(), ok = M().runs.safeLink ? M().runs.safeLink(url) : (/^(https?:\/\/|mailto:)\S+$/i.test(url) ? url : "");
      if (!ok) { note.textContent = "Use an address that starts with https://, http:// or mailto:"; return; }
      done(ok);
    }
    function cancel() {
      closePanel();
      if (c.kind === "fn") openFootnote(c.key, c.id, false);
      placeText(c);
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); apply(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); }
    });
    var row = h("div", { class: "panel-row link-panel" }, [
      h("label", { class: "panel-label" }, [h("span", { text: "Link address" }), input]),
      h("button", { type: "button", class: "btn primary", text: "Apply", onclick: apply }),
      current ? h("button", { type: "button", class: "btn", text: "Remove link", onclick: function () { done(""); } }) : null,
      h("button", { type: "button", class: "btn", text: "Cancel", onclick: cancel }),
      note
    ]);
    if (!panelAfter(t.id, row)) return;
    st.panel = { kind: "link", blockId: t.id, row: row, back: back };
    input.focus();
    input.select();
  }

  // ---- copy, cut, paste, drop -------------------------------------------------------

  function hasType(data, type) {
    var types = data && data.types ? Array.prototype.slice.call(data.types) : [];
    return types.indexOf(type) !== -1;
  }
  function onCopy(e, cut) {
    if (!st || !st.sel.length || !st.paper.contains(e.target)) return;   // text: the browser's own copy
    var blocks = st.sel.map(function (id) { return where(id).block; });
    var text = blocks.map(function (b) { return M().text(b); }).join("\n\n");
    // Kept here too, for a paste in this document when the clipboard did not
    // carry our own format.
    st.clip = { text: text, json: JSON.stringify(blocks) };
    e.preventDefault();
    if (e.clipboardData) {
      var payload = null, P = window.App.DocPaste;
      try { payload = P && P.copyPayload ? P.copyPayload(st.doc, blocks) : null; } catch (err) { payload = null; }
      // App.DocPaste gives each clipboard type to set, our own among them.
      Object.keys(payload && typeof payload === "object" ? payload : {}).forEach(function (type) {
        if (typeof payload[type] !== "string") return;
        e.clipboardData.setData(type, payload[type]);
        if (type === "text/plain") st.clip.text = payload[type];
      });
      if (!hasType(e.clipboardData, "text/plain")) e.clipboardData.setData("text/plain", text);
    }
    if (cut) removeBlocks(st.sel.slice(), "Cut");
    else say(plural(blocks.length, "block") + " copied");
  }
  function onPaste(e) {
    if (!st || !st.paper.contains(e.target)) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    e.preventDefault();
    var doc = st.doc, c = context(), data = e.clipboardData, P = window.App.DocPaste;
    var plain = data ? String(data.getData("text/plain") || "") : "";
    var mine = st.clip && plain && plain === st.clip.text ? st.clip : null;
    if (mine && !hasType(data, CLIP_TYPE)) { pasteBlocks(M().copyBlocks(doc, JSON.parse(mine.json)), c); return; }
    var reading;
    try { reading = Promise.resolve(P && P.read ? P.read(data, doc) : null); } catch (err) { reading = Promise.resolve(null); }
    reading.then(null, function () { return null; }).then(function (res) {
      if (!st || st.doc !== doc) return;
      if (c && c.type === "text" && !where(c.id)) c = context();
      if (res && res.refused) return;   // the document is full, and the shell has said so
      if (res && ((res.blocks && res.blocks.length) || (res.inlineRuns && res.inlineRuns.length))) return pasteResult(res, c);
      if (res && (res.message || res.skippedPictures)) skipped(res);
      if (mine) return pasteBlocks(M().copyBlocks(doc, JSON.parse(mine.json)), c);
      if (plain) pastePlain(plain, c);
    });
  }
  // Said once for the whole paste, in the paste module's words when it gives them.
  function skipped(res) {
    var n = res.skippedPictures || 0;
    toast(res.message || ((n === 1 ? "1 picture" : n + " pictures") + " could not be pasted. Insert them from a file, or load the Word file to bring everything across."), "warn");
  }
  function pasteResult(res, c) {
    var doc = st.doc, a = A(), bytes = 0, add = [];
    [["media", res.media], ["parts", res.parts]].forEach(function (g) {
      Object.keys(g[1] || {}).forEach(function (k) {
        doc[g[0]] = doc[g[0]] || {};
        if (doc[g[0]][k]) return;
        add.push([g[0], k, g[1][k]]);
        if (g[1][k] && g[1][k].blob) bytes += g[1][k].blob.size || 0;
      });
    });
    if (bytes && a && a.canAdd && !a.canAdd(bytes)) return;
    add.forEach(function (x) { doc[x[0]][x[1]] = x[2]; });
    if (res.message || res.skippedPictures) skipped(res);
    var blocks = res.blocks || [], t = textTarget(c);
    var inline = res.inlineRuns && res.inlineRuns.length ? res.inlineRuns
      : (blocks.length === 1 && blocks[0].type === "paragraph" ? blocks[0].runs : null);
    if (t && inline) return pasteRuns(t, c, inline);
    if (!blocks.length && inline) blocks = [Object.assign(M().make.paragraph(doc, ""), { runs: inline })];
    // Ids must be new here, whoever made the blocks.
    if (blocks.some(function (b) { return !b.id || !!where(b.id); })) blocks = M().copyBlocks(doc, blocks);
    pasteBlocks(blocks, c, add.map(function (x) { return x[1]; }));
  }
  function pasteRuns(t, c, runs) {
    if (!st.cur || tkey(st.cur) !== tkey(t)) placeText(c);
    t = st.cur;
    if (t.plain) return insertText(M().runsText(runs).replace(/\n/g, t.kind === "caption" ? " " : "\n"), { label: "Paste" });
    var list = readRuns(t);
    if (c.to > c.from) list = M().runs.remove(list, c.from, c.to);
    list = M().runs.insert(list, c.from, runs);
    var at = c.from + runsLen(runs), after = Object.assign({}, c, { from: at, to: at });
    setRuns(t, list, { label: "Paste", selBefore: c, selAfter: after });
    refreshText(t);
    syncNumbers();
    placeText(after);
    touched({ blocks: [t.id] });
    later();
  }
  function pasteBlocks(blocks, c, mediaKeys) {
    if (!blocks.length) return;
    var at = anchorId(c, false);
    // Text that was selected is replaced by what is pasted, as it is when one
    // line is pasted: it is taken out of its block in the same step, so one
    // undo brings it back.
    var t = textTarget(c), cut = null;
    if (t && t.kind === "block" && c.to > c.from) {
      cut = { id: t.id, fn: function () { writeRuns({ kind: "block", id: t.id }, M().runs.remove(readRuns(t), c.from, c.to)); } };
    }
    var done = insertBlocksAfter(at, blocks, "Paste", cut);
    if (!done && at != null && where(at) && where(at).table) {
      // A table cell cannot hold everything: what was pasted goes after the table.
      done = insertBlocksAfter(topOf(at), blocks, "Paste", cut);
    }
    if (!done) return;
    if (cut) {
      var shown = resolve({ kind: "block", id: cut.id });
      if (shown) refreshText(shown);
      syncNumbers();
    }
    var last = where(done.ids[done.ids.length - 1]);
    if (c && c.type === "text" && last && isText(last.block)) focusBlock(last.block.id, { at: "end" });
    else selectBlocks(done.ids);
    finish(done.entry, mediaKeys && mediaKeys.length ? { structure: true, media: mediaKeys } : { structure: true });
  }
  function pastePlain(text, c) {
    text = text.replace(/\r\n?/g, "\n");
    var t = textTarget(c);
    var paras = text.split(/\n[ \t]*\n+/).map(function (s) { return s.replace(/^\n+|\n+$/g, ""); }).filter(function (s) { return s.length; });
    if (t && (paras.length < 2 || t.kind !== "block")) {
      if (!st.cur || tkey(st.cur) !== tkey(t)) placeText(c);
      var flat = st.cur.kind === "caption" || (st.cur.kind === "block" && st.cur.plain);
      return insertText(flat ? text.replace(/\s*\n\s*/g, " ") : text.replace(/^\n+|\n+$/g, ""), { label: "Paste" });
    }
    pasteBlocks(paras.map(function (p) { return M().make.paragraph(st.doc, p); }), c);
  }
  function imageFiles(data) {
    var files = data && data.files ? Array.prototype.slice.call(data.files) : [];
    return files.filter(function (f) { return /^image\//i.test(f.type || ""); });
  }
  function blockUnder(e) {
    var doc = st.paper.ownerDocument;
    var el = e.target && e.target.nodeType === 1 && st.paper.contains(e.target) ? e.target : null;
    if (!el && doc.elementFromPoint && (e.clientX || e.clientY)) el = doc.elementFromPoint(e.clientX, e.clientY);
    while (el && el !== st.paper && el.parentNode !== st.paper) el = el.parentNode;
    if (!el || el === st.paper || !st.paper.contains(el)) return null;
    // A panel belongs to the block above it.
    while (el && !el.hasAttribute("data-block-id")) el = el.previousElementSibling;
    return el ? el.getAttribute("data-block-id") : null;
  }
  function onDrop(e) {
    var files = imageFiles(e.dataTransfer);
    if (!files.length) return;   // a .docx or .json is the shell's to open
    e.preventDefault();
    e.stopPropagation();
    var at = blockUnder(e) || anchorId(null, true);
    // One after the other, each after the one before it.
    files.reduce(function (chain, file) {
      return chain.then(function (after) { return insertPictureFile(file, after).then(function (id) { return id || after; }); });
    }, Promise.resolve(at));
  }

  // ---- the toolbar -------------------------------------------------------------

  var BUTTONS = [
    ["bold", "B", "Bold (Ctrl+B)", "b"], ["italic", "I", "Italic (Ctrl+I)", "i"], ["underline", "U", "Underline (Ctrl+U)", "u"],
    ["strike", "S", "Strikethrough (Ctrl+Shift+X)", "s"], ["superscript", "x²", "Superscript (Ctrl+.)", "sup"],
    ["subscript", "x₂", "Subscript (Ctrl+,)", "sub"], ["code", "Code", "Fixed-width text", "code"],
    ["red", "Red", "Red prompt text: something still to complete (Ctrl+Space clears it)", "red"],
    ["link", "Link", "Link (Ctrl+K)"], ["footnote", "Footnote", "Add a footnote"], null,
    ["bullet", "Bullets", "Bulleted list (Ctrl+Shift+8)"], ["number", "Numbers", "Numbered list (Ctrl+Shift+7)"],
    ["indent", "Indent", "Indent the list item (Tab)"], ["outdent", "Outdent", "Outdent the list item (Shift+Tab)"], null,
    ["alignLeft", "Left", "Align left"], ["alignCenter", "Centre", "Centre"], ["alignRight", "Right", "Align right"],
    ["alignJustify", "Justify", "Justify"], null,
    ["insertTable", "Table", "Insert a table"], ["insertPicture", "Picture", "Insert a picture from a file"],
    ["pageBreak", "Page break", "Page break after this block (Ctrl+Enter)"], ["landscape", "Landscape", "Print on a landscape page"], null,
    ["undo", "Undo", "Undo (Ctrl+Z)"], ["redo", "Redo", "Redo (Ctrl+Y)"]
  ];
  function toolButton(cmd, text, title, cls) {
    var b = h("button", { type: "button", class: "btn tb" + (cls ? " " + cls : ""), "data-cmd": cmd, title: title, "aria-label": title.replace(/ \(.*\)$/, ""), tabindex: "-1", text: text });
    // The caret stays where it is while a button is pressed with the pointer.
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    return b;
  }
  function buildToolbar() {
    var bar = st.toolbar;
    bar.textContent = "";
    var type = h("select", { class: "tb-type", "aria-label": "Block type", title: "Block type", tabindex: "0" },
      Object.keys(TYPE_NAMES).map(function (k) { return h("option", { value: k, text: TYPE_NAMES[k] }); })
        .concat([h("option", { value: "", text: "List item", hidden: true }), h("option", { value: "-", text: "Not text", hidden: true })]));
    type.addEventListener("change", function () { if (type.value && type.value !== "-") run(type.value); });
    var main = h("div", { class: "tb-main" }, [type]);
    BUTTONS.forEach(function (b) {
      if (!b) { main.appendChild(h("span", { class: "tb-sep", "aria-hidden": "true" })); return; }
      var btn = toolButton(b[0], b[1], b[2], "tb-" + b[0]);
      if (b[3] || /^(bullet|number|align|landscape)/.test(b[0])) btn.setAttribute("aria-pressed", "false");
      main.appendChild(btn);
    });
    st.ctxBox = h("div", { class: "tb-context" });
    // The row scrolls sideways when its controls are wider than the view: the
    // mouse wheel scrolls it too, as it would a list that ran down the page.
    st.ctxBox.addEventListener("wheel", function (e) {
      var box = st && st.ctxBox;
      if (!box || e.ctrlKey || e.deltaX || !e.deltaY || box.scrollWidth <= box.clientWidth) return;
      e.preventDefault();
      box.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    }, { passive: false });
    st.fileInput = h("input", { type: "file", class: "tb-file", hidden: true, tabindex: "-1", "aria-hidden": "true" });
    st.fileInput.addEventListener("change", function () {
      var file = st.fileInput.files && st.fileInput.files[0], then = st.fileThen;
      st.fileThen = null;
      if (file && then) then(file);
    });
    bar.appendChild(main);
    bar.appendChild(st.ctxBox);
    bar.appendChild(st.fileInput);
    st.typeSelect = type;
  }
  function toolControls() {
    return Array.prototype.filter.call(st.toolbar.querySelectorAll("button, select, input:not([type=file])"), function (c) { return !c.disabled; });
  }
  // One Tab stop for the whole toolbar; the arrow keys move inside it.
  function rove(to) {
    toolControls().forEach(function (c) { c.setAttribute("tabindex", c === to ? "0" : "-1"); });
  }
  function onToolbarClick(e) {
    var btn = e.target.closest ? e.target.closest("button[data-cmd]") : null;
    if (!btn || !st.toolbar.contains(btn) || btn.getAttribute("aria-disabled") === "true") return;
    run(btn.getAttribute("data-cmd"), btn.getAttribute("data-arg") || undefined);
  }
  function onToolbarKey(e) {
    var all = toolControls(), i = all.indexOf(e.target);
    if (i === -1) return;
    var typing = e.target.tagName === "INPUT", left = !typing, right = !typing;
    if (typing && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // A field is not a dead end: the arrows leave it from the edge of its
      // text. A number field has no caret to ask about, and the arrows left
      // and right do nothing useful in it, so they always move on.
      var from = null, upto = null;
      try { from = e.target.selectionStart; upto = e.target.selectionEnd; } catch (err) { from = upto = null; }
      if (from == null) left = right = true;
      else { left = from === 0 && upto === 0; right = from === upto && from === e.target.value.length; }
    }
    var to = null;
    if (e.key === "ArrowRight" && right) to = all[(i + 1) % all.length];
    else if (e.key === "ArrowLeft" && left) to = all[(i - 1 + all.length) % all.length];
    else if (e.key === "Home" && !typing) to = all[0];
    else if (e.key === "End" && !typing) to = all[all.length - 1];
    else if (e.key === "Escape") { e.preventDefault(); toPaper(); return; }
    if (!to) return;
    e.preventDefault();
    rove(to);
    to.focus();
  }
  function pressed(cmd, on) {
    var b = st.toolbar.querySelector('[data-cmd="' + cmd + '"]');
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  }
  // The toolbar shows the state of what is selected.
  function toolbarState() {
    if (!st) return;
    var c = context(), t = textTarget(c), marks = {}, block = null, blocks = [];
    if (t) {
      var runs = readRuns(t);
      if (c.from === c.to) marks = Object.assign({}, marksAt(runs, c.from), st.pending && st.pending.key === tkey(t) ? st.pending.marks : {});
      else MARK_KEYS.forEach(function (k) { marks[k] = allHave(M().runs.slice(runs, c.from, c.to), k); });
      block = where(t.id).block;
      blocks = [block];
    } else if (c && c.type === "blocks") {
      blocks = c.ids.map(function (id) { var f = where(id); return f && f.block; }).filter(Boolean);
      block = blocks.length === 1 ? blocks[0] : null;
      // Worked out for a handful of blocks; not for a whole document selected.
      var texts = blocks.length <= 50 ? textBlocksIn(c.ids) : [];
      MARK_KEYS.forEach(function (k) { marks[k] = texts.length > 0 && texts.every(function (b) { return b.type !== "prompt" && allHave(b.runs, k); }); });
    }
    BUTTONS.forEach(function (b) { if (b && b[3]) pressed(b[0], !!marks[b[3]]); });
    var kind = kindOf(block);
    st.typeSelect.value = TYPE_NAMES[kind] ? kind : block && block.type === "list" ? "" : block ? "-" : "paragraph";
    pressed("bullet", kind === "bullet");
    pressed("number", kind === "number");
    var align = block && block.type === "paragraph" ? (block.align || "left") : "";
    pressed("alignLeft", align === "left"); pressed("alignCenter", align === "center");
    pressed("alignRight", align === "right"); pressed("alignJustify", align === "justify");
    var tops = blocks.map(function (b) { var f = where(topOf(b.id)); return f && f.block; }).filter(Boolean);
    pressed("landscape", tops.length > 0 && tops.every(function (b) { return b.land === true; }));
    historyChanged();
    refreshContext(false);
  }
  function historyChanged() {
    if (!st) return;
    [["undo", H().canUndo()], ["redo", H().canRedo()]].forEach(function (x) {
      var b = st.toolbar.querySelector('[data-cmd="' + x[0] + '"]');
      if (b) b.setAttribute("aria-disabled", x[1] ? "false" : "true");
    });
  }

  // The controls for what is selected: a table's, a picture's, a kept object's.
  function contextKey() {
    var c = context();
    if (!c) return "";
    if (c.type === "blocks") {
      var f = c.ids.length === 1 ? where(c.ids[0]) : null;
      if (f && (f.block.type === "picture" || f.block.type === "kept" || f.block.type === "table")) return f.block.type + ":" + f.block.id;
      if (f && f.table) return "blocks+table:" + f.table.id;
      return "blocks";
    }
    var w = where(c.id);
    // The caret in a caption: its picture's or drawing's controls stay.
    if (w && c.kind === "caption" && (w.block.type === "picture" || w.block.type === "kept")) return w.block.type + ":" + w.block.id;
    return w && w.table ? "table:" + w.table.id : "";
  }
  function ctxButton(text, title, fn, opts) {
    var b = h("button", { type: "button", class: "btn tb", title: title, tabindex: "-1", text: text });
    if (opts && opts.pressed != null) b.setAttribute("aria-pressed", opts.pressed ? "true" : "false");
    if (opts && opts.danger) b.classList.add("danger");
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    b.addEventListener("click", fn);
    return b;
  }
  function alignButtons(block, center) {
    var now = block.align || center;
    return [["left", "Left", "Align left"], ["center", "Centre", "Centre"], ["right", "Right", "Align right"]].map(function (a) {
      return ctxButton(a[1], a[2], function () { setAlign(a[0]); }, { pressed: now === a[0] });
    });
  }
  function blockButtons() {
    return [
      ctxButton("Move up", "Move up (Alt+Shift+Up)", function () { move(-1); }),
      ctxButton("Move down", "Move down (Alt+Shift+Down)", function () { move(1); }),
      ctxButton("Duplicate", "Make a copy after it", duplicate),
      ctxButton("Paragraph after", "Add a paragraph after it, to carry on writing there", function () { paragraphAfter(); }),
      ctxButton("Delete", "Delete what is selected", deleteSelected, { danger: true })
    ];
  }
  function pictureControls(block) {
    var id = block.id, cm = (block.width / 96 * 2.54).toFixed(1);
    var width = h("input", { type: "number", class: "tb-num", min: "0.5", max: "40", step: "0.1", value: cm, tabindex: "-1", "aria-label": "Width in centimetres" });
    width.addEventListener("change", function () { var v = parseFloat(width.value); if (v > 0) setPictureWidth(id, v / 2.54 * 96); });
    var alt = h("input", { type: "text", class: "tb-alt", value: block.alt || "", tabindex: "-1", maxlength: "500", "aria-label": "Alternative text", placeholder: "Describe the picture" });
    alt.addEventListener("change", function () {
      var v = alt.value.trim();
      editBlock(id, "Alternative text", function (b) { if (v) b.alt = v; else delete b.alt; });
    });
    return h("div", { class: "tb-group", role: "group", "aria-label": "Picture" }, [
      h("label", { class: "tb-field" }, [h("span", { text: "Width (cm)" }), width]),
      ctxButton("Fit to page width", "Make the picture as wide as the text", function () { setPictureWidth(id, maxWidth(where(id).block)); })
    ].concat(alignButtons(block, "center")).concat([
      ctxButton("Caption", "Add or edit the caption", function () { addCaption(id); }),
      h("label", { class: "tb-field" }, [h("span", { text: "Alternative text" }), alt]),
      ctxButton("Replace", "Replace with another picture", function () { pickFile(function (file) { replaceWithFile(id, file); }); })
    ]).concat(blockButtons()));
  }
  function keptControls(block) {
    var id = block.id;
    return h("div", { class: "tb-group", role: "group", "aria-label": "Drawing kept from Word" }, alignButtons(block, "center").concat([
      ctxButton("Caption", "Add or edit the caption", function () { addCaption(id); }),
      ctxButton("Replace with a picture", "Put a picture in its place. Undo brings the drawing back.", function () { pickFile(function (file) { replaceWithFile(id, file); }); })
    ]).concat(blockButtons()));
  }
  function refreshContext(force) {
    if (!st || !st.ctxBox) return;
    // Not while the pointer is down in the paper: the click is left to finish
    // on what it started on, and the controls change on release.
    if (st.pressing) { st.ctxForce = st.ctxForce || !!force; return; }
    var key = contextKey();
    if (!force && key === st.ctxKey) return;
    var box = st.ctxBox, doc = st.doc;
    // The row the controls go in is always there, one line high, and scrolls
    // sideways when they are wider than the view (editor.css), so the toolbar
    // keeps its height and the page never moves under the pointer. Redrawn for
    // the same table or picture it stays scrolled where it was.
    var left = key === st.ctxKey ? box.scrollLeft : 0;
    // A control in use keeps the keyboard: the one in the same place gets it back.
    var held = box.contains(active()) ? Array.prototype.indexOf.call(box.querySelectorAll("button, input"), active()) : -1;
    st.ctxKey = key;
    box.textContent = "";
    var m = /^(?:blocks\+)?(picture|kept|table):(.*)$/.exec(key), f = m ? where(m[2]) : null;
    if (f && m[1] === "picture" && f.block.type === "picture") box.appendChild(pictureControls(f.block));
    else if (f && m[1] === "kept" && f.block.type === "kept") box.appendChild(keptControls(f.block));
    else if (f && m[1] === "table" && T() && T().controls) {
      box.appendChild(T().controls(doc, f.block));
      if (/^blocks/.test(key) || key.indexOf("table:") === 0 && st.sel.length) box.appendChild(h("div", { class: "tb-group", role: "group", "aria-label": "Selected blocks" }, blockButtons()));
    } else if (key === "blocks") box.appendChild(h("div", { class: "tb-group", role: "group", "aria-label": "Selected blocks" }, blockButtons()));
    if (!box.firstChild) box.appendChild(h("span", { class: "tb-hint", text: "Click in a table or on a picture for its controls." }));
    box.scrollLeft = left;
    if (held !== -1) {
      var again = box.querySelectorAll("button, input")[held];
      if (again) again.focus(); else toPaper();
    }
    if (!st.toolbar.querySelector('[tabindex="0"]')) rove(toolControls()[0]);
  }
  // The pointer is up (or was never really down): the controls catch up.
  function released() {
    if (!st || !st.pressing) return;
    st.pressing = false;
    var force = !!st.ctxForce;
    st.ctxForce = false;
    refreshContext(force);
  }

  // ---- the outline ---------------------------------------------------------------

  function later() {
    if (!st) return;
    clearTimeout(st.olTimer);
    st.olTimer = setTimeout(function () { if (st) drawOutline(); }, 150);
  }
  function drawOutline() {
    var box = st && st.ownOutline ? st.outline : null;
    if (!box) return;
    clearTimeout(st.olTimer);
    var items = M().outline(st.doc) || [], sig = JSON.stringify(items);
    if (sig === st.olSig && box.firstChild) return;
    st.olSig = sig;
    var had = box.contains(active());
    box.textContent = "";
    box.appendChild(h("div", { class: "ol-title", id: "ol-title", text: "Outline" }));
    if (!items.length) { box.appendChild(h("p", { class: "ol-empty", text: "Headings you add appear here." })); return; }
    if (!items.some(function (o) { return o.id === st.olCur; })) st.olCur = items[0].id;
    var tree = h("div", { class: "ol-tree", role: "tree", "aria-labelledby": "ol-title" });
    items.forEach(function (o) {
      var label = (o.number ? o.number + " " : "") + (String(o.text || "").trim() || "Untitled heading");
      tree.appendChild(h("div", {
        class: "ol-item lvl-" + o.level, role: "treeitem", "aria-level": String(o.level), "data-heading-id": o.id,
        tabindex: o.id === st.olCur ? "0" : "-1"
      }, [
        h("span", { class: "ol-text", text: label }),
        o.count ? h("span", { class: "ol-n", text: String(o.count), title: plural(o.count, "prompt") + " still to complete", "aria-label": plural(o.count, "prompt") + " still to complete" }) : null,
        h("button", { type: "button", class: "ol-menu", tabindex: "-1", "aria-haspopup": "menu", "aria-label": "Section menu, " + label, title: "Section menu", text: "⋯" })
      ]));
    });
    box.appendChild(tree);
    if (had) focusOutline(st.olCur);
  }
  // The entries of whichever outline is in the sidebar: ours or the shell's.
  function outlineItems() { return st.outline ? Array.prototype.slice.call(st.outline.querySelectorAll('[role="treeitem"]')) : []; }
  function focusOutline(id) {
    var items = outlineItems();
    var to = items.filter(function (n) { return n.getAttribute("data-heading-id") === id; })[0]
      || items.filter(function (n) { return n.getAttribute("tabindex") === "0"; })[0] || items[0];
    if (!to) return false;
    if (st.ownOutline) {
      st.olCur = to.getAttribute("data-heading-id");
      items.forEach(function (n) { n.setAttribute("tabindex", n === to ? "0" : "-1"); });
    }
    to.focus();
    return true;
  }
  function goHeading(id) {
    st.olCur = id;
    focusBlock(id, { at: 0, scroll: false, flash: true });
    var el = elOf(id);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
  }
  // The heading a block sits under.
  function headingOver(id) {
    var blocks = st.doc.blocks;
    for (var i = topIndex(topOf(id)); i >= 0; i--) if (blocks[i].type === "heading") return blocks[i].id;
    return null;
  }
  function moveSection(id, dir) {
    var items = M().outline(st.doc) || [], i = -1;
    items.forEach(function (o, n) { if (o.id === id) i = n; });
    if (i === -1) return;
    // The section it swaps with: the one before or after at the same level,
    // inside the same parent.
    var other = null;
    for (var k = i + dir; k >= 0 && k < items.length; k += dir) {
      if (items[k].level < items[i].level) break;
      if (items[k].level === items[i].level) { other = items[k]; break; }
    }
    if (!other) return;
    var doc = st.doc, mine = M().sectionRange(doc, id), theirs = M().sectionRange(doc, other.id);
    // Whichever comes later goes in front of the other.
    var moving = dir < 0 ? mine : theirs, beforeId = dir < 0 ? other.id : id;
    closePanel();
    var entry = change(dir < 0 ? "Move section up" : "Move section down", moving, function () { M().move(doc, moving, beforeId); });
    var ref = elOf(beforeId);
    moving.forEach(function (bid) { var el = elOf(bid); if (el) st.paper.insertBefore(el, ref); });
    syncNumbers();
    finish(entry);
    st.olCur = id;
    drawOutline();
    focusOutline(id);
    say("Section moved " + (dir < 0 ? "up." : "down."));
  }
  function addSectionAfter(id) {
    var doc = st.doc, range = M().sectionRange(doc, id), f = where(id);
    if (!f || !range.length) return;
    var head = M().make.heading(doc, f.block.level || 1, ""), para = M().make.paragraph(doc, "");
    var done = insertBlocksAfter(range[range.length - 1], [head, para], "Add section");
    if (!done) return;
    focusBlock(head.id, { at: 0 });
    finish(done.entry);
  }
  function deleteSection(id) {
    var a = A(), doc = st.doc, range = M().sectionRange(doc, id);
    if (!range.length) return;
    var ask = a && a.confirmBox ? a.confirmBox({
      title: "Delete this section?", text: "The heading and the " + plural(range.length - 1, "block") + " under it will be deleted. Undo brings them back.",
      ok: "Delete", cancel: "Cancel"
    }) : Promise.resolve(true);
    Promise.resolve(ask).then(function (yes) {
      if (!yes || !st || st.doc !== doc) return;
      removeBlocks(M().sectionRange(doc, id), "Delete section");
      drawOutline();
    });
  }
  function closeMenu(refocus) {
    var m = st && st.menu;
    if (!m) return;
    st.menu = null;
    if (m.el.parentNode) m.el.parentNode.removeChild(m.el);
    m.button.setAttribute("aria-expanded", "false");
    if (refocus) focusOutline(m.id);
  }
  function openMenu(item) {
    closeMenu();
    var id = item.getAttribute("data-heading-id"), button = item.querySelector(".ol-menu");
    function entry(text, fn) {
      return h("button", { type: "button", role: "menuitem", class: "ol-pop-item", tabindex: "-1", text: text, onclick: function () { closeMenu(); fn(id); } });
    }
    var pop = h("div", { class: "ol-pop", role: "menu", "aria-label": "Section" }, [
      entry("Add a section after", addSectionAfter), entry("Delete the section", deleteSection)
    ]);
    pop.addEventListener("keydown", function (e) {
      var all = Array.prototype.slice.call(pop.children), i = all.indexOf(e.target);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); all[(i + (e.key === "ArrowDown" ? 1 : all.length - 1)) % all.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
      else if (e.key !== "Enter" && e.key !== " " && e.key !== "Tab") e.stopPropagation();
    });
    item.parentNode.insertBefore(pop, item.nextSibling);
    button.setAttribute("aria-expanded", "true");
    st.menu = { el: pop, id: id, button: button };
    st.olCur = id;
    pop.firstChild.focus();
  }
  function onOutlineClick(e) {
    var item = e.target.closest ? e.target.closest(".ol-item") : null;
    if (!item) return;
    if (e.target.closest(".ol-menu")) { if (st.menu && st.menu.id === item.getAttribute("data-heading-id")) closeMenu(true); else openMenu(item); return; }
    closeMenu();
    goHeading(item.getAttribute("data-heading-id"));
  }
  function onOutlineKey(e) {
    var item = e.target.closest ? e.target.closest(".ol-item") : null;
    if (!item || e.target !== item) return;
    var items = outlineItems(), i = items.indexOf(item), id = item.getAttribute("data-heading-id");
    var to = null;
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); moveSection(id, e.key === "ArrowUp" ? -1 : 1); return; }
    if (e.key === "ArrowDown") to = items[i + 1];
    else if (e.key === "ArrowUp") to = items[i - 1];
    else if (e.key === "Home") to = items[0];
    else if (e.key === "End") to = items[items.length - 1];
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goHeading(id); return; }
    else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10") || e.key === "ArrowRight") { e.preventDefault(); openMenu(item); return; }
    else if (e.key === "Delete") { e.preventDefault(); deleteSection(id); return; }
    else return;
    e.preventDefault();
    if (to) focusOutline(to.getAttribute("data-heading-id"));
  }

  // ---- keys ----------------------------------------------------------------------

  function comboOf(e) {
    var k = e.key || "", code = e.code || "", mod = e.ctrlKey || e.metaKey;
    // With Ctrl held, a digit or a punctuation key is named by where it is on
    // the keyboard: Shift and layouts change the character it gives.
    if (mod && /^Digit\d$/.test(code)) k = code.slice(5);
    else if (mod && code === "Period") k = ".";
    else if (mod && code === "Comma") k = ",";
    else if (k === " " || code === "Space") k = "Space";
    else if (k.length === 1) k = k.toUpperCase();
    return (mod ? "Ctrl+" : "") + (e.altKey ? "Alt+" : "") + (e.shiftKey ? "Shift+" : "") + k;
  }
  var KEYS = {
    "Ctrl+B": "bold", "Ctrl+I": "italic", "Ctrl+U": "underline", "Ctrl+Shift+X": "strike",
    "Ctrl+.": "superscript", "Ctrl+,": "subscript", "Ctrl+Space": "clearRed", "Ctrl+K": "link",
    "Ctrl+Alt+1": "heading1", "Ctrl+Alt+2": "heading2", "Ctrl+Alt+3": "heading3", "Ctrl+Alt+0": "paragraph",
    "Ctrl+Shift+8": "bullet", "Ctrl+Shift+7": "number", "Ctrl+Enter": "pageBreak",
    "Alt+Shift+ArrowUp": "moveUp", "Alt+Shift+ArrowDown": "moveDown",
    "Ctrl+Z": "undo", "Ctrl+Y": "redo", "Ctrl+Shift+Z": "redo"
  };
  function mapped(e) {
    var cmd = KEYS[comboOf(e)];
    // AltGr is Ctrl+Alt to the browser, and types characters on some keyboards.
    if (!cmd || (e.getModifierState && e.getModifierState("AltGraph"))) return false;
    e.preventDefault();
    run(cmd);
    return true;
  }
  function caretBox(el, sel) {
    var s = docSel(), r = s && s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
    if (r) { r.collapse(s.focusNode === r.startContainer && s.focusOffset === r.startOffset); var box = r.getClientRects()[0]; if (box && box.height) return box; }
    // No box for a caret at an edge or on an empty line: the character beside it has one.
    var len = R().textLength(el), at = sel ? sel.from : 0, near = null;
    if (at < len) { near = R().rangeAt(el, at, at + 1).getClientRects()[0]; if (near && near.height) return { top: near.top, bottom: near.bottom, left: near.left, height: near.height }; }
    if (at > 0) { var rs = R().rangeAt(el, at - 1, at).getClientRects(); near = rs[rs.length - 1]; if (near && near.height) return { top: near.top, bottom: near.bottom, left: near.right, height: near.height }; }
    return null;
  }
  // Whether the caret is on the block's first line, and on its last.
  function lineEdges(el, sel) {
    var box = caretBox(el, sel);
    if (!box) return { top: true, bottom: true, x: null };
    var all = el.getBoundingClientRect(), cs = el.ownerDocument.defaultView.getComputedStyle(el), slack = box.height * 0.75;
    return {
      top: box.top - (all.top + (parseFloat(cs.paddingTop) || 0)) < slack,
      bottom: (all.bottom - (parseFloat(cs.paddingBottom) || 0)) - box.bottom < slack,
      x: box.left
    };
  }
  // Up or down out of a block, keeping the horizontal position where it can.
  function stepOut(dir, x) {
    var t = st.cur, f = where(t.id), to = f.list[f.index + dir];
    if (!to) return false;
    if (to.type === "table") {
      var cells = elOf(to.id) ? elOf(to.id).querySelectorAll("[data-edit]") : [];
      var cell = cells[dir < 0 ? cells.length - 1 : 0], host = cell ? cell.closest("[data-block-id]") : null;
      if (host) focusBlock(host.getAttribute("data-block-id"), { at: dir < 0 ? "end" : "start" }); else selectBlocks([to.id]);
      return true;
    }
    if (!isText(to)) { selectBlocks([to.id]); return true; }
    focusBlock(to.id, { at: dir < 0 ? "end" : "start" });
    var el = textOf(to.id), doc = el.ownerDocument;
    if (x != null && doc.caretRangeFromPoint) {
      var box = el.getBoundingClientRect(), y = dir < 0 ? box.bottom - 6 : box.top + 6;
      var r = doc.caretRangeFromPoint(Math.max(box.left + 1, Math.min(x, box.right - 1)), y);
      if (r && el.contains(r.startContainer)) { var o = R().offsetsOf(el, r); placeText({ kind: "block", id: to.id, from: o.from, to: o.from }); }
    }
    return true;
  }
  function onKeydown(e) {
    if (!st || e.isComposing || st.composing) return;
    var target = e.target;
    if (st.cur && st.cur.el.contains(target)) return textKeys(e);
    if (target === st.paper) return blockKeys(e);
  }
  function textKeys(e) {
    var t = st.cur, combo = comboOf(e), f = where(t.id);
    if (!f) return;
    // Tab and the arrows inside a table belong to the table.
    if (t.kind === "block" && f.table && T() && T().keydown && T().keydown(e, { doc: st.doc })) return;
    if (mapped(e)) return;
    var sel = liveText() || { from: 0, to: 0 }, len = R().textLength(t.el), caret = sel.from === sel.to;
    if (combo === "Enter") { e.preventDefault(); split(); }
    else if (combo === "Shift+Enter") { e.preventDefault(); if (!t.plain) insertText("\n", { label: "Line break" }); }
    else if (combo === "Backspace" && caret && sel.from === 0 && t.kind === "block") { e.preventDefault(); joinBack(); }
    else if (combo === "Delete" && caret && sel.from === len && t.kind === "block") { e.preventDefault(); joinForward(); }
    else if (combo === "Tab" || combo === "Shift+Tab") {
      // Tab never leaves the paper from inside text: Escape, then Tab, does.
      e.preventDefault();
      if (t.kind === "block" && f.block.type === "list") setLevel(e.shiftKey ? -1 : 1);
    } else if (combo === "Escape") {
      e.preventDefault();
      if (t.kind === "fn") closePanel(true); else selectBlocks([topOf(t.id)]);
    } else if (combo === "Ctrl+A") {
      e.preventDefault();
      // All the text of the block; a second time, every block.
      if (t.kind === "block" && (len === 0 || (sel.from === 0 && sel.to === len))) selectBlocks(st.doc.blocks.map(function (b) { return b.id; }));
      else setRange(t.el, 0, len);
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.ctrlKey && !e.metaKey && !e.altKey && t.kind === "block") {
      var dir = e.key === "ArrowUp" ? -1 : 1, edge = lineEdges(t.el, sel);
      if (!(dir < 0 ? edge.top : edge.bottom)) return;
      if (e.shiftKey) {
        // A selection that leaves its block becomes whole blocks.
        var here = topOf(t.id), i = topIndex(here), other = st.doc.blocks[i + dir];
        if (!other) return;
        e.preventDefault();
        dropCurrent();
        docSel().removeAllRanges();
        st.lastText = null;
        setSel(rangeIds(here, other.id), here);
        st.paper.focus({ preventScroll: true });
      } else if (stepOut(dir, edge.x)) e.preventDefault();
    } else if ((combo === "ArrowLeft" || combo === "ArrowRight") && caret && !t.plain) {
      // A footnote mark is one step for the caret. Left to the browser it is
      // two, with nothing to see between them (the mark has an unseen space
      // on each side to hold the caret).
      var to = combo === "ArrowRight" ? (fnAt(readRuns(t), sel.from) ? sel.from + 1 : -1) : (fnAt(readRuns(t), sel.from - 1) ? sel.from - 1 : -1);
      if (to === -1) return;
      e.preventDefault();
      setRange(t.el, to, to);
      st.lastText = Object.assign({}, sel, { from: to, to: to });
      toolbarState();
    }
  }
  // The key of the footnote whose mark stands at an offset, or "".
  function fnAt(runs, at) {
    var pos = 0, key = "";
    (runs || []).forEach(function (r) {
      if (r.fn && pos === at) key = r.fn;
      pos += r.fn ? 1 : (r.t || "").length;
    });
    return key;
  }
  // Backspace straight after a footnote mark, or Delete straight before it,
  // takes the reference away. Done on the model: the browser would only
  // delete the unseen space beside the mark, which is put back at once, so
  // the key would seem dead. The footnote's text stays in memory for undo.
  function dropMark(t, sel, at, key) {
    H().coalesce(null);
    var after = Object.assign({}, sel, { from: at, to: at });
    setRuns(t, M().runs.remove(readRuns(t), at, at + 1), { label: "Delete footnote reference", selBefore: sel, selAfter: after });
    if (st.panel && st.panel.kind === "fn" && st.panel.key === key) closePanel();
    refreshText(t);
    setRange(t.el, at, at);
    st.lastText = after;
    syncNumbers();
    touched({ blocks: [t.id] });
    toolbarState();
    later();
  }
  function blockKeys(e) {
    var combo = comboOf(e), one = st.sel.length === 1 ? where(st.sel[0]) : null;
    if (one && one.table && T() && T().keydown && T().keydown(e, { doc: st.doc, blockId: st.sel[0] })) return;
    if (mapped(e)) return;
    var blocks = st.doc.blocks;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      var dir = e.key === "ArrowUp" ? -1 : 1;
      if (!st.sel.length) { if (blocks.length) selectBlocks([blocks[dir < 0 ? blocks.length - 1 : 0].id]); return; }
      if (one && one.table) return;
      var anchor = st.anchor || st.sel[0], a = topIndex(anchor);
      // The moving end is the end of the selection away from where it began.
      var lo = topIndex(st.sel[0]), hi = topIndex(st.sel[st.sel.length - 1]), end = a === lo ? hi : lo;
      var to = Math.max(0, Math.min(blocks.length - 1, end + dir));
      if (e.shiftKey) setSel(rangeIds(anchor, blocks[to].id), anchor);
      else setSel([blocks[to].id], blocks[to].id);
      var shown = elOf(blocks[to].id);
      if (shown && shown.scrollIntoView) shown.scrollIntoView({ block: "nearest" });
    } else if (combo === "Enter") {
      e.preventDefault();
      if (!one) return;
      if (isText(one.block)) focusBlock(one.block.id, { at: "end" });
      else if (one.block.type === "table") { var cell = elOf(one.block.id).querySelector("[data-edit]"), host = cell && cell.closest("[data-block-id]"); if (host) focusBlock(host.getAttribute("data-block-id"), { at: 0 }); }
      else if (typeof one.block.caption === "string") placeText({ kind: "caption", id: one.block.id, from: 1e9 });
      // A picture, a drawing or a page break has nothing to type in: Enter
      // opens a paragraph after it.
      else paragraphAfter(one.block.id);
    } else if (combo === "Delete" || combo === "Backspace") { e.preventDefault(); deleteSelected(); }
    else if (combo === "Escape") {
      // From the blocks to the outline entry of their section.
      if (!st.sel.length || !st.outline) return;
      e.preventDefault();
      st.olSig = null;
      drawOutline();
      focusOutline(headingOver(st.sel[0]) || st.olCur);
    } else if (combo === "Ctrl+A") { e.preventDefault(); selectBlocks(blocks.map(function (b) { return b.id; })); }
  }
  // F6 goes round the three parts of the Edit page.
  function toPaper() {
    if (st.sel.length) { st.paper.focus({ preventScroll: true }); return; }
    if (st.lastText && placeText(st.lastText)) return;
    st.paper.focus({ preventScroll: true });
  }
  function onDocKey(e) {
    if (!st || e.key !== "F6" || e.ctrlKey || e.altKey || e.metaKey) return;
    if (!st.paper.offsetParent && !st.paper.getClientRects().length) return;   // another page is showing
    var doc = st.paper.ownerDocument, at = active(), side = doc.getElementById("sidebar");
    var parts = [side, st.toolbar, st.paper].filter(Boolean);
    var i = -1;
    parts.forEach(function (p, n) { if (p.contains(at)) i = n; });
    if (i === -1) i = parts.indexOf(st.paper);
    e.preventDefault();
    var to = parts[(i + (e.shiftKey ? parts.length - 1 : 1)) % parts.length];
    if (to === st.paper) toPaper();
    else if (to === st.toolbar) { var c = st.toolbar.querySelector('[tabindex="0"]') || toolControls()[0]; if (c) c.focus(); }
    else {
      var first = (st.outline && st.outline.querySelector('[role="treeitem"][tabindex="0"]')) || side.querySelector('button, a[href], [tabindex="0"]');
      if (first) first.focus();
    }
  }

  // ---- the browser's own editing, intercepted -----------------------------------------

  var FORMAT_INPUT = { formatBold: "bold", formatItalic: "italic", formatUnderline: "underline", formatStrikeThrough: "strike", formatSuperscript: "superscript", formatSubscript: "subscript" };
  function onBeforeInput(e) {
    var t = st && st.cur;
    if (!t || !t.el.contains(e.target)) return;
    var type = e.inputType || "";
    if (st.composing || e.isComposing) return;
    if (type === "insertParagraph") { e.preventDefault(); split(); return; }
    if (type === "insertLineBreak") { e.preventDefault(); if (!t.plain) insertText("\n", { label: "Line break" }); return; }
    if (FORMAT_INPUT[type]) { e.preventDefault(); run(FORMAT_INPUT[type]); return; }
    // The browser's undo does not survive a redraw; ours does.
    if (type === "historyUndo") { e.preventDefault(); run("undo"); return; }
    if (type === "historyRedo") { e.preventDefault(); run("redo"); return; }
    // Paste and drop are read in their own events. Anything else that would
    // restructure or restyle the block is refused.
    if (/^format|^insertFrom|^insertOrderedList|^insertUnorderedList|^insertHorizontalRule|^insertLink|^deleteByDrag/.test(type)) { e.preventDefault(); return; }
    var sel = liveText();
    if (!sel) return;
    if (type === "deleteContentBackward" && sel.from === sel.to && sel.from === 0 && t.kind === "block") { e.preventDefault(); joinBack(); return; }
    var del = /^delete(?:Content|Word|SoftLine|HardLine)(Backward|Forward)$/.exec(type);
    if (del && sel.from === sel.to && !t.plain) {
      var markAt = del[1] === "Backward" ? sel.from - 1 : sel.from, markKey = fnAt(readRuns(t), markAt);
      if (markKey) { e.preventDefault(); dropMark(t, sel, markAt, markKey); return; }
    }
    if ((type === "insertText" || type === "insertReplacementText") && e.data && sel.from === sel.to && !t.plain) {
      var pending = st.pending && st.pending.key === tkey(t) && st.pending.at === sel.from ? st.pending.marks : null;
      if (pending || linkEndsAt(readRuns(t), sel.from)) {
        // Typing at the end of a link does not extend it, and a format switched
        // on with nothing selected applies to what is typed: both through the model.
        e.preventDefault();
        st.pending = null;
        insertText(e.data, { typing: true, marks: pending });
        return;
      }
    }
    if (!H().coalesce(tkey(t))) st.typedFrom = sel;
  }
  function onInput(e) {
    var t = st && st.cur;
    if (!t || !t.el.contains(e.target)) return;
    // Nothing is read during an IME composition until it ends.
    if (st.composing || e.isComposing) return;
    commit(e.data);
  }
  function onSelectionChange() {
    if (!st || !st.cur) return;
    var sel = liveText();
    if (st.pending && sel && (st.pending.key !== tkey(st.cur) || sel.from !== st.pending.at || sel.to !== sel.from)) st.pending = null;
    toolbarState();
  }
  function onFocusOut(e) {
    var t = st && st.cur;
    if (!t || e.target !== t.el) return;
    if (e.relatedTarget && t.el.contains(e.relatedTarget)) return;
    liveText();
    dropCurrent();
  }
  function onPaperFocus(e) {
    // Tab into the paper with nothing selected: back to where the caret was.
    if (!st || e.target !== st.paper || st.sel.length || st.busy) return;
    if (st.lastText && where(st.lastText.id)) { st.busy = true; placeText(st.lastText); st.busy = false; }
  }

  // ---- the pointer ------------------------------------------------------------------

  function onPointerDown(e) {
    if (!st || e.button > 0) return;
    var target = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    if (!target || !st.paper.contains(target)) return;
    st.pressing = true;
    var edit = target.closest("[data-edit]");
    if (target.closest(".panel-row") && !edit) return;   // the panel's own buttons and field
    var mark = target.closest("sup.fn");
    if (mark && !target.closest(".panel-row")) {
      var owner = mark.closest("[data-block-id]");
      e.preventDefault();
      if (owner) openFootnote(mark.getAttribute("data-fn"), owner.getAttribute("data-block-id"), true);
      return;
    }
    var top = blockUnder(e);
    if (e.shiftKey && top) {
      var from = st.anchor || (st.cur && st.cur.kind !== "fn" ? topOf(st.cur.id) : null);
      if (from && from !== top && topIndex(from) !== -1) {
        // Shift+click on another block: the blocks from here to there.
        e.preventDefault();
        dropCurrent();
        docSel().removeAllRanges();
        st.lastText = null;
        setSel(rangeIds(from, top), from);
        st.paper.focus({ preventScroll: true });
        return;
      }
    }
    if (edit) {
      // Editable from this moment, so the browser's own click puts the caret in it.
      setSel([], null, true);
      activate(edit);
      st.drag = { start: top, el: edit, blocks: false, anchor: null, x: e.clientX, y: e.clientY };
      toolbarState();
      return;
    }
    var blk = target.closest(".blk");
    if (!blk) {
      // The empty paper under the last block: the end of the document. The
      // caret goes to the end of its last text, and when it ends with a table,
      // a picture, a drawing or a page break a paragraph is opened after it.
      var tail = st.paper.lastElementChild, all = st.doc.blocks, last = all[all.length - 1];
      if (target !== st.paper || !tail || !last || !(e.clientY > tail.getBoundingClientRect().bottom)) return;
      e.preventDefault();
      if (isText(last)) focusBlock(last.id, { at: "end", scroll: false }); else paragraphAfter(last.id);
      return;
    }
    var id = blk.getAttribute("data-block-id"), type = blk.getAttribute("data-type");
    e.preventDefault();
    if (type === "table") {
      var cell = target.closest("td, th"), texts = cell ? cell.querySelectorAll("[data-edit]") : [];
      var host = texts.length ? texts[texts.length - 1].closest("[data-block-id]") : null;
      if (host) focusBlock(host.getAttribute("data-block-id"), { at: "end", scroll: false }); else selectBlocks([id]);
      return;
    }
    if (isText(where(id) && where(id).block)) { focusBlock(id, { at: "end", scroll: false }); return; }
    // A picture, a kept object or a page break is selected as a block.
    selectBlocks([id]);
    st.drag = { start: top, el: null, blocks: true, anchor: null, x: e.clientX, y: e.clientY };
  }
  function scroller() {
    var el = st.paper.parentElement, view = st.paper.ownerDocument.defaultView;
    while (el && el !== st.paper.ownerDocument.body) {
      var o = view.getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight) return el;
      el = el.parentElement;
    }
    return st.paper.ownerDocument.scrollingElement;
  }
  function onPointerMove(e) {
    // A move with no button down: the release was missed (it happened outside the window).
    if (st && st.pressing && !(e.buttons & 1)) released();
    var d = st && st.drag;
    if (!d || !d.start || !(e.buttons & 1)) return;
    if (!d.far) {
      // A click is seldom perfectly still: a drag starts a few pixels from the press.
      if ((d.x || d.y) && Math.abs(e.clientX - d.x) < 4 && Math.abs(e.clientY - d.y) < 4) return;
      d.far = true;
    }
    var over = blockUnder(e);
    if (!over) return;
    if (over !== d.start) {
      if (!d.blocks) {
        // The drag has left the block it began in: whole blocks from here on.
        var s = docSel();
        d.anchor = s && s.anchorNode && d.el && d.el.contains(s.anchorNode) ? { node: s.anchorNode, offset: s.anchorOffset } : null;
        d.blocks = true;
        st.paper.classList.add("dragging");
        dropCurrent();
        if (s) s.removeAllRanges();
        st.lastText = null;
      }
      setSel(rangeIds(d.start, over), d.start);
      var box = scroller(), r = box.getBoundingClientRect ? box.getBoundingClientRect() : { top: 0, bottom: 0 };
      if (e.clientY && r.bottom) {
        if (e.clientY < r.top + 40) box.scrollTop -= 24;
        else if (e.clientY > r.bottom - 40) box.scrollTop += 24;
      }
    } else if (d.blocks && d.el) {
      // Back in the block it began in: a text selection again.
      d.blocks = false;
      st.paper.classList.remove("dragging");
      setSel([], null);
      activate(d.el);
      d.el.focus({ preventScroll: true });
      var doc = d.el.ownerDocument, to = doc.caretRangeFromPoint && (e.clientX || e.clientY) ? doc.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if (d.anchor && d.el.contains(d.anchor.node) && to && d.el.contains(to.startContainer)) docSel().setBaseAndExtent(d.anchor.node, d.anchor.offset, to.startContainer, to.startOffset);
      else setRange(d.el, R().textLength(d.el), R().textLength(d.el));
    }
  }
  function onPointerUp() {
    var d = st && st.drag;
    released();
    if (!d) return;
    st.drag = null;
    st.paper.classList.remove("dragging");
    if (d.blocks && st.sel.length && active() !== st.paper) st.paper.focus({ preventScroll: true });
  }

  // ---- mount ---------------------------------------------------------------------

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    st.offs.push(function () { target.removeEventListener(type, fn, opts); });
  }
  function mount(container) {
    var a = A(), doc = a && a.state ? a.state.doc : null;
    var page = (container && container.ownerDocument) || document;
    container = container || page.getElementById("edit-view");
    // Mounting the document that is already on the paper changes nothing: its
    // blocks are built once and survive a visit to another page.
    if (st && st.doc === doc && st.root === container) return;
    unmount();
    if (!doc || !container) return;
    var toolbar = page.getElementById("toolbar"), paper = page.getElementById("paper");
    if (!toolbar || !container.contains(toolbar)) { toolbar = h("div", { id: "toolbar", role: "toolbar", "aria-label": "Formatting" }); container.appendChild(toolbar); }
    if (!paper || !container.contains(paper)) { paper = h("div", { id: "paper", tabindex: "0" }); container.appendChild(paper); }
    st = {
      doc: doc, root: container, paper: paper, toolbar: toolbar, outline: page.getElementById("outline"), els: {},
      cur: null, lastText: null, sel: [], anchor: null, pending: null, composing: false, drag: null, panel: null,
      menu: null, clip: null, ctxKey: null, olSig: null, olCur: null, olTimer: 0, typedFrom: null, offs: [], busy: false,
      pressing: false, ctxForce: false
    };
    // The outline in the sidebar is the shell's when the shell draws one
    // (App.DocApp does, before it mounts the editor); ours when nothing does.
    st.ownOutline = !!st.outline && (!st.outline.firstChild || !!st.outline.querySelector(".ol-title"));
    // The history belongs to the document: mounting the same one again (the
    // shell does, when an option changes) keeps it.
    if (lastDoc && lastDoc !== doc) H().clear();
    lastDoc = doc;
    paper.setAttribute("role", "group");
    paper.setAttribute("aria-label", "Document");
    paper.classList.add("paper");
    buildToolbar();
    drawPaper();
    st.olSig = null;
    drawOutline();
    on(paper, "keydown", onKeydown);
    on(paper, "beforeinput", onBeforeInput);
    on(paper, "input", onInput);
    on(paper, "compositionstart", function () { st.composing = true; });
    on(paper, "compositionend", function (e) { st.composing = false; if (st.cur && st.cur.el.contains(e.target)) commit(e.data); });
    on(paper, "focusout", onFocusOut);
    on(paper, "focus", onPaperFocus);
    on(paper, "pointerdown", onPointerDown);
    on(paper, "copy", function (e) { onCopy(e, false); });
    on(paper, "cut", function (e) { onCopy(e, true); });
    on(paper, "paste", onPaste);
    on(paper, "dragstart", function (e) { e.preventDefault(); });
    on(paper, "dragover", function (e) { if (hasType(e.dataTransfer, "Files")) e.preventDefault(); });
    on(paper, "drop", onDrop);
    on(toolbar, "click", onToolbarClick);
    on(toolbar, "keydown", onToolbarKey);
    on(toolbar, "focusin", function (e) { if (toolControls().indexOf(e.target) !== -1) rove(e.target); });
    if (st.ownOutline) {
      on(st.outline, "click", onOutlineClick);
      on(st.outline, "keydown", onOutlineKey);
      on(st.outline, "focusin", function (e) { var item = e.target.closest ? e.target.closest(".ol-item") : null; if (item && e.target === item) st.olCur = item.getAttribute("data-heading-id"); });
    }
    on(page, "selectionchange", onSelectionChange);
    on(page, "pointermove", onPointerMove);
    on(page, "pointerup", onPointerUp);
    on(page, "pointercancel", onPointerUp);
    // A key, or a command, is never part of a press: the flag cannot stick.
    on(page, "keydown", released, true);
    on(page, "pointerdown", function (e) { if (st.menu && !st.menu.el.contains(e.target) && !st.menu.button.contains(e.target)) closeMenu(); });
    on(page, "keydown", onDocKey);
    toolbarState();
    // A block scrolled into view (the caret's, a jump's, an arrow key's out of
    // the block below) is not left under the pinned toolbar: editor.css gives
    // the blocks a scroll margin of the toolbar's height. On the blocks, not as
    // scroll padding on the view, which would scroll the page whenever a
    // control in the toolbar took the keyboard.
    var pad = function () { if (st && st.toolbar === toolbar) container.style.setProperty("--doc-toolbar-h", toolbar.offsetHeight + "px"); };
    pad();
    var RO = page.defaultView && page.defaultView.ResizeObserver;
    if (RO) {
      var ro = new RO(pad);
      ro.observe(toolbar);
      st.offs.push(function () { ro.disconnect(); container.style.removeProperty("--doc-toolbar-h"); });
    }
  }
  function unmount() {
    if (!st) return;
    clearTimeout(st.olTimer);
    st.offs.forEach(function (off) { off(); });
    st.paper.textContent = "";
    st.paper.removeAttribute("aria-activedescendant");
    st.toolbar.textContent = "";
    if (st.ownOutline) st.outline.textContent = "";
    st = null;
  }

  // ---- commands by name -------------------------------------------------------------

  var commands = {
    bold: function () { format("b"); }, italic: function () { format("i"); }, underline: function () { format("u"); },
    strike: function () { format("s"); }, superscript: function () { format("sup"); }, subscript: function () { format("sub"); },
    code: function () { format("code"); }, red: function () { format("red"); }, clearRed: function () { format("red", false); },
    link: openLink, footnote: insertFootnote,
    paragraph: function () { setType("paragraph"); }, heading1: function () { setType("heading1"); },
    heading2: function () { setType("heading2"); }, heading3: function () { setType("heading3"); },
    prompt: function () { setType("prompt"); }, bullet: function () { setType("bullet"); }, number: function () { setType("number"); },
    indent: function () { setLevel(1); }, outdent: function () { setLevel(-1); },
    alignLeft: function () { setAlign("left"); }, alignCenter: function () { setAlign("center"); },
    alignRight: function () { setAlign("right"); }, alignJustify: function () { setAlign("justify"); },
    insertTable: insertTable, insertPicture: function () { pickFile(function (file) { insertPictureFile(file); }); },
    pageBreak: insertPageBreak, landscape: toggleLandscape,
    moveUp: function () { move(-1); }, moveDown: function () { move(1); },
    duplicate: duplicate, deleteBlocks: deleteSelected, paragraphAfter: function (id) { return paragraphAfter(id); },
    undo: function () { dropTyping(); if (!H().undo()) say("Nothing to undo."); },
    redo: function () { dropTyping(); if (!H().redo()) say("Nothing to redo."); }
  };
  function dropTyping() { H().coalesce(null); closeMenu(); }
  function run(command, arg) {
    if (!st || !commands[command]) return false;
    released();
    return commands[command](arg) !== false;
  }

  // ---- the test seam -------------------------------------------------------------------
  // Drives the editor as a person would, as far as a script can: synthetic
  // events do not make the browser act, so where the editor leaves a key or a
  // character to the browser, the browser's own editing command does it.

  var KEY_CODES = { ".": "Period", ",": "Comma", Space: "Space" };
  function keyEvent(combo) {
    var parts = String(combo).split("+"), key = parts.pop();
    if (key === "" && parts.length) { key = "+"; parts.pop(); }
    var init = { bubbles: true, cancelable: true, ctrlKey: false, altKey: false, shiftKey: false };
    parts.forEach(function (p) { init[p.toLowerCase() + "Key"] = true; });
    if (key === "Up" || key === "Down" || key === "Left" || key === "Right") key = "Arrow" + key;
    init.key = key === "Space" ? " " : key.length === 1 && !init.shiftKey ? key.toLowerCase() : key;
    init.code = /^\d$/.test(key) ? "Digit" + key : KEY_CODES[key] || (key.length === 1 ? "Key" + key.toUpperCase() : key);
    return init;
  }
  var __test = {
    type: function (text) {
      var doc = st.paper.ownerDocument, view = doc.defaultView;
      String(text).split("").forEach(function (ch) {
        var el = st.cur && st.cur.el;
        if (!el) return;
        var before = new view.InputEvent("beforeinput", { inputType: "insertText", data: ch, bubbles: true, cancelable: true });
        if (el.dispatchEvent(before)) doc.execCommand("insertText", false, ch);
      });
    },
    press: function (combo, more) {
      var doc = st.paper.ownerDocument, view = doc.defaultView, target = doc.activeElement || doc.body;
      var e = new view.KeyboardEvent("keydown", Object.assign(keyEvent(combo), more || {}));
      if (!target.dispatchEvent(e) || (more && more.isComposing)) return e;
      // What the browser would have done with a key the editor left alone.
      var inText = st && st.cur && st.cur.el.contains(target), s = doc.getSelection();
      if (!inText) return e;
      if (e.key === "Backspace") doc.execCommand("delete");
      else if (e.key === "Delete") doc.execCommand("forwardDelete");
      else if (/^Arrow/.test(e.key) && s && s.modify) {
        var dir = { ArrowLeft: "backward", ArrowRight: "forward", ArrowUp: "backward", ArrowDown: "forward" }[e.key];
        s.modify(e.shiftKey ? "extend" : "move", dir, e.key === "ArrowUp" || e.key === "ArrowDown" ? "line" : "character");
      }
      return e;
    },
    selectText: function (id, from, to) { return focusBlock(id, { from: from, to: to == null ? from : to, scroll: false }); },
    dragSelect: function (fromId, toId) {
      var view = st.paper.ownerDocument.defaultView;
      function fire(type, el, buttons) {
        var box = el.getBoundingClientRect();
        el.dispatchEvent(new view.PointerEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: buttons, clientX: box.left + 5, clientY: box.top + 5, pointerId: 1, isPrimary: true }));
      }
      var a = textOf(fromId) || elOf(fromId), b = textOf(toId) || elOf(toId);
      fire("pointerdown", a, 1);
      fire("pointermove", b, 1);
      fire("pointerup", b, 0);
    },
    // Beyond the design's four: what a test needs to wait for nothing.
    flush: function () { if (st) { st.olSig = null; drawOutline(); toolbarState(); } },
    state: function () { return st; },
    el: function (id) { return st ? elOf(id) : null; },
    text: function (id) { return st ? textOf(id) : null; }
  };

  window.App.DocEditor = {
    mount: mount, unmount: unmount, focusBlock: focusBlock, selectBlocks: selectBlocks, redraw: redraw,
    selection: selection, run: run, commands: commands, __test: __test,
    // Beyond the design's table. For the shell: refresh() after the document's
    // options change (heading numbers), insertPictureFile for a drop it handles.
    // For history.js: restore and historyChanged.
    restore: restore, historyChanged: historyChanged,
    refresh: function () { if (st) { syncNumbers(); st.olSig = null; drawOutline(); toolbarState(); } },
    ownsOutline: function () { return !!(st && st.ownOutline); },
    insertPictureFile: insertPictureFile, replaceWithFile: replaceWithFile, openFootnote: openFootnote
  };
})();
