(() => {
  "use strict";

  const LEAD_ENDPOINT = "https://vea-global-forge.lovable.app/api/public/submit-lead";
  const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
  const mobileQuery = window.matchMedia("(max-width: 860px)");
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = mobileQuery.matches;
  const isReduced = reducedQuery.matches;
  const body = document.body;

  body.classList.toggle("is-mobile", isMobile);
  body.classList.toggle("is-reduced", isReduced);

  document.querySelectorAll(isMobile ? ".desktop-only" : ".mobile-only").forEach((element) => element.remove());

  const hero = document.querySelector(".hero");
  const heritage = document.querySelector(".heritage");
  const controls = document.querySelector(".control-story");
  const performance = document.querySelector(".performance");
  const range = document.querySelector(".range");
  const heroVideo = hero?.querySelector("video[data-sc-scrub]");

  function makeFlow(section) {
    if (!section) return;
    section.dataset.scAct = "flow";
    section.removeAttribute("data-sc-span");
    section.removeAttribute("data-sc-dwell");
  }

  if (isMobile || isReduced) {
    makeFlow(hero);
    makeFlow(controls);
    makeFlow(range);
    heroVideo?.removeAttribute("data-sc-scrub");
    heroVideo?.removeAttribute("data-sc-src");
  }

  if (isReduced) {
    makeFlow(heritage);
    makeFlow(performance);
    performance?.querySelector("[data-sc-verify-state]")?.setAttribute("data-sc-verify-state", "proof-static-all");
  }

  if (!window.ScrollCraft) {
    document.documentElement.classList.add("sc-ready");
    return;
  }

  window.ScrollCraft.mount(document.body, { lerp: isMobile ? 0.24 : 0.18 });

  const controlVisual = controls?.querySelector("[data-control-visual]");
  const controlLabels = Array.from(controls?.querySelectorAll("[data-control-label]") || []);
  const controlSpotlights = Array.from(controls?.querySelectorAll("[data-control-spotlight]") || []);
  const controlTargets = Array.from(controls?.querySelectorAll("[data-control-target]") || []);
  const controlStops = [0.25, 0.5, 0.75];
  const controlTargetProgress = [0.12, 0.38, 0.64, 0.88];
  let activeControl = -1;

  function controlIndex(progress) {
    if (progress < controlStops[0]) return 0;
    if (progress < controlStops[1]) return 1;
    if (progress < controlStops[2]) return 2;
    return 3;
  }

  function setActiveControl(index) {
    if (index === activeControl) return;
    activeControl = index;
    controlLabels.forEach((label, itemIndex) => label.classList.toggle("is-active", itemIndex === index));
    controlSpotlights.forEach((spotlight, itemIndex) => spotlight.classList.toggle("is-active", itemIndex === index));
    controlTargets.forEach((target) => {
      const targetIndex = Number.parseInt(target.dataset.controlTarget || "0", 10);
      target.classList.toggle("is-active", targetIndex === index && target.classList.contains("control-hotspot"));
      target.setAttribute("aria-pressed", String(targetIndex === index));
    });
    if (controlVisual) controlVisual.dataset.scVerifyState = ["control-dose", "control-timer", "control-work-area", "control-start-stop"][index];
  }

  function updateControl() {
    if (isMobile || isReduced || !controls) return;
    const progress = Number.parseFloat(getComputedStyle(controls).getPropertyValue("--sc-p")) || 0;
    setActiveControl(controlIndex(progress));
  }

  controlTargets.forEach((target) => {
    target.addEventListener("click", () => {
      const index = Number.parseInt(target.dataset.controlTarget || "0", 10);
      setActiveControl(index);

      if (isMobile) {
        controlVisual?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (isReduced || !controls) return;

      const travel = Math.max(controls.offsetHeight - window.innerHeight, 0);
      const top = controls.offsetTop + travel * controlTargetProgress[index];
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  setActiveControl(0);

  const proofStage = performance?.querySelector(".performance-stage");
  const proofFrames = Array.from(performance?.querySelectorAll("[data-proof-frame]") || []);
  const proofLabels = Array.from(performance?.querySelectorAll("[data-proof-label]") || []);
  const proofButtons = Array.from(performance?.querySelectorAll("[data-proof-target]") || []);
  const proofStops = [0.14, 0.29, 0.43, 0.57, 0.71];
  const proofTargets = [0.07, 0.215, 0.36, 0.5, 0.64, 0.84];
  let activeProof = -1;

  function proofIndex(progress) {
    for (let index = 0; index < proofStops.length; index += 1) {
      if (progress < proofStops[index]) return index;
    }
    return 5;
  }

  function updateProof() {
    if (isReduced || !performance || !proofStage) return;
    const progress = Number.parseFloat(getComputedStyle(performance).getPropertyValue("--sc-p")) || 0;
    const next = proofIndex(progress);

    if (next !== activeProof) {
      activeProof = next;
      proofFrames.forEach((frame, index) => frame.classList.toggle("is-active", index === next));
      proofLabels.forEach((label, index) => label.classList.toggle("is-active", index === next));
      proofButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === next)));
      proofStage.dataset.scVerifyState = `proof-${next + 1}`;
    }

    const traceProgress = Math.min(1, Math.max(0, (progress - 0.71) / 0.17));
    proofStage.style.setProperty("--boiler-trace-offset", String(1 - traceProgress));
    proofStage.style.setProperty("--boiler-trace-opacity", String(traceProgress));
  }

  proofButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number.parseInt(button.dataset.proofTarget || "0", 10);
      if (isReduced) {
        proofFrames[index]?.scrollIntoView({ behavior: "auto", block: "center" });
        return;
      }

      if (!performance) return;
      const travel = Math.max(performance.offsetHeight - window.innerHeight, 0);
      const top = performance.offsetTop + travel * proofTargets[index];
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  const specTabs = Array.from(document.querySelectorAll("[data-spec-target]"));
  const specPanels = Array.from(document.querySelectorAll("[data-spec-panel]"));

  function setActiveSpecification(configuration, moveFocus = false) {
    specTabs.forEach((tab) => {
      const isActive = tab.dataset.specTarget === configuration;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && moveFocus) tab.focus();
    });

    specPanels.forEach((panel) => {
      const isActive = panel.dataset.specPanel === configuration;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  specTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveSpecification(tab.dataset.specTarget));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + specTabs.length) % specTabs.length;
      else if (event.key === "ArrowRight") nextIndex = (index + 1) % specTabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = specTabs.length - 1;
      else return;

      event.preventDefault();
      setActiveSpecification(specTabs[nextIndex].dataset.specTarget, true);
    });
  });

  const seamSvg = document.getElementById("glow-seam");
  const seamPath = document.getElementById("glow-seam-path");
  let seamReady = false;
  let seamProgress = -1;

  function anchorPoint(element) {
    let x = element.offsetLeft + element.offsetWidth / 2;
    let y = element.offsetTop + element.offsetHeight / 2;
    let parent = element.offsetParent;

    while (parent) {
      x += parent.offsetLeft;
      y += parent.offsetTop;
      parent = parent.offsetParent;
    }

    return { x, y };
  }

  function buildSeam() {
    if (!seamSvg || !seamPath) return;
    const anchors = Array.from(document.querySelectorAll("[data-seam-anchor]"))
      .map(anchorPoint)
      .sort((a, b) => a.y - b.y);

    if (anchors.length < 2) return;

    const width = Math.max(document.documentElement.clientWidth, window.innerWidth);
    const footer = document.querySelector(".site-footer");
    const height = Math.ceil(footer
      ? footer.offsetTop + footer.offsetHeight
      : Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    seamSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    seamSvg.setAttribute("width", String(width));
    seamSvg.setAttribute("height", String(height));
    seamSvg.style.height = `${height}px`;

    let pathData = `M ${anchors[0].x.toFixed(1)} 0 L ${anchors[0].x.toFixed(1)} ${anchors[0].y.toFixed(1)}`;

    for (let index = 1; index < anchors.length; index += 1) {
      const previous = anchors[index - 1];
      const current = anchors[index];
      const midpoint = previous.y + (current.y - previous.y) * 0.5;
      pathData += ` C ${previous.x.toFixed(1)} ${midpoint.toFixed(1)}, ${current.x.toFixed(1)} ${midpoint.toFixed(1)}, ${current.x.toFixed(1)} ${current.y.toFixed(1)}`;
    }

    seamPath.setAttribute("d", pathData);
    seamPath.style.strokeDasharray = "1";
    seamReady = true;
    seamProgress = -1;
    updateSeam();
  }

  function updateSeam() {
    if (!seamReady || !seamPath) return;
    if (isReduced) {
      seamPath.style.strokeDashoffset = "0";
      return;
    }
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    let next = Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.68) / maxScroll));
    if (quoteSection) {
      const quoteApproach = Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.78 - quoteSection.offsetTop) / (window.innerHeight * 0.45)));
      next = Math.max(next, 0.84 + quoteApproach * 0.16);
    }
    if (Math.abs(next - seamProgress) < 0.001) return;
    seamProgress = next;
    seamPath.style.strokeDashoffset = String(1 - next);
  }

  const mobileQuote = document.querySelector(".mobile-quote");
  const quoteSection = document.getElementById("quote");

  function updateMobileQuote() {
    if (!mobileQuote || !isMobile || !hero || !quoteSection) return;
    const heroEnd = hero.offsetTop + hero.offsetHeight * 0.78;
    const quoteStart = quoteSection.offsetTop - window.innerHeight * 0.25;
    const shouldShow = window.scrollY > heroEnd && window.scrollY < quoteStart;
    mobileQuote.classList.toggle("is-visible", shouldShow);
  }

  const form = document.getElementById("quote-form");
  const formStatus = document.getElementById("form-status");
  const submitButton = form?.querySelector("button[type='submit']");
  const countrySelect = form?.querySelector("select[name='country']");
  const pageLanguage = document.documentElement.lang.toLowerCase().split("-")[0] || "en";
  const apiLanguage = pageLanguage === "it" ? "it" : "en";
  const formCopy = {
    en: {
      invalid: "Please complete the required fields before requesting a quote.",
      checking: "Sending your Glow enquiry.",
      sending: "Sending request",
      success: "Thank you. Your request is in: our team will contact you shortly.",
      rateLimit: "Too many requests, please try again later.",
      failed: "We could not send your request. Please try again.",
      network: "We could not send your request. Please check your connection and try again.",
      checkForm: "Please check the form and try again."
    },
    it: {
      invalid: "Completa i campi obbligatori prima di richiedere un preventivo.",
      checking: "Invio della richiesta per Glow.",
      sending: "Invio in corso",
      success: "Grazie. Abbiamo ricevuto la tua richiesta: il nostro team ti contatterà a breve.",
      rateLimit: "Troppe richieste. Riprova più tardi.",
      failed: "Non è stato possibile inviare la richiesta. Riprova.",
      network: "Non è stato possibile inviare la richiesta. Controlla la connessione e riprova.",
      checkForm: "Controlla il modulo e riprova."
    },
    de: {
      invalid: "Bitte füllen Sie die Pflichtfelder aus, bevor Sie ein Angebot anfordern.",
      checking: "Ihre Glow-Anfrage wird gesendet.",
      sending: "Anfrage wird gesendet",
      success: "Vielen Dank. Ihre Anfrage ist eingegangen. Unser Team wird sich in Kürze bei Ihnen melden.",
      rateLimit: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
      failed: "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      network: "Ihre Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      checkForm: "Bitte prüfen Sie das Formular und versuchen Sie es erneut."
    },
    es: {
      invalid: "Complete los campos obligatorios antes de solicitar un presupuesto.",
      checking: "Enviando su consulta sobre Glow.",
      sending: "Enviando solicitud",
      success: "Gracias. Hemos recibido su solicitud: nuestro equipo se pondrá en contacto con usted en breve.",
      rateLimit: "Demasiadas solicitudes. Inténtelo de nuevo más tarde.",
      failed: "No hemos podido enviar su solicitud. Inténtelo de nuevo.",
      network: "No hemos podido enviar su solicitud. Compruebe su conexión e inténtelo de nuevo.",
      checkForm: "Revise el formulario e inténtelo de nuevo."
    }
  }[pageLanguage] || null;
  const activeFormCopy = formCopy || {
    invalid: "Please complete the required fields before requesting a quote.",
    checking: "Sending your Glow enquiry.",
    sending: "Sending request",
    success: "Thank you. Your request is in: our team will contact you shortly.",
    rateLimit: "Too many requests, please try again later.",
    failed: "We could not send your request. Please try again.",
    network: "We could not send your request. Please check your connection and try again.",
    checkForm: "Please check the form and try again."
  };
  const languageSelect = document.querySelector("[data-language-select]");

  if (languageSelect) {
    const localePath = `/${pageLanguage}/glow/`;
    if (Array.from(languageSelect.options).some((option) => option.value === localePath)) {
      languageSelect.value = localePath;
    }
    languageSelect.addEventListener("change", () => {
      const destination = languageSelect.value;
      const locale = destination.split("/").filter(Boolean)[0] || "en";
      try {
        window.localStorage.setItem("carimaliGlowLanguage", locale);
      } catch {
        // Language choice still works when storage is unavailable.
      }
      window.location.assign(`${destination}${window.location.search}${window.location.hash}`);
    });
  }

  function populateCountries() {
    if (!countrySelect) return;
    const regionNames = typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames([pageLanguage], { type: "region" })
      : null;
    const options = COUNTRY_CODES
      .map((code) => ({ code, name: regionNames?.of(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name, pageLanguage));

    options.forEach(({ code, name }) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      countrySelect.append(option);
    });
  }

  populateCountries();

  function setFormStatus(message, type = "") {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.toggle("is-error", type === "error");
    formStatus.classList.toggle("is-success", type === "success");
  }

  function markInvalidFields() {
    if (!form) return [];
    const fields = Array.from(form.querySelectorAll("input, select, textarea"));
    const invalid = fields.filter((field) => !field.checkValidity());
    fields.forEach((field) => field.setAttribute("aria-invalid", String(!field.checkValidity())));
    return invalid;
  }

  form?.addEventListener("input", (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      field.setAttribute("aria-invalid", String(!field.checkValidity()));
    }
  });

  function integerValue(value) {
    if (value === null || value === "") return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) ? parsed : null;
  }

  function apiErrorHint(result) {
    if (!result || typeof result !== "object") return activeFormCopy.checkForm;
    if (typeof result.hint === "string") return result.hint;
    if (typeof result.error === "string") return result.error;
    if (typeof result.message === "string") return result.message;
    if (Array.isArray(result.errors)) return result.errors.map(String).join(" ");
    if (result.errors && typeof result.errors === "object") return Object.values(result.errors).flat().map(String).join(" ");
    return activeFormCopy.checkForm;
  }

  function buildLeadPayload(data) {
    const extra = [
      ["Business", data.get("business_name")],
      ["City", data.get("city")],
      ["Telephone", data.get("telephone")],
      ["Groups", data.get("configuration")],
      ["Colour", data.get("colour")],
      ["Message", data.get("message")]
    ].filter(([, value]) => String(value || "").trim());
    const utm = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      if (key.startsWith("utm_")) utm[key] = value;
    });

    const payload = {
      form_type: "product_interest",
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      country: String(data.get("country") || "").toUpperCase(),
      buyer_type: String(data.get("buyer_type") || ""),
      product_interest: "Traditional",
      message: extra.map(([label, value]) => `${label}: ${String(value).trim()}`).join(" · "),
      consent_marketing: data.get("consent_marketing") === "on",
      consent_share_with_partner: data.get("consent_share_with_partner") === "on",
      page_path: window.location.href,
      utm,
      lang: apiLanguage,
      website: String(data.get("website") || "")
    };
    const cupsPerDay = integerValue(data.get("cups_per_day"));
    const venueCount = integerValue(data.get("venue_count"));
    const timeframe = String(data.get("timeframe") || "");
    const hasDistributor = String(data.get("has_distributor") || "");

    if (cupsPerDay !== null) payload.cups_per_day = cupsPerDay;
    if (venueCount !== null) payload.venue_count = venueCount;
    if (timeframe) payload.timeframe = timeframe;
    if (hasDistributor) payload.has_distributor = hasDistributor === "true";
    if (!payload.message) delete payload.message;
    return payload;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const invalid = markInvalidFields();

    if (invalid.length) {
      setFormStatus(activeFormCopy.invalid, "error");
      invalid[0].focus();
      return;
    }

    const data = new FormData(form);
    const payload = buildLeadPayload(data);
    const defaultButtonText = submitButton.textContent;

    body.classList.add("is-form-busy");
    submitButton.disabled = true;
    submitButton.textContent = activeFormCopy.sending;
    setFormStatus(activeFormCopy.checking);

    try {
      const response = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (response.status === 200 && result?.ok === true) {
        setFormStatus(activeFormCopy.success, "success");
        form.reset();
        form.querySelectorAll("[aria-invalid]").forEach((field) => field.setAttribute("aria-invalid", "false"));
      } else if (response.status === 400) {
        setFormStatus(apiErrorHint(result), "error");
      } else if (response.status === 429) {
        setFormStatus(activeFormCopy.rateLimit, "error");
      } else {
        setFormStatus(activeFormCopy.failed, "error");
      }
    } catch {
      setFormStatus(activeFormCopy.network, "error");
    } finally {
      body.classList.remove("is-form-busy");
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });

  let ticking = false;
  function update() {
    ticking = false;
    updateControl();
    updateProof();
    updateSeam();
    updateMobileQuote();
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      buildSeam();
      requestUpdate();
    }, 180);
  });

  window.addEventListener("load", () => {
    buildSeam();
    requestUpdate();
  }, { once: true });

  document.fonts.ready.then(() => {
    buildSeam();
    window.setTimeout(buildSeam, 500);
  });

  buildSeam();
  requestUpdate();
})();
