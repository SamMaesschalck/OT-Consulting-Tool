/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* view-model.js — what the project says, worked out once.
 *
 * build(project) derives every per-threat and per-owner fact the outputs
 * print: each threat's unmitigated, residual and operative risk, whether it
 * is above tolerable risk, its treatment state (js/engine.js threatTreatment,
 * which holds the one coverage rule), and the counts over them. The detailed
 * risk and Full report pages, the completeness list, the risk-context file,
 * the Word and Excel builders (js/exports.js summarise is this) and the
 * review pack (js/review.js) all read it, so none of them can disagree.
 *
 * The shape (every list keeps the project's own order, zones before conduits):
 *   tolerable          the project's tolerable risk band id
 *   bandRank           band id -> rank, from the rules file
 *   owners             [ownerRow], zones then conduits; zones and conduits: each kind alone
 *   threats            [threatRow], every threat, owner by owner
 *   dispositionCounts  over threats above tolerable risk: mitigated, countermeasure,
 *                      accepted, sl-t, and none (no complete decision)
 *   worst              the threatRow with the highest unmitigated risk (the first of equals), or null
 *   sltMax             FR id -> the highest SL-T set on any zone or conduit, or null
 *   counts             threats, exceeding, decided, incomplete, open, suggested,
 *                      countermeasuresExisting, countermeasuresPlanned
 * ownerRow:  kind ("Zone" | "Conduit"), isZone, o (the zone or conduit), threats [threatRow],
 *            exceeding, open, suggested ([threatRow] each), worstRisk (unmitigated),
 *            worstOperative (residual where rated, else unmitigated), sltSet (any FR set)
 * threatRow: ownerKind, owner, t, risk (unmitigated band), exceeds, residual,
 *            operative (residual, else unmitigated), operativeExceeds, treatment (the
 *            full threatTreatment), decided (complete), incomplete (confirmed, not
 *            complete), label, disposition
 *
 * Pure: project in, plain object out. Build it again after an edit.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.ViewModel = (function () {
  "use strict";

  var M = window.RiskApp.Model, E = window.RiskApp.Engine;

  function build(project) {
    var p = project;
    var tolerable = E.tolerableOf(p);
    var bandRank = {}; (M.RULES.riskBands || []).forEach(function (b) { bandRank[b.id] = b.rank; });
    var threats = [];

    function ownerRow(kind, o) {
      var rows = o.threats.map(function (t) {
        var risk = E.threatRisk(t);
        var T = E.threatTreatment(o, t, p);
        var operative = T.residual || risk;
        var x = {
          ownerKind: kind, owner: o, t: t,
          risk: risk, exceeds: T.required,
          residual: T.residual,
          operative: operative, operativeExceeds: E.exceedsTolerable(operative, tolerable),
          // decided: a confirmed decision with nothing missing. One the
          // consultant has not confirmed prints as no decision, and a confirmed
          // one that lacks what it rests on (incomplete) prints as a prompt.
          treatment: T, decided: T.complete, incomplete: T.confirmed && !T.complete, label: T.label,
          disposition: T.disposition
        };
        threats.push(x);
        return x;
      });
      var exceeding = rows.filter(function (x) { return x.exceeds; });
      return {
        kind: kind, isZone: kind === "Zone", o: o,
        threats: rows,
        exceeding: exceeding,
        open: exceeding.filter(function (x) { return x.treatment.open; }),
        suggested: exceeding.filter(function (x) { return x.treatment.state === "suggested"; }),
        worstRisk: E.worstRiskOf(o.threats),
        worstOperative: E.worstResidualOf(o.threats),
        sltSet: M.FR_IDS.some(function (fr) { return o.slTargetByFR[fr] != null; })
      };
    }

    var zones = p.zones.map(function (z) { return ownerRow("Zone", z); });
    var conduits = p.conduits.map(function (c) { return ownerRow("Conduit", c); });
    var owners = zones.concat(conduits);

    var counts = { mitigated: 0, countermeasure: 0, accepted: 0, "sl-t": 0, none: 0 };
    threats.forEach(function (x) { if (x.exceeds) counts[x.disposition || "none"] += 1; });
    var worst = null, worstRank = -1;
    threats.forEach(function (x) { if (x.risk && (bandRank[x.risk] || 0) > worstRank) { worstRank = bandRank[x.risk] || 0; worst = x; } });
    var sltMax = {};
    M.FRS.forEach(function (f) {
      var m = null;
      owners.forEach(function (row) { var v = row.o.slTargetByFR[f.id]; if (v != null && (m === null || v > m)) m = v; });
      sltMax[f.id] = m;
    });
    var cmEx = 0, cmPl = 0;
    owners.forEach(function (row) { (row.o.countermeasures || []).forEach(function (m) { if (m.existing) cmEx++; else cmPl++; }); });
    var exceeding = threats.filter(function (x) { return x.exceeds; });

    return {
      tolerable: tolerable, bandRank: bandRank,
      owners: owners, zones: zones, conduits: conduits,
      threats: threats,
      dispositionCounts: counts, worst: worst, sltMax: sltMax,
      counts: {
        threats: threats.length,
        exceeding: exceeding.length,
        decided: exceeding.filter(function (x) { return x.decided; }).length,
        incomplete: exceeding.filter(function (x) { return x.incomplete; }).length,
        open: exceeding.filter(function (x) { return x.treatment.open; }).length,
        suggested: exceeding.filter(function (x) { return x.treatment.state === "suggested"; }).length,
        countermeasuresExisting: cmEx,
        countermeasuresPlanned: cmPl
      }
    };
  }

  return { build: build };
}());
