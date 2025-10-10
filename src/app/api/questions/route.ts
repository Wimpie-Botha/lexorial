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

    //If long-form → insert accepted answers
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
    const { id, question_text, question_type, order_index } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("questions")
      .update({
        question_text,
        question_type,
        order_index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { message: "✅ Question updated successfully.", question: data?.[0] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Error updating question:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// === GET /api/questions?lesson_id=xyz ===
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lesson_id = searchParams.get("lesson_id");

  if (!lesson_id) {
    return NextResponse.json(
      { error: "Missing lesson_id" },
      { status: 400 }
    );
  }

  try {
    // Fetch base questions
    const { data: questions, error } = await supabase
      .from("questions")
      .select("id, lesson_id, question_text, question_type, order_index")
      .eq("lesson_id", lesson_id)
      .order("order_index", { ascending: true });

    if (error) throw error;

    // For each question, fetch its choices or long answers
    const questionsWithDetails = await Promise.all(
      questions.map(async (q) => {
        if (q.question_type === "multiple") {
          const { data: choices } = await supabase
            .from("question_choices")
            .select("*")
            .eq("question_id", q.id)
            .order("order_index", { ascending: true });
          return { ...q, choices };
        } else {
          const { data: long_answers } = await supabase
            .from("question_long_answers")
            .select("*")
            .eq("question_id", q.id);
          return { ...q, long_answers };
        }
      })
    );

    return NextResponse.json({ questions: questionsWithDetails });
  } catch (err: any) {
    console.error("Error fetching questions:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}