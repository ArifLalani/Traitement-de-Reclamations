import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import HoverTooltip from './HoverTooltip';

const TEXTAREA_MIN_HEIGHT = 120;
const TEXTAREA_MAX_HEIGHT = 152;

const DROPDOWN_GAP = 4;
const DROPDOWN_MAX_HEIGHT = 300; // Keep in sync with .field-dropdown-menu's max-height.

// Opens downward by default — unless there isn't enough room below for the
// full list AND there's more room above, in which case it flips upward
// instead of being squashed into a barely-scrollable sliver. Either way,
// whatever space is actually available caps the height and the list scrolls
// internally (.field-dropdown-menu already has overflow-y: auto).
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
  // "date" restricts input to digits and auto-inserts the "/" separators as
  // the user types (14092026 → 14/09/2026), instead of taking free text.
  type?: 'text' | 'date';
};

// Strips everything but digits, caps at 8 (JJMMAAAA), and inserts the "/"
// separators as soon as the day/month group reaches 2 digits — not just once
// a digit of the next group has been typed. `previous` is the field's value
// before this change: when the raw input is shorter but has the exact same
// digits, the user backspaced over an auto-inserted "/" rather than an
// actual digit — that "/" isn't really there to delete, so the last digit
// is dropped too, otherwise backspace right after a separator would do
// nothing and the user would appear stuck.
function maskFrDateInput(raw: string, previous: string): string {
  let digits = raw.replace(/\D/g, '').slice(0, 8);
  if (raw.length < previous.length && digits.length === previous.replace(/\D/g, '').length) {
    digits = digits.slice(0, -1);
  }
  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  // Clamps each complete group to a real calendar value as soon as it's
  // typed, rather than letting something like "35/13/2026" or "31/04/2026"
  // (April has 30 days) sit there — month first, since the day clamp needs
  // to know it to find that month's last day. A month/year not typed yet
  // falls back to 12 and a leap year, so the day isn't clamped too early.
  if (month.length === 2) {
    month = String(Math.min(Math.max(parseInt(month, 10) || 1, 1), 12)).padStart(2, '0');
  }
  if (day.length === 2) {
    const monthNum = month.length === 2 ? parseInt(month, 10) : 12;
    const yearNum = year.length === 4 ? parseInt(year, 10) : 2000;
    const maxDay = new Date(yearNum, monthNum, 0).getDate();
    day = String(Math.min(Math.max(parseInt(day, 10) || 1, 1), maxDay)).padStart(2, '0');
  }

  let out = day;
  if (day.length === 2) out += '/';
  out += month;
  if (month.length === 2) out += '/';
  out += year;
  return out;
}

export function FormField({ label, required, value, onChange, placeholder, error, errorText, type = 'text' }: FormFieldProps) {
  return (
    <div className="field-outlined">
      <div className={`field-border ${error ? 'field-border-error' : ''}`}>
        <input
          type="text"
          inputMode={type === 'date' ? 'numeric' : undefined}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(type === 'date' ? maskFrDateInput(e.target.value, value) : e.target.value)}
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
  const [menuStyle, setMenuStyle] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DROPDOWN_MAX_HEIGHT,
  });
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
    setMenuStyle({ ...computeDropdownPlacement(rect), left: rect.left, width: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    // Scrolling the menu's own option list (it can exceed its max-height)
    // fires a scroll event too — only a scroll elsewhere (e.g. the drawer
    // behind it moving the trigger) should close the menu.
    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // The menu is portaled to <body>, so it isn't a DOM descendant of the
  // drawer's own scrollable body — scrolling over it would otherwise just
  // scroll the (short, capped) menu itself instead of that underlying
  // panel. Forward the wheel delta to the trigger's nearest scrollable
  // ancestor instead, so the panel moves like the menu wasn't even there.
  const handleMenuWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    let scrollParent = fieldRef.current?.parentElement ?? null;
    while (scrollParent && scrollParent.scrollHeight <= scrollParent.clientHeight) {
      scrollParent = scrollParent.parentElement;
    }
    scrollParent?.scrollBy({ top: e.deltaY });
  };

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
          <div className="scope-v2">
            <div
              ref={menuRef}
              className="field-dropdown-menu"
              style={{
                top: menuStyle.top,
                bottom: menuStyle.bottom,
                left: menuStyle.left,
                width: menuStyle.width,
                maxHeight: menuStyle.maxHeight,
              }}
              onWheel={handleMenuWheel}
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
export function FormTextareaAutoGrow({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  errorText,
}: FormFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="field-outlined field-outlined-textarea">
      <div
        className={`field-border field-border-textarea field-border-textarea-autogrow ${error ? 'field-border-error' : ''}`}
      >
        <textarea
          ref={textareaRef}
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
