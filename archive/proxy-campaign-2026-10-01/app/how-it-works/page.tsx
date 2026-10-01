import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/locale";
export default async function Page() {
  const locale = await getLocale();
  redirect(locale === "es" ? "/verification?lang=es" : "/verification");
}
