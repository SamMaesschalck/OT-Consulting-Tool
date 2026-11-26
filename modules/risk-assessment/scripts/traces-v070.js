/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* The SL-T suggestion traces read back in the words the released v0.7.0
 * build used, for the pages that compare suggestions with the frozen
 * fixtures/slt-suggestions-v0.7.0.js (test-risk-depth.html and
 * test-risk-consequence.html). The 3-2 fixes, step 5, reworded the house
 * traces for SL1 and SL2 (they echoed the standard's wording), and the
 * wording pass (Nov 2026) reworded every trace sentence and the rules' trace,
 * effect and label texts in data/slt-suggestion-rules.json. Only the words
 * are mapped back: every suggestion, band, FR, count and driver still
 * compares as it is. asV070(x) maps every string in x that is one of the
 * traces below and leaves the rest alone.
 */
window.RiskTestTraces = (function () {
  "use strict";
  // The risk-to-SL traces: the rule text now, by band, and the whole v0.7.0 trace.
  var RISK = {
    "low": ["SL1 is a reasonable target, as it protects against mistakes and chance misuse.",
      "Unmitigated risk low: casual-violation protection (SL1) is a reasonable target for this foundational requirement."],
    "medium": ["SL2 is suggested, to protect against a deliberate attacker with general IT skills and simple tools.",
      "Unmitigated risk medium: protect against intentional violation with simple means (SL2)."],
    "high": ["SL3 is suggested, to protect against a deliberate attacker who knows control systems and has purpose-built tools.",
      "Unmitigated risk high: protect against a capable, resourced, IACS-aware attacker (SL3)."],
    "very high": ["SL3 is the working target. SL4 is for a nation-state-grade adversary and needs a deliberate decision.",
      "Unmitigated risk very high: SL3 as the working target; SL4 only where a nation-state-grade adversary is genuinely in scope (flag for a conscious decision rather than defaulting)."]
  };
  function oldRisk(rule) { for (var k in RISK) if (RISK[k][0] === rule) return RISK[k][1]; return null; }
  // The exposure modifiers: [label now, effect now, trace now] and the v0.7.0 line.
  var MODS = [
    ["remote-access", "Permanent or routine remote access (vendor or staff)", "Expect +1 likelihood", "Standing remote access makes a compromise of authentication, use control or data flow more likely.",
      "Permanent or routine remote access (vendor or staff)", "+1 likelihood consideration", "Standing remote access materially raises the likelihood of an authentication/use-control/data-flow compromise."],
    ["internet-adjacent", "Internet-reachable or connected to internet-facing zones", "Expect +1 likelihood", "A zone next to the internet is open to opportunistic and targeted attacks.",
      "Internet-reachable or connected to internet-facing zones", "+1 likelihood consideration", "Internet adjacency exposes the zone to opportunistic and targeted attack."],
    ["wireless", "Wireless links into or within the zone", "Consider +1 likelihood", "Wireless links take the zone boundary beyond the site's physical control.",
      "Wireless links into or within the zone", "consider +1 likelihood", "Wireless extends the boundary beyond physical control."],
    ["removable-media", "Routine removable media use", "Consider +1 likelihood", "Removable media is a known way in that bypasses network countermeasures.",
      "Routine removable media use", "consider +1 likelihood", "Removable media is a proven ingress route that bypasses network countermeasures."],
    ["many-conduits", "Many conduits to less trusted zones", "Consider +1 likelihood", "Each conduit to a less trusted zone is another attack path to control or remove.",
      "Many conduits to less-trusted zones", "consider +1 likelihood", "Each conduit to a less-trusted zone is an attack path to broker or reduce."]
  ];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lcFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  var MOD_LINES = {};
  MODS.forEach(function (m) { MOD_LINES[m[1] + ": " + lcFirst(m[2]) + ". " + m[3]] = cap(m[5]) + " from " + m[0] + " (" + m[4] + "): " + m[6]; });
  var SIS_NOW = "A compromised safety function can cause physical harm directly. Common practice is to give safety systems their own zone and to treat SL3 as their minimum.";
  var SIS_WAS = "Compromise of a safety function is a direct physical-harm path; common practice treats SL3 as the working floor and separation as the default architecture.";
  var MM_NOW = "The SL should resist the adversary you expect. The tool does not raise the suggestion, so decide whether the SL-T should be higher.";
  var MM_WAS = "The SL should resist the adversary you actually expect; a mismatch needs a conscious decision, not an automatic bump.";
  var FIXED = {
    "The client's risk matrix is in use and takes precedence over the house method.": "Client risk matrix in use: it takes precedence over this house heuristic (hard rule).",
    "By the house method, a conduit takes the higher of its own risk-derived SL and the suggested SL of the zones it joins, for each FR.": "House heuristic: a conduit takes the higher of its own risk-derived SL and the connected zones' suggested SL, per FR.",
    "One end is an external party, so the conduit boundary is the point of protection.": "EXT endpoint: external party (the conduit boundary is the protection point)."
  };
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  var RULES = [
    [/^The unmitigated risk for (\w+) is (low|medium|high|very high) \((from \d+ threats?)\)\. (.*)$/, function (m) { var o = oldRisk(m[4]); return o && "Unmitigated risk " + m[2] + " for " + m[1] + " (" + m[3] + "): " + o; }],
    [/^The conduit's own unmitigated risk for (\w+) is (low|medium|high|very high)\. (.*)$/, function (m) { var o = oldRisk(m[3]); return o && "Conduit's own unmitigated risk " + m[2] + " for " + m[1] + ": " + o; }],
    [/^Raising (\w+) to SL(\d) is an option only if a nation-state-grade adversary is in scope\.$/, function (m) { return "Escalation to SL" + m[2] + " available for " + m[1] + " only if a nation-state-grade adversary is in scope."; }],
    [/^No threat affecting (\w+) is recorded yet\.$/, function (m) { return "No threats affecting " + m[1] + " captured yet."; }],
    [/^The zone is safety related, but the SL(\d) floor does not cover (\w+) in this assessment\.$/, function (m) { return "Safety related: the SL" + m[1] + " floor does not cover " + m[2] + " in this assessment."; }],
    [new RegExp("^The zone is safety related, so the SL(\\d) floor applies\\. " + esc(SIS_NOW) + "$"), function (m) { return "SL" + m[1] + " floor applied (SIS present): " + SIS_WAS; }],
    [/^The zone is safety related and the suggestion already meets the SL(\d) floor\.$/, function (m) { return "SIS present: SL" + m[1] + " floor already met."; }],
    [new RegExp("^The assumed adversary class \\(SL(\\d)-grade\\) is above the suggested SL(\\d) for (\\w+)\\. " + esc(MM_NOW) + "$"), function (m) { return "Mismatch: the assumed adversary class (SL" + m[1] + "-grade) exceeds the suggested SL" + m[2] + " for " + m[3] + ": " + MM_WAS; }],
    [/^([ZC]\d+(?: \(.*\))?) suggests SL(\d) for (\w+)\.$/, function (m) { return "Inherits SL" + m[2] + " for " + m[3] + " from " + m[1] + "."; }],
    [/^Neither a threat nor a connected zone gives a suggestion for (\w+) yet\.$/, function (m) { return "No threats or connected-zone suggestion for " + m[1] + " yet."; }]
  ];
  function one(s) {
    if (Object.prototype.hasOwnProperty.call(FIXED, s)) return FIXED[s];
    if (Object.prototype.hasOwnProperty.call(MOD_LINES, s)) return MOD_LINES[s];
    for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(s); if (m) { var r = RULES[i][1](m); if (r) return r; } }
    return s;
  }
  function asV070(x) {
    if (typeof x === "string") return one(x);
    if (Array.isArray(x)) return x.map(asV070);
    if (x && typeof x === "object") { var o = {}; Object.keys(x).forEach(function (k) { o[k] = asV070(x[k]); }); return o; }
    return x;
  }
  return { asV070: asV070 };
}());
