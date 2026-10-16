import { getLocale } from "@/lib/i18n/locale";
import { proxyConfig, siteOperatorName } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function Language() {
  const es = (await getLocale()) === "es";
  return (
    <article className="container document-page">
      <section aria-labelledby="limited-proxy-heading">
        <h1 id="limited-proxy-heading">
          {es
            ? "El poder limitado que está firmando"
            : "The limited proxy you are signing"}
        </h1>
        <div className="official-document" lang="en">
          <h2>AVENTURA ISLES MASTER HOMEOWNERS’ ASSOCIATION, INC.</h2>
          <h3>LIMITED PROXY</h3>
          <p className="document-verbatim">
            {proxyConfig.executionProxyWording}
          </p>
          <p>
            Date: ____________________　 Lot #/Address: ____________________
          </p>
          <p>
            Print Name: ____________________　 Signature: ____________________
          </p>
          <p>
            Entity Name (if applicable): ____________________　 Title (if
            applicable): ____________________
          </p>
          <p className="important-proxy-note">
            {proxyConfig.importantProxyNote}
          </p>
          <p>
            <u>{proxyConfig.substitutionNotice}</u>
          </p>
          <h3>SUBSTITUTION OF PROXY</h3>
          <p>{proxyConfig.substitutionWording}</p>
          <p>Dated: ____________________</p>
          <p>Signature of Original Proxyholder: ____________________</p>
        </div>
      </section>
      <aside className="independent-disclaimer">
        {es
          ? `Este sitio independiente es operado por ${siteOperatorName}. No es un sitio oficial de Aventura Isles Master Homeowners’ Association ni es operado por la Asociación o su empresa administradora.`
          : `This independent website is operated by ${siteOperatorName}. It is not an official Aventura Isles Master Homeowners’ Association website and is not operated by the Association or its management company.`}
      </aside>
    </article>
  );
}
