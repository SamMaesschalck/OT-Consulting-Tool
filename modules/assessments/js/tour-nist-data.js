/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the NIST SP 800-53 Rev 5 Control Assessment tour
 * (caf-achieved engine, binary Satisfied / Other Than Satisfied).
 *
 * A complete, realistic, FINISHED enterprise-IT assessment for a fictional SaaS
 * provider (Atlas Digital Services) against the Moderate baseline. Every in-scope
 * control is answered: a curated set of ~18 controls are Other Than Satisfied and
 * carry a full remediation plan (priority, owner, action, impact); every other
 * in-scope control defaults to Satisfied with evidence. Loaded by tour.html.
 *
 * Demonstration content only - the judgements, evidence and narrative are
 * illustrative, not a real engagement.
 */
window.App = window.App || {};
window.App.TourNIST = (function () {
  "use strict";

  var metadata = {
    clientName: "Atlas Digital Services",
    siteName: "Corporate information systems (Moderate-impact)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-06-03",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Agree an owner and a target date for each control recorded as Other Than Satisfied\nDeploy scheduled vulnerability scanning and agree the remediation SLAs before the next customer security review\nStand up production security monitoring and log review, then test it against a known scenario\nExercise the contingency and incident plans and keep the results as evidence\nRe-assess against the Moderate baseline in twelve months",
    regulatoryExposure:
      "Atlas Digital Services operates a multi-tenant SaaS platform and assesses its corporate and production information systems against the NIST SP 800-53 Rev 5 Moderate baseline to satisfy customer security requirements and support its SOC 2 and ISO 27001 programmes. This is an alignment and gap analysis, not a formal SP 800-53A assessment or an authorization decision. The controls that are Other Than Satisfied cluster around vulnerability management, monitoring and least privilege, which is where an assessor or a customer security review is most likely to focus.",
    topPriorities:
      "The two most urgent priorities are standing up continuous vulnerability scanning with tracked remediation (RA-5), so that known weaknesses are found and fixed on a schedule rather than ad hoc, and establishing security monitoring and log review across the production estate (SI-4, AU-6), so that malicious activity is detected and acted on. Closing least-privilege gaps (AC-6) and testing contingency and incident plans (CP-4, IR-3) follow close behind."
  };

  // Curated gaps (Other Than Satisfied) with remediation. All are in the
  // Moderate baseline. Everything else in scope defaults to Satisfied.
  var gaps = [
    { id: "RA-5", ev: "Vulnerability scanning is run before major releases but not continuously, and findings are not tracked to closure against an inventory.",
      rem: { rank: 1, band: "High", owner: "Security Engineering Lead",
        action: "Deploy authenticated, scheduled vulnerability scanning across the estate and track findings to remediation SLAs against the asset inventory.",
        impact: "Known, exploitable weaknesses remain open between releases and are the most common route to compromise." } },
    { id: "SI-4", ev: "Cloud provider alerts are watched, but there is no consolidated security monitoring or detection use-case coverage across production systems.",
      rem: { rank: 2, band: "High", owner: "SOC Manager",
        action: "Consolidate security telemetry into the SIEM and build prioritised detection use cases for the production platform.",
        impact: "Without monitoring, an intrusion can progress undetected until it affects customer data or availability." } },
    { id: "AU-6", ev: "Logs are collected centrally but are only reviewed reactively during incidents; there is no routine review or alerting.",
      rem: { rank: 3, band: "High", owner: "SOC Manager",
        action: "Define scheduled log review and automated alerting for security-relevant events with documented triage ownership.",
        impact: "Collected logs that no one reviews provide evidence after the fact but no timely detection." } },
    { id: "AC-6", ev: "Role-based access exists, but several engineering roles carry standing production privileges beyond their day-to-day need.",
      rem: { rank: 4, band: "High", owner: "IAM Lead",
        action: "Right-size roles to least privilege and move standing production access to just-in-time, approved, time-bound grants.",
        impact: "Over-privileged accounts widen the blast radius of any credential compromise or insider error." } },
    { id: "SI-2", ev: "Operating-system patching is automated, but application and dependency patching is inconsistent and not tracked against a defined window.",
      rem: { rank: 5, band: "High", owner: "Platform Engineering Lead",
        action: "Extend flaw remediation to application dependencies with tracked SLAs and a defined maintenance cadence.",
        impact: "Unpatched application components are a leading cause of breaches in SaaS platforms." } },
    { id: "CP-4", ev: "A contingency plan exists but has not been exercised; recovery timings are assumed rather than demonstrated.",
      rem: { rank: 6, band: "High", owner: "Head of Operations",
        action: "Run a contingency-plan exercise (including a representative restore) at least annually and feed lessons back into the plan.",
        impact: "Untested recovery plans routinely fail under the pressure of a real outage." } },
    { id: "IR-3", ev: "An incident response plan is documented but has not been tested with a tabletop or live exercise.",
      rem: { rank: 7, band: "High", owner: "Security Manager",
        action: "Run an incident-response tabletop covering a realistic breach scenario and remediate the gaps it exposes.",
        impact: "An untested plan leaves responders improvising during a live incident." } },
    { id: "CM-8", ev: "A cloud asset inventory exists but is not complete or authoritative for ephemeral and third-party-hosted components.",
      rem: { rank: 8, band: "Medium", owner: "Platform Engineering Lead",
        action: "Automate discovery so the component inventory is complete and authoritative, including ephemeral and SaaS-hosted assets.",
        impact: "Incomplete inventory undermines vulnerability, monitoring and configuration management." } },
    { id: "SC-7", ev: "Network boundaries are enforced at the perimeter, but internal segmentation between tenants and tiers is limited.",
      rem: { rank: 9, band: "Medium", owner: "Security Engineering Lead",
        action: "Introduce internal segmentation and egress control between tiers and sensitive data stores.",
        impact: "Flat internal networks let an attacker who gains a foothold move laterally to sensitive data." } },
    { id: "IA-5", ev: "MFA is enforced, but the password policy and secret-rotation practices for service accounts are inconsistent.",
      rem: { rank: 10, band: "Medium", owner: "IAM Lead",
        action: "Standardise authenticator management, including service-account secret rotation and vaulting.",
        impact: "Long-lived, unrotated service-account secrets are a high-value target." } },
    { id: "CP-9", ev: "Backups run automatically, but restore has not been tested and one data store's backups are not held in an isolated copy.",
      rem: { rank: 11, band: "Medium", owner: "Platform Engineering Lead",
        action: "Add an isolated/immutable backup copy and test full restore of a representative system on a defined cycle.",
        impact: "Untested or non-isolated backups may not survive a ransomware or destructive event." } },
    { id: "SA-11", ev: "Code review and SAST run in CI, but there is no regular independent security testing of the developed platform.",
      rem: { rank: 12, band: "Medium", owner: "Head of Engineering",
        action: "Introduce periodic independent security testing (DAST and a scoped penetration test) into the release lifecycle.",
        impact: "Automated checks miss logic and design flaws that manual testing surfaces." } },
    { id: "AC-2", ev: "Joiner/leaver processes are reliable for staff, but dormant contractor and service accounts were found during the assessment.",
      rem: { rank: 13, band: "Medium", owner: "IAM Lead",
        action: "Bring contractor and service accounts into the periodic access review and disable dormant accounts automatically.",
        impact: "Orphaned accounts accumulate as unmonitored entry points." } },
    { id: "PL-8", ev: "A high-level architecture exists, but there is no maintained security architecture describing trust boundaries and control placement.",
      rem: { rank: 14, band: "Medium", owner: "Security Architect",
        action: "Produce and maintain a security architecture that documents trust boundaries, data flows and control placement.",
        impact: "Without a security architecture, control gaps and single points of failure go unnoticed." } },
    { id: "SR-3", ev: "Key suppliers are contracted commercially, but their security practices are not assessed or contractually required in a consistent way.",
      rem: { rank: 15, band: "Medium", owner: "Vendor Risk Lead",
        action: "Introduce supply-chain security requirements (assessment, vulnerability disclosure, incident notification) into supplier contracts and onboarding.",
        impact: "Third parties with access or embedded components are a growing breach vector." } },
    { id: "AT-3", ev: "General security awareness is delivered to all staff; there is no role-based training for engineers and administrators.",
      rem: { rank: 16, band: "Low", owner: "Security Manager",
        action: "Introduce role-based training for engineering and administrative roles (secure development, privileged access, incident recognition).",
        impact: "General training does not equip high-privilege roles for the threats specific to them." } },
    { id: "CA-7", ev: "Point-in-time reviews are performed, but there is no continuous-monitoring strategy tying control effectiveness to ongoing metrics.",
      rem: { rank: 17, band: "Low", owner: "Security Manager",
        action: "Define a continuous-monitoring strategy with control-effectiveness metrics and a defined review cadence.",
        impact: "Without continuous monitoring, control drift is only found at the next audit." } },
    { id: "PS-4", ev: "Leaver processes revoke access, but timing is inconsistent and not always same-day for privileged roles.",
      rem: { rank: 18, band: "Low", owner: "HR / IAM Lead",
        action: "Guarantee same-day access revocation for leavers, prioritising privileged and remote-access accounts.",
        impact: "Delayed revocation leaves a window for misuse by departing staff." } }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    var tid = E.state.activeTargetId;
    var overlay = E.getActiveCAFOverlay() || {};
    var inst = E.state.instrument;
    var byId = {}; gaps.forEach(function (g) { byId[g.id] = g; });
    (inst.outcomes || []).forEach(function (o) {
      var ov = overlay[o.id];
      if (!ov || ov.applicable === false) return; // out of the Moderate baseline
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
