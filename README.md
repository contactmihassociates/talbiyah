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
3. **Confirm the two counters** — 1200+ pilgrims and 60+ departures are
   estimates nobody has verified.
4. Have **Moulavi Sadath read all the Tamil** once — the offer section, the
   six FAQ answers, the guide's story, and the note that appears if a
   departure date passes without the page being updated.
5. **Confirm the four "Why us" promises.** They were written from the card
   and the posters, not from anything the office said, and they commit the
   business to specific things:
   - *"Nothing is subcontracted to a stranger"* — is the whole file really
     handled in-house?
   - *"He is on the flight, at the hotel, and beside you during tawaf"*
   - *"Tamil, Urdu and English"* — **Urdu is an assumption.** It is also in
     the JSON-LD as `availableLanguage: ["en","ta","ur"]`, so it is
     machine-readable. Correct both together or drop `"ur"` from both.
   - *"What is included is said out loud before you pay"*
6. **Confirm the pilgrim kit still applies.** The seven-item list (travel
   bag, passport holder, prayer mat, ihram & cap, socks, slippers, water
   bottle) comes from the **July** poster, but it is rendered inside the
   October packages block, where it reads as a promise about that trip.
7. **Check the host serves the HTML compressed.** `index.html` is 172 KB raw
   and 49 KB gzipped — a 72% saving that costs a visitor on 4G real seconds if
   the host has compression switched off. Verify with
   `curl -sI -H 'Accept-Encoding: gzip' https://yourdomain.com/ | grep -i content-encoding`;
   it should say `gzip` or `br`. Netlify, Cloudflare Pages and GitHub Pages do
   this by default; a bare nginx or Apache may not.
8. Submit the sitemap in Google Search Console.

---

## The two locations

| | |
|---|---|
| Office | No.7, 13/1, Qaide Millath Street, Chennai 600 029 |
| Masjid | Khurasani Peer Masjid (K.P.M.), LB Road, Adyar — Moulavi Sadath is Imam there |

The masjid pin is `place_id ChIJmwkFGfNnUjoRauOLW8EFx98` (12.9988242,
80.2564577). The "Open in Google Maps" link uses that id rather than a text
search, so it cannot drift to a different mosque with a similar name. The
map itself is still click-to-load — two buttons, one iframe slot, nothing
fetched until a visitor asks — because the Google embed is several hundred
KB and this page is read on 4G.

Only the office address goes in the JSON-LD `PostalAddress`; the masjid is
where he can be met, not where the business is registered.

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
- `makesOffer` in the JSON-LD — including **`validThrough`**, which must equal
  the departure date, not the day before it. The page itself keeps advertising
  through departure day (the countdown says "Today" and the strip still reads
  "Booking open"), and the structured data has to agree or a search result
  calls the offer expired while the page says it is open. `priceRange` on the
  organisation moves with the prices too.

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

**Images** — 760–820px wide, **jpeg q68 + webp q48**, `<picture>` with explicit
width/height and `loading="lazy"`. About 920 KB of webp across sixteen
photographs, none of it on the first screen.

Those quality numbers were chosen by measurement, not taste. The first pass
used q74/q72, which measured 42–49 dB PSNR against the originals — far above
the ~38 dB where loss becomes visible, so it was spending bytes nobody could
see. q68/q48 holds every image at 39.8 dB or better and is 23% smaller on the
webp path. **Regenerate from the originals in `umrah pictures/`, never by
recompressing what is already in `assets/`**, or the loss compounds.

---

## Photographs and copyright

`assets/` holds sixteen photos from Talbiyah's own departures, chosen from
`umrah pictures/` (28 more are unused there).

**The gallery** (`#departures`, thirteen tiles, masonry, natural aspect):

    madinah-plaza · group-madinah · masjid-nabawi-detail · ziyarat-bus
    ziyarat-desert · family-ihram · pilgrim-kit · family-departure
    guide-documents · guide-elderly · group-meal · airport-waiting · guide-dua

**The ziyarat band** (`#ziyarat`, three across, all cropped 4:5 at 720x900 so
the row reads evenly):

    ziyarat-explaining · ziyarat-listening · ziyarat-stop

Pictures were picked for what they *prove*, not how they look. The section
made eleven specific claims about how the ziyarat is run and showed nothing,
so the band under its opening paragraph is the evidence for it. The two
documentation photographs carry the "one office, the whole file" claim, which
nothing else on the page evidenced. The branded ones — the coach board, the
pink scarves, the travel bag — are still the ones that persuade hardest;
prefer that kind when swapping in newer pictures.

Captions are new copy written to fit the pictures; change the wording freely.
Confirm the people in them are content to appear on the site.

**Four unused files sit in `assets/`** — `sadath-alt-560/840.jpg/.webp`, 175 KB
in total. They are an alternate portrait of Moulavi Sadath that no version of
the page has ever referenced. They are kept deliberately, not by oversight: an
unreferenced file is never requested, so they cost a visitor nothing, and they
are there to swap in if the current portrait is ever replaced. To use one,
point the `<picture>` in the guide section at it and keep the `width`/`height`
attributes in step.

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
- **More Tamil.** The offer, all six FAQ answers and the guide's story are
  bilingual now (`.ta-alt`). Still English-only: the services grid, the journey
  timeline, the ziyarat list and the why-us block.
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
