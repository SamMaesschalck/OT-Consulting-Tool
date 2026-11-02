/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the CAF for Aviation (CAP1850) tour (caf-achieved).
 *
 * A complete, realistic, FINISHED alignment + gap analysis for Kingsway Airport
 * Authority (a Tier 1 designated operator): every outcome judged Achieved /
 * Partially / Not Achieved, every gap carries a full remediation plan, and the
 * consultant exec-summary blocks are supplied. Reasonably mature in governance
 * and protection, weakest in detection (objective C). The Tier 1 profile is a
 * placeholder (CAA assigns expected states), so the report shows the profile and
 * the Partially/Not roadmap rather than an actual-vs-expected gap. Loaded by the
 * combined demo page.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourCAFAviation = (function () {
  "use strict";

  var metadata = {
    clientName: "Kingsway Airport Authority",
    siteName: "Designated airport operator (Tier 1)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-25",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each Objective C action with the security lead\nScope monitoring across the airport operational systems as a single funded programme rather than system by system\nExercise the aviation incident response plan as a tabletop before the next CAA engagement\nRe-assess against the Tier 1 profile in twelve months",
    regulatoryExposure: "Kingsway Airport Authority is a Tier 1 designated operator under the CAF for Aviation, so the CAA reviews its cyber resilience against the assigned tier profile. The weakest objective is C (detecting cyber security events): the airport could not currently detect an intrusion in its operational or airport-systems environment, which is the area a CAA review would focus on first and the one most consequential for safety and continuity of operations.",
    topPriorities: "The most urgent priorities are establishing monitoring and alerting across the airport's operational systems (C1.a, C1.c), building the skills to use them (C1.e), and bringing supplier and vulnerability management under control (A4.a, B4.d). Standing up and exercising an aviation-specific incident response capability (D1.c) follows close behind."
  };

  // { id, state, ev } / { id, state, ev, rem } / { id, unknown:true, note } / { id, na:true, note }
  var rows = [
    // ---- A  Managing security risk -------------------------------------
    { id: "A1.a", state: "achieved", ev: "The accountable board owns cyber risk to the operation; it is a standing board agenda item." },
    { id: "A1.b", state: "achieved", ev: "A cyber security lead is appointed with defined roles across IT, airport systems and operations." },
    { id: "A1.c", state: "partially", ev: "Cyber risk reaches the board, but is not yet consistently reflected in capital planning for airport systems.",
      rem: { rank: 17, band: "Low", owner: "CISO", action: "Establish a standing, risk-informed cyber budget line so board-level risk translates into funded action.", impact: "Acknowledged risks stall between assessment and delivery without committed funding." } },
    { id: "A2.a", state: "achieved", ev: "A documented risk-management process covers airport operational and safety-related systems, reviewed annually." },
    { id: "A2.b", state: "achieved", ev: "Internal assurance reviews the cyber controls; findings are tracked to closure." },
    { id: "A3.a", state: "partially", ev: "An asset inventory exists for airport systems but is incomplete for connectivity and firmware.",
      rem: { rank: 16, band: "Low", owner: "OT/Airport Systems Team", action: "Complete and automate the airport-systems asset inventory (connectivity, firmware, ownership).", impact: "Incomplete asset knowledge undermines monitoring, patching and incident response." } },
    { id: "A4.a", state: "not", ev: "Supplier and integrator cyber security for airport systems is not assessed or contracted for.",
      rem: { rank: 5, band: "High", owner: "Procurement Lead", action: "Introduce supplier security requirements (assessment, remote access, incident notification) into airport-systems contracts and onboarding.", impact: "Third parties with privileged remote access are a primary attack path into airport operational systems." } },

    // ---- B  Protecting against cyber attack ----------------------------
    { id: "B1.a", state: "achieved", ev: "Security policies covering airport systems exist, are approved and version-controlled." },
    { id: "B1.b", state: "achieved", ev: "Policies are implemented and adhered to across operational teams, with periodic checks." },
    { id: "B2.a", state: "partially", ev: "SSO and MFA are used for corporate systems; some airport-systems consoles retain shared operator logins.",
      rem: { rank: 15, band: "Low", owner: "Head of Cyber (Aviation)", action: "Move to individual authentication on airport-systems consoles where supported; apply compensating controls where not.", impact: "Shared logins prevent attribution and make credential misuse hard to trace on operational consoles." } },
    { id: "B2.b", state: "achieved", ev: "Devices are managed, inventoried and hardened to a baseline." },
    { id: "B2.c", state: "partially", ev: "Privileged access is restricted for IT, but airport-systems maintenance still uses standing vendor accounts.",
      rem: { rank: 10, band: "Medium", owner: "OT/Airport Systems Team", action: "Move privileged and vendor access to brokered, time-bound, logged sessions via a jump host.", impact: "Standing privileged credentials are the highest-value target in the operational estate." } },
    { id: "B2.d", state: "achieved", ev: "Identity and access management covers the joiner/mover/leaver lifecycle with periodic reviews." },
    { id: "B3.a", state: "achieved", ev: "The data that matters to the operation is identified and owned." },
    { id: "B3.b", state: "partially", ev: "Corporate traffic is encrypted; some legacy airport-systems protocols are unencrypted, relying on segmentation.",
      rem: { rank: 14, band: "Low", owner: "OT/Airport Systems Team", action: "Enable encrypted transport where devices allow; otherwise strengthen segmentation and monitoring and document the residual risk.", impact: "Unencrypted operational traffic can be read or altered by an attacker on the systems network." } },
    { id: "B3.c", state: "achieved", ev: "Stored operational and engineering data is encrypted at rest and access-controlled." },
    { id: "B3.d", state: "na", note: "No mobile devices process or store airport operational data; excluded from scope." },
    { id: "B3.e", state: "achieved", ev: "Media and equipment sanitisation is applied to retired airport-systems hardware." },
    { id: "B4.a", state: "achieved", ev: "Recent airport-systems upgrades were delivered to a secure-by-design specification with zoning." },
    { id: "B4.b", state: "partially", ev: "Servers and workstations are hardened; controllers and operational network gear have no enforced hardening baseline.",
      rem: { rank: 13, band: "Low", owner: "OT/Airport Systems Team", action: "Define and apply hardening baselines (disable unused services/ports, change defaults) for operational devices and network gear.", impact: "Default-configured operational devices expose unnecessary services and known default credentials." } },
    { id: "B4.c", state: "achieved", ev: "Remote access to airport systems is brokered through a hardened jump host with MFA." },
    { id: "B4.d", state: "not", ev: "There is no vulnerability management process for airport operational systems; patching is vendor-gated and ad hoc.",
      rem: { rank: 6, band: "High", owner: "OT/Airport Systems Team", action: "Stand up a vulnerability management process mapping advisories to the asset inventory, risk-ranked, with maintenance-window patching.", impact: "Unmanaged, publicly known vulnerabilities in operational devices are a common route to compromise." } },
    { id: "B5.a", state: "achieved", ev: "Business continuity and disaster recovery plans cover the operation with agreed RTO/RPO." },
    { id: "B5.b", state: "achieved", ev: "The operational architecture is designed for resilience with failsafe modes." },
    { id: "B5.c", state: "partially", ev: "Backups of operational systems are taken but restoration has not been tested.",
      rem: { rank: 11, band: "Medium", owner: "OT/Airport Systems Team", action: "Protect and regularly test restore of operational backups (offline/immutable copies).", impact: "Untested backups give false assurance; recovery after a destructive incident could fail." } },
    { id: "B6.a", state: "achieved", ev: "Security culture is established across the organisation, including operational staff." },
    { id: "B6.b", state: "partially", ev: "General security awareness is delivered, but there is no role-specific training for airport-systems engineers and operators.",
      rem: { rank: 18, band: "Low", owner: "Head of Cyber (Aviation)", action: "Introduce role-based cyber training for airport-systems engineers and operators, with tracked completion.", impact: "Staff closest to the operation cannot recognise or safely respond to threats without OT-aware training." } },

    // ---- C  Detecting cyber security events (weakest) ------------------
    { id: "C1.a", state: "not", ev: "There is no security monitoring of the airport operational network; only local device logs exist.",
      rem: { rank: 1, band: "High", owner: "SOC Manager", action: "Deploy passive, OT-aware monitoring across the operational network, baseline normal traffic, and route anomalies to a monitored queue.", impact: "Without visibility, an intrusion in the operational environment could progress undetected until it affects operations or safety." } },
    { id: "C1.b", state: "partially", ev: "Corporate logs go to the SIEM; operational-systems logs are local with short retention.",
      rem: { rank: 9, band: "Medium", owner: "SOC Manager", action: "Centralise and protect operational logs with retention that supports investigation.", impact: "Local, short-retention logs rarely survive long enough to investigate an incident." } },
    { id: "C1.c", state: "not", ev: "No security alerting exists for the operational environment.",
      rem: { rank: 2, band: "High", owner: "SOC Manager", action: "Build prioritised detection use cases and alerting once monitoring and logging are in place.", impact: "Malicious activity is not surfaced to anyone who can act on it." } },
    { id: "C1.d", state: "partially", ev: "Major incidents would be recognised, but there is no documented criteria or triage for operational security incidents.",
      rem: { rank: 8, band: "Medium", owner: "SOC Manager", action: "Document significant-incident criteria and a triage path for operational security alerts.", impact: "Unclassified incidents delay the response that aviation continuity depends on." } },
    { id: "C1.e", state: "not", ev: "Neither the SOC nor engineering has OT/airport-systems monitoring and detection skills.",
      rem: { rank: 3, band: "High", owner: "SOC Manager", action: "Build detection capability through training and a joint SOC/engineering working model.", impact: "Operational alerts read without context are missed or cause unsafe over-reaction." } },
    { id: "C2.a", state: "unknown", note: "Whether system abnormalities are understood well enough to detect attacks could not be established, as there is no monitoring baseline yet. Marked unknown; dependent on the monitoring work under C1.a." },
    { id: "C2.b", state: "not", ev: "No proactive attack discovery or threat hunting is performed in the operational environment.",
      rem: { rank: 4, band: "High", owner: "SOC Manager", action: "Once monitoring and skills exist, introduce periodic, hypothesis-led threat hunts focused on the most likely intrusion paths.", impact: "A stealthy intrusion that evades alerts can persist in the operational environment for a long time." } },

    // ---- D  Minimising the impact of incidents -------------------------
    { id: "D1.a", state: "partially", ev: "An IT incident response plan exists; aviation operational scenarios and escalation are not yet covered.",
      rem: { rank: 12, band: "Medium", owner: "Head of Operations", action: "Extend the response plan with airport-operational scenarios, escalation paths and safe-state decision authority.", impact: "A plan that stops at IT leaves responders improvising during an operational incident." } },
    { id: "D1.b", state: "achieved", ev: "Response and recovery capability is documented and resourced for the operation." },
    { id: "D1.c", state: "not", ev: "No cyber incident exercise has been run for the airport operational environment.",
      rem: { rank: 7, band: "High", owner: "Head of Operations", action: "Run a tabletop exercise covering an operational cyber incident, involving operations, engineering, IT security and safety, then feed lessons back into the plan.", impact: "Untested plans fail under the pressure of a real incident, when continuity of operations is at stake." } },
    { id: "D2.a", state: "achieved", ev: "A mature root-cause analysis process is applied to cyber-relevant incidents and near-misses." },
    { id: "D2.b", state: "achieved", ev: "Lessons from incidents drive changes to procedures and controls, tracked to closure." }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    rows.forEach(function (row) {
      var patch;
      if (row.na) {
        patch = { applicable: false, state: "na" };
        if (row.note) patch.notes = row.note;
      } else if (row.unknown) {
        patch = { applicable: true, state: "unknown" };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true, state: row.state };
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
