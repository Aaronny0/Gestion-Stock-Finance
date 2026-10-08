import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { navigation } from "@/frontend/navigation";

interface AppBreadcrumbProps {
  path: string;
  href: (path: string) => string;
}

function routeItem(path: string) {
  if (path.startsWith("/products/")) {
    return navigation
      .flatMap((section) => section.items)
      .find((item) => item.path === "/stock");
  }
  return navigation
    .flatMap((section) => section.items)
    .find((item) =>
      item.path === "/"
        ? path === "/"
        : path === item.path || path.startsWith(`${item.path}/`),
    );
}

export function AppBreadcrumb({ path, href }: AppBreadcrumbProps) {
  const item = routeItem(path);
  const isDetail =
    path.startsWith("/products/") || path.split("/").filter(Boolean).length > 1;

  const section = navigation.find((section) =>
    section.items.some((entry) => entry.path === item?.path),
  );
  const sectionLabel =
    section?.section === "OPÉRATIONS"
      ? "Opérations"
      : section?.section === "ADMINISTRATION"
        ? "Administration"
        : section?.section === "FINANCE"
          ? "Finance"
          : "Pilotage";

  return (
    <nav
      aria-label="Fil d’Ariane"
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      <Link
        href={href("/")}
        className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
      >
        {sectionLabel}
      </Link>
      <span className="hidden text-[#c0c9c9] sm:block" aria-hidden="true">
        /
      </span>
      {item ? (
        isDetail ? (
          <>
            <Link
              href={href(item.path)}
              className="truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
            <ChevronRight
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate font-semibold text-foreground">
              Détail
            </span>
          </>
        ) : (
          <span className="truncate font-semibold text-foreground">
            {item.label}
          </span>
        )
      ) : (
        <span className="truncate font-semibold text-foreground">Détail</span>
      )}
    </nav>
  );
}
