"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import CourseCard from "./components/CourseCard"

interface Course {
  id: string
  title: string
  level: string
  description?: string
}

export default function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("level", { ascending: true })
      if (error) console.error(error)
      else setCourses(data || [])
      setLoading(false)
    }
    fetchCourses()
  }, [])

  if (loading) return <p className="p-10 text-gray-500">Loading courses...</p>

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <button
        className="bg-green-500 text-white px-4 py-2 rounded shadow"
        onClick={() => window.location.reload()}
      >
        Refresh Data
      </button>

    </div>
  )
}
