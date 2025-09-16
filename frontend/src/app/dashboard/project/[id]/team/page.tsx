"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";

/** ---------- Types ---------- */
type Role = "owner" | "admin" | "contributor" | "guest" | "member"; // "member" = legacy

interface User {
  projectId: string;
  userId: string;
  family_name?: string;
  given_name?: string;
  addedAt: string; // ISO
  role: Role;
  email: string;
}

interface ProjectContextShape {
  project?: { projectId: string };
}

type CurrentRole = Exclude<Role, "member"> | null;

type MeResp = {
  authenticated: boolean;
  user: {
    userId: string;
    email: string;
    given_name?: string;
    family_name?: string;
    current_role?: Exclude<Role, "member"> | null;
  };
};

const ROLE_OPTIONS: { value: Exclude<Role, "owner" | "member"> | "member"; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "contributor", label: "Contributor" },
  { value: "guest", label: "Guest" },
];

const emailLooksValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const initials = (given?: string, family?: string, email?: string) => {
  const name = [given, family].filter(Boolean).join(" ").trim();
  if (name) {
    const parts = name.split(/\s+/);
    return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string; detail?: string };
      if (j?.error) message = j.error;
      else if (j?.detail) message = j.detail;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
};

/** ---------- Permission helpers (mirror backend rules) ---------- */
const canChangeRole = (
  actor: CurrentRole,
  targetRole: Role,
  targetUserId: string,
  myUserId?: string
) => {
  if (!actor) return false;
  // Prevent owners/admins from changing their own role (UI guard; backend also checks)
  if (targetUserId === myUserId && (actor === "owner" || actor === "admin")) return false;

  if (actor === "owner") {
    // Owner can change any non-owner role
    return targetRole !== "owner";
  }
  if (actor === "admin") {
    // Admin can only toggle contributor <-> guest; cannot touch owner/admin
    return targetRole !== "owner" && targetRole !== "admin";
  }
  return false;
};

const canRemove = (
  actor: CurrentRole,
  targetRole: Role,
  targetUserId: string,
  myUserId?: string
) => {
  if (!actor) return false;

  if (actor === "owner") {
    // Owner cannot remove owner and not self
    return targetRole !== "owner" && targetUserId !== myUserId;
  }
  if (actor === "admin") {
    // Admin cannot remove owners/admins nor self
    return targetRole !== "owner" && targetRole !== "admin" && targetUserId !== myUserId;
  }
  return false;
};

export default function TeamPage() {
  const projectCtx = useProject() as ProjectContextShape | null;
  const projectId = projectCtx?.project?.projectId ?? "";

  // Invite form state
  const [emailInput, setEmailInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<Exclude<Role, "owner" | "member">>("contributor");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Row action state
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);

  // UX helpers
  const [inlineMsg, setInlineMsg] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  // Team list
  const { data: team, mutate, isLoading, error } = useSWR<User[]>(
    projectId ? `http://localhost:5000/api/project/${projectId}/team` : null,
    (url: string) => fetcher<User[]>(url)
  );

  // Current user's role (from /me?project_id=...)
  const { data: me, error: meError } = useSWR<MeResp>(
    projectId ? `http://localhost:5000/api/me?project_id=${encodeURIComponent(projectId)}` : null,
    (url: string) => fetcher<MeResp>(url)
  );

  // Normalize role defensively (lowercase & known value)
  const myRoleRaw = (me?.user?.current_role ?? null) as CurrentRole | null;
  const myRole = (typeof myRoleRaw === "string"
    ? (myRoleRaw.toLowerCase() as CurrentRole)
    : null) as CurrentRole;

  const myUserId = me?.user?.userId;

  // Consider /me "loaded" if it resolved (success or error) when a projectId exists
  const meLoaded = Boolean(projectId) && (me !== undefined || meError !== undefined);

  // Only allow managing after /me resolves and confirms admin/owner
  const canManageMembers = meLoaded && (myRole === "owner" || myRole === "admin");

  // Auto-dismiss inline messages
  useEffect(() => {
    if (!inlineMsg) return;
    const t = setTimeout(() => setInlineMsg(""), 4000);
    return () => clearTimeout(t);
  }, [inlineMsg]);

  // Sort: owner first, then admin, then others; within groups by name/email
  const sortedTeam = useMemo<User[]>(() => {
    const list = (team ?? []).slice();
    const rank = (r: Role) => (r === "owner" ? 0 : r === "admin" ? 1 : 2);
    return list.sort((a, b) => {
      const r = rank(a.role) - rank(b.role);
      if (r !== 0) return r;
      const an = ([a.given_name, a.family_name].filter(Boolean).join(" ") || a.email).toLowerCase();
      const bn = ([b.given_name, b.family_name].filter(Boolean).join(" ") || b.email).toLowerCase();
      return an.localeCompare(bn);
    });
  }, [team]);

  // Filter by search query (name/email/role)
  const filteredTeam = useMemo<User[]>(
    () => {
      const q = query.trim().toLowerCase();
      if (!q) return sortedTeam;
      return sortedTeam.filter((u) => {
        const name = [u.given_name, u.family_name].filter(Boolean).join(" ");
        return [name, u.email, u.role].some((val) => (val ?? "").toString().toLowerCase().includes(q));
      });
    },
    [sortedTeam, query]
  );

  const countsByRole = useMemo(() => {
    const counts = new Map<Role, number>();
    (team ?? []).forEach((u) => counts.set(u.role, (counts.get(u.role) ?? 0) + 1));
    return counts;
  }, [team]);

  /** ---------- Actions ---------- */
  const handleAddUser = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setInlineMsg("");
      if (!projectId) {
        setInlineMsg("No project selected.");
        return;
      }
      const email = emailInput.trim();
      if (!email || !emailLooksValid(email)) {
        setInlineMsg("Please enter a valid email.");
        return;
      }

      setIsAdding(true);
      try {
        const res = await fetch(`http://localhost:5000/api/project/${projectId}/add-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, role: roleInput }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
          let msg = payload.error || payload.detail || "Failed to add user.";
          if (res.status === 400 && /email/i.test(msg)) msg = "Please enter a valid email.";
          if (res.status === 403) msg = "Only Owner or Admin can add members.";
          if (res.status === 404) msg = "User not found.";
          if (res.status === 409) msg = "User is already a member of this project.";
          setInlineMsg(msg);
          return;
        }

        setInlineMsg("Invitation sent / user added.");
        setEmailInput("");
        setRoleInput("contributor");
        await mutate();
      } catch (err) {
        console.error("Failed to add user:", err);
        setInlineMsg("Something went wrong. Please try again.");
      } finally {
        setIsAdding(false);
      }
    },
    [emailInput, roleInput, mutate, projectId]
  );

  const handleRemoveUser = useCallback(
    async (userId: string) => {
      setInlineMsg("");
      if (!projectId) {
        setInlineMsg("No project selected.");
        return;
      }
      const confirmed = window.confirm("Remove this member from the project?");
      if (!confirmed) return;

      setRemovingUserId(userId);
      try {
        const res = await fetch(`http://localhost:5000/api/project/${projectId}/remove-user`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
          let msg = payload.error || payload.detail || "Failed to remove user.";
          if (res.status === 403) msg = "Insufficient permission to remove this member.";
          if (res.status === 404) msg = "User is not a member of this project.";
          setInlineMsg(msg);
          return;
        }

        setInlineMsg("Member removed.");
        await mutate();
      } catch (err) {
        console.error("Failed to remove user:", err);
        setInlineMsg("Something went wrong. Please try again.");
      } finally {
        setRemovingUserId(null);
      }
    },
    [mutate, projectId]
  );

  const handleChangeRole = useCallback(
    async (userId: string, nextRole: Exclude<Role, "owner">) => {
      setInlineMsg("");
      if (!projectId) {
        setInlineMsg("No project selected.");
        return;
      }
      setChangingRoleUserId(userId);
      try {
        const res = await fetch(`http://localhost:5000/api/project/${projectId}/change-role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId, role: nextRole }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
          let msg = payload.error || payload.detail || "Failed to change role.";
          if (res.status === 403) {
            if (/Only Owner or Admin can change roles/i.test(msg)) msg = "Only Owner or Admin can change roles.";
            else if (/Admins cannot change/i.test(msg)) msg = "Admins cannot change Owner/Admin roles or assign Admin.";
            else msg = "Insufficient permission to change this role.";
          }
          if (res.status === 404) msg = "User is not a member of this project.";
          setInlineMsg(msg);
          return;
        }

        setInlineMsg("Role updated.");
        await mutate();
      } catch (err) {
        console.error("Failed to change role:", err);
        setInlineMsg("Something went wrong. Please try again.");
      } finally {
        setChangingRoleUserId(null);
      }
    },
    [mutate, projectId]
  );

  /** ---------- UI ---------- */
  return (
    <div className="p-6 pt-24 md:pl-72 space-y-8 bg-[#f7f8fa] min-h-screen">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-gray-600">Manage who can access this project and what they can do.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 shadow-sm">
            Total <span className="font-medium text-gray-900">{team?.length ?? 0}</span>
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <div className="hidden sm:flex gap-2">
            {(["owner", "admin", "contributor"] as Role[]).map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}{" "}
                <span className="font-medium text-gray-900">{countsByRole.get(r) ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Inline message */}
      {!!inlineMsg && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 shadow flex items-start justify-between"
        >
          <span>{inlineMsg}</span>
          <button
            type="button"
            onClick={() => setInlineMsg("")}
            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
            aria-label="Dismiss message"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Invite section (visible only to Owner/Admin after /me is loaded) */}
      {meLoaded && canManageMembers && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:shadow-md">
          <h2 className="text-base font-semibold text-gray-900">Add contributors</h2>
          <p className="mt-1 text-sm text-gray-600">Enter an email and choose a role.</p>

          <form onSubmit={handleAddUser} className="mt-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              {/* Email */}
              <div className="relative md:flex-1">
                <label className="sr-only" htmlFor="invite-email">Email</label>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  required
                  aria-label="Invite by email"
                  aria-invalid={!emailLooksValid(emailInput) && emailInput.length > 0}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-3 pr-3 py-2.5 text-gray-900 shadow-sm focus:z-10 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* Role */}
              <div className="md:-ml-px">
                <label className="sr-only" htmlFor="invite-role">Role</label>
                <select
                  id="invite-role"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as Exclude<Role, "owner" | "member">)}
                  className="w-full md:w-48 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:z-10 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition md:rounded-none"
                  aria-label="Role"
                  title="Select role"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Invite button */}
              <div className="md:-ml-px">
                <button
                  type="submit"
                  disabled={isAdding || !projectId}
                  title={!projectId ? "Select a project first" : "Send invite"}
                  className={`inline-flex h-full min-h-[42px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow
                ${isAdding || !projectId ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-900 focus:z-10"}`}
                >
                  {isAdding ? "Sending…" : "Invite"}
                </button>
              </div>
            </div>

            {/* Helper / validation */}
            <div className="mt-2 flex items-center justify-between">
              {!emailLooksValid(emailInput) && emailInput.length > 0 ? (
                <p className="text-xs text-red-600">This email doesn’t look valid.</p>
              ) : (
                <span className="text-xs text-gray-500"></span>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Search + list */}
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <label className="sr-only" htmlFor="member-search">Search</label>
            <input
              id="member-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1.5 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                aria-label="Clear search"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{filteredTeam.length}</span>{" "}
            of <span className="font-medium text-gray-900">{team?.length ?? 0}</span>
          </p>
        </div>

        {/* Loading / error / empty */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200" />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600">{error instanceof Error ? error.message : "Failed to load team."}</p>
        ) : filteredTeam.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            <p className="text-sm">No matching members. Try a different search.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-md">
            {filteredTeam.map((user) => {
              const displayName = [user.given_name, user.family_name].filter(Boolean).join(" ") || user.email;
              const isOwner = user.role === "owner";
              const isRemoving = removingUserId === user.userId;
              const isChanging = changingRoleUserId === user.userId;

              const showRoleSelect =
                meLoaded &&
                !isOwner &&
                canManageMembers &&
                canChangeRole(myRole, user.role, user.userId, myUserId);

              const showRemoveButton =
                meLoaded &&
                !isOwner &&
                canManageMembers &&
                canRemove(myRole, user.role, user.userId, myUserId);

              return (
                <li key={user.userId} className="p-4 md:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: avatar + identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 shrink-0 rounded-full bg-gray-900 text-white grid place-items-center font-semibold"
                        aria-hidden
                        title={displayName}
                      >
                        {initials(user.given_name, user.family_name, user.email)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {/* Right: role + actions */}
                    <div className="flex items-center gap-3">
                      {/* Role display / select */}
                      {isOwner ? (
                        <span
                          className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-900"
                          title="Project owner"
                        >
                          Owner
                        </span>
                      ) : showRoleSelect ? (
                        <>
                          <label className="sr-only" htmlFor={`role-${user.userId}`}>Role</label>
                          <select
                            id={`role-${user.userId}`}
                            value={ROLE_OPTIONS.find((o) => o.value === user.role) ? user.role : "contributor"}
                            onChange={(e) =>
                              handleChangeRole(user.userId, e.target.value as Exclude<Role, "owner">)
                            }
                            disabled={isChanging}
                            className={`rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition ${
                              isChanging ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                            aria-label={`Change role for ${displayName}`}
                            title="Change role"
                          >
                            {ROLE_OPTIONS
                              // Admins cannot assign Admin; Owners can assign any non-owner
                              .filter((opt) => (myRole === "admin" ? opt.value !== "admin" : true))
                              .map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            {/* Show legacy role only if present on the user; selection normalizes to contributor */}
                            {!ROLE_OPTIONS.find((o) => o.value === user.role) && user.role === "member" && (
                              <option value="member">Member (legacy)</option>
                            )}
                          </select>
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-900">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}

                      {/* Remove */}
                      {showRemoveButton && (
                        <button
                          onClick={() => handleRemoveUser(user.userId)}
                          disabled={isRemoving}
                          className={`rounded-lg text-white text-sm px-3 py-2 transition ${
                            isRemoving ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                          }`}
                          aria-disabled={isRemoving}
                          title="Remove from project"
                        >
                          {isRemoving ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Role help */}
      <section className="text-xs text-gray-600">
        <details className="group">
          <summary className="cursor-pointer select-none text-gray-700 hover:text-gray-900">
            Role overview
            <span className="ml-1 text-gray-400 group-open:hidden">▸</span>
            <span className="ml-1 text-gray-400 hidden group-open:inline">▾</span>
          </summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <p>
                <span className="font-medium">Owner</span>: full control; can assign Admin, Contributor, Guest.
              </p>
              <p>
                <span className="font-medium">Admin</span>: manage members; cannot change ownership or other admins’
                roles; may assign Contributor/Guest.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <p><span className="font-medium">Contributor</span>: contribute to project content.</p>
              <p><span className="font-medium">Guest</span>: read‑only / minimal access.</p>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
