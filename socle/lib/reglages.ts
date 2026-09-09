import { db } from "@/lib/db";

/* ---------------------------------------------------------------------------
   Réglages éditables par le propriétaire du site, depuis le back-office.

   Ce fichier du socle ne contient QUE des clés génériques, avec des valeurs
   vides. Chaque projet ajoute les siennes au bootstrap : frais de port,
   horaires, zone d'intervention, réseaux sociaux.

   ⚠️ N'y laisse jamais les valeurs d'un projet réel. Le socle est copié tel
   quel dans chaque nouveau site : une coordonnée oubliée ici se retrouve chez
   tous les clients suivants. C'est arrivé.

   ⚠️ CE FICHIER TOUCHE LA BASE. Il n'est donc importable que depuis du code
   serveur. Le formatage (dates, montants, listes) vit dans `lib/formats.ts`,
   qui ne dépend de rien : c'est celui-là qu'un composant client importe. La
   séparation n'est pas cosmétique, elle a été payée par un build cassé ; la
   raison est écrite en tête de `lib/formats.ts`.

   LE PATRON À CONSERVER : les valeurs par défaut vivent dans le CODE, la base
   ne stocke que ce qui a été modifié. Trois conséquences, toutes voulues :
   le site fonctionne avant même le premier seed ; « rétablir la valeur
   d'origine » est une simple suppression de ligne ; et le contenu de départ
   est versionné avec le projet, donc relisible dans une revue de code.
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
 * n'apparaîtrait nulle part : un contrôle invisible, donc jamais détecté.
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

/* Le formatage (dates, heures, montants, listes) est dans `lib/formats.ts`.
   Ne le réimporte pas ici pour le réexporter : la commodité rétablirait le
   piège que la séparation vient de supprimer. Chaque fichier importe
   `@/lib/formats` directement. */
