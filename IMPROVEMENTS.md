# Improvements log

A self-directed audit loop. One area per iteration, never repeating an area
until all have been covered. Each entry says what was changed, why, and what
was measured — including the iterations that found little, because knowing an
area is clean is worth recording too.

Areas in the cycle: code quality · resilience · cross-browser · security &
privacy · performance · accessibility · mobile layout · SEO · visual polish ·
copy (audit only — visible copy is not changed without the owner, per
HANDOFF rule 0).

---

## Iteration 1 — Code quality & dead code

**Audited.** Extracted all 477 CSS selectors from the CSSOM and tested each
against the live DOM; parsed the 955-line script for unreferenced functions;
checked markup validity in the parsed DOM (nesting, duplicate ids, dangling
ARIA references, missing image dimensions); counted `!important` and
`will-change`; measured duplicated SVG path data and inline style attributes.

**The area was in better shape than expected.** Recording the negatives so
nobody re-runs this:

- **No dead JavaScript.** All 30 declared functions and 6 named IIFEs are
  referenced.
- **57 selectors matched nothing**, but 55 of those are runtime state —
  `.nav.open`, `.marquee.paused`, `[aria-pressed="true"]`, `.no-motion`,
  `.js-off`, `.stale-note`, `.map iframe`, every `:focus-visible`. Correct as
  they are.
- **No invalid markup.** No block element inside a `<p>`, no nested
  interactive elements, no duplicate ids, no dangling `aria-controls` /
  `aria-labelledby`, no image without explicit width and height.
- **`!important` is disciplined.** 33 uses: 20 inside `@media print`, and all
  13 others inside `prefers-reduced-motion` / `.no-motion` overrides, which is
  what it is for.
- **Duplicated SVG path data is 2.1 KB** across 171 KB. Converting the repeated
  WhatsApp and quote glyphs to `<symbol>`/`<use>` was considered and
  **rejected**: gzip already collapses repeated strings, and the icon
  micro-animations target individual paths (`.stamp-mark`, `.tear-l`,
  `.tear-r`), so a sprite would risk real behaviour for no real gain.

**Changed — two things, both small and real:**

1. **`type="button"` on seven buttons** (the menu toggle and all six FAQ
   questions). A `<button>` with no `type` is `type="submit"`. None of them sit
   inside a `<form>` today so nothing was broken, but the FAQ is one refactor
   away from being wrapped in one, and then every answer toggle would submit
   the page.
2. **Removed an exact duplicate CSS rule** — `.map-facade span` was declared
   twice, byte for byte, redeclaring the same four properties.

**Deliberately not changed:** the dead `.skyline line` and `.skyline rect`
selectors (part of a defensive grouped rule, ~26 bytes, no user impact), the
`h4` in the base heading rule (defensive), and 13 scattered inline
`margin-top` styles (churn with visual-regression risk and no benefit).

**Measured after:** buttons without `type` 7 → 0; duplicate `.map-facade span`
rules 2 → 1 with the styling still applied (`text-transform: uppercase`
resolves); FAQ still opens and sets `aria-expanded`; mobile menu still opens
and closes; no console errors; `node --check` passes. 164,156 → 164,145 bytes.
