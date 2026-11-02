/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the OT Risk Appetite & Exposure tour
 * (risk-appetite-coherence family). Loaded by tour.html.
 *
 * Wearvale Water - a regional water and wastewater company. The demo is built
 * around the case the instrument exists for, and deliberately not the easy one:
 *
 *   - Exposure characterises at SEVERE. The sector baseline for water is high;
 *     the assessor moves it up on safety-of-life consequence, credible
 *     state-level interest in UK water, and systemic dependency.
 *   - Appetite, as DESCRIBED in interview, characterises at CAUTIOUS. The board
 *     talks about cyber, there is a security budget line, and leadership
 *     genuinely believes it is managing this well.
 *   - On the bands alone that reads ALIGNED, one band off the line.
 *   - But the optional technical layer reveals TOLERANT: years-old firmware,
 *     a flat network behind the DMZ, no OT monitoring, shared engineering
 *     credentials and untested backups. A two-band stated-vs-revealed gap.
 *
 * So the arithmetic says aligned and the reality does not. The assessor records
 * the verdict as UNDER-PROTECTED with their reasoning, which is exactly the
 * judgement the client is paying for: an organisation that believes it is
 * cautious, and is not. That single disagreement between what leadership
 * believes and what the plant shows is the whole value of the technical layer,
 * and it is why the consultant has the final say over the bands.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourRiskAppetite = (function () {
  "use strict";

  var metadata = {
    clientName: "Wearvale Water plc",
    siteName: "Group-wide (water and wastewater operations)",
    siteContact: "H. Nakamura, Chief Operating Officer",
    opportunityId: "OPP-2026-0913",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-09-08",
    documentRevision: "1.0",
    qaReviewBy: "A. Whitfield",
    authorisedBy: "R. Doyle, Practice Lead",
    issuedTo: "H. Nakamura, Wearvale Water plc",
    issuedDate: "2026-09-11",
    confidentiality: "Confidential - Client Restricted"
  };

  // Sector picker, modifiers and the optional technical layer.
  var setup = {
    sectorId: "water",
    includeTech: true,
    modifiers: ["safety-critical", "cni-designated", "state-targeting", "systemic"],
    // The verdict the assessor records, and why. The bands compute "aligned";
    // the technical layer is what makes that reading wrong here.
    verdictOverride: "under-protected",
    verdictRationale:
      "The appetite described by leadership is not the appetite the estate reveals. The board believes it is " +
      "managing cyber risk cautiously, and on the governance evidence alone that is a fair description of its " +
      "intent. The technical review shows something different: firmware years behind, a flat process network " +
      "behind a single DMZ, no monitoring of the control systems, shared engineering credentials and backups " +
      "that have never been restored. Wearvale is an essential service where a compromise could harm public " +
      "health, and the sector draws credible state-level interest. Against that exposure, the organisation is " +
      "carrying materially more risk than it believes it is, and it has come to carry it by drift rather than " +
      "by any decision the board would recognise as its own. The finding is recorded as under-protected on that " +
      "basis."
  };

  // Exposure: ranks 4,4,3,4,3,4. Exposure follows the worst reading, so severe;
  // the two highs (geopolitical, regulatory) are named in the report as not
  // bringing the rating down.
  var exposure = [
    { id: "EXP1", band: "severe",
      evidence: "Interview with H. Nakamura (COO); NIS/CAF self-assessment return CAF-WV-2025.",
      notes: "Regional water and wastewater undertaker serving 1.4m people; drinking-water treatment and sludge " +
             "handling are safety-relevant, and the company is a designated essential service." },
    { id: "EXP2", band: "severe",
      evidence: "Interview with D. Oyelaran (Head of IT Security); national threat reporting for the UK water sector.",
      notes: "Beyond commodity ransomware, UK water has drawn documented interest from capable state-aligned " +
             "actors, and the sector has seen intrusions into treatment control. Wearvale should assume it is " +
             "within scope of that interest rather than below it." },
    { id: "EXP3", band: "high",
      evidence: "Interview with D. Oyelaran; national threat reporting for the UK water sector.",
      notes: "No overseas operations or contested-region exposure, but the sector as a whole is named in " +
             "national threat reporting as a target of interest in a deteriorating geopolitical picture." },
    { id: "EXP4", band: "severe",
      evidence: "Interview with G. Whitcombe (Control Systems Manager); Northburn treatment works control room walkthrough.",
      notes: "Worst credible case is a treatment or dosing compromise with public-health consequence, alongside " +
             "loss of supply to a large population. Environmental consequence from a wastewater release is " +
             "serious and regulator-reportable in its own right." },
    { id: "EXP5", band: "high",
      evidence: "NIS/CAF self-assessment return and DWI correspondence (CAF-WV-2025); AMP8 resilience investment case (AMP8-RES-07).",
      notes: "NIS Regulations, DWI oversight and CAF assessment, plus Ofwat's interest in resilience spend. " +
             "Obligation weight is heavy, though short of the nuclear regime." },
    { id: "EXP6", band: "severe",
      evidence: "Interview with S. Patel (maintenance and integrator liaison); network diagram walkthrough with IT security.",
      notes: "Several hundred remote sites on a shared telemetry network, a large integrator and maintainer " +
             "estate with standing access, and downstream dependency from other utilities on continuity of " +
             "supply." }
  ];

  // Appetite AS DESCRIBED: ranks 2,2,2,3,2,2,2 -> mean 2.14 -> cautious.
  var appetite = [
    { id: "APP1", band: "cautious",
      evidence: "Board risk register and cyber deep-dive papers (BRR-2026-Q2); interviews with H. Nakamura and J. Beattie (audit committee chair).",
      notes: "Cyber is a standing board item with a named executive owner (the COO), and the audit committee " +
             "takes an annual deep-dive. The discussion is substantive, but it centres on assurance status and " +
             "says little about which risks are being accepted." },
    { id: "APP2", band: "cautious",
      evidence: "AMP8 resilience investment case, security lines (AMP8-RES-07); interview with H. Nakamura.",
      notes: "A ring-fenced OT security budget exists and survived the last AMP settlement. Spend has gone to " +
             "governance, assessment and the corporate estate; OT capital has been deferred twice." },
    { id: "APP3", band: "cautious",
      evidence: "OT security remediation register (OT-REM-2026); interview with D. Oyelaran.",
      notes: "IT findings are remediated to defined SLAs. OT findings are managed on a separate register where " +
             "dates move with outage windows, which leadership reads as prudent sequencing rather than delay." },
    { id: "APP4", band: "open",
      evidence: "Board risk register (BRR-2026-Q2) and OT remediation register (OT-REM-2026): no recorded acceptances in either. Confirmed in interview with J. Beattie.",
      notes: "Risk acceptance is informal: no documented acceptances, no expiry dates, no board sign-off on " +
             "carrying a specific OT risk. Where risk is accepted it happens by a deferred date rather than a " +
             "decision anyone recorded." },
    { id: "APP5", band: "cautious",
      evidence: "Interview with G. Whitcombe; OT remediation register (OT-REM-2026), dates tied to outage windows.",
      notes: "Availability leads, as it must for a water undertaker, but security work is scheduled into " +
             "planned outages rather than refused. The constraint is genuine and reasonably handled." },
    { id: "APP6", band: "cautious",
      evidence: "Interviews with H. Nakamura and G. Whitcombe.",
      notes: "Safety culture is strong and cyber is now named in the safety case as a contributing hazard. The " +
             "connection between a cyber event and a public-health outcome is understood at board level." },
    { id: "APP7", band: "cautious",
      evidence: "Post-incident review of the corporate ransomware event (PIR-2024-11); interview with D. Oyelaran.",
      notes: "A 2024 ransomware event on the corporate estate prompted a genuine programme: segmentation of the " +
             "IT/OT boundary, an incident retainer and tabletop exercises. Lessons were taken seriously on the " +
             "IT side." }
  ];

  // Revealed by the technical layer: ranks 4,4,3,4,4 -> mean 3.8 -> tolerant.
  var technical = [
    // The case the choice-or-constraint control exists for. Wearvale's engineers
    // said, fairly, that firmware is held back by the DCS vendor's
    // certification. But nothing compensates for it and nobody tracks it, so it
    // is an unmanaged constraint, and an unmanaged constraint counts as appetite.
    { id: "TECH1", band: "tolerant", disposition: "accepted",
      evidence: "Northburn control room walkthrough: HMI builds and PLC firmware levels reviewed with G. Whitcombe.",
      notes: "Treatment PLC firmware is between four and nine years behind, and several Windows-based HMIs are " +
             "on unsupported builds. There is no OT patch cycle; updates happen when a vendor attends for " +
             "another reason. The engineers pointed to the DCS vendor's certification as the reason firmware is " +
             "held back, which is fair, but nothing compensates for the gap and it is not tracked, so it is " +
             "counted as appetite rather than as a managed constraint." },
    { id: "TECH2", band: "tolerant", disposition: "accepted",
      evidence: "Firewall rule review and network diagram walkthrough of the IT/OT boundary with IT security.",
      notes: "One DMZ separates IT from OT, and behind it the process network is flat: telemetry, treatment " +
             "control and the maintenance estate share address space with no internal zoning." },
    { id: "TECH3", band: "open", disposition: "accepted",
      evidence: "Corporate SOC: monitored sources and alert history reviewed; no OT-originated telemetry found.",
      notes: "Corporate SOC coverage is credible and 24/7. It sees nothing below the DMZ: no OT network " +
             "monitoring, no controller change alerting, and no OT events in the SIEM." },
    { id: "TECH4", band: "tolerant", disposition: "accepted",
      evidence: "Engineering workstation account observed in use at Northburn; integrator VPN described by S. Patel.",
      notes: "Engineering workstations use shared local accounts with a password unchanged since commissioning. " +
             "Integrator remote access is a standing VPN into the process network with no per-session approval." },
    { id: "TECH5", band: "tolerant", disposition: "accepted",
      evidence: "Controller backup store and the engineer's local copies inspected; no restore evidence could be produced.",
      notes: "Controller configurations are backed up ad hoc to an engineer's laptop and a network share. No " +
             "restore has ever been tested, and there is no documented recovery time for a treatment site." }
  ];

  var reportNarrative = {
    // How the engagement was run, answering the method prompt in the report.
    method:
      "The assessment is based on interviews with four board members, the operations and asset directors and the " +
      "people who run and maintain the treatment and network control systems at Wearvale, together with the risk " +
      "register, the last two board risk papers and what could be seen at two treatment works. The assessor also " +
      "looked at how systems are patched, segmented, monitored, accessed and recovered, so that the appetite " +
      "described in interview could be checked against the appetite the systems themselves reveal.",
    // The consultant's two executive-summary paragraphs.
    regulatoryExposure:
      "Wearvale supplies drinking water to 1.4 million people and treats wastewater across the region, so the " +
      "consequence that matters here is public health and the environment rather than lost revenue. It operates " +
      "under the NIS Regulations with DWI oversight, and its next resilience investment case goes to Ofwat within " +
      "the year. That case is where the board can fund the operational technology work that has now been " +
      "deferred twice, or decide on the record to carry the risk for another cycle. Either is " +
      "a legitimate choice. The position this report argues against is the current one, where the risk is carried " +
      "by default and nobody has decided to carry it.",
    topPriorities:
      "Before the investment case is submitted, the board should decide whether to fund segmentation and " +
      "monitoring of the treatment estate or to record a formal, time-limited acceptance of the risk as it stands. " +
      "The shared engineering credentials, the standing integrator VPN and the untested backups do not need to wait " +
      "for that decision. All three can be dealt with inside current budgets.",
    nextSteps:
      "Put the stated-vs-revealed gap to the board as a single decision: accept this level of risk explicitly, or fund closing it\n" +
      "Commission an IEC 62443-3-3 assessment of one treatment site to turn this characterisation into specific, costed work\n" +
      "Close the three findings that need no capital programme: shared engineering credentials, standing integrator VPN, untested backups\n" +
      "Record any risk the board chooses to carry as a dated, owned acceptance with an expiry, not a deferred remediation date\n" +
      "Re-characterise appetite in twelve months, once the OT capital deferred through two AMP cycles has either landed or been consciously declined"
  };

  var basis = {
    interviews: [
      { name: "H. Nakamura", role: "Chief Operating Officer (executive owner for cyber)", date: "2026-09-08" },
      { name: "D. Oyelaran", role: "Head of IT Security", date: "2026-09-08" },
      { name: "G. Whitcombe", role: "Control Systems Manager (treatment)", date: "2026-09-09" },
      { name: "J. Beattie", role: "Non-executive director, audit committee chair", date: "2026-09-09" },
      { name: "S. Patel", role: "Maintenance and integrator liaison", date: "2026-09-10" }
    ],
    documents: [
      { title: "Board risk register and cyber deep-dive papers", reference: "BRR-2026-Q2", date: "2026-06-18" },
      { title: "OT security remediation register", reference: "OT-REM-2026", date: "2026-08-29" },
      { title: "NIS/CAF self-assessment return and DWI correspondence", reference: "CAF-WV-2025", date: "2025-11-04" },
      { title: "AMP8 resilience investment case (security lines)", reference: "AMP8-RES-07", date: "2026-02-20" },
      { title: "Post-incident review, corporate ransomware event", reference: "PIR-2024-11", date: "2024-12-03" }
    ],
    observations: [
      { name: "Northburn treatment works control room", method: "walkthrough with the control systems manager; reviewed HMI builds, PLC firmware levels and the engineering workstation account in use" },
      { name: "IT/OT boundary and DMZ", method: "firewall rule review and network diagram walkthrough with IT security" },
      { name: "Corporate SOC", method: "reviewed monitored sources and alert history for any OT-originated telemetry" },
      { name: "Controller backup store", method: "inspected the share and the engineer's local copies; asked for the most recent restore evidence" }
    ]
  };

  // ---- the 2024 visit ------------------------------------------------------
  // February 2024, before the corporate ransomware event. Cyber reached the
  // board only after audits, risk was accepted by default, and the SOC had not
  // been stood up. Exposure was already severe. Appetite read OPEN, two bands
  // past the line: under-protected, and recorded as such without any need for
  // the assessor's judgement to differ from the bands.
  //
  // So the 2026 comparison shows real movement in governance (open to
  // cautious, acceptance tolerant to open, monitoring tolerant to open) and
  // Wearvale closer to proportion than it was, while the estate has barely
  // moved and the verdict stays under-protected. That is the honest shape of
  // most re-assessments, and the demo should not flatter it.
  //
  // Only the readings that differ are listed; everything else was as now.
  var PRIOR = {
    dateOfVisit: "2024-02-14",
    documentRevision: "1.0",
    opportunityId: "OPP-2024-0172",
    label: "2024 risk appetite review",
    setup: { sectorId: "water", includeTech: true,
             modifiers: ["safety-critical", "cni-designated", "systemic"] },
    deltas: [
      { id: "EXP2", band: "high",
        notes: "Commodity ransomware was the working assumption. State-aligned interest in UK water was discussed, but not yet treated as applying to Wearvale." },
      { id: "APP1", band: "open",
        notes: "Cyber reached the board after the annual audit and not otherwise. Ownership sat with the Head of IT." },
      { id: "APP2", band: "open",
        notes: "No dedicated OT security budget. Spending was argued case by case against other capital." },
      { id: "APP3", band: "open",
        notes: "Findings were logged, but OT dates moved freely and a backlog from 2021 was accepted as normal." },
      { id: "APP4", band: "tolerant",
        notes: "No acceptance process at all. Nobody could say which OT risks had been accepted, or by whom." },
      { id: "APP6", band: "open",
        notes: "Cyber was not in the safety case. Safety engineers saw it as an IT matter." },
      { id: "APP7", band: "open",
        notes: "A 2023 phishing incident was cleaned up locally; nothing changed across the organisation." },
      { id: "TECH3", band: "tolerant", disposition: "accepted",
        notes: "No SOC and no monitoring of any kind below the corporate firewall." }
    ]
  };

  function rowsFor(deltas) {
    var byId = {};
    (deltas || []).forEach(function (d) { byId[d.id] = d; });
    return exposure.concat(appetite).concat(technical).map(function (r) { return byId[r.id] || r; });
  }
  function fillRows(E, tid, rows) {
    rows.forEach(function (row) {
      var patch = { applicable: true, band: row.band, notes: row.notes, evidence: row.evidence || "" };
      if (row.disposition) patch.disposition = row.disposition;
      E.setResponse(tid, row.id, patch);
    });
  }

  // The 2024 visit fills the assessment the tour opened with; the 2026 one is
  // then created alongside it and set to compare against it, so the demo opens
  // on the latest. The snapshot carries 2024's own setup, so 2024 is read with
  // 2024's sector, scope and judgement, not today's.
  function applyPrior(E) {
    var prior = E.activeAssessment ? E.activeAssessment() : null;
    if (!prior) return null;
    E.updateMetadata({ clientName: metadata.clientName, dateOfVisit: PRIOR.dateOfVisit,
                       documentRevision: PRIOR.documentRevision, opportunityId: PRIOR.opportunityId,
                       consultant: metadata.consultant });
    if (E.renameAssessment) E.renameAssessment(prior.id, PRIOR.label);
    var tid = E.state.activeTargetId;
    E.renameTarget(tid, "Wearvale Water plc");
    E.updateRiskAppetiteSetup(PRIOR.setup);
    fillRows(E, tid, rowsFor(PRIOR.deltas));

    var snapshot = {
      source: {
        fileName: "(previous assessment in this file)",
        clientName: metadata.clientName,
        dateOfVisit: PRIOR.dateOfVisit,
        documentRevision: PRIOR.documentRevision,
        savedAt: ""
      },
      instrumentContentVersion: prior.instrumentContentVersion || "",
      targets: (prior.targets || []).map(function (t) { return { id: t.id, name: t.name }; }),
      responses: JSON.parse(JSON.stringify(prior.responses || [])),
      riskAppetiteSetup: JSON.parse(JSON.stringify(prior.riskAppetiteSetup || PRIOR.setup)),
      targetMap: {}
    };

    E.newAssessment(E.state.instrument.id, { dateOfVisit: metadata.dateOfVisit, label: "2026 reassessment" });
    if (E.setBaseline) E.setBaseline(snapshot);
    return snapshot;
  }

  function alreadySeeded(E) {
    // Re-applying would double the answers, re-stamp the setup and mint a
    // second 2024 visit. tour.html guards this too, but a dataset that can be
    // applied twice is a trap.
    var tid = E.state.activeTargetId;
    if ((E.findResponse(tid, "EXP1") || {}).band) return true;
    return !!(E.assessmentsFor && E.assessmentsFor("risk-appetite").length > 1);
  }

  function apply(E) {
    if (alreadySeeded(E)) return;
    applyPrior(E);
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    E.renameTarget(tid, "Wearvale Water plc");

    // Setup first: the technical layer has to be in scope before its items mean
    // anything to the read.
    E.updateRiskAppetiteSetup(setup);

    fillRows(E, tid, exposure.concat(appetite).concat(technical));

    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews = basis.interviews.slice();
      b.documents = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }
  }

  return {
    metadata: metadata, setup: setup, reportNarrative: reportNarrative, basis: basis,
    exposure: exposure, appetite: appetite, technical: technical,
    rows: exposure.concat(appetite).concat(technical),
    prior: PRIOR,
    alreadySeeded: alreadySeeded, apply: apply
  };
})();
