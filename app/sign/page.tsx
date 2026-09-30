import { getLocale } from "@/lib/i18n/locale";
import { headers } from "next/headers";
import { ProxyFlow } from "@/components/proxy-flow";
import { submissionsEnabled, proxyConfig } from "@/lib/config";
export default async function Sign() {
  const locale = await getLocale();
  return (
    <ProxyFlow
      enabled={submissionsEnabled()}
      locale={locale}
      proxyholder={proxyConfig.proxyholder}
      testMode={process.env.PROXY_TEST_MODE === "true"}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      nonce={(await headers()).get("x-nonce") ?? ""}
    />
  );
}
