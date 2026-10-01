import { getLocale } from "@/lib/i18n/locale";
export default async function Closed() {
  const es = (await getLocale()) === "es";
  return (
    <article className="container prose closed-site">
      <p className="eyebrow">Aventura Isles</p>
      <h1>{es ? "Este sitio está cerrado." : "This site is closed."}</h1>
      <p>
        {es
          ? "No estamos recopilando poderes en este momento."
          : "We are not collecting proxies at this time."}
      </p>
    </article>
  );
}
