import { useEffect, useRef, useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import ArrowUpRight from './ArrowUpRight';
import ExportMenu, { type ExportPreferences } from './ExportMenu';
import { exportComplaintsToCsv, exportComplaintsToPdf } from './exportComplaints';
import {
  AVANCEMENT_LABEL,
  CONFORMITE_LABEL,
  getDossierSteps,
  INTERLOCUTEURS,
  RELATION_LABEL,
  type Complaint,
  type DossierStep,
  type HistoriqueEntry,
  type Reclamant,
  type Relation,
  type SuiviCloture,
  type Traitement,
} from './complaintsData';

const DOSSIER_STEP_SHORT_LABELS = ['Réception', 'Création', 'Accusé de réception', 'Réponse définitive', 'Clôture'];

// Same compact stepper used in the create-réclamation slider preview (see
// CreateReclamationSlider.tsx) — reused here as the persistent, always-open
// replacement for the old collapsible "Avancement du dossier" section.
function DossierHStepper({ steps }: { steps: DossierStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  // Once every step (including the last) is "done" — e.g. a clôturé
  // dossier — completedCount equals steps.length, not steps.length - 1,
  // which would push this past 1 and overshoot the line past the last
  // dot. Cap it at steps.length - 1 so a fully-done stepper lands at 100%.
  const fillFraction = Math.min(completedCount, steps.length - 1) / (steps.length - 1);

  return (
    <div className="dossier-hstepper">
      <span className="dossier-hstepper-line" />
      <span
        className="dossier-hstepper-line-fill"
        style={{ width: `calc(${fillFraction} * (100% - 51.15px))` }}
      />
      {steps.map((step, index) => (
        <div key={step.label} className={`dossier-hstep dossier-hstep-${step.status}`}>
          <span className="dossier-hstep-dot" aria-hidden>
            {step.status === 'done' ? '✓' : index + 1}
          </span>
          <span className="dossier-hstep-label" title={step.label}>
            {DOSSIER_STEP_SHORT_LABELS[index]}
          </span>
          {step.status === 'current' && step.badgeLabel && (
            <span className={`dossier-hstep-badge ${step.badgeWarning ? 'dossier-hstep-badge-warning' : ''}`}>
              {step.badgeLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

const CLOSE_ANIMATION_DURATION = 200;
const ACCORDION_COLLAPSE_DURATION = 300;

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="currentColor"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s ease' }}
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-3.5 4-5.3 7-5.3s6 1.8 7 5.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4 3 6M19 4l2 2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.2M16 3v3.2" strokeLinecap="round" />
      <path d="M8.5 14.5 11 17l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
  plain?: boolean;
  error?: boolean;
  errorText?: string;
  onChange?: (value: string) => void;
  endAdornment?: React.ReactNode;
};

function SectionTextField({
  label,
  value,
  required,
  placeholder,
  multiline,
  readOnly,
  plain,
  error,
  errorText,
  onChange,
  endAdornment,
}: TextFieldProps) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div
        className={`dossier-field-input ${readOnly || plain ? 'dossier-field-input-readonly' : ''} ${error ? 'dossier-field-input-error' : ''}`}
      >
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
        {endAdornment && <span className="dossier-field-adornment">{endAdornment}</span>}
      </div>
      {error && errorText && <span className="dossier-field-error-text">{errorText}</span>}
    </div>
  );
}

function SectionSelectField<T extends string>({
  label,
  value,
  required,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  required?: boolean;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div className="dossier-field-input">
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          <option value="" disabled>
            Sélectionner...
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type AccordionSectionProps = {
  icon: React.ReactNode;
  title: string;
  badge?: { label: string; className: string };
  meta?: string;
  open: boolean;
  onToggle: () => void;
  headline?: string;
  children?: React.ReactNode;
};

function AccordionSection({ icon, title, badge, meta, open, onToggle, headline, children }: AccordionSectionProps) {
  const [mounted, setMounted] = useState(open);
  const [renderKey, setRenderKey] = useState(0);

  // Delaying the unmount by the transition duration lets the collapse
  // animation play against real content instead of snapping to zero height
  // the instant the section closes; re-mounting on open also replays the
  // items' entrance animation each time.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      setRenderKey((k) => k + 1);
      return;
    }
    const timeout = setTimeout(() => setMounted(false), ACCORDION_COLLAPSE_DURATION);
    return () => clearTimeout(timeout);
  }, [open]);

  return (
    <div className={`dossier-section ${open ? 'dossier-section-open' : ''}`}>
      <button type="button" className="dossier-section-header" onClick={onToggle}>
        <span className="dossier-section-icon">{icon}</span>
        <span className="dossier-section-title">{title}</span>
        {meta && <span className="dossier-section-meta">{meta}</span>}
        {badge && <span className={`chip ${badge.className}`}>{badge.label}</span>}
        <ChevronIcon open={open} />
      </button>
      <div className="dossier-section-collapse">
        <div className="dossier-section-collapse-inner">
          {mounted && (
            <div className="dossier-section-body" key={renderKey}>
              {headline && <p className="dossier-section-headline">{headline}</p>}
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  if (disabled) return null;
  return (
    <button type="button" className="btn-text dossier-save-btn" onClick={onClick}>
      Sauvegarder
    </button>
  );
}

export type ComplaintInformationsUpdate = Partial<Complaint>;

type ComplaintDetailDrawerProps = {
  complaint: Complaint;
  onClose: () => void;
  onUpdate?: (id: string, updates: ComplaintInformationsUpdate) => void;
};

type SectionKey = 'informations' | 'reclamant' | 'suivi' | 'historique';

export default function ComplaintDetailDrawer({ complaint, onClose, onUpdate }: ComplaintDetailDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set());
  const [headerStuck, setHeaderStuck] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreferences, setExportPreferences] = useState<ExportPreferences>({
    format: 'csv',
    period: 'mois',
    from: '',
    to: '',
  });
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  const handleExportComplaint = () => {
    if (exportPreferences.format === 'csv') {
      exportComplaintsToCsv([complaint]);
    } else {
      exportComplaintsToPdf([complaint]);
    }
    setExportMenuOpen(false);
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const closeForReal = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_DURATION);
  };

  const performClose = () => {
    if (closing) return;
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
      return;
    }
    closeForReal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') performClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Historique ---
  const buildHistoryEntry = (title: string, description: string): HistoriqueEntry => {
    const now = new Date();
    return {
      title,
      description,
      date: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      author: 'Joe Bleau',
    };
  };
  const withHistory = (title: string, changedLabels: string[]): Pick<Complaint, 'historique'> | Record<string, never> => {
    if (changedLabels.length === 0) return {};
    const description = `Champs modifiés : ${changedLabels.join(', ')}.`;
    return { historique: [...complaint.historique, buildHistoryEntry(title, description)] };
  };

  // --- Informations de la réclamation --- (also owns the "Interlocuteur en
  // charge" field, formerly its own "Traitement / attribution" section, and
  // "Notes internes", formerly its own section — both were folded in here
  // per the Figma redesign, so one save covers all three).
  const [infoDraft, setInfoDraft] = useState({
    dateReception: complaint.dateReception,
    objet: complaint.objet,
    description: complaint.description,
    sourceUrl: complaint.sourceUrl ?? '',
  });
  const [traitementDraft, setTraitementDraft] = useState<Traitement>(complaint.traitement);
  const [notesDraft, setNotesDraft] = useState(complaint.notesInternes);
  const infoDirty =
    infoDraft.dateReception !== complaint.dateReception ||
    infoDraft.objet !== complaint.objet ||
    infoDraft.description !== complaint.description ||
    infoDraft.sourceUrl !== (complaint.sourceUrl ?? '') ||
    traitementDraft.interlocuteur !== complaint.traitement.interlocuteur ||
    notesDraft !== complaint.notesInternes;
  const saveInfo = () => {
    const changed: string[] = [];
    if (infoDraft.dateReception !== complaint.dateReception) changed.push('Date de réception');
    if (infoDraft.objet !== complaint.objet) changed.push('Objet de la réclamation');
    if (infoDraft.description !== complaint.description) changed.push('Description');
    if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? '')) changed.push('Lien de la source');
    if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur) changed.push('Interlocuteur en charge');
    if (notesDraft !== complaint.notesInternes) changed.push('Notes internes');
    onUpdate?.(complaint.id, {
      ...infoDraft,
      sourceUrl: infoDraft.sourceUrl || undefined,
      traitement: traitementDraft,
      notesInternes: notesDraft,
      ...withHistory('Modification des informations de la réclamation', changed),
    });
  };

  // --- Informations du réclamant ---
  const [reclamantDraft, setReclamantDraft] = useState<Reclamant>(complaint.reclamant);
  const [denominateurSocialDraft, setDenominateurSocialDraft] = useState(complaint.denominateurSocial);
  const [porteurDuRisqueDraft, setPorteurDuRisqueDraft] = useState(complaint.classification.porteurDuRisque);
  const reclamantDirty =
    JSON.stringify(reclamantDraft) !== JSON.stringify(complaint.reclamant) ||
    denominateurSocialDraft !== complaint.denominateurSocial ||
    porteurDuRisqueDraft !== complaint.classification.porteurDuRisque;
  const saveReclamant = () => {
    const changed: string[] = [];
    if (reclamantDraft.prenom !== complaint.reclamant.prenom) changed.push('Prénom');
    if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push('Nom');
    if (reclamantDraft.email !== complaint.reclamant.email) changed.push('Email');
    if (reclamantDraft.telephone !== complaint.reclamant.telephone) changed.push('Téléphone');
    if (reclamantDraft.adresse !== complaint.reclamant.adresse) changed.push('Adresse');
    if (reclamantDraft.relation !== complaint.reclamant.relation) changed.push('Relation avec ce client');
    if (reclamantDraft.relationAutrePrecision !== complaint.reclamant.relationAutrePrecision) changed.push('Précision');
    if (denominateurSocialDraft !== complaint.denominateurSocial) changed.push('Dénomination Sociale');
    if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque) changed.push('Porteur du risque');
    onUpdate?.(complaint.id, {
      reclamant: reclamantDraft,
      denominateurSocial: denominateurSocialDraft,
      classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      ...withHistory('Modification des informations du réclamant', changed),
    });
  };
  const reclamantMissing = [
    reclamantDraft.prenom,
    reclamantDraft.nom,
    reclamantDraft.email,
    ...(reclamantDraft.relation === 'autre' ? [reclamantDraft.relationAutrePrecision] : []),
  ].filter((v) => !v).length;

  // Highlights the specific missing fields in "Informations du réclamant"
  // once the user has tried (and failed) to confirm the accusé de
  // réception — clears itself per-field as soon as that field is filled.
  const [showContactErrors, setShowContactErrors] = useState(false);
  const prenomMissing = showContactErrors && !reclamantDraft.prenom;
  const nomMissing = showContactErrors && !reclamantDraft.nom;
  const contactMissing = showContactErrors && !reclamantDraft.email && !reclamantDraft.telephone;

  // --- Suivi et clôture ---
  const [suiviDraft, setSuiviDraft] = useState<SuiviCloture>(complaint.suiviCloture);
  const suiviDirty = JSON.stringify(suiviDraft) !== JSON.stringify(complaint.suiviCloture);
  const saveSuivi = () => {
    const changed: string[] = [];
    if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR) changed.push("Date d'envoi de l'accusé de réception");
    if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
      changed.push("Date d'envoi de la réponse intermédiaire");
    if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
      changed.push("Date de l'action immédiate");
    if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
      changed.push("Date de l'action corrective");
    if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee) changed.push('Action réalisée');
    if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
      changed.push("Vérification d'efficacité");
    if (suiviDraft.reponseApportee !== complaint.suiviCloture.reponseApportee) changed.push('Réponse apportée');
    onUpdate?.(complaint.id, {
      suiviCloture: suiviDraft,
      ...withHistory('Modification du suivi et clôture', changed),
    });
  };
  const suiviMissing = Object.values(suiviDraft).filter((v) => !v).length;

  const hasUnsavedChanges = infoDirty || reclamantDirty || suiviDirty;

  // Saves every dirty section in one go (used by the "Sauvegarder" CTA in
  // the unsaved-changes dialog). Built as a single combined onUpdate call,
  // rather than calling saveInfo/saveReclamant/saveSuivi back to back —
  // each of those reads from the same (stale, pre-update) complaint.historique,
  // so calling them in sequence would have each overwrite the previous
  // one's history entry instead of appending.
  const saveAllDirtySections = () => {
    const updates: ComplaintInformationsUpdate = {};
    let historique = complaint.historique;

    if (infoDirty) {
      const changed: string[] = [];
      if (infoDraft.dateReception !== complaint.dateReception) changed.push('Date de réception');
      if (infoDraft.objet !== complaint.objet) changed.push('Objet de la réclamation');
      if (infoDraft.description !== complaint.description) changed.push('Description');
      if (infoDraft.sourceUrl !== (complaint.sourceUrl ?? '')) changed.push('Lien de la source');
      if (traitementDraft.interlocuteur !== complaint.traitement.interlocuteur) changed.push('Interlocuteur en charge');
      if (notesDraft !== complaint.notesInternes) changed.push('Notes internes');
      Object.assign(updates, {
        ...infoDraft,
        sourceUrl: infoDraft.sourceUrl || undefined,
        traitement: traitementDraft,
        notesInternes: notesDraft,
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry(
            'Modification des informations de la réclamation',
            `Champs modifiés : ${changed.join(', ')}.`,
          ),
        ];
      }
    }

    if (reclamantDirty) {
      const changed: string[] = [];
      if (reclamantDraft.prenom !== complaint.reclamant.prenom) changed.push('Prénom');
      if (reclamantDraft.nom !== complaint.reclamant.nom) changed.push('Nom');
      if (reclamantDraft.email !== complaint.reclamant.email) changed.push('Email');
      if (reclamantDraft.telephone !== complaint.reclamant.telephone) changed.push('Téléphone');
      if (reclamantDraft.adresse !== complaint.reclamant.adresse) changed.push('Adresse');
      if (reclamantDraft.relation !== complaint.reclamant.relation) changed.push('Relation avec ce client');
      if (reclamantDraft.relationAutrePrecision !== complaint.reclamant.relationAutrePrecision) changed.push('Précision');
      if (denominateurSocialDraft !== complaint.denominateurSocial) changed.push('Dénomination Sociale');
      if (porteurDuRisqueDraft !== complaint.classification.porteurDuRisque) changed.push('Porteur du risque');
      Object.assign(updates, {
        reclamant: reclamantDraft,
        denominateurSocial: denominateurSocialDraft,
        classification: { ...complaint.classification, porteurDuRisque: porteurDuRisqueDraft },
      });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry('Modification des informations du réclamant', `Champs modifiés : ${changed.join(', ')}.`),
        ];
      }
    }

    if (suiviDirty) {
      const changed: string[] = [];
      if (suiviDraft.dateAR !== complaint.suiviCloture.dateAR) changed.push("Date d'envoi de l'accusé de réception");
      if (suiviDraft.dateReponse !== complaint.suiviCloture.dateReponse)
        changed.push("Date d'envoi de la réponse intermédiaire");
      if (suiviDraft.actionImmediate !== complaint.suiviCloture.actionImmediate)
        changed.push("Date de l'action immédiate");
      if (suiviDraft.actionCorrective !== complaint.suiviCloture.actionCorrective)
        changed.push("Date de l'action corrective");
      if (suiviDraft.actionRealisee !== complaint.suiviCloture.actionRealisee) changed.push('Action réalisée');
      if (suiviDraft.verificationEfficacite !== complaint.suiviCloture.verificationEfficacite)
        changed.push("Vérification d'efficacité");
      if (suiviDraft.reponseApportee !== complaint.suiviCloture.reponseApportee) changed.push('Réponse apportée');
      Object.assign(updates, { suiviCloture: suiviDraft });
      if (changed.length > 0) {
        historique = [
          ...historique,
          buildHistoryEntry('Modification du suivi et clôture', `Champs modifiés : ${changed.join(', ')}.`),
        ];
      }
    }

    onUpdate?.(complaint.id, { ...updates, historique });
  };

  const handleSaveAndClose = () => {
    saveAllDirtySections();
    setShowUnsavedConfirm(false);
    closeForReal();
  };

  const steps = getDossierSteps(complaint);
  const currentStep = steps.find((s) => s.status === 'current');

  const arSent = complaint.suiviCloture.dateAR !== '';
  const enAttente = !arSent && complaint.suiviCloture.demandeContactDate !== '';
  const responseSent = complaint.suiviCloture.dateReponse !== '';

  const handleConfirmNextStep = () => {
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    if (!arSent) {
      const nextSuivi = { ...suiviDraft, dateAR: todayLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            "Confirmation de l'envoi de l'Accusé de Réception",
            'Accusé de réception envoyé au réclamant.',
          ),
        ],
      });
    } else {
      const nextSuivi = { ...suiviDraft, dateReponse: todayLabel };
      setSuiviDraft(nextSuivi);
      onUpdate?.(complaint.id, {
        suiviCloture: nextSuivi,
        historique: [
          ...complaint.historique,
          buildHistoryEntry(
            'Confirmation de l’envoi de la Réponse Définitive',
            'Réponse définitive envoyée au réclamant.',
          ),
        ],
      });
    }
  };

  // The fallback when the réclamant's contact info isn't available yet:
  // marks the dossier "En attente" (still avancement 'a-traiter' — this is a
  // sub-state, not a stepper change) until that info shows up or the
  // dossier gets closed out via "Classer sans suite".
  const handleConfirmDemande = () => {
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    const nextSuivi = { ...suiviDraft, demandeContactDate: todayLabel };
    setSuiviDraft(nextSuivi);
    onUpdate?.(complaint.id, {
      suiviCloture: nextSuivi,
      historique: [
        ...complaint.historique,
        buildHistoryEntry(
          'Confirmation de la demande de contact',
          "Demande de contact envoyée au réclamant ; dossier placé en attente d'une réponse.",
        ),
      ],
    });
  };

  const handleClasserSansSuite = () => {
    onUpdate?.(complaint.id, {
      avancement: 'sans-suite',
      historique: [
        ...complaint.historique,
        buildHistoryEntry('Classement sans suite', "Dossier classé sans suite faute de réponse du réclamant."),
      ],
    });
  };

  // Clôture is its own explicit step now — sending the réponse définitive
  // (handleConfirmNextStep, arSent branch) only marks that step done and
  // moves the stepper to "Clôture"; this is what actually closes the file.
  const handleCloturer = () => {
    onUpdate?.(complaint.id, {
      avancement: 'cloture',
      historique: [...complaint.historique, buildHistoryEntry('Clôture du dossier', 'Dossier clôturé.')],
    });
  };

  // Confirming the accusé de réception requires the réclamant's name and at
  // least one contact method. Rather than just disabling the button, a
  // click with those fields empty opens "Informations du réclamant" and
  // flags exactly which ones are missing.
  const handleConfirmAR = () => {
    const missing = !reclamantDraft.prenom || !reclamantDraft.nom || (!reclamantDraft.email && !reclamantDraft.telephone);
    if (missing) {
      setShowContactErrors(true);
      setOpenSections((prev) => new Set(prev).add('reclamant'));
      return;
    }
    setShowContactErrors(false);
    handleConfirmNextStep();
  };

  const showNextStepBanner = complaint.avancement !== 'cloture' && complaint.avancement !== 'sans-suite';

  const statusChipLabel = enAttente ? 'En attente' : AVANCEMENT_LABEL[complaint.avancement];
  const statusChipClassName = `chip dossier-status-chip ${
    enAttente ? 'dossier-status-chip-attente' : complaint.avancement !== 'a-traiter' ? 'dossier-status-chip-closed' : ''
  }`;

  return (
    <div className={`drawer-backdrop ${closing ? 'drawer-closing' : ''}`} onClick={performClose}>
      <div
        className="drawer-panel dossier-panel"
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => setHeaderStuck(e.currentTarget.scrollTop > 4)}
      >
        <div className={`dossier-header ${headerStuck ? 'dossier-header-stuck' : ''}`}>
          <span className="dossier-title">Dossier {complaint.ticket}</span>
          <span className={statusChipClassName}>{statusChipLabel}</span>
          <div className="dossier-header-spacer" />
          <div className="export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="btn-filled dossier-export-btn"
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
              onExport={handleExportComplaint}
              selectionCount={1}
            />
          </div>
          <button type="button" className="drawer-close-button" aria-label="Fermer" onClick={performClose}>
            <img src={drawerClose} alt="" width={14} height={14} />
          </button>
        </div>

        <div className="dossier-content">
          <DossierHStepper steps={steps} />

          {showNextStepBanner && currentStep && (
            <div className="dossier-info-alert">
              {enAttente ? (
                <>
                  <p className="dossier-info-alert-text">
                    Ce dossier est en attente d'un retour du réclamant, suite à l'envoi d'une demande de contact le{' '}
                    {complaint.suiviCloture.demandeContactDate}.
                  </p>
                  <p className="dossier-info-alert-text">
                    Dès que le nom et un contact valide du réclamant seront obtenus, veuillez les renseigner dans la
                    section <strong>« Informations du réclamant »</strong> ci-dessous afin de reprendre le
                    traitement du dossier.
                  </p>
                  <p className="dossier-info-alert-text">
                    En l'absence de réponse du réclamant, ce dossier peut être classé sans suite.
                  </p>
                </>
              ) : !arSent ? (
                <>
                  <p className="dossier-info-alert-text">
                    L'envoi de l'accusé de réception nécessite le nom et un contact valide (adresse email ou numéro
                    de téléphone) du réclamant. Si ces informations sont disponibles, veuillez les renseigner dans la
                    section <strong>« Informations du réclamant »</strong> ci-dessous avant de confirmer l'envoi.
                  </p>
                  <p className="dossier-info-alert-text">
                    À défaut, veuillez confirmer la demande de contact, le dossier sera alors placé en état{' '}
                    <strong>« En attente »</strong> jusqu'à réception d'une réponse.
                  </p>
                </>
              ) : responseSent ? (
                <p className="dossier-info-alert-text">
                  Vérifiez que les informations du dossier ont bien été renseignées dans leur globalité avant de
                  clôturer définitivement le dossier.
                </p>
              ) : (
                <>
                  <p className="dossier-info-alert-text">
                    Le nom et le contact du réclamant sont renseignés, et l'accusé de réception a été envoyé.
                  </p>
                  <p className="dossier-info-alert-text">
                    Avant de <strong>confirmer l'envoi de la réponse définitive</strong>, vérifiez et complétez
                    toutes vos informations dans la section <strong>« Suivi et Clôture »</strong> ci-dessous.
                  </p>
                </>
              )}
            </div>
          )}

          <AccordionSection
            icon={<FileTextIcon />}
            title="Informations de la réclamation"
            badge={{ label: 'Complété', className: 'chip-mes-reclamations' }}
            open={openSections.has('informations')}
            onToggle={() => toggleSection('informations')}
            headline="Confirmez ou complétez les champs ci-dessous"
          >
            <div className="dossier-field-row">
              <SectionTextField label="Référence" value={complaint.ticket} required readOnly />
              <SectionTextField label="Canal de réception" value="Web" required readOnly />
            </div>
            <div className="dossier-field-row">
              <div className="dossier-field">
                <span className="dossier-field-label">Statut de progression</span>
                <span className={statusChipClassName} style={{ alignSelf: 'flex-start' }}>
                  {statusChipLabel}
                </span>
              </div>
              <div className="dossier-field">
                <span className="dossier-field-label">Statut de conformité</span>
                <span
                  className={`chip complaints-chip-conformite-${complaint.conformite}`}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {CONFORMITE_LABEL[complaint.conformite]}
                </span>
              </div>
            </div>
            <SectionTextField
              label="Date de réception"
              value={infoDraft.dateReception}
              required
              onChange={(v) => setInfoDraft((d) => ({ ...d, dateReception: v }))}
            />
            <SectionTextField
              label="Objet de la réclamation"
              value={infoDraft.objet}
              required
              onChange={(v) => setInfoDraft((d) => ({ ...d, objet: v }))}
            />
            <SectionTextField
              label="Description"
              value={infoDraft.description}
              multiline
              plain
              required
              onChange={(v) => setInfoDraft((d) => ({ ...d, description: v }))}
            />
            {complaint.sourceUrl && (
              <SectionTextField
                label="Lien de la source"
                value={infoDraft.sourceUrl}
                plain
                required
                onChange={(v) => setInfoDraft((d) => ({ ...d, sourceUrl: v }))}
                endAdornment={
                  <a href={toHref(infoDraft.sourceUrl)} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight />
                  </a>
                }
              />
            )}
            <SectionSelectField
              label="Interlocuteur en charge"
              value={traitementDraft.interlocuteur}
              options={INTERLOCUTEURS.map((label) => ({ id: label, label }))}
              onChange={(v) => setTraitementDraft((d) => ({ ...d, interlocuteur: v }))}
            />
            <SectionTextField
              label="Notes internes"
              multiline
              placeholder="Ajouter des informations supplémentaires..."
              value={notesDraft}
              onChange={setNotesDraft}
            />
            <SaveButton disabled={!infoDirty} onClick={saveInfo} />
          </AccordionSection>

          <AccordionSection
            icon={<UserIcon />}
            title="Informations du réclamant"
            badge={
              reclamantMissing > 0
                ? { label: `${reclamantMissing} manquante${reclamantMissing > 1 ? 's' : ''}`, className: 'chip-possible' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('reclamant')}
            onToggle={() => toggleSection('reclamant')}
            headline="Confirmez ou complétez les champs ci-dessous"
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Prénom"
                required
                placeholder="Entrez le prénom du réclamant"
                value={reclamantDraft.prenom}
                error={prenomMissing}
                errorText={prenomMissing ? 'Champ requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
              />
              <SectionTextField
                label="Nom"
                required
                placeholder="Entrez le nom du réclamant"
                value={reclamantDraft.nom}
                error={nomMissing}
                errorText={nomMissing ? 'Champ requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Email"
                required
                placeholder="Entrez une adresse email"
                value={reclamantDraft.email}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
              />
              <SectionTextField
                label="Téléphone (optionnel)"
                placeholder="Entrez le numéro de téléphone"
                value={reclamantDraft.telephone}
                error={contactMissing}
                errorText={contactMissing ? 'Un email ou un téléphone est requis' : undefined}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
              />
            </div>
            <SectionTextField
              label="Dénomination Sociale"
              value={denominateurSocialDraft}
              onChange={setDenominateurSocialDraft}
            />
            <SectionTextField
              label="Porteur du risque"
              placeholder="Entrez le nom du porteur du risque"
              value={porteurDuRisqueDraft}
              onChange={setPorteurDuRisqueDraft}
            />
            <SectionSelectField<Relation>
              label="Relation avec ce client"
              value={reclamantDraft.relation}
              options={(Object.keys(RELATION_LABEL) as Relation[]).map((id) => ({ id, label: RELATION_LABEL[id] }))}
              onChange={(v) => setReclamantDraft((d) => ({ ...d, relation: v }))}
            />
            {reclamantDraft.relation === 'autre' && (
              <SectionTextField
                label="Précision"
                required
                placeholder="Précisez la relation avec le réclamant"
                value={reclamantDraft.relationAutrePrecision ?? ''}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, relationAutrePrecision: v }))}
              />
            )}
            <SaveButton disabled={!reclamantDirty} onClick={saveReclamant} />
          </AccordionSection>

          <AccordionSection
            icon={<CalendarCheckIcon />}
            title="Suivi et clôture"
            badge={
              suiviMissing > 0
                ? { label: `${suiviMissing} à vérifier`, className: 'chip-declinee' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('suivi')}
            onToggle={() => toggleSection('suivi')}
            headline="Ces champs peuvent être complétés à tout moment pendant le traitement du dossier — ils ne bloquent pas la complétion du dossier."
          >
            <div className="dossier-field-row">
              <SectionTextField
                label="Date d'envoi de l'accusé de réception"
                value={suiviDraft.dateAR}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateAR: v }))}
              />
              <SectionTextField
                label="Date d'envoi de la réponse intermédiaire"
                value={suiviDraft.dateReponse}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateReponse: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Date de l'action immédiate"
                value={suiviDraft.actionImmediate}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
              />
              <SectionTextField
                label="Date de l'action corrective"
                value={suiviDraft.actionCorrective}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
              />
            </div>
            <SectionTextField
              label="Action réalisée"
              value={suiviDraft.actionRealisee}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, actionRealisee: v }))}
            />
            <SectionTextField
              label="Vérification d'efficacité"
              value={suiviDraft.verificationEfficacite}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, verificationEfficacite: v }))}
            />
            <SectionTextField
              label="Réponse apportée"
              value={suiviDraft.reponseApportee}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, reponseApportee: v }))}
            />
            <SaveButton disabled={!suiviDirty} onClick={saveSuivi} />
          </AccordionSection>

          <AccordionSection
            icon={<ClockIcon />}
            title="Historique des actions"
            open={openSections.has('historique')}
            onToggle={() => toggleSection('historique')}
          >
            <div className="dossier-history">
              {[...complaint.historique].reverse().map((entry, index) => (
                <div key={index} className="dossier-history-item">
                  <span className="dossier-history-dot" />
                  <div className="dossier-history-content">
                    <span className="dossier-history-title">{entry.title}</span>
                    <span className="dossier-history-description">{entry.description}</span>
                    <span className="dossier-history-meta">
                      {entry.date} · par {entry.author}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        {showNextStepBanner && currentStep && (
          <div className="dossier-next-step">
            {enAttente ? (
              <>
                <button type="button" className="btn-text" onClick={handleClasserSansSuite}>
                  Classer sans suite
                </button>
                <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmAR}>
                  Confirmer l'envoi de l'accusé de réception
                </button>
              </>
            ) : !arSent ? (
              <>
                <button type="button" className="btn-text" onClick={handleConfirmAR}>
                  Confirmer l'envoi de l'accusé de réception
                </button>
                <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmDemande}>
                  Confirmer la demande
                </button>
              </>
            ) : responseSent ? (
              <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleCloturer}>
                Clôturer
              </button>
            ) : (
              <button type="button" className="btn-filled dossier-next-step-cta" onClick={handleConfirmNextStep}>
                Confirmer l’envoi de la Réponse Définitive
              </button>
            )}
          </div>
        )}
      </div>

      {showUnsavedConfirm && (
        <div className="confirm-dialog-backdrop" onClick={() => setShowUnsavedConfirm(false)}>
          <div className="confirm-dialog-paper" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="confirm-dialog-close"
              aria-label="Annuler"
              onClick={() => setShowUnsavedConfirm(false)}
            >
              <img src={drawerClose} alt="" width={14} height={14} />
            </button>
            <p className="confirm-dialog-title">Informations non sauvegardées</p>
            <p className="confirm-dialog-body">
              Vous avez des modifications non sauvegardées dans ce dossier. Si vous fermez maintenant, elles seront
              perdues.
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  closeForReal();
                }}
              >
                Quitter sans sauvegarder
              </button>
              <button type="button" className="btn-filled" onClick={handleSaveAndClose}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
