# OT Cyber suite: Electron desktop builds

Copyright (c) 2026 SolutionsPT. All rights reserved.

Desktop-app versions of each tool in the suite: the OT Cyber Report Review Tool (module `report-review`), the OT Cyber Assessment Tool (module `assessments`) and the OT Cyber Risk Assessment Tool (module `risk-assessment`). Each is built on its own, as its own exe, so a contractor can be given just the tool they need. Each runs its module's single-file build from `../single-html` unchanged, inside Electron's own copy of Chromium. Nothing in `../../modules` is touched.

The SolutionsPT OT Cyber Suite (`-Module suite`) builds the same way: its page is the suite's single-file build, which carries each tool in a frame, and its manifest is `platform/suite.json` (copied in as `module.json`). Its exe is `%LOCALAPPDATA%\OTCAT-electron\suite\dist\SolutionsPT OT Cyber Suite v<version>.exe`.

What differs between them comes from the module's manifest, `modules/<module>/module.json`: the product name (window titles, the exe's name and file properties, the loading window), the `appId` and package name (so each exe keeps its own local storage and autosave, and the two can run side by side), and which self-test runs. The version is the suite's, from `shared/version.js` (read by `../module-info.ps1`), and the same for every module.

The simplest way to build is the repository's one entry point:

```
.\tools\build.ps1 -Module risk-assessment -As exe -SelfTest
.\tools\build.ps1 -Module all -As both -SelfTest
```

## One portable .exe

```
powershell -ExecutionPolicy Bypass -File build-portable-exe.ps1 [-Module risk-assessment] [-SelfTest]
```

The module defaults to `assessments`. This produces a single file named for the product and the suite version, for example:

- `%LOCALAPPDATA%\OTCAT-electron\assessments\dist\OT Cyber Assessment Tool v0.6.exe` (about 89 MB)
- `%LOCALAPPDATA%\OTCAT-electron\risk-assessment\dist\OT Cyber Risk Assessment Tool v0.6.exe`

Nothing is installed: the exe unpacks itself to a temp folder each time it starts, so it takes a few seconds longer to open than the folder build. Its file properties name the product and SolutionsPT and carry the copyright, and its file version is the suite version.

It uses `electron-builder` (pinned to 26.15.3) and needs a portable Node. That Node is unzipped, not installed, into `%LOCALAPPDATA%\OTCAT-electron\tools`; see the script header. Electron itself is reused from the folder build, which has already been checksum-verified, so it isn't downloaded twice.

Everything heavy stays in `%LOCALAPPDATA%\OTCAT-electron`, outside OneDrive. The Electron download (`cache`), the portable Node (`tools`) and the electron-builder staging project (`builder`, with its `node_modules`) are shared by every module. Each module's output goes in its own subfolder (`assessments\`, `risk-assessment\`), so building one never overwrites the other.

The icon comes from `build/icon.ico`; re-run `build-icon.ps1` if the source logo changes. A larger or vector source would sharpen the 256 px size, since the current one is 200 px.

## Self-test

`-SelfTest` runs the finished exe with `--self-test` and writes the result to `%LOCALAPPDATA%\OTCAT-electron\<module>\selftest-portable.txt`, ending `ALL TESTS PASSED`. The module's `electron.selfTest` picks the test: `app/selftest-<kind>.js`. It runs in a temporary profile of its own, so its demo data and unsaved edits never reach the user's autosave.

`selftest-assessments.js` checks that the assessment tool:

- starts from inside the package, with the loading window behaving as below
- shows the logo, the version (agreeing with the exe's), the copyright notice and the licence pop-up
- has localStorage and the file pickers
- scores every instrument, reports on it, and builds Word and Excel for it
- writes a real Word and a real Excel download to disk
- lets the window close when there is unsaved work

`selftest-risk-assessment.js` checks that the risk tool:

- starts from inside the package, with its Word and Excel libraries, and the loading window behaving as below
- carries its title, the logo, the version in its header badge (agreeing with the exe's), the copyright notice, and the licence notice and version on its About page
- has localStorage and the file pickers
- loads the demo project (carried inside the single-file build) through its normal load path, and renders every page
- writes a real Word and a real Excel download to disk
- lets the window close when there is unsaved work

`selftest-suite.js` checks that the suite:

- starts from inside the package on its home page, with the loading window behaving as below
- shows its title, logo and version (agreeing with the exe's), a card per tool with its tour, What's new, Recent files, Getting started and the licence pop-up
- opens each tool in its frame with the tool's title and the exe's version, and the file pickers and localStorage work inside the frame
- writes a real Word and a real Excel download to disk from inside each tool's frame
- keeps each tool's work when switching between tools and the home page
- raises the unsaved-work warning from a tool's own frame (on reload) and from the suite (on close), and still lets the window close

## Folder build

```
powershell -ExecutionPolicy Bypass -File build-electron.ps1 [-Module risk-assessment] [-SelfTest]
```

No Node or npm is needed. The script:

1. rebuilds the module's single HTML file from the current app
2. downloads Electron's prebuilt Windows runtime once, and checks it against Electron's published SHA-256 list
3. puts the app (with the module's `module.json`) in `resources\app` and renames `electron.exe`

The output goes to `%LOCALAPPDATA%\OTCAT-electron\<module>\<product>\`, about 375 MB. `build-portable-exe.ps1` runs this first, then packs the result into one exe. `-SelfTest` here writes `selftest-result.txt` beside it.

## What the wrapper adds (`app/main.js`)

- **Closing with unsaved work.** Edge asks "Leave site?". Electron asks nothing and silently refuses to close, which would trap the window. The wrapper asks its own question and closes if told to. A negative control proved the window gets stuck without it.
- **Exports** get a Save As dialog that opens in Documents.
- **Web links** open in the normal browser, never inside the app.
- **One copy of each tool at a time**, because two copies would share one autosave store. The two tools are separate apps and can run together.
- **No menu bar**, and nothing from Node is exposed to the page (sandboxed, context isolation on).

## Not done, or worth knowing before going further

- **It is unsigned.** Windows SmartScreen will warn, and managed corporate machines may block it. Shipping it properly needs a code-signing certificate.
- **Icon:** the portable exe uses the SolutionsPT "pt" mark (`build/icon.ico`, made by `build-icon.ps1` from `build/icon-source.jpg`). The folder build still shows Electron's icon.
- **The code is not protected.** The app is readable in `resources\app`. The licence is what protects it.
- **No auto-update.** Each release is a new file to send out.
- **Test by hand** what the self-test cannot reach: Save in place and Load through the real file dialogs, and reopening a project after restarting the app.
- **When run from a VS Code terminal,** clear `ELECTRON_RUN_AS_NODE` first, or the exe runs as plain Node. VS Code sets it, and double-clicking the exe never has it. The build scripts do this for the self-test.

## Startup time (measured October 2026 on a SolutionsPT laptop, assessment tool)

The portable exe unpacks the whole app on every launch, and antivirus then scans what it unpacks.

| Build | File size | First launch | Later launches |
|---|---|---|---|
| Portable, all languages (original) | 97 MB | 43 s | about 16.5 s |
| Portable, English only (current default) | 89 MB | 41.5 s | about 16 s |
| Portable, English only, no compression (`-Compression store`) | 329 MB | 51 s | about 12 s |
| Already unpacked, as an installer would leave it | n/a | 17.7 s | 1 to 3 s |

Trimming makes the file smaller but barely helps startup. The unpacking itself is the cost. Only an installed (per-user) version avoids it. To measure again, run `build-portable-exe.ps1 [-Module <id>] -TimeStartup 3`.

## Loading screen

From double-click to the tool appearing, the portable exe shows one loading window, naming the product and version, with a bar that keeps moving the whole time. It can't show real progress, because the long waits (unpacking the 234 MB program file, then Windows checking it before it will run) report nothing, so the bar is a continuous sweep like most modern loaders.

- **`launcher-splash/OtcatSplash.cs`** is a small separate program (about 10 KB). The build compiles it with the .NET Framework compiler that ships with Windows, and stamps it with the product, version and SolutionsPT's details; its window title is the stamped product name. It shows `splash.bmp` (drawn per module by `build-splash.ps1 -Module <id>`) and animates the bar over the track. It closes when the app writes `.tool-ready` beside its exe, when the launcher exits, or after 3 minutes, so it can never be left behind.
- **Why a separate program:** electron-builder's launcher can only show a still image. It is also blocked through both long waits, and a bar it drew itself froze for seconds at a time (measured).
- **`build-portable-exe.ps1` patches electron-builder's launcher script (`portable.nsi`)** to start OtcatSplash first and to set `OTCAT_LAUNCHER_SPLASH`, so the app opens no second loading window. If OtcatSplash can't start, the launcher falls back to the still image. The patch also unpacks straight into place, skipping the installer's unpack-then-copy. It is applied to a pristine copy, and the build stops if electron-builder's template changes.
- **`app/splash.html`** is the app's own loading window, used by the folder build and as the fallback. `main.js` passes it the product name and version.

**How it was checked:**
- The self-test confirms the app opens no second window and signals when ready.
- Sampling only the loading window's own image showed the bar sweeping continuously, from the window appearing (about 1 s; 11 s the first time a new build runs, while antivirus checks it) until the tool was ready.
- Startup time is unchanged at about 15 to 19 s.
