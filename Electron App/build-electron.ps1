# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
#
# Builds a TEST Electron desktop app of the OT Cyber Assessment Tool.
#
#   powershell -ExecutionPolicy Bypass -File build-electron.ps1 [-SelfTest]
#
# No Node or npm needed. Uses Electron's prebuilt Windows runtime (downloaded
# once, checksum-verified against Electron's published SHA256 list) and the
# documented manual packaging route: the app goes in resources\app, and
# electron.exe is renamed.
#
# The page is the single-file build from ..\Single HTML, rebuilt first, so the
# desktop app is always exactly what that check page verified. Nothing in
# ..\Assessments is touched.
#
# Output (about 300 MB, so deliberately NOT under OneDrive):
#   %LOCALAPPDATA%\OTCAT-electron\OT Cyber Assessment Tool\OT Cyber Assessment Tool.exe
#
# -SelfTest then runs the built exe with --self-test and prints the result.

param(
  [string]$ElectronVersion = "44.7.1",
  [string]$OutRoot = (Join-Path $env:LOCALAPPDATA "OTCAT-electron"),
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$single  = Join-Path (Split-Path -Parent $here) "Single HTML"
$product = "OT Cyber Assessment Tool"
$cache   = Join-Path $OutRoot "cache"
$dest    = Join-Path $OutRoot $product
New-Item -ItemType Directory -Force $cache | Out-Null

# 1. The page: rebuild the single file from the current app.
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $single "build-single-html.ps1")
if ($LASTEXITCODE -ne 0) { throw "Single-file build failed" }
. (Join-Path $here "get-version.ps1")   # $AppVersion, $AppVersionLabel, $AppPageName
$page = Join-Path $single $AppPageName

# 2. The Electron runtime, downloaded once and verified.
$zipName = "electron-v$ElectronVersion-win32-x64.zip"
$zip  = Join-Path $cache $zipName
$sums = Join-Path $cache "SHASUMS256-v$ElectronVersion.txt"
$base = "https://github.com/electron/electron/releases/download/v$ElectronVersion"
if (-not (Test-Path $sums)) { Invoke-WebRequest "$base/SHASUMS256.txt" -OutFile $sums -UseBasicParsing }
if (-not (Test-Path $zip))  { Write-Output "Downloading $zipName ..."; Invoke-WebRequest "$base/$zipName" -OutFile $zip -UseBasicParsing }
$want = ((Select-String -Path $sums -Pattern ([regex]::Escape($zipName) + '$')).Line -split '\s+')[0]
$got  = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($want -ne $got) { Remove-Item $zip -Force; throw "Checksum mismatch for $zipName (deleted; re-run to download again)" }

# 3. A clean copy of the runtime.
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $dest
Rename-Item (Join-Path $dest "electron.exe") "$product.exe"
$defaultApp = Join-Path $dest "resources\default_app.asar"
if (Test-Path $defaultApp) { Remove-Item $defaultApp -Force }

# 4. The app.
$appDir = Join-Path $dest "resources\app"
New-Item -ItemType Directory -Force $appDir | Out-Null
Copy-Item (Join-Path $here "app\*") $appDir -Recurse
Copy-Item (Join-Path $here "build\icon-256.png") (Join-Path $appDir "splash-logo.png")   # the loading window's logo
Copy-Item $page (Join-Path $appDir "index.html")
# The app's package.json takes the tool's version, from js/version.js.
$pkgPath = Join-Path $appDir "package.json"
$pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkgJson.version = $AppVersion
[IO.File]::WriteAllText($pkgPath, ($pkgJson | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding($false)))

$mb = [math]::Round(((Get-ChildItem $dest -Recurse | Measure-Object Length -Sum).Sum) / 1MB)
Write-Output "Built: $dest\$product.exe ($AppVersionLabel, $mb MB folder, Electron $ElectronVersion)"

# 5. Optional end-to-end check of the built exe.
if ($SelfTest) {
  $result = Join-Path $OutRoot "selftest-result.txt"
  if (Test-Path $result) { Remove-Item $result -Force }
  # VS Code is itself Electron and sets this for everything it launches; left
  # set, the exe runs as bare Node and rejects the app's flags ("bad option").
  # A user double-clicking the exe never has it.
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $p = Start-Process -FilePath (Join-Path $dest "$product.exe") -ArgumentList @("--self-test", "--out=`"$result`"") -PassThru
  if (-not $p.WaitForExit(300000)) { try { $p.Kill() } catch {}; throw "Self-test timed out" }
  if (Test-Path $result) { Get-Content $result } else { throw "Self-test wrote no result (exit code $($p.ExitCode))" }
}
