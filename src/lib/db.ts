import fs from "fs";
import path from "path";
import { Database, Barbershop, User, Service, Barber, Customer, Product, Collection, Transaction, Appointment, BlockedTime, Notification, Order, DayHours, BarberScheduleDay, AppointmentStatus } from "./types";
import { uid, token, addDaysISO, todayISO, addMinutesToTime, timeToMinutes, minutesToTime } from "./utils";

export { uid, token };

const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SEED_DB_PATH = path.join(process.cwd(), "data", "db.json");

// ---- password hashing (scrypt) -----------------------------
import crypto from "crypto";
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(pw, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function defaultBusinessHours(): DayHours[] {
  const base: DayHours[] = [];
  for (let d = 0; d < 7; d++) {
    if (d === 0) {
      base.push({ day: 0, enabled: false, open: "09:00", close: "18:00" });
    } else if (d === 6) {
      base.push({ day: 6, enabled: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00" });
    } else {
      base.push({ day: d as any, enabled: true, open: "09:00", close: "20:00", breakStart: "12:00", breakEnd: "13:00" });
    }
  }
  return base;
}

function defaultSchedule(): BarberScheduleDay[] {
  const s: BarberScheduleDay[] = [];
  for (let d = 0; d < 7; d++) {
    if (d === 0) s.push({ day: 0, enabled: false, start: "09:00", end: "18:00" });
    else if (d === 6) s.push({ day: 6, enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" });
    else s.push({ day: d as any, enabled: true, start: "09:00", end: "20:00", breakStart: "12:00", breakEnd: "13:00" });
  }
  return s;
}

function seed(): Database {
  const shopId = "shop_vanguard";
  const now = new Date().toISOString();

  const barbershop: Barbershop = {
    id: shopId,
    slug: "vanguard",
    name: "Vanguard Barbearia",
    tagline: "Estilo com precisão cirúrgica",
    description:
      "A Vanguard é mais do que uma barbearia — é um estúdio de cuidados masculinos onde tradição e técnica se encontram. Ambiente premium, profissionais especializados e uma experiência pensada em cada detalhe, do corte à finalização.",
    address: "Rua das Acácias, 248 — Jardins",
    city: "São Paulo",
    phone: "(11) 98877-1234",
    email: "ola@vanguardbarber.com.br",
    businessHours: defaultBusinessHours(),
    socials: {
      instagram: "vanguardbarber",
      whatsapp: "5511988771234",
      tiktok: "vanguardbarber",
    },
    settings: {
      primaryColor: "#B8893B",
      confirmationMessage:
        "Estamos te aguardando! Confirme seu horário para garantirmos sua cadeira. Qualquer dúvida, fale conosco no WhatsApp.",
      heroHeadline: "O corte que define sua presença.",
      heroSubline:
        "Agende com os melhores barbeiros da cidade. Precísão, estilo e aquele atendimento que vira rotina.",
      slotInterval: 30,
      bookingLeadMinutes: 60,
      currency: "R$",
    },
    createdAt: now,
  };

  const owner: User = {
    id: "user_owner",
    barbershopId: shopId,
    name: "Henrique Vanguard",
    email: "admin@vanguard.com",
    passwordHash: hashPassword("vanguard123"),
    role: "owner",
    createdAt: now,
  };
  const manager: User = {
    id: "user_manager",
    barbershopId: shopId,
    name: "Marina Lopes",
    email: "marina@vanguard.com",
    passwordHash: hashPassword("vanguard123"),
    role: "manager",
    createdAt: now,
  };

  const services: Service[] = [
    { id: "svc_corte", barbershopId: shopId, name: "Corte", description: "Corte personalizado com acabamento na máquina e tesoura.", price: 45, duration: 40, barberIds: [], active: true },
    { id: "svc_barba", barbershopId: shopId, name: "Barba", description: "Modelagem, toalha quente e finalização com óleo.", price: 35, duration: 30, barberIds: [], active: true },
    { id: "svc_combo", barbershopId: shopId, name: "Corte + Barba", description: "Experiência completa: corte e barba com finalização premium.", price: 70, duration: 70, barberIds: [], active: true },
    { id: "svc_platinado", barbershopId: shopId, name: "Platinado", description: "Descoloração e tratamento completo para loiros.", price: 120, duration: 120, barberIds: [], active: true },
    { id: "svc_sobrancelha", barbershopId: shopId, name: "Sobrancelha", description: "Design e linha com navalha.", price: 20, duration: 20, barberIds: [], active: true },
    { id: "svc_higienizacao", barbershopId: shopId, name: "Higienização", description: "Limpeza profunda de pele e cabelo.", price: 40, duration: 35, barberIds: [], active: true },
  ];

  const barbers: Barber[] = [
    { id: "bar_lucas", barbershopId: shopId, name: "Lucas Almeida", bio: "Especialista em cortes clássicos e fade.", photo: undefined, specialties: ["svc_corte", "svc_barba", "svc_combo"], schedule: defaultSchedule(), daysOff: [], active: true },
    { id: "bar_rafael", barbershopId: shopId, name: "Rafael Costa", bio: "Mestre em loiros e transformações.", photo: undefined, specialties: ["svc_corte", "svc_platinado"], schedule: defaultSchedule(), daysOff: [], active: true },
    { id: "bar_diego", barbershopId: shopId, name: "Diego Martins", bio: "Barba impecável e acabamento navalha.", photo: undefined, specialties: ["svc_barba", "svc_combo", "svc_sobrancelha"], schedule: defaultSchedule(), daysOff: [], active: true },
    { id: "bar_thiago", barbershopId: shopId, name: "Thiago Souza", bio: "Atendimento rápido e cortes modernos.", photo: undefined, specialties: ["svc_corte", "svc_barba", "svc_higienizacao"], schedule: defaultSchedule().map((d) => d.day === 1 ? { ...d, enabled: false } : d), daysOff: [], active: true },
  ];
  // every barber performs every service by default
  services.forEach((s) => (s.barberIds = barbers.map((b) => b.id)));

  const customerNames = [
    "João Silva", "Pedro Henrique", "Marcelo Andrade", "Bruno Carvalho", "Felipe Nogueira",
    "Gustavo Reis", "Rafael Lima", "André Bastos", "Cauã Ferreira", "Lucas Pereira",
    "Thiago Mendes", "Vitor Hugo", "Eduardo Ramos", "Leonardo Dias", "Matheus Rocha",
  ];
  const customers: Customer[] = customerNames.map((name, i) => ({
    id: `cust_${i}`, barbershopId: shopId, name,
    phone: `(11) 9${String(8000 + i * 137).slice(0, 4)}-${String(1000 + i * 91).slice(0, 4)}`,
    email: `${name.split(" ")[0].toLowerCase()}@email.com`,
    createdAt: addDaysISO(todayISO(), -120 + i * 3),
  }));

  const products: Product[] = [
    { id: "prd_1", barbershopId: shopId, name: "Pomada Matte Vanguard", description: "Fixação forte com acabamento seco e natural.", price: 59, category: "Pomadas", stock: 24, sku: "POM-01", active: true },
    { id: "prd_2", barbershopId: shopId, name: "Pomada Cream Hold", description: "Textura cremosa para penteados clássicos.", price: 65, category: "Pomadas", stock: 18, sku: "POM-02", active: true },
    { id: "prd_3", barbershopId: shopId, name: "Shampoo Purificante", description: "Limpeza profunda sem ressecar.", price: 42, category: "Shampoo", stock: 30, sku: "SHA-01", active: true },
    { id: "prd_4", barbershopId: shopId, name: "Shampoo Anticaspa", description: "Controle de oleosidade e caspa.", price: 48, category: "Shampoo", stock: 12, sku: "SHA-02", active: true },
    { id: "prd_5", barbershopId: shopId, name: "Óleo para Barba Gold", description: "Hidratação e brilho com nota amadeirada.", price: 52, category: "Óleo", stock: 26, sku: "OIL-01", active: true },
    { id: "prd_6", barbershopId: shopId, name: "Óleo Prendedor Vanguard", description: "Fixação leve para bigode.", price: 39, category: "Óleo", stock: 9, sku: "OIL-02", active: true },
    { id: "prd_7", barbershopId: shopId, name: "Pente Madeira Premium", description: "Pente artesanal em madeira.", price: 35, category: "Pentes", stock: 15, sku: "PEN-01", active: true },
    { id: "prd_8", barbershopId: shopId, name: "Kit Viagem", description: "Pente + pomada + óleo em estojo.", price: 129, category: "Acessórios", stock: 7, sku: "ACC-01", active: true },
    { id: "prd_9", barbershopId: shopId, name: "Touca Descartável", description: "Pacote com 50 toucas.", price: 25, category: "Acessórios", stock: 40, sku: "ACC-02", active: true },
    { id: "prd_10", barbershopId: shopId, name: "Kit Completo Mestre", description: "Pomada, óleo, shampoo e pente.", price: 199, category: "Kits", stock: 5, sku: "KIT-01", active: true },
  ];

  // ---- appointments (14 days window) ----
  const appointments: Appointment[] = [];
  const statusesPool: AppointmentStatus[] = ["confirmed", "confirmed", "confirmed", "requested", "completed", "completed", "in_progress", "cancelled"];
  const times = ["09:00", "09:30", "10:00", "11:00", "13:30", "14:30", "15:00", "16:00", "17:00", "18:00", "19:00"];
  let ai = 0;
  for (let dayOffset = -5; dayOffset <= 12; dayOffset++) {
    const date = addDaysISO(todayISO(), dayOffset);
    const dow = new Date(`${date}T00:00:00`).getDay();
    if (dow === 0) continue; // closed sundays
    const count = 2 + ((dayOffset * 3) % 4);
    for (let k = 0; k < count; k++) {
      const barber = barbers[((ai + dayOffset) % barbers.length + barbers.length) % barbers.length];
      const service = services[ai % services.length];
      const cust = customers[ai % customers.length];
      const startTime = times[(ai * 2) % times.length];
      const past = dayOffset < 0;
      const status: AppointmentStatus = past
        ? (ai % 7 === 0 ? "cancelled" : ai % 5 === 0 ? "completed" : "completed")
        : statusesPool[(ai + dayOffset) % statusesPool.length];
      const startMin = timeToMinutes(startTime);
      appointments.push({
        id: `apt_${ai}`,
        barbershopId: shopId,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        serviceId: service.id,
        barberId: barber.id,
        date,
        startTime,
        endTime: addMinutesToTime(startTime, service.duration),
        duration: service.duration,
        price: service.price,
        status,
        token: token(28),
        source: "public",
        createdAt: new Date(Date.now() - (10 - dayOffset) * 86400000).toISOString(),
        updatedAt: now,
      });
      ai++;
    }
  }

  const blockedTimes: BlockedTime[] = [
    { id: "blk_1", barbershopId: shopId, barberId: "bar_rafael", date: addDaysISO(todayISO(), 2), start: "14:00", end: "16:00", reason: "Curso de especialização" },
    { id: "blk_2", barbershopId: shopId, date: addDaysISO(todayISO(), 5), start: "12:00", end: "13:00", reason: "Reunião de equipe" },
  ];

  const notifications: Notification[] = [
    { id: "not_1", barbershopId: shopId, type: "low_stock", title: "Estoque baixo", message: "Óleo Prendedor Vanguard está com 9 unidades.", read: false, createdAt: now },
  ];

  const orders: Order[] = [];

  const collectionNames = ["Pomadas", "Shampoo", "Óleo", "Pentes", "Acessórios", "Kits"];
  const collections: Collection[] = collectionNames.map((name, i) => ({
    id: `col_${i + 1}`,
    barbershopId: shopId,
    name,
    featured: false,
    order: i,
    createdAt: now,
  }));

  const transactions: Transaction[] = [
    { id: "tx_1", barbershopId: shopId, type: "expense", description: "Aluguel da barbearia", amount: 2500, date: addDaysISO(todayISO(), -1), createdAt: now },
  ];

  return {
    barbershops: [barbershop],
    users: [owner, manager],
    customers,
    barbers,
    services,
    products,
    collections,
    appointments,
    blockedTimes,
    notifications,
    orders,
    transactions,
  };
}

let cache: Database | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Copy seed DB to /tmp on Vercel if not present
function ensureSeed() {
  ensureDir();
  if (fs.existsSync(DB_PATH)) return;
  if (fs.existsSync(SEED_DB_PATH)) {
    try {
      fs.copyFileSync(SEED_DB_PATH, DB_PATH);
      return;
    } catch {}
  }
}

// Keeps previously saved databases compatible after schema changes.
function normalize(db: Database): Database {
  if (!Array.isArray(db.collections)) {
    const names = Array.from(new Set(db.products.map((p) => (p.category || "").trim()).filter(Boolean)));
    db.collections = names.map((name, i) => ({
      id: `col_${i + 1}`,
      barbershopId: db.products[0]?.barbershopId || "shop_vanguard",
      name,
      featured: false,
      order: i,
      createdAt: new Date().toISOString(),
    }));
  }
  db.products.forEach((p) => {
    if (!Array.isArray(p.images)) p.images = [];
  });
  if (!Array.isArray(db.transactions)) db.transactions = [];
  return db;
}

export function getDB(): Database {
  if (cache) return cache;
  ensureSeed();
  if (fs.existsSync(DB_PATH)) {
    try {
      cache = normalize(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")));
      return cache!;
    } catch {
      // fall through to reseed
    }
  }
  cache = normalize(seed());
  persist(cache);
  return cache;
}

export function persist(db: Database) {
  ensureSeed();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  cache = db;
}

export function mutate<T>(fn: (db: Database) => T): T {
  const db = getDB();
  const result = fn(db);
  persist(db);
  return result;
}

// ---- tenant-scoped query helpers ---------------------------
export function getBarbershopBySlug(slug: string): Barbershop | undefined {
  return getDB().barbershops.find((b) => b.slug === slug);
}
export function getBarbershopById(id: string): Barbershop | undefined {
  return getDB().barbershops.find((b) => b.id === id);
}
export function getDefaultBarbershop(): Barbershop {
  return getBarbershopBySlug("vanguard")!;
}
export function getUserByEmail(email: string): User | undefined {
  return getDB().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
