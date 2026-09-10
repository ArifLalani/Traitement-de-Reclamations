import { useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import { FormField, FormTextarea, ReadOnlyField } from './FormFields';
import { getDossierSteps } from './complaintsData';
import type { Reclamation } from './data';

function ChartLineUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 20h18M4 16l5-5 4 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Preview of the dossier's lifecycle before it exists: creating the
// complaint is what will trigger it, so it always starts "à traiter" with
// no Accusé de Réception sent yet.
const DOSSIER_PREVIEW_STATE = {
  avancement: 'a-traiter' as const,
  echeanceLabel: '2 jours restants',
  echeanceWarning: false,
  suiviCloture: {
    dateAR: '',
    dateReponse: '',
    actionImmediate: '',
    actionCorrective: '',
    actionRealisee: '',
    verificationEfficacite: '',
    reponseApportee: '',
  },
};

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
  adresse: string;
  objet: string;
  notesInternes: string;
  description: string;
};

type CreateReclamationSliderProps = {
  reclamation: Reclamation;
  onClose: () => void;
  onSubmit: (data: ReclamationFormData) => void;
};

const CLOSE_ANIMATION_DURATION = 200;

export default function CreateReclamationSlider({ reclamation, onClose, onSubmit }: CreateReclamationSliderProps) {
  const [prenom, setPrenom] = useState(() => (reclamation.author || '').split(' ')[0] ?? '');
  const [nom, setNom] = useState(() => (reclamation.author || '').split(' ').slice(1).join(' '));
  const canal = reclamation.source;
  const dateReception = formatDateFR(reclamation.date);
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [objet, setObjet] = useState(() => suggestObjet(reclamation.text));
  const [notesInternes, setNotesInternes] = useState('');
  const [closing, setClosing] = useState(false);

  const canSubmit = canal.trim().length > 0 && dateReception.trim().length > 0 && objet.trim().length > 0;

  const dossierSteps = getDossierSteps(DOSSIER_PREVIEW_STATE);
  const dossierCompletedCount = dossierSteps.filter((s) => s.status === 'done').length;

  const requestClose = (action: () => void) => {
    if (closing) return;
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_DURATION);
  };

  const handleClose = () => requestClose(onClose);
  const handleSubmit = () => {
    if (!canSubmit) return;
    requestClose(() =>
      onSubmit({
        prenom,
        nom,
        canal,
        dateReception,
        email,
        telephone,
        adresse,
        objet,
        notesInternes,
        description: reclamation.text,
      }),
    );
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
          <div className="dossier-section dossier-section-open">
            <div className="dossier-section-header">
              <span className="dossier-section-icon">
                <ChartLineUpIcon />
              </span>
              <span className="dossier-section-title">Avancement du dossier</span>
              <span className="dossier-section-meta">
                {dossierCompletedCount}/{dossierSteps.length} étapes complétées
              </span>
            </div>
            <div className="dossier-section-collapse">
              <div className="dossier-section-collapse-inner">
                <div className="dossier-section-body">
                  <div className="dossier-progress-bar">
                    <div
                      className="dossier-progress-fill"
                      style={{ width: `${(dossierCompletedCount / dossierSteps.length) * 100}%` }}
                    />
                  </div>
                  <div className="dossier-steps">
                    {dossierSteps.map((step) => (
                      <div key={step.label} className={`dossier-step dossier-step-${step.status}`}>
                        <span className="dossier-step-icon" aria-hidden>
                          {step.status === 'done' ? '●' : step.status === 'current' ? '◉' : '○'}
                        </span>
                        <span className="dossier-step-label">{step.label}</span>
                        {step.badgeLabel && (
                          <span
                            className={`chip ${
                              step.status === 'done'
                                ? 'chip-mes-reclamations'
                                : step.badgeWarning
                                  ? 'chip-declinee'
                                  : 'chip-possible'
                            }`}
                          >
                            {step.badgeLabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <span className="create-claim-heading">Statut du dossier</span>
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

          <span className="create-claim-heading">Informations Client</span>
          <div className="create-claim-section">
            <FormField label="Prénom" value={prenom} onChange={setPrenom} />
            <FormField label="Nom" value={nom} onChange={setNom} />
            <div className="modal-row">
              <FormField label="Email" value={email} onChange={setEmail} />
              <FormField label="Téléphone" value={telephone} onChange={setTelephone} />
            </div>
            <FormField label="Adresse" value={adresse} onChange={setAdresse} />
            <FormField label="Objet de la réclamation" required value={objet} onChange={setObjet} />
            <FormTextarea label="Notes internes" value={notesInternes} onChange={setNotesInternes} />
          </div>
        </div>

        <div className="modal-actions create-claim-actions">
          <button type="button" className="btn-text" onClick={handleClose}>
            Annuler
          </button>
          <button type="button" className="btn-filled" disabled={!canSubmit} onClick={handleSubmit}>
            Créer la réclamation
          </button>
        </div>
      </div>
    </div>
  );
}
