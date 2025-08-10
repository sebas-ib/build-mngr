from boto3.dynamodb.conditions import Key, Attr
from ..extensions import dynamo_table
from flask import current_app

def table():
    return dynamo_table(current_app.config["DDB_PROJECTS"])

def get_project(user_id: str, project_id: str):
    return table().get_item(Key={"userId": user_id, "projectId": project_id}).get("Item")

def put_project(item: dict):
    table().put_item(Item=item)

def delete_project(user_id: str, project_id: str):
    table().delete_item(Key={"userId": user_id, "projectId": project_id})

def update_project_fields(user_id: str, project_id: str, update_expr, expr_attr_names, expr_attr_values, return_values=None):
    return table().update_item(
        Key={"userId": user_id, "projectId": project_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_attr_names or None,
        ExpressionAttributeValues=expr_attr_values or None,
        ReturnValues=return_values or "NONE",
    )

def query_owned_by(owner_id: str):
    # prefers GSI ownerId-index; falls back to scan
    try:
        return table().query(IndexName="ownerId-index", KeyConditionExpression=Key("ownerId").eq(owner_id))["Items"]
    except Exception as e:
        msg = str(getattr(getattr(e, "response", {}), "get", lambda *_: {})("Error", {}).get("Message", ""))
        if "backfilling" in msg.lower():
            return table().scan(FilterExpression=Attr("ownerId").eq(owner_id))["Items"]
        raise
