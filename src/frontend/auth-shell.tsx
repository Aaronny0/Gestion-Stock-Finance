import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Coins, FlaskConical, PackageCheck, ShieldCheck } from "lucide-react";
import styles from "./auth-design.module.css";

function Brand() {
  return <Link href="/" className={styles.brand} aria-label="VORTEX — accueil"><Image src="/auth/vortex-logo.png" alt="" width={44} height={44} priority /><span><strong>VORTEX</strong><small>Stock &amp; Finance</small></span></Link>;
}

export function AuthShell({ children, login = false, signup = false, forgot = false }: { children: ReactNode; login?: boolean; signup?: boolean; forgot?: boolean }) {
  return <div className={styles.page}>
    <aside className={styles.presentation} aria-label="Présentation de VORTEX">
      <Brand />
      <div className={styles.pitch}><h2>Chaque vente, <span>au bon endroit</span> : stock, caisse et compta à jour.</h2>
        <div className={styles.illustration} role="img" aria-label="Illustration : reçu de vente payé par Mobile Money et mise à jour du stock.">
          <div className={styles.receipt}><div className={styles.receiptHead}><strong>Maison Mobile</strong><span>Cotonou · Principal</span></div>
            <div className={styles.receiptMeta}><span>VTE-0196</span><span>08/10 · 11:42</span></div><hr />
            <div className={styles.receiptRow}><span><b>iPhone 15 · 128 Go</b><small>IMEI 3569…3809</small></span><span>425 000</span></div>
            <div className={styles.receiptRow}><b>Coque MagSafe</b><span>15 000</span></div><hr />
            <div className={styles.receiptRow}><b>Total</b><strong className={styles.total}>440 000 <small>XOF</small></strong></div>
            <span className={styles.payment}>Payé par Mobile Money</span><span className={styles.paid}><Check size={13} />Payée</span>
          </div>
          <div className={styles.stock}><span><PackageCheck size={18} /></span><div><strong>Stock mis à jour</strong><small>iPhone 15 · 128 Go → 4 restants</small></div></div>
        </div>
      </div>
      <div className={styles.assurances}><span><ShieldCheck size={14} />Accès par rôle et par boutique</span><span><Coins size={14} />XOF, Mobile Money, espèces</span></div>
    </aside>
    <main className={styles.main}>
      <header className={styles.header}><div className={styles.mobileBrand}><Brand /></div><span>{login ? <>Pas encore de compte ? <Link href="/signup">Demander un accès</Link></> : signup ? <>Déjà un compte ? <Link href="/login">Se connecter</Link></> : forgot ? <>Vous vous souvenez ? <Link href="/login">Se connecter</Link></> : <Link href="/login">Retour à la connexion</Link>}</span></header>
      <div className={styles.center}><div className={styles.card}>{children}
        {login && <><div className={styles.divider}>ou</div><Link href="/demo" className={styles.demo}><span><FlaskConical size={18} /></span><div><strong>Explorer la démonstration</strong><small>Une boutique fictive, sans inscription.</small></div><ArrowUpRight size={16} /></Link></>}
      </div></div>
      <footer className={styles.footer}><span>© 2026 VORTEX · Gestion Stock &amp; Finance</span><span>Vos données restent les vôtres.</span></footer>
    </main>
  </div>;
}
