import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import AlertSnackbar from './AlertSnackbar';
import ArrowUpRight from './ArrowUpRight';
import {
  getContactTag,
  STATUT_CLIENT_DESCRIPTION,
  STATUT_CLIENT_LABEL,
  type HistoriqueEntry,
  type StatutClient,
} from './complaintsData';
import type { Reclamation, ReclamationState } from './data';
import { FormField, FormSelect, FormTextareaAutoGrow } from './FormFields';
import HoverTooltip from './HoverTooltip';
import SentimentIcon from './SentimentIcon';
import SourceIcon from './SourceIcon';

// Same key-step flag as ComplaintDetailDrawer's FlagIcon, reused here for
// the mention slider's own Historique tab.
function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 17V3.5c0-.3.2-.5.5-.5H15l-2.5 4L15 11H4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
      <path d="M3 10.5V3.7A1.2 1.2 0 0 1 4.2 2.5h6.8" strokeLinecap="round" />
    </svg>
  );
}

// Same warning glyph as ComplaintDetailDrawer's AlertTriangleIcon, reused
// here for the mention slider's own "en attente" alert.
function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor">
      <path d="M8.0002 1.49937C8.26329 1.4994 8.52162 1.56954 8.74922 1.70151C8.9765 1.83331 9.1654 2.02244 9.29609 2.25034V2.25132L14.7951 11.7503C14.9265 11.9779 14.996 12.2357 14.9963 12.4984C14.9965 12.7611 14.928 13.0196 14.7971 13.2474C14.6661 13.4752 14.4774 13.6652 14.2502 13.7972C14.023 13.9292 13.7649 13.9994 13.5021 14.0003H2.49824C2.23544 13.9994 1.97745 13.9292 1.7502 13.7972C1.5229 13.6652 1.33435 13.4753 1.20332 13.2474C1.07236 13.0196 1.00289 12.7612 1.00313 12.4984C1.00341 12.2358 1.07304 11.9778 1.2043 11.7503L6.70332 2.25132L6.7043 2.25034C6.83491 2.02265 7.02315 1.83327 7.2502 1.70151C7.47786 1.56949 7.73702 1.49937 8.0002 1.49937ZM8.0002 2.49937C7.91321 2.49937 7.8274 2.52311 7.75215 2.56675C7.67701 2.61038 7.61464 2.67297 7.57148 2.74839L7.13789 2.50034L7.57051 2.75034L2.07051 12.2503C2.0269 12.3261 2.00324 12.412 2.00313 12.4994C2.00305 12.587 2.02683 12.6734 2.07051 12.7494C2.11411 12.8251 2.17663 12.888 2.25215 12.932C2.32772 12.9759 2.41379 12.9999 2.50117 13.0003H13.4992C13.5865 12.9999 13.6718 12.9758 13.7473 12.932C13.823 12.888 13.8862 12.8253 13.9299 12.7494C13.9736 12.6734 13.9964 12.587 13.9963 12.4994C13.9962 12.412 13.9735 12.3261 13.9299 12.2503L8.42891 2.74839C8.3857 2.67289 8.32252 2.61039 8.24727 2.56675C8.17211 2.52322 8.08704 2.4994 8.0002 2.49937ZM8.0002 10.5003C8.41432 10.5004 8.7502 10.8362 8.7502 11.2503C8.75001 11.6643 8.41421 12.0002 8.0002 12.0003C7.5861 12.0003 7.25038 11.6644 7.2502 11.2503C7.2502 10.8361 7.58598 10.5003 8.0002 10.5003ZM8.0002 6.00034C8.27625 6.00045 8.5002 6.22426 8.5002 6.50034V9.00034C8.50001 9.27626 8.27613 9.50024 8.0002 9.50034C7.72417 9.50034 7.50038 9.27633 7.5002 9.00034V6.50034C7.5002 6.2242 7.72405 6.00034 8.0002 6.00034Z" />
    </svg>
  );
}

function addDaysToFrDate(value: string, days: number): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('fr-FR');
}

// Placeholder wording pending the real template the client will provide —
// covers the essentials (why we're writing, what we need, how to reply).
// Points to an email rather than a reply on the platform itself, since the
// mention (and any reply to it) can be publicly visible — personal contact
// details shouldn't be exchanged there.
const DEMANDE_CONTACT_TEMPLATE_BODY = `Bonjour,

Nous avons bien pris en compte votre message concernant votre dossier. Afin de pouvoir l'examiner et vous répondre, nous avons besoin de vos coordonnées complètes (nom, prénom, email et/ou numéro de téléphone).

Pour des raisons de confidentialité, merci de ne pas les transmettre en réponse à ce message public, mais de nous les envoyer directement à l'adresse suivante : contact@votre-entreprise.fr

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
Le service client`;

// The mention's own link is appended at the bottom (shown smaller, kept
// separate from the main body) so whoever sends this can jump straight back
// to it instead of having to search for it again.
function buildDemandeContactTemplate(mentionUrl: string): string {
  return `${DEMANDE_CONTACT_TEMPLATE_BODY}\n\nLien de la mention : ${toHref(mentionUrl)}`;
}

// Sent when the first demande went unanswered — same ask, framed as a
// follow-up rather than a first contact.
const RELANCE_TEMPLATE_BODY = `Bonjour,

Nous n'avons pas encore reçu de réponse à notre précédent message concernant votre dossier. Afin de pouvoir l'examiner et vous répondre, nous avons besoin de vos coordonnées complètes (nom, prénom, email et/ou numéro de téléphone).

Pour des raisons de confidentialité, merci de ne pas les transmettre en réponse à ce message public, mais de nous les envoyer directement à l'adresse suivante : contact@votre-entreprise.fr

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
Le service client`;

function buildRelanceTemplate(mentionUrl: string): string {
  return `${RELANCE_TEMPLATE_BODY}\n\nLien de la mention : ${toHref(mentionUrl)}`;
}

const STATE_BADGE: Partial<Record<ReclamationState, { label: string; className: string }>> = {
  possible: { label: 'Réclamation potentielle', className: 'chip-possible' },
  declinee: { label: 'Écartée', className: 'chip-declinee' },
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
  'en-attente': { label: 'En attente', className: 'chip-en-attente' },
  cloturee: { label: 'Clôturée', className: 'chip-cloturee' },
};

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

type MentionTabKey = 'informations' | 'historique';

const MENTION_TABS: { id: MentionTabKey; label: string }[] = [
  { id: 'informations', label: 'Informations' },
  { id: 'historique', label: 'Historique' },
];

// Same sliding-pill segmented control pattern as ComplaintDetailDrawer's
// DossierTabsControl, reused here for the mention slider's tab navigation.
function MentionTabsControl({ value, onChange }: { value: MentionTabKey; onChange: (tab: MentionTabKey) => void }) {
  const index = Math.max(0, MENTION_TABS.findIndex((tab) => tab.id === value));
  const style = { '--segment-count': MENTION_TABS.length } as CSSProperties;

  return (
    <div className="dossier-tabs-segmented" style={style}>
      <div
        className="dossier-tabs-segment-indicator"
        style={{ transform: `translateX(calc(${index} * (100% + 4px)))` }}
      />
      {MENTION_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`dossier-tabs-segment ${value === tab.id ? 'dossier-tabs-segment-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Same Oui/Non toggle as ComplaintDetailDrawer's ChoiceToggle, reused here
// for the mention slider's own guiding questions.
function ChoiceToggle({
  value,
  onChange,
  error,
}: {
  value: 'oui' | 'non' | null;
  onChange: (value: 'oui' | 'non') => void;
  error?: boolean;
}) {
  return (
    <div className={`dossier-choice-row ${error ? 'dossier-choice-row-error' : ''}`}>
      <button
        type="button"
        className={`dossier-toggle-btn ${value === 'oui' ? 'dossier-toggle-btn-active' : ''}`}
        onClick={() => onChange('oui')}
      >
        Oui
      </button>
      <button
        type="button"
        className={`dossier-toggle-btn ${value === 'non' ? 'dossier-toggle-btn-active' : ''}`}
        onClick={() => onChange('non')}
      >
        Non
      </button>
    </div>
  );
}

// A history entry's "changes" value, clamped to 4 lines with a "Voir plus" /
// "Voir moins" toggle once it actually overflows — e.g. the mention author's
// full retranscribed response, which can run much longer than the other
// change rows (contact fields, statut du client...) ever do.
function ExpandableHistoryValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [value, expanded]);

  return (
    <span className="dossier-history-change-value-wrap">
      <span
        ref={valueRef}
        className={`dossier-history-change-value ${!expanded ? 'dossier-history-change-value-clamped' : ''}`}
      >
        {value}
      </span>
      {(overflowing || expanded) && (
        <button type="button" className="dossier-history-change-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </span>
  );
}

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

// Shape of the reclamant fields, saveable on their own via the "Enregistrer"
// action — without going through onSubmit, which also creates the
// réclamation itself.
export type ReclamantDraftData = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  denominationSociale: string;
  porteurDuRisque: string;
  rattacheContrat: 'oui' | 'non' | null;
  statutClient: StatutClient | '';
};

export type ReclamationFormData = {
  prenom: string;
  nom: string;
  canal: string;
  dateReception: string;
  email: string;
  telephone: string;
  denominationSociale: string;
  porteurDuRisque: string;
  rattacheContrat: 'oui' | 'non' | '';
  statutClient: StatutClient | '';
  objet: string;
  notesInternes: string;
  description: string;
};

type CreateReclamationSliderProps = {
  reclamation: Reclamation;
  onClose: () => void;
  // Carries along everything that happened to the mention so far (réception,
  // demande de contact, clôture...) so the new réclamation's own historique
  // continues the same trail instead of starting blank.
  onSubmit: (data: ReclamationFormData, mentionHistorique: HistoriqueEntry[]) => void;
  onDismiss: () => void;
  onViewComplaint: () => void;
  // Called instead of onSubmit when the answer is "Non" — the mention isn't
  // turned into a réclamation yet, it's just flagged "en attente" until its
  // author replies with their contact details.
  onConfirmEnAttente: (demandeContactDate: string) => void;
  onClotureMention: () => void;
  // Once a réclamation exists for this mention, its Historique tab shows
  // that dossier's actual historique instead of reconstructing its own —
  // one shared trail, whichever slider it's viewed from.
  linkedComplaintHistorique?: HistoriqueEntry[];
  // Lets the reclamant fields be saved on their own (e.g. partially filled
  // in, to finish later) without creating a réclamation — persisted by the
  // parent and restored here when the slider reopens.
  savedReclamantDraft?: ReclamantDraftData;
  onSaveReclamantDraft: (draft: ReclamantDraftData) => void;
};

const CLOSE_ANIMATION_DURATION = 200;

type YesNo = 'oui' | 'non' | null;
type StepPhase = 'question' | 'envoi' | 'relance-envoi' | 'waiting' | 'reclamant' | 'cloture-offer';
type Step = { node: ReactNode; phase: StepPhase };

export default function CreateReclamationSlider({
  reclamation,
  onClose,
  onSubmit,
  onDismiss,
  onViewComplaint,
  onConfirmEnAttente,
  onClotureMention,
  linkedComplaintHistorique,
  savedReclamantDraft,
  onSaveReclamantDraft,
}: CreateReclamationSliderProps) {
  const isFlagged = reclamation.state === 'possible';
  const isMesReclamations = reclamation.state === 'mes-reclamations';
  const isEnAttente = reclamation.state === 'en-attente';
  const isCloturee = reclamation.state === 'cloturee';
  const [prenom] = useState(() => (reclamation.author || '').split(' ')[0] ?? '');
  const [nom] = useState(() => (reclamation.author || '').split(' ').slice(1).join(' '));
  const canal = reclamation.source;
  const dateReception = formatDateFR(reclamation.date);
  const [objet] = useState(() => suggestObjet(reclamation.text));
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<MentionTabKey>('informations');

  // The whole treatment flow below mirrors the team's Figma flowchart node
  // by node — getTreatmentStep() walks it top to bottom and returns exactly
  // the one next thing to show, instead of stacking JSX conditions. Every
  // "Avez-vous les coordonnées...?" checkpoint reached once waiting on a
  // reply is the same question in the diagram, so they all share
  // coordonneesCheckpoint below rather than being separate fields.
  const [peutRepondreAnswer, setPeutRepondreAnswer] = useState<YesNo>(isEnAttente ? 'oui' : null);
  // Reopening an "en attente" mention pre-fills this with "Non" — its exact
  // value doesn't matter once enAttenteConfirmed is already true, since the
  // wait loop is reached the same way regardless of which sub-path led there.
  const [contactAnswer, setContactAnswer] = useState<YesNo>(isEnAttente ? 'non' : null);
  const [identiteFormulaireAnswer, setIdentiteFormulaireAnswer] = useState<YesNo>(null);
  // Reopening an "en attente" mention took the Q2=Non path (no coordonnées
  // on hand, demande sent) — pre-filled so the wait loop shows right away.
  const [aCoordonneesDirectAnswer, setACoordonneesDirectAnswer] = useState<YesNo>(isEnAttente ? 'non' : null);
  const [demandeDateDraft, setDemandeDateDraft] = useState(reclamation.demandeContactDate ?? '');
  // Once the demande de contact is confirmed, the slider stays open (it's
  // not creating a réclamation yet) and swaps the form for the wait loop
  // instead — no need to wait on the parent re-passing an updated
  // reclamation prop.
  const [enAttenteConfirmed, setEnAttenteConfirmed] = useState(isEnAttente);
  const [eusReponseAnswer, setEusReponseAnswer] = useState<YesNo>(null);
  const [retourTexte, setRetourTexte] = useState('');
  const [retourDateDraft, setRetourDateDraft] = useState('');
  // The relance message needs its own "Confirmer" (like the initial
  // demande) before the dossier is considered back en attente — until then
  // only the template shows, no question below it yet.
  const [relanceConfirmed, setRelanceConfirmed] = useState(false);
  const [relanceCertified, setRelanceCertified] = useState(false);
  const [relanceCertifyMissing, setRelanceCertifyMissing] = useState(false);
  const [relanceDateDraft, setRelanceDateDraft] = useState('');
  const [reponseApresRelanceAnswer, setReponseApresRelanceAnswer] = useState<YesNo>(null);
  // Required before "Clôturer la mention" accepts the courrier as sent —
  // proof of that step may be requested in an audit.
  const [clotureCertified, setClotureCertified] = useState(false);
  const [clotureCertifyMissing, setClotureCertifyMissing] = useState(false);
  // Required before "Confirmer" accepts the initial demande de coordonnées
  // as sent (same certification pattern as the relance and the courrier).
  const [demandeCertified, setDemandeCertified] = useState(false);
  const [demandeCertifyMissing, setDemandeCertifyMissing] = useState(false);
  // Shared by every "Avez-vous les coordonnées...?" checkpoint reached once
  // waiting on a reply (right after the reply, or after the relance).
  const [coordonneesCheckpoint, setCoordonneesCheckpoint] = useState<YesNo>(null);
  const [showContactErrors, setShowContactErrors] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [relanceTemplateCopied, setRelanceTemplateCopied] = useState(false);

  const initialReclamantDraft: ReclamantDraftData = savedReclamantDraft ?? {
    nom,
    prenom,
    email: '',
    telephone: '',
    denominationSociale: '',
    porteurDuRisque: '',
    rattacheContrat: null,
    statutClient: '',
  };
  const [reclamantDraft, setReclamantDraft] = useState<ReclamantDraftData>(initialReclamantDraft);
  // Tracks the last saved snapshot so "Enregistrer" stays disabled until
  // something actually changes since that save (or since opening, if
  // nothing was ever saved).
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<ReclamantDraftData>(initialReclamantDraft);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const draftSavedToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reclamantDraftDirty = JSON.stringify(reclamantDraft) !== JSON.stringify(savedDraftSnapshot);
  // Derived from the last *saved* snapshot, not the live draft — ticking
  // Oui/Non here doesn't tag the mention until that answer is actually
  // confirmed (Enregistrer / Créer une réclamation), so going back to
  // change an earlier question first doesn't leave a stale tag behind.
  const contactTag = getContactTag(savedDraftSnapshot.rattacheContrat);

  // The mention can't be answered directly, so instead of dismissing it
  // (Écartée — meaning it was never a real complaint), it's closed out in
  // place: the slider stays open, its info stays visible, and a toast +
  // persistent grey notice confirm the new status.
  const [mentionCloturee, setMentionCloturee] = useState(isCloturee);
  const [clotureToast, setClotureToast] = useState(false);
  const clotureToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [todayLabel] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const bodyRef = useRef<HTMLDivElement>(null);

  // Each handler below only resets the *next* answer down the tree — deeper
  // answers are left untouched, so flipping back to a combination already
  // answered before re-reveals it pre-filled instead of blank.
  const handlePeutRepondreChange = (value: 'oui' | 'non') => {
    setPeutRepondreAnswer(value);
    setContactAnswer(null);
  };
  const handleContactAnswerChange = (value: 'oui' | 'non') => {
    setContactAnswer(value);
    setIdentiteFormulaireAnswer(null);
    setACoordonneesDirectAnswer(null);
  };
  const handleEusReponseChange = (value: 'oui' | 'non') => {
    setEusReponseAnswer(value);
    setRelanceConfirmed(false);
    setReponseApresRelanceAnswer(null);
    setCoordonneesCheckpoint(null);
  };
  const handleReponseApresRelanceChange = (value: 'oui' | 'non') => {
    setReponseApresRelanceAnswer(value);
    setCoordonneesCheckpoint(null);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(buildDemandeContactTemplate(reclamation.url)).then(() => {
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    });
  };

  const handleCopyRelanceTemplate = () => {
    navigator.clipboard.writeText(buildRelanceTemplate(reclamation.url)).then(() => {
      setRelanceTemplateCopied(true);
      setTimeout(() => setRelanceTemplateCopied(false), 2000);
    });
  };

  // `reclamation` is the prop captured when the slider opened — it doesn't
  // get refreshed as the parent's state updates while it stays open, so the
  // badge is derived from the same local flags the rest of the flow already
  // reacts to instead of the (potentially stale) reclamation.state.
  const badgeState: ReclamationState = isMesReclamations
    ? 'mes-reclamations'
    : mentionCloturee
      ? 'cloturee'
      : enAttenteConfirmed
        ? 'en-attente'
        : reclamation.state;
  const badge = STATE_BADGE[badgeState];

  // Only when the identity was already confirmed via the site's own
  // formulaire does the date get entered by hand — otherwise it's added
  // automatically once the demande is confirmed.
  const needsManualDate = peutRepondreAnswer === 'oui' && contactAnswer === 'oui' && identiteFormulaireAnswer === 'oui';

  const contactAnswerMissing = showContactErrors && !contactAnswer;
  const hasRetourDetail = eusReponseAnswer === 'oui' || reponseApresRelanceAnswer === 'oui';
  const retourDateMissing = showContactErrors && hasRetourDetail && !retourDateDraft;
  const demandeDateMissing = showContactErrors && needsManualDate && !enAttenteConfirmed && !demandeDateDraft;

  const questionRow = (text: string, value: YesNo, onChange: (v: 'oui' | 'non') => void, error?: boolean) => (
    <div className="dossier-question-row">
      <span className="dossier-question-text">
        {text}
        <span className="field-required">*</span>
      </span>
      <ChoiceToggle value={value} onChange={onChange} error={error} />
    </div>
  );

  const renderEnAttenteAlert = (text: string) => (
    <div className="dossier-alert-warning">
      <div className="dossier-alert-warning-title-row">
        <AlertTriangleIcon />
        <span className="dossier-alert-warning-title">En attente du retour du client</span>
      </div>
      <p className="dossier-alert-warning-text">{text}</p>
    </div>
  );

  const renderMessageTemplate = (title: string, body: string, copied: boolean, onCopy: () => void) => (
    <div className="dossier-template-block">
      <div className="dossier-template-header">
        <span className="dossier-template-title">{title}</span>
        <span className="dossier-template-copy-wrap">
          <button
            type="button"
            className="dossier-template-copy-btn"
            aria-label="Copier le modèle de message"
            onClick={onCopy}
          >
            <CopyIcon />
          </button>
          {copied && <span className="dossier-template-copy-feedback">Copié !</span>}
        </span>
      </div>
      <p className="dossier-template-text dossier-template-link">
        Lien de la mention :{' '}
        <a
          className="dossier-template-link-anchor"
          href={toHref(reclamation.url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {toHref(reclamation.url)}
          <ArrowUpRight />
        </a>
      </p>
      <p className="dossier-template-text">{body}</p>
    </div>
  );

  const renderDemandeContactTemplate = () =>
    renderMessageTemplate(
      "Message de demande de coordonnées à envoyer",
      DEMANDE_CONTACT_TEMPLATE_BODY,
      templateCopied,
      handleCopyTemplate,
    );

  const renderRelanceTemplate = () =>
    renderMessageTemplate('Message de relance à envoyer', RELANCE_TEMPLATE_BODY, relanceTemplateCopied, handleCopyRelanceTemplate);

  // Reusable required "je certifie" checkbox — used for every step where a
  // manual action (sending a message, posting a courrier) has to be
  // confirmed on the honor system before moving on, since proof of that
  // action may be requested in an audit.
  const renderCertifyCheckbox = (label: string, checked: boolean, onToggle: (checked: boolean) => void, missing: boolean) => (
    <div className={`dossier-certify-checkbox-wrap ${missing ? 'dossier-certify-checkbox-wrap-error' : ''}`}>
      <label className="dossier-certify-checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span className="dossier-certify-checkbox-text">
          {label}
          <span className="field-required">*</span>
        </span>
      </label>
      {missing && <span className="field-error-text">Champ requis</span>}
    </div>
  );

  // Required before "Confirmer" accepts the initial demande de coordonnées
  // as sent.
  const renderDemandeCertifyCheckbox = () =>
    renderCertifyCheckbox(
      "Je certifie avoir envoyé le message de demande de coordonnées à l'auteur du commentaire.",
      demandeCertified,
      (checked) => {
        setDemandeCertified(checked);
        if (checked) setDemandeCertifyMissing(false);
      },
      demandeCertifyMissing,
    );

  // Required before "Confirmer" accepts the relance as sent.
  const renderRelanceCertifyCheckbox = () =>
    renderCertifyCheckbox(
      "Je certifie avoir envoyé le message de relance à l'auteur du commentaire.",
      relanceCertified,
      (checked) => {
        setRelanceCertified(checked);
        if (checked) setRelanceCertifyMissing(false);
      },
      relanceCertifyMissing,
    );

  // Required before "Clôturer la mention" accepts the courrier as sent to
  // the hébergeur.
  const renderClotureCertifyCheckbox = () =>
    renderCertifyCheckbox(
      "Je certifie avoir envoyé le courrier à l'hébergeur du site afin d'obtenir les informations de l'auteur du commentaire.",
      clotureCertified,
      (checked) => {
        setClotureCertified(checked);
        if (checked) setClotureCertifyMissing(false);
      },
      clotureCertifyMissing,
    );

  // Same fields whether they show up right away or later once the
  // coordonnées were retrieved from the author's reply.
  const renderReclamantFields = () => (
    <div className="dossier-treatment-fields">
      <div className="modal-row">
        <FormField
          label="Nom de l'auteur de la mention"
          required
          placeholder="Entrez le nom de l'auteur de la mention"
          value={reclamantDraft.nom}
          error={showContactErrors && !reclamantDraft.nom}
          errorText={showContactErrors && !reclamantDraft.nom ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
        />
        <FormField
          label="Prénom de l'auteur de la mention"
          required
          placeholder="Entrez le prénom de l'auteur de la mention"
          value={reclamantDraft.prenom}
          error={showContactErrors && !reclamantDraft.prenom}
          errorText={showContactErrors && !reclamantDraft.prenom ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
        />
      </div>
      <div className="modal-row">
        <FormField
          label="Email"
          required
          placeholder="Entrez une adresse email"
          value={reclamantDraft.email}
          error={showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone}
          errorText={
            showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone
              ? 'Un email ou un numéro de téléphone est requis'
              : undefined
          }
          onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
        />
        <FormField
          label="Numéro de téléphone"
          required
          placeholder="Entrez le numéro de téléphone"
          value={reclamantDraft.telephone}
          error={showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone}
          errorText={
            showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone
              ? 'Un email ou un numéro de téléphone est requis'
              : undefined
          }
          onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
        />
      </div>
      <div className="modal-row">
        <FormField
          label="Dénomination sociale"
          placeholder="Entrez la dénomination sociale"
          value={reclamantDraft.denominationSociale}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, denominationSociale: v }))}
        />
        <FormField
          label="Assureur / Porteur du risque"
          placeholder="Entrez le porteur du risque"
          value={reclamantDraft.porteurDuRisque}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, porteurDuRisque: v }))}
        />
      </div>
      <div className="dossier-question-row">
        <span className="dossier-question-text">
          L'auteur de la mention est-il rattaché à un contrat ?<span className="field-required">*</span>
        </span>
        <ChoiceToggle
          value={reclamantDraft.rattacheContrat}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, rattacheContrat: v }))}
          error={showContactErrors && !reclamantDraft.rattacheContrat}
        />
      </div>
      {reclamantDraft.rattacheContrat === 'oui' && (
        <div className="modal-row dossier-contract-row">
          <FormSelect<StatutClient>
            label="Statut du client"
            required
            value={reclamantDraft.statutClient}
            options={(Object.keys(STATUT_CLIENT_LABEL) as StatutClient[]).map((id) => ({
              id,
              label: STATUT_CLIENT_LABEL[id],
              description: STATUT_CLIENT_DESCRIPTION[id],
            }))}
            placeholder="Sélectionnez le statut du client"
            error={showContactErrors && !reclamantDraft.statutClient}
            errorText={showContactErrors && !reclamantDraft.statutClient ? 'Champ requis' : undefined}
            onChange={(v) => setReclamantDraft((d) => ({ ...d, statutClient: v }))}
          />
          <div className="dossier-field-spacer" />
        </div>
      )}
    </div>
  );

  // The terminal reached whenever a "Non" leaves the mention's author
  // unreachable — same wording and actions (télécharger le courrier,
  // clôturer) regardless of which branch of the flow led here.
  const renderClotureOfferFields = () => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            Téléchargez le document ci-dessous : il s'agit d'un courrier à envoyer à l'hébergeur du site pour lui
            demander les informations de la personne à l'origine du commentaire, afin de pouvoir la contacter.
          </p>
          <p>
            Au moment de la clôture, un email sera automatiquement envoyé à Qualité Assurance pour les avertir de la
            situation.
          </p>
        </div>
        {/* No real document to serve yet — the button is a placeholder
            pending the client's file. */}
        <button type="button" className="btn-text dossier-file-upload-btn" onClick={() => {}}>
          Télécharger le document
        </button>
        {renderClotureCertifyCheckbox()}
      </div>
    </div>
  );

  // Shown once the demande de contact is ready to send — the date field
  // only appears when it has to be entered by hand (needsManualDate);
  // otherwise it's added automatically once confirmed. The template itself
  // is skipped when it's already been previewed above the question that led
  // here (showTemplate=false), to avoid showing it twice.
  const renderEnvoiDemandeFields = (showTemplate = true) => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          {needsManualDate
            ? "Afin d'avoir une meilleure traçabilité des étapes, indiquez à quelle date vous avez envoyé votre demande de coordonnées à l'auteur du commentaire."
            : "Pour respecter le processus de conformité, vous devez envoyer ce message à l'auteur du commentaire. Une fois confirmée, le dossier passera en attente jusqu'à ce que vous confirmiez la réponse de l'auteur, la date étant ajoutée automatiquement."}
        </div>
        {needsManualDate && (
          <div className="modal-row">
            <FormField
              label="Date d'envoi de la demande de coordonnées"
              required
              type="date"
              placeholder="JJ/MM/AAAA"
              value={demandeDateDraft}
              error={demandeDateMissing}
              errorText={demandeDateMissing ? 'Champ requis' : undefined}
              onChange={setDemandeDateDraft}
            />
            <div className="dossier-field-spacer" />
          </div>
        )}
        {showTemplate && renderDemandeContactTemplate()}
        {/* Skipped when needsManualDate — entering the send date already
            attests to having sent it, so the certification would be
            redundant. */}
        {!needsManualDate && renderDemandeCertifyCheckbox()}
      </div>
    </div>
  );

  // The retour's own detail fields (texte + date), shown right above the
  // "avez-vous les coordonnées" checkpoint once a reply came in.
  const renderRetourDetailFields = () => (
    <>
      <FormTextareaAutoGrow
        label="Réponse de l'auteur du commentaire"
        placeholder="Collez ici la réponse de l'auteur du commentaire"
        value={retourTexte}
        onChange={setRetourTexte}
      />
      <div className="modal-row">
        <FormField
          label="Date de la réponse de l'auteur du commentaire"
          required
          type="date"
          placeholder="JJ/MM/AAAA"
          value={retourDateDraft}
          error={retourDateMissing}
          errorText={retourDateMissing ? 'Champ requis' : undefined}
          onChange={setRetourDateDraft}
        />
        <div className="dossier-field-spacer" />
      </div>
    </>
  );

  // Renders a question and, once it's answered, appends whatever comes
  // next right below it — the question itself always stays visible (with
  // its given answer still selected) instead of being replaced by the
  // result, so changing the answer just swaps the content underneath. The
  // downstream content is wrapped in a Fragment keyed on this question's own
  // answer (not a bigger, shared key) so re-answering it replays just that
  // content's entrance animation, without remounting — and flickering — the
  // question row itself or anything answered above it.
  const stepQuestion = (
    text: string,
    value: YesNo,
    onChange: (v: 'oui' | 'non') => void,
    next: () => Step,
    options?: { error?: boolean; preview?: ReactNode },
  ): Step => {
    const row = questionRow(text, value, onChange, options?.error);
    // The preview (e.g. the message template) shows right under the
    // question regardless of the answer — it's reference material for
    // deciding, not downstream content gated by it.
    const preview = options?.preview ?? null;
    if (value === null) return { phase: 'question', node: (<>{row}{preview}</>) };
    const nextStep = next();
    return {
      phase: nextStep.phase,
      node: (
        <>
          {row}
          {preview}
          <Fragment key={value}>{nextStep.node}</Fragment>
        </>
      ),
    };
  };

  // The "Avez-vous les coordonnées...?" checkpoint reached from several
  // points in the wait loop (right after the reply, at J+3, after the
  // relance) — always the same question, same two outcomes.
  const getCoordonneesCheckpointStep = (): Step => {
    const retourDetail = hasRetourDetail ? renderRetourDetailFields() : null;
    const inner = stepQuestion(
      "Avez-vous récupéré les coordonnées de l'auteur de la mention ?",
      coordonneesCheckpoint,
      setCoordonneesCheckpoint,
      () =>
        coordonneesCheckpoint === 'oui'
          ? { phase: 'reclamant', node: renderReclamantFields() }
          : { phase: 'cloture-offer', node: renderClotureOfferFields() },
    );
    return { phase: inner.phase, node: (<>{retourDetail}{inner.node}</>) };
  };

  // No response yet — shows the relance template right away (the "en
  // attente" bulle above already explains when a relance becomes
  // available). Sending it needs its own "Confirmer" before the dossier is
  // back en attente — once confirmed, the template makes way for that
  // notice and the next question, same pattern as the initial demande.
  const getRelanceStep = (): Step => {
    if (!relanceConfirmed) {
      return {
        phase: 'relance-envoi',
        node: (
          <>
            {renderRelanceTemplate()}
            {renderRelanceCertifyCheckbox()}
          </>
        ),
      };
    }
    const inner = stepQuestion(
      'Avez-vous reçu une réponse de la part de l\'auteur du commentaire ?',
      reponseApresRelanceAnswer,
      handleReponseApresRelanceChange,
      () =>
        reponseApresRelanceAnswer === 'oui'
          ? getCoordonneesCheckpointStep()
          : { phase: 'cloture-offer', node: renderClotureOfferFields() },
    );
    return {
      phase: inner.phase,
      node: (
        <>
          {renderEnAttenteAlert(
            `Message de relance envoyé le ${relanceDateDraft}. Le dossier reste en attente jusqu'à ce que vous indiquiez si l'auteur a répondu (délai maximum de 30 jours).`,
          )}
          {inner.node}
        </>
      ),
    };
  };

  // The wait loop once a demande de contact is confirmed: "a-t-on eu une
  // réponse ?", then the relance template if not, before giving up and
  // offering to clôturer. Once the relance itself has been confirmed, this
  // first question is superseded by the identical one inside
  // getRelanceStep (with its own "message de relance envoyé" alert), so it
  // steps aside instead of showing twice.
  const getWaitLoopStep = (): Step => {
    if (eusReponseAnswer === 'non' && relanceConfirmed) return getRelanceStep();
    return stepQuestion(
      'Avez-vous reçu une réponse de la part de l\'auteur du commentaire ?',
      eusReponseAnswer,
      handleEusReponseChange,
      () => (eusReponseAnswer === 'oui' ? getCoordonneesCheckpointStep() : getRelanceStep()),
    );
  };

  const getQ2NonBranch = (): Step =>
    stepQuestion(
      "Avez-vous les coordonnées de l'auteur du commentaire ?",
      aCoordonneesDirectAnswer,
      setACoordonneesDirectAnswer,
      () => {
        if (aCoordonneesDirectAnswer === 'oui') return { phase: 'reclamant', node: renderReclamantFields() };
        if (enAttenteConfirmed) return getWaitLoopStep();
        return { phase: 'envoi', node: renderEnvoiDemandeFields() };
      },
    );

  const getQ2OuiBranch = (): Step =>
    stepQuestion(
      "Avez-vous demandé l'identité selon le formulaire ?",
      identiteFormulaireAnswer,
      setIdentiteFormulaireAnswer,
      () => (enAttenteConfirmed ? getWaitLoopStep() : { phase: 'envoi', node: renderEnvoiDemandeFields(false) }),
      { preview: renderDemandeContactTemplate() },
    );

  // Walks the flowchart node by node from Q2 onward (Q1 itself is rendered
  // separately, always visible once the mention isn't clôturée) — each
  // question stays visible once reached, with whatever comes next appended
  // right below it.
  const getTreatmentStep = (): Step => {
    if (peutRepondreAnswer === 'non') {
      return stepQuestion(
        "Avez-vous les coordonnées de l'auteur du commentaire ?",
        contactAnswer,
        handleContactAnswerChange,
        () =>
          contactAnswer === 'oui'
            ? { phase: 'reclamant', node: renderReclamantFields() }
            : { phase: 'cloture-offer', node: renderClotureOfferFields() },
        { error: contactAnswerMissing },
      );
    }

    // peutRepondreAnswer === 'oui'
    return stepQuestion(
      'Avez-vous demandé les coordonnées à l\'auteur de ce commentaire ?',
      contactAnswer,
      handleContactAnswerChange,
      () => (contactAnswer === 'non' ? getQ2NonBranch() : getQ2OuiBranch()),
      { error: contactAnswerMissing },
    );
  };

  const step = peutRepondreAnswer !== null ? getTreatmentStep() : null;
  // Once the demande de contact is confirmed, the guiding questions that led
  // here (Q1, Q2, Q3...) are no longer relevant to show — only the wait
  // loop itself, under a single persistent "en attente" notice.
  const waitStep = enAttenteConfirmed ? getWaitLoopStep() : null;
  const showingReclamantFields = step?.phase === 'reclamant';
  const showingClotureOffer = step?.phase === 'cloture-offer' && !mentionCloturee;
  const isEnvoiStep = step?.phase === 'envoi';
  const isRelanceEnvoiStep = step?.phase === 'relance-envoi';

  // Whether the sticky footer has anything to show — e.g. while waiting on
  // a retour answer, no action applies yet, so the footer itself shouldn't
  // render (an empty bar would just clip the content above it).
  const hasFooterActions =
    isMesReclamations ||
    (isFlagged && peutRepondreAnswer === null) ||
    (activeTab === 'informations' &&
      (showingClotureOffer || showingReclamantFields || isEnvoiStep || isRelanceEnvoiStep));

  const reclamantFieldsMissing =
    !reclamantDraft.nom ||
    !reclamantDraft.prenom ||
    (!reclamantDraft.email && !reclamantDraft.telephone) ||
    !reclamantDraft.rattacheContrat ||
    (reclamantDraft.rattacheContrat === 'oui' && !reclamantDraft.statutClient);

  // The mention's own trail so far — carried over into the new réclamation's
  // historique on submit, and shown as-is here until a réclamation exists.
  const historiqueEntries: HistoriqueEntry[] = [
    { title: 'Réception de la mention', description: `Mention reçue via ${canal}.`, date: reclamation.date, author: 'Système' },
    ...(isFlagged
      ? [
          {
            title: 'Réclamation potentielle détectée',
            description: 'Mention identifiée automatiquement comme réclamation potentielle par le système.',
            date: reclamation.date,
            author: 'Système',
          },
        ]
      : []),
    ...(enAttenteConfirmed
      ? [
          {
            title: 'Confirmation de la demande de contact',
            description: `Demande de coordonnées envoyée à l'auteur de la mention.`,
            date: demandeDateDraft,
            author: 'Joe Bleau',
          },
        ]
      : []),
    ...(hasRetourDetail && retourTexte.trim() !== ''
      ? [
          {
            title: "Retour de l'auteur du commentaire",
            description: "L'auteur du commentaire a répondu à la demande de coordonnées.",
            date: retourDateDraft || todayLabel,
            author: 'Joe Bleau',
            changes: [{ label: 'Réponse', value: retourTexte }],
          },
        ]
      : []),
    ...(eusReponseAnswer === 'non'
      ? [
          {
            title: 'Relance envoyée',
            description: "Message de relance envoyé à l'auteur de la mention après l'absence de réponse.",
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
    ...(mentionCloturee
      ? [
          {
            title: 'Clôture de la mention',
            description:
              "Les coordonnées de l'auteur du commentaire n'ont pas pu être obtenues : un courrier a été transmis à l'hébergeur pour les demander.",
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
  ];

  const requestClose = (action: () => void) => {
    if (closing) return;
    setClosing(true);
    setTimeout(action, CLOSE_ANIMATION_DURATION);
  };

  const handleClose = () => requestClose(onClose);

  // Rather than disabling the button, a click with required fields still
  // empty opens the Traitement tab and flags exactly which ones are missing
  // — same pattern as ComplaintDetailDrawer's handleConfirmAR.
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const firstError = bodyRef.current?.querySelector(
        '.field-border-error, .dossier-choice-row-error, .dossier-certify-checkbox-wrap-error',
      );
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // Saves whatever's currently filled in without creating the réclamation —
  // no validation, unlike handleSubmit, since it's meant to let the user
  // pick up a partially filled dossier later.
  const handleSaveDraft = () => {
    onSaveReclamantDraft(reclamantDraft);
    setSavedDraftSnapshot(reclamantDraft);
    setDraftSavedToast(true);
    if (draftSavedToastTimeout.current) clearTimeout(draftSavedToastTimeout.current);
    draftSavedToastTimeout.current = setTimeout(() => setDraftSavedToast(false), 3000);
  };

  // The mention stays open on clôture (unlike "Écarter") — a toast confirms
  // the action, then a persistent grey notice takes over from the guiding
  // question.
  const handleClotureMention = () => {
    if (!clotureCertified) {
      setClotureCertifyMissing(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    onClotureMention();
    setMentionCloturee(true);
    setClotureToast(true);
    if (clotureToastTimeout.current) clearTimeout(clotureToastTimeout.current);
    clotureToastTimeout.current = setTimeout(() => setClotureToast(false), 3000);
  };

  // Confirms the demande de contact — the date is entered by hand only when
  // needsManualDate; otherwise it's today's date, added automatically.
  const handleConfirmDemande = () => {
    const dateMissing = needsManualDate && !demandeDateDraft;
    const certifyMissing = !needsManualDate && !demandeCertified;
    if (dateMissing || certifyMissing) {
      if (dateMissing) setShowContactErrors(true);
      if (certifyMissing) setDemandeCertifyMissing(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    const date = needsManualDate ? demandeDateDraft : todayLabel;
    if (!needsManualDate) setDemandeDateDraft(date);
    onConfirmEnAttente(date);
    setEnAttenteConfirmed(true);
  };

  // Confirms the relance was sent — the date is always today's, added
  // automatically, same as the auto-date branch of the initial demande.
  const handleConfirmRelance = () => {
    if (!relanceCertified) {
      setRelanceCertifyMissing(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    setRelanceDateDraft(todayLabel);
    setRelanceConfirmed(true);
  };

  const handleSubmit = () => {
    const missing = reclamantFieldsMissing || (hasRetourDetail && !retourDateDraft);
    if (missing) {
      setShowContactErrors(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    setSavedDraftSnapshot(reclamantDraft);
    onSubmit(
      {
        prenom: reclamantDraft.prenom,
        nom: reclamantDraft.nom,
        canal,
        dateReception,
        email: reclamantDraft.email,
        telephone: reclamantDraft.telephone,
        denominationSociale: reclamantDraft.denominationSociale,
        porteurDuRisque: reclamantDraft.porteurDuRisque,
        rattacheContrat: reclamantDraft.rattacheContrat ?? '',
        statutClient: reclamantDraft.statutClient,
        objet,
        notesInternes: '',
        description: reclamation.text,
      },
      historiqueEntries,
    );
  };

  return (
    <div className={`drawer-backdrop ${closing ? 'drawer-closing' : ''}`} onClick={handleClose}>
      <div className="drawer-panel create-claim-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-appbar">
          <span className="drawer-title">Détail de la mention</span>
          <button type="button" className="drawer-close-button" aria-label="Fermer" onClick={handleClose}>
            <img src={drawerClose} alt="" width={14} height={14} />
          </button>
        </div>

        <div className="create-claim-body" ref={bodyRef}>
          <MentionTabsControl value={activeTab} onChange={setActiveTab} />

          {activeTab === 'informations' && (
            <div className="create-claim-section">
              <div className="card-top">
                <div className="card-source-row">
                  <HoverTooltip text="Numéro de référence de la mention" align="left">
                    <span className="chip complaint-ticket-chip">{reclamation.ticket}</span>
                  </HoverTooltip>
                  <SourceIcon source={reclamation.source} />
                  <span className="card-source-name">{reclamation.source}</span>
                  <span className="card-dot">·</span>
                  <span className="card-date">{reclamation.date}</span>
                  <div className="card-source-row-spacer" />
                  {badge && <span className={`chip cta-badge ${badge.className}`}>{badge.label}</span>}
                </div>
                <a
                  className="card-url-row"
                  href={toHref(reclamation.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="card-url">{reclamation.url}</span>
                  <ArrowUpRight />
                </a>
              </div>

              <div className="dossier-field-row">
                <div className="dossier-field">
                  <span className="dossier-field-label">Email</span>
                  <span className="dossier-field-readonly-value">{reclamantDraft.email || 'Non renseigné'}</span>
                </div>
                <div className="dossier-field">
                  <span className="dossier-field-label">Téléphone</span>
                  <span className="dossier-field-readonly-value">{reclamantDraft.telephone || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="card-author-row">
                  <SentimentIcon text={reclamation.text} />
                  <span className="card-author">{reclamation.author}</span>
                  {contactTag && <span className="chip chip-neutral">{contactTag}</span>}
                </div>
                <div className="card-text-wrapper">
                  <p className="card-text">{reclamation.text}</p>
                </div>
              </div>

              {!isMesReclamations && mentionCloturee && (
                <div className="dossier-treatment-block">
                  <div className="dossier-alert-neutral">
                    <p>
                      Cette mention a été clôturée : les coordonnées de l'auteur du commentaire n'ont pas pu être
                      obtenues malgré la demande transmise.
                    </p>
                  </div>
                </div>
              )}

              {!isMesReclamations && !mentionCloturee && enAttenteConfirmed && waitStep && (
                <div className="dossier-treatment-block">
                  {!relanceConfirmed &&
                    renderEnAttenteAlert(
                      `Demande d'information envoyée à l'auteur de la mention le ${demandeDateDraft}. Le dossier reste en attente jusqu'à ce que vous indiquiez si l'auteur a répondu. Si aucune action n'est faite, une relance sera disponible à partir du ${addDaysToFrDate(demandeDateDraft, 3)}.`,
                    )}
                  {waitStep.node}
                </div>
              )}

              {!isMesReclamations && !mentionCloturee && !enAttenteConfirmed && (
                <div className="dossier-treatment-block">
                  {questionRow(
                    `Pouvez-vous répondre au commentaire directement sur ${reclamation.source} ?`,
                    peutRepondreAnswer,
                    handlePeutRepondreChange,
                  )}
                </div>
              )}

              {!isMesReclamations && !mentionCloturee && !enAttenteConfirmed && step && (
                <div key={peutRepondreAnswer} className="dossier-treatment-block">
                  {step.node}
                </div>
              )}
            </div>
          )}

          {activeTab === 'historique' && (
            <div className="dossier-history">
              {[...(isMesReclamations && linkedComplaintHistorique ? linkedComplaintHistorique : historiqueEntries)]
                .reverse()
                .map((entry, index, arr) => (
                <div key={index} className="dossier-history-item">
                  <div className="dossier-history-marker">
                    {index !== arr.length - 1 && (
                      <div className="dossier-history-line">
                        <svg width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="1" y1="0" x2="1" y2="2000" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <HoverTooltip text="Étape clé du dossier" align="left" className="dossier-history-dot">
                      <FlagIcon />
                    </HoverTooltip>
                  </div>
                  <div className="dossier-history-content">
                    <span className="dossier-history-title">{entry.title}</span>
                    <span className="dossier-history-description">{entry.description}</span>
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="dossier-history-changes">
                        {entry.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="dossier-history-change-row">
                            <span className="dossier-history-change-label">{change.label}</span>
                            <ExpandableHistoryValue value={change.value} />
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="dossier-history-meta">
                      {entry.date} · par {entry.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="create-claim-footer-wrap">
          <AlertSnackbar
            visible={draftSavedToast}
            message="Informations enregistrées."
            variant="success"
            className="alert-snackbar-local"
          />
          <AlertSnackbar
            visible={clotureToast}
            message="Mention clôturée."
            variant="success"
            className="alert-snackbar-local"
          />
          {hasFooterActions && (
          <div className="modal-actions create-claim-actions">
            {isMesReclamations ? (
              <button type="button" className="btn-filled" onClick={onViewComplaint}>
                Voir la réclamation
              </button>
            ) : (
              <>
                {isFlagged && peutRepondreAnswer === null && (
                  <button type="button" className="btn-text" onClick={onDismiss}>
                    Écarter
                  </button>
                )}
                {activeTab === 'informations' && showingClotureOffer && (
                  <button type="button" className="btn-filled" onClick={handleClotureMention}>
                    Clôturer la mention
                  </button>
                )}
                {activeTab === 'informations' && showingReclamantFields && (
                  <button
                    type="button"
                    className="btn-text"
                    disabled={!reclamantDraftDirty}
                    onClick={handleSaveDraft}
                  >
                    Enregistrer
                  </button>
                )}
                {activeTab === 'informations' && showingReclamantFields && (
                  <button type="button" className="btn-filled" onClick={handleSubmit}>
                    Créer une réclamation
                  </button>
                )}
                {activeTab === 'informations' && isEnvoiStep && (
                  <button type="button" className="btn-filled" onClick={handleConfirmDemande}>
                    Confirmer
                  </button>
                )}
                {activeTab === 'informations' && isRelanceEnvoiStep && (
                  <button type="button" className="btn-filled" onClick={handleConfirmRelance}>
                    Confirmer
                  </button>
                )}
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
