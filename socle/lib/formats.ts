/* ---------------------------------------------------------------------------
   Formatage : dates, heures, montants. Aucun accès à la base, aucun module
   Node : ce fichier doit rester importable depuis un composant navigateur.

   POURQUOI IL EXISTE SÉPARÉMENT.

   Ces fonctions vivaient dans `lib/reglages.ts`, à côté de `lireReglages()`
   qui interroge la base. C'était commode et c'était un piège : un composant
   client (un simulateur de prix) importait `formatPrix`, et tirait derrière
   lui la chaîne complète jusqu'à Prisma dans le paquet du navigateur.

   Ça compilait. Jusqu'au jour où une ligne `import path from "node:path"` est
   arrivée dans `lib/db.ts` : le build a échoué d'un coup, avec une trace
   d'erreur qui remontait jusqu'au simulateur, à quatre fichiers de là.

   LA RÈGLE : on sépare par nature, pas par sujet.
   · `lib/<sujet>.ts`          : pur, importable partout, serveur comme client
   · `lib/<sujet>-serveur.ts`  : touche la base, le disque ou l'environnement

   Un composant client qui a besoin d'un formatage ne doit jamais pouvoir
   traîner la base derrière lui.

   POURQUOI LE FORMATAGE EST CENTRALISÉ.

   Fixer la locale et le fuseau ici évite que chaque composant appelle
   `toLocaleDateString` à sa sauce : le serveur et le navigateur rendraient
   alors des chaînes différentes, et React signalerait une erreur
   d'hydratation. Adapte la locale et le fuseau au projet.
--------------------------------------------------------------------------- */

const LOCALE = "fr-FR";
const FUSEAU = "Europe/Paris";

/** « lundi 6 septembre » */
export function formatJour(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(d);
}

/** « 14:30 » */
export function formatHeure(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU,
  }).format(d);
}

export function formatJourHeure(d: Date): string {
  return `${formatJour(d)} à ${formatHeure(d)}`;
}

/** « 6 septembre 2026 » : pour un article, une actualité, une facture. */
export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU,
  }).format(d);
}

/** Clé de regroupement par journée, stable quel que soit le fuseau du serveur. */
export function cleJour(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSEAU,
  }).format(d);
}

/**
 * Formate un montant stocké en centimes entiers : « 49 € », « 12,50 € ».
 *
 * Les montants se stockent toujours en centimes, jamais en nombres à virgule :
 * `0.1 + 0.2` ne fait pas `0.3` en JavaScript, et un prix faux de un centime
 * dans un tunnel de commande est un litige.
 */
export function formatPrix(centimes: number, devise = "EUR"): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: devise,
    minimumFractionDigits: centimes % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centimes / 100);
}

/** « 5 000 » : un nombre à la française, séparateurs compris. */
export function formatNombre(n: number): string {
  return new Intl.NumberFormat(LOCALE).format(n);
}

/**
 * Un champ « une ligne par élément » → un tableau propre.
 *
 * Les listes éditables depuis le back-office sont stockées en texte, une
 * entrée par ligne : c'est ce qu'un gérant sait modifier sans apprendre une
 * syntaxe.
 */
export function lignes(texte: string): string[] {
  return texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
