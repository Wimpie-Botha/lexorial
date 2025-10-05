"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Side = "left" | "right"

type Item = {
  id: string;
  title: string;
  progress: number; // 0-100
};

export default function LearnerProgress({
  open,
  onClose,
  side = "right",
}: {
  open: boolean
  onClose: () => void
  side?: Side
}) {
  // sample data — in a real app this would be fetched
  const items: Item[] = [
    { id: "1", title: "Lesson 1: Basics", progress: 100 },
    { id: "2", title: "Lesson 2: Numbers", progress: 70 },
    { id: "3", title: "Lesson 3: Greetings", progress: 45 },
  ];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sideClass = side === "left" ? "left-0 border-r border-black/[.06]" : "right-0 border-l border-black/[.06]"
  const hiddenTransform = side === "left" ? "-translate-x-full" : "translate-x-full"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden={!open}
          className={`fixed inset-0 z-40`}
        >
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-label="Learner progress"
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            // tuned for quicker entrance but softer settling
            transition={{ type: "spring", stiffness: 520, damping: 48, mass: 0.55 }}
            className={`fixed top-0 ${sideClass} h-full w-full max-w-md bg-white text-black shadow-xl`}
            style={{ willChange: "transform, opacity" }}
          >
            <div className="p-6 flex flex-col gap-4 h-full">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Learner progress</h2>
                <button onClick={onClose} aria-label="Close" className="rounded p-1">
                  ✕
                </button>
              </header>

              <section className="flex-1 overflow-auto">
                <ul className="flex flex-col gap-4">
                  {items.map((it) => (
                    <li key={it.id} className="bg-black/[.03] p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{it.title}</span>
                        <span className="text-sm text-muted-foreground">{it.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-black/[.06] rounded overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${it.progress}%`, maxWidth: "100%" }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <footer>
                <button
                  onClick={() => alert("Open full progress page — implement later")}
                  className="w-full rounded bg-foreground text-background px-4 py-2"
                >
                  View full progress
                </button>
              </footer>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
