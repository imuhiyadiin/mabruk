"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Package } from "lucide-react";
import { addStoreCartItem } from "@/lib/store-cart";

type Product = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  description?: string | null;
  category?: { id?: string; name?: string } | null;
};
type Category = { id: string; name: string };
type Payload<T> = { result?: T };

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export default function StorefrontProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch(`${apiBase}/product`, { cache: "no-store" }), fetch(`${apiBase}/category`, { cache: "no-store" })])
      .then(async ([productResponse, categoryResponse]) => {
        if (!productResponse.ok || !categoryResponse.ok) throw new Error("Products lama soo shubi karin.");
        const [productPayload, categoryPayload] = await Promise.all([productResponse.json() as Promise<Payload<Product[]>>, categoryResponse.json() as Promise<Payload<Category[]>>]);
        if (!Array.isArray(productPayload.result) || !Array.isArray(categoryPayload.result)) throw new Error("Xogta products-ka ama categories-ka ma saxna.");
        if (!cancelled) { setProducts(productPayload.result); setCategories(categoryPayload.result); }
      })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Server-ka lama heli karo."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesSearch = !query || `${product.name} ${product.category?.name ?? ""}`.toLowerCase().includes(query);
      const matchesCategory = !selectedCategories.length || selectedCategories.includes(product.category?.id ?? "");
      return matchesSearch && matchesCategory && product.price <= maxPrice;
    });
    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest") result.sort((a, b) => b.id.localeCompare(a.id));
    else result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, selectedCategories, maxPrice, sortBy]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
  }

  return <main className="min-h-[70vh] bg-white px-4 py-8 sm:px-6 lg:px-10">
    <div className="mx-auto grid max-w-[1600px] gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
        <div className="flex items-center justify-between"><h1 className="text-xl font-semibold text-slate-950">Filters</h1>{(selectedCategories.length > 0 || search || maxPrice < 1500) && <button type="button" onClick={() => { setSelectedCategories([]); setSearch(""); setMaxPrice(1500); }} className="text-xs font-medium text-blue-600">Clear all</button>}</div>
        <div className="mt-8"><h2 className="font-semibold text-slate-900">Price Range</h2><input type="range" min="0" max="1500" step="10" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" className="mt-4 w-full accent-slate-900"/><div className="flex justify-between text-sm text-slate-600"><span>$0</span><span>${maxPrice}</span></div></div>
        <div className="mt-8"><h2 className="font-semibold text-slate-900">Categories</h2><div className="mt-3 space-y-3">{categories.map((category) => <label key={category.id} className="flex cursor-pointer items-center gap-3 text-sm capitalize text-slate-700"><input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleCategory(category.id)} className="size-4 rounded border-slate-300 accent-slate-900"/>{category.name}</label>)}</div>{!categories.length && !loading && <p className="mt-3 text-xs text-slate-400">No categories available.</p>}</div>
      </aside>

      <section className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><label className="flex h-11 w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-500 focus-within:border-slate-400"><Search className="size-4"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"/></label><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products" className="h-11 min-w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none"><option value="name">Name</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="newest">Newest</option></select></div>
        <div className="mb-4 text-sm text-slate-500">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found</div>
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-[460px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />)}</div>
          : filteredProducts.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <Link href={`/product/${encodeURIComponent(product.slug ?? product.id)}`} aria-label={`View ${product.name}`} className="flex h-60 w-full items-center justify-center overflow-hidden bg-slate-50 p-4"><img src={product.imageUrl || "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80"} alt={product.name} loading="lazy" className="size-full object-contain transition-transform duration-300 hover:scale-105"/></Link>
            <div className="p-5"><Link href={`/product/${encodeURIComponent(product.slug ?? product.id)}`} className="text-left"><h2 className="truncate text-base font-semibold text-slate-950">{product.name}</h2></Link><p className="mt-1 text-sm capitalize text-slate-500">{product.category?.name ?? "Uncategorized"}</p><p className={`mt-3 text-xs font-medium ${product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{product.quantity > 0 ? "● In stock" : "● Out of stock"}</p><p className="mt-4 text-xl font-bold text-slate-950">${Number(product.price).toFixed(2)}</p><div className="mt-4 flex flex-wrap gap-2"><Link href={`/product/${encodeURIComponent(product.slug ?? product.id)}`} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-semibold text-white transition hover:bg-zinc-700">View Details</Link><button type="button" disabled={product.quantity < 1} onClick={() => addStoreCartItem(product)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ShoppingCart className="size-4"/>Add to Cart</button></div></div>
          </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-14 text-center"><Package className="mx-auto size-9 text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-700">No products match these filters.</p><button type="button" onClick={() => { setSelectedCategories([]); setSearch(""); setMaxPrice(1500); }} className="mt-3 text-sm font-semibold text-blue-600">Clear filters</button></div>}
      </section>
    </div>
  </main>;
}
