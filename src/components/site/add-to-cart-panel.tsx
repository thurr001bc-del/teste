"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/components/site/cart-context";
import { useToast } from "@/components/toast";
import { formatBRL, cn } from "@/lib/utils";
import { productImages } from "@/lib/product-images";

export function AddToCartPanel({ product, currency }: { product: Product; currency: string }) {
  const { add } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;

  return (
    <div className="card p-6">
      <p className="text-xs uppercase tracking-wide text-foreground-subtle">Preço</p>
      <p className="mt-1 font-display text-3xl font-bold text-foreground">{formatBRL(product.price, currency)}</p>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className={cn("h-2 w-2 rounded-full", product.stock > 5 ? "bg-success" : product.stock > 0 ? "bg-warning" : "bg-danger")} />
        <span className="text-foreground-muted">
          {out ? "Esgotado" : product.stock <= 5 ? `Últimas ${product.stock} unidades` : "Em estoque"}
        </span>
      </div>

      {!out && (
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-border">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center text-foreground-muted transition hover:text-foreground">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="flex h-10 w-10 items-center justify-center text-foreground-muted transition hover:text-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => { add({ productId: product.id, name: product.name, price: product.price, image: productImages(product)[0], category: product.category }, qty); toast({ title: "Adicionado à sacola", description: `${qty}x ${product.name}`, variant: "success" }); }}
            className="btn-primary flex-1"
          >
            <ShoppingBag className="h-4 w-4" /> Adicionar à sacola
          </button>
        </div>
      )}

      <Link href="/carrinho" className="btn-outline mt-3 w-full">
        Ir para a sacola
      </Link>
    </div>
  );
}
