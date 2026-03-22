# Claude Code Setup Kit — Automatischer Update-Check (nicht-interaktiv)
# ============================================================
# Wird vom Windows Task Scheduler alle 2 Tage aufgerufen.
# Prueft still ob Updates vorhanden sind.
# Schreibt Benachrichtigung nach ~/.claude/update-notification.txt
# falls ein Update verfuegbar ist.
#
# Direkt ausfuehren zum Testen:
#   powershell -File "C:\tools\claude-code-skript\check-updates-auto.ps1"
# ============================================================

$ClaudeDir       = "$env:USERPROFILE\.claude"
$SetupConfigFile = "$ClaudeDir\setup-kit.json"
$NotificationFile = "$ClaudeDir\update-notification.txt"
$ScriptDir       = Split-Path -Parent $MyInvocation.MyCommand.Path

# setup-kit.json muss existieren
if (-not (Test-Path $SetupConfigFile)) { exit 0 }

$config = Get-Content $SetupConfigFile -Raw | ConvertFrom-Json
if (-not $config.sourceRepoUrl) { exit 0 }

# Letzten Check-Zeitpunkt pruefen — nicht oefter als alle 2 Tage laufen
if ($config.lastUpdateCheck) {
    $daysSince = ((Get-Date) - [datetime]$config.lastUpdateCheck).Days
    if ($daysSince -lt 2) { exit 0 }
}

# Stilles git fetch
git -C $ScriptDir fetch origin 2>$null | Out-Null

# Hashes vergleichen
$remoteHash = git -C $ScriptDir rev-parse "origin/HEAD" 2>$null
if (-not $remoteHash) {
    $remoteHash = git -C $ScriptDir rev-parse "origin/master" 2>$null
}
$localHash = $config.lastCommitHash

# Letztes Check-Datum aktualisieren (auch wenn kein Update)
$config.lastUpdateCheck = (Get-Date -Format "yyyy-MM-dd")
$config | ConvertTo-Json | Set-Content $SetupConfigFile -Encoding UTF8

# Kein Update verfuegbar
if ($remoteHash -eq $localHash -or -not $remoteHash) {
    # Evtl. alte Notification loeschen
    if (Test-Path $NotificationFile) { Remove-Item $NotificationFile }
    exit 0
}

# Update verfuegbar — Aenderungen ermitteln
$log = git -C $ScriptDir log --oneline "$localHash..$remoteHash" 2>$null

# Notification-Datei schreiben
@"
UPDATE VERFUEGBAR — Claude Code Setup Kit
Datum: $(Get-Date -Format "yyyy-MM-dd HH:mm")
Aktuell: $localHash
Neu:     $remoteHash

Aenderungen:
$log

Einspielen mit:
  cd $ScriptDir
  .\setup.ps1 -CheckUpdates
"@ | Set-Content $NotificationFile -Encoding UTF8
