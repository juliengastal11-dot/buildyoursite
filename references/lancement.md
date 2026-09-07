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

## Partager un lien avant la mise en ligne

Mettre en ligne et **envoyer un lien** ne sont pas la même chose. Un site peut avoir besoin
d'être montré à un client, à un associé, à soi-même sur un autre appareil, des semaines avant
qu'on ait choisi un hébergeur. C'est un besoin fréquent, et le refuser sous prétexte qu'« on
ne déploie pas » revient à refuser de montrer son travail.

> **La contrainte d'architecture ne concerne que le lien hébergé.**
>
> Un site avec une base SQLite posée sur le disque et des actions serveur qui écrivent dedans
> **ne se déploie pas** sur un hébergement sans serveur : le disque y est en lecture seule.
> Les contournements existent — reconstruire la base au build, tolérer l'écriture qui échoue —
> mais improvisés à la fin, sous contrainte, ils produisent de mauvaises décisions. Vécu.
>
> **Le tunnel, lui, ne change rien.** Il sert le site tel qu'il est, depuis la machine de
> l'utilisateur, avec sa vraie base et ses écritures qui fonctionnent. Il n'impose aucune
> décision au blueprint, donc **il n'y a rien à demander au début**.
>
> J'ai d'abord placé la question en salve 2, en la justifiant par cette contrainte. C'était
> une erreur de raisonnement : j'ai appliqué au tunnel une limite qui n'appartient qu'au
> déploiement, et j'ai fait poser à l'utilisateur, au moment où il pense à son contenu, une
> question dont la conséquence n'arrive qu'à la remise.

### Deux besoins, deux réponses

| | Le lien éphémère | Le lien qui tient |
|---|---|---|
| **Pour** | « regarde ça, maintenant » | « je t'envoie ça, réponds quand tu peux » |
| **Comment** | un tunnel au-dessus du site compilé, servi depuis la machine | un déploiement chez un hébergeur |
| **Délai** | une trentaine de secondes | quelques minutes, la première fois |
| **Compte** | aucun | une connexion dans le navigateur, que **seul l'utilisateur** peut faire |
| **Ce qui marche** | **tout** — formulaires, back-office, écritures en base | la lecture ; les écritures échouent |
| **Durée de vie** | tant que la fenêtre reste ouverte | des semaines |

**Le tunnel est la réponse par défaut**, et c'est celle à laquelle on ne pense pas en premier.
Servi au-dessus d'un `npm run build && npm start`, il donne le vrai site : l'overlay d'édition
est absent — il est conditionné à `NODE_ENV === "development"` —, la base est la vraie, le
formulaire enregistre pour de bon. Sa limite se dit en une phrase : **le lien meurt quand on
ferme.**

```bash
node "<skill>/scripts/partager.mjs"
```

Le script ne pose aucune question : il regarde ce qui est disponible, choisit le plus simple,
et affiche une URL. Si rien n'est disponible, il imprime la seule commande à lancer.

### Quand on en parle, et comment

**Trois moments, et un seul est une question.**

| Quand | Quoi | Réponse attendue |
|---|---|---|
| Relevé de capacités, phase 0.a | `cloudflared` est-il là ? Une ligne du relevé, `✓` ou `✗` | aucune — c'est une information |
| Pendant `npm install`, phase 0.55 | s'il manque : une ligne avec la commande d'installation, à lancer pendant l'attente | aucune — s'il ne fait rien, on continue |
| À la remise, une fois le site validé | **« Tu veux un lien à envoyer, pour le montrer à quelqu'un ? »** | oui ou non |

Le signalement pendant `npm install` existe pour une raison précise : c'est du temps mort qui
existe déjà, et le seul moment du bootstrap où une action de l'utilisateur ne coûte rien. À la
remise, la même commande arrive quand tout le monde veut voir le résultat, et elle est vécue
comme un obstacle — c'est exactement ce qui s'est passé la première fois.

Mais **ce n'est pas une question**, et ça ne bloque rien : le script réimprimera la commande
le moment venu, et trente secondes plus tard le lien existe.

### Deux précautions qui ne se discutent pas

- **Refus d'indexation.** Tant que `NEXT_PUBLIC_SITE_URL` n'est pas renseignée, le site ne
  connaît pas sa propre adresse : ses URL canoniques pointent sur localhost et il est
  probablement en aperçu. Une copie de travail ne doit jamais concurrencer le vrai site du
  client dans les moteurs.
- **Les marqueurs `[[À CONFIRMER PAR L'UTILISATEUR]]` se listent avant de donner le lien.**
  Sur une machine locale, c'est un pense-bête. Sur un lien envoyé à un client, c'est une note
  de chantier publiée — un relecteur l'a classé défaut le plus sérieux d'un site par ailleurs
  propre.

Et une conséquence sur la vérification : **l'image de partage entre dans l'auto-test.** Quand
on envoie un lien par messagerie, la vignette qui s'affiche *est* `opengraph-image`. Elle est
générée automatiquement, donc jamais regardée.

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
