"use client";
import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "./provider";
import { ActionForm } from "./forms";
import { Alert, Badge, DataTable, Money, PageHeading } from "./ui";
import { dueState, replenishment, salePosition } from "./operations";
export function Credits() {
  const { snapshot, storeId, href, can } = useWorkspace();
  const db = snapshot!.data;
  const [filter, setFilter] = useState("Tous"),
    [payment, setPayment] = useState<{
      sourceId: string;
      amount: number;
    } | null>(null);
  const rows = db.sales
    .filter(
      (s) =>
        (storeId === "all" || s.storeId === storeId) && salePosition(s).due > 0,
    )
    .map((s) => ({
      ...s,
      due: salePosition(s).due,
      client:
        db.clients.find((c) => c.id === s.clientId)?.label ??
        "Client non renseigné",
      deadline: dueState(s, new Date().toISOString()).label,
    }))
    .filter((s) => filter === "Tous" || s.deadline === filter)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  return (
    <>
      <PageHeading
        eyebrow="SUIVI CLIENT"
        title="Les crédits à suivre."
        description="Retrouvez les soldes impayés et leurs échéances, indépendamment du filtre de période."
        action={
          <Link className="button secondary" href={href("/sales")}>
            Toutes les ventes
          </Link>
        }
      />
      <div className="tabs">
        {[
          "Tous",
          "En retard",
          "Échéance aujourd’hui",
          "À venir",
          "Échéance à définir",
        ].map((v) => (
          <button
            key={v}
            className={v === filter ? "active" : ""}
            onClick={() => setFilter(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="compact-metrics">
        <span>
          Dossiers affichés<strong>{rows.length}</strong>
        </span>
        <span>
          Reste à encaisser
          <strong>
            <Money value={rows.reduce((n, r) => n + r.due, 0)} />
          </strong>
        </span>
      </div>
      <DataTable
        name="credits-clients"
        rows={rows}
        columns={[
          {
            key: "reference",
            label: "Vente",
            render: (r) => (
              <Link className="text-button" href={href("/sales/" + r.id)}>
                {r.reference}
              </Link>
            ),
          },
          { key: "client", label: "Client" },
          {
            key: "dueDate",
            label: "Échéance",
            render: (r) =>
              r.dueDate
                ? new Date(r.dueDate + "T12:00:00").toLocaleDateString("fr-FR")
                : "À définir",
          },
          {
            key: "deadline",
            label: "Suivi",
            render: (r) => <Badge value={r.deadline} />,
          },
          {
            key: "due",
            label: "Reste dû",
            render: (r) => <Money value={r.due} />,
          },
          {
            key: "action",
            label: "Action",
            render: (r) =>
              can("finance.read") && (
                <button
                  className="text-button"
                  disabled={storeId === "all"}
                  onClick={() => setPayment({ sourceId: r.id, amount: r.due })}
                >
                  Encaisser
                </button>
              ),
          },
        ]}
      />
      {payment && (
        <ActionForm
          type="payment.create"
          title="Encaisser un règlement"
          initial={payment}
          onClose={() => setPayment(null)}
        />
      )}
    </>
  );
}
export function Replenishment() {
  const { snapshot, storeId, can, href } = useWorkspace();
  const db = snapshot!.data;
  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(
    null,
  );
  const rows = db.products
    .filter(
      (p) =>
        p.active &&
        (storeId === "all" || p.storeId === storeId) &&
        p.quantity <= p.threshold,
    )
    .map((p) => ({
      ...p,
      label: `${p.brand} ${p.model} ${p.variant}`,
      supplier:
        db.suppliers.find((s) => s.id === p.supplierId)?.label ?? "À choisir",
      ...replenishment(p),
    }));
  return (
    <>
      <PageHeading
        eyebrow="PRÉPARATION DES ACHATS"
        title="Anticipez les ruptures."
        description="Une proposition par produit sous son seuil d’alerte. Ajustez la quantité et le fournisseur avant de confirmer un achat."
        action={
          <Link className="button secondary" href={href("/stock")}>
            Retour au stock
          </Link>
        }
      />
      <Alert>
        La cible est configurable dans la fiche produit. À défaut, elle
        correspond au double du seuil, avec un minimum d’une unité. Aucune
        commande fournisseur n’est envoyée automatiquement.
      </Alert>
      <DataTable
        name="reapprovisionnement"
        rows={rows}
        columns={[
          { key: "label", label: "Produit" },
          {
            key: "quantity",
            label: "Disponible",
            render: (r) => (
              <Badge
                value={
                  r.quantity === 0 ? "Rupture" : `${r.quantity} · Stock faible`
                }
              />
            ),
          },
          { key: "threshold", label: "Seuil" },
          { key: "target", label: "Cible" },
          { key: "suggested", label: "À prévoir" },
          { key: "supplier", label: "Fournisseur" },
          {
            key: "action",
            label: "Action",
            render: (r) =>
              can("purchases.manage") && (
                <button
                  className="text-button"
                  disabled={storeId === "all" || !r.suggested}
                  onClick={() =>
                    setPurchase({
                      productId: r.id,
                      quantity: r.suggested,
                      cost: r.cost ?? 0,
                      supplierId: r.supplierId ?? "",
                    })
                  }
                >
                  Préparer un achat
                </button>
              ),
          },
        ]}
      />
      {purchase && (
        <ActionForm
          type="purchase.create"
          title="Préparer le réapprovisionnement"
          initial={purchase}
          onClose={() => setPurchase(null)}
        />
      )}
    </>
  );
}
