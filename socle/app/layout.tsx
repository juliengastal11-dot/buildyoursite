import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";
import { DefilementFluide } from "@/components/ui/defilement-fluide";
import { BuildYourSiteOverlay } from "@/components/buildyoursite/overlay";

/* Les métadonnées de base, héritées par toutes les pages. Chaque page pose
   les siennes, `title`, `description` et `alternates.canonical`, et le gabarit
   « %s · Nom du site » fait le reste. Le point médian plutôt qu'un tiret long :
   le tiret long est la signature du texte écrit par une machine, et il n'a pas
   sa place jusque dans l'onglet du navigateur. L'image de partage vient de
   app/opengraph-image.tsx, l'icône de app/icon.svg. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.nom, template: `%s · ${SITE.nom}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.nom,
    title: SITE.nom,
    description: SITE.description,
    locale: SITE.locale,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

/* Pose `html.js` avant le premier rendu. La feuille de style s'en sert pour
   masquer ce que le mouvement va dévoiler (`html.js [data-mouvement]`) : sans
   JavaScript, rien n'est masqué et tout est visible. `suppressHydrationWarning`
   parce que le serveur, lui, n'a pas cette classe — c'est voulu. */
const SCRIPT_JS = "document.documentElement.classList.add('js')";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_JS }} />
      </head>
      <body>
        {/* Retire cette ligne pour une application : le défilement natif y est préférable. */}
        <DefilementFluide />
        {children}
        {process.env.NODE_ENV === "development" && <BuildYourSiteOverlay />}
      </body>
    </html>
  );
}
