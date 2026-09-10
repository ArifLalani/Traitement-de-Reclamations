import SortRadioGroup from './SortRadioGroup';

export type SortOrder = 'recent' | 'ancien';

const SORT_OPTIONS: { id: SortOrder; label: string }[] = [
  { id: 'recent', label: 'Plus récent en haut' },
  { id: 'ancien', label: 'Plus ancien en haut' },
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
          <span className="filters-panel-group-label">Trier par</span>
          <SortRadioGroup value={value} options={SORT_OPTIONS} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
