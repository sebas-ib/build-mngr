'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectsContextType {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  refetchProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects must be used within a ProjectsProvider");
  return context;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  }, []);

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete project");
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectsContext.Provider value={{ projects, setProjects, refetchProjects: fetchProjects, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}
