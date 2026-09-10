import { useState } from 'react';

type PostCreateDialogProps = {
  onView: (dontAskAgain: boolean) => void;
  onDismiss: (dontAskAgain: boolean) => void;
};

export default function PostCreateDialog({ onView, onDismiss }: PostCreateDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <div className="confirm-dialog-backdrop" onClick={() => onDismiss(dontAskAgain)}>
      <div className="confirm-dialog-paper" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-dialog-title">Réclamation créée</p>
        <p className="confirm-dialog-body">
          Voulez-vous consulter le dossier de cette réclamation dès maintenant pour compléter les informations
          nécessaires ?
        </p>
        <label className="post-create-dialog-checkbox">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          <span>Ne plus afficher ce message</span>
        </label>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn-text" onClick={() => onDismiss(dontAskAgain)}>
            Plus tard
          </button>
          <button type="button" className="btn-filled" onClick={() => onView(dontAskAgain)}>
            Voir le dossier
          </button>
        </div>
      </div>
    </div>
  );
}
