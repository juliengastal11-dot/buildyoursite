import type { Metadata } from "next";
import { lireReglages } from "@/lib/reglages";

/* ---------------------------------------------------------------------------
   Conditions générales de vente — obligatoires pour toute vente en ligne à des
   particuliers.

   Les rubriques ci-dessous sont le minimum : prix, livraison, paiement,
   rétractation de 14 jours avec formulaire type, garanties légales, médiateur
   de la consommation.

   Les montants (frais de port, seuil de gratuité) sont lus dans les RÉGLAGES,
   pas écrits en dur : si le gérant change son tarif, les CGV suivent. Des CGV
   qui contredisent le tunnel de commande sont pires que pas de CGV.
--------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  robots: { index: false },
};

function Article({
  numero,
  titre,
  children,
}: {
  numero: number;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl sm:text-2xl">
        <span className="font-mono text-sm text-accent">Art. {numero}</span> — {titre}
      </h2>
      <div className="mt-3 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default async function CGV() {
  const reglages = await lireReglages();
  const contact = reglages.email || "[[À CONFIRMER PAR L'UTILISATEUR : adresse e-mail]]";

  return (
    <main data-src="app/cgv/page.tsx" className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <p className="eyebrow text-accent">Vente en ligne</p>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">
        Conditions générales de vente
      </h1>
      <p className="mt-4 text-muted-foreground">
        En vigueur au [[À CONFIRMER PAR L'UTILISATEUR : date de mise à jour]].
      </p>

      <Article numero={1} titre="Objet et vendeur">
        <p>
          Les présentes conditions régissent les ventes conclues sur ce site entre
          [[À CONFIRMER PAR L'UTILISATEUR : raison sociale, SIRET, adresse]] et tout acheteur non
          professionnel.
        </p>
      </Article>

      <Article numero={2} titre="Produits et prix">
        <p>
          Les produits sont décrits avec la plus grande exactitude possible. Les prix sont
          indiqués en euros, toutes taxes comprises, hors frais de livraison. Ils peuvent
          être modifiés à tout moment ; le prix applicable est celui affiché au moment de la
          commande.
        </p>
      </Article>

      <Article numero={3} titre="Commande">
        <p>
          La commande est ferme à la validation du paiement. Un récapitulatif détaillé est
          présenté avant la confirmation définitive, et l&apos;acheteur peut corriger son
          panier jusqu&apos;à cette étape.
        </p>
      </Article>

      <Article numero={4} titre="Paiement">
        <p>
          Le paiement s&apos;effectue en ligne, par carte bancaire, via un prestataire
          sécurisé. Aucune donnée de carte n&apos;est conservée par le vendeur.
        </p>
      </Article>

      <Article numero={5} titre="Livraison">
        <p>[[À CONFIRMER PAR L'UTILISATEUR : zone de livraison et délai d&apos;expédition]]</p>
        <p>
          Les frais de livraison sont indiqués avant la validation de la commande et
          rappelés dans le récapitulatif.
        </p>
        <p>
          En cas de retard, l&apos;acheteur peut annuler sa commande et être remboursé dans
          les conditions prévues par le code de la consommation.
        </p>
      </Article>

      <Article numero={6} titre="Droit de rétractation">
        <p>
          L&apos;acheteur dispose de <strong>quatorze jours</strong> à compter de la
          réception pour exercer son droit de rétractation, sans avoir à se justifier. Les
          frais de retour sont à sa charge, sauf produit non conforme.
        </p>
        <p>
          Pour l&apos;exercer, il suffit d&apos;écrire à {contact} avant l&apos;expiration
          du délai. Le remboursement intervient dans les quatorze jours suivant la
          récupération du produit.
        </p>
        <p className="rounded-card border border-border bg-card p-4 text-sm">
          <strong>Formulaire type de rétractation</strong> — à recopier :<br />
          « Je vous notifie par la présente ma rétractation du contrat portant sur la vente
          du bien ci-dessous : [désignation], commandé le [date], reçu le [date].
          Nom, adresse, date, signature. »
        </p>
        <p>
          [[À CONFIRMER PAR L'UTILISATEUR : préciser les éventuelles exceptions légales — denrées périssables,
          produits personnalisés, produits descellés]]
        </p>
      </Article>

      <Article numero={7} titre="Garanties légales">
        <p>
          Tous les produits bénéficient de la garantie légale de conformité et de la
          garantie contre les vices cachés, permettant le remplacement ou le remboursement
          d&apos;un produit défectueux.
        </p>
      </Article>

      <Article numero={8} titre="Médiation de la consommation">
        <p>
          En cas de litige non résolu à l&apos;amiable, l&apos;acheteur peut saisir
          gratuitement un médiateur de la consommation :
        </p>
        <p>[[À CONFIRMER PAR L'UTILISATEUR : nom, adresse et site du médiateur souscrit]]</p>
        <p>
          Une plateforme européenne de règlement en ligne est également disponible —{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Article>

      <Article numero={9} titre="Données personnelles">
        <p>
          Le traitement des données est décrit dans notre{" "}
          <a href="/confidentialite" className="text-accent hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </Article>

      <Article numero={10} titre="Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. À défaut de résolution
          amiable, les tribunaux français sont compétents.
        </p>
      </Article>
    </main>
  );
}
