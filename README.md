# Jan's Claude Code Setup Kit

Portables, personalisertes Claude Code Setup für alle Projekte.

## Inhalt

| Datei | Zweck |
|-------|-------|
| `global-CLAUDE.md` | Globale Anweisungen → `~/.claude/CLAUDE.md` |
| `settings-template.json` | MCP-Server, Hooks, Permissions → `~/.claude/settings.json` |
| `project-templates/sveltekit-CLAUDE.md` | Template für SvelteKit-Projekte |
| `project-templates/generic-CLAUDE.md` | Template für Angular und andere |
| `setup.ps1` | Automatisches Setup-Script (Windows) |

---

## Schnellstart — Neues Setup

```powershell
# Alles auf einmal installieren
.\setup.ps1

# Nur globale CLAUDE.md (ohne Projekt-Template)
.\setup.ps1 -GlobalOnly

# Mit Projekt-Template direkt
.\setup.ps1 -ProjectName "mein-projekt" -ProjectType sveltekit -ProjectPath "C:\coding\mein-projekt"
```

---

## Manuelles Setup

### 1. Globale Claude-Anweisungen
```powershell
Copy-Item global-CLAUDE.md ~\.claude\CLAUDE.md
```

### 2. Settings
```powershell
Copy-Item settings-template.json ~\.claude\settings.json
# Dann in settings.json alle [PLATZHALTER] ersetzen:
# - [DEIN_GITHUB_PAT]
# - [DEIN_SUPABASE_ACCESS_TOKEN]
# - [DEIN_21ST_DEV_API_KEY]
```

### 3. Projekt-Template
```powershell
# In neues Projekt-Verzeichnis
Copy-Item project-templates\sveltekit-CLAUDE.md C:\coding\mein-projekt\CLAUDE.md
# Dann alle [PLATZHALTER] in CLAUDE.md ausfüllen
```

---

## Existierendes Setup erweitern

Wenn ein Projekt bereits eine `CLAUDE.md` hat:

1. Template öffnen als Referenz
2. Fehlende Sektionen (Testing, Security, Business Context) in bestehende `CLAUDE.md` einfügen
3. Globale `CLAUDE.md` enthält bereits alle Basis-Regeln — nur Projekt-Spezifika ergänzen

---

## Empfohlene Skills (bereits installiert ✓ / noch nicht ✗)

### Hoch-Priorität
- ✓ `svelte5-best-practices` — Svelte 5 Patterns
- ✓ `typescript-best-practices` — TypeScript strict
- ✓ `vitest` — Unit Testing
- ✓ `owasp-security-check` — Security Audits
- ✓ `git-commits` — Conventional Commits
- ✓ `security-review` — Pre-Deploy Security

### Mittlere Priorität
- ✓ `database-migrations` — DB Migrations
- ✓ `supabase-database` — Supabase CRUD
- ✓ `accessibility-a11y` — WCAG/A11y
- ✓ `performance-audit` — Lighthouse/Web Vitals
- ✓ `gdpr-dsgvo-expert` — DSGVO Compliance

### Niedrige Priorität
- ✓ `logging-best-practices` — Structured Logging
- ✓ `context7-mcp` — Library Docs

---

## MCP-Server Übersicht

| Server | Zweck | Setup |
|--------|-------|-------|
| `context7` | Docs für Libraries | npx, kein API-Key |
| `playwright` | Browser + E2E Testing | npx, kein API-Key |
| `github` | GitHub Issues/PRs | Docker + PAT |
| `supabase` | DB direkt abfragen | npx + Access Token |
| `magic` | UI Komponenten generieren | npx + 21st.dev Key |
| `shadcn` | shadcn/ui Komponenten | npx, kein API-Key |
| `docker` | Container Management | npx, kein API-Key |
| `sentry` | Error Tracking | npx, kein API-Key |
| `memory` | Cross-Session Memory | npx, kein API-Key |

---

## Workflow-Übersicht

```
Neues Feature
    │
    ▼
git checkout develop
git checkout -b feature/[name]
    │
    ▼
Entwickeln (max. 300 Zeilen/Commit)
    + Tests schreiben
    │
    ▼
git push -u origin feature/[name]
    │
    ▼
Pull Request → Code Review
    │
    ▼
Merge → develop
Branch löschen
    │
    ▼ (Release)
Pre-Release Checklist:
  npm audit + Tests + Security Check
    │
    ▼
release/v[X.Y.Z] Branch
    │
    ▼
Merge → main
git tag v[X.Y.Z]
```

---

## Dieses Setup aktualisieren

```powershell
cd C:\coding\perfekt-agent
git pull    # neueste Version holen
.\setup.ps1 -Force    # neu installieren (Backups werden erstellt)
```

---

## Für andere Projekte (Angular, etc.) anpassen

1. `project-templates/generic-CLAUDE.md` kopieren
2. Stack-spezifische Sektionen anpassen (Test-Commands, Dateistruktur)
3. In `setup.ps1` als neuer `-ProjectType` eintragen (optional)
