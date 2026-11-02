# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
#
# Builds one module as ONE portable .exe (no install: it unpacks itself to a
# temp folder each time it starts, then runs): the OT Cyber Assessment Tool
# (default) or the OT Cyber Risk Assessment Tool. Each stays available on its
# own, so a contractor can be given just one exe.
#
#   powershell -ExecutionPolicy Bypass -File build-portable-exe.ps1 [-Module risk-assessment] [-SelfTest]
#
# Uses electron-builder's "portable" target. That needs Node, so a portable
# Node (unzipped, not installed) lives in %LOCALAPPDATA%\OTCAT-electron\tools;
# get it once with:
#   https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip (checksum-verify, unzip there)
# Electron itself is NOT downloaded again: the build points electron-builder
# at the runtime build-electron.ps1 already verified.
#
# Each module's exe has its own appId and productName (from its module.json),
# so the two keep separate local storage (autosave) and can run side by side,
# and its own loading window naming the product.
#
# Everything heavy stays in %LOCALAPPDATA%\OTCAT-electron, outside OneDrive.
# Shared by every module: cache\ (Electron download), tools\ (Node),
# builder\ (the electron-builder staging project and its node_modules).
# Per module, so builds never overwrite each other:
#   %LOCALAPPDATA%\OTCAT-electron\<module>\dist\<product> v<version>.exe
#   %LOCALAPPDATA%\OTCAT-electron\<module>\selftest-portable.txt  (-SelfTest)
# The product comes from modules\<module>\module.json (platform\suite.json for
# -Module suite, the SolutionsPT OT Cyber Suite) and the version from
# ..\..\shared\version.js (see ..\module-info.ps1).
#
# Unsigned: Windows SmartScreen will warn until it is signed with a
# code-signing certificate.

param(
  [string]$Module = "assessments",
  [string]$ElectronVersion = "44.7.1",
  [string]$NodeVersion = "v24.21.0",
  [string]$BuilderVersion = "26.15.3",
  [switch]$SelfTest,
  # Trimming: only the English language packs (the tool is English only),
  # which takes 46 MB out of what the exe unpacks on every launch.
  [switch]$NoTrim,
  # 7-Zip compression of the portable exe: "store" (none), "normal", "maximum".
  [string]$Compression = "normal",
  # Time N launches, from double-click to the tool being up.
  [int]$TimeStartup = 0
)

$ErrorActionPreference = "Stop"
$here    = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path (Split-Path -Parent $here) "module-info.ps1") -Module $Module   # $ModuleInfo, $ModuleDir, $AppProduct, $AppVersion, $AppVersionLabel, $AppPageName, $ElectronRoot, $ElectronOut
$root    = $ElectronRoot
$node    = Join-Path $root "tools\node-$NodeVersion-win-x64"
$stage   = Join-Path $root "builder"
$dist    = Join-Path $ElectronOut "dist"
$edist   = Join-Path $root "electron-dist-$ElectronVersion"
$product = $AppProduct
$selfTestJs = "selftest-" + $ModuleInfo.electron.selfTest + ".js"
if (-not (Test-Path (Join-Path $here "app\$selfTestJs"))) { throw "No self-test app\$selfTestJs for module $Module (module.json electron.selfTest)" }

if (-not (Test-Path (Join-Path $node "node.exe"))) { throw "Portable Node not found at $node (see the header of this script)" }
$env:PATH = "$node;$env:PATH"
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

# 1. The single HTML page and the verified Electron runtime (the folder build
#    does both, and its download is checksum-checked).
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here "build-electron.ps1") -Module $Module -ElectronVersion $ElectronVersion
if ($LASTEXITCODE -ne 0) { throw "build-electron.ps1 failed" }
if (-not (Test-Path (Join-Path $edist "electron.exe"))) {
  Expand-Archive (Join-Path $root "cache\electron-v$ElectronVersion-win32-x64.zip") -DestinationPath $edist
}

# 2. A staging project: the app files plus electron-builder's settings. The
#    staging folder (and its node_modules) is shared by every module; only
#    the output is per module.
if (Test-Path $stage) { Get-ChildItem $stage -Exclude "node_modules", "package-lock.json" | Remove-Item -Recurse -Force }
New-Item -ItemType Directory -Force $stage | Out-Null
Copy-Item (Join-Path $here "app\main.js"), (Join-Path $here "app\$selfTestJs"), (Join-Path $here "app\splash.html") $stage
Copy-Item $ModuleManifest (Join-Path $stage "module.json")   # which module this is, for main.js (the suite's is platform\suite.json)
Copy-Item (Join-Path $here "build\icon-256.png") (Join-Path $stage "splash-logo.png")
# The app icon, made by build-icon.ps1 from the square "pt" mark.
New-Item -ItemType Directory -Force (Join-Path $stage "build") | Out-Null
Copy-Item (Join-Path $here "build\icon.ico") (Join-Path $stage "build\icon.ico")
# What the exe shows while it unpacks, drawn for this product and version.
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here "build-splash.ps1") -Module $Module -Out (Join-Path $stage "build\splash.bmp")
if ($LASTEXITCODE -ne 0) { throw "build-splash.ps1 failed" }
# The animated loading window (launcher-splash\OtcatSplash.cs), compiled with
# the .NET Framework compiler that ships with Windows, and stamped with the
# tool's version and SolutionsPT's details like the main exe.
$csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { throw "The .NET Framework C# compiler was not found at $csc" }
$asmInfo = Join-Path $stage "build\OtcatSplashInfo.cs"
[IO.File]::WriteAllText($asmInfo, @"
[assembly: System.Reflection.AssemblyTitle("$product loading window")]
[assembly: System.Reflection.AssemblyProduct("$product")]
[assembly: System.Reflection.AssemblyCompany("SolutionsPT")]
[assembly: System.Reflection.AssemblyCopyright("Copyright (c) 2026 SolutionsPT. All rights reserved.")]
[assembly: System.Reflection.AssemblyVersion("$AppVersion.0")]
[assembly: System.Reflection.AssemblyFileVersion("$AppVersion.0")]
"@)
& $csc /nologo /target:winexe /optimize+ /out:"$(Join-Path $stage 'build\OtcatSplash.exe')" /win32icon:"$(Join-Path $here 'build\icon.ico')" `
  /reference:System.Windows.Forms.dll /reference:System.Drawing.dll (Join-Path $here "launcher-splash\OtcatSplash.cs") $asmInfo
if ($LASTEXITCODE -ne 0) { throw "Compiling the loading window failed" }
Copy-Item (Join-Path (Split-Path -Parent $here) "single-html\$AppPageName") (Join-Path $stage "index.html")

# The package name and appId are the module's own: Electron keeps each app's
# local storage under its product name, so the two exes never share autosave.
$pkg = [ordered]@{
  name = $ModuleInfo.electron.packageName; productName = $product; version = $AppVersion
  description = "$product. Copyright (c) 2026 SolutionsPT. All rights reserved."; author = "SolutionsPT"; license = "UNLICENSED"; private = $true
  main = "main.js"
  devDependencies = [ordered]@{ "electron-builder" = $BuilderVersion }
  build = [ordered]@{
    appId = $ModuleInfo.electron.appId
    productName = $product
    copyright = "Copyright (c) 2026 SolutionsPT. All rights reserved."
    electronVersion = $ElectronVersion
    electronDist = $edist
    directories = [ordered]@{ output = $dist }
    files = @("main.js", $selfTestJs, "module.json", "index.html", "splash.html", "splash-logo.png", "package.json")
    win = [ordered]@{ target = @([ordered]@{ target = "portable"; arch = @("x64") }); icon = "build/icon.ico" }
    portable = [ordered]@{ artifactName = ('${productName} ' + $AppVersionLabel + '.exe'); splashImage = "build/splash.bmp" }
    compression = $Compression
  }
}
if (-not $NoTrim) { $pkg.build.electronLanguages = @("en-GB", "en-US") }
[IO.File]::WriteAllText((Join-Path $stage "package.json"), ($pkg | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))

# 3. electron-builder (pinned), then the build.
Push-Location $stage
try {
  if (-not (Test-Path "node_modules\.bin\electron-builder.cmd")) {
    & (Join-Path $node "npm.cmd") install --no-audit --no-fund --loglevel=error
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
  }
  # The launcher's loading screen. Out of the box electron-builder's portable
  # launcher shows a still image while it unpacks, then takes it down the moment
  # it starts the app, leaving several seconds of nothing (measured: about 6 s)
  # while Windows checks and starts the unpacked exe. And it cannot animate
  # anything itself: it is blocked through both of the long waits.
  #
  # Patched, it starts OtcatSplash.exe (launcher-splash\, compiled above) the
  # moment it opens. That small program shows the picture and animates the bar
  # on its own, until the app writes ".tool-ready" beside its exe once the
  # tool's window is up, or the launcher exits. It sets OTCAT_LAUNCHER_SPLASH
  # so the app does not open a second loading window. If OtcatSplash cannot
  # start, the launcher falls back to the still image.
  #
  # It also unpacks straight into place, instead of unpacking to one folder and
  # copying everything to another (that copy only matters to the installer,
  # which may be replacing a running app).
  #
  # Always applied to a pristine copy, and the build stops if electron-builder's
  # template no longer has the lines it changes.
  $tpl  = "node_modules\app-builder-lib\templates\nsis\portable.nsi"
  $orig = "$tpl.orig"
  if (-not (Test-Path $orig)) { Copy-Item $tpl $orig }
  $nsi = [IO.File]::ReadAllText((Resolve-Path $orig))
  function Update-Nsi([string]$text, [regex]$anchor, [string]$replacement, [string]$what) {
    if (-not $anchor.IsMatch($text)) { throw "electron-builder's portable.nsi has changed ($what); review the loading-screen patch in build-portable-exe.ps1" }
    return $anchor.Replace($text, $replacement.Replace('$', '$$'), 1)
  }

  # 1. Start the loading window as soon as the launcher opens.
  $setup = @'
    File /oname=$PLUGINSDIR\splash.bmp "${SPLASH_IMAGE}"
    ; SolutionsPT: the animated loading window, a program of its own so it keeps
    ; moving while this launcher is blocked unpacking and starting the app.
    File /oname=$PLUGINSDIR\OtcatSplash.exe "SPLASH_EXE"
    !ifdef UNPACK_DIR_NAME
      StrCpy $0 "$TEMP\${UNPACK_DIR_NAME}"
    !else
      StrCpy $0 "$PLUGINSDIR\app"
    !endif
    System::Call 'kernel32::GetCurrentProcessId() i .r1'
    ClearErrors
    Exec '"$PLUGINSDIR\OtcatSplash.exe" "$PLUGINSDIR\splash.bmp" "$0\.tool-ready" $1'
    ${If} ${Errors}
      BgImage::SetBg $PLUGINSDIR\splash.bmp
      BgImage::Redraw
    ${Else}
      System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("OTCAT_LAUNCHER_SPLASH", "1").r0'
    ${EndIf}

'@
  $setup = $setup.Replace("SPLASH_EXE", (Join-Path $stage "build\OtcatSplash.exe"))
  $nsi = Update-Nsi $nsi ([regex]'(?s)    File /oname=\$PLUGINSDIR\\splash\.bmp "\$\{SPLASH_IMAGE\}"\r?\n    BgImage::SetBg \$PLUGINSDIR\\splash\.bmp\r?\n    BgImage::Redraw\r?\n') $setup "splash setup"

  # 2. Unpack straight into place.
  $extract = @'
      !ifdef SPLASH_IMAGE
        ; SolutionsPT: unpack straight into $INSTDIR, which is new and empty, so
        ; the installer's unpack-then-copy is not needed.
        Var /GLOBAL packageArch
        !ifdef COMPRESS
          SetCompress off
        !endif
        !insertmacro identify_package
        !insertmacro compute_files_for_current_arch
        !ifdef COMPRESS
          SetCompress "${COMPRESS}"
        !endif
        Nsis7z::Extract "$PLUGINSDIR\app-$packageArch.7z"
        Delete "$PLUGINSDIR\app-$packageArch.7z"
        !insertmacro custom_files_post_decompression
      !else
        !insertmacro extractEmbeddedAppPackage
      !endif

'@
  $nsi = Update-Nsi $nsi ([regex]'(?m)^      !insertmacro extractEmbeddedAppPackage\r?\n') $extract "extract"

  [IO.File]::WriteAllText((Join-Path (Get-Location) $tpl), $nsi, (New-Object Text.UTF8Encoding($false)))

  if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
  & ".\node_modules\.bin\electron-builder.cmd" --win portable --x64
  if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }
} finally { Pop-Location }

$exe = Get-ChildItem $dist -Filter "*.exe" | Select-Object -First 1
if (-not $exe) { throw "No exe produced in $dist" }
Write-Output ("Built: {0} ({1} MB)" -f $exe.FullName, [math]::Round($exe.Length / 1MB))

# 4. Optional: run the finished exe's own end-to-end check.
if ($SelfTest) {
  $result = Join-Path $ElectronOut "selftest-portable.txt"
  if (Test-Path $result) { Remove-Item $result -Force }
  $p = Start-Process -FilePath $exe.FullName -ArgumentList @("--self-test", "--out=$result") -PassThru
  if (-not $p.WaitForExit(400000)) { try { $p.Kill() } catch {}; throw "Self-test timed out" }
  for ($i = 0; $i -lt 30 -and -not (Test-Path $result); $i++) { Start-Sleep -Seconds 1 }
  if (Test-Path $result) { Get-Content $result } else { throw "Self-test wrote no result (exit code $($p.ExitCode))" }
}

# 5. Optional: how long a launch takes, double-click to the tool being ready.
#    Each run unpacks afresh (the portable exe always does), so every run is a
#    real cold start as far as the exe is concerned.
if ($TimeStartup -gt 0) {
  $times = @()
  for ($i = 1; $i -le $TimeStartup; $i++) {
    $ready = Join-Path $ElectronOut "startup-ready.txt"
    if (Test-Path $ready) { Remove-Item $ready -Force }
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $p = Start-Process -FilePath $exe.FullName -ArgumentList @("--self-test", "--startup-only", "--out=$ready") -PassThru
    while (-not (Test-Path $ready) -and $sw.Elapsed.TotalSeconds -lt 180) { Start-Sleep -Milliseconds 100 }
    $sw.Stop()
    if (-not (Test-Path $ready)) { throw "Launch $i did not start within 180 s" }
    $times += [math]::Round($sw.Elapsed.TotalSeconds, 1)
    $null = $p.WaitForExit(120000)   # let it close and clean up before the next run
    Start-Sleep -Seconds 2
  }
  Write-Output ("Startup: {0} s (runs: {1})" -f [math]::Round(($times | Measure-Object -Average).Average, 1), ($times -join ", "))
}
