import { notFound } from "next/navigation";
import { AdminConfirm } from "@/components/admin-confirm";
export default function Confirm() {
  if (process.env.ENABLE_ADMIN !== "true") notFound();
  return (
    <article className="container prose">
      <h1>Confirm administrator access</h1>
      <AdminConfirm />
    </article>
  );
}
