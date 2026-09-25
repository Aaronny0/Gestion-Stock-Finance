"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Calculator,
  CheckCircle2,
  Landmark,
  LockKeyhole,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { request } from "@/frontend/api";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";
import type { Store as StoreType } from "@/frontend/types";
import { cn } from "@/lib/utils";
import { StoreDialog } from "./store-dialog";

const baseTabs = [
  { key: "organization", label: "Entreprise", icon: Building2 },
  { key: "stores", label: "Boutiques", icon: Store },
  { key: "sales", label: "Vente", icon: ReceiptText },
  { key: "stock", label: "Stock", icon: Warehouse },
  { key: "accounting", label: "Comptabilité", icon: Calculator },
  { key: "fiscal", label: "Fiscalité", icon: Landmark },
  { key: "security", label: "Sécurité", icon: LockKeyhole },
];

export default function SettingsPage({ path }: { path: string }) {
  const { snapshot, command, href, can, demo } = useWorkspace();
  const org = snapshot!.session.organization;
  const tab = path.split("/")[2] || "organization";
  const [name, setName] = useState(org.name);
  const [country, setCountry] = useState(org.country);
  const [timezone, setTimezone] = useState(org.timezone);
  const [split, setSplit] = useState(org.splitPayments);
  const [fiscal, setFiscal] = useState(org.fiscalEnabled);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [storeDialog, setStoreDialog] = useState(false);
  const original = useRef("");

  useEffect(() => {
    setName(org.name);
    setCountry(org.country);
    setTimezone(org.timezone);
    setSplit(org.splitPayments);
    setFiscal(org.fiscalEnabled);
    original.current = JSON.stringify({ id: org.id, name: org.name, country: org.country, timezone: org.timezone, split: org.splitPayments, fiscal: org.fiscalEnabled });
  }, [org.id, org.name, org.country, org.timezone, org.splitPayments, org.fiscalEnabled]);

  const signature = JSON.stringify({ id: org.id, name, country, timezone, split, fiscal });
  useUnsavedChanges(Boolean(original.current) && signature !== original.current, "Paramètres");

  const tabs = baseTabs.filter((item) => item.key !== "fiscal" || can("fiscal.manage"));
  const timezoneOptions = [...new Set([org.timezone, "Africa/Porto-Novo", "Africa/Abidjan", "Africa/Douala", "Europe/Paris"])];

  const storeColumns = useMemo<ColumnDef<StoreType>[]>(() => [
    { accessorKey: "name", header: "Boutique", cell: ({ row }) => <div><strong className="block text-sm font-semibold">{row.original.name}</strong><span className="text-xs text-muted-foreground">{row.original.id === snapshot!.session.defaultStoreId ? "Boutique par défaut" : "Point de vente"}</span></div> },
    { accessorKey: "city", header: "Ville", cell: ({ row }) => row.original.city || "—" },
    { accessorKey: "active", header: "Statut", cell: ({ row }) => <StatusBadge value={row.original.active ? "Actif" : "Inactif"} /> },
  ], [snapshot]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setStatus("");
    try {
      await command("settings.save", {
        name: name.trim(),
        country: country.trim(),
        timezone,
        splitPayments: split,
        ...(can("fiscal.manage") ? { fiscalEnabled: fiscal } : {}),
      });
      original.current = signature;
      setStatus("Paramètres enregistrés.");
    } catch (caught) { setError((caught as Error).message); }
    finally { setBusy(false); }
  };

  const saveVisible = ["organization", "sales", "fiscal"].includes(tab);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PARAMÈTRES" title="Configurez votre espace de travail." description="Entreprise, boutiques, règles de vente, comptabilité, fiscalité et sécurité dans une interface unique." />

      <nav className="overflow-x-auto" aria-label="Sections des paramètres">
        <div className="flex min-w-max gap-1 rounded-lg border border-border bg-card p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Link key={key} href={href(`/settings/${key}`)} className={cn("inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === key && "bg-accent text-accent-foreground")}>
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </div>
      </nav>

      <form className="space-y-5" onSubmit={save}>
        {tab === "organization" ? (
          <Card>
            <CardHeader><CardTitle>Informations de l’entreprise</CardTitle><CardDescription>Ces informations identifient l’organisation active et alimentent ses documents.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="org-name">Nom commercial</Label><Input id="org-name" required value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="org-country">Pays</Label><Input id="org-country" required value={country} onChange={(event) => setCountry(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="org-currency">Devise</Label><Input id="org-currency" disabled value={org.currency} /><p className="text-xs text-muted-foreground">La devise ne se change pas après les premières écritures.</p></div>
              <div className="space-y-2"><Label>Fuseau horaire</Label><Select value={timezone} onValueChange={setTimezone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timezoneOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
            </CardContent>
          </Card>
        ) : null}

        {tab === "stores" ? (
          <div className="space-y-4">
            <Card className="shadow-none"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Points de vente</p><p className="text-sm text-muted-foreground">{snapshot!.session.stores.length} boutique(s) rattachée(s) à l’organisation.</p></div><Button type="button" onClick={() => setStoreDialog(true)}><Plus /> Ajouter une boutique</Button></CardContent></Card>
            <DataTable name="boutiques" data={snapshot!.session.stores} columns={storeColumns} getRowId={(store) => store.id} searchPlaceholder="Rechercher une boutique…" enableColumnVisibility={false} mobileRow={(store) => <Card className="shadow-none"><CardContent className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold">{store.name}</p><p className="text-xs text-muted-foreground">{store.city || "Ville non renseignée"}</p></div><StatusBadge value={store.active ? "Actif" : "Inactif"} /></CardContent></Card>} />
          </div>
        ) : null}

        {tab === "sales" ? (
          <Card>
            <CardHeader><CardTitle>Ventes et reçus</CardTitle><CardDescription>Les règles de crédit et de remise restent contrôlées par les permissions métier.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <label className="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-border p-4"><span><strong className="block text-sm font-semibold">Paiements fractionnés</strong><span className="text-xs text-muted-foreground">Autoriser plusieurs moyens de paiement sur une même vente.</span></span><Switch checked={split} onCheckedChange={setSplit} /></label>
              <div className="rounded-lg bg-info-background p-4 text-sm text-info"><strong className="block font-semibold">Reçus et taxes</strong>Les reçus restent disponibles en impression A4 ou ticket. Les règles fiscales dépendent de la configuration métier du pays.</div>
            </CardContent>
          </Card>
        ) : null}

        {tab === "stock" ? (
          <Card><CardHeader><CardTitle>Catalogue et suivi des appareils</CardTitle><CardDescription>Les règles de stock restent définies au niveau des produits.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-lg bg-info-background p-4 text-sm text-info">L’IMEI reste facultatif. Les grandes entrées peuvent être enregistrées en quantité sans créer une ligne par unité.</div><Button asChild type="button" variant="outline"><Link href={href("/stock")}>Configurer les seuils par produit</Link></Button></CardContent></Card>
        ) : null}

        {tab === "accounting" ? (
          <Card><CardHeader><CardTitle>Modèle comptable</CardTitle><CardDescription>Le plan comptable et les périodes restent gérés dans le module Comptabilité.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild type="button" variant="outline"><Link href={href("/accounting/accounts")}>Ouvrir le plan comptable</Link></Button><Button asChild type="button" variant="outline"><Link href={href("/accounting/periods")}>Exercices et périodes</Link></Button></CardContent></Card>
        ) : null}

        {tab === "fiscal" && can("fiscal.manage") ? (
          <Card>
            <CardHeader><CardTitle>Fiscalité · e-MECeF</CardTitle><CardDescription>Connecteur fiscal facultatif par entreprise. Les secrets restent exclusivement côté serveur.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <label className="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-border p-4"><span><strong className="block text-sm font-semibold">Activer e-MECeF</strong><span className="text-xs text-muted-foreground">Autoriser l’organisation à utiliser le connecteur fiscal configuré côté serveur.</span></span><Switch checked={fiscal} onCheckedChange={setFiscal} /></label>
              {fiscal ? <div className="space-y-3"><div className="flex items-start gap-3 rounded-lg bg-warning-background p-4 text-sm text-warning"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><span>Aucun token fiscal n’est affiché ou conservé dans le navigateur.</span></div><Button type="button" variant="outline" onClick={async () => { setError(""); setStatus(""); try { if (demo) setStatus("Démonstration : aucun connecteur fiscal réel n’est appelé."); else { await request("fiscal/test", { method: "POST", body: JSON.stringify({ organizationId: org.id }) }); setStatus("Connexion vérifiée."); } } catch (caught) { setError((caught as Error).message); } }}><CheckCircle2 /> Tester la connexion</Button></div> : null}
            </CardContent>
          </Card>
        ) : null}

        {tab === "security" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" />Permissions côté serveur</CardTitle><CardDescription>Les sessions et permissions restent contrôlées par le service métier. Un membre suspendu est refusé à la prochaine vérification.</CardDescription></CardHeader><CardContent><Badge variant="success">Contrôle serveur actif</Badge></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-5 text-primary" />Mot de passe</CardTitle><CardDescription>Utilisez le flux sécurisé existant pour changer ou récupérer votre mot de passe.</CardDescription></CardHeader><CardContent><Button asChild type="button" variant="outline"><Link href="/forgot-password">Réinitialiser mon mot de passe</Link></Button></CardContent></Card>
          </div>
        ) : null}

        {error ? <p className="rounded-md bg-destructive-background px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
        {status ? <p className="rounded-md bg-success-background px-3 py-2 text-sm text-success" role="status">{status}</p> : null}
        {saveVisible ? <div className="flex justify-end"><Button disabled={busy}><Save />{busy ? "Enregistrement…" : "Enregistrer les paramètres"}</Button></div> : null}
      </form>

      {storeDialog ? <StoreDialog open={storeDialog} onOpenChange={setStoreDialog} /> : null}
    </div>
  );
}
