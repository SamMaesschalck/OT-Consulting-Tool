/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
// AUTO-GENERATED from data/document.json - do not edit; edit the .json then re-run scripts/build-data.ps1
window.App = window.App || {};
window.App.Data = window.App.Data || {};
(window.App.Data.contracts = window.App.Data.contracts || {}).document = {
  "schema": "spt-document/1.0",
  "_note": "The OT Cyber Document Tool's own project file: one document in the house template, as blocks, with its pictures and anything carried over untouched from an imported Word file. The document tool WRITES and READS it; no other tool reads it in this version, so it is a file format rather than a hand-off between tools, kept here so its shape is versioned like the others and so shared/house-docx.js (which prints it) and shared/docx-import.js (which produces it) agree without calling each other. The suite routes a file to the document tool by this schema string. Bump the schema string when the shape changes, so that a mismatch fails loudly. The tool ACCEPTS the listed schemas and rejects unknown ones with a clear message. See docs/document-tool-design.md.",
  "_optional": "Within spt-document/1.0 these fields are OPTIONAL and additive, so a file without them opens exactly as before: info.reference, info.site, info.coverTitleLines, options, footnotes, parts, theme, importReport (and its front), and on blocks: land, align, caption, alt, label, restart, continue, and on table cells: span, rowSpan, fill, vAlign, pad; on tables: width, borders; on table rows: h, hRule; on runs: color, size; and a table inside a table cell. A reader fills every missing optional field with its default and drops unknown fields on blocks it knows; a block of an unknown type is kept as it is and printed as nothing, so a later version's file is not damaged by an earlier tool saving it.",
  "_limits": "Bytes are base64 in the file. A picture the user inserts is downscaled before it is stored (longest side at most 2400 px, at most 5 MB after that); pictures and parts read from an imported Word file are stored byte for byte and never reduced. Limits apply where bytes come in, never at Save: the tool warns when the pictures and kept content pass 100 MB and refuses an import, an insert or a paste that would take them past 150 MB (provisional until measured); a document already over the limit still saves.",
  "_inMemory": "The FILE form is what this contract's shape describes. In MEMORY the tool, shared/house-docx.js, shared/docx-graft.js and shared/docx-import.js all use one other form for bytes, and only for bytes: a media or parts entry has `blob` (a Blob) and no `data`. App.DocModel.fromText converts data to blob entry by entry and App.DocModel.toFile converts back; shared/docx-import.js returns the memory form directly. An entry whose bytes could not be restored from an autosave copy has blob null and missing true; that state is never written to a file as it is (the writer prints a red prompt in place of the block, so Final is refused). Shared code reads bytes with blob.arrayBuffer(), never fetch. media, parts and footnotes entries are never deleted while a document is open (so undo always finds them); toFile leaves out the ones nothing refers to.",
  "acceptedSchemas": ["spt-document/1.0"],
  "shape": {
    "schema": "spt-document/1.0",
    "id": "unique id of this document, generated once and kept (doc-<time>-<random>); the autosave copy and the remembered file handle are keyed by it",
    "createdAt": "ISO date and time",
    "savedAt": "ISO date and time of this save",
    "createdWithVersion": "the suite version that created the file, as App.Version.number. Never printed in Word",
    "savedBy": { "product": "OT Cyber Document Tool", "version": "0.7.0" },
    "kind": "report | short. What the Word file prints around the body: report = cover, document control page, then the body; short = no cover and no document control, a title block, then the body. Both carry the house header and footer, the Draft watermark and the Final lock",
    "info": {
      "title": "the document's title. The only required field: empty, it prints as a red prompt and Final is refused",
      "docType": "what sort of document it is, in the author's words: Proposal, Method statement, Report, Procedure, Technical note. Printed in capitals as the cover's kicker line; empty prints DOCUMENT",
      "reference": "OPTIONAL. Document or opportunity reference; printed under the client on the cover and in document control when set",
      "client": "the customer. Empty: the cover leaves the line out and the footer prints the title alone",
      "site": "OPTIONAL. Site, system or subject, printed under the client on the cover",
      "author": "printed on the cover strip (AUTHOR) and used as the Word file's creator property",
      "revision": "printed on the cover strip (ISSUE) and in document control; default 0.1",
      "date": "the document's date, YYYY-MM-DD from a date field. Printed exactly as stored, as the assessment reports print their dates",
      "qaReviewBy": "document control",
      "authorisedBy": "document control",
      "issuedTo": "document control",
      "issuedDate": "document control and the cover strip; YYYY-MM-DD, printed as stored. The cover falls back to date when this is empty",
      "classification": "printed on the cover strip (CLASSIFICATION) and in document control as Confidentiality; default Confidential",
      "coverTitleLines": "OPTIONAL. One to three strings to print as the cover title instead of splitting title automatically"
    },
    "options": {
      "numberHeadings": "OPTIONAL, default false. Print 1, 1.1, 1.1.1 before headings (typed by the writer, as the assessment reports do; not Word numbering)",
      "contents": "OPTIONAL, default false. Report kind only: print a Contents list of the level 1 and 2 headings after document control, each a link to its heading, without page numbers"
    },
    "nextId": "a number: the next block, media, part, footnote or relationship id is made from it and it is then increased, so ids are never reused within a document",
    "blocks": "the body, in reading order: a flat list of the blocks below. A section is a level 1 heading and what follows it; sections are not stored",
    "blockTypes": {
      "_common": { "id": "b<n>, unique in the document, including blocks inside table cells", "land": "OPTIONAL true: print this block on a landscape page. Consecutive blocks with land share the landscape pages; a change of orientation starts a new page" },
      "heading": { "id": "b1", "type": "heading", "level": "1, 2 or 3", "runs": "inline runs; bold and italic are ignored on a heading" },
      "paragraph": { "id": "b2", "type": "paragraph", "runs": "inline runs", "align": "OPTIONAL left (default) | center | right | justify" },
      "list": { "id": "b3", "type": "list", "list": "bullet | number", "level": "0, 1 or 2", "runs": "inline runs", "restart": "OPTIONAL true, numbered items only: this item starts again at 1 although the item before it is numbered", "continue": "OPTIONAL true, numbered items only: this item carries on from the last numbered list although other blocks sit between. Set by import; the editor has no control for it in 1.0 and keeps it when present. Without either flag a numbered item continues the list directly before it, and starts at 1 after any block that is not a list item. App.HouseDocx.listNumbers(blocks) is the one implementation of this rule" },
      "table": {
        "id": "b4", "type": "table",
        "header": "0 or 1: how many rows at the top are header rows (navy, white bold text, repeated on each page)",
        "cols": "one positive number per grid column: relative widths (an import gives twips). The writer scales them to the page (9026 dxa portrait, 15398 dxa landscape), or to the table's own width",
        "width": "OPTIONAL the table's own width in twips (100 to 31680), when it is narrower than the space it sits in. Set by import for a table with a look of its own",
        "borders": "OPTIONAL \"none\": the table prints with no borders (an imported chart or row of tiles)",
        "rows": [{ "h": "OPTIONAL the row's height in twips (1 to 31680), at least that unless hRule is exact", "hRule": "OPTIONAL \"exact\"", "cells": [{ "blocks": "paragraph, list, picture and kept blocks, and a table (one from an imported chart, at most three tables deep, drawn but not edited); no headings or page breaks inside a cell", "span": "OPTIONAL columns this cell covers, default 1", "rowSpan": "OPTIONAL rows this cell covers, default 1. A cell covered by a span from the left or from above is left out of its row, as in HTML", "fill": "OPTIONAL hex colour (RRGGBB) the cell is shaded with. In a header row it takes the place of the template's navy", "vAlign": "OPTIONAL center | bottom (top by default)", "pad": "OPTIONAL [top, right, bottom, left] cell padding in twips (0 to 2000)" }] }],
        "caption": "OPTIONAL plain text, printed under the table in the Caption style",
        "_look": "A table with a look of its own (borders none, or a fill below the header row) keeps it at export: its fills, widths, row heights, padding and its runs' sizes; its paragraphs sit close. Any other table takes the template's look. The import carries the look only for such a table, so an ordinary table's shaded header row still becomes the template's"
      },
      "picture": { "id": "b5", "type": "picture", "media": "key in media", "width": "printed width in px at 96 dpi", "height": "printed height in px", "align": "OPTIONAL left | center (default) | right", "caption": "OPTIONAL plain text", "alt": "OPTIONAL alternative text, written into the Word picture" },
      "kept": {
        "id": "b6", "type": "kept",
        "kind": "shape | group | textbox | canvas | smartart | chart | ole | picture | equation | other. What it was in the Word file, for the label only",
        "xml": "the original WordprocessingML, one or more complete children of a paragraph (w:r holding w:drawing, w:object, w:pict or mc:AlternateContent; or m:oMath / m:oMathPara), serialised so that it declares every namespace it uses. Relationship ids in it have already been replaced by the ids in rels, and text inside any w:txbxContent already carries its effective font, size, colour and paragraph settings as direct formatting with its style references removed (without that it falls to Word's default font in the generated file). A floating block may instead hold one or more whole paragraphs (w:p): a drawing made of loose floating shapes, each anchor in its own paragraph with the blank lines that left room for it, every paragraph carrying the source's resolved font, size and spacing; the writer puts these in place of the paragraph that holds the block. A floating block comes before the text block it was anchored in, and the writer puts its anchor back at the start of that text's paragraph. The writer puts the xml into the Word file as it is, apart from making ids unique and scaling an in-line object that is wider than the page or its cell, or taller than a page (the text inside a scaled text box or shape is scaled with it). Two kept blocks may hold the same xml, rels and part keys (a copy); shared/docx-graft.js gives each use its own relationships and parts at export where Word needs that",
        "rels": [{ "id": "sptK<n>, unique in the document", "type": "the relationship type URI from the source file", "part": "key in parts, for a part inside the file", "external": "or the target URL or path, for an external relationship (a linked picture); exactly one of part and external. For a hyperlink relationship only an http, https or mailto address is kept; any other is replaced by about:blank on reading and on writing" }],
        "width": "its size in px at 96 dpi, from wp:extent or the VML style; 0 when unknown",
        "height": "as width",
        "floating": "true when it is anchored (wp:anchor or absolutely positioned VML) and not in line with the text",
        "preview": "OPTIONAL key in media: a picture of it the browser can show, when the file had one (the PNG beside an SVG, a cropped picture's own image, a raster preview of an embedded object)",
        "text": "the words inside it (a text box's text), for the label and for find; empty when it has none",
        "label": "OPTIONAL. The object's own name and description in the Word file (wp:docPr name and descr, or the VML alt or title), so the user can tell one placeholder from another. Shown in the editor and the import report only; what Word reads is inside xml",
        "description": "one plain line for the editor and the import report: Diagram (SmartArt), 11.4 x 6.7 cm",
        "align": "OPTIONAL left | center | right; applies when it is not floating",
        "caption": "OPTIONAL plain text; at import, a Caption-style paragraph beside the object"
      },
      "pageBreak": { "id": "b7", "type": "pageBreak" },
      "prompt": { "id": "b8", "type": "prompt", "text": "text still to complete. Prints red in the PlaceholderText style and is listed by the Issue check; Final is refused while one remains" }
    },
    "runs": [{
      "t": "the text. A newline is a line break inside the paragraph, a tab is a tab",
      "b": "OPTIONAL true: bold", "i": "OPTIONAL true: italic", "u": "OPTIONAL true: underline", "s": "OPTIONAL true: strikethrough",
      "sup": "OPTIONAL true: superscript", "sub": "OPTIONAL true: subscript (never both)",
      "code": "OPTIONAL true: fixed-width text",
      "red": "OPTIONAL true: text still to complete, printed red and listed by the Issue check, as a prompt block is",
      "link": "OPTIONAL an http, https or mailto address: the run is a hyperlink",
      "fn": "OPTIONAL key in footnotes: this run is a footnote reference and t is empty",
      "color": "OPTIONAL hex colour (RRGGBB) of the run's own, other than the ordinary text colour (an imported legend square, a coloured status word). Never on red text: red wins",
      "size": "OPTIONAL size in half-points (8 to 144). Set by import only in a table with a look of its own (a tile's figure)"
    }],
    "footnotes": { "f<n>": { "runs": "inline runs; a footnote is one paragraph, with newlines for line breaks. A footnote no run refers to is left out when the file is written" } },
    "media": { "m<n>": { "type": "image/png | image/jpeg | image/gif | image/bmp | image/x-emf | image/x-wmf | image/tiff. The first four are shown in the editor; the others show a placeholder and print in Word", "name": "the file name it came with, for the user", "width": "natural width in px, 0 when unknown", "height": "natural height in px", "source": "insert | import", "data": "the bytes, base64" } },
    "parts": { "p<n>": { "name": "the part's name in the source file (word/charts/chart1.xml), for the label and its extension only; the writer names it word/kept/<key>.<ext> and never reuses this name", "contentType": "its content type from the source file's [Content_Types].xml", "data": "the bytes, base64, unchanged apart from one case: a SmartArt data part's dsp:dataModelExt relId is rewritten to the new relationship id", "rels": [{ "id": "the relationship id inside this part, unchanged from the source", "type": "relationship type URI", "part": "key in parts", "external": "or an external target" }] } },
    "theme": "OPTIONAL key in parts: the source Word file's theme part, stored at import when the document holds a kept object. Written as word/theme/theme1.xml whenever a kept object is exported, so theme colours and theme fonts in shapes, SmartArt and charts resolve as they did in the source. One per document",
    "importReport": {
      "source": { "name": "the Word file's name", "size": 0, "importedAt": "ISO date and time" },
      "carried": { "headings": 0, "paragraphs": 0, "listItems": 0, "tables": 0, "pictures": 0, "keptObjects": 0, "captions": 0, "footnotes": 0, "links": 0 },
      "toCheck": [{ "code": "what the user should look at first: cover-like (a first page that looks like someone else's cover), front-matter (blocks before the first heading, often the original's own cover and document control)", "count": 0, "blockIds": ["the blocks concerned"] }],
      "front": { "_note": "OPTIONAL. The original's SolutionsPT cover and document control page, recognised and taken out of the body at import, kept until the user chooses (they may also be back in the body, under the same ids)", "blocks": ["blocks as imported, in the shape of blocks above"], "fields": [["a Document information key", "the value it was filled with"]], "unused": [["a label with no field", "its value"]], "contents": false },
      "changed": [{ "code": "what was carried over but altered, see docs/document-tool-design.md for the list of codes", "count": 0, "blockIds": ["blocks to go to, at most 50"], "examples": ["OPTIONAL, as in notCarried"] }],
      "notCarried": [{ "code": "what was left out", "count": 0, "examples": ["up to five short quotes of what was left out, so nothing is lost without the user being able to read what it was"], "blockIds": ["the nearest blocks"] }]
    }
  },
  "example": {
    "schema": "spt-document/1.0",
    "id": "doc-m3k2a1-7fkq",
    "createdAt": "2026-11-12T09:00:00.000Z",
    "savedAt": "2026-11-12T10:30:00.000Z",
    "createdWithVersion": "0.7.0",
    "savedBy": { "product": "OT Cyber Document Tool", "version": "0.7.0" },
    "kind": "report",
    "info": {
      "title": "Network segmentation proposal", "docType": "Proposal", "reference": "OPP-10442", "client": "Northfield Water", "site": "Ashby treatment works",
      "author": "A. Consultant", "revision": "0.1", "date": "2026-11-12",
      "qaReviewBy": "", "authorisedBy": "", "issuedTo": "", "issuedDate": "", "classification": "Confidential"
    },
    "options": { "numberHeadings": true, "contents": false },
    "nextId": 14,
    "blocks": [
      { "id": "b1", "type": "heading", "level": 1, "runs": [{ "t": "Summary" }] },
      { "id": "b2", "type": "paragraph", "runs": [{ "t": "This proposal sets out " }, { "t": "three", "b": true }, { "t": " options" }, { "t": "", "fn": "f9" }, { "t": ". See " }, { "t": "IEC 62443", "link": "https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards" }, { "t": "." }] },
      { "id": "b3", "type": "list", "list": "number", "level": 0, "runs": [{ "t": "Separate the control network." }] },
      { "id": "b4", "type": "list", "list": "number", "level": 0, "runs": [{ "t": "Add a demilitarised zone." }] },
      { "id": "b5", "type": "prompt", "text": "Add the cost of each option." },
      { "id": "b6", "type": "table", "header": 1, "cols": [2, 3], "land": true, "caption": "Zones and their assets",
        "rows": [
          { "cells": [{ "blocks": [{ "id": "b10", "type": "paragraph", "runs": [{ "t": "Zone" }] }] }, { "blocks": [{ "id": "b11", "type": "paragraph", "runs": [{ "t": "Assets" }] }] }] },
          { "cells": [{ "span": 2, "blocks": [{ "id": "b12", "type": "paragraph", "runs": [{ "t": "To be confirmed on site", "red": true }] }] }] }
        ] },
      { "id": "b7", "type": "picture", "media": "m8", "width": 480, "height": 270, "align": "center", "caption": "Current network", "alt": "Diagram of the current network" },
      { "id": "b13", "type": "kept", "kind": "smartart", "xml": "<w:r xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:drawing>...</w:drawing></w:r>", "rels": [{ "id": "sptK1", "type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData", "part": "p1" }], "width": 576, "height": 336, "floating": false, "text": "Plan Do Check", "description": "Diagram (SmartArt), 15.2 x 8.9 cm" }
    ],
    "footnotes": { "f9": { "runs": [{ "t": "Costs are budgetary." }] } },
    "media": { "m8": { "type": "image/png", "name": "network.png", "width": 1600, "height": 900, "source": "insert", "data": "iVBORw0KGgo..." } },
    "parts": { "p1": { "name": "word/diagrams/data1.xml", "contentType": "application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml", "data": "PD94bWwg...", "rels": [] } }
  }
};
