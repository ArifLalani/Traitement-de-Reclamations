export type SidebarSection = 'mentions' | 'reclamations';

type SidebarProps = {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
  open?: boolean;
};

function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4.2-7a1.5 1.5 0 0 1 2.72.87l-.46 3.63H18a2 2 0 0 1 1.94 2.5l-1.5 6A2 2 0 0 1 16.5 20H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 10h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}

function SmileySadIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 15c.7-1 1.9-1.6 3-1.6s2.3.6 3 1.6" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-3.5 4-5.3 7-5.3s6 1.8 7 5.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path
        d="M9.6 9.3a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .9-1 1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 4.5v6.5" strokeLinecap="round" />
      <path d="M7 6.8a7.5 7.5 0 1 0 10 0" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction = 'down' }: { direction?: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="currentColor"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

export default function Sidebar({ active, onSelect, open = true }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? '' : 'sidebar-collapsed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">JB</div>
          <div className="sidebar-profile-text">
            <span className="sidebar-profile-name">Joe Bleau</span>
            <span className="sidebar-profile-role">Entreprise</span>
          </div>
          <ChevronIcon direction="down" />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <ThumbsUpIcon />
              <span>Ma Réputation en ligne</span>
              <ChevronIcon direction="up" />
            </div>
            <button
              type="button"
              className={`sidebar-subitem ${active === 'mentions' ? 'sidebar-subitem-active' : ''}`}
              onClick={() => onSelect('mentions')}
            >
              <ChatIcon />
              <span>Mes Mentions</span>
            </button>
            <button
              type="button"
              className={`sidebar-subitem ${active === 'reclamations' ? 'sidebar-subitem-active' : ''}`}
              onClick={() => onSelect('reclamations')}
            >
              <SmileySadIcon />
              <span>Réclamations</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <button type="button" className="sidebar-item">
            <UserIcon />
            <span>Mon compte</span>
            <ChevronIcon direction="down" />
          </button>
          <button type="button" className="sidebar-item">
            <QuestionIcon />
            <span>Aide</span>
          </button>
          <button type="button" className="sidebar-item">
            <PowerIcon />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
