# buildyoursite

Un skill Claude Code qui construit un site client complet en une passe, puis vous laisse le
modifier **en cliquant dessus**.

Vous décrivez le site. Il pose la base full-stack — modèles de données, routes API, pages,
design system, mouvement, contenus, serveur lancé, aperçu affiché — avec le paiement Stripe
branché si le site vend. Ensuite vous cliquez sur une zone de la page, vous écrivez ce que
vous voulez changer, et le code change.

Sans quitter le terminal, sans abonnement supplémentaire, sans service en ligne. Le code
reste chez vous, dans un dépôt que vous possédez, avec l'outil que vous avez déjà.

---

## Démarrage rapide

**1.** Dans Claude Code, deux commandes :

```
/plugin marketplace add juliengastal11-dot/buildyoursite
```

```
/plugin install buildyoursite@buildyoursite
```

**2.** Redémarrez Claude Code. Les skills sont recensés au lancement : sans redémarrage, la
commande n'existe pas encore.

**3.** Ouvrez Claude Code **dans le dossier où vous voulez votre site**, et tapez
`/buildyoursite`. Le skill relève ce que votre machine sait faire et vous donne la commande
d'installation à lancer une fois, avec son chemin exact.

**4.** Lancez cette commande, puis retapez `/buildyoursite`. Il vous pose ses questions et
construit.

> **Deux choses à savoir avant de commencer.**
>
> Il faut **Node 20 ou plus**, **git**, et **Python 3** pour le moteur de design. Sans Python
> le skill fonctionne quand même, mais il décide les palettes et les typographies sans base,
> et ça se voit sur le résultat.
>
> Il faut **Opus 5 au minimum, effort `high`**. En dessous, la qualité chute nettement :
> briefs plus courts, moins d'arbitrages, mouvement oublié. Le skill vous le rappelle avant
> de commencer, et vous laisse changer de modèle sans rien perdre.

---

## Ce que ça fait vraiment

**Phase 1 — le bootstrap.** Il relève d'abord ce que la machine sait faire — Node, Python,
git, clé Pexels, générateur d'images connecté quel qu'il soit — et adapte ses questions. Quelques questions, un
blueprint que vous validez si vous le souhaitez, puis la construction : Next.js 15, TypeScript, Tailwind v4, Prisma + SQLite,
authentification si nécessaire, back-office si nécessaire. Plusieurs sous-agents travaillent
en parallèle sur des fichiers disjoints. Il ne vous rend la main que quand `npm run build`
passe et que le serveur tourne. Le socle livre ce qu'un lancement exige — robots, plan du
site, image de partage, favicon, métadonnées et canoniques — et le blueprint liste ce qui ne
peut venir que de vous, marqué « à confirmer par l'utilisateur ».

**Phase 2 — l'édition visuelle.** Un overlay injecté en développement uniquement. Survol :
la zone se surligne. Clic : elle se fige et une bulle s'ouvre. Vous écrivez, vous pouvez
joindre une image, vous validez. Les commentaires s'empilent avec une pastille numérotée,
puis partent en lot — une pastille se clique pour corriger ou retirer son commentaire.
Après l'envoi, une comète tourne autour de la barre jusqu'à ce que Claude ait pris la main,
puis il applique.

**S'inspirer d'un site existant.** Donnez une URL : il **mesure** la charte plutôt que de la
deviner — palette relevée sur les styles calculés, typographie réellement rendue, géométrie
(rotations, rayons, ombres), liens sortants et leurs paramètres, photos et leurs textes
alternatifs, cadrage, et le mouvement (défilement fluide, parallaxe, apparitions).

Avec un garde-fou : il vous demande d'abord **si le site vous appartient**. Sinon, il ne
reprend que la forme — jamais les textes, les photos, les liens ni les coordonnées.

---

## Prérequis

| | |
|---|---|
| Node | 20 ou plus |
| git | pour la bibliothèque de design |
| Python 3 | utilisé par UI/UX Pro Max — facultatif, mais sans lui vous perdez le moteur de décision design |
| Claude Code | avec accès au panneau navigateur intégré |
| Le modèle | **Opus 5 au minimum**, effort `high` — voir ci-dessous |

### Le modèle compte, et ça se voit sur le résultat

Construire un site complet est une tâche agentique longue : des heures de travail suivi, des
sous-agents à piloter, des décisions de design, des textes cohérents d'une page à l'autre.
Le modèle qui orchestre fait la différence entre un premier jet qu'on retouche et un premier
jet qu'on jette.

| Modèle et effort | Pour quoi |
|---|---|
| **Fable 5.1**, `high` ou `xhigh` | Idéal — boutique, application, tout projet où l'on veut le moins de reprises |
| **Opus 5**, `xhigh` | Le bon choix par défaut |
| **Opus 5**, `high` | Le minimum acceptable — c'est le défaut de Claude Code sur les offres Max |
| **Sonnet 5**, `xhigh` | Dépannage, sur une vitrine simple, avec plus de supervision |
| Sonnet en dessous, **Haiku** | Non : un site complet dépasse ce qu'ils peuvent tenir |

Réglez-le avant de lancer : `/model opus` puis `/effort xhigh`. Les sous-agents que le skill
lance restent sur Sonnet — c'est voulu, leurs briefs sont détaillés et leur travail est de
l'exécution.

**Une fois le site créé, Sonnet 5 suffit pour les modifications au clic** : le code existe,
le commentaire dit quoi changer, le fichier visé est souvent déjà connu. `/model sonnet`
après le bootstrap va plus vite et coûte bien moins. Repassez sur Opus si un retour demande
une décision de structure ou de design plutôt qu'une retouche.

> **N'utilisez pas `ultracode`.** C'est une fausse bonne idée : on choisit le réglage le
> plus puissant en pensant bien faire, et on obtient l'inverse. `ultracode` monte l'effort
> à `xhigh` — parfait — **mais il fait aussi orchestrer des workflows dynamiques**, qui
> lancent leurs propres sous-agents et redécoupent le travail. Or ce skill a déjà son
> découpage, affiné sur de vraies constructions : qui écrit quoi, avec des périmètres de
> fichiers exclusifs. Les sous-agents d'`ultracode` ne les connaissent pas et écriraient
> par-dessus les nôtres. `/effort xhigh` donne la même profondeur, sans le conflit.

## Installation

Depuis Claude Code, sans quitter le terminal :

```
/plugin marketplace add juliengastal11-dot/buildyoursite
```

```
/plugin install buildyoursite@buildyoursite
```

Ou à la main, si vous préférez maîtriser l'emplacement :

```bash
git clone https://github.com/juliengastal11-dot/buildyoursite ~/.claude/skills/buildyoursite
```

Dans les deux cas, **redémarrez Claude Code**, puis tapez `/buildyoursite`. Le skill relève
les capacités de la machine et vous dit quoi lancer s'il manque quelque chose, avec le
chemin exact.

### L'installeur

```bash
node scripts/installer.mjs
```

Il vérifie les prérequis, clone
[UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) dans `lib/`, et vous
demande où vous rangez vos sites d'habitude. Relancez-le quand vous voulez : il met à jour
au lieu de réinstaller.

Vos données vivent dans `~/.claude/buildyoursite`, **en dehors du skill**. Une mise à jour
du plugin remplace le code sans toucher à votre configuration ni à la bibliothèque de
design, qui pèse plusieurs centaines de mégaoctets et n'a pas à être retéléchargée. Pour
les ranger ailleurs, posez la variable d'environnement `BUILDYOURSITE_DATA`.

Non interactif :

```bash
node scripts/installer.mjs --racine "C:\Sites" --appellation "Chef"
```

## Utilisation

Ouvrez Claude Code dans le dossier où vous voulez votre site — il sera créé là, dans un
sous-dossier à son nom — puis :

```
/buildyoursite
```

Répondez aux questions, laissez construire. Quand l'aperçu s'affiche, basculez la barre en
bas à droite sur **Édition** et cliquez sur ce que vous voulez changer.

---

## Architecture

| | |
|---|---|
| `SKILL.md` | Le comportement : phases, règles, garde-fous |
| `~/.claude/buildyoursite/` | Vos données : `config.json` et la bibliothèque de design. **Hors du skill**, pour survivre à ses mises à jour |
| `socle/` | La base Next.js, avec l'overlay et les primitives de mouvement |
| `modules/` | Greffes : authentification, paiement, back-office, **pages légales** |
| `references/` | Structures par type de site, relevé de charte, vérification du rendu, overlay |
| `scripts/` | Installeur, lanceur de dev, blueprint, photos provisoires et leur planche-contact, contrôles automatiques |
| `DECISIONS.md` | Ce que le dépôt fait et ne fait pas, et pourquoi |
| `AMELIORATIONS.md` | Le journal des incidents réels et de ce qu'ils ont changé |
| `~/.claude/buildyoursite/ui-ux-pro-max/` | Dépôt externe, cloné par l'installeur, jamais versionné ici |

Trois fichiers valent le détour si vous voulez comprendre l'esprit du projet :
**`references/releve-complet.js`**, qui mesure les six dimensions d'une charte en un
passage — palette, typographie, géométrie, liens, photos et leur cadrage, mouvement ; **`scripts/verifier-projet.mjs`**, qui refuse ce qu'aucun build ne signale ; et
**`AMELIORATIONS.md`**, qui raconte chaque erreur commise et la règle qui en est sortie.

## Ce que ça ne fait pas

- **Aucune mise en ligne.** Le projet reste chez vous, avec son propre dépôt git et ses
  points de restauration. Aucun compte n'est ouvert en votre nom, aucun hébergeur n'est
  choisi à votre place, et si un déploiement devient nécessaire, c'est vous qui tapez la
  commande.

  En revanche, **vous pouvez envoyer un lien** à un client ou à un associé pendant la
  construction, sans rien héberger : `scripts/partager.mjs` sert votre site compilé derrière
  une adresse publique temporaire, formulaires et back-office compris. Le lien meurt quand
  vous fermez la fenêtre — c'est un aperçu, pas une publication.
- **Aucune copie de site tiers.** Le skill refuse de proposer la reproduction fidèle d'un
  site qui ne vous appartient pas.
- **Aucun prestataire imposé, aucun lien affilié.** Le projet ne pousse ni hébergeur ni
  service, et le skill ne touche aucune commission. L'hébergement reste votre choix. Si le
  site vend, **Stripe est branché d'office**, en Checkout hébergé, ses clés laissées vides :
  le compte et les frais sont les vôtres, et le site ne voit jamais un numéro de carte. Le
  skill vous le rappelle à la remise. Un autre prestataire reste possible, le tunnel est du
  code ordinaire.

## Limites connues, honnêtement

- **Éprouvé sur Windows.** Les scripts gèrent macOS et Linux, mais n'y ont pas été testés.
- **Français par défaut.** `config.json` a une clé `langue`, mais les gabarits et les
  contenus générés sont pensés en français.
- **Quatre bootstraps complets à ce jour** : une vitrine reprenant la charte d'un site de
  référence, une boutique dont l'identité vient entièrement du design system, un site de
  réservation, et une vitrine avec back-office refaite à partir du site existant du client.
  Tous ont laissé leurs cicatrices dans `AMELIORATIONS.md`.
- **Le partage d'un lien demande un outil de tunnel** installé sur la machine. Sans lui, le
  script vous donne la commande d'installation et s'arrête là : il n'installe rien à votre
  place.
- **Les pages légales sont des gabarits**, pas des documents prêts. Elles portent des
  marqueurs `[[À CONFIRMER PAR L'UTILISATEUR]]` que le contrôle automatique signale tant qu'ils restent. Rien
  n'y est inventé — un SIRET plausible serait pire qu'un trou visible.
- **Les photos provisoires viennent d'une archive.** Sans clé Pexels (gratuite), elles sont
  cherchées sur Openverse, qui respecte le sujet mais mélange photographies, gravures et
  scans. Le skill les filtre puis **les regarde** sur une planche-contact avant de les
  garder — sur onze photos, le premier jet en avait six de fausses, dont le portrait d'une
  personne identifiable. Ce contrôle visuel n'est pas optionnel.

## Licence et crédits

MIT — voir [LICENSE](LICENSE).

Le moteur de décision design est [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
de nextlevelbuilder, également sous MIT, cloné localement et volontairement non inclus dans
ce dépôt.
