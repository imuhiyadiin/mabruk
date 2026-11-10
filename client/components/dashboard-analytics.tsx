"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Boxes, CircleDollarSign, Clock3, MapPin, PackageCheck, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type WeeklyRevenue = { label: string; total: number };
type AnalyticsStats = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCategories: number;
  totalRevenue: number;
  weeklyRevenue: WeeklyRevenue[];
};
type AnalyticsOrder = { id: string; totalAmount: number; status?: string | null; ispaid?: boolean; createdAt: string; items?: unknown[] };
type AnalyticsCategory = { id: string; name: string; _count?: { Product: number } };
type AnalyticsOrderItem = { quantity?: number; quanity?: number; product?: { categoryId?: string; price?: number; name?: string } };
type ApiResponse<T> = { message?: string; result?: T };

const blankStats: AnalyticsStats = { totalUsers: 0, totalProducts: 0, totalOrders: 0, pendingOrders: 0, completedOrders: 0, cancelledOrders: 0, totalCategories: 0, totalRevenue: 0, weeklyRevenue: [] };

function apiBase() {
  return "/api";
}

async function readApiResponse<T>(response: Response, endpoint: string): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${endpoint} wuxuu soo celiyey jawaab aan JSON ahayn (HTTP ${response.status}). Hubi in backend-ku dib u bilaabmay oo API URL-ku sax yahay.`);
  }
  return response.json() as Promise<ApiResponse<T>>;
}

function StatCard({ title, value, detail, icon: Icon, color }: { title: string; value: string; detail: string; icon: typeof Boxes; color: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div><span className={cn("flex size-10 items-center justify-center rounded-xl", color)}><Icon className="size-5" /></span></div></article>;
}

function RevenueChart({ data }: { data: WeeklyRevenue[] }) {
  const max = Math.max(...data.map((item) => item.total), 1);
  const points = data.map((item, index) => `${data.length <= 1 ? 50 : 24 + (index * 352) / (data.length - 1)},${120 - (item.total / max) * 92}`).join(" ");
  return <div className="mt-5">
    <div className="flex justify-between text-[10px] text-slate-400"><span>${max.toLocaleString()}</span><span>${Math.round(max / 2).toLocaleString()}</span><span>$0</span></div>
    <svg viewBox="0 0 400 145" className="mt-1 h-44 w-full overflow-visible" role="img" aria-label="Weekly revenue chart">
      {[25, 70, 115].map((y) => <line key={y} x1="20" y1={y} x2="380" y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />)}
      {data.length > 0 && <><polygon points={`20,120 ${points} 380,120`} fill="url(#revenueFill)" /><polyline points={points} fill="none" stroke="#3159c9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{data.map((item, index) => { const x = data.length <= 1 ? 200 : 24 + (index * 352) / (data.length - 1); const y = 120 - (item.total / max) * 92; return <circle key={item.label} cx={x} cy={y} r="3.5" fill="#fff" stroke="#3159c9" strokeWidth="2" />; })}</>}
      <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3159c9" stopOpacity=".22" /><stop offset="100%" stopColor="#3159c9" stopOpacity="0" /></linearGradient></defs>
    </svg>
    <div className="flex justify-between px-1 text-[10px] text-slate-500">{data.map((item) => <span key={item.label}>{item.label}</span>)}</div>
  </div>;
}

type MonthShipments = { label: string; sent: number; inTransit: number; delivered: number };
function ShipmentChart({ data }: { data: MonthShipments[] }) {
  const max = Math.max(...data.map((item) => item.sent + item.inTransit + item.delivered), 1);
  return <div className="mt-4">
    <div className="flex h-44 items-end justify-between gap-2 border-b border-slate-100 px-2">
      {data.map((month) => <div key={month.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-[88%] w-full max-w-9 flex-col justify-end overflow-hidden rounded-t-md bg-slate-100" title={`${month.label}: ${month.sent + month.inTransit + month.delivered} orders`}>
        {month.delivered > 0 && <div className="bg-emerald-400" style={{ height: `${(month.delivered / max) * 100}%` }} />}
        {month.inTransit > 0 && <div className="bg-sky-400" style={{ height: `${(month.inTransit / max) * 100}%` }} />}
        {month.sent > 0 && <div className="bg-violet-300" style={{ height: `${(month.sent / max) * 100}%` }} />}
      </div><span className="text-[10px] text-slate-500">{month.label}</span></div>)}
    </div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{[{ label: "Sent / Pending", color: "bg-violet-300" }, { label: "On the way", color: "bg-sky-400" }, { label: "Delivered", color: "bg-emerald-400" }].map((item) => <span key={item.label} className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"><i className={cn("size-2 rounded-full", item.color)} />{item.label}</span>)}</div>
  </div>;
}

export default function DashboardAnalytics() {
  const [stats, setStats] = useState(blankStats);
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [categories, setCategories] = useState<AnalyticsCategory[]>([]);
  const [academicYear, setAcademicYear] = useState("2026 / 2027");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const storedUser = window.localStorage.getItem("user-data");
      const token = storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token : "";
      if (!token) throw new Error("Fadlan ku gal akoon admin ah si aad u aragto Analytics.");
      const year = window.localStorage.getItem("academic-year") ?? "2026 / 2027";
      setAcademicYear(year);
      const yearQuery = `?academicYear=${encodeURIComponent(year)}`;
      const headers = { Authorization: `Bearer ${token}` };
      const [statsResponse, ordersResponse, categoriesResponse] = await Promise.all([
        fetch(`${apiBase()}/admin/stats${yearQuery}`, { headers, cache: "no-store" }),
        fetch(`${apiBase()}/admin/orders${yearQuery}`, { headers, cache: "no-store" }),
        fetch(`${apiBase()}/admin/categories${yearQuery}`, { headers, cache: "no-store" }),
      ]);
      const [statsPayload, ordersPayload, categoriesPayload] = await Promise.all([
        readApiResponse<AnalyticsStats>(statsResponse, "/admin/stats"),
        readApiResponse<AnalyticsOrder[]>(ordersResponse, "/admin/orders"),
        readApiResponse<AnalyticsCategory[]>(categoriesResponse, "/admin/categories"),
      ]);
      if (!statsResponse.ok || !statsPayload.result) throw new Error(statsPayload.message ?? "Analytics lama soo shubi karin.");
      if (!ordersResponse.ok || !Array.isArray(ordersPayload.result)) throw new Error(ordersPayload.message ?? "Order data lama soo shubi karin.");
      if (!categoriesResponse.ok || !Array.isArray(categoriesPayload.result)) throw new Error(categoriesPayload.message ?? "Category data lama soo shubi karin.");
      setStats({ ...blankStats, ...statsPayload.result });
      setOrders(ordersPayload.result);
      setCategories(categoriesPayload.result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Server-ka lama heli karo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
    const handleAcademicYearChange = (event: Event) => {
      const year = (event as CustomEvent<string>).detail;
      if (year) setAcademicYear(year);
      void loadAnalytics();
    };
    window.addEventListener("academic-year-change", handleAcademicYearChange);
    return () => window.removeEventListener("academic-year-change", handleAcademicYearChange);
  }, [loadAnalytics]);

  const paidOrders = useMemo(() => orders.filter((order) => order.ispaid), [orders]);
  const averageOrderValue = paidOrders.length ? paidOrders.reduce((total, order) => total + order.totalAmount, 0) / paidOrders.length : 0;
  const categoryRanking = useMemo(() => [...categories].sort((a, b) => (b._count?.Product ?? 0) - (a._count?.Product ?? 0)).slice(0, 6), [categories]);
  const categoryColors = ["bg-violet-500", "bg-blue-500", "bg-cyan-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  const categoryDonut = useMemo(() => {
    const total = categoryRanking.reduce((sum, category) => sum + (category._count?.Product ?? 0), 0);
    if (!total) return "#e2e8f0";
    let cursor = 0;
    const colors = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];
    return `conic-gradient(${categoryRanking.map((category, index) => {
      const start = cursor;
      cursor += ((category._count?.Product ?? 0) / total) * 100;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    }).join(", ")})`;
  }, [categoryRanking]);
  const categoryAverages = useMemo(() => {
    const totals = new Map<string, { amount: number; orders: Set<string> }>();
    for (const order of paidOrders) {
      for (const rawItem of order.items ?? []) {
        if (!rawItem || typeof rawItem !== "object") continue;
        const item = rawItem as AnalyticsOrderItem;
        const categoryId = item.product?.categoryId;
        const price = Number(item.product?.price);
        const quantity = Number(item.quantity ?? item.quanity ?? 1);
        if (!categoryId || !Number.isFinite(price) || !Number.isFinite(quantity)) continue;
        const bucket = totals.get(categoryId) ?? { amount: 0, orders: new Set<string>() };
        bucket.amount += price * quantity;
        bucket.orders.add(order.id);
        totals.set(categoryId, bucket);
      }
    }
    return categories.map((category) => ({ name: category.name, amount: (totals.get(category.id)?.amount ?? 0) / (totals.get(category.id)?.orders.size || 1) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [categories, paidOrders]);
  const maxCategoryAverage = Math.max(...categoryAverages.map((item) => item.amount), 1);
  const shipmentMonths = useMemo(() => {
    const startYear = Number(academicYear.split("/")[0].trim());
    const months = Array.from({ length: 12 }, (_, offset) => {
      const date = new Date(startYear, 8 + offset, 1);
      return { label: date.toLocaleString(undefined, { month: "short" }), key: `${date.getFullYear()}-${date.getMonth()}`, sent: 0, inTransit: 0, delivered: 0 };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));
    for (const order of orders) {
      const date = new Date(order.createdAt);
      const bucket = byMonth.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (!bucket) continue;
      const status = (order.status ?? "pending").toLowerCase();
      if (["delivered", "complete", "completed"].includes(status)) bucket.delivered += 1;
      else if (["shipping", "on the way", "in_transit", "processing"].includes(status)) bucket.inTransit += 1;
      else bucket.sent += 1;
    }
    return months;
  }, [orders, academicYear]);

  return <main className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-500">Dashboard / Analytics</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Analytics</h1><p className="mt-1 text-sm text-slate-500">Store performance and order activity</p></div><p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">Last 7 days</p></header>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadAnalytics()} className="font-semibold underline">Retry</button></div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} detail="From paid orders" icon={CircleDollarSign} color="bg-blue-50 text-blue-700" />
      <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} detail="Orders in your store" icon={ShoppingBag} color="bg-violet-50 text-violet-700" />
      <StatCard title="Products" value={stats.totalProducts.toLocaleString()} detail="Products in catalog" icon={Boxes} color="bg-cyan-50 text-cyan-700" />
      <StatCard title="Customers" value={stats.totalUsers.toLocaleString()} detail="Registered accounts" icon={Users} color="bg-amber-50 text-amber-700" />
      <StatCard title="Categories" value={stats.totalCategories.toLocaleString()} detail="Product categories" icon={PackageCheck} color="bg-rose-50 text-rose-700" />
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Sales</h2><p className="mt-1 text-xs text-slate-500">Paid revenue by month for {academicYear}</p></div><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">{academicYear}</span></div>{isLoading ? <div className="flex h-56 items-center justify-center text-sm text-slate-400"><Activity className="mr-2 size-4 animate-pulse" />Loading...</div> : <RevenueChart data={stats.weeklyRevenue} />}</article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Shipment</h2><p className="mt-1 text-xs text-slate-500">Orders grouped by month and status</p></div><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">All orders</span></div><ShipmentChart data={shipmentMonths} /></article>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Popular Categories</h2><p className="mt-1 text-xs text-slate-500">Share of products by category</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">{categories.length} categories</span></div><div className="mt-5 flex items-center gap-4">{categoryRanking.length ? <><div className="relative size-32 shrink-0 rounded-full" style={{ background: categoryDonut }}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><b className="text-xl text-slate-900">{stats.totalProducts}</b><span className="text-[10px] text-slate-400">Products</span></div></div><div className="min-w-0 flex-1 space-y-2">{categoryRanking.map((category, index) => <div key={category.id} className="flex items-center gap-2 text-[11px]"><i className={cn("size-2 shrink-0 rounded-full", categoryColors[index % categoryColors.length])} /><span className="min-w-0 flex-1 truncate text-slate-600">{category.name}</span><span className="shrink-0 font-medium text-slate-700">{category._count?.Product ?? 0}</span></div>)}</div></> : <p className="w-full py-10 text-center text-sm text-slate-400">No categories yet</p>}</div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Avg. Check</h2><p className="mt-1 text-xs text-slate-500">Average paid order amount by category</p></div><CircleDollarSign className="size-5 text-blue-600" /></div><div className="mt-5 space-y-3">{categoryAverages.length ? categoryAverages.map((item, index) => <div key={item.name}><div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="truncate text-slate-600">{item.name}</span><span className="shrink-0 font-medium text-slate-800">${item.amount.toFixed(2)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className={cn("h-full rounded-full", categoryColors[index % categoryColors.length])} style={{ width: `${Math.max((item.amount / maxCategoryAverage) * 100, 3)}%` }} /></div></div>) : <p className="py-8 text-center text-xs text-slate-400">Order items by category are unavailable.</p>}</div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Avg. Delivery Time</h2><p className="mt-1 text-xs text-slate-500">Time from order to delivery</p></div><Clock3 className="size-5 text-amber-600" /></div><div className="relative mt-5 flex h-24 items-end justify-around border-b border-slate-100 px-3">{[42, 68, 51, 82, 59, 73].map((height, index) => <div key={index} className="w-5 rounded-t-md bg-gradient-to-t from-amber-200 to-rose-300 opacity-70" style={{ height: `${height}%` }} />)}<div className="absolute inset-0 flex items-center justify-center"><span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-center text-[10px] font-medium text-slate-600">Delivery timestamps are not stored</span></div></div><p className="mt-4 text-[11px] text-slate-400">Add dispatch and delivery dates to calculate real averages.</p></article>
    </section>

    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Map</h2><p className="mt-1 text-xs text-slate-500">Customer order locations</p></div><span className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500"><MapPin className="size-3.5" />Store locations</span></div><div className="relative mt-4 h-48 overflow-hidden rounded-xl border border-slate-100 bg-[#f3f6f5]"><svg viewBox="0 0 1200 240" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true"><path d="M-30 40 270 120 570 75 830 155 1230 50M-20 210 260 120 490 220 780 120 1220 190M160-20 270 120 230 270M570-10 570 75 490 220M870-20 830 155 900 270M1080-20 1030 95 1220 190" fill="none" stroke="white" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/><path d="M-30 40 270 120 570 75 830 155 1230 50M-20 210 260 120 490 220 780 120 1220 190M160-20 270 120 230 270M570-10 570 75 490 220M870-20 830 155 900 270M1080-20 1030 95 1220 190" fill="none" stroke="#dce5e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M80 0 180 240M390 0 360 240M700 0 650 240M1000 0 1120 240" fill="none" stroke="#e7eeec" strokeWidth="1" strokeDasharray="5 7"/></svg><div className="absolute inset-0 flex items-center justify-center"><span className="flex items-center gap-2 rounded-full border border-white bg-white/95 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm"><MapPin className="size-4 text-slate-400" />Customer address data is not available</span></div></div></article>
  </main>;
}
