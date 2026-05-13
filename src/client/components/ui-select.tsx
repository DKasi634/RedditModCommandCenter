import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option<TValue extends string> = {
  label: string;
  value: TValue;
};

type Props<TValue extends string> = {
  value: TValue;
  options: Option<TValue>[];
  disabled?: boolean;
  onChange: (value: TValue) => void;
};

export function UiSelect<TValue extends string>({
  value,
  options,
  disabled = false,
  onChange,
}: Props<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="ui-select" ref={rootRef}>
      <button
        type="button"
        className="ui-select-trigger"
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen ? (
        <div className="ui-select-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === value ? "ui-select-option selected" : "ui-select-option"}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <Check size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
