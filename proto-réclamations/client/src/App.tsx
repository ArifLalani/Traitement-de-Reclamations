import { useState } from 'react';
import ReclamationsPage from './components/ReclamationsPage/ReclamationsPage';
import ReclamationsPageV1_1 from './components/ReclamationsPageV1_1/ReclamationsPage';
import ReclamationsPageV1_1_1 from './components/ReclamationsPageV1_1_1/ReclamationsPage';

type Version = {
  id: string;
  label: string;
  render: () => React.ReactElement;
};

const VERSIONS: Version[] = [
  { id: 'v1', label: 'Version 1', render: () => <ReclamationsPage /> },
  { id: 'v1.1', label: 'Version 1.1', render: () => <ReclamationsPageV1_1 /> },
  { id: 'v1.1.1', label: 'Version 1.1.1', render: () => <ReclamationsPageV1_1_1 /> },
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
  overflow: 'hidden',
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

function versionItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '8px 16px',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    background: isActive ? 'rgba(33, 150, 243, 0.16)' : 'transparent',
    color: isActive ? '#0b1f4b' : 'rgba(0,0,0,0.7)',
  };
}

function App() {
  const [versionId, setVersionId] = useState<string>(VERSIONS[0].id);
  const active = VERSIONS.find((v) => v.id === versionId) ?? VERSIONS[0];

  return (
    <>
      {active.render()}
      <div style={switcherWrapStyle}>
        <span style={switcherLabelStyle}>Versions</span>
        {VERSIONS.map((v) => (
          <button
            key={v.id}
            type="button"
            style={versionItemStyle(v.id === versionId)}
            onClick={() => setVersionId(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default App;
