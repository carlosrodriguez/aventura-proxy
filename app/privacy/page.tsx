import { retentionDays, siteOperatorName } from "@/lib/config";
export default function Privacy() {
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
          validation status, and revocation requests: supports traceability and
          record administration.
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
        access. They expire after one hour. Cloudflare Turnstile may process
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
