import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import drawerClose from '../../assets/figma/drawer-close.svg';
import ArrowUpRight from './ArrowUpRight';
import { FormField, FormTextareaAutoGrow } from './FormFields';
import HoverTooltip from './HoverTooltip';
import { exportComplaintsToCsv } from './exportComplaints';
import {
  AVANCEMENT_LABEL,
  AVANCEMENT_TOOLTIP,
  CONFORMITE_LABEL,
  getConformiteTooltip,
  getContactTag,
  getDossierSteps,
  getEcheanceInfo,
  INTERLOCUTEURS,
  padFrDate,
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
  'Analyse de la cause',
]);


const DOSSIER_STEP_SHORT_LABELS = [
  'Réception de la mention',
  'Création de la réclamation',
  'Accusé de réception',
  'Réponse définitive',
  'Analyse de la cause',
];
// Same compact stepper used in the create-réclamation slider preview (see
// CreateReclamationSlider.tsx) — reused here as the persistent, always-open
// replacement for the old collapsible "Avancement du dossier" section.
function DossierHStepper({ steps }: { steps: DossierStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  const fillFraction = Math.min(completedCount, steps.length - 1) / (steps.length - 1);

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

const CLOSE_ANIMATION_DURATION = 200;
const ACCORDION_COLLAPSE_DURATION = 300;

// Placeholder wording pending the real templates the client will provide —
// one per "Niveau 1"/"Niveau 2" picked above the template.
const AR_MESSAGE_TEMPLATES: Record<ArNiveau, string> = {
  niveau1: `Bonjour,

Nous accusons réception de votre réclamation et vous en remercions.

Après une première analyse, votre dossier est recevable et va être instruit par nos équipes. Nous reviendrons vers vous avec une réponse définitive dans les meilleurs délais.

Cordialement,
Le service client`,
  niveau2: `Bonjour,

Nous accusons réception de votre réclamation et vous en remercions.

Votre dossier a été transmis à notre service compétent pour un examen approfondi. Compte tenu de sa nature, un délai supplémentaire pourra être nécessaire pour vous apporter une réponse complète et précise.

Nous reviendrons vers vous dans les meilleurs délais et restons à votre disposition pour tout complément d'information.

Cordialement,
Le service client`,
};

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

// Same icon as CreateReclamationSlider's CopyIcon, reused here for the
// accusé de réception's own message template.
function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
      <path d="M3 10.5V3.7A1.2 1.2 0 0 1 4.2 2.5h6.8" strokeLinecap="round" />
    </svg>
  );
}

// A history entry's "changes" value, clamped to 4 lines with a "Voir plus" /
// "Voir moins" toggle once it actually overflows — e.g. a full retranscribed
// author response, which can run much longer than the other change rows
// ever do. Same component as CreateReclamationSlider's, duplicated here
// since it's a distinct file.
function ExpandableHistoryValue({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  // Until measured, assume it might overflow so the very first (pre-paint)
  // render still applies the clamp box needed to measure it — once we know
  // it doesn't, drop the box entirely so a short value stays plain inline
  // text and aligns on the same baseline as its label instead of sitting
  // off per -webkit-box's own baseline rules.
  const [measured, setMeasured] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setMeasured(true);
  }, [value, expanded]);

  const clamped = !expanded && (overflowing || !measured);

  return (
    <span className="dossier-history-change-value-wrap">
      <span
        ref={valueRef}
        className={`dossier-history-change-value ${clamped ? 'dossier-history-change-value-clamped' : ''}`}
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

// A "plain" multiline field (e.g. the réclamation's own description) is
// display-only text, not something meant to be resized by dragging a
// corner — clamp it to 4 lines with a "Voir plus"/"Voir moins" toggle
// instead, same pattern as ExpandableHistoryValue above.
function ExpandableFieldText({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [measured, setMeasured] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setMeasured(true);
  }, [value, expanded]);

  const clamped = !expanded && (overflowing || !measured);

  return (
    <div className="dossier-field-readonly-text-wrap">
      <p
        ref={textRef}
        className={`dossier-field-readonly-text ${clamped ? 'dossier-field-readonly-text-clamped' : ''}`}
      >
        {value}
      </p>
      {(overflowing || expanded) && (
        <button type="button" className="dossier-history-change-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
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
  // "date" restricts input to digits and auto-inserts the "/" separators as
  // the user types (14092026 → 14/09/2026), instead of taking free text.
  type?: 'text' | 'date';
};

// Strips everything but digits, caps at 8 (JJMMAAAA), and re-inserts the "/"
// separators after the day and month groups as they fill in. Same behavior
// as FormFields' FormField date mask, duplicated here since this is a
// distinct field component (older accordion-based "Informations" tab).
function maskFrDateInput(raw: string, previous: string): string {
  let digits = raw.replace(/\D/g, '').slice(0, 8);
  if (raw.length < previous.length && digits.length === previous.replace(/\D/g, '').length) {
    digits = digits.slice(0, -1);
  }
  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  // Clamps each complete group to a real calendar value as soon as it's
  // typed, rather than letting something like "35/13/2026" or "31/04/2026"
  // (April has 30 days) sit there — month first, since the day clamp needs
  // to know it to find that month's last day. A month/year not typed yet
  // falls back to 12 and a leap year, so the day isn't clamped too early.
  if (month.length === 2) {
    month = String(Math.min(Math.max(parseInt(month, 10) || 1, 1), 12)).padStart(2, '0');
  }
  if (day.length === 2) {
    const monthNum = month.length === 2 ? parseInt(month, 10) : 12;
    const yearNum = year.length === 4 ? parseInt(year, 10) : 2000;
    const maxDay = new Date(yearNum, monthNum, 0).getDate();
    day = String(Math.min(Math.max(parseInt(day, 10) || 1, 1), maxDay)).padStart(2, '0');
  }

  let out = day;
  if (day.length === 2) out += '/';
  out += month;
  if (month.length === 2) out += '/';
  out += year;
  return out;
}

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
  type = 'text',
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
        className={`dossier-field-input ${readOnly || plain ? 'dossier-field-input-readonly' : ''} ${error ? 'dossier-field-input-error' : ''} ${multiline && !plain ? 'dossier-field-input-multiline' : ''}`}
      >
        {multiline ? (
          plain ? (
            <ExpandableFieldText value={value || '-'} />
          ) : (
            <textarea
              value={readOnly && value === '' ? '-' : value}
              placeholder={readOnly ? undefined : placeholder}
              readOnly={readOnly}
              onChange={(e) => onChange?.(e.target.value)}
            />
          )
        ) : (
          <input
            type="text"
            inputMode={type === 'date' ? 'numeric' : undefined}
            value={readOnly && value === '' ? '-' : value}
            placeholder={readOnly ? undefined : placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(type === 'date' ? maskFrDateInput(e.target.value, value) : e.target.value)}
          />
        )}
        {endAdornment && <span className="dossier-field-adornment">{endAdornment}</span>}
      </div>
      {error && errorText && <span className="dossier-field-error-text">{errorText}</span>}
    </div>
  );
}

const DROPDOWN_GAP = 4;
const DROPDOWN_MAX_HEIGHT = 300; // Keep in sync with .field-dropdown-menu's max-height.

// Always opens downward (never covers the fields above the trigger) — if
// there isn't enough room below for the full list, it's simply capped to
// whatever space is left and scrolls internally (.field-dropdown-menu
// already has overflow-y: auto). Same logic as FormFields' FormSelect,
// duplicated here since this is a distinct field component (older
// accordion-based "Informations" tab).
function computeDropdownPlacement(rect: DOMRect): { top: number; maxHeight: number } {
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP;
  return { top: rect.bottom + DROPDOWN_GAP, maxHeight: Math.max(0, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow)) };
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
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number; maxHeight: number }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
  const fieldRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value);

  useLayoutEffect(() => {
    if (!open || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    setMenuStyle({ ...computeDropdownPlacement(rect), left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    // Scrolling the menu's own option list (it can exceed its max-height)
    // fires a scroll event too — only a scroll elsewhere (e.g. the drawer
    // behind it moving the trigger) should close the menu.
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // The menu is portaled to <body>, so it isn't a DOM descendant of the
  // drawer's own scrollable body — scrolling over it would otherwise just
  // scroll the (short, capped) menu itself instead of that underlying
  // panel. Forward the wheel delta to the trigger's nearest scrollable
  // ancestor instead, so the panel moves like the menu wasn't even there.
  const handleMenuWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    let scrollParent = fieldRef.current?.parentElement ?? null;
    while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
      scrollParent = scrollParent.parentElement;
    }
    scrollParent?.scrollBy({ top: e.deltaY });
  };

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
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
                maxHeight: menuStyle.maxHeight,
              }}
              onWheel={handleMenuWheel}
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

// "Niveau 1"/"Niveau 2" picker shown above the AR message template — what
// each level actually changes is still to be decided, this is just the
// control for now.
type ArNiveau = 'niveau1' | 'niveau2';

const AR_NIVEAUX: { id: ArNiveau; label: string }[] = [
  { id: 'niveau1', label: 'Niveau 1' },
  { id: 'niveau2', label: 'Niveau 2' },
];

// Same sliding-pill pattern as DossierTabsControl below, but sized to fit
// its content instead of stretching full-width — see
// .dossier-tabs-segmented-small.
function ArNiveauControl({ value, onChange }: { value: ArNiveau; onChange: (niveau: ArNiveau) => void }) {
  const index = Math.max(0, AR_NIVEAUX.findIndex((n) => n.id === value));
  const style = { '--segment-count': AR_NIVEAUX.length } as CSSProperties;

  return (
    <div className="dossier-tabs-segmented dossier-tabs-segmented-small" style={style}>
      <div
        className="dossier-tabs-segment-indicator"
        style={{ transform: `translateX(calc(${index} * (100% + 4px)))` }}
      />
      {AR_NIVEAUX.map((niveau) => (
        <button
          key={niveau.id}
          type="button"
          className={`dossier-tabs-segment ${value === niveau.id ? 'dossier-tabs-segment-active' : ''}`}
          onClick={() => onChange(niveau.id)}
        >
          {niveau.label}
        </button>
      ))}
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
  // The réclamant's contact info is collected upfront now (mention slider,
  // before the dossier even exists), so there's no more guiding question
  // here — accusé de réception date is always askable straight away.
  const [arDateDraft, setArDateDraft] = useState(() => complaint.suiviCloture.dateAR);
  const [arDateMissing, setArDateMissing] = useState(false);
  // Required before "Confirmer" accepts the AR as sent — same certification
  // pattern as the mention slider's own "j'ai envoyé le message" checkboxes.
  const [arCertified, setArCertified] = useState(false);
  const [arCertifyMissing, setArCertifyMissing] = useState(false);
  const [arNiveau, setArNiveau] = useState<ArNiveau>('niveau1');
  const [arTemplateCopied, setArTemplateCopied] = useState(false);
  const handleCopyArTemplate = () => {
    navigator.clipboard.writeText(AR_MESSAGE_TEMPLATES[arNiveau]).then(() => {
      setArTemplateCopied(true);
      setTimeout(() => setArTemplateCopied(false), 2000);
    });
  };
  // Réponse définitive date — same idea, one step later.
  const [reponseDateDraft, setReponseDateDraft] = useState(() => {
    if (complaint.suiviCloture.dateReponse !== '') return complaint.suiviCloture.dateReponse;
    return complaint.suiviCloture.dateAR !== '' ? new Date().toLocaleDateString('fr-FR') : '';
  });
  // L'action corrective est obligatoire (contrairement à l'action curative,
  // facultative) — mêmes champs manquants/erreur que pour l'AR.
  const [actionCorrectiveDateMissing, setActionCorrectiveDateMissing] = useState(false);
  const [actionRealiseeMissing, setActionRealiseeMissing] = useState(false);
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
  const handleExportComplaint = () => {
    exportComplaintsToCsv([complaint]);
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
    // A réclamation clôturée faute d'avoir identifié l'auteur (canal
    // administrateur/rien) reprend son traitement dès que cette
    // identification vient d'être faite — this is the only save that can
    // happen on a clôturée dossier (see reclamantFieldsLocked), so reaching
    // here with a newly-set rattacheContrat always means exactly that.
    const reopening =
      complaint.avancement === 'cloture' &&
      complaint.reclamant.rattacheContrat === '' &&
      reclamantDraft.rattacheContrat !== '';
    const newEntries: HistoriqueEntry[] = [
      ...(changed.length > 0
        ? [
            buildHistoryEntry(
              'Modification des informations du réclamant',
              `Champs modifiés : ${changed.map((c) => c.label).join(', ')}.`,
              changed,
            ),
          ]
        : []),
      ...(reopening
        ? [
            buildHistoryEntry(
              'Réclamation rouverte',
              "L'auteur du commentaire a été identifié : la réclamation reprend son traitement.",
            ),
          ]
        : []),
    ];
    onUpdate?.(complaint.id, {
      reclamant: reclamantDraft,
      denominateurSocial: denominateurSocialDraft,
      classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      ...(reopening ? { avancement: 'a-traiter' as const } : {}),
      ...(newEntries.length > 0 ? { historique: [...complaint.historique, ...newEntries] } : {}),
    });
  };
  // Highlights the specific missing fields in "Informations du réclamant"
  // once the user has tried (and failed) to save it — clears itself
  // per-field as soon as that field is filled.
  const [showContactErrors, setShowContactErrors] = useState(false);
  const prenomMissing = showContactErrors && !reclamantDraft.prenom;
  const nomMissing = showContactErrors && !reclamantDraft.nom;
  const contactMissing = showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone;

  // Clicking "Sauvegarder" can fail validation while the user is scrolled
  // past the offending field(s) — scroll the first error back into view
  // instead of silently flagging fields they can't currently see. Runs on
  // every click (not just when showContactErrors flips false->true), since
  // the user may have scrolled away again since the last failed attempt.
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const firstError = dossierContentRef.current?.querySelector(
        '.field-border-error, .dossier-field-input-error, .dossier-choice-row-error, .dossier-certify-checkbox-wrap-error',
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
      changed.push({ label: "Date de l'action curative", value: padFrDate(suiviDraft.actionImmediate) || '-' });
    if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
      changed.push({ label: "Date de l'action corrective", value: padFrDate(suiviDraft.actionCorrective) || '-' });
    if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee)
      changed.push({ label: "Description de l'action corrective", value: suiviDraft.actionRealisee || '-' });
    if (suiviDraft.actionsCorrectives !== complaint.suiviCloture.actionsCorrectives)
      changed.push({ label: "Description de l'action curative", value: suiviDraft.actionsCorrectives || '-' });
    if (suiviDraft.exigence !== complaint.suiviCloture.exigence)
      changed.push({ label: 'Exigence', value: suiviDraft.exigence || '-' });
    if (suiviDraft.defaillance !== complaint.suiviCloture.defaillance)
      changed.push({ label: 'Défaillance', value: suiviDraft.defaillance || '-' });
    if (suiviDraft.preuve !== complaint.suiviCloture.preuve)
      changed.push({ label: 'Preuve', value: suiviDraft.preuve || '-' });
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
        changed.push({ label: "Date de l'action curative", value: padFrDate(suiviDraft.actionImmediate) || '-' });
      if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
        changed.push({ label: "Date de l'action corrective", value: padFrDate(suiviDraft.actionCorrective) || '-' });
      if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee)
        changed.push({ label: "Description de l'action corrective", value: suiviDraft.actionRealisee || '-' });
      if (suiviDraft.actionsCorrectives !== complaint.suiviCloture.actionsCorrectives)
        changed.push({ label: "Description de l'action curative", value: suiviDraft.actionsCorrectives || '-' });
      if (suiviDraft.exigence !== complaint.suiviCloture.exigence)
        changed.push({ label: 'Exigence', value: suiviDraft.exigence || '-' });
      if (suiviDraft.defaillance !== complaint.suiviCloture.defaillance)
        changed.push({ label: 'Défaillance', value: suiviDraft.defaillance || '-' });
      if (suiviDraft.preuve !== complaint.suiviCloture.preuve)
        changed.push({ label: 'Preuve', value: suiviDraft.preuve || '-' });
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
  // Brief loading beat shown while moving from one Traitement step to the
  // next (AR -> RD, and RD -> Analyse de la cause) — same "stay open, show
  // a loader, then swap the content in place" pattern used elsewhere.
  const [confirmingAR, setConfirmingAR] = useState(false);
  const [confirmingRD, setConfirmingRD] = useState(false);
  // Once a dossier is clôturé, its Informations tab becomes a read-only
  // record of the case instead of an editable form.
  const isClosed = complaint.avancement === 'cloture';
  // Prospects aren't bound by the ACPR deadlines that "conformité" tracks —
  // only clients are, so the field doesn't apply to them.
  const contactTag = getContactTag(complaint.reclamant.rattacheContrat);
  // A réclamation clôturée faute d'avoir identifié l'auteur (canal
  // administrateur/rien) is explicitly reopenable once that identity is
  // found — so unlike the rest of the Informations tab, "Informations du
  // réclamant" stays editable while contactTag is still unknown, even on a
  // clôturée dossier. Once it has a contact type, it's a normally-treated
  // (or normally-closed) dossier again, and this section locks like the
  // rest of the tab.
  const reclamantFieldsLocked = isClosed && contactTag !== null;
  const { conformite } = getEcheanceInfo(complaint);
  // Analyse de la cause is an optional follow-up step that only happens
  // once the dossier is already clôturé — its fields are all optional, so
  // its own confirmed flag (not field content) tracks whether it's done.
  const analyseDone = complaint.suiviCloture.analyseTerminee;

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
      const dateMissing = !arDateDraft;
      if (dateMissing || !arCertified) {
        setArDateMissing(dateMissing);
        setArCertifyMissing(!arCertified);
        scrollToFirstError();
        return;
      }
      setConfirmingAR(true);
      setTimeout(() => {
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
              [
                { label: "Date d'envoi de l'accusé de réception", value: dateLabel },
                { label: 'Type de réponse', value: 'Recevable' },
              ],
            ),
          ],
        });
        // Pre-fill the next step's (réponse définitive) date now, the same
        // way arDateDraft was pre-filled when this step started.
        if (reponseDateDraft === '') setReponseDateDraft(todayLabel);
        setConfirmingAR(false);
      }, 1500);
    } else {
      // L'action curative est facultative (instantanée, pas toujours
      // nécessaire), mais l'action corrective est obligatoire dans tous les
      // cas avant de pouvoir clôturer.
      const correctiveDateMissing = !suiviDraft.actionCorrective;
      const correctiveDescMissing = !suiviDraft.actionRealisee;
      if (correctiveDateMissing || correctiveDescMissing) {
        setActionCorrectiveDateMissing(correctiveDateMissing);
        setActionRealiseeMissing(correctiveDescMissing);
        scrollToFirstError();
        return;
      }
      // Confirming la réponse définitive clôture the dossier right away —
      // there's no separate review/"Clôturer" step anymore. "Analyse de la
      // cause" (see handleConfirmAnalyse) is a mandatory follow-up, but it
      // happens after the file is already closed to the réclamant.
      setConfirmingRD(true);
      setTimeout(() => {
        const dateLabel = padFrDate(reponseDateDraft || todayLabel);
        const nextSuivi = { ...suiviDraft, dateReponse: dateLabel };
        setSuiviDraft(nextSuivi);
        onUpdate?.(complaint.id, {
          ...getReclamantPatch(),
          avancement: 'cloture',
          dateCloture: padFrDate(todayLabel),
          suiviCloture: nextSuivi,
          historique: [
            ...complaint.historique,
            buildHistoryEntry(
              'Confirmation de l’envoi de la Réponse Définitive',
              'Réponse définitive envoyée au réclamant.',
              [
                { label: "Date d'envoi de la réponse définitive", value: dateLabel },
                { label: 'Message de la réponse définitive envoyé', value: suiviDraft.reponseMessage || '-' },
                {
                  label: "Date de l'action curative",
                  value: suiviDraft.actionImmediate ? padFrDate(suiviDraft.actionImmediate) : '-',
                },
                { label: "Description de l'action curative", value: suiviDraft.actionsCorrectives || '-' },
                { label: "Date de l'action corrective", value: padFrDate(suiviDraft.actionCorrective) },
                { label: "Description de l'action corrective", value: suiviDraft.actionRealisee },
              ],
            ),
            buildHistoryEntry('Clôture du dossier', 'Dossier clôturé.'),
          ],
        });
        setConfirmingRD(false);
      }, 1500);
    }
  };

  // Optional follow-up step, happening once the dossier is already clôturé —
  // none of its fields are required.
  const handleConfirmAnalyse = () => {
    const dateLabel = suiviDraft.actionCorrective ? padFrDate(suiviDraft.actionCorrective) : suiviDraft.actionCorrective;
    const nextSuivi = { ...suiviDraft, actionCorrective: dateLabel, analyseTerminee: true };
    setSuiviDraft(nextSuivi);
    onUpdate?.(complaint.id, {
      suiviCloture: nextSuivi,
      historique: [
        ...complaint.historique,
        buildHistoryEntry('Analyse de la cause', 'Analyse de la cause du dossier renseignée.', [
          { label: 'Exigence', value: suiviDraft.exigence || '-' },
          { label: 'Défaillance', value: suiviDraft.defaillance || '-' },
          { label: 'Preuve', value: suiviDraft.preuve || '-' },
          { label: "Vérification d'efficacité", value: suiviDraft.verificationEfficacite || '-' },
        ]),
      ],
    });
  };


  // There's still a next step to show as long as, once clôturé, Analyse de
  // la cause hasn't been confirmed yet.
  const showNextStepBanner = complaint.avancement !== 'cloture' || !analyseDone;

  const statusChipLabel = AVANCEMENT_LABEL[complaint.avancement];
  const statusChipTooltip = AVANCEMENT_TOOLTIP[complaint.avancement];
  // Same colors as the complaint card's own status chip, instead of this
  // drawer's unrelated blue chip style.
  const statusChipClassName = `chip complaints-chip-avancement-${complaint.avancement}`;

  // Shown once the guiding question is answered "Oui" — collects the extra
  // information (contact details + the AR itself) that wasn't needed until
  // now, then sends the accusé de réception.
  const renderArDateField = () => (
    <div className="modal-row">
      <FormField
        label="Date d'envoi de l'accusé de réception"
        required
        type="date"
        placeholder="JJ/MM/AAAA"
        value={arDateDraft}
        error={arDateMissing}
        errorText={arDateMissing ? 'Champ requis' : undefined}
        onChange={(v) => {
          setArDateDraft(v);
          if (v) setArDateMissing(false);
        }}
      />
      <div className="dossier-field-spacer" />
    </div>
  );

  const renderArTemplateBlock = () => (
    <div className="dossier-template-block">
      <div className="dossier-template-header">
        <span className="dossier-template-title">Modèle de message à envoyer</span>
        <span className="dossier-template-copy-wrap">
          <button
            type="button"
            className="dossier-template-copy-btn"
            aria-label="Copier le modèle de message"
            onClick={handleCopyArTemplate}
          >
            <CopyIcon />
          </button>
          {arTemplateCopied && <span className="dossier-template-copy-feedback">Copié !</span>}
        </span>
      </div>
      <ArNiveauControl value={arNiveau} onChange={setArNiveau} />
      <p className="dossier-template-text">{AR_MESSAGE_TEMPLATES[arNiveau]}</p>
    </div>
  );

  // Required before "Confirmer" accepts the AR as sent.
  const renderArCertifyCheckbox = () => (
    <div className={`dossier-certify-checkbox-wrap ${arCertifyMissing ? 'dossier-certify-checkbox-wrap-error' : ''}`}>
      <label className="dossier-certify-checkbox">
        <input
          type="checkbox"
          checked={arCertified}
          onChange={(e) => {
            setArCertified(e.target.checked);
            if (e.target.checked) setArCertifyMissing(false);
          }}
        />
        <span className="dossier-certify-checkbox-text">
          Je confirme avoir envoyé l'accusé de réception au réclamant.
          <span className="dossier-field-required">*</span>
        </span>
      </label>
      {arCertifyMissing && <span className="dossier-field-error-text">Champ requis</span>}
    </div>
  );

  // hideAlert: the "clôturer le dossier" review step already carries its own
  // single "vérifiez que tout est renseigné" alert covering every field
  // below it, so this field's own instructional alert would be redundant
  // there.
  const renderArInfoFields = () => (
    <>
      <p className="dossier-block-title">Informations de l'accusé de réception</p>
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            L'accusé de réception doit être envoyé au réclamant de votre côté (email, courrier...). Une fois l'envoi
            effectué, renseignez ci-dessous la date à laquelle il a été envoyé.
          </p>
        </div>
        {renderArDateField()}
        {renderArTemplateBlock()}
        {renderArCertifyCheckbox()}
      </div>
    </>
  );

  const renderReponseDateField = () => (
    <div className="modal-row">
      <FormField
        label="Date d'envoi de la réponse définitive"
        required
        type="date"
        placeholder="JJ/MM/AAAA"
        value={reponseDateDraft}
        onChange={setReponseDateDraft}
      />
      <div className="dossier-field-spacer" />
    </div>
  );

  const renderReponseInfoFields = () => (
    <>
      <p className="dossier-block-title">Informations concernant le traitement de la réclamation</p>
      <div className="dossier-alert-field-group">
        <div className="dossier-alert-info">
          <p>
            La réponse définitive doit être envoyée au réclamant de votre côté (email, courrier...). Une fois l'envoi
            effectué, renseignez ci-dessous la date à laquelle elle a été envoyée.
          </p>
        </div>
        {renderReponseDateField()}
        <FormTextareaAutoGrow
          label="Message de la réponse définitive envoyé"
          required
          placeholder="Indiquez ici le message envoyé au réclamant"
          value={suiviDraft.reponseMessage}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, reponseMessage: v }))}
        />
        <p className="dossier-block-title">Action curative</p>
        <div className="dossier-alert-neutral">
          <p>
            Une action curative peut être mise en place immédiatement, sans attendre, pour traiter la situation dans
            l'instant. Elle est facultative.
          </p>
        </div>
        <div className="modal-row">
          <FormField
            label="Date de l'action curative"
            type="date"
            placeholder="JJ/MM/AAAA"
            value={suiviDraft.actionImmediate}
            onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
          />
          <div className="dossier-field-spacer" />
        </div>
        <FormTextareaAutoGrow
          label="Description de l'action curative"
          placeholder="Décrivez l'action curative mise en place"
          value={suiviDraft.actionsCorrectives}
          onChange={(v) => setSuiviDraft((d) => ({ ...d, actionsCorrectives: v }))}
        />
        <p className="dossier-block-title">Action corrective</p>
        <div className="dossier-alert-neutral">
          <p>
            Une action corrective vise à traiter la cause du problème de manière durable ; elle peut nécessiter de
            solliciter d'autres personnes et donc prendre plus de temps. Elle peut être mise en place en complément de
            l'action curative, mais elle est obligatoire dans tous les cas.
          </p>
        </div>
        <div className="modal-row">
          <FormField
            label="Date de l'action corrective"
            required
            type="date"
            placeholder="JJ/MM/AAAA"
            value={suiviDraft.actionCorrective}
            error={actionCorrectiveDateMissing}
            errorText={actionCorrectiveDateMissing ? 'Champ requis' : undefined}
            onChange={(v) => {
              setSuiviDraft((d) => ({ ...d, actionCorrective: v }));
              if (v) setActionCorrectiveDateMissing(false);
            }}
          />
          <div className="dossier-field-spacer" />
        </div>
        <FormTextareaAutoGrow
          label="Description de l'action corrective"
          required
          placeholder="Décrivez l'action corrective mise en place"
          value={suiviDraft.actionRealisee}
          error={actionRealiseeMissing}
          errorText={actionRealiseeMissing ? 'Champ requis' : undefined}
          onChange={(v) => {
            setSuiviDraft((d) => ({ ...d, actionRealisee: v }));
            if (v) setActionRealiseeMissing(false);
          }}
        />
      </div>
    </>
  );

  // Optional follow-up step, shown once the dossier is already clôturé —
  // none of its fields are required. The corrective action itself (date +
  // description) is now captured upfront in renderReponseInfoFields, since
  // it's mandatory before the dossier can even close.
  const renderAnalyseCauseFields = () => (
    <>
      <p className="dossier-block-title">Analyse de la cause</p>
      <FormTextareaAutoGrow
        label="Exigence"
        placeholder="Décrivez l'exigence concernée"
        value={suiviDraft.exigence}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, exigence: v }))}
      />
      <FormTextareaAutoGrow
        label="Défaillance"
        placeholder="On constate que..."
        value={suiviDraft.defaillance}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, defaillance: v }))}
      />
      <FormTextareaAutoGrow
        label="Preuve"
        placeholder="Décrivez la preuve"
        value={suiviDraft.preuve}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, preuve: v }))}
      />
      <p className="dossier-block-title">Vérification d'efficacité</p>
      <FormTextareaAutoGrow
        label="Vérification d'efficacité"
        placeholder="Décrivez la vérification d'efficacité de l'action"
        value={suiviDraft.verificationEfficacite}
        onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
      />
    </>
  );

  // The Traitement tab's primary action(s) — rendered once in a sticky
  // footer (see below) instead of inline at the end of the scrollable
  // content, so they stay reachable without scrolling to the bottom.
  let traitementActions: React.ReactNode = null;
  if (activeTab === 'traitement') {
    if (!showNextStepBanner || confirmingAR || confirmingRD) {
      traitementActions = null;
    } else if (!arSent) {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmNextStep}>
          Confirmer
        </button>
      );
    } else if (complaint.avancement !== 'cloture') {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmNextStep}>
          Clôturer le dossier
        </button>
      );
    } else {
      traitementActions = (
        <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmAnalyse}>
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
          <span className="dossier-title">
            {contactTag === 'Prospect'
              ? 'Réclamation Prospect'
              : contactTag === 'Client'
                ? 'Réclamation client'
                : 'Réclamation — auteur à déterminer'}{' '}
            {complaint.ticket}
          </span>
          <div className="dossier-header-spacer" />
          <button type="button" className="btn-filled dossier-export-btn" onClick={handleExportComplaint}>
            Exporter
          </button>
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
              {!showNextStepBanner ? (
                <div className="dossier-treatment-block dossier-treatment-block-centered">
                  <p className="dossier-done-text">Toutes les étapes ont été effectuées, le dossier a été clôturé.</p>
                </div>
              ) : confirmingAR || confirmingRD ? (
                <div className="dossier-treatment-block dossier-treatment-block-centered">
                  <span className="dossier-inline-loader" />
                </div>
              ) : !arSent ? (
                <div className="dossier-treatment-block">{renderArInfoFields()}</div>
              ) : complaint.avancement !== 'cloture' ? (
                <div className="dossier-treatment-block">{renderReponseInfoFields()}</div>
              ) : (
                <div className="dossier-treatment-block">{renderAnalyseCauseFields()}</div>
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
                <HoverTooltip text={statusChipTooltip} align="left" className="dossier-field-chip-wrap">
                  <span className={statusChipClassName}>{statusChipLabel}</span>
                </HoverTooltip>
              </div>
              {contactTag === 'Client' && (
                <div className="dossier-field">
                  <span className="dossier-field-label">Statut de conformité</span>
                  <HoverTooltip
                    text={getConformiteTooltip(complaint)}
                    align="left"
                    className="dossier-field-chip-wrap"
                  >
                    <span className={`chip complaints-chip-conformite-${conformite}`}>
                      {CONFORMITE_LABEL[conformite]}
                    </span>
                  </HoverTooltip>
                </div>
              )}
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
                readOnly={reclamantFieldsLocked}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
              />
              <SectionTextField
                label="Prénom du réclamant"
                required
                placeholder="Entrez le prénom du réclamant"
                value={reclamantDraft.prenom}
                error={prenomMissing}
                errorText={prenomMissing ? 'Champ requis' : undefined}
                readOnly={reclamantFieldsLocked}
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
                readOnly={reclamantFieldsLocked}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
              />
              <SectionTextField
                label="Numéro de téléphone"
                required
                placeholder="Entrez le numéro de téléphone"
                value={reclamantDraft.telephone}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un numéro de téléphone est requis' : undefined}
                readOnly={reclamantFieldsLocked}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Dénomination sociale"
                value={denominateurSocialDraft}
                readOnly={reclamantFieldsLocked}
                onChange={setDenominateurSocialDraft}
              />
              <SectionTextField
                label="Assureur / Porteur du risque"
                placeholder="Entrez le nom du porteur du risque"
                value={porteurDuRisqueDraft}
                readOnly={reclamantFieldsLocked}
                onChange={setPorteurDuRisqueDraft}
              />
            </div>
            <div className="dossier-question-row">
              <span className="dossier-question-text">
                Le réclamant est-il rattaché à un contrat ?<span className="dossier-field-required">*</span>
              </span>
              <ChoiceToggle
                value={reclamantDraft.rattacheContrat || null}
                disabled={reclamantFieldsLocked}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, rattacheContrat: v }))}
              />
            </div>
            {reclamantDraft.rattacheContrat === 'oui' && (
              <div className="dossier-field-row">
                <SectionSelectField<StatutClient>
                  label="Statut du client"
                  required
                  value={reclamantDraft.statutClient}
                  disabled={reclamantFieldsLocked}
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
                type="date"
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                helpText="L'accusé de réception doit être envoyé au réclamant de votre côté (email, courrier...). Renseignez ici la date à laquelle il a été envoyé."
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateAR: v }))}
              />
              <SectionTextField
                label="Date d'envoi de la réponse définitive"
                value={suiviDraft.dateReponse}
                type="date"
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                helpText="La réponse définitive doit être envoyée au réclamant de votre côté (email, courrier...). Renseignez ici la date à laquelle elle a été envoyée."
                helpAlign="right"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateReponse: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Date de l'action curative"
                value={suiviDraft.actionImmediate}
                type="date"
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
              />
              <SectionTextField
                label="Date de l'action corrective"
                value={suiviDraft.actionCorrective}
                type="date"
                placeholder="Ex: 05/05/2026"
                readOnly={isClosed}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
              />
            </div>
            <SectionTextField
              label="Description de l'action corrective"
              value={suiviDraft.actionRealisee}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
            />
            <SectionTextField
              label="Description de l'action curative"
              value={suiviDraft.actionsCorrectives}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionsCorrectives: v }))}
            />
            <SectionTextField
              label="Exigence"
              value={suiviDraft.exigence}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, exigence: v }))}
            />
            <SectionTextField
              label="Défaillance"
              value={suiviDraft.defaillance}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, defaillance: v }))}
            />
            <SectionTextField
              label="Preuve"
              value={suiviDraft.preuve}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, preuve: v }))}
            />
            <SectionTextField
              label="Vérification d'efficacité"
              value={suiviDraft.verificationEfficacite}
              multiline
              readOnly={isClosed}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
            />
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
