import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { boardOnlyRoles, ownerOnlyRoles } from "@/lib/roles";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isBoard = boardOnlyRoles.includes(user.role);
  const isOwner = ownerOnlyRoles.includes(user.role);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-slate-900/5 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur">
        <div className="relative flex items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="BlockParty logo" width={32} height={32} />
            <span className="text-lg font-semibold text-navy">BlockParty</span>
          </Link>
          <DashboardNav isBoard={isBoard} isOwner={isOwner} />
        </div>
      </header>
      <main id="main-content" className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
