/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui-about.js — the About & framing page (about).
 *
 * What the tool covers of the standard (built from the ZCR lookup), the SL
 * definitions, the house risk matrix, the exposure modifiers and special
 * rules, the hard rules, the interchange, and the licence notice. Registers
 * itself in RiskApp.Pages.
 */
(function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, U = R.UI;
  var RULES = M.RULES, SEV = M.SEV, LIK = M.LIK, BANDS = M.BANDS, MODS = M.MODS, ZCR = M.ZCR, INTERCHANGE = M.INTERCHANGE, VERSION = M.VERSION;
  var ZCR_COVERED = M.ZCR_COVERED, ZCR_LATER = M.ZCR_LATER;
  var h = U.h, card = U.card, riskPill = U.riskPill, listOf = U.listOf;

  function renderAbout(main) {
    main.appendChild(h("h1", { class: "page-title", text: "About & framing" }));
    main.appendChild(h("p", { class: "page-sub", text: VERSION.product + " (zones & conduits) " + VERSION.label + " (version " + VERSION.number + ")" }));

    main.appendChild(card("What the tool does", null, [
      h("p", null, ["The workflow follows the order of the published " + ZCR.standard.id + " and covers " + listOf(ZCR_COVERED.map(function (r) { return r.id; })) + "."
        + (ZCR_LATER.length ? " " + listOf(ZCR_LATER.map(function (r) { return r.id; })) + (ZCR_LATER.length === 1 ? " is not yet a step of its own." : " are not yet steps of their own.") : "")]),
      h("p", null, ["The step references have been checked against the standard's contents list, and the requirement wording against the published edition. The tool says where it uses a house method, and none of the standard's text is reproduced."]),
      h("p", null, ["The risk matrix and the risk-to-SL mapping are SolutionsPT defaults and part of the house method. If the client has its own risk matrix, that one is used."]),
      h("p", { "data-method": "depth" }, ["The risk comparison is made once, for the SUC, and then every zone and conduit is assessed. The tool suggests how deeply to assess each one from its own initial risk, which is a house method."]),
      h("p", { "data-method": "unmitigated" }, ["Unmitigated risk is rated before any cyber security countermeasure. Countermeasures built into the components still count. So does protection outside cyber security, such as controlled site access, hardwired interlocks and relief devices."]),
      h("p", { "data-method": "decisions" }, ["A threat above tolerable risk is reduced with countermeasures, accepted, transferred to another party, or treated through the SL-T programme. Treating a risk through the SL-T programme is a house method. A transfer does not change the rating. If reducing the risk or treating it through the SL-T leaves it above tolerable risk, the asset owner accepts what remains."]),
      h("p", { "data-method": "mandatory" }, ["By the house reading, the mandatory security countermeasures are the ones that a decision to reduce a risk, or to treat it through the SL-T, relies on."])
    ]));

    main.appendChild(card("Security level definitions", "SolutionsPT summary", [
      h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, [h("th", { text: "SL", style: "width:60px" }), h("th", { text: "Protects against" })])]),
        h("tbody", null, Object.keys(RULES.slDefinitions).filter(function (k) { return k !== "_note"; }).map(function (k) { return h("tr", null, [h("td", { text: "SL" + k }), h("td", { text: RULES.slDefinitions[k] })]); }))
      ])
    ]));

    main.appendChild(card("SolutionsPT risk matrix (house method)", "the risk band for each impact and likelihood", [
      (function () {
        // The house criteria (criteriaOf with no project); a project's own
        // are on step 1.
        var hc = M.criteriaOf(null);
        var t = h("table", { class: "tbl" });
        var head = h("tr", null, [h("th", { text: "Impact \\ Likelihood" })].concat(hc.likelihood.map(function (l) { return h("th", { text: l.name, class: "center" }); })));
        t.appendChild(h("thead", null, [head]));
        var tb = h("tbody");
        hc.impact.slice().reverse().forEach(function (sv) {
          tb.appendChild(h("tr", null, [h("td", null, [h("strong", { text: sv.name })])].concat(hc.likelihood.map(function (l) { var b = hc.matrix[sv.id][l.id]; return h("td", { class: "center" }, [riskPill(b)]); }))));
        });
        t.appendChild(tb);
        return t;
      })(),
      h("p", { class: "hint", style: "margin-top:8px", text: "The house method suggests an SL-T for each risk band: " + BANDS.map(function (b) { var m = RULES.riskToSL[b.id]; return b.name + " SL" + m.suggest + (m.escalateTo ? " (can escalate to SL" + m.escalateTo + ")" : ""); }).join(", ") + "." }),
      h("p", { class: "hint", "data-method": "via", text: "By the house method, a scenario's unmitigated risk also suggests an SL-T for each zone or conduit it passes through, on the FRs it affects. The tool flags a route that crosses between two zones with no conduit joining them." }),
      h("p", { class: "hint", "data-method": "grouped", text: "By the house method, a zone or conduit grouped with another takes the higher of the two suggestions on each FR." })
    ]));

    main.appendChild(card("Exposure modifiers & special rules", null, [
      h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, [h("th", { text: "Flag" }), h("th", { text: "Effect" }), h("th", { text: "FRs" }), h("th", { text: "Why" })])]),
        h("tbody", null, MODS.map(function (m) { return h("tr", null, [h("td", { text: m.label }), h("td", { text: m.effect }), h("td", { text: (m.affectsFR || []).join(", ") }), h("td", { text: m.trace })]); }))
      ]),
      h("div", { class: "spacer-12" }),
      h("p", null, [h("strong", { text: "Special rules: " }), RULES.specialRules.map(function (r) { return r.label + ": " + r.trace; }).join(" ")])
    ]));

    main.appendChild(card("Hard rules", null, [h("ul", null, RULES.hardRules.map(function (r) { return h("li", { text: r }); }))]));

    main.appendChild(card("Interchange with the assessment tool", null, [
      h("p", null, ["“Export risk context” writes a ", h("strong", { text: INTERCHANGE.schema }), " file. The assessment tool's 62443-3-3 instrument imports it to scope the assessment by zone, with each zone's SL-T pre-set."])
    ]));

    main.appendChild(card("Copyright and licence", null, [h("p", { text: U.LEGAL_NOTICE })]));
  }

  R.Pages.about = renderAbout;
}());
