"use client";

import { useState, useEffect } from "react";

type Props = {
  onToggle: (open: boolean) => void;
  isOpen: boolean;
  side?: "left" | "right";
};

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export default function BurgerMenu({ onToggle, isOpen, side = "right" }: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const positionClass = side === "left" ? "left-4" : "right-4";

  // ✅ Fetch once at app start so progress always ready
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("/api/modules");
        if (!res.ok) throw new Error("Failed to fetch modules");
        const data = await res.json();

        // Compute level + progress
        const completedModules = data.filter((m: Module) =>
          m.lessons.every((l: Lesson) => l.completed)
        ).length;

        const nextModule = data[completedModules];
        const totalLessons = nextModule?.lessons?.length || 0;
        const completedLessons =
          nextModule?.lessons?.filter((l: Lesson) => l.completed)?.length || 0;

        const progressPercent =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        setModules(data);
        setCurrentLevel(completedModules);
        setProgress(progressPercent);
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return (
    <>
      {/* 🔘 Burger Button */}
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open learner progress"}
        onClick={() => onToggle(!isOpen)}
        className={`fixed top-4 z-50 inline-flex items-center justify-center rounded-lg p-2 bg-white/90 text-black shadow-md backdrop-blur-sm border border-black/[.06] hover:bg-white ${positionClass}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* 🧭 Sidebar overlay (always mounted) */}
      <div
        className={`fixed top-0 ${side}-0 z-40 h-full w-64 bg-white shadow-xl border-l border-gray-200 
        transition-all duration-300 ease-in-out transform 
        ${isOpen ? "translate-x-0 opacity-100" : side === "left" ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Progress</h2>
          </div>

          {/* 🔹 Level Progress Section */}
          {loading ? (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
              <div className="h-2 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#24C655] to-[#1D9E44] text-white rounded-lg p-4 mb-6 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Level {currentLevel}</span>
                <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {progress === 100 && (
                <p className="text-xs mt-2 text-white/80">
                  🎉 Level Up! You’ve completed Level {currentLevel}!
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-col space-y-2">
            <a href="/dashboard" className="px-3 py-2 rounded hover:bg-gray-100">
              Dashboard
            </a>
            <a href="/modules" className="px-3 py-2 rounded hover:bg-gray-100">
              Modules
            </a>
            <a href="/profile" className="px-3 py-2 rounded hover:bg-gray-100">
              Profile
            </a>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Signed in as <b>Student</b></p>
          </div>
        </div>
      </div>

      {/* 🔲 Semi-transparent backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => onToggle(false)}
      />
    </>
  );
}
