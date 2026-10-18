"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import styles from "./page-header.module.css";

type SecondaryAction = {
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
} & ({ onSelect: () => void; href?: never } | { href: string; onSelect?: never });

interface PageHeaderProps extends React.ComponentProps<"header"> {
  /** Retiré par D30 ; toléré jusqu'à la migration du dernier écran. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Une seule action principale, à droite. */
  primaryAction?: React.ReactNode;
  /** Actions outline ; regroupées dans « Autres actions » sous 768 px. */
  secondaryActions?: SecondaryAction[];
  /** Ancienne API ; remplacée par primaryAction et secondaryActions. */
  actions?: React.ReactNode;
}

function PageHeader({ eyebrow, title, description, primaryAction, secondaryActions = [], actions, className, ...props }: PageHeaderProps) {
  const hasActions = Boolean(primaryAction || secondaryActions.length || actions);
  // Une secondaire seule, sans primaire, reste un bouton : un menu « ⋯ » pour une seule action n'aide pas.
  const collapse = secondaryActions.length > 1 || (secondaryActions.length > 0 && Boolean(primaryAction));
  return (
    <header className={cn("vortex-page-header", styles.header, className)} {...props}>
      <div className={cn(styles.heading, "space-y-1")}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {hasActions ? (
        <div className={cn(styles.actions, collapse && styles.collapsible)}>
          {actions}
          {secondaryActions.length ? (
            <>
              {secondaryActions.map(({ label, icon: Icon, onSelect, href, disabled }) =>
                href ? (
                  <Button key={label} variant="outline" className={collapse ? styles.secondary : undefined} asChild>
                    <Link href={href}>{Icon ? <Icon /> : null} {label}</Link>
                  </Button>
                ) : (
                  <Button key={label} variant="outline" className={collapse ? styles.secondary : undefined} onClick={onSelect} disabled={disabled}>
                    {Icon ? <Icon /> : null} {label}
                  </Button>
                ),
              )}
              {collapse ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className={styles.menu} aria-label="Autres actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {secondaryActions.map(({ label, icon: Icon, onSelect, href, disabled }) =>
                    href ? (
                      <DropdownMenuItem key={label} asChild disabled={disabled}>
                        <Link href={href}>{Icon ? <Icon /> : null} {label}</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem key={label} onSelect={onSelect} disabled={disabled}>
                        {Icon ? <Icon /> : null} {label}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu> : null}
            </>
          ) : null}
          {primaryAction}
        </div>
      ) : null}
    </header>
  );
}

export { PageHeader };
export type { SecondaryAction };
