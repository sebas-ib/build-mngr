from flask import session, redirect, jsonify, current_app
from urllib.parse import urlencode
from ..extensions import init_oauth, oauth as _oauth

oauth = _oauth  # exported for routes

def logout_url(post_logout_redirect_uri: str):
    qs = urlencode({
        "client_id": current_app.config["OIDC_CLIENT_ID"],
        "logout_uri": post_logout_redirect_uri,
    })
    return f'{current_app.config["COGNITO_DOMAIN"]}/logout?{qs}'

def handle_authorize():
    token = oauth.oidc.authorize_access_token()
    user_info = token.get("userinfo")
    if not user_info:
        return jsonify({"error": "Failed to retrieve user info"}), 400
    session["user"] = user_info
    session["id_token"] = token.get("id_token")
    return redirect("http://localhost:3000/dashboard")
