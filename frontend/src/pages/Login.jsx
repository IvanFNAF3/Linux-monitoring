import LoginForm from "../components/LoginForm";

export default function Login({ onLogin }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 32,
          borderRadius: 20,
          border: "1px solid #1e293b",
          background: "rgba(15, 23, 42, 0.82)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              color: "#38bdf8",
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Linux Monitoring
          </div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Вход в панель</h1>
          <p style={{ margin: "10px 0 0", color: "#94a3b8", lineHeight: 1.5 }}>
            Авторизуйтесь, чтобы увидеть состояние серверов и историю метрик.
          </p>
        </div>

        <LoginForm onLogin={onLogin} />
      </section>
    </main>
  );
}
