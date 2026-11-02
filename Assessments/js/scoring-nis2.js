/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-nis2.js
 *
 * Scoring family for the EU NIS2 instruments (full assessment + quick gap).
 *
 *   - Per obligation the consultant sets ONE state:
 *     achieved | partially | not | unknown | na
 *
 *   - The target is FULL CONFORMANCE: every applicable obligation is expected
 *     to be Achieved. There are no regulator profiles or per-item targets - the
 *     gap is simply every applicable obligation that is Partially or Not
 *     Achieved.
 *
 *   - No single grade or pass mark. Results are a conformance PROFILE (counts
 *     of Achieved / Partially / Not) by NIS2 area and overall, plus a gap
 *     roadmap. A conformance percentage is offered for context only.
 *
 *   - Unknown is a coverage / confidence signal (reusing the posture handling),
 *     not a state. N/A is dropped from both the score and the coverage
 *     denominator.
 *
 * Coverage threshold and Unknown confidence levels come from the shared
 * posture profile at runtime - never hardcoded here. This is a readiness gap
 * analysis, not a determination of legal compliance.
 */
window.App = window.App || {};
window.App.ScoringNIS2 = (function () {
  "use strict";

  // ---- confidence / coverage (reuse posture handling) -------------------
  function postureProfile() {
    var sp = window.App.Data && window.App.Data.shared && window.App.Data.shared.scoringProfiles;
    return (sp && sp["posture-domain-letter"]) || null;
  }
  function coverageThreshold() {
    var pp = postureProfile();
    return (pp && typeof pp.coverageThreshold === "number") ? pp.coverageThreshold : 0.6;
  }
  function confidenceLevelFor(unknownRate) {
    var pp = postureProfile();
    if (!pp || !window.App.ScoringDomainLetter) return null;
    return window.App.ScoringDomainLetter.confidenceLevelFor(unknownRate, pp);
  }
  function confidenceKey(label) {
    if (!window.App.ScoringDomainLetter) return null;
    return window.App.ScoringDomainLetter.confidenceKey(label);
  }

  // ---- labels -----------------------------------------------------------
  function stateLabelFor(state, instrument) {
    if (!state) return null;
    var states = (instrument && instrument.states) || [];
    for (var i = 0; i < states.length; i++) if (states[i].value === state) return states[i].label;
    return state;
  }

  // ---- per obligation ---------------------------------------------------
  function scoreItem(item, response, instrument) {
    var stateRaw = response ? response.state : null;
    var consultantApplicable = response ? response.applicable !== false : true;
    var unknown = stateRaw === "unknown" || (response && response.unknown === true);
    var naState = stateRaw === "na" || !consultantApplicable;
    var isAnswered = !!stateRaw && stateRaw !== "unknown" && stateRaw !== "na";

    var state =
      naState ? "na" :
      unknown ? "unknown" :
      isAnswered ? stateRaw :
      null;

    // Conformance: only "achieved" fully meets the obligation. partially / not
    // are gaps against the fixed full-conformance target.
    var inScope = state === "achieved" || state === "partially" || state === "not";
    var isGap = state === "partially" || state === "not";

    return {
      itemId: item.id,
      categoryId: item.categoryId,
      code: item.code,
      title: item.title,
      requirement: item.requirement || "",
      rationale: item.rationale || "",
      evidencePrompt: item.evidencePrompt || "",
      articleRef: item.articleRef || "",
      evidence: response ? (response.evidence || "") : "",
      notes:    response ? (response.notes    || "") : "",

      // Consultant remediation plan (post-assessment). priorityRank is the
      // manual drag order on the gap roadmap; priorityBand is High/Medium/Low.
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : "",

      state: state,                       // achieved | partially | not | unknown | na | null
      stateLabel: stateLabelFor(state, instrument),
      isAchieved: state === "achieved",
      isGap: isGap,                       // partially or not
      isUnknown: state === "unknown",
      isNA: state === "na",
      isAnswered: isAnswered,
      inScope: inScope
    };
  }

  // ---- aggregation ------------------------------------------------------
  function rollUp(items) {
    var counts = { achieved: 0, partially: 0, not: 0, unknown: 0, na: 0, unanswered: 0 };
    var applicable = 0;   // excludes N/A
    var answered = 0;     // achieved + partially + not

    items.forEach(function (it) {
      if (it.state === "na") { counts.na += 1; return; }
      applicable += 1;
      if (it.state === "achieved") counts.achieved += 1;
      else if (it.state === "partially") counts.partially += 1;
      else if (it.state === "not") counts.not += 1;
      else if (it.state === "unknown") counts.unknown += 1;
      else counts.unanswered += 1;
      if (it.state === "achieved" || it.state === "partially" || it.state === "not") answered += 1;
    });

    var coverage    = applicable > 0 ? (answered / applicable) : null;
    var conformance = answered > 0 ? (counts.achieved / answered) : null; // context only
    var unknownRate = (counts.unknown + answered) > 0 ? (counts.unknown / (counts.unknown + answered)) : null;
    var confLabel   = confidenceLevelFor(unknownRate);

    return {
      counts: counts,
      total: applicable,           // applicable obligations (excludes N/A)
      answered: answered,
      gaps: counts.partially + counts.not,
      coverage: coverage,
      conformance: conformance,    // achieved / answered - context only, NOT a pass mark
      lowCoverage: coverage !== null && coverage < coverageThreshold(),
      unknownRate: unknownRate,
      confidenceLevel: confLabel,
      confidenceKey: confidenceKey(confLabel)
    };
  }

  // ---- whole entity -----------------------------------------------------
  function scoreSite(instrument, profile, responses) {
    var byId = {};
    (responses || []).forEach(function (r) { byId[r.requirementId || r.itemId] = r; });

    var perItem = (instrument.items || []).map(function (it) {
      return scoreItem(it, byId[it.id], instrument);
    });

    var categories = (instrument.categories || []);
    var byCategory = categories.map(function (c) {
      var items = perItem.filter(function (it) { return it.categoryId === c.id; });
      return Object.assign({ categoryId: c.id, name: c.name, article: c.article || "", items: items }, rollUp(items));
    });

    var overall = rollUp(perItem);

    // Gap roadmap: every applicable obligation that is Partially or Not
    // Achieved. Where the consultant has set a manual priority order
    // (priorityRank, via drag/drop on the report), honour it; otherwise fall
    // back to Not Achieved before Partially, then by item id.
    var roadmap = perItem.filter(function (it) { return it.isGap; });
    roadmap.sort(function (a, b) {
      var ar = typeof a.priorityRank === "number", br = typeof b.priorityRank === "number";
      if (ar && br) return a.priorityRank - b.priorityRank;
      if (ar) return -1;
      if (br) return 1;
      var an = a.state === "not" ? 0 : 1;
      var bn = b.state === "not" ? 0 : 1;
      if (an !== bn) return an - bn;
      return a.itemId.localeCompare(b.itemId);
    });

    // Weakest areas: most gaps first, then lowest conformance, name all tied.
    var ranked = byCategory.slice().filter(function (c) { return c.total > 0; });
    ranked.sort(function (a, b) {
      if (b.gaps !== a.gaps) return b.gaps - a.gaps;
      var ac = a.conformance === null ? 2 : a.conformance;
      var bc = b.conformance === null ? 2 : b.conformance;
      if (ac !== bc) return ac - bc;
      return a.categoryId.localeCompare(b.categoryId);
    });
    var worst = [];
    if (ranked.length > 0 && ranked[0].gaps > 0) {
      var top = ranked[0];
      worst = ranked.filter(function (c) { return c.gaps === top.gaps; });
    }

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perItem: perItem,
      byCategory: byCategory,
      overall: overall,
      roadmap: roadmap,
      weakestCategories: ranked,
      worstCategories: worst,
      profile: profile
    };
  }

  function scoreEngagement(engagement, instrument, profile) {
    var responsesByTarget = {};
    (engagement.responses || []).forEach(function (r) {
      var tid = r.targetId || (engagement.targets[0] && engagement.targets[0].id);
      if (!tid) return;
      (responsesByTarget[tid] = responsesByTarget[tid] || []).push(r);
    });
    return {
      perTarget: (engagement.targets || []).map(function (t) {
        return { target: t, result: scoreSite(instrument, profile, responsesByTarget[t.id] || []) };
      }),
      instrument: instrument,
      profile: profile
    };
  }

  function formatPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Math.round(v * 100) + "%";
  }

  return {
    stateLabelFor: stateLabelFor,
    coverageThreshold: coverageThreshold,
    confidenceLevelFor: confidenceLevelFor,
    confidenceKey: confidenceKey,
    scoreItem: scoreItem,
    rollUp: rollUp,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct
  };
})();
