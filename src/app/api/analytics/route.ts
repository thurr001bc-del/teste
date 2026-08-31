import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { todayISO, addDaysISO } from "@/lib/utils";

type Period = "dia" | "semanal" | "mensal" | "anual" | "personalizado";

function computeRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayISO();
  switch (period) {
    case "dia":
      return { from: today, to: today };
    case "semanal": {
      const d = new Date(`${today}T00:00:00`);
      const diff = (d.getDay() + 6) % 7;
      return { from: addDaysISO(today, -diff), to: today };
    }
    case "mensal": {
      const [y, m] = today.split("-");
      return { from: `${y}-${m}-01`, to: today };
    }
    case "anual": {
      const [y] = today.split("-");
      return { from: `${y}-01-01`, to: today };
    }
    case "personalizado":
    default:
      return { from: customFrom || today, to: customTo || today };
  }
}

function listDays(from: string, to: string): string[] {
  const days: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard < 400) {
    days.push(cur);
    cur = addDaysISO(cur, 1);
    guard++;
  }
  return days;
}

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as Period) || "mensal";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const range = computeRange(period, from, to);
  const { from: rFrom, to: rTo } = range;

  const db = getDB();
  const apts = db.appointments.filter((a) => a.barbershopId === session.barbershopId && a.date >= rFrom && a.date <= rTo);
  const orders = db.orders.filter((o) => {
    const day = o.createdAt.slice(0, 10);
    return o.barbershopId === session.barbershopId && day >= rFrom && day <= rTo;
  });

  const appointments = apts.length;
  const confirmed = apts.filter((a) => a.status === "confirmed").length;
  const pending = apts.filter((a) => a.status === "requested").length;
  const cancelled = apts.filter((a) => a.status === "cancelled").length;

  const servicesRevenue = apts.filter((a) => a.status !== "cancelled").reduce((s, a) => s + a.price, 0);
  const productRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const revenue = servicesRevenue + productRevenue;
  const itemsSold = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
  const transactionsCount = apts.filter((a) => a.status !== "cancelled").length + orders.filter((o) => o.status !== "cancelled").length;
  const avgTicket = transactionsCount > 0 ? revenue / transactionsCount : 0;

  const periodTx = db.transactions.filter((t) => t.barbershopId === session.barbershopId && t.date >= rFrom && t.date <= rTo);
  const transactionsIncome = periodTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const transactionsExpense = periodTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = revenue + transactionsIncome - transactionsExpense;

  // ---- series (daily, or monthly when span is large) ----
  const days = listDays(rFrom, rTo);
  const monthly = days.length > 31;
  const revBuckets = new Map<string, number>();
  const aptBuckets = new Map<string, number>();
  const bucketLabel = (day: string) => {
    if (monthly) {
      return new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", { month: "short" });
    }
    return new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };
  const ensure = (m: Map<string, number>, k: string) => (m.has(k) ? m.get(k)! : (m.set(k, 0), 0));
  days.forEach((d) => { const k = bucketLabel(d); ensure(revBuckets, k); ensure(aptBuckets, k); });
  apts.forEach((a) => {
    const k = bucketLabel(a.date);
    revBuckets.set(k, (revBuckets.get(k) || 0) + (a.status !== "cancelled" ? a.price : 0));
    aptBuckets.set(k, (aptBuckets.get(k) || 0) + 1);
  });
  orders.forEach((o) => {
    const k = bucketLabel(o.createdAt.slice(0, 10));
    revBuckets.set(k, (revBuckets.get(k) || 0) + (o.status !== "cancelled" ? o.total : 0));
  });
  const revenueSeries = Array.from(revBuckets, ([label, value]) => ({ label, value }));
  const appointmentsSeries = Array.from(aptBuckets, ([label, value]) => ({ label, value }));

  // ---- top services in period ----
  const serviceCount: Record<string, { name: string; value: number; revenue: number }> = {};
  apts.filter((a) => a.status !== "cancelled").forEach((a) => {
    const s = db.services.find((s) => s.id === a.serviceId);
    if (!s) return;
    serviceCount[s.name] = serviceCount[s.name] || { name: s.name, value: 0, revenue: 0 };
    serviceCount[s.name].value += 1;
    serviceCount[s.name].revenue += a.price;
  });
  const topServices = Object.values(serviceCount).sort((a, b) => b.value - a.value).slice(0, 5);

  return NextResponse.json({
    from: rFrom,
    to: rTo,
    appointments,
    confirmed,
    pending,
    cancelled,
    revenue,
    servicesRevenue,
    productRevenue,
    itemsSold,
    avgTicket,
    transactionsIncome,
    transactionsExpense,
    netProfit,
    revenueSeries,
    appointmentsSeries,
    topServices,
  });
}
