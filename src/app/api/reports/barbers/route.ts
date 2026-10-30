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

export async function GET(req: Request) {
  const session = getSession();
  if (!session) {
    const res = NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as Period) || "mensal";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const range = computeRange(period, from, to);

  const db = getDB();
  const shopId = session.barbershopId;
  const shopBarbers = db.barbers.filter((b) => b.barbershopId === shopId);
  const apts = db.appointments.filter((a) => a.barbershopId === shopId && a.date >= range.from && a.date <= range.to);

  const serviceMap = new Map(db.services.map((s) => [s.id, s]));

  const barberReports = shopBarbers.map((barber) => {
    const barberApts = apts.filter((a) => a.barberId === barber.id);
    const totalApts = barberApts.length;
    const completedApts = barberApts.filter((a) => a.status === "completed").length;
    const confirmedApts = barberApts.filter((a) => a.status === "confirmed").length;
    const inProgressApts = barberApts.filter((a) => a.status === "in_progress").length;
    const requestedApts = barberApts.filter((a) => a.status === "requested").length;
    const cancelledApts = barberApts.filter((a) => a.status === "cancelled").length;
    const noShowApts = barberApts.filter((a) => a.status === "no_show").length;

    const activeApts = barberApts.filter((a) => a.status !== "cancelled" && a.status !== "no_show");
    const revenue = activeApts.reduce((s, a) => s + a.price, 0);
    const avgTicket = activeApts.length > 0 ? revenue / activeApts.length : 0;

    const serviceCount: Record<string, { name: string; value: number; revenue: number }> = {};
    activeApts.forEach((a) => {
      const svc = serviceMap.get(a.serviceId);
      if (!svc) return;
      serviceCount[svc.name] = serviceCount[svc.name] || { name: svc.name, value: 0, revenue: 0 };
      serviceCount[svc.name].value += 1;
      serviceCount[svc.name].revenue += a.price;
    });
    const topServices = Object.values(serviceCount)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const revenueByDay: Record<string, number> = {};
    activeApts.forEach((a) => {
      revenueByDay[a.date] = (revenueByDay[a.date] || 0) + a.price;
    });
    const dailySeries = Object.entries(revenueByDay)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const busiestHours: Record<string, number> = {};
    activeApts.forEach((a) => {
      const hour = a.startTime.split(":")[0];
      busiestHours[hour] = (busiestHours[hour] || 0) + 1;
    });
    const topHours = Object.entries(busiestHours)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      id: barber.id,
      name: barber.name,
      photo: barber.photo,
      active: barber.active,
      totalApts,
      completedApts,
      confirmedApts,
      inProgressApts,
      requestedApts,
      cancelledApts,
      noShowApts,
      revenue,
      avgTicket,
      topServices,
      dailySeries,
      topHours,
    };
  });

  const comparison = barberReports.map((b) => ({
    name: b.name,
    revenue: b.revenue,
    totalApts: b.totalApts,
    completedApts: b.completedApts,
    avgTicket: b.avgTicket,
  }));

  const res = NextResponse.json({
    from: range.from,
    to: range.to,
    barbers: barberReports,
    comparison,
    totalRevenue: barberReports.reduce((s, b) => s + b.revenue, 0),
    totalAppointments: apts.length,
  });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("Pragma", "no-cache");
  return res;
}