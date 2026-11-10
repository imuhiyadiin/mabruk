"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, Minus, Plus, Search, ShoppingCart, UserRound } from "lucide-react";
import { clearStoreCart, getStoreCart, removeStoreCartItem, setStoreCartQuantity, storeCartEventName, type StoreCartItem } from "@/lib/store-cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLink,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserData = {
  email: string;
  fullName?: string;
  fullname?: string;
  role?: string;
};

type StoreProduct = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  description?: string | null;
  category?: { name?: string } | null;
};
type ProductsPayload = { result?: StoreProduct[] };
type StoreCategory = { id: string; name: string };
type CategoriesPayload = { result?: StoreCategory[] };
const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

const navigation: { label: string; href: string; hasMenu?: boolean }[] = [
  { label: "HOME", href: "/" },
  { label: "PRODUCT", href: "/product" },
  { label: "CATEGORIES", href: "/", hasMenu: true },
];

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 42 30"
      className="h-7 w-10 shrink-0"
      fill="none"
    >
      <path d="M2 27V3L13 16 22 3 31 16 40 3V27L31 17 22 28 13 17 2 27Z" fill="#C7A331" />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartItems, setCartItems] = useState<StoreCartItem[]>([]);

  useEffect(() => {
    const syncCart = () => setCartItems(getStoreCart());
    syncCart();
    window.addEventListener(storeCartEventName, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(storeCartEventName, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase}/product`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || !(response.headers.get("content-type") ?? "").includes("application/json")) return null;
        return response.json() as Promise<ProductsPayload>;
      })
      .then((payload) => { if (!cancelled && Array.isArray(payload?.result)) setProducts(payload.result); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase}/category`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || !(response.headers.get("content-type") ?? "").includes("application/json")) return null;
        return response.json() as Promise<CategoriesPayload>;
      })
      .then((payload) => { if (!cancelled && Array.isArray(payload?.result)) setCategories(payload.result); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function syncUser() {
      const storedUser = window.localStorage.getItem("user-data");

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser) as UserData);
      } catch {
        window.localStorage.removeItem("user-data");
        setUser(null);
      }
    }

    syncUser();
    window.addEventListener("auth-change", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("auth-change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("user-data");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/auth/singin");
  }

  const displayName = user?.fullName ?? user?.fullname ?? user?.email.split("@")[0];
  const userInitial = displayName?.trim().charAt(0).toLocaleUpperCase() || "U";
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const matchingProducts = productSearch.trim()
    ? products.filter((product) => `${product.name} ${product.category?.name ?? ""}`.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 6)
    : [];
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  function selectCategory(categoryId: string) {
    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("store-category-select", { detail: categoryId }));
      window.setTimeout(() => document.getElementById("best-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    window.sessionStorage.setItem("storefront-category", categoryId);
    router.push("/#best-offers");
  }

  function openProduct(product: StoreProduct) {
    setSearchOpen(false);
    setProductSearch("");
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-[#e9e9e9] px-5 py-4">
      <div className="mx-auto flex min-h-12 max-w-[1440px] flex-wrap items-center justify-between gap-x-5 gap-y-2 bg-white px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandMark />
          <span className="leading-none">
            <span className="block text-[15px] font-bold tracking-tight text-[#252525]">
              MAB<span className="font-normal text-[#b9a13d]">RUK</span>
            </span>
            <span className="mt-1 hidden text-[7px] text-zinc-400 sm:block">
              We Always Try To Make A Difference
            </span>
          </span>
        </Link>

        <div className="relative order-3 min-w-36 flex-1 sm:order-none sm:w-[480px] sm:max-w-[480px] sm:flex-none">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-500 focus-within:border-[#c7a331]">
            <Search className="size-4 shrink-0" />
            <input type="search" value={productSearch} onFocus={() => setSearchOpen(true)} onChange={(event) => { setProductSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); if (event.key === "Enter" && matchingProducts[0]) openProduct(matchingProducts[0]); }} placeholder="Search products..." aria-label="Search products" aria-expanded={searchOpen && !!productSearch.trim()} aria-controls="product-search-results" className="w-full min-w-0 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400" />
          </label>
          {searchOpen && productSearch.trim() && <div id="product-search-results" role="listbox" className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
            {matchingProducts.length ? matchingProducts.map((product) => <button key={product.id} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => openProduct(product)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-zinc-50">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100">{product.imageUrl ? <img src={product.imageUrl} alt="" className="size-full object-cover" /> : <Search className="size-4 text-zinc-400" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-800">{product.name}</span><span className="mt-0.5 block truncate text-[10px] text-zinc-500">{product.category?.name ?? "Product"}</span></span>
              <span className="shrink-0 text-xs font-semibold text-[#a88a25]">${Number(product.price).toFixed(2)}</span>
            </button>) : <p className="px-3 py-3 text-xs text-zinc-500">No matching products found.</p>}
          </div>}
        </div>

        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-5 lg:gap-8">
          {navigation.map((item) => item.hasMenu ? (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 text-[10px] font-medium text-[#333] transition-colors hover:text-[#b9a13d] sm:text-[11px]">{item.label}<ChevronDown className="size-3" /></DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 rounded-lg border-slate-200 bg-white p-0 shadow-xl">
                <p className="px-4 py-3 text-sm font-semibold text-slate-800">Browse Categories</p>
                <DropdownMenuSeparator className="m-0" />
                {categories.length ? categories.map((category) => <DropdownMenuItem key={category.id} onClick={() => selectCategory(category.id)} className="rounded-none px-4 py-2.5 text-sm capitalize text-slate-700">{category.name}</DropdownMenuItem>) : <p className="px-4 py-3 text-xs text-slate-500">{"Loading categories..."}</p>}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link key={item.label} href={item.href} className="inline-flex items-center gap-1 text-[10px] font-medium text-[#333] transition-colors hover:text-[#b9a13d] sm:text-[11px]">{item.label}</Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`Shopping cart, ${cartCount} items`} className="relative inline-flex size-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-[#a88a25]"><ShoppingCart className="size-[17px]" /><span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#c7a331] text-[9px] font-semibold text-white">{cartCount}</span></DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={18} className="w-[440px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-0 shadow-xl">
              <div className="px-5 py-2.5"><p className="text-sm font-semibold text-zinc-900">Your cart ({cartCount})</p></div>
              <DropdownMenuSeparator className="m-0" />
              {cartItems.length ? <>
                <div className="max-h-80 overflow-y-auto px-1">
                  {cartItems.map((item) => <div key={item.productId} className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-b-0">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">{item.imageUrl && <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => setStoreCartQuantity(item.productId, item.quantity - 1)} className="flex size-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100"><Minus className="size-3.5" /></button>
                      <span className="w-5 text-center text-sm font-medium text-zinc-800">{item.quantity}</span>
                      <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => setStoreCartQuantity(item.productId, item.quantity + 1)} className="flex size-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100"><Plus className="size-3.5" /></button>
                    </div>
                    <button type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => removeStoreCartItem(item.productId)} className="rounded px-1 text-xs text-rose-600 hover:text-rose-700">Remove</button>
                  </div>)}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="flex items-center justify-between px-5 py-3"><span className="text-sm font-medium text-zinc-600">Total</span><span className="text-base font-semibold text-zinc-900">${cartTotal.toFixed(2)}</span></div>
                <div className="flex gap-2 px-3 pb-3">
                  <Link href="/checkout" className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#c7a331] text-sm font-semibold text-white transition hover:bg-[#ad8d20]">Checkout</Link>
                  <button type="button" onClick={clearStoreCart} className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-rose-600 transition hover:border-rose-200 hover:bg-rose-50">Clear</button>
                </div>
              </> : <p className="px-5 py-5 text-sm text-zinc-500">Your shopping cart is empty.</p>}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Open menu for ${displayName}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#c7a331] text-sm font-semibold text-white transition-colors hover:bg-[#ad8d20]"
              >
                {userInitial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={24} className="w-60 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-zinc-900">{displayName}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuLink href="/dashbordmain">Dashboard</DropdownMenuLink>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuLink href="/profile" className="gap-2">
                  <UserRound size={15} /> Profile
                </DropdownMenuLink>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 data-[highlighted]:text-red-700">
                  <LogOut size={15} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/singin"
              className="inline-flex items-center rounded bg-[#c7a331] px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#ad8d20]"
            >
              SIGN IN
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
