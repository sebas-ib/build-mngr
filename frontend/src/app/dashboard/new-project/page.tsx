"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

export default function NewProject() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [client, setClient] = useState("");
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");

    const handleCreate = async () => {
        if (!name || !client || !startDate || !endDate) {
            alert("Please fill in all required fields.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            alert("End date must be after the start date.");
            return;
        }

        const newProject = {
            name,
            client,
            location,
            startDate,
            endDate,
            description,
        };

        try {
            const res = await fetch("http://localhost:5000/api/projects", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(newProject),
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`Error: ${result.error}`);
                return;
            }

            console.log("Project created:", result.project);
            router.push("/dashboard");
        } catch (err) {
            console.error("Request failed:", err);
            alert("Something went wrong. Please try again later.");
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 bg-white p-6 rounded-xl shadow">
            <h1 className="text-2xl font-bold">Create New Project</h1>

            <div className="space-y-4">
                <Input label="Project Name" value={name} onChange={setName} required/>
                <Input label="Client Name" value={client} onChange={setClient} required/>
                <Input label="Location" value={location} onChange={setLocation}/>
                <Input type="date" label="Start Date" value={startDate} onChange={setStartDate} required/>
                <Input type="date" label="Estimated End Date" value={endDate} onChange={setEndDate} required/>
                <TextArea label="Description" value={description} onChange={setDescription}/>
            </div>

            <button onClick={handleCreate} className="btn btn-primary w-full mt-4">
                Save Project
            </button>
        </div>
    );
}

function Input({label, value, onChange, type = "text", required = false}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
            />
        </div>
    );
}

function TextArea({label, value, onChange}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full border rounded-md px-3 py-2"
            />
        </div>
    );
}
