// src/components/admin/FarmProjectCard.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";
import { PostUpdateModal } from "@/components/admin/PostUpdateModal";

const STAGES = ["PLANNING", "LAND_PREPARATION", "PLANTING", "GROWING", "HARVESTING", "COMPLETED"];

type Project = {
  id: string;
  name: string;
  region: string;
  crop: string;
  sizeAcres: number;
  stage: string;
  published: boolean;
  participants: any[];
  updates: { id: string; title: string; body: string; postedAt: string }[];
};

export function FarmProjectCard({ project }: { project: Project }) {
  const [stage, setStage] = useState(project.stage);
  const [published, setPublished] = useState(project.published);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  async function updateStage(next: string) {
    setStage(next);
    await fetch(`/api/admin/farm-projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    toast(`Project stage updated to ${next.replace("_", " ")}.`);
    startTransition(() => router.refresh());
  }

  async function togglePublished() {
    const next = !published;
    setPublished(next);
    const res = await fetch(`/api/admin/farm-projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    }).catch(() => null);
    if (!res || res.status === 202 || !res.ok) {
      setPublished(!next);
      toast(res && res.status === 202 ? "Sent to the Super Admin for final approval." : "Couldn't update. Try again.");
    } else {
      toast(next ? "Project published." : "Project unpublished.");
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl2 border border-forest-100 bg-cream-50 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-forest-800 text-sm">{project.name}</h3>
        <span className="text-xs font-mono text-ink-soft">
          {project.participants.length} participant{project.participants.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-xs text-ink-soft">{project.region} · {project.crop} · {project.sizeAcres} acres</p>

      <label className="block text-xs font-semibold text-ink-soft mt-3 mb-1.5">Stage</label>
      <select
        value={stage}
        onChange={(e) => updateStage(e.target.value)}
        className="w-full h-8 bg-cream-100 border border-forest-100 rounded-lg px-2 text-xs"
      >
        {STAGES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>

      <button
        onClick={togglePublished}
        className={`mt-3 px-2 py-1 rounded-full text-xs font-semibold ${published ? "bg-forest-100 text-forest-700" : "bg-ink/5 text-ink-soft"}`}
      >
        {published ? "Published — click to unpublish" : "Draft — click to publish"}
      </button>

      <div className="mt-3">
        <PostUpdateModal projectId={project.id} projectName={project.name} recentUpdates={project.updates} />
      </div>
    </div>
  );
}
