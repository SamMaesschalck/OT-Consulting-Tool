/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-criteria.js — step 1's risk criteria editor (phase 5).
 *
 * The project's own risk criteria (js/model.js criteriaOf), seeded from the
 * house rules on the first change: the matrix, each cell one of the four
 * fixed bands, with the cells above tolerable risk outlined; a preset to
 * start from (the house criteria, or a generic 3x3, 4x4 or 5x5); the
 * likelihood and impact levels (3 to 5 each) with their one-line
 * definitions; and the consequence categories, each with an optional
 * tolerable risk of its own. A change that leaves ratings on a level the
 * criteria no longer have asks first, in the page, where each one goes; one
 * left where it is no longer fits, and the completeness list says so with a
 * Go to. Nothing moves a rating silently.
 *
 * RiskApp.CriteriaUI.panel(project) is the editor beside step 1's form
 * (js/ui-stages.js); RiskApp.CriteriaUI.scales(project) the levels and
 * categories below it.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var BANDS = M.BANDS, BAND_NAME = M.BAND_NAME;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, riskPill = U.riskPill, toast = U.toast, labelFor = U.labelFor;

  // A change waiting for the consultant to say where the ratings go, for the
  // project it was started on: { project, next (the criteria to store),
  // rows: [{ kind, id, name, n, to }], label }.
  var pending = null;
  function pendingNow() { return pending && pending.project === state.project ? pending : null; }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // A stored copy that is the house's again, with no tolerable risk per
  // category, goes: the file reads the house criteria, as one never changed.
  function settle(p) {
    var c = p.criteria;
    if (!M.criteriaUsable(c)) { delete p.criteria; return; }
    var tbc = c.tolerableByCategory && Object.keys(c.tolerableByCategory).length;
    if (!tbc && M.isHouseContent(c)) delete p.criteria;
  }
  function edit(p) { var c = M.ensureCriteria(p); return c; }
  function done() { settle(state.project); touched(); rerender(); }

  // ---------- Applying new criteria, with the ratings mapped ----------

  // What a change of scales does to the ratings: each level in use whose
  // ratings would go elsewhere or change meaning, with the level they go to
  // by default (js/engine.js defaultMapping; byPosition for a preset). A
  // level kept with the same id and name, and mapped to itself, asks
  // nothing, so applying the same criteria again asks nothing.
  function sameName(a, b) { return String(a.name || "").trim().toLowerCase() === String(b.name || "").trim().toLowerCase(); }
  function rowsFor(p, next, byPosition) {
    var c = M.criteriaOf(p), use = E.ratingUsage(p), rows = [];
    ["likelihood", "impact"].forEach(function (kind) {
      var to = next[kind], def = E.defaultMapping(c[kind], to, byPosition);
      c[kind].forEach(function (l) {
        var n = use[kind][l.id] || 0;
        if (!n) return;
        var kept = to.some(function (x) { return x.id === l.id && sameName(x, l); });
        if (kept && def[l.id] === l.id) return;
        rows.push({ kind: kind, id: l.id, name: l.name, n: n, to: def[l.id] || "" });
      });
    });
    return rows;
  }
  // Stores the new criteria and moves each rating as the rows say.
  function apply(p, next, rows) {
    var map = { likelihood: {}, impact: {} };
    rows.forEach(function (r) { if (r.to) map[r.kind][r.id] = r.to; });
    var keep = M.criteriaUsable(p.criteria) ? p.criteria : M.houseCriteria();
    next.categories = keep.categories ? clone(keep.categories) : [];
    if (keep.tolerableByCategory) next.tolerableByCategory = clone(keep.tolerableByCategory);
    p.criteria = next;
    var n = E.remapRatings(p, map);
    E.syncCategoryMirrors(p);
    settle(p);
    return n;
  }
  // What the toast says once the change is made.
  function doneWords(label, n) { return label + (n ? "; " + n + " rating" + (n === 1 ? "" : "s") + " moved." : "."); }
  // A change that would move ratings, or leave them without a level, asks
  // first. how: { focus: where the keyboard goes once it is made, cancel:
  // where it goes on Cancel or Escape, back: where it goes after an undo };
  // each is the preset's Apply unless given.
  function propose(p, next, byPosition, label, how) {
    how = how || {};
    var focus = how.focus || '[data-action="criteria-apply"]', back = how.back || focus, cancelTo = how.cancel || focus;
    var rows = rowsFor(p, next, byPosition);
    if (!rows.length) {
      var mk = A.undoMark();
      apply(p, next, []); pending = null; touched(); rerender();
      A.focusAfter(focus);
      A.offerUndo(doneWords(label, 0), function () { return back; }, mk);
      return;
    }
    pending = { project: p, next: next, rows: rows, label: label, focus: focus, back: back, cancel: cancelTo };
    rerender();
    A.focusAfter('[data-criteria-map] select');
  }

  function mapPanel(pd) {
    var next = pd.next;
    function sel(r) {
      var s = h("select", { "data-field": "crit-map-" + r.kind + "-" + r.id, "aria-label": "Move the " + r.kind + " ratings on " + r.name,
        onChange: function (e) { r.to = e.target.value; } });
      next[r.kind].forEach(function (l) { var o = h("option", { value: l.id, text: l.name }); if (r.to === l.id) o.setAttribute("selected", "selected"); s.appendChild(o); });
      var leave = h("option", { value: "", text: "Leave as it is" }); if (!r.to) leave.setAttribute("selected", "selected"); s.appendChild(leave);
      return s;
    }
    function cancel() { pending = null; rerender(); A.focusAfter(pd.cancel); }
    var box = h("div", { class: "criteria-map", "data-criteria-map": "", role: "group", "aria-label": "Where the ratings go" }, [
      h("p", { class: "criteria-map-h", text: "Choose where each level's ratings go; any left stay open." }),
      h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [h("th", { text: "Scale" }), h("th", { text: "Level" }), h("th", { text: "Ratings", class: "center" }), h("th", { text: "Moves to" })])]),
        h("tbody", null, pd.rows.map(function (r) {
          return h("tr", { "data-map-row": r.kind + ":" + r.id }, [h("td", { text: r.kind === "likelihood" ? "Likelihood" : "Impact" }), h("td", { text: r.name }), h("td", { class: "center", text: String(r.n) }), h("td", null, [sel(r)])]);
        }))]),
      h("div", { class: "btn-row" }, [
        h("button", { type: "button", class: "btn sm primary", "data-action": "criteria-map-apply", text: "Apply", onClick: function () {
          var mk = A.undoMark();
          var n = apply(state.project, pd.next, pd.rows); pending = null; touched(); rerender();
          A.focusAfter(pd.focus);
          A.offerUndo(doneWords(pd.label, n), function () { return pd.back; }, mk);
        } }),
        h("button", { type: "button", class: "btn sm", "data-action": "criteria-map-cancel", text: "Cancel", onClick: cancel })
      ])
    ]);
    // Escape does what Cancel does.
    box.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); } });
    return box;
  }

  // ---------- The matrix, beside the form ----------

  function panel(p) {
    var c = M.criteriaOf(p), tol = E.tolerableOf(p), pd = pendingNow();
    var t = h("table", { class: "tbl matrix crit-matrix", "aria-label": "Risk matrix" });
    t.appendChild(h("thead", null, [h("tr", null, [h("th", { text: "Impact" })].concat(c.likelihood.map(function (l) { return h("th", { class: "center", text: l.name }); })))]));
    var tb = h("tbody");
    c.impact.slice().reverse().forEach(function (iv) {
      tb.appendChild(h("tr", null, [h("th", { scope: "row", text: iv.name })].concat(c.likelihood.map(function (l) {
        var row = c.matrix[iv.id], b = (row && row[l.id]) || "", above = E.exceedsTolerable(b, tol);
        var s = h("select", { "data-field": "crit-cell-" + iv.id + ":" + l.id, "aria-label": iv.name + " impact, " + l.name.toLowerCase() + " likelihood",
          class: "cell-band risk-" + (b || "none"),
          onChange: function (e) {
            var cc = edit(p);
            if (!cc.matrix[iv.id] || typeof cc.matrix[iv.id] !== "object") cc.matrix[iv.id] = {};
            cc.matrix[iv.id][l.id] = e.target.value;
            delete cc.preset;
            done();
          } });
        if (!b) s.appendChild(h("option", { value: "", text: "Not set" }));
        BANDS.forEach(function (bd) { var o = h("option", { value: bd.id, text: bd.name }); if (b === bd.id) o.setAttribute("selected", "selected"); s.appendChild(o); });
        return h("td", { class: "center" + (above ? " above-tol" : ""), "data-band": b, "data-cell": iv.id + ":" + l.id }, [s]);
      }))));
    });
    t.appendChild(tb);
    var pre = h("select", { "data-action": "criteria-preset", "aria-label": "Criteria to start from" },
      [h("option", { value: "", text: "Start from" })].concat(M.PRESETS.map(function (x) { return h("option", { value: x.id, text: x.label }); })));
    var kids = [
      h("div", { class: "muted criteria-cap", text: "Outlined cells are above tolerable risk (" + BAND_NAME[tol].toLowerCase() + ")." }),
      h("div", { class: "grid-scroll" }, [t]),
      h("div", { class: "btn-row crit-preset no-print" }, [pre,
        h("button", { type: "button", class: "btn sm", "data-action": "criteria-apply", text: "Apply", onClick: function () {
          var id = pre.value; if (!id) { toast("Choose criteria to start from."); pre.focus(); return; }
          var next = M.presetCriteria(id), label = (M.PRESETS.filter(function (x) { return x.id === id; })[0] || {}).label;
          propose(p, next, true, "Criteria set to " + (id === "house" ? "the " + label : label.charAt(0).toLowerCase() + label.slice(1)));
        } })
      ])
    ];
    if (pd) kids.push(mapPanel(pd));
    kids.push(h("div", { class: "muted criteria-cap", "data-criteria-source": c.source, text: sourceWords(p) }));
    return h("div", { class: "criteria-panel", "data-criteria": "matrix" }, kids);
  }
  function sourceWords(p) {
    var w = E.criteriaWords(p);
    return w.source === "client-house" ? "The client's criteria are marked in use: enter them here." :
      w.source === "client" ? "The client's criteria." : w.source === "project" ? "Changed from the house criteria for this assessment." : "The SolutionsPT house criteria.";
  }

  // ---------- The levels and the categories ----------

  function levelList(p, kind, title) {
    var c = M.criteriaOf(p), list = c[kind], use = E.ratingUsage(p)[kind];
    var prefix = kind === "likelihood" ? "L" : "I";
    var rows = list.slice().reverse().map(function (l, i) {
      // Named by place, so each reads apart: "Impact level 4 of 4 name".
      var at = list.length - i;
      var name = A.changeRedraw(h("input", { type: "text", value: l.name, "data-field": "crit-" + kind + "-name-" + l.id, "aria-label": title + " level " + at + " of " + list.length + " name",
        onInput: function (e) { var cc = edit(p), x = cc[kind].filter(function (y) { return y.id === l.id; })[0]; if (x) x.name = e.target.value; delete cc.preset; settle(p); touched(); } }));
      // A meaning wraps over two lines rather than being cut off.
      var note = h("textarea", { rows: "2", value: l.note, "data-field": "crit-" + kind + "-note-" + l.id, "aria-label": "What " + l.name + " means",
        placeholder: "One line: what this level means",
        onInput: function (e) { var cc = edit(p), x = cc[kind].filter(function (y) { return y.id === l.id; })[0]; if (x) x.note = e.target.value; delete cc.preset; settle(p); touched(); } });
      var n = use[l.id] || 0;
      return h("tr", { "data-level": kind + ":" + l.id }, [
        h("td", null, [name]), h("td", null, [note]),
        h("td", { class: "center muted", text: n ? String(n) : "" }),
        h("td", null, [h("button", { type: "button", class: "btn sm danger", text: "×", "data-action": "remove-level-" + kind + "-" + l.id,
          "aria-label": "Remove " + l.name, title: list.length <= M.LEVEL_MIN ? "At least " + M.LEVEL_MIN + " levels" : "Remove",
          disabled: list.length <= M.LEVEL_MIN ? "disabled" : null,
          onClick: function () { removeLevel(p, kind, l.id); } })])
      ]);
    });
    var add = h("button", { type: "button", class: "btn sm", "data-action": "add-level-" + kind, text: "+ Add level", disabled: list.length >= M.LEVEL_MAX ? "disabled" : null,
      title: list.length >= M.LEVEL_MAX ? "At most " + M.LEVEL_MAX + " levels" : null,
      onClick: function () { var id = addLevel(p, kind, prefix); done(); A.focusAfter('[data-field="crit-' + kind + '-name-' + id + '"]'); } });
    return h("div", { class: "crit-levels", "data-levels": kind }, [
      h("strong", { text: title }),
      h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [h("th", { text: "Level", style: "width:150px" }), h("th", { text: "Meaning" }), h("th", { text: "Ratings", class: "center", style: "width:64px" }), h("th", { text: "", style: "width:40px" })])]),
        h("tbody", null, rows)]),
      h("div", { class: "btn-row" }, [add, h("span", { class: "hint", text: "Highest first." })])
    ]);
  }
  // A new level at the top of its scale; its matrix cells copy the level
  // below it, for the consultant to adjust.
  function addLevel(p, kind, prefix) {
    var use = E.ratingUsage(p);
    var cc = edit(p), list = cc[kind];
    // The next free id on its scale (L4, I5, ...), used on neither scale nor
    // by any rating (one left on a level since removed must not re-attach).
    var taken = cc.impact.concat(cc.likelihood).map(function (x) { return x.id; })
      .concat(Object.keys(use.likelihood), Object.keys(use.impact));
    var id = M.freshId(list, prefix, taken);
    var top = list[list.length - 1];
    list.push({ id: id, name: "New level", note: "" });
    if (kind === "impact") cc.matrix[id] = clone(cc.matrix[top.id] || {});
    else cc.impact.forEach(function (iv) { var r = cc.matrix[iv.id] = cc.matrix[iv.id] || {}; r[id] = r[top.id] || "very-high"; });
    delete cc.preset;
    return id;
  }
  function removeLevel(p, kind, id) {
    var c = M.criteriaOf(p);
    if (c[kind].length <= M.LEVEL_MIN) return;
    var next = clone(M.criteriaUsable(p.criteria) ? p.criteria : M.houseCriteria());
    next[kind] = next[kind].filter(function (x) { return x.id !== id; });
    if (kind === "impact") delete next.matrix[id];
    else Object.keys(next.matrix).forEach(function (k) { if (next.matrix[k]) delete next.matrix[k][id]; });
    delete next.preset;
    var name = (c[kind].filter(function (x) { return x.id === id; })[0] || {}).name || id;
    // The keyboard goes to the next row's Remove (the level below, or above
    // for the lowest), or to Add level once no more can be removed.
    var at = c[kind].map(function (x) { return x.id; }).indexOf(id);
    var nb = c[kind][at > 0 ? at - 1 : at + 1];
    var focus = next[kind].length > M.LEVEL_MIN && nb ? '[data-action="remove-level-' + kind + "-" + nb.id + '"]' : '[data-action="add-level-' + kind + '"]';
    propose(p, next, false, name + " removed", { focus: focus, cancel: '[data-action="remove-level-' + kind + "-" + id + '"]', back: '[data-action="remove-level-' + kind + "-" + id + '"]' });
  }

  function categoryList(p) {
    var c = M.criteriaOf(p), tol = E.tolerableOf(p);
    var use = {};
    function count(map) { if (map && typeof map === "object") Object.keys(map).forEach(function (k) { use[k] = (use[k] || 0) + 1; }); }
    p.srs.highLevelAssets.forEach(function (a) { if (a) count(a.consequenceByCategory); });
    p.zones.concat(p.conduits).forEach(function (o) { o.threats.forEach(function (t) { count(t.impactByCategory); }); });
    var rows = c.categories.map(function (cat) {
      var name = A.changeRedraw(h("input", { type: "text", value: cat.name, "data-field": "crit-cat-name-" + cat.id, "aria-label": "Consequence category name",
        onInput: function (e) { var cc = edit(p), x = cc.categories.filter(function (y) { return y.id === cat.id; })[0]; if (x) x.name = e.target.value; settle(p); touched(); } }));
      var ts = h("select", { "data-field": "crit-cat-tol-" + cat.id, "aria-label": "Tolerable risk for " + cat.name, onChange: function (e) {
        var cc = edit(p);
        if (e.target.value) { cc.tolerableByCategory = cc.tolerableByCategory || {}; cc.tolerableByCategory[cat.id] = e.target.value; }
        else if (cc.tolerableByCategory) { delete cc.tolerableByCategory[cat.id]; if (!Object.keys(cc.tolerableByCategory).length) delete cc.tolerableByCategory; }
        done();
      } });
      ts.appendChild(h("option", { value: "", text: "Same as general (" + BAND_NAME[tol].toLowerCase() + ")" }));
      BANDS.forEach(function (b) { var o = h("option", { value: b.id, text: b.name }); if (cat.tolerable === b.id) o.setAttribute("selected", "selected"); ts.appendChild(o); });
      var n = use[cat.id] || 0;
      return h("tr", { "data-category": cat.id }, [
        h("td", null, [name]), h("td", null, [ts]), h("td", { class: "center muted", text: n ? String(n) : "" }),
        h("td", null, [h("button", { type: "button", class: "btn sm danger", text: "×", "data-action": "remove-category-" + cat.id, "aria-label": "Remove " + cat.name, onClick: function () {
          if (!U.confirmRemove(n > 0, "category, rated on " + n + " item" + (n === 1 ? "" : "s"))) return;
          var cc = edit(p);
          cc.categories = cc.categories.filter(function (x) { return x.id !== cat.id; });
          if (cc.tolerableByCategory) { delete cc.tolerableByCategory[cat.id]; if (!Object.keys(cc.tolerableByCategory).length) delete cc.tolerableByCategory; }
          done(); A.focusAfter('[data-action="add-category"]');
        } })])
      ]);
    });
    return h("div", { class: "crit-levels", "data-categories": "" }, [
      h("strong", { text: "Consequence categories" }),
      h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [h("th", { text: "Category" }), h("th", { text: "Tolerable risk", style: "width:210px" }), h("th", { text: "Rated", class: "center", style: "width:64px" }), h("th", { text: "", style: "width:40px" })])]),
        h("tbody", null, rows)]),
      h("div", { class: "btn-row" }, [h("button", { type: "button", class: "btn sm", "data-action": "add-category", text: "+ Add category", onClick: function () {
        // Not an id a rating still holds from a category since removed.
        var cc = edit(p), id = M.freshId(cc.categories, "cat", Object.keys(use));
        cc.categories.push({ id: id, name: "New category" });
        done(); A.focusAfter('[data-field="crit-cat-name-' + id + '"]');
      } })])
    ]);
  }

  // The scales and categories, below the form and the matrix.
  // Open to start with; closed, it stays closed through a redraw.
  var scalesShut = false;
  function scales(p) {
    var d = h("details", { class: "scales crit-scales" }, [
      h("summary", { text: "Scales and consequence categories" }),
      h("div", { class: "crit-scales-body" }, [levelList(p, "impact", "Impact"), levelList(p, "likelihood", "Likelihood"), categoryList(p)])
    ]);
    if (!scalesShut) d.setAttribute("open", "");
    d.addEventListener("toggle", function () { if (d.isConnected) scalesShut = !d.open; });
    return d;
  }

  // close(): an undo (js/app.js) put the criteria back, so a question about
  // where ratings go, asked on the state before, is dropped.
  R.CriteriaUI = { panel: panel, scales: scales, pending: function () { return pendingNow(); }, close: function () { pending = null; } };
}());
