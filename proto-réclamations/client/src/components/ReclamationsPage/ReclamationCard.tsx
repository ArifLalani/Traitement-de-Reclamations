import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import expandMore from '../../assets/figma/expand-more.svg';
import ArrowUpRight from './ArrowUpRight';
import SentimentIcon from './SentimentIcon';
import SourceIcon from './SourceIcon';
import type { Reclamation } from './data';

const STATE_BADGE: Partial<Record<Reclamation['state'], { label: string; className: string }>> = {
  possible: { label: 'Réclamation potentielle', className: 'chip-possible' },
  declinee: { label: 'Écartée', className: 'chip-declinee' },
  'mes-reclamations': { label: 'Réclamation ouverte', className: 'chip-mes-reclamations' },
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
  onDisqualify: () => void;
  onFollow: () => void;
};

export default function ReclamationCard({
  reclamation,
  isNew,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onCreate,
  onDisqualify,
  onFollow,
}: ReclamationCardProps) {
  const { state, source, date, url, author, text } = reclamation;
  const isDeclinee = state === 'declinee';
  const isMesReclamations = state === 'mes-reclamations';
  const isFlagged = state === 'possible';
  // Read/unread only affects the unread indicator (card-wrapper-unread) — it
  // never hides the create-complaint action, only an already-open or
  // already-declined mention has no "Créer une réclamation" action left.
  const canCreate = !isMesReclamations && !isDeclinee;

  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fromHeight = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight - el.clientHeight > 1);
  }, [text]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || fromHeight.current === null) return;
    const from = fromHeight.current;
    fromHeight.current = null;

    wrapper.style.transition = 'none';
    wrapper.style.height = 'auto';
    const to = wrapper.getBoundingClientRect().height;

    if (Math.abs(to - from) < 1) {
      wrapper.style.height = '';
      return;
    }

    wrapper.style.height = `${from}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.getBoundingClientRect();

    const raf = requestAnimationFrame(() => {
      wrapper.style.transition = 'height 0.3s ease';
      wrapper.style.height = `${to}px`;
    });

    const handleEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      wrapper.style.height = '';
      wrapper.style.overflow = '';
      wrapper.style.transition = '';
    };
    wrapper.addEventListener('transitionend', handleEnd);

    return () => {
      cancelAnimationFrame(raf);
      wrapper.removeEventListener('transitionend', handleEnd);
    };
  }, [expanded]);

  const toggleExpanded = () => {
    const wrapper = wrapperRef.current;
    if (wrapper) fromHeight.current = wrapper.getBoundingClientRect().height;
    setExpanded((value) => !value);
  };

  const badge = STATE_BADGE[state];
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
        className={`card card-selectable ${selected ? 'card-selected' : ''}`}
        onClick={onToggleSelect}
      >
        <div className="card-info">
          <div className="card-top">
            <div className="card-source-row">
              <SourceIcon source={source} />
              <span className="card-source-name">{source}</span>
              <span className="card-dot">·</span>
              <span className="card-date">{date}</span>
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
            <div className="card-text-wrapper" ref={wrapperRef}>
              <p ref={textRef} className={`card-text ${expanded ? '' : 'card-text-clamped'}`}>
                {text}
              </p>
            </div>
            {overflowing && (
              <button
                type="button"
                className="btn-link"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
              >
                {expanded ? 'Voir moins' : 'Voir plus'}
                <img
                  src={expandMore}
                  alt=""
                  width={12}
                  height={7.4}
                  className={expanded ? 'btn-link-icon btn-link-icon-flipped' : 'btn-link-icon'}
                />
              </button>
            )}
          </div>
        </div>

        <div className="card-divider" />

        <div className="card-cta">
          {badge && (
            <span className={`chip cta-badge ${badge.className}`}>
              {isFlagged && <FlagIcon />}
              {badge.label}
            </span>
          )}
          {hasActions && (
            <div className="card-actions">
              {isMesReclamations ? (
                <button
                  type="button"
                  className="btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow();
                  }}
                >
                  Voir la réclamation
                </button>
              ) : isDeclinee ? (
                <button
                  type="button"
                  className="btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreate();
                  }}
                >
                  Traiter cette réclamation
                </button>
              ) : (
                <>
                  {isFlagged && (
                    <button
                      type="button"
                      className="btn-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDisqualify();
                      }}
                    >
                      Écarter
                    </button>
                  )}
                  {canCreate && (
                    <button
                      type="button"
                      className={isFlagged ? 'btn-filled' : 'btn-text'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreate();
                      }}
                    >
                      Traiter cette réclamation
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
