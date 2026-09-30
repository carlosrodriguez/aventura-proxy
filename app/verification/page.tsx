import { getLocale } from "@/lib/i18n/locale";
import Link from "next/link";
import { authorityNotice, disclaimer } from "@/lib/config";
export default async function Page() {
  const es = (await getLocale()) === "es";
  const testMode = process.env.PROXY_TEST_MODE === "true";
  const safeguards = es
    ? [
        [
          "Complete, revise y firme",
          "Ingrese los datos de su propiedad y del firmante. Revise las instrucciones que designan a Jenny Ghetea para votar NO a los anexos A, B y C, y firme el poder.",
        ],
        [
          "Confirme su correo",
          "Ingrese el código enviado a su correo para completar la verificación. Esto comprueba que tiene acceso a esa dirección.",
        ],
        [
          "Instrucciones de voto claras",
          "Su firma queda vinculada al documento específico del poder y a sus instrucciones: Jenny Ghetea debe votar NO a los anexos A, B y C.",
        ],
        [
          "Conserve su poder completado",
          "Después de verificar el correo, completamos el formulario oficial con sus datos y firma. Puede descargar el PDF y le enviamos una copia por correo.",
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
          "Complete, review, and sign",
          "Enter your property and signer details. Review the instructions appointing Jenny Ghetea to vote NO on Exhibits A, B, and C, then sign the proxy.",
        ],
        [
          "Confirm your email",
          "Enter the code sent to your email address to complete verification. This checks that you can access that mailbox.",
        ],
        [
          "Clear voting instructions",
          "Your signature is linked to the specific proxy document and its instructions for Jenny Ghetea to vote NO on Exhibits A, B, and C.",
        ],
        [
          "Keep your completed proxy",
          "After email verification, we fill the official proxy form with your details and signature. You can download the completed PDF, and we send a copy to your email.",
        ],
        [
          "A record that can be checked",
          "We record signing and verification times and save a document fingerprint. Tamper-evident audit logging helps detect changes to the recorded history.",
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
      <p className={testMode ? "preview" : undefined}>
        {testMode
          ? es
            ? "Prueba de desarrollo: la copia de entrega se envía al destinatario de prueba configurado. Estos poderes no se presentan a la Asociación."
            : "Dev testing: the delivery copy goes to the configured test recipient. These proxies are not submitted to the Association."
          : es
            ? "Jenny Ghetea recibe una copia para imprimirla y presentarla en la reunión."
            : "Jenny Ghetea receives a copy for printing and presentation at the meeting."}
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
      <p>
        <Link className="button" href="/sign">
          {es ? "Completar mi poder NO" : "Complete my NO proxy"}
        </Link>
      </p>
      <p className="disclaimer">
        {es
          ? "Este sitio independiente es operado por SAPSLAB SERVICES LLC. No es un sitio oficial de la Asociación ni de su empresa administradora."
          : disclaimer}
      </p>
    </article>
  );
}
