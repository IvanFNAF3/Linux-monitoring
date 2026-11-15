# host_client.py (на хосте)
import requests

VM_IP = "192.168.122.10" # IP-адрес вашей виртуальной машины
AGENT_PORT = 8000

def fetch_metrics_from_vm():
    try:
        response = requests.get(f"http://{VM_IP}:{AGENT_PORT}/metrics", timeout=5)
        response.raise_for_status() # Проверка на ошибки HTTP
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе к агенту: {e}")
        return None

# Использование
metrics = fetch_metrics_from_vm()
if metrics:
    print(metrics)