/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-zones.js — step 3, Zones and conduits (zones).
 *
 * The drawing on top (a zone's box opens the zone), compact tables of the
 * zones and the conduits, and one selected zone or conduit in a detail panel:
 * its assets (pasted several at a time if wanted), its safety designation,
 * the separation rows the tool has raised for it (js/engine.js
 * separationRows) and, collapsed, its characteristics. Registers itself in
 * RiskApp.Pages; js/app.js goToItem selects the item an entry of the
 * completeness list names (RiskApp.ZonesPage.select) before drawing it.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, U = R.UI, A = R.App;
  var SIS_RULE = M.SIS_RULE, ASSET_TYPES = M.ASSET_TYPES;
  var state = A.state, touched = A.touched, rerender = A.rerender;
  var h = U.h, card = U.card, toast = U.toast, textField = U.textField, lineListField = U.lineListField,
    pageSub = U.pageSub, confirmRemove = U.confirmRemove, flagEditor = U.flagEditor, renderZoneMap = U.renderZoneMap;

  // What the page has open: the selected zone or conduit, whether its
  // characteristics are expanded, and the paste box with what is typed in it.
  var sel = { kind: null, id: null, chars: false, paste: false, pasteText: "" };
  function select(kind, id) {
    if (sel.kind !== kind || sel.id !== id) { sel.chars = false; sel.paste = false; sel.pasteText = ""; }
    sel.kind = kind; sel.id = id;
  }
  function findConduit(p, id) { return p.conduits.filter(function (c) { return c.id === id; })[0] || null; }
  // The selected item, or the first zone (else conduit) when none is.
  function selected(p) {
    var o = sel.kind === "zone" ? E.findZone(p, sel.id) : (sel.kind === "conduit" ? findConduit(p, sel.id) : null);
    if (o) return o;
    if (p.zones.length) { select("zone", p.zones[0].id); return p.zones[0]; }
    if (p.conduits.length) { select("conduit", p.conduits[0].id); return p.conduits[0]; }
    sel.kind = null; sel.id = null;
    return null;
  }
  function pick(kind, id) { select(kind, id); rerender(); }

  // Optional fields: written once set, gone again when cleared.
  function setText(o, k, v) { if (v) o[k] = v; else delete o[k]; touched(); }
  function setLines(o, k, a) { if (a.length) o[k] = a; else delete o[k]; touched(); }
  function checkLine(text, checked, onChange, attrs) {
    return h("label", { class: "check-line" }, [h("input", Object.assign({ type: "checkbox", checked: checked, onChange: function (e) { onChange(e.target.checked); } }, attrs || {})), text]);
  }
  function selectOf(value, options, onChange, attrs) {
    var s = h("select", Object.assign({ onChange: function (e) { onChange(e.target.value); } }, attrs || {}));
    options.forEach(function (o) { var op = h("option", { value: o.value, text: o.text }); if (String(value || "") === String(o.value)) op.setAttribute("selected", "selected"); s.appendChild(op); });
    return s;
  }
  function ends(c) { return (c.fromZone || "?") + " ↔ " + (c.toZone || "?"); }

  // ---------- The tables ----------

  function pickButton(kind, o) {
    var on = sel.kind === kind && sel.id === o.id;
    return h("button", { type: "button", class: "link-btn", "data-action": "pick-" + o.id, "aria-pressed": on ? "true" : "false",
      "aria-label": "Open " + o.id, text: o.id, onClick: function (e) { e.stopPropagation(); pick(kind, o.id); } });
  }
  function zoneStatus(p, z) {
    var bits = [], rows = E.separationRows(z, p);
    if (E.zoneSafety(z)) bits.push(h("span", { class: "pill flag", text: "Safety related" }));
    var open = rows.filter(function (r) { return r.open || r.reasonMissing; }).length;
    if (open) bits.push(h("span", { class: "pill neutral val-warn", text: open + " to answer" }));
    else if (rows.some(function (r) { return r.answer === "not-separated"; })) bits.push(h("span", { class: "pill neutral", text: "Not separated" }));
    return bits;
  }
  function zonesTable(p) {
    var body = [];
    if (p.zones.length) {
      var tb = h("tbody");
      p.zones.forEach(function (z) {
        var on = sel.kind === "zone" && sel.id === z.id;
        tb.appendChild(h("tr", { class: "pick-row" + (on ? " selected" : ""), "data-zone-row": z.id, onClick: function () { pick("zone", z.id); } }, [
          h("td", null, [pickButton("zone", z)]),
          h("td", { text: z.name || "" }),
          h("td", { class: "center", text: String(z.assets.length) }),
          h("td", null, zoneStatus(p, z))
        ]));
      });
      body.push(h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [
        h("th", { text: "Zone", style: "width:64px" }), h("th", { text: "Name" }), h("th", { text: "Assets", class: "center", style: "width:60px" }), h("th", { text: "" })
      ])]), tb]));
    } else body.push(h("p", { class: "muted", text: "No zones yet." }));
    body.push(h("div", { class: "btn-row", style: "margin-top:10px" }, [
      h("button", { type: "button", class: "btn primary", "data-action": "add-zone", text: "+ Add zone", onClick: function () {
        p.counters.zone += 1; var z = M.emptyZone(p.counters.zone); p.zones.push(z); select("zone", z.id); touched(); rerender();
      } })
    ]));
    return card("Zones", null, body);
  }
  function conduitsTable(p) {
    var body = [];
    if (p.conduits.length) {
      var tb = h("tbody");
      p.conduits.forEach(function (c) {
        var on = sel.kind === "conduit" && sel.id === c.id;
        var marks = M.CONDUIT_MARKERS.filter(function (k) { return k === "external" ? E.conduitExternal(c) : !!c[k]; }).map(function (k) { return MARKER_SHORT[k]; });
        tb.appendChild(h("tr", { class: "pick-row" + (on ? " selected" : ""), "data-conduit-row": c.id, onClick: function () { pick("conduit", c.id); } }, [
          h("td", null, [pickButton("conduit", c)]),
          h("td", { text: ends(c) }),
          h("td", { text: c.name || "" }),
          h("td", { class: "muted", text: marks.join(", ") })
        ]));
      });
      body.push(h("table", { class: "tbl compact" }, [h("thead", null, [h("tr", null, [
        h("th", { text: "Conduit", style: "width:64px" }), h("th", { text: "Ends", style: "width:110px" }), h("th", { text: "Name" }), h("th", { text: "" })
      ])]), tb]));
    } else body.push(h("p", { class: "muted", text: "No conduits yet: add one for each connection between zones or to EXT." }));
    body.push(h("div", { class: "btn-row", style: "margin-top:10px" }, [
      h("button", { type: "button", class: "btn", "data-action": "add-conduit", text: "+ Add conduit", onClick: function () {
        p.counters.conduit += 1; var c = M.emptyConduit(p.counters.conduit); p.conduits.push(c); select("conduit", c.id); touched(); rerender();
      } })
    ]));
    return card("Conduits", "EXT is outside the SUC", body);
  }
  var MARKER_SHORT = { wireless: "wireless", external: "external", temporary: "temporary" };

  // ---------- A zone ----------

  var LINK_OPTS = [{ value: "", text: "Fixed" }, { value: "wireless", text: "Wireless" }, { value: "temporary", text: "Temporarily connected" }];
  // After an asset is added or removed, the keyboard goes to an asset's name
  // (the one added, or the one now in the removed one's place), else to + Add asset.
  function focusAsset(i) {
    var d = '[data-detail="zone"] ';
    A.focusAfter(d + '[data-asset-name="' + i + '"]');
    var m = document.getElementById("main");
    if (m && !m.querySelector(d + '[data-asset-name="' + i + '"]')) A.focusAfter(d + '[data-action="add-asset"]');
  }
  function assetsField(z) {
    var box = h("div", { class: "assets" });
    z.assets.forEach(function (a, ai) {
      box.appendChild(h("div", { class: "asset-row" }, [
        h("input", { type: "text", value: a.name, placeholder: "Asset name", "aria-label": "Asset name", "data-asset-name": String(ai), onInput: function (e) { a.name = e.target.value; touched(); } }),
        selectOf(a.type, ASSET_TYPES.map(function (t) { return { value: t, text: E.assetTypeLabel(t) }; }), function (v) { a.type = v; touched(); rerender(); }, { "aria-label": "Asset type" }),
        selectOf(a.link || "", LINK_OPTS, function (v) { if (v) a.link = v; else delete a.link; touched(); rerender(); }, { "aria-label": "Connection", class: "asset-link" }),
        h("button", { type: "button", class: "btn sm danger", "aria-label": "Remove " + (a.name || "asset " + (ai + 1)), text: "Remove", onClick: function () {
          if (!confirmRemove(!!a.name, "asset")) return;
          z.assets.splice(ai, 1); R.Migrate.pruneDangling(state.project); touched(); rerender();
          focusAsset(Math.min(ai, z.assets.length - 1));
        } })
      ]));
    });
    var row = h("div", { class: "btn-row" }, [
      h("button", { type: "button", class: "btn sm", "data-action": "add-asset", text: "+ Add asset", onClick: function () { z.assets.push(M.newAsset(state.project)); touched(); rerender(); focusAsset(z.assets.length - 1); } }),
      sel.paste ? null : h("button", { type: "button", class: "btn sm", "data-action": "paste-open", text: "Paste several", onClick: function () { sel.paste = true; rerender(); A.focusAfter('[data-action="paste-text"]'); } })
    ]);
    box.appendChild(row);
    if (sel.paste) {
      var ta = h("textarea", { "data-action": "paste-text", rows: "5", value: sel.pasteText, "aria-label": "Assets, one per line",
        placeholder: "PLC-101\tPLC\nMaintenance laptop\tEngineering workstation\tTemporary",
        onInput: function (e) { sel.pasteText = e.target.value; } });
      box.appendChild(h("div", { class: "paste-box" }, [
        ta,
        h("div", { class: "hint", text: "One per line. Optional tab-separated columns: type, connection." }),
        h("div", { class: "btn-row", style: "margin-top:6px" }, [
          h("button", { type: "button", class: "btn sm primary", "data-action": "paste-add", text: "Add", onClick: function () {
            var list = E.parseAssets(sel.pasteText), first = z.assets.length;
            list.forEach(function (a) { z.assets.push(M.newAsset(state.project, a)); });
            sel.paste = false; sel.pasteText = "";
            if (list.length) touched();
            rerender();
            if (list.length) focusAsset(first); else A.focusAfter('[data-detail="zone"] [data-action="paste-open"]');
            toast((list.length ? list.length + " asset" + (list.length === 1 ? "" : "s") + " added" : "Nothing to add") + (list.headerSkipped ? ", header row skipped." : "."));
          } }),
          h("button", { type: "button", class: "btn sm", "data-action": "paste-cancel", text: "Cancel", onClick: function () { sel.paste = false; sel.pasteText = ""; rerender(); A.focusAfter('[data-detail="zone"] [data-action="paste-open"]'); } })
        ])
      ]));
    }
    return h("div", { class: "field" }, [h("label", { text: "Assets" }), box]);
  }

  function setSeparation(z, id, patch) {
    var all = z.separation && typeof z.separation === "object" ? z.separation : {};
    var r = Object.assign({ answer: null, reason: "" }, all[id] || {}, patch);
    if (!r.answer && !r.reason) delete all[id]; else all[id] = r;
    if (Object.keys(all).length) z.separation = all; else delete z.separation;
  }
  var SEP_CHOICES = [{ v: "met", text: "Met" }, { v: "not-separated", text: "Not separated" }];
  function separationField(p, z) {
    var rows = E.separationRows(z, p);
    if (!rows.length) return null;
    return h("div", { class: "field sep-rows" }, [h("label", { text: "Separation" })].concat(rows.map(function (r) {
      var kids = [
        h("div", { class: "sep-head" }, [h("strong", { text: r.label }), h("span", { class: "muted", text: " " + r.why })]),
        h("div", { class: "treat-opts", role: "group", "aria-label": r.label }, SEP_CHOICES.map(function (c) {
          var on = r.answer === c.v;
          return h("button", { type: "button", class: "treat-opt" + (on ? " on" : ""), "data-separation": r.id + ":" + c.v, "aria-pressed": on ? "true" : "false",
            text: (on ? "✓ " : "") + c.text,
            onClick: function () { setSeparation(z, r.id, { answer: on ? null : c.v }); touched(); rerender(); } });
        }))
      ];
      if (r.answer || r.reason) {
        kids.push(A.changeRedraw(h("input", { type: "text", class: "sep-reason", "data-reason": "sep-" + r.id, value: r.reason, "aria-label": "Reason: " + r.label,
          placeholder: r.answer === "not-separated" ? "Why not, and what makes up for it" : "How (optional)",
          onInput: function (e) { setSeparation(z, r.id, { reason: e.target.value }); touched(); } })));
      }
      if (r.reasonMissing) kids.push(h("div", { class: "hint val-warn", text: "Give a reason." }));
      return h("div", { class: "sep-row", "data-part": "sep-" + r.id, "data-sep-state": r.answer || "open" }, kids);
    })));
  }

  function characteristics(kids) {
    var det = h("details", { class: "chars" }, [h("summary", { text: "Characteristics" }), h("div", { class: "chars-body" }, kids)]);
    if (sel.chars) det.open = true;
    det.addEventListener("toggle", function () { sel.chars = det.open; });
    return det;
  }

  function zoneDetail(p, z) {
    var systems = M.hlaIdsOf(z).map(function (id) { return E.hlaById(p, id); }).filter(Boolean);
    var safetyByAsset = !z.flags["sis-present"] && E.zoneSafety(z);
    var kids = [
      systems.length ? h("p", { class: "muted zone-systems", style: "margin-top:0", text: "Ranked systems: " + systems.map(function (a) { return a.id + (a.name ? " " + a.name : ""); }).join("; ") }) : null,
      h("div", { class: "grid-2" }, [
        textField("Zone name", z.name, function (v) { z.name = v; touched(); }),
        textField("Function", z.fn, function (v) { z.fn = v; touched(); }, { placeholder: "e.g. basic process control, safety, DMZ" })
      ]),
      textField("Description / logical boundary", z.description, function (v) { z.description = v; touched(); }, { textarea: true }),
      h("div", { class: "field" }, [
        h("label", { text: "Safety designation" }),
        checkLine("Safety related", !!z.flags["sis-present"] || safetyByAsset, function (v) { z.flags["sis-present"] = v; touched(); rerender(); },
          safetyByAsset ? { disabled: "disabled", "data-action": "safety" } : { "data-action": "safety" }),
        h("div", { class: "hint", text: safetyByAsset ? "It holds a safety PLC." : "Sets an SL" + (SIS_RULE ? SIS_RULE.floorSL : 3) + " floor on every requirement." })
      ]),
      assetsField(z),
      separationField(p, z),
      characteristics([
        textField("Accountable organisation", z.accountableOrg, function (v) { setText(z, "accountableOrg", v); }, { placeholder: "e.g. Acme Petrochemicals, Unit 300 operations" }),
        textField("Physical boundary", z.physicalBoundary, function (v) { setText(z, "physicalBoundary", v); }, { textarea: true, placeholder: "e.g. Rack room B and the unit 300 control room" }),
        h("div", { class: "grid-2" }, [
          lineListField("Logical access points and boundary devices", z.accessPoints, function (a) { z.accessPoints = a; touched(); }, "e.g. Vendor VPN (C2); Historian replication (C3)"),
          lineListField("Physical access points", M.listOf(z.physicalAccessPoints), function (a) { setLines(z, "physicalAccessPoints", a); }, "e.g. Rack room door, badge controlled")
        ]),
        h("div", { class: "grid-2" }, [
          lineListField("Data flows", M.listOf(z.dataFlows), function (a) { setLines(z, "dataFlows", a); }, "e.g. Process values to the historian (C3)"),
          lineListField("External dependencies", z.externalDependencies, function (a) { z.externalDependencies = a; touched(); }, "e.g. Vendor support contract")
        ]),
        h("div", { class: "grid-2" }, [
          lineListField("Applicable security policies", z.securityPolicies, function (a) { z.securityPolicies = a; touched(); }, "e.g. No engineering changes without MoC"),
          lineListField("Assumptions", M.listOf(z.assumptions), function (a) { setLines(z, "assumptions", a); }, "e.g. The rack room is locked outside shifts")
        ]),
        flagEditor(z, { noSafety: true })
      ])
    ];
    return card(z.id + (z.name ? ": " + z.name : ""), E.zoneSafety(z) ? "safety related" : null, kids,
      h("button", { type: "button", class: "btn sm danger", text: "Remove zone", onClick: function () {
        if (!confirm("Remove zone " + z.id + (z.name ? " (" + z.name + ")" : "") + "? Conduits referencing it will also be removed.")) return;
        p.zones.splice(p.zones.indexOf(z), 1);
        p.conduits = p.conduits.filter(function (c) { return c.fromZone !== z.id && c.toZone !== z.id; });
        R.Migrate.pruneDangling(p);
        sel.kind = null; sel.id = null;
        touched(); rerender();
      } }), { "data-owner-id": z.id, "data-detail": "zone" });
  }

  // ---------- A conduit ----------

  function conduitDetail(p, c) {
    function zoneOpts() {
      return [{ value: "", text: "Not set" }].concat(p.zones.map(function (z) { return { value: z.id, text: z.id + (z.name ? " " + z.name : "") }; }), [{ value: "EXT", text: "EXT (external)" }]);
    }
    function labelled(label, control) { return h("div", { class: "field" }, [U.labelFor(label, control), control]); }
    function endField(label, key) {
      return labelled(label, selectOf(c[key], zoneOpts(), function (v) { c[key] = v; touched(); rerender(); }, { "data-end": key }));
    }
    var a = c.fromZone || "from", b = c.toZone || "to";
    var dirOpts = [{ value: "", text: "Not set" }, { value: "both", text: "Both ways" }, { value: "from-to", text: "One way, " + a + " to " + b }, { value: "to-from", text: "One way, " + b + " to " + a }];
    var extByEnd = c.fromZone === "EXT" || c.toZone === "EXT";
    var external = E.conduitExternal(c);
    function marker(k, text, attrs) {
      return checkLine(text, k === "external" ? external : !!c[k], function (v) { if (v) c[k] = true; else delete c[k]; touched(); rerender(); }, Object.assign({ "data-marker": k }, attrs || {}));
    }
    var kids = [
      h("div", { class: "grid-3" }, [
        endField("From", "fromZone"), endField("To", "toZone"),
        textField("Name", c.name, function (v) { c.name = v; touched(); })
      ]),
      textField("Channels and protocols", c.channels.join(", "), function (v) { c.channels = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); touched(); }, { placeholder: "e.g. OPC UA, Modbus TCP, VPN", hint: "Separate with commas." }),
      characteristics([
        h("div", { class: "grid-2" }, [
          labelled("Direction", selectOf(c.direction || "", dirOpts, function (v) { if (v) c.direction = v; else delete c.direction; touched(); rerender(); }, { "data-action": "direction" })),
          lineListField("Boundary devices", M.listOf(c.boundaryDevices), function (list) { setLines(c, "boundaryDevices", list); }, "e.g. DMZ firewall FW-01")
        ]),
        h("div", { class: "field" }, [
          h("label", { text: "Connection" }),
          h("div", { class: "flag-grid" }, [
            marker("wireless", "Wireless"),
            marker("external", "External network", extByEnd ? { disabled: "disabled" } : null),
            marker("temporary", "Temporarily connected")
          ]),
          extByEnd ? h("div", { class: "hint", text: "External: one end is EXT." }) : null
        ]),
        external ? textField("External party", c.externalParty, function (v) { setText(c, "externalParty", v); }, { placeholder: "e.g. Control system vendor support" }) : null,
        textField("Notes", c.notes, function (v) { c.notes = v; touched(); })
      ])
    ];
    return card(c.id + (c.name ? ": " + c.name : "") + " (" + ends(c) + ")", null, kids,
      h("button", { type: "button", class: "btn sm danger", text: "Remove conduit", onClick: function () {
        var filled = !!(c.name || c.fromZone || c.toZone || (c.channels && c.channels.length) || c.notes || c.threats.length || c.vulnerabilities.length || c.countermeasures.length);
        if (!confirmRemove(filled, "conduit " + c.id)) return;
        p.conduits.splice(p.conduits.indexOf(c), 1);
        sel.kind = null; sel.id = null;
        touched(); rerender();
        if (filled) toast("Conduit " + c.id + " removed.");
      } }), { "data-owner-id": c.id, "data-detail": "conduit" });
  }

  // ---------- The page ----------

  function renderZones(main) {
    var p = state.project;
    main.appendChild(h("h1", { class: "page-title", text: "Zones and conduits" }));
    main.appendChild(pageSub("zones", "Partition the SUC into zones and conduits, and answer the separation rows raised."));
    main.appendChild(card("Zone and conduit drawing", p.zones.length ? "select a zone to open it" : null, [renderZoneMap(p, function (id) { pick("zone", id); A.focusAfter('[data-detail="zone"] h2'); })]));
    var o = selected(p);
    var detail = o ? (sel.kind === "zone" ? zoneDetail(p, o) : conduitDetail(p, o))
      : card("Nothing selected", null, [h("p", { class: "muted", text: "Add a zone to start." })]);
    main.appendChild(h("div", { class: "zones-layout" }, [
      h("div", { class: "zones-lists" }, [zonesTable(p), conduitsTable(p)]),
      h("div", { class: "zones-detail" }, [detail])
    ]));
  }

  R.Pages.zones = renderZones;
  R.ZonesPage = {
    // Opens a zone or conduit when the page next draws (Go to, Assign to zone).
    select: function (kind, id) { if ((kind === "zone" || kind === "conduit") && id) select(kind, id); },
    selection: function () { return { kind: sel.kind, id: sel.id, chars: sel.chars }; }
  };
}());
