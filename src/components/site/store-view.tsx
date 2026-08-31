"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";

export function StoreView({ products, currency, collections }: { products: Product[]; currency: string; collections: { id: string; name: string; featured: boolean; order: number }[] }) {
  const [cat, setCat] = useState<string>("all");
  const filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Vitrine</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground">
          Loja Vanguard
        </h1>
        <p className="mt-3 text-foreground-muted">
          Os mesmos produtos premium que usamos no estúdio. Receba em casa ou retire na barbearia.
        </p>
      </div>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCat("all")}
          className={cn("chip whitespace-nowrap transition", cat === "all" ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted")}
        >
          Todos
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.name)}
            className={cn("chip whitespace-nowrap transition", cat === c.name ? "border-accent bg-accent-soft text-accent" : "hover:bg-muted")}
          >
            {c.featured && <span className="mr-1 text-warning">★</span>}
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} currency={currency} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-foreground-muted">Nenhum produto nesta coleção.</p>
      )}
    </div>
  );
}
