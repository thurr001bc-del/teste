// ============================================================
// VANGUARD — Core domain types & interfaces
// Relational model, multi-tenant by barbershopId.
// ============================================================

export type ID = string;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  day: Weekday;
  enabled: boolean;
  open: string; // "09:00"
  close: string; // "19:00"
  breakStart?: string;
  breakEnd?: string;
}

export interface BarbershopSettings {
  // Visual identity for the public site (editable via "Meu site")
  primaryColor: string;
  confirmationMessage: string;
  heroHeadline: string;
  heroSubline: string;
  announcement?: string;
  currency: string;
  slotInterval: number; // minutes between generated slots
  bookingLeadMinutes: number; // minimum notice before a slot
}

export interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  facebook?: string;
}

export interface Barbershop {
  id: ID;
  slug: string;
  name: string;
  logo?: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  businessHours: DayHours[];
  socials: SocialLinks;
  settings: BarbershopSettings;
  createdAt: string;
}

export type UserRole = "owner" | "manager" | "staff";

export interface User {
  id: ID;
  barbershopId: ID;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Customer {
  id: ID;
  barbershopId: ID;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface BarberScheduleDay {
  day: Weekday;
  enabled: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface Barber {
  id: ID;
  barbershopId: ID;
  name: string;
  photo?: string;
  bio?: string;
  specialties: string[]; // service ids
  schedule: BarberScheduleDay[];
  daysOff: string[]; // ISO dates "YYYY-MM-DD"
  active: boolean;
}

export interface Service {
  id: ID;
  barbershopId: ID;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  image?: string;
  barberIds: ID[]; // barbers who perform this service
  active: boolean;
}

export type ProductCategory =
  | "pomadas"
  | "shampoo"
  | "oleo"
  | "pentes"
  | "acessorios"
  | "kits";

export interface Product {
  id: ID;
  barbershopId: ID;
  name: string;
  description: string;
  price: number;
  images?: string[];
  category: string;
  stock: number;
  sku?: string;
  active: boolean;
}

export interface Collection {
  id: ID;
  barbershopId: ID;
  name: string;
  featured: boolean;
  order: number;
  createdAt: string;
}

export type AppointmentStatus =
  | "requested" // Aguardando confirmação
  | "confirmed" // Confirmado
  | "in_progress" // Em atendimento
  | "completed" // Atendido
  | "rescheduled" // Remarcação solicitada
  | "cancelled" // Cancelado
  | "no_show"; // Não compareceu

export type AppointmentSource = "public" | "admin" | "whatsapp";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: ID;
  barbershopId: ID;
  type: TransactionType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Appointment {
  id: ID;
  barbershopId: ID;
  customerId?: ID;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: ID;
  barberId: ID;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number;
  price: number;
  status: AppointmentStatus;
  token: string; // confirmation/remarcation token
  notes?: string;
  source: AppointmentSource;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedTime {
  id: ID;
  barbershopId: ID;
  barberId?: ID; // null => shop-wide
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  reason?: string;
}

export type NotificationType =
  | "new_booking"
  | "confirmation"
  | "reschedule"
  | "cancellation"
  | "low_stock"
  | "system";

export interface Notification {
  id: ID;
  barbershopId: ID;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedId?: ID;
  createdAt: string;
}

export interface OrderItem {
  productId: ID;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = "reserved" | "paid" | "fulfilled" | "cancelled";

export interface Order {
  id: ID;
  barbershopId: ID;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Database {
  barbershops: Barbershop[];
  users: User[];
  customers: Customer[];
  barbers: Barber[];
  services: Service[];
  products: Product[];
  collections: Collection[];
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  notifications: Notification[];
  orders: Order[];
  transactions: Transaction[];
}

// ---- View models / DTOs -------------------------------------

export interface AppointmentWithRelations extends Appointment {
  service: Service;
  barber: Barber;
  customer?: Customer;
}

export interface DashboardMetrics {
  appointmentsToday: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  revenue: number;
  revenueToday: number;
  totalCustomers: number;
  productsSold: number;
  upcoming: AppointmentWithRelations[];
  revenueSeries: { label: string; value: number }[];
  appointmentsSeries: { label: string; value: number }[];
  topServices: { name: string; value: number; revenue: number }[];
  topProducts: { name: string; value: number; revenue: number }[];
}
