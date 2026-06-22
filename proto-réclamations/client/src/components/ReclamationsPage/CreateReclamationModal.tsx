import { useLayoutEffect, useRef, useState } from 'react';
import FieldDropdown from './FieldDropdown';
import { sources, type Reclamation } from './data';

const TEXTAREA_MIN_HEIGHT = 120;
const TEXTAREA_MAX_HEIGHT = 152;

const INTERLOCUTEURS = ['Marion HOUWI (vous)', 'Karim B.', 'Sophie L.', 'Thomas Perrin'];

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

type FormFieldProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
};

function FormField({ label, required, value, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  return (
    <div className="field-outlined">
      <div className="field-border">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required ? '*' : ''}
      </span>
    </div>
  );
}

function FormTextarea({ label, required, value, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const updateFades = () => {
    const el = textareaRef.current;
    if (!el) return;
    setFadeTop(el.scrollTop > 4);
    setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const contentHeight = el.scrollHeight;
    const nextHeight = Math.min(Math.max(contentHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = contentHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    updateFades();
  }, [value]);

  return (
    <div className="field-outlined field-outlined-textarea">
      <div
        className={`field-border field-border-textarea ${fadeTop ? 'field-fade-top' : ''} ${fadeBottom ? 'field-fade-bottom' : ''}`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onScroll={updateFades}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required ? '*' : ''}
      </span>
    </div>
  );
}

type CreateReclamationModalProps = {
  reclamation: Reclamation;
  onClose: () => void;
  onSubmit: () => void;
};

const CLOSE_ANIMATION_DURATION = 200;

export default function CreateReclamationModal({ reclamation, onClose, onSubmit }: CreateReclamationModalProps) {
  const [requerant, setRequerant] = useState(reclamation.author || 'Requérant inconnu');
  const [canal, setCanal] = useState<string>(reclamation.source);
  const [dateReception, setDateReception] = useState(formatDateFR(reclamation.date));
  const [email, setEmail] = useState('');
  const [objet, setObjet] = useState(() => suggestObjet(reclamation.text));
  const [description, setDescription] = useState(reclamation.text);
  const [interlocuteur, setInterlocuteur] = useState(INTERLOCUTEURS[0]);
  const [closing, setClosing] = useState(false);

  const canSubmit = canal.trim().length > 0 && dateReception.trim().length > 0 && description.trim().length > 0;

  const requestClose = (action: () => void) => {
    if (closing) return;
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_DURATION);
  };

  const handleClose = () => requestClose(onClose);
  const handleSubmit = () => {
    if (!canSubmit) return;
    requestClose(onSubmit);
  };

  return (
    <div className={`modal-backdrop ${closing ? 'modal-closing' : ''}`} onClick={handleClose}>
      <div className="modal-paper" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Créer une réclamation</div>
        <div className="modal-body">
          <div className="modal-row">
            <FormField label="Nom complet du requérant" value={requerant} onChange={setRequerant} />
            <FieldDropdown label="Canal de réception" required value={canal} onChange={setCanal} options={sources} />
          </div>
          <div className="modal-row">
            <FormField
              label="Date de réception de la réclamation"
              required
              value={dateReception}
              onChange={setDateReception}
            />
            <FormField label="Email" value={email} onChange={setEmail} />
          </div>
          <FormField label="Objet de la réclamation" value={objet} onChange={setObjet} />
          <FormTextarea label="Description" required value={description} onChange={setDescription} />
          <FieldDropdown label="Interlocuteur en charge" value={interlocuteur} onChange={setInterlocuteur} options={INTERLOCUTEURS} />
        </div>
        <div className="modal-actions">
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
