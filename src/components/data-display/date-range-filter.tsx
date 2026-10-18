"use client";

import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/frontend/provider";

function DateRangeFilter() {
  const { start, end, setDates } = useWorkspace();
  const applyPreset = (days: number) => {
    const finish = new Date();
    const begin = new Date();
    begin.setDate(begin.getDate() - days + 1);
    setDates(begin.toISOString().slice(0, 10), finish.toISOString().slice(0, 10));
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Select onValueChange={(value) => applyPreset(Number(value))}>
        <SelectTrigger className="w-full sm:w-36" aria-label="Période prédéfinie">
          <CalendarDays className="mr-2 size-4 text-muted-foreground" />
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
      <div className="flex min-w-0 items-center gap-2">
        <Input aria-label="Date de début" type="date" value={start} max={end} onChange={(event) => event.target.value && setDates(event.target.value, end)} className="min-w-0 flex-1 sm:w-36 sm:flex-none" />
        <span className="text-muted-foreground">—</span>
        <Input aria-label="Date de fin" type="date" value={end} min={start} onChange={(event) => event.target.value && setDates(start, event.target.value)} className="min-w-0 flex-1 sm:w-36 sm:flex-none" />
      </div>
    </div>
  );
}

export { DateRangeFilter };
