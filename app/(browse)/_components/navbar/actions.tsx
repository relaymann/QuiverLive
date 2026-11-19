"use client";

import React from "react";
import { Clapperboard } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Actions() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const username = user?.username?.trim() || (user ? "user-" + user.id.slice(-8).toLowerCase() : "");

  const openDashboard = () => {
    if (!isLoaded || !isSignedIn || !username) return;
    router.push("/u/" + encodeURIComponent(username));
  };

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      {isLoaded && !isSignedIn && <SignInButton><Button variant="primary">Login</Button></SignInButton>}
      {isLoaded && isSignedIn && <div className="flex items-center gap-x-4">
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-primary"
          onClick={openDashboard}
          disabled={!username}
          type="button"
        >
          <Clapperboard className="h-5 w-5 lg:mr-2" />
          <span className="hidden lg:block">Dashboard</span>
        </Button>
        <UserButton />
      </div>}
      {!isLoaded && <div className="h-9 w-9" aria-hidden="true" />}
    </div>
  );
}
