// src/components/admin/SourcingAgentsTable.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";

type Agent = {
  id: string;
  name: string | null;
  email: string | null;
  sourcingAgentStatus: "PENDING" | "APPROVED" | "REVOKED";
  sourcingAgentAppliedAt: string | null;
  enrollments: { course: { title: string }; status: string }[];
};

export function SourcingAgentsTable({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState(initialAgents);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function setStatus(id: string, status: "APPROVED" | "REVOKED" | "PENDING") {
    const before = agents.find((a) => a.id === id)?.sourcingAgentStatus;
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, sourcingAgentStatus: status } : a)));
    const res = await fetch(`/api/admin/sourcing-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res || res.status === 202 || !res.ok) {
      if (before) setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, sourcingAgentStatus: before } : a)));
      toast(res && res.status === 202 ? "Sent to the Super Admin for final approval." : "Couldn't update. Try again.");
      startTransition(() => router.refresh());
      return;
    }
    toast(status === "APPROVED" ? "Access granted." : status === "REVOKED" ? "Access revoked." : "Moved back to pending.");
    startTransition(() => router.refresh());
  }

  if (agents.length === 0) {
    return <p className="text-sm text-ink-soft">No Sourcing Desk applications yet.</p>;
  }

  return (
    <div className="rounded-xl2 border border-forest-100 bg-cream-50 overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-forest-100">
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Training</th>
            <th className="p-4">Applied</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a) => (
            <tr key={a.id} className="border-b border-forest-100 last:border-0">
              <td className="p-4 font-medium">{a.name || "—"}</td>
              <td className="p-4 text-xs font-mono">{a.email}</td>
              <td className="p-4 text-xs">
                {a.enrollments.length > 0
                  ? a.enrollments.map((e) => `${e.course.title} (${e.status})`).join(", ")
                  : <span className="text-gold-700">No enrollment on record</span>}
              </td>
              <td className="p-4 font-mono text-xs">
                {a.sourcingAgentAppliedAt ? new Date(a.sourcingAgentAppliedAt).toLocaleDateString() : "—"}
              </td>
              <td className="p-4">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    a.sourcingAgentStatus === "APPROVED"
                      ? "bg-forest-100 text-forest-700"
                      : a.sourcingAgentStatus === "REVOKED"
                      ? "bg-red-100 text-red-600"
                      : "bg-gold-100 text-gold-700"
                  }`}
                >
                  {a.sourcingAgentStatus}
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                {a.sourcingAgentStatus !== "APPROVED" && (
                  <button onClick={() => setStatus(a.id, "APPROVED")} className="text-xs font-semibold text-forest-700 hover:underline">
                    Approve
                  </button>
                )}
                {a.sourcingAgentStatus !== "REVOKED" && (
                  <button onClick={() => setStatus(a.id, "REVOKED")} className="text-xs font-semibold text-red-600 hover:underline">
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
