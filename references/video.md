# La vidéo : animer une photo du client, avant d'en inventer une

Deux ou trois secondes de mouvement discret sur une vraie photo valent mieux qu'une image
inventée. C'est le remède au site plat qui ne coûte ni la vérité du lieu, ni la confiance du
visiteur : on voit sa salle, son atelier, ses gens. Et ça bouge.

---

## 1. Le défaut : animer une photo fournie

Quand le relevé a trouvé **un animateur d'image** (un outil de génération vidéo qui accepte
une image en entrée) et que l'utilisateur a des photos, la chaîne est celle-ci, dans cet
ordre :

1. **Récupère ses photos** : `scripts/images-du-chat.mjs --sortie public/photos` pour ce
   qu'il a collé, ou son dossier, ou son site.
2. **Montre-les et demande lesquelles animer.** Deux ou trois, pas cinq : une par section
   forte. Un paysage, un geste, une matière s'animent bien ; un visage de près, mal.
3. **Chiffre sans dépenser** : l'appel de génération avec `get_cost: true`, pour chaque photo
   retenue. Le chiffre est réel, pas un ordre de grandeur.
4. **Demande, une photo à la fois** : voir la règle de l'argent dans `SKILL.md`. Laisse
   `use_unlim` absent : si une réserve gratuite couvre le modèle, le serveur ne soumet rien
   et rend la question à lui poser.
5. **Envoie le fichier par le canal prévu**, le widget de téléversement du connecteur, jamais
   un chemin de shell : le schéma l'interdit et l'appel échouerait.
6. **Génère après le oui**, et dis ce qui a été consommé.

**Une étape préparatoire est une génération.** Si la photo doit d'abord être élargie au format
du héros, ça se chiffre et ça se demande séparément : « pour animer celle-ci il faut d'abord
l'élargir en 16:9, ce qui ajoute N crédits. Je le fais ? ». Au cinquième bootstrap, cette
étape a été lancée sans être présentée comme telle, et l'utilisateur a vu naître une image
nouvelle alors qu'il voulait sa photo animée.

### Les réglages qui ont marché

Éprouvés sur pièces, à reprendre tels quels tant qu'un autre service n'est pas connecté :

| Étape | Ce qui a marché | Ce qui a échoué |
|---|---|---|
| Élargir au 16:9 | modèle image avec la photo en **référence**, prompt « extend this exact photograph… keep everything identical », 2 crédits | — |
| Animer | modèle vidéo en **`mode: "omni_reference"`**, image de départ, 8 s, 1080p, sans audio, 72 crédits | le même sans `mode` : **422 après un devis accepté**. `get_cost` ne valide pas les paramètres |
| Poids | 1080p × 8 s = **17,5 Mo**, impossible en fond de héros sur téléphone | — |
| Transcoder | `ffmpeg-static` installé **hors du projet**, `-vf scale=1280:-2 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -an -movflags +faststart` → **1,8 Mo** | — |
| Regarder | trois images extraites à 2 s, 5 s, 7,5 s (`-ss`), lues une par une | le panneau refuse de naviguer vers un `.mp4` ; dans un onglet en arrière-plan la vidéo reste à `readyState 0` |

---

## 2. Le repli : inventer un plan large, puis l'animer

Quand aucune photo fournie ne se prête à la section (trop étroite, un visage de tiers, un
texte incrusté), on peut générer une image dans l'univers du site puis l'animer. **C'est un
repli, et il se demande** : « aucune de tes photos ne convient pour le héros ; j'en génère un
plan large dans ton univers (N crédits), ou je pose une photo provisoire ? ». Il ne se décide
pas seul, et il coûte deux générations, chacune avec sa question.

---

## 3. Dans le site : la primitive `VideoFond`

Une vidéo de héros n'est pas une balise posée à la va-vite. Le socle porte
`components/ui/video-fond.tsx`, et c'est elle qu'on utilise :

```tsx
<VideoFond src="/videos/hero.mp4" affiche="/photos/paysage-large.jpg" alt="…">
  …le contenu du héros…
</VideoFond>
```

Ce qu'elle garantit, et pourquoi chaque point compte :

- **L'affiche est la photo d'origine**, rendue par `Photo` sous la vidéo. Sans JavaScript,
  avant le chargement, ou si le fichier manque, on voit la photo. Jamais un rectangle noir.
- **`autoPlay muted loop playsInline`** : les quatre ensemble, sinon le téléphone n'y touche
  pas. `preload="metadata"` pour ne pas tirer 2 Mo avant le premier écran.
- **Mouvement réduit : la vidéo disparaît**, la photo reste. C'est du CSS, pas une condition
  JavaScript, donc ça tient même si l'hydratation tarde.
- **Un voile** au-dessus, dans un jeton du thème, pour que le texte se lise quel que soit le
  plan qui passe.
- **Un plafond de poids** : au-delà de 3 Mo, transcode avant de poser. Le script
  `verifier-projet.mjs` le signale.

---

## 4. Ce qu'on ne fait pas

- **Jamais un visage animé** sans la photo de la personne elle-même et son accord : le
  modèle ne connaît pas le gérant, et un visage généré se voit.
- **Jamais deux vidéos par page** : une seule, dans le héros. Une deuxième transforme la page
  en écran de veille.
- **Jamais de son.** Une vidéo qui parle dans un site vitrine est un visiteur qui ferme
  l'onglet.
