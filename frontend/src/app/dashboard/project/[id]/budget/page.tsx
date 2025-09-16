"use client";

import { useProject } from "@/components/ProjectLayoutWrapper";
import { useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

type Expense = { category: string; description: string; date: string; amount: number };

export default function BudgetPage() {
  // Use the real context type — no casting
  const ctx = useProject();
  const { project, setProject } = ctx;

  const [budget, setBudget] = useState<number>((project?.budget as number) ?? 0);
  const [expenses, setExpenses] = useState<Expense[]>(
    (project?.expenses as Expense[]) ?? []
  );

  // Precisely type the fields we save here
  type EditableField = "budget" | "expenses";

  async function saveSingleField(field: EditableField, value: number | Expense[]): Promise<void> {
    try {
      if (!project) throw new Error("No project loaded yet");

      const response = await fetch(
        `http://localhost:5000/api/projects/${project.projectId}/update-field`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ field, value }),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json() as { updated?: Partial<NonNullable<typeof project>> };

      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: (data.updated?.[field] as typeof value) ?? value,
        };
      });
    } catch (err) {
      console.error(err);
      alert(`Failed to save ${field}.`);
    }
  }

  const addExpense = () => {
    const newExpense: Expense = { category: "", description: "", date: "", amount: 0 };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    void saveSingleField("expenses", updatedExpenses);
  };

  // Generic so the value type matches the field
  async function updateExpense<K extends keyof Expense>(
    index: number,
    field: K,
    value: Expense[K]
  ): Promise<void> {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value } as Expense;
    setExpenses(updated);
    await saveSingleField("expenses", updated);
  }

  const removeExpense = async (index: number) => {
    if (!confirm("Remove this expense?")) return;
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
    await saveSingleField("expenses", updated);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="p-6 pt-24 md:pl-72 space-y-10 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900">Project Budget</h1>
      </header>

      {/* Budget */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Budget</h2>
        <EditableField
          label="Budget"
          value={String(budget)}
          type="number"
          onSave={async (val) => {
            const newBudget = Number(val);
            setBudget(newBudget);
            await saveSingleField("budget", newBudget);
          }}
        />
        <p className="text-gray-600 mt-2">
          Total Expenses: <span className="font-semibold">${totalExpenses.toFixed(2)}</span>
        </p>
        <p className="text-gray-600">
          Remaining:{" "}
          <span
            className={`font-semibold ${
              budget - totalExpenses < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            ${(budget - totalExpenses).toFixed(2)}
          </span>
        </p>
      </section>

      {/* Expenses */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
          <button
            onClick={addExpense}
            className="bg-black text-white px-3 py-1 rounded hover:bg-gray-900 text-sm flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Amount ($)</th>
                <th className="p-3 text-left w-12"></th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {expenses.map((exp, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="p-2">
                    <InlineEditableCell
                      value={exp.category}
                      onSave={(val) => updateExpense(i, "category", val)}
                    />
                  </td>
                  <td className="p-2">
                    <InlineEditableCell
                      value={exp.description}
                      onSave={(val) => updateExpense(i, "description", val)}
                    />
                  </td>
                  <td className="p-2">
                    <InlineEditableCell
                      type="date"
                      value={exp.date}
                      onSave={(val) => updateExpense(i, "date", val)}
                    />
                  </td>
                  <td className="p-2">
                    <InlineEditableCell
                      type="number"
                      value={String(exp.amount)}
                      onSave={(val) => updateExpense(i, "amount", Number(val))}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => removeExpense(i)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                      title="Remove expense"
                      aria-label="Remove expense"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>
                    No expenses yet. Click “Add Expense” to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// === Reusable components ===
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
    <div
      className="bg-white rounded-xl shadow-md p-5 w-full md:w-1/3"
      onDoubleClick={() => !isEditing && setIsEditing(true)}
    >
      <label className="text-xs uppercase text-gray-500 block mb-1">{label}</label>
      {isEditing ? (
        <div className="flex gap-2 items-center">
          <input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="text-base font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-2 w-full"
          />
          <button
            onClick={handleSave}
            className="bg-black text-white px-2 py-1 rounded hover:bg-gray-900 text-sm"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
          >
            Cancel
          </button>
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
      <button onClick={handleSave} className="bg-black text-white px-2 py-1 rounded text-xs">
        Save
      </button>
      <button onClick={handleCancel} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
        Cancel
      </button>
    </div>
  ) : (
    <p onDoubleClick={() => setIsEditing(true)} className="cursor-pointer">
      {value || <span className="text-gray-400 italic">Double-click to edit</span>}
    </p>
  );
}
