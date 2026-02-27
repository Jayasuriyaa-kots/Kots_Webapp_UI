from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache
from urllib.parse import quote_plus
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    db_host: str = "kots-db-cluster.cluster-ch8uu0w02w3b.ap-south-1.rds.amazonaws.com"
    db_port: int = 5432
    db_name: str = "kots_prod"
    db_user: str = "postgres"
    db_password: str = ""

    # Database connection URL - can be provided in .env or constructed
    database_url: Optional[str] = None

    # Email (IMAP) Configuration
    email_host: str = "imappro.zoho.in"
    email_port: int = 993
    email_user: str = "jayasuriyaa.e@quantaops.com"
    email_password: str = ""

    # SMTP Configuration (for sending emails)
    smtp_host: str = "smtppro.zoho.in"
    smtp_port: int = 465
    smtp_user: str = "jayasuriyaa.e@quantaops.com"
    smtp_password: str = ""

    # AWS S3 Configuration
    my_aws_access_key_id: str = ""
    my_aws_secret_access_key: str = ""
    my_aws_region: str = "us-east-1"
    my_aws_bucket_name: str = ""

    # CORS Configuration
    cors_origins: list[str] = [
        "http://localhost:4200", 
        "http://0.0.0.0:4200",
        "https://main.df6vx67ik4zc9.amplifyapp.com"
    ]

    # Cookie Configuration
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    
    jwt_secret: str = "your_super_secret_key_change_this" # Fallback, should be in .env
    
    @model_validator(mode='after')
    def assemble_database_url(self) -> 'Settings':
        if not self.database_url:
            encoded_password = quote_plus(self.db_password)
            self.database_url = f"postgresql://{self.db_user}:{encoded_password}@{self.db_host}:{self.db_port}/{self.db_name}?sslmode=require"
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()
