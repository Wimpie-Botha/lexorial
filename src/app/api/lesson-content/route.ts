import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// === GET /api/lesson-content?lesson_id=xxx ===
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lesson_id = searchParams.get("lesson_id");

    if (!lesson_id) {
      return NextResponse.json(
        { error: "Missing lesson_id parameter" },
        { status: 400 }
      );
    }

    // Fetch lesson + module info
    const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, title, intro, module_id")
        .eq("id", lesson_id)
        .single();


    if (lessonError) throw lessonError;

    // Fetch all linked content in parallel for speed
    const [videos, slides, flashcards, questions] = await Promise.all([
      supabase.from("videos").select("id, video_url").eq("lesson_id", lesson_id),
      supabase.from("slides").select("id, slide_url").eq("lesson_id", lesson_id),
      supabase.from("flashcards").select("id, word, translation, example_sentence").eq("lesson_id", lesson_id),
      supabase.from("questions").select("id, question_text, question_type, options, correct_answer").eq("lesson_id", lesson_id),
    ]);

    // Handle possible query errors
    if (videos.error) throw videos.error;
    if (slides.error) throw slides.error;
    if (flashcards.error) throw flashcards.error;
    if (questions.error) throw questions.error;

    // Return all content together
    return NextResponse.json(
      {
        lesson: lessonData,
        videos: videos.data,
        slides: slides.data,
        flashcards: flashcards.data,
        questions: questions.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching lesson content:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// === PUT /api/lesson-content ===
export async function PUT(request: Request) {
  try {
    const body = await request.text();
    const { lesson_id, video_url, flashcard_url, slide_url } = JSON.parse(body || "{}");

    if (!lesson_id) {
      return NextResponse.json(
        { error: "Missing required field: lesson_id" },
        { status: 400 }
      );
    }

    // === 🟢 1. Update or insert video
    if (video_url) {
      const { error: videoError } = await supabase
        .from("videos")
        .upsert(
          {
            lesson_id,
            video_url,
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" } // ensures we update existing row if it exists
        );

      if (videoError) throw videoError;
    }

    // === 🟢 2. Update or insert flashcard link (if applicable)
    if (flashcard_url) {
      const { error: flashError } = await supabase
        .from("flashcards")
        .upsert(
          {
            lesson_id,
            word: "Flashcard Link",
            translation: flashcard_url,
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" }
        );

      if (flashError) throw flashError;
    }

    // === 🟢 3. Update or insert slide info (if applicable)
    if (slide_url) {
      const { error: slideError } = await supabase
        .from("slides")
        .upsert(
          {
            lesson_id,
            slide_url,
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" }
        );

      if (slideError) throw slideError;
    }

    return NextResponse.json(
      { message: "Lesson content updated successfully." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error updating lesson content:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
