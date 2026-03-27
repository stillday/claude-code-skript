# Perfektes Claude Code Setup — Gesamtplan
> Status: IN ARBEIT — Antworten von Jan eingearbeitet (2026-03-21)

---

## ÜBERSICHT

Das Setup besteht aus 5 Säulen:

```
┌──────────────────────────────────────────────────────────────────┐
│  1. MULTI-AGENT TEAM       │  2. PROJECT SETUP WIZARD            │
│  Spezialisierte Agents     │  Interaktiver Projekt-Start          │
├────────────────────────────┼─────────────────────────────────────┤
│  3. VERSIONIERUNGSSYSTEM   │  4. MCP + SKILLS MATRIX             │
│  CalVer YYYY.MMDD.NNNN     │  Automatisch pro Projekttyp          │
├────────────────────────────┴─────────────────────────────────────┤
│  5. WISSEN & GEDÄCHTNIS                                          │
│  ADRs, Failed Approaches, Memory-Renewal, Task-Lifecycle         │
└──────────────────────────────────────────────────────────────────┘
```

---

## SÄULE 1: MULTI-AGENT TEAM

### Entscheidungen
- **UXD + SFE zusammengelegt** → ein Agent: `FE` (Frontend + Design + Animationen)
- **Animationen:** CSS-first — kein extra JS, Svelte-native transitions, CSS @keyframes
- **Issue Tracking:** GitHub (PAT vorhanden)
- **Design:** Freies Design, kein Figma
- **Deployment:** spielbar.gilneas.at

### Agent-Roster (final)

#### 🎯 PM — Project Manager (Orchestrator)
```
Rolle:    Koordiniert alle Agents, verwaltet Tasks, erneuert Memories
Tools:    Agent (spawn), TaskCreate/Update/List, Bash (git)
Triggers: /feature, /review, /pre-release, /hotfix, /new-project
Pflichten:
  - Feature-Breakdown → Tasks
  - Richtigen Agents spawnen
  - Nach Abschluss: abgearbeitete Tasks aus Dateien entfernen/markieren
  - Memories nach größeren Änderungen erneuern
  - Code-Entscheidungen im ADR dokumentieren lassen
```

#### 🔧 BE — Senior Backend Engineer
```
Rolle:    API-Design, Business-Logik, Server-Side, Performance
Skills:   typescript-best-practices, supabase-database, database-migrations,
          logging-best-practices
Pflichten:
  - Services + API Routes implementieren
  - Server-Side Validierung
  - Performance (Queries, Caching)
  - Entscheidungen dokumentieren (warum dieser Ansatz?)
  - Fehlgeschlagene Ansätze in ADR festhalten
```

#### 🎨 FE — Senior Frontend + UI/UX + Design
```
Rolle:    UI-Implementierung, Design-Qualität, kein 08/15, Animationen
Skills:   svelte5-best-practices, sveltekit-svelte5-tailwind-skill,
          typescript-best-practices, composable-svelte-testing,
          accessibility-a11y, web-performance-seo
MCPs:     magic (21st.dev), shadcn
Animations-Stack (CSS-first):
  - Svelte native: transition:, animate:, in:/out: directives
  - CSS @keyframes + animation properties
  - CSS Scroll-driven Animations (animation-timeline: scroll())
  - CSS View Transitions API (nativ, kein JS)
  - Tailwind Animate Plugin (CSS-based)
  - SCSS/CSS custom keyframe libraries (Animista-Style)
  - JavaScript-Animations NUR wenn CSS nicht ausreicht + explizit besprochen
Design-Prinzipien:
  - Kein 08/15 — immer visuelle Hierarchie, Kontrast, Rhythm
  - Design System: Farben, Typography, Spacing konsistent
  - Dark/Light Mode von Anfang an
  - Mobile-first, responsive
  - Micro-Interactions und Feedback-States
```

#### 🔒 SEC — Security Expert
```
Rolle:    OWASP Top 10, Auth, Input-Validierung, DB-Security, Secrets
Skills:   owasp-security-check, security-review, security-auditor,
          gdpr-dsgvo-expert
Triggers: Vor jedem Merge, vor Version-Bump, bei Auth-Änderungen
```

#### 🛡️ DSGVO — DSGVO/GDPR Expert
```
Rolle:    Datenschutz, Compliance, Cookie-Consent, Löschkonzepte
Skills:   gdpr-dsgvo-expert
Triggers: Neue Nutzerdaten, Drittanbieter-Integration, vor Release
```

#### 🗄️ DBA — Database Architect
```
Rolle:    Schema, RLS, Migrations, Performance, Backups
Skills:   supabase-database, database-migrations, database-backup-restore
MCPs:     supabase
```

#### 🧪 QA — Quality Assurance
```
Rolle:    Tests schreiben, Business-Logic-Coverage, E2E-Flows
Skills:   vitest, composable-svelte-testing
MCPs:     playwright
Pflichten:
  - Unit Tests für alle Services (100% Business-Logic)
  - E2E für alle kritischen User-Flows
  - Edge Cases + Error Cases
```

#### ⚡ PERF — Performance Engineer
```
Rolle:    Web Vitals, Bundle, Queries, Caching
Skills:   performance-audit, web-performance-seo
Triggers: Vor Release, nach größeren Änderungen
```

---

## SÄULE 2: PROJECT SETUP WIZARD

### Wizard-Flow (/new-project)

```
[01] BASICS
     Name, Beschreibung, GitHub Repo URL (auto: Repo erstellen)

[02] FRONTEND
     Framework: SvelteKit* / Angular / React / Vue / anderes
     CSS:       Tailwind v4* / Tailwind v3 / CSS Modules / SCSS / firmen-eigenes
     UI-Libs:   shadcn* / DaisyUI / Melt UI / keine

[03] BACKEND + DB
     Backend:  SvelteKit API Routes* / NestJS / Express / .NET / Serverless
     DB:       Supabase* / Neon / MongoDB / SQLite / keine

[04] ZUSATZ-TOOLS (Mehrfachauswahl)
     Diagramme:  Chart.js / D3 / Recharts / keine
     Auth:       Supabase Auth* / Lucia / Better Auth
     Payments:   Stripe / keine
     Email:      Resend / keine
     Analytics:  Plausible / keine  (KEIN Google Analytics — DSGVO!)
     Monitoring: Sentry / keine
     Realtime:   Supabase Realtime / Pusher / keine
     Icons:      Lucide* / Heroicons / Phosphor

[05] DEPLOYMENT
     Ziel:   spielbar.gilneas.at* / Vercel / Netlify / anderes
     CI/CD:  GitHub Actions* / manuell

[06] VERSIONIERUNG
     Schema: CalVer YYYY.MMDD.NNNN* / SemVer / beides

[07] AGENT TEAM
     Immer:    PM, BE, FE, QA, SEC
     Optional: DSGVO (öff. App mit Nutzerdaten), DBA (komplexes Schema),
               PERF (performance-kritisch)

[WIZARD GENERIERT:]
  ✓ CLAUDE.md (ausgefüllt mit allen Antworten)
  ✓ .claude/agents/ mit aktivierten Agents
  ✓ GitHub Repo + develop Branch + Branch Protection
  ✓ package.json mit gewähltem Stack
  ✓ CI GitHub Actions (Tests + Lint + Version Bump)
  ✓ .env.example mit allen Variablen
  ✓ VERSION + VERSION.counter (Counter-Start: random 1000–1999)
  ✓ docs/adr/ Ordner für Architecture Decision Records
  ✓ docs/failed-approaches.md leer initialisiert
  ✓ Erster Commit: "chore: initial project setup [v2026.MMDD.NNNN]"
```

---

## SÄULE 3: VERSIONIERUNGSSYSTEM

### Format: CalVer + Sequential Build Counter

```
YYYY.MMDD.NNNN[N]

2026.0321.1847   ← Build 1 am 21.03.2026
2026.0321.1848   ← Build 2 selber Tag
2026.0322.1849   ← Nächster Tag (Counter NIE zurücksetzen)
2027.0101.2502   ← Neues Jahr, Counter läuft weiter
2027.0815.9999   ← Letzter 4-stelliger
2027.0816.10000  ← Ab hier automatisch 5-stellig
```

### Storage
```
VERSION          → "2026.0321.1847"   (aktuelle Version)
VERSION.counter  → "1847"             (nur Counter)
```

### bump-version Script
```bash
#!/bin/bash
HEUTE=$(date +%Y.%m%d)
COUNTER=$(( $(cat VERSION.counter) + 1 ))
VERSION="$HEUTE.$COUNTER"
echo "$VERSION" > VERSION
echo "$COUNTER" > VERSION.counter
# package.json updaten
node -e "const p=require('./package.json'); p.version='$VERSION'; \
         require('fs').writeFileSync('package.json', JSON.stringify(p,null,2))"
echo "Version: $VERSION"
```

### GitHub Action (auto bei Push auf main)
```yaml
- name: Bump Version
  run: |
    bash scripts/bump-version.sh
    git config user.name "github-actions"
    git config user.email "actions@github.com"
    git add VERSION VERSION.counter package.json
    git commit -m "chore: bump version to $(cat VERSION)"
    git tag "v$(cat VERSION)"
    git push && git push --tags
```

---

## SÄULE 4: MCP + SKILLS MATRIX

### Immer aktiv (alle Projekte)
| Tool | Typ | Zweck |
|------|-----|-------|
| `context7` | MCP | Library-Docs (kein Halluzinieren) |
| `playwright` | MCP | E2E Tests |
| `github` | MCP | Repos, Issues, PRs |
| `memory` | MCP | Cross-Session Kontext |
| `git-commits` | Skill | Conventional Commits |
| `typescript-best-practices` | Skill | Strict TypeScript |
| `owasp-security-check` | Skill | Security |
| `security-review` | Skill | Pre-Deploy |
| `vitest` | Skill | Unit Tests |
| `logging-best-practices` | Skill | Strukturiertes Logging |

### Bedingt aktiv (nach Wizard-Auswahl)
| Bedingung | Aktiviert |
|-----------|-----------|
| SvelteKit | `svelte5-best-practices`, `sveltekit-svelte5-tailwind-skill`, `composable-svelte-testing` |
| Tailwind | `tailwind-css` |
| Supabase | `supabase` MCP, `supabase-database`, `database-migrations` |
| DSGVO Agent | `gdpr-dsgvo-expert` |
| PERF Agent | `performance-audit`, `web-performance-seo` |
| Öff. Frontend | `magic` MCP, `shadcn` MCP, `accessibility-a11y` |
| Backups nötig | `database-backup-restore` |

### Zu evaluieren (fehlt noch)
| Tool | Typ | Für was | Prio |
|------|-----|---------|------|
| Chart.js Skill | Skill | Diagramme (Chart.js Integration) | HOCH |
| CSS Animations Skill | Skill | @keyframes, Scroll-driven, View Transitions | HOCH |
| Sentry MCP | MCP | Error Monitoring bereits vorhanden | MITTEL |
| Stripe MCP | MCP | Payments (für Monstis?) | MITTEL |
| Resend/Email Skill | Skill | Transactional Emails | MITTEL |

---

## SÄULE 5: WISSEN & GEDÄCHTNIS

> Das ist Jan's Kernpunkt: Kein Wissen verlieren, keine Fehler zweimal machen.

### 5.1 Architecture Decision Records (ADRs)

**Wo:** `docs/adr/` im Projekt-Root
**Wann:** Bei JEDER nicht-offensichtlichen Entscheidung
**Format:**

```markdown
# ADR-001: [Entscheidungstitel]
Datum: YYYY-MM-DD
Status: Akzeptiert / Abgelehnt / Überholt von ADR-XXX

## Kontext
[Warum musste diese Entscheidung getroffen werden?]

## Optionen bewertet
1. [Option A] — Vorteile: ... Nachteile: ...
2. [Option B] — Vorteile: ... Nachteile: ...

## Entscheidung
[Was wurde gewählt und WARUM]

## Konsequenzen
[Was bedeutet das für die weitere Entwicklung?]
```

**Regel:** Wenn ein Agent Code schreibt der von einer Standardlösung abweicht
→ ADR anlegen. PM-Agent ist verantwortlich dafür.

### 5.2 Failed Approaches (KRITISCH)

**Wo:** `docs/failed-approaches.md` im Projekt-Root
**Zweck:** Verhindert dass derselbe Ansatz zweimal versucht wird
**Format:**

```markdown
## [Datum] — [Was wurde versucht]

**Problem:** [Was sollte gelöst werden]
**Versuchter Ansatz:** [Was wurde probiert]
**Warum fehlgeschlagen:** [Genaue Ursache]
**Symptome:** [Wie erkennt man das Problem wieder]
**Richtige Lösung:** [Was stattdessen funktioniert hat]
**Nicht wieder tun:** [Klare Handlungsanweisung]
```

**Regel:** Jeder Agent der einen Ansatz verwirft → sofort dokumentieren.
PM-Agent prüft diese Datei vor jeder neuen Implementierung.

### 5.3 Memory-Renewal Protokoll

**Wann wird Memory erneuert:**
- Nach jedem abgeschlossenen Feature
- Nach Refactoring das die Architektur ändert
- Wenn eine Entscheidung aus dem Memory überholt ist
- Nach Pre-Release / Version-Bump
- Wenn eine Failed-Approach Datei aktualisiert wird

**Was wird erneuert:**
- `~/.claude/projects/[projekt]/memory/` Dateien
- Globale Memory-Dateien wenn sich Jan's Stack ändert
- ADRs die "Überholt" werden → Status aktualisieren

**PM-Agent Pflicht:** Nach jeder Session mit größeren Änderungen:
→ Checken ob Memory noch aktuell ist → falls nicht: updaten

### 5.4 Task-Lifecycle (TODOs sterben ordentlich)

**Grundregel:** Ein TODO das erledigt ist, VERSCHWINDET. Nicht kommentieren, nicht durchstreichen — weg.

**In CLAUDE.md / Docs:**
```markdown
## Bekannte TODOs
- [ ] [TODO 1] — offen
- [ ] [TODO 2] — offen
# KEIN "- [x] [TODO] — erledigt" → einfach löschen
```

**In Code:**
```typescript
// TODO: [Beschreibung] → Issue #42
// Wenn erledigt: Kommentar komplett entfernen
```

**In GitHub Issues:**
- Issue öffnen → bearbeiten → schließen (nicht "in progress" forever)
- PM-Agent: nach jedem Feature abgeschlossene Issues schließen

**PM-Agent Pflicht nach jedem Task:**
1. Task in `CLAUDE.md` Bekannte TODOs entfernen (falls drin)
2. GitHub Issue schließen
3. Kein "- [x] erledigt" stehen lassen → sauber löschen

---

## PROJECT DISCOVERY (Phase 0 — vor allem anderen)

Bevor ein Agent-Team gewählt wird, läuft der PM durch 8 Fragen:

| # | Frage | Zweck |
|---|-------|-------|
| 1 | Kernidee in 2-3 Sätzen | Scope verstehen |
| 2 | Wer ist die Zielgruppe? | UX-Anforderungen |
| 3 | 3 Must-Have Features | Agent-Team-Größe |
| 4 | Kommerziell / intern / hobby? | DSGVO, Skalierung |
| 5 | Sensitive Daten? (Auth, Payments, Health) | SEC + DSGVO Agent |
| 6 | Erwartete User-Zahlen | PERF Agent, DB-Design |
| 7 | Externe APIs / Integrationen? | DBA, extra Agents |
| 8 | Bekannte Risiken? | Failed Approaches prüfen |

→ PM schlägt Team vor → Jan bestätigt → Wizard läuft weiter

---

## PARALLELE SUB-AGENT ARCHITEKTUR

### Modell: Haupt-Agent + parallele Sub-Agents in Worktrees

```
Jan's Terminal
    │
    └── PM Agent (Haupt-Orchestrator)
            │
            ├── git worktree: feature/[name]-be ──→ BE Sub-Agent
            ├── git worktree: feature/[name]-fe ──→ FE Sub-Agent
            └── git worktree: feature/[name]-qa ──→ QA Sub-Agent
                        │ (alle drei parallel)
            PM wartet → reviewed → merged → SEC drüber
```

### Wann parallel / wann sequentiell

```
SEQUENTIELL (muss vorher fertig sein):
  DBA → BE         (Schema steht bevor Services gebaut werden)
  BE  → FE         (API-Typen definiert bevor UI konsumiert)
  BE+FE → QA E2E   (App muss laufen für E2E)
  alles → SEC      (Check nach Implementierung)

PARALLEL (gleichzeitig):
  BE + FE + QA-Unit    (wenn Interfaces klar definiert)
  SEC + PERF + DSGVO   (unabhängige Review-Checks)
```

### Sub-Agent Task-Brief (PM gibt immer mit)
```
TASK:        [Präzise was zu tun ist]
BRANCH:      feature/[name]-[kürzel]
KONTEXT:     [Relevante CLAUDE.md-Abschnitte]
INTERFACES:  [TypeScript Typen / API-Contracts]
CONSTRAINTS: max 300 Zeilen/Commit, Conventional Commits, Tests, keine Secrets
OUTPUT:      [Branch-Name + was geliefert werden soll]
```

---

## MULTI-AGENT FLOWS (vollautomatisch)

### /feature [name]
```
PM → Tasks aufteilen
   → DBA (Schema?)
   → BE (Services + API)
   → FE (UI + Design + CSS Animations)
   → QA (Tests schreiben)
   → SEC (Security Check)
   → ADR anlegen wenn nötig
   → TODOs aus Liste entfernen
   → Memory updaten
```

### /review-pr [nummer]
```
PM → SEC (Security Check)
   → QA (Test Coverage)
   → PERF (Performance Impact)
   → FE (Accessibility + Design)
   → PR Kommentar mit Zusammenfassung
```

### /pre-release
```
PM → SEC (npm audit + OWASP)
   → QA (alle Tests)
   → PERF (Lighthouse)
   → DSGVO (falls aktiv)
   → DBA (Migrations prüfen)
   → bump-version.sh ausführen
   → Release-Branch erstellen
   → Memory vollständig erneuern
   → Offene TODOs prüfen + aufräumen
```

### /hotfix [beschreibung]
```
PM → hotfix/[name] von main
   → BE/FE Fix implementieren
   → SEC Quick Check
   → QA Regression Tests
   → Failed Approach dokumentieren (falls Ursache bekannt)
   → bump-version
   → main + develop mergen
```

---

## ERLEDIGTE PUNKTE

- [x] tailwindcss-animations Skill installiert (1.1K installs) ✓
- [x] data-visualizer Skill installiert (359 installs, Chart.js + D3) ✓
- [x] skill-creator Plugin installiert (Anthropic official) ✓
- [x] agent-sdk-dev Plugin installiert (Anthropic official) ✓
- [x] context7: sowohl als MCP (server) als auch als Skill verfügbar ✓
- [x] Agent-Dateien erstellt: pm, be, fe, qa, sec, dba, dsgvo, perf ✓
- [x] ADR-Template in project-templates/docs/adr/ ✓
- [x] failed-approaches.md Template ✓
- [x] global-CLAUDE.md mit Wissen & Gedächtnis + Starterpaket erweitert ✓

## ERLEDIGTE PUNKTE (Update 2026-03-22 #2)

- [x] PM-Agent: Discovery-Phase (8 Fragen) + parallele Sub-Agent-Architektur ✓
- [x] BE/FE/QA-Agents: Sub-Agent-Modus mit Worktree-Kontext ✓
- [x] project-brief.md Template ✓
- [x] Parallele vs. sequentielle Flows dokumentiert ✓
- [x] Sub-Agent Onboarding — Erklärung beim ersten Mal ✓
- [x] Phase 0b: automatische Skill-Suche nach Discovery ✓
  - Mapping: Discovery-Antworten → Skill-Suchen
  - Pflicht-Skills immer prüfen + installieren
  - Framework-Skills automatisch je nach Stack

## ERLEDIGTE PUNKTE (Update 2026-03-22 #3)

- [x] scripts/bump-version-calver.sh ✓
- [x] scripts/bump-version-semver.sh ✓
- [x] scripts/init-version.sh ✓
- [x] .github/workflows/bump-version-calver.yml ✓
- [x] .github/workflows/bump-version-semver.yml ✓
- [x] .gitlab/bump-version-calver.yml ✓
- [x] .gitlab/bump-version-semver.yml ✓
- [x] PM-Agent: Git-Provider-Frage (GitHub / GitLab Cloud / GitLab Self-Hosted) ✓
- [x] PM-Agent: Token-Anleitung mit Rechte-Abfrage (GitHub Classic PAT + GitLab PAT) ✓
- [x] PM-Agent: Versionierungsfrage (SemVer vs CalVer mit Erklärung) ✓
- [x] Discovery jetzt 10 Fragen (9=Git-Provider, 10=Versionierung) ✓

## ERLEDIGTE PUNKTE (Update 2026-03-22 #4)

- [x] PM-Agent: Neu vs. Bestehend Erkennung (Schritt 0) ✓
- [x] PM-Agent: Vollständige Bestehende-Projekt-Analyse ✓
  - Phase A: Sprachen, Frameworks, Struktur, Config erkennen
  - Phase B: context7 für erkannte Frameworks nutzen
  - Phase C: Skills Gap Analysis mit find-skills
  - Phase D: Strukturierter Bericht mit Empfehlungen
  - Phase E: Auf Wunsch nachrüsten (Tests, CI/CD, CLAUDE.md, Skills)

## ERLEDIGTE PUNKTE (Update 2026-03-22 #5)

- [x] Angular Pflicht-Skills installiert (analogjs — offizielles Angular-Team) ✓
  - angular-component (5.5K), angular-signals (4K), angular-forms (3.4K)
  - angular-routing (3.4K), angular-http (3.3K), angular-testing (2.9K)
  - angular-migration (3.2K)
- [x] Resend E-Mail Skills installiert (resend-skills, email-best-practices — 3.9K) ✓
- [x] PM-Agent: Skills+MCP Matrix mit Framework-Pflicht-Skills ✓
  - Universal Pflicht (jedes Projekt, sofort)
  - SvelteKit Pflicht (sofort bei Erkennung)
  - Angular Pflicht (sofort bei Erkennung)
  - Feature-basierte Skills (nach Discovery-Antworten)
  - MCP-Vorschläge mit Suche + bekannte npm MCP-Server
  - Präsentations-Format für Jan

## ERLEDIGTE PUNKTE (Update 2026-03-22 #6)

- [x] Frontend Pflicht-Skills installiert (8 von Jan + 5 zusätzliche gefunden) ✓
  - vercel-react-best-practices, web-design-guidelines
  - frontend-design (Anthropic + pbakaus + claude-code)
  - agent-browser, seo-audit, ui-ux-pro-max
  - design-system-patterns (5.2K), micro-interactions, animation-micro-interaction-pack
  - tailwindcss-responsive-darkmode, mager/frontend-design
- [x] PM-Agent: Frontend-Pflicht-Skills in SvelteKit + Angular Matrix eingebaut ✓
- [x] Gesamt: 53 Skills installiert ✓

## ERLEDIGTE PUNKTE (Update 2026-03-22 #7)

- [x] setup.ps1 vollstaendig neu geschrieben ✓
  - NEU vs. BESTEHEND Erkennung: .git vorhanden? → entsprechender Modus
  - Neues Projekt: vollstaendiger Wizard (Typ, Provider, Versioning, Agents)
  - Bestehendes Projekt: Analyse was fehlt, einzeln nachruestbar
  - Agent-Dateien-Kopier-Logik (alle 8 Agents, optionale abfragbar)
  - Frisches git init fuer neue Projekte (Setup-Script-.git wird NICHT uebertragen)
  - Update-Check-System: Setup-Quelle in ~/.claude/setup-kit.json gespeichert
  - .\setup.ps1 -CheckUpdates prueft automatisch auf neue Commits
  - Token-Anleitungen eingebaut: GitHub Classic PAT + GitLab PAT
  - GitLab Self-Hosted URL-Abfrage integriert
  - Aus beliebigem Verzeichnis ausfuehrbar (ScriptDir-relativ)
- [x] GitHub Repo eingerichtet: https://github.com/stillday/claude-code-skript.git ✓

## ERLEDIGTE PUNKTE (Update 2026-03-27 — GSD-Integration)

- [x] GSD-Konzepte analysiert und adaptiert (get-shit-done, 43k Stars) ✓
- [x] PM-Agent: formale Planungsphase mit Wave-Modell (PLAN.md mit XML-Tasks) ✓
- [x] PM-Agent: Context Budget Monitoring (Stopp bei <= 35%) ✓
- [x] PM-Agent: Anti-Loop Regeln in Sub-Agent Task-Briefs ✓
- [x] PM-Agent: Deviation-Handling (was Agents auto-fixen dürfen) ✓
- [x] PM-Agent: neue Commands /plan-phase, /execute-phase, /resume-phase, /verify-work, /ship ✓
- [x] PM-Agent: STATE.md für Resumability nach Kontext-Verlust ✓
- [x] Templates: PLAN-template.md + STATE-template.md in project-templates/docs/.planning/ ✓
- [x] global-CLAUDE.md: Context Budget + Anti-Loop + formale Planung dokumentiert ✓
- [x] setup.ps1: .planning/ Ordner-Erstellung bei neuem Projekt ✓

## OFFENE PUNKTE (noch zu erledigen)

- [ ] GitLab MCP testen/konfigurieren (Self-Hosted URL-Support)
- [ ] PM-Agent: /discover Slash-Command dokumentieren (in global-CLAUDE.md)
