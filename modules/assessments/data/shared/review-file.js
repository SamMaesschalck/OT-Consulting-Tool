/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/review-file.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.contracts = window.App.Data.contracts || {};
window.App.Data.contracts.reviewFile = {
  "schema": "spt-review/1.0",
  "_note": "What a reviewer sends back. The report review tool WRITES it, one small file per reviewer; the assessment tool and the risk tool READ it. Files are merged by comment id, so reviewers can never overwrite each other, and importing a file twice changes nothing. Where the same comment arrives again, the reviewer's later save wins. The author's status, reason and replies are kept on the author's side and are never overwritten by an import. Each tool carries its own copy of this contract; bump the schema string here when the shape changes, so that a mismatch fails loudly. Importers ACCEPT the listed schemas and reject unknown ones with a clear message.",
  "_optional": "Within spt-review/1.0 these fields are OPTIONAL and additive, so a file without them imports exactly as before: checklistTotal, dismissedCheckTitles, anchor.targetId (on item comments, and on comments made from an automatic check on an item), anchor.media, anchor.rowKey and anchor.colHead (on a comment on a table cell), and replies (the reviewer's replies on earlier comments). A raised-again comment (relatesTo set) is anchored to where the text is now, not where it was, and may carry suggested wording.",
  "acceptedSchemas": ["spt-review/1.0"],
  "shape": {
    "schema": "spt-review/1.0",
    "packId": "the pack this file answers",
    "reviewId": "the review it belongs to",
    "round": 1,
    "fileId": "unique id of this reviewer's file, the same on each save, so two reviewers with one name never merge into one",
    "reviewer": "reviewer's name",
    "savedAt": "ISO date and time of this save",
    "savedBy": { "product": "OT Cyber Report Review Tool", "version": "0.5.1" },
    "verdict": { "value": "none | approved | approved-with-comments | changes-requested", "date": "YYYY-MM-DD", "note": "" },
    "checklist": [{ "id": "common-evidence", "text": "the question as asked", "answer": "yes | no | na, or empty if not answered", "note": "" }],
    "checklistTotal": "OPTIONAL. How many checklist questions the reviewer was asked when this was saved (after the checklist skip list for this instrument), so the author can see \"7 of 9 answered\"; checklist holds only the questions the reviewer touched",
    "dismissedChecks": ["ids of automatic check results the reviewer dismissed"],
    "dismissedCheckTitles": "OPTIONAL. { check result id: what the check said, as the reviewer saw it }, for each dismissed check, so the author can read what was dismissed without the check engine. The review tool writes \"<check title> (in <section>[ - <report>]): <what it said>\"",
    "confirmations": [{ "commentId": "a previous round comment the reviewer confirmed as fixed", "at": "ISO date and time" }],
    "replies": [{
      "id": "OPTIONAL list. Globally unique, generated, and the same on each save, so importing the file again changes nothing",
      "to": "the id of the earlier-round comment (in the pack's previousRound.comments) this reply is on",
      "text": "the reply. Its author is this file's reviewer. A later save with other text updates it; a reply no longer in the reviewer's latest file is removed on import",
      "at": "ISO date and time"
    }],
    "comments": [{
      "id": "globally unique, generated",
      "reviewer": "reviewer's name",
      "createdAt": "ISO date and time",
      "updatedAt": "ISO date and time",
      "severity": "must-fix | should-fix | suggestion",
      "anchor": {
        "documentIndex": 0,
        "documentTitle": "the document's name, for showing",
        "kind": "block | item | general",
        "sectionKey": "slug of the generated heading, as App.Report.sectionKey",
        "sectionTitle": "the heading as printed",
        "blockId": "d0-b12",
        "blockType": "heading, paragraph, bullet, table or image",
        "quote": "the text the comment is on: the whole block or cell, which is what a later round matches on; empty for an image",
        "selection": "the words selected, when the reviewer selected some, or absent",
        "cell": "{ row, col } when the comment is on one cell of a table, otherwise null",
        "rowKey": "OPTIONAL. For a comment on a table cell, the text of the first cell in its row, so the cell can be found again when rows are added or removed above it",
        "colHead": "OPTIONAL. For a comment on a table cell, the text of the header cell of its column",
        "targetName": "for an item comment, the target; for a block comment, the document's target",
        "targetId": "OPTIONAL. The pack item's targetId, when the pack gave one. Matched by targetId when both sides have it, otherwise by targetName",
        "media": "OPTIONAL. For a comment on an image, the image's media key in the pack (documents[].media), so it can be found again in a later round",
        "itemId": "for an item comment",
        "code": "for an item comment, the item's code",
        "itemTitle": "for an item comment, the item's title",
        "groupName": "for an item comment, the item's group",
        "field": "for a suggestion on an item: evidence | notes | owner | action | impact (the pack's engagement.fieldLabels says what to call it)"
      },
      "text": "the comment",
      "suggestion": "suggested wording, or null",
      "relatesTo": "the previous round comment this one raises again, or null. Its anchor is where that text is now: the same wording found in the current pack, else the nearest match in the same section, else the section heading with an empty quote",
      "check": "the automatic check it came from, or null"
    }]
  },
  "example": {
    "schema": "spt-review/1.0",
    "packId": "rp-m1a2b3-7fkq",
    "reviewId": "rv-m1a2b3-2xmw",
    "round": 1,
    "fileId": "rf-m1a2b3-5tqz",
    "reviewer": "J. Reviewer",
    "savedAt": "2026-11-07T15:30:00.000Z",
    "savedBy": { "product": "OT Cyber Report Review Tool", "version": "0.5.1" },
    "verdict": { "value": "changes-requested", "date": "2026-11-07", "note": "One finding needs more evidence." },
    "checklist": [{ "id": "common-evidence", "text": "The evidence supports the findings.", "answer": "no", "note": "See the access control finding." }],
    "checklistTotal": 9,
    "dismissedChecks": [],
    "dismissedCheckTitles": {},
    "confirmations": [],
    "comments": [{
      "id": "c-m1a2b3-9dk2f7",
      "reviewer": "J. Reviewer",
      "createdAt": "2026-11-07T15:10:00.000Z",
      "updatedAt": "2026-11-07T15:10:00.000Z",
      "severity": "must-fix",
      "anchor": { "documentIndex": 0, "documentTitle": "Works 1", "kind": "block", "sectionKey": "executive-summary", "sectionTitle": "Executive summary", "blockId": "d0-b2", "quote": "The site meets its target.", "cell": null, "targetName": "", "itemId": "", "field": "" },
      "text": "This does not match the roadmap.",
      "suggestion": "The site meets its target on five of seven requirements.",
      "relatesTo": null,
      "check": null
    }]
  }
};
