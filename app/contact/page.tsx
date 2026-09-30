import { getLocale } from "@/lib/i18n/locale";
import { siteOperatorName } from "@/lib/config";
export default async function Contact() {
  const es = (await getLocale()) === "es";
  const proxyholderEmail = process.env.PROXYHOLDER_CONTACT_EMAIL;
  const email = process.env.CONTACT_EMAIL;
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
          ? "Contacte directamente a Jenny Ghetea sobre cualquier corrección o retiro de un poder que le haya otorgado. Contactarla no revoca automáticamente el poder. Este sitio no cancela poderes ni registra solicitudes de revocación."
          : "Contact Jenny Ghetea directly about correcting or withdrawing a proxy you have given her. Contacting her does not automatically revoke the proxy. This website does not cancel proxies or record revocation requests."}
      </p>
      {proxyholderEmail ? (
        <p>
          <a href={`mailto:${proxyholderEmail}`}>{proxyholderEmail}</a>
        </p>
      ) : (
        <p>
          {es
            ? "Aún no se han publicado los datos de contacto de Jenny. Solicite su contacto directo a la persona que le compartió esta iniciativa."
            : "Jenny’s contact details have not been published yet. Ask the person who shared this initiative for her direct contact information."}
        </p>
      )}
      <h2>{es ? "Otras preguntas" : "Other questions"}</h2>
      {email && (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
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
