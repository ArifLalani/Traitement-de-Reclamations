import { useState, type MouseEvent } from 'react';
import ArrowUpRight from './ArrowUpRight';
import HoverTooltip from './HoverTooltip';
import SentimentIcon from './SentimentIcon';
import SourceIcon from './SourceIcon';
import type { Reclamation } from './data';
import { MENTION_BADGES, getMentionBadgeVariant } from './mentionBadge';
import MentionBadgeLabel from './MentionBadgeLabel';

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

type ReclamationCardProps = {
  reclamation: Reclamation;
  isNew: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onCreate: () => void;
  // Status of the réclamation created from this mention, if any. When set,
  // the card shows no action buttons: the réclamation is reached from its
  // badge.
  complaintStatus?: 'ouverte' | 'cloturee' | null;
  onOpenComplaintsPage?: () => void;
  // Whether the author turned out to be a prospect ("non" to "rattaché à un
  // contrat") or a client (rattaché + statut précisé) — unknown until that
  // question's been answered, hence optional. Shown through the badge
  // ("Réclamation client/prospect ouverte"), not as a separate chip.
  contactTag?: 'Prospect' | 'Client' | null;
};

export default function ReclamationCard({
  reclamation,
  isNew,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onCreate,
  complaintStatus = null,
  onOpenComplaintsPage,
  contactTag,
}: ReclamationCardProps) {
  const { ticket, state, source, date, url, author, text } = reclamation;

  const [badgeTooltipOpen, setBadgeTooltipOpen] = useState(false);

  // The badge always agrees with the complaint note below: a closed
  // réclamation reads "Clôturée", an open one "Réclamation client/prospect
  // ouverte" depending on its type.
  const badgeState: Reclamation['state'] =
    complaintStatus === 'cloturee' ? 'cloturee' : complaintStatus === 'ouverte' ? 'mes-reclamations' : state;
  const badgeVariant = getMentionBadgeVariant(badgeState, contactTag);
  const badge = badgeVariant ? MENTION_BADGES[badgeVariant] : null;
  // Once a réclamation exists (open or closed), the badge is itself the way
  // in: it carries a chevron and opens the réclamation's panel, its tooltip
  // saying what happened (no separate note on the card).
  const badgeOpensComplaint = complaintStatus !== null;
  const badgeTooltipText =
    complaintStatus === 'cloturee'
      ? 'La réclamation ouverte à partir de cette mention est clôturée. Cliquez pour la consulter.'
      : complaintStatus === 'ouverte'
        ? 'Une réclamation a été ouverte à partir de cette mention. Cliquez pour lire la suite de son traitement.'
        : badge?.tooltip;

  const handleLinkClick = (e: MouseEvent) => {
    if (!selectionMode) return;
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
  };

  // In selection mode, a click anywhere on the card (link included) toggles
  // selection — same as the mention URL link above.
  const handleComplaintsLinkClick = (e: MouseEvent) => {
    if (selectionMode) return;
    e.stopPropagation();
    onOpenComplaintsPage?.();
  };

  return (
    <div className={`card-wrapper ${isNew ? 'card-wrapper-unread' : ''}`}>
      <div
        className={`card card-mention card-selectable ${selected ? 'card-selected' : ''}`}
        onClick={onToggleSelect}
      >
        <div className="card-top">
          <div className="card-source-row">
            <HoverTooltip text="Numéro de référence de la mention" align="left">
              <span className="chip complaint-ticket-chip">{ticket}</span>
            </HoverTooltip>
            <SourceIcon source={source} />
            <span className="card-source-name">{source}</span>
            <span className="card-dot">·</span>
            <span className="card-date">{date}</span>
            {badge && (
              <span
                className="cta-badge-wrap"
                onMouseEnter={() => badgeTooltipText && setBadgeTooltipOpen(true)}
                onMouseLeave={() => setBadgeTooltipOpen(false)}
              >
                {badgeOpensComplaint ? (
                  <button
                    type="button"
                    className={`chip cta-badge cta-badge-link ${badge.className}`}
                    onClick={handleComplaintsLinkClick}
                  >
                    <span>{badgeVariant && <MentionBadgeLabel variant={badgeVariant} />}</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                ) : (
                  <span className={`chip cta-badge ${badge.className}`}>
                    {badgeVariant && <MentionBadgeLabel variant={badgeVariant} />}
                  </span>
                )}
                {badgeTooltipText && badgeTooltipOpen && (
                  <span className="cta-badge-tooltip">{badgeTooltipText}</span>
                )}
              </span>
            )}
          </div>
          <a className="card-url-row" href={toHref(url)} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            <span className="card-url">{url}</span>
            <ArrowUpRight />
          </a>
        </div>

        <div className="card-body">
          <div className="card-author-row">
            <SentimentIcon text={text} />
            <span className="card-author">{author}</span>
          </div>
          <div className="card-text-wrapper">
            <p className="card-text card-text-clamped">{text}</p>
          </div>
        </div>

        {!complaintStatus && (
          <div className="card-footer">
            <div className="card-actions">
              <button
                type="button"
                className="btn-text"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate();
                }}
              >
                Voir les détails
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
