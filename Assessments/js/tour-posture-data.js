/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the General OT Security Posture tour (domain-letter).
 *
 * A complete, realistic, FINISHED indicative posture read for Northbridge
 * Manufacturing (organisation-wide): every scored question answered with a band
 * and evidence, every question below the top band carries a full improvement
 * plan (priority, owner, action, impact), and the consultant exec-summary blocks
 * are supplied. Strongest in governance and architecture, weakest in monitoring
 * and response, so the headline is held down to D by the weakest-domain ceiling
 * rather than by the mean - which is what makes the demo exercise the "held
 * down" prose. Loaded by tour.html.
 *
 * It is also the reference for a report that uses everything the tool offers,
 * so it carries the pieces a half-finished assessment would not have:
 *   - basis of assessment (interviews, documents, systems observed)
 *   - proposed next steps
 *   - advice on questions ALREADY at the top band, which surfaces under
 *     "Further recommendations" rather than on the roadmap
 *   - consultant glossary terms for site vocabulary
 * If a new report capability lands, add it here too, or the demo quietly stops
 * being a demonstration of the tool.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourPosture = (function () {
  "use strict";

  var metadata = {
    clientName: "Northbridge Manufacturing",
    siteName: "Organisation-wide (gas distribution control)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-05-21",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each of the priorities above\nCommission a detailed assessment of monitoring and incident response, where this read is weakest\nPlan the safety-system separation work into the next shutdown window\nRe-assess in six months to measure movement against this baseline",
    regulatoryExposure:
      "Northbridge's OT posture is strongest in governance and network architecture and weakest in monitoring and incident response: the organisation would currently struggle to detect or recover from a cyber incident affecting the gas-distribution control function. As an operator of an essential service this matters most for the ability to notice and contain an attack before it affects supply or safety, which is why the indicative grade is held down by the detection and response domains.",
    topPriorities:
      "The most pressing areas are establishing OT monitoring so that an intrusion would be noticed (monitor.1-3) and building a tested OT incident response and recovery capability (respond.1-4). Separating the safety system from the basic process control network (arch.5) is the most urgent single control, because it protects the last line of defence."
  };

  // What the read rests on. The evidence register is what makes an indicative
  // grade repeatable, so the demo shows one filled in rather than empty.
  var basis = {
    interviews: [
      { name: "R. Hendry",   role: "OT Security Lead",          date: "2026-05-21" },
      { name: "A. Kowalski", role: "Control Engineering Lead",  date: "2026-05-21" },
      { name: "S. Nkemelu",  role: "IT Security Manager",       date: "2026-05-21" },
      { name: "D. Traynor",  role: "Plant Manager, Beeston",    date: "2026-05-22" }
    ],
    documents: [
      { title: "OT security policy set",                 reference: "OT-SEC-POL v3.0", date: "2025-11-04" },
      { title: "OT cyber risk assessment",               reference: "RA-OT-2026",      date: "2026-02-13" },
      { title: "Network architecture drawing, IT/OT boundary", reference: "DWG-NET-114 rev G", date: "2025-08-19" },
      { title: "Firewall rule set export, IT/OT boundary", reference: "FW-EXP-2026-05", date: "2026-05-20" },
      { title: "Change control procedure, control systems", reference: "CM-PROC-02 v1.4", date: "2024-06-30" }
    ],
    observations: [
      { name: "Beeston control room and engineering workstations", method: "Walkthrough with the control engineering lead" },
      { name: "IT/OT DMZ historian and jump host",                 method: "Screen-share of the console and rule set" },
      { name: "Marshalling cabinets, Line 4",                      method: "Physical inspection" }
    ]
  };

  // The pack's standing method text ends with a bracketed prompt telling the
  // consultant to describe how THIS session was actually run - and until the
  // report sections became editable there was no way to answer it. The demo
  // answers it, which is also what shows the section-rewrite capability.
  //
  // Replacing a section's opening wording replaces ALL of its leading
  // paragraphs, and "Method and limitations" opens with two, so the limitations
  // paragraph is carried through here verbatim rather than lost.
  var methodSection =
    "The read was taken over two days at Northbridge's Beeston site: a structured interview across the " +
    "seven domains with the OT Security Lead, the control engineering lead and the IT security manager, " +
    "followed by a walkthrough of the control room, the IT/OT demilitarised zone and the Line 4 " +
    "marshalling cabinets. The firewall rule set at the IT/OT boundary and the OT cyber risk assessment " +
    "were reviewed on screen. Each scored answer reflects the consultant's judgement of the response " +
    "given and what could be seen at the time.\n" +
    "This is a point-in-time, interview-based assessment. It reflects what could be established in the " +
    "time available and the evidence offered. It does not verify controls in technical depth; that is " +
    "the role of the detailed assessments. Where coverage was low or answers were uncertain, the grade " +
    "should be treated as provisional.";

  // Terms the consultant added for this engagement, on top of the report's own
  // vocabulary. Site words a reader outside Northbridge would not know.
  var glossaryTerms = [
    { term: "Beeston control room",
      definition: "The manned control room for the gas-distribution control function, and the only place the basic process control system is operated from." },
    { term: "Brokered DMZ historian",
      definition: "The historian in the IT/OT demilitarised zone that both sides read from, so no process data path runs directly between the control network and the corporate network." },
    { term: "Line 4 marshalling cabinet",
      definition: "The cabinet carrying the Line 4 field wiring and remote I/O, referred to on site as MC-04." }
  ];

  // Row shapes:
  //   { id, band, ev }                          scored, evidence only (top band)
  //   { id, band, ev, rem:{rank,band,owner,action,impact} }   scored, below top band
  //   { id, band, ev, adv:{owner,action,impact} }             scored at the TOP band,
  //                                             with advice worth acting on anyway.
  //                                             Not a gap, not on the roadmap - it
  //                                             surfaces under "Further
  //                                             recommendations" instead.
  //   { id, unknown:true, note }                answered Unknown
  //   { id, context:true, note }                context-only (not scored)
  var rows = [
    // ---- Governance and risk -------------------------------------------
    { id: "gov.1", band: 3, ev: "A named OT Security Lead is accountable, appointed in 2024, reporting to the COO." },
    { id: "gov.2", band: 3, ev: "An OT-specific cyber risk assessment has been carried out and is reviewed annually.",
      adv: { owner: "OT Security Lead",
        action: "Bring the next annual review forward so it takes account of the monitoring and response findings in this report.",
        impact: "The risk assessment is sound but predates this read; refreshing it now keeps the register and the improvement plan telling the same story to the board." } },
    { id: "gov.3", band: 2, ev: "OT security policies exist and are largely followed, but not consistently across all shifts.",
      rem: { rank: 15, band: "medium", owner: "OT Security Lead",
        action: "Embed the OT policies in shift-level procedures and spot-check adherence so practice matches the written standard.",
        impact: "Policy that is followed unevenly leaves predictable gaps that an attacker or auditor will find." } },
    { id: "gov.4", unknown: true, note: "Whether OT security features in budgeting and management reporting could not be confirmed during the interview; marked unknown, which lowers confidence rather than counting as a failure." },
    { id: "gov.6", band: 1, ev: "Management of change is well run for safety and availability, and every OT change goes through it. Security is not one of the questions the form asks, so firewall rules, new accounts and vendor connections are approved on operational grounds alone.",
      rem: { rank: 23, band: "medium", owner: "OT Security Lead",
        action: "Add a security question to the OT management-of-change form, with a route to security review for changes touching connectivity, accounts or remote access.",
        impact: "Controls put in place by this assessment will decay within a year if changes can bypass them one approval at a time." } },
    { id: "gov.7", band: 1, ev: "Security awareness is the corporate phishing e-learning, delivered by email. Shift teams without routine mailbox access largely do not complete it, and nothing covers control-system behaviours such as removable media or vendor supervision.",
      rem: { rank: 24, band: "medium", owner: "Plant Manager",
        action: "Run short OT-specific awareness at shift handover covering removable media, vendor supervision and what to do when something looks wrong, and record who has attended.",
        impact: "The people best placed to notice an incident have not been told what to look for or who to tell." } },
    { id: "gov.8", band: 2, ev: "Recent OT contracts carry security clauses drawn from the corporate IT template, and the two main integrators have returned a signed self-declaration. Nothing is verified beyond that, and older framework agreements carry no requirements at all.",
      rem: { rank: 25, band: "low", owner: "Procurement Lead",
        action: "Set a short OT-specific security schedule for control-system work and ask the main suppliers to evidence it, starting at the next contract renewal.",
        impact: "Most hands-on work is done by suppliers, so their practices become the plant's whether or not anyone has asked about them." } },
    { id: "gov.5", context: true, note: "Key OT security stakeholders: plant manager, control-engineering lead, IT security manager and the OT Security Lead." },

    // ---- Asset visibility ----------------------------------------------
    { id: "assets.1", band: 2, ev: "An OT asset inventory exists but is spreadsheet-based and not fully current.",
      rem: { rank: 16, band: "low", owner: "Controls Engineering Team",
        action: "Complete and automate the OT asset inventory and make it the authoritative source for risk and monitoring work.",
        impact: "Incomplete asset knowledge undermines every downstream control: you cannot protect what you do not know about." } },
    { id: "assets.2", band: 1, ev: "The OT network diagram is roughly 18 months out of date.",
      rem: { rank: 13, band: "medium", owner: "Controls Engineering Team",
        action: "Refresh the OT network diagram and keep it current under change control.",
        impact: "An out-of-date diagram misleads both defenders and responders during an incident." } },
    { id: "assets.3", band: 1, ev: "Staff have limited visibility of transient and contractor devices on the OT network.",
      rem: { rank: 14, band: "medium", owner: "OT Security Lead",
        action: "Introduce controls and a log for transient and contractor device connections.",
        impact: "Unknown transient devices are an unmonitored entry point into the control environment." } },
    { id: "assets.4", band: 2, ev: "External and vendor connections are documented, but the record is not regularly reviewed.",
      rem: { rank: 17, band: "low", owner: "OT Security Lead",
        action: "Review and re-baseline the documented vendor and external OT connections periodically.",
        impact: "Undocumented drift in external connections quietly reopens exposure." } },

    // ---- Architecture and segmentation ---------------------------------
    { id: "arch.1", band: 3, ev: "OT is separated from the corporate network by a firewall with a restricted rule set." },
    { id: "arch.2", band: 2, ev: "The OT environment has basic zoning but not a full criticality-based zone model.",
      rem: { rank: 18, band: "low", owner: "Controls Engineering Team",
        action: "Extend zoning to reflect criticality (Purdue levels, cells, safety) so the model limits lateral movement.",
        impact: "Coarse zoning lets a compromise spread further than necessary." } },
    { id: "arch.3", band: 3, ev: "IT/OT data exchange is via a brokered DMZ historian; there is no direct file transfer." },
    { id: "arch.4", band: 3, ev: "Remote access for vendors and staff is via a hardened jump host with MFA.",
      adv: { owner: "OT Security Lead",
        action: "Review the standing vendor accounts on the jump host each quarter and retire any that no longer need access.",
        impact: "The control is well built, but standing access accumulates quietly; a quarterly review keeps the population of accounts matched to who is actually engaged." } },
    { id: "arch.5", band: 1, ev: "The safety system shares a network segment with basic process control, with no logical separation.",
      rem: { rank: 4, band: "high", owner: "Controls Engineering Team",
        action: "Separate the safety system from the basic process control network (logical and/or physical) so a control-network compromise cannot reach safety functions.",
        impact: "Without SIS separation, a compromise of process control could reach the safety system that is the last line of defence." } },

    // ---- Access control ------------------------------------------------
    { id: "access.1", band: 3, ev: "Individual user accounts are used; shared logins have largely been eliminated." },
    { id: "access.2", band: 1, ev: "Access is broader than roles require; least privilege is not enforced on OT.",
      rem: { rank: 9, band: "medium", owner: "OT Security Lead",
        action: "Define and enforce least-privilege roles and remove standing broad access on the control system.",
        impact: "Broad access means one compromised account can alter process or safety parameters." } },
    { id: "access.3", band: 1, ev: "Default and vendor passwords remain on some OT devices.",
      rem: { rank: 10, band: "medium", owner: "Controls Engineering Team",
        action: "Change default and vendor passwords across OT devices and manage them through a credential lifecycle.",
        impact: "Default credentials are among the most exploited weaknesses in OT." } },
    { id: "access.4", band: 2, ev: "A leaver/mover process exists for IT accounts, but OT account reviews are ad hoc.",
      rem: { rank: 19, band: "low", owner: "OT Security Lead",
        action: "Bring OT accounts into the periodic joiner/mover/leaver review cycle.",
        impact: "Dormant OT accounts accumulate as unmonitored entry points." } },
    { id: "access.5", band: 1, ev: "Control engineers sign in with one account for everything: email, the engineering tools and administration of the DCS servers. Two of the four hold a separate administrative account, used inconsistently because the everyday account also works.",
      rem: { rank: 26, band: "high", owner: "IT Security Manager",
        action: "Issue separate administrative accounts to everyone who administers OT, remove standing administrative rights from everyday accounts, and block mail and web access from the administrative ones.",
        impact: "While one account does both jobs, any routine compromise of an engineer's day-to-day working hands over administrative control of the control system." } },
    { id: "access.6", band: 0, ev: "The OT servers and engineering workstations are members of the corporate Active Directory domain, and corporate domain administrators sign in to them routinely for support. There is no tiering model, and no restriction on where a privileged account may authenticate.",
      capture: { authn: "Same domain as corporate IT" },
      rem: { rank: 27, band: "high", owner: "IT Security Manager",
        action: "Tier privileged access so domain administrators sign in only to domain controllers and dedicated admin workstations, and separate OT authentication from corporate IT or place it behind a controlled one-way trust.",
        impact: "A domain administrator signing in to an engineering workstation leaves credentials there for whoever compromises it next. This is the shortest path from an ordinary phishing email in the office to full control of the plant." } },

    // ---- Protective controls -------------------------------------------
    { id: "protect.1", band: 2, ev: "OT patching happens in maintenance windows but is not driven by a tracked process.",
      rem: { rank: 20, band: "low", owner: "OT Security Lead",
        action: "Introduce a tracked OT patch/vulnerability process mapped to the asset inventory.",
        impact: "Untracked patching leaves known weaknesses open indefinitely." } },
    { id: "protect.2", band: 1, ev: "Malware protection is deployed on some OT hosts but not consistently or OT-tuned.",
      rem: { rank: 11, band: "medium", owner: "OT Security Lead",
        action: "Extend OT-aware malware protection to all supported OT hosts.",
        impact: "Unprotected hosts are an easy foothold on the control network." } },
    { id: "protect.3", band: 2, ev: "Removable media is controlled by procedure but not technically enforced.",
      rem: { rank: 21, band: "low", owner: "OT Security Lead",
        action: "Enforce technical removable-media controls at OT endpoints and log usage.",
        impact: "Removable media is a common malware path into otherwise isolated OT networks." } },
    { id: "protect.4", band: 1, ev: "Backups of critical OT systems are taken but restore has not been tested.",
      rem: { rank: 12, band: "medium", owner: "Controls Engineering Team",
        action: "Protect and regularly test restore of critical OT backups (offline/immutable copies).",
        impact: "Untested backups give false assurance after a destructive incident." } },
    { id: "protect.7", band: 2, ev: "The main control room is card-controlled and the DCS cabinets are locked, with keys held by the shift team. The marshalling room on the north side is left unlocked during dayshift for maintenance access, and several patch panels there have live unused ports.",
      rem: { rank: 31, band: "low", owner: "Plant Manager",
        action: "Bring the marshalling room under the same access control as the main cabinets and disable the unused ports on its patch panels.",
        impact: "Physical reach of a network port bypasses every logical control in this report." } },
    { id: "protect.6", band: 1, ev: "Three HMI stations and the historian run operating systems that are past end of support, and one controller family is no longer sold or patched by the vendor. The team can name most of them from memory, but there is no consolidated list, no risk acceptance and no replacement budget.",
      rem: { rank: 28, band: "medium", owner: "Controls Engineering Team",
        action: "List the OT systems that are unsupported or approaching end of life, put a compensating control around each, and take the residual risk and replacement cost to the capital plan.",
        impact: "Unsupported systems cannot be patched, so they can only be protected by controls placed around them, and nothing can be placed around a system nobody has written down." } },
    { id: "protect.5", band: 2, ev: "Some hardening is applied but there is no enforced baseline.",
      rem: { rank: 22, band: "low", owner: "Controls Engineering Team",
        action: "Define and enforce an OT hardening baseline (disable unused services and ports).",
        impact: "Default services are unnecessary attack surface on long-lived OT devices." } },

    // ---- Monitoring and detection (weakest) ----------------------------
    { id: "monitor.1", band: 0, ev: "OT logs are not collected centrally; only local device logs exist.",
      rem: { rank: 2, band: "high", owner: "SOC Manager",
        action: "Forward OT logs to a protected collector/SIEM with retention that supports investigation.",
        impact: "Without collected logs there is nothing to detect or investigate an incident with." } },
    { id: "monitor.2", band: 0, ev: "There is no monitoring that would detect an intrusion or abnormal activity in OT.",
      rem: { rank: 1, band: "high", owner: "SOC Manager",
        action: "Deploy ICS-aware network monitoring and route anomalies to a monitored queue.",
        impact: "An intrusion in the control environment would currently go unnoticed until it caused a safety or availability event." } },
    { id: "monitor.4", band: 0, ev: "Nobody reviews OT security events. The device logs that do exist are opened only once something has already gone wrong, and there is no route for an operator who sees something odd to raise it as a security concern rather than a process fault.",
      rem: { rank: 29, band: "high", owner: "IT Security Manager",
        action: "Once OT logs reach the collector, put a weekly review and a triage owner behind them, and give shift teams a named route to report anything that looks wrong.",
        impact: "Collecting logs nobody reads produces the cost of monitoring with none of the benefit." } },
    { id: "monitor.5", band: 0, ev: "Retention is whatever each device holds before it overwrites: a few days on the HMIs, less on the controllers. An incident discovered a month later could not be reconstructed.",
      rem: { rank: 30, band: "medium", owner: "IT Security Manager",
        action: "Retain collected OT logs for at least six months on storage the OT network cannot modify, covering the DMZ, jump host and engineering workstations first.",
        impact: "OT intrusions are typically found months after they start, by which point the evidence has already rolled over." } },
    { id: "monitor.3", band: 1, ev: "If something happened tonight it is unlikely anyone would notice; there is no out-of-hours OT monitoring.",
      rem: { rank: 5, band: "high", owner: "SOC Manager",
        action: "Establish who watches OT alerts and an out-of-hours escalation path.",
        impact: "Undetected out-of-hours activity can progress to a safety or availability event before anyone responds." } },

    // ---- Response and recovery -----------------------------------------
    { id: "respond.1", band: 1, ev: "The IT incident response plan does not yet explicitly cover OT scenarios.",
      rem: { rank: 6, band: "high", owner: "Head of Operations",
        action: "Extend the IR plan with OT scenarios, OT/safety escalation and safe-state decision authority.",
        impact: "An IT-only plan leaves responders improvising during an OT incident, when safe, fast decisions matter most." } },
    { id: "respond.2", band: 1, ev: "Engineering and security have limited joint incident-working arrangements.",
      rem: { rank: 7, band: "high", owner: "Head of Operations",
        action: "Define and rehearse joint engineering/security incident roles and decision-making.",
        impact: "Poor coordination slows safe response exactly when speed matters most." } },
    { id: "respond.3", band: 0, ev: "There is no tested capability to recover critical OT systems to a known-good state.",
      rem: { rank: 3, band: "high", owner: "Controls Engineering Team",
        action: "Document and test OT recovery (golden images, spares, ordered restart steps).",
        impact: "Without tested recovery, downtime to the essential function after an incident is open-ended." } },
    { id: "respond.4", band: 1, ev: "No OT incident exercises or tabletops have been run.",
      rem: { rank: 8, band: "high", owner: "Head of Operations",
        action: "Run an OT tabletop exercise involving operations, engineering, IT security and safety, then feed lessons back into the plan.",
        impact: "Untested plans fail under the pressure of a real incident." } },
    { id: "respond.5", band: 1, ev: "Operators are confident the plant could be brought to a safe state by hand if the DCS were lost, and one shift has done it during a power event. Nothing is written down, the newer shift teams have never done it, and the procedure that exists assumes the historian is available to read setpoints from.",
      rem: { rank: 32, band: "medium", owner: "Head of Operations",
        action: "Document the degraded and manual modes for each area, remove the dependency on systems that would be unavailable, and walk each shift through them once.",
        impact: "Without a practised fallback, a control-system outage forces recovery decisions under time pressure that a site would not otherwise make." } }
  ];

  // The posture review Acme had done two years earlier, before the OT Security
  // Lead was appointed. Only what has MOVED is listed; everything else was
  // found the same then as now.
  var PRIOR = {
    dateOfVisit: "2024-02-08",
    documentRevision: "1.0",
    opportunityId: "OPP-3021",
    label: "2024 posture review",
    deltas: [
      { id: "gov.1",     band: 0, ev: "No named owner for OT security; responsibility sat informally with control engineering." },
      { id: "gov.2",     band: 0, ev: "No OT-specific risk assessment had been carried out." },
      { id: "gov.3",     band: 1, ev: "Corporate IT policy was assumed to cover OT; nothing was written for the plant." },
      { id: "assets.1",  band: 1, ev: "No consolidated OT asset inventory; each area kept its own list." },
      { id: "arch.1",    band: 2, ev: "A firewall separated OT from corporate, but the rule set was permissive and unreviewed." },
      { id: "arch.4",    band: 1, ev: "Vendor remote access was by individual vendor VPNs with no common control point." },
      { id: "access.1",  band: 1, ev: "Shared operator and engineering logins were normal practice." },
      { id: "protect.3", band: 0, ev: "Removable media was in routine uncontrolled use for transferring project files." },
      { id: "respond.1", band: 0, ev: "No incident response plan covering OT; the IT plan did not mention the plant." }
    ]
  };

  function priorRows() {
    var byId = {};
    PRIOR.deltas.forEach(function (d) { byId[d.id] = d; });
    return rows.map(function (r) {
      var d = byId[r.id];
      // No row in the archive carries a remediation plan or top-band advice:
      // those were written for THIS year's report, and dropping them keeps
      // 2026 owners and target dates off a 2024 assessment.
      var base = { id: r.id, band: r.band, ev: r.ev, unknown: r.unknown,
                   context: r.context, note: r.note };
      if (!d) return base;
      base.band = d.band;
      base.ev = d.ev;
      return base;
    });
  }

  // The 2024 review fills the assessment the tour opened with, then this year's
  // is created alongside and activated, so the demo opens on the latest.
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
    // the instrument, and without this the second pass minted another 2024
    // review alongside the first.
    if (alreadySeeded(E)) return;

    if (E.newAssessment && E.activeAssessment) applyPrior(E);

    E.updateMetadata(metadata);
    applyRows(E, E.state.activeTargetId, rows);
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);

    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews   = basis.interviews.slice();
      b.documents    = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }

    // Both of these ride on the report-section store, so the demo also shows a
    // report carrying the consultant's own customisation.
    if (E.setReportSection) {
      E.setReportSection("terms-used-in-this-report", { terms: glossaryTerms.slice() });
      E.setReportSection("method-and-limitations", { prose: methodSection });
    }

    // The multi-site assessment is a sibling demo, not the one to land on:
    // creating it activates it, so hand the tour back to this year's
    // organisation-wide review afterwards.
    var mainId = E.activeAssessment && E.activeAssessment() ? E.activeAssessment().id : null;
    applyMultiSite(E);
    if (mainId && E.activateAssessment) E.activateAssessment(mainId);
  }

  // How the two plants differ from the organisation-wide read. Only the
  // differences are listed; everything else is answered the same at both, which
  // is what makes the roll-up worth looking at - the handful of rows where one
  // plant is carrying a gap alone are easy to lose in two separate reports.
  var SITE_DELTAS = {
    "Plant A - Teesside": [
      { id: "arch.5", band: 3, ev: "The safety system sits on its own segregated network with a one-way gateway to the DCS; this was rebuilt during the 2025 turnaround." },
      { id: "protect.4", band: 2, ev: "Backups run nightly to the site NAS and a quarterly restore test is recorded in the maintenance system." },
      { id: "access.6", band: 1, ev: "Teesside runs a separate OT domain with a one-way trust from corporate; domain admins from IT cannot sign in to OT hosts, though OT admins still use one account for everything." }
    ],
    "Plant B - Immingham": [
      { id: "monitor.1", band: 2, ev: "Immingham forwards OT logs to the corporate SIEM as part of the 2025 pilot; the collector covers the DMZ, jump host and engineering workstations." },
      { id: "monitor.4", band: 1, ev: "The SIEM raises tickets for OT sources, but nobody reviews them on a cadence and there is no OT triage owner." },
      { id: "assets.1", band: 0, ev: "No asset inventory of any kind for the Immingham OT estate; the 2019 commissioning list is the only record and is known to be wrong." },
      { id: "protect.6", band: 0, ev: "Unsupported HMIs and an end-of-life historian are known to be present but have never been listed, risk-accepted or planned for replacement." }
    ]
  };

  // Two further assessments, ONE PER SITE, alongside the two that cover the
  // organisation. A site is a facility, and the site is named on the
  // assessment, so a second plant is a second assessment rather than a second
  // target - the same assessment shape whether a customer has one site or six.
  // These are what the organisation-wide roll-up and exports read: each
  // requirement at its weakest plant, with the plant that set it named.
  function applyMultiSite(E) {
    if (!E.newAssessment) return;

    Object.keys(SITE_DELTAS).forEach(function (siteName, i) {
      E.newAssessment("general-ot-posture", {
        label: siteName + " 2026",
        dateOfVisit: "2026-06-18"
      });
      E.updateMetadata({
        siteName: siteName,
        dateOfVisit: "2026-06-18",
        documentRevision: "1.0",
        opportunityId: "OPP-441" + i,
        consultant: metadata.consultant
      });

      // Each plant starts from the organisation-wide picture and takes its own
      // deltas. Two plants of one company share most of their answers;
      // inventing wholly separate answer sets would make the roll-up look
      // busier than a real one and bury the rows that matter.
      var byId = {};
      SITE_DELTAS[siteName].forEach(function (d) { byId[d.id] = d; });
      applyRows(E, E.state.activeTargetId, rows.map(function (r) {
        var d = byId[r.id];
        if (!d) return { id: r.id, band: r.band, ev: r.ev, unknown: r.unknown,
                         context: r.context, note: r.note };
        return { id: r.id, band: d.band, ev: d.ev };
      }));
      if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
    });
  }

  function applyRows(E, tid, list) {
    list.forEach(function (row) {
      var patch;
      if (row.context) {
        patch = { applicable: true };
        if (row.note) patch.notes = row.note;
      } else if (row.unknown) {
        patch = { applicable: true, unknown: true };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true, band: row.band };
        if (row.ev) patch.evidence = row.ev;
        if (row.rem) {
          patch.priorityRank = row.rem.rank;
          patch.priorityBand = row.rem.band;
          patch.owner = row.rem.owner;
          patch.action = row.rem.action;
          patch.impact = row.rem.impact;
        }
        // Advice on something already at the top band. No priority rank and no
        // band: it is not outstanding work, so it must not read as a gap.
        if (row.adv) {
          patch.owner = row.adv.owner;
          patch.action = row.adv.action;
          patch.impact = row.adv.impact;
        }
      }
      E.setResponse(tid, row.id, patch);
      // Capture fields are a separate store, so a row carrying them has to
      // write them separately - without this the demo's answer to "how does OT
      // authenticate?" would silently not be recorded.
      if (row.capture && E.setCaptureField) {
        Object.keys(row.capture).forEach(function (fieldId) {
          E.setCaptureField(tid, row.id, fieldId, row.capture[fieldId]);
        });
      }
    });
  }

  return { metadata: metadata, reportNarrative: reportNarrative, basis: basis,
           glossaryTerms: glossaryTerms, methodSection: methodSection,
           rows: rows, apply: apply, prior: PRIOR, priorRows: priorRows,
           siteDeltas: SITE_DELTAS };
})();
