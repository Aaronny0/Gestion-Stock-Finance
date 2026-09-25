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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select onValueChange={(value) => applyPreset(Number(value))}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Période prédéfinie">
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
      <div className="flex items-center gap-2">
        <Input aria-label="Date de début" type="date" value={start} max={end} onChange={(event) => event.target.value && setDates(event.target.value, end)} className="min-w-0" />
        <span className="text-muted-foreground">—</span>
        <Input aria-label="Date de fin" type="date" value={end} min={start} onChange={(event) => event.target.value && setDates(start, event.target.value)} className="min-w-0" />
      </div>
    </div>
  );
}

export { DateRangeFilter };
