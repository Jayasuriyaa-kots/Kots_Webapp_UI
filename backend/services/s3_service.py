
import boto3
from botocore.exceptions import ClientError
import logging
import os
from config import get_settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.settings = get_settings()
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.settings.my_aws_access_key_id,
            aws_secret_access_key=self.settings.my_aws_secret_access_key,
            region_name=self.settings.my_aws_region
        )
        self.bucket_name = self.settings.my_aws_bucket_name

    def upload_file(self, file_content, object_name, content_type="application/pdf"):
        """Upload a file to an S3 bucket and return the URL."""
        if not self.bucket_name:
            logger.error("MY_AWS_BUCKET_NAME is not set")
            return None

        try:
            self.s3_client.put_object(
                Body=file_content,
                Bucket=self.bucket_name,
                Key=object_name,
                ContentType=content_type
                # ACL='public-read' # Optional: if bucket allows public ACLs
            )
            # Construct URL
            # Format: https://BUCKET.s3.REGION.amazonaws.com/KEY
            region = self.settings.my_aws_region
            url = f"https://{self.bucket_name}.s3.{region}.amazonaws.com/{object_name}"
            return url
        except ClientError as e:
            logger.error(f"S3 Upload Error: {e}")
            return None

    def generate_presigned_url(self, object_name, expiration=3600):
        """Generate a presigned URL to share an S3 object"""
        if not self.bucket_name:
            logger.error("MY_AWS_BUCKET_NAME is not set")
            return None

        try:
            response = self.s3_client.generate_presigned_url('get_object',
                                                             Params={'Bucket': self.bucket_name,
                                                                     'Key': object_name},
                                                             ExpiresIn=expiration)
            return response
        except ClientError as e:
            logger.error(f"S3 Presigned URL Error: {e}")
            return None
