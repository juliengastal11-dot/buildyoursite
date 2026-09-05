import * as React from "react";
import { cn } from "@/lib/utils";
import { champStyles } from "./input";

/* ---------------------------------------------------------------------------
   Select natif, volontairement : sur un site vitrine, la liste déroulante du
   système est plus fiable au doigt qu'une liste maison, et elle ne coûte pas
   un octet de JavaScript. Pour un vrai combobox cherchable, ajouter
   `npx shadcn@latest add select` au projet concerné.
--------------------------------------------------------------------------- */

export type SelectProps = React.ComponentProps<"select"> & {
  /** Option vide affichée en premier. Indispensable pour que `required` serve. */
  placeholder?: string;
  options?: readonly string[];
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, placeholder, options, children, defaultValue, ...props }, ref) => (
    <select
      ref={ref}
      // Sans valeur initiale vide, un <select required> est toujours valide
      // et l'attribut `required` n'a aucun effet.
      defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
      className={cn(champStyles, "h-11 cursor-pointer pr-9", className)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export { Select };
