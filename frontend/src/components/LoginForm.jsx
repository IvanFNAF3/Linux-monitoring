import { useState } from "react";

import client from "../api/client";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await client.post("/api/auth/login", {
        username,
        password,
      });
      onLogin(data.access_token);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Не удалось выполнить вход. Проверьте логин и пароль."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <label style={labelStyle}>
        Логин
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />
      </label>

      {error && <div style={errorStyle}>{error}</div>}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}

const formStyle = {
  display: "grid",
  gap: 18,
};

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#94a3b8",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  outline: "none",
};

const errorStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.35)",
  color: "#fca5a5",
  fontSize: 14,
};

const buttonStyle = {
  padding: "12px 16px",
  border: 0,
  borderRadius: 10,
  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  color: "#fff",
  fontWeight: 600,
  opacity: 1,
};
