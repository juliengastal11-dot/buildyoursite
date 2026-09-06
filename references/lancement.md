# Avant de mettre un site en ligne — ce qui est fait, par qui

Vingt choses qu'un site doit avoir avant d'être publié. Le tri qui compte n'est pas la liste,
c'est **qui s'en charge** : le socle en assure une partie tout seul, le bootstrap en fait une
autre, et le reste ne peut venir que du propriétaire du site — ces points-là sont écrits
`[[À CONFIRMER PAR L'UTILISATEUR : …]]` dans le code, et le garde-fou les signale tant qu'ils
y sont.

Le blueprint porte une section **« SEO et lancement »** qui reprend ce tableau pour le
projet : ce qui est couvert, ce qui reste, et pourquoi.

## Assuré par le socle, sans rien faire

| | Où | Ce que ça fait |
|---|---|---|
| Titres et descriptions | `app/layout.tsx` + `lib/site.ts` | Un gabarit `%s — Nom du site`, une description par défaut. Chaque page pose les siennes |
| Partage sur les réseaux | `app/opengraph-image.tsx` | L'image générée aux couleurs du projet, titre et description Open Graph, carte Twitter |
| Favicon | `app/icon.svg` | Un pastille neutre. **À remplacer par le monogramme de la marque au bootstrap** |
| `robots.txt` | `app/robots.ts` | Tout autorisé sauf back-office, API, espace client, tunnel, blueprint |
| `sitemap.xml` | `app/sitemap.ts` | Les pages fixes de `lib/site.ts`. Les fiches lues en base s'ajoutent au bootstrap |
| URL canoniques | `metadataBase` + `alternates.canonical` | La racine par défaut ; chaque page déclare la sienne |
| Page 404 | `app/not-found.tsx` | Dans la charte, avec un retour à l'accueil |
| Pages légales | `modules/legal` | Mentions, confidentialité, CGV — avec les trous marqués |
| Mobile | Tailwind, `Photo`, primitives | Tout est fluide par construction ; l'auto-test le vérifie à 375 px |

## Fait au bootstrap, par toi — et vérifié

| | Comment | Vérifié par |
|---|---|---|
| `lib/site.ts` renseigné | nom, description en une phrase, pages publiques, couleurs de partage | relecture |
| Une `metadata` par page | `title`, `description`, `alternates.canonical` — exigés dans chaque brief | `verifier-projet.mjs` |
| Un `alt` par image | vide seulement si décorative, et le brief dit laquelle l'est | `verifier-projet.mjs` |
| Une action claire par page | la règle « une page, une action » de la phase 0.58 | relecture du blueprint |
| Une FAQ sur les vraies objections | phase 0.58 | relecture |
| Formulaires testés | jusqu'à l'état de succès et l'état d'erreur | auto-test |
| Aucun lien mort | chaque bouton et chaque lien cliqués | auto-test |
| Accessibilité de base | landmarks, hiérarchie de titres, focus visible, contrastes, cibles tactiles | auto-test |
| Performance | images passées par `next/image`, tailles réelles, `npm run build` sans avertissement | build + auto-test |

## À confirmer par l'utilisateur — rien ne s'invente

| | Pourquoi personne d'autre ne peut |
|---|---|
| L'URL publique (`NEXT_PUBLIC_SITE_URL`) | Elle n'existe qu'au moment de la mise en ligne. Sans elle, canoniques et sitemap pointent sur localhost |
| SIRET, raison sociale, TVA, hébergeur, médiateur | Des faits sur l'entreprise, marqués dans les pages légales |
| **Analytics** | Le socle n'en installe pas : sans traceur, **aucun bandeau de consentement n'est nécessaire**, et la page de confidentialité le dit. Si le propriétaire en veut, préférer un outil sans cookie ; avec cookies, le bandeau devient obligatoire et la page de confidentialité change |
| Le favicon définitif | Le monogramme, c'est lui qui l'a |
| Le nom de domaine et l'hébergement | On ne déploie pas |
| Le compte Stripe, s'il y a une vente | Le module est branché en Checkout hébergé, ses clés restent vides. Le compte, les clés et les frais sont ceux du propriétaire |

## Rien n'est imposé, et rien n'est rémunéré

Ces deux lignes ne sont pas des trous dans la livraison, ce sont des choix. Le skill
n'installe aucun traceur, ne pousse aucun hébergeur, n'ouvre aucun compte et ne glisse aucun
lien affilié dans le projet. Le code est prêt à recevoir des clés de paiement et à être
publié n'importe où ; le propriétaire décide chez qui, et paie qui il veut. Le dire à la
remise évite qu'il cherche une étape manquante là où il y a une porte ouverte.

**Stripe est le seul prestataire de paiement livré**, et c'est un choix de simplicité, pas
une exclusivité : le Checkout hébergé évite au site de voir un numéro de carte, donc évite
au propriétaire toute la conformité qui va avec. Rien n'empêche d'en brancher un autre, le
tunnel est du code ordinaire. Sur un site qui ne vend pas, le module n'est pas installé du
tout et peut se greffer plus tard sans reconstruire.

## Ce qu'on n'ajoute pas par défaut, et pourquoi

- **Pas de bandeau cookies** tant qu'il n'y a pas de cookie qui le justifie. En poser un « au
  cas où » est faux et agaçant. La page de confidentialité dit précisément ce qui est posé —
  le panier et la session — et pourquoi il n'y a rien à consentir.
- **Pas d'analytics** sans demande. C'est une décision du propriétaire, avec des conséquences
  juridiques.
- **Pas de textes SEO** — paragraphes de mots-clés que personne ne lit. Un titre juste, une
  description honnête, du vrai contenu : c'est ce qui se référence.
