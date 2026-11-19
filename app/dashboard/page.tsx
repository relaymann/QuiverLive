import { redirect } from "next/navigation";
import { getSelf } from "@/lib/auth-service";

export default async function DashboardRedirect() {
  let self;
  try {
    self = await getSelf();
  } catch (error) {
    console.error("Dashboard redirect could not resolve account:", error);
    redirect("/");
  }
  redirect("/u/" + encodeURIComponent(self.username));
}
