"use client";

import { useActionState } from "react";
import { connexion, type ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

const champ =
  "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const label = "text-xs font-semibold text-foreground/80";

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(connexion, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="suite" value={suite} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={label}>
          Adresse e-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={champ} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={label}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={champ}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
