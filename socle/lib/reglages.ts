import { db } from "@/lib/db";

/* ---------------------------------------------------------------------------
   Réglages éditables par le propriétaire du site, depuis le back-office.

   Ce fichier du socle ne contient QUE des clés génériques, avec des valeurs
   vides. Chaque projet ajoute les siennes au bootstrap — frais de port,
   horaires, zone d'intervention, réseaux sociaux.

   ⚠️ N'y laisse jamais les valeurs d'un projet réel. Le socle est copié tel
   quel dans chaque nouveau site : une coordonnée oubliée ici se retrouve chez
   tous les clients suivants. C'est arrivé.
--------------------------------------------------------------------------- */

export const REGLAGES_DEFAUT = {
  email: "",
  telephone: "",
};

export type CleReglage = keyof typeof REGLAGES_DEFAUT;
export type Reglages = Record<CleReglage, string>;

/** Libellés affichés dans le formulaire du back-office. */
export const LIBELLES_REGLAGES: Record<CleReglage, string> = {
  email: "Adresse e-mail",
  telephone: "Téléphone affiché",
};

/**
 * Source unique de la liste des réglages. Les énumérer à la main dans le
 * formulaire et dans la server action garantissait qu'un réglage ajouté ici
 * n'apparaîtrait nulle part — un contrôle invisible, donc jamais détecté.
 */
export const CLES_REGLAGES = Object.keys(REGLAGES_DEFAUT) as CleReglage[];

/** Réglages qu'on peut légitimement laisser vides. */
export const CLES_OPTIONNELLES: readonly CleReglage[] = [];

/** Lit les réglages en base, complétés par les valeurs par défaut. */
export async function lireReglages(): Promise<Reglages> {
  const lignes = await db.reglage.findMany();
  const valeurs = { ...REGLAGES_DEFAUT } as Reglages;
  for (const l of lignes) {
    if (l.cle in valeurs) valeurs[l.cle as CleReglage] = l.valeur;
  }
  return valeurs;
}

/* ---------------------------------------------------------------------------
   Formatage des dates — centralisé volontairement.

   Fixer la locale et le fuseau ici évite que chaque composant appelle
   `toLocaleDateString` à sa sauce : le serveur et le navigateur rendraient
   alors des chaînes différentes, et React signalerait une erreur d'hydratation.
   Adapte la locale et le fuseau au projet.
--------------------------------------------------------------------------- */

const LOCALE = "fr-FR";
const FUSEAU = "Europe/Paris";

export function formatJour(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(d);
}

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

/** Clé de regroupement par journée, stable quel que soit le fuseau du serveur. */
export function cleJour(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSEAU,
  }).format(d);
}

/** Formate un montant stocké en centimes entiers. */
export function formatPrix(centimes: number, devise = "EUR"): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: devise }).format(
    centimes / 100,
  );
}
