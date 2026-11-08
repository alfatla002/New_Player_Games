import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
export function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    list = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(id + "-" + index)
        ?.scrollIntoView({ block: "nearest" });
  }, [index, open, id]);
  function choose(i: number) {
    onChange(options[i].value);
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      ref={root}
      className="choice"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="choice-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => {
          setIndex(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setIndex(
              Math.max(
                0,
                options.findIndex((o) => o.value === value),
              ),
            );
            setOpen(true);
          }
        }}
      >
        <span>{options.find((o) => o.value === value)?.label || label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          id={id}
          ref={list}
          className="choice-menu"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={id + "-" + index}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              trigger.current?.focus();
            } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setIndex(
                (i) =>
                  (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) %
                  options.length,
              );
            } else if (e.key === "Home" || e.key === "End") {
              e.preventDefault();
              setIndex(e.key === "Home" ? 0 : options.length - 1);
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              choose(index);
            } else if (e.key === "Tab") {
              setOpen(false);
              trigger.current?.focus();
            } else if (e.key.length === 1) {
              const found = options.findIndex((o) =>
                o.label.toLowerCase().startsWith(e.key.toLowerCase()),
              );
              if (found >= 0) setIndex(found);
            }
          }}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              id={id + "-" + i}
              role="option"
              aria-selected={o.value === value}
              className={`choice-option ${i === index ? "highlighted" : ""}`}
              onPointerMove={() => setIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {value === o.value && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
