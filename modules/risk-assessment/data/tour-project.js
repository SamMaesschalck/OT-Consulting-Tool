/*
 * Demo project for the risk-tool tour (tour.html): a COMPLETE, realistic
 * IEC 62443-3-2 risk assessment for Acme Petrochemicals' Unit 300 alkylation
 * control system - the same client as the 62443-3-3 demo in the Assessments
 * tour, so the stage-6 risk-context export chains into that tool's "Import
 * risk context" story.
 *
 * Every tier is finished: a full assessment (assessmentType), SUC definition,
 * the high-level risk ranking (with the high scorers assigned to zones),
 * zones & conduits with exposure flags, the risk comparison decided for each
 * (two conduits found not to need a detailed assessment, each with its
 * reason), a detailed threat register as a workshop leaves it (each threat
 * linked to its assets, vulnerabilities and countermeasures, with its entry
 * point, consequence and likelihood rationale; the unmitigated rating, the
 * current one where existing countermeasures change it, and the planned one
 * after the additional countermeasures), vulnerabilities with where each is
 * known from, countermeasures with SR references and, for the additional
 * ones, an owner, priority, due date and status, every above-tolerable threat
 * given a confirmed treatment decision (reduce with countermeasures, one
 * treated through the SL-T programme, one accepted with who accepted it, when
 * and its review date), per-FR SL-T vectors with written justifications, the basis of assessment,
 * the zone and conduit characteristics with the separation rows the tool
 * raises answered (one not separated, with its reason), the tolerable risk
 * confirmed with the asset owner, the organisational policies, and two
 * approvers recorded against the current fingerprint. It keeps the house
 * risk criteria; T1, T4 and T6 give their impact per consequence category
 * (each impact the worst of them), and A1 and A2 the source of their
 * consequence.
 *
 * Shape: spt-risk-project/0.3 (see js/model.js). This file
 * is NOT loaded by index.html - only by tour.html and its test.
 * Demonstration content only - illustrative judgements, not a real engagement.
 */
window.SPT_TOUR_PROJECT = {
  "schema": "spt-risk-project/0.3",
  "savedOn": "2026-07-04T16:20:00.000Z",
  "assessmentType": "full",
  "engagement": {
    "client": "Acme Petrochemicals Ltd",
    "consultant": "S. Maesschalck",
    "assessmentDate": "2026-07-01 to 2026-07-04",
    "revision": "1.0",
    "confidentiality": "Confidential - Client Restricted"
  },
  "suc": {
    "name": "Acme Petrochemicals - Unit 300 Alkylation Control System",
    "description": "The basic process control system, safety instrumented system and supporting OT infrastructure for the Unit 300 alkylation unit at the Teesport refinery: redundant SCADA/DCS servers and operator HMIs in the central control room, unit PLCs and remote I/O in the field auxiliary rooms, the SIS performing the unit's safety instrumented functions, engineering workstations, and the plant DMZ carrying the historian and vendor access paths.",
    "scopeStatement": "In scope: all Unit 300 control, safety and engineering systems from the field controllers up to (and including) the plant DMZ, plus the conduits that cross the boundary (historian replication, vendor remote access, corporate reporting). Out of scope: the corporate IT network beyond the DMZ firewall, other process units, and the terminal loading systems (separately assessed).",
    "assumptions": [
      "Physical access to the control room and field auxiliary rooms is badge-controlled and logged",
      "The corporate network is assumed compromised for the purposes of this assessment (untrusted)",
      "Unit 300 operates continuously; a control-system outage forces a manual unit shutdown within 30 minutes",
      "Vendor support for the DCS is contractually required and uses the remote access path assessed here"
    ],
    "policies": [
      "Acme Group OT cyber security standard GS-104 (zones, remote access, removable media)",
      "Teesport permit-to-work and management of change procedures",
      "Acme Group incident response plan, OT annex"
    ]
  },
  "srs": {
    "adversaryClass": 3,
    "essentialFunctions": "Continuous closed-loop control of the alkylation reaction (temperature, acid ratio, pressure), operator view and command from the central control room, and the SIS safety instrumented functions (emergency depressurisation, acid feed isolation).",
    "worstCase": "Loss or manipulation of control or safety functions leading to an acid release or reactor overpressure: potential for multiple serious injuries on-site, off-site public exposure at the fence line, a COMAH-reportable event and multi-week unit outage.",
    "tolerableRisk": "medium",
    "tolerableConfirmed": "medium",
    "highLevelAssets": [
      { "id": "A1", "name": "Unit 300 BPCS (DCS servers, HMIs, unit PLCs)", "functionLocation": "Closed-loop control and operator interface - control room / field aux rooms", "consequence": "serious", "consequenceSource": "HAZOP revalidation, 2025", "likelihood": "medium", "note": "Primary control layer; loss forces manual shutdown, manipulation is the acid-release path. Assigned to Z1, where a detailed assessment is required." },
      { "id": "A2", "name": "Safety Instrumented System (SIS)", "functionLocation": "Emergency depressurisation and acid isolation - field aux room 2", "consequence": "severe", "consequenceSource": "LOPA and SIL determination", "likelihood": "low", "note": "Last line of defence; any compromise is intolerable regardless of likelihood. Assigned to Z2, where a detailed assessment is required." },
      { "id": "A3", "name": "Plant DMZ & process historian", "functionLocation": "Data brokerage between OT and corporate - server room", "consequence": "serious", "likelihood": "medium", "note": "Every external path transits here; a foothold pivots into the BPCS. Assigned to Z3, where a detailed assessment is required." },
      { "id": "A4", "name": "Engineering workstations & config management", "functionLocation": "DCS/PLC/SIS configuration - control building office", "consequence": "serious", "likelihood": "medium", "note": "Holds the keys to every controller; removable media and legacy tooling in routine use. Assigned to Z4, where a detailed assessment is required." },
      { "id": "A5", "name": "Laboratory information system link", "functionLocation": "Sample results feed to the historian - lab", "consequence": "serious", "likelihood": "low", "note": "One-way feed, no control path; ranked medium, monitored at high level only." },
      { "id": "A6", "name": "CCTV & physical security systems", "functionLocation": "Site perimeter and unit cameras - site-wide", "consequence": "negligible", "likelihood": "high", "note": "Commodity IP kit, frequently probed, but no process consequence; ranked low, so not taken to a detailed assessment." }
    ],
    "knownThreats": [
      "Capable criminal/ransomware adversary reaching OT via corporate IT or vendor access",
      "State-capable adversary interest in refining sector (assumed class 3 for this SUC)",
      "Insider misuse of engineering access (contractor churn on turnarounds)",
      "Commodity malware ingress via removable media and engineering laptops"
    ],
    "mandatorySecurityFunctions": [
      "SIS must remain capable of safe shutdown independent of BPCS state",
      "Operator view and manual command must survive loss of the DMZ and corporate links",
      "All remote access must be individually attributed and time-bounded"
    ],
    "regulatory": [
      "COMAH upper tier (major accident hazard) - HSE",
      "NIS Regulations as designated OES for fuel supply"
    ],
    "clientMatrix": false,
    "clientMatrixNote": ""
  },
  "basisOfAssessment": {
    "interviews": [
      { "id": "I1", "name": "R. Calder", "role": "Asset Owner - Unit 300", "date": "2026-07-01", "notes": "Tolerable risk, worst case, business context" },
      { "id": "I2", "name": "J. Whitmore", "role": "Lead Control Systems Engineer", "date": "2026-07-01", "notes": "Architecture, engineering practice, vendor access" },
      { "id": "I3", "name": "S. Adeyemi", "role": "Process Safety Engineer", "date": "2026-07-02", "notes": "SIS functions, safety requirement spec, LOPA linkage" },
      { "id": "I4", "name": "M. Kowalski", "role": "OT/IT Network Engineer", "date": "2026-07-02", "notes": "DMZ design, firewall rules, historian replication" }
    ],
    "documents": [
      { "id": "D1", "title": "Unit 300 P&IDs and cause & effect matrix", "reference": "U300-CE-014 r7", "source": "Process safety files", "relevance": "SIS functions and safety-relevant control loops" },
      { "id": "D2", "title": "OT network diagram - Teesport", "reference": "NET-OT-002 r4", "source": "OT engineering", "relevance": "Zone and conduit partitioning baseline" },
      { "id": "D3", "title": "Vendor remote access procedure", "reference": "OPS-PROC-118", "source": "Operations", "relevance": "Remote access threat scenarios and existing countermeasures" },
      { "id": "D4", "title": "COMAH safety report extract - Unit 300", "reference": "COMAH-U300-2025", "source": "HSE submission", "relevance": "Worst-case consequence calibration" }
    ],
    "observations": [
      { "id": "O1", "description": "Control room and field auxiliary room walkdown", "location": "Unit 300", "date": "2026-07-01", "notes": "Badge control verified; unlocked engineering cabinet noted and raised" },
      { "id": "O2", "description": "DMZ firewall rule review at the console", "location": "Server room", "date": "2026-07-02", "notes": "Rules match diagram; two stale vendor rules removed during review" },
      { "id": "O3", "description": "Vendor remote access session demonstration", "location": "Control building", "date": "2026-07-02", "notes": "Session activation, attribution and recording observed end-to-end" }
    ]
  },
  "approval": {
    "name": "R. Calder",
    "role": "Asset Owner - Unit 300",
    "date": "2026-07-04",
    "statement": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the one recorded risk acceptance (legacy configuration tooling), and the per-FR SL-T vectors as the target for the security programme.",
    "approved": true
  },
  "approvals": [
    { "scope": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the one recorded risk acceptance (legacy configuration tooling), and the per-FR SL-T vectors as the target for the security programme.", "name": "R. Calder", "role": "Asset Owner - Unit 300", "organisation": "Acme Petrochemicals Ltd", "date": "2026-07-04", "revision": "1.0", "approved": true, "fingerprint": "a2-9c820478-54f40a85-ca6a499d-aa206ec0" },
    { "scope": "The SL-T of the Safety Instrumented System zone (Z2).", "name": "S. Adeyemi", "role": "Process Safety Engineer", "organisation": "Acme Petrochemicals Ltd", "date": "2026-07-04", "revision": "1.0", "approved": true, "fingerprint": "a2-9c820478-54f40a85-ca6a499d-aa206ec0" }
  ],
  "zones": [
    {
      "id": "Z1",
      "name": "Unit 300 BPCS",
      "description": "DCS servers, operator HMIs and unit PLCs performing closed-loop control of the alkylation unit.",
      "fn": "Continuous process control and operator interface for Unit 300.",
      "fromHLA": "A1",
      "detailed": { "required": true, "reason": "" },
      "assets": [
        { "id": "AS1", "name": "DCS server pair (redundant)", "type": "server" },
        { "id": "AS2", "name": "Operator HMIs x4", "type": "hmi" },
        { "id": "AS3", "name": "Unit PLCs x6 (reactor, acid feed, depropaniser)", "type": "plc" }
      ],
      "flags": { "sis-present": false, "remote-access": true, "internet-adjacent": false, "wireless": false, "removable-media": false, "many-conduits": false },
      "accessPoints": [
        "Vendor VPN via jump host (C2)",
        "Historian replication to DMZ (C1)"
      ],
      "accountableOrg": "Acme Petrochemicals, Unit 300 operations",
      "physicalBoundary": "Central control room (DCS servers and HMIs) and field auxiliary rooms 1 and 3 (unit PLCs).",
      "physicalAccessPoints": [
        "Control room door, badge controlled and logged",
        "Field auxiliary rooms 1 and 3, keyed and on the operator round"
      ],
      "dataFlows": [
        "Process values to the historian through the OPC UA broker (C1)",
        "Vendor diagnostic sessions through the jump host (C2)"
      ],
      "assumptions": [
        "The control network carries no traffic from outside the zone other than C1 and C2"
      ],
      "separation": {
        "external": { "answer": "met", "reason": "Vendor sessions end at the DMZ jump host; nothing in Z1 connects to an external network directly." }
      },
      "externalDependencies": [
        "DCS vendor support contract (remote diagnostics)",
        "Time sync from DMZ NTP"
      ],
      "securityPolicies": [
        "No engineering changes without MoC approval",
        "Vendor sessions activated per ticket, time-bounded"
      ],
      "vulnerabilities": [
        { "id": "V1", "description": "DCS servers on an extended-support OS awaiting the vendor's qualified upgrade path", "reference": "DCS vendor lifecycle notice LN-2025-11" },
        { "id": "V2", "description": "OPC DA (legacy) still enabled alongside OPC UA for two displaced clients", "reference": "DMZ firewall rule review, O2" }
      ],
      "countermeasures": [
        { "id": "M1", "description": "Per-session vendor access activation with MFA and session recording on the jump host", "addressesFR": ["IAC", "UC", "RDF"], "reference": "OPS-PROC-118", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 1.13", "SR 2.6"] },
        { "id": "M2", "description": "Application allow-listing on DCS servers and HMIs (vendor-qualified build)", "addressesFR": ["SI", "RA"], "reference": "Hardening baseline HB-DCS-03", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 3.2", "SR 7.7"] },
        { "id": "M3", "description": "Retire OPC DA: migrate the two remaining clients to OPC UA through the DMZ broker", "addressesFR": ["RDF", "SI", "RA"], "reference": "Roadmap item R-12", "existing": false, "owner": "J. Whitmore", "priority": "high", "dueDate": "2027-03-31", "status": "agreed", "srRefs": ["SR 5.1", "SR 7.7"] }
      ],
      "threats": [
        { "id": "T1", "statement": "An external attacker hijacks or rides the vendor remote access path to reach the DCS servers and issue control changes.", "source": "External attacker via vendor access", "entryPoint": "Vendor VPN and jump host (C2)", "consequence": "Unauthorised setpoint or logic changes on the reactor loops, with a credible path to an acid release.", "assetIds": ["AS1"], "vulnerabilityIds": ["V1"], "countermeasureIds": ["M1"], "affectedFR": ["IAC", "RDF"], "likelihood": "high", "impact": "serious", "impactByCategory": { "safety": "serious", "operational": "serious", "financial": "minor" }, "likelihoodRationale": "A standing remote path into a sector that is actively targeted.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T2", "statement": "Malware introduced through an engineering connection executes on a DCS server and corrupts control logic or displays.", "source": "Commodity malware via engineering path", "entryPoint": "Engineering VLAN from Z4, and the two OPC DA clients", "consequence": "Loss of view or corrupted control logic, forcing a manual shutdown of the unit.", "assetIds": ["AS1", "AS2"], "vulnerabilityIds": ["V1", "V2"], "countermeasureIds": ["M2", "M3"], "affectedFR": ["SI"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Commodity malware reaches plant networks through engineering paths a few times a year across the sector; allow-listing (M2) stops unknown programs but not a corrupted logic download or the OPC DA path, so it does not lower the likelihood.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "low", "residualImpact": "serious", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T3", "statement": "A flooding or resource-exhaustion event on the control network degrades operator view of the unit.", "source": "Network fault or deliberate DoS", "entryPoint": "Any host on the control network", "consequence": "Operator view degraded; the unit is shut down by hand within 30 minutes if it is not restored.", "assetIds": ["AS2"], "vulnerabilityIds": [], "countermeasureIds": [], "affectedFR": ["RA"], "likelihood": "low", "impact": "serious", "likelihoodRationale": "No external path reaches the control network directly.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": null, "confirmed": false, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 1, "RDF": 3, "TRE": 2, "RA": 2 },
      "justification": "The worst unmitigated risks in this zone are High (vendor-path compromise T1, engineering-path malware T2) against a Medium tolerable risk, and the standing remote access materially raises likelihood on IAC/UC/RDF, so IAC, SI and RDF are set to SL3 in line with the suggestion trace. UC is held at SL2 because use control inside the control room is procedurally constrained and no High risk hits it directly. DC reflects the low confidentiality consequence of process data (SL1). TRE and RA at SL2 support forensics and the 30-minute manual-shutdown resilience requirement. Targets are the treatment plan; capability is built through the 62443-3-3 programme this assessment exports to."
    },
    {
      "id": "Z2",
      "name": "Safety Instrumented System",
      "description": "The SIS logic solver and safety I/O performing emergency depressurisation and acid feed isolation.",
      "fn": "Safety instrumented functions for Unit 300 (SIL 2 per LOPA).",
      "fromHLA": "A2",
      "detailed": { "required": true, "reason": "" },
      "assets": [
        { "id": "AS4", "name": "SIS logic solver", "type": "safety-plc" },
        { "id": "AS5", "name": "Safety I/O and final elements", "type": "other" }
      ],
      "flags": { "sis-present": true, "remote-access": false, "internet-adjacent": false, "wireless": false, "removable-media": false, "many-conduits": false },
      "accessPoints": [
        "Engineering connection from Z4 (keyed, normally disconnected)"
      ],
      "accountableOrg": "Acme Petrochemicals, process safety",
      "physicalBoundary": "Field auxiliary room 2, SIS cabinets.",
      "physicalAccessPoints": [
        "Field auxiliary room 2, keyed, keys held by the shift supervisor"
      ],
      "dataFlows": [
        "Hardwired trip and status signals to the BPCS (no network path)"
      ],
      "assumptions": [
        "The SIS program-mode keyswitch stays in run outside authorised changes"
      ],
      "externalDependencies": [
        "SIS vendor for logic changes (site visit only, no remote path)"
      ],
      "securityPolicies": [
        "SIS changes require process safety authorisation and a keyed bypass record",
        "No shared network segments with BPCS"
      ],
      "vulnerabilities": [
        { "id": "V3", "description": "SIS engineering software runs on a Z4 workstation that also carries DCS tooling (shared engineering asset)", "reference": "Interview I3, process safety engineer" }
      ],
      "countermeasures": [
        { "id": "M4", "description": "Hardwired keyswitch required for SIS program mode; position alarmed to the control room", "addressesFR": ["IAC", "UC", "SI"], "reference": "C&E U300-CE-014", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 2.1", "SR 3.4"] },
        { "id": "M8", "description": "Move the SIS engineering software to a dedicated workstation kept in field auxiliary room 2, off the shared engineering workstation", "addressesFR": ["IAC", "UC", "SI"], "reference": "MoC to be raised", "existing": false, "owner": "S. Adeyemi", "priority": "medium", "dueDate": "2027-06-30", "status": "proposed", "srRefs": ["SR 1.1", "SR 2.1", "SR 3.2"] }
      ],
      "threats": [
        { "id": "T4", "statement": "An unauthorised or malicious logic change to the SIS defeats or degrades a safety instrumented function.", "source": "Insider or attacker with engineering access", "entryPoint": "The shared engineering workstation in Z4, through the keyed engineering connection", "consequence": "A safety instrumented function fails on demand: acid release or reactor overpressure with potential for serious injury.", "assetIds": ["AS4"], "vulnerabilityIds": ["V3"], "countermeasureIds": ["M4", "M8"], "affectedFR": ["IAC", "SI"], "likelihood": "low", "impact": "severe", "impactByCategory": { "safety": "severe", "environmental": "serious", "regulatory": "serious" }, "likelihoodRationale": "Needs engineering access and SIS knowledge; no remote path reaches the SIS.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "slt", "confirmed": true, "reason": "The consequence stays severe whatever is added, so no countermeasure brings this threat within tolerable risk. The zone is held at SL3 on every foundational requirement, and the 62443-3-3 programme builds that capability." } }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
      "justification": "The SIS floor applies: a zone containing safety instrumented functions takes SL3 across every foundational requirement regardless of the per-threat arithmetic, because the SIS is the last line of defence and severe-consequence/low-likelihood events dominate. T4 is treated through this SL-T programme, with the hardwired keyswitch (M4) in place and a dedicated SIS engineering workstation (M8) planned. This vector is deliberately not averaged down: any relaxation requires the asset owner to re-open the sign-off."
    },
    {
      "id": "Z3",
      "name": "Plant DMZ & historian",
      "description": "The brokered exchange layer between OT and corporate: process historian, patch/AV staging, NTP, and the vendor jump host.",
      "fn": "Data brokerage and controlled external access; no control function.",
      "fromHLA": "A3",
      "detailed": { "required": true, "reason": "" },
      "assets": [
        { "id": "AS6", "name": "Process historian (primary)", "type": "historian" },
        { "id": "AS7", "name": "Vendor jump host", "type": "server" },
        { "id": "AS8", "name": "DMZ firewall pair", "type": "network" }
      ],
      "flags": { "sis-present": false, "remote-access": true, "internet-adjacent": true, "wireless": false, "removable-media": false, "many-conduits": true },
      "accessPoints": [
        "Corporate reporting clients (C3)",
        "Historian replication from Z1 (C1)",
        "Vendor VPN termination (C2)"
      ],
      "accountableOrg": "Acme Petrochemicals, OT network team",
      "physicalBoundary": "Server room, OT racks 4 and 5.",
      "physicalAccessPoints": [
        "Server room door, badge controlled and shared with IT"
      ],
      "dataFlows": [
        "Process values in from the BPCS (C1)",
        "Read-only reports out to corporate clients (C3)",
        "Vendor VPN sessions in, onward through the jump host (C2)"
      ],
      "assumptions": [
        "The corporate network beyond the DMZ firewall is untrusted"
      ],
      "separation": {
        "external": { "answer": "met", "reason": "The DMZ is the zone built to meet external networks: it holds no controllers, and the historian it holds is a replica." }
      },
      "externalDependencies": [
        "Corporate AD federation for jump-host MFA",
        "Vendor VPN concentrator availability"
      ],
      "securityPolicies": [
        "All OT-corporate exchange transits the DMZ; no direct paths",
        "DMZ hosts patched monthly (IT window)"
      ],
      "vulnerabilities": [
        { "id": "V4", "description": "Historian web interface reachable from the whole corporate network, not just the reporting subnet", "reference": "DMZ firewall rule review, O2" }
      ],
      "countermeasures": [
        { "id": "M5", "description": "Restrict historian web access to the reporting subnet and put it behind the corporate SSO proxy", "addressesFR": ["IAC", "RDF"], "reference": "Firewall change FW-2026-041", "existing": false, "owner": "M. Kowalski", "priority": "high", "dueDate": "2026-09-30", "status": "in-progress", "srRefs": ["SR 5.2", "SR 1.1"] }
      ],
      "threats": [
        { "id": "T5", "statement": "A compromised corporate client exploits the historian and uses it as a pivot toward the BPCS replication path.", "source": "Attacker on corporate network", "entryPoint": "Historian web interface, from the corporate network (C3)", "consequence": "A foothold in the DMZ one step from the BPCS replication path (C1).", "assetIds": ["AS6"], "vulnerabilityIds": ["V4"], "countermeasureIds": ["M5"], "affectedFR": ["RDF", "SI"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "The interface is reachable from every corporate client, and the corporate network is assumed compromised.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "low", "residualImpact": "serious", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T6", "statement": "Process data is exfiltrated from the historian (recipe and throughput confidentiality).", "source": "Attacker on corporate network", "entryPoint": "Historian web interface, from the corporate network (C3)", "consequence": "Loss of commercially sensitive throughput and recipe data.", "assetIds": ["AS6"], "vulnerabilityIds": ["V4"], "countermeasureIds": [], "affectedFR": ["DC"], "likelihood": "low", "impact": "serious", "impactByCategory": { "financial": "serious", "regulatory": "minor" }, "likelihoodRationale": "The data has limited value outside Acme.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": null, "confirmed": false, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 2, "UC": 2, "SI": 2, "DC": 2, "RDF": 2, "TRE": 2, "RA": 1 },
      "justification": "The zone's worst unmitigated risk is High (T5 pivot toward the BPCS) with internet adjacency and many-conduit exposure traced on RDF/SI, but the DMZ exists precisely to absorb that exposure, and the planned historian access restriction (M5) addresses the driving vulnerability. SL2 across the access, integrity and data-flow FRs reflects the brokerage role; RA stays at SL1 because loss of the DMZ does not remove operator view or control (a security function that must be kept: the unit runs through a DMZ outage). The exfiltration threat T6 sits within tolerable risk and needs no treatment decision."
    },
    {
      "id": "Z4",
      "name": "Engineering workstations",
      "description": "Engineering workstations and configuration management for DCS, PLC and SIS tooling.",
      "fn": "Configuration, programming and maintenance of all Unit 300 control and safety systems.",
      "fromHLA": "A4",
      "detailed": { "required": true, "reason": "" },
      "assets": [
        { "id": "AS9", "name": "Engineering workstations x3", "type": "engineering-workstation" },
        { "id": "AS10", "name": "Config management server (backups, versioning)", "type": "server" },
        { "id": "AS11", "name": "Vendor laptops (turnarounds)", "type": "engineering-workstation", "link": "temporary" }
      ],
      "flags": { "sis-present": false, "remote-access": false, "internet-adjacent": false, "wireless": false, "removable-media": true, "many-conduits": false },
      "accessPoints": [
        "Removable media (controlled USB process)",
        "Engineering VLAN to Z1 controllers"
      ],
      "accountableOrg": "Acme Petrochemicals, control systems engineering",
      "physicalBoundary": "Control building engineering office.",
      "physicalAccessPoints": [
        "Engineering office door, badge controlled",
        "USB media kiosk in the engineering office"
      ],
      "dataFlows": [
        "Configuration downloads to the BPCS controllers over the engineering VLAN",
        "Keyed engineering connection to the SIS for authorised changes"
      ],
      "assumptions": [
        "Vendor laptops are only connected under a permit during turnarounds"
      ],
      "separation": {
        "temporary": { "answer": "not-separated", "reason": "Vendor laptops join the engineering VLAN during turnarounds after the media kiosk check. A separate maintenance zone is planned for the Q2-2027 turnaround." }
      },
      "externalDependencies": [
        "Vendor licence dongles and offline update bundles"
      ],
      "securityPolicies": [
        "USB media scanned at the kiosk before OT use",
        "Engineering accounts are individual; admin by exception"
      ],
      "vulnerabilities": [
        { "id": "V5", "description": "Legacy configuration tool for the depropaniser PLCs requires a shared local account and runs unsupported", "reference": "Interview I2, lead control systems engineer" },
        { "id": "V6", "description": "Vendor laptops are built and patched by the vendor, not by Acme, and arrive with the vendor's own tooling", "reference": "Interview I2, lead control systems engineer" }
      ],
      "countermeasures": [
        { "id": "M6", "description": "Media kiosk scanning plus workstation allow-listing for engineering tools", "addressesFR": ["SI", "RDF"], "reference": "HB-EWS-02", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 3.2"] },
        { "id": "M9", "description": "A separate maintenance zone for vendor laptops, with a conduit to the engineering VLAN opened only under a permit", "addressesFR": ["SI", "RDF"], "reference": "Turnaround scope TA-2027-Q2", "existing": false, "owner": "J. Whitmore", "priority": "medium", "dueDate": "2027-06-30", "status": "agreed", "srRefs": ["SR 5.1", "SR 5.2"] }
      ],
      "threats": [
        { "id": "T7", "statement": "Malware carried on removable media or a vendor laptop executes on an engineering workstation and spreads to controllers.", "source": "Commodity malware via media/laptops", "entryPoint": "USB media kiosk, and vendor laptops joining the engineering VLAN", "consequence": "Controller logic corrupted across the unit, forcing a shutdown and a controlled restore.", "assetIds": ["AS9", "AS11"], "vulnerabilityIds": ["V6"], "countermeasureIds": ["M6", "M9"], "affectedFR": ["SI", "RDF"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Removable media and vendor laptops are in routine use at every turnaround.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T8", "statement": "The legacy depropaniser configuration tool's shared account is misused, making an unauthorised controller change unattributable.", "source": "Insider misuse / contractor churn", "entryPoint": "The legacy configuration tool on an engineering workstation", "consequence": "An unauthorised change to the depropaniser PLCs that cannot be traced to a person.", "assetIds": ["AS9"], "vulnerabilityIds": ["V5"], "countermeasureIds": [], "affectedFR": ["UC"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Contractor churn at turnarounds, and an account several people know.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "The tool is retired at the Q2-2027 turnaround with the PLC upgrade. Until then the workstation is isolated on the engineering VLAN, and the account password is held by the shift supervisor and issued per use with a written record. Risk accepted at High for this bounded period.", "acceptanceDetail": { "by": "R. Calder", "role": "Asset Owner - Unit 300", "date": "2026-07-04", "reviewDate": "2027-06-30" }, "treatment": { "decision": "accept", "confirmed": true, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 2, "UC": 2, "SI": 3, "DC": 1, "RDF": 2, "TRE": 1, "RA": 1 },
      "justification": "SI is set to SL3: the engineering zone is the integrity chokepoint for every controller and the removable-media exposure is traced against a High malware risk (T7), mitigated in day-to-day terms by the existing kiosk-plus-allow-listing countermeasures (M6). The shared-account threat (T8) exceeds tolerable risk and carries a recorded, time-bounded risk acceptance by the asset owner rather than an SL uplift: the compensating procedure and the Q2-2027 retirement are the treatment. Remaining FRs sit at SL1-2 consistent with no external paths into this zone."
    }
  ],
  "conduits": [
    {
      "id": "C1",
      "fromZone": "Z1",
      "toZone": "Z3",
      "name": "Historian replication",
      "channels": ["OPC UA"],
      "notes": "One-way logical replication from the BPCS to the DMZ historian via the OPC UA broker; no writes toward Z1.",
      "direction": "from-to",
      "boundaryDevices": ["OPC UA broker", "DMZ firewall pair"],
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 2, "UC": null, "SI": 2, "DC": 1, "RDF": 2, "TRE": null, "RA": null },
      "justification": "Carries the Z3 pivot risk (T5) as its data-flow path: SL2 on IAC/SI/RDF matches the zone targets either side; the broker enforces direction so no higher target is warranted.",
      "detailed": { "required": false, "reason": "One-way replication through the OPC UA broker. Its exposure is the Z3 pivot path, assessed there as T5, so the SL-T is set from the zones it joins." }
    },
    {
      "id": "C2",
      "fromZone": "Z3",
      "toZone": "Z1",
      "name": "Vendor remote access",
      "channels": ["VPN", "RDP through the jump host"],
      "notes": "Vendor VPN terminates in the DMZ. Sessions are always started from the recorded jump host in Z3, activated per ticket, and carry traffic both ways while open; nothing in Z1 can start a session outward.",
      "direction": "both",
      "boundaryDevices": ["Vendor VPN concentrator", "Vendor jump host", "DMZ firewall pair"],
      "external": true,
      "externalParty": "DCS vendor support engineers",
      "threats": [
        { "id": "T9", "statement": "A vendor credential or session is hijacked and replayed to reach the DCS outside an authorised window.", "source": "External attacker via vendor access chain", "entryPoint": "Vendor VPN concentrator, then the jump host", "consequence": "An unattributed session on the DCS servers able to change control settings.", "assetIds": ["AS7", "AS1"], "vulnerabilityIds": ["V7"], "countermeasureIds": ["M7"], "affectedFR": ["IAC", "RDF"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Vendor credentials are a common target, and Acme cannot see when the vendor's staff change.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } }
      ],
      "vulnerabilities": [
        { "id": "V7", "description": "Vendor support accounts are issued by the vendor; Acme learns of a leaver only when the vendor reports one", "reference": "Vendor remote access session demonstration, O3" }
      ],
      "countermeasures": [
        { "id": "M7", "description": "MFA on VPN and jump host, per-ticket session activation, session recording, auto-disconnect at window end", "addressesFR": ["IAC", "UC", "RDF"], "reference": "OPS-PROC-118", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 1.1", "SR 1.13", "SR 2.6"] }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": null, "DC": null, "RDF": 3, "TRE": 2, "RA": null },
      "justification": "This conduit is the highest-exposure path into the BPCS: the hijack threat (T9) starts High and the existing per-session countermeasures (M7) bring it within tolerable risk today, but the SL-T is held at SL3 on IAC/RDF to match the Z1 targets it lands in, so the conduit is not the weak link. TRE at SL2 preserves the session-recording evidence chain.",
      "detailed": { "required": true, "reason": "" }
    },
    {
      "id": "C3",
      "fromZone": "Z3",
      "toZone": "EXT",
      "name": "Corporate reporting",
      "channels": ["HTTPS"],
      "notes": "Corporate clients request read-only reports over HTTPS; process data flows one way, Z3 to corporate. The corporate side is out of scope (untrusted by assumption).",
      "direction": "from-to",
      "boundaryDevices": ["DMZ firewall pair"],
      "externalParty": "Acme corporate reporting clients",
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 2, "UC": null, "SI": null, "DC": 2, "RDF": 2, "TRE": null, "RA": null },
      "justification": "Boundary conduit to the untrusted corporate network: SL2 on IAC/DC/RDF reflects the read-only brokerage and the confidentiality of throughput data; no control traffic exists on this path.",
      "detailed": { "required": false, "reason": "Read-only reporting to the out-of-scope corporate network. The exposure is assessed at the Z3 boundary (T5, T6)." }
    }
  ],
  "counters": { "zone": 4, "conduit": 3, "threat": 9, "vuln": 7, "cm": 9, "hla": 6, "interview": 4, "document": 4, "observation": 3, "asset": 11 }
};
