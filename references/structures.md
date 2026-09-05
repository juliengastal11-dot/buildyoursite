# Structures par type de site

**Ce que ce document contient** : quelles pages existent, et ce que chacune doit faire.
De la **fonction**, pas de l'esthétique.

**Ce qu'il ne contient pas** : dans quel ordre raconter l'histoire sur la page d'accueil.
Ça, c'est le terrain d'UI/UX Pro Max, et ça doit varier d'une marque à l'autre. Prescrire
la composition de l'accueil rendrait tous les sites semblables ; décrire les parcours ne le
fait pas — Amazon, un torréfacteur et une maison de luxe ont tous un panier, et ne se
ressemblent pas.

> **Pourquoi ce fichier existe.** Au bootstrap #2, j'ai livré une boutique complète,
> qui buildait parfaitement, **sans aucune page légale**. Pour une boutique française
> vendant à des particuliers, elle était inexploitable. Je ne l'avais ni demandé ni
> mentionné. Une liste de contrôle par type de site l'aurait empêché.

---

## Le socle légal — à traiter AVANT le reste

Je ne suis pas juriste, ceci n'est pas un avis juridique, et les obligations varient selon
le pays. Pour un enjeu réel, fais valider. Mais **ces pages ne se discutent pas** : livrer
un site professionnel sans elles, c'est livrer un site qu'on ne peut pas mettre en ligne.

### Tout site professionnel

| Page | Contenu minimal |
|---|---|
| **Mentions légales** | Éditeur (nom, forme juridique, capital, RCS, TVA), directeur de publication, hébergeur avec son adresse et son téléphone, contact |
| **Politique de confidentialité** | Données collectées, finalité, base légale, durée, destinataires, droits RGPD et comment les exercer |
| **Cookies** | Seulement s'il y a des traceurs. Un site sans analytics ni pub n'a besoin de rien. |

### En plus, pour toute vente en ligne à des particuliers

| Page | Contenu minimal |
|---|---|
| **CGV** | Prix TTC, frais et délais de livraison, moyens de paiement, **droit de rétractation de 14 jours** avec formulaire type, garanties légales de conformité et des vices cachés, **médiateur de la consommation** avec ses coordonnées |
| **Livraison et retours** | Peut vivre dans les CGV, mais une page dédiée est plus lisible pour l'acheteur |

**Informations précontractuelles** — sur la fiche produit et dans le tunnel, pas seulement
dans les CGV : prix TTC, frais de livraison, délai, et un récapitulatif avant paiement avec
le bouton portant une mention de paiement explicite.

### Ce que tu fais concrètement

Les pages légales **ne s'inventent pas**. Tu ne connais ni le SIRET du client, ni son
hébergeur, ni son médiateur. Donc :

1. Génère les pages avec la **structure complète et les rubriques attendues**.
2. Mets des marqueurs francs à chaque trou : `[[À COMPLÉTER : numéro SIRET]]`.
3. **Liste ces trous dans le blueprint** et redis-les à la remise.
4. `verifier-projet.mjs` refuse un projet qui contient encore des `[[À COMPLÉTER`.

Ne remplis jamais par une valeur plausible. Un SIRET inventé est pire qu'un trou visible.

---

## Vitrine / prestataire de services

**Parcours** : on découvre, on est convaincu, on prend contact.

| Page | Rôle |
|---|---|
| Accueil | Ce qu'on fait, pour qui, preuve, appel à l'action |
| Prestations ou services | Le détail de l'offre |
| À propos | La personne ou l'équipe — souvent la page la plus lue |
| Contact | Formulaire, coordonnées, zone d'intervention |
| Légal | Mentions légales, confidentialité |

Optionnel : réalisations, témoignages, tarifs, FAQ, journal.

---

## Boutique en ligne

**Parcours** : catalogue → fiche → panier → tunnel → confirmation → suivi.

| Page | Rôle | Piège |
|---|---|---|
| Catalogue | Liste, filtres, tri | Filtres en **liens** et non en JS, pour être partageables et indexables |
| Fiche produit | Options, prix, stock, ajout | Prix et stock **relus en base**, jamais depuis le client |
| Panier | Lignes, quantités, frais de port | Frais **recalculés côté serveur** à chaque affichage |
| Tunnel | Coordonnées, livraison, paiement | Aucun montant venant du formulaire |
| Confirmation | État **réel** de la commande | Jamais un succès déduit de l'URL |
| Compte | Historique | Rattachement par identité de session, jamais par un identifiant d'URL |
| Livraison et retours | Délais, frais, rétractation | |
| **CGV, mentions légales, confidentialité** | | **Obligatoires** |

Le pied de page porte les liens légaux. C'est là qu'on les cherche.

---

## Réservation / prise de rendez-vous

**Parcours** : on comprend l'offre, on choisit un créneau, on confirme.

| Page | Rôle | Piège |
|---|---|---|
| Accueil | L'offre, la preuve, le CTA vers la réservation | |
| Réservation | Choix du jour, du créneau, coordonnées | Contrainte d'unicité en base sur le créneau : deux clients peuvent valider en même temps |
| Confirmation | Récapitulatif, ce qui va suivre | |
| Compte ou suivi | Ses rendez-vous | Facultatif si tout passe par e-mail |
| Légal | Mentions légales, confidentialité | CGV si le service est payé en ligne |

---

## Back-office

Toujours en plus d'un des cas ci-dessus, jamais seul.

| Page | Rôle |
|---|---|
| Tableau de bord | Ce qu'il faut traiter aujourd'hui, pas des statistiques flatteuses |
| Une liste par modèle métier | Filtres, recherche, pagination au-delà de 40 lignes |
| Formulaires de création et d'édition | Retour visuel systématique |
| Réglages | Les valeurs que le propriétaire doit changer seul |

**Trois règles de sécurité, sans exception.** Le middleware ne vérifie qu'une session, pas
un rôle. Le layout revérifie le rôle. **Et chaque server action le revérifie aussi** : une
server action est une route HTTP publique, appelable sans passer par la page qui l'affiche.

---

## Éditorial / journal

| Page | Rôle | Piège |
|---|---|---|
| Liste | Articles publiés, du plus récent au plus ancien | Pagination au-delà d'une vingtaine |
| Article | Contenu, date, retour | `notFound()` si non publié — **un brouillon ne doit pas être atteignable par URL devinée** |
| Légal | Mentions légales, confidentialité | |

---

## Ce qu'on vérifie sur tout site, quel qu'il soit

- Une page **404 à la charte** — sans elle, un lien mort renvoie sur la 404 générique de Next
- Le lien vers l'espace d'administration, discret mais **trouvable**
- Les coordonnées joignables : téléphone en `tel:`, e-mail en `mailto:`
- Les pages légales atteignables depuis le pied de page de **toutes** les pages
- Les métadonnées : titre et description par page, pas seulement à la racine

## Landing page, page produit — le chemin court

Une page, une action. Le bootstrap y va plus vite, pas moins bien :

| Ce qu'elle contient | Ce qu'on ne fait pas |
|---|---|
| Un héros avec **une** promesse et **une** action | Pas de base de données ni de back-office, sauf si un formulaire collecte des demandes |
| La preuve : chiffres vrais, démonstration, extrait — jamais de témoignage inventé | Pas de navigation multi-pages : des ancres, et le pied de page |
| L'offre, les objections en FAQ, la même action répétée en bas | Un ou deux agents, pas quatre |
| Mentions légales et confidentialité — le formulaire collecte des données | Pas de CGV sans vente |

Le blueprint tient en une page ; le mouvement se concentre sur l'entrée du héros et une
cascade de preuves. C'est le genre de site où `EntreeHero` et `Compteur` font tout le
travail.

## Le socle SEO, quel que soit le genre

Robots, sitemap, image de partage, favicon, métadonnées et canoniques par défaut sont dans
le socle et lisent `lib/site.ts`. Chaque page pose son titre, sa description et sa
canonique ; chaque image son `alt`. Le détail et le partage des rôles — socle, bootstrap,
utilisateur — sont dans `lancement.md`.
