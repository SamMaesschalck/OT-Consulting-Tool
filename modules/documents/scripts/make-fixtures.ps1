#requires -Version 5.1
# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Makes the document tool's Word fixtures (scripts/fixtures/*.docx) with real
# Microsoft Word, so the importer is tested on files Word wrote and not on our
# idea of them. Run by hand on a machine with Word, never by the test suite;
# the results are committed. Everything in them is invented: Northfield Water
# and Harbour Controls Ltd do not exist.
#
#   .\modules\documents\scripts\make-fixtures.ps1                    # all of them, then build-fixtures.ps1
#   .\modules\documents\scripts\make-fixtures.ps1 -Only fx-art,fx-all
#   .\modules\documents\scripts\make-fixtures.ps1 -OutDir <folder> -NoBuild
#
# Word safety rules, which this script keeps without exception:
#   - the Word processes already running are recorded first and never touched
#     (the person at this machine may have documents open);
#   - each file is made in a new invisible instance of its own, inside a job
#     with a timeout (-TimeoutSec, for one file);
#   - if it hangs, only the one process this run started is ended;
#   - an Excel process is ended only if it started during this run as an
#     embedding server (a chart or an embedded sheet starts one) and shows no
#     window. Nothing is ever asked of an Excel application object, because an
#     embedded sheet may be served by an Excel the person already has open.
#
# Word stamps whoever is logged in into several places (document properties,
# the author of each comment and tracked change, a directory id in
# word/people.xml, the organisation's sensitivity label, and the same again
# inside every embedded workbook). None of that may be committed, so every file
# is rewritten after Word has saved it (Scrub-Package below) with the stand-in
# author. build-fixtures.ps1 then refuses any file that still names a person or
# this machine.
param(
  [string]$OutDir,
  [string[]]$Only,
  [int]$TimeoutSec = 300,
  [switch]$NoBuild,
  [switch]$KeepWork
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $OutDir) { $OutDir = Join-Path $here "fixtures" }
if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$OutDir = (Resolve-Path -LiteralPath $OutDir).Path
$ALL = @("fx-text", "fx-art", "fx-vector", "fx-theme", "fx-float", "fx-review", "fx-styles", "fx-all", "demo-source")
if (-not $Only -or $Only.Count -eq 0) { $Only = $ALL }
$Only = @($Only | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
foreach ($n in $Only) { if ($ALL -notcontains $n) { throw "No such fixture: $n. Known: $($ALL -join ', ')" } }

$STAND_IN = "Fixture Author"
$work = Join-Path $env:TEMP ("doc-fixtures-" + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $work -Force | Out-Null

$beforeWord = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$beforeExcel = @(Get-Process EXCEL -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })

# Makes one fixture. It runs as a job, in a process of its own, so a Word that
# stops answering can be given up on.
$worker = {
  param($work, $log, $pidFile, $only)
  $ErrorActionPreference = "Stop"
  function L($m) { Add-Content -LiteralPath $log -Value $m }
  # One part of a fixture. A part that Word refuses is logged and the rest of
  # the file is still made, so one awkward object does not hide the others; the
  # caller fails the run on any FAILED line.
  function Step($name, [scriptblock]$body) {
    try { & $body; L ("  ok      " + $name) } catch { L ("  FAILED  " + $name + ": " + $_.Exception.Message + " [" + $_.InvocationInfo.Line.Trim() + "]") }
  }

  # ---- pictures, drawn here so nothing is copied from anywhere ----
  Add-Type -AssemblyName System.Drawing
  $png = Join-Path $work "zones.png"; $jpg = Join-Path $work "site.jpg"; $emf = Join-Path $work "panel.emf"
  $svg = Join-Path $work "conduit.svg"; $tif = Join-Path $work "scan.tif"
  $bmp = New-Object System.Drawing.Bitmap 240, 120
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::SteelBlue)
  $g.DrawString("Zone A", (New-Object System.Drawing.Font "Segoe UI", 20), [System.Drawing.Brushes]::White, 60, 40); $g.Dispose()
  $bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::DarkSlateGray)
  $g.DrawString("Site", (New-Object System.Drawing.Font "Segoe UI", 20), [System.Drawing.Brushes]::White, 80, 40); $g.Dispose()
  $bmp.Save($jpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $g0 = [System.Drawing.Graphics]::FromImage($bmp); $hdc = $g0.GetHdc()
  $mf = New-Object System.Drawing.Imaging.Metafile($emf, $hdc)
  $gm = [System.Drawing.Graphics]::FromImage($mf)
  $gm.DrawRectangle([System.Drawing.Pens]::DarkRed, 5, 5, 180, 100); $gm.DrawEllipse([System.Drawing.Pens]::DarkGreen, 20, 20, 120, 60)
  $gm.DrawString("Panel", (New-Object System.Drawing.Font "Segoe UI", 14), [System.Drawing.Brushes]::Black, 50, 40); $gm.Dispose(); $mf.Dispose()
  $g0.ReleaseHdc($hdc); $g0.Dispose()
  $small = New-Object System.Drawing.Bitmap 160, 90
  $g = [System.Drawing.Graphics]::FromImage($small); $g.Clear([System.Drawing.Color]::DarkOliveGreen); $g.Dispose()
  $small.Save($tif, [System.Drawing.Imaging.ImageFormat]::Tiff); $small.Dispose(); $bmp.Dispose()
  [IO.File]::WriteAllText($svg, '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect x="5" y="5" width="190" height="90" fill="#dce9f3" stroke="#173267" stroke-width="3"/><text x="100" y="58" font-family="Segoe UI" font-size="20" text-anchor="middle" fill="#173267">Conduit</text></svg>')

  # ---- a new Word, and the id of the process it started ----
  # The id is read from the new instance's own window, not worked out from the
  # list of processes: someone else may start a Word in the same second.
  Add-Type -Namespace SptNative -Name Win -MemberDefinition '[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);'
  $b4 = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $script:word = New-Object -ComObject Word.Application
  $word.Visible = $false; $word.DisplayAlerts = 0
  function New-Doc { $script:doc = $word.Documents.Add(); $script:sel = $word.Selection }
  New-Doc
  $mine = [uint32]0
  try { [void][SptNative.Win]::GetWindowThreadProcessId([IntPtr][int]$word.ActiveWindow.Hwnd, [ref]$mine) } catch {}
  if ($mine -eq 0 -or $b4 -contains [int]$mine) {
    # Not a process of our own that we can name. Nothing is made, and Word is
    # not told to quit, because it may not be ours to close.
    L ("  FAILED  could not start a separate Word (process " + $mine + "). Nothing was made.")
    try { $doc.Close(0) } catch {}
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)
    return
  }
  Set-Content -LiteralPath $pidFile -Value $mine
  try { $word.AutomationSecurity = 3 } catch {}

  # Built-in styles by number, so a Word in another language makes the same file.
  $ST = @{ normal = -1; h1 = -2; h2 = -3; h3 = -4; h4 = -5; caption = -35; title = -63 }
  function StyleOf($s) { if ($ST.ContainsKey([string]$s)) { return $doc.Styles.Item([int]$ST[[string]$s]) } return $doc.Styles.Item([string]$s) }
  function End-Doc { [void]$sel.EndKey(6) }
  function Para($text, $style) { $sel.Style = (StyleOf $style); $sel.TypeText($text); $sel.TypeParagraph() }
  function T($text, [string[]]$f) {
    foreach ($p in $f) {
      switch ($p) {
        "b" { $sel.Font.Bold = 1 } "i" { $sel.Font.Italic = 1 } "u" { $sel.Font.Underline = 1 } "s" { $sel.Font.StrikeThrough = 1 }
        "sup" { $sel.Font.Superscript = 1 } "sub" { $sel.Font.Subscript = 1 } "code" { $sel.Font.Name = "Consolas" }
        "red" { $sel.Font.Color = 0x0000E0 }   # E00000, the house prompt colour (Word stores blue-green-red)
      }
    }
    $sel.TypeText($text); $sel.Font.Reset()
  }
  function LastPara { return $doc.Paragraphs.Item($doc.Paragraphs.Count - 1).Range }
  function Find-Range($text) {
    $r = $doc.Content; $f = $r.Find; $f.ClearFormatting()
    if (-not $f.Execute($text)) { throw "text not found: $text" }
    return $r
  }
  function Plain { [void]$sel.Range.ListFormat.RemoveNumbers(); $sel.ParagraphFormat.Reset(); $sel.Style = (StyleOf "normal") }
  # A numbered list template of our own (1. a. i.), so the numbering does not
  # depend on what this machine's list gallery holds.
  function New-Numbers($style1, $startAt, $format1) {
    $lt = $doc.ListTemplates.Add($true)
    $styles = @($style1, 4, 2)   # arabic 0, lower letter 4, lower roman 2
    for ($i = 1; $i -le 3; $i++) {
      $lv = $lt.ListLevels.Item($i)
      $lv.NumberStyle = $styles[$i - 1]
      $lv.NumberFormat = $(if ($i -eq 1 -and $format1) { $format1 } else { "%$i." })
      $lv.NumberPosition = 18 * $i; $lv.TextPosition = 18 * $i + 18; $lv.TabPosition = 18 * $i + 18
      $lv.StartAt = $(if ($i -eq 1) { $startAt } else { 1 })
    }
    return $lt
  }
  # Bullets likewise. Word's default bullet has one level, and indenting an item
  # of it moves the paragraph without changing its level, which is a case the
  # fixtures hold once on purpose and not by accident everywhere.
  function New-Bullets {
    $lt = $doc.ListTemplates.Add($true)
    $glyphs = @(@(0xF0B7, "Symbol"), @(0x6F, "Courier New"), @(0xF0A7, "Wingdings"))
    for ($i = 1; $i -le 3; $i++) {
      $lv = $lt.ListLevels.Item($i)
      # In this order: Word refuses the bullet style on a level that has no glyph yet.
      $lv.Font.Name = $glyphs[$i - 1][1]; $lv.NumberFormat = [string][char]$glyphs[$i - 1][0]; $lv.NumberStyle = 23
      $lv.NumberPosition = 18 * $i; $lv.TextPosition = 18 * $i + 18; $lv.TabPosition = 18 * $i + 18
    }
    return $lt
  }
  function Save-Doc($name) {
    # wdRDIDocumentProperties only. wdRDIAll (99) would also accept the tracked
    # changes and delete the comments that fx-review exists to hold; the names
    # Word leaves behind are replaced after saving instead.
    try { $doc.RemoveDocumentInformation(8) } catch {}
    $out = Join-Path $work ($name + ".docx")
    $doc.SaveAs2([string]$out, 16)
    L ("  saved   " + $name + " inline=" + $doc.InlineShapes.Count + " shapes=" + $doc.Shapes.Count + " paragraphs=" + $doc.Paragraphs.Count)
    $doc.Close(0)
  }

  # ---- building blocks, each typed at the end of the document ----
  function Add-Formatting {
    $sel.Style = (StyleOf "normal")
    $sel.TypeText("Formatting in one sentence: "); T "bold" "b"; $sel.TypeText(", "); T "italic" "i"; $sel.TypeText(", "); T "underlined" "u"
    $sel.TypeText(", "); T "struck out" "s"; $sel.TypeText(", H"); T "2" "sub"; $sel.TypeText("O, m"); T "2" "sup"
    $sel.TypeText(", "); T "bold and italic" "b", "i"; $sel.TypeText(" and the command "); T "show running-config" "code"; $sel.TypeText(".")
    $sel.TypeParagraph()
  }
  function Add-Links {
    $sel.Style = (StyleOf "normal"); $sel.TypeText("The method follows the guidance on the ")
    [void]$doc.Hyperlinks.Add($sel.Range, "https://www.example.com/guidance?topic=zones&level=2", "", "", "example guidance site"); End-Doc
    $sel.TypeText(" and is described in ")
    [void]$doc.Hyperlinks.Add($sel.Range, "", "scope", "", "the scope section"); End-Doc
    $sel.TypeText("."); $sel.TypeParagraph()
  }
  function Add-Notes([bool]$endnote) {
    $sel.Style = (StyleOf "normal"); $sel.TypeText("Northfield Water runs three treatment works from one control room")
    [void]$doc.Footnotes.Add($sel.Range, "", "The control room was rebuilt in 2019."); End-Doc
    if ($endnote) {
      $sel.TypeText(" and two pumping stations by radio")
      [void]$doc.Endnotes.Add($sel.Range, "", "The radio links are licensed and are outside this review."); End-Doc
    }
    $sel.TypeText("."); $sel.TypeParagraph()
  }
  function Add-Bullets([bool]$indentCase) {
    [void]$sel.Range.ListFormat.ApplyListTemplate((New-Bullets), $false)
    $sel.TypeText("Control room workstations"); $sel.TypeParagraph()
    $sel.TypeText("Programmable controllers"); $sel.TypeParagraph()
    [void]$sel.Range.ListFormat.ListIndent(); $sel.TypeText("Works one"); $sel.TypeParagraph()
    [void]$sel.Range.ListFormat.ListIndent(); $sel.TypeText("Filter hall"); $sel.TypeParagraph()
    [void]$sel.Range.ListFormat.ListOutdent(); [void]$sel.Range.ListFormat.ListOutdent()
    $sel.TypeText("Historian and reporting server"); $sel.TypeParagraph()
    if ($indentCase) {
      # What dragging the ruler does in Word: the paragraph moves right by one
      # step (18 pt) and the list level stays where it was.
      $left = [single]$sel.ParagraphFormat.LeftIndent
      $sel.ParagraphFormat.LeftIndent = [single]($left + 18)
      $sel.TypeText("An item moved right with the ruler, still at the first level"); $sel.TypeParagraph()
      $sel.ParagraphFormat.LeftIndent = [single]$left
      $sel.TypeText("Remote access gateway"); $sel.TypeParagraph()
    }
    Plain
  }
  function Add-Numbers([bool]$more) {
    $numbers = New-Numbers 0 1 $null
    [void]$sel.Range.ListFormat.ApplyListTemplate($numbers, $false)
    $sel.TypeText("Survey the control network"); $sel.TypeParagraph()
    $sel.TypeText("Agree the zone model"); $sel.TypeParagraph()
    [void]$sel.Range.ListFormat.ListIndent(); $sel.TypeText("Confirm each conduit with operations"); $sel.TypeParagraph()
    [void]$sel.Range.ListFormat.ListOutdent(); $sel.TypeText("Plan the outage"); $sel.TypeParagraph()
    Plain
    if (-not $more) { return }
    Para "A paragraph sits between two parts of the same list." "normal"
    [void]$sel.Range.ListFormat.ApplyListTemplate($numbers, $true)     # carries on at 4
    $sel.TypeText("Install the firewall pair"); $sel.TypeParagraph()
    $sel.TypeText("Test failover"); $sel.TypeParagraph()
    Plain
    Para "The next list starts again at one." "normal"
    [void]$sel.Range.ListFormat.ApplyListTemplate((New-Numbers 0 1 $null), $false)
    $sel.TypeText("Back up each configuration"); $sel.TypeParagraph()
    $sel.TypeText("Label the cabinets"); $sel.TypeParagraph()
    Plain
    Para "This one is lettered and starts at e." "normal"
    [void]$sel.Range.ListFormat.ApplyListTemplate((New-Numbers 4 5 "%1)"), $false)
    $sel.TypeText("Spare switch"); $sel.TypeParagraph()
    $sel.TypeText("Spare power supply"); $sel.TypeParagraph()
    Plain
  }
  function Add-Table([bool]$caption) {
    $sel.Style = (StyleOf "normal")
    $t = $doc.Tables.Add($sel.Range, 4, 3); $t.Borders.Enable = 1
    $t.Cell(1, 1).Range.Text = "Zone"; $t.Cell(1, 2).Range.Text = "Assets"; $t.Cell(1, 3).Range.Text = "Notes"
    $t.Rows.Item(1).HeadingFormat = -1; $t.Rows.Item(1).Range.Font.Bold = 1
    $t.Cell(2, 1).Range.Text = "Control"; $t.Cell(2, 2).Range.Text = "Controllers and panels"
    $t.Cell(3, 1).Range.Text = "Supervisory"; $t.Cell(3, 2).Range.Text = "Historian"
    $t.Cell(4, 1).Range.Text = "Remote sites reached by radio"
    # Rows cannot be addressed once cells are merged down, so the merges come last.
    $t.Cell(4, 1).Merge($t.Cell(4, 2))
    $t.Cell(2, 3).Merge($t.Cell(3, 3)); $t.Cell(2, 3).Range.Text = "Same firewall policy"
    End-Doc
    if ($caption) {
      $sel.Style = (StyleOf "caption"); $sel.TypeText("Table ")
      [void]$sel.Fields.Add($sel.Range, -1, "SEQ Table \* ARABIC", $false); End-Doc
      $sel.TypeText(": Zones and what they hold"); $sel.TypeParagraph()
    }
    $sel.Style = (StyleOf "normal")
  }
  function Add-Picture($file, $alt, $captionText) {
    $sel.Style = (StyleOf "normal")
    $p = $sel.InlineShapes.AddPicture($file, $false, $true)
    if ($alt) { $p.AlternativeText = $alt }
    End-Doc; $sel.TypeParagraph()
    if ($captionText) { Para $captionText "caption" }
    return $p
  }
  function Add-FloatingPicture {
    # Shapes.AddPicture ignores the anchor it is given from PowerShell and
    # anchors to the first paragraph of the file, so the picture goes in as an
    # in-line one where it belongs and is then made to float.
    $sel.Style = (StyleOf "normal")
    $sel.TypeText("A picture floats beside this paragraph, with the text wrapped square around it. The words carry on for long enough to give the wrap something to do.")
    $fp = $sel.InlineShapes.AddPicture($png, $false, $true).ConvertToShape()
    $fp.WrapFormat.Type = 0; $fp.AlternativeText = "A floating picture of zone A"
    Beside $fp 0 6
    End-Doc; $sel.TypeParagraph()
  }
  # Puts a floating shape where a person would: measured from the column and
  # from the paragraph it is anchored in. Without this Word takes the left and
  # top given to AddShape as a place on the page and stores it as a distance
  # of many centimetres back up from the anchor, so every shape ends up piled
  # at the top of the first page, nowhere near its paragraph.
  function Beside($s, $left, $top) {
    $s.RelativeHorizontalPosition = 2; $s.RelativeVerticalPosition = 2     # column, paragraph
    $s.Left = [single]$left; $s.Top = [single]$top
  }
  function Add-Shapes {
    Para "Two shapes with words in them are anchored to this paragraph." "normal"
    $a = LastPara
    $s1 = $doc.Shapes.AddShape(1, 40, 24, 120, 44, $a); $s1.TextFrame.TextRange.Text = "Controller"; $s1.AlternativeText = "A box for the controller"; $s1.WrapFormat.Type = 4
    $s2 = $doc.Shapes.AddShape(9, 240, 24, 120, 44, $a); $s2.TextFrame.TextRange.Text = "Operator panel"; $s2.WrapFormat.Type = 4
    Beside $s1 0 6; Beside $s2 140 6
  }
  function Add-TextBox {
    Para "A text box is anchored to this paragraph." "normal"
    $tb = $doc.Shapes.AddTextbox(1, 40, 24, 220, 40, (LastPara))
    $tb.TextFrame.TextRange.Text = "A text box that says the outage window is four hours"; $tb.WrapFormat.Type = 4
    Beside $tb 0 6
  }
  function Add-WrappedShape {
    # A box at the top right of a paragraph, with the paragraph's lines running round it.
    $long = "The control network carries traffic between the supervisory servers and the controllers on the plant floor. It was built in stages over fifteen years and nobody now holds a full drawing of it. "
    Para ("A box sits beside this paragraph, at its top right corner. " + $long + $long) "normal"
    $s = $doc.Shapes.AddShape(1, 40, 24, 140, 80, (LastPara)); $s.Name = "Firewall box"; $s.TextFrame.TextRange.Text = "Firewall"
    $s.WrapFormat.Type = 0; $s.WrapFormat.Side = 0
    Beside $s 300 10
    Para ("This paragraph has no drawing of its own. " + $long) "normal"
  }
  function Add-PageNote {
    # A text box at a fixed place on the page, wherever its paragraph is.
    $long = "The outage has to be agreed with the duty manager, who needs a week's notice and a named engineer on site for the whole of it. "
    Para ("A note is placed at a fixed spot on the page. " + $long + $long) "normal"
    $t = $doc.Shapes.AddTextbox(1, 330, 600, 190, 60, (LastPara)); $t.Name = "Page note"
    $t.TextFrame.TextRange.Text = "Note: the outage window is four hours"; $t.WrapFormat.Type = 0
    $t.RelativeHorizontalPosition = 1; $t.RelativeVerticalPosition = 1; $t.Left = 330; $t.Top = 600     # page, page
  }
  function Add-Diagram {
    # A network drawn straight on the page, the way most are: blank lines to
    # make room, then boxes and lines dropped over them, each one anchored to
    # the blank line it was dropped on. Nothing is grouped and there is no
    # canvas, so only the anchors hold the drawing together.
    Para "A network drawn on the page" "h1"
    Para "The boxes and lines below are separate shapes, drawn over blank lines." "normal"
    $first = $doc.Paragraphs.Count; $count = 14
    for ($i = 0; $i -lt $count; $i++) { Para "" "normal" }
    Para "Figure 1: The network, drawn on the page" "caption"
    Para "This paragraph follows the drawing and must stay below it." "normal"
    $blank = @(); for ($i = 0; $i -lt $count; $i++) { $blank += $doc.Paragraphs.Item($first + $i) }
    $tops = @($blank | ForEach-Object { [double]$_.Range.Information(6) })     # down the page, in points
    if ($tops[0] -le 0 -or $tops[$count - 1] -le $tops[0]) { throw "Word did not say where the blank lines are." }
    # The blank line a shape with its top at $y (measured from the first blank line) would be dropped on.
    function LineFor($y) { $k = 0; for ($i = 0; $i -lt $count; $i++) { if ($tops[$i] -le $tops[0] + $y + 0.01) { $k = $i } }; return $k }
    function Box($type, $x, $y, $w, $h, $text) {
      $k = LineFor $y
      $s = $doc.Shapes.AddShape($type, 0, 0, $w, $h, $blank[$k].Range); $s.TextFrame.TextRange.Text = $text; $s.Name = $text
      Beside $s $x ($tops[0] + $y - $tops[$k])
    }
    Box 179 175 5 90 50 "Internet"
    Box 1 175 85 90 40 "Firewall"
    Box 1 175 160 90 40 "Switch"
    Box 1 40 240 90 40 "PLC"
    Box 9 310 240 90 40 "HMI"
    $n = 0
    foreach ($q in @(@(220, 55, 220, 85), @(220, 125, 220, 160), @(220, 200, 85, 240), @(220, 200, 355, 240))) {
      $y = [Math]::Min($q[1], $q[3]); $k = LineFor $y
      $l = $doc.Shapes.AddLine($q[0], $q[1], $q[2], $q[3], $blank[$k].Range); $l.Line.Weight = 1.5; $n++; $l.Name = "Link $n"
      Beside $l ([Math]::Min($q[0], $q[2])) ($tops[0] + $y - $tops[$k])
    }
  }
  function Add-Group {
    # Word refuses to group shapes on the page while its window is hidden
    # ("Grouping is disabled for the selected shapes"), and these rules do not
    # allow showing it. Inside a drawing canvas it does group them, so the group
    # here is Word's own markup, one level down. A group straight on the page
    # is one of the cases the import tests build from XML.
    #
    # A canvas also ignores the anchor it is given, so it is drawn in a spare
    # document, where the first paragraph is the right one, and that paragraph
    # is brought across whole. FormattedText does it without the clipboard,
    # which belongs to the person at the machine.
    $sel.Style = (StyleOf "normal")
    $spare = $word.Documents.Add()
    $spare.Paragraphs.Item(1).Range.InsertBefore("A drawing canvas holding three grouped shapes is anchored to this paragraph.")
    $cv = $spare.Shapes.AddCanvas(40, 24, 340, 64); $cv.WrapFormat.Type = 4
    try { $cv.RelativeHorizontalPosition = 2; $cv.RelativeVerticalPosition = 2; $cv.Left = 0; $cv.Top = 6 } catch { L ("  note    the canvas was not moved beside its paragraph: " + $_.Exception.Message) }
    $g1 = $cv.CanvasItems.AddShape(1, 10, 12, 110, 40); $g1.TextFrame.TextRange.Text = "Switch"
    $g2 = $cv.CanvasItems.AddShape(1, 220, 12, 110, 40); $g2.TextFrame.TextRange.Text = "Firewall"
    $g3 = $cv.CanvasItems.AddLine(120, 32, 220, 32)
    [void]$cv.CanvasItems.Range(@($g1.Name, $g2.Name, $g3.Name)).Group()
    $cv.AlternativeText = "A switch joined to a firewall"
    $doc.Activate()
    $doc.Paragraphs.Item($doc.Paragraphs.Count).Range.FormattedText = $spare.Paragraphs.Item(1).Range.FormattedText
    $spare.Close([ref]0)
    $script:sel = $word.Selection; End-Doc
  }
  function Add-SmartArt {
    $sel.Style = (StyleOf "normal")
    $sa = $sel.InlineShapes.AddSmartArt($word.SmartArtLayouts.Item(1), $sel.Range)
    try {
      $nodes = $sa.SmartArt.AllNodes; $words = @("Plan", "Do", "Check")
      while ($nodes.Count -gt 3) { $nodes.Item($nodes.Count).Delete() }
      for ($i = 1; $i -le [Math]::Min(3, $nodes.Count); $i++) { $nodes.Item($i).TextFrame2.TextRange.Text = $words[$i - 1] }
    } catch { L ("  note    SmartArt words were not set: " + $_.Exception.Message) }
    try { $sa.AlternativeText = "Plan, do, check" } catch {}
    End-Doc; $sel.TypeParagraph()
  }
  function Add-Chart([double]$widthPt) {
    $sel.Style = (StyleOf "normal")
    # The data sheet is Excel's. It is left alone: see the note on Excel at the top.
    $ch = $sel.InlineShapes.AddChart2(-1, 51, $sel.Range)
    try { $ch.Chart.HasTitle = $true; $ch.Chart.ChartTitle.Text = "Devices by zone" } catch {}
    if ($widthPt -gt 0) { $ch.LockAspectRatio = 0; $ch.Width = $widthPt; $ch.Height = 200 } else { $ch.LockAspectRatio = 0; $ch.Width = 360; $ch.Height = 200 }
    End-Doc; $sel.TypeParagraph()
  }
  function Add-Sheet {
    $sel.Style = (StyleOf "normal")
    [void]$sel.InlineShapes.AddOLEObject("Excel.Sheet.12", "", $false, $false)
    End-Doc; $sel.TypeParagraph()
  }
  function Add-Equation {
    $sel.Style = (StyleOf "normal"); $sel.TypeText("a^2+b^2=c^2")
    $r = $doc.Paragraphs.Item($doc.Paragraphs.Count).Range
    [void]$doc.OMaths.Add($r); $doc.OMaths.BuildUp()
    End-Doc; $sel.TypeParagraph()
  }
  function Add-Landscape {
    $sel.InsertBreak(2); $sel.PageSetup.Orientation = 1
    Para "Wide register" "h1"
    Para "This section is on a landscape page." "normal"
    $t = $doc.Tables.Add($sel.Range, 2, 6); $t.Borders.Enable = 1
    $heads = @("Asset", "Zone", "Owner", "Firmware", "Last patched", "Comment")
    for ($i = 1; $i -le 6; $i++) { $t.Cell(1, $i).Range.Text = $heads[$i - 1]; $t.Cell(2, $i).Range.Text = @("Controller 4", "Control", "Operations", "2.8", "March 2025", "Due this year")[$i - 1] }
    $t.Rows.Item(1).HeadingFormat = -1
    End-Doc
    $sel.InsertBreak(2); $sel.PageSetup.Orientation = 0
  }
  function Add-Columns {
    $sel.InsertBreak(3); $sel.PageSetup.TextColumns.SetCount(2)
    Para "This passage is set in two columns, as a newsletter might be. Operators at each works log in with their own account and the shared account has been removed." "normal"
    Para "Engineers reach the controllers through the gateway and nowhere else. Each session is recorded and kept for ninety days." "normal"
    $sel.InsertBreak(3); $sel.PageSetup.TextColumns.SetCount(1)
  }
  function Add-HeaderFooter {
    $doc.Sections.Item(1).Headers.Item(1).Range.Text = "Northfield Water remote access review"
    $doc.Sections.Item(1).Footers.Item(1).Range.Text = "Harbour Controls Ltd, commercial in confidence"
  }
  function Add-Review {
    [void]$doc.Comments.Add((Find-Range "three treatment works"), "Is it still three after the merger?")
    [void]$doc.Comments.Add((Find-Range "Agree the zone model"), "Operations want to see this before it is agreed.")
    $doc.TrackRevisions = $true
    $r = Find-Range "Plan the outage"; $r.InsertAfter(" with the duty manager")
    [void](Find-Range "and reporting ").Delete()
    $doc.TrackRevisions = $false
  }
  function Add-Contents($marker) {
    $r = Find-Range $marker
    [void]$doc.TablesOfContents.Add($r, $true, 1, 3)
  }
  function Add-Theme {
    # Accent 1 becomes C00000 and the body font Georgia, so a shape that says
    # "accent 1" and text that says "the body font" can be told from Word's own.
    $doc.DocumentTheme.ThemeColorScheme.Colors(5).RGB = 0x0000C0
    $doc.DocumentTheme.ThemeFontScheme.MinorFont.Item(1).Name = "Georgia"
  }

  # ---- the fixtures ----
  $make = [ordered]@{}
  $make["fx-text"] = {
    Step "title and headings" {
      Para "Network segmentation review" "title"
      Para "Introduction" "h1"
      Add-Notes $true
      Add-Formatting
      Para "Scope" "h2"
      [void]$doc.Bookmarks.Add("scope", (LastPara))
      Add-Links
      Para "Works one" "h3"
      Para "Works one treats water for the northern district." "normal"
      Para "Filter hall" "h4"
      Para "The filter hall has its own controller." "normal"
      $cs = $doc.Styles.Add("Section heading", 1); $cs.BaseStyle = $doc.Styles.Item(-3)
      Para "A heading in a custom style" "Section heading"
      Para "The style above is the author's own, based on Heading 2." "normal"
    }
    Step "lists" { Para "Lists" "h1"; Add-Bullets $true; Para "The work is done in this order." "normal"; Add-Numbers $true }
    Step "picture with caption" { Para "Figures and tables" "h1"; [void](Add-Picture $png "Zone A, drawn as a blue box" "Figure 1: Zone A") }
    Step "table with caption" { Add-Table $true }
    Step "alignment" {
      Para "Alignment" "h1"
      # The style first: applying a style puts the alignment back to the style's own.
      function Aligned($how, $text) { $sel.Style = (StyleOf "normal"); $sel.ParagraphFormat.Alignment = $how; $sel.TypeText($text); $sel.TypeParagraph() }
      Aligned 1 "This paragraph is centred."
      Aligned 2 "This paragraph is set to the right."
      Aligned 3 "This paragraph is justified, and it runs on for long enough to reach a second line so that both edges of the text can be seen to line up with the margins."
      $sel.ParagraphFormat.Alignment = 0
    }
    Step "page break" { $sel.InsertBreak(7); Para "Next steps" "h1"; Para "Harbour Controls Ltd will send a plan within two weeks." "normal" }
  }
  $make["fx-art"] = {
    Step "pictures" {
      Para "Pictures" "h1"
      [void](Add-Picture $png "A PNG picture of zone A" $null)
      [void](Add-Picture $jpg "A JPEG picture of the site" $null)
      [void](Add-Picture $emf "A vector drawing of a panel" $null)
    }
    Step "cropped picture" { $c = Add-Picture $png "The same picture, cropped" $null; $c.PictureFormat.CropLeft = 12; $c.PictureFormat.CropBottom = 8 }
    Step "floating picture" { Add-FloatingPicture }
    Step "shapes" { Para "Drawings" "h1"; Add-Shapes }
    Step "text box" { Add-TextBox }
    Step "smartart" { Para "A diagram" "h2"; Add-SmartArt }
    Step "chart" { Para "A chart" "h2"; Add-Chart 0 }
    Step "embedded sheet" { Para "An embedded sheet" "h2"; Add-Sheet }
    Step "wide chart" { Para "A chart wider than the page" "h2"; Add-Chart 540 }
  }
  $make["fx-vector"] = {
    Step "svg" { Para "Vector pictures" "h1"; [void](Add-Picture $svg "An SVG drawing of a conduit" $null) }
    Step "tiff" { [void](Add-Picture $tif "A scanned page" $null) }
    Step "group" { Add-Group }
    Step "equation" { Para "An equation" "h2"; Add-Equation }
  }
  $make["fx-theme"] = {
    Step "text" { Para "A themed document" "h1"; Para "The theme of this file is not Word's own." "normal" }
    Step "shape in accent 1" {
      Para "The shape below is filled with accent 1." "normal"
      $s = $doc.Shapes.AddShape(1, 40, 24, 140, 44, (LastPara)); $s.Fill.ForeColor.ObjectThemeColor = 5; $s.TextFrame.TextRange.Text = "Accent one"; $s.WrapFormat.Type = 4
      Beside $s 0 6
    }
    Step "text box" { Add-TextBox }
    Step "theme" { Add-Theme }
  }
  $make["fx-float"] = {
    # Floating drawings in the places people really put them, so an export can
    # be compared with its source: a box wrapped by its paragraph, a note fixed
    # to the page, and a diagram of loose shapes over blank lines.
    Step "wrapped shape" { Para "Floating drawings" "h1"; Add-WrappedShape }
    Step "page note" { Add-PageNote }
    Step "loose diagram" { $sel.InsertBreak(7); Add-Diagram }
  }
  $make["fx-review"] = {
    Step "cover and control table" {
      # A cover made by hand: large centred text in the Normal style, as most
      # real documents have, and not Word's cover page building block.
      $sel.Style = (StyleOf "normal"); $sel.ParagraphFormat.Alignment = 1
      $sel.Font.Size = 28; $sel.Font.Bold = 1; $sel.TypeText("Remote access review"); $sel.TypeParagraph()
      $sel.Font.Size = 16; $sel.Font.Bold = 0; $sel.TypeText("Northfield Water"); $sel.TypeParagraph()
      $sel.TypeText("Prepared by Harbour Controls Ltd"); $sel.TypeParagraph()
      $sel.Font.Reset(); $sel.ParagraphFormat.Alignment = 0
      $sel.InsertBreak(7)
      $t = $doc.Tables.Add($sel.Range, 3, 2); $t.Borders.Enable = 1
      $t.Cell(1, 1).Range.Text = "Revision"; $t.Cell(1, 2).Range.Text = "B"
      $t.Cell(2, 1).Range.Text = "Status"; $t.Cell(2, 2).Range.Text = "For comment"
      $t.Cell(3, 1).Range.Text = "Issued to"; $t.Cell(3, 2).Range.Text = "Head of operations"
      End-Doc
      Para "CONTENTS-GO-HERE" "normal"
      $sel.InsertBreak(7)
    }
    Step "body" {
      Para "Background" "h1"
      Add-Notes $false
      Para "Method" "h2"
      Add-Numbers $false
      Para "Findings" "h1"
      Para "The remote access gateway is the only way in from outside." "normal"
      Add-Bullets $false
    }
    Step "two columns" { Add-Columns }
    Step "landscape section" { Add-Landscape }
    Step "last section" { Para "Summary" "h1"; Para "Two changes are recommended and neither needs an outage." "normal" }
    Step "header and footer" { Add-HeaderFooter }
    Step "contents field" { Add-Contents "CONTENTS-GO-HERE" }
    Step "comments and tracked changes" { Add-Review }
  }
  $make["fx-styles"] = {
    # Headings that are headings for four different reasons, none of them the
    # built-in English style name on the paragraph itself.
    Step "styles" {
      $u = [string][char]0xDC   # capital U with an umlaut, kept out of the script's own text
      $a = $doc.Styles.Add("Section title", 1); $a.BaseStyle = $doc.Styles.Item(-2)
      $b = $doc.Styles.Add("Clause", 1); $b.BaseStyle = $a
      $c = $doc.Styles.Add($u + "berschrift 2", 1); $c.Font.Bold = 1; $c.Font.Size = 14
      $d = $doc.Styles.Add("Titre 3", 1); $d.Font.Italic = 1
      $e = $doc.Styles.Add("Chapter", 1); $e.Font.Size = 18; $e.ParagraphFormat.OutlineLevel = 1
      Para "Based on Heading 1" "Section title"
      Para "The style of the heading above is called Section title and is based on Heading 1." "normal"
      Para "Based on a style that is based on Heading 1" "Clause"
      Para "The heading above is two styles away from Heading 1." "normal"
      Para "Named as a German level two heading" ($u + "berschrift 2")
      Para "The style above has a German heading name and no outline level." "normal"
      Para "Named as a French level three heading" "Titre 3"
      Para "The style above has a French heading name and no outline level." "normal"
      Para "A style with an outline level" "Chapter"
      Para "The style above is called Chapter and carries outline level 1." "normal"
      $sel.Style = (StyleOf "normal"); $sel.ParagraphFormat.OutlineLevel = 2; $sel.TypeText("An outline level on the paragraph itself"); $sel.TypeParagraph()
      $sel.ParagraphFormat.OutlineLevel = 10
      Para "The paragraph above is in the Normal style with outline level 2 set by hand." "normal"
      $sel.Font.Bold = 1; $sel.Font.Size = 16; $sel.TypeText("Large bold text that is not a heading"); $sel.TypeParagraph(); $sel.Font.Reset()
      Para "Nothing says the line above is a heading, so it must stay a paragraph." "normal"
    }
  }
  $make["fx-all"] = {
    Step "front" { Para "Everything in one file" "title"; Para "CONTENTS-GO-HERE" "normal" }
    Step "text" {
      Para "Text" "h1"; Add-Notes $true; Add-Formatting
      Para "Scope" "h2"; [void]$doc.Bookmarks.Add("scope", (LastPara)); Add-Links
      Para "Detail" "h3"
      $cs = $doc.Styles.Add("Section heading", 1); $cs.BaseStyle = $doc.Styles.Item(-3)
      Para "A heading in a custom style" "Section heading"
      $c = $doc.Styles.Add(([string][char]0xDC) + "berschrift 2", 1); $c.Font.Bold = 1
      Para "A heading named in German" (([string][char]0xDC) + "berschrift 2")
    }
    Step "lists" { Add-Bullets $false; Para "Then, in order." "normal"; Add-Numbers $false }
    Step "table" { Add-Table $true }
    Step "pictures" {
      Para "Pictures" "h1"
      [void](Add-Picture $png "A PNG picture of zone A" "Figure 1: Zone A")
      [void](Add-Picture $emf "A vector drawing of a panel" $null)
      [void](Add-Picture $svg "An SVG drawing of a conduit" $null)
    }
    Step "floating picture" { Add-FloatingPicture }
    Step "shapes" { Para "Drawings" "h1"; Add-Shapes }
    Step "group" { Add-Group }
    Step "text box" { Add-TextBox }
    # Before the chart: while a chart's data sheet is open Word will not switch
    # change tracking on ("This command is not available").
    Step "comments and tracked changes" { Add-Review }
    Step "smartart" { Add-SmartArt }
    Step "chart" { Add-Chart 0 }
    Step "embedded sheet" { Add-Sheet }
    Step "equation" { Add-Equation }
    Step "two columns" { Add-Columns }
    Step "landscape section" { Add-Landscape }
    Step "last section" { Para "Summary" "h1"; Para "Everything above should arrive in the template." "normal" }
    Step "header and footer" { Add-HeaderFooter }
    Step "theme" { Add-Theme }
    Step "contents field" { Add-Contents "CONTENTS-GO-HERE" }
  }
  $make["demo-source"] = {
    # The tour's document before it is imported: a short proposal with one of
    # each kind of block, one line left in red to complete, and one diagram.
    Step "opening" {
      Para "Network segmentation proposal" "title"
      Para "Summary" "h1"
      $sel.Style = (StyleOf "normal"); $sel.TypeText("Northfield Water asked for a way to separate the control network at its three treatment works from the office network")
      [void]$doc.Footnotes.Add($sel.Range, "", "The request followed the water quality audit of spring 2026."); End-Doc
      $sel.TypeText(". This proposal sets out what would be done, in what order and what it needs from the site. The approach follows the zones and conduits model in ")
      [void]$doc.Hyperlinks.Add($sel.Range, "https://www.example.com/zones-and-conduits", "", "", "the published guidance"); End-Doc
      $sel.TypeText("."); $sel.TypeParagraph()
      Para "What is proposed" "h1"
      $sel.Style = (StyleOf "normal"); $sel.TypeText("The work is in "); T "three stages" "b"; $sel.TypeText(", and each one can be "); T "stopped and reversed" "i"; $sel.TypeText(" without an outage."); $sel.TypeParagraph()
    }
    Step "diagram" { Add-SmartArt; Para "Figure 1: The three stages" "caption" }
    Step "lists" {
      Para "Stages" "h2"
      $numbers = New-Numbers 0 1 $null
      [void]$sel.Range.ListFormat.ApplyListTemplate($numbers, $false)
      $sel.TypeText("Survey the control network and record every connection"); $sel.TypeParagraph()
      $sel.TypeText("Agree the zone model with operations"); $sel.TypeParagraph()
      [void]$sel.Range.ListFormat.ListIndent(); $sel.TypeText("Confirm each conduit and who owns it"); $sel.TypeParagraph()
      [void]$sel.Range.ListFormat.ListOutdent(); $sel.TypeText("Install the firewall pair and move one zone at a time"); $sel.TypeParagraph()
      Plain
      Para "What the site provides" "h2"
      [void]$sel.Range.ListFormat.ApplyListTemplate((New-Bullets), $false)
      $sel.TypeText("A named contact at each works"); $sel.TypeParagraph()
      $sel.TypeText("Network drawings, however old"); $sel.TypeParagraph()
      $sel.TypeText("Access to the control room for two days"); $sel.TypeParagraph()
      Plain
    }
    Step "table" {
      Para "Zones" "h1"
      $t = $doc.Tables.Add($sel.Range, 4, 3); $t.Borders.Enable = 1
      $rows = @(@("Zone", "What it holds", "Target level"), @("Control", "Controllers and panels at each works", "2"), @("Supervisory", "Historian and operator workstations", "2"), @("Demilitarised zone", "Remote access gateway and patch server", "3"))
      for ($r = 1; $r -le 4; $r++) { for ($c = 1; $c -le 3; $c++) { $t.Cell($r, $c).Range.Text = $rows[$r - 1][$c - 1] } }
      $t.Rows.Item(1).HeadingFormat = -1; $t.Rows.Item(1).Range.Font.Bold = 1
      End-Doc
      Para "Table 1: The proposed zones" "caption"
    }
    Step "picture" { [void](Add-Picture $png "Zone A, drawn as a blue box" "Figure 2: Zone A at works one") }
    Step "prompt and page break" {
      $sel.Style = (StyleOf "normal"); T "Confirm the outage window with the duty manager and state it here." "red"; $sel.TypeParagraph()
      $sel.InsertBreak(7)
      Para "Cost and timing" "h1"
      Para "The three stages take six weeks in all. A fixed price is given in the covering letter." "normal"
    }
  }

  L $only
  try { & $make[$only]; Save-Doc $only }
  catch { L ("  FAILED  " + $only + ": " + $_.Exception.Message); try { $doc.Close(0) } catch {} }
  # Word only goes promptly once nothing here still holds one of its objects.
  $script:doc = $null; $script:sel = $null; [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  $word.Quit([ref]0)
  [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word); $script:word = $null; [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

# One attempt at one fixture: the job, then the tidying up. Returns the log.
function Invoke-Worker([string]$name, [int]$attempt) {
  $log = Join-Path $work ("$name-$attempt.log")
  $pidFile = Join-Path $work ("$name-$attempt.pid")
  $raw = Join-Path $work ($name + ".docx")
  if (Test-Path -LiteralPath $raw) { Remove-Item -LiteralPath $raw -Force }
  $job = Start-Job -ArgumentList $work, $log, $pidFile, $name -ScriptBlock $worker
  $finished = Wait-Job $job -Timeout $TimeoutSec
  if (-not $finished) { Stop-Job $job }
  $said = @(Receive-Job $job -ErrorAction SilentlyContinue 2>&1 | ForEach-Object { "  job     " + $_ })
  Remove-Job $job -Force
  # Word takes a moment to go after Quit. Anything left is ended only if it is
  # the one process this attempt recorded, and is still a Word.
  if (Test-Path -LiteralPath $pidFile) {
    $mine = [int](([IO.File]::ReadAllText($pidFile)).Trim())
    for ($i = 0; $i -lt 60; $i++) { if (-not (Get-Process -Id $mine -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 500 }
    $p = Get-Process -Id $mine -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -eq "WINWORD" -and $beforeWord -notcontains $mine) { $said += "  note    ended the Word this run started ($mine)"; Stop-Process -Id $mine -Force }
  }
  Get-CimInstance Win32_Process -Filter "Name='EXCEL.EXE'" -ErrorAction SilentlyContinue | Where-Object {
    $beforeExcel -notcontains [int]$_.ProcessId -and $_.CommandLine -match '(?i)[-/]embedding'
  } | ForEach-Object {
    $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
    if ($p -and $p.MainWindowHandle -eq 0) { $said += "  note    ended the hidden Excel this run started ($($_.ProcessId))"; Stop-Process -Id $_.ProcessId -Force }
  }
  $text = if (Test-Path -LiteralPath $log) { [IO.File]::ReadAllText($log).TrimEnd() } else { $name }
  if (-not $finished) { $text += "`n  FAILED  Word did not finish in $TimeoutSec seconds" }
  if ($said.Count) { $text += "`n" + ($said -join "`n") }
  return $text
}

# Word now and then dies part way through a file (an RPC failure while adding
# SmartArt, seen once in a dozen runs), so a file that did not come out whole
# is tried once more before the run is called a failure.
$logText = ""
foreach ($name in $Only) {
  $text = Invoke-Worker $name 1
  if ($text -match '(?m)^s*FAILED' -or -not (Test-Path -LiteralPath (Join-Path $work ($name + ".docx")))) {
    Write-Output $text; Write-Output "  retry   $name"
    $text = Invoke-Worker $name 2
  }
  Write-Output $text
  $logText += $text + "`n"
}

# ---- take the person and the machine out of what Word saved ----
Add-Type -AssemblyName System.IO.Compression
$utf8 = New-Object Text.UTF8Encoding($false)
$FIXED = New-Object DateTimeOffset(2026, 1, 1, 0, 0, 0, [TimeSpan]::Zero)

function Set-Element([string]$xml, [string]$tag, [string]$value, [string]$parentClose) {
  $rx = "<$tag(\s[^>]*)?(/>|>[^<]*</$tag>)"
  if ([regex]::IsMatch($xml, $rx)) { return [regex]::Replace($xml, $rx, { param($m) "<$tag" + $m.Groups[1].Value + ">$value</$tag>" }) }
  if ($parentClose) { return $xml.Replace($parentClose, "<$tag>$value</$tag>$parentClose") }
  return $xml
}

# Rewrites one Office package. Called again on each workbook embedded in it,
# because a chart's data sheet and an embedded sheet are whole Excel files with
# properties, and a label, of their own.
function Scrub-Package([byte[]]$bytes) {
  $in = New-Object IO.MemoryStream(, $bytes)
  $zip = New-Object IO.Compression.ZipArchive($in, [IO.Compression.ZipArchiveMode]::Read)
  $parts = New-Object System.Collections.ArrayList
  foreach ($e in $zip.Entries) {
    if ($e.FullName.EndsWith("/")) { continue }
    $ms = New-Object IO.MemoryStream; $s = $e.Open(); $s.CopyTo($ms); $s.Dispose()
    [void]$parts.Add(@{ name = $e.FullName; data = $ms.ToArray() })
  }
  $zip.Dispose(); $in.Dispose()

  # Parts that exist only to name someone: the directory entries behind
  # comments, custom properties (older sensitivity labels live there) and the
  # label part itself.
  $dropped = @($parts | Where-Object { $_.name -match '^(word/people\.xml|docProps/custom\.xml|docMetadata/.*|xl/persons/.*)$' } | ForEach-Object { $_.name })
  $kept = New-Object System.Collections.ArrayList
  foreach ($p in $parts) {
    if ($dropped -contains $p.name) { continue }
    $name = $p.name
    if ($name -match '\.(xlsx|xlsm|docx|pptx)$') { $p.data = Scrub-Package $p.data; [void]$kept.Add($p); continue }
    if ($name -notmatch '\.(xml|rels|vml)$') { [void]$kept.Add($p); continue }
    $text = $utf8.GetString($p.data); $was = $text
    if ($name -eq "[Content_Types].xml") {
      foreach ($d in $dropped) { $text = [regex]::Replace($text, '<Override\b[^>]*PartName="/' + [regex]::Escape($d) + '"[^>]*/>', "") }
    } elseif ($name -match '\.rels$') {
      # A relationship target is relative to the folder of the part the .rels
      # file belongs to (the folder above _rels).
      $base = ($name -replace '_rels/[^/]+$', '')
      $text = [regex]::Replace($text, '<Relationship\b[^>]*/>', {
        param($m)
        if ($m.Value -match 'TargetMode="External"') { return $m.Value }
        $t = [regex]::Match($m.Value, 'Target="([^"]*)"').Groups[1].Value
        $full = if ($t.StartsWith("/")) { $t.Substring(1) } else { $base + $t }
        while ($full -match '[^/]+/\.\./') { $full = $full -replace '[^/]+/\.\./', '' }
        if ($dropped -contains $full) { return "" }
        return $m.Value
      })
    } elseif ($name -eq "docProps/core.xml") {
      $text = Set-Element $text "dc:creator" $STAND_IN "</cp:coreProperties>"
      $text = Set-Element $text "cp:lastModifiedBy" $STAND_IN "</cp:coreProperties>"
      $text = Set-Element $text "cp:revision" "1" $null
      $text = [regex]::Replace($text, '(<dcterms:(created|modified)\b[^>]*>)[^<]*', '${1}2026-01-01T00:00:00Z')
      $text = [regex]::Replace($text, '<cp:lastPrinted>[^<]*</cp:lastPrinted>', "")
    } elseif ($name -eq "docProps/app.xml") {
      foreach ($tag in "Company", "Manager", "HyperlinkBase") { $text = [regex]::Replace($text, "<$tag>[^<]*</$tag>", "<$tag></$tag>") }
      $text = [regex]::Replace($text, '<TotalTime>[^<]*</TotalTime>', '<TotalTime>0</TotalTime>')
    } else {
      $text = [regex]::Replace($text, '\bw:author="[^"]*"', 'w:author="' + $STAND_IN + '"')
      $text = [regex]::Replace($text, '\bw:initials="[^"]*"', 'w:initials="FA"')
    }
    if ($text -cne $was) { $p.data = $utf8.GetBytes($text) }
    [void]$kept.Add($p)
  }

  # Written out whole, content types first as Word writes it, with one fixed
  # date so the time of the run is not in the file either.
  $out = New-Object IO.MemoryStream
  $w = New-Object IO.Compression.ZipArchive($out, [IO.Compression.ZipArchiveMode]::Create, $true)
  $ordered = @($kept | Where-Object { $_.name -eq "[Content_Types].xml" }) + @($kept | Where-Object { $_.name -ne "[Content_Types].xml" })
  foreach ($p in $ordered) {
    $level = if ($p.name -match '\.(png|jpe?g|gif|xlsx|xlsm|docx|pptx)$') { [IO.Compression.CompressionLevel]::NoCompression } else { [IO.Compression.CompressionLevel]::Optimal }
    $e = $w.CreateEntry($p.name, $level); $e.LastWriteTime = $FIXED
    $s = $e.Open(); $s.Write($p.data, 0, $p.data.Length); $s.Dispose()
  }
  $w.Dispose()
  $result = $out.ToArray(); $out.Dispose()
  return , $result
}

$made = 0
foreach ($name in $Only) {
  $raw = Join-Path $work ($name + ".docx")
  if (-not (Test-Path -LiteralPath $raw)) { Write-Output "NOT MADE $name"; continue }
  $clean = Scrub-Package ([IO.File]::ReadAllBytes($raw))
  $dest = Join-Path $OutDir ($name + ".docx")
  [IO.File]::WriteAllBytes($dest, $clean)
  Write-Output ("wrote {0} ({1:N0} KB)" -f $dest, ($clean.Length / 1KB))
  $made++
}
if (-not $KeepWork) { try { Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction Stop } catch {} } else { Write-Output "Work folder kept: $work" }

$failedSteps = @([regex]::Matches($logText, '(?m)^\s*FAILED.*$') | ForEach-Object { $_.Value.Trim() })
if ($failedSteps.Count -or $made -ne $Only.Count) {
  Write-Output ""
  Write-Output ("Not complete: {0} of {1} files made, {2} part(s) failed." -f $made, $Only.Count, $failedSteps.Count)
  exit 1
}
if (-not $NoBuild) {
  & (Join-Path $here "build-fixtures.ps1") -Folder $OutDir
  exit $LASTEXITCODE
}
exit 0
