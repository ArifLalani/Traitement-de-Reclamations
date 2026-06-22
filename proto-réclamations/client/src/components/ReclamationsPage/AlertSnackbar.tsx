type AlertSnackbarProps = {
  visible: boolean;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export default function AlertSnackbar({ visible, message, actionLabel, onAction }: AlertSnackbarProps) {
  return (
    <div className={`alert-snackbar ${visible ? 'alert-snackbar-visible' : ''}`} role="status">
      <p className="alert-snackbar-text">{message}</p>
      <button type="button" className="alert-snackbar-action" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
