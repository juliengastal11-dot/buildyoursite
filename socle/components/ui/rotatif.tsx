"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Un mot qui change, dans une phrase qui ne se réorganise pas.

   « Un site pour votre **restaurant** / **cabinet dentaire** / **atelier**. »
   Une seule accroche qui en dit trois, sans allonger la page.

   Trois pièges, réglés par la structure plutôt que par du calcul :

   - **La phrase qui saute.** Les mots sont empilés dans une même cellule de
     grille : ils ne se poussent jamais. La largeur du bloc, elle, est animée
     vers celle du mot affiché : sinon la grille se cale sur le plus long et la
     ponctuation qui suit reste échouée à droite. Vu à l'écran, corrigé.
   - **Le mot sortant qui déborde.** Il glisse vers le haut en s'effaçant ;
     sans `overflow-hidden`, on le voit passer au-dessus de la ligne.
   - **Le lecteur d'écran qui lit tout.** Seul le premier mot est annoncé. Les
     autres sont `aria-hidden`, et l'ensemble est `aria-live="off"` : une
     accroche décorative n'interrompt pas une lecture en cours.

   **Sans JavaScript, et en mouvement réduit, seul le premier mot existe** :
   l'attribut `hidden` retire les autres de la mise en page, donc pas de blanc
   réservé, pas de saut. Le texte est juste dans tous les cas.
--------------------------------------------------------------------------- */

export type RotatifProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Les mots, dans l'ordre. Le premier est celui du rendu serveur. */
  mots: string[];
  /** Temps d'affichage d'un mot, en secondes. */
  pause?: number;
};

export function Rotatif({ mots, pause = MOUVEMENT.rotatif.pause, className, ...props }: RotatifProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mots.length < 2 || mouvementReduit()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-mot]", el);
      if (items.length < 2) return;

      // Les mots sont retirés de la mise en page tant que JavaScript n'a pas
      // pris la main. On les rend au flux avant toute mesure.
      items.forEach((m) => m.removeAttribute("hidden"));
      const largeurs = items.map((m) => m.getBoundingClientRect().width);

      gsap.set(items, { autoAlpha: 0, y: "0.35em" });
      gsap.set(items[0], { autoAlpha: 1, y: 0 });
      gsap.set(el, { width: largeurs[0] });

      const fil = gsap.timeline({ repeat: -1 });
      const duree = MOUVEMENT.rotatif.duree;

      items.forEach((_, i) => {
        const j = (i + 1) % items.length;
        fil
          .to(items[i], { autoAlpha: 0, y: "-0.35em", duration: duree, ease: "power2.in" }, `+=${pause}`)
          .fromTo(
            items[j],
            { autoAlpha: 0, y: "0.35em" },
            { autoAlpha: 1, y: 0, duration: duree, ease: "power2.out" },
            "<",
          )
          .to(el, { width: largeurs[j], duration: duree, ease: MOUVEMENT.ease }, "<");
      });
    }, ref);

    return () => ctx.revert();
  }, [mots, pause]);

  return (
    <span
      ref={ref}
      aria-live="off"
      // `align-bottom` garde la ligne de base stable malgré `overflow-hidden`.
      className={cn("inline-grid overflow-hidden align-bottom", className)}
      {...props}
    >
      {mots.map((mot, i) => (
        <span
          key={mot}
          data-mot
          hidden={i > 0 || undefined}
          aria-hidden={i > 0 || undefined}
          // Même cellule pour tous : ils s'empilent au lieu de se pousser.
          // `justify-self-start` est indispensable : sans lui, un élément de
          // grille s'étire à la largeur de sa cellule et chaque mot mesurerait
          // la largeur du plus long. L'animation de largeur serait alors nulle,
          // et la ponctuation resterait échouée à droite.
          className="col-start-1 row-start-1 justify-self-start whitespace-nowrap"
        >
          {mot}
        </span>
      ))}
    </span>
  );
}
