// src/components/admin/CmsEditor.tsx
"use client";

import { useState } from "react";
import { useToast } from "@/components/admin/Toaster";

type Block = { id: string; label: string; value: string };

export function CmsEditor({ initialBlocks }: { initialBlocks: Block[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const toast = useToast();

  function setValue(id: string, value: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, value } : b)));
  }

  async function save(id: string) {
    const block = blocks.find((b) => b.id === id)!;
    const res = await fetch(`/api/admin/cms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: block.value }),
    }).catch(() => null);
    if (!res || !res.ok) {
      toast("Couldn't save. Try again.");
      return;
    }
    toast(res.status === 202 ? "Sent to the Super Admin — it goes live once approved." : "Saved. Live on the homepage.");
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {blocks.map((b) => (
        <div key={b.id} className="p-5 rounded-xl2 border border-forest-100 bg-cream-50 shadow-sm">
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">{b.label}</label>
          <textarea
            value={b.value}
            onChange={(e) => setValue(b.id, e.target.value)}
            rows={2}
            placeholder="Leave blank to hide this element"
            className="w-full bg-cream-100 border border-forest-100 rounded-lg px-3.5 py-2.5 text-sm"
          />
          <button onClick={() => save(b.id)} className="mt-2 text-xs font-semibold px-3 h-8 rounded-full bg-forest-700 text-cream-50 hover:bg-forest-800">
            Save
          </button>
        </div>
      ))}
    </div>
  );
}
