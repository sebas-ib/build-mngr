"use client";

import {useProject} from "@/components/ProjectLayoutWrapper";
import {useEffect, useState} from "react";
import {FolderIcon, FolderPlusIcon, PaperClipIcon, SlashIcon, TrashIcon, XMarkIcon,} from "@heroicons/react/24/solid";

export default function FilesPage() {
    const {project, setProject} = useProject();
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [newFolderName, setNewFolderName] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [previewFile, setPreviewFile] = useState<any | null>(null);
    const [fullscreenPreview, setFullscreenPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!previewFile) {
            setPreviewUrl(null);
            return;
        }

        (async () => {
            try {
                const url = await getFileUrl(previewFile);
                if (url && /^https?:\/\//.test(url)) {
                    setPreviewUrl(url);
                } else {
                    console.error("Invalid file URL:", url);
                    setPreviewUrl(null);
                }
            } catch (err) {
                console.error("Error fetching file URL:", err);
                setPreviewUrl(null);
            }
        })();
    }, [previewFile]);


    // Helper: find current folder
    const getCurrentDirectory = () => {
        let current = project.directory;
        for (let name of currentPath) {
            const next = current.folders.find((f) => f.name === name);
            if (!next) return null;
            current = next;
        }
        return current;
    };
    const currentDir = getCurrentDirectory();

    // Helper: update project directory immutably
    const updateDirectory = (updater: (dir: typeof project.directory) => void) => {
        setProject((prev) => {
            const updatedProject = structuredClone(prev);
            updater(updatedProject.directory);
            return updatedProject;
        });
    };

    const navigateTo = (folderName: string) => setCurrentPath((prev) => [...prev, folderName]);
    const navigateToPath = (index: number) => setCurrentPath((prev) => prev.slice(0, index + 1));

    // Upload file to S3
    const uploadFile = async (file: File) => {
        const res = await fetch(`http://localhost:5000/api/project/${project.projectId}/files/presign`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({fileName: file.name, fileType: file.type}),
        });
        if (!res.ok) throw new Error("Failed to get presigned URL");

        const {uploadUrl, key} = await res.json();

        // Upload file directly to S3
        await fetch(uploadUrl, {method: "PUT", body: file});

        // Save metadata
        const metadata = {
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
            uploadedAt: new Date().toISOString().split("T")[0],
            key,
            path: currentPath,
        };

        await fetch(`http://localhost:5000/api/project/${project.projectId}/files/metadata`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify(metadata),
        });

        updateDirectory((dir) => {
            let dirRef = dir;
            for (let name of currentPath) dirRef = dirRef.folders.find((f) => f.name === name)!;
            dirRef.files.push(metadata);
        });
    };

    const handleUpload = (files: FileList) => {
        if (!files?.length || !currentDir) return;
        Array.from(files).forEach((file) => uploadFile(file));
    };

    const handleFolderCreate = async () => {
        if (!newFolderName.trim() || !currentDir) return;
        const res = await fetch(
            `http://localhost:5000/api/project/${project.projectId}/files/folder`,
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({path: currentPath, folderName: newFolderName.trim()}),
            }
        );

        if (!res.ok) {
            const error = await res.json();
            alert(error.error || "Failed to create folder");
            return;
        }

        const {folder} = await res.json();
        setProject((prev) => {
            const updatedProject = structuredClone(prev);
            let dirRef = updatedProject.directory;
            for (let name of currentPath) dirRef = dirRef.folders.find((f) => f.name === name)!;
            dirRef.folders.push(folder);
            return updatedProject;
        });

        setNewFolderName("");
    };

    const handleFileDelete = async (index: number) => {
        if (!currentDir) return;
        const file = currentDir.files[index];

        const confirmed = window.confirm(`Are you sure you want to delete "${file.name}"?`);
        if (!confirmed) return;

        const res = await fetch(`http://localhost:5000/api/project/${project.projectId}/files`, {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({key: file.key, path: currentPath}),
        });

        if (!res.ok) {
            const error = await res.json();
            alert(error.error || "Failed to delete file");
            return;
        }

        updateDirectory((dir) => {
            let dirRef = dir;
            for (let name of currentPath) dirRef = dirRef.folders.find((f) => f.name === name)!;
            dirRef.files.splice(index, 1);
        });

        if (previewFile?.key === file.key) setPreviewFile(null);
    };


    const handleFolderDelete = async (index: number) => {
        if (!currentDir) return;
        const folderToDelete = currentDir.folders[index];

        const confirmed = window.confirm(`Are you sure you want to delete the folder "${folderToDelete.name}"?`);
        if (!confirmed) return;

        const res = await fetch(`http://localhost:5000/api/project/${project.projectId}/files/folder`, {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({path: currentPath, folderName: folderToDelete.name}),
        });

        if (res.ok) {
            updateDirectory((dir) => {
                let dirRef = dir;
                for (let name of currentPath) {
                    dirRef = dirRef.folders.find((f) => f.name === name)!;
                }
                dirRef.folders.splice(index, 1);
            });
        }
    };



    const getFileUrl = async (file: any) => {
        const res = await fetch(`http://localhost:5000/api/project/${project.projectId}/files/presign-get`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({key: file.key}),
        });
        const data = await res.json();
        return data.url;
    };


    return (
        <div className="p-6 pt-24 md:pl-72 bg-[#f9fafa] min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button onClick={() => setCurrentPath([])} className="hover:underline">
                        root
                    </button>
                    {currentPath.map((p, idx) => (
                        <span key={idx} className="flex items-center gap-2">
              <SlashIcon className="w-4 h-4 text-gray-400"/>
              <button onClick={() => navigateToPath(idx)} className="hover:underline">
                {p}
              </button>
            </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="New folder"
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                        onClick={handleFolderCreate}
                        className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition flex items-center gap-1 text-sm"
                    >
                        <FolderPlusIcon className="w-4 h-4"/> Folder
                    </button>
                    <label
                        className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-sm flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition">
                        <input type="file" multiple onChange={(e) => e.target.files && handleUpload(e.target.files)}
                               className="hidden"/>
                        <PaperClipIcon className="w-4 h-4"/> Upload
                    </label>
                </div>
            </div>

            <div className="flex gap-6 flex-1">
                {/* Main Content */}
                <div
                    className={`flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleUpload(e.dataTransfer.files);
                    }}
                >
                    {currentDir ? (
                        <>
                            <div
                                className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 flex">
                                <div className="flex-1">Name</div>
                                <div className="w-28 text-right">Size</div>
                                <div className="w-32 text-right">Date Modified</div>
                                <div className="w-12"></div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {currentDir.folders.length > 0 &&
                                    currentDir.folders.map((folder, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigateTo(folder.name)}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <FolderIcon className="w-5 h-5 text-yellow-500"/>
                                                <span className="text-sm">{folder.name}</span>
                                            </div>
                                            <div className="w-28 text-right text-xs text-gray-500">—</div>
                                            <div className="w-32 text-right text-xs text-gray-500">—</div>
                                            <div className="w-12 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFolderDelete(idx);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                {currentDir.files.length > 0 ? (
                                    currentDir.files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setPreviewFile(file)}
                                            onDoubleClick={() => {
                                                setPreviewFile(file);
                                                setFullscreenPreview(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <PaperClipIcon className="w-5 h-5 text-gray-400"/>
                                                <span className="text-sm truncate">{file.name}</span>
                                            </div>
                                            <div className="w-28 text-right text-xs text-gray-500">{file.size}</div>
                                            <div
                                                className="w-32 text-right text-xs text-gray-500">{file.uploadedAt}</div>
                                            <div className="w-12 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDelete(idx);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 px-4 py-4 text-center">No files uploaded.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 p-4">Invalid path.</p>
                    )}
                </div>

                {/* Preview Panel */}
                {previewFile && (
                    <aside className="w-80 bg-white border border-gray-200 p-4 rounded-lg flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
                            <button onClick={() => setPreviewFile(null)}>
                                <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700"/>
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <p className="text-sm font-medium">{previewFile.name}</p>
                            <p className="text-xs text-gray-500">{previewFile.size}</p>
                            <p className="text-xs text-gray-500 mb-2">{previewFile.uploadedAt}</p>
                            <div
                                className="flex-1 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                                {previewUrl ? (
                                    <iframe src={previewUrl} title="Preview" className="w-full h-full"/>
                                ) : (
                                    <p className="text-xs text-gray-400">Loading preview...</p>
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Fullscreen Preview */}
            {fullscreenPreview && previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <button
                        onClick={() => setFullscreenPreview(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        <XMarkIcon className="w-8 h-8"/>
                    </button>
                    {previewUrl ? (
                        <iframe src={previewUrl} title="Preview" className="w-full h-full"/>
                    ) : (
                        <p className="text-xs text-gray-400">Loading preview...</p>
                    )}
                </div>
            )}
        </div>
    );
}
