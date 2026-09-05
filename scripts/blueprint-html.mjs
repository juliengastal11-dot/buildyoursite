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

/* ------------------------------- page ---------------------------------- */

const md = readFileSync(resolve(src), "utf8");
const p = palette();
const titre = (/^#\s+(.*)$/m.exec(md)?.[1] ?? "Blueprint").trim();

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
    --primary:${p.primary}; --accent:${p.accent}; --border:${p.border};
    --muted:${p.muted}; --muted-fg:${p["muted-foreground"]};
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
</style></head>
<body>
<div class="ruban">Blueprint &middot; à valider</div>
<div class="page">
${rendre(md)}
</div>
</body></html>`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page, "utf8");
console.log(out);
