# OT Cyber Document Tool: design

Status: final design for v0.7, November 2026, branch `feature/document-tool`. Nothing in this document is built yet except `contracts/document.json`. It is written so that several engineers can build their parts at the same time from the interfaces given here. Three reviews (file format, editor, suite fit) were worked through; what they changed is in the text, and what was not taken is in section 10.

The fourth module of the suite. Module id `documents`, product name `OT Cyber Document Tool`, project file schema `spt-document/1.0`.

## 0. What was asked for, and what was tried first

The owner wants a tool that writes documents in the same template as the assessment reports ("the same look and feel", "basically, same cover"), with a proper editor, and that can take an existing Word document and rebuild it in the SolutionsPT template. All kinds of documents. Pictures and diagrams in an imported document must be kept. Review through the Report Review Tool is not part of this version.

Everything uncertain was tried before it was designed. Files were built in Node 24 with the vendored `shared/vendor/docx.umd.js` and opened in real Microsoft Word through COM (a new invisible instance, read-only, `OpenAndRepair` false, so a damaged file raises an error instead of being repaired). Browser questions were run in headless Edge.

| Question | Result |
|---|---|
| Do real lists, Heading 3, hyperlinks and footnotes from the patched library open in Word? | Yes. Numbering (bullets and numbers, three levels, a second `instance` to restart at 1), Heading 1 to 4, external and internal hyperlinks, a footnote, merged cells, alt text on a picture, and runs mixing bold, italic, underline, strike, superscript, subscript, colour, font and size opened cleanly. |
| Does the library handle EMF, WMF, SVG or TIFF pictures? | Not by itself. `ImageRun` names every media part `<random>.png` and the content types list has only png, jpeg, jpg, bmp and gif. Renamed and typed after packing (`.emf`, `Default Extension="emf"`), Word shows it as a picture of the right size. |
| Can an original drawing be carried from a source file into a generated one? | Yes. A Word-made fixture with a PNG, an EMF, two shapes, a text box, SmartArt, a chart with its workbook and an embedded Excel sheet was read; each run was put into a library-made document in place of a placeholder run after packing; the 13 parts it depends on were copied. Word reported the same objects as the source (5 inline shapes, 3 shapes, `Excel.Sheet.12`), with the draft watermark still in the header. A second fixture proved an SVG picture and a TIFF. |
| Does Word accept a file re-zipped by our own writer? | Yes (stored or `CompressionStream("deflate-raw")`, CRC-32 in script, `[Content_Types].xml` first). |
| Does the open check notice a damaged file? | Yes. The grafted file without content types for the carried parts fails with "The file appears to be corrupted." |
| Can two kept objects share parts (what a copy in the editor would produce)? | Only pictures and text boxes. Two drawings pointing at one chart part, or one SmartArt data part, make Word refuse the whole file ("Word experienced an error trying to open the file"); so does a second chart part that shares the first one's workbook, style or colours part. A chart copy with its whole part closure cloned opens with 2 charts; a SmartArt copy with its own data and drawing parts and the `relId` rewritten opens with 2 diagrams. A copied embedded object with the same VML shape id and `ObjectID` silently becomes a plain picture; with unique ids both stay `Excel.Sheet.12`, sharing the embedding part. |
| Does text inside a kept text box or shape keep its look? | Not unless it is made to. Such text usually has no run formatting and takes font and size from the source file's defaults. In the generated file it fell to Times New Roman 10 (source: Aptos 12). With the source's effective font and size written onto those runs as direct formatting it reads Aptos 12 again. A library footnote also came out Times New Roman 10. |
| Do kept shapes, charts and SmartArt keep their colours? | Not without the source theme. The library writes no theme part, so `schemeClr accent1` resolved to Word's built-in theme (156082) instead of the source's (C00000). With the source theme part added (`word/theme/theme1.xml`, a relationship and an Override) Word reports the source's accent colour and minor font. The generated `styles.xml` has no theme references, so the house look is unaffected. |
| Can a kept object be scaled to fit? | Yes. Halving `wp:extent` (chart, SmartArt) and the VML style width and height (embedded object) opens cleanly at the new sizes. Untouched, a 540 pt wide chart runs off the 451 pt text area and past the paper. |
| Can a floating drawing be put in line by rewriting `wp:anchor` to `wp:inline`? | No. Both attempts open, but Word still lists the object as a floating shape. The feature is not built. |
| Do `blob:` pictures, the docx library and `CompressionStream` work under the tool's Content-Security-Policy, standalone and in the suite's `srcdoc` frame? | Yes, all three, in both. `fetch()` of a `blob:` or `data:` URL is refused (no `connect-src`), so bytes are never read with `fetch`. |
| How much fits in `localStorage`? | About 5 MB for the whole origin, shared by every tool on `file://`. `indexedDB.open` never settles in headless Edge. |
| Is text in off-screen `content-visibility: auto` blocks found by the browser's find? | Yes, when the text is in the DOM. |

Two details the experiments settled:

- Where the kept XML declares its namespaces does not matter to Word. The design declares them on the kept `w:r` itself, because `XMLSerializer` produces that for free and nothing in the generated root has to change.
- SmartArt has one relationship that is easy to miss. The data part names the drawing part through `dsp:dataModelExt relId="rId18"`, which is an id in the document's relationships, not the part's own, and is not an `r:` attribute. It has to be found and rewritten by name.

Not proven, and carried as risks in section 9: a real Visio object (Visio is not installed on the build machine; an embedded Excel sheet uses the same `w:object` markup), grouped shapes made by Word (the group fixture is hand-written XML), an older Word, and how any of this looks on screen (nothing was screenshotted; Word's own object counts, fonts, theme values and its re-save were the evidence).

The scratch prototypes are the starting point for the real files: `graft.js` (zip read and write, extraction, graft), `wordcheck.ps1` and the reviewers' `wcheck2.ps1` (the Word open check, with font, theme and size readings), `mkfixture.ps1` and `mkfixture2.ps1` (fixtures by COM), `build2.js` to `build4.js` (copies, theme, scaling). They are in the session scratchpad under `doc-tool/design/` and `doc-tool/review-ooxml/` and are copied into the repository by the work packages that own them.

## 1. Scope

### In v0.7

- A new standalone module, `modules/documents`, that also runs in the suite, as one HTML file and as an exe.
- Two document kinds (section 2), printed through one shared template file that reproduces the assessment report's look.
- A block editor: headings (three levels), paragraphs with inline formatting, bulleted and numbered lists (three levels), tables with a header row, pictures, page breaks, landscape pages, red prompts, footnotes and links.
- Import of a `.docx`: read into the same blocks and restyled by being rebuilt in the template. Pictures, vector pictures and drawn content are kept. Everything not carried over is listed.
- A document information page, a preview, the Issue check, Draft and Final, Word export.
- The tool's own project file with save in place, autosave and the unsaved-changes guard.
- Suite integration: card, rail button, file routing for the project file, tour.

### Out of v0.7

| Not in this version | Why, and what is left open for it |
|---|---|
| Hand-off to the Report Review Tool | The owner's goal now is consistent documents. Nothing blocks it later: runs use the same `t`, `b`, `i`, `red` names as `shared/docx-blocks.js`, every block has a stable id, and the exported file can be read by `App.DocxBlocks.fromBlob` like any other report. |
| Exact wrap (keep the uploaded file as written and only add a cover) | Chosen against by the owner. The graft pass built here is most of what it would need. |
| A letter kind | There is no house letter layout to copy, so its look could not be checked against anything. A letter is written as a short document until a layout is agreed. |
| A table of contents with page numbers | A TOC field has no page numbers until Word updates it, which means a prompt on opening and does not work in a read-only Final. Built instead: an optional Contents list of linked headings without page numbers. |
| Moving the assessment and risk exporters onto the shared template | They are not touched. `shared/house-docx.js` is used by the new module only, and a test proves it matches the assessment exporter. |
| Editing a kept object's content, resizing it by hand, or putting a floating one in line | It is carried untouched apart from being scaled down to fit the page. It can be moved, captioned, deleted or replaced with a picture. Putting a floating drawing in line did not work in Word when tried. |
| Merging and splitting cells, selecting a rectangle of cells, dragging column widths | Merged cells in an imported table are kept, shown and printed. Editing them is a follow-up. |
| Dragging to resize a picture or to move a block, "Reduce picture sizes", pictures from a Word paste (read from the clipboard's RTF) | Follow-ups, listed in `docs/document-tool.md`. The contract fields they need are already there. |
| Inserting a Word file into an open document, nested tables, columns, tracked changes, comments, editing equations, `.doc` (binary) and Strict Open XML files | Listed at import where they apply. |
| Bumping the version number | This work does not change `shared/version.js`. |

## 2. Document kinds

`kind` decides what is printed around the body. `info.docType` is separate: it is the author's name for the sort of document (Proposal, Method statement, Report, Procedure, Technical note, or anything typed) and only feeds wording.

| | report | short |
|---|---|---|
| For | Anything with a cover: proposals, method statements, reports, procedures | Notes, letters and short documents of a few pages |
| Cover | Yes: the assessment cover (`coverDesignB`), own section, zero margins | No |
| Document control | Yes: "Document control and confidentiality" as the first page of the body, then a page break | No |
| Contents | Optional (`options.contents`) | No |
| Opening of the body | The blocks. A page break that opens them is left out: the front matter ends on a new page already | The title in the Title style, then one Caption line: client, revision, and the issued date or else the date, joined by " · " (empty ones left out; `shortHeadLine`, which the screen reads too), then the blocks |
| Header | Logo, right aligned, 150 px (`brandHeaderObj`) | Same |
| Footer | Three cells: the classification and "© SolutionsPT Ltd" joined by " · " ("Confidential" when the classification is empty; `footerLeft`), centre text, page number (`brandFootersDoc`) | Same |
| Draft watermark, Final lock | Yes | Yes |
| Heading numbering option | Yes | Yes |
| Required to issue as Final | Title | Title |

The report kind is the default for a new document and for an import.

### The cover for a general document

The cover is the assessment cover with its inputs named instead of read from an engagement. The uppercase strip is part of the template and stays.

| Cover element | Assessment report | Document tool |
|---|---|---|
| Kicker line (sky blue, bold, 10.5 pt) | `OT CYBER SECURITY ASSESSMENT` | `info.docType` in capitals, for example `PROPOSAL`; `DOCUMENT` when empty |
| Title lines (white, bold) | The instrument title split in two balanced lines | `info.coverTitleLines` when set (one to three lines), otherwise `splitTitleTwo(info.title)`; "Untitled document" when the title is empty |
| Title size | 52 or 60 half-points | Chosen by `coverTitleSize(lines)`: 60 when the longest line is at most 20 characters, 52 up to 30, 44 up to 38, otherwise 36 and the title is split into three lines |
| Client line (30 half-points) | `clientName`, or "Client" | `info.client`; the line is left out when empty |
| Second line (21 half-points) | `siteName` when set | `info.site` when set |
| Sub line (sky blue, bold) | `opts.subLine` | `info.reference` when set |
| ISSUE | revision and issued date (or date of visit) | `info.revision` (default 0.1), then "  ·  " and `info.issuedDate` or `info.date` when there is a date (`stripParts`) |
| AUTHOR | consultant | `info.author`; the label and the value are left out when it is empty |
| CLASSIFICATION | confidentiality, default Confidential | `info.classification`, default Confidential |
| Address and contact lines | fixed | the same fixed text, from one constant |

The cover is one page whatever is typed on it. The assessment's cover is one table row and a spacer paragraph, and any line that wrapped pushed the strip and the address onto a second page. Here it is two rows of exact height that cannot split (`COVER_TOP_ROW` 11000 and `COVER_FOOT_ROW` 3787 twips, found in Word: the two may total about 16000 before Word starts a second page), with the strip and the address lines bottom-aligned in the second, so a wrapped strip grows upwards. An ordinary cover rasterises the same as the assessment's. Text too long for a row is clipped by Word; `coverRoom(c)` and `coverFits(project)` estimate when, on the safe side, and the Issue page and the export message say so.

Footer centre text: the title and the client joined by " · ", or the title alone.

Document control rows, in this order. The first seven are the assessment's rows with the same labels (the review hash in `shared/docx-blocks.js:394` keys on them, and the look must match):

`Document revision`, `Status` (Draft or Final), `QA review by`, `Authorised by`, `Issued to`, `Issued date`, `Confidentiality`, then `Document` (the title; a red prompt "Add the document title" when empty), `Document type` (when set), `Reference` (when set), `Client` (when set), `Author` (when set).

Dates print exactly as stored, as the assessment exporter prints them (`export-docx.js:2652` prints `issuedDate` unformatted). The two date fields are `type="date"` inputs, as in the assessment tool's engagement panel (`ui.js:10083`), so both tools print `2026-11-11` for the same date. Friendlier dates would be a change to every tool at once and are not made here.

Contents list (`options.contents`, report kind): a level 1 heading "Contents", then one line per level 1 and level 2 heading (level 2 indented), each an internal hyperlink to a bookmark on its heading, then a page break. No page numbers and no field, so nothing needs updating and Final is not affected.

Heading numbers (`options.numberHeadings`): the writer types the number before the heading text exactly as the assessment's `h1n` does (number in brand blue bold, an em space, then the text), for all three levels (`1`, `1.1`, `1.1.1`). It is not Word numbering. A heading is numbered by how deep it sits under the headings before it, not by its level alone, so a skipped level never prints a nought: a level 2 heading before any level 1 is `1`, and a level 3 directly under a level 1 is `1.1` (`headingNumbers`; `App.DocModel.outline` keeps to the same rule and a test holds them together). The heading's style still follows its level. A heading with no words has no line in the contents list.

## 3. Data model

The machine-readable contract is `contracts/document.json` (written; follows `contracts/review-file.json`). This section explains it. Where the two differ, the contract wins.

### 3.1 The project file

```
{
  schema: "spt-document/1.0",
  id, createdAt, savedAt, createdWithVersion, savedBy: { product, version },
  kind: "report" | "short",
  info: { title, docType, reference, client, site, author, revision, date,
          qaReviewBy, authorisedBy, issuedTo, issuedDate, classification,
          coverTitleLines? },
  options: { numberHeadings, contents },
  nextId: 14,
  blocks: [ ... ],
  footnotes: { f9: { runs } },
  media: { m8: { type, name, width, height, source, data } },
  parts: { p1: { name, contentType, data, rels } },
  theme?: "p7",
  importReport?: { source, carried, toCheck, changed, notCarried }
}
```

- The file always carries `schema`. The suite's `fileKind` claims any JSON with no schema and a `schemaVersion` string for the assessment tool (`platform/js/suite.js:363`), so a document file without a schema string would be opened by the wrong tool.
- `blocks` is one flat list in reading order. A section is a level 1 heading and the blocks after it up to the next level 1 heading. Sections are derived (`App.DocModel.outline`), never stored.
- Ids come from `nextId`: `b<n>` blocks, `m<n>` media, `p<n>` parts, `f<n>` footnotes, `sptK<n>` relationship ids. They are never reused, so undo can bring a deleted block back under its old id.
- `theme` is the key of the source document's theme part (3.4). One per document.
- `savedBy.version` and `createdWithVersion` hold the suite version. They are never passed to the writer.

### 3.2 Blocks

Every block has `id` and `type`, and may have `land: true`.

| Type | Shape | Notes |
|---|---|---|
| heading | `{ id, type: "heading", level: 1 or 2 or 3, runs }` | Bold and italic on a heading's runs are ignored when printed. |
| paragraph | `{ id, type: "paragraph", runs, align? }` | `align` is `left` (default, omitted), `center`, `right` or `justify`. |
| list | `{ id, type: "list", list: "bullet" or "number", level: 0 to 2, runs, restart?, continue? }` | One block per item. A numbered item continues the numbered item directly before it and starts at 1 after any block that is not a list item. `restart: true` starts at 1 anyway; `continue: true` carries on from the last numbered list across other blocks. Import sets `continue`; the editor has no control for it in this version and keeps it when present. |
| table | `{ id, type: "table", header: 0 or 1, cols: [n, ...], rows: [{ cells: [{ blocks, span?, rowSpan? }] }], caption? }` | `cols` are relative widths, one per grid column. A cell covered by a span is left out of its row, as in HTML. A cell holds paragraph, list, picture and kept blocks only. |
| picture | `{ id, type: "picture", media, width, height, align?, caption?, alt? }` | Width and height are the printed size in px at 96 dpi. `align` defaults to `center`. |
| kept | `{ id, type: "kept", kind, xml, rels, width, height, floating, preview?, text, label, description, align?, caption? }` | Original WordprocessingML carried across. See 3.4. |
| pageBreak | `{ id, type: "pageBreak" }` | |
| prompt | `{ id, type: "prompt", text }` | Red. Listed by the Issue check. Final is refused while one remains. |

Landscape is a flag on a block, not a section object. The writer groups consecutive blocks with `land: true` into one landscape segment and hands the segments to `bodySectionsFromSegments`, the assessment exporter's own helper. A heading can carry the flag too, so it sits with its table.

**List numbers have one owner.** `App.HouseDocx.listNumbers(blocks)` applies the rule above and returns, per list block id, `{ marker, instance }` (`marker` is the text shown, such as `2.`, `b.` or `•`; `instance` is the Word numbering instance). The writer, the editor, the preview and the outline all call it; none of them works numbers out again.

### 3.3 Inline runs

`runs` is a list of `{ t, b?, i?, u?, s?, sup?, sub?, code?, red?, link?, fn? }`.

| Field | Prints as | Why it is safe |
|---|---|---|
| `b`, `i` | bold, italic | used by every report today |
| `u`, `s`, `sup`, `sub` | underline, strikethrough, superscript, subscript | opened in Word, alone and combined. The library writes `strike` and `u` after `sz`, which is out of schema order; Word accepts it. `rStyle` is not used on these runs, so the one ordering Word does refuse is not in play. |
| `code` | Consolas 10 pt on the light panel shade | opened in Word |
| `red` | `noteRun`: colour E00000, tagged as a prompt | the existing mechanism |
| `link` | `ExternalHyperlink`, blue and underlined by direct formatting (no `Hyperlink` character style, so no `rStyle`) | opened in Word; http, https and mailto only |
| `fn` | `FootnoteReferenceRun`; `t` is empty | opened in Word |

A newline in `t` is a line break; a tab is a tab. Fonts, sizes, colours and highlights are not in the model on purpose: the house style decides them.

Footnotes live in `footnotes`, outside the blocks. One is never removed while the document is open, so undoing the deletion of a paragraph always finds its footnote; footnotes no run refers to are left out when the file is written (`toFile`).

### 3.4 Kept objects and carried parts

A kept object is content the tool cannot redraw. It holds:

- `xml`: one or more complete children of a paragraph, as text: a `w:r` holding `w:drawing`, `w:object`, `w:pict` or `mc:AlternateContent`, or an `m:oMath` or `m:oMathPara`. It is serialised with `XMLSerializer`, so it declares every namespace it uses.
- `rels`: the document-level relationships the XML refers to. At import each relationship id in the XML (any attribute in the relationships namespace, such as `r:embed`, `r:id`, `r:link`, `r:pict`, `r:dm`, `r:lo`, `r:qs`, `r:cs`) is replaced by a new id `sptK<n>` that is unique in the document. Each entry points to a `part` key or an `external` target.
- `parts` (on the project): each carried part with its original content type, its bytes and its own relationships, which point to further part keys. A part's own relationship ids are kept as they were, because the part's XML refers to them.
- `preview`: a media key for a picture of the object the browser can show, when the source file had one. Often there is none; the editor then shows a labelled placeholder of the right proportions.
- `label`: the object's own name and description in the Word file (`wp:docPr` `name` and `descr`, or the VML `alt` or `title`), so the user can tell one placeholder from another.

What "carried untouched" means exactly. The drawing itself is never edited. Four things around it are changed, each proven in Word:

1. **Ids.** Relationship ids are renamed at import; `wp:docPr` ids, VML shape ids and `ObjectID`s are made unique at export.
2. **Text formatting inside text boxes and shapes.** At import the effective font, size, bold, italic, colour, alignment and spacing of every run and paragraph inside `w:txbxContent` are worked out from the source's document defaults, style chain and theme, and written onto those runs and paragraphs as direct formatting; then the style references are removed (4.4). Without this the text falls to Times New Roman 10. SmartArt and chart text is DrawingML and follows the theme instead.
3. **Theme.** The source's theme part is stored once (`project.theme`) and written as `word/theme/theme1.xml` whenever the document holds a kept object, so theme colours and theme fonts in shapes, SmartArt and charts resolve as they did in the source.
4. **Size.** An in-line kept object wider than the space it sits in (the page, or its table cell), or taller than a page shows, is scaled down to fit when the file is written, aspect ratio kept. The text inside a scaled text box, shape, group or canvas is scaled with it (font sizes, paragraph spacing, fixed line heights and the box's insets), or its words would no longer fit and Word would cut them off. The stored XML is not changed.
5. **Links.** A link inside it that is not an http, https or mailto address is taken off at import and reported (4.4).

**Copies.** Copying a kept block (copy and paste, duplicate, undo of either) copies the block with a new block id and nothing else: the same `xml`, the same relationship ids, the same part keys. The model never has to clone parts. Word does not accept two charts or two diagrams on one part, so the un-sharing is done in one place at export, `App.DocxGraft.unshare` (4.2), which gives every later use its own relationship ids and its own copy of whatever may not be shared.

### 3.5 Media and size rules

- Types shown in the editor: png, jpeg, gif, bmp. Types stored and printed but shown as a placeholder: EMF, WMF, TIFF.
- A picture the user inserts, pastes or drops goes through `App.DocPictures.fromFile`:
  - png, jpeg: kept as they are when the longest side is at most 2400 px. Larger ones are scaled down to 2400 px (never up). A scaled PNG with no transparency that is still over 1.5 MB becomes JPEG at quality 0.9.
  - gif, bmp, webp: converted to PNG, then the same rule.
  - svg: drawn to PNG at twice its printed size, at most 2400 px wide. The SVG itself is not stored.
  - Anything over 5 MB after that is refused with a message.
- Pictures and parts read from an imported Word file are stored byte for byte and never reduced.
- The printed width of a picture is clamped by the writer to the page: 601 px portrait (9026 dxa), 1026 px landscape (15398 dxa), or the cell's width inside a table. Kept objects are fitted the same way (3.4).
- **Limits apply where bytes come in, never at Save.** The tool warns when the pictures and kept content pass 100 MB, and refuses an import, an insert or a paste that would take them past 150 MB. A Save is never refused: a document already over the limit saves with the warning. The 150 MB figure is provisional; WP4 measures it (section 9) before it is fixed. The suite shell only passes files up to 100 MB (`FILE_MAX`, `platform/js/suite.js:350`); larger ones are opened with the tool's own Load.

### 3.6 The project in memory

The file form and the memory form differ in one way, and every package relies on it:

| | In the file | In memory |
|---|---|---|
| `media[k]`, `parts[k]` bytes | `data`: base64 | `blob`: a `Blob`. There is no `data` field in memory. |
| An entry whose bytes are missing (after a crash recovery, 5.9) | cannot occur | `blob: null`, `missing: true` |

- `App.DocModel.fromText(text)` turns each `data` into a `Blob` (through `atob`, in slices) and drops the string straight away, entry by entry, so the base64 is not held twice. `App.DocModel.toFile(doc)` does the reverse, in chunks, so the file is never one string.
- `App.DocxImport.read` returns the memory form: it makes the Blobs itself.
- Shared code reads bytes with `await entry.blob.arrayBuffer()`. Nothing reads bytes with `fetch` (the CSP refuses it), and shared code never calls `App.DocModel`.
- `App.DocModel.mediaUrl(doc, key)` makes an object URL lazily for display; `releaseUrls(doc)` revokes them.
- History entries hold blocks only. `media`, `parts`, `footnotes` entries are never deleted while a document is open; unreferenced ones are left out by `toFile`.

**What `normalise` repairs**, so that every other file can trust the memory form whatever a project file holds:

- Text is stored as a Word file can hold it: control characters, U+FFFE, U+FFFF and half of a surrogate pair are left out of document information, runs, prompts, captions, alternative text and a kept object's words, and a vertical tab in running text becomes a line break. The same rule as `HouseDocx.xmlSafe`; paste applies it too.
- A table is bounded: at most 63 columns, spans cut back to the grid, and a cell with no column left gives its words to the last cell placed.
- An id, media key, part key or footnote key that is a name every object has (`__proto__`, `constructor`) is not taken in; a block under one gets a new id.
- One note has one reference: a second reference to the same note gets a copy of it, as a copied paragraph does, so the numbers on screen are the ones the writer prints.
- A hyperlink relationship of a kept object or a carried part keeps its target only when it is http, https or mailto; any other becomes `about:blank` (4.4).
- `importReport` is brought to the contract's shape, keeping the order of its fields and any plain count this version has no name for.
- A file that is ours but cannot be read is refused in plain words ("This document file is damaged and could not be read."), with the script error kept on `cause`; the user is never shown one.

## 4. Shared code

Four new files in `shared/`, synced into `modules/documents/js/` by `tools/sync-shared.ps1`. None of them calls a module's code. `house-docx.js` needs `window.docx`, `App.Assets` (logo and cover art) and, for a file with kept objects or non-PNG pictures, `App.DocxGraft`. `docx-import.js` and `docx-graft.js` need `App.ZipIO`. `shared/docx-blocks.js` is not changed and is not loaded by the new module.

### 4.1 `shared/zip-io.js`: `App.ZipIO`

| Function | Returns | Notes |
|---|---|---|
| `read(blobOrBuffer, opts)` | `Promise<[{ name, bytes: Uint8Array }]>` | The reader from `shared/docx-blocks.js:53-75`, copied, with limits added: `opts.maxTotalBytes` (default 500 MB, counted from the declared sizes before inflating), `opts.maxEntries` (default 5000). Rejects ZIP64 and encrypted entries with a clear error. |
| `write(parts, opts)` | `Promise<Blob>` | `parts` is `[{ name, bytes }]` in the order to write. An entry whose name ends in `/` (a directory entry; the library's zip has four) is skipped. Entries whose names end in an already compressed extension (png, jpg, jpeg, gif, xlsx, docx, pptx, vsdx, zip) are stored; the rest are deflated with `CompressionStream("deflate-raw")` and stored instead when that is not smaller. UTF-8 names (flag 0x0800), no data descriptors, a fixed date (1 January 2026) so the same input gives the same bytes. Rejects more than 65,535 entries or 4 GB. `opts.mimeType` sets the Blob type. |
| `crc32(bytes)` | number | Table-driven. |
| `text(part)`, `bytesOf(string)` | string, `Uint8Array` | UTF-8 helpers. |

Edge, Chrome and Electron 44 only, as agreed.

### 4.2 `shared/docx-graft.js`: `App.DocxGraft`

`apply(blob, plan)` returns `Promise<Blob>`: the packed file with kept content put in and media corrected. `plan` is what the writer collected:

```
plan = {
  kept:  [{ token, blockId, kind, xml, rels: [{ id, type, part | external }], scale? }],
  parts: { p1: { name, contentType, blob, rels: [...] } },
  theme: "p7" | undefined,
  media: [{ fileName, ext, contentType }]      // library media to rename
}
```

`kept` is in document order and holds one entry per use, so a copied block appears twice with the same `xml` and `rels`. `scale` is a factor below 1 when the object must be made smaller to fit.

Steps, in this order:

1. `ZipIO.read` the packed file.
2. `unshare(plan)` (below).
3. For each kept entry: apply `scaleXml(xml, scale)` when `scale` is set; then find its placeholder run in `word/document.xml`, `<w:r>` (an optional `<w:rPr>`) `<w:t ...>TOKEN</w:t></w:r>`, and replace the whole run with the XML. The token is `U+E000` + `KEPT:` + block id + `U+E000` (`token(id)`). A token that is not found is an error: the export fails with "A drawing could not be placed" and names the block. When the kept XML is whole paragraphs (a floating drawing with its blank lines, 4.4), the token's whole paragraph is replaced, and the file is refused if that paragraph holds anything else. `scaleXml` also scales what is inside `w:txbxContent` at any depth (`w:sz`, `w:szCs` with a floor of 4 pt, paragraph spacing, fixed line heights) and the `wps:bodyPr` insets (Word's defaults are written, scaled, when absent). A hyperlink relationship is written only to an http, https or mailto address; any other is written as `about:blank`.
4. For each relationship of a placed entry, once per id, append a `Relationship` to `word/_rels/document.xml.rels`. An internal target is written as an absolute target.
5. Add each part reached, transitively, with a `.rels` file beside it when it has relationships. **A carried part is named `word/kept/<partKey>.<ext>`**, where `<ext>` is the source name's extension lower-cased and reduced to `[a-z0-9]` (`bin` when nothing is left). The source name is never reused, so a space, an ampersand or a non-ASCII character in it cannot reach a part name.
6. Add an `Override` to `[Content_Types].xml` for every part added, with its stored content type.
7. When `plan.theme` is set and the package has no theme part: add it as `word/theme/theme1.xml` with its own relationships, a theme relationship in `word/_rels/document.xml.rels` and an `Override`.
8. Make ids unique across the document: every `wp:docPr` `id` renumbered in one sequence; in every kept `w:object`, the `v:shape` `id` with the matching `o:OLEObject` `ShapeID`, and the `ObjectID`, renumbered in one sequence (`_x0000_i<n>`, `_<n>`). The watermark's `_x0000_s...` ids are a different series and are left alone.
9. For each `plan.media` entry: rename `word/media/<fileName>` to the right extension, update the target in every `.rels` file that names it, and add a `Default` for the extension when the list has none.
10. `ZipIO.write` with `[Content_Types].xml` first.

**Every attribute value the graft writes is XML-escaped** (`&`, `<`, `>`, `"`): relationship types, external targets, content types. The values come from `DOMParser`, so they are decoded; a link target containing `&` would otherwise give a malformed file.

**`unshare(plan)`**, the rule that makes copies safe. Walk `plan.kept` in order, keeping the set of part keys already used by an earlier entry.

- An entry that reaches no part already used is left as it is.
- Otherwise the entry gets new relationship ids (`<id>c<n>`; each `"sptK12"` in its XML is replaced by exact quoted match), and its part closure is walked: a part reached **directly** from the entry by an image, `oleObject` or `package` relationship is shared (same part key); **every other part is cloned** under a new key with its closure, including a chart's workbook, style and colours parts. In a cloned SmartArt data part the `dsp:dataModelExt relId` is rewritten to the entry's new id for the drawing part.
- Afterwards `unshare` checks that no chart, chart-ex or diagram part is reached by two entries and throws `DocxGraft.SharedPartError` naming both blocks if one is. The export then fails with a message; a file Word would refuse is never produced.

Proven by hand-built files in Word: shared picture and text box copies open; a deep-cloned chart opens with 2 charts; SmartArt with cloned data and drawing parts opens with 2 diagrams; an embedded object with unique ids and a shared embedding stays an object.

**`scaleXml(xml, factor)`** rewrites `wp:extent` (`cx`, `cy`), the `a:ext` of a picture's `a:xfrm`, and the `width` and `height` in a VML shape's `style`. Proven for a chart, SmartArt and an embedded object. It is applied to in-line objects only.

`apply` is skipped entirely when there are no kept objects and every picture is a PNG, so a plain document is byte for byte what the library wrote, as the assessment reports are.

String replacement on the packed XML is used instead of `ImportedXmlComponent` for kept content because the original XML then passes through untouched, and a post-pack pass is needed for the parts anyway. `ImportedXmlComponent` stays in use for the watermark and the Final lock, exactly as in the assessment exporter.

Exports: `apply`, `token(id)`, `needsGraft(plan)`, `unshare(plan)`, `scaleXml(xml, factor)`, `escapeAttr(s)`, `SharedPartError`.

### 4.3 `shared/house-docx.js`: `App.HouseDocx`

The template, and the blocks-to-docx writer. It must reproduce the assessment exporter's output, so its template functions are copied from `modules/assessments/js/export-docx.js` with only the changes listed. Copy, do not retype: the parity test compares XML.

| Function in `App.HouseDocx` | Copied from (`export-docx.js`) | Change |
|---|---|---|
| `hex`, `COLOR`, `FONT` | 43-74 | none |
| `TBL_LIGHT`, `TBL_WHITE`, `TBL_NONE` (`_bd`) | 79-82 | none |
| `run(text, opts)` | 215-227 | also passes `underline`, `strike`, `superScript`, `subScript`, `shading` when given; with none given the output is identical |
| `body(textOrRuns, opts)` | 234-246 | also passes `alignment`, `numbering`, `indent` when given |
| `h1(text)`, `h2(text)` | 248-264 | none |
| `h3(text)` | new, same pattern | `HeadingLevel.HEADING_3`, `__headingLevel = 3` |
| `hn(level, num, text)` | `h1n`, 2541-2548 | takes the level |
| `pageBreakPara()`, `caption(text)` | 341-349 | none |
| `tagPlaceholder`, `placeholderPara(text, where)`, `noteRun(text, where, opts)`, `collectPlaceholders(nodes, out)` | 369-405 | none |
| `isFinal(opts)`, `statusLabel(opts)`, `importedXml(xml)`, `watermarkRun(onCover)`, `isParagraph`, `markDraft(sections)`, `lockAsFinal(doc)` | 414-512 | none |
| `cell`, `headerCell`, `table`, `dxaW`, `cellDxa`, `headerCellDxa`, `fixedTable`, `buildHeaderRow` | 557-658 | `cellDxa` and `headerCellDxa` also take `opts.columnSpan`, `opts.rowSpan` |
| `logoAsset`, `logoImageRun(px)`, `brandHeaderObj`, `brandHeaders()` | 739-775 | none |
| `buildStyles()` | 2027-2061 | adds `heading3` to `default` (Segoe UI, 24 half-points, bold, navy, spacing before 200 after 80, keepNext). Nothing else changes, so the styles an assessment uses are identical. |
| `splitTitleTwo(title)` | 2581-2590 | none |
| `brandFootersDoc(centreText)` | 2596-2604 | takes the centre text instead of `(instrument, engagement)` |
| `cover(c)` | `coverDesignB`, 2608-2674 | takes `c = { kicker, titleLines, titleSize, client, site, subLine, revision, date, author, classification }`. The client line is left out when `c.client` is empty (the assessment caller passes "Client"). Keeps `__coverAnchor` on the closing paragraph. |
| `DOC_A4_W`, `DOC_A4_H`, `docPO`, `portraitSectionProps`, `landscapeSectionProps`, `widenFirstCol` | 3001-3019 | none |
| `bodySectionsFromSegments(headers, footers, segments)` | 3092-3103 | none |
| `documentControl(pairs, opts)` | 826-852 | takes `pairs = [[label, value or node], ...]`; a value may be a prompt run. Same heading, table and widths (32 and 68 percent, `subBg` label cells). |

New in the file:

| Function | Purpose |
|---|---|
| `COMPANY` | `{ footerLeft: "Confidential · © SolutionsPT Ltd", footerOwner, addressLine, contactLine }`: the literals at 2600, 2658 and 2659, once. `footerLeft(classification)` gives the footer's left cell for a document. |
| `xmlSafe(text, vt)` | Text as XML can hold it: control characters, U+FFFE, U+FFFF and half of a surrogate pair are left out, and a vertical tab becomes `vt`. Called by `run()`, `txt()`, `inline()` (where a vertical tab is a line break), link targets and bookmark names, so no string reaches the file without it. A clean string is returned as it is, which keeps parity with the assessment exporter. The model stores text by the same rule (3.6). |
| `fitPx(width, height, maxPx, maxHPx)` | The size a picture prints at: no wider than its space and no taller than a page shows (`PAGE.portraitMaxHPx` 860, `landscapeMaxHPx` 570, less `cellHLessPx` 60 in a table cell), its shape kept. `lower` says the height was the limit. |
| `stripParts(c)`, `coverRoom(c)`, `coverFits(project)` | The cover strip's label and value pairs (which the screen's cover draws from too), and the estimate of whether the cover's text fits its page. |
| `numberingConfig()` | The `numbering` option for `Document`: reference `house-bullets` (levels `•`, `◦`, `▪`; no dash, by the house rule) and `house-numbers` (`1.`, `a.`, `i.`), three levels each. Level 0 sits where the assessment's typed bullet sits (`export-docx.js:542`: left 360, hanging 200); each deeper level adds 360 to the left indent. Numbers use hanging 300. |
| `listNumbers(blocks)` | The one list numbering rule (3.2). Pure; no docx objects. |
| `coverTitleSize(lines)` | The size rule in section 2. |
| `controlPairs(project, opts)` | The document control rows in section 2 for a project. |
| `coverInput(project)` | Maps `info` to `cover`'s input (the table in section 2). |
| `assemble(spec, opts)` | Returns a `docx.Document`. `spec = { kind, cover?: [nodes], segments: [{ land, children }], footerCentre, props: { creator, title, description }, footnotes, numbering }`. Builds the cover section literal (the one at 2929), the body sections through `bodySectionsFromSegments` with `brandHeaders()` and `brandFootersDoc`, then does the generic half of `makeDoc` (315-337): collect prompts into `doc.__issues`, `markDraft` unless Final or a check, `new Document`, `lockAsFinal` when Final and nothing is outstanding. No section overrides and no probe: those stay in the assessment exporter. |
| `pack(doc, opts, callback)` | `packDoc` (517-526) with the wording "This document still has ..." and, when `doc.__graft` needs it, `App.DocxGraft.apply` on the packed blob before the callback. |
| `blocksToDocx(project, opts)` | The writer. `Promise<{ segments, footnotes, graft, fitted }>`. Reads picture bytes from `project.media[k].blob`. `fitted` lists the kept block ids it scaled and the pictures it made smaller because they were taller than a page. |
| `buildDocument(project, opts)` | `Promise<{ blob, fitted }>`, or `Promise<{ placeholders }>` when `opts.issueCheck`. The one call the module makes. Rejects with the Final refusal message when prompts remain. |
| `issueList(project)` | `Promise<[{ text, where }]>`: `buildDocument` with `issueCheck: true`. |

`opts` everywhere is `{ issueStatus: "draft" | "final", issueCheck?: boolean }`, the same as the assessment exporter.

Document properties: `creator` and `lastModifiedBy` are `info.author` or "SolutionsPT" (never the library's "Un-named"); `title` is the title, with " - " and the client when there is one; `description` is `info.docType` or "Document". The product name and the version are never passed in.

#### The writer, block by block

| Block | Written as | Tags kept |
|---|---|---|
| heading | `h1`, `h2`, `h3`, or `hn` when headings are numbered. When `options.contents` is on, level 1 and 2 headings are wrapped in a `Bookmark` named `h_<blockId>`. | `__headingText`, `__headingLevel`, `__headingNum`, `__blockId` |
| paragraph | `body(runs, { alignment })` | `__isBody`, `__text`, `__blockId` |
| list | `body(runs, { numbering: { reference, level, instance } })`, with `instance` from `listNumbers`. A numbered list that opens below its top level has its own abstract numbering whose higher levels start at 0, and is written as an ordinary instance from its first top-level item on, because that is what makes Word print the markers `listNumbers` gives (read back from Word for 83 items). | `__isBody`, `__blockId` |
| run with `red` | `noteRun(t, { kind: "block", blockId })` | `__placeholder` |
| run with `link` | `ExternalHyperlink` around a run coloured `COLOR.blue` with a single underline | |
| run with `fn` | `FootnoteReferenceRun(n)`; the footnote's paragraph goes into `spec.footnotes[n]`. Every run of a footnote is written with direct formatting, `font: FONT`, `size: 18`, `color: COLOR.text`, because the library's footnote paragraph has no font of its own and Word otherwise shows Times New Roman. No style is added, so `styles.xml` parity is not affected. | |
| table | `fixedTable` with `cols` scaled to 9026 or 15398 dxa; header row through `headerCellDxa` with `tableHeader: true`; body cells through `cellDxa`; `span` to `columnSpan`, `rowSpan` to `rowSpan`. Caption under it. | `__blockId` on the table |
| picture | A paragraph with the block's alignment holding `ImageRun({ data, transformation, altText })`, size clamped by `fitPx` to the width of the page or the cell and to the height a page shows (Word cannot split an in-line picture, so a taller one ran off the paper). Caption under it. A type other than PNG adds `{ fileName: imageRun.key, ext, contentType }` to `graft.media`. | `__blockId` |
| kept | A paragraph with the block's alignment holding one run whose text is `App.DocxGraft.token(id)`. The block's `xml`, `rels` and the parts they reach go into `graft`, with `scale` set when the block is in line and wider than the page or its cell or taller than a page (one factor, the smaller of the two; the graft scales the text inside a text box with it). `graft.theme` is `project.theme` when any kept block is written. Caption under it. A floating block is not scaled and is anchored where it was: its token is handed to the paragraph or list item that follows (`w.lead`) and written as the first run of that paragraph, which is the text it was anchored in at import; with no text after it (a table, a heading, the end of a cell, or a caption of its own) it gets a paragraph of no height that stays with what follows. A floating block whose `xml` is whole paragraphs replaces the token's paragraph. | `__blockId`, `__kept` |
| pageBreak | `pageBreakPara()`; left out directly before or after a change of orientation, which starts a new page anyway, and at the very start of a report's body, which starts on a new page anyway | |
| prompt | `placeholderPara(text, { kind: "block", blockId })` | `__placeholder` |

Prompts the writer adds itself:

- an empty title: `{ kind: "info", field: "title" }`, printed in the Document row for a report and in place of the title for a short document;
- a picture or a kept object whose bytes are missing (`missing: true`, 3.6): `placeholderPara("This picture could not be restored. Replace it or delete it.", { kind: "block", blockId })` in its place. A kept block with any missing part is never written as a token. So an incomplete document cannot be issued as Final and cannot produce a damaged file.

`where` has two kinds only: `block` and `info`.

In a check (`opts.issueCheck`) pictures use the blank PNG the assessment exporter uses (`BLANK_PNG`, 532) and kept blocks write their token and nothing else, so a check of a 300-page document reads no picture data.

### 4.4 `shared/docx-import.js`: `App.DocxImport`

`read(blob, opts)` returns `Promise<{ project, report }>`. `project` is a complete, normalised project in the memory form (3.6): kind `report`, `info` filled where the source says, blocks, footnotes, media, parts, theme, `importReport`. `opts = { name, maxBytes (default 150 MB), onProgress(fraction, label) }`.

It reads with `DOMParser` and never puts source markup into the page.

**Finding the document.** The main part is found through the `officeDocument` relationship in `_rels/.rels`, not by a fixed name (some files name it `word/document2.xml`). Styles, numbering, footnotes, endnotes, comments, theme and every relationship target are resolved from the main part's own relationships, relative to it.

**Refusals**, each with a plain message and the open document left as it was: a file that is not a zip (an old `.doc`, an encrypted file, anything else); a zip with no `officeDocument` relationship; a Strict Open XML file (the main part's namespace is `http://purl.oclc.org/ooxml/wordprocessingml/main`): "This file is saved as Strict Open XML. In Word, use Save as and choose Word Document (.docx), then load that."; any XML part containing `<!DOCTYPE`; a file over the limits.

Also exported for tests: `parseStyles(xml)`, `parseNumbering(xml)`, `parseTheme(xml)`, `headingLevel(pPr, styles)`, `listInfo(pPr, styles, numbering)`, `effectiveFormat(node, styles, theme)`, `classifyDrawing(node)`, `CODES`.

#### Reading rules

**Styles.** Build a map of style id to `{ name, basedOn, outlineLvl, numPr, b, i, u, strike, vertAlign, font, size, color, jc, spacing }`, resolving `basedOn` chains (guard against loops), over the document defaults (`w:docDefaults`). A paragraph's heading level is the first of:

1. its own `w:outlineLvl` (0 to 8, so level 1 to 9);
2. `w:outlineLvl` anywhere in its style chain;
3. a style in the chain whose `w:name` matches `heading N` without regard to case. Word keeps the English name in `w:name` on a localised install while the id is localised (`berschrift1`, `Titre1`);
4. a style in the chain whose name matches a known localised form: `Überschrift N`, `Titre N`, `Título N`, `Titolo N`, `Kop N`, `Rubrik N`, `Overskrift N`, `Otsikko N`, `Nagłówek N`, `Заголовок N`;
5. a style id matching `Heading N` (LibreOffice and Google Docs exports).

Levels 4 to 9 become level 3 (`changed: headings-deeper`). A paragraph in the `Title` style: the first one with text becomes `info.title` and is not a block; later ones become level 1 headings. `Subtitle` becomes a paragraph. Headings are never guessed from bold or large text.

**Captions.** A paragraph whose style chain holds a style named `caption` (matched by name, as headings are) that comes directly after a picture, kept object or table becomes that block's `caption`; if there is none directly before it and one directly after, it becomes that one's. When both neighbours could take it, its own label chooses: "Table" goes to the table, "Figure", "Fig.", "Diagram", "Chart" and the like to the picture or drawing. A caption that holds a footnote or a link stays a paragraph, because a block's caption is plain text and would lose them. Otherwise it stays a paragraph. `carried.captions` counts those attached.

**Numbering.** `numId` to `abstractNumId` to the level's `numFmt`: `bullet` is a bullet item, `none` is a plain paragraph, anything else is a numbered item. `numPr` may be on the paragraph or in its style chain; `numId` 0 switches numbering off. Level is `ilvl`. For a bullet only, it is raised by one for every 360 twips of extra left indent **measured against the least indented item with the same `numId` and `ilvl` in the same run of list items** (Word's Increase Indent changes the indent and leaves `ilvl` at 0; a whole list dragged along the ruler is not deeper, so it is not raised). A numbered item keeps its `ilvl` whatever its indent: Word goes on counting it at that level, so raising it changed the numbers of the whole list. The built-in List Bullet 2 and 3 and List Number 2 and 3 styles give their depth and belong to the list of their family. Capped at 2 (`changed: lists-deeper`). An empty numbered or bulleted paragraph in a table cell is kept as an item with no text (a numbered column). For numbered items: a different list from the numbered item directly before gives `restart: true`; the same list as the last numbered list, with other blocks between, gives `continue: true`; a `startOverride` gives `restart: true`. A list that is picked up again after a different numbered list cannot be expressed (`continue` means the last numbered list): the item starts at 1 and is reported under `list-numbering`. When a numbered level's format is not `decimal`, `lowerLetter` or `lowerRoman` in the house order, its `lvlText` carries literal text ("Step %1"), or it starts at a number other than 1, the items are reported (`changed: list-numbering`, with block ids), because references in the text such as "see 4(b)" may no longer match. A heading whose style carries numbering sets `options.numberHeadings` and its number is not typed into the text. The template then numbers every heading from 1, so when numbering ends up on and the source left some headings unnumbered, or held `REF`, `PAGEREF` or `NOTEREF` fields (now plain text, and possibly the wrong number), that is reported (`changed: heading-numbers`, with the counts and the block ids of those headings and of the paragraphs that held the references).

**Runs.** Bold, italic, underline, strike and vertical alignment are resolved from the run's own properties, then its character style, then the paragraph style chain. A toggle is off when `w:val` is `0`, `false` or `off`, and on when absent, `1`, `true` or `on`. A run whose font is Consolas, Courier New, Lucida Console, Cascadia Mono or Cascadia Code is `code`. Colour is not carried, with one exception: the `PlaceholderText` style or colour E00000 is `red`, so one of our own exports imports with its prompts intact. Text comes from `w:t`; `w:tab` is a tab; `w:br` is a newline; `w:br w:type="page"` and `w:pageBreakBefore` become a pageBreak block; `w:noBreakHyphen` is a hyphen; `w:softHyphen` is dropped; `w:sym` becomes its character, or `□` when it is in a symbol font's private range (`changed: symbols`). Text set in a symbol font (`w:t` or `w:sym` in Symbol, Wingdings, Wingdings 2 or Webdings) is only a place in that font, so it is mapped to the real character through `SYMBOL_FONTS` (a full Symbol table and the common glyphs of the others); a place with no match becomes `□` and is counted under `symbols` with its block id. **Hidden text** (`w:vanish`, direct or from a style; not `w:webHidden` or `w:specVanish`) is left out with everything the run would show, and quoted (`notCarried: hidden-text`); in a kept text box, where styles are stripped, the run is given `w:vanish` itself so it stays hidden. A run in the `PlaceholderText` style, or inside a content control that is showing its placeholder (`w:showingPlcHdr`), is `red`: an unfilled "Click or tap here to enter text." is a prompt. Adjacent runs with the same formatting are merged.

**Wrappers.** Content controls (`w:sdt`), insertions (`w:ins`, `w:moveTo`), hyperlinks, smart tags and field results are walked as if the wrapper were not there, **and the pictures and drawings rule runs inside all of them**: an `INCLUDEPICTURE` result, a `LINK` or `EMBED` object in a field, or a drawing inside a hyperlink is a picture or kept block like any other.

**Tracked changes.** Insertions are accepted; deletions are dropped (`w:del`, `w:moveFrom`, `w:delText`, and a row whose `w:trPr` holds `w:del`); formatting changes are ignored. Reported once: `changed: tracked-changes` with both counts.

**Comments.** Dropped; `notCarried: comments` with the count and the first five comment texts.

**Hyperlinks.** `w:hyperlink` with an `r:id` to an external http, https or mailto target becomes `link` on its runs. A link to a bookmark (`w:anchor`) keeps its text only (`notCarried: internal-links`); so does a link to a file, a network path or any other scheme, reported apart with its address quoted (`notCarried: other-links`). Both carry the paragraph's block id. A `HYPERLINK` field is treated the same way. `carried.links` counts a link only when some text took it.

**Links on and inside objects.** A picture with a click link (`a:hlinkClick`) to an http, https or mailto address is kept as an object, so the link travels with it. A click link that cannot be carried, or a `w:hyperlink` or `HYPERLINK` field wrapped round a picture alone, is reported with its address (`notCarried: picture-links`). Inside a kept object the body rule holds: a link that fails it is taken off (`a:hlinkClick` removed, `w:hyperlink` unwrapped, a VML `href` removed, a `HYPERLINK` field flattened to its words) and reported with the drawing's name (`notCarried: links-in-drawings`); `INCLUDEPICTURE`, `INCLUDETEXT`, `IMPORT`, `LINK`, `DDE` and `DDEAUTO` fields in a text box are flattened to their result. The words of a link taken off lose the link's look: the `Hyperlink` (and `FollowedHyperlink`) character style is dropped from their runs before the text box is settled, so they do not print blue and underlined. In a carried part's own relationships (a chart's), a refused link keeps its id and points at `about:blank`. The model (`cleanRels`) and the graft (`relsOf`) hold the same line for a hyperlink relationship whatever a project file says: http, https or mailto, or it is written as `about:blank`.

**Linked pictures and objects.** A relationship with `TargetMode="External"` that is not a hyperlink (a linked picture, which is also what an `INCLUDEPICTURE` field leaves behind; a chart's linked workbook; a linked object) is never carried: Word fetches it when the file is opened, and an address on a share hands that share the reader's Windows sign-in. `unlinkOutside` takes it off the kept XML, and off a carried part's XML (parsed, rewritten, serialised again): an `r:link` (or VML `r:href`) attribute is removed, so a picture saved in the file keeps its own copy; a picture that was only the link is removed with the smallest whole piece around it (a `w:drawing`, `w:pict` or `w:object` inside a text box's words, a `pic:pic` in a group or canvas, a VML shape in a `v:group`); a chart's `c:externalData` is removed, so the chart keeps its cached figures; the VML `o:href` address is dropped. A kept picture with nothing left to show, or anything that still names such a relationship where it cannot be taken off (a linked OLE object), is left out. Each address is reported under not carried over: pictures as `linked-pictures` ("A picture linked to a file or web address outside the document was left out, because Word would fetch it when the file is opened. Insert the picture itself if it is needed."), anything else as `linked-objects`, with the address as the example and the block id when the drawing stayed. Defence in depth, for blocks from a project file: `DocModel.normalise` takes an `r:link` off a picture that also has `r:embed` and drops the relationship nothing else names, and points any other such relationship (in a kept block or a part) at the part key `?outside`, which no document has, so the block counts as missing and prints a prompt; the writer (`writeKept`) prints the same prompt for a block, or a part it reaches, that still has one; and the graft (`apply`, `relsOf`) refuses a plan that holds one, naming the block. The only external relationships an export holds are http, https and mailto hyperlinks.

**Fields.** A simple or complex field keeps its result (text as plain text, objects by the rule above; `changed: fields`). A table of contents (a `TOC` field, or an `w:sdt` whose gallery is "Table of Contents") is dropped whole, `options.contents` is switched on, and it is reported (`notCarried: contents`). Its typed heading goes with it and is quoted: a paragraph in the TOC Heading style, or a level 1 heading that says only "Contents" or "Table of contents" directly above it. A `TOC` field with `\c` or `\a` and none of `\o`, `\t`, `\u` is a list of figures or tables, not the contents: it is dropped with a "Table of Figures" or "List of ..." heading above it, quoted, reported as itself (`notCarried: figures-list`), and does not switch `options.contents` on.

A field with no result part draws what it shows from its code, so there is no text to keep. `SYMBOL` becomes its character and `MACROBUTTON` its prompt (both counted under `fields`); anything else, such as `LISTNUM`, `AUTONUM` or `EQ`, is reported with its code quoted (`notCarried: fields-no-text`). `XE`, `TC` and the other fields that never show anything are not counted. A legacy form field is read from its `w:ffData`: a check box becomes ☒ or ☐ and a drop-down its chosen entry; a drop-down with no entries is reported (`notCarried: controls`), unless it sits in another field's code.

**Footnotes and endnotes.** A `w:footnoteReference` becomes a run with `fn`; the note's paragraphs are joined with newlines into one footnote. Endnotes become footnotes (`changed: endnotes`). A picture or drawing inside a note is not carried (`notCarried: objects-in-notes`, with the note's text quoted); the words of a table in a note become lines of the note, cell by cell, and the entry carries a `tables` count. A reference to a note the file does not hold is reported (`notCarried: notes-missing`). `carried.footnotes` counts the notes a run still refers to.

**Embedded chunks.** `w:altChunk` (another file embedded as a chunk) is not carried (`notCarried: embedded-chunks`, with the target part's name).

**Tables.** `w:tblGrid` gives `cols`; when it is missing or shorter than the widest row, the grid is rebuilt from the widest row's cell widths, or equal widths. `w:gridBefore` and `w:gridAfter` become empty cells. `w:gridSpan` gives `span`; `w:hMerge` (restart and continue) gives `span` too; `w:vMerge` restart and continue give `rowSpan` on the first cell, and the continued cells are left out. Rows and cells wrapped in `w:sdt` are unwrapped. `header` is 1 when the first row has `w:tblHeader`, or when every cell of the first row is shaded or every run in it is bold; otherwise 0. Cell shading, borders, widths beyond the grid, row heights and floating position are not carried (house style). A table inside a cell is unwrapped into the cell as paragraphs (`changed: nested-tables`).

**Alignment.** `w:jc` center, right and both become `align`. Indents, spacing, borders, shading, tab stops and frames are not carried.

**Pictures and drawings.** For each `w:drawing`, `w:object`, `w:pict` and `mc:AlternateContent` in a run, and each `m:oMath` or `m:oMathPara` in a paragraph, `classifyDrawing` decides:

| What it is | Becomes |
|---|---|
| A plain picture (`pic:pic`, one embedded blip, no crop, no rotation or flip, no effects, no SVG extension), in line or floating, of type png, jpeg, gif, bmp, emf, wmf or tiff | A picture block with its bytes as media, its size from `wp:extent`, its alternative text from `wp:docPr`. A floating one is put in line at its anchor paragraph (`changed: floating-pictures`). |
| A legacy picture (`w:pict` holding only `v:imagedata`) | A picture block, the same way |
| A picture with a crop, rotation, effects or an SVG extension | Kept, kind `picture`. Preview: its raster blip. A picture both saved in the file and linked (Insert and Link) keeps its own copy; the link is taken off (see Linked pictures and objects). |
| A picture that is only linked (an image relationship with `TargetMode="External"`), kept or plain | Not carried (`notCarried: linked-pictures`, with the address). See Linked pictures and objects. |
| A shape, text box, group or drawing canvas (`wps`, `wpg`, `wpc`, or VML shapes) | Kept, kind `shape`, `textbox`, `group` or `canvas`. `text` holds the words inside. |
| SmartArt (`dgm:relIds`) | Kept, kind `smartart`, with its data, layout, style and colour parts, and the drawing part found through `dsp:dataModelExt relId` in the data part. That id is rewritten in the stored data part and added to the block's `rels`. |
| A chart (`c:chart`, `cx:chart`) | Kept, kind `chart`, with the chart part, its style and colour parts and its embedded workbook. |
| An embedded object (`w:object` with `o:OLEObject`) | Kept, kind `ole`, with the embedding and the preview image. Preview: the image when it is a raster. |
| An equation | Kept, kind `equation`. No parts. |
| An ActiveX or form control (`w:control`) | Not carried (`notCarried: controls`). Active content is never carried. |
| Anything else with a relationship | Kept, kind `other`. |

A drawing in a paragraph that also has text becomes its own block directly after the paragraph's text block (`changed: inline-objects`, with block ids, counted only when the object was in line with text).

**Floating drawings keep their anchor.** A floating drawing is measured from the paragraph that holds its anchor, so where its block goes decides where it prints. The floating drawings of one paragraph become one kept block (kind `group` when there are several), placed before that paragraph's text block; the writer puts the anchor back at the start of the text's own paragraph (4.3). A drawing made of loose floating shapes over a run of wordless paragraphs (blank lines, or paragraphs holding only anchors) is one kept block whose `xml` is whole `w:p` paragraphs: each anchor in its own paragraph, the blank lines between and after, each paragraph stamped with the source's resolved font, size and spacing and `w:keepNext`, so Word lays it out as it did and the lines still meet the boxes. Blank lines after a text paragraph that holds a floating drawing with no wrap are carried the same way (described "Blank lines that left room for a drawing"); other blank lines are dropped as before. A table cell is read the same way: its wordless paragraphs are held and settled when the cell ends, so a diagram drawn in a cell keeps its shape and the cell its height; a numbered paragraph with no words in a cell is never held, because its number is what the cell shows. Every floating kept drawing is counted (`changed: floating-drawings`, with block ids), because the text around it has been restyled and only Word can show the result. Inside a table cell the same rule applies within the cell. Every kept block gets `label` from `wp:docPr` `name` and `descr` (or the VML `alt` or `title`).

**Cleaning a kept object's XML**, without touching the drawing itself. The wrapping run keeps only `w:noProof` of its properties; `w:lastRenderedPageBreak` is removed. Inside any `w:txbxContent` (the DrawingML choice and the VML fallback alike):

1. tracked changes are settled by the rule above; comment marks, bookmarks and footnote references are removed;
2. for every run, `effectiveFormat` resolves font (a theme font reference is resolved to the font's name through the source theme), size, bold, italic, underline, colour (a theme colour to its hex value) from the run, its character style, the paragraph style chain and the document defaults, and writes them as that run's `w:rPr`; for every paragraph it resolves `w:jc`, `w:spacing` and `w:ind` the same way and writes them as its `w:pPr`, with the paragraph mark's `w:rPr` set too, so an empty line keeps its height;
3. then `w:pStyle`, `w:rStyle` and `w:numPr` are removed, because none of those targets exists in the generated file. A numbered paragraph in a text box loses its number (`changed: lists-in-drawings`).

**The parts closure.** Every relationship id in the XML is resolved through the main part's relationships; an internal target is stored as a part and its own `.rels` file is followed, and so on until nothing new is found. External targets are never fetched; only a hyperlink is stored as external (see Linked pictures and objects). A part named `vbaProject.bin` or under `word/activeX/` is never stored. A relationship whose part is missing from the file is reported in one of two ways, and the two are never mixed: when the drawing stayed (kept, with a block id to go to) it is `notCarried: unreadable-part`; when the chart, diagram, object or plain picture had to be left out it is `notCarried: objects-lost`, with no block id, and the sentence does not say it was kept. A theme that cannot be read is `notCarried: theme-missing`.

**Theme.** When the document yields at least one kept object, the main part's theme part and its closure are stored and `project.theme` is set.

**Headers and footers.** Not carried; the house header and footer replace them. `notCarried: headers-footers` quotes the text of each (up to five, 120 characters each) so anything needed can be retyped. A watermark in a header goes with it.

**Sections.** Blocks in a section whose `w:pgSz` is landscape get `land: true`. A next-page section break without a change of orientation becomes a pageBreak block. Columns become one column (`changed: columns`). Page size and margins are not carried.

**Document properties.** `dc:title` fills `info.title` when no Title paragraph did; `dc:creator` fills `info.author`. Nothing else is read from the properties.

**Front matter.** A cover page building block (an `w:sdt` whose gallery is "Cover Pages") is dropped and its text quoted (`notCarried: cover-page`).

**The SolutionsPT front matter** (any report of the assessment or risk tool, this tool's own export, older templates too) is recognised by `houseFront(blocks)`, run on the finished blocks; `houseCover(blocks)` is its first half and is also what the Word preview (`shared/doc-preview.js` `readCover`) uses, so there is one recogniser. It is structural: the cover is a first block that is a table of one column (one row in the reports, two in this tool's) whose first picture is the full-page background (at least 700 by 1000 px), with the kicker, bold title lines, then the client, site and bold line under it (told apart by run size where the file keeps it), the strip of bold labels and values, and the address. Then, past page breaks and empty lines, a heading containing "Document control" over a table with at least three known labels (`CONTROL_FIELDS`: the assessment's, the risk report's and this tool's), then a "Contents" heading and its lines when there is one (this tool's list of links; a contents field was already taken out by the field rule). Those blocks are taken out of the body, report entries about them go with them (an entry left with no block is dropped), the contents option is switched on when a list went, and `info` is filled: the title lines joined (the "Document" row wins), the kicker in sentence case as the type (`sentenceCase`, acronyms kept; "DOCUMENT" fills nothing; the "Document type" row wins), client (not the placeholder "Client"), site, revision and date from the ISSUE value, author, classification, then each known control row ("(not set)" fills nothing; Status is read and not kept). The line under the site is the reference only on this tool's cover (it equals the Reference row, or the table has a Document row); otherwise it and every unknown row are listed as `unused`. This runs after the document properties, so it wins over `dc:title` and `dc:creator`. The removed blocks are stored as `importReport.front = { blocks, fields, unused, contents }` (`model.js` keeps them through `normalise` with ids of their own, `usedKeys` keeps their pictures in the file). `opts.keepFront` (the Word preview) leaves them in place.

Otherwise nothing is guessed or deleted. When page one (before the first page break, at most 12 blocks) has a run of 18 pt or more or a picture or drawing at least 300 px high, and at most 60 words, its blocks and the page break are reported first (`toCheck: cover-like`, with their ids); they are left in the body. When there are other blocks before the first heading, they are reported (`toCheck: front-matter`, with their block ids), because a hand-made cover, a typed document control table and a typed contents list are what most real documents start with, and they now sit after the house cover.

**Other.** Empty paragraphs are dropped (spacing comes from the styles), except those carried with a floating drawing (above). Page breaks that open the document are dropped, and so is the second of two left side by side where a contents list was taken out: the template's front matter ends on a new page itself. Macros in a `.docm` are dropped (`notCarried: macros`).

#### The import report

`report` (also stored as `project.importReport`) is `{ source, carried, toCheck, changed, notCarried, front? }` (`front` as above). `carried` counts headings, paragraphs, list items, tables, pictures, kept objects, captions, footnotes and links. Each entry in the three lists is `{ code, count, examples?, blockIds? }`; the module turns codes into sentences.

| List | Codes |
|---|---|
| `toCheck` (shown first) | `cover-like`, `front-matter` |
| `notCarried` (left out) | `comments`, `headers-footers`, `contents`, `figures-list`, `cover-page`, `internal-links`, `other-links`, `picture-links`, `links-in-drawings`, `hidden-text`, `controls`, `macros`, `fields-no-text`, `objects-in-notes`, `notes-missing`, `embedded-chunks`, `objects-lost`, `unreadable-part`, `theme-missing`, `linked-pictures`, `linked-objects` |
| `changed` (carried, but altered) | `tracked-changes`, `floating-pictures`, `floating-drawings`, `inline-objects`, `heading-numbers`, `headings-deeper`, `lists-deeper`, `list-numbering`, `lists-in-drawings`, `nested-tables`, `endnotes`, `fields`, `symbols`, `columns`, `formatting` (always present: fonts, sizes, colours, spacing and table styling are replaced by the house style) |

Every code has a sentence for one and for many in `import-flow.js`, and a test fails if the reader gains a code without one. A line that says something was kept always points at a block that exists.

The rule for the reader: every branch that drops or alters something adds to one of these lists. A node the reader does not recognise inside a paragraph is walked for text and drawings; a node it does not recognise at body level is walked for paragraphs and tables. So unknown markup loses its wrapper, not its content.

## 5. The module

### 5.1 Files

```
modules/documents/
  module.json                 id "documents", product "OT Cyber Document Tool"
  index.html                  page shell, CSP, one script or link per line   (WP0, then engineer A)
  README.md
  LICENCE.txt                 synced
  css/spt-theme.css           synced
  css/documents.css           shell, sidebar, pages               (engineer A)
  css/editor.css              paper, blocks, toolbar              (engineer B)
  css/tables.css              tables and their controls           (engineer D)
  css/pages.css               information, preview, issue, report (engineer C)
  data/licence.js             generated by scripts/build-data.ps1
  data/document.json          synced from contracts/document.json
  data/document.js            generated: App.Data.contracts.document
  data/demo-document.js       the tour's document (generated, see 6)
  data/AVEVASelect-LogoLockup-Landscape-Positive.png   synced
  vendor/docx.umd.js          synced
  js/version.js host-bridge.js logo.js hero-asset.js   synced
  js/zip-io.js docx-graft.js house-docx.js docx-import.js   synced
  js/product.js               App.Product = { id: "documents", name: "OT Cyber Document Tool" }
  js/model.js                 App.DocModel        (A)
  js/storage.js               App.DocStorage      (A)
  js/pictures.js              App.DocPictures     (A)
  js/app.js                   App.DocApp, window.DocumentTool   (A)
  js/render.js                App.DocRender       (B)
  js/history.js               App.DocHistory      (B)
  js/editor.js                App.DocEditor       (B)
  js/tables.js                App.DocTables       (D)
  js/paste.js                 App.DocPaste        (D)
  js/export.js                App.DocExport       (C)
  js/import-flow.js           App.DocImportFlow   (C)
  js/pages.js                 App.DocPages        (C)
  scripts/build-data.ps1 build-fixtures.ps1 make-fixtures.ps1 build-demo.ps1
  scripts/dump-doc-exports.html   measure-size.html      (not test pages)
  scripts/fixtures/*.docx *.js
  scripts/test-doc-*.html
```

Script order in `index.html`: version, product, host-bridge, logo, hero-asset, vendor/docx.umd, zip-io, docx-graft, house-docx, docx-import, data/document, data/licence, model, storage, pictures, render, history, tables, paste, editor, export, import-flow, pages, app.

**Fixed element ids in `index.html`** (WP0 writes them; everything else is built by script inside them): `#app-header`, `#btn-new`, `#btn-load`, `#btn-save`, `#btn-theme`, `#file-input`, `#save-state`, `#autosave-note`, `#sidebar`, `#nav`, `#outline`, `#main`, `#toolbar`, `#paper`, `#live` (the polite live region), `#toast`, `#modal`. The header buttons are labelled New, Load and Save, as in the other tools.

**Content-Security-Policy**: the review tool's, with `blob:` added to `img-src` so pictures are shown from object URLs: `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; base-uri 'none'; form-action 'none'; object-src 'none'`. Tested in headless Edge, standalone and in a `srcdoc` frame as the suite makes one: `blob:` pictures load, a canvas reads them, the docx library packs and `CompressionStream` works. There is no `connect-src`, so `fetch` of anything, including a `blob:` or `data:` URL, is refused. **Rule: bytes are read with `Blob.arrayBuffer()`, `FileReader` or `atob`, never `fetch`.**

### 5.2 Who calls what

**`App.DocModel` (model.js).** Pure functions on a project object in the memory form; no DOM.

| Function | Purpose |
|---|---|
| `SCHEMA`, `KINDS`, `DOC_TYPES`, `LIMITS` (`{ warnBytes, refuseBytes }`) | constants |
| `create(kind)` | a new project with defaults and one empty paragraph |
| `normalise(obj)` | validates the schema (throws a message for an unknown one), fills defaults, repairs ids; returns the project |
| `newId(doc, prefix)` | next id from `nextId` |
| `make.heading(doc, level, text)`, `make.paragraph`, `make.list`, `make.table(doc, rows, cols)`, `make.picture(doc, mediaKey, w, h)`, `make.pageBreak`, `make.prompt` | block factories |
| `copyBlocks(doc, blocks)` | deep copies with new block ids throughout (cells included); kept blocks keep their `xml`, `rels` and part keys (3.4) |
| `find(doc, id)` | `{ block, list, index, table?, cell? }`: where a block is, including inside a table cell |
| `insertAfter(doc, id, blocks)`, `remove(doc, ids)`, `move(doc, ids, beforeId)`, `replace(doc, id, blocks)` | structural edits; each returns the ids touched |
| `outline(doc)` | `[{ id, level, text, number, count }]` for the sidebar |
| `sectionRange(doc, headingId)` | the ids from a heading to the block before the next heading of the same or a higher level |
| `text(block)`, `runsText(runs)` | plain text |
| `runs.slice(runs, from, to)`, `runs.toggle(runs, from, to, key)`, `runs.insert(runs, at, text)`, `runs.remove(runs, from, to)`, `runs.split(runs, at)`, `runs.join(a, b)`, `runs.normalise(runs)`, `runs.setLink(runs, from, to, url)` | run arithmetic by character offset; the editor never edits runs any other way |
| `table.grid(table)` | the grid with spans resolved: `[row][col] -> { cell, r, c, covered }` |
| `table.addRow(doc, id, at)`, `table.removeRow(doc, id, at)`, `table.addCol(doc, id, at)`, `table.removeCol(doc, id, at)` | keep `cols`, `span` and `rowSpan` consistent: a row or column added inside a span widens it; one removed narrows it, and a cell whose origin is removed hands its content to the next cell of the span |
| `table.setHeader(doc, id, on)`, `table.equalWidths(doc, id)`, `table.nudge(doc, id, col, by)` | header row; widths (`nudge` moves a share of the width to or from the next column) |
| `footnote.add(doc, blockId, at)` | inserts an `fn` run and an empty footnote; returns `{ key, ids }` |
| `footnote.set(doc, key, runs)` | replaces a footnote's runs |
| `promptCount(doc)` | prompt blocks, red runs, missing required fields and missing media, for the sidebar badge (the Issue page uses the build) |
| `addMedia(doc, blob, meta)`, `addPart(doc, blob, meta)`, `mediaUrl(doc, key)`, `releaseUrls(doc)` | media in memory |
| `usedKeys(doc)` | `{ media, parts, footnotes }` reachable from the blocks (parts transitively, plus the theme) |
| `missing(doc)` | the block ids whose media or parts have `missing: true` |
| `fill(doc, other)` | copies Blobs from another project (the saved file) into entries with the same key that are missing; returns how many were filled |
| `sizeOf(doc)` | bytes of media and parts in use |
| `toFile(doc)` | `Promise<Blob>`: the JSON, written in chunks, with only `usedKeys` entries |
| `fromText(text)` | parses, converts to the memory form (3.6) and normalises |

**`App.DocStorage` (storage.js).** The file half is copied from `modules/assessments/js/storage.js:400-640` (`inForeignFrame`, `supportsFilePickers`, `persistHandle`, `restoreHandle` with its test override, `ensureWritePermission`, `forgetProjectFile`, `saveProjectToFile` with its retry and `SecurityError` download fallback), keyed by the document's `id`.

| Function | Purpose |
|---|---|
| `save(doc, { saveAs })` | `Promise<{ name, how: "file" or "download" }>` |
| `openWithPicker()` | `Promise<{ file, handle }>` or null; accepts `.json` and `.docx` |
| `adopt(handle, docId)`, `forget()`, `currentName()` | the remembered handle |
| `download(blob, name)` | plain download |
| `autosave.note(doc, what)`, `autosave.offer()`, `autosave.restore(docId)`, `autosave.discard(docId)` | see 5.9 |
| `bytesStore` | the seam over IndexedDB: `{ putDoc(docId, json), getDoc(docId), putBlob(docId, key, blob), getBlobs(docId), remove(docId), ok() }`, each returning a Promise. Tests replace the whole object with an in-memory one, because IndexedDB never settles in headless Edge. |

**`App.DocPictures` (pictures.js).** `fromFile(file)` returns `Promise<{ blob, type, width, height, name }>` by the rules in 3.5, or rejects with a message. `ACCEPT` is the file input's accept string. The canvas route follows `modules/assessments/js/charts.js:684-712`.

**`App.DocApp` (app.js).** The shell: state, navigation, header buttons, theme, dirty flag, bridge.

| Member | Purpose |
|---|---|
| `state` | `{ doc, page, dirty, tour, recovered }` |
| `go(page, arg)` | pages: `info`, `edit`, `preview`, `issue`, `report`, `about`. `go("edit", { blockId })` opens the editor at a block; `go("edit", { blockIds })` opens it with those blocks selected; `go("info", { field })` focuses a field. |
| `touched(what)` | marks dirty, notes the change for autosave, refreshes the sidebar badge and outline. `what` is `{ blocks: [ids] }`, `{ info: true }`, `{ structure: true }` or `{ media: [keys] }`. |
| `markClean()` | clears the dirty flag after a save or a load; tells the host |
| `setDoc(doc, { from })` | replaces the document (after the unsaved-changes guard), clears history. `from` is `"new"`, `"file"`, `"import"`, `"autosave"` or `"tour"`; it decides the page shown and what happens to the file handle (5.9). |
| `canAdd(bytes)` | false, with a toast, when adding that many bytes would pass `LIMITS.refuseBytes` |
| `toast(text, kind)`, `confirmBox({ title, text, ok, cancel })`, `busy(label, fraction)`, `say(text)` | page-level UI; `confirmBox` returns a Promise and never uses `window.confirm`; `say` writes to the live region |
| `h(tag, attrs, kids)` | the DOM helper every file uses |

`window.DocumentTool` is the test seam, as `window.ReviewTool` is: `{ state, go, load(fileOrText), exportBlob(status), issues(), editor: App.DocEditor.__test }`.

**`App.DocRender` (render.js).** Turns blocks into DOM, for the editor and the preview alike, with `textContent` and `createElement` only.

| Function | Purpose |
|---|---|
| `blockEl(doc, block, { editable, numbers })` | the block's element: `div.blk#blk-<id>[data-block-id][data-type][tabindex=-1]` holding the content. A table block's content comes from `App.DocTables.tableEl`. |
| `runsInto(el, runs, doc)` | writes runs by the DOM contract in 5.3 |
| `runsFrom(el)` | reads an edited element back into runs by the same contract |
| `matches(el, runs)` | true when the element's DOM is exactly what `runsInto` would write for those runs |
| `offsetsOf(el, range)`, `rangeAt(el, from, to)` | selection to character offsets and back |
| `roughHeight(block)` | a height for `contain-intrinsic-block-size`, as the review tool's `roughHeight` (`modules/report-review/js/app.js:1681`) |
| `keptCard(doc, block, n, of)` | a kept object's card (5.3) |
| `coverEl(doc)`, `controlEl(doc, status)`, `contentsEl(doc)`, `shortHeadEl(doc)` | the preview's front matter, drawn in HTML with the same assets and wording as the template |

**`App.DocEditor` (editor.js).** `mount(container)`, `unmount()`, `focusBlock(id, { at })`, `selectBlocks(ids)`, `redraw(ids)`, `selection()`, `run(command, arg)`, `commands` (the names in the keyboard map), `__test` (`type(text)`, `press(key)`, `selectText(id, from, to)`, `dragSelect(fromId, toId)`).

**`App.DocHistory` (history.js).** `record(entry)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `clear()`, `coalesce(blockId)`.

**`App.DocTables` (tables.js).** `tableEl(doc, block, { editable })` draws a table; `controls(doc, block)` returns the table controls for the toolbar; `keydown(event, ctx)` handles Tab, Shift+Tab and arrow movement between cells and returns true when it took the key. Every edit goes through `App.DocModel.table.*`, is recorded through `App.DocHistory.record` and redraws the one table through `App.DocEditor.redraw`.

**`App.DocPaste` (paste.js).** `read(clipboardDataOrDataTransfer, doc)` returns `Promise<{ blocks, inlineRuns?, media, parts, skippedPictures }>`. `fromHtml(html, doc)`, `fromText(text)` and `copyPayload(doc, blocks)` are exported for tests.

**`App.DocExport` (export.js).** `word(status)` builds through `App.HouseDocx.buildDocument` and downloads; `blob(status)` returns the Blob (tests, tour); `issues()` returns the list; `filename(doc, status)`.

**`App.DocImportFlow` (import-flow.js).** `start(file)` runs the import (5.6). It takes no file handle, on purpose. `sentence(entry)` turns a report code into words.

**`App.DocPages` (pages.js).** `info(main)`, `preview(main)`, `issue(main)`, `report(main)`, `about(main)`, `welcome(main)`: each draws one page into `#main`.

### 5.3 The editor

**Layout.** The sidebar holds the page list (Document information, Edit, Preview, Issue and export, Import report when there is one, About) and, on the Edit page, the outline. The main area holds a sticky toolbar and the paper: a white sheet at the page's printed width, styled to match the Word styles (Segoe UI, the heading sizes and navy, table header in navy), so what is typed looks like what prints. A landscape run of blocks is drawn on a wider sheet.

**Editing model: one editable element per text block.** Each heading, paragraph, list item, table-cell paragraph, caption and prompt is edited in its own element; pictures, kept objects, page breaks and tables as wholes are not editable text. This is chosen over one large `contenteditable` because the browser then never restructures the document: it can only change the text inside one block, and every structural change is ours. It is also what makes redraw-one-block possible.

- A text element is not `contenteditable` until it is used: the attribute is set on `pointerdown` or when `focusBlock` puts the caret in it, and removed when the caret leaves. So a 6,000-block document has no 6,000 text boxes for the Tab key or a screen reader to walk through.
- Typing: the browser edits the element; on `input` the block's runs are read back with `runsFrom` and stored, and `App.DocApp.touched({ blocks: [id] })` is called. Then, if `matches(el, runs)` is false (spellcheck or autocorrect wrapped something, a stray `br` or `font` element appeared), the block is redrawn from the runs and the caret is put back from its offsets. Otherwise nothing is redrawn. Nothing is read during an IME composition until it ends, and `keydown` is ignored while `event.isComposing`, so Enter and Backspace inside a composition never split or join.
- Everything else is intercepted in `beforeinput` and `keydown` and done on the model, then the affected blocks are redrawn and the selection is put back from character offsets: Enter (`insertParagraph`), formatting (`formatBold` and so on, and the toolbar), Backspace at the start of a block, Delete at the end, paste and drop.
- The browser's own undo is never used in the paper (`historyUndo` and `historyRedo` are intercepted), because it does not survive a redraw.

**The DOM contract for runs** (`runsInto` writes it, `runsFrom` reads it, `matches` checks it):

| Run | Element |
|---|---|
| plain | a text node |
| `b`, `i`, `u`, `s`, `sup`, `sub`, `code` | `b`, `i`, `u`, `s`, `sup`, `sub`, `code`, nested in that fixed order |
| `red` | `span.red` |
| `link` | `a[data-link]` (no `href`, so it cannot be followed by accident) |
| `fn` | `sup.fn[contenteditable=false][data-fn]` showing the number, with a zero-width space text node on each side so the caret can sit either side |
| newline in `t` | `br` |
| an empty block | one `br` |

`runsFrom` strips the zero-width spaces, treats an unknown wrapper (`font`, `span` without a class) as transparent so its text takes the formatting of the nearest known ancestor, and never reads the text of a `sup.fn`. Typing at the end of a link does not extend it (the caret is moved out of the `a` first). Typing at the end of red text does extend it; the red button or Ctrl+Space clears it.

**Selection.**

- A caret or text selection lives inside one block.
- A selection that leaves its block becomes a **block selection**: whole blocks, highlighted. Ways in: Shift+Up or Down at a block's edge, Shift+click on another block, Ctrl+A a second time, Escape, and **dragging the pointer out of the block it started in**. On `pointermove` with the button down, the block under the pointer is found by `data-block-id`; once it differs from the starting block the text selection is dropped and the blocks from the start block to that one are selected, with autoscroll near the top and bottom edges. Dragging back into the starting block returns to a text selection.
- A selection cannot start in the middle of one paragraph and end in the middle of another. The user guide says so plainly.
- A block selection can be deleted, cut, copied, moved, turned into another block type or flagged landscape, **and takes the inline format commands**: bold, italic, underline, strikethrough, red and clear red apply to every run of every text block in the selection, cells included, as one history entry.
- During a block selection the keyboard focus is on `#paper` (`tabindex="0"`, the paper's single Tab stop), with `aria-activedescendant` on the first selected block, and the live region says how many ("3 blocks selected").
- Clicking a picture, kept object or page break selects it as a block.

**Toolbar** (a `role="toolbar"` with a roving tabindex, as the review tool's panels use): block type (Paragraph, Heading 1, 2, 3, Prompt), bold, italic, underline, strikethrough, superscript, subscript, code, red prompt text, link, footnote, bulleted list, numbered list, indent, outdent, align (left, centre, right, justify), insert (table, picture, page break), landscape page, undo, redo. Buttons show their state for the current selection (`aria-pressed`). When the focus is in a table the table controls appear beside it; when a picture or kept object is selected its controls appear.

**Keyboard map.**

| Keys | Does |
|---|---|
| Enter | Splits the block at the caret. In a heading the new block is a paragraph. In an empty list item: outdents, or leaves the list at level 0. In a prompt: two prompts (at its start an empty paragraph above, at its end an ordinary paragraph below). |
| Shift+Enter | Line break inside the block |
| Backspace at the start | List item: outdent, then become a paragraph. Otherwise join with the block before (a picture, kept object, table or page break before is selected instead of joined). A block with text is never folded into a prompt above it, which would drop its formatting and footnotes: the caret crosses instead, and an empty prompt is removed. |
| Backspace after a footnote number, Delete before it | Removes the reference, as one history entry, and closes its panel. Left and Right cross the number in one press. |
| Enter on a selected picture, kept object or page break with no caption | An empty paragraph after it (`paragraphAfter`). So do its Paragraph after button (which also serves a table and a captioned picture), Arrow Down out of the last row of a table that ends the document, and a click on the empty paper below the last block. |
| Delete at the end | Join with the next text block |
| Up, Down at a block's first or last line | Move to the block above or below, keeping the horizontal position |
| Ctrl+B, Ctrl+I, Ctrl+U | Bold, italic, underline |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+., Ctrl+, | Superscript, subscript |
| Ctrl+Space | Clear red from the selection |
| Ctrl+K | Link: a small panel at the selection with an address field (http, https or mailto only) |
| Ctrl+Alt+1, 2, 3 and Ctrl+Alt+0 | Heading 1, 2, 3; paragraph |
| Ctrl+Shift+8, Ctrl+Shift+7 | Bulleted list, numbered list |
| Tab, Shift+Tab in a list item | Indent, outdent (levels 0 to 2) |
| Tab, Shift+Tab in a table | Next, previous cell; Tab in the last cell adds a row |
| Tab, Shift+Tab in a paragraph, heading, caption or prompt | Nothing. To leave the paper: Escape, then Tab. |
| Ctrl+Enter | Page break after the block |
| Alt+Shift+Up, Alt+Shift+Down | Move the block or the block selection up or down |
| Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z | Undo, redo |
| Ctrl+A | All text in the block; again, all blocks |
| Escape | From text to a block selection of that block (focus moves to `#paper`); from a block selection to the outline entry of its section |
| Enter on a block selection of one text block | Back into its text, caret at the end |
| F6 | Cycle sidebar, toolbar, paper |
| "- " or "* " at the start of a paragraph | Becomes a bulleted item |
| "1. " at the start of a paragraph | Becomes a numbered item |

The body is never empty: deleting the only table, or removing every block from the import report, leaves one empty paragraph in the same history entry. The toolbar's context controls do not change while the pointer is down in the paper (they catch up on release), so the page does not move under a click. In the toolbar the arrow keys move between controls, leaving a text field from the edge of its text and a number field always. Changing a paragraph that holds a footnote to a prompt is refused with a message. A picture is inserted, replaced and resized no taller than a page shows it (`HouseDocx.PAGE`).

Ctrl+K and "/" are not taken for a quick-find in this tool. Ctrl+F is the browser's, and it works over the whole document because every block's text is in the page (5.4).

**Lists.** One block per item, so an item is edited like a paragraph. The marker is a real element, `span.marker[contenteditable=false]`, outside the editable text, holding the text from `App.HouseDocx.listNumbers` ("2.", "b.", "•"). It is real text and not a CSS counter so that a screen reader reads "2. Add a demilitarised zone" and the numbers on screen are, by construction, the numbers Word will show. After any change to a list item (insert, delete, indent, type change, move) the editor updates the marker text of the list items that follow it up to the next block that is not a list item; that is a `textContent` change, not a redraw.

**Tables.** Drawn as an HTML table (`App.DocTables`); each cell holds its own small list of blocks, each editable as above. Merged cells from an imported table are drawn and printed with their spans. Table controls: add a row above or below, add a column left or right, delete the row or column, header row on or off, equal column widths, Narrower and Wider (move 5 percent of the table width from or to the next column), caption, landscape page, delete the table. Arrow keys at a cell's edge move to the neighbouring cell.

**Pictures.** Insert picture opens a file input (`App.DocPictures.ACCEPT`); a picture can also be pasted or dropped. A selected picture shows: width in centimetres (a number field; the height follows), "Fit to page width", alignment, caption, alternative text, landscape page, replace, delete. A picture of a type the browser cannot draw shows a placeholder of the right proportions with its file name and type, and the line "Shown as a placeholder here. It prints in the Word file."

**Kept objects.** Shown as a card: the preview picture when there is one, otherwise a framed placeholder of the object's proportions with an icon for its kind. Under it: its number among the kept objects in reading order and its description ("Drawing 3 of 6. Diagram (SmartArt), 15.2 x 8.9 cm"); its `label` when it has one; any text inside it ("Plan, Do, Check"); and the line "Kept from the original Word file. It prints in the Word export as it was." When it is wider than the page: "It is wider than the page and will be made smaller to fit." What can be done to it:

| Action | Effect |
|---|---|
| Move | As any block: Alt+Shift+Up and Down, or cut and paste |
| Copy, duplicate | A new block with the same content (3.4); made independent at export |
| Caption, alignment | Stored on the block. Alignment applies when it is in line with the text. |
| Landscape page | The `land` flag |
| Replace with a picture | Opens the picture input; the block becomes a picture block of the same printed width. Undo brings the object back. |
| Delete | Removes the block; its parts are left out of the file at the next save when nothing else uses them |

It cannot be edited, resized by hand or put in line in this version.

**Footnotes.** Insert footnote puts a reference at the caret (`App.DocModel.footnote.add`) and opens a small editable panel under the block for the footnote's text. References are numbered in reading order on screen. The panel's text is an editable element like any block, under the same rules, and its edits are history entries. Deleting the reference removes the run; the footnote itself stays in memory (3.3), so undo restores it.

**Paste.** `App.DocPaste.read` looks at the clipboard in this order:

1. `application/x-spt-doc-blocks`: our own copy of blocks (JSON, with the media and part bytes they use and the theme part when under 20 MB in total; over that, the text and pictures' placeholders only, with a message). Pasted through `copyBlocks`. A kept object pasted into a document that already has a theme takes that document's theme; into one without, the pasted theme is adopted.
2. `text/html`, **unless it holds nothing but a single `img`**: parsed with `DOMParser` into an inert document, never inserted into the page, and walked: `h1` to `h6` become headings (4 and deeper become 3); `p` becomes a paragraph; `ul`, `ol`, `li` become list items with their nesting as the level; `table` becomes a table with `colspan` and `rowspan`; `b`, `strong`, `i`, `em`, `u`, `s`, `strike`, `del`, `sup`, `sub`, `code`, and spans whose style says bold, italic or underline, become run formats; `a` with an http, https or mailto address becomes a link; `br` becomes a newline; `img` with a `data:` source becomes a picture. Word's clipboard HTML is handled by name: a paragraph of class `MsoListParagraph...` whose style carries `mso-list: l<n> level<m>` is a list item at level m, bulleted or numbered according to the marker Word puts in its `<!--[if !supportLists]-->` span, which is then removed; `o:p` and conditional comments are dropped. Colours, fonts and sizes are not carried. Scripts, styles, forms and event attributes are never read.
3. Files of an image type: each becomes a picture block through `App.DocPictures.fromFile`.
4. `text/plain`: inside a block, inserted at the caret (newlines as line breaks); with blank lines, split into paragraphs.

HTML comes before image files because Excel puts a bitmap of the copied cells beside the HTML table; taking the image first would paste a picture of a table. A picture in pasted HTML that is not a `data:` source (Word puts `file://` paths there, a web page puts addresses) cannot be read and is not fetched; the page says once "2 pictures could not be pasted. Insert them from a file, or load the Word file to bring everything across." A paste inside a single block of a single paragraph is inserted as runs in that block. Selected text is replaced by what is pasted, in the same history entry; pasted paragraphs still go after the block the caret is in. The limit on pasted HTML is 5 MB of markup, measured without the `data:` picture payloads (each picture is judged by itself against `LIMITS.pictureBytes`), with a ceiling of 60 MB on the raw HTML; over either it is pasted as plain text, and the message says so and says its pictures were left out. Every paste that adds bytes goes through `App.DocApp.canAdd`.

What a paste leaves out or settles is said in the same message, after the pictures sentence, never done silently: Word's comments are left out and counted; a tracked deletion (`del` with `cite` or `datetime`, or inside `span.msoDel`) is left out and the matching insertion is plain text, while a web page's own `del` and `ins` still give strikethrough and underline; a Word footnote or endnote mark becomes a real footnote with the note read from Word's notes list, and one that cannot be matched is counted. Numbered items keep their numbers where the model can say so (a Word list picked up after other blocks is `continue`; `ol start=N` carries on the list that stopped at N-1), and where the number Word typed differs from the one `listNumbers` will print, the message says some items do not have the number they had. Text after a picture, table or inner list inside one `li` is a paragraph, not a new numbered item. An element is hidden only when a declaration of its own says so (`display: none`, `visibility: hidden` or `collapse`, `content-visibility: hidden`), not because another property's name contains those words. A message stays on screen for long enough to read it: about 15 characters a second, at least 4.2 seconds and at most 20.

**Drop.** An image file dropped on the paper becomes a picture at the drop point. A `.docx` or `.json` dropped anywhere on the tool is opened as Load would (the handler calls `preventDefault`, so the host bridge does not also forward it to the suite).

**Undo and redo.** A history of entries `{ label, before: [{ id, index, parent, json }], after: [...], footnotes?: { before, after }, selBefore, selAfter }` at block granularity: the blocks an operation touched, as they were and as they became, with their positions, and the footnotes it changed. Entries are undone strictly in order, so stored positions hold. Undo puts the `before` blocks back and redraws exactly those ids. Typing in one block is one entry until the caret leaves the block, another command runs, or a sentence ends; entries are not split by time. Media, parts and footnotes are never deleted while the document is open, so undo always finds what a restored block refers to. The history holds 200 entries and is cleared when another document is opened. Outside it, by design: the kind, the options and the Document information fields, where Ctrl+Z is the browser's own undo of the field being typed in.

**Outline.** A tree (`role="tree"`, roving tabindex, arrow keys, as the review tool's lists) of the headings with their numbers when numbering is on. Enter goes to the heading. Alt+Up and Alt+Down move a whole section (`sectionRange`). Each entry has a menu: add a section after, delete the section (asks, and can be undone). A count of prompts shows beside a section that has any.

**Screen readers.** A block's wrapper has no role, so the `h1` to `h3`, `p` or `table` inside is what is met, as in the review tool (`app.js:1687`). Headings are real heading elements. List markers are read as text. Pictures have their alternative text; a kept card is a `group` named by its number and description.

### 5.4 Performance

A 300-page document is about 6,000 blocks and may hold several hundred pictures.

- **Every block's text is built at mount**, as the review tool does (`app.js:1691-1711`): text nodes and a few spans for 6,000 blocks is cheap, and it is what lets the browser's find, the outline jumps, "Show" in the import report and "Go to it" in the Issue check land on the real block. `content-visibility: auto` with `contain-intrinsic-block-size` from `roughHeight` keeps unseen blocks out of layout and paint.
- **What is deferred**: picture decoding (`loading="lazy"`, `decoding="async"`, object URLs, drawn at printed size), and making a block editable (on use, 5.3).
- **Redraw one block.** Nothing redraws the paper. Every change names the block ids it touched and `App.DocEditor.redraw(ids)` replaces those elements only. Typing redraws nothing. The outline and the prompt badge are refreshed on a short debounce.
- **Saving.** `toFile` writes the JSON in chunks.
- **Checks.** The sidebar badge uses `promptCount`, a scan of the model. The Issue page and Final use the build, on demand.
- **Export.** One build. The graft pass holds one copy of the file.

`test-doc-speed.html` asserts counts, not time, on a generated 6,000-block document: every text block's words are in the DOM after opening; no element is `contenteditable` until one is used, and then exactly one is; typing a character changes the DOM of one block only; inserting a list item changes one block and the marker text of the items after it; a jump to the last block lands on it; an export has the right number of paragraphs.

### 5.5 Document information page

One page, three cards.

- **Document**: kind (two choices with a one-line description each), title, document type (a field with the suggestions Proposal, Method statement, Report, Procedure, Technical note), reference, client, site or subject, author, revision, date.
- **Document control**: QA review by, authorised by, issued to, issued date, classification. Options: number the headings; add a contents list.
- **File**: the size of the pictures and kept content, and the warning line when it is over the limit.

Fields save on change and blur. The labels, the field helper and the `date` inputs follow `openEngagementModal` in `modules/assessments/js/ui.js:10072-10087`.

Beside the first card is a small picture of the cover (`App.DocRender.coverEl`): a framed miniature of the page under the plain label "Cover as it will print". It is `aria-hidden`, with one line of ordinary text beside it for a screen reader ("Cover: Proposal, Network segmentation proposal, Northfield Water, revision 0.1"). The capitals on it are the Word cover's own, shown as a picture of the page, not labels of the tool. Its strip is drawn from `HouseDocx.stripParts`, so it leaves out a blank author and date as the Word cover does.

The line under each field says where it prints, and follows the kind (`HINTS`). For a short document the document type, reference, site and author say they are not printed and are kept in case the kind changes; the classification prints in the footer for both kinds; the date says an issued date takes its place once set. The miniature for a short document is its opening as ordinary text (the title, then `shortHeadLine`), not a scaled page.

### 5.6 Import

1. Load, or a drop, gives a `.docx` (recognised by its extension or its first bytes, `PK`). If the open document has unsaved changes the usual guard asks first. An import always starts a new document, and **never adopts the Word file's handle**: `setDoc(doc, { from: "import" })` forgets any handle, so the first Save of an imported document is a Save as with a `.json` name. Save can never write over the customer's `.docx`.
2. A progress panel (reading the file, reading the text, reading pictures and drawings) driven by `onProgress`. The read runs in steps that yield, so the page stays responsive.
3. `App.DocxImport.read` returns the project and the report. The document information fields the file could fill are filled; the kind is `report`.
4. The Import report page opens:
   - a summary line: "Brought across: 212 paragraphs, 31 headings, 8 tables, 14 pictures, 6 drawings and diagrams kept as they were, 9 captions, 3 footnotes.";
   - when `front` is set, the first card, **SolutionsPT cover and document control recognised**: what went into Document information, what had no place, and **Keep the original pages instead**, which puts `front.blocks` back at the top of the body as one history entry (Undo takes them out). Whether they are in the body is read from the body, so the card follows Undo and Redo. When they are, the card offers **Use the current template's pages**, which stores their current copies on `front`, removes them (one history entry) and fills only the Document information fields still empty;
   - for `cover-like`, a card **The first page looks like a cover** with **Show** and **Remove these blocks** (one delete that Undo brings back);
   - **Check first** (`toCheck`): "The original starts with 9 blocks before its first heading. This is often its own cover, document control table or contents list, which the template now provides. Check whether you still need them." with **Show** (`go("edit", { blockIds })`, which selects that range in the editor) and **Remove them** (one delete that Undo brings back);
   - **Not carried over**: one entry per `notCarried` code with its count and the quoted examples, for example "Headers and footers were not carried over. The SolutionsPT header and footer replace them. The original said: ...";
   - **Carried over with changes**: one entry per `changed` code, each with "Show" links that go to the blocks concerned;
   - **Pictures and drawings**: one row for each kept object and each picture shown as a placeholder, drawn from the model: its number ("Drawing 3 of 6"), kind, label, caption, size, the heading it sits under and a Show link. Above the list: "Drawings kept from the Word file cannot be shown here. Export a draft and open it in Word to see them." and the button **Export a draft to check in Word**;
   - a button "Go to the document", and a note that this page stays available in the sidebar.
5. Nothing is ever dropped without an entry here.

A file that cannot be read gives one message that says why (4.4) and the open document is left as it was.

### 5.7 Preview

The preview is drawn directly from the model by `App.DocRender` with `editable: false`: the cover, document control, the contents list, then the body on sheets, with page breaks and landscape runs shown. It is not the Word file read back, which is what the risk tool's Report page does. Reasons: here the blocks are the source, so reading them back from a file adds nothing but cost; a rebuild and unzip of a 300-page document on each visit is slow; and kept objects could not be shown from the file any better than from the model. What the risk tool's approach guarantees, that the screen and the file say the same thing, is covered instead by a test: `test-doc-round.html` exports documents and reads them back with `App.DocxImport`, and the blocks must match.

The page says once, at the top: "A preview. Word decides where pages break. Drawings kept from an imported file are shown as placeholders here and print in the Word export as they were."

The footnotes referred to on a sheet are listed at its end, under a short rule, each once and with its reference's number (a sheet can cover several Word pages, which the note above already says). A contents entry is a link in the Word file and acts as one here: click or Enter scrolls to its heading and moves focus to it. Body blocks sit inside the sheet's margins, in line with the contents sheet. Headings, prompts and contents entries are styled as Word prints them (heading text regular with the number bold, the prompt bold and upright, contents entries not underlined).

### 5.8 Issue check, Draft and Final

The Issue and export page:

- **Still to complete**: the list from `App.DocExport.issues()`, which is the build stopped before packing, exactly as in the assessment tool. Each entry quotes the red text and has "Go to it": a `block` goes to the editor at that block, an `info` goes to the field. A picture or drawing that could not be restored appears here too, because the writer prints a prompt in its place (4.3). Empty when nothing is outstanding.
- **Worth a look** (never blocks): for a report, a blank author (`blank-author`), blank QA review by, authorised by, issued to or issued date (the issued date's line adds that the cover prints no date when Date is blank too), and a cover with more text than its page holds (`cover-long`, from `coverFits`); pictures without alternative text; a table wider than six columns on a portrait page; drawings wider than their space, which will be made smaller with the text inside them (`fitted`); pictures and in-line drawings taller than a page, by the writer's own `fitPx` (`tall`); list numbering and heading numbers that changed at import (`list-numbering`, `heading-numbers`, each with Show).
- **Export**: Draft or Final (two radio buttons), and "Export Word". Draft carries the watermark and Status Draft. Final carries Status Final, opens read-only and is marked as final, and is refused while anything is still to complete: the button is disabled with the reason beside it, and the writer refuses too.
- The file name: client, title and revision, with "-draft" for a draft, as `docxFilename` does (`export-docx.js:7313`).

Export is a download, as in the other tools.

### 5.9 Files

- **The project file** is JSON with `schema: "spt-document/1.0"`, suggested name `<title> <revision>.json`. Save writes in place where the browser allows (File System Access API); Shift+click is Save as; otherwise, or on a `SecurityError`, it downloads. **Save is never refused.**
- **The file handle**, exactly as the assessment tool treats it (`ui.js:949-952`, `:966`; `storage.js:586-597`):

  | How the document arrived (`setDoc` `from`) | Handle |
  |---|---|
  | A project file opened through the picker, once the load has succeeded (`"file"` with a handle) | adopted: Save writes back to that file |
  | A project file from the plain file input, a drop, or the suite | forgotten: the first Save is a Save as |
  | New (`"new"`), an import (`"import"`), a restored autosave copy (`"autosave"`), the tour | forgotten |

- **Load** accepts `.json` and `.docx`, through the picker where allowed and a plain file input otherwise (in the suite's folder build file dialogs are refused in a tool's frame). A project file opens; a Word file starts an import; a JSON file of another tool gets a message naming the tool that reads it.
- **Autosave** lives in IndexedDB, not `localStorage`, because `localStorage` is about 5 MB for the whole origin and is shared with the other tools' autosave copies on `file://` and in the suite.
  - Through `DocStorage.bytesStore`: one record per document id for the document without bytes (`putDoc`, on a debounce after each change), and one record per media or part key for its Blob (`putBlob`).
  - **Bytes are written when they arrive and stay for as long as the copy exists.** After an import, an insert or a paste, the new Blobs are written. After a project file is opened, all its Blobs are written in the background. A Save does not remove them. The copy for a document (record and bytes) is removed only when that document is closed with nothing unsaved (New or Load of another after a save), or when the user declines the offer.
  - `localStorage` holds only a small pointer per copy (`spt-document:autosave:v1`: id, title, time, whether newer than the last save), which is what the offer on start reads.
  - **No caller waits for the store.** Every `bytesStore` call is fire-and-forget with its rejection handled; Save, insert and import never await it. If the store reports an error or is not there, the header says "Autosave is off. Save often." (`#autosave-note`) and nothing else changes.
  - On start, a copy newer than the last save is offered, never applied silently.
  - **A restored copy is checked.** `App.DocModel.missing(doc)` lists blocks whose media or parts did not come back. If there are any, the document opens marked incomplete (`state.recovered`): a banner says "3 pictures or drawings could not be restored from the autosave copy." with **Bring them back from the saved file** (pick the project file; `App.DocModel.fill` copies the bytes across by key) and the blocks show as "could not be restored" placeholders. The handle is never re-adopted for a restored copy, so Save is a Save as and cannot write the incomplete copy over the good file; the Save as dialog says how many are missing first. Final is refused through the Issue check (4.3) until they are restored, replaced or deleted.
- **Filling from the saved file** takes an entry only when it agrees: the same key and the same type, name, width and height (a part: name and content type). Two files can share an id and their keys without being the same document, and one's picture must never be put into the other. `App.DocModel.fill` enforces it and the shell says "Nothing was taken from that file: its pictures are not the ones missing here." What is brought back is unsaved work: the document is marked dirty.
- **Save as into another file makes a document of its own.** When the chosen file is not the one the document came from (`isSameEntry`, else the name), the file is written with a new id (`App.DocModel.newDocId`), and the open document takes it only once the write has succeeded; the result carries `oldId`. The shell moves the autosave copy, the per-window lock and the Draft or Final choice (`App.DocPages.moved`) to the new id. A document never saved, and a download, keep their id.
- **A save is a snapshot.** A change counter is read when the text is taken for the file (`onSnapshot`); if it has moved by the time the write ends, the document stays dirty, the autosave copy stays the newer one, and the message says to save again.
- **More than one window.** Each window holds a shared Web Lock `spt-document:open:<id>` for its document (`autosave.own`; the seam is `DocStorage.locks`). A window never offers, clears, trims or discards the copy of a document open in itself or in another window (`autosave.check`), and a discard is skipped when the copy has changed since the offer was made. With no pointer for the open document, the next write puts every picture and part back. Where locks do not answer (headless Edge), a window behaves as before and that repair covers it.
- **Unsaved changes.** `touched`, `markClean`, the Save button's state and `beforeunload` follow `modules/report-review/js/app.js:170-189` and `3436-3440`.
- **Suite.** `App.HostBridge.register({ openFile, openText, applyTheme, loadButton })` as in `modules/report-review/js/app.js:3441-3447`; `setDirty` on every change of the dirty flag; `recent` on save and open with `kind: "Document"` and the title as the label. Every call is guarded with `if (window.App.HostBridge)`. The tool hides its theme toggle when hosted with no code (`shared/spt-theme.css:85`).
- The suite can route the project file but not a `.docx`: its file plumbing is text only. A `.docx` is opened with the tool's own Load or dropped on the tool. A file over the suite's 100 MB limit is not read there: its first 512 bytes are enough to see it is a document file, and the message says to open it with Load in the document tool.

## 6. Suite integration checklist

New files outside the module:

| File | What |
|---|---|
| `shared/zip-io.js`, `shared/docx-graft.js`, `shared/house-docx.js`, `shared/docx-import.js` | section 4 |
| `contracts/document.json` | written |
| `packaging/single-html/check-single-html-documents.html` | parity check, from `check-single-html-review.html`; also runs the import, insert and export under a `securitypolicyviolation` listener and expects none |
| `packaging/electron/app/selftest-documents.js` | exe self-test, from `selftest-report-review.js`: start, version badge, load the demo, export a Word file and check it is a zip with a cover, the unsaved-work question |
| `tools/word-open-check.ps1` | section 7 |
| `docs/document-tool.md` | user-facing description, as `docs/report-review.md`, with the follow-ups list |

Edits to existing files:

| File | Edit |
|---|---|
| `shared/sync.json` | Add `modules/documents/...` targets to: `LICENCE.txt`, `version.js`, the logo PNG, `host-bridge.js`, `brand/logo.js`, `brand/hero-asset.js`, `vendor/docx.umd.js`, `spt-theme.css`. Add four entries for the new shared files (to `modules/documents/js/`) and one for `contracts/document.json` (to `modules/documents/data/document.json`). Then `tools/sync-shared.ps1`. |
| `.gitignore` | `!/packaging/single-html/check-single-html-documents.html` |
| `platform/suite.json` | A fourth entry in `modules` (text below). Then `platform/scripts/build-data.ps1` and commit `platform/data/suite-data.js`. |
| `platform/js/suite.js` header comment (8-11) | name the document tool's file |
| `platform/js/suite.js` `ICONS` (640) | `documents`: a page with a folded corner and a pencil: `["M5.5 3h8l5 5v4.5", "M13.5 3v5h5", "M5.5 3v18h6", "M8.5 12h5", "M8.5 15.5h3", "m14 20.5.6-2.9 5-5 2.3 2.3-5 5z"]` |
| `platform/js/suite.js` `fileKind` (353) | `if (/^spt-document\//.test(s)) return { module: "documents", what: "document file" };` before the `schemaVersion` line |
| `platform/js/suite.js` (412-416) | The "was left out: open one project file at a time" note reads "open one document file at a time" when the file is a document file |
| `platform/js/suite.js` wording (410, 799-829, 899) | "Project file, review pack or review file" becomes "Project file, document file, review pack or review file" in the picker description, the button title, the empty Recent files text and the drop tip. The refusal for a `PK` file becomes "... is a Word or Excel file, which the suite does not open. To put a Word file into the SolutionsPT template, open it with Load in the OT Cyber Document Tool." |
| `platform/js/suite.js` `helpCard` (870) | After the review steps, one more step with no arrow: the document tool, "Proposals, method statements and other documents in the SolutionsPT template, written here or brought in from a Word file. It works on its own: no file passes between it and the other tools." |
| `platform/js/suite.js` `recentKind` | "Document" for the documents module |
| `platform/css/suite.css` (33, 76, 93) | `--tool-documents: #A8326E; --tool-documents-tint: #F6E6EE;` and dark `#E58BB9`, `#3A1F2D`; `[data-module="documents"] { --tool: var(--tool-documents); --tool-tint: var(--tool-documents-tint); }`. Contrast on its tints is about 5.2:1 light and 6.2:1 dark. |
| `platform/css/suite.css` (251, 447) | `.tool-grid` becomes `repeat(2, minmax(0, 1fr))`: four cards as two rows of two, so no card sits alone. The 900 px rule (one card per row) stays; the comment above it is updated. |
| `platform/scripts/test-shell.html` (85, 109, file kinds) | four tools, four rail buttons, the fourth card's text, the grid has two columns at 1200 px, `fileKind` for `spt-document/1.0`, the new help step, the document wording of the "one at a time" note |
| `packaging/single-html/check-single-html-suite.html` (127-130, 157, 162) | four cards with a tour each, payload list `assessments,assessments-tour,risk-assessment,report-review,documents`, the documents payload equals its own single HTML |
| `packaging/electron/app/selftest-suite.js` (117-119, 155) | four card names and `home.tours === 4`; the payload list; `home.help === 4`; `risk.tabs === 4`; open the document tool and check it starts |
| `packaging/electron/app/main.js` (121-125) | wording for `documents`: "Changes since your last Save are not in your document file. The tool will offer its autosave copy next time it starts, but only Save updates the file itself." |
| `CLAUDE.md` (13, and the version proofs) | the docx library is synced into the assessment, risk and document tools; `test-doc-version.html` is the document tool's version proof |
| `README.md` (13, 28), `docs/platform-architecture.md` (layout, contracts and release tables, stage 4), `packaging/electron/README.md` (5), `shared/version.js` header comment (4-6, then sync) | name the fourth tool |
| `shared/LICENCE.txt` | title names two tools today; see section 9 |

Checked and needing no edit, because they read `module.json`: `packaging/module-info.ps1`, `tools/build.ps1`, `tools/release.ps1`, `packaging/single-html/build-single-html.ps1`, `tools/run-check.ps1`, the download filters in `main.js`, `build-splash.ps1`. Because `build.ps1 -Module all` and `release.ps1` pick the module up as soon as `module.json` exists, and `build-single-html.ps1` throws on a missing `inlineExtras` file, WP0 creates every file `module.json` names.

`platform/suite.json` entry:

```
{
  "id": "documents",
  "shortName": "Documents",
  "navLabel": "Write",
  "summary": "Write proposals, method statements, reports and other documents in the SolutionsPT template, or bring in a Word document and have it rebuilt in the template with its pictures and diagrams kept.",
  "useWhen": "Use it for any document that is not an assessment or risk report but should look like one. Start a new document or load a Word file, fill in the document information, edit, then export a Word file as a draft or a final. Anything from an imported file that could not be carried over is listed for you.",
  "tour": { "launch": { "tour": true }, "label": "Take the tour", "note": "A short demo proposal with a table, a picture and a diagram kept from Word. Its changes are never kept." }
}
```

`modules/documents/module.json`: copy the review tool's and set `id` "documents", `product` "OT Cyber Document Tool", `tests.pages` "scripts/test-doc-*.html", **`tests.virtualTimeMs` 900000 and `tests.timeoutSec` 600** (the assessment module's figures, since these pages build Word files from large documents), `singleHtml.parityCheck` "check-single-html-documents.html", `singleHtml.inlineExtras` `["data/demo-document.js"]`, `electron.appId` "com.solutionspt.ot-cyber-document-tool", `electron.packageName` "ot-cyber-document-tool", `electron.selfTest` "documents".

**Tour.** `launch.tour` opens `data/demo-document.js`, a demo proposal with every block type, one prompt left to complete (so the Issue check has something to show), and one kept SmartArt diagram. It is produced by `scripts/build-demo.ps1` from `scripts/fixtures/demo-source.docx` through the importer in headless Edge, using the dump pattern in section 7, so the demo exercises the real import. `build-demo.ps1` sets `info.author` to "A. Consultant" explicitly. As in the other tools, a tour's changes are not saved, not reported as dirty and not put in Recent files.

**Release notes.** `docs/releases/v0.7.0.md` is written when the version is bumped, not before: the suite shows the newest file in that folder as "What's new". Until then the draft notes live at the end of `docs/document-tool.md`.

## 7. Test plan

All pages are headless-Edge pages under `modules/documents/scripts/`, named `test-doc-*.html` (short names), using the harness at the top of `modules/report-review/scripts/test-review-app.html`. None asserts wall time. `confirm` and downloads are stubbed, and `App.DocStorage.bytesStore` is replaced by an in-memory object in every page that loads the app.

| Page | Owner | Proves |
|---|---|---|
| `test-doc-zip.html` | WP2 | `ZipIO.write` then `read` returns the same names and bytes; CRC values against known vectors; stored and deflated entries; a library-packed file re-zipped has identical parts and no directory entries; the limits reject a zip that declares too much. |
| `test-doc-graft.html` | WP2 | On hand-built plans: the token is gone and the XML is present byte for byte; carried parts are named `word/kept/p<n>.<ext>` whatever the source name (a source part named with a space and an ampersand); a link target containing `&` gives well-formed XML; content types and relationships are present; `docPr`, VML shape ids and `ObjectID`s are unique. `unshare`: a copied picture and text box share their image part; a copied chart gets its whole closure cloned; copied SmartArt gets its own data and drawing parts with `relId` rewritten; a copied embedded object shares its embedding and gets new ids; a plan forced to share a chart part throws `SharedPartError`. The theme part is added once, with relationship and Override. `scaleXml` on DrawingML and VML. Non-PNG media renamed and typed. |
| `test-doc-house.html` | WP1 | Each kind builds. Report: a cover section with zero margins, document control rows in order, header with the logo, three-cell footer. Short: no cover, title block. Draft: a watermark in every header and on the cover. Final: `documentProtection`, `_MarkAsFinal`, Status Final; refused with a prompt outstanding. Styles hold Heading 3. The contents list links resolve to bookmarks. **A project built through `buildDocument` has a cover section whose XML equals `cover()` fed the same values directly**, which ties `coverInput` and `controlPairs` to the template. Dates print as stored. |
| `test-doc-writer.html` | WP1 | Every block type and run format in the written XML: `listNumbers` cases (continue, restart, levels, markers) and the numbering references and instances that follow; `gridSpan` and `vMerge`; column widths sum to the page; a picture clamped to the page and to a cell, with its alt text; captions; footnotes with Segoe UI 9 pt on every run; links; landscape sections; page breaks; a prompt in `PlaceholderText`; a red run in E00000. Kept blocks: one plan entry per use, `scale` set when wider than the page or cell, `theme` passed. Missing media and missing parts print a prompt and no token. |
| `test-doc-import.html` | WP3 | The text fixtures: heading levels by outline level, by style chain, by localised name and by id; Title to `info.title`; list kind, level, restart and continue, the indent cases (one item indented, a whole list indented) and `list-numbering`; runs and toggles (`0`, `false`, `off`); links; footnotes and endnotes; captions attached; tables with merges (`vMerge`, `gridSpan`, `hMerge`), `gridBefore` and `gridAfter`, a missing and a short `tblGrid`, rows and cells in `w:sdt`, a deleted row, header detection and widths; alignment; tracked changes accepted; comments, headers, footers, contents and cover page reported with quotes; `front-matter`; landscape; columns; a main part named `word/document2.xml`. |
| `test-doc-import-art.html` | WP3 | The art fixtures: PNG, JPEG, EMF, TIFF as picture blocks with sizes; a cropped picture, SVG, shapes, a text box, a group, SmartArt, a chart, an embedded object and an equation as kept blocks with the right kind, label, parts closure and preview; the SmartArt `relId` rewritten; `effectiveFormat` written onto text box runs (from defaults, from a style chain, from a theme font) and the style references gone; the theme stored; a picture inside a field result, a hyperlink and a content control; an object in a footnote and an `altChunk` reported; external relationships stored; controls and macros reported and not stored. |
| `test-doc-safe-file.html` | WP3 | Hostile files: a `DOCTYPE`; a zip that declares huge sizes; a Strict Open XML file refused with its message; kept XML and file names holding markup come back as text; external targets are stored and never requested. |
| `test-doc-model.html` | WP4 | `normalise` (defaults, unknown schema refused, unknown block type kept), ids never reused, run arithmetic, `copyBlocks`, table edits keep spans consistent, footnotes kept in memory and pruned by `toFile`, `toFile` and `fromText` round trip between the two forms, `missing` and `fill`, `canAdd` at the limits, and that a document over the limit still saves. |
| `test-doc-app.html` | WP4 | New, Load of a project file, Load of a `.docx` starts an import, a foreign JSON is refused by name. Handles: adopted after a picker load, forgotten after New, a file-input load and an import; **the first Save after an import is a Save as with a `.json` name and the stubbed `.docx` handle is never written**. Autosave with the in-memory store: **save, edit, reload, restore gives every media Blob back**; a store with bytes removed gives the incomplete banner, a Save as and no handle; `fill` from the saved file clears it; a failing store shows "Autosave is off" and Save still works. The dirty flag and `beforeunload`, bridge registration against a fake host, the theme toggle hidden when hosted, the tour never dirty. |
| `test-doc-editor.html` | WP5 | Through `__test`: typing, formatting, split and join, lists and their shortcuts and markers, picture insert with a tiny PNG, kept object actions (copy, replace, delete and undo), block selection and move, format commands on a block selection, footnotes (add, edit, delete the reference, undo), undo and redo of each. The DOM contract: typing beside a footnote marker stays outside it; typing at the end of a link does not extend it and at the end of red text does; an emptied block; a simulated `insertReplacementText` that leaves a `font` wrapper is read correctly and the block is redrawn; keys during a composition are ignored. |
| `test-doc-keys.html` | WP5 | The keyboard map; roving tabindex in the toolbar and outline; the paper is one Tab stop; Tab in a paragraph does nothing and Escape then Tab leaves; a pointer drag across blocks gives a block selection (`dragSelect`); `aria-activedescendant` and the live line during a block selection; focus is never lost when a block is redrawn or deleted; Escape and F6; every control has a name. |
| `test-doc-speed.html` | WP5 | The counts in 5.4. |
| `test-doc-tables.html` | WP5b | Table drawing with spans; every table control; Tab and arrow movement; undo of each. |
| `test-doc-safe-paste.html` | WP5b | Pasted HTML with scripts, event attributes and `javascript:` links; the clipboard order (HTML with a table beside an image file gives a table; a lone image gives a picture); recorded samples of Word and Excel clipboard HTML (lists, table, formatting) as fixtures in the page; web HTML; plain text; our own blocks, with a kept object. |
| `test-doc-pages.html` | WP6 | Document information saves on change; the cover miniature and its text line; the import report's sentences for every code, the front-matter Show and Remove, the Pictures and drawings list and its links; the preview shows cover, control, contents and landscape sheets. |
| `test-doc-issue.html` | WP6 | The Issue list equals what prints red in the exported file (read back from the XML), for prompts in blocks, in cells, in missing fields and for missing media; `promptCount` agrees with it; "Go to it" lands on the block or field; Final is refused and then allowed. |
| `test-doc-version.html` | WP6 | No export, of any kind, draft or final, contains the version number, its label or the product name, in any XML part or property. Run on a new document and on an imported fixture. |
| `test-doc-fixtures.html` | WP8 | No committed fixture and no `data/demo-document.js` holds personal data: every `core.xml` creator and last-modified-by is the stand-in, there is no `word/people.xml` and no `userId`. |
| `test-doc-round.html` | WP9 | Import each fixture, export, import the export: the same blocks (types, levels, text, spans, list flags, captions), the same number of kept objects, every carried part byte for byte equal. A `securitypolicyviolation` listener sees nothing during an import, an insert and an export. This is the guard on the direct preview too. |
| `test-doc-fix-*.html` | after the review | One page for each group of review fixes, each assertion one that failed before its fix: `-template` (the cover on one page, heading numbers, the footer's classification, the strip, the contents list, the file's properties, characters XML cannot hold, tall pictures, lists that open below their top level, and from the second round the cover strip's label and value pairs and the short document's issued date in Word); `-floats` (floating drawings anchored where they were, a diagram of loose shapes kept whole, scaled text boxes); `-import` (hidden text, symbol fonts, numbered cells, list styles and resumed lists, the contents heading, form fields, content control prompts, links, fields with no text, what is lost against what is kept, captions, notes, and from the second round a diagram of loose shapes in a table cell, linked pictures and objects left out, a removed link's look in a text box, and the model, writer and graft refusing what slipped through); `-paste` (Word's comments, tracked changes and footnotes, large pastes, list numbers, hidden elements, a damaged or hand-made project file); `-editor` (the toolbar under the pointer, Enter in a prompt, writing after a table or picture, footnote marks, joins, toolbar keys, the landscape view, and from the second round the toolbar keeping one height whatever the caret is in); `-pages` (the short document's line and hints, the preview's margins and footnotes, Worth a look); `-storage` (edits during a save, offers and discards with two windows, Save as, bring back, the suite's size limit); `-int` (what crossed files: kept objects taller than a page, a leading page break, links in kept drawings, the outline's numbers, stored text, `fill`, one note one reference, the screen's cover strip, Worth a look, the last block removed from the import report, picture heights in the editor, message time, the Draft or Final choice after Save as). |

**Template parity**: `modules/assessments/scripts/test-house-parity.html` (WP1). It lives in the assessment module because it needs the assessment exporter; it loads `../../../shared/house-docx.js` directly. It builds a posture report with fixed engagement values and a `HouseDocx` report with the same values (kicker "OT CYBER SECURITY ASSESSMENT", the same title lines and size 60, client, site, revision, date, author, classification, the same footer centre text), unzips both and asserts, after replacing media file names and relationship ids with placeholders: `word/styles.xml` is identical except for the added Heading 3 style; the header part is identical; the footer part is identical; the cover's paragraphs, table properties and first-cell margins are identical, paragraph by paragraph (the cover differs on purpose in being two rows of exact height where the assessment has one row and a spacer; the page's header lists that and the other deliberate differences: the strip leaves out an empty date and author, the footer's left cell follows the classification, the file's properties never say "Un-named", and text is cleaned of characters XML forbids); the section properties of the cover, portrait and landscape sections are identical; the first seven rows of the document control table are identical; the draft watermark runs are identical; a Final has the same protection and custom property; **the cover background and logo media parts have the same bytes (compared by hash) and the same extents**; and **a document tool bullet at level 0 has the same left and hanging indent and the same glyph as an assessment `bullet()` paragraph**. Run it whenever either file's template code changes.

**Fixtures** (`modules/documents/scripts/fixtures/`, WP8). A test page cannot read a file from disk, so each `.docx` is committed beside a generated `.js` wrapper (`window.Fixtures["fx-text"] = "<base64>"`) made by `scripts/build-fixtures.ps1`. Both are committed; each is small.

| Fixture | Made by | Holds |
|---|---|---|
| `fx-text.docx` | Word COM (`scripts/make-fixtures.ps1`, from the prototype `mkfixture.ps1`) | Title, Heading 1 to 4, a custom style based on Heading 2, mixed formatting, external and internal links, a footnote and an endnote, bullets and numbers with nesting, a restart and a continued list, an indented item, a list starting at 5 with letters, captions under a picture and a table, a table with a merged cell and a header row, alignment, a page break |
| `fx-art.docx` | Word COM | PNG, JPEG and EMF pictures, a floating picture, a cropped picture, two shapes with text, a text box, SmartArt, a chart, an embedded Excel sheet, a chart wider than the page |
| `fx-vector.docx` | Word COM (from `mkfixture2.ps1`) | SVG and TIFF pictures, an equation |
| `fx-theme.docx` | Word COM | a document theme with accent 1 `C00000` and minor font Georgia; a shape filled with accent 1; a text box in the default font |
| `fx-review.docx` | Word COM | tracked insertions and deletions, comments, header and footer text, a table of contents field, a hand-made cover and a control table before the first heading, a landscape section, two columns |
| `fx-float.docx` | Word COM | floating drawings in real positions: a square-wrapped box beside a paragraph, a page-relative text box, and a diagram of nine loose shapes and lines over fourteen blank lines with a caption under it. Its `.expect.json` is written from Word's readings. `build-fixtures.ps1` refuses a fixture whose paragraph-relative offsets pile its shapes at the top of the page (below 0 or above 5 cm) |
| `demo-source.docx` | Word COM | the tour's source |
| Built in the test page with `ZipIO.write` from XML strings | | a localised file (style id `berschrift1`, name `heading 1`); a heading by outline level alone; LibreOffice-style and Google-Docs-style markup; a `wpg` group; a Visio-style `w:object` with an EMF preview and a stub `.vsdx` part; a linked picture; a main part named `document2.xml`; a Strict file; the table cases; a picture in a field result; an `altChunk`; a part named with a space and an ampersand; a link target with `&`; a `.docm` with a `vbaProject.bin`; a control; a file with a `DOCTYPE`; a zip declaring huge sizes |

**Fixtures carry no personal data.** Word stamps the maker's name into `docProps/core.xml` and, for some content, a directory id into `word/people.xml`; the prototypes had both. `make-fixtures.ps1` sets the author to the fixed stand-in "Fixture Author" and calls `RemoveDocumentInformation(99)` (`wdRDIAll`) before each save. `build-fixtures.ps1` refuses to wrap a `.docx` whose creator or last-modified-by is not the stand-in, or that contains `word/people.xml` or a `userId`. `test-doc-fixtures.html` asserts the same on what is committed. `make-fixtures.ps1` follows the Word safety rules below and is run by hand on a machine with Word, not by the test suite.

**The Word-opens-it check**: `tools/word-open-check.ps1 [-Folder <dir>] [-DumpPage <page.html>] [-TimeoutSec 240]` (WP8, from the prototypes). Not part of the headless suite. It is the release gate for the document tool: the headless tests cannot prove Word opens a file.

- Getting the files. `tools/run-tests.ps1` cannot pass a query string and a headless page cannot write files, so the suite's existing pattern is used (`modules/report-review/scripts/build-demo-pack.ps1:33`): `modules/documents/scripts/dump-doc-exports.html` (WP9; not matched by the test glob) builds every export worth checking and prints each as `<pre data-name="..." data-expect='{...}'>base64</pre>`. With `-DumpPage`, the script runs that page in headless Edge with `--dump-dom`, decodes each `pre` into a temp folder and checks that folder. `run-tests.ps1` is not changed. `build-demo.ps1` uses the same pattern.
- What the dump page builds: each fixture imported and exported as a draft and as a final; the 6,000-block document; a document with a copied chart, a copied SmartArt diagram and a copied embedded object; the themed fixture; the wide chart; a kept object in a table cell on a landscape page.
- Word safety rules it keeps: records the ids of every WINWORD process before it starts and never touches them; creates a new instance (`Visible = false`, `DisplayAlerts = 0`) inside a job with a timeout, and writes the id of the process that instance started to a file; opens each file read-only with `AddToRecentFiles` false and `OpenAndRepair` false, so a damaged file is an error and not a silent repair; closes without saving; quits; on a timeout or a leftover process, ends only the process id it recorded.
- What it reads and compares with `data-expect`: that the file opens; inline shape count and types (so a copied chart is two charts and a copied embedded object is two objects with their `ProgID`); shape count; list paragraphs, footnotes, hyperlinks; protection for a final; the font and size of each text box story and of the footnote story; `DocumentTheme` accent 1 and minor font; that no in-line object is wider than the text area.
- It prints one line per file, pass or fail with Word's message, and returns a non-zero exit code on any failure.

**Manual checks before release**, listed in `docs/document-tool.md` because nothing headless can do them: paste from real Word and real Excel in Edge; a real document with a pasted Visio drawing, imported, exported and opened; `scripts/measure-size.html` at 100 MB and 150 MB in Edge and in the exe; autosave and restore in the suite's exe and single-file builds (real IndexedDB).

## 8. Build order

**WP0, first, one engineer, short.** Everything that lets the others work on disjoint files:

- `contracts/document.json` (done), `shared/sync.json` entries, `.gitignore` line, and the four shared files and every module file created as stubs that export the names in sections 4 and 5 with empty bodies;
- `modules/documents/module.json`, `index.html` with the final script list, CSP and fixed ids, `js/product.js`, `scripts/build-data.ps1`, `LICENCE.txt` and the other synced copies;
- stubs of everything `module.json` names, so the packaging scripts do not fail from the first day: `data/demo-document.js`, `packaging/single-html/check-single-html-documents.html`, `packaging/electron/app/selftest-documents.js`;
- `tools/sync-shared.ps1` run; the module opens to an empty page with no console errors; `tools/build.ps1 -Module documents` completes.

Then in parallel, each on files nobody else edits:

| WP | Files | Public functions | Test pages owned | Needs from others |
|---|---|---|---|---|
| WP1 template and writer | `shared/house-docx.js` | `App.HouseDocx`: the 4.3 tables, in particular `cover`, `documentControl`, `assemble`, `pack`, `listNumbers`, `blocksToDocx`, `buildDocument`, `issueList` | `test-doc-house.html`, `test-doc-writer.html`, `modules/assessments/scripts/test-house-parity.html` | the contract and 3.6; `App.DocxGraft.apply`, `token`, `needsGraft` by name (the stub is enough until WP2 lands) |
| WP2 zip and graft | `shared/zip-io.js`, `shared/docx-graft.js` | `App.ZipIO.read`, `write`, `crc32`, `text`, `bytesOf`; `App.DocxGraft.apply`, `token`, `needsGraft`, `unshare`, `scaleXml`, `escapeAttr`, `SharedPartError` | `test-doc-zip.html`, `test-doc-graft.html` | the `plan` shape in 4.2 |
| WP3 import | `shared/docx-import.js` | `App.DocxImport.read`, `parseStyles`, `parseNumbering`, `parseTheme`, `headingLevel`, `listInfo`, `effectiveFormat`, `classifyDrawing`, `CODES` | `test-doc-import.html`, `test-doc-import-art.html`, `test-doc-safe-file.html` | `ZipIO.read`; the contract and 3.6; fixtures from WP8 (starts with fixtures built in the page) |
| WP4 shell (engineer A) | `index.html` (after WP0), `js/app.js`, `model.js`, `storage.js`, `pictures.js`, `css/documents.css`, `scripts/measure-size.html` | `App.DocApp`, `App.DocModel`, `App.DocStorage`, `App.DocPictures`, `window.DocumentTool` (5.2) | `test-doc-model.html`, `test-doc-app.html` | the contract |
| WP5 editor (engineer B) | `js/render.js`, `editor.js`, `history.js`, `css/editor.css` | `App.DocRender`, `App.DocEditor`, `App.DocHistory` (5.2) | `test-doc-editor.html`, `test-doc-keys.html`, `test-doc-speed.html` | `App.DocModel` and `App.DocApp` by signature; `HouseDocx.listNumbers`; `App.DocTables.tableEl`, `controls`, `keydown` and `App.DocPaste.read` by name |
| WP5b tables and paste (engineer D) | `js/tables.js`, `js/paste.js`, `css/tables.css` | `App.DocTables.tableEl`, `controls`, `keydown`; `App.DocPaste.read`, `fromHtml`, `fromText`, `copyPayload` | `test-doc-tables.html`, `test-doc-safe-paste.html` | `App.DocModel.table.*`, `copyBlocks`; `App.DocRender.runsInto`; `App.DocHistory.record`; `App.DocEditor.redraw` |
| WP6 pages (engineer C) | `js/pages.js`, `export.js`, `import-flow.js`, `css/pages.css` | `App.DocPages`, `App.DocExport`, `App.DocImportFlow` (5.2) | `test-doc-pages.html`, `test-doc-issue.html`, `test-doc-version.html` | `HouseDocx.buildDocument`, `DocxImport.read`, `App.DocRender` front-matter functions and `keptCard`, `App.DocApp` |
| WP7 suite | `platform/suite.json`, `platform/js/suite.js`, `platform/css/suite.css`, `platform/data/suite-data.js`, `platform/scripts/test-shell.html`, `packaging/single-html/check-single-html-suite.html`, `packaging/electron/app/selftest-suite.js`, `packaging/electron/app/main.js`, `packaging/electron/README.md`, `README.md`, `CLAUDE.md`, `docs/platform-architecture.md`, `shared/version.js` comment | none | the edited `test-shell.html`, `check-single-html-suite.html`, `selftest-suite.js` | the module starting (WP0) |
| WP8 fixtures and Word check | `modules/documents/scripts/make-fixtures.ps1`, `build-fixtures.ps1`, `fixtures/*`, `tools/word-open-check.ps1` | none | `test-doc-fixtures.html` | Word on the machine |

**WP9, last, after the others meet**, one engineer: `test-doc-round.html`; `scripts/dump-doc-exports.html`; the tour (`scripts/build-demo.ps1`, `data/demo-document.js`); `packaging/single-html/check-single-html-documents.html` and `packaging/electron/app/selftest-documents.js` filled in; `docs/document-tool.md` and `modules/documents/README.md`; a full run of `tools/word-open-check.ps1 -DumpPage`; the manual checks; the suite single HTML rebuilt and checked.

No file appears in two packages. WP0's stubs are handed on whole: `index.html` to WP4, the two packaging stubs and `data/demo-document.js` to WP9.

The interfaces between packages are four, and all are fixed here: the project file (the contract), the project in memory (3.6), the graft `plan` (4.2), and the function tables in 4.3 and 5.2.

## 9. Risks and open questions

| Risk or question | How the build handles it |
|---|---|
| A kept drawing breaks the Word file in a case the fixtures do not cover. | Carry the XML untouched apart from the four named changes (3.4), and treat `tools/word-open-check.ps1` on real customer documents as part of acceptance. If one object is the problem, the user can replace it with a picture. |
| The `unshare` rule (which parts may be shared) was proven on hand-built files, one of each kind, in one version of Word. | `test-doc-graft.html` pins the rule; the Word check opens a copied chart, SmartArt and embedded object on every release. Kind `other` is always cloned. If a new kind fails, clone it too: cloning is always safe, sharing is the optimisation. |
| `effectiveFormat` was proven for the commonest case only (no run formatting, document defaults). Style chains, theme fonts and East Asian fonts in text boxes were designed, not opened. | Fixtures for each in `test-doc-import-art.html`, and the Word check reads the font of every text box story against the source's. |
| Visio objects were not tested with a real Visio file. | The markup is the same as the embedded Excel sheet that was proven. A manual check with a real document before release (section 7). |
| An older Word, Word for Mac and Word online were not tried. | Not gated. Note in `docs/document-tool.md`; try one older Word if one can be found. |
| Kept objects usually have no picture the browser can show. | Number, label, caption and text on the card; the Pictures and drawings list; "Export a draft to check in Word" on the import report. Rendering EMF or shapes in the browser is out of proportion for this version. |
| Floating drawings keep their original position rule, and the text around them has been restyled, so one may sit awkwardly. They are not scaled, and cannot be put in line (it did not work in Word). A diagram of loose shapes wider than the template's text area keeps its offsets and overruns the margin. | Each is anchored in the paragraph it was anchored in, and a diagram of loose shapes travels with its blank lines (4.4). Report the count at import with Show links (`floating-drawings`). "Replace with a picture" is the way out. A working in-line conversion is a follow-up and needs its own Word experiment first. |
| One theme per document: a kept object pasted from a document with a different theme takes this document's theme. | Accepted; said in `docs/document-tool.md`. |
| The footnote reference mark inside the note is a library run with no font, so it may show in Word's default font beside Segoe UI text. | Cosmetic. WP1 tries a paragraph style override (`FootnoteText`) and keeps it only if the parity test and the Word check both pass; otherwise direct formatting on the text runs stands. |
| The size limits (100 MB warning, 150 MB refusal of new bytes) are judgement. A 150 MB project is about 200 million characters of JSON; V8's string limit is about 536 million. | WP4 writes `scripts/measure-size.html`, opens and saves generated projects at 100 and 150 MB in Edge and the exe, records whether they open and the peak memory, and sets `LIMITS` to what opened comfortably. A zip-based project file is the answer if real documents need more; `ZipIO` will exist, and the cost is the suite's text-only routing. |
| IndexedDB cannot be exercised in headless Edge, so the real store is never run by the suite. | The `bytesStore` seam keeps all logic testable with an in-memory store; the real store is a thin wrapper. Manual check in the exe and the single file (section 7). If it fails there, autosave is off with a visible line and nothing else breaks. |
| The clipboard order and Word's and Excel's real payloads cannot be driven headless. | Recorded samples as fixtures; a manual check in Edge before release. Reading pictures from the clipboard's RTF is the first follow-up. |
| A custom editor is the largest piece and the easiest to get subtly wrong. | One editable element per block, model-first commands, the DOM contract with `matches` to stop drift, its own undo. The feature list was cut to section 5.3; tables and paste are a separate package. |
| The preview is not the Word file. | The round-trip test stands in for that guarantee. |
| The library writes some run properties out of schema order. | Word accepted every combination the model allows. Do not add run properties beyond the list in 3.3 without opening the result in Word. Never use `rStyle` on body runs. |
| Embedded objects and workbooks are carried without being inspected. | They are inert until someone opens them in Word, and they came from the user's own document. Macros and controls are never carried. Say so in the import report line for embedded objects. |
| No letter kind, although "all kinds of documents" was asked for. | A letter is written as a short document. Owner to confirm, and to supply a house letter layout if one is wanted. |
| Dates print as stored (`2026-11-11`), as the assessment reports print them. | Consistent across tools. Owner's decision whether all tools should print `11 November 2026`; that is one change in each exporter, later. |
| The live cover miniature shows the cover's capitals inside the tool. | It is framed and labelled as a picture of the page. Owner to confirm it sits within the no-uppercase-labels rule. |
| Tool colour: magenta `#A8326E` passes contrast but is close in hue to the red "gap" status colour `#B23A33`. | Look at the two side by side in the suite before release. |
| Does `shared/LICENCE.txt` need to name the new tool in its title? | The owner's decision. Recommended: yes, name all four when v0.7 is released, in the same change as the version bump. |
| Font: the template names Segoe UI and embeds nothing, so a recipient on a Mac sees a substitute. | A property of the template, shared with every report today. Not changed here. |
| The parity test lives in the assessment module and reads a file in `shared/`. | Accepted for a test page: it is the only place both exporters can be loaded. |
| When do the assessment and risk exporters move onto `house-docx.js`? | After v0.6 is called stable and v0.7 has shipped. The function table in 4.3 is the map for that move. |

## 10. Review points not taken

Every other review point was taken and is in the text above. These were not, or only in part.

| Point | Decision | Why |
|---|---|---|
| Do the cloning when a kept block is copied in the editor, and have the graft only refuse shared parts (file format review). | The cloning is done at export, in `DocxGraft.unshare`; the refusal is kept as a check after it. | Same result in Word (the reviewer's own cloned files are the proof), one place instead of four (copy, paste, duplicate, undo), no asynchronous byte work in the model, and no doubled parts in the project file. |
| Import a cropped picture as a picture block with its crop carried. | Not taken. It stays a kept object with its image as preview. | The reason given was that a kept object could not be fitted; kept objects are now scaled to fit. Carrying a crop through the library's `ImageRun` is unproven, and a kept picture already prints exactly as cropped. |
| An in-line object run for equations and small icons, so they stay inside their sentence. | Not in v0.7. | It needs a new run type, an atom in the editor and a second graft path inside paragraphs. Such objects are kept and moved to directly after their paragraph, and every case is listed with a Show link (`inline-objects`). First candidate after the RTF paste follow-up. |
| Before building "Put in line with text", check the wrap type by COM or rewrite the fallback too. | The feature is cut instead. | Repeated here: both rewrites open but Word still reports a floating shape. |
| Read pictures from the clipboard's RTF when pasting from Word. | Follow-up, as the reviewer allowed. The clipboard order is fixed now. | It cannot be tested headless and needs real Word; import already brings every picture across. |
| Offer values from a typed document control table for the Document information fields. | Not in v0.7. The front-matter entry with Show and Remove is built. | Guessing labels in arbitrary tables is a feature of its own; the fields are a dozen short values to type. |
| Announce lists as lists to a screen reader (`role="listitem"` with position and size, or a `role="list"` wrapper). | Partly. The marker is real text, so each item is read with its number or bullet; there is no "list, 4 items". | A wrapper per run of list items breaks the flat one-element-per-block structure that redraw, move and block selection rely on, and `listitem` without a `list` parent is invalid. Revisit with a screen reader user. |
| Cap a `localStorage` autosave copy at 1 MB and keep kept XML out of it (suite review), against putting the whole autosave in IndexedDB (editor review). | The editor review's answer: everything in IndexedDB, a pointer only in `localStorage`. | It removes the quota pressure on the other tools entirely, which was the suite review's concern, and avoids splitting one document across two stores. |
| Give `blocksToDocx` a `ctx` with `bytesOf(key)` supplied by the module. | Not needed. | The memory form (3.6) is part of the contract, so shared code reads `entry.blob` directly and still never calls module code. |
| Keep "Reduce picture sizes" and make it undoable. | Cut for v0.7, as the same review's scope list proposed. | The two points conflict; cutting removes the only path that altered imported pictures. |
| Carry a per-heading "unnumbered" flag from an imported file, so headings the original left unnumbered stay so (second review). | Not in v0.7. The renumbering is reported (`heading-numbers`, on the import report and on Worth a look, with Show). | It is a new field in the contract with three owners of heading numbers to change together (the writer, the outline and the screen). The report is still needed with it, because a cross-reference kept as text can be stale for other reasons. |
| Carry a `start` on a list block, so a list picked up after another numbered list prints its real number (second review). | Not in v0.7. The item starts at 1 and is reported under `list-numbering`. | Also a contract change, with the writer's numbering instances to follow. `continue` already covers the common case of a list picked up after ordinary text. |
| For a short document, print Date and ignore Issued date (second review, option b). | Not taken: the issued date still wins, and the hints and the note on the page now say so. | One rule for both kinds: the cover of a report does the same. |
| Four cards in one row. | Two rows of two. | At the 1,200 px page width four columns leave about 270 px a card for a three-line summary. |
