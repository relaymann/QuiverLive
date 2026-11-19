import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSelf } from "@/lib/auth-service";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CreatorLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let self;
  try {
    self = await getSelf();
  } catch (error) {
    console.error("Creator dashboard authentication/provisioning failed:", error);
    redirect("/");
  }
  if (!self) redirect("/");
  // Redirect to the account's canonical database username, not the homepage.
  if (self.username !== username) redirect("/u/" + self.username);
  return <><Navbar /><div className="flex h-full pt-20"><Sidebar /><Container>{children}</Container></div></>;
}
