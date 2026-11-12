/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* history.js
 *
 * App.DocHistory: the editor's own undo and redo (docs/document-tool-design.md
 * 5.2, 5.3). The browser's undo is never used on the paper, because it does not
 * survive a block being redrawn.
 *
 * An entry holds the blocks an operation touched, as they were and as they
 * became, each with where it sat:
 *
 *   { label, before: [{ id, index, parent, json }], after: [...],
 *     footnotes?: { before: { key: runs }, after: { key: runs } },
 *     selBefore, selAfter, typing? }
 *
 * `parent` is null for a block in the body, and { table, row, cell } for one in
 * a table cell (row and cell are indexes into rows and cells as stored). A
 * block created by the operation is in `after` only, a deleted one in `before`
 * only, a moved one in both with two indexes. Entries are undone strictly in
 * order, so the stored positions always hold. snapshot() builds the list.
 *
 * Media, parts and footnotes are never deleted while a document is open, so a
 * block brought back always finds what it refers to.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var MAX = 200;
  var undone = [], done = [];
  // The entry typing is still adding to, if any (see coalesce).
  var open = null;

  function theDoc() { var A = window.App.DocApp; return A && A.state ? A.state.doc : null; }
  function listOf(doc, parent, M) {
    if (!parent) return doc.blocks;
    if (typeof parent !== "object") return null;
    var t = M.find(doc, parent.table);
    var row = t && t.block.rows ? t.block.rows[parent.row] : null;
    var cell = row && row.cells ? row.cells[parent.cell] : null;
    return cell ? cell.blocks : null;
  }
  // Where the blocks named are now, as an entry stores them. Ids that are not
  // in the document are left out.
  function snapshot(doc, ids) {
    var M = window.App.DocModel, out = [];
    (ids || []).forEach(function (id) {
      var f = M.find(doc, id);
      if (!f) return;
      var parent = null;
      if (f.table) {
        (f.table.rows || []).forEach(function (row, r) {
          (row.cells || []).forEach(function (cell, c) { if (cell.blocks === f.list) parent = { table: f.table.id, row: r, cell: c }; });
        });
      }
      out.push({ id: id, index: f.index, parent: parent, json: JSON.stringify(f.block) });
    });
    return out;
  }

  function changed() { var E = window.App.DocEditor; if (E && E.historyChanged) E.historyChanged(); }
  function record(entry) {
    if (!entry) return;
    done.push(entry);
    if (done.length > MAX) done.shift();
    undone.length = 0;
    open = entry.typing ? entry : null;
    changed();
  }
  // Typing in one block is one entry. coalesce(key) hands back the entry typing
  // in that block is still adding to, for the caller to move its `after` on, or
  // null when a new entry is needed; coalesce(null) ends it (the caret left the
  // block, another command ran, a sentence ended).
  function coalesce(key) {
    if (key == null) { open = null; return null; }
    return open && open.typing === key && done[done.length - 1] === open ? open : null;
  }

  function apply(entry, undoing) {
    var doc = theDoc(), M = window.App.DocModel, E = window.App.DocEditor, A = window.App.DocApp;
    if (!doc) return;
    var from = (undoing ? entry.after : entry.before) || [], to = (undoing ? entry.before : entry.after) || [];
    var homes = {}, ids = [];
    function note(id) { if (ids.indexOf(id) === -1) ids.push(id); }
    from.forEach(function (s) {
      var f = M.find(doc, s.id);
      note(s.id);
      if (!f) return;
      homes[s.id] = f.list;
      f.list.splice(f.index, 1);
    });
    // In ascending order of position, so each lands where it was once those
    // before it are back.
    to.slice().sort(function (a, b) { return a.index - b.index; }).forEach(function (s) {
      // An entry made elsewhere may not say which cell: the block then goes
      // back into the list it was just taken from.
      var list = listOf(doc, s.parent, M) || homes[s.id] || doc.blocks;
      list.splice(Math.min(s.index, list.length), 0, JSON.parse(s.json));
      note(s.id);
    });
    var notes = entry.footnotes && (undoing ? entry.footnotes.before : entry.footnotes.after);
    if (notes) {
      Object.keys(notes).forEach(function (k) {
        // A footnote that did not exist before is left where it is: nothing
        // refers to it, and a redo will want it.
        if (notes[k] != null) M.footnote.set(doc, k, JSON.parse(JSON.stringify(notes[k])));
      });
    }
    if (E && E.redraw) E.redraw(ids);
    if (E && E.restore) E.restore(undoing ? entry.selBefore : entry.selAfter, entry);
    if (A && A.touched) A.touched({ structure: true, blocks: ids });
  }
  function undo() {
    var entry = done.pop();
    open = null;
    if (!entry) return false;
    undone.push(entry);
    apply(entry, true);
    changed();
    return true;
  }
  function redo() {
    var entry = undone.pop();
    open = null;
    if (!entry) return false;
    done.push(entry);
    apply(entry, false);
    changed();
    return true;
  }
  function canUndo() { return done.length > 0; }
  function canRedo() { return undone.length > 0; }
  function clear() { done.length = 0; undone.length = 0; open = null; changed(); }

  window.App.DocHistory = {
    record: record, undo: undo, redo: redo, canUndo: canUndo, canRedo: canRedo, clear: clear, coalesce: coalesce,
    // Beyond the design's table: the snapshot an entry is made of, and the limit.
    snapshot: snapshot, MAX: MAX
  };
})();
