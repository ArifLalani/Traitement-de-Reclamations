import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import warningIcon from '../../assets/figma/warning-icon.svg';
import ComplaintDetailDrawer, { type ComplaintInformationsUpdate } from './ComplaintDetailDrawer';
import {
  AVANCEMENT_LABEL,
  CONFORMITE_LABEL,
  type Avancement,
  type Complaint,
  type Conformite,
} from './complaintsData';

type SortKey = 'ticket' | 'requerant' | 'dateReception' | 'echeance' | 'avancement' | 'conformite';
type SortDirection = 'asc' | 'desc';

type Column = { key: SortKey; label: string; width: number; info?: boolean };

const COLUMNS: Column[] = [
  { key: 'ticket', label: 'N° ticket', width: 89 },
  { key: 'requerant', label: 'Requérant', width: 160 },
  { key: 'dateReception', label: 'Date de réception', width: 150 },
  { key: 'echeance', label: 'Échéance', width: 180, info: true },
  { key: 'avancement', label: "État d'avancement", width: 152 },
  { key: 'conformite', label: 'Statut de conformité', width: 166 },
];

const AVANCEMENT_ORDER: Record<Avancement, number> = {
  'a-traiter': 0,
  'en-cours': 1,
  'en-attente': 2,
  cloture: 3,
};

const CONFORMITE_ORDER: Record<Conformite, number> = {
  conforme: 0,
  'non-conforme': 1,
};

function parseDateFR(value: string): number {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function echeanceValue(c: Complaint): number {
  const match = c.echeanceLabel.match(/(\d+)/);
  return match ? Number(match[1]) : Infinity;
}

const COMPARATORS: Record<SortKey, (a: Complaint, b: Complaint) => number> = {
  ticket: (a, b) => Number(a.ticket.replace('#', '')) - Number(b.ticket.replace('#', '')),
  requerant: (a, b) => a.requerant.localeCompare(b.requerant),
  dateReception: (a, b) => parseDateFR(a.dateReception) - parseDateFR(b.dateReception),
  echeance: (a, b) => echeanceValue(a) - echeanceValue(b),
  avancement: (a, b) => AVANCEMENT_ORDER[a.avancement] - AVANCEMENT_ORDER[b.avancement],
  conformite: (a, b) => CONFORMITE_ORDER[a.conformite] - CONFORMITE_ORDER[b.conformite],
};

function SortArrows({ active, direction }: { active: boolean; direction: SortDirection }) {
  const upActive = active && direction === 'desc';
  const downActive = active && direction === 'asc';
  return (
    <span className="complaints-sort-arrows">
      <svg width="9" height="5.5575" viewBox="0 0 9 5.5575" fill="none">
        <path
          d="M7.9425 5.5575L4.5 2.1225L1.0575 5.5575L0 4.5L4.5 0L9 4.5L7.9425 5.5575Z"
          fill={upActive ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.3)'}
        />
      </svg>
      <svg width="9" height="5.5575" viewBox="0 0 9 5.5575" fill="none">
        <path
          d="M7.9425 0L4.5 3.435L1.0575 0L0 1.0575L4.5 5.5575L9 1.0575L7.9425 0Z"
          fill={downActive ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.3)'}
        />
      </svg>
    </span>
  );
}

function InfoIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" />
      <rect x="7.25" y="6.5" width="1.5" height="5" rx="0.5" fill="rgba(0,0,0,0.6)" />
      <rect x="7.25" y="4" width="1.5" height="1.5" rx="0.5" fill="rgba(0,0,0,0.6)" />
    </svg>
  );
}

function ComplaintRow({
  complaint,
  onClick,
  rowRef,
  highlighted,
  isNew,
  enterDelay,
}: {
  complaint: Complaint;
  onClick: () => void;
  rowRef?: (el: HTMLDivElement | null) => void;
  highlighted?: boolean;
  isNew?: boolean;
  enterDelay?: number;
}) {
  return (
    <div
      className={`complaints-row complaints-row-clickable ${isNew ? 'complaints-row-enter' : ''} ${highlighted ? 'complaints-row-highlighted' : ''}`}
      onClick={onClick}
      ref={rowRef}
      style={isNew && enterDelay !== undefined ? { animationDelay: `${enterDelay}s` } : undefined}
    >
      <div className="complaints-cell" style={{ width: 89 }}>
        <span className="complaints-text">{complaint.ticket}</span>
      </div>
      <div className="complaints-cell" style={{ width: 160 }}>
        <span className="complaints-text">{complaint.requerant}</span>
      </div>
      <div className="complaints-cell" style={{ width: 150 }}>
        <span className="complaints-text">{complaint.dateReception}</span>
      </div>
      <div className="complaints-cell complaints-cell-gap" style={{ width: 180 }}>
        {complaint.echeanceWarning && <img src={warningIcon} alt="" width={20} height={17.86} />}
        <span className={`complaints-text ${complaint.echeanceWarning ? 'complaints-text-warning' : ''}`}>
          {complaint.echeanceLabel}
        </span>
      </div>
      <div className="complaints-cell" style={{ width: 152 }}>
        <span className={`chip complaints-chip-avancement-${complaint.avancement}`}>
          {AVANCEMENT_LABEL[complaint.avancement]}
        </span>
      </div>
      <div className="complaints-cell" style={{ width: 166 }}>
        <span className={`chip complaints-chip-conformite-${complaint.conformite}`}>
          {CONFORMITE_LABEL[complaint.conformite]}
        </span>
      </div>
    </div>
  );
}

type ComplaintsTableProps = {
  complaints: Complaint[];
  query?: string;
  focusId?: string | null;
  onFocusHandled?: () => void;
  onUpdateComplaint?: (id: string, updates: ComplaintInformationsUpdate) => void;
  onDeleteComplaint?: (id: string) => void;
};

export default function ComplaintsTable({
  complaints,
  query = '',
  focusId,
  onFocusHandled,
  onUpdateComplaint,
  onDeleteComplaint,
}: ComplaintsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevRowTops = useRef<Map<string, number>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!selected) return;
    const fresh = complaints.find((c) => c.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints]);

  useEffect(() => {
    complaints.forEach((c) => seenIdsRef.current.add(c.id));
  }, [complaints]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    if (!focusId) return;
    const match = complaints.find((c) => c.sourceReclamationId === focusId || c.id === focusId);
    if (!match) return;

    // Let the tab's own entrance animation settle before scrolling, so the
    // two transitions don't compete visually.
    const scrollTimeout = setTimeout(() => {
      const el = rowRefs.current.get(match.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(match.id);
    }, 450);

    // Open the drawer once the smooth scroll has had time to finish.
    const drawerTimeout = setTimeout(() => {
      setSelected(match);
    }, 950);

    const highlightTimeout = setTimeout(() => setHighlightedId(null), 2450);

    // Clear the pending focus request last, once the whole sequence has
    // played out, so changing it doesn't cancel the timeouts above.
    const clearTimeoutId = setTimeout(() => onFocusHandled?.(), 1000);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(drawerTimeout);
      clearTimeout(highlightTimeout);
      clearTimeout(clearTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? complaints.filter(
        (c) =>
          c.ticket.toLowerCase().includes(normalizedQuery) ||
          c.requerant.toLowerCase().includes(normalizedQuery) ||
          AVANCEMENT_LABEL[c.avancement].toLowerCase().includes(normalizedQuery) ||
          CONFORMITE_LABEL[c.conformite].toLowerCase().includes(normalizedQuery),
      )
    : complaints;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const result = COMPARATORS[sortKey](a, b);
        return sortDir === 'asc' ? result : -result;
      })
    : filtered;

  // eslint-disable-next-line react-hooks/refs -- seenIdsRef only gates the one-time entrance animation, not functional rendering.
  const rows = sorted.map((complaint, index) => {
    const isNew = !seenIdsRef.current.has(complaint.id);
    return { complaint, isNew, enterDelay: isNew ? Math.min(index * 0.05, 0.4) : undefined };
  });

  const rowOrderKey = rows.map((r) => r.complaint.id).join('|');

  useLayoutEffect(() => {
    const newTops = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      newTops.set(id, el.getBoundingClientRect().top);
    });

    newTops.forEach((newTop, id) => {
      const oldTop = prevRowTops.current.get(id);
      const el = rowRefs.current.get(id);
      if (oldTop === undefined || !el) return;
      const delta = oldTop - newTop;
      if (Math.abs(delta) < 1) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect();
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transform = '';
      });
    });

    prevRowTops.current = newTops;
    // Only re-measure when the actual row order/membership changes (sort or
    // filter) — not on every render, otherwise a re-render that happens
    // mid-scroll (e.g. the focus/highlight effect) would read scroll-shifted
    // positions and snap rows back, causing a visible glitch while scrolling.
  }, [rowOrderKey]);

  return (
    <div className="complaints-table">
      <div className="complaints-header">
        {COLUMNS.map((col) => {
          const active = sortKey === col.key;
          return (
            <button
              key={col.key}
              type="button"
              className="complaints-header-cell"
              style={{ width: col.width }}
              onClick={() => handleSort(col.key)}
            >
              <span className={`complaints-header-label ${active ? 'complaints-header-label-active' : ''}`}>
                {col.label}
              </span>
              {col.info && <InfoIcon />}
              <SortArrows active={active} direction={sortDir} />
            </button>
          );
        })}
      </div>
      <div className="complaints-divider" />
      {rows.map(({ complaint, isNew, enterDelay }, index) => (
        <Fragment key={complaint.id}>
          <ComplaintRow
            complaint={complaint}
            onClick={() => setSelected(complaint)}
            rowRef={(el) => {
              if (el) rowRefs.current.set(complaint.id, el);
              else rowRefs.current.delete(complaint.id);
            }}
            highlighted={highlightedId === complaint.id}
            isNew={isNew}
            enterDelay={enterDelay}
          />
          {index < rows.length - 1 && <div className="complaints-divider" />}
        </Fragment>
      ))}

      {selected && (
        <ComplaintDetailDrawer
          complaint={selected}
          onClose={() => setSelected(null)}
          onUpdate={onUpdateComplaint}
          onDelete={(id) => {
            onDeleteComplaint?.(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
