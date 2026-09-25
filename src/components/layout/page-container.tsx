import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8", className)}
      {...props}
    />
  );
}
