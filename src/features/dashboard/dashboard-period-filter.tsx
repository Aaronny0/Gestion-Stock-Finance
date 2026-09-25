"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/frontend/provider";

export function DashboardPeriodFilter() {
  const { start, end, setDates } = useWorkspace();

  const applyPreset = (days: string) => {
    const count = Number(days);
    if (!Number.isFinite(count)) return;
    const last = new Date();
    const first = new Date();
    first.setDate(first.getDate() - count + 1);
    setDates(first.toISOString().slice(0, 10), last.toISOString().slice(0, 10));
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Select onValueChange={applyPreset}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Période prédéfinie">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Aujourd’hui</SelectItem>
          <SelectItem value="7">7 derniers jours</SelectItem>
          <SelectItem value="30">30 derniers jours</SelectItem>
          <SelectItem value="90">Trimestre</SelectItem>
          <SelectItem value="365">Année</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          aria-label="Date de début"
          type="date"
          value={start}
          max={end}
          onChange={(event) => event.target.value && setDates(event.target.value, end)}
          className="min-w-0 sm:w-40"
        />
        <span className="text-muted-foreground" aria-hidden="true">—</span>
        <Input
          aria-label="Date de fin"
          type="date"
          value={end}
          min={start}
          onChange={(event) => event.target.value && setDates(start, event.target.value)}
          className="min-w-0 sm:w-40"
        />
      </div>
    </div>
  );
}
