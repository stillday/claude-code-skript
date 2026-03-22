# Claude Code Setup Kit

Portables, personalisierbares Setup-Kit für [Claude Code](https://claude.ai/claude-code). Funktioniert für jeden User und jedes Projekt. Ein Mal klonen, beliebig oft nutzen.

---

## Inhalt

```
claude-code-skript/
├── setup.ps1                          ← Einziges Script das du brauchst
├── global-CLAUDE.md                   ← Wird zu ~/.claude/CLAUDE.md
├── settings-template.json             ← Vorlage für ~/.claude/settings.json
└── project-templates/
    ├── sveltekit-CLAUDE.md            ← CLAUDE.md für SvelteKit-Projekte
    ├── generic-CLAUDE.md              ← CLAUDE.md für andere Projekte
    ├── .claude/
    │   ├── agents/                    ← 8 spezialisierte AI-Agents
    │   │   ├── pm.md                  ← Project Manager (Orchestrator)
    │   │   ├── be.md                  ← Senior Backend Engineer
    │   │   ├── fe.md                  ← Senior Frontend + UI/UX Designer
    │   │   ├── qa.md                  ← Quality Assurance Engineer
    │   │   ├── sec.md                 ← Security Expert
    │   │   ├── dba.md                 ← Database Architect (optional)
    │   │   ├── dsgvo.md               ← DSGVO/GDPR Expert (optional)
    │   │   └── perf.md                ← Performance Engineer (optional)
    │   └── skills/                    ← Custom Skills (ADR, Commits, Design)
    ├── docs/
    │   ├── project-brief.md           ← Projekt-Discovery Vorlage
    │   ├── failed-approaches.md       ← Was nicht funktioniert hat
    │   └── adr/
    │       └── ADR-000-template.md    ← Architecture Decision Records
    ├── scripts/
    │   ├── bump-version-calver.sh     ← CalVer Bump (YYYY.MMDD.NNNN)
    │   ├── bump-version-semver.sh     ← SemVer Bump (1.2.3)
    │   └── init-version.sh            ← Erstmalige VERSION-Initialisierung
    ├── .github/workflows/             ← GitHub Actions für Auto-Versioning
    └── .gitlab/                       ← GitLab CI für Auto-Versioning
```

---

## Voraussetzungen

- **Claude Code** installiert (`npm install -g @anthropic/claude-code` oder [claude.ai/claude-code](https://claude.ai/claude-code))
- **Windows** mit PowerShell 5.1+ (das Script ist `.ps1`)
- **Git** installiert und im PATH
- Optional: GitHub oder GitLab Account für CI/CD

---

## Schritt 1: Setup-Kit klonen

Das Setup-Kit wird in einem **eigenen, dauerhaften Ordner** abgelegt — nicht im Projekt selbst.

```powershell
# Empfohlener Ort — irgendwo ausserhalb deiner Projekte
git clone https://github.com/stillday/claude-code-skript.git C:\tools\claude-code-skript
cd C:\tools\claude-code-skript
```

> Dieser Ordner bleibt dauerhaft bestehen. Von hier aus richtest du neue und bestehende Projekte ein.

---

## Schritt 2: Globales Setup (einmalig pro Gerät)

```powershell
.\setup.ps1
```

Der Wizard fragt:
1. **Deinen Namen** — wird in alle Templates eingesetzt (ersetzt `[USER]`)
2. **Möchtest du gleich ein Projekt einrichten?** — kannst du jetzt tun oder später

Was installiert wird:
- `~/.claude/CLAUDE.md` — deine globalen Claude-Regeln (Git-Workflow, Testing, Security)
- Prüft ob `~/.claude/settings.json` existiert (MCP-Server Konfiguration)

---

## Schritt 3: Neues Projekt einrichten

```powershell
# Interaktiv (empfohlen)
.\setup.ps1 -ProjectPath "C:\coding\mein-neues-projekt"

# Oder mit allen Parametern direkt
.\setup.ps1 `
  -ProjectPath "C:\coding\mein-projekt" `
  -ProjectName "Mein Projekt" `
  -ProjectType sveltekit `
  -GitProvider github `
  -Versioning calver `
  -UserName "Anna"
```

### Was der Wizard fragt (neues Projekt)

| Frage | Optionen | Standard |
|-------|----------|---------|
| Projekttyp | `sveltekit` / `generic` | sveltekit |
| Git-Provider | `github` / `gitlab-cloud` / `gitlab-self` / `none` | github |
| Versionierung | `calver` (automatisch) / `semver` (manuell) | calver |
| DSGVO-Agent? | öffentliche App mit Nutzerdaten | Nein |
| DBA-Agent? | komplexes Datenbankschema | Nein |
| PERF-Agent? | performance-kritische App | Nein |

### Was installiert wird (neues Projekt)

```
dein-projekt/
├── CLAUDE.md                  ← Ausgefülltes Projekt-Template
├── VERSION                    ← Aktuelle Version (z.B. 2026.0322.1247)
├── VERSION.counter            ← CalVer Counter (steigt nie zurück)
├── .gitignore                 ← Standard-Patterns (.env, node_modules, etc.)
├── .claude/
│   └── agents/                ← Dein Agent-Team (5–8 Agents je nach Wahl)
├── docs/
│   ├── project-brief.md       ← Wird beim /discover vom PM ausgefüllt
│   ├── failed-approaches.md   ← Dokumentation gescheiterter Ansätze
│   └── adr/
│       └── ADR-000-template.md ← Vorlage für Architektur-Entscheidungen
├── scripts/
│   ├── bump-version.sh        ← Version bumpen (CalVer oder SemVer)
│   └── init-version.sh        ← Initialisierung
└── .github/workflows/         ← oder .gitlab-ci.yml
    └── bump-version.yml       ← Auto-Versioning bei Push auf main
```

Das Script führt außerdem `git init -b main` durch und erstellt den ersten Commit:
```
chore: initial project setup [v2026.0322.1247]
```

> **Wichtig:** Das neue Projekt bekommt ein **frisches** Git-Repo — die History des Setup-Kits wird nicht übernommen.

---

## Schritt 4: Bestehendes Projekt erweitern

Das Setup-Kit kann auch in vorhandene Projekte integriert werden, ohne sie zu beschädigen.

```powershell
.\setup.ps1 -ProjectPath "C:\coding\mein-vorhandenes-projekt"
```

Das Script erkennt automatisch dass ein `.git`-Ordner existiert und wechselt in den **Erweiterungs-Modus**:

```
--- Analyse: mein-projekt (bestehendes Projekt) ---

  [OK] CLAUDE.md
  [  ] Agents (.claude/agents/)
  [  ] Docs (docs/adr/ etc.)
  [  ] Scripts (bump-version)
  [  ] VERSION Datei
  [  ] CI/CD Workflow

  Agent-Dateien hinzufügen (.claude/agents/)? (j/N)
  Docs-Struktur hinzufügen? (j/N)
  ...
  Neues in Git committen? (j/N)
```

Jeder Baustein wird einzeln gefragt. Vorhandene Dateien werden nicht überschrieben (außer mit `-Force`).

---

## Schritt 5: Git-Token einrichten (für CI/CD)

### GitHub — Classic Personal Access Token

1. [github.com/settings/tokens](https://github.com/settings/tokens) → **Tokens (classic)**
2. **Generate new token (classic)**
3. Folgende Rechte aktivieren:
   - `[x] repo` (alle Sub-Checkboxen — push, status, etc.)
   - `[x] workflow` (GitHub Actions ausführen)
   - `[x] write:packages` (optional, für Packages)
4. Token kopieren (wird nur einmal angezeigt!)
5. Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `GH_PAT`
   - Value: `<dein token>`

Damit kann Claude Code: Repos erstellen, CI/CD konfigurieren, Branches pushen, Secrets hinterlegen, Issues verwalten.

### GitLab — Personal Access Token

1. GitLab → Profil (oben rechts) → **Edit profile** → **Access Tokens**
2. **Add new token**
3. Folgende Rechte aktivieren:
   - `[x] api` — vollständiger API-Zugriff
   - `[x] read_repository` — Repo lesen
   - `[x] write_repository` — Commits pushen
4. Token kopieren
5. Repo → **Settings** → **CI/CD** → **Variables** → **Add variable**
   - Key: `CI_BUMP_TOKEN`
   - Value: `<dein token>`
   - `[x] Masked` aktivieren (Token wird in Logs verborgen)

---

## Schritt 6: MCP-Server einrichten (empfohlen)

Kopiere die Settings-Vorlage und trage deine Tokens ein:

```powershell
Copy-Item settings-template.json "$env:USERPROFILE\.claude\settings.json"
# Dann settings.json öffnen und [PLATZHALTER] ersetzen
```

Benötigte Tokens (je nach genutzten MCPs):

| MCP | Token | Wo erstellen |
|-----|-------|-------------|
| `github` | GitHub PAT | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `supabase` | Supabase Access Token | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `magic` (21st.dev) | API Key | [21st.dev](https://21st.dev) |
| Alle anderen | keiner nötig | — |

---

## Update-Check: Setup-Kit aktuell halten

Das Setup-Kit speichert beim ersten Run die Repo-URL und den aktuellen Commit-Hash in `~/.claude/setup-kit.json`.

```powershell
# Manuell auf Updates prüfen
.\setup.ps1 -CheckUpdates

# Beispiel-Ausgabe wenn Update verfügbar:
#   *** UPDATE VERFÜGBAR ***
#   Neue Commits:
#     a3f1b2c feat: add new agent template
#     9d8e7f6 fix: correct token instructions
#   Update jetzt einspielen? (j/N)
```

- Nach dem Update: Script neu starten, es zeigt die Änderungen
- Kein Update nötig: zeigt "Aktuell." und beendet sich
- Nach 7 Tagen ohne Check: Hinweis beim nächsten `setup.ps1`-Run

---

## Nach dem Setup: Claude Code nutzen

### Projekt starten

```powershell
cd C:\coding\mein-projekt
claude
```

### Verfügbare Commands im Chat

| Command | Was passiert |
|---------|-------------|
| `/discover` | PM-Agent startet Projekt-Discovery (10 Fragen, füllt project-brief.md aus) |
| `/feature [name]` | PM koordiniert BE + FE + QA parallel in Git Worktrees |
| `/review-pr [nummer]` | SEC + QA + PERF reviewen den PR |
| `/pre-release` | Vollständige Release-Checkliste (Tests, Security, Versioning) |
| `/hotfix [beschreibung]` | Schneller Fix direkt von main |

### Wie das Multi-Agent-System funktioniert

Beim ersten Mal erklärt der PM-Agent wie Sub-Agents funktionieren. Kurzversion:

```
Du sprichst mit dem PM-Agent
       │
       ├── BE-Agent  → arbeitet in feature/[name]-be (eigenem Git Worktree)
       ├── FE-Agent  → arbeitet in feature/[name]-fe (eigenem Git Worktree)
       └── QA-Agent  → arbeitet in feature/[name]-qa (eigenem Git Worktree)
              │ (alle drei parallel)
       PM wartet, reviewed, merged → SEC prüft
```

BE und FE können gleichzeitig arbeiten — kein Merge-Konflikt durch separate Worktrees.

---

## Empfohlene Skills installieren

Skills sind Wissenspakete für Claude Code. Das Script zeigt welche fehlen:

```
--- Empfohlene Skills ---
  [OK] HOCH     Stack        svelte5-best-practices
  [  ] HOCH     Stack        typescript-best-practices    ← fehlt (rot)
  [OK] MITTEL   Testing      vitest
  ...
  Fehlende Skills: /find-skills [name]
```

Im Claude-Chat installieren:
```
/find-skills typescript best practices
```

Oder direkt per CLI:
```powershell
npx skills add [skill-name] -g -y
```

**Starterpaket (empfohlen bei Erst-Setup):**
```powershell
# 1. find-skills — Basis für alle weiteren Skills (immer zuerst!)
npx skills add find-skills -g -y

# 2. skill-creator Plugin — eigene Skills erstellen
claude plugin install skill-creator

# 3. agent-sdk-dev Plugin — Agents bauen und verwalten
claude plugin install agent-sdk-dev
```

---

## Versionierungs-System

### CalVer (Standard-Empfehlung)

```
Format: YYYY.MMDD.NNNN[N]

2026.0322.1247   ← Build 1 am 22.03.2026
2026.0322.1248   ← Build 2 selber Tag
2026.0323.1249   ← Nächster Tag (Counter läuft weiter, nie zurück)
2027.0815.9999   ← Letzter 4-stelliger
2027.0816.10000  ← Ab hier automatisch 5-stellig
```

Vollautomatisch: bei jedem Push auf `main` bumpt die GitHub Action die Version.

### SemVer (für Libraries/APIs)

```
Format: MAJOR.MINOR.PATCH

0.1.0  ← Start
0.2.0  ← neues Feature (minor)
1.0.0  ← erster stabiler Release (major)
1.0.1  ← Bug-Fix (patch)
```

Manuell ausgelöst: GitHub Actions → Workflow dispatch → Bump type wählen.

---

## Häufige Fragen

**Kann ich das Setup-Kit für mehrere Projekte nutzen?**
Ja. Das Kit liegt einmal auf deinem Rechner (`C:\tools\claude-code-skript\`) und du rufst `setup.ps1` für jedes Projekt separat auf. Jedes Projekt bekommt sein eigenes frisches Git-Repo.

**Was wenn ich schon eine CLAUDE.md im Projekt habe?**
Das Script fragt bevor es überschreibt und erstellt ein Backup (`CLAUDE.md.backup-YYYYMMDD-HHmmss`).

**Wie funktioniert `-Force`?**
```powershell
.\setup.ps1 -Force -ProjectPath "C:\coding\mein-projekt"
```
Überschreibt alle existierenden Dateien ohne zu fragen. Backups werden trotzdem erstellt.

**Kann ein anderer User das Kit nutzen?**
Ja. Der Platzhalter `[USER]` wird durch den eingegebenen Namen ersetzt. Alle Templates sind user-neutral.

**Unterstützt das Kit auch Linux/macOS?**
Aktuell nur Windows (PowerShell). Die Shell-Scripts in `scripts/` laufen auf allen Plattformen.

---

## Verzeichnisstruktur nach vollständigem Setup

```
~/.claude/
├── CLAUDE.md                  ← Globale Regeln (von global-CLAUDE.md)
├── settings.json              ← MCP-Server + Hooks + Permissions
├── setup-kit.json             ← Update-Tracking (Quelle + letzter Hash)
└── skills/                    ← Installierte Skills (npx skills add ...)

C:\tools\claude-code-skript\   ← Setup-Kit (bleibt dauerhaft)
├── setup.ps1
├── global-CLAUDE.md
├── settings-template.json
└── project-templates/

C:\coding\mein-projekt\        ← Dein Projekt (frisches Git-Repo)
├── CLAUDE.md
├── VERSION
├── .claude/agents/
├── docs/adr/
├── scripts/
└── .github/workflows/
```
