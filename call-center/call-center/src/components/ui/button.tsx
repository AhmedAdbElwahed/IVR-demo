import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import LoaderSpiner from "./loader-spiner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        none: "",
        destructive: "bg-destructive text-destructive-foreground",
        outline:
          "border border-input text-primary bg-background hover:bg-accent hover:text-white dark:text-white dark:border-white/20 dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-white",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

type AnchorAttrs = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  href?: string;
  prefetch?: boolean | null;
  disabled?: boolean;

  /** تُستخدم فقط عند وجود href */
  target?: AnchorAttrs["target"];
  rel?: AnchorAttrs["rel"];
  download?: AnchorAttrs["download"];
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      href,
      prefetch,
      disabled = false,
      children,
      target,
      rel,
      download,
      onClick,
      ...props
    },
    ref
  ) => {
    if (href) {
      const isInactive = disabled || isLoading;

      const handleAnchorClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (isInactive) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e as any);
      };

      const safeRel =
        target === "_blank" ? rel ?? "noopener noreferrer" : rel;

      return (
        <Link
          href={href}
          prefetch={prefetch}
          target={target}
          rel={safeRel}
          download={download}
          onClick={handleAnchorClick}
          className={cn(
            buttonVariants({ variant, size, className }),
            isInactive && "pointer-events-none opacity-50"
          )}
          aria-disabled={isInactive}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </Link>
      );
    }

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || isLoading}
        type={(props as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button"}
        onClick={onClick}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {isLoading ? (
          <LoaderSpiner
            className={cn(
              "mx-auto",
              variant === "outline" ? "text-black dark:text-white" : "text-white"
            )}
          />
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
