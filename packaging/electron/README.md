# OT Cyber Assessment Tool: Electron test build

Copyright (c) 2026 SolutionsPT. All rights reserved.

A trial desktop-app version of the assessment tool (not the risk tool). It runs the single-file build from `../Single HTML` unchanged, inside Electron's own copy of Chromium. Nothing in `../Assessments` is touched.

## Build

```
powershell -ExecutionPolicy Bypass -File build-electron.ps1 -SelfTest
```

No Node or npm is needed. The script:

1. rebuilds the single HTML file from the current app
2. downloads Electron's prebuilt Windows runtime once, and checks it against Electron's published SHA-256 list
3. puts the app in `resources\app` and renames `electron.exe`

The output goes to `%LOCALAPPDATA%\OTCAT-electron\OT Cyber Assessment Tool\`, outside OneDrive because it is about 375 MB. Run `OT Cyber Assessment Tool.exe` from there.

`-SelfTest` runs the built exe with `--self-test`. It checks that the app:

- starts from inside the package
- shows the logo, the copyright notice and the licence pop-up
- has localStorage and the file pickers
- scores every instrument, reports on it, and builds Word and Excel for it
- writes a real Word and a real Excel download to disk
- lets the window close when there is unsaved work

## What the wrapper adds (`app/main.js`)

- **Closing with unsaved work.** Edge asks "Leave site?". Electron asks nothing and silently refuses to close, which would trap the window. The wrapper asks its own question and closes if told to. A negative control proved the window gets stuck without it.
- **Exports** get a Save As dialog that opens in Documents.
- **Web links** open in the normal browser, never inside the app.
- **One copy at a time**, because two copies would share one autosave store.
- **No menu bar**, and nothing from Node is exposed to the page (sandboxed, context isolation on).

## Not done, or worth knowing before going further

- **The folder build is not one exe.** `build-portable-exe.ps1` (below) makes the single-file version.
- **It is unsigned.** Windows SmartScreen will warn, and managed corporate machines may block it. Shipping it properly needs a code-signing certificate.
- **Icon:** the portable exe uses the SolutionsPT "pt" mark (`build/icon.ico`, made by `build-icon.ps1` from `build/icon-source.jpg`). The folder build still shows Electron's icon.
- **The code is not protected.** The app is readable in `resources\app`. The licence is what protects it.
- **No auto-update.** Each release is a new folder to send out.
- **Test by hand** what the self-test cannot reach: Save in place and Load through the real file dialogs, and reopening a project after restarting the app.
- **When run from a VS Code terminal,** clear `ELECTRON_RUN_AS_NODE` first, or the exe runs as plain Node. VS Code sets it, and double-clicking the exe never has it. The build script does this for the self-test.

## One portable .exe

```
powershell -ExecutionPolicy Bypass -File build-portable-exe.ps1 -SelfTest
```

This produces `%LOCALAPPDATA%\OTCAT-electron\dist\OT Cyber Assessment Tool v0.5.exe`, a single 89 MB file named for the tool's version (from `../Assessments/js/version.js`, read by `get-version.ps1`). Nothing is installed: the exe unpacks itself to a temp folder each time it starts, so it takes a few seconds longer to open than the folder build. Its file properties name SolutionsPT and carry the copyright.

It uses `electron-builder` (pinned to 26.15.3) and needs a portable Node. That Node is unzipped, not installed, into `%LOCALAPPDATA%\OTCAT-electron\tools`; see the script header. Electron itself is reused from the folder build, which has already been checksum-verified, so it isn't downloaded twice. The full self-test passes when run from the single exe.

The icon comes from `build/icon.ico`; re-run `build-icon.ps1` if the source logo changes. A larger or vector source would sharpen the 256 px size, since the current one is 200 px.

## Startup time (measured October 2026 on a SolutionsPT laptop)

The portable exe unpacks the whole app on every launch, and antivirus then scans what it unpacks.

| Build | File size | First launch | Later launches |
|---|---|---|---|
| Portable, all languages (original) | 97 MB | 43 s | about 16.5 s |
| Portable, English only (current default) | 89 MB | 41.5 s | about 16 s |
| Portable, English only, no compression (`-Compression store`) | 329 MB | 51 s | about 12 s |
| Already unpacked, as an installer would leave it | n/a | 17.7 s | 1 to 3 s |

Trimming makes the file smaller but barely helps startup. The unpacking itself is the cost. Only an installed (per-user) version avoids it. To measure again, run `build-portable-exe.ps1 -TimeStartup 3`.

## Loading screen

From double-click to the tool appearing, the portable exe shows one loading window with a bar that keeps moving the whole time. It can't show real progress, because the long waits (unpacking the 234 MB program file, then Windows checking it before it will run) report nothing, so the bar is a continuous sweep like most modern loaders.

- **`launcher-splash/OtcatSplash.cs`** is a small separate program (about 10 KB). The build compiles it with the .NET Framework compiler that ships with Windows, and stamps it with the version and SolutionsPT's details. It shows `splash.bmp` (drawn by `build-splash.ps1`) and animates the bar over the track. It closes when the app writes `.tool-ready` beside its exe, when the launcher exits, or after 3 minutes, so it can never be left behind.
- **Why a separate program:** electron-builder's launcher can only show a still image. It is also blocked through both long waits, and a bar it drew itself froze for seconds at a time (measured).
- **`build-portable-exe.ps1` patches electron-builder's launcher script (`portable.nsi`)** to start OtcatSplash first and to set `OTCAT_LAUNCHER_SPLASH`, so the app opens no second loading window. If OtcatSplash can't start, the launcher falls back to the still image. The patch also unpacks straight into place, skipping the installer's unpack-then-copy. It is applied to a pristine copy, and the build stops if electron-builder's template changes.
- **`app/splash.html`** is the app's own loading window, used by the folder build and as the fallback.

**How it was checked:**
- The self-test confirms the app opens no second window and signals when ready.
- Sampling only the loading window's own image showed the bar sweeping continuously, from the window appearing (about 1 s; 11 s the first time a new build runs, while antivirus checks it) until the tool was ready.
- Startup time is unchanged at about 15 to 19 s.
