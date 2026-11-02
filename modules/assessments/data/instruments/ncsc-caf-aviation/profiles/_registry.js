/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/ncsc-caf-aviation/profiles/_registry.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["ncsc-caf-aviation"] = window.App.Data.instruments["ncsc-caf-aviation"] || {};
window.App.Data.instruments["ncsc-caf-aviation"].profileRegistry = {
  "schema": "caf-profile-registry/2.0",
  "_note": "Expected profiles for the CAF for Aviation instrument, issued by the CAA per tier at CAP1753 Stage 1. Overlay the aviation CAF outcomes by id; they never copy outcome content. Ship as PLACEHOLDERS until populated from the CAA-assigned tier profiles. Tier 3 is NOT here: it uses the separate controls-based Tier 3 Cyber Assessment Tool, a different instrument.",
  "default": "caf-aviation-tier1",
  "tiers": [
    "1",
    "2"
  ],
  "profiles": [
    {
      "id": "caf-aviation-tier1",
      "name": "Tier 1: Operators of Essential Services (NIS)",
      "tier": "1",
      "status": "placeholder",
      "file": "profiles/caf-aviation-tier1.json"
    },
    {
      "id": "caf-aviation-tier2",
      "name": "Tier 2: Directed UK Aerodromes and Air Carriers (more complex)",
      "tier": "2",
      "status": "placeholder",
      "file": "profiles/caf-aviation-tier2.json"
    }
  ]
};
