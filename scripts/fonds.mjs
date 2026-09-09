#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Fonds SVG, générés depuis la palette du projet.

       node scripts/fonds.mjs --projet . --type degrade --sortie public/fonds/hero.svg
       node scripts/fonds.mjs --projet . --type vagues --hauteur 180 --graine 7
       node scripts/fonds.mjs --lister

   Un site plat l'est souvent parce que chaque section est un rectangle posé sur
   un fond uni. Un dégradé flou derrière le héros, une vague entre deux sections,
   et la page respire. Ces formes sont géométriques : elles se calculent, elles
   ne se cherchent pas dans un générateur en ligne.

   Deux raisons de les fabriquer ici plutôt que de les télécharger. Les couleurs
   sortent des jetons du thème, donc un fond ne peut pas être hors palette, le
   défaut le plus courant. Et le fichier est écrit directement dans le projet :
   rien à ouvrir, rien à téléverser, rien à recadrer.

   Le résultat est déterministe : même graine, même fichier. On peut donc le
   régénérer après un changement de palette sans perdre la composition.
--------------------------------------------------------------------------- */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/* ------------------------------ arguments -------------------------------- */

const args = process.argv.slice(2);
const opt = (nom, defaut = null) => {
  const i = args.indexOf("--" + nom);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : defaut;
};
const drapeau = (nom) => args.includes("--" + nom);

const TYPES = {
  degrade: "dégradé flou : fond de héros, deux couleurs qui se fondent",
  vagues: "vagues empilées : séparateur entre deux sections",
  blob: "forme organique : derrière une image, un portrait, un chiffre",
  grille: "triangles irréguliers : fond de tarifs ou d'appel à l'action",
  points: "semis de points : motif discret, faible opacité",
};

if (drapeau("lister") || drapeau("help")) {
  console.log("Types de fonds :\n");
  for (const [nom, desc] of Object.entries(TYPES)) console.log(`  ${nom.padEnd(9)} ${desc}`);
  console.log(`
Options :
  --projet <chemin>    lit la palette dans app/globals.css (défaut : dossier courant)
  --couleurs a,b,c     force les couleurs, au lieu de la palette du projet
  --largeur <px>       défaut 1440
  --hauteur <px>       défaut 600 pour un fond, 200 pour un séparateur
  --graine <n>         même graine, même forme
  --sortie <chemin>    écrit le fichier ; sans elle, le SVG part sur la sortie standard
`);
  process.exit(0);
}

const type = opt("type", "degrade");
if (!TYPES[type]) {
  console.error(`✗ type « ${type} » inconnu. Types : ${Object.keys(TYPES).join(", ")}`);
  process.exit(1);
}

const projet = path.resolve(opt("projet", "."));
const largeur = Number(opt("largeur", 1440));
const hauteur = Number(opt("hauteur", type === "vagues" ? 200 : 600));
const sortie = opt("sortie");

/* ------------------------------- la palette ------------------------------- */

/* Les couleurs viennent des jetons `--color-*` du bloc @theme. C'est ce qui
   garantit qu'un fond ne peut pas sortir de la charte : il n'a pas d'autre
   source. Les jetons de rôle passent avant les couleurs de service : un fond
   construit sur `--color-border` serait gris et triste. */
const ROLES = ["primary", "accent", "secondary", "background", "muted", "card", "foreground"];

async function palette() {
  const forcees = opt("couleurs");
  if (forcees) return forcees.split(",").map((c) => c.trim()).filter(Boolean);

  const css = path.join(projet, "app", "globals.css");
  if (!existsSync(css)) {
    console.error(`✗ ${css} introuvable. Passe --couleurs "#123456,#abcdef" ou --projet <chemin>`);
    process.exit(1);
  }
  const texte = await readFile(css, "utf8");
  const jetons = new Map();
  for (const m of texte.matchAll(/--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|oklch\([^)]+\)|rgb\([^)]+\))/g)) {
    if (!jetons.has(m[1])) jetons.set(m[1], m[2]);
  }
  // Dédoublonnage : deux jetons de rôle portent souvent la même valeur, et un
  // dégradé entre une couleur et elle-même est un aplat.
  const choisies = [...new Set(ROLES.map((r) => jetons.get(r)).filter(Boolean))];
  if (choisies.length < 2) {
    console.error("✗ moins de deux couleurs de rôle trouvées dans @theme. Passe --couleurs");
    process.exit(1);
  }
  return choisies.slice(0, 3);
}

/* ------------------------------ le hasard -------------------------------- */

/* Générateur déterministe : la même graine redonne exactement la même forme,
   donc une palette qui change ne change pas la composition. */
function des(graine) {
  let s = graine >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
const hasard = des(Number(opt("graine", 1)));
const entre = (a, b) => a + hasard() * (b - a);

/* -------------------------------- formes ---------------------------------- */

const entete = (contenu, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true">
${defs}${contenu}
</svg>
`;

/** Deux taches floues qui se fondent. Le fond de héros le plus sûr. */
function degrade(c) {
  const [a, b, d] = [c[0], c[1] ?? c[0], c[2] ?? c[1] ?? c[0]];
  const flou = Math.round(Math.min(largeur, hauteur) / 4);
  return entete(
    `  <rect width="${largeur}" height="${hauteur}" fill="${d}"/>
  <g filter="url(#flou)">
    <ellipse cx="${Math.round(entre(0.1, 0.4) * largeur)}" cy="${Math.round(entre(0.15, 0.5) * hauteur)}" rx="${Math.round(entre(0.25, 0.4) * largeur)}" ry="${Math.round(entre(0.3, 0.55) * hauteur)}" fill="${a}"/>
    <ellipse cx="${Math.round(entre(0.6, 0.9) * largeur)}" cy="${Math.round(entre(0.5, 0.85) * hauteur)}" rx="${Math.round(entre(0.2, 0.35) * largeur)}" ry="${Math.round(entre(0.25, 0.5) * hauteur)}" fill="${b}"/>
  </g>`,
    `  <defs><filter id="flou" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${flou}"/></filter></defs>\n`,
  );
}

/** Vagues empilées. La dernière porte la couleur de la section qui suit. */
function vagues(c) {
  const couches = 3;
  let out = `  <rect width="${largeur}" height="${hauteur}" fill="none"/>\n`;
  for (let i = 0; i < couches; i++) {
    const base = hauteur * (0.35 + (i * 0.22));
    const amp = hauteur * entre(0.1, 0.22);
    const pas = largeur / 4;
    let d = `M 0 ${base.toFixed(1)}`;
    for (let x = 0; x < 4; x++) {
      const cx1 = x * pas + pas / 3;
      const cx2 = x * pas + (pas * 2) / 3;
      const y1 = base + (x % 2 ? amp : -amp);
      const y2 = base + (x % 2 ? -amp : amp);
      d += ` C ${cx1.toFixed(1)} ${y1.toFixed(1)}, ${cx2.toFixed(1)} ${y2.toFixed(1)}, ${((x + 1) * pas).toFixed(1)} ${base.toFixed(1)}`;
    }
    d += ` L ${largeur} ${hauteur} L 0 ${hauteur} Z`;
    const couleur = c[i % c.length];
    const opacite = (0.45 + i * 0.25).toFixed(2);
    out += `  <path d="${d}" fill="${couleur}" opacity="${opacite}"/>\n`;
  }
  return entete(out.trimEnd());
}

/** Une forme organique fermée, à poser derrière un élément. */
function blob(c) {
  const cx = largeur / 2;
  const cy = hauteur / 2;
  const r = Math.min(largeur, hauteur) * 0.38;
  const points = 7;
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const rayon = r * entre(0.75, 1.25);
    pts.push([cx + Math.cos(angle) * rayon, cy + Math.sin(angle) * rayon]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % points];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    d += ` Q ${a[0].toFixed(1)} ${a[1].toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += " Z";
  return entete(`  <path d="${d}" fill="${c[0]}"/>`);
}

/* Un motif discret doit rester visible. Le premier jet posait les triangles à
   0,04 d'opacité : mesuré sur le rendu, l'écart avec le fond ne dépassait pas
   20 sur 765. Invisible. La règle est donc calculée, pas choisie à l'œil :
   on prend dans la palette la couleur la plus éloignée du fond, et l'opacité
   compense un contraste faible. Discret veut dire léger, pas absent. */

/** Luminance perçue, 0 (noir) à 1 (blanc). Suffit pour comparer deux teintes. */
function clarte(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, v, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255);
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
}

/** La couleur de la palette qui se détache le plus du fond, et de combien. */
function contraste(couleurs, fond) {
  const cf = clarte(fond);
  let meilleure = couleurs[0];
  let ecart = 0;
  for (const c of couleurs) {
    const d = Math.abs(clarte(c) - cf);
    if (d > ecart) {
      ecart = d;
      meilleure = c;
    }
  }
  return { couleur: meilleure, ecart };
}

/** Triangles irréguliers. Un fond, pas un motif. Mais un fond qu'on voit. */
function grille(c) {
  const fond = c[c.length - 1];
  const { couleur, ecart } = contraste(c, fond);
  // Peu de contraste entre les teintes : on monte l'opacité pour compenser.
  const plafond = ecart > 0.4 ? 0.24 : 0.46;
  const plancher = plafond / 3;
  const cols = 12;
  const lignes = 6;
  const px = largeur / cols;
  const py = hauteur / lignes;
  let out = `  <rect width="${largeur}" height="${hauteur}" fill="${fond}"/>\n`;
  for (let y = 0; y < lignes; y++) {
    for (let x = 0; x < cols; x++) {
      const x0 = x * px;
      const y0 = y * py;
      for (const tri of [
        [[x0, y0], [x0 + px, y0], [x0, y0 + py]],
        [[x0 + px, y0], [x0 + px, y0 + py], [x0, y0 + py]],
      ]) {
        const o = entre(plancher, plafond).toFixed(3);
        const pts = tri.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
        out += `  <polygon points="${pts}" fill="${couleur}" opacity="${o}"/>\n`;
      }
    }
  }
  return entete(out.trimEnd());
}

/** Semis de points. Discret, donc léger. Mais assez dense pour se lire. */
function points(c) {
  // Un point pour 2 600 px² : à 1440 × 500, environ 280 points. Le premier jet
  // en posait 80, soit un pour cent de la surface : on ne voyait rien.
  const n = Math.round((largeur * hauteur) / 2600);
  const { couleur } = contraste(c, c[c.length - 1]);
  let out = "";
  for (let i = 0; i < n; i++) {
    const r = entre(2, 6).toFixed(1);
    out += `  <circle cx="${(hasard() * largeur).toFixed(1)}" cy="${(hasard() * hauteur).toFixed(1)}" r="${r}" fill="${couleur}" opacity="${entre(0.1, 0.28).toFixed(3)}"/>\n`;
  }
  return entete(out.trimEnd());
}

/* --------------------------------- sortie --------------------------------- */

const couleurs = await palette();
const svg = { degrade, vagues, blob, grille, points }[type](couleurs);

if (!sortie) {
  process.stdout.write(svg);
} else {
  const cible = path.resolve(projet, sortie);
  await mkdir(path.dirname(cible), { recursive: true });
  await writeFile(cible, svg, "utf8");
  const ko = (Buffer.byteLength(svg) / 1024).toFixed(1);
  console.log(`✓ ${type} · ${path.relative(projet, cible)} (${ko} Ko)`);
  console.log(`  couleurs : ${couleurs.join(", ")}`);
  console.log(`  Pose-le en fond de section, DERRIÈRE le contenu, et vérifie que le texte`);
  console.log(`  reste lisible. Deux fonds par site suffisent : au-delà, la page est rapiécée.`);
}
