import { useEffect, useState, type CSSProperties } from 'react';

export type ExportFormat = 'csv' | 'pdf';
export type ExportPeriod = 'mois' | 'annees' | 'custom';

export type ExportPreferences = {
  format: ExportFormat;
  period: ExportPeriod;
  from: string;
  to: string;
};

const RANGE_OPTIONS: { id: ExportPeriod; label: string }[] = [
  { id: 'mois', label: 'Mois' },
  { id: 'annees', label: 'Années' },
  { id: 'custom', label: 'Custom' },
];

const PERIOD_PLACEHOLDER: Record<ExportPeriod, string> = {
  mois: 'ex. Août 2026',
  annees: 'ex. 2026',
  custom: 'ex. 19/08/2026',
};

const PERIOD_DEFAULT_VALUE: Record<ExportPeriod, string> = {
  mois: 'Août 2026',
  annees: '2026',
  custom: '19/08/2026',
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.2M16 3v3.2" strokeLinecap="round" />
    </svg>
  );
}

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

type RangeChipsProps<T extends string> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
};

function RangeChips<T extends string>({ value, options, onChange }: RangeChipsProps<T>) {
  return (
    <div className="export-menu-range-row">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`export-menu-range-chip ${value === option.id ? 'export-menu-range-chip-active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function DateField({ label, value, placeholder, onChange }: DateFieldProps) {
  return (
    <div className="field-outlined export-menu-date-field">
      <div className="field-border">
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <CalendarIcon />
      </div>
      <span className="field-label field-label-floating">{label}</span>
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
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderKey((k) => k + 1);
  }, [open]);

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
    <div className={`export-menu ${open ? 'export-menu-open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="export-menu-body" key={renderKey}>
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
              <span className="export-menu-label">Plage</span>
              <RangeChips<ExportPeriod>
                value={localPreferences.period}
                options={RANGE_OPTIONS}
                onChange={changePeriod}
              />
            </div>

            <div className="export-menu-section">
              <span className="export-menu-label">Période</span>
              <div className="export-menu-period-fields">
                <DateField
                  label="Du"
                  value={localPreferences.from}
                  placeholder={PERIOD_PLACEHOLDER[localPreferences.period]}
                  onChange={(from) => update({ from })}
                />
                <DateField
                  label="Au"
                  value={localPreferences.to}
                  placeholder={PERIOD_PLACEHOLDER[localPreferences.period]}
                  onChange={(to) => update({ to })}
                />
              </div>
            </div>
          </>
        )}

        <button type="button" className="btn-text export-menu-cta" onClick={onExport}>
          Exporter
        </button>
      </div>
    </div>
  );
}
