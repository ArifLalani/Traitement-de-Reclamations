import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import bellIcon from '../../assets/figma/bell-icon.svg';
import searchIcon from '../../assets/figma/search-icon.svg';
import logoText from '../../assets/figma/logo-text.svg';
import logoStarsRow from '../../assets/figma/logo-stars-row.svg';
import logoSystemText from '../../assets/figma/logo-system-text.svg';
import AlertSnackbar from './AlertSnackbar';
import CreateReclamationModal from './CreateReclamationModal';
import ReclamationCard from './ReclamationCard';
import ScrollTopButton from './ScrollTopButton';
import { reclamations, type Reclamation, type ReclamationState } from './data';
import './ReclamationsPage.css';

type Filter = 'toutes' | ReclamationState | 'nouveau';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'nouveau', label: 'Nouveau' },
  { id: 'possible', label: 'Possible réclamation' },
  { id: 'a-traiter', label: 'À traiter' },
  { id: 'mes-reclamations', label: 'Mes réclamations' },
  { id: 'declinee', label: 'Non qualifiées' },
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
  const [activeFilter, setActiveFilter] = useState<Filter>('toutes');
  const [search, setSearch] = useState('');
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
  } | null>(null);
  const [createTarget, setCreateTarget] = useState<Reclamation | null>(null);
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
    prevTops.current = measureTops();
    setActiveFilter(id);
    setVisibleCount(PAGE_SIZE);
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

  const handleConfirmCreate = () => {
    if (!createTarget) return;
    const id = createTarget.id;
    prevTops.current = measureTops();
    setCreatedIds((prev) => new Set(prev).add(id));
    setStateOverrides((prev) => ({ ...prev, [id]: 'mes-reclamations' }));
    setCreateTarget(null);
    setSnackbar({ id, message: 'Réclamation créée.', variant: 'success' });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleDisqualify = (id: string) => {
    prevTops.current = measureTops();
    setStateOverrides((prev) => ({ ...prev, [id]: 'declinee' }));
    setSnackbar({ id, message: 'Mention disqualifiée', variant: 'info' });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleUndoDisqualify = () => {
    if (!snackbar) return;
    prevTops.current = measureTops();
    setStateOverrides((prev) => {
      const next = { ...prev };
      delete next[snackbar.id];
      return next;
    });
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
  }, [activeFilter, search, stateOverrides]);

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

  const counts: Record<Filter, number> = {
    toutes: searched.length,
    nouveau: searched.filter(isEffectivelyNew).length,
    possible: searched.filter((r) => r.state === 'possible').length,
    'a-traiter': searched.filter((r) => r.state === 'a-traiter').length,
    'mes-reclamations': searched.filter((r) => r.state === 'mes-reclamations').length,
    declinee: searched.filter((r) => r.state === 'declinee').length,
  };

  const filtered = searched.filter((r) => {
    if (activeFilter === 'toutes') return true;
    if (activeFilter === 'nouveau') return isEffectivelyNew(r);
    return r.state === activeFilter;
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
            <img src={bellIcon} alt="Notifications" width={24} height={24} />
          </button>
        </div>
      </header>

      <main className="body">
        <div className="subheader">
          <h1 className="subheader-title">Mes réclamations</h1>
        </div>

        <div className="content">
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

          <div className="tabs-content" key={activeTab}>
            {activeTab === 'mentions' ? (
              <div className="panel-body">
                <div className="appbar">
                  <div className="search-field">
                    <img src={searchIcon} alt="" width={24} height={24} />
                    <input
                      type="text"
                      placeholder="Recherches"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {search.length > 0 && (
                      <button
                        type="button"
                        className="search-clear"
                        aria-label="Effacer la recherche"
                        onClick={() => handleSearchChange('')}
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

                <div className="filters">
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

                <div className="card-list">
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
              <div className="panel-body panel-empty">
                <p>Aucune réclamation pour le moment.</p>
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
        onAction={snackbar?.variant === 'info' ? handleUndoDisqualify : undefined}
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
