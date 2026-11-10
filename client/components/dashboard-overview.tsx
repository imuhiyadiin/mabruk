"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Download, LoaderCircle, MapPin, MousePointer2, Package, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type RevenuePoint = { label: string; total: number };
type Stats = { totalUsers: number; totalProducts: number; totalOrders: number; totalRevenue: number; weeklyRevenue: RevenuePoint[] };
type Product = { id: string; name: string; price: number; quantity: number; imageUrl?: string; createdAt?: string; category?: { id: string; name: string } };
type OrderItem = { productName?: string; quantity?: number; quanity?: number; product?: { name?: string } };
type Order = { id: string; totalAmount: number; status?: string; createdAt: string; user?: { fullname?: string; email?: string }; items?: unknown[] };
type Payload<T> = { result?: T; message?: string };

const api = "/api";
const colors = ["#f59e0b", "#f97316", "#d1d5db", "#9ca3af", "#27272a", "#facc15"];

async function readPayload<T>(response: Response, endpoint: string): Promise<Payload<T>> {
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
    throw new Error(`${endpoint} API-ga lama helin (HTTP ${response.status}). Hubi in backend-ku socdo iyo API URL-ku sax yahay.`);
  }
  return response.json() as Promise<Payload<T>>;
}

function itemList(order: Order): OrderItem[] {
  return (order.items ?? []).filter((item): item is OrderItem => !!item && typeof item === "object");
}

function Sparkline({ data, color = "#f59e0b" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const hasVariation = data.length > 1 && Math.max(...data) !== Math.min(...data);
  const points = hasVariation
    ? data.map((value, i) => `${i * (100 / (data.length - 1))},${28 - value / max * 24}`).join(" ")
    : "4,26 18,23 32,27 47,14 60,18 74,8 86,12 97,4";
  return <svg viewBox="0 0 100 32" className="h-12 w-24 overflow-visible" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((point) => point.total), 1);
  const points = data.map((point, i) => `${32 + i * (736 / Math.max(data.length - 1, 1))},${176 - point.total / max * 126}`).join(" ");
  return <div className="mt-3"><div className="flex justify-between text-[10px] text-slate-400"><span>${max.toLocaleString()}</span><span>${Math.round(max / 2).toLocaleString()}</span><span>$0</span></div><svg viewBox="0 0 800 205" className="mt-1 h-48 w-full" role="img" aria-label="Revenue chart">
    {[30, 78, 126, 176].map((y) => <line key={y} x1="28" x2="790" y1={y} y2={y} stroke="#edf0f2" strokeDasharray="4 5" />)}
    {data.length > 0 && <><polygon points={`32,176 ${points} 768,176`} fill="url(#overviewFill)"/><polyline points={points} fill="none" stroke="#f2a51a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{data.map((point, i) => {const x = 32 + i * (736 / Math.max(data.length - 1, 1)); const y = 176 - point.total / max * 126; return <circle key={point.label} cx={x} cy={y} r="4" fill="#fff" stroke="#f2a51a" strokeWidth="2"/>;})}</>}
    <defs><linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f2a51a" stopOpacity=".28"/><stop offset="1" stopColor="#f2a51a" stopOpacity="0"/></linearGradient></defs>
  </svg><div className="flex justify-between px-2 text-[10px] text-slate-500">{data.map((point) => <span key={point.label}>{point.label}</span>)}</div></div>;
}

function DashboardCard({ title, value, note, icon: Icon, dark = false, data }: { title: string; value: string; note: string; icon: typeof Package; dark?: boolean; data: number[] }) {
  return <article className={cn("rounded-2xl border p-4 shadow-sm", dark ? "border-zinc-900 bg-zinc-900 text-white" : "border-slate-100 bg-white text-slate-900")}><div className="flex items-center justify-between"><span className={cn("flex size-9 items-center justify-center rounded-xl", dark ? "bg-amber-400/15 text-amber-400" : "bg-orange-50 text-orange-600")}><Icon className="size-4"/></span><Sparkline data={data}/></div><p className={cn("mt-4 text-xs", dark ? "text-zinc-400" : "text-slate-500")}>{title}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className={cn("mt-1 flex items-center gap-1 text-[11px]", dark ? "text-emerald-300" : "text-emerald-600")}><ArrowUpRight className="size-3"/>{note}</p></article>;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0, weeklyRevenue: [] });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [academicYear, setAcademicYear] = useState("2026 / 2027");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const saved = window.localStorage.getItem("user-data");
      let token = "";
      try { token = saved ? (JSON.parse(saved) as { access_token?: string }).access_token ?? "" : ""; } catch { token = ""; }
      if (!token) throw new Error("Fadlan ku gal akoon admin ah si aad u aragto dashboard-ka.");
      const headers = { Authorization: `Bearer ${token}` };
      const year = window.localStorage.getItem("academic-year") ?? "2026 / 2027";
      setAcademicYear(year);
      const yearQuery = `?academicYear=${encodeURIComponent(year)}`;
      const [s, o, p] = await Promise.all([fetch(`${api}/admin/stats${yearQuery}`, { headers, cache: "no-store" }), fetch(`${api}/admin/orders${yearQuery}`, { headers, cache: "no-store" }), fetch(`${api}/product`, { cache: "no-store" })]);
      const [sp, op, pp] = await Promise.all([readPayload<Stats>(s, "/admin/stats"), readPayload<Order[]>(o, "/admin/orders"), readPayload<Product[]>(p, "/product")]);
      if (!s.ok || !sp.result || !o.ok || !Array.isArray(op.result) || !p.ok || !Array.isArray(pp.result)) throw new Error(sp.message ?? op.message ?? pp.message ?? "Dashboard data lama soo shubi karin.");
      setStats(sp.result); setOrders(op.result); setProducts(pp.result);
    } catch (err) { setError(err instanceof Error ? err.message : "Server-ka lama heli karo."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const handleAcademicYearChange = (event: Event) => {
      const year = (event as CustomEvent<string>).detail;
      if (year) setAcademicYear(year);
      void load();
    };
    window.addEventListener("academic-year-change", handleAcademicYearChange);
    return () => window.removeEventListener("academic-year-change", handleAcademicYearChange);
  }, [load]);

  const [startYear, endYear] = academicYear.split("/").map((part) => Number(part.trim()));
  const academicStart = new Date(Date.UTC(startYear, 8, 1)).getTime();
  const academicEnd = new Date(Date.UTC(endYear, 8, 1)).getTime();
  const academicProducts = products.filter((product) => {
    if (!product.createdAt) return true;
    const createdAt = new Date(product.createdAt).getTime();
    return createdAt >= academicStart && createdAt < academicEnd;
  });

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    academicProducts.forEach((product) => { const name = product.category?.name ?? "Other"; counts.set(name, (counts.get(name) ?? 0) + 1); });
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [academicProducts]);
  const categoryTotal = categoryData.reduce((sum, [, count]) => sum + count, 0);
  const donut = useMemo(() => { let cursor = 0; return `conic-gradient(${categoryData.map(([, count], i) => { const start = cursor; cursor += count / Math.max(categoryTotal, 1) * 100; return `${colors[i % colors.length]} ${start}% ${cursor}%`; }).join(", ")})`; }, [categoryData, categoryTotal]);
  const bestSellers = useMemo(() => { const counts = new Map<string, { name: string; qty: number; revenue: number; image?: string }>(); for (const order of orders) for (const item of itemList(order)) { const name = item.product?.name ?? item.productName ?? "Product"; const qty = Number(item.quantity ?? item.quanity ?? 1); const product = products.find((entry) => entry.name === name); const current = counts.get(name) ?? { name, qty: 0, revenue: 0, image: product?.imageUrl }; current.qty += qty; current.revenue += qty * (product?.price ?? 0); counts.set(name, current); } return [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 4); }, [orders, products]);
  const monthlySeries = stats.weeklyRevenue ?? [];
  const exportReport = () => { const rows = [["Metric", "Value"], ["Revenue", stats.totalRevenue], ["Orders", stats.totalOrders], ["Customers", stats.totalUsers], ["Products", stats.totalProducts]]; const csv = rows.map((row) => row.join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const link = document.createElement("a"); link.href = url; link.download = "sales-dashboard-report.csv"; link.click(); URL.revokeObjectURL(url); };

  return <main className="min-w-0 space-y-5 bg-[#f7f7f6] p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Sales Dashboard</h1><p className="mt-1 text-sm text-slate-500">Track your business performance and growth in real time.</p></div><button type="button" onClick={exportReport} className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-amber-300 shadow-sm hover:bg-zinc-800"><Download className="size-4"/>Create Report</button></header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button onClick={() => void load()} className="font-semibold underline">Retry</button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} note="From paid orders" icon={BarChart3} dark data={monthlySeries.map((point) => point.total)}/>
      <DashboardCard title="Total Orders" value={stats.totalOrders.toLocaleString()} note="All store orders" icon={ShoppingCart} data={monthlySeries.map((point) => point.total)}/>
      <DashboardCard title="New Customers" value={stats.totalUsers.toLocaleString()} note="Registered accounts" icon={Users} data={monthlySeries.map((point) => point.total)}/>
      <DashboardCard title="Conversion Rate" value="—" note="Visit tracking not connected" icon={MousePointer2} data={monthlySeries.map((point) => point.total)}/>
    </section>

    <section className="grid gap-4 xl:grid-cols-5">
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Revenue Overview</h2><p className="mt-1 text-xs text-slate-500">Paid revenue by month for {academicYear}</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-medium text-orange-700"><CalendarDays className="size-3.5"/>{academicYear}</span></div>{loading ? <div className="flex h-56 items-center justify-center text-sm text-slate-400"><LoaderCircle className="mr-2 size-4 animate-spin"/>Loading...</div> : <RevenueChart data={monthlySeries}/>}</article>
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Sales by Category</h2><p className="mt-1 text-xs text-slate-500">Products currently in catalog</p></div><Package className="size-5 text-slate-500"/></div><div className="mt-5 flex flex-wrap items-center justify-center gap-5 sm:justify-between"><div className="relative size-40 shrink-0 rounded-full" style={{ background: categoryTotal ? donut : "#e5e7eb" }}><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white"><b className="text-2xl text-slate-900">{categoryTotal}</b><span className="text-[10px] text-slate-500">Products</span></div></div><div className="min-w-32 flex-1 space-y-3">{categoryData.length ? categoryData.map(([name, count], i) => <div key={name} className="flex items-center gap-2 text-[11px]"><i className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}/><span className="min-w-0 flex-1 truncate text-slate-600">{name}</span><b className="text-slate-800">{Math.round(count / categoryTotal * 100)}%</b></div>) : <p className="text-xs text-slate-400">No category data</p>}</div></div></article>
    </section>

    <section className="grid gap-4 xl:grid-cols-3">
      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-semibold text-slate-900">Top Selling Products</h2><a href="/dashbordmain/product" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900">View all <ArrowRight className="size-3"/></a></div><div className="grid grid-cols-[minmax(0,1fr)_48px_72px] gap-2 bg-slate-50 px-4 py-2 text-[10px] text-slate-500"><span>Product</span><span>Orders</span><span>Revenue</span></div>{bestSellers.length ? bestSellers.map((item) => <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_48px_72px] items-center gap-2 border-t border-slate-50 px-4 py-3 text-[11px]"><span className="flex min-w-0 items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">{item.image ? <img src={item.image} alt="" className="size-full object-cover"/> : <Package className="size-3.5 text-slate-400"/>}</span><span className="truncate font-medium text-slate-700">{item.name}</span></span><span className="text-slate-500">{item.qty}</span><span className="font-medium text-slate-800">${item.revenue.toFixed(0)}</span></div>) : <p className="px-4 py-8 text-center text-xs text-slate-400">{loading ? "Loading products..." : "No sales recorded yet"}</p>}</article>
      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2><a href="/dashbordmain/order" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900">View all <ArrowRight className="size-3"/></a></div>{orders.slice(0, 4).map((order) => <div key={order.id} className="flex items-center justify-between gap-2 border-t border-slate-50 px-4 py-3"><div className="flex min-w-0 items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[10px] font-semibold text-orange-700">{(order.user?.fullname ?? "C").split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</span><span className="min-w-0"><b className="block truncate text-[11px] font-medium text-slate-800">{order.user?.fullname ?? "Customer"}</b><span className="block truncate text-[10px] text-slate-400">#{order.id.slice(-6)}</span></span></div><div className="text-right"><b className="block text-[11px] text-slate-800">${order.totalAmount.toFixed(2)}</b><span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium", (order.status ?? "pending").toLowerCase().includes("deliver") ? "bg-emerald-50 text-emerald-700" : (order.status ?? "pending").toLowerCase().includes("process") ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>{order.status ?? "Pending"}</span></div></div>)}{!orders.length && <p className="px-4 py-8 text-center text-xs text-slate-400">{loading ? "Loading orders..." : "No recent orders"}</p>}</article>
      <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between px-4 py-4"><h2 className="text-sm font-semibold text-slate-900">Customers by Location</h2><MapPin className="size-4 text-slate-500"/></div><div className="relative mx-3 mb-3 h-52 overflow-hidden rounded-xl bg-[#f4f5f3]"><svg viewBox="0 0 500 260" className="absolute inset-0 size-full" aria-hidden="true"><path d="m40 70 30-35 48-8 25 24 49-7 30 23-9 30 20 17-13 26-28 7-7 30-32 7-19-21-28-5-14-28-34-5-20-24-29-7Zm164-26 30-25 34 8 21 20 44 8 20 26-24 21-33-8-17 18-31-9-14-22-33-8Zm101 80 29-20 43 9 18 28-13 23-33 4-31-17Zm42-67 31-31 42 3 23 19-8 26-36 8-23-11Z" fill="#dce1dd"/><path d="m40 70 30-35 48-8 25 24 49-7 30 23-9 30 20 17-13 26-28 7-7 30-32 7-19-21-28-5-14-28-34-5-20-24-29-7Z" fill="#f5b53d" opacity=".9"/></svg><div className="absolute bottom-4 left-4 rounded-lg bg-zinc-900 px-3 py-2 text-white shadow"><span className="block text-[10px] font-semibold">Customer locations</span><span className="mt-0.5 block text-[9px] text-zinc-300">Address data not collected</span></div><div className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-500"><MapPin className="size-4"/></div></div><p className="px-4 pb-3 text-[10px] text-slate-400">Location breakdown will appear when customer addresses are available.</p></article>
    </section>
  </main>;
}
