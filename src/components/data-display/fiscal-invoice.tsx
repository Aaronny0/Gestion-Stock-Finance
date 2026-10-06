"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { Sale } from "@/frontend/types";

export function FiscalInvoice({ invoice }: { invoice: NonNullable<Sale["fiscalInvoices"]>[number] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    if (!target || !invoice.qrCode) return;
    QRCode.toCanvas(target, invoice.qrCode, { width: 160, margin: 4, errorCorrectionLevel: "M" }).catch(() => {
      // The payload remains readable if a malformed provider value cannot be encoded.
      target.hidden = true;
    });
  }, [invoice.qrCode]);
  return <div className="space-y-2 break-words text-sm">
    <p className="font-semibold">{invoice.returnId ? "Avoir fiscal" : "Facture fiscale"} · {invoice.status === "issued" ? "Émise" : invoice.status === "failed" ? "Reprise en attente" : "En attente de normalisation"}</p>
    {invoice.ifu ? <p>IFU : {invoice.ifu}</p> : null}
    {invoice.code ? <p>{invoice.code}</p> : null}
    {invoice.status === "issued" && invoice.qrCode ? <><canvas ref={canvas} role="img" aria-label="Code QR de la facture fiscale" className="mx-auto max-w-full" /><details className="print:hidden"><summary className="cursor-pointer text-xs">Données du code QR</summary><p className="break-all text-xs text-muted-foreground">{invoice.qrCode}</p></details></> : null}
  </div>;
}
