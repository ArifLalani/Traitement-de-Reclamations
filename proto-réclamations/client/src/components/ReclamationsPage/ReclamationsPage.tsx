import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import bellIcon from '../../assets/figma/bell-icon.svg';
import searchIcon from '../../assets/figma/search-icon.svg';
import logoText from '../../assets/figma/logo-text.svg';
import logoStarsRow from '../../assets/figma/logo-stars-row.svg';
import logoSystemText from '../../assets/figma/logo-system-text.svg';
import ReclamationCard from './ReclamationCard';
import { reclamations, type ReclamationState } from './data';
import './ReclamationsPage.css';

type Filter = 'toutes' | ReclamationState;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'possible', label: 'Possible réclamation' },
  { id: 'a-traiter', label: 'À traiter' },
  { id: 'mes-reclamations', label: 'Mes réclamations' },
  { id: 'declinee', label: 'Déclinées' },
];

const TABS = [
  { id: 'mentions', label: 'Mes Mentions web' },
  { id: 'reclamations', label: 'Mes Réclamations' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PAGE_SIZE = 20;

export default function ReclamationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('mentions');
  const [activeFilter, setActiveFilter] = useState<Filter>('toutes');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

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
  }, [activeFilter]);

  const counts: Record<Filter, number> = {
    toutes: reclamations.length,
    possible: reclamations.filter((r) => r.state === 'possible').length,
    'a-traiter': reclamations.filter((r) => r.state === 'a-traiter').length,
    'mes-reclamations': reclamations.filter((r) => r.state === 'mes-reclamations').length,
    declinee: reclamations.filter((r) => r.state === 'declinee').length,
  };

  const filtered = reclamations.filter((r) => (activeFilter === 'toutes' ? true : r.state === activeFilter));
  filteredLength.current = filtered.length;
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="page">
      <header className="header">
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
                    <input type="text" placeholder="Recherches" />
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
                      <ReclamationCard reclamation={reclamation} />
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
    </div>
  );
}
