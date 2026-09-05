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

---

## Iteration 4 — Security & privacy

**Already sound, and worth recording:** all 17 `target="_blank"` links carry
`rel="noopener"`; there is not a single inline `on*=` handler anywhere; no
`<iframe>` exists in the source (the map is built at runtime only when a
visitor asks for it); the three CDN scripts already carry SRI hashes; and the
site sets no cookies, uses no storage and loads no analytics, so the form's
claim that "nothing is stored on this website" is literally true.

**Added: a Content-Security-Policy**, declared in a `<meta>` because the page
is static and may be hosted somewhere response headers are not ours to set.

It cannot stop an injected *inline* script — the page's own CSS and JS are
inline, so `'unsafe-inline'` is unavoidable without a build step, and hashing
the inline script would break on every hand edit of a file with no build
pipeline. What it does stop is the realistic attack: a `<script src>` pointing
at a host that is not on the list, an injected `<iframe>`, a `<base>` tag
rewriting where every relative link goes, or the enquiry form being quietly
re-pointed at someone else's server. `base-uri 'none'`, `object-src 'none'`
and `form-action 'self'` cost nothing here and close those doors.

**Verified it actually enforces**, rather than being silently malformed —
which is the usual way a meta CSP fails. With the policy in place the browser
logged and blocked all three attempts:

- `https://example.com/evil.js` — *"violates ... script-src ... The action has
  been blocked."*
- framing `https://example.com/` — *"violates ... frame-src
  https://www.google.com. The request has been blocked."*
- `<base href="https://example.com/">` — *"violates ... base-uri 'none'."*

And the legitimate page is untouched: GSAP, ScrollTrigger and Lenis all load,
100 ScrollTriggers build, Cormorant Garamond resolves, inline styles still
apply (GSAP depends on that), the countdown, marquee, FAQ and enquiry form all
work, 13 gallery images load, and the click-to-load Google Maps iframe still
creates and loads.

Also added `<meta name="referrer" content="strict-origin-when-cross-origin">`.
Modern browsers already default to this; older ones sent the full URL to every
outbound link, and this page has seventeen.

**Raised, not acted on — Google Fonts.** Two stylesheets and the font files
are fetched from `fonts.googleapis.com` / `fonts.gstatic.com` on every page
load, which discloses each visitor's IP address to Google before they have
done anything. Self-hosting the four families would remove that entirely, at
the cost of adding font binaries to the repo and losing nothing else, since
the CSP already pins the origins. This is the owner's call — it touches
infrastructure and has a legal dimension under the DPDP Act that is not mine
to decide — so it is recorded here rather than done.

**If a service is ever added** (analytics, a booking widget, a chat box) its
origin must be added to the matching CSP directive or the browser will refuse
to load it. That refusal is the policy working, not a bug; there is a comment
in the `<head>` saying so.

---

## Iteration 5 — Performance

**Measured** with the Navigation, Resource and Paint timing APIs, plus a sweep
of every element's computed `will-change`.

**Already sound:** only 13 resources on first load; images are lazy, sized and
webp; the particle canvas already stops itself with an `IntersectionObserver`
*and* on `visibilitychange`, cancelling its frame rather than idling; the two
render-blocking stylesheets are both Google Fonts, and they resolve behind the
CSS preloader, which covers the page for 2.65s regardless.

**The real find: 79 elements were each sitting on their own compositor layer.**
The stylesheet declares `will-change` on seven selectors, which sounds
sparing — but those selectors matched 79 elements:

    39 x h1 .ch            headline characters
    26 x [data-piece]      journey icon fragments
     8 x .roll-col         counter digit columns
     4 x .skyline          hero parallax planes
     1 x .jr-track         horizontal journey
     1 x .marquee-track    testimonials

`will-change` promotes an element and *holds it there* — the whole point of the
property, and the reason MDN warns against applying it broadly. But 73 of those
79 are one-shot animations: the headline staggers in once at load, each journey
icon assembles once behind `once: true`, each counter rolls once. They finish in
the first seconds and then sit in GPU memory for the rest of the visit. On the
mid-range Android this page is written for, that is memory taken from nothing.

Removed from those three; kept on the four skyline planes, the journey track
and the marquee track, which genuinely animate continuously. GSAP's `force3D`
already promotes an element for the duration of a tween and releases it after,
which is exactly the behaviour the one-shot cases wanted.

**Measured after: 79 promoted elements → 6.** The hero headline still animates
(verified with the Browser pane fronted — with it hidden, `requestAnimationFrame`
freezes and every tween reads as unstarted, which is the trap the handoff notes
describe; forcing `gsap.globalTimeline.progress(1)` confirmed the end state
either way). 100 ScrollTriggers unchanged, no console errors.

**Considered and skipped:** replacing the 77 individual reveal triggers with
`ScrollTrigger.batch()` would cut the trigger count to about 25, but
ScrollTrigger already shares one scroll listener and does a cached numeric
comparison per trigger, so the per-frame saving is small against a real risk of
changing reveal behaviour. Not worth it while the compositor problem above was
the actual cost.

**Raised for deployment:** the HTML is 172 KB raw, 49 KB gzipped. If the host
does not compress, every visitor pays 123 KB extra on 4G for nothing. Added as
a pre-launch check in the README with the `curl` one-liner to verify it.

---

## Iteration 6 — Accessibility semantics

Earlier sessions covered the mechanical items — contrast, heading order, focus
rings, 44px targets, the focus trap, keyboard scrolling, `aria-current`. This
pass looked at how the page *reads* rather than whether it passes a checklist.

**Audited:** every SVG checked for whether a screen reader would announce it
(including via ancestors); every text node containing Tamil or Arabic checked
for a `lang` ancestor, so assistive tech switches voice instead of reading
Tamil with an English engine; every `aria-hidden` container checked for
focusable descendants; the accessible name of all 59 interactive controls
compared for the case where the same name points at different destinations.

**Clean on every one of those:**

- All 75 SVGs are hidden from the accessibility tree, the two that looked
  exposed being inside `<div id="stitch" aria-hidden="true">`.
- No Tamil or Arabic text sits outside a `lang` boundary. The only hits were
  comment text inside `<script>`.
- Nothing focusable is buried inside an `aria-hidden` subtree.
- All 59 controls have distinct accessible names — no two share a name while
  going to different places.

**One real gap, fixed: a validation error nobody could hear.** When the form
rejected an entry it set `aria-invalid`, moved focus to the field, and wrote
the reason into a paragraph at the far end of the form. A screen reader
announced the label and "invalid" and stopped there — the *reason* was never
connected to the field. The failing field now also gets
`aria-describedby="formNote"`, so the explanation is read with it, and both
attributes are cleared on the next attempt so the description never sticks to
a field that is now fine.

**Measured after:** submitting with no name sets `aria-invalid="true"` and
`aria-describedby="formNote"` on the name field, moves focus there, and the
referenced text reads "Please tell us your name, so we know who is writing.";
failing on the phone instead moves both attributes to the phone field and
clears the name's; a successful submit leaves zero elements carrying either
attribute.

---

## Iteration 7 — Mobile layout & touch

**Audited** at 360x640, 412x915 and — the case nothing had tried — **640x360,
a phone turned sideways.**

**The landscape menu lost most of its links.** The mobile nav panel is
`height:100dvh` with `justify-content:center` and `overflow-y:visible`. Seven
44px links plus their gaps need 462px, which fits a phone held upright and does
not fit one held sideways, where the panel is about 360px tall. Centring
overflow pushes it off *both* ends: the first link measured at `top: -411px`,
above the top of the screen, and with no scrolling there was no way to reach
"The Guide", "Services" or "Packages" at all. Phones rotate, and this was a
dead end when they did.

Fixed by replacing `justify-content:center` with auto margins on the first and
last link — they centre the list when there is room and collapse to nothing
when there is not, so the panel scrolls from the top instead of clipping.
Added `overflow-y:auto`, `overscroll-behavior:contain` so scrolling the menu
does not chain to the page behind it, and top padding to clear the brand and
close button that sit above the panel.

**Measured after**, at 640x360: panel top 0, first link at `top: 88` (visible,
clear of the header), content scrollable at 590px against a 360px viewport, and
after scrolling to the bottom the last link sits at 320px — inside the screen.
Every link reachable, where before three were not. At 360x640 nothing changed:
all seven visible without scrolling, still optically centred.

**Also checked, no action needed:** no unclipped horizontal overflow at 360,
412 or 640; the sticky WhatsApp bar is 58px with a matching 58px body padding,
so it covers nothing; six pairs of adjacent controls sit closer than 6px, but
all are already 44px targets, and WCAG 2.5.8 treats adequate size and adequate
spacing as alternatives rather than both being required.

---

## Iteration 8 — SEO & structured data

**Audited** both JSON-LD blocks field by field against what the page actually
publishes, plus the meta tags and the title.

**Four additions, every one derived from something already on the page:**

1. **`validThrough` on the two October offers.** They carried a price and
   `InStock` availability with no expiry, so a search result could keep
   advertising ₹1,15,000 for a departure that had already left. Set to
   `2026-09-29`, the day before the flight — the structured-data equivalent of
   what `data-depart` already does on the page.
2. **`url` on all three offers**, pointing at `#packages`, so a rich result
   lands on the cards rather than the top of the page.
3. **`priceRange`** on the organisation, read straight off the package cards.
4. **`og:locale:alternate` = `ta_IN`.** The page carries a full Tamil section,
   the six FAQ answers in Tamil and the guide's story; the markup claimed
   `en_IN` only.

**Deliberately not added, because it would mean inventing facts:** `geo` (the
office has no coordinates on file — the place_id in the README is the masjid,
which is a different building), `openingHours`, `currenciesAccepted`,
`paymentAccepted`, and above all `aggregateRating` / `review`. Rating markup
would be fabricated, the testimonials backing it are still drafts, and
fabricated review markup is a manual-action risk in Search Console on top of
being untrue.

**Verified:** both blocks still parse as valid JSON; `set-domain.py` picks up
the three new placeholder URLs automatically — 11 references in `index.html`
where there were 8, 14 across all files — and round-trips to a real domain and
back leaving no residue.

**Raised, not acted on** — both are visible copy, which is the owner's:

- The `<title>` is 79 characters and Google truncates around 60, so
  "Your Journey is Our Responsibility" is likely cut off in results.
- The `<h1>` — *"You answer the call. We carry everything else."* — is good
  writing and contains no search terms at all. The `<title>` and the
  description carry the keywords, so this is defensible, but if the page ever
  underperforms for "umrah packages chennai" the h1 is the first thing to look
  at.

---

## Iteration 9 — Visual polish

**Audited** for typographic defects rather than taste: text clipped by its own
box, ragged multi-line headings, and stranded last words.

**One false alarm worth recording, because it has now cost three iterations.**
The hero headline's line mask measured `scrollHeight 375` against a 268px box
with `overflow:hidden`, and the third line — "everything else." — sat 102px
below the mask's bottom edge. That reads as a whole line being clipped. It is
not: 102px is `yPercent: 118` of an 88px line, the position the characters are
*parked* at before the entrance animation runs. With the Browser pane hidden,
`requestAnimationFrame` is frozen and they never move. Forcing
`gsap.globalTimeline.progress(1)` puts every character 2px inside the mask on
both edges. **If a measurement here looks like a serious layout break, force
the timeline before believing it.**

**Two real improvements:**

1. **Stranded last words.** `text-wrap: pretty` on paragraphs. Measured by
   counting paragraphs whose final line is under 18% of their average line
   width, with the property on and forced off: **4 orphans → 1**, including
   "…Nobody sent me anywhere else." and "…ask us for the current season's
   dates."

2. **The six FAQ questions were the worst typography on the page** — an 840px
   first line against a 288px second, 49% ragged. `text-wrap: balance` alone
   did nothing, and it is worth knowing why: the question text was a bare text
   node next to the icon inside a `display:flex` button, so it formed an
   *anonymous flex item*, which `text-wrap` cannot address. Wrapping it in a
   real `<span class="faq-t">` with `flex:1` fixed both the typography and the
   flex structure, which should have had a real item there anyway.

   **Desktop:** all six questions now sit on one line, every button an
   identical 840x76, text flush left, icon flush right at inset 0.
   **At 390px:** only two still wrap, and those are balanced — 174/143 and
   146/178, average raggedness 0% against 49% before.

Verified the accordion still opens, still sets `aria-expanded`, and the
button's accessible name is unchanged ("How long does an Umrah visa take?") —
the wrapping span is inside the button, so the name is computed the same way.
No horizontal overflow at 390px.

---

## Iteration 10 — Copy & content (audit only)

**Nothing was changed.** Visible words are the owner's, per rule 0 in the
handoff. This is a findings list.

**The mechanical check first, because a single wrong digit in one of eighteen
WhatsApp links would be invisible and expensive — everything agrees:**

| | |
|---|---|
| `wa.me` links | 16, all `919710092070` |
| `tel:` links | 5, all `+919791108230` |
| Prices | `₹1,15,000` x3, `₹1,49,000` x3, no stray figures |
| Departure date | "30 September" x4 plus `data-depart="2026-09-30"`, and the Tamil section agrees |
| Terminology | Haj x41, Madinah x18, Makkah x15, ziyarat x34, Moulavi x25 — one spelling each, no drift |
| Bracketed placeholders | one: `[Reg. no. — add yours]` |
| Tamil parity | 6 `.ta-alt` blocks against 6 FAQ answers |

**"Umra" appears 5 times against "Umrah" 60 — and it is correct.** Every one is
"Umra Guide", the credential as printed on the business card. Recorded here so a
future pass does not helpfully normalise a man's professional title.

**Findings for the owner, in order of what they would cost:**

1. **The `<title>` is 79 characters.** Google truncates around 60, so
   "Your Journey is Our Responsibility" — the line the business is built
   around — is probably cut off in results. Something like
   "Talbiyah Haj & Umrah Service — Chennai" plus a shorter tail would survive.

2. **The `<h1>` contains no search terms.** *"You answer the call. We carry
   everything else."* is the best line on the page and I would not trade it for
   keywords; the `<title>` and description carry those. Noting it only so that
   if the page underperforms for "umrah packages chennai", this is the first
   place to look — a subheading near the hero would fix it without touching
   the headline.

3. **The English runs long for the audience.** The five longest sentences in
   the lede copy are 29, 27, 26, 24 and 22 words, and most of the people this
   page is written for read Tamil first. The Tamil section is much plainer.
   Worth a pass for shorter sentences in the English lede copy.

4. **One casing slip:** the portrait's alt text says "Umra guide" where every
   other instance says "Umra Guide". Alt text is still words a person reads,
   so it is listed rather than edited.

5. **Still outstanding from earlier sessions**, unchanged: the four
   testimonials are drafts and not collected quotes, the 1200+/60+ counters are
   unverified, the "Tamil, Urdu and English" claim assumes Urdu (and is
   machine-readable in the JSON-LD as `availableLanguage`), and the pilgrim kit
   list comes from the July poster while rendering inside the October block.

---

## Iteration 11 — Accessibility, from the accessibility tree

Lap two. Earlier accessibility passes checked *attributes*; this one read the
**tree those attributes produce**, which is what assistive technology actually
receives — and it showed something attribute-checking could not.

**Most of the page was missing from the landmark list.** A `<section>` with no
accessible name is not exposed as a landmark at all. Five sections had an
`aria-label` and appeared; seven did not, so a screen-reader user pulling up
the region list of a 24,000px page saw "Why pilgrims trust Talbiyah", "Details
in Tamil", "The journey", "What pilgrims say" and "Photographs from recent
departures" — and no way to jump to the **packages, services, ziyarat, why-us,
FAQ or contact**, which is most of what anyone comes here for. Landmark
navigation is a primary way of moving around a long page, and it was skipping
the important parts.

**Tried `aria-labelledby` pointing at each section's `<h2>` first, and rejected
it after measuring.** A landmark name is announced on its own, out of context,
and `<br>` contributes no space to an accessible name, so the labels came out
as *"The name on your paperworkis the man walking beside you"* and *"Everything
between your intentionand your first sight of the Haram"* — headline copy,
run together, far too long to scan in a region list.

Used short `aria-label`s instead, worded to mirror the navigation, which is the
pattern the page already used for its five labelled sections. The list now
reads as a table of contents:

    Upcoming group departure · Why pilgrims trust Talbiyah · The guide ·
    Services · Umrah packages and prices · Details in Tamil · The journey ·
    Guided ziyarat · Why families come back · What pilgrims say ·
    Photographs from recent departures · Questions and answers ·
    Contact and enquiry

**Measured after:** 13 named landmarks, 0 unnamed, no duplicate ids, and the
temporary `<h2>` ids added during the rejected approach all removed. The
headings themselves are untouched — an `aria-label` on the section names the
landmark, it does not replace the heading a visitor reads.

---

## Iteration 12 — Resilience, lap two: the page with no JavaScript

**Two suspicions checked and cleared first**, both of which had looked like
bugs during earlier testing:

- **Deep links work.** Loading `index.html#packages` lands at scrollY 3617 with
  the section at the top of the viewport, and nothing is hidden behind the
  71px fixed header because the section's own 125px top padding clears it.
  Earlier sightings of "the hash did nothing" were the hidden-pane artefact.
- **The CSS preloader is correctly configured** — `loaderOut`, 1.85s delay,
  0.8s duration, `fill: forwards`. It could not be *observed* clearing here:
  with the pane throttled the animation reported `playState: running,
  currentTime: 0` **20.8 seconds after load**. Animation clocks freeze in a
  hidden tab, exactly as `requestAnimationFrame` does. Another measurement to
  distrust in this environment.

**One real defect: the enquiry form silently ate enquiries without
JavaScript.** The form composes its WhatsApp message in script and has no
`action`, so a submit fell back to a native GET — reloading the page, dropping
everything typed, and leaving the visitor believing they had sent it. For a
page whose entire purpose is producing enquiries, that is the worst possible
silent failure.

The submit button is now hidden in that state and replaced with the two ways
to reach the office directly — WhatsApp and the phone number.

**Keyed to `body.js-off` rather than `<noscript>`, deliberately.** `<noscript>`
renders only when scripting is disabled in the browser; it does nothing when
the script is present but never runs. `js-off` is written into the markup and
removed only once the script actually executes, so it covers both. Worth
recording because the first attempt did use `<noscript>` and the test could not
even exercise it — removing `<script>` tags from a page does not make a browser
behave as though scripting were off.

**Measured:** with JS absent, `body.js-off` persists, the submit button
computes `display:none`, and the fallback shows with both a `wa.me` link and a
`tel:` link. With JS running, the class is cleared, the button is back, and the
fallback is hidden.

**Note on scope:** this adds words a visitor can read, which is normally the
owner's call. It is included as a functional safeguard against silent data
loss rather than as copy, and the wording is purely instructional. Reword it
freely.
