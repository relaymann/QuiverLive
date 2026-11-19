import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

export const metadata: Metadata = { title: "Dashboard" };

const usernameFor = (user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) =>
  user.username?.trim() || "user-" + user.id.slice(-8).toLowerCase();

export default async function CreatorLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");
  const { username } = await params;
  const canonicalUsername = usernameFor(user);
  if (username !== canonicalUsername) redirect("/u/" + encodeURIComponent(canonicalUsername));

  return <><Navbar /><div className="flex h-full pt-20"><Sidebar /><Container>{children}</Container></div></>;
}
