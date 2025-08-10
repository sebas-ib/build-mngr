from flask import Blueprint, jsonify, request, current_app
from ..utils.auth import require_auth
from ..services import teams as tsvc
from ..repositories import teams_repo

bp = Blueprint("team", __name__)

@bp.get("/<project_id>/team")
@require_auth
def get_users(project_id, current_user):
    return jsonify(tsvc.list_team(project_id)), 200

@bp.post("/<project_id>/add-user")
@require_auth
def add_user_to_project(project_id, current_user):
    data = request.get_json() or {}
    email = data.get("email")
    role = data.get("role", "member")
    uid = tsvc.add_member_by_email(project_id, email, role, current_app.config["COGNITO_USER_POOL_ID"])
    if not uid:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User added"}), 200

@bp.delete("/<project_id>/remove-user")
@require_auth
def remove_user_from_project(project_id, current_user):
    uid = (request.get_json() or {}).get("userId")
    if not uid:
        return jsonify({"error": "Missing user ID"}), 400
    if not teams_repo.get_membership(project_id, uid):
        return jsonify({"error": "User not found in project team"}), 404
    tsvc.remove_member(project_id, uid)
    return jsonify({"message": "User removed successfully"}), 200
