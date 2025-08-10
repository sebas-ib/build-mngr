from flask import Blueprint
from .routes_auth import bp as auth_bp
from .routes_projects import bp as projects_bp
from .routes_files import bp as files_bp
from .routes_team import bp as team_bp
from .routes_users import bp as users_bp

def create_api_blueprint():
    api = Blueprint("api", __name__)
    api.register_blueprint(auth_bp, url_prefix="")
    api.register_blueprint(projects_bp, url_prefix="/projects")
    api.register_blueprint(files_bp, url_prefix="/project")
    api.register_blueprint(team_bp, url_prefix="/project")
    api.register_blueprint(users_bp, url_prefix="/users")
    return api
