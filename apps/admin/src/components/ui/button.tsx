import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-transparent text-sm font-normal whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-90 border-transparent",
        outline:
          "rounded-nav border-foreground bg-transparent text-foreground hover:bg-secondary",
        secondary:
          "bg-card text-foreground hover:bg-secondary border-transparent",
        ghost:
          "text-muted-foreground hover:bg-card hover:text-foreground border-transparent",
        destructive:
          "bg-secondary text-foreground  hover:bg-secondary border-transparent",
        link: "text-muted-foreground underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-7 rounded-control px-2.5 text-xs",
        sm: "h-8 rounded-control px-3 text-xs",
        lg: "h-10 px-4 text-sm",
        icon: "size-9",
        "icon-xs": "size-7 rounded-control",
        "icon-sm": "size-8 rounded-control",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
