from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Linux Monitoring Backend"
    database_url: str = (
        "postgresql+psycopg://monitoring:monitoring@localhost:5432/monitoring"
    )


settings = Settings()
