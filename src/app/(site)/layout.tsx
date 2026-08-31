import { getDefaultBarbershop } from "@/lib/db";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { CartProvider } from "@/components/site/cart-context";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const shop = getDefaultBarbershop();
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter shop={shop} />
      </div>
    </CartProvider>
  );
}
