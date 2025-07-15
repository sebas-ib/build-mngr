"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/dashboard/components/Navbar";
import {useParams} from "next/navigation";

interface Project {
  userId: string;
  projectId: string;
  createdAt: string;
  description: string;
  endDate: string;
  s3Folder: string
  startDate: string;
  name: string;
}

export default function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      const res = await fetch("http://localhost:5000/api/projects", {
        credentials: "include", // send session cookie
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch project");
      }
    }

    fetchProjects();
  }, []);

  return (
    <>
      <Navbar />
      <div className="pt-15 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Link href="/dashboard/new-project" className="btn btn-primary">
            New Project
          </Link>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.projectId}
              href={`/dashboard/project/${p.projectId}/overview`}
              className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500 mt-2">View details →</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
