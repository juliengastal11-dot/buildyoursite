# Le mouvement — quand, quoi, avec quelle primitive

Le deuxième bootstrap a livré un site plat. Les primitives existaient ; personne ne les avait
demandées. Ce fichier existe pour que le mouvement soit **décidé au blueprint, écrit dans
les briefs, et vérifié à la fin** — jamais laissé au hasard d'un agent.

## Trois principes

**Le mouvement raconte, il ne décore pas.** Une apparition dit « voici la suite ». Une
cascade dit « ces choses vont ensemble ». Un compteur dit « ce chiffre compte ». Un
mouvement qui ne dit rien est du bruit.

**Une fois.** Tout ce qui apparaît au défilement apparaît une seule fois. Rejouer à chaque
passage, c'est une interface qui se bat avec son lecteur.

**Le lecteur qui a demandé moins d'animations est servi le premier.** Toutes les primitives
affichent sans animer sous `prefers-reduced-motion`. Ne contourne jamais ça.

## Les six primitives du socle

Toutes dans `components/ui/`. Elles portent la structure — ce qui bouge, dans quel ordre,
déclenché par quoi — et lisent leurs valeurs dans `lib/mouvement.ts`.

| Primitive | Pour | Combien par page | Déclencheur |
|---|---|---|---|
| `EntreeHero` | le bloc de texte du héros : eyebrow, titre, paragraphe, boutons | **une** | chargement |
| `Cascade` | une grille — produits, engagements, témoignages, logos | une par grille | entrée dans le viewport |
| `Reveal` | un bloc isolé — une citation, une image, un paragraphe fort | avec parcimonie | entrée dans le viewport |
| `Compteur` | un chiffre **vrai et significatif** | deux ou trois, ensemble | entrée dans le viewport |
| `Defilant` | des mots-clés, des origines, des logos de partenaires | une bande, rarement deux | chargement, en boucle |
| `Parallaxe` | une photo pleine largeur ou un cadre image | une ou deux | défilement, continu |

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
```

## Régler `lib/mouvement.ts` depuis Pro Max

Au bootstrap, `--motion` donne une direction ; ce fichier la traduit en valeurs. Repères :

| Type de site | `--motion` | `duree` | `distance` | `decalage` | `parallaxe` |
|---|---|---|---|---|---|
| Vitrine, éditorial | 5 – 7 | 0,9 – 1,1 | 28 – 36 | 0,08 – 0,12 | 0,12 – 0,2 |
| Boutique | 3 – 4 | 0,7 – 0,9 | 20 – 28 | 0,06 – 0,08 | 0,08 – 0,12 |
| Application, back-office | 1 – 2 | 0,4 – 0,6 | 12 – 16 | 0,04 | 0 — pas de parallaxe |

Puis `--domain gsap` pour le vocabulaire des chorégraphies plus élaborées que Pro Max
connaît — épinglage, texte découpé, timelines. Ne les écris que si la page le demande ; une
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

## Dans les briefs d'agent

Chaque brief de section dit **ce qui bouge et avec quoi**, en une ligne par élément :

> Héros : `EntreeHero` sur le bloc de texte. Grille des produits : `Cascade`. Photo de
> l'atelier : `Parallaxe`. Le reste est immobile.

Et rappelle la règle : « les valeurs viennent de `lib/mouvement.ts`, n'écris aucune durée ni
distance en dur ».

## À la vérification finale

Fais défiler chaque page dans le panneau. Le héros est-il entré ? Les grilles se
dévoilent-elles ? Un chiffre a-t-il compté ? Si rien ne bouge, ce n'est pas de la sobriété :
c'est un brief qui n'a rien demandé.

Si **tout** est invisible, un script a planté avant l'hydratation — la feuille masque
d'avance ce que GSAP doit dévoiler (`html.js [data-mouvement]`). La console dit lequel.
