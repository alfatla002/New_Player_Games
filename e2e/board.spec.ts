import { test, expect, type Page } from "@playwright/test";
async function create(page: Page, title = "Ship the next adventure") {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill(title);
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A carefully tested launch with a clear definition of done.");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.locator(".task-dialog")).toHaveCount(0);
}
async function choose(page: Page, label: string, option: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeEnabled();
});
test("create, edit, filter, persist and delete without browser confirmation", async ({
  page,
}) => {
  page.on("dialog", () => {
    throw Error("Unexpected native browser dialog");
  });
  await create(page);
  await page.getByLabel("Search tasks").fill("next adventure");
  await expect(page.locator(".task-card")).toHaveCount(1);
  await page.getByRole("heading", { name: "Ship the next adventure" }).click();
  await choose(page, "Status", "Done");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .locator(".column.done")
      .getByRole("heading", { name: "Ship the next adventure" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("heading", { name: "Ship the next adventure" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByText("Delete this task?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep task" }).click();
  await expect(
    page.getByText("Delete this task?", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ship the next adventure" }),
  ).toHaveCount(0);
});
test("requires meaningful title and description and defaults date to N/A", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(
    page.getByText("No due date · N/A", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByText("Give your task a title.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill("A new task");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("   ");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByText("Add a description before saving this task."),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Some useful context");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nextplay-demo-v1")!),
  );
  expect(
    saved.find((t: { title: string }) => t.title === "A new task").due_date,
  ).toBe(null);
});
test("calendar supports quick choices, arbitrary day selection, clear and Escape", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Choose a due date" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await expect(
    page.getByText("No due date · N/A", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Choose a due date" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Create a task" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await page
    .locator(".rdp-day:not(.rdp-outside) .rdp-day_button")
    .filter({ hasText: /^15$/ })
    .click();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await page.getByRole("button", { name: "No due date", exact: true }).click();
  await expect(
    page.getByText("No due date · N/A", { exact: true }),
  ).toBeVisible();
});
test("dirty close preserves edits until discard is confirmed", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill("Unsaved idea");
  await page.getByRole("button", { name: "Close task", exact: true }).click();
  await expect(
    page.getByText("Discard unsaved changes?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect(
    page.getByRole("textbox", { name: "Task title", exact: true }),
  ).toHaveValue("Unsaved idea");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeFocused();
});
test("pointer drag moves one preview, persists and leaves cards clickable", async ({
  page,
}) => {
  const card = page
    .locator(".task-card")
    .filter({
      has: page.getByRole("heading", { name: "Map the player journey" }),
    });
  const handle = await card
    .getByRole("button", { name: "Drag Map the player journey" })
    .boundingBox();
  const target = await page.locator(".column.done").boundingBox();
  if (!handle || !target) throw Error("Missing drag target");
  await page.mouse.move(handle.x + 10, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x + 20, handle.y + 20, { steps: 5 });
  await expect(page.locator(".task-card.overlay")).toHaveCount(1);
  await page.mouse.move(target.x + target.width / 2, target.y + 70, {
    steps: 25,
  });
  await expect(page.locator(".column.done")).toHaveClass(/drop-over/);
  await page.mouse.up();
  await expect(
    page
      .locator(".column.done")
      .getByRole("heading", { name: "Map the player journey" }),
  ).toBeVisible();
  await page.reload();
  await page
    .locator(".column.done")
    .getByRole("heading", { name: "Map the player journey" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Task details" }),
  ).toBeVisible();
});
test("keyboard dropdowns and filter reset work", async ({ page }) => {
  await page
    .getByRole("button", { name: "Filter by priority", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Filter by priority", exact: true }),
  ).toContainText("High");
  await expect(page.locator(".task-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".task-card")).toHaveCount(6);
});
test("save failure keeps draft editable and supports retry", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill("Keep my changes");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Details that should survive a failed save.");
  await page.evaluate(() => {
    (window as unknown as { originalSetItem: unknown }).originalSetItem =
      Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw Error("Storage unavailable");
    };
  });
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Your changes are still here",
  );
  await expect(
    page.getByRole("textbox", { name: "Task title", exact: true }),
  ).toHaveValue("Keep my changes");
  await page.evaluate(() => {
    Storage.prototype.setItem = (
      window as unknown as { originalSetItem: typeof Storage.prototype.setItem }
    ).originalSetItem;
  });
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Keep my changes" }),
  ).toBeVisible();
});
test("explains guest persistence and browser limitations", async ({ page }) => {
  await page.getByRole("button", { name: "How your work is saved" }).click();
  await expect(
    page.getByRole("heading", { name: "No sign-in needed." }),
  ).toBeVisible();
  await expect(page.getByText(/Clearing browser data/)).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("mobile board and calendar stay inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: "artifacts/board-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  const box = await page
    .getByRole("dialog", { name: "Choose a due date" })
    .boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  await page.screenshot({
    path: "artifacts/calendar-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("desktop visual states and dropdown Escape preserve the dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/board-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByRole("button", { name: "Status", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Create a task" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await page.screenshot({
    path: "artifacts/calendar-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("a failed drag rolls back instead of pretending the move was saved", async ({
  page,
}) => {
  const card = page
    .locator(".task-card")
    .filter({
      has: page.getByRole("heading", { name: "Map the player journey" }),
    });
  const handle = await card
    .getByRole("button", { name: "Drag Map the player journey" })
    .boundingBox();
  const target = await page.locator(".column.done").boundingBox();
  if (!handle || !target) throw Error("Missing drag target");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("Storage unavailable");
    };
  });
  await page.mouse.move(handle.x + 10, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x + 20, handle.y + 20, { steps: 5 });
  await page.mouse.move(target.x + target.width / 2, target.y + 70, {
    steps: 25,
  });
  await page.mouse.up();
  await expect(page.getByRole("alert")).toContainText(
    "Your previous status has been restored",
  );
  await expect(
    page
      .locator(".column.todo")
      .getByRole("heading", { name: "Map the player journey" }),
  ).toBeVisible();
});
test("reduced motion keeps the editor, calendar, and closing usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByRole("button", { name: "Due date Optional", exact: true })
    .click();
  await page.getByRole("button", { name: "No due date", exact: true }).click();
  await page.getByRole("button", { name: "Close task", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test('calendar remains usable on a narrow 320px screen',async({page})=>{
 await page.setViewportSize({width:320,height:568});await page.getByRole('button',{name:'New task',exact:true}).click();await page.getByRole('button',{name:'Due date Optional',exact:true}).click();
 const calendar=page.getByRole('dialog',{name:'Choose a due date'});
 const sizes=await calendar.evaluate(e=>({scroll:e.scrollWidth,width:e.clientWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
 await page.getByRole('button',{name:'Tomorrow',exact:true}).click();await expect(calendar).toHaveCount(0);await expect(page.getByText('No due date · N/A',{exact:true})).toHaveCount(0);
});
