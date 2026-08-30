# Localization structure

The site uses separate, indexable paths for each language:

- `/en/glow/`
- `/it/glow/`
- `/de/glow/`
- `/es/glow/`

Each route has its own translated HTML, page title, description, Open Graph copy and `lang` attribute. `styles.css`, `site.js`, `scrollcraft.css`, `scrollcraft.js` and all product assets stay shared so visual and interaction updates remain one change.

The compact language selector stores the visitor's explicit choice but does not redirect by IP. Each localized page includes reciprocal `hreflang` links for `en`, `it`, `de`, `es` and `x-default`.

`index.html` is the English source template. Run `npm run build:locales` after changing page copy or structure; it regenerates the committed pages under `en/glow`, `it/glow`, `de/glow` and `es/glow` from the shared template and translation dictionary in `scripts/build-locales.mjs`.

The lead integration reads the page's `<html lang>` value. Italian pages send `lang: "it"`; English, German and Spanish pages send `lang: "en"` until the API supports more acknowledgement-email languages.
