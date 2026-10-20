import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { proxyConfig, disclaimer, submissionsEnabled } from "@/lib/config";
export default async function Home() {
  const es = (await getLocale()) === "es";
  const enabled = submissionsEnabled();
  const faqs = es
    ? [
        [
          "¿Qué es el quórum?",
          "Es la participación mínima necesaria para que se celebre la reunión. Si no puede asistir, este poder permite que su vivienda esté representada para establecer el quórum.",
        ],
        [
          "¿Este poder vota por candidatos?",
          "No. El paquete de la Asociación indica que los poderes no se pueden usar para elegir a los miembros de la Junta. Los votos se emiten en la reunión mediante una boleta escrita.",
        ],
        [
          "¿Quién recibe mi poder?",
          "Jenny Ghetea recibe una copia para imprimirla y presentarla en la reunión. Usted también recibe el PDF completado para sus archivos.",
        ],
        [
          "¿Quién puede firmar?",
          "La persona autorizada para votar por el lote. La Asociación determina la autoridad del firmante y si el poder cumple sus requisitos.",
        ],
      ]
    : [
        [
          "What is quorum?",
          "It is the minimum participation needed for the meeting to proceed. If you cannot attend, this proxy allows your home to be represented to help establish quorum.",
        ],
        [
          "Does this proxy vote for candidates?",
          "No. The Association’s packet says proxies cannot be used to elect Board members. Election votes are cast by written ballot at the meeting.",
        ],
        [
          "Who receives my proxy?",
          "Jenny Ghetea receives a copy for printing and presentation at the meeting. You also receive the completed PDF for your records.",
        ],
        [
          "Who can sign?",
          "The person authorized to cast the vote for the lot. The Association determines the signer’s voting authority and whether the proxy meets its requirements.",
        ],
      ];
  return (
    <article className="container participation-page" lang={es ? "es" : "en"}>
      <section className="campaign-hero">
        <p className="eyebrow">
          {es
            ? "17 de noviembre de 2026 · Reunión anual y elección"
            : "November 17, 2026 · Annual Meeting and Election"}
        </p>
        <h1>
          {es
            ? "Ayude a que la reunión alcance el quórum."
            : "Help the annual meeting reach quorum."}
        </h1>
        <p className="campaign-intro">
          {es
            ? "¿No puede asistir? Complete un poder limitado que designe a Jenny Ghetea para representar su vivienda y ayudar a establecer el quórum."
            : "Cannot attend? Complete a limited proxy appointing Jenny Ghetea to represent your home and help establish quorum."}
        </p>
        <p>
          <strong>
            {es
              ? "Este poder no vota por candidatos a la Junta."
              : "This proxy does not cast votes for Board candidates."}
          </strong>{" "}
          {es
            ? "La elección se realiza mediante boleta escrita en la reunión."
            : "The election is conducted by written ballot at the meeting."}
        </p>
        <p>
          <strong>
            {es
              ? "17 de noviembre de 2026 · 6:15 p. m."
              : "November 17, 2026 · 6:15 PM"}
          </strong>
          <br />
          {proxyConfig.meetingLocation}
        </p>
        <Link className="button" href="/sign">
          {es ? "Completar mi poder" : "Complete my quorum proxy"}
        </Link>
        {!enabled && (
          <p className="preview">
            {es
              ? "Vista previa. No se guardan ni se envían poderes."
              : "Preview only. No proxies are saved or sent."}
          </p>
        )}
      </section>
      <section className="prose">
        <h2>{es ? "Cómo funciona" : "How it works"}</h2>
        <ol>
          <li>
            {es
              ? "Ingrese su dirección y los datos de la persona autorizada para firmar."
              : "Enter your property address and the authorized signer’s details."}
          </li>
          <li>
            {es
              ? "Confirme su correo con el código que le enviamos."
              : "Confirm your email with the code we send."}
          </li>
          <li>
            {es
              ? "Revise sus datos y firme el poder. Recibirá el PDF completado; Jenny recibirá una copia para imprimirla y presentarla."
              : "Review your details and sign the proxy. You receive the completed PDF; Jenny receives a copy for printing and presentation."}
          </li>
        </ol>
        <p className="quorum-document-links">
          <Link href="/proxy-language">
            {es ? "Leer el poder oficial" : "Read the official proxy"}
          </Link>
          <a
            href="/documents/annual-meeting-2026.pdf"
            target="_blank"
            rel="noreferrer"
          >
            {es
              ? "Ver el paquete completo de la Asociación"
              : "View the complete Association packet"}
          </a>
        </p>
      </section>
      <section className="amendment-faq">
        <h2>{es ? "Preguntas frecuentes" : "Common questions"}</h2>
        {faqs.map(([title, body]) => (
          <details key={title}>
            <summary>{title}</summary>
            <p>{body}</p>
          </details>
        ))}
      </section>
      <aside className="independent-disclaimer">
        {es
          ? "Este sitio independiente es operado por SAPSLAB SERVICES LLC. No es un sitio oficial de la Asociación ni de su empresa administradora."
          : disclaimer}
      </aside>
    </article>
  );
}
