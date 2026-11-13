/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-spec.js — step 6, Requirements specification (spec), and step 7,
 * Approval (approval).
 *
 * The specification is eight blocks, in the order data/zcr-map.json gives
 * (js/engine.js specBlocks), each assembled from what the steps captured,
 * with its status and a link back to where it was captured. Two have no
 * other home and are entered here: the organisational security policies and
 * the regulatory requirements.
 *
 * Approval shows what an approval covers (the tolerable risk, the SL-T grid,
 * the accepted risks), then the approvers (project.approvals; approval stays
 * the first one's mirror, js/model.js). Each approver recorded as approving
 * takes the fingerprint of what it covered, and reads "changed since
 * approval" when that changes. Nothing here blocks. Registers both pages in
 * RiskApp.Pages.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var FRS = M.FRS, BAND_NAME = M.BAND_NAME, RULES = M.RULES;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, card = U.card, textField = U.textField, lineListField = U.lineListField, pageSub = U.pageSub,
    riskPill = U.riskPill, renderZoneMap = U.renderZoneMap, confirmRemove = U.confirmRemove;

  var STEP_OF = { suc: "1", srs: "2", zones: "3" };
  var STEP_NAME = { suc: "Scope and risk criteria", srs: "High-level risk", zones: "Zones and conduits" };
  // The block's own title is in its name, so several "Go to step 1" buttons
  // on the page can be told apart.
  function stepLink(stage, anchor, what) {
    return h("button", { type: "button", class: "btn sm", "data-action": "spec-goto-" + stage, text: "Go to step " + STEP_OF[stage],
      "aria-label": "Go to step " + STEP_OF[stage] + ", " + STEP_NAME[stage] + (what ? ", for " + what : ""),
      onClick: function () { if (anchor) A.goToItem({ stage: stage, target: { kind: anchor } }); else A.navigate(stage); } });
  }
  function status(done) { return h("span", { class: "spec-status", "data-status": done ? "done" : "open", text: done ? "Done" : "Open" }); }
  function list(items, empty) {
    return items.length ? h("ul", { class: "spec-list" }, items.map(function (x) { return h("li", { text: x }); })) : h("p", { class: "muted", text: empty || "None recorded." });
  }
  function kv(pairs) {
    return h("dl", { class: "spec-kv" }, [].concat.apply([], pairs.filter(function (x) { return x[1]; }).map(function (x) { return [h("dt", { text: x[0] }), h("dd", { text: x[1] })]; })));
  }
  function perZone(p, key) {
    var out = [];
    p.zones.forEach(function (z) { M.listOf(z[key]).forEach(function (x) { out.push(z.id + ": " + x); }); });
    return out;
  }
  function ownerName(o) { return o.id + (o.name ? " " + o.name : ""); }

  // ---------- Step 6: the specification ----------

  function blockBody(p, b) {
    var s = p.suc, r = p.srs, what = b.title.charAt(0).toLowerCase() + b.title.slice(1);
    function go(stage, anchor) { return stepLink(stage, anchor, what); }
    switch (b.id) {
      case "suc":
        return [kv([["SUC", s.name], ["Description", s.description], ["Scope and boundary", s.scopeStatement], ["Essential functions", r.essentialFunctions]]),
          r.mandatorySecurityFunctions.length ? h("div", null, [h("strong", { text: "Security functions that must be kept" }), list(r.mandatorySecurityFunctions)]) : null,
          h("div", { class: "btn-row" }, [go("suc", "suc"), r.mandatorySecurityFunctions.length ? go("srs") : null])];
      case "drawings":
        return [renderZoneMap(p, function (id) { A.goToItem({ stage: "zones", target: { kind: "zone", id: id } }); }), h("div", { class: "btn-row" }, [go("zones")])];
      case "characteristics":
        return [characteristicsTables(p), h("div", { class: "btn-row" }, [go("zones")])];
      case "assumptions":
        return [list(s.assumptions.concat(perZone(p, "assumptions"))), h("div", { class: "btn-row" }, [go("suc", "suc"), go("zones")])];
      case "threats":
        return [kv([["Assumed adversary", r.adversaryClass ? "SL" + r.adversaryClass + "-grade: " + RULES.slDefinitions[String(r.adversaryClass)] : ""], ["Worst-case consequences", r.worstCase]]),
          h("strong", { text: "Known or presumed threats" }), list(r.knownThreats), h("div", { class: "btn-row" }, [go("srs")])];
      case "policies":
        var zp = perZone(p, "securityPolicies");
        return [lineListField("Policies", M.listOf(s.policies), function (a) { if (a.length) s.policies = a; else delete s.policies; touched(); refreshStatus(p); }, "e.g. Group OT security standard GS-104"),
          zp.length ? h("div", null, [h("strong", { text: "Zone policies" }), list(zp)]) : null,
          zp.length ? h("div", { class: "btn-row" }, [go("zones")]) : null];
      case "tolerable":
        var tol = E.tolerableOf(p), ok = M.tolerableConfirmed(p);
        var byCat = E.tolerableByCategoryWords(p);
        return [h("p", null, [riskPill(tol), h("span", { class: ok ? "muted" : "val-warn", text: ok ? "  Confirmed with the asset owner." : "  Not confirmed with the asset owner." })]),
          byCat ? h("p", { class: "muted", "data-tolerable-by-category": "", text: "By category: " + byCat + "." }) : null,
          p.srs.clientMatrix ? h("p", { class: "muted", text: "Client risk matrix in use" + (p.srs.clientMatrixNote ? ": " + p.srs.clientMatrixNote : "") + "." }) : null,
          h("div", { class: "btn-row" }, [go("suc", "criteria")])];
      case "regulatory":
        return [lineListField("Requirements", r.regulatory, function (a) { r.regulatory = a; touched(); refreshStatus(p); }, "e.g. UK NIS Regulations 2018")];
    }
    return [];
  }
  // Typing on step 6 settles a block without a redraw: its status and the
  // sidebar's follow as the text goes in.
  function refreshStatus(p) {
    var main = document.getElementById("main");
    if (main) E.specBlocks(p).forEach(function (b) {
      var c = main.querySelector('[data-spec="' + b.id + '"]'), pill = c && c.querySelector(".spec-status");
      if (!pill) return;
      c.setAttribute("data-spec-done", b.done ? "1" : "0");
      pill.setAttribute("data-status", b.done ? "done" : "open");
      pill.textContent = b.done ? "Done" : "Open";
    });
    A.refreshNav();
  }
  function characteristicsTables(p) {
    if (!p.zones.length) return h("p", { class: "muted", text: "No zones yet." });
    var zt = h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, ["Zone", "Accountable organisation", "Assets", "Access points", "Separation"].map(function (t) { return h("th", { text: t }); }))])]);
    var tb = h("tbody");
    p.zones.forEach(function (z) {
      var rows = E.separationRows(z, p);
      var open = rows.filter(function (r) { return r.open || r.reasonMissing; }).length;
      var notSep = rows.filter(function (r) { return r.answer === "not-separated"; }).length;
      tb.appendChild(h("tr", null, [
        h("td", { text: ownerName(z) + (E.zoneSafety(z) ? " (safety related)" : "") }),
        h("td", { text: z.accountableOrg || "" }),
        h("td", { class: "center", text: String(z.assets.length) }),
        h("td", { class: "center", text: String(z.accessPoints.length + M.listOf(z.physicalAccessPoints).length) }),
        h("td", { class: open ? "val-warn" : "", text: !rows.length ? "None raised" : (open ? open + " to answer" : (notSep ? notSep + " not separated" : "Met")) })
      ]));
    });
    zt.appendChild(tb);
    var kids = [zt];
    if (p.conduits.length) {
      var ct = h("table", { class: "tbl compact", style: "margin-top:10px" }, [h("thead", null, [h("tr", null, ["Conduit", "Ends", "Direction", "Connection"].map(function (t) { return h("th", { text: t }); }))])]);
      var cb = h("tbody");
      p.conduits.forEach(function (c) {
        var dir = c.direction === "both" ? "Both ways" : c.direction === "from-to" ? "One way, " + c.fromZone + " to " + c.toZone : c.direction === "to-from" ? "One way, " + c.toZone + " to " + c.fromZone : "";
        var marks = [];
        if (c.wireless) marks.push("wireless");
        if (E.conduitExternal(c)) marks.push("external" + (c.externalParty ? " (" + c.externalParty + ")" : ""));
        if (c.temporary) marks.push("temporarily connected");
        cb.appendChild(h("tr", null, [h("td", { text: ownerName(c) }), h("td", { text: (c.fromZone || "?") + " ↔ " + (c.toZone || "?") }), h("td", { text: dir }), h("td", { text: marks.join(", ") })]));
      });
      ct.appendChild(cb);
      kids.push(ct);
    }
    return h("div", null, kids);
  }

  function renderSpec(main) {
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Cyber security requirements specification" }));
    main.appendChild(pageSub("spec", "The requirements, assumptions and constraints, assembled from the steps."));
    E.specBlocks(p).forEach(function (b) {
      main.appendChild(card(b.title, null, blockBody(p, b), status(b.done), { "data-check-anchor": "spec-" + b.id, "data-spec": b.id, "data-spec-done": b.done ? "1" : "0" }));
    });
  }

  // ---------- Step 7: approval ----------

  // What an approval covers, as the report prints it.
  function coveredCard(p) {
    var vm = R.ViewModel.build(p), kids = [];
    var tol = E.tolerableOf(p);
    kids.push(h("p", { "data-covers": "tolerable" }, [h("strong", { text: "Tolerable risk: " }), riskPill(tol),
      h("span", { class: M.tolerableConfirmed(p) ? "muted" : "val-warn", text: M.tolerableConfirmed(p) ? "  confirmed with the asset owner." : "  not confirmed with the asset owner." })]));
    if (vm.owners.length) {
      var t = h("table", { class: "tbl compact", "data-covers": "slt" }, [h("thead", null, [h("tr", null, [h("th", { text: "SL-T" })].concat(FRS.map(function (f) { return h("th", { class: "center", text: f.id, title: f.name }); })))])]);
      var tb = h("tbody");
      vm.owners.forEach(function (row) {
        tb.appendChild(h("tr", null, [h("td", { text: ownerName(row.o) })].concat(FRS.map(function (f) { var v = row.o.slTargetByFR[f.id]; return h("td", { class: "center" + (v == null ? " muted" : ""), text: v == null ? "Not set" : "SL" + v }); }))));
      });
      t.appendChild(tb);
      kids.push(t);
    }
    var acc = vm.threats.filter(function (x) { return x.disposition === "accepted"; });
    kids.push(h("div", { "data-covers": "accepted", style: "margin-top:10px" }, [h("strong", { text: "Accepted risks" }),
      list(acc.map(function (x) { return x.t.id + " (" + x.owner.id + "): " + (x.t.statement || "").replace(/[.\s]+$/, "") + ". " + x.treatment.reason; }), "None.")]));
    // The ranking, which the high-level report's approval covers.
    var ranked = p.srs.highLevelAssets.filter(function (a) { return a.name || a.consequence || a.likelihood; });
    var hlOnly = M.assessmentType(p) === "high-level";
    kids.push(h("div", { "data-covers": "ranking", style: "margin-top:10px" }, [h("strong", { text: "Ranking" }),
      list(ranked.map(function (a) {
        var c = hlOnly ? E.hlaComparison(a, p) : null;
        return a.id + (a.name ? " " + a.name : "") + ": " + (a.consequence ? E.impactName(a.consequence, p) : "not rated") + " impact, " + (a.likelihood ? E.likelihoodName(a.likelihood, p).toLowerCase() : "not rated") + " likelihood" +
          (c ? (c.required === true ? ", detailed assessment required" : c.required === false ? ", no detailed assessment" : "") : "") + ".";
      }), "None.")]));
    return card("What is being approved", null, kids);
  }

  // Edits go to project.approvals, written (with approval its first entry's
  // mirror) on the first edit; looking at the page writes nothing.
  function entries(p) {
    var want = M.approvalsOf(p);
    if (!Array.isArray(p.approvals) || JSON.stringify(want) !== JSON.stringify(p.approvals.map(function (e) { return Object.assign(M.emptyApprovalEntry(), e); }))) M.setApprovals(p, want);
    return p.approvals;
  }
  function sync(p) { M.setApprovals(p, p.approvals); touched(); }

  function approverCard(p, st, now) {
    var e = st.entry, i = st.index;
    // The name settles the sign-off item, so the sidebar follows it as typed.
    function edit(k) { return function (v) { entries(p)[i][k] = v; sync(p); if (k === "name") A.refreshNav(); }; }
    function field(label, k, opts) {
      opts = opts || {};
      var input = h(opts.textarea ? "textarea" : "input", { type: opts.textarea ? null : (opts.type || "text"), value: e[k] || "", "data-approval-field": k, placeholder: opts.placeholder || null,
        rows: opts.textarea ? "2" : null, onInput: function (ev) { edit(k)(ev.target.value); } });
      return h("div", { class: "field" }, [U.labelFor(label, input), input]);
    }
    // Approved again: what the approval covers now is what was approved; the
    // keyboard stays on this approver's status line.
    function again() {
      entries(p)[i].fingerprint = now; sync(p); rerender();
      A.focusAfter('[data-approval="' + i + '"] [data-approval-status]');
    }
    var statusLine = null;
    if (st.changed) statusLine = h("div", { class: "val-warn approval-status", "data-approval-status": "changed" }, [
      "Changed since approval: " + E.approvalPartWords(st.parts, st.legacy) + ".  ",
      h("button", { type: "button", class: "btn sm", "data-action": "approved-again", text: "Approved again", onClick: again })
    ]);
    else if (st.unrecorded) statusLine = h("div", { class: "muted approval-status", "data-approval-status": "unrecorded" }, [
      "Approved with no record of what was approved.  ",
      h("button", { type: "button", class: "btn sm", "data-action": "approved-again", text: "Approved again", onClick: again })
    ]);
    else if (st.signed && e.fingerprint) statusLine = h("div", { class: "muted approval-status", "data-approval-status": "unchanged", text: "Unchanged since approval." });
    return h("div", { class: "approval-entry", "data-owner-id": "approval-" + i, "data-approval": String(i) }, [
      h("div", { class: "grid-3" }, [field("Name", "name", { placeholder: "e.g. A. Patel" }), field("Role", "role", { placeholder: "e.g. Plant Manager" }), field("Organisation", "organisation", { placeholder: "e.g. Acme Petrochemicals Ltd" })]),
      field("Scope", "scope", { textarea: true, placeholder: "e.g. Tolerable risk, SL-T and accepted risks" }),
      h("div", { class: "grid-3" }, [field("Date", "date", { type: "date" }), field("Revision", "revision", { placeholder: (p.engagement && p.engagement.revision) ? "e.g. " + p.engagement.revision : "e.g. 1.0" }), h("div")]),
      h("div", { class: "approval-foot" }, [
        h("label", { class: "check-line" }, [h("input", { type: "checkbox", "data-approval-field": "approved", checked: !!e.approved, onChange: function (ev) {
          var x = entries(p)[i];
          x.approved = ev.target.checked;
          x.fingerprint = x.approved ? now : "";
          sync(p); rerender();
        } }), "Approved"]),
        h("button", { type: "button", class: "btn sm danger", "data-action": "remove-approver", "aria-label": "Remove " + (e.name || "approver " + (i + 1)), text: "Remove", onClick: function () {
          if (!confirmRemove(!!(e.name || e.approved), "approver")) return;
          var l = entries(p); l.splice(i, 1); sync(p); rerender();
          // The keyboard goes to the approver now in its place, else the one
          // before it, else + Add approver.
          A.focusAfter(l.length ? '[data-approval="' + Math.min(i, l.length - 1) + '"] [data-approval-field="name"]' : '[data-action="add-approver"]');
        } })
      ]),
      statusLine
    ]);
  }

  function renderApproval(main) {
    var p = state.project, now = E.approvalFingerprint(p), states = E.approvalStates(p);
    main.appendChild(h("h1", { class: "page-title", text: "Approval" }));
    main.appendChild(pageSub("approval", "Record who approved the assessment, and what."));
    main.appendChild(coveredCard(p));
    var kids = states.length ? states.map(function (st) { return approverCard(p, st, now); }) : [h("p", { class: "muted", text: "No approvers recorded." })];
    kids.push(h("div", { class: "btn-row", style: "margin-top:10px" }, [h("button", { type: "button", class: "btn", "data-action": "add-approver", text: "+ Add approver", onClick: function () {
      var l = entries(p); l.push(M.emptyApprovalEntry()); sync(p); rerender(); A.focusAfter('[data-approval="' + (l.length - 1) + '"] [data-approval-field="name"]');
    } })]));
    main.appendChild(card("Approvers", null, kids, null, { "data-check-anchor": "approval" }));
  }

  // A read-only list of the approvals, for the Report page's summaries.
  function approvalSummary(p) {
    var st = E.approvalStates(p);
    var kids = st.length ? [h("ul", { class: "spec-list" }, st.map(function (s) {
      var e = s.entry;
      return h("li", { text: (e.approved ? "Approved by " : "For approval by ") + (e.name || "(name not recorded)") + (e.role ? " (" + e.role + ")" : "") + (e.organisation ? ", " + e.organisation : "") + (e.date ? ", " + e.date : "") + (e.scope ? ": " + e.scope : "") + (s.changed ? " Changed since approval." : "") });
    }))] : [h("p", { class: "muted", text: "No approvers recorded." })];
    kids.push(h("div", { class: "btn-row no-print" }, [h("button", { type: "button", class: "btn sm", text: "Go to step 7", onClick: function () { A.navigate("approval"); } })]));
    return card("Approval / sign-off", null, kids);
  }

  R.Pages.spec = renderSpec;
  R.Pages.approval = renderApproval;
  R.Spec = { approvalSummary: approvalSummary };
}());
