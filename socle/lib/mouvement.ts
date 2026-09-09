/* ---------------------------------------------------------------------------
   Réglages du mouvement : un fichier-contrat, comme le thème.

   Les primitives de `components/ui/` (Reveal, Cascade, Compteur, Defilant,
   EntreeHero, Parallaxe, Relief, Progression, Rotatif) portent la STRUCTURE
   d'un mouvement : ce qui bouge,
   dans quel ordre, déclenché par quoi. Elles ne portent aucune valeur. Les
   valeurs sont ici, et c'est ici (une seule fois, au bootstrap) qu'on les
   cale sur la direction de mouvement décidée pour ce site.

   Repères : une vitrine supporte des durées longues et des distances franches ;
   une boutique reste plus sobre ; une application n'anime presque rien.

   Toutes les durées sont en secondes, les distances en pixels.

   ⚠️ Ce fichier ne couvre que le mouvement d'ARRIVÉE : comment un élément entre
   en scène. Ce qui RÉPOND au curseur, au doigt et au clavier vit dans
   `app/globals.css`, sous « LES ÉTATS » : c'est du CSS, pas du JavaScript, et
   ça n'a donc pas besoin de valeurs partagées. Les deux moitiés se décident
   ensemble au blueprint, et se vérifient ensemble à la fin.
--------------------------------------------------------------------------- */

export const MOUVEMENT = {
  /** Durée d'une apparition. 0,6 = vif, 1,2 = ample. */
  duree: 0.9,
  /** Déplacement vertical d'une apparition, en pixels. */
  distance: 28,
  /** Écart entre deux frères d'une cascade. Au-delà de 0,15, on attend. */
  decalage: 0.08,
  /** Courbe. `power3.out` freine en fin de course : naturel, jamais élastique. */
  ease: "power3.out",
  /** Position de l'élément dans le viewport qui déclenche son apparition. */
  declencheur: "top 85%",

  hero: {
    /** Respiration avant que le héros n'entre, le temps que la page se pose. */
    delai: 0.15,
    /** Écart entre l'eyebrow, le titre, le texte, les boutons. */
    decalage: 0.12,
  },

  /** Débord de la parallaxe, en fraction de la hauteur du cadre. 0,12 = discret. */
  parallaxe: 0.12,

  /** Vitesse du bandeau défilant, en pixels par seconde. */
  defilant: 60,
  /** Espace entre deux éléments du bandeau, en pixels. */
  defilantEcart: 32,

  /** Durée du comptage d'un chiffre. */
  compteur: 1.6,

  /* --- Ce qui répond au curseur ou au défilement, plutôt qu'à l'arrivée --- */

  relief: {
    /** Inclinaison maximale d'une carte sous le curseur, en degrés. Au-delà de 8,
        la carte cesse d'être une surface et le texte se déforme. */
    inclinaison: 6,
    /** Agrandissement au survol. 1,02 se sent sans se voir. */
    echelle: 1.02,
    /** Temps de rattrapage du curseur. Court, sinon la carte traîne. */
    duree: 0.4,
  },

  /** Épaisseur de la barre de progression de lecture, en pixels. */
  progression: { epaisseur: 3 },

  rotatif: {
    /** Temps d'affichage d'un mot. Moins de 2 s, on n'a pas fini de lire. */
    pause: 2.2,
    /** Durée de la bascule d'un mot au suivant. */
    duree: 0.45,
  },
} as const;
