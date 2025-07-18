// /app/dashboard/page.tsx
'use client';

import Link from "next/link";
import { useProjects } from "@/app/dashboard/context/ProjectsContext";

export default function ProjectsOverview() {
  const { projects } = useProjects();

  return (
    <div className="pt-15 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/dashboard/new-project" className="btn btn-primary">
          New Project
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.isArray(projects) && projects.length > 0 ? (
          projects.map((p) => (
            <Link
              key={p.projectId}
              href={`/dashboard/project/${p.projectId}/overview`}
              className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500 mt-2">View details →</p>
            </Link>
          ))
        ) : (
          <p className="text-gray-500">No projects found.</p>
        )}
      </div>
    </div>
  );
}
