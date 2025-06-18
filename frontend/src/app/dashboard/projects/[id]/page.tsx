// app/dashboard/projects/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ProjectWorkspace({params,}: { params: Promise<{ id: string }>; }) {
  // await the params promise
  const { id } = await params;

  const project = { id, name: `Project ${id}` };

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-sm text-gray-500">
        This is where the project workspace will live.
      </p>
    </div>
  );
}
