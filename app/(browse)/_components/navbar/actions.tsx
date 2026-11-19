import React from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export async function Actions() {
  let user = null;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("Navbar authentication lookup failed:", error);
  }
  const username = user?.username?.trim() || (user ? "user-" + user.id.slice(-8).toLowerCase() : "");
  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      {!user && <SignInButton><Button variant="primary">Login</Button></SignInButton>}
      {!!user && <div className="flex items-center gap-x-4">
        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary" asChild>
          <Link href={username ? "/u/" + username : "/"}><Clapperboard className="h-5 w-5 lg:mr-2" /><span className="hidden lg:block">Dashboard</span></Link>
        </Button>
        <UserButton />
      </div>}
    </div>
  );
}
