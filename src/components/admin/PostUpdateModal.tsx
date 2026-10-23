// src/components/admin/PostUpdateModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toaster";
import { MediaUploader } from "@/components/uploads/MediaUploader";

type FarmUpdate = { id: string; title: string; body: string; postedAt: string };

export function PostUpdateModal({
  projectId,
  projectName,
  recentUpdates,
}: {
  projectId: string;
  projectName: string;
  recentUpdates: FarmUpdate[];
}) {
  const [open, setOpen] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const notify = form.get("notify") === "on";
    const res = await fetch(`/api/admin/farm-projects/${projectId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), body: form.get("body"), photoUrls, videoUrls, notify }),
    }).catch(() => null);
    if (!res || !res.ok) {
      toast("Couldn't post the update. Try again.");
      return;
    }
    setOpen(false);
    setPhotoUrls([]);
    setVideoUrls([]);
    toast(res.status === 202 ? "Update sent to the Super Admin for final approval." : `Update posted${notify ? " and participants notified." : "."}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex-1 text-xs font-semibold px-3 h-8 rounded-full bg-forest-700 text-cream-50 hover:bg-forest-800">
        + Post Update
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-0 sm:p-4">
            <div className="relative bg-cream-50 w-full sm:max-w-lg sm:rounded-xl2 rounded-t-xl2 max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="sticky top-0 bg-cream-50 flex items-center justify-between px-5 h-14 border-b border-forest-100">
                <h3 className="font-display font-semibold text-forest-800">Post Update — {projectName}</h3>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-forest-100 text-ink-soft">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Update title</label>
                  <input required name="title" className="w-full h-11 bg-cream-100 border border-forest-100 rounded-lg px-3.5 text-sm" placeholder="e.g. Weeding completed on block 2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Notes for the participant</label>
                  <textarea required name="body" rows={3} className="w-full bg-cream-100 border border-forest-100 rounded-lg px-3.5 py-2.5 text-sm" placeholder="What happened, crop condition, any concerns" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Photos</label>
                  <MediaUploader kind="image" value={photoUrls} onChange={setPhotoUrls} label="Add field photos" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Video</label>
                  <MediaUploader kind="video" value={videoUrls} onChange={setVideoUrls} label="Add a video" />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notify" defaultChecked className="w-4 h-4" /> Notify participant(s) by WhatsApp/email
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 h-11 rounded-full border border-forest-100 text-ink-soft font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 h-11 rounded-full bg-forest-700 text-cream-50 font-semibold hover:bg-forest-800">Post Update</button>
                </div>
              </form>

              {recentUpdates.length > 0 && (
                <div className="px-5 pb-5">
                  <div className="pt-4 border-t border-forest-100">
                    <p className="text-xs font-semibold text-ink-soft mb-2">Previous updates</p>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                      {recentUpdates.map((u) => (
                        <div key={u.id} className="p-3 rounded-lg bg-cream-100 border border-forest-100">
                          <p className="font-medium">{u.title}</p>
                          <p className="text-xs text-ink-soft mt-0.5">{u.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
