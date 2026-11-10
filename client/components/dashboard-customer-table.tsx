"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CircleDollarSign, LoaderCircle, PackageSearch, Search, ShoppingBag, Users } from "lucide-react";

type Customer = { id?: string; fullname?: string | null; email?: string | null; role?: string | null };
type OrderRecord = {
  id: string;
  totalAmount: number;
  createdAt: string;
  user?: Customer | null;
  Payment?: { user?: Customer | null }[];
};
type OrderResponse = { message?: string; result?: OrderRecord[] };
type CustomerSummary = Customer & { orderCount: number; totalSpent: number; lastOrder: string };

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
}

function getCustomer(order: OrderRecord) {
  return order.user ?? order.Payment?.find((payment) => payment.user)?.user ?? null;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
}

export default function DashboardCustomerTable() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const storedUser = window.localStorage.getItem("user-data");
      const accessToken = storedUser ? (JSON.parse(storedUser) as { access_token?: string }).access_token : "";
      if (!accessToken) throw new Error("Fadlan ku gal akoon admin ah si aad u aragto macaamiisha.");
      const year = window.localStorage.getItem("academic-year") ?? "2026 / 2027";
      const response = await fetch(`${getApiBase()}/admin/orders?academicYear=${encodeURIComponent(year)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = (await response.json()) as OrderResponse;
      if (!response.ok || !Array.isArray(payload.result)) throw new Error(payload.message ?? "Xogta macaamiisha lama soo shubi karin.");
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

  const customers = useMemo(() => {
    const byCustomer = new Map<string, CustomerSummary>();
    for (const order of orders) {
      const customer = getCustomer(order);
      if (!customer || customer.role?.toUpperCase() === "ADMIN") continue;
      const key = customer.id ?? customer.email?.toLowerCase() ?? customer.fullname?.toLowerCase();
      if (!key) continue;
      const existing = byCustomer.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += Number(order.totalAmount) || 0;
        if (new Date(order.createdAt).getTime() > new Date(existing.lastOrder).getTime()) existing.lastOrder = order.createdAt;
      } else {
        byCustomer.set(key, {
          ...customer,
          orderCount: 1,
          totalSpent: Number(order.totalAmount) || 0,
          lastOrder: order.createdAt,
        });
      }
    }
    return [...byCustomer.values()].sort((a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => `${customer.fullname ?? ""} ${customer.email ?? ""}`.toLowerCase().includes(query));
  }, [customers, search]);

  const totalSales = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-slate-500">Dashboard / Customers</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Customers with orders in the selected academic year</p>
        </div>
        <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
          <Search className="size-4 shrink-0" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
        </label>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Customers" value={String(customers.length)} icon={<Users className="size-5" />} />
        <SummaryCard title="Orders" value={String(totalOrders)} icon={<ShoppingBag className="size-5" />} />
        <SummaryCard title="Total sales" value={formatMoney(totalSales)} icon={<CircleDollarSign className="size-5" />} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Customers</h2>
            <p className="mt-0.5 text-sm text-slate-500">{filteredCustomers.length} customers found</p>
          </div>
        </div>

        {error && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadOrders()} className="font-semibold underline">Retry</button></div>}

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
            <thead><tr className="bg-violet-50 text-violet-950">
              {["Customer", "Email", "Orders", "Total spent", "Last order"].map((heading, index) => <th key={heading} className={`px-4 py-3 text-xs font-semibold ${index === 0 ? "rounded-l-lg" : ""} ${index === 4 ? "rounded-r-lg" : ""}`}>{heading}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="py-14 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline size-4 animate-spin" />Loading customers...</td></tr>
                : filteredCustomers.length === 0 ? <tr><td colSpan={5} className="py-16 text-center"><PackageSearch className="mx-auto size-7 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">No customers found</p><p className="mt-1 text-xs text-slate-500">Customers appear here after they place an order.</p></td></tr>
                  : filteredCustomers.map((customer, index) => {
                    const name = customer.fullname?.trim() || "Customer";
                    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                    return <tr key={customer.id ?? customer.email ?? `${name}-${index}`} className="bg-white text-slate-700 shadow-[0_0_0_1px_#e2e8f0] transition-colors hover:bg-violet-50/70">
                      <td className="rounded-l-lg px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">{initials || "C"}</span><span className="font-medium text-slate-900">{name}</span></div></td>
                      <td className="px-4 py-3 text-slate-500">{customer.email || "—"}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{customer.orderCount}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{formatMoney(customer.totalSpent)}</td>
                      <td className="whitespace-nowrap rounded-r-lg px-4 py-3 text-slate-500">{new Date(customer.lastOrder).toLocaleDateString()}</td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700">{icon}</span></div>;
}
