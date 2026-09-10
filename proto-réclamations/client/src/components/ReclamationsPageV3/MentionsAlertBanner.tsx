function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M12 4a5 5 0 0 0-5 5v3.5c0 .7-.3 1.4-.8 1.9L5 15.7c-.6.6-.2 1.6.6 1.6h12.8c.8 0 1.2-1 .6-1.6l-1.2-1.3c-.5-.5-.8-1.2-.8-1.9V9a5 5 0 0 0-5-5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

type MentionsAlertBannerProps = {
  count: number;
  negativeCount: number;
  onShow: () => void;
};

export default function MentionsAlertBanner({ count, negativeCount, onShow }: MentionsAlertBannerProps) {
  if (count <= 0) return null;

  return (
    <div className="alert-banner">
      <div className="alert-banner-icon">
        <BellIcon />
        <span className="alert-banner-badge">{count}</span>
      </div>
      <div className="alert-banner-text">
        <p className="alert-banner-title">
          {count} Nouvelle{count > 1 ? 's' : ''} mention{count > 1 ? 's' : ''} à consulter
        </p>
        {negativeCount > 0 && (
          <p className="alert-banner-subtitle">
            Dont <strong>{negativeCount} mention{negativeCount > 1 ? 's' : ''} négative{negativeCount > 1 ? 's' : ''}</strong> qui
            appelle{negativeCount > 1 ? 'nt' : ''} une réponse
          </p>
        )}
      </div>
      <button type="button" className="alert-banner-cta" onClick={onShow}>
        Afficher les mentions
      </button>
    </div>
  );
}
