"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu, X, Bell, Search, LogOut, Settings, Globe, ChevronDown,
  Check, User as UserIcon,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Notif {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export function AdminShell({
  user,
  shopName,
  initialNotifications,
  children,
}: {
  user: { name: string; email: string; role: string };
  shopName: string;
  initialNotifications: Notif[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifs, setNotifs] = useState(initialNotifications);
  const [query, setQuery] = useState("");

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    if (notifOpen) {
      notifs.filter((n) => !n.read).forEach((n) => {
        fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [notifOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const filteredNav = NAV_ITEMS.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-5">
          <Link href="/admin" className="flex items-center">
            <Logo size={26} />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {Object.entries(groupNav()).map(([group, items]) => (
            <div key={group} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">{group}</p>
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active ? "bg-accent text-accent-foreground shadow-soft" : "text-foreground-muted hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link href="/" target="_blank" className="chip w-full justify-center hover:bg-muted">
            <Globe className="h-3.5 w-3.5" /> Ver site público
          </Link>
        </div>
      </div>
    );
  }

  function groupNav() {
    const groups: Record<string, typeof NAV_ITEMS> = {};
    NAV_ITEMS.forEach((n) => {
      groups[n.group] = groups[n.group] || [];
      groups[n.group].push(n);
    });
    return groups;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface"
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button className="btn-ghost h-9 w-9 p-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>

          <button onClick={() => setSearchOpen(true)} className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-foreground-subtle transition hover:border-accent/40 sm:max-w-xs">
            <Search className="h-4 w-4" />
            <span className="truncate">Buscar...</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] sm:inline">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted transition hover:text-foreground" aria-label="Notificações">
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">Notificações</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-foreground-subtle">Nenhuma notificação.</p>
                        ) : (
                          notifs.map((n) => (
                            <div key={n.id} className={cn("flex gap-3 border-b border-border px-4 py-3 last:border-0", !n.read && "bg-accent-soft/30")}>
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-foreground-subtle/40" : "bg-accent")} />
                              <div>
                                <p className="text-sm font-medium text-foreground">{n.title}</p>
                                <p className="text-xs text-foreground-muted">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2 transition hover:bg-muted">
                <Avatar name={user.name} size="sm" />
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight text-foreground">{user.name}</span>
                  <span className="block text-[10px] capitalize text-foreground-subtle">{user.role}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-foreground-subtle" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-foreground-subtle">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/admin/configuracoes" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground">
                          <Settings className="h-4 w-4" /> Configurações
                        </Link>
                        <Link href="/admin/meu-site" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground">
                          <Globe className="h-4 w-4" /> Meu site
                        </Link>
                        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger/10">
                          <LogOut className="h-4 w-4" /> Sair
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Command search */}
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar" size="md">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite para filtrar..." className="input mb-3" />
        <div className="space-y-1">
          {filteredNav.map((n) => (
            <button key={n.href} onClick={() => { setSearchOpen(false); setQuery(""); router.push(n.href); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground-muted transition hover:bg-muted hover:text-foreground">
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
          {filteredNav.length === 0 && <p className="px-3 py-4 text-sm text-foreground-subtle">Nenhum resultado.</p>}
        </div>
      </Modal>
    </div>
  );
}
