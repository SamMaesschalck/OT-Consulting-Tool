/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the NIST SP 800-82 Rev 3 OT Overlay Assessment tour
 * (caf-achieved engine, binary Satisfied / Other Than Satisfied).
 *
 * A complete, realistic, FINISHED OT assessment for a fictional water utility
 * (Riverbend Water Authority) against the OT Moderate baseline. Every in-scope
 * control is answered: a curated set of ~18 controls are Other Than Satisfied and
 * carry a full remediation plan; every other in-scope control defaults to
 * Satisfied with evidence. Loaded by tour.html.
 *
 * Demonstration content only - illustrative, not a real engagement.
 */
window.App = window.App || {};
window.App.TourNIST82 = (function () {
  "use strict";

  var metadata = {
    clientName: "Riverbend Water Authority",
    siteName: "OT / SCADA - water treatment and distribution (Moderate)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-10",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each control recorded as Other Than Satisfied\nTrial passive OT monitoring on one treatment site before committing to a full deployment\nBroker vendor and engineer remote access through a hardened jump host and retire the standing accounts\nTest an OT backup restore on a non-production controller and record the outcome\nRe-assess against the OT Overlay in twelve months",
    regulatoryExposure:
      "Riverbend Water Authority operates water treatment and distribution as an essential service and assesses its OT/SCADA environment against the NIST SP 800-82 Rev 3 OT Overlay (Moderate baseline). This is an alignment and gap analysis, not a formal SP 800-53A assessment. The controls that are Other Than Satisfied concentrate around remote access, monitoring and recovery of the control environment, which bear directly on the ability to detect and recover from an attack before it affects supply or public safety.",
    topPriorities:
      "The two most urgent priorities are deploying passive, ICS-aware monitoring of the OT network (SI-4), so that an intrusion in the control environment can be detected, and hardening and brokering all remote access to OT (AC-17), so that vendor and engineer access cannot be abused as a direct path to the process. Testing OT backups and recovery (CP-9) and OT-aware vulnerability management (RA-5) follow close behind."
  };

  var gaps = [
    { id: "SI-4", ev: "There is no security monitoring of the OT network; visibility is limited to local device logs with no view of east-west control traffic.",
      rem: { rank: 1, band: "High", owner: "OT Security Lead",
        action: "Deploy passive, ICS-aware OT network monitoring (span/tap sensors) to baseline normal traffic and surface anomalies to a monitored queue.",
        impact: "With no visibility of the control network, a process-manipulation attack could progress undetected until it affects supply or safety." } },
    { id: "AC-17", ev: "Vendor and engineer remote access uses standing accounts and a shared VPN, not brokered through a hardened jump host with per-session control.",
      rem: { rank: 2, band: "High", owner: "OT Security Lead",
        action: "Broker all OT remote access through a hardened, MFA-protected jump host with time-bound, logged, per-session approval.",
        impact: "Standing remote access to OT is the highest-value target and a direct path to the process for an attacker." } },
    { id: "RA-5", ev: "There is no OT vulnerability management; patching is vendor-gated and ad hoc, with no tracking of known vulnerabilities against the OT asset base.",
      rem: { rank: 3, band: "High", owner: "OT Security Lead",
        action: "Stand up OT-aware vulnerability management: map vendor advisories and CVEs to the asset inventory, risk-rank, and schedule patching or compensating controls in maintenance windows.",
        impact: "Unmanaged, publicly known vulnerabilities in control devices remain open indefinitely." } },
    { id: "CP-9", ev: "Controller configurations and historian data are backed up, but restore has not been tested and some PLC program backups sit only on engineering laptops.",
      rem: { rank: 4, band: "High", owner: "Controls Engineering Team",
        action: "Centralise and protect OT backups (offline/immutable copies of PLC programs and configs) and test full restore of a representative control system.",
        impact: "Untested or scattered backups give false assurance; recovery after a destructive incident could be slow or impossible." } },
    { id: "AU-6", ev: "OT device logs are stored locally with short retention and are not centrally collected or reviewed.",
      rem: { rank: 5, band: "High", owner: "SOC Manager",
        action: "Forward OT logs to a protected collector/SIEM with retention that supports investigation, and define review and alerting.",
        impact: "Locally held, short-retention logs are easily lost or tampered with and rarely survive to investigate an incident." } },
    { id: "MA-4", ev: "Nonlocal maintenance by vendors is common but is not consistently authorised, monitored or terminated on completion.",
      rem: { rank: 6, band: "High", owner: "Controls Engineering Team",
        action: "Require authorised, supervised and time-bound nonlocal maintenance sessions with session logging and confirmed termination.",
        impact: "Unmonitored vendor maintenance sessions are a common OT intrusion path." } },
    { id: "SI-2", ev: "OT patching is inconsistent and driven by vendor visits; there is no defined flaw-remediation window or tracking.",
      rem: { rank: 7, band: "High", owner: "Controls Engineering Team",
        action: "Define an OT flaw-remediation process with risk-based windows and compensating controls where patching is not feasible.",
        impact: "Unpatched control devices remain exposed to known exploits for extended periods." } },
    { id: "CM-8", ev: "An OT asset inventory exists and covers roughly 80% of the estate; it is maintained manually and is not authoritative for firmware or connectivity.",
      rem: { rank: 8, band: "Medium", owner: "Controls Engineering Team",
        action: "Complete and automate the OT asset inventory (firmware, comms paths, ownership) as the authoritative source for risk and vulnerability work.",
        impact: "You cannot protect or detect on assets you do not know about." } },
    { id: "SC-7", ev: "The OT network is separated from corporate at the perimeter, but internal segmentation between control zones is limited.",
      rem: { rank: 9, band: "Medium", owner: "OT Security Lead",
        action: "Introduce a zone/conduit segmentation model between control zones with controlled conduits and monitoring.",
        impact: "Flat OT networks let an attacker who reaches the control network move to safety-relevant systems." } },
    { id: "IR-4", ev: "An IT incident response plan exists; OT scenarios (loss of view/control, safe-state fallback) and OT escalation paths are not covered.",
      rem: { rank: 10, band: "Medium", owner: "Head of Operations",
        action: "Extend incident handling with OT scenarios, OT/safety escalation and authority to move the process to a safe state during a cyber incident.",
        impact: "A plan that stops at IT leaves responders improvising during an OT incident, when safe, fast decisions matter most." } },
    { id: "CP-4", ev: "Business-continuity plans exist but no OT or combined IT/OT/safety incident exercise has been run.",
      rem: { rank: 11, band: "Medium", owner: "Head of Operations",
        action: "Run a tabletop OT incident exercise (e.g. ransomware on engineering systems with loss of view) across operations, engineering, IT and safety.",
        impact: "Untested OT response plans fail under the pressure of a real incident." } },
    { id: "PE-3", ev: "Plant physical access is controlled, but access to some remote pumping/RTU cabinets relies on shared keys without logging.",
      rem: { rank: 12, band: "Medium", owner: "Facilities / OT Security Lead",
        action: "Bring remote OT enclosures under logged, individually attributable physical access control.",
        impact: "Unlogged physical access to field devices enables tampering that bypasses network controls." } },
    { id: "AC-2", ev: "Engineering logins are individual, but HMIs retain shared operator accounts and dormant vendor accounts were found.",
      rem: { rank: 13, band: "Medium", owner: "OT Security Lead",
        action: "Introduce individual authentication where the control system supports it, add compensating controls where it does not, and disable dormant accounts.",
        impact: "Shared and dormant OT accounts prevent attribution and provide unmonitored entry points." } },
    { id: "SR-3", ev: "OT vendors and integrators are engaged on capability and cost; their security and remote-access practices are not assessed or contracted for.",
      rem: { rank: 14, band: "Medium", owner: "Procurement / Supply Chain Lead",
        action: "Introduce OT supplier security requirements (assessment, remote-access controls, vulnerability disclosure, incident notification) into contracts.",
        impact: "Third parties with privileged remote access are a primary OT attack path." } },
    { id: "CA-7", ev: "OT controls are reviewed only at assessment time; there is no continuous-monitoring approach for control effectiveness.",
      rem: { rank: 15, band: "Low", owner: "OT Security Lead",
        action: "Define an OT continuous-monitoring approach with control-effectiveness metrics and a review cadence.",
        impact: "Control drift in the OT estate is only found at the next assessment." } },
    { id: "AT-3", ev: "General awareness reaches OT staff; there is no role-based OT cyber training for engineers and operators.",
      rem: { rank: 16, band: "Low", owner: "OT Security Lead",
        action: "Introduce role-based OT training (secure remote access, removable media, recognising and reporting anomalies).",
        impact: "Staff closest to the process cannot recognise or safely respond to control-system threats without OT-specific training." } },
    { id: "CM-6", ev: "Workstations follow a baseline, but PLCs, RTUs and OT network gear have no documented hardening standard and are largely at vendor defaults.",
      rem: { rank: 17, band: "Medium", owner: "Controls Engineering Team",
        action: "Define and apply OT device hardening baselines (disable unused services/ports, change default credentials, document deviations).",
        impact: "Default-configured controllers expose unnecessary services and default credentials: a low-effort foothold." } },
    { id: "PS-4", ev: "Leaver access revocation is reliable for corporate accounts but slower for OT and vendor accounts.",
      rem: { rank: 18, band: "Low", owner: "OT Security Lead",
        action: "Guarantee prompt revocation of OT and vendor access for leavers and completed engagements.",
        impact: "Delayed revocation leaves privileged OT access open to misuse." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    var overlay = E.getActiveCAFOverlay() || {};
    var inst = E.state.instrument;
    var byId = {}; gaps.forEach(function (g) { byId[g.id] = g; });
    (inst.outcomes || []).forEach(function (o) {
      var ov = overlay[o.id];
      if (!ov || ov.applicable === false) return; // out of the OT Moderate baseline
      var g = byId[o.id];
      if (g) {
        E.setResponse(tid, o.id, { applicable: true, state: "not", evidence: g.ev,
          priorityRank: g.rem.rank, priorityBand: g.rem.band, owner: g.rem.owner, action: g.rem.action, impact: g.rem.impact });
      } else {
        E.setResponse(tid, o.id, { applicable: true, state: "achieved", evidence: o.title + " - implemented; evidence reviewed during the assessment." });
      }
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  return { metadata: metadata, reportNarrative: reportNarrative, gaps: gaps, apply: apply };
})();
