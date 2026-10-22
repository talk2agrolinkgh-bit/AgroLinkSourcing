// src/components/admin/EnrollmentStatusSelect.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";

const OPTIONS = ["pending", "active", "completed", "cancelled"];

export function EnrollmentStatusSelect({ id, initial }: { id: string; initial: string }) {
  const [status, setStatus] = useState(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function change(next: string) {
    const prev = status;
    setStatus(next);
    const res = await fetch(`/api/admin/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setStatus(prev);
      toast("Couldn't update. Try again.");
      return;
    }
    toast(next === "completed" ? "Marked as graduated." : `Status set to ${next}.`);
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value)}
      className="h-8 bg-cream-100 border border-forest-100 rounded-lg px-2 text-xs"
    >
      {OPTIONS.map((o) => <option key={o} value={o}>{o === "completed" ? "completed (graduated)" : o}</option>)}
    </select>
  );
}
