import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

function PageHeader({ eyebrow, title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)} {...props}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
