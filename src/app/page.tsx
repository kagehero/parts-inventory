import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function HomeRedirect() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  redirect("/login");
}
