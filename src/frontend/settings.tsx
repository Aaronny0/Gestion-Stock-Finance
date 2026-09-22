"use client";
import { useState } from "react";
import Link from "next/link";
import { FiPlus, FiSave, FiShield, FiCheckCircle } from "react-icons/fi";
import { useWorkspace, useUnsavedChanges } from "./provider";
import { Alert, DataTable, Field, PageHeading } from "./ui";
import { ActionForm } from "./forms";
import { request } from "./api";
export default function Settings({ path }: { path: string }) {
  const { snapshot, command, href, can, demo } = useWorkspace();
  const org = snapshot!.session.organization,
    tab = path.split("/")[2] || "organization";
  const [name, setName] = useState(org.name),
    [country, setCountry] = useState(org.country),
    [timezone, setTimezone] = useState(org.timezone),
    [split, setSplit] = useState(org.splitPayments),
    [fiscal, setFiscal] = useState(org.fiscalEnabled),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(""),
    [status, setStatus] = useState("");
  useUnsavedChanges(
    name !== org.name ||
      country !== org.country ||
      timezone !== org.timezone ||
      split !== org.splitPayments ||
      fiscal !== org.fiscalEnabled,
    "Paramètres",
  );
  const tabs = [
    ["organization", "Entreprise"],
    ["stores", "Boutiques"],
    ["sales", "Vente"],
    ["stock", "Stock"],
    ["accounting", "Comptabilité"],
    ...(can("fiscal.manage") ? [["fiscal", "Fiscalité"]] : []),
    ["security", "Sécurité"],
  ];
  return (
    <>
      <PageHeading
        eyebrow="PARAMÈTRES"
        title="Un espace à votre image."
        description="Configurez votre entreprise, vos boutiques et vos règles de travail."
      />
      <div className="tabs page-tabs">
        {tabs.map(([k, l]) => (
          <Link
            key={k}
            className={tab === k ? "active" : ""}
            href={href("/settings/" + k)}
          >
            {l}
          </Link>
        ))}
      </div>
      <form
        className="panel settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await command("settings.save", {
              name,
              country,
              timezone,
              splitPayments: split,
              ...(can("fiscal.manage") ? { fiscalEnabled: fiscal } : {}),
            });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {tab === "organization" && (
          <>
            <h2>Informations de l’entreprise</h2>
            <p>
              Ces informations apparaissent sur vos documents et dans votre
              espace.
            </p>
            <div className="form-grid">
              <Field label="Nom commercial" required>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Pays">
                <input
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </Field>
              <Field
                label="Devise"
                hint="La devise ne se change pas après les premières écritures."
              >
                <input disabled value={org.currency} />
              </Field>
              <Field label="Fuseau horaire">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {[
                    ...new Set([
                      org.timezone,
                      "Africa/Porto-Novo",
                      "Africa/Abidjan",
                      "Africa/Douala",
                      "Europe/Paris",
                    ]),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}
        {tab === "stores" && (
          <>
            <div className="panel-heading">
              <h2>Points de vente</h2>
              <button
                type="button"
                className="button secondary"
                onClick={() => setAction("store.save")}
              >
                <FiPlus />
                Ajouter une boutique
              </button>
            </div>
            <DataTable
              name="boutiques"
              rows={snapshot!.session.stores}
              columns={[
                { key: "name", label: "Boutique" },
                { key: "city", label: "Ville" },
                {
                  key: "active",
                  label: "Statut",
                  render: (s) => (s.active ? "Active" : "Inactive"),
                },
              ]}
            />
          </>
        )}
        {tab === "sales" && (
          <>
            <h2>Ventes et reçus</h2>
            <p>
              Le crédit impose l’identification du client. Les remises sont
              contrôlées selon les permissions.
            </p>
            <label className="check-field">
              <input
                type="checkbox"
                checked={split}
                onChange={(e) => setSplit(e.target.checked)}
              />
              Autoriser les paiements fractionnés
            </label>
            <Alert>
              Les reçus sont disponibles en impression A4 ou ticket. Les règles
              de taxe dépendent de la configuration serveur de votre pays.
            </Alert>
          </>
        )}
        {tab === "stock" && (
          <>
            <h2>Catalogue et suivi des appareils</h2>
            <Alert>
              L’IMEI est toujours facultatif. Une entrée de 2 000 unités peut
              être enregistrée en une seule ligne.
            </Alert>
            <Link className="button secondary" href={href("/stock")}>
              Configurer les seuils par produit
            </Link>
          </>
        )}
        {tab === "accounting" && (
          <>
            <h2>Modèle comptable</h2>
            <p>
              Le modèle de démonstration présente un exemple de comptes. Le plan
              et les taxes de l’entreprise doivent être définis dans la
              configuration métier.
            </p>
            <Link
              className="button secondary"
              href={href("/accounting/accounts")}
            >
              Ouvrir le plan comptable
            </Link>
            <Link
              className="button secondary"
              href={href("/accounting/periods")}
            >
              Exercices et périodes
            </Link>
          </>
        )}
        {tab === "fiscal" && can("fiscal.manage") && (
          <>
            <h2>e-MECeF</h2>
            <p>Connecteur fiscal facultatif par entreprise.</p>
            <label className="check-field">
              <input
                type="checkbox"
                checked={fiscal}
                onChange={(e) => setFiscal(e.target.checked)}
              />
              Activer e-MECeF
            </label>
            {fiscal && (
              <>
                <Alert>
                  Les secrets de connexion sont gérés côté serveur. Aucun token
                  n’est affiché ni conservé dans ce navigateur.
                </Alert>
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    setStatus("");
                    try {
                      if (demo)
                        setStatus(
                          "Démonstration : aucun connecteur fiscal réel n’est appelé.",
                        );
                      else {
                        await request("fiscal/test", {
                          method: "POST",
                          body: JSON.stringify({ organizationId: org.id }),
                        });
                        setStatus("Connexion vérifiée.");
                      }
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <FiCheckCircle />
                  Tester la connexion
                </button>
                {status && <Alert>{status}</Alert>}
              </>
            )}
          </>
        )}
        {tab === "security" && (
          <>
            <h2>
              <FiShield />
              Sécurité de l’espace
            </h2>
            <p>
              Les sessions et permissions sont vérifiées par le service métier.
              L’accès d’un membre suspendu est refusé à la prochaine
              vérification.
            </p>
            <Link className="button secondary" href="/forgot-password">
              Réinitialiser mon mot de passe
            </Link>
          </>
        )}
        {error && <Alert error>{error}</Alert>}
        {["organization", "sales", "fiscal"].includes(tab) && (
          <button className="button primary" disabled={busy}>
            <FiSave />
            {busy ? "Enregistrement…" : "Enregistrer les paramètres"}
          </button>
        )}
      </form>
      {action && (
        <ActionForm
          type={action}
          title="Créer un point de vente"
          onClose={() => setAction("")}
        />
      )}
    </>
  );
}
