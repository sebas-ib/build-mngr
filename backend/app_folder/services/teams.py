from datetime import datetime
from ..extensions import cognito_idp
from ..repositories import teams_repo, users_repo

def list_team(project_id: str):
    members = teams_repo.list_by_project(project_id)
    out = []
    for m in members:
        u = users_repo.get(m["userId"])
        if u:
            out.append({
                "projectId": project_id,
                "userId": m["userId"],
                "role": m.get("role", "member"),
                "addedAt": m.get("addedAt", ""),
                "family_name": u.get("family_name", ""),
                "given_name": u.get("given_name", ""),
                "email": u.get("email", "")
            })
    return out

def add_member_by_email(project_id: str, email: str, role: str, user_pool_id: str):
    client = cognito_idp()
    resp = client.list_users(UserPoolId=user_pool_id, Filter=f'email = "{email}"', Limit=1)
    users = resp.get("Users", [])
    if not users:
        return None
    attrs = {a["Name"]: a["Value"] for a in users[0]["Attributes"]}
    uid = attrs.get("sub")
    if not uid:
        return None
    teams_repo.put_member(project_id, uid, role, datetime.utcnow().isoformat())
    return uid

def remove_member(project_id: str, user_id: str):
    teams_repo.delete_member(project_id, user_id)
