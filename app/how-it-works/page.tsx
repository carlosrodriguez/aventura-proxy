import { getLocale } from "@/lib/i18n/locale";
export default async function Page() {
  const es = (await getLocale()) === "es";
  const steps = es
    ? [
        "Indique la propiedad con el número de casa y la calle.",
        "Ingrese su nombre, correo electrónico y, si corresponde, su función en la entidad propietaria.",
        "Revise las instrucciones de votar NO y el texto oficial del poder.",
        "Dibuje su firma y confirme que tiene autorización para otorgar el poder.",
        "Ingrese el código enviado a su correo dentro de diez minutos.",
        "Completamos el formulario oficial del poder y conservamos un registro de auditoría separado.",
      ]
    : [
        "Identify the property by house number and street.",
        "Provide your name, email, and entity capacity if relevant.",
        "Read the fixed NO voting instructions and official wording.",
        "Draw your signature and certify your authority.",
        "Enter the email code within ten minutes.",
        "We fill the official proxy form and preserve a separate audit record.",
      ];
  return (
    <article className="container prose">
      <h1>{es ? "Cómo funciona" : "How it works"}</h1>
      <p>
        {es
          ? "Los propietarios y miembros con autorización para votar pueden otorgar un poder limitado que instruye votar NO a los anexos A, B y C."
          : "Owners and authorized voting members can execute a limited proxy directing NO on Exhibits A, B, and C."}
      </p>
      <ol className="list-decimal pl-6 space-y-4">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>
        {es
          ? "La Asociación verifica de forma independiente la autoridad para votar. La verificación del correo solo comprueba el acceso a la dirección proporcionada."
          : "The Association independently validates voting authority. Email verification only establishes access to the supplied email address."}
      </p>
      <p>
        {es
          ? "Los posibles duplicados se marcan para revisión y se conservan. El sitio no determina cuál poder tiene validez legal frente a otro."
          : "Likely duplicates are flagged and retained. The website does not decide which proxy legally controls."}
      </p>
    </article>
  );
}
