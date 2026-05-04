import React, { useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/userManagement";
import { OmegaPage } from "@/components/omega/OmegaPage";
import { cn } from "@/lib/utils";

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
    <OmegaPage
      eyebrow="Account"
      title="My profile"
      description="Manage your personal details and sign-in. Changes apply to this workspace for your user record."
      icon={<User className="h-5 w-5" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={handleDiscard}>
            Discard
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {message && (
          <div
            role="status"
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm",
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm sm:flex-row sm:items-center">
          {form.avatar ? (
            <img
              src={form.avatar}
              alt="Profile"
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {getInitials(form.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Profile photo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {avatarExists ? "Your photo is shown across the app." : "Upload a photo, or we show your initials."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
                {avatarExists ? "Change photo" : "Upload photo"}
              </button>
              {avatarExists && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setForm((f) => ({ ...f, avatar: null }))}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Job title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Role</label>
            <input
              className="form-input cursor-not-allowed bg-muted/50 text-muted-foreground"
              value={currentUser.role || ""}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="border-t border-border/60 pt-6">
          <h2 className="text-sm font-semibold text-foreground">Change password</h2>
          <p className="mt-1 text-xs text-muted-foreground">Leave blank to keep your current password.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                { key: "current" as const, label: "Current password" },
                { key: "newPass" as const, label: "New password" },
                { key: "confirm" as const, label: "Confirm new password" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </OmegaPage>
  );
}

