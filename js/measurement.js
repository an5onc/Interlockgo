(() => {
  "use strict";

  // Preview and development pages must not add traffic to the live property.
  if (window.location.origin !== "https://interlockgo.io") return;

  const analyticsId = "G-3JCBPD2PLD";
  const adsId = "AW-17605887515";
  const measureAds = document.currentScript.hasAttribute("data-google-ads");
  const rawLocation = new URL(window.location.href);
  const pageLocation = new URL(rawLocation.origin);
  pageLocation.pathname = rawLocation.pathname;
  const campaignKeys = [
    "gclid", "gbraid", "wbraid", "dclid",
    "utm_id", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
  ];
  for (const key of campaignKeys) {
    const value = rawLocation.searchParams.get(key);
    if (value && /^[a-z0-9_.~-]{1,250}$/i.test(value)) {
      pageLocation.searchParams.set(key, value);
    }
  }

  // Keep the referring origin for attribution without passing search terms or paths.
  const pageReferrer = document.referrer ? new URL(document.referrer).origin : "";
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  gtag("js", new Date());
  gtag("set", {
    page_location: pageLocation.href,
    page_referrer: pageReferrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  gtag("config", analyticsId);
  if (measureAds) gtag("config", adsId);

  document.addEventListener("click", (event) => {
    const link = event.target?.closest?.("a[href]");
    const href = link?.getAttribute("href") ?? "";
    const contact = /^(tel|sms):([+0-9. ()-]+)(?:[?;#]|$)/i.exec(href);
    if (!contact) return;

    const method = contact[1].toLowerCase();
    const number = contact[2].replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    if (method === "tel" && number === "9705155740") {
      gtag("event", "contact_phone_click", { send_to: analyticsId });
    }
    if (method === "sms" && number === "9702391354") {
      gtag("event", "contact_sms_click", { send_to: analyticsId });
    }
  });

  const loader = document.createElement("script");
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.append(loader);
})();
