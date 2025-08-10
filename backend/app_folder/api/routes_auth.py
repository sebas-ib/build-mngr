from flask import Blueprint, jsonify, url_for, redirect, session, current_app
from ..utils.auth import require_auth
from ..services.auth import oauth, logout_url, handle_authorize
from ..extensions import oauth

bp = Blueprint("auth", __name__)

@bp.get("/login")
def login():
    redirect_uri = url_for(".auth_authorize", _external=True)
    return oauth.oidc.authorize_redirect(redirect_uri)

@bp.get("/authorize")
def auth_authorize():
    return handle_authorize()

@bp.get("/logout")
def logout():
    session.clear()
    return redirect(logout_url(current_app.config["POST_LOGOUT_REDIRECT_URI"]) )

@bp.get("/me")
def me():
    user = session.get("user")
    if not user:
        return jsonify({"authenticated": False}), 401
    return jsonify({"authenticated": True, "user": user})
