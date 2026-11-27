/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-caf-achieved.js
 *
 * Scoring family for the NCSC CAF 4.0 Alignment Assessment.
 *
 *   - Per outcome the consultant sets ONE state:
 *     achieved | partially | not | unknown | na
 *
 *   - No single CAF grade is computed. Results are reported as a PROFILE
 *     (counts and percentages of Achieved / Partially / Not Achieved) by
 *     objective and principle, plus, against the selected regulator profile,
 *     meeting vs below expected.
 *
 *   - Order for comparing actual vs expected: not < partially < achieved.
 *     meets target = (actual >= expected). For comparison only - never
 *     surfaced as a single number on the report.
 *
 *   - Unknown is a coverage / confidence signal (reusing the posture
 *     handling), not a state. N/A is dropped from both the score and the
 *     coverage denominator. Outcomes the profile marks applicable:false
 *     drop out entirely.
 *
 * All thresholds and confidence levels come from the profiles in
 * data/shared/scoring-profiles.json - never hardcoded here.
 */
window.App = window.App || {};
window.App.ScoringCAF = (function () {
  "use strict";

  // ---- state ordering ---------------------------------------------------

  var STATE_RANK = { not: 0, partially: 1, achieved: 2 };
  function rankOf(state) {
    return Object.prototype.hasOwnProperty.call(STATE_RANK, state) ? STATE_RANK[state] : -1;
  }
  function meetsExpected(actualState, expectedState) {
    // null expected (placeholder profile) -> gap unknown, don't claim "meets"
    if (expectedState === null || expectedState === undefined) return null;
    if (!actualState || actualState === "unknown" || actualState === "na") return null;
    return rankOf(actualState) >= rankOf(expectedState);
  }

  // ---- confidence (reuse posture confidence levels) ---------------------
  // The CAF profile in scoring-profiles.json says: "reuse posture-domain-letter
  // coverage threshold and Unknown confidence flag". Look those up at runtime
  // so any future change to the posture levels flows through here.
  function postureProfile() {
    var sp = window.App.Data && window.App.Data.shared && window.App.Data.shared.scoringProfiles;
    return sp && sp["posture-domain-letter"] || null;
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

  // ---- per outcome ------------------------------------------------------

  function scoreOutcome(outcome, response, overlay, instrument) {
    var ov = (overlay && overlay[outcome.id]) || null;
    var profileApplicable = ov ? (ov.applicable !== false) : true;
    var expectedState = ov ? (ov.expectedState === undefined ? null : ov.expectedState) : null;
    var supplementaryGuidance = ov ? (ov.supplementaryGuidance || "") : "";
    var weight = ov ? (ov.weight) : null;

    var stateRaw = response ? response.state : null;
    var consultantApplicable = response ? response.applicable !== false : true;
    var unknown = stateRaw === "unknown" || (response && response.unknown === true);
    var naState = stateRaw === "na" || !consultantApplicable;
    var isAnswered = !!stateRaw && stateRaw !== "unknown" && stateRaw !== "na";

    // State that flows into reports.
    var classifiedState =
      !profileApplicable ? "na" :
      naState ? "na" :
      unknown ? "unknown" :
      isAnswered ? stateRaw :
      null;

    var stateInScope = classifiedState === "achieved" || classifiedState === "partially" || classifiedState === "not";
    var inDenominator = profileApplicable && classifiedState !== "na"; // unknown and unanswered still count as in-scope

    var meets = stateInScope ? meetsExpected(classifiedState, expectedState) : null;
    // Some instruments (e.g. CIS) treat Unknown as a finding in its own right -
    // "we cannot verify this / no one tracks it" is a gap to address, not just
    // missing coverage. For those, an in-scope Unknown counts as below the
    // expected state and lands on the roadmap. (It still lowers coverage too -
    // it is never counted as answered.)
    var unknownIsFinding = !!(instrument && instrument.unknownIsFinding) && classifiedState === "unknown" && profileApplicable;
    if (unknownIsFinding) meets = false;

    // Above-baseline: the consultant recorded an implemented state on a control the
    // selected profile does NOT require (applicable=false in the overlay). Captured
    // for a complete report and tracked across reassessments, but EXCLUDED from
    // scoring - it never enters the denominator, the counts or the roadmap.
    var aboveBaseline = !profileApplicable && !naState && (stateRaw === "achieved" || stateRaw === "partially");

    return {
      outcomeId: outcome.id,
      itemId: outcome.id,                 // uniform id for the shared remediation/roadmap UI
      code: outcome.id,                   // shown as the code in the remediation modal
      principleId: outcome.principleId,
      title: outcome.title,
      otLens: outcome.otLens || null,
      igps: outcome.igps || null,
      stateSummary: outcome.stateSummary || null,
      rationale: outcome.rationale || "",   // best-practice "why this matters" for the roadmap

      // Captured raw fields for evidence rendering
      evidence: response ? (response.evidence || "") : "",
      notes:    response ? (response.notes    || "") : "",

      // Consultant remediation plan (post-assessment); priorityRank is the
      // manual drag order on the roadmap, priorityBand is High/Medium/Low.
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : "",

      // Scoring fields
      state: classifiedState,             // achieved | partially | not | unknown | na | null
      stateLabel: stateLabelFor(classifiedState, instrument),
      stateColour: stateColourFor(classifiedState, instrument),
      profileApplicable: profileApplicable,
      consultantApplicable: consultantApplicable,
      expectedState: expectedState,
      expectedStateLabel: stateLabelFor(expectedState, instrument),
      supplementaryGuidance: supplementaryGuidance,
      weight: weight,

      // Gap fields against the selected profile
      meetsExpected: meets,               // true | false | null (when expected not set or actual not in scope)
      hasExpected: expectedState !== null && expectedState !== undefined,
      inDenominator: inDenominator,
      isAnswered: isAnswered,
      isUnknown: classifiedState === "unknown",
      isUnknownFinding: unknownIsFinding,
      aboveBaseline: aboveBaseline,
      aboveBaselineState: aboveBaseline ? stateRaw : null,
      isNA: classifiedState === "na"
    };
  }

  function stateLabelFor(state, instrument) {
    if (!state) return null;
    var states = (instrument && instrument.states) || [];
    for (var i = 0; i < states.length; i++) {
      if (states[i].value === state) return states[i].label;
    }
    return state;
  }
  function stateColourFor(state, instrument) {
    var states = (instrument && instrument.states) || [];
    for (var i = 0; i < states.length; i++) {
      if (states[i].value === state) return states[i].colour || null;
    }
    return null;
  }
  function defaultStateColour(v) { return v === "achieved" ? "met" : v === "partially" ? "near" : "gap"; }
  // Ordered substantive states (excluding unknown/na) with label + colour band,
  // from the instrument's states array. Single source of truth for which states
  // a caf-achieved instrument uses and how they read: the CAF uses three
  // (Achieved / Partially / Not Achieved); the NIST 800-53 / 800-82 instruments
  // use two (Satisfied / Other Than Satisfied) per SP 800-53A. Each entry's
  // .value is the scorer count key (counts[value]). Falls back to the CAF three
  // if an instrument omits states.
  function substantiveStates(instrument) {
    var st = (instrument && instrument.states) || [];
    var out = [];
    st.forEach(function (s) {
      if (s.value === "unknown" || s.value === "na") return;
      out.push({ value: s.value, label: s.label || s.value, colour: s.colour || defaultStateColour(s.value) });
    });
    if (!out.length) out = [
      { value: "achieved",  label: "Achieved",           colour: "met" },
      { value: "partially", label: "Partially Achieved", colour: "near" },
      { value: "not",       label: "Not Achieved",       colour: "gap" }
    ];
    return out;
  }

  // ---- aggregation: counts + meets/below --------------------------------

  function rollUp(items) {
    // items: array of scored outcomes (each .state, .meetsExpected, etc.)
    var counts = {
      achieved: 0, partially: 0, not: 0,
      unknown: 0, na: 0, unanswered: 0, aboveBaseline: 0
    };
    var inScopeApplicable = 0;
    var answered = 0;
    var meeting = 0, below = 0, gapUnknown = 0;

    items.forEach(function (it) {
      // Above-baseline (implemented but not required) is tracked, never scored.
      if (!it.profileApplicable) { if (it.aboveBaseline) counts.aboveBaseline += 1; else counts.na += 1; return; }
      if (it.state === "na")        { counts.na += 1; return; }

      inScopeApplicable += 1;
      if (it.state === "achieved")  counts.achieved += 1;
      else if (it.state === "partially") counts.partially += 1;
      else if (it.state === "not")  counts.not += 1;
      else if (it.state === "unknown") counts.unknown += 1;
      else counts.unanswered += 1;

      if (it.state === "achieved" || it.state === "partially" || it.state === "not") {
        answered += 1;
        if (it.hasExpected) {
          if (it.meetsExpected === true)  meeting += 1;
          else if (it.meetsExpected === false) below += 1;
        } else {
          gapUnknown += 1; // expected not set on this overlay
        }
      } else if (it.state === "unknown" && it.meetsExpected === false) {
        // Unknown treated as a finding (unknownIsFinding instruments): a gap that
        // is below expected, but not "answered" so it still lowers coverage.
        below += 1;
      }
    });

    var coverage    = inScopeApplicable > 0 ? (answered / inScopeApplicable) : null;
    var unknownRate = (counts.unknown + answered) > 0 ? (counts.unknown / (counts.unknown + answered)) : null;
    var confLabel   = confidenceLevelFor(unknownRate);

    return {
      counts: counts,
      total: inScopeApplicable,        // applicable outcomes (excluding N/A and overlay-not-applicable)
      answered: answered,
      coverage: coverage,
      lowCoverage: coverage !== null && coverage < coverageThreshold(),
      unknownRate: unknownRate,
      confidenceLevel: confLabel,
      confidenceKey: confidenceKey(confLabel),
      meeting: meeting,
      below: below,
      gapUnknown: gapUnknown
    };
  }

  // ---- weakest groups ---------------------------------------------------
  // Groups differ in size, so they are compared by the share of their
  // applicable outcomes below the expected state: an objective with 6 of 7
  // short is weaker than one with 10 of 19. Ties go to more outcomes in the
  // worst state, then more gaps, then the lower id. The shares are compared
  // by cross-multiplying, so equal fractions tie exactly.
  function compareGapShare(a, b) {
    var byShare = b.gaps * a.total - a.gaps * b.total;
    if (byShare !== 0) return byShare;
    if (b.worst !== a.worst) return b.worst - a.worst;
    if (b.gaps !== a.gaps) return b.gaps - a.gaps;
    return String(a.id).localeCompare(String(b.id));
  }
  // groups: byObjective or byPrinciple entries. With opts.useBelow the gaps
  // are the outcomes below the selected profile's expected state; otherwise
  // the Partially and Not answers. Returns the groups with applicable
  // outcomes, weakest first, as { id, name, total, gaps, worst, counts, group }.
  // A group with no gaps is never the weakest, so check gaps > 0 on the first.
  function rankGroups(groups, opts) {
    opts = opts || {};
    return (groups || []).filter(function (g) { return (g.total || 0) > 0; }).map(function (g) {
      var c = g.counts || {};
      return {
        id: g.principleId !== undefined ? g.principleId : g.objectiveId,
        name: g.name, total: g.total, counts: c, group: g,
        gaps: opts.useBelow ? (g.below || 0) : ((c.partially || 0) + (c.not || 0)),
        worst: c.not || 0
      };
    }).sort(compareGapShare);
  }

  // ---- whole site -------------------------------------------------------

  function scoreSite(instrument, profile, responses, overlay) {
    overlay = overlay || {};
    var byO = {};
    (responses || []).forEach(function (r) {
      byO[r.requirementId || r.outcomeId] = r;
    });

    var perOutcome = (instrument.outcomes || []).map(function (o) {
      return scoreOutcome(o, byO[o.id], overlay, instrument);
    });

    // Index principles + objectives from instrument.taxonomy.
    var principles  = (instrument.taxonomy && instrument.taxonomy.principles)  || [];
    var objectives  = (instrument.taxonomy && instrument.taxonomy.objectives)  || [];

    var byPrinciple = principles.map(function (p) {
      var items = perOutcome.filter(function (it) { return it.principleId === p.id; });
      var roll = rollUp(items);
      return Object.assign({ principleId: p.id, name: p.name, objectiveId: p.objectiveId, outcomes: items }, roll);
    });

    var byObjective = objectives.map(function (obj) {
      var items = perOutcome.filter(function (it) {
        var prin = principles.filter(function (p) { return p.id === it.principleId; })[0];
        return prin && prin.objectiveId === obj.id;
      });
      var prinsInObj = byPrinciple.filter(function (p) { return p.objectiveId === obj.id; });
      var roll = rollUp(items);
      return Object.assign({ objectiveId: obj.id, name: obj.name, principles: prinsInObj, outcomes: items }, roll);
    });

    var overall = rollUp(perOutcome);

    // Roadmap: every outcome that is "Partially" or "Not" against any expected,
    // or every outcome below its expected state. Under General (expects
    // achieved everywhere), this is every Partially / Not. Under a regulator
    // profile, it is exactly the outcomes below the expected state.
    var roadmap = perOutcome.filter(function (it) {
      if (!it.profileApplicable || it.state === "na") return false;
      if (it.meetsExpected === false) return true;
      // If expected not set (placeholder profile), include Partially / Not as the
      // catch-all so the consultant still has a draft list to work from.
      if (!it.hasExpected && (it.state === "partially" || it.state === "not")) return true;
      return false;
    });
    // Sort: not before partially; then by outcome id.
    roadmap.sort(function (a, b) {
      // Honour the consultant's manual priority order (drag/drop) when set.
      var ap = typeof a.priorityRank === "number", bp = typeof b.priorityRank === "number";
      if (ap && bp) return a.priorityRank - b.priorityRank;
      if (ap) return -1;
      if (bp) return 1;
      // Severity order for the roadmap: Unknown (uncertain - worse than a known
      // gap) first, then Not, then Partially. Unknown only reaches the roadmap on
      // instruments where it is a finding, so other instruments are unaffected.
      function sev(s) { return s === "unknown" ? 0 : (s === "not" ? 1 : (s === "partially" ? 2 : 3)); }
      var ar = sev(a.state), br = sev(b.state);
      if (ar !== br) return ar - br;
      return a.outcomeId.localeCompare(b.outcomeId);
    });

    // Controls implemented beyond the selected profile - captured for a complete
    // report and reassessment tracking, excluded from the score. Sorted by id.
    var aboveBaseline = perOutcome.filter(function (it) { return it.aboveBaseline; });
    aboveBaseline.sort(function (a, b) { return String(a.outcomeId).localeCompare(String(b.outcomeId), undefined, { numeric: true }); });

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perOutcome: perOutcome,
      byPrinciple: byPrinciple,
      byObjective: byObjective,
      overall: overall,
      roadmap: roadmap,
      aboveBaseline: aboveBaseline,
      profile: profile
    };
  }

  function scoreEngagement(engagement, instrument, profile, overlay) {
    var responsesByTarget = {};
    (engagement.responses || []).forEach(function (r) {
      var tid = r.targetId || (engagement.targets[0] && engagement.targets[0].id);
      if (!tid) return;
      (responsesByTarget[tid] = responsesByTarget[tid] || []).push(r);
    });
    return {
      perTarget: (engagement.targets || []).map(function (t) {
        return { target: t, result: scoreSite(instrument, profile, responsesByTarget[t.id] || [], overlay) };
      }),
      instrument: instrument,
      profile: profile
    };
  }

  // ---- formatting helpers ----------------------------------------------

  function formatPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Math.round(v * 100) + "%";
  }

  // ---- the instrument's own words ----------------------------------------
  // Five frameworks share this engine, and each has its own nouns: CAF
  // objectives and outcomes, NIST control groups, families and controls, CIS
  // Controls and Safeguards, ONR principles and expectations. The report text
  // takes them from here, so no CAF term reaches a NIST, CIS or ONR report.
  // Nouns the data gives are used as written (CIS and ONR capitalise theirs);
  // the generic fallbacks are lower case.
  function pluralNoun(s) {
    s = String(s || "");
    if (/[^aeiou]y$/i.test(s)) return s.slice(0, -1) + "ies";
    if (/s$/i.test(s)) return s;
    return s + "s";
  }
  function vocab(instrument) {
    var d = (instrument && instrument.display) || {};
    var unit = d.unitNoun || String(d.outcomesTitle || "Outcomes").replace(/s$/i, "").toLowerCase();
    var objective = d.objectiveNoun || "objective";
    var principle = d.principleNoun || (d.objectiveTitle === "Control families" ? "control family" : "principle");
    var achieved = substantiveStates(instrument).filter(function (s) { return s.value === "achieved"; })[0];
    var prof = String(d.profileTitle || "profile");
    if (!/^Implementation Group$/.test(prof)) prof = prof.toLowerCase();
    return {
      profileNoun: prof,
      unit: unit, units: pluralNoun(unit),
      objective: objective, objectives: pluralNoun(objective),
      principle: principle, principles: pluralNoun(principle),
      achievedLabel: achieved ? achieved.label : "Achieved",
      roadmapTitle: d.roadmapTitle || "Roadmap towards expected outcomes"
    };
  }
  // "the Ofgem (Basic) profile", "the Moderate baseline (NIST SP 800-53B)",
  // "Implementation Group 2": a profile name that already says what it is
  // does not get "profile" added to it.
  function profilePhrase(name) {
    var n = String(name || "").trim();
    if (/\b(baseline|overlay|catalog)\b/i.test(n)) return "the " + n;
    if (/^(Implementation Group|Full \()/i.test(n)) return n;
    return "the " + n + " profile";
  }

  return {
    vocab: vocab,
    pluralNoun: pluralNoun,
    profilePhrase: profilePhrase,
    compareGapShare: compareGapShare,
    rankGroups: rankGroups,
    STATE_RANK: STATE_RANK,
    rankOf: rankOf,
    meetsExpected: meetsExpected,
    confidenceLevelFor: confidenceLevelFor,
    confidenceKey: confidenceKey,
    stateLabelFor: stateLabelFor,
    stateColourFor: stateColourFor,
    substantiveStates: substantiveStates,
    coverageThreshold: coverageThreshold,
    scoreOutcome: scoreOutcome,
    rollUp: rollUp,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct
  };
})();
