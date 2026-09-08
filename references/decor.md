# Le décor — fonds, et bibliothèques de composants

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
palette**, il n'a pas d'autre source. Le rendu est déterministe — même graine, même forme —
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
de couverture. Invisible. La règle est devenue un calcul — on prend dans la palette la
couleur la plus éloignée du fond en luminance, et l'opacité compense un contraste faible.
Après correction, sur une charte crème et pétrole : écart moyen de 80 pour `grille`, pics à
184 pour `points`. **Discret veut dire léger, pas absent** — et ça se vérifie en regardant
les pixels, pas en jugeant à l'œil dans un panneau qui ne repeint pas toujours.

---

## 2. Les registres de composants — une référence, pas une réserve

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
> nom. Le site de la bibliothèque sert à en trouver un ; un serveur MCP hébergé existe aussi
> et couvre la recherche, mais il n'est pas nécessaire pour lire.

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

**Donc : lire, comprendre l'agencement, réécrire avec nos jetons et nos primitives.** Un bloc
recopié tel quel donne cinq sites identiques — c'est exactement ce que D2 refuse. Un
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
