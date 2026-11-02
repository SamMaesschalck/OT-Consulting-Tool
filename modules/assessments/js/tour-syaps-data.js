/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ONR SyAPs tours (caf-achieved engine, 3-band
 * Achieved / Partially achieved / Not achieved).
 *
 * A complete, realistic, FINISHED informal gap assessment for a fictional
 * nuclear dutyholder (Fenwick Nuclear Services Ltd, Ravensmoor licensed site),
 * assessed against the Full-dutyholder profile. One curated set of 20
 * regulatory expectations are Partially / Not achieved and carry a full
 * remediation plan; every other in-scope expectation defaults to Achieved with
 * evidence. The SAME gap set feeds all three ONR instruments - each apply()
 * only touches the expectations that exist in that instrument (Management =
 * FSyP 1-5, Cyber = FSyP 7, Full = all 10), so the focused instruments show
 * their slice and the full posture shows everything. Loaded by tour.html.
 *
 * Demonstration content only - illustrative, fictional, not a real engagement,
 * and NOT an ONR assessment. Contains no SNI or classified material.
 */
window.App = window.App || {};
window.App.TourSyAPS = (function () {
  "use strict";

  // Curated gaps spanning all ten FSyPs. id = expectation id; band drives the
  // remediation priority. Everything not listed defaults to Achieved.
  var gaps = [
    // FSyP 1 - Leadership and Management
    { id: "1.1.3", state: "partially", band: "High", owner: "Head of Security",
      ev: "Security governance is exercised through the site safety committee rather than a dedicated forum; security-specific board oversight and reporting lines are not clearly defined.",
      action: "Establish a distinct security governance forum with defined board-level oversight and reporting.",
      impact: "Without clear board ownership, security decisions and risk acceptance are not held to account." },
    { id: "1.4.2", state: "partially", band: "Medium", owner: "Head of Security",
      ev: "Security events are logged locally, but root-cause analysis and cross-site trending are inconsistent and rarely reported to senior leaders.",
      action: "Establish structured root-cause analysis and trend reporting of security events to senior leadership.",
      impact: "Lessons are not learned systematically, so the same weaknesses recur." },
    { id: "1.5.5", state: "not", band: "Medium", owner: "Security Assurance Lead",
      ev: "Internal security assurance is largely reactive; there is no risk-based assurance schedule covering all Fundamental Security Principles.",
      action: "Implement a risk-based security assurance programme with a defined schedule across all FSyPs.",
      impact: "Undetected drift in arrangements is only found after an event or an ONR inspection." },
    // FSyP 2 - Culture
    { id: "2.1.4", state: "partially", band: "Medium", owner: "Head of Security",
      ev: "Security culture is strong within the security team but awareness among operational and contractor staff is uneven and not measured.",
      action: "Extend the security culture programme to operations and contractors, with periodic measurement.",
      impact: "A strong culture in one team does not protect against insider or human-error risk elsewhere." },
    // FSyP 3 - Human Performance
    { id: "3.2.3", state: "partially", band: "Medium", owner: "Head of HR / Personnel Security",
      ev: "SQEP requirements for security roles are defined, but training records show competence gaps for several back-shift positions.",
      action: "Close the SQEP training gaps for shift security roles and maintain current competence records.",
      impact: "Under-qualified staff on shift weaken the delivery of security functions when it matters most." },
    { id: "3.4.2", state: "partially", band: "Low", owner: "Site Security Manager",
      ev: "Security procedures exist but several are past their review date and are not consistently followed on back shift.",
      action: "Bring all security procedures under document control with a review cadence and shift-level assurance.",
      impact: "Out-of-date procedures diverge from actual practice and undermine reliability." },
    // FSyP 4 - Supply Chain
    { id: "4.2.2", state: "partially", band: "Medium", owner: "Supply Chain Assurance Lead",
      ev: "Supplier security capability is assessed at tender but is not re-verified over long-running contracts.",
      action: "Introduce periodic re-verification of supplier security capability during contract delivery.",
      impact: "Capability assessed years ago may no longer hold, introducing supply-chain risk." },
    { id: "4.3.4", state: "not", band: "Medium", owner: "Supply Chain Assurance Lead",
      ev: "Counterfeit, fraudulent and suspect item (CFSI) risk is recognised, but supply-chain assurance sampling and OPEX feedback are limited.",
      action: "Strengthen supply-chain oversight including CFSI controls and operational-experience feedback loops.",
      impact: "Suspect items or a supply-chain backdoor could be introduced undetected." },
    // FSyP 5 - Reliability, Resilience, Sustainability
    { id: "5.1.5", state: "partially", band: "High", owner: "Physical Security Engineer",
      ev: "Single points of failure in the physical protection system have been identified but resilience improvements are not yet funded.",
      action: "Fund and schedule resilience improvements for the identified single points of failure.",
      impact: "A single component failure could open a gap in defence-in-depth." },
    { id: "5.3.2", state: "not", band: "Low", owner: "Physical Security Engineer",
      ev: "Obsolescence of key security equipment is tracked informally; there is no funded sustainability plan.",
      action: "Establish a funded sustainability and obsolescence plan for security equipment.",
      impact: "Unmanaged obsolescence leads to unplanned failures and emergency spend." },
    // FSyP 6 - Physical Protection Systems
    { id: "6.3.2", state: "partially", band: "High", owner: "Physical Security Engineer",
      ev: "The PPS achieves the required outcome for most areas, but a bespoke solution in one area is not yet fully substantiated against the required outcome.",
      action: "Substantiate the bespoke PPS solution with confidence against the required security outcome.",
      impact: "An unsubstantiated bespoke measure may not deliver the graded outcome it claims." },
    { id: "6.4.3", state: "partially", band: "Medium", owner: "Site Security Manager",
      ev: "Structured vulnerability assessments (including force-on-force) are conducted, but findings are not consistently tracked to closure.",
      action: "Track all vulnerability-assessment findings to closure on a managed register.",
      impact: "Identified weaknesses persist if improvements are not driven to completion." },
    // FSyP 7 - Cyber Security & Information Assurance
    { id: "7.1.4", state: "not", band: "High", owner: "CS&IA Lead",
      ev: "CS&IA risk treatment plans exist but are not resourced with SQEP or tracked to closure at board level.",
      action: "Resource CS&IA risk treatment with SQEP and govern it to closure with board-level reporting.",
      impact: "Identified cyber risks remain open indefinitely without ownership and resourcing." },
    { id: "7.3.1", state: "partially", band: "High", owner: "CS&IA Lead",
      ev: "Characterisation of operational technology (including legacy CBSIS) is incomplete, so risk-informed controls cannot be fully applied.",
      action: "Complete characterisation of legacy OT/CBSIS and apply risk-informed, actively-managed controls.",
      impact: "Uncharacterised control systems cannot be protected to the required outcome." },
    { id: "7.5.3", state: "not", band: "High", owner: "CS&IA Lead",
      ev: "A cyber incident response plan exists but has not been exercised with OT and engineering involvement.",
      action: "Exercise the cyber incident plan including OT scenarios and the relevant supporting agencies.",
      impact: "An untested plan fails under the pressure of a real OT-affecting incident." },
    // FSyP 8 - Workforce Trustworthiness
    { id: "8.2.2", state: "partially", band: "Medium", owner: "Head of HR / Personnel Security",
      ev: "National security vetting is in place, but the process for evaluating insider-risk roles to set the appropriate clearance level is not documented.",
      action: "Document the insider-risk role evaluation that determines vetting and clearance levels.",
      impact: "Inconsistent clearance decisions leave some high-risk roles under-vetted." },
    { id: "8.3.4", state: "partially", band: "Medium", owner: "Head of HR / Personnel Security",
      ev: "Ongoing personnel security relies on annual appraisal; there is no clear route for reporting behaviours of concern between cycles.",
      action: "Establish an ongoing reporting route for behaviours of concern, with defined ONR notification triggers.",
      impact: "Emerging insider risk goes unreported for up to a year between appraisals." },
    // FSyP 9 - Policing and Guarding
    { id: "9.3.2", state: "partially", band: "Low", owner: "Site Security Manager",
      ev: "The guard-force Service Level Agreement exists but does not define resilience across all Government Response Levels.",
      action: "Update the guard-service SLA to define resilience at all Government Response Levels and performance metrics.",
      impact: "Guarding may not scale to a raised response level when it is most needed." },
    // FSyP 10 - Emergency Preparedness and Response
    { id: "10.1.3", state: "partially", band: "Medium", owner: "Emergency Planning Manager",
      ev: "Security contingency plans exist, but event-management strategies to manage escalation and restore control are not fully developed.",
      action: "Develop nuclear-security event-management strategies within the contingency plan.",
      impact: "Without escalation strategies, a security event is harder to bring back under control." },
    { id: "10.2.4", state: "not", band: "Medium", owner: "Emergency Planning Manager",
      ev: "Security exercises take place but do not yet test the full scope of the plan, and supporting agencies are rarely included.",
      action: "Broaden the exercise programme to test the full scope of the plan, involving supporting agencies.",
      impact: "Untested parts of the plan and unrehearsed agencies fail in a real event." }
  ];

  function makeApply(metadata, reportNarrative, basis) {
    return function (E) {
      E.updateMetadata(metadata);
      var tid = E.state.activeTargetId;
      var overlay = E.getActiveCAFOverlay() || {};
      var inst = E.state.instrument;
      var present = {}; (inst.outcomes || []).forEach(function (o) { present[o.id] = true; });
      // Gaps that exist and are in scope for THIS instrument, in list order.
      var applicable = gaps.filter(function (g) { var ov = overlay[g.id]; return present[g.id] && ov && ov.applicable !== false; });
      var byId = {}; applicable.forEach(function (g, i) { byId[g.id] = { g: g, rank: i + 1 }; });
      (inst.outcomes || []).forEach(function (o) {
        var ov = overlay[o.id];
        if (!ov || ov.applicable === false) return;
        var hit = byId[o.id];
        if (hit) {
          E.setResponse(tid, o.id, { applicable: true, state: hit.g.state, evidence: hit.g.ev,
            priorityRank: hit.rank, priorityBand: hit.g.band, owner: hit.g.owner, action: hit.g.action, impact: hit.g.impact });
        } else {
          E.setResponse(tid, o.id, { applicable: true, state: "achieved", evidence: o.title + " - demonstrated; arrangements and evidence reviewed during the assessment." });
        }
      });
      if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
      // Per-assessment evidence register - distinct per instrument, never shared.
      if (basis && E.getBasisOfAssessment) {
        var b = E.getBasisOfAssessment();
        b.interviews = basis.interviews.slice();
        b.documents = basis.documents.slice();
        b.observations = basis.observations.slice();
        if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
      }
    };
  }

  function meta(siteName) {
    return { clientName: "Fenwick Nuclear Services Ltd", siteName: siteName, consultant: "S. Maesschalck",
      dateOfVisit: "2026-06-24", documentRevision: "1.0", confidentiality: "Official-Sensitive (demonstration)" };
  }

  // Distinct evidence registers per assessment - different documents, systems
  // and people for the management review, the cyber review and the full posture.
  var basisMgmt = {
    interviews: [
      { name: "A. Fenwick", role: "Head of Security (FSyP 1)", date: "2026-06-22" },
      { name: "R. Doyle", role: "Head of HR / Personnel Security", date: "2026-06-22" },
      { name: "M. Osei", role: "Supply Chain Assurance Lead", date: "2026-06-23" }
    ],
    documents: [
      { title: "Ravensmoor Site Security Plan (management arrangements extract)", reference: "RSP-MGT v3.2", date: "2026-03-01" },
      { title: "Security governance terms of reference", reference: "GOV-TOR-02", date: "2025-11-10" },
      { title: "Security assurance programme and schedule", reference: "ASSUR-PLAN v1.4", date: "2026-02-18" },
      { title: "Supply chain security procedure", reference: "SCM-SEC-05", date: "2025-09-30" }
    ],
    observations: [
      { name: "Security management system / controlled-document library", method: "Walkthrough of the document register and governance minutes" },
      { name: "Security operations centre (management interfaces)", method: "Observed reporting dashboards and a shift handover" }
    ]
  };
  var basisCyber = {
    interviews: [
      { name: "K. Ndiaye", role: "CS&IA Lead (FSyP 7)", date: "2026-06-23" },
      { name: "T. Barlow", role: "OT / Control Systems Engineer", date: "2026-06-23" },
      { name: "S. Price", role: "IT Security & Incident Response Manager", date: "2026-06-24" }
    ],
    documents: [
      { title: "CS&IA risk management strategy", reference: "CSIA-STRAT v2.0", date: "2026-01-20" },
      { title: "OT asset register and categorisation", reference: "OT-AR v5", date: "2026-04-05" },
      { title: "Cyber security incident response plan", reference: "CSIRP v3.1", date: "2025-12-02" },
      { title: "Information classification and handling procedure", reference: "INFO-CLASS-04", date: "2025-10-15" }
    ],
    observations: [
      { name: "OT network segmentation (control-systems zone)", method: "Reviewed network diagrams and firewall rule extracts; no SNI accessed" },
      { name: "Security monitoring / SIEM", method: "Observed the alerting console and log coverage" }
    ]
  };
  var basisFull = {
    interviews: [
      { name: "A. Fenwick", role: "Head of Security", date: "2026-06-22" },
      { name: "K. Ndiaye", role: "CS&IA Lead", date: "2026-06-23" },
      { name: "J. Hartley", role: "Physical Security Engineer", date: "2026-06-23" },
      { name: "R. Doyle", role: "Head of HR / Personnel Security", date: "2026-06-22" },
      { name: "L. Grant", role: "Emergency Planning Manager", date: "2026-06-24" }
    ],
    documents: [
      { title: "Ravensmoor Site Security Plan", reference: "RSP v3.2", date: "2026-03-01" },
      { title: "OT asset register and categorisation", reference: "OT-AR v5", date: "2026-04-05" },
      { title: "Nuclear security contingency plan", reference: "NSCP v2.7", date: "2025-11-28" },
      { title: "Vulnerability assessment report (last force-on-force)", reference: "VA-2025-04", date: "2025-10-09" },
      { title: "Guard force service level agreement", reference: "GF-SLA v6", date: "2025-08-01" }
    ],
    observations: [
      { name: "Physical protection system (perimeter and vital areas)", method: "Escorted walkdown of the perimeter, portals and a vital area; no SNI accessed" },
      { name: "Central alarm station / emergency control room", method: "Observed command, control and communications arrangements" },
      { name: "OT network segmentation", method: "Reviewed network diagrams and monitoring coverage" }
    ]
  };

  var management = {
    metadata: meta("Ravensmoor Licensed Site - security management review (FSyP 1 to 5)"),
    reportNarrative: {
      regulatoryExposure: "Fenwick Nuclear Services reviews the management and organisational half of its security arrangements (FSyP 1 to 5) against the ONR Security Assessment Principles. This is an informal alignment and gap analysis to support the site security plan, not an ONR assessment. The gaps cluster in security governance, assurance and supply-chain oversight: the organisational foundations ONR expects to be demonstrable.",
      topPriorities: "The most urgent priorities are putting distinct, board-level security governance in place (SyDP 1.1) and funding the resilience improvements already identified in the security system (SyDP 5.1), followed by a risk-based security assurance programme (SyDP 1.5).",
      nextSteps:
        "Agree an owner and a target date for each finding, and reflect them in the site security plan\nSeparate security governance from safety governance at board level, with its own reporting line\nBuild the security assurance programme around the findings in this report so the two stay aligned\nBring supply-chain security oversight into the existing procurement assurance process\nRe-assess FSyP 1 to 5 in twelve months, ahead of the next ONR engagement"
    }
  };
  management.apply = makeApply(management.metadata, management.reportNarrative, basisMgmt);

  var cyber = {
    metadata: meta("Ravensmoor Licensed Site - CS&IA review (FSyP 7)"),
    reportNarrative: {
      regulatoryExposure: "Fenwick Nuclear Services reviews its Cyber Security and Information Assurance arrangements (FSyP 7) against the ONR Security Assessment Principles. This is an informal alignment and gap analysis, not an ONR assessment, and contains no SNI. The gaps concentrate in OT characterisation, cyber risk treatment and incident readiness.",
      topPriorities: "The most urgent priorities are completing the characterisation of legacy operational technology so risk-informed controls can be applied (SyDP 7.3), resourcing and governing cyber risk treatment to closure (SyDP 7.1), and exercising the cyber incident response plan with OT and engineering involvement (SyDP 7.5).",
      nextSteps:
        "Agree an owner and a target date for each finding, and reflect them in the site security plan\nComplete the characterisation of legacy operational technology as the first piece of work, since the other actions depend on it\nResource cyber risk treatment so identified risks are carried to closure rather than recorded\nExercise the cyber incident response plan with OT and engineering staff taking part\nRe-assess FSyP 7 in twelve months"
    }
  };
  cyber.apply = makeApply(cyber.metadata, cyber.reportNarrative, basisCyber);

  var full = {
    metadata: meta("Ravensmoor Licensed Site - whole-of-security posture (all 10 FSyP)"),
    reportNarrative: {
      regulatoryExposure: "Fenwick Nuclear Services assesses its whole-of-security posture against all ten Fundamental Security Principles of the ONR Security Assessment Principles. This is an informal alignment and gap analysis to support the site security plan, not an ONR assessment, and contains no SNI or classified material. The most material gaps sit in cyber (OT characterisation and incident readiness), physical protection resilience, and security governance and assurance.",
      topPriorities: "Across all ten principles the leading priorities are completing OT characterisation and cyber risk treatment (FSyP 7), substantiating and resourcing physical protection resilience (FSyP 5 and 6), and establishing distinct security governance and a risk-based assurance programme (FSyP 1).",
      nextSteps:
        "Agree an owner and a target date for each finding, and reflect them in the site security plan\nStart with OT characterisation and cyber risk treatment under FSyP 7, which the other cyber actions depend on\nSubstantiate and fund the physical protection resilience improvements under FSyP 5 and 6\nStand up distinct security governance and a risk-based assurance programme under FSyP 1\nRe-assess the whole-of-security posture in twelve months, ahead of the next ONR engagement"
    }
  };
  full.apply = makeApply(full.metadata, full.reportNarrative, basisFull);

  return { gaps: gaps, management: management, cyber: cyber, full: full };
})();
