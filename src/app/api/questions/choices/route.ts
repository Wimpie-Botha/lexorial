import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// === GET: fetch choices for a specific question ===
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question_id = searchParams.get("question_id");

  if (!question_id)
    return NextResponse.json({ error: "Missing question_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("question_choices")
    .select("*")
    .eq("question_id", question_id)
    .order("order_index");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

// === POST: add a new choice ===
export async function POST(request: Request) {
  try {
    const { question_id, choice_text, order_index, is_correct } = await request.json();

    if (!question_id)
      return NextResponse.json(
        { error: "Missing question_id" },
        { status: 400 }
      );

    // 🟢 1️⃣ Determine the next order_index dynamically
    const { count } = await supabase
      .from("question_choices")
      .select("*", { count: "exact", head: true })
      .eq("question_id", question_id);

    const nextOrder = (count || 0) + 1;

    // 🟢 2️⃣ Insert new choice with calculated order_index
    const { data, error } = await supabase
      .from("question_choices")
      .insert([
        {
          question_id,
          choice_text: choice_text || "",
          order_index: nextOrder,
          is_correct: !!is_correct,
        },
      ])
      .select("*")
      .single(); // ensures we return one object, not an array

    if (error) throw error;

    // 🟢 3️⃣ Return the inserted choice
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Error creating choice:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to create choice" },
      { status: 500 }
    );
  }
}

// === PUT: update existing choice ===
export async function PUT(request: Request) {
  try {
    const { id, choice_text, is_correct } = await request.json();

    if (!id)
      return NextResponse.json({ error: "Missing choice id" }, { status: 400 });

    const { error } = await supabase
      .from("question_choices")
      .update({ choice_text, is_correct })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Choice updated" }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating choice:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// === DELETE: remove a choice ===
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase.from("question_choices").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Choice deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting choice:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
