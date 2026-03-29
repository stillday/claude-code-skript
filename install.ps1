# Claude Code Setup Kit - Bootstrap Installer
# Ausfuehren mit:
#   irm https://raw.githubusercontent.com/stillday/claude-code-skript/master/install.ps1 | iex

$RepoUrl    = "https://github.com/stillday/claude-code-skript.git"
$DefaultDir = "C:\tools\claude-code-skript"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Claude Code Setup Kit - Bootstrap Installer" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# --- Git pruefen ---
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "  FEHLER: Git nicht gefunden." -ForegroundColor Red
    Write-Host "  Installieren: winget install Git.Git" -ForegroundColor Yellow
    exit 1
}
$gitVersion = git --version
Write-Host "  [OK] $gitVersion" -ForegroundColor Green

# --- Claude Code pruefen ---
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    Write-Host "  [OK] Claude Code gefunden" -ForegroundColor Green
} else {
    Write-Host "  [ ] Claude Code nicht gefunden" -ForegroundColor Yellow
    Write-Host "      npm install -g @anthropic/claude-code" -ForegroundColor DarkGray
}

# --- Zielordner ---
Write-Host ""
$inputDir = Read-Host "Installationsordner [$DefaultDir]"

$InstallDir = $DefaultDir
if ($inputDir -ne "") {
    $InstallDir = $inputDir
}

# --- Bereits vorhanden? ---
$gitFolder = Join-Path $InstallDir ".git"
if (Test-Path $gitFolder) {
    Write-Host ""
    Write-Host "  Setup-Kit gefunden in: $InstallDir" -ForegroundColor Yellow
    $update = Read-Host "  Aktualisieren? (j/N)"
    if ($update -eq "j" -or $update -eq "J") {
        git -C $InstallDir pull origin master 2>&1 | Out-Null
        Write-Host "  [OK] Aktualisiert." -ForegroundColor Green
    }
} else {
    $ParentDir = Split-Path -Parent $InstallDir
    if (-not (Test-Path $ParentDir)) {
        New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
    }
    Write-Host ""
    Write-Host "  Klone nach: $InstallDir" -ForegroundColor White
    git clone $RepoUrl $InstallDir 2>&1 | Out-Null

    $setupCheck = Join-Path $InstallDir "setup.ps1"
    if (-not (Test-Path $setupCheck)) {
        Write-Host "  FEHLER: Klonen fehlgeschlagen." -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] Geklont." -ForegroundColor Green
}

# --- Setup starten ---
Write-Host ""
Write-Host "  Starte Setup..." -ForegroundColor Cyan
Write-Host ""

$SetupScript = Join-Path $InstallDir "setup.ps1"
Set-Location $InstallDir
& $SetupScript
