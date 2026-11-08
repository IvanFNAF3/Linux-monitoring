#!/usr/bin/env bash
# Установка агента мониторинга на Ubuntu 24.04.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите скрипт через sudo." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_URL="${MONITORING_URL:-http://localhost:8100}"
AGENT_API_KEY="${AGENT_API_KEY:-change-me-agent-key}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-30}"
MACHINE_NAME="${MACHINE_NAME:-$(hostname)}"

echo "[1/5] Установка зависимостей..."
apt-get update -qq
apt-get install -y -qq curl

echo "[2/5] Установка файлов агента..."
install -d -m 0755 /etc/linux-monitoring
install -m 0755 "${SCRIPT_DIR}/collect_metrics.sh" /usr/local/bin/linux-monitoring-agent
cat >/etc/linux-monitoring/agent.env <<EOF
MONITORING_URL=${MONITORING_URL}
AGENT_API_KEY=${AGENT_API_KEY}
INTERVAL_SECONDS=${INTERVAL_SECONDS}
MACHINE_NAME=${MACHINE_NAME}
EOF
chmod 0600 /etc/linux-monitoring/agent.env

echo "[3/5] Создание systemd unit..."
cat >/etc/systemd/system/linux-monitoring-agent.service <<'EOF'
[Unit]
Description=Linux Monitoring Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/etc/linux-monitoring/agent.env
ExecStart=/usr/local/bin/linux-monitoring-agent
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

echo "[4/5] Включение сервиса..."
systemctl daemon-reload
systemctl enable --now linux-monitoring-agent.service

echo "[5/5] Готово."
echo "Статус: systemctl status linux-monitoring-agent"
echo "Логи:   journalctl -u linux-monitoring-agent -f"
