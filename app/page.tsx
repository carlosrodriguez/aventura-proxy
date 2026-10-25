import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { submissionsEnabled } from "@/lib/config";
const copy = {
  en: {
    eyebrow: "Annual Meeting and Board Election",
    date: "Tuesday, November 17, 2026 · 6:15 p.m.",
    location: "605 NE 193 Street, pool area",
    title: "Sign your proxy. Then come vote.",
    intro:
      "We need your proxy to help establish quorum and your presence to elect a new Board.",
    explanation:
      "Your proxy appoints Jenny Ghetea to represent your home for quorum. It does not vote for Board candidates. To cast your election ballot, attend the meeting in person.",
    updated:
      "Already signed the previous proxy? Please complete the updated proxy for the November 17 meeting.",
    cta: "Complete my proxy",
    two: "Two steps toward change",
    actions: [
      [
        "Help the meeting reach quorum.",
        "Submit your updated proxy so your home can be counted toward the participation needed for the meeting.",
      ],
      [
        "Attend and vote.",
        "Reaching quorum allows the meeting to proceed. Choosing the next Board requires owners to attend and cast their ballots. A proxy alone cannot cast your candidate votes.",
      ],
    ],
    how: "Complete your proxy online",
    steps: [
      [
        "Enter your details.",
        "Provide your property address and the name of the person authorized to vote for your home.",
      ],
      [
        "Verify your email.",
        "Enter the confirmation code we send to your email address.",
      ],
      [
        "Review and sign.",
        "Check your name and address, make any corrections, and sign. You appoint Jenny Ghetea as your proxyholder.",
      ],
      [
        "Keep your copy.",
        "You receive the completed PDF by email. Jenny receives a copy for printing and presentation at the meeting.",
      ],
    ],
    noPrint: "No printing or scanning needed when you sign through this site.",
    official: "Read the official proxy",
    packet: "View the complete Association packet",
    shareTitle: "Help other homeowners participate",
    share:
      "Share this page with other Aventura Isles owners. Encourage them to complete the updated proxy and attend the meeting.",
    shareEmphasis:
      "Every proxy helps establish quorum. Every owner who attends has the opportunity to vote for the next Board.",
    faqTitle: "Common questions",
    faqs: [
      [
        "What is quorum?",
        "Quorum is the minimum participation required for the meeting to proceed. Your proxy helps your home count toward that requirement.",
      ],
      [
        "Does this proxy vote for candidates?",
        "No. The Association’s packet states that proxies cannot be used to elect Board members. Candidate votes are cast by written ballot at the meeting.",
      ],
      [
        "I signed the previous proxy. What should I do?",
        "Please complete the updated proxy for the November 17 meeting.",
      ],
      [
        "Who receives my proxy?",
        "Jenny Ghetea receives a copy to print and present at the meeting. You also receive the completed PDF for your records.",
      ],
      [
        "Who can sign?",
        "The person authorized to vote for the property. The Association confirms the signer’s voting authority and whether the proxy meets its requirements.",
      ],
      [
        "How do I correct or withdraw my proxy?",
        "Contact Jenny Ghetea directly.",
      ],
    ],
    closeTitle: "Let’s show up for Aventura Isles.",
    close:
      "Complete your updated proxy, share this page, and attend the meeting to vote.",
    disclosure:
      "This independent website is operated by SAPSLAB SERVICES LLC. It is not an official Association or management company website.",
    preview: "Preview only. No proxies are saved or sent.",
  },
  es: {
    eyebrow: "Reunión anual y elección de la Junta",
    date: "Martes 17 de noviembre de 2026 · 6:15 p. m.",
    location: "605 NE 193 Street, área de la piscina",
    title: "Firme su proxy. Venga a votar.",
    intro:
      "Necesitamos su proxy para alcanzar el quórum y su presencia para elegir una nueva Junta Directiva.",
    explanation:
      "Al firmar, designa a Jenny Ghetea para representar su vivienda a efectos del quórum. Este proxy no permite votar por candidatos a la Junta. Para emitir su voto en la elección, debe asistir personalmente.",
    updated:
      "¿Ya firmó el proxy anterior? Complete también el proxy actualizado para la reunión del 17 de noviembre.",
    cta: "Completar mi proxy",
    two: "Dos pasos para lograr el cambio",
    actions: [
      [
        "Ayude a alcanzar el quórum.",
        "Envíe su proxy actualizado para que su vivienda cuente como parte de la participación necesaria para celebrar la reunión.",
      ],
      [
        "Asista y vote.",
        "Alcanzar el quórum permite que la reunión se celebre. Para elegir la próxima Junta, los propietarios deben asistir y votar. El proxy por sí solo no emite votos por candidatos.",
      ],
    ],
    how: "Complete su proxy en línea",
    steps: [
      [
        "Ingrese sus datos.",
        "Indique la dirección de su propiedad y el nombre de la persona autorizada para votar por su vivienda.",
      ],
      [
        "Verifique su correo.",
        "Ingrese el código de confirmación que le enviamos por correo electrónico.",
      ],
      [
        "Revise y firme.",
        "Compruebe su nombre y dirección, corrija cualquier error y firme. Al hacerlo, designa a Jenny Ghetea como su representante.",
      ],
      [
        "Guarde su copia.",
        "Recibirá el PDF completado por correo electrónico. Jenny recibirá una copia para imprimirla y presentarla en la reunión.",
      ],
    ],
    noPrint:
      "Si firma en este sitio, no necesita imprimir ni escanear el documento.",
    official: "Leer el proxy oficial",
    packet: "Ver el paquete completo de la Asociación",
    shareTitle: "Invite a otros propietarios a participar",
    share:
      "Comparta esta página con otros propietarios de Aventura Isles. Anímelos a completar el proxy actualizado y asistir a la reunión.",
    shareEmphasis:
      "Cada proxy ayuda a alcanzar el quórum. Cada propietario que asiste tiene la oportunidad de votar por la próxima Junta.",
    faqTitle: "Preguntas frecuentes",
    faqs: [
      [
        "¿Qué es el quórum?",
        "Es la participación mínima necesaria para celebrar la reunión. Su proxy ayuda a que su vivienda cuente para alcanzar ese mínimo.",
      ],
      [
        "¿Este proxy vota por candidatos?",
        "No. El paquete de la Asociación indica que los proxies no pueden usarse para elegir a los miembros de la Junta. Los votos por candidatos se emiten mediante boleta escrita en la reunión.",
      ],
      [
        "Ya firmé el proxy anterior. ¿Qué debo hacer?",
        "Complete el proxy actualizado para la reunión del 17 de noviembre.",
      ],
      [
        "¿Quién recibe mi proxy?",
        "Jenny Ghetea recibe una copia para imprimirla y presentarla en la reunión. Usted también recibe el PDF completado para sus archivos.",
      ],
      [
        "¿Quién puede firmar?",
        "La persona autorizada para votar por la propiedad. La Asociación confirma la autoridad del firmante y si el proxy cumple sus requisitos.",
      ],
      [
        "¿Cómo puedo corregir o retirar mi proxy?",
        "Contacte directamente a Jenny Ghetea.",
      ],
    ],
    closeTitle: "Participemos por Aventura Isles.",
    close:
      "Complete su proxy actualizado, comparta esta página y asista a la reunión para votar.",
    disclosure:
      "Este sitio independiente es operado por SAPSLAB SERVICES LLC. No es un sitio oficial de la Asociación ni de su empresa administradora.",
    preview: "Vista previa. No se guardan ni se envían poderes.",
  },
} as const;
export default async function Home() {
  const locale = await getLocale();
  const c = copy[locale === "es" ? "es" : "en"];
  const signHref = `/sign?lang=${locale}`;
  return (
    <article className="container participation-page" lang={locale}>
      <section className="campaign-hero">
        <p className="eyebrow">{c.eyebrow}</p>
        <p>
          <strong>{c.date}</strong>
          <br />
          {c.location}
        </p>
        <h1>{c.title}</h1>
        <p className="campaign-intro">
          <strong>{c.intro}</strong>
        </p>
        <p>{c.explanation}</p>
        <p>
          <strong>{c.updated}</strong>
        </p>
        <Link className="button" href={signHref}>
          {c.cta}
        </Link>
        {!submissionsEnabled() && <p className="preview">{c.preview}</p>}
      </section>
      <section className="prose">
        <h2>{c.two}</h2>
        <ol>
          {c.actions.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="prose">
        <h2>{c.how}</h2>
        <ol>
          {c.steps.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </li>
          ))}
        </ol>
        <p>
          <strong>{c.noPrint}</strong>
        </p>
        <Link className="button" href={signHref}>
          {c.cta}
        </Link>
        <p className="quorum-document-links">
          <Link href={`/proxy-language?lang=${locale}`}>{c.official}</Link>
          <a
            href="/documents/annual-meeting-2026.pdf"
            target="_blank"
            rel="noreferrer"
          >
            {c.packet}
          </a>
        </p>
      </section>
      <section className="prose">
        <h2>{c.shareTitle}</h2>
        <p>{c.share}</p>
        <p>
          <strong>{c.shareEmphasis}</strong>
        </p>
      </section>
      <section className="amendment-faq">
        <h2>{c.faqTitle}</h2>
        {c.faqs.map(([title, body]) => (
          <details key={title}>
            <summary>{title}</summary>
            <p>{body}</p>
          </details>
        ))}
      </section>
      <section className="prose">
        <h2>{c.closeTitle}</h2>
        <p>{c.close}</p>
        <Link className="button" href={signHref}>
          {c.cta}
        </Link>
      </section>
      <aside className="independent-disclaimer">{c.disclosure}</aside>
    </article>
  );
}
