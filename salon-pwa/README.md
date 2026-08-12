# سالن زیبایی بانو گل — Booking PWA

A creative, fully client-side, installable **PWA** for a women's hair salon:
RTL Persian UI, Vazirmatn typeface, and an end-to-end appointment-booking flow
that works offline (no backend required).

Built with the `ui-ux-pro-max` skill for the design system, then implemented
in plain HTML/CSS/JS (no framework/build step) since this repo's only other
content is an unrelated native Android project — this lives in its own
`salon-pwa/` folder and is otherwise self-contained.

## Structure

```
salon-pwa/
├── index.html            Single-page site: hero, services, gallery,
│                          booking flow, testimonials, FAQ, footer
├── css/style.css          Design tokens + all styling
├── js/app.js              Booking logic, nav, install prompt, SW registration
├── sw.js                  Service worker (app-shell + runtime caching)
├── offline/index.html     Offline fallback page
├── manifest.json          PWA manifest (installable, shortcuts, icons)
├── icons/                 App icons (+ SVG sources and the one-off
│                          Playwright rasterizer script that generated them)
└── design-system/         Persisted ui-ux-pro-max design system (MASTER.md)
```

## Design system

Generated via:
```
python scripts/search.py "beauty salon women hair spa creative elegant" \
  --design-system --persist -p "Women Hair Salon" --variance 8 --motion 6
```

The tool's raw recommendation was **Neo-Brutalism** (thick black borders,
hard offset shadows) — appropriate for the "very creative" brief but tonally
wrong for a women's salon audience. It was adapted to a **bold editorial
luxury** treatment that keeps the creative intent (oversized asymmetric
type, bold color-blocking, organic decorative shapes, bento-style gallery)
while dropping the brutalist hard edges. Typography was swapped from the
tool's Playfair Display/Inter pairing to **Vazirmatn** (the actively
maintained, Google Fonts–hosted successor to Vazir) per the project brief,
since Latin display faces don't cover Persian glyphs. Color tokens
(blush pink / plum / gold) come from the tool's Beauty/Spa/Wellness palette,
richened with a gold accent for a more premium feel.

## Booking flow

Fully client-side — no server, no API keys:
- Service → date (native Jalali calendar via `Intl` `fa-IR-u-ca-persian`,
  no library) → time slot → contact info → confirmation.
- Bookings persist in `localStorage`; double-booking is prevented by
  checking time-range overlap against existing bookings for that day.
- Confirmation screen offers **.ics calendar download** and a **WhatsApp
  share** link; "نوبت‌های من" lists/cancels the visitor's own bookings.
- To wire this to a real backend later, replace `saveBookingRemote()` in
  `js/app.js` with an API call — the rest of the flow is unaffected.

## PWA

- `manifest.json`: installable, standalone display, RTL, app shortcut to
  jump straight to booking.
- `sw.js`: precaches the app shell on install; network-first for
  navigations (falls back to cached shell, then `offline/index.html`);
  cache-first for same-origin assets; stale-while-revalidate for the
  Google Fonts request.
- Custom install banner (`#installBanner`) captures `beforeinstallprompt`;
  shows manual "Add to Home Screen" instructions on iOS, where that event
  doesn't exist.

## Running locally

Any static file server works, e.g.:
```
cd salon-pwa
python3 -m http.server 8080
```
Then open `http://localhost:8080`. Service workers require the page to be
served over `http://localhost` or HTTPS — opening `index.html` directly via
`file://` will skip PWA features but the rest of the UI still works.

## Deploying

Static hosting only (Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any
web server) — no build step. Just serve the `salon-pwa/` folder as the site
root so `manifest.json`/`sw.js` resolve at `/`.
