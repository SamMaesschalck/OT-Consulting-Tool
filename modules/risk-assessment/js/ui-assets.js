/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-assets.js — step 3's Asset register tab (phase 6a).
 *
 * Every asset of every zone in one table: its id, name, zone (a choice, so
 * an asset moves zone here; a threat's links follow the prune, and the move
 * can be undone), type, connection and the register's own attributes (tag or
 * hostname, vendor, model, firmware or software version, location,
 * criticality, owner, notes), each edited in place. A search, filters by
 * zone, type and criticality, and a sort on any column. Paste from Excel
 * reads rows copied from a spreadsheet (js/assets.js): the columns by their
 * headings, or as mapped here; a preview of each row with its problems; the
 * zone for rows without one; Update existing for a tag an asset already
 * has; then one undoable step. Drawn by js/ui-zones.js when the tab is open.
 *
 * Kept quick at a few hundred assets: the search and the filters show and
 * hide rows in place, an edit redraws nothing unless the table is sorted on
 * what was edited, the paste panel is drawn on its own, and the selects are
 * cloned from one built per draw. A zone is moved on a deliberate choice (a
 * click, Enter, or leaving the field), not on each arrow press in it. After a
 * change the keyboard goes back to the same field of the same asset.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App, AS = R.Assets;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, card = U.card, toast = U.toast;
  var LABEL = M.ASSET_FIELD_LABEL;

  var reg = { sort: "zone", dir: 1, text: "", zone: "", type: "", crit: "",
    paste: { open: false, text: "", parsed: null, mapping: null, zoneId: "", update: false } };
  // The table as last drawn: its rows (tr and register entry), the count and
  // the line shown when nothing matches; the filter bar and the paste panel.
  var drawn = null;

  // The columns: key, header, sortable value.
  var LINK_OPTS = [{ value: "", text: "Fixed" }, { value: "wireless", text: "Wireless" }, { value: "temporary", text: "Temporarily connected" }];
  var COLS = ["id", "name", "zone", "type", "link", "tag", "vendor", "model", "version", "location", "criticality", "owner", "notes"];
  var SELECTS = ["zone", "type", "link", "criticality"];
  function colLabel(k) { return k === "id" ? "ID" : LABEL[k]; }
  function sortValue(r, k) {
    if (k === "zone") return r.zone.id;
    if (k === "id") return r.a.id;
    if (k === "type") return E.assetTypeLabel(r.a.type);
    if (k === "link") return r.a.link || "";
    if (k === "criticality") return { high: "1", medium: "2", low: "3" }[r.a.criticality] || "4";
    return String(r.a[k] || "");
  }
  // Numbers inside text sort by their value (AS2 before AS10, PLC-9 before
  // PLC-10), and case does not count.
  var COLL = typeof Intl !== "undefined" && Intl.Collator ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }) : null;
  function cmp(a, b) { a = String(a); b = String(b); return COLL ? COLL.compare(a, b) : a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }); }
  function matches(r) {
    if (reg.zone && r.zone.id !== reg.zone) return false;
    if (reg.type && r.a.type !== reg.type) return false;
    if (reg.crit && (reg.crit === "none" ? !!r.a.criticality : r.a.criticality !== reg.crit)) return false;
    var q = reg.text.trim().toLowerCase();
    if (q) {
      var hay = [r.a.id, r.a.name, E.assetTypeLabel(r.a.type)].concat(M.ASSET_TEXT_FIELDS.map(function (k) { return r.a[k] || ""; })).join(" ").toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  function selectOf(value, options, onChange, attrs) {
    var s = h("select", Object.assign({ onChange: function (e) { onChange(e.target.value); } }, attrs || {}));
    options.forEach(function (o) { var op = h("option", { value: o.value, text: o.text }); if (String(value || "") === String(o.value)) op.setAttribute("selected", "selected"); s.appendChild(op); });
    return s;
  }
  function zoneOpts(p) { return p.zones.map(function (z) { return { value: z.id, text: z.id + (z.name ? " " + z.name : "") }; }); }
  // What an undo opens again: step 3 on this tab, the keyboard on sel.
  function backHere(sel) { return function () { if (R.ZonesPage) R.ZonesPage.view("assets"); return sel || null; }; }
  function fieldSel(id, k) { return '[data-asset-id="' + id + '"] [data-asset-field="' + k + '"]'; }
  function countText(shown, all) { return shown === all ? all + " asset" + (all === 1 ? "" : "s") : shown + " of " + all + " assets"; }

  // ---------- The table ----------

  // One select per kind, built once per draw and cloned for each row.
  function templates(p) {
    function tpl(options) {
      var s = document.createElement("select");
      options.forEach(function (o) { var op = document.createElement("option"); op.value = o.value; op.textContent = o.text; s.appendChild(op); });
      return s;
    }
    return {
      zone: tpl(zoneOpts(p)),
      type: tpl(M.ASSET_TYPES.map(function (t) { return { value: t, text: E.assetTypeLabel(t) }; })),
      link: tpl(LINK_OPTS),
      criticality: tpl([{ value: "", text: "Not set" }].concat(M.ASSET_CRITICALITY.map(function (c) { return { value: c, text: M.ASSET_CRITICALITY_LABEL[c] }; })))
    };
  }
  function lineCount(s) { return String(s || "").split("\n").length; }
  function grow(ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  function rowEl(r, T) {
    var a = r.a, tr = document.createElement("tr");
    tr.setAttribute("data-asset-id", a.id);
    COLS.forEach(function (k) {
      var td = document.createElement("td"), el = null;
      if (k === "id") { td.className = "muted reg-id"; td.textContent = a.id; tr.appendChild(td); return; }
      if (SELECTS.indexOf(k) >= 0) {
        el = T[k].cloneNode(true);
        el.value = k === "zone" ? r.zone.id : k === "type" ? a.type : k === "link" ? a.link || "" : a.criticality || "";
      } else if (k === "notes") {
        el = document.createElement("textarea");
        el.className = "reg-notes";
        el.rows = Math.max(1, Math.min(8, lineCount(a.notes)));
        el.value = a.notes || "";
      } else {
        el = document.createElement("input");
        el.type = "text";
        el.value = k === "name" ? a.name || "" : a[k] || "";
      }
      if (k === "name") td.className = "reg-name";
      el.setAttribute("data-asset-field", k);
      el.setAttribute("aria-label", colLabel(k) + " of " + a.id);
      td.appendChild(el);
      tr.appendChild(td);
    });
    return tr;
  }

  // The rows shown again for the filter, in place; the count with them.
  function applyFilter() {
    if (!drawn) return;
    var n = 0;
    drawn.rows.forEach(function (x) { var on = matches(x.r); x.tr.hidden = !on; if (on) n++; });
    drawn.empty.hidden = n > 0;
    drawn.emptyCell.textContent = drawn.rows.length ? "No asset matches the filter." : (state.project.zones.length ? "No assets yet." : "Add a zone first.");
    if (drawn.count) drawn.count.textContent = countText(n, drawn.rows.length);
  }
  function entryOf(id) {
    if (!drawn) return null;
    for (var i = 0; i < drawn.rows.length; i++) if (drawn.rows[i].r.a.id === id) return drawn.rows[i];
    return null;
  }

  // After an edit: the table again when it is sorted on what changed (the
  // keyboard back on the same field), else only that row's place in the filter.
  function afterEdit(x, k) {
    touched();
    if (reg.sort === k) { rerender(); A.focusAfter(fieldSel(x.r.a.id, k)); return; }
    var was = !x.tr.hidden;
    applyFilter();
    if (was && x.tr.hidden) {
      // Filtered out by the edit: the same field of the next row shown, else the search.
      var at = drawn.rows.indexOf(x), next = null;
      for (var i = at + 1; i < drawn.rows.length && !next; i++) if (!drawn.rows[i].tr.hidden) next = drawn.rows[i];
      for (var j = at - 1; j >= 0 && !next; j--) if (!drawn.rows[j].tr.hidden) next = drawn.rows[j];
      A.focusAfter(next ? fieldSel(next.r.a.id, k) : '[data-filter="asset-text"]');
    }
  }
  function moveTo(x, zoneId, focusKey) {
    var a = x.r.a, mk = A.undoMark(), res = AS.move(state.project, a.id, zoneId);
    if (!res) return;
    touched(); rerender();
    // The keyboard on the same field of the asset where it now sorts (false:
    // where it had gone, which the redraw keeps).
    if (focusKey !== false) A.focusAfter(fieldSel(a.id, focusKey || "zone"));
    A.offerUndo(a.id + " moved to " + res.to + (res.dropped ? " and taken off " + res.dropped + " threat" + (res.dropped === 1 ? "" : "s") + "." : "."),
      backHere(fieldSel(a.id, "zone")), mk);
  }
  // The table's own events, one listener of each for every row.
  var NAV_KEYS = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown)$|^.$/;
  function wire(tb) {
    function target(e) {
      var el = e.target, k = el && el.getAttribute && el.getAttribute("data-asset-field");
      var tr = k && el.closest("tr[data-asset-id]");
      var x = tr ? entryOf(tr.getAttribute("data-asset-id")) : null;
      return x ? { el: el, k: k, x: x } : null;
    }
    tb.addEventListener("input", function (e) {
      var t = target(e); if (!t || SELECTS.indexOf(t.k) >= 0) return;
      AS.setField(t.x.r.a, t.k, t.el.value);
      if (t.k === "notes") grow(t.el);
      touched();
    });
    tb.addEventListener("change", function (e) {
      var t = target(e); if (!t || SELECTS.indexOf(t.k) < 0) return;
      if (t.k === "zone") {
        // Moved on a deliberate choice: an arrow press in a closed list fires
        // change too, so after one the move waits for Enter or leaving the field.
        if (t.el.__keyed) { t.el.__pending = true; return; }
        moveTo(t.x, t.el.value);
        return;
      }
      AS.setField(t.x.r.a, t.k, t.el.value);
      afterEdit(t.x, t.k);
    });
    tb.addEventListener("keydown", function (e) {
      var t = target(e); if (!t || t.k !== "zone") return;
      if (e.key === "Enter") {
        t.el.__keyed = false; t.el.__pending = false;
        if (t.el.value !== t.x.r.zone.id) { e.preventDefault(); moveTo(t.x, t.el.value); }
      } else if (NAV_KEYS.test(e.key) && !e.ctrlKey && !e.metaKey) t.el.__keyed = true;
    });
    tb.addEventListener("focusout", function (e) {
      var t = target(e); if (!t || t.k !== "zone") return;
      var el = t.el, x = t.x;
      el.__keyed = false; el.__pending = false;
      function waiting() { var now = AS.find(state.project, x.r.a.id); return el.isConnected && !!now && el.value !== now.zone.id; }
      if (!waiting()) return;
      // Once the keyboard has reached the next field (Tab goes to the type).
      setTimeout(function () {
        if (!waiting()) return;
        var f = document.activeElement, fk = f && f.getAttribute && f.getAttribute("data-asset-field");
        var same = fk && f.closest && f.closest("tr[data-asset-id]");
        moveTo(x, el.value, same && same.getAttribute("data-asset-id") === x.r.a.id ? fk : false);
      }, 0);
    });
  }

  function table(p) {
    var rows = AS.all(p);
    rows.sort(function (x, y) { return cmp(sortValue(x, reg.sort), sortValue(y, reg.sort)) * reg.dir || cmp(x.zone.id, y.zone.id) || x.index - y.index; });
    var head = h("tr", null, COLS.map(function (k) {
      var on = reg.sort === k;
      return h("th", { class: k === "id" ? "reg-id" : k === "name" ? "reg-name" : null, "aria-sort": on ? (reg.dir > 0 ? "ascending" : "descending") : null }, [h("button", { type: "button", class: "link-btn sort-btn", "data-sort": k,
        text: colLabel(k) + (on ? (reg.dir > 0 ? " ▲" : " ▼") : ""), "aria-label": "Sort by " + colLabel(k).toLowerCase(),
        onClick: function () { if (reg.sort === k) reg.dir = -reg.dir; else { reg.sort = k; reg.dir = 1; } rerender(); A.focusAfter('[data-sort="' + k + '"]'); } })]);
    }));
    var tb = document.createElement("tbody"), T = templates(p), list = [];
    rows.forEach(function (r) { var tr = rowEl(r, T); tb.appendChild(tr); list.push({ tr: tr, r: r }); });
    var emptyCell = h("td", { colspan: String(COLS.length), class: "muted" }), empty = h("tr", { "data-asset-empty": "" }, [emptyCell]);
    tb.appendChild(empty);
    wire(tb);
    drawn = { rows: list, empty: empty, emptyCell: emptyCell, count: null };
    return h("div", { class: "grid-scroll reg-scroll" }, [h("table", { class: "tbl compact asset-register" }, [h("thead", null, [head]), tb])]);
  }

  function filters(p) {
    function filterSelect(key, label, list) {
      return selectOf(reg[key], list, function (v) { reg[key] = v; applyFilter(); }, { "data-filter": "asset-" + key, "aria-label": label });
    }
    var search = h("input", { type: "search", value: reg.text, placeholder: "Search", "data-filter": "asset-text", "aria-label": "Search the assets",
      onInput: function (e) { reg.text = e.target.value; applyFilter(); } });
    return h("div", { class: "reg-filters no-print", role: "group", "aria-label": "Filter the assets" }, [
      search,
      filterSelect("zone", "Zone", [{ value: "", text: "All zones" }].concat(zoneOpts(p))),
      filterSelect("type", "Type", [{ value: "", text: "Any type" }].concat(M.ASSET_TYPES.map(function (t) { return { value: t, text: E.assetTypeLabel(t) }; }))),
      filterSelect("crit", "Criticality", [{ value: "", text: "Any criticality" }].concat(M.ASSET_CRITICALITY.map(function (c) { return { value: c, text: M.ASSET_CRITICALITY_LABEL[c] }; }), [{ value: "none", text: "Criticality not set" }])),
      reg.paste.open ? null : h("button", { type: "button", class: "btn sm", "data-action": "asset-paste-open", text: "Paste from Excel", onClick: function () {
        reg.paste.open = true; redrawBar(); redrawPanel('[data-action="asset-paste-text"]');
      } })
    ]);
  }

  // ---------- Paste from Excel ----------
  // Drawn on its own: nothing in it redraws the table until the paste is added.

  function closePaste() { reg.paste = { open: false, text: "", parsed: null, mapping: null, zoneId: reg.paste.zoneId, update: false }; }
  function pastePreview(p) {
    var P0 = reg.paste;
    return AS.preview(p, P0.parsed, P0.mapping, { zoneId: P0.zoneId, updateExisting: P0.update });
  }
  function redrawBar() {
    if (!drawn || !drawn.bar || !drawn.bar.parentNode) return;
    var bar = filters(state.project);
    drawn.bar.parentNode.replaceChild(bar, drawn.bar);
    drawn.bar = bar;
  }
  function redrawPanel(focusSel) {
    if (!drawn || !drawn.holder) return;
    drawn.holder.innerHTML = "";
    if (reg.paste.open) drawn.holder.appendChild(pastePanel(state.project));
    if (focusSel) A.focusAfter(focusSel);
  }
  // The panel again, the keyboard back on the control that changed it.
  function panelAgain(e) {
    var el = e && e.target, sel = null;
    if (el && el.getAttribute) {
      if (el.getAttribute("data-map-col") != null) sel = '[data-map-col="' + el.getAttribute("data-map-col") + '"]';
      else if (el.getAttribute("data-action")) sel = '[data-action="' + el.getAttribute("data-action") + '"]';
    }
    redrawPanel(sel);
  }
  function pastePanel(p) {
    var P0 = reg.paste, kids = [];
    if (!P0.zoneId || !E.findZone(p, P0.zoneId)) {
      var selZ = R.ZonesPage && R.ZonesPage.selection();
      P0.zoneId = selZ && selZ.kind === "zone" && E.findZone(p, selZ.id) ? selZ.id : (p.zones[0] ? p.zones[0].id : "");
    }
    kids.push(h("textarea", { "data-action": "asset-paste-text", rows: "5", value: P0.text, "aria-label": "Rows copied from a spreadsheet",
      placeholder: "Name\tZone\tTag\tVendor\nPLC-101\tZ1\tPLC101\tSiemens",
      onInput: function (e) { P0.text = e.target.value; } }));
    kids.push(h("div", { class: "hint", text: "Copy the rows, with their header row if there is one." }));
    kids.push(h("div", { class: "btn-row", style: "margin-top:6px" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "asset-paste-read", text: "Read", onClick: function () {
        P0.parsed = AS.read(P0.text); P0.mapping = P0.parsed.mapping.slice();
        var pr = P0.parsed;
        redrawPanel(!pr.rows.length ? '[data-action="asset-paste-text"]'
          : pr.unknown.length ? '[data-map-col="' + pr.unknown[0] + '"]'
          : pr.needsMapping ? "[data-map-col]" : '[data-action="asset-paste-apply"]');
      } }),
      h("button", { type: "button", class: "btn sm", "data-action": "asset-paste-cancel", text: "Cancel", onClick: function () {
        closePaste(); redrawPanel(); redrawBar(); A.focusAfter('[data-action="asset-paste-open"]');
      } })
    ]));
    if (P0.parsed) {
      var pr = P0.parsed;
      if (!pr.rows.length) kids.push(h("p", { class: "muted", text: "Nothing to read." }));
      else {
        // The columns: what each holds, chosen where the heading is missing or not known.
        kids.push(h("p", { class: "hint", "data-paste-header": pr.header ? "read" : "none",
          text: pr.header ? (pr.unknown.length ? "Header row read; choose what the other columns hold." : "Header row read.") : "No header row: choose what each column holds." }));
        var maps = h("div", { class: "paste-map" }), dup = AS.duplicates(P0.mapping);
        function colName(c) { return pr.header ? (pr.header[c] || "Column " + (c + 1)) : "Column " + (c + 1) + (pr.rows[0] && pr.rows[0][c] ? " (" + pr.rows[0][c].slice(0, 24) + ")" : ""); }
        for (var c = 0; c < pr.columns; c++) (function (c) {
          var name = colName(c);
          var s = selectOf(P0.mapping[c] || "", [{ value: "", text: "Leave out" }].concat(AS.FIELDS.map(function (f) { return { value: f, text: LABEL[f] }; })), function (v) {
            P0.mapping[c] = v || null;
          }, { "data-map-col": String(c), "aria-label": "What " + name + " holds", class: dup[c] != null ? "val-warn" : null, "data-map-dup": dup[c] != null ? "" : null });
          s.addEventListener("change", panelAgain);
          var fk = [U.labelFor(name, s), s];
          if (dup[c] != null) fk.push(h("div", { class: "hint val-warn", text: "Also chosen for " + colName(dup[c]) + "; that column is read." }));
          maps.appendChild(h("div", { class: "field" }, fk));
        })(c);
        kids.push(maps);
        var zoneSel = selectOf(P0.zoneId, zoneOpts(p), function (v) { P0.zoneId = v; }, { "data-action": "asset-paste-zone" });
        zoneSel.addEventListener("change", panelAgain);
        var upd = h("input", { type: "checkbox", "data-action": "asset-paste-update", checked: P0.update, onChange: function (e) { P0.update = e.target.checked; } });
        upd.addEventListener("change", panelAgain);
        kids.push(h("div", { class: "grid-2" }, [
          h("div", { class: "field" }, [U.labelFor("Zone for rows without one", zoneSel), zoneSel]),
          h("div", { class: "field" }, [h("label", { class: "check-line" }, [upd, "Update existing assets with the same tag"])])
        ]));
        var rows = pastePreview(p), nAdd = 0, nUpd = 0, nSkip = 0, nProb = 0;
        var tb = h("tbody");
        rows.forEach(function (r) {
          if (r.action === "add") nAdd++; else if (r.action === "update") nUpd++; else nSkip++;
          if (r.problems.length) nProb++;
          var does = r.action === "add" ? "Add to " + r.zoneId : r.action === "update" ? "Update " + r.target.a.id : "Left out";
          var shownName = r.values.name || (r.action === "update" && r.target ? r.target.a.name || "" : "");
          tb.appendChild(h("tr", { "data-preview-row": String(r.n), "data-preview-action": r.action }, [
            h("td", { text: String(r.n) }), h("td", { text: shownName }), h("td", { text: r.values.tag || "" }),
            h("td", { text: r.values.typeId ? E.assetTypeLabel(r.values.typeId) : "" }), h("td", { text: does }),
            h("td", { class: r.problems.length ? "val-warn" : "", text: r.problems.join(" ") })
          ]));
        });
        // What the preview comes to, said to a screen reader as it changes.
        var sum = [nAdd + " to add"];
        if (nUpd) sum.push(nUpd + " to update");
        if (nSkip) sum.push(nSkip + " left out");
        kids.push(h("p", { role: "status", class: "paste-summary", "data-paste-summary": "",
          text: rows.length + " row" + (rows.length === 1 ? "" : "s") + ": " + sum.join(", ") + (nProb ? "; " + nProb + " with a problem." : ".") }));
        kids.push(h("div", { class: "grid-scroll" }, [h("table", { class: "tbl compact paste-preview" }, [h("thead", null, [h("tr", null, ["Row", "Name", "Tag", "Type", "Action", "Problems"].map(function (t) { return h("th", { text: t }); }))]), tb])]));
        var label = nAdd || nUpd ? [nAdd ? "Add " + nAdd : "", nUpd ? (nAdd ? "update " : "Update ") + nUpd : ""].filter(Boolean).join(", ") : "Nothing to add";
        kids.push(h("div", { class: "btn-row", style: "margin-top:6px" }, [
          h("button", { type: "button", class: "btn sm primary", "data-action": "asset-paste-apply", text: label, disabled: nAdd || nUpd ? null : "disabled", onClick: function () {
            var mk = A.undoMark(), res = AS.apply(p, pastePreview(p));
            closePaste();
            if (res.added || res.updated) touched();
            rerender();
            A.focusAfter('[data-action="asset-paste-open"]');
            var said = [res.added ? res.added + " asset" + (res.added === 1 ? "" : "s") + " added" : "", res.updated ? res.updated + " updated" : "", res.skipped ? res.skipped + " left out" : ""].filter(Boolean).join(", ") + ".";
            if (res.added || res.updated) A.offerUndo(said.charAt(0).toUpperCase() + said.slice(1), backHere('[data-action="asset-paste-open"]'), mk);
            else toast("Nothing to add.");
          } })
        ]));
      }
    }
    return h("div", { class: "paste-box asset-paste", "data-paste": "" }, kids);
  }

  function render(main) {
    var p = state.project;
    // A zone filter left from a zone that has gone.
    if (reg.zone && !E.findZone(p, reg.zone)) reg.zone = "";
    var tableEl = table(p);
    var bar = filters(p), holder = h("div", { class: "asset-paste-holder" });
    drawn.bar = bar; drawn.holder = holder;
    if (reg.paste.open) holder.appendChild(pastePanel(p));
    var c = card("Asset register", countText(drawn.rows.length, drawn.rows.length), [bar, holder, tableEl], null, { "data-view": "assets" });
    // The count is a polite live region: a screen reader hears what the filter left.
    drawn.count = c.querySelector(".card-h .sub");
    if (drawn.count) drawn.count.setAttribute("aria-live", "polite");
    applyFilter();
    main.appendChild(c);
    // Each notes box as tall as what it holds, once it is on the page.
    drawn.rows.forEach(function (x) { var ta = x.tr.lastChild && x.tr.lastChild.firstChild; if (ta && ta.tagName === "TEXTAREA" && ta.value.indexOf("\n") >= 0) grow(ta); });
  }

  R.AssetsPage = {
    render: render, state: reg,
    // Another project opened (Load, New, Restore, the demo): the filters and the paste box are its own.
    reset: function () { reg.text = ""; reg.zone = ""; reg.type = ""; reg.crit = ""; reg.sort = "zone"; reg.dir = 1; closePaste(); reg.paste.zoneId = ""; drawn = null; }
  };
}());
