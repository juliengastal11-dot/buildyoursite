# Relever la charte d'un site de référence

Quand l'utilisateur donne une URL et demande de s'en inspirer.
Procédure éprouvée sur un aperçu hébergé qui empilait deux iframes (premier bootstrap réel).

> ## Le relevé se fait avec `releve-complet.js`, pas de mémoire
>
> Atteins la page (§1 à 4 ci-dessous), puis colle **`references/releve-complet.js`** dans
> `javascript_tool`. Il relève les six dimensions en un passage et rend sa liste à cocher.
>
> | # | Dimension | L'oubli que ça évite |
> |---|---|---|
> | 1 | **Palette** : styles calculés, jamais les variables `:root` | Les tokens annonçaient une couleur d'accent ; les CTA en portaient une autre |
> | 2 | **Typographie** : polices rendues + leurs licences | Embarquer une fonderie commerciale sans licence web |
> | 3 | **Géométrie** : rotations, rayons, ombres, grilles, overflow | Le bandeau incliné livré plat |
> | 4 | **Liens sortants**, et leurs paramètres d'URL | L'icône Instagram reproduite en décoration, sans lien |
> | 5 | **Photos** : fichiers et textes alternatifs | Des dégradés à la place de photos qui étaient téléchargeables |
> | 6 | **Cadrage** : ratios, coins, `object-position` | Des cadres tous identiques là où la référence alternait |
> | 7 | **Mouvement** : défilement fluide, parallaxe, apparitions | Un site figé alors que la référence glissait |
> | 8 | **Inventaire interactif**, un élément par ligne : ce que c'est, où ça mène, comment ça réagit | Trois téléphones cliquables qui se soulevaient, devenus un téléphone mort ; un bouton flottant disparu |
>
> **Les huit ont été oubliés au moins une fois, et chaque fois trouvés par l'utilisateur.**
> Cette liste n'est pas une précaution théorique : c'est l'inventaire de mes manques.
>
> Trois règles qui vont avec :
> - **Relance à deux largeurs**, 375 et 1280. Un `hidden lg:block` est indiscernable à l'une
>   et invisible à l'autre.
> - **Recharge avant de relever le mouvement.** Une apparition jouée une seule fois a déjà
>   joué si tu as parcouru la page. Le script te prévient quand la page n'est plus en haut.
> - **Chaque ligne de l'inventaire interactif reçoit un verdict au blueprint.** Voir la
>   section suivante : c'est la règle qui rend un abandon visible.

> ## À lire avant de relever quoi que ce soit
>
> **Les deux questions de la phase 0.c doivent avoir été posées** : le site lui appartient-il,
> et reprend-on les liens sortants ?
>
> **Si le site n'est pas le sien**, les sections 5 (contenu), 6 ter (liens) et 8 (photos) de
> cette recette **ne s'appliquent pas**. Tu relèves la forme (palette, polices, géométrie,
> rythme) et rien d'autre. Textes rédigés par toi, photos remplacées par des dégradés,
> aucun lien, aucune coordonnée, aucun nom.
>
> **Si les liens ont été refusés**, tu poses la structure sans `href` et tu listes les liens
> attendus dans le blueprint, pour qu'il les remplisse.
>
> Rien de tout cela ne se voit à la relecture du code. Ça se voit en production, chez le
> client, quand un visiteur clique sur Instagram et arrive chez un inconnu.

## 0. Le verdict par élément : la règle qui rend un abandon visible

Le relevé rend un **inventaire des éléments interactifs** : un lien, un bouton, une carte
cliquable par ligne, avec sa destination, sa zone et sa réaction au survol. Le blueprint
reprend cet inventaire et donne à **chaque ligne** un verdict :

| Élément | Où | Ce qu'il fait | Verdict | Pourquoi |
|---|---|---|---|---|
| Trois téléphones | héros | liens vers les 3 marques, se soulèvent au survol | **réinterprété** | un héros porte une promesse et une action ; les marques ont leur section |
| Bouton flottant WhatsApp | toutes pages | lien sortant, message pré-rempli | **reproduit** | |
| Bandeau « Nouveau » | en-tête | lien vers une annonce, fermable | **abandonné** | rien à annoncer aujourd'hui ; à remettre au lancement |

Trois verdicts, pas deux : **reproduit**, **réinterprété**, **abandonné**. Un « réinterprété »
sans phrase d'explication n'en est pas un.

**Pourquoi cette table existe.** Sans elle, le blueprint décrit ce qu'on construit et jamais
ce qu'on laisse. L'utilisateur valide un plan complet et cohérent, sans pouvoir voir qu'un
élément de son site a disparu en route. Il ne le découvre qu'à la livraison, et il doit
poser la question lui-même. C'est exactement ce qui s'est passé au quatrième bootstrap, avec
les téléphones du héros.

La colonne « Repris : oui/non » du tableau des dimensions ne suffit pas : elle disait
« liens sortants : repris · oui », ce qui était vrai (ils étaient dans les réglages) et faux
en même temps (le bouton flottant avait disparu). Un verdict porte sur un élément, pas sur
une catégorie.

**Et ce qui réagit se reporte dans les briefs.** Une ligne d'inventaire qui porte une
transition au survol devient une ligne « ce qui répond » dans le brief de l'agent : voir
`mouvement.md`, section « Les états ». Une réaction relevée mais jamais transmise est une
réaction perdue.

## 1. `WebFetch` ne suffit pas

Sur toute application rendue côté client (c'est-à-dire à peu près tout aujourd'hui),
`WebFetch` renvoie le HTML initial, soit « Loading… » et rien d'autre.
**Ne conclus pas que la page est vide.** Passe au navigateur.

## 2. Navigateur intégré, et laisse le temps

`navigate` sur l'URL (hors `browser_batch` si le panneau n'est pas encore ouvert), puis
attends **4 à 10 secondes**. Une préview d'hébergeur peut aussi être en veille : cherche un
bandeau du type « wake servers ».

## 3. DOM vide ? c'est une iframe

Si `get_page_text` ne renvoie rien alors que la capture montre le site, le contenu est dans
une iframe. Liste-les :

```js
JSON.stringify({
  bodyChildren: [...document.body.children].map(e => e.tagName + (e.id ? '#'+e.id : '')),
  iframes: [...document.querySelectorAll('iframe')].map(f => ({
    src: f.src,
    sameOrigin: (() => { try { return !!f.contentDocument?.body } catch { return false } })()
  }))
}, null, 1)
```

## 4. Iframe cross-origin ? trouve le vrai domaine

Tu ne peux pas lire son DOM, et **scroller la page parente ne scrolle pas l'iframe**.
Il faut charger l'URL réelle au niveau supérieur.

Le `src` de l'iframe te le donne, parfois en deux sauts. Cas rencontré : la racine servait
un shell de chargement qui embarquait un second shell, lequel embarquait à son tour le vrai
site sur un sous-domaine dédié :

```
monsite.preview.hebergeur.tld          → shell « Loading… »
app.hebergeur.tld/loading?host=…       → shell intermédiaire
monsite.preview.static.hebergeur.tld   → le site
```

Charge cette dernière URL. Tu as alors le DOM, le texte et le scroll.

## 5. Le contenu

`get_page_text` d'un coup. Tu récupères la navigation, tous les titres, tous les paragraphes
et les libellés de boutons, c'est-à-dire la structure **et** la copie.

> **`get_page_text` peut ne rendre qu'un morceau.** Sur un site où il a trouvé un `<article>`,
> il n'a renvoyé que le contenu de cette balise (une seule carte au lieu de la page entière),
> sans rien signaler. Le symptôme : un texte anormalement court pour une page qu'on vient de
> voir remplie à l'écran.
>
> **Sur une application rendue côté client, le sitemap et le HTML sont vides, mais le
> bundle de développement ne l'est pas.** `curl` le `bundle.js` cité par la coquille ; s'il
> n'est pas minifié, ses modules `./src/**` se découpent sur les marqueurs
> `/***/ "./src/…":` (un `awk` suffit) et donnent les textes, les classes et les `alt` au
> mot près, plus fiables que `get_page_text`. Vécu au cinquième bootstrap sur un aperçu
> no-code : le `sitemap.xml` renvoyait un `<div id="root">` et rien d'autre.
>
> **Sur un site statique, prends le HTML directement.** C'est plus fiable, c'est le texte au
> mot près, et le `sitemap.xml` donne la liste complète des pages :
>
> ```bash
> curl -s "<origine>/sitemap.xml" | grep -oE "<loc>[^<]+" | sed "s/<loc>//"
> mkdir -p ref && curl -s "<origine>/" -o ref/accueil.html
> ```
>
> Puis un petit script HTML → texte dans ton dossier de travail : on récupère toutes les
> pages en un passage, avec les `alt`, les `href` et les titres, au lieu de naviguer page à
> page dans le panneau. Le navigateur reste indispensable pour tout le reste (couleurs
> calculées, géométrie, mouvement, inventaire interactif) qui n'existe pas dans le HTML.

> **La structure se reprend toujours, la copie seulement si le site est le sien.**
> D'un site tiers, retiens le *squelette* (combien de sections, dans quel ordre, quel type
> de contenu à chaque étage, quelle longueur de paragraphe) et **rédige les textes**.
> Un plan de page n'appartient à personne ; une accroche, si.

## 6. Les couleurs : depuis les styles calculés, jamais depuis les variables

**Le piège central.** Les variables CSS `:root` ne disent pas la vérité : un build Tailwind
garde les tokens du starter tout en peignant l'interface avec des valeurs arbitraires
écrites dans les classes.

Cas vécu : les tokens annonçaient une couleur d'accent qu'**aucun CTA du site n'utilisait**.
Leur vraie couleur, absente des variables, était posée en valeur arbitraire dans les
classes. Se fier aux tokens aurait donné un site de la mauvaise couleur.

Lis donc les styles réellement appliqués :

```js
const info = (el) => { const s = getComputedStyle(el); return {
  txt: (el.innerText||'').trim().slice(0,26), bg: s.backgroundColor,
  bgImg: s.backgroundImage.slice(0,150), color: s.color,
  font: s.fontFamily.split(',')[0], weight: s.fontWeight,
  radius: s.borderRadius, size: s.fontSize }; };
JSON.stringify({
  body: info(document.body),
  h1: info(document.querySelector('h1')),
  accents: [...document.querySelectorAll('h1 span, h1 em')].map(info),
  ctas: [...document.querySelectorAll('a,button')].slice(0,10).map(info),
  sections: [...document.querySelectorAll('section')].map(s => ({ id: s.id, bg: getComputedStyle(s).backgroundColor })),
}, null, 1)
```

Tu obtiens : fond de page, couleur de texte, fond de chaque section, fond et texte de chaque
CTA, couleur du mot accentué dans le titre, rayons, et les polices **réellement rendues**.

Le CSS compilé reste utile en complément. Les hex les plus fréquents et les
`font-family` déclarés donnent la profondeur de la palette :

```bash
curl -s "<url du .css>" -o palette.css
grep -oiE '#[0-9a-f]{6}\b' palette.css | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | head -18
grep -oE 'font-family: *[^;}]{1,80}' palette.css | sort -u
grep -oE '\-\-[a-zA-Z0-9-]+: *[^;}]{1,60}' palette.css | sort -u
```

## 6 bis. La géométrie : l'étape que j'avais oubliée

**Le trou le plus coûteux de la première version de cette recette.** Je relevais les
couleurs, les polices et le contenu, et **jamais la forme**. Résultat sur le premier bootstrap : le
bandeau défilant, incliné sur la référence, était plat chez moi. C'est l'utilisateur
qui l'a vu.

Une charte n'est pas seulement une palette. Relève aussi, **section par section** :

```js
const sections = [...document.querySelectorAll("section, header, footer, main > div")];
JSON.stringify(sections.map((el) => {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    cls: (el.className || "").toString(),      // les classes disent tout : -rotate-2, rounded-tr-[4rem]…
    rotate: s.rotate, transform: s.transform,  // Tailwind 4 utilise `rotate`, PAS une matrice transform
    radius: s.borderRadius,
    shadow: s.boxShadow,
    border: s.borderTopWidth + " " + s.borderTopColor,
    display: s.display, gridCols: s.gridTemplateColumns,
    padding: s.paddingTop + " / " + s.paddingLeft,
    overflow: s.overflow + " / " + s.overflowX,
    rect: { w: Math.round(r.width), h: Math.round(r.height) },
  };
}), null, 1)
```

**Le champ `cls` est le plus précieux** : un build Tailwind conserve les classes en clair.
`relative z-10 -rotate-1 bg-aqua py-5 border-y border-forest/15 shadow-[0_20px_50px_-20px_rgba(15,76,99,0.35)]`
se recopie presque tel quel : il suffit de traduire les noms de couleurs maison
(`aqua` → `accent`, `forest` → `foreground`).

### Trois pièges de la géométrie

**Tailwind 4 met la rotation dans `rotate`, pas dans `transform`.** Vérifier `transform`
seul renvoie `none` et fait croire à l'absence de rotation. Relève **les deux**.

**Un élément incliné pleine largeur déborde horizontalement.** La référence le contient avec
`overflow-x-clip` sur `<main>`. Sans ça, la page défile latéralement sur toute sa hauteur.

**Mesure à deux largeurs, pas une.** Le conteneur d'une image peut être
`hidden lg:block` chez toi et pleine largeur chez la référence : à 1280 px les deux se
ressemblent, à 375 px l'une a disparu. C'est comme ça que la photo du coach s'est volatilisée
sur le premier bootstrap : elle était dans le code, masquée sous `lg`.

## 6 quinquies. Le cadrage : le travail qu'on croit décoratif

Relevé sur la référence, et à ne pas confondre avec « mettre un rayon partout ». Le système
tenait en trois motifs :

| Usage | Ratio | Rayon |
|---|---|---|
| Blocs de contenu | `aspect-[16/11]` | `rounded-[2rem]` + **un** coin à `5rem` |
| Cartes de service | `h-48`, hauteur fixe | aucun |
| Portraits | `aspect-[4/5]` | `rounded-[2rem]` + **un** coin à `6rem` |

**Le coin surdimensionné alterne d'une photo à l'autre** : bas-droite, puis haut-gauche,
puis bas-droite. C'est ce rythme qui fait l'élégance ; trois cadres au rayon uniforme
paraissent plats à côté, même avec les bonnes photos.

Deux détails qui séparent un cadrage travaillé d'un `object-cover` posé partout :

**`object-position` recalé photo par photo.** Sur la référence, une seule image portait
`50% 72%`, celle d'un groupe placé bas dans le cadre. Toutes les autres restaient centrées.
Cherche les valeurs différentes de `50% 50%` : chacune est une décision.

**Image plus haute que son cadre** (`h-[118%] -top-[9%]`) : ce n'est pas une erreur de
mise en page, c'est la réserve nécessaire à la parallaxe. Une image à `h-full` ne peut pas
glisser sans découvrir un bord.

## 6 quater. Le mouvement : la dimension qu'une capture ne montre pas

**Troisième trou de cette recette, après la géométrie.** Les couleurs se lisent sur une
image, la géométrie sur une mesure statique. Le mouvement, lui, n'existe que dans le temps.
Sur le premier bootstrap réel, j'ai livré un site figé alors que la référence glissait. C'est l'utilisateur qui l'a vu,
pas moi.

C'est aujourd'hui la signature visuelle la plus répandue : un site sans mouvement au
défilement paraît daté, même parfait par ailleurs.

### Repérer les bibliothèques

```js
JSON.stringify({
  htmlClass: document.documentElement.className,     // « lenis » = défilement fluide
  globals: ['gsap','ScrollTrigger','Lenis','lenis','Motion','AOS'].filter(k => k in window),
  attrs: ['data-aos','data-scroll','data-animate'].map(a => ({ a, n: document.querySelectorAll('['+a+']').length })).filter(x => x.n),
}, null, 1)
```

`html.lenis` ou `window.lenis` → **défilement fluide inertiel**. C'est souvent lui qu'on
prend pour un « effet d'apparition » : la page glisse au lieu de sauter.

### Mesurer la parallaxe

Une seule mesure suffit, et elle est sans appel : comparer le déplacement réel d'une image
à la distance parcourue par le défilement.

```js
const dodo = (ms) => new Promise((r) => setTimeout(r, ms));
const img = document.querySelector("#section img");
const y1 = window.scrollY, r1 = img.getBoundingClientRect().top;
window.scrollBy(0, 250); await dodo(800);
const ecart = 250 - (r1 - img.getBoundingClientRect().top);
// ecart > 3px → parallaxe. Sur le premier bootstrap : 8px sur 250, soit ~3 % de retard.
```

### Mesurer les apparitions, et ne pas conclure trop vite

**Recharge la page avant de mesurer.** Une apparition déclenchée « une seule fois » a déjà
joué si tu as parcouru la page pendant ton relevé, et tu conclurais qu'il n'y en a pas.

Puis compare `opacity`, `transform` et `clip-path` d'un élément **jamais entré dans le
viewport**, avant et après l'y avoir amené.

Sur le premier bootstrap cette mesure a donné un résultat contre-intuitif : **aucune apparition.**
Tout était à `opacity: 1` dès le chargement. Ce que l'utilisateur percevait venait du
défilement fluide et de la parallaxe. Je l'ai dit, puis j'ai ajouté une apparition **parce
qu'il la voulait**, en annonçant que c'était un ajout, pas une reproduction.

### Ce qu'on réintègre

| Effet | Comment |
|---|---|
| Défilement fluide | `lenis`, désactivé sous `prefers-reduced-motion` |
| Parallaxe | `animation-timeline: view()`, sans JavaScript. `components/ui/parallaxe.tsx` |
| Apparition au défilement | `IntersectionObserver` + `clip-path`, **une fois**. `components/ui/reveal.tsx` |
| En-tête qui se transforme | transition sur `background-color` et `box-shadow` |

Tout cela vit déjà dans le socle. Ne le réécris pas : pose les composants.

## 6 ter. Les liens, pas seulement les icônes

> **Conditionné à deux réponses.** Ne recopie un `href` que si le site appartient à
> l'utilisateur **et** qu'il a accepté la reprise des liens. Sinon : relève-les quand même
> pour savoir **quelles** icônes la référence affiche et où, mais pose la structure sans
> `href` et liste-les dans le blueprint. La forme se reprend, la destination non.

Relève **tous** les liens sortants, pas seulement le texte visible :

```js
[...document.querySelectorAll("a[href]")]
  .map((a) => ({ href: a.getAttribute("href"), aria: a.getAttribute("aria-label"),
                 svg: !!a.querySelector("svg"),
                 zone: a.closest("header") ? "header" : a.closest("footer") ? "footer" : "corps" }))
  .filter((l) => !l.href.startsWith("#"));
```

Sur le premier bootstrap, j'avais reproduit l'icône Instagram de l'en-tête **en décoration**, sans son
lien. Une icône de réseau social est presque toujours un lien : cherche-le.

Et regarde les **paramètres** des URL : le lien WhatsApp de la référence portait un
`?text=Hey le client ! Je voudrais quelques informations sur les coachings :)`. Le message
pré-rempli fait partie de la charte, pas du hasard.

## 7. Écrire la charte

Traduis en `@theme` Tailwind v4 dans `app/globals.css`, en **nommant par rôle** et non par
couleur : `--color-primary`, `--color-accent`, `--color-on-accent`… Un `--color-cyan` te
bloque le jour où le client change de couleur.

Garde les couleurs de texte associées (`--color-on-accent`) : c'est ce qui préserve le
contraste quand un fond change.

Polices via `next/font/google`, exposées en variables, puis référencées dans `@theme` :

```tsx
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500","700"], variable: "--font-grotesk" });
```
```css
--font-display: var(--font-grotesk), ui-sans-serif, sans-serif;
```

## 8. Les photos : récupère-les, ne les remplace pas par des dégradés

**Erreur commise au premier bootstrap :** j'ai posé des dégradés en écrivant dans le
blueprint « je n'ai pas les photos ». Elles étaient servies par le site, en clair, et il a
suffi d'un `curl`. L'utilisateur a dû me demander pourquoi je ne les avais pas prises.

Quand la référence appartient à l'utilisateur, **ses photos sont les siennes**. Prends-les.

### Les lister

```js
const out = { img: [], bg: [] };
document.querySelectorAll("img").forEach((i) => {
  if (i.currentSrc || i.src)
    out.img.push({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt });
});
document.querySelectorAll("*").forEach((el) => {
  const b = getComputedStyle(el).backgroundImage;
  if (b && b !== "none" && b.includes("url(")) {
    const m = b.match(/url\(["']?([^"')]+)/);
    if (m) out.bg.push({ url: m[1], tag: el.tagName.toLowerCase() });
  }
});
out.bg = [...new Map(out.bg.map((x) => [x.url, x])).values()];
JSON.stringify(out, null, 1)
```

`querySelectorAll("img")` seul ne suffit pas : beaucoup de visuels sont des fonds CSS.
Et `currentSrc` plutôt que `src` : c'est lui qui donne la variante réellement chargée.

### Les télécharger

```bash
mkdir -p public/images
B="<origine>/images"
for f in hero.png portrait.jpeg …; do curl -sf "$B/$f" -o "public/images/$f"; done
```

### Le meilleur cadeau : les textes alternatifs

**Ils disent où va chaque photo.** Sur le premier bootstrap, les neuf `alt` du site de référence
suffisaient à les placer toutes sans poser une seule question :
« Portrait souriant de le client » → la section à propos ; « Coaching en salle » → la première
carte de prestation ; « Pause en haut d'un sommet » → le bloc outdoor du manifeste.

Récupère-les avec les fichiers et **réutilise-les tels quels** : ils sont déjà rédigés, en
français, et par quelqu'un qui connaît les photos.

### Garde quand même les emplacements cliquables

Même avec les vraies photos, laisse `data-photo-slot="<nom>"` sur l'élément qui porte
l'image. C'est ce qui permet à l'utilisateur de la remplacer en phase 2 par clic et pièce
jointe, sans jamais ouvrir un fichier.

### Ce que tu n'auras vraiment pas

Une photo absente de la référence, ou une référence qui n'appartient pas à l'utilisateur.
Là seulement : dégradé de la charte, `data-photo-slot`, et hypothèse écrite dans le
blueprint.

## 9. La limite à énoncer

S'inspirer d'une charte, oui. La recopier à l'identique n'a de sens que si le site
appartient à l'utilisateur. Pose l'hypothèse explicitement dans le `BLUEPRINT.md` et
laisse-le corriger.
