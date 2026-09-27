import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../../lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "gm-overlay fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[6px]",
      className
    )}
    {...props}
  />
));

DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "gm-content glass glass-lg pointer-events-auto w-full max-w-md p-6 outline-none",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
));

DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-start justify-between gap-6", className)} {...props} />;
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold text-fg", className)}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-1 text-xs text-muted", className)}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";