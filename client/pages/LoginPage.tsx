import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const result = login(email, password);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-tertiary)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 380,
          padding: 36,
          background: "var(--bg-primary)",
          borderRadius: 14,
          border: "0.5px solid var(--border-subtle)",
        }}
      >
        {/*  */}
        <img
  src="/logo1.png"
  alt="CertifyGRC"
  style={{
    width: "140px",
    height: "auto",
    objectFit: "contain",
    display: "block",
    margin: "0 auto"
  }}
/>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "28px 0 28px" }}>
          Sign in to your account
        </p>

        {error && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: 7,
              marginBottom: 16,
              fontSize: 13,
              background: "var(--color-danger-bg)",
              color: "var(--color-danger-text)",
              border: "0.5px solid var(--color-danger-text)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Email address</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="you@company.com"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleLogin}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Sign in
        </button>

        <p
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            textAlign: "center",
            margin: "16px 0 0",
          }}
        >
          Default credentials: admin@certifygrc.com / Admin@123
        </p>
      </div>
    </div>
  );
}

