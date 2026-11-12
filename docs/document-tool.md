# OT Cyber Document Tool

The document tool writes documents that are not assessment or risk reports but should look like one: proposals, method statements, reports, procedures and short notes. They print in the same SolutionsPT template as the assessment reports, with the same cover, document control page, header and footer. A document can be written in the tool, or an existing Word file can be loaded and rebuilt in the template with its pictures and diagrams kept.

It works on its own. No file passes between it and the other tools, and it is not yet connected to the Report Review Tool. The design, with the experiments behind it, is in [document-tool-design.md](document-tool-design.md); how to work on the code is in [modules/documents/README.md](../modules/documents/README.md).

## The two kinds of document

The kind decides what is printed around your text. Choose it on the Document information page; you can change it at any time.

| | Document with a cover | Short document |
|---|---|---|
| Use it for | proposals, method statements, reports, procedures | notes, letters and anything of a few pages |
| Cover | the assessment report's cover, with your title, client, reference, revision, date, author and classification. It is always one page. A blank author or date is left off, with its label | none |
| Document control page | yes, straight after the cover | none |
| Contents list | optional: a list of the headings, each a link | none |
| How the text opens | with your first heading | with the title, then one line giving the client, revision and date (the issued date once one is set) |
| Header and footer | the logo; the classification with "© SolutionsPT Ltd", the title and the page number | the same |

The footer starts with whatever Classification says on the Document information page, for example "Commercial in confidence · © SolutionsPT Ltd". Left empty, it says "Confidential".

The cover cannot run onto a second page. Text far too long for it (a title of several hundred characters) is cut off in the Word file; Issue and export says so under Worth a look before you export, and the export message says so again.

There is no letter layout yet. Write a letter as a short document.

The document type (Proposal, Method statement, Report, Procedure, Technical note, or anything you type) is only wording: it is the line above the title on the cover and a row in document control.

Dates print as they are stored, for example 2026-11-11, as they do in the assessment reports.

## Writing

**Edit** shows the page as it will print. The template decides the fonts, sizes, colours and table styling, so every document looks the same and there are no controls for them.

- **Blocks.** A document is a list of blocks: headings (three levels), paragraphs, bulleted and numbered list items (three levels), tables with a header row, pictures, page breaks and red prompts. The toolbar changes what a block is, and inserts a table, a picture or a page break.
- **Text.** Bold, italic, underline, strikethrough, superscript, subscript, code, links (http, https and mailto) and footnotes. A footnote's text is edited in a small panel under its paragraph, and can hold links of its own. Backspace after a footnote number, or Delete before it, removes the footnote.
- **Red text** marks what is still to write. A whole red line is a prompt; part of a line can be red too. Both print red in a draft, are listed by the Issue check, and stop a Final. Enter inside a prompt makes two prompts. A prompt is plain text: it cannot hold a footnote, and Backspace at the start of a paragraph below a prompt does not fold the paragraph into it.
- **Lists.** Type "- " or "1. " at the start of a paragraph, or use the toolbar. Tab and Shift+Tab change the level. The numbers on screen are the numbers Word will show.
- **Headings** are numbered, when numbering is on, by how deep each one sits under the headings before it. A level 2 heading with no level 1 before it is "1", not "0.1".
- **Writing after a table, picture, drawing or page break.** Select it and press Enter, or use its Paragraph after button. Arrow Down from the last row of a table that ends the document, or a click on the empty paper below the last block, does the same.
- **Tables.** Tab moves between cells and adds a row at the end. The table's controls add and delete rows and columns, switch the header row, set equal widths, make a column narrower or wider, add a caption and put the table on a landscape page. Merged cells from an imported table are kept and shown, but cells cannot be merged or split here yet.
- **Pictures.** Insert one from a file, paste it or drop it on the page. Set its width in centimetres, its alignment, a caption and alternative text. A large photo is made smaller when it is put in (the longest side at most 2400 pixels); a picture over 5 MB after that is refused. A picture is never taller than a page can show: a tall one, such as a phone screenshot, is put in at the height of the page, and the Word file holds any picture to that height.
- **Pasting.** Text, lists, tables and pictures paste as blocks; selected text is replaced by what is pasted. Pasting from Word carries footnotes, leaves comments out, and settles tracked changes (inserted text kept, deleted text left out); each of these is said in a message, never done silently. If a numbered item cannot keep the number it had where it was copied from, the message says so. A paste too large to read with its formatting comes in as text only, and says that too.
- **Landscape pages.** Any block can be put on a landscape page, usually a wide table with its heading.
- **Selecting.** A text selection stays inside one paragraph. Drag past the end of a paragraph, or press Escape, and whole blocks are selected: they can be moved (Alt+Shift+Up and Down), copied, deleted, formatted or turned into another kind of block. A selection cannot start in the middle of one paragraph and end in the middle of another.
- **Undo** (Ctrl+Z) and redo (Ctrl+Y) cover everything on the page. They do not cover the Document information fields, where Ctrl+Z is the browser's own undo of the field you are in.
- **Find** is the browser's own Ctrl+F, which searches the whole document.
- **The outline** in the sidebar lists the headings. Enter goes to one; Alt+Up and Alt+Down move a whole section; each has a menu to add a section after it or delete it.

The keyboard: the page is one stop for Tab. Tab inside a paragraph does nothing, so to leave the page press Escape, then Tab. F6 moves between the sidebar, the toolbar and the page.

**Document information** holds the title, type, reference, client, site, author, revision and date, the document control names, and two options: number the headings, and add a contents list. A small picture beside it shows the cover as it will print. Under each field is a line saying where it prints; for a short document it says which fields are not printed at all.

**Preview** shows the whole document, cover first. It is drawn from what you wrote, not from the Word file, and Word decides where pages break. Footnotes are listed at the end of the sheet their numbers are on. An entry in the contents list goes to its heading, as it does in the Word file.

## Bringing in a Word file

Load a `.docx`, or drop it on the tool. It is read and rebuilt as blocks in the template; the Word file itself is never changed, and Save can never write over it (the first Save of an imported document asks where to keep its document file). Only `.docx` files are read. For an old `.doc` file or a Strict Open XML file, use Save as in Word and choose Word Document (.docx) first.

### What is kept

- **Text and structure**: headings (whatever the style is called, and in other languages), paragraphs, lists with their levels and numbering, tables with merged cells and a header row, alignment, bold, italic, underline, strikethrough, superscript, subscript, links, footnotes (endnotes become footnotes) and captions.
- **Pictures**: PNG, JPEG, GIF, BMP, EMF, WMF and TIFF pictures are carried across byte for byte. EMF, WMF and TIFF pictures cannot be shown by a browser, so the page shows a placeholder for each; they print in the Word export.
- **Drawings**: charts, SmartArt, shapes, text boxes, drawing canvases, embedded objects such as an Excel sheet, equations, and pictures that are cropped, rotated or SVG. These are kept exactly as they were in the Word file and put back into the export, so they print as before. The tool cannot redraw them, so the page shows a card for each, with its number, kind, name, size and any text inside it. To see them, export a draft and open it in Word.

Five things around a kept drawing do change, so that it still looks right in the new file: its internal ids; the text inside a text box or shape, which is given the font and size it had in the original; the original document's theme, which is carried so theme colours stay as they were; its size, which is reduced when it is wider than the page or its table cell or taller than a page (the text inside it is made smaller with it, so check it in a draft); and any link inside it that is not an http, https or mailto address, which is taken off (its words stay, no longer blue and underlined) and listed in the import report.

A kept drawing can be moved, copied, captioned, aligned, put on a landscape page, replaced with a picture, or deleted. It cannot be edited or resized by hand.

**Floating drawings.** A drawing that floated beside the text in the original still floats, anchored in the same paragraph as before, so it sits beside the same words. A diagram drawn as loose shapes and lines over a run of blank lines is kept as one drawing: the shapes, the blank lines that left room for them and their spacing travel together, so the lines still meet the boxes. This holds inside a table cell too, and the cell keeps its height. The text around a floating drawing has been restyled, so each one is counted in the import report and should be checked in a draft in Word; replacing it with a picture is the way out if it sits badly.

Also kept, each as the text it showed: a ticked or empty form check box (☒ or ☐), the chosen entry of a drop-down, a symbol typed in the Symbol or Wingdings fonts (as the real character, where one exists), and the unfilled prompt of a content control ("Click or tap here to enter text."), which comes in red so the Issue check lists it. A numbered column in a table keeps its numbers. A link on a picture is kept with the picture.

### What is not kept

Fonts, sizes, colours, spacing and table styling are replaced by the template: that is the point. Headers and footers are replaced by the SolutionsPT ones. Comments are dropped, tracked changes are settled (insertions accepted, deletions removed), a table of contents is replaced by the tool's own contents list, and macros and form controls are never carried. Columns become one column. A picture or equation that sat inside a sentence becomes a block of its own after that paragraph. Hidden text is left out, and quoted in the report. A typed "Contents" heading goes with the contents list it stood over; a table of figures or tables is left out and reported as that, without switching the contents list on. A page break that opened the document, or followed its contents, is dropped, because the template starts the text on a new page itself. Links to files, network paths and places inside the document are taken off and their text kept.

**Linked pictures.** A picture that is linked to a file or a web address rather than saved in the Word file (including one placed with an INCLUDEPICTURE field, in a text box or anywhere else) is left out. Word fetches a linked picture every time the file is opened, and an address on a network share hands that share the reader's Windows sign-in, so it never goes into an export. The import report lists each one under Not carried over, with its address: insert the picture itself if it is needed. A picture saved in the file and also linked keeps its saved copy and loses the link. A chart linked to a workbook outside the file keeps the figures it showed and loses the link, and an object that was only a link to another file is left out; both are listed the same way. In a project file made by an older version, a picture saved and linked loses the link when the file is opened; a drawing that still depends on a linked file shows as missing, and the export prints a prompt in its place.

Headings are numbered again from 1 when numbering is on. If the original left some headings unnumbered, or held cross-references such as "see section 4.2" as fields, those references are now ordinary text and may point at the wrong number: the report says how many, with Show.

### The import report

Every import ends on the **Import report**, which stays in the sidebar. Nothing is dropped without a line here.

- **SolutionsPT cover and document control recognised**: shown first when the original carries the house cover and document control page (see below), with the fields it filled and **Keep the original pages instead**.
- **The first page looks like a cover**: when the original's first page, before its first page break, has large type or a large picture and few words. **Remove these blocks** deletes that page; Undo brings it back.
- **Brought across**: how many paragraphs, headings, tables, pictures, drawings, captions and footnotes arrived.
- **Check first**: when the original starts with blocks before its first heading. That is usually its own cover, document control table or contents list, which the template now provides. Show selects them; Remove them deletes them, and Undo brings them back.
- **Not carried over**: each thing left out, with what it said (the text of the headers and footers, the first comments, hidden text, the address of a link that was taken off), so anything needed can be typed back in. A chart, diagram, picture or object that could not be brought across is listed here as left out, never as kept. So are a field that draws its own content and has no text to keep (a list number field, an equation field), a link on a picture that could not travel with it, and a footnote the file refers to but does not hold.
- **Carried over with changes**: each thing that was altered, with Show links to the blocks concerned. Look at three lines in particular. List numbering: where the original used letters, custom labels or a start other than 1, or a list picked up again after another list, a reference in the text such as "see 4(b)" may no longer match. Heading numbers, as above. Floating drawings: each keeps its place, but the text around it has been restyled.
- **Pictures and drawings**: one row for every kept drawing and every placeholder picture, with a Show link, and **Export a draft to check in Word**.

If a drawing has lost one of its parts in the original file, it is left out and named in the report, because Word refuses a whole file that holds one. A file that cannot be read at all gives one message saying why, and the document you had open is left as it was.

### A SolutionsPT cover and document control page

A Word report from the assessment or risk tool, or a document exported by this tool (older template versions included), starts with the SolutionsPT cover and document control page. These are recognised and taken out of the body, so the export prints the current template's cover and document control instead of the old ones' words, and a later change to the template reaches the document too. What they said fills Document information: the title (the title lines joined), the document type (the line above the title, in ordinary capitals, for example "OT cyber security assessment"), the client, the site or subject, the reference, the revision and date from the issue line (the date is left empty when it is only the issued date again), the author and classification, and from document control the revision, QA review by, authorised by, issued to, issued date and confidentiality (into Classification). The risk report's client, system under consideration, consultant and assessment date fill the client, site, author and date. Status is not kept: Draft or Final is chosen when you export. Anything with no field (the line under the site on a report's cover, such as "2013 edition · 3 zones and conduits assessed", and rows such as Instrument, Edition or Method) is listed on the card as not used. The report's own contents list goes too, and the contents option is switched on when it had one.

Recognition goes by shape, not by exact words: the cover is a table of one column on the first page whose first picture is the full-page background; document control is a table holding at least three of the known labels under a heading that says "Document control". Another company's cover is never taken out.

The original pages are kept with the document (in its file, pictures and all) until you choose. **Keep the original pages instead** puts them back at the start exactly as they were brought in, as one step that Undo reverses; nothing you have typed is cleared. **Use the current template's pages** takes them out again and fills any Document information field that is still empty, never one you have typed in.

A document exported by this tool and loaded again comes back as you wrote it: its cover and document control are recognised, and nothing is listed under Check first.

## Draft and Final

**Issue and export** has three parts.

- **Still to complete**: everything that would print red, each with Go to it. This list is made by the same code that writes the Word file, so it is exactly what would print. A missing title is on it, and so is a picture or drawing that could not be restored.
- **Worth a look**: things that never stop an export: a blank author, or a blank QA review by and the other document control names; no date at all for the cover; a cover with more text than its page holds; a picture with no alternative text; a wide table on a portrait page; a picture or drawing that will be made smaller because it is too wide or taller than a page; list or heading numbers that changed when a Word file was brought in.
- **Export Word**, as a Draft or a Final. A Draft has the DRAFT watermark and Status Draft in document control. A Final has Status Final, opens read-only in Word and is marked as final. A Final is refused while anything is still to complete.

The file is named from the client, the title and the revision, with "-draft" for a draft. The Word file never names the tool or its version.

## What is stored where

| What | Where | Holds |
|---|---|---|
| Document file (`spt-document`) | a `.json` file you save | the whole document: text, pictures, kept drawings and their parts, the import report. It holds client content: handle it like a project file. |
| Autosave copy | this browser (IndexedDB, under the tool's own name) | the open document and its pictures, written as you work. A copy newer than your last save is offered when the tool next starts; it is never applied without asking. It is removed when you close a document with nothing unsaved, or decline the offer. |
| Pointer to the autosave copy | this browser (`spt-document:autosave:v1`) | the document's id, title and time, so the offer can be made. Never content. |
| The Word file you imported | where you left it | never changed, and never written to. |
| The Word export | a download | the deliverable. |

Save writes back into the same document file where the browser allows it; Shift+click, or Ctrl+Shift+S, is Save as. Otherwise each save downloads a copy. A save is never refused. Save as into another file makes a document of its own: the new file has its own autosave copy, and the file you saved before keeps its own. If you go on typing while a large document is being written, the document stays marked as unsaved and the message says to save again, because those last changes are not in the file yet.

Two windows of the tool can be open at once. Neither offers, clears or discards the autosave copy of a document that is open in the other. The tool warns when the pictures and kept content of one document pass 100 MB, and refuses to add more past 150 MB. If the header says "Autosave is off. Save often.", the browser would not give the tool its store; everything else works as usual.

If a restored autosave copy has lost some of its pictures, the tool says how many, shows a placeholder for each, and offers **Bring them back from the saved file**. Only pictures that are plainly the missing ones are taken (the same document, and the same name and size), and the document is then unsaved work until you save it. Until then Save is a Save as, so the incomplete copy cannot replace the good file, and a Final is refused.

In the suite, a document file opens from Open a file, Recent files or a drop anywhere. One over 100 MB is too large to pass on from the suite: open it with Load inside the document tool. A Word file is opened with Load in the document tool itself, or dropped on it. The tour opens a short demo proposal brought in from a Word file; nothing changed there is kept.

## Not in this version

- Review through the Report Review Tool.
- A letter layout, and a table of contents with page numbers.
- Merging and splitting table cells, and dragging column widths.
- Dragging to resize a picture or to move a block, and reducing picture sizes after they are in.
- Pictures in a paste from Word (they are in the clipboard in a form the tool does not read yet). Load the Word file to bring everything across, or insert the pictures from files.
- Editing a kept drawing, resizing it by hand, or putting a floating one in line with the text.
- A picture or equation inside a sentence: it becomes a block of its own.
- Friendlier dates (11 November 2026), which would be a change to every tool at once.
- One theme per document: a kept drawing pasted from a document with a different theme takes this document's theme colours.

## Checks

The headless tests are `tools\run-tests.ps1 -Module documents`. They cannot prove that Word opens a file, so the release gate for this tool is run by hand on a machine with Word:

```
.\tools\word-open-check.ps1
```

It opens every fixture, then every document `modules\documents\scripts\dump-doc-exports.html` exports (each fixture imported and exported as a draft and a final, documents written in the tool, one with control characters in its text, lists that open below their top level and pictures taller than a page, every kept drawing copied, drawings in table cells on a landscape page, and a 6,000-block document), in a new hidden Word, read-only and with repair switched off, so a damaged file is an error. For each imported fixture Word must find the same pictures, charts, diagrams, embedded objects and shapes as it finds in the original, with text boxes in the original's font and the original's theme colours. The fixtures include `fx-float`, a diagram of loose floating shapes with a text box beside a paragraph. Nothing in line may be wider than its page's text, and any that is taller is printed. It never touches a Word you already have open.

Checks that nothing automatic can do, to be made before a release:

- Paste from real Word and real Excel in Edge.
- A real document holding a Visio drawing: import, export, open in Word.
- An export opened in an older Word, and in Word for Mac or Word online if they matter to a client. The template names Segoe UI and embeds no font, so a Mac shows a substitute, as it does for the assessment reports.
- `modules\documents\scripts\measure-size.html` at 100 MB and 150 MB in windowed Edge and in the exe.
- Autosave and restore in the suite's exe and in the single-file build, which use the browser's real store.
- The tool's colour beside the red "gap" status colour in the suite.

The notes for the release that first carries this tool are drafted in [releases/v0.7.0-draft.md](releases/v0.7.0-draft.md). They become `v0.7.0.md` when the version number changes, not before, because the suite shows the newest file in that folder as "What's new".
