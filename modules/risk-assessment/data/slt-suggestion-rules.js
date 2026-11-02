/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/slt-suggestion-rules.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.sltRules = {
  "schema": "spt-slt-suggestion/2.0",
  "_note": "SL-T suggestion heuristic for the risk tool, now driven by a two-axis risk model (likelihood x impact) per the IEC 62443-3-2 detailed-risk-assessment process (Clause 4.5/4.6). HOUSE HEURISTIC: 62443-3-2 does NOT prescribe a risk matrix or a risk-to-SL mapping; it requires the organisation's own risk criteria and tolerable-risk threshold. Every table below is a transparent SolutionsPT default, NOT reproduced from the standard. The tool always shows the rule trace; the consultant always sets the final SL-T (per foundational requirement) with a written justification. Where the client has their own corporate risk matrix, it takes precedence (hardRules).",
  "slDefinitions": {
    "_note": "Paraphrased from the widely published 62443 SL attacker-class definitions.",
    "1": "Protection against casual or coincidental violation.",
    "2": "Protection against intentional violation using simple means, low resources, generic skills, low motivation.",
    "3": "Protection against intentional violation using sophisticated means, moderate resources, IACS-specific skills, moderate motivation.",
    "4": "Protection against intentional violation using sophisticated means, extended resources, IACS-specific skills, high motivation."
  },
  "foundationalRequirements": [
    { "id": "IAC", "fr": "FR1", "name": "Identification & authentication control" },
    { "id": "UC",  "fr": "FR2", "name": "Use control" },
    { "id": "SI",  "fr": "FR3", "name": "System integrity" },
    { "id": "DC",  "fr": "FR4", "name": "Data confidentiality" },
    { "id": "RDF", "fr": "FR5", "name": "Restricted data flow" },
    { "id": "TRE", "fr": "FR6", "name": "Timely response to events" },
    { "id": "RA",  "fr": "FR7", "name": "Resource availability" }
  ],
  "consequenceCategories": [
    { "id": "safety",        "name": "Safety (injury / loss of life)" },
    { "id": "environmental", "name": "Environmental release / damage" },
    { "id": "operational",   "name": "Loss of production / essential function" },
    { "id": "financial",     "name": "Financial loss" },
    { "id": "regulatory",    "name": "Regulatory / legal exposure" }
  ],
  "severityScale": [
    { "id": "negligible", "name": "Negligible", "rank": 0, "note": "No meaningful safety, environmental, operational, financial or regulatory effect." },
    { "id": "minor",      "name": "Minor",      "rank": 1, "note": "First-aid / short outage / small cost / minor reportable; recoverable within a shift." },
    { "id": "serious",    "name": "Serious",    "rank": 2, "note": "Injury, reportable release, multi-shift outage, material cost, or regulatory action." },
    { "id": "severe",     "name": "Severe",     "rank": 3, "note": "Loss of life, major release, loss of an essential function, or catastrophic cost/regulatory exposure." }
  ],
  "likelihoodScale": [
    { "id": "low",    "name": "Low",    "rank": 0, "note": "House default: no known history; would require an unlikely combination of access, capability and intent." },
    { "id": "medium", "name": "Medium", "rank": 1, "note": "House default: plausible given the exposure and a capable adversary; occurrence would not be surprising over the system's life." },
    { "id": "high",   "name": "High",   "rank": 2, "note": "House default: known-exploited path, weak or absent controls, or an actively targeted asset; expected without intervention." }
  ],
  "riskMatrix": {
    "_note": "HOUSE risk matrix (unmitigated/residual risk = impact severity x likelihood). NOT the 62443-3-2 example matrix. Bands: low, medium, high, very-high. Tune per engagement or replace wholesale with the client's corporate matrix.",
    "negligible": { "low": "low",    "medium": "low",    "high": "low" },
    "minor":      { "low": "low",    "medium": "medium", "high": "medium" },
    "serious":    { "low": "medium", "medium": "high",   "high": "high" },
    "severe":     { "low": "high",   "medium": "high",   "high": "very-high" }
  },
  "riskBands": [
    { "id": "low",       "name": "Low",       "rank": 0 },
    { "id": "medium",    "name": "Medium",    "rank": 1 },
    { "id": "high",      "name": "High",      "rank": 2 },
    { "id": "very-high", "name": "Very high", "rank": 3 }
  ],
  "riskToSL": {
    "_note": "HOUSE mapping from an unmitigated per-FR risk band to a suggested SL-T for that foundational requirement. 62443-3-2 leaves this to the organisation's security policy and consequence analysis (def. 3.1.39).",
    "low":       { "suggest": 1, "trace": "Unmitigated risk low: casual-violation protection (SL1) is a reasonable target for this foundational requirement." },
    "medium":    { "suggest": 2, "trace": "Unmitigated risk medium: protect against intentional violation with simple means (SL2)." },
    "high":      { "suggest": 3, "trace": "Unmitigated risk high: protect against a capable, resourced, IACS-aware attacker (SL3)." },
    "very-high": { "suggest": 3, "escalateTo": 4, "trace": "Unmitigated risk very high: SL3 as the working target; SL4 only where a nation-state-grade adversary is genuinely in scope (flag for a conscious decision rather than defaulting)." }
  },
  "tolerableRisk": {
    "_note": "The organisation's tolerable risk (62443-3-2 clause 4.3.6) is the highest unmitigated risk band accepted WITHOUT additional countermeasures. Any FR/threat whose unmitigated risk exceeds it must be treated (clause 4.6 -> 4.7). Default here is a placeholder; capture the client's real threshold.",
    "default": "medium"
  },
  "exposureModifiers": [
    { "id": "remote-access",     "label": "Permanent or routine remote access (vendor or staff)", "effect": "+1 likelihood consideration", "affectsFR": ["IAC", "UC", "RDF"], "trace": "Standing remote access materially raises the likelihood of an authentication/use-control/data-flow compromise." },
    { "id": "internet-adjacent", "label": "Internet-reachable or connected to internet-facing zones", "effect": "+1 likelihood consideration", "affectsFR": ["IAC", "SI", "RDF", "RA"], "trace": "Internet adjacency exposes the zone to opportunistic and targeted attack." },
    { "id": "wireless",          "label": "Wireless links into or within the zone", "effect": "consider +1 likelihood", "affectsFR": ["IAC", "RDF"], "trace": "Wireless extends the boundary beyond physical control." },
    { "id": "removable-media",   "label": "Routine removable media use", "effect": "consider +1 likelihood", "affectsFR": ["SI", "RDF"], "trace": "Removable media is a proven ingress route that bypasses network controls." },
    { "id": "many-conduits",     "label": "Many conduits to less-trusted zones", "effect": "consider +1 likelihood", "affectsFR": ["RDF", "SI"], "trace": "Each conduit to a less-trusted zone is an attack path to broker or reduce." }
  ],
  "specialRules": [
    {
      "id": "sis-present",
      "label": "Zone contains SIS / safety instrumented function",
      "floorSL": 3,
      "actions": [
        "Prompt: safety systems normally warrant their own zone, separated from basic process control (clause 4.4.5).",
        "Apply an SL3 floor to every foundational requirement for any zone containing a safety function.",
        "Mark zone safetyRelated: true (carried into the interchange export)."
      ],
      "trace": "Compromise of a safety function is a direct physical-harm path; common practice treats SL3 as the working floor and separation as the default architecture."
    },
    {
      "id": "adversary-mismatch",
      "label": "Assumed adversary class exceeds suggested SL",
      "actions": [
        "If the consultant's threat context assumes an attacker class above a suggested per-FR SL, flag the mismatch rather than silently raising."
      ],
      "trace": "The SL should resist the adversary you actually expect; a mismatch needs a conscious decision, not an automatic bump."
    }
  ],
  "hardRules": [
    "Suggestion never exceeds SL4 and never silently changes after consultant override.",
    "The rule trace (which rules fired and why) is always shown alongside the suggestion.",
    "The consultant sets the final SL-T per foundational requirement; a justification is mandatory and is the primary deliverable text.",
    "Unmitigated risk is impact x likelihood (clause 4.5.5); a threat whose risk exceeds tolerable risk (clause 4.3.6) must be treated with countermeasures (clause 4.6/4.7), not silently accepted.",
    "Where the client organisation has its own risk matrix/criteria, those take precedence over this heuristic; record that the client matrix was used."
  ]
};
