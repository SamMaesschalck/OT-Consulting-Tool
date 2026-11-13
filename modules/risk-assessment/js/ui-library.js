/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-library.js — the house scenario library and Send to step 5 (phase 5b).
 *
 * Step 5's Add from library opens an in-page picker over the house scenario
 * library (data/scenario-library.json): search, a tag and a requirement
 * filter, and a hint of how each scenario fits the zone or conduit (its asset
 * types, its markers and flags). The chosen scenarios are added to the zone
 * or conduit as unrated drafts (statement, source, entry point, affected
 * requirements, consequence), each with its libraryId for provenance; their
 * countermeasure ideas are added as unlinked draft countermeasures only when
 * ticked. Nothing is rated or linked for the consultant, and the library
 * itself never reaches a deliverable: what was added is the consultant's own
 * scenario, printed like any other.
 *
 * Step 2's Send to step 5 makes draft scenarios of the known threats recorded
 * there, on a chosen zone or conduit.
 *
 * RiskApp.LibraryUI: picker(owner, project, { onAdded, onClose }), open(id),
 * close(), isOpen(id), add(owner, project, ids, cmKeys) and sendPanel(project).
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var FRS = M.FRS, FR_IDS = M.FR_IDS;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h;

  function library() { return M.LIBRARY && Array.isArray(M.LIBRARY.scenarios) ? M.LIBRARY.scenarios : []; }
  function tagName(id) { return (M.LIBRARY && M.LIBRARY.tags && M.LIBRARY.tags[id]) || String(id).replace(/-/g, " "); }
  // The requirement an SR id belongs to: "SR 5.2" is RDF.
  function frOfSR(sr) { var m = /^SR (\d)\.\d+$/.exec(String(sr || "")); return m ? FR_IDS[Number(m[1]) - 1] || null : null; }
  function isConduit(o) { return "fromZone" in o; }

  // ---------- How a scenario fits a zone or conduit ----------

  // The tags a zone's or conduit's data points at, with the words for the hint.
  function ownerMarks(o, p) {
    var m = {};
    function zoneMarks(z) {
      if (!z) return;
      if (z.flags && z.flags["remote-access"]) m["remote-access"] = "remote access";
      if (z.flags && z.flags.wireless) m.wireless = "wireless";
      if (z.flags && z.flags["removable-media"]) m["removable-media"] = "removable media";
      if (E.zoneSafety(z)) m.safety = "safety related";
      (z.assets || []).forEach(function (a) {
        if (a && a.link === "wireless") m.wireless = "wireless";
        if (a && a.link === "temporary") m.transient = "temporarily connected devices";
      });
    }
    function conduitMarks(c) {
      if (c.wireless) m.wireless = "wireless";
      if (c.temporary) m.transient = "temporarily connected";
      if (E.conduitExternal(c)) { m["remote-access"] = "external network"; if (c.externalParty) m["supply-chain"] = "external party"; }
    }
    if (isConduit(o)) {
      // The zones it joins, then its own markers, which say it best.
      [o.fromZone, o.toZone].forEach(function (id) { if (id && id !== "EXT") zoneMarks(E.findZone(p, id)); });
      conduitMarks(o);
    } else {
      zoneMarks(o);
      p.conduits.forEach(function (c) { if ((c.fromZone === o.id || c.toZone === o.id) && E.conduitExternal(c)) m["remote-access"] = "external conduit"; });
    }
    return m;
  }
  function fitOf(s, o, p, marks) {
    var types = {}, score = 0, why = [];
    E.threatAssets(o, p).forEach(function (a) { types[a.type] = true; });
    var hit = (s.assetTypes || []).filter(function (t) { return types[t]; });
    if (hit.length) { score += hit.length; why.push(hit.map(E.assetTypeLabel).join(", ")); }
    var tags = (s.tags || []).filter(function (t) { return marks[t]; });
    if (tags.length) { score += 2 * tags.length; why.push(tags.map(function (t) { return marks[t]; }).join(", ")); }
    return { score: score, why: why.join("; ") };
  }

  // ---------- Adding to a zone or conduit ----------

  // ids: the library scenarios to add; cmKeys: { "HS01:0": true } for each
  // countermeasure idea ticked. Returns { threats: [the new threats], cms: n }.
  function add(o, p, ids, cmKeys) {
    cmKeys = cmKeys || {};
    var made = [], cms = 0;
    library().filter(function (s) { return ids.indexOf(s.id) >= 0; }).forEach(function (s) {
      p.counters.threat += 1;
      var t = M.emptyThreat(p.counters.threat);
      t.statement = s.statement || ""; t.source = s.source || ""; t.entryPoint = s.entryPoint || ""; t.consequence = s.consequence || "";
      t.affectedFR = FR_IDS.filter(function (fr) { return (s.affectedFR || []).indexOf(fr) >= 0; });
      t.libraryId = s.id;
      o.threats.push(t); made.push(t);
      (s.countermeasures || []).forEach(function (c, i) {
        if (!cmKeys[s.id + ":" + i]) return;
        p.counters.cm += 1;
        var m = M.emptyCountermeasure(p.counters.cm);
        m.description = c.description || "";
        m.srRefs = (c.srRefs || []).slice();
        m.addressesFR = FR_IDS.filter(function (fr) { return m.srRefs.some(function (sr) { return frOfSR(sr) === fr; }); });
        o.countermeasures.push(m); cms++;
      });
    });
    return { threats: made, cms: cms };
  }

  // ---------- The picker (step 5) ----------

  // What the picker has open, for one zone or conduit of one project.
  var pk = null;
  // The picker's element id, for Add from library's aria-controls.
  function pickerId(id) { return "lib-picker-" + String(id).replace(/[^A-Za-z0-9_-]/g, "_"); }
  function isOpen(id) { return !!pk && pk.project === state.project && pk.owner === id; }
  function open(id) { pk = { project: state.project, owner: id, q: "", tag: "", fr: "", picked: {}, cms: {} }; }
  function close() { pk = null; }

  function matches(s) {
    var q = pk.q.trim().toLowerCase();
    if (pk.tag && (s.tags || []).indexOf(pk.tag) < 0) return false;
    if (pk.fr && (s.affectedFR || []).indexOf(pk.fr) < 0) return false;
    if (q && [s.title, s.statement, s.source, s.entryPoint, s.consequence].concat(s.vulnerabilities || [], (s.tags || []).map(tagName)).join(" ").toLowerCase().indexOf(q) < 0) return false;
    return true;
  }

  // cb.onAdded(result) after Add; cb.onClose() after Cancel.
  function picker(o, p, cb) {
    var marks = ownerMarks(o, p);
    var already = {}; o.threats.forEach(function (t) { if (t.libraryId) already[t.libraryId] = true; });
    var list = library().map(function (s, i) { return { s: s, i: i, fit: fitOf(s, o, p, marks) }; });
    list.sort(function (a, b) { return b.fit.score - a.fit.score || a.i - b.i; });
    var addBtn = h("button", { type: "button", class: "btn sm primary", "data-action": "lib-add" });
    var count = h("span", { class: "muted lib-count", "aria-live": "polite" });
    function picks() { return Object.keys(pk.picked).filter(function (k) { return pk.picked[k]; }); }
    function sync() {
      var n = picks().length;
      addBtn.textContent = n ? "Add " + n : "Add";
      addBtn.disabled = !n;
      var shown = 0;
      items.forEach(function (it) { var on = matches(it.s); it.el.hidden = !on; if (on) shown++; });
      count.textContent = shown + " of " + list.length;
    }
    var items = list.map(function (x) {
      var s = x.s, body = null;
      var box = h("input", { type: "checkbox", "data-lib-pick": s.id, checked: !!pk.picked[s.id], onChange: function (e) {
        pk.picked[s.id] = e.target.checked; body.hidden = !e.target.checked; sync();
      } });
      var cmKids = (s.countermeasures || []).map(function (c, ci) {
        var key = s.id + ":" + ci;
        return h("label", null, [h("input", { type: "checkbox", "data-lib-cm": key, checked: !!pk.cms[key], onChange: function (e) { pk.cms[key] = e.target.checked; } }),
          c.description + ((c.srRefs || []).length ? " (" + c.srRefs.join(", ") + ")" : "")]);
      });
      body = h("div", { class: "lib-body" }, [
        h("div", { text: s.statement }),
        h("div", { class: "muted", text: "Source: " + (s.source || "Not given") + ". Entry point: " + (s.entryPoint || "Not given") + "." }),
        (s.vulnerabilities || []).length ? h("div", null, [h("strong", { text: "Typical vulnerabilities" }), h("ul", null, s.vulnerabilities.map(function (v) { return h("li", { text: v }); }))]) : null,
        cmKids.length ? h("div", { class: "lib-cms", role: "group", "aria-label": "Countermeasure ideas for " + s.id }, [h("strong", { text: "Also add as draft countermeasures" })].concat(cmKids)) : null
      ]);
      body.hidden = !pk.picked[s.id];
      var el = h("div", { class: "lib-item", "data-lib-id": s.id }, [
        h("label", { class: "lib-head" }, [box, h("strong", { text: s.title }), h("span", { class: "muted", text: (s.affectedFR || []).join(", ") + ((s.tags || []).length ? "; " + s.tags.map(tagName).join(", ") : "") }),
          already[s.id] ? h("span", { class: "pill neutral", text: "Already added" }) : null]),
        x.fit.score ? h("div", { class: "lib-fit", text: "Fits: " + x.fit.why }) : null,
        body
      ]);
      return { s: s, el: el };
    });
    var search = h("input", { type: "search", "data-field": "lib-search", value: pk.q, "aria-label": "Search the library", placeholder: "Search the library",
      onInput: function (e) { pk.q = e.target.value; sync(); } });
    function filterSel(key, label, opts) {
      var sel = h("select", { "data-field": "lib-" + key, "aria-label": label, onChange: function (e) { pk[key] = e.target.value; sync(); } });
      opts.forEach(function (x) { var op = h("option", { value: x.v, text: x.t }); if (pk[key] === x.v) op.setAttribute("selected", "selected"); sel.appendChild(op); });
      return sel;
    }
    var tagIds = {}; library().forEach(function (s) { (s.tags || []).forEach(function (t) { tagIds[t] = true; }); });
    var tags = Object.keys(tagIds).sort(function (a, b) { return tagName(a) < tagName(b) ? -1 : 1; });
    addBtn.addEventListener("click", function () {
      var ids = picks(); if (!ids.length) return;
      var mark = A.undoMark();
      var res = add(o, p, ids, pk.cms);
      res.mark = mark;
      close();
      cb.onAdded(res);
    });
    var wrap = h("div", { class: "lib-picker no-print", id: pickerId(o.id), "data-library-picker": o.id, role: "group", "aria-label": "Add from the scenario library" }, [
      h("div", { class: "lib-filters" }, [search,
        filterSel("tag", "Tag", [{ v: "", t: "Any tag" }].concat(tags.map(function (t) { return { v: t, t: tagName(t) }; }))),
        filterSel("fr", "Foundational requirement", [{ v: "", t: "Any requirement" }].concat(FRS.map(function (f) { return { v: f.id, t: f.id + " " + f.name }; }))),
        count]),
      h("p", { class: "hint", style: "margin:0 0 6px", text: "Added unrated, for you to edit and rate." }),
      h("div", { class: "lib-list" }, items.map(function (it) { return it.el; })),
      h("div", { class: "btn-row", style: "margin-top:8px" }, [addBtn,
        h("button", { type: "button", class: "btn sm", "data-action": "lib-cancel", text: "Cancel", onClick: function () { close(); cb.onClose(); } })])
    ]);
    // Escape closes it, as Cancel does.
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); close(); cb.onClose(); } });
    sync();
    return wrap;
  }

  // ---------- Send to step 5 (step 2) ----------

  // What the panel has chosen, for the project it was chosen in.
  var snd = { project: null, target: "", off: {}, open: false };
  function sendState() {
    if (snd.project !== state.project) snd = { project: state.project, target: "", off: {}, open: false };
    return snd;
  }
  var listBox = null, sendBtn = null;
  function targetOf(p) {
    var st = sendState(), all = p.zones.concat(p.conduits);
    var o = all.filter(function (x) { return x.id === st.target; })[0];
    return o || all[0] || null;
  }
  function fillSend(p) {
    if (!listBox) return;
    var st = sendState(), o = targetOf(p), lines = p.srs.knownThreats || [];
    listBox.innerHTML = "";
    var there = {}; if (o) o.threats.forEach(function (t) { there[(t.statement || "").trim().toLowerCase()] = true; });
    lines.forEach(function (line, i) {
      var inIt = !!there[line.trim().toLowerCase()];
      var on = !inIt && !st.off[line];
      listBox.appendChild(h("label", null, [h("input", { type: "checkbox", "data-send-line": String(i), checked: on, disabled: inIt ? "disabled" : null, onChange: function (e) {
        if (e.target.checked) delete st.off[line]; else st.off[line] = true; fillCount(p);
      } }), line + (inIt ? " (in " + o.id + ")" : "")]));
    });
    if (!lines.length) listBox.appendChild(h("p", { class: "muted", style: "margin:0", text: "None recorded yet." }));
    fillCount(p);
  }
  function chosenLines(p) {
    var st = sendState(), o = targetOf(p), there = {};
    if (o) o.threats.forEach(function (t) { there[(t.statement || "").trim().toLowerCase()] = true; });
    return (p.srs.knownThreats || []).filter(function (line) { return !there[line.trim().toLowerCase()] && !st.off[line]; });
  }
  function fillCount(p) {
    if (!sendBtn) return;
    var n = chosenLines(p).length;
    sendBtn.textContent = n ? "Send " + n : "Send";
    sendBtn.disabled = !n;
  }
  // Draft scenarios from the known threats: the line is the statement, and
  // the rest is the consultant's to fill in on step 5.
  function send(p, o, lines) {
    var made = [];
    lines.forEach(function (line) {
      p.counters.threat += 1;
      var t = M.emptyThreat(p.counters.threat);
      t.statement = line;
      o.threats.push(t); made.push(t);
    });
    return made;
  }
  function sendPanel(p) {
    var st = sendState(), owners = p.zones.concat(p.conduits);
    if (!owners.length) return h("p", { class: "hint", "data-send": "", text: "Known threats can be sent to step 5 once there are zones." });
    var o = targetOf(p);
    var sel = h("select", { "data-field": "send-target", "aria-label": "Zone or conduit to send to", onChange: function (e) { st.target = e.target.value; fillSend(p); } });
    owners.forEach(function (x) { var op = h("option", { value: x.id, text: x.id + (x.name ? " " + x.name : "") }); if (x === o) op.setAttribute("selected", "selected"); sel.appendChild(op); });
    listBox = h("div", { class: "send-threats", role: "group", "aria-label": "Known threats to send" });
    sendBtn = h("button", { type: "button", class: "btn sm", "data-action": "send-threats", onClick: function () {
      var to = targetOf(p), lines = chosenLines(p);
      if (!to || !lines.length) return;
      var mk = A.undoMark();
      var made = send(p, to, lines);
      // Those left out start ticked again for the next send.
      st.off = {};
      touched(); rerender();
      var again = document.querySelector('#main [data-action="send-threats"]');
      A.focusAfter(again && !again.disabled ? '[data-action="send-threats"]' : '[data-field="send-target"]');
      A.offerUndo(made.length + " threat" + (made.length === 1 ? "" : "s") + " sent to " + to.id + " as draft scenario" + (made.length === 1 ? "" : "s") + ".",
        function () { return '[data-action="send-threats"]'; }, mk);
    } });
    var det = h("details", { class: "send-step5 no-print", "data-send": "" }, [
      h("summary", { text: "Send to step 5" }),
      h("div", { style: "margin-top:6px" }, [listBox, h("div", { class: "btn-row", style: "margin-top:6px" }, [sel, sendBtn])])
    ]);
    if (st.open) det.setAttribute("open", "");
    det.addEventListener("toggle", function () { if (det.isConnected) st.open = det.open; });
    // Filled now, then again as the known threats are typed (js/ui-stages.js).
    fillSend(p);
    fillSendNow = function () { if (listBox && listBox.isConnected) fillSend(p); };
    return det;
  }
  var fillSendNow = function () {};

  R.LibraryUI = {
    picker: picker, pickerId: pickerId, open: open, close: close, isOpen: isOpen, add: add, frOfSR: frOfSR, fitOf: function (s, o, p) { return fitOf(s, o, p, ownerMarks(o, p)); },
    sendPanel: sendPanel, refreshSend: function () { fillSendNow(); }, send: send
  };
}());
