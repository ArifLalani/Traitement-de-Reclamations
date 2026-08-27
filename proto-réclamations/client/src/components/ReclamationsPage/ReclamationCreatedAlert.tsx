function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.15 1.15 0 1 1 0 2.3A1.15 1.15 0 0 1 12 7Zm1.25 10h-2.5v-1.25h.75v-4.5h-.75V10h2v5.75h.5V17Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

type ReclamationCreatedAlertProps = {
  visible: boolean;
  onView: () => void;
  onClose: () => void;
};

export default function ReclamationCreatedAlert({ visible, onView, onClose }: ReclamationCreatedAlertProps) {
  return (
    <div className={`created-alert ${visible ? 'created-alert-visible' : ''}`} role="status">
      <button type="button" className="created-alert-close" aria-label="Fermer" onClick={onClose}>
        <CloseIcon />
      </button>
      <div className="created-alert-title">
        <InfoIcon />
        <span>Réclamation créée.</span>
      </div>
      <p className="created-alert-description">
        Une réclamation a été créée. Vous disposez maintenant de <strong>10 jours</strong> ouvrés pour compléter les
        informations requises du réclamant et confirmer l&apos;envoi de l&apos;accusé de réception afin que le
        dossier avance dans les délais réglementaires.
      </p>
      <div className="created-alert-actions">
        <button type="button" className="created-alert-cta" onClick={onView}>
          Voir la réclamation
        </button>
      </div>
    </div>
  );
}
