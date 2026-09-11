import { useState } from 'react';
import ReclamationsPage from './components/ReclamationsPage/ReclamationsPage';
import ReclamationsPageV2 from './components/ReclamationsPageV2/ReclamationsPage';
import ReclamationsPageV3 from './components/ReclamationsPageV3/ReclamationsPage';
import ReclamationsPageV4 from './components/ReclamationsPageV4/ReclamationsPage';

type Version = {
  id: string;
  label: string;
  bullets: string[];
  render: () => React.ReactElement;
};

const VERSIONS: Version[] = [
  {
    id: 'v4',
    label: 'Version 4',
    bullets: ['Copie de la V3, en cours de modification (retours réunion du jour)'],
    render: () => <ReclamationsPageV4 />,
  },
  {
    id: 'v3',
    label: 'Version 3',
    bullets: [
      "L'alerte reste affichée",
      'Recentrée par rapport au contenu (pas à l\'écran)',
      'Couleur verte (succès) au lieu de bleu',
      'Le survol met en pause le délai de 8s avant disparition',
    ],
    render: () => <ReclamationsPageV3 />,
  },
  {
    id: 'v2',
    label: 'Version 2',
    bullets: [
      "Plus d'alerte à la création",
      'Le slider se ferme, une modale demande si vous voulez voir le dossier',
      'Case "Ne plus afficher" pour mémoriser le choix',
      'Si "Voir le dossier" : section "Informations du réclamant" dépliée',
    ],
    render: () => <ReclamationsPageV2 />,
  },
  {
    id: 'v1',
    label: 'Version 1',
    bullets: [
      "Plus d'alerte à la création",
      'Bascule automatique sur la page Réclamations',
      'Ouverture directe du dossier, section "Informations du réclamant" dépliée',
    ],
    render: () => <ReclamationsPage />,
  },
];

const switcherWrapStyle: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  top: 292,
  zIndex: 20,
  width: 268,
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  borderRadius: 4,
  overflow: 'visible',
  boxShadow: '0 3px 3px -2px rgba(0,0,0,0.2), 0 3px 4px 0 rgba(0,0,0,0.14), 0 1px 8px 0 rgba(0,0,0,0.12)',
};

const switcherLabelStyle: React.CSSProperties = {
  padding: '8px 16px 4px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: 'rgba(0,0,0,0.45)',
};

function versionRowStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: isActive ? 'rgba(33, 150, 243, 0.16)' : 'transparent',
  };
}

function versionButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 0,
    padding: '8px 4px 8px 16px',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#0b1f4b' : 'rgba(0,0,0,0.7)',
  };
}

const infoIconWrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px 0 4px',
};

const infoIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '1.3px solid rgba(0,0,0,0.35)',
  color: 'rgba(0,0,0,0.5)',
  fontSize: 10,
  fontWeight: 700,
  fontStyle: 'italic',
  fontFamily: 'Georgia, serif',
  cursor: 'default',
};

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  left: '100%',
  top: '50%',
  transform: 'translateY(-50%)',
  marginLeft: 10,
  width: 260,
  background: '#1a1a1a',
  color: '#fff',
  fontSize: 12,
  lineHeight: 1.4,
  padding: '10px 12px',
  borderRadius: 4,
  boxShadow: '0 3px 4px 0 rgba(0,0,0,0.14), 0 1px 8px 0 rgba(0,0,0,0.2)',
  zIndex: 30,
  pointerEvents: 'none',
};

const tooltipListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

function App() {
  const [versionId, setVersionId] = useState<string>(VERSIONS[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const active = VERSIONS.find((v) => v.id === versionId) ?? VERSIONS[0];

  return (
    <>
      {active.render()}
      <div style={switcherWrapStyle}>
        <span style={switcherLabelStyle}>Versions</span>
        {VERSIONS.map((v) => (
          <div key={v.id} style={versionRowStyle(v.id === versionId)}>
            <button type="button" style={versionButtonStyle(v.id === versionId)} onClick={() => setVersionId(v.id)}>
              {v.label}
            </button>
            <span
              style={infoIconWrapStyle}
              onMouseEnter={() => setHoveredId(v.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span style={infoIconStyle}>i</span>
              {hoveredId === v.id && (
                <div style={tooltipStyle}>
                  <ul style={tooltipListStyle}>
                    {v.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
