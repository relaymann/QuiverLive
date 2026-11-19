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
  const self = await getSelf();
  const { username } = await params;
  if (username !== self.username) redirect("/u/" + encodeURIComponent(self.username));
  return <><Navbar /><div className="flex h-full pt-20"><Sidebar /><Container>{children}</Container></div></>;
}
