import { getLocale } from "@/lib/i18n/locale";
import { retentionDays, siteOperatorName } from "@/lib/config";
export default async function Privacy() {
  const es = (await getLocale()) === "es";
  if (es)
    return (
      <article className="container prose">
        <h1>Privacidad</h1>
        <p>
          Este sitio independiente es operado por {siteOperatorName}. No tiene
          acceso a la base de datos privada de miembros de la Asociación. No
          vendemos información ni la usamos para publicidad ajena a esta
          iniciativa.
        </p>
        <h2>Qué recopilamos y para qué</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            Dirección de la propiedad: identifica la propiedad indicada en el
            poder.
          </li>
          <li>
            Nombre y correo del firmante y, de forma opcional, tipo de
            propiedad, entidad y función: identifican al firmante y permiten
            enviar la verificación y la copia del poder.
          </li>
          <li>
            Firma dibujada y declaración de autorización: registran su
            autorización del poder limitado.
          </li>
          <li>
            Dirección IP y datos del navegador: ayudan a prevenir abusos y
            mantener el registro de auditoría.
          </li>
          <li>
            Fechas y horas de firma, verificación, finalización y entrega, y
            zona horaria del navegador si se proporciona: registran la secuencia
            de eventos.
          </li>
          <li>
            Datos de verificación, incluidos códigos almacenados mediante hash y
            número de intentos: aplican los límites de verificación. Los códigos
            no se almacenan en texto legible.
          </li>
          <li>
            Identificador del envío, versión de plantilla, huella del archivo,
            alertas de duplicados, estado de validación y registros históricos
            de revocación: permiten la trazabilidad y administración de los
            registros.
          </li>
        </ul>
        <h2>Conservación y destinatarios</h2>
        <p>
          El plazo configurado de conservación es de {retentionDays()} días
          desde la creación. El operador ejecuta diariamente un proceso para
          eliminar registros y archivos privados vencidos. Las copias de
          respaldo de la infraestructura siguen el ciclo configurado por el
          proveedor, que el operador debe documentar antes del lanzamiento.
        </p>
        <p>
          El firmante recibe el PDF finalizado. Los administradores autorizados
          pueden acceder a los registros. Si está configurado, el poder
          finalizado se envía por correo a la Asociación o a su administración
          para una validación independiente. Los proveedores de alojamiento,
          almacenamiento privado, correo transaccional y protección contra bots
          procesan los datos necesarios para prestar esos servicios. No se
          utilizan herramientas de análisis de terceros con fines publicitarios.
        </p>
        <p>
          Las cookies de sesión HttpOnly autorizan el acceso al envío y el
          acceso administrativo. Caducan después de una hora. Una cookie de
          preferencia conserva el idioma seleccionado durante seis meses.
          Cloudflare Turnstile puede procesar señales del navegador y de la red
          para prevenir abusos.
        </p>
        <h2>Solicitudes</h2>
        <p>
          Un poder finalizado no puede editarse; corregirlo requiere un nuevo
          envío. Los registros de votación ya entregados a la Asociación pueden
          estar sujetos a sus requisitos de conservación o a los establecidos
          por ley. Contacte a la Asociación sobre los registros que ella
          conserva.
        </p>
        <p>
          En el modo de vista previa, los datos del formulario permanecen solo
          en la memoria del navegador; la firma no se envía y los datos se
          pierden al recargar la pestaña.
        </p>
      </article>
    );
  return (
    <article className="container prose">
      <h1>Privacy</h1>
      <p>
        This independent website is operated by {siteOperatorName}. It does not
        have access to the Association’s private member database. We do not sell
        information or use it for unrelated marketing.
      </p>
      <h2>What we collect and why</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          Property address: identifies the property specified in the proxy.
        </li>
        <li>
          Signer name, email, and optional ownership type, entity, and capacity:
          identifies the signer and sends verification and receipts.
        </li>
        <li>
          Drawn signature and certification: records your authorization of the
          limited proxy.
        </li>
        <li>
          IP address and browser user-agent: supports abuse prevention and the
          audit record.
        </li>
        <li>
          Signed, verified, finalized, and delivery timestamps; browser timezone
          if supplied: records the sequence of events.
        </li>
        <li>
          Verification metadata, including hashed codes and attempt counts:
          enforces verification limits. Plaintext codes are never stored.
        </li>
        <li>
          Submission ID, template version, file hash, duplicate flags,
          validation status, and historical revocation records: supports
          traceability and record administration.
        </li>
      </ul>
      <h2>Retention and recipients</h2>
      <p>
        The configured site retention period is {retentionDays()} days from
        creation. The operator runs a daily retention job to remove expired
        records and private files. Infrastructure backup copies follow the
        provider’s separately configured backup lifecycle, which the operator
        must document before launch.
      </p>
      <p>
        The signer receives the finalized PDF. Authorized administrators can
        access records. If configured, a finalized proxy is emailed to the
        Association or management for independent validation. Hosting, private
        storage, transactional email, and bot-protection providers process data
        needed for those services. No third-party marketing analytics are used.
      </p>
      <p>
        HttpOnly session cookies authorize submission access and administrator
        access. They expire after one hour. A preference cookie remembers your
        selected language for six months. Cloudflare Turnstile may process
        browser and network signals to prevent abuse.
      </p>
      <h2>Requests</h2>
      <p>
        A finalized proxy cannot be edited; a correction requires a new
        submission. Voting records already delivered to the Association may be
        subject to Association or legal record-retention requirements. Contact
        the Association about records held by it.
      </p>
      <p>
        Preview mode keeps form entries only in browser memory, does not send
        the signature, and loses entries when the tab reloads.
      </p>
    </article>
  );
}
