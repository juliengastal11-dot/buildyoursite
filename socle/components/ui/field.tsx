import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Un champ de formulaire complet : libellé, contrôle, aide, erreur.

   Existe pour rendre le mauvais choix difficile. Un placeholder n'est pas un
   libellé : il disparaît à la saisie, et les lecteurs d'écran ne le lisent pas
   de façon fiable. Ici le <label> est obligatoire et lié par `htmlFor`.
--------------------------------------------------------------------------- */

export type FieldProps = {
  /** Identifiant du contrôle. Lie le libellé, l'aide et l'erreur. */
  id: string;
  label: string;
  /** Texte d'aide sous le champ. Masqué quand une erreur s'affiche. */
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const idAide = hint ? `${id}-aide` : undefined;
  const idErreur = error ? `${id}-erreur` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>

      {/* Le contrôle reçoit id, aria-invalid et aria-describedby sans avoir à les répéter. */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id,
            required,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": [idErreur, idAide].filter(Boolean).join(" ") || undefined,
          })
        : children}

      {hint && !error && (
        <p id={idAide} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={idErreur} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
