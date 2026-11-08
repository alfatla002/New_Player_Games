export const statuses = ["todo", "in_progress", "in_review", "done"] as const;
export type Status = (typeof statuses)[number];
export const names: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};
export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: Status;
  priority: "low" | "normal" | "high";
  due_date: string | null;
  labels: string[];
  created_at: string;
};
export function dueState(
  date: string | null,
  status: Status,
  today = new Date().toLocaleDateString("en-CA"),
) {
  if (!date || status === "done") return "";
  return date < today ? "overdue" : date === today ? "today" : "";
}
export function filterTasks(
  tasks: Task[],
  search: string,
  priority: string,
  label: string,
) {
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (!priority || t.priority === priority) &&
      (!label || t.labels.includes(label)),
  );
}
