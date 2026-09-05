import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ---------------------------------------------------------------------------
   Point d'entrée unique de GSAP.

   Le plugin ScrollTrigger doit être enregistré une fois, côté navigateur, avant
   le premier usage. Tous les composants de mouvement importent GSAP d'ici — pas
   de `gsap` nu ailleurs, sinon l'enregistrement se retrouve dupliqué ou oublié.

   Importable depuis un Server Component sans casser le rendu : l'enregistrement
   est gardé derrière `window`.
--------------------------------------------------------------------------- */

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** L'utilisateur a demandé moins d'animations : on affiche sans animer. */
export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
