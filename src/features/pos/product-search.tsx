"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductSearchProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  shortcut?: string;
}

const ProductSearch = React.forwardRef<HTMLInputElement, ProductSearchProps>(
  ({ className, shortcut = "F2", ...props }, ref) => (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input ref={ref} type="search" className={cn("h-12 pl-10 pr-14", className)} {...props} />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
        {shortcut}
      </kbd>
    </div>
  ),
);
ProductSearch.displayName = "ProductSearch";

export { ProductSearch };
