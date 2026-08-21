export type SortOrder = 'recent' | 'ancien';

const SORT_OPTIONS: { id: SortOrder; label: string }[] = [
  { id: 'recent', label: 'Plus récent en premier' },
  { id: 'ancien', label: 'Plus ancien en premier' },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

type SortPanelProps = {
  open: boolean;
  onClose: () => void;
  value: SortOrder;
  onChange: (value: SortOrder) => void;
};

export default function SortPanel({ open, onClose, value, onChange }: SortPanelProps) {
  return (
    <div className={`filters-panel ${open ? 'filters-panel-open' : ''}`} role="dialog" aria-label="Trier">
      <div className="filters-panel-header">
        <span className="filters-panel-title">Trier</span>
        <div className="filters-panel-header-actions">
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer le tri">
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="filters-panel-content">
        <div className="filters-panel-group">
          <div className="filters-panel-chips filters-panel-chips-vertical">
            {SORT_OPTIONS.map((option) => (
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
      </div>
    </div>
  );
}
