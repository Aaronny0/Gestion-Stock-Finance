"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/data-display/data-table";
import { ListCard } from "@/components/data-display/list-card";
import { SummaryItem, SummaryStrip } from "@/components/data-display/summary-strip";
import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/frontend/provider";
import { roleLabels, rolePermissions, type RecordRow, type Role } from "@/frontend/types";
import { permissionLabel, TeamMemberDialog } from "./team-member-dialog";
import { plural } from "@/lib/format";
import type { Permission } from "@/frontend/types";

function initials(label: string) {
  return label.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function TeamPage() {
  const { snapshot, can } = useWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const team = snapshot!.data.team;
  const currentUserId = snapshot!.session.user.id;

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => [
    {
      accessorKey: "label",
      header: "Membre",
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{initials(row.original.label)}</span>
          <span className="min-w-0"><strong className="block truncate text-sm font-semibold">{row.original.label}</strong><span className="block truncate text-xs text-muted-foreground">{String(row.original.email ?? "")}</span></span>
        </div>
      ),
    },
    { accessorKey: "role", header: "Rôle", cell: ({ row }) => roleLabels[row.original.role as Role] ?? String(row.original.role ?? "—") },
    {
      id: "stores",
      header: "Boutiques",
      accessorFn: (member) => ((member.stores as string[]) ?? []).map((id) => snapshot!.session.stores.find((store) => store.id === id)?.name ?? id).join(", "),
      cell: ({ row }) => {
        const ids = (row.original.stores as string[]) ?? [];
        return <div className="flex flex-wrap gap-1">{ids.length ? ids.map((id) => <Badge key={id} variant="secondary">{snapshot!.session.stores.find((store) => store.id === id)?.name ?? id}</Badge>) : <span className="text-muted-foreground">Aucune</span>}</div>;
      },
    },
    { accessorKey: "status", header: "Statut", cell: ({ row }) => <StatusBadge value={String(row.original.status)} /> },
    {
      id: "permissions",
      header: "Permissions",
      meta: { align: "right" },
      accessorFn: (member) => ((member.permissions as string[]) ?? rolePermissions[(member.role as Role) ?? "cashier"] ?? []).length,
      cell: ({ row }) => {
        const permissions = (row.original.permissions as string[] | undefined) ?? rolePermissions[(row.original.role as Role) ?? "cashier"] ?? [];
        return <span className="tabular-nums">{permissions.length}</span>;
      },
    },
  ], [snapshot]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe & rôles"
        description="Invitez vos collaborateurs, attribuez leurs boutiques et contrôlez précisément leurs permissions."
        primaryAction={can("team.manage") ? <Button onClick={() => { setSelected(null); setDialogOpen(true); }}><Plus /> Inviter un membre</Button> : undefined}
      />

      <SummaryStrip aria-label="Synthèse de l’équipe">
        <SummaryItem label="Membres" value={team.length} meta={`${plural(team.filter((member) => member.status === "Invitation en attente").length, "invitation")} en attente`} />
        <SummaryItem label="Boutiques" value={snapshot!.session.stores.length} />
        <SummaryItem label="Permissions disponibles" value={rolePermissions.owner.length} />
      </SummaryStrip>

      <ListCard aria-label="Membres de l’équipe">
      <DataTable
        name="equipe"
        data={team}
        columns={columns}
        getRowId={(row) => row.id}
        searchPlaceholder="Rechercher un membre…"
        canExport={can("exports.create")}
        exportRow={(member) => ({
          Membre: member.label,
          Email: String(member.email ?? ""),
          Role: roleLabels[member.role as Role] ?? String(member.role ?? ""),
          Boutiques: ((member.stores as string[]) ?? []).map((id) => snapshot!.session.stores.find((store) => store.id === id)?.name ?? id).join(", "),
          Statut: member.status,
        })}
        onRow={(member) => {
          if (member.id === currentUserId || !can("team.manage")) return;
          setSelected(member);
          setDialogOpen(true);
        }}
        emptyKind="first-use"
        emptyTitle="Aucun membre"
        mobileRow={(member) => (
          <div>
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{initials(member.label)}</span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{member.label}</p><p className="truncate text-xs text-muted-foreground">{roleLabels[member.role as Role] ?? String(member.role ?? "")}</p></div>
              </div>
              <StatusBadge value={String(member.status)} />
            </div>
          </div>
        )}
      />
      </ListCard>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Modèles de rôles</h2><p className="text-sm text-muted-foreground">Ces modèles servent de base. Les permissions effectives d’un membre peuvent être personnalisées et restent validées par le serveur.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(roleLabels).map(([role, label]) => (
            <Card key={role} className="shadow-none">
              <CardHeader><CardTitle className="flex items-center justify-between gap-2"><span>{label}</span><Badge variant="secondary">{rolePermissions[role as Role].length}</Badge></CardTitle><CardDescription>{role === "owner" ? "Accès complet à l’organisation." : "Modèle de permissions opérationnelles."}</CardDescription></CardHeader>
              <CardContent><div className="flex flex-wrap gap-1.5">{rolePermissions[role as Role].slice(0, 6).map((permission) => <Badge key={permission} variant="outline">{permissionLabel(permission as Permission)}</Badge>)}{rolePermissions[role as Role].length > 6 ? <Badge variant="secondary">+{rolePermissions[role as Role].length - 6}</Badge> : null}</div></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {dialogOpen ? <TeamMemberDialog key={selected?.id ?? "new"} open={dialogOpen} member={selected} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelected(null); }} /> : null}
    </div>
  );
}
