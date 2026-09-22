import {
  belowCostLines,
  cashSettlement,
  normalized,
  normalizedPhone,
  quoteReturn,
  returnedQuantity,
  salePosition,
  type ReturnSelection,
} from "./operations";
import { amount, paymentAccount, saleLines, validateEntry } from "./accounting";
import {
  rolePermissions,
  paymentMethods,
  type Command,
  type Database,
  type Snapshot,
  type AccountingEntry,
  type Product,
  type RecordRow,
  type SaleLine,
  type Sale,
} from "./types";
const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const id = () => crypto.randomUUID();
export function createDemo(): Snapshot {
  const organization = {
    id: "demo",
    name: "Maison Mobile",
    country: "Bénin",
    currency: "XOF",
    timezone: "Africa/Porto-Novo",
    fiscalEnabled: false,
    splitPayments: true,
  };
  const data: Database = {
    products: [],
    sales: [],
    payments: [],
    entries: [],
    accounts: [],
    periods: [],
    purchases: [],
    suppliers: [],
    expenses: [],
    trades: [],
    buybacks: [],
    transfers: [],
    stockEntries: [],
    team: [],
    clients: [],
    cash: [],
    audit: [],
  };
  data.accounts = [
    ["31", "Stock de marchandises", "asset"],
    ["411", "Clients", "asset"],
    ["401", "Fournisseurs", "liability"],
    ["521", "Banque", "asset"],
    ["571", "Caisse", "asset"],
    ["552", "Mobile Money", "asset"],
    ["581", "Virements internes", "asset"],
    ["101", "Capital", "equity"],
    ["701", "Ventes de marchandises", "income"],
    ["603", "Coût des marchandises vendues", "expense"],
    ["622", "Locations et charges", "expense"],
    ["628", "Autres charges", "expense"],
  ].map(([number, name, type]) => ({
    id: number,
    number,
    name,
    type: type as Database["accounts"][number]["type"],
    active: true,
    normal: type === "asset" || type === "expense" ? "debit" : "credit",
  }));
  data.periods = [
    {
      id: "year",
      name: `Exercice ${new Date().getFullYear()}`,
      start: `${new Date().getFullYear()}-01-01`,
      end: `${new Date().getFullYear()}-12-31`,
      status: "open",
    },
  ];
  const models = [
    ["Apple", "iPhone 15", "128 Go · Noir", 425000, 340000, 18],
    ["Samsung", "Galaxy S24", "256 Go · Gris", 395000, 300000, 12],
    ["Apple", "iPhone 13", "128 Go · Bleu", 265000, 195000, 3],
    ["Tecno", "Camon 30", "256 Go · Noir", 125000, 90000, 24],
    ["Samsung", "Galaxy A55", "128 Go · Lilas", 215000, 155000, 7],
    ["Infinix", "Note 40", "256 Go · Vert", 115000, 82000, 2],
    ["Apple", "AirPods Pro", "2e génération", 95000, 60000, 14],
    ["Xiaomi", "Redmi Note 13", "128 Go · Noir", 110000, 78000, 16],
  ];
  data.products = models.map(
    ([brand, model, variant, price, cost, quantity], i) => ({
      id: `p${i}`,
      brand: String(brand),
      model: String(model),
      variant: String(variant),
      condition: "Neuf",
      price: Number(price),
      cost: Number(cost),
      quantity: Number(quantity),
      threshold: 5,
      storeId: "s1",
      active: true,
      createdAt: day(-45 - i),
    }),
  );
  data.products.push({
    ...data.products[1],
    id: "p8",
    storeId: "s2",
    quantity: 9,
  });
  data.clients = [
    {
      id: "c1",
      label: "Amina Dossou",
      phone: "+229 01 97 00 00 01",
      email: "amina@example.test",
      date: day(-30),
      status: "Actif",
    },
    {
      id: "c2",
      label: "Koffi Mensah",
      phone: "+229 01 96 00 00 02",
      date: day(-10),
      status: "Actif",
    },
  ];
  data.suppliers = [
    {
      id: "sup1",
      label: "Tech Distribution",
      phone: "+229 01 21 00 00 00",
      email: "contact@example.test",
      date: day(-45),
      status: "Actif",
      amount: 0,
    },
  ];
  data.team = [
    {
      id: "u1",
      label: "Alex Morgan",
      role: "owner",
      stores: ["s1", "s2"],
      date: day(),
      status: "Actif",
      email: "alex@example.test",
    },
    {
      id: "u2",
      label: "Grâce Agossou",
      role: "cashier",
      stores: ["s1"],
      date: day(),
      status: "Actif",
      email: "grace@example.test",
    },
    {
      id: "u3",
      label: "Samuel Hounkpatin",
      role: "stock",
      stores: ["s1"],
      date: day(),
      status: "Invitation en attente",
      email: "samuel@example.test",
    },
  ];
  for (let i = 0; i < 24; i++) {
    const product = data.products[i % 8];
    const total = product.price;
    const date = day(-Math.floor(i / 3));
    const sale = {
      id: `sale${i}`,
      reference: `V-${new Date().getFullYear()}-${String(124 + i).padStart(4, "0")}`,
      storeId: "s1",
      date,
      clientId: i % 4 === 0 ? "c1" : undefined,
      seller: "Grâce Agossou",
      lines: [
        {
          productId: product.id,
          label: `${product.brand} ${product.model}`,
          brand: product.brand,
          quantity: 1,
          price: total,
          cost: product.cost,
        },
      ],
      discount: 0,
      total,
      paid: total,
      status: "paid",
    };
    data.sales.push(sale);
    data.payments.push({
      id: `pay${i}`,
      sourceId: sale.id,
      storeId: "s1",
      date,
      direction: "in",
      method: i % 3 === 0 ? "Mobile Money" : "Espèces",
      amount: total,
      label: sale.reference,
    });
    data.entries.push({
      id: `e${i}`,
      reference: `VE-${124 + i}`,
      date,
      journal: "Ventes",
      label: sale.reference,
      storeId: "s1",
      sourceId: sale.id,
      sourceType: "sales",
      status: "posted",
      lines: saleLines(
        total,
        product.cost ?? 0,
        total,
        i % 3 === 0 ? "Mobile Money" : "Espèces",
      ),
    });
  }
  const costSold = data.sales.reduce(
    (s, v) => s + v.lines.reduce((a, l) => a + (l.cost ?? 0) * l.quantity, 0),
    0,
  );
  const inventory =
    data.products
      .filter((p) => p.storeId === "s1")
      .reduce((s, p) => s + (p.cost ?? 0) * p.quantity, 0) + costSold;
  data.entries.unshift({
    id: "opening",
    reference: "OD-001",
    date: data.periods[0].start,
    journal: "Opérations diverses",
    label: "Soldes d’ouverture de démonstration",
    storeId: "s1",
    status: "posted",
    lines: [
      { account: "31", label: "Stock initial", debit: inventory, credit: 0 },
      { account: "571", label: "Caisse initiale", debit: 2000000, credit: 0 },
      {
        account: "101",
        label: "Capital",
        debit: 0,
        credit: inventory + 2000000,
      },
    ],
  });
  data.entries.unshift({
    id: "opening2",
    reference: "OD-002",
    date: data.periods[0].start,
    journal: "Opérations diverses",
    label: "Stock initial Porto-Novo",
    storeId: "s2",
    status: "posted",
    lines: [
      { account: "31", label: "Stock initial", debit: 2700000, credit: 0 },
      { account: "101", label: "Capital", debit: 0, credit: 2700000 },
    ],
  });
  data.cash = [
    {
      id: "cash1",
      storeId: "s1",
      date: day(),
      label: "Caisse principale",
      status: "open",
      amount: 150000,
      openedAt: new Date().toISOString(),
      opening: 150000,
    },
  ];
  data.audit = [
    {
      id: "a1",
      storeId: "s1",
      date: day(),
      label: "Session de caisse ouverte",
      status: "cash.open",
      actor: "Grâce Agossou",
      reason: "Ouverture de journée",
      sourceId: "cash1",
    },
  ];
  return {
    session: {
      user: { id: "u1", name: "Alex Morgan", role: "owner" },
      organization,
      organizations: [organization],
      stores: [
        {
          id: "s1",
          name: "Cotonou · Principal",
          city: "Cotonou",
          active: true,
        },
        { id: "s2", name: "Porto-Novo", city: "Porto-Novo", active: true },
      ],
      permissions: rolePermissions.owner,
      defaultStoreId: "s1",
    },
    data,
  };
}
export function executeDemo(
  snapshot: Snapshot,
  command: Command,
): { snapshot: Snapshot; reference: string } {
  const next = structuredClone(snapshot);
  const db = next.data;
  const p = command.payload;
  const storeId = command.storeId;
  const date = String(p.date || day());
  const reference = `OP-${String(db.audit.length + 1).padStart(5, "0")}`;
  if (!next.session.stores.some((s) => s.id === storeId && s.active))
    throw new Error("Sélectionnez une boutique active.");
  const required: Record<string, string> = {
    "sale.create": "sales.create",
    "sale.refund": "sales.refund",
    "sale.return": "sales.refund",
    "stock.entry": "stock.adjust",
    "stock.adjust": "stock.adjust",
    "stock.transfer": "stock.transfer",
    "product.save": "stock.adjust",
    "product.archive": "stock.adjust",
    "stock.import": "stock.adjust",
    "trade.create": "trade.create",
    "buyback.create": "buyback.create",
    "purchase.create": "purchases.manage",
    "supplier.save": "purchases.manage",
    "expense.create": "finance.read",
    "expense.reverse": "finance.read",
    "payment.create": "finance.read",
    "entry.save": "accounting.read",
    "entry.post": "accounting.post",
    "entry.reverse": "accounting.post",
    "period.lock": "accounting.close_period",
    "account.save": "accounting.post",
    "account.toggle": "accounting.post",
    "team.invite": "team.manage",
    "team.update": "team.manage",
    "store.save": "settings.manage",
    "settings.save": "settings.manage",
    "cash.open": "cash.open_close",
    "cash.close": "cash.open_close",
    "cash.movement": "cash.manual_movement",
    "client.save": "sales.create",
  };
  if (
    !required[command.type] ||
    !next.session.permissions.includes(required[command.type] as never)
  )
    throw new Error("Permission insuffisante.");
  const num = (key: string) => amount(p[key] ?? 0);
  const str = (key: string) => String(p[key] ?? "").trim();
  const product = () => {
    const v = db.products.find(
      (v) => v.id === p.productId && v.storeId === storeId && v.active,
    );
    if (!v) throw new Error("Produit indisponible dans cette boutique.");
    return v;
  };
  const quantity = () => {
    const n = num("quantity");
    if (n < 1) throw new Error("Quantité minimale : 1.");
    return n;
  };
  const pay = (
    sourceId: string,
    value: number,
    direction: "in" | "out",
    label: string,
    method?: string,
  ) => {
    if (value > 0)
      db.payments.unshift({
        id: id(),
        sourceId,
        storeId,
        date: date === day() ? new Date().toISOString() : date + "T12:00:00Z",
        direction,
        method: method || str("method") || "Espèces",
        amount: value,
        label,
      });
  };
  const post = (
    sourceId: string,
    label: string,
    lines: AccountingEntry["lines"],
    journal = "Opérations diverses",
    sourceType?: string,
  ) => {
    const entry: AccountingEntry = {
      id: id(),
      reference: `EC-${db.entries.length + 1}`,
      date,
      journal,
      label,
      storeId,
      sourceId,
      sourceType,
      status: "posted",
      lines: lines.filter((l) => l.debit || l.credit),
    };
    validateEntry(entry, db.accounts, db.periods);
    db.entries.unshift(entry);
  };
  const row = (
    label: string,
    extra: Record<string, unknown> = {},
  ): RecordRow => ({
    id: id(),
    date,
    storeId,
    label,
    status: "Validé",
    ...extra,
  });
  const receivedProduct = (cost: number) => {
    if (!str("model") || !str("brand"))
      throw new Error("Marque et modèle obligatoires.");
    if (str("imei") && db.products.some((v) => v.imei === str("imei")))
      throw new Error("Cet IMEI est déjà suivi.");
    const r: Product = {
      id: id(),
      brand: str("brand"),
      model: str("model"),
      variant: str("variant"),
      condition: str("condition") || "Occasion",
      price: num("price"),
      cost,
      quantity: 1,
      threshold: 1,
      storeId,
      active: true,
      imei: str("imei") || undefined,
      createdAt: date,
    };
    db.products.unshift(r);
    return r;
  };
  switch (command.type) {
    case "stock.import": {
      const rows = p.rows as Record<string, unknown>[];
      if (!Array.isArray(rows) || !rows.length || rows.length > 2000)
        throw new Error("Import vide ou trop volumineux.");
      for (const input of rows) {
        const q = amount(input.quantity, "Quantité"),
          cost = amount(input.cost, "Coût"),
          price = amount(input.price, "Prix");
        if (
          q < 1 ||
          !String(input.brand || "").trim() ||
          !String(input.model || "").trim()
        )
          throw new Error("Ligne d’import invalide.");
        let v = db.products.find(
          (v) =>
            v.storeId === storeId &&
            v.brand === input.brand &&
            v.model === input.model &&
            v.variant === String(input.variant || "") &&
            v.active,
        );
        if (!v) {
          v = {
            id: id(),
            brand: String(input.brand),
            model: String(input.model),
            variant: String(input.variant || ""),
            condition: "Neuf",
            price,
            cost: 0,
            quantity: 0,
            threshold: 5,
            storeId,
            active: true,
            createdAt: date,
          };
          db.products.push(v);
        }
        v.cost = Math.round(
          ((v.cost ?? 0) * v.quantity + cost * q) / (v.quantity + q),
        );
        v.quantity += q;
        const r = row(v.model, {
          quantity: q,
          amount: q * cost,
          productId: v.id,
        });
        db.stockEntries.unshift(r);
        if (cost * q)
          post(r.id, "Import de stock", [
            { account: "31", label: v.model, debit: cost * q, credit: 0 },
            {
              account: "101",
              label: "Apport de démonstration",
              debit: 0,
              credit: cost * q,
            },
          ]);
      }
      break;
    }
    case "product.save": {
      if (
        db.products.some(
          (v) =>
            v.storeId === storeId &&
            v.id !== p.id &&
            v.active &&
            normalized(v.brand) === normalized(p.brand) &&
            normalized(v.model) === normalized(p.model) &&
            normalized(v.variant) === normalized(p.variant) &&
            normalized(v.condition) === normalized(p.condition || "Neuf"),
        )
      )
        throw new Error(
          "Ce produit existe déjà dans cette boutique. Ouvrez sa fiche pour ajouter du stock.",
        );
      if (!str("model") || !str("brand"))
        throw new Error("Marque et modèle obligatoires.");
      const existing = db.products.find(
        (v) => v.id === p.id && v.storeId === storeId,
      );
      const fields = {
        brand: str("brand"),
        model: str("model"),
        variant: str("variant"),
        condition: str("condition") || "Neuf",
        price: num("price"),
        threshold: num("threshold"),
        supplierId: str("supplierId") || undefined,
        reorderTarget: num("reorderTarget") || undefined,
      };
      if (existing) Object.assign(existing, fields);
      else
        db.products.unshift({
          id: id(),
          ...fields,
          cost: 0,
          quantity: 0,
          storeId,
          active: true,
          createdAt: date,
        });
      break;
    }
    case "product.archive": {
      const v = product();
      v.active = false;
      break;
    }
    case "stock.entry": {
      const v = product(),
        q = quantity(),
        cost = num("cost");
      v.cost = Math.round(
        ((v.cost ?? 0) * v.quantity + cost * q) / (v.quantity + q),
      );
      v.quantity += q;
      if (str("imei")) {
        if (q !== 1 || db.products.some((v) => v.imei === str("imei")))
          throw new Error("Un IMEI identifie une seule unité distincte.");
        v.imei = str("imei");
      }
      const r = row(`${v.brand} ${v.model}`, {
        quantity: q,
        amount: q * cost,
        productId: v.id,
        reason: str("reason"),
      });
      db.stockEntries.unshift(r);
      if (q * cost)
        post(r.id, "Entrée manuelle de stock", [
          { account: "31", label: r.label, debit: q * cost, credit: 0 },
          {
            account: "101",
            label: "Apport de stock de démonstration",
            debit: 0,
            credit: q * cost,
          },
        ]);
      break;
    }
    case "stock.adjust": {
      const v = product();
      if (!str("reason")) throw new Error("Motif obligatoire.");
      const before = v.quantity;
      v.quantity = num("quantity");
      const diff = v.quantity - before;
      const value = Math.abs(diff) * (v.cost ?? 0);
      db.stockEntries.unshift(
        row(v.model, {
          quantity: diff,
          before,
          after: v.quantity,
          reason: str("reason"),
        }),
      );
      if (value)
        post(v.id, "Ajustement de stock", [
          {
            account: "31",
            label: "Stock",
            debit: diff > 0 ? value : 0,
            credit: diff < 0 ? value : 0,
          },
          {
            account: "628",
            label: str("reason"),
            debit: diff < 0 ? value : 0,
            credit: diff > 0 ? value : 0,
          },
        ]);
      break;
    }
    case "stock.transfer": {
      const v = product(),
        q = quantity(),
        dest = str("destination");
      if (
        dest === storeId ||
        !next.session.stores.some((s) => s.id === dest && s.active)
      )
        throw new Error("Choisissez une autre boutique autorisée.");
      if (q > v.quantity) throw new Error("Stock insuffisant.");
      v.quantity -= q;
      let target = db.products.find(
        (x) =>
          x.storeId === dest &&
          x.brand === v.brand &&
          x.model === v.model &&
          x.variant === v.variant &&
          x.active,
      );
      if (!target) {
        target = { ...v, id: id(), storeId: dest, quantity: 0 };
        db.products.push(target);
      }
      target.cost = Math.round(
        ((target.cost ?? 0) * target.quantity + (v.cost ?? 0) * q) /
          (target.quantity + q),
      );
      target.quantity += q;
      const transfer = row(v.model, {
        quantity: q,
        destination: dest,
        productId: v.id,
      });
      db.transfers.unshift(transfer);
      const value = (v.cost ?? 0) * q;
      if (value) {
        post(transfer.id, "Transfert sortant", [
          {
            account: "581",
            label: "Virement interne",
            debit: value,
            credit: 0,
          },
          { account: "31", label: "Stock transféré", debit: 0, credit: value },
        ]);
        post(transfer.id, "Transfert entrant", [
          { account: "31", label: "Stock reçu", debit: value, credit: 0 },
          {
            account: "581",
            label: "Virement interne",
            debit: 0,
            credit: value,
          },
        ]);
        db.entries[0].storeId = dest;
      }
      break;
    }
    case "sale.create": {
      const input = p.lines as SaleLine[];
      if (!input?.length) throw new Error("Ajoutez un article au panier.");
      const used = new Set<string>();
      const lines = input.map((l) => {
        if (used.has(l.productId))
          throw new Error("Regroupez les quantités du même produit.");
        used.add(l.productId);
        const v = db.products.find(
          (v) => v.id === l.productId && v.storeId === storeId && v.active,
        );
        if (!v || amount(l.quantity) < 1 || v.quantity < l.quantity)
          throw new Error("Stock insuffisant. Actualisez le panier.");
        amount(l.price);
        if (
          l.price !== v.price &&
          !next.session.permissions.includes("sales.change_price")
        )
          throw new Error("Modification du prix non autorisée.");
        if (l.imei && l.quantity !== 1)
          throw new Error("Un IMEI correspond à une seule unité.");
        if (
          l.imei &&
          (!/^\d{15}$/.test(l.imei) ||
            db.sales.some((sale) =>
              sale.lines.some(
                (old, index) =>
                  old.imei === l.imei &&
                  !sale.returns?.some((r) =>
                    r.lines.some((rl) => rl.lineIndex === index && rl.restock),
                  ),
              ),
            ))
        )
          throw new Error(
            "IMEI invalide ou déjà vendu. Vérifiez les 15 chiffres et son historique.",
          );
        v.quantity -= l.quantity;
        return {
          ...l,
          cost: v.cost,
          brand: v.brand,
          label: `${v.brand} ${v.model}`,
        };
      });
      const serials = lines.map((l) => l.imei).filter(Boolean);
      if (new Set(serials).size !== serials.length)
        throw new Error("Un IMEI ne peut apparaître deux fois dans une vente.");
      const gross = lines.reduce((s, l) => s + l.quantity * l.price, 0),
        discount = num("discount");
      if (
        discount > gross ||
        (discount > gross * 0.05 &&
          !next.session.permissions.includes("sales.discount_above_limit"))
      )
        throw new Error("Remise supérieure au plafond autorisé.");
      const total = gross - discount,
        paid = num("paid");
      if (total <= 0 || paid > total)
        throw new Error("Vérifiez les montants total et payé.");
      if (paid < total && !str("clientId"))
        throw new Error("Un client est obligatoire pour une vente à crédit.");
      const loss = belowCostLines(lines, discount);
      if (
        loss.length &&
        (!next.session.permissions.includes("sales.sell_below_cost") ||
          !str("priceOverrideReason"))
      )
        throw new Error(
          "Vente à perte : une permission responsable et un motif sont obligatoires.",
        );
      if (str("dueDate") && !/^\d{4}-\d{2}-\d{2}$/.test(str("dueDate")))
        throw new Error("Échéance invalide.");
      const sale: Sale = {
        id: id(),
        reference,
        storeId,
        date: new Date().toISOString(),
        seller: next.session.user.name,
        clientId: str("clientId") || undefined,
        lines,
        total,
        discount,
        paid,
        status: paid < total ? "credit" : "paid",
        dueDate: str("dueDate"),
        priceOverrideReason: loss.length
          ? str("priceOverrideReason")
          : undefined,
      };
      db.sales.unshift(sale);
      const parts = Array.isArray(p.payments)
        ? (p.payments as { method: string; amount: number }[])
        : [{ method: str("method") || "Espèces", amount: paid }];
      if (parts.length > 1 && !next.session.organization.splitPayments)
        throw new Error("Paiement fractionné désactivé.");
      if (
        parts.some(
          (part) =>
            !["Espèces", "Mobile Money", "Carte", "Virement", "Autre"].includes(
              part.method,
            ),
        ) ||
        parts.reduce((sum, part) => sum + amount(part.amount), 0) !== paid
      )
        throw new Error(
          "La répartition des paiements doit correspondre au montant payé.",
        );
      const settlement = cashSettlement(
        parts,
        p.cashTendered === undefined ? undefined : num("cashTendered"),
      );
      sale.cashTendered = settlement.cashTendered;
      sale.cashChange = settlement.cashChange;
      for (const part of parts)
        pay(sale.id, part.amount, "in", reference, part.method);
      const entryLines = saleLines(
        total,
        lines.reduce((s, l) => s + (l.cost ?? 0) * l.quantity, 0),
        paid,
        str("method"),
      ).filter((l) => l.label !== "Encaissement");
      entryLines.push(
        ...parts
          .filter((part) => part.amount > 0)
          .map((part) => ({
            account: paymentAccount(part.method),
            label: `Encaissement ${part.method}`,
            debit: part.amount,
            credit: 0,
          })),
      );
      post(sale.id, reference, entryLines, "Ventes", "sales");
      break;
    }
    case "sale.refund":
    case "sale.return": {
      const sale = db.sales.find((v) => v.id === p.id && v.storeId === storeId);
      if (!sale) throw new Error("Vente introuvable.");
      if (!str("reason")) throw new Error("Motif obligatoire.");
      const selections: ReturnSelection[] =
        command.type === "sale.refund"
          ? sale.lines
              .map((line, lineIndex) => ({
                lineIndex,
                quantity: line.quantity - returnedQuantity(sale, lineIndex),
                restock: true,
              }))
              .filter((l) => l.quantity > 0)
          : (p.lines as ReturnSelection[]);
      if (!Array.isArray(selections))
        throw new Error("Articles du retour requis.");
      if (
        str("method") &&
        !paymentMethods.includes(
          str("method") as (typeof paymentMethods)[number],
        )
      )
        throw new Error("Mode de remboursement invalide.");
      const quote = quoteReturn(sale, selections);
      const refund = {
        ...quote,
        id: id(),
        date: new Date().toISOString(),
        reason: str("reason"),
        method: str("method") || "Espèces",
      };
      const restored = quote.lines
        .filter((l) => l.restock)
        .reduce((sum, l) => sum + l.cost, 0);
      for (const line of quote.lines.filter((l) => l.restock)) {
        const original = sale.lines[line.lineIndex];
        const item = db.products.find(
          (p) => p.id === original.productId && p.storeId === storeId,
        );
        if (!item) throw new Error("Produit de retour introuvable.");
        item.cost = Math.round(
          ((item.cost ?? 0) * item.quantity + line.cost) /
            (item.quantity + line.quantity),
        );
        item.quantity += line.quantity;
        db.stockEntries.unshift(
          row(original.label, {
            productId: item.id,
            quantity: line.quantity,
            sourceId: sale.id,
            reason: "Retour client revendable",
          }),
        );
      }
      sale.returns ??= [];
      sale.returns.push(refund);
      sale.status =
        salePosition(sale).units === 0 ? "refunded" : "partially_refunded";
      pay(
        sale.id,
        quote.cashRefund,
        "out",
        `Retour ${sale.reference}`,
        refund.method,
      );
      const lines = [
        {
          account: "701",
          label: "Retour marchandises",
          debit: quote.amount,
          credit: 0,
        },
        {
          account: paymentAccount(refund.method),
          label: "Remboursement client",
          debit: 0,
          credit: quote.cashRefund,
        },
        {
          account: "411",
          label: "Réduction de créance",
          debit: 0,
          credit: quote.creditReduction,
        },
        {
          account: "31",
          label: "Stock revendable réintégré",
          debit: restored,
          credit: 0,
        },
        {
          account: "603",
          label: "Coût des articles réintégrés",
          debit: 0,
          credit: restored,
        },
      ];
      if (quote.amount || restored)
        post(sale.id, `Retour ${sale.reference}`, lines, "Ventes", "sales");
      break;
    }
    case "buyback.create":
    case "trade.create": {
      const value = num("value");
      if (value <= 0)
        throw new Error("La valeur de reprise doit être positive.");
      let outgoing: Product | undefined;
      let complement = 0;
      if (command.type === "trade.create") {
        outgoing = product();
        if (outgoing.quantity < 1) throw new Error("Stock insuffisant.");
        complement = outgoing.price - value;
        if (complement < 0)
          throw new Error(
            "La reprise dépasse le prix du produit. Révisez les valeurs.",
          );
        outgoing.quantity--;
      }
      const item = receivedProduct(value);
      const r = row(`${item.brand} ${item.model}`, {
        amount: value,
        productId: item.id,
        clientId: str("clientId"),
        complement,
        outgoingId: outgoing?.id,
      });
      if (outgoing) {
        db.trades.unshift(r);
        db.sales.unshift({
          id: r.id,
          reference,
          storeId,
          date: new Date().toISOString(),
          seller: next.session.user.name,
          clientId: str("clientId") || undefined,
          lines: [
            {
              productId: outgoing.id,
              label: `${outgoing.brand} ${outgoing.model}`,
              brand: outgoing.brand,
              quantity: 1,
              price: outgoing.price,
              cost: outgoing.cost,
            },
          ],
          total: outgoing.price,
          paid: outgoing.price,
          discount: 0,
          status: "paid",
          tradeValue: value,
        });
        pay(r.id, complement, "in", "Complément de troc");
        post(
          r.id,
          "Troc / reprise",
          [
            {
              account: "31",
              label: "Appareil repris",
              debit: value,
              credit: 0,
            },
            ...saleLines(
              outgoing.price,
              outgoing.cost ?? 0,
              complement,
              str("method"),
            ).filter((l) => l.account !== "411"),
          ],
          "Ventes",
          "trades",
        );
      } else {
        db.buybacks.unshift(r);
        pay(r.id, value, "out", "Rachat client");
        post(
          r.id,
          "Rachat client",
          [
            {
              account: "31",
              label: "Appareil racheté",
              debit: value,
              credit: 0,
            },
            {
              account: paymentAccount(str("method") || "Espèces"),
              label: "Paiement",
              debit: 0,
              credit: value,
            },
          ],
          "Achats",
          "buybacks",
        );
      }
      break;
    }
    case "purchase.create": {
      if (
        str("reference") &&
        db.purchases.some(
          (v) =>
            v.supplierId === p.supplierId &&
            normalized(v.label) === normalized(p.reference),
        )
      )
        throw new Error(
          "Cette facture est déjà enregistrée pour ce fournisseur.",
        );
      const input = Array.isArray(p.lines)
        ? (p.lines as { productId: string; quantity: number; cost: number }[])
        : [
            {
              productId: str("productId"),
              quantity: quantity(),
              cost: num("cost"),
            },
          ];
      if (!input.length || !db.suppliers.some((s) => s.id === p.supplierId))
        throw new Error("Fournisseur et articles requis.");
      const lines = input.map((line) => {
        const product = db.products.find(
          (v) => v.id === line.productId && v.storeId === storeId && v.active,
        );
        const q = amount(line.quantity, "Quantité"),
          cost = amount(line.cost, "Coût");
        if (!product || q < 1) throw new Error("Produit ou quantité invalide.");
        return { product, q, cost };
      });
      const total = lines.reduce((s, l) => s + l.q * l.cost, 0),
        paid = num("paid");
      if (!total || paid > total)
        throw new Error("Vérifiez le coût et le montant payé.");
      const r = row(str("reference") || reference, {
        amount: total,
        paid,
        supplierId: str("supplierId"),
        lines: input,
        dueDate: str("dueDate"),
        attachmentName: str("attachmentName"),
      });
      db.purchases.unshift(r);
      for (const { product: v, q, cost } of lines) {
        v.cost = Math.round(
          ((v.cost ?? 0) * v.quantity + q * cost) / (v.quantity + q),
        );
        v.quantity += q;
        db.stockEntries.unshift(
          row(v.model, {
            quantity: q,
            amount: q * cost,
            sourceId: r.id,
            productId: v.id,
          }),
        );
      }
      pay(r.id, paid, "out", "Paiement fournisseur");
      post(
        r.id,
        r.label,
        [
          {
            account: "31",
            label: "Achat de marchandises",
            debit: total,
            credit: 0,
          },
          {
            account: paymentAccount(str("method") || "Espèces"),
            label: "Paiement",
            debit: 0,
            credit: paid,
          },
          {
            account: "401",
            label: "Dette fournisseur",
            debit: 0,
            credit: total - paid,
          },
        ],
        "Achats",
        "purchases",
      );
      break;
    }
    case "expense.create": {
      const value = num("amount");
      if (!value || !str("label"))
        throw new Error("Libellé et montant positif obligatoires.");
      const r = row(str("label"), { amount: value, category: str("category") });
      db.expenses.unshift(r);
      pay(r.id, value, "out", r.label);
      post(
        r.id,
        r.label,
        [
          {
            account: str("account") || "628",
            label: r.label,
            debit: value,
            credit: 0,
          },
          {
            account: paymentAccount(str("method") || "Espèces"),
            label: "Paiement",
            debit: 0,
            credit: value,
          },
        ],
        "Caisse",
        "expenses",
      );
      break;
    }
    case "expense.reverse": {
      const r = db.expenses.find((v) => v.id === p.id && v.storeId === storeId);
      if (!r || r.status === "Annulé" || !str("reason"))
        throw new Error("Dépense introuvable, déjà annulée ou motif absent.");
      r.status = "Annulé";
      for (const original of [...db.payments].filter(
        (payment) => payment.sourceId === r.id && payment.direction === "out",
      ))
        pay(
          r.id,
          original.amount,
          "in",
          `Annulation ${r.label}`,
          original.method,
        );
      for (const e of [...db.entries].filter((e) => e.sourceId === r.id))
        post(
          r.id,
          `Extourne ${e.reference}`,
          e.lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit })),
          "Caisse",
          "expenses",
        );
      break;
    }
    case "payment.create": {
      const value = num("amount");
      const sale = db.sales.find(
        (v) =>
          v.id === p.sourceId &&
          v.storeId === storeId &&
          salePosition(v).due > 0,
      );
      const purchase = db.purchases.find(
        (v) => v.id === p.sourceId && v.storeId === storeId,
      );
      if (!sale && !purchase)
        throw new Error("Choisissez une créance ou une dette.");
      const due = sale
        ? salePosition(sale).due
        : (purchase!.amount ?? 0) - (purchase!.paid ?? 0);
      if (!value || value > due)
        throw new Error("Montant supérieur au solde ou nul.");
      if (sale) {
        sale.paid += value;
        sale.status = sale.returns?.length
          ? "partially_refunded"
          : salePosition(sale).due === 0
            ? "paid"
            : "credit";
        pay(sale.id, value, "in", sale.reference);
        post(
          sale.id,
          "Règlement client",
          [
            {
              account: paymentAccount(str("method") || "Espèces"),
              label: "Encaissement",
              debit: value,
              credit: 0,
            },
            { account: "411", label: "Créance", debit: 0, credit: value },
          ],
          "Caisse",
          "sales",
        );
      } else {
        purchase!.paid = (purchase!.paid ?? 0) + value;
        pay(purchase!.id, value, "out", purchase!.label);
        post(
          purchase!.id,
          "Règlement fournisseur",
          [
            {
              account: "401",
              label: "Dette fournisseur",
              debit: value,
              credit: 0,
            },
            {
              account: paymentAccount(str("method") || "Espèces"),
              label: "Paiement",
              debit: 0,
              credit: value,
            },
          ],
          "Caisse",
          "purchases",
        );
      }
      break;
    }
    case "supplier.save":
    case "client.save": {
      const contacts =
        db[command.type === "client.save" ? "clients" : "suppliers"];
      const email = normalized(p.email),
        phone = normalizedPhone(p.phone);
      if (
        contacts.some(
          (c) =>
            (email && normalized(c.email) === email) ||
            (phone && normalizedPhone(c.phone) === phone),
        )
      )
        throw new Error(
          "Un contact utilise déjà cet email ou ce téléphone. Consultez sa fiche.",
        );
      if (!str("label")) throw new Error("Nom obligatoire.");
      db[command.type === "supplier.save" ? "suppliers" : "clients"].unshift(
        row(str("label"), {
          phone: str("phone"),
          email: str("email"),
          status: "Actif",
        }),
      );
      break;
    }
    case "entry.save": {
      const existing = p.id
        ? db.entries.find((e) => e.id === p.id && e.storeId === storeId)
        : undefined;
      if (p.id && (!existing || existing.status !== "draft"))
        throw new Error("Seul un brouillon peut être modifié.");
      const e: AccountingEntry = {
        id: existing?.id ?? id(),
        reference: existing?.reference ?? `OD-${db.entries.length + 1}`,
        date,
        journal: str("journal"),
        label: str("label"),
        storeId,
        status: "draft",
        lines: p.lines as AccountingEntry["lines"],
      };
      if (!e.label) throw new Error("Libellé obligatoire.");
      validateEntry(e, db.accounts, db.periods);
      if (existing) Object.assign(existing, e);
      else db.entries.unshift(e);
      break;
    }
    case "entry.post": {
      const e = db.entries.find((e) => e.id === p.id && e.storeId === storeId);
      if (!e || e.status !== "draft")
        throw new Error("Seul un brouillon peut être posté.");
      validateEntry(e, db.accounts, db.periods);
      e.status = "posted";
      break;
    }
    case "entry.reverse": {
      const e = db.entries.find((e) => e.id === p.id && e.storeId === storeId);
      if (!e || e.status !== "posted" || !str("reason"))
        throw new Error("Écriture postée et motif obligatoires.");
      post(
        e.id,
        `Extourne ${e.reference} : ${str("reason")}`,
        e.lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit })),
        e.journal,
        "entries",
      );
      e.status = "reversed";
      break;
    }
    case "period.lock": {
      const e = db.periods.find((e) => e.id === p.id);
      if (!e || e.status !== "open")
        throw new Error("Période déjà verrouillée.");
      if (
        db.entries.some(
          (x) =>
            x.status === "draft" &&
            x.date.slice(0, 10) >= e.start &&
            x.date.slice(0, 10) <= e.end,
        )
      )
        throw new Error("Postez les brouillons avant verrouillage.");
      e.status = "locked";
      break;
    }
    case "account.save": {
      if (
        !/^\d{2,10}$/.test(str("number")) ||
        !str("label") ||
        db.accounts.some((a) => a.number === str("number"))
      )
        throw new Error("Numéro de compte unique et libellé obligatoires.");
      db.accounts.push({
        id: id(),
        number: str("number"),
        name: str("label"),
        type: str("accountType") as "asset",
        active: true,
        normal: str("normal") as "debit",
      });
      break;
    }
    case "account.toggle": {
      const a = db.accounts.find((a) => a.id === p.id);
      if (a) a.active = !a.active;
      break;
    }
    case "team.invite": {
      if (!str("email").includes("@") || !str("label"))
        throw new Error("Nom et email requis.");
      db.team.unshift(
        row(str("label"), {
          email: str("email"),
          role: str("role"),
          permissions: p.permissions,
          stores: p.stores || [storeId],
          status: "Invitation en attente",
        }),
      );
      break;
    }
    case "team.update": {
      const member = db.team.find((m) => m.id === p.id);
      if (!member || member.id === next.session.user.id)
        throw new Error("Vous ne pouvez pas modifier votre propre accès.");
      if (p.role) member.role = p.role;
      if (p.stores) member.stores = p.stores;
      if (p.permissions) member.permissions = p.permissions;
      member.status = str("status") || member.status;
      break;
    }
    case "store.save": {
      if (!str("label")) throw new Error("Nom obligatoire.");
      next.session.stores.push({
        id: id(),
        name: str("label"),
        city: str("city"),
        active: true,
      });
      break;
    }
    case "settings.save": {
      if (!str("name")) throw new Error("Nom de l’entreprise obligatoire.");
      Object.assign(next.session.organization, {
        name: str("name"),
        country: str("country"),
        timezone: str("timezone"),
        splitPayments: !!p.splitPayments,
      });
      if (p.fiscalEnabled !== undefined) {
        if (!next.session.permissions.includes("fiscal.manage"))
          throw new Error("Permission fiscale requise.");
        next.session.organization.fiscalEnabled = !!p.fiscalEnabled;
      }
      break;
    }
    case "cash.open": {
      if (db.cash.some((c) => c.storeId === storeId && c.status === "open"))
        throw new Error("Une caisse est déjà ouverte.");
      db.cash.unshift(
        row("Caisse principale", {
          status: "open",
          opening: num("amount"),
          amount: num("amount"),
          openedAt: new Date().toISOString(),
        }),
      );
      break;
    }
    case "cash.close": {
      const c = db.cash.find(
        (c) => c.storeId === storeId && c.status === "open",
      );
      if (!c) throw new Error("Aucune caisse ouverte.");
      const theoretical =
        Number(c.opening) +
        db.payments
          .filter(
            (v) =>
              v.storeId === storeId &&
              v.method === "Espèces" &&
              v.date >= String(c.openedAt),
          )
          .reduce(
            (s, v) => s + (v.direction === "in" ? v.amount : -v.amount),
            0,
          );
      const nonCashMethods = [
        ...new Set(
          db.payments
            .filter(
              (v) =>
                v.storeId === storeId &&
                v.date >= String(c.openedAt) &&
                v.method !== "Espèces",
            )
            .map((v) => v.method),
        ),
      ];
      if (
        nonCashMethods.some(
          (m) =>
            !Array.isArray(p.reconciledMethods) ||
            !p.reconciledMethods.includes(m),
        )
      )
        throw new Error(
          "Vérifiez les paiements électroniques avant la clôture.",
        );
      const counted = num("amount");
      if (counted !== theoretical && !str("reason"))
        throw new Error("Commentaire obligatoire en cas d’écart.");
      Object.assign(c, {
        status: "closed",
        theoretical,
        counted,
        difference: counted - theoretical,
        reconciledMethods: nonCashMethods,
        closedAt: new Date().toISOString(),
        reason: str("reason"),
      });
      break;
    }
    case "cash.movement": {
      if (!str("reason") || !num("amount"))
        throw new Error("Motif et montant positif obligatoires.");
      pay(
        id(),
        num("amount"),
        str("direction") === "out" ? "out" : "in",
        str("reason"),
      );
      post(
        reference,
        str("reason"),
        [
          {
            account: paymentAccount(str("method") || "Espèces"),
            label: "Mouvement de caisse",
            debit: str("direction") === "in" ? num("amount") : 0,
            credit: str("direction") === "out" ? num("amount") : 0,
          },
          {
            account: "101",
            label: "Contrepartie de démonstration",
            debit: str("direction") === "out" ? num("amount") : 0,
            credit: str("direction") === "in" ? num("amount") : 0,
          },
        ],
        "Caisse",
      );
      break;
    }
    default:
      throw new Error("Cette opération n’est pas disponible en démonstration.");
  }
  db.audit.unshift(
    row(reference, {
      status: command.type,
      actor: next.session.user.name,
      reason: str("reason") || str("priceOverrideReason"),
      sourceId:
        db.sales[0]?.reference === reference ? db.sales[0].id : reference,
    }),
  );
  return { snapshot: next, reference };
}
