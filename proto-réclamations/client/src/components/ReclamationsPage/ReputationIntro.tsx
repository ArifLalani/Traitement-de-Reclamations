import illustration from '../../assets/figma/reputation-intro-illustration.png';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

type ReputationIntroProps = {
  onDismiss: () => void;
  onSelectMentions: () => void;
  onSelectReclamations: () => void;
};

export default function ReputationIntro({
  onDismiss,
  onSelectMentions,
  onSelectReclamations,
}: ReputationIntroProps) {
  return (
    <div className="reputation-intro">
      <div className="reputation-intro-header">
        <h1 className="reputation-intro-title">Ma réputation en ligne</h1>
        <button type="button" className="icon-button" aria-label="Fermer" onClick={onDismiss}>
          <CloseIcon />
        </button>
      </div>

      <div className="reputation-intro-body">
        <div className="reputation-intro-text">
          <p>
            Ici, vous pouvez consulter l&apos;ensemble de toutes vos mentions en ligne et identifier facilement celles
            qui nécessitent une attention particulière.
          </p>
          <p>
            Analysez les réclamations, traitez-les efficacement et assurez un suivi structuré afin d&apos;apporter des
            solutions adaptées à vos clients.
          </p>
          <p>
            Une gestion proactive de vos réclamations contribue à améliorer la satisfaction client et à renforcer
            votre réputation en ligne.
          </p>
        </div>
        <img src={illustration} alt="" className="reputation-intro-illustration" />
      </div>

      <div className="reputation-intro-cards">
        <button type="button" className="reputation-intro-card" onClick={onSelectMentions}>
          <span className="reputation-intro-card-title">Mes Mentions</span>
          <span className="reputation-intro-card-text">
            Retrouvez ici toutes les mentions de votre entreprise détectées sur les réseaux sociaux et plateformes
            d&apos;avis, et identifiez rapidement celles à traiter en priorité.
          </span>
        </button>
        <button type="button" className="reputation-intro-card" onClick={onSelectReclamations}>
          <span className="reputation-intro-card-title">Mes Réclamations</span>
          <span className="reputation-intro-card-text">
            Suivez l&apos;avancement de vos réclamations, complétez les informations nécessaires et confirmez chaque
            étape pour garantir un traitement rapide et conforme.
          </span>
        </button>
      </div>
    </div>
  );
}
