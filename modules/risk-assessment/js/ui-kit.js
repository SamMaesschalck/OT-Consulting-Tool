/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-kit.js — the pieces every page is built from.
 *
 * The element builder h(), the toast, the light/dark toggle, cards, fields,
 * the editable register table, FR chips, risk pills, a page's sub-title with
 * its ZCR, the Why trace and the SL buttons, plus the small helpers they
 * share. An edit made through one of these marks the project changed and
 * redraws the page through js/app.js (RiskApp.App), which loads after this
 * file; it is only called once the app is running.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.UI = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine;
  var RULES = M.RULES, FRS = M.FRS, SIS_RULE = M.SIS_RULE, MODS = M.MODS, BAND_NAME = M.BAND_NAME;

  // Ownership notice, shown in the sidebar and on the About page. The tool
  // goes to contractors; the terms themselves are in LICENCE.txt.
  var LEGAL_SHORT = "© 2026 SolutionsPT. All rights reserved.";
  var LEGAL_NOTICE = "© 2026 SolutionsPT. All rights reserved. Proprietary and confidential. " +
    "Licensed only for work commissioned by SolutionsPT; it may not be resold, shared or used for any other " +
    "client or purpose. See LICENCE.txt for the full terms.";

  function touched() { R.App.touched(); }
  function rerender() { R.App.rerender(); }

  // ---------- DOM helpers ----------

  function $(id) { return document.getElementById(id); }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "onClick") el.addEventListener("click", v);
      else if (k === "onInput") el.addEventListener("input", v);
      else if (k === "onChange") el.addEventListener("change", v);
      else if (k === "checked") el.checked = !!v;
      else if (k === "value") el.value = v;
      else if (v != null) el.setAttribute(k, v);   // a null attribute is left off
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  function svgEl(tag, attrs, children) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) { el.appendChild(c); });
    return el;
  }

  // ---------- Theme (light / dark) ----------
  // Shares the "ot-theme" localStorage key with the assessment tool so a
  // choice in one app carries to the other. The theme is pre-applied before
  // first paint by the inline script in <head>; this just wires the toggle.

  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ot-theme", theme); } catch (e) {}
    var btn = $("btn-theme");
    if (btn) {
      var dark = theme === "dark";
      btn.textContent = dark ? "☀ Light" : "☾ Dark"; // icon for the mode you'd switch TO
      btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }
  }
  function setupThemeToggle() {
    applyTheme(currentTheme());
    var btn = $("btn-theme");
    if (!btn) return;
    btn.addEventListener("click", function () { applyTheme(currentTheme() === "dark" ? "light" : "dark"); });
  }

  var toastTimer = null;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast hidden"; }, 3800);
  }

  function slug(s) { return (s || "risk-assessment").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "risk-assessment"; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function lines(v) { return v.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); }
  function listOf(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : (a[0] || ""); }

  // A destructive delete confirms only when the row has real content, so
  // adding then removing a blank row stays friction-free while filled work
  // can't vanish on one misclick. Returns true when it's OK to proceed.
  function confirmRemove(filled, label) {
    return !filled || confirm("Remove this " + label + "? This can't be undone.");
  }

  function downloadBlob(text, filename) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  // ---------- Field helpers ----------

  // A field's label, tied to its control (label[for]), so a screen reader
  // names the control by it.
  var fieldSeq = 0;
  function labelFor(text, control) {
    if (!control.id) control.id = "f" + (++fieldSeq);
    return h("label", { text: text, for: control.id });
  }

  function textField(label, value, onInput, opts) {
    opts = opts || {};
    var input = opts.textarea
      ? h("textarea", { value: value || "", onInput: function (e) { onInput(e.target.value); } })
      : h("input", { type: "text", value: value || "", onInput: function (e) { onInput(e.target.value); } });
    if (opts.placeholder) input.setAttribute("placeholder", opts.placeholder);
    var kids = [labelFor(label, input), input];
    if (opts.hint) kids.push(h("div", { class: "hint", text: opts.hint }));
    return h("div", { class: "field" }, kids);
  }

  function selectField(label, value, options, onChange, opts) {
    opts = opts || {};
    var sel = h("select", { onChange: function (e) { onChange(e.target.value); } });
    (opts.placeholder !== false) && sel.appendChild(h("option", { value: "", text: opts.placeholderText || "Not set" }));
    options.forEach(function (o) {
      var op = h("option", { value: o.value, text: o.text });
      if (String(value) === String(o.value)) op.setAttribute("selected", "selected");
      sel.appendChild(op);
    });
    var kids = [labelFor(label, sel), sel];
    if (opts.hint) kids.push(h("div", { class: "hint", text: opts.hint }));
    return h("div", { class: "field" }, kids);
  }

  // Editable list of free-text lines stored as an array.
  function lineListField(label, arr, onChange, placeholder) {
    return textField(label, arr.join("\n"), function (v) { onChange(lines(v)); }, { textarea: true, placeholder: placeholder, hint: "One per line." });
  }

  // attrs: optional extra attributes, such as data-owner-id, which a review
  // comment's Go to scrolls to.
  function card(title, sub, bodyKids, headExtra, attrs) {
    var head = [h("h2", { text: title })];
    if (sub) head.push(h("span", { class: "sub", text: sub }));
    if (headExtra) head.push(headExtra);
    return h("div", Object.assign({ class: "card" }, attrs || {}), [h("div", { class: "card-h" }, head), h("div", { class: "card-b" }, bodyKids)]);
  }

  function frChips(selected, onToggle) {
    var wrap = h("div", { class: "fr-chips" });
    FRS.forEach(function (f) {
      var on = selected.indexOf(f.id) >= 0;
      wrap.appendChild(h("span", {
        class: "fr-chip" + (on ? " on" : ""),
        title: f.fr + ": " + f.name,
        onClick: function () { onToggle(f.id); },
        text: f.id
      }));
    });
    return wrap;
  }

  function riskPill(band) {
    return band
      ? h("span", { class: "risk-pill risk-" + band, text: BAND_NAME[band] })
      : h("span", { class: "risk-pill risk-none", text: "Not rated" });
  }

  // A page's sub-title, led by the one reference to its ZCR (its title is the
  // tooltip). cls: extra classes, such as no-print.
  function pageSub(stageId, text, cls) {
    var z = M.stageZcr(stageId);
    return h("p", { class: "page-sub" + (cls ? " " + cls : "") }, [
      z ? h("span", { class: "zcr-ref", title: z.title, text: z.id }) : null,
      (z ? " · " : "") + text
    ]);
  }

  // ---------- Shared editors ----------

  // Generic editable register table. columns: [{ key, label, kind:'text'|'date'|'select'|'computed',
  // options?, placeholder?, width?, render? }]. 'computed' cells call render(item).
  // opts.rowAttrs(item): attributes for the row (a data-* id to go to);
  // opts.onRemove(item): after a row is taken out, before the redraw.
  function registerTable(items, columns, opts) {
    opts = opts || {};
    var tbl = h("table", { class: "tbl" }, [h("thead", null, [h("tr", null,
      columns.map(function (c) { return h("th", { text: c.label, style: c.width ? "width:" + c.width : "" }); }).concat([h("th", { text: "", style: "width:40px" })])
    )])]);
    var tb = h("tbody");
    if (!items.length) {
      tb.appendChild(h("tr", null, [h("td", { colspan: String(columns.length + 1), class: "muted", text: opts.empty || "None recorded yet." })]));
    }
    items.forEach(function (it, i) {
      var cells = columns.map(function (c) {
        if (c.kind === "computed") return h("td", { class: "center" }, [c.render(it)]);
        var inp;
        if (c.kind === "select") {
          inp = h("select", { onChange: function (e) { it[c.key] = e.target.value; touched(); rerender(); } });
          inp.appendChild(h("option", { value: "", text: c.placeholder || "Not set" }));
          c.options.forEach(function (o) { var op = h("option", { value: o.value, text: o.text }); if (it[c.key] === o.value) op.setAttribute("selected", "selected"); inp.appendChild(op); });
        } else {
          inp = h("input", { type: c.kind === "date" ? "date" : "text", value: it[c.key] || "", onInput: function (e) { it[c.key] = e.target.value; touched(); } });
          if (c.placeholder) inp.setAttribute("placeholder", c.placeholder);
        }
        return h("td", null, [inp]);
      });
      cells.push(h("td", null, [h("button", { class: "btn sm danger", text: "×", title: "Remove", onClick: function () {
        var filled = columns.some(function (c) { return c.kind !== "computed" && it[c.key]; });
        if (!confirmRemove(filled, opts.rowLabel || "entry")) return;
        items.splice(i, 1);
        if (opts.onRemove) opts.onRemove(it);
        touched(); rerender();
        if (filled && opts.rowLabel) toast(cap(opts.rowLabel) + " removed.");
      } })]));
      tb.appendChild(h("tr", opts.rowAttrs ? opts.rowAttrs(it) : null, cells));
    });
    tbl.appendChild(tb);
    return h("div", null, [tbl, h("div", { style: "margin-top:10px" }, [h("button", { class: "btn sm", text: opts.addLabel || "+ Add row", onClick: opts.onAdd })])]);
  }

  // opts.noSafety: the safety designation is shown elsewhere (the zones page).
  function flagEditor(zone, opts) {
    opts = opts || {};
    var wrap = h("div", { class: "flag-grid" });
    function box(id, label) {
      return h("label", null, [h("input", { type: "checkbox", "data-flag": id, checked: zone.flags[id], onChange: function (e) { zone.flags[id] = e.target.checked; touched(); rerender(); } }), label]);
    }
    if (SIS_RULE && !opts.noSafety) wrap.appendChild(box("sis-present", SIS_RULE.label));
    MODS.forEach(function (m) { wrap.appendChild(box(m.id, m.label)); });
    return h("div", { class: "field" }, [h("label", { text: "Exposure flags" }), wrap]);
  }

  function slButtonsFR(current, onSet) {
    var row = h("div", { class: "sl-row" });
    [1, 2, 3, 4].forEach(function (n) { row.appendChild(h("button", { class: "sl-btn" + (current === n ? " active" : ""), text: "SL" + n, title: RULES.slDefinitions[String(n)], onClick: function () { onSet(n); } })); });
    row.appendChild(h("button", { class: "sl-btn na" + (current == null ? " active" : ""), text: "Not set", title: "Not set (falls back to the default)", onClick: function () { onSet(null); } }));
    return row;
  }

  function traceDetails(trace) {
    return h("div", { class: "trace" }, [
      h("details", null, [
        h("summary", { text: "Why" }),
        h("div", { class: "trace-box" }, [h("ul", null, trace.map(function (t) { return h("li", { text: t }); }))])
      ])
    ]);
  }

  // The zone and conduit drawing (js/zone-map.js), as SVG. onPick(zoneId):
  // a zone's box opens it (click, or Enter on the box).
  function renderZoneMap(p, onPick) {
    var L = window.RiskZoneMap.layout(p, E.suggestZone);
    if (!L) return h("p", { class: "muted", text: "Add zones to see the drawing." });
    var svg = window.RiskZoneMap.toSvg(L, svgEl);
    if (onPick) [].forEach.call(svg.querySelectorAll("[data-zone-id]"), function (g) {
      var id = g.getAttribute("data-zone-id");
      g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.setAttribute("aria-label", "Open " + id);
      g.setAttribute("class", "zone-box-link");
      g.addEventListener("click", function () { onPick(id); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(id); } });
    });
    return h("div", { class: "zone-map-wrap" }, [svg]);
  }

  return {
    LEGAL_SHORT: LEGAL_SHORT, LEGAL_NOTICE: LEGAL_NOTICE,
    $: $, h: h, svgEl: svgEl,
    currentTheme: currentTheme, applyTheme: applyTheme, setupThemeToggle: setupThemeToggle,
    toast: toast, todayISO: E.todayISO, slug: slug, cap: cap, lines: lines, listOf: listOf,
    confirmRemove: confirmRemove, downloadBlob: downloadBlob,
    labelFor: labelFor, textField: textField, selectField: selectField, lineListField: lineListField, card: card,
    frChips: frChips, riskPill: riskPill, pageSub: pageSub,
    registerTable: registerTable, flagEditor: flagEditor, slButtonsFR: slButtonsFR, traceDetails: traceDetails,
    renderZoneMap: renderZoneMap
  };
}());
