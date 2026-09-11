import { useLayoutEffect, useRef, useState } from 'react';

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
};

export function FormField({ label, required, value, onChange }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  return (
    <div className="field-outlined">
      <div className="field-border">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <span className={`field-label ${floating ? 'field-label-floating' : ''}`}>
        {label}
        {required ? '*' : ''}
      </span>
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
        {required ? '*' : ''}
      </span>
    </div>
  );
}
