import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import chevron from '../../assets/figma/expand-more.svg';

type FieldDropdownProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

export default function FieldDropdown({ label, required, value, onChange, options }: FieldDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const floating = focused || open || value.length > 0;

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setFocused(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setFocused(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open]);

  return (
    <div className="field-outlined" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="field-border field-dropdown-trigger"
        onClick={() => {
          setOpen((v) => !v);
          setFocused(true);
        }}
      >
        <span className="field-dropdown-value">{value}</span>
        <img
          className={`field-caret ${open ? 'field-caret-open' : ''}`}
          src={chevron}
          alt=""
          width={12}
          height={7.4}
        />
      </button>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required ? '*' : ''}
      </span>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="field-dropdown-menu"
            style={{ top: menuPosition.top, left: menuPosition.left, minWidth: menuPosition.width }}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className={`field-dropdown-item ${option === value ? 'field-dropdown-item-selected' : ''}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                  setFocused(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
