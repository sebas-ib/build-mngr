from ..extensions import dynamo_table
from flask import current_app

def table():
    return dynamo_table(current_app.config["DDB_USERS"])

def get(user_id: str):
    return table().get_item(Key={"userId": user_id}).get("Item")

def put(user: dict):
    table().put_item(Item=user)
