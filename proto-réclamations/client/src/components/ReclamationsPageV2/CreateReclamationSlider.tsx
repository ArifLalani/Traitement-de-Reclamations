import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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

function parseFrDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
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

const STATE_BADGE: Partial<Record<ReclamationState, { label: string; className: string }>> = {
  possible: { label: 'Réclamation potentielle', className: 'chip-possible' },
  declinee: { label: 'Écartée', className: 'chip-declinee' },
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
  'en-attente': { label: 'En attente', className: 'chip-en-attente' },
  'classee-sans-suite': { label: 'Classée sans suite', className: 'chip-classee-sans-suite' },
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
// for the mention slider's own guiding question.
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
  // demande de contact, classement sans suite...) so the new réclamation's
  // own historique continues the same trail instead of starting blank.
  onSubmit: (data: ReclamationFormData, mentionHistorique: HistoriqueEntry[]) => void;
  onDismiss: () => void;
  onViewComplaint: () => void;
  // Called instead of onSubmit when the answer is "Non" — the mention isn't
  // turned into a réclamation yet, it's just flagged "en attente" until its
  // author replies with their contact details.
  onConfirmEnAttente: (demandeContactDate: string) => void;
  onClasserSansSuite: () => void;
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

export default function CreateReclamationSlider({
  reclamation,
  onClose,
  onSubmit,
  onDismiss,
  onViewComplaint,
  onConfirmEnAttente,
  onClasserSansSuite,
  linkedComplaintHistorique,
  savedReclamantDraft,
  onSaveReclamantDraft,
}: CreateReclamationSliderProps) {
  const isFlagged = reclamation.state === 'possible';
  const isMesReclamations = reclamation.state === 'mes-reclamations';
  const isEnAttente = reclamation.state === 'en-attente';
  const isClasseeSansSuite = reclamation.state === 'classee-sans-suite';
  const [prenom] = useState(() => (reclamation.author || '').split(' ')[0] ?? '');
  const [nom] = useState(() => (reclamation.author || '').split(' ').slice(1).join(' '));
  const canal = reclamation.source;
  const dateReception = formatDateFR(reclamation.date);
  const [objet] = useState(() => suggestObjet(reclamation.text));
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<MentionTabKey>('informations');
  // Reopening an "en attente" mention pre-fills the question with "Non" and
  // its previously sent date, rather than starting the guiding question over.
  const [contactAnswer, setContactAnswer] = useState<'oui' | 'non' | null>(isEnAttente ? 'non' : null);
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
  const contactTag = getContactTag(reclamantDraft.rattacheContrat, reclamantDraft.statutClient);
  const [demandeDateDraft, setDemandeDateDraft] = useState(reclamation.demandeContactDate ?? '');
  // Once the demande de contact is confirmed, the slider stays open (it's
  // not creating a réclamation yet) and swaps the form for the "en attente"
  // alert instead — no need to wait on the parent re-passing an updated
  // reclamation prop.
  const [enAttenteConfirmed, setEnAttenteConfirmed] = useState(isEnAttente);
  // The guiding question and its fields stay hidden behind a CTA until the
  // dossier is explicitly opened — no need to ask again once any progress
  // already exists (en attente, classée sans suite, réclamation créée).
  const [dossierOuvert, setDossierOuvert] = useState(isEnAttente || isClasseeSansSuite || isMesReclamations);
  const [retourAnswer, setRetourAnswer] = useState<'oui' | 'non' | null>(null);
  const [retourTexte, setRetourTexte] = useState('');
  const [retourDateDraft, setRetourDateDraft] = useState('');
  const [coordonneesRecupereesAnswer, setCoordonneesRecupereesAnswer] = useState<'oui' | 'non' | null>(null);
  const [showContactErrors, setShowContactErrors] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [classingSansSuite, setClassingSansSuite] = useState(false);
  const [classedSansSuite, setClassedSansSuite] = useState(isClasseeSansSuite);
  const [classedSansSuiteDate] = useState(() => new Date().toLocaleDateString('fr-FR'));
  // Snapshot of the retour question's answer at the moment "Classer sans
  // suite" is confirmed — the form resets right after (so the question can
  // be asked fresh if the author eventually does reply), but the historique
  // entry for that earlier retour shouldn't vanish along with it.
  const [loggedRetourEntry, setLoggedRetourEntry] = useState<HistoriqueEntry | null>(null);
  const [todayLabel] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(buildDemandeContactTemplate(reclamation.url)).then(() => {
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2000);
    });
  };

  // Same "stay open, show a beat of loading, then swap the content in
  // place" pattern as the réclamations list's creatingComplaint transition —
  // classing sans suite doesn't close the slider either.
  const handleClasserSansSuiteClick = () => {
    setClassingSansSuite(true);
    setTimeout(() => {
      onClasserSansSuite();
      setClassingSansSuite(false);
      setClassedSansSuite(true);
      // Freeze whatever retour was answered into the historique before
      // wiping the form — the retour question reappears once classée sans
      // suite (in case the author eventually does reply after all) and
      // should start fresh rather than still showing what was just
      // answered/typed, but that earlier answer shouldn't vanish from the
      // trail along with it.
      if (retourAnswer === 'oui' && retourTexte.trim() !== '') {
        setLoggedRetourEntry({
          title: "Retour de l'auteur de la mention",
          description: "L'auteur de la mention a répondu à la demande de coordonnées.",
          date: retourDateDraft || todayLabel,
          author: 'Joe Bleau',
          changes: [{ label: 'Réponse', value: retourTexte }],
        });
      }
      setRetourAnswer(null);
      setRetourTexte('');
      setRetourDateDraft('');
      setCoordonneesRecupereesAnswer(null);
      setShowContactErrors(false);
    }, 600);
  };

  // Reopening a dossier classée sans suite drops the explanatory box and
  // resumes right at the retour question (contactAnswer "non" +
  // enAttenteConfirmed), same as it looked just before being classée sans
  // suite — not all the way back at the very first guiding question.
  const handleRouvrirDossierMention = () => {
    setClassedSansSuite(false);
    setContactAnswer('non');
    setEnAttenteConfirmed(true);
  };

  // `reclamation` is the prop captured when the slider opened — it doesn't
  // get refreshed as the parent's state updates while it stays open, so the
  // badge is derived from the same local flags the rest of the flow already
  // reacts to instead of the (potentially stale) reclamation.state.
  const badgeState: ReclamationState = isMesReclamations
    ? 'mes-reclamations'
    : classedSansSuite
      ? 'classee-sans-suite'
      : enAttenteConfirmed
        ? 'en-attente'
        : reclamation.state;
  const badge = STATE_BADGE[badgeState];

  // The reclamant fields (nom, prénom, coordonnées...) show up — and lead to
  // actually creating the réclamation — either straight away (contactAnswer
  // "oui") or later, once the mention's author has replied and their
  // coordonnées were retrieved from that reply (coordonneesRecupereesAnswer
  // "oui").
  const showingReclamantFields =
    contactAnswer === 'oui' ||
    // Also covers the classée sans suite case — enAttenteConfirmed stays
    // true and contactAnswer stays "non" once classed, so the same retour
    // question (see renderRetourFlow) reused there flows through here too.
    (contactAnswer === 'non' &&
      enAttenteConfirmed &&
      retourAnswer === 'oui' &&
      coordonneesRecupereesAnswer === 'oui');

  // "Classer sans suite" applies whenever there's no author reply to act on
  // yet — either no retour at all, or a retour that still didn't yield
  // coordonnées. Doesn't apply anymore once already classée sans suite —
  // that flow drops the retour question in favor of the fields directly.
  const showingClasserSansSuite =
    !classedSansSuite &&
    contactAnswer === 'non' &&
    enAttenteConfirmed &&
    (retourAnswer === 'non' || (retourAnswer === 'oui' && coordonneesRecupereesAnswer === 'non'));

  // Whether the sticky footer has anything to show — e.g. once the mention
  // is en attente and waiting on a "Oui"/"Non" retour answer, no action
  // applies yet, so the footer itself shouldn't render (an empty bar would
  // just clip the scrollable content above it).
  const hasFooterActions =
    !classingSansSuite &&
    (isMesReclamations ||
      isFlagged ||
      (activeTab === 'informations' &&
        (!dossierOuvert ||
          showingReclamantFields ||
          (contactAnswer === 'non' && !enAttenteConfirmed) ||
          showingClasserSansSuite)));

  const contactAnswerMissing = showContactErrors && !contactAnswer;
  const nomMissing = showContactErrors && showingReclamantFields && !reclamantDraft.nom;
  const prenomMissing = showContactErrors && showingReclamantFields && !reclamantDraft.prenom;
  const contactMissing =
    showContactErrors && showingReclamantFields && !reclamantDraft.email && !reclamantDraft.telephone;
  const rattacheContratMissing = showContactErrors && showingReclamantFields && !reclamantDraft.rattacheContrat;
  const statutClientMissing =
    showContactErrors &&
    showingReclamantFields &&
    reclamantDraft.rattacheContrat === 'oui' &&
    !reclamantDraft.statutClient;
  const demandeDateMissing = showContactErrors && contactAnswer === 'non' && !enAttenteConfirmed && !demandeDateDraft;
  const retourTexteMissing = showContactErrors && retourAnswer === 'oui' && !retourTexte;
  const retourDateMissing = showContactErrors && retourAnswer === 'oui' && !retourDateDraft;

  // "Classer sans suite" only becomes available 10 days after the demande de
  // contact was sent, giving the mention's author a fair window to respond
  // — same rule as ComplaintDetailDrawer's canClasserSansSuite.
  const classerSansSuiteDate = enAttenteConfirmed ? addDaysToFrDate(demandeDateDraft, 10) : '';
  const canClasserSansSuite = (() => {
    if (!enAttenteConfirmed) return false;
    const threshold = parseFrDate(classerSansSuiteDate);
    return threshold ? new Date() >= threshold : false;
  })();

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
      const firstError = bodyRef.current?.querySelector('.field-border-error, .dossier-choice-row-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

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
    ...(dossierOuvert && !isEnAttente && !isClasseeSansSuite && !isMesReclamations
      ? [
          {
            title: 'Ouverture du dossier',
            description: 'Le dossier a été ouvert pour traitement.',
            date: todayLabel,
            author: 'Joe Bleau',
          },
        ]
      : []),
    ...(contactAnswer === 'non' && enAttenteConfirmed
      ? [
          {
            title: 'Confirmation de la demande de contact',
            description: `Demande de coordonnées envoyée à l'auteur de la mention.`,
            date: demandeDateDraft,
            author: 'Joe Bleau',
          },
        ]
      : []),
    ...(loggedRetourEntry
      ? [loggedRetourEntry]
      : retourAnswer === 'oui' && retourTexte.trim() !== ''
        ? [
            {
              title: "Retour de l'auteur de la mention",
              description: "L'auteur de la mention a répondu à la demande de coordonnées.",
              date: retourDateDraft || todayLabel,
              author: 'Joe Bleau',
              changes: [{ label: 'Réponse', value: retourTexte }],
            },
          ]
        : []),
    ...(classedSansSuite
      ? [
          {
            title: 'Classement sans suite',
            description: "Mention classée sans suite faute de réponse de l'auteur de la mention.",
            date: classedSansSuiteDate,
            author: 'Joe Bleau',
          },
        ]
      : []),
  ];

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

  const handleSubmit = () => {
    if (showingReclamantFields) {
      const missing =
        reclamantFieldsMissing || (retourAnswer === 'oui' && (!retourTexte || !retourDateDraft));
      if (missing) {
        setShowContactErrors(true);
        setActiveTab('informations');
        scrollToFirstError();
        return;
      }
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
      return;
    }
    if (!demandeDateDraft) {
      setShowContactErrors(true);
      setActiveTab('informations');
      scrollToFirstError();
      return;
    }
    onConfirmEnAttente(demandeDateDraft);
    setEnAttenteConfirmed(true);
  };

  // Same fields whether they show up right away (contactAnswer "oui") or
  // later once the coordonnées were retrieved from the author's reply.
  const renderReclamantFields = () => (
    <div className="dossier-treatment-fields">
      <div className="modal-row">
        <FormField
          label="Nom de l'auteur de la mention"
          required
          placeholder="Entrez le nom de l'auteur de la mention"
          value={reclamantDraft.nom}
          error={nomMissing}
          errorText={nomMissing ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
        />
        <FormField
          label="Prénom de l'auteur de la mention"
          required
          placeholder="Entrez le prénom de l'auteur de la mention"
          value={reclamantDraft.prenom}
          error={prenomMissing}
          errorText={prenomMissing ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
        />
      </div>
      <div className="modal-row">
        <FormField
          label="Email"
          required
          placeholder="Entrez une adresse email"
          value={reclamantDraft.email}
          error={contactMissing}
          errorText={contactMissing ? 'Un email ou un numéro de téléphone est requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
        />
        <FormField
          label="Numéro de téléphone"
          required
          placeholder="Entrez le numéro de téléphone"
          value={reclamantDraft.telephone}
          error={contactMissing}
          errorText={contactMissing ? 'Un email ou un numéro de téléphone est requis' : undefined}
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
          error={rattacheContratMissing}
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
            error={statutClientMissing}
            errorText={statutClientMissing ? 'Champ requis' : undefined}
            onChange={(v) => setReclamantDraft((d) => ({ ...d, statutClient: v }))}
          />
          <div className="dossier-field-spacer" />
        </div>
      )}
    </div>
  );

  // Same "Y a-t-il eu un retour ?" question, whether it's asked the first
  // time (mention en attente) or asked again once already classée sans
  // suite, in case the author eventually did reply.
  const renderRetourFlow = () => (
    <>
      <div className="dossier-question-row">
        <span className="dossier-question-text">
          L'auteur de la mention a-t-il donné suite à la demande ?<span className="field-required">*</span>
        </span>
        <ChoiceToggle value={retourAnswer} onChange={setRetourAnswer} />
      </div>
      {retourAnswer === 'oui' && (
        <>
          <FormTextareaAutoGrow
            label="Réponse de l'auteur de la mention"
            required
            placeholder="Indiquez ici la réponse de l'auteur de la mention"
            value={retourTexte}
            error={retourTexteMissing}
            errorText={retourTexteMissing ? 'Champ requis' : undefined}
            onChange={setRetourTexte}
          />
          <div className="modal-row">
            <FormField
              label="Date de la réponse"
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
          <div className="dossier-question-row">
            <span className="dossier-question-text">
              Avez-vous récupéré les coordonnées de l'auteur de la mention ?<span className="field-required">*</span>
            </span>
            <ChoiceToggle value={coordonneesRecupereesAnswer} onChange={setCoordonneesRecupereesAnswer} />
          </div>
          {coordonneesRecupereesAnswer === 'oui' && renderReclamantFields()}
        </>
      )}
    </>
  );

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

              {!isMesReclamations && classedSansSuite && (
                <div className="dossier-treatment-block dossier-treatment-block-bottom">
                  <div className="dossier-alert-neutral">
                    <p>
                      Cette mention a été classée sans suite faute de retour de son auteur. Si celui-ci transmet
                      finalement ses informations, vous pouvez rouvrir le dossier pour les renseigner.
                    </p>
                    <button type="button" className="btn-text" onClick={handleRouvrirDossierMention}>
                      Rouvrir le dossier
                    </button>
                  </div>
                </div>
              )}

              {!isMesReclamations && !classedSansSuite && classingSansSuite && (
                <div className="dossier-treatment-block dossier-treatment-block-centered">
                  <span className="dossier-inline-loader" />
                </div>
              )}

              {!isMesReclamations && !classedSansSuite && !classingSansSuite && dossierOuvert && (
                <div className="dossier-treatment-block">
                  {!enAttenteConfirmed && (
                    <>
                      <p className="dossier-block-title">Informations de l'auteur de la mention</p>
                      <div className="dossier-question-row">
                        <span className="dossier-question-text">
                          Avez-vous les coordonnées de l'auteur de la mention ?
                          <span className="field-required">*</span>
                        </span>
                        <ChoiceToggle value={contactAnswer} onChange={setContactAnswer} error={contactAnswerMissing} />
                      </div>
                    </>
                  )}
                  {contactAnswer === 'oui' && renderReclamantFields()}
                  {contactAnswer === 'non' &&
                    (enAttenteConfirmed ? (
                      <>
                        <div className="dossier-alert-warning">
                          <div className="dossier-alert-warning-title-row">
                            <AlertTriangleIcon />
                            <span className="dossier-alert-warning-title">En attente du retour du client</span>
                          </div>
                          <p className="dossier-alert-warning-text">
                            Demande d'information à l'auteur de la mention envoyée le {demandeDateDraft}.
                          </p>
                          <p className="dossier-alert-warning-text">
                            Vous pourrez classer sans suite ce dossier en cas de non-réponse ou de refus de partage
                            des informations de la part de l'auteur de la mention à partir du{' '}
                            {addDaysToFrDate(demandeDateDraft, 10)}.
                          </p>
                        </div>
                        {renderRetourFlow()}
                      </>
                    ) : (
                      <div className="dossier-treatment-fields">
                        <div className="dossier-alert-field-group">
                          <div className="dossier-alert-info">
                            La demande de coordonnées doit être envoyée à l'auteur de la mention de votre côté.
                            Renseignez la date d'envoi ci-dessous, le dossier passera en attente.
                          </div>
                          <div className="modal-row">
                            <FormField
                              label="Date de demande d'information"
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
                          <div className="dossier-template-block">
                            <div className="dossier-template-header">
                              <span className="dossier-template-title">Modèle de message à envoyer</span>
                              <span className="dossier-template-copy-wrap">
                                <button
                                  type="button"
                                  className="dossier-template-copy-btn"
                                  aria-label="Copier le modèle de message"
                                  onClick={handleCopyTemplate}
                                >
                                  <CopyIcon />
                                </button>
                                {templateCopied && <span className="dossier-template-copy-feedback">Copié !</span>}
                              </span>
                            </div>
                            <p className="dossier-template-text">{DEMANDE_CONTACT_TEMPLATE_BODY}</p>
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
                          </div>
                        </div>
                      </div>
                    ))}
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
          {hasFooterActions && (
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
                {activeTab === 'informations' && !dossierOuvert && (
                  <button type="button" className="btn-filled" onClick={() => setDossierOuvert(true)}>
                    Ouvrir le dossier
                  </button>
                )}
                {activeTab === 'informations' && dossierOuvert && showingReclamantFields && (
                  <button
                    type="button"
                    className="btn-text"
                    disabled={!reclamantDraftDirty}
                    onClick={handleSaveDraft}
                  >
                    Enregistrer
                  </button>
                )}
                {activeTab === 'informations' && dossierOuvert && showingReclamantFields && (
                  <button type="button" className="btn-filled" onClick={handleSubmit}>
                    Créer une réclamation
                  </button>
                )}
                {activeTab === 'informations' && contactAnswer === 'non' && !enAttenteConfirmed && (
                  <button type="button" className="btn-filled" onClick={handleSubmit}>
                    Confirmer
                  </button>
                )}
                {activeTab === 'informations' && showingClasserSansSuite && (
                  <button
                    type="button"
                    className="btn-text"
                    disabled={!canClasserSansSuite || classingSansSuite}
                    onClick={handleClasserSansSuiteClick}
                  >
                    Classer sans suite
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
