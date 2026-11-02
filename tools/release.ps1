# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Builds and checks a release of the OT Cyber Assessment Tool from a clean,
# committed tree, and stages it for GitHub Releases.
#
#   .\tools\release.ps1              # full run: tests, single HTML, exe, tag
#   .\tools\release.ps1 -SkipTests   # skip the ~40 minute test suite
#   .\tools\release.ps1 -NoTag       # build and check, but do not tag
#
# The version comes from Assessments\js\version.js (bump it, and the pinned
# numbers in Assessments\scripts\test-version.html, in a commit first).
#
# Steps, stopping at the first failure:
#   1. the working tree is clean and the tag for this version does not exist
#   2. the full headless test suite passes (unless -SkipTests)
#   3. the single HTML is built and check-single-html.html passes
#   4. the portable exe is built and its self-test passes
#   5. both files and a SHA256SUMS.txt are copied to dist\<version>\
#   6. an annotated tag v<version> is created locally (unless -NoTag)
#
# Publishing is then two steps (printed at the end): push the tag, and create
# the GitHub release with the files from dist\<version>\ attached.
param([switch]$SkipTests, [switch]$NoTag)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
. (Join-Path $repo "Electron App\get-version.ps1")   # $AppVersion, $AppVersionLabel, $AppPageName
$tag = "v$AppVersion"
Write-Output "Release $AppVersionLabel ($AppVersion), tag $tag"

# 1. Clean tree, new tag
$dirty = git status --porcelain
if ($dirty) { throw "The working tree has uncommitted changes. Commit or stash them first.`n$($dirty -join "`n")" }
if (git tag --list $tag) { throw "Tag $tag already exists. Bump the version in Assessments\js\version.js first." }
$commit = (git rev-parse --short HEAD).Trim()

# 2. Tests
if (-not $SkipTests) {
  Write-Output "Running the full test suite (about 40 minutes)..."
  & (Join-Path $PSScriptRoot "run-tests.ps1") -VirtualTimeMs 900000 -TimeoutSec 600
  if ($LASTEXITCODE -ne 0) { throw "The test suite did not pass. See test-results\Assessments\." }
}

# 3. Single HTML + parity check
Write-Output "Building the single HTML..."
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "Single HTML\build-single-html.ps1")
if ($LASTEXITCODE -ne 0) { throw "build-single-html.ps1 failed" }
$page = Join-Path $repo "Single HTML\$AppPageName"
if (-not (Test-Path $page)) { throw "The single HTML was not produced: $page" }

Write-Output "Checking the single HTML against the folder app..."
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$check = Join-Path $repo "Single HTML\check-single-html.html"
$checkOut = Join-Path $repo "test-results\check-single-html.txt"
New-Item -ItemType Directory -Force (Split-Path $checkOut) | Out-Null
$prof = Join-Path $env:TEMP ("edgeprof-" + [IO.Path]::GetRandomFileName())
$url = "file:///" + $check.Replace('\','/').Replace(' ','%20')
$p = Start-Process -FilePath $edge -NoNewWindow -PassThru -RedirectStandardOutput $checkOut -RedirectStandardError (Join-Path $env:TEMP "check-single-err.txt") `
  -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--allow-file-access-from-files","--user-data-dir=`"$prof`"","--virtual-time-budget=900000","--dump-dom","`"$url`"")
if (-not $p.WaitForExit(600000)) { try { $p.Kill() } catch {}; throw "check-single-html timed out" }
$checkText = [IO.File]::ReadAllText($checkOut)
if ($checkText -notmatch 'ALL TESTS PASSED') { throw "check-single-html.html did not pass. See $checkOut" }

# 4. Portable exe + self-test
Write-Output "Building the portable exe and running its self-test..."
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue   # VS Code terminals set it; the exe then runs as Node
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "Electron App\build-portable-exe.ps1") -SelfTest
if ($LASTEXITCODE -ne 0) { throw "build-portable-exe.ps1 failed" }
$selftest = Join-Path $env:LOCALAPPDATA "OTCAT-electron\selftest-portable.txt"
if (-not (Test-Path $selftest) -or ([IO.File]::ReadAllText($selftest) -notmatch 'ALL TESTS PASSED')) { throw "The exe self-test did not pass. See $selftest" }
$exe = Get-ChildItem (Join-Path $env:LOCALAPPDATA "OTCAT-electron\dist") -Filter "*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $exe -or $exe.Name -notmatch [regex]::Escape($AppVersionLabel)) { throw "The built exe does not carry $AppVersionLabel in its name." }

# 5. Stage
$out = Join-Path $repo "dist\$AppVersionLabel"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item $page $out
Copy-Item $exe.FullName $out
$sums = Get-ChildItem $out -File | ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name }
[IO.File]::WriteAllLines((Join-Path $out "SHA256SUMS.txt"), $sums)
Write-Output "Staged in $out :"
Get-ChildItem $out | ForEach-Object { "  {0}  ({1:N1} MB)" -f $_.Name, ($_.Length / 1MB) }

# 6. Tag
if (-not $NoTag) {
  git tag -a $tag -m "OT Cyber Assessment Tool $AppVersionLabel" | Out-Null
  Write-Output "Tagged $tag at $commit."
}

Write-Output ""
Write-Output "To publish:"
Write-Output "  git push origin main $tag"
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Output "  gh release create $tag `"$out\*`" --title `"OT Cyber Assessment Tool $AppVersionLabel`" --notes-file <notes.md>"
} else {
  Write-Output "  then on GitHub: Releases > Draft a new release > choose tag $tag, and attach the files in $out"
}
