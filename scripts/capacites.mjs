#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Relevé des capacités de la machine — à lancer avant la première question.

   Une question dont la réponse est sur la machine ne se pose pas. Ce script
   vérifie lui-même, jamais sur parole : Node, Python, la bibliothèque de
   design et sa fraîcheur, l'identité git, la clé Pexels.

   Ce qu'il ne peut pas voir : les connecteurs. Ils ne sont pas déclarés dans
   un fichier lisible d'ici — ils viennent du compte ou des plugins — et seul
   Claude les a sous les yeux. Le script rappelle donc en dernière ligne quelle
   CAPACITÉ chercher, jamais quelle marque : chacun a son fournisseur, et une
   liste de noms serait fausse le jour où on l'écrit.

   Usage :  node <skill>/scripts/capacites.mjs
--------------------------------------------------------------------------- */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHEMIN_CONFIG, CHEMIN_PROMAX, DOSSIER_DONNEES, RECHERCHE_PROMAX, aDemenager } from "./emplacements.mjs";

const RACINE_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ok = (m) => console.log("  ✓ " + m);
const ko = (m) => console.log("  ✗ " + m);

function silencieux(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

console.log("Relevé des capacités\n");

/* --- Node --- */
const noeud = process.versions.node;
if (Number(noeud.split(".")[0]) >= 20) ok("Node " + noeud);
else ko("Node " + noeud + " — il en faut au moins 20, Next.js 15 l'exige");

/* --- Python, pour le moteur de recherche de Pro Max --- */
const py = silencieux("python --version") || silencieux("python3 --version");
if (py) ok(py + " — Pro Max peut être interrogé");
else ko("Python introuvable — Pro Max ne pourra pas être interrogé, le design system sera décidé sans lui");

/* --- UI/UX Pro Max, et sa fraîcheur --- */
const promax = CHEMIN_PROMAX;
if (existsSync(path.join(promax, ".git"))) {
  const date = silencieux(`git -C "${promax}" log -1 --format=%cs`);
  const jours = date ? Math.round((Date.now() - new Date(date).getTime()) / 86400000) : null;
  let ligne = "UI/UX Pro Max présent";
  if (jours !== null) ligne += `, dernier commit il y a ${jours} jour(s)`;
  if (jours !== null && jours > 60) ligne += " — relance l'installeur pour le mettre à jour";
  ok(ligne);
} else {
  // Chemin absolu : le skill peut vivre dans `~/.claude/skills` comme dans le
  // cache des plugins, et l'utilisateur n'a pas à deviner lequel.
  ko(
    "UI/UX Pro Max absent — lance l'installeur :\n" +
      `      node "${path.join(RACINE_SKILL, "scripts", "installer.mjs")}"`,
  );
}

/* --- config.json --- */
let config = {};
try {
  config = JSON.parse(readFileSync(CHEMIN_CONFIG, "utf8"));
} catch {
  ko("config.json absent — lance l'installeur");
}
if (config.racineProjets) ok("racine des projets : " + config.racineProjets);
else ko("racine des projets non définie — lance l'installeur");

/* --- identité git --- */
const emailGlobal = silencieux("git config --global user.email");
if (emailGlobal) ok("identité git : " + emailGlobal + " (configuration globale)");
else if (config.gitEmail) ok("identité git : " + config.gitEmail + " — posée en local sur chaque projet");
else ko("identité git absente — le premier commit d'un projet échouera ; relance l'installeur");

/* --- clé Pexels --- */
if (config.pexelsApiKey) ok("clé Pexels — photos provisoires de stock, sur le sujet");
else
  ko(
    "clé Pexels absente — photos provisoires via Openverse : sur le sujet, mais tirées d'une archive, à vérifier sur la planche-contact",
  );

/* --- le dossier de la session : c'est LÀ que le site sera créé ---------
   Les outils de Claude Code sont autorisés dans le dossier où la session est
   ouverte, et demandent une permission à chaque écriture en dehors. Le site
   se crée donc ici, dans un sous-dossier à son nom — et ce contrôle dit si
   « ici » est un endroit raisonnable. */
const normaliser = (p) => {
  const r = path.resolve(p);
  return process.platform === "win32" ? r.toLowerCase() : r;
};
const session = process.cwd();
const ici = normaliser(session);
const dedans = (racine) => ici === normaliser(racine) || ici.startsWith(normaliser(racine) + path.sep);
const nomDossier = path.basename(session).toLowerCase();
const DOSSIERS_FOURRE_TOUT = ["desktop", "bureau", "downloads", "téléchargements", "telechargements", "documents"];

if (dedans(RACINE_SKILL) || dedans(path.join(os.homedir(), ".claude"))) {
  ko(`dossier de la session : ${session} — c'est le dossier du skill. Ouvre Claude Code dans le dossier où tu veux ton site`);
} else if (ici === normaliser(path.parse(session).root) || ici === normaliser(os.homedir())) {
  ko(`dossier de la session : ${session} — la racine du disque ou du profil. Ouvre Claude Code dans un dossier dédié`);
} else if (DOSSIERS_FOURRE_TOUT.includes(nomDossier)) {
  console.log(`  ! dossier de la session : ${session} — on peut créer le site ici, mais un dossier dédié à tes sites serait mieux`);
} else {
  ok(`dossier de la session : ${session} — le site sera créé ici, dans un sous-dossier à son nom`);
}
if (config.racineProjets && !dedans(config.racineProjets)) {
  console.log(`  ! tes sites sont d'habitude dans ${config.racineProjets} — on peut continuer ici, ou rouvrir Claude Code là-bas`);
}

console.log("\n  Emplacements :");
console.log("  · données du skill : " + DOSSIER_DONNEES);
console.log("  · moteur de design : python \"" + RECHERCHE_PROMAX + "\"");
if (aDemenager()) {
  console.log("  ! des données vivent encore dans le dossier du skill — une mise à jour les");
  console.log("    emporterait. Relance l'installeur, il les déménage.");
}

console.log("\n  Connecteurs — à vérifier depuis Claude, pas d'ici, et par capacité :");
console.log("  · Un outil qui GÉNÈRE une image ou une vidéo à partir d'un texte, quel que soit son nom.");
console.log("    Présent, les visuels manquants peuvent être générés au lieu d'être provisoires.");
console.log("    S'il expose un solde ou un quota, appelle-le : c'est ce qui permet d'annoncer un prix.");
console.log("  · Un outil de déploiement ou de domaine : note-le sans rien en faire, on ne déploie pas.\n");
