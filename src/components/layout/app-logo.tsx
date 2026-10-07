import Link from "next/link";

import { cn } from "@/lib/utils";

interface AppLogoProps {
  href: string;
  compact?: boolean;
  className?: string;
}

export function AppLogo({ href, compact = false, className }: AppLogoProps) {
  return (
    <Link
      href={href}
      aria-label="VORTEX — accueil"
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact && "justify-center",
        className,
      )}
    >
      <span className="vortex-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M3 6h8l6 13 5-13h7L17 29 3 6Z" fill="currentColor"/><path d="m3 6 14 13L11 6H3Z" fill="white" opacity=".4"/></svg></span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block text-xl font-bold tracking-[-0.04em] text-foreground">VORTEX</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pilotage du commerce
          </span>
        </span>
      )}
    </Link>
  );
}
