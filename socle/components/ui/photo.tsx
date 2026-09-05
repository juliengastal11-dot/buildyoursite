import Image from "next/image";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Une photo d'emplacement.

   `data-photo-slot` est porté ICI, et nulle part ailleurs : c'est ce que
   l'overlay d'édition lit pour savoir quelle image on lui désigne. Un slot
   posé à la fois sur le parent et sur ce composant en créerait deux.

   Le dégradé de la charte reste DERRIÈRE l'image. Si le fichier manque —
   photo pas encore fournie, chemin faux — la mise en page ne s'effondre pas :
   elle retombe sur l'aplat d'origine, exactement comme avant.

   Remplacer une photo, c'est écraser le fichier dans `public/photos/`.
   Aucun code à toucher.

   Les photos posées par `photos-provisoires.mjs` sont barrées d'un bandeau et
   ne doivent pas partir en production — `verifier-projet.mjs` le rappelle
   tant qu'il en reste.
--------------------------------------------------------------------------- */

export type PhotoProps = {
  /** Identifiant de l'emplacement, lu par l'overlay d'édition. */
  slot: string;
  /** Chemin public, ex. `/photos/hero.jpg`. */
  src: string;
  /** Vide si la photo est décorative — c'est-à-dire si le texte voisin la dit déjà. */
  alt: string;
  /** Classes du dégradé de repli, sous l'image. */
  degrade?: string;
  className?: string;
  /** Classes posées sur l'image elle-même : zoom au survol, position du cadrage. */
  imageClassName?: string;
  /** Indication de largeur rendue, pour que Next serve la bonne taille. */
  sizes?: string;
  /** À réserver à l'image visible au chargement, en haut de page. */
  priority?: boolean;
};

export function Photo({
  slot,
  src,
  alt,
  degrade,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
}: PhotoProps) {
  return (
    <div data-photo-slot={slot} className={cn("relative overflow-hidden", className)}>
      {degrade && <div aria-hidden="true" className={cn("absolute inset-0", degrade)} />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
