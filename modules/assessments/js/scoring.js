/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* scoring.js
 *
 * Pure scoring for the capability-SL family (ISA/IEC 62443-3-3 and -4-2).
 *
 * THE UNIT OF ASSESSMENT IS THE ITEM, NOT THE REQUIREMENT.
 * A requirement contributes a base item plus one item per requirement
 * enhancement, and each item first applies at a specific Security Level. That
 * mapping is Annex B of the standard, and it is already in the instrument as
 * `slGuidance` (which lists, per SL, the components required at that level),
 * so requirementItems() derives it rather than needing new content.
 *
 * The assessor answers "is this item satisfied?" per item. They are never
 * asked to judge which SL a requirement sits at - that is computed.
 *
 *   Item states:
 *     met               satisfied natively
 *     met-compensating  satisfied by a compensating countermeasure
 *     partial           partially satisfied; NEVER counts toward a level
 *     not-met           not satisfied
 *     na                not applicable; needs a justification to be excluded
 *     (absent)          not assessed; BLOCKS a claim at its level
 *
 *   SL-T scopes the work. For an FR with target t, only items first applying
 *   at levels 1..t are in scope. t = 0 takes the FR out of scope entirely.
 *
 *   SL-A per FR = the highest n where EVERY in-scope item applying at levels
 *   1..n is satisfied. Weakest-link by construction, never averaged. A second
 *   vector, SL-A strict, recomputes it with compensating measures excluded;
 *   the gap between the two is a fragility signal, because compensating
 *   measures are the first thing to decay.
 *
 *   Closeness is retained as CONTEXT ONLY: the share of in-scope items
 *   satisfied, with partial credit from the scoring profile. It never
 *   substitutes for SL-A and never lifts a level.
 *
 *   Blocking items: for each FR, the specific items that hold SL-A below
 *   SL-T. This is the remediation list, from the same structure as the vector.
 */
window.App = window.App || {};
window.App.Scoring = (function () {
  "use strict";

  // ---- helpers ----------------------------------------------------------

  // ISA/IEC 62443-3-2 assigns each zone and conduit its own SL-T, and SL-T is a
  // VECTOR across the seven FRs - a safety zone may need SL 3 for system
  // integrity while the rest of it sits at SL 2. So the target for a given FR
  // is resolved MOST SPECIFIC FIRST:
  //
  //   1. this zone's own override for this FR
  //   2. this zone's own default across FRs
  //   3. the engagement-wide override for this FR
  //   4. the engagement default
  //
  // The first two used to sit BELOW the engagement-wide per-FR override, which
  // meant one global per-FR setting silently overrode every zone's imported
  // SL-T for that FR - the less specific value winning.
  //
  // perZone[targetId] is { default?: number, perFR?: {frId: number} }. Older
  // files stored a bare number there; normaliseZoneTarget accepts both so a
  // saved project keeps scoring the same way.
  function normaliseZoneTarget(entry) {
    if (entry === null || entry === undefined) return null;
    if (typeof entry === "number") return { default: entry, perFR: {} };
    return { default: (typeof entry.default === "number" ? entry.default : null),
             perFR: entry.perFR || {} };
  }

  function effectiveTargetSL(targetProfile, frId, targetId) {
    var tp = targetProfile || {};
    if (targetId && tp.perZone && targetId in tp.perZone) {
      var z = normaliseZoneTarget(tp.perZone[targetId]);
      if (z) {
        if (z.perFR && frId in z.perFR && typeof z.perFR[frId] === "number") return z.perFR[frId];
        if (typeof z.default === "number") return z.default;
      }
    }
    if (tp.perFR && frId in tp.perFR) return tp.perFR[frId];
    return typeof tp.defaultTargetSL === "number" ? tp.defaultTargetSL : 2;
  }

  function classifyCloseness(scoreFraction, profile) {
    var bands = (profile && profile.closenessBands) || [
      { id: "met",  min: 1.0 },
      { id: "near", min: 0.7 },
      { id: "gap",  min: 0.0 }
    ];
    for (var i = 0; i < bands.length; i++) {
      if (scoreFraction >= bands[i].min) return bands[i].id;
    }
    return "gap";
  }

  // ---- per-requirement --------------------------------------------------

  // ---- items (base + requirement enhancements) --------------------------
  //
  // Derived from slGuidance: a component is "introduced" at the LOWEST SL whose
  // components list contains it, and slGuidance[thatSL].reTitle is its name
  // (an enhancement is introduced at exactly one level, so the mapping is
  // unambiguous). No new instrument data is needed - this is Annex B, already
  // present because it drives the "What each SL requires" reference panel.
  var ITEM_STATES = ["met", "met-compensating", "partial", "not-met", "na"];
  function isSatisfied(state)   { return state === "met" || state === "met-compensating"; }
  function isCompensating(state){ return state === "met-compensating"; }

  function requirementItems(req) {
    var g = req && req.slGuidance;
    if (!g) {
      // No Annex B mapping: treat the requirement as a single base item that
      // applies from SL 1, so an instrument without slGuidance still scores.
      return [{ componentId: "base", firstSL: 1, title: req && req.title, isBase: true }];
    }
    var seen = {};
    var items = [];
    [1, 2, 3, 4].forEach(function (n) {
      var entry = g[String(n)];
      if (!entry || !entry.required || !Array.isArray(entry.components)) return;
      entry.components.forEach(function (c) {
        if (seen[c]) return;
        seen[c] = true;
        // Where two enhancements enter at the same level, one reTitle cannot
        // name both: the capture card and the blocking list would show two
        // items with the same label and no way to tell them apart. An optional
        // componentTitles map names them individually.
        var own = entry.componentTitles && entry.componentTitles[c];
        items.push({
          componentId: c,
          firstSL: n,
          title: own || entry.reTitle || (req.title || ""),
          hint: entry.hint || "",
          isBase: c === "base"
        });
      });
    });
    if (!items.length) {
      // Defined in the standard but selected at no SL (e.g. 4-2 CR 2.3, CR 7.5).
      return [];
    }
    return items;
  }

  // Every in-scope item for an FR at a given target, flattened across its
  // requirements. targetSL 0 means the FR is out of scope entirely.
  function inScopeItems(requirements, targetSL) {
    if (!(targetSL > 0)) return [];
    var out = [];
    (requirements || []).forEach(function (req) {
      requirementItems(req).forEach(function (it) {
        if (it.firstSL <= targetSL) out.push({ req: req, item: it });
      });
    });
    return out;
  }


  // ---- per requirement --------------------------------------------------
  //
  // A response now carries a state per component:
  //   { targetId, requirementId, components: { base: {state, note}, RE1: {...} },
  //     evidence, notes, priorityRank, ... }
  // Requirement-level evidence, notes and the remediation plan are unchanged,
  // so the roadmap and export plumbing keyed on requirementId still works.
  function componentState(response, componentId) {
    var c = response && response.components && response.components[componentId];
    return c && c.state ? c.state : null;
  }
  function componentNote(response, componentId) {
    var c = response && response.components && response.components[componentId];
    return (c && c.note) || "";
  }
  function componentSource(response, componentId) {
    var c = response && response.components && response.components[componentId];
    return (c && c.source) || null;
  }

  // ---- the shared layer --------------------------------------------
  //
  // Plenty of countermeasures are implemented once for the whole IACS and
  // inherited by every zone: one directory service, one syslog collector, one
  // patching process. 62443-3-2 calls these common countermeasures. Making the
  // consultant retype them per zone is both tedious and a source of drift, so
  // answers can be recorded against a reserved shared scope and each zone
  // inherits them.
  //
  // Resolution is per ITEM, which is what makes the awkward cases work: the
  // directory service can satisfy SR 1.1 base everywhere while RE1 is missing
  // everywhere, and the one zone the directory does not reach overrides just
  // that item. Zone always wins over system-wide; nothing is ever merged
  // silently in the other direction.
  //
  // Differing SL-Ts need no special handling: a shared answer is recorded
  // per item, and each zone counts only the items its own SL-T brings into
  // scope.
  var SHARED_TARGET_ID = "__shared";

  function hasPlan(r) {
    if (!r) return false;
    return (typeof r.priorityRank === "number") || !!r.priorityBand ||
           !!r.owner || !!r.action || !!r.impact;
  }

  // Which zones a shared answer covers.
  //
  // A countermeasure is rarely either site-wide or zone-local: one directory
  // may serve every zone while one historian serves two of them. So each
  // shared item carries the set of zones it covers. Absent means all -
  // that is the common case and the default - and a zone outside the set
  // simply does not inherit, which leaves an honest gap rather than an
  // override recorded only to undo a claim that was too broad.
  //
  // Because the set lives on the item, overlapping subsets need no groups and
  // no precedence: SR 1.1 covers five zones, SR 6.1 covers two, independently.
  function coversTarget(comp, targetId) {
    if (!comp) return false;
    var list = comp.appliesTo;
    if (!list || !list.length) return true;      // unscoped: covers everything
    if (!targetId) return true;                   // the shared page itself
    return list.indexOf(targetId) !== -1;
  }

  // One zone response resolved against its system-wide counterpart. Returns a
  // plain response of the usual shape, with `source` stamped on each component
  // and `evidenceSource` / `planSource` recording where the prose came from.
  function resolveResponse(zoneResp, sharedResp, targetId) {
    if (!sharedResp) {
      if (!zoneResp) return null;
      var own = JSON.parse(JSON.stringify(zoneResp));
      Object.keys(own.components || {}).forEach(function (k) { own.components[k].source = "zone"; });
      own.evidenceSource = own.evidence ? "zone" : null;
      own.planSource = hasPlan(own) ? "zone" : null;
      return own;
    }
    var out = JSON.parse(JSON.stringify(zoneResp || { targetId: null, requirementId: sharedResp.requirementId }));
    out.components = out.components || {};
    Object.keys(out.components).forEach(function (k) { out.components[k].source = "zone"; });
    var anyCovered = false;
    Object.keys(sharedResp.components || {}).forEach(function (k) {
      var c = sharedResp.components[k];
      if (!c || !c.state) return;
      if (!coversTarget(c, targetId)) return;     // this zone is outside its reach
      anyCovered = true;
      if (out.components[k] && out.components[k].state) {
        // The zone overrode it. Keep what it overrode so the capture page can
        // say so rather than silently diverging from the shared answer.
        out.components[k].sharedState = c.state;
        return;
      }
      out.components[k] = { state: c.state, note: c.note || "", source: "shared",
                            sharedCoverage: c.appliesTo ? c.appliesTo.slice() : null };
    });
    // Evidence and the plan follow the items: a zone that inherits none of the
    // shared items should not inherit the paragraph describing them either.
    if (out.evidence) { out.evidenceSource = "zone"; }
    else if (anyCovered && sharedResp.evidence) { out.evidence = sharedResp.evidence; out.evidenceSource = "shared"; }
    else { out.evidenceSource = null; }
    if (!out.notes && anyCovered && sharedResp.notes) out.notes = sharedResp.notes;
    // The picked level follows the items: a zone showing the shared answer
    // should show the level it was recorded at, not fall back to a computed one.
    if (typeof out.slChoice !== "number" && anyCovered && typeof sharedResp.slChoice === "number") {
      out.slChoice = sharedResp.slChoice;
    }
    if (hasPlan(out)) {
      out.planSource = "zone";
    } else if (anyCovered && hasPlan(sharedResp)) {
      out.priorityRank = sharedResp.priorityRank;
      out.priorityBand = sharedResp.priorityBand;
      out.owner  = sharedResp.owner;
      out.action = sharedResp.action;
      out.impact = sharedResp.impact;
      out.planSource = "shared";
    } else {
      out.planSource = null;
    }
    return out;
  }

  // Resolve a whole zone's responses against the shared layer.
  function resolveResponses(zoneResponses, sharedResponses, targetId) {
    var byReq = {};
    (zoneResponses || []).forEach(function (r) { byReq[r.requirementId] = r; });
    var sharedByReq = {};
    (sharedResponses || []).forEach(function (r) { sharedByReq[r.requirementId] = r; });
    var out = [];
    Object.keys(byReq).forEach(function (id) {
      out.push(resolveResponse(byReq[id], sharedByReq[id], targetId));
    });
    Object.keys(sharedByReq).forEach(function (id) {
      if (byReq[id]) return;
      out.push(resolveResponse(null, sharedByReq[id], targetId));
    });
    return out.filter(Boolean);
  }

  // The shared scope has no SL-T of its own: it is answered once for the
  // whole system, so it must show every item that ANY zone needs. Its effective
  // target per FR is therefore the highest across the zones.
  function sharedTargetProfile(targetProfile, targets) {
    var tp = targetProfile || {};
    var out = { defaultTargetSL: typeof tp.defaultTargetSL === "number" ? tp.defaultTargetSL : 2, perFR: {} };
    Object.keys(tp.perFR || {}).forEach(function (frId) { out.perFR[frId] = tp.perFR[frId]; });
    (targets || []).forEach(function (t) {
      var z = normaliseZoneTarget((tp.perZone || {})[t.id]);
      if (!z) return;
      if (typeof z.default === "number" && z.default > out.defaultTargetSL) out.defaultTargetSL = z.default;
      Object.keys(z.perFR || {}).forEach(function (frId) {
        var v = z.perFR[frId];
        if (typeof v !== "number") return;
        if (!(frId in out.perFR) || v > out.perFR[frId]) out.perFR[frId] = v;
      });
    });
    // A zone default above a global per-FR override still has to lift that FR,
    // or an item every zone needs would be hidden from the shared page.
    Object.keys(out.perFR).forEach(function (frId) {
      if (out.perFR[frId] < out.defaultTargetSL) {
        var anyZoneNeedsMore = (targets || []).some(function (t) {
          return effectiveTargetSL(tp, frId, t.id) > out.perFR[frId];
        });
        if (anyZoneNeedsMore) {
          out.perFR[frId] = (targets || []).reduce(function (m, t) {
            return Math.max(m, effectiveTargetSL(tp, frId, t.id));
          }, 0);
        }
      }
    });
    return out;
  }

  // An N/A only excludes an item when it carries a justification. Unjustified
  // N/A is treated as NOT ASSESSED, so it blocks a level rather than silently
  // granting one.
  function itemDisposition(state, note) {
    if (state === "na") {
      return (String(note || "").trim() !== "") ? "excluded" : "unassessed";
    }
    if (state === null || state === undefined) return "unassessed";
    if (isSatisfied(state)) return "satisfied";
    if (state === "partial") return "partial";
    return "not-met";
  }

  function partialWeightOf(profile) {
    var pr = (profile && profile.perRequirementScore) || {};
    if (typeof pr.oneStepBelowTarget === "number") return pr.oneStepBelowTarget;
    if (typeof (profile && profile.partialCreditWeight) === "number") return profile.partialCreditWeight;
    return 0.5;
  }

  function scoreRequirement(req, response, targetSL, profile) {
    var items = requirementItems(req).map(function (it) {
      var state = componentState(response, it.componentId);
      var note  = componentNote(response, it.componentId);
      return {
        requirementId: req.id,
        code: req.code,
        componentId: it.componentId,
        isBase: it.isBase,
        label: it.isBase ? req.code : (req.code + " " + it.componentId.replace(/^RE/, "RE ")),
        title: it.title,
        hint: it.hint,
        firstSL: it.firstSL,
        // "In scope" means required by the target, which is what drives
        // coverage, blocking items and the roadmap. An item above the target is
        // OPTIONAL: it can be recorded, and counts toward the achieved level if
        // it is, but it is never outstanding work and never a gap.
        inScope: targetSL > 0 && it.firstSL <= targetSL,
        aboveTarget: targetSL > 0 && it.firstSL > targetSL,
        state: state,
        note: note,
        // "shared" when the answer was inherited from the shared layer,
        // "zone" when it was recorded here. Drives the capture badges and the
        // cross-zone roadmap.
        source: state ? (componentSource(response, it.componentId) || "zone") : null,
        sharedState: (response && response.components && response.components[it.componentId] &&
                      response.components[it.componentId].sharedState) || null,
        sharedCoverage: (response && response.components && response.components[it.componentId] &&
                         response.components[it.componentId].sharedCoverage) || null,
        disposition: itemDisposition(state, note),
        compensating: isCompensating(state)
      };
    });

    var scoped  = items.filter(function (i) { return i.inScope; });
    var counted = scoped.filter(function (i) { return i.disposition !== "excluded"; });

    // Why a requirement was not scored. Three genuinely different reasons, and
    // a report that lumps them together reads as though the assessor skipped
    // things they never had to look at:
    //   never-selected  carries no security level anywhere in Annex B
    //   out-of-target   first selected ABOVE this FR's SL-T (or the FR is out
    //                   of scope entirely), so the target never reached it
    //   judged-na       the assessor excluded it, with a justification
    // A recorded justification always wins, because that is a human decision.
    var touchedVal  = counted.some(function (i) { return i.disposition !== "unassessed"; });
    var answeredVal = scoped.length === 0 || counted.every(function (i) { return i.disposition !== "unassessed"; });
    var anyExcluded = items.some(function (i) { return i.disposition === "excluded"; });
    var exclusionReason = null;
    if (scoped.length > 0 && counted.length === 0) exclusionReason = "judged-na";
    else if (items.length === 0) exclusionReason = "never-selected";
    else if (scoped.length === 0) exclusionReason = anyExcluded ? "judged-na" : "out-of-target";
    var satisfied = counted.filter(function (i) { return i.disposition === "satisfied"; });
    var partials  = counted.filter(function (i) { return i.disposition === "partial"; });
    var score = counted.length
      ? (satisfied.length + partials.length * partialWeightOf(profile)) / counted.length
      : null;
    // Finding or work still to do. Only an ANSWERED in-scope item that falls
    // short (not met or partial) is a finding. A requirement whose answers are
    // all satisfied but which still has blank in-scope items is not short: it
    // is "to-assess", and stays on the roadmap so the work list is complete.
    //   met        every counted in-scope item satisfied
    //   short      an answered in-scope item falls short
    //   to-assess  answered in part, nothing short, some in-scope item blank
    //   unassessed nothing answered yet
    //   na         nothing in scope to count (out of target, or judged N/A)
    var shortfallVal = counted.some(function (i) {
      return i.disposition === "not-met" || i.disposition === "partial";
    });
    var reqStatus;
    if (scoped.length === 0 || counted.length === 0) reqStatus = "na";
    else if (satisfied.length === counted.length) reqStatus = "met";
    else if (shortfallVal) reqStatus = "short";
    else if (touchedVal) reqStatus = "to-assess";
    else reqStatus = "unassessed";

    return {
      requirementId: req.id,
      itemId: req.id,                 // uniform id for the shared roadmap UI
      frId: req.frId,
      code: req.code,
      title: req.title,
      targetSL: targetSL,
      items: items,
      scopedCount: scoped.length,
      countedCount: counted.length,
      satisfiedCount: satisfied.length,
      partialCount: partials.length,
      notMetCount: counted.filter(function (i) { return i.disposition === "not-met"; }).length,
      unassessedCount: counted.filter(function (i) { return i.disposition === "unassessed"; }).length,
      excludedCount: scoped.length - counted.length,
      compensatingCount: counted.filter(function (i) { return i.compensating; }).length,
      met: counted.length > 0 && satisfied.length === counted.length,
      status: reqStatus,
      // On the roadmap as work still to assess rather than as a finding.
      toAssess: reqStatus === "to-assess",
      // The highest level this requirement's OWN items fully satisfy. The FR's
      // SL-A is the minimum of these across its requirements.
      //
      // Every item is considered, not only the required ones, so a requirement
      // assessed beyond its target reports the level it actually reaches. A
      // requirement that selects nothing above SL 1 therefore reports 4 once
      // its base is met, which is right for the roll-up - it constrains no
      // level - but is NOT what to show a reader. Use `achievedShown` for that.
      itemsAchieved: highestSatisfiedLevel(items, targetSL, false),
      itemsAchievedStrict: highestSatisfiedLevel(items, targetSL, true),
      // The levels this requirement actually distinguishes: the levels at which
      // it selects something new. SR 1.4 selects only a base requirement, so it
      // has one, and "SL 2" and "SL 4" mean exactly what "SL 1" means for it.
      definedLevels: definedLevels(items),
      // What to print, and which button to light.
      //
      // `itemsAchieved` credits every level a requirement does not constrain,
      // above and below the ones it defines, which is right for the roll-up and
      // wrong to show a reader. Two corrections:
      //   - capped at the target or the highest level it defines, whichever is
      //     higher, so a met base-only requirement reads "SL 2" against its
      //     SL 2 target rather than "SL 4";
      //   - floored to 0 below the LOWEST level it defines, so SR 1.8 - which
      //     selects nothing until SL 2 - reads "SL 0" when unmet rather than
      //     claiming an SL 1 it has done nothing to earn.
      achievedShown: (function () {
        var ach = highestSatisfiedLevel(items, targetSL, false);
        if (ach == null) return null;
        var defined = definedLevels(items);
        var auto;
        if (!defined.length) auto = ach;
        else if (ach < defined[0]) auto = 0;
        else auto = Math.min(ach, Math.max(targetSL, defined[defined.length - 1]));
        // An explicit choice above the automatic figure is evidence, not an
        // over-claim: a requirement selecting nothing above SL 1 IS satisfied
        // at SL 4 once its base is, and the consultant saying so is how that
        // headroom gets recorded. Never below, or a picked SL 1 on a
        // requirement that meets its SL 2 target would read as a shortfall
        // while the same report calls it met.
        var chosen = validChoice(response, items, targetSL, counted.length);
        return (chosen != null && chosen > auto) ? chosen : auto;
      })(),
      // The Security Level the consultant actually picked, when the items still
      // say what that level would set. Several levels can set exactly the same
      // items - a requirement selecting nothing above SL 1 is met identically
      // at SL 2, SL 3 and SL 4 - and which of them was chosen is a judgement
      // the items cannot record. Null once the items no longer match it, which
      // is when the card falls back to the computed level and says "Set per
      // item".
      chosenSL: validChoice(response, items, targetSL, counted.length),
      // Recorded above what the target asks for. Never a gap, and never part
      // of the coverage figures; reported so a re-targeting conversation can
      // see where headroom already exists.
      aboveTargetCount: items.filter(function (i) { return i.aboveTarget && i.state; }).length,
      // Floor: this requirement offers little or nothing where protection is
      // required. Either its BASE item is in scope and not satisfied - if the
      // base is missing, none of the requirement is there - or it sits two or
      // more Security Levels below its target. Same definition the report and
      // the methodology appendix state; expressed in items rather than in a
      // hand-entered achieved level.
      // Whether the item states are exactly what "achieves SL n" would set:
      // everything selected at or below itemsAchieved met, everything above it
      // not met, nothing partial, compensating, N/A or unanswered. When they
      // are, the requirement can be shown as a single Security Level without
      // losing anything. When they are not - a compensating measure, a partial,
      // an enhancement in place while the base is not - the capture card says
      // so rather than presenting a number that hides it.
      matchesCleanSL: (function () {
        if (targetSL <= 0 || counted.length === 0) return false;
        if (!touchedVal || !answeredVal) return false;
        var ach = highestSatisfiedLevel(items, targetSL, false);
        // Every answered item, above the target as well as below it, has to be
        // exactly what that level means. An item above the target that was
        // never recorded is simply absent and does not spoil the match.
        //
        // A JUSTIFIED N/A does not spoil it either: excluding an item that does
        // not apply here is an ordinary part of answering a requirement at a
        // level, not evidence that the answer was assembled item by item. An
        // UNjustified one still does - it blocks the level, and the consultant
        // needs to see that rather than a tidy number.
        return items.every(function (i) {
          if (!i.inScope && !i.state) return true;
          if (i.disposition === "excluded") return true;
          return i.firstSL <= ach ? i.state === "met" : i.state === "not-met";
        });
      })(),
      // answered: an untouched requirement is a coverage gap, and an item
      // nobody has looked at cannot be the evidence that protection is absent.
      floor: (function () {
        if (targetSL <= 0 || counted.length === 0 || !touchedVal) return false;
        var base = counted.filter(function (i) { return i.isBase; })[0];
        if (base && base.disposition !== "satisfied" && base.disposition !== "unassessed") return true;
        if (!answeredVal) return false;
        var ach = highestSatisfiedLevel(items, targetSL, false);
        return (targetSL - ach) >= 2;
      })(),
      answered: answeredVal,
      // Answered at all, as opposed to answered in full. An untouched
      // requirement is not a finding and must not appear on the roadmap.
      touched: touchedVal,
      applicable: scoped.length > 0 && counted.length > 0,
      exclusionReason: exclusionReason,
      // Cross-zone provenance.
      //   sharedAnswer  nothing here was answered in the zone itself: every
      //                 answer present came from the shared layer.
      //   gapIsShared   the items falling short are all inherited, so the fix
      //                 is one piece of work rather than one per zone. This is
      //                 what puts a requirement on the cross-zone action list.
      // Unassessed items carry no source and so decide neither flag.
      inheritedCount: counted.filter(function (i) { return i.source === "shared"; }).length,
      sharedAnswer: counted.some(function (i) { return i.source === "shared"; }) &&
                    !counted.some(function (i) { return i.source === "zone"; }),
      gapIsShared: (function () {
        // Judged on answered items only. An item nobody has looked at yet is a
        // coverage gap, not a finding, and must not make a shared action look
        // zone-specific (or the reverse).
        var short = counted.filter(function (i) {
          return i.disposition !== "satisfied" && i.disposition !== "unassessed";
        });
        return short.length > 0 && short.every(function (i) { return i.source === "shared"; });
      })(),
      evidenceSource: response ? (response.evidenceSource || null) : null,
      planSource: response ? (response.planSource || null) : null,
      score: score,
      band: "na",                     // set by the FR roll-up once SL-A is known
      blocks: false,
      evidence: response ? (response.evidence || "") : "",
      notes:    response ? (response.notes    || "") : "",
      priorityRank: response && typeof response.priorityRank === "number" ? response.priorityRank : null,
      priorityBand: response ? (response.priorityBand || "") : "",
      owner:        response ? (response.owner  || "") : "",
      action:       response ? (response.action || "") : "",
      impact:       response ? (response.impact || "") : ""
    };
  }

  // ---- per foundational requirement -------------------------------------
  //
  // SL-A is the highest n where every counted item applying at levels 1..n is
  // satisfied. `strict` recomputes it treating a compensating measure as not
  // satisfied, which gives the second vector.
  //
  // The ceiling is SL 4, not the target: a system can be better than it needs
  // to be, and 62443-3-3 has no rule that SL-A cannot exceed SL-T. It rises
  // above the target only when the items the higher level asks for have
  // actually been assessed and met - an unassessed item blocks the claim just
  // as it does below the target - so over-achievement is always evidenced,
  // never assumed from silence.
  var MAX_SL = 4;
  // The levels at which a requirement selects something new, lowest first. Most
  // requirements do not use all four: offering a level that changes nothing is
  // a button that cannot be seen to work.
  function definedLevels(items) {
    var seen = {};
    (items || []).forEach(function (i) { seen[i.firstSL] = true; });
    return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
  }
  // The Security Level the consultant picked, if the items still say what that
  // level would set. Several levels can write identical items - a requirement
  // selecting nothing above SL 1 is met the same way at SL 2, SL 3 and SL 4 -
  // so which was chosen cannot be read back off the items and is stored on the
  // response. It stops being true the moment an item is edited by hand, which
  // is when the card falls back to the computed level and says "Set per item".
  function validChoice(response, items, targetSL, countedCount) {
    var c = response && response.slChoice;
    if (typeof c !== "number" || targetSL <= 0 || countedCount === 0) return null;
    var matches = items.every(function (i) {
      // Nothing written above the chosen level: the write ceiling stops there.
      if (!i.state) return i.firstSL > c;
      // An item excluded with a justification is an outlier the consultant
      // recorded deliberately - "this SR is SL 2 here, except that one item,
      // which does not apply". The level they picked is still the answer.
      if (i.disposition === "excluded") return true;
      return i.state === (i.firstSL <= c ? "met" : "not-met");
    });
    return matches ? c : null;
  }

  function highestSatisfiedLevel(items, targetSL, strict) {
    if (!(targetSL > 0)) return null;
    var level = 0;
    for (var n = 1; n <= MAX_SL; n++) {
      var atOrBelow = items.filter(function (i) {
        return i.firstSL <= n && i.disposition !== "excluded";
      });
      var allOk = atOrBelow.every(function (i) {
        if (i.disposition !== "satisfied") return false;
        return strict ? !i.compensating : true;
      });
      if (!allOk) break;
      level = n;
    }
    return level;
  }

  function rollUpFR(frId, perReq, frTargetSL, profile) {
    // Two lists, deliberately. `required` is what the target asks for and
    // drives every count the report presents as work: coverage, blocking
    // items, closeness. `all` additionally carries what was recorded above the
    // target, and is used only to work out the level actually achieved - which
    // may be higher than the target, and should say so.
    var required = [], all = [];
    perReq.forEach(function (r) {
      (r.items || []).forEach(function (i) {
        if (i.inScope) { required.push(i); all.push(i); }
        else if (i.aboveTarget) all.push(i);
      });
    });
    var items = required;
    var counted = items.filter(function (i) { return i.disposition !== "excluded"; });

    var inScope = frTargetSL > 0;
    var achieved = inScope ? highestSatisfiedLevel(all, frTargetSL, false) : null;
    var achievedStrict = inScope ? highestSatisfiedLevel(all, frTargetSL, true) : null;

    // The items holding SL-A below SL-T: everything at or below the first
    // failing level that is not satisfied. This is the remediation list.
    var blocking = [];
    if (inScope && achieved !== null && achieved < frTargetSL) {
      var failLevel = achieved + 1;
      blocking = counted.filter(function (i) {
        return i.firstSL <= failLevel && i.disposition !== "satisfied";
      });
    }

    var w = partialWeightOf(profile);
    var satisfied = counted.filter(function (i) { return i.disposition === "satisfied"; }).length;
    var partials  = counted.filter(function (i) { return i.disposition === "partial"; }).length;
    var unassessed = counted.filter(function (i) { return i.disposition === "unassessed"; }).length;
    // Context only. Never lifts a level and never substitutes for SL-A.
    var closeness = counted.length ? (satisfied + partials * w) / counted.length : null;

    // Whether the FR meets its target, as a status rather than a yes/no. Only
    // an ANSWERED in-scope item that falls short makes the FR short. Answers
    // all satisfied with blanks still to fill is "incomplete": not met yet,
    // and not a finding either. SL-A is untouched by this - a blank still
    // blocks the level - so the vector never over-claims.
    //   out-of-scope  SL-T 0
    //   unassessed    nothing answered
    //   short         an answered in-scope item not met or partial
    //   incomplete    nothing short, some in-scope item still blank
    //   met           every counted in-scope item satisfied (or judged N/A)
    var frShortItems = counted.filter(function (i) {
      return i.disposition === "not-met" || i.disposition === "partial";
    }).length;
    var frStatus;
    if (!inScope) frStatus = "out-of-scope";
    else if (counted.length > 0 && unassessed === counted.length) frStatus = "unassessed";
    else if (frShortItems > 0) frStatus = "short";
    else if (unassessed > 0) frStatus = "incomplete";
    else frStatus = "met";

    // Band each requirement now that SL-A is known, for the capture colours.
    perReq.forEach(function (r) {
      var scoped = (r.items || []).filter(function (i) { return i.inScope && i.disposition !== "excluded"; });
      if (!inScope || scoped.length === 0) { r.band = "na"; return; }
      if (scoped.every(function (i) { return i.disposition === "satisfied"; })) r.band = "met";
      else if (scoped.some(function (i) { return i.disposition === "not-met" || i.disposition === "unassessed"; })) r.band = "gap";
      else r.band = "near";
      r.blocks = scoped.some(function (i) {
        return i.disposition !== "satisfied" && i.firstSL <= ((achieved || 0) + 1);
      });
    });

    return {
      frId: frId,
      targetSL: frTargetSL,
      inScope: inScope,
      conformantAchievedSL: achieved,
      achievedSLStrict: achievedStrict,
      // True when a compensating measure is the only thing holding the level.
      propUpByCompensating: inScope && achieved !== null && achievedStrict !== null && achievedStrict < achieved,
      closeness: closeness,
      closenessBand: closeness === null ? "na" : classifyCloseness(closeness, profile),
      frTargetStatus: frStatus,
      frTargetMet: frStatus === "met",
      // Requirements answered in part with nothing short: still to assess.
      reqToAssessCount: perReq.filter(function (r) { return r.status === "to-assess"; }).length,
      reqShortCount: perReq.filter(function (r) { return r.status === "short"; }).length,
      // Better than it needs to be. Only ever true where the higher level's
      // items were actually assessed and met.
      exceedsTarget: inScope && achieved !== null && achieved > frTargetSL,
      aboveTargetCount: perReq.reduce(function (a, r) { return a + (r.aboveTargetCount || 0); }, 0),
      itemCount: items.length,
      countedCount: counted.length,
      satisfiedCount: satisfied,
      partialCount: partials,
      notMetCount: counted.filter(function (i) { return i.disposition === "not-met"; }).length,
      unassessedCount: unassessed,
      excludedCount: items.length - counted.length,
      compensatingCount: counted.filter(function (i) { return i.compensating; }).length,
      blockingItems: blocking,
      // Names the reports and exports already read. NOTE: these are ITEM
      // counts - the item is the unit of assessment. Anything that writes
      // "requirement(s)" in prose must use the req* counts below instead, or
      // it will quote an item total against the word "requirement".
      applicableCount: counted.length,
      answeredCount: counted.length - unassessed,
      // Requirement-level counts, for prose and for the N/A clause.
      reqTotalCount: perReq.length,
      reqApplicableCount: perReq.filter(function (r) { return r.scopedCount > 0 && r.countedCount > 0; }).length,
      reqNACount: perReq.filter(function (r) { return r.exclusionReason === "judged-na"; }).length,
      reqOutOfTargetCount: perReq.filter(function (r) { return r.exclusionReason === "out-of-target" || r.exclusionReason === "never-selected"; }).length,
      unansweredCount: unassessed,
      // Counts floor-flagged REQUIREMENTS, which is what the report prose and
      // the methodology appendix both describe ("N requirement(s) are
      // floor-flagged"). An FR whose own SL-A is 0 always contains at least one.
      floorFlagCount: perReq.filter(function (r) { return r.floor; }).length,
      metCount: perReq.filter(function (r) { return r.band === "met"; }).length,
      gapCount: perReq.filter(function (r) { return r.band === "gap"; }).length,
      reqs: perReq
    };
  }


  // ---- whole site -------------------------------------------------------

  function scoreSite(instrument, taxonomy, profile, targetProfile, responses, targetId, sharedResponses) {
    var resolved = (sharedResponses && sharedResponses.length)
      ? resolveResponses(responses, sharedResponses, targetId)
      : resolveResponses(responses, null, targetId);
    var byReq = {};
    resolved.forEach(function (r) { byReq[r.requirementId] = r; });

    var perReqByFR = {};
    taxonomy.frs.forEach(function (fr) { perReqByFR[fr.id] = []; });

    var allReqResults = [];
    instrument.requirements.forEach(function (req) {
      var t = effectiveTargetSL(targetProfile, req.frId, targetId);
      var res = scoreRequirement(req, byReq[req.id], t, profile);
      perReqByFR[req.frId].push(res);
      allReqResults.push(res);
    });

    var perFR = taxonomy.frs.map(function (fr) {
      var t = effectiveTargetSL(targetProfile, fr.id, targetId);
      return rollUpFR(fr.id, perReqByFR[fr.id] || [], t, profile);
    });

    var allMet = true;
    var totalFloor = 0;
    // An FR with SL-T 0 is out of scope, not "unassessed", and must not drag
    // the headline. Neither must an FR nobody has answered yet: its SL-A is
    // correctly 0 (an unassessed item blocks a claim), but calling an untouched
    // FR the site's "weakest area" buries the findings that were actually made.
    // Those FRs are reported in their own right through notAssessedFRs.
    var measurableFR = perFR.filter(function (f) {
      return f.inScope && f.countedCount > 0 && f.answeredCount > 0;
    });
    // Only an FR with an answered shortfall is short. An FR met so far with
    // blanks left is "incomplete" and holds the zone open, not short.
    measurableFR.forEach(function (f) {
      if (f.frTargetStatus === "short") allMet = false;
      totalFloor += f.floorFlagCount;
    });

    // weakestFRs: every assessed FR tied at the lowest conformant achieved SL.
    // Not-assessed FRs are excluded (already reported separately as
    // "not assessed"). So are FRs only partly answered with nothing short:
    // their SL-A is held down by blanks, not by a finding, and naming one the
    // weakest area would turn work still to do into a weakness. They count
    // only when no FR is settled either way. weakestFR (singular) is kept as
    // the first tied one for back-compat with callers that only need a name.
    var weakestFRs = [];
    var weakestFR = null;
    var settledFR = measurableFR.filter(function (f) {
      return f.frTargetStatus === "short" || f.frTargetStatus === "met";
    });
    var weakPool = settledFR.length ? settledFR : measurableFR;
    if (weakPool.length > 0) {
      var minSL = Infinity;
      weakPool.forEach(function (f) {
        if (f.conformantAchievedSL < minSL) minSL = f.conformantAchievedSL;
      });
      weakestFRs = weakPool.filter(function (f) {
        return f.conformantAchievedSL === minSL;
      });
      // Order ties by FR id for deterministic display.
      weakestFRs.sort(function (a, b) { return a.frId.localeCompare(b.frId); });
      weakestFR = weakestFRs[0];
    }

    // Priority list of FRs that did NOT meet target, ordered:
    //   1. floor-flagged FRs first (any SR at SL0 with target>0, or any
    //      requirement two or more SLs below target)
    //   2. then by gap size (targetSL - conformantAchievedSL) descending
    //   3. tie-break by FR id ascending for determinism
    // This is the "where to look first" view; it changes presentation only -
    // the target-met rule and the floor rules themselves are untouched.
    // Only FRs with an answered shortfall: an FR met so far with blanks left
    // has nothing to fix yet, only more to assess.
    var priorityFRs = measurableFR
      .filter(function (f) { return f.frTargetStatus === "short"; })
      .slice()
      .sort(function (a, b) {
        var aFloor = a.floorFlagCount > 0 ? 1 : 0;
        var bFloor = b.floorFlagCount > 0 ? 1 : 0;
        if (aFloor !== bFloor) return bFloor - aFloor;
        var aGap = a.targetSL - a.conformantAchievedSL;
        var bGap = b.targetSL - b.conformantAchievedSL;
        if (aGap !== bGap) return bGap - aGap;
        return a.frId.localeCompare(b.frId);
      });

    // Convenience: the FRs that were NOT assessed at all (no responses for any
    // applicable requirement). Surfaced separately on the report. An FR taken
    // out of scope by SL-T 0 is listed separately again - it is a deliberate
    // scoping decision, not an omission.
    var notAssessedFRs = perFR.filter(function (f) {
      return f.inScope && f.countedCount > 0 && f.answeredCount === 0;
    });
    var outOfScopeFRs = perFR.filter(function (f) { return !f.inScope; });
    // Answered in part, nothing short, blanks left. Counted as assessed (they
    // are not untouched) but not as FULLY assessed.
    var partlyAssessedFRs = perFR.filter(function (f) { return f.frTargetStatus === "incomplete"; });

    // "Target met" is a claim about every in-scope FR, so it waits until each
    // has been looked at. Judged on the measurable FRs alone, one FR answered
    // and met with six untouched read "overall target met: yes". The
    // measurable FRs still decide whether anything is SHORT - a shortfall
    // found is a finding whatever is left to assess - but met-so-far with FRs
    // outstanding is its own state, so the reports can say "not yet" rather
    // than a bare yes or no. An FR taken out of scope (SL-T 0) is a scoping
    // decision, not an omission, and does not hold the result open.
    //   met         every in-scope FR fully assessed and at target
    //   short       at least one FR with an answered shortfall
    //   incomplete  nothing short, some in-scope FR partly or not assessed
    //   unassessed  nothing measurable yet
    var overallTargetStatus;
    if (measurableFR.length === 0) overallTargetStatus = "unassessed";
    else if (!allMet) overallTargetStatus = "short";
    else if (notAssessedFRs.length > 0 || partlyAssessedFRs.length > 0) overallTargetStatus = "incomplete";
    else overallTargetStatus = "met";
    // An FR whose every in-scope item was judged N/A HAS been assessed: it is
    // in scope, so it counts towards "N of M assessed", and it has no gap.
    var inScopeFRCount = perFR.filter(function (f) { return f.inScope; }).length;

    var overallCloseness = null;
    if (measurableFR.length > 0) {
      overallCloseness = measurableFR.reduce(function (acc, f) {
        return acc + f.closeness;
      }, 0) / measurableFR.length;
    }

    // The blocking-item list, flattened across FRs: the specific items that
    // hold SL-A below SL-T. This IS the remediation plan, and it comes from the
    // same structure that produced the vector.
    var blockingItems = [];
    perFR.forEach(function (f) {
      (f.blockingItems || []).forEach(function (i) {
        blockingItems.push({ frId: f.frId, targetSL: f.targetSL, achievedSL: f.conformantAchievedSL, item: i });
      });
    });

    // Per-requirement roadmap: every in-scope requirement that was looked at
    // and is not yet met. A requirement nobody has answered yet is a coverage
    // gap, not a finding, and putting it here would bury the real ones.
    // A requirement answered in part with nothing short stays on (toAssess),
    // so the work list is complete, but it is not a finding.
    // Honours the consultant's manual priority order (drag), else findings
    // before work still to assess, then requirements that BLOCK a level, then
    // by how low the item sits, then by code.
    var roadmap = allReqResults.filter(function (r) {
      return r.scopedCount > 0 && r.countedCount > 0 && r.touched && !r.met;
    });
    roadmap.sort(function (a, b) {
      var ap = typeof a.priorityRank === "number", bp = typeof b.priorityRank === "number";
      if (ap && bp) return a.priorityRank - b.priorityRank;
      if (ap) return -1;
      if (bp) return 1;
      var at = a.toAssess ? 1 : 0, bt = b.toAssess ? 1 : 0;
      if (at !== bt) return at - bt;
      // Floor findings first - the report says so in as many words, and the
      // ordering is the only thing that makes that claim true.
      var af = a.floor ? 1 : 0, bf = b.floor ? 1 : 0;
      if (af !== bf) return bf - af;
      var ab = a.blocks ? 1 : 0, bb = b.blocks ? 1 : 0;
      if (ab !== bb) return bb - ab;
      var alo = Math.min.apply(null, a.items.filter(function (i) { return i.inScope && i.disposition !== "satisfied" && i.disposition !== "excluded"; }).map(function (i) { return i.firstSL; }).concat([9]));
      var blo = Math.min.apply(null, b.items.filter(function (i) { return i.inScope && i.disposition !== "satisfied" && i.disposition !== "excluded"; }).map(function (i) { return i.firstSL; }).concat([9]));
      if (alo !== blo) return alo - blo;
      return String(a.code).localeCompare(String(b.code));
    });

    return {
      instrumentId: instrument.id,
      instrumentTitle: instrument.title,
      perFR: perFR,
      perRequirement: allReqResults,
      roadmap: roadmap,
      overallTargetMet: overallTargetStatus === "met",
      overallTargetStatus: overallTargetStatus,
      inScopeFRCount: inScopeFRCount,
      assessedFRCount: inScopeFRCount - notAssessedFRs.length,
      fullyAssessedFRCount: inScopeFRCount - notAssessedFRs.length - partlyAssessedFRs.length,
      partlyAssessedFRs: partlyAssessedFRs,
      // Roadmap entries answered in part with nothing short. Not findings.
      toAssessCount: roadmap.filter(function (r) { return r.toAssess; }).length,
      overallCloseness: overallCloseness,
      overallClosenessBand: overallCloseness === null ? "na" : classifyCloseness(overallCloseness, profile),
      weakestFR: weakestFR,
      weakestFRs: weakestFRs,
      priorityFRs: priorityFRs,
      notAssessedFRs: notAssessedFRs,
      outOfScopeFRs: outOfScopeFRs,
      blockingItems: blockingItems,
      floorFlagCount: totalFloor,
      totalRequirements: instrument.requirements.length,
      // Counts are now in ITEMS, since that is the unit being assessed.
      totalItems: allReqResults.reduce(function (a, r) { return a + r.items.length; }, 0),
      totalInScopeItems: allReqResults.reduce(function (a, r) { return a + r.scopedCount; }, 0),
      totalCountedItems: allReqResults.reduce(function (a, r) { return a + r.countedCount; }, 0),
      totalSatisfiedItems: allReqResults.reduce(function (a, r) { return a + r.satisfiedCount; }, 0),
      totalCompensatingItems: allReqResults.reduce(function (a, r) { return a + r.compensatingCount; }, 0),
      totalExcludedItems: allReqResults.reduce(function (a, r) { return a + r.excludedCount; }, 0),
      // Requirement-level names the reports and exports already read.
      totalApplicable: allReqResults.filter(function (r) { return r.scopedCount > 0 && r.countedCount > 0; }).length,
      // Any in-scope item answered anywhere. totalAnswered counts requirements
      // answered IN FULL, so a zone answered only in part reads 0 there; use
      // this to tell "not assessed" from "partly assessed".
      anyAnswered: measurableFR.length > 0,
      totalAnswered:   allReqResults.filter(function (r) { return r.scopedCount > 0 && r.countedCount > 0 && r.answered; }).length,
      totalNotApplicable: allReqResults.filter(function (r) { return r.scopedCount === 0 || r.countedCount === 0; }).length,
      profile: profile
    };
  }

  // ---- multi-target -----------------------------------------------------

  function scoreEngagement(engagement, instrument, taxonomy, profile) {
    var targetProfile = engagement.targetProfile || { defaultTargetSL: 2 };
    var responsesByTarget = {};
    (engagement.responses || []).forEach(function (r) {
      var tid = r.targetId || (engagement.targets[0] && engagement.targets[0].id);
      if (!tid) return;
      (responsesByTarget[tid] = responsesByTarget[tid] || []).push(r);
    });
    var shared = responsesByTarget[SHARED_TARGET_ID] || [];
    var targets = engagement.targets || [];
    var perTarget = targets.map(function (t) {
      return {
        target: t,
        result: scoreSite(instrument, taxonomy, profile, targetProfile, responsesByTarget[t.id] || [], t.id, shared)
      };
    });
    return {
      perTarget: perTarget,
      sharedRoadmap: sharedRoadmap(perTarget),
      systemRollup: systemRollup(perTarget, taxonomy),
      hasSharedLayer: shared.length > 0,
      taxonomy: taxonomy,
      instrument: instrument,
      profile: profile,
      targetProfile: targetProfile
    };
  }

  // ---- the system as a whole --------------------------------------------
  //
  // A reader handed three zone reports still has to work out what the SYSTEM
  // looks like. This answers that without inventing a figure the standard does
  // not define: 62443-3-3 assigns SL-A per zone, so there is no such thing as
  // an SL-A for the system, and nothing here averages or combines zones.
  //
  // What can honestly be said is stated instead:
  //   - how many zones met their target, how many fell short, and how many
  //     are met so far but have FRs still to assess;
  //   - for each FR, in how many zones it is met, short, or not assessed -
  //     which is what separates "this is a system-wide weakness" from "this is
  //     one zone's problem";
  //   - the lowest achieved level per FR across the zones, labelled as a floor
  //     across zones rather than as a level the system holds.
  function systemRollup(perTarget, taxonomy) {
    var zones = (perTarget || []).filter(function (t) { return t.result; });
    var frs = ((taxonomy && taxonomy.frs) || []).map(function (fr) {
      var met = [], short_ = [], incomplete = [], notAssessed = [], outOfScope = [];
      var lowest = null, highestTarget = null;
      zones.forEach(function (t) {
        var f = (t.result.perFR || []).filter(function (x) { return x.frId === fr.id; })[0];
        if (!f) return;
        if (!f.inScope) { outOfScope.push(t.target.name); return; }
        if (f.answeredCount === 0) { notAssessed.push(t.target.name); return; }
        if (highestTarget === null || f.targetSL > highestTarget) highestTarget = f.targetSL;
        if (lowest === null || f.conformantAchievedSL < lowest) lowest = f.conformantAchievedSL;
        var st = f.frTargetStatus || (f.frTargetMet ? "met" : "short");
        (st === "met" ? met : st === "incomplete" ? incomplete : short_).push(t.target.name);
      });
      var assessed = met.length + short_.length + incomplete.length;
      // An FR met in one zone and only partly answered in another is not met
      // everywhere: "met-so-far" says nothing is short where it was answered,
      // and that some zone still has items to assess.
      var verdict = "unassessed";
      if (assessed > 0) {
        if (short_.length === 0) verdict = incomplete.length ? "met-so-far" : "met-everywhere";
        else if (met.length === 0 && incomplete.length === 0) verdict = "short-everywhere";
        else verdict = "mixed";
      }
      return {
        frId: fr.id, abbr: fr.abbr || fr.id, name: fr.name || "",
        met: met, short: short_, incomplete: incomplete, notAssessed: notAssessed, outOfScope: outOfScope,
        assessedZones: assessed, lowestAchieved: lowest, highestTarget: highestTarget,
        verdict: verdict
      };
    });

    // A zone is assessed once any in-scope item is answered, not only once a
    // whole requirement is: a zone answered in part is "not fully assessed",
    // never "not assessed".
    function zoneAnswered(t) {
      return typeof t.result.anyAnswered === "boolean" ? t.result.anyAnswered : t.result.totalAnswered > 0;
    }
    var measurable = zones.filter(zoneAnswered);

    // Distinct requirements sitting at floor anywhere, and which of those are
    // one shared piece of work rather than one job per zone.
    var floorSeen = {}, floorAllShared = {}, floorReqs = [];
    measurable.forEach(function (t) {
      (t.result.perRequirement || []).forEach(function (r) {
        if (!r.floor) return;
        if (!floorSeen[r.requirementId]) { floorSeen[r.requirementId] = true; floorReqs.push(r.requirementId); floorAllShared[r.requirementId] = true; }
        if (!r.gapIsShared) floorAllShared[r.requirementId] = false;
      });
    });

    // Three states for an assessed zone, not two. A zone met so far with FRs
    // still to assess is neither meeting its target (that waits for every
    // in-scope FR) nor short of it (nothing assessed has fallen short), and
    // filing it under either would put a false sentence in the summary.
    function zoneStatus(t) {
      return t.result.overallTargetStatus || (t.result.overallTargetMet ? "met" : "short");
    }
    return {
      zoneCount: zones.length,
      zonesMeetingTarget: measurable.filter(function (t) { return zoneStatus(t) === "met"; })
                                    .map(function (t) { return t.target.name; }),
      zonesShort: measurable.filter(function (t) { var s = zoneStatus(t); return s !== "met" && s !== "incomplete"; })
                            .map(function (t) { return t.target.name; }),
      zonesIncomplete: measurable.filter(function (t) { return zoneStatus(t) === "incomplete"; })
                                 .map(function (t) { return t.target.name; }),
      zonesNotAssessed: zones.filter(function (t) { return !zoneAnswered(t); })
                             .map(function (t) { return t.target.name; }),
      zonesWithFloor: measurable.filter(function (t) { return t.result.floorFlagCount > 0; })
                                .map(function (t) { return t.target.name; }),
      // OCCURRENCES, not findings. Kept under its old name because the tables
      // and the per-zone columns legitimately count this way, but it is NOT the
      // number to put in front of a client: a gap answered on the shared layer
      // is inherited by every zone that depends on it, so one piece of work can
      // count three or four times. The demo announced 32 where 14 requirements
      // were at floor and 13 of those were a single shared job.
      totalFloorFindings: measurable.reduce(function (a, t) { return a + t.result.floorFlagCount; }, 0),
      floorOccurrences: measurable.reduce(function (a, t) { return a + t.result.floorFlagCount; }, 0),
      floorRequirements: floorReqs,
      floorRequirementCount: floorReqs.length,
      // Distinct requirements whose floor gap is inherited everywhere it shows
      // up - one piece of work, however many zones carry it.
      floorSharedCount: floorReqs.filter(function (id) { return floorAllShared[id]; }).length,
      frs: frs,
      metEverywhere:   frs.filter(function (f) { return f.verdict === "met-everywhere"; }),
      shortEverywhere: frs.filter(function (f) { return f.verdict === "short-everywhere"; }),
      mixed:           frs.filter(function (f) { return f.verdict === "mixed"; }),
      metSoFar:        frs.filter(function (f) { return f.verdict === "met-so-far"; })
    };
  }

  // Actions that span zones: one entry per requirement whose gap is inherited
  // from the shared layer, naming every zone it resolves and that zone's
  // own SL-T. The consultant writes the plan once at system level; this is what
  // lets the report print it once without losing which zones it fixes.
  function sharedRoadmap(perTarget) {
    var byReq = {};
    (perTarget || []).forEach(function (t) {
      ((t.result && t.result.roadmap) || []).forEach(function (r) {
        // A zone belongs here only while the items holding it short are the
        // inherited ones. Answer them in the zone and it becomes that zone's
        // own finding, with its own action.
        if (!r.gapIsShared) return;
        var e = byReq[r.requirementId];
        if (!e) {
          e = byReq[r.requirementId] = {
            requirementId: r.requirementId,
            itemId: r.requirementId,
            code: r.code,
            title: r.title,
            frId: r.frId,
            priorityRank: r.priorityRank,
            priorityBand: r.priorityBand,
            owner: r.owner,
            action: r.action,
            impact: r.impact,
            evidence: r.evidence,
            planSource: r.planSource,
            blocks: false,
            affected: []
          };
        }
        e.blocks = e.blocks || r.blocks;
        e.affected.push({
          targetId: t.target.id,
          name: t.target.name,
          targetSL: r.targetSL,
          // The capped figure, since this is read back to a client as "currently
          // SL n" against the target.
          itemsAchieved: r.achievedShown
        });
      });
    });
    var out = Object.keys(byReq).map(function (k) { return byReq[k]; });
    out.sort(function (a, b) {
      var ap = typeof a.priorityRank === "number", bp = typeof b.priorityRank === "number";
      if (ap && bp) return a.priorityRank - b.priorityRank;
      if (ap) return -1;
      if (bp) return 1;
      if (a.blocks !== b.blocks) return a.blocks ? -1 : 1;
      return String(a.code).localeCompare(String(b.code));
    });
    return out;
  }

  // ---- formatting helpers -----------------------------------------------

  function formatSL(v) {
    if (v === null || v === undefined) return "-";
    return "SL " + v;
  }
  function formatPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "-";
    return Math.round(v * 100) + "%";
  }

  return {
    effectiveTargetSL: effectiveTargetSL,
    normaliseZoneTarget: normaliseZoneTarget,
    // Item model (base + requirement enhancements, derived from slGuidance).
    ITEM_STATES: ITEM_STATES,
    requirementItems: requirementItems,
    inScopeItems: inScopeItems,
    itemDisposition: itemDisposition,
    highestSatisfiedLevel: highestSatisfiedLevel,
    definedLevels: definedLevels,
    isSatisfied: isSatisfied,
    scoreRequirement: scoreRequirement,
    rollUpFR: rollUpFR,
    scoreSite: scoreSite,
    scoreEngagement: scoreEngagement,
    // shared layer (common countermeasures inherited by every zone).
    SHARED_TARGET_ID: SHARED_TARGET_ID,
    resolveResponse: resolveResponse,
    resolveResponses: resolveResponses,
    coversTarget: coversTarget,
    sharedTargetProfile: sharedTargetProfile,
    sharedRoadmap: sharedRoadmap,
    systemRollup: systemRollup,
    classifyCloseness: classifyCloseness,
    formatSL: formatSL,
    formatPct: formatPct
  };
})();
