import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});

const results = [];

async function auditPage(width, height, reducedMotion = "no-preference") {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto("http://localhost:4577", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html.sc-ready");
  await page.evaluate(() => document.fonts.ready);
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += Math.round(height * 0.8)) {
    await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => {
    const missingTargets = Array.from(document.querySelectorAll('a[href^="#"]'))
      .map((link) => link.getAttribute("href"))
      .filter((href) => href !== "#" && !document.querySelector(href));
    const brokenImages = Array.from(document.images)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    const unlabeledFields = Array.from(document.querySelectorAll("input, select, textarea"))
      .filter((field) => !field.closest("label") && !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby"))
      .map((field) => field.getAttribute("name"));
    const footer = document.querySelector(".site-footer");
    const footerBottom = footer ? footer.getBoundingClientRect().bottom + scrollY : 0;

    return {
      overflow: document.documentElement.scrollWidth - innerWidth,
      footerExcess: document.documentElement.scrollHeight - footerBottom,
      brokenImages,
      missingTargets,
      unlabeledFields,
      h1Count: document.querySelectorAll("h1").length,
      heroVideoSource: document.querySelector("video")?.currentSrc || "",
      pricingLabels: Array.from(document.querySelectorAll(".site-quote-action, .hero-copy .primary-action, .proof-cta .primary-action, .form-submit, .mobile-quote"))
        .map((element) => element.textContent.trim()),
      headerCtaAnimation: getComputedStyle(document.querySelector(".site-quote-action")).animationName,
      visibleProofFrames: Array.from(document.querySelectorAll("[data-proof-frame]"))
        .filter((frame) => Number.parseFloat(getComputedStyle(frame).opacity) > 0.9).length
    };
  });

  if (width === 1280 && reducedMotion === "no-preference") {
    await page.locator('[data-control-label="1"] button').click();
    await page.waitForTimeout(1600);
    state.clickedControl = await page.evaluate(() => ({
      active: document.querySelector('[data-control-label="1"]')?.classList.contains("is-active") || false,
      pressed: document.querySelector('#control-hotspot-timer')?.getAttribute("aria-pressed") || "false",
      state: document.querySelector("[data-control-visual]")?.getAttribute("data-sc-verify-state") || ""
    }));

    await page.locator('[data-control-label="3"] button').click();
    await page.waitForTimeout(1600);
    state.clickedStartStop = await page.evaluate(() => ({
      active: document.querySelector('[data-control-label="3"]')?.classList.contains("is-active") || false,
      pressed: document.querySelector('#control-hotspot-start-stop')?.getAttribute("aria-pressed") || "false",
      state: document.querySelector("[data-control-visual]")?.getAttribute("data-sc-verify-state") || ""
    }));

    await page.locator('[data-proof-target="3"]').click();
    await page.waitForTimeout(1600);
    state.clickedProof = await page.evaluate(() => ({
      active: document.querySelector('[data-proof-label="3"]')?.classList.contains("is-active") || false,
      pressed: document.querySelector('[data-proof-target="3"]')?.getAttribute("aria-pressed") || "false",
      frameOpacity: Number.parseFloat(getComputedStyle(document.querySelector('[data-proof-frame="3"]')).opacity)
    }));

    await page.locator('[data-spec-target="1gr"]').click();
    state.clickedSpecification = await page.evaluate(() => ({
      selected: document.querySelector('[data-spec-target="1gr"]')?.getAttribute("aria-selected") || "false",
      panelVisible: !document.querySelector('[data-spec-panel="1gr"]')?.hidden,
      defaultPanelHidden: document.querySelector('[data-spec-panel="2gr"]')?.hidden || false,
      worldLink: document.querySelector('.site-nav a[href="https://carimali.com/"]')?.textContent?.trim() || "",
      specificationRows: Array.from(document.querySelectorAll('[data-spec-panel]')).map((panel) =>
        Array.from(panel.querySelectorAll('th')).map((cell) => cell.textContent.trim()).join("|")
      )
    }));
  }

  if (width === 375 && reducedMotion === "no-preference") {
    await page.locator("#quote-form").scrollIntoViewIfNeeded();
    await page.locator("#quote-form button[type='submit']").click();
    state.invalidFormMessage = await page.locator("#form-status").textContent();
    state.invalidFormFocus = await page.evaluate(() => document.activeElement?.getAttribute("name") || "");
  }

  state.consoleErrors = errors;
  state.viewport = `${width}x${height}`;
  state.reducedMotion = reducedMotion;
  results.push(state);
  await page.close();
}

await auditPage(375, 812);
await auditPage(768, 900);
await auditPage(1280, 800);
await auditPage(1280, 800, "reduce");
await browser.close();

const failures = results.flatMap((result) => {
  const items = [];
  if (result.overflow > 1) items.push(`horizontal overflow ${result.overflow}px`);
  if (result.footerExcess > 2) items.push(`empty scroll after footer ${result.footerExcess}px`);
  if (result.brokenImages.length) items.push(`broken images: ${result.brokenImages.join(", ")}`);
  if (result.missingTargets.length) items.push(`missing anchors: ${result.missingTargets.join(", ")}`);
  if (result.unlabeledFields.length) items.push(`unlabelled fields: ${result.unlabeledFields.join(", ")}`);
  if (result.h1Count !== 1) items.push(`expected one h1, found ${result.h1Count}`);
  if (result.pricingLabels.some((label) => label !== "Get pricing")) items.push(`inconsistent pricing CTA labels: ${result.pricingLabels.join(", ")}`);
  if (result.consoleErrors.length) items.push(`console errors: ${result.consoleErrors.join(" | ")}`);
  if (result.reducedMotion === "reduce" && result.headerCtaAnimation !== "none") items.push("reduced motion left the header CTA gradient animated");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && result.headerCtaAnimation !== "site-quote-gradient-flow") items.push("header CTA gradient flow is missing");
  if (result.reducedMotion === "reduce" && result.heroVideoSource) items.push("reduced motion fetched the hero video");
  if (result.reducedMotion === "reduce" && result.visibleProofFrames !== 6) items.push(`reduced proof frames visible: ${result.visibleProofFrames}`);
  if (result.viewport === "375x812" && !result.invalidFormMessage?.startsWith("Please complete")) items.push("missing invalid form feedback");
  if (result.viewport === "375x812" && result.invalidFormFocus !== "name") items.push("invalid form did not focus the first field");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && (!result.clickedProof?.active || result.clickedProof?.pressed !== "true" || result.clickedProof?.frameOpacity < 0.9)) items.push("clickable performance feature did not activate its visual");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && (!result.clickedControl?.active || result.clickedControl?.pressed !== "true" || result.clickedControl?.state !== "control-timer")) items.push("clickable control hotspot did not activate its focus state");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && (!result.clickedStartStop?.active || result.clickedStartStop?.pressed !== "true" || result.clickedStartStop?.state !== "control-start-stop")) items.push("start and stop control hotspot did not activate its focus state");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && (result.clickedSpecification?.selected !== "true" || !result.clickedSpecification?.panelVisible || !result.clickedSpecification?.defaultPanelHidden)) items.push("configuration specification tabs did not switch panels");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && result.clickedSpecification?.worldLink !== "Carimali World") items.push("Carimali World navigation link is missing");
  if (result.viewport === "1280x800" && result.reducedMotion === "no-preference" && new Set(result.clickedSpecification?.specificationRows || []).size !== 1) items.push("configuration specification tables do not share the same row structure");
  return items.map((message) => `${result.viewport} ${result.reducedMotion}: ${message}`);
});

console.log(JSON.stringify({ results, failures }, null, 2));
if (failures.length) process.exitCode = 1;
