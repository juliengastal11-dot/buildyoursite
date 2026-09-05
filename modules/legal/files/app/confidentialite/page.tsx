import type { Metadata } from "next";
import { lireReglages } from "@/lib/reglages";

/* ---------------------------------------------------------------------------
   Politique de confidentialité — dès qu'une donnée est collectée, même un
   simple formulaire de contact.

   Adapte les rubriques au traitement RÉEL du site. Décrire une collecte qui
   n'existe pas est aussi faux que d'en taire une.
--------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl sm:text-2xl">{titre}</h2>
      <div className="mt-3 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default async function Confidentialite() {
  const reglages = await lireReglages();
  const contact = reglages.email || "[[À CONFIRMER PAR L'UTILISATEUR : adresse e-mail de contact]]";

  return (
    <main
      data-src="app/confidentialite/page.tsx"
      className="mx-auto max-w-3xl px-6 py-20 md:py-28"
    >
      <p className="eyebrow text-accent">Vos données</p>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">
        Politique de confidentialité
      </h1>

      <Bloc titre="Responsable du traitement">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : raison sociale et adresse du responsable de traitement]]</p>
        <p>Contact : {contact}</p>
      </Bloc>

      <Bloc titre="Données collectées et finalités">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : lister ce que le site collecte réellement — par exemple nom,
          e-mail, téléphone et adresse de livraison via le formulaire de commande]]
        </p>
        <p>
          Ces données servent uniquement à traiter votre demande. Elles ne sont ni vendues
          ni cédées à des tiers à des fins commerciales.
        </p>
      </Bloc>

      <Bloc titre="Base légale">
        <p>
          Exécution du contrat pour une commande, intérêt légitime pour une demande de
          contact, consentement pour toute communication commerciale.
        </p>
      </Bloc>

      <Bloc titre="Durée de conservation">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : durée réelle — par exemple 3 ans après le dernier contact,
          10 ans pour les pièces comptables]]</p>
      </Bloc>

      <Bloc titre="Destinataires">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : lister les sous-traitants réels — hébergeur, prestataire de
          paiement, transporteur, service d&apos;envoi d&apos;e-mails]]
        </p>
      </Bloc>

      <Bloc titre="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
          de limitation, d&apos;opposition et de portabilité sur vos données. Pour
          l&apos;exercer, écrivez à {contact}.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL —{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            cnil.fr
          </a>
          .
        </p>
      </Bloc>

      <Bloc titre="Cookies">
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : décrire les traceurs réellement utilisés. Si le site n&apos;utilise
          ni mesure d&apos;audience ni publicité, l&apos;écrire — c&apos;est une information
          en soi, et il n&apos;y a alors pas de bandeau à afficher]]
        </p>
      </Bloc>
    </main>
  );
}
