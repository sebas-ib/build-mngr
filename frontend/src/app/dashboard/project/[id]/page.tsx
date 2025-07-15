///build-mngr/frontend/src/app/dashboard/project/[id]/page.tsx
"use client"

import {useEffect, useState} from "react";
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
export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState(false)
  const params = useParams()
  const projectId = params.id


  useEffect(() => {
    async function fetchProject() {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        credentials: "include",
      });

      if (res.ok){
        const data = await res.json()
        setProject(data)
      } else {
        console.error("Failed to load data")
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, []);

  if (error) return <div className="p-4 text-red-500">Failed to load project.</div>;
  if (!project) return <div className="p-4 text-gray-500">Loading project...</div>;

  return (
<div className="space-y-6 p-6 md:pl-72">
  <h1 className="text-2xl font-bold">{project.name}</h1>
  <p className="text-gray-700">{project.description}</p>

  <div className="text-sm text-gray-500">
    <p><strong>Start Date:</strong> {project.startDate}</p>
    <p><strong>End Date:</strong> {project.endDate}</p>
    <p><strong>Created At:</strong> {new Date(project.createdAt).toLocaleString()}</p>
  </div>
</div>

  )
}