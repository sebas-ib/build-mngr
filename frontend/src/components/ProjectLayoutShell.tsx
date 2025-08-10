"use client";

import { useParams } from "next/navigation";
import Navbar from "@/app/dashboard/components/Navbar";
import ProjectLayoutWrapper from "./ProjectLayoutWrapper";

export default function ProjectLayoutShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <>
      <ProjectLayoutWrapper projectId={projectId}>
          <Navbar />
        {children}
      </ProjectLayoutWrapper>
    </>
  );
}
