import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export function AccountTab() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 4px", color: "var(--text-primary)" }}>
        Account
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        Your account details and role information
      </p>

      <div
        style={{
          border: "0.5px solid var(--border-subtle)",
          borderRadius: 10,
          background: "var(--bg-secondary)",
          padding: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontWeight: 400 }}>full name</p>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
            {currentUser.fullName}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontWeight: 400 }}>job title</p>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
            {currentUser.title}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontWeight: 400 }}>email</p>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
            {currentUser.email}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, fontWeight: 400 }}>role</p>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
            {currentUser.role}
          </p>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <Link to="/profile" style={{ textDecoration: "none" }}>
            <button className="btn-primary">Open profile</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

