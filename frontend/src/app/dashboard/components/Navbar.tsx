"use client";

import {JSX, useEffect, useRef, useState} from "react";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import {useParams, usePathname} from "next/navigation";
import {
  Home,
  Megaphone,
  CalendarDays,
  FolderOpen,
  Users2,
  ListChecks,
  ReceiptText,
  ShieldCheck,
  StickyNote
} from "lucide-react";
interface Project {
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any; // optional if you want flexibility
}

export default function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const params = useParams();
    const projectId = params?.id as string;
    const projectName = projects.find((p) => p.projectId === projectId)?.name || "";
    const projectDisplayName = projectId ? projectId : "";
    const {user, loading} = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      async function fetchProjects() {
        try {
          const res = await fetch("http://localhost:5000/api/projects", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setProjects(data);
          } else {
            console.error("Failed to fetch project");
          }
        } catch (err) {
          console.error("Error:", err);
        }
      }

      fetchProjects();
    }, []);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-6 py-4">

                    <div className="flex items-center gap-3">
                        {projectDisplayName ? (
                            <>
                                <Link href="/dashboard" className="text-lg text-gray-500 hover:text-black transition">
                                    Projects
                                </Link>
                                <span className="text-gray-400">/</span>
                                <h1 className="text-lg font-semibold text-gray-900">{projectName}</h1>
                            </>
                        ) : (
                            <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
                        )}
                    </div>

                    {!loading && user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-4 bg-[#FFFFFF] px-1 py-1 rounded-full hover:bg-gray-300 transition-all"
                            >
                                <div
                                    className="w-8 h-8 rounded-full bg-[#0073BB] text-white flex items-center justify-center text-sm font-semibold">
                                    {user.given_name?.[0]}
                                    {user.family_name?.[0]}
                                </div>
                            </button>

                            {dropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <Link
                                        href="/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => (window.location.href = "http://localhost:5000/logout")}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {projectId && (
                <aside
                    className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-lg ${
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
                >
                    <div className="px-5 pt-24 pb-6 flex flex-col h-full">
                        <p className="text-xs font-semibold text-[#4B5563] uppercase mb-4 tracking-wide">Navigation</p>
                        <nav className="flex flex-col gap-2 text-sm font-medium text-[#1A1A1A]">
                          <SidebarLink href={`/dashboard/project/${projectId}/overview`} icon={<Home size={18} />} onClick={() => setDropdownOpen(false)}>
                            Overview
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/updates`} icon={<Megaphone size={18} />} onClick={() => setDropdownOpen(false)}>
                            Client Updates
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/timeline`} icon={<CalendarDays size={18} />} onClick={() => setDropdownOpen(false)}>
                            Timeline
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/files`} icon={<FolderOpen size={18} />} onClick={() => setDropdownOpen(false)}>
                            Files & Docs
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/team`} icon={<Users2 size={18} />} onClick={() => setDropdownOpen(false)}>
                            Team & Roles
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/tasks`} icon={<ListChecks size={18} />} onClick={() => setDropdownOpen(false)}>
                            Tasks
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/budget`} icon={<ReceiptText size={18} />} onClick={() => setDropdownOpen(false)}>
                            Budget & Costs
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/inspections`} icon={<ShieldCheck size={18} />} onClick={() => setDropdownOpen(false)}>
                            Inspections
                          </SidebarLink>
                          <SidebarLink href={`/dashboard/project/${projectId}/notes`} icon={<StickyNote size={18} />} onClick={() => setDropdownOpen(false)}>
                            Notes & Comments
                          </SidebarLink>
                        </nav>
                    </div>
                </aside>
            )}
        </>
    );
}

function SidebarLink({
                         href,
                         icon,
                         children,
                         onClick,
                     }: {
    href: string;
    icon: JSX.Element;
    children: React.ReactNode;
    onClick: () => void;
}) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                isActive
                    ? "bg-[#E5F1FB] text-[#0073BB] font-semibold"
                    : "hover:bg-[#E5F1FB] hover:text-[#0073BB] text-[#1A1A1A]"
            }`}
        >
            {icon}
            <span>{children}</span>
        </Link>
    );
}
