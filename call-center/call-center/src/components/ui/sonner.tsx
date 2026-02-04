"use client";

import { cva } from "class-variance-authority";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "" } = useTheme();

  const sonnerVariants = cva(
    "group group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:!border !border dark:group-[.toaster]:!text-black",
    {
      variants: {
        variant: {
          default:
            "group-[.toaster]:bg-gray-100 group-[.toaster]:border-border",
          success:
            "group-[.toaster]:!bg-success-background group-[.toaster]:!border-success !border-success",
          error:
            " group-[.toaster]:!border-error group-[.toaster]:!bg-error-background",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    }
  );

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: sonnerVariants({ variant: "default" }),
          error: sonnerVariants({ variant: "error" }),
          success: sonnerVariants({ variant: "success" }),
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
