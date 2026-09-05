#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Contrôles automatiques — ce que la relecture humaine a manqué deux fois.

     node <skill>/scripts/verifier-projet.mjs --socle
     node <skill>/scripts/verifier-projet.mjs --projet .          (avant remise)
     node <skill>/scripts/verifier-projet.mjs --projet . --production

   Chaque contrôle existe parce qu'un vrai défaut est passé au travers :

   · données d'un client précédent laissées dans le socle, prêtes à être
     copiées chez tous les suivants ;
   · classe de couleur utilisée sans être définie — invisible, elle ne rend
     simplement rien ;
   · trous `[[À COMPLÉTER]]` des pages légales, oubliés à la remise ;
   · photos provisoires parties en production.

   Sort en code 1 si un contrôle bloquant échoue.
--------------------------------------------------------------------------- */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? (args[i + 1]?.startsWith("--") ? true : args[i + 1]) : d;
};
const aDrapeau = (n) => args.includes("--" + n);

const IGNORE = new Set(["node_modules", ".next", ".git", "lib", "dist", "build", ".buildyoursite"]);

async function fichiers(racine, exts) {
  const out = [];
  async function descendre(d) {
    let entrees;
    try {
      entrees = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees) {
      if (IGNORE.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await descendre(p);
      else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
    }
  }
  await descendre(racine);
  return out;
}

const problemes = [];
const avertissements = [];
const signale = (bloquant, titre, detail) =>
  (bloquant ? problemes : avertissements).push({ titre, detail });

/* ===========================================================================
   1. Données personnelles dans le socle
   Le socle est copié tel quel dans chaque nouveau site. Une coordonnée
   oubliée ici se retrouve chez tous les clients suivants. C'est arrivé.
   =========================================================================== */
async function donneesPersonnelles(racine) {
  const motifs = [
    [/(?:^|[^\d])(?:0[1-9])(?:[ .-]?\d{2}){4}(?:[^\d]|$)/, "numéro de téléphone français"],
    [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, "adresse e-mail"],
    [/https?:\/\/(?:www\.)?(?:instagram|facebook|twitter|x|linkedin|strava|tiktok)\.com\/\S+/i, "URL de réseau social"],
  ];
  // Les exemples de documentation et les adresses manifestement fictives ne
  // comptent pas : ce qu'on traque, ce sont des valeurs réelles oubliées.
  const tolere = /example\.(com|org)|@test\.|@exemple\.|votre-|@domaine|noreply@/i;

  for (const f of await fichiers(racine, [".ts", ".tsx", ".json", ".css"])) {
    const texte = await readFile(f, "utf8");
    for (const ligne of texte.split("\n")) {
      if (tolere.test(ligne) || ligne.trimStart().startsWith("*")) continue;
      for (const [motif, quoi] of motifs) {
        if (motif.test(ligne)) {
          signale(true, `${quoi} dans le socle`, `${path.relative(racine, f)} — ${ligne.trim().slice(0, 90)}`);
        }
      }
    }
  }
}

/* ===========================================================================
   2. Classes de couleur utilisées sans être définies
   Une classe non définie ne produit ni erreur ni avertissement : elle ne rend
   simplement rien. Deux relectures humaines l'ont manquée.
   =========================================================================== */
async function couleursNonDefinies(racine) {
  const css = await fichiers(racine, [".css"]);
  const definis = new Set();
  for (const f of css) {
    const texte = await readFile(f, "utf8");
    for (const m of texte.matchAll(/^\s*--color-([a-z0-9-]+)\s*:/gim)) definis.add(m[1]);
  }
  if (definis.size === 0) return;

  /* Les prefixes ci-dessous acceptent AUSSI des valeurs qui ne sont pas des
     couleurs — `text-sm`, `border-b`, `ring-offset-2`. Une premiere version
     les signalait toutes : huit faux positifs, aucun vrai. On ne retient donc
     qu'un nom qui ressemble a un JETON DE ROLE : un mot d'au moins quatre
     lettres, sans chiffre, absent de la liste des mots-cles Tailwind.
     C'est exactement la forme du defaut reel qu'on cherche — `terracotta`. */
  const MOTS_CLES = new Set([
    // tailles et graisses
    "base", "auto", "none", "full", "thin", "light", "normal", "medium", "semibold",
    "bold", "black", "extrabold", "extralight",
    // alignement et flux
    "left", "center", "right", "justify", "start", "end", "top", "bottom",
    "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip", "hidden",
    // traits et fonds
    "solid", "dashed", "dotted", "double", "wavy", "inset", "offset",
    "cover", "contain", "fixed", "local", "scroll", "repeat", "origin",
    "collapse", "separate", "slice", "clone", "inherit", "current", "transparent",
    // palettes natives de Tailwind
    "white", "slate", "gray", "grey", "zinc", "neutral", "stone", "red", "orange",
    "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
    "indigo", "violet", "purple", "fuchsia", "pink", "rose",
    // degrades : ce ne sont pas des couleurs. La forme obsolete `gradient-*`
    // est traitee par son propre controle, avec un message juste.
    "linear", "radial", "conic", "gradient",
    // proprietes CSS ecrites en toutes lettres dans une chaine de style —
    // `border-radius`, `text-decoration`, `stroke-width`. Vu sur la feuille
    // de la comete de l'overlay : « couleur radius absente de @theme ».
    "radius", "width", "style", "color", "image", "spacing", "sizing", "align",
    "transform", "overflow", "indent", "shadow", "rendering", "underline",
    "emphasis", "opacity", "rule", "dasharray", "dashoffset", "linecap",
    "linejoin", "miterlimit", "attachment", "position", "blend", "size",
  ]);

  const utilises = new Map();
  for (const f of await fichiers(racine, [".tsx", ".ts"])) {
    const texte = await readFile(f, "utf8");
    for (const [i, ligne] of texte.split("\n").entries()) {
      // Une classe citée dans un commentaire n'est pas une classe utilisée.
      // Sans ce filtre, un commentaire qui explique un bug le signale comme
      // s'il existait encore — constaté.
      const t = ligne.trimStart();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) continue;

      for (const m of ligne.matchAll(
        /(?:text|bg|border|ring|fill|stroke|decoration|divide|caret|outline)-([a-z][a-z-]{3,})/g,
      )) {
        const nom = m[1];
        if (/\d/.test(nom)) continue;
        const racineNom = nom.split("-")[0];
        if (MOTS_CLES.has(nom) || MOTS_CLES.has(racineNom)) continue;
        if (!utilises.has(nom)) {
          utilises.set(nom, `${path.relative(racine, f)}:${i + 1}`);
        }
      }
    }
  }

  for (const [nom, ou] of utilises) {
    if (definis.has(nom)) continue;
    signale(true, `couleur « ${nom} » utilisee sans etre definie`, `${ou} — absente de @theme`);
  }
}

/* ===========================================================================
   2 bis. Syntaxe de dégradé abandonnée par Tailwind 4
   `bg-gradient-to-*` est devenu `bg-linear-to-*`. L'ancienne forme ne produit
   aucune erreur : le dégradé ne s'affiche simplement pas. Trouvé pour de vrai
   sur quatre dégradés d'une page entière, restés invisibles.
   =========================================================================== */
async function degradesObsoletes(racine) {
  for (const f of await fichiers(racine, [".tsx", ".ts", ".css"])) {
    const texte = await readFile(f, "utf8");
    for (const [i, ligne] of texte.split("\n").entries()) {
      if (/\bbg-gradient-to-[trbl]/.test(ligne)) {
        signale(
          true,
          "dégradé en syntaxe Tailwind 3 — ne rend rien en v4",
          `${path.relative(racine, f)}:${i + 1} — remplacer bg-gradient-to-* par bg-linear-to-*`,
        );
      }
    }
  }
}

/* ===========================================================================
   3. Valeurs littérales dans les composants du socle (invariant des blocs)
   Un bloc qui porte sa propre couleur rend tous les sites identiques.
   =========================================================================== */
async function valeursEnDur(racine) {
  const dossier = path.join(racine, "components");
  for (const f of await fichiers(dossier, [".tsx"])) {
    const texte = await readFile(f, "utf8");
    // L'overlay d'édition est hors charte par nature : il doit rester
    // reconnaissable quel que soit le thème du site.
    if (f.includes("buildyoursite")) continue;
    for (const [i, ligne] of texte.split("\n").entries()) {
      if (ligne.trimStart().startsWith("//") || ligne.trimStart().startsWith("*")) continue;
      if (/#[0-9a-f]{3,8}\b/i.test(ligne) && !/rgba?\(/.test(ligne)) {
        signale(
          false,
          "couleur littérale dans un composant du socle",
          `${path.relative(racine, f)}:${i + 1} — ${ligne.trim().slice(0, 80)}`,
        );
      }
    }
  }
}

/* ===========================================================================
   4. Trous des pages légales — bloquant avant remise
   =========================================================================== */
/**
 * Retire commentaires de bloc et de ligne.
 *
 * Sans ça, l'en-tête d'un gabarit qui EXPLIQUE la convention `[[À COMPLÉTER]]`
 * était compté comme un trou. Un garde qui compte faux se fait ignorer, et un
 * garde ignoré ne sert à rien — c'est la leçon des huit premiers faux positifs.
 */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

async function trousLegaux(racine) {
  for (const f of await fichiers(racine, [".tsx", ".ts", ".md"])) {
    const texte = sansCommentaires(await readFile(f, "utf8"));
    // Deux formes : l'ancienne « À COMPLÉTER » et « À CONFIRMER PAR L'UTILISATEUR »,
    // qui dit mieux à qui revient la réponse.
    const n = (texte.match(/\[\[À (COMPLÉTER|CONFIRMER)/g) ?? []).length;
    if (n > 0) {
      signale(false, `${n} donnée(s) à confirmer par l'utilisateur`, path.relative(racine, f));
    }
  }
}

/* ===========================================================================
   5. Photos provisoires — bloquant en production
   =========================================================================== */
async function photosProvisoires(racine, production) {
  const dossier = path.join(racine, "public");
  const images = await fichiers(dossier, [".jpg", ".jpeg", ".png", ".webp"]);
  const trouvees = [];
  for (const f of images) {
    const buf = await readFile(f);
    // Le marqueur est écrit dans l'EXIF par le générateur : il survit à un
    // recadrage qui effacerait le bandeau visuel.
    if (buf.includes(Buffer.from("PHOTO PROVISOIRE", "latin1"))) {
      trouvees.push(path.relative(racine, f));
    }
  }
  if (trouvees.length === 0) return;

  /* Avant remise, les photos provisoires sont l'état NORMAL : en lister
     onze noyait les vrais avertissements sous du bruit attendu. On n'en
     nomme donc que trois. En production, chacune est bloquante et mérite
     sa ligne — c'est le moment où on veut savoir laquelle. */
  if (production) {
    for (const f of trouvees) signale(true, "photo provisoire en production", f);
    return;
  }

  const apercu = trouvees.slice(0, 3).join(", ");
  const reste = trouvees.length - 3;
  console.log(
    `\n  ${trouvees.length} photo(s) provisoire(s) — normal avant remise, bloquant en production.` +
      `\n      ${apercu}${reste > 0 ? ` … et ${reste} autre(s)` : ""}`,
  );
}

/* ===========================================================================
   6. Pages sans navigation — avertissement
   Sept pages sur vingt-deux n'avaient ni en-tête ni pied de page : catalogue,
   fiche produit, compte, pages légales. Elles répondaient 200, le build était
   vert, et on y arrivait sans pouvoir en repartir. Trouvé par l'utilisateur,
   qui a demandé « un bouton retour ».

   Le tunnel de commande — panier, commande, connexion — a le droit d'être
   dépouillé. C'est pour ça que ce n'est qu'un avertissement : la liste est là
   pour qu'on tranche page par page, pas pour qu'on obéisse.
   =========================================================================== */
async function pagesSansNavigation(racine) {
  const app = path.join(racine, "app");
  const sansNav = [];
  for (const f of await fichiers(app, [".tsx"])) {
    if (path.basename(f) !== "page.tsx") continue;
    const rel = path.relative(app, f).split(path.sep).join("/");
    // L'admin a son propre layout, l'API n'a pas de page, le blueprint est un outil.
    if (/^(admin|api|blueprint)(\/|$)/.test(rel)) continue;
    const texte = sansCommentaires(await readFile(f, "utf8"));
    if (!/<Nav[\s/>]/.test(texte)) sansNav.push("app/" + rel);
  }
  if (sansNav.length > 0) {
    signale(
      false,
      `${sansNav.length} page(s) sans navigation — attendu pour le tunnel de commande, nulle part ailleurs`,
      sansNav.join(", "),
    );
  }
}

/* ===========================================================================
   7. Mots creux et tics d'IA dans le texte — avertissement
   Une rédaction longue dérive vers la langue corporate même quand le brief
   demande le contraire. Ce contrôle liste ce qui a dérivé ; il ne tranche
   pas : une expression peut être voulue par la marque. Le lecteur décide.
   =========================================================================== */
const MOTS_CREUX = [
  "sans couture",
  "clé en main",
  "clés en main",
  "au cœur de",
  "n'hésitez pas",
  "bienvenue sur notre site",
  "sublimer",
  "sublimez",
  "élever votre",
  "élevez votre",
  "booster",
  "boostez",
  "optimiser votre",
  "optimisez votre",
  "écosystème",
  "synergie",
  "à votre écoute",
  "révolutionn",
  "innovant",
  "unique en son genre",
  "que vous soyez",
  "n'est pas seulement",
  "ce n'est pas juste",
  "plongez",
  "découvrez un univers",
  "laissez-vous",
  "vivez une expérience",
  "propulser",
  "propulsez",
  "au service de",
  "faire la différence",
  "actionnable",
  "disruptif",
  "notre expertise",
  "à la pointe",
  "de a à z",
];

async function motsCreux(racine) {
  const trouvailles = [];
  for (const f of await fichiers(racine, [".tsx", ".ts", ".md"])) {
    if (f.includes("node_modules") || f.includes("verifier-projet")) continue;
    const texte = sansCommentaires(await readFile(f, "utf8"))
      // Les apostrophes typographiques et les entités JSX sont ramenées à
      // l'apostrophe droite, sinon « n&apos;hésitez pas » passe entre les mailles.
      .replace(/&apos;|’|&#39;/g, "'")
      .toLowerCase();
    for (const [i, ligne] of texte.split("\n").entries()) {
      for (const mot of MOTS_CREUX) {
        if (ligne.includes(mot)) {
          trouvailles.push(`${path.relative(racine, f)}:${i + 1} — « ${mot} »`);
          break;
        }
      }
    }
  }
  if (trouvailles.length === 0) return;
  const apercu = trouvailles.slice(0, 8).join("\n      ");
  const reste = trouvailles.length - 8;
  signale(
    false,
    `${trouvailles.length} ligne(s) de texte à relire — mots creux ou tics d'IA`,
    apercu + (reste > 0 ? `\n      … et ${reste} autre(s)` : ""),
  );
}

/* ===========================================================================
   8. SEO de base — avertissement
   Ce qu'un moteur ou un réseau social voit du site. Le socle fournit robots,
   sitemap, image de partage et métadonnées par défaut ; chaque page doit
   poser les siennes, et chaque image dire ce qu'elle montre.
   =========================================================================== */
async function seo(racine) {
  const app = path.join(racine, "app");
  for (const f of ["robots.ts", "sitemap.ts"]) {
    if (!existsSync(path.join(app, f))) {
      signale(false, `app/${f} absent — les moteurs n'ont ni consigne ni plan du site`, "le socle le fournit ; il a été retiré ?");
    }
  }

  const sansMeta = [];
  for (const f of await fichiers(app, [".tsx"])) {
    if (path.basename(f) !== "page.tsx") continue;
    const rel = path.relative(app, f).split(path.sep).join("/");
    if (/^(admin|api|blueprint)(\/|$)/.test(rel)) continue;
    const texte = sansCommentaires(await readFile(f, "utf8"));
    if (!/export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(texte)) {
      sansMeta.push("app/" + rel);
    }
  }
  if (sansMeta.length > 0) {
    signale(false, `${sansMeta.length} page(s) sans métadonnées — titre et description manquants pour les moteurs`, sansMeta.join(", "));
  }

  const sansAlt = new Map();
  for (const f of await fichiers(racine, [".tsx"])) {
    if (f.includes("node_modules")) continue;
    const texte = sansCommentaires(await readFile(f, "utf8"));
    for (const m of texte.matchAll(/<(Image|img)(\s[^>]*)?>/g)) {
      if (!/\salt=/.test(m[2] || "")) {
        const rel = path.relative(racine, f).split(path.sep).join("/");
        sansAlt.set(rel, (sansAlt.get(rel) || 0) + 1);
      }
    }
  }
  if (sansAlt.size > 0) {
    signale(
      false,
      "image(s) sans attribut alt — un alt vide est permis pour une image décorative, un alt absent ne l'est jamais",
      [...sansAlt].map(([f, n]) => `${f} (${n})`).join(", "),
    );
  }
}

/* -------------------------------- exécution ------------------------------ */

const cibleSocle = aDrapeau("socle");
const cibleProjet = opt("projet");
const production = aDrapeau("production");

if (!cibleSocle && !cibleProjet) {
  console.log("Usage : --socle  |  --projet <chemin> [--production]");
  process.exit(1);
}

if (cibleSocle) {
  const racine = path.join(RACINE_SKILL, "socle");
  console.log(`Contrôle du socle — ${racine}\n`);
  await donneesPersonnelles(racine);
  await couleursNonDefinies(racine);
  await degradesObsoletes(racine);
  await valeursEnDur(racine);
}

if (cibleProjet) {
  const racine = path.resolve(cibleProjet === true ? "." : cibleProjet);
  console.log(`Contrôle du projet — ${racine}${production ? " (avant production)" : ""}\n`);
  await couleursNonDefinies(racine);
  await degradesObsoletes(racine);
  await trousLegaux(racine);
  await photosProvisoires(racine, production);
  await pagesSansNavigation(racine);
  await motsCreux(racine);
  await seo(racine);
}

for (const p of problemes) console.log(`  ✗ ${p.titre}\n      ${p.detail}`);
for (const a of avertissements) console.log(`  ! ${a.titre}\n      ${a.detail}`);

if (problemes.length === 0 && avertissements.length === 0) {
  console.log("  ✓ tout est propre\n");
  process.exit(0);
}

console.log(
  `\n${problemes.length} bloquant(s), ${avertissements.length} avertissement(s).\n`,
);
process.exit(problemes.length > 0 ? 1 : 0);
