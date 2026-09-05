import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Bouton du socle.

   Trois choses que les agents contournaient à la main avant :
   - `asChild` : un CTA qui navigue doit être un <a>, pas un <button> simulé.
   - `shape="pill"` : beaucoup de chartes veulent des pilules ; ne plus écrire
     `cn(buttonVariants(...), "rounded-full")` à chaque usage.
   - `variant="onDark"` : la variante `outline` disparaît sur un héros sombre.
--------------------------------------------------------------------------- */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium transition-all cursor-pointer",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0 [&_svg]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:opacity-90",
        accent: "bg-accent text-on-accent hover:opacity-90",
        secondary: "bg-secondary text-on-secondary hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted",
        link: "text-accent underline-offset-4 hover:underline",
        destructive: "bg-destructive text-on-destructive hover:opacity-90",
        /** Contour clair, pour un fond sombre ou une photo. */
        onDark: "border border-background/40 text-background hover:bg-background/10",
        /** Plein clair, pour un fond sombre ou une photo. */
        onDarkSolid: "bg-background text-foreground hover:bg-background/90",
      },
      shape: {
        default: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-none",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-10 px-5 py-2",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "default", shape: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Rend l'enfant au lieu d'un <button>, en lui passant les classes.
   * À utiliser dès qu'un bouton doit naviguer :
   *   <Button asChild shape="pill"><Link href="/tarifs">Voir les tarifs</Link></Button>
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, shape, size, asChild = false, ...props }, ref) => {
    const Composant = asChild ? Slot : "button";
    return (
      <Composant
        ref={ref}
        className={cn(buttonVariants({ variant, shape, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
