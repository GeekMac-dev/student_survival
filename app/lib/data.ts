import { supabase } from "./supabase";

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
  if (!error) return null;
  return error.message || "Database request failed";
}

export async function listSchedule(userId: string) {
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", userId)
    .order("day")
    .order("start_time");
  return { data: (data ?? []) as ScheduleItem[], error: cleanError(error) };
}

export async function addSchedule(userId: string, item: Omit<ScheduleItem, "id" | "user_id">) {
  const { error } = await supabase.from("schedule_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function listExpenseGroups(userId: string) {
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
  const { error } = await supabase.from("expense_members").update({ paid }).eq("id", id);
  return { error: cleanError(error) };
}

export async function listTasks(userId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as TaskItem[], error: cleanError(error) };
}

export async function addTask(userId: string, item: Omit<TaskItem, "id" | "user_id">) {
  const { error } = await supabase.from("tasks").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function listFoods(userId: string) {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("user_id", userId)
    .order("price");
  return { data: (data ?? []) as FoodItem[], error: cleanError(error) };
}

export async function addFood(userId: string, item: Omit<FoodItem, "id" | "user_id">) {
  const { error } = await supabase.from("food_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}

export async function listReviewers(userId: string) {
  const { data, error } = await supabase
    .from("reviewer_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as ReviewerItem[], error: cleanError(error) };
}

export async function addReviewer(userId: string, item: Omit<ReviewerItem, "id" | "user_id">) {
  const { error } = await supabase.from("reviewer_items").insert({ ...item, user_id: userId });
  return { error: cleanError(error) };
}
