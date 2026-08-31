"use client";

import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/components/site/cart-context";
import { useToast } from "@/components/toast";
import { formatBRL, cn } from "@/lib/utils";
import { productImages, categoryLabel } from "@/lib/product-images";

export function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const { add } = useCart();
  const { toast } = useToast();
  const out = product.stock <= 0;
  const image = productImages(product)[0];

  return (
    <div className="card group flex flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
      <Link href={`/produtos/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {out && (
            <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
              Esgotado
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wide text-foreground-subtle">{categoryLabel(product.category)}</p>
        <Link href={`/produtos/${product.id}`} className="mt-1 font-semibold text-foreground hover:text-accent">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-foreground-muted">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-foreground">{formatBRL(product.price, currency)}</span>
          <button
            disabled={out}
            onClick={() => { add({ productId: product.id, name: product.name, price: product.price, image, category: product.category }); toast({ title: "Adicionado à sacola", description: product.name, variant: "success" }); }}
            className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground transition hover:brightness-105 disabled:opacity-40")}
            aria-label="Adicionar à sacola"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
