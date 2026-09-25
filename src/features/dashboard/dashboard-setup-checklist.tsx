import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SetupStep = {
  label: string;
  path: string;
  done: boolean;
};

export function DashboardSetupChecklist({
  steps,
  href,
}: {
  steps: SetupStep[];
  href: (path: string) => string;
}) {
  const completed = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  if (!next) return null;

  return (
    <Link
      href={href(next.path)}
      className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-dashed border-primary/40 bg-accent/40 px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 text-sm">
        <strong className="font-semibold text-foreground">Configuration à finaliser</strong>
        <span className="ml-2 text-muted-foreground">
          {completed}/{steps.length} étapes · {next.label}
        </span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
