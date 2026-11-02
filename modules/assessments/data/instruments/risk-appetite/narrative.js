/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/instruments/risk-appetite/narrative.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.instruments = window.App.Data.instruments || {};
window.App.Data.instruments["risk-appetite"] = window.App.Data.instruments["risk-appetite"] || {};
window.App.Data.instruments["risk-appetite"].narrative = {
  "_note": "Narrative for the OT Risk Appetite and Exposure assessment. Boilerplate is inserted as written. The executive summary is composed by filling slots in the templates, never by free writing. There is no grade anywhere in this instrument, so nothing here refers to a score, a percentage or a better end of either scale. Client-facing text never describes how a position was arrived at inside the tool: every band and the verdict are presented as the assessor's own judgement. House style for this pack: plain UK English for a board reader, no em-dashes, and no hyphen used as a dash.",

  "boilerplate": {
    "report_intro": "This report sets out how much cyber risk {clientName} faces, how much it appears willing to accept, and whether the two fit. It is written for the board and senior leadership, and draws on interviews across governance, operations and engineering, the documents provided and what could be seen during the engagement. The item-by-item record is in the companion workbook.",

    "about_instrument": "Two positions are assessed separately: the inherent exposure {clientShort} faces, which is largely outside its control, and the appetite for cyber risk it shows in practice, which is a matter of choice. The verdict describes how well the two fit.",

    "series_context": "This is not an assessment against a published standard, though it draws on how NIST SP 800-82 and the NIST Cybersecurity Framework frame risk, on the consequence-led approach of ISA/IEC 62443-3-2 and on the risk appetite terms of ISO 31000. Like the OT posture and supplier screeners, it is a short, interview-led read, and it often helps decide which detailed assessment is worth commissioning next.",

    "bands_source": "The band definitions and the sector baselines are SolutionsPT starting points, informed by the sources above. Every band in this report, and the verdict itself, is the assessor's own judgement.",

    "how_to_read": "Exposure is placed on four bands from limited to severe, and appetite on four from averse to tolerant. Neither end of either scale is the good one, because an averse appetite or a tolerant one is only right or wrong for a particular exposure. Exposure is set by the worst of its readings, since an organisation is exposed to its worst credible consequence, while appetite is weighed across its readings as an overall posture. The more an organisation faces, the less it can sensibly accept, so severe exposure calls for an averse appetite and limited exposure can carry a tolerant one. The chart draws that relationship as a dashed line and plots {clientShort} against it. An appetite two or more bands more tolerant than the exposure warrants is under-protected, two or more bands more cautious is over-invested, and anything closer is aligned. An aligned position exactly one band off is reported as leaning towards under-protection or over-investment. The verdict describes fit and is not a score, so it should not be used to compare one organisation with another.",

    "chart_note": "The dashed line marks where appetite and exposure are in proportion. In the shaded area, more risk is being accepted than the exposure warrants.",

    "method": "The assessment is based on interviews with board members, senior leaders and the people who run and maintain the operational systems at {clientShort}, together with the documents provided and what could be seen on site. [Consultant to confirm or adjust this description so it matches how the engagement was run.]",

    "method_technical": "The assessor also looked at how systems are patched, segmented, monitored, accessed and recovered, so that the appetite described in interview could be checked against the appetite the systems themselves reveal.",

    "limitations": "This is a point-in-time read, based on what people said and what could be seen in the time available. A borderline item could reasonably be placed one band either side. The report does not test controls in depth; that needs a detailed assessment against a standard such as ISA/IEC 62443. Exposure in particular can change quickly, so it should be looked at again if {clientShort}'s circumstances or the threats it faces change.",

    "not_measurement_caveat_title": "A characterisation, not a measurement",

    "not_measurement_caveat": "This is a professional characterisation of exposure and appetite. It is not a measurement, a conformance assessment against any standard or a regulatory determination. It is meant to help {clientShort}'s board decide, on the record, how much cyber risk it is prepared to carry."
  },

  "executiveSummary": {
    "_note": "Composed by slot filling only. Order: the verdict, how each position was reached, what the technical review showed (where included), the assessor's reasoning (where recorded), why fit matters for this verdict, the consultant's own context paragraph, the decision for the board, coverage, and what this is not. Slots: clientName (first mention), clientShort (every mention after), exposureBand, appetiteBand, warrantedBand, statedBand, revealedBand, sectorName, answeredCount, totalCount, techClause, rationale.",

    "templates": {
      "exec_verdict_under-protected": "{clientShort} is carrying more cyber risk than its exposure warrants. Its exposure is {exposureBand}, and an organisation in that position would normally hold {aWarrantedBand} appetite. {appetiteSentence}",
      "exec_verdict_over-invested": "{clientShort} is more cautious about cyber risk than its exposure requires. Its exposure is {exposureBand}, which would normally sit with {aWarrantedBand} appetite. {appetiteSentence} The board may intend exactly that, so the point to confirm is whether the caution is a choice or a habit.",
      "exec_verdict_aligned": "{clientShort}'s appetite for cyber risk is in proportion to the exposure it faces. Its exposure is {exposureBand}. {appetiteSentence}",

      "exec_appetite_single": "Its appetite reads as {appetiteBand}.",
      "exec_appetite_revealed_looser": "Its leadership describes {aStatedBand} appetite, but its systems reveal {aRevealedBand} one, so in practice {clientShort} accepts more risk than its leadership believes.",
      "exec_appetite_revealed_tighter": "Its leadership describes {aStatedBand} appetite, but in practice its systems show a tighter, {revealedBand} one.",
      "exec_appetite_revealed_match": "Its appetite reads as {appetiteBand}, and its systems bear that out.",
      "exec_either_reading": "On either reading, {clientShort} is {verdictLower}.",

      "exec_exposure_drivers": "The {exposureBand} rating is set by {driverList}. {lowerClause}. Exposure follows its highest reading, not an average, so {lowerRef} not pull the rating down.",
      "exec_verdict_incomplete": "Too little was characterised at {clientShort} to say how well exposure and appetite fit.",

      "exec_exposure": "The exposure position takes account of the sector ({sectorName}), how critical {clientShort}'s services are, who is likely to target it and what a compromise would cause.",
      "exec_exposure_nosector": "The exposure position takes account of how critical {clientShort}'s services are, who is likely to target it and what a compromise would cause.",
      "exec_appetite": "The appetite position is drawn from how the board oversees cyber risk, what it funds, how quickly findings are dealt with, which risks it has knowingly accepted and how it responded to past incidents.",

      "exec_revealed_looser_material": "The appetite described in interview was {statedBand}, but the systems themselves point to {revealedBand}.",
      "exec_revealed_looser_minor": "The technical review broadly supports what was described, though the systems lean a little more tolerant ({revealedBand}) than the appetite set out in interview ({statedBand}).",
      "exec_revealed_tighter": "The appetite described in interview was {statedBand}, but the systems point to a tighter, {revealedBand} position, so practice is ahead of what leadership describes. Writing that practice into policy would stop it depending on the people who currently do the work.",
      "exec_revealed_match": "The technical review bears out the appetite described in interview, with the systems pointing to the same {revealedBand} position.",

      "exec_coverage": "{answeredCount} of the {totalCount} areas in scope were characterised{techClause}.",
      "exec_coverage_all": "All {totalCount} areas in scope were characterised{techClause}.",
      "exec_coverage_not_established": "{countWord} could not be established and {isAre} reported as such.",
      "exec_coverage_tech_included": ", including the technical review",
      "exec_coverage_tech_excluded": "The optional technical review was not part of this engagement."
    },

    "boilerplate": {
      "exec_fit_method": "In practice, a board that is comfortable carrying risk is not doing anything wrong if its exposure is limited, and a cautious board facing limited exposure may simply be spending more than it needs to.",

      "stakes_under-protected": "Under-protection usually builds up gradually, through deferred projects, exceptions that never expire and risks nobody formally accepted. The danger is that the board believes it has chosen to carry this risk when it has not, and learns otherwise from an incident.",
      "stakes_over-invested": "Over-investment is the less serious finding. Its cost is the money, time and operational flexibility spent on protection beyond what the exposure calls for, which could do more good elsewhere.",
      "stakes_aligned": "An aligned position still needs looking after. Exposure moves with the threat picture and with changes to {clientShort} itself, and appetite drifts when budgets tighten or projects slip. This read is most useful as a baseline to check future ones against.",

      "not_determination": "This characterisation is the assessor's professional judgement of what was said and seen during the engagement. It is not a conformance assessment or a regulatory determination, and it does not rule on whether the organisation's appetite is correct, which is for the board to decide."
    },

    "consultantBlocks": {
      "consultant_context_placeholder": "[Consultant to add a short note on what this means for {clientShort} in particular: the services and people that depend on it, the regulatory or commercial pressures on it, and anything that sets its situation apart from others in its sector.]",

      "consultant_decision_lead_under-protected": "The question for {clientShort}'s board is whether to accept the risk it is currently carrying, knowingly and on the record, or to fund bringing it back into line with its exposure.",
      "consultant_decision_lead_over-invested": "The question for {clientShort}'s board is whether its current level of caution is a deliberate choice worth what it costs, or effort that could be put to better use.",
      "consultant_decision_lead_aligned": "The task for {clientShort}'s board is to keep appetite and exposure in step as the threat picture and the organisation change.",
      "consultant_decision_placeholder": "[Consultant to set out the one or two decisions this board should take, in terms that fit {clientShort}.]"
    }
  },

  "item_phrases": {
    "_note": "How each item reads mid-sentence, for sentences that name items. Titles such as 'Regulatory and obligation weight' do not survive being lowercased into a list. exposure_driver_priority is the order drivers are named in, consequence first, since exposure follows the worst credible consequence.",
    "EXP1": "the criticality of its services",
    "EXP2": "who is likely to target it",
    "EXP3": "geopolitical exposure",
    "EXP4": "the consequence of a compromise",
    "EXP5": "regulatory weight",
    "EXP6": "its connections with suppliers and other organisations",
    "APP1": "board attention to cyber risk",
    "APP2": "how security is funded",
    "APP3": "how quickly findings are fixed",
    "APP4": "how risk gets accepted",
    "APP5": "the trade-off between operations and security",
    "APP6": "how cyber features in safety",
    "APP7": "the response to past incidents",
    "TECH1": "patching",
    "TECH2": "network segmentation",
    "TECH3": "monitoring",
    "TECH4": "access control",
    "TECH5": "backup and recovery"
  },

  "not_established": {
    "_note": "Readings the assessor could not establish. They are left out of the band rather than guessed, and said out loud here. {countWord} is a number in words; {itemList} names the items. The appetite wording treats not knowing as a finding; the exposure wording treats it as lower confidence, because an unknown threat picture is a gap in information rather than in governance.",
    "exposure_one": "One exposure reading could not be established: {itemList}. It is left out of the rating, so the exposure position rests on the other readings and should be revisited once it is known.",
    "exposure_many": "{countWord} exposure readings could not be established: {itemList}. They are left out of the rating, so the exposure position rests on the other readings and should be revisited once they are known.",
    "appetite_one": "One appetite reading could not be established, because nobody interviewed could give a clear account of {itemList}. That is itself a finding, since it suggests nobody is actively deciding it.",
    "appetite_many": "{countWord} appetite readings could not be established, because nobody interviewed could give a clear account of {itemList}. That is itself a finding, since it suggests nobody is actively deciding them.",
    "technical_one": "One technical reading could not be established during the engagement ({itemList}) and is not counted.",
    "technical_many": "{countWord} technical readings could not be established during the engagement ({itemList}) and are not counted."
  },
  "exposure_driver_priority": ["EXP4", "EXP6", "EXP1", "EXP2", "EXP5", "EXP3"],

  "item_spotlight": {
    "_note": "Single appetite readings that matter more than their weight in the section. Used when the item reads more tolerant than the appetite section as a whole. 'drift' applies where the verdict is under-protected or the systems reveal a looser appetite than was described; 'no_drift' otherwise. The '_shared' forms are used when other appetite readings sit at the same band as the item, so the summary names them all; {otherItems} lists them.",
    "APP4": {
      "drift": "How risk gets accepted is rated {itemBand}, against {sectionBand} for appetite overall, and it is the main cause of the drift. Because nothing requires a recorded decision to accept a risk, risks are accepted without one, and the appetite applied in practice moves away from the one the board intends.",
      "no_drift": "How risk gets accepted is rated {itemBand}, more tolerant than appetite overall, which reads {sectionBand}. Informal acceptance is the usual way appetite starts to drift, so it is worth tightening while the overall position is still in proportion.",
      "drift_shared": "How risk gets accepted and {otherItems} are rated {itemBand}, against {sectionBand} for appetite overall, and between them they are the main cause of the drift. Because nothing requires a recorded decision to accept a risk, risks are accepted without one, and the appetite applied in practice moves away from the one the board intends.",
      "no_drift_shared": "How risk gets accepted and {otherItems} are rated {itemBand}, more tolerant than appetite overall, which reads {sectionBand}. Informal acceptance is the usual way appetite starts to drift, so these are worth tightening while the overall position is still in proportion.",
      "not_established": "Nobody interviewed could say how risk gets accepted at {clientShort}, or who signs it off, and that is the finding. Without a deliberate way to accept risk, appetite drifts by default, usually unnoticed until something goes wrong."
    }
  },

  "revealed_notes": {
    "_note": "Technical readings the assessor judged to be managed constraints, or could not establish, are reported but not counted as appetite. These sentences say so wherever the technical readings are shown. {countWord} is a number in words.",
    "constrained_one": "One of the technical readings reflects a genuine operational constraint that is being managed, such as firmware held back by a vendor's certification with compensating measures in place. It is shown here but not counted as appetite, because {clientShort} did not choose it.",
    "constrained_many": "{countWord} of the technical readings reflect genuine operational constraints that are being managed, such as firmware held back by a vendor's certification with compensating measures in place. They are shown here but not counted as appetite, because {clientShort} did not choose them.",
    "none_counted": "None of the technical readings could be counted as appetite, so there is no revealed reading to set against the one described in interview.",
    "treated_as": {
      "accepted": "Appetite",
      "constrained": "Managed constraint",
      "unknown": "Not established"
    }
  },

  "progress": {
    "_note": "Comparison with a previous assessment. Neither scale has a good end, so an item moving is described, never judged: the only direction that means anything is whether the organisation is closer to proportion than it was. Verdicts and bands go in lower case mid-sentence.",
    "heading": "Change since the previous assessment",
    "intro": "The results were compared with the previous assessment ({sourceLine}).",
    "verdict_line": "At the previous assessment the verdict was {prevVerdict}, with {prevExposure} exposure and {aPrevAppetite} appetite. It is now {currVerdict}, with {currExposure} exposure and {aCurrAppetite} appetite.",
    "direction_closer": "{clientShort} has moved closer to proportion, with its appetite now nearer to what its exposure warrants.",
    "direction_further": "{clientShort} has moved further from proportion, with its appetite now further from what its exposure warrants.",
    "direction_same": "{clientShort} sits the same distance from proportion as it did at the previous assessment.",
    "moved_many": "{countWord} readings moved between the two assessments. No single move is better or worse in itself; the change in fit described above is what to judge by.",
    "moved_one": "One reading moved between the two assessments. The move is neither better nor worse in itself; the change in fit described above is what to judge by.",
    "moved_none": "No reading moved between the two assessments.",
    "chart_note": "The hollow marker shows where {clientShort} sat at the previous assessment, and the arrow shows how its position has moved since."
  },

  "verdict_narrative": {
    "_note": "What each verdict means, for the client. The scoring profile carries its own wording of these rules, written for whoever maintains the scoring; that text is not for a board and is not printed.",
    "explanation_aligned": "{clientShort} is accepting risk roughly in line with what it faces. Alignment says nothing about how good its security is: a severe-exposure organisation that is suitably averse is aligned, and so is a limited-exposure organisation that is comfortable carrying risk.",
    "explanation_under-protected": "{clientShort} is accepting materially more risk than its exposure justifies.",
    "explanation_over-invested": "{clientShort} may be spending money, or constraining its operations, beyond what its exposure calls for. This is far less serious than under-protection, but still worth raising.",
    "plain_terms_under-protected": "An organisation facing {exposureBand} exposure would normally hold {aWarrantedBand} appetite, and {clientShort} reads as {appetiteBand}. A gap of that size usually opens up gradually, without anyone deciding on it, which is why it now needs an explicit decision.",
    "plain_terms_over-invested": "{clientShort} is more cautious than its exposure requires. The board may well intend that, but it should confirm that the caution is deliberate and that the effort would not do more good elsewhere.",
    "plain_terms_aligned": "",
    "lean_under-protected": "Even so, {aAppetiteBand} appetite is one band more tolerant than the {warrantedBand} one that {exposureBand} exposure calls for, so a little further drift towards tolerance would leave {clientShort} under-protected.",
    "lean_over-invested": "Even so, {aAppetiteBand} appetite is one band more cautious than the {warrantedBand} one that {exposureBand} exposure calls for. That is no concern in itself, provided the extra caution is deliberate.",
    "reasoning_label": "Assessor's reasoning: ",
    "reasoning_missing": "The reasoning behind this verdict has not been recorded yet."
  },

  "next_steps_scaffold": {
    "_note": "The first draft of Proposed next steps, chosen by verdict. Lines in [brackets] are prompts the consultant replaces, and print in red until they do.",
    "under-protected": [
      "Put the gap between exposure and appetite to the board as a decision: either accept the current level of risk explicitly, with an owner and a review date, or fund the work to close it.",
      "Commission a detailed assessment of the systems that carry the most consequence, so that the decision is taken against specific, costed work.",
      "[Add the improvements agreed during the engagement that need no capital spend, with owners and dates.]",
      "Record any risk the board chooses to carry as a dated acceptance with an expiry, not as a deferred remediation date.",
      "Look at this characterisation again in twelve months, or sooner if the threat picture or {clientShort}'s circumstances change."
    ],
    "over-invested": [
      "Review with the board whether the current level of caution is a deliberate choice, and record the reasoning if it is.",
      "Identify controls or operational constraints that cost more than the exposure justifies, and consider whether that effort would do more good elsewhere.",
      "[Add any areas agreed during the engagement where effort could be released or redirected.]",
      "Look at this characterisation again in twelve months, or sooner if the threat picture or {clientShort}'s circumstances change."
    ],
    "aligned": [
      "Record the current exposure and appetite positions as {clientShort}'s agreed baseline, with the board as their owner.",
      "Agree what should prompt a fresh look before the next review, for example new regulation, a serious incident elsewhere in the sector or a major change to operations.",
      "[Add any individual areas raised during the engagement that still need attention, with owners and dates.]",
      "Look at this characterisation again in twelve months to confirm the two positions are still in step."
    ],
    "incomplete": [
      "[Complete the characterisation of both exposure and appetite so that a verdict can be reported.]"
    ]
  }
};
