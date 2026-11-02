/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the Supplier Cyber Exposure Screener tour
 * (domain-letter family, posture sibling).
 *
 * A complete, realistic, FINISHED screening: Aldergate Rail Infrastructure
 * (an operator) screens Ferrovia Controls Ltd - the same supplier whose
 * SentinelEdge IDS-2200 is the subject of the EU CRA tour dataset - in the
 * assess-a-supplier stance. The two demos tell one story: the screener finds
 * STRONG development and vulnerability handling but a WEAK regulatory
 * position at screener depth, so the "Where to go deeper" routing points at
 * the EU CRA Gap Assessment... which is exactly the Ferrovia CRA assessment
 * sitting in this same tour. Product capability lands mid (C) - the screener
 * can see less than a full assessment, which is the point of routing.
 * Loaded by tour.html.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourSupplier = (function () {
  "use strict";

  var metadata = {
    clientName: "Aldergate Rail Infrastructure Ltd",
    siteName: "Supplier screening - Ferrovia Controls Ltd (SentinelEdge product line)",
    siteContact: "K. Osei, OT Procurement Security Lead",
    opportunityId: "OPP-2026-0688",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-07-06",
    documentRevision: "1.0",
    qaReviewBy: "A. Whitfield",
    authorisedBy: "R. Doyle, Practice Lead",
    issuedTo: "K. Osei, Aldergate Rail Infrastructure Ltd",
    issuedDate: "2026-07-09",
    confidentiality: "Confidential - Client Restricted"
  };

  var reportNarrative = {
    // How the screening was run, answering the method prompt in the report.
    method:
      "The screening was run as a supplier assessment: a two-hour structured review with Ferrovia Controls product, security and account leads, followed by a review of the certificates, policies, published advisories and draft contract terms they supplied. Each scored answer reflects the consultant's judgement of what was shown, not what was asserted.",
    nextSteps:
      "Commission the EU CRA Gap Assessment of the SentinelEdge line as the next piece of work\nPut vulnerability and incident notification clauses, and a committed support period, into the framework variation\nAsk Ferrovia to retire the standing remote-access account in favour of per-session activation\nRe-screen the supplier once the deep assessment has reported",
    regulatoryExposure: "Aldergate's signalling-adjacent detection estate is standardising on the SentinelEdge line, so Ferrovia Controls' position becomes Aldergate's position. The screening shows a supplier with genuinely strong engineering (development practice and vulnerability handling screened well) but a regulatory domain graded F: no per-product CRA class position, no conformity route engaged, and no Article 14 reporting readiness. From 11 December 2027 that is a supply-continuity risk to Aldergate, not just Ferrovia's problem: non-conforming units cannot lawfully be placed on the market mid-framework. The screening-depth read of product capability (C) mainly reflects what could not be evidenced in a screening, which is itself the reason to commission the deep assessment rather than a finding of weakness.",
    topPriorities: "Commission the EU CRA Gap Assessment of the SentinelEdge line now: the screener's regulatory F is the trigger, and the deep assessment establishes the real class, route and timeline while there is still notified-body capacity to book. In parallel, close the contractual gaps this screening surfaced: vulnerability and incident notification clauses, a committed support period proportionate to the fleet's service life, and retirement of the standing remote-access account in favour of per-session activation."
  };

  var basis = {
    interviews: [
      { name: "M. Alvarez", role: "Head of Product Security, Ferrovia Controls", date: "2026-07-06" },
      { name: "P. Lindqvist", role: "Quality & Compliance Manager, Ferrovia Controls", date: "2026-07-06" },
      { name: "K. Osei", role: "OT Procurement Security Lead, Aldergate", date: "2026-07-07" }
    ],
    documents: [
      { title: "ISO/IEC 27001 certificate and scope statement", reference: "Cert 27001-FC-2025", date: "2025-04-11" },
      { title: "SentinelEdge secure development lifecycle procedure (summary)", reference: "SDL-PROC-07 v4.1", date: "2026-01-15" },
      { title: "Coordinated vulnerability disclosure policy and advisory history", reference: "CVD-POL-02", date: "2025-11-10" },
      { title: "Current supply framework agreement - security schedule", reference: "AL-FC-FA-2024", date: "2024-08-01" }
    ],
    observations: [
      { name: "Ferrovia security advisory portal", method: "review of published advisories and fix intervals for the SentinelEdge line" },
      { name: "Aldergate remote-access path used by Ferrovia support", method: "walkthrough of the jump-host configuration and account list with Aldergate's network team" }
    ]
  };

  // Row shapes as tour-posture-data: { id, band, ev, [rem:{rank,band,owner,action,impact}] }
  var rows = [
    // ---- Corporate security & assurance (B) ----
    { id: "corp.1", band: 3, ev: "A named Head of Product Security (M. Alvarez) with a product-security team; answered every screening question directly and within a day." },
    { id: "corp.2", band: 2, ev: "ISO 27001 certified, but the scope statement covers corporate IT and the development offices, not the SentinelEdge product line. 62443-4-1 certification is stated to be in progress.",
      rem: { rank: 13, band: "Low", owner: "Supplier account manager",
        action: "Ask Ferrovia to evidence the 62443-4-1 certification scope when granted, and treat the 27001 certificate as corporate assurance only.",
        impact: "Certificates scoped away from the product line give no assurance about the product you buy." } },
    { id: "corp.3", band: 2, ev: "Questionnaires are answered substantively, but the current framework's security schedule has no vulnerability or incident notification clauses and no evidence rights.",
      rem: { rank: 6, band: "Medium", owner: "Procurement lead (Aldergate)",
        action: "Add timed vulnerability/incident notification, evidence rights and patch commitments to the security schedule at the next framework renewal.",
        impact: "Without contractual notification, Aldergate finds out about an exploited SentinelEdge vulnerability from the news." } },

    // ---- Secure development practice (B) ----
    { id: "dev.1", band: 3, ev: "Documented SDL (SDL-PROC-07) evidenced with redacted threat-model and release-gate artefacts for the SentinelEdge line." },
    { id: "dev.2", band: 2, ev: "Static analysis and dependency scanning run per build, with an annual third-party penetration test; no fuzzing, and the pen-test scope excluded the update service.",
      rem: { rank: 12, band: "Low", owner: "Supplier account manager",
        action: "Request the next product pen test include the update-delivery service, and share the summary under NDA.",
        impact: "The update channel is the highest-consequence untested surface: it reaches every deployed unit." } },
    { id: "dev.3", band: 2, ev: "Firmware is signed and verified on-device; build-pipeline access control and provenance were asserted but not evidenced at screening depth.",
      rem: { rank: 7, band: "Medium", owner: "Consultant",
        action: "Verify build-environment controls and provenance in the 62443-4-1 deep assessment (SM practices).",
        impact: "A compromised build pipeline defeats the signing that everything else relies on." } },

    // ---- Product security capability (C - screener-depth read) ----
    { id: "prod.1", band: 2, ev: "Ships hardened by default per the CRA-facing work, but the hardening guide sighted was version-lagged and a legacy diagnostic service remains enabled by default.",
      rem: { rank: 8, band: "Medium", owner: "Supplier account manager",
        action: "Obtain the current hardening guide per firmware version and Ferrovia's plan for the legacy diagnostic service.",
        impact: "Every unit deployed with an undocumented enabled service is an unmonitored entry point in Aldergate's estate." } },
    { id: "prod.2", band: 2, ev: "Per-user role-based access confirmed; no directory integration on the deployed firmware, and log export needed syslog relay work Aldergate has not yet done.",
      rem: { rank: 14, band: "Low", owner: "OT engineering (Aldergate)",
        action: "Stand up the syslog relay so SentinelEdge security events reach Aldergate's monitoring, and track Ferrovia's directory-integration roadmap.",
        impact: "Capability the product has but the estate does not use is exposure by configuration, not by product." } },
    { id: "prod.3", band: 2, ev: "Signed updates with rollback confirmed; no offline/staged path was demonstrable for Aldergate's air-gapped signalling segments at screening depth.",
      rem: { rank: 4, band: "Medium", owner: "Consultant",
        action: "Confirm the offline update path for air-gapped segments in the deep product assessment, or agree a supported procedure with Ferrovia.",
        impact: "Units that cannot practically be updated stay vulnerable for exactly as long as it matters." } },

    // ---- Vulnerability handling & support (A) ----
    { id: "vuln.1", band: 3, ev: "Published CVD policy, security.txt contact and a consistent advisory history for the SentinelEdge line; triage SLAs stated and reflected in the record." },
    { id: "vuln.2", band: 3, ev: "Security fixes ship independently of feature releases, free of charge; sampled advisory-to-fix intervals matched the stated severity SLAs." },
    { id: "vuln.3", band: 2, ev: "A five-year support intent is stated informally; no published support period per product, and Aldergate's fleet plans on 12-15 years of service.",
      rem: { rank: 9, band: "Medium", owner: "Procurement lead (Aldergate)",
        action: "Negotiate a published, contractual support period proportionate to fleet service life, with security fixes committed across it.",
        impact: "An informal five-year intent leaves a decade of Aldergate's planned service life unprotected." } },

    // ---- Regulatory exposure & readiness (F - the routed domain) ----
    { id: "reg.1", band: 1, ev: "General CRA awareness, but no per-product position: Ferrovia could not state the SentinelEdge line's Annex III class, and assumes self-assessment applies.",
      rem: { rank: 3, band: "High", owner: "Consultant",
        action: "Establish the real classification in the EU CRA Gap Assessment: an intrusion-detection product is a strong Annex III Class II candidate, which changes everything downstream.",
        impact: "A wrong class assumption invalidates the intended conformity route and the CE marking built on it." } },
    { id: "reg.2", band: 0, ev: "No conformity route engaged: no notified body contacted, no Annex VII technical documentation programme, no dated plan against the December 2027 deadline.",
      rem: { rank: 1, band: "High", owner: "Consultant",
        action: "Commission the EU CRA Gap Assessment of the SentinelEdge line now, and make notified-body engagement its first roadmap item.",
        impact: "Without a route, SentinelEdge units cannot lawfully be placed on the EU market from December 2027, which falls mid-framework for Aldergate." } },
    { id: "reg.3", band: 0, ev: "No Article 14 reporting process exists, and there is no commitment to notify customers of actively exploited vulnerabilities on any timeline.",
      rem: { rank: 2, band: "High", owner: "Procurement lead (Aldergate)",
        action: "Require a customer-notification commitment (defined hours) in contract, and track Ferrovia's Article 14 readiness through the CRA deep assessment.",
        impact: "Aldergate's own incident-response and NIS2 duties depend on hearing about exploited supplier vulnerabilities in hours, not news cycles." } },

    // ---- Supply chain & operational exposure (C) ----
    { id: "chain.1", band: 2, ev: "A top-level SBOM is available under NDA; transitive open-source dependencies are not yet enumerated, and fourth parties (ODM hardware) were named only verbally.",
      rem: { rank: 11, band: "Low", owner: "Supplier account manager",
        action: "Obtain the SBOM per firmware release under the NDA and ask for the transitive-dependency roadmap.",
        impact: "When the next Log4j lands, Aldergate's exposure check is only as fast as the SBOM is complete." } },
    { id: "chain.2", band: 2, ev: "Ferrovia support access runs via Aldergate's jump host with MFA, but a standing named account exists and sessions are not recorded.",
      rem: { rank: 5, band: "Medium", owner: "OT engineering (Aldergate)",
        action: "Move Ferrovia to per-session activated access with session recording, and retire the standing account.",
        impact: "A standing supplier account is Aldergate's attack surface regardless of Ferrovia's own security." } },
    { id: "chain.3", band: 2, ev: "Data return is contracted; there is no escrow or update-continuity arrangement, and licences do not address supplier failure.",
      rem: { rank: 10, band: "Medium", owner: "Procurement lead (Aldergate)",
        action: "Add escrow (or an update-continuity arrangement) with defined release triggers and survivable licences at renewal.",
        impact: "A supplier failure would strand a safety-adjacent detection estate with no updates and no recourse." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    // The supplier IS the target in the assess-a-supplier stance.
    E.renameTarget(tid, "Ferrovia Controls Ltd");
    rows.forEach(function (row) {
      var patch = { applicable: true, band: row.band };
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
    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews = basis.interviews.slice();
      b.documents = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }
  }

  return { metadata: metadata, reportNarrative: reportNarrative, basis: basis, rows: rows, apply: apply };
})();
