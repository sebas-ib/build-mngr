"use client";

import {useProject} from "@/components/ProjectLayoutWrapper";
import {useCallback, useEffect, useState} from "react";

interface User {
    projectId: string;
    userId: string;
    name: string;
    email: string;
    addedAt: string;
    role: string;
}

export default function TeamPage() {
    const project = useProject();
    const [team, setTeam] = useState<User[]>([]);
    const [emailInput, setEmailInput] = useState("");

    const getTeam = useCallback(async () => {
        const res = await fetch(`http://localhost:5000/api/project/${project.projectId}/team`, {
            credentials: "include",
        });

        if (res.ok) {
            const data = await res.json();
            setTeam(data);
        } else {
            console.error("Failed to load data");
        }
    }, [project.projectId]);

    useEffect(() => {
      if (project.projectId) {
        getTeam();
      }
    }, [project.projectId, getTeam]);

    return (
        <div className="p-6 pt-24 md:pl-72 space-y-4">
            <h1 className="text-2xl font-bold">Team</h1>


            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch(
                        `http://localhost:5000/api/project/${project.projectId}/add-user`,
                        {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            credentials: "include",
                            body: JSON.stringify({email: emailInput, role: "member"}),
                        }
                    );
                    if (res.ok) {
                        alert("User added!");
                        setEmailInput("");
                        getTeam();
                    } else {
                        const error = await res.json();
                        alert(`Error: ${error.error}`);
                        console.error(error);
                    }
                }}
                className="flex items-center space-x-2"
            >
                <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Add user by email"
                    required
                    className="border p-2 rounded w-full md:w-1/2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                    Add
                </button>
            </form>

            <div className="grid gap-6 md:grid-cols-2">
                {[...team]
                    .sort(
                        (a, b) =>
                            new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
                    )
                    .map((user) => (
                        <div key={user.userId} className="border p-4 rounded shadow-sm">
                            <p className="font-semibold">
                                {user.name ?? user.email ?? user.userId}
                            </p>
                            <p className="text-sm text-gray-500">{user.role}</p>
                        </div>
                    ))}
            </div>
        </div>
    );
}
