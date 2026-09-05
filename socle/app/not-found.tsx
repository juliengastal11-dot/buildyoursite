import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/* Page 404 à la charte du site. Sans elle, un slug inexistant retombe sur la
   404 générique de Next — fond blanc, police système, aucun moyen de repartir. */

export default function Introuvable() {
  return (
    <main
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
        </div>
      </div>
    </main>
  );
}
