import { forwardRef, useCallback, type ButtonHTMLAttributes, type MutableRefObject } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { usePress } from "../glass/usePress";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "gm-pressable relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium outline-offset-2 transition-[color,background-color,opacity,box-shadow] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** 反色实心（黑底白字 / 白底黑字） */
        solid: "bg-fg text-bg hover:opacity-90",
        /** 玻璃按钮：六效果 + 按压 */
        glass: "glass glass-sm glass-interactive text-fg",
        /** 描边按钮 */
        outline: "border border-[var(--glass-edge)] bg-transparent text-fg hover:bg-[var(--tint-weak)]",
        /** 纯文字按钮 */
        ghost: "text-muted hover:bg-[var(--tint-weak)] hover:text-fg",
      },
      size: {
        sm: "h-8 rounded-[var(--radius-control)] px-3 text-xs",
        md: "h-10 rounded-[var(--radius-control)] px-4 text-sm",
        lg: "h-11 rounded-[var(--radius-control)] px-5 text-sm",
      },
    },
    defaultVariants: { variant: "glass", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, ...props }, ref) => {
    const press = usePress({ disabled: Boolean(disabled) });

    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        press.setNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [press, ref]
    );

    return (
      <button
        ref={setRefs}
        type={props.type ?? "button"}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant, size }),
          press.pressed && "is-pressed",
          press.releasing && "is-releasing",
          className
        )}
        {...press.pressProps}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";