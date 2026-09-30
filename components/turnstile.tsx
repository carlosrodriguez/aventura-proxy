"use client";
import Script from "next/script";
import { useRef } from "react";
type TurnstileAPI = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
};
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
export function Turnstile({
  siteKey,
  nonce,
  onToken,
}: {
  siteKey: string;
  nonce: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    rendered = useRef(false);
  return (
    <>
      <div ref={container} />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        nonce={nonce}
        strategy="afterInteractive"
        onReady={() => {
          if (container.current && window.turnstile && !rendered.current) {
            rendered.current = true;
            window.turnstile.render(container.current, {
              sitekey: siteKey,
              action: "proxy",
              callback: onToken,
              "expired-callback": () => onToken(""),
              "error-callback": () => onToken(""),
            });
          }
        }}
      />
    </>
  );
}
