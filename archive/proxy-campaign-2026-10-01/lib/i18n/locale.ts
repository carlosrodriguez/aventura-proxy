import { headers } from "next/headers";

export async function getLocale(): Promise<"en" | "es"> {
  return (await headers()).get("x-site-language") === "es" ? "es" : "en";
}
