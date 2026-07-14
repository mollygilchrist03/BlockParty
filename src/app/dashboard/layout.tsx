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
      <header className="flex items-center justify-between border-b border-slate/10 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="BlockParty logo" width={32} height={32} />
            <span className="text-lg font-semibold text-navy">BlockParty</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate">
            <Link href="/dashboard/announcements" className="hover:text-sage">
              Announcements
            </Link>
            <Link href="/dashboard/events" className="hover:text-sage">
              Events
            </Link>
            <Link href="/dashboard/board" className="hover:text-sage">
              Bulletin board
            </Link>
            <Link href="/dashboard/amenities" className="hover:text-sage">
              Amenities
            </Link>
            <Link href="/dashboard/newsletters" className="hover:text-sage">
              Newsletters
            </Link>
            {isBoard && (
              <Link href="/dashboard/admin" className="hover:text-sage">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-sm font-medium text-slate hover:text-navy"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
