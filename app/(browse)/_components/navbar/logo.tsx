import Link from "next/link";
import { RadioTower } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" aria-label="QuiverLive home" className="group flex shrink-0 items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <RadioTower className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="hidden text-lg font-bold tracking-tight sm:inline">
        Quiver<span className="text-primary">Live</span>
      </span>
    </Link>
  );
}
