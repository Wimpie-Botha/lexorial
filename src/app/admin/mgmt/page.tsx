"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Pencil, Save, Trash2, Plus, X} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Settings, LogOut, Home, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



interface Module {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  order_index?: number;
}

interface LessonContent {
  lesson_id: string;
  video_url?: string;
  flashcard_url?: string;
  slide_file?: File | null;
  preview_url?: string | null;
}

interface Lesson {
  id: string;
  title: string;
  order_index?: number;
  intro?: string; 
}


interface QuestionChoice {
  id: string;
  question_id: string;
  choice_text: string;
  order_index?: number;
  is_correct: boolean;
}

interface LongAnswer {
  id: string;
  question_id: string;
  accepted_answer: string;
}

interface Question {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: "multiple" | "long";
  order_index?: number;
  choices?: QuestionChoice[];
  long_answers?: LongAnswer[];
  isEditing?: boolean; 
  highlight?: boolean; 

}

export default function CoursesPage() {
  const [session, setSession] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [view, setView] = useState<"courses" | "questions">("courses");

  //question states

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"multiple" | "long">("multiple");
  const [choices, setChoices] = useState<{ choice_text: string; is_correct: boolean }[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const [lessonContent, setLessonContent] = useState<LessonContent>({
    lesson_id: "",
    video_url: "",
    flashcard_url: "",
    slide_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);





 // 🟢 UPDATED SECTION — persistent session handling
useEffect(() => {
  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
  };
  getSession();

  // Listen for auth state changes to auto-refresh
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  // Cleanup on unmount
  return () => {
    subscription.unsubscribe();
  };
}, []);


useEffect(() => {
  if (session) {
    console.log("✅ Session active:", session.user?.email);
  } else {
    console.warn("⚠️ No session found.");
  }
}, [session]);

  // === Fetch modules ===
useEffect(() => {
  if (!session) return;
  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modules", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch modules.");
      const data = await res.json();
      setModules(data.modules || []);
    } catch (err) {
      console.error("Error fetching modules:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchModules();
}, [session]);

  // === Fetch lessons ===
useEffect(() => {
  if (!selectedModule || !session) return;
  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons?moduleId=${selectedModule}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch lessons.");
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchLessons();
}, [selectedModule, session]);

  // === Fetch lesson content ===
// === Fetch lesson content (includes image preview) ===
useEffect(() => {
  if (!selectedLesson || !session) return;

  const fetchLessonContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lesson-content?lesson_id=${selectedLesson}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch lesson content.");
      const data = await res.json();

      if (lessonContent["preview_url"]) {
        URL.revokeObjectURL(lessonContent["preview_url"]);
      }

      setLessonContent({
        lesson_id: selectedLesson,
        video_url: data.videos?.[0]?.video_url || "",
        flashcard_url: data.flashcards?.[0]?.flashcard_url || "",
        slide_file: null,
      });

      //preload existing slide from DB
      if (data.slides && data.slides.length > 0 && data.slides[0].slide_url) {
        setPreviewImage(data.slides[0].slide_url);
      } else {
        setPreviewImage(null);
      }
    } catch (err) {
      console.error("Error fetching lesson content:", err);
      setPreviewImage(null);
    } finally {
      setLoading(false);
    }
  };

  fetchLessonContent();
}, [selectedLesson, session]);



// === Fetch Questions for selected lesson ===
useEffect(() => {
  if (!selectedLesson || !session) return;

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/questions?lesson_id=${selectedLesson}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch questions");

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  fetchQuestions();
}, [selectedLesson, session]);

// === Fetch choices ===
const fetchChoices = async (questionId: string) => {
  try {
    const res = await fetch(`/api/questions/choices?question_id=${questionId}`);
    if (!res.ok) throw new Error("Failed to fetch choices");
    return await res.json();
  } catch (err) {
    console.error("Error fetching choices:", err);
    return [];
  }
};

// === Fetch long answers ===
const fetchLongAnswers = async (questionId: string) => {
  try {
    const res = await fetch(`/api/questions/long-answers?question_id=${questionId}`);
    if (!res.ok) throw new Error("Failed to fetch long answers");
    return await res.json();
  } catch (err) {
    console.error("Error fetching long answers:", err);
    return [];
  }
};


const handleQuestionChange = (id: string, field: string, value: string) => {
  setQuestions((prev) =>
    prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
  );
};

const handleChoiceChange = (questionId: string, choiceId: string, text: string) => {
  setQuestions((prev) =>
    prev.map((q: Question) =>
      q.id === questionId
        ? {
            ...q,
            choices: q.choices?.map((c: QuestionChoice) =>
              c.id === choiceId ? { ...c, choice_text: text } : c
            ),
          }
        : q
    )
  );
};


const saveQuestionChanges = async (id: string) => {
  try {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    const res = await fetch("/api/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question),
    });

    if (!res.ok) throw new Error("Failed to update question");
    alert("✅ Question updated!");
  } catch (err) {
    console.error("Error saving question:", err);
    alert("❌ Failed to save question.");
  }
};

const handleQuestionTextChange = (id: string, newText: string) => {
  setQuestions((prev) =>
    prev.map((q) => (q.id === id ? { ...q, question_text: newText } : q))
  );
};

const handleSaveQuestion = async (question: Question) => {
  try {
    // Build request body
    const payload: any = {
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
    };

    // ✅ Include related data so Supabase won’t clear them
    if (question.question_type === "multiple" && question.choices) {
      payload.choices = question.choices.map((c) => ({
        id: c.id,
        choice_text: c.choice_text,
        is_correct: c.is_correct,
        order_index: c.order_index || 0,
      }));
    }

    if (question.question_type === "long" && question.long_answers) {
      payload.long_answers = question.long_answers.map((a) => ({
        id: a.id,
        accepted_answer: a.accepted_answer,
      }));
    }

    const res = await fetch("/api/questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    alert("✅ Question updated successfully!");
  } catch (err: any) {
    console.error("Error updating question:", err);
    alert("❌ Failed to update question.");
  }
};


// Local edits
const handleModuleTitleChange = (id: string, title: string) => {
  setModules((prev) => prev.map((m) => (m.id === id ? { ...m, title } : m)));
  setUnsavedChanges(true);
};

const handleLessonTitleChange = (id: string, title: string) => {
  setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, title } : l)));
  setUnsavedChanges(true);
};

const handleIntroChange = (value: string) => {
  setLessons((prevLessons) =>
    prevLessons.map((lesson) =>
      lesson.id === selectedLesson
        ? { ...lesson, intro: value } // update the intro for the selected lesson
        : lesson
    )
  );
  setUnsavedChanges(true); // mark unsaved changes so Save button appears
};

// Handle lesson content change 
const handleContentChange = (field: keyof LessonContent, value: any) => {
  setLessonContent((prev) => ({ ...prev, [field]: value }));
  setUnsavedChanges(true);
};

//UPDATED SECTION: addModule now creates module directly in DB
const addModule = async () => {
  if (!session) return alert("Session expired. Please log in again.");

  const res = await fetch("/api/modules", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title: "New Module",
      description: "Edit this module description",
      level: modules.length + 1,
    }),
  });

  const data = await res.json();
  if (res.ok && data.module) {
    setModules((prev) => [...prev, data.module]);
    setSelectedModule(data.module.id);
    setEditingModuleId(data.module.id);
    setLessons([]);
    setSelectedLesson("");
  } else {
    console.error("Error adding module:", data.error);
    alert("❌ Failed to add module.");
  }
};

//UPDATED SECTION: deleteModule now calls API route
const deleteModule = async (id: string) => {
  if (!id) {
    console.warn("⚠️ Tried to delete module without ID");
    alert("❌ Cannot delete unsaved module.");
    return;
  }

  console.log("🧩 Deleting module with ID:", id);

  if (!confirm("Delete this module and all its lessons?")) return;

  try {
    const res = await fetch("/api/modules", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");

    setModules((prev) => prev.filter((m) => m.id !== id));
    if (selectedModule === id) {
      setSelectedModule("");
      setLessons([]);
    }

    alert("✅ Module deleted successfully.");
  } catch (err: any) {
    console.error("Error deleting module:", err.message);
    alert("❌ Failed to delete module.");
  }
};


//UPDATED SECTION: addLesson now inserts directly in DB
const addLesson = async () => {
  if (!session) return alert("Session expired. Please log in again.");
  if (!selectedModule) return alert("Select a module first.");

  const res = await fetch("/api/lessons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      module_id: selectedModule,
      title: "New Lesson",
      order_index: lessons.length + 1,
    }),
  });

  const data = await res.json();
  if (res.ok && data.lesson) {
    setLessons((prev) => [...prev, data.lesson]);
    setSelectedLesson(data.lesson.id);
    setEditingLessonId(data.lesson.id);
  } else {
    console.error("Error adding lesson:", data.error);
    alert("❌ Failed to add lesson.");
  }
};

// === Toggle inline edit mode for a question ===
const toggleEditMode = (questionId: string, isEditing: boolean) => {
  setQuestions((prev) =>
    prev.map((q) =>
      q.id === questionId ? { ...q, isEditing } : q
    )
  );
};

// === Delete a question ===
const handleDeleteQuestion = async (questionId: string) => {
  if (!confirm("Are you sure you want to delete this question?")) return;

  try {
    const res = await fetch(`/api/questions?id=${questionId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete question.");

    // Remove from local state
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    alert("✅ Question deleted successfully!");
  } catch (err) {
    console.error("Error deleting question:", err);
    alert("❌ Failed to delete question.");
  }
};

const deleteLesson = async (id: string) => {
  if (!confirm("Delete this lesson?")) return;

  try {
    const res = await fetch("/api/lessons", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id }), // 🟢 FIX: ensure JSON body
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unknown error");

    setLessons((prev) => prev.filter((l) => l.id !== id));
    if (selectedLesson === id) setSelectedLesson("");

    alert("✅ Lesson deleted successfully.");
  } catch (err: any) {
    console.error("Error deleting lesson:", err.message);
    alert("❌ Failed to delete lesson.");
  }
};

const saveAll = () => {
  console.log("Modules:", modules);
  console.log("Lessons:", lessons);
  console.log("Lesson content:", lessonContent);
  alert("✅ Changes saved locally (connect to API later)");
  setUnsavedChanges(false);
};


const router = useRouter();
const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/auth/login");
};


const addQuestion = async () => {
if (!selectedLesson || !session) return alert("Select a lesson first.");

  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        lesson_id: selectedLesson,
        question_text: newQuestionText,
        question_type: newQuestionType,
        choices: newQuestionType === "multiple" ? choices : [],
        accepted_answers: newQuestionType === "long" ? answers : [],
      }),
    });

    console.log("🟣 Sending question:", newQuestionType);

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add question");

    setQuestions((prev) => [...prev, data.question]);
    setNewQuestionText("");
    setChoices([]);
    setAnswers([]);
    alert("✅ Question added!");
  } catch (err: any) {
    console.error("Error adding question:", err.message);
    alert("❌ Failed to add question.");
  }
};

const handleExpandQuestion = async (id: string, type: "multiple" | "long") => {
  if (editingQuestionId === id) {
    setEditingQuestionId(null);
    return;
  }

  let choices: QuestionChoice[] = [];
  let longAnswers: LongAnswer[] = [];

  if (type === "multiple") {
    const data = await fetchChoices(id);
    choices = data.choices || data; // ✅ handles both array or { choices: [...] }
  } else {
    const data = await fetchLongAnswers(id);
    longAnswers = data.long_answers || data; // ✅ same logic
  }

  setQuestions((prev) =>
    prev.map((q) =>
      q.id === id ? { ...q, choices, long_answers: longAnswers } : q
    )
  );

  setEditingQuestionId(id);
};

// === ADD Choice ===
const handleAddChoice = async (questionId: string) => {
  try {
    const res = await fetch("/api/questions/choices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: questionId,
        choice_text: "",
        order_index: 0,
        is_correct: false,
      }),
    });
    if (!res.ok) throw new Error("Failed to add choice");
    const newChoice = await res.json();

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, choices: [...(q.choices || []), newChoice] }
          : q
      )
    );
  } catch (err) {
    console.error(err);
  }
};

// === EDIT Choice text ===
const handleChoiceEdit = async (questionId: string, choiceId: string, newText: string) => {
  // update local state immediately
  setQuestions((prev) =>
    prev.map((q) =>
      q.id === questionId
        ? {
            ...q,
            choices: q.choices?.map((c) =>
              c.id === choiceId ? { ...c, choice_text: newText } : c
            ),
          }
        : q
    )
  );

  // 🟢 also persist to DB
  try {
    await fetch("/api/questions/choices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: choiceId, choice_text: newText }),
    });
  } catch (err) {
    console.error("Error saving choice text:", err);
  }
};

// === Toggle correct ===
const handleChoiceToggle = async (questionId: string, choiceId: string, checked: boolean) => {
  try {
    await fetch("/api/questions/choices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: choiceId, is_correct: checked }),
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices?.map((c) =>
                c.id === choiceId ? { ...c, is_correct: checked } : c
              ),
            }
          : q
      )
    );
  } catch (err) {
    console.error("Error updating choice:", err);
  }
};

// === Delete Choice ===
const handleDeleteChoice = async (id: string) => {
  try {
    await fetch(`/api/questions/choices?id=${id}`, { method: "DELETE" });
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        choices: q.choices?.filter((c) => c.id !== id),
      }))
    );
  } catch (err) {
    console.error("Error deleting choice:", err);
  }
};

// === ADD / EDIT / DELETE Long Answers (same idea) ===
const handleAddAnswer = async (questionId: string) => {
  const res = await fetch("/api/questions/long-answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, accepted_answer: "" }),
  });
  const newAns = await res.json();
  setQuestions((prev) =>
    prev.map((q) =>
      q.id === questionId
        ? { ...q, long_answers: [...(q.long_answers || []), newAns] }
        : q
    )
  );
};

const handleAnswerEdit = async (questionId: string, ansId: string, newText: string) => {
  // 1️⃣ update locally
  setQuestions((prev) =>
    prev.map((q) =>
      q.id === questionId
        ? {
            ...q,
            long_answers: q.long_answers?.map((a) =>
              a.id === ansId ? { ...a, accepted_answer: newText } : a
            ),
          }
        : q
    )
  );

  // 2️⃣ update in database
  try {
    const res = await fetch("/api/questions/long-answers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ansId, accepted_answer: newText }),
    });

    if (!res.ok) {
      console.error("❌ Failed to update long answer:", await res.text());
    }
  } catch (err) {
    console.error("Error updating long answer:", err);
  }
};

const handleDeleteAnswer = async (id: string) => {
  await fetch(`/api/questions/long-answers?id=${id}`, { method: "DELETE" });
  setQuestions((prev) =>
    prev.map((q) => ({
      ...q,
      long_answers: q.long_answers?.filter((a) => a.id !== id),
    }))
  );
};





  // === Save all changes ===
// 🟢 UPDATED SECTION: cleaner saveAllChanges
const saveAllChanges = async () => {
  try {
    if (!session) return alert("Session expired. Please log in again.");

    // === Update modules ===
    for (const mod of modules) {
      await fetch("/api/modules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(mod),
      });

      await fetch(`/api/lesson-content?lesson_id=${selectedLesson}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.slides && data.slides[0]?.slide_url) {
          setPreviewImage(data.slides[0].slide_url);
        }
      });


    }

    // === Update lessons ===
    for (const lesson of lessons) {
      await fetch("/api/lessons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(lesson),
      });
    }

    // === Update lesson content ===
if (selectedLesson && lessonContent) {
  const formData = new FormData();
  formData.append("lesson_id", selectedLesson);
  formData.append("video_url", lessonContent.video_url || "");
  formData.append("flashcard_url", lessonContent.flashcard_url || "");
  if (lessonContent.slide_file) {
    formData.append("slide_file", lessonContent.slide_file);
  }

  await fetch("/api/lesson-content", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      // ❗ Do NOT set Content-Type manually — the browser sets the correct multipart boundary automatically
    },
    body: formData,
  });
}

    alert("✅ All changes saved successfully!");
    setUnsavedChanges(false);
  } catch (err) {
    console.error("Error saving changes:", err);
    alert("❌ Failed to save changes.");
  }
};

  return (
  <div className="flex h-screen bg-gray-50">
    {/* === SIDEBAR === */}
    <aside className="w-64 border-r border-gray-200 flex flex-col justify-between py-6 px-4 shadow-md bg-white">
      <div>
        <div className="flex flex-col items-center mb-6">
          <img
            src={`https://ui-avatars.com/api/?name=${session?.user?.email || "Admin"}&background=24C655&color=fff`}
            alt="Profile"
            className="w-16 h-16 rounded-full shadow-sm mb-3"
          />
          <p className="text-gray-700 font-medium text-sm text-center truncate w-full">
            {session?.user?.email}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setView("courses")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === "courses"
                ? "bg-green-100 text-green-700"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <Home size={16} /> Manage Courses
          </button>

          <button
            onClick={() => setView("questions")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === "questions"
                ? "bg-green-100 text-green-700"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <HelpCircle size={16} /> Questions
          </button>

          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 text-gray-700">
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        <LogOut size={16} /> Logout
      </button>
    </aside>

    {/* === MAIN CONTENT AREA === */}
    <div className="flex-1 p-10 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <AnimatePresence mode="wait">
          {view === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* === MANAGE COURSES === */}
              <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Manage Courses
              </h1>

          {/* === MODULES === */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Modules</h2>
              <button
                onClick={addModule}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <ul className="border-t border-gray-200 pt-2">
              {modules.map((mod) => (
                <li
                  key={mod.id}
                  className={`flex justify-between items-center border-b border-gray-100 py-2 px-2 rounded-md transition-all ${
                    selectedModule === mod.id
                      ? "bg-green-50 border-green-400"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setSelectedModule(mod.id);
                    setSelectedLesson("");
                  }}
                >
                  {editingModuleId === mod.id ? (
                    <input
                      className="border border-gray-300 rounded-md p-1 text-sm flex-1 mr-2"
                      value={mod.title}
                      onChange={(e) =>
                        handleModuleTitleChange(mod.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-gray-700 text-sm flex-1">
                      {mod.title}
                    </span>
                  )}

                  {editingModuleId === mod.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(null);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Save size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(mod.id);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(mod.id);
                    }}
                    className="text-red-500 hover:text-red-700 ml-3"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* === LESSONS === */}
          {selectedModule && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Lessons</h2>
                <button
                  onClick={addLesson}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <ul className="mb-6 border-t border-gray-200 pt-2">
                {lessons.map((lesson, i) => (
                  <li
                    key={lesson.id}
                    className={`flex justify-between items-center border-b border-gray-100 py-2 px-2 rounded-md transition-all ${
                      selectedLesson === lesson.id
                        ? "bg-green-50 border-green-400"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedLesson(lesson.id)}
                  >
                    {editingLessonId === lesson.id ? (
                      <input
                        className="border border-gray-300 rounded-md p-1 text-sm flex-1 mr-2"
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonTitleChange(lesson.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-gray-700 text-sm flex-1">
                        {i + 1}. {lesson.title}
                      </span>
                    )}

                    {editingLessonId === lesson.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLessonId(null);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLessonId(lesson.id);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLesson(lesson.id);
                      }}
                      className="text-red-500 hover:text-red-700 ml-3"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* === LESSON CONTENT === */}
          {selectedLesson && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Lesson Content
              </h3>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Description (Intro)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3 min-h-[100px]"
                placeholder="Enter a short description or introduction for this lesson..."
                value={lessons.find((l) => l.id === selectedLesson)?.intro || ""}
                onChange={(e) => handleIntroChange(e.target.value)}
              />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              🎬 Video URL
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3"
              value={lessonContent.video_url}
              onChange={(e) =>
                handleContentChange("video_url", e.target.value)
              }
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              🧠 Geniully (Flashcards)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3"
              value={lessonContent.flashcard_url}
              onChange={(e) =>
                handleContentChange("flashcard_url", e.target.value)
              }
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              🖼️ Slide / PNG Upload
            </label>
            <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleContentChange("slide_file", file);

                  // 🟢 Live preview (temporary URL for local display)
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setLessonContent((prev) => ({
                      ...prev,
                      preview_url: previewUrl, // we'll add this dynamically
                    }));
                  }
                }}
              />


              {/* 🖼️ Existing Slide Preview */}
              {previewImage ? (
                <div className="mt-3">
                  <p className="text-sm text-gray-400">Current Slide:</p>
                  <img
                    src={previewImage}
                    alt="Lesson slide preview"
                    className="w-48 h-32 object-cover rounded-lg border border-gray-600 shadow-md"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500 italic">
                  No slide uploaded yet for this lesson.
                </p>
              )}


                      {lessonContent.slide_file && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">
                Selected: {lessonContent.slide_file.name}
              </p>

                {/* 🖼️ Live Preview */}
                {lessonContent["preview_url"] && (
                  <img
                    src={lessonContent["preview_url"]}
                    alt="Slide preview"
                    className="mt-2 rounded-md border border-gray-300 shadow-sm w-full max-h-64 object-contain"
                  />
                )}
              </div>
            )}
          </div>
        )}


        {/* === SAVE BUTTON === */}
       {unsavedChanges && (
            <button
              onClick={saveAllChanges}
              className="mt-6 w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-all"
            >
              💾 Save All Changes
            </button>
          )}
        </motion.div>
      )}

      {/* === QUESTIONS VIEW === */}
      {view === "questions" && (
        <motion.div
          key="questions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Manage Questions
          </h1>

          <div className="space-y-4">
            <p className="text-gray-500">
              Select a module and lesson to manage questions.
            </p>

            {/* Module dropdown */}
            <div>
              <label className="text-sm font-medium text-gray-700">Module</label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="">Select Module</option>
                {modules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson dropdown */}
            {selectedModule && (
              <div>
                <label className="text-sm font-medium text-gray-700">Lesson</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                >
                  <option value="">Select Lesson</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            )}



            {selectedLesson && (
              <div className="mt-6">
                {/* Add Question Section */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Question</h3>

                  {/* Question Text */}
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3"
                    placeholder="Enter your question text..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                  />

                  {/* Question Type Selector */}
                  <div className="flex items-center gap-4 mb-3">
                    <label className="text-sm font-medium text-gray-700">Question Type:</label>
                    <select
                      className="border border-gray-300 rounded-md p-2 text-sm"
                      value={newQuestionType}
                      onChange={(e) => {
                        const type = e.target.value as "multiple" | "long";
                        setNewQuestionType(type);
                        setChoices([]);
                        setAnswers([]);
                      }}
                    >
                      <option value="multiple">Multiple Choice</option>
                      <option value="long">Long Form</option>
                    </select>
                  </div>

                  {/* Multiple Choice Editor */}
                  {newQuestionType === "multiple" && (
                    <div className="space-y-2 mb-3">
                      {choices.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={c.choice_text}
                            onChange={(e) => {
                              const updated = [...choices];
                              updated[i].choice_text = e.target.value;
                              setChoices(updated);
                            }}
                            placeholder={`Choice ${i + 1}`}
                            className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                          />
                          <input
                            type="checkbox"
                            checked={c.is_correct}
                            onChange={(e) => {
                              const updated = [...choices];
                              updated[i].is_correct = e.target.checked;
                              setChoices(updated);
                            }}
                          />
                          <button
                            onClick={() => setChoices((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setChoices([...choices, { choice_text: "", is_correct: false }])}
                        className="text-sm text-green-600 hover:underline"
                      >
                        + Add Choice
                      </button>
                    </div>
                  )}

                  {/* Long Form Editor */}
                  {newQuestionType === "long" && (
                    <div className="space-y-2 mb-3">
                      {answers.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={a}
                            onChange={(e) => {
                              const updated = [...answers];
                              updated[i] = e.target.value;
                              setAnswers(updated);
                            }}
                            placeholder={`Accepted Answer ${i + 1}`}
                            className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                          />
                          <button
                            onClick={() => setAnswers((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setAnswers([...answers, ""])}
                        className="text-sm text-green-600 hover:underline"
                      >
                        + Add Accepted Answer
                      </button>
                    </div>
                  )}

                  <button
                    onClick={addQuestion}
                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                  >
                    + Save Question
                  </button>
                </div>


                  {/* === EXISTING QUESTIONS === */}
                <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-3">
                  Existing Questions
                </h2>

                <ul className="border-t border-gray-200 pt-2">
                  {questions.map((q) => (
                    <li
                      key={q.id}
                      className={`flex flex-col border-b border-gray-100 rounded-md transition-all ${
                        editingQuestionId === q.id
                          ? "bg-green-50 border-green-400"
                          : "hover:bg-gray-50"
                      }`}
                    >
                        {/* === Header Row === */}
                        <div
                          className="flex justify-between items-center px-3 py-2 cursor-pointer"
                          onClick={() => handleExpandQuestion(q.id, q.question_type)}
                        >
                          <span className="text-gray-800 text-sm flex-1">
                            {q.question_text}
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="text-xs italic text-gray-500">
                              Type: {q.question_type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEditMode(q.id, true);
                              }}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(q.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* === Inline Edit Mode === */}
                       {q.isEditing && (
                          <div className="flex items-center gap-2 px-3 pb-2">
                            <input
                              type="text"
                              value={q.question_text}
                              onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                              onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveQuestion(q);
                                toggleEditMode(q.id, false);
                                e.currentTarget.blur(); // ✅ exit typing mode

                                // ✅ trigger the green flash
                                setQuestions((prev) =>
                                  prev.map((qq) =>
                                    qq.id === q.id ? { ...qq, highlight: true } : qq
                                  )
                                );
                                setTimeout(() => {
                                  setQuestions((prev) =>
                                    prev.map((qq) =>
                                      qq.id === q.id ? { ...qq, highlight: false } : qq
                                    )
                                  );
                                }, 800);
                              } else if (e.key === "Escape") {
                                toggleEditMode(q.id, false);
                              }
                            }}
                              className="flex-1 border border-gray-300 rounded-md p-1 text-sm"
                              autoFocus
                            />

                            <button
                              onClick={() => toggleEditMode(q.id, false)}
                              className="text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        {/* === Expanded Content (Choices / Answers) === */}
                        {editingQuestionId === q.id && (
                            <div
                            className={`p-4 border-t border-gray-200 transition-all duration-500 ${
                              q.highlight ? "bg-green-100" : "bg-gray-50"
                            }`}
                            >
                            {/* === Multiple Choice Answers === */}
                            {q.question_type === "multiple" && (
                            <div className="space-y-2">
                              {q.choices?.map((choice) => (
                                <div
                                  key={choice.id}
                                  className="flex justify-between items-center border-b border-gray-100 pb-1"
                                >
                                  <input
                                    type="text"
                                    value={choice.choice_text ?? ""}
                                    onChange={(e) => {
                                      // update local state immediately
                                      setQuestions((prev) =>
                                        prev.map((qq) =>
                                          qq.id === q.id
                                            ? {
                                                ...qq,
                                                choices: qq.choices?.map((c) =>
                                                  c.id === choice.id
                                                    ? { ...c, choice_text: e.target.value }
                                                    : c
                                                ),
                                              }
                                            : qq
                                        )
                                      );
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleChoiceEdit(q.id, choice.id, choice.choice_text);
                                        e.currentTarget.blur(); // ✅ exit typing

                                        // ✅ flash the parent question card
                                        setQuestions((prev) =>
                                          prev.map((qq) =>
                                            qq.id === q.id ? { ...qq, highlight: true } : qq
                                          )
                                        );
                                        setTimeout(() => {
                                          setQuestions((prev) =>
                                            prev.map((qq) =>
                                              qq.id === q.id ? { ...qq, highlight: false } : qq
                                            )
                                          );
                                        }, 800);
                                      } else if (e.key === "Escape") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="flex-1 bg-transparent p-1 text-sm border-none focus:ring-0 focus:outline-none"
                                    placeholder="Enter choice text..."
                                  />

                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center text-xs text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={choice.is_correct}
                                        onChange={(e) =>
                                          handleChoiceToggle(q.id, choice.id, e.target.checked)
                                        }
                                        className="mr-1"
                                      />
                                      Correct
                                    </label>
                                    <button
                                      onClick={() => handleDeleteChoice(choice.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              <button
                                onClick={() => handleAddChoice(q.id)}
                                className="text-green-600 text-sm hover:text-green-700 mt-2"
                              >
                                <Plus size={14} className="inline mr-1" /> Add Choice
                              </button>
                            </div>
                          )}

                            {/* === Long Answers === */}
                            {q.question_type === "long" && (
                              <div className="space-y-2">
                                {q.long_answers?.map((ans) => (
                                  <div
                                    key={ans.id}
                                    className="flex justify-between items-center border-b border-gray-100 pb-1"
                                  >
                                    <input
                                      type="text"
                                      value={ans.accepted_answer ?? ""}
                                      onChange={(e) => {
                                        // local update only
                                        setQuestions((prev) =>
                                          prev.map((qq) =>
                                            qq.id === q.id
                                              ? {
                                                  ...qq,
                                                  long_answers: qq.long_answers?.map((a) =>
                                                    a.id === ans.id
                                                      ? { ...a, accepted_answer: e.target.value }
                                                      : a
                                                  ),
                                                }
                                              : qq
                                          )
                                        );
                                      }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAnswerEdit(q.id, ans.id, ans.accepted_answer);
                                        e.currentTarget.blur(); // ✅ exit typing

                                        // ✅ flash the question area
                                        setQuestions((prev) =>
                                          prev.map((qq) =>
                                            qq.id === q.id ? { ...qq, highlight: true } : qq
                                          )
                                        );
                                        setTimeout(() => {
                                          setQuestions((prev) =>
                                            prev.map((qq) =>
                                              qq.id === q.id ? { ...qq, highlight: false } : qq
                                            )
                                          );
                                        }, 800);
                                      } else if (e.key === "Escape") {
                                        e.currentTarget.blur();
                                      }
                                    }}

                                      className="flex-1 bg-transparent p-1 text-sm border-none focus:ring-0 focus:outline-none"
                                      placeholder="Enter accepted answer..."
                                    />
                                    <button
                                      onClick={() => handleDeleteAnswer(ans.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddAnswer(q.id)}
                                  className="text-green-600 text-sm hover:text-green-700 mt-2"
                                >
                                  <Plus size={14} className="inline mr-1" /> Add Answer
                                </button>
                              </div>
                            )}


                          </div>
                        )}
                      </li>
                    ))}
                  </ul>              
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div> 
</div>
  );
}       
