# Module `admin` — back-office

Espace `/admin` protégé, avec liste + création + édition + suppression sur les modèles du
blueprint. **Dépend du module `auth`** : le greffer d'abord.

## 1. Protection

`middleware.ts` protège déjà `/admin` (module auth). Ajouter le contrôle de rôle dans le
layout, parce que le middleware ne vérifie que la présence d'une session :

```tsx
// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/admin");
  if ((session.user as { role?: string }).role !== "admin") redirect("/");

  return (
    <div className="min-h-dvh grid grid-cols-[220px_1fr]">
      <aside className="border-r border-border p-4">{/* navigation */}</aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
```

Ne jamais se contenter du middleware pour une page d'administration : c'est le layout
serveur qui fait foi.

## 2. Une route par modèle

Pour chaque modèle du blueprint qui mérite une administration :

```
app/admin/<modele>/page.tsx          liste + recherche + pagination
app/admin/<modele>/nouveau/page.tsx  formulaire de création
app/admin/<modele>/[id]/page.tsx     formulaire d'édition + suppression
lib/actions/<modele>.ts              server actions
```

## 3. Server actions — le patron

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function exigeAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") throw new Error("Non autorise");
}

export async function creer(formData: FormData) {
  await exigeAdmin();
  // valider les champs ici, jamais faire confiance au formulaire
  await db.<modele>.create({ data: { /* ... */ } });
  revalidatePath("/admin/<modele>");
  redirect("/admin/<modele>");
}
```

**Chaque server action revérifie le rôle.** Une server action est une route HTTP publique :
elle est appelable directement, sans passer par la page qui l'affiche.

## 4. Composants

Le socle fournit `Button` et `Card`. Pour un back-office, ajouter au besoin :

```bash
npx shadcn@latest add table dialog select badge dropdown-menu
```

`components.json` est déjà configuré à la racine du socle.

## 5. Règles

- Pagination dès qu'une liste peut dépasser 50 lignes (`take` / `skip`).
- Suppression toujours derrière une confirmation.
- Dates affichées en français (`toLocaleDateString("fr-FR")`).
- Aucune donnée sensible dans une URL.
