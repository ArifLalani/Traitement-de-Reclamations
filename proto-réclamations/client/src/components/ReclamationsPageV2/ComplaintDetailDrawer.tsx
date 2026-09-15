import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import ArrowUpRight from './ArrowUpRight';
import ExportMenu, { type ExportPreferences } from './ExportMenu';
import { FormField, FormSelect, FormTextareaAutoGrow } from './FormFields';
import { exportComplaintsToCsv, exportComplaintsToPdf } from './exportComplaints';
import {
  AVANCEMENT_LABEL,
  CONFORMITE_LABEL,
  getDossierSteps,
  INTERLOCUTEURS,
  RELATION_LABEL,
  type Complaint,
  type DossierStep,
  type HistoriqueEntry,
  type Reclamant,
  type Relation,
  type SuiviCloture,
  type Traitement,
} from './complaintsData';

// Placeholder options pending the real business list for this field.
const VERIFICATION_EFFICACITE_OPTIONS = [
  { id: 'Oui', label: 'Oui' },
  { id: 'Non', label: 'Non' },
  { id: 'En cours', label: 'En cours' },
];

const DOSSIER_STEP_SHORT_LABELS = [
  'Réception de la mention',
  'Création de la réclamation',
  'Accusé de réception',
  'Réponse définitive',
  'Clôture du dossier',
];
// Used instead once the dossier is classé sans suite — steps 3-4 (AR,
// réponse définitive) never happened, so the last step reads "Classé sans
// suite" rather than "Clôture du dossier".
const SANS_SUITE_STEP_SHORT_LABELS = [
  'Réception de la mention',
  'Création de la réclamation',
  'Accusé de réception',
  'Réponse définitive',
  'Classé\nsans suite',
];

// Same compact stepper used in the create-réclamation slider preview (see
// CreateReclamationSlider.tsx) — reused here as the persistent, always-open
// replacement for the old collapsible "Avancement du dossier" section.
function DossierHStepper({ steps }: { steps: DossierStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  const hasSkipped = steps.some((s) => s.status === 'skipped');
  const shortLabels = hasSkipped ? SANS_SUITE_STEP_SHORT_LABELS : DOSSIER_STEP_SHORT_LABELS;
  // Once every step is either "done" or "skipped" — a terminal dossier,
  // clôturé or classé sans suite — the line should read as fully resolved
  // end-to-end rather than stopping short at the last "done" dot.
  const fillFraction = hasSkipped
    ? 1
    : Math.min(completedCount, steps.length - 1) / (steps.length - 1);

  return (
    <div className="dossier-hstepper">
      <span className="dossier-hstepper-line" />
      <span
        className="dossier-hstepper-line-fill"
        style={{ width: `calc(${fillFraction} * (100% - 88px))` }}
      />
      {steps.map((step, index) => (
        <div key={step.label} className={`dossier-hstep dossier-hstep-${step.status}`}>
          <span className="dossier-hstep-dot" aria-hidden>
            {step.status === 'done' ? '✓' : step.status === 'skipped' ? '✕' : index + 1}
          </span>
          <span className="dossier-hstep-label" title={step.label}>
            {shortLabels[index].split('\n').map((line, lineIndex, lines) => (
              <Fragment key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </Fragment>
            ))}
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

const CLOSE_ANIMATION_DURATION = 200;
const ACCORDION_COLLAPSE_DURATION = 300;

function parseFrDate(dateStr: string): Date | null {
  const [d, m, y] = dateStr.split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Adds `days` to a French-formatted (DD/MM/YYYY) date string, returning the
// result in the same format. Used to compute the 60-day réponse définitive
// deadline quoted in the accusé de réception message, and the 10-day
// "classer sans suite" eligibility date while a dossier is en attente.
function addDaysToFrDate(dateStr: string, days: number): string {
  const date = parseFrDate(dateStr);
  if (!date) return '';
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('fr-FR');
}

function buildDefaultArMessage(complaint: Complaint, reclamant: Reclamant): string {
  const deadline = addDaysToFrDate(complaint.dateReception, 60);
  return [
    `Bonjour ${reclamant.prenom} ${reclamant.nom},`,
    '',
    `Nous accusons réception de votre réclamation du ${complaint.dateReception}, concernant : ${complaint.objet}.`,
    '',
    `Votre dossier a bien été enregistré sous la référence ${complaint.ticket}. Nous vous apporterons une réponse définitive dans un délai maximal de 60 jours à compter de la réception de votre réclamation${deadline ? `, soit au plus tard le ${deadline}` : ''}.`,
    '',
    "Si nous avons besoin d'informations complémentaires pour instruire votre dossier, nous reviendrons vers vous directement.",
    '',
    'Nous vous remercions de votre confiance et restons à votre disposition pour toute question.',
    '',
    'Cordialement,',
    'Joe Bleau',
    'Service Réclamations',
  ].join('\n');
}

function buildDefaultReponseMessage(complaint: Complaint, reclamant: Reclamant): string {
  return [
    `Bonjour ${reclamant.prenom} ${reclamant.nom},`,
    '',
    `Nous faisons suite à votre réclamation du ${complaint.dateReception} concernant : ${complaint.objet}.`,
    '',
    'Après examen approfondi de votre dossier, nous vous apportons ci-après notre réponse définitive : [à compléter].',
    '',
    'Nous vous remercions de votre confiance et restons à votre disposition pour toute question.',
    '',
    'Cordialement,',
    'Joe Bleau',
    'Service Réclamations',
  ].join('\n');
}

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="currentColor"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }}
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-3.5 4-5.3 7-5.3s6 1.8 7 5.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.2M16 3v3.2" strokeLinecap="round" />
      <path d="M8.5 14.5 11 17l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 16 16" width={20} height={20} fill="currentColor">
      <path d="M8.0002 1.49937C8.26329 1.4994 8.52162 1.56954 8.74922 1.70151C8.9765 1.83331 9.1654 2.02244 9.29609 2.25034V2.25132L14.7951 11.7503C14.9265 11.9779 14.996 12.2357 14.9963 12.4984C14.9965 12.7611 14.928 13.0196 14.7971 13.2474C14.6661 13.4752 14.4774 13.6652 14.2502 13.7972C14.023 13.9292 13.7649 13.9994 13.5021 14.0003H2.49824C2.23544 13.9994 1.97745 13.9292 1.7502 13.7972C1.5229 13.6652 1.33435 13.4753 1.20332 13.2474C1.07236 13.0196 1.00289 12.7612 1.00313 12.4984C1.00341 12.2358 1.07304 11.9778 1.2043 11.7503L6.70332 2.25132L6.7043 2.25034C6.83491 2.02265 7.02315 1.83327 7.2502 1.70151C7.47786 1.56949 7.73702 1.49937 8.0002 1.49937ZM8.0002 2.49937C7.91321 2.49937 7.8274 2.52311 7.75215 2.56675C7.67701 2.61038 7.61464 2.67297 7.57148 2.74839L7.13789 2.50034L7.57051 2.75034L2.07051 12.2503C2.0269 12.3261 2.00324 12.412 2.00313 12.4994C2.00305 12.587 2.02683 12.6734 2.07051 12.7494C2.11411 12.8251 2.17663 12.888 2.25215 12.932C2.32772 12.9759 2.41379 12.9999 2.50117 13.0003H13.4992C13.5865 12.9999 13.6718 12.9758 13.7473 12.932C13.823 12.888 13.8862 12.8253 13.9299 12.7494C13.9736 12.6734 13.9964 12.587 13.9963 12.4994C13.9962 12.412 13.9735 12.3261 13.9299 12.2503L8.42891 2.74839C8.3857 2.67289 8.32252 2.61039 8.24727 2.56675C8.17211 2.52322 8.08704 2.4994 8.0002 2.49937ZM8.0002 10.5003C8.41432 10.5004 8.7502 10.8362 8.7502 11.2503C8.75001 11.6643 8.41421 12.0002 8.0002 12.0003C7.5861 12.0003 7.25038 11.6644 7.2502 11.2503C7.2502 10.8361 7.58598 10.5003 8.0002 10.5003ZM8.0002 6.00034C8.27625 6.00045 8.5002 6.22426 8.5002 6.50034V9.00034C8.50001 9.27626 8.27613 9.50024 8.0002 9.50034C7.72417 9.50034 7.50038 9.27633 7.5002 9.00034V6.50034C7.5002 6.2242 7.72405 6.00034 8.0002 6.00034Z" />
    </svg>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
  plain?: boolean;
  error?: boolean;
  errorText?: string;
  onChange?: (value: string) => void;
  endAdornment?: React.ReactNode;
};

function SectionTextField({
  label,
  value,
  required,
  placeholder,
  multiline,
  readOnly,
  plain,
  error,
  errorText,
  onChange,
  endAdornment,
}: TextFieldProps) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div
        className={`dossier-field-input ${readOnly || plain ? 'dossier-field-input-readonly' : ''} ${error ? 'dossier-field-input-error' : ''}`}
      >
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
        {endAdornment && <span className="dossier-field-adornment">{endAdornment}</span>}
      </div>
      {error && errorText && <span className="dossier-field-error-text">{errorText}</span>}
    </div>
  );
}

function SectionSelectField<T extends string>({
  label,
  value,
  required,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  required?: boolean;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div className="dossier-field-input">
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          <option value="" disabled>
            Sélectionner...
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type AccordionSectionProps = {
  icon: React.ReactNode;
  title: string;
  badge?: { label: string; className: string };
  meta?: string;
  open: boolean;
  onToggle: () => void;
  headline?: string;
  children?: React.ReactNode;
};

function AccordionSection({ icon, title, badge, meta, open, onToggle, headline, children }: AccordionSectionProps) {
  const [mounted, setMounted] = useState(open);
  const [renderKey, setRenderKey] = useState(0);

  // Delaying the unmount by the transition duration lets the collapse
  // animation play against real content instead of snapping to zero height
  // the instant the section closes; re-mounting on open also replays the
  // items' entrance animation each time.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      setRenderKey((k) => k + 1);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), ACCORDION_COLLAPSE_DURATION);
    return () => clearTimeout(timeout);
  }, [open]);

  return (
    <div className={`dossier-section ${open ? 'dossier-section-open' : ''}`}>
      <button type="button" className="dossier-section-header" onClick={onToggle}>
        <span className="dossier-section-icon">{icon}</span>
        <span className="dossier-section-title">{title}</span>
        {meta && <span className="dossier-section-meta">{meta}</span>}
        {badge && <span className={`chip ${badge.className}`}>{badge.label}</span>}
        <ChevronIcon open={open} />
      </button>
      <div className="dossier-section-collapse">
        <div className="dossier-section-collapse-inner">
          {mounted && (
            <div className="dossier-section-body" key={renderKey}>
              {headline && <p className="dossier-section-headline">{headline}</p>}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TabKey = 'informations' | 'traitement' | 'historique';

const DOSSIER_TABS: { id: TabKey; label: string }[] = [
  { id: 'traitement', label: 'Traitement' },
  { id: 'informations', label: 'Informations' },
  { id: 'historique', label: 'Historique' },
];

// Same sliding-pill segmented control pattern as ExportMenu's SegmentedControl,
// reused here for the dossier's own tab navigation.
function DossierTabsControl({ value, onChange }: { value: TabKey; onChange: (tab: TabKey) => void }) {
  const index = Math.max(0, DOSSIER_TABS.findIndex((tab) => tab.id === value));
  const style = { '--segment-count': DOSSIER_TABS.length } as CSSProperties;

  return (
    <div className="dossier-tabs-segmented" style={style}>
      <div
        className="dossier-tabs-segment-indicator"
        style={{ transform: `translateX(calc(${index} * (100% + 4px)))` }}
      />
      {DOSSIER_TABS.map((tab) => (
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

function ChoiceToggle({ value, onChange }: { value: 'oui' | 'non' | null; onChange: (value: 'oui' | 'non') => void }) {
  return (
    <div className="dossier-choice-row">
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

function SaveButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  if (disabled) return null;
  return (
    <button type="button" className="btn-filled dossier-save-btn" onClick={onClick}>
      Sauvegarder
    </button>
  );
}

export type ComplaintInformationsUpdate = Partial<Complaint>;

type ComplaintDetailDrawerProps = {
  complaint: Complaint;
  onClose: () => void;
  onUpdate?: (id: string, updates: ComplaintInformationsUpdate) => void;
  // Set when this drawer opens as a direct continuation of the create-
  // réclamation slider (same panel, content just swapped in place) — skips
  // the backdrop/panel entrance animation so nothing appears to move.
  skipEnterAnimation?: boolean;
};

type SectionKey = 'informations' | 'reclamant' | 'suivi';

export default function ComplaintDetailDrawer({
  complaint,
  onClose,
  onUpdate,
  skipEnterAnimation,
}: ComplaintDetailDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set<SectionKey>(['informations', 'reclamant', 'suivi']),
  );
  const [activeTab, setActiveTab] = useState<TabKey>('traitement');
  // Ephemeral guiding question ("Avez-vous les coordonnées du réclamant ?")
  // — defaults to "Non" if a demande de contact was already sent for this
  // dossier (i.e. it was previously answered), otherwise unanswered.
  const [contactAnswer, setContactAnswer] = useState<'oui' | 'non' | null>(() =>
    complaint.suiviCloture.demandeContactDate !== '' ? 'non' : null,
  );
  // Accusé de réception date + message — only asked for once the guiding
  // question above is answered "Oui" (the réclamant's contact info is
  // known), since sending an AR requires more than what we had until then.
  // Left blank by default while "en attente" — the fields aren't expected
  // to be filled in until the réclamant's info actually comes back.
  const [arDateDraft, setArDateDraft] = useState('');
  const [arMessageDraft, setArMessageDraft] = useState('');
  // Réponse définitive date + message — same idea, one step later.
  // Date de demande d'information — shown once the guiding question is
  // answered "Non" (no contact info available yet).
  const [demandeDateDraft, setDemandeDateDraft] = useState('');
  const [reponseDateDraft, setReponseDateDraft] = useState(() =>
    complaint.suiviCloture.dateAR !== '' && complaint.suiviCloture.dateReponse === ''
      ? new Date().toLocaleDateString('fr-FR')
      : '',
  );
  const [reponseMessageDraft, setReponseMessageDraft] = useState(() =>
    complaint.suiviCloture.dateAR !== '' && complaint.suiviCloture.dateReponse === ''
      ? buildDefaultReponseMessage(complaint, complaint.reclamant)
      : '',
  );
  const [headerStuck, setHeaderStuck] = useState(false);
  const [tabsStuck, setTabsStuck] = useState(false);
  const [footerShadow, setFooterShadow] = useState(false);
  const dossierContentRef = useRef<HTMLDivElement>(null);

  // The footer's drop-shadow should only show when content actually scrolls
  // underneath it — a short screen (e.g. "Rouvrir le dossier" with no fields
  // above it) has nothing passing under the bar, so no shadow is needed.
  const updateFooterShadow = (el: HTMLElement) => {
    setFooterShadow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };

  useEffect(() => {
    const el = dossierContentRef.current;
    if (!el) return;
    updateFooterShadow(el);
    const observer = new ResizeObserver(() => updateFooterShadow(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportPreferences>({
    format: 'csv',
    period: 'mois',
    from: '',
    to: '',
  });
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [exportMenuOpen]);

  const handleExportComplaint = () => {
    if (exportPreferences.format === 'csv') {
      exportComplaintsToCsv([complaint]);
    } else {
      exportComplaintsToPdf([complaint]);
    }
    setExportMenuOpen(false);
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const closeForReal = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_DURATION);
  };

  const performClose = () => {
    if (closing) return;
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
      return;
    }
    closeForReal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') performClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Historique ---
  const buildHistoryEntry = (title: string, description: string): HistoriqueEntry => {
    const now = new Date();
    return {
      title,
      description,
      date: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      author: 'Joe Bleau',
    };
  };
  const withHistory = (title: string, changedLabels: string[]): Pick<Complaint, 'historique'> | Record<string, never> => {
    if (changedLabels.length === 0) return {};
    const description = `Champs modifiés : ${changedLabels.join(', ')}.`;
    return { historique: [...complaint.historique, buildHistoryEntry(title, description)] };
  };

  // --- Informations de la réclamation --- (also owns the "Interlocuteur en
  // charge" field, formerly its own "Traitement / attribution" section, and
  // "Notes internes", formerly its own section — both were folded in here
  // per the Figma redesign, so one save covers all three).
  const [infoDraft, setInfoDraft] = useState({
    dateReception: complaint.dateReception,
    objet: complaint.objet,
    description: complaint.description,
    sourceUrl: complaint.sourceUrl ?? '',
  });
  const [traitementDraft, setTraitementDraft] = useState<Traitement>(complaint.traitement);
  const [notesDraft, setNotesDraft] = useState(complaint.notesInternes);
  const infoDirty =
    infoDraft.dateReception !== complaint.dateReception ||
    infoDraft.objet !== complaint.objet ||
    infoDraft.description !== complaint.description ||
    infoDraft.sourceUrl !== (complaint.sourceUrl ?? '') ||
    traitementDraft.interlocuteur !== complaint.traitement.interlocuteur ||
    notesDraft !== complaint.notesInternes;
  const saveInfo = () => {
    const changed: string[] = [];
    if (infoDraft.dateReception !== complaint.dateReception) changed.push('Date de réception');
    if (infoDraft.objet !== complaint.objet) changed.push('Objet de la réclamation');
    if (infoDraft.description !== complaint.description) changed.push('Description');
    if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? '')) changed.push('Lien de la source');
    if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur) changed.push('Interlocuteur en charge');
    if (notesDraft !== complaint.notesInternes) changed.push('Notes internes');
    onUpdate?.(complaint.id, {
      ...infoDraft,
      sourceUrl: infoDraft.sourceUrl || undefined,
      traitement: traitementDraft,
      notesInternes: notesDraft,
      ...withHistory('Modification des informations de la réclamation', changed),
    });
  };

  // --- Informations du réclamant ---
  const [reclamantDraft, setReclamantDraft] = useState<Reclamant>(complaint.reclamant);
  const [denominateurSocialDraft, setDenominateurSocialDraft] = useState(complaint.denominateurSocial);
  const [porteurDuRisqueDraft, setPorteurDuRisqueDraft] = useState(complaint.classification.porteurDuRisque);
  const reclamantDirty =
    JSON.stringify(reclamantDraft) !== JSON.stringify(complaint.reclamant) ||
    denominateurSocialDraft !== complaint.denominateurSocial ||
    porteurDuRisqueDraft !== complaint.classification.porteurDuRisque;
  const saveReclamant = () => {
    const changed: string[] = [];
    if (reclamantDraft.prenom !== complaint.reclamant.prenom) changed.push('Prénom');
    if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push('Nom');
    if (reclamantDraft.email !== complaint.reclamant.email) changed.push('Email');
    if (reclamantDraft.telephone !== complaint.reclamant.telephone) changed.push('Téléphone');
    if (reclamantDraft.adresse !== complaint.reclamant.adresse) changed.push('Adresse');
    if (reclamantDraft.relation !== complaint.reclamant.relation) changed.push('Relation avec ce client');
    if (reclamantDraft.relationAutrePrecision !== complaint.reclamant.relationAutrePrecision) changed.push('Précision');
    if (denominateurSocialDraft !== complaint.denominateurSocial) changed.push('Dénomination Sociale');
    if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque) changed.push('Porteur du risque');
    onUpdate?.(complaint.id, {
      reclamant: reclamantDraft,
      denominateurSocial: denominateurSocialDraft,
      classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      ...withHistory('Modification des informations du réclamant', changed),
    });
  };
  const reclamantMissing = [
    reclamantDraft.prenom,
    reclamantDraft.nom,
    reclamantDraft.email,
    ...(reclamantDraft.relation === 'autre' ? [reclamantDraft.relationAutrePrecision] : []),
  ].filter((v) => !v).length;

  // Highlights the specific missing fields in "Informations du réclamant"
  // once the user has tried (and failed) to confirm the accusé de
  // réception — clears itself per-field as soon as that field is filled.
  const [showContactErrors, setShowContactErrors] = useState(false);
  const prenomMissing = showContactErrors && !reclamantDraft.prenom;
  const nomMissing = showContactErrors && !reclamantDraft.nom;
  const contactMissing = showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone;

  // --- Suivi et clôture ---
  const [suiviDraft, setSuiviDraft] = useState<SuiviCloture>(complaint.suiviCloture);
  const suiviDirty = JSON.stringify(suiviDraft) !== JSON.stringify(complaint.suiviCloture);
  const saveSuivi = () => {
    const changed: string[] = [];
    if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR) changed.push("Date d'envoi de l'accusé de réception");
    if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
      changed.push("Date d'envoi de la réponse intermédiaire");
    if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
      changed.push("Date de l'action immédiate");
    if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
      changed.push("Date de l'action corrective");
    if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee) changed.push('Action réalisée');
    if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
      changed.push("Vérification d'efficacité");
    if (suiviDraft.reponseApportee !== complaint.suiviCloture.reponseApportee) changed.push('Réponse apportée');
    onUpdate?.(complaint.id, {
      suiviCloture: suiviDraft,
      ...withHistory('Modification du suivi et clôture', changed),
    });
  };
  const suiviMissing = Object.values(suiviDraft).filter((v) => !v).length;

  const hasUnsavedChanges = infoDirty || reclamantDirty || suiviDirty;

  // Saves every dirty section in one go (used by the "Sauvegarder" CTA in
  // the unsaved-changes dialog). Built as a single combined onUpdate call,
  // rather than calling saveInfo/saveReclamant/saveSuivi back to back —
  // each of those reads from the same (stale, pre-update) complaint.historique,
  // so calling them in sequence would have each overwrite the previous
  // one's history entry instead of appending.
  const saveAllDirtySections = () => {
    const updates: ComplaintInformationsUpdate = {};
    let historique = complaint.historique;

    if (infoDirty) {
      const changed: string[] = [];
      if (infoDraft.dateReception !== complaint.dateReception) changed.push('Date de réception');
      if (infoDraft.objet !== complaint.objet) changed.push('Objet de la réclamation');
      if (infoDraft.description !== complaint.description) changed.push('Description');
      if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? '')) changed.push('Lien de la source');
      if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur) changed.push('Interlocuteur en charge');
      if (notesDraft !== complaint.notesInternes) changed.push('Notes internes');
      Object.assign(updates, {
        ...infoDraft,
        sourceUrl: infoDraft.sourceUrl || undefined,
        traitement: traitementDraft,
        notesInternes: notesDraft,
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry(
            'Modification des informations de la réclamation',
            `Champs modifiés : ${changed.join(', ')}.`,
          ),
        ];
      }
    }

    if (reclamantDirty) {
      const changed: string[] = [];
      if (reclamantDraft.prenom !== complaint.reclamant.prenom) changed.push('Prénom');
      if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push('Nom');
      if (reclamantDraft.email !== complaint.reclamant.email) changed.push('Email');
      if (reclamantDraft.telephone !== complaint.reclamant.telephone) changed.push('Téléphone');
      if (reclamantDraft.adresse !== complaint.reclamant.adresse) changed.push('Adresse');
      if (reclamantDraft.relation !== complaint.reclamant.relation) changed.push('Relation avec ce client');
      if (reclamantDraft.relationAutrePrecision !== complaint.reclamant.relationAutrePrecision) changed.push('Précision');
      if (denominateurSocialDraft !== complaint.denominateurSocial) changed.push('Dénomination Sociale');
      if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque) changed.push('Porteur du risque');
      Object.assign(updates, {
        reclamant: reclamantDraft,
        denominateurSocial: denominateurSocialDraft,
        classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry('Modification des informations du réclamant', `Champs modifiés : ${changed.join(', ')}.`),
        ];
      }
    }

    if (suiviDirty) {
      const changed: string[] = [];
      if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR) changed.push("Date d'envoi de l'accusé de réception");
      if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
        changed.push("Date d'envoi de la réponse intermédiaire");
      if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
        changed.push("Date de l'action immédiate");
      if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
        changed.push("Date de l'action corrective");
      if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee) changed.push('Action réalisée');
      if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
        changed.push("Vérification d'efficacité");
      if (suiviDraft.reponseApportee !== complaint.suiviCloture.reponseApportee) changed.push('Réponse apportée');
      Object.assign(updates, { suiviCloture: suiviDraft });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry('Modification du suivi et clôture', `Champs modifiés : ${changed.join(', ')}.`),
        ];
      }
    }

    onUpdate?.(complaint.id, { ...updates, historique });
  };

  const handleSaveAndClose = () => {
    saveAllDirtySections();
    setShowUnsavedConfirm(false);
    closeForReal();
  };

  const steps = getDossierSteps(complaint);

  const arSent = complaint.suiviCloture.dateAR !== '';
  const enAttente =
    complaint.avancement === 'a-traiter' && !arSent && complaint.suiviCloture.demandeContactDate !== '';
  const responseSent = complaint.suiviCloture.dateReponse !== '';

  // Every "Confirmer ..." action on the Traitement tab doubles as a save —
  // the réclamant fields shown alongside these confirmations (Prénom, Nom,
  // Téléphone, Email...) need to be persisted right along with the step
  // itself. Otherwise they'd stay "dirty" against the stale complaint prop
  // and wrongly trigger the unsaved-changes dialog on close, even though
  // the user just confirmed the step.
  const getReclamantPatch = (): ComplaintInformationsUpdate =>
    reclamantDirty
      ? {
          reclamant: reclamantDraft,
          denominateurSocial: denominateurSocialDraft,
          classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
        }
      : {};

  const handleConfirmNextStep = () => {
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    if (!arSent) {
      const dateLabel = arDateDraft || todayLabel;
      const nextSuivi = { ...suiviDraft, dateAR: dateLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        ...getReclamantPatch(),
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            "Confirmation de l'envoi de l'Accusé de Réception",
            arMessageDraft || 'Accusé de réception envoyé au réclamant.',
          ),
        ],
      });
      // Pre-fill the next step's (réponse définitive) date + message now,
      // the same way arMessageDraft was pre-filled when this step started.
      if (reponseMessageDraft === '') {
        setReponseDateDraft(todayLabel);
        setReponseMessageDraft(buildDefaultReponseMessage(complaint, reclamantDraft));
      }
    } else {
      const dateLabel = reponseDateDraft || todayLabel;
      const nextSuivi = { ...suiviDraft, dateReponse: dateLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        ...getReclamantPatch(),
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            'Confirmation de l’envoi de la Réponse Définitive',
            reponseMessageDraft || 'Réponse définitive envoyée au réclamant.',
          ),
        ],
      });
    }
  };

  // The fallback when the réclamant's contact info isn't available yet:
  // marks the dossier "En attente" (still avancement 'a-traiter' — this is a
  // sub-state, not a stepper change) until that info shows up or the
  // dossier gets closed out via "Classer sans suite".
  const handleConfirmDemande = () => {
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    const dateLabel = demandeDateDraft || todayLabel;
    const nextSuivi = { ...suiviDraft, demandeContactDate: dateLabel };
    setSuiviDraft(nextSuivi);
    onUpdate?.(complaint.id, {
      suiviCloture: nextSuivi,
      historique: [
        ...complaint.historique,
        buildHistoryEntry(
          'Confirmation de la demande de contact',
          "Demande de contact envoyée au réclamant ; dossier placé en attente d'une réponse.",
        ),
      ],
    });
  };

  const handleClasserSansSuite = () => {
    onUpdate?.(complaint.id, {
      ...getReclamantPatch(),
      avancement: 'sans-suite',
      historique: [
        ...complaint.historique,
        buildHistoryEntry('Classement sans suite', "Dossier classé sans suite faute de réponse du réclamant."),
      ],
    });
  };

  // A dossier classé sans suite isn't final — if the réclamant eventually
  // does share their info, the dossier can be reopened. It resumes at the
  // very first guiding question rather than back in "en attente", since the
  // classement sans suite is what ended that wait.
  const handleRouvrirDossier = () => {
    const nextSuivi = { ...suiviDraft, demandeContactDate: '' };
    setSuiviDraft(nextSuivi);
    setContactAnswer(null);
    onUpdate?.(complaint.id, {
      avancement: 'a-traiter',
      suiviCloture: nextSuivi,
      historique: [...complaint.historique, buildHistoryEntry('Réouverture du dossier', 'Dossier rouvert.')],
    });
  };

  // Clôture is its own explicit step now — sending the réponse définitive
  // (handleConfirmNextStep, arSent branch) only marks that step done and
  // moves the stepper to "Clôture"; this is what actually closes the file.
  const handleCloturer = () => {
    onUpdate?.(complaint.id, {
      ...getReclamantPatch(),
      avancement: 'cloture',
      historique: [...complaint.historique, buildHistoryEntry('Clôture du dossier', 'Dossier clôturé.')],
    });
  };

  // Confirming the accusé de réception requires the réclamant's name and at
  // least one contact method. Rather than just disabling the button, a
  // click with those fields empty opens "Informations du réclamant" and
  // flags exactly which ones are missing.
  const handleConfirmAR = () => {
    const missing = !reclamantDraft.prenom || !reclamantDraft.nom || (!reclamantDraft.email && !reclamantDraft.telephone);
    if (missing) {
      setShowContactErrors(true);
      return;
    }
    setShowContactErrors(false);
    handleConfirmNextStep();
  };

  // Answering "Oui" reveals fields we didn't need until now (accusé de
  // réception date + message) — pre-fill them once, the first time, so the
  // user isn't starting from a blank message every time they revisit the tab.
  const handleContactAnswer = (value: 'oui' | 'non') => {
    setContactAnswer(value);
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    if (value === 'oui' && arMessageDraft === '') {
      setArDateDraft(todayLabel);
      setArMessageDraft(buildDefaultArMessage(complaint, reclamantDraft));
    }
    if (value === 'non' && demandeDateDraft === '') {
      setDemandeDateDraft(todayLabel);
    }
  };

  const showNextStepBanner = complaint.avancement !== 'cloture' && complaint.avancement !== 'sans-suite';

  // "Classer sans suite" only becomes available 10 days after the demande de
  // contact was sent, giving the réclamant a fair window to respond.
  const classerSansSuiteDate = enAttente ? addDaysToFrDate(complaint.suiviCloture.demandeContactDate, 10) : '';
  const canClasserSansSuite = (() => {
    if (!enAttente) return true;
    const threshold = parseFrDate(classerSansSuiteDate);
    return threshold ? new Date() >= threshold : true;
  })();

  const statusChipLabel = enAttente ? 'En attente' : AVANCEMENT_LABEL[complaint.avancement];
  const statusChipClassName = `chip dossier-status-chip ${
    enAttente ? 'dossier-status-chip-attente' : complaint.avancement !== 'a-traiter' ? 'dossier-status-chip-closed' : ''
  }`;

  // Shown once the guiding question is answered "Oui" — collects the extra
  // information (contact details + the AR itself) that wasn't needed until
  // now, then sends the accusé de réception.
  const renderReclamantFields = () => (
    <>
      <p className="dossier-block-title">Informations du réclamant</p>
      <div className="modal-row">
        <FormField
          label="Nom"
          required
          placeholder="Entrez le nom du réclamant"
          value={reclamantDraft.nom}
          error={nomMissing}
          errorText={nomMissing ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
        />
        <FormField
          label="Prénom"
          required
          placeholder="Entrez le prénom du réclamant"
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
          errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
        />
        <FormField
          label="Téléphone"
          required
          placeholder="Entrez le numéro de téléphone"
          value={reclamantDraft.telephone}
          error={contactMissing}
          errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
        />
      </div>
      <FormField label="Dénomination sociale" value={denominateurSocialDraft} onChange={setDenominateurSocialDraft} />
      <FormField label="Porteur du risque" value={porteurDuRisqueDraft} onChange={setPorteurDuRisqueDraft} />
      <FormSelect<Relation>
        label="Relation avec ce client"
        value={reclamantDraft.relation}
        options={(Object.keys(RELATION_LABEL) as Relation[]).map((id) => ({ id, label: RELATION_LABEL[id] }))}
        onChange={(v) => setReclamantDraft((d) => ({ ...d, relation: v }))}
      />
      {reclamantDraft.relation === 'autre' && (
        <FormField
          label="Précision"
          required
          placeholder="Précisez la relation avec le réclamant"
          value={reclamantDraft.relationAutrePrecision ?? ''}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, relationAutrePrecision: v }))}
        />
      )}
    </>
  );

  const renderArInfoFields = () => (
    <>
      <p className="dossier-block-title">Informations de l'accusé de réception</p>
      <div className="modal-row">
        <FormField label="Date d'envoi de l'accusé de réception" required value={arDateDraft} onChange={setArDateDraft} />
        <div className="dossier-field-spacer" />
      </div>
      <FormTextareaAutoGrow
        label="Message de l'accusé de réception"
        value={arMessageDraft}
        onChange={setArMessageDraft}
      />
    </>
  );

  const renderReponseInfoFields = () => (
    <>
      <p className="dossier-block-title">Information des actions menées</p>
      <div className="modal-row">
        <FormField
          label="Date de l'action immédiate"
          value={suiviDraft.actionImmediate}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
        />
        <FormField
          label="Date de l'action corrective"
          value={suiviDraft.actionCorrective}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
        />
      </div>
      <FormTextareaAutoGrow
        label="Action réalisée"
        value={suiviDraft.actionRealisee}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
      />
      <div className="modal-row">
        <FormSelect<string>
          label="Vérification de l'efficacité"
          value={suiviDraft.verificationEfficacite}
          options={VERIFICATION_EFFICACITE_OPTIONS}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
        />
        <div className="dossier-field-spacer" />
      </div>
      <p className="dossier-block-title">Informations de la réponse définitive</p>
      <div className="modal-row">
        <FormField
          label="Date d'envoi de la réponse définitive"
          required
          value={reponseDateDraft}
          onChange={setReponseDateDraft}
        />
        <div className="dossier-field-spacer" />
      </div>
      <FormTextareaAutoGrow
        label="Message de la réponse définitive"
        value={reponseMessageDraft}
        onChange={setReponseMessageDraft}
      />
    </>
  );

  const renderContactOuiFields = () => (
    <div className="dossier-treatment-fields">
      {renderReclamantFields()}
      {renderArInfoFields()}
    </div>
  );

  // The Traitement tab's primary action(s) — rendered once in a sticky
  // footer (see below) instead of inline at the end of the scrollable
  // content, so they stay reachable without scrolling to the bottom.
  let traitementActions: React.ReactNode = null;
  if (activeTab === 'traitement') {
    if (complaint.avancement === 'sans-suite') {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleRouvrirDossier}>
          Rouvrir le dossier
        </button>
      );
    } else if (!showNextStepBanner) {
      traitementActions = null;
    } else if (enAttente) {
      traitementActions = (
        <>
          <button type="button" className="btn-text" disabled={!canClasserSansSuite} onClick={handleClasserSansSuite}>
            Classer sans suite
          </button>
          <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmAR}>
            Confirmer l'envoi de l'accusé de réception
          </button>
        </>
      );
    } else if (!arSent) {
      if (contactAnswer === 'oui') {
        traitementActions = (
          <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmAR}>
            Confirmer l'envoi de l'accusé de réception
          </button>
        );
      } else if (contactAnswer === 'non') {
        traitementActions = (
          <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmDemande}>
            Confirmer la demande
          </button>
        );
      }
    } else if (responseSent) {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleCloturer}>
          Clôturer
        </button>
      );
    } else {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmNextStep}>
          Confirmer l’envoi de la Réponse Définitive
        </button>
      );
    }
  }

  return (
    <div
      className={`drawer-backdrop ${skipEnterAnimation ? 'drawer-noenter' : ''} ${closing ? 'drawer-closing' : ''}`}
      onClick={performClose}
    >
      <div
        className={`drawer-panel dossier-panel ${skipEnterAnimation ? 'drawer-noenter' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => setHeaderStuck(e.currentTarget.scrollTop > 4)}
      >
        <div className={`dossier-header ${headerStuck ? 'dossier-header-stuck' : ''}`}>
          <span className="dossier-title">Dossier {complaint.ticket}</span>
          <span className={statusChipClassName}>{statusChipLabel}</span>
          <div className="dossier-header-spacer" />
          <div className="export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="btn-filled dossier-export-btn"
              onClick={() => setExportMenuOpen((v) => !v)}
            >
              Exporter
              <svg
                viewBox="0 0 9 5.5575"
                width={12}
                height={7.4}
                fill="currentColor"
                className={`btn-link-icon ${exportMenuOpen ? 'btn-link-icon-flipped' : ''}`}
              >
                <path d="M7.9425 0L4.5 3.435L1.0575 0L0 1.0575L4.5 5.5575L9 1.0575L7.9425 0Z" />
              </svg>
            </button>
            <ExportMenu
              open={exportMenuOpen}
              preferences={exportPreferences}
              onChange={setExportPreferences}
              onExport={handleExportComplaint}
              selectionCount={1}
            />
          </div>
          <button type="button" className="drawer-close-button" aria-label="Fermer" onClick={performClose}>
            <img src={drawerClose} alt="" width={14} height={14} />
          </button>
        </div>

        <div
          className="dossier-content"
          ref={dossierContentRef}
          onScroll={(e) => {
            setTabsStuck(e.currentTarget.scrollTop > 4);
            updateFooterShadow(e.currentTarget);
          }}
        >
          <div className={`dossier-sticky-header ${tabsStuck ? 'dossier-sticky-header-stuck' : ''}`}>
            <DossierTabsControl value={activeTab} onChange={setActiveTab} />
          </div>

          {activeTab === 'traitement' && <DossierHStepper steps={steps} />}

          {activeTab === 'traitement' && (
            <>
              {complaint.avancement === 'sans-suite' ? (
                <div className="dossier-treatment-block dossier-treatment-block-centered">
                  <p className="dossier-done-text">
                    Ce dossier a été classé sans suite, si le réclamant transmet finalement ses informations, vous
                    pouvez rouvrir le dossier à tout moment.
                  </p>
                </div>
              ) : !showNextStepBanner ? (
                <div className="dossier-treatment-block dossier-treatment-block-centered">
                  <p className="dossier-done-text">Toutes les étapes ont été effectuées, le dossier a été clôturé.</p>
                </div>
              ) : enAttente ? (
                <div className="dossier-treatment-block">
                  <div className="dossier-alert-warning">
                    <div className="dossier-alert-warning-title-row">
                      <AlertTriangleIcon />
                      <span className="dossier-alert-warning-title">En attente du retour client</span>
                    </div>
                    <p className="dossier-alert-warning-text">
                      Demande d'information au réclamant envoyée le {complaint.suiviCloture.demandeContactDate}.
                    </p>
                    <p className="dossier-alert-warning-text">
                      Vous pourrez classer sans suite ce dossier en cas de non réponse ou de refus de partage des
                      informations de la part du réclamant à partir du {classerSansSuiteDate}.
                    </p>
                  </div>
                  {renderReclamantFields()}
                  {renderArInfoFields()}
                </div>
              ) : !arSent ? (
                <div className="dossier-treatment-block">
                  <div className="dossier-question-row">
                    <span className="dossier-question-text">Avez-vous les coordonnées du réclamant ?</span>
                    <ChoiceToggle value={contactAnswer} onChange={handleContactAnswer} />
                  </div>
                  {contactAnswer === 'oui' && renderContactOuiFields()}
                  {contactAnswer === 'non' && (
                    <div className="dossier-treatment-fields">
                      <div className="modal-row">
                        <FormField
                          label="Date de demande d'information"
                          required
                          value={demandeDateDraft}
                          onChange={setDemandeDateDraft}
                        />
                        <div className="dossier-field-spacer" />
                      </div>
                    </div>
                  )}
                </div>
              ) : responseSent ? (
                <div className="dossier-treatment-block">
                  {renderReclamantFields()}
                  {renderArInfoFields()}
                  {renderReponseInfoFields()}
                </div>
              ) : (
                <div className="dossier-treatment-block">{renderReponseInfoFields()}</div>
              )}
            </>
          )}

          {activeTab === 'informations' && (
          <>
          <AccordionSection
            icon={<FileTextIcon />}
            title="Informations de la réclamation"
            badge={{ label: 'Complété', className: 'chip-mes-reclamations' }}
            open={openSections.has('informations')}
            onToggle={() => toggleSection('informations')}
          >
            <div className="dossier-field-row">
              <SectionTextField label="Référence" value={complaint.ticket} required readOnly />
              <SectionTextField label="Canal de réception" value="Web" required readOnly />
            </div>
            <div className="dossier-field-row">
              <div className="dossier-field">
                <span className="dossier-field-label">Statut de progression</span>
                <span className={statusChipClassName} style={{ alignSelf: 'flex-start' }}>
                  {statusChipLabel}
                </span>
              </div>
              <div className="dossier-field">
                <span className="dossier-field-label">Statut de conformité</span>
                <span
                  className={`chip complaints-chip-conformite-${complaint.conformite}`}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {CONFORMITE_LABEL[complaint.conformite]}
                </span>
              </div>
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Date de réception"
                value={infoDraft.dateReception}
                required
                onChange={(v) => setInfoDraft((d) => ({ ...d, dateReception: v }))}
              />
              <div className="dossier-field-spacer" />
            </div>
            <SectionTextField
              label="Objet de la réclamation"
              value={infoDraft.objet}
              required
              onChange={(v) => setInfoDraft((d) => ({ ...d, objet: v }))}
            />
            <SectionTextField
              label="Description"
              value={infoDraft.description}
              multiline
              plain
              required
              onChange={(v) => setInfoDraft((d) => ({ ...d, description: v }))}
            />
            {complaint.sourceUrl && (
              <SectionTextField
                label="Lien de la source"
                value={infoDraft.sourceUrl}
                plain
                required
                onChange={(v) => setInfoDraft((d) => ({ ...d, sourceUrl: v }))}
                endAdornment={
                  <a href={toHref(infoDraft.sourceUrl)} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight />
                  </a>
                }
              />
            )}
            <div className="dossier-field-row">
              <SectionSelectField
                label="Interlocuteur en charge"
                value={traitementDraft.interlocuteur}
                options={INTERLOCUTEURS.map((label) => ({ id: label, label }))}
                onChange={(v) => setTraitementDraft((d) => ({ ...d, interlocuteur: v }))}
              />
              <div className="dossier-field-spacer" />
            </div>
            <SectionTextField
              label="Notes internes"
              multiline
              placeholder="Ajouter des informations supplémentaires..."
              value={notesDraft}
              onChange={setNotesDraft}
            />
            <SaveButton disabled={!infoDirty} onClick={saveInfo} />
          </AccordionSection>

          <AccordionSection
            icon={<UserIcon />}
            title="Informations du réclamant"
            badge={
              reclamantMissing > 0
                ? { label: `${reclamantMissing} manquante${reclamantMissing > 1 ? 's' : ''}`, className: 'chip-possible' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('reclamant')}
            onToggle={() => toggleSection('reclamant')}
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Prénom"
                required
                placeholder="Entrez le prénom du réclamant"
                value={reclamantDraft.prenom}
                error={prenomMissing}
                errorText={prenomMissing ? 'Champ requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
              />
              <SectionTextField
                label="Nom"
                required
                placeholder="Entrez le nom du réclamant"
                value={reclamantDraft.nom}
                error={nomMissing}
                errorText={nomMissing ? 'Champ requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Email"
                required
                placeholder="Entrez une adresse email"
                value={reclamantDraft.email}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
              />
              <SectionTextField
                label="Téléphone (optionnel)"
                placeholder="Entrez le numéro de téléphone"
                value={reclamantDraft.telephone}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Dénomination Sociale"
                value={denominateurSocialDraft}
                onChange={setDenominateurSocialDraft}
              />
              <SectionTextField
                label="Porteur du risque"
                placeholder="Entrez le nom du porteur du risque"
                value={porteurDuRisqueDraft}
                onChange={setPorteurDuRisqueDraft}
              />
            </div>
            <div className="dossier-field-row">
              <SectionSelectField<Relation>
                label="Relation avec ce client"
                value={reclamantDraft.relation}
                options={(Object.keys(RELATION_LABEL) as Relation[]).map((id) => ({ id, label: RELATION_LABEL[id] }))}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, relation: v }))}
              />
              <div className="dossier-field-spacer" />
            </div>
            {reclamantDraft.relation === 'autre' && (
              <SectionTextField
                label="Précision"
                required
                placeholder="Précisez la relation avec le réclamant"
                value={reclamantDraft.relationAutrePrecision ?? ''}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, relationAutrePrecision: v }))}
              />
            )}
            <SaveButton disabled={!reclamantDirty} onClick={saveReclamant} />
          </AccordionSection>

          <AccordionSection
            icon={<CalendarCheckIcon />}
            title="Suivi et clôture"
            badge={
              suiviMissing > 0
                ? { label: `${suiviMissing} à vérifier`, className: 'chip-declinee' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('suivi')}
            onToggle={() => toggleSection('suivi')}
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Date d'envoi de l'accusé de réception"
                value={suiviDraft.dateAR}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateAR: v }))}
              />
              <SectionTextField
                label="Date d'envoi de la réponse intermédiaire"
                value={suiviDraft.dateReponse}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateReponse: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Date de l'action immédiate"
                value={suiviDraft.actionImmediate}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
              />
              <SectionTextField
                label="Date de l'action corrective"
                value={suiviDraft.actionCorrective}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
              />
            </div>
            <SectionTextField
              label="Action réalisée"
              value={suiviDraft.actionRealisee}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
            />
            <SectionTextField
              label="Vérification d'efficacité"
              value={suiviDraft.verificationEfficacite}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
            />
            <SectionTextField
              label="Réponse apportée"
              value={suiviDraft.reponseApportee}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, reponseApportee: v }))}
            />
            <SaveButton disabled={!suiviDirty} onClick={saveSuivi} />
          </AccordionSection>
          </>
          )}

          {activeTab === 'historique' && (
            <div className="dossier-history">
              {[...complaint.historique].reverse().map((entry, index) => (
                <div key={index} className="dossier-history-item">
                  <div className="dossier-history-content">
                    <span className="dossier-history-title">{entry.title}</span>
                    <span className="dossier-history-description">{entry.description}</span>
                    <span className="dossier-history-meta">
                      {entry.date} · par {entry.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {traitementActions && (
          <div className={`dossier-traitement-footer ${footerShadow ? 'dossier-traitement-footer-shadow' : ''}`}>
            {traitementActions}
          </div>
        )}
      </div>

      {showUnsavedConfirm && (
        <div className="confirm-dialog-backdrop" onClick={() => setShowUnsavedConfirm(false)}>
          <div className="confirm-dialog-paper" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="confirm-dialog-close"
              aria-label="Annuler"
              onClick={() => setShowUnsavedConfirm(false)}
            >
              <img src={drawerClose} alt="" width={14} height={14} />
            </button>
            <p className="confirm-dialog-title">Informations non sauvegardées</p>
            <p className="confirm-dialog-body">
              Vous avez des modifications non sauvegardées dans ce dossier. Si vous fermez maintenant, elles seront
              perdues.
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  closeForReal();
                }}
              >
                Quitter sans sauvegarder
              </button>
              <button type="button" className="btn-filled" onClick={handleSaveAndClose}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
