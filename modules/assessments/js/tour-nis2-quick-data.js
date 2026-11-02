/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the EU NIS2 Quick Gap Assessment tour
 * (nis2-conformance, condensed 12-item screen).
 *
 * A complete, realistic, FINISHED first-pass screen for Harbour Water Utilities
 * (essential entity, water sector): every obligation answered with evidence,
 * every Partially/Not Achieved obligation carries a remediation plan, and the
 * consultant exec-summary blocks are supplied. Weakest in incident-reporting
 * readiness and supply-chain security. Loaded by the combined demo page.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourNIS2Quick = (function () {
  "use strict";

  var metadata = {
    clientName: "Harbour Water Utilities",
    siteName: "Harbour Water Utilities plc",
    siteAddress: "Estuary Treatment Works, Harbourside, HB2 7RP",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-25",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Treat this screen as the scoping input to a full NIS2 gap assessment and commission that next\nAssign an owner for the incident-reporting process and rehearse the statutory deadlines\nStart the supplier security review with the critical third parties named in this report\nRe-screen once the full assessment has established the detailed position",
    entityClassification: "essential",
    competentAuthority: "the national competent authority for the water sector",
    regulatoryExposure: "As an essential entity in the water sector, Harbour Water Utilities is subject to the full NIS2 supervisory regime. This quick gap analysis screens the ten Article 21(2) measures plus governance and incident reporting; the most acute exposure is the inability to meet the Article 23 reporting deadlines and the unmanaged supply chain, both of which a competent authority would examine first.",
    topPriorities: "1) Stand up and rehearse the incident-reporting process (24h early warning, 72h notification, one-month final report). 2) Manage supplier security risk for critical third parties. 3) Establish an effectiveness-assessment programme to evidence that the measures actually work."
  };

  // { id, state, ev, [rem:{rank,band,owner,action,impact}] }
  var rows = [
    { id: "GOV.1", state: "partially", ev: "The management body approves the security policy and receives an annual update, but there is no recurring cyber training for management and all-staff training completion is not tracked.",
      rem: { rank: 4, band: "medium", owner: "Company Secretary",
        action: "Introduce recurring cyber training for the management body and track all-staff completion.",
        impact: "Untrained management cannot discharge the NIS2 oversight duty, which carries personal accountability." } },
    { id: "RM.A", state: "achieved", ev: "An all-hazards risk assessment and an approved information security policy are in place and reviewed annually." },
    { id: "RM.B", state: "partially", ev: "An incident response procedure exists, but detection relies on IT alerting only and the response roles are not rehearsed.",
      rem: { rank: 5, band: "medium", owner: "IT Security Manager",
        action: "Extend detection to the OT environment and rehearse the detect-respond-recover roles.",
        impact: "Slow or unpractised response multiplies the impact of a serious incident." } },
    { id: "RM.C", state: "achieved", ev: "Tested backups with an offline copy; DR plans with defined RTO/RPO; crisis roles documented." },
    { id: "RM.D", state: "not", ev: "Supplier security risk is not assessed; third-party access and contracts are not reviewed for security.",
      rem: { rank: 2, band: "high", owner: "Procurement Lead",
        action: "Introduce supplier security risk assessment at onboarding and renewal and set contractual security requirements for critical suppliers.",
        impact: "Unmanaged third parties are a primary attack route and a central NIS2 supply-chain focus." } },
    { id: "RM.E", state: "partially", ev: "Security is considered in major projects, but vulnerability handling is reactive and there is no coordinated disclosure process.",
      rem: { rank: 7, band: "medium", owner: "IT Security Manager",
        action: "Establish managed vulnerability handling with risk-based patching and a coordinated disclosure channel.",
        impact: "Known, unpatched vulnerabilities are a common and avoidable breach route." } },
    { id: "RM.F", state: "not", ev: "There is no programme to assess the effectiveness of the security measures.",
      rem: { rank: 3, band: "high", owner: "IT Security Manager",
        action: "Establish a measurement and assurance programme (audit, testing, metrics) over the risk-management measures.",
        impact: "Untested controls give false assurance and leave governance without evidence of effectiveness." } },
    { id: "RM.G", state: "achieved", ev: "Cyber hygiene baseline (patching, secure configuration, least privilege) is enforced; annual training is delivered." },
    { id: "RM.H", state: "unknown", ev: "A cryptography policy is believed to exist but could not be confirmed during this quick assessment; to be followed up." },
    { id: "RM.I", state: "achieved", ev: "An HR joiner/mover/leaver process, RBAC with least privilege, and an asset inventory are in place." },
    { id: "RM.J", state: "partially", ev: "MFA is enforced for remote access but not yet for all privileged internal access; the emergency communications path is untested.",
      rem: { rank: 6, band: "medium", owner: "IT Security Manager",
        action: "Extend MFA to all privileged access and test the emergency communications path.",
        impact: "Privileged accounts without MFA are the highest-value account-takeover target." } },
    { id: "REP.1", state: "not", ev: "The entity cannot currently identify a significant incident against the criteria or meet the 24h/72h/one-month timeline; the process is undocumented and unrehearsed.",
      rem: { rank: 1, band: "high", owner: "CISO",
        action: "Build and rehearse the end-to-end incident-reporting process (significance criteria, 24h early warning, 72h notification, one-month final report) with named contacts and out-of-hours cover.",
        impact: "The entity could not meet its statutory NIS2 reporting duties during a live incident, which is the area authorities scrutinise after a breach." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    rows.forEach(function (row) {
      var patch = { applicable: row.state !== "na", state: row.state };
      if (row.ev) patch.evidence = row.ev;
      if (row.rem) {
        patch.priorityRank = row.rem.rank;
        patch.priorityBand = row.rem.band;
        patch.owner = row.rem.owner;
        patch.action = row.rem.action;
        patch.impact = row.rem.impact;
      }
      E.setResponse(tid, row.id, patch);
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  return { metadata: metadata, reportNarrative: reportNarrative, rows: rows, apply: apply };
})();
