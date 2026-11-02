/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-2-1:2010 CSMS Assessment tour
 * (csms-conformance).
 *
 * A complete, realistic, FINISHED conformance + gap analysis of a Cyber Security
 * Management System for Castlefield Energy: every element is judged Not in place /
 * Partially / Largely / In place, every Not-in-place or Partially element carries
 * a full remediation plan, and the consultant exec-summary blocks are supplied.
 * Reasonably mature in governance, policy and physical security; weakest in
 * monitoring and improving the CSMS (incident response, conformance, review).
 * Loaded by the combined demo page.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourCSMS = (function () {
  "use strict";

  var metadata = {
    clientName: "Castlefield Energy",
    siteName: "Organisation-wide (CSMS)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-25",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each CSMS element recorded as not in place\nStand up the OT incident response and recovery capability first, then exercise it\nSet dates for the first conformance check and management review, and put the cycle in the calendar\nComplete the segmentation work separating the safety system from the control network\nRe-assess the CSMS in twelve months",
    regulatoryExposure: "Castlefield Energy maintains a CSMS that is reasonably mature in governance, policy and physical security but weakest in monitoring and improving the system: incident response, conformance checking and periodic review are not in place. Because the CSMS is the framework that keeps OT security sustained, those Not-in-place elements mean the programme would not detect its own drift, verify its conformance, or respond in a structured way to an incident, which is where an organisation is most exposed over time.",
    topPriorities: "The most urgent priorities are putting an OT incident response and recovery capability in place (4.3.4.5), establishing a periodic CSMS review and improvement cycle (4.4.3) and introducing conformance checking (4.4.2). Completing internal network segmentation and separating the safety system (4.3.3.4) is the most important single countermeasure."
  };

  // { id, state, ev } / { id, state, ev, rem } / { id, unknown:true, note }
  var rows = [
    // ---- Risk analysis -------------------------------------------------
    { id: "E423",  state: "largely",  ev: "A documented risk identification, classification and assessment methodology is applied to the IACS and reviewed, though not every zone is covered to the same depth." },
    { id: "E4322", state: "in-place", ev: "The CSMS scope covering the IACS is documented and agreed." },

    // ---- Addressing risk: business rationale + policy group -------------
    { id: "E422",  state: "in-place", ev: "A documented business case for the CSMS links OT security to safety and production risk." },
    { id: "E4323", state: "largely",  ev: "Security is organised with defined roles, though OT and IT responsibilities still overlap in places." },
    { id: "E4324", state: "partially", ev: "General IT security awareness is delivered, but there is no OT-specific security training for engineering and operations staff.",
      rem: { rank: 8, band: "low", owner: "HR / Training Lead",
        action: "Introduce role-based OT security training for engineering and operations staff, with tracked completion.",
        impact: "Staff who do not understand OT-specific risks cannot recognise or safely respond to control-system threats." } },
    { id: "E4325", state: "largely",  ev: "A business continuity plan covers the essential function, with backups; OT recovery steps are documented but not fully tested." },
    { id: "E4326", state: "in-place", ev: "A documented OT security policy and procedure set is approved, version-controlled and reviewed annually." },
    { id: "E4332", state: "largely",  ev: "Personnel security covers the joiner/mover/leaver lifecycle; screening for privileged OT roles is applied where lawful." },

    // ---- Addressing risk: selected countermeasures group ---------------
    { id: "E4333", state: "in-place", ev: "Control rooms and equipment cabinets are access-controlled and environmentally protected." },
    { id: "E4334", state: "partially", ev: "The OT network is separated from corporate by a firewall, but internal zoning is incomplete and the safety system is not separated from the basic process control network.",
      rem: { rank: 4, band: "high", owner: "Controls Engineering Team",
        action: "Complete internal segmentation (zones and conduits) and separate the safety system from the basic process control network.",
        impact: "Flat internal OT networks let a single compromise spread to the most critical and safety functions." } },
    { id: "E4335", state: "largely",  ev: "Account administration is managed for OT, with periodic reviews; some vendor accounts are still managed manually." },
    { id: "E4336", state: "partially", ev: "Authentication exists but shared operator logins remain on HMIs and MFA is not enforced for remote OT access.",
      rem: { rank: 5, band: "medium", owner: "OT Security Lead",
        action: "Move to individual authentication where the control system supports it and enforce MFA for remote OT access.",
        impact: "Shared logins and single-factor remote access are the most common routes to unauthorised control." } },
    { id: "E4337", state: "largely",  ev: "Authorization is role-based for most systems; least privilege is applied but not yet enforced on every legacy device." },
    { id: "E4342", state: "partially", ev: "Risk treatment decisions are made case by case; there is no documented risk-management and implementation process tying controls to assessed risk.",
      rem: { rank: 7, band: "low", owner: "OT Security Lead",
        action: "Document a risk-management and implementation process linking selected countermeasures to assessed OT risk.",
        impact: "Without a structured process, controls are not prioritised against the risks that actually matter on the plant." } },

    // ---- Addressing risk: implementation group -------------------------
    { id: "E4343", state: "partially", ev: "Security is considered informally in changes, but there is no secure development/maintenance standard or change-control gate for the control systems.",
      rem: { rank: 6, band: "medium", owner: "Controls Engineering Team",
        action: "Adopt a secure development and maintenance standard with a security review step in the change-control process.",
        impact: "Insecure changes and maintenance introduce weaknesses directly into the running control system." } },
    { id: "E4344", state: "unknown", note: "Whether information and document management for the CSMS meets the requirement could not be confirmed; document controls are part-way through a migration to a new system. Marked unknown." },
    { id: "E4345", state: "not-in-place", ev: "There is no OT-specific incident response plan; a response would be improvised.",
      rem: { rank: 1, band: "high", owner: "Head of Operations",
        action: "Develop and rehearse an OT incident response and recovery plan with defined roles, escalation and safe-state decision authority.",
        impact: "Without a plan, an OT incident is handled by improvisation, exactly when safe, fast decisions matter most." } },
    { id: "E442",  state: "not-in-place", ev: "There is no process to check the CSMS against requirements; conformance is assumed, not verified.",
      rem: { rank: 3, band: "high", owner: "CISO",
        action: "Introduce conformance checking (internal audit / self-assessment) of the CSMS against the standard, on a defined cycle.",
        impact: "Unverified conformance gives false assurance and leaves gaps undetected until an incident or audit." } },

    // ---- Monitoring and improving the CSMS -----------------------------
    { id: "E443",  state: "not-in-place", ev: "The CSMS is not periodically reviewed, improved or maintained; it is effectively static since it was set up.",
      rem: { rank: 2, band: "high", owner: "CISO",
        action: "Establish a periodic CSMS review and improvement cycle (management review, metrics, corrective actions).",
        impact: "A CSMS that is not maintained decays as the environment and threats change, and conformance lapses unnoticed." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    rows.forEach(function (row) {
      var patch;
      if (row.unknown) {
        patch = { applicable: true, state: "unknown" };
        if (row.note) patch.notes = row.note;
      } else if (row.na) {
        patch = { applicable: false, state: "na" };
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
