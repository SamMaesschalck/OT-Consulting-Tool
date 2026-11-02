/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the CIS Critical Security Controls v8.1.2 tour
 * (caf-achieved engine, 3-band Implemented / Partially / Not Implemented).
 *
 * A complete, realistic, FINISHED IG1 assessment for a fictional retailer
 * (Brightpath Retail Group). Every in-scope (IG1) Safeguard is answered: a
 * curated set of ~15 Safeguards are Partially / Not Implemented and carry a full
 * remediation plan; every other IG1 Safeguard defaults to Implemented with
 * evidence. Loaded by tour.html.
 *
 * Demonstration content only - illustrative, not a real engagement.
 */
window.App = window.App || {};
window.App.TourCIS = (function () {
  "use strict";

  var metadata = {
    clientName: "Brightpath Retail Group",
    siteName: "Enterprise IT (IG1 - essential cyber hygiene)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-17",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each Safeguard recorded as not implemented\nEnforce MFA on the externally-exposed portals first, ahead of the next PCI DSS assessment\nStand up central log collection and scheduled vulnerability scanning, then review the first month of output together\nRe-assess against IG1 in six months and decide then whether to move towards IG2",
    regulatoryExposure:
      "Brightpath Retail Group assesses its enterprise IT against CIS Critical Security Controls v8.1.2 Implementation Group 1 (IG1) as its baseline of essential cyber hygiene, driven by payment-card (PCI DSS) obligations and cyber-insurance requirements. This is an alignment and gap analysis against the CIS Safeguard descriptions, not a certified CIS assessment. The Safeguards that are not yet implemented cluster around multi-factor authentication, logging and vulnerability management: the areas insurers and card schemes scrutinise most.",
    topPriorities:
      "The two most urgent priorities are enforcing multi-factor authentication on externally-exposed and remote access (6.3, 6.4), which removes the most common route to account takeover, and establishing audit-log collection and a vulnerability-management process (8.2, 7.1), so that attacks can be detected and known weaknesses are fixed on a schedule. Protecting and isolating recovery data (11.3) follows close behind."
  };

  // Curated gaps (state: partially | not) with remediation. All are IG1
  // Safeguards. Everything else in IG1 defaults to Implemented.
  var gaps = [
    { id: "6.3", state: "not", ev: "MFA is enabled for the email tenant but not for the externally-exposed store-management and supplier portals.",
      rem: { rank: 1, band: "High", owner: "IT Security Manager",
        action: "Enforce MFA on all externally-exposed applications, prioritising the store-management and supplier portals.",
        impact: "Externally-exposed apps without MFA are the most common route to account takeover." } },
    { id: "8.2", state: "not", ev: "Security logs are generated on servers but are not centrally collected; endpoint and network logs are not retained.",
      rem: { rank: 2, band: "High", owner: "IT Operations Lead",
        action: "Collect audit logs centrally from servers, endpoints and network devices into a managed log store.",
        impact: "Without collected logs there is no way to detect or investigate an intrusion." } },
    { id: "7.1", state: "partially", ev: "Patching happens, but there is no documented vulnerability-management process defining scope, frequency and risk ranking.",
      rem: { rank: 3, band: "High", owner: "IT Security Manager",
        action: "Establish and document a vulnerability-management process covering scope, cadence, risk ranking and ownership.",
        impact: "Ad hoc patching leaves known weaknesses open unpredictably." } },
    { id: "6.4", state: "partially", ev: "Remote network access uses a VPN, but MFA is only enforced for IT staff, not all remote users.",
      rem: { rank: 4, band: "High", owner: "IT Security Manager",
        action: "Require MFA for all remote network access, not just privileged/IT users.",
        impact: "Single-factor remote access is readily defeated by credential theft." } },
    { id: "11.3", state: "not", ev: "Backups run, but recovery data is stored on the same domain and is reachable with the same admin credentials as production.",
      rem: { rank: 5, band: "High", owner: "IT Operations Lead",
        action: "Protect recovery data with separate credentials and access controls so backups cannot be encrypted alongside production.",
        impact: "Backups reachable with production credentials are destroyed by the same ransomware event they are meant to survive." } },
    { id: "7.3", state: "partially", ev: "Operating-system patching is automated for laptops but manual and inconsistent for servers.",
      rem: { rank: 6, band: "Medium", owner: "IT Operations Lead",
        action: "Extend automated OS patch management to servers with a defined maintenance window.",
        impact: "Unpatched servers are high-value, internet-adjacent targets." } },
    { id: "1.1", state: "partially", ev: "An asset inventory exists in the helpdesk tool but is incomplete for cloud and mobile assets and is not reviewed on a cadence.",
      rem: { rank: 7, band: "Medium", owner: "IT Operations Lead",
        action: "Complete the enterprise asset inventory (including cloud and mobile) and review it at least bi-annually.",
        impact: "Unknown assets cannot be patched, monitored or protected." } },
    { id: "2.1", state: "partially", ev: "Installed software is visible per-device, but there is no consolidated, maintained software inventory.",
      rem: { rank: 8, band: "Medium", owner: "IT Operations Lead",
        action: "Establish and maintain a consolidated software inventory tied to the asset inventory.",
        impact: "Without a software inventory, unsupported and unauthorised software goes unnoticed." } },
    { id: "4.1", state: "partially", ev: "Standard builds exist for laptops, but there is no documented secure-configuration process covering servers and network devices.",
      rem: { rank: 9, band: "Medium", owner: "IT Operations Lead",
        action: "Document and maintain a secure-configuration process (benchmarks, exceptions, review) across asset types.",
        impact: "Inconsistent configuration leaves predictable weaknesses across the estate." } },
    { id: "5.3", state: "not", ev: "There is no routine process to identify and disable dormant accounts; several unused accounts were found during the assessment.",
      rem: { rank: 10, band: "Medium", owner: "IT Security Manager",
        action: "Automatically disable accounts after a defined period of inactivity and review dormant accounts regularly.",
        impact: "Dormant accounts are unmonitored entry points for attackers." } },
    { id: "11.2", state: "partially", ev: "Backups are configured for core systems, but coverage of end-user and store systems is incomplete and success is not verified.",
      rem: { rank: 11, band: "Medium", owner: "IT Operations Lead",
        action: "Extend automated backups to all in-scope systems and verify backup success on a schedule.",
        impact: "Gaps in backup coverage surface only when a restore is needed." } },
    { id: "3.4", state: "partially", ev: "Some data retention is enforced by system defaults, but there is no enterprise data-retention standard applied consistently.",
      rem: { rank: 12, band: "Low", owner: "Data Protection Lead",
        action: "Define and enforce a data-retention standard across systems holding customer and payment data.",
        impact: "Data kept longer than needed increases breach impact and compliance exposure." } },
    { id: "14.1", state: "partially", ev: "Security awareness is delivered at onboarding but not refreshed, and store staff are not reliably included.",
      rem: { rank: 13, band: "Low", owner: "IT Security Manager",
        action: "Establish an ongoing security-awareness programme with refresher training that includes store and seasonal staff.",
        impact: "One-off onboarding training does not sustain phishing and handling awareness." } },
    { id: "10.3", state: "not", ev: "Autorun/autoplay for removable media is not centrally disabled on end-user and point-of-sale devices.",
      rem: { rank: 14, band: "Low", owner: "IT Operations Lead",
        action: "Disable autorun and autoplay for removable media via central policy on all endpoints and POS devices.",
        impact: "Autorun is a classic vector for malware introduced via USB devices in stores." } },
    { id: "17.2", state: "partially", ev: "IT knows who to call internally, but there is no maintained contact list including external reporting parties and card-scheme contacts.",
      rem: { rank: 15, band: "Low", owner: "IT Security Manager",
        action: "Maintain incident-reporting contact information including external parties (card schemes, insurer, authorities).",
        impact: "Missing contacts cost critical time during a live incident." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    var overlay = E.getActiveCAFOverlay() || {};
    var inst = E.state.instrument;
    var byId = {}; gaps.forEach(function (g) { byId[g.id] = g; });
    (inst.outcomes || []).forEach(function (o) {
      var ov = overlay[o.id];
      if (!ov || ov.applicable === false) return; // out of IG1
      var g = byId[o.id];
      if (g) {
        E.setResponse(tid, o.id, { applicable: true, state: g.state, evidence: g.ev,
          priorityRank: g.rem.rank, priorityBand: g.rem.band, owner: g.rem.owner, action: g.rem.action, impact: g.rem.impact });
      } else {
        E.setResponse(tid, o.id, { applicable: true, state: "achieved", evidence: o.title + " - implemented; evidence reviewed during the assessment." });
      }
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  return { metadata: metadata, reportNarrative: reportNarrative, gaps: gaps, apply: apply };
})();
