# Changelog

Continuous optimisation of [talbiyah.in](https://www.talbiyah.in). One line per
change: the date, what changed, and why it was worth doing.

## 2026-09-25

- **Search snippet rewritten.** Title was 79 characters and led with the brand, so Google truncated it and the words people actually search ("haj packages chennai") sat behind a name they do not know yet. Now 56 characters, keyword first: *Haj & Umrah Packages from Chennai — Talbiyah Haj Service*. Description rebuilt to 147 characters and now carries the live Hajj 2027 price. OpenGraph and Twitter fields updated to match, so the business describes itself identically everywhere.
- **Added `/llms.txt` and named the AI crawlers in `robots.txt`.** Assistants answering "haj packages from Chennai" had to infer the business from a 200KB marketing page; llms.txt states the facts plainly — who runs it, the services, the Hajj 2027 prices, the real FAQ answers — and explicitly tells them not to treat the sample testimonials as reviews. robots.txt now names GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, PerplexityBot, CCBot, Bingbot and Applebot-Extended, and disallows the admin page and /api/ for each. `set-domain.py` extended to cover llms.txt so a domain change cannot leave it stale.
- **Structured data rebuilt as a linked `@graph`.** Was a single TravelAgency node; now ten nodes joined by `@id` — the organisation, a WebSite, a real Person for Moulavi Sadath (credentials, languages, and his imamate at K.P.M. Masjid), and one Service node per service so each can surface on its own. Fixed `priceRange`, which still read ₹1,15,000–₹1,49,000 and predated the Hajj tiers; the page now sells up to ₹8,00,000. Added `hasMap`. No dangling `@id` references.

