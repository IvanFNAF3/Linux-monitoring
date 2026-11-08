import { useCallback, useEffect, useMemo, useState } from "react";

import client from "../api/client";
import Chart from "../components/Chart";
import GaugeBar from "../components/GaugeBar";

function formatLastSeen(value) {
  if (!value) return "нет данных";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function SummaryTile({ label, value, hint }) {
  return (
    <div style={summaryTileStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <span style={summaryValueStyle}>{value}</span>
      {hint && <span style={summaryHintStyle}>{hint}</span>}
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [dashboard, setDashboard] = useState({ summary: null, machines: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const { data } = await client.get("/api/dashboard/summary");
      setDashboard(data);
      setError("");
      setSelectedId((current) => current ?? data.machines[0]?.id ?? null);
    } catch (requestError) {
      if (requestError.response?.status !== 401) {
        setError(
          "Не удалось загрузить данные. Проверьте, что backend и BFF запущены."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, 15000);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (selectedId === null) {
      setHistory([]);
      return undefined;
    }

    let cancelled = false;
    setHistoryLoading(true);

    client
      .get(`/api/dashboard/history/${selectedId}?limit=120`)
      .then(({ data }) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = useMemo(
    () => dashboard.machines.find((machine) => machine.id === selectedId) ?? null,
    [dashboard.machines, selectedId]
  );

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
        Загрузка данных...
      </div>
    );
  }

  const summary = dashboard.summary ?? {};

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Linux Monitoring</div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Состояние серверов</h1>
          <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>
            Метрики обновляются автоматически каждые 15 секунд.
          </p>
        </div>
        <button type="button" onClick={onLogout} style={logoutButtonStyle}>
          Выйти
        </button>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={summaryGridStyle}>
        <SummaryTile
          label="Машин"
          value={summary.machines ?? 0}
          hint={`${summary.online ?? 0} онлайн`}
        />
        <SummaryTile label="Средний CPU" value={formatPercent(summary.avg_cpu)} />
        <SummaryTile label="Средний RAM" value={formatPercent(summary.avg_ram)} />
        <SummaryTile label="Средний DISK" value={formatPercent(summary.avg_disk)} />
      </section>

      {dashboard.machines.length === 0 ? (
        <section style={emptyStyle}>
          <h2 style={{ marginTop: 0 }}>Пока нет подключённых машин</h2>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            Установите агент на сервер с помощью `agents/install_agent.sh`, и
            метрики появятся здесь.
          </p>
        </section>
      ) : (
        <section style={machinesGridStyle}>
          {dashboard.machines.map((machine) => {
            const isSelected = machine.id === selectedId;
            const isOnline = machine.status === "online";

            return (
              <button
                key={machine.id}
                type="button"
                onClick={() => setSelectedId(machine.id)}
                style={{
                  ...machineCardStyle,
                  border: isSelected
                    ? "1px solid rgba(56, 189, 248, 0.8)"
                    : "1px solid #1e293b",
                  background: isSelected
                    ? "rgba(14, 165, 233, 0.09)"
                    : "rgba(15, 23, 42, 0.78)",
                }}
              >
                <div style={machineHeaderStyle}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={machineNameStyle} title={machine.name}>
                      {machine.name}
                    </h2>
                    <div style={machineMetaStyle}>
                      {machine.hostname || "hostname неизвестен"}
                      {machine.os_info ? ` · ${machine.os_info}` : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      ...statusStyle,
                      color: isOnline ? "#86efac" : "#cbd5e1",
                      background: isOnline
                        ? "rgba(34, 197, 94, 0.12)"
                        : "rgba(100, 116, 139, 0.16)",
                    }}
                  >
                    <span
                      style={{
                        ...statusDotStyle,
                        background: isOnline ? "#22c55e" : "#64748b",
                      }}
                    />
                    {isOnline ? "online" : "offline"}
                  </span>
                </div>

                <div style={gaugesStyle}>
                  <GaugeBar value={machine.cpu_percent} label="CPU" size={104} />
                  <GaugeBar value={machine.ram_percent} label="RAM" size={104} />
                  <GaugeBar value={machine.disk_percent} label="DISK" size={104} />
                </div>

                <div style={lastSeenStyle}>
                  Последняя метрика: {formatLastSeen(machine.last_seen_at)}
                </div>
              </button>
            );
          })}
        </section>
      )}

      <section style={historyPanelStyle}>
        <div style={historyHeaderStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>
              История {selected ? `· ${selected.name}` : ""}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 14 }}>
              CPU, RAM и DISK за последние 120 измерений.
            </p>
          </div>
          {historyLoading && <span style={{ color: "#94a3b8" }}>обновление...</span>}
        </div>

        <Chart data={history} />
      </section>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "36px 20px 64px",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 28,
  flexWrap: "wrap",
};

const eyebrowStyle = {
  color: "#38bdf8",
  fontSize: 13,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 10,
};

const logoutButtonStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "transparent",
  color: "#e2e8f0",
};

const errorStyle = {
  marginBottom: 20,
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(239, 68, 68, 0.35)",
  background: "rgba(239, 68, 68, 0.12)",
  color: "#fca5a5",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 14,
  marginBottom: 24,
};

const summaryTileStyle = {
  padding: 18,
  borderRadius: 16,
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.72)",
  display: "grid",
  gap: 6,
};

const summaryLabelStyle = {
  color: "#94a3b8",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const summaryValueStyle = {
  fontSize: 28,
  fontWeight: 700,
};

const summaryHintStyle = {
  color: "#64748b",
  fontSize: 13,
};

const machinesGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
  marginBottom: 24,
};

const machineCardStyle = {
  padding: 20,
  borderRadius: 18,
  color: "#e2e8f0",
  textAlign: "left",
  transition: "border-color 150ms ease, background 150ms ease",
};

const machineHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const machineNameStyle = {
  margin: 0,
  fontSize: 20,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const machineMetaStyle = {
  marginTop: 6,
  color: "#94a3b8",
  fontSize: 13,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 12,
  flexShrink: 0,
};

const statusDotStyle = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  display: "inline-block",
};

const gaugesStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-around",
  gap: 8,
  marginTop: 18,
};

const lastSeenStyle = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #1e293b",
  color: "#64748b",
  fontSize: 12,
};

const historyPanelStyle = {
  padding: 22,
  borderRadius: 20,
  border: "1px solid #1e293b",
  background: "rgba(15, 23, 42, 0.72)",
};

const historyHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
};

const emptyStyle = {
  padding: 36,
  borderRadius: 20,
  border: "1px dashed #334155",
  background: "rgba(15, 23, 42, 0.5)",
  textAlign: "center",
  marginBottom: 24,
};
