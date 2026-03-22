---
name: svelte-css-animations
description: CSS-first Animations für Svelte/SvelteKit Projekte. Aktiviere wenn Animationen, Übergänge, Bewegung, Hover-Effekte, Scroll-Animationen, Page-Transitions oder visuelle Feedback-Effekte implementiert werden sollen. Niemals JavaScript-Animationsbibliotheken wenn CSS + Svelte-native ausreicht.
---

# Svelte CSS Animations

CSS-first Animations für Svelte. Diese Reihenfolge einhalten — von einfach nach komplex:

## Prioritäten-Stack (immer in dieser Reihenfolge prüfen)

```
1. Svelte native transition:/animate:  → für Element ein/ausblenden
2. CSS @keyframes + animation           → für loops, complex sequences
3. CSS Scroll-driven Animations         → für scroll-triggered effects
4. CSS View Transitions API             → für page/route transitions
5. JavaScript NUR wenn CSS nicht reicht → Rücksprache mit Jan
```

---

## 1. Svelte Native Transitions (erste Wahl)

```svelte
<script>
  import { fade, fly, scale, slide, blur, draw, crossfade } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import { cubicOut, elasticOut, backOut } from 'svelte/easing'

  let visible = $state(false)
  let items = $state(['a', 'b', 'c'])
</script>

<!-- Basis -->
{#if visible}
  <div transition:fade={{ duration: 200 }}>Fade</div>
{/if}

<!-- Richtung + Easing -->
{#if visible}
  <div transition:fly={{ y: 20, duration: 300, easing: cubicOut }}>
    Slide up
  </div>
{/if}

<!-- Nur rein oder nur raus -->
{#if visible}
  <div in:scale={{ duration: 200 }} out:fade={{ duration: 150 }}>
    Scale in, fade out
  </div>
{/if}

<!-- Listen-Animationen mit flip -->
{#each items as item (item)}
  <div animate:flip={{ duration: 300 }}>{item}</div>
{/each}

<!-- Crossfade für shared elements -->
<script>
  const [send, receive] = crossfade({ duration: 300, easing: cubicOut })
</script>
```

### Timing-Regeln
| Zweck | Dauer |
|-------|-------|
| Micro-feedback (Hover, Klick) | 100–150ms |
| UI-Feedback (Modal, Tooltip) | 150–250ms |
| Content-Übergänge | 250–350ms |
| Page-Transitions | 300–500ms |
| Nie länger als | 500ms |

---

## 2. CSS @keyframes (für komplexere Animationen)

```css
/* In app.css oder Komponenten-<style> */

/* Slide up — standard entry */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(1.5rem); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Scale in — für Cards, Modals */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Shimmer — für Skeleton Loader */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Pulse — für Loading-States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Bounce-in — für Notifications */
@keyframes bounce-in {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Tailwind Animate Klassen (sofort nutzbar)
```html
<!-- Tailwind v4 + tailwindcss-animations plugin -->
<div class="animate-slide-up">Slide up</div>
<div class="animate-fade-in">Fade in</div>
<div class="animate-scale-in">Scale in</div>
<div class="animate-bounce">Bounce</div>
<div class="animate-pulse">Pulse</div>
<div class="animate-spin">Spin</div>
```

---

## 3. CSS Scroll-driven Animations (moderne Browser, kein JS!)

```css
/* Element animiert wenn es in den Viewport scrollt */
@keyframes reveal {
  from { opacity: 0; transform: translateY(2rem); }
  to   { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 25%;
}

/* Progress Bar die mit Scroll wächst */
.scroll-progress {
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  background: var(--color-primary);
  transform-origin: left;
  animation: grow-width linear;
  animation-timeline: scroll(root);
}
@keyframes grow-width {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* Staggered children beim Scrollen */
.stagger-container > * {
  animation: slide-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
.stagger-container > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container > *:nth-child(2) { animation-delay: 100ms; }
.stagger-container > *:nth-child(3) { animation-delay: 200ms; }
```

**Browser-Support:** Chrome 115+, Edge 115+, Safari 18+
Für ältere Browser: graceful degradation (animation einfach weglassen, Inhalt bleibt sichtbar)

---

## 4. CSS View Transitions API (Page-Transitions)

```svelte
<!-- +layout.svelte — aktiviert für alle Route-Wechsel -->
<script>
  import { onNavigate } from '$app/navigation'

  onNavigate((navigation) => {
    if (!document.startViewTransition) return

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
    })
  })
</script>

<!-- app.css — Transition-Animation -->
<style>
  @keyframes fade-in-page {
    from { opacity: 0; transform: translateY(8px); }
  }
  @keyframes fade-out-page {
    to { opacity: 0; transform: translateY(-8px); }
  }

  ::view-transition-old(root) {
    animation: 200ms ease-out both fade-out-page;
  }
  ::view-transition-new(root) {
    animation: 300ms ease-in both fade-in-page;
  }
</style>
```

**Shared Element Transitions:**
```css
/* Gleiches Element über Seiten animieren */
.hero-image { view-transition-name: hero; }

::view-transition-old(hero),
::view-transition-new(hero) {
  animation-duration: 400ms;
}
```

---

## prefers-reduced-motion (IMMER)

```css
/* Globale Regel — niemals vergessen */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```svelte
<!-- In Svelte: Systemeinstellung abfragen -->
<script>
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const duration = prefersReduced ? 0 : 300
</script>

<div transition:fly={{ y: 20, duration }}>...</div>
```

---

## Performance-Regeln

- Nur `transform` und `opacity` animieren — GPU-beschleunigt
- Kein `width`, `height`, `top`, `left` animieren — Layout-Recalc
- `will-change: transform` nur für komplexe Animationen die definitiv laufen
- `contain: layout` für animierte Bereiche die andere Elemente nicht beeinflussen sollen
- Skeleton Loader statt Spinner wo möglich (bessere perceived performance)
