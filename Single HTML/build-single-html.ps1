# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Builds the OT Cyber Assessment Tool as ONE self-contained HTML file, for
# handing out. It reads the working app in ..\Assessments and never writes
# there: the folder version stays the one that is developed and tested.
#
#   powershell -ExecutionPolicy Bypass -File build-single-html.ps1
#
# Output: "OT Cyber Assessment Tool v<version>.html" here, e.g. "... v0.3.html". Nothing needs sending with it:
# the licence opens in a pop-up from the app (carried in as data/shared/licence.js).
#
# What it does, following ..\Assessments\index.html line by line:
#   - the stylesheet link becomes an inline <style>
#   - the header logo becomes a data: URI
#   - every <script src> becomes an inline <script>, in the same order
#   - data/manifest.js keeps its instrument index, but its document.write()
#     loader is replaced by the files it would have loaded, inlined in the
#     order it lists them
# The risk assessment tool and the demo tour are not included.
#
# Re-run after any change to the app (and after scripts/build-data.ps1 when
# instrument data changed), then run check-single-html.html.

$ErrorActionPreference = "Stop"
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$app   = Join-Path (Split-Path -Parent $here) "Assessments"
# The version comes from js/version.js, the app's one source of it, and goes
# in the file name so a copy says which release it is before it is opened.
$verSrc = [IO.File]::ReadAllText((Join-Path $app "js\version.js"))
$m = [regex]::Match($verSrc, 'var VERSION = "([0-9]+\.[0-9]+\.[0-9]+)"')
if (-not $m.Success) { throw "Could not read the version from js/version.js" }
$version = $m.Groups[1].Value
$vp = $version.Split('.')
$versionLabel = "v" + $(if ($vp[2] -eq "0") { $vp[0] + "." + $vp[1] } else { $version })
$outName = "OT Cyber Assessment Tool $versionLabel.html"
$out   = Join-Path $here $outName
$utf8  = New-Object System.Text.UTF8Encoding($false)

function ReadText($rel) {
  $p = Join-Path $app $rel
  if (-not (Test-Path $p)) { throw "Missing file referenced by index.html: $rel" }
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

$index = ReadText "index.html"
$lines = $index -split "`r?`n"
$sb = New-Object System.Text.StringBuilder
$inlined = New-Object System.Collections.Generic.List[string]

$licence = [IO.File]::ReadAllText((Join-Path $app "LICENCE.txt"), [Text.Encoding]::UTF8)
$stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm")

foreach ($line in $lines) {
  # The licence also sits as a comment at the top, for anyone reading the
  # source rather than the app (which shows it in a pop-up).
  if ($line -match '^<!doctype html>') {
    [void]$sb.Append($line).Append("`n")
    [void]$sb.Append("<!--`n").Append($licence.Replace('--', '- -')).Append("`n")
    [void]$sb.Append("Single-file build of the OT Cyber Assessment Tool $versionLabel (version $version), generated $stamp.`n-->`n")
    continue
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

$html = $sb.ToString()

# Nothing may still point at a file beside the page.
$left = [regex]::Matches($html, '<(script|link|img)\b[^>]*\b(src|href)="(?!data:)[^"]+"', 'IgnoreCase')
if ($left.Count -gt 0) {
  throw ("Still references external files: " + (($left | ForEach-Object { $_.Value }) -join " | "))
}

[IO.File]::WriteAllText($out, $html, $utf8)

$mb = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Output ("Wrote {0} ({1} MB), {2} files inlined." -f $outName, $mb, $inlined.Count)
