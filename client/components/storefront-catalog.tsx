"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, Sparkles } from "lucide-react";
import { addStoreCartItem } from "@/lib/store-cart";

type StoreProduct = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  category?: { id?: string; name?: string } | null;
};
type StoreCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  Product?: StoreProduct[];
};
type Payload<T> = { result?: T };

const apiBase = "/api";
const categoryFallbacks = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1508156572707-9b46b8ebd5c4?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80",
];

export default function StorefrontCatalog() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch(`${apiBase}/category`, { cache: "no-store" }), fetch(`${apiBase}/product`, { cache: "no-store" })])
      .then(async ([categoryResponse, productResponse]) => {
        if (!categoryResponse.ok || !productResponse.ok) return null;
        const [categoryPayload, productPayload] = await Promise.all([
          categoryResponse.json() as Promise<Payload<StoreCategory[]>>,
          productResponse.json() as Promise<Payload<StoreProduct[]>>,
        ]);
        if (Array.isArray(categoryPayload.result) && Array.isArray(productPayload.result)) return [categoryPayload.result, productPayload.result] as const;
        return null;
      })
      .then((data) => { if (!cancelled && data) { setCategories(data[0]); setProducts(data[1]); } })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const pendingCategory = window.sessionStorage.getItem("storefront-category");
    if (pendingCategory) {
      setSelectedCategory(pendingCategory);
      window.sessionStorage.removeItem("storefront-category");
      window.setTimeout(() => document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
    const handleCategorySelect = (event: Event) => {
      const categoryId = (event as CustomEvent<string>).detail;
      setSelectedCategory(categoryId);
      window.setTimeout(() => document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };
    window.addEventListener("store-category-select", handleCategorySelect);
    return () => window.removeEventListener("store-category-select", handleCategorySelect);
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = selectedCategory ? products.filter((product) => product.category?.id === selectedCategory) : products;
    return filtered.slice(0, showAllProducts ? 100 : 4);
  }, [products, selectedCategory, showAllProducts]);

  function chooseCategory(category: StoreCategory) {
    setSelectedCategory((current) => current === category.id ? null : category.id);
    window.setTimeout(() => document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return <>
    <section className="bg-[#f7f8fa] px-4 py-12 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-[1490px]">
        <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b08c20]">Browse the store</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Popular Categories</h2></div>{selectedCategory && <button type="button" onClick={() => setSelectedCategory(null)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Clear filter</button>}</div>
        {isLoading ? <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
          : categories.length ? <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{categories.slice(0, 10).map((category, index) => {
            const image = category.imageUrl || category.Product?.find((product) => product.imageUrl)?.imageUrl || categoryFallbacks[index % categoryFallbacks.length];
            const count = category.Product?.length ?? products.filter((product) => product.category?.id === category.id).length;
            const active = selectedCategory === category.id;
            return <button key={category.id} type="button" onClick={() => chooseCategory(category)} aria-pressed={active} className={`group flex min-h-52 flex-col items-center rounded-xl border bg-white px-5 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
              <span className="flex size-24 items-center justify-center overflow-hidden rounded-xl bg-slate-50"><img src={image} alt="" loading="lazy" className="size-full object-contain transition-transform duration-300 group-hover:scale-105" /></span>
              <span className="mt-4 line-clamp-1 text-sm font-semibold capitalize text-slate-900">{category.name}</span>
              <span className="mt-1 text-sm text-slate-500">{count} {count === 1 ? "product" : "products"}</span>
            </button>;
          })}</div> : <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">Categories will appear here as they are added to the store.</p>}
      </div>
    </section>

    <section id="best-offers" className="scroll-mt-8 bg-white px-4 py-12 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-[1490px]">
        <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b08c20]">Picked for you</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{selectedCategory ? `${categories.find((category) => category.id === selectedCategory)?.name ?? "Category"} Products` : "The Best Offers"}</h2></div>{products.length > 4 && <button type="button" onClick={() => setShowAllProducts((current) => !current)} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">{showAllProducts ? "Show fewer" : "More Products"} <ArrowRight className="size-4" /></button>}</div>
        {isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[430px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />)}</div>
          : visibleProducts.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visibleProducts.map((product) => <article key={product.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <Link href={`/product/${encodeURIComponent(product.slug ?? product.id)}`} aria-label={`View ${product.name}`} className="flex h-64 items-center justify-center overflow-hidden bg-slate-50 p-4"><img src={product.imageUrl || categoryFallbacks[0]} alt={product.name} loading="lazy" className="size-full object-contain transition-transform duration-500 group-hover:scale-105" /></Link>
            <div className="p-5"><Link href={`/product/${encodeURIComponent(product.slug ?? product.id)}`}><h3 className="truncate text-base font-bold uppercase text-slate-900">{product.name}</h3></Link><p className="mt-1 text-sm text-slate-500">{product.category?.name ?? "Electronics"}</p><div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700"><Sparkles className="size-3" />Featured</div><p className={`mt-2 text-xs font-medium ${product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{product.quantity > 0 ? "● In stock" : "● Out of stock"}</p><p className="mt-4 text-xl font-bold text-slate-950">${Number(product.price).toFixed(2)}</p><button type="button" disabled={product.quantity < 1} onClick={() => addStoreCartItem(product)} className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Package className="mr-2 size-4" />Add To Cart</button></div>
          </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center"><Package className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">{selectedCategory ? "No products in this category yet." : "Products will appear here when they are added to the store."}</p>{selectedCategory && <button type="button" onClick={() => setSelectedCategory(null)} className="mt-3 text-sm font-semibold text-blue-600">Show all products</button>}</div>}
      </div>
    </section>
  </>;
}
