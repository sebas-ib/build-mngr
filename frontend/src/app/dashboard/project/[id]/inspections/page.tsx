"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useState } from "react";
import {
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";

interface Inspection {
  id: string;
  title: string;
  date: string;
  inspector: string;
  status: "Pending" | "Passed" | "Failed";
  notes: string;
}

export default function InspectionsPage() {
  const { project, setProject } = useProject();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof Inspection | null>(null);
  const [adding, setAdding] = useState(false);

  const inspections = project.inspections || [];

  const handleDelete = async (id: string) => {
    const next = inspections.filter((i) => i.id !== id);

    setProject({
      ...project,
      inspections: next,
    });

    try {
      const res = await fetch(
        `http://localhost:5000/api/project/${project.projectId}/inspections`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(next),
        }
      );

      if (!res.ok) throw new Error("Failed to delete inspection");
    } catch (err) {
      console.error(err);
      alert("Error deleting inspection");
    }
  };

  const handleUpdate = async (updated: Inspection) => {
    const next = inspections.some((i) => i.id === updated.id)
      ? inspections.map((i) => (i.id === updated.id ? updated : i))
      : [...inspections, updated];

    setProject({
      ...project,
      inspections: next,
    });

    setEditingId(null);
    setAdding(false);

    try {
      const res = await fetch(
        `http://localhost:5000/api/project/${project.projectId}/inspections`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(next),
        }
      );

      if (!res.ok) throw new Error("Failed to update inspections");
    } catch (err) {
      console.error(err);
      alert("Error updating inspections");
    }
  };

  const sortedInspections = sortKey
    ? [...inspections].sort((a, b) => (a[sortKey]! > b[sortKey]! ? 1 : -1))
    : inspections;

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-8 bg-[#f9fafa] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          Inspections
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-sm px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            <PlusCircleIcon className="w-4 h-4" /> Add
          </button>
          <select
            className="text-sm px-3 py-2 border rounded-lg bg-white shadow-sm"
            onChange={(e) => setSortKey(e.target.value as keyof Inspection)}
          >
            <option value="">Sort by</option>
            <option value="date">Date</option>
            <option value="status">Status</option>
            <option value="inspector">Inspector</option>
          </select>
        </div>
      </div>

      {(adding || sortedInspections.length === 0) && (
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <InlineEditForm
            insp={{
              id: uuidv4(),
              title: "",
              date: "",
              inspector: "",
              status: "Pending",
              notes: "",
            }}
            onSave={handleUpdate}
            onCancel={() => {
              setAdding(false);
              setEditingId(null);
            }}
          />
        </div>
      )}

      {sortedInspections.length > 0 && (
        <div className="space-y-4">
          {sortedInspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition"
            >
              {editingId === insp.id ? (
                <InlineEditForm
                  insp={insp}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {insp.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {insp.date} &mdash; {insp.inspector}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        insp.status === "Passed"
                          ? "bg-green-100 text-green-700"
                          : insp.status === "Failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {insp.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">
                      {insp.notes}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={() => setEditingId(insp.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(insp.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineEditForm({
  insp,
  onSave,
  onCancel,
}: {
  insp: Inspection;
  onSave: (i: Inspection) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(insp);

  return (
    <div className="space-y-3">
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Inspection Title"
      />
      <input
        type="date"
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.inspector}
        onChange={(e) => setForm({ ...form, inspector: e.target.value })}
        placeholder="Inspector Name"
      />
      <select
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.status}
        onChange={(e) =>
          setForm({
            ...form,
            status: e.target.value as Inspection["status"],
          })
        }
      >
        <option>Pending</option>
        <option>Passed</option>
        <option>Failed</option>
      </select>
      <textarea
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Additional notes..."
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSave(form)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-gray-500 px-4 py-2 rounded-xl text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
