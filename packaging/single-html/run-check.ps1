# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Runs a module's single-file parity check (module.json singleHtml.parityCheck,
# a page beside this script) in headless Edge, against the single file that
# build-single-html.ps1 last built for it.
#
#   powershell -ExecutionPolicy Bypass -File run-check.ps1 [-Module risk-assessment]
#
# The page's DOM goes to test-results\check-single-html-<module>.txt
# (git-ignored). Prints the PASS/FAIL counts; exits 1 unless the page printed
# ALL TESTS PASSED.
param([string]$Module = "assessments", [int]$TimeoutSec = 600)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $here)
. (Join-Path (Split-Path -Parent $here) "module-info.ps1") -Module $Module
$pageName = [string]$ModuleInfo.singleHtml.parityCheck
if (-not $pageName) { Write-Output "$AppProduct has no parity check page (module.json singleHtml.parityCheck)."; exit 0 }
$check = Join-Path $here $pageName
if (-not (Test-Path $check)) { throw "Parity check page not found: $check" }
if (-not (Test-Path (Join-Path $here $AppPageName))) { throw "Build the single file first: $AppPageName is not in $here" }

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outFile = Join-Path $repo "test-results\check-single-html-$Module.txt"
New-Item -ItemType Directory -Force (Split-Path $outFile) | Out-Null
if (Test-Path $outFile) { Remove-Item $outFile -Force }
$prof = Join-Path $env:TEMP ("edgeprof-" + [IO.Path]::GetRandomFileName())
$url = "file:///" + $check.Replace('\','/').Replace(' ','%20')
$p = Start-Process -FilePath $edge -NoNewWindow -PassThru -RedirectStandardOutput $outFile -RedirectStandardError (Join-Path $env:TEMP "check-single-err.txt") `
  -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--disable-sync","--allow-file-access-from-files","--user-data-dir=`"$prof`"","--virtual-time-budget=900000","--dump-dom","`"$url`"")
if (-not $p.WaitForExit($TimeoutSec * 1000)) { try { $p.Kill() } catch {}; throw "$pageName timed out" }
$text = ""
for ($i = 0; $i -lt 120; $i++) { try { $text = [IO.File]::ReadAllText($outFile); break } catch { Start-Sleep -Milliseconds 500 } }
try { Remove-Item $prof -Recurse -Force -ErrorAction Stop } catch {}
$pass = ([regex]::Matches($text, '(^|>)PASS ', 'Multiline')).Count
$fail = ([regex]::Matches($text, '(^|>)FAIL ', 'Multiline')).Count
$all  = $text -match 'ALL TESTS PASSED'
Write-Output ("{0} ({1}): {2} pass, {3} fail{4}" -f $pageName, $AppPageName, $pass, $fail, $(if ($all) { ", ALL TESTS PASSED" } else { "" }))
if (-not $all) {
  ([regex]::Matches($text, '(?m)^FAIL .*$') | Select-Object -First 20) | ForEach-Object { "  " + $_.Value }
  Write-Output "See $outFile"
  exit 1
}
exit 0
