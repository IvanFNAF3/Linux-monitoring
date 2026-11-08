#!/usr/bin/env bash
# Сбор CPU/RAM/DISK и отправка метрик в orchestrator.
set -euo pipefail

CONFIG_FILE="${AGENT_CONFIG:-/etc/linux-monitoring/agent.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$CONFIG_FILE"
  set +a
fi

MONITORING_URL="${MONITORING_URL:-http://localhost:8100}"
AGENT_API_KEY="${AGENT_API_KEY:-change-me-agent-key}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-30}"
MACHINE_NAME="${MACHINE_NAME:-$(hostname)}"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

collect_cpu() {
  local first second
  first="$(head -n1 /proc/stat)"
  sleep 1
  second="$(head -n1 /proc/stat)"

  awk -v a="$first" -v b="$second" 'BEGIN {
    split(a, x, " ");
    split(b, y, " ");
    total1 = 0; total2 = 0;
    for (i = 2; i <= 9; i++) {
      total1 += x[i];
      total2 += y[i];
    }
    delta = total2 - total1;
    idle = (y[5] + y[6]) - (x[5] + x[6]);
    if (delta <= 0) {
      printf "0.00";
    } else {
      printf "%.2f", 100 * (delta - idle) / delta;
    }
  }'
}

collect_ram() {
  free | awk '/^Mem:/ { printf "%.2f", $3 / $2 * 100 }'
}

collect_disk() {
  df -P / | awk 'NR == 2 { gsub("%", "", $5); printf "%.2f", $5 }'
}

collect_os() {
  if [[ -r /etc/os-release ]]; then
    # shellcheck disable=SC1091
    source /etc/os-release
    printf '%s' "${PRETTY_NAME:-Linux}"
  else
    uname -s
  fi
}

send_metrics() {
  local cpu ram disk hostname_value os_info created_at payload
  cpu="$(collect_cpu)"
  ram="$(collect_ram)"
  disk="$(collect_disk)"
  hostname_value="$(hostname)"
  os_info="$(collect_os)"
  created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  payload="$(printf \
    '{"machine_name":"%s","hostname":"%s","os_info":"%s","cpu_percent":%s,"ram_percent":%s,"disk_percent":%s,"created_at":"%s"}' \
    "$(json_escape "$MACHINE_NAME")" \
    "$(json_escape "$hostname_value")" \
    "$(json_escape "$os_info")" \
    "$cpu" "$ram" "$disk" "$created_at")"

  if ! curl -fsS --max-time 10 \
    -X POST "${MONITORING_URL%/}/api/v1/metrics" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Key: ${AGENT_API_KEY}" \
    -d "$payload" >/dev/null; then
    echo "[$(date -Is)] failed to send metrics to ${MONITORING_URL}" >&2
  fi
}

echo "[$(date -Is)] agent started: machine=${MACHINE_NAME} url=${MONITORING_URL}"
while true; do
  send_metrics
  sleep "$INTERVAL_SECONDS"
done
