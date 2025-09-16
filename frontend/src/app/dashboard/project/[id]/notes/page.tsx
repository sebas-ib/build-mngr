"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
}

const today = () => new Date().toISOString().split("T")[0];

export default function NotesPage() {
  const { project, setProject } = useProject();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const notes: Note[] = (project?.notes as Note[]) || [];

  const saveToBackend = async (updatedNotes: Note[]) => {
    const prev = project;
    // optimistic UI
    setProject({ ...project, notes: updatedNotes });

    const res = await fetch(
      `http://localhost:5000/api/projects/${project.projectId}/update-field`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ field: "notes", value: updatedNotes }),
      }
    );

    if (!res.ok) {
      // roll back
      setProject(prev);
      const msg = await res.text().catch(() => "Failed to save notes");
      alert(msg || "Failed to save notes");
      throw new Error(msg);
    }
  };

  const handleSave = async (note: Note) => {
    // light validation
    if (!note.title?.trim() && !note.content?.trim()) {
      alert("Please add a title or some content.");
      return;
    }

    const exists = notes.find((n) => n.id === note.id);
    const finalNote: Note = exists
      ? { ...note, updatedAt: today(), createdAt: exists.createdAt }
      : { ...note, createdAt: note.createdAt || today(), updatedAt: today() };

    const updated = exists
      ? notes.map((n) => (n.id === note.id ? finalNote : n))
      : [...notes, finalNote];

    await saveToBackend(updated);
    setEditingId(null);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    const updated = notes.filter((n) => n.id !== id);
    await saveToBackend(updated);
  };

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-8 bg-[#f9fafa] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          Project Notes
        </h1>
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-1 text-sm px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900"
        >
          <PlusCircleIcon className="w-5 h-5" /> Add Note
        </button>
      </div>

      {(adding || notes.length === 0) && (
        <NoteEditor
          note={{
            id: uuidv4(),
            title: "",
            content: "",
            author: "",
            createdAt: today(),
            updatedAt: today(),
          }}
          onSave={handleSave}
          onCancel={() => {
            setAdding(false);
            setEditingId(null);
          }}
        />
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition"
        >
          {editingId === note.id ? (
            <NoteEditor
              note={note}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {note.title || "Untitled"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {note.author ? `By ${note.author} · ` : ""}
                    {note.createdAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(note.id)}
                    className="text-blue-500 hover:text-blue-700"
                    aria-label="Edit note"
                    title="Edit note"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete note"
                    title="Delete note"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {note.content}
              </p>
              <p className="text-xs text-gray-400">
                Last updated: {note.updatedAt}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NoteEditor({
  note,
  onSave,
  onCancel,
}: {
  note: Note;
  onSave: (n: Note) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Note>(note);

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Note Title"
      />
      <input
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        value={form.author}
        onChange={(e) => setForm({ ...form, author: e.target.value })}
        placeholder="Author Name"
      />
      <textarea
        className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        rows={5}
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="Write your note here..."
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSave({ ...form, updatedAt: today() })}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm"
        >
          Save
          </button>
        <button onClick={onCancel} className="text-gray-500 px-4 py-2 rounded-xl text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
