import { getLocale } from "@/lib/i18n/locale";
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

export default async function Home() {
  const locale = await getLocale();
  const copy = homeCopy[locale];
  const enabled = submissionsEnabled();
  return (
    <article className="container participation-page" lang={locale}>
      <div className="participation-intro">
        <p className="eyebrow">{copy.meeting}</p>
      </div>
      <section className="campaign-hero" aria-labelledby="campaign-heading">
        <h1 id="campaign-heading">
          <span className="campaign-vote">{copy.campaignVote}</span>{" "}
          <span className="campaign-meeting">{copy.campaignMeeting}</span>
        </h1>
        <p className="campaign-intro">{copy.campaignIntro}</p>
        <p className="note">
          {locale === "es"
            ? "6 de octubre de 2026 · 6:15 p. m., o inmediatamente después de la reunión especial de la Junta"
            : "October 6, 2026 · 6:15pm, or immediately following the Special Board Meeting"}
          <br />
          605 NE 193 Street, Miami, FL 33179
          <br />
          {locale === "es"
            ? "Representante designada"
            : "Named proxyholder"}: {proxyConfig.proxyholder}
        </p>
        <div className="proxy-shortcut">
          <Link
            className="button secondary"
            href={locale === "es" ? "/sign?lang=es" : "/sign"}
          >
            {enabled ? copy.directProxy : copy.directPreview}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="note">{copy.independentNote}</p>
      </section>
      <div className="comparison-heading" id="why-no">
        <p className="eyebrow">{copy.whyIntro}</p>
      </div>
      <section
        className="governing-overview"
        aria-labelledby="documents-heading"
      >
        <h2 id="documents-heading">{copy.documentsTitle}</h2>
        <p>{copy.documentsIntro}</p>
        <dl className="document-definitions">
          {copy.documents.map((document) => (
            <div key={document.title}>
              <dt>{document.title}</dt>
              <dd>{document.body}</dd>
            </div>
          ))}
        </dl>
        <div className="business-comparison">
          <section>
            <h3>{copy.boardTodayTitle}</h3>
            <p>{copy.boardToday}</p>
          </section>
          <section>
            <h3>{copy.amendmentChoiceTitle}</h3>
            <p>{copy.amendmentChoice}</p>
          </section>
        </div>
      </section>
      <h2 className="comparison-title">{copy.title}</h2>
      <section className="today-panel" aria-labelledby="today-heading">
        <div>
          <h2 className="eyebrow" id="today-heading">
            {copy.today}
          </h2>
          <p className="practical-lead">{copy.todayLead}</p>
          <div className="today-requirements">
            <section>
              <h3>{copy.meetingRequirement}</h3>
              <p className="approval-number">{copy.meetingNumber}</p>
              <p>{copy.meetingNumberLabel}</p>
              <p>{copy.meetingParticipation}</p>
              <p className="note">{copy.todayRule}</p>
            </section>
            <section>
              <h3>{copy.amendmentRequirement}</h3>
              <p className="approval-number">{copy.amendmentNumber}</p>
              <p>{copy.amendmentParticipation}</p>
              <p className="note">{copy.todayApproval}</p>
            </section>
          </div>
          <p className="note">{copy.todayProtection}</p>
        </div>
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
          <Link
            className="button secondary"
            href={locale === "es" ? "/sign?lang=es" : "/sign"}
          >
            {enabled ? copy.begin : copy.preview}{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        {!enabled && <p className="preview">{copy.previewNote}</p>}
        <p className="disclaimer">{copy.disclaimer}</p>
      </section>
      <section
        className="recommendation-panel"
        aria-labelledby="participation-heading"
      >
        <h2 id="participation-heading">{copy.participationTitle}</h2>
        {copy.participationArgument.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
      <details className="participation-details">
        <summary>{copy.how}</summary>
        <div>
          {copy.explanation.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </details>
      <section className="section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">{copy.faqsTitle}</h2>
        {copy.faqs.map((faq) => (
          <details className="participation-details" key={faq.question}>
            <summary>{faq.question}</summary>
            <div>
              <p>{faq.answer}</p>
            </div>
          </details>
        ))}
        <p className="note">
          <a href="https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0720/Sections/0720.306.html">
            {locale === "es"
              ? "Ley de Florida: sección 720.306"
              : "Florida Statutes section 720.306"}
          </a>
        </p>
      </section>
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
              <dl>
                <dt>
                  <strong>
                    {locale === "es" ? "Regla actual" : "Current rule"}
                  </strong>
                </dt>
                <dd>{copy.comparisons[index].current}</dd>
                <dt>
                  <strong>
                    {locale === "es" ? "Regla propuesta" : "Proposed rule"}
                  </strong>
                </dt>
                <dd>{copy.comparisons[index].proposed}</dd>
                <dt>
                  <strong>
                    {locale === "es" ? "Efecto práctico" : "Practical effect"}
                  </strong>
                </dt>
                <dd>{copy.comparisons[index].effect}</dd>
              </dl>
              {
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
                  <OfficialRedlines
                    exhibit={index === 0 ? "A" : index === 1 ? "B" : "C"}
                  />
                </details>
              }
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
