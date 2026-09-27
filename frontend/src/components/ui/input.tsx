import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "glass-inset h-10 w-full px-3 text-sm text-fg transition-colors placeholder:text-faint",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";