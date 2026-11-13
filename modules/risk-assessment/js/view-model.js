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
 *                      linkSuggested, countermeasuresExisting, countermeasuresPlanned
 *                      (described ones only), and of the threats exceeding,
 *                      withinToday, withinAfterPlan and aboveToday
 * ownerRow:  kind ("Zone" | "Conduit"), isZone, o (the zone or conduit), threats [threatRow],
 *            exceeding, open, suggested, linkSuggested ([threatRow] each), worstRisk
 *            (unmitigated), worstCurrent, worstPlanned (null when none is rated),
 *            worstOperative (planned, else current, else unmitigated), sltSet (any FR set)
 * threatRow: ownerKind, owner, t, risk (unmitigated band), exceeds, current and planned
 *            (bands or null), currentExceeds, plannedExceeds, residual (the planned band),
 *            operative (planned, else current, else unmitigated), operativeExceeds, today and
 *            todayExceeds (the rating that stands today: the engine's one rule), afterPlan and
 *            afterPlanExceeds (once the planned countermeasures are complete), categories (the
 *            impact per consequence category, where given: engine categoryRatings), residualRisk
 *            (the risk context's: planned, else current, else null), treatment (the
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
        var risk = E.threatRisk(t, p);
        var T = E.threatTreatment(o, t, p);
        var operative = T.operative;
        var x = {
          ownerKind: kind, owner: o, t: t,
          risk: risk, exceeds: T.required,
          residual: T.residual,
          // The three states: unmitigated (risk), current (with the linked
          // existing countermeasures) and planned (after the planned measures).
          // Each against tolerable risk as the engine compares it (per
          // consequence category where the criteria set one per category).
          current: T.current, planned: T.planned,
          currentExceeds: T.currentExceeds, plannedExceeds: T.plannedExceeds,
          operative: operative, operativeExceeds: T.operativeExceeds,
          // The threat's impact per consequence category, where given.
          categories: T.categories,
          // The rating that stands today and once the plan is complete (the
          // engine's one rule; see threatTreatment).
          today: T.today, todayExceeds: !!T.today && !T.todayWithin,
          afterPlan: T.afterPlan, afterPlanExceeds: !!T.afterPlan && !T.afterPlanWithin,
          // The risk context's residualRisk, which keeps its meaning: the
          // planned rating, else the current one, else none.
          residualRisk: T.planned || T.current || null,
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
        // Threats with suggested countermeasure links waiting (from a 0.2 file).
        linkSuggested: rows.filter(function (x) { return x.treatment.linkSuggested.length > 0; }),
        worstRisk: E.worstRiskOf(o.threats, p),
        worstCurrent: E.worstBand(rows.map(function (x) { return x.current; })),
        worstPlanned: E.worstBand(rows.map(function (x) { return x.planned; })),
        worstOperative: E.worstResidualOf(o.threats, p),
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
    // Only a countermeasure with a description is counted, as only one covers anything.
    var cmEx = 0, cmPl = 0;
    owners.forEach(function (row) { (row.o.countermeasures || []).forEach(function (m) { if (!String(m.description || "").trim()) return; if (m.existing) cmEx++; else cmPl++; }); });
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
        linkSuggested: threats.filter(function (x) { return x.treatment.linkSuggested.length > 0; }).length,
        countermeasuresExisting: cmEx,
        countermeasuresPlanned: cmPl,
        // Of the threats above tolerable risk before any countermeasure, those
        // within it today and once the planned countermeasures are complete.
        withinToday: exceeding.filter(function (x) { return !x.todayExceeds; }).length,
        withinAfterPlan: exceeding.filter(function (x) { return !x.afterPlanExceeds; }).length,
        aboveToday: exceeding.filter(function (x) { return x.todayExceeds; }).length
      }
    };
  }

  // A threat row in one of the three states the heat maps show (unmitigated,
  // current, planned): its likelihood and impact, a state not rated taking
  // the rating before it, and whether that rating is above tolerable risk as
  // the engine compares it (per consequence category where set). Step 5's
  // heat map and the workbook's Summary both read this.
  function stateCell(x, st) {
    var t = x.t, L = t.likelihood, I = t.impact, exceeds = !!x.exceeds;
    if (st === "current" || st === "planned") {
      L = t.currentLikelihood || L; I = t.currentImpact || I;
      if (x.current) exceeds = !!x.currentExceeds;
    }
    if (st === "planned") {
      L = t.residualLikelihood || L; I = t.residualImpact || I;
      if (x.planned) exceeds = !!x.plannedExceeds;
    }
    return { L: L, I: I, exceeds: exceeds };
  }
  // The heat map's cells for one state: { "I:L": { n, exceeds } }, exceeds
  // when any threat counted in the cell is above tolerable risk.
  function heatCells(vm, st) {
    var out = {};
    vm.threats.forEach(function (x) {
      var c = stateCell(x, st);
      if (!c.L || !c.I) return;
      var k = c.I + ":" + c.L, cell = out[k] = out[k] || { n: 0, exceeds: false };
      cell.n++; if (c.exceeds) cell.exceeds = true;
    });
    return out;
  }

  // Whether a heat map cell is outlined as above tolerable risk: a cell
  // holding threats when one of them is; an empty one when its band is above
  // the general tolerable risk.
  function heatAbove(cells, I, L, band, tolerable) {
    var c = cells[I + ":" + L];
    return c && c.n ? c.exceeds : E.exceedsTolerable(band, tolerable);
  }

  return { build: build, stateCell: stateCell, heatCells: heatCells, heatAbove: heatAbove };
}());
