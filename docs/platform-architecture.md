# Platform architecture

Status: agreed direction, November 2026. Stage 1 (groundwork) is done; later stages are planned, not built.

## Goal

One suite holding several OT cyber tools, where:

- internally, one file (one HTML or one exe) gives a consultant every tool;
- any tool can still be handed out on its own, for example the assessment tool or the risk assessment tool to a contractor, with nothing else attached;
- tools can work with each other's results (the risk tool's target Security Levels feeding an assessment, or a future report-review module reading an assessment's findings) without depending on each other's code.

The suite's product name is still to be chosen. Until it is, documents call it "the suite".

## Principles

1. **A module is a complete app.** Each tool has its own folder, entry page, tests, single-HTML build and exe build. Nothing about the suite is needed to run it.
2. **The suite is a thin shell.** It finds the modules, shows them side by side, owns the customer workspace file and passes data between modules. It holds no assessment logic of its own.
3. **Modules never call each other's code.** They exchange data through versioned contracts. Two modules can therefore change, ship and be tested independently.
4. **Shared code is copied in, not linked.** One canonical copy lives in `shared/`; a sync step copies it into each module, and a check fails if a module's copy drifts.
5. **One version for everything.** Every file in a release carries the same version number.

## Repository layout

| Path | Contents |
|---|---|
| `modules/assessments/` | The OT Cyber Assessment Tool. |
| `modules/risk-assessment/` | The OT Cyber Risk Assessment Tool. |
| `modules/<new>/` | Future modules, built to the same pattern. |
| `platform/` | The suite shell (stage 2). |
| `shared/` | Canonical copies of files several modules use: licence, brand assets, vendor libraries, the version. `shared/sync.json` lists where each copy goes. |
| `contracts/` | Versioned data contracts between modules, starting with `risk-context-interchange.json` (`spt-risk-context/1.4`). |
| `packaging/single-html/`, `packaging/electron/` | Turn a module (or, later, the suite) into one HTML file or a portable exe. |
| `tools/` | `run-tests.ps1`, `sync-shared.ps1`, `build.ps1`, `release.ps1`. |
| `docs/` | This document and other design notes. |

Built files are never committed. They are attached to GitHub Releases.

## How a module works

Each module folder contains:

- `index.html`, its own `js/`, `data/`, `vendor/` and `css/`, so it runs from `file://` with no server;
- `module.json`, a manifest: id, product name, entry page, which tests to run, and how its exe self-test works;
- its own `LICENCE.txt` and copies of the shared files, kept in step by `tools/sync-shared.ps1`;
- `scripts/test-*.html`, its headless test pages, run by `tools/run-tests.ps1 -Module <id>`.

From stage 2, the manifest also declares what the module **produces** and **consumes** in contract terms. For example, the risk tool produces `spt-risk-context`, and the assessment tool's 62443-3-3 instrument consumes it.

### Running standalone or inside the suite

Inside the suite, each module runs in its own frame. The two existing tools both define the same global object and load the same libraries, so they cannot share one page. The frame also guarantees a module behaves the same in both settings.

Each module gets a small host bridge with two modes:

- **Standalone:** the module saves and loads its own project file, as it does today, and exchanges contracts as files the consultant exports and imports.
- **In the suite:** the module hands its data to the shell, which writes the customer workspace file, and receives contracts from the shell directly.

The bridge is needed because browsers block file save and open dialogs from inside an embedded frame, so in the suite only the shell can own the file.

## Data

### Customer workspace file (stage 2)

In the suite there is one file per customer. Each module's data sits in its own section, in the module's own format. This extends what the assessment project file already does, holding several assessments per customer.

A contractor's standalone project file can be imported into a workspace section and exported back out, so work moves between a contractor and the suite without conversion.

### Contracts

A contract is a JSON definition in `contracts/` with a schema string such as `spt-risk-context/1.4`, the shape, an example and the list of schema versions importers accept. The rules:

- the producer writes the current schema; consumers accept the listed versions and reject unknown ones;
- a change of shape bumps the schema string, so a mismatch fails loudly rather than silently;
- each module keeps a synced copy, so it can still read and write the contract standalone.

A future report-review module would consume the assessment's results and report text through a contract, not by parsing the Word file. The assessment's Issue check already exposes exactly what the Word report will print.

## Builds and releases

`tools/build.ps1 -Module <id> -As html|exe|both` builds one module. From stage 3 the same packaging builds the suite with a chosen set of modules.

`tools/release.ps1` builds one release from one commit. It refuses to start with uncommitted changes, an existing tag or drifted shared files. It runs each module's tests, builds and checks every file, stages the files with `SHA256SUMS.txt` in `dist\<version>\` and tags `v<x.y.z>`. A release carries:

| File | For |
|---|---|
| Suite HTML / exe (from stage 3) | internal use: every tool in one file |
| OT Cyber Assessment Tool HTML / exe | the assessment tool on its own |
| OT Cyber Risk Assessment Tool HTML / exe | the risk tool on its own |
| `SHA256SUMS.txt` | checksums |

The version is shown in each tool and recorded in saved project files. It never appears in Word or Excel exports.

### Branches

- `main` always holds tested, releasable code; releases are tagged from it.
- Work in progress goes on short-lived feature branches (for example `feature/platform-shell`), merged when its tests pass.
- There are no per-module branches: modules are folders on `main`, so a shared fix reaches every module at once.
- A release branch is created only if an old version ever needs a patch after `main` has moved on.

## Stages

1. **Groundwork (done, November 2026):** repository restructured into the layout above; `shared/` with sync and drift check; `contracts/` holding the risk-context contract; one suite version in `shared/version.js` shared by both modules; a `module.json` manifest per module; single-HTML and exe builds for each module, each with its own check (the risk tool's first standalone builds); `tools/build.ps1`; and a release that ships both modules.
2. **Suite shell, first version:** launcher, host bridge, customer workspace file, both modules embedded, risk context passed directly between them.
3. **Suite releases:** a suite single HTML and exe, with the choice of modules made at build time.
4. **New modules,** such as report review, built to the same pattern.

## Known gaps

- The risk tool's notice says "see LICENCE.txt", but its single HTML and exe have no file beside them (the licence is only embedded as a comment). It needs a licence pop-up like the assessment tool's.
- Risk tool project files do not record which version saved them, unlike assessment project files.
- The example in `contracts/risk-context-interchange.json` still shows `generatedBy: spt-risk-tool/0.2`; the risk tool now writes the suite version there.

## Open decisions

- The suite's product name: it appears in the suite's title bar and file names.
- Whether the suite single HTML should load the shared vendor libraries once for all modules (smaller file) or keep each module's own copy (simpler, identical to standalone).
