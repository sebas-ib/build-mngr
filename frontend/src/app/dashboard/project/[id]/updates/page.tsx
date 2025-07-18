"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";

export default function UpdatesPage() {
  const project = useProject();

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-4">
      <h1 className="text-2xl font-bold">Updates</h1>
      <p>{project.description}</p>
      <p><strong>Start Date:</strong> {project.startDate}</p>
      <p><strong>End Date:</strong> {project.endDate}</p>
    </div>
  );
}
