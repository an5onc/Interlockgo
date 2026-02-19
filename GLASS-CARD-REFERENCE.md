# 🔮 Glass Card Reference — "The InterlockGo Card"

> Created accidentally on Feb 19, 2026 when `index.css` (light theme) was loaded
> alongside `reviews.css` (dark glassmorphism). The light background bleeding through
> the frosted glass + warm gradient created the most beautiful card we've ever made.

## What Makes It Special

The magic is the **combination** of:
1. **Light page background** (from `index.css` light theme) showing through the glass
2. **`backdrop-filter: blur()`** creating the frosted glass effect
3. **Semi-transparent warm gradient** on the card background
4. **Radial glow blob** (`.hero-glow--1`) behind the card casting warm light through the glass
5. **Subtle border** with low-opacity accent color

## The CSS Recipe

```css
/* === THE GLASS CARD === */
.glass-card {
  position: relative;
  /* KEY: Use very low opacity so the background bleeds through */
  background: linear-gradient(
    145deg,
    rgba(232, 65, 66, 0.08),    /* Warm accent, barely there */
    rgba(200, 180, 170, 0.12),   /* Warm neutral mid */
    rgba(180, 160, 150, 0.10)    /* Warm neutral end — NO dark colors */
  );
  border: 1px solid rgba(232, 65, 66, 0.2);
  border-radius: 20px;
  padding: 28px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Subtle light refraction overlay */
.glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
  pointer-events: none;
}

/* Hover lift */
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(232, 65, 66, 0.15);
}

/* === THE BACKGROUND GLOW (behind the card) === */
/* Place this as a sibling or on a parent element */
.glass-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: glowPulse 8s ease-in-out infinite;
  /* Warm accent color */
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(232, 65, 66, 0.4), transparent 70%);
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 0.4; }
}
```

## Critical Requirements
- **Page background MUST be light** — the whole effect depends on warm light bleeding through
- The card background must be **very low opacity** (0.08-0.15 range)
- `backdrop-filter: blur()` is mandatory — this is the frosted glass
- A warm-colored **glow blob** behind/near the card adds the gradient depth
- **Never use dark rgba values** (e.g., `rgba(22, 26, 31, 0.95)`) — kills the effect

## Files Where It Lives
- `reviews/reviews.css` — `.review-card--featured` class
- `reviews/index.html` — the Erik Clear review card
- `index.css` — provides the light theme background that makes it work

## Color Palette (InterlockGo accent)
- Primary accent: `rgba(232, 65, 66, ...)` (warm red/coral)
- Stars: `#fbbf24` (amber)
- Glass border: `rgba(232, 65, 66, 0.2)`
