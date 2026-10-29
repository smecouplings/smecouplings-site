# SME Couplings — website

Static site for **smecouplings.com**, built to be served by GitHub Pages.
No build step, no framework, no external fonts or CDNs: the files in this repository are the site.

## Structure

```
index.html          Home
products.html       Product families (20 categories)
about.html          Company and capability
contact.html        Contact details
404.html            Not-found page
assets/css/site.css Stylesheet
assets/js/site.js   Mobile nav toggle (the only JavaScript)
assets/img/mark.svg Logo mark
robots.txt          Crawler rules
.nojekyll           Tells GitHub Pages to serve files as-is
```

## Preview locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Serving over a local HTTP server (rather than opening the file
directly) keeps relative paths and the 404 page behaving the same way as in production.

## Before launch — checklist

- [ ] **Remove `noindex`** from every page. Each page carries
      `<meta name="robots" content="noindex, nofollow">` on purpose: while the old site is still
      live on `smecoupling.com`, indexing this one would create two pages competing for the same
      queries. Delete the line once content is at parity.
- [ ] Confirm the four hero figures on the home page (materials, size range, standards, shipping).
      They are marked with an HTML comment.
- [ ] Confirm the standards referenced on `products.html` (EN 14420, API RP 1004, NF E29-572).
      Do not claim certification that cannot be evidenced.
- [ ] Add phone / WhatsApp / address to `contact.html` (a commented-out block shows the format).
- [ ] Connect the enquiry form, or keep the email route (`contact@smecouplings.com`).
- [ ] Add `sitemap.xml` and point `robots.txt` at it.
- [ ] Bind the custom domain `smecouplings.com` in Settings → Pages, then enable Enforce HTTPS.

## Deployment

GitHub Pages serves the `main` branch, repository root.

| Setting | Value |
|---|---|
| Repository | `smecouplings/smecouplings-site` (public) |
| Branch | `main` / `/ (root)` |
| Preview URL | `https://smecouplings.github.io/smecouplings-site/` |
| Production | `https://smecouplings.com` (after custom domain + DNS) |

Paths are **relative** (`assets/css/site.css`, `products.html`) so the site renders correctly both
under the `/smecouplings-site/` preview path and at the domain root. If the site later moves to
directory-style URLs (`/products/camlock/`), switch to root-absolute paths at that point.

## Content status

The copy is a working draft written from the existing product range. Product pages, photography and
specification tables are still to come — the current pages exist so the domain, hosting and
deployment chain can be verified end to end before content work begins.
