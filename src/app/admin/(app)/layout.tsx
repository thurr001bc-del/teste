import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/admin/login");

  const db = getDB();
  const shop = db.barbershops.find((b) => b.id === session.barbershopId)!;
  const notifications = db.notifications
    .filter((n) => n.barbershopId === session.barbershopId)
    .slice(0, 12)
    .map((n) => ({ id: n.id, title: n.title, message: n.message, read: n.read, type: n.type, createdAt: n.createdAt }));

  return (
    <AdminShell
      user={{ name: session.name, email: session.email, role: session.role }}
      shopName={shop.name}
      initialNotifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
