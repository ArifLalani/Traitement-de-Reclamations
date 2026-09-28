import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import HoverTooltip from './HoverTooltip';

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
  return (
    <div className="field-outlined">
      <div className={`field-border ${error ? 'field-border-error' : ''}`}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className={`field-label field-label-floating ${error ? 'field-label-error' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {error && errorText && <span className="field-error-text">{errorText}</span>}
    </div>
  );
}

export type FormSelectOption<T extends string> = { id: T; label: string; description?: string };

type FormSelectProps<T extends string> = {
  label: string;
  required?: boolean;
  value: T | '';
  options: FormSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: boolean;
  errorText?: string;
};

export function FormSelect<T extends string>({
  label,
  required,
  value,
  options,
  onChange,
  placeholder,
  error,
  errorText,
}: FormSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  // Anchored to the bordered field itself (not the inner button), so the
  // menu's width/left match the field's visible outer edge instead of its
  // padded-in content box.
  const fieldRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  // Recomputed every time the menu opens (not just on click) so it stays
  // correct even if something else moved the trigger between renders, and
  // closed on scroll/resize instead of tracked, since the trigger can live
  // inside a scrollable drawer panel.
  useLayoutEffect(() => {
    if (!open || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    setMenuStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="field-outlined">
      <div ref={fieldRef} className={`field-border ${error ? 'field-border-error' : ''}`}>
        <button
          type="button"
          className="field-dropdown-trigger"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`field-dropdown-value ${!selected ? 'field-dropdown-value-placeholder' : ''}`}>
            {selected?.label ?? placeholder ?? 'Sélectionnez une option'}
          </span>
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
      <span className={`field-label field-label-floating ${error ? 'field-label-error' : ''}`}>
        {label}
        {required && <span className="field-required">*</span>}
      </span>
      {error && errorText && <span className="field-error-text">{errorText}</span>}
      {open &&
        createPortal(
          <div className="scope-v1">
            <div
              ref={menuRef}
              className="field-dropdown-menu"
              style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
            >
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
                  <span className="field-dropdown-item-label">{option.label}</span>
                  {option.description && (
                    <HoverTooltip text={option.description} align="left" className="field-dropdown-item-help">
                      <span
                        className="field-dropdown-item-help-icon"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ?
                      </span>
                    </HoverTooltip>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function FormTextarea({ label, required, value, onChange, placeholder }: FormFieldProps) {
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
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onScroll={updateFades}
        />
      </div>
      <span className="field-label field-label-floating">
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
export function FormTextareaAutoGrow({ label, required, value, onChange, placeholder }: FormFieldProps) {
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
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className="field-label field-label-floating">
        {label}
        {required && <span className="field-required">*</span>}
      </span>
    </div>
  );
}
