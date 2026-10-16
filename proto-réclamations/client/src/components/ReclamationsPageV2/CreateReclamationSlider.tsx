import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import AlertSnackbar from './AlertSnackbar';
import ArrowUpRight from './ArrowUpRight';
import {
  getContactTag,
  STATUT_CLIENT_DESCRIPTION,
  STATUT_CLIENT_LABEL,
  type HistoriqueEntry,
  type MentionCanal,
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
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
  'en-attente': { label: 'En attente', className: 'chip-en-attente' },
  cloturee: { label: 'Clôturée', className: 'chip-cloturee' },
};

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

function addDaysToFrDate(value: string, days: number): string {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('fr-FR');
}

function parseFrDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
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
      <div className="dossier-choice-segmented">
        <button
          type="button"
          className={`dossier-toggle-btn ${value === 'oui' ? 'dossier-toggle-btn-active' : ''}`}
          onClick={() => onChange('oui')}
        >
          Oui
        </button>
        <div className="dossier-toggle-divider" />
        <button
          type="button"
          className={`dossier-toggle-btn ${value === 'non' ? 'dossier-toggle-btn-active' : ''}`}
          onClick={() => onChange('non')}
        >
          Non
        </button>
      </div>
    </div>
  );
}

// A row of option cards (unlike ChoiceToggle's Oui/Non pair) — used for
// "Quelle option correspond à votre situation ?", whose three options each
// need a short title plus a bit more detail than a single word can carry.
function ChoiceColumn<T extends string>({
  value,
  onChange,
  options,
  error,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; title: string; description: string }[];
  error?: boolean;
}) {
  return (
    <div className={`dossier-choice-column ${error ? 'dossier-choice-row-error' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`dossier-toggle-btn dossier-choice-card ${value === option.value ? 'dossier-toggle-btn-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <span className="dossier-choice-card-title">{option.title}</span>
          <span className="dossier-choice-card-description">{option.description}</span>
        </button>
      ))}
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
  onViewComplaint: () => void;
  // True when this slider was opened from the réclamations page's "Non
  // identifiés" segment (an existing réclamation whose author still isn't
  // identified) rather than from the mentions list. Once a réclamation
  // exists, reopening it from the mentions side just points back to the
  // réclamations page (the "déjà existante" notice) — but opening it from
  // there is exactly where its own continuation (en attente, relance,
  // clôturée...) should actually show, since that's its new home.
  isReclamationView?: boolean;
  // Which canal originally created this réclamation (set once, see
  // onConfirmContactAttempt) — only meaningful alongside isReclamationView,
  // to know which continuation to resume (en attente vs clôturée).
  savedCanalAnswer?: MentionCanal;
  // Called when confirming the canal step's message/courrier (plateforme,
  // administrateur, or rien) — creates (or updates) the réclamation right
  // away (réclamant fields stay blank, author still "à déterminer"), but
  // unlike onSubmit it doesn't navigate anywhere: the slider stays open,
  // showing its own terminal notice instead of the réclamation's own detail.
  // closeReason is passed for administrateur/rien — the réclamation lands
  // clôturée right away, with this as its clôture entry/description —
  // omitted for plateforme, which leaves it open awaiting a reply.
  onConfirmContactAttempt: (
    formData: ReclamationFormData,
    mentionHistorique: HistoriqueEntry[],
    sourceCanal: MentionCanal,
    closeReason?: { title: string; description: string; date: string },
  ) => void;
  onClotureMention: () => void;
  // Once a réclamation exists for this mention, its Historique tab shows
  // that dossier's actual historique instead of reconstructing its own —
  // one shared trail, whichever slider it's viewed from.
  linkedComplaintHistorique?: HistoriqueEntry[];
  // The linked réclamation's own ticket — shown in the header instead of
  // "Détail de la mention" when isReclamationView, since at that point this
  // is really that réclamation's own continuation, not the mention's.
  linkedComplaintTicket?: string;
  // Lets the reclamant fields be saved on their own (e.g. partially filled
  // in, to finish later) without creating a réclamation — persisted by the
  // parent and restored here when the slider reopens.
  savedReclamantDraft?: ReclamantDraftData;
  onSaveReclamantDraft: (draft: ReclamantDraftData) => void;
  // Each "Enregistrer" on the reclamant draft appends one of these — kept by
  // the parent (alongside the draft itself) so the modification still shows
  // in the Historique tab the next time the slider reopens, not just within
  // the session that made it.
  savedDraftHistorique?: HistoriqueEntry[];
  onAppendDraftHistorique: (entry: HistoriqueEntry) => void;
  // Which of the six clôture paths actually closed this mention — persisted
  // by the parent so "Mention clôturée" still explains itself correctly
  // after the slider's been fully closed and reopened (not just within the
  // same session), same reasoning as savedDraftHistorique above.
  savedClotureReason?: ClotureReason;
  onSetClotureReason: (reason: ClotureReason) => void;
};

const CLOSE_ANIMATION_DURATION = 200;
// Same duration as the réclamations page's own "Création de la
// réclamation…" beat (CREATING_DELAY_MS there), for a consistent feel.
const CREATING_DELAY_MS = 3000;

type YesNo = 'oui' | 'non' | null;
// Q1=Non branch — which of the three options the user picked when the
// comment's author hasn't been identified.
type CanalAnswer = MentionCanal | null;
// Which of the six "cloture-offer" paths actually closed a mention —
// 'administrateur' / 'qa': Q1's own two dead ends, the author was never
// reached at all. 'hebergeur-apres-reponse' / 'qa-apres-reponse': the author
// did reply (via la plateforme) but without their coordonnées.
// 'hebergeur-sans-reponse' / 'qa-sans-reponse': no reply at all, even after
// the relance. Within each "apres-reponse"/"sans-reponse" pair, the
// hebergeur-* variant means the hébergeur could be contacted; the qa-*
// variant means it couldn't. Persisted by the parent (unlike the rest of
// this component's flow state) so the "Mention clôturée" summary still
// explains itself correctly after the slider's been fully closed and
// reopened, not just across an in-session réouverture.
export type ClotureReason =
  | 'administrateur'
  | 'qa'
  | 'hebergeur-apres-reponse'
  | 'qa-apres-reponse'
  | 'hebergeur-sans-reponse'
  | 'qa-sans-reponse'
  | 'administrateur-apres-reponse'
  | 'administrateur-sans-reponse'
  | null;
type StepPhase =
  | 'question'
  | 'envoi'
  | 'relance-envoi'
  | 'waiting'
  | 'reclamant'
  | 'cloture-offer'
  | 'administrateur-cloture'
  | 'administrateur-escalade-envoi'
  | 'pending-definition';
type Step = { node: ReactNode; phase: StepPhase };

export default function CreateReclamationSlider({
  reclamation,
  onClose,
  onSubmit,
  onViewComplaint,
  isReclamationView = false,
  savedCanalAnswer,
  onConfirmContactAttempt,
  onClotureMention,
  linkedComplaintHistorique,
  linkedComplaintTicket,
  savedReclamantDraft,
  onSaveReclamantDraft,
  savedDraftHistorique,
  onAppendDraftHistorique,
  savedClotureReason,
  onSetClotureReason,
}: CreateReclamationSliderProps) {
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
  // The treatment block's own cascade delay (below) is forced to 0s so a
  // mid-session remount — switching Q1's answer, say — doesn't lag behind
  // card-top/card-body's own entrance. But the slider's very first open is
  // exactly when it should join that cascade, hence this one-shot flag:
  // true only for the brief window the initial reveal is still playing.
  const [initialCascadeDone, setInitialCascadeDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setInitialCascadeDone(true), 700);
    return () => clearTimeout(timer);
  }, []);
  const treatmentBlockClassName = (extra?: string) =>
    ['dossier-treatment-block', !initialCascadeDone && 'dossier-treatment-block-first-reveal', extra]
      .filter(Boolean)
      .join(' ');

  // The whole treatment flow below mirrors the team's Figma flowchart node
  // by node — getTreatmentStep() walks it top to bottom and returns exactly
  // the one next thing to show, instead of stacking JSX conditions. Every
  // "Avez-vous les coordonnées...?" checkpoint reached once waiting on a
  // reply is the same question in the diagram, so they all share
  // coordonneesCheckpoint below rather than being separate fields.
  // Q0 — asked before Q1: whether the mention even qualifies as a
  // réclamation at all. Reopening an "en attente" mention, or opening an
  // existing réclamation from "Non identifiés" (isReclamationView), both
  // pre-fill "oui" — the réclamation already exists either way.
  const [reclamationTypeAnswer, setReclamationTypeAnswer] = useState<YesNo>(
    isEnAttente || isReclamationView ? 'oui' : null,
  );
  // Q1 — same pre-fill logic as above: the author wasn't identified
  // directly, hence going through a canal to request their coordonnées —
  // the continuation is reached the same way regardless of which sub-path
  // led there.
  const [identifiedAnswer, setIdentifiedAnswer] = useState<YesNo>(isEnAttente || isReclamationView ? 'non' : null);
  // Q1=Non branch — reopening an "en attente" mention always means
  // "plateforme" (the only canal that used to leave a mention en-attente);
  // opening an existing réclamation from "Non identifiés" uses whichever
  // canal actually created it (savedCanalAnswer), since all three can now
  // land there.
  const [canalAnswer, setCanalAnswer] = useState<CanalAnswer>(
    isEnAttente ? 'plateforme' : isReclamationView ? (savedCanalAnswer ?? 'plateforme') : null,
  );
  // reclamation.demandeContactDate only ever reflects mock data seeded ahead
  // of time — a réclamation actually created live (via handleConfirmDemande)
  // never gets it persisted back there, so on reopen (isReclamationView) this
  // would otherwise render blank. The complaint's own historique entry for
  // that confirmation is the one place the real date survives a reopen.
  const [demandeDateDraft, setDemandeDateDraft] = useState(
    linkedComplaintHistorique?.find((entry) => entry.title === "Message envoyé à l'auteur du commentaire")?.date ??
      reclamation.demandeContactDate ??
      '',
  );
  // Once the demande de contact is confirmed, the slider stays open (it's
  // not creating a réclamation yet) and swaps the form for the wait loop
  // instead — no need to wait on the parent re-passing an updated
  // reclamation prop. Also true from the start when opening an existing
  // réclamation from "Non identifiés" — its canal was already confirmed.
  const [enAttenteConfirmed, setEnAttenteConfirmed] = useState(isEnAttente || isReclamationView);
  // Brief full-slider "Création de la réclamation…" loading beat shown right
  // after confirming the canal step (plateforme/administrateur/rien) and
  // before its terminal notice (en attente, or clôturée) appears.
  const [canalConfirming, setCanalConfirming] = useState(false);
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
  // That checkpoint's own "non" branch — reached once a reply came in
  // without the coordonnées in it.
  const [peutContacterHebergeurAnswer, setPeutContacterHebergeurAnswer] = useState<YesNo>(null);
  // Canal administrateur's own continuation (isReclamationView) — its wait
  // loop, simpler than plateforme's: no relance, since there's nobody left
  // to escalate to beyond the administrateur.
  const [adminReponseAnswer, setAdminReponseAnswer] = useState<YesNo>(null);
  const [adminReponseTexte, setAdminReponseTexte] = useState('');
  const [adminReponseDateDraft, setAdminReponseDateDraft] = useState('');
  const [adminCoordonneesAnswer, setAdminCoordonneesAnswer] = useState<YesNo>(null);
  // Reached from the plateforme wait loop's own "Pouvez-vous contacter
  // l'administrateur ?" — "oui" sends a courrier (this confirm), then joins
  // the exact same administrateur wait loop as the canal chosen directly
  // (getAdministrateurWaitStep) instead of closing right away.
  const [administrateurEscaladeConfirmed, setAdministrateurEscaladeConfirmed] = useState(false);
  // Asked instead of Q1 when reopening a mention that was clôturée while
  // still waiting on the author (clotureReason 'hebergeur-sans-reponse' /
  // 'qa-sans-reponse') — reopening a mention closed any other way skips
  // straight to "Ajouter les informations" (see reouvertureNeedsResponseQuestion).
  const [reouvertureReponseAnswer, setReouvertureReponseAnswer] = useState<YesNo>(null);
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
  // Unlike contactTag above, this one tracks the live draft — it only
  // drives the "Créer une réclamation" button's own label, which should
  // reflect the answer as soon as it's picked instead of waiting on a save.
  const liveContactTag = getContactTag(reclamantDraft.rattacheContrat);
  const createSubmitLabel =
    liveContactTag === 'Client'
      ? 'Créer une réclamation client'
      : liveContactTag === 'Prospect'
        ? 'Créer une réclamation prospect'
        : 'Créer une réclamation';

  // The mention can't be answered directly, so it's closed out in place
  // instead: the slider stays open, its info stays visible, and a toast +
  // persistent grey notice confirm the new status.
  const [mentionCloturee, setMentionCloturee] = useState(isCloturee);
  // Clôture isn't final — kept true even after a réouverture so the
  // historique still shows that step happened, instead of erasing it the
  // moment mentionCloturee flips back to false.
  const [wasEverCloturee, setWasEverCloturee] = useState(isCloturee);
  // Mirrors savedClotureReason until handleClotureMention sets a new one —
  // not derived live from canalAnswer/coordonneesCheckpoint/
  // peutContacterHebergeurAnswer, since those get reset to null the moment
  // "Rouvrir la mention" is clicked and would otherwise forget which one it
  // was.
  const [clotureReason, setClotureReasonState] = useState<ClotureReason>(savedClotureReason ?? null);
  const setClotureReason = (reason: ClotureReason) => {
    setClotureReasonState(reason);
    onSetClotureReason(reason);
  };
  const [clotureToast, setClotureToast] = useState(false);
  const clotureToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [todayLabel] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const bodyRef = useRef<HTMLDivElement>(null);

  // Each handler below only resets the *next* answer down the tree — deeper
  // answers are left untouched, so flipping back to a combination already
  // answered before re-reveals it pre-filled instead of blank.
  const handleReclamationTypeAnswerChange = (value: 'oui' | 'non') => {
    setReclamationTypeAnswer(value);
    setIdentifiedAnswer(null);
    setCanalAnswer(null);
  };
  const handleIdentifiedAnswerChange = (value: 'oui' | 'non') => {
    setIdentifiedAnswer(value);
    setCanalAnswer(null);
  };
  const handleCanalAnswerChange = (value: Exclude<CanalAnswer, null>) => {
    setCanalAnswer(value);
    setEusReponseAnswer(null);
    setRelanceConfirmed(false);
    setReponseApresRelanceAnswer(null);
    setCoordonneesCheckpoint(null);
    setPeutContacterHebergeurAnswer(null);
    setAdminReponseAnswer(null);
    setAdminCoordonneesAnswer(null);
  };
  const handleAdminReponseChange = (value: 'oui' | 'non') => {
    setAdminReponseAnswer(value);
    setAdminCoordonneesAnswer(null);
  };
  const handleEusReponseChange = (value: 'oui' | 'non') => {
    setEusReponseAnswer(value);
    setRelanceConfirmed(false);
    setReponseApresRelanceAnswer(null);
    setCoordonneesCheckpoint(null);
    setPeutContacterHebergeurAnswer(null);
    setAdministrateurEscaladeConfirmed(false);
    setAdminReponseAnswer(null);
    setAdminCoordonneesAnswer(null);
  };
  const handleReponseApresRelanceChange = (value: 'oui' | 'non') => {
    setReponseApresRelanceAnswer(value);
    setCoordonneesCheckpoint(null);
    setPeutContacterHebergeurAnswer(null);
    setAdministrateurEscaladeConfirmed(false);
    setAdminReponseAnswer(null);
    setAdminCoordonneesAnswer(null);
  };
  const handleCoordonneesCheckpointChange = (value: 'oui' | 'non') => {
    setCoordonneesCheckpoint(value);
    setPeutContacterHebergeurAnswer(null);
    setAdministrateurEscaladeConfirmed(false);
    setAdminReponseAnswer(null);
    setAdminCoordonneesAnswer(null);
  };
  const handlePeutContacterHebergeurChange = (value: 'oui' | 'non') => {
    setPeutContacterHebergeurAnswer(value);
    setAdministrateurEscaladeConfirmed(false);
    setAdminReponseAnswer(null);
    setAdminCoordonneesAnswer(null);
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
  // Once a réclamation exists (isMesReclamations, or enAttenteConfirmed —
  // confirmed within this same session, before the mention prop itself
  // refreshes), the mentions-page view of it always reads "Réclamation
  // ouverte" — it only cares that one exists. But this *is* the
  // réclamation's own page once isReclamationView: visually it looks like
  // the same slider, but it isn't the same thing, and its badge needs to
  // show its real état instead — "En attente" for plateforme/administrateur
  // (both stay open, waiting on a reply), "Clôturée" for "rien" (closed
  // right away, nobody left to contact).
  const badgeState: ReclamationState =
    isMesReclamations || enAttenteConfirmed
      ? isReclamationView
        ? canalAnswer === 'rien' ||
          mentionCloturee ||
          clotureReason === 'administrateur-apres-reponse' ||
          clotureReason === 'administrateur-sans-reponse'
          ? 'cloturee'
          : 'en-attente'
        : 'mes-reclamations'
      : mentionCloturee
        ? 'cloturee'
        // Once réouverte (even before that's saved), the mention isn't
        // "cloturée" any more either — falling through to reclamation.state
        // here would show its stale clôturée badge again, since that prop
        // doesn't update while the slider stays open.
        : wasEverCloturee
          ? 'a-traiter'
          : reclamation.state;
  const badge = STATE_BADGE[badgeState];

  // The "identité selon ce formulaire" question (which used to decide this)
  // belonged to the old Q1 — pending the next round of changes to the
  // "plateforme" canal's own steps, the send date is always added
  // automatically for now.
  const needsManualDate = false;

  const reclamationTypeAnswerMissing = showContactErrors && !reclamationTypeAnswer;
  const identifiedAnswerMissing = showContactErrors && !identifiedAnswer;
  const canalAnswerMissing = showContactErrors && identifiedAnswer === 'non' && !canalAnswer;
  const peutContacterHebergeurAnswerMissing =
    showContactErrors && coordonneesCheckpoint === 'non' && !peutContacterHebergeurAnswer;
  const hasRetourDetail =
    eusReponseAnswer === 'oui' || reponseApresRelanceAnswer === 'oui' || reouvertureReponseAnswer === 'oui';
  const retourDateMissing = showContactErrors && hasRetourDetail && !retourDateDraft;
  const adminReponseDateMissing = showContactErrors && adminReponseAnswer === 'oui' && !adminReponseDateDraft;
  const isAdministrateurAlreadyCloture =
    clotureReason === 'administrateur-apres-reponse' || clotureReason === 'administrateur-sans-reponse';
  const demandeDateMissing = showContactErrors && needsManualDate && !enAttenteConfirmed && !demandeDateDraft;
  // Read back from the réclamation's own persisted historique (not local
  // state, which resets every time this slider reopens) so the "en attente"
  // banner can show real dates instead of a vague "un mois" — both the
  // direct "Contacter l'administrateur" canal choice and the plateforme wait
  // loop's own escalade confirm persist this same entry right away.
  const administrateurContactDate =
    linkedComplaintHistorique?.find((entry) => entry.title === "Courrier envoyé à l'administrateur de la plateforme")
      ?.date ?? todayLabel;
  const administrateurClotureAvailableDate = addDaysToFrDate(administrateurContactDate, 30);
  // Only the "pas de réponse du tout" dead end (adminReponseAnswer === 'non')
  // actually waits out the full month — once a réponse did come in without
  // coordonnées, there's nothing further to wait on, so that one clôture
  // right away.
  const administrateurClotureLocked = (() => {
    if (adminReponseAnswer !== 'non') return false;
    const availableDate = parseFrDate(administrateurClotureAvailableDate);
    if (!availableDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    availableDate.setHours(0, 0, 0, 0);
    return today < availableDate;
  })();

  const questionRow = (text: string, value: YesNo, onChange: (v: 'oui' | 'non') => void, error?: boolean) => (
    <div className="dossier-question-row">
      <span className="dossier-question-text">
        {text}
        <span className="field-required">*</span>
      </span>
      <ChoiceToggle value={value} onChange={onChange} error={error} />
    </div>
  );

  // The title distinguishes the initial demande from a relance — both land
  // on the same warning shape, but at a glance they otherwise read as the
  // same wait, even though a relance means the first message went
  // unanswered.
  const renderEnAttenteAlert = (text: string, title = 'En attente du retour du client suite à la demande initiale') => (
    <div className="dossier-alert-warning">
      <div className="dossier-alert-warning-title-row">
        <AlertTriangleIcon />
        <span className="dossier-alert-warning-title">{title}</span>
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
      "Je confirme avoir envoyé le message de demande de coordonnées à l'auteur du commentaire.",
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
      "Je confirme avoir envoyé le message de relance à l'auteur du commentaire.",
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
      "Je confirme avoir envoyé le courrier à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire.",
      clotureCertified,
      (checked) => {
        setClotureCertified(checked);
        if (checked) setClotureCertifyMissing(false);
      },
      clotureCertifyMissing,
    );

  // Required before "Clôturer la mention" accepts that there's really
  // nothing left to try — the "Aucune action possible" / "Je ne peux rien
  // faire" terminal, which shares clotureCertified/clotureCertifyMissing
  // with the courrier path above since only one of the two ever applies at
  // once.
  const renderQaNotifieeCertifyCheckbox = () =>
    renderCertifyCheckbox(
      "Je confirme qu'aucune action supplémentaire n'est possible pour obtenir les coordonnées de l'auteur du commentaire.",
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
          label="Nom de l'auteur du commentaire"
          required
          placeholder="Entrez le nom de l'auteur du commentaire"
          value={reclamantDraft.nom}
          error={showContactErrors && !reclamantDraft.nom}
          errorText={showContactErrors && !reclamantDraft.nom ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
        />
        <FormField
          label="Prénom de l'auteur du commentaire"
          required
          placeholder="Entrez le prénom de l'auteur du commentaire"
          value={reclamantDraft.prenom}
          error={showContactErrors && !reclamantDraft.prenom}
          errorText={showContactErrors && !reclamantDraft.prenom ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
        />
      </div>
      <div className="modal-row">
        <FormField
          label="Email"
          placeholder="Entrez une adresse email"
          value={reclamantDraft.email}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
        />
        <FormField
          label="Numéro de téléphone"
          placeholder="Entrez le numéro de téléphone"
          value={reclamantDraft.telephone}
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
          L'auteur du commentaire est-il rattaché à un contrat ?<span className="field-required">*</span>
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
      {reclamantDraft.rattacheContrat === 'oui' && (
        <div className="dossier-alert-info">
          <p>
            L'auteur étant rattaché à un contrat, cette réclamation sera traitée selon les règles ACPR : elle sera
            soumise aux délais réglementaires et au suivi de conformité associés.
          </p>
        </div>
      )}
      {reclamantDraft.rattacheContrat === 'non' && (
        <div className="dossier-alert-info">
          <p>
            L'auteur n'étant pas rattaché à un contrat, cette réclamation concerne un prospect : elle doit tout de
            même être traitée, mais sans les délais réglementaires ni le suivi de conformité imposés par l'ACPR.
          </p>
        </div>
      )}
    </div>
  );

  // Reached from the plateforme wait loop's own "Pouvez-vous contacter
  // l'administrateur ?" — "oui" sends a courrier, same as the initial
  // "Contacter l'administrateur" canal choice, and joins that exact same
  // wait loop afterwards (getAdministrateurWaitStep) instead of closing.
  const renderEscaladeAdministrateurFields = () => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            Téléchargez le document ci-dessous : il s'agit d'un courrier à envoyer à l'administrateur de la
            plateforme pour lui demander les informations de la personne à l'origine du commentaire, afin de pouvoir
            la contacter.
          </p>
          <p>
            Une fois envoyé, la réclamation restera en attente d'une réponse de l'administrateur. Un email sera
            également envoyé automatiquement à Qualité Assurance pour les avertir de la situation.
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

  // Shown for the initial "Contacter l'administrateur" canal choice — unlike
  // renderClotureOfferFields above (reached later, once a relance has
  // already failed and the hébergeur is the last resort), this is the
  // first attempt: the réclamation stays open instead of closing right
  // away, same as plateforme.
  const renderContacterAdministrateurFields = () => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            Téléchargez le document ci-dessous : il s'agit d'un courrier à envoyer à l'administrateur de la
            plateforme pour lui demander les informations de la personne à l'origine du commentaire, afin de pouvoir
            la contacter.
          </p>
          <p>
            Une fois la réclamation créée, elle restera en attente d'une réponse de l'administrateur. Si aucune
            réponse n'est obtenue sous un mois, la réclamation sera automatiquement clôturée.
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

  // The terminal reached from "Aucune action possible" / "Je ne peux rien
  // faire" — same shape as renderClotureOfferFields (confirm, then
  // clôturer), but there's nobody left to send a courrier to, so QA gets
  // notified automatically instead.
  const renderQaNotifieeFields = () => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            Les coordonnées de l'auteur du commentaire ne peuvent être obtenues par aucun autre moyen. La réclamation
            sera automatiquement clôturée.
          </p>
          <p>Un email sera envoyé à Qualité Assurance pour les avertir de la situation.</p>
        </div>
        {renderQaNotifieeCertifyCheckbox()}
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

  // Reached once a reply came in without the coordonnées in it. "Oui" sends
  // a courrier to the administrateur and joins that exact same wait loop
  // (getAdministrateurWaitStep) — the réclamation stays open, same as
  // choosing "Contacter l'administrateur" from the very start. "Non" has
  // nobody left to contact at all, so it closes right away.
  const getCoordonneesHebergeurBranch = (): Step =>
    stepQuestion(
      "Pouvez-vous contacter l'administrateur de la plateforme ?",
      peutContacterHebergeurAnswer,
      handlePeutContacterHebergeurChange,
      () =>
        peutContacterHebergeurAnswer === 'oui'
          ? administrateurEscaladeConfirmed
            ? getAdministrateurWaitStep()
            : { phase: 'administrateur-escalade-envoi', node: renderEscaladeAdministrateurFields() }
          : { phase: 'cloture-offer', node: renderQaNotifieeFields() },
      { error: peutContacterHebergeurAnswerMissing },
    );

  // The "Avez-vous les coordonnées...?" checkpoint reached from several
  // points in the wait loop (right after the reply, at J+3, after the
  // relance) — always the same question, same two outcomes.
  const getCoordonneesCheckpointStep = (): Step => {
    const retourDetail = hasRetourDetail ? renderRetourDetailFields() : null;
    const inner = stepQuestion(
      "Avez-vous récupéré les coordonnées de l'auteur du commentaire ?",
      coordonneesCheckpoint,
      handleCoordonneesCheckpointChange,
      () =>
        coordonneesCheckpoint === 'oui'
          ? { phase: 'reclamant', node: renderReclamantFields() }
          : getCoordonneesHebergeurBranch(),
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
      // "Oui" still asks "avez-vous récupéré les coordonnées ?" (the retour's
      // own detail fields show above it) — but "non" skips that question
      // entirely and goes straight to the hébergeur question, since no reply
      // at all after a relance already means no coordonnées were obtained.
      () =>
        reponseApresRelanceAnswer === 'oui' ? getCoordonneesCheckpointStep() : getCoordonneesHebergeurBranch(),
    );
    return {
      phase: inner.phase,
      node: (
        <>
          {renderEnAttenteAlert(
            `Message de relance envoyé le ${relanceDateDraft}. Le dossier reste en attente jusqu'à ce que vous indiquiez si l'auteur a répondu (délai maximum de 30 jours).`,
            'En attente du retour du client suite à la relance',
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

  // Canal administrateur's own continuation (isReclamationView), once a
  // réponse came in: "avez-vous eu les coordonnées ?" — "oui" carries on into
  // the same reclamant fields as every other path; "non" has nowhere further
  // to escalate to (unlike plateforme's hébergeur fallback), so it goes
  // straight to clôture.
  const getAdministrateurCoordonneesStep = (): Step => {
    const reponseDetail =
      adminReponseAnswer === 'oui' ? (
        <>
          <FormTextareaAutoGrow
            label="Réponse de l'administrateur"
            placeholder="Collez ici la réponse de l'administrateur de la plateforme"
            value={adminReponseTexte}
            onChange={setAdminReponseTexte}
          />
          <div className="modal-row">
            <FormField
              label="Date de la réponse de l'administrateur"
              required
              type="date"
              placeholder="JJ/MM/AAAA"
              value={adminReponseDateDraft}
              error={adminReponseDateMissing}
              errorText={adminReponseDateMissing ? 'Champ requis' : undefined}
              onChange={setAdminReponseDateDraft}
            />
            <div className="dossier-field-spacer" />
          </div>
        </>
      ) : null;
    const inner = stepQuestion(
      "Avez-vous récupéré les coordonnées de l'auteur du commentaire ?",
      adminCoordonneesAnswer,
      setAdminCoordonneesAnswer,
      () =>
        adminCoordonneesAnswer === 'oui'
          ? { phase: 'reclamant', node: renderReclamantFields() }
          : { phase: 'administrateur-cloture', node: renderAdministrateurClotureFields('coordonnees') },
    );
    return { phase: inner.phase, node: (<>{reponseDetail}{inner.node}</>) };
  };

  // Canal administrateur's wait loop (isReclamationView) — simpler than
  // plateforme's: no relance, since there's nobody further to escalate to
  // beyond the administrateur already contacted.
  const getAdministrateurWaitStep = (): Step =>
    stepQuestion(
      "Avez-vous eu une réponse de la part de l'administrateur ?",
      adminReponseAnswer,
      handleAdminReponseChange,
      () =>
        adminReponseAnswer === 'oui'
          ? getAdministrateurCoordonneesStep()
          : { phase: 'administrateur-cloture', node: renderAdministrateurClotureFields('reponse') },
    );

  const renderAdministrateurClotureFields = (reason: 'reponse' | 'coordonnees') => (
    <div className="dossier-treatment-fields">
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            {reason === 'reponse'
              ? administrateurClotureLocked
                ? `L'administrateur de la plateforme n'a pas répondu à la demande. La réclamation pourra être clôturée à partir du ${administrateurClotureAvailableDate}.`
                : "L'administrateur de la plateforme n'a pas répondu à la demande. La réclamation va être clôturée."
              : "L'administrateur de la plateforme n'a pas transmis les coordonnées de l'auteur du commentaire. La réclamation va être clôturée."}
          </p>
          <p>Un email sera envoyé à Qualité Assurance pour les avertir de la situation.</p>
        </div>
      </div>
    </div>
  );

  // The wording for why the mention was clôturée differs by clotureReason —
  // in particular, the "-apres-reponse" / "-sans-reponse" variants need to
  // say whether the author actually replied (just without their
  // coordonnées) or never replied at all, even after the relance. Shared by
  // the historique entry and the "Mention clôturée" summary so the two
  // don't drift apart. Declared here (ahead of getCanalBranch, which also
  // reads it) rather than down by clotureReason's other usages, since
  // getCanalBranch runs during this same render, before that point.
  const CLOTURE_DESCRIPTIONS: Record<Exclude<typeof clotureReason, null>, string> = {
    administrateur:
      "L'auteur du commentaire n'a pas pu être contacté directement, un courrier a donc été envoyé à l'administrateur de la plateforme afin d'obtenir ses coordonnées.",
    qa: "Les coordonnées de l'auteur du commentaire n'ont pas pu être obtenues : Qualité Assurance a été notifiée automatiquement de la situation.",
    'hebergeur-apres-reponse':
      "L'auteur du commentaire a répondu sans transmettre ses coordonnées, un courrier a donc été envoyé à l'administrateur de la plateforme afin de les obtenir.",
    'qa-apres-reponse':
      "L'auteur du commentaire a répondu sans transmettre ses coordonnées et l'administrateur de la plateforme ne peut pas être contacté : Qualité Assurance a été notifiée automatiquement de la situation.",
    'hebergeur-sans-reponse':
      "L'auteur du commentaire n'a pas répondu, même après la relance. Un courrier a été envoyé à l'administrateur de la plateforme afin d'obtenir ses coordonnées.",
    'qa-sans-reponse':
      "L'auteur du commentaire n'a pas répondu, même après la relance, et l'administrateur de la plateforme ne peut pas être contacté : Qualité Assurance a été notifiée automatiquement de la situation.",
    'administrateur-apres-reponse':
      "L'administrateur de la plateforme a répondu sans transmettre les coordonnées de l'auteur du commentaire : Qualité Assurance a été notifiée automatiquement de la situation.",
    'administrateur-sans-reponse':
      "L'administrateur de la plateforme n'a pas répondu à la demande : Qualité Assurance a été notifiée automatiquement de la situation.",
  };
  const clotureDescription = clotureReason ? CLOTURE_DESCRIPTIONS[clotureReason] : '';

  const CANAL_OPTIONS: { value: Exclude<CanalAnswer, null>; title: string; description: string }[] = [
    {
      value: 'plateforme',
      title: 'Répondre sur la plateforme',
      description: "Vous pouvez envoyer un message à l'auteur directement en réponse à son commentaire.",
    },
    {
      value: 'administrateur',
      title: "Contacter l'administrateur",
      description: "Vous pouvez joindre l'administrateur de la plateforme pour obtenir les coordonnées de l'auteur.",
    },
    {
      value: 'rien',
      title: 'Aucune action possible',
      description: "Vous ne pouvez ni répondre sur la plateforme, ni contacter l'administrateur.",
    },
  ];

  // Q1 = "non" branch: the author isn't identified — which of the three ways
  // of handling that applies here decides what shows below.
  const getCanalBranch = (): Step => {
    const row = (
      <div className="dossier-question-row dossier-question-row-stacked">
        <span className="dossier-question-text">
          Quelle option correspond à votre situation ?<span className="field-required">*</span>
        </span>
        <ChoiceColumn value={canalAnswer} onChange={handleCanalAnswerChange} options={CANAL_OPTIONS} error={canalAnswerMissing} />
      </div>
    );
    if (!canalAnswer) return { phase: 'question', node: row };
    let next: Step;
    if (canalAnswer === 'plateforme') {
      next = enAttenteConfirmed ? getWaitLoopStep() : { phase: 'envoi', node: renderEnvoiDemandeFields() };
    } else if (canalAnswer === 'administrateur') {
      // Same as plateforme — stays open, en attente d'une réponse (here,
      // from the administrateur rather than the author directly), with its
      // own wait loop (getAdministrateurWaitStep) — see
      // renderContacterAdministrateurFields for the initial envoi.
      next = enAttenteConfirmed ? getAdministrateurWaitStep() : { phase: 'envoi', node: renderContacterAdministrateurFields() };
    } else {
      // "Aucune action possible" — same QA-notified content as before, but
      // now also creates (then immediately clôture) the réclamation.
      next = enAttenteConfirmed
        ? {
            phase: 'waiting',
            node: (
              <div className="dossier-alert-neutral">
                <span className="dossier-alert-neutral-title">Mention clôturée</span>
                <p>{CLOTURE_DESCRIPTIONS.qa}</p>
              </div>
            ),
          }
        : { phase: 'envoi', node: renderQaNotifieeFields() };
    }
    return { phase: next.phase, node: (<>{row}<Fragment key={canalAnswer}>{next.node}</Fragment></>) };
  };

  // Shown instead of Q0/Q1/canal (isReclamationView — opening an existing
  // réclamation from "Non identifiés") — those questions are already
  // answered, so this jumps straight to the continuation itself: the wait
  // loop for plateforme or administrateur, or the clôturée notice for
  // "rien" (and, once answered, for administrateur too).
  const renderReclamationContinuation = (): ReactNode => {
    if (canalAnswer === 'administrateur') {
      if (isAdministrateurAlreadyCloture) {
        return (
          <div className="dossier-alert-neutral">
            <span className="dossier-alert-neutral-title">Réclamation clôturée</span>
            <p>{clotureDescription}</p>
          </div>
        );
      }
      return (
        <>
          {renderEnAttenteAlert(
            `Courrier envoyé à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire. En l'absence de réponse, vous pourrez clôturer la réclamation à partir du ${administrateurClotureAvailableDate}.`,
            "En attente du retour de l'administrateur de la plateforme",
          )}
          {getAdministrateurWaitStep().node}
        </>
      );
    }
    if (canalAnswer === 'rien') {
      return (
        <div className="dossier-alert-neutral">
          <span className="dossier-alert-neutral-title">Réclamation clôturée</span>
          <p>{CLOTURE_DESCRIPTIONS.qa}</p>
        </div>
      );
    }
    if (administrateurEscaladeConfirmed) {
      // Escalated via the plateforme wait loop's own dead end ("pas de
      // coordonnées, pouvez-vous contacter l'administrateur ?" → oui) — once
      // that courrier is sent, drop the whole earlier trail that led here
      // (réponse/coordonnées/contacter-administrateur questions) instead of
      // stacking the new continuation underneath it, and show the exact
      // same administrateur continuation as when that canal is chosen
      // directly from the start.
      return (
        <>
          {renderEnAttenteAlert(
            `Courrier envoyé à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire. En l'absence de réponse, vous pourrez clôturer la réclamation à partir du ${administrateurClotureAvailableDate}.`,
            "En attente du retour de l'administrateur de la plateforme",
          )}
          {getAdministrateurWaitStep().node}
        </>
      );
    }
    return (
      <>
        {/* Stays up through either answer's own immediate next step too —
            picking "Oui"/"Non" is just a selection, not a confirmation of
            anything yet: "Non" leads to the relance template (nothing sent
            until relanceConfirmed) and "Oui" leads to the retour detail
            fields + "avez-vous récupéré les coordonnées ?" (nothing settled
            until that's answered). Only once one of those is actually
            confirmed does a more specific notice take over (getRelanceStep's
            own "en attente", or the reclamant/hébergeur step beyond). */}
        {(eusReponseAnswer === null ||
          (eusReponseAnswer === 'non' && !relanceConfirmed) ||
          (eusReponseAnswer === 'oui' && coordonneesCheckpoint === null)) &&
          renderEnAttenteAlert(
            `Demande d'information envoyée à l'auteur de la mention le ${demandeDateDraft}. Le dossier reste en attente jusqu'à ce que vous indiquiez si l'auteur a répondu. Si aucune action n'est faite, une relance sera disponible à partir du ${addDaysToFrDate(demandeDateDraft, 3)}.`,
          )}
        {getWaitLoopStep().node}
      </>
    );
  };

  // Walks the flowchart node by node from Q1 — each question stays visible
  // once reached, with whatever comes next appended right below it.
  const getTreatmentStep = (): Step =>
    stepQuestion(
      'Avez-vous identifié l\'auteur du commentaire ?',
      identifiedAnswer,
      handleIdentifiedAnswerChange,
      () => (identifiedAnswer === 'oui' ? { phase: 'reclamant', node: renderReclamantFields() } : getCanalBranch()),
      { error: identifiedAnswerMissing },
    );

  const RECLAMATION_TYPE_OPTIONS: { value: Exclude<YesNo, null>; title: string; description: string }[] = [
    {
      value: 'oui',
      title: 'Oui, c’est une réclamation',
      description: 'L’auteur exprime un mécontentement, conteste une décision ou demande de revoir sa situation.',
    },
    {
      value: 'non',
      title: 'Non, ce n’est pas une réclamation',
      description: 'L’auteur pose une question, demande une information ou un conseil, sans exprimer de mécontentement.',
    },
  ];

  // Q0 — asked before Q1: does this mention even qualify as a réclamation?
  // "Oui" carries on directly into the existing Q1 flow — no confirm/loading
  // step in between (that only happens once, at the end of the canal
  // branch). "Non" has no outcome defined yet, so it just leaves the
  // question showing for now.
  const getReclamationTypeStep = (): Step => {
    const row = (
      <div className="dossier-question-row dossier-question-row-stacked">
        <span className="dossier-question-text">
          Considérez-vous cette mention comme étant une réclamation ?<span className="field-required">*</span>
        </span>
        <ChoiceColumn
          value={reclamationTypeAnswer}
          onChange={handleReclamationTypeAnswerChange}
          options={RECLAMATION_TYPE_OPTIONS}
          error={reclamationTypeAnswerMissing}
        />
      </div>
    );
    if (!reclamationTypeAnswer || reclamationTypeAnswer === 'non') return { phase: 'question', node: row };
    const next = getTreatmentStep();
    return { phase: next.phase, node: (<>{row}<Fragment key="oui">{next.node}</Fragment></>) };
  };

  // True as soon as "Rouvrir la mention" is clicked — drives what's shown
  // locally (skipping Q1, the historique preview) even though nothing about
  // the mention's actual status changes until a réclamation gets created;
  // saving a draft here flips mentionCloturee back to true, so this goes
  // back to false too.
  const reouvertureActive = wasEverCloturee && !mentionCloturee;

  // Reopening skips Q1 entirely, but what it lands on next depends on how
  // the mention got clôturée: if it was still waiting on the author
  // (clôturée straight from "pas de réponse même après la relance"), that
  // question is asked again first, since a réponse may have come in since;
  // any other clôture already means the author was never going to reply on
  // the platform, so there's nothing left to ask before "Ajouter les
  // informations".
  const reouvertureNeedsResponseQuestion =
    clotureReason === 'hebergeur-sans-reponse' || clotureReason === 'qa-sans-reponse';
  const getReouvertureStep = (): Step => {
    if (!reouvertureNeedsResponseQuestion) {
      return { phase: 'reclamant', node: renderReclamantFields() };
    }
    return stepQuestion(
      'Avez-vous reçu une réponse de la part de l\'auteur du commentaire ?',
      reouvertureReponseAnswer,
      setReouvertureReponseAnswer,
      () => ({
        phase: 'reclamant',
        node: (
          <>
            {reouvertureReponseAnswer === 'oui' && renderRetourDetailFields()}
            {renderReclamantFields()}
          </>
        ),
      }),
    );
  };

  const step = reouvertureActive ? null : getReclamationTypeStep();
  const reouvertureStep = reouvertureActive ? getReouvertureStep() : null;
  const showingReclamantFields = reouvertureActive
    ? reouvertureStep?.phase === 'reclamant'
    : step?.phase === 'reclamant' && !mentionCloturee;
  const showingClotureOffer = !reouvertureActive && step?.phase === 'cloture-offer' && !mentionCloturee;
  const isEnvoiStep = !reouvertureActive && step?.phase === 'envoi';
  const isRelanceEnvoiStep = !reouvertureActive && step?.phase === 'relance-envoi';
  // Terminal of the administrateur continuation's own wait loop — hidden
  // again once that clôture is actually confirmed (isAdministrateurAlreadyCloture),
  // so the button doesn't linger once there's nothing left to confirm.
  const isAdministrateurClotureStep =
    !reouvertureActive && step?.phase === 'administrateur-cloture' && !isAdministrateurAlreadyCloture;
  const isAdministrateurEscaladeEnvoiStep = !reouvertureActive && step?.phase === 'administrateur-escalade-envoi';

  // Whether the sticky footer has anything to show — e.g. while waiting on
  // a retour answer, no action applies yet, so the footer itself shouldn't
  // render (an empty bar would just clip the content above it).
  const hasFooterActions =
    (isMesReclamations && !isReclamationView) ||
    (enAttenteConfirmed && !isReclamationView) ||
    (activeTab === 'informations' &&
      (showingClotureOffer ||
        showingReclamantFields ||
        isEnvoiStep ||
        isRelanceEnvoiStep ||
        isAdministrateurClotureStep ||
        isAdministrateurEscaladeEnvoiStep ||
        (mentionCloturee && !isReclamationView) ||
        reouvertureActive));

  const reclamantFieldsMissing =
    !reclamantDraft.nom ||
    !reclamantDraft.prenom ||
    !reclamantDraft.rattacheContrat ||
    (reclamantDraft.rattacheContrat === 'oui' && !reclamantDraft.statutClient);

  // The mention's own trail so far — carried over into the new réclamation's
  // historique on submit, and shown as-is here until a réclamation exists.
  const historiqueEntries: HistoriqueEntry[] = [
    { title: 'Réception de la mention', description: `Mention reçue via ${canal}.`, date: reclamation.date, author: 'Système' },
    ...(enAttenteConfirmed
      ? [
          {
            title: 'Confirmation de la demande de contact',
            description: `Demande de coordonnées envoyée à l'auteur du commentaire.`,
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
            description: "Message de relance envoyé à l'auteur du commentaire après l'absence de réponse.",
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
    ...(adminReponseAnswer === 'oui' && adminReponseTexte.trim() !== ''
      ? [
          {
            title: "Réponse de l'administrateur de la plateforme",
            description: "L'administrateur de la plateforme a répondu à la demande de coordonnées.",
            date: adminReponseDateDraft || todayLabel,
            author: 'Joe Bleau',
            changes: [{ label: 'Réponse', value: adminReponseTexte }],
          },
        ]
      : []),
    ...(administrateurEscaladeConfirmed
      ? [
          {
            title: "Courrier envoyé à l'administrateur de la plateforme",
            description:
              "Courrier envoyé à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire.",
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
    // Every "Enregistrer" on the reclamant draft adds one of these (see
    // handleSaveDraft) — persisted by the parent so they survive the slider
    // closing and reopening.
    ...(savedDraftHistorique ?? []),
    ...(wasEverCloturee
      ? [
          {
            title: 'Clôture de la mention',
            description: clotureDescription,
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
    // Shown while the réouverture is active and also carried over into the
    // new réclamation's historique on submit (handleSubmit calls onSubmit
    // with this very array) — but not after a plain save, which reverts
    // reouvertureActive to false since nothing was actually reopened yet.
    ...(reouvertureActive
      ? [
          {
            title: 'Réouverture de la mention',
            description: "Les coordonnées de l'auteur du commentaire ont été obtenues : la mention est à nouveau à traiter.",
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

  // Réouvrir la mention only ever creates a réclamation or goes back to
  // "Mention clôturée" (via "Annuler") — there's no save-for-later step in
  // between any more, so closing mid-réouverture (whatever was typed)
  // discards it the same way, no confirmation needed: the mention just ends
  // up clôturée, as if réouvrir had never been clicked.
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
  // pick up a partially filled dossier later. Only reachable from Q1's
  // "oui" branch — a réouverture skips straight to "Annuler" ou "Créer la
  // réclamation" instead, with no save-for-later step of its own.
  const handleSaveDraft = () => {
    const changed: { label: string; value: string }[] = [];
    if (reclamantDraft.nom !== savedDraftSnapshot.nom) changed.push({ label: 'Nom', value: reclamantDraft.nom || '-' });
    if (reclamantDraft.prenom !== savedDraftSnapshot.prenom)
      changed.push({ label: 'Prénom', value: reclamantDraft.prenom || '-' });
    if (reclamantDraft.email !== savedDraftSnapshot.email)
      changed.push({ label: 'Email', value: reclamantDraft.email || '-' });
    if (reclamantDraft.telephone !== savedDraftSnapshot.telephone)
      changed.push({ label: 'Téléphone', value: reclamantDraft.telephone || '-' });
    if (reclamantDraft.denominationSociale !== savedDraftSnapshot.denominationSociale)
      changed.push({ label: 'Dénomination sociale', value: reclamantDraft.denominationSociale || '-' });
    if (reclamantDraft.porteurDuRisque !== savedDraftSnapshot.porteurDuRisque)
      changed.push({ label: 'Assureur / Porteur du risque', value: reclamantDraft.porteurDuRisque || '-' });
    if (reclamantDraft.rattacheContrat !== savedDraftSnapshot.rattacheContrat)
      changed.push({
        label: 'Rattaché à un contrat',
        value: reclamantDraft.rattacheContrat === 'oui' ? 'Oui' : reclamantDraft.rattacheContrat === 'non' ? 'Non' : '-',
      });
    if (reclamantDraft.statutClient !== savedDraftSnapshot.statutClient)
      changed.push({
        label: 'Statut du client',
        value: reclamantDraft.statutClient ? STATUT_CLIENT_LABEL[reclamantDraft.statutClient] : '-',
      });

    onSaveReclamantDraft(reclamantDraft);
    setSavedDraftSnapshot(reclamantDraft);
    if (changed.length > 0) {
      onAppendDraftHistorique({
        title: "Modification des informations de l'auteur du commentaire",
        description: `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`,
        date: todayLabel,
        author: 'Joe Bleau',
        changes: changed,
      });
    }
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
    // coordonneesCheckpoint stays null when the hébergeur question was
    // reached straight from "pas de réponse même après la relance" —
    // it's only ever set to 'non' when a reply did come in without the
    // coordonnées in it.
    const gotReply = coordonneesCheckpoint === 'non';
    const reason: Exclude<ClotureReason, null> =
      canalAnswer === 'rien'
        ? 'qa'
        : canalAnswer === 'administrateur'
          ? 'administrateur'
          : peutContacterHebergeurAnswer === 'oui'
            ? gotReply
              ? 'hebergeur-apres-reponse'
              : 'hebergeur-sans-reponse'
            : gotReply
              ? 'qa-apres-reponse'
              : 'qa-sans-reponse';
    setClotureReason(reason);
    if (isReclamationView) {
      // The réclamation already exists — persist its own clôture onto the
      // complaint record too (not just this slider's local notice), so the
      // réclamations list and its own badge still reflect it once the
      // slider's been fully closed and reopened.
      onConfirmContactAttempt(
        {
          prenom: '',
          nom: '',
          canal,
          dateReception,
          email: '',
          telephone: '',
          denominationSociale: '',
          porteurDuRisque: '',
          rattacheContrat: '',
          statutClient: '',
          objet,
          notesInternes: '',
          description: reclamation.text,
        },
        historiqueEntries,
        'plateforme',
        { title: 'Réclamation clôturée', description: CLOTURE_DESCRIPTIONS[reason], date: todayLabel },
      );
    } else {
      onClotureMention();
    }
    setMentionCloturee(true);
    setWasEverCloturee(true);
    setClotureToast(true);
    if (clotureToastTimeout.current) clearTimeout(clotureToastTimeout.current);
    clotureToastTimeout.current = setTimeout(() => setClotureToast(false), 3000);
  };

  // Clôture isn't final — this takes local effect only (showing
  // getReouvertureStep below instead of "Mention clôturée"); the mention
  // only actually leaves clôturée once a réclamation gets created from it.
  // "Annuler" or closing the slider both go straight back to clôturée —
  // there's no save-for-later step in between any more.
  const handleReouvrirMention = () => {
    setMentionCloturee(false);
    setClotureCertified(false);
    setClotureCertifyMissing(false);
    setIdentifiedAnswer(null);
    setCanalAnswer(null);
    setReouvertureReponseAnswer(null);
    setRetourTexte('');
    setRetourDateDraft('');
    // The réouverture flow is a fresh start, independent of however the
    // mention got to clôturée in the first place — without resetting these,
    // their stale values (e.g. enAttenteConfirmed still true) would make the
    // old wait-loop render instead of getReouvertureStep.
    setEnAttenteConfirmed(false);
    setEusReponseAnswer(null);
    setReponseApresRelanceAnswer(null);
    setPeutContacterHebergeurAnswer(null);
    setCoordonneesCheckpoint(null);
    setRelanceConfirmed(false);
    setRelanceCertified(false);
    setRelanceCertifyMissing(false);
    setDemandeCertified(false);
    setDemandeCertifyMissing(false);
  };

  // "Annuler" on the réouverture — discards whatever was typed (the
  // reclamant draft reverts to its last saved snapshot) and goes back to
  // showing "Mention clôturée", same end state as closing the slider without
  // saving.
  const handleCancelReouverture = () => {
    setReclamantDraft(savedDraftSnapshot);
    setReouvertureReponseAnswer(null);
    setRetourTexte('');
    setRetourDateDraft('');
    setMentionCloturee(true);
  };

  // Confirms the message/courrier sent to try and reach the author (canal
  // plateforme ou administrateur) — the date is entered by hand only when
  // needsManualDate; otherwise it's today's date, added automatically.
  // Unlike the rest of the flow, this doesn't wait on a reply: the
  // réclamation is created right away (author still "à déterminer" — the
  // réclamant fields stay blank, to be filled in once identified), and its
  // own continuation happens from the réclamations page's "Auteur à
  // déterminer" segment instead of this slider.
  // Builds and upserts the réclamation for whichever canal step is being
  // confirmed, with the same full-slider "Création de la réclamation…" beat
  // as the réclamations page's own create flow (just shown in place, since
  // the mention slider stays open throughout). "Plateforme" leaves the
  // réclamation open, waiting on a reply; "administrateur"/"rien" close it
  // right away — there's nobody left to hear back from directly.
  const handleConfirmDemande = () => {
    if (canalAnswer === 'plateforme') {
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
      setCanalConfirming(true);
      onConfirmContactAttempt(
        {
          // Blank, not reclamantDraft's — this canal means the author isn't
          // identified, and reclamantDraft can hold stale answers from a
          // brief earlier detour through "identifié ? Oui" (switching Q1
          // back and forth doesn't clear it, by design — see
          // handleIdentifiedAnswerChange). Trusting it here would wrongly
          // classify this réclamation as Client/Prospect instead of landing
          // it in "Non identifiés".
          prenom: '',
          nom: '',
          canal,
          dateReception,
          email: '',
          telephone: '',
          denominationSociale: '',
          porteurDuRisque: '',
          rattacheContrat: '',
          statutClient: '',
          objet,
          notesInternes: '',
          description: reclamation.text,
        },
        [
          { title: 'Réception de la mention', description: `Mention reçue via ${canal}.`, date: reclamation.date, author: 'Système' },
          {
            title: "Message envoyé à l'auteur du commentaire",
            description: "Message de demande de coordonnées envoyé à l'auteur du commentaire.",
            date,
            author: 'Joe Bleau',
          },
        ],
        'plateforme',
      );
      setTimeout(() => {
        setCanalConfirming(false);
        setEnAttenteConfirmed(true);
      }, CREATING_DELAY_MS);
      return;
    }

    // administrateur / rien — both share the courrier/QA certify checkbox.
    if (!clotureCertified) {
      setClotureCertifyMissing(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    const isAdministrateur = canalAnswer === 'administrateur';
    setCanalConfirming(true);
    onConfirmContactAttempt(
      {
        // Blank, not reclamantDraft's — see the plateforme branch above for
        // why this canal must never trust it.
        prenom: '',
        nom: '',
        canal,
        dateReception,
        email: '',
        telephone: '',
        denominationSociale: '',
        porteurDuRisque: '',
        rattacheContrat: '',
        statutClient: '',
        objet,
        notesInternes: '',
        description: reclamation.text,
      },
      [
        { title: 'Réception de la mention', description: `Mention reçue via ${canal}.`, date: reclamation.date, author: 'Système' },
        isAdministrateur
          ? {
              title: "Courrier envoyé à l'administrateur de la plateforme",
              description: "Courrier envoyé à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire.",
              date: todayLabel,
              author: 'Joe Bleau',
            }
          : {
              title: 'Qualité Assurance notifiée',
              description: CLOTURE_DESCRIPTIONS.qa,
              date: todayLabel,
              author: 'Joe Bleau',
            },
      ],
      isAdministrateur ? 'administrateur' : 'rien',
      // administrateur stays open — en attente d'une réponse de
      // l'administrateur, same as plateforme stays open waiting on the
      // author — so no closeReason here. Only "rien" (nobody left to
      // contact at all) closes right away.
      isAdministrateur
        ? undefined
        : {
            title: 'Mention clôturée',
            description: CLOTURE_DESCRIPTIONS.qa,
            date: todayLabel,
          },
    );
    setTimeout(() => {
      setCanalConfirming(false);
      setEnAttenteConfirmed(true);
    }, CREATING_DELAY_MS);
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

  // Confirms the courrier sent to the administrateur once the plateforme's
  // own relance led nowhere — same courrier/certify pattern as the initial
  // "Contacter l'administrateur" canal choice, but reached later: joins the
  // exact same wait loop afterwards instead of closing or creating a fresh
  // dossier.
  const handleConfirmAdministrateurEscalade = () => {
    if (!clotureCertified) {
      setClotureCertifyMissing(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    // Persisted right away (not just locally) so the courrier's real date is
    // readable back from linkedComplaintHistorique afterwards (see
    // administrateurContactDate) — same as the direct "Contacter
    // l'administrateur" canal choice. sourceCanal flips to 'administrateur'
    // too: once escalated, reopening this réclamation later should resume
    // straight into that continuation, not replay the whole plateforme trail.
    onConfirmContactAttempt(
      {
        prenom: '',
        nom: '',
        canal,
        dateReception,
        email: '',
        telephone: '',
        denominationSociale: '',
        porteurDuRisque: '',
        rattacheContrat: '',
        statutClient: '',
        objet,
        notesInternes: '',
        description: reclamation.text,
      },
      [
        ...historiqueEntries,
        {
          title: "Courrier envoyé à l'administrateur de la plateforme",
          description:
            "Courrier envoyé à l'administrateur de la plateforme afin d'obtenir les informations de l'auteur du commentaire.",
          date: todayLabel,
          author: 'Joe Bleau',
        },
      ],
      'administrateur',
    );
    setAdministrateurEscaladeConfirmed(true);
  };

  // Terminal of the administrateur continuation's own wait loop, reached
  // once either "non" is answered — closes the réclamation in place (same
  // QA-notified pattern as "rien", just reached later through the wait loop
  // instead of at the very first confirmation) and persists which "non" it
  // was via clotureReason, so the closed notice still explains itself
  // correctly after the slider's been fully closed and reopened.
  const handleClotureAdministrateurContinuation = () => {
    const reason = adminReponseAnswer === 'non' ? 'administrateur-sans-reponse' : 'administrateur-apres-reponse';
    setClotureReason(reason);
    onConfirmContactAttempt(
      {
        prenom: '',
        nom: '',
        canal,
        dateReception,
        email: '',
        telephone: '',
        denominationSociale: '',
        porteurDuRisque: '',
        rattacheContrat: '',
        statutClient: '',
        objet,
        notesInternes: '',
        description: reclamation.text,
      },
      historiqueEntries,
      'administrateur',
      {
        title: 'Réclamation clôturée',
        description: CLOTURE_DESCRIPTIONS[reason],
        date: todayLabel,
      },
    );
  };

  const handleSubmit = () => {
    const missing =
      reclamantFieldsMissing || (hasRetourDetail && !retourDateDraft) || (adminReponseAnswer === 'oui' && !adminReponseDateDraft);
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
        {/* Same full-panel loading look as the réclamations page's own
            "Création de la réclamation…" beat — just shown in place here
            instead of swapping to a different panel, since the mention
            slider stays open through the canal step's own confirmation. */}
        {canalConfirming ? (
          <div className="dossier-panel-loading">
            <span className="dossier-panel-loader" />
            <p className="dossier-panel-loading-text">Création de la réclamation…</p>
          </div>
        ) : (
          <>
        <div className="drawer-appbar">
          <span className="drawer-title">
            {isReclamationView && linkedComplaintTicket ? `Réclamation ${linkedComplaintTicket}` : 'Détail de la mention'}
          </span>
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

              {/* Same "déjà existante" box whether this is the very first time
                  (right after confirming, within this session — enAttenteConfirmed)
                  or a later reopen (isMesReclamations, from the prop) — once a
                  réclamation exists for this mention, its own treatment (en
                  attente, clôturée...) lives entirely on the réclamation's own
                  page, not here — unless this *is* that réclamation's own page
                  (isReclamationView), in which case that continuation is
                  exactly what shows below instead of this notice. */}
              {!isReclamationView && (isMesReclamations || enAttenteConfirmed) && !mentionCloturee && (
                <div className={treatmentBlockClassName()}>
                  <div className="dossier-alert-neutral">
                    <span className="dossier-alert-neutral-title">Réclamation ouverte</span>
                    <p>
                      Une réclamation a été ouverte à partir de cette mention. La suite de son traitement se poursuit
                      dans la page « Mes réclamations ».
                    </p>
                  </div>
                </div>
              )}

              {!isReclamationView && !isMesReclamations && mentionCloturee && (
                <div className={treatmentBlockClassName('dossier-treatment-block-spaced')}>
                  <div className="dossier-alert-neutral">
                    <span className="dossier-alert-neutral-title">Mention clôturée</span>
                    <p>{clotureDescription}</p>
                    <p>
                      Si ces coordonnées sont obtenues par la suite, la mention peut être rouverte pour reprendre son
                      traitement.
                    </p>
                  </div>
                </div>
              )}

              {!isReclamationView && !isMesReclamations && !mentionCloturee && !enAttenteConfirmed && (
                // No key here on purpose — each question's own answer keys
                // its Fragment further down (see stepQuestion/getCanalBranch/
                // getReclamationTypeStep), so only the newly-revealed content
                // underneath mounts (and animates) fresh; remounting this
                // whole block on every click would replay every already-
                // answered question's entrance too.
                <div className={treatmentBlockClassName()}>
                  {/* A réouverture skips Q0/Q1 — those questions don't apply any
                      more, since reopening the mention already answers them
                      (see getReouvertureStep). */}
                  {reouvertureActive ? reouvertureStep?.node : step?.node}
                </div>
              )}

              {/* isReclamationView: Q0/Q1/canal are already resolved, so this
                  jumps straight to the continuation instead of re-showing
                  them — renderReclamationContinuation reuses the same wait
                  loop (getWaitLoopStep), so it still carries through to the
                  reclamant fields once coordonnées are obtenues, same as the
                  normal flow; step?.phase bubbles up the same way too, so
                  the footer's "Créer une réclamation" button still shows
                  right on cue. */}
              {isReclamationView && !mentionCloturee && (
                <div className={treatmentBlockClassName()}>{renderReclamationContinuation()}</div>
              )}

              {/* Reached via the plateforme wait loop's own "pas de
                  coordonnées obtenables" dead end (handleClotureMention) —
                  no reopening offered here yet, unlike the mentions-page
                  equivalent, so this is a plain terminal notice. */}
              {isReclamationView && mentionCloturee && (
                <div className={treatmentBlockClassName()}>
                  <div className="dossier-alert-neutral">
                    <span className="dossier-alert-neutral-title">Réclamation clôturée</span>
                    <p>{clotureDescription}</p>
                  </div>
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
            {(isMesReclamations || enAttenteConfirmed) && !isReclamationView ? (
              <button type="button" className="btn-filled" onClick={onViewComplaint}>
                Voir la réclamation
              </button>
            ) : (
              <>
                {activeTab === 'informations' && showingClotureOffer && (
                  <button type="button" className="btn-filled" onClick={handleClotureMention}>
                    {isReclamationView ? 'Clôturer la réclamation' : 'Clôturer la mention'}
                  </button>
                )}
                {/* Not offered yet from the réclamation's own continuation
                    (isReclamationView) — see the "Réclamation clôturée"
                    notice above instead. */}
                {activeTab === 'informations' && mentionCloturee && !isReclamationView && (
                  <button type="button" className="btn-filled" onClick={handleReouvrirMention}>
                    Rouvrir la mention
                  </button>
                )}
                {activeTab === 'informations' && reouvertureActive && (
                  <button type="button" className="btn-text" onClick={handleCancelReouverture}>
                    Annuler
                  </button>
                )}
                {activeTab === 'informations' && showingReclamantFields && !reouvertureActive && (
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
                    {createSubmitLabel}
                  </button>
                )}
                {activeTab === 'informations' && isEnvoiStep && (
                  <button type="button" className="btn-filled" onClick={handleConfirmDemande}>
                    Confirmer et créer la réclamation
                  </button>
                )}
                {activeTab === 'informations' && isRelanceEnvoiStep && (
                  <button type="button" className="btn-filled" onClick={handleConfirmRelance}>
                    Confirmer
                  </button>
                )}
                {activeTab === 'informations' && isAdministrateurClotureStep && (
                  <button
                    type="button"
                    className="btn-filled"
                    disabled={administrateurClotureLocked}
                    onClick={handleClotureAdministrateurContinuation}
                  >
                    Clôturer la réclamation
                  </button>
                )}
                {activeTab === 'informations' && isAdministrateurEscaladeEnvoiStep && (
                  <button type="button" className="btn-filled" onClick={handleConfirmAdministrateurEscalade}>
                    Confirmer
                  </button>
                )}
              </>
            )}
          </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
