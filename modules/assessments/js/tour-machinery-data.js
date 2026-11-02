/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the EU Machinery Regulation Gap Assessment tour
 * (layered conformance family, sibling of the CRA dataset).
 *
 * A complete, realistic, FINISHED gap assessment for one machine: Meridian
 * Handling Systems' "AutoStak AS-90", an autonomous pallet-stacking vehicle
 * whose person-detection safety function uses a machine-learning perception
 * system. That system puts the machine in Annex I Part A (points 5-6), so
 * third-party conformity assessment is mandatory - but the manufacturer has
 * carried its Directive-era self-assessment habits forward. The dataset
 * deliberately shows STRONG classical machine safety (EN ISO 3691-4 design,
 * tested stops), PARTIAL delivery of the new digital requirements (1.1.9,
 * 1.2.1, tracing logs) and a WRONG conformity route - the classic Machinery
 * Regulation trap the instrument is designed to expose. Loaded by tour.html.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourMachinery = (function () {
  "use strict";

  var metadata = {
    clientName: "Meridian Handling Systems Ltd",
    siteName: "Meridian Handling Systems Ltd",
    siteAddress: "Foundry Lane Works, Trafford Park, Manchester, M17 1WA",
    siteContact: "J. Barrow, Engineering Director",
    opportunityId: "OPP-2026-0642",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-07-02",
    documentRevision: "1.0",
    qaReviewBy: "A. Whitfield",
    authorisedBy: "R. Doyle, Practice Lead",
    issuedTo: "J. Barrow, Meridian Handling Systems Ltd",
    issuedDate: "2026-07-08",
    confidentiality: "Confidential - Client Restricted"
  };

  var machine = {
    name: "AutoStak AS-90",
    // Annex I Part A, category 6 (machinery embedding self-evolving ML systems
    // ensuring safety functions) -> derives annex-i-part-a and the mandatory
    // third-party route. Set via the category aid so no misclassification flag;
    // the finding is that the manufacturer has not FOLLOWED that route (MR-M3.1).
    category: "annex-i-part-a:6"
  };

  // Consultant narrative for the Word report's executive summary - filled so
  // the demo report reads complete instead of showing the red placeholders.
  var reportNarrative = {
    nextSteps:
      "Approach notified bodies now and secure an EU type-examination slot for the AS-90\nAssign an owner for the Annex IV technical file additions and start them alongside the notified-body engagement\nClose the digital essential-requirement gaps (MR-M1.3, MR-M1.4, MR-M1.6) in the next firmware release\nPut substantial-modification governance in place before that release ships, not after\nRe-assess once the notified body has confirmed the route",
    topPriorities: "Sequence the conformity route first. The AS-90's ML person-detection safety system places it in Annex I Part A, so engage a notified body now (MR-M3.1): EU type-examination lead times are the critical path to selling the AS-90 under the Regulation from 14 January 2027, and notified-body capacity for self-evolving safety systems will be scarce. The Annex IV technical file additions (MR-M3.2), the updated declaration and the notified-body number beside the CE marking then follow that route in order. In parallel, close the digital essential-requirement gaps that the type-examination will test: safety-software identification and tamper evidence (MR-M1.3), the malicious-attempt extension of the control-system safety case (MR-M1.4) and the safety-software tracing log (MR-M1.6). Substantial-modification governance for software updates (MR-M2.7) should be in place before the next AS-90 firmware release, not after it.",
    regulatoryExposure: "The AS-90 is Meridian's growth product and its order book is predominantly EU intralogistics operators. From 14 January 2027 every unit placed on the EU market needs conformity under the Machinery Regulation, and for this machine that means a notified-body route: continuing to self-assess would make each placement unlawful and expose distributors as well as Meridian. A forced stop on EU shipments, or a competitor arriving first with a type-examined autonomous stacker, would put the EU pipeline and the framework tenders that already ask about Regulation 2023/1230 readiness directly at risk."
  };

  var basis = {
    interviews: [
      { name: "J. Barrow", role: "Engineering Director", date: "2026-07-02" },
      { name: "L. Okonkwo", role: "Functional Safety Engineer", date: "2026-07-02" },
      { name: "D. Fischer", role: "Controls & Software Lead", date: "2026-07-03" },
      { name: "P. Whelan", role: "Quality & Compliance Manager", date: "2026-07-03" }
    ],
    documents: [
      { title: "AS-90 machine risk assessment file", reference: "RA-AS90 v3.2", date: "2026-02-18" },
      { title: "AS-90 technical file (Directive 2006/42/EC structure)", reference: "TF-AS90-2025", date: "2025-09-30" },
      { title: "EN ISO 3691-4 design verification report", reference: "VER-AS90-3691", date: "2025-11-21" },
      { title: "EC declaration of conformity - AS-90", reference: "DoC-AS90 r4", date: "2025-12-01" },
      { title: "ML perception system training and validation dossier", reference: "ML-AS90-PD v1.3", date: "2026-04-14" }
    ],
    observations: [
      { name: "AS-90 unit on the assembly test floor", method: "hands-on walkthrough of safety stop, comms-loss behaviour and mode selection" },
      { name: "Supervisory application for the autonomous fleet", method: "demonstrated remote stop/start and alerting from the control room" },
      { name: "Safety PLC parameter change process", method: "observed keyed access and change record on the bench system" }
    ]
  };

  // { id, state: in-place | partially | not-in-place | na, ev, [rem:{rank,band,owner,action,impact}] }
  var rows = [
    // ---- M1 Essential requirements - digital, control & safety ----
    { id: "MRM1a", state: "partially", ev: "RA-AS90 v3.2 is a thorough iterative risk assessment to EN ISO 12100 driving the 3691-4 design, but it does not yet cover foreseen software updates or the intended evolution of the ML perception system.",
      rem: { rank: 7, band: "medium", owner: "Functional Safety Engineer",
        action: "Extend the risk assessment to foreseen software updates and the intended evolution of the ML perception behaviour, and version it with each release.",
        impact: "The risk assessment is the root of the conformity claim; digital hazards outside it are formally unassessed." } },
    { id: "MRM1b", state: "partially", ev: "Physical and wireless interfaces are inventoried and the service port is keyed, but there is no intervention-evidence capture on the safety-relevant hardware path (safety PLC backplane, perception module link).",
      rem: { rank: 8, band: "medium", owner: "Controls & Software Lead",
        action: "Add tamper/intervention evidence on the safety-relevant hardware paths and record it in the machine log.",
        impact: "An intervention in the safety hardware path could neither be prevented in design terms nor demonstrated afterwards (1.1.9)." } },
    { id: "MRM1c", state: "not-in-place", ev: "Safety-critical software is not identified as such on the machine: there is no on-machine inventory of installed safety software, no integrity protection beyond a CRC, and no evidence capture of modification.",
      rem: { rank: 4, band: "high", owner: "Controls & Software Lead",
        action: "Implement on-machine identification of installed safety software (presentable at all times), signed images for the safety controller and perception module, and modification-evidence capture.",
        impact: "1.1.9 cannot be demonstrated for the software path, and a notified body will test exactly this on a Part A machine." } },
    { id: "MRM1d", state: "partially", ev: "The EN ISO 13849 safety case (PL d person detection, PL e emergency stop) is complete and verified, but it does not analyse reasonably foreseeable malicious attempts: the fleet Wi-Fi link and supervisory channel are outside the safety argument.",
      rem: { rank: 3, band: "high", owner: "Functional Safety Engineer",
        action: "Extend the control-system safety case with a security threat analysis of hazard-capable functions (supervisory channel, parameter interfaces, perception inputs) per 1.2.1(a).",
        impact: "A malicious command or spoofed input that can create a hazardous machine state is a design non-conformity under 1.2.1 as well as a security issue." } },
    { id: "MRM1e", state: "in-place", ev: "Safety-function limits are defined in the risk assessment; safety parameters sit behind keyed access on the safety PLC with change records, and the ML perception model is frozen at build: no on-machine learning." },
    { id: "MRM1f", state: "not-in-place", ev: "Firmware updates are recorded in the ERP against the machine serial, but there is no tracing log on or for the machine of safety-software versions uploaded post-placement, and no 5-year retention arrangement.",
      rem: { rank: 6, band: "medium", owner: "Controls & Software Lead",
        action: "Implement a per-machine safety-software upload log (version, date, intervention data) retained five years per upload, retrievable for an authority request.",
        impact: "Meridian could not reconstruct the safety-software state of a fielded machine on a reasoned request (1.2.1(f))." } },
    { id: "MRM1g", state: "partially", ev: "The movement envelope is enforced by the safety PLC independent of the perception system, and correction/override is always available from the machine and the supervisory app; perception decision data is buffered for 72 hours only.",
      rem: { rank: 9, band: "medium", owner: "Controls & Software Lead",
        action: "Retain the safety-related decision-making records of the perception system for one year after collection, off-machine.",
        impact: "The decision-record retention the Regulation requires for self-evolving safety systems cannot currently be met (1.2.1)." } },
    { id: "MRM1h", state: "in-place", ev: "Loss of Wi-Fi or supervisory connection brings the machine to a monitored standstill via the safety PLC; power interruption and restoration were demonstrated with no unexpected start; remote stop is watchdog-validated." },
    { id: "MRM1i", state: "in-place", ev: "Intent signalling is designed in: direction and planned-turn indicators, audible cues before reversing and lane changes, and a floor-projected path ahead of the machine; validated in operator trials at two customer sites." },
    { id: "MRM1j", state: "partially", ev: "The supervisory application receives alerts and allows remote stop/start and dispatch-to-safe-position, but those actions are not interlocked to the supervisor having sight of the working area (camera coverage is optional per site).",
      rem: { rank: 10, band: "medium", owner: "Controls & Software Lead",
        action: "Interlock remote start/move-to-safe-position on confirmed visibility of the movement and working area (site camera coverage or line-of-sight confirmation) and make the supervisory function mandatory for autonomous operation.",
        impact: "Remote actions without area visibility are exactly what Annex III 3.2.4 prohibits for autonomous mobile machinery." } },
    { id: "MRM1k", state: "in-place", ev: "Chapter 1 position is strong on the manufacturer's evidence: EN ISO 3691-4 design with verified guards and clearances, mode selector with sustained-action manual mode, emergency stops front and rear, energy isolation, and marking/instructions content verified in the 3691-4 report. Summary judgement on documentation, not an inspection." },
    { id: "MRM1l", state: "in-place", ev: "Chapter 3 (mobility) applies and is covered by the EN ISO 3691-4 verification: travel/braking performance, stability with rated load at height, pedestrian-zone speed limitation and signalling. Other supplementary chapters do not apply. Summary judgement on the manufacturer's evidence." },
    { id: "MRM1m", state: "in-place", ev: "Residual-risk register traces each entry to on-machine warnings and the instructions, including the digital residual risks (degraded perception mode, comms-loss standstill behaviour); reviewed at v3.2 of the risk assessment." },

    // ---- M2 Manufacturer process obligations (organisation) ----
    { id: "MRM2a", state: "in-place", ev: "ISO 9001 change control links design and production changes to a conformity review gate, and the standards watch (3691-4, 13849 amendments) is a standing agenda item of the monthly engineering review." },
    { id: "MRM2b", state: "partially", ev: "A complaints and non-conformity register is maintained with distributor feedback routed in, but there is no risk-based sample testing of fielded machines and no monitoring of field software behaviour.",
      rem: { rank: 15, band: "low", owner: "Quality & Compliance Manager",
        action: "Add risk-based sampling of fielded AS-90s (including software state and perception performance) to the post-market monitoring procedure.",
        impact: "Field drift (mechanical or software) would surface through incidents rather than monitoring." } },
    { id: "MRM2c", state: "in-place", ev: "Documented corrective-action and recall procedure with an authority-notification step per Member State; exercised in the 2024 mast-bearing recall, including distributor notification within 48 hours." },
    { id: "MRM2d", state: "partially", ev: "Technical files and declarations are archived for 10 years per machine in the QMS vault, but there is no arrangement to produce the safety-software source code or programming logic on a reasoned authority request.",
      rem: { rank: 12, band: "medium", owner: "Quality & Compliance Manager",
        action: "Put an escrow-grade arrangement in place for safety-software source code and programming logic (per version shipped), with defined access control for authority requests.",
        impact: "An Art 10(3) reasoned request could not be met for the software the safety claim depends on." } },
    { id: "MRM2e", state: "partially", ev: "Manuals are digital with access marked on the machine and printable PDFs, but there is no committed 10-year online availability arrangement and no paper-on-request fulfilment process.",
      rem: { rank: 16, band: "low", owner: "Technical Author",
        action: "Commit the manuals platform to lifetime + 10-year availability per model, and stand up the free paper-on-request process (one-month fulfilment).",
        impact: "A broken manual link years after sale is a formal non-conformity under Art 10(7)." } },
    { id: "MRM2f", state: "in-place", ev: "Nameplates carry model, serial and year of construction; supply-chain records in the ERP identify sources and customers 10 years back; single contact point published." },
    { id: "MRM2g", state: "not-in-place", ev: "Firmware releases ship to fielded machines without any assessment of whether the change is a substantial modification: the 2025 speed-envelope increase went out as a routine update.",
      rem: { rank: 5, band: "high", owner: "Engineering Director",
        action: "Institute a substantial-modification gate for every change to fielded machines (physical or software): assess against Art 3(16), record the decision, and trigger re-assessment where required.",
        impact: "A capability-changing update makes whoever ships it the manufacturer of a modified machine: unassessed, that is an unmanaged conformity and liability exposure." } },
    { id: "MRM2h", state: "partially", ev: "The 14 January 2027 date is known and budgeted, but there is no model-by-model transition register: placement plans, certificate horizons and re-assessment needs are held informally by engineering.",
      rem: { rank: 11, band: "medium", owner: "Quality & Compliance Manager",
        action: "Build the transition register: per model, placement plans either side of 14 January 2027, certificate validity, standards watch and re-assessment schedule.",
        impact: "Without a register, a model still selling in 2027 without a Regulation conformity route is discovered by a blocked shipment, not a plan." } },

    // ---- M3 Conformity & market placement (the blocker layer) ----
    { id: "MRM3a", state: "not-in-place", ev: "The AS-90 is treated as Module A self-assessment carried over from Directive practice. Its ML person-detection safety system places it in Annex I Part A (point 6): third-party conformity assessment is mandatory and no notified body has been engaged.",
      rem: { rank: 1, band: "high", owner: "Quality & Compliance Manager",
        action: "Engage a notified body scoped for self-evolving safety systems and complete EU type-examination (Module B) + conformity to type (Module C), or full quality assurance (Module H), for the AS-90.",
        impact: "Self-assessing a Part A machine invalidates the conformity claim; from 14 January 2027 the AS-90 cannot lawfully be placed on the EU market until the third-party route is complete." } },
    { id: "MRM3b", state: "partially", ev: "The technical file is complete to the old Directive structure, but the Annex IV Part A additions are missing, most notably the description of the perception system's characteristics, capabilities, limitations, data and validation processes required for sensor-fed autonomous machinery.",
      rem: { rank: 2, band: "high", owner: "Functional Safety Engineer",
        action: "Restructure the technical file to Annex IV Part A and add the ML/sensor system description (data, development, testing and validation processes) from the ML-AS90-PD dossier.",
        impact: "The notified body assesses the technical file first; without the autonomous-system content the type-examination cannot proceed." } },
    { id: "MRM3c", state: "partially", ev: "EN ISO 3691-4 and 13849 are mapped to the mechanical and control EHSRs, but there is no coverage argument for 1.1.9 and 1.2.1's digital content and no use of a 2019/881 cybersecurity certification for presumption of conformity.",
      rem: { rank: 13, band: "medium", owner: "Controls & Software Lead",
        action: "Build the EHSR-to-standard coverage map for the digital requirements, argue the uncovered parts as alternative technical solutions, and evaluate an IEC 62443-4-2-based certification route under a 2019/881 scheme for 1.1.9/1.2.1.",
        impact: "Without a coverage argument every digital EHSR must be defended from first principles at type-examination." } },
    { id: "MRM3d", state: "partially", ev: "An EC declaration of conformity exists under Directive 2006/42/EC and reconciles EMC/RED, but it is not in the Regulation's Annex V structure and cannot cite the mandatory notified-body route.",
      rem: { rank: 14, band: "medium", owner: "Quality & Compliance Manager",
        action: "Redraw the declaration to Annex V Part A once the notified-body route completes, keep it continuously updated, and set up the digital-access option with its 10-year availability.",
        impact: "From 14 January 2027 machines shipped against the Directive-form declaration are non-conforming." } },
    { id: "MRM3e", state: "partially", ev: "CE marking is affixed correctly under the Directive; under the Regulation the AS-90's route requires the notified body's identification number beside the marking, which no current unit carries.",
      rem: { rank: 17, band: "low", owner: "Quality & Compliance Manager",
        action: "Add the notified-body number to the marking scheme for units placed from 14 January 2027, after the type-examination completes.",
        impact: "A Part A machine CE-marked without the notified-body number is formally non-conforming on sight (Art 46)." } },
    { id: "MRM3f", state: "partially", ev: "Nameplate carries model, serial, year and postal address, but not the website/email digital contact the Regulation adds (Art 10(6)).",
      rem: { rank: 18, band: "low", owner: "Technical Author",
        action: "Add the digital contact (website and monitored email) to the nameplate artwork and accompanying documents.",
        impact: "A visible, easily-checked formal non-conformity on every unit (Art 46)." } },
    { id: "MRM3g", state: "partially", ev: "Instructions cover intended use, misuse warnings and noise data with uncertainties, but not the digital operating states: degraded perception mode, update behaviour and the limits of remote supervision.",
      rem: { rank: 19, band: "low", owner: "Technical Author",
        action: "Add the digital residual risks and operating states (degraded modes, updates, remote supervision limits) to the instructions per 1.7.4.",
        impact: "Operators cannot run the machine safely through software-introduced states they were never told about." } },
    { id: "MRM3h", state: "na", ev: "Meridian places complete machines only; no partly completed machinery is placed on the market, so the declaration-of-incorporation chain does not apply." },
    { id: "MRM3i", state: "in-place", ev: "Strictly professional intralogistics machine; the user-population analysis in the risk assessment documents why non-professional use is not reasonably foreseeable (site-restricted operation, trained-operator requirement)." },
    { id: "MRM3j", state: "partially", ev: "EU sales run through distributors in four Member States, but the Art 13-16 duties (language checks, storage conditions, document verification) are not contractually allocated, and the Benelux own-brand arrangement has not been reviewed against Art 17.",
      rem: { rank: 20, band: "medium", owner: "Engineering Director",
        action: "Allocate the importer/distributor duties contractually per market, and review the own-brand arrangement: under Art 17 the partner assumes full manufacturer obligations.",
        impact: "Channel non-compliance blocks placements Meridian never sees, and the own-brand deal may have quietly transferred manufacturer liability." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    // The machine IS the target: name it, and classify via the Annex I category
    // aid so the class (Part A) and mandatory third-party route derive correctly.
    E.renameTarget(tid, machine.name);
    if (E.setCRAProductCategory) E.setCRAProductCategory(machine.category);

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

    // Populate the basis of assessment (interviews / documents / systems) so the
    // report and Word export carry a complete evidence register.
    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews = basis.interviews.slice();
      b.documents = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }
  }

  return { metadata: metadata, machine: machine, reportNarrative: reportNarrative, basis: basis, rows: rows, apply: apply };
})();
