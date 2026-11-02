/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring-risk-appetite.js - the risk-appetite-coherence family.
 *
 * This is NOT a grade, and the code must not quietly turn it into one. Two
 * INDEPENDENT positions are characterised:
 *
 *   exposure  limited -> moderate -> high -> severe     (what the org faces)
 *   appetite  averse  -> cautious -> open  -> tolerant  (what it accepts)
 *
 * Neither axis has a good end. A tolerant appetite is not a failing; it is only
 * a failing against an exposure that does not justify it. The finding is the
 * FIT, read as a verdict:
 *
 *   aligned          within one band of each other
 *   under-protected  appetite 2+ bands more tolerant than exposure warrants
 *   over-invested    appetite 2+ bands more averse than exposure requires
 *
 * So there is deliberately no letter, no percentage, no "score" field, and no
 * ordering of one organisation against another. The one place a direction
 * exists is severity BETWEEN verdicts: under-protection is the finding that
 * matters, over-investment is worth saying but far less serious.
 *
 * The tool scaffolds and never decides. Item bands suggest a section band; the
 * sector baseline suggests the exposure band; the assessor confirms or
 * overrides, and what they set is what is reported. `source` on each axis says
 * which it was, so the report can be honest about where the number came from.
 */
window.App = window.App || {};
window.App.ScoringRiskAppetite = (function () {
  "use strict";

  var FAMILY = "risk-appetite-coherence";

  // Fallbacks only. The bands are the profile's to define (shared/scoring-
  // profiles.json), and an instrument that ships different ones must not be
  // silently re-scaled to these.
  var DEFAULT_BANDS = {
    exposure: ["limited", "moderate", "high", "severe"],
    appetite: ["averse", "cautious", "open", "tolerant"]
  };

  // The three readings. Ordered worst-first for anywhere that lists them.
  var VERDICTS = {
    "under-protected": "Under-protected",
    "over-invested": "Over-invested",
    "aligned": "Aligned"
  };

  function isRiskAppetite(instrument) {
    return !!instrument && instrument.scoringFamily === FAMILY;
  }

  function axisSpec(profile, axis) {
    var a = profile && profile.axes && profile.axes[axis];
    return {
      label: (a && a.label) || (axis === "exposure" ? "Inherent risk exposure" : "Apparent risk appetite"),
      bands: (a && a.bands && a.bands.length) ? a.bands.slice() : DEFAULT_BANDS[axis].slice(),
      meaning: (a && a.meaning) || "",
      bandDefinitions: (a && a.bandDefinitions) || {},
      // How items suggest a section band. Exposure follows the worst credible
      // consequence; appetite is weighed across its readings. The profile says
      // which; these defaults only apply to a profile that predates the field.
      rollUp: (a && a.rollUp) || (axis === "exposure" ? "worst" : "mean")
    };
  }

  // A section's axis: TECH is "appetite-revealed", which is the appetite scale
  // read from technical reality rather than from the interview.
  function axisForSection(section) {
    var a = (section && section.axis) || "";
    return a === "exposure" ? "exposure" : "appetite";
  }

  // Bands are ordinal, 1-based, so 0 can mean "not set" without colliding with
  // a real band. rank - rank is the only arithmetic this family does.
  function rankOf(band, bands) {
    var i = bands.indexOf(band);
    return i < 0 ? 0 : i + 1;
  }
  function bandAtRank(rank, bands) {
    if (!rank || rank < 1) return null;
    return bands[Math.min(Math.max(Math.round(rank), 1), bands.length) - 1] || null;
  }
  function titleCase(s) {
    s = String(s || "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  // ---- setup -------------------------------------------------------------
  // What the sector picker and the technical-layer toggle record. Held on the
  // assessment (ass.riskAppetiteSetup) so it saves and loads like any answer.
  function defaultSetup(instrument) {
    var s = { sectorId: "", includeTech: false, modifiers: [] };
    (instrument && instrument.setup || []).forEach(function (st) {
      if (st.type === "toggle" && st.id === "setup.techlayer") s.includeTech = !!st.default;
    });
    return s;
  }

  function sectorTable() {
    var d = window.App.Data && window.App.Data.shared;
    return (d && d.riskAppetiteSectorBaselines) || null;
  }
  function sectors() {
    var t = sectorTable();
    return (t && t.sectors) || [];
  }
  function sectorById(id) {
    return sectors().filter(function (s) { return s.id === id; })[0] || null;
  }
  function exposureModifiers() {
    var t = sectorTable();
    return (t && t.exposureModifiers) || [];
  }
  // The baseline is a STARTING POINT, never a determination - the file says so
  // itself, and the assessor can override the band outright.
  function sectorBaselineBand(setup) {
    var s = sectorById(setup && setup.sectorId);
    return (s && s.baseline) || null;
  }

  // ---- items -------------------------------------------------------------
  function itemsFor(instrument, sectionId) {
    return (instrument.items || []).filter(function (it) { return it.sectionId === sectionId; });
  }

  // Technical readings only. Old firmware is not appetite if it is pinned by
  // vendor certification and the risk is compensated and tracked: that is a
  // constraint, and scoring it as a "tolerant appetite" is both unfair and the
  // first thing an OT engineer will challenge. So each technical reading says
  // what it is:
  //   accepted     a choice, or left unmanaged: counts as revealed appetite.
  //                A constraint nobody is managing is still appetite.
  //   constrained  a genuine operational constraint that IS being managed:
  //                reported, not counted
  //   unknown      could not be established: reported, not counted
  // Unset counts as accepted, so earlier files read exactly as before.
  var DISPOSITIONS = ["accepted", "constrained", "unknown"];
  function dispositionOf(resp) {
    var d = resp && resp.disposition;
    return DISPOSITIONS.indexOf(d) >= 0 ? d : "";
  }

  // What a band means for THIS item. The axis definitions say what "open"
  // means for appetite in general; an anchor says what it looks like for risk
  // acceptance in particular, which is what two consultants need to band the
  // same organisation the same way.
  function anchorsFor(item, spec) {
    var own = (item && item.bandAnchors) || {};
    var out = {};
    (spec.bands || []).forEach(function (b) { out[b] = own[b] || (spec.bandDefinitions || {})[b] || ""; });
    return out;
  }

  // "Could not establish", on any item. Interview-led work always produces
  // some of these ("nobody could say who signs off a risk acceptance"), and in
  // this instrument not knowing is often the finding. The reading is left out
  // of the band rather than guessed, counts as dealt with for progress, and is
  // reported. Stored as `notEstablished`, not `unknown`, because domain-letter
  // responses already use `unknown` with a different meaning.
  //
  // Files from before this existed recorded it as the technical-only
  // disposition "unknown"; that still reads as not established.
  function notEstablishedOf(resp) {
    return !!(resp && (resp.notEstablished === true || resp.disposition === "unknown"));
  }

  function readItem(item, resp, bands) {
    var notEstablished = notEstablishedOf(resp);
    var band = notEstablished ? null : ((resp && resp.band) || null);
    if (band && bands.indexOf(band) < 0) band = null;   // a band from another axis is not an answer
    var disposition = notEstablished ? "" : dispositionOf(resp);
    if (disposition === "unknown") disposition = "";
    return {
      notEstablished: notEstablished,
      disposition: disposition,
      counts: disposition !== "constrained",
      anchor: band ? ((item.bandAnchors || {})[band] || "") : "",
      itemId: item.id,
      code: item.code || item.id,
      title: item.title || "",
      sectionId: item.sectionId,
      interviewPrompt: item.interviewPrompt || "",
      rationale: item.rationale || "",
      stateSummary: item.stateSummary || "",
      band: band,
      bandLabel: band ? titleCase(band) : null,
      rank: rankOf(band, bands),
      characterisation: (resp && resp.notes) || "",
      // What the reading rests on: who said it, which document, what was seen.
      // Kept apart from the characterisation so a challenged band can be traced.
      evidence: (resp && resp.evidence) || "",
      answered: !!band || !!(resp && String(resp.notes || "").trim())
    };
  }

  // ---- sections ----------------------------------------------------------
  // The suggested band follows the axis's roll-up rule from the profile:
  //   worst  exposure: the highest item band, because an organisation is
  //          exposed to its worst credible consequence, not an average of them
  //   mean   appetite: the rounded mean, because appetite is an overall posture
  // It is a starting position the assessor accepts or moves. Deliberately NOT a
  // weighted model: inventing weights would dress judgement up as calculation.
  function rollUpSection(section, scoredItems, bands, override, mode) {
    var withBand = scoredItems.filter(function (i) { return i.rank > 0; });
    // Only readings that count as appetite suggest the band. Managed
    // constraints and readings that could not be established are still
    // answered (they count towards coverage), they just do not move the band.
    var counted = withBand.filter(function (i) { return i.counts !== false; });
    var suggestedRank = 0;
    if (counted.length && mode === "worst") {
      // Exposure: the highest reading. A severe consequence is not averaged
      // away by a high regulatory or geopolitical reading beside it.
      suggestedRank = counted.reduce(function (a, i) { return Math.max(a, i.rank); }, 0);
    } else if (counted.length) {
      var sum = counted.reduce(function (a, i) { return a + i.rank; }, 0);
      suggestedRank = sum / counted.length;
    }
    var suggested = bandAtRank(suggestedRank, bands);
    var band = (override && bands.indexOf(override) >= 0) ? override : suggested;
    return {
      sectionId: section.id,
      name: section.name || section.id,
      axis: section.axis || "",
      optional: !!section.optional,
      summary: section.summary || "",
      items: scoredItems,
      answeredCount: withBand.length,
      countedCount: counted.length,
      constrainedCount: withBand.filter(function (i) { return i.disposition === "constrained"; }).length,
      notEstablishedCount: scoredItems.filter(function (i) { return i.notEstablished; }).length,
      notEstablishedItems: scoredItems.filter(function (i) { return i.notEstablished; }),
      itemCount: scoredItems.length,
      coverage: scoredItems.length ? (withBand.length / scoredItems.length) : null,
      suggestedBand: suggested,
      suggestedRank: suggestedRank ? Math.round(suggestedRank * 100) / 100 : null,
      band: band,
      bandLabel: band ? titleCase(band) : null,
      rank: rankOf(band, bands),
      overridden: !!(override && bands.indexOf(override) >= 0 && override !== suggested)
    };
  }

  // ---- the coherence read ------------------------------------------------
  //
  // The warranted appetite is the MIRROR of exposure: the more you face, the
  // less you should be accepting. On a 4-band scale severe(4) warrants
  // averse(1), limited(1) warrants tolerant(4) - so warranted = 5 - exposure,
  // and in general warranted = (nBands + 1) - exposureRank.
  //
  //   delta = appetiteRank - warrantedRank
  //         = appetiteRank + exposureRank - (nBands + 1)
  //
  // Positive: accepting more risk than the exposure warrants (under-protected).
  //
  // NOTE ON THE PROFILE: scoring-profiles.json describes this in coherenceRead
  // .method as "appetite rank minus exposure rank", which contradicts its own
  // band definitions and both of its worked examples - "a severe-exposure
  // organisation that is appropriately averse is aligned" and "a limited-
  // exposure organisation that is tolerant" is aligned. Both of those are
  // mirror pairings, and plain subtraction would score severe exposure with a
  // tolerant appetite as ALIGNED, which is the exact finding this instrument
  // exists to surface. The definitions and the examples win; the one loose
  // sentence does not. output.visual agrees: "Diagonal = coherence".
  function coherenceDelta(exposureRank, appetiteRank, nBands) {
    return appetiteRank + exposureRank - (nBands + 1);
  }

  function readCoherence(exposureRank, appetiteRank, profile, nBands) {
    nBands = nBands || DEFAULT_BANDS.exposure.length;
    if (!exposureRank || !appetiteRank) {
      return {
        key: "incomplete",
        label: "Not yet characterised",
        delta: null,
        severity: 0,
        explanation: "Both positions have to be set before the fit between them can be read."
      };
    }
    var delta = coherenceDelta(exposureRank, appetiteRank, nBands);
    var read = (profile && profile.coherenceRead) || {};
    if (delta >= 2) {
      return {
        key: "under-protected", label: "Under-protected", delta: delta, severity: 2,
        explanation: read["under-protected"] ||
          "Appetite is more tolerant than the exposure warrants: risk is being accepted that the profile does not justify."
      };
    }
    if (delta <= -2) {
      return {
        key: "over-invested", label: "Over-invested", delta: delta, severity: 1,
        explanation: read["over-invested"] ||
          "Appetite is more averse than the exposure requires: possibly spending or constraining operations beyond what the risk justifies."
      };
    }
    // Aligned covers ten of the sixteen combinations, including severe exposure
    // with a cautious appetite and high exposure with an open one. Those four
    // one-band-off cells are in proportion, but not dead centre, and the
    // report should say which way they lean. The verdict itself is unchanged:
    // `lean` is a qualifier on "aligned", never a fourth verdict.
    var lean = delta === 1 ? "under-protected" : delta === -1 ? "over-invested" : null;
    return {
      key: "aligned", label: "Aligned", delta: delta, severity: 0, lean: lean,
      displayLabel: lean ? "Aligned, leaning " + lean : "Aligned",
      explanation: read.aligned ||
        "Appetite broadly matches exposure. Coherent does not mean good: it means the organisation accepts risk roughly in line with what it faces."
    };
  }

  // Stated (interview) against revealed (technical). A gap here is a finding in
  // its own right, whichever direction it runs.
  function readStatedVsRevealed(stated, revealed, bands) {
    if (!stated || !stated.rank || !revealed || !revealed.rank) return null;
    var gap = revealed.rank - stated.rank;
    var note;
    if (gap === 0) {
      note = "The technical picture matches the appetite described in interview.";
    } else if (gap > 0) {
      note = "Technical reality reveals a more tolerant appetite than was described: the organisation states " +
             titleCase(stated.band) + " but its systems show " + titleCase(revealed.band) +
             ". Risk is being accepted in practice that leadership may not know it is accepting.";
    } else {
      note = "Technical reality is tighter than the stated appetite: the organisation describes " +
             titleCase(stated.band) + " but its systems show " + titleCase(revealed.band) +
             ". Practice is ahead of the stated position, which is worth recognising and formalising.";
    }
    return {
      statedBand: stated.band, statedRank: stated.rank,
      revealedBand: revealed.band, revealedRank: revealed.rank,
      gap: gap, material: Math.abs(gap) >= 2, note: note, bands: bands.slice()
    };
  }

  // ---- the whole assessment ----------------------------------------------
  /* responses: one per item, { requirementId, band, notes }
   * setup:     { sectorId, includeTech, modifiers, exposureBand, appetiteBand }
   *            where exposureBand / appetiteBand are the assessor's overrides
   *            of the rolled-up section bands.
   */
  function scoreSite(instrument, profile, responses, setup) {
    setup = setup || defaultSetup(instrument);
    var expAxis = axisSpec(profile, "exposure");
    var appAxis = axisSpec(profile, "appetite");

    var byItem = {};
    (responses || []).forEach(function (r) {
      if (r && r.requirementId) byItem[r.requirementId] = r;
    });

    var sections = (instrument.sections || []).map(function (sec) {
      var axis = axisForSection(sec);
      var spec = axis === "exposure" ? expAxis : appAxis;
      var bands = spec.bands;
      var scored = itemsFor(instrument, sec.id).map(function (it) {
        var r = readItem(it, byItem[it.id], bands);
        // Constraint-versus-choice is a question about technical readings only.
        // An interview reading of appetite is appetite by definition.
        if (sec.axis !== "appetite-revealed") { r.disposition = ""; r.counts = true; }
        return r;
      });
      var override = sec.axis === "exposure" ? setup.exposureBand
                   : sec.axis === "appetite" ? setup.appetiteBand
                   : setup.revealedBand;
      var rolled = rollUpSection(sec, scored, bands, override, spec.rollUp);
      rolled.rollUp = spec.rollUp;
      return rolled;
    });

    function sectionByAxis(a) {
      return sections.filter(function (s) { return s.axis === a; })[0] || null;
    }
    var expSec = sectionByAxis("exposure");
    var appSec = sectionByAxis("appetite");
    var techSec = sectionByAxis("appetite-revealed");
    var techIncluded = !!setup.includeTech;

    // Exposure has a third source the other axis does not: the sector baseline,
    // which stands in before any item is answered so the conversation starts
    // somewhere rather than nowhere.
    var baseline = sectorBaselineBand(setup);
    var exposureBand = expSec && expSec.band;
    var exposureSource = "items";
    if (setup.exposureBand && expAxis.bands.indexOf(setup.exposureBand) >= 0) {
      exposureBand = setup.exposureBand; exposureSource = "assessor";
    } else if (!exposureBand && baseline) {
      exposureBand = baseline; exposureSource = "sector-baseline";
    } else if (!exposureBand) {
      exposureSource = "unset";
    }

    var appetiteBand = appSec && appSec.band;
    var appetiteSource = (setup.appetiteBand && appAxis.bands.indexOf(setup.appetiteBand) >= 0)
      ? "assessor" : (appetiteBand ? "items" : "unset");
    if (appetiteSource === "assessor") appetiteBand = setup.appetiteBand;

    var exposure = {
      axis: "exposure", label: expAxis.label, bands: expAxis.bands.slice(),
      bandDefinitions: expAxis.bandDefinitions, meaning: expAxis.meaning,
      band: exposureBand || null, bandLabel: exposureBand ? titleCase(exposureBand) : null,
      rank: rankOf(exposureBand, expAxis.bands),
      source: exposureSource,
      sectorBaseline: baseline,
      sectorName: (sectorById(setup.sectorId) || {}).name || "",
      sectorNote: (sectorById(setup.sectorId) || {}).note || "",
      // A baseline the assessor moved away from is worth showing: it is the
      // visible trace of a judgement, and this instrument trades on judgement.
      movedFromBaseline: !!(baseline && exposureBand && baseline !== exposureBand),
      modifiers: (setup.modifiers || []).slice(),
      section: expSec
    };

    var appetite = {
      axis: "appetite", label: appAxis.label, bands: appAxis.bands.slice(),
      bandDefinitions: appAxis.bandDefinitions, meaning: appAxis.meaning,
      band: appetiteBand || null, bandLabel: appetiteBand ? titleCase(appetiteBand) : null,
      rank: rankOf(appetiteBand, appAxis.bands),
      source: appetiteSource,
      section: appSec
    };

    var revealed = null;
    if (techIncluded && techSec && techSec.rank > 0) {
      revealed = {
        axis: "appetite-revealed", label: techSec.name, bands: appAxis.bands.slice(),
        band: techSec.band, bandLabel: techSec.bandLabel, rank: techSec.rank,
        source: techSec.overridden ? "assessor" : "items",
        section: techSec
      };
    }

    var verdict = readCoherence(exposure.rank, appetite.rank, profile, expAxis.bands.length);

    // The assessor has the final say. The bands are a scaffold and cannot see
    // a compensating group control, an imminent divestment, a regulator-agreed
    // trajectory, or a board that has genuinely decided to carry a risk with
    // its eyes open. So the verdict can be set directly - but the computed read
    // is KEPT and reported alongside it, with the stated reason. An override a
    // reader cannot see is just a wrong answer with better manners.
    var computed = {
      key: verdict.key, label: verdict.label, delta: verdict.delta,
      severity: verdict.severity, explanation: verdict.explanation,
      lean: verdict.lean || null, displayLabel: verdict.displayLabel || verdict.label
    };
    var ovKey = setup.verdictOverride;
    if (ovKey && VERDICTS[ovKey] && ovKey !== verdict.key) {
      verdict = {
        key: ovKey,
        label: VERDICTS[ovKey],
        delta: verdict.delta,                 // where the bands put them, unchanged
        severity: ovKey === "under-protected" ? 2 : ovKey === "over-invested" ? 1 : 0,
        explanation: (profile && profile.coherenceRead && profile.coherenceRead[ovKey]) || "",
        overridden: true,
        computed: computed,
        rationale: String(setup.verdictRationale || "").trim(),
        // Recorded without a reason is a judgement nobody can weigh. Flagged
        // rather than refused: the consultant may still be mid-sentence.
        rationaleMissing: !String(setup.verdictRationale || "").trim(),
        // No lean on a verdict the assessor set: a lean comes from the band
        // arithmetic, and hanging it on their judgement would put that
        // arithmetic back in front of the client.
        lean: null,
        displayLabel: VERDICTS[ovKey]
      };
    } else {
      if (!verdict.displayLabel) verdict.displayLabel = verdict.label;
      if (verdict.lean === undefined) verdict.lean = null;
      verdict.overridden = false;
      verdict.computed = computed;
      verdict.rationale = "";
      verdict.rationaleMissing = false;
    }
    // The appetite this exposure warrants - what "aligned" would have looked
    // like. The report and the plot both need it, and it is the sentence a
    // consultant actually says out loud.
    verdict.warrantedBand = exposure.rank
      ? bandAtRank(expAxis.bands.length + 1 - exposure.rank, appAxis.bands) : null;
    var svr = techIncluded ? readStatedVsRevealed(appetite, revealed, appAxis.bands) : null;
    // What the fit would be on each reading of appetite. Kept so a headline can
    // say "on either reading" when, and only when, that is true: with severe
    // exposure a cautious stated appetite reads aligned while a tolerant revealed
    // one reads under-protected, and claiming "either" there would be false.
    if (svr) {
      svr.verdictOnStated = readCoherence(exposure.rank, svr.statedRank, profile, expAxis.bands.length).key;
      svr.verdictOnRevealed = readCoherence(exposure.rank, svr.revealedRank, profile, expAxis.bands.length).key;
    }

    // Coverage counts only the sections in play: the technical layer is
    // optional, and an assessment that switched it off is not incomplete.
    var counted = sections.filter(function (s) {
      return s.axis !== "appetite-revealed" || techIncluded;
    });
    var answered = counted.reduce(function (a, s) { return a + s.answeredCount; }, 0);
    // Readings that could not be established were asked about and settled,
    // just not placed on a band. Reported separately rather than as answered.
    var notEstablished = counted.reduce(function (a, s) { return a + (s.notEstablishedCount || 0); }, 0);
    var total = counted.reduce(function (a, s) { return a + s.itemCount; }, 0);

    return {
      family: FAMILY,
      instrumentId: instrument.id,
      // No headline grade, no score, on purpose: see the header comment.
      letterGrade: false,
      indicative: true,
      exposure: exposure,
      appetite: appetite,
      revealed: revealed,
      verdict: verdict,
      statedVsRevealed: svr,
      techIncluded: techIncluded,
      // The technical section even when none of its readings count, so the report
      // can still say they were constraints rather than silently dropping them.
      techSection: techIncluded ? techSec : null,
      sections: sections,
      setup: setup,
      coverage: { answered: answered, notEstablished: notEstablished, total: total, rate: total ? answered / total : null },
      complete: !!(exposure.rank && appetite.rank)
    };
  }

  // One organisation per assessment (targetDimension is "organisation"), so the
  // engagement roll-up is the active target's read. The shape still matches the
  // other families so the report chassis and exports need no special case.
  function scoreEngagement(engagement, instrument, profile, setup) {
    var targets = (engagement && engagement.targets) || [];
    var perTarget = targets.map(function (t) {
      var rs = (engagement.responses || []).filter(function (r) { return r.targetId === t.id; });
      return { target: t, result: scoreSite(instrument, profile, rs, setup) };
    });
    return { perTarget: perTarget, primary: perTarget.length ? perTarget[0].result : null };
  }

  return {
    FAMILY: FAMILY,
    VERDICTS: VERDICTS,
    DISPOSITIONS: DISPOSITIONS,
    anchorsFor: anchorsFor,
    isRiskAppetite: isRiskAppetite,
    axisSpec: axisSpec,
    axisForSection: axisForSection,
    rankOf: rankOf,
    bandAtRank: bandAtRank,
    titleCase: titleCase,
    defaultSetup: defaultSetup,
    sectorTable: sectorTable,
    sectors: sectors,
    sectorById: sectorById,
    exposureModifiers: exposureModifiers,
    sectorBaselineBand: sectorBaselineBand,
    rollUpSection: rollUpSection,
    coherenceDelta: coherenceDelta,
    readCoherence: readCoherence,
    readStatedVsRevealed: readStatedVsRevealed,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement
  };
})();
