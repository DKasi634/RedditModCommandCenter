import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { buttonSecondary } from "../lib/ui";
import { Icon } from "./icon";

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
    <div className="relative w-full" ref={rootRef}>
      <button
        type="button"
        className={cn(buttonSecondary, "h-10 w-full justify-between rounded-2xl px-3 text-left text-sm")}
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selected?.label}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      {isOpen ? (
        <div
          className="absolute left-0 top-[calc(100%+5px)] z-20 w-full overflow-hidden rounded-[14px] border border-[#e5ebee] bg-white p-1 shadow-[0_12px_28px_rgba(28,28,28,0.14)]"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex min-h-8 w-full items-center justify-between rounded-[10px] border-0 bg-transparent px-2 py-1.5 text-left text-sm font-semibold text-[#1c1c1c] transition hover:bg-[#f6f7f8]",
                option.value === value && "bg-[#fff1eb]",
              )}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <Icon name="check" size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
