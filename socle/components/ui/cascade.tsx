"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Révélation en cascade : les enfants directs apparaissent l'un après l'autre.

   C'est LE mouvement d'une grille — cartes produits, engagements, témoignages.
   Une seule cascade par grille : chaque enfant dévoilé isolément par un
   `Reveal` demanderait un décalage calculé à la main, et personne ne le fait.

   `Cascade` EST le conteneur : donne-lui les classes de la grille
   (`grid gap-6 md:grid-cols-3`). L'envelopper autour d'une grille existante
   casserait la mise en page.

   Joué une fois, déclenché à l'entrée du conteneur dans le viewport.
--------------------------------------------------------------------------- */

export type CascadeProps = React.ComponentProps<"div"> & {
  /** Écart entre deux enfants, en secondes. */
  decalage?: number;
  /** Déplacement de chaque enfant, en pixels. */
  distance?: number;
};

export function Cascade({
  children,
  decalage = MOUVEMENT.decalage,
  distance = MOUVEMENT.distance,
  className,
  ...props
}: CascadeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enfants = Array.from(el.children);
    if (enfants.length === 0) return;

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        gsap.set(enfants, { autoAlpha: 1 });
        return;
      }
      gsap.from(enfants, {
        autoAlpha: 0,
        y: distance,
        duration: MOUVEMENT.duree,
        ease: MOUVEMENT.ease,
        stagger: decalage,
        // Sans quoi le transform en ligne laissé par GSAP l’emporterait sur
        // .carte-reactive:hover : une carte révélée ne se soulèverait plus.
        clearProps: "transform",
        scrollTrigger: { trigger: el, start: MOUVEMENT.declencheur, once: true },
      });
    }, ref);

    return () => ctx.revert();
  }, [decalage, distance]);

  return (
    <div ref={ref} data-mouvement="cascade" className={cn(className)} {...props}>
      {children}
    </div>
  );
}
