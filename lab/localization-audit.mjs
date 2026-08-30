import { chromium } from "playwright-core";

const baseUrl = process.env.GLOW_BASE_URL || "http://localhost:4578";
const leadEndpoint = "https://vea-global-forge.lovable.app/api/public/submit-lead";
const locales = {
  en: {
    cta: "Get pricing",
    invalid: "Please complete the required fields",
    title: "Carimali Glow | Professional 2-Group Espresso Machine"
  },
  it: {
    cta: "Scopri i prezzi",
    invalid: "Completa i campi obbligatori",
    title: "Carimali Glow | Macchina espresso professionale a 2 gruppi"
  },
  de: {
    cta: "Preise anfragen",
    invalid: "Bitte füllen Sie die Pflichtfelder aus",
    title: "Carimali Glow | Professionelle 2-gruppige Espressomaschine"
  },
  es: {
    cta: "Consultar precios",
    invalid: "Complete los campos obligatorios",
    title: "Carimali Glow | Máquina de espresso profesional de 2 grupos"
  }
};

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const results = [];

for (const [locale, expected] of Object.entries(locales)) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(`${baseUrl}/${locale}/glow/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("html.sc-ready");
    await page.evaluate(() => document.fonts.ready);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < pageHeight; top += Math.round(viewport.height * 0.8)) {
      await page.evaluate((scrollTop) => window.scrollTo({ top: scrollTop, behavior: "instant" }), top);
      await page.waitForTimeout(35);
    }
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      selectedLanguage: document.querySelector("[data-language-select]")?.value || "",
      ctas: Array.from(document.querySelectorAll(".site-quote-action, .hero-copy .primary-action, .proof-cta .primary-action, .form-submit, .mobile-quote"))
        .map((element) => element.textContent.trim()),
      overflow: document.documentElement.scrollWidth - innerWidth,
      h1Count: document.querySelectorAll("h1").length,
      brokenImages: Array.from(document.images)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      alternates: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
      headerOverflow: (() => {
        const header = document.querySelector(".site-bar");
        return header ? header.scrollWidth - header.clientWidth : 0;
      })()
    }));

    await page.locator('#quote-form button[type="submit"]').click();
    state.invalidMessage = (await page.locator("#form-status").textContent())?.trim() || "";
    state.locale = locale;
    state.viewport = `${viewport.width}x${viewport.height}`;
    state.errors = errors;
    state.expected = expected;
    results.push(state);
    await page.close();
  }
}

const payloadResults = [];
for (const locale of Object.keys(locales)) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let payload = null;
  await page.route(leadEndpoint, async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto(`${baseUrl}/${locale}/glow/?utm_source=localization-audit`, { waitUntil: "domcontentloaded" });
  await page.fill('[name="name"]', "TEST — intercepted");
  await page.fill('[name="email"]', "test@example.com");
  await page.selectOption('[name="country"]', "IT");
  await page.selectOption('[name="buyer_type"]', "cafe");
  await page.check('[name="consent_share_with_partner"]');
  await page.locator('#quote-form button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector("#form-status")?.classList.contains("is-success"));
  payloadResults.push({ locale, payload });
  await page.close();
}

const switcherPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await switcherPage.goto(`${baseUrl}/en/glow/#performance`, { waitUntil: "domcontentloaded" });
await switcherPage.selectOption("[data-language-select]", "/it/glow/");
await switcherPage.waitForURL(/\/it\/glow\/#performance$/);
const switcherResult = {
  path: new URL(switcherPage.url()).pathname,
  hash: new URL(switcherPage.url()).hash,
  stored: await switcherPage.evaluate(() => localStorage.getItem("carimaliGlowLanguage"))
};
await switcherPage.close();
await browser.close();

const failures = results.flatMap((result) => {
  const items = [];
  if (result.lang !== result.locale) items.push(`lang is ${result.lang}`);
  if (result.title !== result.expected.title) items.push(`unexpected title: ${result.title}`);
  if (result.selectedLanguage !== `/${result.locale}/glow/`) items.push(`language selector is ${result.selectedLanguage}`);
  if (result.ctas.some((label) => label !== result.expected.cta)) items.push(`CTA labels: ${result.ctas.join(" | ")}`);
  if (!result.invalidMessage.startsWith(result.expected.invalid)) items.push(`validation message: ${result.invalidMessage}`);
  if (result.overflow > 1) items.push(`horizontal overflow ${result.overflow}px`);
  if (result.headerOverflow > 1) items.push(`header overflow ${result.headerOverflow}px`);
  if (result.h1Count !== 1) items.push(`h1 count ${result.h1Count}`);
  if (result.brokenImages.length) items.push(`broken images: ${result.brokenImages.join(", ")}`);
  if (!result.canonical.endsWith(`/${result.locale}/glow/`)) items.push(`canonical: ${result.canonical}`);
  if (result.alternates !== 5) items.push(`hreflang count ${result.alternates}`);
  if (result.errors.length) items.push(`browser errors: ${result.errors.join(" | ")}`);
  return items.map((item) => `${result.locale} ${result.viewport}: ${item}`);
});

if (switcherResult.path !== "/it/glow/" || switcherResult.hash !== "#performance" || switcherResult.stored !== "it") {
  failures.push(`language switcher failed: ${JSON.stringify(switcherResult)}`);
}

for (const { locale, payload } of payloadResults) {
  const expectedApiLanguage = locale === "it" ? "it" : "en";
  if (payload?.lang !== expectedApiLanguage) failures.push(`${locale} payload lang: ${payload?.lang}`);
  if (payload?.product_interest !== "Traditional") failures.push(`${locale} product_interest: ${payload?.product_interest}`);
  if (!payload?.page_path?.includes(`/${locale}/glow/`)) failures.push(`${locale} page_path: ${payload?.page_path}`);
  if (payload?.utm?.utm_source !== "localization-audit") failures.push(`${locale} UTM missing`);
}

console.log(JSON.stringify({ results, payloadResults, switcherResult, failures }, null, 2));
if (failures.length) process.exitCode = 1;
