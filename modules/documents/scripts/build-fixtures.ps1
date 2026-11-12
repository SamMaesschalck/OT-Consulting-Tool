#requires -Version 5.1
# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Wraps each Word fixture in scripts/fixtures as a .js file, because a test
# page cannot read a file from disk but can load a script beside it:
#
#   fixtures/fx-text.docx  ->  fixtures/fx-text.js    window.Fixtures["fx-text"] = "<base64>"
#   fixtures/index.js                                 window.FixtureIndex = [{ name, file, bytes }]
#                                                     window.FixtureExpect = { name: what Word found in it }
#                                                     (each <name>.expect.json, for the pages that cannot
#                                                     read a file: dump-doc-exports.html)
#
# A test page includes the wrappers it needs with a script tag each and turns
# the base64 back into bytes itself. Both the .docx and the .js are committed.
#
#   .\modules\documents\scripts\build-fixtures.ps1            # after make-fixtures.ps1, or after replacing a .docx
#   .\modules\documents\scripts\build-fixtures.ps1 -Check     # writes nothing; fails if a wrapper is stale
#
# It is also the gate on what gets committed. A file made by Word carries the
# name of whoever made it in more places than its properties, so a fixture is
# refused, and its wrapper not written, if any part of it (or of a workbook
# embedded in it) names an author other than the stand-in, holds a directory
# id, a sensitivity label or a path on someone's disk, or contains this
# machine's user, computer or organisation name. make-fixtures.ps1 cleans its
# own output; this check is what catches a .docx dropped in by hand.
param(
  [string]$Folder,
  [switch]$Check
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Folder) { $Folder = Join-Path $here "fixtures" }
$Folder = (Resolve-Path -LiteralPath $Folder).Path
Add-Type -AssemblyName System.IO.Compression

$STAND_IN = "Fixture Author"
$utf8 = New-Object Text.UTF8Encoding($false)
$latin1 = [Text.Encoding]::GetEncoding(28591)
$notice = "/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */"

# Names that must not be in a committed file. They are read from this machine
# when the script runs, so none of them is written here. Shorter than four
# letters would match by chance.
$private = New-Object System.Collections.ArrayList
foreach ($v in @($env:USERNAME, $env:COMPUTERNAME, $env:USERDOMAIN)) { if ($v) { [void]$private.Add([string]$v) } }
try {
  $info = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Office\Common\UserInfo" -ErrorAction Stop
  foreach ($v in @($info.UserName, $info.Company)) { if ($v) { [void]$private.Add([string]$v) } }
} catch {}
# The stand-in is in every fixture on purpose, so a machine whose Office user
# name has been set to it names nobody by it.
$private = @($private | Where-Object { $_.Length -ge 4 -and $_ -ne $STAND_IN } | Select-Object -Unique)

function Read-Package([byte[]]$bytes) {
  $in = New-Object IO.MemoryStream(, $bytes)
  $zip = New-Object IO.Compression.ZipArchive($in, [IO.Compression.ZipArchiveMode]::Read)
  $parts = New-Object System.Collections.ArrayList
  foreach ($e in $zip.Entries) {
    if ($e.FullName.EndsWith("/")) { continue }
    $ms = New-Object IO.MemoryStream; $s = $e.Open(); $s.CopyTo($ms); $s.Dispose()
    [void]$parts.Add(@{ name = $e.FullName; data = $ms.ToArray() })
  }
  $zip.Dispose(); $in.Dispose()
  return , $parts
}

# Everything wrong with one package, as sentences. $where is "" for the Word
# file itself and the embedded workbook's name when called on one.
function Test-Package([byte[]]$bytes, [string]$where) {
  $bad = New-Object System.Collections.ArrayList
  try { $parts = Read-Package $bytes } catch { [void]$bad.Add("${where}it is not a zip file Word would open"); return , $bad }
  $names = @($parts | ForEach-Object { $_.name })
  foreach ($n in $names) {
    if ($n -match '^(word/people\.xml|docProps/custom\.xml|docMetadata/.*|xl/persons/.*)$') { [void]$bad.Add("$where$n is present (it names a person or an organisation)") }
  }
  if (-not $where -and $names -notcontains "docProps/core.xml") { [void]$bad.Add("it has no docProps/core.xml, so its author cannot be checked") }
  foreach ($p in $parts) {
    $n = $p.name
    if ($n -match '\.(xlsx|xlsm|docx|pptx)$') { foreach ($b in (Test-Package $p.data "$where$n > ")) { [void]$bad.Add($b) }; continue }
    # The private names are looked for in every part, pictures included, as
    # plain bytes and as the two-byte text Windows metafiles use.
    $raw = $latin1.GetString($p.data)
    foreach ($v in $private) {
      $wide = ($v.ToCharArray() -join [string][char]0)
      if ($raw.IndexOf($v, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or $raw.IndexOf($wide, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        [void]$bad.Add("$where$n contains this machine's user, computer or organisation name")
      }
    }
    if ($n -notmatch '\.(xml|rels|vml)$') { continue }
    $text = $utf8.GetString($p.data)
    if ($n -eq "docProps/core.xml") {
      $creator = [regex]::Match($text, '<dc:creator>([^<]*)</dc:creator>').Groups[1].Value
      $last = [regex]::Match($text, '<cp:lastModifiedBy>([^<]*)</cp:lastModifiedBy>').Groups[1].Value
      if ($creator -cne $STAND_IN) { [void]$bad.Add("$where$n creator is '$creator', not '$STAND_IN'") }
      if ($last -cne $STAND_IN) { [void]$bad.Add("$where$n last modified by is '$last', not '$STAND_IN'") }
    }
    if ($n -eq "docProps/app.xml") {
      foreach ($tag in "Company", "Manager") {
        $v = [regex]::Match($text, "<$tag>([^<]*)</$tag>").Groups[1].Value
        if ($v) { [void]$bad.Add("$where$n $tag is '$v'") }
      }
    }
    # A floating drawing measured from its paragraph belongs near that paragraph.
    # Word, driven from a script, will store one as many centimetres back up the
    # page instead (make-fixtures.ps1, Beside), and a fixture like that cannot
    # show whether an export keeps a drawing in its place.
    if (-not $where -and $n -eq "word/document.xml") {
      foreach ($m in [regex]::Matches($text, '<wp:positionV relativeFrom="paragraph"><wp:posOffset>(-?\d+)</wp:posOffset>')) {
        $emu = [long]$m.Groups[1].Value
        if ($emu -lt 0 -or $emu -gt 1800000) { [void]$bad.Add(("$where$n has a floating drawing {0:N1} cm from the paragraph it is anchored in (0 to 5 cm is believable)" -f ($emu / 360000))); break }
      }
    }
    if ($text -match 'userId') { [void]$bad.Add("$where$n holds a userId") }
    foreach ($m in [regex]::Matches($text, '\bw:author="([^"]*)"')) {
      if ($m.Groups[1].Value -cne $STAND_IN) { [void]$bad.Add("$where$n has a change or comment by '$($m.Groups[1].Value)'"); break }
    }
    if ($text -match '(?i)[a-z]:\\(Users|Documents and Settings)\\|file:///') { [void]$bad.Add("$where$n holds a path on someone's disk") }
  }
  return , @($bad | Select-Object -Unique)
}

$files = @(Get-ChildItem -LiteralPath $Folder -Filter *.docx | Where-Object { $_.Name -notlike '~$*' } | Sort-Object Name)
if ($files.Count -eq 0) { Write-Output "No .docx files in $Folder. Run make-fixtures.ps1 first."; exit 1 }

$refused = 0; $stale = 0; $index = New-Object System.Collections.ArrayList; $expects = New-Object System.Collections.ArrayList
foreach ($f in $files) {
  $name = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  $bytes = [IO.File]::ReadAllBytes($f.FullName)
  $bad = Test-Package $bytes ""
  if ($bad.Count) {
    $refused++
    Write-Output ("REFUSED {0}" -f $f.Name)
    foreach ($b in $bad) { Write-Output ("  " + $b) }
    continue
  }
  $js = $notice + "`n" +
    "// AUTO-GENERATED by scripts/build-fixtures.ps1 from scripts/fixtures/$($f.Name). Do not edit; replace the .docx and re-run the script.`n" +
    "window.Fixtures = window.Fixtures || {};`n" +
    "window.Fixtures[""$name""] = """ + [Convert]::ToBase64String($bytes) + """;`n"
  $out = Join-Path $Folder ($name + ".js")
  [void]$index.Add(("  {{ name: ""{0}"", file: ""{1}"", bytes: {2} }}" -f $name, $f.Name, $bytes.Length))
  $side = Join-Path $Folder ($name + ".expect.json")
  if (Test-Path -LiteralPath $side) {
    $compact = ([IO.File]::ReadAllText($side, $utf8) | ConvertFrom-Json) | ConvertTo-Json -Compress -Depth 6
    [void]$expects.Add(("  ""{0}"": {1}" -f $name, $compact))
  }
  if ($Check) {
    $now = if (Test-Path -LiteralPath $out) { [IO.File]::ReadAllText($out, $utf8) } else { "" }
    if ($now -cne $js) { $stale++; Write-Output ("STALE   {0}.js" -f $name) } else { Write-Output ("ok      {0}.js" -f $name) }
  } else {
    [IO.File]::WriteAllText($out, $js, $utf8)
    Write-Output ("wrote   {0}.js ({1:N0} KB from {2:N0} KB)" -f $name, ($js.Length / 1KB), ($bytes.Length / 1KB))
  }
}

$indexJs = $notice + "`n" +
  "// AUTO-GENERATED by scripts/build-fixtures.ps1: the Word fixtures in this folder. Do not edit; re-run the script.`n" +
  "window.FixtureIndex = [`n" + ($index -join ",`n") + "`n];`n" +
  "window.FixtureExpect = {`n" + ($expects -join ",`n") + "`n};`n"
$indexOut = Join-Path $Folder "index.js"
if ($Check) {
  $now = if (Test-Path -LiteralPath $indexOut) { [IO.File]::ReadAllText($indexOut, $utf8) } else { "" }
  if ($now -cne $indexJs) { $stale++; Write-Output "STALE   index.js" } else { Write-Output "ok      index.js" }
} elseif ($refused -eq 0) {
  [IO.File]::WriteAllText($indexOut, $indexJs, $utf8)
  Write-Output "wrote   index.js"
}

if ($refused) { Write-Output ""; Write-Output "$refused file(s) refused. Nothing that names a person or a machine is wrapped; fix or remake them."; exit 1 }
if ($stale) { Write-Output ""; Write-Output "$stale wrapper(s) are stale. Run build-fixtures.ps1."; exit 1 }
exit 0
