/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/*
 * Shared demo dataset for the ISA/IEC 62443-3-3 (capability-SL) tour.
 *
 * A complete, realistic, FINISHED system security assessment for a fictional
 * upper-tier petrochemical site (Acme Petrochemicals, Plant A). Every applicable
 * system requirement is answered, every requirement below target carries a full
 * remediation plan (priority, owner, action, impact), and the consultant
 * exec-summary blocks (exposure, top priorities) are supplied. Loaded by
 * tour.html, which reaches any view of this demo by hash - #iec-62443-3-3 for
 * the report, #iec-62443-3-3/fr/FR1 for the capture and guidance view.
 *
 * The scenario is deliberately shaped to exercise what makes 62443-3-3 awkward
 * in practice:
 *   - the unit of assessment is the ZONE, per 62443-3-2, so the site is split
 *     into three with their own SL-T. The safety zone carries a higher target
 *     for identification and integrity (a per-FR SL-T vector), which brings
 *     requirement enhancements into scope there and nowhere else;
 *   - most countermeasures are implemented once for the whole site - one
 *     directory service, one log collector, one backup regime - so they are
 *     answered ONCE on the system-wide layer and every zone inherits them.
 *     Only what genuinely differs is recorded per zone;
 *   - two of those shared answers do not reach every zone (the site time
 *     service and the endpoint protection both stop at the safety controllers),
 *     so they are scoped to the zones they serve and the safety zone answers
 *     for itself: once by other means, once as a justified not-applicable;
 *   - the safety zone overrides the directory answer because the SIS
 *     engineering station was never joined to it, which is what turns a shared
 *     action into a zone-specific one;
 *   - SR 5.3 is satisfied by a compensating countermeasure, so the second SL-A
 *     vector (compensating measures stripped out) has something to show.
 *
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.App = window.App || {};
window.App.TourSL = (function () {
  "use strict";

  var TARGET_SL = 2;

  var metadata = {
    clientName: "Acme Petrochemicals",
    // The zones carry the detail now, so the site name stays short: the header
    // already appends the active zone to it.
    siteName: "Plant A",
    consultant: "S. Maesschalck",
    dateOfVisit: "2026-05-21",
    documentRevision: "1.0",
    confidentiality: "Confidential"
  };

  // The zones and conduits the site was divided into, per 62443-3-2. The safety
  // zone is held to SL 3 for identification and for system integrity: on an
  // instrumented protective function, knowing who acted and that the logic is
  // what it should be carries a process-safety consequence the other zones do
  // not have. Everything else stays at the site target of SL 2.
  var zones = [
    { name: "BPCS - basic process control",
      note: "Distributed control system, operator consoles and the process controllers behind them." },
    { name: "SIS - safety instrumented system",
      perFR: { FR1: 3, FR3: 3 },
      note: "Safety controllers, the SIS engineering station and the protective functions they execute." },
    { name: "Plant DMZ",
      note: "Historian replica, remote-access jump host and the conduits between the control network and corporate IT." }
  ];

  // What the assessment rests on. A capability-SL result is a claim about what
  // could be DEMONSTRATED, so the register carries the configuration exports
  // and the things seen on the console, not just who was in the room - that is
  // the difference between an assessed SL-A and a reported one.
  var basis = {
    interviews: [
      { name: "G. Whitcombe", role: "Control Systems Manager, Plant A",      date: "2026-05-19" },
      { name: "P. Ridley",    role: "Functional Safety Engineer (SIS)",      date: "2026-05-19" },
      { name: "N. Achebe",    role: "OT Infrastructure Lead",                date: "2026-05-20" },
      { name: "L. Fairhurst", role: "IT Security Manager",                   date: "2026-05-20" },
      { name: "M. Doyle",     role: "Instrument Technician (shift)",         date: "2026-05-21" },
      { name: "K. Sandhu",    role: "Vendor Support Manager, DCS supplier",  date: "2026-05-21" }
    ],
    documents: [
      { title: "Zone and conduit model, Plant A",                      reference: "ZCD-PLA-2026 rev C", date: "2026-03-11" },
      { title: "SL-T determination and risk assessment record",        reference: "RA-ZC-PLA-2026",     date: "2026-03-18" },
      { title: "Control network architecture drawing",                 reference: "DWG-OT-208 rev J",   date: "2025-10-02" },
      { title: "IT/OT firewall rule set export",                       reference: "FW-PLA-2026-05-18",  date: "2026-05-18" },
      { title: "DCS user account and role listing",                    reference: "DCS-ACC-2026-05",    date: "2026-05-18" },
      { title: "SIS safety requirements specification",                reference: "SRS-PLA-04 rev B",   date: "2024-11-27" },
      { title: "Backup and restore procedure, control systems",        reference: "OPS-BR-11 v2.2",     date: "2025-07-14" },
      { title: "Patch and antivirus exception register, OT",           reference: "OT-PATCH-2026Q1",    date: "2026-04-02" },
      { title: "Remote access procedure and vendor access log",        reference: "OPS-RA-06 v3.0",     date: "2026-05-01" }
    ],
    observations: [
      { name: "BPCS operator consoles and engineering workstation", method: "Observed at the console with the control systems manager; account, session and logging behaviour demonstrated live" },
      { name: "SIS engineering station",                            method: "Observed with the functional safety engineer; local account use and change workflow walked through" },
      { name: "IT/OT firewall and DMZ jump host",                   method: "Rule set and session policy reviewed on screen with the OT infrastructure lead" },
      { name: "Plant historian replica in the DMZ",                  method: "Data path and authentication demonstrated" },
      { name: "Control room and rack rooms",                        method: "Physical walkthrough, including port and media controls on the cabinets" }
    ]
  };

  var reportNarrative = {
    // How the assessment was run, answering the method prompt in the report.
    method:
      "Each requirement was assessed against its zone target Security Level over three days on site, through configuration review of the controllers, engineering workstations and firewalls, interviews with the control systems, instrumentation and IT security leads, and observation in the control room and rack rooms. Answers recorded once for the whole system are marked as shared. The achieved Security Level reflects what could be demonstrated; intent or documentation on its own was not enough.",
    nextSteps:
      "Agree an owner and a target date for each action in the roadmap, keeping the site-wide work separate from the zone-specific work\nScope continuous monitoring of the control network (SR 6.2) as one project covering all three zones\nDecide with the safety authority how the SIS engineering station will be brought under named-account control\nConfirm and document the IT/OT firewall rule set that FR5 currently depends on\nRe-assess the zones once monitoring is in service",
    regulatoryExposure:
      "Acme operates Plant A as an upper-tier COMAH petrochemical site, where a cyber compromise of the basic process control or safety-related systems carries process-safety as well as availability consequences. The site was divided into three zones under 62443-3-2 and assessed against a target of SL 2, with the safety instrumented system held to SL 3 for identification and for system integrity because a change to a protective function has to be attributable and provably intact. Most Foundational Requirements reach only SL 1 in every zone, so the control system is protected against casual or coincidental violation but not against someone acting deliberately with simple means. The safety zone is the exception in both directions: its integrity controls are genuinely strong, and its identification is on the floor at SL 0 because the SIS engineering station sits outside the site directory on a shared local account.",
    topPriorities:
      "Two of the priorities are single pieces of work that resolve all three zones at once, because the controls behind them are implemented once for the site: continuous monitoring of the control network (SR 6.2), so that an intrusion can be detected where undetected manipulation has safety consequences, and authentication of software processes and devices (SR 1.2), so that a rogue or spoofed component is not trusted simply for being on the network. The third is specific to one zone: bringing the SIS engineering station into the directory, or issuing named local accounts if the safety case forbids it, so that a change to a protective function can be attributed to a person. Note also that FR5 meets its target only because person-to-person communication is blocked at the IT/OT firewall rather than by the control system itself; if that rule set lapses, the level goes with it."
  };

  // Row shapes:
  //   { id, sl, ev }                         answered, meets/near target, evidence only
  //   { id, sl, ev, rem:{rank,band,owner,action,impact} }   answered, below target
  //   { id, na:true, note }                  not applicable
  //   { id, sl, ev, comp:["base","RE1"] }    those items satisfied by a
  //                                          compensating countermeasure
  //   { id, sl, ev, partial:true }           the capability exists but is not
  //                                          carried through ("applied
  //                                          unevenly", "below policy"). Never
  //                                          satisfies a level, so the
  //                                          requirement stays short of target.
  //                                          Use this rather than an SL below
  //                                          the target where the requirement
  //                                          selects nothing at the higher
  //                                          level: there, "SL 1" and "SL 2"
  //                                          mean the same thing and the
  //                                          requirement would read as MET
  //                                          beside evidence saying it is not.
  //   { id, sl, ev, only:["base"] }          (zone rows) override just these
  //                                          items; the rest stay inherited
  //   { id, sl, ev, covers:[zoneName,...] }  (system-wide rows) the answer
  //                                          reaches only these zones; the
  //                                          others answer for themselves
  //
  // These are the SYSTEM-WIDE answers: countermeasures implemented once for the
  // whole site, which every zone inherits unless it overrides them below.
  var rows = [
    // ---- FR1  Identification and authentication control ----------------
    // The directory case: one Active Directory forest gives individual human
    // identity across the site, so the base item is met everywhere at once.
    // What is missing - unique identification on the shared consoles - is
    // missing everywhere too, which is what makes it a single piece of work.
    { id: "SR1.1", sl: 1, ev: "Individual human identity comes from the corporate Active Directory, which reaches the DCS consoles and the engineering workstations through a one-way trust; joiners and leavers are processed within one working day. Shared operator logins remain in use on the console desks themselves, so identity is established for the workstation but not for the person at it.",
      rem: { rank: 3, band: "High", owner: "OT Security Lead",
        action: "Move to individual authentication at the operator consoles where the DCS supports it; where it does not, apply logged kiosk sessions and physical access control as compensating measures.",
        impact: "Shared logins prevent attribution and make credential misuse impossible to trace on a safety-critical console." } },
    { id: "SR1.2", sl: 0, ev: "Devices and software processes connect to the control network without authentication; trust is based on network location only.",
      rem: { rank: 2, band: "High", owner: "OT Security Lead",
        action: "Introduce device/process authentication (certificates or keyed identities) for controllers and engineering tools, starting at the most critical conduits.",
        impact: "An unauthenticated device is an open door: a rogue or spoofed component is trusted simply for being on the network." } },
    { id: "SR1.3", sl: 2, ev: "An account-management process exists and is applied to OT accounts, including joiners and leavers." },
    { id: "SR1.4", sl: 2, ev: "Identifiers are managed and unique across OT systems." },
    { id: "SR1.5", sl: 2, ev: "Authenticators are managed for OT: vendor defaults are changed at commissioning, shared secrets are held in the site vault, and changes go through the same request process as accounts. Authenticators are held in software only; nothing is backed by a hardware token or module.",
      rem: { rank: 11, band: "Medium", owner: "OT Security Lead",
        action: "Where the safety zone's SL 3 target applies, back engineering authenticators with hardware (smartcard or token) rather than a software secret alone.",
        impact: "A software-only authenticator for the safety engineering station can be copied without the holder knowing." } },
    { id: "SR1.6", na: true, note: "No wireless networking is used in the control environment." },
    { id: "SR1.7", sl: 2, ev: "Password strength is enforced by the directory for everything joined to it; the handful of legacy devices that cannot meet it are listed, and their exception is reviewed annually. Password lifetime and generation are left to the user within that policy.",
      rem: { rank: 12, band: "Medium", owner: "OT Security Lead",
        action: "Where the safety zone's SL 3 target applies, enforce password generation and lifetime for human users rather than leaving both to the account holder.",
        impact: "A password that never changes on a safety engineering account outlives every person who has known it." } },
    { id: "SR1.8", na: true, note: "No public key infrastructure is deployed in the control environment." },
    { id: "SR1.9", na: true, note: "No public-key authentication is used in the control environment." },
    { id: "SR1.10", sl: 2, ev: "Authenticator feedback is obscured on control interfaces." },
    { id: "SR1.11", sl: 2, ev: "Unsuccessful login attempts are limited and logged." },
    { id: "SR1.12", sl: 2, ev: "A system-use notification is presented at login on management interfaces." },
    { id: "SR1.13", sl: 1, ev: "Remote access is via VPN to a jump host, but multifactor authentication is not enforced for all remote OT access.",
      rem: { rank: 7, band: "High", owner: "IT/OT Network Team",
        action: "Enforce MFA for all remote access into the OT environment and restrict it to brokered, logged jump-host sessions.",
        impact: "Remote access without MFA is a primary external route into the control system." } },

    // ---- FR2  Use control ----------------------------------------------
    { id: "SR2.1", sl: 1, ev: "Role-based authorization is partial; some accounts retain broad privileges beyond their role.",
      rem: { rank: 8, band: "High", owner: "OT Security Lead",
        action: "Define and enforce least-privilege roles on the control system and remove standing broad privileges.",
        impact: "Broad privileges mean one compromised account can change logic, setpoints or safety parameters." } },
    { id: "SR2.2", na: true, note: "No wireless networking is used in the control environment." },
    { id: "SR2.3", sl: 2, ev: "Removable media is blocked by default on OT endpoints and released only by documented exception; portable engineering devices are issued from a managed pool and their use is logged." },
    { id: "SR2.4", sl: 2, ev: "Mobile code is restricted on control systems." },
    { id: "SR2.5", sl: 2, ev: "Session lock is enforced on engineering and operator workstations." },
    { id: "SR2.6", sl: 2, ev: "Remote sessions terminate on timeout and on disconnect." },
    { id: "SR2.7", sl: 2, ev: "Concurrent session control is configured on management interfaces." },
    { id: "SR2.8", sl: 2, ev: "The auditable-event set is defined for OT and is enabled consistently across the controllers, the HMIs and the network devices." },
    { id: "SR2.9", sl: 2, ev: "Audit storage capacity is provisioned and monitored." },
    { id: "SR2.10", sl: 2, ev: "Audit processing and storage failures raise an alarm to the SOC, and the response to one is defined in the OT monitoring procedure." },
    // A shared control that does not reach every zone. One site NTP service
    // serves the control network and the DMZ; the safety controllers do not
    // take network time at all, so this answer is scoped to the zones it
    // actually serves and the safety zone answers for itself.
    { id: "SR2.11", sl: 2, covers: ["BPCS - basic process control", "Plant DMZ"],
      ev: "A single site time service synchronises the DCS, the operator consoles and the DMZ hosts, and drift is alarmed. It does not extend to the safety controllers, which do not take network time." },
    { id: "SR2.12", sl: 1, ev: "Shared accounts and inconsistent logging prevent reliable attribution of actions.",
      rem: { rank: 21, band: "Low", owner: "OT Security Lead",
        action: "Once individual identity and consistent logging are in place, ensure key control actions are attributable.",
        impact: "Without attribution, neither accidental nor malicious change can be traced to an actor." } },

    // ---- FR3  System integrity -----------------------------------------
    { id: "SR3.1", sl: 0, ev: "Control protocols run without integrity protection; reliance is on network segmentation.",
      rem: { rank: 4, band: "High", owner: "Controls Engineering Team",
        action: "Enable integrity-protected protocol options where devices support them; otherwise strengthen segmentation and monitoring and document the residual risk.",
        impact: "Unprotected control messages can be altered in transit by an attacker on the OT network, affecting process integrity." } },
    // Likewise: endpoint protection needs a host to run on. It covers the
    // Windows-based DCS and DMZ estate and cannot reach the safety
    // controllers, which record a justified not-applicable of their own.
    { id: "SR3.2", sl: 2, covers: ["BPCS - basic process control", "Plant DMZ"],
      ev: "Malicious-code protection is deployed on the Windows-based DCS servers, operator consoles and DMZ hosts, with OT-aware tuning and exclusions agreed with the vendor." },
    { id: "SR3.3", sl: 0, ev: "Security functions are not routinely verified after changes or maintenance.",
      rem: { rank: 14, band: "Medium", owner: "Controls Engineering Team",
        action: "Add post-change verification of security functions to the maintenance procedure.",
        impact: "Security controls can silently fail or be disabled during maintenance and go unnoticed." } },
    // sl 0, not 1: the base requirement IS the ability to detect unauthorised
    // changes, and the evidence says there is none. SR 3.4 selects nothing
    // between SL 1 and SL 3 (RE1 is an SL 3 selection), so authoring 1 here made
    // the requirement come out met at the SL 2 target - beside this evidence and
    // a plan to fix it. See test-tour-sl.html.
    { id: "SR3.4", sl: 0, ev: "There is no systematic verification of firmware/software integrity; updates are applied on vendor advice without integrity checks.",
      rem: { rank: 9, band: "Medium", owner: "Controls Engineering Team",
        action: "Introduce integrity verification (signing/hashing) for firmware and application updates, behind a change-control gate.",
        impact: "Unverified updates can introduce tampered or unapproved code into controllers." } },
    { id: "SR3.5", sl: 2, ev: "Input validation is implemented in application interfaces." },
    { id: "SR3.6", sl: 2, ev: "Deterministic / fail-safe output behaviour is designed into the control logic." },
    { id: "SR3.7", sl: 2, ev: "Error handling avoids leaking sensitive information." },
    { id: "SR3.8", sl: 1, ev: "Session integrity protections are limited on the legacy control protocols in use.",
      rem: { rank: 22, band: "Low", owner: "Controls Engineering Team",
        action: "Enable session integrity options where supported; compensate with segmentation elsewhere.",
        impact: "Session hijacking or command injection on the control network could alter commands." } },
    { id: "SR3.9", sl: 1, ev: "Audit logs are not protected against modification or deletion on the devices that hold them.",
      rem: { rank: 15, band: "Medium", owner: "SOC Manager",
        action: "Protect audit data: forward it off-device promptly, restrict access, and integrity-protect it where supported.",
        impact: "Unprotected logs can be altered by an attacker to hide activity." } },

    // ---- FR4  Data confidentiality -------------------------------------
    { id: "SR4.1", sl: 2, ev: "Information-confidentiality controls protect engineering and process data at rest." },
    { id: "SR4.2", sl: 2, ev: "Information persistence is managed; sensitive data is cleared from reused media." },
    { id: "SR4.3", sl: 2, ev: "Cryptography follows the site standard: TLS on the IT-facing links, the vendor's authenticated protocol within the control network, and keys held in the corporate key store." },

    // ---- FR5  Restricted data flow (meets target) ----------------------
    { id: "SR5.1", sl: 2, ev: "The control system is segmented into zones with a documented zone/conduit model." },
    { id: "SR5.2", sl: 2, ev: "Zone boundaries are protected by firewalls/conduits with restricted rule sets." },
    // Satisfied by a compensating countermeasure rather than natively: the
    // demo needs one so the second SL-A vector (compensating measures stripped
    // out) and the "held by compensating" flag are both visible in the report.
    { id: "SR5.3", comp: ["base"], sl: 2, ev: "The control system itself does not restrict general-purpose person-to-person communication. It is restricted instead at the IT/OT firewall, where mail, messaging and web egress are blocked for every OT subnet, and this rule set is reviewed quarterly. Recorded as a compensating countermeasure: it delivers the outcome but sits outside the control system." },
    { id: "SR5.4", sl: 3, ev: "Applications are partitioned with strong separation between the safety system and basic process control." },

    // ---- FR6  Timely response to events --------------------------------
    { id: "SR6.1", sl: 1, partial: true, ev: "OT logs are held locally with short retention and are not centrally accessible for analysis.",
      rem: { rank: 10, band: "Medium", owner: "SOC Manager",
        action: "Forward OT logs to a protected collector/SIEM with retention that supports investigation.",
        impact: "Locally held, short-retention logs rarely survive long enough to investigate an incident." } },
    { id: "SR6.2", sl: 0, ev: "There is no continuous security monitoring of the OT network; only local device logs exist, with no aggregation or analysis.",
      rem: { rank: 1, band: "High", owner: "SOC Manager",
        action: "Deploy passive, ICS-aware network monitoring on the control network, baseline normal traffic, and route anomalies to a monitored queue.",
        impact: "Without monitoring, manipulation of the process or a foothold on the control network can go undetected until it causes a safety or availability event." } },

    // ---- FR7  Resource availability ------------------------------------
    { id: "SR7.1", sl: 2, ev: "Denial-of-service protections are in place at the network boundary." },
    { id: "SR7.2", sl: 2, ev: "Resource management prevents exhaustion of critical control resources." },
    { id: "SR7.3", sl: 1, ev: "Controller configs and HMI projects are backed up, but restore has not been tested and some backups sit on engineering laptops.",
      rem: { rank: 5, band: "High", owner: "Controls Engineering Team",
        action: "Centralise and protect OT backups (offline/immutable copies) and test full restore of a representative system on a defined cycle.",
        impact: "Untested backups give false assurance; recovery after a destructive incident could be slow or fail." } },
    { id: "SR7.4", sl: 0, ev: "Recovery depends on individual engineers and vendor support; there is no documented reconstitution procedure.",
      rem: { rank: 6, band: "High", owner: "Controls Engineering Team",
        action: "Document and resource reconstitution runbooks (golden images, spares, vendor contacts, ordered restart steps).",
        impact: "Recovery that relies on specific people extends downtime to the process after an incident." } },
    { id: "SR7.5", sl: 2, ev: "Emergency power (UPS and generator) protects the control system." },
    { id: "SR7.6", sl: 0, ev: "There is no managed baseline for network/security configuration of OT devices; settings drift from any standard.",
      rem: { rank: 16, band: "Medium", owner: "IT/OT Network Team",
        action: "Define and enforce configuration baselines for OT network and security settings, with drift detection.",
        impact: "Drifted configurations reopen closed gaps and are hard to detect without a baseline." } },
    { id: "SR7.7", sl: 0, ev: "Unused services and ports remain enabled on controllers and servers at vendor defaults.",
      rem: { rank: 17, band: "Low", owner: "Controls Engineering Team",
        action: "Disable unused services and ports and remove unnecessary software from OT devices where supported.",
        impact: "Every enabled but unused service is additional attack surface on a long-lived device." } },
    { id: "SR7.8", sl: 1, ev: "The OT component inventory covers roughly 80% and is maintained manually; firmware versions are incomplete.",
      rem: { rank: 18, band: "Low", owner: "Controls Engineering Team",
        action: "Complete and automate the OT component inventory, including firmware versions and connectivity.",
        impact: "You cannot protect, patch or monitor components you do not know about." } }
  ];

  // What differs per zone, and only that. Everything not listed here is taken
  // from the system-wide answers above, which is the point: the consultant
  // states a shared control once and records the exceptions.
  var zoneRows = {
    // The safety zone is the reason the system-wide answer is not the whole
    // story. It is also held to SL 3 for FR1 and FR3, so enhancements that are
    // out of scope elsewhere are assessed here.
    "SIS - safety instrumented system": [
      // Only the base item differs: the directory does not reach this zone.
      // The missing multifactor (RE1, RE2) is missing everywhere, so those
      // stay inherited from the system-wide answer.
      { id: "SR1.1", sl: 0, only: ["base"], ev: "The SIS engineering station was never joined to the directory: it is a standalone workstation with a single shared engineering account known to the four people who hold the key to the cabinet. The directory answer recorded for the site does not reach this zone.",
        rem: { rank: 4, band: "High", owner: "Controls Engineering Team",
          action: "Join the SIS engineering station to the directory, or (if the safety case forbids it) issue named local accounts and reconcile them against the directory quarterly.",
          impact: "Nobody can say which engineer changed a protective function, on the one system where that question matters most." } },
      { id: "SR1.11", sl: 2, ev: "The safety controllers lock out after three failed attempts and raise a diagnostic to the DCS." },
      // Two requirements are met at the site target of SL 2 but fall short of
      // the SL 3 this zone carries. The gap exists only here, so the action
      // does too - the site-wide answer is not the thing that needs changing.
      { id: "SR1.3", sl: 2, ev: "OT accounts follow the site joiner/leaver process, but the safety zone's local accounts are administered separately from the rest of the control system, so account management is not unified as SL 3 requires.",
        rem: { rank: 12, band: "Medium", owner: "Controls Engineering Team",
          action: "Bring the safety zone's accounts under the same managed process as the rest of the control system once the engineering station is reachable from the directory.",
          impact: "Separately administered accounts drift: a leaver removed everywhere else can remain valid on the safety engineering station." } },
      // The two the shared answers do not reach. One is met by other means and
      // needs no action; the other cannot apply here at all, and carries the
      // justification without which it would block the level rather than being
      // excluded.
      { id: "SR2.11", sl: 2, ev: "The safety controllers take their time from the DCS gateway rather than the site time service, and the offset is checked and recorded at each proof test." },
      { id: "SR3.2", na: true,
        note: "The safety controllers run no general-purpose operating system, so there is no host on which endpoint protection could run. The equivalent outcome is delivered by signed logic, a physical key switch and a cabinet with no removable-media path." },
      { id: "SR2.1", sl: 2, ev: "The safety application enforces a separate maintain/operate key switch position for logic change; operate-position accounts cannot download." },
      // Strong integrity is the reason the safety zone can carry an SL 3 target
      // for FR3 at all: signed logic and a hardware key switch are exactly what
      // the higher level asks for.
      { id: "SR3.1", sl: 3, ev: "Safety-related communications run on the vendor's authenticated black-channel protocol with per-message integrity, independent of the control network beneath it." },
      { id: "SR3.4", sl: 3, ev: "Safety logic is cryptographically signed by the engineering tool and the signature is verified by the controller at download and at every restart." },
      { id: "SR5.1", sl: 3, ev: "The safety zone sits behind its own conduit with a deny-by-default rule set; only the read-only status feed to the DCS crosses it." },
      { id: "SR7.1", sl: 3, ev: "The safety controllers are unaffected by load on the control network: the protective function runs on a separate, deterministic bus." }
    ],
    // The DMZ is where the site's external exposure is concentrated, and where
    // the strongest boundary controls already are.
    "Plant DMZ": [
      { id: "SR1.13", sl: 2, ev: "Remote access into the DMZ enforces multifactor authentication at the jump host, and every session is brokered and recorded. This applies to the DMZ only; sessions that continue into the control zones do not re-authenticate." },
      { id: "SR5.2", sl: 3, ev: "The conduit to corporate IT is a managed firewall pair with an explicit, reviewed rule set and no direct control-network routes." },
      { id: "SR6.1", sl: 2, ev: "DMZ hosts forward their logs to the corporate collector, so this zone does have retained, searchable logs even though the control zones do not.",
        rem: null },
      { id: "SR7.7", sl: 2, ev: "DMZ hosts are built from a hardened image with unused services removed before commissioning." }
    ]
  };

  function applyRow(E, tid, row, ceiling, zoneIds) {
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
    applyItems(E, tid, row, ceiling);
    // A shared answer that reaches only some zones says which. Named by zone
    // rather than by id, so the row reads as documentation.
    if (row.covers && zoneIds) {
      var ids = row.covers.map(function (n) { return zoneIds[n]; }).filter(Boolean);
      window.App.Scoring.requirementItems(
        (E.state.instrument.requirements || []).filter(function (r) { return r.id === row.id; })[0] || {}
      ).forEach(function (it) {
        if (typeof ceiling === "number" && it.firstSL > ceiling) return;
        E.setItemCoverage(row.id, it.componentId, ids);
      });
    }
  }

  // Acme has been assessed before. The 2024 visit is the same instrument, the
  // same zones and the same targets - what differs is how much was in place,
  // expressed here as only the requirements that have MOVED since. Everything
  // not listed was the same then as now, which is what a real re-assessment
  // looks like: a handful of things fixed, the rest unchanged.
  var PRIOR = {
    dateOfVisit: "2024-03-12",
    documentRevision: "1.0",
    opportunityId: "OPP-3182",
    label: "2024 baseline assessment",
    deltas: [
      { id: "SR1.5",  sl: 0, ev: "No password policy on the control system; vendor defaults still in place on two engineering stations." },
      { id: "SR2.1",  sl: 0, ev: "Every engineer signed in to the same operator account; no separation between view and change." },
      // SR 3.4 is deliberately NOT here. Both visits found the same thing - no
      // integrity verification - so it has not moved, and it still carries an
      // open remediation plan. A re-assessment that shows every finding closing
      // is not one anybody recognises; something outstanding since 2024 is the
      // more useful demo.
      { id: "SR7.3",  sl: 0, ev: "Backups taken ad hoc to a local share, never tested." },
      // These two say "flat" and "none", which is SL 0, not SL 1. Authored at 1
      // they also made no visible difference: no item of either requirement is
      // first selected at SL 2, so the captured answers were identical to this
      // year's and the comparison rightly reported no movement.
      { id: "SR5.1",  sl: 0, ev: "Flat control network; the IT/OT boundary was a single router ACL." },
      { id: "SR1.13", sl: 0, ev: "Vendor access by unmanaged VPN direct to the process network." },
      { id: "SR4.1",  sl: 0, ev: "No confidentiality controls on engineering data in transit." }
    ]
  };

  // The 2024 answers: today's rows with the deltas above swapped in.
  function priorRows() {
    var byId = {};
    PRIOR.deltas.forEach(function (d) { byId[d.id] = d; });
    return rows.map(function (r) {
      var d = byId[r.id];
      // No row in the archive carries a remediation plan: those were written
      // for THIS year's report. Keeping them would put 2026 actions, owners and
      // priority ranks on a 2024 assessment.
      var base = { id: r.id, sl: r.sl, ev: r.ev, covers: r.covers, na: r.na,
                   note: r.note, partial: r.partial, comp: r.comp, only: r.only };
      if (!d) return base;
      base.sl = d.sl;
      base.ev = d.ev;
      delete base.partial;   // the delta states the level outright
      delete base.comp;
      return base;
    });
  }

  // Snapshot one assessment as a comparison baseline for another, the way
  // Compare.extractBaseline does from a loaded file - but from a sibling in
  // this same file, since both visits now live together.
  function baselineFrom(E, ass) {
    return {
      source: {
        fileName: "(previous assessment in this file)",
        clientName: (E.state.project && E.state.project.clientName) || "",
        dateOfVisit: (ass.engagementMeta && ass.engagementMeta.dateOfVisit) || "",
        documentRevision: (ass.engagementMeta && ass.engagementMeta.documentRevision) || "",
        savedAt: ""
      },
      instrumentContentVersion: ass.instrumentContentVersion || "",
      targets: (ass.targets || []).map(function (t) { return { id: t.id, name: t.name }; }),
      responses: JSON.parse(JSON.stringify(ass.responses || [])),
      targetMap: {}
    };
  }

  // Zones and conduits first: the shared layer is scoped against the highest
  // target any of them asks for, so the targets have to exist before the
  // system-wide answers are recorded. Both visits assessed the same plant, so
  // both build the same zones - with their own target ids, since an assessment
  // owns its targets outright.
  function buildTargets(E) {
    var ids = {};
    zones.forEach(function (z, i) {
      var t = i === 0
        ? E.state.engagement.targets[0]
        : E.addTarget(z.name);
      if (i === 0) E.renameTarget(t.id, z.name);
      ids[z.name] = t.id;
      if (z.perFR && E.setZoneFRTarget) {
        Object.keys(z.perFR).forEach(function (frId) { E.setZoneFRTarget(t.id, frId, z.perFR[frId]); });
      }
    });
    return ids;
  }

  function ceilingFor(zoneName) {
    return zones.reduce(function (m, z) {
      if (zoneName && z.name !== zoneName) return m;
      return Object.keys(z.perFR || {}).reduce(function (n, k) { return Math.max(n, z.perFR[k]); }, m);
    }, TARGET_SL);
  }

  // The 2024 visit. It fills the assessment the tour opened with, then the
  // current visit is created alongside it and activated, so the demo opens on
  // the latest - the same thing that happens when a consultant returns to a
  // customer file and adds this year's assessment.
  function applyPrior(E) {
    var prior = E.activeAssessment();
    if (!prior) return null;

    E.updateMetadata({
      dateOfVisit: PRIOR.dateOfVisit,
      documentRevision: PRIOR.documentRevision,
      opportunityId: PRIOR.opportunityId
    });
    if (E.setDefaultTargetSL) E.setDefaultTargetSL(TARGET_SL);
    if (E.renameAssessment) E.renameAssessment(prior.id, PRIOR.label);

    var ids = buildTargets(E);
    var pr = priorRows();
    pr.forEach(function (row) { applyRow(E, E.SHARED_TARGET_ID, row, ceilingFor(), ids); });
    Object.keys(zoneRows).forEach(function (zoneName) {
      if (!ids[zoneName]) return;
      zoneRows[zoneName].forEach(function (row) { applyRow(E, ids[zoneName], row, ceilingFor(zoneName)); });
    });

    var snapshot = baselineFrom(E, prior);

    // Start this year's assessment. It is deliberately EMPTY - a re-assessment
    // is a fresh look, not last year's answers with the date changed.
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
    // the instrument, and without this the second pass added the zones again
    // and minted a second 2024 assessment.
    if (alreadySeeded(E)) return;

    // The 2024 visit first, so the current one is the latest and opening the
    // instrument lands on it.
    if (E.newAssessment && E.activeAssessment) applyPrior(E);

    E.updateMetadata(metadata);
    if (E.setDefaultTargetSL) E.setDefaultTargetSL(TARGET_SL);

    var ids = buildTargets(E);

    // The system-wide answers. The ceiling is the highest SL any zone targets,
    // so an enhancement that only the safety zone needs is still answered here
    // rather than left blank for that zone to trip over.
    rows.forEach(function (row) { applyRow(E, E.SHARED_TARGET_ID, row, ceilingFor(), ids); });

    // Then only what differs, per zone.
    Object.keys(zoneRows).forEach(function (zoneName) {
      var tid = ids[zoneName];
      if (!tid) return;
      zoneRows[zoneName].forEach(function (row) { applyRow(E, tid, row, ceilingFor(zoneName)); });
    });

    E.setActiveTarget(ids[zones[0].name]);
    if (E.setReportNarrative) E.setReportNarrative(reportNarrative);

    if (E.getBasisOfAssessment) {
      var b = E.getBasisOfAssessment();
      b.interviews   = basis.interviews.slice();
      b.documents    = basis.documents.slice();
      b.observations = basis.observations.slice();
      if (E.touchBasisOfAssessment) E.touchBasisOfAssessment();
    }
  }

  // The rows above author an ACHIEVED SL per requirement, which is the natural
  // way to describe a demo. The capture model is per item (base + each
  // requirement enhancement), so translate: every item that first applies at
  // or below the authored level is met, and the next one up is not. That is
  // exactly what "this requirement achieves SL n" means.
  //
  // row.comp lists components satisfied by a compensating countermeasure
  // instead of natively, so the demo exercises the second SL-A vector.
  function applyItems(E, tid, row, ceiling) {
    var inst = E.state.instrument;
    var req = (inst.requirements || []).filter(function (r) { return r.id === row.id; })[0];
    if (!req) return;
    var items = window.App.Scoring.requirementItems(req);
    var comp = row.comp || [];
    items.forEach(function (it) {
      // Items first selected above anything this scope targets are outside the
      // assessment; answering them would put states on a card nobody sees.
      if (typeof ceiling === "number" && it.firstSL > ceiling) return;
      // A zone row may override only the items that genuinely differ, leaving
      // the rest inherited. That is how a real capture looks, and it keeps the
      // "Revert to system-wide" control meaningful: it appears only where
      // reverting would actually change the answer.
      if (row.only && row.only.indexOf(it.componentId) === -1) return;
      if (row.na) {
        // A justified N/A: the note is the justification, without which the
        // item would block the level rather than being excluded.
        E.setItemState(tid, row.id, it.componentId, "na", row.note || "Not applicable to this zone.");
        return;
      }
      // `partial` says the capability is there but not carried through - the
      // honest answer for "applied unevenly", "inconsistently", "below policy".
      // It cannot be expressed as a Security Level, because a level is all-or
      // -nothing per item, so it is stated per item instead. It never satisfies
      // a level, so the requirement stays short of target, which is what the
      // evidence beside it says.
      if (row.partial) {
        var isPartial = row.partial === true || row.partial.indexOf(it.componentId) !== -1;
        if (isPartial) { E.setItemState(tid, row.id, it.componentId, "partial"); return; }
      }
      var met = it.firstSL <= row.sl;
      var state = met ? (comp.indexOf(it.componentId) !== -1 ? "met-compensating" : "met") : "not-met";
      E.setItemState(tid, row.id, it.componentId, state);
    });
  }

  return { metadata: metadata, reportNarrative: reportNarrative, basis: basis, rows: rows,
           zones: zones, zoneRows: zoneRows, targetSL: TARGET_SL, apply: apply,
           prior: PRIOR, priorRows: priorRows };
})();
