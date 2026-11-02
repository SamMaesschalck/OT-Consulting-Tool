/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/risk-appetite/instrument.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["risk-appetite"] = window.App.Data.instruments["risk-appetite"] || {};
window.App.Data.instruments["risk-appetite"].instrument = {
  "id": "risk-appetite",
  "title": "OT Risk Appetite & Exposure Assessment",
  "framework": "SolutionsPT (guidance-informed)",
  "family": "screening",
  "contentVersion": "1.0.0",
  "scoringFamily": "risk-appetite-coherence",
  "scoringProfileRef": "risk-appetite-coherence",
  "targetDimension": "organisation",
  "targetDimensionLabel": "Organisation (leadership / governance posture)",
  "status": "active",
  "indicative": true,
  "interviewLed": true,
  "framing": "A high-level, interview-led assessment that characterises an organisation's INHERENT RISK EXPOSURE (what it faces by virtue of sector, criticality, geopolitical and threat context) against its APPARENT RISK APPETITE (how much cyber risk it appears willing to accept), and reads the coherence between the two. The value is the fit: an organisation accepting materially more risk than its exposure warrants has usually done so by drift, not decision. Assessor-led throughout, informed by sector baselines and conducted as a structured interview; an optional technical layer grounds stated appetite against technical reality. Guidance-informed (NIST SP 800-82, NIST CSF, IEC 62443-3-2 risk framing, ISO 31000 vocabulary), not an assessment against any single standard.",
  "sourceNote": "Structure and band definitions drawn from the risk-governance concepts in NIST SP 800-82, the NIST CSF, the consequence-driven risk approach of IEC 62443-3-2, and ISO 31000 risk-appetite vocabulary, plus practitioner judgement. Sector baselines and band definitions are SolutionsPT starting points, not determinations.",
  "criticalCaveats": [
    "This is an informed CHARACTERISATION by expert judgement, not a measurement against a standard. Neither exposure nor appetite is objectively scored; both are the assessor's professional read.",
    "No risk-appetite band is inherently good or bad. The only finding is the FIT between exposure and appetite. A cautious appetite is not 'better' than a tolerant one; it is only better or worse MATCHED to a given exposure.",
    "The deliverable is a basis for a conscious risk-acceptance conversation with the client's leadership, not a determination of whether their appetite is 'correct'."
  ],
  "setup": [
    {
      "id": "setup.sector",
      "type": "sector-baseline",
      "question": "Organisation sector (sets the exposure baseline)",
      "lookupRef": "shared/risk-appetite-sector-baselines.json",
      "drives": "Pre-sets the EXP baseline exposure band; assessor confirms or overrides."
    },
    {
      "id": "setup.techlayer",
      "type": "toggle",
      "question": "Include the optional technical layer (revealed appetite)?",
      "default": false,
      "drives": "Adds the TECH section; enables stated-vs-revealed appetite comparison."
    }
  ],
  "sections": [
    {
      "id": "EXP",
      "name": "Inherent risk exposure",
      "axis": "exposure",
      "summary": "What the organisation faces by virtue of what it is and where it sits. Assessor-characterised from sector baseline plus threat, geopolitical, consequence, regulatory and interconnection factors. Rolls up to an exposure band (limited/moderate/high/severe)."
    },
    {
      "id": "APP",
      "name": "Apparent risk appetite",
      "axis": "appetite",
      "summary": "How much cyber risk the organisation appears willing to accept, elicited by interview across governance, investment, remediation, conscious acceptance, operational trade-offs, safety framing and incident history. Rolls up to an appetite band (averse/cautious/open/tolerant)."
    },
    {
      "id": "TECH",
      "name": "Revealed appetite (technical, optional)",
      "axis": "appetite-revealed",
      "optional": true,
      "summary": "Grounds stated appetite against technical reality (patching, segmentation, monitoring, access, recovery). Where it diverges from the interview picture, the stated-vs-revealed gap is itself a finding."
    }
  ],
  "items": [
    {
      "id": "EXP1",
      "code": "EXP.1",
      "sectionId": "EXP",
      "title": "Sector and criticality",
      "stateSummary": "What the organisation is and how critical its function: the baseline exposure before anything else.",
      "interviewPrompt": "Set the sector baseline, then adjust for how essential/critical this specific organisation's function is.",
      "rationale": "Sector and criticality set the floor for everything else: a safety-critical essential service faces a different world from a discrete manufacturer regardless of what either chooses to do. This is the largest single determinant of inherent exposure and the right starting point.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "A business function with no essential-service or safety role. An outage inconveniences customers rather than harming anyone.",
        "moderate": "Important to customers or a supply chain, but alternatives exist and an outage is costly rather than dangerous.",
        "high": "An essential or regulated service, or a site whose processes are safety-relevant. An outage affects many people or other organisations' operations.",
        "severe": "Critical national infrastructure or a designated essential service, where loss of function has public-safety or national consequence."
      }
    },
    {
      "id": "EXP2",
      "code": "EXP.2",
      "sectionId": "EXP",
      "title": "Threat and targeting context",
      "stateSummary": "Who plausibly targets this organisation, and with what capability: commodity, criminal, or state-level.",
      "interviewPrompt": "Characterise the credible threat actors. Is there evidence of targeted interest in this sector or organisation? Commodity ransomware only, or advanced/state-level?",
      "rationale": "Exposure depends on who is actually trying, not just on what could theoretically go wrong. An organisation facing only commodity ransomware sits in a different place from one credibly targeted by capable or state-level actors, and conflating the two mis-sizes the risk.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "Only untargeted, opportunistic threats are credible, with no sign of interest in the organisation or its sector.",
        "moderate": "Exposed to commodity ransomware and fraud like most organisations, with no evidence of targeting beyond that.",
        "high": "The sector has seen targeted campaigns by capable criminal groups, and the organisation is a plausible target for them.",
        "severe": "Credible interest from state-aligned or similarly capable actors in the sector or the organisation itself, including intrusions into operational systems."
      }
    },
    {
      "id": "EXP3",
      "code": "EXP.3",
      "sectionId": "EXP",
      "title": "Geopolitical exposure",
      "stateSummary": "Whether the organisation's location, ownership, markets or sector place it in a geopolitically exposed position.",
      "interviewPrompt": "Consider region of operation, contested sectors, ownership/supply ties, and any current geopolitical tension bearing on the organisation. Assessor judgement, recorded.",
      "rationale": "Geopolitical position shifts exposure in ways sector alone does not capture, ownership ties, region of operation, and sector-level tension can raise targeting sharply. It is also the dimension most requiring the assessor's own judgement rather than a lookup, which is why the tool prompts but does not assert it.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "Domestic operations only, in a sector that draws no geopolitical attention.",
        "moderate": "Some international supply chain or ownership, but no contested region or politically sensitive service.",
        "high": "The sector is named in national threat reporting, or the organisation operates in or supplies a region under geopolitical pressure.",
        "severe": "Operations, ownership or customers in a contested region, or a service a hostile state would plausibly want to disrupt."
      }
    },
    {
      "id": "EXP4",
      "code": "EXP.4",
      "sectionId": "EXP",
      "title": "Consequence of compromise",
      "stateSummary": "How severe the real-world consequence of a serious compromise would be: operational, financial, safety, environmental, systemic.",
      "interviewPrompt": "Characterise worst-credible consequence. Safety-of-life or environmental? Systemic (others depend on them)? Purely operational/financial?",
      "rationale": "Exposure is ultimately about consequence, and in OT the worst-credible consequence can be physical: injury, environmental release, loss of an essential service. Characterising consequence honestly is what separates a serious exposure from a merely inconvenient one.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "The worst credible outcome is contained: lost data or downtime, with no safety, environmental or public impact.",
        "moderate": "Significant financial loss or production downtime, but no harm to people or the environment.",
        "high": "Serious operational disruption, a reportable environmental release, or harm to people that existing safeguards would probably limit.",
        "severe": "Loss of life, a major environmental incident, or loss of an essential service to a large population."
      }
    },
    {
      "id": "EXP5",
      "code": "EXP.5",
      "sectionId": "EXP",
      "title": "Regulatory and obligation weight",
      "stateSummary": "How much regulatory exposure the organisation carries (NIS2/CAF, sector regulation, CRA as supplier).",
      "interviewPrompt": "Record the regulatory regimes that apply and the weight of obligation: a signal of both scrutiny and expected posture.",
      "rationale": "Regulatory weight signals both the scrutiny an organisation faces and the posture it is expected to hold, and non-compliance is itself an exposure. It also frames what 'acceptable' appetite looks like from outside.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "No sector-specific cyber regulation, only general obligations such as data protection.",
        "moderate": "Some sector requirements or contractual obligations from customers, lightly enforced.",
        "high": "In scope of NIS, NIS2, the CAF or an equivalent regime, with a regulator who inspects and can impose penalties.",
        "severe": "Heavy, specific regulation with licence or safety-case consequences, such as nuclear or major hazard regimes, where a cyber failure can halt operations."
      }
    },
    {
      "id": "EXP6",
      "code": "EXP.6",
      "sectionId": "EXP",
      "title": "Interconnection and supply-chain reach",
      "stateSummary": "How large and exposed the organisation's attack surface and dependency web is.",
      "interviewPrompt": "Consider interconnection, third-party/vendor access, supply-chain reach in both directions.",
      "rationale": "A large, interconnected attack surface with deep third-party access raises exposure independently of sector, because it multiplies the ways in. Supply-chain reach matters in both directions: what can reach them, and what they can reach.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "limited": "Largely self-contained: few external connections, and no other organisation depends on its systems.",
        "moderate": "Ordinary business connections to suppliers and customers, with some remote access for support.",
        "high": "Many remote sites, or integrators with standing access, or other organisations rely on its services to operate.",
        "severe": "A hub that others depend on, or a large estate of third-party and remote connections into operational systems, so a compromise spreads well beyond it."
      }
    },
    {
      "id": "APP1",
      "code": "APP.1",
      "sectionId": "APP",
      "title": "Board and governance attention",
      "stateSummary": "How seriously and how actively senior governance treats cyber risk to operations.",
      "interviewPrompt": "How does the board engage with OT/cyber risk? Standing agenda item, or only after incidents? Who owns it? Listen for whether it's a governed business risk or a delegated IT matter.",
      "rationale": "How seriously senior governance treats cyber risk is the strongest single signal of genuine appetite, because it determines whether everything downstream is resourced and owned. Risk that never reaches the board is risk accepted by default, whatever the policy says.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Cyber risk is a standing board item with a named owner, regular reporting on the risk being carried, and real challenge from the board.",
        "cautious": "Cyber is on the board agenda and owned by an executive, though reporting covers status more than the risk being carried.",
        "open": "Cyber reaches the board occasionally, usually after an incident or an audit, and ownership sits below board level.",
        "tolerant": "The board rarely discusses cyber and no executive owns it. It is treated as an IT matter."
      }
    },
    {
      "id": "APP2",
      "code": "APP.2",
      "sectionId": "APP",
      "title": "Investment stance",
      "stateSummary": "How the organisation resources cyber security relative to its exposure.",
      "interviewPrompt": "How is security funded: proactively, or reactively after events? Is spend framed as investment or cost? How does it fare against competing priorities?",
      "rationale": "Investment is appetite made concrete: what an organisation funds reveals what it truly prioritises, more reliably than what it states. Reactive-only spending signals a higher tolerated risk than most such organisations would admit to.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Security is funded ahead of need, operational technology included, and the funding is protected when budgets tighten.",
        "cautious": "A dedicated budget covers the main risks, though some operational technology work waits for capital cycles.",
        "open": "Security competes with other spending and is funded when a specific case is made. Operational technology work is often deferred.",
        "tolerant": "Little or no dedicated funding. Security spending is reactive and mostly follows incidents or audit findings."
      }
    },
    {
      "id": "APP3",
      "code": "APP.3",
      "sectionId": "APP",
      "title": "Remediation urgency",
      "stateSummary": "How quickly the organisation acts on known risks and findings.",
      "interviewPrompt": "When a serious finding or vulnerability is identified, what actually happens, and how fast? Listen for the gap between policy and practice.",
      "rationale": "The speed of action on known risk is where stated and real appetite most often diverge. An organisation that identifies findings but remediates slowly is accepting risk in practice regardless of its stated caution.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Findings are fixed to defined timescales, in operational systems as well as IT, and overdue items are escalated.",
        "cautious": "Findings have owners and target dates. Dates in operational systems slip for outage windows but are tracked.",
        "open": "Findings are logged but dates move freely, and a backlog of old findings is accepted as normal.",
        "tolerant": "Findings are rarely tracked to closure, and the same issues come back from one assessment to the next."
      }
    },
    {
      "id": "APP4",
      "code": "APP.4",
      "sectionId": "APP",
      "title": "Conscious risk acceptance",
      "stateSummary": "Whether the organisation accepts risk deliberately and documented, or by default and drift.",
      "interviewPrompt": "What risk does the organisation knowingly accept, and is that acceptance documented and owned, or has it accumulated without anyone deciding? This distinguishes a considered appetite from an accidental one.",
      "rationale": "The distinction that matters in appetite is between risk accepted deliberately and risk accepted by drift. A considered appetite documents and owns what it tolerates; an accidental one accumulates unmanaged risk that no one consciously chose, which is the finding this assessment most often surfaces.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Every accepted risk is documented, owned, signed off at the right level and given an expiry date.",
        "cautious": "Significant risks are formally accepted with an owner, though expiry and review are not always enforced.",
        "open": "Risk acceptance is informal. Decisions happen in meetings or by moving a date, with little on record.",
        "tolerant": "There is no acceptance process. Risk is carried by default, and nobody could say what has been accepted."
      }
    },
    {
      "id": "APP5",
      "code": "APP.5",
      "sectionId": "APP",
      "title": "Tolerance for operational disruption vs security",
      "stateSummary": "How the organisation trades security action against operational continuity.",
      "interviewPrompt": "When security action (patching, segmentation, downtime) conflicts with production, which wins, and who decides? Reveals real, as opposed to stated, priorities.",
      "rationale": "When security action collides with production, the choice made, and who gets to make it, reveals the organisation's actual priorities under pressure. Stated appetite is cheap; the trade-off decision is where real appetite shows.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Security work takes priority, and the organisation will schedule downtime or accept cost to reduce risk.",
        "cautious": "Security work is planned into maintenance windows and rarely refused, though availability comes first.",
        "open": "Security work is often postponed because operations will not release the plant, and no alternative is arranged.",
        "tolerant": "Security changes are routinely refused on operational grounds, and nobody weighs the risk of not making them."
      }
    },
    {
      "id": "APP6",
      "code": "APP.6",
      "sectionId": "APP",
      "title": "Safety framing",
      "stateSummary": "Whether cyber risk to OT is understood as a safety issue or purely a business/IT one.",
      "interviewPrompt": "Does the organisation connect OT cyber risk to physical safety, or treat it as data/IT risk? In high-consequence sectors this framing strongly signals genuine appetite.",
      "rationale": "Whether an organisation frames OT cyber risk as a safety matter or an IT one strongly predicts how seriously it treats it, especially in high-consequence sectors. Treating a safety-relevant system as mere data risk is itself a signal of misjudged appetite.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Cyber is treated as a safety hazard: it appears in the safety case, in hazard studies and in safety sign-off.",
        "cautious": "Cyber is recognised as a contributor to safety risk and named in safety documentation, though not fully analysed.",
        "open": "Cyber and safety are managed separately. The link is acknowledged but not acted on.",
        "tolerant": "Cyber is not seen as relevant to safety, and safety engineers play no part in it."
      }
    },
    {
      "id": "APP7",
      "code": "APP.7",
      "sectionId": "APP",
      "title": "Response to past incidents / near-misses",
      "stateSummary": "What the organisation's history reveals about its real appetite.",
      "interviewPrompt": "How has the organisation responded to past incidents or near-misses: lasting change, or return to normal? Behaviour under real pressure reveals appetite better than statements.",
      "rationale": "Behaviour after a real incident or near-miss reveals appetite more honestly than any interview answer, because it shows what the organisation does under genuine pressure. Lasting change signals a real shift; a quiet return to normal signals the underlying appetite never moved.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Incidents and near misses, including those elsewhere in the sector, lead to reviews and funded changes that are seen through.",
        "cautious": "The organisation's own incidents lead to real changes, though near misses and incidents elsewhere get less attention.",
        "open": "Incidents are fixed locally, but the lessons are not carried across the organisation.",
        "tolerant": "Incidents are treated as bad luck. Little changes afterwards, and near misses go unrecorded."
      }
    },
    {
      "id": "TECH1",
      "code": "TECH.1",
      "sectionId": "TECH",
      "title": "Patching and update reality",
      "stateSummary": "The actual patching lag and update discipline, as revealed appetite.",
      "interviewPrompt": "What is the real patching/update cadence for OT? The lag between available and applied is a direct measure of tolerated risk.",
      "rationale": "Patching lag is one of the most direct measurable expressions of tolerated risk: the gap between a fix being available and applied is risk consciously or unconsciously accepted. It is a strong reality check against a stated cautious appetite.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Operational systems are updated on a defined cycle, with vendor-approved updates tested and applied.",
        "cautious": "Updates are applied during planned outages. Exceptions exist, but they are recorded and the risk is compensated.",
        "open": "Updates happen irregularly, usually when a vendor visits. Many systems are well behind, and exceptions are not tracked.",
        "tolerant": "No update regime for operational systems. Unsupported operating systems and years-old firmware are left in place."
      }
    },
    {
      "id": "TECH2",
      "code": "TECH.2",
      "sectionId": "TECH",
      "title": "Segmentation and architecture state",
      "stateSummary": "Whether the network reality matches the stated security posture.",
      "interviewPrompt": "Is the OT network genuinely segmented, or flat behind a perimeter? Architecture reveals how much lateral-movement risk is actually accepted.",
      "rationale": "Network architecture reveals accepted lateral-movement risk regardless of what the organisation says about segmentation. A flat network behind a perimeter, against a claim of caution, is a clear stated-versus-revealed gap.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Operational networks are divided into zones with controlled connections between them, and the boundary with IT is enforced and reviewed.",
        "cautious": "A clear boundary with IT exists and critical systems are separated, though zoning inside the operational network is partial.",
        "open": "A single boundary separates IT from the operational network, with little separation behind it.",
        "tolerant": "IT and operational networks are effectively flat, or the boundary carries broad exceptions that nobody reviews."
      }
    },
    {
      "id": "TECH3",
      "code": "TECH.3",
      "sectionId": "TECH",
      "title": "Monitoring and detection coverage",
      "stateSummary": "Whether the organisation could even detect a compromise it claims to care about.",
      "interviewPrompt": "What monitoring and detection genuinely covers OT? Low coverage against a stated cautious appetite is a stated-vs-revealed gap.",
      "rationale": "Detection coverage tests whether an organisation could even know if the risk it claims to care about materialised. Low coverage against a cautious stated appetite means the caution is aspirational, not operational.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Operational networks are monitored for unusual activity, and alerts reach people who can act on them at any hour.",
        "cautious": "Key boundaries and critical systems are monitored, though coverage inside operational networks is partial.",
        "open": "Monitoring covers the IT estate, but operational systems are largely unseen.",
        "tolerant": "Nothing is in place that would reveal an intrusion into operational systems."
      }
    },
    {
      "id": "TECH4",
      "code": "TECH.4",
      "sectionId": "TECH",
      "title": "Access and remote-access control",
      "stateSummary": "The real state of privileged and remote access into OT.",
      "interviewPrompt": "How is remote/vendor and privileged access actually controlled? Standing open access reveals tolerated risk regardless of policy.",
      "rationale": "The real state of privileged and remote access into OT is a direct measure of tolerated exposure, since standing open access is among the highest-impact risks. Policy claiming control against practice allowing standing access is revealed appetite.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Individual accounts and strong authentication throughout, with remote access approved for each session and recorded.",
        "cautious": "Named accounts and multi-factor remote access, with a few shared or standing accounts kept under control.",
        "open": "Shared accounts are common, and some suppliers have standing remote access.",
        "tolerant": "Default or long-unchanged shared passwords, and remote access that is always on and unrecorded."
      }
    },
    {
      "id": "TECH5",
      "code": "TECH.5",
      "sectionId": "TECH",
      "title": "Backup and recovery reality",
      "stateSummary": "Whether recovery capability matches the organisation's stated resilience posture.",
      "interviewPrompt": "Are OT backups (including controller logic/config) real, protected and tested-restorable? Gap between claimed and actual resilience is revealed appetite.",
      "rationale": "Recovery capability is where resilience claims meet reality: untested or unprotected backups mean the organisation is accepting far more consequence risk than its stated posture implies. The gap between claimed and demonstrable recovery is revealed appetite.",
      "evidenceNote": "",
      "assessorRecords": "characterisation (free text) + contribution to the section's band",
      "bandAnchors": {
        "averse": "Configurations and critical data are backed up offline, and restores are tested against an agreed recovery time.",
        "cautious": "Regular backups exist and a restore has been tested at least once, though not for every system.",
        "open": "Backups are taken, but no restore has ever been tested and no recovery time is agreed.",
        "tolerant": "Backups are ad hoc or missing, or kept where a compromise would also reach them, and nobody has tried a restore."
      }
    }
  ],
  "output": {
    "primary": "narrative",
    "narrative": "Prose characterising (1) the organisation's inherent exposure and why, (2) its apparent appetite and what reveals it, (3) the coherence between them (aligned, under-protected, or over-invested) as the headline, and (4) where the technical layer is used, any stated-vs-revealed gap. Written as a board-facing basis for a conscious risk-acceptance conversation.",
    "visual": {
      "primary": "exposure-vs-appetite-plot",
      "spec": "Two-axis plot: inherent exposure (limited->severe) on one axis, apparent appetite (averse->tolerant) on the other. Organisation placed as a point. Diagonal = coherence. Point below the coherence line (appetite more tolerant than exposure warrants) = under-protected, highlighted as the key finding; above = over-invested. This single chart is the report headline.",
      "secondary": "Optional stated-vs-revealed marker: plot both the interview-derived and technical-derived appetite positions to show the gap."
    }
  },
  "_contentNote": "6 exposure + 7 appetite + 5 optional technical items, each with an interview prompt and a rationale. Coherence scoring (risk-appetite-coherence), narrative + exposure-vs-appetite visual. Assessor-led with sector baselines and prompts. Draft bands/baselines are a tunable house scaffold for the consultant to evaluate and adjust.",
  "_relatedWork": "Sibling to the OT posture/health-check screener in look, feel and high-level assessor-led character - but a different scoring model (coherence, not a better-is-higher grade). Sits in the screeners family."
};
