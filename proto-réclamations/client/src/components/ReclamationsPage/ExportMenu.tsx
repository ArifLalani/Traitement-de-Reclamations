import { useState, type CSSProperties } from 'react';

export type ExportFormat = 'csv' | 'pdf';
export type ExportPeriod = 'jours' | 'mois' | 'annees';

export type ExportPreferences = {
  format: ExportFormat;
  period: ExportPeriod;
  from: string;
  to: string;
};

const PERIOD_OPTIONS: { id: ExportPeriod; label: string }[] = [
  { id: 'jours', label: 'Jours' },
  { id: 'mois', label: 'Mois' },
  { id: 'annees', label: 'Années' },
];

const PERIOD_PLACEHOLDER: Record<ExportPeriod, string> = {
  jours: 'ex. 19/08/2026',
  mois: 'ex. Août 2026',
  annees: 'ex. 2026',
};

const PERIOD_DEFAULT_VALUE: Record<ExportPeriod, string> = {
  jours: '19/08/2026',
  mois: 'Août 2026',
  annees: '2026',
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  const index = Math.max(0, options.findIndex((option) => option.id === value));
  const style = { '--segment-count': options.length } as CSSProperties;

  return (
    <div className="export-menu-segmented" style={style}>
      <div
        className="export-menu-segment-indicator"
        style={{ transform: `translateX(calc(${index} * (100% + 4px)))` }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`export-menu-segment ${value === option.id ? 'export-menu-segment-active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type ExportMenuProps = {
  open: boolean;
  preferences: ExportPreferences;
  onChange: (preferences: ExportPreferences) => void;
  onExport: () => void;
  selectionCount?: number;
};

export default function ExportMenu({ open, preferences, onChange, onExport, selectionCount = 0 }: ExportMenuProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  if (!open) return null;

  const hasSelection = selectionCount > 0;

  const update = (updates: Partial<ExportPreferences>) => {
    const next = { ...localPreferences, ...updates };
    setLocalPreferences(next);
    onChange(next);
  };

  const changePeriod = (period: ExportPeriod) => {
    update({ period, from: PERIOD_DEFAULT_VALUE[period], to: PERIOD_DEFAULT_VALUE[period] });
  };

  return (
    <div className="export-menu" onClick={(e) => e.stopPropagation()}>
      {hasSelection && (
        <p className="export-menu-selection-note">
          {selectionCount} réclamation{selectionCount > 1 ? 's' : ''} sélectionnée{selectionCount > 1 ? 's' : ''}
        </p>
      )}

      <div className="export-menu-section">
        <span className="export-menu-label">Format du fichier</span>
        <SegmentedControl<ExportFormat>
          value={localPreferences.format}
          options={[
            { id: 'csv', label: 'CSV' },
            { id: 'pdf', label: 'PDF' },
          ]}
          onChange={(format) => update({ format })}
        />
      </div>

      {!hasSelection && (
        <>
          <div className="export-menu-section">
            <span className="export-menu-label">Periode</span>
            <SegmentedControl<ExportPeriod> value={localPreferences.period} options={PERIOD_OPTIONS} onChange={changePeriod} />
          </div>

          <div className="export-menu-row">
            <div className="export-menu-section">
              <span className="export-menu-label">Du</span>
              <div className="export-menu-select">
                <input
                  type="text"
                  value={localPreferences.from}
                  placeholder={PERIOD_PLACEHOLDER[localPreferences.period]}
                  onChange={(e) => update({ from: e.target.value })}
                />
              </div>
            </div>
            <div className="export-menu-section">
              <span className="export-menu-label">Au</span>
              <div className="export-menu-select">
                <input
                  type="text"
                  value={localPreferences.to}
                  placeholder={PERIOD_PLACEHOLDER[localPreferences.period]}
                  onChange={(e) => update({ to: e.target.value })}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <button type="button" className="btn-text export-menu-cta" onClick={onExport}>
        Exporter
      </button>
    </div>
  );
}
