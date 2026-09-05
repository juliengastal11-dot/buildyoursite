#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Installation de buildyoursite.

       node scripts/installer.mjs
       node scripts/installer.mjs --racine "C:\\Sites" --appellation "Chef"
       node scripts/installer.mjs --pexels <clé> --git-nom "Prénom" --git-email "…"

   Vérifie les prérequis, clone la bibliothèque de design, écrit config.json.
   Relançable sans risque : il met à jour au lieu de réinstaller, et ne pose
   que les questions dont la réponse manque encore.
--------------------------------------------------------------------------- */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { DOSSIER_DONNEES, CIBLE_CONFIG, CIBLE_PROMAX, aDemenager, demenager } from "./emplacements.mjs";

const RACINE_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPOT_PROMAX = "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill";
const CHEMIN_PROMAX = CIBLE_PROMAX;

const ok = (m) => console.log("  \u2713 " + m);
const ko = (m) => console.log("  \u2717 " + m);
const titre = (m) => console.log("\n" + m);

function silencieux(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], ...opts }).trim();
  } catch {
    return null;
  }
}

/* --------------------------- lecture des options ------------------------- */
const args = process.argv.slice(2);
const opt = (nom) => {
  const i = args.indexOf("--" + nom);
  return i >= 0 ? args[i + 1] : null;
};

/* Une seule interface de lecture, ouverte au premier besoin, fermée à la fin.
   Sans terminal — CI, script — aucune question n'est posée : on garde ce qu'on a. */
let rl = null;
async function demander(question) {
  if (!process.stdin.isTTY) return "";
  rl ??= readline.createInterface({ input: process.stdin, output: process.stdout });
  return (await rl.question(question)).trim();
}

/* ------------------------------ prérequis -------------------------------- */
titre("Prérequis");
let bloquant = false;

const noeud = process.versions.node;
if (Number(noeud.split(".")[0]) >= 20) ok("Node " + noeud);
else {
  ko("Node " + noeud + " — il en faut au moins 20 (Next.js 15 l'exige)");
  bloquant = true;
}

const git = silencieux("git --version");
git ? ok(git) : (ko("git introuvable — nécessaire pour la bibliothèque de design"), (bloquant = true));

// Python sert au moteur de recherche de UI/UX Pro Max.
const py = silencieux("python --version") || silencieux("python3 --version");
if (py) ok(py);
else {
  ko("Python introuvable — UI/UX Pro Max s'en sert pour ses recherches de design.");
  console.log("    Le skill fonctionnera, mais sans son moteur de décision design.");
}

if (bloquant) {
  console.log("\nInstallation interrompue : corrige les points marqués \u2717 puis relance.");
  process.exit(1);
}

/* ---------------------------- emplacements ------------------------------- */
/* config.json et la bibliothèque vivent hors du skill, pour survivre à sa
   réinstallation. Une installation d'avant ce changement les porte encore à
   côté du code : on déménage, une fois. */
titre("Emplacements");
if (aDemenager()) demenager(ok);
mkdirSync(DOSSIER_DONNEES, { recursive: true });
ok("données du skill : " + DOSSIER_DONNEES);

/* --------------------------- bibliothèque design ------------------------- */
titre("Bibliothèque de design (UI/UX Pro Max, MIT, dépôt séparé)");
try {
  if (existsSync(path.join(CHEMIN_PROMAX, ".git"))) {
    execSync(`git -C "${CHEMIN_PROMAX}" pull --ff-only`, { stdio: "inherit" });
    ok("mise à jour");
  } else {
    mkdirSync(path.dirname(CHEMIN_PROMAX), { recursive: true });
    execSync(`git clone --depth 1 ${DEPOT_PROMAX} "${CHEMIN_PROMAX}"`, { stdio: "inherit" });
    ok("clonée");
  }
} catch {
  ko("clonage impossible — vérifie ta connexion, puis relance ce script.");
}

/* ------------------------------- config.json ----------------------------- */
titre("Configuration");
const cheminConfig = CIBLE_CONFIG;
const cheminExemple = path.join(RACINE_SKILL, "config.exemple.json");
// config.json reste local et n'est pas versionné : on le crée depuis le modèle.
const config = JSON.parse(readFileSync(existsSync(cheminConfig) ? cheminConfig : cheminExemple, "utf8"));

const racineParDefaut =
  process.platform === "win32" ? "C:\\Sites" : path.join(os.homedir(), "Sites");

let racine = opt("racine") ?? config.racineProjets;
let appellation = opt("appellation") ?? config.appellation;

if (!racine) {
  // Un conseil pour plus tard, pas une destination : le site se crée toujours là où
  // Claude Code est ouvert. Cette valeur ne sert qu'à prévenir quand c'est ailleurs.
  racine =
    (await demander(`  Où ranges-tu tes sites d'habitude ? (un repère, pas une obligation) [${racineParDefaut}] `)) ||
    racineParDefaut;
  appellation = await demander("  Comment veux-tu que le skill t'appelle ? (vide = neutre) ");
}

config.racineProjets = racine;
config.appellation = appellation ?? "";

/* Photos provisoires. Sans clé, Openverse prend le relais — sur le sujet mais
   tiré d'une archive. La question ne se pose qu'une fois : une réponse vide
   est gardée comme telle, on ne la redemande pas à chaque relance. */
const pexels = opt("pexels");
if (pexels !== null) config.pexelsApiKey = pexels;
else if (config.pexelsApiKey === undefined) {
  config.pexelsApiKey = await demander(
    "  Clé Pexels pour les photos provisoires ? (facultatif, vide = Openverse) ",
  );
}

/* Identité git. Le premier commit d'un projet est refusé — « Author identity
   unknown » — sur une machine sans configuration globale. On ne demande que
   dans ce cas : si la globale existe, elle suffit et on n'y touche pas. */
const gitNom = opt("git-nom");
const gitEmail = opt("git-email");
if (gitNom !== null) config.gitNom = gitNom;
if (gitEmail !== null) config.gitEmail = gitEmail;

const emailGlobal = silencieux("git config --global user.email");
if (!emailGlobal && !config.gitEmail) {
  console.log("  Ta configuration git globale n'a pas d'identité : les commits des projets");
  console.log("  en ont besoin. Le skill la posera en local sur chaque projet.");
  config.gitNom = (await demander("  Nom pour les commits ? ")) || config.gitNom || "";
  config.gitEmail = (await demander("  E-mail pour les commits ? ")) || config.gitEmail || "";
}

rl?.close();

writeFileSync(cheminConfig, JSON.stringify(config, null, 2) + "\n", "utf8");
ok("config.json écrit");
if (config.pexelsApiKey) ok("photos provisoires : Pexels");
else ok("photos provisoires : Openverse (pose une clé Pexels dans config.json pour mieux)");
if (emailGlobal) ok("identité git : configuration globale (" + emailGlobal + ")");
else if (config.gitEmail) ok("identité git : " + config.gitEmail + ", posée en local par projet");
else ko("identité git absente — le premier commit d'un projet échouera. Relance avec --git-nom et --git-email.");

try {
  mkdirSync(racine, { recursive: true });
  ok("racine des projets : " + racine);
} catch {
  ko("impossible de créer " + racine + " — crée-le à la main ou change `racineProjets`.");
}

/* --------------------------------- fin ----------------------------------- */
titre("Prêt.");
console.log(`  Ouvre Claude Code dans le dossier où tu veux ton site — par exemple ${racine} —`);
console.log("  puis tape /buildyoursite. Le site sera créé là, dans un sous-dossier à son nom.");
console.log("  Mise à jour de la bibliothèque plus tard : relance ce script.\n");
