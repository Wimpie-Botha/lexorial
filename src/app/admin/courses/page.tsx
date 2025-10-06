"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-6">
      {/* === Top Header === */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <User size={28} className="text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-800">Actions To Do</h1>
        <div className="w-8" /> {/* Spacer for symmetry */}
      </div>

      {/* === Bottom 4-Block Grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {/* === 1️⃣ Manage Courses === */}
        <div
          onClick={() => router.push("/admin/courses")}
          className="cursor-pointer bg-white rounded-2xl border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex flex-col justify-between p-5 text-center"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Manage Courses
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Add or edit course modules
            </p>
          </div>
          <p className="mt-4 font-semibold text-green-700">Open</p>
        </div>

        {/* === 2️⃣ Placeholder (coming soon) === */}
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-5 text-center opacity-70">
          <h2 className="text-lg font-bold text-gray-400">Coming Soon</h2>
        </div>

        {/* === 3️⃣ Placeholder (coming soon) === */}
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-5 text-center opacity-70">
          <h2 className="text-lg font-bold text-gray-400">Coming Soon</h2>
        </div>

        {/* === 4️⃣ Placeholder (coming soon) === */}
        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-5 text-center opacity-70">
          <h2 className="text-lg font-bold text-gray-400">Coming Soon</h2>
        </div>
      </div>
    </div>
  );
}
