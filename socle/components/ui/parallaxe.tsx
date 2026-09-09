"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Parallaxe : l'image glisse un peu moins vite que la page.

   Volontairement à la limite du perceptible : au-delà, ça attire l'œil au
   lieu de donner de la profondeur. Sur une ou deux photos par page, pas plus.

   L'enfant est agrandi et décalé pour que le glissement ne découvre jamais
   les bords du cadre : avec un débord `i`, la couche fait `1 + i` fois la
   hauteur du cadre, et se déplace d'au plus `i / 2` de cette hauteur. Le
   `yPercent` étant relatif à la couche, la borne vaut `50·i / (1 + i)`.

   Le cadre porte lui-même `overflow-hidden` et `relative` : sans eux, la
   couche déborderait ou se positionnerait n'importe où : une panne
   silencieuse, constatée quand ces classes étaient laissées à l'appelant.
--------------------------------------------------------------------------- */

export type ParallaxeProps = React.ComponentProps<"div"> & {
  /** Débord, en fraction de la hauteur du cadre. 0,12 = discret, 0,25 = marqué. */
  intensite?: number;
  /** Contenu posé PAR-DESSUS la photo et qui ne bouge pas : badge, légende. */
  surcouche?: React.ReactNode;
};

export function Parallaxe({
  children,
  intensite = MOUVEMENT.parallaxe,
  surcouche,
  className,
  ...props
}: ParallaxeProps) {
  const cadre = useRef<HTMLDivElement>(null);
  const couche = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cadreEl = cadre.current;
    const coucheEl = couche.current;
    if (!cadreEl || !coucheEl || mouvementReduit()) return;

    const ctx = gsap.context(() => {
      const borne = (50 * intensite) / (1 + intensite);
      gsap.fromTo(
        coucheEl,
        { yPercent: -borne },
        {
          yPercent: borne,
          ease: "none",
          scrollTrigger: { trigger: cadreEl, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    }, cadre);

    return () => ctx.revert();
  }, [intensite]);

  return (
    <div ref={cadre} className={cn("relative overflow-hidden", className)} {...props}>
      <div
        ref={couche}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `${-intensite * 50}%`, height: `${100 + intensite * 100}%` }}
      >
        {children}
      </div>
      {surcouche}
    </div>
  );
}
