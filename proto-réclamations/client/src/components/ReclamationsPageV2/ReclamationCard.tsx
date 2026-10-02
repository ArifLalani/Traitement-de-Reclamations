import { useState, type MouseEvent } from 'react';
import ArrowUpRight from './ArrowUpRight';
import HoverTooltip from './HoverTooltip';
import SentimentIcon from './SentimentIcon';
import SourceIcon from './SourceIcon';
import type { Reclamation } from './data';

const STATE_BADGE: Partial<Record<Reclamation['state'], { label: string; className: string }>> = {
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
  'en-attente': { label: 'En attente', className: 'chip-en-attente' },
  cloturee: { label: 'Clôturée', className: 'chip-cloturee' },
};

const BADGE_TOOLTIP: Partial<Record<Reclamation['state'], string>> = {
  'mes-reclamations': 'Une réclamation liée à cette mention a déjà été ouverte.',
  'en-attente': "Une demande de coordonnées a été envoyée à l'auteur du commentaire, en attente de sa réponse.",
  cloturee: "La demande n'a pas pu être traitée directement ; une demande a été transmise à l'hébergeur du site.",
};

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
  // Whether the author turned out to be a prospect ("non" to "rattaché à un
  // contrat") or a client (rattaché + statut précisé) — unknown until that
  // question's been answered, hence optional.
  contactTag?: 'Prospect' | 'Client' | null;
};

export default function ReclamationCard({
  reclamation,
  isNew,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onCreate,
  contactTag,
}: ReclamationCardProps) {
  const { ticket, state, source, date, url, author, text } = reclamation;

  const [badgeTooltipOpen, setBadgeTooltipOpen] = useState(false);

  const badge = STATE_BADGE[state];
  const badgeTooltipText = BADGE_TOOLTIP[state];

  const handleLinkClick = (e: MouseEvent) => {
    if (!selectionMode) return;
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.();
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
                <span className={`chip cta-badge ${badge.className}`}>{badge.label}</span>
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
            {contactTag && <span className="chip chip-neutral">{contactTag}</span>}
          </div>
          <div className="card-text-wrapper">
            <p className="card-text card-text-clamped">{text}</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}
