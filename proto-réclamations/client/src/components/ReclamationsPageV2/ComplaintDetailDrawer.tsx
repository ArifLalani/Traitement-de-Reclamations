import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import drawerClose from '../../assets/figma/drawer-close.svg';
import ArrowUpRight from './ArrowUpRight';
import ExportMenu, { type ExportPreferences } from './ExportMenu';
import { FormField, FormSelect, FormTextareaAutoGrow } from './FormFields';
import HoverTooltip from './HoverTooltip';
import { exportComplaintsToCsv } from './exportComplaints';
import {
  AVANCEMENT_LABEL,
  CONFORMITE_LABEL,
  getDossierSteps,
  INTERLOCUTEURS,
  padFrDate,
  STATUT_CLIENT_DESCRIPTION,
  STATUT_CLIENT_LABEL,
  type Complaint,
  type DossierStep,
  type HistoriqueEntry,
  type Reclamant,
  type StatutClient,
  type SuiviCloture,
  type Traitement,
} from './complaintsData';

// A single field's new value, tracked alongside its label so a "Modification
// de ..." history entry can show what was actually chosen, not just which
// fields changed — the shape is generic enough to cover any input type
// (text, date, select, toggle) as long as the value is stringified first.
type ChangedField = { label: string; value: string };

// History entries whose title matches one of the dossier's core stepper
// milestones — flagged in the "Historique" tab so they stand out from
// routine edits (field changes, reassignments, etc.).
const KEY_HISTORY_STEPS = new Set([
  'Réception de la mention',
  'Création de la réclamation',
  'Confirmation de la demande de contact',
  "Confirmation de l'envoi de l'Accusé de Réception",
  'Confirmation de l’envoi de la Réponse Définitive',
  'Clôture du dossier',
]);

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

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

// The "Suivi et clôture" date fields are plain text inputs — zero-pad them
// all before they're saved, in case one was typed as "1/9/2026".
function padSuiviDates(suivi: SuiviCloture): SuiviCloture {
  return {
    ...suivi,
    dateAR: padFrDate(suivi.dateAR),
    dateReponse: padFrDate(suivi.dateReponse),
    actionImmediate: padFrDate(suivi.actionImmediate),
    actionCorrective: padFrDate(suivi.actionCorrective),
    demandeContactDate: padFrDate(suivi.demandeContactDate),
  };
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
    <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.18934 2.68934C4.47064 2.40804 4.85217 2.25 5.25 2.25H14.25C14.4489 2.25 14.6397 2.32902 14.7803 2.46967L20.0303 7.71967C20.171 7.86032 20.25 8.05109 20.25 8.25V20.25C20.25 20.6478 20.092 21.0294 19.8107 21.3107C19.5294 21.592 19.1478 21.75 18.75 21.75H5.25C4.85218 21.75 4.47065 21.592 4.18934 21.3107C3.90804 21.0294 3.75 20.6478 3.75 20.25V3.75C3.75 3.35217 3.90804 2.97064 4.18934 2.68934ZM13.9393 3.75L5.25 3.75L5.25 20.25H18.75V8.56066L13.9393 3.75Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.25 2.25C14.6642 2.25 15 2.58579 15 3V7.5H19.5C19.9142 7.5 20.25 7.83579 20.25 8.25C20.25 8.66421 19.9142 9 19.5 9H14.25C13.8358 9 13.5 8.66421 13.5 8.25V3C13.5 2.58579 13.8358 2.25 14.25 2.25Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 12.75C8.25 12.3358 8.58579 12 9 12H15C15.4142 12 15.75 12.3358 15.75 12.75C15.75 13.1642 15.4142 13.5 15 13.5H9C8.58579 13.5 8.25 13.1642 8.25 12.75Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 15.75C8.25 15.3358 8.58579 15 9 15H15C15.4142 15 15.75 15.3358 15.75 15.75C15.75 16.1642 15.4142 16.5 15 16.5H9C8.58579 16.5 8.25 16.1642 8.25 15.75Z"
      />
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

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 17V3.5c0-.3.2-.5.5-.5H15l-2.5 4L15 11H4.5" strokeLinecap="round" strokeLinejoin="round" />
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
  helpText?: string;
  // Which way the tooltip should open from the "?" icon — 'left' (default)
  // extends rightward, 'right' extends leftward instead, for a field that
  // otherwise has its tooltip clipped by the drawer's edge (e.g. the
  // right-hand field of a two-column row).
  helpAlign?: 'left' | 'right';
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
  helpText,
  helpAlign = 'left',
  onChange,
  endAdornment,
}: TextFieldProps) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
        {helpText && (
          <HoverTooltip text={helpText} align={helpAlign} className="dossier-field-help">
            <span className="dossier-field-help-icon">?</span>
          </HoverTooltip>
        )}
      </span>
      <div
        className={`dossier-field-input ${readOnly || plain ? 'dossier-field-input-readonly' : ''} ${error ? 'dossier-field-input-error' : ''}`}
      >
        {multiline ? (
          <textarea
            value={readOnly && value === '' ? '-' : value}
            placeholder={readOnly ? undefined : placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            type="text"
            value={readOnly && value === '' ? '-' : value}
            placeholder={readOnly ? undefined : placeholder}
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
  disabled,
}: {
  label: string;
  value: T | '';
  required?: boolean;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  const fieldRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value);

  useLayoutEffect(() => {
    if (!open || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    setMenuStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (disabled) {
    const selectedLabel = selected?.label || '-';
    return (
      <div className="dossier-field">
        <span className="dossier-field-label">
          {label} {required && <span className="dossier-field-required">*</span>}
        </span>
        <div className="dossier-field-input dossier-field-input-readonly">
          <input type="text" value={selectedLabel} readOnly />
        </div>
      </div>
    );
  }

  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div ref={fieldRef} className="dossier-field-input">
        <button type="button" className="field-dropdown-trigger" onClick={() => setOpen((v) => !v)}>
          <span className={`field-dropdown-value ${!selected ? 'field-dropdown-value-placeholder' : ''}`}>
            {selected?.label ?? 'Sélectionner...'}
          </span>
        </button>
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="currentColor"
          className={`field-caret ${open ? 'field-caret-open' : ''}`}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      {open &&
        createPortal(
          <div className="scope-v2">
            <div
              ref={menuRef}
              className="field-dropdown-menu"
              style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`field-dropdown-item ${option.id === value ? 'field-dropdown-item-selected' : ''}`}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className="field-dropdown-item-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
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

function ChoiceToggle({
  value,
  onChange,
  error,
  disabled,
}: {
  value: 'oui' | 'non' | null;
  onChange: (value: 'oui' | 'non') => void;
  error?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="dossier-choice-answer">{value === 'oui' ? 'Oui' : value === 'non' ? 'Non' : '-'}</span>;
  }
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
  // Accusé de réception date — only asked for once the guiding question
  // above is answered "Oui" (the réclamant's contact info is known), since
  // sending an AR requires more than what we had until then. Left blank by
  // default while "en attente" — the field isn't expected to be filled in
  // until the réclamant's info actually comes back.
  const [arDateDraft, setArDateDraft] = useState(() => complaint.suiviCloture.dateAR);
  // Réponse définitive date — same idea, one step later.
  // Date de demande d'information — shown once the guiding question is
  // answered "Non" (no contact info available yet).
  const [demandeDateDraft, setDemandeDateDraft] = useState(() => complaint.suiviCloture.demandeContactDate);
  const [reponseDateDraft, setReponseDateDraft] = useState(() => {
    if (complaint.suiviCloture.dateReponse !== '') return complaint.suiviCloture.dateReponse;
    return complaint.suiviCloture.dateAR !== '' ? new Date().toLocaleDateString('fr-FR') : '';
  });
  const [headerStuck, setHeaderStuck] = useState(false);
  const [tabsStuck, setTabsStuck] = useState(false);
  const [footerShadow, setFooterShadow] = useState(false);
  const dossierContentRef = useRef<HTMLDivElement>(null);
  const dossierContentInnerRef = useRef<HTMLDivElement>(null);

  // The footer's drop-shadow should only show when content actually scrolls
  // underneath it — a short screen (e.g. "Rouvrir le dossier" with no fields
  // above it) has nothing passing under the bar, so no shadow is needed.
  const updateFooterShadow = (el: HTMLElement) => {
    setFooterShadow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };

  useEffect(() => {
    const el = dossierContentRef.current;
    const inner = dossierContentInnerRef.current;
    if (!el || !inner) return;
    updateFooterShadow(el);
    // Observing the inner wrapper (not the outer flex:1/overflow:auto
    // container) so a field revealed by user interaction — not just a
    // window resize — also triggers a recheck: the outer container's own
    // box never resizes from its content growing, only this wrapper's does.
    const observer = new ResizeObserver(() => updateFooterShadow(el));
    observer.observe(inner);
    return () => observer.disconnect();
  }, [activeTab]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportPreferences>({
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
    exportComplaintsToCsv([complaint]);
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
  const buildHistoryEntry = (
    title: string,
    description: string,
    changes?: ChangedField[],
  ): HistoriqueEntry => {
    const now = new Date();
    return {
      title,
      description,
      changes,
      date: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      author: 'Joe Bleau',
    };
  };
  const withHistory = (title: string, changed: ChangedField[]): Pick<Complaint, 'historique'> | Record<string, never> => {
    if (changed.length === 0) return {};
    const description = `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`;
    return { historique: [...complaint.historique, buildHistoryEntry(title, description, changed)] };
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
    const changed: ChangedField[] = [];
    if (infoDraft.dateReception !== complaint.dateReception)
      changed.push({ label: 'Date de réception', value: padFrDate(infoDraft.dateReception) || '-' });
    if (infoDraft.objet !== complaint.objet) changed.push({ label: 'Objet de la réclamation', value: infoDraft.objet || '-' });
    if (infoDraft.description !== complaint.description)
      changed.push({ label: 'Description', value: infoDraft.description || '-' });
    if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? ''))
      changed.push({ label: 'Lien de la source', value: infoDraft.sourceUrl || '-' });
    if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur)
      changed.push({ label: 'Interlocuteur en charge', value: traitementDraft.interlocuteur || '-' });
    if (notesDraft !== complaint.notesInternes) changed.push({ label: 'Notes internes', value: notesDraft || '-' });
    onUpdate?.(complaint.id, {
      ...infoDraft,
      dateReception: padFrDate(infoDraft.dateReception),
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
    const changed: ChangedField[] = [];
    if (reclamantDraft.prenom !== complaint.reclamant.prenom)
      changed.push({ label: 'Prénom', value: reclamantDraft.prenom || '-' });
    if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push({ label: 'Nom', value: reclamantDraft.nom || '-' });
    if (reclamantDraft.email !== complaint.reclamant.email)
      changed.push({ label: 'Email', value: reclamantDraft.email || '-' });
    if (reclamantDraft.telephone !== complaint.reclamant.telephone)
      changed.push({ label: 'Téléphone', value: reclamantDraft.telephone || '-' });
    if (reclamantDraft.adresse !== complaint.reclamant.adresse)
      changed.push({ label: 'Adresse', value: reclamantDraft.adresse || '-' });
    if (reclamantDraft.rattacheContrat !== complaint.reclamant.rattacheContrat)
      changed.push({
        label: 'Rattachement à un contrat',
        value: reclamantDraft.rattacheContrat === 'oui' ? 'Oui' : reclamantDraft.rattacheContrat === 'non' ? 'Non' : '-',
      });
    if (reclamantDraft.statutClient !== complaint.reclamant.statutClient)
      changed.push({
        label: 'Statut du client',
        value: reclamantDraft.statutClient ? STATUT_CLIENT_LABEL[reclamantDraft.statutClient] : '-',
      });
    if (denominateurSocialDraft !== complaint.denominateurSocial)
      changed.push({ label: 'Dénomination sociale', value: denominateurSocialDraft || '-' });
    if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque)
      changed.push({ label: 'Assureur / Porteur du risque', value: porteurDuRisqueDraft || '-' });
    onUpdate?.(complaint.id, {
      reclamant: reclamantDraft,
      denominateurSocial: denominateurSocialDraft,
      classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      ...withHistory('Modification des informations du réclamant', changed),
    });
  };
  // Highlights the specific missing fields in "Informations du réclamant"
  // once the user has tried (and failed) to confirm the accusé de
  // réception — clears itself per-field as soon as that field is filled.
  const [showContactErrors, setShowContactErrors] = useState(false);
  const prenomMissing = showContactErrors && !reclamantDraft.prenom;
  const nomMissing = showContactErrors && !reclamantDraft.nom;
  const contactMissing = showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone;
  const rattacheContratMissing = showContactErrors && !reclamantDraft.rattacheContrat;
  const statutClientMissing =
    showContactErrors && reclamantDraft.rattacheContrat === 'oui' && !reclamantDraft.statutClient;

  // Clicking "Confirmer" can fail validation while the user is scrolled past
  // the offending field(s) — scroll the first error back into view instead
  // of silently flagging fields they can't currently see. Runs on every
  // click (not just when showContactErrors flips false->true), since the
  // user may have scrolled away again since the last failed attempt.
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const firstError = dossierContentRef.current?.querySelector(
        '.field-border-error, .dossier-field-input-error, .dossier-choice-row-error',
      );
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // --- Suivi et clôture ---
  const [suiviDraft, setSuiviDraft] = useState<SuiviCloture>(complaint.suiviCloture);
  const suiviDirty = JSON.stringify(suiviDraft) !== JSON.stringify(complaint.suiviCloture);
  const saveSuivi = () => {
    const changed: ChangedField[] = [];
    if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR)
      changed.push({ label: "Date d'envoi de l'accusé de réception", value: padFrDate(suiviDraft.dateAR) || '-' });
    if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
      changed.push({ label: "Date d'envoi de la réponse définitive", value: padFrDate(suiviDraft.dateReponse) || '-' });
    if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
      changed.push({ label: "Date de l'action immédiate", value: padFrDate(suiviDraft.actionImmediate) || '-' });
    if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
      changed.push({ label: "Date de l'action corrective", value: padFrDate(suiviDraft.actionCorrective) || '-' });
    if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee)
      changed.push({ label: 'Actions réalisées', value: suiviDraft.actionRealisee || '-' });
    if (suiviDraft.actionsCorrectives !== complaint.suiviCloture.actionsCorrectives)
      changed.push({ label: 'Réponses apportées', value: suiviDraft.actionsCorrectives || '-' });
    if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
      changed.push({ label: "Vérification d'efficacité", value: suiviDraft.verificationEfficacite || '-' });
    onUpdate?.(complaint.id, {
      suiviCloture: padSuiviDates(suiviDraft),
      ...withHistory('Modification du suivi et clôture', changed),
    });
  };
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
      const changed: ChangedField[] = [];
      if (infoDraft.dateReception !== complaint.dateReception)
        changed.push({ label: 'Date de réception', value: padFrDate(infoDraft.dateReception) || '-' });
      if (infoDraft.objet !== complaint.objet) changed.push({ label: 'Objet de la réclamation', value: infoDraft.objet || '-' });
      if (infoDraft.description !== complaint.description)
        changed.push({ label: 'Description', value: infoDraft.description || '-' });
      if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? ''))
        changed.push({ label: 'Lien de la source', value: infoDraft.sourceUrl || '-' });
      if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur)
        changed.push({ label: 'Interlocuteur en charge', value: traitementDraft.interlocuteur || '-' });
      if (notesDraft !== complaint.notesInternes) changed.push({ label: 'Notes internes', value: notesDraft || '-' });
      Object.assign(updates, {
        ...infoDraft,
        dateReception: padFrDate(infoDraft.dateReception),
        sourceUrl: infoDraft.sourceUrl || undefined,
        traitement: traitementDraft,
        notesInternes: notesDraft,
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry(
            'Modification des informations de la réclamation',
            `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`,
            changed,
          ),
        ];
      }
    }

    if (reclamantDirty) {
      const changed: ChangedField[] = [];
      if (reclamantDraft.prenom !== complaint.reclamant.prenom)
        changed.push({ label: 'Prénom', value: reclamantDraft.prenom || '-' });
      if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push({ label: 'Nom', value: reclamantDraft.nom || '-' });
      if (reclamantDraft.email !== complaint.reclamant.email)
        changed.push({ label: 'Email', value: reclamantDraft.email || '-' });
      if (reclamantDraft.telephone !== complaint.reclamant.telephone)
        changed.push({ label: 'Téléphone', value: reclamantDraft.telephone || '-' });
      if (reclamantDraft.adresse !== complaint.reclamant.adresse)
        changed.push({ label: 'Adresse', value: reclamantDraft.adresse || '-' });
      if (reclamantDraft.rattacheContrat !== complaint.reclamant.rattacheContrat)
        changed.push({
          label: 'Rattachement à un contrat',
          value: reclamantDraft.rattacheContrat === 'oui' ? 'Oui' : reclamantDraft.rattacheContrat === 'non' ? 'Non' : '-',
        });
      if (reclamantDraft.statutClient !== complaint.reclamant.statutClient)
        changed.push({
          label: 'Statut du client',
          value: reclamantDraft.statutClient ? STATUT_CLIENT_LABEL[reclamantDraft.statutClient] : '-',
        });
      if (denominateurSocialDraft !== complaint.denominateurSocial)
        changed.push({ label: 'Dénomination sociale', value: denominateurSocialDraft || '-' });
      if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque)
        changed.push({ label: 'Assureur / Porteur du risque', value: porteurDuRisqueDraft || '-' });
      Object.assign(updates, {
        reclamant: reclamantDraft,
        denominateurSocial: denominateurSocialDraft,
        classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry(
            'Modification des informations du réclamant',
            `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`,
            changed,
          ),
        ];
      }
    }

    if (suiviDirty) {
      const changed: ChangedField[] = [];
      if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR)
        changed.push({ label: "Date d'envoi de l'accusé de réception", value: padFrDate(suiviDraft.dateAR) || '-' });
      if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
        changed.push({ label: "Date d'envoi de la réponse définitive", value: padFrDate(suiviDraft.dateReponse) || '-' });
      if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
        changed.push({ label: "Date de l'action immédiate", value: padFrDate(suiviDraft.actionImmediate) || '-' });
      if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
        changed.push({ label: "Date de l'action corrective", value: padFrDate(suiviDraft.actionCorrective) || '-' });
      if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee)
        changed.push({ label: 'Actions réalisées', value: suiviDraft.actionRealisee || '-' });
      if (suiviDraft.actionsCorrectives !== complaint.suiviCloture.actionsCorrectives)
        changed.push({ label: 'Réponses apportées', value: suiviDraft.actionsCorrectives || '-' });
      if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
        changed.push({ label: "Vérification d'efficacité", value: suiviDraft.verificationEfficacite || '-' });
      Object.assign(updates, { suiviCloture: padSuiviDates(suiviDraft) });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry(
            'Modification du suivi et clôture',
            `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`,
            changed,
          ),
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
  // Once a dossier is clôturé, its Informations tab becomes a read-only
  // record of the case instead of an editable form.
  const isClosed = complaint.avancement === 'cloture';

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
      const dateLabel = padFrDate(arDateDraft || todayLabel);
      const nextSuivi = { ...suiviDraft, dateAR: dateLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        ...getReclamantPatch(),
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            "Confirmation de l'envoi de l'Accusé de Réception",
            'Accusé de réception envoyé au réclamant.',
          ),
        ],
      });
      // Pre-fill the next step's (réponse définitive) date now, the same
      // way arDateDraft was pre-filled when this step started.
      if (reponseDateDraft === '') setReponseDateDraft(todayLabel);
    } else {
      const dateLabel = padFrDate(reponseDateDraft || todayLabel);
      const nextSuivi = { ...suiviDraft, dateReponse: dateLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        ...getReclamantPatch(),
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            'Confirmation de l’envoi de la Réponse Définitive',
            'Réponse définitive envoyée au réclamant.',
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
    const dateLabel = padFrDate(demandeDateDraft || todayLabel);
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
      dateCloture: padFrDate(new Date().toLocaleDateString('fr-FR')),
      historique: [...complaint.historique, buildHistoryEntry('Clôture du dossier', 'Dossier clôturé.')],
    });
  };

  // Confirming the accusé de réception requires the réclamant's name and at
  // least one contact method. Rather than just disabling the button, a
  // click with those fields empty opens "Informations du réclamant" and
  // flags exactly which ones are missing.
  const handleConfirmAR = () => {
    const missing =
      !reclamantDraft.prenom ||
      !reclamantDraft.nom ||
      (!reclamantDraft.email && !reclamantDraft.telephone) ||
      !reclamantDraft.rattacheContrat ||
      (reclamantDraft.rattacheContrat === 'oui' && !reclamantDraft.statutClient);
    if (missing) {
      setShowContactErrors(true);
      scrollToFirstError();
      return;
    }
    setShowContactErrors(false);
    handleConfirmNextStep();
  };

  // Answering "Oui" reveals a field we didn't need until now (accusé de
  // réception date) — pre-fill it once, the first time.
  const handleContactAnswer = (value: 'oui' | 'non') => {
    setContactAnswer(value);
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    if (value === 'oui' && arDateDraft === '') {
      setArDateDraft(todayLabel);
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
      {renderReclamantFieldsBody()}
    </>
  );

  // Same fields, without the leading title — used where the title is
  // rendered separately (e.g. above the "Avez-vous les coordonnées du
  // réclamant ?" question it now sits alongside).
  const renderReclamantFieldsBody = () => (
    <>
      <div className="modal-row">
        <FormField
          label="Nom du réclamant"
          required
          placeholder="Entrez le nom du réclamant"
          value={reclamantDraft.nom}
          error={nomMissing}
          errorText={nomMissing ? 'Champ requis' : undefined}
          onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
        />
        <FormField
          label="Prénom du réclamant"
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
          value={denominateurSocialDraft}
          onChange={setDenominateurSocialDraft}
        />
        <FormField
          label="Assureur / Porteur du risque"
          placeholder="Entrez le porteur du risque"
          value={porteurDuRisqueDraft}
          onChange={setPorteurDuRisqueDraft}
        />
      </div>
      <div className="dossier-question-row">
        <span className="dossier-question-text">
          Le réclamant est-il rattaché à un contrat ?<span className="field-required">*</span>
        </span>
        <ChoiceToggle
          value={reclamantDraft.rattacheContrat || null}
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
    </>
  );

  const renderArDateField = () => (
    <div className="modal-row">
      <FormField
        label="Date d'envoi de l'accusé de réception"
        required
        placeholder="JJ/MM/AAAA"
        value={arDateDraft}
        onChange={setArDateDraft}
      />
      <div className="dossier-field-spacer" />
    </div>
  );

  // hideAlert: the "clôturer le dossier" review step already carries its own
  // single "vérifiez que tout est renseigné" alert covering every field
  // below it, so this field's own instructional alert would be redundant
  // there.
  const renderArInfoFields = (hideAlert = false) => (
    <>
      <p className="dossier-block-title">Informations de l'accusé de réception</p>
      {hideAlert ? (
        renderArDateField()
      ) : (
        <div className="dossier-alert-field-group">
          <div className="dossier-alert-info">
            <p>
              L'accusé de réception doit être envoyé au réclamant de votre côté (email, courrier...). Une fois
              l'envoi effectué, renseignez ci-dessous la date à laquelle il a été envoyé.
            </p>
            <p>En cas de contrôle, un justificatif pourra être demandé.</p>
          </div>
          {renderArDateField()}
        </div>
      )}
    </>
  );

  const renderReponseDateField = () => (
    <div className="modal-row">
      <FormField
        label="Date d'envoi de la réponse définitive"
        required
        placeholder="JJ/MM/AAAA"
        value={reponseDateDraft}
        onChange={setReponseDateDraft}
      />
      <div className="dossier-field-spacer" />
    </div>
  );

  // hideAlert: see renderArInfoFields — same reasoning for the "clôturer le
  // dossier" review step.
  const renderReponseInfoFields = (hideAlert = false) => (
    <>
      <p className="dossier-block-title">Informations des actions menées</p>
      <div className="modal-row">
        <FormField
          label="Date de l'action immédiate"
          placeholder="JJ/MM/AAAA"
          value={suiviDraft.actionImmediate}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
        />
        <FormField
          label="Date de l'action corrective"
          placeholder="JJ/MM/AAAA"
          value={suiviDraft.actionCorrective}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
        />
      </div>
      <FormTextareaAutoGrow
        label="Actions réalisées"
        placeholder="Décrivez les actions réalisées"
        value={suiviDraft.actionRealisee}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
      />
      <FormTextareaAutoGrow
        label="Réponses apportées"
        placeholder="Décrivez les réponses apportées"
        value={suiviDraft.actionsCorrectives}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, actionsCorrectives: v }))}
      />
      <div className="modal-row">
        <FormSelect<string>
          label="Vérification d'efficacité"
          value={suiviDraft.verificationEfficacite}
          options={VERIFICATION_EFFICACITE_OPTIONS}
          placeholder="Sélectionnez une vérification d'efficacité"
          onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
        />
        <div className="dossier-field-spacer" />
      </div>
      <p className="dossier-block-title">Informations de la réponse définitive</p>
      {hideAlert ? (
        renderReponseDateField()
      ) : (
        <div className="dossier-alert-field-group">
          <div className="dossier-alert-info">
            <p>
              La réponse définitive doit être envoyée au réclamant de votre côté (email, courrier...). Une fois
              l'envoi effectué, renseignez ci-dessous la date à laquelle elle a été envoyée.
            </p>
            <p>En cas de contrôle, un justificatif pourra être demandé.</p>
          </div>
          {renderReponseDateField()}
        </div>
      )}
    </>
  );

  const renderContactOuiFields = () => (
    <div className="dossier-treatment-fields">
      {renderReclamantFieldsBody()}
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
            Confirmer
          </button>
        </>
      );
    } else if (!arSent) {
      if (contactAnswer === 'oui') {
        traitementActions = (
          <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmAR}>
            Confirmer
          </button>
        );
      } else if (contactAnswer === 'non') {
        traitementActions = (
          <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmDemande}>
            Confirmer
          </button>
        );
      }
    } else if (responseSent) {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleCloturer}>
          Clôturer le dossier
        </button>
      );
    } else {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmNextStep}>
          Confirmer
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
          {/* The outer .dossier-content is flex:1 + overflow:auto, so its own
              box size never changes when children mount/grow — only this
              inner wrapper's natural height does. Observing it (rather than
              the outer container) is what lets the footer shadow react to
              content revealed by user interaction (e.g. answering a
              guiding question), not just to window resizes. */}
          <div ref={dossierContentInnerRef}>
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
                      <span className="dossier-alert-warning-title">En attente du retour du client</span>
                    </div>
                    <p className="dossier-alert-warning-text">
                      Demande d'information au réclamant envoyée le {complaint.suiviCloture.demandeContactDate}.
                    </p>
                    <p className="dossier-alert-warning-text">
                      Vous pourrez classer sans suite ce dossier en cas de non-réponse ou de refus de partage des
                      informations de la part du réclamant à partir du {classerSansSuiteDate}.
                    </p>
                  </div>
                  {renderReclamantFields()}
                  {renderArInfoFields()}
                </div>
              ) : !arSent ? (
                <div className="dossier-treatment-block">
                  <p className="dossier-block-title">Informations du réclamant</p>
                  <div className="dossier-question-row">
                    <span className="dossier-question-text">
                      Avez-vous les coordonnées du réclamant ?<span className="field-required">*</span>
                    </span>
                    <ChoiceToggle value={contactAnswer} onChange={handleContactAnswer} />
                  </div>
                  {contactAnswer === 'oui' && renderContactOuiFields()}
                  {contactAnswer === 'non' && (
                    <div className="dossier-treatment-fields">
                      <div className="dossier-alert-field-group">
                        <div className="dossier-alert-info">
                          La demande de coordonnées doit être envoyée au réclamant de votre côté. Renseignez la date
                          d'envoi ci-dessous, le dossier passera en attente.
                        </div>
                        <div className="modal-row">
                          <FormField
                            label="Date de demande d'information"
                            required
                            placeholder="JJ/MM/AAAA"
                            value={demandeDateDraft}
                            onChange={setDemandeDateDraft}
                          />
                          <div className="dossier-field-spacer" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : responseSent ? (
                <div className="dossier-treatment-block">
                  <div className="dossier-alert-info">
                    Vérifiez que les informations du dossier ont bien été renseignées dans leur globalité avant de
                    clôturer définitivement le dossier.
                  </div>
                  {renderReclamantFields()}
                  {renderArInfoFields(true)}
                  {renderReponseInfoFields(true)}
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
                label="Date de réception (mention)"
                value={infoDraft.dateReception}
                readOnly
              />
              {complaint.avancement === 'cloture' ? (
                <SectionTextField label="Date de clôture" value={complaint.dateCloture ?? ''} readOnly />
              ) : (
                <div className="dossier-field-spacer" />
              )}
            </div>
            <SectionTextField
              label="Objet de la réclamation"
              value={infoDraft.objet}
              required
              readOnly={isClosed}
              onChange={(v) => setInfoDraft((d) => ({ ...d, objet: v }))}
            />
            <SectionTextField
              label="Description"
              value={infoDraft.description}
              multiline
              plain
              required
              readOnly={isClosed}
              onChange={(v) => setInfoDraft((d) => ({ ...d, description: v }))}
            />
            {complaint.sourceUrl && (
              <SectionTextField
                label="Lien de la source"
                value={infoDraft.sourceUrl}
                plain
                required
                readOnly={isClosed}
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
                disabled={isClosed}
                onChange={(v) => setTraitementDraft((d) => ({ ...d, interlocuteur: v }))}
              />
              <div className="dossier-field-spacer" />
            </div>
            <SectionTextField
              label="Notes internes"
              multiline
              placeholder="Ajouter des informations supplémentaires..."
              value={notesDraft}
              readOnly={isClosed}
              onChange={setNotesDraft}
            />
            <SaveButton disabled={!infoDirty} onClick={saveInfo} />
          </AccordionSection>

          <AccordionSection
            icon={<UserIcon />}
            title="Informations du réclamant"
            open={openSections.has('reclamant')}
            onToggle={() => toggleSection('reclamant')}
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Nom du réclamant"
                required
                placeholder="Entrez le nom du réclamant"
                value={reclamantDraft.nom}
                error={nomMissing}
                errorText={nomMissing ? 'Champ requis' : undefined}
                readOnly={isClosed}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
              />
              <SectionTextField
                label="Prénom du réclamant"
                required
                placeholder="Entrez le prénom du réclamant"
                value={reclamantDraft.prenom}
                error={prenomMissing}
                errorText={prenomMissing ? 'Champ requis' : undefined}
                readOnly={isClosed}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Email"
                required
                placeholder="Entrez une adresse email"
                value={reclamantDraft.email}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un numéro de téléphone est requis' : undefined}
                readOnly={isClosed}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
              />
              <SectionTextField
                label="Numéro de téléphone"
                required
                placeholder="Entrez le numéro de téléphone"
                value={reclamantDraft.telephone}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un numéro de téléphone est requis' : undefined}
                readOnly={isClosed}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Dénomination sociale"
                value={denominateurSocialDraft}
                readOnly={isClosed}
                onChange={setDenominateurSocialDraft}
              />
              <SectionTextField
                label="Assureur / Porteur du risque"
                placeholder="Entrez le nom du porteur du risque"
                value={porteurDuRisqueDraft}
                readOnly={isClosed}
                onChange={setPorteurDuRisqueDraft}
              />
            </div>
            <div className="dossier-question-row">
              <span className="dossier-question-text">
                Le réclamant est-il rattaché à un contrat ?<span className="dossier-field-required">*</span>
              </span>
              <ChoiceToggle
                value={reclamantDraft.rattacheContrat || null}
                disabled={isClosed}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, rattacheContrat: v }))}
              />
            </div>
            {reclamantDraft.rattacheContrat === 'oui' && (
              <div className="dossier-field-row">
                <SectionSelectField<StatutClient>
                  label="Statut du client"
                  required
                  value={reclamantDraft.statutClient}
                  disabled={isClosed}
                  options={(Object.keys(STATUT_CLIENT_LABEL) as StatutClient[]).map((id) => ({
                    id,
                    label: STATUT_CLIENT_LABEL[id],
                  }))}
                  onChange={(v) => setReclamantDraft((d) => ({ ...d, statutClient: v }))}
                />
                <div className="dossier-field-spacer" />
              </div>
            )}
            <SaveButton disabled={!reclamantDirty} onClick={saveReclamant} />
          </AccordionSection>

          <AccordionSection
            icon={<CalendarCheckIcon />}
            title="Suivi et clôture"
            open={openSections.has('suivi')}
            onToggle={() => toggleSection('suivi')}
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Date d'envoi de l'accusé de réception"
                value={suiviDraft.dateAR}
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                helpText="L'accusé de réception doit être envoyé au réclamant de votre côté (email, courrier...). Renseignez ici la date à laquelle il a été envoyé. En cas de contrôle, un justificatif pourra être demandé."
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateAR: v }))}
              />
              <SectionTextField
                label="Date d'envoi de la réponse définitive"
                value={suiviDraft.dateReponse}
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                helpText="La réponse définitive doit être envoyée au réclamant de votre côté (email, courrier...). Renseignez ici la date à laquelle elle a été envoyée. En cas de contrôle, un justificatif pourra être demandé."
                helpAlign="right"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateReponse: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Date de l'action immédiate"
                value={suiviDraft.actionImmediate}
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
              />
              <SectionTextField
                label="Date de l'action corrective"
                value={suiviDraft.actionCorrective}
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
              />
            </div>
            <SectionTextField
              label="Actions réalisées"
              value={suiviDraft.actionRealisee}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
            />
            <SectionTextField
              label="Réponses apportées"
              value={suiviDraft.actionsCorrectives}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionsCorrectives: v }))}
            />
            <div className="dossier-field-row">
              <SectionSelectField<string>
                label="Vérification d'efficacité"
                value={suiviDraft.verificationEfficacite}
                disabled={isClosed}
                options={VERIFICATION_EFFICACITE_OPTIONS}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
              />
              <div className="dossier-field-spacer" />
            </div>
            <SaveButton disabled={!suiviDirty} onClick={saveSuivi} />
          </AccordionSection>
          </>
          )}

          {activeTab === 'historique' && (
            <div className="dossier-history">
              {[...complaint.historique].reverse().map((entry, index, arr) => (
                <div key={index} className="dossier-history-item">
                  <div className="dossier-history-marker">
                    {index !== arr.length - 1 && (
                      <div className="dossier-history-line">
                        <svg width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="1" y1="0" x2="1" y2="2000" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    {KEY_HISTORY_STEPS.has(entry.title) && (
                      <HoverTooltip
                        text="Étape clé du dossier"
                        align="left"
                        className="dossier-history-dot"
                      >
                        <FlagIcon />
                      </HoverTooltip>
                    )}
                  </div>
                  <div className="dossier-history-content">
                    <span className="dossier-history-title">{entry.title}</span>
                    <span className="dossier-history-description">{entry.description}</span>
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="dossier-history-changes">
                        {entry.changes.map((change, changeIndex) => (
                          <div key={changeIndex} className="dossier-history-change-row">
                            <span className="dossier-history-change-label">{change.label}</span>
                            <span className="dossier-history-change-value">{change.value}</span>
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
