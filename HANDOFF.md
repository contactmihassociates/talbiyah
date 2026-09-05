# Handoff

For whoever — or whatever — picks this up next. [README.md](README.md) is the
project documentation; this file is only "where things stand and what to do
next". Keep both current.

**Last updated:** 5 September 2026
**Repo:** https://github.com/contactmihassociates/talbiyah (branch `main`)
**State:** the page is complete and working. Nothing is stubbed, no `TODO`
comments, no unimplemented animation.

---

## Read these before touching anything

1. **`photos/` must never reach the site or the repo.** 246 files downloaded
   from the web — 133 from another agency-guide site's WordPress media library
   (its logos are in the folder), 113 press photographs whose EXIF names
   **AFP**, **AP** and named photographers. It is gitignored and was purged
   from git history after being committed by mistake. If you need imagery, use
   `umrah pictures/` (Talbiyah's own, 37 unused) or a properly licensed source.
2. **The testimonials are drafts, not real reviews.** Four cards with Tamil
   Nadu names, written for the site. They must be replaced with real named
   quotes before publishing. Do not write more invented ones.
3. **Do not invent facts.** Registration number, payment terms, pilgrim
   counts — leave them bracketed until the office supplies them. The one
   remaining bracket on the page is `[Reg. no. — add yours]`.
4. Prices, dates and inclusions come from the **October 2026 Oman Air poster**
   in `umrah pictures/`, not from the older July poster. README lists every
   place they appear; they change together.

---

## How to work on it

```bash
python -m http.server 8777      # then open http://localhost:8777
```

`file://` will not work — the relative `assets/` paths break, and the preview
pane serves local files as `data:` URLs, so images show alt text there. Append
a `?v=N` query when reloading; `http.server` caches aggressively.

Three gotchas that will waste your time otherwise:

- **A hidden Browser pane freezes `requestAnimationFrame`.** Nothing GSAP
  drives will advance, every tween reads `progress: 0`, and it looks exactly
  like a broken animation. `setInterval` is clamped to ~1s there too. To
  check an animation's end state without a visible pane, drive the clock
  yourself: `gsap.globalTimeline.progress(1, false)`.

- **Lenis owns the scroll, and reverts anything it did not initiate.**
  `window.scrollTo()` and `scrollIntoView()` move the document and are then
  snapped back, so ScrollTrigger never updates and the page looks blank in a
  screenshot. Drive it with real wheel or key events, load
  `index.html#section` to land there, or call `lenis.scrollTo()`. This is also
  why keyboard scrolling needed its own handler — if you add another scroll
  path, route it through Lenis.
- **Screenshots of the preview pane are unreliable on tall pages.** Check the
  DOM (`getComputedStyle`, `getBoundingClientRect`) rather than trusting a
  blank image. They do not only come back blank — a capture can show a
  stale, torn frame that looks like a serious layout break (the fixed header
  stranded halfway down the page, a huge blank band above it). The fastest
  way to settle whether a break is real is to hit-test the viewport:

  ```js
  [[195,20],[195,250],[195,500],[195,820]].map(([x,y]) => {
    const e = document.elementFromPoint(x,y);
    return {y, el: e.tagName + '.' + e.className, in: e.closest('section,header')?.id};
  })
  ```

  If that agrees with `getBoundingClientRect()`, the page is fine and the
  image is lying. Screenshots are reliable again once the tab is fronted
  and any smooth scroll has settled.

Two false alarms that cost time here, so you do not repeat them:

- **`scrollWidth > clientWidth` is not horizontal overflow.** On desktop
  `documentElement.clientWidth` excludes the vertical scrollbar (1265) while
  `scrollWidth` reports the full 1280 — a 15px difference that is only the
  scrollbar. `body` already has `overflow-x:hidden`. To find genuine
  overflow, list elements whose `right` exceeds `clientWidth` **and** that
  have no ancestor with `overflow-x` hidden/clip/auto/scroll. The marquee
  track, the journey track and the stitch SVG all extend far to the right by
  design and are clipped.
- **A `.rv` element with no ScrollTrigger is not necessarily orphaned.** The
  reveal triggers are `once: true`, so ScrollTrigger kills them after they
  fire and they leave `getAll()`. Finding elements at opacity 0 with no
  trigger usually just means rAF was frozen, the trigger fired, and the
  tween never advanced. Front the tab and re-check before believing it.

Validate after any edit:

```bash
python -c "import io;s=io.open('index.html',encoding='utf-8').read();i=s.rindex('<script>');j=s.rindex('</script>');open('_c.js','w',encoding='utf-8').write(s[i+8:j])" && node --check _c.js && rm _c.js
```

---

## Done so far

| Session | Work |
|---|---|
| 1 | Head, JSON-LD, all CSS, all markup, and the first half of the motion layer. Ran out of tokens mid-script. |
| 2 | Finished the motion layer and closed the file; fixed four rendering bugs found in a browser. |
| 3 | Real content: testimonials with Tamil Nadu names, package details, counters. Pushed the first commit. |
| 4 | October 2026 pricing from the poster, an eight-photo gallery from the agency's own departures, the mihrab-arch mark replacing the Khatam star in both the header and the preloader. |
| 5 | Guided-ziyarat section — eleven sites, written from scratch after looking at what a competitor covers (nothing copied). |
| 6 | Marquee pause button, FAQPage schema, robots.txt, sitemap.xml, departure countdown that retires itself, Tamil summary section, font-payload trim, contrast and heading-order fixes, WhatsApp popup fallback, 44px touch targets, no-JS integrity, `set-domain.py`. |
| 7 | Subresource Integrity on the three CDN scripts, a print stylesheet, and a fix for `preserveAspectRatio="xMidYEnd"` — an invalid value that silently letterboxed the hero skyline instead of anchoring it to the baseline, and threw 39 console errors. |
| 8 | Tamil in the primary nav and on every form label. Found and fixed a scroll-lock bug: `body{overflow:hidden}` does not stop Lenis, so the page slid along behind the open mobile menu and during the preloader. |
| 9 | Focus trap and `inert` for the mobile menu. Found and fixed a keyboard-scrolling failure: Lenis reverts any scroll it did not initiate, so PageDown, PageUp, Space, Home, End and the arrows did nothing at all. |
| 10 | Scrollspy — `.here` and `aria-current` on the nav link whose section is under the middle of the viewport. |
| 11 | Tamil rendering of all six FAQ answers and the guide's story (`.ta-alt`, labelled "தமிழில்"). JSON-LD deliberately left English-only. |
| 12 | Fixed the Tamil size being lost to `.faq-a p` specificity; bilingual notice under the FAQ heading. Extended the departure guard: `[data-offer-dated]` on `#packages` and `#tamil` now get a "this departure has left" note once `data-depart` passes, so a flown trip is never priced as bookable. |
| 13 | Preloader moved off GSAP onto CSS — it was appearing *after* the hero had painted and covering it. Entrance animations now gated behind `html.anim` (only if GSAP beat the loader). Fixed the CDN poll counting ticks instead of elapsed time, and a 1.85s reduced-motion stall. |
| 14 | Tamil summary on the services grid; `set-domain.py` no longer advises breaking a working og:image, and its output is ASCII. Flagged the four unconfirmed why-us promises (Urdu is also in the JSON-LD). |

---

## Pick up here

In order of value:

1. **Real testimonials.** Biggest credibility gap on the page. Ask the office
   for four named quotes; the markup is ready.
2. **Booking and payment.** Deposit, balance date, what happens if a visa is
   refused. A buyer asks this before enquiring and the page cannot answer it.
   Needs facts from the office — do not guess.
3. **More Tamil, continued.** The offer, the FAQ, the guide's story and the
   services are bilingual now (`.ta-alt`). Still English-only: the journey
   timeline, the ziyarat list and the why-us block. Do the why-us block only
   after the office confirms those four claims — see README's pre-launch list.
   Have Moulavi Sadath read the Tamil already on the page before adding more.
4. **A page per departure** — photos and a short account of each group. Gives
   Google something new to index and returning families something to look at.
5. Documents checklist as a PDF the office can send on WhatsApp.

## Testing the degraded paths

The most useful tool built so far is a probe that stalls the CDN from inside
the page, because the slow-network behaviour is where the real bugs were.
Rebuild it when you need it — insert a recording script as the first thing
in `<head>`, swap the three `<script src>` tags for placeholders, and
re-inject the real URLs after N milliseconds. Three scenarios matter:

| Stall | Expect |
|---|---|
| none | `html.anim` on, ~98 ScrollTriggers, hero animates in behind the loader |
| 3s | `html.anim` **off**, hero opacity stays 1 throughout, ~20 triggers, smooth scroll and the pinned journey still initialise |
| never | everything visible, counters read `15 / 1200 / 60` as plain text, FAQ still opens, loader off-screen and swallowing no clicks |

The rule the code follows: **entrance animations are an enhancement with a
deadline.** If GSAP does not arrive before the CSS preloader finishes at
2.65s, the page is left exactly as it is rather than hiding content the
visitor is already reading. Anything that does not begin by hiding
something runs regardless.

## Verified at last check

99 ScrollTriggers · 2 valid JSON-LD blocks (TravelAgency, FAQPage) · no console
errors · no failed requests · 3 scripts carrying SRI hashes · 8 gallery images ·
11 ziyarat entries · marquee duplicated to 8 cards · countdown reading 25 days ·
counters reading 15 / 1200 / 60 before they roll · 8 `.ta-alt` blocks · 1
bracketed placeholder left (the registration number).

Checked this session: every `.rv` covered by a reveal trigger and none with an
unreachable start; the journey pin holds at 1280 (pin 6070 → 7798, 2688px
track, seven steps, horizontal travel confirmed by real wheel events); no
genuine horizontal overflow at 360, 390 or 1280; the enquiry form rejects a
missing name and a short number and otherwise composes the right WhatsApp
message; `set-domain.py` still rewrites all 11 references, normalises
`https://www.` input, is idempotent and rejects junk.

Interactions exercised with real events, not synthetic ones: mobile menu opens
and locks the scroll, focus moves into it and everything behind goes inert, the
Tamil nav link lands on its section, the accordion opens one panel at a time,
the enquiry form composes the right WhatsApp message and rejects a missing name
or short number, PageDown/Home/End scroll, a space typed into a form field
stays in the field, no horizontal overflow at 360px, one `h1` with no skipped
heading levels, no unlabelled control, every standalone tap target at least
44px.
