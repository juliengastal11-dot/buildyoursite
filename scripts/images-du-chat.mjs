#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Récupérer sur le disque les images collées dans le chat.

       node scripts/images-du-chat.mjs --sortie public/photos
       node scripts/images-du-chat.mjs --sortie public/photos --combien 5
       node scripts/images-du-chat.mjs --lister

   Longtemps, ce skill a dit à l'utilisateur : « ne colle pas tes photos dans le
   chat, elles n'arrivent pas sur mon disque, donne-moi un chemin de dossier ».
   C'était faux. La conversation est écrite ligne par ligne dans un fichier
   `.jsonl`, et les images y sont stockées en base64, avec leur type. Il suffit
   donc de les décoder.

   Ce que ça change : le geste naturel (glisser cinq photos dans le chat)
   devient le bon geste. Personne n'a plus à créer un dossier, à retrouver un
   chemin, ni à comprendre pourquoi son fichier « n'existe pas ».

   **La réserve, réelle, à dire quand elle compte.** Le client peut réduire une
   image avant de l'envoyer. Pour un logo, une capture, une référence visuelle,
   aucune importance. Pour une photo destinée à occuper un héros en pleine
   largeur, la définition récupérée peut être insuffisante : le script l'affiche
   pour chaque fichier, et en dessous de 1600 px de large il le signale.
--------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import os from "node:os";

/* ------------------------------ arguments -------------------------------- */

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf("--" + n);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const drapeau = (n) => args.includes("--" + n);

if (drapeau("help")) {
  console.log(`Récupère les images collées dans le chat et les écrit sur le disque.

  --sortie <dossier>   où écrire (défaut : .buildyoursite/images-du-chat)
  --combien <n>        les n dernières (défaut : toutes celles de la session)
  --transcription <f>  forcer le fichier .jsonl ; sinon, la session la plus récente
  --lister             ne rien écrire, seulement dire ce qui serait récupéré
`);
  process.exit(0);
}

/* --------------------------- trouver la session --------------------------- */

/* Claude Code range les conversations dans ~/.claude/projects/<dossier-encodé>.
   Le nom encode le chemin du projet : `C:\Sites` devient `C--Sites`. On ne
   devine pas. On prend le fichier le plus récemment écrit, qui est la session
   en cours, celle qui vient justement de recevoir les images. */
function transcription() {
  const force = opt("transcription");
  if (force) return path.resolve(force);

  const base = path.join(os.homedir(), ".claude", "projects");
  const encode = process.cwd().replace(/[\\/:]/g, "-");
  const candidats = [];
  for (const d of readdirSync(base)) {
    // Le dossier exact d'abord, mais un projet ouvert dans un sous-dossier
    // porte un autre nom : on garde tous les dossiers qui commencent pareil.
    if (!encode.startsWith(d) && !d.startsWith(encode.slice(0, 8))) continue;
    for (const f of readdirSync(path.join(base, d))) {
      if (!f.endsWith(".jsonl")) continue;
      const p = path.join(base, d, f);
      candidats.push({ p, t: statSync(p).mtimeMs });
    }
  }
  if (!candidats.length) {
    console.error("✗ aucune conversation trouvée sous ~/.claude/projects — passe --transcription");
    process.exit(1);
  }
  candidats.sort((a, b) => b.t - a.t);
  return candidats[0].p;
}

/* ------------------------------ extraction -------------------------------- */

const EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Dimensions lues dans l'en-tête du fichier, sans dépendance. */
function dimensions(buf, type) {
  try {
    if (type === "image/png") return { l: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (type === "image/jpeg") {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        // SOF0..SOF15, en écartant les marqueurs qui n'en sont pas
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { h: buf.readUInt16BE(i + 5), l: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {
    /* en-tête inattendu : on rend la main sans dimension */
  }
  return null;
}

const fichier = transcription();
const lignes = readFileSync(fichier, "utf8").split("\n");
const combien = Number(opt("combien", 0)) || Infinity;

const vues = new Set();
const images = [];

// De la fin vers le début : les dernières collées sont celles qu'on veut.
for (let i = lignes.length - 1; i >= 0 && images.length < combien; i--) {
  const l = lignes[i];
  if (!l.includes('"type":"image"')) continue;
  let obj;
  try {
    obj = JSON.parse(l);
  } catch {
    continue;
  }
  /* Deux sortes d'images vivent dans une conversation : celles que la personne
     a collées, et celles qu'un outil a rendues (mes propres captures du
     panneau, par dizaines). Seules les premières nous intéressent, et elles se
     distinguent à ce qu'elles n'accompagnent aucun résultat d'outil. */
  if (obj.toolUseResult !== undefined) continue;
  const trouvees = [];
  const explorer = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(explorer);
    if (n.type === "image" && n.source?.data) trouvees.push(n.source);
    for (const v of Object.values(n)) explorer(v);
  };
  explorer(obj);

  for (const src of trouvees) {
    if (images.length >= combien) break;
    const octets = Buffer.from(src.data, "base64");
    // La même image peut apparaître deux fois dans la conversation.
    const empreinte = createHash("sha256").update(octets).digest("hex").slice(0, 16);
    if (vues.has(empreinte)) continue;
    vues.add(empreinte);
    images.push({ octets, type: src.media_type, dim: dimensions(octets, src.media_type) });
  }
}

// Remises dans l'ordre où elles ont été collées.
images.reverse();

if (!images.length) {
  console.log("Aucune image dans cette conversation.");
  console.log(`  conversation lue : ${fichier}`);
  process.exit(0);
}

const sortie = path.resolve(opt("sortie", path.join(".buildyoursite", "images-du-chat")));
const lister = drapeau("lister");
if (!lister) mkdirSync(sortie, { recursive: true });

console.log(`${images.length} image(s) dans la conversation${lister ? " (rien n'est écrit)" : ` → ${sortie}`}\n`);

let petites = 0;
images.forEach((img, n) => {
  const ext = EXT[img.type] ?? "bin";
  const nom = `image-${String(n + 1).padStart(2, "0")}.${ext}`;
  const taille = `${(img.octets.length / 1024).toFixed(0)} Ko`;
  const dim = img.dim ? `${img.dim.l}×${img.dim.h}` : "dimensions inconnues";
  if (!lister) writeFileSync(path.join(sortie, nom), img.octets);
  const petite = img.dim && img.dim.l < 1600;
  if (petite) petites++;
  console.log(`  ${nom.padEnd(16)} ${dim.padEnd(12)} ${taille.padStart(8)}${petite ? "   ← étroite pour un héros pleine largeur" : ""}`);
});

if (petites) {
  console.log(`\n${petites} image(s) sous 1600 px de large. Sans importance pour un logo, une`);
  console.log("capture ou une référence ; pour une photo qui doit occuper toute la largeur,");
  console.log("demande le fichier d'origine plutôt que de l'étirer.");
}
