import { headers } from "next/headers";
import { ProxyFlow } from "@/components/proxy-flow";
import { submissionsEnabled } from "@/lib/config";
export default async function Sign() {
  return (
    <ProxyFlow
      enabled={submissionsEnabled()}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      nonce={(await headers()).get("x-nonce") ?? ""}
    />
  );
}
