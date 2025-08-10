from datetime import datetime
from ..extensions import cognito_idp
from ..repositories import users_repo

def sync_user(user_id: str, user_pool_id: str):
    client = cognito_idp()
    resp = client.admin_get_user(UserPoolId=user_pool_id, Username=user_id)
    attrs = {a["Name"]: a["Value"] for a in resp["UserAttributes"]}
    payload = {
        "userId": user_id,
        "given_name": attrs.get("given_name", "unknown"),
        "family_name": attrs.get("family_name", "unknown"),
        "email": attrs.get("email", "unknown"),
        "syncedAt": datetime.utcnow().isoformat(),
    }
    existing = users_repo.get(user_id)
    if not existing or any(payload[k] != existing.get(k) for k in ("given_name", "family_name", "email")):
        users_repo.put(payload)
