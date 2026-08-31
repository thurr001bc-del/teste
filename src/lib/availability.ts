import { Database, Barber, Service, Barbershop, Appointment } from "./types";
import { timeToMinutes, minutesToTime, addMinutesToTime, rangesOverlap, todayISO } from "./utils";

interface Window {
  open: number;
  close: number;
  breakStart?: number;
  breakEnd?: number;
}

function shopWindow(shop: Barbershop, weekday: number): Window | null {
  const h = shop.businessHours.find((d) => d.day === weekday);
  if (!h || !h.enabled) return null;
  return {
    open: timeToMinutes(h.open),
    close: timeToMinutes(h.close),
    breakStart: h.breakStart ? timeToMinutes(h.breakStart) : undefined,
    breakEnd: h.breakEnd ? timeToMinutes(h.breakEnd) : undefined,
  };
}

function barberWindow(barber: Barber, weekday: number): Window | null {
  const s = barber.schedule.find((d) => d.day === weekday);
  if (!s || !s.enabled) return null;
  return {
    open: timeToMinutes(s.start),
    close: timeToMinutes(s.end),
    breakStart: s.breakStart ? timeToMinutes(s.breakStart) : undefined,
    breakEnd: s.breakEnd ? timeToMinutes(s.breakEnd) : undefined,
  };
}

function intersect(a: Window, b: Window): Window | null {
  const open = Math.max(a.open, b.open);
  const close = Math.min(a.close, b.close);
  if (open >= close) return null;
  // merge breaks: if both have break, take union-ish by using the one inside window
  const breakStart = a.breakStart ?? b.breakStart;
  const breakEnd = a.breakEnd ?? b.breakEnd;
  return { open, close, breakStart, breakEnd };
}

const OCCUPYING: Appointment["status"][] = [
  "requested",
  "confirmed",
  "in_progress",
  "completed",
  "rescheduled",
];

export interface SlotCheckResult {
  free: boolean;
  barberId?: string;
}

/**
 * Backend source-of-truth check. Determines whether a given slot is bookable.
 * For barberId === null ("qualquer barbeiro"), returns the first free barber.
 */
export function checkSlot(
  db: Database,
  params: {
    barbershopId: string;
    serviceId: string;
    date: string;
    start: string;
    barberId: string | null;
    excludeAppointmentId?: string;
  }
): SlotCheckResult {
  const { barbershopId, serviceId, date, start, barberId, excludeAppointmentId } = params;
  const shop = db.barbershops.find((b) => b.id === barbershopId);
  const service = db.services.find((s) => s.id === serviceId);
  if (!shop || !service) return { free: false };

  const weekday = new Date(`${date}T00:00:00`).getDay();
  const shopWin = shopWindow(shop, weekday);
  if (!shopWin) return { free: false };

  const startMin = timeToMinutes(start);
  const endMin = startMin + service.duration;
  if (endMin > shopWin.close) return { free: false };
  if (shopWin.breakStart !== undefined && shopWin.breakEnd !== undefined) {
    if (rangesOverlap(startMin, endMin, shopWin.breakStart, shopWin.breakEnd))
      return { free: false };
  }

  // shop-wide blocks
  const shopBlocks = db.blockedTimes.filter(
    (b) => b.barbershopId === barbershopId && (!b.barberId || b.barberId === barberId) && b.date === date
  );
  for (const blk of shopBlocks) {
    if (rangesOverlap(startMin, endMin, timeToMinutes(blk.start), timeToMinutes(blk.end)))
      return { free: false };
  }

  const candidates = barberId
    ? db.barbers.filter((b) => b.id === barberId && b.active)
    : db.barbers.filter(
        (b) => b.active && b.specialties.includes(serviceId)
      );

  for (const barber of candidates) {
    if (barber.daysOff.includes(date)) continue;
    const bWin = barberWindow(barber, weekday);
    if (!bWin) continue;
    const eff = intersect(shopWin, bWin);
    if (!eff) continue;
    if (startMin < eff.open || endMin > eff.close) continue;
    if (eff.breakStart !== undefined && eff.breakEnd !== undefined) {
      if (rangesOverlap(startMin, endMin, eff.breakStart, eff.breakEnd)) continue;
    }
    // barber-specific blocks
    const barberBlocks = db.blockedTimes.filter(
      (b) => b.barbershopId === barbershopId && b.barberId === barber.id && b.date === date
    );
    let blocked = false;
    for (const blk of barberBlocks) {
      if (rangesOverlap(startMin, endMin, timeToMinutes(blk.start), timeToMinutes(blk.end))) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    // existing appointments
    const appts = db.appointments.filter(
      (a) =>
        a.barbershopId === barbershopId &&
        a.barberId === barber.id &&
        a.date === date &&
        a.id !== excludeAppointmentId &&
        OCCUPYING.includes(a.status)
    );
    let conflict = false;
    for (const a of appts) {
      if (rangesOverlap(startMin, endMin, timeToMinutes(a.startTime), timeToMinutes(a.endTime))) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    return { free: true, barberId: barber.id };
  }

  return { free: false };
}

/**
 * Generates the list of available start times for a service/barber/date.
 */
export function availableSlots(
  db: Database,
  params: {
    barbershopId: string;
    serviceId: string;
    date: string;
    barberId: string | null;
  }
): string[] {
  const { barbershopId, serviceId, date, barberId } = params;
  const shop = db.barbershops.find((b) => b.id === barbershopId);
  const service = db.services.find((s) => s.id === serviceId);
  if (!shop || !service) return [];

  const weekday = new Date(`${date}T00:00:00`).getDay();
  const shopWin = shopWindow(shop, weekday);
  if (!shopWin) return [];

  let window: Window | null = shopWin;
  if (barberId) {
    const barber = db.barbers.find((b) => b.id === barberId);
    if (!barber) return [];
    const bWin = barberWindow(barber, weekday);
    if (!bWin) return [];
    window = intersect(shopWin, bWin);
    if (!window) return [];
    if (barber.daysOff.includes(date)) return [];
  }

  const interval = Math.max(5, shop.settings.slotInterval || 30);
  const slots: string[] = [];
  const now = Date.now();
  const lead = shop.settings.bookingLeadMinutes || 60;

  for (let m = window.open; m + service.duration <= window.close; m += interval) {
    if (window.breakStart !== undefined && window.breakEnd !== undefined) {
      if (rangesOverlap(m, m + service.duration, window.breakStart, window.breakEnd))
        continue;
    }
    // skip past slots for today
    const slotDate = new Date(`${date}T00:00:00`);
    slotDate.setMinutes(slotDate.getMinutes() + m);
    if (date === todayISO() && slotDate.getTime() < now + lead * 60000) continue;

    const res = checkSlot(db, {
      barbershopId,
      serviceId,
      date,
      start: minutesToTime(m),
      barberId,
    });
    if (res.free) slots.push(minutesToTime(m));
  }
  return slots;
}
