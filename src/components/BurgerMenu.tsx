"use client";

type Props = {
  onToggle: (open: boolean) => void;
  isOpen: boolean;
  side?: "left" | "right";
};

export default function BurgerMenu({ onToggle, isOpen, side = "right" }: Props) {
  const positionClass = side === "left" ? "left-4" : "right-4"

  return (
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
  );
}
