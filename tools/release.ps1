# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Builds and checks a release of the OT Cyber suite from a clean, committed
# tree, and stages it for GitHub Releases. One version for the whole suite:
# every module is built, every file carries the same version, and the tag is
# v<x.y.z>. Each module still ships on its own (its own single HTML and its own
# portable exe), so a contractor can be given just the tool they need; the
# SolutionsPT OT Cyber Suite (platform\) ships beside them, with every tool in
# one file, for internal use.
#
#   .\tools\release.ps1              # full run: tests, single HTML, exe, tag
#   .\tools\release.ps1 -SkipTests   # skip the test suites (all of them take about 10 minutes)
#   .\tools\release.ps1 -NoTag       # build and check, but do not tag (works even if the tag exists)
#
# The version comes from shared\version.js (bump it, run tools\sync-shared.ps1,
# and update the pinned numbers in modules\assessments\scripts\test-version.html,
# in a commit first). The release notes are docs\releases\v<x.y.z>.md, one
# file per version, committed before the release: the GitHub release uses it,
# and the suite's home page shows it as What's new. The modules are the
# folders under modules\ with a module.json; see packaging\module-info.ps1.
#
# Steps, stopping at the first failure:
#   1. the working tree is clean, the tag for this version does not exist,
#      docs\releases\v<x.y.z>.md exists, every module's shared files match
#      their canonical copies, and the suite's home page data is current
#   2. every module's test pages, then the suite shell's (platform\scripts),
#      pass (unless -SkipTests)
#   3. every module's single HTML, then the suite's, is built and its check
#      page passes
#   4. every module's portable exe, then the suite's, is built and its
#      self-test passes
#   5. all the files and a SHA256SUMS.txt are staged in dist\<label>\ (e.g. dist\v0.5\)
#   6. an annotated tag v<version> is created locally (unless -NoTag)
#
# Publishing is then two steps (printed at the end): push the tag, and create
# the GitHub release with the files from dist\<label>\ attached.
param([switch]$SkipTests, [switch]$NoTag)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
. (Join-Path $repo "packaging\module-info.ps1")   # $AllModules, $AppVersion, $AppVersionLabel (the suite's)
$modules = $AllModules
$builds = @($AllModules) + "suite"   # the suite last: it carries every module's single HTML
$tag = "v$AppVersion"
$label = $AppVersionLabel
$notes = Join-Path $repo "docs\releases\v$AppVersion.md"
Write-Output "Release $label ($AppVersion), tag $tag, modules: $($modules -join ', '), and the suite"

# 1. Clean tree, new tag, release notes, no shared drift
$dirty = git status --porcelain
if ($dirty) { throw "The working tree has uncommitted changes. Commit or stash them first.`n$($dirty -join "`n")" }
# A trial run (-NoTag) makes no tag, so an existing one does not stop it.
if (git tag --list $tag) {
  if (-not $NoTag) { throw "Tag $tag already exists. Bump the version in shared\version.js first." }
  Write-Output "Tag $tag already exists; building anyway, as -NoTag makes no tag."
}
if (-not (Test-Path $notes)) { throw "No release notes for $AppVersion. Write docs\releases\v$AppVersion.md (see docs\releases\README.md) and commit it." }
& (Join-Path $PSScriptRoot "sync-shared.ps1") -Check
if ($LASTEXITCODE -ne 0) { throw "Shared files are out of step. Run tools\sync-shared.ps1 and commit." }
& (Join-Path $repo "platform\scripts\build-data.ps1") -Check
if ($LASTEXITCODE -ne 0) { throw "The suite's home page data is out of date. Run platform\scripts\build-data.ps1 and commit." }
$commit = (git rev-parse --short HEAD).Trim()

# 2. Tests, per module, with the time each module's pages need (module.json tests)
if (-not $SkipTests) {
  foreach ($m in $modules) {
    . (Join-Path $repo "packaging\module-info.ps1") -Module $m
    $vt = 300000; $to = 300
    if ($ModuleInfo.tests.virtualTimeMs) { $vt = [int]$ModuleInfo.tests.virtualTimeMs }
    if ($ModuleInfo.tests.timeoutSec) { $to = [int]$ModuleInfo.tests.timeoutSec }
    Write-Output "Running the $AppProduct test pages..."
    & (Join-Path $PSScriptRoot "run-tests.ps1") -Module $m -VirtualTimeMs $vt -TimeoutSec $to
    if ($LASTEXITCODE -ne 0) { throw "The $m test pages did not pass. See test-results\$m\." }
  }
  # The suite shell's own pages (platform\scripts\test-*.html): no module.json,
  # so the runner's defaults apply.
  Write-Output "Running the suite shell's test pages..."
  & (Join-Path $PSScriptRoot "run-tests.ps1") -Root (Join-Path $repo "platform")
  if ($LASTEXITCODE -ne 0) { throw "The platform test pages did not pass. See test-results\platform\." }
}

# Each file is staged as soon as it has passed its check, so a later build
# (the suite's rebuilds every module's single HTML to carry it) cannot swap
# in a copy other than the one that was checked.
$out = Join-Path $repo "dist\$label"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($m in $builds) {
  . (Join-Path $repo "packaging\module-info.ps1") -Module $m   # $AppProduct, $AppPageName, $AppExeName, $ElectronOut

  # 3. Single HTML + parity check
  Write-Output "Building the $AppProduct single HTML..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "packaging\single-html\build-single-html.ps1") -Module $m
  if ($LASTEXITCODE -ne 0) { throw "build-single-html.ps1 -Module $m failed" }
  $page = Join-Path $repo "packaging\single-html\$AppPageName"
  if (-not (Test-Path $page)) { throw "The single HTML was not produced: $page" }
  Write-Output "Checking it against the folder app..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "packaging\single-html\run-check.ps1") -Module $m
  if ($LASTEXITCODE -ne 0) { throw "The $m single HTML parity check did not pass. See test-results\check-single-html-$m.txt" }
  Copy-Item $page $out

  # 4. Portable exe + self-test
  Write-Output "Building the $AppProduct portable exe and running its self-test..."
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue   # VS Code terminals set it; the exe then runs as Node
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "packaging\electron\build-portable-exe.ps1") -Module $m -SelfTest
  if ($LASTEXITCODE -ne 0) { throw "build-portable-exe.ps1 -Module $m failed" }
  $selftest = Join-Path $ElectronOut "selftest-portable.txt"
  if (-not (Test-Path $selftest) -or ([IO.File]::ReadAllText($selftest) -notmatch 'ALL TESTS PASSED')) { throw "The $m exe self-test did not pass. See $selftest" }
  $exe = Join-Path $ElectronOut "dist\$AppExeName"
  if (-not (Test-Path $exe)) { throw "The built exe is not where expected, named for $label`: $exe" }
  Copy-Item $exe $out
}

# 5. Stage: every file named for this version, and their checksums
$staged = @(Get-ChildItem $out -File)
if ($staged.Count -ne 2 * $builds.Count) { throw "Expected $(2 * $builds.Count) files in $out, found $($staged.Count)" }
foreach ($f in $staged) {
  if ($f.Name -notmatch [regex]::Escape(" $label.")) { throw "$($f.Name) is not named for $label" }
}
# Listed under the names GitHub gives the release assets: it replaces each
# space with a dot, and a checksum file naming the local files would not
# match what a reader downloads.
$sums = Get-ChildItem $out -File | Sort-Object Name | ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name.Replace(' ', '.') }
[IO.File]::WriteAllLines((Join-Path $out "SHA256SUMS.txt"), $sums)
Write-Output "Staged in $out :"
Get-ChildItem $out | Sort-Object Name | ForEach-Object { "  {0}  ({1:N1} MB)" -f $_.Name, ($_.Length / 1MB) }

# 6. Tag
$products = @()
foreach ($m in $builds) { . (Join-Path $repo "packaging\module-info.ps1") -Module $m; $products += $AppProduct }
if (-not $NoTag) {
  git tag -a $tag -m "OT Cyber suite $label ($($products -join ', '))" | Out-Null
  Write-Output "Tagged $tag at $commit."
}

Write-Output ""
Write-Output "To publish:"
Write-Output "  git push origin main $tag"
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Output "  gh release create $tag (Get-ChildItem `"$out`" -File).FullName --verify-tag --title `"SolutionsPT OT Cyber Suite $label`" --notes-file `"$notes`""
  Write-Output "  (GitHub replaces spaces in the file names with dots; SHA256SUMS.txt already uses those names.)"
} else {
  Write-Output "  then on GitHub: Releases > Draft a new release > choose tag $tag, attach the files in $out, and use $notes as the notes"
}
