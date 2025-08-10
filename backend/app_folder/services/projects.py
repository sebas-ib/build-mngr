from datetime import datetime
from ..repositories import projects_repo as repo

def create_project(owner_id: str, data: dict):
    import uuid
    project_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    item = {
        "projectId": project_id,
        "ownerId": owner_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "startDate": data.get("startDate"),
        "endDate": data.get("endDate"),
        "createdAt": now,
        "s3Folder": f"{owner_id}/{project_id}/",
        "client": data.get("client", ""),
        "location": data.get("location", ""),
        "status": "Not Started",
        "progress": 0,
        "milestones": [],
        "team": [],
        "budget": 0,
        "expenses": [],
        "timeline": [],
        "updates": [],
        "notes": [],
        "inspections": [],
        "tasks": [],
        "directory": {"name": "root", "folders": [], "files": []},
        "userId": owner_id,  # ensure PK consistency
    }
    repo.put_project(item)
    return project_id, now

def get_project_for_user(user_id: str, project_id: str):
    item = repo.get_project(user_id, project_id)
    return item

def update_fields(user_id: str, project_id: str, fields: dict):
    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in fields)
    names = {f"#{k}": k for k in fields}
    values = {f":{k}": v for k, v in fields.items()}
    return repo.update_project_fields(user_id, project_id, update_expr, names, values)

def update_single_field(user_id: str, project_id: str, field: str, value):
    return repo.update_project_fields(
        user_id, project_id, "SET #f = :v", {"#f": field}, {":v": value}, return_values="UPDATED_NEW"
    )
