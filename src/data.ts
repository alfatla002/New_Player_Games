import { createClient } from "@supabase/supabase-js";
import type { Task } from "./model";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
const storageKey = "nextplay-demo-v1";
let pendingLoad: Promise<{ tasks: Task[]; userId: string }> | null = null;
export function loadBoard() {
  if (!pendingLoad)
    pendingLoad = fetchBoard().finally(() => {
      pendingLoad = null;
    });
  return pendingLoad;
}
async function fetchBoard(): Promise<{ tasks: Task[]; userId: string }> {
  if (Boolean(url) !== Boolean(key))
    throw new Error(
      "Set both Supabase environment values, then restart or rebuild the app.",
    );
  if (supabase) {
    const { data: existing, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    let user = existing.session?.user;
    if (!user) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      user = data.user ?? undefined;
    }
    if (!user) throw new Error("Could not start your guest session.");
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return { tasks: data, userId: user.id };
  }
  const saved = localStorage.getItem(storageKey);
  return { tasks: saved ? JSON.parse(saved) : seed(), userId: "local-demo" };
}
export async function saveTask(task: Task) {
  if (supabase) {
    const { error } = await supabase
      .from("tasks")
      .upsert(task)
      .select()
      .single();
    if (error) throw error;
  }
}
export async function deleteTask(id: string) {
  if (supabase) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  }
}
export function persistDemo(tasks: Task[]) {
  if (!supabase) localStorage.setItem(storageKey, JSON.stringify(tasks));
}
function seed(): Task[] {
  return [
    [
      "Map the player journey",
      "Understand the moments that matter, from first click to first win.",
      "todo",
      "high",
      "Research,Product",
    ],
    [
      "Explore the visual direction",
      "Collect a few references and find the right balance of playful and focused.",
      "todo",
      "normal",
      "Design",
    ],
    [
      "Build the onboarding flow",
      "Make every new player feel at home. Keep the first steps simple.",
      "in_progress",
      "high",
      "Product",
    ],
    [
      "Polish the game lobby",
      "Refine spacing, interaction states, and the little details.",
      "in_progress",
      "normal",
      "Design",
    ],
    [
      "Review mobile layouts",
      "Check the experience across smaller screens before shipping.",
      "in_review",
      "normal",
      "Design",
    ],
    [
      "Set up the project workspace",
      "A clean foundation for our next great idea.",
      "done",
      "low",
      "Engineering",
    ],
  ].map(([title, description, status, priority, labels], i) => ({
    id: crypto.randomUUID(),
    user_id: "local-demo",
    title,
    description,
    status: status as Task["status"],
    priority: priority as Task["priority"],
    labels: labels.split(","),
    due_date: i === 2 ? new Date().toLocaleDateString("en-CA") : null,
    created_at: new Date().toISOString(),
  }));
}
