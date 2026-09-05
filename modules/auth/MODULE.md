# Module `auth` — Auth.js v5 + Prisma + identifiants

Authentification e-mail / mot de passe, sans service externe, sans compte à créer.
À greffer quand le blueprint prévoit des comptes utilisateurs.

## 1. Dépendances

```bash
npm i next-auth@beta @auth/prisma-adapter bcryptjs
npm i -D @types/bcryptjs
```

## 2. Variable d'environnement

Ajouter à `.env` (et à `.env.example` sans la valeur) :

```
AUTH_SECRET="<openssl rand -base64 32, ou npx auth secret>"
```

## 3. Schéma Prisma

Fusionner dans `prisma/schema.prisma` — **ne pas écraser les modèles du projet** :

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  image         String?
  role          String    @default("user")
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

Puis `npx prisma db push` et `npx prisma generate`.

## 4. Fichiers

Copier `files/` à la racine du projet en conservant l'arborescence :

| Fichier | Rôle |
|---|---|
| `auth.config.ts` | Config sans adaptateur — utilisable par le middleware (edge) |
| `auth.ts` | Instance complète, adaptateur Prisma, provider identifiants |
| `middleware.ts` | Protège les routes privées |
| `app/api/auth/[...nextauth]/route.ts` | Handlers |
| `lib/actions/auth-actions.ts` | Server action de connexion |
| `app/connexion/page.tsx` | Page de connexion — **Server Component** |
| `app/connexion/formulaire.tsx` | Le formulaire — composant client |

### Pourquoi la connexion est coupée en deux

La page doit lire `?suite=` pour renvoyer l'utilisateur là où il allait. En Next.js 15,
`searchParams` est une **promesse** côté serveur, et `useSearchParams` côté client exige une
frontière `Suspense` — sans quoi le build échoue. La page lit donc le paramètre côté serveur
et le passe en prop au formulaire client, qui le renvoie dans un champ caché.

Le paramètre est filtré : seul un chemin interne est accepté (`/…` mais pas `//…`), sinon
c'est une redirection ouverte.

### Pas d'inscription publique

Le module ne fournit **volontairement pas** de page d'inscription. Sur un site client, un
seul compte doit exister : celui du propriétaire, créé par le seed. Une inscription ouverte
n'apporte rien et ajoute une surface d'attaque. Si un projet a réellement besoin de comptes
utilisateurs en libre accès, écris cette page explicitement pour ce projet.

## 5. Routes protégées

Dans `middleware.ts`, ajuster `PROTECTED` selon le blueprint (par défaut `/compte`, `/admin`).

## 6. Seed

Ajouter un compte de test dans `prisma/seed.ts` :

```ts
import bcrypt from "bcryptjs";
await db.user.upsert({
  where: { email: "test@test.fr" },
  update: {},
  create: {
    email: "test@test.fr",
    name: "Compte de test",
    passwordHash: await bcrypt.hash("test1234", 10),
    role: "admin",
  },
});
```

Signaler ces identifiants à l'utilisateur en fin de bootstrap.
