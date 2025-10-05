"use client";

import Link from "next/link";

type Tile = {
  id: string;
  title: string;
  desc?: string;
  href?: string;
};

export default function HomeMenu() {
  const tiles: Tile[] = [
  { id: "t1", title: "Learn", desc: "Lessons & slides", href: "/auth/coursework" },
  { id: "t2", title: "Practice", desc: "Questions & quizzes", href: "/auth/coursework/questions" },
  { id: "t3", title: "Flashcards", desc: "Quick review", href: "/auth/coursework/flashcards" },
  { id: "t4", title: "Videos", desc: "Watch and learn", href: "/auth/coursework/videos" },
  { id: "t5", title: "Progress", desc: "Track your growth", href: "/dashboard" },
  { id: "t6", title: "Settings", desc: "Account & prefs", href: "/profile" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Home</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <Link key={t.id} href={t.href ?? '/'} className="block">
              <article className="h-40 flex flex-col justify-between p-4 rounded-lg border bg-white hover:shadow-lg transition-shadow">
                <div>
                  <div className="w-12 h-12 rounded-md bg-black/[.06] flex items-center justify-center mb-3">📘</div>
                  <h2 className="text-lg font-semibold">{t.title}</h2>
                  <p className="text-sm text-gray-600">{t.desc}</p>
                </div>
                <div className="text-sm text-blue-600">Open →</div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
