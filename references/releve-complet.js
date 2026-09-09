/* ===========================================================================
   RELEVÉ COMPLET D'UN SITE DE RÉFÉRENCE : un seul passage, six dimensions.

   À coller tel quel dans `javascript_tool` sur la page de référence, une fois
   qu'elle est chargée (voir extraction-charte.md §1-4 pour l'atteindre : SPA,
   iframe, sous-domaine `.static.`).

   Existe parce qu'une liste qu'on parcourt de mémoire perd toujours un maillon.
   Sur le premier bootstrap j'ai relevé les couleurs et oublié la géométrie,
   puis relevé la géométrie et oublié le mouvement, puis les liens. Chaque
   oubli a été trouvé par l'utilisateur, pas par moi.

   Le script fait défiler la page pour mesurer parallaxe et apparitions, puis
   revient au point de départ. Il s'écrit sans IIFE : `javascript_tool` accepte
   le `await` de haut niveau et renvoie la dernière expression. L'envelopper
   dans une fonction asynchrone renverrait une promesse au lieu du relevé.
   =========================================================================== */

const dodo = (ms) => new Promise((r) => setTimeout(r, ms));
const yDepart = window.scrollY;
const st = (el) => getComputedStyle(el);
const R = {};

/* --- 0. contexte ------------------------------------------------------ */
R.page = {
    url: location.href,
    titre: document.title,
    largeurVue: document.documentElement.clientWidth,
    RAPPEL: "Relancer ce script à 375px ET à 1280px : un `hidden lg:block` est invisible à l'une des deux.",
};

/* --- 1. palette : styles CALCULÉS, jamais les variables CSS ------------
     Les tokens :root mentent. Vérifié : ils annonçaient un accent terracotta
     alors que tous les CTA étaient en cyan posé en valeur arbitraire. */
const infos = (el) => {
    if (!el) return null;
    const s = st(el);
    return {
      txt: (el.innerText || "").trim().slice(0, 30),
      bg: s.backgroundColor,
      color: s.color,
      police: s.fontFamily.split(",")[0].replace(/["']/g, ""),
      graisse: s.fontWeight,
      taille: s.fontSize,
      rayon: s.borderRadius,
    };
};
R.palette = {
    body: infos(document.body),
    h1: infos(document.querySelector("h1")),
    accentDansTitre: [...document.querySelectorAll("h1 span, h1 em, h1 b")].map(infos),
    ctas: [...document.querySelectorAll("a, button")].slice(0, 10).map(infos),
    fondsDeSection: [...document.querySelectorAll("section, footer, header")].map((s) => ({
      id: s.id || s.tagName.toLowerCase(),
      bg: st(s).backgroundColor,
    })),
};

/* --- 2. typographie : les polices RENDUES, pas celles importées -------- */
const polices = new Set();
document.querySelectorAll("h1,h2,h3,p,span,button,a").forEach((el) => {
    polices.add(st(el).fontFamily.split(",")[0].replace(/["']/g, "").trim());
});
R.typographie = { policesRendues: [...polices].filter(Boolean).slice(0, 10) };

/* --- 3. géométrie : rotations, rayons, ombres, grilles -----------------
     Oubliée au premier bootstrap : le bandeau incliné était plat. */
R.geometrie = [...document.querySelectorAll("section, header, footer, main > div")]
    .slice(0, 25)
    .map((el) => {
      const s = st(el);
      const r = el.getBoundingClientRect();
      return {
        id: el.id || el.tagName.toLowerCase(),
        classes: (el.className || "").toString().slice(0, 130),
        rotate: s.rotate, // Tailwind 4 met la rotation ICI, pas dans transform
        transform: s.transform,
        rayon: s.borderRadius,
        ombre: s.boxShadow.slice(0, 70),
        bordure: s.borderTopWidth + " " + s.borderTopColor,
        grille: s.display === "grid" ? s.gridTemplateColumns : null,
        marges: s.paddingTop + " / " + s.paddingLeft,
        overflow: s.overflow + " | " + s.overflowX,
        boite: { l: Math.round(r.width), h: Math.round(r.height) },
      };
    });

/* --- 4. liens sortants ET leurs paramètres -----------------------------
     Oubliés au premier bootstrap : l'icône Instagram était décorative. */
R.liens = [...document.querySelectorAll("a[href]")]
    .map((a) => ({
      href: a.getAttribute("href"),
      aria: a.getAttribute("aria-label"),
      txt: (a.innerText || "").trim().slice(0, 24),
      icone: !!a.querySelector("svg"),
      zone: a.closest("header") ? "header" : a.closest("footer") ? "footer" : "corps",
    }))
    .filter((l) => l.href && !l.href.startsWith("#"));

/* --- 5. photos, avec leurs textes alternatifs -------------------------
     Les `alt` disent où va chaque photo : réutilise-les tels quels. */
R.photos = {
    img: [...document.querySelectorAll("img")].map((i) => {
      const cadre = i.parentElement;
      const rc = cadre.getBoundingClientRect();
      const si = st(i), sc = st(cadre);
      return {
        src: i.currentSrc || i.src,
        alt: i.alt,
        naturel: i.naturalWidth + "x" + i.naturalHeight,
        /* --- LE CADRAGE : autant travaillé que la palette ---
           Sur la référence, trois motifs distincts coexistaient (16/11 pour
           les blocs, hauteur fixe pour les cartes, 4/5 pour les portraits)
           avec UN coin surdimensionné par photo, alterné d'une photo à
           l'autre. C'est ce rythme qui fait l'élégance, pas le rayon uniforme. */
        cadre: {
          ratio: rc.height ? +(rc.width / rc.height).toFixed(3) : null,
          aspectRatioCss: sc.aspectRatio,
          rayon: sc.borderRadius, // 4 valeurs différentes = coin surdimensionné
          ombre: sc.boxShadow.slice(0, 60),
          classes: (cadre.className || "").toString().slice(0, 120),
        },
        recadrage: {
          objectFit: si.objectFit,
          // ≠ « 50% 50% » = point focal recalé à la main sur CETTE photo
          objectPosition: si.objectPosition,
          // Image plus haute que son cadre = réserve pour la parallaxe
          hauteurImg: si.height,
          classesImg: (i.className || "").toString().slice(0, 80),
        },
      };
    }),
    fondsCss: [
      ...new Set(
        [...document.querySelectorAll("*")]
          .map((el) => st(el).backgroundImage)
          .filter((b) => b && b !== "none" && b.includes("url(") && !b.startsWith("url(\"data:"))
          .map((b) => (b.match(/url\(["']?([^"')]+)/) || [])[1]),
      ),
    ].slice(0, 15),
};

/* --- 6. mouvement : n'existe que dans le temps -------------------------
     Oublié au premier bootstrap : site figé alors que la référence glissait. */
const mvt = {
    bibliotheques: {
      htmlClass: document.documentElement.className,
      globaux: ["gsap", "ScrollTrigger", "Lenis", "lenis", "Motion", "AOS"].filter((k) => k in window),
      attributs: ["data-aos", "data-scroll", "data-animate", "data-reveal"]
        .map((a) => ({ a, n: document.querySelectorAll("[" + a + "]").length }))
        .filter((x) => x.n),
    },
};

// Apparitions : mesurer AVANT d'avoir parcouru la page. Une apparition
// jouée « une fois » a déjà joué si on a défilé, et on conclurait qu'il
// n'y en a pas. Erreur commise, puis corrigée en rechargeant.
const sousLePli = [...document.querySelectorAll("section h2, section img, section p")].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight * 1.5,
);
mvt.apparitions = {
    note: yDepart > 100 ? "PAGE DÉJÀ PARCOURUE : recharge et relance, sinon ce relevé ment." : "page en haut, relevé fiable",
    avantEntree: sousLePli.slice(0, 5).map((el) => ({
      tag: el.tagName.toLowerCase(),
      opacite: st(el).opacity,
      transform: st(el).transform,
      clip: st(el).clipPath,
    })),
};

/* Parallaxe : comparer le déplacement réel d'une image à la distance défilée.

   On échantillonne PLUSIEURS images, à plusieurs hauteurs de page, et on
   retient le retard maximal. Tester une seule image donne un faux négatif :
   la première image d'une page est souvent un fond de héros en `absolute
   inset-0`, qui suit le défilement exactement. Erreur commise en testant ce
   script : il concluait « pas de parallaxe » sur une page qui en avait. */
const hauteurPage = document.documentElement.scrollHeight;
const mesures = [];
for (const fraction of [0.2, 0.45, 0.7]) {
    window.scrollTo(0, Math.round(hauteurPage * fraction));
    await dodo(700);
    const visibles = [...document.querySelectorAll("img")].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.height > 60 && r.top > -r.height && r.top < window.innerHeight;
    });
    const avant = visibles.map((i) => [i, i.getBoundingClientRect().top]);
    window.scrollBy(0, 250);
    await dodo(700);
    for (const [img, haut1] of avant) {
      const parcouru = haut1 - img.getBoundingClientRect().top;
      mesures.push({
        src: (img.currentSrc || img.src).split("/").pop().slice(0, 28),
        parcouru: Math.round(parcouru),
        retard: Math.round(250 - parcouru),
      });
    }
}
const pire = mesures.reduce((a, m) => (Math.abs(m.retard) > Math.abs(a?.retard ?? 0) ? m : a), null);
mvt.parallaxe = {
    defileDe: 250,
    imagesMesurees: mesures.length,
    retardMax: pire,
    detail: mesures,
    verdict:
      pire && Math.abs(pire.retard) > 3
        ? "PARALLAXE PRÉSENTE : à reproduire (voir components/ui/parallaxe.tsx)"
        : "pas de parallaxe",
};

// Transitions déclarées (survol, en-tête au défilement)
const trans = new Set();
document.querySelectorAll("header, a, button, section").forEach((el) => {
    const s = st(el);
    if (s.transitionDuration !== "0s") trans.add(s.transitionProperty.slice(0, 45) + " · " + s.transitionDuration);
});
mvt.transitions = [...trans].slice(0, 8);
R.mouvement = mvt;

window.scrollTo(0, yDepart);

/* --- 8. INVENTAIRE DES ÉLÉMENTS INTERACTIFS ---------------------------
   Le manque qui a coûté le plus cher au quatrième bootstrap.

   La référence avait trois téléphones dans son héros : chacun un lien vers sa
   page de marque, tous les trois se soulevant au survol. Elle avait aussi un
   bouton flottant en bas à droite, sur chaque page. Le relevé mesurait bien
   les transitions et listait bien les liens, mais séparément, dans deux
   sections qui ne se parlaient pas. Le site livré a eu un téléphone, immobile
   et sans lien, et plus de bouton flottant. Personne ne s'en est aperçu avant
   la remise.

   Cette section réunit les trois informations sur UNE ligne par élément : ce
   que c'est, où ça mène, comment ça réagit. Le blueprint doit ensuite donner à
   chaque ligne un verdict (reproduit, réinterprété, abandonné) avec la
   raison quand c'est abandonné. Un élément qui disparaît sans sa ligne est un
   défaut, pas une décision. */
const transitionDe = (el) => {
    const s = st(el);
    if (s.transitionDuration === "0s" || !s.transitionDuration) return null;
    return s.transitionProperty.slice(0, 50) + " · " + s.transitionDuration;
};
/* Le soulèvement au survol est presque toujours porté par la CARTE, pas par le
   lien qu'elle contient. Sans remonter, on conclurait que rien ne réagit. */
const ancetreQuiReagit = (el) => {
    let p = el.parentElement;
    for (let i = 0; p && p !== document.body && i < 6; i++) {
      const t = transitionDe(p);
      if (t) return { classes: (p.className || "").toString().slice(0, 60), reagit: t };
      p = p.parentElement;
    }
    return null;
};
const estFlottant = (el) => {
    let p = el;
    for (let i = 0; p && p !== document.body && i < 5; i++) {
      const pos = st(p).position;
      if (pos === "fixed" || pos === "sticky") return true;
      p = p.parentElement;
    }
    return false;
};
const interactifs = [...document.querySelectorAll("a[href], button, [role='button']")];
R.inventaireInteractif = {
    total: interactifs.length,
    NOTE: "Chaque ligne doit recevoir un verdict au blueprint : reproduit / réinterprété / abandonné + raison.",
    elements: interactifs.slice(0, 45).map((el) => {
      const r = el.getBoundingClientRect();
      const href = el.getAttribute("href");
      const texte = (el.innerText || "").trim().replace(/\s+/g, " ");
      return {
        tag: el.tagName.toLowerCase(),
        txt: texte.slice(0, 40),
        aria: el.getAttribute("aria-label"),
        href,
        // Un lien sortant part chez quelqu'un d'autre : il ne se recopie que si
        // le site appartient à l'utilisateur ET qu'il a accepté la reprise.
        externe: !!href && /^https?:/i.test(href) && !href.includes(location.host),
        // Une icône sans texte est presque toujours un lien : cherche sa cible.
        iconeSeule: !texte && !!el.querySelector("svg, img"),
        // Bouton flottant, barre collante : ces éléments-là s'oublient parce
        // qu'ils ne sont dans aucune section.
        flottant: estFlottant(el),
        zone: el.closest("header") ? "header" : el.closest("footer") ? "footer" : "corps",
        cible: Math.round(r.width) + "x" + Math.round(r.height),
        reagit: transitionDe(el),
        blocQuiReagit: ancetreQuiReagit(el),
      };
    }),
};

/* --- 7. la liste à cocher, rendue avec le relevé ---------------------- */
R.CHECKLIST = [
    "palette relevée depuis les styles CALCULÉS (pas les variables :root)",
    "polices RENDUES relevées + licences vérifiées (Google Fonts = libre)",
    "géométrie : rotations, rayons, ombres, grilles, overflow",
    "liens sortants ET leurs paramètres d'URL (?text= WhatsApp, etc.)",
    "photos + leurs textes alternatifs (ils disent où va chacune)",
    "CADRAGE : ratios, coins surdimensionnés alternés, object-position par photo",
    "mouvement : défilement fluide, parallaxe, apparitions, transitions",
    "INVENTAIRE INTERACTIF : un verdict par ligne dans le blueprint, reproduit / réinterprété / abandonné",
    "les éléments FLOTTANTS de l'inventaire ont leur verdict (ils ne sont dans aucune section, on les oublie)",
    "ce qui RÉAGIT au survol est reporté dans les briefs (voir mouvement.md, « Les états »)",
    "RELEVÉ REFAIT à une seconde largeur (375 et 1280)",
    "réponses phase 0.c reportées : propriété, liens, fidèle ou réinterprété",
];

// Dernière expression : `javascript_tool` la renvoie telle quelle.
// Pas de `return` : il serait hors fonction, donc invalide.
JSON.stringify(R, null, 1);
