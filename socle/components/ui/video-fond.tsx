import { cn } from "@/lib/utils";
import { Photo } from "@/components/ui/photo";

/* ---------------------------------------------------------------------------
   Une vidéo en fond de section — le héros, presque toujours.

   Deux ou trois secondes de mouvement sur une vraie photo du client valent
   mieux qu'une image inventée : on voit son lieu, et ça vit. Mais une vidéo
   posée à la va-vite casse tout ce qu'une photo garantissait. D'où ce
   composant, qui ne laisse aucune de ces garanties au hasard :

   - **L'affiche est la photo d'origine**, rendue par `Photo` sous la vidéo.
     Sans JavaScript, avant le chargement, ou si le fichier manque, on voit la
     photo — jamais un rectangle noir. `poster` la reprend pour le premier
     cadre.
   - **`autoPlay muted loop playsInline`**, les quatre ensemble : sans `muted`
     ou sans `playsInline`, le téléphone n'y touche pas. `preload="metadata"`
     pour ne pas tirer deux mégaoctets avant le premier écran.
   - **Mouvement réduit : la vidéo disparaît, la photo reste.** C'est du CSS
     (`motion-reduce:hidden`), pas une condition JavaScript : ça tient même si
     l'hydratation tarde. Pas de `data-mouvement` non plus — la photo doit
     être visible avant que le mouvement ne prenne la main.
   - **Un voile** au-dessus, dans un jeton du thème, pour que le texte se lise
     quel que soit le plan qui passe.

   Ce composant est un Server Component : rien à hydrater, rien qui dépende du
   navigateur. La vidéo se lance toute seule, ou pas — la photo est là.

   Une seule par page. Une deuxième transforme la page en écran de veille.
--------------------------------------------------------------------------- */

export type VideoFondProps = React.ComponentProps<"section"> & {
  /** Le fichier vidéo, transcodé : 720p, sans audio, moins de 3 Mo. */
  src: string;
  /** La photo d'origine : affiche, repli sans JavaScript, et image en mouvement réduit. */
  affiche: string;
  /** Décrit la scène, pour qui ne la voit pas. */
  alt: string;
  /** Emplacement lu par l'overlay d'édition — c'est par lui qu'on remplace la photo au clic. */
  slot?: string;
  /** Opacité du voile, 0 à 100. 50 laisse lire un titre blanc sur presque tout. */
  voile?: number;
};

export function VideoFond({
  src,
  affiche,
  alt,
  slot = "hero",
  voile = 50,
  className,
  children,
  ...props
}: VideoFondProps) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)} {...props}>
      {/* La photo d'abord : c'est elle qu'on voit tant que la vidéo n'est pas là.
          `Photo` remplit sa boîte toute seule ; on lui donne la boîte. */}
      <Photo slot={slot} src={affiche} alt={alt} className="absolute inset-0 -z-20" />
      <video
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden"
        src={src}
        poster={affiche}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-primary" style={{ opacity: voile / 100 }} />
      {children}
    </section>
  );
}
