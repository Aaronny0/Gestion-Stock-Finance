"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>>(
  ({ className, ...props }, ref) => <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-foreground/35", className)} {...props} />,
);
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content ref={ref} className={cn("fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[90dvh] flex-col rounded-t-xl border border-border bg-card shadow-[var(--shadow-dialog)] outline-none", className)} {...props}>
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  ),
);
DrawerContent.displayName = "DrawerContent";
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("grid gap-1.5 p-5 text-left", className)} {...props} />; }
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("mt-auto flex flex-col gap-2 p-5", className)} {...props} />; }
const DrawerTitle = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>>(({ className, ...props }, ref) => <DrawerPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />);
DrawerTitle.displayName = "DrawerTitle";
const DrawerDescription = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>>(({ className, ...props }, ref) => <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
DrawerDescription.displayName = "DrawerDescription";

export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription };
