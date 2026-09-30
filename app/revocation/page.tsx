import { Revocation } from "@/components/revocation";
import { submissionsEnabled } from "@/lib/config";
export default function Page() {
  return (
    <article className="container prose">
      <h1>Request revocation</h1>
      <Revocation enabled={submissionsEnabled()} />
    </article>
  );
}
