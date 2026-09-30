import { notFound } from "next/navigation";
import { AdminLogin } from "@/components/admin-login";
export default function Login() {
  if (process.env.ENABLE_ADMIN !== "true") notFound();
  return (
    <article className="container prose">
      <h1>Administrator access</h1>
      <AdminLogin />
    </article>
  );
}
