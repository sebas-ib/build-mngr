// app/dashboard/projects/[id]/layout.tsx
"use client";

import Navbar from "@/app/dashboard/components/Navbar";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="md:ml-64 pt-10">
        <main className="flex-1 p-10 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </>
  );
}
