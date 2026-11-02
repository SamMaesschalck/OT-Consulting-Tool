/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the EU CRA Gap Assessment tour (layered csms family).
 *
 * A complete, realistic, FINISHED CRA gap assessment for one product: Ferrovia
 * Controls' "SentinelEdge IDS-2200" industrial intrusion-detection appliance,
 * correctly classified as an Annex III Class II important product. All three
 * layers are in scope and fully answered with evidence, and every gap carries a
 * remediation plan. It deliberately shows STRONG product security (Annex I
 * Part I) and vulnerability handling (Part II) but WEAK conformity work (Part
 * III) - the classic "the product is secure, the paperwork is not" position
 * that the CRA's side-by-side layers are designed to expose. Loaded by
 * tour.html.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourCRA = (function () {
  "use strict";

  var metadata = {
    clientName: "Ferrovia Controls Ltd",
    siteName: "Ferrovia Controls Ltd",
    siteAddress: "Unit 12, Brunel Technology Park, Sheffield, S9 2FA",
    siteContact: "M. Alvarez, Head of Product Security",
    opportunityId: "OPP-2026-0531",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-25",
    documentRevision: "1.0",
    qaReviewBy: "A. Whitfield",
    authorisedBy: "R. Doyle, Practice Lead",
    issuedTo: "M. Alvarez, Ferrovia Controls Ltd",
    issuedDate: "2026-06-30",
    confidentiality: "Confidential - Client Restricted"
  };

  var product = {
    name: "SentinelEdge IDS-2200",
    // Annex III Class II, category 2 (Firewalls, intrusion detection and
    // prevention systems) -> derives important-class-ii and the notified-body
    // conformity route. Set via the category aid so no misclassification flag.
    category: "annex-iii-class-ii:2"
  };

  // Consultant narrative for the Word report's executive summary (same
  // reportNarrative slots as the other families) - filled so the demo report
  // reads complete instead of showing the red to-be-completed placeholders.
  var reportNarrative = {
    nextSteps:
      "Approach notified bodies this quarter and secure a slot for the IDS-2200 type examination\nAssign an owner for Article 14 reporting and have a working process before 11 September 2026\nBuild the Annex VII technical documentation in parallel, using the gaps in this report as the work list\nSchedule the technical remediations into the next two firmware releases\nRe-assess once the notified body has confirmed the route",
    topPriorities: "Sequence the conformity work first. Engage a notified body now (CRA-C.3), because notified-body lead times are the critical path to CE marking and capacity will tighten as the December 2027 deadline approaches. Stand up the Article 14 reporting process (CRA-C.7) ahead of its 11 September 2026 start date, since it applies regardless of when the product is next placed on the market. The Annex VII technical documentation (CRA-C.2), the declaration of conformity and CE marking then follow the notified-body outcome in order. The technical remediations, led by verified secure-erase (CRA-P1.m), can run in parallel within the existing firmware release cycle and none of them gates the conformity track.",
    regulatoryExposure: "EU sales of the SentinelEdge line depend on CE marking under the CRA from 11 December 2027, and the IDS-2200 is Ferrovia Controls' highest-volume EU product. Inability to place it on the market (or a forced withdrawal for non-conformity) would put that revenue and the rail-sector framework agreements built on it at risk, and a competitor reaching a certified Class II position first would be a direct commercial threat in tenders that already ask for CRA readiness."
  };

  var basis = {
    interviews: [
      { name: "M. Alvarez", role: "Head of Product Security", date: "2026-06-25" },
      { name: "T. Okafor", role: "Lead Firmware Engineer", date: "2026-06-25" },
      { name: "P. Lindqvist", role: "Quality & Compliance Manager", date: "2026-06-26" }
    ],
    documents: [
      { title: "SentinelEdge secure development lifecycle procedure", reference: "SDL-PROC-07 v4.1", date: "2026-01-15" },
      { title: "Product security risk assessment - IDS-2200", reference: "RA-IDS2200-2026", date: "2026-03-02" },
      { title: "Software bill of materials (top-level)", reference: "SBOM-IDS2200-2.6", date: "2026-05-20" },
      { title: "Coordinated vulnerability disclosure policy", reference: "CVD-POL-02", date: "2025-11-10" }
    ],
    observations: [
      { name: "IDS-2200 firmware v2.6 on the engineering bench", method: "hands-on walkthrough of default configuration and update flow" },
      { name: "Signed firmware update process", method: "demonstrated signature verification and rollback on the bench unit" },
      { name: "Vulnerability intake mailbox and tracker", method: "screen-shared review of triage and remediation records" }
    ]
  };

  // { id, state: in-place | partially | not-in-place, ev, [rem:{rank,band,owner,action,impact}] }
  var rows = [
    // ---- Annex I Part I - product requirements (strong) ----
    { id: "CRAP1a", state: "in-place", ev: "No known exploitable vulnerabilities open at release; release gate blocks shipment on any open high/critical finding, evidenced in the v2.6 release record." },
    { id: "CRAP1b", state: "in-place", ev: "Ships hardened by default (no default credentials, management interfaces off on the untrusted port); factory reset restores the secure baseline." },
    { id: "CRAP1c", state: "partially", ev: "Signed firmware updates with rollback are provided, but there is no automatic-update option and user notification of available updates is manual.",
      rem: { rank: 11, band: "medium", owner: "Firmware Lead",
        action: "Add an opt-in automatic-update channel and in-product notification of available security updates, preserving operator control of timing.",
        impact: "Operators may run known-vulnerable firmware for long periods because updates are neither surfaced nor easily applied." } },
    { id: "CRAP1d", state: "in-place", ev: "Per-user authentication with role-based access; failed and successful administrative logons are recorded and can be exported to a SIEM." },
    { id: "CRAP1e", state: "partially", ev: "Management traffic is TLS 1.3; stored configuration and captured session data are not encrypted at rest on the device.",
      rem: { rank: 14, band: "low", owner: "Firmware Lead",
        action: "Encrypt stored configuration, credentials and captured data at rest using the on-board secure element.",
        impact: "A stolen or decommissioned unit could expose network topology and credentials from unencrypted storage." } },
    { id: "CRAP1f", state: "in-place", ev: "Secure boot with signed firmware; configuration integrity is checksummed and tampering raises an alert to the management console." },
    { id: "CRAP1g", state: "in-place", ev: "Processes only the network metadata required for detection; full packet capture is off by default and time-limited when enabled." },
    { id: "CRAP1h", state: "in-place", ev: "Detection continues fail-open for the monitored segment; watchdog and resource limits protect against processing overload and DoS." },
    { id: "CRAP1i", state: "in-place", ev: "Passive monitoring via a span/tap; the device cannot inject traffic and is rate-limited on its management interface." },
    { id: "CRAP1j", state: "partially", ev: "Attack surface is small, but a legacy diagnostic service remains enabled by default and is not documented for operators.",
      rem: { rank: 13, band: "low", owner: "Firmware Lead",
        action: "Disable the legacy diagnostic service by default and document any interface that must remain enabled.",
        impact: "An undocumented enabled service is an unnecessary and unmonitored entry point on every deployed unit." } },
    { id: "CRAP1k", state: "partially", ev: "Standard compiler exploit mitigations are enabled; there is no runtime application self-protection or anomaly self-monitoring.",
      rem: { rank: 12, band: "low", owner: "Firmware Lead",
        action: "Add runtime integrity self-monitoring so exploitation attempts against the appliance are detected and reported.",
        impact: "Without self-monitoring, a successful exploit of the appliance itself could go undetected." } },
    { id: "CRAP1l", state: "in-place", ev: "Security-relevant events (access, configuration change, signature updates) are logged locally and forwarded to the operator's SIEM; logging can be tuned but not silently disabled." },
    { id: "CRAP1m", state: "not-in-place", ev: "There is no user-accessible secure-erase function; decommissioning relies on a manual factory reset that does not guarantee removal of captured data.",
      rem: { rank: 6, band: "high", owner: "Firmware Lead",
        action: "Implement a verified secure-erase (crypto-erase) that permanently removes all configuration and captured data, with a completion attestation.",
        impact: "Decommissioned or resold units may retain network detail and credentials, a common and overlooked OT exposure." } },

    // ---- Annex I Part II - vulnerability handling (good) ----
    { id: "CRAP21", state: "partially", ev: "A machine-readable SBOM covers top-level dependencies but transitive open-source components are not yet fully enumerated.",
      rem: { rank: 10, band: "medium", owner: "Build/Release Engineer",
        action: "Extend the SBOM to transitive dependencies and generate it automatically in the build pipeline for each release.",
        impact: "Incomplete component visibility means a vulnerable transitive dependency could ship undetected." } },
    { id: "CRAP22", state: "in-place", ev: "Vulnerabilities are triaged on a documented SLA (critical within 14 days); security fixes are shipped independently of feature releases." },
    { id: "CRAP23", state: "in-place", ev: "Static analysis and dependency scanning run per build; annual third-party penetration test, last completed February 2026." },
    { id: "CRAP24", state: "partially", ev: "Fixed vulnerabilities are described in release notes, but structured advisories (affected versions, severity, CVE) are not consistently published.",
      rem: { rank: 15, band: "low", owner: "Product Security Manager",
        action: "Publish structured security advisories (CSAF/CVE) for each fixed vulnerability alongside the release.",
        impact: "Operators cannot reliably assess their exposure or prioritise updates without structured advisory data." } },
    { id: "CRAP25", state: "in-place", ev: "Published coordinated vulnerability disclosure policy with a security.txt contact and defined handling timelines." },
    { id: "CRAP26", state: "in-place", ev: "Monitored security mailbox and researcher contact; third-party component issues are tracked to upstream advisories." },
    { id: "CRAP27", state: "in-place", ev: "Updates are distributed signed over TLS from a hardened update service; signature and version are verified on-device before applying." },
    { id: "CRAP28", state: "partially", ev: "Security updates are provided free of charge, but dissemination is manual (customer portal) and advisory messaging to operators is inconsistent.",
      rem: { rank: 16, band: "low", owner: "Product Security Manager",
        action: "Automate update notification to registered operators with clear advisory messaging and recommended action.",
        impact: "Operators may not learn a fix is available in time to schedule it safely around the process." } },

    // ---- Conformity & obligations (weak - the blocker layer) ----
    { id: "CRAC1", state: "in-place", ev: "Documented product cybersecurity risk assessment (RA-IDS2200-2026) drives which Annex I requirements apply and is reviewed each major release." },
    { id: "CRAC2", state: "partially", ev: "Technical documentation exists but is not yet structured or complete against Annex VII (e.g. no consolidated description of the conformity assessment).",
      rem: { rank: 5, band: "high", owner: "Quality & Compliance Manager",
        action: "Compile the Annex VII technical documentation set and maintain it for the support period / 10 years.",
        impact: "Without complete Annex VII documentation the manufacturer cannot demonstrate conformity on request from authorities." } },
    { id: "CRAC3", state: "not-in-place", ev: "As a Class II important product the IDS-2200 requires a notified-body conformity route; the manufacturer currently assumes self-assessment and has not engaged a notified body.",
      rem: { rank: 1, band: "high", owner: "Quality & Compliance Manager",
        action: "Engage an accredited notified body and complete EU-type examination (Module B) + Module C, or full quality assurance (Module H).",
        impact: "Self-assessing a Class II product invalidates the conformity claim; the product cannot be lawfully CE-marked until the correct route is completed." } },
    { id: "CRAC4", state: "not-in-place", ev: "No EU declaration of conformity has been drawn up for the product.",
      rem: { rank: 3, band: "high", owner: "Quality & Compliance Manager",
        action: "Draw up and sign the EU declaration of conformity per product once the notified-body route is complete, and keep it available to authorities.",
        impact: "Without the declaration the product cannot lawfully carry CE marking or be placed on the EU market." } },
    { id: "CRAC5", state: "not-in-place", ev: "CE marking is not affixed; conformity work is incomplete.",
      rem: { rank: 2, band: "high", owner: "Quality & Compliance Manager",
        action: "Affix CE marking only after the notified-body conformity route and declaration are complete.",
        impact: "Placing the product on the market without CE marking blocks EU sales; affixing it prematurely would be a false declaration." } },
    { id: "CRAC6", state: "partially", ev: "A five-year support period is stated internally but is not formally determined against expected use or communicated to customers.",
      rem: { rank: 8, band: "medium", owner: "Product Manager",
        action: "Determine and publish the support period, reflecting the expected operational life of an OT appliance, and commit to vulnerability handling across it.",
        impact: "An unclear or too-short support period leaves operators exposed once support lapses on long-lived OT equipment." } },
    { id: "CRAC7", state: "not-in-place", ev: "There is no process to report actively exploited vulnerabilities or severe incidents to the CSIRT/ENISA within the CRA's early-warning and notification timelines.",
      rem: { rank: 4, band: "high", owner: "Product Security Manager",
        action: "Stand up an Article 14 reporting process (early warning, notification, final report) with named owners and out-of-hours cover, and rehearse it.",
        impact: "The manufacturer could not meet the CRA's tight statutory reporting deadlines during a live exploited-vulnerability event." } },
    { id: "CRAC8", state: "partially", ev: "User documentation covers installation and secure configuration but omits the support period and the security-contact/reporting information required by Annex II.",
      rem: { rank: 7, band: "medium", owner: "Technical Author",
        action: "Add the Annex II information to the product documentation: support period, secure-use guidance and the vulnerability reporting contact.",
        impact: "Operators cannot deploy and maintain the product securely, or report issues, without the required user information." } },
    { id: "CRAC9", state: "partially", ev: "Third-party components are tracked, but there is no documented due-diligence process evidencing that integrated components do not compromise the product.",
      rem: { rank: 9, band: "medium", owner: "Product Security Manager",
        action: "Document and evidence a due-diligence process for integrated third-party and open-source components (selection, monitoring, update).",
        impact: "Undue diligence on components is where a manufacturer's own good practice is most often undone by inherited vulnerabilities." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    // The product IS the target: name it, and classify via the category aid so
    // the class (Important - Class II) and conformity route derive correctly.
    E.renameTarget(tid, product.name);
    if (E.setCRAProductCategory) E.setCRAProductCategory(product.category);

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

  return { metadata: metadata, product: product, reportNarrative: reportNarrative, basis: basis, rows: rows, apply: apply };
})();
