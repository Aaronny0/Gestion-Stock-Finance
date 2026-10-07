import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChartNoAxesCombined,
  Package,
  ShoppingBag,
  Wallet,
  Users,
  ShieldCheck,
  Repeat2,
  ArrowRight,
} from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
const modules = [
  {
    title: "Vendre, sans ralentir.",
    label: "Caisse & ventes",
    text: "Du catalogue au reçu, gardez le panier, les remises et les moyens de paiement sous les yeux. Retrouvez chaque vente et son historique.",
    path: "/demo/pos",
    Icon: ShoppingBag,
  },
  {
    title: "Savoir ce qui est disponible.",
    label: "Stock & catalogue",
    text: "Consultez vos quantités par boutique, anticipez les ruptures et suivez les entrées, ajustements et transferts.",
    path: "/demo/stock",
    Icon: Package,
  },
  {
    title: "Suivre l’argent, précisément.",
    label: "Trésorerie & comptabilité",
    text: "Rapprochez encaissements, dépenses et règlements. Passez de la vue d’ensemble aux opérations qui expliquent vos chiffres.",
    path: "/demo/cash",
    Icon: Wallet,
  },
  {
    title: "Comprendre pour décider.",
    label: "Analyses & rapports",
    text: "Comparez vos produits, vos ventes et vos marges sur la période utile. Les graphiques vous ramènent au détail des opérations.",
    path: "/demo/analytics",
    Icon: ChartNoAxesCombined,
  },
  {
    title: "Garder le fil des relations.",
    label: "Clients & fournisseurs",
    text: "Coordonnées, achats et soldes dus sont réunis pour préparer votre prochain échange avec un client ou un fournisseur.",
    path: "/demo/clients",
    Icon: Users,
  },
  {
    title: "Faire circuler les appareils.",
    label: "Troc & rachat",
    text: "Identifiez l’appareil repris, sa valeur et le complément à régler. Les mouvements restent reliés à votre stock et à votre trésorerie.",
    path: "/demo/trade",
    Icon: Repeat2,
  },
];
export default function PublicSite({
  features = false,
}: {
  features?: boolean;
}) {
  return (
    <div className="public-site">
      <a className="skip-link" href="#public-main">
        Aller au contenu
      </a>
      <header className="public-nav">
        <AppLogo href="/" />
        <nav aria-label="Navigation publique">
          <Link href="/#produit">Le produit</Link>
          <Link href="/features" aria-current={features ? "page" : undefined}>
            Fonctionnalités
          </Link>
          <Link href="/demo">Démonstration</Link>
        </nav>
        <div>
          <Link className="public-login" href="/login">
            Se connecter
          </Link>
          <Link className="button primary" href="/signup">
            Demander un accès
          </Link>
        </div>
      </header>
      <main id="public-main">
        <section className="public-hero">
          <div className="hero-copy">
            <span className="public-kicker">
              Le poste de pilotage de votre commerce
            </span>
            <h1>
              {features
                ? "Chaque opération trouve sa place."
                : "Toute votre activité. Une vision claire."}
            </h1>
            <p>
              Ventes, stock et finances se rejoignent dans VORTEX. Gardez la
              maîtrise de vos boutiques, de vos chiffres et de votre prochain
              mouvement.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/demo">
                Explorer la démonstration <ArrowUpRight />
              </Link>
              <Link className="public-text-link" href="/signup">
                Demander un accès
              </Link>
            </div>
            <small>
              <Check size={14} /> Sans compte. Avec des données fictives.
            </small>
          </div>
          <div className="hero-aside">
            <span>Une vente enregistrée.</span>
            <span>Un stock à jour.</span>
            <span>Une décision éclairée.</span>
            <p>Vos opérations avancent ensemble.</p>
          </div>
        </section>
        <section
          id="produit"
          className="public-preview"
          aria-label="Aperçu du produit"
        >
          <div className="preview-caption">
            <span>
              <i /> VORTEX en situation
            </span>
            <Link href="/demo">
              Prendre les commandes <ArrowUpRight size={16} />
            </Link>
          </div>
          <Link
            href="/demo"
            aria-label="Explorer ce dashboard dans la démonstration"
          >
            <Image
              src="/product-dashboard.png"
              alt="Dashboard VORTEX : chiffre d’affaires, courbe d’activité, priorités et flux financiers de la boutique fictive Maison Mobile."
              width={1440}
              height={1000}
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </Link>
          <p>
            Maison Mobile, entreprise fictive de démonstration. Explorez les
            mêmes écrans, filtres et parcours dans la démo.
          </p>
        </section>
        <section className="public-value">
          <h2>
            Moins de dispersion.
            <br />
            Plus de maîtrise.
          </h2>
          <div>
            <p>
              Une vente ne s’arrête pas à un reçu. Elle change votre stock,
              votre caisse et votre relation client.
            </p>
            <p>
              VORTEX rassemble ces informations pour vous permettre de suivre
              l’activité sans reconstruire votre journée dans plusieurs outils.
            </p>
          </div>
        </section>
        <section className="public-modules">
          <div className="public-section-heading">
            <h2>Un commerce, des opérations reliées.</h2>
            <p>
              Chaque espace répond à une question concrète de votre quotidien.
            </p>
          </div>
          <div className="module-grid">
            {modules.map(({ title, label, text, path, Icon }) => (
              <article key={label}>
                <Icon size={24} />
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link href={path}>
                  Explorer ce module <ArrowUpRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="public-control">
          <div>
            <ShieldCheck size={32} />
            <h2>
              Une équipe coordonnée.
              <br />
              Des responsabilités claires.
            </h2>
            <p>
              Travaillez dans le contexte de la bonne boutique. Attribuez les
              rôles, suivez les événements et retrouvez l’origine de chaque
              opération.
            </p>
            <Link href="/demo/team">
              Découvrir la gestion d’équipe <ArrowUpRight size={16} />
            </Link>
          </div>
          <ul>
            <li>
              <Check />
              <span>
                <strong>Des accès adaptés à chaque métier</strong>Propriétaire,
                responsable, caisse, stock et comptabilité.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <strong>Une activité traçable</strong>Des historiques pour
                retrouver les actions et leurs auteurs.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <strong>Votre entreprise, votre périmètre</strong>Une
                organisation et une boutique actives toujours identifiables.
              </span>
            </li>
          </ul>
        </section>
        <section className="public-start">
          <div>
            <span>Votre prochaine étape</span>
            <h2>
              Découvrez d’abord.
              <br />
              Décidez ensuite.
            </h2>
            <p>
              Explorez VORTEX librement. Si le produit correspond à votre
              activité, envoyez votre demande : notre équipe vous accompagnera
              pour la suite.
            </p>
            <Link className="button primary" href="/signup">
              Demander un accès <ArrowRight />
            </Link>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Explorez la démonstration</strong>
                <p>Découvrez une entreprise fictive en activité.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Présentez votre entreprise</strong>
                <p>Créez votre compte et confirmez votre e-mail.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Démarrez après validation</strong>
                <p>
                  Configurez votre espace lorsque notre équipe approuve votre
                  accès.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>
      <footer className="public-footer">
        <AppLogo href="/" />
        <p>Votre activité, en toute clarté.</p>
        <nav aria-label="Liens de pied de page">
          <Link href="/demo">Démonstration</Link>
          <Link href="/signup">Demander un accès</Link>
          <Link href="/login">Se connecter</Link>
        </nav>
      </footer>
    </div>
  );
}
