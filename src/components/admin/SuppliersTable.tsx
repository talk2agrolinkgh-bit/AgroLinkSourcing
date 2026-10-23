// src/components/admin/SuppliersTable.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";
import { VerificationBadge } from "@/components/admin/ui";

type Supplier = {
  id: string;
  businessName: string;
  country: string;
  location: string;
  status: "VERIFIED" | "PENDING" | "UNVERIFIED";
  createdAt: string;
  products: { productNameRaw: string }[];
};

export function SuppliersTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function setStatus(id: string, status: "VERIFIED" | "PENDING" | "UNVERIFIED") {
    const before = suppliers.find((s) => s.id === id)?.status;
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res || res.status === 202 || !res.ok) {
      if (before) setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, status: before } : s)));
      toast(res && res.status === 202 ? "Sent to the Super Admin for final approval." : "Couldn't update. Try again.");
    } else {
      toast(status === "VERIFIED" ? "Supplier verified." : "Supplier status updated.");
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl2 border border-forest-100 bg-cream-50 overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="text-left text-xs text-ink-soft uppercase tracking-wide border-b border-forest-100">
            <th className="p-4">Business</th>
            <th className="p-4">Location</th>
            <th className="p-4">Product(s)</th>
            <th className="p-4">Submitted</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-b border-forest-100 last:border-0">
              <td className="p-4 font-medium">{s.businessName}</td>
              <td className="p-4 text-xs">{s.location}, {s.country}</td>
              <td className="p-4 text-xs">{s.products?.map((p) => p.productNameRaw).join(", ") || "—"}</td>
              <td className="p-4 font-mono text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
              <td className="p-4"><VerificationBadge status={s.status} /></td>
              <td className="p-4 text-right space-x-2">
                {s.status !== "VERIFIED" && (
                  <button onClick={() => setStatus(s.id, "VERIFIED")} className="text-xs font-semibold text-forest-700 hover:underline">Verify</button>
                )}
                {s.status !== "UNVERIFIED" && (
                  <button onClick={() => setStatus(s.id, "UNVERIFIED")} className="text-xs font-semibold text-red-600 hover:underline">
                    {s.status === "VERIFIED" ? "Suspend" : "Reject"}
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
