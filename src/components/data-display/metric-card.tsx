import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps extends React.ComponentProps<typeof Card> {
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  comparison?: string;
  definition?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function MetricCard({
  label,
  value,
  trend,
  trendDirection = "neutral",
  comparison,
  definition,
  icon,
  action,
  className,
  ...props
}: MetricCardProps) {
  const TrendIcon =
    trendDirection === "up" ? ArrowUpRight : trendDirection === "down" ? ArrowDownRight : Minus;
  const trendClass =
    trendDirection === "up"
      ? "text-success"
      : trendDirection === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <Card className={cn("min-h-36", className)} {...props}>
      <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="m-0 truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            {definition ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex size-11 min-h-11 shrink-0 items-center justify-center rounded-full sm:size-8 sm:min-h-8 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Définition : ${label}`}
                  >
                    <Info className="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{definition}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              {icon}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
            {value}
          </div>
          <div className="flex min-h-7 items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {trend ? (
                <span className={cn("inline-flex items-center gap-1 font-semibold", trendClass)}>
                  <TrendIcon className="size-3.5" aria-hidden="true" />
                  {trend}
                </span>
              ) : null}
              {comparison ? <span className="truncate text-muted-foreground">{comparison}</span> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { MetricCard };
