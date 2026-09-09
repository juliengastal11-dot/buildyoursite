# Le mouvement : quand, quoi, avec quelle primitive

Le deuxième bootstrap a livré un site plat. Les primitives existaient ; personne ne les avait
demandées. Ce fichier existe pour que le mouvement soit **décidé au blueprint, écrit dans
les briefs, et vérifié à la fin**, jamais laissé au hasard d'un agent.

> **Le mouvement a deux moitiés, et on n'en voyait qu'une.**
>
> **L'arrivée** : comment un élément entre en scène. C'est le sujet des six primitives
> ci-dessous, et c'était tout ce que ce fichier couvrait.
>
> **La réaction** : comment un élément répond au curseur, au doigt, au clavier. C'est
> l'autre moitié, et elle vit dans `app/globals.css`, sous « LES ÉTATS » : voir la section
> [Les états](#les-états--ce-qui-répond) à la fin.
>
> Vécu au quatrième bootstrap : le site de référence avait trois téléphones cliquables qui
> se soulevaient au survol. Le relevé l'avait mesuré : `transform, box-shadow, filter,
> opacity · 0.55s`, noir sur blanc. Rien, entre le relevé et les briefs, ne transformait
> cette mesure en consigne. Le site livré avait un téléphone, immobile et sans lien. Ce que
> l'utilisateur a remarqué en premier, ce n'est pas une apparition manquante : c'est que
> rien ne bougeait sous sa souris.

## Trois principes

**Le mouvement raconte, il ne décore pas.** Une apparition dit « voici la suite ». Une
cascade dit « ces choses vont ensemble ». Un compteur dit « ce chiffre compte ». Un
mouvement qui ne dit rien est du bruit.

**Une fois.** Tout ce qui apparaît au défilement apparaît une seule fois. Rejouer à chaque
passage, c'est une interface qui se bat avec son lecteur.

**Le lecteur qui a demandé moins d'animations est servi le premier.** Toutes les primitives
affichent sans animer sous `prefers-reduced-motion`. Ne contourne jamais ça.

## Les six primitives du socle

Toutes dans `components/ui/`. Elles portent la structure (ce qui bouge, dans quel ordre,
déclenché par quoi) et lisent leurs valeurs dans `lib/mouvement.ts`.

| Primitive | Pour | Combien par page | Déclencheur |
|---|---|---|---|
| `EntreeHero` | le bloc de texte du héros : eyebrow, titre, paragraphe, boutons | **une** | chargement |
| `Cascade` | une grille : produits, engagements, témoignages, logos | une par grille | entrée dans le viewport |
| `Reveal` | un bloc isolé : une citation, une image, un paragraphe fort | avec parcimonie | entrée dans le viewport |
| `Compteur` | un chiffre **vrai et significatif** | deux ou trois, ensemble | entrée dans le viewport |
| `Defilant` | des mots-clés, des origines, des logos de partenaires | une bande, rarement deux | chargement, en boucle |
| `Parallaxe` | une photo pleine largeur ou un cadre image | une ou deux | défilement, continu |

### Celles qui répondent, au lieu d'entrer en scène

Les six précédentes font entrer un élément. Les trois suivantes réagissent à ce que fait le
visiteur. Elles ne portent pas `data-mouvement` : leur élément doit rester visible sans
JavaScript, alors qu'une entrée en scène doit rester cachée jusqu'à ce qu'elle se joue.

| Primitive | Pour quoi | Combien | Déclenché par |
|---|---|---|---|
| `Relief` | une carte qui s'incline et s'éclaire sous le curseur | une grille, jamais deux | le curseur · **ignoré sur écran tactile** |
| `Progression` | une barre de lecture, en haut de la fenêtre | une, sur un texte long | le défilement |
| `Rotatif` | un mot qui change dans une accroche | **une par page** | le temps, en boucle |

`Relief` ne s'active que sur `(hover: hover) and (pointer: fine)` : sur un écran tactile, le
navigateur émule un survol au premier appui et la carte resterait inclinée après le doigt.

`Progression` n'a de sens que sur un texte long : un article, une page légale. Sur une page
d'accueil de trois écrans, elle promet une longueur que la page n'a pas.

`Rotatif` garde la phrase serrée : la largeur du bloc suit le mot affiché. Sans JavaScript et
en mouvement réduit, seul le premier mot existe, sans blanc réservé.

### Emplois, dans le code

```tsx
// Héros : envelopper le bloc qui contient DIRECTEMENT les éléments à faire entrer.
<EntreeHero className="max-w-2xl">
  <p className="eyebrow">…</p>
  <h1>…</h1>
  <p>…</p>
  <div className="flex gap-4">…boutons…</div>
</EntreeHero>

// Grille : Cascade EST la grille. Lui donner les classes de grille.
<Cascade className="grid gap-6 md:grid-cols-3">
  {produits.map((p) => <CarteProduit key={p.id} produit={p} />)}
</Cascade>

// Chiffre : rendu final côté serveur, comptage à l'écran.
<p className="font-display text-5xl"><Compteur valeur={3400} suffixe=" clients" /></p>

// Bande : le contenu est dupliqué automatiquement, ne pas le doubler soi-même.
<Defilant className="border-y border-border py-4">
  {origines.map((o) => <span key={o}>{o}</span>)}
</Defilant>

// Photo : Parallaxe porte lui-même overflow-hidden et relative.
<Parallaxe className="aspect-[4/5] rounded-card">
  <Photo slot="atelier" src="/photos/atelier.jpg" alt="" className="h-full w-full" />
</Parallaxe>

// Bloc isolé : fondu par défaut, ou masque.
<Reveal mode="masque"><blockquote>…</blockquote></Reveal>

// Carte qui répond au curseur. `lumiere={false}` sur un fond déjà chargé.
<Relief className="rounded-xl border bg-card p-8">…</Relief>

// Barre de lecture. Sans `cible`, elle suit la page entière.
<Progression />
<Progression cible="#article" />

// Mot qui change. Le premier est celui du rendu serveur.
Un site pour votre <Rotatif mots={["restaurant", "cabinet dentaire", "atelier"]} />.
```

## Régler `lib/mouvement.ts` depuis Pro Max

Au bootstrap, `--motion` donne une direction ; ce fichier la traduit en valeurs. Repères :

| Type de site | `--motion` | `duree` | `distance` | `decalage` | `parallaxe` |
|---|---|---|---|---|---|
| Vitrine, éditorial | 5–7 | 0,9–1,1 | 28–36 | 0,08–0,12 | 0,12–0,2 |
| Boutique | 3–4 | 0,7–0,9 | 20–28 | 0,06–0,08 | 0,08–0,12 |
| Application, back-office | 1–2 | 0,4–0,6 | 12–16 | 0,04 | 0 (pas de parallaxe) |

Puis `--domain gsap` pour le vocabulaire des chorégraphies plus élaborées que Pro Max
connaît : épinglage, texte découpé, timelines. Ne les écris que si la page le demande ; une
vitrine n'a pas besoin de plus que les six primitives.

Retire `<DefilementFluide />` de `app/layout.tsx` sur une application : le défilement natif
y est préférable.

## Ce qu'on refuse

- **Tout animer.** Chaque section qui apparaît, chaque titre qui glisse : au troisième, le
  lecteur ne voit plus rien. Une entrée de héros, une cascade par grille, et le reste est
  immobile.
- **Un compteur sur un chiffre creux.** « 3 étapes », un prix, une année de fondation
  affichée en grand : non. Un compteur affirme que le chiffre mérite qu'on le regarde monter.
- **Un bandeau défilant avec du texte à lire.** On ne lit pas ce qui bouge. Des mots, des
  noms, des logos.
- **Une parallaxe sur toutes les photos.** Une ou deux, sinon la page entière flotte.
- **Des rebonds, des élastiques, des rotations.** La courbe est `power3.out` partout : elle
  freine en fin de course, comme un objet qui se pose.
- **Rejouer.** Jamais.

## Les états : ce qui répond

Trois classes dans `app/globals.css`, et on n'en invente pas d'autres. Elles sont en CSS et
non en JavaScript : un survol n'a pas besoin d'être orchestré, et une transition CSS survit à
tout, y compris à un script qui plante.

| Classe | Pour | Ce que ça fait |
|---|---|---|
| `carte-reactive` | une carte, une vignette, un bloc **cliquable** | se soulève de 3 px avec une ombre portée, s'enfonce à la pression |
| `lien-fleche` + `.fleche` sur l'icône | un lien terminé par une flèche : « Découvrir X → » | la flèche avance de 4 px, le texte ne bouge pas |
| `zoom-survol` | une photo dans un cadre `overflow-hidden`, avec `group` sur le parent | l'image grandit de 5 % dans son cadre |

Les trois se taisent sous `prefers-reduced-motion` et sur écran tactile : un appui y
déclencherait un faux survol, et l'état resterait collé après le doigt.

### Ce qu'on refuse

- **Faire réagir ce qui ne mène nulle part.** Un bloc décoratif qui se soulève sous le
  curseur promet un clic qui n'existe pas. `carte-reactive` va sur ce qui contient un lien.
- **Trois transitions différentes dans trois fichiers.** C'était l'état d'un vrai bootstrap :
  un agent avait écrit `hover:-translate-y-0.5`, un autre `transition-colors duration-150`,
  un troisième rien du tout. D'où ces classes.
- **Un survol qui déplace le texte.** La flèche avance, la ligne reste. Sinon on lit une
  page qui tremble.
- **Un état sans focus clavier.** Ce qui se distingue à la souris doit se distinguer au
  clavier : les composants du socle portent déjà un anneau de focus, ne le retire jamais
  pour faire joli.

## Dans les briefs d'agent

Chaque brief de section dit **ce qui bouge**, puis **ce qui répond**, en une ligne chacun :

> **Ce qui bouge**. Héros : `EntreeHero` sur le bloc de texte. Grille des produits :
> `Cascade`. Photo de l'atelier : `Parallaxe`. Le reste est immobile.
>
> **Ce qui répond**. Les cartes produit sont cliquables : `carte-reactive`. Le lien
> « Découvrir » : `lien-fleche`. La photo de l'atelier ne réagit pas, elle ne mène nulle part.

Et rappelle les deux règles : « les valeurs d'arrivée viennent de `lib/mouvement.ts`, n'écris
aucune durée ni distance en dur » et « les états viennent des classes de `globals.css`,
n'écris pas de `hover:` à la main ».

**Un brief qui ne dit rien de la seconde ligne produit une page morte sous la souris.** Ça
n'a pas d'effet sur le build, ça ne se voit sur aucune capture d'écran, et c'est la première
chose que l'utilisateur remarque quand il essaie son site.

## À la vérification finale

Fais défiler chaque page dans le panneau. Le héros est-il entré ? Les grilles se
dévoilent-elles ? Un chiffre a-t-il compté ? Si rien ne bouge, ce n'est pas de la sobriété :
c'est un brief qui n'a rien demandé.

**Puis survole.** Passe le curseur sur une carte cliquable, sur un lien à flèche, sur une
photo. Si rien ne répond, la moitié « réaction » a été oubliée. C'est arrivé, et personne ne
l'a vu avant la remise. Un `grep` de `carte-reactive` et `lien-fleche` dans le projet dit en
une seconde si les classes ont été demandées ou si les agents les ont ignorées : zéro
occurrence sur un site qui a des cartes cliquables est un défaut, pas un choix.

**Et vérifie vraiment le mouvement réduit**, ne le suppose pas à la lecture du code. Dans le
panneau, une bascule suffit :

```js
matchMedia("(prefers-reduced-motion: reduce)").matches
```

Si le panneau ne sait pas l'émuler, relis **chaque** primitive et **chaque** classe d'état
pour confirmer sa garde, et dis dans ton rapport que c'est une relecture, pas un essai.
« Probablement respecté » n'est pas une vérification.

Si **tout** est invisible, un script a planté avant l'hydratation : la feuille masque
d'avance ce que GSAP doit dévoiler (`html.js [data-mouvement]`). La console dit lequel.
