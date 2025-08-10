from boto3.dynamodb.conditions import Key, Attr
from ..extensions import dynamo_table
from flask import current_app

def table():
    return dynamo_table(current_app.config["DDB_TEAMS"])

def list_by_project(project_id: str):
    try:
        return table().query(KeyConditionExpression=Key("projectId").eq(project_id))["Items"]
    except Exception:
        return table().scan(FilterExpression=Attr("projectId").eq(project_id))["Items"]

def list_by_user(user_id: str):
    try:
        return table().query(IndexName="userId-index", KeyConditionExpression=Key("userId").eq(user_id))["Items"]
    except Exception:
        return table().scan(FilterExpression=Attr("userId").eq(user_id))["Items"]

def get_membership(project_id: str, user_id: str):
    return table().get_item(Key={"projectId": project_id, "userId": user_id}).get("Item")

def put_member(project_id: str, user_id: str, role: str, added_at: str):
    table().put_item(
        Item={"projectId": project_id, "userId": user_id, "role": role, "addedAt": added_at},
        ConditionExpression="attribute_not_exists(projectId) AND attribute_not_exists(userId)"
    )

def delete_member(project_id: str, user_id: str):
    table().delete_item(Key={"projectId": project_id, "userId": user_id})
