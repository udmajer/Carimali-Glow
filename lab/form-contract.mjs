import { chromium } from "playwright-core";

const LEAD_ENDPOINT = "https://vea-global-forge.lovable.app/api/public/submit-lead";
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const failures = [];
let responseMode = "success";
let capturedPayload = null;
let successPayload = null;

await page.route(LEAD_ENDPOINT, async (route) => {
  capturedPayload = route.request().postDataJSON();
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (responseMode === "network") {
    await route.abort("failed");
    return;
  }

  const responses = {
    success: { status: 200, body: JSON.stringify({ ok: true }) },
    invalid: { status: 400, body: JSON.stringify({ hint: "Readable API validation hint" }) },
    limited: { status: 429, body: JSON.stringify({ error: "rate_limited" }) }
  };
  await route.fulfill({
    ...responses[responseMode],
    contentType: "application/json"
  });
});

async function loadForm() {
  await page.goto("http://localhost:4577/?utm_source=qa&utm_campaign=glow", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html.sc-ready");
}

async function fillRequired() {
  await page.fill('[name="name"]', "TEST — intercepted");
  await page.fill('[name="email"]', "test@example.com");
  await page.selectOption('[name="country"]', "IT");
  await page.selectOption('[name="buyer_type"]', "cafe");
  await page.check('[name="consent_share_with_partner"]');
}

async function submitAndWait(expectedText) {
  const submit = page.locator('#quote-form button[type="submit"]');
  await submit.click();
  const disabledInFlight = await submit.isDisabled();
  if (!disabledInFlight) failures.push(`${responseMode}: submit button was not disabled in flight`);
  await page.waitForFunction((text) => document.querySelector("#form-status")?.textContent.includes(text), expectedText);
}

await loadForm();
await fillRequired();
await page.fill('[name="business_name"]', "Test café");
await page.fill('[name="city"]', "Milan");
await page.fill('[name="telephone"]', "+39 000");
await page.selectOption('[name="configuration"]', "3GR");
await page.selectOption('[name="timeframe"]', "3m");
await page.fill('[name="cups_per_day"]', "150");
await page.fill('[name="venue_count"]', "2");
await page.selectOption('[name="colour"]', "Blue");
await page.selectOption('[name="has_distributor"]', "false");
await page.fill('[name="message"]', "Please contact me");
await page.check('[name="consent_marketing"]');
await submitAndWait("Thank you. Your request is in");
successPayload = structuredClone(capturedPayload);

const expectedKeys = [
  "buyer_type",
  "consent_marketing",
  "consent_share_with_partner",
  "country",
  "cups_per_day",
  "email",
  "form_type",
  "has_distributor",
  "lang",
  "message",
  "name",
  "page_path",
  "product_interest",
  "timeframe",
  "utm",
  "venue_count",
  "website"
];
const capturedKeys = Object.keys(successPayload || {}).sort();
if (JSON.stringify(capturedKeys) !== JSON.stringify(expectedKeys)) {
  failures.push(`payload keys differ: ${capturedKeys.join(", ")}`);
}

const expectedValues = {
  form_type: "product_interest",
  name: "TEST — intercepted",
  email: "test@example.com",
  country: "IT",
  buyer_type: "cafe",
  product_interest: "Traditional",
  message: "Business: Test café · City: Milan · Telephone: +39 000 · Groups: 3GR · Colour: Blue · Message: Please contact me",
  cups_per_day: 150,
  venue_count: 2,
  timeframe: "3m",
  has_distributor: false,
  consent_marketing: true,
  consent_share_with_partner: true,
  lang: "en",
  website: ""
};

for (const [key, value] of Object.entries(expectedValues)) {
  if (successPayload?.[key] !== value) failures.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(successPayload?.[key])}`);
}
if (successPayload?.utm?.utm_source !== "qa" || successPayload?.utm?.utm_campaign !== "glow") failures.push("UTM parameters were not captured");
if (!successPayload?.page_path?.includes("utm_source=qa")) failures.push("page_path is not the full URL");
if (await page.inputValue('[name="name"]')) failures.push("success did not reset the form");

for (const scenario of [
  ["invalid", "Readable API validation hint"],
  ["limited", "Too many requests, please try again later."],
  ["network", "We could not send your request."]
]) {
  [responseMode] = scenario;
  await loadForm();
  await fillRequired();
  await submitAndWait(scenario[1]);
  if ((await page.inputValue('[name="name"]')) !== "TEST — intercepted") failures.push(`${responseMode}: form input was not preserved`);
}

await loadForm();
await page.locator('#quote-form button[type="submit"]').click();
if (!(await page.locator("#form-status").textContent())?.startsWith("Please complete")) failures.push("empty form did not show client validation feedback");
if ((await page.evaluate(() => document.activeElement?.getAttribute("name"))) !== "name") failures.push("empty form did not focus the first invalid field");

await browser.close();

console.log(JSON.stringify({ successPayload, failures }, null, 2));
if (failures.length) process.exitCode = 1;
