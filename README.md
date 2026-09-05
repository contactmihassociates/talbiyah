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

## Live offer — October 2026 (source of truth)

Prices, dates and inclusions come from the **2026 October Umrah poster** in
`umrah pictures/` (Oman Air, travel 30 September – 14 October 2026), not from
the earlier July poster. The two disagreed; the October one is the departure
still to come.

- **Standard ₹1,15,000** per person — Oman Air return from Chennai, Umrah visa,
  hotel near the Haram in Makkah and Madinah, all transfers, South Indian food,
  Zamzam water, baggage, guided ziyarat, travel insurance.
- **Hilton ₹1,49,000** per person, four-bed sharing — same flight, same group.
- **Haj & private groups** — price on request.
- Departure banner, hero CTA, every WhatsApp prefill and the enquiry form's
  package list all name the October dates.
- The kit strip under the packages (travel bag, passport holder, prayer mat,
  ihram & cap, socks, slippers, water bottle) is from the July poster.
- JSON-LD `makesOffer` carries both prices as real `Offer` entries in INR.

**When the next poster is printed**, update together: the three `.pkg` cards,
the `.pkg-when` banner, the `.announce` strip, the hero CTA link, the enquiry
form's `<option>` list, and the JSON-LD offers.

## Photographs

`assets/` carries eight photos chosen from `umrah pictures/`, resized to 820px
and saved as webp + jpg (~560 KB for the set, all lazy-loaded below the fold):

    madinah-plaza          the group outside the Prophet's Mosque
    group-madinah          pink Talbiyah shoulder scarves, walking together
    masjid-nabawi-detail   gold calligraphy inside Masjid an-Nabawi
    ziyarat-bus            the coach with the Talbiyah board in the windscreen
    ziyarat-desert         on ziyarat outside the city with the guide
    family-ihram           a father and sons in ihram
    pilgrim-kit            the Talbiyah travel bag at the airport
    family-departure       a family with lanyards before departure

They sit in a new `#departures` section (navy, gold hairline frames, CSS-column
masonry) between the testimonials and the FAQ. The branded ones — the coach
board, the pink scarves, the travel bag — are the ones doing the persuading;
prefer photos like those when swapping in newer ones. Regenerate with the same
recipe: 820px wide, jpeg q74 + webp q72, `<picture>` with explicit
width/height and `loading="lazy"`.

Faces of real pilgrims appear in several. They are the agency's own published
photos, but confirm the people in them are content to appear on the website.

## Guided ziyarat section

`#ziyarat` (between the journey timeline and Why us) lists what the ziyarat
actually visits — five sites around Makkah, six around Madinah — each with one
line on why it matters. It exists because "guided ziyarat" was listed as a
service with no detail, and it is the clearest differentiator against agencies
that run a bus-window tour.

Written from scratch for this site. It deliberately carries no fiqh rulings and
no hadith citations — it says what the coach does and what the guide explains,
and notes that site access changes with Saudi regulations. Check the list
against what your coach actually covers this season and cut anything it does
not.

## Testimonials — still drafts

Four cards with Tamil Nadu names and places (Triplicane, Adyar, Ambur,
Kilakarai). **Written copy, not collected reviews.** Replace each with the words
of a real pilgrim who agreed to be named before publishing — invented reviews
breach Google's policy and India's rules on misleading endorsements. An HTML
comment above the section says the same.

## Still the owner's to supply
- **Registration number** in the trust strip (`[Reg. no. — add yours]`). A legal
  identifier is not something to invent.
- **`og:image` absolute URL** in the head and the JSON-LD `url`, once the domain
  exists.
- The 1200+ pilgrims and 60+ departures counters are estimates to confirm.

## Brand mark
The logo was the same 8-point Khatam star used for the preloader and the page's
background texture. Both the header mark and the preloader are now a mihrab arch
— two nested hairlines over a threshold rule with a diamond at the crown. The
preloader draws its four paths in order (threshold, outer arch, inner arch,
crown) with stroke-dashoffset.

## Local preview
`.claude/launch.json` runs `python -m http.server 8777`. Open the page over
http, not as a `file://` URL — relative `assets/` paths do not resolve in the
preview pane's snapshot mode.

## Tuning the motion
Every timeline in the `<script>` block carries a comment naming its durations
and easing. Ordered as: 1 preloader · 2a hero particles · 2b headline split ·
2c hero intro/parallax · 3 stitch · 4 service tilt · 5 journey · 6 counters ·
7 marquee, then FAQ / map / form / mobile bar / Lenis / boot. No bouncy easing
anywhere — `power2`, `power3`, `expo` only.
