import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getInitials, PERMISSION_TEMPLATES, STORAGE_KEYS, type AppUser, type Role } from "@/lib/userManagement";
import { UserForm } from "./UserForm";

function roleBadgeStyle(role: Role) {
  if (role === "admin") return { bg: "var(--color-purple-bg)", text: "var(--color-purple-text)" };
  if (role === "auditor") return { bg: "var(--color-teal-bg)", text: "var(--color-teal-text)" };
  return { bg: "var(--bg-secondary)", text: "var(--text-secondary)" };
}

export function UsersTab() {
  const { currentUser, updateCurrentUser } = useAuth();

  const [view, setView] = useState<"list" | "form">("list");
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [users, setUsers] = useState<AppUser[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AppUser[]) : [];
    } catch {
      return [];
    }
  });

  const saveUsers = (updated: AppUser[]) => {
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USER_MANAGEMENT, JSON.stringify(updated));
  };

  useEffect(() => {
    // Keep UsersTab in sync if some other tab edits localStorage during the session
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEYS.USER_MANAGEMENT) return;
      const nextRaw = localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT);
      const parsed = nextRaw ? (JSON.parse(nextRaw) as AppUser[]) : [];
      if (Array.isArray(parsed)) setUsers(parsed);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleActive = (id: string) => {
    saveUsers(users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
  };

  const handleFormSubmit = (formData: Partial<AppUser> & { permissions: AppUser["permissions"] }) => {
    if (editingUser) {
      const updatedUser = { ...editingUser, ...formData } as AppUser;
      const next = users.map((u) => (u.id === editingUser.id ? updatedUser : u));
      saveUsers(next);
      setView("list");
      setEditingUser(null);

      if (currentUser?.id === updatedUser.id) {
        updateCurrentUser(updatedUser);
      }
      return;
    }

    const newUser: AppUser = {
      id: formData.id as string,
      isActive: true,
      fullName: formData.fullName as string,
      email: formData.email as string,
      title: (formData.title as string) || "",
      password: formData.password as string,
      avatar: (formData.avatar as string | null) ?? null,
      role: (formData.role as Role) || "implementer",
      permissions: formData.permissions,
    };

    const next = [...users, newUser];
    saveUsers(next);
    setView("list");
    setEditingUser(null);

    // No need to sync if not current user
  };

  const canShowEmpty = users.length === 0;

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
          Users & permissions
        </h2>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
          Manage who has access and what they can do
        </p>
      </div>
      <button
        className="btn-primary"
        onClick={() => {
          setEditingUser(null);
          setView("form");
        }}
      >
        + Add user
      </button>
    </div>
  );

  if (view === "form") {
    return (
      <>
        {header}
        <UserForm
          editingUser={editingUser}
          onSubmit={handleFormSubmit as any}
          onCancel={() => {
            setView("list");
            setEditingUser(null);
          }}
        />
      </>
    );
  }

  return (
    <div>
      {header}

      <div style={{ border: "0.5px solid var(--border-subtle)", borderRadius: 10, overflow: "hidden" }}>
        {/* Table header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 110px 100px 130px",
            gap: 8,
            padding: "9px 14px",
            background: "var(--bg-secondary)",
            borderBottom: "0.5px solid var(--border-subtle)",
          }}
        >
          {["", "Name / email", "Role", "Status", "Actions"].map((h) => (
            <p
              key={h}
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                margin: 0,
              }}
            >
              {h}
            </p>
          ))}
        </div>

        {canShowEmpty ? (
          <div
            style={{
              padding: "24px 14px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            No users yet. Click "+ Add user" to get started.
          </div>
        ) : (
          users.map((user, i) => {
            const badge = roleBadgeStyle(user.role);
            return (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 110px 100px 130px",
                  gap: 8,
                  padding: "11px 14px",
                  alignItems: "center",
                  borderBottom: i < users.length - 1 ? "0.5px solid var(--border-subtle)" : "none",
                  opacity: user.isActive ? 1 : 0.55,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Avatar */}
                <div>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "var(--color-purple-bg)",
                        color: "var(--color-purple-text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {getInitials(user.fullName)}
                    </div>
                  )}
                </div>

                {/* Name + email */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--text-primary)" }}>
                    {user.fullName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    {user.email}
                  </p>
                </div>

                {/* Role badge */}
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontWeight: 500,
                      display: "inline-block",
                      background: badge.bg,
                      color: badge.text,
                    }}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Status badge */}
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontWeight: 500,
                      display: "inline-block",
                      background: user.isActive ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                      color: user.isActive ? "var(--color-success-text)" : "var(--color-danger-text)",
                    }}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => {
                      setEditingUser(user);
                      setView("form");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-secondary"
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      color: user.isActive ? "var(--color-danger-text)" : "var(--text-secondary)",
                    }}
                    onClick={() => toggleActive(user.id)}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

