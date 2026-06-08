/**
 * Supabase Local Development - Quick Example
 *
 * This file demonstrates how to interact with your local Supabase instance.
 * Install the client: npm install @supabase/supabase-js
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

// These values come from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Create a typed Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// --- EXAMPLES ---

// Fetch all todos
async function getTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos:", error.message);
    return [];
  }
  return data;
}

// Add a new todo
async function addTodo(title: string) {
  const { data, error } = await supabase
    .from("todos")
    .insert({ title })
    .select()
    .single();

  if (error) {
    console.error("Error adding todo:", error.message);
    return null;
  }
  return data;
}

// Mark a todo as complete
async function completeTodo(id: number) {
  const { data, error } = await supabase
    .from("todos")
    .update({ is_complete: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error completing todo:", error.message);
    return null;
  }
  return data;
}

// Delete a todo
async function deleteTodo(id: number) {
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    console.error("Error deleting todo:", error.message);
    return false;
  }
  return true;
}

// --- Run the examples ---
async function main() {
  console.log("📋 Fetching todos...");
  const todos = await getTodos();
  console.log(todos);

  console.log("\n➕ Adding a new todo...");
  const newTodo = await addTodo("Try the Supabase power in Kiro");
  console.log(newTodo);

  if (newTodo) {
    console.log("\n✅ Marking it complete...");
    const completed = await completeTodo(newTodo.id);
    console.log(completed);
  }
}

main();
