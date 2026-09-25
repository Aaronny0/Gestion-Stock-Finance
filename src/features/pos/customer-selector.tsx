"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecordRow } from "@/frontend/types";

const WALK_IN = "__walk_in__";

interface CustomerSelectorProps {
  clients: RecordRow[];
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
  onAddClient: () => void;
}

export function CustomerSelector({ clients, value, required, onChange, onAddClient }: CustomerSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>Client{required ? " *" : ""}</Label>
        <Button type="button" variant="link" className="h-auto min-h-0 p-0 text-xs" onClick={onAddClient}>
          <Plus className="size-3.5" /> Nouveau client
        </Button>
      </div>
      <Select value={value || WALK_IN} onValueChange={(next) => onChange(next === WALK_IN ? "" : next)}>
        <SelectTrigger aria-label="Client de la vente">
          <SelectValue placeholder="Client de passage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={WALK_IN}>Client de passage</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>{client.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
