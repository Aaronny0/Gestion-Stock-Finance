"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/feedback/toaster";

function DesignSystemProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}

export { DesignSystemProvider };
