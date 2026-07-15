export function SavedBanner({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-sage-light px-3 py-2 text-sm font-medium text-sage">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {message}
    </p>
  );
}
