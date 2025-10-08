"use client";

import React, { useEffect, useState } from "react";

interface LessonContent {
  lesson: { title: string };
  videos: { video_url: string }[];
  slides: { slide_url: string }[];
  flashcards: { translation: string }[]; // Genially URL stored here
}

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const [data, setData] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);

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
  const geniallyUrl = data.flashcards?.[0]?.translation || "";


        function getEmbedUrl(video_url: string): string {
        if (!video_url) return "";

        // If it's already an embed link, keep it as-is
        if (video_url.includes("embed/")) return video_url;

        // Handle short links like youtu.be/xxxx
        if (video_url.includes("youtu.be/")) {
            const videoId = video_url.split("youtu.be/")[1].split("?")[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Handle standard watch?v=xxxx
        if (video_url.includes("watch?v=")) {
            const videoId = video_url.split("watch?v=")[1].split("&")[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // If none match, return original
        return video_url;
        }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {data.lesson?.title || "Lesson"}
        </h1>

        {/* 🎬 YouTube Video */}
        {videoUrl ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">🎥 Video</h2>
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                    src={
                        getEmbedUrl(videoUrl)
                        }
                    title="Lesson Video"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-300 shadow-sm"
                ></iframe>
                </div>

          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-8 italic">No video for this lesson.</p>
        )}

        {/* 🖼️ Slide Image */}
        {slideUrl ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">🖼️ Slide</h2>
            <img
              src={slideUrl}
              alt="Lesson Slide"
              className="w-full max-h-[450px] object-contain rounded-md border border-gray-300 shadow-sm"
                />
            </div>
        ) : (
          <p className="text-sm text-gray-500 mb-8 italic">No slide uploaded.</p>
        )}

        {/* 🧠 Genially / Flashcards */}
        {geniallyUrl ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">🧠 Interactive (Genially)</h2>
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                    src={geniallyUrl}
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-300 shadow-sm"
                ></iframe>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No Genially link provided.</p>
        )}
      </div>
    </div>
  );
}
