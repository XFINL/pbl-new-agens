import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

/** 玻璃槽 + 反色实心滑块（视觉规则见 .glass-segment） */
export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("glass-segment flex-nowrap overflow-x-auto", className)}
    {...props}
  />
));

TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn("glass-segment-item whitespace-nowrap", className)}
    {...props}
  />
));

TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("outline-none", className)} {...props} />
));

TabsContent.displayName = "TabsContent";