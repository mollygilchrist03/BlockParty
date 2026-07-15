import Link from "next/link";
import { requireBoard } from "@/lib/session";
import { IconBadge } from "@/components/icon-badge";

const shortcuts = [
  {
    href: "/dashboard/announcements/new",
    title: "Post an announcement",
    description: "Share news with the whole neighborhood.",
    icon: (
      <>
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
        <path d="M14 8a4 4 0 0 1 0 8" />
        <path d="M17 5a8 8 0 0 1 0 14" />
      </>
    ),
  },
  {
    href: "/dashboard/events/new",
    title: "Create an event",
    description: "Set a date, location, and capacity.",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
  },
  {
    href: "/dashboard/amenities/new",
    title: "Add an amenity",
    description: "Set up a bookable space like a pool cabana or clubhouse.",
    icon: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l7-7M16 3l3 3M19 6l-3.5 3.5" />
      </>
    ),
  },
  {
    href: "/dashboard/newsletters/new",
    title: "Upload a newsletter",
    description: "Add a monthly newsletter PDF to the archive.",
    icon: (
      <>
        <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1.55.83L14 18" />
        <path d="M4 4v14a2 2 0 0 0 2 2h10" />
        <path d="M7 8h8M7 12h8M7 16h4" />
      </>
    ),
  },
  {
    href: "/dashboard/schedule/new",
    title: "Add a pickup schedule",
    description: "Set the trash, recycling, or bulk pickup day.",
    icon: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      </>
    ),
  },
  {
    href: "/dashboard/users",
    title: "Manage residents",
    description: "Edit resident profiles in your neighborhood.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M17 8a3 3 0 1 1-1-5.6" />
        <path d="M21 20c0-2.5-1.7-4.6-4-5.4" />
      </>
    ),
  },
];

export default async function AdminPage() {
  await requireBoard();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div>
        <p className="text-sm font-medium text-sage">Board &amp; admin</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">
          Admin
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="card card-link flex flex-col"
          >
            <IconBadge>{shortcut.icon}</IconBadge>
            <h2 className="font-semibold text-navy">{shortcut.title}</h2>
            <p className="mt-1 text-sm text-slate">{shortcut.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
