import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSelf } from "@/lib/auth-service";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CreatorLayout({ children }: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  let self;
  try {
    self = await getSelf();
  } catch (error) {
    console.error("Creator dashboard authentication/provisioning failed:", error);
    redirect("/");
  }
  if (!self) redirect("/");
  return <><Navbar /><div className="flex h-full pt-20"><Sidebar /><Container>{children}</Container></div></>;
}
