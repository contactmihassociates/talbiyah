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

Two gotchas that will waste your time otherwise:

- **Lenis owns the scroll.** `window.scrollTo()` and `scrollIntoView()` move
  the document but do not tick Lenis, so ScrollTrigger never updates and the
  page looks blank in a screenshot. Drive it with real wheel events, or load
  `index.html#section` to land there.
- **Screenshots of the preview pane are unreliable on tall pages.** Check the
  DOM (`getComputedStyle`, `getBoundingClientRect`) rather than trusting a
  blank image.

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

---

## Pick up here

In order of value:

1. **Real testimonials.** Biggest credibility gap on the page. Ask the office
   for four named quotes; the markup is ready.
2. **Booking and payment.** Deposit, balance date, what happens if a visa is
   refused. A buyer asks this before enquiring and the page cannot answer it.
   Needs facts from the office — do not guess.
3. **More Tamil.** The offer is in Tamil; the FAQ and the guide's story are
   not. Most of the audience reads Tamil first. Reuse the office's own poster
   wording rather than translating.
4. **A page per departure** — photos and a short account of each group. Gives
   Google something new to index and returning families something to look at.
5. Documents checklist as a PDF the office can send on WhatsApp.

Verified working at last check: 89 ScrollTriggers, no failed requests, hero and
loader, pinned horizontal journey, counters reading correctly before they roll,
marquee pause, accordion, countdown at 25 days, enquiry form composing the
right WhatsApp message, no horizontal overflow at 360px, one `h1` and no
skipped heading levels, no unlabelled control.
