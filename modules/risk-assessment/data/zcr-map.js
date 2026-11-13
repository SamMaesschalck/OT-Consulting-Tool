/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/zcr-map.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.zcrMap = {
  "schema": "spt-zcr-map/1.0",
  "_note": "The zone and conduit requirements (ZCR) of IEC 62443-3-2:2020 as the risk tool refers to them: id, title and clause number only. This file is the one place a clause number may be written; nothing else in the tool hard-codes one. No requirement wording is held here or anywhere in the tool, because it belongs to the licence holder.",
  "standard": {
    "id": "IEC 62443-3-2:2020",
    "title": "Security for industrial automation and control systems - Part 3-2: Security risk assessment for system design",
    "requirementsClause": "4",
    "requirementsClauseTitle": "Zone, conduit and risk assessment requirements"
  },
  "verified": {
    "on": "2026-11-13",
    "confirmed": "Every ZCR id, title and clause number below, the standard's title, and the order of ZCR 1 to ZCR 7 (Figure 1) were checked against the printed contents list, clause 3 and Figure 1 of the published edition.",
    "notChecked": "The detailed requirement wording beyond ZCR 1.1 and ZCR 2.1 has not been checked line by line.",
    "houseReading": [
      "Which ZCR each page of the tool belongs to (stages below).",
      "Comparing initial risk with tolerable risk for each zone and conduit, and not only for the SUC as a whole.",
      "The order of work inside the detailed risk assessment (ZCR 5).",
      "What the cyber security requirements specification and the zone and conduit characteristics hold, item by item.",
      "How an SL-T is determined, and setting it as one target per foundational requirement.",
      "Who sets the tolerable risk and who approves what.",
      "The separation rows on the zones page (business and control system assets, safety related assets, temporarily connected devices, wireless devices, devices connected via external networks), and when the tool raises each one.",
      "What an approval covers (the tolerable risk, the SL-T and the accepted risks) and the fingerprint that shows a change after it.",
      "The risk matrix, the likelihood and impact scales and the risk-to-SL mapping, which are SolutionsPT house defaults. The standard prescribes no matrix."
    ]
  },
  "stages": {
    "_note": "The ZCR each page of the tool shows as its one quiet reference. A house reading.",
    "suc": "ZCR 1",
    "srs": "ZCR 2",
    "hlreport": "ZCR 2",
    "zones": "ZCR 3",
    "compare": "ZCR 4",
    "risk": "ZCR 5",
    "slt": "ZCR 5.6",
    "spec": "ZCR 6",
    "approval": "ZCR 7"
  },
  "specBlocks": {
    "_note": "The blocks of the requirements specification page and the report, in this order, and the ZCR 6 element each one stands for. A house reading: the blocks are assembled from what the tool captures, not from the standard's wording.",
    "suc": "ZCR 6.2",
    "drawings": "ZCR 6.3",
    "characteristics": "ZCR 6.4",
    "assumptions": "ZCR 6.5",
    "threats": "ZCR 6.6",
    "policies": "ZCR 6.7",
    "tolerable": "ZCR 6.8",
    "regulatory": "ZCR 6.9"
  },
  "requirements": [
    { "id": "ZCR 1", "title": "Identify the SUC", "clause": "4.2" },
    { "id": "ZCR 1.1", "title": "Identify the SUC perimeter and access points", "clause": "4.2.1" },
    { "id": "ZCR 2", "title": "Initial cyber security risk assessment", "clause": "4.3" },
    { "id": "ZCR 2.1", "title": "Perform initial cyber security risk assessment", "clause": "4.3.1" },
    { "id": "ZCR 3", "title": "Partition the SUC into zones and conduits", "clause": "4.4" },
    { "id": "ZCR 3.1", "title": "Establish zones and conduits", "clause": "4.4.2" },
    { "id": "ZCR 3.2", "title": "Separate business and IACS assets", "clause": "4.4.3" },
    { "id": "ZCR 3.3", "title": "Separate safety related assets", "clause": "4.4.4" },
    { "id": "ZCR 3.4", "title": "Separate temporarily connected devices", "clause": "4.4.5" },
    { "id": "ZCR 3.5", "title": "Separate wireless devices", "clause": "4.4.6" },
    { "id": "ZCR 3.6", "title": "Separate devices connected via external networks", "clause": "4.4.7" },
    { "id": "ZCR 4", "title": "Risk comparison", "clause": "4.5" },
    { "id": "ZCR 4.1", "title": "Compare initial risk to tolerable risk", "clause": "4.5.2" },
    { "id": "ZCR 5", "title": "Perform a detailed cyber security risk assessment", "clause": "4.6" },
    { "id": "ZCR 5.1", "title": "Identify threats", "clause": "4.6.2" },
    { "id": "ZCR 5.2", "title": "Identify vulnerabilities", "clause": "4.6.3" },
    { "id": "ZCR 5.3", "title": "Determine consequence and impact", "clause": "4.6.4" },
    { "id": "ZCR 5.4", "title": "Determine unmitigated likelihood", "clause": "4.6.5" },
    { "id": "ZCR 5.5", "title": "Determine unmitigated cyber security risk", "clause": "4.6.6" },
    { "id": "ZCR 5.6", "title": "Determine SL-T", "clause": "4.6.7" },
    { "id": "ZCR 5.7", "title": "Compare unmitigated risk with tolerable risk", "clause": "4.6.8" },
    { "id": "ZCR 5.8", "title": "Identify and evaluate existing countermeasures", "clause": "4.6.9" },
    { "id": "ZCR 5.9", "title": "Reevaluate likelihood and impact", "clause": "4.6.10" },
    { "id": "ZCR 5.10", "title": "Determine residual risk", "clause": "4.6.11" },
    { "id": "ZCR 5.11", "title": "Compare residual risk with tolerable risk", "clause": "4.6.12" },
    { "id": "ZCR 5.12", "title": "Identify additional cyber security countermeasures", "clause": "4.6.13" },
    { "id": "ZCR 5.13", "title": "Document and communicate results", "clause": "4.6.14" },
    { "id": "ZCR 6", "title": "Document cyber security requirements, assumptions and constraints", "clause": "4.7" },
    { "id": "ZCR 6.1", "title": "Cyber security requirements specification", "clause": "4.7.2" },
    { "id": "ZCR 6.2", "title": "SUC description", "clause": "4.7.3" },
    { "id": "ZCR 6.3", "title": "Zone and conduit drawings", "clause": "4.7.4" },
    { "id": "ZCR 6.4", "title": "Zone and conduit characteristics", "clause": "4.7.5" },
    { "id": "ZCR 6.5", "title": "Operating environment assumptions", "clause": "4.7.6" },
    { "id": "ZCR 6.6", "title": "Threat environment", "clause": "4.7.7" },
    { "id": "ZCR 6.7", "title": "Organizational security policies", "clause": "4.7.8" },
    { "id": "ZCR 6.8", "title": "Tolerable risk", "clause": "4.7.9" },
    { "id": "ZCR 6.9", "title": "Regulatory requirements", "clause": "4.7.10" },
    { "id": "ZCR 7", "title": "Asset owner approval", "clause": "4.8" },
    { "id": "ZCR 7.1", "title": "Attain asset owner approval", "clause": "4.8.2" }
  ]
};
