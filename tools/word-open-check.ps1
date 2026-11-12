#requires -Version 5.1
# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Opens Word files in real Microsoft Word and says what Word found in them.
# The headless tests can prove what the document tool writes; only Word can
# prove Word opens it, so this is the release gate for the OT Cyber Document
# Tool. It is run by hand on a machine with Word, not by the test suite.
#
#   .\tools\word-open-check.ps1 -Folder <dir>                    # every .docx in a folder
#   .\tools\word-open-check.ps1 -DumpPage dump-doc-exports.html   # the tool's own exports
#   .\tools\word-open-check.ps1                                  # both: the fixtures, then the exports
#   .\tools\word-open-check.ps1 -Folder <dir> -OutJson <file>    # also write everything read, as JSON
#
# -DumpPage names a page in modules\documents\scripts (or gives a full path)
# that builds documents and prints each one as
#   <pre data-name="report-draft.docx" data-expect='{"inlineShapes":5}'>base64</pre>
# The page is run in headless Edge, each pre is written to a temporary folder
# and that folder is checked. A page that is not there is an error: a mistyped
# name must not read as a pass.
#
# What "opens" means here. Each file is opened read-only with OpenAndRepair
# false, so a damaged file is an error and not a silent repair. A file passes
# when Word opens it and everything expected of it is true.
#
# Expected values come from data-expect, or for a file in a folder from a file
# beside it named <name>.expect.json. Every key is optional:
#   opens            false for a file that must be refused
#   pages, paragraphs, tables, sections, landscapeSections, inlineShapes,
#   shapes, headerShapes, listParagraphs, footnotes, endnotes, hyperlinks,
#   comments, revisions, fields, contentsTables, equations, tooWide, tooTall
#                    a number, or { "min": n, "max": n }
#                    (tooTall: the in-line pictures and objects taller than the
#                    text area of their page; it is always printed when not 0)
#   inlineTypes      { "picture": 3, "graphic": 1, "chart": 2, "smartArt": 1, "embeddedObject": 1 }
#                    ("graphic" is an SVG picture)
#   shapeTypes       { "autoShape": 2, "textBox": 1, "group": 1, "canvas": 1, "picture": 1 }
#   progIds          [ "Excel.Sheet.12" ]: the embedded objects, in any order
#   protection       "none", "readOnly", "comments", "trackedChanges" or "forms"
#   final            true when the file is marked as final
#   textBoxFont, textBoxSize     every text box story is in this font, at this size
#   footnoteFont, footnoteSize   every footnote's text likewise
#   accent1 .. accent6           theme colours, as "C00000"
#   minorFont, majorFont         theme fonts
#   fitsPage         true: no in-line picture or object is wider than the text area
#
# Word safety rules, which this script keeps without exception:
#   - the Word processes already running are never touched (the person at this
#     machine may have documents open);
#   - the work is done in a new invisible instance inside a job, and the id of
#     the one process that instance started is written to a file;
#   - every file is opened read-only, kept out of the recent files list, and
#     closed without saving;
#   - if Word stops answering for -TimeoutSec seconds on one file, only the
#     recorded process is ended, that file fails, and the rest are checked in a
#     fresh instance.
param(
  [string]$Folder,
  [string]$DumpPage,
  [int]$TimeoutSec = 240,
  [int]$DumpTimeoutSec = 900,
  [string]$OutJson,
  [switch]$KeepDump
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$scripts = Join-Path $repo "modules\documents\scripts"
if (-not $Folder -and -not $DumpPage) { $Folder = Join-Path $scripts "fixtures"; $DumpPage = "dump-doc-exports.html" }

# ---- what to check ----
$items = New-Object System.Collections.ArrayList     # @{ path; name; expect }
function Read-Expect([string]$json, [string]$from) {
  try { return ($json | ConvertFrom-Json) } catch { throw "The expected values for $from are not valid JSON: $($_.Exception.Message)" }
}
if ($Folder) {
  if (-not (Test-Path -LiteralPath $Folder)) { throw "No such folder: $Folder" }
  $Folder = (Resolve-Path -LiteralPath $Folder).Path
  foreach ($f in @(Get-ChildItem -LiteralPath $Folder -Filter *.docx | Where-Object { $_.Name -notlike '~$*' } | Sort-Object Name)) {
    $side = Join-Path $Folder ([IO.Path]::GetFileNameWithoutExtension($f.Name) + ".expect.json")
    $expect = $null
    if (Test-Path -LiteralPath $side) { $expect = Read-Expect ([IO.File]::ReadAllText($side, [Text.Encoding]::UTF8)) $side }
    [void]$items.Add(@{ path = $f.FullName; name = $f.Name; expect = $expect })
  }
}

$dumpDir = $null
if ($DumpPage) {
  $page = if (Test-Path -LiteralPath $DumpPage) { (Resolve-Path -LiteralPath $DumpPage).Path } else { Join-Path $scripts $DumpPage }
  if (-not (Test-Path -LiteralPath $page)) { throw "No such dump page: $DumpPage (looked in $scripts)" }
  else {
    # The suite's pattern for getting bytes out of a headless page: the page
    # prints them, Edge dumps the DOM, and they are read back from the dump.
    $edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    $prof = Join-Path $env:TEMP ("edgeprof-" + [IO.Path]::GetRandomFileName())
    $dump = Join-Path $env:TEMP ("word-check-dump-" + [IO.Path]::GetRandomFileName() + ".txt")
    $url = "file:///" + $page.Replace('\', '/').Replace(' ', '%20')
    $p = Start-Process -FilePath $edge -NoNewWindow -PassThru -RedirectStandardOutput $dump -RedirectStandardError ($dump + ".err") `
      -ArgumentList @("--headless=new", "--disable-gpu", "--no-first-run", "--disable-sync", "--allow-file-access-from-files", "--user-data-dir=`"$prof`"", "--virtual-time-budget=$($DumpTimeoutSec * 1000)", "--dump-dom", "`"$url`"")
    if (-not $p.WaitForExit($DumpTimeoutSec * 1000)) { try { $p.Kill() } catch {}; throw "The dump page did not finish in $DumpTimeoutSec seconds." }
    # Edge's helper processes can still be writing when the main one exits.
    $text = ""; $found = $null
    $rx = '<pre\b([^>]*\bdata-name="[^"]*"[^>]*)>([A-Za-z0-9+/=\s]*)</pre>'
    for ($i = 0; $i -lt 120; $i++) {
      try { $text = [IO.File]::ReadAllText($dump) } catch { $text = "" }
      if ($text -match '</html>') { $found = [regex]::Matches($text, $rx); break }
      Start-Sleep -Milliseconds 500
    }
    Remove-Item -LiteralPath $dump, ($dump + ".err") -Force -ErrorAction SilentlyContinue
    try { Remove-Item -LiteralPath $prof -Recurse -Force -ErrorAction Stop } catch {}
    if (-not $found -or $found.Count -eq 0) {
      $said = @([regex]::Matches($text, '(?m)^(FAIL|ERROR).*$') | Select-Object -First 3 | ForEach-Object { $_.Value })
      throw "The dump page printed no documents. $($said -join ' ')"
    }
    $dumpDir = Join-Path $env:TEMP ("word-check-" + [IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null
    foreach ($m in $found) {
      $attrs = $m.Groups[1].Value
      $name = [Net.WebUtility]::HtmlDecode([regex]::Match($attrs, '\bdata-name="([^"]*)"').Groups[1].Value)
      # The name comes from a page, so it is kept to a plain file name.
      $name = ($name -replace '[^A-Za-z0-9._ -]', '_').Trim().TrimStart('.')
      if (-not $name) { continue }
      if ($name -notmatch '\.docx$') { $name += ".docx" }
      $path = Join-Path $dumpDir $name
      [IO.File]::WriteAllBytes($path, [Convert]::FromBase64String(($m.Groups[2].Value -replace '\s', '')))
      $expect = $null
      $em = [regex]::Match($attrs, '\bdata-expect="([^"]*)"')
      if ($em.Success -and $em.Groups[1].Value) {
        $json = [Net.WebUtility]::HtmlDecode($em.Groups[1].Value)
        $expect = Read-Expect $json $name
        [IO.File]::WriteAllText((Join-Path $dumpDir ([IO.Path]::GetFileNameWithoutExtension($name) + ".expect.json")), $json, (New-Object Text.UTF8Encoding($false)))
      }
      [void]$items.Add(@{ path = $path; name = $name; expect = $expect })
    }
    Write-Output ("The dump page printed {0} document(s)." -f $found.Count)
  }
}

if ($items.Count -eq 0) { Write-Output "Nothing was checked."; exit 0 }

# ---- the part that talks to Word, run as a job so it can be given up on ----
$worker = {
  param($listFile, $resultFile, $pidFile)
  $ErrorActionPreference = "Stop"
  $files = @([IO.File]::ReadAllLines($listFile) | Where-Object { $_ })
  function Emit($r) { Add-Content -LiteralPath $resultFile -Value (ConvertTo-Json $r -Compress -Depth 6) -Encoding UTF8 }
  function Hex([int]$bgr) { return ("{0:X2}{1:X2}{2:X2}" -f ($bgr -band 0xFF), (($bgr -shr 8) -band 0xFF), (($bgr -shr 16) -band 0xFF)) }
  $INLINE = @{ 1 = "embeddedObject"; 2 = "linkedObject"; 3 = "picture"; 4 = "linkedPicture"; 5 = "control"; 6 = "horizontalLine"; 12 = "chart"; 13 = "diagram"; 14 = "lockedCanvas"; 15 = "smartArt"; 16 = "webVideo"; 17 = "graphic"; 18 = "linkedGraphic"; 19 = "model3d"; 20 = "linkedModel3d" }
  $SHAPE = @{ 1 = "autoShape"; 3 = "chart"; 5 = "freeform"; 6 = "group"; 7 = "embeddedObject"; 9 = "line"; 11 = "linkedPicture"; 13 = "picture"; 15 = "textEffect"; 17 = "textBox"; 20 = "canvas"; 24 = "smartArt"; 28 = "graphic" }
  $PROT = @{ -1 = "none"; 0 = "trackedChanges"; 1 = "comments"; 2 = "forms"; 3 = "readOnly" }

  # The id of the process the new instance started, read from its own window:
  # another Word may start in the same second, so the process list cannot say.
  Add-Type -Namespace SptNative -Name Win -MemberDefinition '[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);'
  $b4 = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false; $word.DisplayAlerts = 0
  try { $word.AutomationSecurity = 3 } catch {}     # no macros run, whatever the file holds
  $blank = $word.Documents.Add()
  $mine = [uint32]0
  try { [void][SptNative.Win]::GetWindowThreadProcessId([IntPtr][int]$word.ActiveWindow.Hwnd, [ref]$mine) } catch {}
  $blank.Close([ref]0); $blank = $null
  if ($mine -eq 0 -or $b4 -contains [int]$mine) {
    # Not a process of our own that we can name, so nothing is opened in it and
    # it is not told to quit.
    foreach ($f in $files) { Emit ([ordered]@{ file = $f; ok = $false; error = "A separate Word could not be started, so nothing was opened." }) }
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)
    return
  }
  Set-Content -LiteralPath $pidFile -Value $mine

  foreach ($f in $files) {
    $r = [ordered]@{ file = $f; ok = $false; error = "" }
    $doc = $null
    try {
      # FileName, ConfirmConversions, ReadOnly, AddToRecentFiles, PasswordDocument,
      # PasswordTemplate, Revert, WritePasswordDocument, WritePasswordTemplate,
      # Format, Encoding, Visible, OpenAndRepair. Format 12 is "a Word document
      # (Open XML)": with the automatic format Word opens anything it can call
      # text, and a broken file would pass as a page of nonsense. Visible is
      # true for the document, inside an application that stays hidden: nothing
      # comes on screen, and without it Word gives no type for a shape.
      $doc = $word.Documents.Open([string]$f, $false, $true, $false, "", "", $false, "", "", 12, [Type]::Missing, $true, $false)
      $r.ok = $true
    } catch { $r.error = ($_.Exception.Message -replace '\s+', ' ').Trim() }
    if ($doc) {
      # Each reading stands alone: one that Word will not give is recorded as
      # missing and the rest are still taken.
      $notes = New-Object System.Collections.ArrayList
      function Reading($name, [scriptblock]$get) { try { $r[$name] = & $get } catch { [void]$notes.Add("$name could not be read: " + ($_.Exception.Message -replace '\s+', ' ').Trim()) } }
      # wdNumberOfPagesInDocument. ComputeStatistics answers one page for a
      # read-only file, which Word opens in a view that has no pages.
      Reading "pages" { [int]$doc.Content.Information(4) }
      Reading "paragraphs" { [int]$doc.Paragraphs.Count }
      Reading "tables" { [int]$doc.Tables.Count }
      Reading "sections" { [int]$doc.Sections.Count }
      Reading "landscapeSections" { $n = 0; foreach ($s in $doc.Sections) { if ($s.PageSetup.Orientation -eq 1) { $n++ } }; $n }
      Reading "listParagraphs" { [int]$doc.ListParagraphs.Count }
      Reading "footnotes" { [int]$doc.Footnotes.Count }
      Reading "endnotes" { [int]$doc.Endnotes.Count }
      Reading "hyperlinks" { [int]$doc.Hyperlinks.Count }
      Reading "comments" { [int]$doc.Comments.Count }
      Reading "revisions" { [int]$doc.Revisions.Count }
      Reading "fields" { [int]$doc.Fields.Count }
      Reading "contentsTables" { [int]$doc.TablesOfContents.Count }
      Reading "equations" { [int]$doc.OMaths.Count }
      Reading "protection" { $PROT[[int]$doc.ProtectionType] }
      Reading "final" { [bool]$doc.Final }
      Reading "headerShapes" { [int]$doc.Sections.Item(1).Headers.Item(1).Shapes.Count }

      # In-line pictures and objects: how many of each kind, what the embedded
      # ones are, and whether any is wider than the text area of its section.
      $inlineTypes = [ordered]@{}; $progIds = New-Object System.Collections.ArrayList; $wide = New-Object System.Collections.ArrayList
      try {
        $textWidth = @{}; $textHeight = @{}; $tall = New-Object System.Collections.ArrayList; $i = 0
        foreach ($s in $doc.InlineShapes) {
          $i++
          $kind = $INLINE[[int]$s.Type]; if (-not $kind) { $kind = "type" + [int]$s.Type }
          $inlineTypes[$kind] = 1 + [int]$inlineTypes[$kind]
          if ([int]$s.Type -eq 1) { try { [void]$progIds.Add([string]$s.OLEFormat.ProgID) } catch { [void]$progIds.Add("?") } }
          try {
            $sec = $s.Range.Sections.Item(1); $key = [int]$sec.Index
            if (-not $textWidth.ContainsKey($key)) { $ps = $sec.PageSetup; $textWidth[$key] = [double]($ps.PageWidth - $ps.LeftMargin - $ps.RightMargin) }
            if ([double]$s.Width -gt $textWidth[$key] + 0.5) { [void]$wide.Add(("{0} {1}: {2:N0} pt on a {3:N0} pt text area" -f $kind, $i, [double]$s.Width, $textWidth[$key])) }
            # Taller than the text area of its page: Word cannot split an
            # in-line picture, so the rest of it would be off the paper.
            if (-not $textHeight.ContainsKey($key)) { $ps = $sec.PageSetup; $textHeight[$key] = [double]($ps.PageHeight - $ps.TopMargin - $ps.BottomMargin) }
            if ([double]$s.Height -gt $textHeight[$key] + 0.5) { [void]$tall.Add(("{0} {1}: {2:N0} pt high on a {3:N0} pt text area" -f $kind, $i, [double]$s.Height, $textHeight[$key])) }
          } catch {}
        }
        $r["inlineShapes"] = $i; $r["inlineTypes"] = $inlineTypes; $r["progIds"] = @($progIds); $r["tooWide"] = $wide.Count; $r["tooWideList"] = @($wide)
        $r["tooTall"] = $tall.Count; $r["tooTallList"] = @($tall)
      } catch { [void]$notes.Add("in-line shapes could not be read: " + $_.Exception.Message) }

      $shapeTypes = [ordered]@{}
      try {
        $n = 0
        foreach ($s in $doc.Shapes) {
          $n++
          $kind = $SHAPE[[int]$s.Type]; if (-not $kind) { $kind = "type" + [int]$s.Type }
          $shapeTypes[$kind] = 1 + [int]$shapeTypes[$kind]
        }
        $r["shapes"] = $n; $r["shapeTypes"] = $shapeTypes
      } catch { [void]$notes.Add("shapes could not be read: " + $_.Exception.Message) }

      # Text inside text boxes and shapes (story 5). Its font is what tells a
      # carried drawing that kept its look from one that fell back to Word's
      # default. A story in more than one font reads as an empty name.
      $boxes = New-Object System.Collections.ArrayList
      try {
        $rg = $doc.StoryRanges.Item(5)
        while ($rg -ne $null) {
          $t = ([string]$rg.Text).Trim() -replace '[\r\n\x07\x0B]+', ' / '
          if ($t.Length -gt 60) { $t = $t.Substring(0, 60) }
          [void]$boxes.Add([ordered]@{ text = $t; font = [string]$rg.Font.Name; size = [double]$rg.Font.Size })
          $rg = $rg.NextStoryRange
        }
      } catch {}     # no text box story at all is an error to Word and nothing to us
      $r["textBoxes"] = @($boxes)

      $notesRead = New-Object System.Collections.ArrayList
      try {
        $count = [int]$doc.Footnotes.Count
        for ($k = 1; $k -le [Math]::Min($count, 25); $k++) { $fr = $doc.Footnotes.Item($k).Range; [void]$notesRead.Add([ordered]@{ font = [string]$fr.Font.Name; size = [double]$fr.Font.Size }) }
      } catch {}
      $r["footnoteText"] = @($notesRead)

      try {
        $scheme = $doc.DocumentTheme.ThemeColorScheme
        for ($k = 1; $k -le 6; $k++) { $r["accent$k"] = Hex ([int]$scheme.Colors(4 + $k).RGB) }
        $r["minorFont"] = [string]$doc.DocumentTheme.ThemeFontScheme.MinorFont.Item(1).Name
        $r["majorFont"] = [string]$doc.DocumentTheme.ThemeFontScheme.MajorFont.Item(1).Name
      } catch { [void]$notes.Add("theme could not be read: " + $_.Exception.Message) }

      $r["notes"] = @($notes)
      try { $doc.Close([ref]0) } catch {}
      $doc = $null
    }
    Emit $r
  }
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  $word.Quit([ref]0)
  [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word); $word = $null; [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

$beforeWord = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$tmp = Join-Path $env:TEMP ("word-check-run-" + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$results = @{}      # path -> what Word said

# A file that is not a zip never reaches Word: there is nothing for it to open,
# and no reason to find out what it would do with it.
$todo = New-Object System.Collections.ArrayList
foreach ($it in $items) {
  $head = New-Object byte[] 4; $fs = [IO.File]::OpenRead($it.path); $got = $fs.Read($head, 0, 4); $fs.Dispose()
  if ($got -lt 4 -or $head[0] -ne 0x50 -or $head[1] -ne 0x4B) { $results[$it.path] = [pscustomobject]@{ file = $it.path; ok = $false; error = "It is not a zip file, so it is not a Word document." } }
  else { [void]$todo.Add($it.path) }
}

# Ends the Word an attempt started, and nothing else: the id must be the one
# that attempt recorded, must not have been running before, and must still be
# a Word.
function Stop-OwnWord([string]$pidFile, [int]$waitSec) {
  if (-not (Test-Path -LiteralPath $pidFile)) { return }
  $mine = [int](([IO.File]::ReadAllText($pidFile)).Trim())
  for ($i = 0; $i -lt ($waitSec * 2); $i++) { if (-not (Get-Process -Id $mine -ErrorAction SilentlyContinue)) { return }; Start-Sleep -Milliseconds 500 }
  $p = Get-Process -Id $mine -ErrorAction SilentlyContinue
  if ($p -and $p.ProcessName -eq "WINWORD" -and $beforeWord -notcontains $mine) { Stop-Process -Id $mine -Force }
}

$round = 0
while ($todo.Count -gt 0) {
  $round++
  $listFile = Join-Path $tmp "list-$round.txt"; $resultFile = Join-Path $tmp "result-$round.txt"; $pidFile = Join-Path $tmp "word-$round.pid"
  [IO.File]::WriteAllLines($listFile, [string[]]@($todo))
  $job = Start-Job -ArgumentList $listFile, $resultFile, $pidFile -ScriptBlock $worker
  # Watched one file at a time: the clock starts again each time a result
  # arrives, so a long list is not mistaken for a hang.
  $seen = 0; $since = [Diagnostics.Stopwatch]::StartNew(); $hung = $false
  while ($job.State -eq "Running") {
    Start-Sleep -Milliseconds 500
    $now = if (Test-Path -LiteralPath $resultFile) { @([IO.File]::ReadAllLines($resultFile) | Where-Object { $_ }).Count } else { 0 }
    if ($now -gt $seen) { $seen = $now; $since.Restart() }
    if ($since.Elapsed.TotalSeconds -gt $TimeoutSec) { $hung = $true; break }
  }
  if ($hung) { Stop-Job $job }
  $jobSaid = @(Receive-Job $job -ErrorAction SilentlyContinue 2>&1 | ForEach-Object { [string]$_ })
  Remove-Job $job -Force
  Stop-OwnWord $pidFile $(if ($hung) { 0 } else { 30 })

  $lines = if (Test-Path -LiteralPath $resultFile) { @([IO.File]::ReadAllLines($resultFile, [Text.Encoding]::UTF8) | Where-Object { $_ }) } else { @() }
  foreach ($line in $lines) { $o = $line | ConvertFrom-Json; $results[[string]$o.file] = $o }
  $left = @($todo | Where-Object { -not $results.ContainsKey($_) })
  if ($left.Count -gt 0) {
    # The first file with no result is the one Word was on when it stopped.
    $why = if ($hung) { "Word did not answer within $TimeoutSec seconds and was closed." } elseif ($jobSaid.Count) { "Word stopped: " + ($jobSaid[0] -replace '\s+', ' ') } else { "Word stopped without saying why." }
    $results[$left[0]] = [pscustomobject]@{ file = $left[0]; ok = $false; error = $why }
    $left = @($left | Select-Object -Skip 1)
  }
  $todo = New-Object System.Collections.ArrayList
  foreach ($x in $left) { [void]$todo.Add($x) }
}
try { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction Stop } catch {}

# ---- compare with what was expected, and report ----
function Same-Number($want, $found) {
  if ($want -is [pscustomobject]) {
    if ($null -ne $want.min -and $found -lt $want.min) { return $false }
    if ($null -ne $want.max -and $found -gt $want.max) { return $false }
    return $true
  }
  return ([double]$want -eq [double]$found)
}
function Show($v) { if ($v -is [pscustomobject]) { return (ConvertTo-Json $v -Compress) } return [string]$v }
function Counts($o) {
  if (-not $o) { return "" }
  $bits = @($o.PSObject.Properties | ForEach-Object { "$($_.Name) $($_.Value)" })
  if ($bits.Count) { return " (" + ($bits -join ", ") + ")" } return ""
}
function Compare-Expect($r, $expect) {
  $wrong = New-Object System.Collections.ArrayList
  foreach ($p in $expect.PSObject.Properties) {
    $key = $p.Name; $want = $p.Value
    switch -Regex ($key) {
      '^opens$' { break }
      '^(inlineTypes|shapeTypes)$' {
        foreach ($q in $want.PSObject.Properties) {
          $have = 0; if ($r.$key -and $null -ne $r.$key.($q.Name)) { $have = [int]$r.$key.($q.Name) }
          if (-not (Same-Number $q.Value $have)) { [void]$wrong.Add("$key.$($q.Name): expected $(Show $q.Value), found $have") }
        }
        break
      }
      '^progIds$' {
        $a = (@($want) | Sort-Object) -join ", "; $b = (@($r.progIds) | Sort-Object) -join ", "
        if ($a -cne $b) { [void]$wrong.Add("progIds: expected [$a], found [$b]") }
        break
      }
      '^(textBoxFont|textBoxSize|footnoteFont|footnoteSize)$' {
        $list = if ($key -like "textBox*") { @($r.textBoxes) } else { @($r.footnoteText) }
        $field = if ($key -like "*Font") { "font" } else { "size" }
        if ($list.Count -eq 0) { [void]$wrong.Add("${key}: expected $want, but there is none to read") }
        foreach ($x in $list) {
          $same = if ($field -eq "font") { [string]$x.font -eq [string]$want } else { [double]$x.size -eq [double]$want }
          if (-not $same) { [void]$wrong.Add("${key}: expected $want, found $($x.$field)" + $(if ($x.text) { " in '$($x.text)'" } else { "" })); break }
        }
        break
      }
      '^fitsPage$' {
        if ([bool]$want -and [int]$r.tooWide -gt 0) { [void]$wrong.Add("fitsPage: " + (@($r.tooWideList) -join "; ")) }
        break
      }
      '^(accent[1-6]|minorFont|majorFont|protection)$' {
        if ([string]$r.$key -ne [string]$want) { [void]$wrong.Add("${key}: expected $want, found $($r.$key)") }
        break
      }
      '^final$' {
        if ([bool]$r.final -ne [bool]$want) { [void]$wrong.Add("final: expected $want, found $($r.final)") }
        break
      }
      default {
        if ($null -eq $r.$key) { [void]$wrong.Add("${key}: expected $(Show $want), but it was not read") }
        elseif (-not (Same-Number $want $r.$key)) { [void]$wrong.Add("${key}: expected $(Show $want), found $($r.$key)") }
      }
    }
  }
  return $wrong.ToArray()
}

$failed = 0; $all = New-Object System.Collections.ArrayList
foreach ($it in $items) {
  $r = $results[$it.path]
  $mustFail = ($it.expect -and $null -ne $it.expect.opens -and -not [bool]$it.expect.opens)
  $wrong = @(); $pass = $true
  if (-not $r.ok) {
    if ($mustFail) { Write-Output ("PASS {0}  refused, as expected: {1}" -f $it.name, $r.error) }
    else { $pass = $false; Write-Output ("FAIL {0}  {1}" -f $it.name, $r.error) }
  } else {
    if ($mustFail) { $wrong = @("it opened, and was expected to be refused") }
    elseif ($it.expect) { $wrong = @(Compare-Expect $r $it.expect) }
    $objects = if (@($r.progIds).Count) { ": " + (@($r.progIds) -join ", ") } else { "" }
    $summary = "opened without repair, {0} page(s), {1} in-line{2}{3}, {4} shape(s){5}, protection {6}" -f $r.pages, $r.inlineShapes, (Counts $r.inlineTypes), $objects, $r.shapes, (Counts $r.shapeTypes), $r.protection
    if ($wrong.Count) { $pass = $false; Write-Output ("FAIL {0}  {1}" -f $it.name, $summary) } else { Write-Output ("PASS {0}  {1}" -f $it.name, $summary) }
    foreach ($w in $wrong) { Write-Output ("       not as expected: " + $w) }
    $accents = @(1..6 | ForEach-Object { $r."accent$_" }) -join " "
    Write-Output ("       theme accents {0}; fonts {1} and {2}" -f $accents, $r.majorFont, $r.minorFont)
    foreach ($b in @($r.textBoxes)) { Write-Output ("       text box '{0}': {1} {2}" -f $b.text, $(if ($b.font) { $b.font } else { "mixed fonts" }), $b.size) }
    if (@($r.footnoteText).Count) { $f0 = @($r.footnoteText)[0]; Write-Output ("       {0} footnote(s), the first in {1} {2}" -f $r.footnotes, $(if ($f0.font) { $f0.font } else { "mixed fonts" }), $f0.size) }
    if ([int]$r.tooWide -gt 0) { Write-Output ("       wider than the text area: " + (@($r.tooWideList) -join "; ")) }
    if ([int]$r.tooTall -gt 0) { Write-Output ("       taller than the text area: " + (@($r.tooTallList) -join "; ")) }
    foreach ($n in @($r.notes)) { Write-Output ("       note: " + $n) }
  }
  if (-not $pass) { $failed++ }
  [void]$all.Add([pscustomobject]@{ name = $it.name; passed = $pass; read = $r; expected = $it.expect; notAsExpected = @($wrong) })
}

if ($OutJson) { [IO.File]::WriteAllText($OutJson, (ConvertTo-Json @($all) -Depth 8), (New-Object Text.UTF8Encoding($false))) }
if ($dumpDir) {
  if ($KeepDump) { Write-Output "The exported documents are in $dumpDir" }
  else { try { Remove-Item -LiteralPath $dumpDir -Recurse -Force -ErrorAction Stop } catch {} }
}
Write-Output ""
Write-Output ("{0} file(s), {1} failed" -f $items.Count, $failed)
if ($failed) { exit 1 }
exit 0
