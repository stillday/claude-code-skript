# Feature: [FEATURE-NAME]
Erstellt: [YYYY-MM-DD]
Status: GEPLANT

> Diese Datei wird vom PM-Agent erstellt und vor der Ausführung mit [USER] abgestimmt.
> Nach Abschluss → archivieren nach `docs/planning-history/`

---

## Ziel

[Was dieses Feature erreichen soll — 2-3 Sätze. Was ändert sich für den User?]

---

## Abhängigkeiten

- Setzt voraus: [andere Features / Schema-Stand / externe APIs]
- Blockiert: [Features die danach kommen]

---

## Waves

### Wave 1 — [Name, z.B. "Schema & Typen"]
Kann starten: sofort

<task id="1.1" agent="DBA" wave="1">
  <titel>[Titel]</titel>
  <aktion>[Was genau zu tun ist — ein konkreter Satz]</aktion>
  <dateien>
    - [datei1]
    - [datei2]
  </dateien>
  <verifikation>
    - [Wie prüft man ob es geklappt hat?]
    - [Konkrete Checks / Tests]
  </verifikation>
  <fertig_wenn>
    - [Messbares Kriterium 1]
    - [Messbares Kriterium 2]
  </fertig_wenn>
</task>

---

### Wave 2 — [Name, z.B. "Backend + Frontend"]
Kann starten: nach Wave 1 (braucht: [welche Dateien aus Wave 1])

<task id="2.1" agent="BE" wave="2">
  <titel>[Titel]</titel>
  <aktion>[Was genau zu tun ist]</aktion>
  <dateien>
    - [datei1]
    - [datei2]
  </dateien>
  <verifikation>
    - [Check 1]
    - [Check 2]
  </verifikation>
  <fertig_wenn>
    - [Kriterium 1]
    - [Kriterium 2]
  </fertig_wenn>
</task>

<task id="2.2" agent="FE" wave="2">
  <titel>[Titel]</titel>
  <aktion>[Was genau zu tun ist]</aktion>
  <dateien>
    - [datei1]
    - [datei2]
  </dateien>
  <verifikation>
    - [Check 1]
    - [Check 2]
  </verifikation>
  <fertig_wenn>
    - [Kriterium 1]
    - [Kriterium 2]
  </fertig_wenn>
</task>
<!-- Tasks 2.1 + 2.2 laufen parallel — keine gemeinsamen Dateien -->

---

### Wave 3 — [Name, z.B. "Tests & Security"]
Kann starten: nach Wave 2

<task id="3.1" agent="QA" wave="3">
  <titel>Tests schreiben</titel>
  <aktion>Unit Tests + E2E Tests für alle neuen Funktionen</aktion>
  <dateien>
    - src/lib/server/services/[name].test.ts
    - tests/e2e/[name].spec.ts
  </dateien>
  <verifikation>
    - npm test → alle Tests grün
    - Coverage > 80%
  </verifikation>
  <fertig_wenn>
    - Happy Path, Edge Cases, Error Cases getestet
    - E2E für kritischen User-Flow vorhanden
  </fertig_wenn>
</task>

<task id="3.2" agent="SEC" wave="3">
  <titel>Security Check</titel>
  <aktion>OWASP Top 10 Review, Input-Validierung, Auth-Checks</aktion>
  <dateien>
    - [alle neuen API-Routen]
    - [alle neuen Server-Funktionen]
  </dateien>
  <verifikation>
    - Kein direktes SQL, keine XSS-Vektoren
    - Auth-Checks server-seitig vorhanden
  </verifikation>
  <fertig_wenn>
    - Security Report ohne kritische Findings
  </fertig_wenn>
</task>
<!-- Tasks 3.1 + 3.2 laufen parallel -->

---

## Wave-Übersicht (Abhängigkeitsgraph)

```
Wave 1: [1.1 DBA]
          ↓
Wave 2: [2.1 BE] [2.2 FE]   ← parallel
          ↓
Wave 3: [3.1 QA] [3.2 SEC]  ← parallel
```

---

## Risiken & Fallbacks

- [Risiko 1]: [Fallback-Strategie]
- [Risiko 2]: [Fallback-Strategie]

---

## Definitions of Done

- [ ] Alle Wave-Tasks abgeschlossen
- [ ] Alle Tests grün
- [ ] Security Check ohne kritische Findings
- [ ] `/verify-work` erfolgreich
- [ ] PR erstellt
