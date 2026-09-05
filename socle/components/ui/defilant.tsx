"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Bandeau défilant : une rangée qui glisse en boucle, sans couture.

   Pour des mots-clés, des logos de partenaires, des noms d'origines. Jamais
   pour du texte qu'on doit lire en entier : on ne lit pas ce qui bouge.

   Le contenu est dupliqué — la copie est cachée aux lecteurs d'écran — et la
   piste se déplace d'exactement une copie, puis recommence : l'œil ne voit
   jamais le raccord. L'espace entre les éléments est porté par chaque moitié,
   pas par la piste, sinon le raccord tomberait à côté d'un demi-espace.

   S'arrête au survol, pour qu'on puisse lire ou cliquer. Immobile si
   l'utilisateur a demandé moins d'animations.
--------------------------------------------------------------------------- */

export type DefilantProps = React.ComponentProps<"div"> & {
  /** Pixels par seconde. */
  vitesse?: number;
  direction?: "gauche" | "droite";
  /** Espace entre deux éléments, en pixels. */
  ecart?: number;
  pauseAuSurvol?: boolean;
};

export function Defilant({
  children,
  vitesse = MOUVEMENT.defilant,
  direction = "gauche",
  ecart = MOUVEMENT.defilantEcart,
  pauseAuSurvol = true,
  className,
  ...props
}: DefilantProps) {
  const cadre = useRef<HTMLDivElement>(null);
  const piste = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cadreEl = cadre.current;
    const pisteEl = piste.current;
    if (!cadreEl || !pisteEl || mouvementReduit()) return;

    let tween: gsap.core.Tween | undefined;

    const lancer = () => {
      tween?.kill();
      const uneCopie = pisteEl.scrollWidth / 2;
      if (!uneCopie) return;
      const de = direction === "gauche" ? 0 : -50;
      const vers = direction === "gauche" ? -50 : 0;
      tween = gsap.fromTo(
        pisteEl,
        { xPercent: de },
        { xPercent: vers, duration: uneCopie / vitesse, ease: "none", repeat: -1 },
      );
    };

    lancer();
    // La largeur change quand les polices arrivent ou que la fenêtre bouge.
    const observateur = new ResizeObserver(lancer);
    observateur.observe(pisteEl);

    const pause = () => tween?.pause();
    const reprise = () => tween?.play();
    if (pauseAuSurvol) {
      cadreEl.addEventListener("mouseenter", pause);
      cadreEl.addEventListener("mouseleave", reprise);
    }

    return () => {
      observateur.disconnect();
      tween?.kill();
      cadreEl.removeEventListener("mouseenter", pause);
      cadreEl.removeEventListener("mouseleave", reprise);
    };
  }, [vitesse, direction, pauseAuSurvol]);

  const moitie = { display: "flex", alignItems: "center", flexShrink: 0, columnGap: ecart, paddingRight: ecart };

  return (
    <div ref={cadre} className={cn("overflow-hidden", className)} {...props}>
      <div ref={piste} style={{ display: "flex", width: "max-content", willChange: "transform" }}>
        <div style={moitie}>{children}</div>
        <div style={moitie} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
