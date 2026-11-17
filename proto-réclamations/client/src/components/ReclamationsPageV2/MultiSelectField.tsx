import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DROPDOWN_GAP = 4;
const DROPDOWN_MAX_HEIGHT = 300; // Keep in sync with .field-dropdown-menu's max-height.

function computeDropdownPlacement(
  rect: DOMRect,
): { top: number; bottom?: undefined; maxHeight: number } | { top?: undefined; bottom: number; maxHeight: number } {
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP;
  const spaceAbove = rect.top - DROPDOWN_GAP;
  if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
    return { bottom: window.innerHeight - rect.top + DROPDOWN_GAP, maxHeight: Math.max(0, Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove)) };
  }
  return { top: rect.bottom + DROPDOWN_GAP, maxHeight: Math.max(0, Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow)) };
}

type MultiSelectFieldProps = {
  label: string;
  required?: boolean;
  value: string[];
  options: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: boolean;
  errorText?: string;
  readOnly?: boolean;
  // 'outlined': floating label in the border (mention panel's form fields).
  // 'section': label above the box (réclamation's Informations tab fields).
  appearance?: 'outlined' | 'section';
};

// Dropdown allowing several choices — the selected values show as removable
// chips inside the field, in the order they were picked. The menu stays open
// while picking so several values can be ticked in a row.
export function MultiSelectField({
  label,
  required,
  value,
  options,
  onChange,
  placeholder = 'Sélectionnez une ou plusieurs options',
  error,
  errorText,
  readOnly,
  appearance = 'outlined',
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
  const fieldRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Re-anchored whenever the selection changes too: adding/removing a chip
  // can wrap the field onto another line and move its bottom edge.
  useLayoutEffect(() => {
    if (!open || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    setMenuStyle({ ...computeDropdownPlacement(rect), left: rect.left, width: rect.width });
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const handleMenuWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    let scrollParent = fieldRef.current?.parentElement ?? null;
    while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
      scrollParent = scrollParent.parentElement;
    }
    scrollParent?.scrollBy({ top: e.deltaY });
  };

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  const isSection = appearance === 'section';
  const labelNode = (
    <>
      {label}
      {required && <span className={isSection ? 'dossier-field-required' : 'field-required'}>*</span>}
    </>
  );

  const boxClassName = isSection
    ? `dossier-field-input multiselect-box ${readOnly ? 'dossier-field-input-readonly' : ''} ${error ? 'dossier-field-input-error' : ''}`
    : `field-border multiselect-box ${error ? 'field-border-error' : ''}`;

  const box = (
    <div
      ref={fieldRef}
      className={`${boxClassName} ${readOnly ? 'multiselect-box-readonly' : ''} ${open ? 'multiselect-box-open' : ''}`}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      aria-haspopup={readOnly ? undefined : 'listbox'}
      aria-expanded={readOnly ? undefined : open}
      onClick={() => !readOnly && setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (readOnly) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      <div className="multiselect-chips">
        {value.length === 0 ? (
          <span className="multiselect-placeholder">{readOnly ? '-' : placeholder}</span>
        ) : (
          value.map((v) => (
            <span key={v} className="multiselect-chip">
              <span className="multiselect-chip-label">{v}</span>
              {!readOnly && (
                <button
                  type="button"
                  className="multiselect-chip-remove"
                  aria-label={`Retirer « ${v} »`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((x) => x !== v));
                  }}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z" />
                  </svg>
                </button>
              )}
            </span>
          ))
        )}
      </div>
      {!readOnly && (
        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={`field-caret ${open ? 'field-caret-open' : ''}`}>
          <path d="M7 10l5 5 5-5z" />
        </svg>
      )}
    </div>
  );

  return (
    <div className={isSection ? 'dossier-field' : 'field-outlined'}>
      {isSection && <span className="dossier-field-label">{labelNode}</span>}
      {box}
      {!isSection && (
        <span className={`field-label field-label-floating ${error ? 'field-label-error' : ''}`}>{labelNode}</span>
      )}
      {error && errorText && <span className={isSection ? 'dossier-field-error-text' : 'field-error-text'}>{errorText}</span>}
      {open &&
        createPortal(
          <div className="scope-v2">
            <div
              ref={menuRef}
              className="field-dropdown-menu"
              role="listbox"
              aria-multiselectable="true"
              style={{
                top: menuStyle.top,
                bottom: menuStyle.bottom,
                left: menuStyle.left,
                width: menuStyle.width,
                maxHeight: menuStyle.maxHeight,
              }}
              onWheel={handleMenuWheel}
            >
              {options.map((option) => {
                const checked = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={checked}
                    className={`field-dropdown-item multiselect-item ${checked ? 'field-dropdown-item-selected' : ''}`}
                    onClick={() => toggle(option)}
                  >
                    <span className={`multiselect-checkbox ${checked ? 'multiselect-checkbox-checked' : ''}`} aria-hidden="true">
                      {checked && (
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </span>
                    <span className="field-dropdown-item-label">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
