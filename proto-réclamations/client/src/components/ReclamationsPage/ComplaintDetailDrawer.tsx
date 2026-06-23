import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import editPencil from '../../assets/figma/edit-pencil.svg';
import caretRight from '../../assets/figma/caret-right.svg';
import expandMore from '../../assets/figma/expand-more.svg';
import ArrowUpRight from './ArrowUpRight';
import SourceIcon from './SourceIcon';
import { FormField, FormTextarea } from './FormFields';
import { AVANCEMENT_LABEL, CONFORMITE_LABEL, type Complaint } from './complaintsData';

const CLOSE_ANIMATION_DURATION = 200;

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

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
  const [maskVisible, setMaskVisible] = useState(true);
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
      if (expanded) setMaskVisible(false);
      return;
    }

    wrapper.style.height = `${from}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.getBoundingClientRect();

    const raf = requestAnimationFrame(() => {
      wrapper.style.transition = 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      wrapper.style.height = `${to}px`;
    });

    const handleEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      wrapper.style.height = '';
      wrapper.style.overflow = '';
      wrapper.style.transition = '';
      // Only drop the fade mask once the expand transition has fully
      // settled, so it stays visible (and moves with the content) through
      // the whole animation instead of popping off instantly.
      if (expanded) setMaskVisible(false);
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
    setExpanded((v) => {
      const next = !v;
      // Collapsing: bring the mask back immediately so it's already there
      // for the whole shrink animation rather than popping in afterwards.
      if (!next) setMaskVisible(true);
      return next;
    });
  };

  return (
    <div className="drawer-field">
      <span className="drawer-field-label">Description</span>
      <div
        ref={wrapperRef}
        className={`drawer-description-wrapper ${maskVisible && overflowing ? 'drawer-description-fade' : ''}`}
      >
        <p ref={textRef} className={`drawer-description-text ${expanded ? '' : 'drawer-description-clamped'}`}>
          {text}
        </p>
      </div>
      {overflowing && (
        <button type="button" className="btn-link drawer-description-toggle" onClick={toggleExpanded}>
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

export type ComplaintInformationsUpdate = {
  requerant: string;
  email: string;
  denominateurSocial: string;
  assureur: string;
  objet: string;
  description: string;
};

type ComplaintDetailDrawerProps = {
  complaint: Complaint;
  onClose: () => void;
  onUpdate?: (id: string, updates: ComplaintInformationsUpdate) => void;
};

export default function ComplaintDetailDrawer({ complaint, onClose, onUpdate }: ComplaintDetailDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formRequerant, setFormRequerant] = useState(complaint.requerant);
  const [formEmail, setFormEmail] = useState(complaint.email);
  const [formDenominateur, setFormDenominateur] = useState(complaint.denominateurSocial);
  const [formAssureur, setFormAssureur] = useState(complaint.assureur);
  const [formObjet, setFormObjet] = useState(complaint.objet);
  const [formDescription, setFormDescription] = useState(complaint.description);
  // The view/edit transition animation should only play once the user has
  // actually toggled edit mode — not on the drawer's very first appearance,
  // where the content should already be there.
  const [hasToggledEditing, setHasToggledEditing] = useState(false);

  const startEditing = () => {
    setFormRequerant(complaint.requerant);
    setFormEmail(complaint.email);
    setFormDenominateur(complaint.denominateurSocial);
    setFormAssureur(complaint.assureur);
    setFormObjet(complaint.objet);
    setFormDescription(complaint.description);
    setEditing(true);
    setHasToggledEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveEditing = () => {
    onUpdate?.(complaint.id, {
      requerant: formRequerant,
      email: formEmail,
      denominateurSocial: formDenominateur,
      assureur: formAssureur,
      objet: formObjet,
      description: formDescription,
    });
    setEditing(false);
  };

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
          <section className="drawer-section drawer-section-tight">
            <h3 className="drawer-section-title-h6">Statut du dossier</h3>
            <div className="drawer-section-content">
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
            </div>
          </section>

          <section className="drawer-section drawer-section-tight">
            <div className="drawer-section-title-row">
              <h3 className="drawer-section-title-h6">Informations</h3>
              {!editing && (
                <button type="button" className="drawer-edit-button" aria-label="Modifier" onClick={startEditing}>
                  <img src={editPencil} alt="" width={16} height={16} />
                </button>
              )}
            </div>
            <div className="drawer-section-content">
              <div className="drawer-row">
                <Field label="Date de réception">
                  <span className="drawer-text">{complaint.dateReception}</span>
                </Field>
                <Field label="Canal de réception">
                  {complaint.sourceUrl ? (
                    <a
                      className="drawer-canal"
                      href={toHref(complaint.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SourceIcon source={complaint.canal} />
                      <span className="drawer-text">{complaint.canal}</span>
                      <ArrowUpRight />
                    </a>
                  ) : (
                    <span className="drawer-canal">
                      <SourceIcon source={complaint.canal} />
                      <span className="drawer-text">{complaint.canal}</span>
                    </span>
                  )}
                </Field>
              </div>

              <div
                key={editing ? 'edit' : 'view'}
                className={`drawer-edit-transition-content ${hasToggledEditing ? 'drawer-edit-transition-animated' : ''}`}
              >
                {editing ? (
                    <>
                      <div className="drawer-row">
                        <FormField
                          label="Nom complet du requérant"
                          value={formRequerant}
                          onChange={setFormRequerant}
                        />
                        <FormField label="Email" value={formEmail} onChange={setFormEmail} />
                      </div>
                      <div className="drawer-row">
                        <FormField
                          label="Dénominateur social"
                          value={formDenominateur}
                          onChange={setFormDenominateur}
                        />
                        <FormField
                          label="Assureur / Porteur du risque"
                          value={formAssureur}
                          onChange={setFormAssureur}
                        />
                      </div>
                      <FormField label="Objet de la réclamation" value={formObjet} onChange={setFormObjet} />
                      <FormTextarea
                        label="Description"
                        required
                        value={formDescription}
                        onChange={setFormDescription}
                      />
                      <div className="drawer-edit-actions">
                        <button type="button" className="btn-text" onClick={cancelEditing}>
                          Annuler
                        </button>
                        <button type="button" className="btn-filled" onClick={saveEditing}>
                          Sauvegarder
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="drawer-row">
                        <Field label="Nom complet du requérant">
                          <span className="drawer-text">{complaint.requerant}</span>
                        </Field>
                        <Field label="Email">
                          <span className="drawer-text">{complaint.email || 'Non renseigné'}</span>
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
                      <Field label="Objet de la réclamation">
                        <span className="drawer-text">{complaint.objet}</span>
                      </Field>
                      <DescriptionField text={complaint.description} />
                    </>
                  )}
              </div>
            </div>
          </section>

          <section className="drawer-section drawer-section-tight">
            <h3 className="drawer-section-title-h6">Actions</h3>
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
