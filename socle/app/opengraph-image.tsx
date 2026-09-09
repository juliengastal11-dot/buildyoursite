import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/* L'image qui apparaît quand un lien du site est partagé : messagerie, réseaux,
   moteur. Générée à la demande, aux couleurs de lib/site.ts : pas de fichier à
   dessiner, et elle suit le nom du site.

   Une page peut avoir la sienne en posant son propre opengraph-image.tsx dans
   son dossier : une fiche produit avec sa photo, par exemple. */

export const alt = SITE.nom;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImageDePartage() {
  const { fond, texte, accent } = SITE.partage;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background: fond,
          color: texte,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ width: 96, height: 10, background: accent, marginBottom: 36 }} />
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{SITE.nom}</div>
        <div style={{ fontSize: 30, marginTop: 24, opacity: 0.8, maxWidth: 960 }}>{SITE.description}</div>
      </div>
    ),
    size,
  );
}
