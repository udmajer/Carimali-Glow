# Localization structure

Use separate, indexable paths for each language:

- `/en/glow/`
- `/it/glow/`
- `/de/glow/`
- `/es/glow/`

Each route should have its own translated HTML, page title, description, Open Graph copy and `lang` attribute. Keep `styles.css`, `site.js`, `scrollcraft.css`, `scrollcraft.js` and all product assets shared so visual and interaction updates remain one change.

Add a compact language selector only when all four routes exist. Each localized page should include reciprocal `hreflang` links for `en`, `it`, `de`, `es` and `x-default`. Do not redirect visitors by IP; remember their explicit language choice instead.

The lead integration reads the page's `<html lang>` value. Italian pages send `lang: "it"`; English, German and Spanish pages send `lang: "en"` until the API supports more acknowledgement-email languages.
