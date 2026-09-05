#!/usr/bin/env python3
"""Point the site at its live domain.

The page ships with https://REPLACE-WITH-YOUR-DOMAIN.com/ in the canonical
link, the OpenGraph and Twitter tags, the JSON-LD, robots.txt and sitemap.xml.
Miss one and Google indexes a URL that does not exist, or WhatsApp shows no
preview card. This replaces every one of them in a single pass.

    python set-domain.py talbiyahchennai.com

Run it again with a different domain to change it; it rewrites whatever is
there now, so it is safe to repeat.
"""
import io
import os
import re
import sys

PLACEHOLDER = 'REPLACE-WITH-YOUR-DOMAIN.com'
FILES = ['index.html', 'robots.txt', 'sitemap.xml']


def normalise(raw):
    """Accept talbiyah.com, www.talbiyah.com, https://talbiyah.com/ ..."""
    d = raw.strip().rstrip('/')
    d = re.sub(r'^https?://', '', d)
    if not re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', d, re.I):
        sys.exit('Not a domain: %r' % raw)
    return d


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    domain = normalise(sys.argv[1])
    here = os.path.dirname(os.path.abspath(__file__))

    # Whatever domain is in the files now — the placeholder on a first run,
    # the previous domain on a later one.
    idx = io.open(os.path.join(here, 'index.html'), encoding='utf-8').read()
    m = re.search(r'<link rel="canonical" href="https://([^/"]+)/?"', idx)
    current = m.group(1) if m else PLACEHOLDER

    if current == domain:
        print('Already set to %s — nothing to do.' % domain)
        return

    total = 0
    for name in FILES:
        path = os.path.join(here, name)
        if not os.path.exists(path):
            print('  skipped %s (not found)' % name)
            continue
        text = io.open(path, encoding='utf-8').read()
        hits = text.count(current)
        if hits:
            io.open(path, 'w', encoding='utf-8', newline='').write(
                text.replace(current, domain))
        print('  %-12s %d replaced' % (name, hits))
        total += hits

    print('\n%s -> %s  (%d references)' % (current, domain, total))
    if total:
        print('\nStill to do by hand:')
        print('  - upload assets/og-image.jpg so https://%s/og-image.jpg resolves,' % domain)
        print('    or edit the og:image and twitter:image tags to assets/og-image.jpg')
        print('  - submit https://%s/sitemap.xml in Google Search Console' % domain)


if __name__ == '__main__':
    main()
