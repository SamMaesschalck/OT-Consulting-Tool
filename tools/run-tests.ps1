# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Runs a module's headless-Edge test pages (the tests.pages glob in
# modules\<module>\module.json, scripts\test-*.html for both modules) and
# reports PASS/FAIL counts per page.
#
#   .\tools\run-tests.ps1                                  # every assessments page
#   .\tools\run-tests.ps1 -Module risk-assessment          # every risk-assessment page
#   .\tools\run-tests.ps1 -Tests test-version.html,test-sl-partial-fr.html
#   .\tools\run-tests.ps1 -VirtualTimeMs 900000 -TimeoutSec 600   # Word-heavy pages
#
# Each page's DOM is dumped to test-results\<module>\<page>.txt (git-ignored);
# grep it for "^FAIL" to see what failed. Keep page names short: the dump
# path counts towards Windows' 260-character limit, and a page whose dump
# cannot be written reports "0 pass 0 fail incomplete".
param(
  [string]$Module = "assessments",
  [string]$Root,
  [string[]]$Tests,
  [int]$TimeoutSec = 300,
  [int]$VirtualTimeMs = 300000
)
if (-not $Root) { $Root = Join-Path (Split-Path -Parent $PSScriptRoot) "modules\$Module" }
if (-not (Test-Path $Root)) { throw "No such module folder: $Root" }
$ErrorActionPreference = "Continue"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out  = Join-Path (Split-Path -Parent $PSScriptRoot) ("test-results\" + (Split-Path $Root -Leaf).Replace(' ', '_'))
if (-not (Test-Path $out)) { New-Item -ItemType Directory $out -Force | Out-Null }
# The test pages: the module manifest's tests.pages glob (module.json), or
# scripts\test-*.html for a folder without one.
$pagesGlob = "scripts/test-*.html"
$manifest = Join-Path $Root "module.json"
if (Test-Path $manifest) {
  $mf = [IO.File]::ReadAllText($manifest, [Text.Encoding]::UTF8) | ConvertFrom-Json
  if ($mf.tests -and $mf.tests.pages) { $pagesGlob = [string]$mf.tests.pages }
}
$pagesGlob = $pagesGlob.Replace('/', '\')
$pagesDir = Join-Path $Root (Split-Path -Parent $pagesGlob)
if (-not $Tests -or $Tests.Count -eq 0) {
  $Tests = Get-ChildItem (Join-Path $Root $pagesGlob) | ForEach-Object { $_.Name }
}
$totalPass = 0; $totalFail = 0; $bad = @()
foreach ($t in $Tests) {
  $src = Join-Path $pagesDir $t
  if (-not (Test-Path $src)) { Write-Output "MISSING $t"; $bad += $t; continue }
  $dom = Join-Path $out ($t -replace '\.html$', '.txt')
  if (Test-Path $dom) { Remove-Item $dom -Force }
  $profileDir = Join-Path $env:TEMP ("edgeprof-" + [System.IO.Path]::GetRandomFileName())
  $url = "file:///" + $src.Replace('\','/').Replace(' ','%20')
  $edgeArgs = @("--headless=new", "--disable-gpu", "--no-first-run", "--disable-sync",
                "--allow-file-access-from-files", "--user-data-dir=`"$profileDir`"",
                "--virtual-time-budget=$VirtualTimeMs", "--dump-dom", "`"$url`"")
  $err = Join-Path $out "stderr.txt"
  $p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -NoNewWindow -PassThru `
        -RedirectStandardOutput $dom -RedirectStandardError $err
  if (-not $p.WaitForExit($TimeoutSec * 1000)) { try { $p.Kill() } catch {}; Write-Output ("{0,-45} TIMEOUT" -f $t); $bad += $t; continue }
  $txt = ""
  for ($i = 0; $i -lt 120; $i++) { try { $txt = [IO.File]::ReadAllText($dom); break } catch { Start-Sleep -Milliseconds 500 } }
  if ($null -eq $txt) { $txt = "" }
  $pass = ([regex]::Matches($txt, '(^|>)PASS ', 'Multiline')).Count
  $fail = ([regex]::Matches($txt, '(^|>)FAIL ', 'Multiline')).Count
  $done = if ($txt -match 'ALL TESTS PASSED|FAILED|smoke OK.|DOCX_READY') { "complete" } else { "incomplete" }
  Write-Output ("{0,-45} {1,4} pass {2,4} fail  {3}" -f $t, $pass, $fail, $done)
  $totalPass += $pass; $totalFail += $fail
  if ($fail -gt 0 -or $done -ne "complete") { $bad += $t }
  try { Remove-Item $profileDir -Recurse -Force -ErrorAction Stop } catch {}
}
Write-Output ""
Write-Output ("{0} pages, {1} pass, {2} fail" -f $Tests.Count, $totalPass, $totalFail)
if ($bad.Count) { Write-Output ("Needs a look: " + ($bad -join ", ")); exit 1 }
exit 0
