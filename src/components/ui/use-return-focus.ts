"use client";

import * as React from "react";

const FIRST_FIELD =
  // La recherche d'une table imbriquée n'est pas un champ de saisie de la modale.
  "[data-dialog-body] :is(input:not([type=hidden]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), [role=combobox]):not([data-list-toolbar] *)";

/**
 * Focus d'un dialogue (D27). À l'ouverture : premier champ du corps, sinon le contenu — jamais la croix.
 * À la fermeture : retour à l'élément actif au moment de l'ouverture. Radix ne sait revenir qu'à un Trigger,
 * et les dialogues ouverts par état rendaient sinon le focus à body.
 */
export function useReturnFocus(onOpenAutoFocus?: (event: Event) => void, onCloseAutoFocus?: (event: Event) => void) {
  const returnTo = React.useRef<HTMLElement | null>(null);
  // Appelé avant que Radix ne déplace le focus : l'élément actif est encore le déclencheur.
  // Un champ autoFocus a déjà pu prendre le focus dans le dialogue : on l'ignore.
  const remember = React.useCallback((root?: EventTarget | null) => {
    let active = document.activeElement;
    // Ouvert depuis un menu : l'élément de menu va disparaître, on revient au bouton qui ouvre le menu.
    const menu = active instanceof HTMLElement && active.getAttribute("role")?.startsWith("menuitem") ? active.closest("[role=menu]") : null;
    const menuTrigger = menu?.getAttribute("aria-labelledby");
    if (menuTrigger) active = document.getElementById(menuTrigger) ?? active;
    const inside = root instanceof Node && root.contains(active);
    returnTo.current = active instanceof HTMLElement && active !== document.body && !inside ? active : null;
  }, []);
  const onOpen = React.useCallback(
    (event: Event) => {
      remember(event.currentTarget);
      onOpenAutoFocus?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      const root = event.currentTarget as HTMLElement | null;
      (root?.querySelector<HTMLElement>(FIRST_FIELD) ?? root)?.focus({ preventScroll: true });
    },
    [onOpenAutoFocus, remember],
  );
  const onClose = React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      if (event.defaultPrevented) return;
      const target = returnTo.current;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus({ preventScroll: true });
      }
    },
    [onCloseAutoFocus],
  );
  return { remember, onOpenAutoFocus: onOpen, onCloseAutoFocus: onClose };
}
