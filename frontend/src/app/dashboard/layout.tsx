import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "../globals.css";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuildManager",
  description: "Everything you need to manage project in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <main className="flex-1 p-10 bg-gray-50">{children}</main>
    </div>
  );
}
