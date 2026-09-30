import { proxyConfig, officialTemplateReady } from "@/lib/config";
export const dynamic = "force-dynamic";

export default function Language() {
  return (
    <article className="container prose">
      <h1>Proxy language</h1>
      <p className="preview">
        {officialTemplateReady()
          ? "Reviewed proxy template"
          : "Draft template · Not ready for execution until all official details are supplied and reviewed."}
      </p>
      <h2>{proxyConfig.association}</h2>
      <p>
        Special meeting: {proxyConfig.meetingDate}
        <br />
        Time: {proxyConfig.meetingTime}
        <br />
        Location: {proxyConfig.meetingLocation}
        <br />
        Proxyholder: {proxyConfig.proxyholder}
      </p>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {proxyConfig.executionProxyWording}
      </p>
      {proxyConfig.proposals.map((p) => (
        <section className="card" key={p.label}>
          <h3>
            {p.label} — {p.vote}
          </h3>
          <p>{p.language}</p>
        </section>
      ))}
      <p className="note">
        The named proxyholder uses option (b). TBD is a preview placeholder; no
        proxy can be finalized until a name is configured and the remaining
        launch checks pass.
      </p>
      <h2>Official exhibit text</h2>
      <p>
        The supplied packet contains Exhibits A, B, and C. Underlining indicates added language; strikethrough indicates
        deleted language.
      </p>
      {[proxyConfig.officialExhibits.A, proxyConfig.officialExhibits.B, proxyConfig.officialExhibits.C].map(
        (exhibit) => (
          <section key={exhibit.label} className="section">
            <h3>
              {exhibit.label}: {exhibit.title}
            </h3>
            <p>{exhibit.intro}</p>
            <p>{exhibit.note}</p>
            {exhibit.sections.map((section) => (
              <div key={section.heading}>
                <h3>{section.heading}</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>
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
              </div>
            ))}
          </section>
        ),
      )}
      <h2>Important proxy note</h2>
      <p>{proxyConfig.importantProxyNote}</p>
      <h3>Substitution of proxy</h3>
      <p>{proxyConfig.substitutionNotice}</p>
      <p>{proxyConfig.substitutionWording}</p>
      <p>
        The website does not complete the proxyholder’s substitution section.
      </p>
      <p>
        Template version: {proxyConfig.templateVersion}. This draft does not
        invent or summarize the amendment language.
      </p>
    </article>
  );
}
