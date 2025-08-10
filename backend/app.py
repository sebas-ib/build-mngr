# import os
# import uuid
# import boto3
# import botocore
# from datetime import datetime
# from urllib.parse import urlencode
# from authlib.integrations.flask_client import OAuth
# from boto3.dynamodb.conditions import Key, Attr
# from dotenv import load_dotenv
# from flask import Flask, request, jsonify, redirect, url_for, session
# from flask_cors import CORS
#
# # Initialize Flask app
# app = Flask(__name__)
# app.secret_key = os.urandom(24)  # Use a consistent secure key in production
#
# # Enable CORE with support for credentials
# CORS(app, supports_credentials=True)
#
# # Loading environment variables
# load_dotenv()
# AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
# AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
# AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION")
# S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
# CLIENT_ID = os.getenv("CLIENT_ID")
# CLIENT_SECRET = os.getenv("CLIENT_SECRET")
# SERVER_METADATA_URL = os.getenv("SERVER_METADATA_URL")
#
# # Setup for Amazon Cognito
# oauth = OAuth(app)
# oauth.register(
#     name='oidc',
#     client_id=CLIENT_ID,
#     client_secret=CLIENT_SECRET,
#     server_metadata_url=SERVER_METADATA_URL,
#     client_kwargs={'scope': 'email openid profile'}
# )
#
# # Initializing S3 bucket and DynamoDB
# dynamodb = boto3.resource("dynamodb", region_name=AWS_DEFAULT_REGION)
# s3 = boto3.client("s3", region_name=AWS_DEFAULT_REGION)
#
# projects_table = dynamodb.Table("BuildManagerProjects")
# teams_table = dynamodb.Table("BuildManagerProjectTeams")
#
# @app.route("/api/project/<project_id>/files", methods=["DELETE"])
# def delete_file(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "User not authenticated"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json() or {}
#     key = data.get("key")
#     path = data.get("path", [])
#
#     if not key:
#         return jsonify({"error": "File key required"}), 400
#
#
#     # 1. Get project from DynamoDB using (userId, projectId)
#     try:
#         resp = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#         project = resp.get("Item")
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch project: {str(e)}"}), 500
#
#     if not project:
#         return jsonify({"error": "Project not found"}), 404
#
#     directory = project.get("directory", {})
#     if not directory:
#         return jsonify({"error": "Project directory not found"}), 400
#
#     # 2. Delete from S3
#     try:
#         s3.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
#     except Exception as e:
#         return jsonify({"error": f"Failed to delete from S3: {str(e)}"}), 500
#
#     # 3. Remove file metadata from DynamoDB
#     try:
#         dir_ref = directory
#         for folder_name in path:
#             dir_ref = next((f for f in dir_ref.get("folders", []) if f["name"] == folder_name), None)
#             if not dir_ref:
#                 return jsonify({"error": "Invalid folder path"}), 400
#
#         original_file_count = len(dir_ref.get("files", []))
#         dir_ref["files"] = [f for f in dir_ref.get("files", []) if f["key"] != key]
#
#         if len(dir_ref["files"]) == original_file_count:
#             return jsonify({"warning": "File not found in metadata, but deleted from S3"}), 200
#
#         # Update project in DynamoDB
#         projects_table.update_item(
#             Key={"userId": project["userId"], "projectId": project["projectId"]},
#             UpdateExpression="SET directory = :d",
#             ExpressionAttributeValues={":d": directory},
#         )
#
#     except Exception as e:
#         return jsonify({"error": f"Failed to delete metadata: {str(e)}"}), 500
#
#     return jsonify({"success": True}), 200
#
#
# @app.route("/api/project/<project_id>/files/folder", methods=["DELETE"])
# def delete_folder(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "User not authenticated"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json() or {}
#     path = data.get("path", [])
#     folder_name = data.get("folderName")
#
#     if not folder_name:
#         return jsonify({"error": "Folder name required"}), 400
#
#
#     # 1. Get project
#     try:
#         resp = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#         project = resp.get("Item")
#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch project: {str(e)}"}), 500
#
#     if not project:
#         return jsonify({"error": "Project not found"}), 404
#
#     directory = project.get("directory", {})
#     if not directory:
#         return jsonify({"error": "Project directory not found"}), 400
#
#     # 2. Traverse to parent folder
#     dir_ref = directory
#     for folder in path:
#         dir_ref = next((f for f in dir_ref.get("folders", []) if f["name"] == folder), None)
#         if not dir_ref:
#             return jsonify({"error": "Invalid folder path"}), 400
#
#     # 3. Find the folder to delete
#     folder_to_delete = next((f for f in dir_ref.get("folders", []) if f["name"] == folder_name), None)
#     if not folder_to_delete:
#         return jsonify({"error": "Folder not found"}), 404
#
#     # Helper function to recursively collect all files
#     def collect_files(folder):
#         files = folder.get("files", [])
#         for sub_folder in folder.get("folders", []):
#             files.extend(collect_files(sub_folder))
#         return files
#
#     files_to_delete = collect_files(folder_to_delete)
#
#     # 4. Delete all files in S3
#     try:
#         for file in files_to_delete:
#             s3.delete_object(Bucket=S3_BUCKET_NAME, Key=file["key"])
#     except Exception as e:
#         return jsonify({"error": f"Failed to delete files from S3: {str(e)}"}), 500
#
#     # 5. Remove the folder from directory
#     dir_ref["folders"] = [f for f in dir_ref.get("folders", []) if f["name"] != folder_name]
#
#     # 6. Update DynamoDB
#     try:
#         projects_table.update_item(
#             Key={"userId": project["userId"], "projectId": project["projectId"]},
#             UpdateExpression="SET directory = :d",
#             ExpressionAttributeValues={":d": directory},
#         )
#     except Exception as e:
#         return jsonify({"error": f"Failed to update project metadata: {str(e)}"}), 500
#
#     return jsonify({"success": True}), 200
#
#
#
# @app.route("/api/project/<project_id>/files/folder", methods=["POST"])
# def create_folder(project_id):
#     data = request.get_json()
#     folder_name = data.get("folderName")
#     path = data.get("path", [])  # Path to parent folder in the directory tree
#
#     if not folder_name:
#         return jsonify({"error": "Missing folderName"}), 400
#
#     # Get the current user from session
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#
#     # Get project
#     resp = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#     project = resp.get("Item")
#
#     if not project:
#         return jsonify({"error": "Project not found"}), 404
#
#     # Ensure directory structure exists
#     if "directory" not in project:
#         project["directory"] = {
#             "name": "root",
#             "createdAt": datetime.utcnow().isoformat(),
#             "folders": [],
#             "files": []
#         }
#
#     # Navigate into the directory tree
#     current_dir = project["directory"]
#     for folder in path:
#         current_dir = next((f for f in current_dir["folders"] if f["name"] == folder), None)
#         if current_dir is None:
#             return jsonify({"error": f"Folder '{folder}' not found"}), 404
#
#     # Check if folder already exists
#     if any(f["name"] == folder_name for f in current_dir["folders"]):
#         return jsonify({"error": "Folder already exists"}), 400
#
#     # Add new folder
#     new_folder = {
#         "name": folder_name,
#         "createdAt": datetime.utcnow().isoformat(),
#         "folders": [],
#         "files": []
#     }
#     current_dir["folders"].append(new_folder)
#
#     # Save updated directory back to DB
#     projects_table.update_item(
#         Key={"userId": user_id, "projectId": project_id},
#         UpdateExpression="SET directory = :val",
#         ExpressionAttributeValues={":val": project["directory"]}
#     )
#
#     return jsonify({"success": True, "folder": new_folder})
#
# @app.route("/api/project/<project_id>/files/presign", methods=["POST"])
# def generate_presigned_url(project_id):
#     data = request.get_json()
#     file_name = data.get("fileName")
#     file_type = data.get("fileType")
#
#     if not file_name or not file_type:
#         return jsonify({"error": "Missing fileName or fileType"}), 400
#
#     key = f"projects/{project_id}/{file_name}"
#
#     url = s3.generate_presigned_url(
#         "put_object",
#         Params={"Bucket": S3_BUCKET_NAME, "Key": key, "ContentType": file_type},
#         ExpiresIn=300
#     )
#
#     return jsonify({"uploadUrl": url, "key": key})
#
#
# @app.route("/api/project/<project_id>/files/presign-get", methods=["POST"])
# def generate_presigned_get_url(project_id):
#     data = request.get_json()
#     key = data.get("key")
#
#     if not key:
#         return jsonify({"error": "Missing file key"}), 400
#
#     url = s3.generate_presigned_url(
#         "get_object",
#         Params={"Bucket": S3_BUCKET_NAME, "Key": key},
#         ExpiresIn=300  # 5 minutes
#     )
#
#     return jsonify({"url": url})
#
# @app.route("/api/project/<project_id>/files/metadata", methods=["POST"])
# def save_file_metadata(project_id):
#     data = request.get_json()
#     file_name = data.get("name")
#     size = data.get("size")
#     uploaded_at = data.get("uploadedAt")
#     key = data.get("key")
#     path = data.get("path", [])
#
#     if not file_name or not key:
#         return jsonify({"error": "Missing required fields"}), 400
#
#     # Get current user
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#
#     # Get project
#     resp = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#     project = resp.get("Item")
#
#     if not project:
#         return jsonify({"error": "Project not found"}), 404
#
#     # Ensure directory structure
#     if "directory" not in project:
#         project["directory"] = {
#             "name": "root",
#             "createdAt": datetime.utcnow().isoformat(),
#             "folders": [],
#             "files": []
#         }
#
#     # Navigate to target folder
#     current_dir = project["directory"]
#     for folder in path:
#         current_dir = next((f for f in current_dir["folders"] if f["name"] == folder), None)
#         if current_dir is None:
#             return jsonify({"error": f"Folder '{folder}' not found"}), 404
#
#     # Add file metadata
#     file_metadata = {
#         "name": file_name,
#         "size": size,
#         "uploadedAt": uploaded_at,
#         "key": key,
#     }
#     current_dir["files"].append(file_metadata)
#
#     # Save project back to DB
#     projects_table.update_item(
#         Key={"userId": user_id, "projectId": project_id},
#         UpdateExpression="SET directory = :val",
#         ExpressionAttributeValues={":val": project["directory"]}
#     )
#
#     return jsonify({"success": True, "file": file_metadata})
#
#
#
# # Root health check
# @app.route("/")
# def home():
#     return jsonify({"message": "BuildManager API is running."}), 200
#
#
# # Redirect OICD to login page
# @app.route("/login")
# def login():
#     redirect_uri = url_for('authorize', _external=True)
#     return oauth.oidc.authorize_redirect(redirect_uri)
#
#
# # Handle logout and redirect to frontend
# @app.route("/logout")
# def logout():
#     session.clear()
#     logout_url = "https://us-east-1kz1zp6tqt.auth.us-east-1.amazoncognito.com/logout?" + urlencode({
#         "client_id": CLIENT_ID,
#         "logout_uri": "http://localhost:3000"
#     })
#     return redirect(logout_url)
#
#
#
# # Get currently authenticated user information
# @app.route("/api/me")
# def me():
#     user = session.get("user")
#     if not user:
#         return jsonify({"authenticated": False}), 401
#     return jsonify({"authenticated": True, "user": user})
#
#
# # app.py (Flask)
# @app.route("/api/users/sync", methods=["GET"])
# def sync_user():
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     client = boto3.client("cognito-idp", region_name=AWS_DEFAULT_REGION)
#     user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
#
#     try:
#         resp = client.admin_get_user(
#             UserPoolId=user_pool_id,
#             Username=user_id
#         )
#         attrs = {a["Name"]: a["Value"] for a in resp["UserAttributes"]}
#         given_name = attrs.get("given_name", "unknown")
#         family_name = attrs.get("family_name", "unknown")
#
#         email = attrs.get("email", "unknown")
#
#         users_table = dynamodb.Table("BuildManagerUsers")
#
#         existing = users_table.get_item(Key={"userId": user_id}).get("Item")
#
#         if (not existing or existing.get("given_name") != given_name or existing.get("email") != email
#                 or existing.get("family_name") != family_name):
#             users_table.put_item(Item={
#                 "userId": user_id,
#                 "given_name": given_name,
#                 "family_name": family_name,
#                 "email": email,
#                 "syncedAt": datetime.utcnow().isoformat()
#             })
#
#         return jsonify({"message": "User synced"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
#
# # Get users for each project
# @app.route("/api/project/<project_id>/team", methods=["GET"])
# def get_users(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     users_table = dynamodb.Table("BuildManagerUsers")
#
#     try:
#         response = teams_table.query(
#             KeyConditionExpression=Key("projectId").eq(project_id)
#         )
#         team_members = response.get("Items", [])
#
#         # Fetch name and email from User table for each team member
#         enriched = []
#
#         for member in team_members:
#             user_response = users_table.query(
#                 KeyConditionExpression=Key("userId").eq(member["userId"])
#             )
#             user_info = user_response.get("Items", [])
#
#             if user_info:
#                 enriched.append({
#                     "projectId": project_id,
#                     "userId": member["userId"],
#                     "role": member.get("role", "member"),
#                     "addedAt": member.get("addedAt", ""),
#                     "family_name": user_info[0].get("family_name", ""),
#                     "given_name": user_info[0].get("given_name", ""),
#                     "email": user_info[0].get("email", "")
#                 })
#
#
#         return jsonify(enriched), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/add-user", methods=["POST"])
# def add_user_to_project(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     data = request.get_json()
#     email = data.get("email")
#     role = data.get("role", "member")
#
#     client = boto3.client("cognito-idp", region_name=AWS_DEFAULT_REGION)
#     user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
#
#     try:
#         # Find user by email in Cognito
#         response = client.list_users(
#             UserPoolId=user_pool_id,
#             Filter=f'email = "{email}"',
#             Limit=1
#         )
#
#         users = response.get("Users", [])
#         if not users:
#             return jsonify({"error": "User not found"}), 404
#
#         user_attrs = {attr['Name']: attr['Value'] for attr in users[0]['Attributes']}
#         user_id = user_attrs.get("sub")
#         if not user_id:
#             return jsonify({"error": "Missing user ID"}), 500
#
#
#         # Check if user already exists in the team
#         existing = teams_table.get_item(
#             Key={"projectId": project_id, "userId": user_id}
#         )
#         if "Item" in existing:
#             return jsonify({"error": "User already in project team"}), 409
#
#         # Safe insert with idempotent check (avoid overwrites)
#         teams_table.put_item(
#             Item={
#                 "projectId": project_id,
#                 "userId": user_id,
#                 "role": role,
#                 "addedAt": datetime.utcnow().isoformat()
#             },
#             ConditionExpression="attribute_not_exists(projectId) AND attribute_not_exists(userId)"
#         )
#
#         return jsonify({"message": "User added"}), 200
#
#     except client.exceptions.ClientError as e:
#         if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
#             return jsonify({"error": "User already in project"}), 409
#         return jsonify({"error": str(e)}), 500
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/remove-user", methods=["DELETE"])
# def remove_user_from_project(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     data = request.get_json()
#     user_id = data.get("userId")
#
#     if not user_id:
#         return jsonify({"error": "Missing user ID"}), 400
#
#     try:
#
#         # Check if the user exists in the project team
#         existing = teams_table.get_item(Key={"projectId": project_id, "userId": user_id})
#         if "Item" not in existing:
#             return jsonify({"error": "User not found in project team"}), 404
#
#         # Remove user from project
#         teams_table.delete_item(
#             Key={"projectId": project_id, "userId": user_id}
#         )
#
#         return jsonify({"message": "User removed successfully"}), 200
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
#
#
# @app.route("/api/projects", methods=["GET"])
# def get_projects():
#     user = session.get("user") or {}
#     user_id = user.get("sub")
#     if not user_id:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     try:
#         owned = projects_table.query(
#             IndexName="ownerId-index",
#             KeyConditionExpression=Key("ownerId").eq(user_id),
#         )["Items"]
#     except botocore.exceptions.ClientError as e:
#         code = e.response.get("Error", {}).get("Code")
#         msg  = e.response.get("Error", {}).get("Message", "")
#         if code == "ValidationException" and "backfilling" in msg.lower():
#             # TEMP fallback while GSI builds
#             owned = projects_table.scan(
#                 FilterExpression=Attr("ownerId").eq(user_id)
#             )["Items"]
#         else:
#             raise
#
#     # memberships via userId-index (might also still be building—handle the same way if needed)
#     try:
#         memberships = teams_table.query(
#             IndexName="userId-index",
#             KeyConditionExpression=Key("userId").eq(user_id),
#         )["Items"]
#     except botocore.exceptions.ClientError as e:
#         code = e.response.get("Error", {}).get("Code")
#         msg  = e.response.get("Error", {}).get("Message", "")
#         if code == "ValidationException" and "backfilling" in msg.lower():
#             memberships = teams_table.scan(
#                 FilterExpression=Attr("userId").eq(user_id)
#             )["Items"]
#         else:
#             raise
#
#     member_pids = {m["projectId"] for m in memberships} - {p["projectId"] for p in owned}
#     member_projects = []
#     if member_pids:
#         resp = dynamodb.batch_get_item(RequestItems={
#             projects_table.name: {"Keys": [{"projectId": pid} for pid in member_pids]}
#         })
#         member_projects = resp["Responses"].get(projects_table.name, [])
#
#     role_by_pid = {m["projectId"]: m.get("role", "member") for m in memberships}
#     out = [{**p, "currentUserRole": "owner"} for p in owned] + [
#         {**p, "currentUserRole": role_by_pid.get(p["projectId"], "member")}
#         for p in member_projects
#     ]
#     return jsonify(out), 200
#
#
# @app.route("/api/projects/<project_id>", methods=["DELETE"])
# def delete_project(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#
#     try:
#         # Check if project exists
#         project_response = projects_table.get_item(
#             Key={"userId": user_id, "projectId": project_id}
#         )
#
#         if "Item" not in project_response:
#             return jsonify({"error": "Project not found"}), 404
#
#         # Try querying team members
#         try:
#             team_response = teams_table.query(
#                 KeyConditionExpression="projectId = :pid",
#                 ExpressionAttributeValues={":pid": project_id}
#             )
#             team_members = team_response.get("Items", [])
#         except Exception as e:
#             # If query fails, fallback to scan (less efficient but works)
#             print(f"Query failed, using scan: {e}")
#             team_response = teams_table.scan(
#                 FilterExpression="projectId = :pid",
#                 ExpressionAttributeValues={":pid": project_id}
#             )
#             team_members = team_response.get("Items", [])
#
#         # Delete all team members
#         with teams_table.batch_writer() as batch:
#             for member in team_members:
#                 batch.delete_item(
#                     Key={
#                         "projectId": project_id,
#                         "userId": member["userId"]
#                     }
#                 )
#
#         # Delete project
#         projects_table.delete_item(
#             Key={"userId": user_id, "projectId": project_id}
#         )
#
#         return jsonify({"message": "Project and team deleted successfully"}), 200
#
#     except Exception as e:
#         print(f"Delete project error: {e}")
#         return jsonify({"error": str(e)}), 500
#
#
#
#
# @app.route("/api/project/<project_id>/update", methods=["POST"])
# def update_project(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     updated_data = request.get_json()
#
#     try:
#
#         update_expr = []
#         expr_attr_values = {}
#         for key, value in updated_data.items():
#             update_expr.append(f"{key} = :{key}")
#             expr_attr_values[f":{key}"] = value
#
#         projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET " + ", ".join(update_expr),
#             ExpressionAttributeValues=expr_attr_values,
#         )
#         return jsonify({"message": "Project updated successfully"}), 200
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
# @app.route("/api/project/<project_id>/update-field", methods=["PATCH"])
# def update_project_field(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json()
#
#     field = data.get("field")
#     value = data.get("value")
#     if not field or value is None:
#         return jsonify({"error": "Missing 'field' or 'value' in request body"}), 400
#
#     try:
#
#         response = projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET #field = :val",
#             ExpressionAttributeNames={"#field": field},
#             ExpressionAttributeValues={":val": value},
#             ReturnValues="UPDATED_NEW"
#         )
#
#         return jsonify({
#             "message": "Field updated successfully",
#             "updated": response.get("Attributes", {})
#         }), 200
#
#     except Exception as e:
#         print(f"Error updating project: {e}")
#         return jsonify({"error": "Failed to update project"}), 500
#
#
#
#
# @app.route("/api/project/<project_id>/update-milestone", methods=["POST"])
# def update_milestone(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json()
#
#     index = data.get("index")
#     field = data.get("field")
#     value = data.get("value")
#
#     if index is None or field is None or value is None:
#         return jsonify({"error": "Missing 'index', 'field', or 'value'"}), 400
#
#     try:
#
#         # Use DynamoDB list update expression
#         update_expression = f"SET milestones[{index}].{field} = :val"
#
#         response = projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression=update_expression,
#             ExpressionAttributeValues={":val": value},
#             ReturnValues="UPDATED_NEW"
#         )
#
#         return jsonify({
#             "message": "Milestone updated successfully",
#             "updated": response.get("Attributes", {})
#         }), 200
#
#     except Exception as e:
#         print(f"Error updating milestone: {e}")
#         return jsonify({"error": "Failed to update milestone"}), 500
#
#
#
# @app.route("/api/project/<project_id>", methods=["GET"])
# def get_project(project_id):
#     user = session.get("user") or {}
#     user_id = user.get("sub")
#     if not user_id:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     try:
#         # 1) Fetch the project by PK = projectId
#         proj_resp = projects_table.get_item(Key={"projectId": project_id})
#         item = proj_resp.get("Item")
#         if not item:
#             return jsonify({"error": "Project not found"}), 404
#
#         # 2) Authorization: owner or team member
#         if item.get("ownerId") != user_id:
#             team_resp = teams_table.get_item(Key={"projectId": project_id, "userId": user_id})
#             if "Item" not in team_resp:
#                 return jsonify({"error": "Forbidden"}), 403  # not owner and not a member
#
#         # (optional) include caller’s role for the UI
#         role = "owner" if item.get("ownerId") == user_id else team_resp["Item"].get("role", "member")
#         item["currentUserRole"] = role
#
#         return jsonify(item), 200
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/timeline", methods=["POST"])
# def update_project_timeline(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     data = request.get_json()
#     timeline = data.get("timeline", [])
#     user_id = user["sub"]
#
#     try:
#         response = projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET timeline = :timeline",
#             ExpressionAttributeValues={
#                 ":timeline": timeline
#             },
#             ReturnValues="UPDATED_NEW"
#         )
#         return jsonify({"timeline": response["Attributes"]["timeline"]}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/tasks", methods=["GET"])
# def get_tasks(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#
#     if not isinstance(user_id, str) or not isinstance(project_id, str):
#         return jsonify({"error": "Invalid key types"}), 400
#
#     print("Fetching tasks for:", user_id, project_id)
#
#     try:
#         response = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#         item = response.get("Item")
#         if not item:
#             return jsonify({"error": "Project not found"}), 404
#         return jsonify(item.get("tasks", [])), 200
#     except Exception as e:
#         print("DynamoDB Error:", e)
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/tasks", methods=["POST"])
# def update_tasks(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     tasks = request.get_json()
#
#     try:
#         projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET tasks = :t",
#             ExpressionAttributeValues={":t": tasks},
#         )
#         return jsonify({"message": "Tasks updated"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
# @app.route("/api/project/<project_id>/updates", methods=["POST"])
# def add_project_update(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     update = request.get_json()
#     user_id = user["sub"]
#
#     try:
#         # Add new update to the beginning of the updates array
#         response = projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET updates = list_append(:new, if_not_exists(updates, :empty))",
#             ExpressionAttributeValues={
#                 ":new": [update],
#                 ":empty": []
#             },
#             ReturnValues="UPDATED_NEW"
#         )
#         return jsonify(update), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
# @app.route("/api/project/<project_id>/updates", methods=["GET"])
# def get_project_updates(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#
#     try:
#         response = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#         project = response.get("Item")
#
#         if not project:
#             return jsonify({"error": "Project not found"}), 404
#
#         return jsonify(project.get("updates", [])), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
#
# @app.route("/authorize")
# def authorize():
#     token = oauth.oidc.authorize_access_token()
#     user_info = token.get('userinfo')
#     if not user_info:
#         return jsonify({"error": "Failed to retrieve user info"}), 400
#
#     session['user'] = user_info
#     session['id_token'] = token.get('id_token')  # optional
#     return redirect("http://localhost:3000/dashboard")  # or redirect to frontend dashboard
#
#
# # Create a project
# @app.route("/api/projects", methods=["POST"])
# def create_project():
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     data = request.get_json() or {}
#     user_id = user["sub"]  # Cognito sub
#     project_id = str(uuid.uuid4())
#     now_iso = datetime.utcnow().isoformat()
#
#     project_item = {
#         "projectId": project_id,
#         "ownerId": user_id,
#         "name": data["name"],
#         "description": data.get("description", ""),
#         "startDate": data.get("startDate"),
#         "endDate": data.get("endDate"),
#         "createdAt": now_iso,
#         "s3Folder": f"{user_id}/{project_id}/",  # keep if your S3 layout expects this
#
#         # Overview / structured fields
#         "client": data.get("client", ""),
#         "location": data.get("location", ""),
#         "status": "Not Started",
#         "progress": 0,
#         "milestones": [],
#         "team": [],  # optional; you also have the teams table as source of truth
#         "budget": 0,
#         "expenses": [],
#         "timeline": [],
#         "updates": [],
#         "notes": [],
#         "inspections": [],
#         "tasks": [],
#         "directory": {"name": "root", "folders": [], "files": []},
#     }
#
#     # 2) Add owner to teams table
#     owner_membership = {
#         "projectId": project_id,
#         "userId": user_id,
#         "role": "owner",
#         "addedAt": now_iso,
#     }
#
#     try:
#         projects_table.put_item(Item=project_item)
#         teams_table.put_item(Item=owner_membership)
#
#         return jsonify({"message": "Project created", "projectId": project_id}), 201
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
#
# @app.route("/api/project/<project_id>/inspections", methods=["PATCH"])
# def update_inspections(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json()
#
#     if not isinstance(data, list):
#         return jsonify({"error": "Invalid data format"}), 400
#
#
#     try:
#         projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET inspections = :val",
#             ExpressionAttributeValues={":val": data}
#         )
#         return jsonify({"message": "Inspections updated"}), 200
#
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/directory", methods=["PATCH"])
# def update_directory(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     user_id = user["sub"]
#     data = request.get_json()
#
#     try:
#         projects_table.update_item(
#             Key={"userId": user_id, "projectId": project_id},
#             UpdateExpression="SET directory = :val",
#             ExpressionAttributeValues={":val": data}
#         )
#         return jsonify({"message": "Directory updated"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
# @app.route("/api/project/<project_id>/expenses", methods=["PATCH"])
# def update_expenses(project_id):
#     user = session.get("user")
#     if not user or "sub" not in user:
#         return jsonify({"error": "Unauthorized"}), 401
#
#     data = request.get_json()
#     expenses = data.get("expenses")
#
#     try:
#
#         projects_table.update_item(
#             Key={"userId": user["sub"], "projectId": project_id},
#             UpdateExpression="SET expenses = :e",
#             ExpressionAttributeValues={":e": expenses}
#         )
#         return jsonify({"message": "Expenses updated"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
#
#
# @app.route("/api/project/<project_id>/notes", methods=["PATCH"])
# def update_project_notes(project_id):
#     data = request.get_json()
#     user_id = session.get("user")["sub"]
#
#
#     response = projects_table.get_item(Key={"userId": user_id, "projectId": project_id})
#     if "Item" not in response:
#         return jsonify({"error": "Project not found"}), 404
#
#     project = response["Item"]
#     project["notes"] = data.get("notes", [])
#
#     projects_table.put_item(Item=project)
#     return jsonify({"message": "Notes updated"}), 200
#
#
#
# if __name__ == "__main__":
#     app.run(port=5000, debug=True)


from app_folder import create_app

app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=app.config.get("DEBUG", False))