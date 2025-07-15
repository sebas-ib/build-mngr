// /components/ProjectLayoutWrapper.tsx
"use client";
import { useEffect, useState, createContext, useContext } from "react";

interface Project {
  userId: string;
  projectId: string;
  createdAt: string;
  description: string;
  endDate: string;
  s3Folder: string;
  startDate: string;
  name: string;
}

const ProjectContext = createContext<Project | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within ProjectLayoutWrapper");
  return context;
}

export default function ProjectLayoutWrapper({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProject() {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        console.error("Failed to load project");
      }
    }

    fetchProject();
  }, [projectId]);

  if (!project) return <div className="p-4 text-gray-500">Loading project...</div>;

  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}
