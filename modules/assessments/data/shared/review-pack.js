/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/shared/review-pack.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
window.App.Data.contracts = window.App.Data.contracts || {};
window.App.Data.contracts.reviewPack = {
  "schema": "spt-review-pack/1.0",
  "_note": "What an author sends for review. The assessment tool and the risk tool WRITE it (Send for review); the report review tool READS it. It holds the text the client will receive, read back from the generated Word file, and the engagement behind it, so a reviewer can challenge a finding as well as its wording. A pack contains client data: handle it like the project file. Each tool carries its own copy of this contract; bump the schema string here when the shape changes, so that a mismatch fails loudly. Importers ACCEPT the listed schemas and reject unknown ones with a clear message.",
  "acceptedSchemas": ["spt-review-pack/1.0"],
  "shape": {
    "schema": "spt-review-pack/1.0",
    "packId": "unique id of this pack; a review file names the pack it answers",
    "reviewId": "unique id of the review as a whole, the same on every round of one assessment",
    "round": "1, 2, 3...: goes up when the content or the round has moved on",
    "createdAt": "ISO date and time",
    "sourceTool": { "product": "OT Cyber Assessment Tool", "version": "0.5.1" },
    "engagement": {
      "client": "customer name, as printed",
      "site": "site name",
      "consultant": "author of the report",
      "instrumentId": "iec-62443-3-3; risk tool: risk-assessment",
      "instrumentTitle": "title of the framework",
      "scoringFamily": "capability-sl, caf-achieved, domain-letter, program-maturity-ml, nis2-conformance, csms-conformance, risk-appetite-coherence; risk tool: risk-assessment",
      "targetLabel": "what one target is called: Zone, Site, Product...",
      "documentControl": { "documentRevision": "", "qaReviewBy": "", "authorisedBy": "", "issuedTo": "", "issuedDate": "", "confidentiality": "" }
    },
    "documents": [{
      "title": "the report's name, shown to the reviewer",
      "targetName": "the target this document covers, or empty for a document covering all of them",
      "contentHash": "hash of the client's text (App.DocxBlocks.contentHash), leaving out the cover and the document control fields that change on issue",
      "media": { "image1.png": "data:image/png;base64,..." },
      "blocks": [
        { "id": "d0-b1", "type": "heading", "level": 1, "text": "Executive summary", "runs": [{ "t": "Executive summary", "b": false, "i": false, "red": false }], "red": false, "front": false, "sectionKey": "executive-summary", "sectionTitle": "Executive summary" },
        { "id": "d0-b2", "type": "paragraph", "text": "...", "runs": [], "red": false, "front": false, "sectionKey": "executive-summary", "sectionTitle": "Executive summary" },
        { "id": "d0-b3", "type": "bullet", "marker": "•", "markerText": "•  ", "text": "...", "runs": [], "red": false, "front": false, "sectionKey": "", "sectionTitle": "" },
        { "id": "d0-b4", "type": "table", "text": "all cell text", "red": false, "rows": [{ "cells": [{ "blocks": [{ "type": "paragraph", "text": "", "runs": [], "red": false }], "text": "", "red": false, "fill": "E5F1EA", "span": 2 }] }], "front": false, "sectionKey": "", "sectionTitle": "" },
        { "id": "d0-b5", "type": "image", "media": "image1.png", "width": 380, "height": 380, "front": false, "sectionKey": "", "sectionTitle": "" }
      ]
    }],
    "items": [{
      "targetName": "zone, site or product name",
      "itemId": "requirement id in the instrument",
      "code": "SR 1.1",
      "title": "requirement title",
      "groupName": "FR, principle, domain or category name",
      "answer": "the answer as a label: Partially achieved, SL 1, Not answered",
      "expected": "target or expected level, where the instrument has one",
      "evidence": "recorded evidence",
      "notes": "recorded notes",
      "owner": "plan owner",
      "action": "recommended action",
      "impact": "business impact",
      "priority": "priority band, if set",
      "status": "finding | met | recorded | to-assess | unanswered | na",
      "shared": "true when the answer comes from the system-wide layer rather than this target"
    }],
    "basisOfAssessment": { "interviews": [{ "name": "", "role": "", "date": "" }], "documents": [{ "title": "", "reference": "", "date": "" }], "observations": [{ "name": "", "method": "" }] },
    "facts": {
      "perTarget": [{ "targetName": "", "roadmapEntries": 0, "findings": 0, "met": 0, "recorded": 0, "toAssess": 0, "unanswered": 0, "na": 0, "groups": [{ "groupName": "", "findings": 0, "met": 0, "recorded": 0, "toAssess": 0, "unanswered": 0, "na": 0 }] }]
    },
    "previousRound": {
      "comments": [{ "comment": "a comment as in spt-review/1.0", "status": "open | resolved | wontchange", "reason": "why it will not change", "replies": [{ "id": "", "author": "", "at": "", "text": "" }], "round": 1, "confirmedBy": ["names of reviewers who confirmed the fix"] }],
      "verdicts": [{ "reviewer": "", "round": 1, "value": "approved", "date": "", "note": "" }]
    }
  },
  "example": {
    "schema": "spt-review-pack/1.0",
    "packId": "rp-m1a2b3-7fkq",
    "reviewId": "rv-m1a2b3-2xmw",
    "round": 1,
    "createdAt": "2026-11-06T10:00:00.000Z",
    "sourceTool": { "product": "OT Cyber Assessment Tool", "version": "0.5.1" },
    "engagement": {
      "client": "Example Water Ltd", "site": "Works 1", "consultant": "A. Author",
      "instrumentId": "ncsc-caf", "instrumentTitle": "NCSC Cyber Assessment Framework", "scoringFamily": "caf-achieved", "targetLabel": "Site",
      "documentControl": { "documentRevision": "0.2", "qaReviewBy": "", "authorisedBy": "", "issuedTo": "", "issuedDate": "", "confidentiality": "Confidential" }
    },
    "documents": [{
      "title": "Works 1", "targetName": "Works 1", "contentHash": "h1:1f2e3d", "media": {},
      "blocks": [
        { "id": "d0-b1", "type": "heading", "level": 1, "text": "Executive summary", "runs": [{ "t": "Executive summary", "b": false, "i": false, "red": false }], "red": false, "front": false, "sectionKey": "executive-summary", "sectionTitle": "Executive summary" }
      ]
    }],
    "items": [],
    "basisOfAssessment": { "interviews": [], "documents": [], "observations": [] },
    "facts": { "perTarget": [] },
    "previousRound": { "comments": [], "verdicts": [] }
  }
};
