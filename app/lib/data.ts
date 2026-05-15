import { isSupabaseConfigured, supabase, supabaseSetupMessage } from "./supabase";

export type ScheduleItem = {
  id: string;
  user_id: string;
  day: number;
  start_time: string;
  end_time: string;
  name: string;
  professor: string | null;
  room: string | null;
};

export type ExpenseGroup = {
  id: string;
  user_id: string;
  name: string;
  total: number;
  created_at?: string;
  members?: ExpenseMember[];
};

export type ExpenseMember = {
  id: string;
  group_id: string;
  name: string;
  amount: number;
  paid: boolean;
  is_self?: boolean;
};

export type TaskItem = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  deadline: string | null;
  notes: string | null;
  done?: boolean;
  created_at?: string;
};

export type FoodItem = {
  id: string;
  user_id: string;
  name: string;
  shop: string;
  price: number;
  distance: string | null;
  open: boolean;
};

export type ReviewerItem = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  author: string | null;
  price: number;
  pages: number | null;
  url: string | null;
  created_at?: string;
};

function cleanError(error: any) {
  if (!isSupabaseConfigured) return supabaseSetupMessage;
  if (!error) return null;
  return error.message || "Database request failed";
}

export async function listSchedule(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as ScheduleItem[], error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", userId)
    .order("day")
    .order("start_time");
  return { data: (data ?? []) as ScheduleItem[], error: cleanError(error) };
}

export async function addSchedule(userId: string, item: Omit<ScheduleItem, "id" | "user_id">) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("schedule_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function deleteSchedule(id: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  return { error: cleanError(error) };
}

export async function listExpenseGroups(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as ExpenseGroup[], error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("expense_groups")
    .select("*, members:expense_members(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as ExpenseGroup[], error: cleanError(error) };
}

export async function addExpenseGroup(
  userId: string,
  group: Pick<ExpenseGroup, "name" | "total">,
  members: Omit<ExpenseMember, "id" | "group_id">[]
) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("expense_groups")
    .insert({ ...group, user_id: userId })
    .select("id")
    .single();
  if (error || !data) return { error: cleanError(error) };
  const rows = members.map((m) => ({ ...m, group_id: data.id }));
  const memberResult = await supabase.from("expense_members").insert(rows);
  return { error: cleanError(memberResult.error) };
}

export async function updateExpenseMember(id: string, paid: boolean) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("expense_members").update({ paid }).eq("id", id);
  return { error: cleanError(error) };
}

export async function deleteExpenseGroup(id: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("expense_groups").delete().eq("id", id);
  return { error: cleanError(error) };
}

export async function listTasks(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as TaskItem[], error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as TaskItem[], error: cleanError(error) };
}

export async function addTask(userId: string, item: Omit<TaskItem, "id" | "user_id">) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("tasks").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function updateTaskDone(id: string, done: boolean) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  return { error: cleanError(error) };
}

export async function deleteTask(id: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return { error: cleanError(error) };
}

export async function listFoods(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as FoodItem[], error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("user_id", userId)
    .order("price");
  return { data: (data ?? []) as FoodItem[], error: cleanError(error) };
}

export async function addFood(userId: string, item: Omit<FoodItem, "id" | "user_id">) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("food_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function deleteFood(id: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  return { error: cleanError(error) };
}

export async function listReviewers(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as ReviewerItem[], error: supabaseSetupMessage };
  const { data, error } = await supabase
    .from("reviewer_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as ReviewerItem[], error: cleanError(error) };
}

export async function addReviewer(userId: string, item: Omit<ReviewerItem, "id" | "user_id">) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("reviewer_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function deleteReviewer(id: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase.from("reviewer_items").delete().eq("id", id);
  return { error: cleanError(error) };
}

// ── User Settings (GPA + Allowance persistence) ───────────────

export type GpaSubject = { name: string; units: number; grade: number };
export type AllowanceData = {
  weekly: string;
  food: string;
  transpo: string;
  school: string;
  other: string;
};
export type UserSettings = {
  gpa_subjects: GpaSubject[];
  allowance_data: AllowanceData;
};

export async function getUserSettings(userId: string) {
  if (!isSupabaseConfigured) return { data: null as UserSettings | null, error: null };
  const { data, error } = await supabase
    .from("user_settings")
    .select("gpa_subjects, allowance_data")
    .eq("user_id", userId)
    .maybeSingle();
  return { data: data as UserSettings | null, error: cleanError(error) };
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  if (!isSupabaseConfigured) return { error: null };
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  return { error: cleanError(error) };
}

// ── Wellness Logs ─────────────────────────────────────────────

export type WellnessLog = {
  id: string;
  user_id: string;
  mood: number;
  note: string | null;
  created_at: string;
};

export async function addWellnessLog(userId: string, mood: number, note: string) {
  if (!isSupabaseConfigured) return { error: supabaseSetupMessage };
  const { error } = await supabase
    .from("wellness_logs")
    .insert({ user_id: userId, mood, note: note.trim() || null });
  return { error: cleanError(error) };
}

export async function listWellnessLogs(userId: string) {
  if (!isSupabaseConfigured) return { data: [] as WellnessLog[], error: null };
  const { data, error } = await supabase
    .from("wellness_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(7);
  return { data: (data ?? []) as WellnessLog[], error: cleanError(error) };
}
