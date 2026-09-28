import { useState } from 'react';
import ReclamationsPageV1 from './components/ReclamationsPageV1/ReclamationsPage';
import ReclamationsPageV2 from './components/ReclamationsPageV2/ReclamationsPage';

type Version = {
  id: string;
  label: string;
  render: (versionSwitcher: React.ReactNode) => React.ReactElement;
};

const VERSIONS: Version[] = [
  { id: 'v2', label: 'Version 2', render: (versionSwitcher) => <ReclamationsPageV2 versionSwitcher={versionSwitcher} /> },
  { id: 'v1', label: 'Version 1', render: (versionSwitcher) => <ReclamationsPageV1 versionSwitcher={versionSwitcher} /> },
];

function App() {
  const [versionId, setVersionId] = useState<string>(VERSIONS[0].id);
  const active = VERSIONS.find((v) => v.id === versionId) ?? VERSIONS[0];

  const versionSwitcher = (
    <>
      {VERSIONS.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`sidebar-version-button ${v.id === versionId ? 'sidebar-version-button-active' : ''}`}
          onClick={() => setVersionId(v.id)}
        >
          {v.label}
        </button>
      ))}
    </>
  );

  return active.render(versionSwitcher);
}

export default App;
