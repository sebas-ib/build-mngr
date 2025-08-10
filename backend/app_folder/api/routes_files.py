from flask import Blueprint, jsonify, request, session
from ..utils.auth import require_auth
from ..services import files as fsvc
from ..repositories import projects_repo

bp = Blueprint("files", __name__)

@bp.post("/<project_id>/files/presign")
@require_auth
def presign_put(project_id, current_user):
    data = request.get_json() or {}
    url, key = fsvc.presign_put(project_id, data.get("fileName"), data.get("fileType"))
    return jsonify({"uploadUrl": url, "key": key})

@bp.post("/<project_id>/files/presign-get")
@require_auth
def presign_get(project_id, current_user):
    key = (request.get_json() or {}).get("key")
    if not key:
        return jsonify({"error": "Missing file key"}), 400
    return jsonify({"url": fsvc.presign_get(key)})

@bp.post("/<project_id>/files/metadata")
@require_auth
def save_file_metadata(project_id, current_user):
    data = request.get_json() or {}
    user_id = current_user["sub"]
    project = projects_repo.get_project(user_id, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if "directory" not in project:
        project["directory"] = {"name": "root", "createdAt": __import__("datetime").datetime.utcnow().isoformat(), "folders": [], "files": []}

    current_dir = project["directory"]
    for folder in data.get("path", []):
        current_dir = next((f for f in current_dir["folders"] if f["name"] == folder), None)
        if current_dir is None:
            return jsonify({"error": f"Folder '{folder}' not found"}), 404

    current_dir["files"].append({
        "name": data.get("name"),
        "size": data.get("size"),
        "uploadedAt": data.get("uploadedAt"),
        "key": data.get("key"),
    })

    # full replace of directory
    projects_repo.update_project_fields(user_id, project_id, "SET directory = :d", None, {":d": project["directory"]})
    return jsonify({"success": True, "file": current_dir["files"][-1]}), 200

@bp.delete("/<project_id>/files")
@require_auth
def delete_file(project_id, current_user):
    user_id = current_user["sub"]
    data = request.get_json() or {}
    key = data.get("key")
    path = data.get("path", [])
    if not key:
        return jsonify({"error": "File key required"}), 400

    project = projects_repo.get_project(user_id, project_id)
    if not project or "directory" not in project:
        return jsonify({"error": "Project or directory not found"}), 404

    # delete from S3
    fsvc.delete_s3_object(key)

    # remove from directory
    dir_ref = project["directory"]
    for folder in path:
        dir_ref = next((f for f in dir_ref.get("folders", []) if f["name"] == folder), None)
        if not dir_ref:
            return jsonify({"error": "Invalid folder path"}), 400

    before = len(dir_ref.get("files", []))
    dir_ref["files"] = [f for f in dir_ref.get("files", []) if f["key"] != key]
    if len(dir_ref["files"]) == before:
        return jsonify({"warning": "File not found in metadata, but deleted from S3"}), 200

    projects_repo.update_project_fields(user_id, project_id, "SET directory = :d", None, {":d": project["directory"]})
    return jsonify({"success": True}), 200

@bp.delete("/<project_id>/files/folder")
@require_auth
def delete_folder(project_id, current_user):
    user_id = current_user["sub"]
    data = request.get_json() or {}
    path = data.get("path", [])
    folder_name = data.get("folderName")
    if not folder_name:
        return jsonify({"error": "Folder name required"}), 400

    project = projects_repo.get_project(user_id, project_id)
    if not project or "directory" not in project:
        return jsonify({"error": "Project or directory not found"}), 404

    dir_ref = project["directory"]
    for folder in path:
        dir_ref = next((f for f in dir_ref.get("folders", []) if f["name"] == folder), None)
        if not dir_ref:
            return jsonify({"error": "Invalid folder path"}), 400

    folder_to_delete = next((f for f in dir_ref.get("folders", []) if f["name"] == folder_name), None)
    if not folder_to_delete:
        return jsonify({"error": "Folder not found"}), 404

    for file in fsvc.collect_files(folder_to_delete):
        fsvc.delete_s3_object(file["key"])

    dir_ref["folders"] = [f for f in dir_ref.get("folders", []) if f["name"] != folder_name]
    projects_repo.update_project_fields(user_id, project_id, "SET directory = :d", None, {":d": project["directory"]})
    return jsonify({"success": True}), 200

@bp.post("/<project_id>/files/folder")
@require_auth
def create_folder(project_id, current_user):
    user_id = current_user["sub"]
    data = request.get_json() or {}
    folder_name = data.get("folderName")
    path = data.get("path", [])
    if not folder_name:
        return jsonify({"error": "Missing folderName"}), 400

    project = projects_repo.get_project(user_id, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if "directory" not in project:
        project["directory"] = {"name": "root", "createdAt": __import__("datetime").datetime.utcnow().isoformat(), "folders": [], "files": []}

    current_dir = project["directory"]
    for folder in path:
        current_dir = next((f for f in current_dir["folders"] if f["name"] == folder), None)
        if current_dir is None:
            return jsonify({"error": f"Folder '{folder}' not found"}), 404

    if any(f["name"] == folder_name for f in current_dir["folders"]):
        return jsonify({"error": "Folder already exists"}), 400

    new_folder = {"name": folder_name, "createdAt": __import__("datetime").datetime.utcnow().isoformat(), "folders": [], "files": []}
    current_dir["folders"].append(new_folder)
    projects_repo.update_project_fields(user_id, project_id, "SET directory = :d", None, {":d": project["directory"]})
    return jsonify({"success": True, "folder": new_folder}), 200
