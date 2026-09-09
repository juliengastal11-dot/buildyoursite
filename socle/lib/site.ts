/* ---------------------------------------------------------------------------
   Identité du site pour tout ce qui sort du HTML : titres et descriptions,
   image de partage, robots.txt, sitemap, URL canoniques.

   Fichier-contrat, réglé une fois au bootstrap, comme le thème et le
   mouvement. Tout ce que les moteurs de recherche et les réseaux sociaux
   voient du site part d'ici ; un nom changé ici change partout.

   L'URL publique vient de l'environnement : en développement, localhost ;
   en production, `NEXT_PUBLIC_SITE_URL` dans `.env`, à confirmer par
   l'utilisateur au moment de la mise en ligne.
--------------------------------------------------------------------------- */

export const SITE = {
  nom: "Nouveau site",
  /** Une phrase, 150 caractères au plus : c'est celle que Google affiche. */
  description: "Site généré par /buildyoursite. Remplacer cette description au bootstrap.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "fr_FR",

  /** Pages publiques listées dans le sitemap. Les fiches lues en base s'ajoutent dans `app/sitemap.ts`. */
  pages: ["/"] as readonly string[],

  /** Chemins tenus hors des moteurs : back-office, API, espace client, tunnel, outils de dev. */
  prives: ["/admin", "/api/", "/compte", "/connexion", "/panier", "/commande", "/blueprint"] as readonly string[],

  /**
   * Couleurs de l'image de partage. Pas des tokens Tailwind : cette image est
   * rendue hors CSS, en PNG. À caler sur la palette du projet au bootstrap.
   */
  partage: { fond: "#1f1e1d", texte: "#f4f3ee", accent: "#d97757" },
};

/** Adresse absolue d'un chemin du site, pour les canoniques et le sitemap. */
export function urlAbsolue(chemin = "/"): string {
  return new URL(chemin, SITE.url).toString();
}
