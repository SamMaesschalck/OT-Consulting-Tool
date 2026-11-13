/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-risk.js — step 5, Detailed risk: the zone workshop and its three views.
 *
 * Tabs: By zone (risk), Register and Heat map (views of the risk page) and
 * SL-T grid (slt). By zone has a rail of the zones and conduits (scenario
 * count, worst unmitigated risk, n open, Not required from step 4) and one
 * of them at a time: its SL-T strip (Use suggestion, Accept all suggested,
 * Copy from, the Why trace and the justification), its scenario table with
 * one editor open, and its vulnerabilities and countermeasures. The editor
 * follows the order of the work: the scenario, the unmitigated rating with
 * its likelihood rationale, the existing countermeasures and the current
 * rating, the treatment decision, then the additional countermeasures with
 * their plan and the planned rating.
 *
 * Text typed into a field updates the model and the facts shown beside it in
 * place (live()), never redrawing the page, so the keyboard stays in the
 * field and a click straight after typing lands. Choices (a select, a chip,
 * a button) redraw the page, which keeps the focus (js/app.js).
 * Every per-threat fact comes from js/view-model.js and js/engine.js.
 * Add from library (js/ui-library.js) adds house scenarios as unrated
 * drafts; the floor box on a safety zone's strip and the SL-T grid narrows
 * the safety floor for the project; a remove, Move, Copy to or bulk accept
 * offers Undo in its toast (js/app.js offerUndo).
 * RiskApp.RiskPage.select(ownerId, threatId) opens a zone or conduit and a
 * scenario; Go to (js/app.js) and the peer review (js/review.js) use it.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var RULES = M.RULES, FRS = M.FRS, FR_IDS = M.FR_IDS, SEV = M.SEV, LIK = M.LIK, BANDS = M.BANDS, SIS_RULE = M.SIS_RULE, BAND_NAME = M.BAND_NAME;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, card = U.card, toast = U.toast, riskPill = U.riskPill, pageSub = U.pageSub, confirmRemove = U.confirmRemove, labelFor = U.labelFor;

  // What the page shows, kept across redraws (not saved).
  var ui = {
    sel: null,            // the zone or conduit open in By zone
    open: {},             // owner id -> the scenario whose editor is open
    view: "zone",         // "zone" | "register" | "heatmap"
    heat: "unmitigated",  // the heat map's state: "unmitigated" | "current" | "planned"
    filter: { owner: "", band: "", decision: "", open: false, cell: null },
    scalesOpen: false,
    sec: {},              // "vuln:Z1" / "cm:Z1" -> the zone's section is open
    why: {},              // owner id -> the SL-T strip's Why is open
    move: {},             // "Z1/T1" -> a scenario's Copy or move is open
    railScroll: 0,        // the rail's scroll position
    reveal: false,        // bring the selected rail item into view on the next draw
    forProject: null
  };
  function project() { return state.project; }
  // A page state belongs to the project it was set for.
  function fresh() {
    if (ui.forProject !== project()) {
      ui.forProject = project(); ui.sel = null; ui.selObj = null; ui.open = {}; ui.view = "zone"; ui.heat = "unmitigated";
      ui.filter = { owner: "", band: "", decision: "", open: false, cell: null };
      ui.sec = {}; ui.why = {}; ui.move = {}; ui.railScroll = 0; ui.reveal = false; ui.scalesOpen = false;
    }
  }
  // A <details> whose open state is kept in ui[bag][key] across redraws
  // (dflt when nothing is kept yet).
  function keptDetails(attrs, kids, bag, key, dflt) {
    var d = h("details", attrs, kids);
    var on = ui[bag][key] != null ? ui[bag][key] : !!dflt;
    if (on) d.setAttribute("open", "");
    d.addEventListener("toggle", function () { if (d.isConnected) ui[bag][key] = d.open; });
    return d;
  }

  function owners(p) { return p.zones.concat(p.conduits); }
  function findOwner(p, id) { var all = owners(p); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
  function isConduit(o) { return "fromZone" in o; }
  function ownerLabel(o) {
    return o.id + (o.name ? ": " + o.name : "") + (isConduit(o) ? " (" + (o.fromZone || "not set") + " ↔ " + (o.toZone === "EXT" ? "external" : (o.toZone || "not set")) + ")" : "");
  }
  function opts(arr) { return arr.map(function (x) { return { value: x.id, text: x.name }; }); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // ---------- In-place updates ----------
  // Each function here refreshes one fact shown on the page from a fresh view
  // model. Typing calls them instead of redrawing. Reset on every draw.
  var lives = [];
  function live(fn) { lives.push(fn); return fn; }
  function refresh() {
    var p = project(), vm = R.ViewModel.build(p), open = openMap(p);
    lives.forEach(function (fn) { try { fn(vm, open); } catch (e) { /* an element from an older draw */ } });
    A.refreshNav();
  }
  function edited() { touched(); refresh(); }
  function rowOf(vm, ownerId, threatId) {
    for (var i = 0; i < vm.threats.length; i++) { var x = vm.threats[i]; if (x.owner.id === ownerId && x.t.id === threatId) return x; }
    return null;
  }
  function ownerRowOf(vm, id) { for (var i = 0; i < vm.owners.length; i++) if (vm.owners[i].o.id === id) return vm.owners[i]; return null; }

  // What is open, per zone or conduit and per scenario, from the one completeness list.
  function openMap(p) {
    var out = { owner: {}, threat: {} };
    E.completeness(p).forEach(function (i) {
      var t = i.target || {};
      if (i.stage !== "risk" && i.stage !== "slt") return;
      var oid = t.kind === "threat" ? t.ownerId : (t.kind === "zone" || t.kind === "conduit" ? t.id : null);
      if (!oid) return;
      out.owner[oid] = (out.owner[oid] || 0) + 1;
      if (t.kind === "threat") { var k = oid + "/" + t.id; out.threat[k] = (out.threat[k] || 0) + 1; }
    });
    return out;
  }

  // ---------- Small builders ----------

  // A text field edited in place. attrs: extra attributes on the control.
  function liveText(label, value, onValue, o) {
    o = o || {};
    var el = h(o.textarea ? "textarea" : "input", Object.assign({ value: value || "", onInput: function (e) { onValue(e.target.value); edited(); } }, o.textarea ? {} : { type: o.type || "text" }, o.attrs || {}));
    if (o.placeholder) el.setAttribute("placeholder", o.placeholder);
    if (o.rows) el.setAttribute("rows", String(o.rows));
    return h("div", { class: "field" + (o.cls ? " " + o.cls : "") }, [labelFor(label, el), el].concat(o.hint ? [h("div", { class: "hint", text: o.hint })] : []));
  }
  // A select that redraws (a rating changes what is shown).
  function pick(label, value, options, onValue, o) {
    o = o || {};
    var sel = h("select", Object.assign({ onChange: function (e) { onValue(e.target.value); touched(); rerender(); } }, o.attrs || {}));
    sel.appendChild(h("option", { value: "", text: o.empty || "Not set" }));
    options.forEach(function (x) { var op = h("option", { value: x.value, text: x.text }); if (String(value) === String(x.value)) op.setAttribute("selected", "selected"); sel.appendChild(op); });
    return h("div", { class: "field" + (o.cls ? " " + o.cls : "") }, [labelFor(label, sel), sel].concat(o.hint ? [h("div", { class: "hint", text: o.hint })] : []));
  }
  // A toggle chip (a real button, so the keyboard reaches it).
  function chip(text, on, key, onClick, o) {
    o = o || {};
    return h("button", { type: "button", class: "chip-btn" + (on ? " on" : "") + (o.cls ? " " + o.cls : ""), "aria-pressed": on ? "true" : "false",
      "data-chip": key, title: o.title || null, text: (on ? "✓ " : "") + text, onClick: onClick });
  }
  function toggleIn(arr, id) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); }
  function section(title, kids, attrs) {
    return h("div", Object.assign({ class: "ed-section" }, attrs || {}), [h("h3", { class: "ed-h", text: title })].concat(kids));
  }
  // exceeds: the rating is above tolerable risk, as the engine compares it
  // (per consequence category where the criteria set one per category).
  function ratingLine(label, band, exceeds, cls) {
    return h("div", { class: "rating-line" + (cls ? " " + cls : "") }, [
      h("strong", { text: label + ": " }), riskPill(band),
      band ? h("span", { class: exceeds ? "val-warn" : "muted", text: exceeds ? "  above tolerable risk" : "  within tolerable risk" }) : h("span", { class: "muted", text: "  not rated" })
    ]);
  }

  // ---------- The scales ----------

  // Every definition of the project's risk criteria (js/model.js criteriaOf).
  function scalesPop(p) {
    var crit = M.criteriaOf(p);
    function list(title, arr) {
      return h("div", null, [h("strong", { text: title }), h("ul", { class: "scale-list" }, arr.map(function (x) {
        return h("li", null, [h("span", { class: "scale-name", text: x.name + ": " }), cap(String(x.note || "").replace(/^House default:\s*/i, ""))]);
      }))]);
    }
    var byCat = E.tolerableByCategoryWords(p);
    var d = h("details", { class: "scales-pop no-print", "data-scales": "" }, [
      h("summary", { text: "Scales" }),
      h("div", { class: "scales-pop-body" }, [list("Impact", crit.impact), list("Likelihood", crit.likelihood),
        byCat ? h("p", { class: "hint", text: "Tolerable risk by category: " + byCat + "." }) : null,
        h("p", { class: "hint", text: "Unmitigated likelihood counts no countermeasure, existing ones included." })])
    ]);
    if (ui.scalesOpen) d.setAttribute("open", "");
    d.addEventListener("toggle", function () { if (d.isConnected) ui.scalesOpen = d.open; });
    // Escape closes it, back on its summary; so does the keyboard leaving it.
    d.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !d.open) return;
      e.preventDefault(); closeScales(d);
      var s = d.querySelector("summary"); if (s) s.focus();
    });
    d.addEventListener("focusout", function (e) {
      if (d.open && e.relatedTarget && !d.contains(e.relatedTarget)) closeScales(d);
    });
    return d;
  }
  function closeScales(d) { d.open = false; d.removeAttribute("open"); ui.scalesOpen = false; }
  // A click anywhere outside the open Scales closes it (it would otherwise
  // cover the Decision column through an edit and the redraw after it).
  document.addEventListener("click", function (e) {
    var d = document.querySelector("#main .scales-pop[open]");
    if (d && !d.contains(e.target)) closeScales(d);
  }, true);

  // ---------- The treatment decision ----------

  var TREATMENT_CHOICES = [
    { id: "reduce", text: "Reduce with countermeasures" },
    { id: "accept", text: "Accept" },
    { id: "slt", text: "Treat through the SL-T" }
  ];
  function setTreatment(t, decision) {
    if (!t.treatment) t.treatment = M.emptyTreatment();
    // Clicking the confirmed choice again takes the decision back.
    if (t.treatment.decision === decision && t.treatment.confirmed) { t.treatment.decision = null; t.treatment.confirmed = false; }
    else { t.treatment.decision = decision; t.treatment.confirmed = true; }
  }
  function statusText(T) {
    if (T.state === "none") return { text: "No decision yet.", warn: true };
    if (T.state === "suggested") return { text: "Suggested, not confirmed.", warn: false };
    if (T.gap) return { text: cap(T.gap) + ".", warn: true };
    if (T.decision === "reduce") return { text: "Addressed by " + T.covering.map(function (m) { return m.id; }).join(", ") + "." + (T.residual && !T.residualWithin ? " Planned risk is still above tolerable risk." : ""), warn: false };
    return { text: "", warn: false };
  }
  // x: the scenario's row in the view model.
  function treatmentChoice(x) {
    var t = x.t, T = x.treatment, o = x.owner;
    var st = statusText(T);
    var status = h("span", { class: "treat-status" + (st.warn ? " val-warn" : (T.state === "confirmed" && !T.gap ? " muted" : "")), "data-live": "treat-status", text: st.text });
    var box = h("div", { class: "treat", "data-treatment-state": T.state });
    live(function (vm) {
      var y = rowOf(vm, o.id, t.id); if (!y) return;
      var s = statusText(y.treatment);
      status.textContent = s.text;
      status.className = "treat-status" + (s.warn ? " val-warn" : (y.treatment.state === "confirmed" && !y.treatment.gap ? " muted" : ""));
      box.setAttribute("data-treatment-state", y.treatment.state);
    });
    var sltWhy = [];
    if (T.sltUnset.length) sltWhy.push("no SL-T is set" + (t.affectedFR.length ? " (" + T.sltUnset.join(", ") + ")" : ""));
    if (T.sltBelow.length) sltWhy.push("the SL-T is below the suggestion (" + T.sltBelow.join(", ") + ")");
    box.appendChild(h("div", { class: "treat-row" }, [
      h("div", { class: "treat-opts", role: "group", "aria-label": "Treatment decision" }, TREATMENT_CHOICES.map(function (c) {
        var on = T.decision === c.id;
        return h("button", {
          type: "button", "data-decision": c.id,
          class: "treat-opt" + (on ? (T.confirmed ? " on" : " suggested") : ""),
          "aria-pressed": on && T.confirmed ? "true" : "false",
          text: (on ? (T.confirmed ? "✓ " : "? ") : "") + c.text,
          onClick: function () { setTreatment(t, c.id); touched(); rerender(); }
        });
      })),
      status
    ]));
    if (T.decision === "accept" || (t.acceptance || "").trim()) {
      if (!t.acceptanceDetail || typeof t.acceptanceDetail !== "object") t.acceptanceDetail = M.emptyAcceptanceDetail();
      var ad = t.acceptanceDetail;
      var rIn = h("input", { type: "text", "data-reason": "accept", value: t.acceptance, placeholder: "e.g. Production constraint until the Q2 turnaround; compensating procedure in place.",
        onInput: function (e) { t.acceptance = e.target.value; edited(); } });
      box.appendChild(h("div", { class: "field", style: "margin:8px 0 0" }, [labelFor("Reason for acceptance", rIn), rIn]));
      box.appendChild(h("div", { class: "grid-4 acc-detail" }, [
        liveText("Accepted by", ad.by, function (v) { ad.by = v; }, { attrs: { "data-field": "acc-by" } }),
        liveText("Role", ad.role, function (v) { ad.role = v; }, { attrs: { "data-field": "acc-role" } }),
        liveText("Date", ad.date, function (v) { ad.date = v; }, { type: "date", attrs: { "data-field": "acc-date" } }),
        liveText("Review date", ad.reviewDate, function (v) { ad.reviewDate = v; }, { type: "date", attrs: { "data-field": "acc-review" } })
      ]));
    }
    if (T.decision === "slt" && (T.sltShortfall.length || T.reason)) {
      var sIn = h("input", { type: "text", "data-reason": "slt", value: t.treatment.reason, placeholder: "e.g. Raised in phase 2 of the programme, agreed with the asset owner.",
        onInput: function (e) { t.treatment.reason = e.target.value; edited(); } });
      box.appendChild(h("div", { class: "field", style: "margin:8px 0 0" }, [
        labelFor(sltWhy.length ? "Reason " + sltWhy.join(" and ") : "Reason for treating through the SL-T", sIn), sIn
      ]));
    }
    return box;
  }

  // ---------- Countermeasures in the editor ----------

  function newCountermeasure(p, o, existing) {
    p.counters.cm += 1;
    var m = M.emptyCountermeasure(p.counters.cm);
    m.existing = !!existing;
    o.countermeasures.push(m);
    return m;
  }
  // A linked countermeasure's row: its description, and for an additional
  // one its plan (owner, priority, due date, status).
  function cmRow(o, t, m, plan) {
    var kids = [
      h("span", { class: "tid", text: m.id }),
      (function () {
        var d = h("input", { type: "text", value: m.description, "data-cm-field": m.id + "-description", "aria-label": "Countermeasure " + m.id,
          placeholder: plan ? "e.g. Broker vendor access via a DMZ jump host." : "e.g. MFA on the vendor VPN.",
          onInput: function (e) { m.description = e.target.value; edited(); } });
        return h("div", { class: "cm-desc" }, [d]);
      }())
    ];
    if (plan) {
      kids.push(h("div", { class: "cm-plan" }, [
        liveText("Owner", m.owner, function (v) { m.owner = v; }, { attrs: { "data-cm-field": m.id + "-owner" } }),
        pick("Priority", m.priority, M.CM_PRIORITIES.map(function (k) { return { value: k, text: M.CM_PRIORITY_LABEL[k] }; }), function (v) { m.priority = v; }, { attrs: { "data-cm-field": m.id + "-priority" } }),
        liveText("Due date", m.dueDate, function (v) { m.dueDate = v; }, { type: "date", attrs: { "data-cm-field": m.id + "-due" } }),
        pick("Status", m.status, M.CM_STATUSES.map(function (k) { return { value: k, text: M.CM_STATUS_LABEL[k] }; }), function (v) { m.status = v; }, { attrs: { "data-cm-field": m.id + "-status" } })
      ]));
    }
    kids.push(h("button", { type: "button", class: "btn sm", "data-action": "unlink-" + m.id, text: "Unlink", "aria-label": "Unlink " + m.id + " from " + t.id,
      onClick: function () {
        toggleIn(t.countermeasureIds, m.id); touched(); rerender();
        // The keyboard goes to the chip that links it again.
        A.focusAfter('[data-threat-id="' + t.id + '"] [data-chip="cm-' + m.id + '"]');
      } }));
    return h("div", { class: "cm-row" + (plan ? " planned" : ""), "data-cm-id": m.id }, kids);
  }
  // The linked countermeasures of one kind, the others to link, and New.
  function cmPicker(o, t, existing, T) {
    var p = project();
    if (!Array.isArray(t.countermeasureIds)) t.countermeasureIds = [];
    var mine = o.countermeasures.filter(function (m) { return !!m.existing === existing; });
    var linked = mine.filter(function (m) { return t.countermeasureIds.indexOf(m.id) >= 0; });
    var others = mine.filter(function (m) { return t.countermeasureIds.indexOf(m.id) < 0; });
    var match = E.suggestLinks(o, t), waiting = T.linkSuggested.map(function (m) { return m.id; });
    var kids = linked.map(function (m) { return cmRow(o, t, m, !existing); });
    if (others.length) {
      kids.push(h("div", { class: "chip-row", role: "group", "aria-label": existing ? "Link an existing countermeasure" : "Link an additional countermeasure" }, others.map(function (m) {
        var sug = waiting.indexOf(m.id) >= 0;
        return chip("+ " + m.id + " " + (m.description || "(no description)"), false, "cm-" + m.id, function () {
          toggleIn(t.countermeasureIds, m.id); touched(); rerender();
          // The keyboard goes to the linked row's Unlink.
          A.focusAfter('[data-threat-id="' + t.id + '"] [data-action="unlink-' + m.id + '"]');
        },
          { cls: sug ? "suggested" : (match.indexOf(m.id) >= 0 ? "matches" : ""), title: sug ? "Suggested link, not confirmed" : (match.indexOf(m.id) >= 0 ? "On a requirement this threat affects" : null) });
      })));
    }
    kids.push(h("div", { class: "btn-row" }, [
      h("button", { type: "button", class: "btn sm", "data-action": existing ? "new-existing" : "new-planned", text: existing ? "+ New existing countermeasure" : "+ New countermeasure",
        onClick: function () {
          var m = newCountermeasure(p, o, existing); t.countermeasureIds.push(m.id); touched(); rerender();
          A.focusAfter('[data-cm-field="' + m.id + '-description"]');
        } })
    ]));
    if (!linked.length && !others.length) kids.unshift(h("p", { class: "muted ed-none", text: existing ? "None recorded for this " + (isConduit(o) ? "conduit." : "zone.") : "None planned yet." }));
    return kids;
  }

  // ---------- The scenario editor ----------

  // A threat made in memory (a test, an older caller) may lack the 0.3 lists.
  function ensureLists(t) {
    M.THREAT_LINK_FIELDS.forEach(function (k) { if (!Array.isArray(t[k])) t[k] = []; });
    if (!Array.isArray(t.affectedFR)) t.affectedFR = [];
  }
  function scenarioEditor(x, p, tol) {
    var o = x.owner, t = x.t, T = x.treatment;
    ensureLists(t);
    var assets = E.threatAssets(o, p);
    var linkedExisting = o.countermeasures.filter(function (m) { return m.existing && t.countermeasureIds.indexOf(m.id) >= 0; });
    var showCurrent = linkedExisting.length > 0 || !!(t.currentLikelihood || t.currentImpact);
    var showPlanned = x.exceeds || !!(t.residualLikelihood || t.residualImpact) || T.plannedLinked.length > 0;
    var ed = h("div", { class: "threat-card scen-editor" });

    // 1. The scenario. The levels are the project's risk criteria.
    var crit = M.criteriaOf(p);
    var sev = opts(crit.impact), lik = opts(crit.likelihood);
    var vulnIn = h("input", { type: "text", "data-field": "new-vuln", "aria-label": "New vulnerability", placeholder: "Add a vulnerability" });
    function addVuln() {
      var text = vulnIn.value.trim(); if (!text) { vulnIn.focus(); return; }
      p.counters.vuln += 1; var v = M.emptyVulnerability(p.counters.vuln); v.description = text; o.vulnerabilities.push(v);
      t.vulnerabilityIds.push(v.id); touched(); rerender(); A.focusAfter('[data-threat-id="' + t.id + '"] [data-field="new-vuln"]');
    }
    // Enter adds it, as the Add button does.
    vulnIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addVuln(); } });
    ed.appendChild(section("Scenario", [
      liveText("Threat statement", t.statement, function (v) { t.statement = v; }, { textarea: true, rows: 2, attrs: { "data-field": "statement" },
        placeholder: "e.g. An external attacker reuses the standing vendor VPN to reach the PLCs and manipulate control." }),
      h("div", { class: "threat-grid" }, [
        liveText("Threat source", t.source, function (v) { t.source = v; }, { attrs: { "data-field": "source" }, placeholder: "e.g. External attacker" }),
        liveText("Entry point", t.entryPoint, function (v) { t.entryPoint = v; }, { attrs: { "data-field": "entryPoint" }, placeholder: "e.g. Vendor VPN on the DMZ firewall" })
      ]),
      h("div", { class: "field" }, [h("div", { class: "lbl", text: "Assets" }),
        assets.length ? h("div", { class: "chip-row", role: "group", "aria-label": "Assets" }, assets.map(function (a) {
          return chip(a.name || a.id, t.assetIds.indexOf(a.id) >= 0, "asset-" + a.id, function () { toggleIn(t.assetIds, a.id); touched(); rerender(); }, { title: isConduit(o) ? a.zoneId : null });
        })) : h("p", { class: "muted ed-none", text: "No assets recorded in step 3." })]),
      h("div", { class: "field" }, [h("div", { class: "lbl", text: "Vulnerabilities" }),
        o.vulnerabilities.length ? h("div", { class: "chip-row", role: "group", "aria-label": "Vulnerabilities" }, o.vulnerabilities.map(function (v) {
          return chip(v.id + " " + (v.description || "(no description)"), t.vulnerabilityIds.indexOf(v.id) >= 0, "vuln-" + v.id, function () { toggleIn(t.vulnerabilityIds, v.id); touched(); rerender(); });
        })) : null,
        h("div", { class: "inline-add" }, [vulnIn, h("button", { type: "button", class: "btn sm", "data-action": "add-vuln", text: "Add", onClick: addVuln })])]),
      liveText("Consequence", t.consequence, function (v) { t.consequence = v; }, { attrs: { "data-field": "consequence" }, placeholder: "e.g. Loss of containment; unit trip" }),
      h("div", { class: "field" }, [h("div", { class: "lbl", text: "Affected foundational requirements" }),
        h("div", { class: "chip-row", role: "group", "aria-label": "Affected foundational requirements" }, FRS.map(function (f) {
          return chip(f.id, t.affectedFR.indexOf(f.id) >= 0, "fr-" + f.id, function () { toggleIn(t.affectedFR, f.id); touched(); rerender(); }, { title: f.fr + ": " + f.name });
        }))])
    ]));

    // 2. The unmitigated rating. The impact is one level, or one per
    // consequence category (By category), when it is the worst of them.
    var cats = x.categories || [];
    var impactField = cats.length
      ? h("div", { class: "field" }, [h("div", { class: "lbl", text: "Impact of the worst credible consequence" }),
        h("div", { class: "derived", "data-derived": "impact" }, [h("strong", { text: E.impactName(t.impact, p) || "Not rated" }), h("span", { class: "muted", text: " worst category" })])])
      : pick("Impact of the worst credible consequence", t.impact, sev, function (v) { t.impact = v; }, { attrs: { "data-field": "impact" } });
    var catKids = [h("summary", { text: "Impact by category" + (cats.length ? " (" + cats.length + ")" : "") })];
    catKids.push(h("div", { class: "cat-grid" }, crit.categories.map(function (c) {
      var cur = t.impactByCategory && t.impactByCategory[c.id];
      var s = h("select", { "data-field": "impact-cat-" + c.id, "aria-label": c.name + " impact", onChange: function (e) {
        E.setCategoryRating(t, "impact", "impactByCategory", c.id, e.target.value, p); touched(); rerender();
      } });
      s.appendChild(h("option", { value: "", text: "Not rated" }));
      crit.impact.forEach(function (l) { var op = h("option", { value: l.id, text: l.name }); if (cur === l.id) op.setAttribute("selected", "selected"); s.appendChild(op); });
      return h("label", { class: "cat-line" }, [h("span", { text: c.name + (c.tolerable ? " (tolerable " + BAND_NAME[c.tolerable].toLowerCase() + ")" : "") }), s]);
    })));
    var catBox = keptDetails({ class: "owner-sec cat-sec", "data-part": "impact-categories" }, catKids, "sec", "cat:" + o.id + "/" + t.id, cats.length > 0);
    ed.appendChild(section("Unmitigated risk", [
      h("div", { class: "threat-grid" }, [
        pick("Unmitigated likelihood", t.likelihood, lik, function (v) { t.likelihood = v; }, { attrs: { "data-field": "likelihood" }, hint: "Before any countermeasure, existing ones included." }),
        impactField
      ]),
      catBox,
      liveText("Likelihood rationale", t.likelihoodRationale, function (v) { t.likelihoodRationale = v; }, { attrs: { "data-field": "likelihoodRationale" },
        placeholder: "One line: why this likelihood." }),
      h("div", { class: "rating-line" }, [h("strong", { text: "Unmitigated risk: " }), riskPill(x.risk),
        x.risk ? h("span", { class: "muted", text: "  = impact × likelihood" + (x.exceeds ? ", above tolerable risk" : "") }) : h("span", { class: "muted", text: "  (set likelihood and impact)" })])
    ]));

    // 3. Existing countermeasures and the current rating.
    var ex = [];
    ex = ex.concat(cmPicker(o, t, true, T));
    if (T.linkSuggested.length) {
      ex.push(h("div", { class: "hint link-sug" }, [
        h("span", { text: "Suggested links from an earlier file: " + T.linkSuggested.map(function (m) { return m.id; }).join(", ") + "." }),
        h("button", { type: "button", class: "btn sm", style: "margin-left:8px", "data-action": "confirm-links-" + t.id, text: "Confirm", onClick: function () {
          E.confirmLinkSuggestions(o, t); touched(); rerender();
        } })
      ]));
    }
    if (showCurrent) {
      ex.push(h("div", { class: "threat-grid", "data-part": "current" }, [
        pick("Current likelihood", t.currentLikelihood, lik, function (v) { t.currentLikelihood = v; }, { empty: "Unchanged", attrs: { "data-field": "currentLikelihood" } }),
        pick("Current impact", t.currentImpact, sev, function (v) { t.currentImpact = v; }, { empty: "Unchanged", attrs: { "data-field": "currentImpact" } })
      ]));
      ex.push(ratingLine("Current risk", x.current, x.currentExceeds));
    }
    ed.appendChild(section("Existing countermeasures", ex, { "data-part": "existing" }));

    // 4. The treatment decision (above tolerable risk only).
    if (x.exceeds) ed.appendChild(section("Treatment decision", [treatmentChoice(x)]));

    // 5. Additional countermeasures with their plan, then the planned rating.
    var add = cmPicker(o, t, false, T);
    if (showPlanned) {
      add.push(h("div", { class: "threat-grid", "data-part": "planned" }, [
        pick("Planned likelihood", t.residualLikelihood, lik, function (v) { t.residualLikelihood = v; }, { empty: "Unchanged", attrs: { "data-field": "residualLikelihood" } }),
        pick("Planned impact", t.residualImpact, sev, function (v) { t.residualImpact = v; }, { empty: "Unchanged", attrs: { "data-field": "residualImpact" } })
      ]));
      add.push(x.planned ? ratingLine("Planned risk", x.planned, x.plannedExceeds) : h("div", { class: "hint", text: "Rate it for when the additional countermeasures are in place." }));
    }
    ed.appendChild(section("Additional countermeasures", add, { "data-part": "additional" }));

    // Row actions.
    ed.appendChild(scenarioActions(o, t, p));
    return ed;
  }

  // ---------- Duplicate, copy, move, remove ----------

  var COPY_FIELDS = ["statement", "source", "entryPoint", "consequence", "likelihood", "impact", "likelihoodRationale"];
  function copyOf(t, id) {
    var n = M.emptyThreat(0); n.id = id;
    COPY_FIELDS.forEach(function (k) { n[k] = t[k] || ""; });
    n.affectedFR = t.affectedFR.slice();
    // Where the scenario came from, when it came from the house library.
    if (t.libraryId) n.libraryId = t.libraryId;
    // The impact per category is part of the unmitigated rating.
    if (t.impactByCategory && typeof t.impactByCategory === "object" && Object.keys(t.impactByCategory).length) n.impactByCategory = JSON.parse(JSON.stringify(t.impactByCategory));
    return n;
  }
  function duplicate(o, t) {
    var p = project(); p.counters.threat += 1;
    var n = JSON.parse(JSON.stringify(t)); n.id = "T" + p.counters.threat;
    // Who accepted the original did not accept the copy: the detail is
    // cleared, and an acceptance is left a suggestion to confirm.
    n.acceptanceDetail = M.emptyAcceptanceDetail();
    if (n.treatment && n.treatment.decision === "accept") n.treatment.confirmed = false;
    o.threats.splice(o.threats.indexOf(t) + 1, 0, n);
    ui.open[o.id] = n.id;
    return n;
  }
  // Into other zones or conduits: the scenario and its unmitigated rating only.
  // Links, ratings with countermeasures and the decision belong to the zone it
  // came from.
  function copyTo(o, t, ids) {
    var p = project(), made = [];
    ids.forEach(function (id) {
      var to = findOwner(p, id); if (!to || to === o) return;
      p.counters.threat += 1;
      var n = copyOf(t, "T" + p.counters.threat);
      to.threats.push(n); made.push(n.id + " in " + to.id);
    });
    return made;
  }
  // The scenario itself moves, its id kept. Links to the zone it left go, and
  // with them the current and planned ratings that rested on them (as a copy
  // has none).
  function moveTo(o, t, id) {
    var p = project(), to = findOwner(p, id);
    if (!to || to === o) return false;
    o.threats.splice(o.threats.indexOf(t), 1);
    to.threats.push(t);
    R.Migrate.pruneDangling(p);
    delete t.suggestedCountermeasureIds;
    t.currentLikelihood = ""; t.currentImpact = ""; t.residualLikelihood = ""; t.residualImpact = "";
    ui.sel = to.id; ui.selObj = to; ui.open[to.id] = t.id; ui.reveal = true;
    return true;
  }
  // What an undo opens again (js/app.js offerUndo): the zone or conduit and
  // the scenario, with the keyboard on focusSel (else the scenario's open
  // button). sec: a zone section to open ("vuln", "cm").
  function backTo(ownerId, threatId, focusSel, sec) {
    return function () {
      ui.sel = ownerId; ui.selObj = null; ui.view = "zone"; ui.reveal = true;
      if (threatId) ui.open[ownerId] = threatId;
      if (sec) ui.sec[sec + ":" + ownerId] = true;
      return focusSel || (threatId ? '[data-threat-id="' + threatId + '"] [data-action="open-scenario"]' : null);
    };
  }
  function scenarioActions(o, t, p) {
    var others = owners(p).filter(function (x) { return x !== o; });
    var copySel = h("select", { multiple: "multiple", size: String(Math.min(5, Math.max(2, others.length))), "data-action": "copy-targets", "aria-label": "Copy " + t.id + " to" },
      others.map(function (x) { return h("option", { value: x.id, text: x.id + (x.name ? " " + x.name : "") }); }));
    var moveSel = h("select", { "data-action": "move-target", "aria-label": "Move " + t.id + " to" },
      [h("option", { value: "", text: "Choose" })].concat(others.map(function (x) { return h("option", { value: x.id, text: x.id + (x.name ? " " + x.name : "") }); })));
    return h("div", { class: "scen-actions no-print" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "duplicate", text: "Duplicate", onClick: function () {
        var n = duplicate(o, t); touched(); rerender(); toast(t.id + " duplicated as " + n.id + "."); A.focusAfter('[data-threat-id="' + n.id + '"] [data-field="statement"]');
      } }),
      others.length ? keptDetails({ class: "scen-move" }, [h("summary", { text: "Copy or move" }), h("div", { class: "scen-move-body" }, [
        h("div", { class: "field" }, [labelFor("Copy to", copySel), copySel,
          h("button", { type: "button", class: "btn sm", "data-action": "copy-to", text: "Copy", onClick: function () {
            var ids = [].filter.call(copySel.options, function (op) { return op.selected; }).map(function (op) { return op.value; });
            if (!ids.length) { toast("Choose where to copy it."); return; }
            ui.move[o.id + "/" + t.id] = true;
            var mk = A.undoMark(); var made = copyTo(o, t, ids); touched(); rerender();
            A.focusAfter('[data-threat-id="' + t.id + '"] [data-action="copy-to"]');
            A.offerUndo(t.id + " copied: " + made.join(", ") + ".", backTo(o.id, t.id, '[data-threat-id="' + t.id + '"] [data-action="copy-to"]'), mk);
          } })]),
        h("div", { class: "field" }, [labelFor("Move to", moveSel), moveSel,
          h("button", { type: "button", class: "btn sm", "data-action": "move-to", text: "Move", onClick: function () {
            if (!moveSel.value) { toast("Choose where to move it."); return; }
            var to = moveSel.value;
            var mk = A.undoMark();
            if (moveTo(o, t, to)) {
              touched(); rerender(); A.focusAfter('[data-threat-id="' + t.id + '"] [data-action="open-scenario"]');
              A.offerUndo(t.id + " moved to " + to + ".", backTo(o.id, t.id), mk);
            }
          } })])
      ])], "move", o.id + "/" + t.id, false) : null,
      h("button", { type: "button", class: "btn sm danger", "data-action": "remove-scenario", text: "Remove", onClick: function () {
        var filled = !!(t.statement || t.source || t.likelihood || t.impact || (t.affectedFR && t.affectedFR.length));
        if (!confirmRemove(filled, "threat " + t.id)) return;
        var mk = A.undoMark(); var i = o.threats.indexOf(t); o.threats.splice(i, 1);
        if (ui.open[o.id] === t.id) ui.open[o.id] = o.threats[Math.min(i, o.threats.length - 1)] ? o.threats[Math.min(i, o.threats.length - 1)].id : null;
        touched(); rerender();
        // The keyboard goes to the scenario now open, else to + Add scenario.
        var now = ui.open[o.id];
        A.focusAfter(now ? '[data-threat-id="' + now + '"] [data-action="open-scenario"]' : '[data-action="add-scenario"]');
        A.offerUndo("Threat " + t.id + " removed.", backTo(o.id, t.id), mk);
      } })
    ]);
  }

  // ---------- The scenario table ----------

  function decisionWords(x) {
    if (!x.exceeds) return x.risk ? "Within tolerable risk" : "Not rated";
    if (x.treatment.state === "suggested") return "Suggested, not confirmed";
    return x.label;
  }
  function scenarioTable(row, p, tol, open) {
    var o = row.o;
    var openId = ui.open[o.id];
    if (openId === undefined || (openId && !o.threats.some(function (t) { return t.id === openId; }))) openId = o.threats.length ? o.threats[0].id : null;
    ui.open[o.id] = openId;
    var tbl = h("table", { class: "tbl compact scen-table" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "ID", style: "width:48px" }), h("th", { text: "Scenario" }), h("th", { text: "FRs", style: "width:86px" }),
      h("th", { text: "Unmitigated", class: "center", style: "width:92px" }), h("th", { text: "Current", class: "center", style: "width:76px" }),
      h("th", { text: "Planned", class: "center", style: "width:76px" }), h("th", { text: "Decision", style: "width:150px" }), h("th", { text: "Open", class: "center", style: "width:46px" })
    ])])]);
    if (!row.threats.length) tbl.appendChild(h("tbody", null, [h("tr", null, [h("td", { colspan: "8", class: "muted", text: "No scenarios yet." })])]));
    row.threats.forEach(function (x) {
      var t = x.t, isOpen = t.id === openId;
      var stmt = h("span", { class: "scen-statement", text: t.statement || "No statement yet" });
      var dec = h("span", { class: x.exceeds && !x.decided ? "val-warn" : "", text: decisionWords(x) });
      var nOpen = h("span", { class: "open-n", text: open.threat[o.id + "/" + t.id] ? String(open.threat[o.id + "/" + t.id]) : "" });
      live(function (vm, op) {
        var y = rowOf(vm, o.id, t.id); if (!y) return;
        stmt.textContent = y.t.statement || "No statement yet";
        dec.textContent = decisionWords(y); dec.className = y.exceeds && !y.decided ? "val-warn" : "";
        var n = op.threat[o.id + "/" + t.id]; nOpen.textContent = n ? String(n) : "";
      });
      var tb = h("tbody", { "data-threat-id": t.id, class: isOpen ? "open" : "" });
      tb.appendChild(h("tr", { class: "scen-row" + (isOpen ? " selected" : ""), onClick: function (e) {
        if (e.target.closest("button, a, input, select, textarea")) return;
        ui.open[o.id] = isOpen ? null : t.id; rerender();
      } }, [
        h("td", null, [h("button", { type: "button", class: "link-btn", "data-action": "open-scenario", "aria-expanded": isOpen ? "true" : "false", text: t.id,
          "aria-label": (isOpen ? "Close " : "Open ") + t.id, onClick: function () { ui.open[o.id] = isOpen ? null : t.id; rerender(); } })]),
        h("td", null, [stmt]),
        h("td", { text: t.affectedFR.join(", ") }),
        h("td", { class: "center" }, [riskPill(x.risk)]),
        h("td", { class: "center" }, [x.current ? riskPill(x.current) : null]),
        h("td", { class: "center" }, [x.planned ? riskPill(x.planned) : null]),
        h("td", null, [dec]),
        h("td", { class: "center" }, [nOpen])
      ]));
      if (isOpen) tb.appendChild(h("tr", { class: "scen-editor-row" }, [h("td", { colspan: "8" }, [scenarioEditor(x, p, tol)])]));
      tbl.appendChild(tb);
    });
    return tbl;
  }

  // ---------- The SL-T strip (one zone or conduit) ----------

  function slOptions() { return [1, 2, 3, 4].map(function (n) { return { value: String(n), text: "SL" + n }; }); }
  function setSL(o, fr, v) { o.slTargetByFR[fr] = v === "" || v == null ? null : Number(v); }
  // Fills each requirement not yet set with its suggestion; returns how many.
  function acceptSuggested(o, sug) {
    var n = 0;
    FR_IDS.forEach(function (fr) { var s = sug.byFR[fr] ? sug.byFR[fr].sl : null; if (s != null && o.slTargetByFR[fr] == null) { o.slTargetByFR[fr] = s; n++; } });
    return n;
  }
  function suggestionOf(o, p) { return isConduit(o) ? E.suggestConduit(o, p) : E.suggestZone(o, p); }
  // The safety floor's box (a safety related zone's strip, and the SL-T grid):
  // the house handling, and the requirements the floor covers, which the
  // project can narrow (phase 5b). safe: the safety related zones, named on the grid.
  function floorBox(p, safe) {
    var fw = E.safetyFloorWords(p), house = M.houseFloorFR();
    // The rules file's wording is written for the consultant; its "Prompt:" label is not shown.
    var action = String(SIS_RULE.actions[0] || "").replace(/^Prompt:\s*/i, "");
    var text = (safe ? "Safety related: " + safe.map(function (z) { return z.id; }).join(", ") + ". " : "") + cap(action) +
      (fw.none ? " No SL" + SIS_RULE.floorSL + " floor is applied." : " An SL" + SIS_RULE.floorSL + " floor is applied to " + fw.words + ".");
    return h("div", { class: "sis-box", "data-floor": "" }, [
      h("strong", { text: "SIS handling: " }), text,
      h("div", { class: "chip-row floor-frs no-print", role: "group", "aria-label": "Requirements the safety floor covers" }, [h("span", { class: "muted", text: "Floor on" })].concat(house.map(function (fr) {
        var on = fw.list.indexOf(fr) >= 0;
        return chip(fr, on, "floor-" + fr, function () {
          var list = fw.list.slice(); toggleIn(list, fr); M.setSafetyFloorFR(p, list); touched(); rerender();
        }, { cls: "xs", title: on ? "Take " + fr + " out of the safety floor" : "Put " + fr + " back in the safety floor" });
      })))
    ]);
  }
  function sltStrip(o, p) {
    var sug = suggestionOf(o, p);
    var fill = FR_IDS.filter(function (fr) { return sug.byFR[fr].sl != null && o.slTargetByFR[fr] == null; }).length;
    var head = h("tr", null, [h("th", { text: "" })].concat(FRS.map(function (f) { return h("th", { class: "center", title: f.fr + ": " + f.name, text: f.id }); })));
    var rSug = h("tr", null, [h("th", { scope: "row", text: "Suggested" })].concat(FRS.map(function (f) {
      var s = sug.byFR[f.id].sl; return h("td", { class: "center", text: s != null ? "SL" + s : "None" });
    })));
    var rSet = h("tr", null, [h("th", { scope: "row", text: "SL-T" })].concat(FRS.map(function (f) {
      var s = sug.byFR[f.id].sl, cur = o.slTargetByFR[f.id];
      var sel = h("select", { "data-slt-fr": f.id, "aria-label": "SL-T for " + f.id + " of " + o.id, onChange: function (e) { setSL(o, f.id, e.target.value); touched(); rerender(); } });
      sel.appendChild(h("option", { value: "", text: "Not set" }));
      slOptions().forEach(function (x) { var op = h("option", { value: x.value, text: x.text }); if (String(cur) === x.value) op.setAttribute("selected", "selected"); sel.appendChild(op); });
      var use = s != null && cur !== s ? h("button", { type: "button", class: "btn xs", "data-action": "use-suggestion-" + f.id, text: "Use SL" + s, title: "Use the suggestion for " + f.id,
        "aria-label": "Use SL" + s + " for " + f.id + " of " + o.id,
        onClick: function () {
          o.slTargetByFR[f.id] = s; touched(); rerender();
          // The button has gone: the keyboard goes to the requirement's SL-T.
          A.focusAfter('[data-slt-strip] select[data-slt-fr="' + f.id + '"]');
        } }) : null;
      return h("td", { class: "center" + (cur != null && s != null && cur < s ? " below-sug" : "") }, [sel, use]);
    })));
    var tbl = h("div", { class: "grid-scroll" }, [h("table", { class: "tbl compact slt-strip-table" }, [h("thead", null, [head]), h("tbody", null, [rSug, rSet])])]);
    var from = owners(p).filter(function (x) { return x !== o && FR_IDS.some(function (fr) { return x.slTargetByFR[fr] != null; }); });
    var fromSel = h("select", { "data-action": "copy-slt-from", "aria-label": "Copy the SL-T from" },
      [h("option", { value: "", text: "Copy from" })].concat(from.map(function (x) { return h("option", { value: x.id, text: x.id + (x.name ? " " + x.name : "") }); })));
    var why = keptDetails({ class: "trace strip-why" }, [h("summary", { text: "Why" }), h("div", { class: "trace-box" }, FRS.map(function (f) {
      return h("div", { "data-why": f.id }, [h("strong", { text: f.id }), h("ul", null, sug.byFR[f.id].trace.map(function (x) { return h("li", { text: x }); }))]);
    }))], "why", o.id, false);
    var tgt = E.maxDefined(o.slTargetByFR);
    var just = h("textarea", { value: o.justification, rows: "2", "data-field": "justification",
      placeholder: "Why this SL-T is right, including any FR held below its suggestion.", onInput: function (e) { o.justification = e.target.value; edited(); } });
    var jHint = h("div", { class: "hint" });
    function hint() {
      var need = E.maxDefined(o.slTargetByFR) != null && !(o.justification || "").trim();
      jHint.textContent = need ? "SL-T set but not justified: say why, especially for any FR below its suggestion." : "Required.";
      jHint.className = "hint" + (need ? " val-warn" : "");
    }
    hint(); live(hint);
    var kids = [];
    if (sug.safetyRelated && SIS_RULE) kids.push(floorBox(p, null));
    kids.push(tbl);
    kids.push(h("div", { class: "btn-row strip-actions no-print" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "accept-all-suggested", text: "Accept all suggested" + (fill ? " (" + fill + ")" : ""), disabled: fill ? null : "disabled",
        title: "Sets each requirement not yet set to its suggestion.", onClick: function () {
          var mk = A.undoMark(); var n = acceptSuggested(o, sug); touched(); rerender();
          // The button is now disabled: the keyboard goes to the first SL-T.
          A.focusAfter("[data-slt-strip] select[data-slt-fr]");
          A.offerUndo(n + " suggestion" + (n === 1 ? "" : "s") + " accepted for " + o.id + ".", backTo(o.id, null, '[data-slt-strip] [data-action="accept-all-suggested"]'), mk);
        } }),
      from.length ? fromSel : null,
      from.length ? h("button", { type: "button", class: "btn sm", "data-action": "copy-slt", text: "Copy", onClick: function () {
        var src = findOwner(p, fromSel.value); if (!src) { toast("Choose where to copy the SL-T from."); return; }
        FR_IDS.forEach(function (fr) { o.slTargetByFR[fr] = src.slTargetByFR[fr] != null ? src.slTargetByFR[fr] : null; });
        touched(); rerender(); toast("SL-T copied from " + src.id + ".");
      } }) : null,
      why
    ]));
    kids.push(h("div", { class: "field", style: "margin:8px 0 0" }, [
      h("label", { for: (just.id = "jst-" + o.id) }, [document.createTextNode("Justification "), h("span", { class: "req-star", text: "*" })]),
      just, jHint
    ]));
    var pill = tgt == null ? h("span", { class: "pill neutral", text: "Not set" }) : h("span", { class: "pill neutral", text: E.vecWords(o.slTargetByFR) });
    return h("div", { class: "slt-strip", "data-slt-strip": o.id }, [h("div", { class: "strip-head" }, [h("strong", { text: "SL-T" }), pill])].concat(kids));
  }

  // ---------- Vulnerabilities and countermeasures of the zone ----------

  function vulnList(o, p) {
    var rows = o.vulnerabilities.map(function (v, vi) {
      return h("tr", { "data-vuln-id": v.id }, [
        h("td", { class: "tid", text: v.id }),
        h("td", null, [h("input", { type: "text", value: v.description, "aria-label": "Vulnerability " + v.id, "data-field": "vuln-" + v.id,
          placeholder: "Known weakness in an access point or contained asset", onInput: function (e) { v.description = e.target.value; edited(); } })]),
        h("td", null, [h("input", { type: "text", value: v.reference || "", "aria-label": "Source of " + v.id, "data-field": "vuln-ref-" + v.id,
          placeholder: "e.g. Vendor advisory, scan, walk-down", onInput: function (e) { v.reference = e.target.value; edited(); } })]),
        h("td", null, [h("button", { type: "button", class: "btn sm danger", text: "×", "aria-label": "Remove " + v.id, onClick: function () {
          if (!confirmRemove(!!v.description, "vulnerability")) return;
          var mk = A.undoMark(); o.vulnerabilities.splice(vi, 1); R.Migrate.pruneDangling(p); touched(); rerender(); A.focusAfter('[data-action="add-vulnerability"]');
          A.offerUndo("Vulnerability " + v.id + " removed.", backTo(o.id, null, '[data-field="vuln-' + v.id + '"]', "vuln"), mk);
        } })])
      ]);
    });
    // Open to start with; its state is kept across redraws, and Add opens it.
    return keptDetails({ class: "owner-sec", "data-sec": "vuln" }, [h("summary", { text: "Vulnerabilities (" + o.vulnerabilities.length + ")" }),
      o.vulnerabilities.length ? h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [h("th", { text: "ID", style: "width:56px" }), h("th", { text: "Vulnerability" }), h("th", { text: "Source", style: "width:30%" }), h("th", { text: "", style: "width:40px" })])]), h("tbody", null, rows)]) : null,
      h("button", { type: "button", class: "btn sm", "data-action": "add-vulnerability", text: "+ Add vulnerability", onClick: function () {
        p.counters.vuln += 1; var v = M.emptyVulnerability(p.counters.vuln); o.vulnerabilities.push(v); ui.sec["vuln:" + o.id] = true; touched(); rerender(); A.focusAfter('[data-field="vuln-' + v.id + '"]');
      } })
    ], "sec", "vuln:" + o.id, true);
  }
  function srText(m) { return (m.srRefs || []).join(", "); }
  function cmList(o, p) {
    var rows = o.countermeasures.map(function (m, mi) {
      var frs = h("div", { class: "chip-row" }, FRS.map(function (f) {
        return chip(f.id, m.addressesFR.indexOf(f.id) >= 0, "cmfr-" + m.id + "-" + f.id, function () { toggleIn(m.addressesFR, f.id); touched(); rerender(); }, { cls: "xs", title: f.fr + ": " + f.name });
      }));
      return h("tr", { "data-cm-row": m.id }, [
        h("td", { class: "tid", text: m.id }),
        h("td", null, [h("input", { type: "text", value: m.description, "aria-label": "Countermeasure " + m.id, "data-cm-field": m.id + "-reg-description",
          placeholder: "e.g. Broker vendor access via a DMZ jump host.", onInput: function (e) { m.description = e.target.value; edited(); } }),
          h("label", { class: "check-line" }, [h("input", { type: "checkbox", checked: !!m.existing, "data-cm-field": m.id + "-existing", onChange: function (e) { m.existing = e.target.checked; touched(); rerender(); } }), "Existing countermeasure (in place)"])]),
        h("td", null, [frs]),
        h("td", null, [h("input", { type: "text", value: srText(m), "aria-label": "SR references of " + m.id, "data-cm-field": m.id + "-sr", placeholder: "e.g. SR 1.13, SR 5.1",
          onInput: function (e) { m.srRefs = e.target.value.split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean); edited(); } }),
          h("input", { type: "text", value: m.reference || "", "aria-label": "Reference of " + m.id, "data-cm-field": m.id + "-ref", placeholder: "Other reference",
            onInput: function (e) { m.reference = e.target.value; edited(); } })]),
        h("td", null, [h("button", { type: "button", class: "btn sm danger", text: "×", "aria-label": "Remove " + m.id, onClick: function () {
          var filled = !!(m.description || (m.addressesFR && m.addressesFR.length) || m.reference);
          if (!confirmRemove(filled, "countermeasure " + m.id)) return;
          var mk = A.undoMark(); o.countermeasures.splice(mi, 1); R.Migrate.pruneDangling(p); touched(); rerender(); A.focusAfter('[data-action="add-countermeasure"]');
          A.offerUndo("Countermeasure " + m.id + " removed.", backTo(o.id, null, '[data-cm-field="' + m.id + '-reg-description"]', "cm"), mk);
        } })])
      ]);
    });
    // Closed to start with; its state is kept across redraws, and Add opens it.
    return keptDetails({ class: "owner-sec", "data-sec": "cm" }, [h("summary", { text: "Countermeasures (" + o.countermeasures.length + ")" }),
      o.countermeasures.length ? h("table", { class: "tbl compact cm-table" }, [h("thead", null, [h("tr", null, [h("th", { text: "ID", style: "width:56px" }), h("th", { text: "Countermeasure" }), h("th", { text: "FRs", style: "width:220px" }), h("th", { text: "References", style: "width:180px" }), h("th", { text: "", style: "width:40px" })])]), h("tbody", null, rows)]) : null,
      h("button", { type: "button", class: "btn sm", "data-action": "add-countermeasure", text: "+ Add countermeasure", onClick: function () {
        var m = newCountermeasure(p, o, false); ui.sec["cm:" + o.id] = true; touched(); rerender(); A.focusAfter('[data-cm-field="' + m.id + '-reg-description"]');
      } })
    ], "sec", "cm:" + o.id, false);
  }

  // ---------- By zone ----------

  function rail(vm, p, open, selO) {
    function item(row) {
      var o = row.o, skip = E.comparison(o, p).skip, on = o === selO, n = open.owner[o.id] || 0;
      var nEl = h("span", { class: "rail-open" + (n ? " val-warn" : ""), text: n ? n + " open" : "" });
      live(function (vm2, op) { var k = op.owner[o.id] || 0; nEl.textContent = k ? k + " open" : ""; nEl.className = "rail-open" + (k ? " val-warn" : ""); });
      return h("button", { type: "button", class: "rail-item" + (on ? " on" : ""), "data-rail-id": o.id, "aria-current": on ? "true" : "false",
        onClick: function () { ui.sel = o.id; ui.selObj = o; ui.reveal = true; rerender(); } }, [
        h("span", { class: "rail-name", text: o.id + (o.name ? " " + o.name : "") }),
        h("span", { class: "rail-meta" }, [
          h("span", { class: "muted", text: o.threats.length + " scenario" + (o.threats.length === 1 ? "" : "s") }),
          row.worstRisk ? riskPill(row.worstRisk) : null,
          skip ? h("span", { class: "pill neutral", text: "Not required" }) : null,
          nEl
        ])
      ]);
    }
    var nav = h("nav", { class: "risk-rail no-print", "aria-label": "Zones and conduits" }, [
      h("div", { class: "rail-h", text: "Zones" })].concat(vm.zones.map(item))
      .concat(vm.conduits.length ? [h("div", { class: "rail-h", text: "Conduits" })].concat(vm.conduits.map(item)) : []));
    nav.addEventListener("scroll", function () { if (nav.isConnected) ui.railScroll = nav.scrollTop; });
    return nav;
  }
  // Once the rail is on the page: its scroll as it was before the redraw,
  // and, after a selection, the selected item brought into view within it
  // (the page itself is not scrolled).
  function placeRail(nav) {
    nav.scrollTop = ui.railScroll || 0;
    if (ui.reveal) {
      ui.reveal = false;
      var on = nav.querySelector(".rail-item.on");
      if (on) {
        var nr = nav.getBoundingClientRect(), r = on.getBoundingClientRect();
        if (r.top < nr.top) nav.scrollTop -= nr.top - r.top;
        else if (r.bottom > nr.bottom) nav.scrollTop += r.bottom - nr.bottom;
      }
    }
    ui.railScroll = nav.scrollTop;
  }

  function ownerPanel(row, p, vm, open) {
    var o = row.o, tol = vm.tolerable;
    var skip = E.comparison(o, p).skip;
    var head = [];
    if (skip) head.push(h("span", { class: "pill neutral", text: "Not required" }));
    if (row.worstRisk) head.push(riskPill(row.worstRisk));
    if (row.exceeding.length) head.push(h("span", { class: "pill flag", style: "margin-left:6px", text: row.exceeding.length + " over tolerable" }));
    var exceeding = row.exceeding, openT = row.open, suggested = row.suggested, linkSug = row.linkSuggested;
    var tally = exceeding.length ? h("span", { text: openT.length
      ? openT.length + " of " + exceeding.length + " threat" + (exceeding.length === 1 ? "" : "s") + " above tolerable risk need" + (openT.length === 1 ? "s" : "") + " a treatment decision."
      : "Every threat above tolerable risk has a treatment decision." }) : null;
    var body = [
      skip ? h("p", { class: "hint no-print", style: "margin-top:0", text: "No detailed assessment needed (step 4): set its SL-T and give the basis in the justification." }) : null,
      sltStrip(o, p),
      h("div", { class: "scen-bar" }, [
        h("h3", { class: "ed-h", text: "Scenarios" }),
        tally ? h("div", { class: "hint treat-summary" + (openT.length ? " val-warn" : "") }, [tally]) : null,
        suggested.length ? h("button", { type: "button", class: "btn sm", "data-action": "confirm-suggested", text: "Confirm suggested (" + suggested.length + ")", onClick: function () {
          var mk = A.undoMark(); suggested.forEach(function (x) { x.t.treatment.confirmed = true; });
          touched(); rerender();
          A.offerUndo(suggested.length + " suggested decision" + (suggested.length === 1 ? "" : "s") + " confirmed.", backTo(o.id, null, '[data-action="confirm-suggested"]'), mk);
        } }) : null,
        linkSug.length ? h("button", { type: "button", class: "btn sm", "data-action": "confirm-links", text: "Confirm suggested links (" + linkSug.length + ")", onClick: function () {
          var mk = A.undoMark(); linkSug.forEach(function (x) { E.confirmLinkSuggestions(o, x.t); });
          touched(); rerender();
          A.offerUndo("Suggested links confirmed.", backTo(o.id, null, '[data-action="confirm-links"]'), mk);
        } }) : null,
        h("span", { class: "spacer" }),
        scalesPop(p)
      ]),
      scenarioTable(row, p, tol, open),
      h("div", { class: "btn-row", style: "margin-top:8px" }, [h("button", { type: "button", class: "btn sm", "data-action": "add-scenario", text: "+ Add scenario", onClick: function () {
        p.counters.threat += 1; var t = M.emptyThreat(p.counters.threat); o.threats.push(t); ui.open[o.id] = t.id; touched(); rerender();
        A.focusAfter('[data-threat-id="' + t.id + '"] [data-field="statement"]');
      } }),
        M.LIBRARY ? h("button", { type: "button", class: "btn sm", "data-action": "add-from-library", text: "Add from library", "aria-expanded": R.LibraryUI.isOpen(o.id) ? "true" : "false", "aria-controls": R.LibraryUI.isOpen(o.id) ? R.LibraryUI.pickerId(o.id) : null,
          onClick: function () {
            if (R.LibraryUI.isOpen(o.id)) { R.LibraryUI.close(); rerender(); return; }
            R.LibraryUI.open(o.id); rerender(); A.focusAfter('[data-library-picker] [data-field="lib-search"]');
          } }) : null]),
      R.LibraryUI.isOpen(o.id) ? R.LibraryUI.picker(o, p, {
        // The drafts are added; the first opens, with the keyboard in its statement.
        onAdded: function (res) {
          if (!res.threats.length) { rerender(); return; }
          ui.open[o.id] = res.threats[0].id; touched(); rerender();
          A.focusAfter('[data-threat-id="' + res.threats[0].id + '"] [data-field="statement"]');
          var n = res.threats.length;
          A.offerUndo(n + " scenario" + (n === 1 ? "" : "s") + " added from the library" + (res.cms ? ", with " + res.cms + " draft countermeasure" + (res.cms === 1 ? "" : "s") : "") + ".",
            backTo(o.id, null, '[data-action="add-from-library"]'), res.mark);
        },
        onClose: function () { rerender(); A.focusAfter('[data-action="add-from-library"]'); }
      }) : null,
      vulnList(o, p),
      cmList(o, p)
    ];
    return card(ownerLabel(o), null, body, head.length ? h("span", null, head) : null, { "data-owner-id": o.id, class: "card owner-panel" });
  }

  // ---------- Register and heat map (all zones) ----------

  var DECISION_FILTERS = [
    { id: "", text: "Any decision" }, { id: "none", text: "No decision" }, { id: "suggested", text: "Suggested" },
    { id: "reduce", text: "Reduce" }, { id: "accept", text: "Accept" }, { id: "slt", text: "SL-T programme" }, { id: "within", text: "Within tolerable" }
  ];
  var HEAT_STATES = [{ id: "unmitigated", text: "Unmitigated" }, { id: "current", text: "Current" }, { id: "planned", text: "Planned" }];
  // A scenario's likelihood and impact in a state; a state not rated takes
  // the rating before it.
  function stateLI(t, st) {
    var L = t.likelihood, I = t.impact;
    if (st === "current" || st === "planned") { L = t.currentLikelihood || L; I = t.currentImpact || I; }
    if (st === "planned") { L = t.residualLikelihood || L; I = t.residualImpact || I; }
    return { L: L, I: I };
  }
  function matchesFilter(x, open) {
    var f = ui.filter, T = x.treatment;
    if (f.owner && x.owner.id !== f.owner) return false;
    if (f.band && x.risk !== f.band) return false;
    if (f.open && !open.threat[x.owner.id + "/" + x.t.id]) return false;
    if (f.decision) {
      if (f.decision === "within" && x.exceeds) return false;
      if (f.decision === "none" && !(x.exceeds && T.state === "none")) return false;
      if (f.decision === "suggested" && T.state !== "suggested") return false;
      if (["reduce", "accept", "slt"].indexOf(f.decision) >= 0 && !(T.confirmed && T.decision === f.decision)) return false;
    }
    if (f.cell) { var li = stateLI(x.t, f.cell.state); if (li.L !== f.cell.L || li.I !== f.cell.I) return false; }
    return true;
  }
  // The keyboard lands on the scenario's open button, as Go to does.
  function openScenario(ownerId, threatId) {
    ui.sel = ownerId; ui.selObj = null; ui.open[ownerId] = threatId; ui.view = "zone"; ui.reveal = true;
    A.navigate("risk", '[data-threat-id="' + threatId + '"] [data-action="open-scenario"]');
    var el = document.querySelector('#main [data-owner-id="' + ownerId + '"] [data-threat-id="' + threatId + '"]'); if (el) A.flash(el);
  }
  function filterSelect(key, label, list) {
    var sel = h("select", { "data-filter": key, "aria-label": label, onChange: function (e) { ui.filter[key] = e.target.value; rerender(); } });
    list.forEach(function (x) { var op = h("option", { value: x.id, text: x.text }); if (ui.filter[key] === x.id) op.setAttribute("selected", "selected"); sel.appendChild(op); });
    return sel;
  }
  function renderRegister(main, p, vm, open) {
    var f = ui.filter;
    var bar = h("div", { class: "reg-filters no-print", role: "group", "aria-label": "Filter the register" }, [
      filterSelect("owner", "Zone or conduit", [{ id: "", text: "All zones and conduits" }].concat(vm.owners.map(function (r) { return { id: r.o.id, text: r.o.id + (r.o.name ? " " + r.o.name : "") }; }))),
      filterSelect("band", "Unmitigated risk", [{ id: "", text: "Any unmitigated risk" }].concat(BANDS.slice().reverse().map(function (b) { return { id: b.id, text: b.name }; }))),
      filterSelect("decision", "Decision", DECISION_FILTERS),
      h("label", { class: "check-line" }, [h("input", { type: "checkbox", "data-filter": "open", checked: f.open, onChange: function (e) { f.open = e.target.checked; rerender(); } }), "Open only"]),
      f.cell ? h("span", { class: "pill neutral reg-cell", "data-cell-filter": "" }, [
        cap(f.cell.state) + ": " + E.impactName(f.cell.I, p) + " impact, " + E.likelihoodName(f.cell.L, p).toLowerCase() + " likelihood",
        h("button", { type: "button", class: "assign-x", "data-action": "clear-cell", "aria-label": "Clear the heat map filter", text: "×", onClick: function () { f.cell = null; rerender(); A.focusAfter('[data-filter="owner"]'); } })
      ]) : null
    ]);
    var rows = vm.threats.filter(function (x) { return matchesFilter(x, open); });
    var tbl = h("table", { class: "tbl compact reg-table" }, [h("thead", null, [h("tr", null, [
      h("th", { text: "Zone or conduit", style: "width:150px" }), h("th", { text: "ID", style: "width:56px" }), h("th", { text: "Scenario" }), h("th", { text: "FRs", style: "width:110px" }),
      h("th", { text: "Unmitigated", class: "center", style: "width:96px" }), h("th", { text: "Current", class: "center", style: "width:86px" }), h("th", { text: "Planned", class: "center", style: "width:86px" }),
      h("th", { text: "Decision", style: "width:180px" }), h("th", { text: "Open", class: "center", style: "width:52px" })
    ])])]);
    var tb = h("tbody");
    if (!rows.length) tb.appendChild(h("tr", null, [h("td", { colspan: "9", class: "muted", text: vm.threats.length ? "No scenario matches the filter." : "No scenarios yet." })]));
    rows.forEach(function (x) {
      var n = open.threat[x.owner.id + "/" + x.t.id];
      tb.appendChild(h("tr", { "data-reg-row": x.owner.id + "/" + x.t.id }, [
        h("td", { text: x.owner.id + (x.owner.name ? " " + x.owner.name : "") }),
        h("td", null, [h("button", { type: "button", class: "link-btn", "data-action": "reg-open", "aria-label": "Open " + x.t.id + " in " + x.owner.id, text: x.t.id, onClick: function () { openScenario(x.owner.id, x.t.id); } })]),
        h("td", { text: x.t.statement || "No statement yet" }),
        h("td", { text: x.t.affectedFR.join(", ") }),
        h("td", { class: "center" }, [riskPill(x.risk)]),
        h("td", { class: "center" }, [x.current ? riskPill(x.current) : null]),
        h("td", { class: "center" }, [x.planned ? riskPill(x.planned) : null]),
        h("td", { class: x.exceeds && !x.decided ? "val-warn" : "", text: decisionWords(x) }),
        h("td", { class: "center", text: n ? String(n) : "" })
      ]));
    });
    tbl.appendChild(tb);
    main.appendChild(card("Register", rows.length + " of " + vm.threats.length + " scenario" + (vm.threats.length === 1 ? "" : "s"), [bar, tbl], null, { "data-view": "register" }));
  }
  function renderHeatmap(main, p, vm) {
    var st = ui.heat, tol = vm.tolerable;
    // The cells' counts and outlines (js/view-model.js heatCells, the rule
    // the workbook's Summary reads too).
    var cells = R.ViewModel.heatCells(vm, st);
    var toggle = h("div", { class: "treat-opts heat-toggle no-print", role: "group", "aria-label": "Rating shown" }, HEAT_STATES.map(function (s) {
      var on = s.id === st;
      return h("button", { type: "button", class: "treat-opt" + (on ? " on" : ""), "data-heat": s.id, "aria-pressed": on ? "true" : "false", text: s.text, onClick: function () { ui.heat = s.id; rerender(); } });
    }));
    var t = h("table", { class: "tbl matrix heat", "aria-label": "Heat map" });
    // The project's criteria give the dimensions and the cells' bands.
    var crit = M.criteriaOf(p), LIKS = crit.likelihood;
    // Both axes named: impact down the side, likelihood across the top.
    t.appendChild(h("thead", null, [
      h("tr", null, [h("th", { rowspan: "2", scope: "col", text: "Impact" }), h("th", { class: "center heat-axis", colspan: String(LIKS.length), scope: "colgroup", text: "Likelihood" })]),
      h("tr", null, LIKS.map(function (l) { return h("th", { class: "center", scope: "col", text: l.name }); }))
    ]));
    var tb = h("tbody");
    crit.impact.slice().reverse().forEach(function (sv) {
      tb.appendChild(h("tr", null, [h("th", { scope: "row", text: sv.name })].concat(LIKS.map(function (l) {
        var b = E.riskFor(sv.id, l.id, p) || "none", n = (cells[sv.id + ":" + l.id] || {}).n || 0;
        return h("td", { class: "center heat-cell risk-" + b + (R.ViewModel.heatAbove(cells, sv.id, l.id, b, tol) ? " above-tol" : "") }, [
          h("button", { type: "button", class: "heat-btn", "data-cell": sv.id + ":" + l.id, disabled: n ? null : "disabled",
            "aria-label": n + " scenario" + (n === 1 ? "" : "s") + ", " + sv.name + " impact, " + l.name.toLowerCase() + " likelihood",
            onClick: function () { ui.filter = { owner: "", band: "", decision: "", open: false, cell: { state: st, I: sv.id, L: l.id } }; ui.view = "register"; A.navigate("risk", '[data-filter="owner"]'); } },
            [h("span", { class: "heat-n", text: n ? String(n) : "" }), h("span", { class: "heat-band", text: BAND_NAME[b] || "Not set" })])
        ]);
      }))));
    });
    t.appendChild(tb);
    var unrated = vm.threats.filter(function (x) { var li = stateLI(x.t, st); return !(li.L && li.I); }).length;
    main.appendChild(card("Heat map", vm.threats.length + " scenario" + (vm.threats.length === 1 ? "" : "s"), [
      toggle,
      h("p", { class: "hint", text: "Outlined cells are above tolerable risk; a rating not given takes the one before it." }),
      t,
      unrated ? h("p", { class: "muted", text: unrated + " not rated." }) : null
    ], null, { "data-view": "heatmap" }));
  }

  // ---------- The SL-T grid (all zones and conduits) ----------

  function renderSlt(main) {
    fresh(); lives = [];
    var p = project();
    main.appendChild(h("h1", { class: "page-title", text: "SL-T assignment" }));
    main.appendChild(pageSub("slt", "Set one target security level per foundational requirement, and justify it."));
    main.appendChild(stepTabs("slt"));
    main.appendChild(h("div", { class: "framing-note", text: "Suggestions are a SolutionsPT house heuristic, not the standard's; an SL-T below one is fine if justified." }));
    if (!p.zones.length) { main.appendChild(card("No zones", null, [h("p", { class: "muted", text: "Define zones in step 3 first." })])); return; }
    var all = owners(p), sugs = {};
    all.forEach(function (o) { sugs[o.id] = suggestionOf(o, p); });
    var fillAll = 0;
    all.forEach(function (o) { FR_IDS.forEach(function (fr) { if (sugs[o.id].byFR[fr].sl != null && o.slTargetByFR[fr] == null) fillAll++; }); });
    var safe = p.zones.filter(function (z) { return sugs[z.id].safetyRelated; });
    var tbl = h("table", { class: "tbl compact fr-slt-table slt-grid" }, [h("thead", null, [h("tr", null, [h("th", { text: "Zone or conduit" })]
      .concat(FRS.map(function (f) { return h("th", { class: "center", title: f.fr + ": " + f.name, text: f.id }); }))
      .concat([h("th", { text: "Justification", style: "width:150px" }), h("th", { text: "", style: "width:120px" })]))])]);
    var tb = h("tbody");
    all.forEach(function (o) {
      var sug = sugs[o.id], skip = E.comparison(o, p).skip, fill = FR_IDS.filter(function (fr) { return sug.byFR[fr].sl != null && o.slTargetByFR[fr] == null; }).length;
      var set = E.maxDefined(o.slTargetByFR) != null, just = !!(o.justification || "").trim();
      tb.appendChild(h("tr", { "data-owner-id": o.id }, [
        h("td", null, [h("div", { text: ownerLabel(o) }),
          skip ? h("div", { class: "muted cmp-source", text: "No detailed assessment needed" }) : null,
          sug.safetyRelated ? h("div", { class: "muted cmp-source", text: "Safety related" }) : null])
      ].concat(FRS.map(function (f) {
        var s = sug.byFR[f.id].sl, cur = o.slTargetByFR[f.id];
        var sel = h("select", { "data-slt-fr": f.id, "aria-label": "SL-T for " + f.id + " of " + o.id, onChange: function (e) { setSL(o, f.id, e.target.value); touched(); rerender(); } });
        sel.appendChild(h("option", { value: "", text: "Not set" }));
        slOptions().forEach(function (x) { var op = h("option", { value: x.value, text: x.text }); if (String(cur) === x.value) op.setAttribute("selected", "selected"); sel.appendChild(op); });
        return h("td", { class: "center" + (cur != null && s != null && cur < s ? " below-sug" : "") }, [sel, h("div", { class: "muted sug-word", text: s != null ? "Suggested SL" + s : "No suggestion" })]);
      })).concat([
        h("td", { class: set && !just ? "val-warn" : "muted", text: !set ? "SL-T not set" : (just ? "Justified" : "Set, needs justification") }),
        h("td", null, [
          fill ? h("button", { type: "button", class: "btn xs", "data-action": "accept-row", text: "Accept (" + fill + ")", title: "Sets each requirement not yet set to its suggestion.",
            "aria-label": "Accept " + fill + " suggestion" + (fill === 1 ? "" : "s") + " for " + o.id,
            onClick: function () {
              var mk = A.undoMark(); var n = acceptSuggested(o, sug); touched(); rerender();
              // The button has gone: the keyboard goes to the row's first SL-T.
              A.focusAfter('tr[data-owner-id="' + o.id + '"] select[data-slt-fr]');
              A.offerUndo(n + " suggestion" + (n === 1 ? "" : "s") + " accepted for " + o.id + ".", function () { return 'tr[data-owner-id="' + o.id + '"] [data-action="accept-row"]'; }, mk);
            } }) : null,
          h("button", { type: "button", class: "btn xs", "data-action": "open-zone", text: "Open", "aria-label": "Open " + o.id, onClick: function () { ui.sel = o.id; ui.selObj = o; ui.view = "zone"; ui.reveal = true; A.navigate("risk", '[data-slt-strip] [data-field="justification"]'); } })
        ])
      ])));
    });
    tbl.appendChild(tb);
    var body = [];
    if (safe.length && SIS_RULE) body.push(floorBox(p, safe));
    body.push(h("div", { class: "btn-row no-print", style: "margin-bottom:8px" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "accept-all-grid", text: "Accept all suggested" + (fillAll ? " (" + fillAll + ")" : ""), disabled: fillAll ? null : "disabled",
        title: "Sets each requirement not yet set to its suggestion, in every zone and conduit.",
        onClick: function () {
          var mk = A.undoMark(); var n = 0; all.forEach(function (o) { n += acceptSuggested(o, sugs[o.id]); }); touched(); rerender();
          // The button is now disabled: the keyboard goes to the grid's first SL-T.
          A.focusAfter("table.slt-grid select[data-slt-fr]");
          A.offerUndo(n + " suggestion" + (n === 1 ? "" : "s") + " accepted.", function () { return '[data-action="accept-all-grid"]'; }, mk);
        } })
    ]));
    body.push(h("div", { class: "grid-scroll" }, [tbl]));
    main.appendChild(card("SL-T grid", "every zone and conduit", body));
  }

  // ---------- The page ----------

  // Step 5's tabs: By zone, Register, Heat map (views of risk) and the SL-T grid (slt).
  function stepTabs(active) {
    var p = project(), threats = owners(p).reduce(function (a, o) { return a + o.threats.length; }, 0), slt = A.sltCount();
    function tab(id, text, badge) {
      var on = active === id;
      // The tab showing is the current page of the step (not a pressed toggle).
      return h("button", { type: "button", class: "sl-btn step-tab" + (on ? " active" : ""), "data-tab": id, "aria-current": on ? "page" : null,
        onClick: function () {
          if (on) return;
          if (id === "slt") A.navigate("slt", '.step-tabs [data-tab="slt"]');
          else { ui.view = id === "risk" ? "zone" : id; A.navigate("risk", '.step-tabs [data-tab="' + id + '"]'); }
        } }, [text, badge ? h("span", { class: "badge", text: badge }) : null]);
    }
    return h("div", { class: "step-tabs no-print", role: "group", "aria-label": "Detailed risk" }, [
      tab("risk", "By zone", threats ? String(threats) : null),
      tab("register", "Register"),
      tab("heatmap", "Heat map"),
      tab("slt", "SL-T grid", slt)
    ]);
  }

  function renderRisk(main) {
    fresh(); lives = [];
    var p = project();
    var view = ui.view;
    main.appendChild(h("h1", { class: "page-title", text: "Detailed risk assessment" }));
    main.appendChild(pageSub("risk", "Work through each zone and conduit: its scenarios, their ratings and a treatment decision where tolerable risk is exceeded."));
    main.appendChild(stepTabs(view === "zone" ? "risk" : view));
    var cw = E.criteriaWords(p);
    var tolWords = "tolerable risk is " + BAND_NAME[E.tolerableOf(p)].toLowerCase() + " (step 1).";
    main.appendChild(h("div", { class: "framing-note", text: cw.source === "client" ? "The client's risk matrix; " + tolWords :
      cw.source === "project" ? "The risk matrix agreed for this assessment; " + tolWords : "SolutionsPT house risk matrix; the standard prescribes none. " + cap(tolWords) }));
    if (!p.zones.length && !p.conduits.length) { main.appendChild(card("No zones", null, [h("p", { class: "muted", text: "Define zones in step 3 first." })])); return; }
    var vm = R.ViewModel.build(p), open = openMap(p);
    if (view === "register") { renderRegister(main, p, vm, open); return; }
    if (view === "heatmap") { renderHeatmap(main, p, vm); return; }
    var selO = ui.selObj && owners(p).indexOf(ui.selObj) >= 0 ? ui.selObj : findOwner(p, ui.sel);
    if (!selO) selO = owners(p)[0];
    ui.sel = selO.id; ui.selObj = selO;
    var row = vm.owners.filter(function (r) { return r.o === selO; })[0];
    var railEl = rail(vm, p, open, selO);
    main.appendChild(h("div", { class: "risk-layout" }, [railEl, h("div", { class: "risk-panel" }, [ownerPanel(row, p, vm, open)])]));
    placeRail(railEl);
  }

  // Opens a zone or conduit, and one of its scenarios, on By zone.
  function select(ownerId, threatId) {
    fresh();
    var p = project(), o = findOwner(p, ownerId);
    if (!o) return false;
    ui.sel = o.id; ui.selObj = o; ui.view = "zone"; ui.reveal = true;
    if (threatId && o.threats.some(function (t) { return t.id === threatId; })) ui.open[o.id] = threatId;
    return true;
  }

  R.RiskPage = { select: select, ui: ui, acceptSuggested: acceptSuggested, copyTo: copyTo, moveTo: moveTo, duplicate: duplicate, refresh: refresh };
  var P = R.Pages;
  P.risk = renderRisk; P.slt = renderSlt;
}());
