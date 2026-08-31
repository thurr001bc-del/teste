import { getDB } from "./db";
import { Appointment, AppointmentWithRelations, Barbershop, Customer, DashboardMetrics, Service, Barber, Product } from "./types";
import { addDaysISO, todayISO } from "./utils";

export function getPublicData(slug: string) {
  const db = getDB();
  const shop = db.barbershops.find((b) => b.slug === slug);
  if (!shop) return null;
  return {
    shop,
    services: shop ? db.services.filter((s) => s.active) : [],
    barbers: db.barbers.filter((b) => b.active),
    products: db.products.filter((p) => p.active),
  };
}

export function attachRelations(apt: Appointment): AppointmentWithRelations {
  const db = getDB();
  const service = db.services.find((s) => s.id === apt.serviceId)!;
  const barber = db.barbers.find((b) => b.id === apt.barberId)!;
  const customer = db.customers.find((c) => c.id === apt.customerId);
  return { ...apt, service, barber, customer };
}

export function getShopAppointments(shopId: string): AppointmentWithRelations[] {
  const db = getDB();
  return db.appointments
    .filter((a) => a.barbershopId === shopId)
    .map(attachRelations)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export function getAppointmentByToken(token: string): AppointmentWithRelations | null {
  const db = getDB();
  const apt = db.appointments.find((a) => a.token === token);
  return apt ? attachRelations(apt) : null;
}

export function getCustomerWithHistory(shopId: string, customerId: string) {
  const db = getDB();
  const customer = db.customers.find((c) => c.id === customerId && c.barbershopId === shopId);
  if (!customer) return null;
  const history = db.appointments
    .filter((a) => a.barbershopId === shopId && a.customerId === customerId)
    .map(attachRelations)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  return { customer, history };
}

export function getDashboard(shopId: string): DashboardMetrics {
  const db = getDB();
  const apts = db.appointments.filter((a) => a.barbershopId === shopId);
  const today = todayISO();

  const todays = apts.filter((a) => a.date === today);
  const confirmed = apts.filter((a) => a.status === "confirmed").length;
  const pending = apts.filter((a) => a.status === "requested").length;
  const cancelled = apts.filter((a) => a.status === "cancelled").length;
  const revenue = apts
    .filter((a) => a.status !== "cancelled")
    .reduce((sum, a) => sum + a.price, 0);
  const revenueToday = todays
    .filter((a) => a.status !== "cancelled")
    .reduce((sum, a) => sum + a.price, 0);

  const upcoming = apts
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .map(attachRelations)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 6);

  // revenue series (last 7 days with bookings)
  const revenueSeries: { label: string; value: number }[] = [];
  const appointmentsSeries: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDaysISO(today, -i);
    const dayApts = apts.filter((a) => a.date === d && a.status !== "cancelled");
    revenueSeries.push({
      label: new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }),
      value: dayApts.reduce((s, a) => s + a.price, 0),
    });
    appointmentsSeries.push({
      label: new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }),
      value: dayApts.length,
    });
  }

  const serviceCount: Record<string, { name: string; value: number; revenue: number }> = {};
  apts.filter((a) => a.status !== "cancelled").forEach((a) => {
    const s = db.services.find((s) => s.id === a.serviceId);
    if (!s) return;
    serviceCount[s.name] = serviceCount[s.name] || { name: s.name, value: 0, revenue: 0 };
    serviceCount[s.name].value += 1;
    serviceCount[s.name].revenue += a.price;
  });
  const topServices = Object.values(serviceCount)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const productCount: Record<string, { name: string; value: number; revenue: number }> = {};
  db.orders.forEach((o) =>
    o.items.forEach((it) => {
      productCount[it.name] = productCount[it.name] || { name: it.name, value: 0, revenue: 0 };
      productCount[it.name].value += it.qty;
      productCount[it.name].revenue += it.price * it.qty;
    })
  );
  const topProducts = Object.values(productCount)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const productsSold = db.orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);

  return {
    appointmentsToday: todays.length,
    confirmed,
    pending,
    cancelled,
    revenue,
    revenueToday,
    totalCustomers: db.customers.length,
    productsSold,
    upcoming,
    revenueSeries,
    appointmentsSeries,
    topServices,
    topProducts,
  };
}
