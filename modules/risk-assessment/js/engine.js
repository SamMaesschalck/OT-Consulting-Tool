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
  var ASSET_TYPE_LABEL = { "plc": "PLC", "safety-plc": "Safety PLC", "hmi": "HMI", "historian": "Historian", "engineering-workstation": "Engineering workstation", "server": "Server", "network": "Network device", "other": "Other" };
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
  function vecStr(vec) { return FR_IDS.map(function (fr) { return vec[fr] != null ? vec[fr] : "–"; }).join("/"); }

  function VM() { return window.RiskApp.ViewModel; }

  // ---------- Completeness (warns, never blocks) ----------

  function exportProblems(project) {
    var p = project, probs = [];
    var vm = VM().build(p);
    if (!p.zones.length) probs.push("No zones defined: the risk context gives the 3-3 tool nothing to scope. Define zones in stage 3.");
    function checkOwner(row, label) {
      var o = row.o, isZone = row.isZone;
      var hasSLT = row.sltSet;
      var hasJust = !!(o.justification || "").trim();
      // A conduit often carries no threat of its own and takes its SL-T from
      // the zones it joins: its written justification is then the basis.
      if (!o.threats.length && (isZone || !hasJust)) {
        probs.push(label + (hasSLT
          ? ": SL-T set with no threats. Give the basis in the justification."
          : ": no threats identified."));
      }
      row.threats.forEach(function (x) {
        var t = x.t, T = x.treatment;
        if (!t.likelihood || !t.impact) probs.push(label + " / " + t.id + ": likelihood or impact not set.");
        if (!t.affectedFR.length) probs.push(label + " / " + t.id + ": no affected foundational requirements marked.");
        if (T.open) probs.push(label + " / " + t.id + ": above tolerable risk with no treatment decision" + (T.state === "suggested" ? " (a suggestion is waiting to be confirmed)." : "."));
        else if (T.gap) probs.push(label + " / " + t.id + ": " + T.gap + ".");
      });
      // The justification is the deliverable, so flag it only where there is a
      // target to justify — a zone with no SL-T yet is 'incomplete', not
      // 'unjustified'. Neither blocks export (the ruling: never hard-gate).
      if (!hasSLT) probs.push(label + ": no SL-T set for any FR.");
      else if (!hasJust && (isZone || o.threats.length)) probs.push(label + ": SL-T set but no justification.");
    }
    vm.zones.forEach(function (row) { var z = row.o; checkOwner(row, z.id + (z.name ? " (" + z.name + ")" : "")); });
    vm.conduits.forEach(function (row) { var c = row.o; checkOwner(row, c.id + (c.name ? " (" + c.name + ")" : "")); });
    if (p.zones.length && !(p.approval && (p.approval.name || "").trim())) probs.push("No asset-owner sign-off recorded.");
    return probs;
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
    assetTypeLabel: assetTypeLabel, flagLabel: flagLabel, scaleName: scaleName,
    likelihoodName: likelihoodName, impactName: impactName, zoneSafety: zoneSafety,
    suggestZone: suggestZone, suggestConduit: suggestConduit,
    maxDefined: maxDefined, frSug: frSug, vecStr: vecStr,
    exportProblems: exportProblems, buildRiskContext: buildRiskContext
  };
}());
