/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* Frozen fixture: how the released v0.7.0 Assessment Tool (commit b2605e9)
 * takes in an spt-risk-context file, copied as it was, so a test can show what
 * an issued v0.7 copy (single file or exe) does with a file a later risk tool
 * exported:
 *   - ACCEPTED_SCHEMAS and FR_KEYS: data/shared/risk-context-interchange.json
 *     (acceptedSchemas, importContract.frKeys);
 *   - accepts(): the two checks in js/ui.js loadRiskContextFromFile between
 *     JSON.parse and openRiskContextModal, with each toast returned as text;
 *   - modalRow(): what js/ui.js openRiskContextModal reads from each zone;
 *   - frIdByAbbr, getRiskContext and setRiskContext: js/engine.js lines
 *     810 to 885, verbatim.
 * Only the engine's own closure is passed in (state, activeAssessment,
 * SHARED_TARGET_ID, emit). Do not edit or regenerate: it stands for code
 * already in consultants' hands. Used by scripts/test-risk-context-phase6.html. */
window.RiskContextFixtures = window.RiskContextFixtures || {};
window.RiskContextFixtures["v0.7-import"] = function (state, activeAssessment, SHARED_TARGET_ID, emit) {
  var ACCEPTED_SCHEMAS = ["spt-risk-context/1.0", "spt-risk-context/1.1", "spt-risk-context/1.2", "spt-risk-context/1.3", "spt-risk-context/1.4"];
  var FR_KEYS = ["IAC", "UC", "SI", "DC", "RDF", "TRE", "RA"];

  function accepts(data) {
    var contract = { acceptedSchemas: ACCEPTED_SCHEMAS };
    var accepted = (contract && contract.acceptedSchemas) || [(contract && contract.schema) || "spt-risk-context/1.0"];
    var received = data && data.schema ? String(data.schema) : "(none)";
    if (!data || accepted.indexOf(data.schema) < 0) {
      return "Risk context rejected: expected schema " + accepted.map(function (s) { return "\"" + s + "\""; }).join(" or ") + " but the file declares \"" + received + "\".";
    }
    if (!Array.isArray(data.zones) || data.zones.length === 0) {
      return "Risk context rejected: the file contains no zones.";
    }
    return null;
  }

  function modalRow(z) {
    var frKeys = FR_KEYS;
    var frVec = z.slTargetByFR ? frKeys.map(function (k) { var v = z.slTargetByFR[k]; return typeof v === "number" ? v : "-"; }).join("/") : null;
    return { zoneId: z.id, name: z.name, safetyRelated: !!z.safetyRelated,
      slTarget: typeof z.slTarget === "number" ? "SL " + z.slTarget : "-",
      frLine: frVec ? frKeys.join("/") + " = " + frVec : null };
  }
  function frIdByAbbr() {
    var map = {};
    var tax = state.taxonomy || {};
    (tax.frs || []).forEach(function (fr) { if (fr.abbr) map[fr.abbr] = fr.id; });
    return map;
  }

  function getRiskContext() {
    if (!state.instrument) return null;
    var ass = activeAssessment();
    return (ass && ass.riskContext) || null;
  }

  function setRiskContext(ctx, options) {
    if (!state.instrument || !ctx) return;
    var ass = activeAssessment();
    if (!ass) return;
    var opts = options || {};
    ass.riskContext = {
      schema: ctx.schema,
      generatedBy: ctx.generatedBy || "",
      generatedOn: ctx.generatedOn || "",
      importedOn: new Date().toISOString().slice(0, 10),
      fileName: opts.fileName || "",
      suc: ctx.suc || {},
      zones: ctx.zones || [],
      conduits: ctx.conduits || []
    };
    if (!ass.targetProfile.perZone) ass.targetProfile.perZone = {};

    if (opts.scope && opts.zoneIds && opts.zoneIds.length > 0) {
      var byId = {};
      (ctx.zones || []).forEach(function (z) { byId[z.id] = z; });
      // Existing sites are only replaced when none of them holds a response;
      // captured work is never thrown away - the zones are appended instead.
      var existingIds = {};
      ass.targets.forEach(function (t) { existingIds[t.id] = true; });
      // shared answers count as captured work too: they are inherited by
      // the very zones a replace would delete, so an assessment answered
      // entirely on that layer must not read as empty.
      var hasResponses = (ass.responses || []).some(function (r) {
        return existingIds[r.targetId] || r.targetId === SHARED_TARGET_ID;
      });
      var created = [];
      opts.zoneIds.forEach(function (zid, i) {
        var z = byId[zid];
        if (!z) return;
        var t = { id: "t-" + Date.now().toString(36) + "-z" + (i + 1), name: z.name, zoneId: z.id,
                  zoneType: z.type || "zone" };
        // The interchange has carried a per-FR SL-T vector (slTargetByFR,
        // keyed by FR abbreviation) since v1.1, but this only ever read the
        // flattened scalar, so the vector arrived and was discarded. Take the
        // vector when it is there and fall back to the scalar otherwise.
        var entry = { default: (typeof z.slTarget === "number" ? z.slTarget : null), perFR: {} };
        if (z.slTargetByFR && typeof z.slTargetByFR === "object") {
          var byAbbr = frIdByAbbr();
          Object.keys(z.slTargetByFR).forEach(function (abbr) {
            var frId = byAbbr[abbr];
            var v = z.slTargetByFR[abbr];
            if (frId && typeof v === "number") entry.perFR[frId] = v;
          });
        }
        if (entry.default !== null || Object.keys(entry.perFR).length) {
          ass.targetProfile.perZone[t.id] = entry;
        }
        created.push(t);
      });
      if (created.length > 0) {
        // Mutate the array in place - state.engagement.targets aliases it.
        if (!hasResponses) ass.targets.length = 0;
        created.forEach(function (t) { ass.targets.push(t); });
        state.activeTargetId = ass.targets[0].id;
      }
    }
    emit("targets-changed", state.engagement.targetProfile);
  }

  return { ACCEPTED_SCHEMAS: ACCEPTED_SCHEMAS, FR_KEYS: FR_KEYS, accepts: accepts, modalRow: modalRow,
    getRiskContext: getRiskContext, setRiskContext: setRiskContext };
};