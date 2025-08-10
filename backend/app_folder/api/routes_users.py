from flask import Blueprint, jsonify
from ..utils.auth import require_auth
from ..services import users as usvc
from flask import current_app

bp = Blueprint("users", __name__)

@bp.get("/sync")
@require_auth
def sync_user(current_user):
    try:
        usvc.sync_user(current_user["sub"], current_app.config["COGNITO_USER_POOL_ID"])
        return jsonify({"message": "User synced"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
