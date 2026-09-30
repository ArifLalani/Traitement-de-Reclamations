import type { Avancement, Conformite } from './complaintsData';
import { AVANCEMENT_LABEL, CONFORMITE_LABEL } from './complaintsData';

export type ProgressionFilter = 'tous' | Avancement;
export type ConformiteFilter = 'tous' | Conformite;

type ChipGroupProps<T extends string> = {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
};

function ChipGroup<T extends string>({ label, value, options, onChange }: ChipGroupProps<T>) {
  return (
    <div className="filters-panel-group">
      <span className="filters-panel-group-label">{label}</span>
      <div className="filters-panel-chips">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`filters-panel-chip ${value === option.id ? 'filters-panel-chip-active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
      <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

const PROGRESSION_OPTIONS: { id: ProgressionFilter; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'a-traiter', label: AVANCEMENT_LABEL['a-traiter'] },
  { id: 'cloture', label: AVANCEMENT_LABEL.cloture },
];

const CONFORMITE_OPTIONS: { id: ConformiteFilter; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'conforme', label: CONFORMITE_LABEL.conforme },
  { id: 'non-conforme', label: CONFORMITE_LABEL['non-conforme'] },
];

type ComplaintsFiltersPanelProps = {
  open: boolean;
  onClose: () => void;
  progression: ProgressionFilter;
  onProgressionChange: (value: ProgressionFilter) => void;
  conformite: ConformiteFilter;
  onConformiteChange: (value: ConformiteFilter) => void;
  onReset: () => void;
};

export default function ComplaintsFiltersPanel({
  open,
  onClose,
  progression,
  onProgressionChange,
  conformite,
  onConformiteChange,
  onReset,
}: ComplaintsFiltersPanelProps) {
  return (
    <div className={`filters-panel ${open ? 'filters-panel-open' : ''}`} role="dialog" aria-label="Filtres">
      <div className="filters-panel-header">
        <span className="filters-panel-title">Filtres</span>
        <div className="filters-panel-header-actions">
          <button type="button" className="icon-button" onClick={onReset} aria-label="Réinitialiser les filtres">
            <ResetIcon />
          </button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer les filtres">
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="filters-panel-content">
        <ChipGroup
          label="Statut de progression"
          value={progression}
          options={PROGRESSION_OPTIONS}
          onChange={onProgressionChange}
        />
        <ChipGroup
          label="Statut de conformité"
          value={conformite}
          options={CONFORMITE_OPTIONS}
          onChange={onConformiteChange}
        />
      </div>
    </div>
  );
}
