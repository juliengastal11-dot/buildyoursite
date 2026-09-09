/* ---------------------------------------------------------------------------
   Remettre à niveau l'overlay d'un site déjà construit.

     node scripts/mettre-a-jour-overlay.mjs [chemin du projet]     # met à jour
     node scripts/mettre-a-jour-overlay.mjs [chemin] --verifier    # dit seulement

   Un site emporte une copie de l'overlay au moment de sa construction. Les
   améliorations apportées au socle ensuite ne le rejoignent jamais : on ouvre
   un ancien projet, on retrouve l'overlay de sa date de naissance. Vécu : deux
   essais de suite sur un site construit la veille, sans la comète ni les
   pastilles cliquables, alors que le skill, lui, était à jour.

   Ce script recopie les deux fichiers que l'overlay occupe dans un projet :
   le composant et la route qui reçoit les commentaires. Il ne touche à rien
   d'autre, et ne dit « à jour » que si le contenu est identique au socle.
--------------------------------------------------------------------------- */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SOCLE = path.join(ICI, "..", "socle");

const args = process.argv.slice(2);
const verifierSeulement = args.includes("--verifier");
const projet = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".");

/* Les fichiers que l'overlay occupe dans un projet. Le composant porte
   l'interface, la route reçoit les lots de commentaires : les deux évoluent
   ensemble, et une nouvelle interface qui interroge une ancienne route
   n'obtiendrait rien. */
const FICHIERS = [
  "components/buildyoursite/overlay.tsx",
  "app/api/buildyoursite/route.ts",
];

const vert = (t) => `\x1b[32m${t}\x1b[0m`;
const orange = (t) => `\x1b[33m${t}\x1b[0m`;
const rouge = (t) => `\x1b[31m${t}\x1b[0m`;

if (!existsSync(path.join(projet, "package.json"))) {
  console.error(rouge(`✗ ${projet} n'est pas un projet : pas de package.json.`));
  process.exit(1);
}

let aJour = 0;
let aMettre = [];
let absents = [];

for (const relatif of FICHIERS) {
  const source = path.join(SOCLE, relatif);
  const cible = path.join(projet, relatif);
  const attendu = await readFile(source, "utf8");

  if (!existsSync(cible)) {
    absents.push(relatif);
    continue;
  }
  const actuel = await readFile(cible, "utf8");
  // Les fins de ligne diffèrent d'une machine à l'autre sans rien changer au code.
  if (actuel.replace(/\r\n/g, "\n") === attendu.replace(/\r\n/g, "\n")) {
    aJour++;
  } else {
    aMettre.push({ relatif, cible, attendu, avant: actuel.length, apres: attendu.length });
  }
}

if (absents.length === FICHIERS.length) {
  console.log(orange("Ce projet ne porte pas d'overlay."));
  console.log("  Il n'a pas été construit par /buildyoursite, ou l'overlay en a été retiré.");
  process.exit(0);
}

if (aMettre.length === 0 && absents.length === 0) {
  console.log(vert("✓ overlay à jour : identique au socle du skill."));
  process.exit(0);
}

for (const f of absents) console.log(orange(`  manquant : ${f}`));
for (const f of aMettre) {
  console.log(orange(`  différent : ${f.relatif} (${f.avant} → ${f.apres} octets)`));
}

if (verifierSeulement) {
  console.log("\nÀ mettre à jour. Relance sans --verifier.");
  process.exit(1);
}

for (const f of aMettre) {
  await writeFile(f.cible, f.attendu, "utf8");
  console.log(vert(`  ✓ ${f.relatif}`));
}
for (const relatif of absents) {
  const cible = path.join(projet, relatif);
  await mkdir(path.dirname(cible), { recursive: true });
  await writeFile(cible, await readFile(path.join(SOCLE, relatif), "utf8"), "utf8");
  console.log(vert(`  ✓ ${relatif} (ajouté)`));
}

console.log("\nRecharge la page dans le panneau : le serveur de dev recompile tout seul.");
