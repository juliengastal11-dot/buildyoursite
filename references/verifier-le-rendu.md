# Vérifier le rendu, pas seulement le build

Un `npm run build` vert ne dit **rien** du visuel. Sur le premier bootstrap, le build
passait du premier coup alors que le titre du héros débordait de 46 px hors de sa boîte.
Voici comment le voir sans jouer aux devinettes.

## 1. La mesure d'abord, l'œil ensuite

Une capture d'écran trompe : la fenêtre coupe, l'overlay recouvre, et on croit voir des
défauts qui n'existent pas. Sur ce bootstrap j'ai cru un `h2` coupé — la mesure a montré
`deborde: false`, et c'était juste le bord de la capture.

Mesure, puis confirme à l'œil. Jamais l'inverse.

## 2. Détecter tous les débordements d'un coup

```js
function masqueParUnParent(el) {
  let p = el.parentElement;
  while (p && p !== document.body) {
    const o = getComputedStyle(p);
    if (o.overflowX !== "visible" || o.overflow !== "visible") return true;
    p = p.parentElement;
  }
  return false;
}
const vrais = [];
document.querySelectorAll("body *:not([data-buildyoursite-ui]):not([data-buildyoursite-ui] *)").forEach((el) => {
  if (el.clientWidth === 0) return;
  if (el.scrollWidth <= el.clientWidth + 1) return;
  if (getComputedStyle(el).overflowX !== "visible") return;
  if (masqueParUnParent(el)) return;
  vrais.push({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || "").toString().slice(0, 80),
    txt: (el.innerText || "").trim().slice(0, 34),
    debord: el.scrollWidth - el.clientWidth,
  });
});
JSON.stringify({ nb: vrais.length, vrais }, null, 1)
```

**Les trois filtres comptent.** Sans eux, la première version de ce script signalait
**46 coupables** dont 45 faux : le bandeau défilant déborde par construction, à l'intérieur
d'un parent `overflow-hidden`. Avec les filtres : 3 signalements, dont un seul réel.

- `overflowX !== "visible"` → l'élément gère lui-même son débordement, ce n'est pas un bug
- `masqueParUnParent` → un ancêtre le coupe déjà, personne ne le verra
- `[data-buildyoursite-ui]` → l'overlay d'édition n'est pas le site

Vérifie aussi que le corps de page ne défile pas horizontalement :
`document.documentElement.scrollWidth === document.documentElement.clientWidth`.

## 3. Corriger un titre qui déborde

Cause quasi systématique : une seule taille de police, calibrée pour le bureau.
`text-5xl` sans palier plus petit, et un long mot français fait le reste — un adverbe en
display 800 fait 523 px pour une boîte de 477.

Correction : toujours un palier bas.
`text-4xl sm:text-5xl md:text-7xl`, pas `text-5xl md:text-7xl`.

À imposer dans les briefs d'agent : **tout titre porte au moins trois paliers de taille.**

## 4. Les trois largeurs à regarder

`resize_window` avec 375, 768, puis 1280. Réinitialise ensuite avec le préréglage `desktop`,
sinon l'émulation reste collée à l'onglet.

Attention : une largeur émulée plus grande que le panneau est **réduite à l'échelle** dans la
capture. Le rendu paraît minuscule dans un coin — c'est un artefact de la capture, pas un
défaut de mise en page. Pour juger à l'œil, reste à la taille du panneau ; pour juger le
bureau, mesure en JS plutôt que de regarder.

## 5. Les erreurs invisibles

`read_console_messages` avec `onlyErrors: true`. Une hydratation ratée, un `key` manquant,
une image morte n'apparaissent nulle part ailleurs.

## 6. Vérifier la donnée, pas seulement la page

Un formulaire qui affiche « c'est envoyé » n'a rien prouvé. Remplis-le avec `form_input`,
soumets, puis **relis la base** :

```bash
node -e "const {PrismaClient}=require('@prisma/client');const d=new PrismaClient();
(async()=>{ console.log(await d.<modele>.findMany()); await d.\$disconnect(); })();"
```

Sur ce bootstrap, c'est ce contrôle qui a prouvé que la conversion de fuseau était juste :
un créneau choisi à 10:00 Paris était bien stocké en `08:00Z`.

## L'auto-test, avant de montrer quoi que ce soit

Chaque point se vérifie dans le panneau ou par un appel, jamais de mémoire — aucun ne se
suppose.

1. **Chaque page à 375 px de large** (`resize_window`, préréglage mobile), puis à la largeur
   du bureau. Débordements, textes coupés, images écrasées, barre de navigation qui recouvre
   un titre.
2. **Chaque bouton et chaque lien**, cliqués. Un lien mort, un bouton sans effet, une ancre
   qui n'existe pas.
3. **Le formulaire jusqu'à son état de succès** — et son état d'erreur. Que voit-on après
   avoir envoyé ? Et si un champ manque ?
4. **La console vide**, à la largeur du bureau et à 375 px (`read_console_messages`,
   erreurs seulement).
5. **Le mouvement réduit.** Le panneau ne sait pas l'émuler : vérifie dans le code que chaque
   primitive de mouvement affiche sans animer quand la préférence est active — elles le
   font toutes par construction, mais un agent a pu en réécrire une.
6. **Les queues des lettres** — g, y, p — dans tout texte masqué ou tronqué, à 100 %.
7. **Rien ne déborde latéralement** : la page ne défile pas de côté, même en tirant.
8. **Le relecteur** : un agent sans contexte, l'URL et la liste des pages, une seule
   consigne — rapporter, pas corriger.
9. **L'œil neuf, en dernier.** La liste posée, la page regardée comme un inconnu qui
   arrive : est-ce que tout a sa place, est-ce qu'un élément parallèle est inégal, est-ce
   qu'un passage sent le remplissage.

Ce que tu trouves, tu le corriges et tu le dis. Chaque défaut que l'utilisateur a trouvé sur
les deux premiers bootstraps était un point de cette liste, non vérifié.
