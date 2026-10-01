import "dotenv/config";
import { execFileSync } from "node:child_process";
const value = process.env.DATABASE_URL;
if (!value) throw new Error("An explicit SaaS DATABASE_URL is required");
const name = new URL(value).pathname.slice(1);
if (!name.startsWith("community_voting")) throw new Error("Refusing to migrate an unapproved database; use a separate community_voting database");
execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { stdio: "inherit" });
