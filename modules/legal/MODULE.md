# Module `legal` : mentions légales, CGV, confidentialité

**À greffer sur tout site professionnel.** Ce n'est pas un module optionnel comme `stripe`
ou `admin` : sans ces pages, un site professionnel français ne peut pas être mis en ligne.

> Vécu : une boutique complète livrée sans aucune de ces pages. Elle buildait parfaitement
> et était inexploitable. Personne ne l'avait demandé, moi compris.

Je ne suis pas juriste et ceci n'est pas un avis juridique. Les obligations varient selon le
pays et l'activité. Pour un enjeu réel, fais valider. Mais l'absence totale de ces pages,
elle, n'est jamais défendable.

## Ce qu'il faut greffer, selon le site

| Page | Quand |
|---|---|
| `mentions-legales` | **Tout site professionnel** |
| `confidentialite` | **Tout site** qui collecte la moindre donnée : un formulaire de contact suffit |
| `cgv` | **Toute vente en ligne** à des particuliers |
| `cookies` | Seulement s'il y a des traceurs. Un site sans analytics n'en a pas besoin |

## La règle qui compte

**Ces pages ne s'inventent pas.** Tu ne connais ni le SIRET du client, ni son hébergeur, ni
son médiateur de la consommation. Donc :

1. Génère la **structure complète** avec toutes les rubriques attendues.
2. Marque chaque trou franchement : `[[À CONFIRMER PAR L'UTILISATEUR : numéro SIRET]]`.
3. **Liste ces trous dans le blueprint**, et redis-les à la remise.
4. `verifier-projet.mjs` les signale tant qu'il en reste.

**Ne remplis jamais par une valeur plausible.** Un SIRET inventé est bien pire qu'un trou
visible : le trou se voit, l'invention se publie.

## Fichiers

Copier `files/` à la racine du projet. Chaque page est un Server Component qui lit les
coordonnées dans les réglages quand elles existent, et laisse un marqueur sinon.

**Les gabarits ne rendent qu'un `<main>` nu.** Après la copie, habille-les de l'en-tête et
du pied de page du site : ils portent des noms propres au projet, le module ne peut pas les
importer à ta place. Sans ça, on arrive sur les CGV par le pied de page et on ne peut plus
en repartir autrement qu'avec le bouton « précédent ». Pense aussi à l'espace en haut : une
barre de navigation fixe recouvre le titre si la page ne le prévoit pas.

| Fichier | Contenu |
|---|---|
| `app/mentions-legales/page.tsx` | Éditeur, directeur de publication, hébergeur, contact |
| `app/confidentialite/page.tsx` | Données, finalité, base légale, durée, droits RGPD |
| `app/cgv/page.tsx` | Prix, livraison, paiement, rétractation 14 jours, garanties, médiateur |
| `components/sections/liens-legaux.tsx` | Le bloc de liens à poser dans le pied de page |

## Ce qu'il ne faut pas oublier ailleurs

Les **informations précontractuelles** ne vivent pas que dans les CGV. Sur la fiche produit
et dans le tunnel : prix TTC, frais de livraison, délai. Et un récapitulatif avant paiement,
avec un bouton dont le libellé dit explicitement qu'on paie.

Les liens légaux vont dans le **pied de page de toutes les pages**. C'est là qu'on les
cherche, et c'est là qu'ils doivent être.

**Tout chiffre déjà présent dans les réglages se lit, ne se recopie pas.** Frais de port,
seuil de gratuité, adresse, e-mail : les écrire en toutes lettres dans les CGV crée un
document qui contredira le tunnel de commande dès la première modification du gérant. Les
gabarits lisent déjà ce qu'ils peuvent. Vérifie qu'ils lisent tout ce que ce projet
expose.

**Ce que tu peux honnêtement combler toi-même**, sans rien inventer : ce que le site
collecte réellement (le schéma de données le dit), les cookies qu'il pose (le code le dit),
les sous-traitants visibles dans les dépendances (Stripe pour le paiement, par exemple). Ce
qui doit rester un trou : raison sociale, SIRET, TVA, RCS, directeur de publication,
hébergeur, transporteur, médiateur. Personne ne peut les déduire du code.
