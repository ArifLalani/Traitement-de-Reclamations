import { useState, type MouseEvent } from 'react';
import ArrowUpRight from './ArrowUpRight';
import SentimentIcon from './SentimentIcon';
import SourceIcon from './SourceIcon';
import type { Reclamation } from './data';

const STATE_BADGE: Partial<Record<Reclamation['state'], { label: string; className: string }>> = {
  possible: { label: 'Réclamation potentielle', className: 'chip-possible' },
  declinee: { label: 'Écartée', className: 'chip-declinee' },
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
  'en-attente': { label: 'En attente', className: 'chip-en-attente' },
  'classee-sans-suite': { label: 'Classée sans suite', className: 'chip-classee-sans-suite' },
};

const BADGE_TOOLTIP: Partial<Record<Reclamation['state'], string>> = {
  possible: 'Détectée automatiquement par notre IA comme une réclamation potentielle, à confirmer avant traitement.',
  'mes-reclamations': 'Une réclamation liée à cette mention a déjà été ouverte.',
  'en-attente': "Une demande de coordonnées a été envoyée à l'auteur de la mention, en attente de sa réponse.",
  'classee-sans-suite': "Classée sans suite faute de retour de l'auteur de la mention dans le délai imparti.",
};

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 17V3.5c0-.3.2-.5.5-.5H15l-2.5 4L15 11H4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const { state, source, date, url, author, text } = reclamation;
  const isDeclinee = state === 'declinee';
  const isMesReclamations = state === 'mes-reclamations';
  const isFlagged = state === 'possible';
  // Read/unread only affects the unread indicator (card-wrapper-unread) — it
  // never hides the create-complaint action, only an already-open or
  // already-declined mention has no "Créer une réclamation" action left.
  const canCreate = !isMesReclamations && !isDeclinee;

  const [badgeTooltipOpen, setBadgeTooltipOpen] = useState(false);

  const badge = STATE_BADGE[state];
  const badgeTooltipText = BADGE_TOOLTIP[state];
  const hasActions = isMesReclamations || isDeclinee || isFlagged || canCreate;

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
                <span className={`chip cta-badge ${badge.className}`}>
                  {isFlagged && <FlagIcon />}
                  {badge.label}
                </span>
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
          {hasActions && (
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
          )}
        </div>
      </div>
    </div>
  );
}
