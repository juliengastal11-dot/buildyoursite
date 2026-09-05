#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Photos provisoires — de vraies images, barrées d'un bandeau « PROVISOIRE ».

   Pourquoi ça existe. Un site livré avec des aplats de couleur à la place des
   photos ne donne pas envie, même quand le code est impeccable. L'effet à la
   remise compte. Mais livrer de vraies photos sans le dire, c'est risquer
   qu'elles partent en production telles quelles.

   D'où le compromis : de vraies photos, sur le sujet, **visiblement barrées**.
   Le client voit à quoi ressemblera son site ; personne ne peut les publier
   par inadvertance.

   Usage — depuis la racine du projet :
     node <skill>/scripts/photos-provisoires.mjs --manifeste photos.json
     node <skill>/scripts/photos-provisoires.mjs --sujet "coffee roastery" \
          --sortie public/images/hero.jpg --largeur 1600 --hauteur 1000

   Manifeste : [{ "fichier": "public/images/hero.jpg",
                  "sujet": "coffee roastery", "largeur": 1600, "hauteur": 1000 }]

   ⚠️ Ces images ne doivent JAMAIS partir en production.
   `verifier-projet.mjs` refuse un projet qui en contient encore.
--------------------------------------------------------------------------- */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

/* `sharp` est une dépendance du PROJET, pas du skill. Ce script vivant dans le
   skill, un `import "sharp"` chercherait à côté de lui et échouerait. On le
   résout donc depuis le dossier courant — la racine du projet Next. */
let sharp;
try {
  const requireProjet = createRequire(path.join(process.cwd(), "package.json"));
  sharp = (await import(pathToFileURL(requireProjet.resolve("sharp")).href)).default;
} catch {
  console.error(
    "sharp introuvable. Lance ce script depuis la racine d'un projet Next :\n" +
      "  cd <projet> && node <skill>/scripts/photos-provisoires.mjs …",
  );
  process.exit(1);
}

/** Marqueur lu par le contrôle de pré-production, et écrit dans l'EXIF. */
export const MARQUEUR = "PHOTO PROVISOIRE";

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? args[i + 1] : d;
};

/* ------------------------------- sources ---------------------------------
   Trois sources, essayées dans l'ordre, jusqu'à ce qu'une image arrive :

   1. **Pexels** — photos professionnelles, licence permissive sans
      attribution obligatoire. Demande une clé gratuite : l'accès anonyme
      renvoie 401 dès qu'on l'utilise vraiment.
   2. **Openverse** — le moteur de recherche d'œuvres sous Creative Commons
      de la Wikimedia Foundation. Aucune clé, et surtout **il respecte le
      sujet demandé**. C'est ce qui le place devant le repli générique.
   3. **Picsum** — dernier recours. Belles photos, sujet aléatoire : mieux
      qu'un aplat de couleur, moins bien qu'une photo choisie.

   Chaque source rend une LISTE de candidats : un lien mort ne fait pas
   dégringoler jusqu'au repli, on essaie simplement le suivant.
--------------------------------------------------------------------------- */

/**
 * Clé Pexels, facultative mais fortement recommandee.
 *
 * Sans clé, l'API repond parfois — puis renvoie 401 des qu'on l'utilise
 * vraiment : l'acces anonyme est limite. Verifie en conditions reelles.
 * Avec une cle gratuite (pexels.com/api, deux minutes), les photos sont
 * fiables et sur le sujet ; sans elle, on tombe sur des images generiques.
 *
 * Ordre de lecture : variable d'environnement, puis `pexelsApiKey` du
 * config.json du skill.
 */
async function clePexels() {
  if (process.env.PEXELS_API_KEY?.trim()) return process.env.PEXELS_API_KEY.trim();
  try {
    const { CHEMIN_CONFIG } = await import("./emplacements.mjs");
    const conf = JSON.parse(await readFile(CHEMIN_CONFIG, "utf8"));
    return conf.pexelsApiKey?.trim() || null;
  } catch {
    return null;
  }
}

async function chercherPexels(sujet, rang = 0) {
  const url =
    "https://api.pexels.com/v1/search?per_page=15&orientation=landscape&query=" +
    encodeURIComponent(sujet);
  const cle = await clePexels();
  const r = await fetch(url, {
    headers: { Accept: "application/json", ...(cle ? { Authorization: cle } : {}) },
  });
  if (!r.ok) throw new Error(`Pexels ${r.status}${cle ? "" : " (aucune cle configuree)"}`);

  const data = await r.json();
  const photos = Array.isArray(data.photos) ? data.photos : [];
  if (photos.length === 0) throw new Error("aucun résultat");

  // Rang stable : deux appels avec le même rang rendent la même photo, donc une
  // regénération ne bouleverse pas le site. Et deux emplacements qui partagent
  // un sujet reçoivent des photos différentes plutôt que la même en double.
  return rotation(photos, rang).map((p) => ({
    src: p.src?.large2x ?? p.src?.original,
    credit: p.photographer ? `${p.photographer} / Pexels` : "Pexels",
    origine: "Pexels",
  }));
}

/* ---------------------------- le tri des candidats -----------------------
   Openverse indexe massivement des archives institutionnelles : une requête
   « coffee roasting » a rendu le portrait d'une personne s'exprimant devant
   des micros, dans une torréfaction. Le mot-clé était là ; le sujet, non.

   Deux refus, dans cet ordre d'importance :

   1. **Les personnes identifiables.** Poser le visage d'un inconnu sur le
      site commercial d'un client ne se fait pas, bandeau ou pas. C'est le
      seul refus qui compte vraiment, et il est volontairement large.
   2. **Les hors-sujet.** Au moins un mot de la requête doit se retrouver
      dans le titre ou les mots-clés.
--------------------------------------------------------------------------- */

/** Vocabulaire des archives de presse, de cérémonies et de portraits. */
const REFUS = [
  "person", "people", "man", "men", "woman", "women", "boy", "girl", "child",
  "portrait", "headshot", "selfie", "face", "smiling",
  "speech", "speaking", "speaker", "conference", "press", "interview",
  "podium", "microphone", "panel", "summit", "briefing", "hearing",
  "minister", "secretary", "senator", "president", "governor", "mayor",
  "ambassador", "delegation", "official", "congress", "parliament",
  "ceremony", "award", "meeting", "visit", "signing", "reception",
  "crowd", "protest", "parade", "wedding", "graduation", "funeral",
  "staff", "employee", "worker", "team", "group photo", "portraits",

  /* Œuvres graphiques. `category=photograph` ne les écarte pas de façon
     fiable : un dessin technique de brevet de torréfacteur est passé au
     travers, catalogué comme photographie. Le titre, lui, le disait. */
  "drawing", "illustration", "engraving", "etching", "lithograph", "sketch",
  "patent", "diagram", "blueprint", "schematic", "map", "chart",
  "painting", "artwork", "print", "poster", "postcard", "advertisement",
  "trade card", "label", "logo", "manuscript", "book", "page", "cover",
];

/** Mots trop courants pour prouver quoi que ce soit sur la pertinence. */
const MOTS_VIDES = ["the", "and", "with", "for", "close", "up", "a", "of", "in"];

function texteCandidat(i) {
  const motsCles = Array.isArray(i.tags)
    ? i.tags.map((t) => (typeof t === "string" ? t : t?.name || "")).join(" ")
    : "";
  return `${i.title || ""} ${motsCles}`.toLowerCase();
}

function contient(texte, mot) {
  // Bornes de mot explicites : « manual » ne doit pas déclencher « man ».
  return new RegExp(`(^|[^a-z])${mot}([^a-z]|$)`).test(texte);
}

function acceptable(i, sujet) {
  const texte = texteCandidat(i);
  if (!texte.trim()) return false;
  if (REFUS.some((mot) => contient(texte, mot))) return false;

  const attendus = sujet
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((m) => m.length > 2 && !MOTS_VIDES.includes(m));

  return attendus.length === 0 || attendus.some((m) => texte.includes(m));
}

/**
 * Openverse — la source sans clé qui respecte quand même le sujet.
 *
 * `license_type=commercial` écarte les licences non commerciales. Les
 * résultats restent sous Creative Commons : le crédit est donc obligatoire,
 * et c'est pour ça qu'on l'inscrit dans l'EXIF de l'image produite.
 */
async function chercherOpenverse(sujet, rang, largeur, hauteur) {
  const proportion = largeur / hauteur;
  const forme = proportion > 1.25 ? "wide" : proportion < 0.85 ? "tall" : "square";

  /* Filtres PROGRESSIFS, du plus exigeant au plus large — mais qui ne
     descendent JAMAIS sous `category=photograph`.

     Mesuré sur onze photos réelles : sans ce garde-fou, Openverse rend des
     gravures publicitaires du XIXᵉ, des scans de boîtes de café soluble et des
     photos de famille. Openverse indexe une archive, pas une banque d'images.
     `category=photograph` écarte l'illustration et l'œuvre numérisée ; les
     sources `stocksnap` et `rawpixel` sont, elles, de la photographie de stock.

     Mieux vaut tomber sur le repli générique — une belle photo hors sujet —
     que servir une gravure de chien victorien sur la fiche produit d'un
     torréfacteur. C'est pour ça que la cascade s'arrête là où elle s'arrête.

     `size` et `aspect_ratio` ne se cumulent pas : mesuré, ensemble ils
     ramènent zéro sur la plupart des sujets. Le cadrage est de toute façon
     repris ensuite par `fit: cover`. */
  const cascades = [
    `&category=photograph&source=stocksnap,rawpixel&size=large`,
    `&category=photograph&source=stocksnap,rawpixel`,
    `&category=photograph&aspect_ratio=${forme}`,
    "&category=photograph",
  ];

  const candidats = [];
  const vus = new Set();
  let dernierEchec = null;

  for (const filtres of cascades) {
    // Assez de candidats pour absorber quelques liens morts : on s'arrête là.
    if (candidats.length >= 8) break;

    const url =
      "https://api.openverse.org/v1/images/?page_size=20&mature=false" +
      "&license_type=commercial" +
      `${filtres}&q=${encodeURIComponent(sujet)}`;

    let data;
    try {
      const r = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "buildyoursite/1.0" },
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) throw new Error(`Openverse ${r.status}`);
      data = await r.json();
    } catch (e) {
      dernierEchec = e.message;
      continue;
    }

    for (const i of rotation(Array.isArray(data.results) ? data.results : [], rang)) {
      if (!i.url || vus.has(i.url)) continue;
      vus.add(i.url);
      if (!acceptable(i, sujet)) continue;
      candidats.push({
        src: i.url,
        credit: [i.creator, i.source, (i.license || "").toUpperCase()]
          .filter(Boolean)
          .join(" / "),
        origine: "Openverse",
      });
    }
  }

  if (candidats.length === 0) {
    throw new Error(dernierEchec ?? "Openverse : aucun résultat retenu après tri");
  }
  return candidats;
}

async function chercherPicsum(graine, largeur, hauteur) {
  return [
    {
      src: `https://picsum.photos/seed/${encodeURIComponent(graine)}/${largeur}/${hauteur}`,
      credit: "Picsum / Unsplash",
      origine: "Picsum (générique)",
    },
  ];
}

/** Fait tourner une liste pour que le rang choisisse sans jamais sortir du lot. */
function rotation(liste, rang) {
  const d = rang % liste.length;
  return [...liste.slice(d), ...liste.slice(0, d)];
}

/* ------------------------------ le bandeau ------------------------------- */

/**
 * Bandeau diagonal, semi-opaque, texte répété.
 *
 * Diagonal et non horizontal : un bandeau horizontal se recadre trop
 * facilement, celui-ci traverse l'image et survit à n'importe quel cadrage.
 */
function bandeau(largeur, hauteur) {
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const bande = Math.max(26, Math.min(84, Math.round(hauteur * 0.1)));
  const police = Math.round(bande * 0.42);
  const motif = `${MARQUEUR}  ·  `.repeat(14);

  return Buffer.from(
    `<svg width="${largeur}" height="${hauteur}" xmlns="http://www.w3.org/2000/svg">
       <g transform="rotate(-22 ${cx} ${cy})">
         <rect x="${-largeur}" y="${cy - bande / 2}" width="${largeur * 3}" height="${bande}"
               fill="#000000" fill-opacity="0.58"/>
         <rect x="${-largeur}" y="${cy - bande / 2}" width="${largeur * 3}" height="2" fill="#ffffff" fill-opacity="0.45"/>
         <rect x="${-largeur}" y="${cy + bande / 2 - 2}" width="${largeur * 3}" height="2" fill="#ffffff" fill-opacity="0.45"/>
         <text x="${cx}" y="${cy + police * 0.36}" text-anchor="middle"
               font-family="DejaVu Sans, Verdana, Arial, sans-serif"
               font-size="${police}" font-weight="bold"
               letter-spacing="${police * 0.14}" fill="#ffffff" fill-opacity="0.95">${motif}</text>
       </g>
     </svg>`,
  );
}

/* ---------------------------- l'approvisionnement ------------------------ */

/**
 * Descend les sources dans l'ordre et rend la première image qui arrive
 * vraiment. Une source qui répond mais dont le fichier est mort ne bloque
 * pas : on essaie le candidat suivant, puis la source suivante.
 */
async function obtenirImage(sujet, rang, largeur, hauteur) {
  const sources = [
    () => chercherPexels(sujet, rang),
    () => chercherOpenverse(sujet, rang, largeur, hauteur),
    () => chercherPicsum(`${sujet}-${rang}`, largeur, hauteur),
  ];

  const echecs = [];

  for (const chercher of sources) {
    let candidats;
    try {
      candidats = await chercher();
    } catch (e) {
      echecs.push(e.message);
      continue;
    }

    // Cinq essais par source : les liens Creative Commons meurent plus souvent
    // qu'un CDN commercial. Au-delà, le problème vient de la source elle-même.
    for (const source of candidats.slice(0, 5)) {
      if (!source.src) continue;
      try {
        const reponse = await fetch(source.src, {
          redirect: "follow",
          headers: { "User-Agent": "buildyoursite/1.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
        const brut = Buffer.from(await reponse.arrayBuffer());
        if (brut.length < 8192) throw new Error("fichier trop petit");
        return { brut, source };
      } catch (e) {
        echecs.push(`${source.origine} : ${e.message}`);
      }
    }
  }

  throw new Error(echecs.join(" ; ") || "aucune source disponible");
}

/* ------------------------------ une photo -------------------------------- */

async function fabriquer({ fichier, sujet, largeur = 1600, hauteur = 1000, rang = 0 }) {
  const { brut, source } = await obtenirImage(sujet, rang, largeur, hauteur);

  // `position: "attention"` recadre sur la zone la plus saillante plutôt qu'au
  // centre : sur un portrait recadré en paysage, ça évite de couper le sujet.
  //
  // Le bandeau est construit aux dimensions CIBLES, pas via `metadata()` :
  // sur une instance dont le `resize` n'est pas encore appliqué, `metadata()`
  // renvoie la taille de la source, et le composite est alors refusé.
  const image = sharp(brut).resize(largeur, hauteur, { fit: "cover", position: "attention" });

  const sortie = await image
    .composite([{ input: bandeau(largeur, hauteur), top: 0, left: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    // Marqueur dans les métadonnées : il survit à un recadrage qui effacerait
    // le bandeau visuel, et le crédit reste attaché à l'image.
    .withMetadata({
      exif: { IFD0: { ImageDescription: `${MARQUEUR} — ${source.credit}` } },
    })
    .toBuffer();

  await mkdir(path.dirname(fichier), { recursive: true });
  await writeFile(fichier, sortie);
  return { octets: sortie.length, credit: source.credit, origine: source.origine };
}

/* -------------------------------- entrée --------------------------------- */

const manifesteChemin = opt("manifeste");
const taches = manifesteChemin
  ? JSON.parse(await readFile(manifesteChemin, "utf8"))
  : [
      {
        fichier: opt("sortie", "public/images/provisoire.jpg"),
        sujet: opt("sujet", "abstract texture"),
        largeur: Number(opt("largeur", 1600)),
        hauteur: Number(opt("hauteur", 1000)),
        rang: Number(opt("rang", 0)),
      },
    ];

let ok = 0;
let generiques = 0;

/* Openverse limite le débit en accès anonyme. Une pause entre deux photos coûte
   quelques secondes sur un lot, et évite qu'un lot entier bascule en générique
   parce qu'on a tapé trop vite. */
const souffler = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [index, t] of taches.entries()) {
  if (index > 0) await souffler(600);
  try {
    const r = await fabriquer(t);
    if (r.origine.startsWith("Picsum")) generiques++;
    console.log(
      `  ✓ ${t.fichier}  (${t.sujet} — ${r.origine}, ${Math.round(r.octets / 1024)} Ko)`,
    );
    ok++;
  } catch (e) {
    console.log(`  ✗ ${t.fichier} — ${e.message}`);
  }
}

console.log(`\n${ok}/${taches.length} photo(s) provisoire(s).`);
if (generiques > 0) {
  console.log(`${generiques} en repli générique — belles images, mais hors sujet.`);
  console.log("Ni Pexels ni Openverse n'ont répondu. Pour des photos plus soignées :");
  console.log("crée une clé gratuite sur pexels.com/api et pose-la dans");
  console.log("`pexelsApiKey` du config.json du skill.");
}
if (ok > 0) {
  console.log("Bandeau « PHOTO PROVISOIRE » appliqué. Ces images ne doivent pas");
  console.log("partir en production : remplace-les par celles du client.\n");
}
