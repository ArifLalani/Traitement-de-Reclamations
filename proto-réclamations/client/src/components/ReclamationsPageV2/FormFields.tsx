import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const TEXTAREA_MIN_HEIGHT = 120;
const TEXTAREA_MAX_HEIGHT = 152;

export function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field-readonly">
      <span className="field-readonly-label">{label}</span>
      <div className="field-readonly-value">{children}</div>
    </div>
  );
}

export type FormFieldProps = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  errorText?: string;
};

export function FormField({ label, required, value, onChange, placeholder, error, errorText }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  return (
    <div className="field-outlined">
      <div className={`field-border ${error ? 'field-border-error' : ''}`}>
        <input
          type="text"
          value={value}
          placeholder={focused ? placeholder : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''} ${error ? 'field-label-error' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {error && errorText && <span className="field-error-text">{errorText}</span>}
    </div>
  );
}

export type FormSelectOption<T extends string> = { id: T; label: string };

type FormSelectProps<T extends string> = {
  label: string;
  required?: boolean;
  value: T | '';
  options: FormSelectOption<T>[];
  onChange: (value: T) => void;
};

export function FormSelect<T extends string>({ label, required, value, options, onChange }: FormSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);
  const floating = open || value !== '';

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="field-outlined">
      <div className="field-border">
        <button ref={triggerRef} type="button" className="field-dropdown-trigger" onClick={toggleOpen}>
          <span className="field-dropdown-value">{selected?.label ?? ''}</span>
        </button>
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="currentColor"
          className={`field-caret ${open ? 'field-caret-open' : ''}`}
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {open && (
        <div ref={menuRef} className="field-dropdown-menu" style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`field-dropdown-item ${option.id === value ? 'field-dropdown-item-selected' : ''}`}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FormTextarea({ label, required, value, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const updateFades = () => {
    const el = textareaRef.current;
    if (!el) return;
    setFadeTop(el.scrollTop > 4);
    setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const contentHeight = el.scrollHeight;
    const nextHeight = Math.min(Math.max(contentHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = contentHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    updateFades();
  }, [value]);

  return (
    <div className="field-outlined field-outlined-textarea">
      <div
        className={`field-border field-border-textarea ${fadeTop ? 'field-fade-top' : ''} ${fadeBottom ? 'field-fade-bottom' : ''}`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onScroll={updateFades}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
    </div>
  );
}

// Same look as FormTextarea, but hugs its content instead of clamping to a
// min/max height with an internal scroll + fade — it just grows to fit
// everything, no matter how long. Kept as a separate component (rather
// than a prop toggle) so both height behaviors stay independently usable.
export function FormTextareaAutoGrow({ label, required, value, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="field-outlined field-outlined-textarea">
      <div className="field-border field-border-textarea field-border-textarea-autogrow">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
    </div>
  );
}
