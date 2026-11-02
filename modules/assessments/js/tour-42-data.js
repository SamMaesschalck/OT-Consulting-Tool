/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-4-2 (capability-SL) tour.
 *
 * A complete, realistic, FINISHED component security assessment of a single
 * embedded device - a safety-related programmable controller - against a target
 * of SL 2. Every applicable component requirement is answered with an achieved
 * capability security level and evidence, every requirement below target carries
 * a full remediation plan (priority, owner, action, impact), and the consultant
 * exec-summary blocks are supplied.
 *
 * The scenario deliberately exercises the three things that make 4-2 different
 * from 3-3:
 *   - component-type scoping: the target is an EMBEDDED device, so every SAR
 *     (software application), HDR (host device) and NDR (network device)
 *     requirement is marked not applicable;
 *   - requirements that are genuinely out of scope for this product (no PKI,
 *     no wireless) rather than out of scope for its type;
 *   - CR 2.3 and CR 7.5, which carry no capability security level anywhere in
 *     Annex B Table B.1 and are therefore recorded rather than scored.
 *
 * The resulting profile is the one an embedded controller typically produces:
 * strong integrity (verified boot, signed firmware) and weak identification and
 * monitoring - FR1 on the floor at SL 0, FR6 held at SL 1 by the absence of any
 * continuous monitoring output.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.Tour42 = (function () {
  "use strict";

  var TARGET_SL = 2;

  var metadata = {
    clientName: "Northbridge Manufacturing",
    siteName: "Meridian S9 safety-related programmable controller (embedded device)",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-07-24",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  var reportNarrative = {
    nextSteps:
      "Share this assessment with Meridian and ask for a written roadmap position on CR 1.1 and CR 6.2\nMake individual authentication and a monitoring interface conditions of the standardisation decision\nWhere the S9 is already deployed, compensate at the zone: control engineering access through a managed workstation and record who held the session\nRe-assess the controller when the next firmware release is available",
    regulatoryExposure:
      "The Meridian S9 is the controller Northbridge is standardising on for safety-related duty across three plants, so its capability ceiling becomes the ceiling for every zone it is deployed into. The target of SL 2 reflects an expectation of protection against intentional misuse by simple means. The controller's integrity capability is genuinely good, but two foundational requirements fall short. FR1 (identification and authentication) sits on the floor at SL 0, because the device cannot distinguish one engineer from another. FR6 (timely response to events) is held at SL 1 against a target of SL 2, because the controller cannot be monitored continuously. On a safety-related device, the inability to attribute a change or to detect manipulation in service is the material exposure, and neither is fixable by configuration.",
    topPriorities:
      "The two priorities are both supplier commitments rather than site actions. First, individual authentication on the engineering interface (CR 1.1), which today accepts a single shared password and leaves every logic change unattributable. Second, a monitoring interface that allows security events to be collected continuously (CR 6.2), so that manipulation of a safety-related controller is detectable rather than discovered at the next proof test. Each is the single item holding its foundational requirement below target, and both should be written into the supplier's product roadmap as a condition of the standardisation decision."
  };

  // Row shapes:
  //   { id, sl, ev }                                        answered, meets/near target
  //   { id, sl, ev, rem:{rank,band,owner,action,impact} }    answered, below target
  //   { id, na:true, note }                                 not applicable
  var rows = [
    // ---- FR1  Identification and authentication control ------------------
    { id: "CR1.1", sl: 0, ev: "The engineering interface accepts a single shared password common to all engineers; there are no individual user accounts on the device.",
      rem: { rank: 2, band: "Critical", owner: "Product Supplier (Meridian)",
        action: "Require individual user accounts on the engineering interface in the product roadmap; in the interim, control access through the engineering workstation and log which engineer held the token for each session.",
        impact: "No logic change on a safety-related controller can be attributed to a person, which defeats both accountability and any insider investigation." } },
    { id: "CR1.2", sl: 1, ev: "The controller authenticates its paired engineering tool, but peer controllers and the historian connect on address trust alone.",
      rem: { rank: 5, band: "High", owner: "Product Supplier (Meridian)",
        action: "Extend device authentication to all peer and supervisory connections, not only the engineering tool.",
        impact: "A spoofed peer on the control network is trusted by the controller purely for being at the right address." } },
    { id: "CR1.3", sl: 2, ev: "Account roles on the device (operate, engineer, administer) can be created, disabled and removed through the engineering tool." },
    { id: "CR1.4", sl: 2, ev: "Identifiers are managed per role and per interface, and are not reused after removal." },
    { id: "CR1.5", sl: 1, ev: "The factory default password can be changed and is changed at commissioning, but authenticators are held in device configuration without hardware protection.",
      rem: { rank: 8, band: "Medium", owner: "Product Supplier (Meridian)",
        action: "Move authenticator storage into the controller's secure element, which is already present for firmware signature verification.",
        impact: "Credentials recoverable from a device configuration file spread to every controller sharing the build." } },
    { id: "CR1.7", sl: 2, ev: "Password length and character mix are configurable and enforced by the device rather than by the engineering tool." },
    { id: "CR1.8", na: true, note: "The controller does not use PKI certificates for any of its interfaces; authentication is by shared secret. Not applicable to this product." },
    { id: "CR1.9", na: true, note: "No public key based authentication is offered by the controller. Not applicable to this product." },
    { id: "CR1.10", sl: 2, ev: "Authenticator entry is obscured on the engineering tool and no credential is echoed to the device display." },
    { id: "CR1.11", sl: 1, ev: "A configurable retry limit applies to the operator display, but the service port accepts unlimited authentication attempts.",
      rem: { rank: 11, band: "Medium", owner: "Product Supplier (Meridian)",
        action: "Apply the retry limit consistently to every authenticating interface, including the service port.",
        impact: "An unlimited-retry interface makes an offline brute force against the shared password a matter of time." } },
    { id: "CR1.12", sl: 1, ev: "A fixed banner is displayed at engineering tool connection; the text is not configurable to Northbridge's wording.",
      rem: { rank: 14, band: "Low", owner: "Product Supplier (Meridian)",
        action: "Make the system use notification configurable so site-specific legal wording can be applied.",
        impact: "A non-configurable banner may not carry the wording needed to support disciplinary or legal action." } },
    { id: "CR1.14", sl: 2, ev: "The shared secret used for peer authentication is stored in the secure element and is not extractable through the engineering tool." },

    { id: "NDR1.6", na: true, note: "Wireless access management is a network device requirement. The target is an embedded device." },
    { id: "NDR1.13", na: true, note: "Access via untrusted networks is a network device requirement. The target is an embedded device." },

    // ---- FR2  Use control -------------------------------------------------
    { id: "CR2.1", sl: 2, ev: "The device enforces its three roles at the interface, and an operator token cannot download logic." },
    { id: "CR2.2", na: true, note: "The controller has no wireless interface fitted or available as an option. Not applicable to this product." },
    { id: "CR2.3", na: true, note: "Recorded, not scored: CR 2.3 carries no capability security level in Annex B Table B.1, so it is not selected at SL 1-4. Portable media control is handled by the engineering workstation build rather than by the controller." },
    { id: "EDR2.4", sl: 2, ev: "The controller executes only signed logic from its own runtime; no general purpose mobile code technology is supported, and unsigned logic is rejected." },
    { id: "CR2.5", sl: 1, ev: "The operator display locks on inactivity; the engineering tool session on the device persists until the cable is removed.",
      rem: { rank: 12, band: "Medium", owner: "Product Supplier (Meridian)",
        action: "Apply a configurable inactivity lock to the engineering session on the device, not only to the operator display.",
        impact: "An engineering session left connected in a cabinet is an open path to the safety logic." } },
    { id: "CR2.6", sl: 2, ev: "Remote engineering sessions terminate on inactivity and can be dropped from the device side." },
    { id: "CR2.7", sl: 2, ev: "The controller permits a single engineering session at a time; concurrent session limits are inherent to the design." },
    { id: "CR2.8", sl: 2, ev: "Authentication, logic download, mode change and configuration change all generate audit records." },
    { id: "CR2.9", sl: 1, ev: "The audit buffer holds roughly 500 records and wraps silently; capacity is not documented in the product manual.",
      rem: { rank: 9, band: "Medium", owner: "Product Supplier (Meridian)",
        action: "Document the audit buffer capacity and add a threshold warning before records are overwritten.",
        impact: "A wrapping buffer discards the evidence of an incident precisely when the incident generates the most records." } },
    { id: "CR2.10", sl: 2, ev: "Audit processing failure raises a diagnostic alarm and does not affect the safety function." },
    { id: "CR2.11", sl: 1, ev: "Records are timestamped from the controller's internal clock, which is set manually and drifts; there is no time synchronisation.",
      rem: { rank: 7, band: "High", owner: "Controls Engineering Team",
        action: "Enable time synchronisation to the site source where the firmware supports it, and request supplier support where it does not.",
        impact: "Drifting clocks make it impossible to reconstruct a sequence of events across the controller, historian and network devices." } },
    { id: "CR2.12", sl: 2, ev: "Logic downloads are recorded with the authenticated role and cannot be repudiated at role level." },
    { id: "EDR2.13", sl: 1, ev: "The JTAG header is present and functional on the main board. It is covered by a tamper-evident seal, but is not logically disabled or monitored.",
      rem: { rank: 4, band: "High", owner: "Product Supplier (Meridian)",
        action: "Disable or lock the diagnostic and test interfaces in production firmware, and raise an event when they are used.",
        impact: "Brief physical access to a cabinet bypasses every logical control on the controller through the debug header." } },

    { id: "SAR2.4", na: true, note: "Mobile code for software applications. The target is an embedded device." },
    { id: "HDR2.4", na: true, note: "Mobile code for host devices. The target is an embedded device." },
    { id: "NDR2.4", na: true, note: "Mobile code for network devices. The target is an embedded device." },
    { id: "HDR2.13", na: true, note: "Physical diagnostic and test interfaces for host devices. The target is an embedded device." },
    { id: "NDR2.13", na: true, note: "Physical diagnostic and test interfaces for network devices. The target is an embedded device." },

    // ---- FR3  System integrity -------------------------------------------
    { id: "CR3.1", sl: 2, ev: "Peer and supervisory traffic carries an integrity check that the controller validates and authenticates." },
    { id: "EDR3.2", sl: 2, ev: "The controller runs a closed firmware load with signature verification; no third-party code can be introduced." },
    { id: "CR3.3", sl: 2, ev: "Security functions are exercised by a self-test at start-up and can be verified during a proof test." },
    { id: "CR3.4", sl: 2, ev: "Logic and configuration integrity are checked at load and at start-up, and a mismatch raises a diagnostic alarm." },
    { id: "CR3.5", sl: 2, ev: "Process inputs are range- and type-validated by the runtime before use in the safety function." },
    { id: "CR3.6", sl: 3, ev: "Outputs drive to the configured safe state on any loss of normal operation. This is a safety-certified behaviour and exceeds the SL 2 target." },
    { id: "CR3.7", sl: 2, ev: "Fault conditions raise structured diagnostic codes without exposing internal state on any interface." },
    { id: "CR3.8", sl: 2, ev: "Engineering sessions carry a session identifier that the controller validates; invalid identifiers are rejected." },
    { id: "CR3.9", sl: 1, ev: "Audit records are readable through the engineering tool but can be cleared by any authenticated engineer, with no separate protection.",
      rem: { rank: 6, band: "High", owner: "Product Supplier (Meridian)",
        action: "Separate the privilege to clear audit records from the engineering role, and record the clearing itself as an auditable event.",
        impact: "An audit trail any engineer can erase is not evidence, and clearing it is the standard closing move of an intrusion." } },
    { id: "EDR3.10", sl: 2, ev: "Firmware can be updated in the field with authenticity and integrity validated before the image is accepted; updates require a maintenance window but not a return to the vendor." },
    { id: "EDR3.11", sl: 2, ev: "The enclosure is tamper-evident and opening it is detectable at the next inspection." },
    { id: "EDR3.12", sl: 2, ev: "Supplier roots of trust are provisioned in the secure element at manufacture and cannot be replaced in the field." },
    { id: "EDR3.13", sl: 1, ev: "There is no facility for Northbridge to provision its own roots of trust; the device trusts only supplier-signed material.",
      rem: { rank: 13, band: "Medium", owner: "Procurement / Supplier Management",
        action: "Ask the supplier for asset-owner root of trust provisioning, so Northbridge can sign its own logic and is not locked to the supplier's judgement for the controller's life.",
        impact: "Without asset-owner roots of trust, every trust decision on a twenty-year asset rests permanently with the supplier." } },
    { id: "EDR3.14", sl: 3, ev: "Verified boot checks both integrity and authenticity of firmware before execution, and halts on failure. Exceeds the SL 2 target." },

    { id: "SAR3.2", na: true, note: "Protection from malicious code for software applications. The target is an embedded device." },
    { id: "HDR3.2", na: true, note: "Protection from malicious code for host devices. The target is an embedded device." },
    { id: "NDR3.2", na: true, note: "Protection from malicious code for network devices. The target is an embedded device." },
    { id: "HDR3.10", na: true, note: "Support for updates for host devices. The target is an embedded device." },
    { id: "NDR3.10", na: true, note: "Support for updates for network devices. The target is an embedded device." },
    { id: "HDR3.11", na: true, note: "Physical tamper resistance for host devices. The target is an embedded device." },
    { id: "NDR3.11", na: true, note: "Physical tamper resistance for network devices. The target is an embedded device." },
    { id: "HDR3.12", na: true, note: "Product supplier roots of trust for host devices. The target is an embedded device." },
    { id: "NDR3.12", na: true, note: "Product supplier roots of trust for network devices. The target is an embedded device." },
    { id: "HDR3.13", na: true, note: "Asset owner roots of trust for host devices. The target is an embedded device." },
    { id: "NDR3.13", na: true, note: "Asset owner roots of trust for network devices. The target is an embedded device." },
    { id: "HDR3.14", na: true, note: "Integrity of the boot process for host devices. The target is an embedded device." },
    { id: "NDR3.14", na: true, note: "Integrity of the boot process for network devices. The target is an embedded device." },

    // ---- FR4  Data confidentiality ---------------------------------------
    { id: "CR4.1", sl: 2, ev: "Configuration and logic held on the device are readable only by an authenticated engineering role." },
    { id: "CR4.2", sl: 1, ev: "A factory reset clears logic and configuration, but there is no documented erase of the audit buffer or the secure element, and no verification of erasure.",
      rem: { rank: 15, band: "Low", owner: "Controls Engineering Team",
        action: "Agree a documented decommissioning erase procedure with the supplier, including verification, and apply it before any controller leaves site.",
        impact: "Returned or scrapped controllers leave site carrying credentials, addresses and safety logic." } },
    { id: "CR4.3", sl: 2, ev: "Signature verification and peer authentication use current algorithms and key sizes; no proprietary cryptography is used." },

    // ---- FR5  Restricted data flow ---------------------------------------
    { id: "CR5.1", sl: 2, ev: "The controller functions correctly behind the cell firewall and requires no connectivity beyond its zone." },

    { id: "NDR5.2", na: true, note: "Zone boundary protection is a network device requirement. The target is an embedded device." },
    { id: "NDR5.3", na: true, note: "Person-to-person communication restriction is a network device requirement. The target is an embedded device." },

    // ---- FR6  Timely response to events ----------------------------------
    { id: "CR6.1", sl: 1, ev: "Audit logs are readable only by attaching the engineering tool; there is no read-only or remote access path.",
      rem: { rank: 3, band: "High", owner: "Product Supplier (Meridian)",
        action: "Provide read-only access to the audit log that does not require an engineering session on the device.",
        impact: "Logs that can only be read by attaching engineering kit to a safety controller are not read, so incidents are found late or not at all." } },
    { id: "CR6.2", sl: 0, ev: "The controller offers no syslog, no SNMP trap and no other mechanism for continuous monitoring; security events remain on the device until someone looks.",
      rem: { rank: 1, band: "Critical", owner: "Product Supplier (Meridian)",
        action: "Require a standard continuous monitoring output (syslog or equivalent) in the product roadmap, and make it a condition of the standardisation decision.",
        impact: "Manipulation of a safety-related controller is undetectable in service and would surface only at the next proof test." } },

    // ---- FR7  Resource availability --------------------------------------
    { id: "CR7.1", sl: 2, ev: "The controller sheds non-essential communication under load and maintains the safety function; behaviour was confirmed under a broadcast storm test." },
    { id: "CR7.2", sl: 2, ev: "Communication and diagnostic tasks are resource-bounded and cannot starve the safety task." },
    { id: "CR7.3", sl: 1, ev: "Logic and configuration can be backed up through the engineering tool, but the backup carries no integrity check.",
      rem: { rank: 10, band: "Medium", owner: "Controls Engineering Team",
        action: "Verify backup integrity as part of the backup procedure, and hold an offline copy of the signed logic for each controller.",
        impact: "An altered or corrupt backup gives false assurance until a restore is attempted after an incident." } },
    { id: "CR7.4", sl: 2, ev: "A controller can be restored to a known good state from backup within a documented maintenance window." },
    { id: "CR7.5", na: true, note: "Recorded, not scored: CR 7.5 carries no capability security level in Annex B Table B.1, so it is not selected at SL 1-4. Emergency power is provided externally by the cabinet UPS rather than by the controller." },
    { id: "CR7.6", sl: 2, ev: "Security-relevant settings can be set to the supplier's hardening guidance and read back through the engineering tool." },
    { id: "CR7.7", sl: 1, ev: "The web diagnostic server and a legacy programming protocol are enabled by default and cannot both be disabled on current firmware.",
      rem: { rank: 16, band: "Low", owner: "Product Supplier (Meridian)",
        action: "Allow every non-essential service to be disabled independently, and ship with the legacy programming protocol off by default.",
        impact: "Services that cannot be turned off are permanent attack surface on an asset with a twenty-year life." } },
    { id: "CR7.8", sl: 2, ev: "The controller reports its type, firmware version and installed option cards to the asset inventory." }
  ];

  function apply(E) {
    E.updateMetadata(metadata);
    if (E.setDefaultTargetSL) E.setDefaultTargetSL(TARGET_SL);
    var tid = E.state.activeTargetId;
    // Name the component: reports quote the target name throughout, and the
    // default "Component 1" reads like an unfinished assessment.
    if (E.renameTarget) E.renameTarget(tid, "Meridian S9 controller");
    rows.forEach(function (row) {
      var patch;
      if (row.na) {
        patch = { applicable: false };
        if (row.note) patch.notes = row.note;
      } else {
        patch = { applicable: true };
        if (row.ev) patch.evidence = row.ev;
        if (row.rem) {
          patch.priorityRank = row.rem.rank;
          patch.priorityBand = row.rem.band;
          patch.owner = row.rem.owner;
          patch.action = row.rem.action;
          patch.impact = row.rem.impact;
        }
      }
      E.setResponse(tid, row.id, patch);
      applyItems(E, tid, row);
    });
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);
  }

  // The rows above author an ACHIEVED SL per requirement, which is the natural
  // way to describe a demo. The capture model is per item (base + each
  // requirement enhancement), so translate: every item that first applies at
  // or below the authored level is met, and the next one up is not.
  //
  // row.comp lists components satisfied by a compensating countermeasure
  // instead of natively, so the demo exercises the second SL-A vector.
  function applyItems(E, tid, row) {
    var inst = E.state.instrument;
    var req = (inst.requirements || []).filter(function (r) { return r.id === row.id; })[0];
    if (!req) return;
    var items = window.App.Scoring.requirementItems(req);
    var comp = row.comp || [];
    items.forEach(function (it) {
      // Items first selected above the target are outside this assessment;
      // answering them would put states on a card the consultant never sees.
      if (it.firstSL > TARGET_SL) return;
      if (row.na) {
        E.setItemState(tid, row.id, it.componentId, "na", row.note || "Not applicable to this component.");
        return;
      }
      var met = it.firstSL <= row.sl;
      var state = met ? (comp.indexOf(it.componentId) !== -1 ? "met-compensating" : "met") : "not-met";
      E.setItemState(tid, row.id, it.componentId, state);
    });
  }

  return { metadata: metadata, reportNarrative: reportNarrative, rows: rows, targetSL: TARGET_SL, apply: apply };
})();
