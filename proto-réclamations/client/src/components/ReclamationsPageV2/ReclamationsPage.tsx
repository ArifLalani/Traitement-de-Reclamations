import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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
import ComplaintsSortPanel, { type ComplaintSortOrder } from './ComplaintsSortPanel';
import CreateReclamationSlider, {
  type ClotureReason,
  type ReclamantDraftData,
  type ReclamationFormData,
} from './CreateReclamationSlider';
import MentionsAlertBanner from './MentionsAlertBanner';
import MentionsFiltersPanel, {
  type AppreciationFilter,
  type ContactFilter,
  type EtatFilter,
  type PeriodeFilter,
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
  closedComplaints as initialClosedComplaints,
  getContactTag,
  getEcheanceInfo,
  STATUT_CLIENT_LABEL,
  type Complaint,
  type HistoriqueEntry,
  type MentionCanal,
} from './complaintsData';
import { exportComplaintsToCsv, filterComplaintsByRange } from './exportComplaints';
import type { Source } from './SourceIcon';
import './ReclamationsPage.css';

// The réclamations page's own primary view switch — always exactly one
// segment active (unlike a filter, there's no "tous"), so it lives next to
// the count chip instead of in the filters panel. "auteur-a-determiner"
// isn't a réclamation yet — it's mentions still waiting on their author to
// be identified/contacted (state 'en-attente'), surfaced here since that's
// where they're headed once resolved.
type ComplaintsContactSegment = 'client' | 'prospect' | 'auteur-a-determiner';

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

// Same sliding-pill segmented control pattern as CreateReclamationSlider's
// MentionTabsControl — the réclamations page's primary switch between the
// client, prospect and "non identifiés" segments, each showing its own
// count. Unlike that simpler control, these three labels vary a lot in
// length ("Réclamations clients" vs "Non identifiés"), and this control
// fits its segments to their own content rather than stretching evenly —
// so the indicator can't rely on dividing the track into N equal slices
// (that's what MentionTabsControl's CSS-only version does); it measures
// the active segment's actual rendered position/width instead.
function ComplaintsContactSegmentedControl({
  value,
  onChange,
  clientCount,
  prospectCount,
  auteurADeterminerCount,
}: {
  value: ComplaintsContactSegment;
  onChange: (segment: ComplaintsContactSegment) => void;
  clientCount: number;
  prospectCount: number;
  auteurADeterminerCount: number;
}) {
  // Non identifiés first (needs attention before anything else), then
  // clients (bound by ACPR deadlines) before prospects (no regulatory
  // deadline, so the least urgent of the three).
  const segments: { id: ComplaintsContactSegment; text: string; count: number }[] = [
    { id: 'auteur-a-determiner', text: 'Auteurs à identifier', count: auteurADeterminerCount },
    { id: 'client', text: 'Réclamations clients', count: clientCount },
    { id: 'prospect', text: 'Réclamations prospects', count: prospectCount },
  ];
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeButton = segmentRefs.current.get(value);
    if (!container || !activeButton) return;
    // offsetLeft already measures from the container's own padding edge
    // (4px, same as the indicator's CSS `left: 4px`) — translateX-ing by
    // that same amount on top of the CSS left would double the offset, so
    // this overrides left to 0 and lets the transform be the only thing
    // positioning it horizontally.
    setIndicatorStyle({
      left: 0,
      transform: `translateX(${activeButton.offsetLeft}px)`,
      width: `${activeButton.offsetWidth}px`,
      opacity: 1,
    });
  }, [value, clientCount, prospectCount, auteurADeterminerCount]);

  return (
    <div className="dossier-tabs-segmented dossier-tabs-segmented-small" ref={containerRef}>
      <div className="dossier-tabs-segment-indicator" style={indicatorStyle} />
      {segments.map((segment) => (
        <button
          key={segment.id}
          type="button"
          ref={(el) => {
            if (el) segmentRefs.current.set(segment.id, el);
            else segmentRefs.current.delete(segment.id);
          }}
          className={`dossier-tabs-segment dossier-tabs-segment-with-count ${value === segment.id ? 'dossier-tabs-segment-active' : ''}`}
          onClick={() => onChange(segment.id)}
        >
          <span>{segment.text}</span>
          <span className="dossier-tabs-segment-count">{segment.count}</span>
        </button>
      ))}
    </div>
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

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
      <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}


const SEEN_IDS_STORAGE_KEY = 'reclamations-seen-ids-v3';
const REPUTATION_INTRO_SEEN_KEY = 'reputation-intro-seen-v1';

type TabId = SidebarSection;

const PAGE_SIZE = 20;

type ReclamationsPageProps = {
  versionSwitcher?: React.ReactNode;
};

export default function ReclamationsPage({ versionSwitcher }: ReclamationsPageProps = {}) {
  const [activeTab, setActiveTab] = useState<TabId>('mentions');
  const [etatFilter, setEtatFilter] = useState<EtatFilter>('tous');
  const [appreciationFilter, setAppreciationFilter] = useState<AppreciationFilter>('tous');
  const [reclamationsFacet, setReclamationsFacet] = useState<ReclamationsFacet>('tous');
  const [contactFilter, setContactFilter] = useState<ContactFilter>('tous');
  const [periodeFilter, setPeriodeFilter] = useState<PeriodeFilter>('annee');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [mentionsSortOrder, setMentionsSortOrder] = useState<SortOrder>('recent');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectionModeClosing, setSelectionModeClosing] = useState(false);
  const selectionModeCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [scrolled, setScrolled] = useState(false);
  const [appbarStuck, setAppbarStuck] = useState(false);
  const appbarRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());
  const [stateOverrides, setStateOverrides] = useState<Record<string, ReclamationState>>({});
  // Date a demande de contact was sent for a mention now "en attente" — no
  // longer reachable (see handleConfirmContactAttempt), kept only so a
  // mention's own demandeContactDate fallback below still compiles against
  // the same shape.
  const [demandeContactDates] = useState<Record<string, string>>({});
  // Reclamant fields saved via the mention slider's "Enregistrer" action
  // (without creating a réclamation) — keyed by mention id so reopening the
  // slider picks up right where the user left off. A few curated mentions
  // start out already filled in, as if someone had saved them earlier, so
  // there's something to see beyond the empty-by-default case. Rattaché à
  // un contrat isn't something the system could ever know on its own — it
  // stays unanswered (null) rather than being guessed at.
  const [reclamantDrafts] = useState<Record<string, ReclamantDraftData>>({
    '2': {
      nom: 'D.',
      prenom: 'Marc',
      email: 'marc.dupont@gmail.com',
      telephone: '06 12 34 56 78',
      denominationSociale: '',
      porteurDuRisque: '',
      rattacheContrat: null,
      statutClient: '',
    },
    '5': {
      nom: 'Martin',
      prenom: 'Julie',
      email: 'julie.martin@gmail.com',
      telephone: '07 45 12 89 63',
      denominationSociale: '',
      porteurDuRisque: '',
      rattacheContrat: null,
      statutClient: '',
    },
    '7': {
      nom: 'Roussel',
      prenom: 'Patrice',
      email: 'patrice.roussel@gmail.com',
      telephone: '06 98 76 54 32',
      denominationSociale: '',
      porteurDuRisque: '',
      rattacheContrat: null,
      statutClient: '',
    },
  });
  const [mentionDraftHistorique] = useState<Record<string, HistoriqueEntry[]>>({});
  // Which clôture path closed a mention — kept so "Mention clôturée" still
  // explains itself correctly after the slider's been fully closed and
  // reopened, not just within the session that closed it.
  const [mentionClotureReasons, setMentionClotureReasons] = useState<Record<string, ClotureReason>>({});
  const [snackbar, setSnackbar] = useState<{
    id: string;
    message: string;
    variant: 'info' | 'success';
    onUndo?: () => void;
  } | null>(null);
  const [createTarget, setCreateTarget] = useState<Reclamation | null>(null);
  // True when createTarget was opened from the réclamations page's "Non
  // identifiés" segment (an existing réclamation) rather than from the
  // mentions list — see CreateReclamationSlider's isReclamationView.
  const [createTargetIsReclamationView, setCreateTargetIsReclamationView] = useState(false);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>(() => [
    ...initialComplaints,
    ...initialClosedComplaints,
  ]);
  const [progressionFilter, setProgressionFilter] = useState<ProgressionFilter>('tous');
  const [conformiteFilter, setConformiteFilter] = useState<ConformiteFilter>('tous');
  // Not a filter — a primary view switch between the two réclamations
  // segments, always one or the other (no "tous"), shown as a segmented
  // control next to the count chip rather than in the filters panel.
  const [complaintsContactSegment, setComplaintsContactSegment] =
    useState<ComplaintsContactSegment>('auteur-a-determiner');
  const [complaintsFiltersOpen, setComplaintsFiltersOpen] = useState(false);
  const [complaintsSortPanelOpen, setComplaintsSortPanelOpen] = useState(false);
  const [complaintsSortOrder, setComplaintsSortOrder] = useState<ComplaintSortOrder>('urgence');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  // Holds the just-created complaint while the brief loading state (in the
  // same panel) is shown, before swapping to its treatment content.
  const [creatingComplaint, setCreatingComplaint] = useState<Complaint | null>(null);
  // Tracks the id of a complaint opened as a direct continuation of the
  // create-réclamation slider, so that one drawer mount skips its entrance
  // animation (see skipEnterAnimation below) — cleared once the drawer is
  // closed so a later "voir le dossier" reopen animates normally.
  const justCreatedIdRef = useRef<string | null>(null);
  // Success toast shown after creating a réclamation — its own counter (see
  // handleConfirmCreate) rather than depending on creatingComplaint/
  // selectedComplaint directly, since those change mid-sequence (loading ->
  // treatment) and would otherwise tear down the toast's timers early.
  const [toastTrigger, setToastTrigger] = useState(0);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  // The just-created/updated réclamation's own ticket, shown in the success
  // toast ("Réclamation #0027 créée avec succès !") — null falls back to a
  // generic message.
  const [createdToastTicket, setCreatedToastTicket] = useState<string | null>(null);
  const [complaintsMoreMenuOpen, setComplaintsMoreMenuOpen] = useState(false);
  const [complaintsSelectionMode, setComplaintsSelectionMode] = useState(false);
  const [complaintsSelectionModeClosing, setComplaintsSelectionModeClosing] = useState(false);
  const complaintsSelectionModeCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedComplaintIds, setSelectedComplaintIds] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportPreferences>({
    period: 'mois',
    from: 'Août 2026',
    to: 'Août 2026',
  });
  const snackbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const selectContactFilter = (id: ContactFilter) => {
    if (id === contactFilter) return;
    prevTops.current = measureTops();
    setContactFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const selectPeriodeFilter = (id: PeriodeFilter) => {
    if (id === periodeFilter) return;
    prevTops.current = measureTops();
    setPeriodeFilter(id);
    setVisibleCount(PAGE_SIZE);
  };

  const resetMentionsFilters = () => {
    prevTops.current = measureTops();
    setEtatFilter('tous');
    setAppreciationFilter('tous');
    setReclamationsFacet('tous');
    setContactFilter('tous');
    setPeriodeFilter('annee');
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

  const selectComplaintsContactSegment = (id: ComplaintsContactSegment) => {
    if (id === complaintsContactSegment) return;
    prevTops.current = measureTops();
    setComplaintsContactSegment(id);
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
    if (selectionMode || selectionModeClosing) {
      if (selectionModeCloseTimeout.current) clearTimeout(selectionModeCloseTimeout.current);
      setSelectionMode(false);
      setSelectionModeClosing(false);
      setSelectedIds(new Set());
    }
    if (complaintsSelectionMode || complaintsSelectionModeClosing) {
      if (complaintsSelectionModeCloseTimeout.current) clearTimeout(complaintsSelectionModeCloseTimeout.current);
      setComplaintsSelectionMode(false);
      setComplaintsSelectionModeClosing(false);
      setSelectedComplaintIds(new Set());
    }
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
      setAppbarStuck(window.scrollY > 4);
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
    if (!createTarget && !selectedComplaint && !creatingComplaint) return;
    // The scrolling element is document.documentElement (html), not body —
    // locking body's overflow alone no longer blocks the page scroll now
    // that html has its own explicit overflow-x rule (see index.css).
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [createTarget, selectedComplaint, creatingComplaint]);

  // Brief "loading" beat shown in the same panel right after creating a
  // réclamation, before swapping to its treatment content — makes the
  // transition read as "processing" rather than an instant jump-cut.
  const CREATING_DELAY_MS = 3000;
  useEffect(() => {
    if (!creatingComplaint) return;
    const timeout = setTimeout(() => {
      setSelectedComplaint(creatingComplaint);
      setCreatingComplaint(null);
    }, CREATING_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [creatingComplaint]);

  // Success toast: appears 1.5s after the loading screen starts (so ~0.5s
  // before the treatment content lands) and stays up 4s total — spanning
  // the tail of the loading beat and the first few seconds on the dossier.
  useEffect(() => {
    if (toastTrigger === 0) return;
    const showTimeout = setTimeout(() => setShowCreatedToast(true), 1500);
    const hideTimeout = setTimeout(() => setShowCreatedToast(false), 1500 + 4000);
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [toastTrigger]);

  const isEffectivelyNew = (r: (typeof reclamations)[number]) =>
    r.isNew && r.state !== 'mes-reclamations' && !createdIds.has(r.id) && !seenIds.has(r.id);

  const handleRequestCreate = (r: (typeof reclamations)[number]) => {
    setCreateTarget(r);
    setCreateTargetIsReclamationView(false);
    if (isEffectivelyNew(r)) markIdsAsRead([r.id]);
  };

  // Opening a réclamation from "Non identifiés" reuses the mention slider
  // (same component as handleRequestCreate), but in its continuation view —
  // the underlying mention is what the slider actually needs (reclamation
  // prop), found via sourceReclamationId.
  // Opens the mention slider's continuation view for a réclamation whose
  // author isn't identified yet (instead of ComplaintDetailDrawer, which
  // assumes a known contact type) — instant, same as clicking any other
  // complaint card straight from the list (setSelectedComplaint), since
  // we're already on the réclamations page: no tab switch, no entrance
  // animation to wait out.
  const openUnidentifiedComplaintSlider = (complaint: Complaint) => {
    const mention = effectiveReclamations.find((r) => r.id === complaint.sourceReclamationId);
    if (!mention) return;
    setCreateTarget(mention);
    setCreateTargetIsReclamationView(true);
  };

  // Same thing, but reached from "Voir la réclamation" inside an
  // already-open mention slider — that *does* need the close + navigate +
  // delay dance (same rhythm as openComplaintDetail), since it's coming
  // from the mentions tab and the réclamations list itself still has to
  // mount and play its own card entrance animation first.
  const handleOpenUnidentifiedComplaint = (complaint: Complaint) => {
    setCreateTarget(null);
    handleSelectTab('reclamations');
    setComplaintsContactSegment('auteur-a-determiner');
    setTimeout(() => openUnidentifiedComplaintSlider(complaint), 650);
  };

  const markIdsAsRead = (ids: string[]) => {
    prevTops.current = measureTops();
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

  const exitSelectionMode = () => {
    setSelectionModeClosing(true);
    if (selectionModeCloseTimeout.current) clearTimeout(selectionModeCloseTimeout.current);
    selectionModeCloseTimeout.current = setTimeout(() => {
      setSelectionMode(false);
      setSelectedIds(new Set());
      setSelectionModeClosing(false);
    }, 220);
  };

  const handleBulkMarkRead = () => {
    const idsToMark = [...selectedIds].filter((id) => {
      const r = effectiveReclamations.find((x) => x.id === id);
      return r && isEffectivelyNew(r);
    });
    if (idsToMark.length === 0) return;
    markIdsAsRead(idsToMark);
    exitSelectionMode();
  };

  const handleResetApp = () => {
    try {
      localStorage.removeItem(SEEN_IDS_STORAGE_KEY);
      localStorage.removeItem(REPUTATION_INTRO_SEEN_KEY);
    } catch {
      // localStorage unavailable, ignore
    }
    window.location.reload();
  };

  const handleShowNewMentions = () => {
    prevTops.current = measureTops();
    setEtatFilter('non-lu');
    setVisibleCount(PAGE_SIZE);
    setFiltersOpen(false);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      exitSelectionMode();
    } else {
      setSelectionMode(true);
    }
    setMoreMenuOpen(false);
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectionMode(true);
    setSelectedIds(new Set(ids));
    setMoreMenuOpen(false);
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size === 0) {
      setSelectedIds(next);
      exitSelectionMode();
    } else {
      setSelectedIds(next);
      setSelectionMode(true);
    }
  };

  const handleCancelSelection = () => {
    exitSelectionMode();
  };

  const exitComplaintsSelectionMode = () => {
    setComplaintsSelectionModeClosing(true);
    if (complaintsSelectionModeCloseTimeout.current) clearTimeout(complaintsSelectionModeCloseTimeout.current);
    complaintsSelectionModeCloseTimeout.current = setTimeout(() => {
      setComplaintsSelectionMode(false);
      setSelectedComplaintIds(new Set());
      setComplaintsSelectionModeClosing(false);
    }, 220);
  };

  const toggleComplaintsSelectionMode = () => {
    if (complaintsSelectionMode) {
      exitComplaintsSelectionMode();
    } else {
      setComplaintsSelectionMode(true);
    }
    setComplaintsMoreMenuOpen(false);
  };

  const handleSelectAllComplaints = (ids: string[]) => {
    setComplaintsSelectionMode(true);
    setSelectedComplaintIds(new Set(ids));
    setComplaintsMoreMenuOpen(false);
  };

  const toggleSelectComplaintId = (id: string) => {
    const next = new Set(selectedComplaintIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (next.size === 0) {
      setSelectedComplaintIds(next);
      exitComplaintsSelectionMode();
    } else {
      setSelectedComplaintIds(next);
      setComplaintsSelectionMode(true);
    }
  };

  const handleCancelComplaintsSelection = () => {
    exitComplaintsSelectionMode();
  };

  const handleExportWithPreferences = () => {
    const hasSelection = complaintsSelectionMode && selectedComplaintIds.size > 0;
    const scoped = hasSelection
      ? complaintsList.filter((c) => selectedComplaintIds.has(c.id))
      : filterComplaintsByRange(complaintsList, exportPreferences);

    exportComplaintsToCsv(scoped);

    setExportMenuOpen(false);
    if (hasSelection) handleCancelComplaintsSelection();
  };

  // Shared by handleConfirmCreate and handleConfirmContactAttempt — builds
  // (or, if this mention already has a réclamation from an earlier
  // confirmation — see Q0's "Confirmer et créer une réclamation" — rebuilds
  // in place) the réclamation from the mention slider's current state. The
  // historique passed in is the slider's own full, freshly-recomputed trail
  // (not just what's new since last time), so overwriting the existing
  // complaint's historique with it never duplicates past entries.
  const buildComplaintFromMention = (
    mentionId: string,
    mentionUrl: string,
    formData: ReclamationFormData,
    mentionHistorique: HistoriqueEntry[],
    sourceCanal?: MentionCanal,
    closeReason?: { title: string; description: string; date: string },
  ): Complaint => {
    const existing = complaintsList.find((c) => c.sourceReclamationId === mentionId);
    // Its own réclamation ticket, not the mention's — the mention's numéro
    // de référence is drawn from a much larger pool (every mention, not
    // just the ones turned into réclamations), so reusing it here could
    // show a number well past the actual réclamation count. Once assigned
    // (first confirmation), it stays fixed across later ones for the same
    // mention rather than drifting up each time.
    const ticket =
      existing?.ticket ??
      `#${String(Math.max(0, ...complaintsList.map((c) => Number(c.ticket.replace('#', '')) || 0)) + 1).padStart(4, '0')}`;
    const requerant = `${formData.prenom} ${formData.nom}`.trim() || 'Réclamant inconnu';
    const newComplaint: Complaint = attachDetails({
      id: existing?.id ?? `created-${mentionId}`,
      sourceReclamationId: mentionId,
      ticket,
      requerant,
      dateReception: formData.dateReception,
      avancement: closeReason ? 'cloture' : existing?.avancement ?? 'a-traiter',
      canal: formData.canal as Source,
      sourceUrl: mentionUrl.replace(/\.{3}$/, ''),
      denominateurSocial: formData.denominationSociale,
      assureur: '',
      email: formData.email,
      objet: formData.objet,
      description: formData.description,
    });
    newComplaint.reclamant.telephone = formData.telephone;
    newComplaint.reclamant.rattacheContrat = formData.rattacheContrat;
    newComplaint.reclamant.statutClient = formData.statutClient;
    newComplaint.classification.porteurDuRisque = formData.porteurDuRisque;
    newComplaint.notesInternes = formData.notesInternes;
    newComplaint.sourceCanal = sourceCanal ?? existing?.sourceCanal;

    // Création d'une réclamation is really two steps, not one: the
    // réclamant's info gets saved first, then the réclamation itself is
    // created from it — the historique should show both, in that order,
    // even when nothing was actually edited (the save still happened).
    // And the dossier's own historique picks up right where the mention's
    // left off (réception, demande de contact, classement sans suite...)
    // instead of starting blank — same trail, whichever slider it's viewed
    // from.
    const contactChanges = [
      { label: "Nom de l'auteur du commentaire", value: formData.nom },
      { label: "Prénom de l'auteur du commentaire", value: formData.prenom },
      { label: 'Email', value: formData.email },
      { label: 'Téléphone', value: formData.telephone },
      { label: 'Dénomination sociale', value: formData.denominationSociale },
      { label: 'Assureur / Porteur du risque', value: formData.porteurDuRisque },
      { label: 'Rattachement à un contrat', value: formData.rattacheContrat === 'oui' ? 'Oui' : formData.rattacheContrat === 'non' ? 'Non' : '' },
      { label: 'Statut du client', value: formData.statutClient ? STATUT_CLIENT_LABEL[formData.statutClient] : '' },
    ].filter((change) => change.value.trim() !== '');
    const baseCreationEntry =
      newComplaint.historique.find((entry) => entry.title === 'Création de la réclamation') ??
      newComplaint.historique[0];
    const contactTag = getContactTag(formData.rattacheContrat);
    const saveInfoEntry: HistoriqueEntry = {
      title: 'Enregistrement des informations du réclamant',
      description:
        contactChanges.length > 0
          ? `Champs modifiés : ${contactChanges.map((c) => c.label).join(', ')}.`
          : 'Informations du réclamant enregistrées.',
      date: baseCreationEntry.date,
      author: 'Joe Bleau',
      changes: contactChanges,
    };
    const creationEntry: HistoriqueEntry = {
      title: `Création de la réclamation${contactTag === 'Prospect' ? ' prospect' : contactTag === 'Client' ? ' client' : ''}`,
      description: baseCreationEntry.description,
      date: baseCreationEntry.date,
      author: baseCreationEntry.author,
    };
    newComplaint.historique = closeReason
      ? [
          ...mentionHistorique,
          saveInfoEntry,
          creationEntry,
          { title: closeReason.title, description: closeReason.description, date: closeReason.date, author: 'Joe Bleau' },
        ]
      : [...mentionHistorique, saveInfoEntry, creationEntry];
    return newComplaint;
  };

  // Inserts a freshly-built complaint, or replaces the existing one for the
  // same mention in place (same position, no duplicate card) when one
  // already exists.
  const upsertComplaint = (newComplaint: Complaint) => {
    setComplaintsList((prev) => {
      const index = prev.findIndex((c) => c.sourceReclamationId === newComplaint.sourceReclamationId);
      if (index === -1) return [newComplaint, ...prev];
      const next = [...prev];
      next[index] = newComplaint;
      return next;
    });
  };

  const handleConfirmCreate = (formData: ReclamationFormData, mentionHistorique: HistoriqueEntry[]) => {
    if (!createTarget) return;
    const id = createTarget.id;
    prevTops.current = measureTops();
    setCreatedIds((prev) => new Set(prev).add(id));
    setStateOverrides((prev) => ({ ...prev, [id]: 'mes-reclamations' }));

    const newComplaint = buildComplaintFromMention(id, createTarget.url, formData, mentionHistorique);
    upsertComplaint(newComplaint);

    // Rather than closing the create slider and reopening a separate detail
    // drawer, swap what's shown inside the same panel — the réclamation was
    // just created, so we go straight into treating it instead of making the
    // user reopen it from the list, after a brief loading beat.
    justCreatedIdRef.current = newComplaint.id;
    setCreateTarget(null);
    setCreatingComplaint(newComplaint);
    setCreatedToastTicket(newComplaint.ticket);
    setToastTrigger((t) => t + 1);
  };

  const handleUpdateComplaint = (id: string, updates: ComplaintInformationsUpdate) => {
    setComplaintsList((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setSelectedComplaint((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const openComplaintDetail = (complaint: Complaint) => {
    handleSelectTab('reclamations');
    // Switch the segmented control to whichever segment this complaint
    // actually belongs to — otherwise the list behind the drawer stays on
    // whatever was last selected (e.g. "Réclamations clients"), which reads
    // as if the complaint just opened were misclassified even when it isn't
    // (its own title/segment membership is correct either way).
    const tag = getContactTag(complaint.reclamant.rattacheContrat);
    setComplaintsContactSegment(tag === 'Prospect' ? 'prospect' : tag === 'Client' ? 'client' : 'auteur-a-determiner');
    // Let the réclamations list finish mounting and playing its card entrance
    // animation (0.6s, see .card-list > * in ReclamationsPage.css) before the
    // detail drawer slides in, so the two animations don't overlap.
    setTimeout(() => setSelectedComplaint(complaint), 650);
  };

  const handleViewComplaintFromMention = (reclamationId: string) => {
    const complaint = complaintsList.find((c) => c.sourceReclamationId === reclamationId);
    if (!complaint) {
      setCreateTarget(null);
      return;
    }
    if (getContactTag(complaint.reclamant.rattacheContrat) === null) {
      // Still unidentified — stay in the mention slider, just switch it
      // into the réclamation's own continuation view (same as opening it
      // from "Non identifiés"), instead of ComplaintDetailDrawer's AR/RD
      // flow, which assumes a known contact type.
      handleOpenUnidentifiedComplaint(complaint);
      return;
    }
    setCreateTarget(null);
    openComplaintDetail(complaint);
  };

  // Confirms either Q0's "Considérez-vous cette mention comme étant une
  // réclamation ?" or, further down, the plateforme/administrateur canal's
  // own message/courrier — both create (or, if the dossier already exists
  // from an earlier confirmation in this same slider session, update) the
  // réclamation right away, but don't navigate anywhere: the mention slider
  // stays open, showing its own terminal notice or continuing to Q1,
  // depending on which confirmation this was.
  const handleConfirmContactAttempt = (
    formData: ReclamationFormData,
    mentionHistorique: HistoriqueEntry[],
    sourceCanal: MentionCanal,
    closeReason?: { title: string; description: string; date: string },
  ) => {
    if (!createTarget) return;
    const id = createTarget.id;
    prevTops.current = measureTops();
    setCreatedIds((prev) => new Set(prev).add(id));
    setStateOverrides((prev) => ({ ...prev, [id]: 'mes-reclamations' }));

    const newComplaint = buildComplaintFromMention(id, createTarget.url, formData, mentionHistorique, sourceCanal, closeReason);
    upsertComplaint(newComplaint);
    setCreatedToastTicket(newComplaint.ticket);
    setToastTrigger((t) => t + 1);
  };

  // The mention can't be answered directly on the source platform — a
  // request goes out to the site's host instead, which closes this mention
  // out.
  const handleClotureMention = (id: string) => {
    prevTops.current = measureTops();
    setStateOverrides((prev) => ({ ...prev, [id]: 'cloturee' }));
  };

  const handleSetClotureReason = (id: string, reason: ClotureReason) => {
    setMentionClotureReasons((prev) => ({ ...prev, [id]: reason }));
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
    seenIds,
    etatFilter,
    appreciationFilter,
    reclamationsFacet,
    periodeFilter,
    complaintsSearch,
    progressionFilter,
    conformiteFilter,
  ]);

  const effectiveReclamations = reclamations.map((r) => ({
    ...r,
    state: stateOverrides[r.id] ?? r.state,
    demandeContactDate: demandeContactDates[r.id] ?? r.demandeContactDate,
  }));

  // Once a réclamation exists for a mention, its reclamant data (not the
  // mention's own saved draft, which stops being updated once "en attente"
  // is left behind) is what settles whether the author is a prospect or a
  // client.
  const getMentionContactTag = (r: (typeof effectiveReclamations)[number]) => {
    const linkedComplaint =
      r.state === 'mes-reclamations' ? complaintsList.find((c) => c.sourceReclamationId === r.id) : undefined;
    const draft = reclamantDrafts[r.id];
    return linkedComplaint
      ? getContactTag(linkedComplaint.reclamant.rattacheContrat)
      : getContactTag(draft?.rattacheContrat);
  };

  const query = search.trim().toLowerCase();

  const matchesQuery = (r: (typeof effectiveReclamations)[number]) =>
    !query ||
    r.ticket.toLowerCase().includes(query) ||
    r.author.toLowerCase().includes(query) ||
    r.text.toLowerCase().includes(query) ||
    r.source.toLowerCase().includes(query) ||
    r.url.toLowerCase().includes(query);

  const searched = effectiveReclamations.filter(matchesQuery);

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

  const matchesReclamationsFacet = (r: (typeof effectiveReclamations)[number]) =>
    reclamationsFacet === 'tous' || r.state === reclamationsFacet;

  const matchesContact = (r: (typeof effectiveReclamations)[number]) => {
    if (contactFilter === 'tous') return true;
    const tag = getMentionContactTag(r);
    return contactFilter === 'prospect' ? tag === 'Prospect' : tag === 'Client';
  };

  const matchesPeriode = (r: (typeof effectiveReclamations)[number]) => {
    if (periodeFilter === 'tout') return true;
    const ts = parseDateValue(r.date);
    const now = new Date();
    if (periodeFilter === 'semaine') {
      const daysSinceMonday = (now.getDay() + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).getTime();
      return ts >= startOfWeek;
    }
    if (periodeFilter === 'mois') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return ts >= startOfMonth;
    }
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()).getTime();
    return ts >= twelveMonthsAgo;
  };

  const newCount = searched.filter(isEffectivelyNew).length;
  const negativeNewCount = searched.filter(
    (r) => isEffectivelyNew(r) && getSentiment(r.text) === 'negative',
  ).length;

  const filtered = searched
    .filter(
      (r) =>
        matchesReclamationsFacet(r) &&
        matchesEtat(r) &&
        matchesAppreciation(r) &&
        matchesContact(r) &&
        matchesPeriode(r),
    )
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

  // Search + progression + conformité only — the client/prospect segment is
  // applied on top of this, so its own two counts (shown on the segmented
  // control) stay in sync with every other active filter.
  const complaintsBeforeContactSegment = complaintsList.filter((c) => {
    const matchesSearch =
      !complaintsQuery ||
      c.ticket.toLowerCase().includes(complaintsQuery) ||
      c.requerant.toLowerCase().includes(complaintsQuery) ||
      c.objet.toLowerCase().includes(complaintsQuery) ||
      c.description.toLowerCase().includes(complaintsQuery);
    const matchesProgression = progressionFilter === 'tous' || c.avancement === progressionFilter;
    const matchesConformite = conformiteFilter === 'tous' || getEcheanceInfo(c).conformite === conformiteFilter;
    return matchesSearch && matchesProgression && matchesConformite;
  });
  const clientComplaintsCount = complaintsBeforeContactSegment.filter(
    (c) => getContactTag(c.reclamant.rattacheContrat) === 'Client',
  ).length;
  const prospectComplaintsCount = complaintsBeforeContactSegment.filter(
    (c) => getContactTag(c.reclamant.rattacheContrat) === 'Prospect',
  ).length;

  // A réclamation created straight from the "plateforme"/"administrateur"
  // canal (author not yet identified) starts out with no rattacheContrat
  // answer at all — getContactTag reads that as neither Client nor
  // Prospect, which is exactly the "Auteur à déterminer" segment below.
  const auteurADeterminerComplaintsCount = complaintsBeforeContactSegment.filter(
    (c) => getContactTag(c.reclamant.rattacheContrat) === null,
  ).length;

  const filteredComplaints = complaintsBeforeContactSegment
    .filter((c) => {
      const tag = getContactTag(c.reclamant.rattacheContrat);
      if (complaintsContactSegment === 'auteur-a-determiner') return tag === null;
      return tag === (complaintsContactSegment === 'prospect' ? 'Prospect' : 'Client');
    })
    .sort((a, b) =>
      complaintsSortOrder === 'urgence'
        ? (getEcheanceInfo(a).echeanceDays ?? Infinity) - (getEcheanceInfo(b).echeanceDays ?? Infinity)
        : parseDateReception(b.dateReception) - parseDateReception(a.dateReception),
    );

  filteredLength.current = activeTab === 'mentions' ? filtered.length : filteredComplaints.length;
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const visibleComplaints = filteredComplaints.slice(0, visibleCount);
  const hasMoreComplaints = visibleCount < filteredComplaints.length;

  const mentionsFiltersActive =
    etatFilter !== 'tous' ||
    appreciationFilter !== 'tous' ||
    reclamationsFacet !== 'tous' ||
    contactFilter !== 'tous' ||
    periodeFilter !== 'annee';
  const complaintsFiltersActive = progressionFilter !== 'tous' || conformiteFilter !== 'tous';

  const selectedReclamations = effectiveReclamations.filter((r) => selectedIds.has(r.id));
  const canMarkSelectedRead = selectedReclamations.some((r) => isEffectivelyNew(r));

  return (
    <div className="page scope-v2">
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-left-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="icon-button reset-app-button"
            aria-label="Réinitialiser le prototype"
            title="Réinitialiser le prototype"
            onClick={handleResetApp}
          >
            <ResetIcon />
          </button>
        </div>
        <div className="header-center">
          <div className="header-top">
            <div className="logo">
              <img src={logoText} alt="Opinion System" className="logo-text" />
              <div className="logo-sub">
                <img src={logoStarsRow} alt="" className="logo-stars" />
                <img src={logoSystemText} alt="" className="logo-system" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-shell">
        <Sidebar active={activeTab} onSelect={handleSelectTab} open={sidebarOpen} versionSwitcher={versionSwitcher} />

        <main className={`body ${sidebarOpen ? 'body-shifted' : ''}`}>
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
                  placeholder={activeTab === 'mentions' ? 'Rechercher une mention' : 'Rechercher une réclamation'}
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
                      setFiltersOpen((v) => !v);
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
                      setSortPanelOpen((v) => !v);
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
                      setComplaintsFiltersOpen((v) => !v);
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
                      setComplaintsSortPanelOpen((v) => !v);
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
                {selectionMode || selectionModeClosing ? (
                  <div
                    className={`mentions-selection-toolbar ${appbarStuck ? 'mentions-toolbar-stuck' : ''} ${selectionModeClosing ? 'mentions-selection-toolbar-closing' : ''}`}
                  >
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
                        disabled={!canMarkSelectedRead}
                        onClick={handleBulkMarkRead}
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`mentions-toolbar ${appbarStuck ? 'mentions-toolbar-stuck' : ''}`}>
                    <span className="mentions-count-chip">
                      <ListIcon />
                      {filtered.length} Mentions
                    </span>
                    {newCount > 0 && (
                      <button type="button" className="mark-all-read-btn" onClick={handleMarkAllRead}>
                        Tout marquer comme lu
                      </button>
                    )}
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
                        onViewComplaint={() => handleViewComplaintFromMention(reclamation.id)}
                        contactTag={getMentionContactTag(reclamation)}
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
                {complaintsSelectionMode || complaintsSelectionModeClosing ? (
                  <div
                    className={`mentions-selection-toolbar ${appbarStuck ? 'mentions-toolbar-stuck' : ''} ${complaintsSelectionModeClosing ? 'mentions-selection-toolbar-closing' : ''}`}
                  >
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
                  <div className={`mentions-toolbar ${appbarStuck ? 'mentions-toolbar-stuck' : ''}`}>
                    <div className="mentions-toolbar-start">
                      <ComplaintsContactSegmentedControl
                        value={complaintsContactSegment}
                        onChange={selectComplaintsContactSegment}
                        clientCount={clientComplaintsCount}
                        prospectCount={prospectComplaintsCount}
                        auteurADeterminerCount={auteurADeterminerComplaintsCount}
                      />
                    </div>
                    {/* Nothing to export yet — the author isn't identified, so
                        there's no réclamant/contact info to put in a file. */}
                    {complaintsContactSegment !== 'auteur-a-determiner' && (
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
                    )}
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
                        onOpen={() =>
                          complaintsContactSegment === 'auteur-a-determiner'
                            ? openUnidentifiedComplaintSlider(complaint)
                            : setSelectedComplaint(complaint)
                        }
                        selectionMode={complaintsSelectionMode}
                        selected={selectedComplaintIds.has(complaint.id)}
                        onToggleSelect={() => toggleSelectComplaintId(complaint.id)}
                      />
                    </div>
                  ))}
                </div>

                {filteredComplaints.length === 0 && (
                  <div className="panel-empty">
                    {complaintsContactSegment === 'auteur-a-determiner'
                      ? "Aucune réclamation en attente d'identification de l'auteur."
                      : 'Aucune réclamation ne correspond à ces filtres.'}
                  </div>
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
          contact={contactFilter}
          onContactChange={selectContactFilter}
          periode={periodeFilter}
          onPeriodeChange={selectPeriodeFilter}
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

        <ComplaintsSortPanel
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

      {createTarget && (
        <CreateReclamationSlider
          reclamation={createTarget}
          onClose={() => setCreateTarget(null)}
          onSubmit={handleConfirmCreate}
          onViewComplaint={() => handleViewComplaintFromMention(createTarget.id)}
          onConfirmContactAttempt={handleConfirmContactAttempt}
          onClotureMention={() => handleClotureMention(createTarget.id)}
          isReclamationView={createTargetIsReclamationView}
          savedCanalAnswer={complaintsList.find((c) => c.sourceReclamationId === createTarget.id)?.sourceCanal}
          linkedComplaintHistorique={
            complaintsList.find((c) => c.sourceReclamationId === createTarget.id)?.historique
          }
          linkedComplaintTicket={complaintsList.find((c) => c.sourceReclamationId === createTarget.id)?.ticket}
          savedReclamantDraft={reclamantDrafts[createTarget.id]}
          savedDraftHistorique={mentionDraftHistorique[createTarget.id]}
          savedClotureReason={mentionClotureReasons[createTarget.id]}
          onSetClotureReason={(reason) => handleSetClotureReason(createTarget.id, reason)}
        />
      )}

      {creatingComplaint && (
        <div className="drawer-backdrop drawer-noenter">
          <div className="drawer-panel dossier-panel drawer-noenter">
            <div className="dossier-panel-loading">
              <span className="dossier-panel-loader" />
              <p className="dossier-panel-loading-text">Création de la réclamation…</p>
            </div>
          </div>
        </div>
      )}

      {selectedComplaint && (
        <ComplaintDetailDrawer
          complaint={selectedComplaint}
          onClose={() => {
            justCreatedIdRef.current = null;
            setSelectedComplaint(null);
          }}
          onUpdate={handleUpdateComplaint}
          skipEnterAnimation={justCreatedIdRef.current === selectedComplaint.id}
        />
      )}

      {showCreatedToast && (createTarget || creatingComplaint || selectedComplaint) && (
        <div className="created-toast-overlay">
          <div className="created-toast-band">
            <div className="dossier-created-toast">
              {createdToastTicket ? `Réclamation ${createdToastTicket} créée avec succès !` : 'Réclamation créée avec succès'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
