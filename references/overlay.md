# Overlay d'édition visuelle : mécanique

## Ce qui se passe côté navigateur

`components/buildyoursite/overlay.tsx` est injecté par `app/layout.tsx`, **uniquement en dev**.

- Survol → contour pointillé sur l'élément visé
- Clic → sélection figée en trait plein, la bulle s'ouvre
- `Entrée` → le commentaire est enregistré, une pastille numérotée reste sur l'élément
- `Maj+Entrée` → retour à la ligne
- `Échap` → ferme la bulle
- `Alt+E` (ou l'interrupteur en bas à droite) → bascule Édition ⇄ Navigation

En mode Édition les clics sont interceptés : la page ne navigue pas. Pour se déplacer
d'une page à l'autre, l'utilisateur bascule en Navigation.

Images : bouton 📎 ou **Ctrl+V** directement dans la bulle. Quatre maximum par commentaire.

Deux modes d'envoi, réglables dans la barre flottante :
- **Groupé** (défaut) : les commentaires s'empilent, le bouton « Envoyer · N » les envoie ensemble
- **Envoi immédiat** : chaque validation part seule

## Ce qui arrive sur le disque

`POST /api/buildyoursite` écrit dans `.buildyoursite/comments.json`, à la racine du projet :

```json
{
  "batches": [
    {
      "id": "a1b2c3d4",
      "sentAt": "2026-09-03T14:22:10.000Z",
      "page": "/tarifs",
      "status": "pending",
      "comments": [
        {
          "n": 1,
          "message": "remplace cette photo par celle-là",
          "target": {
            "selector": "main > section:nth-of-type(2) > div > img",
            "tag": "img",
            "classes": "rounded-card object-cover",
            "text": "",
            "component": "HeroSection",
            "source": null
          },
          "attachments": [".buildyoursite/attachments/1757-a1b2-photo.png"]
        }
      ]
    }
  ]
}
```

Les images jointes sont écrites dans `.buildyoursite/attachments/` (ignoré par git).

## Les statuts d'un lot

| Statut | Qui l'écrit | Ce que l'overlay en fait |
|---|---|---|
| `pending` | le serveur, à la réception | **la comète tourne** autour de la barre : « Envoyé · Claude arrive… » |
| `en_cours` | **toi, dès ton réveil, avant de travailler** | la comète s'arrête : « Claude a pris la main » |
| `done` | toi, une fois appliqué | rien de plus |

L'overlay interroge `GET /api/buildyoursite` toutes les 1,5 s tant qu'un lot est `pending`.
Le passage à `en_cours` est donc **la première chose à faire à chaque réveil**, avant même
de lire les commentaires : dix secondes sans réponse ressemblent à une panne, et c'est ce
qui a fait dire à l'utilisateur, au troisième bootstrap, que « le mode édition ne
fonctionne pas ».

## Le watcher

**À armer dès que le serveur de dev tourne (phase 0.55), pas en fin de bootstrap.** Le
troisième bootstrap l'a payé : armé à la dernière étape, il a laissé les commentaires envoyés
pendant les vérifications s'empiler sans réponse, puis les a livrés d'un coup à la fin.
Persistant, il reste armé toute la session ; réarme-le seulement s'il est mort.
Outil `Monitor`, `persistent: true`, depuis la racine du projet :

> **L'overlay ne fonctionne pas sur `/blueprint`.** Cette page est servie telle quelle par
> `app/blueprint/route.ts` : le HTML autonome de `blueprint-html.mjs`, hors du layout de
> l'application, donc sans aucun script. Vérifié : `document.scripts` y est vide. Sur le
> blueprint, l'utilisateur relit et répond dans le chat ; ne lui promets pas le contraire.

```bash
F=".buildyoursite/comments.json"
prev="none"; [ -f "$F" ] && prev=$(stat -c %Y "$F")
while true; do
  cur="none"; [ -f "$F" ] && cur=$(stat -c %Y "$F")
  if [ "$cur" != "$prev" ]; then echo "BUILDYOURSITE: nouveau lot de commentaires"; prev="$cur"; fi
  sleep 2
done
```

`description` : `commentaires overlay <projet>`

Une ligne émise = un lot envoyé. À la réception, lire `.buildyoursite/comments.json` et traiter
les lots dont `status` vaut `pending`.

## Retrouver le code visé

Par ordre d'usage :

1. **`srcFile`** : le fichier source, lu sur le `data-src` de l'ancêtre le plus proche.
   **C'est le handle principal.** Il transforme « je cherche dans tout le projet » en
   « je cherche dans un fichier de 80 lignes ». Fonctionne pour les Server Components,
   contrairement à tout ce qui vient de React.
2. **`classes`** : la liste de classes Tailwind. Un `Grep` **à l'intérieur de `srcFile`**
   tombe directement sur la bonne ligne. `text-5xl font-semibold tracking-tight` n'apparaît
   qu'une fois dans un fichier.
3. **`text`** : le texte visible. Excellent pour les titres, boutons et libellés.
   Inutile pour une image ou un conteneur vide.
4. **`selector`** : le chemin DOM. Sert à départager deux éléments identiques
   (deux cartes, deux boutons) et à situer l'élément dans la page.
5. **`component`** / **`source`** : cadeau quand ils sont là, jamais une dépendance.
   Ils viennent de la fibre React et n'existent que pour les composants clients
   (`"use client"`). Un Server Component arrive dans le DOM sans fibre côté navigateur.

## La règle du `data-src` : un par fichier, sur sa racine

`closest("[data-src]")` renvoie **le plus proche**. Deux conséquences :

- **Un seul attribut par section suffit** : tous ses descendants en héritent. Pas besoin
  d'en semer sur chaque élément.
- **Un sous-composant dans son propre fichier doit porter le sien**, sinon il est attribué
  au fichier de son parent. Vérifié sur le premier bootstrap : la pastille de jour résout vers
  `reservation-form.tsx` et non `reservation.tsx`, parce que ce fichier porte son propre
  attribut.

Corollaire : un composant avec **plusieurs `return`** (état de succès, état vide) doit porter
l'attribut sur **chaque racine**, sinon la moitié de ses états n'est pas attribuée.

### Ne pas le poser par script

J'ai voulu l'injecter avec un codemod « premier élément après le `return` ». **Deux fichiers
sur dix étaient faux** : l'un avait un composant auxiliaire déclaré avant le principal,
l'autre un retour anticipé. La racine réelle n'est pas devinable mécaniquement.

C'est donc au **brief de l'agent** de l'exiger : il connaît la racine de ce qu'il écrit.
Le composant `Section` du socle a une prop `src` prévue pour ça.

Croise-en deux quand un seul est ambigu. Ne demande pas de précision à l'utilisateur :
prends la lecture la plus probable, il corrigera d'un autre clic si tu te trompes.

## À chaque réveil

1. **D'abord** passer les lots `pending` à `"status": "en_cours"`. La comète s'arrête.
2. Lire les commentaires, retrouver le code, appliquer. Si un fichier visé est confié à un
   agent encore en vie : ne pas y toucher, dire « reçu, j'applique dès que l'agent a fini »,
   et le faire à sa notification.
3. Vérifier que ça compile.
4. Passer les lots à `"status": "done"`.
5. Répondre en une ligne par lot. Ton écriture réveille le watcher une fois à vide : normal.
