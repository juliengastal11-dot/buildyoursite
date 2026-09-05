"use client";

/* ---------------------------------------------------------------------------
   Overlay d'édition visuelle — /buildyoursite
   Injecté uniquement en développement (voir app/layout.tsx).

   Survol = surbrillance. Clic = sélection figée + bulle de commentaire.
   Les commentaires s'empilent avec une pastille numérotée, puis partent en lot.
   Une pastille se clique : le commentaire se rouvre, on le corrige ou on le
   retire. Après un envoi, une comète tourne autour de la barre tant que Claude
   n'a pas accusé réception — pour que l'attente ne ressemble pas à une panne.

   Sur écran tactile, il n'y a pas de survol : la surbrillance apparaît au
   doigt posé, la sélection au relâchement.
--------------------------------------------------------------------------- */

import { useCallback, useEffect, useRef, useState } from "react";

type Target = {
  selector: string;
  tag: string;
  classes: string;
  text: string;
  component: string | null;
  source: string | null;
  /**
   * Chemin du fichier source, lu sur le `data-src` de l'ancêtre le plus proche.
   * Un seul attribut posé sur la racine d'une section suffit : tous ses
   * descendants en héritent via `closest()`. C'est le handle le plus fiable,
   * et le seul qui fonctionne pour les Server Components.
   */
  srcFile: string | null;
};

type Rect = { top: number; left: number; width: number; height: number };

type Draft = { target: Target; rect: Rect };

type Attachment = { name: string; dataUrl: string };

type Comment = Draft & {
  n: number;
  message: string;
  attachments: Attachment[];
};

/* ------------------------------- helpers -------------------------------- */

function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && parts.length < 8) {
    if (node.id) {
      parts.unshift("#" + node.id);
      break;
    }
    let sel = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const tag = node.tagName;
      const siblings = Array.from(parent.children).filter((c) => c.tagName === tag);
      if (siblings.length > 1) sel += ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")";
    }
    parts.unshift(sel);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

/** Remonte la fibre React pour retrouver le composant et, si possible, le fichier source. */
function reactInfo(el: Element): { component: string | null; source: string | null } {
  try {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    if (!key) return { component: null, source: null };
    let fiber = (el as unknown as Record<string, unknown>)[key] as Record<string, unknown> | null;
    let component: string | null = null;
    let source: string | null = null;
    let depth = 0;
    while (fiber && depth < 40) {
      const t = fiber.type as unknown;
      if (!component && typeof t === "function") {
        const fn = t as { displayName?: string; name?: string };
        const name = fn.displayName ?? fn.name;
        if (name && name.length > 1 && /^[A-Z]/.test(name)) component = name;
      }
      const ds = fiber._debugSource as { fileName?: string; lineNumber?: number } | undefined;
      if (!source && ds && ds.fileName) source = ds.fileName + ":" + (ds.lineNumber ?? "?");
      if (component && source) break;
      fiber = (fiber._debugOwner ?? fiber.return) as Record<string, unknown> | null;
      depth++;
    }
    return { component, source };
  } catch {
    return { component: null, source: null };
  }
}

function describe(el: Element): Target {
  const info = reactInfo(el);
  const cls = typeof el.className === "string" ? el.className : "";
  return {
    selector: cssPath(el),
    tag: el.tagName.toLowerCase(),
    classes: cls.slice(0, 300),
    text: ((el as HTMLElement).innerText ?? "").trim().slice(0, 240),
    component: info.component,
    source: info.source,
    srcFile: el.closest("[data-src]")?.getAttribute("data-src") ?? null,
  };
}

function docRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  };
}

function isOverlayNode(el: Element | null): boolean {
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest("[data-buildyoursite-ui]");
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/** La zone de saisie grandit avec le texte, jusqu'à un plafond ; au-delà elle défile. */
function ajusterHauteur(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.4)) + "px";
}

/* -------------------------------- styles -------------------------------- */

const C = {
  bg: "#1f1e1d",
  bg2: "#2a2926",
  border: "#3d3b37",
  text: "#e9e6df",
  muted: "#8f8b82",
  accent: "#d97757",
};

const FONT = "ui-sans-serif, -apple-system, Segoe UI, system-ui, sans-serif";

/** Mémoire du mode édition/navigation, le temps de la session du navigateur. */
const CLE_MODE = "buildyoursite:mode";
/** Mémoire de la position de la barre, déplacée par l'utilisateur. */
const CLE_POS = "buildyoursite:position";

/* La comète : un dégradé conique dont l'angle tourne. Elle est posée derrière
   la barre, légèrement plus grande ; la barre, opaque, ne laisse voir qu'un
   anneau de trois pixels — la lumière semble faire le tour de la pastille. */
const STYLE_COMETE = `
@property --byt-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes byt-comete { to { --byt-angle: 360deg; } }
.byt-comete {
  position: absolute; inset: -3px; border-radius: 999px; pointer-events: none;
  background: conic-gradient(from var(--byt-angle),
    transparent 0deg, transparent 240deg,
    rgba(217,119,87,.12) 280deg, ${C.accent} 335deg, #ffd9c7 352deg, transparent 360deg);
  animation: byt-comete 1.5s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .byt-comete { animation: none; background: ${C.accent}; opacity: .45; }
}`;

/** Ce sur quoi un appui démarre un déplacement : le fond de la barre, rien d'autre. */
function estPoigneeDeBarre(cible: EventTarget | null): boolean {
  const el = cible as Element | null;
  if (!el || typeof el.closest !== "function") return false;
  return !el.closest("button, input, label, a, textarea, select");
}

/* ------------------------------- composant ------------------------------ */

export function BuildYourSiteOverlay() {
  // Navigation par défaut : on doit pouvoir parcourir son propre site.
  // Le mode choisi est retenu pour la session, sinon chaque changement de page le réinitialise.
  const [armed, setArmed] = useState(false);
  const [hover, setHover] = useState<Rect | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  /** Numéro du commentaire rouvert depuis sa pastille ; null quand on en écrit un nouveau. */
  const [enEdition, setEnEdition] = useState<number | null>(null);
  const [immediate, setImmediate] = useState(false);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  /** Un lot est parti et Claude n'a pas encore accusé réception : la comète tourne. */
  const [enAttente, setEnAttente] = useState(false);

  // Position de la barre. Elle masque parfois un élément du site — un bouton
  // flottant WhatsApp, par exemple — donc on doit pouvoir la pousser ailleurs.
  // Stockée comme un décalage par rapport à son ancrage bas-droite, et appliquée
  // en `transform` : déplacer en left/top recalculerait la mise en page à chaque
  // pixel du glissement.
  const [decalage, setDecalage] = useState({ x: 0, y: 0 });
  const [glisse, setGlisse] = useState(false);
  const departGlisse = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const armedRef = useRef(armed);
  armedRef.current = armed;
  const draftRef = useRef(draft);
  draftRef.current = draft;

  /* --- mémoire du mode, le temps de la session --- */
  // Lu après le montage et non dans l'initialiseur : sinon le rendu serveur et le rendu
  // navigateur divergent, et React signale une erreur d'hydratation.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLE_MODE) === "edition") setArmed(true);
    } catch {
      /* stockage indisponible : on reste en navigation */
    }
  }, []);

  // La première passe n'écrit rien : elle tomberait avant que la lecture ci-dessus n'ait
  // pris effet, et écraserait le mode mémorisé par la valeur par défaut.
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    try {
      sessionStorage.setItem(CLE_MODE, armed ? "edition" : "navigation");
    } catch {
      /* sans mémoire, le mode se réinitialisera : sans gravité */
    }
  }, [armed]);

  /* --- mémoire de la position de la barre --- */
  useEffect(() => {
    try {
      const brut = sessionStorage.getItem(CLE_POS);
      if (!brut) return;
      const p = JSON.parse(brut) as { x: number; y: number };
      if (typeof p?.x === "number" && typeof p?.y === "number") setDecalage(p);
    } catch {
      /* position illisible : on repart du coin bas-droite */
    }
  }, []);

  /* --- la comète : tant qu'un lot est `pending`, Claude n'a pas encore vu ---
     On interroge l'API toutes les 1,5 s. Claude passe le lot à `en_cours` dès
     qu'il se réveille, avant même de travailler : c'est ce qui arrête la comète.
     Au montage, on vérifie une fois : un lot envoyé depuis une autre page peut
     encore attendre. */
  useEffect(() => {
    let actif = true;
    const verifier = async () => {
      try {
        const r = await fetch("/api/buildyoursite", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { batches?: { status: string }[] };
        const reste = (d.batches ?? []).some((b) => b.status === "pending");
        if (!actif) return;
        if (reste && !enAttente) setEnAttente(true);
        if (!reste && enAttente) {
          setEnAttente(false);
          setFlash("Claude a pris la main");
          setTimeout(() => setFlash(null), 2500);
        }
      } catch {
        /* serveur en train de redémarrer : on réessaie au prochain tour */
      }
    };
    verifier();
    if (!enAttente) return () => {
      actif = false;
    };
    const t = setInterval(verifier, 1500);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [enAttente]);

  /* --- déplacement de la barre --- */
  const debutGlisse = useCallback(
    (e: React.PointerEvent) => {
      if (!estPoigneeDeBarre(e.target)) return;
      e.preventDefault();
      // Capture : le glissement continue même si le pointeur sort de la barre.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      departGlisse.current = { px: e.clientX, py: e.clientY, ox: decalage.x, oy: decalage.y };
      setGlisse(true);
    },
    [decalage],
  );

  const pendantGlisse = useCallback((e: React.PointerEvent) => {
    const d = departGlisse.current;
    if (!d) return;
    const marge = 8;
    const barre = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Bornes : la barre reste entièrement visible, quel que soit le geste.
    const xMin = -(window.innerWidth - barre.width - marge * 2);
    const yMin = -(window.innerHeight - barre.height - marge * 2);
    setDecalage({
      x: Math.min(0, Math.max(xMin, d.ox + (e.clientX - d.px))),
      y: Math.min(0, Math.max(yMin, d.oy + (e.clientY - d.py))),
    });
  }, []);

  const finGlisse = useCallback(
    (e: React.PointerEvent) => {
      if (!departGlisse.current) return;
      departGlisse.current = null;
      setGlisse(false);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      try {
        sessionStorage.setItem(CLE_POS, JSON.stringify(decalage));
      } catch {
        /* sans mémoire, la barre repartira du coin : sans gravité */
      }
    },
    [decalage],
  );

  /* --- capture des interactions sur la page --- */
  useEffect(() => {
    const surligner = (cible: EventTarget | null) => {
      if (!armedRef.current || draftRef.current) return;
      const el = cible as Element | null;
      if (!el || isOverlayNode(el)) {
        setHover(null);
        return;
      }
      setHover(docRect(el));
    };

    const onMove = (e: MouseEvent) => surligner(e.target);
    // Tactile : pas de survol possible. Le doigt posé surligne, le relâchement
    // (le clic qui suit) sélectionne. Même geste, réactif.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      surligner(e.target);
    };

    const onClick = (e: MouseEvent) => {
      if (!armedRef.current) return;
      const el = e.target as Element | null;
      if (!el || isOverlayNode(el)) return;
      e.preventDefault();
      e.stopPropagation();
      setDraft({ target: describe(el), rect: docRect(el) });
      setEnEdition(null);
      setMessage("");
      setFiles([]);
      setHover(null);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(null);
        setEnEdition(null);
        setHover(null);
      }
      if (e.altKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setArmed((a) => !a);
      }
    };

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  useEffect(() => {
    if (draft) {
      const t = setTimeout(() => {
        taRef.current?.focus();
        ajusterHauteur(taRef.current);
      }, 20);
      return () => clearTimeout(t);
    }
  }, [draft]);

  const addFiles = useCallback(async (list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4);
    const out = await Promise.all(
      arr.map(async (f) => ({ name: f.name || "image.png", dataUrl: await fileToDataUrl(f) })),
    );
    setFiles((prev) => [...prev, ...out].slice(0, 4));
  }, []);

  const post = useCallback(async (batch: Comment[]) => {
    setSending(true);
    try {
      const res = await fetch("/api/buildyoursite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: batch, url: location.pathname }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setComments([]);
      setFlash(null);
      setEnAttente(true);
    } catch {
      setFlash("Échec de l'envoi");
      setTimeout(() => setFlash(null), 2200);
    } finally {
      setSending(false);
    }
  }, []);

  const fermerBulle = useCallback(() => {
    setDraft(null);
    setEnEdition(null);
    setMessage("");
    setFiles([]);
  }, []);

  /** Rouvre un commentaire depuis sa pastille, texte et images en place. */
  const rouvrir = useCallback((c: Comment) => {
    setDraft({ target: c.target, rect: c.rect });
    setMessage(c.message);
    setFiles(c.attachments);
    setEnEdition(c.n);
    setHover(null);
  }, []);

  const validate = useCallback(() => {
    if (!draft || !message.trim()) return;
    if (enEdition !== null) {
      setComments((prev) =>
        prev.map((c) => (c.n === enEdition ? { ...c, message: message.trim(), attachments: files } : c)),
      );
      fermerBulle();
      return;
    }
    const c: Comment = {
      ...draft,
      n: comments.length + 1,
      message: message.trim(),
      attachments: files,
    };
    fermerBulle();
    if (immediate) void post([c]);
    else setComments((prev) => [...prev, c]);
  }, [draft, message, files, comments.length, immediate, post, enEdition, fermerBulle]);

  /** Retire le commentaire rouvert et renumérote les suivants. */
  const supprimer = useCallback(() => {
    if (enEdition === null) return;
    setComments((prev) => prev.filter((c) => c.n !== enEdition).map((c, i) => ({ ...c, n: i + 1 })));
    fermerBulle();
  }, [enEdition, fermerBulle]);

  if (process.env.NODE_ENV !== "development") return null;

  const box = (r: Rect, color: string, solid: boolean) => ({
    position: "absolute" as const,
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    outline: (solid ? "2px solid " : "2px dashed ") + color,
    outlineOffset: 1,
    borderRadius: 4,
    background: solid ? "transparent" : color + "14",
    pointerEvents: "none" as const,
  });

  /* position de la bulle, ramenée dans le viewport */
  const bubblePos = (() => {
    if (!draft) return { top: 0, left: 0, width: 330 };
    const w = 330;
    const left = Math.min(
      Math.max(draft.rect.left, window.scrollX + 8),
      window.scrollX + window.innerWidth - w - 8,
    );
    const below = draft.rect.top + draft.rect.height + 10;
    const room = window.scrollY + window.innerHeight - below;
    const top = room > 220 ? below : Math.max(window.scrollY + 8, draft.rect.top - 230);
    return { top, left, width: w };
  })();

  const texteBarre = enAttente ? "Envoyé · Claude arrive…" : flash;

  return (
    <div
      data-buildyoursite-ui=""
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2147483000,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      <style>{STYLE_COMETE}</style>

      {armed && hover && !draft && <div style={box(hover, C.accent, false)} />}
      {draft && <div style={box(draft.rect, C.accent, true)} />}

      {/* pastilles des commentaires en attente — cliquables : le commentaire se rouvre */}
      {comments.map((c) => (
        <button
          key={c.n}
          type="button"
          title={c.message + " — cliquer pour modifier"}
          onClick={() => rouvrir(c)}
          style={{
            position: "absolute",
            top: c.rect.top - 10,
            left: c.rect.left - 10,
            width: 22,
            height: 22,
            borderRadius: 999,
            border: enEdition === c.n ? "2px solid #fff" : 0,
            padding: 0,
            background: C.accent,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,.35)",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
        >
          {c.n}
        </button>
      ))}

      {/* bulle de commentaire */}
      {draft && (
        <div
          style={{
            position: "absolute",
            top: bubblePos.top,
            left: bubblePos.left,
            width: bubblePos.width,
            pointerEvents: "auto",
            background: C.bg,
            border: "1px solid " + C.border,
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.45)",
            padding: 10,
            color: C.text,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: C.muted,
              marginBottom: 7,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {enEdition !== null ? `Commentaire ${enEdition} · ` : ""}
              {draft.target.component ?? draft.target.tag}
              {draft.target.text ? " · " + draft.target.text.slice(0, 34) : ""}
            </span>
            <button
              onClick={fermerBulle}
              title="Fermer (Échap)"
              style={{
                background: "none",
                border: 0,
                color: C.muted,
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              {"✕"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <textarea
              ref={taRef}
              autoFocus
              value={message}
              placeholder="Que veux-tu changer ici ?"
              onChange={(e) => {
                setMessage(e.target.value);
                ajusterHauteur(e.target);
              }}
              onPaste={(e) => {
                const imgs = Array.from(e.clipboardData.files).filter((f) =>
                  f.type.startsWith("image/"),
                );
                if (imgs.length) {
                  e.preventDefault();
                  void addFiles(imgs);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  validate();
                }
                e.stopPropagation();
              }}
              rows={2}
              style={{
                flex: 1,
                // Grandit avec le texte ; la poignée en bas à droite permet d'aller plus loin.
                resize: "vertical",
                minHeight: 58,
                maxHeight: "40vh",
                overflow: "auto",
                background: C.bg2,
                border: "1px solid " + C.border,
                borderRadius: 8,
                color: C.text,
                fontSize: 12.5,
                lineHeight: 1.45,
                padding: "7px 9px",
                outline: "none",
                fontFamily: FONT,
              }}
            />
            <button
              onClick={validate}
              disabled={!message.trim()}
              title={enEdition !== null ? "Enregistrer la modification (Entrée)" : "Enregistrer (Entrée)"}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: 0,
                background: message.trim() ? C.accent : C.bg2,
                color: message.trim() ? "#fff" : C.muted,
                cursor: message.trim() ? "pointer" : "default",
                fontSize: 14,
              }}
            >
              {"↵"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
            <button
              onClick={() => fileRef.current?.click()}
              title="Joindre une image"
              style={{
                background: C.bg2,
                border: "1px solid " + C.border,
                borderRadius: 7,
                color: C.muted,
                cursor: "pointer",
                fontSize: 11,
                padding: "3px 8px",
              }}
            >
              {"📎 Image"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void addFiles(e.target.files)}
            />
            {files.map((f, i) => (
              <span
                key={i}
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                title="Retirer"
                style={{
                  fontSize: 10,
                  color: C.text,
                  background: C.bg2,
                  border: "1px solid " + C.border,
                  borderRadius: 6,
                  padding: "2px 6px",
                  cursor: "pointer",
                  maxWidth: 92,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {f.name} {"✕"}
              </span>
            ))}
            {enEdition !== null && (
              <button
                onClick={supprimer}
                title="Retirer ce commentaire du lot"
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "1px solid " + C.border,
                  borderRadius: 7,
                  color: C.muted,
                  cursor: "pointer",
                  fontSize: 11,
                  padding: "3px 8px",
                }}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {/* barre flottante — déplaçable par son fond ; la comète tourne autour pendant l'attente */}
      <div
        style={{
          position: "fixed",
          right: 14,
          bottom: 14,
          transform: `translate(${decalage.x}px, ${decalage.y}px)`,
          pointerEvents: "none",
        }}
      >
        {enAttente && <div className="byt-comete" aria-hidden="true" />}
        <div
          onPointerDown={debutGlisse}
          onPointerMove={pendantGlisse}
          onPointerUp={finGlisse}
          onPointerCancel={finGlisse}
          title="Glissez la barre par son fond pour la déplacer"
          style={{
            position: "relative",
            zIndex: 1,
            pointerEvents: "auto",
            background: C.bg,
            border: "1px solid " + C.border,
            borderRadius: 999,
            boxShadow: glisse ? "0 14px 40px rgba(0,0,0,.55)" : "0 8px 28px rgba(0,0,0,.4)",
            padding: "6px 8px 6px 8px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: C.text,
            fontSize: 11.5,
            cursor: glisse ? "grabbing" : "grab",
            // Sans ça, le navigateur tente de faire défiler la page pendant le geste.
            touchAction: "none",
            userSelect: "none",
            transition: glisse ? "none" : "box-shadow .15s var(--ease-out, ease)",
          }}
        >
          {/* poignée : rend le déplacement découvrable sans texte d'explication */}
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 2px)",
              gap: 2,
              padding: "0 2px",
              opacity: 0.45,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                style={{ width: 2, height: 2, borderRadius: 999, background: C.text }}
              />
            ))}
          </span>
          {/* Mode : on clique celui qu'on veut, jamais celui qu'on quitte. */}
          <div
            role="radiogroup"
            aria-label="Mode de l'aperçu"
            style={{
              display: "flex",
              gap: 2,
              background: C.bg2,
              borderRadius: 999,
              padding: 2,
            }}
          >
            {[
              { actif: false, label: "Navigation" },
              { actif: true, label: "Édition" },
            ].map(({ actif, label }) => {
              const choisi = armed === actif;
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={choisi}
                  onClick={() => setArmed(actif)}
                  title="Alt+E pour basculer"
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: "4px 11px",
                    fontSize: 11.5,
                    fontWeight: choisi ? 600 : 500,
                    fontFamily: FONT,
                    cursor: "pointer",
                    // Le corail ne s'allume qu'en Édition : la couleur dit qu'on annote.
                    background: choisi ? (actif ? C.accent : C.border) : "transparent",
                    color: choisi ? (actif ? "#fff" : C.text) : C.muted,
                    transition: "background .12s, color .12s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <span style={{ width: 1, height: 15, background: C.border }} />

          <label
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: C.muted }}
            title="Applique chaque commentaire dès sa validation, sans attendre un envoi groupé"
          >
            <input
              type="checkbox"
              checked={immediate}
              onChange={(e) => setImmediate(e.target.checked)}
            />
            <span>Changement immédiat</span>
          </label>

          {texteBarre && <span style={{ color: C.accent }}>{texteBarre}</span>}

          {comments.length > 0 && (
            <button
              onClick={() => void post(comments)}
              disabled={sending}
              style={{
                background: C.accent,
                border: 0,
                borderRadius: 999,
                color: "#fff",
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 600,
                padding: "5px 12px",
              }}
            >
              {sending ? "Envoi..." : "Envoyer — " + comments.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
