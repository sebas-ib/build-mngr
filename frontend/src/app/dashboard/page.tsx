'use client';

import Link from "next/link";
import { useProjects } from "@/app/dashboard/context/ProjectsContext";
import Navbar from "@/app/dashboard/components/Navbar";

export default function ProjectsOverview() {
  const { projects, deleteProject } = useProjects();

  const handleDelete = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject(projectId);
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="pt-24 px-6 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Link href="/dashboard/new-project" className="btn btn-primary">
            New Project
          </Link>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.isArray(projects) && projects.length > 0 ? (
            projects.map((p) => (
              <div
                key={p.projectId}
                className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition relative"
              >
                <Link href={`/dashboard/project/${p.projectId}/overview`}>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-sm text-gray-500 mt-2">View details →</p>
                </Link>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(p.projectId)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No projects found.</p>
          )}
        </div>
      </div>
    </>
  );
}
