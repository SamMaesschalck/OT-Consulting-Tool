/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* engine.js — the risk maths, read from the rules file (no thresholds here).
 *
 * The house matrix, tolerable risk, residual risk, the one coverage rule
 * (a countermeasure on a requirement the threat affects), the treatment
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
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // The project's tolerable risk, or the house default when none is set.
  function tolerableOf(project) { return project.srs.tolerableRisk || RULES.tolerableRisk.default; }

  function findZone(project, id) { for (var i = 0; i < project.zones.length; i++) if (project.zones[i].id === id) return project.zones[i]; return null; }

  function riskFor(impact, likelihood) {
    if (!impact || !likelihood) return null;
    var row = RULES.riskMatrix[impact];
    return (row && row[likelihood]) || null;
  }
  function threatRisk(t) { return riskFor(t.impact, t.likelihood); }
  function exceedsTolerable(band, tolerable) { return band ? (BAND_RANK[band] > BAND_RANK[tolerable]) : false; }

  // Residual risk: the risk remaining with countermeasures in place. Exists only
  // once the consultant has entered a residual likelihood and/or impact
  // (either alone falls back to the unmitigated value for the other); a
  // first-pass or immature assessment leaves both blank and the unmitigated
  // risk stands.
  function residualRisk(t) {
    if (!t.residualLikelihood && !t.residualImpact) return null;
    return riskFor(t.residualImpact || t.impact, t.residualLikelihood || t.likelihood);
  }
  // Worst operative risk across a set of threats: residual where recorded,
  // otherwise unmitigated. Used to keep the report from reading as alarmist
  // when controls are already in place.
  function worstResidualOf(items) {
    var worst = null;
    items.forEach(function (t) { var r = residualRisk(t) || threatRisk(t); if (r && (worst == null || BAND_RANK[r] > BAND_RANK[worst])) worst = r; });
    return worst;
  }
  function worstRiskOf(items) {
    var worst = null;
    items.forEach(function (t) { var r = threatRisk(t); if (r && (worst == null || BAND_RANK[r] > BAND_RANK[worst])) worst = r; });
    return worst;
  }

  // The one coverage rule: countermeasures recorded against a requirement the
  // threat affects.
  function coveringCountermeasures(owner, t) {
    return owner.countermeasures.filter(function (m) {
      return (m.description || "").trim() && m.addressesFR.some(function (fr) { return t.affectedFR.indexOf(fr) >= 0; });
    });
  }

  // What the build before recorded decisions inferred for a threat above
  // tolerable risk. Only ever a suggestion: an untagged countermeasure or an
  // SL-T proves nothing about this threat until the consultant says so.
  function suggestTreatment(owner, t, tolerable) {
    if (!exceedsTolerable(threatRisk(t), tolerable)) return null;
    var resid = residualRisk(t);
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
    sltUnset: "Treat through the SL-T programme (no SL-T set)",
    sltNoReason: "Treat through the SL-T programme (no reason recorded)",
    accept: "Risk accepted",
    slt: "Treated through the SL-T programme"
  };

  // The single source for a threat's treatment state. The screen, the
  // completeness list, Word, Excel, the review pack and the risk context all
  // read this (through js/view-model.js) and nothing else. Returns:
  //   required        the unmitigated risk is above tolerable risk
  //   state           "within" | "none" | "suggested" | "confirmed"
  //   decision        "reduce" | "accept" | "slt" | null (null when not required)
  //   confirmed       the consultant has recorded the decision
  //   open            required, and no confirmed decision
  //   complete        confirmed, and nothing the decision rests on is missing
  //   reason          the reason this decision carries: the acceptance text for
  //                   "accept", the SL-T reason for "slt", none for "reduce"
  //   reasonNeeded    this decision needs a reason; reasonMissing: it has none
  //   covering        countermeasures on a requirement the threat affects
  //   covered         covering is not empty
  //   residual        residual risk band or null; residualWithin: it is tolerable
  //   sltUnset        for "slt", affected requirements with no SL-T set
  //   sltBelow        for "slt", affected requirements set below the suggestion
  //   sltShortfall    the two together
  //   gap             what a confirmed decision still lacks, in plain words, or ""
  //   disposition     the risk-context value: mitigated | countermeasure | accepted | sl-t,
  //                   or null until the decision is complete
  //   label           the state in plain words, as the deliverables print it
  // A decision with a gap is never stated as a treatment: its label says what
  // is missing and its disposition is null, so the report, the workbook, the
  // risk context and the review pack cannot print it as fact. "Reduced to
  // within tolerable risk" needs a tolerable residual rating and a covering
  // countermeasure already in place; with only planned ones the threat is
  // still "reduce with countermeasures".
  function threatTreatment(owner, t, project) {
    var tolerable = tolerableOf(project);
    var tr = t.treatment || {};
    var required = exceedsTolerable(threatRisk(t), tolerable);
    var decision = required && TREATMENT_DECISIONS.indexOf(tr.decision) >= 0 ? tr.decision : null;
    var confirmed = !!(decision && tr.confirmed);
    var resid = residualRisk(t);
    var residualWithin = resid != null && !exceedsTolerable(resid, tolerable);
    var covering = coveringCountermeasures(owner, t);
    var inPlace = covering.some(function (m) { return !!m.existing; });
    var sf = decision === "slt" ? sltShortfall(owner, t, project) : { unset: [], below: [] };
    var shortfall = sf.unset.concat(sf.below);
    var reason = String((decision === "accept" ? t.acceptance : decision === "slt" ? tr.reason : "") || "").trim();
    var reasonNeeded = decision === "accept" || (decision === "slt" && shortfall.length > 0);
    var reasonMissing = reasonNeeded && !reason;
    var gap = "", label = TREATMENT_LABEL.within, disposition = null;
    if (required && !confirmed) label = TREATMENT_LABEL.none;
    else if (decision === "reduce") {
      if (!covering.length) { gap = "no countermeasure addresses a requirement it affects"; label = TREATMENT_LABEL.reduceNone; }
      else if (residualWithin && inPlace) { label = TREATMENT_LABEL.reduced; disposition = "mitigated"; }
      else { label = TREATMENT_LABEL.reduce; disposition = "countermeasure"; }
    } else if (decision === "accept") {
      if (reasonMissing) { gap = "accepted with no reason recorded"; label = TREATMENT_LABEL.acceptNoReason; }
      else { label = TREATMENT_LABEL.accept; disposition = "accepted"; }
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
      residual: resid, residualWithin: residualWithin,
      sltUnset: sf.unset, sltBelow: sf.below, sltShortfall: shortfall, gap: gap,
      disposition: disposition,
      label: label
    };
  }
  // The risk-context value alone: null until a decision is complete.
  function threatDisposition(owner, t, project) { return threatTreatment(owner, t, project).disposition; }

  // Names for stored ids, so no deliverable prints the id itself.
  var ASSET_TYPE_LABEL = { "plc": "PLC", "safety-plc": "Safety PLC", "hmi": "HMI", "historian": "Historian", "engineering-workstation": "Engineering workstation", "server": "Server", "network": "Network device", "business": "Business system", "other": "Other" };
  var ASSET_LINK_LABEL = { "wireless": "wireless", "temporary": "temporarily connected" };
  function assetLinkLabel(id) { return ASSET_LINK_LABEL[id] || ""; }
  var FLAG_LABEL = { "sis-present": "safety instrumented system present", "remote-access": "remote access", "internet-adjacent": "internet adjacent", "wireless": "wireless links", "removable-media": "removable media", "many-conduits": "many conduits" };
  function plainId(id) { return String(id || "").replace(/-/g, " "); }
  function assetTypeLabel(id) { return ASSET_TYPE_LABEL[id] || plainId(id); }
  function flagLabel(id) { return FLAG_LABEL[id] || plainId(id); }
  function scaleName(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i].name; return id ? plainId(id).charAt(0).toUpperCase() + plainId(id).slice(1) : ""; }
  function likelihoodName(id) { return scaleName(LIK, id); }
  function impactName(id) { return scaleName(SEV, id); }
  function zoneSafety(zone) { return !!zone.flags["sis-present"] || zone.assets.some(function (a) { return a.type === "safety-plc"; }); }

  // Per-foundational-requirement suggestion for a zone.
  // Returns { byFR: {fr: {sl, risk, trace[]}}, safetyRelated, worstRisk }.
  function suggestZone(zone, project) {
    var tolerable = tolerableOf(project);
    var safety = zoneSafety(zone);
    var adv = project.srs.adversaryClass;
    var result = { byFR: {}, safetyRelated: safety, worstRisk: worstRiskOf(zone.threats) };

    FR_IDS.forEach(function (fr) {
      var trace = [];
      var maxBand = null, contributing = 0;
      zone.threats.forEach(function (t) {
        if (t.affectedFR && t.affectedFR.indexOf(fr) >= 0) {
          var r = threatRisk(t);
          if (r) { contributing++; if (maxBand == null || BAND_RANK[r] > BAND_RANK[maxBand]) maxBand = r; }
        }
      });

      var sl = null;
      if (maxBand) {
        var m = RULES.riskToSL[maxBand];
        sl = m.suggest;
        trace.push("Unmitigated risk " + BAND_NAME[maxBand].toLowerCase() + " for " + fr + " (from " + contributing + " threat" + (contributing === 1 ? "" : "s") + "): " + m.trace);
        if (maxBand === "very-high" && m.escalateTo) trace.push("Escalation to SL" + m.escalateTo + " available for " + fr + " only if a nation-state-grade adversary is in scope.");
        if (exceedsTolerable(maxBand, tolerable)) trace.push("This risk is above tolerable risk (" + BAND_NAME[tolerable].toLowerCase() + "), so each threat behind it needs a treatment decision.");
      } else {
        trace.push("No threats affecting " + fr + " captured yet.");
      }

      MODS.forEach(function (mod) {
        if (zone.flags[mod.id] && mod.affectsFR && mod.affectsFR.indexOf(fr) >= 0) {
          trace.push(cap(mod.effect) + " from " + mod.id + " (" + mod.label + "): " + mod.trace);
        }
      });

      if (safety) {
        var floor = SIS_RULE ? SIS_RULE.floorSL : 3;
        if (sl == null || sl < floor) { sl = floor; trace.push("SL" + floor + " floor applied (SIS present): " + SIS_RULE.trace); }
        else trace.push("SIS present: SL" + floor + " floor already met.");
      }

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
  function suggestConduit(cond, project) {
    var ends = ["fromZone", "toZone"].map(function (k) { var z = findZone(project, cond[k]); return z ? { id: cond[k], sug: suggestZone(z, project), name: z.name } : (cond[k] === "EXT" ? { id: "EXT", sug: null, name: "external" } : null); });
    var result = { byFR: {}, worstRisk: worstRiskOf(cond.threats) };

    FR_IDS.forEach(function (fr) {
      var trace = ["House heuristic: a conduit takes the higher of its own risk-derived SL and the connected zones' suggested SL, per FR."];
      var sl = null, band = null;
      cond.threats.forEach(function (t) {
        if (t.affectedFR.indexOf(fr) >= 0) { var r = threatRisk(t); if (r && (band == null || BAND_RANK[r] > BAND_RANK[band])) band = r; }
      });
      if (band) { var m = RULES.riskToSL[band]; sl = m.suggest; trace.push("Conduit's own unmitigated risk " + BAND_NAME[band].toLowerCase() + " for " + fr + ": " + m.trace); }
      ends.forEach(function (e) {
        if (e && e.sug && e.sug.byFR[fr] && e.sug.byFR[fr].sl != null) {
          if (sl == null || e.sug.byFR[fr].sl > sl) sl = e.sug.byFR[fr].sl;
          trace.push("Inherits SL" + e.sug.byFR[fr].sl + " for " + fr + " from " + e.id + (e.name ? " (" + e.name + ")" : "") + ".");
        } else if (e && e.id === "EXT") {
          trace.push("EXT endpoint: external party (the conduit boundary is the protection point).");
        }
      });
      if (sl == null) trace.push("No threats or connected-zone suggestion for " + fr + " yet.");
      result.byFR[fr] = { sl: sl, risk: band, trace: trace };
    });
    return result;
  }

  function maxDefined(obj) { var best = null; Object.keys(obj).forEach(function (k) { if (typeof obj[k] === "number" && (best == null || obj[k] > best)) best = obj[k]; }); return best; }
  function frSug(sug) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = sug.byFR[fr].sl; }); return o; }
  function vecStr(vec) { return FR_IDS.map(function (fr) { return vec[fr] != null ? vec[fr] : "-"; }).join("/"); }

  function VM() { return window.RiskApp.ViewModel; }

  // ---------- Risk comparison (step 4) ----------
  //
  // Initial risk set against tolerable risk, and the decision whether a
  // detailed assessment is needed. Comparing per zone and per conduit is the
  // method this tool uses, not a reading of the standard's words. A zone's
  // initial risk is the worst of its assigned ranked systems, or entered
  // directly when it has none. A conduit's follows the house rule below
  // unless one is entered. The decision ({ required, reason }) is the
  // consultant's: the comparison only suggests it, and a decision that
  // differs from the suggestion needs a reason.

  var CONDUIT_RULE = "a conduit takes the higher initial risk of the zones it joins unless one is entered (house rule)";
  function isBand(v) { return typeof v === "string" && BAND_RANK[v] != null; }
  function worstBand(list) {
    var worst = null;
    list.forEach(function (b) { if (isBand(b) && (worst == null || BAND_RANK[b] > BAND_RANK[worst])) worst = b; });
    return worst;
  }
  function hlaById(project, id) { var l = project.srs.highLevelAssets; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return l[i]; return null; }
  function hlaRisk(a) { return a ? riskFor(a.consequence, a.likelihood) : null; }
  // The zones a ranked system is assigned to.
  function zonesOfHLA(project, id) { return project.zones.filter(function (z) { return M.hlaIdsOf(z).indexOf(id) >= 0; }); }

  // { band, source: "systems" | "entered" | "zones" | null, systems, zones, ruleBand }
  // A zone whose assigned systems carry no rating (impact with no likelihood)
  // falls back to the initial risk entered for it.
  function initialRiskOf(owner, project) {
    var entered = isBand(owner.initialRisk) ? owner.initialRisk : null;
    if (!("fromZone" in owner)) {
      var systems = M.hlaIdsOf(owner).map(function (id) { return hlaById(project, id); }).filter(Boolean);
      var sysBand = worstBand(systems.map(hlaRisk));
      if (sysBand) return { band: sysBand, source: "systems", systems: systems, zones: [], ruleBand: null };
      if (entered) return { band: entered, source: "entered", systems: systems, zones: [], ruleBand: null };
      return { band: null, source: systems.length ? "systems" : null, systems: systems, zones: [], ruleBand: null };
    }
    var ends = [owner.fromZone, owner.toZone].map(function (id) { return id && id !== "EXT" ? findZone(project, id) : null; }).filter(Boolean);
    var ruleBand = worstBand(ends.map(function (z) { return initialRiskOf(z, project).band; }));
    if (entered) return { band: entered, source: "entered", systems: [], zones: ends, ruleBand: ruleBand };
    return { band: ruleBand, source: ruleBand ? "zones" : null, systems: [], zones: ends, ruleBand: ruleBand };
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
  function decisionState(d, band, tolerable) {
    d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
    var suggested = band ? exceedsTolerable(band, tolerable) : null;
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
    var out = decisionState(owner.detailed, ir.band, tolerableOf(project));
    out.source = ir.source; out.systems = ir.systems; out.zones = ir.zones; out.ruleBand = ir.ruleBand;
    return out;
  }
  // On a high-level-only assessment the decision sits on the ranked system.
  function hlaComparison(a, project) {
    var out = decisionState(a.detailed, hlaRisk(a), tolerableOf(project));
    out.source = out.initial ? "rating" : null;
    return out;
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
      out.push({ id: r.id, label: r.label, why: why[r.id], answer: answer, reason: reason,
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
  function specOrder() {
    var m = (M.ZCR && M.ZCR.specBlocks) || {};
    var ids = Object.keys(m).filter(function (k) { return k.charAt(0) !== "_"; });
    return ids.length ? ids : Object.keys(SPEC_TITLES);
  }
  // [{ id, title, zcr, done, stage, has }]; has: anything captured for it.
  function specBlocks(project, items) {
    var p = project, s = p.suc, r = p.srs;
    items = items || baseItems(p);
    function anyZone(k) { return p.zones.some(function (z) { return M.listOf(z[k]).length > 0; }); }
    var st = {
      suc: { done: !!(s.name || "").trim() && !!((s.description || "").trim() || (s.scopeStatement || "").trim()), has: !!(s.name || s.description || s.scopeStatement), stage: "suc" },
      drawings: { done: p.zones.length > 0 && p.conduits.every(function (c) { return c.fromZone && c.toZone; }), has: p.zones.length > 0, stage: "zones" },
      characteristics: { done: p.zones.length > 0 && !items.some(function (i) { return i.stage === "zones"; }), has: p.zones.length > 0, stage: "zones" },
      assumptions: { done: s.assumptions.length > 0 || anyZone("assumptions"), stage: "suc" },
      threats: { done: !!r.adversaryClass || r.knownThreats.length > 0, stage: "srs" },
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
  var APPROVAL_PART_WORDS = { tolerable: "the tolerable risk", ranking: "the ranking", slt: "the SL-T", accepted: "the accepted risks" };
  var APPROVAL_DOC_PARTS = { detailed: ["tolerable", "slt", "accepted"], highLevel: ["tolerable", "ranking"] };
  function approvalBasis(project) {
    var vm = VM().build(project), hlOnly = M.assessmentType(project) === "high-level";
    return {
      tolerable: tolerableOf(project),
      ranking: project.srs.highLevelAssets.map(function (a) {
        var d = hlOnly ? hlaComparison(a, project).required : null;
        return a.id + ":" + (a.consequence || "-") + "/" + (a.likelihood || "-") + (hlOnly ? "/" + (d === true ? "required" : d === false ? "not-required" : "-") : "");
      }),
      slt: vm.owners.map(function (row) { return row.o.id + ":" + FR_IDS.map(function (fr) { var v = row.o.slTargetByFR[fr]; return v == null ? "-" : v; }).join(""); }),
      accepted: vm.threats.filter(function (x) { return x.disposition === "accepted"; }).map(function (x) { return x.owner.id + "/" + x.t.id + ":" + (x.treatment.reason || ""); })
    };
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
  function approvalPartWords(parts, or) {
    var w = parts.map(function (k) { return APPROVAL_PART_WORDS[k]; });
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

  // Everything but the specification's own items and the approvals'.
  function baseItems(project) {
    var p = project, items = [];
    var vm = VM().build(p);
    function add(stage, doc, text, target) { items.push({ stage: stage, doc: doc, text: text, target: target || null }); }

    // The SUC, for both reports.
    if (!(p.suc.name || "").trim()) add("suc", "both", "The SUC has no name.", { kind: "suc" });
    if (!(p.suc.description || "").trim() && !(p.suc.scopeStatement || "").trim()) add("suc", "both", "The SUC has no description or scope statement.", { kind: "suc" });
    if (!M.tolerableConfirmed(p)) add("suc", "both", "Tolerable risk is not confirmed with the asset owner.", { kind: "criteria" });

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
    // The separation rows the zones page raised and nobody has answered.
    p.zones.forEach(function (z) {
      separationRows(z, p).forEach(function (r) {
        var tgt = { kind: "zone", id: z.id, part: "sep-" + r.id };
        if (r.open) add("zones", "detailed", zoneLabel(z) + ": record whether " + lcFirst(r.label) + " are kept separate.", tgt);
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
      var cmp = comparison(o, p);
      if (cmp.open) add("compare", "detailed", label + (cmp.suggested === null ? ": no initial risk to compare with tolerable risk." : ": the risk comparison's decision is not confirmed."), own);
      else if (cmp.reasonMissing) add("compare", "detailed", label + reasonText(cmp), own);
      // A conduit often carries no threat of its own and takes its SL-T from
      // the zones it joins: its written justification is then the basis. A
      // zone or conduit the comparison found needs no detailed assessment is
      // asked for no threats: its SL-T is set by hand, with its basis in the
      // justification.
      if (!o.threats.length && (isZone || !hasJust) && !cmp.skip) {
        add(hasSLT ? "slt" : "risk", "detailed", label + (hasSLT
          ? ": SL-T set with no threats. Give the basis in the justification."
          : ": no threats identified."), own);
      }
      row.threats.forEach(function (x) {
        var t = x.t, T = x.treatment, tt = { kind: "threat", ownerId: o.id, id: t.id };
        if (!t.likelihood || !t.impact) add("risk", "detailed", label + " / " + t.id + ": likelihood or impact not set.", tt);
        if (!t.affectedFR.length) add("risk", "detailed", label + " / " + t.id + ": no affected foundational requirements marked.", tt);
        if (T.open) add("risk", "detailed", label + " / " + t.id + ": above tolerable risk with no treatment decision" + (T.state === "suggested" ? " (a suggestion is waiting to be confirmed)." : "."), tt);
        else if (T.gap) add("risk", "detailed", label + " / " + t.id + ": " + T.gap + ".", tt);
      });
      // The justification is the deliverable, so flag it only where there is a
      // target to justify — a zone with no SL-T yet is 'incomplete', not
      // 'unjustified'. Neither blocks export (the ruling: never hard-gate).
      if (!hasSLT) add("slt", "detailed", label + ": no SL-T set for any FR.", own);
      else if (!hasJust && (isZone || o.threats.length || cmp.skip)) add("slt", "detailed", label + ": SL-T set but no justification.", own);
    }
    vm.zones.forEach(function (row) { var z = row.o; checkOwner(row, z.id + (z.name ? " (" + z.name + ")" : "")); });
    vm.conduits.forEach(function (row) { var c = row.o; checkOwner(row, c.id + (c.name ? " (" + c.name + ")" : "")); });
    return items;
  }

  function completeness(project) {
    var p = project, items = baseItems(p);
    function add(stage, doc, text, target) { items.push({ stage: stage, doc: doc, text: text, target: target || null }); }
    // The specification's blocks with no check of their own elsewhere.
    specBlocks(p, items).forEach(function (b) {
      if (!b.done && SPEC_GAPS[b.id]) add("spec", "detailed", "Requirements specification: " + SPEC_GAPS[b.id], { kind: "spec", id: b.id });
    });
    // Approval (step 7): for the detailed report once there are zones, for
    // the high-level report once there is a ranking.
    var states = approvalStates(p);
    var signDoc = docOf(p.zones.length > 0, p.srs.highLevelAssets.length > 0);
    var named = states.filter(function (s) { return (s.entry.name || "").trim(); });
    if (signDoc && !named.length) add("approval", signDoc, "No asset-owner sign-off recorded.", { kind: "approval" });
    else if (signDoc && !states.some(function (s) { return s.signed; })) named.forEach(function (s) {
      add("approval", signDoc, s.entry.name.trim() + ": approval not yet recorded.", { kind: "approval", id: String(s.index) });
    });
    states.forEach(function (s) {
      if (!s.changed) return;
      var doc = docOf(approvalChangedFor(s, "detailed").length > 0, approvalChangedFor(s, "highLevel").length > 0) || "both";
      add("approval", doc, (s.entry.name || "Approver " + (s.index + 1)) + ": approved before " + approvalPartWords(s.parts, s.legacy) + " changed.", { kind: "approval", id: String(s.index) });
    });
    return items;
  }
  // The report an item concerns, from whether it concerns each.
  function docOf(detailed, highLevel) { return detailed && highLevel ? "both" : detailed ? "detailed" : highLevel ? "highLevel" : null; }

  // The items one report is checked against: its own and those for both.
  function readiness(project, doc) {
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
    var vm = VM().build(p);
    function mapThreats(row) { return row.threats.map(function (x) { var t = x.t; return { id: t.id, statement: t.statement, source: t.source, affectedFR: t.affectedFR.slice(), likelihood: t.likelihood, impact: t.impact, unmitigatedRisk: x.risk, residualLikelihood: t.residualLikelihood || null, residualImpact: t.residualImpact || null, residualRisk: x.residual, exceedsTolerable: x.exceeds, disposition: x.disposition, acceptance: t.acceptance || "" }; }); }
    function vecFrom(sug) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = sug.byFR[fr].sl; }); return o; }
    function tgtVec(owner) { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = owner.slTargetByFR[fr] != null ? owner.slTargetByFR[fr] : null; }); return o; }
    // The consultant's own SL-T only: null when none is set, never the
    // tool's suggestion standing in for a decision that was not made.
    function scalar(tgt) { var m = maxDefined(tgt); return m != null ? m : null; }

    return {
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
      highLevelAssets: p.srs.highLevelAssets.map(function (a) { return { id: a.id, name: a.name, functionLocation: a.functionLocation, consequence: a.consequence, likelihood: a.likelihood, risk: riskFor(a.consequence, a.likelihood), note: a.note }; }),
      basisOfAssessment: {
        interviews: p.basisOfAssessment.interviews.map(function (x) { return { id: x.id, name: x.name, role: x.role, date: x.date, notes: x.notes }; }),
        documents: p.basisOfAssessment.documents.map(function (x) { return { id: x.id, title: x.title, reference: x.reference, source: x.source, relevance: x.relevance }; }),
        observations: p.basisOfAssessment.observations.map(function (x) { return { id: x.id, description: x.description, location: x.location, date: x.date, notes: x.notes }; })
      },
      assumptions: p.suc.assumptions.slice().concat(p.srs.clientMatrix ? ["Client risk matrix used" + (p.srs.clientMatrixNote ? ": " + p.srs.clientMatrixNote : "")] : []),
      approval: { name: p.approval.name, role: p.approval.role, date: p.approval.date, statement: p.approval.statement, approved: !!p.approval.approved },
      zones: vm.zones.map(function (row) {
        var z = row.o, s = suggestZone(z, p), tgt = tgtVec(z);
        return {
          id: z.id, name: z.name, safetyRelated: s.safetyRelated,
          fromHighLevelAsset: z.fromHLA || null,
          slSuggestedByFR: vecFrom(s), slTargetByFR: tgt, slTarget: scalar(tgt),
          worstUnmitigatedRisk: s.worstRisk,
          justification: z.justification,
          assets: z.assets.map(function (a) { return { name: a.name, type: a.type }; }),
          accessPoints: z.accessPoints.slice(), externalDependencies: z.externalDependencies.slice(), securityPolicies: z.securityPolicies.slice(),
          threats: mapThreats(row),
          vulnerabilities: z.vulnerabilities.map(function (v) { return { id: v.id, description: v.description }; }),
          countermeasures: z.countermeasures.map(function (m) { return { id: m.id, description: m.description, addressesFR: m.addressesFR.slice(), reference: m.reference, existing: !!m.existing }; })
        };
      }),
      conduits: vm.conduits.map(function (row) {
        var c = row.o, s = suggestConduit(c, p), tgt = tgtVec(c);
        return {
          id: c.id, fromZone: c.fromZone, toZone: c.toZone, name: c.name, channels: c.channels.slice(),
          slSuggestedByFR: vecFrom(s), slTargetByFR: tgt, slTarget: scalar(tgt),
          justification: c.justification,
          threats: mapThreats(row),
          vulnerabilities: c.vulnerabilities.map(function (v) { return { id: v.id, description: v.description }; }),
          countermeasures: c.countermeasures.map(function (m) { return { id: m.id, description: m.description, addressesFR: m.addressesFR.slice(), reference: m.reference, existing: !!m.existing }; })
        };
      })
    };
  }

  return {
    todayISO: todayISO, tolerableOf: tolerableOf, findZone: findZone,
    riskFor: riskFor, threatRisk: threatRisk, exceedsTolerable: exceedsTolerable,
    residualRisk: residualRisk, worstResidualOf: worstResidualOf, worstRiskOf: worstRiskOf,
    coveringCountermeasures: coveringCountermeasures, suggestTreatment: suggestTreatment, sltShortfall: sltShortfall,
    TREATMENT_LABEL: TREATMENT_LABEL, threatTreatment: threatTreatment, threatDisposition: threatDisposition,
    assetTypeLabel: assetTypeLabel, assetLinkLabel: assetLinkLabel, flagLabel: flagLabel, scaleName: scaleName,
    conduitExternal: conduitExternal, conduitsOf: conduitsOf, separationRows: separationRows,
    assetTypeFrom: assetTypeFrom, parseAssets: parseAssets,
    SPEC_TITLES: SPEC_TITLES, specBlocks: specBlocks,
    approvalBasis: approvalBasis, approvalFingerprint: approvalFingerprint, approvalStates: approvalStates,
    APPROVAL_DOC_PARTS: APPROVAL_DOC_PARTS, approvalChangedFor: approvalChangedFor, approvalPartWords: approvalPartWords,
    likelihoodName: likelihoodName, impactName: impactName, zoneSafety: zoneSafety,
    suggestZone: suggestZone, suggestConduit: suggestConduit,
    maxDefined: maxDefined, frSug: frSug, vecStr: vecStr,
    CONDUIT_RULE: CONDUIT_RULE, isBand: isBand, worstBand: worstBand, hlaById: hlaById, hlaRisk: hlaRisk, zonesOfHLA: zonesOfHLA,
    initialRiskOf: initialRiskOf, comparison: comparison, hlaComparison: hlaComparison,
    completeness: completeness, readiness: readiness, stepStatus: stepStatus,
    exportProblems: exportProblems, buildRiskContext: buildRiskContext
  };
}());
