# Décisions d'architecture

Ce que le dépôt fait et ne fait pas, et pourquoi. Les entrées ici sont **tranchées** — le
journal des incidents vit dans `AMELIORATIONS.md`, les hypothèses d'un projet dans son
`BLUEPRINT.md`.

---

## D1 — Pas de dépôt externe en plus de UI/UX Pro Max

**Tranché le 2026-09-04**, après avoir constaté que Pro Max ne contient aucune structure
d'e-commerce.

La tentation était d'ajouter des sources : un dépôt de motifs e-commerce, un autre de
palettes. Écarté, pour trois raisons.

**Le manque n'en était pas un.** La structure d'une boutique n'est pas un motif à chercher
dans une base : elle est dictée par sa fonction — catalogue, fiche, panier, tunnel,
confirmation. Un dépôt de « patterns e-commerce » aurait rendu ces quatre étapes, habillées.

**Les palettes n'ont pas manqué non plus.** Pro Max en a 192. La palette hors sujet obtenue
sur le premier essai venait de la **requête** — « artisan craft warm » a ramené du bien-être
et du bio — pas de la base. Un second dépôt aurait échoué de la même façon.

**Chaque source coûte.** Un chemin de mise à jour, une licence, une convention
d'interrogation. Et la qualité d'une recherche baisse quand on multiplie les sources sans
index unificateur : il faut arbitrer qui gagne quand deux se contredisent.

À revoir si un jour on veut des **blocs de code prêts** plutôt que des décisions de design.
Même alors, notre propre bibliothèque nourrie par de vrais projets sera meilleure qu'un
dépôt générique, parce qu'elle aura le style de son auteur.

---

## D2 — Une bibliothèque de blocs, construite bootstrap après bootstrap

**Le risque soulevé est réel** : des blocs mal conçus rendent tous les sites identiques.

**Ce qui le désamorce, et c'est déjà vérifié.** `Button`, `Card` et `Field` sont partagés
entre deux projets réels. Même code, exactement. L'un rend des pilules orange sur anthracite
en Space Grotesk, l'autre de l'ambre sur crème en Calistoga. Personne ne dirait qu'ils se
ressemblent.

Parce que ces composants portent **la structure et le comportement, jamais l'identité**.

### L'invariant, dur et vérifiable

> **Aucun bloc ne contient de couleur, de police ni d'espacement littéral.**
> Uniquement des tokens du thème et des props.

C'est exactement ce que le garde automatique sait déjà contrôler (voir D5). Un bloc qui
enfreint cette règle est refusé, pas discuté.

### Deux choses très différentes qu'on appelle « bloc »

| | |
|---|---|
| **Un design fini** — couleurs, typo, échelle et mise en page figées | Copié dans cinq sites, donne cinq sites identiques. **À proscrire.** |
| **Une structure à trous** — sait ce qu'un héros contient, prend son identité du thème | Ne ressemble à rien tant qu'un thème ne l'habille pas. **C'est ce qu'on construit.** |

### Variantes

Un bloc propose trois ou quatre dispositions — centré, scindé, image pleine, éditorial.
**Pro Max choisit la variante** selon le métier, le thème la colore. Même bloc, résultat
différent à chaque projet.

### Le vrai gain n'est pas esthétique

Sur le bootstrap #2, chaque agent a réécrit à sa façon le même travail invisible : trois
paliers de taille sur les titres, `cursor-pointer`, focus visible, réserve de parallaxe sur
les images, état vide quand une liste l'est, retour visuel sur les formulaires.

**Un bloc fige ce qu'on n'a plus le droit d'oublier**, pas ce à quoi le site ressemble.
Même logique que `Field`, qui rend impossible d'utiliser un placeholder comme libellé.

### Alimentation

Chaque bootstrap verse ses blocs génériques au socle. Après quelques projets, une vraie
bibliothèque — propre en licence, dans le style de son auteur, sans dépendance externe.
Coût marginal nul : ces blocs sont écrits de toute façon.

**Attention au passage** : remonter un bloc d'un projet vers le socle, c'est remonter la
**structure**, jamais les valeurs. C'est exactement l'erreur qui a fait fuiter les
coordonnées d'un client dans le socle (F3) et une couleur fantôme dans `Section` (F4).

---

## D3 — Une page de structures, fonctionnelle et non compositionnelle

Pour chaque type de site — vitrine, boutique, réservation, back-office, portfolio — le
parcours canonique : **quelles pages existent, et ce que chacune doit faire.**

**La frontière à tenir, et elle est nette :**

| | |
|---|---|
| **Quelles pages, et leur rôle** | Notre document. C'est de la fonction. |
| **Dans quel ordre raconter l'histoire sur l'accueil** | Pro Max, à chaque projet. C'est de l'éditorial. |

Dire qu'une boutique a un panier n'homogénéise pas plus que dire qu'un roman a des
chapitres. Amazon, un torréfacteur et une maison de luxe ont tous les quatre mêmes étapes,
et ne se ressemblent pas.

**Ce qui homogénéiserait**, en revanche, serait de prescrire la composition de la page
d'accueil — héros, bénéfices, témoignages, CTA. On ne l'écrira pas.

---

## D4 — Interroger Pro Max par le métier, jamais par l'ambiance

La palette hors sujet du bootstrap #2 venait d'une requête écrite en adjectifs.

| | |
|---|---|
| **Ne pas écrire** | `artisan coffee roastery, warm craft brand` → palette bien-être, vert et rose |
| **Écrire** | `coffee roastery warm brown cream earthy premium retail` → brun torréfaction sur crème |

Et surtout : **relire la sortie avant de l'appliquer.** Si le motif ne correspond pas au type
de site, ou la palette au métier, ce n'est pas la base qui a tort — c'est la requête.
Reformuler, et cibler par domaine (`--domain color`, `--domain typography`).

---

## D5 — Un garde automatique à deux invariants

La relecture humaine a manqué deux fois la même famille de défaut. Un script les attrape en
quelques lignes, avant chaque commit du socle :

1. **Aucune donnée personnelle non vide** — téléphone, e-mail, URL de réseau social.
2. **Aucune classe de couleur utilisée sans être définie** dans `@theme`.

Le second aurait attrapé `text-terracotta` le jour où il a été introduit. Il servira aussi
à contrôler l'invariant des blocs de D2.

---

## D6 — Un index des projets passés, pas un imitateur

Idée retenue, sous une forme précise. **Pas** « fais un site qui ressemble aux précédents » —
ça amplifierait délibérément la ressemblance, à l'inverse de ce qu'on cherche.

Mais **« voici ce que j'ai déjà résolu »** : un fichier par bootstrap, avec sa palette, sa
structure, les blocs utilisés et les décisions notables. Ça évite de refaire, sans
uniformiser. Se remplit tout seul en fin de bootstrap.

---

## D7 — Une bibliothèque de mouvement dans le socle, une seule

Le deuxième bootstrap a livré un site plat. Pas faute de primitives — Lenis, `Reveal`,
`Parallaxe` étaient là — mais parce que rien n'obligeait à s'en servir, et que le contrôle
de fin ne regardait pas si ça bougeait. Une bibliothèque ne règle pas ça ; une étape, oui.
Les deux ont été ajoutées ensemble.

**GSAP, et rien d'autre.** Gratuit avec tous ses plugins depuis 2025, ScrollTrigger compris.
Pro Max a un domaine `gsap` : les briefs peuvent citer une base que les agents lisent.
Préféré à Framer Motion parce que la chorégraphie au défilement est le langage des vitrines,
et c'est là qu'il est le plus fort. Les versions CSS (`animation-timeline`) sont retirées :
leur support navigateur est partiel, et deux systèmes de mouvement, c'est un de trop.

**Ce n'est pas contraire à D1.** D1 refuse des dépôts de *connaissance* en plus de Pro Max.
GSAP est une dépendance de code du socle, comme Prisma ou Lenis.

**L'invariant de D2 tient.** Les primitives — `Reveal`, `Cascade`, `Compteur`, `Defilant`,
`EntreeHero`, `Parallaxe` — portent ce qui bouge, dans quel ordre, déclenché par quoi.
Durées, distances, décalages, courbe vivent dans `lib/mouvement.ts`, un fichier-contrat
réglé au bootstrap depuis `--motion`, comme le thème. Deux sites partagent le code et
n'ont pas le même mouvement.

**Ce qu'on refuse.** Tout animer. Une entrée de héros par page, une cascade par grille, un
compteur sur un vrai chiffre, une parallaxe sur une ou deux photos.
`references/mouvement.md` dit quand employer quoi — et surtout quand s'abstenir.

---

## D8 — Regarder avant de demander, écrire avant de construire, faire regarder avant de finir

Trois habitudes, tirées de ce que le deuxième bootstrap a coûté.

**Regarder avant de demander.** Une réponse qui est sur la machine ne se demande pas. Le
bootstrap commence donc par un relevé — Node, Python, Pro Max, identité git, clé Pexels,
connecteurs — et c'est ce relevé qui décide de la forme des questions. Un connecteur de
génération d'images présent change la question des visuels ; absent, il ne change rien, et
personne ne se voit proposer un abonnement. Même logique pour les actifs : on demande ce
que le client a — logo, photos, captures — avant de décider ce qu'on fait du manque, et la
décision se dit à voix haute. Sur le deuxième bootstrap, la question n'avait pas été posée ;
les photos ont manqué jusqu'à ce que l'utilisateur le remarque.

**Écrire avant de construire.** Le premier bootstrap l'avait montré : la copie mot pour mot
dans le brief donne des fichiers sans un mauvais texte. On généralise. On conçoit le texte
comme on conçoit le thème — avant, et une fois, dans `CONTENU.md`, dans la langue relevée
chez les vrais clients du métier — et la construction ne fait que le poser. Ce qu'on
interdit au passage : le faux témoignage, et la langue lisse qui s'installe dès qu'on écrit
longtemps, désormais signalée par le garde-fou.

**Tenir une direction par-dessus Pro Max.** Laissé seul, il rend le réflexe : le deuxième
bootstrap est sorti en crème, serif et terre cuite — la palette que produit tout générateur
dès qu'on lui parle d'artisanat. Une direction se tient — élément signature, squelettes
voisins différents, accent rare, fond jamais pur — et s'écrit dans le blueprint.

**Faire regarder avant de finir.** Sur les deux bootstraps, c'est l'utilisateur qui a trouvé
le CSS cassé, les photos absentes, les sept pages sans navigation, le site plat. Chaque
fois, c'était une vérification que je n'avais pas faite. D'où l'auto-test avant de montrer,
un relecteur sans contexte, l'œil neuf en dernier — et une définition du fini qui ne se
satisfait pas d'un build vert : le bootstrap est fini quand l'utilisateur a regardé, sur
son téléphone aussi, et l'a dit.

---

## D9 — Le site se crée là où la session est ouverte

Pas dans une racine configurée, pas dans `<client>/<projet>` par défaut : dans le dossier où
Claude Code a été ouvert, dans un sous-dossier au nom du site.

**La raison qui tranche est technique.** Les outils de Claude Code sont autorisés dans le
dossier de la session et demandent une permission à chaque écriture en dehors. Un site créé
à un autre endroit, c'est une question à chaque fichier pendant la construction — pour un
novice qui ne sait pas pourquoi. Sur les deux premiers bootstraps, ça n'a jamais gêné parce
que la session était déjà ouverte au bon endroit ; c'était un hasard, pas une garantie.

**La seconde est humaine.** « J'ai ouvert Claude Code ici, le site apparaît ici. » Personne
ne cherche où est passé son dossier.

**Ce qui reste de l'ancienne approche.** La question « où ranges-tu tes sites ? » de
l'installeur devient un repère : le relevé des capacités prévient quand la session est
ouverte ailleurs, et l'utilisateur tranche. Trois endroits sont refusés — le dossier du
skill, la racine du disque, celle du profil — et deux valent un avertissement, le Bureau et
Téléchargements. Le regroupement par client est une option pour qui travaille en agence,
pas un préalable qu'on impose à quelqu'un qui construit son propre site.

---

## D10 — Opus 5 au minimum pour orchestrer, Sonnet pour exécuter

Un bootstrap est une tâche agentique longue — des heures de travail suivi, des sous-agents à
piloter, des décisions d'architecture et de design, des textes cohérents d'une page à
l'autre. La documentation d'Anthropic décrit `xhigh` comme le niveau des « tâches agentiques
et de codage longues, au-delà de trente minutes » : c'est notre cas exact.

| Orchestrateur | Verdict |
|---|---|
| Fable 5.1, `high` ou `xhigh` | Idéal, pour les projets qu'on veut reprendre le moins |
| Opus 5, `xhigh` | Le bon choix par défaut |
| Opus 5, `high` | Le minimum acceptable (défaut de Claude Code sur Max) |
| Sonnet 5, `xhigh` | Dépannage sur une vitrine simple, à annoncer |
| En dessous, Haiku | Non |

**Les sous-agents restent sur Sonnet**, et c'est délibéré : leurs briefs sont détaillés, leur
travail est de l'exécution, et deux bootstraps l'ont validé — une seule erreur de type sur
huit fichiers de section. Un orchestrateur fort avec des exécutants Sonnet bat l'inverse.

**`ultracode` est écarté, et le skill le dit à l'utilisateur.** C'est la fausse bonne idée
du réglage le plus puissant : il monte l'effort à `xhigh` — ce qu'on veut — mais il fait
aussi orchestrer des workflows dynamiques, qui lancent leurs propres sous-agents et
redécoupent le travail. Notre découpage est écrit et éprouvé : périmètres de fichiers
exclusifs, fichiers-contrats, briefs qui portent le texte final. Deux orchestrations
superposées ne s'additionnent pas, elles se marchent dessus — les sous-agents d'`ultracode`
ignorent nos périmètres et écriraient là où les nôtres travaillent, exactement la panne que
ces périmètres rendent impossible. `xhigh` seul donne la profondeur sans le conflit.

**En phase 2, Sonnet 5 suffit.** L'édition au clic est un autre métier que le bootstrap :
le code existe, le commentaire dit quoi changer, le fichier visé est souvent déjà nommé dans
le lot. C'est du codage courant sur un périmètre connu, avec le même contexte d'un million
de jetons. Réserve : quand un retour demande une décision de structure ou de design plutôt
qu'une retouche — « la page d'accueil fait pauvre » a donné une section entière — on repasse
sur Opus le temps de ce lot.

**Le skill l'annonce et le consigne.** Il dit son modèle dès la première phrase, avertit
franchement s'il est sous la barre, et le blueprint s'ouvre sur une ligne « Construit
avec » — pour qu'on sache, six mois plus tard, si un premier jet inégal a été produit dans
de bonnes conditions ou en dépannage.

---

## D11 — Le genre de site d'abord, et un chemin par genre

La première question du brief est désormais « quel genre de site ? » — landing ou page
produit, vitrine, boutique, application — et la réponse décide du reste : quelles pages
(`structures.md`), quels modules, quelle ampleur de mouvement, combien d'agents, où chercher
l'inspiration.

**Pourquoi une question de plus.** Sans elle, chaque site prend le chemin standard — celui
d'une vitrine. Une boutique y perd ses CGV et son tunnel ; une landing y gagne une base de
données, un back-office et quatre agents pour une page. Le troisième bootstrap l'a montré :
on sait ce qu'on doit construire seulement quand on sait ce que c'est.

**Un chemin court pour la landing.** Une page, une action, pas de base sauf pour un
formulaire, un ou deux agents, mentions légales et confidentialité seulement. Le bootstrap
va plus vite parce qu'il fait moins, pas parce qu'il fait moins bien.

**Ce que ça ne change pas.** La barre de direction, le texte écrit avant la construction, le
mouvement décidé, l'auto-test : le socle de méthode est le même pour tous les genres.
