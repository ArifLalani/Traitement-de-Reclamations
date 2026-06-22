type AlertSnackbarProps = {
  visible: boolean;
  message: string;
  variant?: 'info' | 'success';
  actionLabel?: string;
  onAction?: () => void;
};

export default function AlertSnackbar({
  visible,
  message,
  variant = 'info',
  actionLabel,
  onAction,
}: AlertSnackbarProps) {
  return (
    <div
      className={`alert-snackbar alert-snackbar-${variant} ${visible ? 'alert-snackbar-visible' : ''}`}
      role="status"
    >
      <p className="alert-snackbar-text">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="alert-snackbar-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
