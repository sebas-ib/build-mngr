"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/ProjectLayoutWrapper";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";

interface Task {
  taskId: string;
  projectId: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: string;
  createdAt: string;
}

export default function TasksPage() {
  const { project} = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", dueDate: "" });


  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${project.projectId}/tasks`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error loading tasks:", err));
  }, [project.projectId]);

  const syncTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    fetch(`http://localhost:5000/api/projects/${project.projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedTasks),
    }).catch((err) => console.error("Error saving tasks:", err));
  };

  const addTask = () => {
    if (!newTask.title) return;
    const newEntry: Task = {
      taskId: crypto.randomUUID(),
      projectId: project.projectId,
      title: newTask.title,
      description: newTask.description || "",
      status: "todo",
      dueDate: newTask.dueDate || "",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...tasks, newEntry];
    syncTasks(updated);
    setNewTask({ title: "", description: "", dueDate: "" });
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.taskId !== taskId);
    syncTasks(updated);
  };

  const updateStatus = (taskId: string, status: Task["status"]) => {
    const updated = tasks.map((t) =>
      t.taskId === taskId ? { ...t, status } : t
    );
    syncTasks(updated);
  };

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-8 bg-[#f9fafa] min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Project Tasks</h1>

      <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Task title"
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <input
          type="text"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          placeholder="Description (optional)"
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm"
        />
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/6 shadow-sm"
        />
        <button
          onClick={addTask}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition flex items-center gap-1"
        >
          <PlusIcon className="w-5 h-5" /> Add Task
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {(["todo", "in-progress", "done"] as const).map((status) => (
          <div key={status} className="bg-white rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold capitalize mb-4 text-gray-800">
              {status.replace("-", " ")}
            </h2>
            <div className="space-y-4">
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <div
                    key={task.taskId}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition relative"
                  >
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 mt-1">Due: {task.dueDate}</p>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 flex-wrap">
                      {status !== "todo" && (
                        <button
                          onClick={() => updateStatus(task.taskId, "todo")}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          To Do
                        </button>
                      )}
                      {status !== "in-progress" && (
                        <button
                          onClick={() => updateStatus(task.taskId, "in-progress")}
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
                        >
                          In Progress
                        </button>
                      )}
                      {status !== "done" && (
                        <button
                          onClick={() => updateStatus(task.taskId, "done")}
                          className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded"
                        >
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => deleteTask(task.taskId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
