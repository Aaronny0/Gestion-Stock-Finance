"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { onboardingFieldsSchema } from "@/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { request } from "@/frontend/api";
import { draftKey, parseOnboarding, readOnboarding, saveOnboarding } from "@/frontend/auth-flow";
import { useAuth } from "@/frontend/auth-provider";
import { buildOnboardingBody, fieldErrors } from "@/frontend/form-schemas";
import { onboardingDefaults, type OnboardingValues } from "@/frontend/onboarding-gate";
import { useWorkspace } from "@/frontend/provider";

const fields: { name: keyof OnboardingValues; label: string; autoComplete?: string; wide?: boolean }[] = [
  { name: "name", label: "Votre nom", autoComplete: "name", wide: true },
  { name: "organizationName", label: "Entreprise", autoComplete: "organization", wide: true },
  { name: "country", label: "Pays", autoComplete: "country-name" },
  { name: "currency", label: "Devise" },
  { name: "timezone", label: "Fuseau horaire", wide: true },
  { name: "storeName", label: "Premier point de vente", wide: true },
  { name: "city", label: "Ville / adresse", autoComplete: "address-level2", wide: true },
];

/**
 * Modal bloquant affiché sur le dashboard tant qu'un accès approuvé n'a pas d'entreprise.
 * Il ne se ferme ni par Échap, ni par un clic à l'extérieur : seule la création de l'espace (ou la déconnexion) en sort.
 */
export function OnboardingModal() {
  const auth = useAuth();
  const router = useRouter();
  const { reload } = useWorkspace();
  const initial = useMemo(
    () => onboardingDefaults({ name: auth.user?.name, company: auth.user?.company }, readOnboarding() ?? parseOnboarding(auth.user?.onboarding)),
    [auth.user?.name, auth.user?.company, auth.user?.onboarding],
  );
  const [values, setValues] = useState<OnboardingValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!auth.user) return null;

  const change = (name: keyof OnboardingValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const invalid = fieldErrors(onboardingFieldsSchema, values);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setError("Vérifiez les champs du formulaire.");
      requestAnimationFrame(() => document.getElementById(`onboarding-${Object.keys(invalid)[0]}`)?.focus());
      return;
    }
    setBusy(true);
    try {
      // The draft keeps the retry key between attempts; the body never carries the email (identity comes from the session).
      const draft = saveOnboarding({ ...values, email: auth.user?.email ?? "" });
      await request("onboarding", { method: "POST", headers: { "Idempotency-Key": draft.idempotencyKey }, body: JSON.stringify(buildOnboardingBody(draft.payload)) });
      sessionStorage.removeItem(draftKey);
      reload();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        hideClose
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Créez votre espace VORTEX</DialogTitle>
          <DialogDescription>
            Votre accès est validé. Renseignez votre entreprise et votre premier point de vente pour ouvrir votre tableau de bord. Vous pourrez les modifier ensuite.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate aria-busy={busy}>
          {fields.map((field) => (
            <div key={field.name} className={field.wide ? "space-y-2 sm:col-span-2" : "space-y-2"}>
              <Label htmlFor={`onboarding-${field.name}`}>{field.label}</Label>
              <Input
                id={`onboarding-${field.name}`}
                name={field.name}
                value={values[field.name]}
                autoComplete={field.autoComplete}
                maxLength={120}
                autoFocus={field.name === "organizationName"}
                disabled={busy}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? `onboarding-${field.name}-error` : undefined}
                onChange={(event) => change(field.name, event.target.value)}
              />
              {errors[field.name] ? <p id={`onboarding-${field.name}-error`} className="text-sm text-destructive">{errors[field.name]}</p> : null}
            </div>
          ))}
          {error ? <p role="alert" className="rounded-md bg-destructive-background px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p> : null}
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void auth.signOut().then(() => router.replace("/login")).catch((caught) => setError((caught as Error).message))}
            >
              Se déconnecter
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Création en cours…</> : "Créer mon espace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
