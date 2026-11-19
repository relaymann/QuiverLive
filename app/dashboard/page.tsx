import { redirect } from "next/navigation";
import { getSelf } from "@/lib/auth-service";

export default async function DashboardRedirect() {
  const self = await getSelf();
  redirect("/u/" + encodeURIComponent(self.username));
}
