const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createDemo, executeDemo } = require("../src/frontend/demo.ts");
const {
  balance,
  validateEntry,
  trialBalance,
  indicators,
  money,
  minor,
} = require("../src/frontend/accounting.ts");
const { rolePermissions } = require("../src/frontend/types.ts");
function run(snapshot, type, payload, storeId = "s1") {
  return executeDemo(snapshot, {
    type,
    payload,
    storeId,
    idempotencyKey: crypto.randomUUID(),
  }).snapshot;
}
function balanced(db) {
  for (const e of db.entries)
    assert.equal(balance(e.lines).balanced, true, e.reference);
}
test("arrivage de 2000 unités sans IMEI puis vente de 3 unités", () => {
  let s = createDemo();
  const initial = s.data.products[0].quantity;
  s = run(s, "stock.entry", { productId: "p0", quantity: 2000, cost: 300000 });
  assert.equal(
    s.data.products.find((p) => p.id === "p0").quantity,
    initial + 2000,
  );
  assert.equal(s.data.products.find((p) => p.id === "p0").imei, undefined);
  s = run(s, "sale.create", {
    lines: [{ productId: "p0", quantity: 3, price: 425000 }],
    paid: 1275000,
    discount: 0,
    method: "Espèces",
  });
  assert.equal(
    s.data.products.find((p) => p.id === "p0").quantity,
    initial + 1997,
  );
  balanced(s.data);
});
test("conflit de stock atomique : aucune donnée partiellement modifiée", () => {
  const s = createDemo(),
    before = JSON.stringify(s);
  assert.throws(
    () =>
      run(s, "sale.create", {
        lines: [
          { productId: "p0", quantity: 1, price: 425000 },
          { productId: "p1", quantity: 10000, price: 395000 },
        ],
        paid: 0,
        discount: 0,
      }),
    /Stock insuffisant/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("rachat : stock et sortie de cash, sans revenu ni charge instantanée", () => {
  const s = createDemo();
  const before = indicators(s.data.sales, s.data.payments, s.data.entries);
  const next = run(s, "buyback.create", {
    brand: "Apple",
    model: "iPhone 12",
    value: 100000,
    price: 150000,
    method: "Espèces",
  });
  const after = indicators(
    next.data.sales,
    next.data.payments,
    next.data.entries,
  );
  assert.equal(after.revenue, before.revenue);
  assert.equal(after.result, before.result);
  assert.equal(after.outgoing - before.outgoing, 100000);
  assert.equal(next.data.products[0].quantity, 1);
  balanced(next.data);
});
test("troc : appareil repris, appareil sorti, complément et comptabilité équilibrée", () => {
  const s = createDemo(),
    before = s.data.products[0].quantity;
  const next = run(s, "trade.create", {
    brand: "Apple",
    model: "iPhone 12",
    productId: "p0",
    value: 100000,
    price: 150000,
    method: "Espèces",
  });
  assert.equal(
    next.data.products.find((p) => p.id === "p0").quantity,
    before - 1,
  );
  assert.equal(next.data.trades[0].complement, 325000);
  assert.equal(next.data.payments[0].amount, 325000);
  balanced(next.data);
});
test("achat fournisseur à crédit puis paiement réduit la dette, une seule entrée de stock", () => {
  let s = createDemo();
  const initial = s.data.products[0].quantity;
  s = run(s, "purchase.create", {
    productId: "p0",
    quantity: 2,
    cost: 300000,
    paid: 0,
    supplierId: "sup1",
    method: "Virement",
  });
  const purchase = s.data.purchases[0];
  assert.equal(purchase.amount - purchase.paid, 600000);
  s = run(s, "payment.create", {
    sourceId: purchase.id,
    amount: 200000,
    method: "Virement",
  });
  assert.equal(s.data.purchases[0].amount - s.data.purchases[0].paid, 400000);
  assert.equal(
    s.data.products.find((p) => p.id === "p0").quantity,
    initial + 2,
  );
  balanced(s.data);
});
test("crédit : client obligatoire, paiement puis extourne restitue stock et soldes", () => {
  let s = createDemo();
  assert.throws(
    () =>
      run(s, "sale.create", {
        lines: [{ productId: "p0", quantity: 1, price: 425000 }],
        paid: 100000,
      }),
    /client est obligatoire/,
  );
  const initial = s.data.products[0].quantity;
  s = run(s, "sale.create", {
    lines: [
      { productId: "p0", quantity: 1, price: 425000, imei: "123456789012345" },
    ],
    paid: 100000,
    clientId: "c1",
  });
  const saleId = s.data.sales[0].id;
  s = run(s, "payment.create", { sourceId: saleId, amount: 50000 });
  assert.equal(s.data.sales[0].paid, 150000);
  s = run(s, "sale.refund", { id: saleId, reason: "Retour client" });
  assert.equal(s.data.products.find((p) => p.id === "p0").quantity, initial);
  assert.equal(s.data.sales[0].status, "refunded");
  assert.throws(
    () => run(s, "sale.refund", { id: saleId, reason: "Encore" }),
    /déjà annulée/,
  );
  balanced(s.data);
});
test("débit OU crédit, compte actif et période ouverte requis", () => {
  const s = createDemo(),
    date = new Date().toISOString().slice(0, 10);
  assert.throws(
    () =>
      validateEntry(
        {
          date,
          lines: [
            { account: "571", debit: 100, credit: 100 },
            { account: "701", debit: 100, credit: 100 },
          ],
        },
        s.data.accounts,
        s.data.periods,
      ),
    /OU/,
  );
  assert.throws(
    () =>
      validateEntry(
        {
          date,
          lines: [
            { account: "571", debit: 100, credit: 0 },
            { account: "701", debit: 0, credit: 99 },
          ],
        },
        s.data.accounts,
        s.data.periods,
      ),
    /égal/,
  );
  s.data.periods[0].status = "locked";
  assert.throws(
    () => run(s, "expense.create", { label: "Loyer", amount: 100000 }),
    /période ouverte/,
  );
});
test("balance : totaux égaux et immobilité des écritures postées", () => {
  let s = createDemo();
  const trial = trialBalance(
    s.data.entries,
    s.data.accounts,
    s.data.periods[0].start,
    s.data.periods[0].end,
  );
  assert.equal(
    trial.reduce((n, r) => n + r.debit - r.credit, 0),
    0,
  );
  const e = s.data.entries.find(
    (e) => e.status === "posted" && e.storeId === "s1",
  );
  s = run(s, "entry.reverse", { id: e.id, reason: "Correction" });
  assert.deepEqual(s.data.entries.find((v) => v.id === e.id).lines, e.lines);
  balanced(s.data);
});
test("permissions et boutiques : refus de la commande hors périmètre", () => {
  const s = createDemo();
  s.session.permissions = rolePermissions.cashier;
  assert.throws(() => run(s, "entry.post", { id: "e0" }), /Permission/);
  assert.throws(
    () =>
      run(s, "sale.create", {
        lines: [{ productId: "p8", quantity: 1, price: 395000 }],
        paid: 395000,
      }),
    /Stock insuffisant/,
  );
  assert.throws(() => run(s, "sale.create", {}, "s99"), /boutique active/);
});
test("FCFA sans décimales, EUR en unités mineures, montants invalides refusés", () => {
  assert.equal(minor("12.34", "EUR"), 1234);
  assert.match(money(1234, "EUR"), /12,34/);
  assert.doesNotMatch(money(1234, "XOF"), /,00/);
  assert.throws(() => minor("NaN", "XOF"), /invalide/);
});
test("import atomique avec mapping : quantité groupée et rejet des lignes invalides", () => {
  const s = createDemo();
  const next = run(s, "stock.import", {
    rows: [
      {
        brand: "Nokia",
        model: "G60",
        quantity: 2000,
        cost: 50000,
        price: 75000,
      },
    ],
  });
  assert.equal(
    next.data.products.find((p) => p.model === "G60").quantity,
    2000,
  );
  assert.throws(
    () =>
      run(s, "stock.import", {
        rows: [
          {
            brand: "Nokia",
            model: "G60",
            quantity: 1,
            cost: 50000,
            price: 75000,
          },
          { brand: "", model: "", quantity: 0, cost: 0, price: 0 },
        ],
      }),
    /invalide/,
  );
  assert.equal(
    s.data.products.some((p) => p.model === "G60"),
    false,
  );
  balanced(next.data);
});
test("paiement fractionné : caisse et Mobile Money correspondent aux comptes", () => {
  let s = createDemo();
  s = run(s, "sale.create", {
    lines: [{ productId: "p0", quantity: 1, price: 425000 }],
    paid: 425000,
    payments: [
      { method: "Espèces", amount: 200000 },
      { method: "Mobile Money", amount: 225000 },
    ],
  });
  const sale = s.data.sales[0];
  const payments = s.data.payments.filter((p) => p.sourceId === sale.id);
  assert.equal(
    payments.reduce((n, p) => n + p.amount, 0),
    425000,
  );
  const entry = s.data.entries.find((e) => e.sourceId === sale.id);
  assert.equal(entry.lines.find((l) => l.account === "571").debit, 200000);
  assert.equal(entry.lines.find((l) => l.account === "552").debit, 225000);
  balanced(s.data);
});
test("transfert inter-boutiques : stock et compte de liaison équilibrés", () => {
  const s = createDemo(),
    initial = s.data.products.find((p) => p.id === "p1").quantity;
  const next = run(s, "stock.transfer", {
    productId: "p1",
    quantity: 2,
    destination: "s2",
    reason: "Réassort",
  });
  assert.equal(
    next.data.products.find((p) => p.id === "p1").quantity,
    initial - 2,
  );
  assert.equal(next.data.products.find((p) => p.id === "p8").quantity, 11);
  const movement = next.data.entries.slice(0, 2);
  assert.deepEqual(
    new Set(movement.map((e) => e.storeId)),
    new Set(["s1", "s2"]),
  );
  assert.equal(
    movement
      .flatMap((e) => e.lines)
      .filter((l) => l.account === "581")
      .reduce((n, l) => n + l.debit - l.credit, 0),
    0,
  );
  balanced(next.data);
});
test("troc : CA et marge concordent avec le journal de ventes", () => {
  const s = createDemo();
  const next = run(s, "trade.create", {
    brand: "Apple",
    model: "iPhone 12",
    productId: "p0",
    value: 100000,
    price: 150000,
    method: "Mobile Money",
  });
  const before = indicators(s.data.sales, s.data.payments, s.data.entries),
    after = indicators(next.data.sales, next.data.payments, next.data.entries);
  assert.equal(after.revenue - before.revenue, 425000);
  assert.equal(after.incoming - before.incoming, 325000);
  assert.equal(after.margin - before.margin, 85000);
  assert.equal(after.result - before.result, 85000);
});
test("achat de plusieurs références : une dette globale et réceptions exactes", () => {
  const s = createDemo();
  const next = run(s, "purchase.create", {
    supplierId: "sup1",
    paid: 100000,
    lines: [
      { productId: "p0", quantity: 2, cost: 300000 },
      { productId: "p1", quantity: 3, cost: 250000 },
    ],
  });
  assert.equal(next.data.purchases[0].amount, 1350000);
  assert.equal(next.data.purchases[0].paid, 100000);
  assert.equal(next.data.products.find((p) => p.id === "p0").quantity, 20);
  assert.equal(next.data.products.find((p) => p.id === "p1").quantity, 15);
  balanced(next.data);
});
test("un brouillon est modifiable, une écriture postée reste définitive", () => {
  let s = createDemo();
  const payload = {
    date: new Date().toISOString().slice(0, 10),
    journal: "Opérations diverses",
    label: "Brouillon",
    lines: [
      { account: "571", label: "Débit", debit: 100, credit: 0 },
      { account: "101", label: "Crédit", debit: 0, credit: 100 },
    ],
  };
  s = run(s, "entry.save", payload);
  const id = s.data.entries[0].id;
  s = run(s, "entry.save", { ...payload, id, label: "Brouillon corrigé" });
  assert.equal(s.data.entries.filter((e) => e.id === id).length, 1);
  assert.equal(
    s.data.entries.find((e) => e.id === id).label,
    "Brouillon corrigé",
  );
  s = run(s, "entry.post", { id });
  assert.throws(() => run(s, "entry.save", { ...payload, id }), /brouillon/);
});

const {
  quoteReturn,
  salePosition,
  cashSettlement,
  dueState,
  replenishment,
} = require("../src/frontend/operations.ts");
test("espèces remises : la monnaie ne devient pas du chiffre d’affaires", () => {
  let s = run(createDemo(), "sale.create", {
    lines: [{ productId: "p0", quantity: 1, price: 425000 }],
    paid: 425000,
    method: "Espèces",
    cashTendered: 500000,
  });
  const sale = s.data.sales[0];
  assert.equal(sale.cashChange, 75000);
  assert.equal(sale.paid, 425000);
  assert.equal(
    s.data.payments
      .filter((p) => p.sourceId === sale.id)
      .reduce((n, p) => n + p.amount, 0),
    425000,
  );
  assert.throws(
    () => cashSettlement([{ method: "Espèces", amount: 100 }], 99),
    /insuffisantes/,
  );
  balanced(s.data);
});
test("vente à perte : permission ET motif obligatoires, audit conservé", () => {
  const s = createDemo(),
    payload = {
      lines: [{ productId: "p0", quantity: 1, price: 1 }],
      paid: 1,
      method: "Espèces",
    };
  assert.throws(() => run(s, "sale.create", payload), /Vente à perte/);
  const restricted = structuredClone(s);
  restricted.session.permissions = restricted.session.permissions.filter(
    (p) => p !== "sales.sell_below_cost",
  );
  assert.throws(
    () =>
      run(restricted, "sale.create", {
        ...payload,
        priceOverrideReason: "Liquidation",
      }),
    /Vente à perte/,
  );
  const next = run(s, "sale.create", {
    ...payload,
    priceOverrideReason: "Liquidation du modèle",
  });
  assert.equal(next.data.sales[0].priceOverrideReason, "Liquidation du modèle");
  balanced(next.data);
});
test("retours partiels : réduction de créance, remboursement et stock défectueux", () => {
  const initial = createDemo(),
    qty = initial.data.products[0].quantity,
    cost = initial.data.products[0].cost;
  let s = run(initial, "sale.create", {
    lines: [{ productId: "p0", quantity: 3, price: 425000 }],
    paid: 425000,
    clientId: initial.data.clients[0].id,
    method: "Espèces",
    dueDate: "2026-01-01",
  });
  const id = s.data.sales[0].id;
  s = run(s, "sale.return", {
    id,
    reason: "Défaut",
    lines: [{ lineIndex: 0, quantity: 1, restock: false }],
  });
  assert.equal(salePosition(s.data.sales[0]).due, 425000);
  assert.equal(s.data.products[0].quantity, qty - 3);
  assert.equal(s.data.sales[0].returns[0].cashRefund, 0);
  s = run(s, "sale.return", {
    id,
    reason: "Échange commercial",
    lines: [{ lineIndex: 0, quantity: 2, restock: true }],
    method: "Espèces",
  });
  assert.equal(salePosition(s.data.sales[0]).due, 0);
  assert.equal(s.data.sales[0].returns[1].cashRefund, 425000);
  assert.equal(s.data.products[0].quantity, qty - 1);
  assert.equal(salePosition(s.data.sales[0]).netCost, cost);
  assert.equal(s.data.sales[0].status, "refunded");
  assert.throws(
    () =>
      run(s, "sale.return", {
        id,
        reason: "Double",
        lines: [{ lineIndex: 0, quantity: 1, restock: true }],
      }),
    /déjà annulée/,
  );
  balanced(s.data);
});
test("retours et remise : les arrondis des trois retours restituent exactement le montant net", () => {
  let s = run(createDemo(), "sale.create", {
    lines: [{ productId: "p0", quantity: 3, price: 425000 }],
    discount: 1,
    paid: 1274999,
    method: "Espèces",
  });
  const id = s.data.sales[0].id;
  for (let i = 0; i < 3; i++)
    s = run(s, "sale.return", {
      id,
      reason: "Retour",
      lines: [{ lineIndex: 0, quantity: 1, restock: true }],
    });
  assert.equal(
    s.data.sales[0].returns.reduce((n, r) => n + r.amount, 0),
    1274999,
  );
  assert.equal(salePosition(s.data.sales[0]).netTotal, 0);
  balanced(s.data);
});
test("retour partiel puis règlement : seul le nouveau solde peut être encaissé", () => {
  let s = createDemo();
  s = run(s, "sale.create", {
    lines: [{ productId: "p0", quantity: 2, price: 425000 }],
    paid: 0,
    clientId: s.data.clients[0].id,
    method: "Espèces",
  });
  const id = s.data.sales[0].id;
  s = run(s, "sale.return", {
    id,
    reason: "Retour",
    lines: [{ lineIndex: 0, quantity: 1, restock: true }],
  });
  assert.throws(() =>
    run(s, "payment.create", {
      sourceId: id,
      amount: 425001,
      method: "Espèces",
    }),
  );
  s = run(s, "payment.create", {
    sourceId: id,
    amount: 425000,
    method: "Espèces",
  });
  assert.equal(salePosition(s.data.sales[0]).due, 0);
  balanced(s.data);
});
test("doublons produit, contact, facture et IMEI refusés sans mutation", () => {
  const s = createDemo(),
    p = s.data.products[0];
  assert.throws(
    () =>
      run(s, "product.save", {
        ...p,
        id: undefined,
        brand: " " + p.brand.toUpperCase() + " ",
      }),
    /existe déjà/,
  );
  let next = run(s, "client.save", {
    label: "Premier",
    phone: "+229 01 23 45 67 89",
  });
  assert.throws(
    () =>
      run(next, "client.save", { label: "Doublon", phone: "2290123456789" }),
    /déjà/,
  );
  const purchase = {
    supplierId: s.data.suppliers[0].id,
    reference: "FAC-UNIQUE",
    productId: "p0",
    quantity: 1,
    cost: 100000,
    paid: 0,
  };
  next = run(s, "purchase.create", purchase);
  assert.throws(() => run(next, "purchase.create", purchase), /déjà/);
  assert.throws(
    () =>
      run(s, "sale.create", {
        lines: [
          {
            productId: "p0",
            quantity: 1,
            price: 425000,
            imei: "123456789012345",
          },
          {
            productId: "p1",
            quantity: 1,
            price: 395000,
            imei: "123456789012345",
          },
        ],
        paid: 820000,
        method: "Espèces",
      }),
    /IMEI/,
  );
});
test("clôture guidée : chaque mode électronique doit être rapproché", () => {
  let s = run(createDemo(), "sale.create", {
    lines: [{ productId: "p0", quantity: 1, price: 425000 }],
    paid: 425000,
    method: "Mobile Money",
  });
  assert.throws(
    () => run(s, "cash.close", { amount: 0, reason: "Comptage" }),
    /électroniques/,
  );
  s = run(s, "cash.close", {
    amount: 0,
    reason: "Comptage confirmé",
    reconciledMethods: ["Mobile Money"],
  });
  assert.equal(s.data.cash[0].status, "closed");
  assert.deepEqual(s.data.cash[0].reconciledMethods, ["Mobile Money"]);
});
test("échéances et proposition de réapprovisionnement", () => {
  const s = createDemo().data.sales[0];
  assert.equal(
    dueState(
      { ...s, status: "credit", total: 100, paid: 0, dueDate: "2026-01-01" },
      "2026-01-03",
    ).days,
    2,
  );
  assert.deepEqual(
    replenishment({
      ...createDemo().data.products[0],
      quantity: 2,
      threshold: 3,
      reorderTarget: 10,
    }),
    { target: 10, suggested: 8 },
  );
  assert.throws(
    () =>
      quoteReturn({ ...s, status: "paid" }, [
        { lineIndex: 0, quantity: 9999, restock: true },
      ]),
    /quantité dépasse/,
  );
});
