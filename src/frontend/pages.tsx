"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FiPlus,
  FiArrowRight,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiRepeat,
  FiShoppingBag,
  FiUpload,
  FiPackage,
  FiUsers,
} from "react-icons/fi";
import { useWorkspace, useViewState } from "./provider";
import { canonical } from "./navigation";
import { Credits, Replenishment } from "./workflows";
import ReturnForm from "./returns";
import { salePosition, dueState } from "./operations";
import { ActionForm } from "./forms";
import {
  Alert,
  Badge,
  DataTable,
  DateRangePicker,
  Modal,
  Money,
  PageHeading,
  type Column,
} from "./ui";
import {
  roleLabels,
  rolePermissions,
  type Product,
  type RecordRow,
  type Sale,
} from "./types";
import Dashboard from "./dashboard";
import POS, { Receipt } from "./pos";
import ImportStock from "./import-stock";
const AccountingPage = dynamic(() => import("./accounting-page"));
const Analytics = dynamic(() => import("./analytics"));
const Settings = dynamic(() => import("./settings"));
export default function WorkspacePage() {
  const path = canonical(usePathname());
  if (path === "/") return <Dashboard />;
  if (path === "/sales/credits") return <Credits />;
  if (path === "/stock/replenishment") return <Replenishment />;
  if (path === "/pos") return <POS />;
  if (path.startsWith("/accounting")) return <AccountingPage path={path} />;
  if (path.startsWith("/analytics")) return <Analytics path={path} />;
  if (path.startsWith("/settings")) return <Settings path={path} />;
  return <BusinessPage path={path} />;
}
function BusinessPage({ path }: { path: string }) {
  const { snapshot, storeId, start, end, href, can } = useWorkspace(),
    router = useRouter();
  const db = snapshot!.data;
  const [action, setAction] = useState<{
      type: string;
      title: string;
      initial?: Record<string, unknown>;
    } | null>(null),
    [selected, setSelected] = useState<RecordRow | null>(null),
    [returnSale, setReturnSale] = useState<Sale | null>(null),
    [receipt, setReceipt] = useState<Sale | null>(null),
    [importing, setImporting] = useState(false),
    [brand, setBrand] = useViewState("brand", ""),
    [condition, setCondition] = useViewState("condition", ""),
    [archived, setArchived] = useViewState("archived", false),
    [low, setLow] = useViewState(
      "low",
      typeof location !== "undefined" &&
        new URLSearchParams(location.search).get("low") === "1",
    );
  useEffect(() => {
    const sourceId = path.split("/")[2];
    if (!sourceId) return;
    const collections: Record<string, RecordRow[]> = {
      purchases: db.purchases,
      suppliers: db.suppliers,
      expenses: db.expenses,
      trade: db.trades,
      buyback: db.buybacks,
      clients: db.clients,
      audit: db.audit,
    };
    const record = collections[path.split("/")[1]]?.find(
      (r) =>
        r.id === sourceId &&
        (!r.storeId || storeId === "all" || r.storeId === storeId),
    );
    if (record) setSelected(record);
  }, [path, storeId, db]);
  const query =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search)
      : new URLSearchParams();
  const scope = (v: { storeId?: string; date: string }) =>
    (!v.storeId || storeId === "all" || v.storeId === storeId) &&
    v.date.slice(0, 10) >= start &&
    v.date.slice(0, 10) <= end;
  const scopedProducts = db.products.filter(
    (p) => storeId === "all" || p.storeId === storeId,
  );
  const launch = (
    type: string,
    title: string,
    initial?: Record<string, unknown>,
  ) => setAction({ type, title, initial });
  const button = (type: string, title: string) => (
    <button className="button primary" onClick={() => launch(type, title)}>
      <FiPlus />
      {title}
    </button>
  );
  let content: React.ReactNode;
  if (path.startsWith("/products/")) {
    const product = scopedProducts.find((p) => p.id === path.split("/")[2]);
    content = !product ? (
      <Alert error>Produit introuvable dans la boutique active.</Alert>
    ) : (
      <>
        <PageHeading
          eyebrow="FICHE PRODUIT"
          title={`${product.brand} ${product.model}`}
          description={`${product.variant} · ${product.condition}`}
          action={
            can("stock.adjust") && (
              <button
                className="button primary"
                onClick={() =>
                  launch(
                    "product.save",
                    "Modifier le produit",
                    product as unknown as Record<string, unknown>,
                  )
                }
              >
                Modifier le produit
              </button>
            )
          }
        />
        <div className="compact-metrics">
          <span>
            Stock <strong>{product.quantity} unités</strong>
          </span>
          <span>
            Prix de vente{" "}
            <strong>
              <Money value={product.price} />
            </strong>
          </span>
          {can("stock.cost.read") && (
            <span>
              Coût unitaire{" "}
              <strong>
                <Money value={product.cost ?? 0} />
              </strong>
            </span>
          )}
          <span>
            IMEI <strong>{product.imei || "Non renseigné"}</strong>
          </span>
        </div>
        <div className="action-toolbar">
          {can("stock.adjust") && button("stock.entry", "Nouvelle entrée")}
          {can("stock.adjust") && (
            <button
              className="button secondary"
              onClick={() =>
                launch("stock.adjust", "Ajuster le stock", {
                  productId: product.id,
                  quantity: product.quantity,
                })
              }
            >
              Ajuster
            </button>
          )}
          {can("stock.transfer") && (
            <button
              className="button secondary"
              onClick={() =>
                launch("stock.transfer", "Transférer", {
                  productId: product.id,
                })
              }
            >
              Transférer
            </button>
          )}
          {can("stock.adjust") && (
            <button
              className="button secondary"
              onClick={() =>
                launch("product.archive", "Archiver le produit", {
                  productId: product.id,
                })
              }
            >
              Archiver
            </button>
          )}
        </div>
        <DataTable
          name="historique-produit"
          rows={db.stockEntries.filter((r) => r.productId === product.id)}
          columns={[
            { key: "date", label: "Date" },
            { key: "label", label: "Opération" },
            { key: "quantity", label: "Quantité" },
            { key: "reason", label: "Motif" },
          ]}
        />
      </>
    );
  } else if (path.startsWith("/stock")) {
    const tab = path.split("/")[2] || "catalog";
    const products = scopedProducts.filter(
      (p) =>
        p.active !== archived &&
        (!brand || p.brand === brand) &&
        (!condition || p.condition === condition) &&
        (!low || p.quantity <= p.threshold),
    );
    const columns: Column<Product>[] = [
      {
        key: "model",
        label: "Produit",
        value: (p) => `${p.brand} ${p.model} ${p.imei ?? ""}`,
        render: (p) => (
          <div className="product-cell">
            <span className="mini-product">
              <FiPackage />
            </span>
            <span>
              <strong>
                {p.brand} {p.model}
              </strong>
              <small>{p.imei ? `IMEI ${p.imei}` : p.condition}</small>
            </span>
          </div>
        ),
      },
      { key: "variant", label: "Variante" },
      {
        key: "quantity",
        label: "Quantité",
        value: (p) => p.quantity,
        render: (p) => (
          <span className={p.quantity <= p.threshold ? "stock-warning" : ""}>
            {p.quantity} unités
          </span>
        ),
      },
      {
        key: "price",
        label: "Prix de vente",
        render: (p) => <Money value={p.price} />,
      },
      ...(can("stock.cost.read")
        ? [
            {
              key: "value",
              label: "Valeur du stock",
              value: (p: Product) => (p.cost ?? 0) * p.quantity,
              render: (p: Product) => (
                <Money value={(p.cost ?? 0) * p.quantity} />
              ),
            },
          ]
        : []),
      {
        key: "status",
        label: "État du stock",
        render: (p) => (
          <Badge
            value={
              p.quantity === 0
                ? "Rupture"
                : p.quantity <= p.threshold
                  ? "Stock faible"
                  : "Disponible"
            }
          />
        ),
      },
    ];
    content = (
      <>
        <PageHeading
          eyebrow="STOCK & CATALOGUE"
          title="Le bon stock, au bon endroit."
          description="Retrouvez vos produits, anticipez les ruptures et gérez vos arrivages."
          action={
            can("stock.adjust") && button("stock.entry", "Nouvelle entrée")
          }
        />
        <div className="compact-metrics">
          <span>
            Références <strong>{products.length}</strong>
          </span>
          <span>
            Unités disponibles{" "}
            <strong>{products.reduce((s, p) => s + p.quantity, 0)}</strong>
          </span>
          <span>
            Sous le seuil{" "}
            <strong>
              {products.filter((p) => p.quantity <= p.threshold).length}
            </strong>
          </span>
          {can("stock.cost.read") && (
            <span>
              Valeur du stock{" "}
              <strong>
                <Money
                  value={products.reduce(
                    (s, p) => s + (p.cost ?? 0) * p.quantity,
                    0,
                  )}
                />
              </strong>
            </span>
          )}
        </div>
        <div className="overview-toolbar">
          <div className="tabs">
            {[
              ["catalog", "Catalogue"],
              ["entries", "Entrées & ajustements"],
              ["transfers", "Transferts"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={tab === key ? "active" : ""}
                href={href(key === "catalog" ? "/stock" : "/stock/" + key)}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="action-toolbar">
            {can("stock.adjust") && (
              <>
                <button
                  className="button secondary"
                  onClick={() => setImporting(true)}
                >
                  <FiUpload />
                  Importer
                </button>
                <button
                  className="button secondary"
                  onClick={() => launch("product.save", "Créer un produit")}
                >
                  <FiPlus />
                  Produit
                </button>
              </>
            )}
            {can("stock.transfer") && (
              <button
                className="button secondary"
                onClick={() => launch("stock.transfer", "Transférer du stock")}
              >
                <FiRepeat />
                Transférer
              </button>
            )}
          </div>
        </div>
        {tab === "catalog" ? (
          <DataTable
            name="stock"
            rows={products}
            columns={columns}
            onRow={(p) => router.push(href("/products/" + p.id))}
            filters={
              <>
                <select
                  aria-label="Marque du stock"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                >
                  <option value="">Toutes marques</option>
                  {[...new Set(scopedProducts.map((p) => p.brand))].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <select
                  aria-label="État des produits"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="">Tous états</option>
                  {["Neuf", "Occasion", "Reconditionné"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={low}
                    onChange={(e) => setLow(e.target.checked)}
                  />
                  Stock faible
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={archived}
                    onChange={(e) => setArchived(e.target.checked)}
                  />
                  Archivés
                </label>
              </>
            }
          />
        ) : (
          <>
            <DateRangePicker />
            <DataTable
              name={tab}
              rows={(tab === "transfers"
                ? db.transfers
                : db.stockEntries
              ).filter(scope)}
              columns={[
                { key: "date", label: "Date" },
                { key: "label", label: "Produit" },
                { key: "quantity", label: "Quantité" },
                { key: "reason", label: "Motif" },
                {
                  key: "status",
                  label: "Statut",
                  render: (r) => <Badge value={r.status} />,
                },
                ...(tab === "transfers"
                  ? [
                      {
                        key: "destination",
                        label: "Destination",
                        render: (r: RecordRow) =>
                          snapshot!.session.stores.find(
                            (s) => s.id === r.destination,
                          )?.name ?? "—",
                      },
                    ]
                  : []),
              ]}
              onRow={setSelected}
            />
          </>
        )}
      </>
    );
  } else if (path.startsWith("/sales")) {
    const saleId = path.split("/")[2];
    const sales = db.sales.filter(
      (s) =>
        scope(s) &&
        (!query.get("brand") ||
          s.lines.some((l) => l.brand === query.get("brand"))) &&
        (!query.get("seller") || s.seller === query.get("seller")) &&
        (!query.get("product") ||
          s.lines.some((l) => l.label === query.get("product"))),
    );
    const sale = saleId
      ? db.sales.find(
          (s) =>
            s.id === saleId && (storeId === "all" || s.storeId === storeId),
        )
      : undefined;
    content = (
      <>
        <PageHeading
          eyebrow="VENTES"
          title={sale ? sale.reference : "Chaque vente compte."}
          description="Consultez les reçus, suivez les crédits et retrouvez vos transactions."
          action={
            can("sales.create") && (
              <Link className="button primary" href={href("/pos")}>
                <FiPlus />
                Nouvelle vente
              </Link>
            )
          }
        />
        <div className="action-toolbar">
          <Link className="button secondary" href={href("/sales/credits")}>
            Crédits et échéances
          </Link>
        </div>
        {saleId && !sale ? (
          <Alert error>Vente introuvable dans cette boutique.</Alert>
        ) : sale ? (
          <>
            <div className="compact-metrics">
              <span>
                Montant{" "}
                <strong>
                  <Money value={salePosition(sale).netTotal} />
                </strong>
              </span>
              <span>
                Payé{" "}
                <strong>
                  <Money value={salePosition(sale).netPaid} />
                </strong>
              </span>
              <span>
                Reste dû{" "}
                <strong>
                  <Money value={salePosition(sale).due} />
                </strong>
              </span>
              <Badge value={sale.status} />
              {salePosition(sale).due > 0 && (
                <Badge value={dueState(sale, new Date().toISOString()).label} />
              )}
            </div>
            <DataTable
              name="articles-vendus"
              rows={sale.lines.map((l, i) => ({ ...l, id: String(i) }))}
              columns={[
                { key: "label", label: "Article" },
                { key: "quantity", label: "Quantité" },
                {
                  key: "price",
                  label: "Prix unitaire",
                  render: (l) => <Money value={l.price} />,
                },
                { key: "imei", label: "IMEI facultatif" },
              ]}
            />
            {!!sale.returns?.length && (
              <div className="return-history workflow-list">
                {sale.returns.map((r) => (
                  <div className="workflow-row" key={r.id}>
                    <strong>
                      Retour du {new Date(r.date).toLocaleDateString("fr-FR")}
                    </strong>
                    <p>
                      {r.reason} · <Money value={r.amount} /> · Remboursé :{" "}
                      <Money value={r.cashRefund} />
                    </p>
                    <p>
                      {r.lines
                        .map(
                          (l) =>
                            `${l.quantity} × ${sale.lines[l.lineIndex].label} (${l.restock ? "remis en stock" : "défectueux"})`,
                        )
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="action-toolbar">
              <button
                className="button primary"
                onClick={() => setReceipt(sale)}
              >
                Voir le reçu / Imprimer
              </button>
              {salePosition(sale).due > 0 && can("finance.read") && (
                <button
                  className="button secondary"
                  onClick={() =>
                    launch("payment.create", "Encaisser un règlement", {
                      sourceId: sale.id,
                      amount: salePosition(sale).due,
                    })
                  }
                >
                  Enregistrer un paiement
                </button>
              )}
              {can("sales.refund") &&
                sale.status !== "refunded" &&
                !sale.tradeValue && (
                  <button
                    className="button secondary"
                    onClick={() => setReturnSale(sale)}
                  >
                    Retourner / rembourser
                  </button>
                )}
              {can("accounting.read") && (
                <Link className="button secondary" href={href("/accounting")}>
                  Écritures comptables
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <DateRangePicker />
            <DataTable
              name="ventes"
              rows={sales}
              columns={[
                {
                  key: "reference",
                  label: "Référence",
                  value: (s) =>
                    `${s.reference} ${s.lines.map((l) => l.imei ?? "").join(" ")}`,
                },
                {
                  key: "date",
                  label: "Date",
                  render: (s) => new Date(s.date).toLocaleDateString("fr-FR"),
                },
                { key: "seller", label: "Vendeur" },
                {
                  key: "total",
                  label: "Montant net",
                  value: (s) => salePosition(s).netTotal,
                  render: (s) => <Money value={salePosition(s).netTotal} />,
                },
                {
                  key: "paid",
                  label: "Paiement net",
                  value: (s) => salePosition(s).netPaid,
                  render: (s) => <Money value={salePosition(s).netPaid} />,
                },
                {
                  key: "due",
                  label: "Reste dû",
                  value: (s) => salePosition(s).due,
                  render: (s) => <Money value={salePosition(s).due} />,
                },
                {
                  key: "status",
                  label: "Statut",
                  render: (s) => <Badge value={s.status} />,
                },
              ]}
              onRow={(s) => router.push(href("/sales/" + s.id))}
            />
          </>
        )}
      </>
    );
  } else if (path.startsWith("/trade") || path.startsWith("/buyback")) {
    const trade = path.startsWith("/trade");
    content = (
      <>
        <PageHeading
          eyebrow={trade ? "TROC & REPRISE" : "RACHAT CLIENT"}
          title={
            trade
              ? "Un échange, de nouvelles possibilités."
              : "Donnez une seconde vie aux appareils."
          }
          description={
            trade
              ? "Un téléphone entre, un autre sort. Le complément reste clairement identifié."
              : "Un appareil rejoint votre stock et son règlement est suivi en trésorerie."
          }
          action={button(
            trade ? "trade.create" : "buyback.create",
            trade ? "Nouveau troc" : "Nouveau rachat",
          )}
        />
        <div className="trade-flow">
          <div>
            <span className="flow-icon green">
              <FiArrowDownLeft />
            </span>
            <h3>Appareil du client</h3>
            <p>
              Marque, modèle, état et valeur de reprise.
              <br />
              IMEI facultatif.
            </p>
          </div>
          <FiArrowRight />
          <div>
            <span className="flow-icon violet">
              {trade ? <FiRepeat /> : <FiShoppingBag />}
            </span>
            <h3>{trade ? "Appareil de la boutique" : "Règlement au client"}</h3>
            <p>
              {trade
                ? "Sélection depuis le stock disponible."
                : "Espèces, Mobile Money ou virement."}
            </p>
          </div>
          <FiArrowRight />
          <div>
            <span className="flow-icon blue">
              <FiArrowUpRight />
            </span>
            <h3>{trade ? "Complément encaissé" : "Entrée en stock"}</h3>
            <p>
              {trade
                ? "Prix boutique moins valeur de reprise."
                : "Le rachat ne crée aucun chiffre d’affaires."}
            </p>
          </div>
        </div>
        <div className="overview-toolbar">
          <h2>{trade ? "Historique des trocs" : "Historique des rachats"}</h2>
          <DateRangePicker />
        </div>
        <DataTable
          name={trade ? "trocs" : "rachats"}
          rows={(trade ? db.trades : db.buybacks).filter(scope)}
          columns={[
            { key: "date", label: "Date" },
            { key: "label", label: "Appareil repris" },
            {
              key: "amount",
              label: "Valeur de reprise",
              render: (r) => <Money value={r.amount ?? 0} />,
            },
            ...(trade
              ? [
                  {
                    key: "complement",
                    label: "Complément",
                    render: (r: RecordRow) => (
                      <Money value={Number(r.complement ?? 0)} />
                    ),
                  },
                ]
              : []),
            {
              key: "status",
              label: "Statut",
              render: (r) => <Badge value={r.status} />,
            },
          ]}
          onRow={setSelected}
        />
      </>
    );
  } else if (path.startsWith("/cash")) {
    const sessions = db.cash.filter((c) => !c.storeId || c.storeId === storeId);
    const current = sessions.find((c) => c.status === "open");
    const payments = db.payments.filter(scope);
    const balance =
      Number(current?.opening ?? 0) +
      db.payments
        .filter(
          (p) =>
            p.storeId === storeId &&
            p.method === "Espèces" &&
            p.date >= String(current?.openedAt ?? "9999"),
        )
        .reduce((s, p) => s + (p.direction === "in" ? p.amount : -p.amount), 0);
    content = (
      <>
        <PageHeading
          eyebrow="CAISSE & TRÉSORERIE"
          title="Suivez l’argent qui circule."
          description="Vos encaissements et décaissements, distincts de votre chiffre d’affaires."
          action={
            can("cash.open_close") &&
            button(
              current ? "cash.close" : "cash.open",
              current ? "Clôturer la caisse" : "Ouvrir la caisse",
            )
          }
        />
        <div className="compact-metrics">
          <span>
            Caisse {current ? "ouverte" : "fermée"}
            <strong>
              <Money value={balance} />
            </strong>
          </span>
          <span>
            Encaissements de la période
            <strong>
              <Money
                value={payments
                  .filter((p) => p.direction === "in")
                  .reduce((s, p) => s + p.amount, 0)}
              />
            </strong>
          </span>
          <span>
            Décaissements de la période
            <strong>
              <Money
                value={payments
                  .filter((p) => p.direction === "out")
                  .reduce((s, p) => s + p.amount, 0)}
              />
            </strong>
          </span>
        </div>
        <div className="overview-toolbar">
          <DateRangePicker />
          {can("cash.manual_movement") &&
            button("cash.movement", "Mouvement manuel")}
        </div>
        <DataTable
          name="sessions-caisse"
          rows={sessions}
          columns={[
            { key: "date", label: "Ouverture" },
            { key: "label", label: "Caisse" },
            {
              key: "status",
              label: "Statut",
              render: (r) => <Badge value={r.status} />,
            },
            {
              key: "opening",
              label: "Solde initial",
              render: (r) => <Money value={Number(r.opening ?? 0)} />,
            },
            {
              key: "counted",
              label: "Montant compté",
              render: (r) =>
                r.counted !== undefined ? (
                  <Money value={Number(r.counted)} />
                ) : (
                  "—"
                ),
            },
            {
              key: "difference",
              label: "Écart",
              render: (r) =>
                r.difference !== undefined ? (
                  <Money value={Number(r.difference)} />
                ) : (
                  "—"
                ),
            },
          ]}
          onRow={setSelected}
        />
        {can("finance.read") && (
          <DataTable
            name="mouvements-caisse"
            rows={payments}
            columns={[
              { key: "date", label: "Date" },
              { key: "label", label: "Opération" },
              { key: "method", label: "Mode" },
              {
                key: "direction",
                label: "Sens",
                render: (p) => (p.direction === "in" ? "Entrée" : "Sortie"),
              },
              {
                key: "amount",
                label: "Montant",
                render: (p) => <Money value={p.amount} />,
              },
            ]}
          />
        )}
      </>
    );
  } else if (path.startsWith("/team")) {
    content = (
      <>
        <PageHeading
          eyebrow="ÉQUIPE & PERMISSIONS"
          title="Les bonnes personnes, les bons accès."
          description="Invitez vos collaborateurs et attribuez les boutiques de leur périmètre."
          action={button("team.invite", "Inviter un membre")}
        />
        <DataTable
          name="équipe"
          rows={db.team}
          columns={[
            {
              key: "label",
              label: "Membre",
              render: (m) => (
                <div className="member-cell">
                  <span className="user-avatar">
                    {m.label
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <strong>{m.label}</strong>
                    <small>{String(m.email ?? "")}</small>
                  </span>
                </div>
              ),
            },
            {
              key: "role",
              label: "Rôle",
              render: (m) =>
                roleLabels[m.role as keyof typeof roleLabels] ?? String(m.role),
            },
            {
              key: "stores",
              label: "Boutiques",
              render: (m) =>
                ((m.stores as string[]) ?? [])
                  .map(
                    (id) =>
                      snapshot!.session.stores.find((s) => s.id === id)?.name,
                  )
                  .join(", "),
            },
            {
              key: "status",
              label: "Statut",
              render: (m) => <Badge value={m.status} />,
            },
            {
              key: "actions",
              label: "Accès",
              render: (m) =>
                m.id !== snapshot!.session.user.id && (
                  <button
                    className="text-button"
                    onClick={() =>
                      launch("team.update", "Modifier les accès", m)
                    }
                  >
                    Modifier
                  </button>
                ),
            },
          ]}
        />
        <section className="panel roles-panel">
          <h2>Modèles de rôles</h2>
          <p>Les permissions effectives sont reçues du serveur.</p>
          <div className="role-grid">
            {Object.entries(roleLabels).map(([role, label]) => (
              <details key={role}>
                <summary>
                  <FiUsers />
                  {label}
                </summary>
                <ul>
                  {rolePermissions[role as keyof typeof rolePermissions].map(
                    (p) => (
                      <li key={p}>{p}</li>
                    ),
                  )}
                </ul>
              </details>
            ))}
          </div>
        </section>
      </>
    );
  } else {
    const key = path.split("/")[1];
    const config: Record<
      string,
      {
        title: string;
        description: string;
        collection:
          | "purchases"
          | "suppliers"
          | "expenses"
          | "clients"
          | "audit";
        action?: string;
        actionLabel?: string;
      }
    > = {
      purchases: {
        title: "Vos achats, bien suivis.",
        description:
          "Réceptions de marchandises, factures et dettes fournisseurs.",
        collection: "purchases",
        action: "purchase.create",
        actionLabel: "Nouvel achat",
      },
      suppliers: {
        title: "Des partenaires de confiance.",
        description: "Coordonnées, achats et soldes de vos fournisseurs.",
        collection: "suppliers",
        action: "supplier.save",
        actionLabel: "Nouveau fournisseur",
      },
      expenses: {
        title: "Chaque dépense à sa place.",
        description:
          "Suivez vos charges et leurs justificatifs, sans effacer l’historique.",
        collection: "expenses",
        action: "expense.create",
        actionLabel: "Nouvelle dépense",
      },
      clients: {
        title: "Vos clients, au cœur de l’activité.",
        description:
          "Retrouvez les coordonnées, les achats et les montants dus.",
        collection: "clients",
        action: "client.save",
        actionLabel: "Nouveau client",
      },
      audit: {
        title: "Un historique qui garde la trace.",
        description:
          "Événements, acteurs, motifs et transactions sources. Journaux en lecture seule.",
        collection: "audit",
      },
    };
    const c = config[key];
    if (key === "payments") {
      content = (
        <>
          <PageHeading
            title="Des règlements sans zone d’ombre."
            description="Encaissements clients et paiements fournisseurs."
            action={button("payment.create", "Enregistrer un règlement")}
          />
          <DateRangePicker />
          <DataTable
            name="paiements"
            rows={db.payments.filter(
              (p) =>
                scope(p) &&
                (!query.get("method") || p.method === query.get("method")),
            )}
            columns={[
              { key: "date", label: "Date" },
              { key: "label", label: "Référence" },
              { key: "method", label: "Mode" },
              {
                key: "direction",
                label: "Sens",
                render: (p) =>
                  p.direction === "in" ? "Encaissement" : "Décaissement",
              },
              {
                key: "amount",
                label: "Montant",
                render: (p) => <Money value={p.amount} />,
              },
            ]}
            onRow={(p) => {
              const sale = db.sales.find((s) => s.id === p.sourceId);
              if (sale) router.push(href("/sales/" + sale.id));
              else
                setSelected({
                  id: p.id,
                  label: p.label,
                  date: p.date,
                  status: "Validé",
                  amount: p.amount,
                  sourceId: p.sourceId,
                });
            }}
          />
        </>
      );
    } else if (c) {
      const rows = db[c.collection]
        .filter((r) => ["clients", "suppliers"].includes(key) || scope(r))
        .map((r) =>
          key === "suppliers"
            ? {
                ...r,
                amount: db.purchases
                  .filter(
                    (p) =>
                      p.supplierId === r.id &&
                      (storeId === "all" || p.storeId === storeId),
                  )
                  .reduce((s, p) => s + (p.amount ?? 0) - (p.paid ?? 0), 0),
              }
            : key === "clients"
              ? {
                  ...r,
                  amount: db.sales
                    .filter(
                      (s) =>
                        s.clientId === r.id &&
                        salePosition(s).due > 0 &&
                        (storeId === "all" || s.storeId === storeId),
                    )
                    .reduce((n, s) => n + salePosition(s).due, 0),
                }
              : r,
        );
      content = (
        <>
          <PageHeading
            title={c.title}
            description={c.description}
            action={
              c.action &&
              (key !== "clients" || can("sales.create")) &&
              button(c.action, c.actionLabel!)
            }
          />
          {!["suppliers", "clients"].includes(key) && <DateRangePicker />}
          <DataTable
            name={key}
            rows={rows}
            columns={[
              {
                key: "label",
                label: key === "audit" ? "Événement" : "Nom / référence",
              },
              ...(["suppliers", "clients"].includes(key)
                ? [
                    { key: "phone", label: "Téléphone" },
                    { key: "email", label: "Email" },
                  ]
                : [{ key: "date", label: "Date" }]),
              ...(key === "audit"
                ? [
                    { key: "actor", label: "Auteur" },
                    { key: "reason", label: "Motif" },
                    { key: "status", label: "Action" },
                  ]
                : [
                    {
                      key: "amount",
                      label: ["suppliers", "clients"].includes(key)
                        ? "Solde dû"
                        : "Montant",
                      render: (r: RecordRow) => <Money value={r.amount ?? 0} />,
                    },
                    {
                      key: "status",
                      label: "Statut",
                      render: (r: RecordRow) => <Badge value={r.status} />,
                    },
                  ]),
            ]}
            onRow={setSelected}
          />
        </>
      );
    } else content = <Alert error>Cette page n’existe pas.</Alert>;
  }
  return (
    <>
      {path.startsWith("/stock") && (
        <div className="action-toolbar">
          <Link
            className="button secondary"
            href={href("/stock/replenishment")}
          >
            Préparer le réapprovisionnement
          </Link>
        </div>
      )}
      {content}
      {action && (
        <ActionForm {...action} onClose={() => setAction(null)} />
      )}{" "}
      {importing && <ImportStock onClose={() => setImporting(false)} />}{" "}
      {returnSale && (
        <ReturnForm
          sale={db.sales.find((s) => s.id === returnSale.id) ?? returnSale}
          onClose={() => setReturnSale(null)}
        />
      )}
      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}{" "}
      {selected && (
        <Modal title={selected.label} onClose={() => setSelected(null)}>
          <div className="modal-body">
            <dl className="review-list">
              {Object.entries(selected)
                .filter(
                  ([k]) =>
                    !["id", "storeId"].includes(k) &&
                    (!["cost", "margin"].includes(k) || can("stock.cost.read")),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      {{
                        label: "Libellé",
                        date: "Date",
                        status: "Statut",
                        amount: "Montant",
                        paid: "Payé",
                        quantity: "Quantité",
                        reason: "Motif",
                        phone: "Téléphone",
                        email: "Email",
                        actor: "Auteur",
                        sourceId: "Transaction source",
                        supplierId: "Fournisseur",
                        productId: "Produit",
                        clientId: "Client",
                        complement: "Complément",
                        difference: "Écart",
                        opening: "Ouverture",
                        counted: "Compté",
                        theoretical: "Théorique",
                      }[k] ?? k}
                    </dt>
                    <dd>
                      {[
                        "amount",
                        "paid",
                        "complement",
                        "difference",
                        "opening",
                        "counted",
                        "theoretical",
                      ].includes(k) ? (
                        <Money value={Number(v ?? 0)} />
                      ) : Array.isArray(v) ? (
                        v.join(", ")
                      ) : (
                        String(v ?? "—")
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            {path.startsWith("/suppliers") && (
              <DataTable
                name="achats-fournisseur"
                rows={db.purchases.filter(
                  (p) =>
                    p.supplierId === selected.id &&
                    (storeId === "all" || p.storeId === storeId),
                )}
                columns={[
                  { key: "label", label: "Achat" },
                  {
                    key: "amount",
                    label: "Total",
                    render: (r) => <Money value={r.amount ?? 0} />,
                  },
                  {
                    key: "paid",
                    label: "Payé",
                    render: (r) => <Money value={r.paid ?? 0} />,
                  },
                ]}
                onRow={setSelected}
              />
            )}{" "}
            {path.startsWith("/clients") && (
              <DataTable
                name="achats-client"
                rows={db.sales.filter(
                  (s) =>
                    s.clientId === selected.id &&
                    (storeId === "all" || s.storeId === storeId),
                )}
                columns={[
                  { key: "reference", label: "Vente" },
                  {
                    key: "total",
                    label: "Montant",
                    render: (s) => <Money value={s.total} />,
                  },
                ]}
                onRow={(s) => {
                  setSelected(null);
                  router.push(href("/sales/" + s.id));
                }}
              />
            )}
          </div>
          <div className="modal-foot">
            {path.startsWith("/expenses") &&
              can("finance.read") &&
              selected.status !== "Annulé" && (
                <button
                  className="button secondary"
                  onClick={() => {
                    launch("expense.reverse", "Annuler la dépense", {
                      id: selected.id,
                    });
                    setSelected(null);
                  }}
                >
                  Annuler par extourne
                </button>
              )}
            {path.startsWith("/purchases") &&
              (selected.amount ?? 0) > (selected.paid ?? 0) &&
              can("finance.read") && (
                <button
                  className="button primary"
                  onClick={() => {
                    launch("payment.create", "Régler le fournisseur", {
                      sourceId: selected.id,
                      amount: (selected.amount ?? 0) - (selected.paid ?? 0),
                    });
                    setSelected(null);
                  }}
                >
                  Régler le solde
                </button>
              )}
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
