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

---

## Iteration 2 — Resilience & error handling

**Audited** by building throwaway copies of the page and actually breaking
things, rather than reading the code and hoping:

- `_nocdn.html` — every CDN and font host rewritten to a domain that does not
  resolve, to test the blocked-CDN promise in the README.
- `_throws.html` — a deliberate `throw` injected into the first unit that runs.
- The enquiry form driven with hostile input through a stubbed `window.open`.
- A gallery image pointed at a 404 to see whether layout survives a bad deploy.

Both test builds were deleted afterwards; regenerate them with a two-line
string replace over `index.html` if you want to re-run these.

**Held up already:** with every CDN blocked, the loader still retires, all 77
reveals show, the counters read, the marquee is duplicated to 8 cards, the FAQ
opens and closes through its non-GSAP branch, the countdown works and native
scrolling works. A 404 image keeps its reserved box and shows alt text — the
`width`/`height` attributes do their job.

**Three real defects found and fixed:**

1. **`Travel month: Invalid Date` reaching the office.** `type="month"` is not
   supported in Firefox or older Android WebViews, where it renders as a plain
   text box. Whatever the visitor typed went straight into `new Date()`, and
   the enquiry arrived saying "Invalid Date". Now the value is formatted only
   when it really matches `YYYY-MM` with a month in 1–12; anything else is
   passed through as the visitor wrote it, which is still useful to the office.
   Verified across `next july`, `2026-13`, `2026-10` and empty.

2. **One throw could cost the page its enquiry form.** Everything runs inside a
   single `DOMContentLoaded` callback with no `try`/`catch` anywhere, and the
   units execute in source order — `stars`, `countdown`, `header`, `faq`, `map`,
   then `enquiry` last. A throw in any of the first five meant the form never
   got its submit handler, so submitting would do a native page reload and lose
   the enquiry entirely. That is the worst failure this page has, and
   `getContext('2d')` returning null — which privacy modes and some low-memory
   Android builds do — was enough to cause it. Each unit and each boot step now
   runs through a `safe()` wrapper, and the canvas context is null-checked.
   **Verified with a real injected throw:** `stars()` fails, logs one warning,
   and the form, FAQ, menu, countdown, map and all 100 ScrollTriggers still work.

3. **Unbounded input.** No `maxlength` anywhere, so a pasted block of text built
   an arbitrarily long `wa.me` deep link (600 characters of name produced an
   811-character message), and `Travelling: 9999 people` could be sent because
   the form is `novalidate`. Name capped at 80, phone at 20, month at 40, and
   the party size clamped to the 60 the field already advertised.

**Measured after:** no "Invalid Date" on any input tried; 100 ScrollTriggers,
countdown, marquee, FAQ, menu, map and form all working both normally and with
an injected failure; `node --check` passes; no new console errors.

---

## Iteration 3 — Cross-browser & progressive enhancement

The audience is mid-range Android in India, where old Chrome and old WebViews
are common, so the question is what breaks on a browser two or three years
behind — not on this one.

**Audited:** the inline script scanned for any ES6+ syntax (a single unparsable
token in one big inline script kills the whole page); every modern CSS feature
inventoried against its support floor; each one checked for a fallback.

**Already sound:**

- **The script is ES5-clean.** No arrow functions, `let`/`const`, template
  literals, spread, classes, `Promise` or `async`. The only two hits were
  inside comments. An old WebView parses it fine.
- `mask-image` carries its `-webkit-` prefix; `backdrop-filter` has an
  `@supports not` fallback; `100dvh` is preceded by a `100vh` declaration.

**Two real defects fixed — both cases of one unsupported selector taking
working CSS down with it:**

1. **No focus ring at all on older browsers.** The entire focus indicator was
   declared on `:focus-visible`, which is Safari 15.4+ (March 2022) and Chrome
   86+. A browser that cannot parse a selector discards the whole rule, so on
   iOS 15.3 and earlier there was no visible focus anywhere on the page — a
   WCAG 2.4.7 failure for exactly the users least likely to have updated. The
   ring is now stated on `:focus`, which every browser understands, and capable
   browsers quiet the pointer case with `:focus:not(:focus-visible)` — a
   selector old browsers also discard, so they keep an always-on ring. That is
   the correct direction to fail in. The two buttons that draw their border
   with an inset shadow get that border restored in the reset rather than
   cleared, or it would vanish while they are clicked.

2. **`.nav a:hover, .nav a:focus-visible, .nav a.here` was one rule.** On a
   browser without `:focus-visible` the whole group is dropped, taking the nav
   hover colour *and* the scrollspy's current-section state with it — two
   things that have nothing to do with focus. Split so an unsupported selector
   can only cost its own rule. Same for the `::after` underline.

**Considered and deliberately not changed:** `inset`, flexbox `gap`, `clamp()`
and `min()` all need Chrome 87 / Safari 14.1, which is a reasonable floor for
an auto-updating Android audience, and duplicating them as longhands would
bloat the stylesheet for a vanishing tail. The standalone `rotate:` property
(4 uses, Safari 14.1+) only affects decorative diamond bullets, which render as
squares on older browsers — and a naive `transform: rotate()` fallback would
double-rotate on modern ones, so it would need an `@supports not` block for a
purely cosmetic gain.

**Measured after:** keyboard focus produces `outline: solid 2px navy` plus a
5px gold halo with `:focus-visible` matching, on both the skip link and a
service link; pointer focus produces no ring; the ghost button keeps its
resting inset border both focused and unfocused; the nav `.here` state still
changes colour after the split; rules mentioning `:focus-visible` reduced from
15 to 5, and none of the remaining five are grouped with a non-focus selector.
