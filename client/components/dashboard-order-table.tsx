"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, LoaderCircle, PackageSearch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderProduct = { name?: string; imageUrl?: string | null };
type OrderItem = {
  id?: string;
  quantity?: number;
  quanity?: number;
  productName?: string;
  product?: OrderProduct;
};
type OrderRecord = {
  id: string;
  totalAmount: number;
  createdAt: string;
  status?: string | null;
  ispaid?: boolean;
  items?: unknown[];
  user?: { fullname?: string; email?: string } | null;
  Payment?: { user?: { fullname?: string; email?: string } | null }[];
};
type OrderResponse = { message?: string; result?: OrderRecord[] };

const orderStatuses = ["All Orders", "Pending", "Processing", "Shipped", "Delivered"] as const;
type OrderStatus = (typeof orderStatuses)[number];

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
}

function getOrderItems(items: unknown[] = []): OrderItem[] {
  return items.filter((item): item is OrderItem => typeof item === "object" && item !== null);
}

function orderStatus(order: OrderRecord) {
  return order.status?.trim() || (order.ispaid ? "Paid" : "Pending");
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("deliver")) return "bg-emerald-50 text-emerald-700";
  if (normalized.includes("ship") || normalized.includes("way") || normalized.includes("process")) return "bg-amber-50 text-amber-700";
  if (normalized.includes("cancel")) return "bg-red-50 text-red-700";
  return "bg-violet-50 text-violet-700";
}

export default function DashboardOrderTable() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [status, setStatus] = useState<OrderStatus>("All Orders");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const storedUser = window.localStorage.getItem("user-data");
      const accessToken = storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token : "";
      if (!accessToken) throw new Error("Fadlan ku gal akoon admin ah si aad u aragto orders-ka.");
      const year = window.localStorage.getItem("academic-year") ?? "2026 / 2027";

      const response = await fetch(`${getApiBase()}/admin/orders?academicYear=${encodeURIComponent(year)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as OrderResponse;
      if (!response.ok || !Array.isArray(payload.result)) throw new Error(payload.message ?? "Orders-ka lama soo shubi karin.");
      setOrders(payload.result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Server-ka lama heli karo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    window.addEventListener("academic-year-change", loadOrders);
    return () => window.removeEventListener("academic-year-change", loadOrders);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const currentStatus = orderStatus(order).toLowerCase();
      const matchesStatus = status === "All Orders" || currentStatus.includes(status.toLowerCase());
      const matchesSearch = !query
        || order.id.toLowerCase().includes(query)
        || (order.user?.fullname ?? "").toLowerCase().includes(query)
        || (order.user?.email ?? "").toLowerCase().includes(query)
        || order.Payment?.some((payment) => (payment.user?.fullname ?? "").toLowerCase().includes(query) || (payment.user?.email ?? "").toLowerCase().includes(query))
        || getOrderItems(order.items).some((item) => (item.product?.name ?? item.productName ?? "").toLowerCase().includes(query));
      const created = new Date(order.createdAt).getTime();
      const matchesFrom = !fromDate || created >= new Date(`${fromDate}T00:00:00`).getTime();
      const matchesTo = !toDate || created <= new Date(`${toDate}T23:59:59.999`).getTime();
      return matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [orders, search, status, fromDate, toDate]);

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">{filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 pt-3">
          <nav aria-label="Order status filters" className="flex flex-wrap gap-5">
            {orderStatuses.map((item) => (
              <button key={item} type="button" onClick={() => setStatus(item)} className={cn("border-b-2 px-0.5 pb-3 text-sm transition-colors", status === item ? "border-violet-600 font-semibold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800")}>
                {item}{item === "All Orders" ? ` (${orders.length})` : ""}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-slate-400"><Search className="size-3.5" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders" className="w-32 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-2.5 text-xs text-violet-800"><CalendarDays className="size-3.5" /><input aria-label="Start date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-28 bg-transparent outline-none" /></label>
            <span className="text-slate-400">↔</span>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-2.5 text-xs text-violet-800"><input aria-label="End date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-28 bg-transparent outline-none" /></label>
          </div>
        </div>

        {error && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadOrders()} className="font-semibold underline">Retry</button></div>}

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[940px] border-separate border-spacing-y-2 text-left text-sm">
            <thead><tr className="bg-violet-50 text-violet-950">{["Order ID", "Customer", "Requested products", "Date", "Price", "Status"].map((heading, index) => <th key={heading} className={cn("px-4 py-3 text-xs font-semibold", index === 0 && "rounded-l-lg", index === 5 && "rounded-r-lg")}>{heading}</th>)}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6} className="py-14 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading orders...</td></tr>
                : filteredOrders.length === 0 ? <tr><td colSpan={6} className="py-16 text-center"><PackageSearch className="mx-auto size-7 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">No orders found</p><p className="mt-1 text-xs text-slate-500">Try changing the filters.</p></td></tr>
                  : filteredOrders.map((order) => {
                    const items = getOrderItems(order.items);
                    const currentStatus = orderStatus(order);
                    const customer = order.user ?? order.Payment?.find((payment) => payment.user)?.user;
                    return <tr key={order.id} className="bg-white text-slate-700 shadow-[0_0_0_1px_#e2e8f0] transition-colors hover:bg-violet-50/70">
                      <td className="rounded-l-lg px-4 py-3 font-medium text-slate-500">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3"><span className="block font-medium text-slate-900">{customer?.fullname ?? "Customer"}</span><span className="mt-0.5 block text-xs text-slate-500">{customer?.email ?? "—"}</span></td>
                      <td className="max-w-[300px] px-4 py-3">{items.length ? <div className="space-y-1">{items.map((item, index) => <p key={item.id ?? `${order.id}-${index}`} className="truncate"><span className="font-medium text-slate-800">{item.product?.name ?? item.productName ?? "Product"}</span><span className="ml-2 text-xs text-slate-500">× {item.quantity ?? item.quanity ?? 1}</span></p>)}</div> : <span className="text-slate-400">No item details</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">${order.totalAmount.toFixed(2)}</td>
                      <td className="rounded-r-lg px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClass(currentStatus))}>{currentStatus}</span></td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
