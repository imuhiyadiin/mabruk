"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Headphones, PackageCheck, Search, ShieldCheck, ShoppingCart, Sparkles, Truck } from "lucide-react";
import StorefrontCatalog from "@/components/storefront-catalog";

const collections = [
  {
    eyebrow: "MOBILES",
    title: "NEW SMARTPHONES",
    offer: "SALE UP TO 30% OFF",
    description: "Discover the latest phones and everyday tech.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Modern smartphone on a dark studio background",
    imagePosition: "center 48%",
  },
  {
    eyebrow: "AUDIO",
    title: "SOUND THAT MOVES YOU",
    offer: "WIRELESS AUDIO",
    description: "Bring every playlist to life with rich, clear sound.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Premium wireless headphones",
    imagePosition: "center 50%",
  },
  {
    eyebrow: "COMPUTING",
    title: "POWER YOUR IDEAS",
    offer: "LAPTOPS & DESKTOPS",
    description: "The right setup for work, creativity, and play.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Laptop open on a desk in a softly lit room",
    imagePosition: "center 55%",
  },
  {
    eyebrow: "ACCESSORIES",
    title: "TIME, WELL SPENT",
    offer: "SMART WATCHES",
    description: "Thoughtful tech and accessories for every day.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Minimal wristwatch photographed on a dark surface",
    imagePosition: "center 52%",
  },
];

export default function StorefrontHome() {
  const [active, setActive] = useState(0);
  const featured = collections[active];
  const sideCollections = [1, 2, 3].map((offset) => collections[(active + offset) % collections.length]);
  const move = (direction: number) => setActive((current) => (current + direction + collections.length) % collections.length);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % collections.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section id="featured-collections" aria-label="Featured collections" className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(280px,0.98fr)]">
        <article className="group relative min-h-[480px] overflow-hidden rounded-2xl bg-slate-900 sm:min-h-[560px] lg:h-[min(70vh,720px)]">
          <img key={featured.image} src={featured.image} alt={featured.imageAlt} fetchPriority="high" className="hero-image-enter absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" style={{ objectPosition: featured.imagePosition }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          <div className="absolute inset-0 flex items-center px-6 py-12 sm:px-10 lg:px-14">
            <div key={featured.eyebrow} className="hero-copy-enter max-w-xl text-white">
              <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide sm:text-base"><Sparkles className="size-4 text-amber-300" />{featured.eyebrow}</span>
              <p className="mt-5 text-sm font-medium text-white/75 sm:text-base">Special offers</p>
              <h1 className="mt-1 text-4xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">{featured.title}</h1>
              <p className="mt-4 text-xl font-semibold sm:text-2xl">{featured.offer}</p>
              <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{featured.description}</p>
              <Link href="/product" className="mt-7 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300">Shop Now</Link>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 flex items-center gap-2 sm:bottom-6 sm:left-7" aria-label="Choose featured collection">
            {collections.map((item, index) => <button key={item.eyebrow} type="button" aria-label={`Show ${item.eyebrow.toLowerCase()} collection`} aria-current={active === index ? "true" : undefined} onClick={() => setActive(index)} className={`size-2.5 rounded-full border border-white transition ${active === index ? "bg-white" : "bg-white/35 hover:bg-white/75"}`} />)}
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-6 sm:right-6">
            <button type="button" aria-label="Previous collection" onClick={() => move(-1)} className="flex size-11 items-center justify-center rounded-lg bg-white/90 text-slate-900 shadow transition hover:bg-white"><ArrowLeft className="size-4" /></button>
            <button type="button" aria-label="Next collection" onClick={() => move(1)} className="flex size-11 items-center justify-center rounded-lg bg-white/90 text-slate-900 shadow transition hover:bg-white"><ArrowRight className="size-4" /></button>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
          {sideCollections.map((item, index) => <article key={`${item.eyebrow}-${active}`} className="hero-tile-enter group relative min-h-48 overflow-hidden rounded-2xl bg-slate-900 sm:min-h-56 lg:min-h-0" style={{ animationDelay: `${index * 120}ms` }}>
            <img src={item.image} alt={item.imageAlt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: item.imagePosition }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
            <div className="absolute inset-0 flex flex-col items-start justify-center p-5 text-white sm:p-6">
              <p className="text-xs font-semibold tracking-wide sm:text-sm">{index === 0 ? "NEW ARRIVALS" : item.eyebrow}</p>
              <h2 className="mt-1 max-w-[15rem] text-xl font-bold uppercase leading-tight sm:text-2xl">{item.title}</h2>
              <p className="mt-1 text-sm font-medium text-white/90">{item.offer}</p>
              <Link href="/product" className="mt-4 inline-flex h-10 items-center rounded-lg border border-white/50 bg-white/15 px-5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-900">Shop Now</Link>
            </div>
          </article>)}
        </div>
      </section>
      <StorefrontCatalog />

      <section className="border-y border-slate-100 bg-white px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1490px] grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
          {[
            { icon: Truck, title: "Delivery options", detail: "Choose delivery that works for you" },
            { icon: ShieldCheck, title: "Shop with confidence", detail: "Clear product and order details" },
            { icon: PackageCheck, title: "Easy order review", detail: "Check your cart before checkout" },
            { icon: Headphones, title: "Here to help", detail: "Reach out whenever you need us" },
          ].map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#ae8e2b]"><Icon className="size-5" /></span>
            <span><span className="block text-xs font-semibold text-slate-900 sm:text-sm">{title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500 sm:text-xs">{detail}</span></span>
          </div>)}
        </div>
      </section>

      <section className="bg-[#f7f8fa] px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ae8e2b]">A simpler way to shop</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everything you need, all in one place</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Explore useful technology, compare product details, and keep your selections together while you browse.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, number: "01", title: "Find your next favorite", detail: "Browse categories or search the catalog to find the products you are looking for." },
              { icon: ShoppingCart, number: "02", title: "Build your cart", detail: "Add products, adjust quantities, and review your total from the header cart." },
              { icon: BadgeCheck, number: "03", title: "Review before checkout", detail: "See every selected item and its price together on the checkout review page." },
            ].map(({ icon: Icon, number, title, detail }) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-xl bg-[#f4f0dd] text-[#9d7f1e]"><Icon className="size-5" /></span><span className="text-sm font-semibold tracking-widest text-slate-300">{number}</span></div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 rounded-3xl bg-[#20282b] px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.3fr_0.7fr] lg:px-14 lg:py-14">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9bd5f]">Ready when you are</p><h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Find something you’ll love today.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Explore the latest products and discover useful picks for work, home, and everyday life.</p></div>
          <div className="flex flex-wrap gap-3 lg:justify-end"><Link href="/product" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#c7a331] px-6 text-sm font-semibold text-white transition hover:bg-[#ad8d20]">Browse products <ArrowRight className="ml-2 size-4" /></Link><a href="#featured-collections" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white/10">Back to top</a></div>
        </div>
      </section>
    </main>
  );
}
