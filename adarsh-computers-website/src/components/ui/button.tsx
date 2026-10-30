"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground shadow-[0_9px_24px_rgba(7,93,70,.18)] hover:-translate-y-0.5 hover:bg-[#064c3a]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-[#dce8e2]",
      outline: "border border-border bg-white text-foreground hover:border-primary/50 hover:text-primary",
      ghost: "text-foreground hover:bg-muted",
      danger: "bg-destructive text-white hover:brightness-95",
      lime: "bg-accent text-accent-foreground hover:brightness-95",
    },
    size: { default: "h-11 px-5", sm: "h-9 px-4 text-xs", lg: "h-13 px-7 text-base", icon: "size-10 rounded-full p-0" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
export { buttonVariants };
