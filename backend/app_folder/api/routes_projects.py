from flask import Blueprint, jsonify, request
from ..utils.auth import require_auth
from ..services import projects as svc
from ..repositories import projects_repo, teams_repo

bp = Blueprint("projects", __name__)

@bp.get("")
@require_auth
def list_projects(current_user):
    user_id = current_user["sub"]
    owned = projects_repo.query_owned_by(user_id)
    memberships = teams_repo.list_by_user(user_id)

    member_pids = {m["projectId"] for m in memberships} - {p["projectId"] for p in owned}
    # If you only have (userId, projectId) PK, you’ll need ownerId to fetch. Keeping this simple: just return owned + ids of member projects.
    role_by_pid = {m["projectId"]: m.get("role", "member") for m in memberships}
    out = [{**p, "currentUserRole": "owner"} for p in owned]
    # (Optional) enrich member projects similarly if you add a GSI on projectId or store ownerId on teams table
    return jsonify(out), 200

@bp.post("")
@require_auth
def create_project(current_user):
    project_id, now_iso = svc.create_project(current_user["sub"], request.get_json() or {})
    # add owner to team
    teams_repo.put_member(project_id, current_user["sub"], "owner", now_iso)
    return jsonify({"message": "Project created", "projectId": project_id}), 201

@bp.get("/<project_id>")
@require_auth
def get_project(project_id, current_user):
    user_id = current_user["sub"]
    # First try as owner
    item = projects_repo.get_project(user_id, project_id)
    if not item:
        # If not owner, ensure membership and then fetch by ownerId if you add a projectId GSI (left as TODO).
        membership = teams_repo.get_membership(project_id, user_id)
        if not membership:
            return jsonify({"error": "Forbidden"}), 403
        # Without a projectId-index, we can't fetch the project unless you store ownerId on the membership.
        return jsonify({"error": "Project lookup requires projectId-index or ownerId on membership"}), 500

    item["currentUserRole"] = "owner"
    return jsonify(item), 200

@bp.patch("/<project_id>/update-field")
@require_auth
def update_field(project_id, current_user):
    data = request.get_json() or {}
    field, value = data.get("field"), data.get("value")
    if not field:
        return jsonify({"error": "Missing 'field'"}), 400
    resp = svc.update_single_field(current_user["sub"], project_id, field, value)
    return jsonify({"message": "Field updated successfully", "updated": resp.get("Attributes", {})}), 200

@bp.post("/<project_id>/update")
@require_auth
def update_project_bulk(project_id, current_user):
    fields = request.get_json() or {}
    svc.update_fields(current_user["sub"], project_id, fields)
    return jsonify({"message": "Project updated successfully"}), 200

@bp.post("/<project_id>/update-milestone")
@require_auth
def update_milestone(project_id, current_user):
    data = request.get_json() or {}
    idx, field, value = data.get("index"), data.get("field"), data.get("value")
    if idx is None or field is None:
        return jsonify({"error": "Missing 'index' or 'field'"}), 400
    expr = f"SET milestones[{idx}].{field} = :val"
    projects_repo.update_project_fields(current_user["sub"], project_id, expr, None, {":val": value}, "UPDATED_NEW")
    return jsonify({"message": "Milestone updated successfully"}), 200

@bp.post("/<project_id>/timeline")
@require_auth
def update_timeline(project_id, current_user):
    tl = (request.get_json() or {}).get("timeline", [])
    resp = projects_repo.update_project_fields(current_user["sub"], project_id, "SET timeline = :t", None, {":t": tl}, "UPDATED_NEW")
    return jsonify({"timeline": resp.get("Attributes", {}).get("timeline", tl)}), 200

@bp.get("/<project_id>/tasks")
@require_auth
def get_tasks(project_id, current_user):
    item = projects_repo.get_project(current_user["sub"], project_id)
    if not item:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(item.get("tasks", [])), 200

@bp.post("/<project_id>/tasks")
@require_auth
def update_tasks(project_id, current_user):
    tasks = request.get_json()
    projects_repo.update_project_fields(current_user["sub"], project_id, "SET tasks = :t", None, {":t": tasks})
    return jsonify({"message": "Tasks updated"}), 200

@bp.post("/<project_id>/updates")
@require_auth
def add_update(project_id, current_user):
    update = request.get_json()
    expr = "SET updates = list_append(:new, if_not_exists(updates, :empty))"
    projects_repo.update_project_fields(
        current_user["sub"], project_id, expr, None, {":new": [update], ":empty": []}, "UPDATED_NEW"
    )
    return jsonify(update), 200

@bp.get("/<project_id>/updates")
@require_auth
def get_updates(project_id, current_user):
    item = projects_repo.get_project(current_user["sub"], project_id)
    if not item:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(item.get("updates", [])), 200

@bp.patch("/<project_id>/inspections")
@require_auth
def update_inspections(project_id, current_user):
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Invalid data format"}), 400
    projects_repo.update_project_fields(current_user["sub"], project_id, "SET inspections = :v", None, {":v": data})
    return jsonify({"message": "Inspections updated"}), 200

@bp.patch("/<project_id>/directory")
@require_auth
def update_directory(project_id, current_user):
    data = request.get_json()
    projects_repo.update_project_fields(current_user["sub"], project_id, "SET directory = :v", None, {":v": data})
    return jsonify({"message": "Directory updated"}), 200
