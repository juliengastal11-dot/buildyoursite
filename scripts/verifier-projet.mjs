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

/**
 * Un chemin de projet, toujours avec des barres obliques.
 *
 * Sous Windows, `path.relative` rend « app\contact\page.tsx ». Les rapports
 * mélangeaient alors les deux formes selon le contrôle qui parlait, et un
 * chemin à antislashs ne se recopie pas tel quel dans une commande.
 */
function cheminLisible(racine, fichier) {
  return path.relative(racine, fichier).split(path.sep).join("/");
}

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
          signale(true, `${quoi} dans le socle`, `${cheminLisible(racine, f)} — ${ligne.trim().slice(0, 90)}`);
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
          utilises.set(nom, `${cheminLisible(racine, f)}:${i + 1}`);
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
   2 ter. Une police servie par un tiers
   Un `@import` ou un `<link>` vers un CDN de polices fait transmettre l'adresse
   IP du visiteur à un tiers, sans nécessité : `next/font` sert les mêmes
   polices depuis le site. C'est un défaut juridique autant que technique, et
   il contredit la page de confidentialité que le socle livre.
   =========================================================================== */
async function policesDistantes(racine) {
  const CDN = /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|cdn\.jsdelivr\.net\/npm\/@fontsource/;
  for (const f of await fichiers(racine, [".css", ".tsx", ".ts", ".html"])) {
    const texte = await readFile(f, "utf8");
    for (const [i, ligne] of texte.split("\n").entries()) {
      const t = ligne.trimStart();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) continue;
      if (!CDN.test(ligne)) continue;
      signale(
        true,
        "police servie par un CDN tiers — l'adresse IP du visiteur y est transmise",
        `${path.relative(racine, f)}:${i + 1} — installe-la avec next/font, elle sera servie par le site`,
      );
    }
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
          `${cheminLisible(racine, f)}:${i + 1} — remplacer bg-gradient-to-* par bg-linear-to-*`,
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
          `${cheminLisible(racine, f)}:${i + 1} — ${ligne.trim().slice(0, 80)}`,
        );
      }
    }
  }
}

/* ===========================================================================
   4. Trous des pages légales — bloquant en production, dans le code livré
   =========================================================================== */
/**
 * Retire commentaires de bloc et de ligne, en conservant le nombre de lignes.
 *
 * Sans le premier filtre, l'en-tête d'un gabarit qui EXPLIQUE la convention
 * `[[À COMPLÉTER]]` était compté comme un trou. Un garde qui compte faux se
 * fait ignorer, et un garde ignoré ne sert à rien — c'est la leçon des huit
 * premiers faux positifs.
 *
 * Effacer un commentaire de bloc d'un coup aurait aussi décalé tous les
 * numéros de ligne rapportés après lui : on n'efface que son texte, jamais
 * les retours à la ligne qu'il contient.
 */
function sansCommentaires(texte) {
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, ""))
    .replace(/^\s*\/\/.*$/gm, "");
}

// Capture le texte demandé après les deux points, sur une ou plusieurs lignes
// — vu en vrai dans les CGV, une exception listée juste après le marqueur.
// Sans deux points (l'ancienne forme `[[À COMPLÉTER]]` seule), le groupe
// capturé est vide, et c'est très bien : rien à afficher après le tiret.
const RE_A_CONFIRMER = /\[\[À (?:COMPLÉTER|CONFIRMER)[^:\]]*:?\s*([^\]]*)\]\]/g;

async function trousLegaux(racine, production) {
  // Un marqueur publié tel quel dans les mentions légales a été classé
  // défaut le plus sérieux du site par un relecteur humain : le total seul
  // ne disait pas où regarder. Regroupés par fichier, et distingués selon
  // ce qui part vraiment en ligne — app/, components/, lib/ — de ce qui
  // reste dans les fichiers de préparation.
  const codeLivre = new Map();
  const preparation = new Map();

  for (const f of await fichiers(racine, [".tsx", ".ts", ".md"])) {
    const texte = sansCommentaires(await readFile(f, "utf8"));
    const rel = path.relative(racine, f).split(path.sep).join("/");
    const entrees = [];
    for (const m of texte.matchAll(RE_A_CONFIRMER)) {
      const ligne = texte.slice(0, m.index).split("\n").length;
      const demande = m[1].replace(/\s+/g, " ").trim();
      const apercu = demande.length > 60 ? demande.slice(0, 60) + "…" : demande;
      entrees.push(`ligne ${ligne}${apercu ? ` — ${apercu}` : ""}`);
    }
    if (entrees.length === 0) continue;
    (/^(app|components|lib)\//.test(rel) ? codeLivre : preparation).set(rel, entrees);
  }

  // Même mécanisme que les photos provisoires : bloquant seulement si
  // `production` est vrai, et seulement pour ce que le visiteur reçoit.
  for (const [rel, entrees] of codeLivre) {
    signale(
      production,
      `${entrees.length} donnée(s) à confirmer dans du code livré — ${rel}`,
      entrees.join("\n      "),
    );
  }
  // Un fichier de préparation ne part jamais en production : jamais bloquant.
  for (const [rel, entrees] of preparation) {
    signale(
      false,
      `${entrees.length} donnée(s) à confirmer — fichier de préparation, jamais livré au visiteur — ${rel}`,
      entrees.join("\n      "),
    );
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
      trouvees.push(cheminLisible(racine, f));
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
// Le tunnel de commande a le droit d'être nu : connexion, inscription,
// panier, commande, paiement. Sans cette liste, `app/connexion/page.tsx`
// remontait comme un défaut à chaque contrôle alors que c'est voulu — une
// page de connexion est nue par nature, comme le tunnel de commande.
const CHEMINS_SANS_NAV_TOLERES = /^(connexion|inscription|commande|panier|paiement)(\/|$)/;

async function pagesSansNavigation(racine) {
  const app = path.join(racine, "app");
  const sansNav = [];
  for (const f of await fichiers(app, [".tsx"])) {
    const base = path.basename(f);
    // La 404 est une page comme une autre : un visiteur arrivé par un lien
    // cassé ou un QR code mal recopié doit pouvoir repartir. Elle ne
    // s'appelle pas `page.tsx`, et échappait donc à ce contrôle — trouvée
    // par un relecteur humain sur une 404 réduite à un unique bouton, pas
    // par ce script.
    if (base !== "page.tsx" && base !== "not-found.tsx") continue;
    const rel = path.relative(app, f).split(path.sep).join("/");
    // L'admin a son propre layout, l'API n'a pas de page, le blueprint est un outil.
    if (/^(admin|api|blueprint)(\/|$)/.test(rel)) continue;
    if (CHEMINS_SANS_NAV_TOLERES.test(rel)) continue;
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
    // Les fichiers de préparation à la racine — BLUEPRINT.md, CONTENU.md,
    // AMELIORATIONS.md, DECISIONS.md, README.md, ou tout autre .md posé à la
    // racine — ne sont jamais livrés au visiteur. Trois lignes signalées sur
    // cinq, un jour, venaient de là : ce contrôle porte sur ce que le
    // visiteur lit, le code des pages et des composants.
    if (path.dirname(f) === racine && f.toLowerCase().endsWith(".md")) continue;

    const brut = await readFile(f, "utf8");
    const lignesBrutes = brut.split("\n");
    const texte = sansCommentaires(brut)
      // Les apostrophes typographiques et les entités JSX sont ramenées à
      // l'apostrophe droite, sinon « n&apos;hésitez pas » passe entre les mailles.
      .replace(/&apos;|’|&#39;/g, "'")
      .toLowerCase();
    for (const [i, ligne] of texte.split("\n").entries()) {
      for (const mot of MOTS_CREUX) {
        if (!ligne.includes(mot)) continue;
        // Une formule volontaire — une signature déposée du client, reprise
        // mot pour mot de son propre site — se tait avec un commentaire
        // `mots-creux-ok` sur la ligne elle-même ou juste au-dessus. Sans ça,
        // « au service de » remontait à chaque contrôle alors que c'était la
        // signature du client, pas un tic d'IA.
        const tue =
          (lignesBrutes[i] ?? "").includes("mots-creux-ok") ||
          (lignesBrutes[i - 1] ?? "").includes("mots-creux-ok");
        if (!tue) trouvailles.push(`${cheminLisible(racine, f)}:${i + 1} — « ${mot} »`);
        break;
      }
    }
  }
  if (trouvailles.length === 0) return;
  const apercu = trouvailles.slice(0, 8).join("\n      ");
  const reste = trouvailles.length - 8;
  signale(
    false,
    `${trouvailles.length} ligne(s) de texte à relire — mots creux ou tics d'IA`,
    apercu +
      (reste > 0 ? `\n      … et ${reste} autre(s)` : "") +
      `\n      une formule volontaire se tait avec un commentaire « mots-creux-ok » sur la ligne ou juste au-dessus.`,
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
  await policesDistantes(racine);
  await valeursEnDur(racine);
}

if (cibleProjet) {
  const racine = path.resolve(cibleProjet === true ? "." : cibleProjet);
  console.log(`Contrôle du projet — ${racine}${production ? " (avant production)" : ""}\n`);
  await couleursNonDefinies(racine);
  await degradesObsoletes(racine);
  await policesDistantes(racine);
  await trousLegaux(racine, production);
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
