"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import useSWR from "swr";
import { useState } from "react";

interface User {
  projectId: string;
  userId: string;
  family_name?: string;
  given_name?: string;
  addedAt: string;
  role: string;
  email: string;
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function TeamPage() {
  const project = useProject();
  const [emailInput, setEmailInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const {
    data: team = [],
    mutate,
    isLoading,
    error,
  } = useSWR<User[]>(
    project?.project.projectId
      ? `http://localhost:5000/api/project/${project.project.projectId}/team`
      : null,
    fetcher
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !project?.project.projectId) return;

    setIsAdding(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/project/${project.project.projectId}/add-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: emailInput.trim(), role: "member" }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to add user"}`);
        return;
      }

      alert("User added!");
      setEmailInput("");
      await mutate();
    } catch (err) {
      console.error("Failed to add user:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!project?.project.projectId) return;
    if (!confirm("Are you sure you want to remove this user from the project?")) return;

    setRemovingUserId(userId);
    try {
      const res = await fetch(
        `http://localhost:5000/api/project/${project.project.projectId}/remove-user`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to remove user"}`);
        return;
      }

      alert("User removed!");
      await mutate();
    } catch (err) {
      console.error("Failed to remove user:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setRemovingUserId(null);
    }
  };

  const sortedTeam = team.sort(
    (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
  );

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-8 bg-[#f7f8fa] min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Team</h1>

      {/* Add User Form */}
      <form
        onSubmit={handleAddUser}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-2"
      >
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="Add user by email"
          required
          className="w-full md:w-1/2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
        />
        <button
          type="submit"
          disabled={isAdding}
          className={`rounded-xl px-6 py-3 text-sm font-medium text-white shadow transition ${
            isAdding ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-900"
          }`}
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Team List */}
      {isLoading ? (
        <p className="text-gray-500">Loading team...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load team.</p>
      ) : sortedTeam.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedTeam.map((user) => {
            const displayName =
              [user.given_name, user.family_name].filter(Boolean).join(" ") || user.email;

            const isOwner = user.role === "owner";

            return (
              <div
                key={user.userId}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition"
              >
                <p className="text-lg font-medium text-gray-900">{displayName}</p>
                <p className="mt-1 text-sm text-gray-700">{user.email}</p>
                <p className="mt-1 text-sm text-gray-500 capitalize">{user.role}</p>

                {!isOwner && (
                  <button
                    onClick={() => handleRemoveUser(user.userId)}
                    disabled={removingUserId === user.userId}
                    className={`mt-3 rounded-lg text-white text-sm px-4 py-2 transition ${
                      removingUserId === user.userId
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {removingUserId === user.userId ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            );
          })}

        </div>
      ) : (
        <p className="text-gray-500">No team members found.</p>
      )}
    </div>
  );
}
