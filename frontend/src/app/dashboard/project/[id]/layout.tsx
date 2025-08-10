import {ReactNode} from "react";
import ProjectLayoutShell from "@/components/ProjectLayoutShell";
import Navbar from "@/app/dashboard/components/Navbar";

export default function Layout({
                                   children,
                               }: {
    children: ReactNode;
}) {
    return <ProjectLayoutShell><Navbar/>{children}</ProjectLayoutShell>;
}
