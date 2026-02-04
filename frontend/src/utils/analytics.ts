type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const rawMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
const measurementId =
  typeof rawMeasurementId === "string" ? rawMeasurementId.trim() : "";

const SCRIPT_ID = "ga4-gtag";
let initialized = false;
let pageCloseBound = false;

const ensureGtag = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
  }
};

export const initAnalytics = () => {
  if (!measurementId) return false;
  if (initialized) return true;

  ensureGtag();

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, { send_page_view: false });

  initialized = true;
  return true;
};

export const trackEvent = (name: string, params?: AnalyticsParams) => {
  if (!measurementId || !window.gtag) return;
  window.gtag("event", name, params);
};

export const trackPageView = (path: string, title?: string) => {
  trackEvent("page_view", {
    page_path: path,
    page_title: title || document.title || undefined,
  });
};

export const bindPageClose = () => {
  if (!measurementId || pageCloseBound) return;
  pageCloseBound = true;

  let sent = false;
  const send = () => {
    if (sent) return;
    sent = true;
    trackEvent("page_close", { transport_type: "beacon" });
  };

  window.addEventListener("pagehide", send);
  window.addEventListener("beforeunload", send);
};
