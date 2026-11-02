/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-full/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-full"] = window.App.Data.instruments["onr-syaps-full"] || {};
window.App.Data.instruments["onr-syaps-full"].profileRegistry = {
    "schema":  "caf-profile-registry/2.0",
    "_note":  "ONR SyAPs dutyholder profiles overlay the base onr-syaps-full instrument by expectation id. \u0027Full dutyholder\u0027 is the default; \u0027Smaller dutyholder\u0027 applies the same expectations proportionately (ONR CNS-GD-003).",
    "default":  "syaps-full-full",
    "levels":  [

               ],
    "profiles":  [
                     {
                         "id":  "syaps-full-full",
                         "name":  "Full dutyholder",
                         "sectorRegulator":  "onr",
                         "sectorRegulatorName":  "ONR (SyAPs)",
                         "sector":  "full",
                         "sectorName":  "Full dutyholder",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/syaps-full-full.json"
                     },
                     {
                         "id":  "syaps-full-smaller",
                         "name":  "Smaller dutyholder (proportionate)",
                         "sectorRegulator":  "onr",
                         "sectorRegulatorName":  "ONR (SyAPs)",
                         "sector":  "smaller",
                         "sectorName":  "Smaller dutyholder",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/syaps-full-smaller.json"
                     }
                 ]
};
