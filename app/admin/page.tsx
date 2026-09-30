import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/security/admin";
import { AdminPanel } from "@/components/admin-panel";
export default async function Admin() {
  if (process.env.ENABLE_ADMIN !== "true") notFound();
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
  return (
    <article className="container prose">
      <h1>Proxy administration</h1>
      <p>
        Finalized documents cannot be edited. Validation status is a manual
        Association decision.
      </p>
      <AdminPanel />
    </article>
  );
}
