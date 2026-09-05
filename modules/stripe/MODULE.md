# Module `stripe` — paiement

À greffer quand le blueprint prévoit une vente. Mode Checkout hébergé : Stripe gère la page
de paiement, on ne touche jamais aux données de carte.

## 1. Dépendances

```bash
npm i stripe @stripe/stripe-js
```

## 2. Variables d'environnement

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_URL="http://localhost:3000"
```

**Ne jamais inventer de clés.** Mettre des valeurs vides dans `.env`, écrire les noms dans
`.env.example`, et signaler à l'utilisateur en fin de bootstrap qu'il doit les remplir
depuis son tableau de bord Stripe. Le site doit démarrer sans elles : sur clé absente, la
page de paiement affiche un message clair au lieu de planter.

## 3. Schéma Prisma

```prisma
model Produit {
  id          String   @id @default(cuid())
  slug        String   @unique
  nom         String
  description String
  prixCents   Int
  devise      String   @default("eur")
  image       String?
  actif       Boolean  @default(true)
  lignes      Ligne[]
}

model Commande {
  id              String   @id @default(cuid())
  stripeSessionId String?  @unique
  email           String?
  totalCents      Int
  statut          String   @default("en_attente") // en_attente | payee | annulee
  lignes          Ligne[]
  createdAt       DateTime @default(now())
}

model Ligne {
  id         String   @id @default(cuid())
  commandeId String
  produitId  String
  quantite   Int      @default(1)
  prixCents  Int
  commande   Commande @relation(fields: [commandeId], references: [id], onDelete: Cascade)
  produit    Produit  @relation(fields: [produitId], references: [id])
}
```

## 4. Client Stripe — `lib/stripe.ts`

```ts
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;
export const stripeActif = Boolean(key);
```

## 5. Création de session — `lib/actions/paiement.ts`

Server action qui : lit le panier, **recalcule les prix depuis la base** (jamais depuis le
client), crée la `Commande` en `en_attente`, ouvre une session Checkout avec
`success_url` et `cancel_url`, et renvoie l'URL de redirection.

## 6. Webhook — `app/api/stripe/webhook/route.ts`

```ts
export const runtime = "nodejs";
```

Lire le corps **brut** (`await req.text()`), vérifier la signature avec
`stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)`, puis sur
`checkout.session.completed` passer la commande à `payee`.

La vérification de signature n'est pas optionnelle : sans elle, n'importe qui peut marquer
une commande payée.

En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## 7. Règles

- Prix en **centimes entiers**, jamais en flottant.
- Le statut d'une commande ne change que par le webhook, jamais depuis la page de retour.
- La page `success_url` affiche l'état réel en base, pas une confirmation optimiste.
