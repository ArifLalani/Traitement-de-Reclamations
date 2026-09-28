import { useLayoutEffect, useRef, useState } from 'react';
import expandMore from '../../assets/figma/expand-more.svg';
import ArrowUpRight from './ArrowUpRight';
import HoverTooltip from './HoverTooltip';
import {
  AVANCEMENT_LABEL,
  AVANCEMENT_TOOLTIP,
  CONFORMITE_LABEL,
  getConformiteTooltip,
  getContactTag,
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
    conformite,
    echeanceLabel,
    echeanceWarning,
    reclamant,
  } = complaint;
  const contactTag = getContactTag(reclamant.rattacheContrat, reclamant.statutClient);

  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fromHeight = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight - el.clientHeight > 1);
  }, [description]);

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

  const isClosed = echeanceLabel === '';

  return (
    <div className="card-wrapper">
      <div
        className={`card card-selectable ${selected ? 'card-selected' : ''}`}
        onClick={onToggleSelect}
      >
        <div className="card-info">
          <div className="card-top">
            <div className="card-source-row">
              <span className="chip complaint-ticket-chip">{ticket}</span>
              <span className="card-source-name">{objet}</span>
              <span className="card-dot">·</span>
              <span className="card-date">{dateReception}</span>
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
              <span className="card-author">{requerant}</span>
              {contactTag && <span className="chip chip-neutral">{contactTag}</span>}
            </div>
            <div className="card-text-wrapper" ref={wrapperRef}>
              <p ref={textRef} className={`card-text ${expanded ? '' : 'card-text-clamped'}`}>
                {description}
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

        <div className="complaint-cta">
          <div className="complaint-cta-status">
            <div className="complaint-cta-row">
              <span className="complaint-cta-label">Statut de progression</span>
              <HoverTooltip text={AVANCEMENT_TOOLTIP[avancement]} align="right">
                <span className={`chip complaints-chip-avancement-${avancement}`}>{AVANCEMENT_LABEL[avancement]}</span>
              </HoverTooltip>
            </div>
            {contactTag !== 'Prospect' && (
              <div className="complaint-cta-row">
                <span className="complaint-cta-label">Statut de conformité</span>
                <HoverTooltip text={getConformiteTooltip(complaint)} align="right">
                  <span className={`chip complaints-chip-conformite-${conformite}`}>{CONFORMITE_LABEL[conformite]}</span>
                </HoverTooltip>
              </div>
            )}
            <div className="complaint-cta-row">
              <span className="complaint-cta-label">Échéance</span>
              <span
                className={`complaint-echeance ${isClosed ? 'complaint-echeance-closed' : ''} ${echeanceWarning ? 'complaint-echeance-warning' : ''}`}
              >
                {echeanceLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-text complaint-cta-cta"
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
  );
}
