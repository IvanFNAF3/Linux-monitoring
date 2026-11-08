import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTooltipLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chart({ data = [] }) {
  if (!data.length) {
    return (
      <div style={emptyStyle}>
        Нет данных за выбранный период. Дождитесь первых метрик от агента.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="created_at"
          tickFormatter={formatTime}
          stroke="#64748b"
          minTickGap={30}
        />
        <YAxis
          domain={[0, 100]}
          unit="%"
          stroke="#64748b"
          width={55}
        />
        <Tooltip
          labelFormatter={formatTooltipLabel}
          formatter={(value) => `${Number(value).toFixed(2)}%`}
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 10,
            color: "#e2e8f0",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="cpu_percent"
          name="CPU"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="ram_percent"
          name="RAM"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="disk_percent"
          name="DISK"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const emptyStyle = {
  padding: "60px 20px",
  textAlign: "center",
  color: "#64748b",
};
