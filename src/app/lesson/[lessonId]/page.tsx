"use client";

import React, { useEffect, useState } from "react";
import { Image, Video, Brain, HelpCircle } from "lucide-react";

interface LessonContent {
  lesson: { title: string };
  videos: { video_url: string }[];
  slides: { slide_url: string }[];
  flashcards: { flashcard_url: string }[];
}

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const [data, setData] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "video" | "slide" | "flashcard" | "questions"
  >("video");

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/lesson-content?lesson_id=${params.lessonId}`);
        if (!res.ok) throw new Error("Failed to fetch lesson content");
        const lessonData = await res.json();
        setData(lessonData);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [params.lessonId]);

  if (loading) return <p className="text-center mt-10">Loading lesson...</p>;
  if (!data) return <p className="text-center mt-10 text-red-500">No data found.</p>;

  const videoUrl = data.videos?.[0]?.video_url || "";
  const slideUrl = data.slides?.[0]?.slide_url || "";
  const geniallyUrl = data.flashcards?.[0]?.flashcard_url || "";

  function getEmbedUrl(video_url: string): string {
    if (!video_url) return "";
    if (video_url.includes("embed/")) return video_url;
    if (video_url.includes("youtu.be/")) {
      const videoId = video_url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (video_url.includes("watch?v=")) {
      const videoId = video_url.split("watch?v=")[1].split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return video_url;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
            {/* === LEFT SIDEBAR === */}
        <div className="w-72 bg-white border-r-2 border-gray-200 shadow-md flex flex-col">
            <div className="p-7 border-b-2 border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {data.lesson?.title || "Lesson"}
                </h1>
            </div>

        <nav className="flex flex-col gap-3 p-5 text-gray-800 text-lg">
            <button
            onClick={() => setActiveSection("slide")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                activeSection === "slide"
                ? "bg-gray-200 font-semibold"
                : "hover:bg-gray-100"
            }`}
            >
            <Image size={22} /> Slide
            </button>

            <button
            onClick={() => setActiveSection("video")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                activeSection === "video"
                ? "bg-gray-200 font-semibold"
                : "hover:bg-gray-100"
            }`}
            >
            <Video size={22} /> Video
            </button>

            <button
            onClick={() => setActiveSection("flashcard")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                activeSection === "flashcard"
                ? "bg-gray-200 font-semibold"
                : "hover:bg-gray-100"
            }`}
            >
            <Brain size={22} /> Flashcards
            </button>

            <button
            onClick={() => setActiveSection("questions")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                activeSection === "questions"
                ? "bg-gray-200 font-semibold"
                : "hover:bg-gray-100"
            }`}
            >
            <HelpCircle size={22} /> Questions
            </button>
        </nav>
        </div>

                {/* === RIGHT CONTENT AREA === */}
                <div className="flex-1 p-10 overflow-y-auto">
            {activeSection === "video" && (
            <div className="flex flex-col items-center">
           
                {videoUrl ? (
                    <div className="relative w-full max-w-6xl aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-300">
                    <iframe
                        src={getEmbedUrl(videoUrl)}
                        title="Lesson Video"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                    ></iframe>
                    </div>
                ) : (
                    <p className="text-base text-gray-500 italic mt-4">
                    No video for this lesson.
                    </p>
                )}
                </div>
               
        )}


        {activeSection === "slide" && (
          <div>
            {slideUrl ? (
              <img
                src={slideUrl}
                alt="Lesson Slide"
                className="w-full max-h-[500px] object-contain rounded-md border border-gray-300 shadow-sm"
              />
            ) : (
              <p className="text-sm text-gray-500 italic">No slide uploaded yet.</p>
            )}
          </div>
        )}

        {activeSection === "flashcard" && (
          <div>
            {geniallyUrl ? (
              <div className="relative w-full max-w-4xl mx-auto" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={geniallyUrl}
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-300 shadow-sm"
                ></iframe>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No Genially link provided.</p>
            )}
          </div>
        )}

        {activeSection === "questions" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">❓ Questions</h2>
            <p className="text-gray-500 italic">
              (We can add question data display here later.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
