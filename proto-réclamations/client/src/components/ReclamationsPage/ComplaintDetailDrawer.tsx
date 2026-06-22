import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import editPencil from '../../assets/figma/edit-pencil.svg';
import caretRight from '../../assets/figma/caret-right.svg';
import expandMore from '../../assets/figma/expand-more.svg';
import ArrowUpRight from './ArrowUpRight';
import SourceIcon from './SourceIcon';
import { AVANCEMENT_LABEL, CONFORMITE_LABEL, type Complaint } from './complaintsData';

const CLOSE_ANIMATION_DURATION = 200;

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div className="drawer-field">
      <span className="drawer-field-label">{label}</span>
      <div className="drawer-field-value">{children}</div>
    </div>
  );
}

function DescriptionField({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight - el.clientHeight > 1);
  }, [text]);

  return (
    <div className="drawer-field">
      <span className="drawer-field-label">Description</span>
      <p ref={textRef} className={`drawer-field-value ${expanded ? '' : 'drawer-description-clamped'}`}>
        {text}
      </p>
      {overflowing && (
        <button type="button" className="btn-link" onClick={() => setExpanded((v) => !v)}>
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
  );
}

type ComplaintDetailDrawerProps = {
  complaint: Complaint;
  onClose: () => void;
};

export default function ComplaintDetailDrawer({ complaint, onClose }: ComplaintDetailDrawerProps) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_DURATION);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`drawer-backdrop ${closing ? 'drawer-closing' : ''}`} onClick={handleClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-appbar">
          <span className="drawer-title">Réclamation {complaint.ticket}</span>
          <button type="button" className="drawer-close-button" aria-label="Fermer" onClick={handleClose}>
            <img src={drawerClose} alt="" width={14} height={14} />
          </button>
        </div>

        <div className="drawer-content">
          <section className="drawer-section">
            <h3 className="drawer-section-title">Statut du dossier</h3>
            <div className="drawer-row">
              <Field label="État d'avancement">
                <span className={`chip complaints-chip-avancement-${complaint.avancement}`}>
                  {AVANCEMENT_LABEL[complaint.avancement]}
                </span>
              </Field>
              <Field label="Statut de conformité">
                <span className={`chip complaints-chip-conformite-${complaint.conformite}`}>
                  {CONFORMITE_LABEL[complaint.conformite]}
                </span>
              </Field>
            </div>
            <Field label="N° du ticket">
              <span className="drawer-text">{complaint.ticket}</span>
            </Field>
          </section>

          <section className="drawer-section">
            <div className="drawer-section-title-row">
              <h3 className="drawer-section-title">Réclamation</h3>
              <button type="button" className="drawer-edit-button" aria-label="Modifier">
                <img src={editPencil} alt="" width={16} height={16} />
              </button>
            </div>
            <div className="drawer-row">
              <Field label="Canal de réception">
                <a className="drawer-canal" href="#" onClick={(e) => e.preventDefault()}>
                  <SourceIcon source={complaint.canal} />
                  <span className="drawer-text">{complaint.canal}</span>
                  <ArrowUpRight />
                </a>
              </Field>
              <Field label="Date de réception">
                <span className="drawer-text">{complaint.dateReception}</span>
              </Field>
            </div>
            <div className="drawer-row">
              <Field label="Dénominateur social">
                <span className="drawer-text">{complaint.denominateurSocial}</span>
              </Field>
              <Field label="Assureur / Porteur du risque">
                <span className="drawer-text">{complaint.assureur}</span>
              </Field>
            </div>
            <div className="drawer-row">
              <Field label="Nom complet du requérant">
                <span className="drawer-text">{complaint.requerant}</span>
              </Field>
              <Field label="Email">
                <span className="drawer-text">{complaint.email}</span>
              </Field>
            </div>
            <Field label="Objet de la réclamation">
              <span className="drawer-text">{complaint.objet}</span>
            </Field>
            <DescriptionField text={complaint.description} />
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">Actions</h3>
            <div className="drawer-row">
              <button type="button" className="drawer-action-card">
                <div className="drawer-action-card-header">
                  <span className="drawer-action-card-title">Accusé de réception envoyé</span>
                  <img src={caretRight} alt="" width={12} height={22} />
                </div>
                <p className="drawer-action-card-text">
                  Une réponse définitive devra suivre pour clôturer le dossier.
                </p>
              </button>
              <button type="button" className="drawer-action-card">
                <div className="drawer-action-card-header">
                  <span className="drawer-action-card-title">Réponse définitive envoyée</span>
                  <img src={caretRight} alt="" width={12} height={22} />
                </div>
                <p className="drawer-action-card-text">
                  Aucune autre action ne sera nécessaire pour clôturer le dossier.
                </p>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
