"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [images[0]];

  if (list.length <= 1) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[0]} alt={name} className="aspect-square w-full object-cover" />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[active]} alt={name} className="aspect-square w-full object-cover" />
      </div>
      <div className="mt-3 flex gap-2">
        {list.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Ver imagem ${i + 1}`}
            className={cn(
              "h-16 w-16 overflow-hidden rounded-xl border-2 transition",
              i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
