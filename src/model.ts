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
  today = localDate(new Date()),
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

export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validateTask(task: Pick<Task, "title" | "description">) {
  const errors: { title?: string; description?: string } = {};
  if (!task.title.trim()) errors.title = "Give your task a title.";
  else if (task.title.trim().length > 160)
    errors.title = "Keep the title under 161 characters.";
  if (!task.description.trim())
    errors.description = "Add a description before saving this task.";
  else if (task.description.trim().length > 5000)
    errors.description = "Keep the description under 5,001 characters.";
  return errors;
}
