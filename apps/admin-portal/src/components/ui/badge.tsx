import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/30",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-300",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-all duration-300",
        outline: "text-foreground border-primary/30 hover:border-accent/50 hover:bg-primary/10 transition-all duration-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
