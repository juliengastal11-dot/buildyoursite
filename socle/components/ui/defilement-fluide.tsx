"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, mouvementReduit } from "@/lib/gsap";

/* ---------------------------------------------------------------------------
   Défilement fluide et inertiel.

   C'est ce qui donne l'impression que la page « glisse » plutôt qu'elle ne
   saute. Combiné aux apparitions et à la parallaxe, c'est ce qu'on prend pour
   de la profondeur.

   Attention, c'est le seul élément du socle qui **détourne une interaction
   native**. Sur une vitrine ou une boutique, c'est un parti pris assumé ; sur
   une application visitée tous les jours, retire ce composant du layout —
   rien d'autre n'en dépend.

   Lenis est piloté par l'horloge de GSAP, et prévient ScrollTrigger à chaque
   pas : sans ça, les apparitions au défilement se déclencheraient sur la
   position native, en avance ou en retard sur ce que l'œil voit.

   Désactivé si l'utilisateur a demandé moins d'animations : il retrouve alors
   le défilement natif, immédiat.
--------------------------------------------------------------------------- */

export function DefilementFluide() {
  useEffect(() => {
    if (mouvementReduit()) return;

    const lenis = new Lenis({
      // Un peu plus court que le défaut : au-delà, l'inertie devient flottante
      // et on a l'impression de patiner.
      duration: 1.05,
      smoothWheel: true,
      // Le tactile garde son défilement natif : le doigt a déjà sa propre
      // inertie, en ajouter une seconde donne une sensation de glissade.
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const pas = (temps: number) => lenis.raf(temps * 1000);
    gsap.ticker.add(pas);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(pas);
      lenis.destroy();
    };
  }, []);

  return null;
}
