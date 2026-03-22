# [PROJEKT-NAME] — CLAUDE.md

> Universelles Template für Angular und andere Projekte.
> Kopiere als `CLAUDE.md` ins Projekt-Root und passe an.
> Globale Regeln gelten aus `~/.claude/CLAUDE.md`.

---

## Projekt-Überblick

- **Name:** [PROJEKT-NAME]
- **Beschreibung:** [WAS MACHT DIESE APP?]
- **Framework:** [Angular 17+ / React / Vue / anderes]
- **Backend:** [NestJS / Express / .NET / anderes]
- **Datenbank:** [PostgreSQL / MySQL / MongoDB / anderes]
- **Git Repo:** [URL]
- **Live URL:** [URL]
- **Team:** [Solo / Team-Name / Firma]

---

## Business Context

### Zielgruppe
[Wer nutzt das? Interne Mitarbeiter / Endkunden / B2B?]

### Kernfunktionen
- [FUNKTION 1]
- [FUNKTION 2]

### Kritische User-Flows (NIEMALS broken)
1. [FLOW 1]
2. [FLOW 2]

### Business Rules
- [REGEL 1 — wichtige Geschäftslogik]
- [REGEL 2]

---

## Stack & Architektur

### Tech-Stack
```
Frontend:  [Framework + Version]
Backend:   [Framework + Version]
DB:        [Datenbank + ORM]
Auth:      [Auth-Lösung]
Hosting:   [Cloud/Server]
CI/CD:     [GitHub Actions / GitLab CI / anderes]
```

### Wichtige Architektur-Entscheidungen
- [ENTSCHEIDUNG 1 — z.B. "Monorepo mit Nx weil..."]
- [ENTSCHEIDUNG 2]

---

## Development Setup

```bash
# Dependencies
npm install      # oder: yarn / pnpm / pip install / composer install

# Konfiguration
cp .env.example .env

# Development starten
npm run dev      # oder projektspezifischer Befehl

# Build
npm run build

# Tests
npm test
```

### Umgebungsvariablen
```env
[VAR_1]=         # [Beschreibung]
[VAR_2]=
```

---

## Testing

```bash
npm test                  # Unit Tests
npm run test:coverage     # Mit Coverage
npm run test:e2e          # E2E Tests
```

### Pflicht-Tests für Business Logic
- [ ] [SERVICE/MODUL 1] — alle Use Cases
- [ ] [SERVICE/MODUL 2]
- [ ] [KRITISCHER FLOW] — E2E

### Framework-spezifische Hinweise
```
# Angular
ng test                   # Unit Tests (Karma/Jasmine)
ng e2e                    # E2E (Playwright/Cypress)

# NestJS
npm run test              # Unit Tests (Jest)
npm run test:e2e          # Integration Tests
```

---

## Coding-Konventionen (Projekt-spezifisch)

> Ergänzend zu den globalen Regeln

- [KONVENTION 1 — z.B. "Services immer injectable, kein new"]
- [KONVENTION 2 — z.B. "Alle API-Calls über HttpClient-Wrapper"]
- [KONVENTION 3]

### Dateistruktur
```
[PROJEKTSTRUKTUR EINFÜGEN]
```

---

## API-Dokumentation

| Endpoint | Methode | Auth | Beschreibung |
|----------|---------|------|--------------|
| `/api/v1/[route]` | GET | Bearer | [Beschreibung] |

---

## Deployment

```bash
# Build + Deploy
[DEPLOY BEFEHL]
```

### Pre-Deploy Checklist
- [ ] Alle Tests grün
- [ ] `npm audit` — keine kritischen Issues
- [ ] Environment Variables gesetzt
- [ ] DB-Migrations angewendet

---

## Bekannte Einschränkungen & TODOs

- [ ] [TODO 1]
- [ ] [TODO 2]

### Bekannte Bugs
- [BUG BESCHREIBUNG — Status: offen/in Arbeit]
