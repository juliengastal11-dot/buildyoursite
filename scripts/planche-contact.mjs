#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Planche-contact : toutes les photos d'un projet sur une seule image.

   Pourquoi ça existe. Une source d'images peut renvoyer un fichier
   parfaitement valide, sur le bon mot-clé, et complètement hors sujet : une
   requête « coffee roasting » a rendu le portrait d'une personne s'exprimant
   devant des micros. Aucun contrôle automatique ne voit ça. Il faut regarder.

   Regarder onze images une par une coûte cher. Cette planche les assemble en
   une seule, légendée, qu'on inspecte d'un coup d'œil. C'est l'équivalent de
   la planche-contact du photographe : on choisit avant de tirer.

   Usage. Depuis la racine du projet :
     node <skill>/scripts/planche-contact.mjs
     node <skill>/scripts/planche-contact.mjs --dossier public/photos --sortie /tmp/planche.jpg
--------------------------------------------------------------------------- */

import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

let sharp;
try {
  const requireProjet = createRequire(path.join(process.cwd(), "package.json"));
  sharp = (await import(pathToFileURL(requireProjet.resolve("sharp")).href)).default;
} catch {
  console.error(
    "sharp introuvable. Lance ce script depuis la racine d'un projet Next :\n" +
      "  cd <projet> && node <skill>/scripts/planche-contact.mjs",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? args[i + 1] : d;
};

const dossier = opt("dossier", "public/photos");
const sortie = opt("sortie", "planche-contact.jpg");
const colonnes = Number(opt("colonnes", 4));

/* Vignettes assez grandes pour juger du SUJET, pas du piqué. En dessous de
   ~320 px, on ne distingue plus un sac de grains d'un tas de cailloux. */
const VIGNETTE = 360;
const LEGENDE = 34;

const IMAGES = /\.(jpe?g|png|webp|avif)$/i;

let fichiers;
try {
  fichiers = (await readdir(dossier)).filter((f) => IMAGES.test(f)).sort();
} catch {
  console.error(`Dossier introuvable : ${dossier}`);
  process.exit(1);
}

if (fichiers.length === 0) {
  console.error(`Aucune image dans ${dossier}`);
  process.exit(1);
}

const lignes = Math.ceil(fichiers.length / colonnes);
const largeur = colonnes * VIGNETTE;
const hauteur = lignes * (VIGNETTE + LEGENDE);

/** Échappe le texte destiné au SVG de légende. */
function echapper(t) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const calques = [];

for (const [i, nom] of fichiers.entries()) {
  const colonne = i % colonnes;
  const ligne = Math.floor(i / colonnes);
  const x = colonne * VIGNETTE;
  const y = ligne * (VIGNETTE + LEGENDE);

  const vignette = await sharp(path.join(dossier, nom))
    .resize(VIGNETTE - 8, VIGNETTE - 8, { fit: "cover", position: "attention" })
    .jpeg({ quality: 78 })
    .toBuffer();

  calques.push({ input: vignette, top: y + 4, left: x + 4 });

  const etiquette = Buffer.from(
    `<svg width="${VIGNETTE}" height="${LEGENDE}" xmlns="http://www.w3.org/2000/svg">
       <text x="6" y="${LEGENDE - 12}" font-family="DejaVu Sans, Verdana, Arial, sans-serif"
             font-size="15" fill="#111111">${echapper(nom)}</text>
     </svg>`,
  );
  calques.push({ input: etiquette, top: y + VIGNETTE, left: x });
}

const planche = await sharp({
  create: {
    width: largeur,
    height: hauteur,
    channels: 3,
    background: { r: 245, g: 245, b: 245 },
  },
})
  .composite(calques)
  .jpeg({ quality: 80, mozjpeg: true })
  .toBuffer();

await mkdir(path.dirname(path.resolve(sortie)), { recursive: true });
await writeFile(sortie, planche);

console.log(
  `${fichiers.length} photo(s) → ${sortie}  (${colonnes}×${lignes}, ${Math.round(planche.length / 1024)} Ko)`,
);
console.log("Ouvre-la et vérifie le SUJET de chaque vignette : aucun contrôle");
console.log("automatique ne distingue une photo juste d'une photo hors sujet.");
