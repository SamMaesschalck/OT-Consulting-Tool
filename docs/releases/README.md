# Release notes

One file per version, named for it: `v<x.y.z>.md` (for example `v0.5.1.md`). A release cannot be made without one.

- `tools/release.ps1` refuses to start unless `docs/releases/v<x.y.z>.md` exists for the version in `shared/version.js`, and prints the `gh release create ... --notes-file` command that publishes it as the GitHub release notes.
- The suite's home page shows the newest file as "What's new". `platform/scripts/build-data.ps1` copies it into `platform/data/suite-data.js`; the suite's single-file build regenerates that at build time, and `tools/release.ps1` checks the committed copy is current. After adding or editing a notes file, run `.\platform\scripts\build-data.ps1` and commit both.

Write the file before the release, in the same plain style as the tools: UK English, no em or en dashes, no capitals for emphasis. The home page renders a small part of Markdown: headings, paragraphs, bullet lists, tables, `**bold**`, `` `code` `` and links.
