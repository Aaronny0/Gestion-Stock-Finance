"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";

export function StoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { command } = useWorkspace();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = useMemo(() => Boolean(name || city), [name, city]);
  const confirmDiscard = useUnsavedChanges(dirty, "Nouvelle boutique");

  const close = () => {
    if (!busy && confirmDiscard()) onOpenChange(false);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) { setError("Nom obligatoire."); return; }
    setBusy(true); setError("");
    try {
      await command("store.save", { label: name.trim(), city: city.trim() });
      setName(""); setCity("");
      onOpenChange(false);
    } catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={(next) => next ? onOpenChange(true) : close()}><DialogContent><DialogHeader><DialogTitle>Créer un point de vente</DialogTitle><DialogDescription>Ajoutez une boutique à l’organisation active.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="store-name">Nom du point de vente</Label><Input id="store-name" autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="store-city">Ville / adresse</Label><Input id="store-city" value={city} onChange={(event) => setCity(event.target.value)} /></div>{error ? <p role="alert" className="rounded-md bg-destructive-background px-3 py-2 text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Annuler</Button><Button type="submit" disabled={busy}>{busy ? "Création…" : "Créer la boutique"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
