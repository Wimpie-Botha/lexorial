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
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent>({
    lesson_id: "",
    video_url: "",
    flashcard_url: "",
    slide_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // === 🔐 Load session ===
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

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
  useEffect(() => {
    if (!selectedLesson || !session) return;
    const fetchLessonContent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/lesson-content?lesson_id=${selectedLesson}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
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

  // === Local edits ===
  const handleModuleTitleChange = (id: string, title: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, title } : m)));
    setUnsavedChanges(true);
  };
  const handleLessonTitleChange = (id: string, title: string) => {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, title } : l)));
    setUnsavedChanges(true);
  };

  // === Handle lesson content change ===
  const handleContentChange = (field: keyof LessonContent, value: any) => {
    setLessonContent((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

   // === Add/delete modules ===
  const addModule = () => {
    const newMod: Module = { id: crypto.randomUUID(), title: "New Module" };
    setModules((prev) => [...prev, newMod]);
    setSelectedModule(newMod.id);
    setEditingModuleId(newMod.id); // 🟢 Immediately enable edit mode
    setLessons([]);
    setSelectedLesson("");
    setUnsavedChanges(true);
  };

  const deleteModule = (id: string) => {
    if (confirm("Delete this module and all its lessons?")) {
      setModules((prev) => prev.filter((m) => m.id !== id));
      if (selectedModule === id) {
        setSelectedModule("");
        setLessons([]);
      }
      setUnsavedChanges(true);
    }
  };

  // === Add/delete lessons ===
  const addLesson = () => {
    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title: "New Lesson",
      order_index: lessons.length + 1,
    };
    setLessons((prev) => [...prev, newLesson]);
    setSelectedLesson(newLesson.id);
    setEditingLessonId(newLesson.id); // 🟢 Immediately enable edit mode
    setUnsavedChanges(true);
  };

  const deleteLesson = (id: string) => {
    if (confirm("Delete this lesson?")) {
      setLessons((prev) => prev.filter((l) => l.id !== id));
      if (selectedLesson === id) setSelectedLesson("");
      setUnsavedChanges(true);
    }
  };
  const saveAll = () => {
    console.log("Modules:", modules);
    console.log("Lessons:", lessons);
    console.log("Lesson content:", lessonContent);
    alert("✅ Changes saved locally (connect to API later)");
    setUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
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
        )}

        {/* === SAVE BUTTON === */}
        {unsavedChanges && (
          <button
            onClick={saveAll}
            className="mt-6 w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-all"
          >
            💾 Save All Changes
          </button>
        )}
      </div>
    </div>
  );
}
