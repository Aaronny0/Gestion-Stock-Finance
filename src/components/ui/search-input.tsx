import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  onClear?: () => void;
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, value, onClear, ...props }, ref) => (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input ref={ref} type="search" value={value} className={cn("pl-9", onClear && value ? "pr-11" : "", className)} {...props} />
      {onClear && value ? (
        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-11" onClick={onClear} aria-label="Effacer la recherche">
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
