"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Save, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
}

export default function CoursesPage() {
  const [session, setSession] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent>({
    lesson_id: "",
    video_url: "",
    flashcard_url: "",
    slide_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // === 🔐 Load current Supabase session ===
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  // === Fetch Modules ===
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

  // === Fetch Lessons when module changes ===
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

  // === Fetch Lesson Content when lesson changes ===
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
        setLessonContent({
          lesson_id: selectedLesson,
          video_url: data.videos?.[0]?.video_url || "",
          flashcard_url: data.flashcards?.[0]?.flashcard_url || "",
          slide_file: null,
        });
      } catch (err) {
        console.error("Error fetching lesson content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessonContent();
  }, [selectedLesson, session]);

  // === Handle inline edit for lesson name ===
  const handleLessonNameChange = (lessonId: string, newTitle: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, title: newTitle } : l))
    );
    setUnsavedChanges(true);
  };

  // === Handle lesson content change ===
  const handleContentChange = (field: keyof LessonContent, value: any) => {
    setLessonContent((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  // === Add new lesson ===
  const addLesson = () => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title: "New Lesson",
      order_index: lessons.length + 1,
    };
    setLessons([...lessons, newLesson]);
    setUnsavedChanges(true);
  };

  // === Delete lesson ===
  const deleteLesson = (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      if (selectedLesson === lessonId) setSelectedLesson("");
      setUnsavedChanges(true);
    }
  };

  // === Save all changes (mock save for now) ===
  const saveAllChanges = async () => {
    try {
      console.log("Saving lessons:", lessons);
      console.log("Saving lessonContent:", lessonContent);
      alert("✅ Changes saved locally (connect to API later)");
      setUnsavedChanges(false);
    } catch (err) {
      console.error("Error saving:", err);
      alert("❌ Error saving changes");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Manage Courses
        </h1>

        {/* === MODULE SELECT === */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Module
        </label>
        <select
          className="w-full mb-4 p-2 border border-gray-300 rounded-md"
          value={selectedModule}
          onChange={(e) => {
            setSelectedModule(e.target.value);
            setSelectedLesson("");
          }}
        >
          <option value="">-- Select a module --</option>
          {modules.map((mod) => (
            <option key={mod.id} value={mod.id}>
              {mod.title}
            </option>
          ))}
        </select>

        {/* === LESSON LIST (clickable rows) === */}
        {selectedModule && (
          <>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Lessons
              </label>
              <button
                onClick={addLesson}
                className="flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-400 text-black rounded-md hover:bg-green-400 text-sm"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <ul className="mb-6 border-t border-gray-200 pt-2">
              {lessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className={`flex justify-between items-center border-b border-gray-100 py-2 px-2 rounded-md transition-all duration-200 ${
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
                        handleLessonNameChange(lesson.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-gray-700 text-sm flex-1">
                      {index + 1}. {lesson.title}
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

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎬 Video URL
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={lessonContent.video_url}
                onChange={(e) =>
                  handleContentChange("video_url", e.target.value)
                }
                placeholder="Enter video URL"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🧠 Geniully (Flashcards)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={lessonContent.flashcard_url}
                onChange={(e) =>
                  handleContentChange("flashcard_url", e.target.value)
                }
                placeholder="Enter Geniully or flashcard URL"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🖼️ Slide / PNG Upload
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) =>
                  handleContentChange("slide_file", e.target.files?.[0] || null)
                }
              />
              {lessonContent.slide_file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {lessonContent.slide_file.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* === SAVE BUTTON === */}
        {unsavedChanges && (
          <button
            onClick={saveAllChanges}
            className="mt-6 w-full bg-green-100 border border-green-500 text-black font-semibold py-2 rounded-lg hover:bg-green-300 transition-all"
          >
            💾 Save All Changes
          </button>
        )}
      </div>
    </div>
  );
}
