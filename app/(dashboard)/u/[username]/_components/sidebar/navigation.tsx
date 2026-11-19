"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Fullscreen, KeyRound, MessagesSquare, Users } from "lucide-react";
import { NavItem, NavItemSkeleton } from "./nav-item";

export function Navigation() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const username = user?.username?.trim() || (user ? "user-" + user.id.slice(-8).toLowerCase() : "");
  const routes = [
    { label: "Stream", href: `/u/${username}`, icon: Fullscreen },
    { label: "Keys", href: `/u/${username}/keys`, icon: KeyRound },
    { label: "Chat", href: `/u/${username}/chat`, icon: MessagesSquare },
    { label: "Community", href: `/u/${username}/community`, icon: Users },
  ];
  if (!isLoaded || !user || !username) return <ul className="space-y-2">{[...Array(4)].map((_, i) => <NavItemSkeleton key={i} />)}</ul>;
  return <ul className="space-y-2 px-2 pt-4 lg:pt-0">{routes.map((route) => <NavItem key={route.href} {...route} isActive={pathname === route.href} />)}</ul>;
}
