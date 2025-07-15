import { ReactNode } from "react";
import ProjectLayoutShell from "@/components/ProjectLayoutShell";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProjectLayoutShell>{children}</ProjectLayoutShell>;
}
