// Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
//
// OtcatSplash: the loading window the portable exe shows from the moment it is
// double-clicked until the tool's own window is ready.
//
// Why a separate program: the launcher unpacks the app and then starts it, and
// both steps block it for seconds at a time (the 234 MB program file is one
// long write, and Windows checks a new program before it will start it). A
// loading bar drawn by the launcher freezes during exactly those waits. This
// runs on its own, so the bar keeps moving whatever the launcher is doing.
//
//   OtcatSplash.exe <splash.bmp> <ready-flag-file> <launcher-pid>
//
// One source for every module's exe: the window title is the product name the
// build stamps in (AssemblyProduct), and the picture is drawn per module.
//
// It shows the bitmap (logo, name, version, track drawn by build-splash.ps1),
// animates the bar over the track, and closes when the ready flag appears
// (the app writes it once its window is up), when the launcher exits, or
// after 3 minutes, so it can never be left behind.
//
// Built by build-portable-exe.ps1 with the .NET Framework compiler that ships
// with Windows; runs on the .NET Framework 4.8 every Windows 10/11 machine has.

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

static class OtcatSplash
{
    [STAThread]
    static int Main(string[] args)
    {
        if (args.Length < 3) return 2;
        Image image;
        try { image = Image.FromFile(args[0]); } catch { return 3; }
        int pid; int.TryParse(args[2], out pid);
        Application.EnableVisualStyles();
        Application.Run(new SplashForm(image, args[1], pid));
        return 0;
    }
}

sealed class SplashForm : Form
{
    // The bar's track, as drawn into the bitmap by build-splash.ps1.
    const int BarX = 40, BarY = 202, BarW = 440, BarH = 4;
    const double CycleMs = 1400;   // the same sweep as app\splash.html
    static readonly Color Track = Color.FromArgb(0xE6, 0xEE, 0xF6);
    static readonly Color Blue = Color.FromArgb(0x33, 0x98, 0xCC);

    readonly Image image;
    readonly string readyFlag;
    readonly int launcherPid;
    readonly Stopwatch clock = Stopwatch.StartNew();
    readonly Timer frame = new Timer();
    int ticks;

    public SplashForm(Image image, string readyFlag, int launcherPid)
    {
        this.image = image; this.readyFlag = readyFlag; this.launcherPid = launcherPid;
        Text = StampedProduct();
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = image.Size;
        ShowInTaskbar = true;
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        DoubleBuffered = true;
        BackColor = Color.White;
        frame.Interval = 16;
        frame.Tick += OnTick;
        frame.Start();
    }

    // The product being started, stamped into this program by the build
    // (AssemblyProduct), so one source serves every module's exe.
    static string StampedProduct()
    {
        var a = (System.Reflection.AssemblyProductAttribute)Attribute.GetCustomAttribute(
            System.Reflection.Assembly.GetExecutingAssembly(), typeof(System.Reflection.AssemblyProductAttribute));
        return a != null && !string.IsNullOrEmpty(a.Product) ? a.Product : "OT Cyber suite";
    }

    void OnTick(object sender, EventArgs e)
    {
        Invalidate(new Rectangle(BarX, BarY, BarW, BarH));
        // About four checks a second on whether to close.
        if (++ticks % 15 != 0) return;
        if (File.Exists(readyFlag) || LauncherGone() || clock.Elapsed.TotalMinutes > 3) { frame.Stop(); Close(); }
    }

    bool LauncherGone()
    {
        if (launcherPid <= 0) return false;
        try { return Process.GetProcessById(launcherPid).HasExited; } catch { return true; }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.DrawImageUnscaled(image, 0, 0);
        // A segment 30% of the track wide, eased from just off the left to
        // just off the right, as in the app's CSS.
        double t = (clock.Elapsed.TotalMilliseconds % CycleMs) / CycleMs;
        double ease = t < 0.5 ? 2 * t * t : 1 - Math.Pow(-2 * t + 2, 2) / 2;
        int seg = (int)(BarW * 0.3);
        int x = (int)(-seg + ease * (BarW + seg * 1.4));
        using (var track = new SolidBrush(Track)) e.Graphics.FillRectangle(track, BarX, BarY, BarW, BarH);
        int left = Math.Max(x, 0), right = Math.Min(x + seg, BarW);
        if (right > left) using (var blue = new SolidBrush(Blue)) e.Graphics.FillRectangle(blue, BarX + left, BarY, right - left, BarH);
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        image.Dispose();
        base.OnFormClosed(e);
    }
}
