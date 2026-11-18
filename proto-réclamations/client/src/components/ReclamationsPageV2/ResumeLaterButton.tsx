import HoverTooltip from './HoverTooltip';

const RESUME_LATER_HELP =
  'Vous pouvez quitter à tout moment : retrouvez cette réclamation et poursuivez son traitement quand vous le souhaitez dans la page « Mes réclamations ».';

// Footer action of an open réclamation's panel: closes the panel so the
// treatment can be picked up later. The info icon next to it explains, on
// hover, that leaving is safe and where to find the réclamation again.
export default function ResumeLaterButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="resume-later">
      <button type="button" className="btn-text" onClick={onClick}>
        Reprendre plus tard
      </button>
      <HoverTooltip text={RESUME_LATER_HELP} align="left" className="resume-later-info">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-label={RESUME_LATER_HELP} role="img">
          <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8" />
        </svg>
      </HoverTooltip>
    </div>
  );
}
