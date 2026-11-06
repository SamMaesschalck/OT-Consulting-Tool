/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the NCSC CAF 4.0 alignment tour.
 *
 * A complete, realistic, FINISHED assessment for a fictional gas-distribution
 * control operator (Northbridge Manufacturing): every contributing outcome is
 * answered, every Partially / Not Achieved outcome carries a full remediation
 * plan (priority, owner, recommended action and business impact), and the
 * consultant exec-summary blocks (regulatory exposure, top priorities) are
 * supplied. Loaded by tour.html, which reaches any view of this demo by hash -
 * #ncsc-caf for the report, #ncsc-caf/caf-principle/C1 for the capture view.
 *
 * Demonstration content only - the judgements, evidence and narrative are
 * illustrative, not a real engagement, and the General CAF profile is used as a
 * readiness baseline (the authoritative regulator profiles are placeholders).
 */
window.App = window.App || {};
window.App.TourCAF = (function () {
  "use strict";

  var metadata = {
    clientName: "Northbridge Manufacturing",
    siteName: "Essential function: gas distribution control",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-05-22",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  // Consultant narrative that fills the executive-summary blocks that would
  // otherwise render as "[Consultant to add ...]" placeholders.
  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each Objective C action at the next OT security steering meeting\nScope OT security monitoring (C1.a) as a funded project, including who watches the alerts and what they do with them\nStand up OT vulnerability management (B4.d), using the existing asset inventory as the starting point\nRe-assess against the CAF in twelve months, or sooner if the sector profile is published",
    regulatoryExposure:
      "Northbridge operates the gas-distribution control function as an essential service, so cyber resilience is in scope of UK NIS oversight for the downstream gas sector, where assessment is made against the CAF. This report uses the General CAF profile as a readiness baseline because the authoritative regulator profile for the sector was not available for this assessment. The concentration of Not Achieved outcomes under Objective C (detecting cyber security events) is the most likely focus of a regulator's assessment, because it bears directly on the ability to recognise an attack on the control environment before it affects supply or safety.",
    topPriorities:
      "The two most urgent priorities are establishing security monitoring across the OT network (C1.a), so that an intrusion in the control environment can be detected, and standing up an OT-aware vulnerability management process (B4.d), so that known weaknesses in PLCs, HMIs and engineering workstations are tracked and risk-managed rather than left unmanaged. Both are prerequisites for meaningful detection and response, and both are achievable within the next two quarters."
  };

  // One row per outcome. Shape:
  //   { id, state, ev, note, rem }
  //   ev   - captured evidence (any state)
  //   note - notes (used to explain Unknown / Not applicable)
  //   rem  - remediation plan for gaps: { rank, band, owner, action, impact }
  var rows = [
    // ---- A  Managing security risk -------------------------------------
    { id: "A1.a", state: "achieved",
      ev: "Board charter was updated in 2024 to make OT and safety-related cyber risk a standing agenda item; the COO holds accountability for control-system resilience and reports to the board quarterly." },
    { id: "A1.b", state: "achieved",
      ev: "A dedicated OT Security Lead was appointed in 2024 with a documented RACI spanning plant engineering, IT security and operations; OT cyber responsibilities are clear and understood." },
    { id: "A1.c", state: "partially",
      ev: "OT cyber risk is presented to the board but is not yet consistently reflected in capital planning; remediation funding is decided case by case rather than through a standing, risk-informed budget.",
      rem: { rank: 21, band: "Low", owner: "CISO",
        action: "Establish a standing, risk-informed OT cyber budget line and decision gate so board-level OT risk translates into funded action.",
        impact: "OT risks are acknowledged but not reliably resourced, so remediation stalls between assessment and delivery." } },
    { id: "A2.a", state: "achieved",
      ev: "OT risk is assessed within the enterprise risk-management process using a documented methodology; control-system scenarios are included and reviewed annually." },
    { id: "A2.b", state: "partially",
      ev: "Threat intelligence is consumed from IT feeds and the NCSC; OT-specific intelligence (ICS advisories, vendor PSIRTs, sector CNI alerts) is not yet systematically tracked.",
      rem: { rank: 22, band: "Low", owner: "IT Security Manager",
        action: "Subscribe to and triage OT/ICS-specific threat intelligence (CISA ICS advisories, vendor PSIRTs, sector CNI alerts) and feed it into the OT risk picture.",
        impact: "Emerging control-system threats may not be recognised until after they are widely exploited." } },
    { id: "A2.c", state: "partially",
      ev: "Internal audit covers IT security controls; OT controls have not been subject to independent assurance or scoped testing.",
      rem: { rank: 17, band: "Medium", owner: "CISO",
        action: "Commission independent, OT-aware assurance (control review and safe, scoped testing) of the control environment on a defined cycle.",
        impact: "Confidence in OT control effectiveness rests on self-assessment, which a regulator's assessment is unlikely to accept on its own." } },
    { id: "A3.a", state: "partially",
      ev: "An OT asset inventory exists and covers roughly 80% of the control estate; it is maintained manually and is not yet authoritative for firmware versions or network connectivity.",
      rem: { rank: 12, band: "Medium", owner: "Controls Engineering Team",
        action: "Complete and automate the OT asset inventory (firmware, comms paths and ownership) and make it the authoritative source for risk and vulnerability work.",
        impact: "Incomplete asset knowledge undermines vulnerability management, monitoring and incident response: you cannot protect or detect on assets you do not know about." } },
    { id: "A4.a", state: "not",
      ev: "OT vendors, integrators and maintenance providers are engaged on capability and cost; their cyber security and remote-access practices are not assessed or contracted for.",
      rem: { rank: 3, band: "High", owner: "Procurement / Supply Chain Lead",
        action: "Introduce OT supplier security requirements (assessment, remote-access controls, vulnerability disclosure, incident notification) into contracts and onboarding for integrators and maintainers.",
        impact: "Third parties with privileged remote access are a primary OT attack path; unmanaged supplier risk directly exposes the control environment." } },
    { id: "A4.b", state: "unknown",
      note: "The control applications are vendor-supplied; the vendors' secure development and support arrangements have not been established and could not be evidenced during this assessment. Marked unknown pending vendor responses: it reduces confidence rather than counting as a failure." },

    // ---- B  Protecting against cyber attack ----------------------------
    { id: "B1.a", state: "achieved",
      ev: "A control-system security policy set exists, explicitly covers OT, and is version-controlled and reviewed; it was last revised in 2025." },
    { id: "B1.b", state: "partially",
      ev: "Policies are published but adherence in the plant is inconsistent: some procedures (change control, removable media) are followed unevenly across shifts.",
      rem: { rank: 19, band: "Low", owner: "Plant Engineering Manager",
        action: "Operationalise the OT policies through shift-level procedures, briefings and spot checks so practice matches the written standard.",
        impact: "Policy on paper without consistent practice leaves predictable gaps that an attacker or auditor will find." } },
    { id: "B2.a", state: "partially",
      ev: "IT uses SSO and MFA; OT retains shared operator accounts on HMIs and some SCADA clients, with individual accountability limited to engineering logins.",
      rem: { rank: 18, band: "Medium", owner: "OT Security Lead",
        action: "Introduce individual authentication where the control system supports it, and compensating controls (logged kiosk sessions, physical access control) where it does not.",
        impact: "Shared accounts prevent attribution and make insider misuse and credential compromise hard to detect or contain." } },
    { id: "B2.b", state: "achieved",
      ev: "Engineering workstations and laptops are managed, inventoried and hardened to a baseline; removable-media controls are enforced on managed OT endpoints." },
    { id: "B2.c", state: "partially",
      ev: "Domain admin is restricted, but engineering workstations still share a local administrator credential and vendor remote access uses standing privileged accounts.",
      rem: { rank: 9, band: "High", owner: "OT Security Lead",
        action: "Eliminate shared local admin on engineering workstations and move vendor/privileged access to brokered, time-bound, logged sessions via the jump host.",
        impact: "Standing privileged credentials are the highest-value target in the OT estate; their compromise gives an attacker direct control." } },
    { id: "B2.d", state: "partially",
      ev: "Joiner/mover/leaver processes are reliable for IT accounts; OT account reviews are ad hoc and dormant vendor accounts were found during this assessment.",
      rem: { rank: 20, band: "Low", owner: "OT Security Lead",
        action: "Bring OT accounts into the periodic access-review cycle and disable dormant/vendor accounts when not in active use.",
        impact: "Orphaned and dormant OT accounts accumulate as unmonitored entry points." } },
    { id: "B3.a", state: "achieved",
      ev: "Operational and safety-relevant data flows are documented; the data that matters to the essential function is identified and owned." },
    { id: "B3.b", state: "partially",
      ev: "Enterprise traffic is encrypted; legacy OT protocols traverse the control network unencrypted by design, with segmentation as the main protection.",
      rem: { rank: 16, band: "Medium", owner: "Controls Engineering Team",
        action: "Where the protocol and devices allow, enable encrypted/authenticated transport; elsewhere strengthen segmentation and monitoring as the compensating control and document the residual risk.",
        impact: "Unencrypted control traffic can be read or manipulated by an attacker who reaches the OT network, affecting process integrity." } },
    { id: "B3.c", state: "achieved",
      ev: "Historian and engineering data stores are encrypted at rest and access-controlled; backups are encrypted." },
    { id: "B3.d", state: "na",
      note: "The control environment does not process or store operational data on mobile devices; no BYOD or mobile working touches OT. Marked not applicable and excluded from scope." },
    { id: "B3.e", state: "partially",
      ev: "IT follows a media sanitisation standard; OT spares and decommissioned controllers are not consistently wiped before disposal or return to vendors.",
      rem: { rank: 23, band: "Low", owner: "Controls Engineering Team",
        action: "Extend the media/equipment sanitisation standard to OT spares and decommissioned devices, including vendor returns.",
        impact: "Configuration, credentials and network detail can leak through discarded or returned OT equipment." } },
    { id: "B4.a", state: "achieved",
      ev: "The most recent control-system upgrade was delivered to a secure-by-design specification with segmentation, a defined zone/conduit model and security acceptance testing." },
    { id: "B4.b", state: "partially",
      ev: "Workstations and servers follow a hardening baseline; PLCs, RTUs and network gear have no documented hardening standard and are largely at vendor defaults.",
      rem: { rank: 11, band: "High", owner: "Controls Engineering Team",
        action: "Define and apply OT device hardening baselines (disable unused services/ports, change default credentials, document deviations) for PLCs, RTUs and OT network equipment.",
        impact: "Default-configured controllers expose unnecessary services and known default credentials: a low-effort foothold for an attacker." } },
    { id: "B4.c", state: "achieved",
      ev: "Remote access to OT is brokered through a hardened jump host with MFA; management interfaces are segmented from the corporate network." },
    { id: "B4.d", state: "not",
      ev: "There is no OT vulnerability management process; patching is vendor-gated and ad hoc, and there is no tracking of known vulnerabilities against the OT asset base.",
      rem: { rank: 2, band: "High", owner: "OT Security Lead",
        action: "Stand up an OT-aware vulnerability management process: map vendor advisories and CVEs to the asset inventory, risk-rank, and schedule patching or compensating controls within maintenance windows.",
        impact: "Unmanaged, publicly known vulnerabilities in control devices remain open indefinitely and are the most common route to OT compromise." } },
    { id: "B5.a", state: "achieved",
      ev: "Business-continuity and disaster-recovery plans cover the essential function, with RTO/RPO for control systems agreed with operations." },
    { id: "B5.b", state: "achieved",
      ev: "The control architecture is redundant with fail-safe states; loss of the corporate network does not stop safe operation of the gas-distribution function." },
    { id: "B5.c", state: "partially",
      ev: "Controller configurations and historian data are backed up, but restore has not been tested for the control systems and some PLC program backups are held only on engineering laptops.",
      rem: { rank: 10, band: "High", owner: "Controls Engineering Team",
        action: "Centralise and protect OT backups (offline/immutable copies of PLC programs and configs) and test full restore of a representative control system on a defined cycle.",
        impact: "Untested backups give false assurance; after a destructive incident, recovery of the control function could be slow or impossible." } },
    { id: "B6.a", state: "achieved",
      ev: "Security awareness is established across the business and includes OT staff; near-miss reporting is encouraged and cyber is discussed alongside safety." },
    { id: "B6.b", state: "partially",
      ev: "All staff complete general security-awareness training; there is no role-specific OT cyber training for engineers and operators.",
      rem: { rank: 24, band: "Low", owner: "OT Security Lead",
        action: "Introduce role-based OT cyber training for engineers and operators (secure remote access, removable media, recognising and reporting anomalies).",
        impact: "Without OT-specific training, the people closest to the process cannot recognise or safely respond to control-system threats." } },

    // ---- C  Detecting cyber security events (weakest objective) ---------
    { id: "C1.a", state: "not",
      ev: "There is no security monitoring of the OT network; logging is limited to local device logs and there is no visibility of east-west traffic in the control environment.",
      rem: { rank: 1, band: "High", owner: "SOC Manager",
        action: "Deploy passive, ICS-aware OT network monitoring (span/tap-based sensors) to baseline normal traffic and surface anomalies into a monitored queue.",
        impact: "With no visibility of the control network, an intrusion or process-manipulation attack could progress undetected until it affects supply or safety." } },
    { id: "C1.b", state: "partially",
      ev: "IT logs are forwarded to the SIEM and retained; OT device logs are stored locally with short retention and are not centrally collected or protected.",
      rem: { rank: 13, band: "Medium", owner: "SOC Manager",
        action: "Centralise and protect OT logs (forward to the SIEM where feasible, otherwise to a protected collector) with retention that supports investigation.",
        impact: "Locally held, short-retention logs are easily lost or tampered with and rarely survive long enough to investigate an incident." } },
    { id: "C1.c", state: "not",
      ev: "No security alerting exists for the OT environment; there are no detection use cases or alert rules for control-system events.",
      rem: { rank: 4, band: "High", owner: "SOC Manager",
        action: "Once OT monitoring and logging are in place, build prioritised OT detection use cases (unauthorised connections, new devices, controller mode changes) that generate actionable alerts.",
        impact: "Even where data exists, the absence of alerting means malicious activity is not surfaced to anyone who can act on it." } },
    { id: "C1.d", state: "not",
      ev: "There is no defined triage process or ownership for OT security alerts; the IT SOC's remit does not currently extend to the control environment.",
      rem: { rank: 5, band: "High", owner: "SOC Manager",
        action: "Extend the SOC remit (or define an OT triage path) with documented severity criteria, OT escalation contacts and a link to the OT incident response plan.",
        impact: "Alerts without triage and ownership are ignored; detection without response gives no protection." } },
    { id: "C1.e", state: "not",
      ev: "Neither the SOC nor plant engineering currently has OT/ICS monitoring and detection skills, and there is no training plan to build them.",
      rem: { rank: 6, band: "High", owner: "SOC Manager",
        action: "Build OT detection capability through training and a joint SOC/engineering working model so alerts are understood in process context.",
        impact: "OT alerts read without process context are missed or cause unsafe over-reaction; the skills gap blocks effective detection." } },
    { id: "C1.f", state: "unknown",
      note: "Whether user and system behaviour is understood well enough to detect deviations could not be established, because there is no monitoring baseline yet to judge it against. Marked unknown: it reduces confidence and depends on the monitoring work under C1.a." },
    { id: "C2.a", state: "not",
      ev: "No proactive threat hunting is performed in the OT environment.",
      rem: { rank: 7, band: "High", owner: "SOC Manager",
        action: "Once monitoring and skills exist, introduce periodic, hypothesis-led threat hunts in the OT environment focused on the most likely intrusion paths.",
        impact: "Without hunting, a patient or stealthy intrusion that evades alerts can persist in the control environment for a long time." } },

    // ---- D  Minimising the impact of incidents -------------------------
    { id: "D1.a", state: "partially",
      ev: "An IT incident response plan exists and is maintained; OT-specific scenarios (loss of view/control, ransomware on engineering systems, safe-state fallback) are not yet covered, and OT escalation contacts are incomplete.",
      rem: { rank: 14, band: "Medium", owner: "Head of Operations",
        action: "Extend the incident response plan with OT scenarios, OT/safety escalation paths and decision authority for moving the process to a safe state during a cyber incident.",
        impact: "A plan that stops at IT leaves responders improvising during an OT incident, when safe, fast decisions matter most." } },
    { id: "D1.b", state: "partially",
      ev: "IT can restore enterprise services; OT recovery depends on individual engineers' knowledge and on vendor support, and is not documented as a repeatable capability.",
      rem: { rank: 15, band: "Medium", owner: "Controls Engineering Team",
        action: "Document and resource OT recovery runbooks (golden configurations, spares, vendor contacts, restore steps) so the control function can be recovered without reliance on individuals.",
        impact: "Recovery that depends on specific people or unplanned vendor help extends downtime to the essential function after an incident." } },
    { id: "D1.c", state: "not",
      ev: "The IT incident response plan is exercised; there has been no OT or combined IT/OT/safety incident exercise.",
      rem: { rank: 8, band: "High", owner: "Head of Operations",
        action: "Run a tabletop OT incident exercise (e.g. ransomware affecting engineering systems with loss of view) involving operations, engineering, IT security and safety, then feed lessons back into the plan.",
        impact: "Untested OT response plans fail under the pressure of a real incident, exactly when the essential function is at risk." } },
    { id: "D2.a", state: "achieved",
      ev: "A mature safety root-cause analysis process is in place and is applied to cyber-relevant incidents and near-misses, with findings recorded and tracked." },
    { id: "D2.b", state: "achieved",
      ev: "Lessons from incidents and near-misses drive changes to procedures and controls; actions are tracked to closure through the existing safety/quality management system." }
  ];

  // The CAF assessment carried out before the 2024 governance changes that
  // several of this year's findings refer to. Only what has MOVED is listed;
  // every other outcome was judged the same then as now.
  var PRIOR = {
    dateOfVisit: "2023-11-14",
    documentRevision: "1.0",
    opportunityId: "OPP-2874",
    label: "2023 CAF assessment",
    deltas: [
      { id: "A1.a", state: "partially",
        ev: "Cyber risk reached the board only through the IT report; control-system and safety-related risk was not separately visible." },
      { id: "A1.b", state: "not",
        ev: "No named owner for OT cyber security; responsibilities were assumed rather than assigned." },
      { id: "A2.a", state: "partially",
        ev: "Enterprise risk management covered IT; control-system scenarios were not part of the methodology." },
      { id: "B1.a", state: "partially",
        ev: "Security policy was written for corporate IT and applied to the plant by assumption." },
      { id: "B2.b", state: "not",
        ev: "Shared engineering and operator accounts were standard practice across the control system." },
      { id: "B3.a", state: "partially",
        ev: "Critical operational data was identified informally; nothing was recorded or reviewed." },
      { id: "B4.a", state: "partially",
        ev: "Control-system builds followed vendor defaults with no hardening standard of the site's own." },
      { id: "B5.b", state: "not",
        ev: "No tested restore capability for control-system data; backups existed but had never been proven." },
      { id: "B6.a", state: "partially",
        ev: "Cyber awareness training was generic corporate e-learning with no OT content." },
      { id: "D2.a", state: "not",
        ev: "Incidents were closed out without a root-cause step, so nothing fed back into the controls." }
    ]
  };

  function priorRows() {
    var byId = {};
    PRIOR.deltas.forEach(function (d) { byId[d.id] = d; });
    return rows.map(function (r) {
      // No row in the archive carries a remediation plan: those were written
      // for THIS year's report, and dragging them back would put 2026 owners
      // and priority ranks on a 2023 assessment.
      var d = byId[r.id];
      return { id: r.id, state: d ? d.state : r.state, ev: d ? d.ev : r.ev, note: d ? "" : r.note };
    });
  }

  // The 2023 assessment fills the assessment the tour opened with, then this
  // year's is created alongside and activated, so the demo opens on the latest.
  function applyPrior(E) {
    var prior = E.activeAssessment();
    if (!prior) return null;
    E.updateMetadata({
      dateOfVisit: PRIOR.dateOfVisit,
      documentRevision: PRIOR.documentRevision,
      opportunityId: PRIOR.opportunityId
    });
    if (E.renameAssessment) E.renameAssessment(prior.id, PRIOR.label);
    applyRows(E, E.state.activeTargetId, priorRows());

    var snapshot = {
      source: {
        fileName: "(previous assessment in this file)",
        clientName: (E.state.project && E.state.project.clientName) || "",
        dateOfVisit: PRIOR.dateOfVisit,
        documentRevision: PRIOR.documentRevision,
        savedAt: ""
      },
      instrumentContentVersion: prior.instrumentContentVersion || "",
      targets: (prior.targets || []).map(function (t) { return { id: t.id, name: t.name }; }),
      responses: JSON.parse(JSON.stringify(prior.responses || [])),
      targetMap: {}
    };

    E.newAssessment(E.state.instrument.id,
      { dateOfVisit: metadata.dateOfVisit, label: "2026 reassessment" });
    if (E.setBaseline) E.setBaseline(snapshot);
    return snapshot;
  }

  // Starting this year's assessment re-activates the instrument, which fires
  // instrument-changed. Anything seeding off that event - the multi-instrument
  // test pages do exactly this - would re-enter apply() and seed again, once
  // per level, until the stack ran out. One flag, and a re-entrant call is a
  // no-op instead.
  var seeding = false;

  // The prior assessment is the marker: once it exists, this dataset has been
  // applied to this project already.
  function alreadySeeded(E) {
    if (!E.assessmentsFor || !E.state.instrument) return false;
    return E.assessmentsFor(E.state.instrument.id).length > 1;
  }

  function apply(E) {
    if (seeding) return;
    seeding = true;
    try { seed(E); } finally { seeding = false; }
  }

  function seed(E) {
    // Applying twice must not produce a second demo. A host that seeds on
    // instrument-changed calls this again every time the consultant reopens
    // the instrument, and without this the second pass minted another 2023
    // assessment alongside the first.
    if (alreadySeeded(E)) return;

    if (E.newAssessment && E.activeAssessment) applyPrior(E);

    E.updateMetadata(metadata);
    applyRows(E, E.state.activeTargetId, rows);
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  function applyRows(E, tid, list) {
    list.forEach(function (row) {
      var patch = { applicable: true, state: row.state };
      if (row.ev) patch.evidence = row.ev;
      if (row.note) patch.notes = row.note;
      if (row.rem) {
        patch.priorityRank = row.rem.rank;
        patch.priorityBand = row.rem.band;
        patch.owner = row.rem.owner;
        patch.action = row.rem.action;
        patch.impact = row.rem.impact;
      }
      E.setResponse(tid, row.id, patch);
    });
  }

  return { metadata: metadata, reportNarrative: reportNarrative, rows: rows, apply: apply,
           prior: PRIOR, priorRows: priorRows };
})();
