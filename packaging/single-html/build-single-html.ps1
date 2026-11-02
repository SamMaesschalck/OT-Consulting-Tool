# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Builds one module as ONE self-contained HTML file, for handing out. It reads
# the working app in ..\..\modules\<module> and never writes there: the folder
# version stays the one that is developed and tested. Each tool stays
# available on its own: a contractor can be given just one of these files.
#
#   powershell -ExecutionPolicy Bypass -File build-single-html.ps1                          # the assessment tool
#   powershell -ExecutionPolicy Bypass -File build-single-html.ps1 -Module risk-assessment  # the risk tool
#
# Output: "<product> <version label>.html" here, e.g. "OT Cyber Assessment Tool
# v0.5.html" or "OT Cyber Risk Assessment Tool v0.5.html" (product from the
# module's module.json, version from shared\version.js; see ..\module-info.ps1).
# Nothing needs sending with it: the licence is embedded (the assessment tool
# opens it in a pop-up from data/shared/licence.js; both carry it as a comment
# at the top of the file).
#
# What it does, following the module's index.html line by line:
#   - each stylesheet link becomes an inline <style>
#   - each <img src="....png"> becomes a data: URI
#   - every <script src> becomes an inline <script>, in the same order
#   - data/manifest.js (assessment tool) keeps its instrument index, but its
#     document.write() loader is replaced by the files it would have loaded,
#     inlined in the order it lists them
#   - files the app only loads on demand, listed in module.json as
#     singleHtml.inlineExtras (the risk tool's demo project), are inlined at
#     the end of <head>; the app uses an inline copy when it finds one
# The assessment tool's demo tour is not included.
#
# Re-run after any change to the app (and after scripts/build-data.ps1 when
# its data changed), then run the module's check page (module.json
# singleHtml.parityCheck, beside this script).
param([string]$Module = "assessments")

$ErrorActionPreference = "Stop"
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path (Split-Path -Parent $here) "module-info.ps1") -Module $Module
$app   = $ModuleDir
$version = $AppVersion
$versionLabel = $AppVersionLabel
$outName = $AppPageName
$out   = Join-Path $here $outName
$utf8  = New-Object System.Text.UTF8Encoding($false)

function ReadText($rel) {
  $p = Join-Path $app $rel
  if (-not (Test-Path $p)) { throw "Missing file referenced by $($ModuleInfo.entry): $rel" }
  return [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
}

# Inline JS must not close its own <script> element early, or open an HTML
# comment that changes how the parser reads "</script>". Both rewrites are
# no-ops to the JavaScript engine: "<\/" and "<\!" read the same as "</" and
# "<!" inside strings, templates and regular expressions.
function SafeJs([string]$js) {
  $js = [regex]::Replace($js, '</(script)', '<\/$1', 'IgnoreCase')
  $js = $js.Replace('<!--', '<\!--')
  return $js
}

function InlineScript($sb, $rel, $js) {
  [void]$sb.Append("<script>/* ").Append($rel).Append(" */`n")
  [void]$sb.Append((SafeJs $js))
  [void]$sb.Append("`n</script>`n")
}

$index = ReadText $ModuleInfo.entry
$lines = $index -split "`r?`n"
$sb = New-Object System.Text.StringBuilder
$inlined = New-Object System.Collections.Generic.List[string]
$extras = @($ModuleInfo.singleHtml.inlineExtras | Where-Object { $_ })
$extrasDone = $false

$licence = [IO.File]::ReadAllText((Join-Path $app "LICENCE.txt"), [Text.Encoding]::UTF8)
$stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm")

foreach ($line in $lines) {
  # The licence also sits as a comment at the top, for anyone reading the
  # source rather than the app.
  if ($line -match '^<!doctype html>') {
    [void]$sb.Append($line).Append("`n")
    [void]$sb.Append("<!--`n").Append($licence.Replace('--', '- -')).Append("`n")
    [void]$sb.Append("Single-file build of the $AppProduct $versionLabel (version $version), generated $stamp.`n-->`n")
    continue
  }

  # On-demand files go in at the end of <head>, before any app code runs.
  if (-not $extrasDone -and $line -match '^\s*</head>') {
    foreach ($rel in $extras) {
      InlineScript $sb $rel (ReadText $rel)
      $inlined.Add($rel)
    }
    $extrasDone = $true
  }

  $m = [regex]::Match($line, '^\s*<link rel="stylesheet" href="([^"]+)"\s*/?>\s*$')
  if ($m.Success) {
    $rel = $m.Groups[1].Value
    [void]$sb.Append("<style>/* $rel */`n").Append((ReadText $rel).Replace('</style', '<\/style')).Append("`n</style>`n")
    $inlined.Add($rel)
    continue
  }

  $m = [regex]::Match($line, '<img src="([^"]+\.png)"')
  if ($m.Success) {
    $rel = $m.Groups[1].Value
    $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $app $rel)))
    $line = $line.Replace('src="' + $rel + '"', 'src="data:image/png;base64,' + $b64 + '"')
    $inlined.Add($rel)
  }

  $m = [regex]::Match($line, '^\s*<script src="([^"]+)"></script>\s*$')
  if ($m.Success) {
    $rel = $m.Groups[1].Value
    $js = ReadText $rel
    if ($rel -eq "data/manifest.js") {
      # Keep the instrument index; replace the loader with what it loads.
      $cut = $js.IndexOf("var s = document.currentScript")
      if ($cut -lt 0) { throw "data/manifest.js no longer has the expected loader" }
      $cut = $js.LastIndexOf("(function", $cut)
      $loader = $js.Substring($cut)
      InlineScript $sb $rel $js.Substring(0, $cut)
      $adds = [regex]::Matches($loader, "add\('([^']+)'\)")
      if ($adds.Count -eq 0) { throw "data/manifest.js loader lists no files" }
      foreach ($a in $adds) {
        $drel = "data/" + $a.Groups[1].Value
        InlineScript $sb $drel (ReadText $drel)
        $inlined.Add($drel)
      }
    } else {
      InlineScript $sb $rel $js
    }
    $inlined.Add($rel)
    continue
  }

  [void]$sb.Append($line).Append("`n")
}

if ($extras.Count -gt 0 -and -not $extrasDone) { throw "$($ModuleInfo.entry) has no </head> line to put the inline extras before" }

$html = $sb.ToString()

# Nothing may still point at a file beside the page.
$left = [regex]::Matches($html, '<(script|link|img)\b[^>]*\b(src|href)="(?!data:)[^"]+"', 'IgnoreCase')
if ($left.Count -gt 0) {
  throw ("Still references external files: " + (($left | ForEach-Object { $_.Value }) -join " | "))
}

[IO.File]::WriteAllText($out, $html, $utf8)

$mb = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Output ("Wrote {0} ({1} MB), {2} files inlined." -f $outName, $mb, $inlined.Count)
