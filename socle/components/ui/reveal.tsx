"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Apparition au défilement — surfaces marketing uniquement.
   Ne fais jamais ça sur une interface fonctionnelle visitée tous les jours.

   Le dévoilement se joue **une seule fois**. Le rejouer à chaque passage est
   une interface qui se bat avec son lecteur.

   Deux modes : `fondu` (monte et apparaît) et `masque` (se dévoile de haut en
   bas, comme derrière un volet). Les valeurs — durée, distance, courbe —
   viennent de `lib/mouvement.ts`, jamais d'ici.

   L'élément est masqué par la feuille de style tant que JavaScript n'a pas
   pris la main (`html.js [data-mouvement]`), pour qu'il n'apparaisse pas puis
   ne disparaisse pas avant de réapparaître. Sans JavaScript, il est visible.

   Rend toujours un `div`. Pour un `li`, enveloppe : `<li><Reveal>…</Reveal></li>`.
--------------------------------------------------------------------------- */

export type RevealProps = React.ComponentProps<"div"> & {
  /** Décalage en secondes, pour échelonner des frères. 0,05 à 0,15 suffisent. */
  delai?: number;
  mode?: "fondu" | "masque";
  /** Déplacement en pixels, mode `fondu` seulement. */
  distance?: number;
};

export function Reveal({
  children,
  delai = 0,
  mode = "fondu",
  distance = MOUVEMENT.distance,
  className,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      const depart =
        mode === "masque"
          ? { autoAlpha: 1, clipPath: "inset(0 0 100% 0)" }
          : { autoAlpha: 0, y: distance };
      const arrivee =
        mode === "masque" ? { clipPath: "inset(0 0 0% 0)" } : { autoAlpha: 1, y: 0 };

      gsap.fromTo(el, depart, {
        ...arrivee,
        duration: MOUVEMENT.duree,
        delay: delai,
        ease: MOUVEMENT.ease,
        scrollTrigger: { trigger: el, start: MOUVEMENT.declencheur, once: true },
      });
    }, ref);

    return () => ctx.revert();
  }, [mode, delai, distance]);

  return (
    <div ref={ref} data-mouvement="reveal" className={cn(className)} {...props}>
      {children}
    </div>
  );
}
