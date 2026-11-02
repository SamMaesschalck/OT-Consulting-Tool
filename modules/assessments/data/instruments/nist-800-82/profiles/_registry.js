/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/nist-800-82/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["nist-800-82"] = window.App.Data.instruments["nist-800-82"] || {};
window.App.Data.instruments["nist-800-82"].profileRegistry = {
    "schema":  "caf-profile-registry/2.0",
    "_note":  "NIST SP 800-82 Rev 3 OT Overlay baselines overlay the base nist-800-82 instrument by control id. \u0027ics-moderate\u0027 is the default. Membership is from the SP 800-82 Rev 3 Appendix F Table 22 (Low/Moderate/High); \u0027full\u0027 assesses every overlay control with no target.",
    "default":  "ics-moderate",
    "levels":  [

               ],
    "profiles":  [
                     {
                         "id":  "ics-full",
                         "name":  "Full overlay (no target baseline)",
                         "sectorRegulator":  "none",
                         "sectorRegulatorName":  "NIST 800-82 Rev 3",
                         "sector":  "general",
                         "sectorName":  "Full overlay",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/ics-full.json"
                     },
                     {
                         "id":  "ics-low",
                         "name":  "OT Low baseline (SP 800-82 Rev 3 overlay)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "SP 800-82 Rev 3 overlay",
                         "sector":  "low",
                         "sectorName":  "OT Low",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/ics-low.json"
                     },
                     {
                         "id":  "ics-moderate",
                         "name":  "OT Moderate baseline (SP 800-82 Rev 3 overlay)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "SP 800-82 Rev 3 overlay",
                         "sector":  "moderate",
                         "sectorName":  "OT Moderate",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/ics-moderate.json"
                     },
                     {
                         "id":  "ics-high",
                         "name":  "OT High baseline (SP 800-82 Rev 3 overlay)",
                         "sectorRegulator":  "nist",
                         "sectorRegulatorName":  "SP 800-82 Rev 3 overlay",
                         "sector":  "high",
                         "sectorName":  "OT High",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/ics-high.json"
                     }
                 ]
};
