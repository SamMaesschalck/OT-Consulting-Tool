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
      h("p", null, ["The step references were checked against its contents list. The detailed requirement wording has not been checked line by line, and none of the standard's text is reproduced."]),
      h("p", null, ["The risk matrix and SL mapping are SolutionsPT house defaults. A client's own matrix takes precedence."])
    ]));

    main.appendChild(card("Security level definitions", "house summary", [
      h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, [h("th", { text: "SL", style: "width:60px" }), h("th", { text: "Protects against" })])]),
        h("tbody", null, Object.keys(RULES.slDefinitions).filter(function (k) { return k !== "_note"; }).map(function (k) { return h("tr", null, [h("td", { text: "SL" + k }), h("td", { text: RULES.slDefinitions[k] })]); }))
      ])
    ]));

    main.appendChild(card("House risk matrix", "impact × likelihood → risk band", [
      (function () {
        var t = h("table", { class: "tbl" });
        var head = h("tr", null, [h("th", { text: "Impact \\ Likelihood" })].concat(LIK.map(function (l) { return h("th", { text: l.name, class: "center" }); })));
        t.appendChild(h("thead", null, [head]));
        var tb = h("tbody");
        SEV.slice().reverse().forEach(function (sv) {
          tb.appendChild(h("tr", null, [h("td", null, [h("strong", { text: sv.name })])].concat(LIK.map(function (l) { var b = RULES.riskMatrix[sv.id][l.id]; return h("td", { class: "center" }, [riskPill(b)]); }))));
        });
        t.appendChild(tb);
        return t;
      })(),
      h("p", { class: "hint", style: "margin-top:8px", text: "Risk band → suggested SL-T: " + BANDS.map(function (b) { var m = RULES.riskToSL[b.id]; return b.name + " → SL" + m.suggest + (m.escalateTo ? " (can escalate to SL" + m.escalateTo + ")" : ""); }).join("; ") + "." })
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
