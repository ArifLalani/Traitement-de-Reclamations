import type { ContactFilter } from './complaintsData';
import type { ReclamationState } from './data';

export type { ContactFilter };
export type EtatFilter = 'tous' | 'non-lu' | 'lu';
export type AppreciationFilter = 'tous' | 'positive' | 'neutre' | 'negative';
// Aligned directly on the mention's actual state, rather than a separate
// set of facet labels that didn't quite map onto it (e.g. "Confirmées" used
// to mean 'mes-reclamations', "Écartées" didn't cover 'classee-sans-suite'
// at all).
export type ReclamationsFacet = 'tous' | ReclamationState;
export type PeriodeFilter = 'semaine' | 'mois' | 'annee' | 'tout';

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

const ETAT_OPTIONS: { id: EtatFilter; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'non-lu', label: 'Non lu' },
  { id: 'lu', label: 'Lu' },
];

const APPRECIATION_OPTIONS: { id: AppreciationFilter; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'positive', label: 'Positive' },
  { id: 'neutre', label: 'Neutre' },
  { id: 'negative', label: 'Négative' },
];

const RECLAMATIONS_OPTIONS: { id: ReclamationsFacet; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'possible', label: 'Réclamation potentielle' },
  { id: 'en-attente', label: 'En attente' },
  { id: 'mes-reclamations', label: 'Réclamation ouverte' },
  { id: 'classee-sans-suite', label: 'Classée sans suite' },
];

const CONTACT_OPTIONS: { id: ContactFilter; label: string }[] = [
  { id: 'tous', label: 'Tous' },
  { id: 'prospect', label: 'Prospect' },
  { id: 'client', label: 'Client' },
];

const PERIODE_OPTIONS: { id: PeriodeFilter; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'annee', label: '12 derniers mois' },
  { id: 'mois', label: 'Mois en cours' },
  { id: 'semaine', label: 'Cette semaine' },
];

type MentionsFiltersPanelProps = {
  open: boolean;
  onClose: () => void;
  etat: EtatFilter;
  onEtatChange: (value: EtatFilter) => void;
  appreciation: AppreciationFilter;
  onAppreciationChange: (value: AppreciationFilter) => void;
  reclamationsFacet: ReclamationsFacet;
  onReclamationsFacetChange: (value: ReclamationsFacet) => void;
  contact: ContactFilter;
  onContactChange: (value: ContactFilter) => void;
  periode: PeriodeFilter;
  onPeriodeChange: (value: PeriodeFilter) => void;
  onReset: () => void;
};

export default function MentionsFiltersPanel({
  open,
  onClose,
  etat,
  onEtatChange,
  appreciation,
  onAppreciationChange,
  reclamationsFacet,
  onReclamationsFacetChange,
  contact,
  onContactChange,
  periode,
  onPeriodeChange,
  onReset,
}: MentionsFiltersPanelProps) {
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
        <ChipGroup label="État" value={etat} options={ETAT_OPTIONS} onChange={onEtatChange} />
        <ChipGroup
          label="Appréciation"
          value={appreciation}
          options={APPRECIATION_OPTIONS}
          onChange={onAppreciationChange}
        />
        <ChipGroup
          label="Statut de la mention"
          value={reclamationsFacet}
          options={RECLAMATIONS_OPTIONS}
          onChange={onReclamationsFacetChange}
        />
        <ChipGroup label="Client / Prospect" value={contact} options={CONTACT_OPTIONS} onChange={onContactChange} />
        <ChipGroup label="Période" value={periode} options={PERIODE_OPTIONS} onChange={onPeriodeChange} />
      </div>
    </div>
  );
}
