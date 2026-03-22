# Claude Code Setup Script
# ============================================================
# Portables Setup-Kit fuer jeden User, jedes Projekt.
# Das Script liegt in einem eigenen Ordner und wird von dort
# fuer beliebige Projekte ausgefuehrt.
#
# NUTZUNG:
#   Nur globales Setup:     .\setup.ps1 -GlobalOnly
#   Neues Projekt:          .\setup.ps1
#   Bestehendes Projekt:    .\setup.ps1 -ProjectPath "C:\coding\mein-projekt"
#   Mit Parametern:         .\setup.ps1 -UserName "Anna" -ProjectName "app" -Force
#   Update-Check:           .\setup.ps1 -CheckUpdates
# ============================================================

param(
    [string]$UserName    = "",
    [string]$ProjectName = "",
    [string]$ProjectType = "",    # sveltekit | generic
    [string]$ProjectPath = "",
    [string]$GitProvider = "",    # github | gitlab-cloud | gitlab-self | none
    [string]$Versioning  = "",    # calver | semver
    [switch]$GlobalOnly  = $false,
    [switch]$Force       = $false,
    [switch]$CheckUpdates = $false
)

$ScriptDir       = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir       = "$env:USERPROFILE\.claude"
$TemplateDir     = "$ScriptDir\project-templates"
$SetupConfigFile = "$ClaudeDir\setup-kit.json"

# ============================================================
# UPDATE-CHECK SYSTEM
# ============================================================

function Get-SetupSourceUrl {
    $url = git -C $ScriptDir remote get-url origin 2>$null
    return $url
}

function Save-SetupConfig {
    param([string]$RepoUrl)
    $hash = git -C $ScriptDir rev-parse HEAD 2>$null
    $config = @{
        sourceRepoUrl   = $RepoUrl
        lastCommitHash  = if ($hash) { $hash } else { "" }
        lastUpdateCheck = (Get-Date -Format "yyyy-MM-dd")
    }
    if (-not (Test-Path $ClaudeDir)) { New-Item -ItemType Directory -Path $ClaudeDir -Force | Out-Null }
    $config | ConvertTo-Json | Set-Content $SetupConfigFile -Encoding UTF8
}

function Invoke-UpdateCheck {
    if (-not (Test-Path $SetupConfigFile)) {
        Write-Host "  Kein setup-kit.json gefunden. Bitte Setup einmal ausfuehren." -ForegroundColor Yellow
        return
    }
    $config = Get-Content $SetupConfigFile -Raw | ConvertFrom-Json
    if (-not $config.sourceRepoUrl) {
        Write-Host "  Keine Update-Quelle konfiguriert." -ForegroundColor Yellow
        return
    }

    Write-Host "`n--- Update-Check ---" -ForegroundColor Cyan
    Write-Host "  Quelle: $($config.sourceRepoUrl)" -ForegroundColor DarkGray

    git -C $ScriptDir fetch origin 2>&1 | Out-Null
    $remoteHash = git -C $ScriptDir rev-parse "origin/HEAD" 2>$null
    if (-not $remoteHash) {
        $remoteHash = git -C $ScriptDir rev-parse "origin/main" 2>$null
    }
    $localHash = $config.lastCommitHash

    if (-not $remoteHash) {
        Write-Host "  Remote nicht erreichbar. Pruefe Netzwerk oder Token." -ForegroundColor Yellow
        return
    }

    if ($remoteHash -eq $localHash) {
        Write-Host "  Aktuell. Kein Update noetig." -ForegroundColor Green
        $config.lastUpdateCheck = (Get-Date -Format "yyyy-MM-dd")
        $config | ConvertTo-Json | Set-Content $SetupConfigFile -Encoding UTF8
        return
    }

    Write-Host "  *** UPDATE VERFUEGBAR ***" -ForegroundColor Yellow
    $log = git -C $ScriptDir log --oneline "$localHash..$remoteHash" 2>$null
    if ($log) {
        Write-Host "`n  Neue Commits:" -ForegroundColor White
        $log -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }

    $answer = Read-Host "`n  Update jetzt einspielen? (j/N)"
    if ($answer -eq "j" -or $answer -eq "J") {
        git -C $ScriptDir pull origin HEAD 2>&1 | Out-Null
        $newHash = git -C $ScriptDir rev-parse HEAD 2>$null
        $config.lastCommitHash  = $newHash
        $config.lastUpdateCheck = (Get-Date -Format "yyyy-MM-dd")
        $config | ConvertTo-Json | Set-Content $SetupConfigFile -Encoding UTF8
        Write-Host "  Update eingespielt! Bitte Setup neu starten." -ForegroundColor Green
        exit 0
    }
    Write-Host "  Update uebersprungen." -ForegroundColor DarkGray
}

function Show-UpdateHint {
    if (-not (Test-Path $SetupConfigFile)) { return }
    $config = Get-Content $SetupConfigFile -Raw | ConvertFrom-Json
    if ($config.lastUpdateCheck) {
        $days = ((Get-Date) - [datetime]$config.lastUpdateCheck).Days
        if ($days -ge 7) {
            Write-Host "  TIPP: Letzter Update-Check vor $days Tagen. Starte: .\setup.ps1 -CheckUpdates" -ForegroundColor Yellow
        }
    }
}

# Nur Update-Check
if ($CheckUpdates) { Invoke-UpdateCheck; Write-Host ""; exit 0 }

# ============================================================
# HILFSFUNKTIONEN
# ============================================================

function Ask-User {
    param([string]$Prompt, [string]$Default = "")
    $display = if ($Default) { "$Prompt [$Default]" } else { $Prompt }
    $input = Read-Host $display
    if (-not $input -and $Default) { return $Default }
    return $input
}

function Ask-YesNo {
    param([string]$Prompt)
    $input = Read-Host $Prompt
    return ($input -eq "j" -or $input -eq "J")
}

function Replace-Placeholders {
    param(
        [string]$FilePath,
        [string]$Name         = "",
        [string]$ProjName     = "",
        [string]$ProjProvider = "",
        [string]$ProjVer      = ""
    )
    if (-not (Test-Path $FilePath)) { return }
    $c = Get-Content $FilePath -Raw
    if ($Name)         { $c = $c -replace '\[USER\]',         $Name }
    if ($ProjName)     { $c = $c -replace '\[PROJEKT-NAME\]', $ProjName }
    if ($ProjProvider) { $c = $c -replace '\[GIT-PROVIDER\]', $ProjProvider }
    if ($ProjVer)      { $c = $c -replace '\[VERSIONIERUNG\]',$ProjVer }
    Set-Content $FilePath $c -NoNewline -Encoding UTF8
}

function Show-Status {
    param([string]$Label, [bool]$Exists, [string]$Extra = "")
    $icon  = if ($Exists) { "[OK]" } else { "[  ]" }
    $color = if ($Exists) { "Green" } else { "Yellow" }
    $line  = "  $icon $Label"
    if ($Extra) { $line += " ($Extra)" }
    Write-Host $line -ForegroundColor $color
}

# ============================================================
# USERNAME
# ============================================================

if (-not $UserName) {
    Write-Host "`n=== Claude Code Setup ===" -ForegroundColor Cyan
    $UserName = Ask-User "Dein Name (wird in alle Templates eingesetzt)" "User"
}

Write-Host "`n=== Claude Code Setup fuer: $UserName ===" -ForegroundColor Cyan

# Setup-Source speichern
$sourceUrl = Get-SetupSourceUrl
if ($sourceUrl) {
    Save-SetupConfig -RepoUrl $sourceUrl
    Write-Host "  Update-Quelle: $sourceUrl" -ForegroundColor DarkGray
} else {
    Write-Host "  Kein Git-Remote gefunden - Auto-Updates nicht moeglich." -ForegroundColor DarkGray
}
Show-UpdateHint

# ============================================================
# 1. GLOBAL CLAUDE.MD
# ============================================================

function Install-GlobalClaudeMd {
    $source = "$ScriptDir\global-CLAUDE.md"
    $target = "$ClaudeDir\CLAUDE.md"

    if (-not (Test-Path $source)) {
        Write-Host "  FEHLER: global-CLAUDE.md nicht gefunden in: $ScriptDir" -ForegroundColor Red
        return
    }
    if ((Test-Path $target) -and -not $Force) {
        if (-not (Ask-YesNo "~/.claude/CLAUDE.md existiert. Ueberschreiben? (j/N)")) {
            Write-Host "  Uebersprungen." -ForegroundColor Yellow; return
        }
        $backup = "$ClaudeDir\CLAUDE.md.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $target $backup
        Write-Host "  Backup: $backup" -ForegroundColor DarkGray
    }
    Copy-Item $source $target -Force
    Replace-Placeholders -FilePath $target -Name $UserName
    Write-Host "  ~/.claude/CLAUDE.md installiert (User: $UserName)" -ForegroundColor Green
}

# ============================================================
# 2. SETTINGS
# ============================================================

function Check-Settings {
    $f = "$ClaudeDir\settings.json"
    if (-not (Test-Path $f)) {
        Write-Host "  HINWEIS: settings.json fehlt." -ForegroundColor Yellow
        Write-Host "           Kopiere settings-template.json nach ~/.claude/settings.json" -ForegroundColor Yellow
        Write-Host "           und ersetze alle [PLATZHALTER]." -ForegroundColor Yellow
    } else {
        Write-Host "  settings.json vorhanden (unveraendert)." -ForegroundColor DarkGray
    }
}

# ============================================================
# 3. SKILL-STATUS
# ============================================================

function Show-SkillsInfo {
    Write-Host "`n--- Empfohlene Skills ---" -ForegroundColor Cyan
    $installed = Get-ChildItem "$ClaudeDir\skills" -Directory -ErrorAction SilentlyContinue |
                 Select-Object -ExpandProperty Name

    $skills = @(
        @{ Name="svelte5-best-practices";          Cat="Stack";       Prio="HOCH" },
        @{ Name="sveltekit-svelte5-tailwind-skill"; Cat="Stack";      Prio="HOCH" },
        @{ Name="typescript-best-practices";        Cat="Stack";      Prio="HOCH" },
        @{ Name="vitest";                           Cat="Testing";    Prio="HOCH" },
        @{ Name="owasp-security-check";             Cat="Security";   Prio="HOCH" },
        @{ Name="security-review";                  Cat="Security";   Prio="HOCH" },
        @{ Name="git-commits";                      Cat="Workflow";   Prio="HOCH" },
        @{ Name="commit-guardian";                  Cat="Workflow";   Prio="HOCH" },
        @{ Name="adr-writer";                       Cat="Docs";       Prio="HOCH" },
        @{ Name="database-migrations";              Cat="Datenbank";  Prio="MITTEL" },
        @{ Name="supabase-database";                Cat="Datenbank";  Prio="MITTEL" },
        @{ Name="accessibility-a11y";               Cat="UI/UX";      Prio="MITTEL" },
        @{ Name="performance-audit";                Cat="Perf";       Prio="MITTEL" },
        @{ Name="gdpr-dsgvo-expert";                Cat="Legal";      Prio="MITTEL" },
        @{ Name="svelte-css-animations";            Cat="Animations"; Prio="MITTEL" },
        @{ Name="logging-best-practices";           Cat="Monitoring"; Prio="NIEDRIG" },
        @{ Name="context7-mcp";                     Cat="Docs";       Prio="NIEDRIG" }
    )
    foreach ($s in $skills) {
        $ok    = $installed -contains $s.Name
        $icon  = if ($ok) { "[OK]" } else { "[  ]" }
        $color = if ($ok) { "Green" } elseif ($s.Prio -eq "HOCH") { "Red" } else { "Yellow" }
        Write-Host "  $icon $($s.Prio.PadRight(8)) $($s.Cat.PadRight(12)) $($s.Name)" -ForegroundColor $color
    }
    Write-Host "`n  Fehlende Skills: /find-skills [name]" -ForegroundColor DarkGray
}

# ============================================================
# 4A. NEUES PROJEKT EINRICHTEN
# ============================================================

function Install-NewProject {
    param([string]$Path, [string]$Name, [string]$Type, [string]$Provider, [string]$Ver)

    # Optionale Agents abfragen
    Write-Host "`nOptionale Agents (PM, BE, FE, QA, SEC sind immer aktiv):" -ForegroundColor White
    $wantDsgvo = Ask-YesNo "  DSGVO-Agent? (oeffentliche App mit Nutzerdaten) (j/N)"
    $wantDba   = Ask-YesNo "  DBA-Agent?   (komplexes Datenbankschema) (j/N)"
    $wantPerf  = Ask-YesNo "  PERF-Agent?  (performance-kritische App) (j/N)"

    Write-Host "`n--- Erstelle Projekt: $Name [$Type, $Provider, $Ver] ---" -ForegroundColor Cyan

    # CLAUDE.md
    $tmpl   = if ($Type -eq "sveltekit") { "sveltekit-CLAUDE.md" } else { "generic-CLAUDE.md" }
    $target = "$Path\CLAUDE.md"
    Copy-Item "$TemplateDir\$tmpl" $target -Force
    Replace-Placeholders -FilePath $target -Name $UserName -ProjName $Name -ProjProvider $Provider -ProjVer $Ver
    Write-Host "  [OK] CLAUDE.md" -ForegroundColor Green

    # Agents
    New-Item -ItemType Directory -Path "$Path\.claude\agents" -Force | Out-Null
    $src = "$TemplateDir\.claude\agents"
    foreach ($a in @("pm.md","be.md","fe.md","qa.md","sec.md")) {
        Copy-Item "$src\$a" "$Path\.claude\agents\$a" -Force
        Replace-Placeholders -FilePath "$Path\.claude\agents\$a" -Name $UserName -ProjName $Name
    }
    $extras = @()
    if ($wantDsgvo) { Copy-Item "$src\dsgvo.md" "$Path\.claude\agents\dsgvo.md" -Force; Replace-Placeholders "$Path\.claude\agents\dsgvo.md" -Name $UserName; $extras += "DSGVO" }
    if ($wantDba)   { Copy-Item "$src\dba.md"   "$Path\.claude\agents\dba.md"   -Force; Replace-Placeholders "$Path\.claude\agents\dba.md"   -Name $UserName; $extras += "DBA" }
    if ($wantPerf)  { Copy-Item "$src\perf.md"  "$Path\.claude\agents\perf.md"  -Force; Replace-Placeholders "$Path\.claude\agents\perf.md"  -Name $UserName; $extras += "PERF" }
    $agentList = "PM, BE, FE, QA, SEC" + (if ($extras.Count -gt 0) { ", " + ($extras -join ", ") } else { "" })
    Write-Host "  [OK] Agents: $agentList" -ForegroundColor Green

    # Docs
    New-Item -ItemType Directory -Path "$Path\docs\adr" -Force | Out-Null
    Copy-Item "$TemplateDir\docs\adr\ADR-000-template.md" "$Path\docs\adr\ADR-000-template.md" -Force
    Replace-Placeholders "$Path\docs\adr\ADR-000-template.md" -Name $UserName
    Copy-Item "$TemplateDir\docs\failed-approaches.md" "$Path\docs\failed-approaches.md" -Force
    Copy-Item "$TemplateDir\docs\project-brief.md"     "$Path\docs\project-brief.md"     -Force
    Replace-Placeholders "$Path\docs\project-brief.md" -Name $UserName -ProjName $Name
    Write-Host "  [OK] Docs: docs/adr/, failed-approaches.md, project-brief.md" -ForegroundColor Green

    # Scripts
    New-Item -ItemType Directory -Path "$Path\scripts" -Force | Out-Null
    $bumpSrc = if ($Ver -eq "calver") { "bump-version-calver.sh" } else { "bump-version-semver.sh" }
    Copy-Item "$TemplateDir\scripts\$bumpSrc"          "$Path\scripts\bump-version.sh"  -Force
    Copy-Item "$TemplateDir\scripts\init-version.sh"   "$Path\scripts\init-version.sh"  -Force
    Write-Host "  [OK] Scripts: bump-version.sh, init-version.sh" -ForegroundColor Green

    # CI/CD + Token-Anleitung
    Install-CiCd -Path $Path -Provider $Provider -Ver $Ver

    # VERSION
    $vFile = "$Path\VERSION"
    $cFile = "$Path\VERSION.counter"
    if ($Ver -eq "calver") {
        $counter = Get-Random -Minimum 1000 -Maximum 2000
        $today   = Get-Date -Format "yyyy.MMdd"
        "$today.$counter" | Set-Content $vFile -NoNewline
        "$counter"        | Set-Content $cFile -NoNewline
        Write-Host "  [OK] VERSION: $today.$counter (CalVer, Counter: $counter)" -ForegroundColor Green
    } else {
        "0.1.0" | Set-Content $vFile -NoNewline
        Write-Host "  [OK] VERSION: 0.1.0 (SemVer)" -ForegroundColor Green
    }

    # .gitignore
    Install-Gitignore -Path $Path

    # Git initialisieren (frisches Repo - NICHT das Setup-Script-Repo)
    $initVersion = Get-Content $vFile -Raw
    Write-Host "`n  Initialisiere frisches Git-Repo..." -ForegroundColor White
    git -C $Path init -b main 2>&1 | Out-Null
    git -C $Path add -A 2>&1 | Out-Null
    git -C $Path -c "user.name=$UserName" -c "user.email=setup@local" `
        commit -m "chore: initial project setup [v$initVersion]" 2>&1 | Out-Null
    Write-Host "  [OK] Git: main-Branch, erster Commit 'chore: initial project setup [v$initVersion]'" -ForegroundColor Green

    if ($Provider -ne "none") {
        Write-Host "  NAECHSTER SCHRITT: Remote verbinden" -ForegroundColor Yellow
        Write-Host "  git remote add origin <repo-url> && git push -u origin main" -ForegroundColor Yellow
    }

    # Setup-Quelle in CLAUDE.md vermerken
    if ($sourceUrl) {
        Add-Content "$Path\CLAUDE.md" "`n`n---`n`n> Setup-Kit: $sourceUrl`n> Installation: $(Get-Date -Format 'yyyy-MM-dd')`n"
    }
}

# ============================================================
# 4B. BESTEHENDES PROJEKT ERWEITERN
# ============================================================

function Update-ExistingProject {
    param([string]$Path, [string]$Name, [string]$Type, [string]$Provider, [string]$Ver)

    Write-Host "`n--- Analyse: $Name (bestehendes Projekt) ---" -ForegroundColor Cyan

    # Was ist bereits vorhanden?
    $hasClaude   = Test-Path "$Path\CLAUDE.md"
    $hasAgents   = Test-Path "$Path\.claude\agents"
    $hasDocs     = Test-Path "$Path\docs\adr"
    $hasScripts  = Test-Path "$Path\scripts\bump-version.sh"
    $hasVersion  = Test-Path "$Path\VERSION"
    $hasCi       = (Test-Path "$Path\.github\workflows") -or (Test-Path "$Path\.gitlab-ci.yml")
    $hasGitignore = Test-Path "$Path\.gitignore"

    Write-Host ""
    Show-Status "CLAUDE.md"             $hasClaude
    Show-Status "Agents (.claude/agents/)" $hasAgents
    Show-Status "Docs (docs/adr/ etc.)" $hasDocs
    Show-Status "Scripts (bump-version)" $hasScripts
    Show-Status "VERSION Datei"         $hasVersion
    Show-Status "CI/CD Workflow"        $hasCi
    Write-Host ""

    $addedItems = @()

    # CLAUDE.md
    if (-not $hasClaude -or $Force) {
        if ($hasClaude) {
            $do = Ask-YesNo "  CLAUDE.md ersetzen? (j/N)"
        } else {
            $do = Ask-YesNo "  CLAUDE.md hinzufuegen? (j/N)"
        }
        if ($do) {
            $tmpl = if ($Type -eq "sveltekit") { "sveltekit-CLAUDE.md" } else { "generic-CLAUDE.md" }
            if ($hasClaude) {
                $bk = "$Path\CLAUDE.md.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                Copy-Item "$Path\CLAUDE.md" $bk
                Write-Host "  Backup: $bk" -ForegroundColor DarkGray
            }
            Copy-Item "$TemplateDir\$tmpl" "$Path\CLAUDE.md" -Force
            Replace-Placeholders "$Path\CLAUDE.md" -Name $UserName -ProjName $Name -ProjProvider $Provider -ProjVer $Ver
            Write-Host "  [OK] CLAUDE.md" -ForegroundColor Green
            $addedItems += "CLAUDE.md"
        }
    }

    # Agents
    if (-not $hasAgents -or $Force) {
        $do = Ask-YesNo "  Agent-Dateien hinzufuegen (.claude/agents/)? (j/N)"
        if ($do) {
            New-Item -ItemType Directory -Path "$Path\.claude\agents" -Force | Out-Null
            $src = "$TemplateDir\.claude\agents"
            foreach ($a in @("pm.md","be.md","fe.md","qa.md","sec.md")) {
                Copy-Item "$src\$a" "$Path\.claude\agents\$a" -Force
                Replace-Placeholders "$Path\.claude\agents\$a" -Name $UserName -ProjName $Name
            }
            Write-Host "  [OK] Agents: PM, BE, FE, QA, SEC" -ForegroundColor Green
            Write-Host "  Optionale Agents:" -ForegroundColor DarkGray
            if (Ask-YesNo "    DSGVO-Agent? (j/N)") {
                Copy-Item "$src\dsgvo.md" "$Path\.claude\agents\dsgvo.md" -Force
                Replace-Placeholders "$Path\.claude\agents\dsgvo.md" -Name $UserName
                Write-Host "  [OK] Agent: DSGVO" -ForegroundColor Green
            }
            if (Ask-YesNo "    DBA-Agent? (j/N)") {
                Copy-Item "$src\dba.md" "$Path\.claude\agents\dba.md" -Force
                Replace-Placeholders "$Path\.claude\agents\dba.md" -Name $UserName
                Write-Host "  [OK] Agent: DBA" -ForegroundColor Green
            }
            if (Ask-YesNo "    PERF-Agent? (j/N)") {
                Copy-Item "$src\perf.md" "$Path\.claude\agents\perf.md" -Force
                Replace-Placeholders "$Path\.claude\agents\perf.md" -Name $UserName
                Write-Host "  [OK] Agent: PERF" -ForegroundColor Green
            }
            $addedItems += ".claude/agents/"
        }
    }

    # Docs
    if (-not $hasDocs) {
        if (Ask-YesNo "  Docs-Struktur hinzufuegen (docs/adr/, failed-approaches.md)? (j/N)") {
            New-Item -ItemType Directory -Path "$Path\docs\adr" -Force | Out-Null
            Copy-Item "$TemplateDir\docs\adr\ADR-000-template.md" "$Path\docs\adr\ADR-000-template.md" -Force
            Replace-Placeholders "$Path\docs\adr\ADR-000-template.md" -Name $UserName
            if (-not (Test-Path "$Path\docs\failed-approaches.md")) {
                Copy-Item "$TemplateDir\docs\failed-approaches.md" "$Path\docs\failed-approaches.md" -Force
            }
            if (-not (Test-Path "$Path\docs\project-brief.md")) {
                Copy-Item "$TemplateDir\docs\project-brief.md" "$Path\docs\project-brief.md" -Force
                Replace-Placeholders "$Path\docs\project-brief.md" -Name $UserName -ProjName $Name
            }
            Write-Host "  [OK] Docs: docs/adr/, failed-approaches.md, project-brief.md" -ForegroundColor Green
            $addedItems += "docs/"
        }
    }

    # Scripts + VERSION
    if (-not $hasScripts) {
        if (Ask-YesNo "  Versionierungs-Scripts hinzufuegen? (j/N)") {
            if (-not $Ver) {
                Write-Host "  Versionierung: 1) calver  2) semver" -ForegroundColor Gray
                $vi = Ask-User "Auswahl [1]" "1"
                $Ver = if ($vi -eq "2") { "semver" } else { "calver" }
            }
            New-Item -ItemType Directory -Path "$Path\scripts" -Force | Out-Null
            $bumpSrc = if ($Ver -eq "calver") { "bump-version-calver.sh" } else { "bump-version-semver.sh" }
            Copy-Item "$TemplateDir\scripts\$bumpSrc"        "$Path\scripts\bump-version.sh" -Force
            Copy-Item "$TemplateDir\scripts\init-version.sh" "$Path\scripts\init-version.sh" -Force
            Write-Host "  [OK] Scripts: bump-version.sh, init-version.sh" -ForegroundColor Green
            $addedItems += "scripts/"

            if (-not $hasVersion) {
                $vFile = "$Path\VERSION"
                if ($Ver -eq "calver") {
                    $counter = Get-Random -Minimum 1000 -Maximum 2000
                    "$( Get-Date -Format 'yyyy.MMdd').$counter" | Set-Content $vFile -NoNewline
                    "$counter" | Set-Content "$Path\VERSION.counter" -NoNewline
                    Write-Host "  [OK] VERSION: $(Get-Content $vFile -Raw) (CalVer)" -ForegroundColor Green
                } else {
                    "0.1.0" | Set-Content $vFile -NoNewline
                    Write-Host "  [OK] VERSION: 0.1.0 (SemVer)" -ForegroundColor Green
                }
                $addedItems += "VERSION"
            }
        }
    }

    # CI/CD
    if (-not $hasCi) {
        if (Ask-YesNo "  CI/CD Workflow hinzufuegen? (j/N)") {
            if (-not $Provider) {
                Write-Host "  Git-Provider: 1) github  2) gitlab-cloud  3) gitlab-self  4) none" -ForegroundColor Gray
                $pi = Ask-User "Auswahl [1]" "1"
                $Provider = switch ($pi) { "2" { "gitlab-cloud" } "3" { "gitlab-self" } "4" { "none" } default { "github" } }
            }
            if (-not $Ver) {
                $vFile = "$Path\VERSION"
                $Ver = if ((Test-Path $vFile) -and ((Get-Content $vFile -Raw) -match '^\d{4}\.')) { "calver" } else { "semver" }
            }
            Install-CiCd -Path $Path -Provider $Provider -Ver $Ver
            $addedItems += "CI/CD"
        }
    }

    # .gitignore
    if (-not $hasGitignore) {
        if (Ask-YesNo "  .gitignore erstellen? (j/N)") {
            Install-Gitignore -Path $Path
            $addedItems += ".gitignore"
        }
    }

    # Hinzugefuegtes committen?
    if ($addedItems.Count -gt 0) {
        Write-Host ""
        $itemList = $addedItems -join ", "
        if (Ask-YesNo "  Neues in Git committen? ($itemList) (j/N)") {
            git -C $Path add -A 2>&1 | Out-Null
            git -C $Path -c "user.name=$UserName" -c "user.email=setup@local" `
                commit -m "chore: add claude-code setup ($itemList)" 2>&1 | Out-Null
            Write-Host "  [OK] Commit erstellt" -ForegroundColor Green
        }
    } else {
        Write-Host "  Nichts hinzugefuegt." -ForegroundColor DarkGray
    }
}

# ============================================================
# HELPERS (CI/CD + .gitignore)
# ============================================================

function Install-CiCd {
    param([string]$Path, [string]$Provider, [string]$Ver)
    if ($Provider -eq "github") {
        New-Item -ItemType Directory -Path "$Path\.github\workflows" -Force | Out-Null
        $wf = if ($Ver -eq "calver") { "bump-version-calver.yml" } else { "bump-version-semver.yml" }
        Copy-Item "$TemplateDir\.github\workflows\$wf" "$Path\.github\workflows\bump-version.yml" -Force
        Write-Host "  [OK] GitHub Actions: .github/workflows/bump-version.yml" -ForegroundColor Green
        Write-Host ""
        Write-Host "  === GitHub Personal Access Token (Classic) ===" -ForegroundColor Yellow
        Write-Host "  1. github.com > Profil > Settings > Developer settings > Personal access tokens > Tokens (classic)" -ForegroundColor White
        Write-Host "  2. 'Generate new token (classic)' klicken" -ForegroundColor White
        Write-Host "  3. Rechte aktivieren:" -ForegroundColor White
        Write-Host "     [x] repo           (alle Sub-Checkboxen)" -ForegroundColor White
        Write-Host "     [x] workflow        (GitHub Actions)" -ForegroundColor White
        Write-Host "     [x] write:packages  (optional, fuer Packages)" -ForegroundColor White
        Write-Host "  4. Token kopieren (wird nur einmal gezeigt!)" -ForegroundColor White
        Write-Host "  5. Repo > Settings > Secrets and variables > Actions > New secret" -ForegroundColor White
        Write-Host "     Name: GH_PAT   |   Value: <dein token>" -ForegroundColor White
        Write-Host ""
        Write-Host "  Damit kann Claude Code: Repos erstellen, CI/CD konfigurieren," -ForegroundColor DarkGray
        Write-Host "  Branches schieben, Secrets hinterlegen, Issues verwalten." -ForegroundColor DarkGray
    }
    elseif ($Provider -eq "gitlab-cloud" -or $Provider -eq "gitlab-self") {
        $wf = if ($Ver -eq "calver") { "bump-version-calver.yml" } else { "bump-version-semver.yml" }
        Copy-Item "$TemplateDir\.gitlab\$wf" "$Path\.gitlab-ci.yml" -Force
        if ($Provider -eq "gitlab-self") {
            $gitlabUrl = Ask-User "  Self-Hosted GitLab URL (z.B. https://gitlab.meinefirma.de)" ""
            if ($gitlabUrl) {
                (Get-Content "$Path\.gitlab-ci.yml" -Raw) -replace 'https://gitlab\.com', $gitlabUrl |
                    Set-Content "$Path\.gitlab-ci.yml" -NoNewline
            }
        }
        Write-Host "  [OK] GitLab CI: .gitlab-ci.yml" -ForegroundColor Green
        Write-Host ""
        Write-Host "  === GitLab Personal Access Token ===" -ForegroundColor Yellow
        Write-Host "  1. GitLab > Profil (oben rechts) > Edit profile > Access Tokens" -ForegroundColor White
        Write-Host "  2. 'Add new token' klicken" -ForegroundColor White
        Write-Host "  3. Rechte aktivieren:" -ForegroundColor White
        Write-Host "     [x] api              (vollstaendiger API-Zugriff)" -ForegroundColor White
        Write-Host "     [x] read_repository  (Repo lesen)" -ForegroundColor White
        Write-Host "     [x] write_repository (Commits pushen)" -ForegroundColor White
        Write-Host "  4. Token kopieren" -ForegroundColor White
        Write-Host "  5. Repo > Settings > CI/CD > Variables > Add variable" -ForegroundColor White
        Write-Host "     Key: CI_BUMP_TOKEN   |   Value: <dein token>   |   [x] Masked" -ForegroundColor White
        Write-Host ""
        Write-Host "  Damit kann Claude Code: Commits pushen, Tags setzen, Pipelines ausfuehren." -ForegroundColor DarkGray
    }
}

function Install-Gitignore {
    param([string]$Path)
    if (Test-Path "$Path\.gitignore") { return }
    @"
# Environment - niemals einchecken!
.env
.env.local
.env.*.local

# Node / Build
node_modules/
.svelte-kit/
build/
dist/
.output/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*
"@ | Set-Content "$Path\.gitignore" -Encoding UTF8
    Write-Host "  [OK] .gitignore erstellt" -ForegroundColor Green
}

# ============================================================
# 5. PROJEKT-WIZARD EINSTIEG
# ============================================================

function Start-ProjectWizard {
    param([string]$Name, [string]$Type, [string]$Path, [string]$Provider, [string]$Ver)

    # Pfad klaeren
    if (-not $Path) {
        $Path = Read-Host "`nProjekt-Pfad (z.B. C:\coding\mein-projekt)"
    }
    if (-not (Test-Path $Path)) {
        if (Ask-YesNo "  Ordner '$Path' erstellen? (j/N)") {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
            Write-Host "  Ordner erstellt." -ForegroundColor Green
        } else { return }
    }

    # Name
    $defaultName = Split-Path -Leaf $Path
    if (-not $Name) { $Name = Ask-User "Projekt-Name" $defaultName }

    # Neues Projekt oder bestehendes?
    $isExisting = Test-Path "$Path\.git"

    if ($isExisting) {
        Write-Host "`n  Git-Repo vorhanden - Modus: Bestehendes Projekt erweitern" -ForegroundColor Cyan
        # Typ erkennen oder fragen
        if (-not $Type) {
            $hasSvelte = (Test-Path "$Path\svelte.config.*") -or (Test-Path "$Path\src\app.html")
            $Type = if ($hasSvelte) { "sveltekit" } else { "generic" }
            Write-Host "  Erkannter Typ: $Type" -ForegroundColor DarkGray
        }
        Update-ExistingProject -Path $Path -Name $Name -Type $Type -Provider $Provider -Ver $Ver
    } else {
        Write-Host "`n  Kein Git-Repo - Modus: Neues Projekt erstellen" -ForegroundColor Cyan

        # Alle Wizard-Fragen fuer neues Projekt
        if (-not $Type) {
            Write-Host "`nProjekttyp:" -ForegroundColor White
            Write-Host "  1) sveltekit  (SvelteKit + Svelte 5 + Tailwind)" -ForegroundColor Gray
            Write-Host "  2) generic    (Beliebiges Projekt)" -ForegroundColor Gray
            $t = Ask-User "Auswahl" "1"
            $Type = if ($t -eq "2") { "generic" } else { "sveltekit" }
        }
        if (-not $Provider) {
            Write-Host "`nGit-Provider:" -ForegroundColor White
            Write-Host "  1) github         2) gitlab-cloud   3) gitlab-self   4) none" -ForegroundColor Gray
            $p = Ask-User "Auswahl" "1"
            $Provider = switch ($p) { "2" {"gitlab-cloud"} "3" {"gitlab-self"} "4" {"none"} default {"github"} }
        }
        if (-not $Ver) {
            Write-Host "`nVersionierung:" -ForegroundColor White
            Write-Host "  1) calver   (2026.0321.1847 - Datum + Counter, vollautomatisch)" -ForegroundColor Gray
            Write-Host "  2) semver   (1.2.3 - Major.Minor.Patch, manuell)" -ForegroundColor Gray
            $v = Ask-User "Auswahl" "1"
            $Ver = if ($v -eq "2") { "semver" } else { "calver" }
        }

        Install-NewProject -Path $Path -Name $Name -Type $Type -Provider $Provider -Ver $Ver
    }

    Write-Host "`n=== Projekt '$Name' eingerichtet ===" -ForegroundColor Cyan
    Write-Host "  cd '$Path'" -ForegroundColor White
    Write-Host "  claude" -ForegroundColor White
    Write-Host "  > Im Chat: /discover" -ForegroundColor White
    Write-Host ""
}

# ============================================================
# MAIN
# ============================================================

Write-Host ""
Install-GlobalClaudeMd
Write-Host ""
Check-Settings

if (-not $GlobalOnly) {
    $runWizard = $false
    if ($ProjectPath -or $ProjectName) {
        $runWizard = $true
    } else {
        Write-Host ""
        $runWizard = Ask-YesNo "Projekt einrichten oder erweitern? (j/N)"
    }

    if ($runWizard) {
        Start-ProjectWizard -Name $ProjectName -Type $ProjectType -Path $ProjectPath `
                            -Provider $GitProvider -Ver $Versioning
    }
}

# --- MCPmarket einrichten ---
function Setup-McpMarket {
    # Pruefen ob claude CLI verfuegbar ist
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { return }

    # Pruefen ob mcpmarket bereits konfiguriert ist
    $existing = claude mcp list 2>$null
    if ($existing -match "mcpmarket") {
        Write-Host "  MCPmarket MCP bereits konfiguriert." -ForegroundColor DarkGray
        return
    }

    Write-Host ""
    Write-Host "  MCPmarket.com - MCP-Server per Sprache suchen und installieren" -ForegroundColor White
    Write-Host "  Kein API-Key noetig. Einmal einrichten, dauerhaft nutzen." -ForegroundColor DarkGray
    if (Ask-YesNo "  MCPmarket MCP einrichten? (j/N)") {
        claude mcp add mcpmarket --scope user -- npx -y @mcpmarket/mcp-auto-install connect 2>&1 | Out-Null
        Write-Host "  [OK] MCPmarket MCP eingerichtet." -ForegroundColor Green
        Write-Host "       Nutzung im Chat: 'Suche einen MCP fuer Stripe' oder 'Installiere den Resend MCP'" -ForegroundColor DarkGray
    }
}

Setup-McpMarket

# --- Auto-Update-Check einrichten ---
function Setup-AutoUpdate {
    $scheduleScript = "$ScriptDir\schedule-updates.ps1"
    $checkScript    = "$ScriptDir\check-updates-auto.ps1"

    if (-not (Test-Path $scheduleScript) -or -not (Test-Path $checkScript)) { return }

    $taskExists = Get-ScheduledTask -TaskName "ClaudeCodeSetupKitUpdateCheck" -ErrorAction SilentlyContinue
    if ($taskExists) {
        Write-Host "  Auto-Update-Check bereits aktiv (alle 2 Tage)." -ForegroundColor DarkGray
        return
    }

    Write-Host ""
    if (Ask-YesNo "Automatischen Update-Check einrichten? (alle 2 Tage still im Hintergrund) (j/N)") {
        & $scheduleScript -InstallDir $ScriptDir
    }
}

Setup-AutoUpdate

Write-Host ""
Show-SkillsInfo

Write-Host "`n=== Setup abgeschlossen ===" -ForegroundColor Cyan
Write-Host "  ~/.claude/CLAUDE.md      - Globale Regeln (User: $UserName)" -ForegroundColor White
Write-Host "  ~/.claude/settings.json  - MCPs + Hooks (Platzhalter setzen!)" -ForegroundColor White
if (Test-Path $SetupConfigFile) {
    $cfg = Get-Content $SetupConfigFile -Raw | ConvertFrom-Json
    Write-Host "  ~/.claude/setup-kit.json - Update-Tracking" -ForegroundColor White
    Write-Host "  Updates pruefen: .\setup.ps1 -CheckUpdates" -ForegroundColor DarkGray
}
Write-Host ""
