import { useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import { ReadOnlyField } from './FormFields';
import type { Reclamation } from './data';

function formatDateFR(dateLabel: string) {
  const match = dateLabel.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (match) return match[1];
  return new Date().toLocaleDateString('fr-FR');
}

const OBJET_KEYWORDS: [RegExp, string][] = [
  [/remboursement/i, 'Retard de remboursement'],
  [/résiliat/i, 'Demande de résiliation de contrat'],
  [/sinistre/i, 'Suivi de dossier sinistre'],
  [/facturation|facture/i, 'Erreur de facturation'],
  [/délai/i, 'Délai de traitement excessif'],
  [/devis/i, 'Litige sur un devis'],
  [/réponse|répond|contact|appel/i, 'Absence de réponse du service client'],
];

function suggestObjet(text: string): string {
  const match = OBJET_KEYWORDS.find(([regex]) => regex.test(text));
  if (match) return match[1];
  const firstSentence = text.split(/[.!?]/)[0].trim();
  return firstSentence.length > 60 ? `${firstSentence.slice(0, 60)}…` : firstSentence;
}

export type ReclamationFormData = {
  prenom: string;
  nom: string;
  canal: string;
  dateReception: string;
  email: string;
  telephone: string;
  denominationSociale: string;
  porteurDuRisque: string;
  objet: string;
  notesInternes: string;
  description: string;
};

type CreateReclamationSliderProps = {
  reclamation: Reclamation;
  onClose: () => void;
  onSubmit: (data: ReclamationFormData) => void;
  onDismiss: () => void;
  onViewComplaint: () => void;
};

const CLOSE_ANIMATION_DURATION = 200;

export default function CreateReclamationSlider({
  reclamation,
  onClose,
  onSubmit,
  onDismiss,
  onViewComplaint,
}: CreateReclamationSliderProps) {
  const isFlagged = reclamation.state === 'possible';
  const isMesReclamations = reclamation.state === 'mes-reclamations';
  const [prenom] = useState(() => (reclamation.author || '').split(' ')[0] ?? '');
  const [nom] = useState(() => (reclamation.author || '').split(' ').slice(1).join(' '));
  const canal = reclamation.source;
  const dateReception = formatDateFR(reclamation.date);
  const [objet] = useState(() => suggestObjet(reclamation.text));
  const [closing, setClosing] = useState(false);

  const canSubmit = canal.trim().length > 0 && dateReception.trim().length > 0 && objet.trim().length > 0;

  const requestClose = (action: () => void) => {
    if (closing) return;
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_DURATION);
  };

  const handleClose = () => requestClose(onClose);
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      prenom,
      nom,
      canal,
      dateReception,
      email: '',
      telephone: '',
      denominationSociale: '',
      porteurDuRisque: '',
      objet,
      notesInternes: '',
      description: reclamation.text,
    });
  };

  return (
    <div className={`drawer-backdrop ${closing ? 'drawer-closing' : ''}`} onClick={handleClose}>
      <div className="drawer-panel create-claim-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-appbar">
          <span className="drawer-title">Créer une réclamation</span>
          <button type="button" className="drawer-close-button" aria-label="Fermer" onClick={handleClose}>
            <img src={drawerClose} alt="" width={14} height={14} />
          </button>
        </div>

        <div className="create-claim-body">
          <span className="create-claim-heading">Informations de la réclamation</span>
          <div className="create-claim-section">
            <div className="modal-row">
              <ReadOnlyField label="Date de réception (mention)">
                <span className="drawer-text">{dateReception}</span>
              </ReadOnlyField>
              <ReadOnlyField label="Canal de réception">
                <span className="drawer-text">{canal}</span>
              </ReadOnlyField>
            </div>
            <ReadOnlyField label="Contenu original de la mention">
              <span className="drawer-text">{reclamation.text}</span>
            </ReadOnlyField>
          </div>
        </div>

        <div className="modal-actions create-claim-actions">
          {isMesReclamations ? (
            <button type="button" className="btn-filled" onClick={onViewComplaint}>
              Voir la réclamation
            </button>
          ) : (
            <>
              {isFlagged && (
                <button type="button" className="btn-text" onClick={onDismiss}>
                  Écarter
                </button>
              )}
              <button type="button" className="btn-filled" disabled={!canSubmit} onClick={handleSubmit}>
                Traiter cette réclamation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
