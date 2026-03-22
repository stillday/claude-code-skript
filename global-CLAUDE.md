# Jan — Globale Claude Code Konfiguration

> Diese Datei gehört nach `~/.claude/CLAUDE.md` und gilt für ALLE Projekte.
> Projekt-spezifische Details kommen in die `CLAUDE.md` im jeweiligen Projekt-Root.

---

## Setup-Kit Update-Check (automatisch bei Session-Start)

Prüfe beim Start jeder Session einmalig ob die Datei `~/.claude/update-notification.txt` existiert.

- **Wenn vorhanden:** Zeige dem User kurz: `💡 Setup-Kit Update verfügbar — ausführen: .\setup.ps1 -CheckUpdates` und lösche die Datei danach (`Remove-Item ~/.claude/update-notification.txt`)
- **Wenn nicht vorhanden:** Nichts tun, nicht erwähnen

---

## Identität & Kontext

- **Name:** Jan
- **Rolle:** Web Developer (Firma + eigene Projekte)
- **Primärer Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS v4, Supabase, PostgreSQL
- **Sekundärer Stack:** Angular (Arbeit), WordPress/WooCommerce (Kundenprojekte)
- **Server:** spielbar.gilneas.at — Debian 12, SSH key-basiert (`ssh jan@62.171.190.237`)
- **Ziel-Projekt:** Monstis (monster-radar)

---

## Sprache & Kommunikation

- Kommuniziere **immer auf Deutsch**
- Technische Begriffe, Code, Dateinamen und CLI-Outputs bleiben auf Englisch
- Antworten kurz und präzise — kein Fülltext, keine Wiederholungen
- Bei unklaren Anforderungen: **erst fragen**, dann handeln
- Destructive Operationen (Dateien löschen, force push, DB-Drops) **immer bestätigen lassen**

---

## Git-Workflow (IMMER einhalten)

### Branch-Strategie
| Branch | Zweck |
|--------|-------|
| `main` | Nur stabiler, getesteter, releaseter Code |
| `develop` | Aktive Entwicklung, Basis für Features |
| `feature/[name]` | Neue Features |
| `bugfix/[name]` | Bug-Fixes |
| `hotfix/[name]` | Kritische Produktions-Fixes (von main) |
| `release/[version]` | Release-Vorbereitung und finale Tests |

### Commit-Regeln (STRIKT)
- **Max. 300 Zeilen pro Commit** — bei mehr aufteilen
- Conventional Commits verwenden:
  - `feat:` neues Feature
  - `fix:` Bug-Fix
  - `refactor:` Refactoring ohne Funktionsänderung
  - `test:` Tests hinzufügen/ändern
  - `docs:` Dokumentation
  - `chore:` Dependencies, Configs, Build
  - `security:` Security-Fix
  - `perf:` Performance-Verbesserung
- **Niemals direkt auf `main` committen**
- **Niemals `--no-verify`** ohne explizite Anfrage von Jan
- Branch-Namen immer lowercase mit Bindestrichen: `feature/user-auth` nicht `feature/UserAuth`

### Feature-Entwicklung (Standardprozess)
1. `git checkout develop && git pull`
2. `git checkout -b feature/[beschreibender-name]`
3. Feature in kleinen Commits entwickeln (max. 300 Zeilen)
4. Tests schreiben (Unit + Integration)
5. `git push -u origin feature/[name]`
6. Pull Request → Code Review → Merge → Branch löschen

---

## Code-Qualität

### Allgemeine Regeln
- TypeScript **strict mode** immer aktiv
- Kein `any` ohne Erklärungskommentar
- Keine auskommentierten Code-Blöcke in Commits
- Keine magic numbers — immer als benannte Konstante
- DRY-Prinzip, aber **keine vorzeitige Abstraktion**
- Fehlerbehandlung an **allen** System-Grenzen
- Keine Features hinzufügen, die nicht explizit angefragt wurden
- Keine Docstrings/Comments hinzufügen bei unverändertem Code

### Performance
- Keine N+1 Queries — immer Datenbankzugriffe prüfen
- Lazy Loading für große Komponenten
- Images immer optimiert (WebP, korrekte Größen)
- Bundle-Size im Blick behalten

---

## Testing-Strategie (Pflicht)

### Test-Pyramide
1. **Unit Tests** (Vitest) — Business-Logik, Utilities, Services
2. **Integration Tests** (Vitest) — API-Endpunkte, DB-Interaktionen
3. **E2E Tests** (Playwright) — Kritische User-Flows

### Regeln
- Tests **vor oder während** der Feature-Entwicklung schreiben
- Business-Logik-Funktionen: **100% Coverage**
- Gesamt-Coverage: **> 80%**
- Tests müssen **vor jedem Merge** grün sein
- Keine echten API-Keys in Tests — immer Mocks/Fixtures
- E2E-Tests für alle kritischen User-Flows

### Business Logic Testing (besonders wichtig)
Bei jeder neuen Business-Funktion prüfen:
- Happy Path Test
- Edge Cases (leere Inputs, Grenzwerte)
- Error Cases (ungültige Daten, fehlende Rechte)
- Use Case Abdeckung (was will der User wirklich erreichen?)

---

## Security (vor jedem Version-Bump PFLICHT)

### Checkliste vor Release
- [ ] `npm audit` — keine kritischen/hohen Vulnerabilities
- [ ] Keine Secrets/API-Keys im Code oder Git-History
- [ ] Input-Validierung an allen System-Grenzen (nicht nur Frontend)
- [ ] OWASP Top 10 relevant für dieses Projekt geprüft:
  - [ ] SQL Injection (parametrisierte Queries)
  - [ ] XSS (Output-Encoding, CSP)
  - [ ] CSRF (Tokens bei Formularen)
  - [ ] Broken Auth (Session-Management)
  - [ ] Sensitive Data Exposure
- [ ] Rate Limiting auf allen öffentlichen APIs
- [ ] GDPR/DSGVO: Keine unnötigen Daten gespeichert
- [ ] Dependency-Updates auf Security-Patches geprüft

### Permanente Regeln
- Kein Code der Secrets loggt oder ausgibt
- `.env`-Dateien niemals committen
- Prepared Statements/ORM immer für DB-Queries
- Auth-Checks Server-seitig, nie nur Client-seitig

---

## Code Review Checkliste

Vor jedem Merge in `develop` oder `main`:

### Code
- [ ] Logik korrekt und verständlich?
- [ ] Edge Cases behandelt?
- [ ] Error Handling vollständig?
- [ ] Keine auskommentierten Code-Blöcke?
- [ ] Commit-Größe ≤ 300 Zeilen?

### Testing
- [ ] Tests vorhanden für neue Funktionen?
- [ ] Alle Tests grün?
- [ ] Business-Logik abgedeckt?

### Security
- [ ] Keine Secrets im Code?
- [ ] Input-Validierung vorhanden?
- [ ] SQL Injection / XSS nicht möglich?

### Performance
- [ ] Keine offensichtlichen Performance-Probleme?
- [ ] DB-Queries optimiert?

---

## Pre-Version-Bump Prozess

Vor jedem Version-Sprung (Patch/Minor/Major) IMMER in dieser Reihenfolge:

1. **Security Audit** — `npm audit && npm audit fix`
2. **Alle Tests grün** — `npm test && npm run test:e2e`
3. **Code Review** abgeschlossen
4. **CHANGELOG.md** aktualisiert
5. **Migrations vorhanden** (bei DB-Änderungen)
6. **Rollback-Plan** dokumentiert
7. **Deployment-Test** auf Staging-Umgebung
8. Release-Branch erstellen: `release/v[X.Y.Z]`

---

## Wissen & Gedächtnis (KRITISCH — niemals ignorieren)

### Architecture Decision Records (ADRs)

Bei JEDER nicht-offensichtlichen Entscheidung → `docs/adr/ADR-XXX-titel.md` anlegen.
Vorlage: Kontext → Optionen → Entscheidung → Begründung → Konsequenzen.
Kein Agent schreibt Code der von Standard abweicht ohne ADR.

### Failed Approaches (NIEMALS zweimal denselben Fehler)

Wenn ein Ansatz nicht funktioniert → **sofort** in `docs/failed-approaches.md` dokumentieren:
- Was wurde versucht?
- Warum ist es fehlgeschlagen? (genaue Ursache)
- Wie erkennt man das Problem wieder?
- Was funktioniert stattdessen?

Vor jeder neuen Implementierung: `docs/failed-approaches.md` prüfen.

### Memory-Renewal (nach größeren Änderungen)

Nach jedem abgeschlossenen Feature oder Refactoring:
- Projekt-Memory-Dateien auf Aktualität prüfen
- Veraltete Einträge aktualisieren oder löschen
- ADRs die überholt sind → Status auf "Überholt von ADR-XXX" setzen

### Task-Lifecycle (TODOs sterben sauber)

**Goldene Regel:** Ein erledigter Task VERSCHWINDET — er wird nicht als erledigt markiert.

- TODO in CLAUDE.md abgearbeitet → Zeile löschen
- `// TODO:` Kommentar im Code erledigt → Kommentar komplett entfernen
- GitHub Issue abgeschlossen → Issue schließen
- Kein `- [x] erledigt` stehen lassen — das ist Müll der sich ansammelt

Nach jedem Feature: offene TODOs prüfen, abgearbeitete komplett entfernen.

---

## Automatische Checks nach Abschluss

Nach jeder Code-Änderung prüfen:
- Tests vorhanden für alle geänderten Funktionen?
- Commit-Größe ≤ 300 Zeilen?
- Keine Secrets oder `// TODO:` ohne GitHub-Issue-Referenz im Code?
- ADR nötig für diese Entscheidung?
- Failed Approach zu dokumentieren?
- Memory noch aktuell?

---

## Starterpaket (IMMER zuerst installieren)

Bei jedem neuen Setup oder neuem Gerät in dieser Reihenfolge:

```powershell
# 1. find-skills — Basis für alle weiteren Skills (IMMER ZUERST)
npx skills add find-skills -g -y

# 2. skill-creator Plugin — neue Skills erstellen können
claude plugin install skill-creator

# 3. agent-sdk-dev Plugin — Agents bauen und verwalten
claude plugin install agent-sdk-dev

# 4. Dann setup.ps1 aus C:\coding\perfekt-agent\ ausführen
.\setup.ps1
```

Diese 3 Tools sind die Basis — ohne sie kein sinnvolles Erweitern des Setups.

---

## Projekt-Setup (Neues Projekt)

Standard-Vorgehen für jedes neue Projekt:
1. Private GitHub-Repo erstellen
2. `develop`-Branch als Default setzen
3. Branch-Protection für `main` aktivieren
4. `CLAUDE.md` aus Template kopieren und anpassen
5. Vitest + Playwright einrichten
6. `.env.example` erstellen (nie `.env` committen)
7. GitHub Actions für CI einrichten (Tests + Lint)
8. Supabase-Projekt verknüpfen (falls gebraucht)
