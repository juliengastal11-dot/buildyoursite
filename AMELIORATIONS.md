# Journal d'améliorations — /buildyoursite

Tenu pendant les vrais bootstraps. Chaque entrée dit **ce qui s'est passé**, pas ce qui
pourrait théoriquement mal tourner.

> La commande s'appelait `/newsite` pendant le premier bootstrap, et a été renommée
> `/buildyoursite` à la fin de celui-ci, avant publication. Les entrées ci-dessous portent
> le nom actuel : lis `buildyoursite` là où il était écrit `newsite`.

---

# Bootstrap #1 — site vitrine de coach sportif (2026-09-03)

Premier usage réel. Référence imposée par le client, module back-office, entrée admin
discrète en pied de page, réservation de créneaux de 30 min.

## Corrigé à chaud

| # | Problème | Cause | Correction | Détecté par |
|---|---|---|---|---|
| 1 | L'overlay postait dans le vide | `app/api/__buildyoursite/` — Next.js **exclut du routage tout dossier commençant par `_`**. La route n'existait pas. | Renommé `/api/buildyoursite` | le build (route absente de la liste) |
| 2 | La page de connexion ne compilait pas | En Next 15, `searchParams` est une **promesse** ; `useSearchParams` exige une frontière `Suspense` | Page serveur + formulaire client séparés | anticipé avant build |
| 3 | Redirection ouverte | `?suite=` réinjecté tel quel dans `redirectTo` | Seuls les chemins internes sont acceptés (`/…` mais pas `//…`) | relecture |
| 4 | Inscription publique inutile | Le module auth livrait `/inscription` : n'importe qui pouvait créer un compte | Page retirée du module, action `inscription` supprimée | relecture |
| 5 | Route protégée fantôme | `middleware.ts` protégeait `/compte`, qui n'existe dans aucun projet | `PROTECTED = ["/admin"]` | relecture |
| 6 | Deux sous-agents morts | Lancés sur Opus → **529 Overloaded**, deux fois de suite | Sous-agents sur `sonnet` par défaut, règle inscrite dans `SKILL.md` | notification d'échec |
| 7 | Fichier `.tmp` résiduel | Fausse écriture atomique : `writeFile(tmp)` puis `writeFile(final)` | `rename(tmp, final)` — vraie atomicité, vérifiée sur Windows | test manuel |

## Ce qui a marché — à ne pas casser

Aussi important que les ratés, parce que c'est ce qu'il faut préserver en corrigeant le reste.

**Les briefs détaillés paient.** Huit fichiers de section produits par deux agents Sonnet
indépendants, plus mes fichiers-contrats : **une seule erreur de type sur tout le projet**,
et c'était le module pas encore écrit. Aucune couleur en dur, aucun emoji, aucun lorem ipsum,
`"use client"` exactement là où il fallait et nulle part ailleurs, `data-photo-slot` bien
posés, contrats d'API respectés.

Ce qui a produit ce résultat, et qu'il faut garder :

- **La copie mot pour mot dans le brief.** Aucun agent n'a eu à inventer du texte, donc
  aucun n'a inventé de mauvais texte.
- **La liste des classes disponibles, écrite en clair dans le brief.** Personne n'est allé
  chercher un hex.
- **Le périmètre de fichiers exclusif.** C'est ce qui a rendu le conflit visible plutôt que
  silencieux.
- **Les fichiers-contrats écrits par l'orchestrateur avant le lancement** — thème, schéma,
  helpers de date, assemblage. Les agents ont construit contre une cible fixe.
- **Les formateurs de date centralisés** (`formatJour`, `formatHeure`, `cleJour`), imposés
  dans chaque brief. Personne n'a appelé `toLocaleDateString` à sa sauce, donc aucun risque
  d'erreur d'hydratation serveur/navigateur.

**Les agents ont aussi rattrapé mes trous de brief**, et l'ont dit :
`<select required>` sans option vide désactivée est toujours valide — donc `required` ne
sert à rien ; la variante `outline` disparaît sur fond sombre ; les cartes `bg-card` posées
sur une section `bg-card` se fondent dans le fond. Trois défauts que je n'avais pas vus.
Exiger un rapport d'arbitrages en fin de brief n'est pas une formalité : c'est là que ces
choses remontent.

## Troisième leçon : j'ai cassé le site de l'utilisateur avec `npm run build`

L'utilisateur m'écrit : « le lien localhost:3000 a planté, le site ne s'affiche pas correctement et n'est
pas modifiable. » Cause :

```
⨯ Error: ENOENT: no such file or directory, open '.next\server\vendor-chunks\@swc.js'
```

**J'ai lancé `npm run build` deux fois pendant que `npm run dev` tournait.** Les deux
écrivent dans `.next` et se corrompent mutuellement. Le serveur continuait de répondre 200
sur `/`, mais renvoyait 500 sur `/connexion` et **annonçait une feuille de style qu'il ne
produisait plus** : le site s'affichait entièrement sans CSS, fond noir et liens bleus.

Aucune erreur ne remonte au build. C'est l'utilisateur qui l'a vu.

Règle inscrite dans le `SKILL.md` : tuer le serveur → `rm -rf .next` → `npm run build` →
relancer.

**Correction ultérieure :** j'avais d'abord écrit « ou `npx next build --distDir .next-verif`
pour vérifier sans interrompre la preview ». **Faux** — `next build` n'accepte pas ce drapeau
en ligne de commande, c'est une option de `next.config`. Le vrai outil de contrôle pendant
que le serveur vit, c'est `npx tsc --noEmit`, qui ne touche pas à `.next`.

**Corollaire sur le diagnostic.** J'ai d'abord annoncé « voilà ton bug, le CSS est cassé »
en me fondant sur des 404 lus dans le journal réseau. C'était faux : ces 404 portaient des
horodatages **antérieurs** à ma purge, et le panneau affichait un rendu périmé. Un appel
direct montrait la feuille servie en 200 avec 58 Ko.

Un journal réseau est un historique, pas un état. **Avant de conclure, refais l'appel.**

## Deuxième leçon nette : ne pas confondre « je n'ai pas » et « je n'ai pas cherché »

J'ai posé des dégradés à la place des photos, et je l'ai **écrit dans le blueprint comme une
limite** : « le site de référence utilise des photos que je n'ai pas ». L'utilisateur a dû me
demander si c'était volontaire ou un oubli.

C'était ni l'un ni l'autre : c'était une hypothèse fausse que j'avais présentée comme un
fait. Les neuf photos étaient servies en clair par le site de référence. Un `curl` a suffi.
Mieux : leurs **textes alternatifs disaient où chacune allait**, ce qui m'a permis de les
placer toutes sans poser une question.

Ce qu'il faut en tirer, au-delà des photos :

- **Une hypothèse écrite dans le blueprint n'est pas une excuse.** Elle doit être une
  affirmation qu'on a essayé de vérifier, pas une renonciation habillée en constat.
- Avant d'écrire « je n'ai pas X », essaie d'avoir X. Trente secondes de `curl`.
- Formuler proprement une limite fausse la rend **plus** dangereuse, pas moins : elle a l'air
  d'une décision réfléchie et personne ne la conteste.

Recette de récupération écrite dans `references/extraction-charte.md`, section 8.

## La leçon la plus nette du test

**L'orchestrateur ne doit pas toucher un fichier qu'il a confié à un agent encore en vie.**

J'avais écrit cette règle dans ce journal, et je l'ai enfreinte vingt minutes plus tard.
Voyant `contact.tsx` déjà sur le disque, j'ai conclu que l'agent en avait fini et j'y ai
ajouté une prop `whatsapp`. L'agent tournait toujours : il a détecté la modification
extérieure, l'a — correctement, selon son brief — annulée, et m'a signalé le conflit dans
son rapport final. Résultat intermédiaire : `page.tsx` passait une prop que le composant
n'acceptait plus, donc une erreur de type.

Ce qu'il faut retenir, et inscrire dans le `SKILL.md` :

- **Un fichier présent sur le disque ne veut pas dire un agent terminé.** Le seul signal
  fiable est la notification de fin.
- Toute correction sur un fichier confié attend cette notification. Sans exception.
- Si la correction ne peut pas attendre, elle passe par un `SendMessage` à l'agent, pas par
  une édition directe.
- Le bon réflexe de l'agent — signaler le conflit au lieu de le subir en silence — vient du
  fait que son brief listait un périmètre exclusif. Cette clause n'est pas de la paperasse :
  c'est elle qui a rendu le conflit visible.

## Révision décidée en cours de test : annonce du déroulé + validation du blueprint

**Appliqué immédiatement**, parce que le bootstrap venait d'en démontrer le besoin.

Au départ, L'utilisateur avait choisi « blueprint affiché, mais j'enchaîne ». Le premier vrai
bootstrap a montré la faille : mon `BLUEPRINT.md` contenait **quatre hypothèses jamais
validées** — que le site de référence lui appartenait, qu'aucun service d'e-mail n'était
disponible, que les photos seraient des remplaçants, et que les créneaux seraient
exclusivement de 30 min. Sur un livrable client, une seule de ces quatre peut coûter une
demi-journée de reprise.

Deux changements, complémentaires :

**1. Annonce du déroulé, avant toute question** (nouvelle phase 0.a).
Quelques lignes qui disent ce qui va se passer et où l'utilisateur peut reprendre la main.
Coût nul, et ça évite de le laisser sans repère pendant vingt minutes de construction.

**2. Une question fixe dans la première salve** : « souhaites-tu valider le blueprint avant
que je construise ? ». Le choix, et donc la responsabilité, lui reviennent — c'est ce qu'il
a demandé explicitement. Défaut recommandé : oui.

Conséquence à surveiller : la salve d'`AskUserQuestion` est plafonnée à 4 questions, dont
**deux sont maintenant fixes** (inspiration + validation). Il ne reste que deux questions
libres. C'est contraignant, et c'est sain : ça force à ne demander que ce qui change
vraiment l'architecture.

Et quand la validation est demandée : **une seule interruption**. Le blueprint, son résumé,
les hypothèses et les questions ouvertes partent ensemble. Pas trois allers-retours.

## Confirmé deux fois : les heredocs Bash cassent sur le français

J'ai perdu un appel d'outil là-dessus en construisant l'overlay ; **l'agent réservation a
buté sur la même chose**, indépendamment, en écrivant `reservation-form.tsx`. Deux
occurrences, même cause : un heredoc Git Bash dont le contenu mêle apostrophes françaises
et guillemets casse le parsing du shell, même en délimiteur cité (`<<'EOF'`).

Règle à inscrire dans le `SKILL.md` : **tout fichier contenant du texte français — code
commenté, copie, libellés — s'écrit avec l'outil `Write`, jamais par heredoc.** Les heredocs
restent bons pour du JSON, des configs et des scripts sans accents.

C'est le genre de détail qui coûte un aller-retour à chaque agent, à chaque projet.

## Le port occupé : d'une règle à une réparation

L'utilisateur m'écrit : « consigne ça pour que si cela se reproduise tu répares automatiquement ».

J'avais écrit une règle — vérifier le port avant, lire la ligne `Local:` après. Une règle
qu'il faut penser à appliquer n'est pas une réparation. C'est devenu
`scripts/demarrer-dev.mjs`, appelé à la place de `npm run dev`.

Deux branches, **toutes deux éprouvées en conditions réelles** :

| Situation | Comportement |
|---|---|
| Serveur Next abandonné sur le port | Terminé, redémarrage sur le même port |
| Processus inconnu | **Épargné**, décalage sur le port suivant, coupable nommé dans le message |

Testé avec un faux service sur 3001 : le script l'a nommé (`node faux-service.mjs`), ne l'a
pas tué, et a démarré sur 3002. Le service tournait toujours après.

Il affiche `BUILDYOURSITE_URL=http://localhost:<port>` dès que le serveur répond — c'est
cette ligne qu'on lit, jamais le port supposé.

**Deux pièges rencontrés en l'écrivant, tous deux consignés :**

`spawn EINVAL` sur Windows. Depuis Node 18.20 / 20.12, `spawn` refuse de lancer un `.cmd`
— donc `npm.cmd` — sans `shell: true`. Le message d'erreur ne dit rien de la cause.

**Les heredocs de ce shell mangent les antislashs, même entre quotes simples.** Ma regex
`[\\/\s]` arrivait en `[\/\s]` dans le fichier de test, donc sans les antislashs, donc sans
matcher les chemins Windows. J'ai cru à une regex fausse et j'ai commencé à la « corriger » —
elle était juste, c'était le banc de test qui était corrompu. Réécrit avec `Write` : 8 cas
sur 8, aucun faux positif.

La reconnaissance d'un serveur Next porte sur le **segment de chemin** `…\node_modules\next\…`
et non sur une sous-chaîne : un `includes("next")` tuerait un processus `nextcloud`. La
vraie ligne de commande ne contient d'ailleurs pas « next dev » mais
`next\dist\server\lib\start-server.js`.

### Et mon propre test de sécurité a cassé le site

Le test « ne tue pas l'inconnu » a démarré un **second serveur Next sur le même projet**,
port 3002 pendant que le premier tenait 3000. Cinq minutes plus tard, `/` renvoyait 404
pendant que `/admin` et `/blueprint` répondaient — et `tsc` était vert.

**Deux serveurs Next partagent `.next` et se corrompent mutuellement.** Je connaissais la
version `build` pendant `dev` ; la version `dev` pendant `dev` est identique et je ne l'avais
pas vue. Aucune erreur ne remonte, le typecheck ne voit rien : ça se manifeste par des routes
qui tombent une à une.

Deux corrections dans le lanceur, toutes deux nées de cet incident :

**Il tuait n'importe quel serveur Next, y compris celui d'un autre projet.** Beaucoup trop
agressif — j'aurais coupé le serveur de quelqu'un travaillant à côté. Il compare désormais
la ligne de commande à `process.cwd()` : notre projet, on termine ; un autre projet, on
n'y touche pas et on se décale.

**Il acceptait de démarrer un doublon.** Avant de lancer, il balaie 3000-3010 et termine
tout serveur de *ce* projet trouvé ailleurs. C'est la garantie qu'on ne peut plus provoquer
la corruption qu'on vient de subir.

## Garde-fou sur l'appropriation — soulevé par l'utilisateur, appliqué

L'utilisateur m'écrit : « si demain un utilisateur te met un site très connu en référence et ne fait pas
attention, tu risques de coller des liens qui amènent vers tout autre chose. »

Il a raison, et **le problème est plus large que les liens.** Sur ce bootstrap j'ai repris
du site de référence : les textes mot pour mot, les neuf photos, le numéro de téléphone,
et les liens. C'était légitime — le site est le sien. Sur le site d'un tiers, les photos et
les textes seraient une contrefaçon, et les liens enverraient les visiteurs du client vers
le WhatsApp d'un inconnu.

Ce qui rend ça dangereux : **rien ne se voit à la relecture du code.** Un `href` correct
syntaxiquement, une photo qui s'affiche bien, un texte impeccable. Ça se voit en production,
chez le client.

Deux questions ajoutées en phase 0.c, posées **avant** de relever quoi que ce soit :

1. **Ce site t'appartient-il ?** — gouverne tout le reste.
2. **Je reprends les liens sortants ?** — posée même quand le site est le sien : il peut
   vouloir un autre compte, un autre numéro, ou pas de réseaux sur ce site-là.

Et un tableau qui tranche élément par élément : palette, typo, géométrie et **plan de page**
se reprennent toujours — un langage visuel et un squelette de page ne s'approprient pas.
Textes, photos, liens, coordonnées, nom et marque, jamais d'un site tiers.

La règle en une phrase : **d'un site qui n'est pas le sien, on reprend la forme, jamais ce
qui identifie son propriétaire ni ce qui lui appartient.**

## Socle complété — les points 4, 4 bis et 5 sont réglés

Les quatre agents avaient buté sur les mêmes manques et les avaient contournés chacun à sa
façon. Ajouté au socle, vérifié sur le premier bootstrap :

| Composant | Ce qu'il supprime |
|---|---|
| `Button` avec `asChild` | Les `<a>` stylés à la main. Un CTA qui navigue est maintenant un vrai lien : `<Button asChild shape="pill"><a href="…">…</a></Button>` |
| `shape="pill"` | Les `cn(buttonVariants(...), "rounded-full")` répétés à chaque usage |
| `variant="onDark"` / `onDarkSolid` | Le recoloriage manuel de `outline`, invisible sur un héros sombre |
| `Input`, `Textarea`, `Select` | Les classes `champ` réinventées en dur dans chaque formulaire. Styles partagés via `champStyles`, un seul endroit à ajuster |
| `Select` avec `placeholder` | L'oubli de l'option vide désactivée, sans laquelle `required` ne sert à rien — le piège que l'agent du bas de page avait repéré seul |
| `Field` | Le placeholder-en-guise-de-libellé. Le `<label>` est obligatoire, et `id` / `aria-invalid` / `aria-describedby` sont câblés automatiquement |
| `Section` | Les `py-20` / `py-24` / `py-32` divergents d'une section à l'autre, et l'`aria-labelledby` que tout le monde oublie |

Une dépendance ajoutée : `@radix-ui/react-slot`, pour `asChild`. C'est ce que shadcn/ui
utilise, donc `npx shadcn add` reste compatible.

**Vérifié** : `tsc --noEmit` à zéro erreur, et le CTA du héros rendu en
`<a href="#reservation" class="… bg-accent … rounded-full h-12 px-8">`. Le CTA de la barre
de navigation a profité des nouvelles variantes sans être retouché, l'agent ayant utilisé
`buttonVariants`.

**Reste sur le socle** : `CONTEXTE.md` généré au bootstrap (point 8 ci-dessous), qui
économiserait aux agents la relecture de `globals.css`, `button.tsx` et `package.json`.

## À faire — priorité haute

### 1. Pro Max ne parle qu'anglais
Ma requête `"prise de rendez-vous creneaux horaires"` a renvoyé **0 résultat**. La même en
anglais a donné trois guidelines utiles. Le `SKILL.md` doit imposer : **requêtes Pro Max
toujours en anglais**, quelle que soit la langue du projet.

### 2. La phase 0.5 a besoin de deux branches
Le skill dit « Pro Max est ta source de vérité design ». C'est faux quand le client dit
« garde les couleurs et la mise en page ». Il faut :
- **branche A — pas de référence** : `--design-system` décide tout, comme aujourd'hui.
- **branche B — référence fournie** : la charte extraite de la référence fait loi ; Pro Max
  n'intervient plus que sur les parties **nouvelles** (ici la réservation) et sur les
  guidelines de qualité (`--domain ux`).

### 3. Écrire une recette d'extraction de charte
J'ai improvisé une chaîne entière, alors que c'est reproductible. À figer dans
`references/extraction-charte.md` :
1. `WebFetch` échoue sur une SPA — on récupère « Loading… ». Ne pas s'arrêter là.
2. Passer par le navigateur intégré, laisser 4-10 s de rendu.
3. Si le DOM est vide : le site est dans une **iframe**. Lister les iframes en JS.
4. Iframe cross-origin → trouver le vrai domaine. Les plateformes d'aperçu empilent
   souvent deux shells avant le vrai site, servi par un sous-domaine dédié ; charger cette
   URL au niveau supérieur.
5. Lire les **styles calculés** (`getComputedStyle`) des éléments clés — c'est la seule
   source fiable. Les variables CSS `:root` mentent : ici, les tokens shadcn annonçaient
   une couleur d'accent qu'aucun CTA n'utilisait — la leur était posée en valeur arbitraire.
6. Récupérer les polices réellement appliquées, pas celles importées.

### 4. Le socle manque de composants de formulaire
`components/ui/` n'a que `button` et `card`. Résultat : chaque agent réinvente sa propre
classe `champ` en dur, et les formulaires du site divergent. À ajouter : `input`, `label`,
`select`, `textarea`, `field` (label + champ + message d'erreur).

### 4 bis. `Button` est inutilisable pour un CTA qui navigue
Remonté spontanément par l'agent haut de page, qui a dû le contourner :

- `buttonVariants` code en dur `rounded-lg`, alors que **tous les CTA de ce site sont des
  pilules**. L'agent a dû écrire `cn(buttonVariants({...}), "rounded-full …")` en comptant
  sur `tailwind-merge` pour évincer `rounded-lg`. Ça marche, mais chaque agent refait ce
  bricolage à sa façon.
- `Button` ne rend qu'un `<button>` : **pas de support `asChild`**. Or ici tous les CTA sont
  des ancres. L'agent a donc écrit des `<a>` stylés à la main pour garder la sémantique de
  lien plutôt que de simuler la navigation en JS. Bon réflexe, mais il n'aurait pas dû avoir
  à choisir.
- La variante `outline` est calibrée pour fond clair (`border-border`, `hover:bg-muted`) et
  devient **invisible sur le héros sombre**. L'agent l'a recolorée à la main.

À corriger dans le socle : `asChild` (Slot Radix) ou un export `linkVariants`, une variante
`pill`, et des variantes pensées pour fond sombre. Trois manques, trois contournements
improvisés, trois occasions d'incohérence entre sections.

### 4 ter. Tailwind 4.3 a renommé les classes de dégradé
`bg-gradient-*` est devenu `bg-linear-*` en v4. L'agent, ne pouvant pas lancer de build pour
vérifier, a préféré des dégradés en `style` inline — prudent et correct, mais le socle
devrait simplement documenter les bons noms de classes pour la version qu'il embarque.

### 5. Le socle manque un composant `Section`
Chaque agent refait son propre rythme vertical (`py-20`, `py-24`, `py-32`…). Incohérence
garantie entre sections. Un `<Section id eyebrow titre>` réglerait le rythme une fois.

### 6. `.claude/settings.json` dans le socle — **à vérifier, pas observé**
J'avais noté « chaque commande npm redemande une permission ». **C'est faux dans ce test** :
les réglages globaux de l'utilisateur sont en `bypassPermissions`, je n'ai eu aucune interruption.
L'intérêt d'un `settings.json` dans le socle est donc ailleurs — projet ouvert depuis une
session cloud, une autre machine, ou par quelqu'un d'autre. Priorité basse, à trancher.

## À faire — priorité moyenne

### 7. npm 11 bloque les scripts d'installation
`npm install` affiche `allow-scripts` et n'exécute pas les postinstall — dont celui de
Prisma. `npx prisma generate` rattrape le coup, mais c'est un piège silencieux. Soit un
`.npmrc` dans le socle, soit une note explicite dans le `SKILL.md`.

### 8. Le blueprint devrait figer le partage des fichiers
J'ai attribué les fichiers agent par agent dans les prompts. Ça devrait être **dans le
`BLUEPRINT.md`** : un tableau « fichier → agent responsable ». C'est le seul endroit où le
risque de collision est visible d'un coup d'œil.

### 8 bis. Le blueprint doit aussi figer le contrat de données
Cas vécu : le réglage `whatsapp`, éditable par le coach en admin, **n'aurait rien changé au
site**. L'agent chargé du contact avait choisi de déduire le lien `wa.me` du téléphone
affiché — une solution propre en soi, mais qui ignorait le réglage prévu. Résultat : un
bouton d'administration sans effet, le pire des bugs parce qu'il est invisible.

Le blueprint doit donc porter un tableau **section → réglages consommés → nom de la prop**.
Sans ce contrat écrit, chaque agent invente sa propre source de vérité, et personne ne s'en
aperçoit avant qu'un client modifie un réglage et se demande pourquoi rien ne bouge.

Corrigé ici en faisant du réglage une **surcharge** : rempli il gagne, vide le numéro est
déduit. Pas de doublon à maintenir, pas de contrôle mort.

### 9. Vérifier que le port est libre
Rien ne teste si 3000 est déjà pris avant de lancer `npm run dev`. Sur une journée à
plusieurs projets, ça arrivera.

### 10. Normaliser le nom du dossier client
`C:\Sites\Mon Client` a fonctionné, espace compris. Mais le skill devrait proposer la
normalisation (`mon-client`) au moment du brief plutôt que de laisser un espace dans tous les
chemins.

## Encore non éprouvé

- **Le watcher n'a jamais été armé dans un bootstrap complet.** Mécanisme testé isolément,
  boucle de réveil jamais parcourue de bout en bout.
- **La boucle d'auto-débogage** (3 passes de build) n'a pas encore tourné sur du vrai code
  d'agent.
## Premiers repères de coût

| Agent | Durée | Tokens | Appels d'outils |
|---|---|---|---|
| Haut de page — 4 sections, Sonnet | 14 min | 179 k | 24 |
| Bas de page — 4 sections + formulaire, Sonnet | 17 min | 201 k | 37 |

Avec quatre agents en parallèle, la phase de génération se joue autour de **15-20 minutes**
— plus lent qu'un générateur en ligne, le même ordre de grandeur. Le coût réel
tient surtout au fait que chaque agent relit le socle pour se situer : `globals.css`,
`button.tsx`, `utils.ts`, `package.json`. Un fichier `CONTEXTE.md` généré au bootstrap,
listant tokens et composants disponibles, économiserait probablement un tiers de ces lectures.

## Limite assumée

`component` et `source` restent `null` pour tout ce qui vient d'un Server Component — la
fibre React n'existe pas côté navigateur. La localisation passe donc par les classes
Tailwind et le texte visible, ce qui fonctionne, mais reste un `Grep` et non un pointeur.
Un plugin SWC injectant `data-src="fichier:ligne"` sur chaque élément JSX le règlerait
vraiment. Chantier à part entière, à décider.


---

# Bootstrap #2 — boutique en ligne, sans site de référence (2026-09-04)

Torréfacteur artisanal : catalogue, panier, paiement, comptes clients, back-office.
Choisi pour traverser les branches jamais parcourues — identité décidée par le design
system, module Stripe jamais exécuté, blueprint sans validation.

## Corrigé à chaud

| # | Défaut | Trouvé par |
|---|---|---|
| **Données du client précédent dans le socle** — téléphone, e-mail, Instagram, ville dans `reglages.ts` | en copiant le socle |
| **`text-terracotta` non défini** dans `Section` — couleur fantôme, rendu invisible | agent éditorial |
| **`Parallaxe` ne posait pas sa propre classe** — panne totalement silencieuse | agent catalogue |
| **Aucun `not-found.tsx`** dans le socle | agent éditorial |
| **`bg-gradient-to-*`** sur quatre dégradés — syntaxe Tailwind 3, ne rend rien en v4 | le contrôle automatique |
| **Contrat de server action** — une action qui renvoie un état ne peut pas être branchée nue sur `<form action>` | le typecheck |

Les trois premiers partagent une racine : **une valeur propre à un projet remontée dans le
socle**, ou une déclaration CSS déplacée sans mettre le composant à jour. Le premier cas
était une donnée, le deuxième un jeton de design, le troisième un couplage rompu. Je
n'avais vérifié que les données.

## Ce qui a été construit en réponse

**`scripts/verifier-projet.mjs`** — le garde-fou. Cinq contrôles, chacun né d'un défaut
réel : données personnelles dans le socle, couleurs utilisées sans être définies, dégradés
en syntaxe obsolète, trous `[[À COMPLÉTER]]` des pages légales, photos provisoires restées
en place.

Sa première exécution réelle a trouvé **cinq bugs silencieux** qu'aucun build n'avait
signalés. Sa première version en avait aussi produit **huit faux positifs** — `text-sm`,
`border-b`, `ring-offset-2` ne sont pas des couleurs. Un garde qui crie à tort est pire que
pas de garde : la détection ne retient plus qu'un mot d'au moins quatre lettres, sans
chiffre, absent des mots-clés Tailwind, et hors commentaire.

**`references/structures.md`** — quelles pages doivent exister, par type de site. Né du
manque le plus grave de ce bootstrap : une boutique livrée **sans mentions légales, sans
CGV, sans politique de confidentialité**. Elle buildait parfaitement et était inexploitable.
Personne ne l'avait demandé, moi compris.

**`modules/legal/`** — les gabarits de ces pages, avec des marqueurs `[[À COMPLÉTER]]` à
chaque valeur inconnue. Rien n'y est inventé : un SIRET plausible se publie, un trou se voit.

**`scripts/photos-provisoires.mjs`** — de vraies photos barrées d'un bandeau diagonal
« PHOTO PROVISOIRE ». Un site livré avec des aplats de couleur ne donne pas envie même quand
le code est parfait ; le bandeau garantit que personne ne les publiera par mégarde. Le
marqueur est aussi écrit dans l'EXIF, pour survivre à un recadrage.

## Ce qu'on a appris sur les agents

**Trois agents ont contourné le même composant cassé, séparément**, chacun croyant faire un
choix isolé. Le troisième a remarqué que les deux autres l'avaient fait et s'est aligné.
Un défaut du socle se propage donc en plusieurs contournements avant que quiconque le
signale — d'où la nouvelle étape de contrôle : **quels composants du socle sont restés
inutilisés, et pourquoi ?**

**Le fichier de sortie d'un agent n'est pas un indicateur d'avancement.** J'ai tué un agent
après 1 h 30 en le croyant bloqué : son transcript était vide et rien n'apparaissait sur le
disque. Il avait **sept fichiers sur huit prêts** et les écrivait au moment de l'arrêt. Deux
correctifs : exiger dans les briefs qu'ils écrivent au fil de l'eau, et **envoyer un message
à l'agent** plutôt que de déduire son état d'un fichier vide.

**Une couture non spécifiée casse même entre deux agents corrects.** L'un a écrit des server
actions qui renvoient un état, l'autre les a branchées sur `<form action>` qui exige `void`.
Aucun n'avait tort seul : le brief disait ce que l'action renvoie, pas comment l'appeler.

## Ce qu'on a appris sur Pro Max

Interrogé avec le brief traduit tel quel — « artisan coffee roastery, warm craft brand » —
il a rendu un **entonnoir de conversion en trois étapes**, une palette **verte et rose
floral**, et une police manuscrite. Les mots « artisan / craft » l'envoient vers le bien-être
et le bio.

Deux règles en sont sorties. **Nommer le métier, pas l'ambiance.** Et **relire sa sortie
avant de l'appliquer** : si le motif ne correspond pas au type de site, ce n'est pas la base
qui a tort, c'est la requête.

Sa base ne contient par ailleurs **aucune structure de boutique** — `landing.csv` ne couvre
que des pages de conversion. Sur une boutique ou une application, la structure vient de la
fonction, pas du design system.

## Le piège des échappements, deuxième fois

Un agent a vu sa plage Unicode transformée en caractères combinants littéraux, l'a détecté
seul et contourné avec `\p{Diacritic}`.

Puis **le contrôle automatique que j'écrivais pour attraper ce genre de chose s'est
retrouvé avec de vrais caractères de retour arrière** à la place de ses limites de mot. Il
ne matchait plus rien et annonçait « tout est propre » sur un fichier truffé de défauts.
J'ai cherché longtemps, en croyant la logique fausse.

La règle ne concerne donc pas que le shell : **toute séquence d'échappement écrite dans du
texte généré peut être transformée avant d'atteindre le fichier.** Préférer un échappement
sémantique, et relire tout fichier contenant une expression régulière non triviale.


---

# Reprise du bootstrap #2 — les photos, les pages légales (2026-09-04)

Retour sur la boutique du bootstrap #2 pour appliquer tout ce que le test avait fait remonter.
Trois corrections prévues, une leçon imprévue.

## La leçon imprévue : « la source a répondu » ne veut pas dire « c'est bon »

Le générateur de photos a annoncé **onze succès sur onze**. Fichiers valides,
bonnes dimensions, bandeau appliqué, bon mot-clé, licence commerciale. Rien à
signaler nulle part.

En les regardant : **six étaient inutilisables.** Une montgolfière au-dessus de
palmiers sur « contrôle en tasse ». Une gravure victorienne d'un chien et d'une
fillette sur « emballage ». Un dessin technique de brevet sur « torréfaction ».
Une boîte de café soluble « 3 in 1 » en fiche produit d'un torréfacteur
artisanal. Des bonbons chocolatés à la place de grains.

Et, en héros de la page d'accueil, **le portrait d'une personne identifiable**
s'exprimant devant des micros. La photo avait bien été prise dans une
torréfaction : le mot-clé était juste, le sujet non.

Ce dernier cas n'est pas un problème de qualité, c'en est un de fond. Le bandeau
« provisoire » dit que l'image sera remplacée ; il ne dit pas que la personne a
consenti à figurer sur le site commercial d'un inconnu. Cette photo n'aurait
jamais dû être posée, même une minute.

### Ce que ça change

**`scripts/planche-contact.mjs`.** Toutes les photos d'un projet assemblées en
une seule image légendée. Regarder onze fichiers un par un coûte cher ; en
regarder onze d'un coup coûte une image. La vérification visuelle devient une
étape du bootstrap, pas une bonne intention.

**Un tri des candidats**, dans le générateur : refus des personnes, des scènes
de presse et de cérémonie, et des œuvres graphiques — gravure, dessin technique,
affiche, scan de livre. Openverse est **une archive**, pas une banque d'images :
son `category=photograph` a laissé passer un dessin de brevet.

**Une cascade de filtres qui ne descend jamais sous `category=photograph`.**
Mieux vaut une belle photo hors sujet — le repli générique — qu'une gravure
victorienne sur une fiche produit. Le mauvais réflexe serait d'élargir la
recherche pour « trouver quelque chose ».

Après ces trois correctifs : **dix photos sur onze exploitables**, en deux
passes de régénération, en changeant les sujets que la planche désignait.

### La règle, plus large que les photos

C'est la troisième fois que le même schéma se répète, et il vaut d'être nommé :

> Un outil qui rapporte un succès rapporte que **son travail** s'est bien passé,
> pas que **le résultat** est bon. `curl` a réussi, la couleur est appliquée,
> l'image est écrite — aucun ne dit que c'est ce qu'il fallait.

Les deux occurrences précédentes : un journal réseau lu comme un état, et un
fichier vide pris pour un agent bloqué. La parade est toujours la même —
**regarder la chose elle-même**, et se donner un outil qui rend ce regard bon
marché.

## Une prose qui contredit le back-office

La page d'accueil annonçait « Port offert dès 45 € d'achat », et les CGV
préparaient de recopier le même chiffre. Or ce seuil est **un réglage éditable
par le gérant**. Il pouvait le passer à 60 € depuis son back-office et voir sa
page d'accueil continuer d'annoncer 45.

Le tunnel de commande, lui, aurait appliqué 60. Un site qui se contredit sur un
prix est pire qu'un site muet — et sur des CGV, c'est un engagement contractuel.

Règle inscrite : **un chiffre qui existe comme réglage se lit, ne se recopie
pas.** Avant de figer un montant, un horaire ou une adresse dans une phrase,
vérifier s'il vit déjà ailleurs.

Symptôme voisin trouvé le même jour : l'en-tête du gabarit de CGV *affirmait*
lire les frais de port dans les réglages. Le code ne le faisait pas. **Un
commentaire qui promet plus que son code est un mensonge à retardement** : le
prochain lecteur le croit.

## Les pages légales livrées nues

Les gabarits ne rendaient qu'un `<main>` : ni barre de navigation, ni pied de
page. On arrivait sur les CGV depuis le pied de page, et on ne pouvait plus en
repartir autrement qu'avec le bouton « précédent ».

Aucun contrôle ne voit ça — la page répond 200, le build est vert. Il faut
l'ouvrir. Consigné dans le module : après la copie, habiller les pages du
chrome du site, et prévoir la place de la barre fixe.

Deuxième ajustement : **combler les trous que le code sait combler.** Ce que le
site collecte, le schéma de données le dit ; les cookies posés, le code les
montre ; Stripe est dans les dépendances. Laisser ces rubriques en
`[[À COMPLÉTER]]` alors que la réponse est sous les yeux, c'est de la paresse
déguisée en prudence. Ce qui reste un trou, en revanche, le reste : SIRET,
raison sociale, hébergeur, médiateur — personne ne les déduit du code.

## Le garde-fou, corrigé par son propre usage

Deux défauts, tous deux du même genre que ceux qu'il traque :

- il comptait comme un trou le marqueur `[[À COMPLÉTER]]` **cité dans le
  commentaire d'en-tête** qui explique la convention ;
- il listait onze photos provisoires une par une, alors que leur présence est
  l'état normal avant remise. Les vrais avertissements se noyaient dedans.

Un garde qui compte faux ou qui crie trop se fait ignorer, et un garde ignoré ne
sert à rien. Il retire désormais les commentaires avant de compter, et ne nomme
que trois photos avant de résumer.

## L'entrée du gérant, invisible

Signalée par l'utilisateur au test précédent : « pas de lien admin ». Il y en
avait un — en bas à droite, à 50 % d'opacité, sans repère visuel. Discret au
point que le gérant lui-même ne le trouvait pas.

**Discret et introuvable sont deux choses différentes.** Un cadenas et un
contraste lisible suffisent à faire la différence, sans rien exposer.

## Le dépôt public livrait un socle sans `lib/`

Trouvé en relisant le dépôt à la demande de l'utilisateur, avant un troisième test.
`.gitignore` contenait `lib/` — écrit pour exclure la bibliothèque de design clonée dans
`lib/ui-ux-pro-max`. Non ancré, le motif exclut **tout dossier nommé `lib`** :
`socle/lib/` (utilitaires, réglages, base de données) et `modules/auth/files/lib/` n'ont
jamais été versionnés. Neuf composants du socle importent `@/lib/utils`. Un clone public
recevait un socle qui ne compilait pas, et un module d'authentification amputé.

Localement, tout marchait — les fichiers étaient sur le disque. C'est le cas le plus
sournois : **le dépôt et le dossier de travail divergent sans qu'aucun test local ne le
voie.** Le seul contrôle qui l'attrape : cloner le dépôt dans un dossier vide et builder le
socle depuis là. À faire avant chaque publication, pas après.

Corrigé : `/lib/` ancré à la racine, les deux dossiers versionnés. Et un doublon retiré au
passage — `scripts/update-promax.ps1` refaisait ce que l'installeur fait déjà.

## Le clone-test a payé dans la minute

Sitôt écrit dans ce journal, le contrôle « cloner dans un dossier vide et builder le socle »
a trouvé un second défaut, invisible autrement : `socle/lib/reglages.ts` interroge un modèle
`Reglage` que `socle/prisma/schema.prisma` ne déclare pas. Le socle ne compile pas seul.

Personne ne l'avait vu parce que le bootstrap **réécrit le schéma** à la phase 0.55, et
qu'il y ajoute ce modèle à chaque fois. Deux fichiers du même dossier se contredisaient
depuis le début, et chaque projet réparait la contradiction en passant. C'est la même
famille que le commentaire des CGV qui promettait ce que le code ne faisait pas : **deux
sources qui devraient s'accorder et que rien ne compare.**

Le socle doit se suffire : ce qu'un de ses fichiers suppose, un autre le déclare. Le
clone-test devient une étape avant chaque commit qui touche au socle, pas seulement avant
publication.

## On publie un historique, pas une arborescence

Dernier contrôle demandé par l'utilisateur avant la mise en ligne du dépôt : « vérifie
qu'il ne reste rien du premier site ». L'arborescence était propre — le code, les docs,
le socle. Mais un dépôt git publié emporte **tous ses commits**, et l'audit de
l'historique a trouvé le nom du premier client **138 fois** dans d'anciennes versions
des docs, plus cinq messages de commit qui le citaient. Des données retirées depuis
longtemps du fichier courant, toujours lisibles dans `git log -p`.

Deux constats.

**Les vraies coordonnées n'ont jamais été commitées** — téléphone, e-mail, réseaux,
ville : zéro occurrence dans tout l'historique. Elles vivaient dans `socle/lib/`, que le
`.gitignore` excluait par accident. Le bug qui rendait le socle incompilable est aussi ce
qui a empêché la fuite. On ne compte pas là-dessus deux fois.

**Un nom suffit.** Sans aucune coordonnée, le nom d'une entreprise réelle identifie le
client et rattache le dépôt public à son site. Le seuil n'est pas « données
personnelles » mais « ce qui permet de remonter à quelqu'un ».

Ce qui en sort : avant toute publication, **auditer l'historique et les messages de
commit, pas seulement l'arborescence** — `git grep` sur chaque commit de `git rev-list
--all`, et `git log --all --format=%B`. Et quand l'historique est atteint, ne pas le
réécrire : le dépôt n'ayant jamais été publié, une branche orpheline d'un seul commit,
construite depuis l'arborescence propre, part seule. L'historique reste en local, où il
n'a jamais posé de problème.

## Piste ouverte — le mouvement dès le premier jet

Constat de l'utilisateur après le deuxième bootstrap : « le site est plat ». Le socle a
pourtant Lenis, `Reveal`, `Parallaxe`. Mais rien n'oblige un agent à s'en servir, et rien
ne dit *quand* : trois agents sur quatre ont livré des sections sans un seul mouvement, et
le contrôle de fin ne le regardait pas.

Une bibliothèque de plus ne changerait pas ça. Ce qui manque, c'est **une étape**.

Proposition, à trancher avant le troisième bootstrap :

1. **Une seule bibliothèque d'animation dans le socle** — GSAP avec `@gsap/react`, gratuit
   depuis 2025, ScrollTrigger compris. Pro Max a déjà un domaine `gsap`. Préférée à Framer
   Motion parce que la chorégraphie au défilement est le langage des vitrines, et c'est là
   qu'elle est la plus forte. Tailwind, lui, est déjà dans le socle.
2. **Des primitives de mouvement dans le socle**, qui portent la structure et jamais
   l'identité : révélation en cascade, compteur, bandeau défilant, parallaxe, entrée du
   héros — sur GSAP, à la place des versions CSS `animation-timeline`, dont le support
   navigateur reste partiel.
3. **Une étape « mouvement » en phase 1** : Pro Max `--motion` et `--domain gsap`, puis dans
   chaque brief d'agent la liste de ce qui bouge et comment, `prefers-reduced-motion`
   respecté ; et dans le contrôle visuel de fin, la question « est-ce que ça bouge ? ».
4. **`references/mouvement.md`** : dix motifs, quand les employer, la primitive pour chacun.

Ce n'est pas contraire à D1 : D1 refuse des dépôts de *connaissance* en plus de Pro Max,
pas une dépendance de code dans le socle.

**Décidé le jour même**, sur la piste ci-dessus : GSAP dans le socle, six primitives, l'étape
« mouvement » dans `SKILL.md` et `references/mouvement.md` — voir D7. La page d'attente du
socle montre les six primitives en situation : après un clone, on voit d'un coup d'œil si ça
bouge. Reste à éprouver sur le troisième bootstrap ; la mesure du succès, c'est un premier
jet qui bouge sans qu'on le demande.

---

# Relecture à froid du deuxième bootstrap (2026-09-04)

Avec un jour de recul, ce que le site plat avait en commun avec les autres défauts du
bootstrap : **chaque fois, c'est l'utilisateur qui a vu.** Le CSS cassé, les photos
absentes, les sept pages sans navigation, le site plat — aucune de ces choses n'était
difficile à voir. Elles n'ont pas été regardées.

Et une seconde chose : les questions manquantes. Personne n'avait demandé ce que le client
avait comme photos, ni comment parlent ses clients, ni ce que le site devait dire de ses
visuels. Les réponses auraient changé le blueprint.

Une troisième, plus discrète : la palette. Crème, serif, terre cuite — ce que tout
générateur rend dès qu'il entend « artisan ». Pro Max l'a rendue, et personne n'a tenu de
direction par-dessus.

D'où huit changements, décidés ensemble et consignés dans D8 : le relevé des capacités
avant la première question, la question des actifs, les mots des clients avant d'écrire,
le texte écrit avant la construction et un contrôle des mots creux, une direction tenue
par-dessus Pro Max, l'auto-test avec un relecteur sans contexte, une définition du fini qui
inclut le regard de l'utilisateur, et la règle des deux blocages. À éprouver sur le
troisième bootstrap.

---

# Bootstrap #3 — site de référence de l'utilisateur, Higgsfield connecté (2026-09-05)

Premier passage des branches ajoutées après le deuxième bootstrap : relevé des capacités,
question des actifs, mots des clients, `CONTENU.md`, direction, mouvement GSAP, auto-test.
Onze remontées de l'utilisateur, notées pendant le test, corrigées en lot après.

## La cause commune de deux remontées

« Je n'ai pas pu modifier le blueprint en mode édition » et « le mode édition ne marche pas
pendant les dernières vérifications — puis il a tout envoyé d'un coup à la fin ». Deux
symptômes, une cause : **le watcher qui réveille Claude n'était armé qu'à l'étape 10**, la
dernière du bootstrap. L'overlay, lui, fonctionnait depuis le lancement du serveur : chaque
envoi écrivait bien son lot sur le disque. Personne n'écoutait. À la fin, tout est arrivé
ensemble.

Corrigé à la racine : le watcher s'arme **dès que le serveur tourne** (phase 0.55), le
blueprint s'annote au clic comme n'importe quelle page, et un lot reçu pendant la
construction obtient une réponse dans la minute — appliqué, ou « reçu, j'applique dès que
l'agent a fini ».

## Ce qui ressemblait à une panne et n'en était pas une

Entre l'envoi et le réveil de Claude, cinq à dix secondes sans rien. L'utilisateur : « on
dirait que ça bug ». Il avait raison sur l'effet, tort sur la cause — et c'est l'effet qui
compte. Trois choses en sortent : un statut `en_cours` que Claude écrit **dès son réveil,
avant de travailler** ; l'overlay qui interroge le serveur tant qu'un lot est `pending` ; et
**une comète** qui tourne autour de la barre jusqu'à ce que le statut change. L'attente est
la même, elle est visible.

Même famille, en vue mobile : « la surbrillance au survol ne marche pas ». Normal — un
écran tactile n'a pas de survol, et le panneau l'émule fidèlement. Le geste de remplacement :
le doigt posé surligne, le relâchement sélectionne.

## Ce qui manquait à l'overlay

Une pastille se clique et rouvre son commentaire, texte et images en place — on corrige ou
on retire. La zone de saisie grandit avec le texte et se tire à la main.

## Deux questions qui changent le chemin

**« Quel modèle ? » arrivait trop tard** — après le début du travail, quand changer voulait
dire tout relancer. Le premier message se termine maintenant par « On y va ? » avec l'option
de régler le modèle avant, et un utilisateur sous Sonnet reçoit l'avertissement avant la
liste des étapes, pas après.

**« Quel genre de site ? » n'était pas posée.** Landing, vitrine, boutique, application :
c'est ce qui décide des pages, des modules, du mouvement, du nombre d'agents et de ce qu'on
va chercher comme inspiration. Une landing prend désormais un chemin court. Voir D11.

## Le lancement, pas seulement la construction

Un site fini n'est pas un site prêt à publier. Vingt points ont été triés selon qui s'en
charge : le socle fournit robots, sitemap, image de partage, favicon, métadonnées et
canoniques ; le bootstrap pose un titre, une description et un `alt` par page et par image
— le garde-fou le vérifie ; le reste — URL publique, données de l'entreprise, analytics et
le bandeau qu'il imposerait — ne peut venir que du propriétaire et porte le marqueur
`[[À CONFIRMER PAR L'UTILISATEUR : …]]`, qui remplace « À COMPLÉTER » : il dit à qui revient
la réponse.

## Trouvé en corrigeant : le lanceur devant deux projets

Pendant ces corrections, un serveur du troisième projet tenait le port 3000. Le lanceur a
dit « libre », Next 15.5 a refusé de démarrer — avec `-p` explicite, il ne bascule plus en
silence sur le port suivant, il échoue avec `EADDRINUSE` — **et il est sorti avec le code
0**. Le lanceur a donc terminé « proprement » sur un serveur jamais démarré.

Deux corrections : la sonde interroge IPv4, IPv6 et la table des sockets du système avant
de déclarer un port libre ; et un `EADDRINUSE` dans la sortie de Next relance sur le port
suivant, au lieu de faire confiance à un code de sortie qui ment.

## Trouvé en commitant : le garde-fou lisait `border-radius` comme une couleur

La feuille de style de la comète vit dans une chaîne, à l'intérieur du composant. Le
contrôle des couleurs y a lu `border-radius` et a réclamé un jeton « radius » dans le thème.
Les propriétés CSS écrites en toutes lettres rejoignent la liste des mots que ce contrôle
ignore. Et la chaîne de commit s'arrête désormais sur son verdict : ce jour-là, elle ne
l'a pas fait, et le commit est passé par-dessus un bloquant — corrigé par le commit suivant.

---

# Audit de publication — ce que le dépôt public emporte (2026-09-05)

Relecture ligne à ligne des deux dépôts avant de les rendre publics. La question posée à
chaque fichier : **est-ce que ça appartient à quelqu'un d'autre que le lecteur ?**

## Ce qui était déjà propre

Aucune donnée d'un client, nulle part — ni dans l'arbre, ni dans les fichiers suivis. La
bibliothèque de design, clonée par l'installeur, est hors de git depuis qu'un `/lib/` ancré
a remplacé le `lib/` nu. Un clone neuf de la branche publique reçoit 80 fichiers, un seul
commit, et rien d'autre.

## Quatre choses trouvées

**Le nom d'une plateforme concurrente servait de repère dans trois documents.** Le README se
présentait par comparaison, le journal citait ses temps de génération, et la recette
d'extraction donnait ses vrais sous-domaines en exemple. Le README dit maintenant ce que le
skill fait, sans point de comparaison ; l'exemple d'iframes empilées vaut pour n'importe quel
hébergeur, ce qui le rend d'ailleurs plus utile.

**Le socle nommait ses outils dans des commentaires livrés au client.** `globals.css` et
`lib/mouvement.ts` expliquaient d'où venaient leurs valeurs, en citant la bibliothèque de
design. Ces deux fichiers finissent dans le dépôt du client : il y lisait le nom de nos
outils. Les commentaires disent désormais ce qu'il faut savoir — ne pas renommer les
variables — sans nommer ce qui les a produites.

**Le `.gitignore` du socle laissait passer les commentaires d'édition.** Il écartait les
images jointes mais pas `comments.json` : le site livré aurait versionné les annotations de
travail. C'est tout `.buildyoursite/` qui sort du git du client.

**`/overlay` ne s'installait pas seul.** Son README renvoyait à l'autre skill par un chemin
relatif — mort dès que les deux dépôts sont séparés — et n'expliquait pas comment
l'installer. Il le dit maintenant en une commande, et l'identité git se demande quand la
configuration de l'autre skill n'est pas là.

## La seule chose qu'on garde et qu'on nomme

L'installeur télécharge une bibliothèque de design tierce, sous licence MIT, sur la machine
de l'utilisateur. Elle n'est pas dans le dépôt. La nommer n'est pas une dette de gratitude :
**quand on installe du code chez quelqu'un, on lui dit lequel.** Elle reste citée dans le
LICENSE, le README et l'installeur.

## L'auteur d'un commit est une donnée publique

Un dépôt public expose l'adresse e-mail de l'auteur de chaque commit, pour toujours, et les
robots à spam la récoltent. Sur la branche publiée, l'auteur porte donc une adresse
`@users.noreply.github.com` : le pseudo reste visible, l'adresse réelle non.

---

# Un site garde l'overlay de sa naissance (2026-09-05)

Retour de l'utilisateur, deux essais de suite : « l'overlay n'a pas été mis à jour ».
Réflexe possible : chercher un cache, une deuxième copie du skill, un serveur qui sert un
vieux fichier. Les trois étaient faux. Le serveur relit son script à chaque requête et
répond `no-store` ; il n'existe qu'une seule copie de chaque skill sur la machine ; les
fichiers sur le disque portaient bien l'heure des corrections.

**Ce qui était vrai : le skill était à jour, le site non.** Un site emporte sa copie de
l'overlay au moment de sa construction — le composant et la route qui reçoit les
commentaires. Ce qu'on améliore ensuite dans le socle ne le rejoint jamais. Le site testé
datait de la veille : 23 657 octets contre 30 186, sans comète, sans pastille cliquable,
avec une route qui ne savait pas répondre à la question du statut.

Deux fichiers en retard, pas un. Une interface neuve qui interroge une ancienne route
n'obtient rien : la comète tournerait sans fin. C'est pour ça que le script les traite
ensemble.

`scripts/mettre-a-jour-overlay.mjs` compare et recopie, avec un mode `--verifier` qui ne
touche à rien. Les deux skills appellent le contrôle avant d'ouvrir le panneau sur un site
qui existait déjà.

**La leçon générale.** Tout ce que le bootstrap **copie** dans un projet — l'overlay
aujourd'hui, les primitives de mouvement ou les composants du socle demain — se fige à la
date de la copie. Ce n'est pas un défaut en soi : un site livré doit être stable. Mais
quand l'outil sert aussi à revenir sur d'anciens projets, il lui faut un chemin de mise à
niveau explicite, sinon la première impression est celle d'une panne.

---

# Le manifeste disait « skills : ici », et le skill disparaissait (2026-09-06)

En ajoutant le manifeste de place de marché, lecture du schéma officiel. Il décrit le champ
`skills` d'un `plugin.json` comme un dossier **supplémentaire**, contenant des
`<nom>/SKILL.md`. Nos deux manifestes portaient `"skills": "./"`.

Deux conséquences, toutes deux invisibles jusqu'à l'installation. La racine ne contient
aucun sous-dossier avec un `SKILL.md`, donc ce champ ne désignait rien. Et surtout, la règle
qui charge un `SKILL.md` posé à la racine ne s'applique **que si** aucun champ `skills` n'est
déclaré. En le déclarant, on désactivait la seule chose qui faisait exister le skill.

Installé comme plugin, le dépôt aurait donc livré un plugin sans aucune commande. Le champ
est retiré : la racine porte son `SKILL.md`, le nom d'invocation vient de son en-tête.

**Le schéma contredit la documentation sur un point.** La page explique qu'un plugin situé à
la racine de sa place de marché prend `"source": "."`. Le schéma publié, lui, impose qu'un
chemin commence par `./`. On écrit donc `"./"`, qui satisfait les deux. Les quatre
manifestes sont validés contre les schémas officiels avant chaque publication.

**Et un message qui supposait un dossier courant.** Quand la bibliothèque de design manque,
le relevé disait « lance l'installeur : node scripts/installer.mjs ». Utile depuis le
dossier du skill, inutile ailleurs — et installé en plugin, le skill vit dans un cache dont
personne ne connaît le chemin. Le message donne maintenant le chemin absolu.

---

# Les données quittent le dossier du skill (2026-09-06)

Conséquence directe de l'installation en plugin. Un plugin vit dans un cache que Claude Code
peut remplacer à chaque mise à jour. Or deux choses vivaient à côté du code : `config.json`,
écrit par l'installeur, et la bibliothèque de design, plusieurs centaines de mégaoctets.
Une mise à jour les emportait, sans rien dire, et le skill repartait sans configuration ni
moteur de design.

Elles vivent maintenant dans `~/.claude/buildyoursite`, hors d'atteinte.

**Le dossier officiel n'était pas utilisable.** Claude Code fournit `CLAUDE_PLUGIN_DATA`,
prévu exactement pour ça. Mais la documentation est explicite : il n'est exporté qu'aux
processus de hooks et aux serveurs MCP. Nos scripts, eux, sont lancés dans un terminal, où
la variable est absente. S'y fier aurait donné un emplacement variable selon qui lance le
script, donc un installeur qui écrit ici et un relevé qui cherche là. Un chemin déterministe
vaut mieux qu'un chemin officiel obtenu une fois sur deux. `BUILDYOURSITE_DATA` permet de le
déplacer.

**Personne ne perd sa configuration.** L'ancien emplacement continue d'être lu tant qu'il
porte les fichiers, et l'installeur déménage au premier passage. Le relevé signale ce qui
traîne encore dans le dossier du skill.

**Un chemin de moins à connaître par cœur.** Le relevé imprime désormais le dossier de
données et la commande complète du moteur de design. Le `SKILL.md` dit de les prendre là,
plutôt que de reconstruire un chemin qui dépend de la façon dont le skill a été installé.
C'est la même leçon que le message d'installeur en chemin relatif : dès qu'un outil peut
vivre à deux endroits, il doit dire où il est.

---

# Un nom de marque dans le déroulé ne marche que pour celui qui l'a écrit (2026-09-06)

Le relevé de capacités cherchait un connecteur d'images **par son nom**, celui du service
utilisé pendant le troisième bootstrap. Conséquence : quelqu'un qui utilise un autre service
de génération d'images n'aurait rien vu. Le skill lui aurait proposé des photos provisoires,
et il aurait conclu que la génération n'existe pas, alors que son outil était là, sous les
yeux de Claude, à côté des autres.

## Ce qu'un script peut voir, et ce qu'il ne peut pas

Premier réflexe : lire la configuration des connecteurs depuis le terminal. Vérifié sur une
vraie machine — il n'y a rien à lire. Aucun serveur n'est déclaré dans les fichiers de
configuration ; ils viennent du compte ou des plugins et n'existent que dans la session.
**Le seul observateur possible, c'est Claude lui-même**, qui a la liste de ses outils sous
les yeux. Le script ne peut que lui dire quoi chercher.

## Chercher une capacité, pas une marque

Écarté : une liste des dix services les plus connus, interrogés un par un. Une liste de
marques est déjà fausse le jour où on l'écrit — chacun a son fournisseur — et périmée six
mois plus tard, à chaque nouveau service. Elle contredit aussi ce qu'on vient de décider
pour la publication : aucun prestataire nommé, aucune préférence glissée dans le projet.

À la place, trois signatures : un outil qui fabrique une image ou une vidéo à partir d'un
texte, un outil de solde ou de quota sur le même connecteur, un outil de déploiement. Le
premier décide si les visuels manquants peuvent être générés. Le deuxième décide si un prix
peut être annoncé avant chaque image — et quand il manque, on le dit au lieu d'inventer un
tarif. Le troisième ne change rien, on ne déploie pas.

Le connecteur trouvé est **nommé dans le relevé sous son vrai nom**, quel qu'il soit, et
utilisé ensuite sous ce nom. La question posée à l'utilisateur porte donc le nom de son
outil à lui, pas celui d'un service qu'il n'a jamais installé.

**La règle générale.** Tout ce qui, dans ce skill, dépend d'un service extérieur se
reconnaît à ce qu'il sait faire. Un nom propre dans le déroulé est un défaut, sauf quand il
désigne une dépendance que nous installons nous-mêmes.

---

# L'écran prioritaire n'était décidé par personne (2026-09-06)

Le socle est fluide, l'auto-test contrôle 375 px et 1280 px, et le blueprint n'a jamais dit
**pour quel écran le site est composé**. Résultat : la mise en page se décidait au hasard de
ce que rendait le design system, en général au format bureau, et le téléphone héritait de
ce qui restait. Sur un commerce de quartier dont la moitié des visiteurs arrive d'une fiche
Google, c'est le mauvais sens.

## La question à ne pas poser

« Mobile ou ordinateur ? » laisse croire qu'on choisit l'un contre l'autre. C'est faux : le
site s'adapte aux deux, toujours, et les deux largeurs restent vérifiées. On demande donc
**d'où arrivent les visiteurs** — un lien Instagram, une fiche Google, une recherche depuis
un bureau — et on en déduit l'écran qu'on compose en premier.

## Ce que la réponse change, sinon la question est décorative

Composer à 375 px puis élargir n'est pas composer à 1280 px puis replier. Le premier impose
une action par écran, peu de colonnes, du texte court avant la ligne de flottaison, des
coordonnées transformées en gestes — appeler, ouvrir un itinéraire — et un budget de
mouvement et d'images plus serré, parce qu'un défilement chorégraphié coûte cher sur un
réseau mobile. Le second autorise des grilles denses, des tableaux, une navigation dépliée
et du contenu long.

L'auto-test suit la même priorité : l'écran principal doit être irréprochable, l'autre
correct. **Aucune largeur n'est facultative pour autant** — les grilles cassent à 375 px, y
compris sur un site pensé pour le bureau, et une page cassée sur téléphone reste cassée
même quand le téléphone est minoritaire.

## Proposer plutôt que demander

Le genre de site donne déjà la réponse la plus probable : téléphone pour un commerce, un
service local, une landing ou une vitrine ; ordinateur pour une application, un back-office
ou un outil professionnel. Le skill propose ce défaut et laisse corriger d'un clic. C'est la
même règle que pour le relevé de capacités : une question dont la réponse est déjà connue à
quatre-vingts pour cent ne se pose pas à froid, elle se propose.


---

# Quatrième bootstrap — vitrine avec back-office (2026-09-06) : remontées

Consignées au fil du test, corrigées en lot après la remise. Une ligne par remontée,
avec ce qui s'est passé et ce que ça devrait devenir.

1. **La classe `eyebrow` n'existait pas.** `Section`, `not-found.tsx`, l'exemple de
   `mouvement.md` et les gabarits légaux posent `className="eyebrow"`, et `globals.css`
   du socle ne la définit nulle part : les surtitres se rendaient en texte ordinaire, sans
   capitales ni espacement. Corrigé dans le projet par un `@utility eyebrow` ; à porter dans
   le socle. C'est exactement le cas « un composant du socle que tous les agents
   contournent » — sauf qu'ici personne ne l'a vu parce que le texte s'affichait quand même.

2. **« Glisse-les dans le chat » ne donne pas de fichier.** L'utilisateur a collé son logo
   dans le chat : l'image arrive à l'écran de Claude, jamais sur le disque, et rien ne peut
   la copier dans `public/`. Il a fallu une question de plus pour obtenir l'URL du site où
   les fichiers vivaient. La salve des actifs doit demander **un chemin, un dossier ou une
   URL**, pas un glisser-déposer — et dire pourquoi en une ligne.

3. **Les deux questions fixes se sont fait sauter.** Posées dans la même salve qu'une
   question à réponse libre (« où sont les fichiers ? »), inspiration et validation du
   blueprint sont revenues « [No preference] » : l'utilisateur a tapé sa réponse libre et
   validé la salve sans cliquer le reste. Il a fallu les reposer. **Les deux questions fixes
   vont dans leur propre salve, sans aucune question libre à côté.**

4. **Le serveur de dev doit vivre toute la session, et le skill ne dit pas comment.** Un
   `Bash` en arrière-plan porte un délai maximal ; un `Monitor` persistant convient, à
   condition de filtrer sa sortie (`BUILDYOURSITE_URL|Network|EADDRINUSE|rror|⨯`) pour
   ne remonter que l'URL et les erreurs — le journal brut de Next produirait un événement par
   requête. À écrire dans la phase 0.55, avec la commande.

5. **Le module `legal` copie les CGV même quand le site ne vend pas.** `files/` contient
   `app/cgv/page.tsx` ; sur une vitrine il faut le supprimer après la copie, sinon la page
   existe et n'est reliée nulle part. Le MODULE.md devrait dire « copie seulement les pages
   retenues » — ou ranger les CGV à part.

6. **Le relevé d'un site propre à l'utilisateur, avec sa page d'aide et ses guides, vaut
   une phase 0.58 à lui seul.** Sur ce bootstrap, la FAQ et les pages guides du site de référence
   portaient déjà les vraies objections (agents remplacés, hallucinations, données, marchés
   publics, coûts cachés, réversibilité) : plus utiles que les trois recherches web. Quand
   la référence appartient à l'utilisateur, la phase 0.58 devrait commencer par elle.

7. **`get_page_text` peut ne rendre qu'un `<article>`.** Sur la page d'accueil de la
   référence, il a renvoyé une seule carte. Le texte complet est venu d'un `curl` +
   un petit script HTML → texte dans le scratchpad. La recette d'extraction devrait le
   proposer d'emblée pour un site statique : plus fiable, verbatim, et toutes les pages en
   un passage (le `sitemap.xml` donne la liste).

8. **Le premier `--design-system` de Pro Max a rendu un motif d'une page et une palette
   slate** pour une requête « govtech SaaS ». Requête reformulée par domaine (`landing`,
   `ux`, `typography`) : motifs utiles, palette écartée au profit de l'ADN relevé. Le
   SKILL.md prévient déjà ; ce cas confirme qu'en mode « nouvelle création » on n'appelle
   `--design-system` que pour la structure, jamais pour la palette.

9. **Le hook du navigateur épingle l'onglet sur un fichier SVG écrit avec `Write`.** Après
   `app/icon.svg`, l'onglet du panneau s'est trouvé « pinned to a local file preview » et
   n'a plus voulu naviguer ; il a fallu ouvrir un nouvel onglet. Sans rapport avec le skill,
   mais bon à savoir : écrire les SVG avant d'ouvrir le panneau, ou rouvrir un onglet après.

10. **Le mode Édition ne fonctionne pas sur `/blueprint`, contrairement à ce que dit le
    SKILL.md.** La page servie par `app/blueprint/route.ts` est le HTML de
    `blueprint-html.mjs`, hors du layout Next : aucun script, donc pas d'overlay, pas de
    barre Édition, pas de commentaires. Vérifié dans le panneau : `document.scripts` vide.
    J'avais annoncé Alt+E à l'utilisateur sur la foi du texte. Deux issues : embarquer dans
    `blueprint-html.mjs` une version autonome de l'overlay (le composant React ne peut pas
    servir tel quel), ou retirer la promesse de la phase 0.6 et dire « relis-le, réponds dans
    le chat ». La seconde est honnête tout de suite ; la première est un vrai chantier.

11. **La 404 du socle n'a ni en-tête ni pied de page, et le SKILL.md ne dit pas de l'habiller.**
    Le relecteur l'a trouvée : un visiteur arrivé par un lien cassé ou un QR code mal
    recopié tombait sur une impasse à un seul bouton, alors que « chaque page hors tunnel
    rend Nav et PiedDePage ». Le socle ne peut pas les importer (il doit compiler seul), donc
    c'est au bootstrap de le faire — au même moment que les pages légales. À ajouter à la
    phase 1 : « habille aussi `app/not-found.tsx` », et à `verifier-projet.mjs`, qui ne la
    comptait pas parmi les pages sans navigation.

12. **Le marqueur `[[À CONFIRMER PAR L'UTILISATEUR]]` se lit comme une note de chantier sur
    une page publique.** C'est voulu — un trou visible vaut mieux qu'une valeur inventée —
    mais le relecteur l'a classé défaut numéro un des mentions légales. Deux améliorations
    possibles sans renoncer au principe : lui donner un habillage reconnaissable (un encadré
    « à compléter avant la mise en ligne » plutôt que des crochets bruts), et le dire à la
    remise en même temps que l'URL : « il reste N marqueurs, voici où ». Le garde-fou le
    compte déjà ; la remise doit le répéter.

13. **Le relecteur s'est servi.** Sans contexte, trois lignes de brief, il a rendu douze
    observations dont sept ont donné une correction (404, voile du menu mobile, tableau
    coupé, formule mise en avant sans raison, surtitre qui promettait une personne, phrase
    orpheline, tic « cite sa source »). Les cinq autres étaient des choix assumés du
    blueprint (photo unique, devise latine, lien Administration, articles courts, gravure).
    L'étape vaut son coût ; la garder telle quelle.

---

# Rétrospective du quatrième bootstrap — ce que le site livré ne dit pas (2026-09-06)

Les treize remontées ci-dessus ont été notées pendant la construction. Celles-ci viennent
d'après : de la question posée à la remise — « pourquoi n'as-tu pas repris les téléphones qui
bougent ? » — et de la relecture complète du déroulé qu'elle a déclenchée. Elles sont plus
profondes, parce qu'aucune n'était visible pendant le travail.

## 14. Un élément de la référence peut disparaître sans laisser de trace

La référence avait, dans son héros, **trois téléphones** : le produit principal au premier
plan, les deux autres derrière, atténués. Chacun était un lien vers sa page de marque, et
tous les trois se soulevaient au survol — le relevé l'avait mesuré, noir sur blanc :
`transform, box-shadow, filter, opacity · 0.55s`. Elle avait aussi un **bouton WhatsApp
flottant**, en bas à droite, sur chaque page, avec son message pré-rempli.

Le site livré a **un** téléphone, immobile, décoratif, sans lien. Et pas de bouton flottant.

Il faut séparer deux choses, parce qu'elles n'ont pas la même cause :

**La réduction de trois téléphones à un était un choix**, pris au blueprint : un héros porte
une promesse et une action, trois destinations la diluent, et les trois marques ont leur
propre section plus bas. Le choix se défend. Mais il n'est écrit nulle part **comme un écart
par rapport à la référence** : il apparaît dans le tableau des sections, sous la forme d'une
ligne qui décrit ce qu'on construit, jamais de ce qu'on abandonne. L'utilisateur ne pouvait
pas le voir venir.

**La perte de l'interaction n'était pas un choix, c'est un oubli.** Le relevé avait les
transitions et les trois `href`. Rien, entre le relevé et les briefs d'agent, ne transforme
une transition relevée en consigne. Le tableau du blueprint disait « Mouvement : apparitions
via les primitives du socle » — et les primitives du socle ne savent faire que des
apparitions.

**Ce qu'il faut changer.** Le relevé doit produire un **inventaire des éléments interactifs**
— un par ligne : ce que c'est, où c'est, ce que ça fait au survol, où ça mène. Et le blueprint
doit donner à chaque ligne un verdict : *reproduit*, *réinterprété*, *abandonné* — avec la
raison quand c'est abandonné. Un élément qui disparaît sans sa ligne est un défaut, pas une
décision. La colonne « Repris : oui/non » actuelle ne suffit pas : elle disait « liens
sortants : oui », ce qui était vrai (ils sont dans les réglages) et faux en même temps (le
bouton flottant avait disparu).

## 15. Le mouvement du socle est un vocabulaire d'apparition, pas de réaction

Les six primitives — `EntreeHero`, `Cascade`, `Reveal`, `Compteur`, `Defilant`, `Parallaxe` —
répondent toutes à la même question : **comment cet élément arrive-t-il ?** Aucune ne répond
à l'autre moitié : **comment répond-il quand on s'approche ?**

C'est pourtant là que se joue la sensation de vie d'un site. Ce que l'utilisateur a appelé
« les téléphones qui bougent », ce n'est pas une entrée au défilement : c'est une carte qui se
soulève sous le curseur.

Aujourd'hui, chaque agent improvise : l'un a écrit `hover:-translate-y-0.5` sur les cartes de
marques, un autre `transition-colors duration-150` sur les liens de nav, un troisième rien du
tout. Trois décisions isolées là où il faudrait un système.

**Ce qu'il faut ajouter.** Une septième dimension dans `mouvement.md`, *les états*, avec un
vocabulaire court et des valeurs dans `lib/mouvement.ts` : ce que fait une carte cliquable au
survol, ce que fait un bouton à la pression, ce que fait un élément au focus clavier. Et une
ligne de plus dans chaque brief, à côté de « ce qui bouge » : **« ce qui répond »**. Avec la
même retenue que le reste — tout ne réagit pas, seulement ce qui est cliquable.

## 16. Le blueprint ne montre rien, et on lui demande de valider un design

L'utilisateur a validé, avant construction, un document fait de tableaux et de listes. Il ne
pouvait pas savoir que le héros aurait un téléphone au lieu de trois : cette information
n'existait nulle part sous une forme regardable.

C'est le manque le plus coûteux de la chaîne, parce qu'il déplace toutes les corrections
après la construction, là où elles coûtent cher, au lieu d'avant, où elles coûtent une phrase.

**Ce qu'il faut ajouter.** `blueprint-html.mjs` a déjà, dans le fichier qu'il rend, le tableau
section par section de chaque page. De quoi dessiner un **squelette** : une colonne de blocs
étiquetés, à l'échelle approximative, un par section, avec son nom, ce qu'elle contient et ce
qui bouge. Ce n'est pas une maquette, et ça ne doit pas essayer de l'être — c'est un plan de
masse. Il aurait fait poser la question des téléphones avant la construction plutôt qu'après.

## 17. La phase 0.c n'a pas eu lieu, et je ne m'en suis pas aperçu

Les trois questions de la phase 0.c — *ce site t'appartient-il ?*, *je reprends les liens
sortants ?*, *reproduction fidèle ou nouvelle création ?* — **n'ont jamais été posées**.

À la place : le nom du site m'a fait deviner l'adresse, je l'ai ouverte, relevée, et j'ai
téléchargé sept fichiers image. Les réponses sont devenues des hypothèses dans le blueprint
(H1, H2), c'est-à-dire des affirmations que l'utilisateur pouvait corriger — mais après le
relevé, pas avant.

Ça s'est bien terminé : le site lui appartient. Mais le garde-fou existe exactement pour le
cas où il n'appartiendrait pas, et il n'a pas fonctionné. La cause est la remontée n° 3
ci-dessus : les questions fixes noyées dans une salve avec une question libre reviennent
vides. Ce que je n'avais pas mesuré, c'est la **conséquence en chaîne** — une question sautée
n'a pas seulement manqué, elle a annulé toute une phase, et j'ai comblé le vide en devinant au
lieu de reposer la question.

**Ce qu'il faut changer.** Deux règles, courtes :
- **Aucun relevé, aucun téléchargement, avant que les trois réponses soient à l'écran.**
- **Une question fixe qui revient vide se repose. Elle ne se déduit jamais.**

## 18. Les agents de construction ne devraient pas toucher au navigateur

Quatre agents ont piloté le même panneau en parallèle. Résultat : deux clics en timeout pour
l'un — « rebuilds Fast Refresh très fréquents déclenchés par d'autres agents », dit son
rapport —, des navigations inattendues pour un autre, et trois d'entre eux qui ont dépensé du
budget à vérifier visuellement ce que l'orchestrateur revérifie de toute façon dans son
auto-test.

**Ce qu'il faut changer.** Le brief d'un agent de construction dit : tu écris, tu vérifies
avec `npx tsc --noEmit`, **tu n'ouvres pas le navigateur**. La vérification visuelle appartient
à l'orchestrateur, seul, après. Le relecteur, lui, garde son onglet — il travaille quand plus
personne n'écrit, et je lui avais déjà demandé d'ouvrir le sien.

## 19. Un fichier-contrat qui mélange base de données et helpers purs est un piège

`lib/reglages.ts` porte `lireReglages()`, qui lit la base, **et** `formatPrix()`, qui ne fait
que formater un nombre. Le simulateur de tarifs — composant client — importe `lib/formules.ts`
pour ses calculs, qui importe `formatPrix`, qui importe le fichier, qui importe Prisma.

Ça compilait. Jusqu'à ce que j'ajoute une ligne `import path from "node:path"` dans `lib/db.ts`
et que tout casse d'un coup, avec une trace d'erreur qui remontait jusqu'au simulateur.

**Ce qu'il faut changer.** Séparer par nature, pas par sujet : `lib/<sujet>.ts` pour ce qui est
pur et importable partout, `lib/<sujet>-serveur.ts` pour ce qui touche la base. Un composant
client qui a besoin d'un formatage ne doit pas pouvoir tirer la base derrière lui.

## 20. Le garde-fou se trompe dans les deux sens

À la dernière exécution : deux faux positifs et un faux négatif.

- **Faux positif** — `app/connexion/page.tsx` signalée « page sans navigation ». C'est voulu :
  une page de connexion est nue par nature, comme le tunnel de commande.
- **Faux positif** — cinq « mots creux » sur « au service de ». C'est la signature déposée du
  client, reprise mot pour mot de son propre site. Trois des cinq sont dans `BLUEPRINT.md` et
  `CONTENU.md`, qui ne sont pas des fichiers livrés.
- **Faux négatif** — `app/not-found.tsx` n'était pas comptée parmi les pages sans navigation,
  alors qu'elle n'en avait pas. C'est le relecteur qui l'a trouvée, et il l'a classée deuxième
  défaut du site.

**Ce qu'il faut changer.** Ne pas scanner les fichiers de préparation ; connaître la liste des
pages légitimement nues ; inclure la 404 dans la règle « chaque page rend Nav et PiedDePage ».

## 21. Dix-sept hypothèses au même niveau, c'est une liste qu'on ne lit pas

Le blueprint en portait dix-sept, toutes présentées pareil. L'utilisateur a répondu aux quatre
questions ouvertes et n'en a contesté aucune. Deux lectures possibles, et je ne sais pas
laquelle est la bonne — ce qui est déjà le problème.

**Ce qu'il faut changer.** Les trier par **coût de l'erreur** : d'abord les deux ou trois dont
la correction imposerait de reconstruire (le mode fidèle ou réinterprété, la structure de
l'offre, qui parle dans le héros), ensuite le reste. Une liste de trois se lit.

## 22. Ce que je n'ai pas vérifié, et que j'ai laissé passer

- **`prefers-reduced-motion`** : jamais testé. J'ai supposé, à la lecture du code, que les
  primitives le respectaient. C'est probablement vrai — elles sont écrites pour —, mais
  « probablement » n'est pas une vérification, et la liste de contrôle demande explicitement
  de regarder.
- **Le clavier** : ordre de tabulation et pièges de focus jamais parcourus, alors que le site
  vise des collectivités, où l'accessibilité est une obligation et un argument de vente.
- **Huit erreurs 404 dans la console**, vues, regardées une fois dans le journal réseau, et
  écartées comme du bruit sans être identifiées. Elles l'étaient peut-être. Je n'en sais rien,
  et c'est ça le défaut : **une 404 inexpliquée s'identifie, elle ne se balaye pas.**
- **L'image de partage** : générée, jamais regardée. C'est pourtant la première chose qu'un
  client voit quand on lui envoie le lien — voir la section suivante.

## 23. Le back-office a coûté le plus gros poste, pour l'usage le plus incertain

L'agent du back-office est de loin le plus lourd des quatre : 155 appels d'outils, 33 minutes,
et la plus grosse part du budget de la construction. Il a produit sept écrans complets,
propres, sécurisés — pour un espace que le propriétaire ouvrira peut-être trois fois par an.

Ce n'est pas du gaspillage en soi : c'était au blueprint, et le module a été demandé. Mais la
question n'a jamais été posée à la bonne granularité. Entre « pas de back-office » et « un
back-office complet sur sept modèles », il y a **« les textes et les messages, rien d'autre »**,
qui couvre l'essentiel de ce qu'un gérant modifie vraiment.

**Ce qu'il faut changer.** Quand le module `admin` est retenu, une question de plus : quels
écrans ? Avec trois réponses — *textes et messages* · *plus l'offre et les tarifs* ·
*tout ce que le blueprint prévoit*.

## 24. Ce qui a marché, et qu'il ne faut pas casser en corrigeant le reste

- **`CONTENU.md`** — deuxième bootstrap consécutif sans un seul mauvais texte, sur quatre-vingts
  fichiers écrits par quatre agents. Aucun n'a reformulé, aucun n'a inventé. La règle « le
  texte est décidé avant, la construction ne fait que le poser » est ce qui tient le mieux
  dans tout le skill.
- **Les périmètres de fichiers exclusifs** — quatre agents en parallèle, zéro conflit, zéro
  écrasement, et `tsc` propre chez les quatre à l'arrivée.
- **Le relecteur sans contexte** — douze observations, sept corrections. Il a trouvé la 404
  sans navigation et le marqueur « À CONFIRMER » publié tel quel, deux choses que ni le
  garde-fou ni moi n'avions vues.
- **Les valeurs par défaut en code, surchargées en base** — `lib/textes.ts` et `lib/reglages.ts`
  portent le contenu d'origine ; la base ne stocke que ce qui a été modifié. Le site fonctionne
  avant même le premier seed, et « rétablir le texte d'origine » est une suppression de ligne.
  À généraliser explicitement dans le socle : c'est un patron, pas un hasard.

---

# La mise en ligne : une contrainte d'architecture, pas une étape finale (2026-09-06)

Demandé à la fin du quatrième bootstrap : pouvoir envoyer un lien à un client pour qu'il
regarde, sans parler d'hébergement définitif.

## Ce que la tentative a appris

Elle a échoué, et proprement : le site tel qu'il est **ne se déploie pas** sur un hébergement
sans serveur. Base SQLite posée sur le disque, actions serveur qui écrivent dedans, session
d'authentification — trois choses qui supposent un disque inscriptible et un processus qui
dure. Sur Vercel ou Netlify, le disque est en lecture seule.

Les contournements existent — reconstruire la base au build, tolérer l'écriture qui échoue,
servir les images depuis ailleurs — mais je les ai improvisés à la fin, sous contrainte, et
c'est exactement le moment où l'on prend de mauvaises décisions.

**Le constat.** Savoir qu'un lien devra être partagé change des décisions prises au blueprint.
Ce n'est donc pas une étape à ajouter à la fin : c'est une question à poser au début.

## Deux besoins différents, deux réponses

« Montrer » et « envoyer » ne demandent pas la même chose.

| | Le lien éphémère | Le lien qui tient |
|---|---|---|
| **Pour** | « regarde ça, maintenant » — un associé, un ami, soi-même sur un autre appareil | « je t'envoie ça, réponds quand tu peux » — un client, un devis en cours |
| **Comment** | un tunnel au-dessus du site, compilé en production et servi en local | un déploiement sur un hébergeur |
| **Délai** | une trentaine de secondes | quelques minutes, la première fois |
| **Compte** | aucun | une connexion, dans le navigateur, que seul l'utilisateur peut faire |
| **Ce qui marche** | **tout** — formulaires, back-office, écritures en base | la lecture ; les écritures échouent |
| **Durée de vie** | tant que la fenêtre reste ouverte | des semaines |

Le tunnel est la bonne réponse par défaut, et c'est celle à laquelle je n'ai pas pensé en
premier. Servi au-dessus d'un `npm run build && npm start`, il donne le vrai site : l'overlay
d'édition est absent (il est conditionné à `NODE_ENV === "development"`, vérifié), la base est
la vraie, le formulaire de contact enregistre pour de bon. Aucun compte, aucune clé.

Sa limite est franche et se dit en une phrase : **le lien meurt quand tu fermes.**

## Quand poser la question

**Au début, dans la salve 2**, une question de plus, à un clic :

> **Faudra-t-il pouvoir envoyer un lien à quelqu'un pendant la construction ?**
> - *Oui, un lien à partager* — je prépare de quoi le faire à tout moment
> - *Non, je regarde sur ma machine* — rien à installer

Et si la réponse est oui, **l'installation ou la connexion se fait pendant `npm install`**.
C'est du temps mort qui existe déjà, où l'utilisateur attend sans rien faire ; c'est le seul
moment de tout le bootstrap où lui demander une action ne coûte rien. À la fin, la même
demande arrive quand tout le monde veut voir le résultat, et elle est vécue comme un obstacle
— c'est précisément ce qui s'est passé.

## Ce qu'il faut écrire

Un `scripts/partager.mjs` qui ne pose aucune question et fait ce qu'il peut :

1. Il regarde ce qui est disponible : un outil de tunnel installé ? une interface en ligne de
   commande d'hébergeur déjà connectée ?
2. Il choisit le plus simple des deux, sans demander.
3. Il compile en production, sert le résultat, ouvre le lien, et **l'affiche seul, en clair**.
4. Il force le refus d'indexation tant que l'adresse publique définitive n'est pas renseignée
   — une copie de travail ne doit jamais concurrencer le vrai site dans les moteurs.
5. Si rien n'est disponible, il n'échoue pas : il imprime **la seule commande à lancer**, et
   rien d'autre.

Et deux ajouts qui vont avec, parce qu'un lien partagé n'est pas un site regardé sur sa propre
machine :

- **L'image de partage entre dans l'auto-test.** Quand on envoie un lien sur WhatsApp ou par
  courriel, la carte qui s'affiche *est* `opengraph-image`. Je l'ai générée à ce bootstrap et
  je ne l'ai jamais regardée. Elle doit être ouverte et vue, comme n'importe quelle page.
- **Les marqueurs « À CONFIRMER » se comptent à la remise**, avec leur emplacement. Le
  relecteur a classé celui des mentions légales comme le défaut le plus sérieux du site :
  sur une machine locale c'est un pense-bête, sur un lien envoyé à un client c'est une note de
  chantier publiée.

---

# Ce qui a été appliqué, et ce qui reste (2026-09-06)

Les vingt-quatre remontées ci-dessus ont été traitées en lot le jour même, après la
suppression du site de test. Le détail des décisions structurantes est dans `DECISIONS.md`,
D12 à D15.

## Appliqué

| # | Remontée | Où c'est corrigé |
|---|---|---|
| 1 | `eyebrow` non définie | `socle/app/globals.css` — `@utility eyebrow` ; vérifié compilé dans le CSS d'un build réel |
| 2 | Actifs demandés par glisser-déposer | phase 0.b — on demande un chemin, un dossier ou une adresse ; le piège est aussi dans « Pièges connus » |
| 3 | Questions fixes noyées dans une salve | phase 0.b — salve 4, seules, avec l'avertissement et la règle « une question fixe vide se repose » |
| 4 | Serveur de dev à tenir toute la session | phase 0.55 — commande `Monitor` persistante avec son filtre, et l'arrêt avant chaque build |
| 5 | Module legal copiant les CGV sans vente | phase 0.55 — « un module ne se copie pas en bloc » |
| 6 | Voix des clients : partir du site du client | phase 0.58 — son site d'abord, le web ensuite |
| 7 | `get_page_text` partiel | phase 0.c et `extraction-charte.md` §5 — recette `sitemap.xml` + `curl` |
| 8 | Pro Max interrogé pour rien | phase 0.5 — pas de `--design-system` quand la référence appartient à l'utilisateur |
| 10 | Overlay promis sur `/blueprint` | phase 0.55, phase 0.6 et `overlay.md` — la promesse est retirée et l'explication écrite |
| 11 | 404 sans navigation | `socle/app/not-found.tsx` (avertissement en tête), phase 1, et `verifier-projet.mjs` qui la compte |
| 12 | Marqueurs « À CONFIRMER » | `verifier-projet.mjs` donne fichier + ligne + texte, sépare code livré et préparation, bloque en `--production` ; redits à la remise |
| 14 | Élément de référence disparu sans trace | `releve-complet.js` §8, `extraction-charte.md` §0, phase 0.c — un verdict par élément |
| 15 | Pas de vocabulaire de réaction | `socle/app/globals.css` « LES ÉTATS », `mouvement.md`, et la ligne « ce qui répond » dans chaque brief |
| 16 | Blueprint qui ne montre rien | bloc `squelette` + rendu dans `blueprint-html.mjs` ; regardé à l'écran, étiquette de mouvement recentrée |
| 17 | Phase 0.c jamais exécutée | avertissement bloquant en tête de la phase 0.c, trois règles |
| 18 | Agents se disputant le navigateur | phase 1 — interdiction dans chaque brief, sauf le relecteur qui ouvre son propre onglet |
| 19 | Pur et serveur mélangés | `socle/lib/formats.ts` créé, `reglages.ts` allégé, règle en phase 1 et dans « Pièges connus » |
| 20 | Garde-fou faux positifs et faux négatif | `verifier-projet.mjs` — pages nues tolérées, 404 incluse, `.md` de préparation ignorés, échappatoire `mots-creux-ok` |
| 21 | Hypothèses toutes au même niveau | phase 0.6 — deux groupes, « on reconstruit » et « on corrige » |
| 22 | Vérifications manquées | `verifier-le-rendu.md` — survol, mouvement réduit testé, clavier, image de partage, et la règle sur les erreurs de console |
| 23 | Back-office trop gros par défaut | phase 0.b salve 3 — trois niveaux d'écrans |
| — | Mise en ligne | `scripts/partager.mjs`, `lancement.md`, question en salve 3, connexion pendant `npm install` |

## Non appliqué, et pourquoi

- **N° 9 — l'onglet du panneau épinglé par un fichier SVG.** Défaut de l'environnement, pas
  du skill. Rien à corriger ici ; le contournement est d'ouvrir un nouvel onglet.
- **N° 13 — le relecteur.** Aucune correction nécessaire : l'étape fonctionne. Elle est
  seulement mieux décrite — il ouvre son propre onglet, et on lui demande aussi ce qui ne
  répond pas au curseur.

## Ce qui reste à éprouver

`scripts/partager.mjs` a depuis été éprouvé de bout en bout — voir la section suivante. Il
reste deux zones non couvertes : l'échec de compilation pendant un partage, et le chemin
« hébergeur déjà connecté ».

---

# Le partage par tunnel, éprouvé de bout en bout (2026-09-06)

`scripts/partager.mjs` avait été écrit sans jamais pouvoir tourner : aucun outil de tunnel
n'était installé sur la machine. Le chemin complet est maintenant vérifié, sur un projet
neuf tiré du socle.

## Ce qui a été mesuré

| | Résultat |
|---|---|
| Compilation, serveur de production, ouverture du tunnel | enchaînés sans intervention |
| Adresse publique lue dans la sortie de l'outil | trouvée, et rendue en `BUILDYOURSITE_PARTAGE=` |
| Réponse depuis l'extérieur | `HTTP 200` en 0,42 s |
| Contenu servi | le vrai site compilé, 23 795 octets, titre correct, classe `eyebrow` rendue |
| Overlay d'édition | **absent** — la compilation de production le retire, comme annoncé |
| Seconde page (`/robots.txt`) | `HTTP 200` |
| Après arrêt | aucun `cloudflared` résiduel, aucun `node` résiduel, port libéré |
| Le lien après arrêt | `HTTP 530` — mort, comme promis |

## Le piège trouvé en installant l'outil

**L'outil installé reste invisible de la session déjà ouverte.** L'installateur écrit bien
son chemin dans le PATH de la machine, mais un terminal démarré avant garde l'environnement
qu'il avait alors. Conséquence : on installe l'outil parce que le script vient de le
réclamer, on relance le script, et il répond encore « rien n'est disponible ». Personne ne
devine qu'il faut rouvrir une session.

`trouverCloudflared()` regarde donc aussi les emplacements d'installation par défaut, et se
sert du chemin complet quand il l'y trouve — en le citant, parce qu'il contient des espaces
sous Windows.

C'est un défaut qui ne pouvait apparaître qu'en installant l'outil pour de vrai. Écrire le
script sans pouvoir l'exécuter l'aurait laissé passer.

## Ce qui reste non éprouvé

- **L'échec de compilation** pendant un partage : le message et le code de sortie n'ont pas
  été provoqués.
- **Le chemin hébergeur** (b), qui demande une interface en ligne de commande déjà connectée.
- **`Ctrl+C` tapé à la main** : l'arrêt a été déclenché par la fin du processus parent, et le
  résultat observable est le bon — rien ne survit, le port est rendu. Le gestionnaire de
  signal lui-même n'a donc pas été isolé de ce qui l'entoure.

---

# La question du lien était au mauvais endroit (2026-09-06)

Corrigé le jour même, après une question de l'utilisateur : *à quel moment poses-tu la
question du partage ?*

## L'erreur de raisonnement

J'avais mis la question au début, en salve 3, avec cette justification : « ce n'est pas une
commodité de fin de parcours, c'est une contrainte d'architecture ».

La contrainte est réelle — un site dont la base vit sur le disque et dont les actions
écrivent dedans ne se déploie pas sur un hébergement sans serveur — **mais elle n'appartient
qu'au lien hébergé.** Le tunnel, lui, sert le site tel qu'il est, depuis la machine, avec sa
vraie base et ses écritures qui fonctionnent. Il n'impose rien au blueprint.

J'ai donc appliqué au tunnel une limite qui ne le concerne pas, et fait poser à l'utilisateur,
au moment où il pense à son contenu, une question dont la conséquence n'arrive qu'à la fin.

C'est un défaut de raisonnement plus intéressant qu'un défaut de code : la règle générale que
j'en tire est **qu'une justification héritée d'un cas voisin ne se recopie pas sans vérifier
qu'elle s'applique.** Ici, « déployer » et « partager » se ressemblaient assez pour que je
transporte la contrainte de l'un à l'autre sans la retester.

## Ce que ça devient

Trois moments, et **un seul est une question** :

1. **Relevé de capacités**, phase 0.a — `cloudflared` présent ou non, une ligne, `✓` ou `✗`.
   Une information, comme la clé Pexels.
2. **Pendant `npm install`**, phase 0.55 — s'il manque, une ligne avec la commande, à lancer
   pendant l'attente. Aucune réponse attendue : s'il ne fait rien, on continue.
3. **À la remise**, une fois qu'il a dit que le site lui plaît — *« Tu veux un lien à envoyer,
   pour le montrer à quelqu'un ? »*

Le signalement du milieu garde sa raison d'être : c'est du temps mort qui existe déjà, le seul
moment où une action de l'utilisateur ne coûte rien. Mais il ne bloque plus rien, et le script
réimprime la commande le moment venu.

**Ce qu'il reste au début : rien à décider.** Ce qui est le bon niveau de charge pour une
fonction dont on ne sait pas encore si on en aura besoin.
