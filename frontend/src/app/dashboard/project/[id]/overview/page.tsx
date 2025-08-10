"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useMemo, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function OverviewPage() {
  const { project, setProject } = useProject();

  // Editable fields
  const [name, setName] = useState(project.name || "");
  const [client, setClient] = useState(project.client || "");
  const [location, setLocation] = useState(project.location || "");
  const [startDate, setStartDate] = useState(project.startDate || "");
  const [endDate, setEndDate] = useState(project.endDate || "");
  const [status, setStatus] = useState(project.status || "");
  const [description, setDescription] = useState(project.description || "");
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [notes, setNotes] = useState(project.notes || "");
  const [team, setTeam] = useState(project.team || []);

  // === Progress Calculation from Timeline ===
  const progress = useMemo(() => {
    if (!project.timeline || project.timeline.length === 0) return 0;
    const completedPhases = project.timeline.filter((t) => t.status.toLowerCase() === "completed").length;
    return Math.round((completedPhases / project.timeline.length) * 100);
  }, [project.timeline]);

  const progressColor = useMemo(() => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  }, [progress]);

const saveSingleField = async (field: string, value: any) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/project/${project.projectId}/update-field`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ field, value }),
      }
    );

    if (!response.ok) throw new Error("Failed to save");

    const data = await response.json();

    setProject((prev) => ({
      ...prev,
      [field]: data.updated[field] ?? value,
    }));
  } catch (err) {
    console.error(err);
    alert(`Failed to save ${field}.`);
  }
};

  const addMilestone = () => {
    const newMilestone = { title: "", date: "", completed: false };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = async (index: number, field: string, value: string | boolean) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);

    try {
      const response = await fetch(`http://localhost:5000/api/project/${project.projectId}/update-milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ index, field, value }),
      });

      if (!response.ok) throw new Error("Failed to save milestone");
    } catch (err) {
      console.error(err);
      alert("Failed to save milestone change.");
    }
  };

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-10 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Project Overview</h1>
      </header>

      {/* Editable Inputs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <EditableField label="Project Name" value={name} onSave={async (val) => { setName(val); await saveSingleField("name", val); }} />
        <EditableField label="Client" value={client} onSave={async (val) => { setClient(val); await saveSingleField("client", val); }} />
        <EditableField label="Location" value={location} onSave={async (val) => { setLocation(val); await saveSingleField("location", val); }} />
        <EditableField label="Start Date" value={startDate} type="date" onSave={async (val) => { setStartDate(val); await saveSingleField("startDate", val); }} />
        <EditableField label="End Date" value={endDate} type="date" onSave={async (val) => { setEndDate(val); await saveSingleField("endDate", val); }} />
        <EditableField label="Status" value={status} onSave={async (val) => { setStatus(val); await saveSingleField("status", val); }} />
      </section>

      {/* Progress Bar (Based on Timeline) */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Overall Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className={`${progressColor} h-full transition-all`} style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-gray-600">{progress}% completed (based on timeline)</p>
      </section>

      {/* Description */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Description</h2>
        <EditableField
          label="Job Description"
          value={description}
          onSave={async (val) => { setDescription(val); await saveSingleField("description", val); }}
        />
      </section>

      {/* Milestones */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
          <button
            onClick={addMilestone}
            className="bg-black text-white px-3 py-1 rounded hover:bg-gray-900 text-sm flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" /> Add Milestone
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {milestones.map((m, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="p-2">
                    <InlineEditableCell
                      value={m.title}
                      onSave={(val) => updateMilestone(i, "title", val)}
                    />
                  </td>
                  <td className="p-2">
                    <InlineEditableCell
                      value={m.date}
                      type="date"
                      onSave={(val) => updateMilestone(i, "date", val)}
                    />
                  </td>
                  <td className="p-2 text-sm">
                    <InlineEditableSelect
                      value={m.completed ? "Completed" : "Pending"}
                      options={["Pending", "Completed"]}
                      onSave={(val) => updateMilestone(i, "completed", val === "Completed")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
        {Array.isArray(notes) && notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold">{note.title}</h3>
              <p className="text-sm text-gray-600">By {note.author} on {note.createdAt}</p>
              <p>{note.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400 italic">No notes yet</p>
        )}
      </section>
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = async () => {
    await onSave(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5" onDoubleClick={() => !isEditing && setIsEditing(true)}>
      <label className="text-xs uppercase text-gray-500 block mb-1">{label}</label>
      {isEditing ? (
        <div className="flex gap-2 items-center">
          <input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="text-base font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-2 w-full"
          />
          <button onClick={handleSave} className="bg-black text-white px-2 py-1 rounded hover:bg-gray-900 text-sm">Save</button>
          <button onClick={handleCancel} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">Cancel</button>
        </div>
      ) : (
        <p className="text-base font-medium text-gray-900 cursor-pointer">
          {value || <span className="text-gray-400 italic">Double-click to edit</span>}
        </p>
      )}
    </div>
  );
}

function InlineEditableCell({
  value,
  onSave,
  type = "text",
}: {
  value: string;
  onSave: (val: string) => Promise<void> | void;
  type?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = async () => {
    await onSave(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return isEditing ? (
    <div className="flex gap-1 items-center">
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="border px-2 py-1 rounded w-full"
      />
      <button onClick={handleSave} className="bg-black text-white px-2 py-1 rounded text-xs">Save</button>
      <button onClick={handleCancel} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
    </div>
  ) : (
    <p onDoubleClick={() => setIsEditing(true)} className="cursor-pointer">
      {value || <span className="text-gray-400 italic">Double-click to edit</span>}
    </p>
  );
}

function InlineEditableSelect({
  value,
  options,
  onSave,
}: {
  value: string;
  options: string[];
  onSave: (val: string) => Promise<void> | void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSave = async () => {
    await onSave(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return isEditing ? (
    <div className="flex gap-1 items-center">
      <select
        className="border px-2 py-1 rounded"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <button onClick={handleSave} className="bg-black text-white px-2 py-1 rounded text-xs">Save</button>
      <button onClick={handleCancel} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Cancel</button>
    </div>
  ) : (
    <p onDoubleClick={() => setIsEditing(true)} className="cursor-pointer">
      {value}
    </p>
  );
}
