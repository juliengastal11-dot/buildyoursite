import type { MetadataRoute } from "next";
import { SITE, urlAbsolue } from "@/lib/site";

/* Servi sur /robots.txt. Tout est autorisé sauf ce qui n'a rien à faire dans
   un moteur : le back-office, l'API, l'espace client, le tunnel de commande.
   La liste vit dans lib/site.ts, avec le reste de l'identité. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...SITE.prives] }],
    sitemap: urlAbsolue("/sitemap.xml"),
  };
}
