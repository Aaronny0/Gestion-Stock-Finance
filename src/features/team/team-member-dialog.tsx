"use client";

import { useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnsavedChanges, useWorkspace } from "@/frontend/provider";
import {
  permissions,
  roleLabels,
  rolePermissions,
  type Permission,
  type RecordRow,
  type Role,
} from "@/frontend/types";

const permissionGroups: { label: string; prefix: string[] }[] = [
  { label: "Ventes", prefix: ["sales."] },
  { label: "Stock", prefix: ["stock."] },
  { label: "Finance & comptabilité", prefix: ["cash.", "finance.", "accounting."] },
  { label: "Pilotage", prefix: ["dashboard.", "analytics.", "exports."] },
  { label: "Administration", prefix: ["team.", "settings.", "fiscal.", "audit."] },
  { label: "Opérations", prefix: ["buyback.", "trade.", "purchases."] },
];

function permissionLabel(permission: Permission) {
  const labels: Partial<Record<Permission, string>> = {
    "dashboard.read": "Consulter le tableau de bord",
    "sales.read": "Consulter les ventes",
    "sales.create": "Créer des ventes",
    "sales.refund": "Enregistrer des retours",
    "sales.sell_below_cost": "Vendre sous le coût",
    "sales.change_price": "Modifier un prix en vente",
    "sales.discount_above_limit": "Dépasser la limite de remise",
    "stock.read": "Consulter le stock",
    "stock.adjust": "Ajuster le stock",
    "stock.transfer": "Transférer du stock",
    "stock.cost.read": "Voir les coûts d’achat",
    "buyback.create": "Créer un rachat",
    "trade.create": "Créer un troc",
    "purchases.manage": "Gérer achats et fournisseurs",
    "cash.open_close": "Ouvrir et clôturer une caisse",
    "cash.manual_movement": "Créer un mouvement manuel",
    "finance.read": "Consulter la finance",
    "accounting.read": "Consulter la comptabilité",
    "accounting.post": "Poster les écritures",
    "accounting.close_period": "Clôturer les périodes",
    "analytics.read": "Consulter les analyses",
    "analytics.cost_margin_read": "Voir coûts et marges analytiques",
    "team.manage": "Gérer l’équipe",
    "settings.manage": "Gérer les paramètres",
    "fiscal.manage": "Gérer la fiscalité",
    "exports.create": "Exporter les données",
    "audit.read": "Consulter l’audit",
  };
  return labels[permission] ?? permission;
}

type TeamMemberDialogProps = {
  open: boolean;
  member?: RecordRow | null;
  onOpenChange: (open: boolean) => void;
};

export function TeamMemberDialog({ open, member, onOpenChange }: TeamMemberDialogProps) {
  const { snapshot, storeId, command } = useWorkspace();
  const editing = Boolean(member);
  const initialRole = (member?.role as Role | undefined) ?? "cashier";
  const [name, setName] = useState(String(member?.label ?? ""));
  const [email, setEmail] = useState(String(member?.email ?? ""));
  const [role, setRole] = useState<Role>(initialRole);
  const [status, setStatus] = useState(String(member?.status ?? "Actif"));
  const [stores, setStores] = useState<string[]>(
    (member?.stores as string[] | undefined) ?? (storeId && storeId !== "all" ? [storeId] : [snapshot!.session.defaultStoreId]),
  );
  const [customPermissions, setCustomPermissions] = useState<Permission[] | null>(
    (member?.permissions as Permission[] | undefined) ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const effectivePermissions = customPermissions ?? rolePermissions[role];
  const signature = JSON.stringify({ name, email, role, status, stores, customPermissions });
  const original = useRef(signature);
  const confirmDiscard = useUnsavedChanges(signature !== original.current, editing ? "Accès du membre" : "Invitation");

  const groupedPermissions = useMemo(
    () => permissionGroups.map((group) => ({
      ...group,
      permissions: permissions.filter((permission) => group.prefix.some((prefix) => permission.startsWith(prefix))),
    })),
    [],
  );

  const requestClose = () => {
    if (!busy && confirmDiscard()) onOpenChange(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!stores.length) {
      setError("Attribuez au moins une boutique.");
      return;
    }
    if (!editing && (!name.trim() || !email.includes("@"))) {
      setError("Nom et email valides requis.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await command("team.update", {
          ...member,
          id: member!.id,
          role,
          status,
          stores,
          permissions: effectivePermissions,
        });
      } else {
        await command("team.invite", {
          label: name.trim(),
          email: email.trim(),
          role,
          stores,
          permissions: effectivePermissions,
        });
      }
      original.current = signature;
      onOpenChange(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier les accès" : "Inviter un membre"}</DialogTitle>
          <DialogDescription>
            Le rôle fournit un modèle de permissions. Les boutiques et permissions effectives restent revalidées par le serveur.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {!editing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="team-name">Nom du membre</Label>
                  <Input id="team-name" required value={name} onChange={(event) => setName(event.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-email">Email</Label>
                  <Input id="team-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(value) => { setRole(value as Role); setCustomPermissions(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).filter(([value]) => value !== "owner").map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                    <SelectItem value="Invitation en attente">Renvoyer l’invitation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <fieldset className="space-y-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-semibold">Boutiques autorisées</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {snapshot!.session.stores.map((store) => (
                <label key={store.id} className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                  <Checkbox
                    checked={stores.includes(store.id)}
                    onCheckedChange={(checked) => setStores(checked ? [...new Set([...stores, store.id])] : stores.filter((id) => id !== store.id))}
                  />
                  <span className="min-w-0"><strong className="block truncate font-medium">{store.name}</strong><span className="text-xs text-muted-foreground">{store.city || "Ville non renseignée"}</span></span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <legend className="text-sm font-semibold">Permissions effectives</legend>
                <p className="text-xs text-muted-foreground">{effectivePermissions.length} permission(s) · modèle {roleLabels[role]}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setCustomPermissions(null)}>
                <RotateCcw /> Réinitialiser selon le rôle
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {groupedPermissions.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                  {group.permissions.map((permission) => (
                    <label key={permission} className="flex min-h-10 items-center gap-3 text-sm">
                      <Checkbox
                        checked={effectivePermissions.includes(permission)}
                        onCheckedChange={(checked) => setCustomPermissions(
                          checked
                            ? [...new Set([...effectivePermissions, permission])]
                            : effectivePermissions.filter((value) => value !== permission),
                        )}
                      />
                      <span>{permissionLabel(permission)}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </fieldset>

          {error ? <p className="rounded-md bg-destructive-background px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={requestClose}>Annuler</Button>
            <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer les accès" : "Envoyer l’invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
