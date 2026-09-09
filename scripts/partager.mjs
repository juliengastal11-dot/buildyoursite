#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Envoie un lien de prévisualisation du site à quelqu'un (un client, un
   associé) sans l'héberger pour de bon : le site reste sur cette machine,
   l'hébergement définitif se choisira plus tard.

   Il ne pose aucune question. Il regarde ce qui est déjà disponible sur la
   machine et choisit tout seul, dans cet ordre :

     1. un tunnel cloudflared : aucun compte, une trentaine de secondes, et
        c'est le vrai site (formulaires et back-office compris) puisqu'on
        sert une compilation de production depuis cette machine ;
     2. sinon, un hébergeur déjà connecté (Vercel ou Netlify) : il donne
        juste la commande à lancer, il ne publie jamais lui-même ;
     3. sinon rien, et il dit précisément quoi installer.

   Usage :
     node scripts/partager.mjs                  (depuis la racine du projet)
     node scripts/partager.mjs --port 3100
     node scripts/partager.mjs --sans-build      (réutilise le .next existant)

   Dès que le lien est prêt, une ligne « BUILDYOURSITE_PARTAGE=<url> » est
   affichée : c'est elle qu'il faut lire, jamais supposer l'URL.
--------------------------------------------------------------------------- */

import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

/* --------------------------------- petits outils -------------------------------- */

const WINDOWS = process.platform === "win32";
const log = (m) => console.log(`[buildyoursite] ${m}`);
const erreur = (m) => console.error(`[buildyoursite] ${m}`);

function silencieux(cmd, delaiMs = 5000) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: delaiMs }).trim();
  } catch {
    return null;
  }
}

/* ---------------------------------- arguments ------------------------------------ */

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? (args[i + 1]?.startsWith("--") ? true : args[i + 1]) : d;
};
const aDrapeau = (n) => args.includes("--" + n);

const PORT = Number(opt("port", 3100));
const SANS_BUILD = aDrapeau("sans-build");

if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
  erreur(`--port invalide : ${opt("port")}`);
  process.exit(1);
}

/* ------------------------------ sonde de port -----------------------------------
   Adapté de demarrer-dev.mjs : trois avis plutôt qu'un (IPv4, IPv6, table des
   sockets du système), pour la même raison : un serveur qui n'écoute que sur
   `::`, ou qui refuse une connexion pendant son démarrage, ne doit pas passer
   pour un port libre. Contrairement à demarrer-dev.mjs, on ne tue personne
   ici : ce serveur de prévisualisation est nouveau, on lui cherche juste un
   port libre.
--------------------------------------------------------------------------------- */

function connexionAboutit(port, host) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    const fin = (r) => {
      sock.destroy();
      resolve(r);
    };
    sock.setTimeout(700);
    sock.on("connect", () => fin(true));
    sock.on("timeout", () => fin(false));
    sock.on("error", () => fin(false));
  });
}

function pidSurPort(port) {
  if (WINDOWS) {
    const sortie = silencieux(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, 3000) || "";
    const ligne = sortie.split(/\r?\n/).find((l) => new RegExp(`[:.]${port}\\s`).test(l));
    const pid = ligne?.trim().split(/\s+/).pop();
    return pid && /^\d+$/.test(pid) ? Number(pid) : null;
  }
  const sortie = silencieux(`lsof -ti tcp:${port} -sTCP:LISTEN`, 3000) || "";
  const pid = sortie.trim().split(/\s+/)[0];
  return pid && /^\d+$/.test(pid) ? Number(pid) : null;
}

async function portOccupe(port) {
  if (await connexionAboutit(port, "127.0.0.1")) return true;
  if (await connexionAboutit(port, "::1")) return true;
  return pidSurPort(port) !== null;
}

async function premierPortLibre(depuis) {
  for (let p = depuis; p < depuis + 20; p++) {
    if (!(await portOccupe(p))) return p;
  }
  throw new Error(`Aucun port libre entre ${depuis} et ${depuis + 19}.`);
}

/* -------------------------------- le relevé --------------------------------------
   Rien de tout ça n'installe quoi que ce soit. Chaque sonde est enveloppée et
   plafonnée : une absence, une lenteur ou un échec ne doivent jamais faire
   planter le script, juste compter comme « indisponible ».
--------------------------------------------------------------------------------- */

/** L'exécutable est dans le PATH ? On ne le lance pas : une recherche suffit,
 *  et ça évite de déclencher un premier lancement lent (mise à jour, licence
 *  à accepter...) juste pour un relevé. */
function outilDisponible(nom) {
  return silencieux(WINDOWS ? `where ${nom}` : `which ${nom}`, 3000) !== null;
}

/* ---------------------------------------------------------------------------
   Où trouver cloudflared quand le PATH ne le connaît pas encore.

   Vécu, et c'est un piège qui se referme exactement au pire moment : on
   installe l'outil parce que le script vient de le réclamer, on relance le
   script, et il répond encore « rien n'est disponible ». L'installateur écrit
   bien le chemin dans le PATH de la machine, mais un terminal DÉJÀ OUVERT
   garde l'environnement qu'il avait à son démarrage. Il faudrait rouvrir une
   session, ce que personne ne devine.

   On regarde donc aussi les emplacements d'installation par défaut, et on se
   sert du chemin complet quand on l'y trouve.
--------------------------------------------------------------------------- */
const EMPLACEMENTS_CLOUDFLARED = WINDOWS
  ? [
      "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
      "C:\\Program Files\\cloudflared\\cloudflared.exe",
    ]
  : ["/usr/local/bin/cloudflared", "/opt/homebrew/bin/cloudflared", "/usr/bin/cloudflared"];

/** Le chemin de cloudflared, ou null. Cite le chemin : il contient des espaces. */
function trouverCloudflared() {
  if (outilDisponible("cloudflared")) return "cloudflared";
  for (const chemin of EMPLACEMENTS_CLOUDFLARED) {
    if (existsSync(chemin)) return `"${chemin}"`;
  }
  return null;
}

/** `vercel whoami` répond le nom d'utilisateur sur stdout et sort en erreur
 *  si personne n'est connecté, exactement ce que `silencieux` réduit à
 *  null. `--no-install` est essentiel : un relevé n'installe rien. */
function connecteVercel() {
  return silencieux("npx --no-install vercel whoami", 6000);
}

/** `netlify status` est plus verbeux, et certaines versions répondent par un
 *  code 0 même déconnecté : on ne se fie donc pas qu'au code de sortie, on
 *  cherche aussi la phrase qui dit l'absence de connexion. */
function connecteNetlify() {
  const sortie = silencieux("npx --no-install netlify status", 6000);
  if (!sortie) return null;
  // Radical seul (« connect »), sans l'accord : « pas connecté » et « pas
  // connectée » doivent tous les deux être reconnus, et un [ée] en classe de
  // caractères ne matcherait qu'une seule lettre, pas la séquence « ée ».
  if (/not\s+logged\s+in|pas\s+connect/i.test(sortie)) return null;
  const ligne = sortie.split("\n").find((l) => /user|email|@/i.test(l));
  return (ligne || sortie.split("\n")[0] || "connecté").trim();
}

function commandeInstallationCloudflared() {
  if (WINDOWS) return "winget install --id Cloudflare.cloudflared";
  if (process.platform === "darwin") return "brew install cloudflared";
  return null; // Linux : les paquets varient selon la distribution. Mieux vaut renvoyer vers la doc que d'inventer une commande.
}

/* ------------------------------- garde-fous ---------------------------------------
   Deux précautions qui ne se discutent pas : ni l'une ni l'autre n'empêche le
   partage, elles préviennent seulement. La décision reste à l'utilisateur.
--------------------------------------------------------------------------------- */

/** NEXT_PUBLIC_SITE_URL pousse le site à se déclarer indexable (robots,
 *  sitemap, métadonnées absolues). Sur un lien de travail, c'est l'inverse de
 *  ce qu'on veut. On avertit seulement : on ne touche à aucun fichier du
 *  projet. */
function siteUrlDefinie(racine) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return "variable d'environnement";
  for (const nom of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    const p = path.join(racine, nom);
    if (!existsSync(p)) continue;
    const texte = readFileSync(p, "utf8");
    if (/^\s*NEXT_PUBLIC_SITE_URL\s*=\s*\S/m.test(texte)) return nom;
  }
  return null;
}

const IGNORE = new Set(["node_modules", ".next", ".git", "dist", "build"]);

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

/** Un `[[À CONFIRMER` est un pense-bête tant qu'il reste local. Sur un lien
 *  envoyé à un client, c'est une note de chantier publiée. On liste, on
 *  n'empêche rien. */
async function chercherTrous(racine) {
  const trouvailles = [];
  for (const dossier of ["app", "components", "lib"]) {
    const base = path.join(racine, dossier);
    if (!existsSync(base)) continue;
    for (const f of await fichiers(base, [".ts", ".tsx", ".md"])) {
      const texte = await readFile(f, "utf8");
      texte.split("\n").forEach((ligne, i) => {
        if (ligne.includes("[[À CONFIRMER")) {
          // Toujours des barres obliques : un chemin à antislashs ne se
          // recopie pas tel quel dans une commande, et les rapports du skill
          // mélangeaient les deux formes.
          trouvailles.push(`${path.relative(racine, f).split(path.sep).join("/")}:${i + 1}`);
        }
      });
    }
  }
  return trouvailles;
}

function afficherTrous(trous) {
  if (trous.length === 0) return;
  console.log(`\n${trous.length} donnée(s) « [[À CONFIRMER » encore présente(s) — seront visibles dans le lien partagé :`);
  for (const t of trous) console.log(`  - ${t}`);
  console.log("");
}

/* ------------------------- processus enfants : lancement et arrêt ----------------- */

function executerEtAttendre(cmd) {
  return new Promise((resolve) => {
    // `shell: true` est nécessaire sous Windows : depuis Node 18.20 / 20.12,
    // spawn refuse de lancer un .cmd (donc npm.cmd) sans shell.
    const enfant = spawn(cmd, { stdio: "inherit", shell: true });
    enfant.on("exit", (code) => resolve(code ?? 1));
    enfant.on("error", () => resolve(1));
  });
}

function demarrerServeurProd(port) {
  return new Promise((resolve, reject) => {
    log(`démarrage du serveur de production sur le port ${port}…`);
    const enfant = spawn(`npm run start -- -p ${port}`, { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let pret = false;
    const surveiller = (flux, sortie) => {
      flux.on("data", (buf) => {
        const texte = buf.toString();
        sortie.write(texte);
        if (!pret && /Ready in|started server on|Local:/i.test(texte)) {
          pret = true;
          resolve(enfant);
        }
      });
    };
    surveiller(enfant.stdout, process.stdout);
    surveiller(enfant.stderr, process.stderr);
    enfant.once("exit", (code) => {
      if (!pret) reject(new Error(`le serveur s'est arrêté avant de répondre (code ${code ?? "?"}).`));
    });
    enfant.once("error", (err) => {
      if (!pret) reject(err);
    });
  });
}

/** Le message « Ready » annonce que Next a appelé listen(), mais on préfère
 *  vérifier pour de vrai avant d'ouvrir un tunnel dessus : une sonde TCP est
 *  bon marché et enlève tout doute. */
async function attendreReponse(port, delaiMaxMs = 15000) {
  const debut = Date.now();
  while (Date.now() - debut < delaiMaxMs) {
    if (await connexionAboutit(port, "127.0.0.1")) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function lancerTunnel(port) {
  return new Promise((resolve, reject) => {
    log("ouverture du tunnel cloudflared…");
    const enfant = spawn(`${CLOUDFLARED} tunnel --url http://localhost:${port}`, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    let trouve = false;
    let tampon = "";
    const surveiller = (flux, sortie) => {
      flux.on("data", (buf) => {
        const texte = buf.toString();
        sortie.write(texte);
        if (trouve) return;
        // Tamponné : l'URL peut arriver coupée entre deux événements « data ».
        tampon = (tampon + texte).slice(-2000);
        const m = tampon.match(/https:\/\/[a-z0-9.-]+\.trycloudflare\.com/i);
        if (m) {
          trouve = true;
          resolve({ enfant, url: m[0] });
        }
      });
    };
    surveiller(enfant.stdout, process.stdout);
    surveiller(enfant.stderr, process.stderr);
    enfant.once("exit", (code) => {
      if (!trouve) reject(new Error(`cloudflared s'est arrêté avant de donner une adresse (code ${code ?? "?"}).`));
    });
    enfant.once("error", (err) => {
      if (!trouve) reject(err);
    });
  });
}

/** Termine un processus enfant proprement, et toute son arborescence sous
 *  Windows. `spawn(..., { shell: true })` place un cmd.exe entre nous et le
 *  vrai processus (npm, puis node, puis next) : un simple `.kill()` ne
 *  toucherait que ce cmd.exe, le vrai processus survivrait, garderait le
 *  port, et la session suivante ne comprendrait pas pourquoi. `taskkill /T`
 *  referme toute l'arborescence d'un coup. */
function terminer(enfant) {
  // `exitCode` reste null si le processus est mort par signal (c'est alors
  // `signalCode` qui est renseigné). Les deux sont vérifiés pour ne pas
  // tenter de terminer un enfant déjà mort.
  if (!enfant || enfant.exitCode !== null || enfant.signalCode !== null || enfant.killed) return;
  if (WINDOWS && enfant.pid) silencieux(`taskkill /PID ${enfant.pid} /T /F`, 5000);
  else enfant.kill("SIGTERM");
}

/* ------------------------------------- les trois chemins -------------------------- */

async function partagerParTunnel(racine, portDemande, sansBuild) {
  const source = siteUrlDefinie(racine);
  if (source) {
    log(`NEXT_PUBLIC_SITE_URL est définie (${source}) — le site va se déclarer indexable ; retire-la pour ce partage temporaire.`);
  }

  if (sansBuild) {
    if (!existsSync(path.join(racine, ".next"))) {
      erreur("--sans-build suppose un .next déjà présent, or il est absent — lance d'abord npm run build, ou retire l'option.");
      process.exit(1);
    }
    log("--sans-build : réutilisation du .next existant, sans recompiler.");
  } else {
    log("compilation du site (npm run build)…");
    const code = await executerEtAttendre("npm run build");
    if (code !== 0) {
      erreur(`le build a échoué (code ${code}) — corrige l'erreur ci-dessus avant de partager.`);
      process.exit(1);
    }
  }

  let port = portDemande;
  if (await portOccupe(port)) {
    const libre = await premierPortLibre(port + 1);
    log(`port ${port} déjà occupé — je démarre sur ${libre} à la place.`);
    port = libre;
  }

  // Les deux enfants (serveur, tunnel) sont suivis ici pour pouvoir les
  // arrêter ensemble, que l'arrêt vienne de Ctrl+C ou de l'un des deux qui
  // s'arrête tout seul. Les laisser vivants tiendrait le port pour rien.
  const enfantsActifs = new Set();
  const suivre = (enfant) => {
    enfantsActifs.add(enfant);
    enfant.once("exit", () => enfantsActifs.delete(enfant));
    return enfant;
  };
  let arretEnCours = false;
  const arreterTout = (raison) => {
    if (arretEnCours) return;
    arretEnCours = true;
    log(raison);
    for (const e of enfantsActifs) terminer(e);
  };
  process.once("SIGINT", () => {
    arreterTout("arrêt demandé — fermeture du tunnel et du serveur…");
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    arreterTout("signal d'arrêt reçu — fermeture du tunnel et du serveur…");
    process.exit(0);
  });

  let serveur;
  try {
    serveur = await demarrerServeurProd(port);
  } catch (e) {
    erreur(e.message);
    process.exit(1);
  }
  suivre(serveur);
  serveur.once("exit", (code) => {
    if (!arretEnCours) {
      arreterTout(`le serveur s'est arrêté de façon inattendue (code ${code ?? "?"}) — j'arrête aussi le tunnel.`);
      process.exit(1);
    }
  });

  const repond = await attendreReponse(port);
  if (!repond) {
    erreur(`le serveur ne répond toujours pas sur le port ${port} — j'arrête.`);
    arreterTout("nettoyage avant sortie…");
    process.exit(1);
  }

  let tunnel;
  try {
    tunnel = await lancerTunnel(port);
  } catch (e) {
    erreur(e.message);
    arreterTout("nettoyage avant sortie…");
    process.exit(1);
  }
  suivre(tunnel.enfant);
  tunnel.enfant.once("exit", (code) => {
    if (!arretEnCours) {
      arreterTout(`cloudflared s'est arrêté de façon inattendue (code ${code ?? "?"}) — j'arrête aussi le serveur.`);
      process.exit(1);
    }
  });

  console.log("");
  console.log(`BUILDYOURSITE_PARTAGE=${tunnel.url}`);
  console.log(tunnel.url);
  log("le lien vit tant que cette fenêtre reste ouverte — Ctrl+C arrête le tunnel et le serveur.");
}

function partagerParHebergeur(utilisateurV, utilisateurN) {
  if (utilisateurV) console.log(`Vercel est déjà connecté (${utilisateurV}). Pour publier une préversion : npx vercel`);
  if (utilisateurN) console.log(`Netlify est déjà connecté (${utilisateurN}). Pour publier une préversion : npx netlify deploy`);
  console.log("Ce script ne lance pas la commande à ta place : c'est une publication, à toi de la déclencher.");
}

function rienDisponible() {
  console.log("Rien n'est disponible pour partager ce site : ni cloudflared, ni Vercel, ni Netlify connectés.");
  const commande = commandeInstallationCloudflared();
  if (commande) console.log(`Installe cloudflared, la solution la plus simple : ${commande}`);
  else console.log("Installe cloudflared : voir la documentation Cloudflare pour ta distribution (pkg.cloudflare.com).");
  process.exit(1);
}

/* ------------------------------------- exécution ----------------------------------- */

const racineProjet = process.cwd();

/* 1. vérifications préalables */
const cheminPackageJson = path.join(racineProjet, "package.json");
if (!existsSync(cheminPackageJson)) {
  erreur("aucun package.json ici — lance ce script depuis la racine d'un projet Next.js.");
  process.exit(1);
}

let packageJson;
try {
  packageJson = JSON.parse(readFileSync(cheminPackageJson, "utf8"));
} catch {
  erreur("package.json illisible — JSON invalide.");
  process.exit(1);
}

const aDependanceNext = Boolean(packageJson.dependencies?.next) || Boolean(packageJson.devDependencies?.next);
if (!aDependanceNext) {
  erreur("package.json ne dépend pas de next — ce n'est pas un projet Next.js.");
  process.exit(1);
}

if (!existsSync(path.join(racineProjet, "app"))) {
  erreur("dossier app/ absent — ce n'est pas un site.");
  process.exit(1);
}

/* 2. le relevé : on s'arrête au premier qui répond, pas la peine d'attendre
      npx pour rien une fois qu'on sait qu'on prendra le tunnel. */
const CLOUDFLARED = trouverCloudflared();
let utilisateurV = null;
let utilisateurN = null;
if (!CLOUDFLARED) {
  utilisateurV = connecteVercel();
  utilisateurN = connecteNetlify();
}

/* 3. les trous restants : pense-bête en local, note de chantier publiée une
      fois le lien envoyé. Affiché avant toute décision : qu'on partage par
      tunnel, par un hébergeur, ou pas du tout, la liste reste la même
      information utile, et rien n'empêche le partage pour autant. */
afficherTrous(await chercherTrous(racineProjet));

/* 4. la décision */
if (CLOUDFLARED) {
  await partagerParTunnel(racineProjet, PORT, SANS_BUILD);
} else if (utilisateurV || utilisateurN) {
  partagerParHebergeur(utilisateurV, utilisateurN);
} else {
  rienDisponible();
}
