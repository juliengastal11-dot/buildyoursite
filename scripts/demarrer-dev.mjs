#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Démarre le serveur de dev sur un port sain, en réparant les situations
   connues au lieu de les subir.

   Le piège qu'il supprime : quand le port est pris, Next ne refuse pas de
   démarrer — il bascule en silence sur le port suivant. On ouvre alors
   localhost:3000, on tombe sur le serveur zombie d'une session précédente,
   et on conclut que le site est cassé.

   Usage :  node <skill>/scripts/demarrer-dev.mjs [port]
   Affiche une ligne « BUILDYOURSITE_URL=http://localhost:<port> » dès que le
   serveur répond : c'est elle qu'il faut lire, jamais supposer le port.
--------------------------------------------------------------------------- */

import { execSync, spawn } from "node:child_process";
import net from "node:net";

const PORT_VOULU = Number(process.argv[2] || 3000);
const WINDOWS = process.platform === "win32";

const log = (m) => console.log(`[buildyoursite] ${m}`);

function silencieux(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

/** Une connexion aboutit-elle sur ce port et cet hôte ? */
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

/**
 * Quelqu'un écoute-t-il sur ce port ?
 *
 * Trois avis plutôt qu'un : IPv4, IPv6, et la table des sockets du système.
 * Vécu : un serveur d'un autre projet tenait le port 3000, la sonde a dit
 * « libre », et Next a échoué avec EADDRINUSE. Un serveur peut n'écouter que
 * sur `::`, ou refuser une connexion pendant qu'il démarre ; la table du
 * système, elle, ne se trompe pas sur qui tient un port.
 */
async function portOccupe(port) {
  if (await connexionAboutit(port, "127.0.0.1")) return true;
  if (await connexionAboutit(port, "::1")) return true;
  return pidSurPort(port) !== null;
}

function pidSurPort(port) {
  if (WINDOWS) {
    const sortie = silencieux(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`);
    const ligne = sortie.split(/\r?\n/).find((l) => new RegExp(`[:.]${port}\\s`).test(l));
    const pid = ligne?.trim().split(/\s+/).pop();
    return pid && /^\d+$/.test(pid) ? Number(pid) : null;
  }
  const pid = silencieux(`lsof -ti tcp:${port} -sTCP:LISTEN`).trim().split(/\s+/)[0];
  return pid && /^\d+$/.test(pid) ? Number(pid) : null;
}

/** Ligne de commande du processus, pour décider si on a le droit de le tuer. */
function ligneDeCommande(pid) {
  if (WINDOWS) {
    const s = silencieux(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
    );
    return s.trim();
  }
  return silencieux(`ps -p ${pid} -o command=`).trim();
}

function tuer(pid) {
  if (WINDOWS) silencieux(`taskkill /PID ${pid} /F`);
  else silencieux(`kill -9 ${pid}`);
}

/**
 * Un serveur de dev Next abandonné — le seul cas qu'on s'autorise à tuer.
 *
 * La ligne de commande réelle ne contient pas « next dev » mais le chemin du
 * module : `node ...\node_modules\next\dist\server\lib\start-server.js`.
 * D'où la recherche de « next » comme **segment**, et non comme sous-chaîne :
 * un simple `includes("next")` tuerait un processus `nextcloud`.
 */
function estServeurNext(cmd) {
  const c = cmd.toLowerCase();
  if (!c.includes("node")) return false;
  return /(^|[\\/\s])next([\\/\s]|$)/.test(c) || c.includes("next-server");
}

/**
 * Ce serveur Next sert-il CE projet ?
 *
 * La distinction est vitale. Deux serveurs Next sur le même projet partagent
 * `.next` et se corrompent mutuellement : le site perd son CSS ou renvoie 404
 * sur des pages qui marchaient, sans qu'aucune erreur ne remonte. Arrivé pour
 * de vrai — c'est un test de ce script qui l'a provoqué.
 *
 * Donc : un serveur de CE projet est un doublon, on le termine. Un serveur
 * d'un AUTRE projet appartient à quelqu'un d'autre, on n'y touche pas.
 */
function sertCeProjet(cmd) {
  const racine = process.cwd().toLowerCase().replace(/[\\/]+$/, "");
  return cmd.toLowerCase().includes(racine);
}

async function premierPortLibre(depuis) {
  for (let p = depuis; p < depuis + 20; p++) {
    if (!(await portOccupe(p))) return p;
  }
  throw new Error(`Aucun port libre entre ${depuis} et ${depuis + 19}.`);
}

/* ------------------------------- décision ------------------------------- */

let port = PORT_VOULU;

if (await portOccupe(port)) {
  const pid = pidSurPort(port);
  const cmd = pid ? ligneDeCommande(pid) : "";

  if (pid && estServeurNext(cmd) && sertCeProjet(cmd)) {
    // Notre propre serveur, resté en vie après la fermeture d'une session.
    // Il sert un build périmé : on le termine et on reprend son port.
    log(`port ${port} tenu par un serveur de CE projet (pid ${pid}) — je le termine.`);
    tuer(pid);
    await new Promise((r) => setTimeout(r, 1500));
    if (await portOccupe(port)) {
      port = await premierPortLibre(port + 1);
      log(`le port ${PORT_VOULU} ne s'est pas libéré, je passe sur ${port}.`);
    }
  } else {
    // Serveur d'un autre projet, ou processus inconnu : on n'y touche pas.
    port = await premierPortLibre(port + 1);
    const quoi = pid && estServeurNext(cmd) ? "un serveur Next d'un AUTRE projet" : "un processus que je ne reconnais pas";
    log(
      `port ${PORT_VOULU} occupé par ${quoi}` +
        (pid ? ` (pid ${pid}${cmd ? ` — ${cmd.slice(0, 70)}` : ""})` : "") +
        `. Je ne le touche pas et je démarre sur ${port}.`,
    );
  }
}

/* ------- garde-fou : jamais deux serveurs de dev sur le même projet ------- */
// Ils partagent `.next` et se corrompent mutuellement, en silence.
for (let p = 3000; p <= 3010; p++) {
  if (p === port) continue;
  if (!(await portOccupe(p))) continue;
  const autrePid = pidSurPort(p);
  if (!autrePid) continue;
  const autreCmd = ligneDeCommande(autrePid);
  if (estServeurNext(autreCmd) && sertCeProjet(autreCmd)) {
    log(`un autre serveur de CE projet tourne sur ${p} (pid ${autrePid}) — je le termine :`);
    log(`  deux serveurs partagent .next et le corrompent, sans qu'aucune erreur ne remonte.`);
    tuer(autrePid);
  }
}

/* ------------------------------- démarrage ------------------------------ */

/**
 * Lance Next sur un port, et relance sur le suivant si le port est pris malgré
 * la sonde.
 *
 * Avec `-p` explicite, Next 15.5 ne bascule plus en silence sur le port
 * suivant : il échoue avec EADDRINUSE — et, piège, sort avec le code 0. Sans
 * cette relance, le lanceur se terminait « proprement » sur un serveur qui
 * n'avait jamais démarré, et l'orchestrateur attendait une URL qui ne venait
 * pas. Vécu avec deux projets ouverts en même temps.
 */
function lancer(port, essais = 0) {
  log(`démarrage sur le port ${port}…`);

  // `shell: true` est nécessaire : depuis Node 18.20 / 20.12, spawn refuse de
  // lancer un .cmd (donc npm.cmd) sans shell et lève EINVAL sur Windows.
  // `port` est un entier validé plus haut, donc rien d'injectable ici.
  const enfant = spawn(`npm run dev -- -p ${port}`, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let annonce = false;
  let portPris = false;

  const surveiller = (flux, sortie) => {
    flux.on("data", (buf) => {
      const texte = buf.toString();
      sortie.write(texte);
      if (!annonce && /Ready in|Local:/.test(texte)) {
        annonce = true;
        // Ligne à lire par l'orchestrateur — jamais supposer le port.
        console.log(`BUILDYOURSITE_URL=http://localhost:${port}`);
      }
      if (/EADDRINUSE/.test(texte)) portPris = true;
    });
  };
  surveiller(enfant.stdout, process.stdout);
  surveiller(enfant.stderr, process.stderr);

  enfant.on("exit", async (code) => {
    if (portPris && essais < 20) {
      const suivant = await premierPortLibre(port + 1);
      log(`le port ${port} était pris malgré tout — je relance sur ${suivant}.`);
      lancer(suivant, essais + 1);
      return;
    }
    if (!annonce) {
      log(`le serveur s'est arrêté avant d'annoncer une adresse (code ${code ?? "?"}).`);
      process.exit(code || 1);
    }
    process.exit(code ?? 0);
  });

  for (const sig of ["SIGINT", "SIGTERM"]) process.once(sig, () => enfant.kill(sig));
}

lancer(port);
