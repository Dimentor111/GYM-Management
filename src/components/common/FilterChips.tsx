export interface ChipOption<T extends string = string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Row of selectable filter chips (`.fbar` + `.chip`). */
export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="fbar">
      {options.map((o) => (
        <div
          key={o.value}
          className={`chip${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}
