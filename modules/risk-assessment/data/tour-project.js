/*
 * Demo project for the risk-tool tour (tour.html): a COMPLETE, realistic
 * IEC 62443-3-2 risk assessment for Acme Petrochemicals' Unit 300 alkylation
 * control system - the same client as the 62443-3-3 demo in the Assessments
 * tour, so the stage-6 risk-context export chains into that tool's "Import
 * risk context" story.
 *
 * Every tier is finished: a full assessment (assessmentType), SUC definition,
 * the high-level risk ranking (with the high scorers assigned to zones),
 * zones & conduits with exposure flags, the SUC above tolerable risk so
 * every zone and conduit is assessed, each at its depth (the zones and C2 in
 * detail, C1 grouped with Z3, C4 with Z4 and C5 with Z2, whose threats they
 * share, and C3 a proportionate review with the threats considered noted), a detailed threat register as a workshop leaves it (each threat
 * linked to its assets, vulnerabilities and countermeasures, with its entry
 * point, consequence and likelihood rationale; the unmitigated rating, the
 * current one where existing countermeasures change it, and the planned one
 * after the additional countermeasures), vulnerabilities with where each is
 * known from, countermeasures with SR references and, for the additional
 * ones, an owner, priority, due date and status, every above-tolerable threat
 * given a confirmed treatment decision (reduce with countermeasures, one
 * treated through the SL-T programme, one accepted with who accepted it, when
 * and its review date, and one transferred: T2's lost production, carried by
 * the group's business interruption insurance, reviewed at each renewal, with
 * the insurer, who agreed it and its review date), per-FR SL-T vectors with written justifications, the basis of assessment,
 * the zone and conduit characteristics with the separation rows the tool
 * raises answered (one not separated, with its reason), the tolerable risk
 * confirmed with the asset owner, the organisational policies, and two
 * approvers recorded against the current fingerprint. It keeps the house
 * risk criteria; T1, T4 and T6 give their impact per consequence category
 * (each impact the worst of them), and A1 and A2 the source of their
 * consequence. Worked consequence first too: three consequences (K1 an acid
 * release, K2 an unplanned shutdown, K3 loss of view), each with the threats
 * that lead to it as its paths and the zones and conduits they pass through
 * (T1 via Z3 and C2, T2 via Z4 and C4, T4 via Z4 and C5, T9 via Z3).
 * The 3-2 fixes (step 2): the threat environment names its sources of
 * threat intelligence and emerging threats, the conduits carry a zone's
 * characteristics, and every zone and conduit lists its applicable security
 * requirements. Step 3: every asset carries the owner's classification and a
 * business value, so the report prints an asset register, and T2 is the
 * transfer above. Step 4: the cover no longer rests on M3, and the basis of
 * assessment records the interview with the group insurance manager (I5).
 * Step 5: the engineering VLAN (C4) and the keyed SIS connection (C5) are
 * conduits; every zone and conduit has a target on every foundational
 * requirement and its characteristics in full (assets with a criticality);
 * T4's remaining risk is accepted by the asset owner; the LIS link and CCTV
 * are ranked as outside the SUC; the SUC lists its access points; each
 * organisational policy says what implements it; the basis of assessment
 * records the risk assessment sessions; and the second approver is the
 * operations manager accountable for the unit.
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
    "description": "The basic process control system, safety instrumented system and supporting OT infrastructure for the Unit 300 alkylation unit at the Teesport refinery. The system comprises redundant SCADA/DCS servers and operator HMIs in the central control room, unit PLCs and remote I/O in the field auxiliary rooms, the SIS that performs the unit's safety instrumented functions, the engineering workstations, and the plant DMZ, which carries the historian and the vendor access paths.",
    "scopeStatement": "The scope covers all Unit 300 control, safety and engineering systems from the field controllers up to and including the plant DMZ, and the conduits that cross the boundary for historian replication, vendor remote access and corporate reporting. The corporate IT network beyond the DMZ firewall, the other process units and the terminal loading systems are out of scope. The loading systems are assessed separately.",
    "assumptions": [
      "Physical access to the control room and field auxiliary rooms is badge-controlled and logged",
      "The corporate network is treated as untrusted and assumed compromised for this assessment",
      "Unit 300 runs continuously, and a control system outage forces a manual shutdown of the unit within 30 minutes",
      "Vendor support for the DCS is contractually required and uses the remote access path assessed here"
    ],
    "accessPoints": [
      { "description": "Vendor remote access over the site internet link, to the VPN concentrator in the DMZ", "enters": "C2" },
      { "description": "Corporate reporting clients on the corporate network, over HTTPS", "enters": "C3" },
      { "description": "Removable media and vendor laptops brought into the engineering office", "enters": "Z4" }
    ],
    "policies": [
      "Acme Group OT cyber security standard GS-104 (zones, remote access, removable media)",
      "Teesport permit-to-work and management of change procedures",
      "Acme Group incident response plan, OT annex"
    ],
    "policyImplementation": {
      "Acme Group OT cyber security standard GS-104 (zones, remote access, removable media)": "The zone and conduit SL-T, per-session vendor access with MFA and recording, and the removable media kiosk with workstation allow-listing",
      "Teesport permit-to-work and management of change procedures": "MoC approval for every engineering change, permits for vendor laptops at turnarounds, and the keyed bypass record for SIS changes",
      "Acme Group incident response plan, OT annex": "The OT annex playbooks, with the jump host's session recordings and the DMZ firewall logs as evidence"
    }
  },
  "srs": {
    "adversaryClass": 3,
    "essentialFunctions": "Continuous closed-loop control of the alkylation reaction (temperature, acid ratio, pressure), operator view and command from the central control room, and the SIS safety instrumented functions (emergency depressurisation, acid feed isolation).",
    "worstCase": "An acid release or reactor overpressure from lost or manipulated control or safety functions, with potential for multiple serious injuries on site, off-site public exposure at the fence line, a COMAH-reportable event and a unit outage lasting weeks.",
    "tolerableRisk": "medium",
    "tolerableConfirmed": "medium",
    "highLevelAssets": [
      { "id": "A1", "name": "Unit 300 BPCS (DCS servers, HMIs, unit PLCs)", "functionLocation": "Closed-loop control and operator interface - control room / field aux rooms", "consequence": "serious", "consequenceSource": "HAZOP revalidation, 2025", "likelihood": "medium", "note": "The primary control layer. Its loss forces a manual shutdown, and its manipulation is the path to an acid release. Assigned to Z1 and assessed in detail." },
      { "id": "A2", "name": "Safety Instrumented System (SIS)", "functionLocation": "Emergency depressurisation and acid isolation - field aux room 2", "consequence": "severe", "consequenceSource": "LOPA and SIL determination", "likelihood": "low", "note": "The last layer of protection, so any compromise is intolerable whatever its likelihood. Assigned to Z2 and assessed in detail." },
      { "id": "A3", "name": "Plant DMZ & process historian", "functionLocation": "Data brokerage between OT and corporate - server room", "consequence": "serious", "likelihood": "medium", "note": "Every external path passes through the DMZ, and a foothold here gives a route into the BPCS. Assigned to Z3 and assessed in detail." },
      { "id": "A4", "name": "Engineering workstations & config management", "functionLocation": "DCS/PLC/SIS configuration - control building office", "consequence": "serious", "likelihood": "medium", "note": "These workstations can change every controller, and removable media and legacy tools are in routine use. Assigned to Z4 and assessed in detail." },
      { "id": "A5", "name": "Laboratory information system link", "functionLocation": "Sample results feed to the historian - lab", "consequence": "serious", "likelihood": "low", "note": "A one-way feed with no control path, ranked medium. The feed ends at the historian, which Z3 covers.", "inSuc": false },
      { "id": "A6", "name": "CCTV & physical security systems", "functionLocation": "Site perimeter and unit cameras - site-wide", "consequence": "negligible", "likelihood": "high", "note": "Commodity IP equipment that is often probed but has no process consequence. It is ranked low.", "inSuc": false }
    ],
    "threatSources": [
      "NCSC threat reports and advisories",
      "DCS and SIS vendor security bulletins",
      "Downstream oil and gas sector information-sharing group",
      "Acme group security operations centre monthly threat brief"
    ],
    "knownThreats": [
      "Capable criminal and ransomware groups reaching OT through corporate IT or vendor access",
      "State-capable adversaries with an interest in the refining sector (adversary class 3 assumed for this SUC)",
      "Insider misuse of engineering access, with a high turnover of contractors at turnarounds",
      "Commodity malware brought in on removable media and engineering laptops"
    ],
    "emergingThreats": [
      "Ransomware groups targeting remote access appliances used by OT vendors",
      "Attacks on engineering software supply chains through signed update packages"
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
      { "id": "I4", "name": "M. Kowalski", "role": "OT/IT Network Engineer", "date": "2026-07-02", "notes": "DMZ design, firewall rules, historian replication" },
      { "id": "I5", "name": "H. Okafor", "role": "Group Insurance Manager", "date": "2026-07-03", "notes": "Business interruption cover, cyber extension, transfer of lost production" }
    ],
    "sessions": [
      { "id": "S1", "date": "2026-07-01", "topic": "Scope, tolerable risk and the high-level ranking", "participants": "R. Calder (Asset Owner - Unit 300); J. Whitmore (Lead Control Systems Engineer); S. Maesschalck (Consultant, SolutionsPT)" },
      { "id": "S2", "date": "2026-07-02", "topic": "Zones and conduits, threat scenarios and their ratings", "participants": "J. Whitmore (Lead Control Systems Engineer); S. Adeyemi (Process Safety Engineer); M. Kowalski (OT/IT Network Engineer); S. Maesschalck (Consultant, SolutionsPT)" },
      { "id": "S3", "date": "2026-07-03", "topic": "Treatment decisions, the SL-T and the remaining risk on the SIS", "participants": "R. Calder (Asset Owner - Unit 300); D. Hargreaves (Operations Manager, Teesport Refinery); S. Adeyemi (Process Safety Engineer); S. Maesschalck (Consultant, SolutionsPT)" }
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
      { "id": "O3", "description": "Vendor remote access session demonstration", "location": "Control building", "date": "2026-07-02", "notes": "Session activation, attribution and recording observed from start to finish" }
    ]
  },
  "approval": {
    "name": "R. Calder",
    "role": "Asset Owner - Unit 300",
    "date": "2026-07-04",
    "statement": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the two recorded risk acceptances (legacy configuration tooling, and the remaining risk on the SIS until its dedicated engineering workstation is in place), the one transferred risk (lost production, through business interruption insurance), and the per-FR SL-T vectors as the target for the security programme.",
    "approved": true
  },
  "approvals": [
    { "scope": "I confirm the tolerable risk of Medium used in this assessment reflects Acme's corporate risk criteria for Unit 300, and I accept the assessment outcome: the recorded treatment decisions, the residual risk positions, the two recorded risk acceptances (legacy configuration tooling, and the remaining risk on the SIS until its dedicated engineering workstation is in place), the one transferred risk (lost production, through business interruption insurance), and the per-FR SL-T vectors as the target for the security programme.", "name": "R. Calder", "role": "Asset Owner - Unit 300", "organisation": "Acme Petrochemicals Ltd", "date": "2026-07-04", "revision": "1.0", "approved": true, "fingerprint": "a3-9c820478-e0918985-e6b02e7f-0de5a838-e0ca2180-c616e426-72e6be75-09ee5f64" },
    { "scope": "The SL-T of the Safety Instrumented System zone (Z2), and the remaining risk on the SIS accepted until its dedicated engineering workstation is in place.", "name": "D. Hargreaves", "role": "Operations Manager, Teesport Refinery", "organisation": "Acme Petrochemicals Ltd", "date": "2026-07-04", "revision": "1.0", "approved": true, "fingerprint": "a3-9c820478-e0918985-e6b02e7f-0de5a838-e0ca2180-c616e426-72e6be75-09ee5f64" }
  ],
  "consequences": [
    { "id": "K1", "title": "Loss of containment of HF acid from an unsafe process state", "description": "The reactor or acid settler is driven outside its safe operating envelope while the SIS is defeated or fails on demand, and acid is released.", "impact": "severe", "impactByCategory": { "safety": "severe", "environmental": "severe", "operational": "severe", "regulatory": "serious" }, "source": "HAZOP revalidation, 2025; LOPA and SIL determination", "hlaIds": ["A1", "A2"], "notes": "The process safety engineer confirmed the scenario from the COMAH safety report." },
    { "id": "K2", "title": "Unplanned shutdown of the unit and lost production", "description": "Corrupted control logic or displays force a manual shutdown and a controlled restore of the unit.", "impact": "serious", "impactByCategory": { "operational": "serious", "financial": "serious" }, "source": "Interview with the asset owner", "hlaIds": ["A1", "A4"], "notes": "" },
    { "id": "K3", "title": "Loss of view of the unit at the control room", "description": "Operators lose the HMI view of the unit and shut it down by hand if view is not restored within 30 minutes.", "impact": "serious", "impactByCategory": { "operational": "serious" }, "source": "Interview with the lead control systems engineer", "hlaIds": ["A1"], "notes": "" }
  ],
  "zones": [
    {
      "id": "Z1",
      "name": "Unit 300 BPCS",
      "description": "DCS servers, operator HMIs and unit PLCs performing closed-loop control of the alkylation unit.",
      "fn": "Continuous process control and operator interface for Unit 300.",
      "fromHLA": "A1",
      "assessment": { "depth": "detailed" },
      "assets": [
        { "id": "AS1", "name": "DCS server pair (redundant)", "type": "server", "classification": "Process critical", "criticality": "high", "businessValue": "high" },
        { "id": "AS2", "name": "Operator HMIs x4", "type": "hmi", "classification": "Process critical", "criticality": "high", "businessValue": "high" },
        { "id": "AS3", "name": "Unit PLCs x6 (reactor, acid feed, depropaniser)", "type": "plc", "classification": "Process critical", "criticality": "high", "businessValue": "high" }
      ],
      "flags": { "sis-present": false, "remote-access": true, "internet-adjacent": false, "wireless": false, "removable-media": false, "many-conduits": false },
      "accessPoints": [
        "Vendor VPN via jump host (C2)",
        "Historian replication to DMZ (C1)",
        "Engineering VLAN from Z4 (C4)"
      ],
      "accountableOrg": "Acme Petrochemicals, Unit 300 operations",
      "physicalBoundary": "Central control room (DCS servers and HMIs) and field auxiliary rooms 1 and 3 (unit PLCs).",
      "physicalAccessPoints": [
        "Control room door, badge controlled and logged",
        "Field auxiliary rooms 1 and 3, keyed and on the operator round"
      ],
      "dataFlows": [
        "Process values to the historian through the OPC UA broker (C1)",
        "Vendor diagnostic sessions through the jump host (C2)",
        "Configuration downloads from the engineering workstations (C4)"
      ],
      "assumptions": [
        "The control network carries no traffic from outside the zone other than C1 and C2"
      ],
      "separation": {
        "external": { "answer": "met", "reason": "Vendor sessions end at the DMZ jump host, and nothing in Z1 connects to an external network directly." }
      },
      "externalDependencies": [
        "DCS vendor support contract (remote diagnostics)",
        "Time sync from DMZ NTP"
      ],
      "securityPolicies": [
        "No engineering changes without MoC approval",
        "Vendor sessions activated per ticket, time-bounded"
      ],
      "securityRequirements": [
        "IEC 62443-3-3 system requirements and requirement enhancements at its SL-T",
        "Acme OT security standard GS-104, section 5 (control networks)"
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
        { "id": "T1", "consequenceId": "K1", "via": ["Z3", "C2"], "statement": "An external attacker hijacks or rides the vendor remote access path to reach the DCS servers and issue control changes.", "source": "External attacker via vendor access", "entryPoint": "Vendor VPN and jump host (C2)", "consequence": "Unauthorised setpoint or logic changes on the reactor loops, with a credible path to an acid release.", "assetIds": ["AS1"], "vulnerabilityIds": ["V1"], "countermeasureIds": ["M1"], "affectedFR": ["IAC", "RDF"], "likelihood": "high", "impact": "serious", "impactByCategory": { "safety": "serious", "operational": "serious", "financial": "minor" }, "likelihoodRationale": "The remote access path is permanently in place, and the sector is actively targeted.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T2", "consequenceId": "K2", "via": ["Z4", "C4"], "statement": "Malware introduced through an engineering connection executes on a DCS server and corrupts control logic or displays.", "source": "Commodity malware via engineering path", "entryPoint": "Engineering VLAN from Z4, and the two OPC DA clients", "consequence": "Loss of view or corrupted control logic, forcing a manual shutdown of the unit.", "assetIds": ["AS1", "AS2"], "vulnerabilityIds": ["V1", "V2"], "countermeasureIds": ["M2", "M3"], "affectedFR": ["SI"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Across the sector, commodity malware reaches plant networks through engineering paths a few times a year. Allow-listing (M2) stops unknown programs from running, but it does not stop a corrupted logic download or the OPC DA path, so it does not lower the likelihood.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "low", "residualImpact": "serious", "acceptance": "Lost production from a cyber-caused shutdown of the unit is covered by the group's business interruption insurance, which has a cyber extension (policy GBI-2026-114). The cover is reviewed annually at the policy renewal.", "transferTo": "Acme group insurers, through the group business interruption policy", "acceptanceDetail": { "by": "H. Okafor", "role": "Group Insurance Manager", "date": "2026-07-03", "reviewDate": "2027-03-31" }, "treatment": { "decision": "accept", "transfer": true, "confirmed": true, "reason": "" } },
        { "id": "T3", "consequenceId": "K3", "statement": "A flooding or resource-exhaustion event on the control network degrades operator view of the unit.", "source": "Network fault or deliberate DoS", "entryPoint": "Any host on the control network", "consequence": "Operator view is degraded, and the unit is shut down by hand within 30 minutes if view is not restored.", "assetIds": ["AS2"], "vulnerabilityIds": [], "countermeasureIds": [], "affectedFR": ["RA"], "likelihood": "low", "impact": "serious", "likelihoodRationale": "No external path reaches the control network directly.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": null, "confirmed": false, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 1, "RDF": 3, "TRE": 2, "RA": 2 },
      "justification": "The worst unmitigated risks in this zone are High against a Medium tolerable risk (an attacker riding the vendor remote access path, and malware brought in over an engineering connection). The permanent remote access path also raises the likelihood of attacks on IAC, UC and RDF. IAC, SI and RDF are therefore set to SL3. UC stays at SL2 because procedures limit use control inside the control room and no High risk bears on it directly. DC is set to SL1, as process data has a low confidentiality consequence. TRE and RA at SL2 support forensic investigation and the resilience the unit needs, as an outage forces a manual shutdown within 30 minutes."
    },
    {
      "id": "Z2",
      "name": "Safety Instrumented System",
      "description": "The SIS logic solver and safety I/O performing emergency depressurisation and acid feed isolation.",
      "fn": "Safety instrumented functions for Unit 300 (SIL 2 per LOPA).",
      "fromHLA": "A2",
      "assessment": { "depth": "detailed" },
      "assets": [
        { "id": "AS4", "name": "SIS logic solver", "type": "safety-plc", "classification": "Safety critical (SIL 2)", "criticality": "high", "businessValue": "high" },
        { "id": "AS5", "name": "Safety I/O and final elements", "type": "other", "classification": "Safety critical (SIL 2)", "criticality": "high", "businessValue": "high" }
      ],
      "flags": { "sis-present": true, "remote-access": false, "internet-adjacent": false, "wireless": false, "removable-media": false, "many-conduits": false },
      "accessPoints": [
        "Keyed engineering connection from Z4 (C5), normally disconnected"
      ],
      "accountableOrg": "Acme Petrochemicals, process safety",
      "physicalBoundary": "Field auxiliary room 2, SIS cabinets.",
      "physicalAccessPoints": [
        "Field auxiliary room 2, keyed, keys held by the shift supervisor"
      ],
      "dataFlows": [
        "Authorised logic changes from the SIS engineering software in Z4 (C5)",
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
      "securityRequirements": [
        "IEC 62443-3-3 system requirements and requirement enhancements at its SL-T",
        "Acme process safety standard PS-07 (independence of safety functions)"
      ],
      "vulnerabilities": [
        { "id": "V3", "description": "SIS engineering software runs on a Z4 workstation that also carries DCS tooling (shared engineering asset)", "reference": "Interview I3, process safety engineer" }
      ],
      "countermeasures": [
        { "id": "M4", "description": "Hardwired keyswitch required for SIS program mode, with its position alarmed in the control room", "addressesFR": ["IAC", "UC", "SI"], "reference": "C&E U300-CE-014", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 2.1", "SR 3.4"] },
        { "id": "M8", "description": "Move the SIS engineering software to a dedicated workstation kept in field auxiliary room 2, off the shared engineering workstation", "addressesFR": ["IAC", "UC", "SI"], "reference": "MoC to be raised", "existing": false, "owner": "S. Adeyemi", "priority": "medium", "dueDate": "2027-06-30", "status": "proposed", "srRefs": ["SR 1.1", "SR 2.1", "SR 3.2"] }
      ],
      "threats": [
        { "id": "T4", "consequenceId": "K1", "via": ["Z4", "C5"], "statement": "An unauthorised or malicious logic change to the SIS defeats or degrades a safety instrumented function.", "source": "Insider or attacker with engineering access", "entryPoint": "The shared engineering workstation in Z4, through the keyed engineering connection", "consequence": "A safety instrumented function fails on demand, leading to an acid release or reactor overpressure and possible serious injury.", "assetIds": ["AS4"], "vulnerabilityIds": ["V3"], "countermeasureIds": ["M4", "M8"], "affectedFR": ["IAC", "SI"], "likelihood": "low", "impact": "severe", "impactByCategory": { "safety": "severe", "environmental": "severe", "operational": "severe", "regulatory": "serious" }, "likelihoodRationale": "The attack needs engineering access and knowledge of the SIS, and no remote path reaches the SIS.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "The consequence stays severe, so no countermeasure brings the risk within tolerable risk. Until the dedicated SIS engineering workstation is in place, process safety authorisation, the keyed bypass record and the program-mode keyswitch limit the remaining risk. It is accepted at High until the review.", "acceptanceDetail": { "by": "R. Calder", "role": "Asset Owner - Unit 300", "date": "2026-07-04", "reviewDate": "2027-06-30" }, "treatment": { "decision": "slt", "confirmed": true, "reason": "The consequence stays severe whatever is added, so no countermeasure brings this threat within tolerable risk. The zone is held at SL3 on every foundational requirement, and the 62443-3-3 programme builds that capability." } }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
      "justification": "A zone containing safety instrumented functions takes the SIS floor of SL3 on every foundational requirement, whatever the individual threat ratings would suggest. The SIS is the last layer of protection, and its risk is dominated by events of severe consequence and low likelihood. An unauthorised change to the safety logic is treated through these targets, with the hardwired keyswitch for program mode in place and a dedicated SIS engineering workstation planned. The vector is not averaged down, and any relaxation requires the asset owner to reopen the sign-off."
    },
    {
      "id": "Z3",
      "name": "Plant DMZ & historian",
      "description": "The brokered exchange layer between OT and the corporate network. It holds the process historian, patch and antivirus staging, NTP and the vendor jump host.",
      "fn": "Data brokerage and controlled external access, with no control function.",
      "fromHLA": "A3",
      "assessment": { "depth": "detailed" },
      "assets": [
        { "id": "AS6", "name": "Process historian (primary)", "type": "historian", "classification": "Business support", "criticality": "medium", "businessValue": "medium" },
        { "id": "AS7", "name": "Vendor jump host", "type": "server", "classification": "Process support", "criticality": "medium", "businessValue": "medium" },
        { "id": "AS8", "name": "DMZ firewall pair", "type": "network", "classification": "Process support", "criticality": "high", "businessValue": "high" }
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
        "All exchange between OT and corporate passes through the DMZ, with no direct paths",
        "DMZ hosts patched monthly (IT window)"
      ],
      "securityRequirements": [
        "IEC 62443-3-3 system requirements and requirement enhancements at its SL-T",
        "Acme OT security standard GS-104, section 7 (OT DMZ)"
      ],
      "vulnerabilities": [
        { "id": "V4", "description": "Historian web interface reachable from the whole corporate network, where only the reporting subnet needs it", "reference": "DMZ firewall rule review, O2" }
      ],
      "countermeasures": [
        { "id": "M5", "description": "Restrict historian web access to the reporting subnet and put it behind the corporate SSO proxy", "addressesFR": ["IAC", "RDF"], "reference": "Firewall change FW-2026-041", "existing": false, "owner": "M. Kowalski", "priority": "high", "dueDate": "2026-09-30", "status": "in-progress", "srRefs": ["SR 5.2", "SR 1.1"] }
      ],
      "threats": [
        { "id": "T5", "statement": "A compromised corporate client exploits the historian and uses it as a pivot toward the BPCS replication path.", "source": "Attacker on corporate network", "entryPoint": "Historian web interface, from the corporate network (C3)", "consequence": "A foothold in the DMZ one step from the BPCS replication path (C1).", "assetIds": ["AS6"], "vulnerabilityIds": ["V4"], "countermeasureIds": ["M5"], "affectedFR": ["RDF", "SI"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "The interface is reachable from every corporate client, and the corporate network is assumed compromised.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "low", "residualImpact": "serious", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T6", "statement": "Process data is exfiltrated from the historian (recipe and throughput confidentiality).", "source": "Attacker on corporate network", "entryPoint": "Historian web interface, from the corporate network (C3)", "consequence": "Loss of commercially sensitive throughput and recipe data.", "assetIds": ["AS6"], "vulnerabilityIds": ["V4"], "countermeasureIds": [], "affectedFR": ["DC"], "likelihood": "low", "impact": "serious", "impactByCategory": { "financial": "serious", "regulatory": "minor" }, "likelihoodRationale": "The data has limited value outside Acme.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": null, "confirmed": false, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 2, "UC": 2, "SI": 2, "DC": 2, "RDF": 2, "TRE": 2, "RA": 1 },
      "justification": "The zone's worst unmitigated risk is High (a compromised corporate client using the historian as a pivot toward the BPCS), and internet adjacency and exposure through many conduits bear on RDF and SI. The DMZ is there to absorb that exposure, and the planned restriction of historian web access to the reporting subnet addresses the vulnerability behind the risk. SL2 on the access, integrity and data-flow FRs reflects the zone's brokerage role. RA stays at SL1 because losing the DMZ does not remove operator view or control, and the unit runs through a DMZ outage. Operator view and manual command are among the security functions that must be kept. Exfiltration of process data from the historian is within tolerable risk and needs no treatment decision. IAC stays at SL2 although the vendor remote access scenarios pass through this zone on their way to the BPCS, because C2 and Z1, which they reach, already hold SL3 on IAC."
    },
    {
      "id": "Z4",
      "name": "Engineering workstations",
      "description": "Engineering workstations and configuration management for DCS, PLC and SIS tooling.",
      "fn": "Configuration, programming and maintenance of all Unit 300 control and safety systems.",
      "fromHLA": "A4",
      "assessment": { "depth": "detailed" },
      "assets": [
        { "id": "AS9", "name": "Engineering workstations x3", "type": "engineering-workstation", "classification": "Process support", "criticality": "medium", "businessValue": "medium" },
        { "id": "AS10", "name": "Config management server (backups, versioning)", "type": "server", "classification": "Process support", "criticality": "medium", "businessValue": "high" },
        { "id": "AS11", "name": "Vendor laptops (turnarounds)", "type": "engineering-workstation", "link": "temporary", "classification": "Third-party equipment", "criticality": "low", "businessValue": "low" }
      ],
      "flags": { "sis-present": false, "remote-access": false, "internet-adjacent": false, "wireless": false, "removable-media": true, "many-conduits": false },
      "accessPoints": [
        "Removable media (controlled USB process)",
        "Engineering VLAN to the BPCS (C4)",
        "Keyed engineering connection to the SIS (C5)"
      ],
      "accountableOrg": "Acme Petrochemicals, control systems engineering",
      "physicalBoundary": "Control building engineering office.",
      "physicalAccessPoints": [
        "Engineering office door, badge controlled",
        "USB media kiosk in the engineering office"
      ],
      "dataFlows": [
        "Files from removable media, scanned at the kiosk, to the engineering workstations",
        "Configuration downloads to the BPCS controllers over the engineering VLAN (C4)",
        "Authorised SIS logic changes over the keyed engineering connection (C5)"
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
      "securityRequirements": [
        "IEC 62443-3-3 system requirements and requirement enhancements at its SL-T",
        "Acme OT security standard GS-104, section 6 (engineering access and removable media)"
      ],
      "vulnerabilities": [
        { "id": "V5", "description": "Legacy configuration tool for the depropaniser PLCs requires a shared local account and runs unsupported", "reference": "Interview I2, lead control systems engineer" },
        { "id": "V6", "description": "Vendor laptops are built and patched by the vendor, outside Acme's control, and arrive with the vendor's own tools", "reference": "Interview I2, lead control systems engineer" }
      ],
      "countermeasures": [
        { "id": "M6", "description": "Media kiosk scanning plus workstation allow-listing for engineering tools", "addressesFR": ["SI", "RDF"], "reference": "HB-EWS-02", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 3.2"] },
        { "id": "M9", "description": "A separate maintenance zone for vendor laptops, with a conduit to the engineering VLAN opened only under a permit", "addressesFR": ["SI", "RDF"], "reference": "Turnaround scope TA-2027-Q2", "existing": false, "owner": "J. Whitmore", "priority": "medium", "dueDate": "2027-06-30", "status": "agreed", "srRefs": ["SR 5.1", "SR 5.2"] }
      ],
      "threats": [
        { "id": "T7", "consequenceId": "K2", "statement": "Malware carried on removable media or a vendor laptop executes on an engineering workstation and spreads to controllers.", "source": "Commodity malware via media/laptops", "entryPoint": "USB media kiosk, and vendor laptops joining the engineering VLAN", "consequence": "Controller logic corrupted across the unit, forcing a shutdown and a controlled restore.", "assetIds": ["AS9", "AS11"], "vulnerabilityIds": ["V6"], "countermeasureIds": ["M6", "M9"], "affectedFR": ["SI", "RDF"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Removable media and vendor laptops are in routine use at every turnaround.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } },
        { "id": "T8", "statement": "The legacy depropaniser configuration tool's shared account is misused, making an unauthorised controller change unattributable.", "source": "Insider misuse / contractor churn", "entryPoint": "The legacy configuration tool on an engineering workstation", "consequence": "An unauthorised change to the depropaniser PLCs that cannot be traced to a person.", "assetIds": ["AS9"], "vulnerabilityIds": ["V5"], "countermeasureIds": [], "affectedFR": ["UC"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Contractors change often at turnarounds, and several people know the account.", "currentLikelihood": "", "currentImpact": "", "residualLikelihood": "", "residualImpact": "", "acceptance": "The tool is retired at the Q2-2027 turnaround with the PLC upgrade. Until then the workstation is isolated on the engineering VLAN, and the account password is held by the shift supervisor and issued per use with a written record. The risk is accepted at High for this limited period.", "acceptanceDetail": { "by": "R. Calder", "role": "Asset Owner - Unit 300", "date": "2026-07-04", "reviewDate": "2027-06-30" }, "treatment": { "decision": "accept", "confirmed": true, "reason": "" } }
      ],
      "slTargetByFR": { "IAC": 2, "UC": 2, "SI": 3, "DC": 1, "RDF": 2, "TRE": 1, "RA": 1 },
      "justification": "SI is set to SL3 because every controller change passes through the engineering zone, and malware carried on removable media or a vendor laptop is a High risk there. The existing media kiosk and workstation allow-listing reduce that risk in day-to-day operation. Misuse of the legacy configuration tool's shared account exceeds tolerable risk. The asset owner accepts it until its review at the end of June 2027, and the SL-T is not raised for it, because a compensating procedure covers the risk until the shared account is retired. IAC stays at SL2 although the engineering scenario against the SIS passes through this zone and suggests SL3, because the SIS zone already holds SL3 on IAC. The other FRs sit at SL1 or SL2, consistent with no external paths into this zone."
    }
  ],
  "conduits": [
    {
      "id": "C1",
      "fromZone": "Z1",
      "toZone": "Z3",
      "name": "Historian replication",
      "channels": ["OPC UA"],
      "notes": "One-way logical replication from the BPCS to the DMZ historian through the OPC UA broker. Nothing is written toward Z1.",
      "direction": "from-to",
      "boundaryDevices": ["OPC UA broker", "DMZ firewall pair"],
      "accountableOrg": "Acme Petrochemicals, OT network team",
      "logicalBoundary": "From the BPCS OPC UA server through the broker to the historian in the DMZ.",
      "physicalBoundary": "Copper links from the central control room to OT racks 4 and 5 in the server room.",
      "accessPoints": ["OPC UA broker service", "DMZ firewall pair, BPCS-facing interface"],
      "physicalAccessPoints": ["Patch panels in the central control room and OT rack 4"],
      "dataFlows": ["Process values and alarms, BPCS to historian, one way"],
      "securityPolicies": ["All exchange between OT and corporate passes through the DMZ, with no direct paths"],
      "assumptions": ["The broker enforces one-way replication and is managed with the DMZ hosts"],
      "externalDependencies": ["Time sync from DMZ NTP"],
      "securityRequirements": ["IEC 62443-3-3 system requirements and requirement enhancements at its SL-T", "Acme OT security standard GS-104, section 7 (OT DMZ)"],
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 2, "RDF": 3, "TRE": 2, "RA": 2 },
      "justification": "The conduit is assessed with Z3 because a pivot from the DMZ historian toward the BPCS would follow this data flow. IAC, SI and RDF are set to SL3 to match the BPCS targets it connects to, so that the replication path is not the weak link. The broker also enforces one-way replication. DC at SL2 follows the historian's process data, and RA at SL2 follows the 30-minute window before a manual shutdown. UC and TRE at SL2 match the zones on either side.",
      "assessment": { "depth": "grouped", "withId": "Z3" }
    },
    {
      "id": "C2",
      "fromZone": "Z3",
      "toZone": "Z1",
      "name": "Vendor remote access",
      "channels": ["VPN", "RDP through the jump host"],
      "notes": "Vendor VPN terminates in the DMZ. Sessions are always started from the recorded jump host in Z3, activated per ticket, and carry traffic both ways while open. Nothing in Z1 can start a session outward.",
      "direction": "both",
      "boundaryDevices": ["Vendor VPN concentrator", "Vendor jump host", "DMZ firewall pair"],
      "accountableOrg": "Acme Petrochemicals, OT network team; the DCS vendor for its own end",
      "logicalBoundary": "From the vendor VPN concentrator through the jump host in the DMZ to the DCS servers.",
      "physicalBoundary": "The site internet link to the server room, then OT racks 4 and 5 to the central control room.",
      "accessPoints": ["Vendor VPN concentrator", "Jump host remote desktop service"],
      "physicalAccessPoints": ["Server room, OT rack 4"],
      "dataFlows": ["Vendor engineer sessions to the DCS servers, both ways while a session is open"],
      "securityPolicies": ["Vendor sessions activated per ticket, time-bounded"],
      "assumptions": ["The vendor issues and revokes its engineers' credentials and reports leavers"],
      "externalDependencies": ["DCS vendor support contract (remote diagnostics)", "Site internet link"],
      "securityRequirements": ["IEC 62443-3-3 system requirements and requirement enhancements at its SL-T", "Acme third-party remote access procedure OPS-PROC-118"],
      "external": true,
      "externalParty": "DCS vendor support engineers",
      "threats": [
        { "id": "T9", "consequenceId": "K1", "via": ["Z3"], "statement": "A vendor credential or session is hijacked and replayed to reach the DCS outside an authorised window.", "source": "External attacker via vendor access chain", "entryPoint": "Vendor VPN concentrator, then the jump host", "consequence": "An unattributed session on the DCS servers able to change control settings.", "assetIds": ["AS7", "AS1"], "vulnerabilityIds": ["V7"], "countermeasureIds": ["M7"], "affectedFR": ["IAC", "RDF"], "likelihood": "medium", "impact": "serious", "likelihoodRationale": "Vendor credentials are a common target, and Acme cannot see when the vendor's staff change.", "currentLikelihood": "low", "currentImpact": "serious", "residualLikelihood": "", "residualImpact": "", "acceptance": "", "acceptanceDetail": { "by": "", "role": "", "date": "", "reviewDate": "" }, "treatment": { "decision": "reduce", "confirmed": true, "reason": "" } }
      ],
      "vulnerabilities": [
        { "id": "V7", "description": "Vendor support accounts are issued by the vendor, and Acme learns of a leaver only when the vendor reports one", "reference": "Vendor remote access session demonstration, O3" }
      ],
      "countermeasures": [
        { "id": "M7", "description": "MFA on VPN and jump host, per-ticket session activation, session recording, auto-disconnect at window end", "addressesFR": ["IAC", "UC", "RDF"], "reference": "OPS-PROC-118", "existing": true, "owner": "", "priority": "", "dueDate": "", "status": "", "srRefs": ["SR 1.1", "SR 1.13", "SR 2.6"] }
      ],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 2, "RDF": 3, "TRE": 2, "RA": 2 },
      "justification": "This conduit is the most exposed path into the BPCS. A hijacked vendor credential or session starts at High, and the existing per-session controls (MFA, per-ticket activation, recording and auto-disconnect) bring it within tolerable risk today. The SL-T is still held at SL3 on IAC and RDF to match the Z1 targets it reaches, so that the conduit is not the weak link. SI at SL3 also matches the BPCS, UC at SL2 matches both zones, DC at SL2 follows the DMZ and RA at SL2 follows the BPCS. TRE at SL2 keeps the session recordings usable as evidence.",
      "assessment": { "depth": "detailed" }
    },
    {
      "id": "C3",
      "fromZone": "Z3",
      "toZone": "EXT",
      "name": "Corporate reporting",
      "channels": ["HTTPS"],
      "notes": "Corporate clients request read-only reports over HTTPS, and process data flows one way, from Z3 to corporate. The corporate side is out of scope and assumed untrusted.",
      "direction": "from-to",
      "boundaryDevices": ["DMZ firewall pair"],
      "externalParty": "Acme corporate reporting clients",
      "accountableOrg": "Acme Petrochemicals, OT network team; Acme group IT for the corporate side",
      "logicalBoundary": "From the historian reporting service to the DMZ firewall's corporate-facing interface.",
      "physicalBoundary": "Server room, OT rack 5, to the corporate network switch.",
      "accessPoints": ["DMZ firewall pair, corporate-facing interface", "Historian reporting service (HTTPS)"],
      "physicalAccessPoints": ["Server room, OT rack 5"],
      "dataFlows": ["Throughput and quality reports, historian to corporate clients, read only"],
      "securityPolicies": ["All exchange between OT and corporate passes through the DMZ, with no direct paths"],
      "assumptions": ["The corporate network is untrusted"],
      "externalDependencies": ["Corporate network services run by Acme group IT"],
      "securityRequirements": ["IEC 62443-3-3 system requirements and requirement enhancements at its SL-T", "Acme OT security standard GS-104, section 7 (OT DMZ)"],
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 2, "UC": 2, "SI": 2, "DC": 2, "RDF": 2, "TRE": 2, "RA": 1 },
      "justification": "C3 is the boundary conduit to the untrusted corporate network and carries no control traffic. Its targets match the DMZ it serves. It is SL2 on every foundational requirement except RA, for the read-only brokerage and the confidentiality of throughput data, and SL1 on RA, because losing corporate reporting does not affect operator view or control. The house method suggests SL3 on IAC, SI and RDF because the DMZ's own suggestion is SL3, and the DMZ holds those at SL2 for the reasons in its justification.",
      "assessment": { "depth": "proportionate", "considered": "A compromised client on the out-of-scope corporate network using the read-only reporting service as a foothold, and exfiltration of throughput data. Both are assessed at the Z3 boundary as T5 and T6." }
    },
    {
      "id": "C4",
      "fromZone": "Z4",
      "toZone": "Z1",
      "name": "Engineering VLAN",
      "channels": ["DCS engineering protocol", "PLC programming protocol"],
      "notes": "Configuration downloads and diagnostics from the engineering workstations to the DCS servers and unit PLCs, under MoC.",
      "direction": "both",
      "boundaryDevices": ["Control network core switch, engineering VLAN access list"],
      "accountableOrg": "Acme Petrochemicals, control systems engineering",
      "logicalBoundary": "From the engineering workstations in Z4 to the DCS servers and unit PLCs in Z1, on the engineering VLAN.",
      "physicalBoundary": "The engineering office network cabinet to the central control room and field auxiliary rooms 1 and 3.",
      "accessPoints": ["Engineering VLAN ports on the control network core switch"],
      "physicalAccessPoints": ["Engineering office network cabinet"],
      "dataFlows": ["Configuration downloads and diagnostics, engineering workstations to the BPCS, both ways while a session is open"],
      "securityPolicies": ["No engineering changes without MoC approval", "Engineering accounts are individual; admin by exception"],
      "assumptions": ["Only the engineering workstations in Z4 are on the engineering VLAN"],
      "externalDependencies": ["DCS and PLC vendor engineering software licences"],
      "securityRequirements": ["IEC 62443-3-3 system requirements and requirement enhancements at its SL-T", "Acme OT security standard GS-104, section 6 (engineering access and removable media)"],
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 3, "UC": 2, "SI": 3, "DC": 1, "RDF": 3, "TRE": 2, "RA": 2 },
      "justification": "The engineering VLAN carries configuration downloads into the BPCS, so it takes the BPCS targets. IAC, SI and RDF are SL3, because malware brought in over an engineering connection is a High risk there and the path into the controllers must not be the weak link. UC stays at SL2, as on both zones it joins, and misuse of the shared account on the legacy configuration tool is accepted until that tool is retired. DC at SL1 reflects the low confidentiality of configuration data, and TRE and RA at SL2 follow the BPCS.",
      "assessment": { "depth": "grouped", "withId": "Z4" }
    },
    {
      "id": "C5",
      "fromZone": "Z4",
      "toZone": "Z2",
      "name": "Keyed SIS engineering connection",
      "channels": ["SIS engineering protocol"],
      "notes": "Patched in only for an authorised SIS change, with the program-mode keyswitch turned and a keyed bypass record, and disconnected at all other times.",
      "direction": "both",
      "temporary": true,
      "safetyRelated": true,
      "boundaryDevices": ["Keyed patch point in field auxiliary room 2"],
      "accountableOrg": "Acme Petrochemicals, process safety",
      "logicalBoundary": "From the SIS engineering software on an engineering workstation in Z4 to the SIS logic solver.",
      "physicalBoundary": "The engineering office to field auxiliary room 2, through the keyed patch point.",
      "accessPoints": ["SIS engineering port on the logic solver"],
      "physicalAccessPoints": ["Keyed patch point in field auxiliary room 2"],
      "dataFlows": ["Authorised SIS logic changes and diagnostics, engineering workstation to the logic solver, while connected"],
      "securityPolicies": ["SIS changes require process safety authorisation and a keyed bypass record"],
      "assumptions": ["The connection is left unpatched outside an authorised change"],
      "externalDependencies": ["SIS vendor for logic changes (site visit only, no remote path)"],
      "securityRequirements": ["IEC 62443-3-3 system requirements and requirement enhancements at its SL-T", "Acme process safety standard PS-07 (independence of safety functions)"],
      "threats": [],
      "vulnerabilities": [],
      "countermeasures": [],
      "slTargetByFR": { "IAC": 3, "UC": 3, "SI": 3, "DC": 3, "RDF": 3, "TRE": 3, "RA": 3 },
      "justification": "The keyed engineering connection reaches the SIS, so it takes the SIS zone's SL3 on every foundational requirement and does not become the weak link. It is connected only for an authorised change, with the program-mode keyswitch turned and a keyed bypass record.",
      "assessment": { "depth": "grouped", "withId": "Z2" }
    }
  ],
  "counters": { "zone": 4, "conduit": 5, "threat": 9, "vuln": 7, "cm": 9, "hla": 6, "interview": 5, "document": 4, "observation": 3, "asset": 11, "consequence": 3, "session": 3 }
};
