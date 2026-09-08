"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Une carte qui répond au curseur — inclinaison légère et tache de lumière.

   C'est une micro-interaction, pas une entrée en scène : la carte est visible
   sans JavaScript et **ne porte pas `data-mouvement`**, sinon la feuille de
   style la masquerait avant l'hydratation et un visiteur sans JavaScript ne la
   verrait jamais.

   Trois garde-fous, tous nécessaires :

   - **Pointeur fin obligatoire.** Sur un écran tactile, il n'y a pas de survol :
     le navigateur émule un `mouseenter` au premier appui et la carte reste
     inclinée après le doigt. On ne s'active donc que sur `(hover: hover) and
     (pointer: fine)`.
   - **Le suivi passe par `quickTo`.** Une écriture directe à chaque
     `pointermove` déclenche un recalcul par événement ; `quickTo` interpole et
     laisse GSAP écrire une fois par image.
   - **Retour au repos au départ du curseur.** Sans ça, la carte garde la
     dernière inclinaison, ce qui se voit immédiatement dans une grille.

   L'inclinaison reste sous les dix degrés. Au-delà, la carte cesse d'être une
   surface et devient un objet, et le texte se déforme à la lecture.
--------------------------------------------------------------------------- */

export type ReliefProps = React.ComponentProps<"div"> & {
  /** Inclinaison maximale en degrés, aux coins. */
  inclinaison?: number;
  /** Tache de lumière qui suit le curseur. Coupe-la sur un fond déjà chargé. */
  lumiere?: boolean;
};

export function Relief({
  children,
  inclinaison = MOUVEMENT.relief.inclinaison,
  lumiere = true,
  className,
  ...props
}: ReliefProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tacheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (mouvementReduit()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const ctx = gsap.context(() => {
      const reglage = { duration: MOUVEMENT.relief.duree, ease: "power2.out" };
      const versX = gsap.quickTo(el, "rotationY", reglage);
      const versY = gsap.quickTo(el, "rotationX", reglage);
      const versEchelle = gsap.quickTo(el, "scale", reglage);
      const tache = tacheRef.current;
      const versOpacite = tache ? gsap.quickTo(tache, "opacity", reglage) : null;

      gsap.set(el, { transformPerspective: 900, transformOrigin: "center" });

      const bouger = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        // -0,5 à 0,5 depuis le centre : l'inclinaison est nulle au milieu.
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        versX(x * inclinaison * 2);
        versY(-y * inclinaison * 2);
        versEchelle(MOUVEMENT.relief.echelle);
        if (tache) {
          tache.style.setProperty("--x", `${(x + 0.5) * 100}%`);
          tache.style.setProperty("--y", `${(y + 0.5) * 100}%`);
          versOpacite?.(1);
        }
      };

      const partir = () => {
        versX(0);
        versY(0);
        versEchelle(1);
        versOpacite?.(0);
      };

      el.addEventListener("pointermove", bouger);
      el.addEventListener("pointerleave", partir);
      return () => {
        el.removeEventListener("pointermove", bouger);
        el.removeEventListener("pointerleave", partir);
      };
    }, ref);

    return () => ctx.revert();
  }, [inclinaison]);

  return (
    <div ref={ref} className={cn("relative will-change-transform", className)} {...props}>
      {children}
      {lumiere && (
        <div
          ref={tacheRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
          style={{
            background:
              "radial-gradient(circle at var(--x, 50%) var(--y, 50%), color-mix(in oklab, var(--color-foreground) 12%, transparent), transparent 60%)",
          }}
        />
      )}
    </div>
  );
}
