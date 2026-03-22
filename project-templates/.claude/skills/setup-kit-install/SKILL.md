---
name: setup-kit-install
description: Installiert oder aktualisiert das Claude Code Setup-Kit. Aktiviere wenn der User sagt er hat ein Setup-Repo, ein Claude Code Skript-Repo, oder bittet darum das Setup zu integrieren, zu installieren oder zu aktualisieren. Erkennt ob das Kit bereits installiert ist und laeuft entsprechend den richtigen Flow durch.
---

# Setup-Kit Install

Wenn dieser Skill aktiviert wird, fuehre folgende Schritte durch:

## Schritt 1: Vorhandene Installation pruefen

Pruefe in dieser Reihenfolge ob das Setup-Kit bereits installiert ist:

```bash
# 1. setup-kit.json vorhanden?
cat "$env:USERPROFILE/.claude/setup-kit.json" 2>/dev/null

# 2. Bekannte Installationsorte pruefen
ls "C:/tools/claude-code-skript/setup.ps1" 2>/dev/null
ls "C:/tools/claude-code-setup/setup.ps1" 2>/dev/null
ls "$env:USERPROFILE/tools/claude-code-skript/setup.ps1" 2>/dev/null
```

**Wenn bereits installiert:**
- Teile dem User mit wo es installiert ist
- Frage: "Das Setup-Kit ist bereits installiert in [PFAD]. Soll ich auf Updates prüfen und setup.ps1 erneut ausführen?"
- Bei Ja: gehe zu Schritt 3b (Update-Flow)

**Wenn nicht installiert:**
- Weiter zu Schritt 2

---

## Schritt 2: Installationspfad bestimmen

### 2a. Projekt-Konventionen erkennen

Schaue wo der User seine Projekte typischerweise ablegt:

```bash
# Pruefen ob bekannte Projektordner existieren
ls "C:/coding/" 2>/dev/null
ls "C:/projects/" 2>/dev/null
ls "C:/dev/" 2>/dev/null
ls "$env:USERPROFILE/projects/" 2>/dev/null
```

Wenn zum Beispiel `C:\coding\` viele Projekte enthält, schlage als Installationsort `C:\tools\claude-code-skript` vor — also einen Geschwister-Ordner auf gleicher Ebene wie die Projekte, aber klar getrennt davon.

### 2b. Installationspfad vorschlagen und bestätigen lassen

Teile dem User mit:
- Welchen Pfad du vorschlägst (z.B. `C:\tools\claude-code-skript`)
- Warum (z.B. "weil deine Projekte in C:\coding\ liegen, halte ich tools\ auf gleicher Ebene sinnvoll")
- Frage explizit: "Darf ich das Setup-Kit nach [PFAD] installieren? (j/N)"

**Ohne Bestätigung nicht installieren.**

---

## Schritt 3a: Neu installieren

Wenn der User zugestimmt hat:

```powershell
# 1. Elternordner erstellen falls noetig
New-Item -ItemType Directory -Path "C:\tools" -Force

# 2. Repo klonen
git clone https://github.com/stillday/claude-code-skript.git "C:\tools\claude-code-skript"

# 3. Pruefe ob Klonen erfolgreich
# setup.ps1 muss vorhanden sein
```

Wenn das Klonen erfolgreich war:
- Informiere den User kurz was installiert wurde
- Starte sofort `setup.ps1`:

```powershell
Set-Location "C:\tools\claude-code-skript"
.\setup.ps1
```

Der Wizard in `setup.ps1` uebernimmt dann interaktiv den Rest (Username, Projekt einrichten, etc.).

---

## Schritt 3b: Update-Flow (bereits installiert)

```powershell
Set-Location "[INSTALLPFAD]"

# Update-Check ausfuehren
.\setup.ps1 -CheckUpdates
```

Wenn Updates eingespielt wurden oder der User es wuenscht, danach setup.ps1 erneut ausfuehren:

```powershell
.\setup.ps1
```

---

## Schritt 4: Nach dem Setup

Nach erfolgreichem Durchlauf von `setup.ps1` pruefen:

```bash
# Wurde setup-kit.json angelegt?
cat "$env:USERPROFILE/.claude/setup-kit.json"

# Wurde CLAUDE.md installiert?
ls "$env:USERPROFILE/.claude/CLAUDE.md"
```

Fasse dem User zusammen:
- Was installiert wurde
- Wo das Setup-Kit liegt
- Wie er es fuer neue Projekte nutzt: `.\setup.ps1 -ProjectPath "C:\coding\neues-projekt"`
- Wie er Updates prueft: `.\setup.ps1 -CheckUpdates`

---

## Wichtige Regeln

- **Niemals ohne Bestaetigung** einen Ordner erstellen oder ein Repo klonen
- **Immer den Installationspfad zeigen** bevor etwas passiert
- **Bei vorhandener Installation:** immer erst den Update-Check anbieten, nicht blind ueberschreiben
- Wenn `setup.ps1` interaktiv laeuft, nicht unterbrechen — der Wizard fuehrt den User selbst durch
