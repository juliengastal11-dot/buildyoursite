import { NextResponse } from "next/server";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/* ---------------------------------------------------------------------------
   Reception des commentaires de l'overlay d'edition visuelle.
   Ecrit dans .buildyoursite/comments.json ; les images jointes atterrissent dans
   .buildyoursite/attachments/. Le watcher surveille comments.json et reveille Claude.
   Route strictement limitee au developpement.
--------------------------------------------------------------------------- */

type Incoming = {
  url?: string;
  comments?: Array<{
    n: number;
    message: string;
    target: Record<string, unknown>;
    attachments?: Array<{ name: string; dataUrl: string }>;
  }>;
};

const ROOT = path.join(process.cwd(), ".buildyoursite");
const FILE = path.join(ROOT, "comments.json");
const ATTACH = path.join(ROOT, "attachments");

async function saveAttachment(name: string, dataUrl: string): Promise<string | null> {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const ext = (m[1].split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40) || "image";
  const file = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${safe}.${ext}`;
  await mkdir(ATTACH, { recursive: true });
  await writeFile(path.join(ATTACH, file), Buffer.from(m[2], "base64"));
  return path.join(".buildyoursite", "attachments", file).replace(/\\/g, "/");
}

/**
 * L'état des lots, pour l'overlay. Il interroge ici toutes les 1,5 s après un
 * envoi : tant qu'un lot est `pending`, une comète tourne autour de sa barre.
 * Claude passe le lot à `en_cours` dès qu'il se réveille — avant de travailler —
 * puis à `done` : c'est le passage à `en_cours` qui arrête la comète, pour que
 * les secondes de réveil ne ressemblent pas à une panne.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 404 });
  }
  let batches: Array<{ id?: string; status?: string; sentAt?: string; page?: string }> = [];
  try {
    const existing = JSON.parse(await readFile(FILE, "utf8")) as { batches?: typeof batches };
    if (Array.isArray(existing.batches)) batches = existing.batches;
  } catch {
    /* aucun lot encore */
  }
  return NextResponse.json(
    { batches: batches.map((b) => ({ id: b.id, status: b.status, sentAt: b.sentAt, page: b.page })) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 404 });
  }

  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return NextResponse.json({ error: "json invalide" }, { status: 400 });
  }

  const incoming = Array.isArray(body.comments) ? body.comments : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "aucun commentaire" }, { status: 400 });
  }

  const comments = [];
  for (const c of incoming) {
    const saved: string[] = [];
    for (const a of c.attachments ?? []) {
      const p = await saveAttachment(a.name, a.dataUrl);
      if (p) saved.push(p);
    }
    comments.push({
      n: c.n,
      message: String(c.message ?? "").slice(0, 4000),
      target: c.target,
      attachments: saved,
    });
  }

  await mkdir(ROOT, { recursive: true });

  let existing: { batches: unknown[] } = { batches: [] };
  try {
    existing = JSON.parse(await readFile(FILE, "utf8"));
    if (!Array.isArray(existing.batches)) existing.batches = [];
  } catch {
    /* premier lot */
  }

  existing.batches.push({
    id: crypto.randomBytes(4).toString("hex"),
    sentAt: new Date().toISOString(),
    page: body.url ?? "/",
    status: "pending",
    comments,
  });

  // Ecriture atomique : le watcher ne doit jamais lire un fichier a moitie ecrit.
  const tmp = `${FILE}.${crypto.randomBytes(3).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(existing, null, 2), "utf8");
  await rename(tmp, FILE);

  return NextResponse.json({ ok: true, received: comments.length });
}
