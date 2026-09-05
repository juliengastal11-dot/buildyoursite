"use client";

import { useEffect, useRef } from "react";
import { gsap, mouvementReduit } from "@/lib/gsap";
import { MOUVEMENT } from "@/lib/mouvement";

/* ---------------------------------------------------------------------------
   Compteur : un chiffre qui monte jusqu'à sa valeur quand il entre à l'écran.

   Seulement sur un chiffre VRAI et significatif — années d'existence, clients,
   cafés torréfiés. Un compteur sur « 3 étapes » ou sur un prix est un gadget
   qui attire l'œil sur rien.

   Rendu côté serveur avec la valeur finale : sans JavaScript, ou pour un
   lecteur d'écran, le chiffre est là. Le comptage part de zéro une fois la
   page hydratée, et ne se joue qu'une fois.
--------------------------------------------------------------------------- */

export type CompteurProps = {
  valeur: number;
  /** Durée du comptage, en secondes. */
  duree?: number;
  decimales?: number;
  prefixe?: string;
  suffixe?: string;
  /** Locale du formatage — séparateur de milliers, virgule décimale. */
  locale?: string;
  className?: string;
};

export function Compteur({
  valeur,
  duree = MOUVEMENT.compteur,
  decimales = 0,
  prefixe = "",
  suffixe = "",
  locale = "fr-FR",
  className,
}: CompteurProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const format = (n: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(n);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (mouvementReduit()) {
        el.textContent = format(valeur);
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      const etat = { v: 0 };
      el.textContent = format(0);
      gsap.set(el, { autoAlpha: 1 });
      gsap.to(etat, {
        v: valeur,
        duration: duree,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(etat.v);
        },
        scrollTrigger: { trigger: el, start: MOUVEMENT.declencheur, once: true },
      });
    });

    return () => ctx.revert();
    // `format` dépend uniquement de `locale` et `decimales`, déjà listés.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur, duree, decimales, locale]);

  return (
    <span className={className}>
      {prefixe}
      <span ref={ref} data-mouvement="compteur">
        {format(valeur)}
      </span>
      {suffixe}
    </span>
  );
}
