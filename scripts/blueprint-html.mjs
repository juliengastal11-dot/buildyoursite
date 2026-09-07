#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Rend un BLUEPRINT.md en page HTML autonome, à ouvrir dans le panneau
   navigateur de Claude Code. Reprend la palette du projet si app/globals.css
   existe, pour que le blueprint ait déjà l'allure du site.

   Usage : node blueprint-html.mjs <chemin du .md> [chemin du .html]
   Sans second argument : écrit à côté, en .buildyoursite/blueprint.html
--------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node blueprint-html.mjs <BLUEPRINT.md> [sortie.html]");
  process.exit(1);
}

const racine = dirname(resolve(src));
const out = process.argv[3]
  ? resolve(process.argv[3])
  : join(racine, ".buildyoursite", "blueprint.html");

/* ------------------------------ palette -------------------------------- */

/* Repli quand le projet n'a pas encore de thème : anthracite, ardoise, orange,
   ivoire — une identité neutre, qui n'est celle d'aucun client. */
const DEFAUT = {
  background: "#f4f3ee",
  foreground: "#1f1e1d",
  card: "#faf9f5",
  primary: "#2b2a28",
  secondary: "#dfe3e6",
  accent: "#d97757",
  border: "#dcd9d0",
  muted: "#e8e6df",
  "muted-foreground": "#6b6a64",
};

function palette() {
  const css = join(racine, "app", "globals.css");
  if (!existsSync(css)) return DEFAUT;
  const texte = readFileSync(css, "utf8");
  const p = { ...DEFAUT };
  for (const cle of Object.keys(DEFAUT)) {
    const m = new RegExp(`--color-${cle}\\s*:\\s*([^;]+);`).exec(texte);
    if (m) p[cle] = m[1].trim();
  }
  return p;
}

/* ----------------------------- markdown -------------------------------- */

const echappe = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** gras, italique, code, liens — appliqué après échappement */
function enligne(s) {
  return echappe(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function rendre(md) {
  const lignes = md.split(/\r?\n/);
  const html = [];
  let i = 0;

  const estSepTableau = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");
  const cellules = (l) =>
    l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());

  while (i < lignes.length) {
    const l = lignes[i];

    // bloc de code
    if (/^```/.test(l)) {
      const bloc = [];
      i++;
      while (i < lignes.length && !/^```/.test(lignes[i])) bloc.push(lignes[i++]);
      i++;
      html.push(`<pre><code>${echappe(bloc.join("\n"))}</code></pre>`);
      continue;
    }

    // tableau
    if (l.includes("|") && i + 1 < lignes.length && estSepTableau(lignes[i + 1])) {
      const entetes = cellules(l);
      i += 2;
      const corps = [];
      while (i < lignes.length && lignes[i].includes("|") && lignes[i].trim()) {
        corps.push(cellules(lignes[i++]));
      }
      html.push(
        "<div class='scroll'><table><thead><tr>" +
          entetes.map((c) => `<th>${enligne(c)}</th>`).join("") +
          "</tr></thead><tbody>" +
          corps
            .map((r) => "<tr>" + r.map((c) => `<td>${enligne(c)}</td>`).join("") + "</tr>")
            .join("") +
          "</tbody></table></div>",
      );
      continue;
    }

    // titres
    const t = /^(#{1,4})\s+(.*)$/.exec(l);
    if (t) {
      const n = t[1].length;
      html.push(`<h${n}>${enligne(t[2])}</h${n}>`);
      i++;
      continue;
    }

    // filet
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) {
      html.push("<hr>");
      i++;
      continue;
    }

    // citation
    if (/^\s*>\s?/.test(l)) {
      const bloc = [];
      while (i < lignes.length && /^\s*>\s?/.test(lignes[i])) {
        bloc.push(lignes[i++].replace(/^\s*>\s?/, ""));
      }
      html.push(`<blockquote>${enligne(bloc.join(" "))}</blockquote>`);
      continue;
    }

    // liste
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordonnee = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lignes.length && /^\s*([-*]|\d+\.)\s+/.test(lignes[i])) {
        let item = lignes[i++].replace(/^\s*([-*]|\d+\.)\s+/, "");
        // lignes de continuation indentées
        while (i < lignes.length && /^\s{2,}\S/.test(lignes[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lignes[i])) {
          item += " " + lignes[i++].trim();
        }
        items.push(`<li>${enligne(item)}</li>`);
      }
      const bal = ordonnee ? "ol" : "ul";
      html.push(`<${bal}>${items.join("")}</${bal}>`);
      continue;
    }

    // ligne vide
    if (!l.trim()) {
      i++;
      continue;
    }

    // paragraphe
    const bloc = [];
    while (
      i < lignes.length &&
      lignes[i].trim() &&
      !/^(#{1,4}\s|```|\s*>|\s*([-*]|\d+\.)\s)/.test(lignes[i]) &&
      !(lignes[i].includes("|") && i + 1 < lignes.length && estSepTableau(lignes[i + 1]))
    ) {
      bloc.push(lignes[i++]);
    }
    html.push(`<p>${enligne(bloc.join(" "))}</p>`);
  }

  return html.join("\n");
}

/* ----------------------------- squelette ------------------------------- */

/* Un squelette est un plan de masse, pas une maquette : on ne montre que la
   forme (hauteur, fond) et trois libellés, pour qu'il se lise en trois
   secondes. Hauteurs croissantes et nettement différentes, pour qu'un
   bandeau ne se confonde jamais avec un héros — même imprimé en noir et
   blanc, où la couleur seule ne distingue rien. */
const HAUTEURS = { bandeau: 34, normal: 72, grand: 110, plein: 150 };

/* Les fonds que connaît le composant Section du socle
   (socle/components/ui/section.tsx). Un fond absent ou mal orthographié
   retombe sur "background" plutôt que de faire échouer le rendu. */
const FONDS = ["background", "card", "muted", "primary", "secondary"];

/** Une ligne "nom | hauteur | fond | contenu | mouvement" → objet tolérant :
    un champ manquant ou une valeur inconnue prend un repli plutôt que de
    planter — seul le nom est réellement requis, et son absence écarte
    simplement la ligne (cf. extraireSquelettes). */
function analyserSection(ligne) {
  const [nom, hautBrut, fondBrut, contenu, mouvementBrut] = ligne
    .split("|")
    .map((c) => c.trim());
  return {
    nom: nom ?? "",
    hauteur: HAUTEURS[hautBrut] ? hautBrut : "normal",
    fond: FONDS.includes(fondBrut) ? fondBrut : "background",
    contenu: contenu || "",
    mouvement: mouvementBrut
      ? mouvementBrut.split(",").map((m) => m.trim()).filter(Boolean)
      : [],
  };
}

/* Repère les blocs ```squelette, en extrait les pages, et les retire du
   texte — sans quoi ils se rendraient une seconde fois comme un vulgaire
   <pre><code> dans le corps du document. Tolère un bloc non refermé (on
   consomme jusqu'à la fin du fichier plutôt que de boucler) et un bloc vide
   ou entièrement malformé (aucune page n'est ajoutée : rien ne se rend
   plutôt que de planter). */
function extraireSquelettes(md) {
  const lignes = md.split(/\r?\n/);
  const pages = [];
  const reste = [];
  let i = 0;
  while (i < lignes.length) {
    const ouverture = /^```\s*squelette\b(.*)$/.exec(lignes[i]);
    if (!ouverture) {
      reste.push(lignes[i++]);
      continue;
    }
    const titre = ouverture[1].trim() || "Page";
    i++;
    const brut = [];
    while (i < lignes.length && !/^```/.test(lignes[i])) brut.push(lignes[i++]);
    i++; // saute la clôture ``` — ou la fin de fichier, si elle manque

    const sections = brut
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#")) // ligne vide ou commentée : ignorée
      .map(analyserSection)
      .filter((s) => s.nom); // une ligne sans nom n'a rien à montrer

    if (sections.length) pages.push({ titre, sections });
  }
  return { pages, reste: reste.join("\n") };
}

/** Un bloc de section : fond nommé, hauteur à l'échelle, nom en gras,
    contenu discret tronqué proprement, mouvement en étiquette dans le coin.
    Texte clair sur fond primary pour rester lisible — même recette que le
    ruban plus bas (fond primary, texte bg). */
function rendreBloc(s) {
  const contenu = s.contenu ? `<span class="bloc-contenu">${echappe(s.contenu)}</span>` : "";
  const mouvement = s.mouvement.length
    ? `<span class="bloc-mvt">${echappe(s.mouvement.join(" · "))}</span>`
    : "";
  return `<div class="bloc bloc-${s.fond}" style="height:${HAUTEURS[s.hauteur]}px">
        <div class="bloc-texte"><span class="bloc-nom">${echappe(s.nom)}</span>${contenu}</div>
        ${mouvement}
      </div>`;
}

/* Les squelettes de toutes les pages, côte à côte (une grille qui repasse à
   une colonne quand la largeur manque) : le plan de masse complet du site,
   embrassé d'un coup d'œil — pour qu'un plan approuvé sur la seule foi de
   tableaux ne cache plus de surprise (constaté en vrai : un héros à un seul
   téléphone approuvé, alors que le site de référence en montrait trois). */
function rendreSquelettes(pages) {
  if (!pages.length) return "";
  const unePage = (p) => `<div class="page-squelette">
      <div class="titre-page">${echappe(p.titre)}</div>
      <div class="fenetre">
        <div class="fenetre-barre" aria-hidden="true"><i></i><i></i><i></i></div>
        ${p.sections.map(rendreBloc).join("\n")}
      </div>
    </div>`;
  return `<div class="squelettes">${pages.map(unePage).join("\n")}</div>`;
}

/* ------------------------------- page ---------------------------------- */

const md = readFileSync(resolve(src), "utf8");
const p = palette();
const { pages, reste } = extraireSquelettes(md);
// titre extrait de reste (squelettes déjà retirés) : sinon une ligne "# ..."
// mise en commentaire dans un bloc squelette pourrait passer pour le titre.
const titre = (/^#\s+(.*)$/m.exec(reste)?.[1] ?? "Blueprint").trim();
const squelettes = rendreSquelettes(pages);

// Les squelettes se placent juste après le h1 du blueprint, avant tout le
// reste : c'est ce qu'on veut voir en premier. On rend donc reste en deux
// morceaux de part et d'autre du titre plutôt que d'aller triturer le HTML
// déjà produit (plus sûr qu'un remplacement par regex sur du texte libre,
// qui pourrait contenir des motifs "$1" trompeurs).
const lignesReste = reste.split(/\r?\n/);
const iTitre = lignesReste.findIndex((l) => /^#\s+/.test(l));
const corpsPage = !squelettes
  ? rendre(reste)
  : iTitre === -1
    ? `${squelettes}\n${rendre(reste)}`
    : [
        rendre(lignesReste.slice(0, iTitre + 1).join("\n")),
        squelettes,
        rendre(lignesReste.slice(iTitre + 1).join("\n")),
      ].join("\n");

const page = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${echappe(titre)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:${p.background}; --fg:${p.foreground}; --card:${p.card};
    --primary:${p.primary}; --secondary:${p.secondary}; --accent:${p.accent};
    --border:${p.border}; --muted:${p.muted}; --muted-fg:${p["muted-foreground"]};
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
       font:15px/1.65 Inter,ui-sans-serif,system-ui,sans-serif;
       -webkit-font-smoothing:antialiased}
  .page{max-width:60rem;margin:0 auto;padding:2.5rem 1.5rem 6rem}
  .ruban{position:sticky;top:0;background:var(--primary);color:var(--bg);
         font:500 11px/1 "JetBrains Mono",monospace;letter-spacing:.16em;
         text-transform:uppercase;padding:.7rem 1.5rem;z-index:10}
  h1{font-size:2rem;letter-spacing:-.02em;margin:1.2rem 0 .4rem}
  h2{font-size:1.3rem;letter-spacing:-.01em;margin:2.4rem 0 .6rem;
     padding-bottom:.4rem;border-bottom:1px solid var(--border)}
  h3{font-size:1.05rem;margin:1.8rem 0 .4rem}
  h4{font-size:.95rem;margin:1.4rem 0 .3rem;color:var(--muted-fg)}
  p{margin:.7rem 0}
  a{color:var(--primary);text-underline-offset:3px}
  strong{font-weight:600}
  code{font:.86em/1.4 "JetBrains Mono",ui-monospace,monospace;
       background:var(--muted);padding:.12em .38em;border-radius:4px}
  pre{background:var(--card);border:1px solid var(--border);border-radius:10px;
      padding:.9rem 1rem;overflow-x:auto}
  pre code{background:none;padding:0;font-size:.82rem;line-height:1.6}
  ul,ol{margin:.7rem 0;padding-left:1.3rem}
  li{margin:.3rem 0}
  li::marker{color:var(--accent)}
  blockquote{margin:1rem 0;padding:.7rem 1rem;background:var(--card);
             border-left:3px solid var(--accent);border-radius:0 8px 8px 0}
  hr{border:0;border-top:1px solid var(--border);margin:2.4rem 0}
  .scroll{overflow-x:auto;margin:1rem 0;border:1px solid var(--border);border-radius:10px}
  table{border-collapse:collapse;width:100%;font-size:.9rem}
  th{background:var(--card);text-align:left;font-weight:600;
     padding:.6rem .8rem;border-bottom:1px solid var(--border);white-space:nowrap}
  td{padding:.55rem .8rem;border-bottom:1px solid var(--border);vertical-align:top}
  tr:last-child td{border-bottom:0}

  /* --- squelettes : plan de masse, pas une maquette ---------------------- */
  .squelettes{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,280px));
              justify-content:center;gap:1.5rem;margin:1.6rem 0 2.8rem}
  .titre-page{font-size:.92rem;font-weight:600;letter-spacing:-.01em;margin:0 0 .5rem}
  .fenetre{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--card)}
  .fenetre-barre{display:flex;gap:5px;padding:.5rem .6rem;background:var(--muted);
                 border-bottom:1px solid var(--border)}
  .fenetre-barre i{width:7px;height:7px;border-radius:50%;background:var(--border)}
  .bloc{position:relative;display:flex;justify-content:space-between;gap:.5rem;
        padding:.4rem .6rem;border-bottom:1px solid var(--border);overflow:hidden}
  .bloc:last-child{border-bottom:0}
  .bloc-background{background:var(--bg)}
  .bloc-card{background:var(--card)}
  .bloc-muted{background:var(--muted)}
  .bloc-primary{background:var(--primary);color:var(--bg)}
  .bloc-secondary{background:var(--secondary)}
  .bloc-texte{align-self:center;min-width:0;display:flex;flex-direction:column;gap:.1rem}
  .bloc-nom{font-weight:600;font-size:.7rem;line-height:1.15;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bloc-contenu{font-size:.62rem;line-height:1.2;opacity:.62;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  /* Centré, et non calé en haut : posée au sommet d'un bloc, l'étiquette se lit
     comme appartenant au bloc PRÉCÉDENT. Vérifié à l'écran sur un squelette de
     trois pages — c'était la seule chose ambiguë du rendu. */
  .bloc-mvt{flex:0 0 auto;align-self:center;max-width:9rem;
            font:500 .58rem/1.3 "JetBrains Mono",monospace;letter-spacing:.03em;text-transform:uppercase;
            background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:4px;
            padding:.15rem .4rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85}
</style></head>
<body>
<div class="ruban">Blueprint &middot; à valider</div>
<div class="page">
${corpsPage}
</div>
</body></html>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page, "utf8");
console.log(out);
