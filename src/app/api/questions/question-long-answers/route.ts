import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


  //POST - Add Long Answer
 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question_id, accepted_answer } = body;

    if (!question_id || !accepted_answer)
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

    const { data, error } = await supabase
      .from("question_long_answers")
      .insert([{ question_id, accepted_answer }])
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "✅ Long-form answer added", answer: data }, { status: 200 });
  } catch (err: any) {
    console.error("Error adding long-form answer:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


  //PUT - Update Long Answer

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, accepted_answer } = body;

    if (!id) return NextResponse.json({ error: "Missing answer ID." }, { status: 400 });

    const { error } = await supabase
      .from("question_long_answers")
      .update({ accepted_answer, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "✅ Long-form answer updated" }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating long-form answer:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


  //DELETE - Remove Long Answer
  
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Missing answer ID." }, { status: 400 });

    const { error } = await supabase.from("question_long_answers").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ message: "✅ Long-form answer deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting long-form answer:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
