import { getLocale } from "@/lib/i18n/locale";
import { siteOperatorName } from "@/lib/config";
export default async function Contact() {
  const es = (await getLocale()) === "es";
  const proxyholderEmail = process.env.PROXYHOLDER_CONTACT_EMAIL;
  return (
    <article className="container prose" lang={es ? "es" : "en"}>
      <h1>{es ? "Contacto" : "Contact"}</h1>
      <h2>
        {es
          ? "Corregir o retirar un poder"
          : "Correcting or withdrawing a proxy"}
      </h2>
      <p>
        {es
          ? "Para corregir o retirar su poder, contacte directamente a Jenny Ghetea."
          : "To correct or withdraw your proxy, contact Jenny Ghetea directly."}
      </p>
      {proxyholderEmail && (
        <p>
          <a href={`mailto:${proxyholderEmail}`}>{proxyholderEmail}</a>
        </p>
      )}
      <p>
        {es
          ? "Este sitio independiente es operado por"
          : "This independent website is operated by"}{" "}
        {siteOperatorName}.
      </p>
    </article>
  );
}
