# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Runs a module's headless-Edge test pages (the tests.pages glob in
# modules\<module>\module.json, scripts\test-*.html for every module) and
# reports PASS/FAIL counts per page.
#
#   .\tools\run-tests.ps1                                  # every assessments page
#   .\tools\run-tests.ps1 -Module risk-assessment          # every risk-assessment page
#   .\tools\run-tests.ps1 -Tests test-version.html,test-sl-partial-fr.html
#   .\tools\run-tests.ps1 -VirtualTimeMs 900000 -TimeoutSec 600   # Word-heavy pages
#   .\tools\run-tests.ps1 -Root platform                   # the suite shell's pages
#   .\tools\run-tests.ps1 -Module documents -Parallel 6    # up to 6 pages at once
#
# Each page's DOM is dumped to test-results\<module>\<page>.txt (git-ignored);
# grep it for "^FAIL" to see what failed. Edge's own messages for that page go
# to <page>.stderr.txt beside it. Keep page names short: the dump path counts
# towards Windows' 260-character limit, and a page whose dump cannot be
# written reports "0 pass 0 fail incomplete".
#
# A page is "complete" only when its own summary line is in what it printed
# (script and style text are left out first, as many pages carry the words in
# their source): "ALL TESTS PASSED", "<n> FAILED", "<n> TEST(S) FAILED",
# "<n> passed, <m> failed" or "... smoke OK.", at the start of a line. A page
# that prints no PASS and no FAIL line at all is incomplete whatever it says.
#
# -Parallel <n> (default 1, which runs one page at a time as before) runs up to
# n pages at once, each in its own Edge profile with its own dump and stderr
# file; results are still printed in page order. Pages whose checks depend on
# timing, scrolling or hit-testing under a quiet CPU are listed in the module's
# module.json as tests.alone (file names): when one comes up, the runner waits
# for every running page to finish and runs it on its own.
param(
  [string]$Module = "assessments",
  [string]$Root,
  [string[]]$Tests,
  [int]$TimeoutSec = 300,
  [int]$VirtualTimeMs = 300000,
  [ValidateRange(1, 32)][int]$Parallel = 1
)
if (-not $Root) { $Root = Join-Path (Split-Path -Parent $PSScriptRoot) "modules\$Module" }
if (-not (Test-Path $Root)) { throw "No such module folder: $Root" }
# Absolute, so the file:/// URLs built from it point at the pages (a relative
# -Root such as "platform" would otherwise give file:///platform/...).
$Root = (Resolve-Path -LiteralPath $Root).Path
$ErrorActionPreference = "Continue"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out  = Join-Path (Split-Path -Parent $PSScriptRoot) ("test-results\" + (Split-Path $Root -Leaf).Replace(' ', '_'))
if (-not (Test-Path $out)) { New-Item -ItemType Directory $out -Force | Out-Null }
# The test pages: the module manifest's tests.pages glob (module.json), or
# scripts\test-*.html for a folder without one.
$pagesGlob = "scripts/test-*.html"
$alone = @()
$manifest = Join-Path $Root "module.json"
if (Test-Path $manifest) {
  $mf = [IO.File]::ReadAllText($manifest, [Text.Encoding]::UTF8) | ConvertFrom-Json
  if ($mf.tests -and $mf.tests.pages) { $pagesGlob = [string]$mf.tests.pages }
  if ($mf.tests -and $mf.tests.alone) { $alone = @($mf.tests.alone | ForEach-Object { [string]$_ }) }
}
$pagesGlob = $pagesGlob.Replace('/', '\')
$pagesDir = Join-Path $Root (Split-Path -Parent $pagesGlob)
if (-not $Tests -or $Tests.Count -eq 0) {
  $Tests = Get-ChildItem (Join-Path $Root $pagesGlob) | ForEach-Object { $_.Name }
}

# Starts one page in its own headless Edge; returns what Finish-Page needs.
function Start-Page([string]$t) {
  $src = Join-Path $pagesDir $t
  if (-not (Test-Path $src)) { return @{ Name = $t; Missing = $true } }
  $dom = Join-Path $out ($t -replace '\.html$', '.txt')
  $err = Join-Path $out ($t -replace '\.html$', '.stderr.txt')
  foreach ($f in @($dom, $err)) { if (Test-Path $f) { Remove-Item $f -Force } }
  $profileDir = Join-Path $env:TEMP ("edgeprof-" + [System.IO.Path]::GetRandomFileName())
  $url = "file:///" + $src.Replace('\','/').Replace(' ','%20')
  $edgeArgs = @("--headless=new", "--disable-gpu", "--no-first-run", "--disable-sync",
                "--allow-file-access-from-files", "--user-data-dir=`"$profileDir`"",
                "--window-size=1600,1000",
                "--virtual-time-budget=$VirtualTimeMs", "--dump-dom", "`"$url`"")
  $p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -NoNewWindow -PassThru `
        -RedirectStandardOutput $dom -RedirectStandardError $err
  return @{ Name = $t; Proc = $p; Dom = $dom; Profile = $profileDir; Started = [DateTime]::Now }
}

# Reads a finished (or timed-out) page's dump and returns its result line.
function Finish-Page($job, [bool]$timedOut) {
  $t = $job.Name
  if ($job.Missing) { return @{ Line = "MISSING $t"; Pass = 0; Fail = 0; Bad = $true } }
  if ($timedOut) {
    try { $job.Proc.Kill() } catch {}
    try { Remove-Item $job.Profile -Recurse -Force -ErrorAction Stop } catch {}
    return @{ Line = ("{0,-45} TIMEOUT" -f $t); Pass = 0; Fail = 0; Bad = $true }
  }
  $txt = $null
  for ($i = 0; $i -lt 120; $i++) { try { $txt = [IO.File]::ReadAllText($job.Dom); break } catch { Start-Sleep -Milliseconds 500 } }
  if ($null -eq $txt) { $txt = "" }
  # What the page printed: its DOM without script and style text.
  $shown = [regex]::Replace($txt, '(?is)<script\b[^>]*>.*?</script>', '')
  $shown = [regex]::Replace($shown, '(?is)<style\b[^>]*>.*?</style>', '')
  $pass = ([regex]::Matches($shown, '(^|>)PASS ', 'Multiline')).Count
  $fail = ([regex]::Matches($shown, '(^|>)FAIL ', 'Multiline')).Count
  $summary = '(?m)(^|>)[ \t]*(ALL TESTS PASSED|[0-9]+ FAILED|[0-9]+ TEST\(S\) FAILED|[0-9]+ passed, [0-9]+ failed|[^<\r\n]*smoke OK\.)'
  $done = if ([regex]::IsMatch($shown, $summary) -and ($pass + $fail) -gt 0) { "complete" } else { "incomplete" }
  $secs = ([DateTime]::Now - $job.Started).TotalSeconds
  try { Remove-Item $job.Profile -Recurse -Force -ErrorAction Stop } catch {}
  return @{ Line = ("{0,-45} {1,4} pass {2,4} fail  {3,-10} {4,6:N1} s" -f $t, $pass, $fail, $done, $secs)
            Pass = $pass; Fail = $fail; Bad = ($fail -gt 0 -or $done -ne "complete") }
}

$totalPass = 0; $totalFail = 0; $bad = @()
$results = @{}          # page index -> result
$running = @{}          # page index -> job
$next = 0               # next page to start
$print = 0              # next page to print, so output stays in page order
while ($print -lt $Tests.Count) {
  # Start pages while there is room. A page on the alone list waits for every
  # running page to finish, and nothing starts beside it.
  while ($next -lt $Tests.Count) {
    $isAlone = $Parallel -gt 1 -and ($alone -contains $Tests[$next])
    if (@($running.Values | Where-Object { $_.Alone }).Count -gt 0) { break }
    if ($isAlone -and $running.Count -gt 0) { break }
    if ($running.Count -ge $Parallel) { break }
    $job = Start-Page $Tests[$next]
    $job.Alone = $isAlone
    if ($job.Missing) { $results[$next] = Finish-Page $job $false } else { $running[$next] = $job }
    $next++
  }
  # Collect whatever has finished or run out of time.
  foreach ($k in @($running.Keys)) {
    $job = $running[$k]
    $exited = $job.Proc.WaitForExit(0)
    $timedOut = (-not $exited) -and ([DateTime]::Now - $job.Started).TotalSeconds -gt $TimeoutSec
    if ($exited -or $timedOut) { $results[$k] = Finish-Page $job $timedOut; $running.Remove($k) }
  }
  while ($results.ContainsKey($print)) {
    $r = $results[$print]
    Write-Output $r.Line
    $totalPass += $r.Pass; $totalFail += $r.Fail
    if ($r.Bad) { $bad += $Tests[$print] }
    $results.Remove($print); $print++
  }
  if ($running.Count -gt 0) { Start-Sleep -Milliseconds 200 }
}
Write-Output ""
Write-Output ("{0} pages, {1} pass, {2} fail" -f $Tests.Count, $totalPass, $totalFail)
if ($bad.Count) { Write-Output ("Needs a look: " + ($bad -join ", ")); exit 1 }
exit 0
