"use client";

import { ShoppingBag } from "lucide-react";
import { Money } from "@/components/data-display/money";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Cart } from "./cart";
import type { ComponentProps } from "react";

type CartProps = ComponentProps<typeof Cart>;

interface MobileCartDrawerProps extends CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileCartDrawer({ open, onOpenChange, ...cartProps }: MobileCartDrawerProps) {
  const quantity = cartProps.lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <>
      <button
        type="button"
        className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex min-h-14 items-center justify-between gap-3 rounded-lg bg-foreground px-4 text-left text-background shadow-[var(--shadow-dialog)] lg:hidden"
        onClick={() => onOpenChange(true)}
        aria-label="Ouvrir le panier"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-background/10">
            <ShoppingBag className="size-4" />
            {quantity ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{quantity}</span> : null}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Voir le panier</span>
            <span className="block truncate text-xs text-background/65">{quantity} article{quantity > 1 ? "s" : ""}</span>
          </span>
        </span>
        <Money value={cartProps.total} currency={cartProps.currency} className="shrink-0 text-sm font-bold" />
      </button>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90dvh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Panier de vente</DrawerTitle>
            <DrawerDescription>Articles, client, paiement et encaissement.</DrawerDescription>
          </DrawerHeader>
          <fieldset disabled={cartProps.quoting} className="m-0 min-h-0 min-w-0 flex-1 overflow-hidden border-0 p-0 pt-2 disabled:opacity-80">
            <Cart {...cartProps} />
          </fieldset>
        </DrawerContent>
      </Drawer>
    </>
  );
}
