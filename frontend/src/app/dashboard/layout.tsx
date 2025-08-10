// /app/dashboard/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import SyncUserEffect from "@/app/dashboard/components/SyncUserComponent";
import { ProjectsProvider } from "@/app/dashboard/context/ProjectsContext";

export const metadata: Metadata = {
  title: "BuildManager",
  description: "Everything you need to manage projects in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SyncUserEffect />
      <ProjectsProvider>
        <div className="min-h-screen flex">
          <main className="flex-1 p-10 bg-gray-50">{children}</main>
        </div>
      </ProjectsProvider>
    </>
  );
}
