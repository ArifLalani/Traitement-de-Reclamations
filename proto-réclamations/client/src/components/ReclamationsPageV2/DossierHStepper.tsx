import type { DossierStep } from './complaintsData';

const DOSSIER_STEP_SHORT_LABELS = [
  'Réception de la mention',
  'Création de la réclamation',
  'Accusé de réception',
  'Réponse définitive',
  'Analyse de la cause',
];

// The complaint's 5-step progress bar, at the top of every complaint panel's
// Traitement tab — ComplaintDetailDrawer (Réclamations clients / prospects)
// and CreateReclamationSlider's réclamation view (Auteurs à identifier).
export default function DossierHStepper({ steps }: { steps: DossierStep[] }) {
  const completedCount = steps.filter((s) => s.status === 'done').length;
  const fillFraction = Math.min(completedCount, steps.length - 1) / (steps.length - 1);

  return (
    <div className="dossier-hstepper">
      <span className="dossier-hstepper-line" />
      <span
        className="dossier-hstepper-line-fill"
        style={{ width: `calc(${fillFraction} * (100% - 88px))` }}
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
