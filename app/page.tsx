import Link from "next/link";
import { submissionsEnabled, proxyConfig } from "@/lib/config";
import { homeCopy } from "@/lib/i18n/home";

function OfficialRedlines({ exhibit }: { exhibit: "A" | "B" | "C" }) {
  return (
    <div className="official-redlines" lang="en">
      {proxyConfig.officialExhibits[exhibit].sections.map((section) => (
        <section key={section.heading}>
          <h4>{section.heading}</h4>
          <blockquote>
            {section.segments.map((segment, index) =>
              segment.change === "deleted" ? (
                <del key={index}>{segment.text}</del>
              ) : segment.change === "added" ? (
                <u key={index}>{segment.text}</u>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </blockquote>
        </section>
      ))}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const locale = (await searchParams).lang === "es" ? "es" : "en";
  const copy = homeCopy[locale];
  const enabled = submissionsEnabled();
  return (
    <article className="container participation-page" lang={locale}>
      <div className="participation-intro">
        <p className="eyebrow">{copy.meeting}</p>
        <nav
          className="language-switch"
          aria-label={locale === "es" ? "Idioma" : "Language"}
        >
          <Link
            href="/"
            hrefLang="en"
            aria-current={locale === "en" ? "page" : undefined}
          >
            English
          </Link>
          <Link
            href="/?lang=es"
            hrefLang="es"
            aria-current={locale === "es" ? "page" : undefined}
          >
            Español
          </Link>
        </nav>
      </div>
      <section className="campaign-hero" aria-labelledby="campaign-heading">
        <h1 id="campaign-heading">
          <span className="campaign-vote">{copy.campaignVote}</span>{" "}
          <span className="campaign-meeting">{copy.campaignMeeting}</span>
        </h1>
        <p className="campaign-intro">{copy.campaignIntro}</p>
        <div className="proxy-shortcut">
          <Link className="button secondary" href="/sign">
            {enabled ? copy.directProxy : copy.directPreview}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="note">{copy.independentNote}</p>
      </section>
      <div className="comparison-heading" id="why-no">
        <p className="eyebrow">{copy.whyIntro}</p>
        <h2 className="comparison-title">{copy.title}</h2>
      </div>
      <section className="today-panel" aria-labelledby="today-heading">
        <div>
          <h2 className="eyebrow" id="today-heading">
            {copy.today}
          </h2>
          <p className="practical-lead">{copy.todayLead}</p>
          <p>{copy.todayRule}</p>
          <p>{copy.todayApproval}</p>
          <p className="note">{copy.todayProtection}</p>
        </div>
        <p className="current-share">
          <strong>{copy.currentShare}</strong>
          <span>{copy.currentShareLabel}</span>
        </p>
      </section>
      <section className="proposed-panel" aria-labelledby="proposed-heading">
        <h2 className="eyebrow" id="proposed-heading">
          {copy.proposed}
        </h2>
        <div className="participation-step">
          <span className="step-tag">{copy.stepOne}</span>
          <h3>{copy.stepOneTitle}</h3>
          <p>{copy.participation}</p>
          <p className="representation-note">{copy.represented}</p>
        </div>
        <div className="participation-step">
          <span className="step-tag">{copy.stepTwo}</span>
          <h3>{copy.stepTwoTitle}</h3>
          <ol className="decision-sequence">
            <li>
              <strong>131</strong>
              <span>{copy.homes}</span>
            </li>
            <li className="sequence-arrow" aria-hidden="true">
              ↓
            </li>
            <li>
              <strong>66</strong>
              <span>{copy.yes}</span>
            </li>
            <li className="sequence-arrow" aria-hidden="true">
              ↓
            </li>
            <li className="everyone">
              <strong>
                100<span>%</span>
              </strong>
              <span>{copy.everyone}</span>
              <p>{copy.consequence}</p>
            </li>
          </ol>
        </div>
      </section>
      <section className="takeaway-panel" aria-labelledby="takeaway-heading">
        <div className="community-dots" aria-hidden="true">
          {Array.from({ length: 100 }, (_, i) => (
            <span className={i < 10 ? "highlighted" : undefined} key={i} />
          ))}
        </div>
        <h2 id="takeaway-heading">{copy.amendmentTakeaway}</h2>
        <p className="accuracy-note">{copy.accuracy}</p>
      </section>
      <section className="recommendation-panel" aria-labelledby="why-heading">
        <h2 id="why-heading">{copy.why}</h2>
        {copy.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        <p className="vote-recommendation">{copy.recommendation}</p>
        <div className="proxy-shortcut">
          <Link className="button secondary" href="/sign">
            {enabled ? copy.begin : copy.preview}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        {!enabled && <p className="preview">{copy.previewNote}</p>}
        <p className="disclaimer">{copy.disclaimer}</p>
      </section>
      <details className="participation-details">
        <summary>{copy.how}</summary>
        <div>
          {copy.explanation.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </details>
      <section
        className="section exhibit-explanations"
        aria-labelledby="exhibits-heading"
      >
        <p className="eyebrow">{copy.exhibitsLabel}</p>
        <h2 id="exhibits-heading">{copy.exhibitsTitle}</h2>
        <div className="grid">
          {copy.exhibits.map((exhibit, index) => (
            <section className="card" key={exhibit.label}>
              <p className="eyebrow">{exhibit.label}</p>
              <h3>{exhibit.title}</h3>
              <p>{exhibit.body}</p>
              {(
                <details className="exhibit-wording">
                  <summary>
                    {locale === "es"
                      ? "Texto exacto del documento (en inglés)"
                      : "Exact wording from the document"}
                  </summary>
                  <p className="note">
                    {locale === "es"
                      ? "El texto tachado se elimina; el texto subrayado se añade. Se conserva el inglés original del documento."
                      : "Strikethrough marks deleted text; underlining marks added text. The original document wording is preserved."}
                  </p>
                  <OfficialRedlines exhibit={index === 0 ? "A" : index === 1 ? "B" : "C"} />
                </details>
              )}
            </section>
          ))}
        </div>
        <Link className="exhibit-source-link" href="/proxy-language">
          {copy.read} →
        </Link>
      </section>
    </article>
  );
}
