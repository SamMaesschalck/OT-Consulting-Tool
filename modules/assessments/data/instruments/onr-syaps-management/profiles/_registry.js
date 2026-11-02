/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/onr-syaps-management/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["onr-syaps-management"] = window.App.Data.instruments["onr-syaps-management"] || {};
window.App.Data.instruments["onr-syaps-management"].profileRegistry = {
    "schema":  "caf-profile-registry/2.0",
    "_note":  "ONR SyAPs dutyholder profiles overlay the base onr-syaps-management instrument by expectation id. \u0027Full dutyholder\u0027 is the default; \u0027Smaller dutyholder\u0027 applies the same expectations proportionately (ONR CNS-GD-003).",
    "default":  "syaps-mgmt-full",
    "levels":  [

               ],
    "profiles":  [
                     {
                         "id":  "syaps-mgmt-full",
                         "name":  "Full dutyholder",
                         "sectorRegulator":  "onr",
                         "sectorRegulatorName":  "ONR (SyAPs)",
                         "sector":  "full",
                         "sectorName":  "Full dutyholder",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/syaps-mgmt-full.json"
                     },
                     {
                         "id":  "syaps-mgmt-smaller",
                         "name":  "Smaller dutyholder (proportionate)",
                         "sectorRegulator":  "onr",
                         "sectorRegulatorName":  "ONR (SyAPs)",
                         "sector":  "smaller",
                         "sectorName":  "Smaller dutyholder",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/syaps-mgmt-smaller.json"
                     }
                 ]
};
