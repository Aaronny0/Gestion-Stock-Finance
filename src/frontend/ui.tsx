"use client";
import { useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, type DialogSize } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { money } from "./accounting";
import { useWorkspace } from "./provider";
export function Money({ value }: { value: number }) {
  const { snapshot } = useWorkspace();
  return (
    <span className="money">
      {money(value, snapshot?.session.organization.currency)}
    </span>
  );
}
export function Alert({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`alert ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <CircleAlert aria-hidden />
      {children}
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton-grid" role="status" aria-label="Chargement">
      <div />
      <div />
      <div />
      <div />
      <div className="wide" />
    </div>
  );
}
export function Field({
  label,
  children,
  error,
  hint,
  required,
  wide,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Occupe toute la largeur de la grille (textarea). */
  wide?: boolean;
}) {
  const id = useId();
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>
        {label}
        {required && <b aria-hidden> *</b>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small id={id} className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
// D27 : façades sur le Dialog Radix — même API pour les appelants, une seule famille de modales.
export function Modal({
  title,
  description,
  children,
  onClose,
  onCloseRequest,
  size = "md",
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  /** Peut refuser la fermeture (formulaire modifié) ; appelé pour Échap, clic sur le fond et la croix. */
  onCloseRequest?: () => boolean;
  size?: DialogSize;
}) {
  const request = () => {
    if (onCloseRequest?.() !== false) onClose();
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) request(); }}>
      <DialogContent
        size={size}
        onEscapeKeyDown={(event) => { event.preventDefault(); if (onCloseRequest?.() !== false) onClose(); }}
        onPointerDownOutside={(event) => { event.preventDefault(); if (onCloseRequest?.() !== false) onClose(); }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function ConfirmDialog({
  title,
  children,
  onClose,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => unknown;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{children}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
