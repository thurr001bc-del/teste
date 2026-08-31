import { getDB } from "@/lib/db";
import { StoreView } from "@/components/site/store-view";

export default function ProdutosPage() {
  const db = getDB();
  const shop = db.barbershops[0];
  const products = db.products.filter((p) => p.active);
  const collections = db.collections
    .slice()
    .sort((a, b) => (a.featured === b.featured ? (a.order - b.order) || a.name.localeCompare(b.name) : a.featured ? -1 : 1));
  return <StoreView products={products} currency={shop.settings.currency} collections={collections} />;
}
