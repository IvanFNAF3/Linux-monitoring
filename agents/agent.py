# agent_app.py (внутри виртуальной машины)
from fastapi import FastAPI
import uvicorn
import psutil # Предполагается, что ваша функция использует psutil

# Ваша существующая функция (пример)
def get_system_metrics():
    # ... ваша логика сбора метрик ...
    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage('/')._asdict()
    }

app = FastAPI()

@app.get("/metrics")
def metrics_endpoint():
    """Эндпоинт, вызывающий вашу функцию."""
    return get_system_metrics()

if __name__ == "__main__":
    # host="0.0.0.0" делает сервер доступным извне
    uvicorn.run(app, host="0.0.0.0", port=8000)