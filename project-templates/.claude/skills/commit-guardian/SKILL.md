---
name: commit-guardian
description: Prüft jeden Commit gegen [USER]'s Commit-Regeln bevor er ausgeführt wird. Aktiviere vor git commit, beim Reviewen von staged Changes, oder wenn gefragt wird ob Code commit-ready ist. Prüft: Größe (max 300 Zeilen), Conventional Commits Format, keine Secrets, keine offenen TODOs ohne Issue-Referenz, ADR-Bedarf, Failed-Approach-Dokumentation.
---

# Commit Guardian

Prüft staged Changes gegen [USER]'s Commit-Standards. Bei Verletzungen: blockieren und Anleitung geben.

## Ablauf

```bash
# 1. Staged Changes analysieren
git diff --cached --stat
git diff --cached
```

## Check 1 — Commit-Größe (HARD LIMIT)

```bash
LINES=$(git diff --cached --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')
DELETIONS=$(git diff --cached --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+')
TOTAL=$((LINES + DELETIONS))
```

**Regel:** Max. 300 Zeilen (Insertions + Deletions zusammen)

Bei Überschreitung:
```
⛔ COMMIT BLOCKIERT: $TOTAL Zeilen (Limit: 300)

Aufteilen in:
  1. [Logischer Teil 1 — z.B. "Backend: Service implementieren"]
  2. [Logischer Teil 2 — z.B. "Frontend: UI Komponente"]
  3. [Logischer Teil 3 — z.B. "Tests: Unit Tests für Service"]

git reset HEAD <files>  → Dateien unstagen
```

## Check 2 — Conventional Commits Format

Commit-Message muss diesem Format entsprechen:
```
<type>(<scope>): <beschreibung>

[optionaler body]
[optionales footer]
```

Erlaubte Types:
- `feat:` neues Feature
- `fix:` Bug-Fix
- `refactor:` Refactoring ohne Funktionsänderung
- `test:` Tests hinzufügen/ändern
- `docs:` Dokumentation
- `chore:` Dependencies, Config, Build, Scripts
- `security:` Security-Fix oder -Verbesserung
- `perf:` Performance-Verbesserung
- `style:` Formatierung (kein Code-Change)
- `ci:` CI/CD Änderungen

Beispiele guter Messages:
```
feat(auth): add email verification flow
fix(api): handle null response from Supabase
refactor(services): extract user validation logic
test(user-service): add edge case for empty email
security(api): add rate limiting to login endpoint
```

## Check 3 — Keine Secrets

```bash
# Patterns die NICHT in Commits sein dürfen
git diff --cached | grep -iE \
  "password\s*=|secret\s*=|api_key\s*=|token\s*=|private_key" | \
  grep -v "example\|placeholder\|your_key\|REPLACE"
```

Auch prüfen:
- `.env` Dateien in staged Changes?
- `*.pem`, `*.key`, `*.cert` Dateien?
- Strings die wie Base64-encoded Secrets aussehen (>40 Zeichen, zufällig)

## Check 4 — TODO-Kommentare

```bash
git diff --cached | grep "TODO\|FIXME\|HACK\|XXX"
```

**Regel:** `// TODO:` nur erlaubt wenn GitHub Issue referenziert:
```typescript
// TODO: #42 — Rate limiting implementieren
// FIXME: #17 — Edge case bei leerem Array
```

Bei TODO ohne Issue-Referenz:
```
⚠️  TODO ohne Issue gefunden:
    src/lib/services/user.ts: // TODO: validation verbessern

Optionen:
  a) GitHub Issue erstellen und Referenz eintragen
  b) TODO jetzt direkt lösen
  c) TODO komplett entfernen wenn nicht mehr relevant
```

## Check 5 — ADR-Bedarf erkennen

Prüfe ob die staged Changes eine nicht-offensichtliche Entscheidung enthalten:

Triggers für ADR-Pflicht:
- Neue Bibliothek wird hinzugefügt (`package.json` geändert)
- Datenbankschema-Änderungen (`supabase/migrations/` betroffen)
- Auth-Strategie geändert
- Caching-Strategie implementiert
- Bewusste Abweichung von Standard-Pattern (Kommentar mit "because", "instead of", "we chose")
- Neue externe API-Integration

Bei Trigger:
```
📋 ADR EMPFOHLEN

Diese Änderung enthält eine architekturelle Entscheidung:
  [Beschreibung was erkannt wurde]

Erstelle docs/adr/ADR-[NNN]-[titel].md bevor du committest.
Template: docs/adr/ADR-000-template.md

Soll ich den ADR für dich schreiben? (j/N)
```

## Check 6 — Failed Approach dokumentieren

Wenn der Commit einen Revert, ein "fallback" oder "workaround" enthält:
```
📝 FAILED APPROACH dokumentieren?

Dieser Commit scheint einen fehlgeschlagenen Ansatz zu ersetzen.
Wurde docs/failed-approaches.md aktualisiert?

Falls nicht: Was hat nicht funktioniert?
→ Ich helfe dir das zu dokumentieren damit es nicht nochmal passiert.
```

## Check 7 — Test-Coverage für neue Funktionen

```bash
# Neue .ts Funktionen ohne entsprechende .test.ts
git diff --cached --name-only | grep "src/lib/server/services"
```

Bei neuen Service-Funktionen ohne Test-Datei:
```
⚠️  Neue Service-Funktionen ohne Tests:
    src/lib/server/services/payment.ts (neu)
    → Erwartete Test-Datei: src/lib/server/services/payment.test.ts

Tests jetzt schreiben oder als separaten Commit nachliefern?
```

---

## Commit Freigabe

Alle Checks bestanden:
```
✅ COMMIT READY

  Größe:    [X] Zeilen ✓ (< 300)
  Format:   feat(scope): beschreibung ✓
  Secrets:  keine gefunden ✓
  TODOs:    keine ohne Issue-Ref ✓
  ADR:      nicht nötig / bereits erstellt ✓
  Tests:    vorhanden ✓

git commit -m "[message]"
```
