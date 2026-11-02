/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/scoring-profiles.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.shared = window.App.Data.shared || {};
window.App.Data.shared.scoringProfiles = window.App.Data.shared.scoringProfiles || {};
(function () {
  var data = {
  "profiles": [
    {
      "id": "sl-target-closeness",
      "title": "SL target-met and closeness (ISA/IEC 62443 capability)",
      "scale": {
        "min": 0,
        "max": 4,
        "labels": {
          "0": "No capability",
          "1": "SL 1",
          "2": "SL 2",
          "3": "SL 3",
          "4": "SL 4"
        }
      },
      "defaultTargetSL": 2,
      "partialCreditWeight": 0.5,
      "perRequirementScore": {
        "atOrAboveTarget": 1.0,
        "oneStepBelowTarget": 0.5,
        "twoOrMoreBelowTarget": 0.0,
        "zeroWhereTargetPositive": 0.0
      },
      "compensation": false,
      "naHandling": "exclude-from-denominator",
      "frAggregation": [
        "weakest-link-achieved-sl",
        "closeness-percent"
      ],
      "floorRules": [
        {
          "id": "sl0-where-target-positive",
          "when": "achievedSL == 0 AND targetSL > 0",
          "effect": "flag-and-cap"
        },
        {
          "id": "gap-ge-2",
          "when": "(targetSL - achievedSL) >= 2",
          "effect": "flag-and-cap"
        }
      ],
      "letterGrade": false,
      "headlineOutputs": [
        "overall-target-met",
        "weakest-fr",
        "floor-flag-count",
        "overall-closeness-percent-context-only"
      ]
    },
    {
      "id": "posture-domain-letter",
      "title": "Domain posture grade (A to F, mean of domains, capped near the weakest; A only if unanimous)",
      "scoringFamily": "domain-letter",
      "bandScale": {
        "min": 0,
        "max": 3
      },
      "perQuestionScore": "normalised = band / 3 (so 0, 0.33, 0.67, 1.0); scored questions only",
      "specialStates": {
        "unknown": "NOT scored on the capability scale (it is not a known-zero capability) and excluded from the domain mean. Band 0 remains the worst capability score; Unknown must never score below 0. Unknown instead costs the grade through coverage and a confidence flag, and is surfaced as a finding (see unknownHandling).",
        "na": "Excluded from BOTH the score and the coverage denominator. This is the only state fully discounted.",
        "context": "scored:false questions excluded from grading entirely."
      },
      "domainScore": "mean of normalised scores across answered scored questions in the domain",
      "domainCoverage": "answered scored questions / scorable questions (excluding NA)",
      "compensation": false,
      "letterBands": [
        {
          "grade": "A",
          "minScore": 0.85
        },
        {
          "grade": "B",
          "minScore": 0.7
        },
        {
          "grade": "C",
          "minScore": 0.55
        },
        {
          "grade": "D",
          "minScore": 0.4
        },
        {
          "grade": "E",
          "minScore": 0.25
        },
        {
          "grade": "F",
          "minScore": 0.0
        }
      ],
      "headline": "weighted mean of domain scores, capped relative to the weakest graded domain",
      "coverageThreshold": 0.6,
      "lowCoverageHandling": "A domain (or the overall grade) with coverage below the threshold is reported as indicative / insufficient-evidence and flagged, not presented as a confident grade.",
      "letterGrade": true,
      "indicativeCaveat": true,
      "thresholdsConfigurable": true,
      "headlineMethod": {
        "weightMode": "equal",
        "_weightMode_note": "equal = each graded domain weighted 1/n. To override, set 'domainWeights' as a map of domainId -> weight; weights are renormalised across graded domains.",
        "domainWeights": null,
        "step1": "Weighted mean of domain scores (0-1) across domains that meet the coverage threshold; map the result to a letter via letterBands.",
        "step2": "Cap: the headline grade may be at most 'capDistance' grades above the weakest GRADED domain's grade. If the weighted-mean grade exceeds that, pull it down to the cap.",
        "step3": "Top-grade ceiling: the best grade on the scale (A) is awarded only when EVERY graded domain reaches it; otherwise the headline is capped at the second-best grade. An A means uniformly excellent, never excellent on average.",
        "capDistance": 2,
        "_capDistance_note": "In grade steps on the A>B>C>D>E>F ladder. Default 2: the headline can sit at most two grades above the weakest graded domain, so an F anywhere caps the headline at D and an E anywhere caps it at C. Configurable.",
        "coverageHandling": "Domains below coverageThreshold are reported as insufficient-evidence and are EXCLUDED from the weighted mean and from the cap (you cannot floor on a domain you could not grade). They still count against overall coverage and the low-confidence flag.",
        "alwaysNameWeakest": true
      },
      "unknownHandling": {
        "_principle": "Unknown is a finding, not a free pass: not knowing whether a control exists is itself a visibility/governance weakness. But it is a CONFIDENCE problem, not a capability value, so it is not pushed onto the 0-3 scale. Where 'not knowing' is itself the substantive failure, the consultant scores that specific question low (band 0/1) on its merits; that is judgement on the question, not a global rule.",
        "inDomainMean": "excluded (same as before)",
        "countsAgainstCoverage": true,
        "perDomainUnknownCount": "Record and display the number of Unknown answers per domain and overall.",
        "confidenceFlag": {
          "_what": "A grade-level confidence qualifier driven by the share of Unknown answers among attempted (non-NA, non-context) scored questions.",
          "metric": "unknownRate = unknown / (unknown + answered)  [per domain and overall]",
          "levels": [
            {
              "label": "High confidence",
              "when": "unknownRate <= 0.10"
            },
            {
              "label": "Moderate confidence",
              "when": "unknownRate <= 0.30"
            },
            {
              "label": "Low confidence",
              "when": "unknownRate > 0.30"
            }
          ],
          "display": "Show alongside the letter, e.g. 'B, moderate confidence'. This is separate from the coverage/'indicative' state, which is about how much was attempted at all; confidence is about how much of what was attempted was actually known.",
          "configurableThresholds": true
        },
        "reportNarrative": "Where Unknowns are material, state it as a finding in the domain narrative, e.g. 'N of M answers in this domain were unknown, indicating the organisation cannot confirm the state of these controls.' Do not let Unknowns pass silently.",
        "headlineLeverageNote": "Because the weakest domain CAPS the headline, Unknown must NOT be given a sub-zero capability value: a single uncertain answer must not be able to tank a domain and drag the whole grade down with it. Unknown's effect is intentionally spread across coverage and confidence instead."
      },
      "bandFloorRule": "Band 0 (Not in place) is the lowest capability score. No state scores below 0. Honesty about a known gap must never be penalised more heavily than uncertainty."
    },
    {
      "id": "caf-achieved",
      "title": "CAF contributing-outcome state (native three-state, no roll-up grade)",
      "scoringFamily": "caf-achieved",
      "states": [
        "achieved",
        "partially",
        "not"
      ],
      "specialStates": {
        "unknown": "coverage + confidence, not a state; reuse posture Unknown handling",
        "na": "excluded from coverage"
      },
      "rollUp": "NONE. Do not compute a single letter or number for CAF. Report a PROFILE: count/percentage of outcomes Achieved / Partially / Not Achieved, by principle and by objective.",
      "compensation": false,
      "letterGrade": false,
      "consultantSetsState": true,
      "mappingRule": "OT-lens related SRs/controls may PRE-FILL evidence and notes from a completed 62443/800-82 assessment, but NEVER set the CAF state. The consultant always sets the state.",
      "coverageAndConfidence": "reuse posture-domain-letter coverage threshold and Unknown confidence flag",
      "output": "per-objective and per-principle profile, plus an evidence-based roadmap of every Partially/Not Achieved outcome",
      "profileOverlay": {
        "_what": "CAF assessments select a regulator profile (or General). The profile sets expectedState per outcome; the gap is actual state vs expectedState.",
        "default": "caf-general (expectedState = achieved for all outcomes)",
        "gap": "For each applicable outcome: meets target if actual state >= expectedState on the order not < partially < achieved. 'partially' meets an expected 'partially'; 'not' fails any positive expectation.",
        "applicability": "Outcomes the profile marks applicable=false drop out of the profile view entirely (not scored, not in denominator).",
        "weight": "Optional per-outcome weight/emphasis for reporting priority; does not create a single grade.",
        "reporting": "Report the outcome profile (Achieved/Partially/Not counts) AND, against the selected regulator profile, the count of outcomes meeting vs below expected, by objective and principle. The roadmap targets every outcome below its expected state.",
        "noGrade": "Still no single letter/number. The regulator profile changes the target line, not the reporting style."
      }
    },
    {
      "id": "csms-conformance",
      "title": "IEC 62443-2-1:2010 CSMS element conformance",
      "scoringFamily": "csms-conformance",
      "_note": "Per-element conformance state (e.g. in place / partially / not in place) and roll-up by element group, to be defined from 62443-2-1:2010. Reuse Unknown / coverage / confidence handling. Likely no single grade; report a conformance profile across element groups.",
      "consultantSetsState": true,
      "states": [
        {
          "value": "not-in-place",
          "label": "Not in place",
          "rank": 0,
          "scored": true
        },
        {
          "value": "partially",
          "label": "Partially in place",
          "rank": 1,
          "scored": true
        },
        {
          "value": "largely",
          "label": "Largely in place",
          "rank": 2,
          "scored": true
        },
        {
          "value": "in-place",
          "label": "In place",
          "rank": 3,
          "scored": true
        }
      ],
      "specialStates": {
        "unknown": "coverage + confidence, not scored (reuse posture handling)",
        "na": "excluded from score and coverage"
      },
      "perElement": "Consultant sets the conformance state per element. Not-in-place is a floor finding.",
      "rollUp": "Report a conformance profile per category and per element group (count of elements at each state). No single CSMS grade; weakest-area reporting names the lowest-conformance elements worst-first. No cross-element compensation.",
      "coverageAndConfidence": "reuse posture coverage threshold + Unknown confidence flag",
      "letterGrade": false
    },
    {
      "id": "cra-conformance",
      "title": "EU CRA layered conformance (in place / partially / not in place)",
      "scoringFamily": "csms-conformance",
      "_note": "Three-state conformance for the EU Cyber Resilience Act gap assessment. Reuses the csms-conformance family scorer but with the CRA's three scored states (no 'largely in place'). Each of the three CRA layers rolls up INDEPENDENTLY against this scale and the positions are presented side by side - never blended into one CRA score. Unknown = coverage/confidence signal; N/A excluded from score and coverage.",
      "consultantSetsState": true,
      "states": [
        {
          "value": "not-in-place",
          "label": "Not in place",
          "rank": 0,
          "scored": true
        },
        {
          "value": "partially",
          "label": "Partially in place",
          "rank": 1,
          "scored": true
        },
        {
          "value": "in-place",
          "label": "In place",
          "rank": 2,
          "scored": true
        }
      ],
      "specialStates": {
        "unknown": "coverage + confidence, not scored (reuse posture handling)",
        "na": "excluded from score and coverage"
      },
      "perElement": "Consultant sets the conformance state per requirement. Not-in-place is a floor finding.",
      "rollUp": "The three CRA layers each roll up independently (count of requirements at each state, plus a context-only conformance index). No single CRA score; the three positions are presented side by side.",
      "coverageAndConfidence": "reuse posture coverage threshold + Unknown confidence flag",
      "letterGrade": false
    },
    {
      "id": "program-maturity-ml",
      "title": "ISA/IEC 62443-2-1:2024 Security Program maturity (ML1-ML4)",
      "scoringFamily": "program-maturity-ml",
      "_note": "Per-SPR maturity level ML1-ML4, with anchors per level. Definitions of ML1-ML4 must be populated from 62443-2-1:2024 (do not assume CMMI-equivalent semantics). Domain / SPR-group roll-up TBD; no single grade unless the standard supports one. Reuse Unknown / coverage / confidence handling.",
      "bands": {
        "min": 1,
        "max": 4,
        "levels": [
          "ML1",
          "ML2",
          "ML3",
          "ML4"
        ]
      },
      "consultantSetsState": true,
      "maturityLevels": [
        {
          "id": "ML1",
          "name": "Initial",
          "value": 1
        },
        {
          "id": "ML2",
          "name": "Managed",
          "value": 2
        },
        {
          "id": "ML3",
          "name": "Defined / Practiced",
          "value": 3
        },
        {
          "id": "ML4",
          "name": "Improving",
          "value": 4
        }
      ],
      "perRequirement": "Consultant selects one value from the achieved scale. not-met is a floor finding. unknown -> coverage/confidence. na -> excluded.",
      "target": "OPTIONAL overlay, off by default. When enabled, per-requirement target ML; gap = target rank - achieved rank; not-met counts as rank 0. Targets from risk (62443-3-2), never a flat default.",
      "specialStates": {
        "unknown": "coverage + confidence, not scored (reuse posture handling)",
        "na": "excluded from score and coverage",
        "not-met": "counts as below ML1 for gap purposes; treat as a floor finding"
      },
      "rollUp": "Always: achieved profile (count at not-met/ML1/ML2/ML3/ML4) per theme and per SPE; mean rank per element for context only. With target overlay on: also met/below per requirement and element. No compensation; not-met and large gaps are floor findings.",
      "compensation": false,
      "letterGrade": false,
      "coverageAndConfidence": "reuse posture coverage threshold + Unknown confidence flag",
      "achievedScale": "Single ordered scale: not-met(0) < ML1(1) < ML2(2) < ML3(3) < ML4(4); plus unknown/na non-scoring. One selection per requirement."
    },
    {
      "id": "nis2-conformance",
      "title": "EU NIS2 conformance gap (achieved / partially / not)",
      "scoringFamily": "nis2-conformance",
      "_note": "Per-obligation conformance state set by the consultant: achieved | partially | not | unknown | na. The implicit target is full conformance (achieved) for every applicable obligation, so the gap is every Partially or Not Achieved item. No single grade or percentage is presented as a pass mark; results are a conformance profile by NIS2 area plus a gap roadmap. unknown reduces coverage and confidence; na is excluded. Reuse the posture coverage threshold and Unknown confidence flag. This is a gap analysis to support readiness, NOT a determination of legal compliance with NIS2 or its national transposition.",
      "consultantSetsState": true,
      "states": ["achieved", "partially", "not", "unknown", "na"],
      "target": "Full conformance (achieved) for every applicable obligation. No regulator profiles; the target is fixed.",
      "specialStates": {
        "unknown": "coverage + confidence, not scored (reuse posture handling)",
        "na": "excluded from score and coverage"
      },
      "rollUp": "Conformance profile (count at achieved / partially / not) per NIS2 area and overall; conformance = achieved / applicable, shown for context, never as a compliance pass mark. Gap roadmap = every applicable obligation that is Partially or Not Achieved.",
      "compensation": false,
      "letterGrade": false,
      "coverageAndConfidence": "reuse posture coverage threshold + Unknown confidence flag"
    },
    {
      "id": "risk-appetite-coherence",
      "title": "Risk appetite: exposure vs appetite coherence",
      "scoringFamily": "risk-appetite-coherence",
      "_note": "NOT a graded scale. Characterises two independent positions - inherent exposure and apparent appetite - each on a 4-band scale, then reads the COHERENCE between them. Neither axis is 'better' high or low; the finding is the fit. Assessor sets both positions (tool scaffolds, never decides).",
      "axes": {
        "exposure": {
          "label": "Inherent risk exposure",
          "rollUp": "worst",
          "_rollUp_note": "worst = the section suggestion is the HIGHEST item band. An organisation is exposed to its worst credible consequence, not to an average of its readings: a safety-of-life consequence is not diluted by a moderate regulatory reading. The assessor still sets the final band.",
          "bands": [
            "limited",
            "moderate",
            "high",
            "severe"
          ],
          "meaning": "What the organisation faces because of what it does and where it sits: its sector, how critical it is, the threat and geopolitical context, its regulatory obligations and how connected it is to others. Little of it is a matter of choice.",
          "bandDefinitions": {
            "limited": "Low criticality, little geopolitical or targeted-threat interest, limited interconnection or regulatory weight. Consequence of compromise is contained.",
            "moderate": "Some criticality or regulated status; exposed to commodity threats and opportunistic attack; consequence meaningful but not systemic.",
            "high": "Significant criticality (essential service, safety-relevant OT), plausible targeted interest, notable regulatory exposure; compromise has serious operational or safety consequence.",
            "severe": "Critical national infrastructure or equivalent, credible state-level or advanced-actor targeting, safety-critical consequence, heavy regulatory obligation. Compromise is systemic or life-safety."
          }
        },
        "appetite": {
          "label": "Apparent risk appetite",
          "rollUp": "mean",
          "_rollUp_note": "mean = the section suggestion is the rounded mean of the item bands. Appetite is an overall posture read across governance, funding and practice, so the readings are weighed together. The assessor still sets the final band.",
          "bands": [
            "averse",
            "cautious",
            "open",
            "tolerant"
          ],
          "meaning": "How much cyber risk the organisation appears willing to accept, revealed through investment, remediation urgency, governance attention and what it consciously tolerates. This is a matter of posture and choice, and no band is good or bad in itself: it is judged only against exposure.",
          "bandDefinitions": {
            "averse": "Strong aversion to accepting cyber risk: heavy investment, fast remediation, board-level attention, low tolerance for unmitigated findings.",
            "cautious": "Prefers to reduce risk where practical; reasonable investment and remediation; accepts residual risk deliberately and documents it.",
            "open": "Accepts a fair degree of risk for cost or operational convenience; slower remediation; security competes with other priorities.",
            "tolerant": "Accepts substantial cyber risk, often implicitly; low investment, slow or ad hoc remediation, limited governance attention; much risk accepted without conscious decision."
          }
        }
      },
      "coherenceRead": {
        "method": "Place exposure and appetite each on their 4-band scale (ordinal 1-4). The appetite an exposure WARRANTS is its mirror: the more an organisation faces, the less it should be willing to accept. On a 4-band scale severe exposure warrants an averse appetite, high warrants cautious, moderate warrants open, limited can carry tolerant - so warrantedAppetiteRank = (bands + 1) - exposureRank. Coherence is the distance from that mirror line: delta = appetiteRank - warrantedAppetiteRank = appetiteRank + exposureRank - (bands + 1). Read as fit, never as a grade. A nuclear station or CNI operator faces severe exposure and is ALIGNED when its appetite is correspondingly low; it is under-protected when its appetite is not. NOTE: this replaces an earlier wording of 'appetite rank minus exposure rank', which contradicted the band definitions and both worked examples below and would have scored severe exposure with a tolerant appetite as aligned - the exact finding this instrument exists to surface.",
        "aligned": "Appetite broadly matches what the exposure warrants (within one band of the mirror line). The posture is coherent: the organisation accepts risk roughly in line with what it faces. Coherent does not mean 'good': a severe-exposure organisation that is appropriately averse is aligned, and so is a limited-exposure organisation that is tolerant.",
        "under-protected": "Appetite is more tolerant than exposure warrants (2+ bands past the mirror line, i.e. accepting materially more risk than the profile justifies). This is the most common and most important finding: risk accepted without conscious decision. Named worst-first in the report.",
        "over-invested": "Appetite is more averse than exposure requires (2+ bands the other side of the mirror line). Possibly spending or constraining operations beyond what the risk justifies. Worth surfacing, though far less serious than under-protection."
      },
    "assessorOverride": {
        "_principle": "The band arithmetic is a scaffold, not the finding. The consultant has the FINAL say on whether an appetite is appropriate to the risks faced: there are circumstances a four-by-four grid cannot see - a compensating parent-group control, an imminent divestment, a site mid-migration, a regulator-agreed trajectory, a genuine and deliberate board decision to carry a risk with eyes open.",
        "canOverride": "The assessor may set the coherence verdict directly, to any of aligned / under-protected / over-invested, regardless of what the bands compute.",
        "requiresRationale": "An override must carry a recorded justification. The same hard rule as the sector baselines: a judgement that departs from the scaffold is recorded with its reasoning, or it is not made.",
        "deliverablesShowJudgementOnly": "Client-facing outputs (Word, Excel, the report preview) present the verdict as the assessor's finding, with its reasoning. They MUST NOT say the assessor agreed or disagreed with a computed default, name the band arithmetic, or state what the tool would otherwise have concluded. The client is paying for the consultant's judgement, not for a commentary on a tool; exposing the scaffold invites an argument with software instead of a conversation about risk.",
        "reasoningIsTheValue": "The recorded reason IS professional content and belongs in the deliverable - 'group-level SOC and an agreed regulatory trajectory cover this' is the sort of sentence a client is paying to receive. It is presented as the reasoning behind the finding, never as a justification for departing from a default.",
        "traceStaysInternal": "The computed read is still kept on the result and shown on the assessor's-read capture page, which is the consultant's working surface, and it is saved in the project file for QA. Nothing is lost for review purposes; it simply does not reach the client's document.",
        "doesNotMoveBands": "An override changes the VERDICT only. The exposure and appetite positions stand as characterised; the plot still shows where the organisation actually sits."
      },
      "statedVsRevealed": {
        "_note": "Where the optional technical layer is used, compare the appetite the organisation STATES with the appetite its technical reality REVEALS (e.g. states 'cautious' but patching lag and flat network reveal 'tolerant'). The gap between stated and revealed appetite is itself a headline finding.",
        "reveals": "Technical evidence can shift the recorded appetite band or stand as an explicit stated-vs-revealed gap; the assessor decides."
      },
      "headline": "A described posture plus a coherence verdict (aligned / under-protected / over-invested) and, where technical layer used, a stated-vs-revealed note. Never a letter or percentage.",
      "indicativeCaveat": "This is an informed characterisation of exposure and appetite by expert judgement, not a measurement against a standard. Both positions are the assessor's professional read; the client should treat it as a basis for a conscious risk-acceptance conversation, not a determination.",
      "letterGrade": false,
      "consultantSetsState": true
    }
  ]
};
  var arr = (data && data.profiles) || [];
  for (var i = 0; i < arr.length; i++) {
    window.App.Data.shared.scoringProfiles[arr[i].id] = arr[i];
  }
}());
