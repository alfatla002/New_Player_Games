import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  ArrowUp,
  ArrowDown,
  Check,
  LayoutDashboard,
  Search,
  Plus,
  X,
  CalendarDays,
  Flag,
  LoaderCircle,
  AlertCircle,
  Columns3,
  ShieldCheck,
  Sparkles,
  Tag,
  GripVertical,
  RotateCw,
} from "lucide-react";
import {
  statuses,
  names,
  dueState,
  filterTasks,
  type Task,
  type Status,
} from "./model";
import { loadBoard, saveTask, deleteTask, persistDemo, supabase } from "./data";
import { TaskDialog } from "./TaskDialog";
import { Choice } from "./Choice";
import { SessionInfo } from "./SessionInfo";
import "./style.css";
const labelColors: Record<string, string> = {
  Design: "purple",
  Product: "blue",
  Engineering: "orange",
  Research: "green",
};
function Card({
  task,
  onOpen,
  overlay = false,
  disabled = false,
  drag,
}: {
  task: Task;
  onOpen: () => void;
  overlay?: boolean;
  disabled?: boolean;
  drag?: ReturnType<typeof useDraggable>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = drag || {};
  const urgency = dueState(task.due_date, task.status);
  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      className={`task-card ${isDragging ? "dragging" : ""} ${overlay ? "overlay" : ""}`}
      onClick={disabled || overlay ? undefined : onOpen}
    >
      <div className="card-top">
        <div className="tags">
          {task.labels.map((l) => (
            <span key={l} className={`tag ${labelColors[l] || "purple"}`}>
              {l}
            </span>
          ))}
        </div>
        <button
          disabled={disabled || overlay}
          onClick={(e) => e.stopPropagation()}
          className="drag-handle icon-button"
          aria-label={`Drag ${task.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
      </div>
      <button className="card-body" disabled={disabled || overlay}>
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </button>
      <div className="card-footer">
        <span className={`priority ${task.priority}`}>
          {task.priority === "high" ? (
            <ArrowUp size={13} />
          ) : task.priority === "low" ? (
            <ArrowDown size={13} />
          ) : (
            <span>≡</span>
          )}
          {task.priority}
        </span>
        {task.due_date ? (
          <span className={`due ${urgency}`}>
            <CalendarDays size={12} />
            {urgency === "today"
              ? "Today"
              : new Date(task.due_date + "T12:00:00").toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric" },
                )}
          </span>
        ) : (
          <span className="due no-date">No due date</span>
        )}
        {task.status === "done" && (
          <span className="complete">
            <Check size={14} />
          </span>
        )}
      </div>
    </article>
  );
}
function DraggableCard({
  task,
  disabled,
  onOpen,
}: {
  task: Task;
  disabled: boolean;
  onOpen: () => void;
}) {
  const drag = useDraggable({ id: task.id, disabled });
  return <Card task={task} disabled={disabled} onOpen={onOpen} drag={drag} />;
}
function Column({
  status,
  tasks,
  onNew,
  onOpen,
  disabled,
  filtered,
}: {
  status: Status;
  tasks: Task[];
  onNew: () => void;
  onOpen: (t: Task) => void;
  disabled: boolean;
  filtered: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`column ${status} ${isOver ? "drop-over" : ""}`}
    >
      <div className="column-heading">
        <span className="status-dot" />
        <h2>{names[status]}</h2>
        <span className="count">{tasks.length}</span>
        <button
          className="icon-button"
          onClick={onNew}
          disabled={disabled}
          aria-label={`Add task to ${names[status]}`}
        >
          <Plus size={17} />
        </button>
      </div>
      <div className="cards">
        {tasks.map((t) => (
          <DraggableCard
            key={t.id}
            task={t}
            disabled={disabled}
            onOpen={() => onOpen(t)}
          />
        ))}
        {!tasks.length && (
          <div className="empty-column">
            <Columns3 size={23} />
            <p>
              {filtered
                ? "No matching tasks here."
                : "A little room for what’s next."}
            </p>
            {!filtered && (
              <button disabled={disabled} onClick={onNew}>
                Create a task
              </button>
            )}
          </div>
        )}
      </div>
      <button className="add-card" disabled={disabled} onClick={onNew}>
        <Plus size={15} /> Add task
      </button>
    </section>
  );
}
function App() {
  const [tasks, setTasks] = useState<Task[]>([]),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editorError, setEditorError] = useState(""),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState(""),
    [label, setLabel] = useState(""),
    [editing, setEditing] = useState<Task | null>(null),
    [active, setActive] = useState<Task | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await loadBoard();
      setTasks(data.tasks);
      setUserId(data.userId);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!document.querySelector("dialog[open]")) searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function newTask(status: Status = "todo") {
    if (!userId || loading || saving) return;
    setEditorError("");
    setEditing({
      id: crypto.randomUUID(),
      user_id: userId,
      title: "",
      description: "",
      status,
      priority: "normal",
      due_date: null,
      labels: [],
      created_at: new Date().toISOString(),
    });
  }
  async function update(task: Task, close = true): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    setEditorError("");
    const previous = tasksRef.current;
    const exists = previous.some((t) => t.id === task.id);
    const next = exists
      ? previous.map((t) => (t.id === task.id ? task : t))
      : [...previous, task];
    if (!close) setTasks(next);
    try {
      await saveTask(task);
      persistDemo(next);
      setTasks(next);
      const hiddenByFilters = close && !filterTasks([task], search, priority, label).length;
      if (hiddenByFilters) {
        setSearch("");
        setPriority("");
        setLabel("");
      }
      setNotice(
        close
          ? exists
            ? "Changes saved"
            : "Task created"
          : `Moved to ${names[task.status]}`,
      );
      return true;
    } catch (e) {
      if (!close) setTasks(previous);
      if (close) setEditorError(message(e));
      else
        setError(
          `Couldn’t move the task. ${message(e)} Your previous status has been restored.`,
        );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function remove(task: Task): Promise<boolean> {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setEditorError("");
    try {
      await deleteTask(task.id);
      const next = tasksRef.current.filter((t) => t.id !== task.id);
      persistDemo(next);
      setTasks(next);
      setNotice("Task deleted");
      return true;
    } catch (e) {
      setEditorError(message(e));
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function drop(event: DragEndEvent) {
    setActive(null);
    const status = event.over?.id as Status;
    if (!statuses.includes(status)) return;
    const task = tasks.find((t) => t.id === event.active.id);
    if (task && task.status !== status) void update({ ...task, status }, false);
  }
  const filtered = filterTasks(tasks, search, priority, label),
    done = tasks.filter((t) => t.status === "done").length,
    overdue = tasks.filter(
      (t) => dueState(t.due_date, t.status) === "overdue",
    ).length;
  const labels = [...new Set(tasks.flatMap((t) => t.labels))];
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="./">
          <span className="brand-mark">
            n<span>↗</span>
          </span>
          nextplay<span className="brand-period">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">N</span>
          <div>
            <strong>Nextplay workspace</strong>
            <small>Your ideas, in motion</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <button
          className="nav-item selected"
          onClick={() => {
            setSearch("");
            setPriority("");
            setLabel("");
          }}
        >
          <LayoutDashboard size={17} /> Project board{" "}
          <span>{tasks.length}</span>
        </button>
        <div className="sidebar-note">
          <span className="note-icon">
            <Sparkles size={19} />
          </span>
          <h3>
            Small steps.
            <br />
            Great things.
          </h3>
          <p>
            Make space for the work
            <br />
            that moves you forward.
          </p>
          <div className="note-art">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="guest">
          <span className="guest-avatar">G</span>
          <div>
            <strong>Guest workspace</strong>
            <small>
              <span className="online-dot" />
              {loading
                ? "Connecting…"
                : error
                  ? "Needs attention"
                  : saving
                    ? "Saving…"
                    : supabase
                      ? "Saved automatically"
                      : "Local demo"}
            </small>
          </div>
          <ShieldCheck size={16} />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>Project board</strong>
          </span>
          <div className="top-right">
            <span className="private-label">
              <ShieldCheck size={14} /> Only you
            </span>
            <SessionInfo connected={!!userId && !error} saving={saving} />
          </div>
        </header>
        <div className="main-content">
          <div className="eyebrow">
            <span /> A LITTLE FOCUS GOES A LONG WAY
          </div>
          <div className="page-heading">
            <div>
              <h1>
                Good ideas. Great execution<span>.</span>
              </h1>
              <p>
                A clear view of your work, from the first spark to the finish
                line.
              </p>
            </div>
            <button
              className="primary"
              disabled={loading || !userId || saving}
              onClick={() => newTask()}
            >
              <Plus size={17} /> New task
            </button>
          </div>
          <div className="overview">
            <div>
              <span className="stat-icon lavender">
                <Columns3 size={19} />
              </span>
              <div>
                <span>Total tasks</span>
                <strong>{tasks.length.toString().padStart(2, "0")}</strong>
              </div>
            </div>
            <div>
              <span className="stat-icon mint">
                <Check size={20} />
              </span>
              <div>
                <span>Completed</span>
                <strong>
                  {done.toString().padStart(2, "0")}
                  <small> / {tasks.length}</small>
                </strong>
              </div>
            </div>
            <div>
              <span className="stat-icon peach">
                <CalendarDays size={19} />
              </span>
              <div>
                <span>Overdue</span>
                <strong>{overdue.toString().padStart(2, "0")}</strong>
              </div>
            </div>
            <div className="progress-stat">
              <div>
                <span>Keep the momentum</span>
                <strong>
                  {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
                </strong>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <small>Every finished task is a step forward.</small>
            </div>
          </div>
          <div className="board-toolbar">
            <div className="board-tab">
              <Columns3 size={16} /> Board <span>{filtered.length}</span>
            </div>
            <div className="toolbar-controls">
              <label className="search">
                <Search size={16} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  aria-label="Search tasks"
                />
                <kbd>
                  {/Mac|iPhone|iPad/.test(navigator.platform)
                    ? "⌘ K"
                    : "Ctrl K"}
                </kbd>
              </label>
              <div className="filter">
                <Flag size={14} />
                <Choice
                  label="Filter by priority"
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: "", label: "All priorities" },
                    ...["high", "normal", "low"].map((p) => ({
                      value: p,
                      label: p[0].toUpperCase() + p.slice(1),
                    })),
                  ]}
                />
              </div>
              <div className="filter">
                <Tag size={14} />
                <Choice
                  label="Filter by label"
                  value={label}
                  onChange={setLabel}
                  options={[
                    { value: "", label: "All labels" },
                    ...labels.map((l) => ({ value: l, label: l })),
                  ]}
                />
              </div>
            </div>
          </div>
          {(search || priority || label) && (
            <div className="filter-summary">
              <span>
                Showing {filtered.length} of {tasks.length} tasks
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setPriority("");
                  setLabel("");
                }}
              >
                <X size={13} /> Clear filters
              </button>
            </div>
          )}
          {!supabase && (
            <div className="demo-banner">
              <span>
                <Sparkles size={14} /> You’re exploring the local demo. Changes
                are saved in this browser.
              </span>
              <span>Connect Supabase to sync ↗</span>
            </div>
          )}
          {error && (
            <div role="alert" className="error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => void load()} disabled={saving}>
                <RotateCw size={14} /> Retry loading
              </button>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              <LoaderCircle className="spin" /> Setting up your workspace…
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={(args) => {
                const pointer = pointerWithin(args);
                return pointer.length ? pointer : rectIntersection(args);
              }}
              onDragStart={(e) =>
                setActive(tasks.find((t) => t.id === e.active.id) || null)
              }
              onDragEnd={drop}
              onDragCancel={() => setActive(null)}
            >
              <div className="board" aria-busy={saving}>
                {statuses.map((status) => (
                  <Column
                    key={status}
                    status={status}
                    tasks={filtered.filter((t) => t.status === status)}
                    onNew={() => newTask(status)}
                    disabled={saving || !userId}
                    filtered={!!(search || priority || label)}
                    onOpen={(t) => {
                      if (!saving) {
                        setEditorError("");
                        setEditing(t);
                      }
                    }}
                  />
                ))}
              </div>
              <DragOverlay
                dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.2,0.8,0.2,1)",
                }}
              >
                {active ? (
                  <Card task={active} overlay onOpen={() => {}} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
          {notice && (
            <div className="toast" role="status">
              <Check size={16} />
              {notice}
            </div>
          )}
          <footer>
            <span>
              <span className="online-dot" />
              {saving
                ? "Saving changes…"
                : error
                  ? "Sync needs attention"
                  : supabase && userId
                    ? "All changes saved · Guest session"
                    : "Made for a little more clarity."}
            </span>
            <span>Drag to move · Open a card to edit</span>
          </footer>
        </div>
      </main>
      {editing && (
        <TaskDialog
          task={editing}
          existing={tasks.some((t) => t.id === editing.id)}
          saving={saving}
          error={editorError}
          onClearError={() => setEditorError("")}
          onClose={() => {
            if (!saving) setEditing(null);
          }}
          onSave={(t) => update(t)}
          onDelete={() => remove(editing)}
        />
      )}
    </div>
  );
}
function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String(e.message)
      : "Something went wrong. Please try again.";
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
