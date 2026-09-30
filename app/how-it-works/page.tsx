export default function Page() {
  return (
    <article className="container prose">
      <h1>How it works</h1>
      <p>
        Owners and authorized voting members can execute a limited proxy
        directing NO on Exhibits A, B, and C.
      </p>
      <ol className="list-decimal pl-6 space-y-4">
        <li>Identify the property by house number and street.</li>
        <li>Provide your name, email, and entity capacity if relevant.</li>
        <li>Read the fixed NO voting instructions and official wording.</li>
        <li>Draw your signature and certify your authority.</li>
        <li>Enter the email code within ten minutes.</li>
        <li>The system generates a signed PDF and a separate audit record.</li>
      </ol>
      <p>
        The Association independently validates voting authority. Email
        verification only establishes access to the supplied email address.
      </p>
      <p>
        Likely duplicates are flagged and retained. The website does not decide
        which proxy legally controls.
      </p>
    </article>
  );
}
