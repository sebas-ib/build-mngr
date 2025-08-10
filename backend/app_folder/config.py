import os

class BaseConfig:
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret")
    AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    S3_BUCKET = os.getenv("S3_BUCKET_NAME", "")
    DDB_PROJECTS = os.getenv("DDB_PROJECTS", "BuildManagerProjects")
    DDB_TEAMS = os.getenv("DDB_TEAMS", "BuildManagerProjectTeams")
    DDB_USERS = os.getenv("DDB_USERS", "BuildManagerUsers")
    OIDC_CLIENT_ID = os.getenv("CLIENT_ID", "")
    OIDC_CLIENT_SECRET = os.getenv("CLIENT_SECRET", "")
    OIDC_METADATA_URL = os.getenv("SERVER_METADATA_URL", "")
    COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_DOMAIN = os.getenv("COGNITO_DOMAIN", "")  # e.g. https://xxx.auth.us-east-1.amazoncognito.com
    POST_LOGOUT_REDIRECT_URI = os.getenv("POST_LOGOUT_REDIRECT_URI", "http://localhost:3000")

class DevConfig(BaseConfig):
    DEBUG = True

class ProdConfig(BaseConfig):
    pass

def get_config(name=None):
    env = name or os.getenv("FLASK_ENV", "development")
    return DevConfig if env.startswith("dev") else ProdConfig
