from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Linux Monitoring Orchestrator"
    backend_url: str = "http://localhost:8000"
    agent_api_key: str = "change-me-agent-key"


settings = Settings()
