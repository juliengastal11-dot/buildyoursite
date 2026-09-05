"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Entrée du héros : ses enfants directs entrent en scène l'un après l'autre,
   au chargement de la page — pas au défilement.

   Une seule par page, sur le bloc de texte du héros : eyebrow, titre,
   paragraphe, boutons. Pas sur la photo de fond, qui doit être là d'emblée.

   Enveloppe le bloc qui contient DIRECTEMENT ces éléments. Un conteneur
   intermédiaire ferait entrer un seul enfant : le conteneur.
--------------------------------------------------------------------------- */

export type EntreeHeroProps = React.ComponentProps<"div"> & {
  /** Écart entre deux enfants, en secondes. */
  decalage?: number;
  /** Respiration avant l'entrée, en secondes. */
  delai?: number;
};

export function EntreeHero({
  children,
  decalage = MOUVEMENT.hero.decalage,
  delai = MOUVEMENT.hero.delai,
  className,
  ...props
}: EntreeHeroProps) {
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
        y: MOUVEMENT.distance * 0.8,
        duration: MOUVEMENT.duree,
        ease: MOUVEMENT.ease,
        stagger: decalage,
        delay: delai,
      });
    }, ref);

    return () => ctx.revert();
  }, [decalage, delai]);

  return (
    <div ref={ref} data-mouvement="hero" className={cn(className)} {...props}>
      {children}
    </div>
  );
}
