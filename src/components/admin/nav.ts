import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  Scissors,
  Package,
  Boxes,
  DollarSign,
  Settings,
  Globe,
  Layers,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "Geral" },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarRange, group: "Geral" },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: CalendarDays, group: "Geral" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, group: "Geral" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, group: "Gestão" },
  { href: "/admin/barbeiros", label: "Barbeiros", icon: Scissors, group: "Gestão" },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors, group: "Gestão" },
  { href: "/admin/produtos", label: "Produtos", icon: Package, group: "Loja" },
  { href: "/admin/colecoes", label: "Coleções", icon: Layers, group: "Loja" },
  { href: "/admin/estoque", label: "Estoque", icon: Boxes, group: "Loja" },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign, group: "Loja" },
  { href: "/admin/meu-site", label: "Meu site", icon: Globe, group: "Config" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, group: "Config" },
];
