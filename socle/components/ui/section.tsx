import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Rythme vertical d'une section, décidé une fois.

   Sans ce composant, chaque agent choisit son propre `py-20` / `py-24` /
   `py-32`, et la page respire différemment d'une section à l'autre. Constaté
   sur le premier bootstrap réel.

   Gère aussi le lien titre ↔ section (`aria-labelledby`), que tout le monde
   oublie.
--------------------------------------------------------------------------- */

const FONDS = {
  background: "bg-background text-foreground",
  card: "bg-card text-card-foreground",
  muted: "bg-muted text-foreground",
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  transparent: "",
} as const;

export type SectionProps = {
  id?: string;
  /**
   * Chemin du fichier qui définit cette section, relatif à la racine du projet.
   * Exemple : `"components/sections/hero.tsx"`.
   *
   * Posé en `data-src`, il permet à l'overlay d'édition de savoir quel fichier
   * ouvrir quand on clique n'importe où dans la section — les descendants en
   * héritent. **À renseigner systématiquement** : c'est ce qui remplace une
   * recherche dans tout le projet par une recherche dans un seul fichier.
   */
  src?: string;
  /** Petit libellé en capitales au-dessus du titre. */
  eyebrow?: string;
  titre?: string;
  /** Paragraphe d'introduction sous le titre. */
  intro?: string;
  fond?: keyof typeof FONDS;
  /** Densité verticale. `serre` pour un bandeau, `large` pour une section clé. */
  rythme?: "serre" | "default" | "large";
  /** Largeur du contenu. */
  largeur?: "prose" | "default" | "pleine";
  className?: string;
  children?: React.ReactNode;
};

const RYTHMES = {
  serre: "py-10 md:py-14",
  default: "py-20 md:py-28",
  large: "py-24 md:py-36",
} as const;

const LARGEURS = {
  prose: "max-w-3xl",
  default: "max-w-6xl",
  pleine: "max-w-none",
} as const;

export function Section({
  id,
  src,
  eyebrow,
  titre,
  intro,
  fond = "background",
  rythme = "default",
  largeur = "default",
  className,
  children,
}: SectionProps) {
  const idTitre = id && titre ? `${id}-titre` : undefined;

  return (
    <section
      id={id}
      data-src={src}
      aria-labelledby={idTitre}
      className={cn(FONDS[fond], RYTHMES[rythme], id && "scroll-mt-20", className)}
    >
      <div className={cn("mx-auto px-6", LARGEURS[largeur])}>
        {(eyebrow || titre || intro) && (
          <header className="mb-12 md:mb-16">
            {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
            {titre && (
              <h2
                id={idTitre}
                className="mt-4 font-display text-3xl md:text-4xl lg:text-5xl"
              >
                {titre}
              </h2>
            )}
            {intro && <p className="mt-6 max-w-2xl text-lg opacity-80">{intro}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
