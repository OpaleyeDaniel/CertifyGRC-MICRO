import React, { useRef, useState } from "react";
import {
  PERMISSION_TEMPLATES,
  getInitials,
  type Permissions,
  type Role,
  type AppUser,
  createUserId,
} from "@/lib/userManagement";

const PAGE_LABELS: Array<{ key: keyof Permissions; label: string }> = [
  { key: "assessment", label: "Assessment" },
  { key: "gapAnalysis", label: "Gap Analysis" },
  { key: "riskAssessment", label: "Risk Assessment" },
  { key: "evidence", label: "Evidence" },
  { key: "report", label: "Report" },
  { key: "review", label: "Comment & Review" },
  { key: "improvement", label: "Continuous Improvement" },
];

type PermissionForm = {
  [K in keyof Permissions]: Permissions[K];
};

export function UserForm({
  editingUser,
  onSubmit,
  onCancel,
}: {
  editingUser: AppUser | null;
  onSubmit: (formData: Partial<AppUser> & { permissions: Permissions }) => void;
  onCancel: () => void;
}) {
  const isEditing = !!editingUser;

  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    title: string;
    password: string;
    avatar: string | null;
    role: Role;
    permissions: Permissions;
  }>({
    fullName: editingUser?.fullName || "",
    email: editingUser?.email || "",
    title: editingUser?.title || "",
    password: "",
    avatar: editingUser?.avatar || null,
    role: (editingUser?.role as Role) || "implementer",
    permissions: editingUser?.permissions || PERMISSION_TEMPLATES.implementer,
  });

  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleRoleChange = (role: Role) => {
    setForm((f) => ({ ...f, role, permissions: PERMISSION_TEMPLATES[role] }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: typeof reader.result === "string" ? reader.result : null }));
    };
    reader.readAsDataURL(file);
  };

  const handlePermToggle = (pageKey: keyof Permissions, action: "view" | "edit", checked: boolean) => {
    setForm((f) => {
      const current = f.permissions[pageKey];
      const next: Permissions = { ...f.permissions, [pageKey]: { ...current } } as Permissions;

      if (action === "edit" && checked) {
        next[pageKey] = { ...next[pageKey], edit: true, view: true };
      } else if (action === "view" && !checked) {
        next[pageKey] = { ...next[pageKey], view: false, edit: false };
      } else {
        next[pageKey] = { ...next[pageKey], [action]: checked } as any;
      }

      return { ...f, permissions: next };
    });
  };

  const handleSubmit = () => {
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!isEditing && !form.password.trim()) {
      setError("Password is required for new users.");
      return;
    }

    setError("");

    if (isEditing) {
      const passwordToSubmit = form.password.trim() ? form.password : editingUser!.password;
      onSubmit({
        ...form,
        password: passwordToSubmit,
        id: editingUser!.id,
      } as any);
      return;
    }

    onSubmit({
      ...form,
      id: createUserId(),
    } as any);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
            {isEditing ? "Edit user" : "Add new user"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Fill in the details and configure page access
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {isEditing ? "Save changes" : "Create user"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            background: "var(--color-danger-bg)",
            color: "var(--color-danger-text)",
            fontSize: 13,
            border: "0.5px solid var(--color-danger-text)",
          }}
        >
          {error}
        </div>
      )}

      {/* Avatar upload */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
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
            alt=""
            style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              flexShrink: 0,
              background: "var(--color-purple-bg)",
              color: "var(--color-purple-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            {getInitials(form.fullName)}
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 3px", color: "var(--text-primary)" }}>
            Profile photo
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px" }}>
            Optional. Initials will be shown if no photo is uploaded.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => fileRef.current?.click()}>
              {form.avatar ? "Change photo" : "Upload photo"}
            </button>
            {form.avatar && (
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setForm((f) => ({ ...f, avatar: null }))}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form fields — 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div>
          <label className="form-label">
            Full name <span style={{ color: "var(--color-danger-text)" }}>*</span>
          </label>
          <input
            className="form-input"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="e.g. Kemi Adeyemi"
          />
        </div>
        <div>
          <label className="form-label">
            Email <span style={{ color: "var(--color-danger-text)" }}>*</span>
          </label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="kemi@company.com"
          />
        </div>
        <div>
          <label className="form-label">Job title</label>
          <input
            className="form-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Risk Analyst"
          />
        </div>
        <div>
          <label className="form-label">Role</label>
          <select className="form-input" value={form.role} onChange={(e) => handleRoleChange(e.target.value as Role)}>
            <option value="admin">admin</option>
            <option value="auditor">auditor</option>
            <option value="implementer">implementer</option>
          </select>
        </div>
        <div>
          <label className="form-label">
            Password{" "}
            {isEditing ? (
              <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(leave blank to keep current)</span>
            ) : (
              <span style={{ color: "var(--color-danger-text)" }}> *</span>
            )}
          </label>
          <input
            className="form-input"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Permission matrix */}
      <h3 style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px", color: "var(--text-primary)" }}>
        Page permissions
      </h3>

      <div style={{ border: "0.5px solid var(--border-subtle)", borderRadius: 10, overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px",
            padding: "10px 14px",
            background: "var(--bg-secondary)",
            borderBottom: "0.5px solid var(--border-subtle)",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>
            Page
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              margin: 0,
              textAlign: "center",
            }}
          >
            View
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Edit
          </p>
        </div>

        {/* Permission rows */}
        {PAGE_LABELS.map(({ key, label }, i) => (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px",
              padding: "11px 14px",
              alignItems: "center",
              borderBottom: i < PAGE_LABELS.length - 1 ? "0.5px solid var(--border-subtle)" : "none",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{label}</span>
            <div style={{ textAlign: "center" }}>
              <input
                type="checkbox"
                checked={form.permissions[key]?.view || false}
                onChange={(e) => handlePermToggle(key, "view", e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--color-info-text)" }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <input
                type="checkbox"
                checked={form.permissions[key]?.edit || false}
                onChange={(e) => handlePermToggle(key, "edit", e.target.checked)}
                style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--color-info-text)" }}
              />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "8px 0 0" }}>
        Enabling edit automatically enables view. Disabling view also disables edit.
      </p>
    </div>
  );
}

