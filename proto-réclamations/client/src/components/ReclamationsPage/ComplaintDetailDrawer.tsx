import { useEffect, useRef, useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import ArrowUpRight from './ArrowUpRight';
import ExportMenu, { type ExportPreferences } from './ExportMenu';
import { exportComplaintsToCsv, exportComplaintsToPdf } from './exportComplaints';
import {
  AVANCEMENT_LABEL,
  getDossierSteps,
  INTERLOCUTEURS,
  PRIORITE_LABEL,
  RELATION_LABEL,
  TYPES_SINISTRE,
  type Classification,
  type Complaint,
  type Priorite,
  type Reclamant,
  type Relation,
  type SuiviCloture,
  type Traitement,
} from './complaintsData';

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

function ChartLineUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 20h18M4 16l5-5 4 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
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

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M11.5 3H5a1 1 0 0 0-1 1v6.5a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3Z" strokeLinejoin="round" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2M3 12.5h18" strokeLinecap="round" />
    </svg>
  );
}

function NotepadIcon() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="4" width="16" height="17" rx="1.5" />
      <path d="M8 2.5v3M12 2.5v3M16 2.5v3M8 12h8M8 16h5" strokeLinecap="round" />
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
  onChange,
  endAdornment,
}: TextFieldProps) {
  return (
    <div className="dossier-field">
      <span className="dossier-field-label">
        {label} {required && <span className="dossier-field-required">*</span>}
      </span>
      <div className="dossier-field-input">
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

type SectionKey =
  | 'avancement'
  | 'informations'
  | 'reclamant'
  | 'classification'
  | 'traitement'
  | 'suivi'
  | 'notes'
  | 'historique';

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

  // --- Informations de la réclamation ---
  const [infoDraft, setInfoDraft] = useState({
    denominateurSocial: complaint.denominateurSocial,
    objet: complaint.objet,
    description: complaint.description,
  });
  const infoDirty =
    infoDraft.denominateurSocial !== complaint.denominateurSocial ||
    infoDraft.objet !== complaint.objet ||
    infoDraft.description !== complaint.description;
  const saveInfo = () => {
    onUpdate?.(complaint.id, infoDraft);
  };

  // --- Informations du réclamant ---
  const [reclamantDraft, setReclamantDraft] = useState<Reclamant>(complaint.reclamant);
  const reclamantDirty = JSON.stringify(reclamantDraft) !== JSON.stringify(complaint.reclamant);
  const saveReclamant = () => onUpdate?.(complaint.id, { reclamant: reclamantDraft });
  const reclamantMissing = [reclamantDraft.prenom, reclamantDraft.nom, reclamantDraft.email, reclamantDraft.relation].filter(
    (v) => !v,
  ).length;

  // --- Classification ---
  const [classificationDraft, setClassificationDraft] = useState<Classification>(complaint.classification);
  const classificationDirty = JSON.stringify(classificationDraft) !== JSON.stringify(complaint.classification);
  const saveClassification = () => onUpdate?.(complaint.id, { classification: classificationDraft });
  const classificationMissing = [classificationDraft.porteurDuRisque, classificationDraft.typeSinistre].filter(
    (v) => !v,
  ).length;

  // --- Traitement / attribution ---
  const [traitementDraft, setTraitementDraft] = useState<Traitement>(complaint.traitement);
  const traitementDirty = JSON.stringify(traitementDraft) !== JSON.stringify(complaint.traitement);
  const saveTraitement = () => onUpdate?.(complaint.id, { traitement: traitementDraft });
  const traitementMissing = [traitementDraft.statut, traitementDraft.interlocuteur, traitementDraft.priorite].filter(
    (v) => !v,
  ).length;

  // --- Suivi et clôture ---
  const [suiviDraft, setSuiviDraft] = useState<SuiviCloture>(complaint.suiviCloture);
  const suiviDirty = JSON.stringify(suiviDraft) !== JSON.stringify(complaint.suiviCloture);
  const saveSuivi = () => onUpdate?.(complaint.id, { suiviCloture: suiviDraft });
  const suiviMissing = Object.values(suiviDraft).filter((v) => !v).length;

  // --- Notes internes ---
  const [notesDraft, setNotesDraft] = useState(complaint.notesInternes);
  const notesDirty = notesDraft !== complaint.notesInternes;
  const saveNotes = () => onUpdate?.(complaint.id, { notesInternes: notesDraft });

  const hasUnsavedChanges =
    infoDirty || reclamantDirty || classificationDirty || traitementDirty || suiviDirty || notesDirty;

  const steps = getDossierSteps(complaint);
  const completedCount = steps.filter((s) => s.status === 'done').length;
  const currentStep = steps.find((s) => s.status === 'current');

  const handleConfirmNextStep = () => {
    if (complaint.avancement === 'a-traiter') {
      onUpdate?.(complaint.id, { avancement: 'en-cours' });
    } else if (complaint.avancement === 'en-cours' || complaint.avancement === 'en-attente') {
      onUpdate?.(complaint.id, { avancement: 'cloture' });
    }
  };

  // Gated on the saved complaint, not the in-progress draft — the CTA must
  // only unlock once the required réclamant info has actually been saved.
  const savedReclamantMissing = [
    complaint.reclamant.prenom,
    complaint.reclamant.nom,
    complaint.reclamant.email,
    complaint.reclamant.relation,
  ].filter((v) => !v).length;
  const nextStepBlocked = complaint.avancement === 'a-traiter' && savedReclamantMissing > 0;

  const showNextStepBanner = complaint.avancement !== 'cloture' && complaint.avancement !== 'sans-suite';

  return (
    <div className={`drawer-backdrop ${closing ? 'drawer-closing' : ''}`} onClick={performClose}>
      <div
        className="drawer-panel dossier-panel"
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => setHeaderStuck(e.currentTarget.scrollTop > 4)}
      >
        <div className={`dossier-header ${headerStuck ? 'dossier-header-stuck' : ''}`}>
          <span className="dossier-title">Dossier {complaint.ticket}</span>
          <span className="chip dossier-status-chip">{AVANCEMENT_LABEL[complaint.avancement]}</span>
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
          <AccordionSection
            icon={<ChartLineUpIcon />}
            title="Avancement du dossier"
            meta={`${completedCount}/${steps.length} étapes complétées`}
            open={openSections.has('avancement')}
            onToggle={() => toggleSection('avancement')}
          >
            <div className="dossier-progress-bar">
              <div className="dossier-progress-fill" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
            </div>
            <div className="dossier-steps">
              {steps.map((step) => (
                <div key={step.label} className={`dossier-step dossier-step-${step.status}`}>
                  <span className="dossier-step-icon" aria-hidden>
                    {step.status === 'done' ? '●' : step.status === 'current' ? '◉' : '○'}
                  </span>
                  <span className="dossier-step-label">{step.label}</span>
                  {step.badgeLabel && (
                    <span
                      className={`chip ${
                        step.status === 'done'
                          ? 'chip-mes-reclamations'
                          : step.badgeWarning
                            ? 'chip-declinee'
                            : 'chip-possible'
                      }`}
                    >
                      {step.badgeLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection
            icon={<FileTextIcon />}
            title="Informations de la réclamation"
            badge={{ label: 'Complété', className: 'chip-mes-reclamations' }}
            open={openSections.has('informations')}
            onToggle={() => toggleSection('informations')}
            headline="Confirmez ou complétez les champs ci-dessous"
          >
            <div className="dossier-field-row">
              <SectionTextField label="Référence" value={complaint.ticket} readOnly />
              <SectionTextField label="Canal de réception" value={complaint.canal} readOnly />
            </div>
            <div className="dossier-field-row">
              <SectionTextField label="Date de réception" value={complaint.dateReception} readOnly />
              <SectionTextField
                label="Dénomination Sociale"
                value={infoDraft.denominateurSocial}
                onChange={(v) => setInfoDraft((d) => ({ ...d, denominateurSocial: v }))}
              />
            </div>
            <SectionTextField
              label="Objet / Motif"
              value={infoDraft.objet}
              onChange={(v) => setInfoDraft((d) => ({ ...d, objet: v }))}
            />
            <SectionTextField
              label="Description"
              value={infoDraft.description}
              multiline
              onChange={(v) => setInfoDraft((d) => ({ ...d, description: v }))}
            />
            {complaint.sourceUrl && (
              <SectionTextField
                label="Lien/Source"
                value={complaint.sourceUrl}
                readOnly
                endAdornment={
                  <a href={toHref(complaint.sourceUrl)} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight />
                  </a>
                }
              />
            )}
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
                onChange={(v) => setReclamantDraft((d) => ({ ...d, prenom: v }))}
              />
              <SectionTextField
                label="Nom"
                required
                placeholder="Entrez le nom du réclamant"
                value={reclamantDraft.nom}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, nom: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Email"
                required
                placeholder="Entrez une adresse courrielle"
                value={reclamantDraft.email}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, email: v }))}
              />
              <SectionTextField
                label="Téléphone (optionnel)"
                placeholder="Entrez le numéro de téléphone"
                value={reclamantDraft.telephone}
                onChange={(v) => setReclamantDraft((d) => ({ ...d, telephone: v }))}
              />
            </div>
            <SectionTextField
              label="Adresse (optionnel)"
              placeholder="Entrez l'adresse du réclamant"
              value={reclamantDraft.adresse}
              onChange={(v) => setReclamantDraft((d) => ({ ...d, adresse: v }))}
            />
            <SectionSelectField<Relation>
              label="Relation client/réclamant"
              required
              value={reclamantDraft.relation}
              options={(Object.keys(RELATION_LABEL) as Relation[]).map((id) => ({ id, label: RELATION_LABEL[id] }))}
              onChange={(v) => setReclamantDraft((d) => ({ ...d, relation: v }))}
            />
            <SaveButton disabled={!reclamantDirty} onClick={saveReclamant} />
          </AccordionSection>

          <AccordionSection
            icon={<TagIcon />}
            title="Classification de la réclamation"
            badge={
              classificationMissing > 0
                ? { label: `${classificationMissing} à vérifier`, className: 'chip-declinee' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('classification')}
            onToggle={() => toggleSection('classification')}
            headline="Confirmez ou complétez les champs ci-dessous"
          >
            <SectionTextField
              label="Porteur du risque"
              placeholder="Entrez le nom du porteur du risque"
              value={classificationDraft.porteurDuRisque}
              onChange={(v) => setClassificationDraft((d) => ({ ...d, porteurDuRisque: v }))}
            />
            <SectionSelectField
              label="Type de sinistre"
              value={classificationDraft.typeSinistre}
              options={TYPES_SINISTRE.map((label) => ({ id: label, label }))}
              onChange={(v) => setClassificationDraft((d) => ({ ...d, typeSinistre: v }))}
            />
            <SaveButton disabled={!classificationDirty} onClick={saveClassification} />
          </AccordionSection>

          <AccordionSection
            icon={<BriefcaseIcon />}
            title="Traitement / attribution"
            badge={
              traitementMissing > 0
                ? { label: `${traitementMissing} à vérifier`, className: 'chip-declinee' }
                : { label: 'Complété', className: 'chip-mes-reclamations' }
            }
            open={openSections.has('traitement')}
            onToggle={() => toggleSection('traitement')}
            headline="Dernière étape avant la prise en charge"
          >
            <SectionTextField label="Statut" value={traitementDraft.statut} readOnly />
            <SectionSelectField
              label="Interlocuteur en charge"
              value={traitementDraft.interlocuteur}
              options={INTERLOCUTEURS.map((label) => ({ id: label, label }))}
              onChange={(v) => setTraitementDraft((d) => ({ ...d, interlocuteur: v }))}
            />
            <SectionSelectField<Priorite>
              label="Priorité"
              value={traitementDraft.priorite}
              options={(Object.keys(PRIORITE_LABEL) as Priorite[]).map((id) => ({ id, label: PRIORITE_LABEL[id] }))}
              onChange={(v) => setTraitementDraft((d) => ({ ...d, priorite: v }))}
            />
            <SaveButton disabled={!traitementDirty} onClick={saveTraitement} />
          </AccordionSection>

          <AccordionSection
            icon={<CalendarCheckIcon />}
            title="Suivi et Clôture"
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
                label="Date d'AR / réponse intermédiaire"
                value={suiviDraft.dateAR}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateAR: v }))}
              />
              <SectionTextField
                label="Date de réponse"
                value={suiviDraft.dateReponse}
                placeholder="Ex: 05/05/2026"
                onChange={(v) => setSuiviDraft((d) => ({ ...d, dateReponse: v }))}
              />
            </div>
            <div className="dossier-field-row">
              <SectionTextField
                label="Action immédiate"
                value={suiviDraft.actionImmediate}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionImmediate: v }))}
              />
              <SectionTextField
                label="Action corrective"
                value={suiviDraft.actionCorrective}
                onChange={(v) => setSuiviDraft((d) => ({ ...d, actionCorrective: v }))}
              />
            </div>
            <div className="dossier-field-row">
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
            </div>
            <SectionTextField
              label="Réponse apportée"
              value={suiviDraft.reponseApportee}
              onChange={(v) => setSuiviDraft((d) => ({ ...d, reponseApportee: v }))}
            />
            <SaveButton disabled={!suiviDirty} onClick={saveSuivi} />
          </AccordionSection>

          <AccordionSection
            icon={<NotepadIcon />}
            title="Notes Internes"
            open={openSections.has('notes')}
            onToggle={() => toggleSection('notes')}
          >
            <SectionTextField
              label=""
              multiline
              placeholder="Ajouter des informations supplémentaires..."
              value={notesDraft}
              onChange={setNotesDraft}
            />
            <SaveButton disabled={!notesDirty} onClick={saveNotes} />
          </AccordionSection>

          <AccordionSection
            icon={<ClockIcon />}
            title="Historique des actions"
            open={openSections.has('historique')}
            onToggle={() => toggleSection('historique')}
          >
            <div className="dossier-history">
              {complaint.historique.map((entry, index) => (
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
            <p className="dossier-next-step-title">Prochaine étape</p>
            <p className="dossier-next-step-text">
              {complaint.avancement === 'a-traiter'
                ? "Renseignez le nom et un contact valide (email ou téléphone) du requérant dans la section Informations pour pouvoir confirmer l'envoi de l'accusé de réception."
                : 'Confirmez l’envoi de la réponse définitive pour clôturer ce dossier.'}
            </p>
            <button
              type="button"
              className="btn-filled dossier-next-step-cta"
              disabled={nextStepBlocked}
              onClick={handleConfirmNextStep}
            >
              {complaint.avancement === 'a-traiter'
                ? "Confirmer l'envoi de l'Accusé de Réception"
                : 'Confirmer l’envoi de la Réponse Définitive'}
            </button>
          </div>
        )}
      </div>

      {showUnsavedConfirm && (
        <div className="confirm-dialog-backdrop" onClick={() => setShowUnsavedConfirm(false)}>
          <div className="confirm-dialog-paper" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-dialog-title">Informations non sauvegardées</p>
            <p className="confirm-dialog-body">
              Vous avez des modifications non sauvegardées dans ce dossier. Si vous fermez maintenant, elles seront
              perdues.
            </p>
            <div className="confirm-dialog-actions">
              <button type="button" className="btn-text" onClick={() => setShowUnsavedConfirm(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-filled"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  closeForReal();
                }}
              >
                Fermer sans sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
