import Link from "next/link";
import {
  ArrowRight,
  WalletCards,
  PackageSearch,
  UserRoundPlus,
  CheckCheck,
  HandCoins,
} from "lucide-react";
import styles from "./dashboard.module.css";
export type AttentionItem = {
  count: number;
  label: string;
  description: string;
  action: string;
  href: string;
  tone: "warning" | "info" | "primary" | "destructive";
  icon: "stock" | "cash" | "team" | "credit";
};
const icons = {
  stock: PackageSearch,
  cash: WalletCards,
  team: UserRoundPlus,
  credit: HandCoins,
};
export function DashboardAttention({ items }: { items: AttentionItem[] }) {
  return (
    <section aria-labelledby="attention-title" className={styles.attention}>
      <h2 id="attention-title">
        À traiter <span>{items.length}</span>
      </h2>
      {items.length ? (
        <div className={styles.attentionGrid}>
          {items.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.attentionCard}
              >
                <div className={styles.attentionTop}>
                  <span className={styles.iconTile} data-tone={item.tone}>
                    <Icon size={20} />
                  </span>
                  <strong>{item.count}</strong>
                </div>
                <div className={styles.attentionText}>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                <span className={styles.textAction}>
                  {item.action}
                  <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.nothing}>
          <CheckCheck size={20} />
          <span>Rien d’urgent. Votre activité est à jour.</span>
        </div>
      )}
    </section>
  );
}
