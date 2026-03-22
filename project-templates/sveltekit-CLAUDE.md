# [PROJEKT-NAME] — CLAUDE.md

> Kopiere diese Datei als `CLAUDE.md` in das Projekt-Root.
> Ersetze alle `[PLATZHALTER]` mit den echten Werten.
> Globale Regeln (Git, Testing, Security) gelten aus `~/.claude/CLAUDE.md`.

---

## Projekt-Überblick

- **Name:** [PROJEKT-NAME]
- **Beschreibung:** [KURZE BESCHREIBUNG — was macht diese App?]
- **Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS v4, Supabase
- **Git Repo:** `git@github.com:farion1231/[REPO-NAME].git`
- **Live URL:** [https://...]
- **Staging URL:** [https://staging...] oder `n/a`
- **Supabase Projekt-Ref:** [z.B. abcdefghijklm]
- **Deployment:** [Vercel / spielbar.gilneas.at / anderes]

---

## Business Context

### Zielgruppe
[Wer nutzt diese App? z.B. "Endkunden die X suchen" / "Interne Mitarbeiter für Y"]

### Kernfunktionen
- [FUNKTION 1 — kurze Beschreibung]
- [FUNKTION 2]
- [FUNKTION 3]

### Kritische User-Flows (NIEMALS broken lassen)
1. [FLOW 1 — z.B. "User kann sich registrieren und einloggen"]
2. [FLOW 2 — z.B. "User kann Zahlung abschließen"]
3. [FLOW 3]

### Business Rules (wichtige Logik die korrekt sein muss)
- [REGEL 1 — z.B. "Ein User kann max. 3 aktive Buchungen haben"]
- [REGEL 2]

---

## Architektur

### Verzeichnisstruktur
```
src/
├── lib/
│   ├── server/              # Server-only Code (NIEMALS im Client)
│   │   ├── db/              # Datenbankzugriff (Supabase Queries)
│   │   └── services/        # Business-Logik
│   ├── components/          # Svelte UI-Komponenten
│   ├── stores/              # Svelte Stores / State
│   └── utils/               # Helper-Funktionen (pure functions)
├── routes/
│   ├── api/                 # API-Endpunkte (+server.ts)
│   ├── (app)/               # Authentifizierte Routen
│   └── (public)/            # Öffentliche Routen
└── app.d.ts                 # TypeScript Typen
```

### Datenbank-Schema (Wichtige Tabellen)
```
[TABELLE 1]: [KURZE BESCHREIBUNG]
[TABELLE 2]: [KURZE BESCHREIBUNG]
```
> Vollständiges Schema: `supabase/migrations/` oder Supabase Dashboard

### Authentication
- [ ] Supabase Auth
- [ ] Email/Password
- [ ] OAuth: [Google / GitHub / ...]
- [ ] RLS aktiviert auf allen Tabellen: JA / NEIN

---

## Development Setup

```bash
# Dependencies installieren
npm install

# .env einrichten (von .env.example kopieren)
cp .env.example .env.local

# Supabase lokal starten (falls genutzt)
npx supabase start

# Development Server
npm run dev
```

### Umgebungsvariablen (.env.local)
```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # NIEMALS im Client verwenden
[WEITERE_VARS]=
```

---

## Testing

### Setup
```bash
# Unit + Integration Tests
npm test

# Tests mit Coverage
npm run test:coverage

# E2E Tests
npm run test:e2e

# E2E mit UI
npm run test:e2e:ui
```

### Business Logic Tests (PFLICHT — diese müssen immer getestet sein)

#### `src/lib/server/services/[SERVICE].ts`
- [ ] [FUNKTION 1] — Happy Path, Edge Cases, Error Cases
- [ ] [FUNKTION 2]
- [ ] Alle Use Cases aus dem Business Context

#### E2E Tests (Playwright)
- [ ] [KRITISCHER FLOW 1] — `tests/e2e/[flow].spec.ts`
- [ ] [KRITISCHER FLOW 2]

### Test-Dateien Konvention
```
src/lib/server/services/user.ts
src/lib/server/services/user.test.ts      ← Unit Test daneben

tests/
├── e2e/
│   ├── auth.spec.ts
│   └── [feature].spec.ts
└── fixtures/
    └── test-data.ts
```

---

## API-Endpunkte

| Route | Methode | Auth | Beschreibung |
|-------|---------|------|--------------|
| `/api/[route]` | GET | Ja | [Beschreibung] |
| `/api/[route]` | POST | Ja | [Beschreibung] |

> Alle API-Routen: Input validieren, Auth prüfen, Error handling

---

## Deployment

### Umgebungen
| Umgebung | URL | Branch | Auto-Deploy |
|----------|-----|--------|-------------|
| Production | [URL] | `main` | [Ja/Nein] |
| Staging | [URL] | `develop` | [Ja/Nein] |

### Deploy-Befehl
```bash
# Manuelles Deployment (falls kein CD)
[DEPLOY BEFEHL]

# Build prüfen
npm run build
```

### Pre-Deploy Checklist
- [ ] `npm audit` — keine kritischen Issues
- [ ] Alle Tests grün
- [ ] DB-Migrations vorbereitet
- [ ] Environment Variables auf Server gesetzt

---

## Bekannte Einschränkungen & TODOs

> TODOs hier dokumentieren statt im Code

- [ ] [TODO 1]
- [ ] [TODO 2]

### Bekannte Bugs
- [BUG 1 — wann, was passiert, workaround]

---

## Wichtige Entscheidungen (Architecture Decision Records)

### [Datum] — [ENTSCHEIDUNG]
**Kontext:** [Warum musste entschieden werden?]
**Entscheidung:** [Was wurde gewählt?]
**Begründung:** [Warum?]
