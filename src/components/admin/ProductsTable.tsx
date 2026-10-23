// src/components/admin/ProductsTable.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";
import { VerificationBadge } from "@/components/admin/ui";

type Product = {
  id: string;
  name: string;
  origin: string;
  availableQty: string | null;
  status: "VERIFIED" | "PENDING" | "UNVERIFIED";
  published: boolean;
  featured: boolean;
  category: { name: string };
};

const STATUSES = ["VERIFIED", "PENDING", "UNVERIFIED"] as const;

export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function patch(id: string, data: Partial<Product>) {
    const before = products.find((p) => p.id === id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);

    // 202 = queued for the Super Admin: the change is NOT live, so show the
    // product as it really is until it's approved.
    if (!res || res.status === 202 || !res.ok) {
      if (before) setProducts((prev) => prev.map((p) => (p.id === id ? before : p)));
      toast(res && res.status === 202 ? "Sent to the Super Admin for final approval." : "Couldn't update. Try again.");
    }
    startTransition(() => router.refresh());
  }

  async function remove(id: string) {
    if (!confirm("Delete this product listing?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    toast("Product deleted.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl2 border border-forest-100 bg-cream-50 overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-forest-100">
            <th className="p-4">Product</th>
            <th className="p-4">Origin</th>
            <th className="p-4">Available</th>
            <th className="p-4">Status</th>
            <th className="p-4">Published</th>
            <th className="p-4">Featured</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-forest-100 last:border-0">
              <td className="p-4">
                <span className="font-medium">{p.name}</span>
                <p className="text-xs text-ink-soft">{p.category?.name}</p>
              </td>
              <td className="p-4 font-mono text-xs">{p.origin}</td>
              <td className="p-4 font-mono text-xs">{p.availableQty ?? "—"}</td>
              <td className="p-4">
                <select
                  value={p.status}
                  onChange={(e) => patch(p.id, { status: e.target.value as any })}
                  className="h-8 bg-cream-100 border border-forest-100 rounded-lg px-2 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="p-4">
                <button
                  onClick={() => patch(p.id, { published: !p.published })}
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${p.published ? "bg-forest-100 text-forest-700" : "bg-ink/5 text-ink-soft"}`}
                >
                  {p.published ? "Published" : "Draft"}
                </button>
              </td>
              <td className="p-4">
                <button
                  onClick={() => patch(p.id, { featured: !p.featured })}
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${p.featured ? "bg-gold-100 text-gold-700" : "bg-ink/5 text-ink-soft"}`}
                >
                  {p.featured ? "Featured" : "—"}
                </button>
              </td>
              <td className="p-4 text-right">
                <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
