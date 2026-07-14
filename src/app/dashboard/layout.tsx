import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/session";

const boardOnlyRoles = ["board", "admin"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isBoard = boardOnlyRoles.includes(user.role);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-slate-900/5 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="BlockParty logo" width={32} height={32} />
              <span className="text-lg font-semibold text-navy">BlockParty</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate">
              <Link href="/dashboard/announcements" className="transition-colors hover:text-sage">
                Announcements
              </Link>
              <Link href="/dashboard/events" className="transition-colors hover:text-sage">
                Events
              </Link>
              <Link href="/dashboard/board" className="transition-colors hover:text-sage">
                Bulletin board
              </Link>
              <Link href="/dashboard/amenities" className="transition-colors hover:text-sage">
                Amenities
              </Link>
              <Link href="/dashboard/newsletters" className="transition-colors hover:text-sage">
                Newsletters
              </Link>
              <Link href="/dashboard/directory" className="transition-colors hover:text-sage">
                Directory
              </Link>
              <Link href="/dashboard/schedule" className="transition-colors hover:text-sage">
                Trash &amp; recycling
              </Link>
              {isBoard && (
                <Link
                  href="/dashboard/admin"
                  className="rounded-full bg-sage-light px-3 py-1 text-sage transition-colors hover:bg-sage hover:text-white"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/settings"
              className="text-sm font-medium text-slate transition-colors hover:text-navy"
            >
              Settings
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-slate transition-colors hover:text-navy"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
