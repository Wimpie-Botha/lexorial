import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role for write access
);

//create new question (multiple choice or long form)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lesson_id, question_text, question_type, choices, accepted_answers, order_index } = body;

    if (!lesson_id || !question_text || !question_type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    //Create main question
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .insert([
        {
          lesson_id,
          question_text,
          question_type,
          order_index: order_index || 1,
          created_at: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (questionError) throw questionError;

    const question_id = questionData.id;

    console.log("🟢 Incoming question data:", body);

    //If multiple choice → insert choices
    if (question_type === "multiple" && choices?.length > 0) {
      const choiceInserts = choices.map((c: any, i: number) => ({
        question_id,
        choice_text: c.choice_text,
        order_index: i + 1,
        is_correct: !!c.is_correct,
      }));

      const { error: choiceError } = await supabase.from("question_choices").insert(choiceInserts);
      if (choiceError) throw choiceError;
    }

    // 3️⃣ If long-form → insert accepted answers
    if (question_type === "long" && accepted_answers?.length > 0) {
      const answerInserts = accepted_answers.map((ans: string) => ({
        question_id,
        accepted_answer: ans,
      }));

      const { error: answerError } = await supabase.from("question_long_answers").insert(answerInserts);
      if (answerError) throw answerError;
    }

    return NextResponse.json({ message: "✅ Question created successfully", question: questionData }, { status: 200 });
  } catch (err: any) {
    console.error("Error creating question:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

//update question (text, type, choices, answers)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, question_text, question_type, choices, accepted_answers } = body;

    if (!id) return NextResponse.json({ error: "Missing question ID." }, { status: 400 });

    //Update question main data
    const { error: questionError } = await supabase
      .from("questions")
      .update({
        question_text,
        question_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (questionError) throw questionError;

    //Handle multiple-choice updates
    if (question_type === "multiple") {
      // delete old choices first to avoid duplicates
      await supabase.from("question_choices").delete().eq("question_id", id);

      if (choices?.length > 0) {
        const inserts = choices.map((c: any, i: number) => ({
          question_id: id,
          choice_text: c.choice_text,
          order_index: i + 1,
          is_correct: !!c.is_correct,
        }));

        const { error: insertError } = await supabase.from("question_choices").insert(inserts);
        if (insertError) throw insertError;
      }
    }

    //Handle long-form updates
    if (question_type === "long") {
      await supabase.from("question_long_answers").delete().eq("question_id", id);

      if (accepted_answers?.length > 0) {
        const inserts = accepted_answers.map((a: string) => ({
          question_id: id,
          accepted_answer: a,
        }));

        const { error: insertError } = await supabase.from("question_long_answers").insert(inserts);
        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ message: "✅ Question updated successfully." }, { status: 200 });
  } catch (err: any) {
    console.error("Error updating question:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
