/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/engagement-guidance.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.shared = window.App.Data.shared || {};
window.App.Data.shared.engagementGuidance = {
  "id": "engagement-guidance",
  "_note": "Preparation guidance per instrument: the documents a consultant most commonly needs, the ones clients often forget to bring, and the stakeholders worth interviewing. ADVISORY ONLY - not a fixed checklist, and it must never pre-populate the basis-of-assessment register; the consultant records what was actually reviewed/observed there. Keyed by instrument id; 'default' covers instruments without an entry.",
  "default": {
    "commonDocuments": [
      "Network architecture diagrams (OT and OT/IT boundary)",
      "Asset inventory / register for the systems in scope",
      "OT / control-system security policies and procedures",
      "Incident response plan and recent incident records",
      "Previous audits, assessments or penetration test reports",
      "Backup and recovery procedures"
    ],
    "oftenForgotten": [
      "Vendor support contracts and remote-access agreements",
      "Organisation chart showing who administers what",
      "Records of backup restore tests",
      "Management-of-change records for the control system",
      "List of third parties with any access to OT"
    ],
    "keyStakeholders": [
      "Control systems / OT engineer",
      "IT / network manager (site and corporate)",
      "Operations or plant manager",
      "CISO / information security lead",
      "Maintenance manager"
    ]
  },
  "instruments": {
    "iec-62443-3-3": {
      "commonDocuments": [
        "Network architecture and zone/conduit (segmentation) diagrams",
        "Asset inventory with OS/firmware versions",
        "Firewall and boundary device rule sets",
        "Remote access architecture and account arrangements",
        "AD / domain design and account management procedures",
        "Patch management process and deployment records",
        "Malware protection configuration (AV / allowlisting)",
        "Backup, restore and DR procedures for OT systems"
      ],
      "oftenForgotten": [
        "Firewall rule change records, to show whether the rule set is managed or has just grown",
        "Service-account and shared-account list with owners",
        "Wireless survey / list of wireless links into the OT estate",
        "Time synchronisation (NTP) design, which several SRs depend on",
        "Certificate and cryptographic key inventory",
        "Historian / DMZ replication configuration and data flows",
        "Details of the risk assessment that set the target SLs (or the risk context file exported from the risk tool)"
      ],
      "keyStakeholders": [
        "Control systems / DCS engineer",
        "OT network engineer (and corporate network counterpart)",
        "SIS / functional safety engineer",
        "System integrator or vendor support representative",
        "Operations shift lead, for how the system is run day to day",
        "Security operations / SOC lead (if monitoring exists)"
      ]
    },
    "iec-62443-4-1": {
      "commonDocuments": [
        "Documented secure development lifecycle / process descriptions",
        "Secure coding standards and code review records",
        "Threat models for representative products",
        "Defect and vulnerability tracking process (and samples)",
        "Security testing / verification & validation reports",
        "Patch and update release process",
        "Third-party component register / SBOM practice"
      ],
      "oftenForgotten": [
        "Development environment security (build servers, repos, developer access)",
        "Code-signing key handling and release integrity controls",
        "External vulnerability handling / PSIRT and disclosure process",
        "Product end-of-life / end-of-support policy",
        "Records that show the process is followed in practice"
      ],
      "keyStakeholders": [
        "Engineering / development manager",
        "Product manager (lifecycle and support commitments)",
        "QA / test lead",
        "Product security officer / PSIRT contact",
        "Configuration / release manager"
      ]
    },
    "iec-62443-2-4": {
      "commonDocuments": [
        "Service contract or statement of work, showing which 62443-2-4 requirements the asset owner asked for",
        "The provider's security policy and procedures for integration or maintenance work",
        "Staff and subcontractor briefing material, vetting records and the named security contact",
        "Hardening guides, network design records and as-built drawings for the automation solution",
        "Remote access procedure, approved tools list and session approval records",
        "Account, password and anti-malware procedures used on the asset owner's systems",
        "Patch qualification process and patch status reports given to the asset owner",
        "Backup, restore and disaster recovery procedures for the solution"
      ],
      "oftenForgotten": [
        "Records showing a process has been delivered to an asset owner (needed for ML3)",
        "Deliverable documents the asset owner should already hold, such as the default accounts list or event storm statement",
        "Subcontractor contracts that pass the security duties down",
        "Account removal reports and shared password records from recent jobs",
        "Evidence of a full backup and restore test",
        "Metrics or reviews that show a process improving over time (needed for ML4)"
      ],
      "keyStakeholders": [
        "Service or contract manager on the provider side",
        "The provider's named security contact or security lead",
        "Lead engineer or technician who works on the solution",
        "Asset owner's representative for the service (contract owner or site engineer)",
        "Subcontractor lead, where part of the work is subcontracted"
      ]
    },
    "iec-62443-2-1-2010": {
      "commonDocuments": [
        "CSMS scope statement and security policy set",
        "Risk assessment methodology and latest results",
        "Security roles and responsibilities (RACI) for OT",
        "Security awareness and training records",
        "Incident response plan and incident records",
        "Business continuity / disaster recovery plans",
        "Internal audit reports and corrective action records",
        "Supplier / procurement security requirements"
      ],
      "oftenForgotten": [
        "Management review minutes (evidence of leadership engagement)",
        "Exception / waiver register with expiry and ownership",
        "HR security process (joiners / movers / leavers for OT access)",
        "How the CSMS applies at each site compared with head office",
        "Records that show procedures are carried out"
      ],
      "keyStakeholders": [
        "Senior management sponsor for the CSMS",
        "Security programme manager",
        "Operations and engineering management",
        "HR / training coordinator",
        "Procurement / supplier manager",
        "IT security (where OT security leans on corporate processes)"
      ]
    },
    "iec-62443-2-1-2024": {
      "commonDocuments": [
        "Security programme documentation mapped to the SPEs",
        "OT risk assessment methodology and results",
        "Policy and procedure set with review dates",
        "Training and competence records for OT security roles",
        "Incident response plan and exercise records",
        "Asset inventory and network documentation",
        "Internal audit / self-assessment results"
      ],
      "oftenForgotten": [
        "Evidence that each documented process is practised",
        "KPI / metrics reporting to management",
        "Management-of-change records for the security programme",
        "Improvement plans from previous assessments and their status",
        "Which sites follow the programme in practice"
      ],
      "keyStakeholders": [
        "Security programme owner",
        "Asset owner senior management (accountability and budget)",
        "Site OT leads (where the programme is put into practice)",
        "IT/OT integration lead",
        "Internal audit / compliance function"
      ]
    },
    "ncsc-caf": {
      "commonDocuments": [
        "Definition of the essential function(s) and supporting systems",
        "Risk management framework and latest risk register",
        "Network architecture and data flow diagrams for the essential function",
        "Access control policy and privileged access arrangements",
        "Security monitoring / SOC documentation and alerting examples",
        "Incident response plan and exercise records",
        "Supply chain security policy and the list of critical suppliers"
      ],
      "oftenForgotten": [
        "Regulator correspondence (designation, previous CAF submissions, improvement plans)",
        "Staff awareness and training records",
        "Physical security arrangements for sites supporting the essential function",
        "Resilience evidence, such as single point of failure analysis and failover test records",
        "The boundary decisions behind how 'supporting systems' were scoped"
      ],
      "keyStakeholders": [
        "SIRO / accountable officer for the essential function",
        "Operations manager for the essential function",
        "SOC / monitoring lead",
        "Network and infrastructure manager",
        "Compliance / regulator liaison",
        "HR or training lead (people objectives)"
      ]
    },
    "ncsc-caf-aviation": {
      "commonDocuments": [
        "Scope of the assessed systems and their link to aviation operations",
        "Aviation security programme documentation",
        "CAA correspondence (tier designation, previous submissions)",
        "Network architecture for airside / operational systems",
        "Access control and joiner/mover/leaver process",
        "Security monitoring arrangements and incident response plan",
        "Supply chain / ground handler / third-party access arrangements"
      ],
      "oftenForgotten": [
        "Interfaces between corporate IT and operational aviation systems (AODB, BHS, ATC-adjacent)",
        "Third-party and concession connections, which are often numerous and undocumented",
        "Training records for staff operating critical aviation systems",
        "Business continuity evidence for essential aviation functions",
        "Physical access arrangements to comms rooms airside"
      ],
      "keyStakeholders": [
        "Accountable manager / security accountable executive",
        "Aviation security manager",
        "Airside operations systems owner (BHS, AODB, fuel, etc.)",
        "Engineering / maintenance systems lead",
        "IT manager for operational systems",
        "Compliance / quality manager (CAA liaison)"
      ]
    },
    "general-ot-posture": {
      "commonDocuments": [
        "Network overview diagram (even informal)",
        "Asset list for the control system (even rough)",
        "List of remote access routes and who uses them",
        "Backup arrangements for OT systems",
        "Any incident history or near misses",
        "Support contracts for the control system"
      ],
      "oftenForgotten": [
        "How OT and IT split support responsibilities in practice",
        "Out-of-hours support arrangements and emergency access",
        "Third parties with standing access (integrators, OEMs)",
        "Where spares and recovery media are kept, and whether they work",
        "USB / removable media practice on the plant floor"
      ],
      "keyStakeholders": [
        "Plant / operations manager",
        "Control / instrument engineer",
        "Site IT support and corporate IT",
        "Maintenance manager",
        "The person who is called out when something breaks overnight"
      ]
    },
    "nis2-assessment": {
      "commonDocuments": [
        "Entity classification analysis (essential vs important) and sector rationale",
        "Cybersecurity risk management measures documentation (Art. 21)",
        "Incident handling and reporting procedures (24h / 72h / final report)",
        "Business continuity and crisis management plans",
        "Supply chain security policy and supplier assessments",
        "Management body training records",
        "Cryptography / encryption policy and MFA deployment status",
        "Vulnerability handling and disclosure arrangements"
      ],
      "oftenForgotten": [
        "Evidence of management-body accountability (board minutes, approvals)",
        "Registration with the national competent authority / CSIRT contact details",
        "Cross-border service considerations and jurisdiction mapping",
        "Which member state's transposition law applies",
        "Records of past reportable incidents and whether they were reported"
      ],
      "keyStakeholders": [
        "Legal / compliance officer",
        "CISO / security lead",
        "A management body member (NIS2 places duties on them personally)",
        "Incident response lead",
        "Procurement / supplier relationship manager",
        "DPO (GDPR interactions on incident handling)"
      ]
    },
    "eu-cra": {
      "commonDocuments": [
        "Product technical documentation and intended-purpose statement (Annex I Part I)",
        "Product cybersecurity risk assessment underpinning the essential requirements",
        "SBOM / third-party and open-source component register",
        "Vulnerability handling process, PSIRT and coordinated disclosure policy (Annex I Part II)",
        "Security update / patch delivery process and the declared support period",
        "EU declaration of conformity, CE marking and the conformity-assessment route for the product class",
        "Incident & vulnerability reporting procedure to the ENISA single reporting platform (Art 14)"
      ],
      "oftenForgotten": [
        "Which products are in scope and their CRA class (Default / Class I / Class II / Critical), which sets the conformity route",
        "Existing IEC 62443 / ISO 27001 certificates are useful evidence but do not equal CRA conformity (no harmonised standard is cited yet)",
        "Which obligation date applies: Art 14 reporting from 11 Sep 2026, full obligations from 11 Dec 2027",
        "Notified-body engagement where the class requires it (Class II / Critical)",
        "Open-source component obligations and upstream dependency handling",
        "Importer / distributor obligation mapping across the sales channel",
        "Security of the update-delivery infrastructure itself"
      ],
      "keyStakeholders": [
        "Product manager (scope, product class, support-period commitments)",
        "Engineering / development lead (Annex I Part I essential requirements)",
        "PSIRT / vulnerability-handling lead (Annex I Part II)",
        "Regulatory / compliance officer (CE marking, declaration of conformity)",
        "Legal (obligations, reporting duties, market-surveillance exposure)",
        "Quality / conformity manager, and the notified body where the class requires one"
      ]
    },
    "eu-machinery": {
      "commonDocuments": [
        "Machine risk assessment file (Annex III General Principles) and EHSR applicability mapping",
        "Technical documentation or technical file per machine (Annex IV Part A), including descriptions of sensor and autonomous systems",
        "Control-system safety case (ISO 13849 / IEC 62061) and its security extension for 1.2.1",
        "Safety-software inventory, integrity protection and version/upload logging design (1.1.9, 1.2.1(f))",
        "EU declaration of conformity (or the declaration of incorporation and assembly instructions for partly completed machinery)",
        "Harmonised-standards mapping and any EU-type examination certificates with expiry dates",
        "Instructions for use and the digital-instructions hosting arrangement (10-year availability)"
      ],
      "oftenForgotten": [
        "Which machines are in Annex I Part A or B. Self-evolving (ML) safety systems are in Part A, which makes third-party assessment mandatory",
        "The Regulation applies to machines placed on the market from 14 January 2027. Directive 2006/42/EC governs earlier placements",
        "EU type-examination certificates now expire after 5 years, and the renewal window is 12 to 6 months before expiry",
        "Digital instructions must stay online for the machine's lifetime and for at least 10 years, with paper copies supplied on request within a month",
        "A capability-changing software update can be a 'substantial modification' re-opening conformity (Art 18)",
        "Source code / programming logic for safety software may have to be produced to an authority on reasoned request",
        "A cybersecurity certificate under a 2019/881 scheme gives presumption of conformity for 1.1.9 and 1.2.1 only, and only as far as it covers them"
      ],
      "keyStakeholders": [
        "Machinery safety / design engineering lead (Annex III EHSRs, risk assessment)",
        "Controls / automation engineer (1.2.1 control-system safety, remote and wireless operation)",
        "Product security / OT security lead (1.1.9 protection against corruption, safety-software integrity)",
        "Regulatory / compliance officer (classification, conformity route, CE marking, DoC)",
        "Technical documentation owner (technical file, instructions regime)",
        "Quality manager, and the notified body where Annex I requires one"
      ]
    },
    "supplier-screener": {
      "commonDocuments": [
        "Supplier security certifications (ISO 27001, IEC 62443 certs, SOC 2)",
        "Supplier's secure development / SDLC summary",
        "Vulnerability disclosure policy and security advisories history",
        "Patch and support commitments for the products in use",
        "Contract security clauses currently in place"
      ],
      "oftenForgotten": [
        "Sub-supplier / fourth-party dependencies behind the product",
        "What remote access the supplier holds today",
        "Whether the certifications cover the product the client buys or a different scope",
        "Escrow / continuity arrangements if the supplier fails"
      ],
      "keyStakeholders": [
        "Supplier account or product manager",
        "Supplier security officer (or whoever answers security questionnaires)",
        "Internal procurement lead",
        "Internal owner of the supplier's product / service"
      ]
    },
    "nis2-quick-gap": {
      "commonDocuments": [
        "Whatever risk assessment exists (any format)",
        "Incident response procedure and reporting contacts",
        "Supply chain / supplier security policy",
        "Business continuity plan",
        "Security training records"
      ],
      "oftenForgotten": [
        "Board / senior management approval and oversight evidence",
        "Whether the entity has determined its own NIS2 classification",
        "Registration / contact details lodged with the national authority"
      ],
      "keyStakeholders": [
        "CISO / security lead",
        "Compliance officer",
        "A senior manager who can speak to governance"
      ]
    }
  }
};
