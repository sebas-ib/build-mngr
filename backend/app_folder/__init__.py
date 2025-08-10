from flask import Flask
from .config import get_config
from .extensions import cors, init_oauth
from .api import create_api_blueprint
from .api.errors import register_error_handlers

def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    cors.init_app(app, supports_credentials=True)
    init_oauth(app)

    app.register_blueprint(create_api_blueprint(), url_prefix="/api")
    register_error_handlers(app)

    # root health
    @app.get("/")
    def home():
        return {"message": "BuildManager API is running."}, 200

    return app
