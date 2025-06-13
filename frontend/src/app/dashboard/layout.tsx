import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "../globals.css";
import Link from "next/link";


const dmSans = DM_Sans({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "BuildManager",
  description: "Everything you need to manage projects in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm px-6 py-8 space-y-6">
        <h2 className="text-xl font-bold">BuildManager</h2>
        <nav className="flex flex-col gap-4 text-gray-700 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/projects">Projects</Link>
          <Link href="/dashboard/settings">Settings</Link>
          <Link href="/">Log out</Link>
        </nav>
      </aside>

      {/* Page content */}
      <main className="flex-1 p-10 bg-gray-50">{children}</main>
    </div>
  );
}

