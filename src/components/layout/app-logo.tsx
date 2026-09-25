import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm">
        V
        <ArrowUpRight className="absolute right-0.5 top-0.5 size-3.5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block text-xl font-bold tracking-[-0.04em] text-foreground">VORTEX</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Stock &amp; Finance
          </span>
        </span>
      )}
    </Link>
  );
}
