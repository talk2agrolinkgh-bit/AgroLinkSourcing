// src/components/admin/GateToggles.tsx
"use client";

import { useState } from "react";
import { useToast } from "@/components/admin/Toaster";

const GATES: { key: string; label: string; help: string }[] = [
  { key: "PRODUCT", label: "Products", help: "Publishing, verifying or featuring a product" },
  { key: "SUPPLIER", label: "Suppliers", help: "Verifying a supplier" },
  { key: "DESK_REQUEST", label: "Sourcing Desk requests", help: "Approving a sourcing request for the desk" },
  { key: "DESK_AGENT", label: "Sourcing Desk agents", help: "Approving an agent's desk access" },
  { key: "FARM", label: "Farm projects", help: "Publishing a project or posting a farm update" },
  { key: "CMS", label: "Homepage / CMS", help: "Any change to homepage text going live" },
];

export function GateToggles({ initial }: { initial: Record<string, boolean> }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  async function toggle(key: string) {
    const next = !state[key];
    setBusy(key);
    setState((s) => ({ ...s, [key]: next }));
    const res = await fetch("/api/admin/approval-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled: next }),
    }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) {
      setState((s) => ({ ...s, [key]: !next }));
      toast("Couldn't change that setting. Try again.");
      return;
    }
    toast(next ? "Final approval switched ON." : "Final approval switched OFF — admins can release directly.");
  }

  return (
    <div className="mb-8 rounded-xl2 border border-forest-100 bg-cream-50 shadow-sm">
      <div className="p-4 border-b border-forest-100">
        <p className="font-display font-semibold text-forest-800">Require my final approval for…</p>
        <p className="text-xs text-ink-soft mt-0.5">
          Switch a category off and admins can release those changes directly. Taking something down (unpublish, suspend, reject, revoke) never needs approval.
        </p>
      </div>
      <ul className="divide-y divide-forest-100">
        {GATES.map((g) => (
          <li key={g.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{g.label}</p>
              <p className="text-xs text-ink-soft">{g.help}</p>
            </div>
            <button
              role="switch"
              aria-checked={state[g.key]}
              aria-label={`Require final approval for ${g.label}`}
              disabled={busy === g.key}
              onClick={() => toggle(g.key)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${state[g.key] ? "bg-forest-700" : "bg-ink/20"} disabled:opacity-60`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-cream-50 shadow transition-all ${state[g.key] ? "left-6" : "left-1"}`} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
