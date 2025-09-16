// context/ProjectsContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export interface Project {
  projectId: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currentUserRole?: 'owner' | 'admin' | 'contributor' | 'guest' | 'viewer' | 'member' | string;
}

interface ProjectsContextType {
  projects: Project[];
  ownedProjects: Project[];
  sharedProjects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  refetchProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  leaveProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectsProvider');
  return ctx;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Project[] = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  }, []);

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects(prev => prev.filter(p => p.projectId !== projectId));
    } catch (err) {
      console.error('Failed to delete project', err);
      throw err; // let UI decide how to show error
    }
  };

  const leaveProject = async (projectId: string) => {
    // optimistic update: remove from local state immediately
    const prev = projects;
    setProjects(curr => curr.filter(p => p.projectId !== projectId));

    try {
      const res = await fetch(`http://localhost:5000/api/project/${projectId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        setProjects(prev); // revert
        const msg = await res.text();
        throw new Error(msg || 'Failed to leave project');
      }
    } catch (err) {
      console.error('Failed to leave project', err);
      setProjects(prev); // revert if we didn’t already
      throw err; // surface to caller for toast/alert
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const ownedProjects = useMemo(
    () => projects.filter(p => p.currentUserRole === 'owner'),
    [projects]
  );

  const sharedProjects = useMemo(
    () => projects.filter(p => p.currentUserRole && p.currentUserRole !== 'owner'),
    [projects]
  );

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        ownedProjects,
        sharedProjects,
        setProjects,
        refetchProjects: fetchProjects,
        deleteProject,
        leaveProject, // <-- expose it
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
