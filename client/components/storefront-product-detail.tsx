"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
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
type Payload<T> = { result?: T; message?: string };
const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export default function StorefrontProductDetail({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase}/product/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!(response.headers.get("content-type") ?? "").includes("application/json")) throw new Error("Product API-ga lama heli karo.");
        const payload = await response.json() as Payload<Product>;
        if (!response.ok || !payload.result) throw new Error(payload.message ?? "Product-kan lama helin.");
        if (!cancelled) setProduct(payload.result);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Product lama soo shubi karin."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <main className="min-h-[70vh] bg-white px-5 py-12"><div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2"><div className="h-[480px] animate-pulse rounded-2xl bg-slate-100"/><div className="h-80 animate-pulse rounded-2xl bg-slate-100"/></div></main>;
  if (error || !product) return <main className="min-h-[60vh] bg-white px-5 py-16 text-center"><p className="text-sm text-rose-600">{error || "Product-kan lama helin."}</p><Link href="/product" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><ArrowLeft className="size-4"/>Back to products</Link></main>;

  return <main className="min-h-[75vh] bg-white px-4 py-8 sm:px-6 lg:px-10 lg:py-14">
    <div className="mx-auto max-w-[1600px]">
      <Link href="/product" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"><ArrowLeft className="size-4"/>Back to products</Link>
      <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-6 sm:min-h-[540px] sm:p-10"><img src={product.imageUrl || "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85"} alt={product.name} className="max-h-[500px] w-full object-contain"/></div>
        <div className="flex flex-col justify-center py-2 sm:py-6">
          <p className="text-sm font-medium capitalize text-slate-500">{product.category?.name ?? "Product"}</p>
          <h1 className="mt-2 text-3xl font-bold capitalize tracking-tight text-slate-950 sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-1 text-slate-300" aria-label="No reviews yet">{Array.from({ length: 5 }, (_, index) => <Star key={index} className="size-5"/>)}<span className="ml-2 text-sm text-slate-600">0 (0 reviews)</span></div>
          <p className="mt-6 text-2xl font-semibold text-slate-950">${Number(product.price).toFixed(2)}</p>
          <p className="mt-5 text-lg leading-7 text-slate-600">{product.description || product.name}</p>
          <p className={`mt-5 text-sm font-medium ${product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>{product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}</p>
          <button type="button" disabled={product.quantity < 1} onClick={() => addStoreCartItem(product)} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingCart className="size-5"/>Add to cart</button>
          <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-center text-sm"><span className="rounded-md bg-white py-2 font-medium text-slate-900">Description</span><span className="py-2 text-slate-500">Reviews</span></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{product.description || "No additional description is available for this product."}</p>
        </div>
      </section>
    </div>
  </main>;
}
