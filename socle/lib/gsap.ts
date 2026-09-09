import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ---------------------------------------------------------------------------
   Point d'entrée unique de GSAP.

   Le plugin ScrollTrigger doit être enregistré une fois, côté navigateur, avant
   le premier usage. Tous les composants de mouvement importent GSAP d'ici : pas
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

/* En développement seulement : GSAP exposé sur window pour que le panneau
   navigateur puisse avancer l'horloge à la main (`__gsap.ticker.tick()`, puis
   `__gsap.updateRoot(t)`) quand il est masqué et ne reçoit plus
   requestAnimationFrame. Sans ça, aucune animation ne peut être vérifiée
   depuis un panneau caché : l'horloge reste à zéro et tout diagnostic est
   nul. Absent du paquet de production. */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
}
