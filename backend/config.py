from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App Settings
    app_name: str = "Golden Hour Response"
    environment: str = "development"
    
    # OSRM (Maps)
    osrm_server: str = "http://router.project-osrm.org"
    
    # Email Settings (Gmail)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = "your_email@gmail.com"  # REPLACE OR USE .ENV
    smtp_password: str = "your_app_password"     # REPLACE OR USE .ENV

    # Database (SQLite for now)
    database_url: str = "sqlite:///./golden_hour.db"

    class Config:
        env_file = ".env"
        extra = "allow" 


@lru_cache()
def get_settings():
    return Settings()
