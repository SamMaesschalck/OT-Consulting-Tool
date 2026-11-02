/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-csms.js
 *
 * Scoring family for the ISA/IEC 62443-2-1:2010 CSMS Assessment (csms-conformance).
 *
 *   - Per element the consultant sets ONE conformance state:
 *     not-in-place | partially | largely | in-place | unknown | na
 *     (the four scored states + the two special states). The scale is defined
 *     in the shared csms-conformance profile, not hardcoded here.
 *
 *   - The target is full conformance: every applicable element is expected to be
 *     In place. There is no single CSMS grade. Results are a conformance PROFILE
 *     (counts at each state) by category AND by element group, plus a gap
 *     roadmap. A conformance index (0-1, respecting the four states) is offered
 *     for context only - never a pass mark.
 *
 *   - Gap / roadmap = every applicable element that is Not in place or Partially
 *     in place. "Largely in place" is near-conformant: it counts in the profile
 *     and the conformance index but is not a roadmap priority. Not-in-place is a
 *     floor finding.
 *
 *   - Unknown is a coverage / confidence signal (reusing the posture handling);
 *     N/A is dropped from both the score and the coverage denominator.
 *
 * Coverage threshold and Unknown confidence levels come from the shared posture
 * profile at runtime. This is a conformance gap analysis, not certification.
 */
window.App = window.App || {};
window.App.ScoringCSMS = (function () {
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

  // ---- state scale (from the profile) -----------------------------------
  function scoredStates(profile) {
    return ((profile && profile.states) || []).filter(function (s) { return s.scored; });
  }
  function maxRank(profile) {
    var ss = scoredStates(profile), m = 0;
    ss.forEach(function (s) { if (typeof s.rank === "number" && s.rank > m) m = s.rank; });
    return m || 3;
  }
  function rankOf(state, profile) {
    var ss = (profile && profile.states) || [];
    for (var i = 0; i < ss.length; i++) if (ss[i].value === state && typeof ss[i].rank === "number") return ss[i].rank;
    return null;
  }
  function stateLabelFor(state, profile) {
    if (!state) return null;
    if (state === "unknown") return "Unknown";
    if (state === "na") return "Not applicable";
    var ss = (profile && profile.states) || [];
    for (var i = 0; i < ss.length; i++) if (ss[i].value === state) return ss[i].label;
    return state;
  }

  // ---- per element ------------------------------------------------------
  function scoreElement(el, response, profile) {
    var stateRaw = response ? response.state : null;
    var consultantApplicable = response ? response.applicable !== false : true;
    var unknown = stateRaw === "unknown" || (response && response.unknown === true);
    var naState = stateRaw === "na" || !consultantApplicable;
    var isScored = !!stateRaw && stateRaw !== "unknown" && stateRaw !== "na";

    var state =
      naState ? "na" :
      unknown ? "unknown" :
      isScored ? stateRaw :
      null;

    var rank = (state && state !== "unknown" && state !== "na") ? rankOf(state, profile) : null;
    var mx = maxRank(profile);
    var score = (rank === null) ? null : (mx > 0 ? rank / mx : 0);
    var isGap = state === "not-in-place" || state === "partially";
    var isFloor = state === "not-in-place";

    return {
      itemId: el.id,
      code: el.code,
      title: el.title,
      categoryId: el.categoryId,
      elementGroupId: el.elementGroupId || null,
      requirement: el.verbatimText || "",
      rationale: el.rationale || "",
      hint: el.hint || "",
      otLens: el.otLens || null,
      evidencePrompt: el.evidencePrompt || "",
      evidence: response ? (response.evidence || "") : "",
      notes:    response ? (response.notes    || "") : "",

      // Consultant remediation plan (post-assessment).
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : "",

      state: state,                       // not-in-place | partially | largely | in-place | unknown | na | null
      stateLabel: stateLabelFor(state, profile),
      rank: rank,
      score: score,                       // 0..1, context only
      isScored: isScored,
      isConformant: state === "in-place",
      isGap: isGap,                       // not-in-place or partially
      isFloor: isFloor,                   // not-in-place
      isUnknown: state === "unknown",
      isNA: state === "na"
    };
  }

  // ---- aggregation ------------------------------------------------------
  function rollUp(items, profile) {
    var counts = { notInPlace: 0, partially: 0, largely: 0, inPlace: 0, unknown: 0, na: 0, unanswered: 0 };
    var applicable = 0;   // excludes N/A
    var answered = 0;     // the four scored states
    var scoreSum = 0;

    items.forEach(function (it) {
      if (it.state === "na") { counts.na += 1; return; }
      applicable += 1;
      if (it.state === "not-in-place") counts.notInPlace += 1;
      else if (it.state === "partially") counts.partially += 1;
      else if (it.state === "largely") counts.largely += 1;
      else if (it.state === "in-place") counts.inPlace += 1;
      else if (it.state === "unknown") counts.unknown += 1;
      else counts.unanswered += 1;
      if (it.score !== null) { answered += 1; scoreSum += it.score; }
    });

    var coverage    = applicable > 0 ? (answered / applicable) : null;
    var conformance = answered > 0 ? (scoreSum / answered) : null; // 0-1, context only
    var unknownRate = (counts.unknown + answered) > 0 ? (counts.unknown / (counts.unknown + answered)) : null;
    var confLabel   = confidenceLevelFor(unknownRate);

    return {
      counts: counts,
      total: applicable,
      answered: answered,
      gaps: counts.notInPlace + counts.partially,
      coverage: coverage,
      conformance: conformance,
      lowCoverage: coverage !== null && coverage < coverageThreshold(),
      unknownRate: unknownRate,
      confidenceLevel: confLabel,
      confidenceKey: confidenceKey(confLabel)
    };
  }

  // ---- weakest-area ranking (shared by categories and element groups) ---
  function rankAreas(areas) {
    var ranked = areas.slice().filter(function (a) { return a.total > 0; });
    ranked.sort(function (a, b) {
      if (b.gaps !== a.gaps) return b.gaps - a.gaps;
      var ac = a.conformance === null ? 2 : a.conformance;
      var bc = b.conformance === null ? 2 : b.conformance;
      if (ac !== bc) return ac - bc;
      return String(a.id).localeCompare(String(b.id));
    });
    return ranked;
  }

  // ---- whole organisation -----------------------------------------------
  function scoreSite(instrument, profile, responses) {
    var byId = {};
    (responses || []).forEach(function (r) { byId[r.requirementId || r.itemId] = r; });

    var perItem = (instrument.requirements || []).map(function (el) {
      return scoreElement(el, byId[el.id], profile);
    });

    var categories = (instrument.categories || []);
    var byCategory = categories.map(function (c) {
      var items = perItem.filter(function (it) { return it.categoryId === c.id; });
      return Object.assign({ id: c.id, categoryId: c.id, name: c.name, summary: c.summary || "", items: items }, rollUp(items, profile));
    });

    var groups = (instrument.elementGroups || []);
    var byGroup = groups.map(function (g) {
      var items = perItem.filter(function (it) { return it.elementGroupId === g.id; });
      return Object.assign({ id: g.id, groupId: g.id, categoryId: g.categoryId, name: g.name, summary: g.summary || "", items: items }, rollUp(items, profile));
    });

    var overall = rollUp(perItem, profile);

    // Gap roadmap: every applicable element Not in place or Partially in place.
    // Manual drag order (priorityRank) wins; else Not-in-place before Partially,
    // then by code.
    var roadmap = perItem.filter(function (it) { return it.isGap; });
    roadmap.sort(function (a, b) {
      var ar = typeof a.priorityRank === "number", br = typeof b.priorityRank === "number";
      if (ar && br) return a.priorityRank - b.priorityRank;
      if (ar) return -1;
      if (br) return 1;
      var an = a.state === "not-in-place" ? 0 : 1;
      var bn = b.state === "not-in-place" ? 0 : 1;
      if (an !== bn) return an - bn;
      return String(a.code).localeCompare(String(b.code));
    });

    var rankedCategories = rankAreas(byCategory);
    var rankedGroups = rankAreas(byGroup);
    var worstCategories = (rankedCategories.length && rankedCategories[0].gaps > 0)
      ? rankedCategories.filter(function (c) { return c.gaps === rankedCategories[0].gaps; })
      : [];

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perItem: perItem,
      byCategory: byCategory,
      byGroup: byGroup,
      overall: overall,
      roadmap: roadmap,
      weakestCategories: rankedCategories,
      weakestGroups: rankedGroups,
      worstCategories: worstCategories,
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
    scoredStates: scoredStates,
    coverageThreshold: coverageThreshold,
    confidenceLevelFor: confidenceLevelFor,
    confidenceKey: confidenceKey,
    scoreElement: scoreElement,
    rollUp: rollUp,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct
  };
})();
