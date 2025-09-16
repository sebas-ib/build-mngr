"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

interface TimelineEvent {
  phase: string;
  date: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  notes: string;
}

export default function TimelinePage() {
  const { project, setProject } = useProject();

  const [newPhase, setNewPhase] = useState<TimelineEvent>({
    phase: "",
    date: "",
    status: "pending",
    notes: "",
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPhase, setEditingPhase] = useState<TimelineEvent | null>(null);

  const timeline = project.timeline || [];

  const saveTimeline = async (updatedTimeline: TimelineEvent[]) => {
    try {
      setProject({ ...project, timeline: updatedTimeline });

      const res = await fetch(
        `http://localhost:5000/api/projects/${project.projectId}/timeline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ timeline: updatedTimeline }),
        }
      );

      if (!res.ok) throw new Error("Failed to save timeline");
    } catch (err) {
      console.error("Error saving timeline:", err);
      alert("Failed to save timeline");
    }
  };

  const handleAddPhase = async () => {
    if (!newPhase.phase || !newPhase.date) return;
    const updatedTimeline = [...timeline, newPhase];
    setNewPhase({ phase: "", date: "", status: "pending", notes: "" });
    await saveTimeline(updatedTimeline);
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editingPhase) return;
    const updatedTimeline = timeline.map((item, idx) =>
      idx === editingIndex ? editingPhase : item
    );

    setEditingIndex(null);
    setEditingPhase(null);
    await saveTimeline(updatedTimeline);
  };

  const handleDelete = async (index: number) => {
    const updatedTimeline = timeline.filter((_, i) => i !== index);
    await saveTimeline(updatedTimeline);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditingPhase({ ...timeline[index] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "delayed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const updateEditingPhase = <K extends keyof TimelineEvent>(key: K, value: TimelineEvent[K]) => {
    setEditingPhase((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-10 bg-[#f9fafa] min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Project Timeline</h1>

      {/* Add Form (top) */}
      <section className="bg-white p-6 rounded-2xl shadow-md space-y-6">
        <h2 className="text-2xl font-medium text-gray-900">Add New Phase</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Phase Title"
            value={newPhase.phase}
            onChange={(e) => setNewPhase({ ...newPhase, phase: e.target.value })}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:ring-2 focus:ring-gray-200"
          />
          <input
            type="date"
            value={newPhase.date}
            onChange={(e) => setNewPhase({ ...newPhase, date: e.target.value })}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:ring-2 focus:ring-gray-200"
          />
          <select
            value={newPhase.status}
            onChange={(e) =>
              setNewPhase({ ...newPhase, status: e.target.value as TimelineEvent["status"] })
            }
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full focus:ring-2 focus:ring-gray-200"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
          <textarea
            placeholder="Notes"
            value={newPhase.notes}
            onChange={(e) => setNewPhase({ ...newPhase, notes: e.target.value })}
            rows={3}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full md:col-span-2 focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <button
          onClick={handleAddPhase}
          className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-900 transition"
        >
          Add Phase
        </button>
      </section>

      {/* Timeline Display */}
      <section className="relative ml-6 border-l-2 border-gray-300 space-y-6">
        {timeline
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((event, idx) => (
            <div key={idx} className="relative pl-10 pt-2 pb-6">
              <span className="absolute -left-[11px] top-2 bg-white p-1 rounded-full shadow">
                {getStatusIcon(event.status)}
              </span>
              <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                {editingIndex === idx && editingPhase ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingPhase.phase}
                      onChange={(e) => updateEditingPhase("phase", e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
                    />
                    <input
                      type="date"
                      value={editingPhase.date}
                      onChange={(e) => updateEditingPhase("date", e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
                    />
                    <select
                      value={editingPhase.status}
                      onChange={(e) =>
                        updateEditingPhase("status", e.target.value as TimelineEvent["status"])
                      }
                      className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                    </select>
                    <textarea
                      value={editingPhase.notes}
                      onChange={(e) => updateEditingPhase("notes", e.target.value)}
                      rows={3}
                      className="border border-gray-300 rounded-xl px-4 py-3 text-sm w-full"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-black text-white px-6 py-3 rounded-xl text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditingPhase(null);
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-xl font-semibold text-gray-900">{event.phase}</h2>
                      <span className="text-sm text-gray-500">{event.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize font-medium">{event.status}</span>
                    </p>
                    <p className="mt-2 text-gray-700 text-sm">{event.notes}</p>
                    <div className="flex justify-end gap-4 mt-3">
                      <button
                        onClick={() => handleEdit(idx)}
                        className="text-blue-500 text-sm hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
