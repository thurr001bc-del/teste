import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getDB } from "@/lib/db";
import { AddToCartPanel } from "@/components/site/add-to-cart-panel";
import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { categoryLabel, productImages } from "@/lib/product-images";
import { formatBRL } from "@/lib/utils";

export default function ProdutoDetail({ params }: { params: { id: string } }) {
  const db = getDB();
  const shop = db.barbershops[0];
  const product = db.products.find((p) => p.id === params.id && p.active);
  if (!product) notFound();

  const related = db.products.filter((p) => p.active && p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <Link href="/produtos" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à loja
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={productImages(product)} name={product.name} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{categoryLabel(product.category)}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">{product.name}</h1>
          <p className="mt-4 leading-relaxed text-foreground-muted">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[Truck, ShieldCheck, RotateCcw].map((Icon, i) => (
              <span key={i} className="chip">
                <Icon className="h-3.5 w-3.5 text-accent" />
                {["Envio rápido", "Produto original", "Troca em 7 dias"][i]}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <AddToCartPanel product={product} currency={shop.settings.currency} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Você também pode gostar</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currency={shop.settings.currency} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
