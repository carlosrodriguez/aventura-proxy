import { proxyConfig, siteOperatorName } from "@/lib/config";
export const dynamic = "force-dynamic";
export default function Language() {
  return (
    <article className="container document-page" lang="en">
      <section aria-labelledby="limited-proxy-heading">
        <h1 id="limited-proxy-heading">The limited proxy you are signing</h1>
        <div className="official-document">
          <h2>AVENTURA ISLES MASTER HOMEOWNERS’ ASSOCIATION, INC.</h2>
          <h3>OFFICIAL ASSOCIATION LIMITED PROXY</h3>
          <p className="document-verbatim">
            {proxyConfig.executionProxyWording}
          </p>
          <ol className="proxy-questions">
            {proxyConfig.proposals.map((p) => (
              <li key={p.label}>
                <p>{p.language}</p>
                <p>
                  _____ Yes　　<strong>__X__ No</strong>
                </p>
              </li>
            ))}
          </ol>
          <p>Date: ____________________　 Address: ____________________</p>
          <p>
            Print Name: ____________________　 Signature: ____________________
          </p>
          <p>
            Entity Name (if applicable): ____________________　 Title (if
            applicable): ____________________
          </p>
          <p>
            <u>{proxyConfig.substitutionNotice}</u>
          </p>
          <h3>SUBSTITUTION OF PROXY</h3>
          <p>{proxyConfig.substitutionWording}</p>
          <p>Dated: ____________________</p>
          <p>
            Printed Name and Signature of Original Proxyholder:
            ____________________
          </p>
          <p className="important-proxy-note">
            {proxyConfig.importantProxyNote}
          </p>
        </div>
      </section>
      <section aria-labelledby="amendments-heading">
        <h2 id="amendments-heading">The proposed amendments</h2>
        {Object.values(proxyConfig.officialExhibits).map((exhibit) => (
          <section className="official-document" key={exhibit.label}>
            <h3>{exhibit.label}</h3>
            <h4>{exhibit.title}</h4>
            <p>{exhibit.intro}</p>
            <p>
              <em>{exhibit.note}</em>
            </p>
            {exhibit.sections.map((section) => (
              <section key={section.heading}>
                <h4>{section.heading}</h4>
                <p className="document-verbatim">
                  {section.segments.map((segment, index) =>
                    segment.change === "deleted" ? (
                      <del key={index}>{segment.text}</del>
                    ) : segment.change === "added" ? (
                      <u key={index}>{segment.text}</u>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    ),
                  )}
                </p>
              </section>
            ))}
          </section>
        ))}
      </section>
      <aside className="independent-disclaimer">
        This independent website is operated by {siteOperatorName}. It is not an
        official Aventura Isles Master Homeowners’ Association website and is
        not operated by the Association or its management company.
      </aside>
    </article>
  );
}
