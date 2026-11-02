/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-program-ml.js
 *
 * Scoring family for the ISA/IEC 62443-2-1:2024 Security Program Assessment.
 *
 *   - Per requirement the consultant selects ONE maturity level:
 *     ML1 | ML2 | ML3 | ML4, or a special state not-met | unknown | na.
 *     Maturity levels apply independently per requirement.
 *
 *   - No single program grade is computed. Results are reported as an
 *     achieved-ML PROFILE (count of requirements at each ML, plus not-met /
 *     unknown) by Security Program Element (SPE) and by theme. Mean ML per
 *     element is carried for CONTEXT ONLY and is never a headline grade.
 *
 *   - Optional per-requirement target ML. Where set, met/below is reported
 *     per requirement and per element. Gap = targetValue - achievedValue.
 *     There is NO cross-requirement compensation in any headline: a not-met,
 *     or a requirement below its target, is surfaced as a floor finding, not
 *     averaged away.
 *
 *   - Unknown is a coverage / confidence signal (reusing the posture
 *     handling), not a maturity value. N/A is dropped from both the score and
 *     the coverage denominator.
 *
 * Maturity-level ordering and the coverage threshold / Unknown confidence
 * levels all come from the profiles in data/shared/scoring-profiles.json -
 * never hardcoded here.
 */
window.App = window.App || {};
window.App.ScoringProgramML = (function () {
  "use strict";

  // ---- maturity-level ordering (data-driven) ----------------------------
  // Numeric value per ML id from the profile.maturityLevels. not-met ranks
  // below ML1 (value 0) for gap purposes; unknown/na/unanswered have no value.
  function levelValueMap(profile) {
    var map = {};
    var levels = (profile && profile.maturityLevels) || [];
    levels.forEach(function (l) { map[l.id] = (typeof l.value === "number") ? l.value : null; });
    if (Object.keys(map).length === 0) { map = { ML1: 1, ML2: 2, ML3: 3, ML4: 4 }; }
    return map;
  }
  function isLevelId(mlId) { return mlId === "ML1" || mlId === "ML2" || mlId === "ML3" || mlId === "ML4"; }

  // ---- confidence (reuse posture confidence levels) ---------------------
  // Mirrors the CAF module: the maturity profile says "reuse posture coverage
  // threshold and Unknown confidence flag", so we look those up at runtime and
  // delegate to ScoringDomainLetter so any change to the posture levels flows
  // through here.
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

  // ---- label helpers ----------------------------------------------------

  function levelName(mlId, profile) {
    var levels = (profile && profile.maturityLevels) || [];
    for (var i = 0; i < levels.length; i++) if (levels[i].id === mlId) return levels[i].name || mlId;
    return mlId;
  }
  function levelLabel(mlId, profile) {
    if (mlId === "not-met") return "Not met";
    if (mlId === "unknown") return "Unknown";
    if (mlId === "na") return "Not applicable";
    if (!mlId) return "Not set";
    var nm = levelName(mlId, profile);
    return nm && nm !== mlId ? (mlId + " " + nm) : mlId;
  }
  function themeName(theme, instrument) {
    var names = (instrument && instrument.themeNames) || {};
    return names[theme] || theme;
  }
  function elementName(elementId, instrument) {
    var els = (instrument && instrument.elements) || [];
    for (var i = 0; i < els.length; i++) if (els[i].id === elementId) return els[i].name || elementId;
    return elementId;
  }

  // ---- per requirement --------------------------------------------------

  function scoreRequirement(req, response, instrument, profile) {
    var valMap = levelValueMap(profile);
    var mlId = response ? (response.ml || null) : null;
    var consultantApplicable = response ? response.applicable !== false : true;

    var naState   = mlId === "na" || !consultantApplicable;
    var unknown   = mlId === "unknown";
    var notMet    = mlId === "not-met";
    var isLevel   = isLevelId(mlId);

    var state =
      naState ? "na" :
      unknown ? "unknown" :
      notMet  ? "not-met" :
      isLevel ? mlId :
      null; // unanswered

    // A definite maturity judgement (ML1-4 or not-met) counts for coverage and
    // the ML profile. unknown / unanswered do not.
    var scored = isLevel || notMet;
    var mlValue = isLevel ? valMap[mlId] : (notMet ? 0 : null);

    // Target ML is an OPTIONAL overlay, off by default. When the instrument's
    // targetOverlay is disabled, any stored target value is ignored entirely -
    // capture and report are the achieved-ML profile only.
    var targetEnabled = !!(instrument && instrument.targetOverlay && instrument.targetOverlay.enabled);
    var targetMlId = (targetEnabled && response) ? (response.targetMl || null) : null;
    var hasTarget  = isLevelId(targetMlId);
    var targetValue = hasTarget ? valMap[targetMlId] : null;

    var meetsTarget = null;     // true | false | null
    var gap = null;             // positive shortfall when below, else null
    if (hasTarget && scored) {
      meetsTarget = mlValue >= targetValue;
      if (!meetsTarget) gap = targetValue - mlValue;
    }
    var belowTarget = meetsTarget === false;
    // Floor finding: a not-met always, or any requirement below its target.
    var isFloor = notMet || belowTarget;

    return {
      requirementId: req.id,
      itemId: req.id,                     // uniform id for the shared remediation/roadmap UI
      elementId: req.elementId,
      theme: req.theme,
      code: req.code,
      title: req.title,
      verbatimText: req.verbatimText || "",
      evidencePrompt: req.evidencePrompt || "",
      otLens: req.otLens || null,

      evidence: response ? (response.evidence || "") : "",
      notes:    response ? (response.notes    || "") : "",

      // Consultant remediation plan (post-assessment).
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : "",

      ml: state,                       // ML1..ML4 | not-met | unknown | na | null
      mlValue: mlValue,                // 1..4 | 0 (not-met) | null
      mlLabel: levelLabel(state, profile),
      targetMl: hasTarget ? targetMlId : null,
      targetValue: targetValue,
      targetLabel: hasTarget ? levelLabel(targetMlId, profile) : null,
      hasTarget: hasTarget,
      meetsTarget: meetsTarget,
      belowTarget: belowTarget,
      gap: gap,
      isFloor: isFloor,

      scored: scored,
      isLevel: isLevel,
      isNotMet: notMet,
      isUnknown: unknown,
      isNA: state === "na",
      consultantApplicable: consultantApplicable
    };
  }

  // ---- aggregation ------------------------------------------------------

  function rollUp(items) {
    var counts = { ML1: 0, ML2: 0, ML3: 0, ML4: 0, notMet: 0, unknown: 0, na: 0, unanswered: 0 };
    var applicable = 0;     // excludes N/A
    var scored = 0;         // ML1-4 or not-met (a definite judgement)
    var levelSum = 0;       // sum of mlValue across scored (not-met = 0)
    var meeting = 0, below = 0, gapUnknown = 0, targetsSet = 0;

    items.forEach(function (it) {
      if (it.ml === "na") { counts.na += 1; return; }
      applicable += 1;
      if (it.ml === "ML1") counts.ML1 += 1;
      else if (it.ml === "ML2") counts.ML2 += 1;
      else if (it.ml === "ML3") counts.ML3 += 1;
      else if (it.ml === "ML4") counts.ML4 += 1;
      else if (it.ml === "not-met") counts.notMet += 1;
      else if (it.ml === "unknown") counts.unknown += 1;
      else counts.unanswered += 1;

      if (it.scored) { scored += 1; levelSum += (it.mlValue || 0); }
      if (it.hasTarget) {
        targetsSet += 1;
        if (it.scored) {
          if (it.meetsTarget === true) meeting += 1;
          else if (it.meetsTarget === false) below += 1;
        } else {
          gapUnknown += 1; // target set but achieved state not a definite judgement
        }
      }
    });

    var coverage    = applicable > 0 ? (scored / applicable) : null;
    var unknownRate = (counts.unknown + scored) > 0 ? (counts.unknown / (counts.unknown + scored)) : null;
    var confLabel   = confidenceLevelFor(unknownRate);
    // Mean ML across scored requirements (not-met counts as 0). CONTEXT ONLY -
    // never a headline grade; floor findings are surfaced separately.
    var meanMl = scored > 0 ? (levelSum / scored) : null;

    return {
      counts: counts,
      total: applicable,           // applicable requirements (excludes N/A)
      scored: scored,              // definite judgements (ML1-4 or not-met)
      coverage: coverage,
      lowCoverage: coverage !== null && coverage < coverageThreshold(),
      unknownRate: unknownRate,
      confidenceLevel: confLabel,
      confidenceKey: confidenceKey(confLabel),
      meanMl: meanMl,
      notMet: counts.notMet,
      meeting: meeting,
      below: below,
      gapUnknown: gapUnknown,
      targetsSet: targetsSet
    };
  }

  // ---- whole site -------------------------------------------------------

  function scoreSite(instrument, profile, responses) {
    var byR = {};
    (responses || []).forEach(function (r) { byR[r.requirementId || r.outcomeId] = r; });

    var perRequirement = (instrument.requirements || []).map(function (req) {
      var it = scoreRequirement(req, byR[req.id], instrument, profile);
      it.elementName = elementName(req.elementId, instrument);
      it.themeName   = themeName(req.theme, instrument);
      return it;
    });

    var elements = (instrument.elements || []);
    var byElement = elements.map(function (el) {
      var items = perRequirement.filter(function (it) { return it.elementId === el.id; });
      return Object.assign({ elementId: el.id, name: el.name, themes: el.themes || [], requirements: items }, rollUp(items));
    });

    // Themes present in the instrument, in first-seen order.
    var themeOrder = [];
    perRequirement.forEach(function (it) { if (themeOrder.indexOf(it.theme) === -1) themeOrder.push(it.theme); });
    var byTheme = themeOrder.map(function (th) {
      var items = perRequirement.filter(function (it) { return it.theme === th; });
      return Object.assign({ theme: th, name: themeName(th, instrument), requirements: items }, rollUp(items));
    });

    var overall = rollUp(perRequirement);
    var targetEnabled = !!(instrument && instrument.targetOverlay && instrument.targetOverlay.enabled);
    var anyTargets = targetEnabled && overall.targetsSet > 0;

    // Weakest elements, worst-first. Primary key: number of not-met (desc);
    // secondary: mean ML (asc, lower is weaker). Elements with no scored
    // requirements (mean null) sort last - they are a coverage gap, not a
    // demonstrated weakness. "worst" names ALL elements tied at the top, so
    // ties are surfaced rather than showing only the first.
    var ranked = byElement.slice().filter(function (e) { return e.total > 0; });
    ranked.sort(function (a, b) {
      if (b.notMet !== a.notMet) return b.notMet - a.notMet;
      var am = a.meanMl === null ? Infinity : a.meanMl;
      var bm = b.meanMl === null ? Infinity : b.meanMl;
      if (am !== bm) return am - bm;
      return a.elementId.localeCompare(b.elementId);
    });
    var worst = [];
    if (ranked.length > 0) {
      var top = ranked[0];
      var topMean = top.meanMl === null ? Infinity : top.meanMl;
      worst = ranked.filter(function (e) {
        var m = e.meanMl === null ? Infinity : e.meanMl;
        return e.notMet === top.notMet && approxEq(m, topMean);
      });
      // Only meaningful as a "weakest" callout if there's actually a weakness
      // (a not-met, or a sub-maximal mean). If everything is perfect, no worst.
      if (top.notMet === 0 && topMean >= maxLevelValue(profile)) worst = [];
    }

    // Roadmap: with targets set, every requirement below target. Without
    // targets, every not-met or ML1 requirement. not-met is always included.
    var roadmap = perRequirement.filter(function (it) {
      if (it.ml === "na" || it.ml === "unknown" || it.ml === null) return it.isNotMet; // never (these aren't not-met)
      if (it.isNotMet) return true;
      if (anyTargets) return it.belowTarget;
      return it.ml === "ML1";
    });
    roadmap.sort(function (a, b) {
      // Honour the consultant's manual priority order (drag/drop) when set.
      var ap = typeof a.priorityRank === "number", bp = typeof b.priorityRank === "number";
      if (ap && bp) return a.priorityRank - b.priorityRank;
      if (ap) return -1;
      if (bp) return 1;
      // not-met first
      if (a.isNotMet !== b.isNotMet) return a.isNotMet ? -1 : 1;
      // then by gap desc (when targets), else by ml value asc
      if (anyTargets) {
        var ag = a.gap || 0, bg = b.gap || 0;
        if (ag !== bg) return bg - ag;
      } else {
        var av = a.mlValue === null ? 99 : a.mlValue;
        var bv = b.mlValue === null ? 99 : b.mlValue;
        if (av !== bv) return av - bv;
      }
      return a.requirementId.localeCompare(b.requirementId);
    });

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perRequirement: perRequirement,
      byElement: byElement,
      byTheme: byTheme,
      overall: overall,
      weakestElements: ranked,
      worstElements: worst,
      roadmap: roadmap,
      anyTargets: anyTargets,
      targetEnabled: targetEnabled,
      profile: profile
    };
  }

  function maxLevelValue(profile) {
    var vals = Object.keys(levelValueMap(profile)).map(function (k) { return levelValueMap(profile)[k]; });
    return vals.length ? Math.max.apply(null, vals) : 4;
  }
  function approxEq(a, b) {
    if (a === Infinity && b === Infinity) return true;
    return Math.abs(a - b) < 1e-9;
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

  // ---- formatting helpers ----------------------------------------------

  function formatPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Math.round(v * 100) + "%";
  }
  function formatMean(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return v.toFixed(1);
  }

  return {
    levelValueMap: levelValueMap,
    isLevelId: isLevelId,
    levelName: levelName,
    levelLabel: levelLabel,
    themeName: themeName,
    elementName: elementName,
    confidenceLevelFor: confidenceLevelFor,
    confidenceKey: confidenceKey,
    coverageThreshold: coverageThreshold,
    scoreRequirement: scoreRequirement,
    rollUp: rollUp,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct,
    formatMean: formatMean
  };
})();
