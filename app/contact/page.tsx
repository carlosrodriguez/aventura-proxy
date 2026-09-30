import { siteOperatorName } from "@/lib/config";

export default function Contact() {
  const email = process.env.CONTACT_EMAIL;
  return (
    <article className="container prose">
      <h1>Contact</h1>
      <h2>Proxy submission and Association records</h2>
      <p>
        Submit your completed, signed and dated proxy to Association management,
        or deliver or mail it to the Management Office, 605 NE 193 Street,
        Miami, FL 33179. Contact management about the official revocation
        procedure and records held by the Association.
      </p>
      {email ? (
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      ) : (
        <p className="preview">Association contact is not configured.</p>
      )}
      <p>
        This independent website is operated by {siteOperatorName}. The
        management email is a proxy submission destination and does not identify
        the site operator.
      </p>
      <p>
        A revocation request to this site does not itself legally revoke a
        proxy.
      </p>
    </article>
  );
}
