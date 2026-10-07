import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, PackageSearch, UsersRound, CheckCheck } from "lucide-react";
type AttentionItem = { label: string; description: string; href: string; tone: "warning" | "info" | "primary"; icon: "stock" | "cash" | "team" };
const icons = { stock: PackageSearch, cash: CircleDollarSign, team: UsersRound };
export function DashboardAttention({ items }: { items: AttentionItem[] }) {
  return <aside className="attention-workspace" aria-labelledby="attention-title">
    <div className="attention-heading"><span className="attention-dot"/><span>Votre prochain mouvement</span></div>
    <h2 id="attention-title">À surveiller <span>{items.length.toString().padStart(2,"0")}</span></h2>
    <p>Les bonnes actions, au bon moment.</p>
    <div className="attention-list">{items.map(item => { const Icon=icons[item.icon]; return <Link key={item.href} href={item.href} className={`attention-row ${item.tone}`}><Icon size={19}/><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowUpRight size={16}/></Link>; })}</div>
    {!items.length && <div className="attention-empty"><CheckCheck/><strong>Aucun point critique</strong><p>Votre activité peut suivre son cours.</p></div>}
    <div className="attention-note">Les alertes reflètent la boutique active. Consultez chaque détail avant d’agir.</div>
  </aside>;
}
