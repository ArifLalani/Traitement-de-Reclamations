import { useEffect, useRef, useState } from 'react';

// The member company shown in the top bar. When it belongs to a network, the
// network is the large line and the agency the smaller one below it; on its
// own, the company name alone shows in large.
const COMPANY = {
  network: 'Gan' as string | null,
  agency: 'Qualité Assurances',
};

const IMAGE_STORAGE_KEY = 'company-image-v1';
// Uploaded images are scaled down before being kept in the browser, so a
// large photo doesn't blow past localStorage's quota.
const STORED_IMAGE_MAX_SIDE = 160;

function readStoredImage(): string | null {
  try {
    return localStorage.getItem(IMAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeImage(dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(IMAGE_STORAGE_KEY, dataUrl);
    else localStorage.removeItem(IMAGE_STORAGE_KEY);
  } catch {
    // localStorage unavailable or full, keep it for this session only
  }
}

function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image illisible'));
      img.onload = () => {
        const scale = Math.min(1, STORED_IMAGE_MAX_SIDE / Math.min(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function CameraIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2z" />
    </svg>
  );
}

// Company image + name(s), at the left of the top bar. With no image yet, a
// dashed camera tile opens the file picker; once set, clicking the image
// offers to change or remove it. The image is kept in this browser.
export default function CompanyIdentity() {
  const [image, setImage] = useState<string | null>(readStoredImage);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const openPicker = () => {
    setMenuOpen(false);
    inputRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await downscaleImage(file);
      setImage(dataUrl);
      storeImage(dataUrl);
    } catch {
      // unreadable file, ignore
    }
  };

  const handleRemove = () => {
    setImage(null);
    storeImage(null);
    setMenuOpen(false);
  };

  const companyName = COMPANY.network ?? COMPANY.agency;

  return (
    <div className="company-identity" ref={wrapRef}>
      <button
        type="button"
        className={`company-image ${image ? '' : 'company-image-empty'}`}
        aria-label={image ? "Modifier l'image de l'entreprise" : "Ajouter une image de l'entreprise"}
        title={image ? "Modifier l'image" : 'Ajouter une image'}
        aria-haspopup={image ? 'menu' : undefined}
        aria-expanded={image ? menuOpen : undefined}
        onClick={() => (image ? setMenuOpen((open) => !open) : openPicker())}
      >
        {image ? (
          <>
            <img src={image} alt="" />
            <span className="company-image-overlay">
              <CameraIcon size={18} />
            </span>
          </>
        ) : (
          <CameraIcon size={18} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {menuOpen && (
        <div className="company-image-menu" role="menu">
          <button type="button" role="menuitem" className="company-image-menu-item" onClick={openPicker}>
            Changer l'image
          </button>
          <button type="button" role="menuitem" className="company-image-menu-item" onClick={handleRemove}>
            Retirer l'image
          </button>
        </div>
      )}
      <div className="company-names">
        <span className="company-name">{companyName}</span>
        {COMPANY.network && <span className="company-agency">{COMPANY.agency}</span>}
      </div>
    </div>
  );
}
