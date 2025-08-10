from functools import wraps
from flask import session, jsonify

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = session.get("user")
        if not user or "sub" not in user:
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs, current_user=user)
    return wrapper
