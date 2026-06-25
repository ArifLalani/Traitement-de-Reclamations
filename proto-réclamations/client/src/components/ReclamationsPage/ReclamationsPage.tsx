import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import bellIcon from '../../assets/figma/bell-icon.svg';
import searchIcon from '../../assets/figma/search-icon.svg';
import logoText from '../../assets/figma/logo-text.svg';
import logoStarsRow from '../../assets/figma/logo-stars-row.svg';
import logoSystemText from '../../assets/figma/logo-system-text.svg';
import AlertSnackbar from './AlertSnackbar';
import ComplaintsTable from './ComplaintsTable';
import type { ComplaintInformationsUpdate } from './ComplaintDetailDrawer';
import CreateReclamationModal, { type ReclamationFormData } from './CreateReclamationModal';
import ReclamationCard from './ReclamationCard';
import ScrollTopButton from './ScrollTopButton';
import { reclamations, type Reclamation, type ReclamationState } from './data';
import { complaints as initialComplaints, type Complaint } from './complaintsData';
import { exportComplaintsToXls } from './exportComplaints';
import type { Source } from './SourceIcon';
import './ReclamationsPage.css';

type Filter = 'toutes' | 'nouveau' | 'possible' | 'mes-reclamations';
type View = 'a-traiter' | 'archives';

function ArrowBackIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.25 5C1.25 4.30964 1.80964 3.75 2.5 3.75H17.5C18.1904 3.75 18.75 4.30964 18.75 5V6.875C18.75 7.56536 18.1904 8.125 17.5 8.125V15C17.5 15.3315 17.3683 15.6495 17.1339 15.8839C16.8995 16.1183 16.5815 16.25 16.25 16.25H3.75C3.41848 16.25 3.10054 16.1183 2.86612 15.8839C2.6317 15.6495 2.5 15.3315 2.5 15V8.125C1.80964 8.125 1.25 7.56536 1.25 6.875V5ZM3.75 8.125V15H16.25V8.125H3.75ZM2.5 6.875V5H17.5V6.875H2.5ZM7.5 10.625C7.5 10.2798 7.77982 10 8.125 10H11.875C12.2202 10 12.5 10.2798 12.5 10.625C12.5 10.9702 12.2202 11.25 11.875 11.25H8.125C7.77982 11.25 7.5 10.9702 7.5 10.625Z"
        fill="currentColor"
      />
    </svg>
  );
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'nouveau', label: 'Nouveau' },
  { id: 'possible', label: 'Réclamation détectée' },
  { id: 'mes-reclamations', label: 'Réclamations ouvertes' },
];

const SEEN_IDS_STORAGE_KEY = 'reclamations-seen-ids';

const TABS = [
  { id: 'mentions', label: 'Mes Mentions web' },
  { id: 'reclamations', label: 'Mes Réclamations' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PAGE_SIZE = 20;

export default function ReclamationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('mentions');
  const [displayedTab, setDisplayedTab] = useState<TabId>('mentions');
  const tabLeaving = activeTab !== displayedTab;
  // Show the export button immediately on entering "reclamations" (fresh
  // mount → entrance animation plays), but keep it mounted with a fading
  // class while leaving, instead of snapping away instantly.
  const exportButtonLeaving = tabLeaving && displayedTab === 'reclamations';
  const showExportButton = activeTab === 'reclamations' || exportButtonLeaving;
  const [activeFilter, setActiveFilter] = useState<Filter>('toutes');
  const [displayedFilter, setDisplayedFilter] = useState<Filter>('toutes');
  const [activeView, setActiveView] = useState<View>('a-traiter');
  const [displayedView, setDisplayedView] = useState<View>('a-traiter');
  const chipsLeaving = activeView !== displayedView;
  const cardsLeaving = chipsLeaving || activeFilter !== displayedFilter;
  const [search, setSearch] = useState('');
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());
  const [stateOverrides, setStateOverrides] = useState<Record<string, ReclamationState>>({});
  const [snackbar, setSnackbar] = useState<{
    id: string;
    message: string;
    variant: 'info' | 'success';
    onUndo?: () => void;
  } | null>(null);
  const [createTarget, setCreateTarget] = useState<Reclamation | null>(null);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>(initialComplaints);
  const [focusComplaintId, setFocusComplaintId] = useState<string | null>(null);
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [seenIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());
  const filteredLength = useRef(0);
  const sentinelObserver = useRef<IntersectionObserver | null>(null);

  const measureTops = () => {
    const tops = new Map<string, number>();
    cardRefs.current.forEach((el, id) => {
      tops.set(id, el.getBoundingClientRect().top);
    });
    return tops;
  };

  const selectFilter = (id: Filter) => {
    if (id === activeFilter) return;
    setActiveFilter(id);
  };

  const selectView = (id: View) => {
    if (id === activeView) return;
    setActiveView(id);
  };

  const handleSearchChange = (value: string) => {
    prevTops.current = measureTops();
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    sentinelObserver.current?.disconnect();
    sentinelObserver.current = null;
    if (!el) return;
    sentinelObserver.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredLength.current));
        }
      },
      { rootMargin: '400px' },
    );
    sentinelObserver.current.observe(el);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
      setShowScrollTop(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!createTarget) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [createTarget]);

  useEffect(() => {
    try {
      const allIds = reclamations.map((r) => r.id);
      const merged = new Set([...seenIds, ...allIds]);
      localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify([...merged]));
    } catch {
      // localStorage unavailable, ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEffectivelyNew = (r: (typeof reclamations)[number]) =>
    r.isNew && r.state !== 'mes-reclamations' && !createdIds.has(r.id) && !seenIds.has(r.id);

  const handleRequestCreate = (r: (typeof reclamations)[number]) => {
    setCreateTarget(r);
  };

  const handleUpdateComplaint = (id: string, updates: ComplaintInformationsUpdate) => {
    setComplaintsList((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleArchiveComplaint = (id: string) => {
    const index = complaintsList.findIndex((c) => c.id === id);
    if (index === -1) return;
    const complaint = complaintsList[index];
    setComplaintsList((prev) => prev.filter((c) => c.id !== id));
    setSnackbar({
      id,
      message: 'Réclamation archivée.',
      variant: 'info',
      onUndo: () => {
        setComplaintsList((current) => {
          const next = [...current];
          next.splice(index, 0, complaint);
          return next;
        });
      },
    });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleConfirmCreate = (formData: ReclamationFormData) => {
    if (!createTarget) return;
    const id = createTarget.id;
    prevTops.current = measureTops();
    setCreatedIds((prev) => new Set(prev).add(id));
    setStateOverrides((prev) => ({ ...prev, [id]: 'mes-reclamations' }));

    const nextTicketNumber =
      Math.max(0, ...complaintsList.map((c) => Number(c.ticket.replace('#', '')) || 0)) + 1;
    const newComplaint: Complaint = {
      id: `created-${id}`,
      sourceReclamationId: id,
      ticket: `#${String(nextTicketNumber).padStart(4, '0')}`,
      requerant: formData.requerant,
      dateReception: formData.dateReception,
      echeanceLabel: '-',
      avancement: 'a-traiter',
      conformite: 'conforme',
      canal: formData.canal as Source,
      sourceUrl: createTarget.url,
      denominateurSocial: 'Non renseigné',
      assureur: 'Non renseigné',
      email: formData.email,
      objet: formData.objet,
      description: formData.description,
    };
    setComplaintsList((prev) => [newComplaint, ...prev]);

    setCreateTarget(null);
    setSnackbar({ id, message: 'Réclamation créée.', variant: 'success' });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleFollowReclamation = (id: string) => {
    setActiveTab('reclamations');
    setFocusComplaintId(id);
  };

  const handleDisqualify = (id: string) => {
    prevTops.current = measureTops();
    setStateOverrides((prev) => ({ ...prev, [id]: 'declinee' }));
    setSnackbar({
      id,
      message: 'Mention archivée',
      variant: 'info',
      onUndo: () => {
        prevTops.current = measureTops();
        setStateOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      },
    });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleSnackbarUndo = () => {
    if (!snackbar) return;
    snackbar.onUndo?.();
    setSnackbar(null);
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
  };

  useEffect(() => {
    return () => {
      if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    };
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const activeButton = tabRefs.current[activeTab];
      if (!activeButton) return;
      setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeTab]);

  useEffect(() => {
    if (activeView === displayedView && activeFilter === displayedFilter) return;
    const timeout = setTimeout(() => {
      setDisplayedView(activeView);
      setDisplayedFilter(activeFilter);
      setVisibleCount(PAGE_SIZE);
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeView, displayedView, activeFilter, displayedFilter]);

  useEffect(() => {
    if (activeTab === displayedTab) return;
    const timeout = setTimeout(() => setDisplayedTab(activeTab), 250);
    return () => clearTimeout(timeout);
  }, [activeTab, displayedTab]);

  useLayoutEffect(() => {
    const newTops = measureTops();
    newTops.forEach((newTop, id) => {
      const oldTop = prevTops.current.get(id);
      const el = cardRefs.current.get(id);
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
  }, [search, stateOverrides]);

  const effectiveReclamations = reclamations.map((r) =>
    stateOverrides[r.id] ? { ...r, state: stateOverrides[r.id] } : r,
  );

  const query = search.trim().toLowerCase();

  const matchesQuery = (r: (typeof effectiveReclamations)[number]) =>
    !query ||
    r.author.toLowerCase().includes(query) ||
    r.text.toLowerCase().includes(query) ||
    r.source.toLowerCase().includes(query) ||
    r.url.toLowerCase().includes(query);

  const searched = effectiveReclamations.filter(matchesQuery);
  const actifs = searched.filter((r) => r.state !== 'declinee');
  const archivedCount = searched.filter((r) => r.state === 'declinee').length;

  const counts: Record<Filter, number> = {
    toutes: actifs.length,
    nouveau: actifs.filter(isEffectivelyNew).length,
    possible: actifs.filter((r) => r.state === 'possible').length,
    'mes-reclamations': actifs.filter((r) => r.state === 'mes-reclamations').length,
  };

  const filtered =
    displayedView === 'archives'
      ? searched.filter((r) => r.state === 'declinee')
      : actifs.filter((r) => {
          if (displayedFilter === 'toutes') return true;
          if (displayedFilter === 'nouveau') return isEffectivelyNew(r);
          return r.state === displayedFilter;
        });
  filteredLength.current = filtered.length;
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="page">
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-top">
          <div className="logo">
            <img src={logoText} alt="Opinion System" className="logo-text" />
            <div className="logo-sub">
              <img src={logoStarsRow} alt="" className="logo-stars" />
              <img src={logoSystemText} alt="" className="logo-system" />
            </div>
          </div>
          <button type="button" className="icon-button">
            <img src={bellIcon} alt="Notifications" width={18} height={20.4} />
          </button>
        </div>
      </header>

      <main className="body">
        <div className="subheader">
          <h1 className="subheader-title">Mes réclamations</h1>
        </div>

        <div className="content">
          <div className="tabs-row">
            <div className="tabs" ref={tabsRef}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              <span
                className="tabs-indicator"
                style={{ left: indicator.left, width: indicator.width }}
              />
            </div>

            {showExportButton && (
              <button
                type="button"
                className={`btn-filled export-button ${exportButtonLeaving ? 'view-fade-leaving' : ''}`}
                onClick={() => exportComplaintsToXls(complaintsList)}
              >
                Exporter
                <svg viewBox="0 0 9 5.5575" width={12} height={7.4} fill="currentColor">
                  <path d="M7.9425 0L4.5 3.435L1.0575 0L0 1.0575L4.5 5.5575L9 1.0575L7.9425 0Z" />
                </svg>
              </button>
            )}
          </div>

          <div className="appbar">
            <div className="search-field">
              <img src={searchIcon} alt="" width={24} height={24} />
              <input
                type="text"
                placeholder="Recherches"
                value={activeTab === 'mentions' ? search : complaintsSearch}
                onChange={(e) =>
                  activeTab === 'mentions'
                    ? handleSearchChange(e.target.value)
                    : setComplaintsSearch(e.target.value)
                }
              />
              {(activeTab === 'mentions' ? search : complaintsSearch).length > 0 && (
                <button
                  type="button"
                  className="search-clear"
                  aria-label="Effacer la recherche"
                  onClick={() =>
                    activeTab === 'mentions' ? handleSearchChange('') : setComplaintsSearch('')
                  }
                >
                  <svg viewBox="0 0 24 24" width={18} height={18}>
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="tabs-content" key={activeTab}>
            {activeTab === 'mentions' ? (
              <div className="panel-body">
                <div className="filters-row">
                  {displayedView === 'a-traiter' ? (
                    <>
                      <div className={`filters ${chipsLeaving ? 'view-fade-leaving' : ''}`}>
                        {FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            type="button"
                            className={`filter-chip ${activeFilter === filter.id ? 'filter-chip-active' : ''}`}
                            onClick={() => selectFilter(filter.id)}
                          >
                            {filter.label} ({counts[filter.id]})
                          </button>
                        ))}
                      </div>
                      <button
                        key="archives"
                        type="button"
                        className={`archives-link ${chipsLeaving ? 'view-fade-leaving' : ''}`}
                        onClick={() => selectView('archives')}
                      >
                        <ArchiveIcon />
                        Archives
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`filters ${chipsLeaving ? 'view-fade-leaving' : ''}`}>
                        <span className="filter-chip filter-chip-active filter-chip-static">
                          Archives ({archivedCount})
                        </span>
                      </div>
                      <button
                        key="retour"
                        type="button"
                        className={`archives-link ${chipsLeaving ? 'view-fade-leaving' : ''}`}
                        onClick={() => selectView('a-traiter')}
                      >
                        <ArrowBackIcon />
                        Retour aux mentions
                      </button>
                    </>
                  )}
                </div>

                <div
                  className={`card-list ${cardsLeaving ? 'view-fade-leaving' : ''}`}
                  key={`${displayedView}-${displayedFilter}`}
                >
                  {visibleItems.map((reclamation) => (
                    <div
                      key={reclamation.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(reclamation.id, el);
                        else cardRefs.current.delete(reclamation.id);
                      }}
                    >
                      <ReclamationCard
                        reclamation={reclamation}
                        isNew={isEffectivelyNew(reclamation)}
                        onCreate={() => handleRequestCreate(reclamation)}
                        onDisqualify={() => handleDisqualify(reclamation.id)}
                        onFollow={() => handleFollowReclamation(reclamation.id)}
                      />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="scroll-sentinel" ref={sentinelRef}>
                    <span className="scroll-sentinel-loader" />
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-body">
                <ComplaintsTable
                  complaints={complaintsList}
                  query={complaintsSearch}
                  focusId={focusComplaintId}
                  onFocusHandled={() => setFocusComplaintId(null)}
                  onUpdateComplaint={handleUpdateComplaint}
                  onDeleteComplaint={handleArchiveComplaint}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <ScrollTopButton
        visible={showScrollTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <AlertSnackbar
        visible={!!snackbar}
        message={snackbar?.message ?? ''}
        variant={snackbar?.variant ?? 'info'}
        actionLabel={snackbar?.variant === 'info' ? 'Annuler' : undefined}
        onAction={snackbar?.variant === 'info' ? handleSnackbarUndo : undefined}
      />

      {createTarget && (
        <CreateReclamationModal
          reclamation={createTarget}
          onClose={() => setCreateTarget(null)}
          onSubmit={handleConfirmCreate}
        />
      )}
    </div>
  );
}
