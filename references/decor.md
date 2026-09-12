# Le décor : fonds, et bibliothèques de composants

Deux raisons font qu'un site généré se reconnaît au premier coup d'œil : **des sections
rectangulaires empilées sur un fond uni**, et **une structure identique d'un site à l'autre**.
Le design system règle la palette et la typographie. Ce document traite du reste.

---

## 1. Les fonds SVG

```bash
node "<skill>/scripts/fonds.mjs" --projet . --type degrade --sortie public/fonds/hero.svg
node "<skill>/scripts/fonds.mjs" --lister
```

Les couleurs sortent des jetons `--color-*` du bloc `@theme` : **un fond ne peut pas être hors
palette**, il n'a pas d'autre source. Le rendu est déterministe (même graine, même forme),
donc un changement de palette se régénère sans perdre la composition.

| Besoin | Type | Hauteur | Réglage |
|---|---|---|---|
| Fond de héros | `degrade` | 500 à 700 | Deux couleurs de rôle, le fond en troisième |
| Séparateur entre deux sections | `vagues` | 150 à 220 | La dernière couche porte la couleur de la section suivante |
| Derrière une image, un portrait, un chiffre | `blob` | selon l'élément | Couleur d'accent |
| Fond de tarifs ou d'appel à l'action | `grille` | 400 à 600 | Une seule couleur, contraste calculé |
| Motif discret | `points` | libre | Se lit de près, disparaît de loin |

### Les règles, et pourquoi

**Deux fonds par site, pas davantage.** Un héros et un séparateur, c'est déjà beaucoup.
Et seulement ceux que le blueprint nomme, avec leur emplacement : un fond généré « au cas où »
finit dans `public/` sans emploi. C'est arrivé.
Au-delà, chaque section a son décor et la page paraît rapiécée.

**Le texte passe avant le fond.** Si la lecture demande un effort, baisse l'opacité ou pose
un voile. Un fond qui gêne la lecture est un fond raté, quelle que soit sa beauté.

**Toujours derrière le contenu**, jamais au-dessus, et en `object-cover` centré pour couvrir
sans déformer. Sur téléphone, recadre au centre plutôt que d'étirer.

**Le SVG, jamais le PNG.** Plus léger, net à toutes les tailles, et lisible en texte donc
modifiable à la main.

### Ce qui a été mesuré

Le premier jet posait les triangles de `grille` à 0,04 d'opacité et 80 points pour
1 440 × 500. Rendu puis mesuré au pixel : un écart de 20 sur 765 avec le fond, et un pour cent
de couverture. Invisible. La règle est devenue un calcul : on prend dans la palette la
couleur la plus éloignée du fond en luminance, et l'opacité compense un contraste faible.
Après correction, sur une charte crème et pétrole : écart moyen de 80 pour `grille`, pics à
184 pour `points`. **Discret veut dire léger, pas absent**, et ça se vérifie en regardant
les pixels, pas en jugeant à l'œil dans un panneau qui ne repeint pas toujours.

---

## 2. Les registres de composants : une référence, pas une réserve

Le socle déclare un registre au format shadcn dans `socle/components.json` :

```json
"registries": { "@watermelon": "https://registry.watermelon.sh/r/{name}.json" }
```

Ce qui permet, **depuis le terminal, sans navigateur ni compte** :

```bash
npx shadcn@latest view @watermelon/<nom-du-composant>
```

La fiche revient en JSON : description, dépendances, et le code source complet. C'est de la
lecture gratuite et immédiate, et c'est là tout l'intérêt.

> **La recherche par mot-clé ne fonctionne pas sur ce registre** : il ne publie pas d'index
> `registry.json`, donc `shadcn search` échoue. On consulte un composant dont on connaît le
> nom, et c'est là qu'un connecteur de bibliothèque prend le relais.

### Le connecteur de bibliothèque : ce qui est gratuit, ce qui se compte

Si le relevé des capacités a trouvé **un connecteur de bibliothèque de composants**, il
répond à la question que la ligne de commande ne sait pas poser : « montre-moi des sections
de tarifs à trois formules ». Éprouvé sur un connecteur réel, voici ce qui se paie et ce qui
ne se paie pas. La distinction commande tout le reste.

| Ce qu'on demande | Ce que ça rend | Ce que ça coûte |
|---|---|---|
| La recherche, par mots-clés ou par besoin | nom, description, auteur, **une image de rendu**, parfois une vidéo, la commande d'installation | rien, et sans plafond |
| Le classement par pertinence sur un besoin écrit en français | les mêmes fiches, avec un indice de confiance et la raison du choix | rien |
| Un thème de couleurs | le CSS complet des jetons, prêt à lire | rien |
| **Le code source d'un composant** | le composant, sa démo, ses dépendances | **une unité sur deux par jour** au palier gratuit |

**L'image de rendu est la clé.** Elle s'enregistre avec `curl` et se regarde directement. Sur
une section de tarifs, elle a suffi à lire tout ce qu'on cherchait : l'eyebrow au-dessus du
titre, les trois cartes dont celle du milieu surélevée avec sa pastille, le prix en gros
avec sa mention par mois posée sur la même ligne de base, la liste à coches, et le bouton
plein sur la carte mise en avant quand les deux autres l'ont en contour. C'est l'agencement,
c'est-à-dire exactement ce qu'on était venu chercher, et ça n'a rien coûté.

**Donc : on cherche, on regarde l'image, on rejoue avec nos jetons.** Le code source ne se
demande que si l'image laisse une vraie question sans réponse, par exemple une mécanique
d'ouverture qu'on ne devine pas. Et comme il se compte, **il se demande à l'utilisateur
avant**, avec le chiffre du jour : « il me reste deux consultations de code aujourd'hui,
j'en prends une pour comprendre comment ce panneau s'ouvre ? ». C'est la règle de l'argent,
qui ne fait pas d'exception pour un quota gratuit.

> **La vidéo de rendu ne se regarde pas.** Le panneau navigateur refuse de naviguer vers un
> `.mp4`, et l'extraction d'images demande `ffmpeg`, absent de la machine par défaut. La
> description du composant dit souvent ce qui bouge ; c'est ce qu'on lit à la place.

### Ce qu'on en prend, et ce qu'on n'en prend pas

**On lit la composition.** Comment un accordéon enchaîne ses rayons de bordure quand un
panneau s'ouvre, comment une grille de tarifs place son plan mis en avant, comment un pied de
page organise quatre colonnes. C'est la question à laquelle un design system ne répond pas :
il donne l'identité, pas l'agencement.

**On ne colle pas le code.** Trois raisons, vérifiées sur un composant réel du registre :

| Ce qu'on trouve dedans | Pourquoi c'est rédhibitoire |
|---|---|
| `bg-zinc-50`, `text-[#272729]`, `dark:bg-zinc-900` | Des couleurs en dur, hors de notre thème. Le site perd son identité section par section, et un changement de palette ne les atteint pas |
| `motion`, `react-icons`, `react-use-measure` | Une seconde bibliothèque de mouvement à côté de GSAP, et deux dépendances d'icônes. Voir D7 : deux systèmes de mouvement, c'est un de trop |
| Titres et textes de démonstration | Le garde-fou les refuse, et à raison |

**Le garde-fou est le filet, pas la permission.** `verifier-projet.mjs` bloque désormais
toute couleur hors du thème : la palette nommée de Tailwind avec sa nuance, le blanc et le
noir absolus, et la valeur écrite à la main dans la classe. Mesuré sur un composant repris
tel quel : trois blocages en une ligne. Il attrape aussi le jeton étranger, du type
`text-primary-foreground`, que notre thème ne définit pas puisqu'il dit `text-on-primary`.

**Tous les composants ne sont pas sales.** Certains, écrits au format shadcn, n'emploient
que des jetons et s'appuient sur des primitives qu'on a déjà : bouton, carte, icônes. Sur
ceux-là, l'écart se résume au nom de deux ou trois jetons et aux textes de démonstration.
Ça ne change pas la règle, ça change seulement le temps que l'adaptation prend.

**Donc : lire, comprendre l'agencement, réécrire avec nos jetons et nos primitives.** Un bloc
recopié tel quel donne cinq sites identiques. C'est exactement ce que D2 refuse. Un
agencement compris et rejoué avec la charte du projet donne un site qui ne ressemble à aucun
autre.

### Si un composant tient sans mouvement

Certains blocs sont de la mise en page pure. Ceux-là se reprennent presque tels quels, à deux
conditions : **toutes les couleurs passent aux jetons du thème**, et **les textes viennent de
`CONTENU.md`**. Passe ensuite le garde-fou, il attrape ce qui reste.

---

## 3. L'ordre, et pourquoi il compte

Structure, puis décor, puis mouvement. Animer avant d'avoir la structure, c'est animer des
éléments qu'on va supprimer. Poser un fond avant d'avoir la palette, c'est poser un fond à
refaire. Le bootstrap suit déjà cet ordre : blueprint, construction, mouvement, décor.
