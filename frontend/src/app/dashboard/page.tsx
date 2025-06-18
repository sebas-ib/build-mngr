// app/dashboard/page.tsx
"use client";

import Link from "next/link";

const mockProjects = [
  { id: "alpha", name: "Kitchen Remodel – Alpha St." },
  { id: "beta", name: "Office Build-out – Beta LLC" },
];

export default function ProjectsOverview() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/dashboard/new-project"
          className="btn btn-primary"
        >
            New Project
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {mockProjects.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="text-sm text-gray-500 mt-2">View details →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
