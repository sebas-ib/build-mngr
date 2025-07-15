from urllib.parse import urlencode
from boto3.dynamodb.conditions import Key
from flask import Flask, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from datetime import datetime
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import uuid
import os
import boto3


app = Flask(__name__)
app.secret_key = os.urandom(24)  # Use a consistent secure key in production
CORS(app, supports_credentials=True)

load_dotenv()
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION")

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
SERVER_METADATA_URL = os.getenv("SERVER_METADATA_URL")

oauth = OAuth(app)
oauth.register(
    name='oidc',
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_url=SERVER_METADATA_URL,
    client_kwargs={'scope': 'email openid profile'}
)

# === In-memory project "database" ===
projects = {}

dynamodb = boto3.resource("dynamodb", region_name=AWS_DEFAULT_REGION)
s3 = boto3.client("s3", region_name=AWS_DEFAULT_REGION)


@app.route("/")
def home():
    return jsonify({"message": "BuildManager API is running."}), 200

@app.route("/login")
def login():
    redirect_uri = url_for('authorize', _external=True)
    return oauth.oidc.authorize_redirect(redirect_uri)


@app.route("/api/projects", methods=["GET"])
def get_projects():
    user = session.get("user")
    if not user or "sub" not in user:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = user["sub"]
    table = dynamodb.Table("BuildManagerProjects")

    try:
        response = table.query(
            KeyConditionExpression=Key("userId").eq(user_id)
        )
        return jsonify(response.get("Items", [])), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    # Check if user is authenticated
    user = session.get("user")
    if not user or "sub" not in user:
        return jsonify({"error": "Unauthorized"}), 401

    # Initilaize userId and table
    user_id = user["sub"]
    table = dynamodb.Table("BuildManagerProjects")

    try:

        response = table.get_item(
            Key={
                "userId": user_id,
                "projectId": project_id
            }
        )
        item = response.get("Item")
        if not item:
            return jsonify({"error": "Project not found"}), 404

        return jsonify(item), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/authorize")
def authorize():
    token = oauth.oidc.authorize_access_token()
    user_info = token.get('userinfo')
    if not user_info:
        return jsonify({"error": "Failed to retrieve user info"}), 400

    session['user'] = user_info
    session['id_token'] = token.get('id_token')  # optional
    return redirect("http://localhost:3000/dashboard")  # or redirect to frontend dashboard


@app.route("/logout")
def logout():
    session.clear()
    logout_url = "https://us-east-1kz1zp6tqt.auth.us-east-1.amazoncognito.com/logout?" + urlencode({
        "client_id": "j4jkbe1s78bu5blhdgiqu28fr",
        "logout_uri": "http://localhost:3000"
    })
    return redirect(logout_url)


@app.route("/me")
def me():
    user = session.get("user")
    if not user:
        return jsonify({"authenticated": False}), 401
    return jsonify({"authenticated": True, "user": user})


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json()
    user_id = session.get("user")["sub"]  # from Cognito session
    project_id = str(uuid.uuid4())


    project_table = dynamodb.Table("BuildManagerProjects")
    team_table = dynamodb.Table("BuildManagerProjectTeams")

    team_member = {
        "projectId": project_id,
        "userId": user_id,
        "role": "owner",
        "addedAt": datetime.utcnow().isoformat()
    }

    item = {
        "userId": user_id,
        "projectId": project_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "createdAt": datetime.utcnow().isoformat(),
        "s3Folder": f"{user_id}/{project_id}/"
    }

    team_table.put_item(Item=team_member)
    project_table.put_item(Item=item)

    return jsonify({"message": "Project created", "projectId": project_id}), 201


@app.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files["file"]
    project_id = request.form["projectId"]
    user_id = session.get("user")["sub"]

    key = f"{user_id}/{project_id}/{file.filename}"
    s3.upload_fileobj(file, S3_BUCKET_NAME, key)

    return jsonify({"message": "File uploaded", "filePath": key}), 200


if __name__ == "__main__":
    app.run(port=5000, debug=True)
