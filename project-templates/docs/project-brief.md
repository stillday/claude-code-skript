# Project Brief — [PROJEKT-NAME]

> Wird vom PM-Agent während /discover ausgefüllt.
> Dieses Dokument bestimmt das Agent-Team und die initiale Architektur.
> Nach Projekt-Start: nur bei grundlegenden Änderungen updaten.

---

## Kernidee

[Was ist das Problem? Wie löst das Projekt es? 2-3 Sätze.]

---

## Zielgruppe

**Primärer User:**
[Beschreibung: wer, wie tech-affin, in welchem Kontext nutzt er die App?]

**Sekundäre User (falls vorhanden):**
[z.B. Admins, B2B-Kunden, interne Mitarbeiter]

---

## Must-Have Features (Launch)

1. [Feature 1 — ohne das nicht launchbar]
2. [Feature 2]
3. [Feature 3]

## Nice-to-Have (Post-Launch)

- [Feature A]
- [Feature B]

---

## Business-Kontext

- **Typ:** Kommerziell / Internes Tool / Persönliches Projekt / Open Source
- **Einnahmen-Modell:** Subscription / Einmalkauf / Kostenlos / n/a
- **Timeline:** [Wann soll MVP live sein?]
- **Versionierung:** SemVer `1.0.0` / CalVer `YYYY.MMDD.NNNN`

---

## Sensitive Daten & Compliance

| Datentyp | Vorhanden | Maßnahme |
|----------|-----------|----------|
| Persönliche Daten (Name, Email) | Ja/Nein | DSGVO Agent |
| Zahlungsdaten | Ja/Nein | Stripe + SEC |
| Gesundheitsdaten | Ja/Nein | Erhöhte DSGVO-Anforderungen |
| Authentifizierung | Ja/Nein | Auth-Flow dokumentieren |

---

## Erwartete Skalierung

- **Launch:** [< 100 / 100–10K / 10K+] gleichzeitige User
- **12 Monate:** [Schätzung]
- **Kritische Last-Zeiten:** [z.B. Events, Morgens, immer gleichmäßig]

---

## Externe Integrationen

| Integration | Zweck | Status |
|-------------|-------|--------|
| [z.B. Stripe] | Payments | geplant |
| [z.B. Resend] | Emails | geplant |

---

## Bekannte Risiken & Herausforderungen

1. [Risiko 1 — z.B. "Realtime-Sync zwischen vielen Clients"]
2. [Risiko 2]

---

## Empfohlenes Agent-Team

> Vom PM ausgefüllt nach Discovery-Gespräch mit [USER].

| Agent | Aktiv | Begründung |
|-------|-------|------------|
| PM | ✓ | immer |
| BE | ✓ | immer |
| FE | ✓ | immer |
| QA | ✓ | immer |
| SEC | ✓ | immer |
| DBA | [✓/✗] | [Begründung] |
| DSGVO | [✓/✗] | [Begründung] |
| PERF | [✓/✗] | [Begründung] |

---

## Architektur-Entscheidungen (initiale)

> Vom DBA/BE-Agent nach Discovery ausgefüllt.

- **Datenbank-Struktur:** [Kurze Beschreibung]
- **Auth-Strategie:** [Supabase Auth / anderes]
- **State-Management:** [Svelte Stores / URL-State / anderes]
- **Deployment-Strategie:** [spielbar.gilneas.at / Vercel / anderes]

> Detaillierte Entscheidungen → `docs/adr/`
