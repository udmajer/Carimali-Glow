# Carimali Glow landing page

Open the current preview at [http://localhost:4577](http://localhost:4577).

The source page is `index.html`; styling and motion are in `styles.css` and `site.js`. All media used by the page lives in `assets/`.

The quote form posts directly from the browser to VEA Group's production lead endpoint. The endpoint is defined once as `LEAD_ENDPOINT` near the top of `site.js` so the planned domain change is a one-line edit.

The invalid connectivity check on 29 August 2026 was blocked by CORS for `http://localhost:4577`. No lead was created. Add the final public origin to VEA's `CORS_ALLOWED_ORIGINS` before launch; add the localhost origin only if browser-based local integration tests are required.

The proposed multilingual route and SEO structure is documented in `LOCALIZATION.md`. The shared form code already maps Italian pages to `lang: "it"` and every other language to `lang: "en"`, as required by the lead API.

To restart the preview in an environment with Node.js:

```sh
npm start
```
