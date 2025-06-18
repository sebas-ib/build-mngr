from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Temporary in-memory "database"
projects = {}

@app.route("/")
def home():
    return jsonify({"message": "BuildManager API is running."}), 200

@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json()

    required_fields = ["name", "client", "startDate", "endDate"]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        start = datetime.strptime(data["startDate"], "%Y-%m-%d")
        end = datetime.strptime(data["endDate"], "%Y-%m-%d")
        if end <= start:
            return jsonify({"error": "End date must be after start date."}), 400
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    project_id = str(uuid.uuid4())
    new_project = {
        "id": project_id,
        "name": data["name"],
        "client": data["client"],
        "location": data.get("location", ""),
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "description": data.get("description", "")
    }

    projects[project_id] = new_project
    return jsonify({"message": "Project created successfully.", "project": new_project}), 201

if __name__ == "__main__":
    app.run(port=5000, debug=True)
