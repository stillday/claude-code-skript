---
name: adr-writer
description: Schreibt Architecture Decision Records (ADRs) in [USER]'s Format. Aktiviere wenn eine nicht-offensichtliche technische Entscheidung getroffen wird, eine neue Bibliothek hinzugefügt wird, das Datenbankschema sich ändert, von Standard-Patterns abgewichen wird, oder wenn explizit nach einem ADR gefragt wird. Verhindert dass Entscheidungen ohne Kontext im Code verbleiben.
---

# ADR Writer

Schreibt Architecture Decision Records (ADRs) in [USER]'s Format und speichert sie in `docs/adr/`.

## Wann ein ADR PFLICHT ist

Erkenne diese Trigger automatisch:

| Situation | Beispiel |
|-----------|---------|
| Neue externe Bibliothek | `npm install [paket]` |
| Datenbankschema-Änderung | neue Tabelle, geänderte Spalte, neue RLS-Policy |
| Von Standard abgewichen | eigene Auth statt Supabase Auth |
| Performance-Kompromiss | bewusste Denormalisierung |
| Security-Entscheidung | JWT in Cookie statt localStorage |
| Architektur-Wechsel | monolith → microservice, sync → async |
| Ablehnung eines Ansatzes | "wir machen NICHT X weil..." |
| Drittanbieter-Integration | Payment, E-Mail, Analytics |

## ADR-Nummer vergeben

```bash
# Nächste freie Nummer finden
ls docs/adr/ | grep -E "^ADR-[0-9]+" | sort | tail -1
# Nächste = letzte + 1, 3-stellig: ADR-001, ADR-002, ..., ADR-042
```

## ADR schreiben

Datei: `docs/adr/ADR-[NNN]-[kurzer-titel-kebab-case].md`

```markdown
# ADR-[NNN]: [Entscheidungstitel — aktiv formuliert, z.B. "Supabase Auth statt Custom JWT"]

**Datum:** [YYYY-MM-DD]
**Status:** Akzeptiert
**Entscheider:** [USER]

---

## Kontext

[Warum musste diese Entscheidung jetzt getroffen werden?
Was war der Auslöser? Welche Anforderung, welcher Schmerz, welche Gelegenheit?
2-4 Sätze, keine Lösung noch.]

## Bewertete Optionen

### Option A: [Name]
**Vorteile:**
- [konkreter Vorteil]
- [konkreter Vorteil]

**Nachteile:**
- [konkreter Nachteil]

### Option B: [Name]
**Vorteile:**
- [Vorteil]

**Nachteile:**
- [Nachteil]

### Option C: [Name] *(falls relevant)*
...

## Entscheidung

**Gewählt: Option [X] — [Name]**

[Warum genau diese Option? Was hat den Ausschlag gegeben?
Das ist der wichtigste Teil. Jemand der in 6 Monaten diese Datei liest
soll verstehen warum — ohne den ursprünglichen Entwickler fragen zu müssen.
3-6 Sätze.]

## Konsequenzen

**Positiv:**
- [Was wird dadurch besser oder einfacher?]

**Negativ / Kompromisse:**
- [Was muss dafür akzeptiert werden? Was wird schwieriger?]

**Abhängigkeiten / Follow-ups:**
- [Was muss als Nächstes beachtet werden?]
- [Welche anderen Entscheidungen hängen davon ab?]
```

## Abgelehnte Optionen dokumentieren (wichtig!)

Wenn ein Ansatz explizit ABGELEHNT wird, zusätzlich in `docs/failed-approaches.md`:

```markdown
### [DATUM] — [Was wurde erwogen und abgelehnt]

**Warum nicht gewählt:** [Technische/strategische Gründe]
**Nicht wieder vorschlagen weil:** [Klare Anweisung]
**Stattdessen:** ADR-[NNN]
```

## ADR aktualisieren wenn überholt

Wenn eine Entscheidung revidiert wird — alten ADR NICHT löschen, Status ändern:

```markdown
**Status:** Überholt von ADR-[NNN]
```

Dann neuen ADR schreiben der die alte Entscheidung referenziert.

## Beispiel-ADR (Referenz)

```markdown
# ADR-003: Supabase Auth statt Custom JWT Implementation

**Datum:** 2026-03-22
**Status:** Akzeptiert
**Entscheider:** [USER]

---

## Kontext

Das Projekt benötigt User-Authentifizierung. Die initiale Planung sah
eine eigene JWT-Implementation mit verschlüsselter Cookie-Session vor.
Da wir bereits Supabase als Datenbank nutzen, stellt sich die Frage ob
Supabase Auth die bessere Wahl ist.

## Bewertete Optionen

### Option A: Supabase Auth
**Vorteile:**
- Bereits in Supabase-Paket enthalten, kein zusätzliches Paket
- RLS-Policies nutzen automatisch `auth.uid()` — kein extra Auth-Check
- OAuth Provider (Google, GitHub) out-of-the-box
- Email-Verification, Password-Reset bereits implementiert

**Nachteile:**
- Abhängigkeit von Supabase (vendor lock-in)
- Weniger Kontrolle über Token-Format

### Option B: Custom JWT mit lucia-auth
**Vorteile:**
- Vollständige Kontrolle
- Kein Vendor Lock-in

**Nachteile:**
- ~3-5 Tage Implementierungsaufwand
- Security-Risiko durch selbst implementierte Auth

## Entscheidung

**Gewählt: Option A — Supabase Auth**

Der Hauptgrund ist die tiefe Integration mit Row Level Security: Supabase RLS-Policies
nutzen `auth.uid()` direkt, was bedeutet dass Datenbankebene und Auth-Ebene
automatisch synchron sind. Bei Custom JWT müssten wir die User-ID separat in
jeden RLS-Check einbauen. Zusätzlich spart die Nutzung von Supabase Auth
erheblich Entwicklungszeit bei OAuth und E-Mail-Flows.

## Konsequenzen

**Positiv:**
- RLS-Policies können direkt `auth.uid()` nutzen
- OAuth-Integration in ~1 Stunde statt ~2 Tagen

**Negativ / Kompromisse:**
- Starke Abhängigkeit von Supabase als Auth-Provider
- Migration zu anderem Provider wäre aufwändig

**Follow-ups:**
- Session-Handling in hooks.server.ts konfigurieren
- RLS-Policies für alle User-Tabellen mit `auth.uid()` schreiben
```
