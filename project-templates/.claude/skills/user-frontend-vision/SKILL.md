---
name: user-frontend-vision
description: [USER]'s persönliche Design-Philosophie für Frontend-Projekte. Aktiviere wenn UI/UX Entscheidungen getroffen werden, Layouts designed werden, Komponenten gestyled werden oder Design-Reviews stattfinden. Verhindert 08/15-Layouts und sorgt für konsistente visuelle Qualität über alle Projekte.
---

# [USER]'s Frontend Vision

Jede UI die ich baue muss sich anfühlen wie von einem erfahrenen Designer entworfen — nicht wie ein generiertes Template.

## Das Kernprinzip: Absicht statt Zufall

Jede visuelle Entscheidung hat einen Grund. Farbe, Größe, Abstand, Bewegung — nichts passiert "einfach so". Wenn ich nicht erklären kann warum etwas so ist wie es ist, ist es falsch.

---

## Visuelle Hierarchie (wichtigste Regel)

Der User muss in 3 Sekunden verstehen was die wichtigste Aktion auf der Seite ist.

```
FALSCH (alles gleich wichtig):
  [Button]  [Button]  [Button]  — alle gleich groß, gleiche Farbe

RICHTIG (klare Hierarchie):
  [PRIMARY ACTION]    ← groß, volle Farbe, auffällig
  [secondary]         ← kleiner, outline oder gedämpft
  [tertiary link]     ← nur Text, subtil
```

### Typografie-Hierarchie
```css
/* Skala mit Kontrast — nicht alles 16px */
--text-display: clamp(2.5rem, 5vw, 4rem);   /* Hero Headlines */
--text-h1:      clamp(1.75rem, 3vw, 2.5rem);
--text-h2:      clamp(1.375rem, 2vw, 1.75rem);
--text-h3:      1.25rem;
--text-body:    1rem;
--text-small:   0.875rem;
--text-xs:      0.75rem;

/* Gewicht bewusst einsetzen */
/* 400 = body, 500 = labels, 600 = subheadings, 700 = headlines */
/* NIE 700 für Body-Text verwenden */
```

---

## Was 08/15 bedeutet (und wie es zu vermeiden ist)

**08/15-Symptome:**
- Alle Abstände 16px, 24px, 32px (Tailwind-Defaults blind übernommen)
- Weiße Seite, schwarzer Text, blaue Links — kein Designsystem
- Cards alle gleich groß, gleich aussehend
- CTA-Button grau oder zu klein
- Kein Breathing Room (zu eng oder zu viel leerer Raum)
- Mobile = Desktop nur kleiner

**Dagegen:**
- Bewusste Abstände die Rhythm erzeugen
- Eigene Farbpalette mit Persönlichkeit
- Abwechslung in Card-Layouts (featured card größer, andere kleiner)
- CTA hat visuelle Gravitation
- Whitespace als Design-Element nutzen

---

## Farbsystem (OKLCH — modern + zugänglich)

```css
/* Immer OKLCH für bessere Perceptual Uniformity */
@theme {
  /* Primärfarbe */
  --color-primary:     oklch(65% 0.2 250);    /* Satt, klar */
  --color-primary-dim: oklch(55% 0.2 250);    /* Hover */
  --color-primary-bg:  oklch(96% 0.04 250);   /* Hintergrund */

  /* Neutrals */
  --color-surface:     oklch(99% 0.005 250);  /* Fast weiß, leicht getönt */
  --color-surface-2:   oklch(96% 0.008 250);
  --color-surface-3:   oklch(92% 0.01 250);
  --color-border:      oklch(88% 0.01 250);
  --color-text:        oklch(20% 0.01 250);   /* Nicht reines Schwarz */
  --color-text-muted:  oklch(50% 0.01 250);

  /* Semantic */
  --color-success: oklch(65% 0.2 145);
  --color-warning: oklch(75% 0.2 80);
  --color-error:   oklch(60% 0.25 20);
}
```

**Dark Mode — immer von Anfang an:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface:   oklch(15% 0.01 250);
    --color-surface-2: oklch(20% 0.01 250);
    --color-border:    oklch(30% 0.01 250);
    --color-text:      oklch(92% 0.005 250);
  }
}
/* ODER: .dark Klasse für manuelles Toggle */
```

---

## Spacing System (kein Random-Padding)

```
4px   → Micro (icon gap, inline spacing)
8px   → XS (tight groups)
12px  → SM (card internal padding)
16px  → MD (standard)
24px  → LG (section internal)
32px  → XL (section gap)
48px  → 2XL (major sections)
64px  → 3XL (hero areas)
96px  → 4XL (page sections)
```

---

## Komponenten-Qualität

### Cards
```svelte
<!-- Gut: Visuelles Interesse durch Variation -->
<div class="grid grid-cols-3 gap-6">
  <!-- Featured card größer -->
  <div class="col-span-2 ...">...</div>
  <div class="col-span-1 ...">...</div>
</div>

<!-- Schlecht: Alle gleich -->
<div class="grid grid-cols-3 gap-4">
  <div>...</div><div>...</div><div>...</div>
</div>
```

### Buttons
```svelte
<!-- Immer: klare visuelle Unterscheidung zwischen Varianten -->
<button class="btn-primary">Hauptaktion</button>  <!-- auffällig -->
<button class="btn-secondary">Alternative</button>  <!-- zurückhaltend -->
<button class="btn-ghost">Abbrechen</button>        <!-- minimal -->

<!-- Pflicht: Focus-Ring, Hover-State, Active-State, Loading-State -->
<!-- Pflicht: Mindestgröße 44x44px für Touch -->
```

### Forms
```svelte
<!-- Inline-Label (modern) statt Placeholder als Label -->
<div class="relative">
  <input id="email" type="email" class="peer ..." placeholder=" " />
  <label for="email" class="absolute peer-focus:text-primary ...">
    E-Mail
  </label>
</div>
<!-- Floating Label Pattern mit Tailwind peer: -->
```

---

## Micro-Interactions (immer dabei)

Jedes interaktive Element braucht:
1. **Hover**: `transition-colors duration-150` minimum
2. **Active/Press**: `scale-[0.98]` für Buttons
3. **Focus**: sichtbarer Focus-Ring (`ring-2 ring-primary ring-offset-2`)
4. **Loading**: Skeleton statt Spinner, Button-Spinner bei async Actions
5. **Success**: kurze positive Animation (checkmark, flash)
6. **Error**: Shake-Animation + rote Border

```css
/* Standard Button Micro-Interaction */
.btn {
  transition: transform 100ms, box-shadow 150ms, background-color 150ms;
}
.btn:hover  { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.btn:active { transform: translateY(0) scale(0.98); }
```

---

## Layout-Patterns die immer gut aussehen

```svelte
<!-- Bento Grid für Feature-Showcases -->
<div class="grid grid-cols-4 grid-rows-3 gap-4 h-[600px]">
  <div class="col-span-2 row-span-2">Big feature</div>
  <div class="col-span-1">Small</div>
  <div class="col-span-1">Small</div>
  <!-- ... -->
</div>

<!-- Asymmetrisches Two-Column -->
<div class="grid grid-cols-[1fr_2fr] gap-12">
  <aside>Navigation / Meta</aside>
  <main>Hauptinhalt</main>
</div>

<!-- Full-bleed sections mit contained content -->
<section class="bg-primary-bg">
  <div class="max-w-5xl mx-auto px-6 py-24">...</div>
</section>
```

---

## Design-Qualitäts-Check (vor jedem Commit)

- [ ] Hat die Seite eine klare visuelle Hierarchie?
- [ ] Ist der Primary CTA sofort erkennbar?
- [ ] Sieht es auf Mobile gut aus? (44px Touch-Targets)
- [ ] Dark Mode getestet?
- [ ] Alle interaktiven Elemente haben Hover/Focus-States?
- [ ] Kein Content springt beim Laden (kein CLS)?
- [ ] Animationen respektieren `prefers-reduced-motion`?
- [ ] Fühlt es sich professionell an oder wie ein Template?
