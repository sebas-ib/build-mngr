"use client";

import { JSX, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Home,
  FilePlus,
  Users,
  FileText,
  CalendarClock,
  ClipboardEdit,
  Menu,
  X,
  Settings,
} from "lucide-react";

const projectNames: Record<string, string> = {
  alpha: "Kitchen Remodel – Alpha St.",
  beta: "Office Build-out – Beta LLC",
};

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const params = useParams();
  const projectId = params?.id as string;
  const projectName = projectId ? projectNames[projectId] || `Project: ${projectName}` : "BuildManager";

  return (
    <>
      {/* Top navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex py-6 justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-[#4B5563] hover:text-[#1A1A1A]"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <Link href="/dashboard" className="text-sm text-[#6B7280] hover:text-black transition">
                Projects
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-xl font-semibold text-[#1A1A1A]">{projectName}</span>
            </div>
          </div>

          <div className="hidden md:flex gap-4 items-center px-16">
            <Link
              href="/settings"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center px-2 py-2 rounded-xl hover:bg-[#E5F1FB] hover:text-[#0073BB] transition-colors"
            >
              {<Settings size={18} />}
              <span></span>
            </Link>
            {/* Replace this with real user avatar later */}
            <div className="w-8 h-8 rounded-full bg-gray-300">
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out shadow-lg ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-5 py-25  flex flex-col h-full">
          <div>
            <p className="text-xs font-semibold text-[#4B5563] uppercase mb-4 tracking-wide">Navigation</p>
            <nav className="flex flex-col gap-2 text-sm font-medium text-[#1A1A1A]">
              <SidebarLink href="/client-updates" icon={<ClipboardEdit size={18} />} onClick={() => setIsSidebarOpen(false)}>
                Client Updates
              </SidebarLink>
              <SidebarLink href="/timeline" icon={<CalendarClock size={18} />} onClick={() => setIsSidebarOpen(false)}>
                Project Timeline
              </SidebarLink>
              <SidebarLink href="/invoices" icon={<FileText size={18} />} onClick={() => setIsSidebarOpen(false)}>
                Invoices & Docs
              </SidebarLink>
              <SidebarLink href="/team" icon={<Users size={18} />} onClick={() => setIsSidebarOpen(false)}>
                Team & Access
              </SidebarLink>
            </nav>
          </div>

          <div className="mt-auto pt-6">
            <Link
              href="/"
              className="text-sm text-red-600 hover:text-red-700 transition"
            >
              Log out
            </Link>
          </div>
        </div>
      </aside>
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
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#E5F1FB] hover:text-[#0073BB] transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
