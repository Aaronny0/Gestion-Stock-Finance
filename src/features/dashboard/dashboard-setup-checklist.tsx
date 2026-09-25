import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/data-display/status-badge";

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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Configuration de la boutique</CardTitle>
          <p className="m-0 text-sm text-muted-foreground">
            {completed}/{steps.length} étapes vérifiées
          </p>
        </div>
        <StatusBadge
          value={completed === steps.length ? "validée" : "à vérifier"}
          label={completed === steps.length ? "Prête" : "À finaliser"}
          tone={completed === steps.length ? "success" : "warning"}
        />
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : CircleDashed;
          return (
            <Link
              key={step.path}
              href={href(step.path)}
              className="group flex min-h-16 items-center gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon
                className={step.done ? "size-5 text-success" : "size-5 text-warning"}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                {step.label}
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
