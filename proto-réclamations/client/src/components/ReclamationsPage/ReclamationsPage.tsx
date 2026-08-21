import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import bellIcon from '../../assets/figma/bell-icon.svg';
import searchIcon from '../../assets/figma/search-icon.svg';
import logoText from '../../assets/figma/logo-text.svg';
import logoStarsRow from '../../assets/figma/logo-stars-row.svg';
import logoSystemText from '../../assets/figma/logo-system-text.svg';
import AlertSnackbar from './AlertSnackbar';
import ComplaintCard from './ComplaintCard';
import ComplaintDetailDrawer, { type ComplaintInformationsUpdate } from './ComplaintDetailDrawer';
import ExportMenu, { type ExportPreferences } from './ExportMenu';
import ComplaintsFiltersPanel, {
  type ConformiteFilter,
  type ProgressionFilter,
} from './ComplaintsFiltersPanel';
import CreateReclamationSlider, { type ReclamationFormData } from './CreateReclamationSlider';
import MentionsAlertBanner from './MentionsAlertBanner';
import ReclamationCreatedAlert from './ReclamationCreatedAlert';
import MentionsFiltersPanel, {
  type AppreciationFilter,
  type EtatFilter,
  type ReclamationsFacet,
} from './MentionsFiltersPanel';
import ReclamationCard from './ReclamationCard';
import ReputationIntro from './ReputationIntro';
import ScrollTopButton from './ScrollTopButton';
import SortPanel, { type SortOrder } from './SortPanel';
import Sidebar, { type SidebarSection } from './Sidebar';
import { getSentiment, parseDateValue, reclamations, type Reclamation, type ReclamationState } from './data';
import {
  attachDetails,
  complaints as initialComplaints,
  archivedComplaints as initialArchivedComplaints,
  type Complaint,
} from './complaintsData';
import { exportComplaintsToCsv, exportComplaintsToPdf, filterComplaintsByRange } from './exportComplaints';
import type { Source } from './SourceIcon';
import './ReclamationsPage.css';

function FunnelIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
      <g transform="translate(1.5 6.75)">
        <path d="M12.75 9C13.1642 9 13.5 9.33579 13.5 9.75C13.5 10.1642 13.1642 10.5 12.75 10.5H8.25C7.83579 10.5 7.5 10.1642 7.5 9.75C7.5 9.33579 7.83579 9 8.25 9H12.75ZM16.5 4.5C16.9142 4.5 17.25 4.83579 17.25 5.25C17.25 5.66421 16.9142 6 16.5 6H4.5C4.08579 6 3.75 5.66421 3.75 5.25C3.75 4.83579 4.08579 4.5 4.5 4.5H16.5ZM20.25 0C20.6642 0 21 0.335786 21 0.75C21 1.16421 20.6642 1.5 20.25 1.5H0.75C0.335786 1.5 0 1.16421 0 0.75C0 0.335786 0.335786 0 0.75 0H20.25Z" />
      </g>
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.9697 15.2197C13.2626 14.9268 13.7374 14.9268 14.0303 15.2197L17.25 18.4393L20.4697 15.2197C20.7626 14.9268 21.2374 14.9268 21.5303 15.2197C21.8232 15.5126 21.8232 15.9874 21.5303 16.2803L17.7803 20.0303C17.4874 20.3232 17.0126 20.3232 16.7197 20.0303L12.9697 16.2803C12.6768 15.9874 12.6768 15.5126 12.9697 15.2197Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.25 9.75C17.6642 9.75 18 10.0858 18 10.5V19.5C18 19.9142 17.6642 20.25 17.25 20.25C16.8358 20.25 16.5 19.9142 16.5 19.5V10.5C16.5 10.0858 16.8358 9.75 17.25 9.75Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.75 12C3.75 11.5858 4.08579 11.25 4.5 11.25H11.25C11.6642 11.25 12 11.5858 12 12C12 12.4142 11.6642 12.75 11.25 12.75H4.5C4.08579 12.75 3.75 12.4142 3.75 12Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.75 6C3.75 5.58579 4.08579 5.25 4.5 5.25H17.25C17.6642 5.25 18 5.58579 18 6C18 6.41421 17.6642 6.75 17.25 6.75H4.5C4.08579 6.75 3.75 6.41421 3.75 6Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.75 18C3.75 17.5858 4.08579 17.25 4.5 17.25H9.75C10.1642 17.25 10.5 17.5858 10.5 18C10.5 18.4142 10.1642 18.75 9.75 18.75H4.5C4.08579 18.75 3.75 18.4142 3.75 18Z"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="3" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="15" r="1" fill="currentColor" stroke="none" />
      <path d="M7 5h10M7 10h10M7 15h10" strokeLinecap="round" />
    </svg>
  );
}

function SelectionModeIcon() {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3" y="3" width="14" height="14" rx="2" strokeDasharray="3 2.5" />
    </svg>
  );
}

function SelectAllIcon() {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 10.5 5 13.5 10 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10.5 12 13.5 17 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}


const SEEN_IDS_STORAGE_KEY = 'reclamations-seen-ids-v3';
const REPUTATION_INTRO_SEEN_KEY = 'reputation-intro-seen-v1';

type TabId = SidebarSection;

const PAGE_SIZE = 20;

export default function ReclamationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try {
      return localStorage.getItem(REPUTATION_INTRO_SEEN_KEY) ? 'mentions' : 'reputation-intro';
    } catch {
      return 'mentions';
    }
  });
  const [etatFilter, setEtatFilter] = useState<EtatFilter>('tous');
  const [appreciationFilter, setAppreciationFilter] = useState<AppreciationFilter>('tous');
  const [reclamationsFacet, setReclamationsFacet] = useState<ReclamationsFacet>('tous');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [mentionsSortOrder, setMentionsSortOrder] = useState<SortOrder>('recent');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [scrolled, setScrolled] = useState(false);
  const [appbarStuck, setAppbarStuck] = useState(false);
  const appbarRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [createdAlert, setCreatedAlert] = useState<{ complaint: Complaint } | null>(null);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>(() => [
    ...initialComplaints,
    ...initialArchivedComplaints,
  ]);
  const [progressionFilter, setProgressionFilter] = useState<ProgressionFilter>('tous');
  const [conformiteFilter, setConformiteFilter] = useState<ConformiteFilter>('tous');
  const [complaintsFiltersOpen, setComplaintsFiltersOpen] = useState(true);
  const [complaintsSortPanelOpen, setComplaintsSortPanelOpen] = useState(false);
  const [complaintsSortOrder, setComplaintsSortOrder] = useState<SortOrder>('recent');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintsMoreMenuOpen, setComplaintsMoreMenuOpen] = useState(false);
  const [complaintsSelectionMode, setComplaintsSelectionMode] = useState(false);
  const [selectedComplaintIds, setSelectedComplaintIds] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportPreferences>({
    format: 'csv',
    period: 'mois',
    from: 'Aout 2026',
    to: 'Aout 2026',
  });
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdAlertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SEEN_IDS_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());
  const filteredLength = useRef(0);
  const sentinelObserver = useRef<IntersectionObserver | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const complaintsMoreMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const measureTops = () => {
    const tops = new Map<string, number>();
    cardRefs.current.forEach((el, id) => {
      tops.set(id, el.getBoundingClientRect().top);
    });
    return tops;
  };

  const selectEtatFilter = (id: EtatFilter) => {
    if (id === etatFilter) return;
    prevTops.current = measureTops();
    setEtatFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const selectAppreciationFilter = (id: AppreciationFilter) => {
    if (id === appreciationFilter) return;
    prevTops.current = measureTops();
    setAppreciationFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const selectReclamationsFacet = (id: ReclamationsFacet) => {
    if (id === reclamationsFacet) return;
    prevTops.current = measureTops();
    setReclamationsFacet(id);
    setVisibleCount(PAGE_SIZE);
  };

  const resetMentionsFilters = () => {
    prevTops.current = measureTops();
    setEtatFilter('tous');
    setAppreciationFilter('tous');
    setReclamationsFacet('tous');
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (value: string) => {
    prevTops.current = measureTops();
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleComplaintsSearchChange = (value: string) => {
    prevTops.current = measureTops();
    setComplaintsSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const selectProgressionFilter = (id: ProgressionFilter) => {
    if (id === progressionFilter) return;
    prevTops.current = measureTops();
    setProgressionFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const selectConformiteFilter = (id: ConformiteFilter) => {
    if (id === conformiteFilter) return;
    prevTops.current = measureTops();
    setConformiteFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const resetComplaintsFilters = () => {
    prevTops.current = measureTops();
    setProgressionFilter('tous');
    setConformiteFilter('tous');
    setVisibleCount(PAGE_SIZE);
  };

  const handleSelectTab = (id: TabId) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setVisibleCount(PAGE_SIZE);
  };

  const markReputationIntroSeen = () => {
    try {
      localStorage.setItem(REPUTATION_INTRO_SEEN_KEY, '1');
    } catch {
      // localStorage unavailable, ignore
    }
  };

  const handleDismissReputationIntro = () => {
    markReputationIntroSeen();
    handleSelectTab('mentions');
  };

  const handleSelectFromReputationIntro = (section: 'mentions' | 'reclamations') => {
    markReputationIntroSeen();
    handleSelectTab(section);
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
      setAppbarStuck((appbarRef.current?.getBoundingClientRect().top ?? Infinity) <= 73);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!complaintsMoreMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (complaintsMoreMenuRef.current && !complaintsMoreMenuRef.current.contains(e.target as Node)) {
        setComplaintsMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [complaintsMoreMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!createTarget && !selectedComplaint) return;
    // The scrolling element is document.documentElement (html), not body —
    // locking body's overflow alone no longer blocks the page scroll now
    // that html has its own explicit overflow-x rule (see index.css).
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [createTarget, selectedComplaint]);

  const isEffectivelyNew = (r: (typeof reclamations)[number]) =>
    r.isNew && r.state !== 'mes-reclamations' && !createdIds.has(r.id) && !seenIds.has(r.id);

  const handleRequestCreate = (r: (typeof reclamations)[number]) => {
    setCreateTarget(r);
  };

  const markIdsAsRead = (ids: string[]) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      try {
        localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // localStorage unavailable, ignore
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    markIdsAsRead(reclamations.map((r) => r.id));
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.size === 0) return;
    markIdsAsRead([...selectedIds]);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleShowNewMentions = () => {
    prevTops.current = measureTops();
    setEtatFilter('non-lu');
    setVisibleCount(PAGE_SIZE);
    setFiltersOpen(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((value) => {
      if (value) setSelectedIds(new Set());
      return !value;
    });
    setMoreMenuOpen(false);
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectionMode(true);
    setSelectedIds(new Set(ids));
    setMoreMenuOpen(false);
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleComplaintsSelectionMode = () => {
    setComplaintsSelectionMode((value) => {
      if (value) setSelectedComplaintIds(new Set());
      return !value;
    });
    setComplaintsMoreMenuOpen(false);
  };

  const handleSelectAllComplaints = (ids: string[]) => {
    setComplaintsSelectionMode(true);
    setSelectedComplaintIds(new Set(ids));
    setComplaintsMoreMenuOpen(false);
  };

  const toggleSelectComplaintId = (id: string) => {
    setSelectedComplaintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setComplaintsSelectionMode(true);
  };

  const handleCancelComplaintsSelection = () => {
    setComplaintsSelectionMode(false);
    setSelectedComplaintIds(new Set());
  };

  const handleExportWithPreferences = () => {
    const hasSelection = complaintsSelectionMode && selectedComplaintIds.size > 0;
    const scoped = hasSelection
      ? complaintsList.filter((c) => selectedComplaintIds.has(c.id))
      : filterComplaintsByRange(complaintsList, exportPreferences);

    if (exportPreferences.format === 'csv') {
      exportComplaintsToCsv(scoped);
    } else {
      exportComplaintsToPdf(scoped);
    }

    setExportMenuOpen(false);
    if (hasSelection) handleCancelComplaintsSelection();
  };

  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    prevTops.current = measureTops();
    setStateOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = 'declinee';
      });
      return next;
    });
    setSnackbar({
      id: 'bulk-archive',
      message: `${ids.length} mention${ids.length > 1 ? 's' : ''} archivée${ids.length > 1 ? 's' : ''}.`,
      variant: 'info',
      onUndo: () => {
        prevTops.current = measureTops();
        setStateOverrides((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
      },
    });
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    snackbarTimeout.current = setTimeout(() => setSnackbar(null), 3500);
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleConfirmCreate = (formData: ReclamationFormData) => {
    if (!createTarget) return;
    const id = createTarget.id;
    prevTops.current = measureTops();
    setCreatedIds((prev) => new Set(prev).add(id));
    setStateOverrides((prev) => ({ ...prev, [id]: 'mes-reclamations' }));

    const nextTicketNumber =
      Math.max(0, ...complaintsList.map((c) => Number(c.ticket.replace('#', '')) || 0)) + 1;
    const requerant = `${formData.prenom} ${formData.nom}`.trim() || 'Requérant inconnu';
    const newComplaint: Complaint = attachDetails({
      id: `created-${id}`,
      sourceReclamationId: id,
      ticket: `#${String(nextTicketNumber).padStart(4, '0')}`,
      requerant,
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
    });
    newComplaint.reclamant.telephone = formData.telephone;
    newComplaint.reclamant.adresse = formData.adresse;
    newComplaint.notesInternes = formData.notesInternes;
    setComplaintsList((prev) => [newComplaint, ...prev]);

    setCreateTarget(null);
    setCreatedAlert({ complaint: newComplaint });
    if (createdAlertTimeout.current) clearTimeout(createdAlertTimeout.current);
    createdAlertTimeout.current = setTimeout(() => setCreatedAlert(null), 8000);
  };

  const dismissCreatedAlert = () => {
    if (createdAlertTimeout.current) clearTimeout(createdAlertTimeout.current);
    setCreatedAlert(null);
  };

  const openComplaintDetail = (complaint: Complaint) => {
    handleSelectTab('reclamations');
    // Let the réclamations list finish mounting and playing its card entrance
    // animation (0.6s, see .card-list > * in ReclamationsPage.css) before the
    // detail drawer slides in, so the two animations don't overlap.
    setTimeout(() => setSelectedComplaint(complaint), 650);
  };

  const handleFollowReclamation = (reclamationId: string) => {
    const complaint = complaintsList.find((c) => c.sourceReclamationId === reclamationId);
    if (complaint) openComplaintDetail(complaint);
  };

  const handleUpdateComplaint = (id: string, updates: ComplaintInformationsUpdate) => {
    setComplaintsList((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setSelectedComplaint((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
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
  }, [
    search,
    stateOverrides,
    etatFilter,
    appreciationFilter,
    reclamationsFacet,
    complaintsSearch,
    progressionFilter,
    conformiteFilter,
  ]);

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
  const activeReclamations = searched.filter((r) => r.state !== 'declinee');

  const sentiment = (r: (typeof effectiveReclamations)[number]): AppreciationFilter => {
    const s = getSentiment(r.text);
    return s === 'neutral' ? 'neutre' : s;
  };

  const matchesEtat = (r: (typeof effectiveReclamations)[number]) => {
    if (etatFilter === 'tous') return true;
    const isUnread = isEffectivelyNew(r);
    return etatFilter === 'non-lu' ? isUnread : !isUnread;
  };

  const matchesAppreciation = (r: (typeof effectiveReclamations)[number]) =>
    appreciationFilter === 'tous' || sentiment(r) === appreciationFilter;

  const matchesReclamationsFacet = (r: (typeof effectiveReclamations)[number]) => {
    switch (reclamationsFacet) {
      case 'tous':
        return r.state !== 'declinee';
      case 'potentielles':
        return r.state === 'possible';
      case 'confirmees':
        return r.state === 'mes-reclamations';
      case 'ecartees':
        return r.state === 'declinee';
      case 'expire':
        return false;
      default:
        return true;
    }
  };

  const newCount = activeReclamations.filter(isEffectivelyNew).length;
  const negativeNewCount = activeReclamations.filter(
    (r) => isEffectivelyNew(r) && getSentiment(r.text) === 'negative',
  ).length;

  const filtered = searched
    .filter((r) => matchesReclamationsFacet(r) && matchesEtat(r) && matchesAppreciation(r))
    .sort((a, b) =>
      mentionsSortOrder === 'recent'
        ? parseDateValue(b.date) - parseDateValue(a.date)
        : parseDateValue(a.date) - parseDateValue(b.date),
    );
  const complaintsQuery = complaintsSearch.trim().toLowerCase();

  const parseDateReception = (value: string) => {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return 0;
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  };

  const filteredComplaints = complaintsList
    .filter((c) => {
      const matchesSearch =
        !complaintsQuery ||
        c.ticket.toLowerCase().includes(complaintsQuery) ||
        c.requerant.toLowerCase().includes(complaintsQuery) ||
        c.objet.toLowerCase().includes(complaintsQuery) ||
        c.description.toLowerCase().includes(complaintsQuery);
      const matchesProgression = progressionFilter === 'tous' || c.avancement === progressionFilter;
      const matchesConformite = conformiteFilter === 'tous' || c.conformite === conformiteFilter;
      return matchesSearch && matchesProgression && matchesConformite;
    })
    .sort((a, b) =>
      complaintsSortOrder === 'recent'
        ? parseDateReception(b.dateReception) - parseDateReception(a.dateReception)
        : parseDateReception(a.dateReception) - parseDateReception(b.dateReception),
    );

  filteredLength.current = activeTab === 'mentions' ? filtered.length : filteredComplaints.length;
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const visibleComplaints = filteredComplaints.slice(0, visibleCount);
  const hasMoreComplaints = visibleCount < filteredComplaints.length;

  const mentionsFiltersActive =
    etatFilter !== 'tous' || appreciationFilter !== 'tous' || reclamationsFacet !== 'tous';
  const complaintsFiltersActive = progressionFilter !== 'tous' || conformiteFilter !== 'tous';

  return (
    <div className="page">
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <button
          type="button"
          className="icon-button sidebar-toggle"
          aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <MenuIcon />
        </button>
        <div className="header-center">
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
        </div>
      </header>

      <div className="app-shell">
        <Sidebar active={activeTab} onSelect={handleSelectTab} open={sidebarOpen} />

        <main className="body">
          {activeTab === 'reputation-intro' ? (
            <div className="content">
              <ReputationIntro
                onDismiss={handleDismissReputationIntro}
                onSelectMentions={() => handleSelectFromReputationIntro('mentions')}
                onSelectReclamations={() => handleSelectFromReputationIntro('reclamations')}
              />
            </div>
          ) : (
            <>
          <div ref={appbarRef} className={`appbar-bar ${appbarStuck ? 'appbar-bar-stuck' : ''}`}>
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
                      : handleComplaintsSearchChange(e.target.value)
                  }
                />
                {(activeTab === 'mentions' ? search : complaintsSearch).length > 0 && (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Effacer la recherche"
                    onClick={() =>
                      activeTab === 'mentions' ? handleSearchChange('') : handleComplaintsSearchChange('')
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
              {activeTab === 'mentions' ? (
                <div className="appbar-actions">
                  <button
                    type="button"
                    className="icon-button appbar-icon-button appbar-icon-button-badgeable"
                    aria-label="Filtres"
                    onClick={() => {
                      setFiltersOpen(true);
                      setSortPanelOpen(false);
                    }}
                  >
                    <FunnelIcon />
                    {mentionsFiltersActive && <span className="appbar-icon-badge" />}
                  </button>
                  <button
                    type="button"
                    className="icon-button appbar-icon-button"
                    aria-label="Trier"
                    onClick={() => {
                      setSortPanelOpen(true);
                      setFiltersOpen(false);
                    }}
                  >
                    <SortIcon />
                  </button>
                  <div className="appbar-more-menu-wrap" ref={moreMenuRef}>
                    <button
                      type="button"
                      className="icon-button appbar-icon-button"
                      aria-label="Plus d'options"
                      onClick={() => setMoreMenuOpen((v) => !v)}
                    >
                      <MoreIcon />
                    </button>
                    {moreMenuOpen && (
                      <div className="more-menu">
                        <button type="button" className="more-menu-item" onClick={toggleSelectionMode}>
                          <SelectionModeIcon />
                          Mode sélection
                        </button>
                        <button
                          type="button"
                          className="more-menu-item"
                          onClick={() => handleSelectAll(filtered.map((r) => r.id))}
                        >
                          <SelectAllIcon />
                          Tout sélectionner
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="appbar-actions">
                  <button
                    type="button"
                    className="icon-button appbar-icon-button appbar-icon-button-badgeable"
                    aria-label="Filtres"
                    onClick={() => {
                      setComplaintsFiltersOpen(true);
                      setComplaintsSortPanelOpen(false);
                    }}
                  >
                    <FunnelIcon />
                    {complaintsFiltersActive && <span className="appbar-icon-badge" />}
                  </button>
                  <button
                    type="button"
                    className="icon-button appbar-icon-button"
                    aria-label="Trier"
                    onClick={() => {
                      setComplaintsSortPanelOpen(true);
                      setComplaintsFiltersOpen(false);
                    }}
                  >
                    <SortIcon />
                  </button>
                  <div className="appbar-more-menu-wrap" ref={complaintsMoreMenuRef}>
                    <button
                      type="button"
                      className="icon-button appbar-icon-button"
                      aria-label="Plus d'options"
                      onClick={() => setComplaintsMoreMenuOpen((v) => !v)}
                    >
                      <MoreIcon />
                    </button>
                    {complaintsMoreMenuOpen && (
                      <div className="more-menu">
                        <button
                          type="button"
                          className="more-menu-item"
                          onClick={toggleComplaintsSelectionMode}
                        >
                          <SelectionModeIcon />
                          Mode sélection
                        </button>
                        <button
                          type="button"
                          className="more-menu-item"
                          onClick={() => handleSelectAllComplaints(filteredComplaints.map((c) => c.id))}
                        >
                          <SelectAllIcon />
                          Tout sélectionner
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="content">
            {activeTab === 'mentions' ? (
              <div className="panel-body">
                {selectionMode ? (
                  <div className="mentions-selection-toolbar">
                    <div className="mentions-selection-heading">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Quitter le mode sélection"
                        onClick={handleCancelSelection}
                      >
                        <CloseIcon />
                      </button>
                      <span className="mentions-selection-count">
                        {selectedIds.size} Sélectionnée{selectedIds.size > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mentions-selection-actions">
                      <button
                        type="button"
                        className="mark-all-read-btn"
                        disabled={selectedIds.size === 0}
                        onClick={handleBulkArchive}
                      >
                        Écarter
                      </button>
                      <button
                        type="button"
                        className="mark-all-read-btn"
                        disabled={selectedIds.size === 0}
                        onClick={handleBulkMarkRead}
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mentions-toolbar">
                    <span className="mentions-count-chip">
                      <ListIcon />
                      {filtered.length} Mentions
                    </span>
                    <button type="button" className="mark-all-read-btn" onClick={handleMarkAllRead}>
                      Tout marquer comme lu
                    </button>
                  </div>
                )}

                <MentionsAlertBanner
                  count={etatFilter === 'non-lu' ? 0 : newCount}
                  negativeCount={negativeNewCount}
                  onShow={handleShowNewMentions}
                />

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
                        selectionMode={selectionMode}
                        selected={selectedIds.has(reclamation.id)}
                        onToggleSelect={() => toggleSelectId(reclamation.id)}
                        onCreate={() => handleRequestCreate(reclamation)}
                        onDisqualify={() => handleDisqualify(reclamation.id)}
                        onFollow={() => handleFollowReclamation(reclamation.id)}
                      />
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="panel-empty">Aucune mention ne correspond à ces filtres.</div>
                )}

                {hasMore && (
                  <div className="scroll-sentinel" ref={sentinelRef}>
                    <span className="scroll-sentinel-loader" />
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-body">
                {complaintsSelectionMode ? (
                  <div className="mentions-selection-toolbar">
                    <div className="mentions-selection-heading">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Quitter le mode sélection"
                        onClick={handleCancelComplaintsSelection}
                      >
                        <CloseIcon />
                      </button>
                      <span className="mentions-selection-count">
                        {selectedComplaintIds.size} Sélectionnée{selectedComplaintIds.size > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mentions-selection-actions">
                      <div className="export-menu-wrap" ref={exportMenuRef}>
                        <button
                          type="button"
                          className="mark-all-read-btn"
                          disabled={selectedComplaintIds.size === 0}
                          onClick={() => setExportMenuOpen((v) => !v)}
                        >
                          Exporter la sélection
                        </button>
                        <ExportMenu
                          open={exportMenuOpen}
                          preferences={exportPreferences}
                          onChange={setExportPreferences}
                          onExport={handleExportWithPreferences}
                          selectionCount={selectedComplaintIds.size}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mentions-toolbar">
                    <span className="mentions-count-chip">
                      <ListIcon />
                      {filteredComplaints.length} Réclamations
                    </span>
                    <div className="export-menu-wrap" ref={exportMenuRef}>
                      <button
                        type="button"
                        className="btn-filled export-button"
                        onClick={() => setExportMenuOpen((v) => !v)}
                      >
                        Exporter
                        <svg
                          viewBox="0 0 9 5.5575"
                          width={12}
                          height={7.4}
                          fill="currentColor"
                          className={`btn-link-icon ${exportMenuOpen ? 'btn-link-icon-flipped' : ''}`}
                        >
                          <path d="M7.9425 0L4.5 3.435L1.0575 0L0 1.0575L4.5 5.5575L9 1.0575L7.9425 0Z" />
                        </svg>
                      </button>
                      <ExportMenu
                        open={exportMenuOpen}
                        preferences={exportPreferences}
                        onChange={setExportPreferences}
                        onExport={handleExportWithPreferences}
                      />
                    </div>
                  </div>
                )}

                <div className="card-list">
                  {visibleComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(complaint.id, el);
                        else cardRefs.current.delete(complaint.id);
                      }}
                    >
                      <ComplaintCard
                        complaint={complaint}
                        onOpen={() => setSelectedComplaint(complaint)}
                        selectionMode={complaintsSelectionMode}
                        selected={selectedComplaintIds.has(complaint.id)}
                        onToggleSelect={() => toggleSelectComplaintId(complaint.id)}
                      />
                    </div>
                  ))}
                </div>

                {filteredComplaints.length === 0 && (
                  <div className="panel-empty">Aucune réclamation ne correspond à ces filtres.</div>
                )}

                {hasMoreComplaints && (
                  <div className="scroll-sentinel" ref={sentinelRef}>
                    <span className="scroll-sentinel-loader" />
                  </div>
                )}
              </div>
            )}
          </div>
            </>
          )}
        </main>

        <MentionsFiltersPanel
          open={filtersOpen && activeTab === 'mentions'}
          onClose={() => setFiltersOpen(false)}
          etat={etatFilter}
          onEtatChange={selectEtatFilter}
          appreciation={appreciationFilter}
          onAppreciationChange={selectAppreciationFilter}
          reclamationsFacet={reclamationsFacet}
          onReclamationsFacetChange={selectReclamationsFacet}
          onReset={resetMentionsFilters}
        />

        <ComplaintsFiltersPanel
          open={complaintsFiltersOpen && activeTab === 'reclamations'}
          onClose={() => setComplaintsFiltersOpen(false)}
          progression={progressionFilter}
          onProgressionChange={selectProgressionFilter}
          conformite={conformiteFilter}
          onConformiteChange={selectConformiteFilter}
          onReset={resetComplaintsFilters}
        />

        <SortPanel
          open={sortPanelOpen && activeTab === 'mentions'}
          onClose={() => setSortPanelOpen(false)}
          value={mentionsSortOrder}
          onChange={setMentionsSortOrder}
        />

        <SortPanel
          open={complaintsSortPanelOpen && activeTab === 'reclamations'}
          onClose={() => setComplaintsSortPanelOpen(false)}
          value={complaintsSortOrder}
          onChange={setComplaintsSortOrder}
        />
      </div>

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

      <ReclamationCreatedAlert
        visible={!!createdAlert}
        sidebarOpen={sidebarOpen}
        onView={() => {
          if (createdAlert) openComplaintDetail(createdAlert.complaint);
          dismissCreatedAlert();
        }}
        onClose={dismissCreatedAlert}
      />

      {createTarget && (
        <CreateReclamationSlider
          reclamation={createTarget}
          onClose={() => setCreateTarget(null)}
          onSubmit={handleConfirmCreate}
        />
      )}

      {selectedComplaint && (
        <ComplaintDetailDrawer
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={handleUpdateComplaint}
        />
      )}
    </div>
  );
}
