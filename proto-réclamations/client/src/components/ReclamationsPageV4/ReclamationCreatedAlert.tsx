import { useEffect, useRef } from 'react';

const AUTO_DISMISS_MS = 8000;

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 12.5 10.3 15.3 16.5 9" strokeLinecap="round" strokeLinejoin="round" />
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
  sidebarOpen?: boolean;
};

export default function ReclamationCreatedAlert({ visible, onView, onClose, sidebarOpen }: ReclamationCreatedAlertProps) {
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = () => {
    if (dismissTimeout.current) {
      clearTimeout(dismissTimeout.current);
      dismissTimeout.current = null;
    }
  };

  const startDismissTimer = () => {
    clearDismissTimer();
    dismissTimeout.current = setTimeout(onClose, AUTO_DISMISS_MS);
  };

  // The 8s auto-dismiss restarts fresh (not "resume") whenever the pointer
  // leaves the alert — hovering just holds it open, it doesn't bank time.
  useEffect(() => {
    if (visible) {
      startDismissTimer();
    } else {
      clearDismissTimer();
    }
    return clearDismissTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <div
      className={`created-alert ${visible ? 'created-alert-visible' : ''} ${sidebarOpen ? 'created-alert-shifted' : ''}`}
      role="status"
      onMouseEnter={clearDismissTimer}
      onMouseLeave={() => {
        if (visible) startDismissTimer();
      }}
    >
      <button type="button" className="created-alert-close" aria-label="Fermer" onClick={onClose}>
        <CloseIcon />
      </button>
      <div className="created-alert-title">
        <SuccessIcon />
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
