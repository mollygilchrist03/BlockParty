"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/avatar";

const links = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </>
    ),
  },
  {
    href: "/dashboard/events",
    label: "Events",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    icon: (
      <>
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
        <path d="M14 8a4 4 0 0 1 0 8" />
        <path d="M17 5a8 8 0 0 1 0 14" />
      </>
    ),
  },
  {
    href: "/dashboard/board",
    label: "Bulletin board",
    icon: (
      <>
        <path d="M20.59 13.41 11 3.83 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
        <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/dashboard/amenities",
    label: "Amenities",
    icon: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l7-7M16 3l3 3M19 6l-3.5 3.5" />
      </>
    ),
  },
  {
    href: "/dashboard/newsletters",
    label: "Newsletters",
    icon: (
      <>
        <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1.55.83L14 18" />
        <path d="M4 4v14a2 2 0 0 0 2 2h10" />
        <path d="M7 8h8M7 12h8M7 16h4" />
      </>
    ),
  },
  {
    href: "/dashboard/directory",
    label: "Directory",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 4.2a3 3 0 0 1 0 5.6M20 20c0-2.8-1.9-5.1-4.5-5.8" />
      </>
    ),
  },
  {
    href: "/dashboard/schedule",
    label: "Trash & recycling",
    icon: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      </>
    ),
  },
];

const settingsIcon = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>
);

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      {children}
    </svg>
  );
}

export function DashboardNav({
  isBoard,
  isOwner,
  userName,
  userSubtitle,
}: {
  isBoard: boolean;
  isOwner: boolean;
  userName: string;
  userSubtitle: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const linkClasses = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-sage text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  const navBody = (onNavigate: () => void) => (
    <>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={linkClasses(isActive(link.href))}
          >
            <NavIcon>{link.icon}</NavIcon>
            {link.label}
          </Link>
        ))}
        {isBoard && (
          <Link
            href="/dashboard/admin"
            onClick={onNavigate}
            className={linkClasses(isActive("/dashboard/admin"))}
          >
            <NavIcon>
              <path d="M12 3 4 6.5V11c0 4.6 3.2 8.9 8 10 4.8-1.1 8-5.4 8-10V6.5L12 3Z" />
            </NavIcon>
            Admin
          </Link>
        )}
        {isOwner && (
          <Link
            href="/dashboard/owner"
            onClick={onNavigate}
            className={linkClasses(isActive("/dashboard/owner"))}
          >
            <NavIcon>
              <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
            </NavIcon>
            Owner
          </Link>
        )}
      </nav>

      <div className="relative border-t border-white/10 p-3">
        {profileOpen && (
          <div className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-xl border border-white/10 bg-navy shadow-lg">
            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
            >
              <NavIcon>{settingsIcon}</NavIcon>
              Settings
            </Link>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="w-full px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => setProfileOpen((value) => !value)}
          aria-expanded={profileOpen}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5"
        >
          <Avatar name={userName} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{userName}</span>
            <span className="block truncate text-xs text-slate-400">{userSubtitle}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden xl:flex xl:w-64 xl:shrink-0 xl:flex-col xl:bg-navy">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5">
          <Image src="/logo.svg" alt="BlockParty logo" width={28} height={28} />
          <span className="text-lg font-semibold text-white">BlockParty</span>
        </Link>
        {navBody(() => {})}
      </aside>

      <header className="flex items-center justify-between border-b border-slate-900/5 bg-white px-6 py-4 xl:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="BlockParty logo" width={28} height={28} />
          <span className="text-lg font-semibold text-navy">BlockParty</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate transition-colors hover:bg-slate/10"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>
      </header>

      {mobileOpen && (
        <div className="flex flex-col bg-navy pb-3 xl:hidden">
          {navBody(() => setMobileOpen(false))}
        </div>
      )}
    </>
  );
}
