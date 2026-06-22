import { useLayoutEffect, useRef, useState } from 'react';
import bellIcon from '../../assets/figma/bell-icon.svg';
import searchIcon from '../../assets/figma/search-icon.svg';
import logoText from '../../assets/figma/logo-text.svg';
import logoStarsRow from '../../assets/figma/logo-stars-row.svg';
import logoSystemText from '../../assets/figma/logo-system-text.svg';
import ReclamationCard from './ReclamationCard';
import { reclamations, type ReclamationState } from './data';
import './ReclamationsPage.css';

type Filter = 'toutes' | ReclamationState | 'mes-reclamations';

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

export default function ReclamationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('mentions');
  const [activeFilter, setActiveFilter] = useState<Filter>('toutes');
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

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
  };

  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

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
    toutes: 63,
    possible: 7,
    'a-traiter': 35,
    'mes-reclamations': 14,
    declinee: 7,
  };

  const filtered = reclamations.filter((r) =>
    activeFilter === 'toutes' || activeFilter === 'mes-reclamations' ? true : r.state === activeFilter,
  );

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

          <div className="tabs-viewport">
            <div
              className="tabs-track"
              style={{
                width: `${TABS.length * 100}%`,
                transform: `translateX(-${activeIndex * (100 / TABS.length)}%)`,
              }}
            >
              <div className="tab-panel" style={{ width: `${100 / TABS.length}%` }}>
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
                    {filtered.map((reclamation) => (
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
                </div>
              </div>

              <div className="tab-panel" style={{ width: `${100 / TABS.length}%` }}>
                <div className="panel-body panel-empty">
                  <p>Aucune réclamation pour le moment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
