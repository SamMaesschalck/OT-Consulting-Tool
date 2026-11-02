/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/ncsc-caf/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["ncsc-caf"] = window.App.Data.instruments["ncsc-caf"] || {};
window.App.Data.instruments["ncsc-caf"].profileRegistry = {
    "schema":  "caf-profile-registry/2.0",
    "_note":  "CAF profiles overlay the base ncsc-caf instrument by outcome id; they never copy CAF content. The selector should be a two-step picker: choose sector/regulator first, then level (Basic / Enhanced). \u0027caf-general\u0027 is the default. Regulator profiles ship as PLACEHOLDERS - their per-outcome expected states are deliberately null and must be populated from each regulator\u0027s authoritative published profile, version-stamped. Do not invent expected states. CAA aviation is NOT a profile of this core CAF: the CAF for Aviation is a separate instrument (ncsc-caf-aviation).",
    "default":  "caf-general",
    "selectorUx":  {
                       "_recommendation":  "Two-step picker for usability. Step 1: pick sector/regulator (groups multiple profiles by sectorRegulator + sector). Step 2: pick level (basic | enhanced) if both are available. Show profileVersion and status next to each option; render placeholders clearly as \u0027expected states not yet populated\u0027 rather than as silently usable. Default selection is General.",
                       "groupKey":  "sectorRegulator+sector",
                       "levelKey":  "level"
                   },
    "levels":  [
                   "basic",
                   "enhanced"
               ],
    "profiles":  [
                     {
                         "id":  "caf-general",
                         "name":  "General CAF (no regulator profile)",
                         "sectorRegulator":  "none",
                         "sectorRegulatorName":  "NCSC (General)",
                         "sector":  "general",
                         "sectorName":  "Generic CAF",
                         "level":  "n/a",
                         "status":  "active",
                         "file":  "profiles/caf-general.json"
                     },
                     {
                         "id":  "caf-ofgem-dge-basic",
                         "name":  "Ofgem Downstream Gas \u0026 Electricity (Basic)",
                         "sectorRegulator":  "ofgem",
                         "sectorRegulatorName":  "Ofgem",
                         "sector":  "dge",
                         "sectorName":  "Downstream Gas \u0026 Electricity",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofgem-dge-basic.json"
                     },
                     {
                         "id":  "caf-ofgem-dge-enhanced",
                         "name":  "Ofgem Downstream Gas \u0026 Electricity (Enhanced)",
                         "sectorRegulator":  "ofgem",
                         "sectorRegulatorName":  "Ofgem",
                         "sector":  "dge",
                         "sectorName":  "Downstream Gas \u0026 Electricity",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofgem-dge-enhanced.json"
                     },
                     {
                         "id":  "caf-hse-ugpdo-basic",
                         "name":  "HSE (with DESNZ) Upstream Gas, Petroleum \u0026 Downstream Oil (Basic)",
                         "sectorRegulator":  "hse",
                         "sectorRegulatorName":  "HSE (with DESNZ)",
                         "sector":  "ugpdo",
                         "sectorName":  "Upstream Gas, Petroleum \u0026 Downstream Oil",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-hse-ugpdo-basic.json"
                     },
                     {
                         "id":  "caf-hse-ugpdo-enhanced",
                         "name":  "HSE (with DESNZ) Upstream Gas, Petroleum \u0026 Downstream Oil (Enhanced)",
                         "sectorRegulator":  "hse",
                         "sectorRegulatorName":  "HSE (with DESNZ)",
                         "sector":  "ugpdo",
                         "sectorName":  "Upstream Gas, Petroleum \u0026 Downstream Oil",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-hse-ugpdo-enhanced.json"
                     },
                     {
                         "id":  "caf-dft-rail-basic",
                         "name":  "DfT Rail (Basic)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "rail",
                         "sectorName":  "Rail",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-rail-basic.json"
                     },
                     {
                         "id":  "caf-dft-rail-enhanced",
                         "name":  "DfT Rail (Enhanced)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "rail",
                         "sectorName":  "Rail",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-rail-enhanced.json"
                     },
                     {
                         "id":  "caf-dft-road-basic",
                         "name":  "DfT Road (Basic)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "road",
                         "sectorName":  "Road",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-road-basic.json"
                     },
                     {
                         "id":  "caf-dft-road-enhanced",
                         "name":  "DfT Road (Enhanced)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "road",
                         "sectorName":  "Road",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-road-enhanced.json"
                     },
                     {
                         "id":  "caf-dft-maritime-basic",
                         "name":  "DfT Maritime (Basic)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "maritime",
                         "sectorName":  "Maritime",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-maritime-basic.json"
                     },
                     {
                         "id":  "caf-dft-maritime-enhanced",
                         "name":  "DfT Maritime (Enhanced)",
                         "sectorRegulator":  "dft",
                         "sectorRegulatorName":  "DfT",
                         "sector":  "maritime",
                         "sectorName":  "Maritime",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-dft-maritime-enhanced.json"
                     },
                     {
                         "id":  "caf-ofcom-basic",
                         "name":  "Ofcom Digital Infrastructure / Telecoms (Basic)",
                         "sectorRegulator":  "ofcom",
                         "sectorRegulatorName":  "Ofcom",
                         "sector":  "digital",
                         "sectorName":  "Digital Infrastructure / Telecoms",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofcom-basic.json"
                     },
                     {
                         "id":  "caf-ofcom-enhanced",
                         "name":  "Ofcom Digital Infrastructure / Telecoms (Enhanced)",
                         "sectorRegulator":  "ofcom",
                         "sectorRegulatorName":  "Ofcom",
                         "sector":  "digital",
                         "sectorName":  "Digital Infrastructure / Telecoms",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofcom-enhanced.json"
                     },
                     {
                         "id":  "caf-ofwat-water-basic",
                         "name":  "Ofwat / DWI Water (Basic)",
                         "sectorRegulator":  "ofwat",
                         "sectorRegulatorName":  "Ofwat / DWI",
                         "sector":  "water",
                         "sectorName":  "Water",
                         "level":  "basic",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofwat-water-basic.json"
                     },
                     {
                         "id":  "caf-ofwat-water-enhanced",
                         "name":  "Ofwat / DWI Water (Enhanced)",
                         "sectorRegulator":  "ofwat",
                         "sectorRegulatorName":  "Ofwat / DWI",
                         "sector":  "water",
                         "sectorName":  "Water",
                         "level":  "enhanced",
                         "status":  "placeholder",
                         "file":  "profiles/caf-ofwat-water-enhanced.json"
                     }
                 ]
};
