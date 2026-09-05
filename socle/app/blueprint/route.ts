import { readFile } from "node:fs/promises";
import path from "node:path";

/* ---------------------------------------------------------------------------
   Sert le blueprint rendu, pour l'afficher dans le panneau navigateur de
   Claude Code sans quitter le terminal.

   La page HTML est produite par le skill :
     node <skill>/scripts/blueprint-html.mjs BLUEPRINT.md

   Route strictement limitée au développement.
--------------------------------------------------------------------------- */

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const html = await readFile(
      path.join(process.cwd(), ".buildyoursite", "blueprint.html"),
      "utf8",
    );
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(
      "Blueprint absent. Genere-le avec scripts/blueprint-html.mjs.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}
