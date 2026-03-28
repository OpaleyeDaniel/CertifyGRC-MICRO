import React, { useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/userManagement";

export default function ProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth();

  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    title: currentUser?.title || "",
    avatar: currentUser?.avatar || null,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [message, setMessage] = useState<null | { type: "success" | "error"; text: string }>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const avatarExists = useMemo(() => Boolean(form.avatar), [form.avatar]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: typeof reader.result === "string" ? reader.result : null }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!currentUser) return;

    let updatedPassword = currentUser.password;

    if (passwords.newPass) {
      if (passwords.current !== currentUser.password) {
        setMessage({ type: "error", text: "Current password is incorrect." });
        window.setTimeout(() => setMessage(null), 3000);
        return;
      }
      if (passwords.newPass !== passwords.confirm) {
        setMessage({ type: "error", text: "New passwords do not match." });
        window.setTimeout(() => setMessage(null), 3000);
        return;
      }
      updatedPassword = passwords.newPass;
    }

    updateCurrentUser({ ...form, password: updatedPassword });
    setPasswords({ current: "", newPass: "", confirm: "" });
    setMessage({ type: "success", text: "Profile updated successfully." });
    window.setTimeout(() => setMessage(null), 3000);
  };

  const handleDiscard = () => {
    if (!currentUser) return;
    setForm({
      fullName: currentUser.fullName || "",
      email: currentUser.email || "",
      title: currentUser.title || "",
      avatar: currentUser.avatar || null,
    });
    setPasswords({ current: "", newPass: "", confirm: "" });
    setMessage(null);
  };

  if (!currentUser) return null;

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "0.5px solid var(--border-subtle)",
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
            My profile
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Manage your personal details and security settings
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={handleDiscard}>
            Discard
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            border: "0.5px solid",
            background:
              message.type === "success" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
            color: message.type === "success" ? "var(--color-success-text)" : "var(--color-danger-text)",
            borderColor: message.type === "success" ? "var(--color-success-text)" : "var(--color-danger-text)",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Avatar block */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: 16,
          marginBottom: 20,
          background: "var(--bg-secondary)",
          borderRadius: 10,
          border: "0.5px solid var(--border-subtle)",
        }}
      >
        {form.avatar ? (
          <img
            src={form.avatar}
            alt="avatar"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              flexShrink: 0,
              background: "var(--color-purple-bg)",
              color: "var(--color-purple-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            {getInitials(form.fullName)}
          </div>
        )}
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 3px", color: "var(--text-primary)" }}>
            Profile photo
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            {avatarExists ? "Looking good!" : "Upload a photo or your initials will be shown"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              {avatarExists ? "Change photo" : "Upload photo"}
            </button>
            {avatarExists && (
              <button className="btn-secondary" onClick={() => setForm((f) => ({ ...f, avatar: null }))}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personal details — 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div>
          <label className="form-label">Full name</label>
          <input className="form-input" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Job title</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Role</label>
          <input
            className="form-input"
            value={currentUser.role || ""}
            disabled
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
          />
        </div>
      </div>

      {/* Change password */}
      <div style={{ borderTop: "0.5px solid var(--border-subtle)", paddingTop: 20, marginBottom: 8 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 14px", color: "var(--text-primary)" }}>
          Change password
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { key: "current", label: "Current password" },
            { key: "newPass", label: "New password" },
            { key: "confirm", label: "Confirm new password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={(passwords as any)[key]}
                onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

