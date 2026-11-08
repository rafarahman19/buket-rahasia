"use client";

import * as React from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          language?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const CLOUDFLARE_DUMMY_PASS_SITEKEY = "1x00000000000000000000AA";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

export interface TurnstileWidgetProps {
  siteKey: string;
  resetSignal?: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
}

export function TurnstileWidget({
  siteKey,
  resetSignal = 0,
  onVerify,
  onExpire,
}: TurnstileWidgetProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const verifiedRef = React.useRef(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);

  const onVerifyRef = React.useRef(onVerify);
  const onExpireRef = React.useRef(onExpire);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;

  React.useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const markVerified = (token: string) => {
      verifiedRef.current = true;
      setIsVerified(true);
      setLoadError(false);
      onVerifyRef.current(token);
    };

    const markExpired = () => {
      verifiedRef.current = false;
      setIsVerified(false);
      onExpireRef.current();
    };

    const mountWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        language: "id",
        callback: (token: string) => {
          markVerified(token);
        },
        "expired-callback": () => {
          markExpired();
        },
        "error-callback": () => {
          if (siteKey === CLOUDFLARE_DUMMY_PASS_SITEKEY) {
            markVerified("cf-dummy-test-token");
            return;
          }
          setLoadError(true);
          markExpired();
        },
      });
    };

    if (window.turnstile) {
      mountWidget();
    } else {
      let script = document.getElementById(
        TURNSTILE_SCRIPT_ID
      ) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const handleLoad = () => mountWidget();
      const handleError = () => {
        if (siteKey === CLOUDFLARE_DUMMY_PASS_SITEKEY) {
          markVerified("cf-dummy-test-token");
        } else {
          setLoadError(true);
        }
      };

      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);

      // Headless / sandbox fallback ONLY for Cloudflare's official dummy test key
      if (siteKey === CLOUDFLARE_DUMMY_PASS_SITEKEY) {
        fallbackTimer = setTimeout(() => {
          if (!cancelled && !verifiedRef.current) {
            markVerified("cf-dummy-test-token");
          }
        }, 1500);
      }

      return () => {
        cancelled = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        script?.removeEventListener("load", handleLoad);
        script?.removeEventListener("error", handleError);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore cleanup errors
          }
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  React.useEffect(() => {
    if (resetSignal === 0) return;
    verifiedRef.current = false;
    setIsVerified(false);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Ignore reset errors
      }
    } else if (siteKey === CLOUDFLARE_DUMMY_PASS_SITEKEY) {
      verifiedRef.current = true;
      setIsVerified(true);
      onVerifyRef.current("cf-dummy-test-token");
    }
  }, [resetSignal, siteKey]);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div
        ref={containerRef}
        data-testid="turnstile-widget"
        data-verified={isVerified ? "true" : "false"}
        className="min-h-[65px] overflow-hidden rounded-xl"
      />
      {loadError && (
        <p role="alert" className="text-xs text-blush-700">
          Gagal memuat verifikasi keamanan Cloudflare. Periksa koneksi internetmu atau
          matikan pemblokir skrip untuk sementara ya.
        </p>
      )}
    </div>
  );
}
