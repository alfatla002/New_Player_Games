import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { localDate } from "./model";
import "react-day-picker/style.css";
export function DatePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const popup = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<
    { top: number; left: number; maxHeight: number } | undefined
  >(undefined);
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!root.current || !trigger.current || !popup.current) return;
      const dialog = root.current.closest("dialog")!;
      const bounds = dialog.getBoundingClientRect();
      const head = dialog.querySelector(".dialog-head") as HTMLElement;
      const foot = dialog.querySelector(".dialog-actions") as HTMLElement;
      const floor = Math.max(12, bounds.top + head.offsetHeight + 10);
      const ceiling = Math.min(
        window.innerHeight - 12,
        bounds.bottom - foot.offsetHeight - 10,
      );
      const maxHeight = Math.max(140, ceiling - floor);
      const height = Math.min(popup.current.scrollHeight, maxHeight);
      const anchor = trigger.current.getBoundingClientRect();
      const rootRect = root.current.getBoundingClientRect();
      const top = Math.min(
        Math.max(anchor.top - height - 8, floor),
        Math.max(floor, ceiling - height),
      );
      const left = Math.max(
        bounds.left + 16,
        Math.min(rootRect.left, bounds.right - popup.current.offsetWidth - 16),
      );
      setPosition({
        top: top - rootRect.top,
        left: left - rootRect.left,
        maxHeight,
      });
    };
    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function select(date: Date | undefined) {
    onChange(date ? localDate(date) : null);
    setOpen(false);
    trigger.current?.focus();
  }
  const selected = value ? new Date(value + "T12:00:00") : undefined;
  return (
    <div
      className="date-field"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <span id={id + "-label"} className="field-label">
        Due date <span className="optional">Optional</span>
      </span>
      <button
        ref={trigger}
        type="button"
        className={`date-trigger ${!value ? "placeholder" : ""}`}
        disabled={disabled}
        aria-labelledby={id + "-label"}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <CalendarDays size={16} />
        <span>
          {selected
            ? selected.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No due date · N/A"}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          ref={popup}
          style={
            position
              ? { ...position, bottom: "auto", overflowY: "auto" }
              : undefined
          }
          className="calendar-popover"
          role="dialog"
          aria-label="Choose a due date"
          id={id}
        >
          <div className="calendar-title">
            <strong>When is it due?</strong>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              aria-label="Close calendar"
            >
              <X size={16} />
            </button>
          </div>
          <DayPicker
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            onSelect={select}
            autoFocus
            showOutsideDays
            fixedWeeks
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2100, 11)}
            weekStartsOn={1}
          />
          <div className="calendar-shortcuts">
            <button type="button" onClick={() => select(new Date())}>
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                select(d);
              }}
            >
              Tomorrow
            </button>
            <button type="button" onClick={() => select(undefined)}>
              No due date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
