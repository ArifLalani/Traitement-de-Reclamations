import SortRadioGroup from './SortRadioGroup';

export type ComplaintSortOrder = 'urgence' | 'date-reception';

const SORT_OPTIONS: { id: ComplaintSortOrder; label: string }[] = [
  { id: 'urgence', label: 'Urgence' },
  { id: 'date-reception', label: 'Date de réception' },
];

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

type ComplaintsSortPanelProps = {
  open: boolean;
  onClose: () => void;
  value: ComplaintSortOrder;
  onChange: (value: ComplaintSortOrder) => void;
};

export default function ComplaintsSortPanel({ open, onClose, value, onChange }: ComplaintsSortPanelProps) {
  return (
    <div className={`filters-panel ${open ? 'filters-panel-open' : ''}`} role="dialog" aria-label="Tri">
      <div className="filters-panel-header">
        <span className="filters-panel-title">Tri</span>
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
