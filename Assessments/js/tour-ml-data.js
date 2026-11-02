/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-2-1:2024 Security Program maturity
 * tour (program-maturity-ml).
 *
 * A complete, realistic, FINISHED maturity assessment for Northbridge
 * Manufacturing (organisation-wide security programme): all 87 requirements are
 * answered with a maturity level, every not-met / lowest-maturity (ML1)
 * requirement carries a full remediation plan, and the consultant exec-summary
 * blocks are supplied. Reasonably mature in governance, network and access;
 * weakest in event/incident management and change control. Loaded by
 * tour.html.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourML = (function () {
  "use strict";

  var metadata = {
    clientName: "Northbridge Manufacturing",
    siteName: "Security Program (organisation-wide)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-08",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each not-met requirement at the next OT security steering meeting\nScope OT event detection and logging as one funded project, including who reviews the alerts\nBring remote access and control-system change control under a single agreed procedure\nPlan the safety-system separation work into the next shutdown\nRe-assess the programme in twelve months to measure movement against this baseline",
    regulatoryExposure:
      "Northbridge's security programme is reasonably mature in governance, network architecture and user access, but weakest in event and incident management and in change control: the programme would currently struggle to detect, investigate or cleanly change the gas-distribution control systems. For an operator of an essential service the not-met event-detection and logging requirements are the most material, because they bear directly on the ability to notice and respond to an attack before it affects supply or safety.",
    topPriorities:
      "The most urgent priorities are establishing OT event detection and logging (EVENT1.1, EVENT1.4) so that an incident can be seen and investigated, bringing remote access under control (NET3.1), and introducing change control over control-system logic (CM1.4). Separating the safety system from the basic process control network (NET1.3) is the most important architectural fix."
  };

  // Row shapes:
  //   { id, ml }                              answered at a maturity level
  //   { id, ml, ev }                          answered with evidence
  //   { id, ml, ev, rem:{rank,band,owner,action,impact} }   not-met / ML1 (roadmap)
  //   { id, unknown:true, note }              answered Unknown
  //   { id, na:true, note }                   not applicable
  var rows = [
    // ---- SPE1  Organizational security measures ------------------------
    { id: "ORG1.1", ml: "ML3", ev: "ISMS documented and audited annually; OT scope included since 2025." },
    { id: "ORG1.2", ml: "ML2" },
    { id: "ORG1.3", ml: "ML3" },
    { id: "ORG1.4", ml: "ML3" },
    { id: "ORG1.5", ml: "ML2" },
    { id: "ORG1.6", ml: "ML1", ev: "Supply-chain security for OT vendors and integrators is not managed.",
      rem: { rank: 13, band: "Low", owner: "Procurement / Supply Chain Lead",
        action: "Introduce OT supplier security requirements into contracts and onboarding for integrators and maintainers.",
        impact: "Third parties with privileged access are a primary OT attack path." } },
    { id: "ORG2.1", ml: "ML2" },
    { id: "ORG2.2", ml: "ML1", ev: "Processes for discovering security anomalies are ad hoc and informal.",
      rem: { rank: 12, band: "Low", owner: "OT Security Lead",
        action: "Define how anomalies are discovered, recorded and escalated.",
        impact: "Anomalies that are not captured cannot be investigated or learned from." } },
    { id: "ORG2.3", unknown: true, note: "Secure development and support arrangements rest with the control-system vendor and could not be evidenced during the engagement; marked unknown." },
    { id: "ORG2.4", ml: "ML2" },
    { id: "ORG3.1", ml: "ML3" },

    // ---- SPE2  Configuration management --------------------------------
    { id: "CM1.1", ml: "ML3", ev: "Asset inventory baseline maintained in the CMDB; reconciled quarterly." },
    { id: "CM1.2", ml: "ML1", ev: "Infrastructure drawings and documentation are incomplete and out of date.",
      rem: { rank: 14, band: "Low", owner: "Controls Engineering Team",
        action: "Bring OT infrastructure documentation current and maintain it under change control.",
        impact: "Out-of-date documentation misleads defenders and responders during an incident." } },
    { id: "CM1.3", ml: "ML2" },
    { id: "CM1.4", ml: "not-met", ev: "No formal change control over PLC logic; integrators change it directly.",
      rem: { rank: 3, band: "High", owner: "Controls Engineering Team",
        action: "Introduce change control for control-system logic and configuration (request, review, record, verify).",
        impact: "Unmanaged changes can introduce faults or malicious logic with no audit trail." } },

    // ---- SPE3  Network and communications security ---------------------
    { id: "NET1.1", ml: "ML3" },
    { id: "NET1.2", ml: "ML2" },
    { id: "NET1.3", ml: "ML1", ev: "Safety systems are not segmented from the basic process control network.",
      rem: { rank: 5, band: "High", owner: "Controls Engineering Team",
        action: "Segment the safety system from the basic process control network so a control-network compromise cannot reach safety functions.",
        impact: "Without separation, the safety system (the last line of defence) is exposed to a control-network compromise." } },
    { id: "NET1.4", ml: "ML2" },
    { id: "NET1.5", ml: "ML2" },
    { id: "NET1.6", ml: "ML2" },
    { id: "NET1.7", ml: "ML2" },
    { id: "NET1.8", ml: "ML2" },
    { id: "NET1.9", ml: "ML3" },
    { id: "NET2.1", na: true, note: "No wireless networking is used in the control environment." },
    { id: "NET2.2", na: true, note: "No wireless networking is used in the control environment." },
    { id: "NET2.3", na: true, note: "No wireless networking is used in the control environment." },
    { id: "NET3.1", ml: "not-met", ev: "Remote access applications are not controlled; vendors connect with standing tools.",
      rem: { rank: 2, band: "High", owner: "IT/OT Network Team",
        action: "Broker all remote access through a hardened jump host with MFA and per-session approval.",
        impact: "Uncontrolled remote access is a primary external route into the control system." } },
    { id: "NET3.2", ml: "ML1", ev: "Remote access connections are not consistently controlled or time-bound.",
      rem: { rank: 10, band: "Medium", owner: "IT/OT Network Team",
        action: "Make remote connections time-bound, logged and approved per session.",
        impact: "Standing remote connections are an unmonitored entry point into OT." } },
    { id: "NET3.3", ml: "ML2" },

    // ---- SPE4  Component security --------------------------------------
    { id: "COMP1.1", ml: "ML2" },
    { id: "COMP1.2", ml: "ML2" },
    { id: "COMP2.1", unknown: true, note: "Whether components are malware-free could not be established without deeper technical verification; marked unknown." },
    { id: "COMP2.2", ml: "ML2" },
    { id: "COMP2.3", ml: "ML2" },
    { id: "COMP3.1", ml: "ML2" },
    { id: "COMP3.2", ml: "ML2" },
    { id: "COMP3.3", ml: "ML1", ev: "Security patch status is not tracked across OT components.",
      rem: { rank: 11, band: "Low", owner: "Controls Engineering Team",
        action: "Track patch status against the asset inventory and risk-rank outstanding patches.",
        impact: "Unknown patch status hides known, exploitable weaknesses." } },
    { id: "COMP3.4", ml: "ML2" },
    { id: "COMP3.5", ml: "ML2" },

    // ---- SPE5  Data security -------------------------------------------
    { id: "DATA1.1", ml: "ML2" },
    { id: "DATA1.2", ml: "ML2" },
    { id: "DATA1.3", ml: "ML3" },
    { id: "DATA1.4", ml: "ML2" },
    { id: "DATA1.5", ml: "ML1", ev: "Cryptographic mechanisms are used inconsistently in OT; key management is informal.",
      rem: { rank: 15, band: "Low", owner: "OT Security Lead",
        action: "Define where cryptography is required in OT and establish basic key management.",
        impact: "Weak or absent cryptography exposes credentials and engineering data to anyone on the network." } },
    { id: "DATA1.6", ml: "ML2" },
    { id: "DATA1.7", ml: "ML2" },

    // ---- SPE6  User access control -------------------------------------
    { id: "USER1.1", ml: "ML3" },
    { id: "USER1.2", ml: "ML2" },
    { id: "USER1.3", ml: "ML2" },
    { id: "USER1.4", ml: "ML2" },
    { id: "USER1.5", ml: "ML1", ev: "Least privilege is not enforced; broad and standing access is common.",
      rem: { rank: 7, band: "Medium", owner: "OT Security Lead",
        action: "Define least-privilege roles and remove standing broad access on the control system.",
        impact: "Broad access means one compromised account can alter process or safety parameters." } },
    { id: "USER1.6", ml: "ML2" },
    { id: "USER1.7", ml: "ML2" },
    { id: "USER1.8", ml: "ML3" },
    { id: "USER1.9", ml: "ML4", ev: "MFA enforced for all remote and privileged access; metrics reviewed monthly." },
    { id: "USER1.10", ml: "ML2" },
    { id: "USER1.11", ml: "ML2" },
    { id: "USER1.12", ml: "ML2" },
    { id: "USER1.13", ml: "ML2" },
    { id: "USER1.14", ml: "ML2" },
    { id: "USER1.15", ml: "ML2" },
    { id: "USER1.16", ml: "ML2" },
    { id: "USER1.17", ml: "ML2" },
    { id: "USER1.18", ml: "ML3" },
    { id: "USER1.19", ml: "ML2" },
    { id: "USER2.1", ml: "ML2" },
    { id: "USER2.2", ml: "ML2" },
    { id: "USER2.3", ml: "ML2" },
    { id: "USER2.4", ml: "ML2" },

    // ---- SPE7  Event and incident management (weakest) -----------------
    { id: "EVENT1.1", ml: "not-met", ev: "There is no capability to detect security events in the OT environment.",
      rem: { rank: 1, band: "High", owner: "SOC Manager",
        action: "Stand up OT event detection (ICS-aware monitoring feeding a monitored queue).",
        impact: "Without detection, an intrusion in the control environment progresses unnoticed until it affects supply or safety." } },
    { id: "EVENT1.2", ml: "ML2" },
    { id: "EVENT1.3", ml: "ML2" },
    { id: "EVENT1.4", ml: "not-met", ev: "OT logging is not in place; only transient local logs exist.",
      rem: { rank: 4, band: "High", owner: "SOC Manager",
        action: "Enable and centralise OT logging to a protected store with adequate retention.",
        impact: "Without logs there is nothing to detect or investigate an incident with." } },
    { id: "EVENT1.5", ml: "ML2" },
    { id: "EVENT1.6", ml: "ML2" },
    { id: "EVENT1.7", ml: "ML1", ev: "Event analysis is ad hoc; there is no defined triage or analysis practice.",
      rem: { rank: 9, band: "Medium", owner: "SOC Manager",
        action: "Define OT event analysis and triage once logging and monitoring are in place.",
        impact: "Data without analysis means malicious activity is not surfaced to anyone who can act on it." } },
    { id: "EVENT1.8", ml: "ML2" },
    { id: "EVENT1.9", ml: "ML1", ev: "Vulnerability handling for OT is ad hoc; advisories are not tracked against assets.",
      rem: { rank: 8, band: "Medium", owner: "OT Security Lead",
        action: "Establish an OT vulnerability-handling process mapping advisories to the asset inventory.",
        impact: "Untracked vulnerabilities in control devices remain open indefinitely." } },

    // ---- SPE8  System integrity and availability -----------------------
    { id: "AVAIL1.1", ml: "ML2" },
    { id: "AVAIL1.2", ml: "ML2" },
    { id: "AVAIL1.3", ml: "ML3" },
    { id: "AVAIL2.1", ml: "ML3", ev: "Backups are taken nightly and stored offline." },
    { id: "AVAIL2.2", ml: "ML2" },
    { id: "AVAIL2.3", ml: "ML1", ev: "Backups are taken but restoration has never been tested on OT.",
      rem: { rank: 6, band: "Medium", owner: "Controls Engineering Team",
        action: "Test full restore of representative OT systems on a defined cycle and fix what fails.",
        impact: "Untested backups give false assurance; recovery after a destructive incident could fail." } },
    { id: "AVAIL2.4", ml: "ML2" },
    { id: "AVAIL2.5", ml: "ML2" }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    rows.forEach(function (row) {
      var patch;
      if (row.na) {
        patch = { applicable: false, ml: "na" };
        if (row.note) patch.notes = row.note;
      } else if (row.unknown) {
        patch = { applicable: true, ml: "unknown" };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true, ml: row.ml };
        if (row.ev) patch.evidence = row.ev;
        if (row.rem) {
          patch.priorityRank = row.rem.rank;
          patch.priorityBand = row.rem.band;
          patch.owner = row.rem.owner;
          patch.action = row.rem.action;
          patch.impact = row.rem.impact;
        }
      }
      E.setResponse(tid, row.id, patch);
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  return { metadata: metadata, reportNarrative: reportNarrative, rows: rows, apply: apply };
})();
