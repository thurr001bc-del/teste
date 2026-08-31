const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

const IMAGES: Record<string, string> = {
  Pomadas: "https://images.unsplash.com/photo-1631730486784-3d8b1d8a3c1f?auto=format&fit=crop&w=600&q=80",
  Shampoo: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80",
  Óleo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
  Pentes: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
  Acessórios: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80",
  Kits: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80",
};

const LABELS: Record<string, string> = {
  Pomadas: "Pomadas",
  Shampoo: "Shampoo",
  Óleo: "Óleo",
  Pentes: "Pentes",
  Acessórios: "Acessórios",
  Kits: "Kits",
};

export function productImage(cat: string): string {
  return IMAGES[cat] ?? FALLBACK_IMAGE;
}
export function categoryLabel(cat: string): string {
  return LABELS[cat] ?? (cat || "Produto");
}

export function productImages(p: { images?: string[]; category: string }): string[] {
  if (p.images && p.images.length > 0) return p.images;
  return [productImage(p.category)];
}
