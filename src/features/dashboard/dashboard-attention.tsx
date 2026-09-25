import Link from "next/link";
import { ArrowRight, CircleDollarSign, Info, PackageSearch, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AttentionItem = {
  label: string;
  description: string;
  href: string;
  tone: "warning" | "info" | "primary";
  icon: "stock" | "cash" | "team";
};

const icons = {
  stock: PackageSearch,
  cash: CircleDollarSign,
  team: UsersRound,
};

const toneClasses = {
  warning: "bg-warning-background text-warning",
  info: "bg-info-background text-info",
  primary: "bg-accent text-accent-foreground",
};

export function DashboardAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>À surveiller</CardTitle>
          <CardDescription>Les points qui demandent votre attention.</CardDescription>
        </div>
        <Badge variant={items.length ? "warning" : "success"}>{items.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const Icon = icons[item.icon];
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="group flex min-h-16 items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${toneClasses[item.tone]}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold text-foreground">{item.label}</strong>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          );
        })}
        {!items.length ? (
          <div className="rounded-md border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            Aucun point critique détecté sur le périmètre actuel.
          </div>
        ) : null}
        <div className="flex gap-2 rounded-md bg-info-background p-3 text-xs leading-5 text-info">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="m-0 text-inherit">
            Le chiffre d’affaires n’est pas le bénéfice. Les charges restent disponibles dans la comptabilité.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
