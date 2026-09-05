# Talbiyah Haj &amp; Umrah Service — website

One self-contained page: [index.html](index.html). No build step, no framework.
Hand-written CSS in a single `<style>` block; the only external dependencies are
GSAP + ScrollTrigger and Lenis, loaded `defer` from CDN, plus Google Fonts.

    index.html      the whole site — meta, JSON-LD, CSS, markup, motion layer
    assets/         portrait, OG image, and the eight gallery photographs
    set-domain.py   points every URL at the live domain in one pass
    robots.txt      needs the real domain (set-domain.py does it)
    sitemap.xml     ditto
    .claude/        launch.json for the local preview server

Local preview — **open it over http, not as a `file://` URL**, or the relative
`assets/` paths will not resolve:

```bash
python -m http.server 8777
```

---

## Before it goes live

1. `python set-domain.py yourdomain.com` — rewrites the canonical link, the
   OpenGraph and Twitter tags, the JSON-LD, robots.txt and sitemap.xml (11
   references). Run it again any time to change the domain.
2. **Replace the testimonials.** The four cards are copy written for the site,
   not collected reviews. Real, named pilgrim quotes only — invented reviews
   breach Google's policy and India's rules on misleading endorsements. There
   is an HTML comment above the section saying the same.
3. **Add the registration number** — the trust strip still reads
   `[Reg. no. — add yours]`, the last bracketed placeholder on the page.
4. **Confirm the two counters** — 1200+ pilgrims and 60+ departures are
   estimates nobody has verified.
5. Have **Moulavi Sadath read the Tamil section** once.
6. Submit the sitemap in Google Search Console.

---

## Source of truth for the offer

Everything about the current departure comes from the **2026 October Umrah
poster** (Oman Air), which lives in `umrah pictures/`:

| | |
|---|---|
| Travel | 30 September – 14 October 2026, Chennai, Oman Air |
| Standard | ₹1,15,000 per person |
| Hilton | ₹1,49,000 per person, four-bed sharing |
| Includes | flight, Umrah visa, hotels near the Haram, all transfers, South Indian food, Zamzam water, baggage, guided ziyarat, travel insurance |
| Kit | travel bag, passport holder, prayer mat, ihram & cap, socks, slippers, water bottle *(from the July poster)* |

**When the next season's poster is printed, these must change together:**

- the three `.pkg` cards and the `.pkg-when` banner in `#packages`
- `data-depart` on `<aside id="announce">` — this one attribute drives the
  countdown *and* the automatic retirement of the notice
- the announcement copy, English and Tamil
- the hero CTA link and every `wa.me` prefill mentioning the dates
- the enquiry form's package `<option>` list
- the `#tamil` section
- `makesOffer` in the JSON-LD

If nobody gets to it in time the page does not lie: once `data-depart`
passes, the strip asks for the next departure instead of advertising the
old one, and `#packages` and `#tamil` — both marked `[data-offer-dated]` —
are topped with a note saying the trip has left and the dates and prices
below are last season's. That is a safety net, not a substitute for
updating the four places above.

---

## How the page is built

**Motion** — all of it in the single `<script>` at the bottom, each timeline
commented with its durations and easing. Order: preloader · hero particles ·
headline split · hero parallax · stitch (the flight path that draws down the
page with the plane riding it) · service tilt · pinned horizontal journey ·
counters · marquee · countdown · FAQ · map · form · mobile bar · Lenis · boot.
No bouncy easing anywhere — `power2`, `power3`, `expo` only. Everything heavy
is gated behind `prefers-reduced-motion` and the `.no-motion` class.

**Degradation** — the page must stay readable when a CDN is slow or blocked,
which is common on Indian mobile networks. The preloader runs on CSS alone, so
it plays from the first paint and clears itself at 2.65s whether or not any
script arrives. `boot()` then polls 3.5s of real elapsed time for GSAP before
giving up and showing everything. `body.js-off` (removed once JS runs) keeps
the FAQ answers open, the counters showing their numbers, and the marquee
still.

Entrance animations are an enhancement with a deadline: `html.anim` — the
class that hides `.rv` and `.hero-ar` in the first place — is only added when
GSAP arrives while the preloader is still covering the page. Arriving later
means the visitor is already reading, so the page is left alone instead. This
is why `.rv` is visible by default in the stylesheet; do not move that
`opacity:0` back onto the bare class.

**Images** — 820px wide, jpeg q74 + webp q72, `<picture>` with explicit
width/height and `loading="lazy"`. About 560 KB for the gallery, none of it on
the first screen. Regenerate new ones the same way.

---

## Photographs and copyright

`assets/` holds eight photos from Talbiyah's own departures, chosen from
`umrah pictures/` (37 more are unused there):

    madinah-plaza · group-madinah · masjid-nabawi-detail · ziyarat-bus
    ziyarat-desert · family-ihram · pilgrim-kit · family-departure

The branded ones — the coach board, the pink scarves, the travel bag — are the
ones that persuade. Prefer those when swapping in newer pictures. Confirm the
people in them are content to appear on the site.

**`photos/` is off limits.** It holds 246 files downloaded from the web: 133
are another site's WordPress media library (its logos are in there), and 113
are press photographs whose EXIF names **AFP**, **AP**, `Mosa'ab Elshamy` and
other photographers. None of it is licensed to Talbiyah. It is gitignored, and
was purged from git history after being committed by mistake. Do not put any of
it on the site. If more imagery is needed, use Wikimedia Commons or Unsplash
and honour the licence, or take new photographs on the next departure.

---

## Backlog

Worth doing, roughly in order of value:

- **Real testimonials** — the single biggest credibility gap.
- **A booking/payment section.** How much deposit, when the balance is due,
  what happens if a visa is refused. Nobody has supplied these facts.
- **More Tamil.** The Tamil section covers the offer; the FAQ and the guide's
  story are still English-only, and Tamil is the first language of most of the
  audience.
- **A page per departure** — photos and a short account of each group, which
  gives Google something new to index and returning families something to look
  at.
- Documents checklist as a downloadable PDF the office can send on WhatsApp.
- Analytics, if wanted — nothing is loaded today and nothing tracks the
  visitor.

---

## Fixed along the way

Defects found by testing in a browser, not by reading:

- `#main` had no `position:relative`, so the flight-path overlay had no
  containing block.
- The journey section read the viewport once at boot; a resize past 900px never
  built the pinned timeline. Now `gsap.matchMedia`.
- The FAQ used a sibling selector that did not match the markup, and Chrome
  will not resolve a transitioned `0fr → 1fr` grid track. Panels are
  height-animated by GSAP instead.
- `backdrop-filter` on the stuck header made it the containing block for
  `position:fixed`, trapping the mobile nav panel inside the header bar.
- The testimonial marquee only paused on hover and focus — unreachable on a
  touch screen. It has a real pause button now (WCAG 2.2.2).
- `--gold-ink` was 4.20:1 on the tinted background, under AA. Now #806612.
- Footer headings were `<h4>` straight after an `<h2>`.
- The enquiry form assumed `window.open` worked; a blocked popup swallowed the
  whole enquiry silently.
- 35 controls were under 44px on a phone — service links were 14px tall.
- The counters were empty in the markup, so with no JS they showed only "+".
- Cormorant 300 and Amiri 700 were downloaded and never used; Amiri is now
  subset to the twelve Arabic glyphs the page actually renders.
