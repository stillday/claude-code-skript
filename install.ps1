# Claude Code Setup Kit — Bootstrap Installer
# ============================================================
# Einmaliger Befehl auf jedem neuen Geraet:
#
#   irm https://raw.githubusercontent.com/stillday/claude-code-skript/master/install.ps1 | iex
#
# Was passiert:
#   1. Prueft ob Git installiert ist
#   2. Fragt wohin das Setup-Kit installiert werden soll
#   3. Klont das Repo
#   4. Startet setup.ps1 automatisch
# ============================================================

$RepoUrl    = "https://github.com/stillday/claude-code-skript.git"
$DefaultDir = "C:\tools\claude-code-skript"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Claude Code Setup Kit — Bootstrap Installer" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# --- Git pruefen ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  FEHLER: Git ist nicht installiert oder nicht im PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Git installieren:" -ForegroundColor White
    Write-Host "    winget install Git.Git" -ForegroundColor Gray
    Write-Host "    oder: https://git-scm.com/download/win" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host "  [OK] Git gefunden: $(git --version)" -ForegroundColor Green

# --- Claude Code pruefen ---
if (Get-Command claude -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] Claude Code gefunden" -ForegroundColor Green
} else {
    Write-Host "  [  ] Claude Code nicht gefunden" -ForegroundColor Yellow
    Write-Host "       Installieren mit: npm install -g @anthropic/claude-code" -ForegroundColor Yellow
    Write-Host "       (Kann auch nach dem Setup-Kit nachgeholt werden)" -ForegroundColor DarkGray
}

# --- Zielordner abfragen ---
Write-Host ""
$inputDir = Read-Host "Installationsordner [$DefaultDir]"
$InstallDir = if ($inputDir) { $inputDir } else { $DefaultDir }

# --- Pruefen ob Ordner schon existiert ---
if (Test-Path "$InstallDir\.git") {
    Write-Host ""
    Write-Host "  Setup-Kit bereits vorhanden in: $InstallDir" -ForegroundColor Yellow
    $update = Read-Host "  Auf neuesten Stand bringen (git pull)? (j/N)"
    if ($update -eq "j" -or $update -eq "J") {
        Write-Host "  Aktualisiere..." -ForegroundColor DarkGray
        git -C $InstallDir pull origin master 2>&1 | Out-Null
        Write-Host "  [OK] Aktualisiert." -ForegroundColor Green
    }
} else {
    # Elternordner erstellen falls noetig
    $ParentDir = Split-Path -Parent $InstallDir
    if (-not (Test-Path $ParentDir)) {
        New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
    }

    Write-Host ""
    Write-Host "  Klone Setup-Kit nach: $InstallDir" -ForegroundColor White
    git clone $RepoUrl $InstallDir 2>&1 | Out-Null

    if (-not (Test-Path "$InstallDir\setup.ps1")) {
        Write-Host "  FEHLER: Klonen fehlgeschlagen." -ForegroundColor Red
        Write-Host "  Pruefe Internetverbindung oder URL: $RepoUrl" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [OK] Geklont." -ForegroundColor Green
}

# --- setup.ps1 ausfuehren ---
Write-Host ""
Write-Host "  Starte Setup..." -ForegroundColor Cyan
Write-Host ""

Set-Location $InstallDir
& "$InstallDir\setup.ps1"
