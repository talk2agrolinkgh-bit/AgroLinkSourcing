// src/components/admin/TeamManager.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";

type Admin = { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN"; active: boolean; createdAt: string };

export function TeamManager({ selfId, initialAdmins }: { selfId: string; initialAdmins: Admin[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function patch(id: string, data: Record<string, unknown>, okMsg: string) {
    const res = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (!res || !res.ok) {
      toast(body?.error || "Couldn't update. Try again.");
      return;
    }
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...(body as Partial<Admin>) } : a)));
    toast(okMsg);
    startTransition(() => router.refresh());
  }

  async function resetPassword(a: Admin) {
    const pw = window.prompt(`New password for ${a.email} (at least 12 characters):`);
    if (!pw) return;
    await patch(a.id, { password: pw }, "Password updated.");
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const form = e.currentTarget;
    const f = new FormData(form);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: f.get("email"), name: f.get("name"), password: f.get("password"), role: f.get("role") }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setAdding(false);
    if (!res || !res.ok) {
      setError(body?.error || "Couldn't add that admin. Try again.");
      return;
    }
    setAdmins((prev) => [...prev, { ...body, createdAt: new Date().toISOString() }]);
    form.reset();
    toast("Admin added. Share their password with them privately.");
    startTransition(() => router.refresh());
  }

  const input = "h-10 bg-cream-100 border border-forest-100 rounded-lg px-3 text-sm w-full";

  return (
    <div className="space-y-8">
      <div className="rounded-xl2 border border-forest-100 bg-cream-50 overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-forest-100">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Access</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const me = a.id === selfId;
              return (
                <tr key={a.id} className="border-b border-forest-100 last:border-0">
                  <td className="p-4 font-medium">{a.name}{me && <span className="ml-2 text-xs text-ink-soft">(you)</span>}</td>
                  <td className="p-4 text-xs font-mono">{a.email}</td>
                  <td className="p-4">
                    <select
                      value={a.role}
                      disabled={me}
                      onChange={(e) => patch(a.id, { role: e.target.value }, "Role updated.")}
                      className="h-8 bg-cream-100 border border-forest-100 rounded-lg px-2 text-xs disabled:opacity-60"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.active ? "bg-forest-100 text-forest-700" : "bg-red-100 text-red-600"}`}>
                      {a.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => resetPassword(a)} className="text-xs font-semibold text-forest-700 hover:underline">Reset password</button>
                    {!me && (
                      <button
                        onClick={() => patch(a.id, { active: !a.active }, a.active ? "Admin suspended." : "Admin reactivated.")}
                        className={`text-xs font-semibold hover:underline ${a.active ? "text-red-600" : "text-forest-700"}`}
                      >
                        {a.active ? "Suspend" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="rounded-xl2 border border-forest-100 bg-cream-50 p-5 shadow-sm space-y-3 max-w-xl">
        <p className="font-display font-semibold text-forest-800">Add an admin</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input required name="name" placeholder="Full name" className={input} />
          <input required type="email" name="email" placeholder="Email" className={input} />
          <input required type="text" name="password" minLength={12} placeholder="Temporary password (12+ characters)" className={input} autoComplete="off" />
          <select name="role" defaultValue="ADMIN" className={input}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={adding} className="text-sm font-semibold px-4 h-10 rounded-full bg-forest-700 text-cream-50 hover:bg-forest-800 disabled:opacity-60">
          {adding ? "Adding…" : "Add admin"}
        </button>
        <p className="text-xs text-ink-soft">New admins can create and edit, but anything that goes live waits for a Super Admin while that approval is switched on.</p>
      </form>
    </div>
  );
}
