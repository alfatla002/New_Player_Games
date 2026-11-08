import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  AlertCircle,
  Check,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { names, statuses, validateTask, type Task, type Status } from "./model";
import { DatePicker } from "./DatePicker";
import { Choice } from "./Choice";
export function TaskDialog({
  task,
  existing,
  saving,
  error,
  onClose,
  onSave,
  onDelete,
  onClearError,
}: {
  task: Task;
  existing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (t: Task) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClearError: () => void;
}) {
  const [draft, setDraft] = useState(task),
    [tags, setTags] = useState(task.labels.join(", ")),
    [attempted, setAttempted] = useState(false),
    [confirmation, setConfirmation] = useState<"discard" | "delete" | null>(
      null,
    ),
    [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDialogElement>(null),
    closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initial = useRef(JSON.stringify(task));
  const initialExisting = useRef(existing).current;
  const dirty =
    JSON.stringify(draft) !== initial.current ||
    tags !== task.labels.join(", ");
  const validation = validateTask(draft);
  const valid = !Object.keys(validation).length;
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      queueMicrotask(() => {
        if (previousFocus?.isConnected) previousFocus.focus();
      });
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() {
    if (saving || closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(
      onClose,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160,
    );
  }
  function requestClose() {
    if (saving) return;
    if (dirty) {
      setConfirmation("discard");
      return;
    }
    close();
  }
  async function submit() {
    setAttempted(true);
    setConfirmation(null);
    if (!valid) {
      requestAnimationFrame(() =>
        ref.current
          ?.querySelector<HTMLInputElement>(
            'input[aria-invalid="true"], textarea[aria-invalid="true"]',
          )
          ?.focus(),
      );
      return;
    }
    const success = await onSave({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      labels: [
        ...new Set(
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ],
    });
    if (success) close();
  }
  const setField = (patch: Partial<Task>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setConfirmation(null);
    onClearError();
  };
  return (
    <dialog
      ref={ref}
      className={`task-dialog ${closing ? "is-closing" : ""}`}
      aria-labelledby="task-dialog-heading"
      onCancel={(e) => {
        e.preventDefault();
        if (confirmation) {
          setConfirmation(null);
        } else requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            requestClose();
        }
      }}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="dialog-head">
          <div className="dialog-heading">
            <span className="dialog-symbol">
              <AlignLeft size={19} />
            </span>
            <div>
              <h2 id="task-dialog-heading">
                {initialExisting ? "Task details" : "Create a task"}
              </h2>
              <p>
                {initialExisting
                  ? "A little clarity goes a long way."
                  : "Turn the next idea into a clear next step."}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={requestClose}
            aria-label="Close task"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <div className="dialog-content">
          {error && (
            <div className="inline-error" role="alert">
              <AlertCircle size={17} />
              <span>
                {error} Your changes are still here. Try saving again.
              </span>
            </div>
          )}
          <fieldset disabled={saving} className="task-fields">
            <label className="field">
              Task title{" "}
              <input
                aria-label="Task title"
                autoFocus
                required
                maxLength={160}
                placeholder="Give this task a clear name"
                value={draft.title}
                aria-invalid={attempted && !!validation.title}
                aria-describedby={
                  attempted && validation.title ? "title-error" : undefined
                }
                onChange={(e) => setField({ title: e.target.value })}
              />
              {attempted && validation.title && (
                <span id="title-error" className="field-error">
                  {validation.title}
                </span>
              )}
            </label>
            <label className="field">
              Description{" "}
              <textarea
                aria-label="Description"
                required
                rows={4}
                maxLength={5000}
                placeholder="What needs to happen? Add the details that will help you get there."
                value={draft.description}
                aria-invalid={attempted && !!validation.description}
                aria-describedby={
                  attempted && validation.description
                    ? "description-error"
                    : "description-help"
                }
                onChange={(e) => setField({ description: e.target.value })}
              />
              <span className="field-help" id="description-help">
                Required · a little context makes work easier.
              </span>
              {attempted && validation.description && (
                <span id="description-error" className="field-error">
                  {validation.description}
                </span>
              )}
            </label>
            <div className="form-row">
              <div className="field">
                <span className="field-label">Status</span>
                <Choice
                  label="Status"
                  value={draft.status}
                  options={statuses.map((s) => ({ value: s, label: names[s] }))}
                  onChange={(v) => setField({ status: v as Status })}
                  disabled={saving}
                />
              </div>
              <div className="field">
                <span className="field-label">Priority</span>
                <Choice
                  label="Priority"
                  value={draft.priority}
                  options={["low", "normal", "high"].map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1),
                  }))}
                  onChange={(v) =>
                    setField({ priority: v as Task["priority"] })
                  }
                  disabled={saving}
                />
              </div>
            </div>
            <div className="form-row">
              <DatePicker
                value={draft.due_date}
                onChange={(date) => setField({ due_date: date })}
                disabled={saving}
              />
              <label className="field">
                Labels <span className="optional">Optional</span>
                <input
                  value={tags}
                  maxLength={250}
                  onChange={(e) => {
                    setTags(e.target.value);
                    setConfirmation(null);
                    onClearError();
                  }}
                  placeholder="Design, Product"
                />
                <span className="field-help">Separate labels with commas.</span>
              </label>
            </div>
          </fieldset>
          <p className="dialog-tip">
            <ShieldCheck size={14} /> Saves to your private guest workspace.
          </p>
        </div>
        {confirmation && (
          <div
            className={`confirmation ${confirmation}`}
            role="alert"
            ref={(node) => {
              if (node)
                requestAnimationFrame(() => {
                  node.scrollIntoView({
                    block: "nearest",
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  });
                });
            }}
          >
            <div>
              <strong>
                {confirmation === "delete"
                  ? "Delete this task?"
                  : "Discard unsaved changes?"}
              </strong>
              <p>
                {confirmation === "delete"
                  ? "This permanently removes the task from your board."
                  : "Your latest edits haven’t been saved yet."}
              </p>
            </div>
            <div className="confirmation-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setConfirmation(null)}
                disabled={saving}
              >
                {confirmation === "delete" ? "Keep task" : "Keep editing"}
              </button>
              <button
                type="button"
                className="danger"
                disabled={saving}
                onClick={() => {
                  if (confirmation === "discard") close();
                  else
                    void onDelete().then((ok) => {
                      if (ok) close();
                    });
                }}
              >
                {saving ? <LoaderCircle className="spin" size={14} /> : null}
                {confirmation === "delete" ? "Delete task" : "Discard changes"}
              </button>
            </div>
          </div>
        )}
        <div className="dialog-actions">
          {initialExisting && (
            <button
              type="button"
              className="delete"
              disabled={saving}
              onClick={() => setConfirmation("delete")}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
          <button
            type="button"
            className="secondary"
            disabled={saving}
            onClick={requestClose}
          >
            Cancel
          </button>
          <button
            className="primary"
            disabled={saving}
            data-incomplete={!valid}
          >
            {saving ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Check size={16} />
            )}{" "}
            {saving
              ? "Saving…"
              : initialExisting
                ? "Save changes"
                : "Create task"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
