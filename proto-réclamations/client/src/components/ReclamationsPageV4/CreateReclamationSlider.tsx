import { useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import { FormField, FormTextarea, ReadOnlyField } from './FormFields';
import type { DossierStep } from './complaintsData';
import type { Reclamation } from './data';

// Preview of the dossier's lifecycle before it exists. Unlike an already
// created complaint (where getDossierSteps treats "Réception" and
// "Création" as implicit past facts), this slider IS the "Création" step —
// it isn't done until the form is submitted, so only "Réception" is done
// and everything from "Création" onward is still ahead.
const DOSSIER_PREVIEW_STEPS: DossierStep[] = [
  { label: 'Réception de la mention', status: 'done', badgeLabel: 'Complété' },
  { label: 'Création de la réclamation', status: 'current' },
  { label: "Confirmation de l'envoi de l'Accusé de Réception", status: 'upcoming' },
  { label: 'Confirmation de l’envoi de la Réponse Définitive', status: 'upcoming' },
  { label: 'Clôture du dossier de réclamation', status: 'upcoming' },
];

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

const DOSSIER_STEP_SHORT_LABELS = [
  'Réception',
  'Création',
  'Accusé de réception',
  'Réponse définitive',
  'Clôture',
];

// The 5 dots are the flex items (fixed 24px each) that `justify-content:
// space-between` actually spaces — so spacing is decided purely by the
// dots, evenly, and doesn't shift with label width. The container's own
// left/right padding is set (in CSS) to exactly offset the first/last
// dot's centering so that the LABEL's outer edge — not the dot — is what
// lands on the panel's margin: dot0 is pushed right by the padding by
// just enough that "Réception" (wider than the dot) ends up flush left,
// and dot4 is pulled in by just enough that "Clôture" ends up flush
// right. Every other label centers under its own dot as usual.
function DossierHStepper({ steps }: { steps: DossierStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  // Capped so a fully-done stepper (all steps "done", no "current" left)
  // lands at exactly 100% instead of overshooting past the last dot.
  const fillFraction = Math.min(completedCount, steps.length - 1) / (steps.length - 1);

  return (
    <div className="dossier-hstepper">
      <span className="dossier-hstepper-line" />
      <span
        className="dossier-hstepper-line-fill"
        style={{ width: `calc(${fillFraction} * (100% - 51.15px))` }}
      />
      {steps.map((step, index) => (
        <div key={step.label} className={`dossier-hstep dossier-hstep-${step.status}`}>
          <span className="dossier-hstep-dot" aria-hidden>
            {step.status === 'done' ? '✓' : index + 1}
          </span>
          <span className="dossier-hstep-label" title={step.label}>
            {DOSSIER_STEP_SHORT_LABELS[index]}
          </span>
          {step.status === 'current' && step.badgeLabel && (
            <span className={`dossier-hstep-badge ${step.badgeWarning ? 'dossier-hstep-badge-warning' : ''}`}>
              {step.badgeLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

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

  const dossierSteps = DOSSIER_PREVIEW_STEPS;

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
          <DossierHStepper steps={dossierSteps} />

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
