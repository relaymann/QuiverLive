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

  // Keep redirect outside the try/catch: Next.js redirects throw internally.
  if (!self || self.username !== username) redirect("/");
  return <><Navbar /><div className="flex h-full pt-20"><Sidebar /><Container>{children}</Container></div></>;
}
