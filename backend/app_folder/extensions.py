import os
import boto3
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from flask import current_app

cors = CORS()
oauth = OAuth()

def init_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name="oidc",
        client_id=app.config["OIDC_CLIENT_ID"],
        client_secret=app.config["OIDC_CLIENT_SECRET"],
        server_metadata_url=app.config["OIDC_METADATA_URL"],
        client_kwargs={"scope": "email openid profile"},
    )
    return oauth

def dynamo_resource():
    return boto3.resource("dynamodb", region_name=current_app.config["AWS_REGION"])

def dynamo_table(name):
    return dynamo_resource().Table(name)

def s3_client():
    return boto3.client("s3", region_name=current_app.config["AWS_REGION"])

def cognito_idp():
    return boto3.client("cognito-idp", region_name=current_app.config["AWS_REGION"])
