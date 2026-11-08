# Linux Monitoring

Платформа мониторинга Linux-серверов: bash-агенты собирают CPU/RAM/DISK, backend хранит метрики в PostgreSQL, BFF отдаёт агрегаты и выполняет авторизацию, frontend показывает круговые индикаторы и графики истории.

## Архитектура

```text
agents (bash) --> orchestrator --> backend --> PostgreSQL
                                      ^
                                      |
frontend <------ bff (JWT) -----------+
```

- **agents** — лёгкие bash-агенты для Ubuntu 24.04. Собирают CPU/RAM/DISK и отправляют метрики в orchestrator.
- **orchestrator** — регистрация агентов, heartbeat и приём метрик с последующей передачей в backend.
- **backend** — REST API, SQLAlchemy-модели и хранение истории метрик.
- **bff** — JWT-авторизация и агрегация данных для дашборда.
- **frontend** — React + Vite: круговые gauges и график истории.
- **postgres** — база данных, схема создаётся при первом запуске.

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

После запуска:

| Сервис       | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000        |
| BFF API      | http://localhost:8200/docs   |
| Orchestrator | http://localhost:8100/docs   |
| Backend API  | http://localhost:8000/docs   |
| PostgreSQL   | localhost:5432               |

Данные для входа по умолчанию: `admin` / `admin` (меняются в `.env`).

## Установка агента

На Ubuntu 24.04:

```bash
sudo MONITORING_URL=http://<orchestrator-host>:8100 \
     AGENT_API_KEY=<agent-api-key> \
     MACHINE_NAME=web-01 \
     ./agents/install_agent.sh
```

Проверка:

```bash
systemctl status linux-monitoring-agent
journalctl -u linux-monitoring-agent -f
```

## Основные endpoint'ы

### Orchestrator

- `POST /api/v1/agents/register` — регистрация агента
- `POST /api/v1/agents/heartbeat` — heartbeat агента
- `GET  /api/v1/agents` — список агентов
- `POST /api/v1/metrics` — приём и пересылка метрик в backend

### Backend

- `POST /api/v1/metrics` — сохранить метрику
- `GET  /api/v1/machines` — список машин
- `GET  /api/v1/machines/{id}/latest` — последняя метрика
- `GET  /api/v1/machines/{id}/metrics?limit=100` — история метрик

### BFF

- `POST /api/auth/login` — получить JWT
- `GET  /api/dashboard/summary` — сводка по машинам
- `GET  /api/dashboard/history/{machine_id}?limit=100` — история для графика

## Разработка без Docker

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# orchestrator
cd orchestrator
uvicorn app.main:app --reload --port 8100

# bff
cd bff
uvicorn app.main:app --reload --port 8200

# frontend
cd frontend
npm install
npm run dev
```

Для локального запуска backend укажите `DATABASE_URL` на доступный PostgreSQL.
