"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";

const links = [
  { href: "/dashboard/announcements", label: "Announcements" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/board", label: "Bulletin board" },
  { href: "/dashboard/amenities", label: "Amenities" },
  { href: "/dashboard/newsletters", label: "Newsletters" },
  { href: "/dashboard/directory", label: "Directory" },
  { href: "/dashboard/schedule", label: "Trash & recycling" },
];

export function DashboardNav({
  isBoard,
  isOwner,
}: {
  isBoard: boolean;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <nav className="hidden items-center gap-x-5 text-sm font-medium text-slate xl:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-sage"
          >
            {link.label}
          </Link>
        ))}
        {isBoard && (
          <Link
            href="/dashboard/admin"
            className="rounded-full bg-sage-light px-3 py-1 text-sage transition-colors hover:bg-sage hover:text-white"
          >
            Admin
          </Link>
        )}
        {isOwner && (
          <Link
            href="/dashboard/owner"
            className="rounded-full bg-navy px-3 py-1 text-white transition-colors hover:bg-slate"
          >
            Owner
          </Link>
        )}
      </nav>

      <div className="hidden items-center gap-4 xl:flex">
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-slate transition-colors hover:text-navy"
        >
          Settings
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm font-medium text-slate transition-colors hover:text-navy"
          >
            Sign out
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate transition-colors hover:bg-slate/10 xl:hidden"
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-slate-900/5 bg-white shadow-md xl:hidden">
          <nav className="flex flex-col px-6 py-3 text-sm font-medium text-slate sm:px-10">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 transition-colors hover:bg-sage-light hover:text-sage"
              >
                {link.label}
              </Link>
            ))}
            {isBoard && (
              <Link
                href="/dashboard/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 font-semibold text-sage"
              >
                Admin
              </Link>
            )}
            {isOwner && (
              <Link
                href="/dashboard/owner"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 font-semibold text-navy"
              >
                Owner
              </Link>
            )}
            <div className="my-2 border-t border-slate-900/5" />
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 transition-colors hover:bg-slate/10"
            >
              Settings
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-slate/10"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
