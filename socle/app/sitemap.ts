import type { MetadataRoute } from "next";
import { SITE, urlAbsolue } from "@/lib/site";

/* Servi sur /sitemap.xml. Les pages fixes viennent de lib/site.ts ; les pages
   lues en base — fiches produit, articles — s'ajoutent ici au bootstrap :

     const produits = await db.produit.findMany({ where: { actif: true } });
     entrees.push(...produits.map((p) => ({ url: urlAbsolue(`/cafes/${p.slug}`) })));

   Une page qui n'est pas dans le sitemap existe quand même ; elle est juste
   plus lente à être découverte. Une page privée n'y va jamais. */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const maintenant = new Date();
  const entrees: MetadataRoute.Sitemap = SITE.pages.map((chemin) => ({
    url: urlAbsolue(chemin),
    lastModified: maintenant,
    changeFrequency: chemin === "/" ? "weekly" : "monthly",
    priority: chemin === "/" ? 1 : 0.7,
  }));
  return entrees;
}
