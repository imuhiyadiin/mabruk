"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getStoreCart, type StoreCartItem } from "@/lib/store-cart";

export default function CheckoutPage() {
  const [items, setItems] = useState<StoreCartItem[]>([]);

  useEffect(() => {
    setItems(getStoreCart());
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl bg-white p-6 sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"><ArrowLeft className="size-4" /> Continue shopping</Link>
        <div className="mt-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-[#a88a25]"><ShoppingBag className="size-5" /></span>
          <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Order review</p><h1 className="text-2xl font-semibold text-zinc-900">Checkout</h1></div>
        </div>

        {items.length ? <>
          <div className="mt-7 divide-y divide-zinc-100 border-y border-zinc-100">
            {items.map((item) => <div key={item.productId} className="flex items-center gap-4 py-4">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">{item.imageUrl && <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-zinc-900">{item.name}</p><p className="mt-1 text-xs text-zinc-500">${item.price.toFixed(2)} × {item.quantity}</p></div>
              <p className="text-sm font-semibold text-zinc-900">${(item.price * item.quantity).toFixed(2)}</p>
            </div>)}
          </div>
          <div className="flex justify-between py-5"><span className="font-medium text-zinc-600">Total</span><span className="text-lg font-semibold text-zinc-900">${total.toFixed(2)}</span></div>
          <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">Your order is ready for checkout. Contact and payment details can be completed in the next step.</p>
        </> : <div className="py-12 text-center"><ShoppingBag className="mx-auto size-9 text-zinc-300" /><p className="mt-3 text-sm text-zinc-600">Your cart is empty.</p><Link href="/product" className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#c7a331] px-5 text-sm font-semibold text-white hover:bg-[#ad8d20]">Browse products</Link></div>}
      </section>
    </main>
  );
}
