import type { DefaultSession } from "next-auth";

/* ---------------------------------------------------------------------------
   Typage de la session.

   Sans ce fichier, `session.user.id` et `session.user.role` n'existent pas pour
   TypeScript, et chaque appelant écrit `(session.user as { id?: string }).id` —
   un cast répété partout, qui finit par masquer une vraie erreur de type.

   Les champs sont remplis dans les callbacks `jwt` et `session` de
   `auth.config.ts`. Si tu ajoutes un champ là-bas, ajoute-le ici.
--------------------------------------------------------------------------- */

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
