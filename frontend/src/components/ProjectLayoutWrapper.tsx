"use client";
import { useEffect, useState, createContext, useContext } from "react";

interface FileItem {
  name: string;
  size: string;
  uploadedAt: string;
  key: string;
}

interface FolderItem {
  name: string;
  createdAt: string;
  folders: FolderItem[];
  files: FileItem[];
}

export interface TimelineEvent {
  phase: string;
  date: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  notes: string;
}

interface Project {
  userId: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  s3Folder: string;

  // Overview fields
  client?: string;
  location?: string;
  status?: string;
  progress?: number;
  milestones?: {
    title: string;
    date: string;
    completed: boolean;
  }[];

  team?: {
    name: string;
    role: string;
  }[];

  // Budget
  budget?: number;
  expenses?: {
    category: string;
    description: string;
    date: string;
    amount: number;
  }[];

  // Timeline
  timeline?: TimelineEvent[];

  // Updates
  updates?: {
    title: string;
    author: string;
    date: string;
    summary: string;
  }[];

  // Notes
  notes?: {
    id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    updatedAt: string;
  }[];

  // Inspections
  inspections?: {
    id: string;
    title: string;
    date: string;
    inspector: string;
    status: "Pending" | "Passed" | "Failed";
    notes: string;
  }[];

  // Tasks
  tasks?: {
    title: string;
    description?: string;
    status: "todo" | "in-progress" | "done";
    dueDate?: string;
  }[];

  // File system
  directory: FolderItem;
}

interface ProjectContextType {
  // We only render the Provider after project is loaded,
  // so consumers will always see a non-null Project here.
  project: Project;
  // But the underlying state can be null, so the setter must allow null.
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

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
        if (!data.directory) {
          data.directory = {
            name: "root",
            createdAt: new Date().toISOString(),
            folders: [],
            files: [],
          };
        }
        setProject(data);
      } else {
        console.error("Failed to load project");
      }
    }

    fetchProject();
  }, [projectId]);

  if (!project) return <div className="p-4 text-gray-500">Loading project...</div>;

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
