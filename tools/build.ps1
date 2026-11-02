# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# One entry point for building a module, as a single HTML file, a portable
# exe, or both. Each tool builds and ships on its own, so a contractor can be
# given just the one they need.
#
#   .\tools\build.ps1                                        # assessment tool, html + exe
#   .\tools\build.ps1 -Module risk-assessment -As html       # the risk tool's single HTML (+ parity check)
#   .\tools\build.ps1 -Module risk-assessment -As exe -SelfTest
#   .\tools\build.ps1 -Module all -As both -SelfTest         # every module
#
# -As html  builds packaging\single-html\<product> <label>.html, then runs the
#           module's parity check page against the folder app (skip it with
#           -SkipCheck).
# -As exe   builds %LOCALAPPDATA%\OTCAT-electron\<module>\dist\<product> <label>.exe
#           (which rebuilds the single HTML it wraps); -SelfTest then runs the
#           exe's own end-to-end check.
# -As both  does both, in that order.
#
# Modules are the folders under modules\ with a module.json (see
# packaging\module-info.ps1). The version is the suite's, from
# shared\version.js. Stops at the first failure, with exit code 1.
param(
  [string]$Module = "assessments",
  [ValidateSet("html", "exe", "both")][string]$As = "both",
  [switch]$SelfTest,
  [switch]$SkipCheck
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$requested = $Module   # module-info.ps1 sets $Module when dot-sourced
. (Join-Path $repo "packaging\module-info.ps1")   # $AllModules
$modules = if ($requested -eq "all") { $AllModules } else { @($requested) }

foreach ($m in $modules) {
  . (Join-Path $repo "packaging\module-info.ps1") -Module $m   # $AppProduct, $AppVersionLabel, $AppPageName, $AppExeName, $ElectronOut
  Write-Output ""
  Write-Output "== $AppProduct $AppVersionLabel ($m) =="

  if ($As -eq "html" -or $As -eq "both") {
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "packaging\single-html\build-single-html.ps1") -Module $m
    if ($LASTEXITCODE -ne 0) { throw "The single HTML build of $m failed" }
    if (-not $SkipCheck) {
      & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo "packaging\single-html\run-check.ps1") -Module $m
      if ($LASTEXITCODE -ne 0) { throw "The single HTML of $m does not match its folder app" }
    }
    Write-Output ("Single HTML: " + (Join-Path $repo "packaging\single-html\$AppPageName"))
  }

  if ($As -eq "exe" -or $As -eq "both") {
    # VS Code terminals set this; the exe would then run as bare Node.
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    $exeArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $repo "packaging\electron\build-portable-exe.ps1"), "-Module", $m)
    if ($SelfTest) { $exeArgs += "-SelfTest" }
    & powershell @exeArgs
    if ($LASTEXITCODE -ne 0) { throw "The portable exe build of $m failed" }
    $exe = Join-Path $ElectronOut "dist\$AppExeName"
    if (-not (Test-Path $exe)) { throw "The exe was not produced: $exe" }
    if ($SelfTest) {
      $result = Join-Path $ElectronOut "selftest-portable.txt"
      if (-not (Test-Path $result) -or ([IO.File]::ReadAllText($result) -notmatch 'ALL TESTS PASSED')) { throw "The exe self-test of $m did not pass. See $result" }
      Write-Output "Self-test passed: $result"
    }
    Write-Output "Portable exe: $exe"
  }
}
exit 0
