import { EntreeHero } from "@/components/ui/entree-hero";
import { Cascade } from "@/components/ui/cascade";
import { Reveal } from "@/components/ui/reveal";
import { Compteur } from "@/components/ui/compteur";
import { Defilant } from "@/components/ui/defilant";
import { Parallaxe } from "@/components/ui/parallaxe";
import { Section } from "@/components/ui/section";

/* ---------------------------------------------------------------------------
   Page d'attente du socle — remplacée au bootstrap par les vraies pages.

   Elle montre les six primitives de mouvement en situation, pour deux
   raisons : vérifier d'un coup d'œil que le socle bouge après un clone, et
   donner aux agents un exemple d'emploi de chacune. Aucune valeur ici n'est
   une recommandation de design ; seul le mécanisme compte.
--------------------------------------------------------------------------- */

const MOTS = ["Révélation", "Cascade", "Compteur", "Bandeau", "Parallaxe", "Entrée du héros"];

const CARTES = [
  { titre: "Cascade", texte: "Les enfants d'une grille apparaissent l'un après l'autre." },
  { titre: "Reveal", texte: "Un bloc seul, en fondu ou derrière un masque." },
  { titre: "Parallaxe", texte: "Une image qui glisse un peu moins vite que la page." },
];

export default function Home() {
  return (
    <main>
      <section
        data-src="app/page.tsx"
        className="flex min-h-[70dvh] items-end bg-primary px-6 pb-16 pt-32 text-on-primary"
      >
        <EntreeHero className="mx-auto w-full max-w-4xl">
          <p className="text-sm uppercase tracking-widest opacity-70">Socle prêt</p>
          <h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl md:text-7xl">
            Le site n&apos;est pas encore généré.
          </h1>
          <p className="mt-6 max-w-prose text-lg opacity-80">
            Cette page est le placeholder du socle. Elle sera remplacée par les pages réelles
            pendant le bootstrap — en attendant, elle montre ce que le mouvement sait faire.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-card bg-accent px-5 py-2.5 text-on-accent">Entrée du héros</span>
            <span className="rounded-card border border-on-primary/30 px-5 py-2.5">Quatre enfants, en cascade</span>
          </div>
        </EntreeHero>
      </section>

      <Defilant className="border-y border-border py-4" aria-label="Les primitives de mouvement">
        {MOTS.map((m) => (
          <span key={m} className="text-sm uppercase tracking-widest text-muted-foreground">
            {m}
          </span>
        ))}
      </Defilant>

      <Section src="app/page.tsx" eyebrow="Cascade" titre="Une grille qui se dévoile">
        <Cascade className="mt-10 grid gap-6 md:grid-cols-3">
          {CARTES.map((c) => (
            <div key={c.titre} className="rounded-card border border-border bg-card p-6 text-card-foreground">
              <h3 className="font-display text-xl">{c.titre}</h3>
              <p className="mt-2 text-muted-foreground">{c.texte}</p>
            </div>
          ))}
        </Cascade>
      </Section>

      <Section src="app/page.tsx" fond="muted" eyebrow="Compteur" titre="Des chiffres qui montent">
        <Cascade className="mt-10 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-5xl"><Compteur valeur={12} suffixe=" ans" /></p>
            <p className="mt-1 text-muted-foreground">d&apos;existence</p>
          </div>
          <div>
            <p className="font-display text-5xl"><Compteur valeur={3400} /></p>
            <p className="mt-1 text-muted-foreground">clients servis</p>
          </div>
          <div>
            <p className="font-display text-5xl"><Compteur valeur={98.5} decimales={1} suffixe=" %" /></p>
            <p className="mt-1 text-muted-foreground">de satisfaction</p>
          </div>
        </Cascade>
      </Section>

      <Section src="app/page.tsx" eyebrow="Parallaxe" titre="Une image en profondeur">
        <Parallaxe className="mt-10 aspect-[16/7] rounded-card">
          <div className="h-full w-full bg-linear-to-br from-secondary via-muted to-accent" />
        </Parallaxe>
        <Reveal mode="masque" className="mt-10 max-w-prose">
          <p className="text-lg text-muted-foreground">
            Et ce paragraphe se dévoile derrière un masque, de haut en bas — le second mode de
            <code className="mx-1 rounded-card bg-muted px-1.5 py-0.5 text-sm">Reveal</code>.
            Une fois, jamais deux.
          </p>
        </Reveal>
      </Section>
    </main>
  );
}
