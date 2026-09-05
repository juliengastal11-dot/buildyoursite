import Link from "next/link";
import { FormulaireConnexion } from "./formulaire";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;

  // On n'accepte qu'un chemin interne : une URL absolue serait une redirection ouverte.
  const destination = suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/admin";

  return (
    <main className="min-h-dvh grid place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="eyebrow text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          ← Retour au site
        </Link>

        <Card className="mt-4">
          <CardHeader>
            <p className="eyebrow text-accent">ESPACE PRIVE</p>
            <CardTitle className="font-display">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <FormulaireConnexion suite={destination} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
