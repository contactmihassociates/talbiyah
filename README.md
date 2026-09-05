# Talbiyah Haj &amp; Umrah Service — landing page

Single self-contained page: [index.html](index.html). No build step. TailwindCSS is **not**
used (the page is hand-written CSS in one `<style>` block); the only external
dependencies are GSAP + ScrollTrigger and Lenis, all from CDN with `defer`.

    index.html          the whole site — meta, JSON-LD, CSS, markup, motion layer
    assets/             portrait + OG image (moulavi-sadath-*.jpg/.webp, og-image.jpg)

## Status — complete

The first session wrote everything up to and including JS chunk A and then ran
out of tokens mid-file (the script tag and the `DOMContentLoaded` callback were
left unclosed). The second session finished the motion layer, closed the file,
and fixed four real bugs found while testing in a browser. Every animation in
the original brief is implemented; nothing is stubbed.

### Session 1 — structure (done)
- `<head>`: meta, OpenGraph, Twitter card, `LocalBusiness` + `TravelAgency`
  JSON-LD with the real address and both numbers.
- All CSS: palette tokens, type scale, Khatam-star textures, every component.
- All markup: loader, header, hero, announcement, trust strip, about the guide,
  services grid, package tiers, counters, journey, why us, testimonials, FAQ,
  contact + form, footer, sticky mobile bar.
- JS chunk A: graceful degradation, preloader timeline, hero particle canvas,
  headline char split, hero parallax (scroll + pointer), section reveals,
  header/mobile-nav.

### Session 2 — motion layer (done)
- `stitch()` — the hairline flight path draws with `stroke-dashoffset` across the
  whole page; the plane icon is placed along it with `getPointAtLength` and
  rotated to the tangent.
- `traceLengths()` — measures each service card so the CSS gold border trace
  draws its exact perimeter (`--len`), re-measured on resize.
- `serviceTilt()` — 3D pointer tilt, fine pointers only. (Stamp, ticket tear,
  passport flip and icon micro-motion are CSS transitions in the `.ico-*` rules.)
- `journey()` — `gsap.matchMedia`: pinned horizontal scroll ≥901px with each
  step's icon assembling from scattered lines via `containerAnimation`;
  vertical stack with on-enter assembly ≤900px.
- `counters()` — per-digit numeric roll columns, `expo.out`, `aria-label` carries
  the plain number.
- `marquee()` — duplicates the testimonial cards so the -50% CSS keyframe loops
  seamlessly; clones are `aria-hidden` and out of the tab order.
- FAQ accordion — one open at a time, arrow/Home/End keys, ARIA state.
- Map — click-to-load Google embed (keeps it off the initial 4G payload).
- Enquiry form — validates, then serialises into a `wa.me` deep link.
- `mobileBar()` — sticky WhatsApp/Call bar slides up past the hero.
- `smoothScroll()` — Lenis driven off the GSAP ticker (one RAF loop), anchor
  links routed through it. Skipped under `prefers-reduced-motion`.
- `boot()` — orders the inits, runs the loader, starts the hero intro after the
  wipe, refreshes ScrollTrigger on `fonts.ready` and `load`; polls up to 3.5s
  for the CDNs and falls back to a fully readable static page if they never land.

### Bugs found and fixed while testing
1. `#main` had no `position:relative`, so the absolutely-positioned `#stitch`
   overlay had no containing block.
2. The journey section read the viewport once at boot, so a resize past 900px
   never built the pinned horizontal timeline — now `gsap.matchMedia`.
3. The FAQ panel used `.faq-q[aria-expanded="true"] + .faq-a`, but the button is
   inside an `<h3>` so it is not the panel's sibling. Chrome also refused to
   resolve the transitioned `0fr → 1fr` track. Panels are now height-animated by
   GSAP, with `body:not(.js-off)` collapsing them so a no-JS visitor sees every
   answer open.
4. `.hdr.stuck` has `backdrop-filter`, which makes the header the containing
   block for `position:fixed` children — the mobile nav panel was therefore
   trapped inside the header bar and visible over the page. It is now positioned
   against the header with viewport height.

## Verified in a browser
Hero intro and loader; 69 ScrollTriggers; stitch path draws and the plane
tracks it; journey pins for 1735px of scroll and the track travels its full
1448px overflow; counters roll; marquee duplicated to 8 cards; accordion opens
one panel at a time; the enquiry form composes the correct prefilled WhatsApp
message and rejects a missing name or short phone number.

Not verified: the preview renders the file as a `data:` URL, so `assets/`
images do not resolve there and the portrait shows its alt text — open
`index.html` from disk or a server to see it. `prefers-reduced-motion` was
not exercised in the browser; every heavy timeline is gated behind the `RM`
flag and the `.no-motion` CSS class.

## Content filled in — and what is still the owner's to confirm

Session 3 wrote the remaining copy so the page reads as a finished site:

- **Testimonials** — four written cards with Tamil Nadu names and places
  (Triplicane and Adyar in Chennai, Ambur in Vellore district, Kilakarai in
  Ramanathapuram). **These are drafts, not collected reviews.** Replace each
  quote with the words of a real pilgrim who agreed to be named before the page
  is published — invented reviews breach Google's policy and India's consumer
  protection rules on misleading endorsements. An HTML comment above the section
  says the same thing.
- **Package tiers** — sample inclusions: Economy 1.5 km with shuttle, 5–6
  sharing, 4+3 nights; Standard ~700 m walking, 3–4 sharing, 5+4 nights,
  breakfast and dinner; Premium within 300 m, twin, 6+4 nights, all meals.
  Check every one against what you actually sell this season.
- **Counters** — "Since 2011" (fifteen years back from 2026); the 1200+ pilgrims
  and 60+ departures figures are still estimates to confirm.
- **Registration number** in the trust strip is deliberately left as
  `[Reg. no. — add yours]`. A registration number is a legal identifier and is
  not something to invent — paste in the real one.
- **`og:image` absolute URL** in the head and the JSON-LD `url` still need the
  live domain.

## Brand mark
The header logo was the same 8-point Khatam star used for the preloader and the
page's background texture. It is now a mihrab arch — two nested hairlines over a
threshold rule with a small diamond at the crown — so the mark reads as its own
thing rather than a repeat of the texture. Stroke weight was raised to 3.4 user
units so it stays legible at 34px.

## Tuning the motion
Every timeline in the `<script>` block carries a comment naming its durations
and easing. Ordered as: 1 preloader · 2a hero particles · 2b headline split ·
2c hero intro/parallax · 3 stitch · 4 service tilt · 5 journey · 6 counters ·
7 marquee, then FAQ / map / form / mobile bar / Lenis / boot. No bouncy easing
anywhere — `power2`, `power3`, `expo` only.
