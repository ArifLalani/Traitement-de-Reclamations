type AlertSnackbarProps = {
  visible: boolean;
  message: string;
  variant?: 'info' | 'success';
  actionLabel?: string;
  onAction?: () => void;
  // Lets a caller reposition the snackbar (e.g. relative to a drawer panel
  // instead of the viewport) without duplicating its styles.
  className?: string;
};

export default function AlertSnackbar({
  visible,
  message,
  variant = 'info',
  actionLabel,
  onAction,
  className = '',
}: AlertSnackbarProps) {
  return (
    <div
      className={`alert-snackbar alert-snackbar-${variant} ${visible ? 'alert-snackbar-visible' : ''} ${className}`}
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
