# Claude Code Setup Kit — Task Scheduler registrieren
# ============================================================
# Erstellt einen Windows Scheduled Task der alle 2 Tage
# check-updates-auto.ps1 ausfuehrt.
#
# Ausfuehren mit:
#   .\schedule-updates.ps1
#
# Entfernen mit:
#   .\schedule-updates.ps1 -Remove
# ============================================================

param(
    [switch]$Remove = $false,
    [string]$InstallDir = "",
    [int]$IntervalDays = 2,
    [string]$RunAt = "09:00"
)

$TaskName = "ClaudeCodeSetupKitUpdateCheck"

# InstallDir ermitteln: Parameter > setup-kit.json > Skript-Verzeichnis
if (-not $InstallDir) {
    $configFile = "$env:USERPROFILE\.claude\setup-kit.json"
    if (Test-Path $configFile) {
        # Verzeichnis des Scripts aus dem Konfigurationspfad ableiten
        $InstallDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    } else {
        $InstallDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
}

$ScriptPath = "$InstallDir\check-updates-auto.ps1"

# --- Task entfernen ---
if ($Remove) {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "  [OK] Scheduled Task '$TaskName' entfernt." -ForegroundColor Green
    } else {
        Write-Host "  Task '$TaskName' nicht gefunden." -ForegroundColor Yellow
    }
    exit 0
}

# --- Pruefen ob check-updates-auto.ps1 existiert ---
if (-not (Test-Path $ScriptPath)) {
    Write-Host "  FEHLER: $ScriptPath nicht gefunden." -ForegroundColor Red
    Write-Host "  Stelle sicher dass das Setup-Kit vollstaendig installiert ist." -ForegroundColor Yellow
    exit 1
}

# --- Task registrieren ---
Write-Host ""
Write-Host "=== Update-Check automatisieren ===" -ForegroundColor Cyan
Write-Host "  Script:   $ScriptPath" -ForegroundColor Gray
Write-Host "  Intervall: alle $IntervalDays Tage um $RunAt Uhr" -ForegroundColor Gray
Write-Host ""

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -DaysInterval $IntervalDays `
    -At $RunAt

$settings = New-ScheduledTaskSettingsSet `
    -RunOnlyIfNetworkAvailable `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# Bestehenden Task erst entfernen
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Prueft alle $IntervalDays Tage ob das Claude Code Setup Kit aktuell ist." `
    -Force | Out-Null

Write-Host "  [OK] Scheduled Task registriert: '$TaskName'" -ForegroundColor Green
Write-Host ""
Write-Host "  Naechste Ausfuehrung: $(($trigger).StartBoundary)" -ForegroundColor DarkGray
Write-Host "  Manuell testen:       .\check-updates-auto.ps1" -ForegroundColor DarkGray
Write-Host "  Task entfernen:       .\schedule-updates.ps1 -Remove" -ForegroundColor DarkGray
Write-Host ""
