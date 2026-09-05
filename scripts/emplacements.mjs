/* ---------------------------------------------------------------------------
   Où vivent les données du skill.

   Deux choses ne sont pas du code et ne doivent pas mourir avec une
   réinstallation : `config.json`, écrit par l'installeur, et la bibliothèque
   de design, qui pèse quelques centaines de mégaoctets. Tant que le skill
   était cloné à la main, les garder à côté du code ne coûtait rien. Installé
   comme plugin, il vit dans un cache que Claude Code peut remplacer à chaque
   mise à jour, et les deux disparaissent avec lui.

   Elles vivent donc dans `~/.claude/buildyoursite`, en dehors du skill.

   **Pourquoi pas `CLAUDE_PLUGIN_DATA`**, prévu pour ça. Parce qu'il n'est
   exporté qu'aux processus de hooks et aux serveurs MCP. Nos scripts, eux,
   sont lancés par Claude dans un terminal : la variable y est absente. S'y
   fier donnerait un emplacement selon qui lance le script, donc un installeur
   qui écrit à un endroit et un relevé qui cherche à un autre. Un seul chemin,
   toujours le même, vaut mieux qu'un chemin officiel qu'on n'obtient qu'une
   fois sur deux. `BUILDYOURSITE_DATA` reste là pour le forcer.

   L'ancien emplacement continue d'être lu tant qu'il porte les fichiers :
   personne ne perd sa configuration en mettant le skill à jour. L'installeur
   déménage, ce script se contente de dire où regarder.
--------------------------------------------------------------------------- */

import { existsSync, mkdirSync, renameSync, cpSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DOSSIER_DONNEES =
  process.env.BUILDYOURSITE_DATA?.trim() || path.join(os.homedir(), ".claude", "buildyoursite");

/* Les deux emplacements, l'historique et le bon. */
const ANCIEN_CONFIG = path.join(RACINE_SKILL, "config.json");
const ANCIEN_PROMAX = path.join(RACINE_SKILL, "lib", "ui-ux-pro-max");
export const CIBLE_CONFIG = path.join(DOSSIER_DONNEES, "config.json");
export const CIBLE_PROMAX = path.join(DOSSIER_DONNEES, "ui-ux-pro-max");

/** Le chemin où lire : le bon s'il porte le fichier, sinon l'historique, sinon le bon. */
function resoudre(cible, ancien, temoin) {
  const present = (base) => existsSync(temoin ? path.join(base, temoin) : base);
  if (present(cible)) return cible;
  if (present(ancien)) return ancien;
  return cible;
}

export const CHEMIN_CONFIG = resoudre(CIBLE_CONFIG, ANCIEN_CONFIG, "");
export const CHEMIN_PROMAX = resoudre(CIBLE_PROMAX, ANCIEN_PROMAX, ".git");

/** Le moteur de recherche de la bibliothèque de design, chemin complet. */
export const RECHERCHE_PROMAX = path.join(
  CHEMIN_PROMAX,
  ".claude",
  "skills",
  "ui-ux-pro-max",
  "scripts",
  "search.py",
);

/** Vrai si quelque chose vit encore dans le dossier du skill. */
export function aDemenager() {
  return CHEMIN_CONFIG === ANCIEN_CONFIG || CHEMIN_PROMAX === ANCIEN_PROMAX;
}

/** Déplace ce qui reste dans le dossier du skill. Idempotent, sans perte. */
export function demenager(journal = () => {}) {
  mkdirSync(DOSSIER_DONNEES, { recursive: true });
  for (const [ancien, cible, quoi] of [
    [ANCIEN_CONFIG, CIBLE_CONFIG, "config.json"],
    [ANCIEN_PROMAX, CIBLE_PROMAX, "bibliothèque de design"],
  ]) {
    if (!existsSync(ancien) || existsSync(cible)) continue;
    try {
      renameSync(ancien, cible);
    } catch {
      // Deux disques différents : renommer échoue, copier puis effacer marche.
      cpSync(ancien, cible, { recursive: true });
      rmSync(ancien, { recursive: true, force: true });
    }
    journal(`${quoi} déplacé vers ${cible}`);
  }
}
