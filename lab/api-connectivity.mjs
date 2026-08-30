import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const browserErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});

await page.goto("http://localhost:4577", { waitUntil: "domcontentloaded" });
const result = await page.evaluate(async () => {
  const invalidPayload = {
    form_type: "product_interest",
    name: "CORS connectivity test",
    country: "IT",
    buyer_type: "cafe",
    product_interest: "Traditional",
    consent_marketing: false,
    consent_share_with_partner: true,
    page_path: location.href,
    utm: {},
    lang: "en",
    website: ""
  };

  try {
    const response = await fetch("https://vea-global-forge.lovable.app/api/public/submit-lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(invalidPayload)
    });
    return {
      reachable: true,
      status: response.status,
      body: await response.text()
    };
  } catch (error) {
    return {
      reachable: false,
      error: String(error)
    };
  }
});

console.log(JSON.stringify({ result, browserErrors }, null, 2));
await browser.close();

if (!result.reachable || result.status !== 400) process.exitCode = 1;
