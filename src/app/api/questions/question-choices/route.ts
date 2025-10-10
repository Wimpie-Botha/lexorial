import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


 // POST - Add Choice

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question_id, choice_text, order_index, is_correct } = body;

    if (!question_id || !choice_text)
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const { data, error } = await supabase
      .from("question_choices")
      .insert([{ question_id, choice_text, order_index: order_index || 1, is_correct: !!is_correct }])
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "✅ Choice added successfully", choice: data }, { status: 200 });
  } catch (err: any) {
    console.error("Error adding choice:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


   //PUT - Update Choice

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, choice_text, is_correct, order_index } = body;

    if (!id) return NextResponse.json({ error: "Missing choice ID." }, { status: 400 });

    const { error } = await supabase
      .from("question_choices")
      .update({ choice_text, is_correct, order_index, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "✅ Choice updated successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating choice:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


   //DELETE - Remove Choice
 
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Missing choice ID." }, { status: 400 });

    const { error } = await supabase.from("question_choices").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "✅ Choice deleted successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting choice:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
