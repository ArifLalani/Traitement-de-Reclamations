import { useEffect, useRef, useState } from 'react';
import drawerClose from '../../assets/figma/drawer-close.svg';
import editPencil from '../../assets/figma/edit-pencil.svg';
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
  return (
    <div className="drawer-field">
      <span className="drawer-field-label">Description</span>
      <p className="drawer-description-text">{text}</p>
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
  onDelete?: (id: string) => void;
};

export default function ComplaintDetailDrawer({
  complaint,
  onClose,
  onUpdate,
  onDelete,
}: ComplaintDetailDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
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

  const isDirty =
    editing &&
    (formRequerant !== complaint.requerant ||
      formEmail !== complaint.email ||
      formDenominateur !== complaint.denominateurSocial ||
      formAssureur !== complaint.assureur ||
      formObjet !== complaint.objet ||
      formDescription !== complaint.description);

  const performClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, CLOSE_ANIMATION_DURATION);
  };

  const handleClose = () => {
    if (closing) return;
    if (isDirty) {
      setShowUnsavedPrompt(true);
      return;
    }
    performClose();
  };

  const discardAndClose = () => {
    setShowUnsavedPrompt(false);
    setEditing(false);
    performClose();
  };

  const saveAndClose = () => {
    saveEditing();
    setShowUnsavedPrompt(false);
    performClose();
  };

  const confirmArchive = () => {
    setArchiveConfirmOpen(false);
    onDelete?.(complaint.id);
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
      if (e.key !== 'Escape') return;
      if (archiveConfirmOpen) {
        setArchiveConfirmOpen(false);
        return;
      }
      if (showUnsavedPrompt) {
        setShowUnsavedPrompt(false);
        return;
      }
      if (actionsOpen) {
        setActionsOpen(false);
        return;
      }
      handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionsOpen, showUnsavedPrompt, archiveConfirmOpen]);

  useEffect(() => {
    if (!actionsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!actionsMenuRef.current?.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsOpen]);

  return (
    <>
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
            <div className="drawer-section-title-row drawer-section-title-row-spread">
              <h3 className="drawer-section-title-h6">Statut du dossier</h3>
              <div className="drawer-actions-menu" ref={actionsMenuRef}>
                <button
                  type="button"
                  className="btn-filled drawer-actions-trigger"
                  onClick={() => setActionsOpen((v) => !v)}
                >
                  Actions
                  <svg
                    viewBox="0 0 9 5.5575"
                    width={12}
                    height={7.4}
                    fill="currentColor"
                    className={`btn-link-icon ${actionsOpen ? 'btn-link-icon-flipped' : ''}`}
                  >
                    <path d="M7.9425 0L4.5 3.435L1.0575 0L0 1.0575L4.5 5.5575L9 1.0575L7.9425 0Z" />
                  </svg>
                </button>
                {actionsOpen && (
                  <div className="drawer-actions-dropdown">
                    <button
                      type="button"
                      className="drawer-actions-item"
                      onClick={() => setActionsOpen(false)}
                    >
                      Accusé de Réception envoyé
                    </button>
                    <button
                      type="button"
                      className="drawer-actions-item"
                      onClick={() => setActionsOpen(false)}
                    >
                      Réponse définitive envoyée
                    </button>
                    {onDelete && (
                      <>
                        <div className="drawer-actions-divider" />
                        <button
                          type="button"
                          className="drawer-actions-item"
                          onClick={() => {
                            setActionsOpen(false);
                            setArchiveConfirmOpen(true);
                          }}
                        >
                          Archiver
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
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

        </div>
      </div>
    </div>

    {showUnsavedPrompt && (
      <div className="confirm-dialog-backdrop" onClick={() => setShowUnsavedPrompt(false)}>
        <div className="confirm-dialog-paper" onClick={(e) => e.stopPropagation()}>
          <h3 className="confirm-dialog-title">Continuer sans sauvegarder ?</h3>
          <p className="confirm-dialog-body">
            Vous avez des modifications non sauvegardées. Voulez-vous les conserver avant de
            continuer ?
          </p>
          <div className="confirm-dialog-actions">
            <button type="button" className="btn-text" onClick={discardAndClose}>
              Ignorer les modifications
            </button>
            <button type="button" className="btn-filled" onClick={saveAndClose}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    )}

    {archiveConfirmOpen && (
      <div className="confirm-dialog-backdrop" onClick={() => setArchiveConfirmOpen(false)}>
        <div
          className="confirm-dialog-paper confirm-dialog-paper-wide"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="confirm-dialog-title">Archiver cette réclamation ?</h3>
          <p className="confirm-dialog-body">
            La réclamation et la mention web associée seront archivées. Vos données sont
            conservées, vous pourrez recréer une réclamation à partir de ces informations à tout
            moment.
          </p>
          <div className="confirm-dialog-actions">
            <button type="button" className="btn-text" onClick={() => setArchiveConfirmOpen(false)}>
              Annuler
            </button>
            <button type="button" className="btn-filled" onClick={confirmArchive}>
              Archiver la réclamation
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
