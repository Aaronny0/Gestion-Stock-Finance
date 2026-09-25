import * as React from "react";
import { AlertCircle, CheckCircle2, Clock3, Info, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusTone = "neutral" | "success" | "warning" | "destructive" | "info";

const labels: Record<string, string> = {
  posted: "Postée",
  draft: "Brouillon",
  reversed: "Extournée",
  paid: "Payée",
  credit: "À crédit",
  refunded: "Remboursée",
  partially_refunded: "Retour partiel",
  open: "Ouverte",
  closed: "Clôturée",
  locked: "Verrouillée",
};

function inferTone(value: string): StatusTone {
  if (/suspend|rupture|erreur|en retard|reversed/i.test(value)) return "destructive";
  if (/credit|draft|attente|faible|échéance aujourd|à définir/i.test(value)) return "warning";
  if (/^(posted|paid|open|active|actif|validée?|soldée?|payée?|reçue?)$/i.test(value)) return "success";
  if (/partially_refunded|à venir/i.test(value)) return "info";
  return "neutral";
}

interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "variant"> {
  value: string;
  label?: string;
  tone?: StatusTone;
  showIcon?: boolean;
}

function StatusBadge({ value, label, tone = inferTone(value), showIcon = true, ...props }: StatusBadgeProps) {
  const variant = tone === "neutral" ? "secondary" : tone;
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? Clock3 : tone === "destructive" ? AlertCircle : tone === "info" ? Info : MinusCircle;
  return <Badge variant={variant} {...props}>{showIcon ? <Icon className="size-3.5" aria-hidden="true" /> : null}{label ?? labels[value] ?? value}</Badge>;
}

export { StatusBadge, type StatusTone };
