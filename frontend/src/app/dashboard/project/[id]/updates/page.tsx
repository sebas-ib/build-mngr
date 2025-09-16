"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useState, useEffect, useRef } from "react";

export default function UpdatesPage() {
  const { project, setProject } = useProject();
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    author: "",
    date: "",
    summary: "",
  });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      if (hasFetched.current) return; // only fetch once per page load
      hasFetched.current = true;

      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/projects/${project.projectId}/updates`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProject(prev => {
          if (!prev) return prev; // keep null as null
          return { ...prev, updates: data };
        });
      }
      setLoading(false);
    };

    fetchUpdates();
  }, [project.projectId, setProject]);

  const handleAddUpdate = async () => {
    if (!newUpdate.title || !newUpdate.author || !newUpdate.date || !newUpdate.summary) return;

    const res = await fetch(`http://localhost:5000/api/projects/${project.projectId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newUpdate),
    });

    if (res.ok) {
      const added = await res.json(); // the newly created update
      setProject(prev => {
        if (!prev) return prev; // keep null as null
        const existing = Array.isArray(prev.updates) ? prev.updates : [];
        return { ...prev, updates: [added, ...existing] };
      });
      setNewUpdate({ title: "", author: "", date: "", summary: "" });
    }
  };

  const filteredUpdates =
    project.updates?.filter(update =>
      [update.author, update.title, update.summary]
        .some(field => field.toLowerCase().includes(filter.toLowerCase()))
    ) || [];

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-10 bg-[#f9fafa] min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Client Updates</h1>

      {/* Post New Update */}
      <section className="bg-white p-6 rounded-2xl shadow-md space-y-6">
        <h2 className="text-2xl font-medium text-gray-900">Post New Update</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newUpdate.title}
            onChange={e => setNewUpdate({ ...newUpdate, title: e.target.value })}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
          />
          <input
            type="text"
            placeholder="Author"
            value={newUpdate.author}
            onChange={e => setNewUpdate({ ...newUpdate, author: e.target.value })}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
          />
          <input
            type="date"
            value={newUpdate.date}
            onChange={e => setNewUpdate({ ...newUpdate, date: e.target.value })}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
          />
          <textarea
            placeholder="Summary"
            value={newUpdate.summary}
            onChange={e => setNewUpdate({ ...newUpdate, summary: e.target.value })}
            rows={3}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full md:col-span-2"
          />
        </div>
        <button
          onClick={handleAddUpdate}
          className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-900 transition"
        >
          Add Update
        </button>
      </section>

      {/* Filter */}
      <section className="space-y-4">
        <input
          type="text"
          placeholder="Filter updates by keyword or author..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
        />
      </section>

      {/* Updates List */}
      <section className="space-y-6">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading updates...</p>
        ) : filteredUpdates.length > 0 ? (
          filteredUpdates
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((update, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-md p-6 space-y-3 border border-gray-100 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{update.title}</h2>
                  <span className="text-sm text-gray-500">{update.date}</span>
                </div>
                <p className="text-sm text-gray-600 italic">By {update.author}</p>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{update.summary}</p>
              </div>
            ))
        ) : (
          <p className="text-gray-500 text-sm">No updates found.</p>
        )}
      </section>
    </div>
  );
}
