import Link from "next/link";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Les liens légaux, à poser dans le pied de page de TOUTES les pages.

   C'est là qu'on les cherche, donc c'est là qu'ils doivent être. Une page
   légale existante mais introuvable ne remplit pas l'obligation.

   `cgv` : ne passer `true` que si le site vend en ligne.
--------------------------------------------------------------------------- */

export function LiensLegaux({
  cgv = false,
  className,
}: {
  cgv?: boolean;
  className?: string;
}) {
  const liens = [
    { href: "/mentions-legales", libelle: "Mentions légales" },
    { href: "/confidentialite", libelle: "Confidentialité" },
    ...(cgv ? [{ href: "/cgv", libelle: "CGV" }] : []),
  ];

  return (
    <nav
      aria-label="Informations légales"
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-xs", className)}
    >
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="cursor-pointer opacity-70 transition-opacity hover:opacity-100 hover:underline"
        >
          {l.libelle}
        </Link>
      ))}
    </nav>
  );
}
