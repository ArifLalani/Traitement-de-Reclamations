import ArrowUpRight from './ArrowUpRight';
import HoverTooltip from './HoverTooltip';
import {
  AVANCEMENT_LABEL,
  CONFORMITE_LABEL,
  getContactTag,
  getEcheanceInfo,
  type Complaint,
} from './complaintsData';

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

type ComplaintCardProps = {
  complaint: Complaint;
  onOpen: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

export default function ComplaintCard({
  complaint,
  onOpen,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: ComplaintCardProps) {
  const {
    ticket,
    objet,
    dateReception,
    sourceUrl,
    requerant,
    description,
    avancement,
    reclamant,
  } = complaint;
  const contactTag = getContactTag(reclamant.rattacheContrat);
  const { conformite, echeanceLabel, echeanceWarning } = getEcheanceInfo(complaint);
  // "À traiter" only really means something once the author is identified
  // and the AR/RD process actually applies — while contactTag is still
  // unknown (canal plateforme, "Non identifiés"), the dossier is really
  // just waiting on a reply, not "being processed". avancement itself stays
  // 'a-traiter' (so the progression filter etc. keep working normally);
  // only this card's own label reads "En attente" instead.
  const isAwaitingIdentification = contactTag === null && avancement === 'a-traiter';
  const progressionLabel = isAwaitingIdentification ? 'En attente' : AVANCEMENT_LABEL[avancement];
  const progressionClassName = isAwaitingIdentification
    ? 'chip-en-attente'
    : `complaints-chip-avancement-${avancement}`;
  // The réclamant's real identity (set on the dossier's own Informations tab)
  // is what the card should show — not the mention's author handle, which
  // can be a pseudo rather than a name.
  const reclamantName = `${reclamant.prenom} ${reclamant.nom}`.trim() || requerant;

  return (
    <div className="card-wrapper">
      <div
        className={`card card-selectable ${selected ? 'card-selected' : ''}`}
        onClick={onToggleSelect}
      >
        <div className="card-info">
          <div className="card-top">
            <div className="card-top-header">
              <div className="card-source-row">
                <HoverTooltip text="Numéro de référence de la réclamation" align="left">
                  <span className="chip complaint-ticket-chip">{ticket}</span>
                </HoverTooltip>
                <span className="card-source-name">{objet}</span>
                <span className="card-dot">·</span>
                <span className="card-date">{dateReception}</span>
              </div>
              <div className="card-top-chips">
                {echeanceLabel && (
                  <span
                    className={`complaint-echeance-chip ${echeanceWarning ? 'complaint-echeance-chip-warning' : ''}`}
                  >
                    {echeanceLabel}
                  </span>
                )}
                {contactTag === 'Client' && (
                  <HoverTooltip text="Statut de conformité" align="right">
                    <span className={`chip complaints-chip-conformite-${conformite}`}>
                      {CONFORMITE_LABEL[conformite]}
                    </span>
                  </HoverTooltip>
                )}
                <HoverTooltip text="Statut de progression" align="right">
                  <span className={`chip ${progressionClassName}`}>{progressionLabel}</span>
                </HoverTooltip>
              </div>
            </div>
            {sourceUrl && (
              <a
                className="card-url-row"
                href={toHref(sourceUrl)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!selectionMode) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
              >
                <span className="card-url">{sourceUrl}</span>
                <ArrowUpRight />
              </a>
            )}
          </div>

          <div className="card-body">
            <div className="card-author-row">
              <span className="card-author">{reclamantName}</span>
            </div>
            <div className="card-text-wrapper">
              <p className="card-text card-text-clamped">{description}</p>
            </div>
          </div>

          <div className="card-footer">
            <button
              type="button"
              className="btn-text"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              Voir le dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
