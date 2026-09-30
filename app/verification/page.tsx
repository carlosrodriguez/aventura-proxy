import { getLocale } from "@/lib/i18n/locale";
import Link from "next/link";
import { authorityNotice, disclaimer } from "@/lib/config";
export default async function Page() {
  const es = (await getLocale()) === "es";
  const safeguards = es
    ? [
        [
          "Verificación del correo",
          "Un código de confirmación comprueba el acceso al correo electrónico utilizado para firmar.",
        ],
        [
          "Instrucciones de voto claras",
          "Su firma queda vinculada al documento específico del poder y a sus instrucciones: Jenny Ghetea debe votar NO a los anexos A, B y C.",
        ],
        [
          "Una copia para sus archivos",
          "Enviamos al firmante el PDF completado. También puede descargarlo al finalizar.",
        ],
        [
          "Un registro que se puede revisar",
          "Las fechas y horas, las huellas del documento y un registro de auditoría que permite detectar alteraciones ayudan a revisar el proceso de firma.",
        ],
        [
          "Revisión de posibles duplicados",
          "Los envíos correspondientes a la misma propiedad se marcan para revisión.",
        ],
        [
          "Documentos privados",
          "Los poderes completados, las firmas y los registros de firma no se publican en el sitio.",
        ],
        [
          "Correcciones o retiro",
          "Contacte directamente a Jenny Ghetea sobre un poder que le haya otorgado. Contactarla no revoca automáticamente el poder; este sitio no cancela poderes.",
        ],
      ]
    : [
        [
          "Email verification",
          "A confirmation code checks access to the email address used to sign.",
        ],
        [
          "Clear voting instructions",
          "Your signature is linked to the specific proxy document and its instructions for Jenny Ghetea to vote NO on Exhibits A, B, and C.",
        ],
        [
          "Owner receipt",
          "We email the signer the completed PDF for their records. It is also available to download after completion.",
        ],
        [
          "Traceability",
          "Timestamps, document fingerprints, and tamper-evident audit logging support review of the signing record.",
        ],
        [
          "Duplicate review",
          "Submissions for the same property are flagged for review.",
        ],
        [
          "Private documents",
          "Completed proxies, signatures, and signing records are not publicly listed.",
        ],
        [
          "Corrections or withdrawal",
          "Contact Jenny Ghetea directly about a proxy you have given her. Contacting her does not automatically revoke a proxy; this website does not cancel proxies.",
        ],
      ];
  return (
    <article className="container prose" lang={es ? "es" : "en"}>
      <h1>{es ? "Cómo protegemos su poder" : "How we protect your proxy"}</h1>
      <p>
        {es
          ? "Puede revisar sus instrucciones, conservar una copia y contar con un registro de cómo se completó su poder."
          : "You can review your instructions, keep a completed copy, and have a record of how your proxy was signed."}
      </p>
      {safeguards.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
      <p>
        <Link href={es ? "/contact?lang=es" : "/contact"}>
          {es ? "Información de contacto" : "Contact information"}
        </Link>
      </p>
      <p className="note">
        {es
          ? "Estas medidas ayudan a prevenir el spam, detectar posibles duplicados y conservar un registro de firma que se puede revisar. La Asociación confirma la facultad del firmante para votar y si el poder cumple sus requisitos."
          : authorityNotice}
      </p>
      <p className="disclaimer">
        {es
          ? "Este sitio independiente es operado por SAPSLAB SERVICES LLC. No es un sitio oficial de la Asociación ni de su empresa administradora."
          : disclaimer}
      </p>
    </article>
  );
}
