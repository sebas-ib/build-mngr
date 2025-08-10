from ..extensions import s3_client
from flask import current_app

def presign_put(project_id: str, file_name: str, file_type: str):
    key = f"projects/{project_id}/{file_name}"
    url = s3_client().generate_presigned_url(
        "put_object",
        Params={"Bucket": current_app.config["S3_BUCKET"], "Key": key, "ContentType": file_type},
        ExpiresIn=300,
    )
    return url, key

def presign_get(key: str):
    url = s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": current_app.config["S3_BUCKET"], "Key": key},
        ExpiresIn=300,
    )
    return url

def delete_s3_object(key: str):
    s3_client().delete_object(Bucket=current_app.config["S3_BUCKET"], Key=key)

def collect_files(folder: dict):
    files = list(folder.get("files", []))
    for sub in folder.get("folders", []):
        files.extend(collect_files(sub))
    return files
