# Consignes communes aux agents — gabarit

À écrire dans `.buildyoursite/consignes-agents.md` du projet, **avant de lancer le moindre
agent**, et à faire lire en premier par chacun. Le brief individuel ne porte alors que ce
qui change d'un agent à l'autre : le périmètre, les props, la mise en page section par
section, ce qui bouge, ce qui répond. Une page au lieu de quatre.

Éprouvé au cinquième bootstrap : cinq agents en parallèle, pas un texte inventé, pas une
couleur en dur, et des rapports qui signalent d'eux-mêmes leurs ambiguïtés. Ce fichier est
la raison.

Remplace tout ce qui est entre accolades. Ne laisse aucune accolade dans le fichier livré.

---

```markdown
# Consignes communes — {nom du site}

Tu construis une partie d'un site Next.js 15 déjà en marche. Lis ce fichier en entier, puis
ton brief. En cas de désaccord entre les deux, ton brief l'emporte sur le périmètre, ce
fichier l'emporte sur tout le reste.

## Ce que tu ne fais jamais

- **Inventer un texte.** Chaque ligne que le visiteur lira est dans `CONTENU.md`, section par
  section. Tu la câbles telle quelle. Si une ligne manque, tu écris
  `[[À CONFIRMER PAR L'UTILISATEUR : ce qui manque]]` et tu le dis dans ton rapport.
- **Écrire une couleur, une police ou un espacement en dur.** Uniquement les classes du
  thème listées ci-dessous.
- **Toucher un fichier hors de ton périmètre.** Un autre agent y travaille. Si tu as besoin
  qu'il change, écris-le dans ton rapport.
- **Importer `gsap` directement.** Le mouvement passe par les primitives du socle.
- **Utiliser un placeholder comme libellé**, un emoji, ni « lorem ipsum ».

## Le thème — les seules classes de couleur autorisées

{la liste des jetons de `app/globals.css`, telle quelle :}
`bg-background` `text-foreground` `bg-card` `bg-primary` `text-on-primary` `bg-secondary`
`bg-muted` `text-muted-foreground` `text-accent` `border-border` …

{les règles de contraste relevées : « pas de texte accent sur fond clair », etc.}

Polices : `font-sans` pour le texte, `font-display` pour les titres. Rien d'autre.

## Le socle — ce qui existe déjà, à importer comme si c'était là

| Import | Sert à |
|---|---|
| `@/components/ui/section` | toute section : eyebrow, titre, intro, fond, largeur |
| `@/components/ui/button` | tout bouton et tout lien d'action (`asChild` pour un `<a>`) |
| `@/components/ui/photo` | toute image : réserve, `alt`, `data-photo-slot` |
| `@/components/ui/reveal`, `cascade`, `entree-hero`, `compteur`, `defilant`, `parallaxe` | ce qui entre en scène |
| `@/components/ui/relief`, `progression`, `rotatif` | ce qui répond |
| `@/lib/formats` | dates, heures, prix — jamais `toLocaleDateString` en direct |
| {les fichiers-contrats du projet : `lib/site.ts`, `lib/tarifs.ts`, …} | {ce qu'ils exposent} |

`Nav` et `PiedDePage` existent : importe-les, ne les réécris pas.

## Les formats

- Titres : **trois paliers** de taille, `text-2xl sm:text-3xl md:text-4xl` au minimum.
- Un mot français long en display déborde toujours du palier le plus bas : prévois-le.
- Tout élément cliquable porte `cursor-pointer`, un focus visible, et une classe d'état
  (`carte-reactive`, `lien-fleche`, `zoom-survol`).
- Chaque image passe par `Photo` avec un `alt` — vide seulement si décorative et dit.
- Chaque fichier que tu crées commence par `// data-src` ? Non : chaque composant de
  section porte `data-src="{chemin}"` sur sa racine, pour l'overlay.
- Téléphone en `tel:`, e-mail en `mailto:`, WhatsApp en lien direct.

## Ce qui bouge, et combien

Direction du site : {la ligne de `lib/mouvement.ts` — vitrine ample / boutique sobre /
application immobile}. Les valeurs sont dans `lib/mouvement.ts` ; tu ne les changes pas.
Une primitive d'entrée par section au plus. Le texte de paragraphe ne s'anime jamais.

## Les mots interdits, et le signe interdit

{la liste des mots creux relevés : « solutions », « accompagnement personnalisé »,
« passion », … ceux que le garde-fou refuse}

**Aucun tiret long « — » ni demi-long « – » au milieu d'une phrase.** C'est la signature
visuelle du texte écrit par une machine, et le visiteur la voit. Une incise prend deux
virgules ou une parenthèse, une rupture prend un point, une explication prend deux points.
Le tiret reste permis en début de ligne, pour une réplique ou l'attribution d'une citation,
et collé dans un intervalle comme « 9h–18h ». Cette règle vaut aussi pour les textes que tu
recopies depuis `CONTENU.md` : si la ligne source en contient un, remplace-le et signale-le
dans ton rapport.

**Quand le tiret sépare deux champs plutôt que deux morceaux de phrase**, titre d'onglet,
fil d'ariane, ligne qui aligne une quantité et un prix, écris un point médian « · ». Une
virgule y serait illisible.

## Ton rapport, à la fin

Cinq lignes :
1. Les fichiers écrits.
2. Ce que tu as dû décider seul, et pourquoi.
3. Ce que tu as marqué `[[À CONFIRMER]]`.
4. Ce dont tu aurais eu besoin d'un autre périmètre.
5. Ce qui, dans ces consignes, t'a semblé contradictoire ou manquant.
```
