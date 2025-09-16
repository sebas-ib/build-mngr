// app/dashboard/projects/page.tsx (Improved layout, visible role badges, actions in 3-dot menu)
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProjects } from '@/app/dashboard/context/ProjectsContext';
import Navbar from '@/app/dashboard/components/Navbar';
import type { Project } from '@/app/dashboard/context/ProjectsContext';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectsOverview() {
  const { ownedProjects = [], sharedProjects = [], deleteProject, leaveProject } = useProjects();

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId);
    }
  };

  const RoleBadge = ({ role }: { role: string }) => (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide bg-white/70 backdrop-blur-sm"
      title={`Your role: ${role}`}
    >
      <span
        className={
          role === 'owner'
            ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
            : role === 'editor' || role === 'contributor'
            ? 'h-1.5 w-1.5 rounded-full bg-blue-500'
            : 'h-1.5 w-1.5 rounded-full bg-gray-400'
        }
      />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );

  const ProjectCard = ({ p, canDelete }: { p: Project; canDelete: boolean }) => {
    const router = useRouter();
    const [busy, setBusy] = useState<null | 'leave' | 'delete'>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Ensure role is visible for owned items too
    const role = p.currentUserRole || (canDelete ? 'owner' : 'viewer');
    const destination = `/dashboard/project/${p.projectId}/overview`;

    const goToProject = useCallback(() => {
      router.push(destination);
    }, [router, destination]);

    const onKeyDownCard: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToProject();
      }
    };

    // Close menu on click outside
    useEffect(() => {
      if (!menuOpen) return;
      const onDocClick = (e: MouseEvent) => {
        if (!menuRef.current) return;
        if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      };
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onEsc);
      return () => {
        document.removeEventListener('mousedown', onDocClick);
        document.removeEventListener('keydown', onEsc);
      };
    }, [menuOpen]);

    const onLeave = async () => {
      if (!confirm(`Leave "${p.name || 'this project'}"? You will lose access.`)) return;
      try {
        setBusy('leave');
        await leaveProject?.(p.projectId);
      } catch (err) {
        alert((err as Error)?.message || 'Failed to leave project.');
      } finally {
        setBusy(null);
        setMenuOpen(false);
      }
    };

    const onDelete = async () => {
      if (!confirm(`Delete "${p.name || 'this project'}"? This cannot be undone.`)) return;
      try {
        setBusy('delete');
        await handleDelete(p.projectId);
      } finally {
        setBusy(null);
        setMenuOpen(false);
      }
    };

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={goToProject}
        onKeyDown={onKeyDownCard}
        aria-label={`Open ${p.name || 'project'}`}
        className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {/* Top row: name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold leading-6 text-gray-900">
                {p.name || '(Untitled Project)'}
              </h2>
              {role && <RoleBadge role={role} />}
            </div>

            {/* Small link that supports cmd/ctrl+click; stops propagation */}
            <Link
              href={destination}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-block text-sm text-gray-500 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              View details
            </Link>
          </div>

          {/* 3-dot menu trigger + menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More actions"
              className="rounded-lg p-1 text-gray-500 outline-none transition hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                tabIndex={-1}
                className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                {role !== 'owner' && (
                  <button
                    role="menuitem"
                    onClick={onLeave}
                    disabled={busy === 'leave'}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {/* Optional icon: <LogOut className="h-4 w-4" /> */}
                    {busy === 'leave' ? 'Leaving…' : 'Leave'}
                  </button>
                )}

                {canDelete && (
                  <button
                    role="menuitem"
                    onClick={onDelete}
                    disabled={busy === 'delete'}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {busy === 'delete' ? 'Deleting…' : 'Delete'}
                  </button>
                )}

                {!canDelete && role === 'owner' && (
                  <div className="px-3 py-2 text-sm text-gray-500">No actions</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />

      <div className="mx-auto w-full px-6 pb-16 pt-24">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, manage, and collaborate on your projects. Your role is shown on every card.
            </p>
          </div>

          <Link
            href="/dashboard/new-project"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </header>

        {/* Quick filters / tabs */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border bg-white px-3 py-1 text-gray-700">
            All ({ownedProjects.length + sharedProjects.length})
          </span>
          <span className="rounded-full border bg-white px-3 py-1 text-gray-700">
            Owned ({ownedProjects.length})
          </span>
          <span className="rounded-full border bg-white px-3 py-1 text-gray-700">
            Shared ({sharedProjects.length})
          </span>
        </nav>

        {/* Owned */}
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Owned by you</h2>
            {ownedProjects.length > 0 && (
              <p className="text-sm text-gray-500">{ownedProjects.length} project(s)</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedProjects.length ? (
              ownedProjects.map((p) => <ProjectCard key={p.projectId} p={p} canDelete />)
            ) : (
              <EmptyState
                title="No owned projects yet"
                subtitle="Create one to get started."
                actionHref="/dashboard/new-project"
                actionLabel="New Project"
              />
            )}
          </div>
        </section>

        {/* Shared */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Shared with you</h2>
            {sharedProjects.length > 0 && (
              <p className="text-sm text-gray-500">{sharedProjects.length} project(s)</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedProjects.length ? (
              sharedProjects.map((p) => <ProjectCard key={p.projectId} p={p} canDelete={false} />)
            ) : (
              <EmptyState
                title="Nothing shared with you (yet)"
                subtitle="You'll see projects here when others invite you."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function formatDate(d: string | number | Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return '';
  }
}

function EmptyState({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed p-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black"
        >
          <Plus className="h-4 w-4" /> {actionLabel}
        </Link>
      )}
    </div>
  );
}
