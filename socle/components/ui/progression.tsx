"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Barre de progression de lecture, en haut de la fenêtre.

   Utile sur un texte long : un article, une page légale, une documentation.
   **Inutile et bruyante sur une page d'accueil de trois écrans** : elle promet
   une longueur que la page n'a pas.

   La barre se remplit par `scaleX`, jamais par `width`. Une largeur animée
   force le navigateur à recalculer la mise en page à chaque image ; une échelle
   reste dans la composition.

   `scrub: true` colle la barre au défilement au lieu de la faire courir après :
   le doigt remonte, la barre remonte.

   Mouvement réduit : la barre reste, elle ne s'anime simplement plus au
   défilement fluide. C'est une information de position, pas une décoration :
   la supprimer priverait le lecteur d'un repère.
--------------------------------------------------------------------------- */

export type ProgressionProps = React.ComponentProps<"div"> & {
  /** Épaisseur en pixels. Au-delà de 5, ce n'est plus un repère mais un bandeau. */
  epaisseur?: number;
  /** Sélecteur de la zone lue. Par défaut, la page entière. */
  cible?: string;
};

export function Progression({
  epaisseur = MOUVEMENT.progression.epaisseur,
  cible,
  className,
  ...props
}: ProgressionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const zone = cible ? document.querySelector<HTMLElement>(cible) : null;
      if (cible && !zone) return;

      gsap.set(el, { scaleX: 0, transformOrigin: "left center" });

      /* Sans zone désignée, on mesure le défilement de la page entière plutôt
         que la traversée d'un élément. `maxScroll` ne dépend d'aucune hauteur
         portée par un élément, donc d'aucune feuille de style : c'est la
         formulation qui a le moins de façons d'être fausse. Vérifié sur le
         socle avec Lenis actif : plage 0 à 2300, progression 0,5 à mi-course. */
      const bornes = zone
        ? { trigger: zone, start: "top top", end: "bottom bottom" }
        : { start: 0, end: () => ScrollTrigger.maxScroll(window), invalidateOnRefresh: true };

      gsap.to(el, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          ...bornes,
          // Sans défilement fluide, on saute d'une position à l'autre : la
          // barre reste juste, elle cesse seulement de glisser.
          scrub: mouvementReduit() ? true : 0.3,
        },
      });
      ScrollTrigger.refresh();
    }, ref);

    return () => ctx.revert();
  }, [cible]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-x-0 top-0 z-50", className)}
      style={{ height: epaisseur }}
      {...props}
    >
      <div ref={ref} className="h-full w-full bg-primary" />
    </div>
  );
}
