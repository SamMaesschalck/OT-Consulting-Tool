/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* engine.js — the risk maths, read from the rules file (no thresholds here).
 *
 * The house matrix, tolerable risk, a threat's three ratings (unmitigated,
 * current, planned), the one coverage rule (the countermeasures linked to the
 * threat; the requirement match is only a suggestion), the treatment
 * state of a threat, the per-requirement SL-T suggestion with its trace, the
 * completeness list and the risk-context file. Every function that needs the
 * project takes it as an argument: nothing here reads page state, so the
 * same project in gives the same answer out, whichever page or export asks.
 * window.RiskTool (js/app.js) keeps the old calls that left the project out.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Engine = (function () {
  "use strict";

  var M = window.RiskApp.Model;
  var RULES = M.RULES, FR_IDS = M.FR_IDS, SEV = M.SEV, LIK = M.LIK, MODS = M.MODS;
  var SIS_RULE = M.SIS_RULE, MISMATCH_RULE = M.MISMATCH_RULE;
  var BAND_RANK = M.BAND_RANK, BAND_NAME = M.BAND_NAME, TREATMENT_DECISIONS = M.TREATMENT_DECISIONS;

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  // The date "today" means for every output. A test pins it (setToday) so
  // what it builds from the demo reads the same whatever the real date is;
  // unpinned, it is the clock.
  var pinnedToday = null;
  function todayISO() {
    if (pinnedToday) return pinnedToday;
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function setToday(iso) { pinnedToday = typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null; }
  function todayPinned() { return pinnedToday; }

  // The project's tolerable risk, or the house default when none is set.
  function tolerableOf(project) { return project.srs.tolerableRisk || RULES.tolerableRisk.default; }

  function findZone(project, id) { for (var i = 0; i < project.zones.length; i++) if (project.zones[i].id === id) return project.zones[i]; return null; }

  // The band of an impact and a likelihood on the project's risk criteria
  // (js/model.js criteriaOf; a project without its own reads the house
  // matrix). A level the criteria do not have gives no band. Called often,
  // so it reads the stored shape directly rather than the normalised one.
  function hasLevel(list, id) { for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return true; return false; }
  function riskFor(impact, likelihood, project) {
    if (!impact || !likelihood) return null;
    var c = project && project.criteria;
    if (c && M.criteriaUsable(c)) {
      if (!hasLevel(c.impact, impact) || !hasLevel(c.likelihood, likelihood)) return null;
      var r = c.matrix[impact], b = r && r[likelihood];
      return BAND_RANK[b] != null ? b : null;
    }
    var row = RULES.riskMatrix[impact];
    var hb = (row && typeof row === "object" && row[likelihood]) || null;
    return BAND_RANK[hb] != null ? hb : null;
  }
  function threatRisk(t, project) { return riskFor(t.impact, t.likelihood, project); }
  function exceedsTolerable(band, tolerable) { return band ? (BAND_RANK[band] > BAND_RANK[tolerable]) : false; }

  // ---------- Impact per consequence category (phase 5) ----------
  // A threat may give its impact per consequence category of the criteria
  // (impactByCategory), and a ranked system its consequence
  // (consequenceByCategory). The single impact is then the worst of them, kept
  // as a mirror on the threat or system so every reader of the single value
  // (and an older build) works as before. Only categories the criteria have,
  // rated on a level they have, count.
  function categoryRatings(map, project) {
    if (!map || typeof map !== "object") return [];
    var c = M.criteriaOf(project), out = [];
    c.categories.forEach(function (cat) {
      var lv = map[cat.id];
      var level = lv ? c.impact.filter(function (x) { return x.id === lv; })[0] : null;
      if (level) out.push({ id: cat.id, name: cat.name, level: level.id, levelName: level.name, rank: level.rank, tolerable: cat.tolerable });
    });
    return out;
  }
  // The worst level of a category map, or "" when none counts.
  function worstCategoryLevel(map, project) {
    var best = null;
    categoryRatings(map, project).forEach(function (r) { if (!best || r.rank > best.rank) best = r; });
    return best ? best.level : "";
  }
  // Every entry of a category map is on a category and a level the criteria
  // have. Only then is the single impact worked out from it: with one entry
  // that no longer fits, the worst of the others could understate it, so the
  // single impact is left as it was (and the completeness list says so).
  function categoryMapFits(map, project) {
    if (!map || typeof map !== "object") return true;
    var keys = Object.keys(map).filter(function (k) { return map[k]; });
    return categoryRatings(map, project).length === keys.length;
  }
  // Sets (or with no level, clears) one category's impact and keeps the
  // single impact the worst of them. With none left the map goes and the
  // single impact stays as it was, to be set by hand.
  function setCategoryRating(item, impactKey, mapKey, catId, level, project) {
    var map = item[mapKey] && typeof item[mapKey] === "object" && !Array.isArray(item[mapKey]) ? item[mapKey] : {};
    if (level) map[catId] = level; else delete map[catId];
    if (Object.keys(map).length) {
      item[mapKey] = map;
      var w = categoryMapFits(map, project) ? worstCategoryLevel(map, project) : "";
      if (w) item[impactKey] = w;
    }
    else delete item[mapKey];
  }
  function impactRank(id, project) {
    var l = M.criteriaOf(project).impact.filter(function (x) { return x.id === id; })[0];
    return l ? l.rank : -1;
  }
  // Whether a rating is above tolerable risk. Where tolerable risk is set
  // per consequence category and the item is rated per category, each
  // category's risk (its impact, capped at the rating's own impact when the
  // state gives one) is compared with that category's tolerable risk, or the
  // general one; otherwise the band is compared with the general tolerable
  // risk, as it always was. cats: categoryRatings of the item.
  function aboveTolerable(project, band, likelihood, cats, capImpact) {
    if (!band) return false;
    var tol = tolerableOf(project);
    var crit = cats && cats.length ? M.criteriaOf(project) : null;
    if (!crit || !crit.hasCategoryTolerable) return exceedsTolerable(band, tol);
    var capR = capImpact ? impactRank(capImpact, project) : -1;
    var worst = cats.reduce(function (m, r) { return Math.max(m, r.rank); }, -1);
    if (capR > worst) return exceedsTolerable(band, tol);
    return cats.some(function (r) {
      var I = capR >= 0 && capR < r.rank ? capImpact : r.level;
      return exceedsTolerable(riskFor(I, likelihood, project), crit.tolerableByCategory[r.id] || tol);
    });
  }
  // A ranked system's rating against tolerable risk (per category where set).
  // Its own consequence is the cap: one above its categories (they were
  // changed after it was set) is compared as the band, never below it.
  function hlaExceeds(a, project) {
    if (!a) return false;
    return aboveTolerable(project, hlaRisk(a, project), a.likelihood, categoryRatings(a.consequenceByCategory, project), a.consequence || null);
  }

  // A threat's three ratings (schema 0.3):
  //   unmitigated  likelihood x impact, before any cyber security countermeasure, existing
  //                ones included, is counted (threatRisk)
  //   current      with the linked existing countermeasures (currentRisk)
  //   planned      after the planned measures as well (residualRisk; the
  //                residual pair, which meant "with countermeasures" before 0.3)
  // Current and planned are optional and exist only once one of their pair is
  // entered; the other falls back to the rating before it.
  function currentRisk(t, project) {
    if (!t.currentLikelihood && !t.currentImpact) return null;
    return riskFor(t.currentImpact || t.impact, t.currentLikelihood || t.likelihood, project);
  }
  function residualRisk(t, project) {
    if (!t.residualLikelihood && !t.residualImpact) return null;
    return riskFor(t.residualImpact || t.currentImpact || t.impact, t.residualLikelihood || t.currentLikelihood || t.likelihood, project);
  }
  // The rating that stands once everything recorded is done: planned where
  // rated, else current, else unmitigated. The rating that stands today
  // depends on the links too, so it is threatTreatment's (today).
  function operativeRisk(t, project) { return residualRisk(t, project) || currentRisk(t, project) || threatRisk(t, project); }
  // Worst operative risk across a set of threats. Used to keep the report
  // from reading as alarmist when countermeasures are already in place.
  function worstResidualOf(items, project) {
    var worst = null;
    items.forEach(function (t) { var r = operativeRisk(t, project); if (r && (worst == null || BAND_RANK[r] > BAND_RANK[worst])) worst = r; });
    return worst;
  }
  function worstRiskOf(items, project) {
    var worst = null;
    items.forEach(function (t) { var r = threatRisk(t, project); if (r && (worst == null || BAND_RANK[r] > BAND_RANK[worst])) worst = r; });
    return worst;
  }

  // The one coverage rule (schema 0.3): the countermeasures the consultant
  // linked to the threat, in the owner's order. A link to one with no
  // description yet covers nothing.
  function described(m) { return !!m && !!String(m.description || "").trim(); }
  function linkedCountermeasures(owner, t) {
    var ids = Array.isArray(t.countermeasureIds) ? t.countermeasureIds : [];
    return (owner.countermeasures || []).filter(function (m) { return ids.indexOf(m.id) >= 0 && described(m); });
  }
  function coveringCountermeasures(owner, t) { return linkedCountermeasures(owner, t); }
  // The requirement match: countermeasures on a requirement the threat
  // affects. Before 0.3 this was the coverage rule; now it is only ever a
  // suggestion (what the 0.2 to 0.3 step offers to link, and a hint in the
  // link picker).
  function suggestLinks(owner, t) {
    var fr = t.affectedFR || [];
    return (owner.countermeasures || []).filter(function (m) {
      return described(m) && (m.addressesFR || []).some(function (x) { return fr.indexOf(x) >= 0; });
    }).map(function (m) { return m.id; });
  }
  // The suggested links still waiting: stored by the 0.2 to 0.3 step, not yet
  // linked, and pointing at a countermeasure that is there.
  function linkSuggestions(owner, t) {
    var ids = Array.isArray(t.suggestedCountermeasureIds) ? t.suggestedCountermeasureIds : [];
    var linked = Array.isArray(t.countermeasureIds) ? t.countermeasureIds : [];
    return (owner.countermeasures || []).filter(function (m) { return ids.indexOf(m.id) >= 0 && linked.indexOf(m.id) < 0 && described(m); });
  }
  // Confirms the suggested links of a threat: each becomes a link.
  function confirmLinkSuggestions(owner, t) {
    var add = linkSuggestions(owner, t).map(function (m) { return m.id; });
    if (!Array.isArray(t.countermeasureIds)) t.countermeasureIds = [];
    add.forEach(function (id) { if (t.countermeasureIds.indexOf(id) < 0) t.countermeasureIds.push(id); });
    delete t.suggestedCountermeasureIds;
    return add.length;
  }

  // What the build before recorded decisions inferred for a threat above
  // tolerable risk. Only ever a suggestion: an untagged countermeasure or an
  // SL-T proves nothing about this threat until the consultant says so.
  function suggestTreatment(owner, t, tolerable, project) {
    if (!exceedsTolerable(threatRisk(t, project), tolerable)) return null;
    var resid = residualRisk(t, project);
    if (resid != null && !exceedsTolerable(resid, tolerable)) return "reduce";
    var loose = owner.countermeasures.some(function (m) {
      if (!(m.description || "").trim()) return false;
      if (!m.addressesFR.length || !t.affectedFR.length) return true;
      return m.addressesFR.some(function (fr) { return t.affectedFR.indexOf(fr) >= 0; });
    });
    if (loose) return "reduce";
    if ((t.acceptance || "").trim()) return "accept";
    var set = function (fr) { return owner.slTargetByFR[fr] != null; };
    if (t.affectedFR.length ? t.affectedFR.every(set) : FR_IDS.some(set)) return "slt";
    return null;
  }

  // Where "treat through the SL-T" needs a reason: the requirements a threat
  // affects with no SL-T set (unset), and those set below the suggestion
  // (below). A threat with no requirement marked needs an SL-T on any.
  function sltShortfall(owner, t, project) {
    var out = { unset: [], below: [] };
    if (!t.affectedFR.length) {
      if (!FR_IDS.some(function (fr) { return owner.slTargetByFR[fr] != null; })) out.unset = FR_IDS.slice();
      return out;
    }
    var sug = ("fromZone" in owner) ? suggestConduit(owner, project) : suggestZone(owner, project);
    t.affectedFR.forEach(function (fr) {
      var want = sug.byFR[fr] ? sug.byFR[fr].sl : null, have = owner.slTargetByFR[fr];
      if (have == null) out.unset.push(fr);
      else if (want != null && have < want) out.below.push(fr);
    });
    return out;
  }

  // The words the deliverables print for a treatment state.
  var TREATMENT_LABEL = {
    within: "Within tolerable risk",
    none: "No decision recorded",
    reduced: "Reduced to within tolerable risk",
    reduce: "Reduce with countermeasures",
    // A decision recorded without what it rests on. These print as prompts
    // left to complete and never count as a treatment.
    reduceNone: "Reduce with countermeasures (none recorded)",
    acceptNoReason: "Accept (no reason recorded)",
    acceptNoBy: "Accept (no record of who accepted it)",
    sltUnset: "Treat through the SL-T programme (no SL-T set)",
    sltNoReason: "Treat through the SL-T programme (no reason recorded)",
    transferIncomplete: "Transfer (arrangement not fully recorded)",
    accept: "Risk accepted",
    transfer: "Risk transferred",
    slt: "Treated through the SL-T programme"
  };
  // What a transfer still lacks: how, to whom, who agreed it (in words), or [].
  function transferMissing(t) {
    var out = [];
    if (!String(t.acceptance || "").trim()) out.push("how it is transferred");
    if (!String(t.transferTo || "").trim()) out.push("to whom");
    if (!String(((t.acceptanceDetail || {}).by) || "").trim()) out.push("who agreed it");
    return out;
  }
  function orList(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " or " + a[a.length - 1] : (a[0] || ""); }

  // The single source for a threat's treatment state. The screen, the
  // completeness list, Word, Excel, the review pack and the risk context all
  // read this (through js/view-model.js) and nothing else. Returns:
  //   required        the unmitigated risk is above tolerable risk
  //   state           "within" | "none" | "suggested" | "confirmed"
  //   decision        "reduce" | "accept" | "transfer" | "slt" | null (null when
  //                   not required); a transfer is stored as a marked acceptance
  //                   (js/model.js decisionOf)
  //   confirmed       the consultant has recorded the decision
  //   open            required, and no confirmed decision
  //   complete        confirmed, and nothing the decision rests on is missing
  //   reason          the reason this decision carries: the acceptance text for
  //                   "accept", how it is transferred for "transfer", the SL-T
  //                   reason for "slt", none for "reduce"
  //   transferMissing for "transfer", what the arrangement lacks (how, to
  //                   whom, who agreed it), in words
  //   reasonNeeded    this decision needs a reason; reasonMissing: it has none.
  //                   An acceptance also needs who accepted it
  //                   (acceptanceDetail.by), as a transfer needs who agreed it
  //   covering        the countermeasures linked to the threat (the one coverage rule)
  //   covered         covering is not empty
  //   existingLinked  the linked ones already in place; plannedLinked the others
  //   linkSuggested   suggested links waiting to be confirmed (from a 0.2 file)
  //   current         the rating with the existing countermeasures, or null;
  //                   currentWithin: it is tolerable
  //   residual        the planned rating (after the planned measures), or null;
  //                   residualWithin: it is tolerable. planned/plannedWithin: the same
  //   today           the rating that stands today (the one rule every output
  //                   reads): the current rating where rated; else the planned
  //                   rating when no planned countermeasure is linked (nothing
  //                   is still to come, so it is today's); else the unmitigated
  //                   rating. todayWithin: it is tolerable
  //   operative       the rating that stands once everything recorded is done:
  //                   planned, else current, else unmitigated
  //   afterPlan       the rating once the planned countermeasures are complete:
  //                   operative when a planned countermeasure is linked, else
  //                   today (nothing is planned, so nothing changes).
  //                   afterPlanWithin: it is tolerable
  //   currentExceeds, plannedExceeds, operativeExceeds  that rating is above
  //                   tolerable risk (per consequence category where the
  //                   criteria set one per category; see aboveTolerable)
  //   categories      the threat's impact per consequence category, in the
  //                   criteria's category order (categoryRatings)
  //   sltUnset        for "slt", affected requirements with no SL-T set
  //   sltBelow        for "slt", affected requirements set below the suggestion
  //   sltShortfall    the two together
  //   gap             what a confirmed decision still lacks, in plain words, or ""
  //   disposition     mitigated | countermeasure | accepted | transferred | sl-t,
  //                   or null until the decision is complete. The risk context
  //                   writes it, a transfer as accepted (contextDisposition)
  //   label           the state in plain words, as the deliverables print it
  // A decision with a gap is never stated as a treatment: its label says what
  // is missing and its disposition is null, so the report, the workbook, the
  // risk context and the review pack cannot print it as fact. "Reduced to
  // within tolerable risk" needs a linked countermeasure already in place and
  // the rating that stands today tolerable (see today above). With a planned
  // one still to come and today's rating above tolerable risk, the threat is
  // still "reduce with countermeasures".
  function threatTreatment(owner, t, project) {
    var tr = t.treatment || {};
    var unmit = threatRisk(t, project);
    // Each rating against tolerable risk: per consequence category where
    // the criteria set a tolerable risk per category and the threat is rated
    // per category, else the band against the general tolerable risk.
    var cats = categoryRatings(t.impactByCategory, project);
    // The unmitigated impact is its own cap: one above its categories reads
    // as the band, so a threat is never within tolerable risk below its band.
    var unmitAbove = aboveTolerable(project, unmit, t.likelihood, cats, t.impact || null);
    var required = unmitAbove;
    var decision = required && TREATMENT_DECISIONS.indexOf(tr.decision) >= 0 ? M.decisionOf(tr) : null;
    var confirmed = !!(decision && tr.confirmed);
    var resid = residualRisk(t, project), cur = currentRisk(t, project);
    var curAbove = aboveTolerable(project, cur, t.currentLikelihood || t.likelihood, cats, t.currentImpact || t.impact || null);
    var residAbove = aboveTolerable(project, resid, t.residualLikelihood || t.currentLikelihood || t.likelihood, cats, t.residualImpact || t.currentImpact || t.impact || null);
    var residualWithin = resid != null && !residAbove;
    var currentWithin = cur != null && !curAbove;
    var covering = coveringCountermeasures(owner, t);
    var existingLinked = covering.filter(function (m) { return !!m.existing; });
    var plannedLinked = covering.filter(function (m) { return !m.existing; });
    var linkSuggested = linkSuggestions(owner, t);
    // The one "today" rule, and what follows from it.
    var today = cur || (resid && !plannedLinked.length ? resid : null) || unmit || null;
    var todayAbove = cur ? curAbove : (resid && !plannedLinked.length ? residAbove : unmitAbove);
    var todayWithin = today != null && !todayAbove;
    var operative = resid || cur || unmit || null;
    var operativeAbove = resid ? residAbove : (cur ? curAbove : unmitAbove);
    var afterPlan = plannedLinked.length ? operative : today;
    var afterPlanWithin = afterPlan != null && !(plannedLinked.length ? operativeAbove : todayAbove);
    var inPlace = existingLinked.length > 0 && todayWithin;
    var sf = decision === "slt" ? sltShortfall(owner, t, project) : { unset: [], below: [] };
    var shortfall = sf.unset.concat(sf.below);
    var reason = String((decision === "accept" || decision === "transfer" ? t.acceptance : decision === "slt" ? tr.reason : "") || "").trim();
    var reasonNeeded = decision === "accept" || decision === "transfer" || (decision === "slt" && shortfall.length > 0);
    var reasonMissing = reasonNeeded && !reason;
    // A transfer rests on its arrangement and on who agreed it; an
    // acceptance on its reason and on who accepted it.
    var tMissing = decision === "transfer" ? transferMissing(t) : [];
    var byMissing = decision === "accept" && !String(((t.acceptanceDetail || {}).by) || "").trim();
    var gap = "", label = TREATMENT_LABEL.within, disposition = null;
    if (required && !confirmed) label = TREATMENT_LABEL.none;
    else if (decision === "reduce") {
      if (!covering.length) { gap = "no countermeasure is linked to it" + (linkSuggested.length ? " (a suggested link is waiting to be confirmed)" : ""); label = TREATMENT_LABEL.reduceNone; }
      else if (inPlace) { label = TREATMENT_LABEL.reduced; disposition = "mitigated"; }
      else { label = TREATMENT_LABEL.reduce; disposition = "countermeasure"; }
    } else if (decision === "accept") {
      if (reasonMissing) { gap = "accepted with no reason recorded" + (byMissing ? " and no record of who accepted it" : ""); label = TREATMENT_LABEL.acceptNoReason; }
      else if (byMissing) { gap = "accepted with no record of who accepted it"; label = TREATMENT_LABEL.acceptNoBy; }
      else { label = TREATMENT_LABEL.accept; disposition = "accepted"; }
    } else if (decision === "transfer") {
      // The rating is not changed by a transfer: it moves who bears the
      // consequence, not its likelihood or impact.
      if (tMissing.length) { gap = "transferred with no record of " + orList(tMissing); label = TREATMENT_LABEL.transferIncomplete; }
      else { label = TREATMENT_LABEL.transfer; disposition = "transferred"; }
    } else if (decision === "slt") {
      if (reasonMissing && sf.unset.length) { gap = "no SL-T is set" + (t.affectedFR.length ? " on a requirement it affects" : "") + " and no reason is recorded"; label = TREATMENT_LABEL.sltUnset; }
      else if (reasonMissing) { gap = "the SL-T is below the suggestion with no reason recorded"; label = TREATMENT_LABEL.sltNoReason; }
      else { label = TREATMENT_LABEL.slt; disposition = "sl-t"; }
    }
    return {
      required: required,
      state: !required ? "within" : (confirmed ? "confirmed" : (decision ? "suggested" : "none")),
      decision: decision, confirmed: confirmed, open: required && !confirmed,
      complete: confirmed && !gap,
      reason: reason, reasonNeeded: reasonNeeded, reasonMissing: reasonMissing,
      covering: covering, covered: covering.length > 0,
      existingLinked: existingLinked, plannedLinked: plannedLinked, linkSuggested: linkSuggested,
      current: cur, currentWithin: currentWithin, currentExceeds: !!cur && curAbove,
      residual: resid, residualWithin: residualWithin, planned: resid, plannedWithin: residualWithin, plannedExceeds: !!resid && residAbove,
      today: today, todayWithin: todayWithin, operative: operative, operativeExceeds: !!operative && operativeAbove,
      afterPlan: afterPlan, afterPlanWithin: afterPlanWithin,
      categories: cats,
      sltUnset: sf.unset, sltBelow: sf.below, sltShortfall: shortfall, gap: gap,
      transferMissing: tMissing,
      disposition: disposition,
      label: label
    };
  }
  // The risk-context value alone: null until a decision is complete.
  function threatDisposition(owner, t, project) { return threatTreatment(owner, t, project).disposition; }
  // The value the risk context writes. spt-risk-context/1.4 fixes four values
  // and null, and the released v0.7 tools read no other: a transfer is
  // written as accepted (the risk is not mitigated, by the organisation's
  // decision), with the decision itself beside it as provenance.
  function contextDisposition(d) { return d === "transferred" ? "accepted" : (d || null); }

  // Names for stored ids, so no deliverable prints the id itself.
  var ASSET_TYPE_LABEL = { "plc": "PLC", "safety-plc": "Safety PLC", "hmi": "HMI", "historian": "Historian", "engineering-workstation": "Engineering workstation", "server": "Server", "network": "Network device", "business": "Business system", "other": "Other" };
  var ASSET_LINK_LABEL = { "wireless": "wireless", "temporary": "temporarily connected" };
  function assetLinkLabel(id) { return ASSET_LINK_LABEL[id] || ""; }
  var FLAG_LABEL = { "sis-present": "safety instrumented system present", "remote-access": "remote access", "internet-adjacent": "internet adjacent", "wireless": "wireless links", "removable-media": "removable media", "many-conduits": "many conduits" };
  function plainId(id) { return String(id || "").replace(/-/g, " "); }
  function assetTypeLabel(id) { return ASSET_TYPE_LABEL[id] || plainId(id); }
  function flagLabel(id) { return FLAG_LABEL[id] || plainId(id); }
  function scaleName(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i].name; return id ? plainId(id).charAt(0).toUpperCase() + plainId(id).slice(1) : ""; }
  // A level's name on the project's criteria (the house's without a project).
  function likelihoodName(id, project) { return scaleName(M.criteriaOf(project).likelihood, id); }
  function impactName(id, project) { return scaleName(M.criteriaOf(project).impact, id); }
  function zoneSafety(zone) { return !!zone.flags["sis-present"] || zone.assets.some(function (a) { return a.type === "safety-plc"; }); }

  // ---------- Paths through a zone or conduit (consequence first) ----------
  // A path is a threat that acts in its own zone or conduit after passing
  // through others (threat.via), whether or not it leads to a consequence.
  // The house method gives a zone or conduit a scenario passes through (its
  // via), on the scenario's affected requirements, the SL its unmitigated
  // risk maps to, as a threat of its own would: a stepping stone with no
  // threats of its own would otherwise look low risk. A suggestion only. The
  // route is as recorded; it is not checked against the conduits.
  //
  // The paths whose via names this zone or conduit: [{ t, owner }].
  function pathsThrough(project, id) {
    var out = [];
    project.zones.concat(project.conduits).forEach(function (o) {
      (o.threats || []).forEach(function (t) { if (o.id !== id && M.viaOf(t).indexOf(id) >= 0) out.push({ t: t, owner: o }); });
    });
    return out;
  }
  // The paths that lead to a consequence: [{ t, owner }], zones then conduits.
  function pathsTo(project, kId) {
    var out = [];
    if (!kId) return out;
    project.zones.concat(project.conduits).forEach(function (o) {
      (o.threats || []).forEach(function (t) { if (t.consequenceId === kId) out.push({ t: t, owner: o }); });
    });
    return out;
  }
  // A path's unmitigated impact against its consequence's: "lower", "higher",
  // "same", or null when either is not rated (or not on the criteria).
  function pathImpactVs(t, k, project) {
    if (!t || !k || !t.impact || !k.impact) return null;
    var a = impactRank(t.impact, project), b = impactRank(k.impact, project);
    if (a < 0 || b < 0) return null;
    return a < b ? "lower" : a > b ? "higher" : "same";
  }
  // The zones and conduits a path passes through that no threat of their own
  // touches: id -> [consequence ids], the stepping stones the step 5 rail and
  // step 3's tables flag.
  function steppingStones(project) {
    var out = {};
    project.zones.concat(project.conduits).forEach(function (o) {
      if ((o.threats || []).length) return;
      var ks = [];
      pathsThrough(project, o.id).forEach(function (x) { var k = x.t.consequenceId; if (k && M.consequenceById(project, k) && ks.indexOf(k) < 0) ks.push(k); });
      if (pathsThrough(project, o.id).length) out[o.id] = ks;
    });
    return out;
  }

  // The worst unmitigated band of those paths on one requirement, the paths
  // at it and the SL it maps to.
  function viaOnFR(paths, fr, project) {
    var band = null;
    paths.forEach(function (x) { var r = threatRisk(x.t, project); if (r && (x.t.affectedFR || []).indexOf(fr) >= 0 && (band == null || BAND_RANK[r] > BAND_RANK[band])) band = r; });
    var at = band ? paths.filter(function (x) { return threatRisk(x.t, project) === band && (x.t.affectedFR || []).indexOf(fr) >= 0; }) : [];
    return { band: band, paths: at, sl: band && RULES.riskToSL[band] ? RULES.riskToSL[band].suggest : null };
  }
  function andList(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : (a[0] || ""); }
  // A path in words: "T1 via Z3 and C2 to K1" ("to" only with a consequence).
  function pathWords(t) {
    var via = M.viaOf(t);
    return t.id + (via.length ? " through " + andList(via) : "") + (t.consequenceId ? " to " + t.consequenceId : "");
  }
  // "House method for a scenario that passes through this zone: T1 through
  // Z3 and C2 to K1 (acting in Z1) has a high unmitigated risk on IAC,
  // which maps to SL3."
  function viaTrace(v, fr, isCond) {
    return "House method for a scenario that passes through this " + (isCond ? "conduit" : "zone") + ": " +
      andList(v.paths.map(function (x) { return pathWords(x.t) + " (acting in " + x.owner.id + ")"; })) +
      (v.paths.length === 1 ? " has" : " have") + " a " + BAND_NAME[v.band].toLowerCase() + " unmitigated risk on " + fr + ", which maps to SL" + v.sl + ".";
  }

  // A zone or conduit grouped with another (assessed with it, sharing its
  // threat scenarios) takes, per FR, the higher of its own suggestion and
  // that one's (house method). { lead, sug } or null. The lead's own
  // suggestion is worked out plain (no group followed), so a group never
  // chains or loops.
  function leadSuggestion(owner, project, plain) {
    if (plain) return null;
    var d = depthOf(owner, project);
    if (d.depth !== "grouped" || !d.leadOk) return null;
    return { lead: d.lead, sug: ("fromZone" in d.lead) ? suggestConduit(d.lead, project, true) : suggestZone(d.lead, project, true) };
  }
  function applyLead(ls, fr, entry) {
    var l = ls && ls.sug.byFR[fr] ? ls.sug.byFR[fr].sl : null;
    if (l == null) return;
    if (entry.sl == null || l > entry.sl) { entry.sl = l; entry.trace.push("Assessed with " + ls.lead.id + ": takes its suggested SL" + l + " for " + entry.fr + " (house method)."); }
    else entry.trace.push("Assessed with " + ls.lead.id + ", whose suggestion for " + entry.fr + " is SL" + l + ".");
  }

  // Per-foundational-requirement suggestion for a zone.
  // Returns { byFR: {fr: {sl, risk, trace[]}}, safetyRelated, worstRisk }.
  // plain: leave out a group (see leadSuggestion).
  function suggestZone(zone, project, plain) {
    var tolerable = tolerableOf(project);
    var safety = zoneSafety(zone);
    var adv = project.srs.adversaryClass;
    var result = { byFR: {}, safetyRelated: safety, worstRisk: worstRiskOf(zone.threats, project) };
    var perCategory = M.criteriaOf(project).hasCategoryTolerable;
    var floorFR = M.safetyFloorFR(project);
    var through = pathsThrough(project, zone.id);
    var ls = leadSuggestion(zone, project, plain);

    FR_IDS.forEach(function (fr) {
      var trace = [];
      var maxBand = null, contributing = 0, maxAbove = false;
      zone.threats.forEach(function (t) {
        if (t.affectedFR && t.affectedFR.indexOf(fr) >= 0) {
          var r = threatRisk(t, project);
          if (r) {
            contributing++; if (maxBand == null || BAND_RANK[r] > BAND_RANK[maxBand]) maxBand = r;
            // Whether any threat behind it is above tolerable risk is each
            // threat's own (threatTreatment's rule, per consequence category
            // where the criteria set one), not the worst band's alone.
            if (aboveTolerable(project, r, t.likelihood, categoryRatings(t.impactByCategory, project), t.impact || null)) maxAbove = true;
          }
        }
      });

      var sl = null;
      if (maxBand) {
        var m = RULES.riskToSL[maxBand];
        sl = m.suggest;
        trace.push("Unmitigated risk " + BAND_NAME[maxBand].toLowerCase() + " for " + fr + " (from " + contributing + " threat" + (contributing === 1 ? "" : "s") + "): " + m.trace);
        if (maxBand === "very-high" && m.escalateTo) trace.push("Escalation to SL" + m.escalateTo + " available for " + fr + " only if a nation-state-grade adversary is in scope.");
        if (maxAbove) trace.push(perCategory
          ? "A threat behind this risk is above tolerable risk (" + BAND_NAME[tolerable].toLowerCase() + ", or the tolerable risk of a consequence category), so it needs a treatment decision."
          : "This risk is above tolerable risk (" + BAND_NAME[tolerable].toLowerCase() + "), so each threat behind it needs a treatment decision.");
      } else {
        trace.push("No threats affecting " + fr + " captured yet.");
      }
      // A path through the zone (house method; only when one names it).
      var v = through.length ? viaOnFR(through, fr, project) : null;
      if (v && v.band) {
        trace.push(viaTrace(v, fr, false));
        // The same escalation note as a threat of its own at very high.
        var vm0 = RULES.riskToSL[v.band];
        if (v.band === "very-high" && vm0 && vm0.escalateTo) trace.push("Escalation to SL" + vm0.escalateTo + " available for " + fr + " only if a nation-state-grade adversary is in scope.");
        if (sl == null || v.sl > sl) sl = v.sl;
      }

      MODS.forEach(function (mod) {
        if (zone.flags[mod.id] && mod.affectsFR && mod.affectsFR.indexOf(fr) >= 0) {
          trace.push(cap(mod.effect) + " from " + mod.id + " (" + mod.label + "): " + mod.trace);
        }
      });

      // The floor applies to the requirements the rules file lists (all seven
      // by default), narrowed where the project says so (phase 5b).
      if (safety) {
        var floor = SIS_RULE ? SIS_RULE.floorSL : 3;
        if (floorFR.indexOf(fr) < 0) trace.push("Safety related: the SL" + floor + " floor does not cover " + fr + " in this assessment.");
        else if (sl == null || sl < floor) { sl = floor; trace.push("SL" + floor + " floor applied (SIS present): " + SIS_RULE.trace); }
        else trace.push("SIS present: SL" + floor + " floor already met.");
      }
      if (ls) { var le = { fr: fr, sl: sl, trace: trace }; applyLead(ls, fr, le); sl = le.sl; }

      if (sl != null && adv && MISMATCH_RULE && adv > sl) {
        trace.push("Mismatch: the assumed adversary class (SL" + adv + "-grade) exceeds the suggested SL" + sl + " for " + fr + ": " + MISMATCH_RULE.trace);
      }

      result.byFR[fr] = { sl: sl, risk: maxBand, trace: trace };
    });

    if (project.srs.clientMatrix) {
      FR_IDS.forEach(function (fr) { result.byFR[fr].trace.push("Client risk matrix in use: it takes precedence over this house heuristic (hard rule)."); });
    }
    return result;
  }

  // Per-FR suggestion for a conduit: higher of its own risk-derived SL and the
  // connected zones' suggested SL, per FR (house heuristic).
  function suggestConduit(cond, project, plain) {
    var ends = ["fromZone", "toZone"].map(function (k) { var z = findZone(project, cond[k]); return z ? { id: cond[k], sug: suggestZone(z, project, plain), name: z.name } : (cond[k] === "EXT" ? { id: "EXT", sug: null, name: "external" } : null); });
    var result = { byFR: {}, worstRisk: worstRiskOf(cond.threats, project) };
    var through = pathsThrough(project, cond.id);
    var ls = leadSuggestion(cond, project, plain);

    FR_IDS.forEach(function (fr) {
      var trace = ["House heuristic: a conduit takes the higher of its own risk-derived SL and the connected zones' suggested SL, per FR."];
      var sl = null, band = null;
      cond.threats.forEach(function (t) {
        if (t.affectedFR.indexOf(fr) >= 0) { var r = threatRisk(t, project); if (r && (band == null || BAND_RANK[r] > BAND_RANK[band])) band = r; }
      });
      if (band) { var m = RULES.riskToSL[band]; sl = m.suggest; trace.push("Conduit's own unmitigated risk " + BAND_NAME[band].toLowerCase() + " for " + fr + ": " + m.trace); }
      var v = through.length ? viaOnFR(through, fr, project) : null;
      if (v && v.band) {
        trace.push(viaTrace(v, fr, true));
        if (sl == null || v.sl > sl) sl = v.sl;
      }
      ends.forEach(function (e) {
        if (e && e.sug && e.sug.byFR[fr] && e.sug.byFR[fr].sl != null) {
          if (sl == null || e.sug.byFR[fr].sl > sl) sl = e.sug.byFR[fr].sl;
          trace.push("Inherits SL" + e.sug.byFR[fr].sl + " for " + fr + " from " + e.id + (e.name ? " (" + e.name + ")" : "") + ".");
        } else if (e && e.id === "EXT") {
          trace.push("EXT endpoint: external party (the conduit boundary is the protection point).");
        }
      });
      if (ls) { var le = { fr: fr, sl: sl, trace: trace }; applyLead(ls, fr, le); sl = le.sl; }
      if (sl == null) trace.push("No threats or connected-zone suggestion for " + fr + " yet.");
      result.byFR[fr] = { sl: sl, risk: band, trace: trace };
    });
    return result;
  }

  // What sets each foundational requirement's suggested SL-T for a zone or
  // conduit: [{ fr, sl, band, drivers: [threat ids with the worst unmitigated
  // risk on it], mapped (the SL the house mapping gives that band), raisedBy:
  // null | "floor" | "inherited", from: [zone ids it is inherited from] }].
  // The drivers set the suggestion only when their mapped SL reaches it; above
  // it, a zone's suggestion comes from the safety floor and a conduit's from
  // the zones it joins. A requirement with no driver and no suggestion is left out.
  // One set by the zone or conduit it is grouped with is raisedBy "grouped",
  // from [that one's id] (house method).
  // A suggestion set by a path through the zone or conduit (house method)
  // is raisedBy "via", with the paths: via [{ id, ownerId, band, words }],
  // words being the path as "T1 via Z3 and C2 to K1".
  function sltDrivers(owner, project) {
    var isCond = "fromZone" in owner, sug = isCond ? suggestConduit(owner, project) : suggestZone(owner, project);
    var ends = isCond ? [owner.fromZone, owner.toZone].filter(function (id, i, a) { return id && id !== "EXT" && a.indexOf(id) === i; })
      .map(function (id) { var z = findZone(project, id); return z ? { id: id, sug: suggestZone(z, project) } : null; }).filter(Boolean) : [];
    var through = pathsThrough(project, owner.id);
    var ls = leadSuggestion(owner, project, false);
    var out = [];
    FR_IDS.forEach(function (fr) {
      var band = null;
      owner.threats.forEach(function (t) { var r = threatRisk(t, project); if (r && (t.affectedFR || []).indexOf(fr) >= 0 && (band == null || BAND_RANK[r] > BAND_RANK[band])) band = r; });
      var drivers = band ? owner.threats.filter(function (t) { return threatRisk(t, project) === band && (t.affectedFR || []).indexOf(fr) >= 0; }).map(function (t) { return t.id; }) : [];
      var mapped = band && RULES.riskToSL[band] ? RULES.riskToSL[band].suggest : null;
      var sl = sug.byFR[fr] ? sug.byFR[fr].sl : null;
      var raisedBy = null, from = [];
      var v = through.length ? viaOnFR(through, fr, project) : null;
      if (sl != null && (mapped == null || mapped < sl)) {
        if (v && v.band && v.sl === sl) raisedBy = "via";
        else if (isCond && (from = ends.filter(function (e) { return e.sug.byFR[fr] && e.sug.byFR[fr].sl === sl; }).map(function (e) { return e.id; })).length) raisedBy = "inherited";
        else if (!isCond && zoneSafety(owner) && M.safetyFloorFR(project).indexOf(fr) >= 0) raisedBy = "floor";
        // Grouped with another (house method): its suggestion.
        else if (ls && ls.sug.byFR[fr] && ls.sug.byFR[fr].sl === sl) { raisedBy = "grouped"; from = [ls.lead.id]; }
      }
      if (!drivers.length && !raisedBy) return;
      var entry = { fr: fr, sl: sl, band: band, drivers: drivers, mapped: mapped, raisedBy: raisedBy, from: from };
      if (raisedBy === "via") entry.via = v.paths.map(function (x) { return { id: x.t.id, ownerId: x.owner.id, band: v.band, words: pathWords(x.t) }; });
      out.push(entry);
    });
    return out;
  }

  // The requirements the safety floor covers, for the page and Word:
  // { list, all, none, words ("every foundational requirement", or "IAC, UC and SI") }.
  function safetyFloorWords(project) {
    var list = M.safetyFloorFR(project), all = list.length === FR_IDS.length;
    var words = all ? "every foundational requirement" : (list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : (list[0] || ""));
    return { list: list, all: all, none: !list.length, narrowed: Array.isArray(project && project.safetyFloorFR), words: words };
  }

  function maxDefined(obj) { var best = null; Object.keys(obj).forEach(function (k) { if (typeof obj[k] === "number" && (best == null || obj[k] > best)) best = obj[k]; }); return best; }
  function frSug(sug) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = sug.byFR[fr].sl; }); return o; }
  function vecStr(vec) { return FR_IDS.map(function (fr) { return vec[fr] != null ? vec[fr] : "-"; }).join("/"); }
  // The same in words for the screen: each FR set, or "Not set" (no dash placeholders).
  function vecWords(vec) {
    var set = FR_IDS.filter(function (fr) { return vec && vec[fr] != null; });
    return set.length ? set.map(function (fr) { return fr + " SL" + vec[fr]; }).join(", ") : "Not set";
  }
  // The assets a threat on this zone or conduit can name: a zone's own, or for
  // a conduit those of the zones it joins. [{ id, name, type, zoneId }]
  function threatAssets(owner, project) {
    var zones = ("fromZone" in owner) ? [owner.fromZone, owner.toZone].map(function (id) { return findZone(project, id); }).filter(function (z, i, a) { return z && a.indexOf(z) === i; }) : [owner];
    var out = [];
    zones.forEach(function (z) { (z.assets || []).forEach(function (a) { if (a && a.id) out.push({ id: a.id, name: a.name || "", type: a.type, zoneId: z.id }); }); });
    return out;
  }

  function VM() { return window.RiskApp.ViewModel; }

  // ---------- Risk comparison (step 4) ----------
  //
  // The standard's comparison is one: the SUC's initial risk against
  // tolerable risk (sucComparison, below). Above it, every zone and conduit
  // is assessed in step 5, at a depth the consultant chooses (depthOf).
  // Comparing each zone's and conduit's initial risk with tolerable risk is
  // the house method for suggesting that depth, not a reading of the
  // standard's words. A zone's initial risk is the worst of its assigned
  // ranked systems, or entered directly when it has none. A conduit's
  // follows the house rule below unless one is entered.
  // comparison() still reads the decision an older build recorded per zone
  // ({ required, reason }, js/model.js); on a high-level-only assessment
  // hlaComparison() is the consultant's decision per ranked system, which
  // the comparison only suggests, and one that differs needs a reason.

  var CONDUIT_RULE = "a conduit takes the higher initial risk of the zones it joins unless one is entered (house rule)";
  function isBand(v) { return typeof v === "string" && BAND_RANK[v] != null; }
  function worstBand(list) {
    var worst = null;
    list.forEach(function (b) { if (isBand(b) && (worst == null || BAND_RANK[b] > BAND_RANK[worst])) worst = b; });
    return worst;
  }
  function hlaById(project, id) { var l = project.srs.highLevelAssets; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return l[i]; return null; }
  function hlaRisk(a, project) { return a ? riskFor(a.consequence, a.likelihood, project) : null; }
  // The zones a ranked system is assigned to.
  function zonesOfHLA(project, id) { return project.zones.filter(function (z) { return M.hlaIdsOf(z).indexOf(id) >= 0; }); }

  // { band, source: "systems" | "entered" | "zones" | null, systems, zones, ruleBand }
  // A zone whose assigned systems carry no rating (impact with no likelihood)
  // falls back to the initial risk entered for it.
  function initialRiskOf(owner, project) {
    var entered = isBand(owner.initialRisk) ? owner.initialRisk : null;
    if (!("fromZone" in owner)) {
      var systems = M.hlaIdsOf(owner).map(function (id) { return hlaById(project, id); }).filter(Boolean);
      var sysBand = worstBand(systems.map(function (a) { return hlaRisk(a, project); }));
      // With a tolerable risk per consequence category, the zone is above it
      // when one of its systems is (hlaExceeds), whatever the worst band says.
      if (sysBand) return { band: sysBand, source: "systems", systems: systems, zones: [], ruleBand: null,
        exceeds: M.criteriaOf(project).hasCategoryTolerable ? systems.some(function (a) { return hlaExceeds(a, project); }) : null };
      if (entered) return { band: entered, source: "entered", systems: systems, zones: [], ruleBand: null };
      return { band: null, source: systems.length ? "systems" : null, systems: systems, zones: [], ruleBand: null };
    }
    var ends = [owner.fromZone, owner.toZone].map(function (id) { return id && id !== "EXT" ? findZone(project, id) : null; }).filter(Boolean);
    var endRisks = ends.map(function (z) { return initialRiskOf(z, project); });
    var ruleBand = worstBand(endRisks.map(function (ir) { return ir.band; }));
    if (entered) return { band: entered, source: "entered", systems: [], zones: ends, ruleBand: ruleBand };
    // Above tolerable risk when a zone it joins is (per category, where set).
    var ruleExceeds = M.criteriaOf(project).hasCategoryTolerable ? endRisks.some(function (ir) {
      return !!ir.band && (typeof ir.exceeds === "boolean" ? ir.exceeds : exceedsTolerable(ir.band, tolerableOf(project)));
    }) : null;
    return { band: ruleBand, source: ruleBand ? "zones" : null, systems: [], zones: ends, ruleBand: ruleBand, exceeds: ruleExceeds };
  }

  // The decision, set against what the comparison suggests:
  //   suggested     true / false from the comparison, null with no initial risk
  //   required      the recorded decision, or null when none is recorded
  //   state         "confirmed" | "suggested" | "none"
  //   open          no decision recorded
  //   override      recorded, and not what the comparison suggests
  //   noBasis       recorded with no initial risk to compare
  //   reasonMissing an override, or a decision with no basis, with no reason
  //   skip          recorded as not required: step 5 asks for no threats
  // exceeds: whether the initial risk is above tolerable risk, when that is
  // not the band against the general tolerable risk (per category); else null.
  function decisionState(d, band, tolerable, exceeds) {
    d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
    var suggested = band ? (typeof exceeds === "boolean" ? exceeds : exceedsTolerable(band, tolerable)) : null;
    var required = d.required === true || d.required === false ? d.required : null;
    var override = required !== null && suggested !== null && required !== suggested;
    var noBasis = required !== null && suggested === null;
    var reason = String(d.reason || "").trim();
    return {
      initial: band, tolerable: tolerable, exceeds: suggested, suggested: suggested, required: required,
      state: required !== null ? "confirmed" : (suggested !== null ? "suggested" : "none"),
      open: required === null, override: override, noBasis: noBasis, reason: reason, reasonMissing: (override || noBasis) && !reason,
      skip: required === false
    };
  }
  // The completeness words for a decision that wants a reason.
  function reasonText(c) {
    return c.noBasis ? ": the decision has no initial risk to rest on and no reason." : ": the decision differs from the comparison and has no reason.";
  }
  function comparison(owner, project) {
    var ir = initialRiskOf(owner, project);
    var out = decisionState(owner.detailed, ir.band, tolerableOf(project), ir.exceeds);
    out.source = ir.source; out.systems = ir.systems; out.zones = ir.zones; out.ruleBand = ir.ruleBand;
    return out;
  }
  // On a high-level-only assessment the decision sits on the ranked system.
  function hlaComparison(a, project) {
    var out = decisionState(a.detailed, hlaRisk(a, project), tolerableOf(project), M.criteriaOf(project).hasCategoryTolerable ? hlaExceeds(a, project) : null);
    out.source = out.initial ? "rating" : null;
    return out;
  }

  // The SUC's initial risk against tolerable risk: the worst of the ranked
  // systems' ratings and the initial risk of the zones and conduits.
  //   { band, tolerable, exceeds: true | false | null (nothing rated),
  //     required (a detailed risk assessment: exceeds === true),
  //     source: "systems" (a ranked system gives the band) | "zones" | null,
  //     systems: the ranked systems at that band }
  function sucComparison(project) {
    var p = project, tol = tolerableOf(p), perCat = M.criteriaOf(p).hasCategoryTolerable;
    var sys = p.srs.highLevelAssets.filter(function (a) { return a && hlaRisk(a, p); });
    var owned = p.zones.concat(p.conduits).map(function (o) { return initialRiskOf(o, p); }).filter(function (ir) { return ir.band; });
    var band = worstBand(sys.map(function (a) { return hlaRisk(a, p); }).concat(owned.map(function (ir) { return ir.band; })));
    var exceeds = null;
    if (band) {
      exceeds = perCat
        ? sys.some(function (a) { return hlaExceeds(a, p); }) || owned.some(function (ir) { return typeof ir.exceeds === "boolean" ? ir.exceeds : exceedsTolerable(ir.band, tol); })
        : exceedsTolerable(band, tol);
    }
    var top = sys.filter(function (a) { return hlaRisk(a, p) === band; });
    return { band: band, tolerable: tol, exceeds: exceeds, required: exceeds === true,
      source: band ? (top.length ? "systems" : "zones") : null, systems: top };
  }

  // ---------- How each zone and conduit is assessed (step 5) ----------
  //
  // The depth is the consultant's (zone/conduit.assessment, js/model.js).
  // A file without it reads as detailed, unless an older build recorded the
  // zone or conduit as not needing a detailed assessment and it has no
  // threats: that reads as a proportionate review with nothing noted yet,
  // so the completeness list asks for the note. Nothing is written.
  function ownerById(project, id) {
    var all = project.zones.concat(project.conduits);
    for (var i = 0; i < all.length; i++) if (all[i] && all[i].id === id) return all[i];
    return null;
  }
  function storedAssessment(o) {
    var a = o && o.assessment;
    return a && typeof a === "object" && !Array.isArray(a) && M.ASSESSMENT_DEPTHS.indexOf(a.depth) >= 0 ? a : null;
  }
  // The depth alone, without following a group.
  function depthName(o) {
    var a = storedAssessment(o);
    if (a) return a.depth;
    var d = o && o.detailed;
    return d && typeof d === "object" && d.required === false && !(o.threats || []).length ? "proportionate" : "detailed";
  }
  // { depth, set (recorded), legacy (read from an older build's decision),
  //   withId, lead (the zone or conduit it is grouped with), leadOk (that
  //   one exists, is not itself and is assessed in detail), reuseSource,
  //   considered, reason }. Only the text that belongs to the depth is given.
  function depthOf(owner, project) {
    var a = storedAssessment(owner), depth = depthName(owner);
    function txt(k) { return a && typeof a[k] === "string" ? a[k].trim() : ""; }
    var out = { depth: depth, set: !!a, legacy: !a && depth === "proportionate",
      withId: depth === "grouped" ? txt("withId") : "", lead: null, leadOk: false,
      reuseSource: depth === "reused" ? txt("reuseSource") : "",
      considered: depth === "proportionate" ? txt("considered") : "",
      reason: depth === "deferred" ? txt("reason") : "" };
    if (out.withId && out.withId !== owner.id) {
      out.lead = ownerById(project, out.withId);
      out.leadOk = !!out.lead && depthName(out.lead) === "detailed";
    }
    return out;
  }
  // The house method's suggestion: detailed where the zone's or conduit's
  // initial risk is above tolerable risk, proportionate where it is within
  // it, null with no initial risk. A suggestion only: nothing is filled.
  function depthSuggestion(owner, project) {
    var c = comparison(owner, project);
    return c.suggested === null ? null : (c.suggested ? "detailed" : "proportionate");
  }
  // The zones and conduits another can be grouped with: assessed in detail, not itself.
  function groupLeads(owner, project) {
    return project.zones.concat(project.conduits).filter(function (o) { return o !== owner && depthName(o) === "detailed"; });
  }
  // The zones and conduits grouped with this one.
  function groupedWith(project, id) {
    return project.zones.concat(project.conduits).filter(function (o) { var d = depthOf(o, project); return d.depth === "grouped" && d.withId === id; });
  }
  // The depth in words: "Detailed", "Grouped with Z3", "Reused", ...
  function depthWords(d) { return d.depth === "grouped" && d.withId ? "Grouped with " + d.withId : M.DEPTH_LABEL[d.depth]; }
  // What the depth rests on, in words, or "" when there is nothing to say.
  function depthBasis(d) {
    if (d.depth === "detailed") return "Its own threat scenarios";
    if (d.depth === "grouped") return d.withId ? "Assessed with " + d.withId + ", which holds the threat scenarios they share" : "";
    if (d.depth === "reused") return d.reuseSource ? "Reused from " + d.reuseSource : "";
    if (d.depth === "proportionate") return d.considered ? "Threats considered: " + d.considered : "";
    return d.reason;
  }

  // ---------- Separation (step 3) ----------
  //
  // A separation row is raised only when a zone's data shows a mix: business
  // systems beside control system assets, a safety related asset beside other
  // control system assets, a temporarily connected or wireless device beside
  // fixed ones, or control system assets in a zone reached from an external
  // network. The consultant answers a raised row "met" or "not separated"
  // (with a reason); a row not raised asks nothing and is never open. When
  // and how a row is raised is the method used here (data/zcr-map.json).

  var IACS_TYPES = ["plc", "safety-plc", "hmi", "historian", "engineering-workstation"];
  var NON_SAFETY_CONTROL = ["plc", "hmi", "historian", "engineering-workstation", "server", "business"];
  function conduitExternal(c) { return !!c.external || c.fromZone === "EXT" || c.toZone === "EXT"; }
  function conduitsOf(project, zone) { return project.conduits.filter(function (c) { return c.fromZone === zone.id || c.toZone === zone.id; }); }
  function separationRows(zone, project) {
    var assets = zone.assets || [], out = [];
    function has(fn) { return assets.some(fn); }
    function isType(list) { return function (a) { return list.indexOf(a.type) >= 0; }; }
    var why = {};
    if (has(function (a) { return a.type === "business"; }) && has(isType(IACS_TYPES))) why.business = "Business systems share the zone with control system assets.";
    if (zoneSafety(zone) && has(isType(NON_SAFETY_CONTROL))) why.safety = "Safety related assets share the zone with other control system assets.";
    if (has(function (a) { return a.link === "temporary"; }) && has(function (a) { return a.link !== "temporary"; })) why.temporary = "Temporarily connected devices share the zone with fixed ones.";
    if ((has(function (a) { return a.link === "wireless"; }) || (zone.flags && zone.flags.wireless)) && has(function (a) { return a.link !== "wireless"; })) why.wireless = "Wireless devices share the zone with wired ones.";
    var ext = conduitsOf(project, zone).filter(conduitExternal);
    if (ext.length && has(isType(IACS_TYPES))) why.external = "Reached from an external network (" + ext.map(function (c) { return c.id; }).join(", ") + ") and holds control system assets.";
    var stored = zone.separation && typeof zone.separation === "object" ? zone.separation : {};
    M.SEPARATION_ROWS.forEach(function (r) {
      if (!why[r.id]) return;
      var s = stored[r.id] || {};
      var answer = M.SEPARATION_ANSWERS.indexOf(s.answer) >= 0 ? s.answer : null;
      var reason = String(s.reason || "").trim();
      out.push({ id: r.id, label: r.label, why: why[r.id], answer: answer, reason: reason, required: !!r.required, wholeZone: !!r.wholeZone,
        departure: !!r.required && answer === "not-separated",
        open: !answer, reasonMissing: answer === "not-separated" && !reason });
    });
    return out;
  }

  // Assets pasted several at a time: one per line, with an optional type and
  // connection in further tab-separated columns (as copied from a spreadsheet).
  var TYPE_WORDS = {
    "safety": "safety-plc", "sis": "safety-plc", "safety controller": "safety-plc", "safety plc": "safety-plc",
    "controller": "plc", "dcs": "plc", "ews": "engineering-workstation", "engineering station": "engineering-workstation",
    "switch": "network", "router": "network", "firewall": "network", "network": "network",
    "it": "business", "business system": "business", "business": "business", "erp": "business"
  };
  function assetTypeFrom(s) {
    s = String(s || "").trim().toLowerCase();
    if (!s) return "other";
    if (M.ASSET_TYPES.indexOf(s) >= 0) return s;
    for (var id in ASSET_TYPE_LABEL) if (ASSET_TYPE_LABEL[id].toLowerCase() === s) return id;
    return TYPE_WORDS[s] || "other";
  }
  function assetLinkFrom(s) {
    s = String(s || "").trim().toLowerCase();
    if (/^(wireless|wi-?fi|radio)/.test(s)) return "wireless";
    if (/^temp/.test(s)) return "temporary";
    return null;
  }
  // A spreadsheet copy often starts with its header row: a first line whose
  // first column reads "name" or "asset", or whose second reads "type", is
  // that row and is skipped (out.headerSkipped says so).
  var HEADER_NAMES = ["name", "names", "asset", "assets", "asset name", "asset names"];
  function isHeaderRow(cols) {
    var a = String(cols[0] || "").toLowerCase(), b = String(cols[1] || "").toLowerCase();
    return HEADER_NAMES.indexOf(a) >= 0 || b === "type" || b === "asset type";
  }
  function parseAssets(text) {
    var rows = String(text || "").split(/\r?\n/).map(function (line) { return line.split("\t").map(function (c) { return c.trim(); }); })
      .filter(function (cols) { return !!cols[0]; });
    var skipped = rows.length > 0 && isHeaderRow(rows[0]);
    if (skipped) rows = rows.slice(1);
    var out = rows
      .map(function (cols) {
        var a = { name: cols[0], type: assetTypeFrom(cols[1]) };
        var link = assetLinkFrom(cols[2]) || (cols[1] && assetTypeFrom(cols[1]) === "other" ? assetLinkFrom(cols[1]) : null);
        if (link) a.link = link;
        return a;
      });
    if (skipped) out.headerSkipped = true;
    return out;
  }

  // ---------- The cyber security requirements specification (step 6) ----------
  //
  // Eight blocks, in the order data/zcr-map.json gives (specBlocks), each
  // assembled from what was captured elsewhere. A block is done when what it
  // needs is there; four of them have no other check, so they add their own
  // item to the completeness list (stage "spec").
  var SPEC_TITLES = {
    countermeasures: "Mandatory security countermeasures",
    suc: "SUC description", drawings: "Zone and conduit drawings", characteristics: "Zone and conduit characteristics",
    assumptions: "Operating environment assumptions", threats: "Threat environment", policies: "Organisational security policies",
    tolerable: "Tolerable risk", regulatory: "Regulatory requirements"
  };
  var SPEC_GAPS = {
    assumptions: "no operating environment assumptions recorded.",
    threats: "no assumed adversary or known threats recorded.",
    policies: "no organisational security policies recorded.",
    regulatory: "no regulatory requirements recorded."
  };
  // What the threat environment lacks: the adversary or the threats, and a
  // source of threat intelligence.
  function threatGap(p) {
    var r = p.srs, none = !r.adversaryClass && !r.knownThreats.length, noSrc = !M.listOf(r.threatSources).length;
    if (none && noSrc) return "no assumed adversary, known threats or source of threat intelligence recorded.";
    return none ? SPEC_GAPS.threats : "no source of threat intelligence recorded.";
  }
  function specOrder() {
    var m = (M.ZCR && M.ZCR.specBlocks) || {};
    var ids = Object.keys(m).filter(function (k) { return k.charAt(0) !== "_"; });
    return ids.length ? ids : Object.keys(SPEC_TITLES);
  }
  // The mandatory security countermeasures (the specification's): those the
  // confirmed decisions to reduce a risk rest on, existing ones to be kept
  // and planned ones to be put in place, each once per zone or conduit:
  // [{ m, owner, threats: [threat ids] }], in the project's order. Which
  // countermeasures count as mandatory is the house reading.
  function mandatoryCountermeasures(project) {
    var vm = VM().build(project), by = {}, out = [];
    vm.threats.forEach(function (x) {
      var T = x.treatment;
      if (!T.confirmed || T.decision !== "reduce") return;
      T.covering.forEach(function (m) {
        var k = x.owner.id + "/" + m.id;
        if (!by[k]) by[k] = { m: m, owner: x.owner, threats: [] };
        if (by[k].threats.indexOf(x.t.id) < 0) by[k].threats.push(x.t.id);
      });
    });
    project.zones.concat(project.conduits).forEach(function (o) {
      (o.countermeasures || []).forEach(function (m) { var e = by[o.id + "/" + m.id]; if (e) out.push(e); });
    });
    return out;
  }
  // [{ id, title, zcr, done, stage, has }]; has: anything captured for it.
  function specBlocks(project, items) {
    var p = project, s = p.suc, r = p.srs;
    items = items || baseItems(p);
    function anyZone(k) { return p.zones.some(function (z) { return M.listOf(z[k]).length > 0; }); }
    // The mandatory countermeasures are settled once no decision is open and
    // none to reduce a risk lacks its countermeasure (each its own item).
    var vmS = VM().build(p);
    var cmOpen = vmS.threats.some(function (x) { return x.treatment.open || (x.treatment.confirmed && x.treatment.decision === "reduce" && !x.treatment.complete); });
    var st = {
      countermeasures: { done: p.zones.length > 0 && !cmOpen, has: mandatoryCountermeasures(p).length > 0, stage: "risk" },
      suc: { done: !!(s.name || "").trim() && !!((s.description || "").trim() || (s.scopeStatement || "").trim()), has: !!(s.name || s.description || s.scopeStatement), stage: "suc" },
      drawings: { done: p.zones.length > 0 && p.conduits.every(function (c) { return c.fromZone && c.toZone; }), has: p.zones.length > 0, stage: "zones" },
      characteristics: { done: p.zones.length > 0 && !items.some(function (i) { return i.stage === "zones"; }), has: p.zones.length > 0, stage: "zones" },
      assumptions: { done: s.assumptions.length > 0 || anyZone("assumptions"), stage: "suc" },
      // The threat environment names where its picture comes from (ZCR 6.6),
      // beside the adversary or the threats themselves.
      threats: { done: (!!r.adversaryClass || r.knownThreats.length > 0) && M.listOf(r.threatSources).length > 0,
        has: !!r.adversaryClass || r.knownThreats.length > 0 || M.listOf(r.threatSources).length > 0 || M.listOf(r.emergingThreats).length > 0, stage: "srs" },
      policies: { done: M.listOf(s.policies).length > 0 || anyZone("securityPolicies"), stage: "spec" },
      tolerable: { done: M.tolerableConfirmed(p), has: true, stage: "suc" },
      regulatory: { done: r.regulatory.length > 0, stage: "spec" }
    };
    return specOrder().map(function (id) {
      var x = st[id] || { done: false, stage: "spec" };
      return { id: id, title: SPEC_TITLES[id] || id, zcr: ((M.ZCR && M.ZCR.specBlocks) || {})[id] || null,
        done: x.done, has: x.has != null ? x.has : x.done, stage: x.stage };
    });
  }

  // ---------- Approval (step 7) ----------
  //
  // What an approval covers: the tolerable risk, the ranking (each system's
  // ratings and, on a high-level-only assessment, its decision on a detailed
  // assessment), the SL-T of every zone and conduit, and the accepted risks.
  // The detailed report's approval covers the tolerable risk, the SL-T and
  // the accepted risks; the high-level report's the tolerable risk and the
  // ranking. The fingerprint, taken when an approver is recorded as
  // approving, holds one hash per part, so a later change says which part
  // moved and which report it concerns. It only warns.
  var APPROVAL_PARTS = ["tolerable", "ranking", "slt", "accepted"];
  var APPROVAL_PART_WORDS = { tolerable: "the tolerable risk or the risk criteria", ranking: "the ranking", slt: "the SL-T", accepted: "the accepted risks" };
  // The requirements specification (phase 6b) holds the tolerable risk and the SL-T.
  var APPROVAL_DOC_PARTS = { detailed: ["tolerable", "slt", "accepted"], highLevel: ["tolerable", "ranking"], spec: ["tolerable", "slt"] };
  function approvalBasis(project) {
    var vm = VM().build(project), hlOnly = M.assessmentType(project) === "high-level";
    // The tolerable risk an approval covers includes the criteria it rests
    // on, once they are not the house's (the levels and the matrix) or a
    // tolerable risk is set per consequence category. On the house criteria
    // it is the band alone, as it always was, so earlier approvals still match.
    // What is fingerprinted is what isHouse compares (js/model.js
    // criteriaContent: the levels with their names and definitions, the
    // cells and the categories' names), so a change that makes the criteria
    // not the house's always moves the fingerprint.
    var crit = M.criteriaOf(project), tol = tolerableOf(project);
    var tolPart = crit.isHouse && !crit.hasCategoryTolerable ? tol : {
      band: tol, byCategory: crit.tolerableByCategory,
      criteria: crit.isHouse ? null : JSON.parse(M.criteriaContent(project.criteria))
    };
    return {
      tolerable: tolPart,
      ranking: project.srs.highLevelAssets.map(function (a) {
        var d = hlOnly ? hlaComparison(a, project).required : null;
        return a.id + ":" + (a.consequence || "-") + "/" + (a.likelihood || "-") + (hlOnly ? "/" + (d === true ? "required" : d === false ? "not-required" : "-") : "");
      }),
      slt: vm.owners.map(function (row) { return row.o.id + ":" + FR_IDS.map(function (fr) { var v = row.o.slTargetByFR[fr]; return v == null ? "-" : v; }).join(""); }),
      // The transferred risks are approved with the accepted ones (neither is
      // mitigated). A transfer is marked, with to whom, so a project with
      // none fingerprints as before. An acceptance with its reason and no one
      // recorded as accepting it warns (step 3) but is approved as it was, so
      // an approval taken before "Accepted by" was asked for still matches.
      accepted: vm.threats.filter(function (x) {
        return x.disposition === "accepted" || x.disposition === "transferred" ||
          (x.treatment.decision === "accept" && x.treatment.confirmed && !x.treatment.reasonMissing);
      }).map(function (x) {
        // Who accepted it, their role, when, and when it is to be reviewed are
        // part of what was approved. Added only when one is given, so an
        // approval taken before they were recorded still matches.
        var ad = x.t.acceptanceDetail || {}, d = ACCEPT_DETAIL.map(function (k) { return String(ad[k] || "").trim(); });
        var mark = x.disposition === "transferred" ? "transfer>" + String(x.t.transferTo || "").trim() + ":" : "";
        return mark + x.owner.id + "/" + x.t.id + ":" + (x.treatment.reason || "") + (d.some(Boolean) ? "|" + d.join("|") : "");
      })
    };
  }
  var ACCEPT_DETAIL = ["by", "role", "date", "reviewDate"];
  // A threat whose confirmed decision is a transfer (as stored).
  function hasTransfer(project) {
    return project.zones.concat(project.conduits).some(function (o) {
      return (o.threats || []).some(function (t) { return !!t.treatment && t.treatment.confirmed && M.decisionOf(t.treatment) === "transfer"; });
    });
  }
  function hash8(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = (h * 33) ^ s.charCodeAt(i); h |= 0; }
    return ("0000000" + (h >>> 0).toString(16)).slice(-8);
  }
  function approvalFingerprint(project) {
    var b = approvalBasis(project);
    return "a2-" + APPROVAL_PARTS.map(function (k) { return hash8(JSON.stringify(b[k])); }).join("-");
  }
  // A fingerprint taken by the first phase 3b build ("a1-"): one hash of the
  // tolerable risk, the SL-T and the accepted risks, so a change cannot say
  // which of the three moved.
  function legacyFingerprint(project) {
    var b = approvalBasis(project);
    var s = JSON.stringify({ tolerable: b.tolerable, slt: b.slt, accepted: b.accepted }), h1 = 5381, h2 = 52711;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = (h1 * 33) ^ c; h2 = (h2 * 31) ^ c; h1 |= 0; h2 |= 0; }
    function hex(n) { return ("0000000" + (n >>> 0).toString(16)).slice(-8); }
    return "a1-" + hex(h1) + hex(h2);
  }
  // The parts that differ between a stored fingerprint and the project now.
  function changedParts(fp, project, now) {
    if (!fp) return [];
    if (/^a1-/.test(fp)) return fp === legacyFingerprint(project) ? [] : ["tolerable", "slt", "accepted"];
    var was = fp.replace(/^a2-/, "").split("-"), is = now.replace(/^a2-/, "").split("-");
    if (was.length !== APPROVAL_PARTS.length) return APPROVAL_PARTS.slice();
    return APPROVAL_PARTS.filter(function (k, i) { return was[i] !== is[i]; });
  }
  // [{ entry, index, signed, changed, parts, legacy, unrecorded }]: changed
  // when it was approved against a fingerprint that is no longer the
  // project's, parts what moved; unrecorded, approved with no fingerprint at
  // all (ticked in an older build), so a change could not be seen.
  function approvalStates(project) {
    var now = approvalFingerprint(project);
    return M.approvalsOf(project).map(function (e, i) {
      var parts = e.approved ? changedParts(e.fingerprint, project, now) : [];
      return { entry: e, index: i, signed: !!e.approved, changed: parts.length > 0, parts: parts,
        legacy: /^a1-/.test(e.fingerprint || ""), unrecorded: !!(e.approved && !e.fingerprint) };
    });
  }
  // The parts that moved since an approval, as far as one report is concerned.
  function approvalChangedFor(s, doc) {
    var want = APPROVAL_DOC_PARTS[doc] || APPROVAL_PARTS;
    return (s.parts || []).filter(function (k) { return want.indexOf(k) >= 0; });
  }
  // "the tolerable risk and the SL-T"; an a1 fingerprint cannot tell which
  // moved, so its parts join with "or".
  // In a list, "the risk criteria" (which hold the tolerable risk) keeps the
  // sentence from stacking a second "or".
  // project, when given: one with a transferred risk says "the accepted and
  // transferred risks" for that part.
  function approvalPartWords(parts, or, project) {
    var tr = !!project && hasTransfer(project);
    var w = parts.map(function (k) { return k === "tolerable" && parts.length > 1 ? "the risk criteria" : (k === "accepted" && tr ? "the accepted and transferred risks" : APPROVAL_PART_WORDS[k]); });
    return w.length > 1 ? w.slice(0, -1).join(", ") + (or ? " or " : " and ") + w[w.length - 1] : (w[0] || "");
  }

  // ---------- Completeness (warns, never blocks) ----------
  //
  // One structured list. Each item says which step it belongs to (stage, a
  // page id), which report it concerns (doc: "detailed", "highLevel" or
  // "both") and what to open to fix it (target: { kind, id, ownerId }, or
  // null): the nav's step status, Home, the readiness list on Check and issue
  // and the question before a download all read it. exportProblems is the
  // detailed report's part as plain text, as it has always been.

  function zoneLabel(o) { return o.id + (o.name ? " (" + o.name + ")" : ""); }
  function lcFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // What of a threat's or a ranked system's ratings no longer fits the risk
  // criteria (a level they no longer have, a category they no longer have,
  // or a single impact that is not the worst of its categories), in words:
  // ["the likelihood", "the current impact", ...]. Changing the criteria
  // never changes a rating silently: what no longer fits is listed here.
  var THREAT_RATING_WORDS = [["likelihood", "likelihood", "the likelihood"], ["impact", "impact", "the impact"],
    ["currentLikelihood", "likelihood", "the current likelihood"], ["currentImpact", "impact", "the current impact"],
    ["residualLikelihood", "likelihood", "the planned likelihood"], ["residualImpact", "impact", "the planned impact"]];
  var HLA_RATING_WORDS = [["consequence", "impact", "the impact"], ["likelihood", "likelihood", "the likelihood"]];
  function ratingMisfits(item, words, mapKey, impactKey, project) {
    var c = M.criteriaOf(project), out = [];
    function fits(kind, id) { return c[kind].some(function (x) { return x.id === id; }); }
    words.forEach(function (wd) { var v = item[wd[0]]; if (v && !fits(wd[1], v)) out.push(wd[2]); });
    var map = item[mapKey];
    if (map && typeof map === "object" && !Array.isArray(map)) {
      var keys = Object.keys(map).filter(function (k) { return map[k]; });
      var good = categoryRatings(map, project);
      if (good.length < keys.length) out.push("an impact by category");
      var worst = worstCategoryLevel(map, project);
      if (worst && item[impactKey] && item[impactKey] !== worst && fits("impact", item[impactKey])) out.push("the impact (not the worst of its categories)");
    }
    return out;
  }
  function misfitText(list) {
    var all = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
    return all + (list.length > 1 ? " no longer fit" : " no longer fits") + " the risk criteria.";
  }
  // Every rating that no longer fits, for the completeness list and the
  // criteria editor: [{ kind: "threat" | "system", owner, item, misfits }].
  function criteriaMisfits(project) {
    var out = [];
    project.srs.highLevelAssets.forEach(function (a) {
      var m = a ? ratingMisfits(a, HLA_RATING_WORDS, "consequenceByCategory", "consequence", project) : [];
      if (m.length) out.push({ kind: "system", owner: null, item: a, misfits: m });
    });
    project.zones.concat(project.conduits).forEach(function (o) {
      o.threats.forEach(function (t) {
        var m = ratingMisfits(t, THREAT_RATING_WORDS, "impactByCategory", "impact", project);
        if (m.length) out.push({ kind: "threat", owner: o, item: t, misfits: m });
      });
    });
    M.consequencesOf(project).forEach(function (k) {
      var m = ratingMisfits(k, CONSEQUENCE_RATING_WORDS, "impactByCategory", "impact", project);
      if (m.length) out.push({ kind: "consequence", owner: null, item: k, misfits: m });
    });
    return out;
  }
  var CONSEQUENCE_RATING_WORDS = [["impact", "impact", "the impact"]];

  // ---------- Changing the criteria (step 1) ----------
  //
  // How many ratings use each level: { likelihood: { id: n }, impact: { id: n } },
  // over every threat's three ratings and impacts by category and every
  // ranked system's ratings.
  function ratingUsage(project) {
    var use = { likelihood: {}, impact: {} };
    function add(kind, id) { if (id) use[kind][id] = (use[kind][id] || 0) + 1; }
    function addMap(map) { if (map && typeof map === "object") Object.keys(map).forEach(function (k) { add("impact", map[k]); }); }
    project.srs.highLevelAssets.forEach(function (a) { if (!a) return; add("impact", a.consequence); add("likelihood", a.likelihood); addMap(a.consequenceByCategory); });
    project.zones.concat(project.conduits).forEach(function (o) {
      o.threats.forEach(function (t) {
        THREAT_RATING_WORDS.forEach(function (wd) { add(wd[1], t[wd[0]]); });
        addMap(t.impactByCategory);
      });
    });
    M.consequencesOf(project).forEach(function (k) { add("impact", k.impact); addMap(k.impactByCategory); });
    return use;
  }
  // Moves the ratings on one level to another, as the consultant chose:
  // map { likelihood: { oldId: newId }, impact: { oldId: newId } }. A level
  // left out of the map keeps its ratings as they are, so they no longer
  // fit and the completeness list says so. Returns how many changed.
  function remapRatings(project, map) {
    var n = 0, L = (map && map.likelihood) || {}, I = (map && map.impact) || {};
    function mv(obj, key, kind) {
      var v = obj[key], to = kind === "likelihood" ? L[v] : I[v];
      if (v && to && to !== v) { obj[key] = to; n++; }
    }
    function mvMap(m) { if (m && typeof m === "object") Object.keys(m).forEach(function (k) { mv(m, k, "impact"); }); }
    project.srs.highLevelAssets.forEach(function (a) { if (!a) return; mv(a, "consequence", "impact"); mv(a, "likelihood", "likelihood"); mvMap(a.consequenceByCategory); });
    project.zones.concat(project.conduits).forEach(function (o) {
      o.threats.forEach(function (t) {
        THREAT_RATING_WORDS.forEach(function (wd) { mv(t, wd[0], wd[1]); });
        mvMap(t.impactByCategory);
      });
    });
    M.consequencesOf(project).forEach(function (k) { mv(k, "impact", "impact"); mvMap(k.impactByCategory); });
    return n;
  }
  // The default move for each level, from one scale to another. A level is
  // the same only when both its id and its name match (the generic presets
  // reuse the ids L1, I1, ... with other words at each place); else the
  // level of the same name; else the one at the same relative place on the
  // new scale, rounded up, so no rating reads lower than it did. For a
  // preset (byPosition) every level goes by its place alone.
  function sameName(a, b) { return String(a.name || "").trim().toLowerCase() === String(b.name || "").trim().toLowerCase(); }
  function placeOn(i, from, to) {
    if (from <= 1 || to <= 1) return 0;
    var at = Math.ceil(i * (to - 1) / (from - 1) - 1e-9);
    return Math.max(0, Math.min(to - 1, at));
  }
  function defaultMapping(fromLevels, toLevels, byPosition) {
    var out = {};
    fromLevels.forEach(function (l, i) {
      if (!byPosition) {
        var same = toLevels.filter(function (x) { return x.id === l.id && sameName(x, l); })[0] ||
          toLevels.filter(function (x) { return sameName(x, l); })[0];
        if (same) { out[l.id] = same.id; return; }
      }
      out[l.id] = toLevels[placeOn(i, fromLevels.length, toLevels.length)].id;
    });
    return out;
  }
  // Recomputes each single impact that mirrors its categories (after the
  // categories or their levels moved). Only where every entry still fits: a
  // rating left on a level or category the criteria no longer have keeps the
  // single impact as it was, so Leave as it is never lowers it.
  function syncCategoryMirrors(project) {
    function sync(item, mapKey, impactKey) {
      var m = item[mapKey];
      if (!m || typeof m !== "object" || !categoryMapFits(m, project)) return;
      var w = worstCategoryLevel(m, project);
      if (w) item[impactKey] = w;
    }
    project.srs.highLevelAssets.forEach(function (a) { if (a) sync(a, "consequenceByCategory", "consequence"); });
    project.zones.concat(project.conduits).forEach(function (o) { o.threats.forEach(function (t) { sync(t, "impactByCategory", "impact"); }); });
    M.consequencesOf(project).forEach(function (k) { sync(k, "impactByCategory", "impact"); });
  }
  // How the deliverables name the criteria in use.
  // generic: the generic preset the criteria still are, unchanged ("" if none).
  function criteriaWords(project) {
    var src = M.criteriaOf(project).source, isHouse = M.criteriaOf(project).isHouse, generic = M.genericPresetOf(project);
    // The client's criteria marked in use but not entered: the tables are the house's.
    if (src === "client" && isHouse) return { source: "client-house", matrix: "the SolutionsPT house risk matrix", criteria: "The SolutionsPT house risk criteria", generic: "" };
    if (src === "client") return { source: "client", matrix: "the client's risk matrix", criteria: "The client's risk criteria", generic: generic };
    if (src === "project") return { source: "project", matrix: "the risk matrix agreed for this assessment", criteria: "The risk criteria agreed for this assessment", generic: generic };
    return { source: "house", matrix: "the SolutionsPT house risk matrix", criteria: "The SolutionsPT house risk criteria", generic: "" };
  }
  // The tolerable risk set per consequence category, in words, for the page
  // and Word: "Safety (injury / loss of life): Low; Financial loss: High", or "".
  function tolerableByCategoryWords(project) {
    return M.criteriaOf(project).categories.filter(function (c) { return c.tolerable; })
      .map(function (c) { return c.name + ": " + BAND_NAME[c.tolerable]; }).join("; ");
  }
  // The stored criteria's matrix has a cell that is not one of the four
  // bands (a file edited by hand, say): a rating there has no band.
  function matrixGaps(project) {
    var c = project && M.criteriaUsable(project.criteria) ? project.criteria : null;
    if (!c) return 0;
    var n = 0;
    c.impact.forEach(function (iv) { c.likelihood.forEach(function (lv) { var r = c.matrix[iv.id]; if (!r || BAND_RANK[r[lv.id]] == null) n++; }); });
    return n;
  }

  // Everything but the specification's own items and the approvals'.
  function baseItems(project) {
    var p = project, items = [];
    var vm = VM().build(p);
    function add(stage, doc, text, target) { items.push({ stage: stage, doc: doc, text: text, target: target || null }); }

    // The SUC, for both reports.
    if (!(p.suc.name || "").trim()) add("suc", "both", "The SUC has no name.", { kind: "suc" });
    if (!(p.suc.description || "").trim() && !(p.suc.scopeStatement || "").trim()) add("suc", "both", "The SUC has no description or scope statement.", { kind: "suc" });
    if (!M.tolerableConfirmed(p)) add("suc", "both", "Tolerable risk is not confirmed with the asset owner.", { kind: "criteria" });
    var cwp = criteriaWords(p);
    if (cwp.source === "client-house") add("suc", "both", "The client's risk criteria are marked in use, but step 1 still holds the house criteria.", { kind: "criteria" });
    else if (cwp.source === "client" && cwp.generic) add("suc", "both", "The client's criteria are marked in use, but step 1 holds a generic preset.", { kind: "criteria" });
    if (matrixGaps(p)) add("suc", "both", "The risk matrix has cells not set.", { kind: "criteria" });
    // Ratings that no longer fit the criteria (a level or category they no
    // longer have): each on the page it was rated on.
    var misfits = criteriaMisfits(p);
    misfits.forEach(function (f) {
      if (f.kind !== "system") return;
      var a = f.item;
      add("srs", "highLevel", a.id + (a.name ? " (" + a.name + ")" : "") + ": " + misfitText(f.misfits), { kind: "system", id: a.id });
    });

    // The high-level report: the ranking.
    var hlOnly = M.assessmentType(p) === "high-level";
    if (!p.srs.highLevelAssets.length) add("srs", "highLevel", "No systems ranked.", { kind: "ranking" });
    p.srs.highLevelAssets.forEach(function (a) {
      var label = a.id + (a.name ? " (" + a.name + ")" : "");
      var tgt = { kind: "system", id: a.id };
      if (!a.consequence) add("srs", "highLevel", label + ": impact not rated.", tgt);
      if (!hlOnly) return;
      var c = hlaComparison(a, p);
      if (c.open && c.suggested !== null) add("srs", "highLevel", label + ": the decision on a detailed assessment is not confirmed.", tgt);
      else if (c.open && a.consequence) add("srs", "highLevel", label + ": likelihood not rated, so there is nothing to compare with tolerable risk.", tgt);
      else if (c.reasonMissing) add("srs", "highLevel", label + reasonText(c), tgt);
    });

    // The detailed report.
    if (!p.zones.length) add("zones", "detailed", "No zones defined: the risk context gives the 3-3 tool nothing to scope. Define zones in step 3.", null);
    // The risk comparison: the SUC's initial risk, once, against tolerable risk.
    if ((p.zones.length || p.conduits.length) && !sucComparison(p).band) add("compare", "detailed", "The SUC has no initial risk to compare with tolerable risk: rate a ranked system, or enter a zone's initial risk.", { kind: "suc-compare" });
    // The separation rows the zones page raised and nobody has answered.
    p.zones.forEach(function (z) {
      separationRows(z, p).forEach(function (r) {
        var tgt = { kind: "zone", id: z.id, part: "sep-" + r.id };
        if (r.open) add("zones", "detailed", zoneLabel(z) + ": record whether " + lcFirst(r.label) + " are kept separate.", tgt);
        // Not separating business and control system assets departs from a
        // requirement of the standard, so its warning says so; the others are
        // recommendations.
        else if (r.reasonMissing && r.departure) add("zones", "detailed", zoneLabel(z) + ": " + lcFirst(r.label) + " are not kept separate, which the standard requires, with no justification.", tgt);
        else if (r.reasonMissing) add("zones", "detailed", zoneLabel(z) + ": " + lcFirst(r.label) + " are not kept separate, with no reason.", tgt);
      });
    });
    // A conduit with an end not chosen: the drawing and its characteristics
    // cannot say what it connects.
    p.conduits.forEach(function (c) {
      if (!c.fromZone || !c.toZone) add("zones", "detailed", zoneLabel(c) + ": " + (!c.fromZone && !c.toZone ? "neither end is set." : "an end is not set."), { kind: "conduit", id: c.id });
    });
    function checkOwner(row, label) {
      var o = row.o, isZone = row.isZone;
      var hasSLT = row.sltSet;
      var hasJust = !!(o.justification || "").trim();
      var own = { kind: isZone ? "zone" : "conduit", id: o.id };
      var D = depthOf(o, p), detailed = D.depth === "detailed";
      var atDepth = { kind: own.kind, id: o.id, part: "depth" };
      // Every zone and conduit is assessed, at the depth chosen; each depth
      // asks for what it rests on. A conduit assessed in detail often carries
      // no threat of its own and takes its SL-T from the zones it joins: its
      // written justification is then the basis.
      if (detailed && !o.threats.length && (isZone || !hasJust)) {
        add(hasSLT ? "slt" : "risk", "detailed", label + (hasSLT
          ? ": SL-T set with no threats. Give the basis in the justification."
          : ": no threats identified."), own);
      }
      if (D.depth === "grouped" && !D.lead) add("risk", "detailed", label + ": grouped, with no zone or conduit named to share threats with.", atDepth);
      else if (D.depth === "grouped" && !D.leadOk) add("risk", "detailed", label + ": grouped with " + D.withId + ", which is not assessed in detail.", atDepth);
      if (D.depth === "reused" && !D.reuseSource) add("risk", "detailed", label + ": reused, with no source named.", atDepth);
      if (D.depth === "proportionate" && !D.considered && !o.threats.length) add("risk", "detailed", label + ": proportionate, with no note of the threats considered.", atDepth);
      if (D.depth === "deferred" && !D.reason) add("risk", "detailed", label + ": deferred, with no reason.", atDepth);
      // A zone or conduit assessed in detail documents its known
      // vulnerabilities; the other depths rest on their record (it only warns).
      if (detailed && !(o.vulnerabilities || []).some(function (v) { return v && String(v.description || "").trim(); })) add("risk", "detailed", label + ": no vulnerabilities recorded.", { kind: own.kind, id: o.id, part: "vulns" });
      row.threats.forEach(function (x) {
        var t = x.t, T = x.treatment, tt = { kind: "threat", ownerId: o.id, id: t.id };
        if (!t.likelihood || !t.impact) add("risk", "detailed", label + " / " + t.id + ": likelihood or impact not set.", tt);
        misfits.forEach(function (f) { if (f.item === t) add("risk", "detailed", label + " / " + t.id + ": " + misfitText(f.misfits), tt); });
        if (!t.affectedFR.length) add("risk", "detailed", label + " / " + t.id + ": no affected foundational requirements marked.", tt);
        if (T.open) add("risk", "detailed", label + " / " + t.id + ": above tolerable risk with no treatment decision" + (T.state === "suggested" ? " (a suggestion is waiting to be confirmed)." : "."), tt);
        else if (T.gap) add("risk", "detailed", label + " / " + t.id + ": " + T.gap + ".", tt);
        // A path to a consequence says where it starts: a threat source and
        // an entry point (a threat that leads to none keeps the minimum above).
        if (t.consequenceId && M.consequenceById(p, t.consequenceId)) {
          var miss = [];
          if (!String(t.source || "").trim()) miss.push("threat source");
          if (!String(t.entryPoint || "").trim()) miss.push("entry point");
          if (miss.length) add("risk", "detailed", label + " / " + t.id + ": leads to " + t.consequenceId + " but has no " + miss.join(" or ") + ".", tt);
        }
      });
      // The justification is the deliverable, so flag it only where there is a
      // target to justify — a zone with no SL-T yet is 'incomplete', not
      // 'unjustified'. Neither blocks export (the ruling: never hard-gate).
      // Every zone and conduit needs an SL-T; a deferred one says so in its
      // own words.
      if (!hasSLT) add("slt", "detailed", label + (D.depth === "deferred" ? ": deferred, with no SL-T yet." : ": no SL-T set for any FR."), own);
      else if (!hasJust && (isZone || o.threats.length || !detailed)) add("slt", "detailed", label + ": SL-T set but no justification.", own);
    }
    vm.zones.forEach(function (row) { var z = row.o; checkOwner(row, z.id + (z.name ? " (" + z.name + ")" : "")); });
    vm.conduits.forEach(function (row) { var c = row.o; checkOwner(row, c.id + (c.name ? " (" + c.name + ")" : "")); });
    // Consequence first: a consequence no path leads to yet, and one whose
    // impact no longer fits the risk criteria.
    M.consequencesOf(p).forEach(function (k) {
      var kTitle = String(k.title || "").trim(), label = k.id + (kTitle ? " (" + kTitle + ")" : ""), tgt = { kind: "consequence", id: k.id };
      if (!kTitle) add("risk", "detailed", label + ": no title.", tgt);
      misfits.forEach(function (f) { if (f.item === k) add("risk", "detailed", label + ": " + misfitText(f.misfits), tgt); });
      if (!pathsTo(p, k.id).length) add("risk", "detailed", label + ": no threat scenario leads to it.", tgt);
    });
    return items;
  }

  function completeness(project) {
    var p = project, items = baseItems(p);
    function add(stage, doc, text, target) { items.push({ stage: stage, doc: doc, text: text, target: target || null }); }
    // The specification's blocks with no check of their own elsewhere.
    specBlocks(p, items).forEach(function (b) {
      if (!b.done && SPEC_GAPS[b.id]) add("spec", "detailed", "Requirements specification: " + (b.id === "threats" ? threatGap(p) : SPEC_GAPS[b.id]), { kind: "spec", id: b.id });
    });
    // A justification that names a threat or a countermeasure by its id: the
    // specification issued on its own lists neither, so the reader cannot
    // look them up. The specification's alone (doc null, spec: true).
    justificationIds(p).forEach(function (j) {
      items.push({ stage: "slt", doc: null, spec: true, target: { kind: "fromZone" in j.o ? "conduit" : "zone", id: j.o.id },
        text: j.o.id + (j.o.name ? " " + j.o.name : "") + ": the justification names " + j.ids.join(", ") + ", which the specification does not list." });
    });
    // Approval (step 7): for the detailed report once there are zones, for
    // the high-level report once there is a ranking.
    var states = approvalStates(p);
    var signDoc = docOf(p.zones.length > 0, p.srs.highLevelAssets.length > 0);
    var named = states.filter(function (s) { return (s.entry.name || "").trim(); });
    // The specification (phase 6b) is signed off with the detailed report.
    var signSpec = p.zones.length > 0;
    if (signDoc && !named.length) add("approval", signDoc, "No asset-owner sign-off recorded.", { kind: "approval" });
    else if (signDoc && !states.some(function (s) { return s.signed; })) named.forEach(function (s) {
      add("approval", signDoc, s.entry.name.trim() + ": approval not yet recorded.", { kind: "approval", id: String(s.index) });
    });
    if (signDoc) items.forEach(function (i) { if (i.stage === "approval" && signSpec) i.spec = true; });
    states.forEach(function (s) {
      if (!s.changed) return;
      var doc = docOf(approvalChangedFor(s, "detailed").length > 0, approvalChangedFor(s, "highLevel").length > 0) || "both";
      add("approval", doc, (s.entry.name || "Approver " + (s.index + 1)) + ": approved before " + approvalPartWords(s.parts, s.legacy, p) + " changed.", { kind: "approval", id: String(s.index) });
      if (approvalChangedFor(s, "spec").length) items[items.length - 1].spec = true;
    });
    // What the requirements specification prints (phase 6b): the SUC and
    // the risk criteria, the zones and conduits with their separations, its
    // own blocks and the SL-T with their justifications. Marked here, on the
    // one list, so its readiness reads the same items as the reports'.
    items.forEach(function (i) {
      if (i.stage === "zones" || i.stage === "spec" || i.stage === "slt" || (i.stage === "suc" && i.doc !== "highLevel")) i.spec = true;
    });
    return items;
  }
  // The zones and conduits whose justification names a threat or a
  // countermeasure of this project by its id: [{ o, ids }], the ids in the
  // order the text names them.
  function justificationIds(project) {
    var known = {};
    project.zones.concat(project.conduits).forEach(function (o) {
      (o.threats || []).forEach(function (t) { if (t && t.id) known[t.id] = true; });
      (o.countermeasures || []).forEach(function (m) { if (m && m.id) known[m.id] = true; });
    });
    // The mandatory countermeasures are listed in the specification, by id.
    mandatoryCountermeasures(project).forEach(function (e) { delete known[e.m.id]; });
    var out = [];
    project.zones.concat(project.conduits).forEach(function (o) {
      var ids = [];
      (String(o.justification || "").match(/\b[A-Z]+\d+\b/g) || []).forEach(function (w) { if (known[w] && ids.indexOf(w) < 0) ids.push(w); });
      if (ids.length) out.push({ o: o, ids: ids });
    });
    return out;
  }
  // The report an item concerns, from whether it concerns each.
  function docOf(detailed, highLevel) { return detailed && highLevel ? "both" : detailed ? "detailed" : highLevel ? "highLevel" : null; }

  // The items one report is checked against: its own and those for both.
  // "spec", the requirements specification (phase 6b): the items marked as
  // concerning what it prints.
  function readiness(project, doc) {
    if (doc === "spec") return completeness(project).filter(function (i) { return i.spec === true; });
    return completeness(project).filter(function (i) { return i.doc === doc || i.doc === "both"; });
  }
  function exportProblems(project) {
    return readiness(project, "detailed").map(function (i) { return i.text; });
  }

  // Each step's status for the nav and Home, from the completeness list:
  //   { state: "done" | "open" | "empty" | "na", open: n, text }
  // "empty" is a step with nothing entered yet; "na" a step a high-level-only
  // assessment does not need, while it is empty.
  function stepStatus(project) {
    var p = project, items = completeness(p), hlOnly = M.assessmentType(p) === "high-level";
    function n(stages, docs) { return items.filter(function (i) { return stages.indexOf(i.stage) >= 0 && (!docs || docs.indexOf(i.doc) >= 0); }).length; }
    function st(empty, open, na) {
      if (empty) return na ? { state: "na", open: 0, text: "Not needed" } : { state: "empty", open: 0, text: "Not started" };
      return open ? { state: "open", open: open, text: open + " open" } : { state: "done", open: 0, text: "Done" };
    }
    var s = p.suc, e = p.engagement || {}, b = p.basisOfAssessment;
    var owners = p.zones.concat(p.conduits);
    var noOwners = !owners.length;
    // A high-level-only assessment issues only the high-level report, so each
    // step counts only what that report needs.
    var docs = hlOnly ? ["highLevel", "both"] : null;
    var issueOpen = n(["suc", "srs", "zones", "compare", "risk", "slt", "spec", "approval", "review"], docs);
    var specEmpty = !specBlocks(p, items).some(function (x) { return x.id !== "tolerable" && x.id !== "suc" && x.has; });
    return {
      basis: st(!(e.client || e.consultant || e.assessmentDate || b.interviews.length || b.documents.length || b.observations.length), 0),
      suc: st(!(s.name || s.description || s.scopeStatement || s.assumptions.length), n(["suc"], docs)),
      srs: st(!p.srs.highLevelAssets.length, n(["srs"], docs)),
      zones: st(noOwners, n(["zones"], docs), hlOnly),
      compare: st(noOwners, n(["compare"], docs), hlOnly),
      risk: st(noOwners, n(["risk", "slt"], docs), hlOnly),
      spec: st(specEmpty, n(["spec"], docs), hlOnly),
      approval: st(!M.approvalsOf(p).length, n(["approval"], docs)),
      review: issueOpen ? { state: "open", open: issueOpen, text: issueOpen + " open" } : { state: "done", open: 0, text: "Ready" }
    };
  }

  // ---------- The risk-context file (spt-risk-context, for the 3-3 import) ----------

  function buildRiskContext(project) {
    var p = project, tolerable = tolerableOf(p);
    var vm = VM().build(p), ownerIds = {};
    p.zones.concat(p.conduits).forEach(function (o) { if (o && o.id) ownerIds[o.id] = true; });
    // residualRisk is the planned rating, else the current one (schema 0.3:
    // the residual pair means after planned measures; the view model's
    // residualRisk), with the pair it was worked out from: a side not given
    // takes the rating before it, as the rating itself does.
    function mapThreats(row) { return row.threats.map(function (x) {
      var t = x.t, planned = x.planned != null, current = x.current != null;
      var L = planned ? (t.residualLikelihood || t.currentLikelihood || t.likelihood) : current ? (t.currentLikelihood || t.likelihood) : null;
      var I = planned ? (t.residualImpact || t.currentImpact || t.impact) : current ? (t.currentImpact || t.impact) : null;
      var out = { id: t.id, statement: t.statement, source: t.source, affectedFR: t.affectedFR.slice(), likelihood: t.likelihood, impact: t.impact, unmitigatedRisk: x.risk,
        residualLikelihood: L || null, residualImpact: I || null,
        residualRisk: x.residualRisk, exceedsTolerable: x.exceeds, disposition: contextDisposition(x.disposition), acceptance: t.acceptance || "" };
      // A transfer (provenance only, on the same 1.4 string): disposition is
      // written as accepted, the legacy value v0.7 reads, and acceptance holds
      // how it is transferred; the decision and to whom are written beside
      // them, only for a transfer that is complete.
      if (x.disposition === "transferred") { out.decision = "transfer"; out.transferTo = String(t.transferTo || "").trim(); }
      // Consequence first (provenance only): the consequence the threat is a
      // path to and the zones and conduits it passes through, when recorded.
      if (t.consequenceId && M.consequenceById(p, t.consequenceId)) out.consequenceId = t.consequenceId;
      // A via names only zones and conduits still in the project.
      var via = M.viaOf(t).filter(function (id) { return ownerIds[id]; });
      if (via.length) out.via = via;
      return out;
    }); }
    function vecFrom(sug) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = sug.byFR[fr].sl; }); return o; }
    function tgtVec(owner) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = owner.slTargetByFR[fr] != null ? owner.slTargetByFR[fr] : null; }); return o; }
    // The consultant's own SL-T only: null when none is set, never the
    // tool's suggestion standing in for a decision that was not made.
    function scalar(tgt) { var m = maxDefined(tgt); return m != null ? m : null; }
    // Provenance added on the same 1.4 string (additive, context only): each
    // field is written only when it holds something, so a file from before
    // phase 6 and one with nothing recorded read the same.
    function filled(v) { return typeof v === "string" && v.trim() !== ""; }
    function pickText(src, keys, out) { keys.forEach(function (k) { if (filled(src[k])) out[k] = src[k].trim(); }); return out; }
    // How the zone or conduit was assessed (its depth, with what it rests
    // on where recorded), and the initial risk the house method compared.
    // The per-zone decision an older build recorded (riskComparison) is no
    // longer written: every zone and conduit is assessed, at the depth given.
    function addComparison(out, owner) {
      var c = comparison(owner, p), d = depthOf(owner, p), a = { depth: d.depth };
      ["withId", "reuseSource", "considered", "reason"].forEach(function (k) { if (d[k]) a[k] = d[k]; });
      out.assessment = a;
      if (c.initial) out.initialRisk = { risk: c.initial, source: c.source };
      return out;
    }
    // name and type exactly as before; the register's own attributes when set.
    function mapAsset(a) {
      var o = {};
      if (filled(a.id)) o.id = a.id;
      o.name = a.name; o.type = a.type;
      pickText(a, ["tag", "vendor", "model", "version"], o);
      if (M.ASSET_CRITICALITY.indexOf(a.criticality) >= 0) o.criticality = a.criticality;
      return o;
    }
    // Every recorded approval, in order; an entry not approved is not stated.
    var approvals = M.approvalsOf(p).filter(function (e) { return e.approved === true; })
      .map(function (e) { return pickText(e, ["name", "role", "organisation", "date", "scope"], {}); });

    var ctx = {
      schema: M.INTERCHANGE.schema,
      generatedBy: M.TOOL_ID,
      generatedOn: todayISO(),
      suc: { name: p.suc.name, description: p.suc.description, scopeStatement: p.suc.scopeStatement },
      securityRequirements: {
        tolerableRisk: tolerable,
        knownThreats: p.srs.knownThreats.slice(),
        mandatorySecurityFunctions: p.srs.mandatorySecurityFunctions.slice(),
        regulatory: p.srs.regulatory.slice()
      },
      highLevelAssets: p.srs.highLevelAssets.map(function (a) { return { id: a.id, name: a.name, functionLocation: a.functionLocation, consequence: a.consequence, likelihood: a.likelihood, risk: riskFor(a.consequence, a.likelihood, p), note: a.note }; }),
      basisOfAssessment: {
        interviews: p.basisOfAssessment.interviews.map(function (x) { return { id: x.id, name: x.name, role: x.role, date: x.date, notes: x.notes }; }),
        documents: p.basisOfAssessment.documents.map(function (x) { return { id: x.id, title: x.title, reference: x.reference, source: x.source, relevance: x.relevance }; }),
        observations: p.basisOfAssessment.observations.map(function (x) { return { id: x.id, description: x.description, location: x.location, date: x.date, notes: x.notes }; })
      },
      assumptions: p.suc.assumptions.slice().concat(p.srs.clientMatrix ? ["Client risk matrix used" + (p.srs.clientMatrixNote ? ": " + p.srs.clientMatrixNote : "")] : []),
      approval: { name: p.approval.name, role: p.approval.role, date: p.approval.date, statement: p.approval.statement, approved: !!p.approval.approved },
      zones: vm.zones.map(function (row) {
        var z = row.o, s = suggestZone(z, p), tgt = tgtVec(z);
        return addComparison({
          id: z.id, name: z.name, safetyRelated: s.safetyRelated,
          fromHighLevelAsset: z.fromHLA || null,
          slSuggestedByFR: vecFrom(s), slTargetByFR: tgt, slTarget: scalar(tgt),
          worstUnmitigatedRisk: s.worstRisk,
          justification: z.justification,
          assets: z.assets.map(mapAsset),
          accessPoints: z.accessPoints.slice(), externalDependencies: z.externalDependencies.slice(), securityPolicies: z.securityPolicies.slice(),
          threats: mapThreats(row),
          vulnerabilities: z.vulnerabilities.map(function (v) { return { id: v.id, description: v.description }; }),
          countermeasures: z.countermeasures.map(function (m) { return { id: m.id, description: m.description, addressesFR: m.addressesFR.slice(), reference: m.reference, existing: !!m.existing }; })
        }, z);
      }),
      conduits: vm.conduits.map(function (row) {
        var c = row.o, s = suggestConduit(c, p), tgt = tgtVec(c);
        return addComparison({
          id: c.id, fromZone: c.fromZone, toZone: c.toZone, name: c.name, channels: c.channels.slice(),
          slSuggestedByFR: vecFrom(s), slTargetByFR: tgt, slTarget: scalar(tgt),
          justification: c.justification,
          threats: mapThreats(row),
          vulnerabilities: c.vulnerabilities.map(function (v) { return { id: v.id, description: v.description }; }),
          countermeasures: c.countermeasures.map(function (m) { return { id: m.id, description: m.description, addressesFR: m.addressesFR.slice(), reference: m.reference, existing: !!m.existing }; })
        }, c);
      })
    };
    // Beside the single approval mirror, which stays as it was.
    if (approvals.length) {
      var ordered = {};
      Object.keys(ctx).forEach(function (k) { ordered[k] = ctx[k]; if (k === "approval") ordered.approvals = approvals; });
      ctx = ordered;
    }
    // The consequences the threats lead to (provenance only), when any.
    var ks = M.consequencesOf(p);
    if (ks.length) ctx.consequences = ks.map(function (k) { return { id: k.id, title: k.title || "", impact: k.impact || null }; });
    return ctx;
  }

  return {
    todayISO: todayISO, setToday: setToday, todayPinned: todayPinned, tolerableOf: tolerableOf, findZone: findZone,
    riskFor: riskFor, threatRisk: threatRisk, exceedsTolerable: exceedsTolerable,
    residualRisk: residualRisk, currentRisk: currentRisk, operativeRisk: operativeRisk, worstResidualOf: worstResidualOf, worstRiskOf: worstRiskOf,
    coveringCountermeasures: coveringCountermeasures, linkedCountermeasures: linkedCountermeasures,
    suggestLinks: suggestLinks, linkSuggestions: linkSuggestions, confirmLinkSuggestions: confirmLinkSuggestions,
    threatAssets: threatAssets, vecWords: vecWords,
    suggestTreatment: suggestTreatment, sltShortfall: sltShortfall,
    TREATMENT_LABEL: TREATMENT_LABEL, threatTreatment: threatTreatment, threatDisposition: threatDisposition,
    contextDisposition: contextDisposition, hasTransfer: hasTransfer, orList: orList,
    assetTypeLabel: assetTypeLabel, assetLinkLabel: assetLinkLabel, flagLabel: flagLabel, scaleName: scaleName,
    conduitExternal: conduitExternal, conduitsOf: conduitsOf, separationRows: separationRows,
    assetTypeFrom: assetTypeFrom, assetLinkFrom: assetLinkFrom, parseAssets: parseAssets,
    SPEC_TITLES: SPEC_TITLES, specBlocks: specBlocks, mandatoryCountermeasures: mandatoryCountermeasures,
    approvalBasis: approvalBasis, approvalFingerprint: approvalFingerprint, approvalStates: approvalStates,
    APPROVAL_DOC_PARTS: APPROVAL_DOC_PARTS, approvalChangedFor: approvalChangedFor, approvalPartWords: approvalPartWords,
    likelihoodName: likelihoodName, impactName: impactName, zoneSafety: zoneSafety,
    categoryRatings: categoryRatings, worstCategoryLevel: worstCategoryLevel, setCategoryRating: setCategoryRating,
    aboveTolerable: aboveTolerable, hlaExceeds: hlaExceeds, criteriaMisfits: criteriaMisfits,
    ratingUsage: ratingUsage, remapRatings: remapRatings, defaultMapping: defaultMapping, syncCategoryMirrors: syncCategoryMirrors,
    categoryMapFits: categoryMapFits, matrixGaps: matrixGaps, tolerableByCategoryWords: tolerableByCategoryWords,
    criteriaWords: criteriaWords, criteriaOf: M.criteriaOf,
    suggestZone: suggestZone, suggestConduit: suggestConduit, sltDrivers: sltDrivers, safetyFloorWords: safetyFloorWords,
    pathsThrough: pathsThrough, pathsTo: pathsTo, pathWords: pathWords, pathImpactVs: pathImpactVs, steppingStones: steppingStones, andList: andList,
    maxDefined: maxDefined, frSug: frSug, vecStr: vecStr,
    CONDUIT_RULE: CONDUIT_RULE, isBand: isBand, worstBand: worstBand, hlaById: hlaById, hlaRisk: hlaRisk, zonesOfHLA: zonesOfHLA,
    initialRiskOf: initialRiskOf, comparison: comparison, hlaComparison: hlaComparison,
    sucComparison: sucComparison, depthOf: depthOf, depthSuggestion: depthSuggestion, groupLeads: groupLeads, groupedWith: groupedWith,
    depthWords: depthWords, depthBasis: depthBasis, ownerById: ownerById,
    completeness: completeness, readiness: readiness, stepStatus: stepStatus,
    exportProblems: exportProblems, buildRiskContext: buildRiskContext
  };
}());
