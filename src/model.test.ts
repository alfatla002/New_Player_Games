import { describe, it, expect } from "vitest";
import { dueState, filterTasks, type Task } from "./model";
describe("due indicators", () => {
  it("compares calendar dates and excludes completed tasks", () => {
    expect(dueState("2026-11-07", "todo", "2026-11-08")).toBe("overdue");
    expect(dueState("2026-11-08", "in_progress", "2026-11-08")).toBe("today");
    expect(dueState("2026-11-07", "done", "2026-11-08")).toBe("");
    expect(dueState(null, "todo", "2026-11-08")).toBe("");
    expect(dueState("2026-11-09", "todo", "2026-11-08")).toBe("");
  });
});
describe("board filtering", () => {
  const tasks = [
    { title: "Design lobby", priority: "high", labels: ["Design"] },
    { title: "Fix login", priority: "normal", labels: ["Engineering"] },
  ] as Task[];
  it("combines case-insensitive title, priority and label filters", () => {
    expect(filterTasks(tasks, "LOBBY", "high", "Design")).toHaveLength(1);
    expect(filterTasks(tasks, "lobby", "low", "")).toHaveLength(0);
    expect(filterTasks(tasks, "", "", "")).toHaveLength(2);
  });
});

import { validateTask, localDate } from "./model";
describe("task validation", () => {
  it("requires a non-blank title and description", () => {
    expect(validateTask({ title: "  ", description: "\n " })).toHaveProperty(
      "title",
    );
    expect(validateTask({ title: "Task", description: "  " })).toHaveProperty(
      "description",
    );
    expect(
      validateTask({ title: "Task", description: "Useful details" }),
    ).toEqual({});
  });
  it("keeps calendar dates in local time", () => {
    expect(localDate(new Date(2026, 0, 2, 0, 1))).toBe("2026-01-02");
  });
});
