import type { ReactNode } from "react";

export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sage-light text-sage">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        {children}
      </svg>
    </span>
  );
}
