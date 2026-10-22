// src/components/uploads/MediaUploader.tsx
"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, FileText } from "lucide-react";
import { uploadToCloudinary, isCloudinaryConfigured, MediaKind } from "@/lib/cloudinary";

type PendingUpload = { id: string; name: string; progress: number; error?: string };

const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/*",
  document: ".pdf,.doc,.docx",
};

export function MediaUploader({
  kind,
  value,
  onChange,
  maxFiles,
  label,
}: {
  kind: MediaKind;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
}) {
  const cap = maxFiles ?? (kind === "video" ? 1 : kind === "document" ? 3 : 6);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  if (!isCloudinaryConfigured) {
    return (
      <div className="border-2 border-dashed border-forest-100 rounded-xl2 p-5 text-center text-xs text-ink-soft">
        {kind === "video" ? "Video" : kind === "document" ? "Document" : "Photo"} upload is temporarily unavailable.
        {process.env.NODE_ENV !== "production" && (
          <>
            {" "}Set <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> (see README).
          </>
        )}
      </div>
    );
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = Math.max(cap - value.length, 0);
    const selected = Array.from(files).slice(0, room);
    if (selected.length === 0) return;

    for (const file of selected) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setPending((p) => [...p, { id, name: file.name, progress: 0 }]);

      try {
        const url = await uploadToCloudinary(file, kind, (pct) => {
          setPending((p) => p.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
        });
        onChange([...value, url]);
      } catch (err: any) {
        setPending((p) => p.map((u) => (u.id === id ? { ...u, error: err.message || "Upload failed" } : u)));
        continue;
      }
      setPending((p) => p.filter((u) => u.id !== id));
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
    // Best-effort cleanup: the file already exists in Cloudinary, but if the
    // form is submitted without it (or the form is abandoned), nothing in
    // the database ever references it. A failed cleanup here just leaves an
    // orphaned file — low-cost and never user-visible — so errors are
    // intentionally swallowed rather than surfaced.
    fetch("/api/media/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  }

  const atCapacity = value.length >= cap;
  const gridCols = kind === "image" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-1";

  return (
    <div>
      {(value.length > 0 || pending.length > 0) && (
        <div className={`grid ${gridCols} gap-2 mb-2`}>
          {value.map((url) => (
            <div key={url} className="relative rounded-lg overflow-hidden border border-forest-100 bg-cream-100">
              {kind === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-20 object-cover" />
              )}
              {kind === "video" && <video src={url} controls className="w-full h-32 bg-ink" />}
              {kind === "document" && (
                <div className="flex items-center gap-2 p-3 text-xs">
                  <FileText size={16} className="text-forest-700 shrink-0" />
                  <span className="truncate">{url.split("/").pop()}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-cream-50 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {pending.map((p) => (
            <div key={p.id} className="rounded-lg border border-dashed border-forest-100 bg-cream-100 h-20 flex flex-col items-center justify-center text-xs text-ink-soft p-2 text-center">
              {p.error ? (
                <span className="text-red-600 leading-tight">{p.error}</span>
              ) : (
                <>
                  <Loader2 size={16} className="animate-spin mb-1" />
                  {p.progress}%
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!atCapacity && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-forest-100 rounded-xl2 p-4 text-center text-xs text-ink-soft hover:border-forest-700 hover:text-forest-700 transition flex items-center justify-center gap-2"
        >
          <UploadCloud size={16} />
          {label || (kind === "video" ? "Add video" : kind === "document" ? "Add document" : "Add photos")}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        multiple={kind !== "video"}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
