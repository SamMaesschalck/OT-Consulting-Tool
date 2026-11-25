/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-consequence.js — step 5's By consequence tab: the workshop run
 * consequence first.
 *
 * Each consequence (project.consequences, js/model.js) is drawn as a bow-tie:
 * the paths that lead to it on the left, the consequence on the right (its
 * title, impact per category, where the rating comes from, the ranked
 * systems it concerns). A path is a threat in the zone or conduit where it
 * acts (threat.consequenceId, threat.via): Add path makes one there, its
 * impact copied from the consequence and its requirements left to pick;
 * Link adds an existing threat; From library adds a house scenario as a
 * path (js/ui-library.js); Unlink and Remove offer Undo. Changing a
 * consequence's impact offers to update the paths still on the old value
 * (their own category ratings as the consequence's were, or none and the
 * old impact), and never does it unasked; the offer is checked against the
 * project each time it is drawn or used, and goes on an undo or when the
 * page is left. Step 2's Start from this consequence calls startFrom. Every
 * rating, decision and output of a path is its threat's.
 *
 * RiskApp.ConsequenceUI: render(main, project, vm, open), reveal(kId),
 * startFrom(rankedSystem), addPath(k, form), linkThreat(k, ownerId, threatId),
 * comeBack() (the path opened from here, on returning), leave() (the offer goes).
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, card = U.card, toast = U.toast, riskPill = U.riskPill, labelFor = U.labelFor;

  // What the tab shows, kept across redraws (not saved).
  var cu = null;
  function fresh() {
    if (!cu || cu.forProject !== state.project) cu = { forProject: state.project, edit: {}, form: null, offer: null, lib: null, reveal: null, back: null, snap: {} };
    return cu;
  }
  function reveal(kId) { fresh().reveal = kId; }
  // The offer to update paths goes on an undo and when the page is left.
  function leave() { if (cu) { cu.offer = null; cu.snap = {}; } }
  // Back on the tab after a path was opened in By zone: its consequence is
  // brought into view and the keyboard goes to the path's row.
  function comeBack() {
    var st = fresh(), b = st.back, p = state.project;
    st.back = null;
    if (!b || !M.consequenceById(p, b.k) || !E.pathsTo(p, b.k).some(function (x) { return x.t.id === b.t && x.owner.id === b.owner; })) return null;
    st.reveal = b.k;
    return '[data-consequence-id="' + b.k + '"] [data-threat-id="' + b.t + '"] [data-action="open-path"]';
  }
  function owners(p) { return p.zones.concat(p.conduits); }
  function findOwner(p, id) { var all = owners(p); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function kSel(k, rest) { return '[data-consequence-id="' + k.id + '"]' + (rest ? " " + rest : ""); }
  function toggleIn(arr, id) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); }
  function chip(text, on, key, onClick, title) {
    return h("button", { type: "button", class: "chip-btn xs" + (on ? " on" : ""), "aria-pressed": on ? "true" : "false", "data-chip": key, title: title || null,
      text: (on ? "✓ " : "") + text, onClick: onClick });
  }
  // Back to a consequence after an undo: the tab, and where the keyboard goes.
  function backTo(kId, sel) {
    return function () { R.RiskPage.showConsequence(kId); state.stage = "risk"; return sel || null; };
  }

  // ---------- Making and changing consequences ----------

  function newConsequence(p) {
    var k = M.emptyConsequence(M.nextConsequenceId(p));
    if (!Array.isArray(p.consequences)) p.consequences = [];
    p.consequences.push(k);
    return k;
  }
  // A consequence started from a ranked system's worst credible consequence
  // (step 2): its impact, its categories and their source, linked to it. The
  // title and description are the consultant's to write.
  function startFrom(a) {
    var p = state.project, mk = A.undoMark();
    var k = newConsequence(p);
    k.impact = a.consequence || "";
    if (a.consequenceByCategory && typeof a.consequenceByCategory === "object" && Object.keys(a.consequenceByCategory).length) k.impactByCategory = clone(a.consequenceByCategory);
    k.source = a.consequenceSource || "";
    k.hlaIds = [a.id];
    fresh().edit[k.id] = true;
    touched();
    R.RiskPage.showConsequence(k.id);
    A.navigate("risk", kSel(k, '[data-k-field="title"]'));
    A.offerUndo(k.id + " started from " + a.id + ".", function () { state.stage = "srs"; return '[data-hla-id="' + a.id + '"] [data-action="start-consequence"]'; }, mk);
    return k;
  }
  // Removing a consequence keeps its paths as threats; the list goes with
  // the last one, so the file reads as one never given any.
  function removeConsequence(p, k) {
    var mk = A.undoMark();
    p.consequences.splice(p.consequences.indexOf(k), 1);
    if (!p.consequences.length) delete p.consequences;
    R.Migrate.pruneDangling(p);
    touched(); rerender();
    A.focusAfter('[data-action="add-consequence"]');
    A.offerUndo(k.id + " removed; its paths stay as threats.", backTo(k.id, kSel(k, '[data-action="edit-consequence"]')), mk);
  }
  // After the consequence's impact changed: the paths still on the old
  // value are offered the new one, and nothing changes until chosen. A path
  // is on the old value when its own category ratings are the consequence's
  // old ones, or it has none and its impact is the old impact (a path rated
  // on categories of its own is never overwritten). No offer to un-rate.
  // fromMap: the consequence's category ratings before the change.
  function catMap(o) { return o && typeof o === "object" && Object.keys(o).length ? o : null; }
  function sameMap(a, b) {
    var ka = Object.keys(a).filter(function (x) { return a[x]; }), kb = Object.keys(b).filter(function (x) { return b[x]; });
    return ka.length === kb.length && ka.every(function (x) { return a[x] === b[x]; });
  }
  function onOld(t, off) {
    var own = catMap(t.impactByCategory);
    return own ? !!off.fromMap && sameMap(own, off.fromMap) : t.impact === off.from;
  }
  // The consequence as its paths were last lined up with it (st.snap[k.id]:
  // its impact and category ratings when editing began, or when its impact
  // last moved), so several category changes on the way to a new impact
  // still compare the paths with the ratings they copied.
  function snapOf(k) { return { impact: k.impact || "", map: catMap(k.impactByCategory) ? clone(k.impactByCategory) : null }; }
  function impactChanged(p, k, from, fromMap) {
    var st = fresh(), s = st.snap[k.id];
    // The impact did not move (another category changed under the worst):
    // an offer waiting still stands.
    if (k.impact === from) return;
    var base = s && s.impact === from ? s.map : fromMap;
    st.snap[k.id] = snapOf(k);
    st.offer = null;
    if (!from || !k.impact) return;
    st.offer = { k: k.id, from: from, fromMap: catMap(base) ? clone(base) : null, to: k.impact };
  }
  // The offer as it stands now, or null (and dropped) once it no longer
  // fits: the consequence's impact moved on (an undo, another change), or
  // no path is left on the old value. paths: those still on it.
  function liveOffer(p, k) {
    var st = fresh(), off = st.offer;
    if (!off || off.k !== k.id) return null;
    var paths = k.impact && k.impact === off.to ? E.pathsTo(p, k.id).filter(function (x) { return onOld(x.t, off); }) : [];
    if (!paths.length) { st.offer = null; return null; }
    return { off: off, paths: paths };
  }
  function applyOffer(p, k) {
    var lo = liveOffer(p, k), back = kSel(k, '[data-action="edit-consequence"]');
    if (!lo) { rerender(); A.focusAfter(back); return; }
    var mk = A.undoMark();
    lo.paths.forEach(function (x) {
      x.t.impact = k.impact;
      if (catMap(k.impactByCategory)) x.t.impactByCategory = clone(k.impactByCategory); else delete x.t.impactByCategory;
    });
    var n = lo.paths.length;
    cu.offer = null;
    touched(); rerender();
    A.focusAfter(back);
    A.offerUndo(n + " path" + (n === 1 ? "" : "s") + " updated to " + E.impactName(k.impact, p) + ".", backTo(k.id, back), mk);
  }

  // ---------- Paths ----------

  // A new threat in the zone or conduit where the path acts: the impact (and
  // its categories) copied from the consequence, the requirements left to pick.
  // form: { owner, via, statement, source, entry, assets, vulns }
  function makePath(p, k, o, form, t) {
    if (!t) {
      p.counters.threat += 1;
      t = M.emptyThreat(p.counters.threat);
      o.threats.push(t);
    }
    if (form.statement && form.statement.trim()) t.statement = form.statement.trim();
    if (form.source && form.source.trim()) t.source = form.source.trim();
    if (form.entry && form.entry.trim()) t.entryPoint = form.entry.trim();
    // The threat's own consequence field stays the consultant's to write.
    var assets = E.threatAssets(o, p).map(function (a) { return a.id; }), vulns = o.vulnerabilities.map(function (v) { return v.id; });
    (form.assets || []).forEach(function (id) { if (assets.indexOf(id) >= 0 && t.assetIds.indexOf(id) < 0) t.assetIds.push(id); });
    (form.vulns || []).forEach(function (id) { if (vulns.indexOf(id) >= 0 && t.vulnerabilityIds.indexOf(id) < 0) t.vulnerabilityIds.push(id); });
    M.setConsequenceId(t, k.id);
    M.setVia(t, (form.via || []).filter(function (id) { return id !== o.id; }));
    t.impact = k.impact || "";
    if (k.impactByCategory && Object.keys(k.impactByCategory).length) t.impactByCategory = clone(k.impactByCategory); else delete t.impactByCategory;
    return t;
  }
  function addPath(k, form) {
    var p = state.project, o = findOwner(p, form && form.owner);
    if (!o) return null;
    return makePath(p, k, o, form);
  }
  function linkThreat(k, ownerId, threatId) {
    var o = findOwner(state.project, ownerId), t = o && o.threats.filter(function (x) { return x.id === threatId; })[0];
    if (!t) return null;
    M.setConsequenceId(t, k.id);
    return t;
  }

  // ---------- Drawing ----------

  function viaWords(x) { return x.via.length ? E.andList(x.via) : "Direct"; }
  function pathRows(k, p, vm, open) {
    var rows = vm.threats.filter(function (x) { return x.consequence === k; });
    var stones = E.steppingStones(p);
    if (!rows.length) return h("p", { class: "muted ed-none", text: "No path yet." });
    var tb = h("tbody");
    rows.forEach(function (x) {
      var t = x.t, vs = E.pathImpactVs(t, k, p), n = open.threat[x.owner.id + "/" + t.id];
      var dec = h("span", { class: x.exceeds && !x.decided ? "val-warn" : "", text: R.RiskPage.decisionWords(x) });
      R.RiskPage.live(function (vm2) {
        var y = vm2.threats.filter(function (z) { return z.owner.id === x.owner.id && z.t.id === t.id; })[0]; if (!y) return;
        dec.textContent = R.RiskPage.decisionWords(y); dec.className = y.exceeds && !y.decided ? "val-warn" : "";
      });
      var thin = x.via.filter(function (id) { return stones[id]; });
      tb.appendChild(h("tr", { "data-threat-id": t.id, "data-path-owner": x.owner.id }, [
        h("td", null, [h("button", { type: "button", class: "link-btn", "data-action": "open-path", text: t.id, "aria-label": "Open " + t.id + " in " + x.owner.id,
          onClick: function () { fresh().back = { k: k.id, owner: x.owner.id, t: t.id }; R.RiskPage.openScenario(x.owner.id, t.id); } })]),
        h("td", { text: x.owner.id + (x.owner.name ? " " + x.owner.name : "") }),
        h("td", { class: "path-via" }, [viaWords(x), thin.length ? h("div", null, [h("span", { class: "pill flag stone-pill", "data-stone-note": "", text: "No threats of its own: " + E.andList(thin) })]) : null]),
        h("td", { text: t.source || "Not given", class: t.source ? "" : "val-warn" }),
        h("td", { text: t.entryPoint || "Not given", class: t.entryPoint ? "" : "val-warn" }),
        h("td", { class: "center" }, [riskPill(x.risk),
          vs === "lower" || vs === "higher" ? h("div", { class: "muted path-note", "data-part": "impact-vs", text: R.RiskPage.impactVsWords(vs, k, p) }) : null]),
        h("td", null, [dec, n ? h("div", { class: "val-warn path-note", text: n + " open" }) : null]),
        h("td", null, [h("button", { type: "button", class: "btn xs", "data-action": "unlink-path", text: "Unlink", "aria-label": "Unlink " + t.id + " from " + k.id,
          onClick: function () {
            var mk = A.undoMark(); M.setConsequenceId(t, ""); touched(); rerender();
            A.focusAfter(kSel(k, '[data-k-field="link-threat"]'));
            A.offerUndo(t.id + " no longer leads to " + k.id + ".", backTo(k.id, kSel(k, '[data-threat-id="' + t.id + '"] [data-action="unlink-path"]')), mk);
          } })])
      ]));
    });
    var tbl = h("table", { class: "tbl compact path-table", "aria-label": "Paths to " + k.id }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Path", style: "width:52px" }), h("th", { text: "Acts in" }), h("th", { text: "Via", class: "path-via" }), h("th", { text: "Threat source" }),
      h("th", { text: "Entry point" }), h("th", { text: "Unmitigated", class: "center", style: "width:96px" }), h("th", { text: "Decision", style: "width:140px" }),
      h("th", { style: "width:58px" }, [h("span", { class: "vh", text: "Actions" })])
    ])]), tb]);
    return h("div", { class: "path-scroll" }, [tbl]);
  }

  // The form for a new path.
  function pathForm(k, p) {
    var st = fresh(), f = st.form, all = owners(p);
    if (!f.owner || !findOwner(p, f.owner)) f.owner = all[0].id;
    var o = findOwner(p, f.owner);
    function text(label, key, field, placeholder) {
      var el = h("input", { type: "text", value: f[key] || "", "data-k-field": field, placeholder: placeholder, onInput: function (e) { f[key] = e.target.value; } });
      return h("div", { class: "field" }, [labelFor(label, el), el]);
    }
    var ownerSel = h("select", { "data-k-field": "path-owner", onChange: function (e) { f.owner = e.target.value; f.assets = []; f.vulns = []; f.via = f.via.filter(function (id) { return id !== f.owner; }); rerender(); } });
    all.forEach(function (x) { var op = h("option", { value: x.id, text: x.id + (x.name ? " " + x.name : "") }); if (x.id === f.owner) op.setAttribute("selected", "selected"); ownerSel.appendChild(op); });
    var assets = E.threatAssets(o, p);
    var kids = [
      h("div", { class: "threat-grid" }, [h("div", { class: "field" }, [labelFor("Acts in", ownerSel), ownerSel]),
        h("div", { class: "field" }, [h("div", { class: "lbl", text: "Via" + (f.via.length ? ": " + E.andList(f.via) : "") }),
          h("div", { class: "chip-row", role: "group", "aria-label": "Via, in order" }, all.filter(function (x) { return x.id !== f.owner; }).map(function (x) {
            return chip(R.RiskPage.ownerChip(x), f.via.indexOf(x.id) >= 0, "pvia-" + x.id, function () { toggleIn(f.via, x.id); rerender(); }, x.name);
          }))])]),
      text("Threat statement", "statement", "path-statement", "e.g. An attacker on the vendor path changes the reactor setpoints."),
      h("div", { class: "threat-grid" }, [text("Threat source", "source", "path-source", "e.g. External attacker"), text("Entry point", "entry", "path-entry", "e.g. Vendor VPN on the DMZ firewall")]),
      h("div", { class: "field" }, [h("div", { class: "lbl", text: "Assets" }), assets.length ? h("div", { class: "chip-row", role: "group", "aria-label": "Assets" }, assets.map(function (a) {
        return chip(a.name || a.id, f.assets.indexOf(a.id) >= 0, "passet-" + a.id, function () { toggleIn(f.assets, a.id); rerender(); });
      })) : h("p", { class: "muted ed-none", text: "No assets recorded in step 3." })]),
      o.vulnerabilities.length ? h("div", { class: "field" }, [h("div", { class: "lbl", text: "Vulnerabilities" }), h("div", { class: "chip-row", role: "group", "aria-label": "Vulnerabilities" }, o.vulnerabilities.map(function (v) {
        return chip(v.id + " " + (v.description || ""), f.vulns.indexOf(v.id) >= 0, "pvuln-" + v.id, function () { toggleIn(f.vulns, v.id); rerender(); });
      }))]) : null,
      h("p", { class: "hint", text: "The impact is copied from the consequence; mark the affected FRs in the scenario." }),
      h("div", { class: "btn-row" }, [
        h("button", { type: "button", class: "btn sm primary", "data-action": "path-add", text: "Add path", onClick: function () {
          var mk = A.undoMark(), t = addPath(k, f);
          if (!t) return;
          st.form = null; touched(); rerender();
          A.focusAfter(kSel(k, '[data-threat-id="' + t.id + '"] [data-action="open-path"]'));
          A.offerUndo(t.id + " added to " + o.id + " as a path to " + k.id + ".", backTo(k.id, kSel(k, '[data-action="add-path"]')), mk);
        } }),
        M.LIBRARY ? h("button", { type: "button", class: "btn sm", "data-action": "path-library", text: "From library", "aria-expanded": st.lib === k.id ? "true" : "false",
          onClick: function () {
            if (st.lib === k.id) { st.lib = null; R.LibraryUI.close(); rerender(); return; }
            st.lib = k.id; R.LibraryUI.open(o.id); rerender(); A.focusAfter('[data-library-picker] [data-field="lib-search"]');
          } }) : null,
        h("button", { type: "button", class: "btn sm", "data-action": "path-cancel", text: "Cancel", onClick: cancel })
      ])
    ];
    function cancel() { st.form = null; st.lib = null; R.LibraryUI.close(); rerender(); A.focusAfter(kSel(k, '[data-action="add-path"]')); }
    if (st.lib === k.id && R.LibraryUI.isOpen(o.id)) {
      kids.push(R.LibraryUI.picker(o, p, {
        // Each scenario chosen becomes a path to this consequence.
        onAdded: function (res) {
          res.threats.forEach(function (t) { makePath(p, k, o, { via: f.via, assets: f.assets, vulns: f.vulns, source: f.source, entry: f.entry }, t); });
          st.form = null; st.lib = null; touched(); rerender();
          if (!res.threats.length) return;
          A.focusAfter(kSel(k, '[data-threat-id="' + res.threats[0].id + '"] [data-action="open-path"]'));
          var n = res.threats.length;
          A.offerUndo(n + " path" + (n === 1 ? "" : "s") + " to " + k.id + " added from the library.", backTo(k.id, kSel(k, '[data-action="add-path"]')), res.mark);
        },
        onClose: function () { st.lib = null; rerender(); A.focusAfter(kSel(k, '[data-action="path-library"]')); }
      }));
    }
    var wrap = h("div", { class: "path-form", "data-path-form": k.id, role: "group", "aria-label": "New path to " + k.id }, kids);
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape" && !e.defaultPrevented && !e.target.closest("[data-library-picker]")) { e.preventDefault(); cancel(); } });
    return wrap;
  }

  // A statement cut at the last space before n characters, with "…".
  function shortText(s, n) {
    s = String(s || "").trim();
    if (s.length <= n) return s;
    var cut = s.slice(0, n), at = cut.lastIndexOf(" ");
    return (at > 0 ? cut.slice(0, at) : cut).replace(/[\s,;:.]+$/, "") + "…";
  }
  // Link an existing threat: every threat not already a path to this one.
  function linkControl(k, p) {
    var rows = [];
    owners(p).forEach(function (o) { o.threats.forEach(function (t) { if (t.consequenceId !== k.id) rows.push({ o: o, t: t }); }); });
    if (!rows.length) return null;
    var sel = h("select", { "data-k-field": "link-threat", "aria-label": "Threat to link to " + k.id });
    sel.appendChild(h("option", { value: "", text: "Link a threat" }));
    rows.forEach(function (r) {
      sel.appendChild(h("option", { value: r.o.id + "/" + r.t.id, text: r.t.id + " (" + r.o.id + ") " + shortText(r.t.statement, 60) + (r.t.consequenceId ? " [leads to " + r.t.consequenceId + "]" : "") }));
    });
    var btn = h("button", { type: "button", class: "btn sm", "data-action": "link-threat", text: "Link", onClick: function () {
      if (!sel.value) { toast("Choose a threat to link."); return; }
      var ids = sel.value.split("/"), o0 = findOwner(state.project, ids[0]);
      var t0 = o0 && o0.threats.filter(function (x) { return x.id === ids[1]; })[0], was = t0 && M.consequenceById(state.project, t0.consequenceId) ? t0.consequenceId : "";
      var mk = A.undoMark(), t = linkThreat(k, ids[0], ids[1]);
      if (!t) return;
      touched(); rerender();
      A.focusAfter(kSel(k, '[data-threat-id="' + t.id + '"] [data-action="open-path"]'));
      A.offerUndo(t.id + " now leads to " + k.id + (was && was !== k.id ? ", not " + was : "") + ".", backTo(k.id, kSel(k, '[data-k-field="link-threat"]')), mk);
    } });
    return h("span", { class: "inline-add" }, [sel, btn]);
  }

  // The consequence itself, on the right: read, or edited in place.
  // The offer to update the paths, drawn only while it fits the project
  // (liveOffer); said politely to a screen reader as it appears.
  function offerPanel(k, p, extraCls) {
    var st = fresh(), lo = liveOffer(p, k);
    if (!lo) return null;
    var ids = lo.paths.map(function (x) { return x.t.id; });
    return h("div", { class: "k-offer" + (extraCls ? " " + extraCls : ""), role: "group", "aria-label": "Update the paths" }, [
      h("span", { role: "status", "aria-live": "polite", "data-offer-text": "", text: E.andList(ids) + (ids.length === 1 ? " is" : " are") + " still rated " + E.impactName(lo.off.from, p) + "." }),
      h("button", { type: "button", class: "btn sm", "data-action": "offer-update", text: "Update to " + E.impactName(lo.off.to, p), onClick: function () { applyOffer(p, k); } }),
      h("button", { type: "button", class: "btn sm", "data-action": "offer-leave", text: "Leave as they are", onClick: function () { st.offer = null; rerender(); A.focusAfter(kSel(k, '[data-action="edit-consequence"]')); } })
    ]);
  }
  // The card's heading, "K1 Loss of containment", kept as the title is typed.
  function cardTitle(k) { return k.id + (k.title ? " " + k.title : ""); }
  function consequencePanel(k, p) {
    var st = fresh(), crit = M.criteriaOf(p), cats = E.categoryRatings(k.impactByCategory, p);
    // The card's heading names the consequence; the title line shows only
    // while it is edited.
    var titleEl = st.edit[k.id] ? h("div", { class: "k-title", text: k.id + "  " + (k.title || "No title yet") }) : null;
    var kids = [titleEl,
      h("div", { class: "k-line" }, [h("strong", { text: "Impact: " }), E.impactName(k.impact, p) || "Not rated"]),
      cats.length ? h("div", { class: "k-line muted", text: cats.map(function (r) { return r.name + ": " + r.levelName; }).join("; ") }) : null,
      k.source ? h("div", { class: "k-line muted", text: "Source: " + k.source }) : null,
      (k.hlaIds || []).length ? h("div", { class: "k-line muted", text: "Ranked systems: " + k.hlaIds.map(function (id) { var a = E.hlaById(p, id); return id + (a && a.name ? " " + a.name : ""); }).join("; ") }) : null,
      k.description && !st.edit[k.id] ? h("div", { class: "k-line", text: k.description }) : null
    ];
    // Not editing: the offer (if one waits) follows the impact lines.
    if (!st.edit[k.id]) kids.push(offerPanel(k, p));
    if (st.edit[k.id]) {
      // Where the paths stand against it, taken once per editing.
      if (!st.snap[k.id]) st.snap[k.id] = snapOf(k);
      var title = h("input", { type: "text", value: k.title, "data-k-field": "title", placeholder: "e.g. Loss of containment from an unsafe process state",
        onInput: function (e) {
          k.title = e.target.value;
          if (titleEl) titleEl.textContent = k.id + "  " + (k.title || "No title yet");
          var head = title.closest("[data-consequence-id]"), h2 = head && head.querySelector(".card-h h2");
          if (h2) h2.textContent = cardTitle(k);
          R.RiskPage.edited();
        } });
      var desc = h("textarea", { rows: "2", value: k.description, "data-k-field": "description", onInput: function (e) { k.description = e.target.value; R.RiskPage.edited(); } });
      var impact;
      if (cats.length) impact = h("div", { class: "field" }, [h("div", { class: "lbl", text: "Impact" }), h("div", { class: "derived", "data-derived": "k-impact" }, [h("strong", { text: E.impactName(k.impact, p) || "Not rated" }), h("span", { class: "muted", text: " worst category" })])]);
      else {
        var isel = h("select", { "data-k-field": "impact", onChange: function (e) { var from = k.impact, fromMap = catMap(k.impactByCategory) ? clone(k.impactByCategory) : null; k.impact = e.target.value; impactChanged(p, k, from, fromMap); touched(); rerender(); } });
        isel.appendChild(h("option", { value: "", text: "Not rated" }));
        crit.impact.forEach(function (l) { var op = h("option", { value: l.id, text: l.name }); if (k.impact === l.id) op.setAttribute("selected", "selected"); isel.appendChild(op); });
        impact = h("div", { class: "field" }, [labelFor("Impact", isel), isel]);
      }
      var catGrid = h("div", { class: "cat-grid wide" }, crit.categories.map(function (c) {
        var s = h("select", { "data-k-field": "kcat-" + c.id, "aria-label": c.name + " impact", onChange: function (e) {
          var from = k.impact, fromMap = catMap(k.impactByCategory) ? clone(k.impactByCategory) : null;
          E.setCategoryRating(k, "impact", "impactByCategory", c.id, e.target.value, p); impactChanged(p, k, from, fromMap); touched(); rerender();
        } });
        s.appendChild(h("option", { value: "", text: "Not rated" }));
        var cur = k.impactByCategory && k.impactByCategory[c.id];
        crit.impact.forEach(function (l) { var op = h("option", { value: l.id, text: l.name }); if (cur === l.id) op.setAttribute("selected", "selected"); s.appendChild(op); });
        return h("label", { class: "cat-line" }, [h("span", { text: c.name }), s]);
      }));
      var listId = "k-src-" + k.id;
      var src = h("input", { type: "text", list: listId, value: k.source, "data-k-field": "source", placeholder: "e.g. HAZOP node 12, a PHA, a business impact analysis",
        onInput: function (e) { k.source = e.target.value; R.RiskPage.edited(); } });
      var notes = h("textarea", { rows: "2", value: k.notes, "data-k-field": "notes", onInput: function (e) { k.notes = e.target.value; R.RiskPage.edited(); } });
      var hlas = p.srs.highLevelAssets.filter(function (a) { return a && a.id; });
      kids.push(h("div", { class: "k-form" }, [
        h("div", { class: "field wide" }, [labelFor("Title", title), title]),
        h("div", { class: "field wide" }, [labelFor("Description", desc), desc]),
        impact,
        h("div", { class: "field" }, [labelFor("Source", src), src, h("datalist", { id: listId }, M.CONSEQUENCE_SOURCES.concat(["PHA"]).map(function (x) { return h("option", { value: x }); }))]),
        h("div", { class: "field wide" }, [h("div", { class: "lbl", text: "Impact by category" }), catGrid]),
        // The offer, right after the impact controls that raised it.
        offerPanel(k, p, "wide"),
        hlas.length ? h("div", { class: "field wide" }, [h("div", { class: "lbl", text: "Ranked systems" }), h("div", { class: "chip-row", role: "group", "aria-label": "Ranked systems" }, hlas.map(function (a) {
          var on = (k.hlaIds || []).indexOf(a.id) >= 0;
          return chip(a.id + (a.name ? " " + a.name : ""), on, "khla-" + a.id, function () { if (!Array.isArray(k.hlaIds)) k.hlaIds = []; toggleIn(k.hlaIds, a.id); touched(); rerender(); });
        }))]) : null,
        h("div", { class: "field wide" }, [labelFor("Notes", notes), notes])
      ]));
    }
    kids.push(h("div", { class: "btn-row", style: "margin-top:6px" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "edit-consequence", "aria-expanded": st.edit[k.id] ? "true" : "false", text: st.edit[k.id] ? "Done" : "Edit",
        "aria-label": (st.edit[k.id] ? "Done editing " : "Edit ") + k.id,
        onClick: function () { st.edit[k.id] = !st.edit[k.id]; delete st.snap[k.id]; rerender(); A.focusAfter(kSel(k, st.edit[k.id] ? '[data-k-field="title"]' : '[data-action="edit-consequence"]')); } }),
      h("button", { type: "button", class: "btn sm danger", "data-action": "remove-consequence", text: "Remove", "aria-label": "Remove " + k.id, onClick: function () { removeConsequence(p, k); } })
    ]));
    return h("div", { class: "bowtie-k" }, kids);
  }

  function consequenceCard(k, p, vm, open) {
    var st = fresh(), hasOwners = owners(p).length > 0;
    var left = [pathRows(k, p, vm, open),
      h("div", { class: "btn-row", style: "margin-top:8px" }, [
        h("button", { type: "button", class: "btn sm", "data-action": "add-path", text: "+ Add path", disabled: hasOwners ? null : "disabled",
          "aria-expanded": st.form && st.form.k === k.id ? "true" : "false",
          onClick: function () {
            st.form = { k: k.id, owner: "", via: [], statement: "", source: "", entry: "", assets: [], vulns: [] }; st.lib = null; R.LibraryUI.close();
            rerender(); A.focusAfter(kSel(k, '[data-k-field="path-owner"]'));
          } }),
        linkControl(k, p)
      ]),
      hasOwners ? null : h("p", { class: "hint", text: "Define zones in step 3 to add a path." }),
      st.form && st.form.k === k.id && hasOwners ? pathForm(k, p) : null
    ];
    var n = vm.threats.filter(function (x) { return x.consequence === k; }).length;
    return card(cardTitle(k), n + " path" + (n === 1 ? "" : "s"), [
      h("div", { class: "bowtie" }, [h("div", { class: "bowtie-paths" }, left), consequencePanel(k, p)])
    ], null, { "data-consequence-id": k.id, class: "card k-card" });
  }

  function render(main, p, vm, open) {
    var st = fresh(), ks = M.consequencesOf(p);
    main.appendChild(h("div", { class: "btn-row no-print", style: "margin-bottom:10px" }, [
      h("button", { type: "button", class: "btn primary", "data-action": "add-consequence", text: "+ Add consequence", onClick: function () {
        var k = newConsequence(p); st.edit[k.id] = true; touched(); rerender();
        A.focusAfter(kSel(k, '[data-k-field="title"]'));
      } }),
      h("span", { class: "hint", text: "Start from what can happen, then add the paths that lead to it." })
    ]));
    if (!ks.length) main.appendChild(card("Consequences", null, [h("p", { class: "muted", text: "No consequences yet." })], null, { "data-view": "consequence" }));
    ks.forEach(function (k) { main.appendChild(consequenceCard(k, p, vm, open)); });
    if (st.reveal) {
      var el = main.querySelector('[data-consequence-id="' + st.reveal + '"]');
      st.reveal = null;
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }
  }

  R.ConsequenceUI = { render: render, reveal: reveal, startFrom: startFrom, addPath: addPath, linkThreat: linkThreat, comeBack: comeBack, leave: leave, state: function () { return fresh(); } };
}());
