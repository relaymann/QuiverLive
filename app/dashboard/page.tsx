import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const usernameFor = (user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) =>
  user.username?.trim() || "user-" + user.id.slice(-8).toLowerCase();

export default async function DashboardRedirect() {
  const user = await currentUser();
  if (!user) redirect("/");
  redirect("/u/" + encodeURIComponent(usernameFor(user)));
}
