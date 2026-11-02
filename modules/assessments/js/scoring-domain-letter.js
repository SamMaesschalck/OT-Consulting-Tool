/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-domain-letter.js
 *
 * Scoring family for the General OT Security Posture instrument and any future
 * instrument with the same shape (domains + scored questions + mixed capture
 * fields + consultant-set band). Does NOT alter the 62443-3-3 capability-sl
 * paths. All thresholds, letter bands, and the coverage cut-off come from the
 * profile data, never hardcoded here.
 *
 *   Per scored question, normalised score = band / 3 (so 0, 0.33, 0.67, 1.0).
 *   The band is set by the consultant. Capture fields (text, checklist, choice,
 *   boolean) are evidence only and never feed the score.
 *
 *   Unknown: excluded from the score, counts against coverage.
 *   N/A:     excluded from both the score and the coverage denominator.
 *   Context (scored:false): excluded entirely from grading.
 *
 *   Domain score    = mean of normalised scores across answered scored questions.
 *   Domain coverage = answered scored / scorable (excluding N/A).
 *   Domain grade    = letter from profile.letterBands for the domain score.
 *
 *   Headline grade  = weighted mean of the graded domain scores, then held
 *                     down by TWO ceilings:
 *                       - at most `capDistance` grades above the weakest
 *                         graded domain (default 2), so an F anywhere means D
 *                         at best and an E anywhere means C at best;
 *                       - the top grade only when EVERY graded domain reaches
 *                         it, so an A means uniformly excellent, not "excellent
 *                         on average".
 *                     One weak domain therefore drags the headline hard without
 *                     becoming the headline itself. The weakest domain is always
 *                     named. This is NOT a weakest-domain floor - it used to be,
 *                     and prose saying so survived the change for a while. If
 *                     you change the rule, grep for "weakest" and "one grade"
 *                     in the narrative packs and the profile.
 *
 *   Coverage gate   = a domain (or the overall) with coverage below
 *                     profile.coverageThreshold is reported as indicative.
 */
window.App = window.App || {};
window.App.ScoringDomainLetter = (function () {
  "use strict";

  // Scores are graded against decimal band edges (0.25, 0.40, 0.55 ...) that a
  // double can only approximate, so a score sitting exactly on an edge must
  // reach classifyLetter as the same double the edge literal parses to, or it
  // drops a letter. Floating-point sums do not guarantee that: a mean of seven
  // domain scores that is exactly 0.40 can come out 0.39999999999999997 and
  // grade E instead of D. Rounding to nine places snaps those one-ulp misses
  // back onto the edge without moving any real score, because two genuinely
  // different scores here are never within a billionth of each other.
  function roundScore(x) {
    return Math.round(x * 1e9) / 1e9;
  }

  // The band scale's floor and width, read from the profile with the 0-3
  // defaults. Shared by the per-question score and the domain roll-up so the
  // two can never normalise against different scales.
  function bandBounds(profile) {
    var bs = profile && profile.bandScale;
    var bmin = (bs && typeof bs.min === "number") ? bs.min : 0;
    var bmax = (bs && typeof bs.max === "number") ? bs.max : 3;
    return { min: bmin, range: bmax - bmin };
  }

  function classifyLetter(score, bands) {
    var sorted = bands.slice().sort(function (a, b) { return b.minScore - a.minScore; });
    for (var i = 0; i < sorted.length; i++) {
      if (score >= sorted[i].minScore) return sorted[i].grade;
    }
    return sorted[sorted.length - 1].grade;
  }

  // Rank ascending by strength: F=0 (weakest), A=highest. Used to apply the
  // headline cap relative to the weakest graded domain.
  function letterRank(grade, bands) {
    var sorted = bands.slice().sort(function (a, b) { return a.minScore - b.minScore; });
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].grade === grade) return i;
    }
    return -1;
  }

  function letterAtRank(rank, bands) {
    var sorted = bands.slice().sort(function (a, b) { return a.minScore - b.minScore; });
    if (rank < 0) rank = 0;
    if (rank >= sorted.length) rank = sorted.length - 1;
    return sorted[rank].grade;
  }

  // Confidence flag from unknownHandling. Driven by profile.unknownHandling.
  // confidenceFlag.levels - thresholds are configurable; we parse each level's
  // "when" string ("unknownRate <= X" or "unknownRate > X") so the JSON shape
  // can stay declarative. Returns null if there are no attempted answers
  // (unknown + answered === 0) or no levels defined.
  function confidenceLevelFor(unknownRate, profile) {
    if (unknownRate === null || unknownRate === undefined || isNaN(unknownRate)) return null;
    var uh = (profile && profile.unknownHandling) || {};
    var cf = uh.confidenceFlag || {};
    var levels = cf.levels || [];
    if (levels.length === 0) return null;
    for (var i = 0; i < levels.length; i++) {
      var when = String(levels[i].when || "");
      var m = when.match(/<=?\s*([\d.]+)/);
      if (m) {
        if (unknownRate <= parseFloat(m[1])) return levels[i].label;
      } else {
        // Last level with no upper bound (e.g. "unknownRate > 0.30").
        return levels[i].label;
      }
    }
    return levels[levels.length - 1].label;
  }
  function confidenceKey(label) {
    if (!label) return null;
    if (/high/i.test(label))     return "high";
    if (/moderate/i.test(label)) return "moderate";
    if (/low/i.test(label))      return "low";
    return label.toLowerCase().replace(/\s+/g, "-");
  }

  // -- Headline computation: weighted mean with floor cap ----------------
  //
  // 1. Take the weighted mean of domain scores across ONLY domains that meet
  //    coverageThreshold (i.e. d.score !== null && !d.lowCoverage).
  // 2. Equal weighting (1/n) by default. If profile.headlineMethod.domainWeights
  //    is set, use it and renormalise across the graded domains.
  // 3. Map the weighted mean to a letter via profile.letterBands.
  // 4. Cap: the headline may sit at most profile.headlineMethod.capDistance
  //    grades above the weakest graded domain on the A>B>C>D>E>F ladder. If
  //    the weighted-mean grade is higher, pull it down to the cap.
  // 5. Domains below coverageThreshold are excluded from both the mean and the
  //    cap (you cannot floor on a domain you could not grade). They still
  //    count against overall coverage and the low-confidence flag.
  //
  // All thresholds come from the profile, never hardcoded here.
  function computeHeadline(perDomain, profile) {
    var graded = perDomain.filter(function (d) {
      return d.score !== null && !d.lowCoverage;
    });

    var method = (profile && profile.headlineMethod) || {};
    var capDistance = typeof method.capDistance === "number" ? method.capDistance : 1;

    if (graded.length === 0) {
      return {
        headlineGrade: null,
        headlineMeanScore: null,
        headlineMeanGrade: null,
        weakestDomain: null,
        capApplied: false,
        capBinding: false,
        capCeilingGrade: null,
        capReason: null,
        topGradeUnanimous: false,
        capDistance: capDistance,
        gradedCount: 0
      };
    }

    // Build a weight per graded domain.
    var domainWeights = method.domainWeights;
    var weights = {};
    var totalW = 0;
    var anyExplicit = false;
    if (domainWeights && typeof domainWeights === "object") {
      graded.forEach(function (d) {
        var w = +domainWeights[d.domainId];
        if (isFinite(w) && w > 0) { weights[d.domainId] = w; totalW += w; anyExplicit = true; }
      });
    }
    if (!anyExplicit || totalW === 0) {
      // equal weighting across graded domains; renormalisation is implicit
      // because we divide by totalW below.
      graded.forEach(function (d) { weights[d.domainId] = 1; });
      totalW = graded.length;
    }

    // Weighted mean, rounded before it is graded: the domain scores are
    // fractions with different denominators, and their float sum can land a
    // hair under a band edge the exact mean sits on (see roundScore).
    var weightedSum = 0;
    graded.forEach(function (d) { weightedSum += d.score * weights[d.domainId]; });
    var meanScore = roundScore(weightedSum / totalW);
    var meanGrade = classifyLetter(meanScore, profile.letterBands);

    // Weakest GRADE among graded domains - the cap uses the lowest grade
    // letter rank (numerical). Ties between several domains at this grade
    // do not affect the cap, but they do affect the display: callers can
    // read every tied domain from `weakestDomains`.
    var minRank = Infinity;
    graded.forEach(function (d) {
      var r = letterRank(d.grade, profile.letterBands);
      if (r < minRank) minRank = r;
    });
    var weakestDomains = graded.filter(function (d) {
      return letterRank(d.grade, profile.letterBands) === minRank;
    });
    // Order tied domains by score (lowest first, deterministic across renders).
    weakestDomains.sort(function (a, b) { return a.score - b.score; });
    var weakest = weakestDomains[0];

    // Two ceilings, both expressed as a rank the headline may not exceed.
    //
    // 1. RELATIVE TO THE WEAKEST. The headline may sit at most `capDistance`
    //    grades above the weakest graded domain, so a weak area drags the
    //    grade down hard without becoming the grade itself. (Ties don't matter
    //    - every tied domain has the same rank, so any of them gives the same
    //    cap.)
    // 2. TOP GRADE IS UNANIMOUS. The best grade on the scale is only awarded
    //    when EVERY graded domain reaches it. Averaging six A's and a C into an
    //    A would say the organisation is uniformly excellent when it is not.
    var meanRank    = letterRank(meanGrade, profile.letterBands);
    var weakestRank = letterRank(weakest.grade, profile.letterBands);
    var maxRank     = profile.letterBands.length - 1;

    var capRank = Math.min(weakestRank + capDistance, maxRank);
    var topUnanimous = graded.every(function (d) {
      return letterRank(d.grade, profile.letterBands) === maxRank;
    });
    if (!topUnanimous) capRank = Math.min(capRank, maxRank - 1);

    var capApplied = meanRank > capRank;
    // BINDING is the useful thing to report, and it is broader than APPLIED: a
    // ceiling that sits exactly at the mean did not lower the grade, but it did
    // decide it - the grade could not have been higher. Reporting only the
    // "held down" case left the reader with no idea a ceiling was in play,
    // which is precisely the situation the demo dataset lands in.
    // ...but a ceiling sitting at the top of the scale constrains nothing, so
    // it is not "binding" however the ranks compare. Without this an assessment
    // where every domain is top grade announced that its weakest domain had set
    // a ceiling - naming all seven domains as the weakest.
    var capBinding = capRank < maxRank && meanRank >= capRank;
    var headlineGrade = capApplied ? letterAtRank(capRank, profile.letterBands) : meanGrade;
    // Which ceiling is in play, so the report can say why rather than just that
    // the grade was held down. Computed for BINDING, not just applied.
    var capReason = !capBinding ? null
      : (weakestRank + capDistance <= maxRank - 1 || topUnanimous) ? "weakest" : "not-unanimous";

    return {
      headlineGrade: headlineGrade,
      headlineMeanScore: meanScore,
      headlineMeanGrade: meanGrade,
      weakestDomain: weakest,         // back-compat: first tied (for the cap)
      weakestDomains: weakestDomains, // every domain tied at the lowest grade
      capApplied: capApplied,
      capBinding: capBinding,
      capCeilingGrade: letterAtRank(capRank, profile.letterBands),
      capReason: capReason,
      capDistance: capDistance,
      topGradeUnanimous: topUnanimous,
      gradedCount: graded.length
    };
  }

  // Priority ordering: all GRADED domains worst-to-best by score, plus a
  // separate bucket of insufficient-evidence (low coverage) domains so the
  // consultant can see what still needs assessing. Ungraded items are not
  // ranked; they are listed for awareness only.
  function priorityOrder(perDomain) {
    var graded   = perDomain.filter(function (d) { return d.score !== null && !d.lowCoverage; });
    var insufficient = perDomain.filter(function (d) { return d.lowCoverage; });
    var unassessed = perDomain.filter(function (d) { return d.score === null && !d.lowCoverage; });
    graded.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      return (a.name || a.domainId).localeCompare(b.name || b.domainId);
    });
    return { graded: graded, insufficient: insufficient, unassessed: unassessed };
  }

  function bandLabel(band, instrument) {
    var scale = instrument && instrument.responseModel && instrument.responseModel.bandScale;
    if (!scale) return String(band);
    for (var i = 0; i < scale.length; i++) {
      if (scale[i].value === band) return scale[i].label;
    }
    return String(band);
  }

  function scoreQuestion(q, response, profile) {
    var isScored   = q.scored !== false;
    var applicable = response ? response.applicable !== false : true;
    var unknown    = response ? response.unknown === true : false;
    var band       = response && typeof response.band === "number" ? response.band : null;

    var result = {
      questionId: q.id,
      itemId:     q.id,               // uniform id for the shared remediation/roadmap UI
      code:       q.id,
      // A short noun phrase for tables and headings, the way every other
      // family has one. The full question stays available as `prompt`, and the
      // report body still shows it, so nothing is lost.
      title:      q.shortTitle || q.prompt,
      domainId:   q.domainId,
      prompt:     q.prompt,
      scored:     isScored,
      applicable: applicable,
      unknown:    unknown,
      band:       band,
      bandLabel:  null,
      safetyFlag: !!q.safetyFlag,
      score:      null,
      state:      "unanswered", // unanswered | scored | unknown | na | context
      evidence:   response ? (response.evidence || "") : "",
      notes:      response ? (response.notes    || "") : "",
      // Consultant remediation plan (post-assessment).
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : ""
    };

    if (!isScored)        { result.state = "context";    return result; }
    if (!applicable)      { result.state = "na";         return result; }
    if (unknown)          { result.state = "unknown";    return result; }
    if (band === null)    { return result; }             // remains "unanswered"

    var bb = bandBounds(profile);
    result.score = bb.range > 0 ? (band - bb.min) / bb.range : 0;
    result.state = "scored";
    return result;
  }

  function rollUpDomain(domain, perQuestion, profile) {
    var scoredQs   = perQuestion.filter(function (q) { return q.state === "scored"; });
    var scorableQs = perQuestion.filter(function (q) { return q.scored && q.state !== "na"; });
    var answeredCount = scoredQs.length;
    var scorableCount = scorableQs.length;
    var naCount       = perQuestion.filter(function (q) { return q.state === "na"; }).length;
    var unknownCount  = perQuestion.filter(function (q) { return q.state === "unknown"; }).length;
    var contextCount  = perQuestion.filter(function (q) { return q.state === "context"; }).length;

    var coverage = scorableCount > 0 ? (answeredCount / scorableCount) : null;
    // One division over the summed bands, not a sum of the per-question
    // fractions. The bands are whole numbers and add exactly, whereas the
    // fractions do not: answers 3,2,1,0,0 summed as 1 + 2/3 + 1/3 came to
    // 1.9999999999999998, so a domain worth exactly 6/15 = 0.40 (a D) scored
    // 0.39999999999999997 and graded E, and with every other domain at A the
    // cap then pulled the headline from B to C. Rounded as well, for the same
    // reason as the headline mean.
    var bb = bandBounds(profile);
    var score = null;
    if (answeredCount > 0) {
      var bandSum = scoredQs.reduce(function (a, q) { return a + (q.band - bb.min); }, 0);
      score = bb.range > 0 ? roundScore(bandSum / (bb.range * answeredCount)) : 0;
    }
    var grade    = score !== null ? classifyLetter(score, profile.letterBands) : null;

    var threshold  = typeof profile.coverageThreshold === "number" ? profile.coverageThreshold : 0.6;
    var lowCoverage = coverage !== null && coverage < threshold;

    // Confidence flag. unknownRate = unknown / (unknown + answered) i.e. share
    // of Unknown answers among ATTEMPTED scored questions (not all scorable -
    // that is the coverage figure, which is a different concept). If nothing
    // was attempted in this domain, confidence is null.
    var attemptedCount = unknownCount + answeredCount;
    var unknownRate    = attemptedCount > 0 ? (unknownCount / attemptedCount) : null;
    var confidence     = confidenceLevelFor(unknownRate, profile);

    return {
      domainId: domain.id,
      name: domain.name,
      score: score,
      grade: grade,
      coverage: coverage,
      lowCoverage: lowCoverage,
      answeredCount: answeredCount,
      scorableCount: scorableCount,
      unknownCount: unknownCount,
      naCount: naCount,
      contextCount: contextCount,
      attemptedCount: attemptedCount,
      unknownRate: unknownRate,
      confidenceLevel: confidence,
      confidenceKey: confidenceKey(confidence),
      questions: perQuestion
    };
  }

  function scoreSite(instrument, profile, responses) {
    var byQ = {};
    (responses || []).forEach(function (r) { byQ[r.requirementId || r.questionId] = r; });

    var perQuestion = (instrument.questions || []).map(function (q) {
      var pq = scoreQuestion(q, byQ[q.id], profile);
      pq.bandLabel = (pq.band !== null) ? bandLabel(pq.band, instrument) : null;
      return pq;
    });

    var perDomain = (instrument.domains || []).map(function (d) {
      var qs = perQuestion.filter(function (q) { return q.domainId === d.id; });
      return rollUpDomain(d, qs, profile);
    });

    var headline = computeHeadline(perDomain, profile);
    var priority = priorityOrder(perDomain);

    var totalAnswered = perDomain.reduce(function (a, d) { return a + d.answeredCount; }, 0);
    var totalScorable = perDomain.reduce(function (a, d) { return a + d.scorableCount; }, 0);
    var totalUnknown  = perDomain.reduce(function (a, d) { return a + d.unknownCount; }, 0);
    var totalAttempted = totalAnswered + totalUnknown;
    var overallCoverage = totalScorable > 0 ? (totalAnswered / totalScorable) : null;
    var overallUnknownRate = totalAttempted > 0 ? (totalUnknown / totalAttempted) : null;
    var overallConfidence = confidenceLevelFor(overallUnknownRate, profile);
    var threshold = typeof profile.coverageThreshold === "number" ? profile.coverageThreshold : 0.6;
    var lowConfidence = overallCoverage !== null && overallCoverage < threshold;

    // Per-question remediation roadmap: scored questions not yet at the top band
    // (an improvement opportunity). Honours the consultant's manual priority
    // order (drag), else worst score first, then by question id.
    var roadmap = perQuestion.filter(function (q) {
      return q.state === "scored" && q.score !== null && q.score < 1;
    });
    roadmap.sort(function (a, b) {
      var ap = typeof a.priorityRank === "number", bp = typeof b.priorityRank === "number";
      if (ap && bp) return a.priorityRank - b.priorityRank;
      if (ap) return -1;
      if (bp) return 1;
      if (a.score !== b.score) return a.score - b.score;
      return String(a.questionId).localeCompare(String(b.questionId));
    });

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perDomain: perDomain,
      perQuestion: perQuestion,
      roadmap: roadmap,
      headlineGrade: headline.headlineGrade,
      headlineMeanScore: headline.headlineMeanScore,
      headlineMeanGrade: headline.headlineMeanGrade,
      capApplied: headline.capApplied,
      capBinding: headline.capBinding,
      capCeilingGrade: headline.capCeilingGrade,
      capReason: headline.capReason,
      topGradeUnanimous: headline.topGradeUnanimous,
      capDistance: headline.capDistance,
      gradedDomainCount: headline.gradedCount,
      weakestDomain: headline.weakestDomain,
      weakestDomains: headline.weakestDomains,
      priorityOrder: priority,
      overallUnknownRate: overallUnknownRate,
      overallConfidenceLevel: overallConfidence,
      overallConfidenceKey: confidenceKey(overallConfidence),
      overallCoverage: overallCoverage,
      coverageThreshold: threshold,
      lowConfidence: lowConfidence,
      totalScorable: totalScorable,
      totalAnswered: totalAnswered,
      totalContextOnly: perQuestion.filter(function (q) { return q.state === "context"; }).length,
      totalNA: perQuestion.filter(function (q) { return q.state === "na"; }).length,
      totalUnknown: perQuestion.filter(function (q) { return q.state === "unknown"; }).length,
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
    classifyLetter: classifyLetter,
    letterRank: letterRank,
    letterAtRank: letterAtRank,
    bandLabel: bandLabel,
    computeHeadline: computeHeadline,
    confidenceLevelFor: confidenceLevelFor,
    confidenceKey: confidenceKey,
    priorityOrder: priorityOrder,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    formatPct: formatPct
  };
})();
