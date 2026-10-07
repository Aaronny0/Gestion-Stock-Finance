import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";
export default function NotFound() {
  return (
    <div className="access-layout">
      <header>
        <AppLogo href="/" />
      </header>
      <main className="access-content">
        <span className="public-kicker">Page introuvable · 404</span>
        <h1>Ce chemin ne mène plus à une page.</h1>
        <p>
          Le lien est peut-être incomplet ou la page a changé d’adresse.
          Retrouvez votre point de départ ci-dessous.
        </p>
        <div className="access-actions">
          <Link className="button primary" href="/">
            Retour à l’accueil
          </Link>
          <Link href="/app/dashboard">Mon espace VORTEX</Link>
          <Link href="/demo">Explorer la démo</Link>
        </div>
      </main>
    </div>
  );
}
