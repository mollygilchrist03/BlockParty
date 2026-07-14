import Link from "next/link";
import { requireUser } from "@/lib/session";
import { IconBadge } from "@/components/icon-badge";

const sections = [
  {
    href: "/dashboard/announcements",
    title: "Announcements",
    description: "See what's new in your neighborhood.",
    icon: (
      <>
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4L6 9H5a2 2 0 0 0-2 2Z" />
        <path d="M14 8a4 4 0 0 1 0 8" />
        <path d="M17 5a8 8 0 0 1 0 14" />
      </>
    ),
  },
  {
    href: "/dashboard/events",
    title: "Events",
    description: "Browse upcoming events and RSVP.",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
  },
  {
    href: "/dashboard/board",
    title: "Bulletin board",
    description: "Yard sales, lost & found, and recommendations.",
    icon: (
      <>
        <path d="M20.59 13.41 11 3.83 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
        <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/dashboard/amenities",
    title: "Amenities",
    description: "Reserve the pool cabana, clubhouse, and more.",
    icon: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l7-7M16 3l3 3M19 6l-3.5 3.5" />
      </>
    ),
  },
  {
    href: "/dashboard/newsletters",
    title: "Newsletters",
    description: "Browse the monthly newsletter archive.",
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
    title: "Directory",
    description: "Find neighbors who've opted into the directory.",
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
    title: "Trash & recycling",
    description: "Check the next pickup day.",
    icon: (
      <>
        <path d="M4 7h16" />
        <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      </>
    ),
  },
];

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div>
        <p className="text-sm font-medium text-sage">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">
          Welcome back, {user.name?.split(" ")[0] ?? "neighbor"}
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card card-link flex flex-col"
          >
            <IconBadge>{section.icon}</IconBadge>
            <h2 className="font-semibold text-navy">{section.title}</h2>
            <p className="mt-1 text-sm text-slate">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
