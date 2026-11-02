/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nist-800-53/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nist-800-53"] = window.App.Data.instruments["nist-800-53"] || {};
window.App.Data.instruments["nist-800-53"].profileRegistry = {
    "schema":  "caf-profile-registry/2.0",
    "_note":  "NIST 800-53 baselines overlay the base nist-800-53 instrument by control id. \u0027nist-moderate\u0027 is the default. Low/Moderate/High membership is from NIST SP 800-53B; \u0027full\u0027 assesses every control with no target baseline.",
    "default":  "nist-moderate",
    "levels":  [

               ],
    "profiles":  [
                     {
                         "id":  "nist-full",
                         "name":  "Full catalog (no target baseline)",
                         "sectorRegulator":  "none",
                         "sectorRegulatorName":  "NIST 800-53",
                         "sector":  "general",
                         "sectorName":  "Full catalog",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/nist-full.json"
                     },
                     {
                         "id":  "nist-low",
                         "name":  "Low baseline (NIST SP 800-53B)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "NIST 800-53B baseline",
                         "sector":  "low",
                         "sectorName":  "Low",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/nist-low.json"
                     },
                     {
                         "id":  "nist-moderate",
                         "name":  "Moderate baseline (NIST SP 800-53B)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "NIST 800-53B baseline",
                         "sector":  "moderate",
                         "sectorName":  "Moderate",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/nist-moderate.json"
                     },
                     {
                         "id":  "nist-high",
                         "name":  "High baseline (NIST SP 800-53B)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "NIST 800-53B baseline",
                         "sector":  "high",
                         "sectorName":  "High",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/nist-high.json"
                     }
                 ]
};
