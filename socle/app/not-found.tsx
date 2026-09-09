import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------------------------------------
   Page 404 à la charte du site. Sans elle, un slug inexistant retombe sur la
   404 générique de Next : fond blanc, police système, aucun moyen de repartir.

   ⚠️ À HABILLER AU BOOTSTRAP, comme les pages du module legal.

   Telle quelle, cette page n'a ni en-tête ni pied de page : le socle ne peut
   pas importer `Nav` et `PiedDePage`, qui n'existent pas encore quand il est
   copié. C'est donc au bootstrap de le faire, au même moment que les pages
   légales, et pas plus tard.

   Vécu : livrée nue, elle a été classée deuxième défaut du site par un
   relecteur. Un visiteur arrivé par un lien cassé ou un QR code mal recopié se
   retrouvait dans une impasse à un seul bouton, sur un site qui mise
   justement sur des QR codes imprimés. `verifier-projet.mjs` compte
   maintenant cette page parmi celles qui doivent rendre la navigation.

   Une fois habillée :

     export default async function Introuvable() {
       return (
         <>
           <Nav />
           <main id="contenu" data-src="app/not-found.tsx" …>…</main>
           <PiedDePage />
         </>
       );
     }

   et le `min-h-dvh` ci-dessous devient `min-h-[60dvh]`, sinon la page pousse
   le pied de page hors de l'écran.
--------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function Introuvable() {
  return (
    <main
      id="contenu"
      data-src="app/not-found.tsx"
      className="grid min-h-dvh place-items-center bg-background px-6 py-24"
    >
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>

        <p className="eyebrow text-accent">Page introuvable</p>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl">
          Cette page n&apos;existe pas.
        </h1>

        <p className="text-lg text-muted-foreground">
          Elle a été déplacée, ou n&apos;a jamais existé. Reprenons depuis le début.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="accent" shape="pill" size="lg">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild variant="outline" shape="pill" size="lg">
            <Link href="/contact">Nous écrire</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
