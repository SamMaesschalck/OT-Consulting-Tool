/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the EU NIS2 Directive Assessment tour (nis2-conformance).
 *
 * A complete, realistic, FINISHED conformance + gap analysis for Northbridge
 * Energy (essential entity, energy sector): every obligation answered with
 * evidence, every Partially/Not Achieved obligation carries a remediation plan,
 * and the consultant exec-summary blocks (entity classification, competent
 * authority, exposure, priorities) are supplied. Weakest area is incident
 * reporting (Article 23). Loaded by tour.html.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourNIS2 = (function () {
  "use strict";

  var metadata = {
    clientName: "Northbridge Energy",
    siteName: "Northbridge Energy plc",
    siteAddress: "Kingsway Generating Station, Northbridge, NB1 4QT",
    siteContact: "J. Harker, Head of OT Security",
    opportunityId: "OPP-2026-0417",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-19",
    documentRevision: "1.0",
    qaReviewBy: "A. Whitfield",
    authorisedBy: "R. Doyle, Practice Lead",
    issuedTo: "J. Harker, Northbridge Energy",
    issuedDate: "2026-06-23",
    confidentiality: "Confidential - Client Restricted"
  };

  var reportNarrative = {
    nextSteps:
      "Assign an owner for the incident-reporting process and have a working procedure within the quarter\nRehearse the 24-hour, 72-hour and one-month reporting sequence as a tabletop, with the management body present\nIssue baseline security requirements to critical suppliers and reflect them at the next contract renewal\nPut the management-body training curriculum in the calendar\nRe-assess before the next supervisory engagement",
    entityClassification: "essential",
    competentAuthority: "the national competent authority for the energy sector",
    regulatoryExposure: "As an essential entity in the energy sector, Northbridge Energy is subject to the full NIS2 supervisory regime, including proactive supervision and the higher tier of administrative fines. The Not Achieved incident-reporting obligations are the most acute exposure: without a working 24-hour, 72-hour and one-month reporting process the entity could not meet its statutory duties during a live incident, which is precisely the area competent authorities scrutinise after a breach.",
    topPriorities: "1) Stand up the incident-reporting process end to end (early warning, 72-hour notification and final report) and rehearse it, as these carry statutory deadlines and are currently Not Achieved. 2) Set and contract baseline security requirements for critical suppliers. 3) Close the management-training and effectiveness-assessment gaps to evidence governance maturity."
  };

  // { id, state, ev, [rem:{rank,band,owner,action,impact}] }
  var rows = [
    { id: "GOV.1", state: "achieved", ev: "Board approved the cybersecurity risk-management measures and supporting policy set at the February 2026 board meeting (minute 2026/14)." },
    { id: "GOV.2", state: "achieved", ev: "Quarterly cyber risk report to the board; OT security KPIs reviewed each meeting with actions tracked to closure." },
    { id: "GOV.3", state: "achieved", ev: "Accountability assigned to the COO as board sponsor, documented in the information security policy and role descriptions." },
    { id: "GOV.4", state: "partially", ev: "Board received a one-off cyber briefing in 2025 but there is no recurring training programme for the management body.",
      rem: { rank: 6, band: "medium", owner: "Company Secretary",
        action: "Establish an annual cyber training curriculum for the board and executive, with attendance recorded.",
        impact: "Management-body members may lack the knowledge to oversee cyber risk: a specific NIS2 governance duty carrying personal accountability." } },
    { id: "GOV.5", state: "achieved", ev: "Annual all-staff security awareness training (96% completion) plus role-based OT training for engineering staff." },

    { id: "MA.1", state: "achieved", ev: "Documented all-hazards risk assessment methodology; OT risk register reviewed six-monthly." },
    { id: "MA.2", state: "achieved", ev: "Information security policy approved by management, version-controlled and communicated via intranet and induction." },

    { id: "MB.1", state: "achieved", ev: "Incident response plan covering detect/analyse/contain/respond/recover; 24x7 monitoring via a managed SOC." },
    { id: "MB.2", state: "partially", ev: "Incidents are logged in the ticketing system but post-incident reviews are inconsistent and rarely feed control changes.",
      rem: { rank: 10, band: "low", owner: "SOC Lead",
        action: "Adopt a standard post-incident review with documented lessons learned tracked to control improvements.",
        impact: "Without a feedback loop the same root causes recur and the response capability does not mature." } },

    { id: "MC.1", state: "achieved", ev: "Nightly backups with an offline immutable copy; last full restoration test completed March 2026." },
    { id: "MC.2", state: "achieved", ev: "DR plans for SCADA and historian with defined RTO/RPO; failover tested annually." },
    { id: "MC.3", state: "partially", ev: "Crisis roles are named in the BC policy but no crisis exercise has been run.",
      rem: { rank: 8, band: "medium", owner: "Operations Director",
        action: "Define crisis decision-making and communications and run a tabletop exercise at least annually.",
        impact: "An untested crisis structure risks paralysis and reputational damage during a major incident." } },

    { id: "MD.1", state: "partially", ev: "Critical suppliers are listed and some hold certifications, but security risk is not assessed consistently at onboarding.",
      rem: { rank: 9, band: "medium", owner: "Procurement Lead",
        action: "Introduce a supplier security risk assessment at onboarding and at contract renewal for critical suppliers.",
        impact: "Unassessed third parties are a primary attack route into OT and a NIS2 supply-chain focus." } },
    { id: "MD.2", state: "unknown", ev: "Supplier contracts were not available for review during the engagement; whether security requirements are set and monitored could not be confirmed." },

    { id: "ME.1", state: "achieved", ev: "Security requirements built into the engineering change process; hardening baselines applied to new systems." },
    { id: "ME.2", state: "achieved", ev: "Vulnerability management with monthly scanning and risk-based patching; a coordinated disclosure inbox is published." },

    { id: "MF.1", state: "partially", ev: "Some controls are audited but there is no programme to assess the effectiveness of the measures as a whole.",
      rem: { rank: 7, band: "medium", owner: "IT Security Manager",
        action: "Establish a measurement and assurance programme (audit, testing, metrics) covering the risk-management measures.",
        impact: "Without effectiveness assessment, control assurance is partial and governance lacks evidence." } },

    { id: "MG.1", state: "achieved", ev: "Cyber hygiene baseline (patching, secure configuration, least privilege) enforced and audited." },
    { id: "MG.2", state: "achieved", ev: "Role-based cybersecurity training programme with tracked completion." },

    { id: "MH.1", state: "unknown", ev: "A cryptography policy is believed to exist but could not be located or confirmed during the visit; to be followed up." },

    { id: "MI.1", state: "achieved", ev: "HR security across the joiner/mover/leaver lifecycle; screening for privileged roles where lawful." },
    { id: "MI.2", state: "achieved", ev: "RBAC with least privilege; quarterly access reviews; PAM for administrative accounts." },
    { id: "MI.3", state: "partially", ev: "An OT asset inventory exists but is not fully classified or consistently maintained for IT assets.",
      rem: { rank: 11, band: "low", owner: "Head of OT",
        action: "Consolidate a classified asset inventory across IT and OT with an owner and review cadence.",
        impact: "Gaps in the asset inventory become unmonitored entry points and weaken patching and response." } },

    { id: "MJ.1", state: "achieved", ev: "MFA enforced for all remote and privileged access via the identity platform." },
    { id: "MJ.2", state: "na", ev: "Secured emergency communication systems are provided by the national grid operator, not this entity; out of scope here." },

    { id: "REP.1", state: "partially", ev: "Staff can recognise major incidents but there is no documented test against the Article 23 significance criteria.",
      rem: { rank: 4, band: "high", owner: "CISO",
        action: "Document significant-incident criteria and triage so incidents are classified against Article 23 promptly.",
        impact: "If a significant incident is not recognised, every downstream reporting deadline is missed by default." } },
    { id: "REP.2", state: "not", ev: "No process exists to submit a 24-hour early warning to the CSIRT or competent authority.",
      rem: { rank: 1, band: "high", owner: "CISO",
        action: "Build and rehearse a 24-hour early-warning process with named contacts and out-of-hours cover.",
        impact: "The entity could not meet the statutory 24-hour early-warning duty during a live incident." } },
    { id: "REP.3", state: "not", ev: "No defined 72-hour incident notification process or content template.",
      rem: { rank: 2, band: "high", owner: "CISO",
        action: "Define the 72-hour notification content and ownership and integrate it with incident response.",
        impact: "Failure to notify within 72 hours is a direct breach of the reporting obligation." } },
    { id: "REP.4", state: "not", ev: "No final-report process for the one-month statutory report.",
      rem: { rank: 3, band: "high", owner: "CISO",
        action: "Establish a final-report template covering root cause, impact and mitigations, owned by incident management.",
        impact: "The entity could not produce a compliant one-month final report to the authority." } },
    { id: "REP.5", state: "partially", ev: "Customer communications exist for outages but not specifically for notifying recipients of significant security incidents.",
      rem: { rank: 5, band: "medium", owner: "Communications Lead",
        action: "Define when and how service recipients are notified of significant incidents and the remedies available to them.",
        impact: "Affected recipients may not receive timely guidance, increasing downstream harm and eroding trust." } }
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
