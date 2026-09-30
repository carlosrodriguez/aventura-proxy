export default function Page() {
  return (
    <article className="container prose">
      <h1>Security & verification</h1>
      <p>
        <strong>Email verification is not proof of property ownership.</strong>
      </p>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          The signer identifies a property. Only address format is checked.
        </li>
        <li>The signer provides identity information.</li>
        <li>The signer draws a signature and certifies authority.</li>
        <li>
          The signer proves control of the supplied email with an expiring
          one-time code.
        </li>
        <li>
          The system records a SHA-256 hash of the finalized PDF and stores it
          privately with an audit envelope.
        </li>
        <li>
          The Association independently determines whether the signer is
          authorized to vote for the lot.
        </li>
      </ol>
      <p>
        A hash permits detection of changes to the file when compared with a
        trusted copy of that hash. It does not establish identity, authority, or
        legal validity. The PDF is not a certificate-based digital signature.
      </p>
      <p>
        Codes expire after ten minutes, have a five-attempt limit, and are
        stored as keyed hashes. Private files require temporary download
        authorization. This site has no access to the HOA’s private membership
        database.
      </p>
    </article>
  );
}
