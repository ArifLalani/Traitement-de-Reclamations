type SortRadioGroupProps<T extends string> = {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
};

export default function SortRadioGroup<T extends string>({ value, options, onChange }: SortRadioGroupProps<T>) {
  return (
    <div className="sort-radio-group" role="radiogroup">
      {options.map((option) => {
        const checked = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={checked}
            className="sort-radio-option"
            onClick={() => onChange(option.id)}
          >
            <span className={`sort-radio-circle ${checked ? 'sort-radio-circle-checked' : ''}`} />
            <span className="sort-radio-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
