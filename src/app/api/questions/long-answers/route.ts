import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// === GET: fetch long answers ===
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question_id = searchParams.get("question_id");

  if (!question_id)
    return NextResponse.json({ error: "Missing question_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("question_long_answers")
    .select("*")
    .eq("question_id", question_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

// === POST: add new accepted answer ===
export async function POST(request: Request) {
  try {
    const { question_id, accepted_answer } = await request.json();

    if (!question_id)
      return NextResponse.json(
        { error: "Missing question_id" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("question_long_answers")
      .insert([{ question_id, accepted_answer }])
      .select("*");

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (err: any) {
    console.error("Error creating long answer:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to create long answer" },
      { status: 500 }
    );
  }
}

// === PUT: update answer ===
export async function PUT(request: Request) {
  try {
    const { id, accepted_answer } = await request.json();

    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase
      .from("question_long_answers")
      .update({ accepted_answer })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Answer updated" }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating answer:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// === DELETE: remove long answer ===
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabase.from("question_long_answers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Answer deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting answer:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
