/* Sanity check for js/scoring.js. Runs under plain node.
 *
 *   node scripts/test-scoring.js
 *
 * Loads the .js wrappers by faking a window, then verifies the worked
 * acceptance case from the build prompt:
 *
 *   A site that is mostly SL2 against an SL2 target but has one SR at SL0
 *   shows that FR as not meeting target (weakest-link) and shows a floor
 *   flag, even though closeness is high. The headline never hides this.
 */
const fs = require("fs");
const path = require("path");

// Node-friendly equivalent of the browser test.html. The manifest.js loader uses
// document.write so it cannot run here; instead we load the same wrapper files
// directly in dependency order.
global.window = {};
global.document = { currentScript: null, write: function () {} };
const files = [
  "data/shared/taxonomy-fr7.js",
  "data/shared/scoring-profiles.js",
  "data/instruments/iec-62443-3-3/instrument.js",
  "data/instruments/iec-62443-3-3/narrative.js",
  "js/scoring.js"
];
const root = path.resolve(__dirname, "..");
for (const f of files) {
  eval(fs.readFileSync(path.join(root, f), "utf8"));
}

const App = global.window.App;
const taxonomy   = App.Data.shared.taxonomies["fr-7"];
const profile    = App.Data.shared.scoringProfiles["sl-target-closeness"];
const instrument = App.Data.instruments["iec-62443-3-3"].instrument;
const Scoring    = App.Scoring;

// Build a response set for FR1: 12 of 13 at SL2, one at SL0.
const fr1 = instrument.requirements.filter(r => r.frId === "FR1");
const responses = fr1.map((r, i) => ({
  targetId: "t-1",
  requirementId: r.id,
  applicable: true,
  achievedSL: (i === 0) ? 0 : 2,
  evidence: "",
  notes: ""
}));

const targetProfile = { defaultTargetSL: 2, perFR: {}, perZone: {} };
const result = Scoring.scoreSite(instrument, taxonomy, profile, targetProfile, responses);
const fr1Res = result.perFR.find(f => f.frId === "FR1");

function check(label, actual, expected) {
  const ok = (actual === expected) || (Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) < 1e-9);
  console.log((ok ? "PASS " : "FAIL ") + label + " - got " + JSON.stringify(actual) + (ok ? "" : " (expected " + JSON.stringify(expected) + ")"));
  return ok;
}

let allOk = true;
allOk &= check("FR1 target SL",                       fr1Res.targetSL, 2);
allOk &= check("FR1 conformant achieved SL",          fr1Res.conformantAchievedSL, 0);
allOk &= check("FR1 floor flag count",                fr1Res.floorFlagCount, 1);
allOk &= check("FR1 target met (must be false)",      fr1Res.frTargetMet, false);
// closeness: 1 req at floor (score 0), 12 at met (score 1) -> 12/13
const expectedCloseness = 12 / 13;
allOk &= check("FR1 closeness 12/13",                 Math.round(fr1Res.closeness * 10000)/10000, Math.round(expectedCloseness * 10000)/10000);
allOk &= check("FR1 closeness band (high but flagged)", fr1Res.closenessBand, "met");
allOk &= check("FR1 met req count",                   fr1Res.metCount, 12);
allOk &= check("FR1 unanswered count",                fr1Res.unansweredCount, 0);

// Headline checks: overall must not be met, weakest must be FR1 at SL 0
allOk &= check("overall target met",                  result.overallTargetMet, false);
allOk &= check("weakest FR id",                       result.weakestFR.frId, "FR1");
allOk &= check("weakest FR conformant SL",            result.weakestFR.conformantAchievedSL, 0);
allOk &= check("overall floor flag count",            result.floorFlagCount, 1);

// Per-requirement sanity
const sr11 = result.perRequirement.find(r => r.requirementId === fr1[0].id);
allOk &= check("SR floor at SL 0",                    sr11.floor, true);
allOk &= check("SR floor score",                      sr11.score, 0.0);
allOk &= check("SR floor band",                       sr11.band, "gap");

// And another small case: achieved SL1 against target SL2 -> partial 0.5, near, not floor
const partialResponses = fr1.map((r, i) => ({ targetId: "t-1", requirementId: r.id, applicable: true, achievedSL: (i === 0) ? 1 : 2, evidence: "", notes: "" }));
const partialResult = Scoring.scoreSite(instrument, taxonomy, profile, targetProfile, partialResponses);
const fr1Partial = partialResult.perFR.find(f => f.frId === "FR1");
allOk &= check("partial: FR conformant achieved SL",  fr1Partial.conformantAchievedSL, 1);
allOk &= check("partial: FR target met (must be false)", fr1Partial.frTargetMet, false);
allOk &= check("partial: FR floor flag count (should be 0)", fr1Partial.floorFlagCount, 0);
allOk &= check("partial: FR partial count",           fr1Partial.partialCount, 1);

const sr11partial = partialResult.perRequirement.find(r => r.requirementId === fr1[0].id);
allOk &= check("partial: SR score 0.5",               sr11partial.score, 0.5);
allOk &= check("partial: SR band near",               sr11partial.band, "near");
allOk &= check("partial: SR floor flag (must be false)", sr11partial.floor, false);

// N/A handling: mark one as N/A, ensure it does not affect denominator
const naResponses = fr1.map((r, i) => ({ targetId: "t-1", requirementId: r.id, applicable: (i !== 0), achievedSL: (i === 0) ? null : 2, evidence: "", notes: "" }));
const naResult = Scoring.scoreSite(instrument, taxonomy, profile, targetProfile, naResponses);
const fr1NA = naResult.perFR.find(f => f.frId === "FR1");
allOk &= check("N/A: applicable count",               fr1NA.applicableCount, 12);
allOk &= check("N/A: closeness 100%",                 fr1NA.closeness, 1.0);
allOk &= check("N/A: target met",                     fr1NA.frTargetMet, true);
allOk &= check("N/A: floor count 0",                  fr1NA.floorFlagCount, 0);

// exceeds: achieve SL3 against target SL2 -> met + exceeds
const exceedsResponses = fr1.map((r, i) => ({ targetId: "t-1", requirementId: r.id, applicable: true, achievedSL: (i === 0) ? 3 : 2, evidence: "", notes: "" }));
const exceedsResult = Scoring.scoreSite(instrument, taxonomy, profile, targetProfile, exceedsResponses);
const fr1Ex = exceedsResult.perFR.find(f => f.frId === "FR1");
allOk &= check("exceeds: FR conformant SL (weakest still 2)", fr1Ex.conformantAchievedSL, 2);
allOk &= check("exceeds: exceeds count",              fr1Ex.exceedsCount, 1);
allOk &= check("exceeds: FR target met",              fr1Ex.frTargetMet, true);

process.exit(allOk ? 0 : 1);
