from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "Samriddhi Gyan Hybrid Recommendation Service"
    VERSION: str = "1.0.0"
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # PostgreSQL Connection
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "samriddhi_gyan"
    DATABASE_URL: Union[str, None] = None

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    MAIN_BACKEND_URL: str = "http://localhost:10000"

    # Scheduler settings
    TRAINING_INTERVAL_MINUTES: int = 60

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v, info):
        if isinstance(v, str) and v.strip():
            return v
        data = info.data
        user = data.get("POSTGRES_USER", "postgres")
        password = data.get("POSTGRES_PASSWORD", "")
        server = data.get("POSTGRES_SERVER", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "samriddhi_gyan")
        return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
