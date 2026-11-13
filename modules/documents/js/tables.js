/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* tables.js: App.DocTables, draws a table and its controls (docs/document-tool-design.md 5.2, 5.3). */
(function () {
  "use strict";
  window.App = window.App || {};

  // Looked up at call time: this file loads before the editor, and a test may
  // swap any of them for a fake.
  function M() { return window.App.DocModel; }
  function R() { return window.App.DocRender; }
  function H() { return window.App.DocHistory; }
  function E() { return window.App.DocEditor; }
  function A() { return window.App.DocApp; }

  // "Narrower" and "Wider" move this share of the table's width (5.3).
  var NUDGE = 0.05;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "class") n.className = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // ---- where things are ------------------------------------------------

  function tableOf(doc, id) {
    var f = doc && M().find(doc, id);
    return f && f.block && f.block.type === "table" ? f : null;
  }
  // The grid position's own cell: the model's grid marks the positions a span
  // covers, and names the origin they belong to.
  function origin(grid, r, c) {
    var g = grid[r] && grid[r][c];
    if (!g || !g.cell) return null;
    if (!g.covered) return { cell: g.cell, r: r, c: c };
    var o = grid[g.r] && grid[g.r][g.c];
    return o && o.cell ? { cell: o.cell, r: g.r, c: g.c } : null;
  }
  // Every cell once, in reading order: what Tab walks.
  function cellsInOrder(grid) {
    var out = [];
    grid.forEach(function (row, r) {
      (row || []).forEach(function (g, c) { if (g && g.cell && !g.covered) out.push({ cell: g.cell, r: r, c: c }); });
    });
    return out;
  }
  function spanOf(cell) { return Math.max(1, Number(cell && cell.span) || 1); }
  function rowSpanOf(cell) { return Math.max(1, Number(cell && cell.rowSpan) || 1); }

  // The cell the caret was last in. The toolbar's buttons act on it, and a
  // click on one of them takes the focus out of the table first, so it cannot
  // be read from the selection at that moment.
  var current = { id: "", r: 0, c: 0 };
  function remember(id, r, c) { current = { id: id, r: r, c: c }; }
  function currentCell(block) {
    var grid = M().table.grid(block);
    var rows = block.rows.length, cols = block.cols.length;
    // With no cell remembered the row and column buttons act on the end of the
    // table, where a row or column is most often wanted.
    var r = current.id === block.id ? Math.min(current.r, rows - 1) : rows - 1;
    var c = current.id === block.id ? Math.min(current.c, cols - 1) : cols - 1;
    return origin(grid, Math.max(0, r), Math.max(0, c)) || cellsInOrder(grid)[0] || { cell: null, r: 0, c: 0 };
  }

  // ---- drawing ---------------------------------------------------------

  // The drawing is the shared renderer's (App.DocPreview.tableEl, which draws
  // a cell's blocks as any block is, so the editor edits a paragraph in a cell
  // exactly as it edits one on the page, and an imported table's own look:
  // fills, widths, no borders, a table inside a cell). The editor adds only
  // where the caret was.
  function tableEl(doc, block, opts) {
    opts = opts || {};
    var table = window.App.DocPreview.tableEl(doc, block, opts);
    if (opts.editable) {
      var note = function (event) {
        var td = event.target && event.target.closest ? event.target.closest("td,th") : null;
        if (td && td.closest("table") === table) remember(block.id, Number(td.getAttribute("data-r")), Number(td.getAttribute("data-c")));
      };
      table.addEventListener("pointerdown", note);
      table.addEventListener("focusin", note);
    }
    return table;
  }

  // ---- edits -----------------------------------------------------------

  // A table is always in the body, so its history position has no parent.
  function snapshot(doc, id) {
    var f = tableOf(doc, id);
    return f ? { id: id, index: f.index, parent: null, json: JSON.stringify(f.block) } : null;
  }
  // One table edit: done on the model, recorded as one history entry holding
  // the table as it was and as it became, and drawn by redrawing that table.
  function edit(doc, id, label, change, said) {
    var ed = E(), before = snapshot(doc, id);
    if (!before) return false;
    var selBefore = ed.selection ? ed.selection() : null;
    // The change may hand back the ids of blocks it added to the body (the
    // paragraph that takes the place of the last table): they are part of the
    // same entry, so undo takes them away and redo brings them back.
    var added = change();
    if (!Array.isArray(added)) added = [];
    var after = snapshot(doc, id);
    if (after && after.json === before.json) return false;
    H().record({ label: label, before: [before], after: (after ? [after] : []).concat(H().snapshot(doc, added)), selBefore: selBefore, selAfter: selBefore });
    ed.redraw([id].concat(added));
    A().touched(after ? { blocks: [id] } : { structure: true });
    if (said) A().say(said);
    return true;
  }
  // Puts the caret in a cell: its first text block for a move forward, its
  // last for a move back. A cell holding only a picture gets that block.
  function focusCell(doc, id, r, c, at) {
    var f = tableOf(doc, id);
    if (!f) return false;
    var grid = M().table.grid(f.block);
    var rows = f.block.rows.length, cols = f.block.cols.length;
    var o = origin(grid, Math.max(0, Math.min(r, rows - 1)), Math.max(0, Math.min(c, cols - 1)));
    if (!o || !o.cell.blocks || !o.cell.blocks.length) return false;
    var blocks = at === "end" ? o.cell.blocks.slice().reverse() : o.cell.blocks;
    var text = blocks.filter(function (b) { return b.type === "paragraph" || b.type === "list"; })[0];
    remember(id, o.r, o.c);
    E().focusBlock((text || blocks[0]).id, { at: at === "end" ? "end" : "start" });
    return true;
  }

  var ACTIONS = {
    rowAbove: function (doc, block, cur) {
      if (edit(doc, block.id, "Add row", function () { M().table.addRow(doc, block.id, cur.r); }, "Row added above.")) focusCell(doc, block.id, cur.r, cur.c, "start");
    },
    rowBelow: function (doc, block, cur) {
      var at = cur.r + rowSpanOf(cur.cell);
      if (edit(doc, block.id, "Add row", function () { M().table.addRow(doc, block.id, at); }, "Row added below.")) focusCell(doc, block.id, at, cur.c, "start");
    },
    colLeft: function (doc, block, cur) {
      if (edit(doc, block.id, "Add column", function () { M().table.addCol(doc, block.id, cur.c); }, "Column added to the left.")) focusCell(doc, block.id, cur.r, cur.c, "start");
    },
    colRight: function (doc, block, cur) {
      var at = cur.c + spanOf(cur.cell);
      if (edit(doc, block.id, "Add column", function () { M().table.addCol(doc, block.id, at); }, "Column added to the right.")) focusCell(doc, block.id, cur.r, at, "start");
    },
    delRow: function (doc, block, cur) {
      if (block.rows.length < 2) return;
      if (edit(doc, block.id, "Delete row", function () { M().table.removeRow(doc, block.id, cur.r); }, "Row deleted.")) focusCell(doc, block.id, cur.r, cur.c, "start");
    },
    delCol: function (doc, block, cur) {
      if (block.cols.length < 2) return;
      if (edit(doc, block.id, "Delete column", function () { M().table.removeCol(doc, block.id, cur.c); }, "Column deleted.")) focusCell(doc, block.id, cur.r, cur.c, "start");
    },
    header: function (doc, block) {
      var on = !block.header;
      edit(doc, block.id, "Header row", function () { M().table.setHeader(doc, block.id, on); }, on ? "Header row on." : "Header row off.");
    },
    equal: function (doc, block) {
      edit(doc, block.id, "Equal column widths", function () { M().table.equalWidths(doc, block.id); }, "Columns made equal.");
    },
    narrower: function (doc, block, cur) { nudge(doc, block, cur, -NUDGE, "Column made narrower."); },
    wider: function (doc, block, cur) { nudge(doc, block, cur, NUDGE, "Column made wider."); },
    land: function (doc, block) {
      var on = !block.land;
      edit(doc, block.id, "Landscape page", function () {
        var b = tableOf(doc, block.id).block;
        if (on) b.land = true; else delete b.land;
      }, on ? "Table on a landscape page." : "Table on a portrait page.");
    },
    remove: function (doc, block) {
      var f = tableOf(doc, block.id);
      var near = f.list[f.index + 1] || f.list[f.index - 1];
      if (edit(doc, block.id, "Delete table", function () {
        M().remove(doc, [block.id]);
        // A document is never left with nothing to type in: when the table
        // was all there was, an empty paragraph takes its place.
        if (doc.blocks.length) return [];
        near = M().make.paragraph(doc, "");
        doc.blocks.push(near);
        return [near.id];
      }, "Table deleted.") && near) {
        E().focusBlock(near.id, { at: "start" });
      }
    }
  };
  // The model trades the width with the next column (the one before, for the
  // last column) and stops at its own floor, where nothing changes.
  function nudge(doc, block, cur, by, said) {
    if (block.cols.length < 2) return;
    edit(doc, block.id, "Column width", function () { M().table.nudge(doc, block.id, cur.c, by); }, said);
  }
  function setCaption(doc, id, text) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    edit(doc, id, "Table caption", function () {
      var b = tableOf(doc, id).block;
      if (text) b.caption = text; else delete b.caption;
    }, text ? "Caption set." : "Caption removed.");
  }

  // ---- the toolbar's table controls ------------------------------------

  var BUTTONS = [
    ["rowAbove", "Row above", "Add a row above this one"],
    ["rowBelow", "Row below", "Add a row below this one"],
    ["delRow", "Delete row", "Delete this row"],
    ["colLeft", "Column left", "Add a column to the left of this one"],
    ["colRight", "Column right", "Add a column to the right of this one"],
    ["delCol", "Delete column", "Delete this column"],
    ["header", "Header row", "Repeat the first row on each page"],
    ["equal", "Equal widths", "Make every column the same width"],
    ["narrower", "Narrower", "Make this column narrower"],
    ["wider", "Wider", "Make this column wider"],
    ["land", "Landscape page", "Print this table on a landscape page"],
    ["remove", "Delete table", "Delete the whole table"]
  ];
  var captionSeq = 0;

  // Buttons carry tabindex -1: the toolbar is one Tab stop and moves between
  // its buttons with the arrow keys (5.3), so none of ours adds a stop.
  function controls(doc, block) {
    var box = el("div", { class: "tbl-controls", role: "group", "aria-label": "Table", "data-table-id": block.id });
    BUTTONS.forEach(function (b) {
      var name = b[0];
      var btn = el("button", { type: "button", class: "btn tbl-btn", "data-act": name, title: b[2], tabindex: "-1", text: b[1] });
      if (name === "header") btn.setAttribute("aria-pressed", block.header ? "true" : "false");
      if (name === "land") btn.setAttribute("aria-pressed", block.land ? "true" : "false");
      if ((name === "delRow" && block.rows.length < 2) || ((name === "delCol" || name === "narrower" || name === "wider") && block.cols.length < 2)) btn.disabled = true;
      if (name === "remove") btn.classList.add("danger");
      // The caret must stay where it is while a button is pressed with the
      // pointer; the editor puts it back after the redraw.
      btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
      btn.addEventListener("click", function () {
        var f = tableOf(doc, block.id);
        if (f) ACTIONS[name](doc, f.block, currentCell(f.block));
      });
      box.appendChild(btn);
    });
    var inputId = "tbl-caption-" + (++captionSeq);
    var input = el("input", { type: "text", id: inputId, class: "tbl-caption-input", tabindex: "-1", maxlength: "300", autocomplete: "off" });
    input.value = block.caption || "";
    input.addEventListener("change", function () { setCaption(doc, block.id, input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); setCaption(doc, block.id, input.value); }
    });
    box.appendChild(el("label", { class: "tbl-caption-field", for: inputId }, [el("span", { text: "Caption" }), input]));
    return box;
  }

  // ---- keys ------------------------------------------------------------

  // Where the caret is, from the event and the page: the table, the cell and
  // the block in it. ctx is { doc, blockId }, both optional.
  function place(event, ctx) {
    ctx = ctx || {};
    var doc = ctx.doc || (A() && A().state && A().state.doc);
    var node = (ctx.blockId && document.getElementById("blk-" + ctx.blockId)) || event.target;
    if (node && node.nodeType !== 1) node = node.parentElement;
    var blk = node && node.closest ? node.closest("[data-block-id]") : null;
    var td = blk ? blk.closest("td,th") : null;
    var table = td ? td.closest("table.doc-table") : null;
    if (!doc || !table || !blk) return null;
    var f = tableOf(doc, table.getAttribute("data-table-id"));
    if (!f) return null;
    var inCell = Array.prototype.filter.call(td.children, function (k) { return k.hasAttribute("data-block-id"); });
    return {
      doc: doc, find: f, block: f.block, blk: blk,
      r: Number(td.getAttribute("data-r")), c: Number(td.getAttribute("data-c")),
      first: inCell[0] === blk, last: inCell[inCell.length - 1] === blk
    };
  }
  // Whether the caret is at the block's very start or end, and on its first
  // or last line. Without a caret in the block (a picture in a cell) every
  // edge counts, so the arrows still leave the cell.
  function edges(blk) {
    var all = { start: true, end: true, top: true, bottom: true };
    var view = blk.ownerDocument.defaultView, sel = view.getSelection();
    if (!sel || !sel.rangeCount || !blk.contains(sel.anchorNode)) return all;
    if (!sel.isCollapsed) return { start: false, end: false, top: false, bottom: false };
    var at = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
    var host = (at && at.closest('[contenteditable="true"]')) || blk;
    if (!blk.contains(host)) host = blk;
    var clean = function (s) { return s.replace(/[​﻿]/g, ""); };
    var pre = blk.ownerDocument.createRange(), post = blk.ownerDocument.createRange();
    pre.selectNodeContents(host); pre.setEnd(sel.anchorNode, sel.anchorOffset);
    post.selectNodeContents(host); post.setStart(sel.anchorNode, sel.anchorOffset);
    var out = { start: clean(pre.toString()).length === 0, end: clean(post.toString()).length === 0 };
    // A caret between elements has no box of its own; the text just before
    // it, or failing that just after it, is on its line.
    var caret = sel.getRangeAt(0).getClientRects()[0];
    if (!caret || !caret.height) { var b = pre.getClientRects(); caret = b[b.length - 1]; }
    if (!caret || !caret.height) caret = post.getClientRects()[0];
    if (!caret || !caret.height) {
      // No box at all (an empty line): the text edges stand in.
      out.top = out.start; out.bottom = out.end;
      return out;
    }
    var box = host.getBoundingClientRect(), cs = view.getComputedStyle(host);
    var slack = caret.height * 0.75;
    out.top = caret.top - (box.top + (parseFloat(cs.paddingTop) || 0)) < slack;
    out.bottom = (box.bottom - (parseFloat(cs.paddingBottom) || 0)) - caret.bottom < slack;
    return out;
  }

  // Tab, Shift+Tab and the arrow keys in a table. Returns true when it took
  // the key (and has called preventDefault), false to leave it to the editor.
  function keydown(event, ctx) {
    if (!event || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return false;
    var key = event.key;
    var arrow = key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown";
    if (key !== "Tab" && !(arrow && !event.shiftKey)) return false;
    var p = place(event, ctx);
    if (!p) return false;
    var doc = p.doc, id = p.block.id;
    remember(id, p.r, p.c);
    var grid = M().table.grid(p.block);
    var order = cellsInOrder(grid);
    var i = -1;
    order.forEach(function (o, n) { if (o.r === p.r && o.c === p.c) i = n; });
    var here = order[i];
    if (!here) return false;
    var took = function () { event.preventDefault(); return true; };

    if (key === "Tab") {
      var next = order[i + (event.shiftKey ? -1 : 1)];
      if (next) focusCell(doc, id, next.r, next.c, event.shiftKey ? "end" : "start");
      else if (!event.shiftKey) {
        // Tab in the last cell adds a row, as Word does.
        var rows = p.block.rows.length;
        if (edit(doc, id, "Add row", function () { M().table.addRow(doc, id, rows); }, "Row added.")) focusCell(doc, id, rows, 0, "start");
      }
      // Shift+Tab in the first cell does nothing, and Tab never leaves the paper.
      return took();
    }

    var e = edges(p.blk);
    if (key === "ArrowLeft") {
      if (!(p.first && e.start) || i === 0) return false;
      focusCell(doc, id, order[i - 1].r, order[i - 1].c, "end");
      return took();
    }
    if (key === "ArrowRight") {
      if (!(p.last && e.end) || i === order.length - 1) return false;
      focusCell(doc, id, order[i + 1].r, order[i + 1].c, "start");
      return took();
    }
    // Up and down: the cell above or below in the same column, and from the
    // table's first or last row the block before or after the table.
    var up = key === "ArrowUp";
    if (up ? !(p.first && e.top) : !(p.last && e.bottom)) return false;
    var r = up ? p.r - 1 : p.r + rowSpanOf(here.cell);
    if (r >= 0 && r < p.block.rows.length) {
      focusCell(doc, id, r, p.c, up ? "end" : "start");
      return took();
    }
    var out = p.find.list[p.find.index + (up ? -1 : 1)];
    if (!out) {
      // Down out of a table that ends the document: a paragraph is opened
      // after it, or there would be no way to write on below the table.
      if (up || !E().run || !E().run("paragraphAfter", id)) return false;
      return took();
    }
    E().focusBlock(out.id, { at: up ? "end" : "start" });
    return took();
  }

  window.App.DocTables = { tableEl: tableEl, controls: controls, keydown: keydown };
})();
